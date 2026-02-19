from pydantic import BaseModel


class ExtractedField(BaseModel):
    field: str
    value: str
    confidence: float


class ProcessingResult(BaseModel):
    document_type: str
    confidence: float
    ocr_text: str
    extracted_fields: list[ExtractedField]
    processing_time_ms: int


class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
