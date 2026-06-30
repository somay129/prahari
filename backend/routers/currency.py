import io
import base64
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.database import get_db
from backend.db.models import CurrencyVerification
from backend.services.evidence_service import create_evidence, generate_pdf, get_evidence
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

router = APIRouter(prefix="/currency", tags=["currency"])

VALID_DENOMINATIONS = ["100", "200", "500", "2000"]


class VerifyResponse(BaseModel):
    verification_id: str
    denomination: str
    verdict: str
    overall_confidence: float
    features: list[dict]
    annotated_image_b64: str
    image_hash: str
    engine_version: str


@router.post("/verify", response_model=VerifyResponse)
async def verify_currency(
    file: UploadFile = File(...),
    denomination: str = Form("500"),
    db: AsyncSession = Depends(get_db),
):
    if denomination not in VALID_DENOMINATIONS:
        raise HTTPException(400, f"Invalid denomination. Choose from {VALID_DENOMINATIONS}")
    img_bytes = await file.read()
    if len(img_bytes) > 20 * 1024 * 1024:
        raise HTTPException(413, "Image too large (max 20MB)")
    try:
        from ml.counterfeit.pipeline import verify_currency as _verify
        result = _verify(img_bytes, denomination)
    except Exception as e:
        raise HTTPException(500, f"Verification error: {e}")
    rec = CurrencyVerification(
        denomination=denomination,
        verdict=result.verdict,
        confidence=result.overall_confidence,
        feature_results={f.name: {"passed": f.passed, "confidence": f.confidence, "detail": f.detail} for f in result.features},
        image_hash=result.image_hash,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return VerifyResponse(
        verification_id=rec.id,
        denomination=denomination,
        verdict=result.verdict,
        overall_confidence=result.overall_confidence,
        features=[
            {
                "name": f.name,
                "display_name": f.display_name,
                "passed": f.passed,
                "confidence": round(f.confidence, 4),
                "detail": f.detail,
                "region_bbox": f.region_bbox,
            }
            for f in result.features
        ],
        annotated_image_b64=result.annotated_image_b64,
        image_hash=result.image_hash,
        engine_version=result.engine_version,
    )


@router.post("/verify/{verification_id}/evidence")
async def generate_evidence(verification_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    ver = (await db.execute(
        select(CurrencyVerification).where(CurrencyVerification.id == verification_id)
    )).scalar_one_or_none()
    if not ver:
        raise HTTPException(404, "Verification record not found")
    ev = await create_evidence(
        db=db,
        module="currency",
        verdict=ver.verdict,
        confidence=ver.confidence,
        decision_trace=ver.feature_results,
        content_payload={"image_hash": ver.image_hash, "denomination": ver.denomination},
        metadata={"verification_id": verification_id, "denomination": ver.denomination},
    )
    ver.evidence_id = ev.id
    await db.commit()
    return {"evidence_id": ev.id, "case_id": ev.case_id}


@router.get("/evidence/{evidence_id}/pdf")
async def download_pdf(evidence_id: str, db: AsyncSession = Depends(get_db)):
    ev = await get_evidence(db, evidence_id)
    if not ev:
        raise HTTPException(404)
    pdf_bytes = generate_pdf(ev)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=prahari-{ev.case_id}.pdf"},
    )


@router.get("/stats")
async def currency_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, func
    total = (await db.execute(select(func.count()).select_from(CurrencyVerification))).scalar_one()
    genuine = (await db.execute(
        select(func.count()).select_from(CurrencyVerification).where(CurrencyVerification.verdict == "GENUINE")
    )).scalar_one()
    return {"total_verified": total, "genuine": genuine, "flagged": total - genuine}
