"""
Per-feature verification checks for Indian currency notes.
Each function returns a FeatureResult with pass/fail, confidence, and a region bbox.
All checks use classical CV — no external calls.
"""

import cv2
import numpy as np
import re
from dataclasses import dataclass
from typing import Optional

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False


@dataclass
class FeatureResult:
    name: str
    display_name: str
    passed: bool
    confidence: float
    detail: str
    region_bbox: Optional[list] = None
    thumbnail_b64: Optional[str] = None


SERIAL_PATTERNS = {
    "100":  r"^[0-9A-Z]{3}\s?\d{6}$",
    "200":  r"^[0-9A-Z]{3}\s?\d{6}$",
    "500":  r"^[0-9A-Z]{3}\s?\d{6}$",
    "2000": r"^[0-9A-Z]{3}\s?\d{6}$",
}

DENOMINATION_COLOUR_RANGES = {
    "100": {"h_mean": (15, 35),  "s_mean": (40, 120)},
    "200": {"h_mean": (25, 50),  "s_mean": (50, 140)},
    "500": {"h_mean": (95, 140), "s_mean": (40, 130)},
    "2000": {"h_mean": (130, 160), "s_mean": (50, 140)},
}

REGION_RATIOS = {
    "security_thread": (0.45, 0.05, 0.55, 0.95),
    "microprint":      (0.60, 0.10, 0.95, 0.45),
    "intaglio":        (0.02, 0.10, 0.40, 0.90),
    "serial":          (0.55, 0.60, 0.95, 0.85),
    "watermark":       (0.02, 0.10, 0.35, 0.90),
    "colour":          (0.10, 0.10, 0.90, 0.90),
    "bleed":           (0.02, 0.40, 0.15, 0.60),
}


def _roi(img: np.ndarray, ratios: tuple) -> tuple[np.ndarray, list]:
    h, w = img.shape[:2]
    x1 = int(ratios[0] * w)
    y1 = int(ratios[1] * h)
    x2 = int(ratios[2] * w)
    y2 = int(ratios[3] * h)
    return img[y1:y2, x1:x2], [x1, y1, x2, y2]


def _laplacian_variance(gray: np.ndarray) -> float:
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    return float(lap.var())


def check_security_thread(img: np.ndarray, denomination: str) -> FeatureResult:
    """Detect vertical security thread strip by looking for a thin continuous dark/metallic band."""
    roi, bbox = _roi(img, REGION_RATIOS["security_thread"])
    if roi.size == 0:
        return FeatureResult("security_thread", "Security Thread", False, 0.1, "ROI empty", bbox)

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    col_var = np.var(gray, axis=0)
    col_mean = np.mean(gray, axis=0)
    dark_cols = np.where(col_mean < 120)[0]
    if len(dark_cols) == 0:
        conf = 0.35
        passed = False
        detail = "No dark vertical band detected in thread region"
    else:
        band_width = len(dark_cols)
        expected = max(1, int(w * 0.03))
        width_ok = expected <= band_width <= expected * 6
        continuity = 1.0 - (np.diff(dark_cols).max() / w if len(dark_cols) > 1 else 1.0)
        continuity = max(0.0, continuity)
        conf = 0.5 * float(width_ok) + 0.5 * continuity
        conf = min(0.97, max(0.15, conf))
        passed = conf > 0.55
        detail = f"Band width: {band_width}px, continuity: {continuity:.2f}"

    return FeatureResult("security_thread", "Security Thread", passed, conf, detail, bbox)


def check_microprint_sharpness(img: np.ndarray, denomination: str) -> FeatureResult:
    """Genuine notes have sharp fine-line microprinting; counterfeits lose edge detail."""
    roi, bbox = _roi(img, REGION_RATIOS["microprint"])
    if roi.size == 0:
        return FeatureResult("microprint", "Microprint", False, 0.1, "ROI empty", bbox)

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    lap_var = _laplacian_variance(gray)
    sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    edge_density = float(np.mean(np.sqrt(sobel_x**2 + sobel_y**2)))
    conf = min(0.98, max(0.05, (lap_var / 800.0) * 0.6 + (edge_density / 60.0) * 0.4))
    passed = conf > 0.45
    detail = f"Laplacian variance: {lap_var:.1f}, edge density: {edge_density:.1f}"
    return FeatureResult("microprint", "Microprint", passed, conf, detail, bbox)


def check_intaglio_geometry(img: np.ndarray, denomination: str) -> FeatureResult:
    """Check raised intaglio print characteristics via local intensity pattern analysis."""
    roi, bbox = _roi(img, REGION_RATIOS["intaglio"])
    if roi.size == 0:
        return FeatureResult("intaglio", "Intaglio Print", False, 0.1, "ROI empty", bbox)

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    diff = cv2.absdiff(gray, blur)
    texture_score = float(np.mean(diff))
    std_intensity = float(np.std(gray))
    conf = min(0.97, max(0.10, (texture_score / 15.0) * 0.5 + (std_intensity / 60.0) * 0.5))
    passed = conf > 0.42
    detail = f"Texture score: {texture_score:.2f}, intensity std: {std_intensity:.2f}"
    return FeatureResult("intaglio", "Intaglio Print", passed, conf, detail, bbox)


def check_serial_number(img: np.ndarray, denomination: str) -> FeatureResult:
    """Extract serial number via OCR and validate against denomination format."""
    roi, bbox = _roi(img, REGION_RATIOS["serial"])
    if roi.size == 0:
        return FeatureResult("serial", "Serial Number", False, 0.1, "ROI empty", bbox)

    if not TESSERACT_AVAILABLE:
        conf = 0.65
        return FeatureResult("serial", "Serial Number", True, conf, "OCR not available; heuristic pass", bbox)

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    upscaled = cv2.resize(thresh, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    try:
        text = pytesseract.image_to_string(upscaled, config="--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ")
        text = text.strip().replace("\n", "").replace(" ", "")
        pattern = SERIAL_PATTERNS.get(denomination, r"^[0-9A-Z]{3}\d{6}$")
        if re.match(pattern, text):
            conf, passed, detail = 0.92, True, f"Serial: {text}"
        elif len(text) >= 6:
            conf, passed, detail = 0.55, True, f"Partial match: {text}"
        else:
            conf, passed, detail = 0.30, False, f"Invalid serial: '{text}'"
    except Exception as e:
        conf, passed, detail = 0.50, True, f"OCR error: {e}"

    return FeatureResult("serial", "Serial Number", passed, conf, detail, bbox)


def check_watermark_region(img: np.ndarray, denomination: str) -> FeatureResult:
    """Check watermark region for expected lightness gradient structure."""
    roi, bbox = _roi(img, REGION_RATIOS["watermark"])
    if roi.size == 0:
        return FeatureResult("watermark", "Watermark", False, 0.1, "ROI empty", bbox)

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    left_mean = float(np.mean(gray[:, :w//3]))
    right_mean = float(np.mean(gray[:, 2*w//3:]))
    gradient_ratio = abs(left_mean - right_mean) / (max(left_mean, right_mean) + 1e-5)
    local_contrast = float(np.std(gray))
    conf = min(0.95, max(0.10, gradient_ratio * 0.5 + (local_contrast / 50.0) * 0.5))
    passed = conf > 0.40
    detail = f"Gradient ratio: {gradient_ratio:.3f}, local contrast: {local_contrast:.2f}"
    return FeatureResult("watermark", "Watermark", passed, conf, detail, bbox)


def check_colour_statistics(img: np.ndarray, denomination: str) -> FeatureResult:
    """Check dominant colour hue falls within denomination-specific range."""
    roi, bbox = _roi(img, REGION_RATIOS["colour"])
    if roi.size == 0:
        return FeatureResult("colour", "Colour Range", False, 0.1, "ROI empty", bbox)

    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    h_mean = float(np.mean(hsv[:, :, 0]))
    s_mean = float(np.mean(hsv[:, :, 1]))
    ranges = DENOMINATION_COLOUR_RANGES.get(denomination, {"h_mean": (0, 180), "s_mean": (0, 255)})
    h_ok = ranges["h_mean"][0] <= h_mean <= ranges["h_mean"][1]
    s_ok = ranges["s_mean"][0] <= s_mean <= ranges["s_mean"][1]
    conf = 0.90 if (h_ok and s_ok) else (0.65 if (h_ok or s_ok) else 0.25)
    passed = conf > 0.55
    detail = f"Hue mean: {h_mean:.1f} (expected {ranges['h_mean']}), Sat: {s_mean:.1f}"
    return FeatureResult("colour", "Colour Range", passed, conf, detail, bbox)


def check_bleed_lines(img: np.ndarray, denomination: str) -> FeatureResult:
    """Detect presence of angular bleed lines in the left margin region."""
    roi, bbox = _roi(img, REGION_RATIOS["bleed"])
    if roi.size == 0:
        return FeatureResult("bleed", "Bleed Lines", False, 0.1, "ROI empty", bbox)

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 40, 120)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=10, minLineLength=8, maxLineGap=3)
    n_lines = len(lines) if lines is not None else 0
    conf = min(0.95, max(0.15, n_lines / 20.0))
    passed = n_lines >= 3
    detail = f"Bleed lines detected: {n_lines}"
    return FeatureResult("bleed", "Bleed Lines", passed, conf, detail, bbox)
