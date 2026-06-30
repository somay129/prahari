"""
Generates synthetic labelled scam/legitimate transcripts for classifier training.
"""

import json
import random
from pathlib import Path

OUT_PATH = Path(__file__).parent.parent / "synthetic" / "transcripts" / "labelled.json"

SCAM_TEMPLATES = [
    "This is officer {name} from CBI. You have a case registered against you for money laundering. You need to pay {amount} rupees immediately to avoid arrest. Do not tell anyone about this call.",
    "Calling from Enforcement Directorate. Your bank account has been flagged for illegal transactions. You must transfer {amount} to this secure account within 2 hours or you will be arrested.",
    "This is TRAI cyber crime cell. Your SIM is being used for fraudulent activities. Stay on the video call and do not hang up. Send {amount} via UPI for account verification.",
    "I am from the Income Tax Department. We have found discrepancies in your returns. You must pay {amount} as penalty immediately. Share your Aadhaar and PAN card details to proceed.",
    "This is the customs department. A parcel in your name contains contraband. You will be detained unless you transfer {amount} for clearance. Keep this call confidential.",
    "CBI officer speaking. An FIR has been registered in your name. You are under digital arrest. Do not leave your home. Pay {amount} via NEFT to settle this case urgently.",
    "Your Aadhaar card has been misused by criminals. Enforcement Directorate has issued a warrant. Transfer {amount} to our safe account to protect your identity immediately.",
    "High court has issued a notice against you. Police will arrive at your address unless you pay {amount} right now. This is your last chance. Don't tell anyone.",
    "You have won a government lottery worth {amount}. To claim, share your bank account number, OTP and PAN card. This offer expires in 30 minutes.",
    "This is NIA headquarters. Your phone is being monitored for terrorist communication. You must stay on camera and transfer {amount} for security clearance.",
    "Customs has seized a parcel with your name containing illegal items. Pay {amount} immediately or face criminal charges. Time is running out.",
    "I am a senior officer from CID. A criminal is using your identity. You must hand over your account access and pay {amount} to secure your profile.",
    "Your bank account will be frozen due to suspicious transactions. Transfer {amount} to avoid freezing. Share your account number and CVV for verification.",
    "Supreme court directive requires you to pay outstanding dues of {amount}. Failure to comply will result in imprisonment. Call back within one hour.",
    "This is the Cybercrime Cell. Your IP address was flagged for illegal downloads. Pay {amount} as settlement or face a jail term of 3 years.",
]

LEGIT_TEMPLATES = [
    "Hi, this is customer care from {bank}. Your account ending {last4} had a recent transaction. Please confirm if it was you.",
    "Calling from {brand} service team. Your appointment is scheduled for tomorrow at 3 PM. Please call back to confirm.",
    "This is a reminder about your EMI payment due on the 5th. Please ensure funds are available. Thank you.",
    "Hello, I'm calling from the survey team. We'd like to take 2 minutes of your time for feedback about our service.",
    "Your OTP for login is {otp}. Please do not share this with anyone. This is valid for 10 minutes.",
    "This is {bank} bank. We are calling to inform you about our new savings account offer with 7.5% interest.",
    "Your order {order_id} has been shipped and will arrive in 2-3 business days.",
    "Reminder: Your vehicle insurance is due for renewal next month. Our agent can assist you.",
    "This is the hospital appointment desk. Your check-up is confirmed for Saturday morning.",
    "Hello, your electricity bill payment of {amount} was successful. Reference number {ref}.",
    "We are calling to update your KYC records at {bank}. Please visit the nearest branch with your documents.",
    "Your loan application has been processed. Please check your email for details.",
    "Thank you for using our services. Your feedback helps us improve. How was your recent experience?",
    "This is a recorded message from BSNL. Your broadband connection has been upgraded successfully.",
    "Your mutual fund SIP of {amount} has been processed for this month.",
]

NAMES = ["Sharma", "Verma", "Singh", "Kumar", "Gupta", "Rao", "Patel", "Joshi"]
BANKS = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB"]
BRANDS = ["Amazon", "Flipkart", "Zomato", "Swiggy", "BigBasket"]


def _fill(template: str) -> str:
    return template.format(
        name=random.choice(NAMES),
        amount=f"{random.randint(5, 50) * 10000:,}",
        bank=random.choice(BANKS),
        brand=random.choice(BRANDS),
        last4=f"{random.randint(1000,9999)}",
        otp=f"{random.randint(100000,999999)}",
        order_id=f"ORD{random.randint(100000,999999)}",
        ref=f"REF{random.randint(100000,999999)}",
    )


def seed_transcripts(n_scam: int = 400, n_legit: int = 400):
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    records = []
    for _ in range(n_scam):
        t = random.choice(SCAM_TEMPLATES)
        records.append({"text": _fill(t), "label": 1})
    for _ in range(n_legit):
        t = random.choice(LEGIT_TEMPLATES)
        records.append({"text": _fill(t), "label": 0})
    random.shuffle(records)
    with open(OUT_PATH, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Transcripts: {len(records)} samples -> {OUT_PATH}")


if __name__ == "__main__":
    seed_transcripts()
