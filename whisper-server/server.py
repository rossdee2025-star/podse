#!/usr/bin/env python3
"""
Local Whisper Transcription Server
Uses faster-whisper for efficient transcription with OpenAI-compatible API
"""

import os
import io
import tempfile
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="Local Whisper Server")

# Global model instance
model = None
model_name = os.environ.get("WHISPER_MODEL", "large-v3")

def get_model():
    global model
    if model is None:
        from faster_whisper import WhisperModel
        print(f"Loading Whisper model: {model_name}")
        # Use CPU by default, can be changed to "cuda" for GPU
        compute_type = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
        device = os.environ.get("WHISPER_DEVICE", "cpu")
        model = WhisperModel(model_name, device=device, compute_type=compute_type)
        print(f"Model loaded: {model_name} on {device}")
    return model


@app.get("/health")
async def health():
    return {"status": "ok", "model": model_name}


@app.post("/v1/audio/transcriptions")
async def transcribe_openai_compat(
    file: UploadFile = File(...),
    model: str = Form(default="whisper-1"),
    language: Optional[str] = Form(default=None),
    response_format: str = Form(default="json"),
    timestamp_granularities: Optional[str] = Form(default=None),
):
    """OpenAI-compatible transcription endpoint"""
    return await do_transcribe(file, language, response_format)


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = Form(default=None),
    response_format: str = Form(default="json"),
):
    """Simple transcription endpoint"""
    return await do_transcribe(file, language, response_format)


async def do_transcribe(
    file: UploadFile,
    language: Optional[str],
    response_format: str,
):
    """Common transcription logic"""
    try:
        # Read uploaded file
        content = await file.read()

        # Save to temp file (faster-whisper needs a file path)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Get model and transcribe
            whisper_model = get_model()

            # Transcribe with word timestamps for better segment granularity
            segments_gen, info = whisper_model.transcribe(
                tmp_path,
                language=language if language and language != "auto" else None,
                beam_size=5,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500),
            )

            # Convert generator to list and build response
            segments = []
            full_text_parts = []

            for segment in segments_gen:
                segments.append({
                    "id": len(segments),
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text.strip(),
                })
                full_text_parts.append(segment.text.strip())

            full_text = " ".join(full_text_parts)
            detected_language = info.language if hasattr(info, 'language') else language

            if response_format == "text":
                return full_text

            return JSONResponse({
                "text": full_text,
                "segments": segments,
                "language": detected_language,
            })

        finally:
            # Clean up temp file
            os.unlink(tmp_path)

    except Exception as e:
        print(f"Transcription error: {e}")
        return JSONResponse(
            {"error": {"message": str(e)}},
            status_code=500
        )


if __name__ == "__main__":
    port = int(os.environ.get("WHISPER_PORT", "8080"))
    print(f"Starting Whisper server on port {port}")
    print(f"Model: {model_name}")
    uvicorn.run(app, host="0.0.0.0", port=port)
