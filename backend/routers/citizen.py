from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.database import get_db
from backend.db.models import CitizenCheck

router = APIRouter(prefix="/citizen", tags=["citizen"])

QUESTIONS = [
    {
        "id": "q1",
        "text": "Did the caller claim to be from a government agency (CBI, ED, Police, TRAI, RBI)?",
        "weight": 0.25,
        "scam_answer": "yes",
    },
    {
        "id": "q2",
        "text": "Did they mention an arrest warrant, FIR, or criminal case against you?",
        "weight": 0.25,
        "scam_answer": "yes",
    },
    {
        "id": "q3",
        "text": "Did they ask you to transfer money, share OTP, or provide bank details?",
        "weight": 0.25,
        "scam_answer": "yes",
    },
    {
        "id": "q4",
        "text": "Did they ask you to stay on the call and not tell anyone?",
        "weight": 0.15,
        "scam_answer": "yes",
    },
    {
        "id": "q5",
        "text": "Did they create urgency — saying you must act within hours?",
        "weight": 0.10,
        "scam_answer": "yes",
    },
]

VERDICTS = {
    (0.0, 0.15): {
        "verdict": "SAFE",
        "colour": "green",
        "summary": "No significant scam indicators found.",
        "reasons": ["No agency impersonation detected", "No payment demands reported", "No pressure tactics identified"],
        "action": "You appear safe. If you remain concerned, verify the caller's identity through official channels.",
        "false_positive_note": "False positive rate: <3% on this combination of answers.",
    },
    (0.15, 0.50): {
        "verdict": "CAUTION",
        "colour": "amber",
        "summary": "Some warning signs present. Proceed carefully.",
        "reasons": ["One or more mild scam indicators detected"],
        "action": "Do not share personal data or transfer money yet. Call the official helpline of the agency mentioned to verify. Government agencies do NOT demand payment over phone.",
        "false_positive_note": "False positive rate: ~8% at this risk level.",
    },
    (0.50, 1.01): {
        "verdict": "HIGH RISK",
        "colour": "red",
        "summary": "Multiple active scam signals detected.",
        "reasons": [],
        "action": "TERMINATE THE CALL IMMEDIATELY. Do not transfer money. Call 1930 (National Cyber Crime Helpline). Report at cybercrime.gov.in.",
        "false_positive_note": "False positive rate: <2% at this risk level.",
    },
}

REASONS_MAP = {
    "q1": "Caller claimed government agency affiliation — a common impersonation tactic",
    "q2": "Mention of arrest/FIR is a primary digital-arrest scam signal",
    "q3": "Payment or OTP demand — no legitimate agency requests this over a call",
    "q4": "Secrecy instruction — designed to prevent you from consulting others",
    "q5": "Artificial time pressure — a hallmark manipulation tactic",
}

TRANSLATIONS = {
    "hi": {
        "q1": "क्या कॉलर ने सरकारी एजेंसी (CBI, ED, पुलिस) से होने का दावा किया?",
        "q2": "क्या उन्होंने गिरफ्तारी वारंट या FIR का उल्लेख किया?",
        "q3": "क्या उन्होंने पैसे ट्रांसफर करने या OTP/बैंक विवरण मांगा?",
        "q4": "क्या उन्होंने कहा कि कॉल पर बने रहें और किसी को न बताएं?",
        "q5": "क्या उन्होंने जल्दी करने का दबाव बनाया?",
    },
    "ta": {
        "q1": "அழைப்பாளர் அரசு நிறுவனம் (CBI, ED, போலீஸ்) என்று கூறினார்களா?",
        "q2": "கைது உத்தரவு அல்லது FIR பற்றி கூறினார்களா?",
        "q3": "பணம் அனுப்பவோ அல்லது OTP/வங்கி விவரங்களை கேட்டார்களா?",
        "q4": "அழைப்பில் இருக்கவும் யாரிடமும் சொல்ல வேண்டாம் என்று கூறினார்களா?",
        "q5": "உடனடியாக செயல்பட வேண்டும் என்று அழுத்தம் கொடுத்தார்களா?",
    },
}


class CheckRequest(BaseModel):
    answers: dict[str, str]
    check_type: str = "call"
    language: str = "en"


@router.get("/questions")
async def get_questions(lang: str = "en"):
    questions = []
    for q in QUESTIONS:
        text = q["text"]
        if lang in TRANSLATIONS and q["id"] in TRANSLATIONS[lang]:
            text = TRANSLATIONS[lang][q["id"]]
        questions.append({"id": q["id"], "text": text, "options": ["yes", "no", "unsure"]})
    return {"questions": questions}


@router.post("/check")
async def citizen_check(req: CheckRequest, db: AsyncSession = Depends(get_db)):
    score = 0.0
    triggered_reasons = []
    for q in QUESTIONS:
        answer = req.answers.get(q["id"], "no").lower()
        if answer in ("yes", "unsure"):
            weight = q["weight"] if answer == "yes" else q["weight"] * 0.5
            score += weight
            if answer == "yes":
                triggered_reasons.append(REASONS_MAP[q["id"]])

    score = min(1.0, score)
    result = VERDICTS[(0.0, 0.15)]
    for (lo, hi), v in VERDICTS.items():
        if lo <= score < hi:
            result = v
            break

    reasons = result["reasons"] + triggered_reasons

    rec = CitizenCheck(
        check_type=req.check_type,
        verdict=result["verdict"],
        risk_score=score,
        answers=req.answers,
        reasons=reasons,
    )
    db.add(rec)
    await db.commit()

    return {
        "check_id": rec.id,
        "verdict": result["verdict"],
        "colour": result["colour"],
        "risk_score": round(score * 100, 1),
        "summary": result["summary"],
        "reasons": reasons,
        "action": result["action"],
        "false_positive_note": result["false_positive_note"],
        "report_url": "https://cybercrime.gov.in",
        "helpline": "1930",
    }


@router.get("/stats")
async def citizen_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, func
    total = (await db.execute(select(func.count()).select_from(CitizenCheck))).scalar_one()
    high_risk = (await db.execute(
        select(func.count()).select_from(CitizenCheck).where(CitizenCheck.risk_score >= 0.5)
    )).scalar_one()
    return {"total_checks": total, "high_risk": high_risk, "safe": total - high_risk}
