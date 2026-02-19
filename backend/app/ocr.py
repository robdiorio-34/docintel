import logging
from doctr.io import DocumentFile
from doctr.models import ocr_predictor

logger = logging.getLogger(__name__)

_predictor = None


def get_predictor():
    global _predictor
    if _predictor is None:
        logger.info("Loading docTR OCR model...")
        _predictor = ocr_predictor(det_arch="db_mobilenet_v3_large", reco_arch="crnn_mobilenet_v3_small", pretrained=True)
        logger.info("docTR OCR model loaded.")
    return _predictor


def extract_text(image_bytes: bytes, filename: str) -> str:
    """Run OCR on an image/PDF and return the extracted text."""
    predictor = get_predictor()

    if filename.lower().endswith(".pdf"):
        doc = DocumentFile.from_pdf(image_bytes)
    else:
        doc = DocumentFile.from_images(image_bytes)

    result = predictor(doc)

    lines = []
    for page in result.pages:
        for block in page.blocks:
            for line in block.lines:
                words = [word.value for word in line.words]
                lines.append(" ".join(words))

    return "\n".join(lines)
