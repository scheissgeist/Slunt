@echo off
echo 🤖 Slunt Bot 24/7 Deployment Script
echo ====================================

echo.
echo 📋 Checking system requirements...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js first.
    echo 📥 Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Setting up production environment...

REM Create necessary directories
if not exist "logs" mkdir logs
if not exist "data" mkdir data  
if not exist "recordings" mkdir recordings
if not exist "public" mkdir public

echo.
echo 🎯 Choose deployment option:
echo [1] Simple 24/7 Bot (Recommended for beginners)
echo [2] Advanced Learning System (Full features)
echo [3] Visual Monitoring Only (Development/Testing)
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto simple
if "%choice%"=="2" goto advanced  
if "%choice%"=="3" goto visual
echo Invalid choice. Defaulting to Simple 24/7 Bot.

:simple
echo.
echo 🚀 Starting Simple 24/7 Slunt Bot...
echo 📊 Dashboard will be available at: http://localhost:3001
echo 🛑 Press Ctrl+C to stop the bot
echo.
node production-slunt-24-7.js
goto end

:advanced
echo.
echo 🧠 Starting Advanced Learning System...
echo 📊 Dashboard will be available at: http://localhost:3001
echo 🔬 Advanced analytics at: http://localhost:3001/analytics
echo 🛑 Press Ctrl+C to stop the bot
echo.
node advanced-slunt-learning.js
goto end

:visual
echo.
echo 👁️ Starting Visual Monitoring Mode...
echo 🎥 This will open a browser window for visual debugging
echo 🛑 Close the browser to stop the bot
echo.
node visual-slunt-monitor.js
goto end

:end
echo.
echo 👋 Slunt Bot deployment finished.
pause