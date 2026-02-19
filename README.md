# DocIntel — Intelligent Document Processor

An end-to-end document intelligence pipeline that combines **OCR**, **NLP-based classification**, and **Named Entity Recognition** to automatically extract structured data from payment documents.

**Live Demo:** [docintel-alpha.vercel.app](https://docintel-alpha.vercel.app)

---

## Architecture

```
                         +------------------+
                         |   User uploads   |
                         |  document image  |
                         +--------+---------+
                                  |
                                  v
                    +-------------+-------------+
                    |     Next.js Frontend      |
                    |   (Vercel - Static + API)  |
                    +-------------+-------------+
                                  |
                            API Proxy
                          POST /api/process
                                  |
                                  v
                    +-------------+-------------+
                    |    FastAPI ML Backend      |
                    |     (Render - Docker)      |
                    +-------------+-------------+
                                  |
                    +-------------+-------------+
                    |                           |
              +-----v------+            +------v-------+
              |  Stage 1:  |            |   Stage 2:   |
              | Tesseract  |---text---->|  Keyword     |
              |    OCR     |            | Classifier   |
              +-----+------+            +--------------+
                    |
              raw text
                    |
              +-----v------+
              |  Stage 3:  |
              |  spaCy NER |
              |  + Regex   |
              +-----+------+
                    |
                    v
          +--------+---------+
          | Structured JSON  |
          | - document_type  |
          | - confidence     |
          | - extracted      |
          |   fields         |
          +------------------+
```

### Pipeline Stages

| Stage | Technology | Purpose |
|-------|-----------|---------|
| **OCR** | Tesseract | Extracts raw text from images and PDFs |
| **Classification** | NLP keyword profiling | Categorizes documents (invoice, receipt, budget, letter, etc.) |
| **Extraction** | spaCy NER + regex | Identifies entities: amounts, dates, invoice numbers, organizations, routing numbers |

---

## Tech Stack

**Frontend**
- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript
- shadcn/ui, Tailwind CSS
- react-dropzone

**Backend**
- Python 3.11, FastAPI
- Tesseract OCR (via pytesseract)
- spaCy (`en_core_web_sm`) for Named Entity Recognition
- Custom regex patterns for payment-specific field extraction
- Pydantic for schema validation

**Infrastructure**
- Frontend: Vercel (serverless)
- Backend: Render (Docker, free tier)
- API proxy pattern isolates ML backend from client

---

## Features

- **Multi-format support** — PNG, JPEG, TIFF, BMP, WebP, PDF (up to 10MB)
- **10 document categories** — invoice, receipt, budget, letter, form, email, memo, resume, report, specification
- **Payment-specific extraction** — totals, subtotals, tax, invoice numbers, routing numbers, dates, organizations
- **Confidence scoring** — each field carries a confidence score reflecting extraction reliability
- **Hybrid extraction** — combines statistical NER (spaCy) with domain-specific regex patterns
- **Deduplication & noise filtering** — filters false positives from product names, address fragments, barcode patterns
- **Sample documents** — three built-in samples (invoice, receipt, budget) for instant demo

---

## Running Locally

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Requires Tesseract: brew install tesseract (macOS) or apt-get install tesseract-ocr (Linux)
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). The frontend proxies API requests to `localhost:8000` by default.

---

## API

### `POST /process`

Upload a document for processing.

```bash
curl -X POST http://localhost:8000/process \
  -F "file=@invoice.png"
```

**Response:**
```json
{
  "document_type": "invoice",
  "confidence": 0.92,
  "ocr_text": "ACME TECHNOLOGIES INC. INVOICE...",
  "extracted_fields": [
    { "field": "Total", "value": "$5,184.00", "confidence": 0.97 },
    { "field": "Invoice Number", "value": "INV-2025-0847", "confidence": 0.90 },
    { "field": "Organization", "value": "Summit Financial Group", "confidence": 0.80 }
  ],
  "processing_time_ms": 477
}
```

### `GET /health`

```json
{ "status": "healthy", "models_loaded": true }
```

---

## Project Structure

```
docintel/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app, /process endpoint
│   │   ├── ocr.py            # Tesseract OCR wrapper
│   │   ├── classifier.py     # NLP keyword-based document classifier
│   │   ├── extractor.py      # spaCy NER + regex field extraction
│   │   └── schemas.py        # Pydantic response models
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx      # Main UI
│   │   │   └── api/process/  # API proxy route
│   │   └── components/       # UI components (shadcn/ui)
│   └── public/samples/       # Sample document images
└── render.yaml               # Render deployment blueprint
```

---

## Scaling Considerations

For production deployment on payment documents at scale:

- **OCR**: Upgrade to AWS Textract or Google Document AI for higher accuracy and native table extraction
- **Classification**: Ensemble a Vision Transformer (DiT/LayoutLM) with the text-based classifier
- **Extraction**: Fine-tune LayoutLMv2 which jointly encodes text content and spatial position on the page
- **Feedback loop**: Route low-confidence extractions to human review, feed corrections back into model training
- **Table extraction**: Add specialized table detection for invoice line items

---

## License

MIT
