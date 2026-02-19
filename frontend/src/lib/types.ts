export interface ExtractedField {
  field: string;
  value: string;
  confidence: number;
}

export interface ProcessingResult {
  document_type: string;
  confidence: number;
  ocr_text: string;
  extracted_fields: ExtractedField[];
  processing_time_ms: number;
}
