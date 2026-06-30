from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.database import get_db
from backend.services.evidence_service import list_evidence, get_evidence, generate_pdf
from typing import Optional

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.get("/")
async def list_all_evidence(
    module: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    total, records = await list_evidence(db, module=module, limit=limit, offset=offset)
    return {
        "total": total,
        "records": [
            {
                "id": r.id,
                "case_id": r.case_id,
                "source_module": r.source_module,
                "timestamp": r.timestamp.isoformat(),
                "content_hash": r.content_hash,
                "engine_version": r.engine_version,
                "verdict": r.verdict,
                "confidence": r.confidence,
                "decision_trace": r.decision_trace,
                "metadata": r.metadata_,
            }
            for r in records
        ],
    }


@router.get("/{evidence_id}")
async def get_one(evidence_id: str, db: AsyncSession = Depends(get_db)):
    ev = await get_evidence(db, evidence_id)
    if not ev:
        raise HTTPException(404, "Evidence record not found")
    return {
        "id": ev.id,
        "case_id": ev.case_id,
        "source_module": ev.source_module,
        "timestamp": ev.timestamp.isoformat(),
        "content_hash": ev.content_hash,
        "engine_version": ev.engine_version,
        "verdict": ev.verdict,
        "confidence": ev.confidence,
        "decision_trace": ev.decision_trace,
        "metadata": ev.metadata_,
    }


@router.get("/{evidence_id}/pdf")
async def pdf(evidence_id: str, db: AsyncSession = Depends(get_db)):
    ev = await get_evidence(db, evidence_id)
    if not ev:
        raise HTTPException(404)
    return Response(
        content=generate_pdf(ev),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=prahari-{ev.case_id}.pdf"},
    )
