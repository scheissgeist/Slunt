@echo off
echo ============================================
echo Slunt Clean Start Script
echo ============================================
echo.

echo [1/3] Killing any existing Slunt instances...
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "node.exe"') do (
    echo Found node process: %%i
    taskkill /PID %%i /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo [2/3] Starting Slunt server...
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo [3/3] Launching Slunt...
node server.js

pause
