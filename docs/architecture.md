# PRAHARI — System Architecture

> Point-of-contact threat detection — stopping fraud at the point of contact, not the point of complaint.

## System Diagram

```mermaid
graph TB
    subgraph DATA["Data Sources (Synthetic — Demo)"]
        D1[Currency Images]
        D2[Call Transcripts]
        D3[Transaction Graph]
        D4[Geo Complaint Points]
        D5[Citizen Inputs]
    end

    subgraph ENGINES["Detection Engines (All Local — No External APIs)"]
        E1["Currency Engine\nOpenCV · scikit-image · Tesseract\n7-feature CV pipeline"]
        E2["Scam Engine\nTF-IDF + Gradient Boosting\nPattern rule layer"]
        E3["Fraud Graph Engine\nNetworkX · Louvain\nCommunity detection"]
        E4["Crime Map Engine\nGeospatial aggregation\nPatrol scoring"]
        E5["Citizen Shield\nWeighted rule scoring\nMultilingual (EN/HI/TA)"]
    end

    subgraph INTELLIGENCE["Intelligence & Evidence Layer"]
        I1["Evidence Vault\nSHA-256 hash · Timestamp\nDecision trace · PDF export"]
        I2["SQLite Records\nAll module outputs"]
        I3["Metrics Engine\nPrecision · Recall · FPR\nRubric-mapped"]
    end

    subgraph API["FastAPI Backend (:8000)"]
        A1["/api/currency"]
        A2["/api/scam"]
        A3["/api/fraud"]
        A4["/api/map"]
        A5["/api/citizen"]
        A6["/api/evidence"]
        A7["/api/metrics"]
    end

    subgraph UI["Next.js Frontend (:3000)"]
        U1[Currency Verification\nUpload · Webcam · Annotated overlay]
        U2[Scam Detection\nSession console · Live gauge]
        U3[Fraud Networks\nForce-directed graph · Ring drawer]
        U4[Crime Map\nMapLibre GL · Hotspot layer]
        U5[Citizen Shield\nStep-through · Multilingual]
        U6[Evidence Vault\nCase ledger · PDF export]
        U7[Metrics Dashboard\nRubric mapping · Charts]
    end

    D1 --> E1
    D2 --> E2
    D3 --> E3
    D4 --> E4
    D5 --> E5

    E1 --> I1
    E2 --> I1
    E3 --> I1
    E4 --> I2
    E5 --> I2

    I1 --> A6
    I2 --> A1 & A2 & A3 & A4 & A5
    I3 --> A7

    A1 --> U1
    A2 --> U2
    A3 --> U3
    A4 --> U4
    A5 --> U5
    A6 --> U6
    A7 --> U7
```

## Component Index

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Currency Engine | OpenCV, scikit-image, Tesseract | 7-feature note authentication |
| Scam Engine | scikit-learn GBM, TF-IDF, regex patterns | Digital-arrest session classification |
| Fraud Graph | NetworkX, python-louvain | Community detection on transaction graph |
| Crime Map | FastAPI, GeoJSON | Spatial aggregation and patrol scoring |
| Citizen Shield | Weighted rule scoring | Guided risk check (3 languages) |
| Evidence Vault | SQLite, fpdf2 | Auditable record with SHA-256 chain |
| Backend | FastAPI, Pydantic v2, Uvicorn | REST API, async, auto-docs |
| Frontend | Next.js 14, TypeScript, Tailwind | Command-centre UI |
| Orchestration | docker-compose, Makefile | One-command startup |

## Key Design Decisions

- **No external API calls** — every detection runs locally. Zero egress, works air-gapped.
- **Classical CV, not black-box** — each currency check is individually explainable with a region bbox, confidence, and plain-language detail.
- **Evidence-first** — every verdict writes a content-hashed, timestamped, engine-versioned record before surfacing to the UI.
- **Deterministic citizen tool** — Citizen Shield uses weighted rule scoring, not a chatbot; every output has an auditable reason list.
