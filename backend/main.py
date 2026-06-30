import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.db.database import init_db
from backend.routers import health, currency, scam, fraud, map_router, citizen, evidence, metrics


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    from data.seeds.seed_all import main as seed
    from pathlib import Path
    if not Path("data/synthetic/geo/complaints.json").exists():
        seed()
    yield


app = FastAPI(
    title="PRAHARI Detection Engine",
    description="Digital Public Safety Intelligence Platform — DEMO DATA",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(currency.router, prefix="/api")
app.include_router(scam.router, prefix="/api")
app.include_router(fraud.router, prefix="/api")
app.include_router(map_router.router, prefix="/api")
app.include_router(citizen.router, prefix="/api")
app.include_router(evidence.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
