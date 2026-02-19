import logging
import re
from collections import Counter

logger = logging.getLogger(__name__)

# Keyword profiles for document types, ordered by specificity
DOCUMENT_PROFILES: list[tuple[str, list[str], float]] = [
    ("invoice", [
        "invoice", "inv-", "invoice number", "invoice date", "bill to",
        "due date", "subtotal", "total due", "amount due", "payment terms",
        "net 30", "net 60", "remit", "purchase order", "qty", "rate",
    ], 0.92),
    ("receipt", [
        "receipt", "transaction", "paid", "change due", "cash",
        "credit card", "visa", "mastercard", "thank you for your purchase",
        "store", "cashier", "register",
    ], 0.90),
    ("budget", [
        "budget", "forecast", "fiscal year", "quarterly", "allocation",
        "expenditure", "revenue", "variance", "projected", "actual vs",
    ], 0.88),
    ("resume", [
        "resume", "curriculum vitae", "experience", "education",
        "skills", "objective", "references", "employment history",
        "bachelor", "master", "university", "gpa",
    ], 0.88),
    ("letter", [
        "dear", "sincerely", "regards", "to whom it may concern",
        "enclosed", "attached", "correspondence",
    ], 0.82),
    ("form", [
        "form", "please fill", "applicant", "signature", "date of birth",
        "social security", "checkbox", "check one",
    ], 0.85),
    ("email", [
        "from:", "to:", "subject:", "cc:", "sent:", "re:", "fw:",
    ], 0.88),
    ("memo", [
        "memo", "memorandum", "to:", "from:", "subject:", "internal",
    ], 0.82),
    ("report", [
        "report", "abstract", "introduction", "conclusion", "methodology",
        "findings", "analysis", "results", "figure", "table",
    ], 0.80),
    ("specification", [
        "specification", "requirements", "version", "revision",
        "scope", "compliance", "appendix",
    ], 0.80),
]


def classify_document(ocr_text: str) -> tuple[str, float]:
    """Classify document type based on keyword matching against OCR text."""
    text_lower = ocr_text.lower()

    scores: Counter[str] = Counter()
    base_confidence: dict[str, float] = {}

    for doc_type, keywords, confidence in DOCUMENT_PROFILES:
        hits = sum(1 for kw in keywords if kw in text_lower)
        if hits > 0:
            score = hits / len(keywords)
            scores[doc_type] = score
            base_confidence[doc_type] = confidence

    if not scores:
        return "document", 0.50

    best_type = scores.most_common(1)[0][0]
    match_ratio = scores[best_type]
    confidence = round(base_confidence[best_type] * min(match_ratio * 3, 1.0), 4)
    confidence = max(0.50, min(confidence, 0.97))

    return best_type, confidence
