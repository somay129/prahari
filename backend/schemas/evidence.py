from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any


class EvidenceOut(BaseModel):
    id: str
    case_id: str
    source_module: str
    timestamp: datetime
    content_hash: str
    engine_version: str
    verdict: str
    confidence: float
    decision_trace: dict[str, Any]
    metadata_: dict[str, Any] = Field(alias="metadata")

    model_config = {"from_attributes": True, "populate_by_name": True}


class EvidenceListResponse(BaseModel):
    total: int
    records: list[EvidenceOut]
