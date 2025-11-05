@echo off
echo.
echo ========================================
echo  Starting Bark TTS Server
echo ========================================
echo.
echo Starting server on http://localhost:8080
echo.
echo Available voices:
echo   - male_deep (RECOMMENDED - authoritative)
echo   - male_young (energetic)
echo   - male_excited (chaotic)
echo   - male_casual (casual)
echo.
echo Press Ctrl+C to stop
echo.

python bark_server.py
