from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.database import get_db
from backend.services.evidence_service import create_evidence, generate_pdf, get_evidence
from fastapi.responses import Response
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

router = APIRouter(prefix="/fraud", tags=["fraud"])

_rings_cache = None


def _get_rings():
    global _rings_cache
    if _rings_cache is None:
        from ml.fraud.graph_engine import detect_rings
        _rings_cache = detect_rings()
    return _rings_cache


@router.get("/rings")
async def list_rings():
    rings = _get_rings()
    return {
        "total": len(rings),
        "rings": [
            {
                "ring_id": r.ring_id,
                "severity": r.severity,
                "member_count": r.member_count,
                "victim_count": r.victim_count,
                "total_exposure_inr": r.total_exposure_inr,
                "lead_time_days": r.lead_time_days,
                "confidence": r.confidence,
            }
            for r in rings
        ],
    }


@router.get("/rings/{ring_id}")
async def ring_detail(ring_id: str):
    rings = _get_rings()
    ring = next((r for r in rings if r.ring_id == ring_id), None)
    if not ring:
        raise HTTPException(404, "Ring not found")
    return {
        "ring_id": ring.ring_id,
        "severity": ring.severity,
        "member_count": ring.member_count,
        "victim_count": ring.victim_count,
        "total_exposure_inr": ring.total_exposure_inr,
        "lead_time_days": ring.lead_time_days,
        "confidence": ring.confidence,
        "nodes": [
            {
                "id": n.id,
                "node_type": n.node_type,
                "label": n.label,
                "role": n.role,
                "degree": n.degree,
                "risk_score": n.risk_score,
            }
            for n in ring.nodes
        ],
        "edges": ring.edges,
        "chain_of_custody": ring.chain_of_custody,
    }


@router.post("/rings/{ring_id}/evidence")
async def generate_evidence(ring_id: str, db: AsyncSession = Depends(get_db)):
    rings = _get_rings()
    ring = next((r for r in rings if r.ring_id == ring_id), None)
    if not ring:
        raise HTTPException(404)
    ev = await create_evidence(
        db=db,
        module="fraud",
        verdict=ring.severity,
        confidence=ring.confidence,
        decision_trace=ring.decision_trace,
        content_payload=ring.chain_of_custody,
        metadata={"ring_id": ring_id, "member_count": ring.member_count, "victim_count": ring.victim_count},
    )
    return {"evidence_id": ev.id, "case_id": ev.case_id}


@router.get("/evidence/{evidence_id}/pdf")
async def download_pdf(evidence_id: str, db: AsyncSession = Depends(get_db)):
    ev = await get_evidence(db, evidence_id)
    if not ev:
        raise HTTPException(404)
    return Response(content=generate_pdf(ev), media_type="application/pdf",
                    headers={"Content-Disposition": f"attachment; filename=prahari-{ev.case_id}.pdf"})


@router.get("/graph-data")
async def graph_data():
    rings = _get_rings()
    nodes, links = [], []
    seen_nodes = set()
    for ring in rings:
        colour = {"CRITICAL": "#E5484D", "HIGH": "#F5A623", "MEDIUM": "#3E63DD", "LOW": "#30A46C"}.get(ring.severity, "#888")
        for n in ring.nodes:
            if n.id not in seen_nodes:
                seen_nodes.add(n.id)
                nodes.append({"id": n.id, "label": n.label, "type": n.node_type, "role": n.role,
                               "ring_id": ring.ring_id, "colour": colour, "risk": n.risk_score})
        for e in ring.edges:
            links.append({"source": e["source"], "target": e["target"], "weight": e.get("weight", 0)})
    return {"nodes": nodes, "links": links}


@router.get("/stats")
async def fraud_stats():
    rings = _get_rings()
    total_victims = sum(r.victim_count for r in rings)
    total_exposure = sum(r.total_exposure_inr for r in rings)
    return {"rings_detected": len(rings), "total_victims": total_victims, "total_exposure_inr": total_exposure}
