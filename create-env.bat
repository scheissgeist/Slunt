@echo off
echo ================================================
echo    SLUNT BOT - .env File Creator
echo ================================================
echo.
echo This will help you create a .env file
echo.

if exist ".env" (
    echo WARNING: .env file already exists!
    choice /C YN /M "Do you want to overwrite it"
    if errorlevel 2 goto :cancel
)

echo.
echo ================================================
echo Creating .env file...
echo ================================================
echo.

(
echo # SLUNT BOT Configuration
echo # Created: %date% %time%
echo.
echo # AI Provider - REQUIRED
echo XAI_API_KEY=your_grok_api_key_here
echo AI_PROVIDER=grok
echo XAI_MODEL=grok-2-1212
echo.
echo # Twitch - REQUIRED for Twitch
echo TWITCH_USERNAME=sluntbot
echo TWITCH_OAUTH_TOKEN=oauth:your_token_here
echo TWITCH_CHANNELS=broteam
echo.
echo # Discord - REQUIRED for Discord
echo DISCORD_TOKEN=your_discord_bot_token
echo DISCORD_CLIENT_ID=your_application_id
echo DISCORD_GUILD_IDS=your_server_id
echo.
echo # Voice - Optional
echo VOICE_TTS_PROVIDER=xtts
echo XTTS_SERVER_URL=http://localhost:5002
echo ENABLE_VOICE=true
echo.
echo # Coolhole - Disabled by default
echo DISABLE_COOLHOLE=true
echo COOLHOLE_ENABLED=false
echo ENABLE_COOLHOLE=false
echo.
echo # Server Config
echo PORT=3000
echo NODE_ENV=production
echo LOG_LEVEL=info
echo.
echo # Features
echo VISION_ENABLED=true
echo MEMORY_ENABLED=true
echo LEARNING_ENABLED=true
echo PROACTIVE_MESSAGING=true
) > .env

echo [OK] .env file created!
echo.
echo ================================================
echo NEXT STEPS:
echo ================================================
echo.
echo 1. Edit .env file with your credentials:
echo    - Get Grok API key: https://console.x.ai/
echo    - Get Twitch token: https://twitchtokengenerator.com/
echo    - Create Discord bot: https://discord.com/developers/applications
echo.
echo 2. Open .env in Notepad:
echo    notepad .env
echo.
echo 3. Fill in your actual values
echo.
echo 4. Save and run: node server.js
echo.
echo See START_HERE.md for detailed instructions
echo.
echo ================================================
pause

goto :end

:cancel
echo.
echo Cancelled. Existing .env file preserved.
echo.
pause

:end

