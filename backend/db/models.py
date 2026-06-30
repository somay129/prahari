import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, Text, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from backend.db.database import Base


def _uuid():
    return str(uuid.uuid4())[:8].upper()


class EvidenceRecord(Base):
    __tablename__ = "evidence_records"

    id: Mapped[str] = mapped_column(String(8), primary_key=True, default=_uuid)
    case_id: Mapped[str] = mapped_column(String(20), nullable=False)
    source_module: Mapped[str] = mapped_column(String(32), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    engine_version: Mapped[str] = mapped_column(String(16), nullable=False, default="1.0.0")
    verdict: Mapped[str] = mapped_column(String(32), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    decision_trace: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    pdf_path: Mapped[str | None] = mapped_column(String(256), nullable=True)


class CurrencyVerification(Base):
    __tablename__ = "currency_verifications"

    id: Mapped[str] = mapped_column(String(8), primary_key=True, default=_uuid)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    denomination: Mapped[str] = mapped_column(String(8), nullable=False)
    verdict: Mapped[str] = mapped_column(String(32), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    feature_results: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    image_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    evidence_id: Mapped[str | None] = mapped_column(String(8), nullable=True)


class ScamSession(Base):
    __tablename__ = "scam_sessions"

    id: Mapped[str] = mapped_column(String(8), primary_key=True, default=_uuid)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    verdict: Mapped[str] = mapped_column(String(32), nullable=False)
    matched_patterns: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    transcript_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_id: Mapped[str | None] = mapped_column(String(8), nullable=True)


class FraudRing(Base):
    __tablename__ = "fraud_rings"

    id: Mapped[str] = mapped_column(String(8), primary_key=True, default=_uuid)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ring_id: Mapped[str] = mapped_column(String(20), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    member_count: Mapped[int] = mapped_column(Integer, nullable=False)
    victim_count: Mapped[int] = mapped_column(Integer, nullable=False)
    total_exposure: Mapped[float] = mapped_column(Float, nullable=False)
    lead_time_days: Mapped[float] = mapped_column(Float, nullable=False)
    ring_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    evidence_id: Mapped[str | None] = mapped_column(String(8), nullable=True)


class CitizenCheck(Base):
    __tablename__ = "citizen_checks"

    id: Mapped[str] = mapped_column(String(8), primary_key=True, default=_uuid)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    check_type: Mapped[str] = mapped_column(String(32), nullable=False)
    verdict: Mapped[str] = mapped_column(String(16), nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    reasons: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
