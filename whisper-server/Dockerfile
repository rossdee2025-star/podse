FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for faster-whisper
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    faster-whisper \
    uvicorn \
    fastapi \
    python-multipart

# Copy server script
COPY server.py .

# Environment variables
ENV WHISPER_MODEL=large-v3
ENV WHISPER_DEVICE=cpu
ENV WHISPER_COMPUTE_TYPE=int8
ENV WHISPER_PORT=8080

EXPOSE 8080

CMD ["python", "server.py"]
