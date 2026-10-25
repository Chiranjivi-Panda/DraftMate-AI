# DraftMate — multi-stage image (API + static demo)
FROM python:3.12-slim AS base

WORKDIR /app

# System deps for reportlab / fonts (minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfreetype6 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir \
        "fastapi>=0.110" \
        "uvicorn[standard]>=0.27" \
        "python-docx>=1.1" \
        "reportlab>=4.0" \
        "markitdown>=0.0.1" \
        "pydantic>=2.6" \
        "requests>=2.31" \
        "beautifulsoup4>=4.12" \
        "rank-bm25>=0.2.2"

COPY . .

ENV PYTHONPATH=/app
EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
