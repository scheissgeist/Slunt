# 🤖 SLUNT BOT - Complete Setup Guide

## 📋 Overview

**Slunt** is a multi-platform AI chatbot that works on:
- 🎮 **Coolhole** (CyTube-based platform - original platform)
- 💬 **Discord** (supports threads and channels)
- 📺 **Twitch** (chat integration)

**Key Features:**
- 🎤 **Voice TTS** using fine-tuned XTTS (Hoff voice)
- 🧠 **Advanced AI** with 25+ personality systems
- 💾 **Memory & Learning** across platforms
- 🎨 **Vision** capabilities (screen capture, image analysis)

---

## 🗂️ Project Structure

```
D:\Slunt\
├── Slunt\                    # Main bot codebase (legacy location)
│   ├── src/
│   │   ├── bot/             # Chatbot logic (chatBot.js)
│   │   ├── io/              # Platform clients (Discord, Twitch)
│   │   ├── ai/              # AI systems (25+ modules)
│   │   ├── voice/           # Voice/TTS management
│   │   └── services/        # Core services
│   ├── hoff_voice_server.py # XTTS voice server
│   └── start-xtts.bat       # Voice server launcher
├── server.js                # Main server
├── openvoice-env/           # Python virtual environment
└── .env                     # Configuration (you need to create)
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
cd D:\Slunt
npm install
```

### Step 2: Create .env File

Create a `.env` file in `D:\Slunt\` with your credentials:

```env
# AI Provider (Required - Get from https://x.ai)
XAI_API_KEY=xai-your-key-here
AI_PROVIDER=grok

# Voice (Optional - for TTS)
VOICE_TTS_PROVIDER=xtts
ENABLE_VOICE=true

# Twitch (Required for Twitch chat)
TWITCH_USERNAME=your_bot_username
TWITCH_OAUTH_TOKEN=oauth:your_token_here
TWITCH_CHANNELS=broteam

# Discord (Required for Discord)
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_app_id
DISCORD_GUILD_IDS=your_server_id

# Coolhole (Optional - original platform)
COOLHOLE_ENABLED=true

# Server
PORT=3000
```

### Step 3: Start Slunt

**Option A: Without Voice (Simple)**
```bash
node server.js
```

**Option B: With Voice (Requires XTTS setup)**
```bash
# Terminal 1: Start XTTS voice server
start-xtts.bat

# Terminal 2: Start Slunt
node server.js
```

---

## 🎤 Voice Setup (XTTS)

### Requirements
- Python 3.10+ installed
- CUDA GPU (recommended) or CPU
- ~5GB disk space for model
- Model location: `D:\Voices\Hoff\dataset`

### First-Time Setup

1. **Check if Python venv exists:**
   ```bash
   dir openvoice-env
   ```

2. **If missing, create it:**
   ```bash
   python -m venv openvoice-env
   ```

3. **Start XTTS server:**
   ```bash
   start-xtts.bat
   ```
   
   **First run will:**
   - Install PyTorch (~2GB download)
   - Install TTS library
   - Install Flask/CORS
   - Load model (~30 seconds)
   
   **Look for:** `✅ [OK] Hoff Voice Server Ready!`

### XTTS Server Details
- **Port:** 5002
- **Health Check:** http://localhost:5002/health
- **Model:** Fine-tuned Hoff XTTS v2 (5.6GB)
- **Performance:** 1-2 second voice generation

---

## 📺 Twitch Setup

### 1. Get OAuth Token
- Go to https://twitchtokengenerator.com/
- Click "Bot Chat Token"
- Login with your bot account
- Copy the OAuth token (starts with `oauth:`)

### 2. Add to .env
```env
TWITCH_USERNAME=your_bot_username
TWITCH_OAUTH_TOKEN=oauth:paste_token_here
TWITCH_CHANNELS=broteam
```

### 3. Test
```bash
node server.js
```

**Look for:**
```
✅ [Twitch] Connected to irc-ws.chat.twitch.tv:443
📺 [Twitch] Joined channels: broteam
```

---

## 💬 Discord Setup

### 1. Create Discord Bot
- Go to https://discord.com/developers/applications
- Click "New Application"
- Go to "Bot" section
- Enable these intents:
  - ✅ Server Members Intent
  - ✅ Message Content Intent
- Copy the token

### 2. Invite Bot to Server
- Go to "OAuth2" > "URL Generator"
- Select scopes: `bot`
- Select permissions:
  - Read Messages/View Channels
  - Send Messages
  - Read Message History
  - Send Messages in Threads
- Copy URL and invite to server

### 3. Add to .env
```env
DISCORD_TOKEN=paste_token_here
DISCORD_CLIENT_ID=paste_client_id_here
DISCORD_GUILD_IDS=paste_server_id_here
```

### 4. Test
```bash
node server.js
```

**Look for:**
```
✅ [Discord] Connected as SluntBot#1234
```

---

## 🔧 Configuration Options

### AI Providers

Slunt supports multiple AI providers:

**Grok (Recommended)**
```env
XAI_API_KEY=xai-your-key
AI_PROVIDER=grok
XAI_MODEL=grok-2-1212
```

**Ollama (Local, Free)**
```env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
```

**Claude (Premium)**
```env
ANTHROPIC_API_KEY=sk-ant-your-key
AI_PROVIDER=claude
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### Voice Options

**XTTS (Hoff voice - Recommended)**
```env
VOICE_TTS_PROVIDER=xtts
XTTS_SERVER_URL=http://localhost:5002
```

**ElevenLabs (Cloud, paid)**
```env
VOICE_TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=voice_id
```

**OpenAI (Cloud, paid)**
```env
VOICE_TTS_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
VOICE_OPENAI_VOICE=alloy
```

---

## 🎯 Testing Slunt

### 1. Check Server Status
```
http://localhost:3000
```
Opens the live dashboard showing:
- Connected platforms
- Recent messages
- Bot status

### 2. Test Twitch
- Go to twitch.tv/broteam (or your channel)
- Send a message mentioning Slunt
- Slunt should respond

### 3. Test Discord
- Go to your Discord server
- Mention @Slunt in a channel
- Or start a thread and message Slunt
- Slunt should respond

### 4. Test Voice (if enabled)
- Go to http://localhost:3000
- Click the voice button
- Speak into microphone
- Slunt should respond with voice

---

## 🐛 Troubleshooting

### Slunt Won't Start

**Error: Cannot find module**
```bash
npm install
```

**Error: Port 3000 already in use**
```env
PORT=3001  # Change in .env
```

### Twitch Won't Connect

**Check:**
- OAuth token starts with `oauth:`
- Username is lowercase
- Channel name is correct (no # prefix)

**Test credentials:**
```bash
# Should show connection attempt
node server.js
```

### Discord Won't Connect

**Check:**
- Token is correct (no spaces)
- Bot has Message Content Intent enabled
- Bot is invited to server

### Voice Not Working

**Check XTTS server:**
```bash
curl http://localhost:5002/health
```

**Should return:**
```json
{"status": "ready", "model": "xtts_v2_hoff"}
```

**If not running:**
```bash
start-xtts.bat
```

**Check model exists:**
```bash
dir D:\Voices\Hoff\dataset
```

### Slunt Not Responding

**Check console for:**
```
✅ [PlatformManager] Initialized 3/3 platforms
```

**If not all platforms initialized:**
- Check .env configuration
- Check credentials
- Check network connection

---

## 📊 Dashboard

Once running, access the dashboard at:
- **Main Dashboard:** http://localhost:3000
- **Live Dashboard:** http://localhost:3000/live-dashboard.html

**Features:**
- Real-time message feed
- Platform connection status
- Bot statistics
- Voice controls

---

## 🎮 Bot Commands

### User Commands
- `!help` - Show available commands
- `!balance` or `!cp` - Check CoolPoints
- `!daily` - Claim daily bonus
- `!stats` - Show user statistics

### Admin Commands (if configured)
- `!award <user> <amount>` - Award points
- `!deduct <user> <amount>` - Deduct points

---

## 📝 Notes

### Coolhole
- Original platform, optional now
- CyTube-based synchronized video watching
- Requires Coolhole credentials (not covered here)

### Multi-Platform Memory
- Slunt remembers conversations across platforms
- User "TestUser" on Twitch = same as Discord
- Maintains relationships, preferences, history

### AI Systems
- **25+ Systems:** Personality, memory, learning, emotions, etc.
- **Alpha:** Full complexity (8,248 lines)
- **Beta:** Minimal version (250 lines) - experimental

### Voice Features
- Push-to-talk web interface
- Real-time transcription
- Context-aware responses
- Fine-tuned Hoff voice (XTTS)

---

## 🚨 Quick Fix Commands

```bash
# Restart everything
taskkill /F /IM node.exe
taskkill /F /IM python.exe
npm start

# Check if services are running
netstat -ano | findstr :3000  # Slunt server
netstat -ano | findstr :5002  # XTTS server

# View logs
type logs\slunt.log
type logs\slunt-error.log

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:5002/health
```

---

## 📚 Additional Documentation

- **SETUP-CHECKLIST.md** - Detailed setup checklist
- **VOICE_AND_TWITCH_FIX.md** - Voice/Twitch troubleshooting
- **MULTI-PLATFORM-GUIDE.md** - Multi-platform details
- **BETA_README.md** - Beta version info

---

## 🎉 Success Checklist

- [ ] `npm install` completed
- [ ] `.env` file created with credentials
- [ ] `node server.js` starts without errors
- [ ] Dashboard loads at http://localhost:3000
- [ ] Twitch connection shows ✅
- [ ] Discord connection shows ✅
- [ ] Slunt responds to messages
- [ ] (Optional) XTTS server running
- [ ] (Optional) Voice responses working

---

**Ready to start? Run `node server.js` and watch the console!**

Good luck! 🚀

