# Demo Script

**Hit the live site 5 minutes before your demo so the backend is warm.**
Visit https://docintel-alpha.vercel.app and click any sample doc to wake the backend.

---

## 1. Open the app (30 seconds)

> "This is DocIntel — an intelligent document processing pipeline I built for payment operations. It takes in raw document images, runs them through OCR, classifies the document type, and extracts structured fields using NLP."

Open https://docintel-alpha.vercel.app

## 2. Process the Invoice (60 seconds)

Click the **Invoice** sample card.

While it processes:
> "Right now it's running through a three-stage pipeline. First, Tesseract OCR extracts the raw text. Then a keyword-based NLP classifier determines the document type. Finally, spaCy's Named Entity Recognition combined with domain-specific regex patterns extracts structured fields — things like the total amount, invoice number, dates, organizations, and routing numbers."

When results appear, point out:
- **Classification**: "It correctly identified this as an invoice at 92% confidence"
- **Key Fields cards**: "These are the high-priority extracted fields — the total, date, and invoice number"
- **Extracted Fields table**: "Each field has a confidence score. Pattern-matched fields like the total get 0.97, while statistically extracted entities like organizations get 0.80 — this reflects the reliability difference"
- **OCR Text**: "You can expand this to see the raw OCR output the pipeline worked from"

## 3. Process the Receipt (45 seconds)

Click **Reset**, then click the **Receipt** sample.

> "Now watch how the same pipeline handles a completely different document format."

When results appear:
> "It classified this as a receipt at 90% confidence and extracted a different set of fields — the store name, line items, tax calculation, payment method. The classifier and extractor adapt to the document type automatically."

## 4. Process the Budget (45 seconds)

Click **Reset**, then click the **Budget** sample.

> "This is a quarterly budget report from a fictional payments division — the kind of document you'd see in payments operations."

When results appear:
> "It correctly classified this as a budget document and extracted the financial figures, organizations, and dates. This shows the system handles more than just transactional documents."

## 5. Architecture Talking Points (if asked)

- **"Why not a deep learning classifier?"** — "I initially prototyped with Microsoft's DiT Vision Transformer on the RVL-CDIP dataset. It achieved 89% accuracy on the image alone. But for deployment on constrained infrastructure, the NLP-based classifier gave comparable accuracy with near-zero memory overhead. In production, you'd ensemble both approaches."

- **"How would you scale this?"** — "Three things: upgrade OCR to AWS Textract for native table extraction, fine-tune LayoutLMv2 which understands spatial layout alongside text, and add a human-in-the-loop feedback system where low-confidence extractions get routed for review and corrections feed back into model training."

- **"What about accuracy?"** — "The extraction pipeline uses a hybrid approach — high-precision regex patterns for structured fields like amounts and invoice numbers, combined with statistical NER for fuzzier entities like organizations and people. The confidence scores let you set thresholds: auto-process above 0.90, route for human review below that."
