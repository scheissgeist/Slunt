# 🚀 SLUNT BOT - QUICK START

## ✅ What I Found

I've explored your Slunt bot project and here's what you have:

### ✅ Ready to Go:
- ✅ Node modules installed
- ✅ XTTS voice model at `D:\Voices\Hoff\dataset` (5.6GB)
- ✅ Python virtual environment (`openvoice-env`)
- ✅ Ports 3000 and 5002 available
- ✅ All code files in place

### ❌ Missing:
- ❌ `.env` file with your credentials

---

## 🎯 HOW IT WORKS

**Slunt** is a multi-platform AI chatbot with these features:

1. **Multi-Platform Support:**
   - 💬 Discord (supports threads)
   - 📺 Twitch chat
   - 🎮 Coolhole (optional, can be disabled)

2. **AI Brain:**
   - Uses Grok AI (X.AI) for conversations
   - Alternative: Ollama (local, free)
   - 25+ personality systems
   - Cross-platform memory

3. **Voice (XTTS):**
   - Fine-tuned "Hoff" voice
   - 1-2 second generation time
   - GPU-accelerated (if available)
   - Optional feature

4. **Smart Features:**
   - Remembers conversations
   - Personality system
   - Learning from interactions
   - Vision/screen capture

---

## 🏃 TO GET SLUNT RUNNING (3 STEPS)

### STEP 1: Create .env File

Create a file named `.env` in `D:\Slunt\` with this content:

```env
# AI Provider (REQUIRED)
XAI_API_KEY=your_grok_api_key_here
AI_PROVIDER=grok

# Twitch (REQUIRED for Twitch)
TWITCH_USERNAME=sluntbot
TWITCH_OAUTH_TOKEN=oauth:your_token_here
TWITCH_CHANNELS=broteam

# Discord (REQUIRED for Discord)
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_application_id
DISCORD_GUILD_IDS=your_server_id

# Voice (Optional)
VOICE_TTS_PROVIDER=xtts
ENABLE_VOICE=true

# Disable Coolhole (unless you want it)
DISABLE_COOLHOLE=true

# Server
PORT=3000
```

### STEP 2: Get Your Credentials

**Grok API Key** (Required):
- Go to https://console.x.ai/
- Sign up (free credits)
- Copy API key

**Twitch OAuth Token** (Required):
- Go to https://twitchtokengenerator.com/
- Click "Bot Chat Token"
- Login with bot account
- Copy token (starts with `oauth:`)

**Discord Bot Token** (Required):
- Go to https://discord.com/developers/applications
- Create New Application
- Go to Bot section
- Enable "Message Content Intent"
- Copy token

**Discord Server ID**:
- Enable Developer Mode in Discord
- Right-click your server
- Copy Server ID

### STEP 3: Start Slunt

**Option A: Without Voice (Simple)**
```bash
node server.js
```

**Option B: With Voice**

Terminal 1:
```bash
start-xtts.bat
```
Wait for: `[OK] Hoff Voice Server Ready!`

Terminal 2:
```bash
node server.js
```

---

## 🎤 VOICE SETUP (XTTS)

You already have everything needed for voice!

**To Start XTTS Server:**
```bash
start-xtts.bat
```

**First time will:**
- Install PyTorch (~2GB, takes 5-10 minutes)
- Install TTS library
- Load model (~30 seconds)

**After first time:**
- Starts in ~30 seconds

**Check if working:**
```
http://localhost:5002/health
```

---

## 📺 TWITCH SETUP

**Current Config** (from your docs):
- Username: `sluntbot`
- Channel: `broteam`

**To Get OAuth Token:**
1. Go to https://twitchtokengenerator.com/
2. Click "Bot Chat Token"
3. Login with `sluntbot` account
4. Authorize the app
5. Copy the token (starts with `oauth:`)
6. Paste into `.env` file

**Test:**
```bash
node server.js
```

Look for:
```
✅ [Twitch] Connected to irc-ws.chat.twitch.tv:443
📺 [Twitch] Joined channels: broteam
```

Then go to `twitch.tv/broteam` and message Slunt!

---

## 💬 DISCORD SETUP (Threads Support)

**Create Bot:**
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Go to "Bot" section
4. Enable these intents:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Copy token

**Invite to Server:**
1. Go to OAuth2 > URL Generator
2. Select scopes: `bot`
3. Select permissions:
   - Read Messages/View Channels
   - Send Messages
   - Read Message History
   - Send Messages in Threads
4. Copy URL and open in browser
5. Select your server

**Test:**
```bash
node server.js
```

Look for:
```
✅ [Discord] Connected as SluntBot#1234
```

Slunt will work in:
- Regular channels (when mentioned)
- Threads (automatically)

---

## 🎮 COOLHOLE (Original Platform)

**Status:** Optional, can be disabled

Your setup already has Coolhole disabled in some docs. To fully disable:

```env
DISABLE_COOLHOLE=true
COOLHOLE_ENABLED=false
ENABLE_COOLHOLE=false
```

---

## 🖥️ DASHBOARD

Once running, open:
```
http://localhost:3000
```

**Features:**
- Real-time message feed
- Platform connection status
- Bot statistics
- Voice controls (push-to-talk)

---

## 🔍 TROUBLESHOOTING

### Slunt Won't Start

**Check console for errors:**
```bash
node server.js
```

**Common issues:**
- Missing AI_PROVIDER or XAI_API_KEY
- Port 3000 in use (change PORT in .env)
- Missing dependencies (run `npm install`)

### Twitch Not Working

**Check:**
- Token starts with `oauth:`
- Username is lowercase
- Channel name is correct (no # prefix)

**Console should show:**
```
⚠️ [Twitch] Not enabled or missing credentials
```
(If credentials are missing)

OR
```
✅ [Twitch] Connection successful!
```
(If working)

### Discord Not Working

**Check:**
- Token is correct (no spaces)
- Bot has Message Content Intent
- Bot is invited to server
- Guild ID is correct

**Console should show:**
```
✅ [Discord] Connected as YourBot#1234
```

### Voice Not Working

**Check XTTS server:**
```bash
curl http://localhost:5002/health
```

**Should return:**
```json
{"status": "ready"}
```

**If not:**
```bash
start-xtts.bat
```

---

## 📊 WHAT TO EXPECT

### Startup Logs
```
🤖 Slunt server starting...
📡 [PlatformManager] Initialized
🎮 Discord credentials found, initializing...
✅ [Discord] Connected as SluntBot#1234
📺 Twitch credentials found, initializing...
✅ [Twitch] Connected to irc-ws.chat.twitch.tv:443
📺 [Twitch] Joined channels: broteam
✅ [PlatformManager] Initialized 2/2 platforms
🌐 Server running on port 3000
```

### Dashboard
- Go to http://localhost:3000
- Live message feed
- Platform status indicators
- Voice button (if enabled)

### Bot Behavior
- **Discord:** Responds when mentioned or in threads
- **Twitch:** Responds to messages (rate-limited)
- **Memory:** Remembers users across platforms
- **Personality:** Crude, funny, no-filter chatbot

---

## 🎯 TESTING CHECKLIST

- [ ] Create .env file with credentials
- [ ] Get Grok API key
- [ ] Get Twitch OAuth token
- [ ] Create Discord bot
- [ ] Run `node server.js`
- [ ] Check dashboard at http://localhost:3000
- [ ] Test Twitch: send message in channel
- [ ] Test Discord: mention bot
- [ ] (Optional) Test voice with start-xtts.bat

---

## 📁 HELPER SCRIPTS I CREATED

- **check-config.bat** - Verify setup before starting
- **start-slunt-wizard.bat** - Guided startup with voice option
- **SLUNT_SETUP_GUIDE.md** - Comprehensive documentation
- **This file** - Quick reference

---

## 🆘 NEED HELP?

**View logs:**
```bash
type logs\slunt.log
type logs\slunt-error.log
```

**Check what's running:**
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :5002
```

**Kill and restart:**
```bash
taskkill /F /IM node.exe
taskkill /F /IM python.exe
node server.js
```

---

## 🎉 YOU'RE READY!

**Next steps:**
1. Create `.env` file (see STEP 1)
2. Fill in your API keys
3. Run `node server.js`
4. Open http://localhost:3000
5. Test in Twitch/Discord!

**The bot should:**
- ✅ Chat on Twitch
- ✅ Work in Discord (including threads)
- ✅ Have voice (if XTTS is running)
- ✅ Remember conversations
- ✅ Have personality

---

**Good luck! The bot is ready to run as soon as you add your credentials! 🚀**

