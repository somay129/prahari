from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.database import get_db
from backend.db.models import ScamSession
from backend.services.evidence_service import create_evidence, generate_pdf, get_evidence
from fastapi.responses import Response
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

router = APIRouter(prefix="/scam", tags=["scam"])


class AnalyseRequest(BaseModel):
    transcript: str
    session_label: str = "Unknown"


class AnalyseResponse(BaseModel):
    session_id: str
    risk_score: float
    risk_level: str
    verdict: str
    recommended_action: str
    matched_patterns: list[dict]
    engine_version: str


class LineRequest(BaseModel):
    line: str
    previous_score: float = 0.0


@router.post("/analyse", response_model=AnalyseResponse)
async def analyse_transcript(req: AnalyseRequest, db: AsyncSession = Depends(get_db)):
    from ml.scam.classifier import classify
    result = classify(req.transcript)
    rec = ScamSession(
        risk_score=result.risk_score,
        verdict=result.verdict,
        matched_patterns=[{"tag": m.tag, "label": m.label, "severity": m.severity} for m in result.matched_patterns],
        transcript_hash=result.transcript_hash,
        recommended_action=result.recommended_action,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return AnalyseResponse(
        session_id=rec.id,
        risk_score=result.risk_score,
        risk_level=result.risk_level,
        verdict=result.verdict,
        recommended_action=result.recommended_action,
        matched_patterns=[
            {"tag": m.tag, "label": m.label, "severity": m.severity, "matched_text": m.matched_text}
            for m in result.matched_patterns
        ],
        engine_version=result.engine_version,
    )


@router.post("/analyse-line")
async def analyse_line(req: LineRequest):
    from ml.scam.classifier import classify_line
    result = classify_line(req.line, req.previous_score)
    return {
        "risk_score": result.risk_score,
        "risk_level": result.risk_level,
        "matched_patterns": [
            {"tag": m.tag, "label": m.label, "severity": m.severity}
            for m in result.matched_patterns
        ],
    }


@router.post("/sessions/{session_id}/evidence")
async def generate_evidence(session_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    s = (await db.execute(select(ScamSession).where(ScamSession.id == session_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(404)
    ev = await create_evidence(
        db=db,
        module="scam",
        verdict=s.verdict,
        confidence=s.risk_score / 100,
        decision_trace={"matched_patterns": s.matched_patterns, "risk_score": s.risk_score},
        content_payload={"transcript_hash": s.transcript_hash},
        metadata={"session_id": session_id},
    )
    s.evidence_id = ev.id
    await db.commit()
    return {"evidence_id": ev.id, "case_id": ev.case_id}


@router.get("/evidence/{evidence_id}/pdf")
async def download_pdf(evidence_id: str, db: AsyncSession = Depends(get_db)):
    ev = await get_evidence(db, evidence_id)
    if not ev:
        raise HTTPException(404)
    pdf_bytes = generate_pdf(ev)
    return Response(content=pdf_bytes, media_type="application/pdf",
                    headers={"Content-Disposition": f"attachment; filename=prahari-{ev.case_id}.pdf"})


@router.get("/stats")
async def scam_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, func
    total = (await db.execute(select(func.count()).select_from(ScamSession))).scalar_one()
    critical = (await db.execute(
        select(func.count()).select_from(ScamSession).where(ScamSession.risk_score >= 75)
    )).scalar_one()
    return {"total_sessions": total, "critical": critical, "safe": total - critical}
