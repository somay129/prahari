import json
from pathlib import Path
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/map", tags=["map"])

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "synthetic" / "geo" / "complaints.json"

_complaints_cache = None


def _load():
    global _complaints_cache
    if _complaints_cache is None:
        if DATA_PATH.exists():
            with open(DATA_PATH) as f:
                _complaints_cache = json.load(f)
        else:
            _complaints_cache = []
    return _complaints_cache


PATROL_SCORES = {
    "CRITICAL": 1.0,
    "HIGH": 0.75,
    "MEDIUM": 0.50,
    "LOW": 0.25,
}


@router.get("/complaints")
async def get_complaints(
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    limit: int = Query(500, le=1000),
):
    data = _load()
    filtered = data
    if category:
        filtered = [d for d in filtered if d["category"] == category]
    if severity:
        filtered = [d for d in filtered if d["severity"] == severity]
    if city:
        filtered = [d for d in filtered if d["city"].lower() == city.lower()]
    return {"total": len(filtered), "points": filtered[:limit]}


@router.get("/hotspots")
async def get_hotspots():
    data = _load()
    from collections import defaultdict
    city_stats: dict = defaultdict(lambda: {"count": 0, "total_amount": 0, "categories": defaultdict(int), "patrol_score": 0.0})
    for d in data:
        city = d["city"]
        city_stats[city]["count"] += 1
        city_stats[city]["total_amount"] += d.get("amount_inr", 0)
        city_stats[city]["categories"][d["category"]] += 1
        city_stats[city]["patrol_score"] = max(city_stats[city]["patrol_score"], PATROL_SCORES.get(d["severity"], 0.25))

    hotspots = []
    city_coords = {
        "Mumbai": (19.0760, 72.8777), "Delhi": (28.6139, 77.2090),
        "Bangalore": (12.9716, 77.5946), "Hyderabad": (17.3850, 78.4867),
        "Chennai": (13.0827, 80.2707), "Kolkata": (22.5726, 88.3639),
        "Pune": (18.5204, 73.8567), "Ahmedabad": (23.0225, 72.5714),
        "Jaipur": (26.9124, 75.7873), "Lucknow": (26.8467, 80.9462),
        "Surat": (21.1702, 72.8311), "Nagpur": (21.1458, 79.0882),
        "Indore": (22.7196, 75.8577), "Patna": (25.5941, 85.1376),
        "Bhopal": (23.2599, 77.4126),
    }
    for city, stats in city_stats.items():
        coords = city_coords.get(city, (20.5937, 78.9629))
        hotspots.append({
            "city": city,
            "lat": coords[0],
            "lng": coords[1],
            "count": stats["count"],
            "total_amount_inr": stats["total_amount"],
            "patrol_score": round(stats["patrol_score"], 2),
            "top_category": max(stats["categories"], key=stats["categories"].get) if stats["categories"] else "unknown",
        })
    hotspots.sort(key=lambda h: h["count"], reverse=True)
    return {"hotspots": hotspots}


@router.get("/categories")
async def get_categories():
    return {
        "categories": [
            {"key": "digital_arrest", "label": "Digital Arrest", "colour": "#E5484D"},
            {"key": "counterfeit_seizure", "label": "Counterfeit Seizure", "colour": "#F5A623"},
            {"key": "mule_account", "label": "Mule Account", "colour": "#3E63DD"},
            {"key": "phishing", "label": "Phishing", "colour": "#9B59B6"},
            {"key": "investment_fraud", "label": "Investment Fraud", "colour": "#30A46C"},
        ]
    }
