@echo off
echo ================================================
echo         SLUNT BOT - Startup Wizard
echo ================================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo.
    echo Please create a .env file with your configuration.
    echo See SLUNT_SETUP_GUIDE.md for instructions.
    echo.
    echo Required variables:
    echo   - XAI_API_KEY (Grok API key)
    echo   - TWITCH_USERNAME
    echo   - TWITCH_OAUTH_TOKEN
    echo   - TWITCH_CHANNELS
    echo   - DISCORD_TOKEN
    echo   - DISCORD_CLIENT_ID
    echo.
    pause
    exit /b 1
)

echo [OK] .env file found
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [SETUP] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
)

echo [OK] Dependencies installed
echo.

REM Ask if user wants to start XTTS voice server
echo Do you want to enable voice (XTTS)?
echo This requires the XTTS server to be running.
echo.
choice /C YN /M "Start with voice"

if errorlevel 2 goto :skipvoice
if errorlevel 1 goto :withvoice

:withvoice
echo.
echo [VOICE] Starting XTTS server in new window...
start "XTTS Voice Server" cmd /k "call start-xtts.bat"
echo Waiting 5 seconds for XTTS to initialize...
timeout /t 5 /nobreak >nul
goto :startslunt

:skipvoice
echo.
echo [INFO] Starting without voice
echo.

:startslunt
echo ================================================
echo         Starting Slunt Bot...
echo ================================================
echo.
echo Dashboard: http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo ================================================
echo.

node server.js

pause

