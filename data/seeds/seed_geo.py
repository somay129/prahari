"""
Generates synthetic geospatial crime complaint and seizure data.
"""

import json
import uuid
import random
from datetime import datetime, timedelta
from pathlib import Path

OUT_PATH = Path(__file__).parent.parent / "synthetic" / "geo" / "complaints.json"

CITY_CENTRES = {
    "Mumbai":    (19.0760, 72.8777),
    "Delhi":     (28.6139, 77.2090),
    "Bangalore": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
    "Chennai":   (13.0827, 80.2707),
    "Kolkata":   (22.5726, 88.3639),
    "Pune":      (18.5204, 73.8567),
    "Ahmedabad": (23.0225, 72.5714),
    "Jaipur":    (26.9124, 75.7873),
    "Lucknow":   (26.8467, 80.9462),
    "Surat":     (21.1702, 72.8311),
    "Nagpur":    (21.1458, 79.0882),
    "Indore":    (22.7196, 75.8577),
    "Patna":     (25.5941, 85.1376),
    "Bhopal":    (23.2599, 77.4126),
}

CATEGORIES = ["digital_arrest", "counterfeit_seizure", "mule_account", "phishing", "investment_fraud"]
SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def _jitter(lat, lng, spread=0.15):
    return lat + random.gauss(0, spread), lng + random.gauss(0, spread)


def _dt(days_ago):
    return (datetime.utcnow() - timedelta(days=days_ago)).isoformat()


def seed_geo_data(n=500):
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    records = []
    cities = list(CITY_CENTRES.items())
    for i in range(n):
        city_name, (base_lat, base_lng) = random.choice(cities)
        lat, lng = _jitter(base_lat, base_lng)
        cat = random.choices(
            CATEGORIES,
            weights=[0.35, 0.20, 0.20, 0.15, 0.10],
        )[0]
        sev = random.choices(SEVERITIES, weights=[0.30, 0.35, 0.25, 0.10])[0]
        records.append({
            "id": f"CPL-{str(uuid.uuid4())[:6].upper()}",
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "city": city_name,
            "category": cat,
            "severity": sev,
            "amount_inr": random.randint(5000, 2000000) if cat != "counterfeit_seizure" else 0,
            "notes_seized": random.randint(1, 200) if cat == "counterfeit_seizure" else 0,
            "timestamp": _dt(random.randint(0, 180)),
            "patrol_score": round(random.uniform(0.1, 1.0), 2),
        })
    with open(OUT_PATH, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Geo: {len(records)} complaint points -> {OUT_PATH}")


if __name__ == "__main__":
    seed_geo_data()
