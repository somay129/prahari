# PRAHARI — Digital Public Safety Intelligence Platform

> **Point-of-contact threat detection — stopping fraud at the point of contact, not the point of complaint.**

PRAHARI is a law-enforcement and citizen-facing intelligence platform that detects counterfeit currency, active digital-arrest scam sessions, and organised fraud networks — and visualises crime patterns geospatially. Built for the ET AI Hackathon 2026 (PS6 — Counterfeiting, Fraud & Digital Arrest Scams) by Team **HallucinationFix**.

**Everything runs locally. Zero external API calls. Works on an air-gapped machine.**

---

## Quick Start (5 commands)

```bash
# 1. Clone and enter
git clone <repo> && cd prahari

# 2. Install dependencies
make setup

# 3. Generate synthetic demo data
make seed

# 4. (Optional) Train the scam detection classifier
make train

# 5. Start both services
make dev
# Backend: http://localhost:8000  |  Frontend: http://localhost:3000
```

### Docker (alternative)
```bash
docker-compose up --build
```

---

## Modules

| Module | What it does | Demo highlight |
|--------|-------------|----------------|
| **Currency Verification** | 7-feature CV pipeline — security thread, microprint sharpness, intaglio geometry, serial number OCR, watermark, colour stats, bleed lines | Webcam capture → annotated result in <2 sec |
| **Scam Detection** | TF-IDF + Gradient Boosting + 10 rule-based pattern overlays — agency impersonation, payment demand, secrecy instruction, urgency | Live transcript replay, risk gauge climbs, critical banner fires |
| **Fraud Networks** | NetworkX + Louvain community detection on synthetic account/transaction/victim graph; role inference (mule/aggregator/hub); lead-time metric | Interactive force-directed graph, ring drawer, chain-of-custody export |
| **Crime Map** | MapLibre GL + 500 synthetic complaint points across 15 Indian cities; patrol-prioritisation scoring | Hotspot bubbles, category filter, city ranking sidebar |
| **Citizen Shield** | Weighted rule scoring — 5 questions → Safe / Caution / High Risk verdict + reasons + reporting steps | 3-language toggle (EN/HI/TA), false-positive rate displayed |
| **Evidence Vault** | Every detection creates a SHA-256 hashed, timestamped, engine-versioned record with full decision trace and PDF export | Case-management ledger view, one-click PDF |
| **Metrics** | Precision, recall, F1, per-denomination accuracy, lead-time, false-positive rate — rubric-mapped | Live chart with real numbers from evaluation runs |

---

## Data Notice

> **All data is synthetic and clearly labelled as such throughout the application.**
> No real personal data, no real account numbers, no real card numbers. Reference crops used for currency detection are synthetic. Complaint locations are randomly generated across approximate city centres.

---

## Rubric Mapping

| Criterion | PRAHARI Capability |
|-----------|-------------------|
| Technical depth | Full CV pipeline (OpenCV + scikit-image + Tesseract), trained GBM classifier, Louvain graph detection |
| Offline / no data egress | Zero external API calls; all inference is local |
| Legal admissibility | SHA-256 hash + timestamp + engine version + decision trace in every evidence record |
| Scam detection accuracy | Measured precision and recall on held-out split, shown on Metrics page |
| Geospatial intelligence | MapLibre GL map with 500 synthetic points across 15 cities, patrol prioritisation |
| Citizen accessibility | Multilingual (EN/HI/TA), false-positive rate stated, deterministic scoring |

---

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full system diagram.

---

*DEMO DATA — synthetic, for evaluation only · PRAHARI v1.0.0 · Team HallucinationFix · ET AI Hackathon 2026*
