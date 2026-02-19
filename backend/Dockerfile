FROM python:3.11-slim

WORKDIR /app

# System deps for PDF processing and image handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

COPY app/ app/

# Predownload models during build
RUN python -c "from app.ocr import get_predictor; get_predictor()"
RUN python -c "from app.classifier import get_classifier; get_classifier()"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
