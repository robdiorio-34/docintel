import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import ProcessingResult, ExtractedField, HealthResponse
from app.ocr import extract_text, get_predictor
from app.classifier import classify_document, get_classifier
from app.extractor import extract_fields

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALLOWED_TYPES = {
    "image/png", "image/jpeg", "image/jpg", "image/tiff",
    "image/bmp", "image/webp", "application/pdf",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload models on startup
    logger.info("Preloading models...")
    get_predictor()
    get_classifier()
    logger.info("All models loaded.")
    yield


app = FastAPI(
    title="DocIntel API",
    description="Intelligent Payment Document Processor - OCR, Classification & Field Extraction",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy", models_loaded=True)


@app.post("/process", response_model=ProcessingResult)
async def process_document(file: UploadFile):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Supported: {', '.join(ALLOWED_TYPES)}",
        )

    # Read file
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    start = time.time()

    # Step 1: OCR
    logger.info(f"Processing document: {file.filename}")
    ocr_text = extract_text(contents, file.filename or "image.png")
    logger.info(f"OCR extracted {len(ocr_text)} characters")

    # Step 2: Classification
    doc_type, confidence = classify_document(contents)
    logger.info(f"Classified as: {doc_type} ({confidence:.2%})")

    # Step 3: Field extraction
    raw_fields = extract_fields(ocr_text)
    extracted_fields = [ExtractedField(**f) for f in raw_fields]
    logger.info(f"Extracted {len(extracted_fields)} fields")

    elapsed_ms = int((time.time() - start) * 1000)

    return ProcessingResult(
        document_type=doc_type,
        confidence=confidence,
        ocr_text=ocr_text,
        extracted_fields=extracted_fields,
        processing_time_ms=elapsed_ms,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
