import logging
from io import BytesIO
from PIL import Image
from transformers import pipeline

logger = logging.getLogger(__name__)

_classifier = None

# RVL-CDIP label mapping (DiT model)
LABEL_MAP = {
    "letter": "letter",
    "form": "form",
    "email": "email",
    "handwritten": "handwritten",
    "advertisement": "advertisement",
    "scientific_report": "report",
    "scientific_publication": "publication",
    "specification": "specification",
    "file_folder": "file_folder",
    "news_article": "news_article",
    "budget": "budget",
    "invoice": "invoice",
    "presentation": "presentation",
    "questionnaire": "questionnaire",
    "resume": "resume",
    "memo": "memo",
}

# Payment-relevant categories get highlighted
PAYMENT_RELEVANT = {"invoice", "budget", "form", "letter", "memo"}


def get_classifier():
    global _classifier
    if _classifier is None:
        logger.info("Loading document classifier (DiT)...")
        _classifier = pipeline(
            "image-classification",
            model="microsoft/dit-base-finetuned-rvlcdip",
        )
        logger.info("Document classifier loaded.")
    return _classifier


def classify_document(image_bytes: bytes) -> tuple[str, float]:
    """Classify a document image and return (label, confidence)."""
    clf = get_classifier()

    image = Image.open(BytesIO(image_bytes)).convert("RGB")

    results = clf(image)
    top = results[0]
    label = top["label"].lower().replace(" ", "_")
    label = LABEL_MAP.get(label, label)
    confidence = round(top["score"], 4)

    return label, confidence
