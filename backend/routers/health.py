from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "PRAHARI Detection Engine",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "data_notice": "DEMO DATA — synthetic, for evaluation only",
    }
