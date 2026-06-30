"""
Scam transcript classifier.
Uses TF-IDF + Gradient Boosting (fully local, no model downloads).
Loads a pre-trained model from ml/weights/scam_clf.joblib if present;
falls back to a lightweight rule-based scorer otherwise.
"""

import os
import hashlib
from pathlib import Path
from dataclasses import dataclass, field

from ml.scam.patterns import extract_patterns, pattern_risk_score, PatternMatch

WEIGHTS_PATH = Path(__file__).parent.parent / "weights" / "scam_clf.joblib"
ENGINE_VERSION = "SCM-1.0.0"

RISK_LABELS = {
    (0.0, 0.30): ("LOW RISK", "No significant scam indicators detected."),
    (0.30, 0.55): ("ELEVATED", "Some scam indicators present. Exercise caution."),
    (0.55, 0.75): ("HIGH RISK", "Multiple scam signals detected. Do not comply with demands."),
    (0.75, 1.01): ("CRITICAL", "Active scam session detected. Terminate call immediately."),
}

ACTIONS = {
    "LOW RISK": "Continue interaction with awareness. Report if more signals emerge.",
    "ELEVATED": "Request caller's official ID. Verify through official channels independently. Do not share personal data.",
    "HIGH RISK": "Do not transfer money or share OTP/PIN. Disconnect and call the official helpline (1930). File a report at cybercrime.gov.in.",
    "CRITICAL": "TERMINATE CALL IMMEDIATELY. Do not follow any instructions. Call 1930 (National Cyber Crime Helpline). Preserve call logs as evidence.",
}


@dataclass
class ScamResult:
    risk_score: float
    risk_level: str
    verdict: str
    recommended_action: str
    matched_patterns: list[PatternMatch] = field(default_factory=list)
    transcript_hash: str = ""
    engine_version: str = ENGINE_VERSION
    ml_score: float = 0.0
    pattern_score: float = 0.0
    decision_trace: dict = field(default_factory=dict)


_model = None


def _load_model():
    global _model
    if _model is not None:
        return _model
    if WEIGHTS_PATH.exists():
        import joblib
        _model = joblib.load(WEIGHTS_PATH)
    return _model


def _ml_score(text: str) -> float:
    model = _load_model()
    if model is None:
        return 0.0
    try:
        prob = model.predict_proba([text])[0][1]
        return float(prob)
    except Exception:
        return 0.0


def _transcript_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def classify(transcript: str) -> ScamResult:
    patterns = extract_patterns(transcript)
    p_score = pattern_risk_score(patterns)
    ml_s = _ml_score(transcript)
    model_available = _load_model() is not None
    if model_available:
        combined = 0.45 * ml_s + 0.55 * p_score
    else:
        combined = p_score
    combined = min(1.0, max(0.0, combined))
    risk_score_100 = round(combined * 100, 1)
    risk_level = "CRITICAL"
    desc = ""
    for (lo, hi), (label, d) in RISK_LABELS.items():
        if lo <= combined < hi:
            risk_level = label
            desc = d
            break
    verdict = f"{risk_level} — {desc}"
    action = ACTIONS.get(risk_level, "")
    trace = {
        "pattern_score": round(p_score, 4),
        "ml_score": round(ml_s, 4) if model_available else None,
        "model_available": model_available,
        "combined_score": round(combined, 4),
        "patterns_matched": [{"tag": m.tag, "severity": m.severity, "matched": m.matched_text} for m in patterns],
    }
    return ScamResult(
        risk_score=risk_score_100,
        risk_level=risk_level,
        verdict=verdict,
        recommended_action=action,
        matched_patterns=patterns,
        transcript_hash=_transcript_hash(transcript),
        engine_version=ENGINE_VERSION,
        ml_score=round(ml_s, 4),
        pattern_score=round(p_score, 4),
        decision_trace=trace,
    )


def classify_line(line: str, previous_score: float = 0.0) -> ScamResult:
    """Incremental classification for streaming replay."""
    result = classify(line)
    blended = max(result.risk_score, previous_score * 0.9)
    result.risk_score = round(min(100.0, blended), 1)
    return result
