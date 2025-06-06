FROM python:3.10-slim

WORKDIR /app
COPY . .

# Install system dependencies for PyMuPDF and pdfplumber
RUN apt-get update && \
    apt-get install -y build-essential libglib2.0-0 libsm6 libxrender1 libxext6 poppler-utils && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Remove unused environment variables and keep only GOOGLE_API_KEY and HF_DATASET_ID
ENV GOOGLE_API_KEY=${GOOGLE_API_KEY}
ENV HF_DATASET_ID=${HF_DATASET_ID}

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
