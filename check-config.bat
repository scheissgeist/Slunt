@echo off
echo ================================================
echo    SLUNT BOT - Configuration Checker
echo ================================================
echo.

REM Check for .env file
echo Checking for .env file...
if exist ".env" (
    echo [OK] .env file exists
) else (
    echo [MISSING] .env file not found
    echo Create one using .env.template as a guide
)
echo.

REM Check for node_modules
echo Checking for dependencies...
if exist "node_modules" (
    echo [OK] node_modules folder exists
) else (
    echo [MISSING] Dependencies not installed
    echo Run: npm install
)
echo.

REM Check for XTTS model
echo Checking for XTTS voice model...
if exist "D:\Voices\Hoff\dataset\model.pth" (
    echo [OK] XTTS model found at D:\Voices\Hoff\dataset
) else (
    echo [MISSING] XTTS model not found
    echo Voice TTS will not work without this
)
echo.

REM Check for Python virtual environment
echo Checking for Python environment...
if exist "openvoice-env\Scripts\activate.bat" (
    echo [OK] Python virtual environment exists
) else (
    echo [MISSING] Python virtual environment not found
    echo Run: python -m venv openvoice-env
)
echo.

REM Check if ports are in use
echo Checking for port conflicts...
netstat -ano | findstr ":3000 " >nul 2>&1
if errorlevel 1 (
    echo [OK] Port 3000 is available
) else (
    echo [BUSY] Port 3000 is in use
    echo Slunt may fail to start
)

netstat -ano | findstr ":5002 " >nul 2>&1
if errorlevel 1 (
    echo [OK] Port 5002 is available
) else (
    echo [BUSY] Port 5002 is in use
    echo XTTS server is already running or port is blocked
)
echo.

echo ================================================
echo Configuration check complete!
echo ================================================
pause

