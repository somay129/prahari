"""
Currency verification pipeline using classical computer vision.
All processing is local — no external API calls.
"""

import cv2
import numpy as np
from PIL import Image
import io
import base64
import hashlib
from dataclasses import dataclass, field
from typing import Optional
from ml.counterfeit.feature_checks import (
    check_security_thread,
    check_microprint_sharpness,
    check_intaglio_geometry,
    check_serial_number,
    check_watermark_region,
    check_colour_statistics,
    check_bleed_lines,
)

ENGINE_VERSION = "CV-1.0.0"

DENOMINATION_WEIGHTS = {
    "100":  {"security_thread": 0.20, "microprint": 0.18, "intaglio": 0.15, "serial": 0.12, "watermark": 0.15, "colour": 0.12, "bleed": 0.08},
    "200":  {"security_thread": 0.20, "microprint": 0.18, "intaglio": 0.15, "serial": 0.12, "watermark": 0.15, "colour": 0.12, "bleed": 0.08},
    "500":  {"security_thread": 0.22, "microprint": 0.18, "intaglio": 0.15, "serial": 0.12, "watermark": 0.13, "colour": 0.12, "bleed": 0.08},
    "2000": {"security_thread": 0.22, "microprint": 0.18, "intaglio": 0.15, "serial": 0.12, "watermark": 0.13, "colour": 0.12, "bleed": 0.08},
}

THRESHOLDS = {
    "GENUINE": 0.78,
    "SUSPECT": 0.52,
}


@dataclass
class FeatureResult:
    name: str
    display_name: str
    passed: bool
    confidence: float
    detail: str
    region_bbox: Optional[list] = None
    thumbnail_b64: Optional[str] = None


@dataclass
class VerificationResult:
    denomination: str
    verdict: str
    overall_confidence: float
    features: list[FeatureResult] = field(default_factory=list)
    annotated_image_b64: str = ""
    image_hash: str = ""
    engine_version: str = ENGINE_VERSION
    decision_trace: dict = field(default_factory=dict)


def _image_hash(img_bytes: bytes) -> str:
    return hashlib.sha256(img_bytes).hexdigest()


def _img_to_b64(img: np.ndarray) -> str:
    _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buf.tobytes()).decode()


def _load_image(img_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Cannot decode image")
    return img


def _perspective_correct(img: np.ndarray) -> np.ndarray:
    """Align note to a canonical rectangle using contour detection."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 30, 120)
    contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return img
    largest = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest)
    if area < 0.1 * img.shape[0] * img.shape[1]:
        return img
    rect = cv2.minAreaRect(largest)
    box = cv2.boxPoints(rect)
    box = np.int0(box)
    w, h = int(rect[1][0]), int(rect[1][1])
    if w < 10 or h < 10:
        return img
    if w < h:
        w, h = h, w
    dst = np.array([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]], dtype="float32")
    src = box.astype("float32")
    M = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(img, M, (w, h))
    return warped


def _annotate_image(img: np.ndarray, features: list[FeatureResult]) -> np.ndarray:
    annotated = img.copy()
    h, w = annotated.shape[:2]
    colour_map = {True: (48, 164, 108), False: (229, 72, 77)}
    for feat in features:
        if feat.region_bbox:
            x1, y1, x2, y2 = [int(v) for v in feat.region_bbox]
            x1 = max(0, min(x1, w - 1))
            y1 = max(0, min(y1, h - 1))
            x2 = max(0, min(x2, w - 1))
            y2 = max(0, min(y2, h - 1))
            colour = colour_map[feat.passed]
            cv2.rectangle(annotated, (x1, y1), (x2, y2), colour, 2)
            label = feat.display_name[:12]
            cv2.putText(annotated, label, (x1, max(y1 - 4, 12)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.35, colour, 1, cv2.LINE_AA)
    return annotated


def verify_currency(img_bytes: bytes, denomination: str) -> VerificationResult:
    img_hash = _image_hash(img_bytes)
    img = _load_image(img_bytes)
    img = _perspective_correct(img)
    h, w = img.shape[:2]
    if w < h:
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        h, w = img.shape[:2]

    weights = DENOMINATION_WEIGHTS.get(denomination, DENOMINATION_WEIGHTS["500"])

    checks = [
        ("security_thread", check_security_thread),
        ("microprint",      check_microprint_sharpness),
        ("intaglio",        check_intaglio_geometry),
        ("serial",          check_serial_number),
        ("watermark",       check_watermark_region),
        ("colour",          check_colour_statistics),
        ("bleed",           check_bleed_lines),
    ]

    features: list[FeatureResult] = []
    trace: dict = {}

    for key, fn in checks:
        result = fn(img, denomination)
        features.append(result)
        trace[key] = {"passed": result.passed, "confidence": round(result.confidence, 4), "detail": result.detail}

    weighted_score = sum(
        weights[key] * feat.confidence
        for (key, _), feat in zip(checks, features)
    )

    if weighted_score >= THRESHOLDS["GENUINE"]:
        verdict = "GENUINE"
    elif weighted_score >= THRESHOLDS["SUSPECT"]:
        verdict = "SUSPECT"
    else:
        verdict = "LIKELY COUNTERFEIT"

    annotated = _annotate_image(img, features)
    annotated_b64 = _img_to_b64(annotated)

    trace["weighted_score"] = round(weighted_score, 4)
    trace["verdict"] = verdict
    trace["thresholds"] = THRESHOLDS

    return VerificationResult(
        denomination=denomination,
        verdict=verdict,
        overall_confidence=round(weighted_score, 4),
        features=features,
        annotated_image_b64=annotated_b64,
        image_hash=img_hash,
        engine_version=ENGINE_VERSION,
        decision_trace=trace,
    )
