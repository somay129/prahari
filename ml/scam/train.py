"""
Training script for the scam transcript classifier.
Run: python -m ml.scam.train
Trains TF-IDF + Gradient Boosting on synthetic labelled data.
Saves model to ml/weights/scam_clf.joblib.
Reports precision, recall, F1 on held-out split.
"""

import json
import sys
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "synthetic" / "transcripts" / "labelled.json"
WEIGHTS_DIR = Path(__file__).parent.parent / "weights"
MODEL_PATH = WEIGHTS_DIR / "scam_clf.joblib"


def load_data():
    if not DATA_PATH.exists():
        print(f"ERROR: Dataset not found at {DATA_PATH}")
        print("Run: python -m data.seeds.seed_transcripts")
        sys.exit(1)
    with open(DATA_PATH) as f:
        data = json.load(f)
    texts = [d["text"] for d in data]
    labels = [d["label"] for d in data]
    return texts, labels


def train():
    texts, labels = load_data()
    print(f"Loaded {len(texts)} samples ({sum(labels)} scam, {len(labels)-sum(labels)} legit)")
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )
    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 3), max_features=8000, sublinear_tf=True)),
        ("clf", GradientBoostingClassifier(n_estimators=200, max_depth=4, learning_rate=0.1, random_state=42)),
    ])
    print("Training...")
    pipe.fit(X_train, y_train)
    y_pred = pipe.predict(X_test)
    y_proba = pipe.predict_proba(X_test)[:, 1]
    print("\n=== Classification Report ===")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Scam"]))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")
    from sklearn.metrics import precision_score, recall_score, f1_score
    metrics = {
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "f1": round(f1_score(y_test, y_pred), 4),
        "train_size": len(X_train),
        "test_size": len(X_test),
    }
    metrics_path = WEIGHTS_DIR / "scam_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to {metrics_path}")
    return metrics


if __name__ == "__main__":
    train()
