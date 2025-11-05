@echo off
echo.
echo ========================================
echo  Installing Bark TTS
echo ========================================
echo.

echo Step 1: Installing Bark from GitHub...
pip install git+https://github.com/suno-ai/bark.git

echo.
echo Step 2: Installing Flask for server...
pip install flask flask-cors

echo.
echo Step 3: Installing scipy for audio processing...
pip install scipy

echo.
echo Step 4: Pre-downloading models (this will take a few minutes)...
python -c "from bark import preload_models; preload_models()"

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo To start the Bark server:
echo   python bark_server.py
echo.
echo Then update .env:
echo   VOICE_TTS_PROVIDER=bark
echo.
pause
