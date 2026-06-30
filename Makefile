.PHONY: all setup seed train backend frontend dev clean help

PYTHON := python
PIP    := pip
NPM    := npm

help:
	@echo ""
	@echo "  PRAHARI — Digital Public Safety Intelligence Platform"
	@echo "  ======================================================="
	@echo "  make setup    Install all dependencies (backend + frontend)"
	@echo "  make seed     Generate synthetic demo data"
	@echo "  make train    Train the scam detection classifier"
	@echo "  make backend  Start FastAPI backend (port 8000)"
	@echo "  make frontend Start Next.js frontend (port 3000)"
	@echo "  make dev      Start both backend and frontend concurrently"
	@echo "  make docker   Build and run with docker-compose"
	@echo "  make clean    Remove generated data and caches"
	@echo ""

setup:
	cd backend && $(PIP) install -r requirements.txt
	cd frontend && $(NPM) install

seed:
	$(PYTHON) -m data.seeds.seed_all

train:
	$(PYTHON) -m ml.scam.train

backend:
	$(PYTHON) -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

frontend:
	cd frontend && $(NPM) run dev

dev:
	@echo "Starting PRAHARI backend on :8000 and frontend on :3000"
	@$(PYTHON) -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload & \
	cd frontend && $(NPM) run dev

docker:
	docker-compose up --build

clean:
	rm -rf data/synthetic/geo/complaints.json
	rm -rf data/synthetic/transcripts/labelled.json
	rm -rf data/synthetic/graph/*.json
	rm -rf ml/weights/scam_clf.joblib
	rm -rf ml/weights/scam_metrics.json
	rm -rf prahari.db
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
