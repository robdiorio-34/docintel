import logging
from io import BytesIO
from PIL import Image
import pytesseract

logger = logging.getLogger(__name__)


def extract_text(image_bytes: bytes, filename: str) -> str:
    """Run Tesseract OCR on an image/PDF and return the extracted text."""
    if filename.lower().endswith(".pdf"):
        from pdf2image import convert_from_bytes

        pages = convert_from_bytes(image_bytes)
        texts = [pytesseract.image_to_string(page) for page in pages]
        return "\n".join(texts).strip()

    image = Image.open(BytesIO(image_bytes))
    return pytesseract.image_to_string(image).strip()
