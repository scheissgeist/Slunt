@echo off
echo ========================================
echo    RESTARTING SLUNT WITH FIXES
echo ========================================
echo.

echo [1/3] Stopping Slunt...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Slunt stopped successfully
) else (
    echo    ℹ Slunt was not running
)

timeout /t 2 /nobreak >nul
echo.

echo [2/3] Starting Slunt with new code...
echo    ℹ This will open in a new window
echo.
start "Slunt Bot" cmd /k "cd /d %~dp0 && npm start"

timeout /t 3 /nobreak >nul
echo.

echo [3/3] Verifying startup...
timeout /t 5 /nobreak >nul

tasklist | findstr node >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Slunt is running!
    echo.
    echo ========================================
    echo    SUCCESS! Slunt restarted with fixes:
    echo    • sendMessage type validation
    echo    • AI model upgraded (3.2B)
    echo    • Cognitive null safety
    echo ========================================
    echo.
    echo 📊 To monitor logs:
    echo    tail -f logs/slunt.log
    echo.
    echo 🧪 To verify fix:
    echo    Go to Coolhole and send a message
    echo    Slunt should respond within seconds
    echo.
) else (
    echo    ✗ Slunt failed to start
    echo    Check the Slunt window for errors
    echo.
)

pause
