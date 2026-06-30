"""
Rule-based pattern matchers for scam signal detection.
Each pattern returns a tag name and a match weight.
"""

import re
from dataclasses import dataclass


@dataclass
class PatternMatch:
    tag: str
    label: str
    severity: str  # LOW | MEDIUM | HIGH | CRITICAL
    weight: float
    matched_text: str


PATTERNS = [
    ("agency_impersonation", "Agency Impersonation", "CRITICAL", 0.30,
     r"\b(CBI|ED|customs|enforcement\s+directorate|income\s+tax|cybercrime\s+cell|police|CID|NIA|TRAI|RBI|SEBI)\b"),

    ("arrest_threat", "Digital Arrest Threat", "CRITICAL", 0.28,
     r"\b(arrest(ed)?|warrant|FIR|case\s+registered|criminal\s+charges|detained|custody)\b"),

    ("payment_demand", "Payment / Transfer Demand", "CRITICAL", 0.28,
     r"\b(pay(ment)?|transfer|send\s+money|deposit|UPI|NEFT|RTGS|wire\s+transfer|account\s+number|IBAN)\b"),

    ("secrecy_instruction", "Secrecy / Isolation Instruction", "HIGH", 0.22,
     r"\b(do\s+not\s+tell|don't\s+tell|keep\s+secret|don'?t\s+inform|stay\s+on\s+(the\s+)?call|don'?t\s+hang\s+up)\b"),

    ("urgency_pressure", "Urgency / Time Pressure", "HIGH", 0.18,
     r"\b(immediately|right\s+now|urgent|within\s+\d+\s+(hours?|minutes?)|deadline|last\s+chance|time\s+is\s+running)\b"),

    ("intimidation", "Intimidation / Threat", "HIGH", 0.20,
     r"\b(jail|prison|imprisonment|seized|frozen|blocked|suspended|cancelled)\b"),

    ("personal_data_request", "Personal Data Solicitation", "HIGH", 0.18,
     r"\b(aadhaar|PAN\s+card|passport|bank\s+account|OTP|CVV|PIN|password|login\s+id)\b"),

    ("false_authority", "False Authority Claim", "MEDIUM", 0.15,
     r"\b(supreme\s+court|high\s+court|government\s+directive|ministry|department\s+of)\b"),

    ("video_call_coercion", "Video Call Coercion", "MEDIUM", 0.14,
     r"\b(video\s+call|stay\s+on\s+camera|turn\s+(on|on\s+)?your\s+(camera|video)|face\s+verification)\b"),

    ("refund_lure", "Refund / Reward Lure", "MEDIUM", 0.12,
     r"\b(refund|cashback|reward|prize|lottery|won|selected|eligible\s+for)\b"),
]

_COMPILED = [(name, label, sev, w, re.compile(pat, re.IGNORECASE)) for name, label, sev, w, pat in PATTERNS]


def extract_patterns(text: str) -> list[PatternMatch]:
    matches = []
    for name, label, sev, weight, regex in _COMPILED:
        found = regex.search(text)
        if found:
            matches.append(PatternMatch(
                tag=name,
                label=label,
                severity=sev,
                weight=weight,
                matched_text=found.group(0),
            ))
    return matches


def pattern_risk_score(matches: list[PatternMatch]) -> float:
    if not matches:
        return 0.0
    raw = sum(m.weight for m in matches)
    return min(1.0, raw)
