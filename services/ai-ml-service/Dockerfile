# AI/ML Service Container - 2GB+ with GPU support
FROM python:3.11-slim

# Install system dependencies for ML
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install CUDA toolkit (if GPU support needed)
# RUN apt-get update && apt-get install -y nvidia-cuda-toolkit

# Set working directory
WORKDIR /app

# Create models directory for persistent storage
RUN mkdir -p /data/models

# Copy requirements first for better caching
COPY requirements-ai-ml.txt .
RUN pip install --no-cache-dir -r requirements-ai-ml.txt

# Copy application code
COPY app/ ./app/

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app /data
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD python -c "import app.main; print('AI service healthy')" || exit 1

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]