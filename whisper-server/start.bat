@echo off
echo Starting Local Whisper Server...
echo.
echo Model: %WHISPER_MODEL%
echo Port: 8080
echo.

cd /d "%~dp0"
call venv\Scripts\activate.bat

set WHISPER_MODEL=large-v3
set WHISPER_DEVICE=cpu
set WHISPER_COMPUTE_TYPE=int8
set WHISPER_PORT=8080

python server.py
