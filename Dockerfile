FROM python:3.10-slim

WORKDIR /app
COPY . .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

ENV HUGGINGFACEHUB_API_TOKEN=${HUGGINGFACEHUB_API_TOKEN}
ENV SESSION_SECRET_KEY=${SESSION_SECRET_KEY}
ENV HF_DATASET_ID=${HF_DATASET_ID}
ENV HF_LLM_REPO_ID=${HF_LLM_REPO_ID}

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
