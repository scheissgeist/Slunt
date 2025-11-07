# Slunt Remote Voice Client Setup Guide

This guide will help you set up a remote voice client to talk to Slunt, where the processing happens on a host machine and the voice interaction happens on a client machine.

---

## Architecture Overview

```
┌─────────────────────────────┐         Network           ┌──────────────────────────────┐
│   CLIENT MACHINE            │  ←─────────────────────→  │   HOST MACHINE (SERVER)      │
│   (Voice Terminal)          │                           │                              │
│                             │                           │                              │
│  - Web Browser              │                           │  - Node.js Server            │
│  - Microphone               │                           │  - Slunt AI Bot              │
│  - Speakers                 │                           │  - Ollama (AI Model)         │
│  - Speech Recognition       │                           │  - TTS Provider (Piper/etc)  │
│  - Audio Playback           │                           │  - Voice Manager             │
│                             │                           │  - Memory/Context            │
└─────────────────────────────┘                           └──────────────────────────────┘
```

**What happens:**
1. Client machine records your voice → transcribes to text
2. Text sent to host server over network
3. Host runs Slunt AI to generate response
4. Host synthesizes speech to audio file
5. Audio file sent back to client
6. Client plays audio through speakers

---

## Part 1: Host Machine Setup (Server)

### Prerequisites

- Node.js 18+ installed
- Slunt repository cloned
- All dependencies installed (`npm install`)

### 1.1 Configure Environment

Create/edit `.env` file with these settings:

```bash
# Server Configuration
PORT=3000

# AI Model (local - recommended for low latency)
# Make sure Ollama is installed and running with llama3.2
# Install: https://ollama.ai/download
# Pull model: ollama pull llama3.2

# TTS Provider (choose one)
# Option 1: Local Piper (fastest, no API costs)
VOICE_TTS_PROVIDER=piper
PIPER_EXECUTABLE=piper
PIPER_MODEL=en_US-lessac-medium.onnx

# Option 2: ElevenLabs (high quality, requires API key)
# VOICE_TTS_PROVIDER=elevenlabs
# ELEVENLABS_API_KEY=sk_your_key_here
# ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Option 3: OpenAI TTS (good quality, requires API key)
# VOICE_TTS_PROVIDER=openai
# OPENAI_API_KEY=sk_your_key_here
# VOICE_OPENAI_VOICE=verse

# Network Access
ALLOWED_ORIGINS=*  # Allow all origins (or specify specific IPs)
```

### 1.2 Install Ollama (Local AI)

**Why Ollama?** Low latency (~500ms response time) compared to cloud APIs

**Install:**
- Windows: Download from https://ollama.ai/download
- Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
- Mac: `brew install ollama`

**Pull the model:**
```bash
ollama pull llama3.2
```

**Verify it's running:**
```bash
ollama list
# Should show llama3.2:latest
```

### 1.3 Install Piper TTS (Optional - for local TTS)

**Why Piper?** Fast local TTS with no API costs

**Install:**
- Windows: Download from https://github.com/rhasspy/piper/releases
- Linux: `wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz && tar -xzf piper_amd64.tar.gz`
- Mac: Download from releases page

**Download voice model:**
```bash
# Download en_US-lessac-medium (good quality, fast)
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
```

Place these files in the Slunt directory or specify full path in `.env`.

### 1.4 Configure Firewall

**Windows:**
```powershell
# Allow incoming connections on port 3000
New-NetFirewallRule -DisplayName "Slunt Voice Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Linux:**
```bash
sudo ufw allow 3000/tcp
```

**Mac:**
System Preferences → Security & Privacy → Firewall → Firewall Options → Add port 3000

### 1.5 Find Your Server IP Address

**Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.1.100
```

**Linux/Mac:**
```bash
ip addr show
# or
ifconfig
# Look for inet address (e.g., 192.168.1.100)
```

**Write this down - you'll need it for the client!**

### 1.6 Start the Server

```bash
npm start
```

**You should see:**
```
✅ [Port] 3000 is available
🎤 [Voice] Voice Manager initialized
   STT Provider: google
   TTS Provider: piper
   Interrupts: Enabled
🚀 Slunt server running on http://0.0.0.0:3000
```

**Test the server from the host machine:**
Open browser to: `http://localhost:3000/metrics`

You should see JSON with server stats.

---

## Part 2: Client Machine Setup (Voice Terminal)

### Prerequisites

- Modern web browser (Chrome or Edge recommended)
- Microphone connected
- Speakers/headphones connected
- Network access to host machine

### 2.1 Connect to the Voice Client

**In your web browser, navigate to:**
```
http://<server-ip>:3000/voice-client
```

Replace `<server-ip>` with the IP address you found in step 1.5.

**Example:**
```
http://192.168.1.100:3000/voice-client
```

### 2.2 Configure the Client

1. **Server URL:** Should auto-populate with your current URL. If not, enter:
   ```
   http://192.168.1.100:3000
   ```

2. **Username:** Enter your name (default: "You")

3. Click **"Connect"** button

**You should see:**
- Connection status turns green: "Connected ●"
- System message: "✅ Connected to Slunt server"
- Control buttons become enabled

### 2.3 Start Talking to Slunt

1. Click **"🎤 Start Listening"** button
2. Grant microphone permission when prompted
3. Button turns green and shows "🔴 Listening..."
4. Start speaking!

**Example conversation:**
```
You: "Hey Slunt, what's up?"
[Audio plays]: "yo what's good"

You: "Did you see that video about AI?"
[Audio plays]: "nah what video?"

You: "The one about GPT-4"
[Audio plays]: "oh yeah that shit's wild"
```

### 2.4 Controls

- **🎤 Start/Stop Listening:** Toggle voice input
- **⏸️ Interrupt:** Stop Slunt mid-sentence
- **🗑️ Clear Memory:** Reset conversation memory
- **Reconnect:** Reconnect to server if disconnected

---

## Part 3: Troubleshooting

### Client Can't Connect

**Error:** "Connection failed: timeout"

**Solutions:**
1. Verify server is running on host machine
2. Check firewall settings on host machine
3. Ping the server from client: `ping 192.168.1.100`
4. Try accessing metrics endpoint: `http://192.168.1.100:3000/metrics`
5. Check both machines are on the same network
6. Try disabling firewall temporarily to test

### No Audio Playback

**Error:** Audio URL returns 404

**Solutions:**
1. Check `/temp/audio` directory exists on server
2. Verify TTS provider is configured correctly
3. Check server logs for TTS errors
4. Test TTS manually: `curl http://192.168.1.100:3000/api/voice/status`

### Speech Recognition Not Working

**Error:** "Speech recognition not supported"

**Solutions:**
1. Use Chrome or Edge browser (Safari doesn't support Web Speech API well)
2. Grant microphone permission
3. Check microphone is working in system settings
4. Try a different browser

### Slunt Not Responding

**Error:** Long delays or no response

**Solutions:**
1. Check Ollama is running: `ollama list`
2. Check server logs for AI engine errors
3. Verify TTS provider credentials (if using API)
4. Check network latency: `ping 192.168.1.100`
5. Look at `/metrics` endpoint for errors

### High Latency

**Response takes 5+ seconds**

**Solutions:**
1. Use local Ollama instead of OpenAI API
2. Use local Piper TTS instead of ElevenLabs/OpenAI
3. Reduce network latency (use wired connection)
4. Check server CPU usage (AI inference is CPU-intensive)
5. Close other applications on host machine

---

## Part 4: Advanced Configuration

### 4.1 Use Multiple Clients

You can connect multiple client machines to the same server! Each client gets its own conversation memory.

**Note:** Voice focus mode means only one client should be actively talking at a time, or memory will get mixed.

### 4.2 Remote Access Over Internet

**WARNING:** This opens your server to the internet. Use at your own risk!

**Steps:**
1. Configure port forwarding on your router (port 3000 → host machine IP)
2. Find your public IP: `curl ifconfig.me`
3. Update client URL to: `http://<public-ip>:3000/voice-client`
4. **STRONGLY RECOMMENDED:** Add authentication, use HTTPS, restrict IPs

### 4.3 Custom TTS Voices

**ElevenLabs Custom Voice:**
1. Go to ElevenLabs voice library
2. Choose a voice, copy Voice ID
3. Update `.env`: `ELEVENLABS_VOICE_ID=your_voice_id`

**Piper Custom Voice:**
1. Browse voices: https://rhasspy.github.io/piper-samples/
2. Download `.onnx` and `.onnx.json` files
3. Update `.env`: `PIPER_MODEL=/path/to/voice.onnx`

### 4.4 Adjust Voice Response Style

Edit [src/voice/VoicePromptSystem.js](src/voice/VoicePromptSystem.js) to customize:
- Personality rules
- Response length
- Tone and style
- Verbal quirks

### 4.5 Monitor Server Performance

**View metrics:**
```bash
curl http://192.168.1.100:3000/metrics | jq
```

**Key metrics:**
- `uptimeSec`: How long server has been running
- `voice.messagesHeard`: Total voice inputs
- `voice.messagesSaid`: Total voice outputs
- `memoryUsage`: Server memory usage

---

## Part 5: Network Diagram & Flow

### 5.1 Network Flow

```
Client Browser
    ↓
    ↓ [Socket.IO WebSocket]
    ↓ Event: 'voice:speech' { text: "hey" }
    ↓
Host Server (Port 3000)
    ↓
    ↓ [Internal Processing]
    ↓
ChatBot.generateResponse()
    ↓
    ↓ [Local API Call]
    ↓
Ollama (Port 11434)
    ↓ AI Response: "yo what's good"
    ↓
Voice Manager
    ↓ [Local TTS]
    ↓
Piper TTS
    ↓ Audio File: /temp/audio/voice_123.mp3
    ↓
Server HTTP Response
    ↓
    ↓ [Socket.IO WebSocket]
    ↓ Event: 'voice:response' { text: "yo", audioUrl: "/temp/audio/voice_123.mp3" }
    ↓
Client Browser
    ↓ Fetch audio file
    ↓ GET http://192.168.1.100:3000/temp/audio/voice_123.mp3
    ↓
Client Browser
    ↓ Play audio via <audio> element
    ↓
Speakers
```

### 5.2 Port Usage

| Port | Service | Purpose |
|------|---------|---------|
| 3000 | Slunt HTTP/WebSocket | Main server, voice client |
| 11434 | Ollama | Local AI inference |
| 3010 | Voice Service (optional) | TTS microservice if enabled |

---

## Part 6: Security Considerations

### Current Setup (Development)

- ❌ No authentication
- ❌ No encryption (HTTP)
- ❌ No rate limiting per client
- ✅ CORS open to all origins

**This is fine for local network testing.**

### Production Recommendations

1. **Add Authentication:**
   - Token-based auth for Socket.IO
   - Password protection for voice client page

2. **Enable HTTPS/WSS:**
   - Use Let's Encrypt for SSL certificate
   - Update client to use `wss://` instead of `ws://`

3. **Restrict CORS:**
   - Set `ALLOWED_ORIGINS` env var to specific IPs
   - Example: `ALLOWED_ORIGINS=http://192.168.1.50,http://192.168.1.51`

4. **Add Rate Limiting:**
   - Limit requests per IP
   - Prevent abuse/spam

5. **Firewall Rules:**
   - Only allow specific client IPs
   - Use VPN for remote access

---

## Part 7: Quick Start Checklist

### Host Machine ✓

- [ ] Node.js installed
- [ ] Slunt repo cloned and dependencies installed
- [ ] `.env` configured with TTS provider
- [ ] Ollama installed and `llama3.2` pulled
- [ ] Piper TTS installed (if using local TTS)
- [ ] Firewall allows port 3000
- [ ] Server started: `npm start`
- [ ] Server accessible at `http://localhost:3000/metrics`

### Client Machine ✓

- [ ] Chrome/Edge browser open
- [ ] Microphone connected and working
- [ ] Speakers/headphones connected
- [ ] Navigated to `http://<server-ip>:3000/voice-client`
- [ ] Connected to server (green status)
- [ ] Microphone permission granted
- [ ] Can hear audio playback

---

## Part 8: Example Session

**Terminal Output (Host):**
```
✅ [Port] 3000 is available
🎤 [Voice] Voice Manager initialized
   STT Provider: google
   TTS Provider: piper
   Interrupts: Enabled
🚀 Slunt server running on http://0.0.0.0:3000

🎤 [Voice] Heard: "hey what's up" from You
🤖 [AI] Generating response for voice...
🗣️ [Voice] Slunt responds: "yo what's good"
✅ [Voice] Piper audio generated (1.2s)
```

**Browser UI (Client):**
```
┌─────────────────────────────────────────┐
│  🎤 SLUNT VOICE CLIENT                  │
│  Connected ●                            │
├─────────────────────────────────────────┤
│  Server URL: http://192.168.1.100:3000 │
│  Username: Sean                         │
├─────────────────────────────────────────┤
│  You: hey what's up                     │
│  Slunt: yo what's good                  │
│  You: did you see that video?           │
│  Slunt: nah what video?                 │
├─────────────────────────────────────────┤
│  [Connect] [🔴 Listening...] [⏸️] [🗑️]  │
└─────────────────────────────────────────┘
```

---

## Part 9: FAQ

**Q: Can I use this over WiFi?**
A: Yes! As long as both machines are on the same network.

**Q: Can I use this over the internet?**
A: Yes, but you need to configure port forwarding and use proper security (HTTPS, auth).

**Q: How much latency should I expect?**
A: With local Ollama + Piper: 1.5-2.5 seconds. With cloud APIs: 2.5-4.5 seconds.

**Q: Can multiple people talk to Slunt at once?**
A: Technically yes, but voice memory will get mixed. Better to use one client at a time.

**Q: Does this work on mobile?**
A: Yes! Open the voice client URL in Chrome on iOS/Android. May need to grant mic permissions.

**Q: Can I use a different AI model?**
A: Yes! Edit `chatBot.js` to use different Ollama models or OpenAI GPT-4.

**Q: Can I customize Slunt's voice?**
A: Yes! Use different TTS providers or voice IDs (see Advanced Configuration).

**Q: What if I don't have Ollama?**
A: You can use OpenAI API instead. Set `OPENAI_API_KEY` in `.env` and Slunt will auto-switch.

**Q: Does this cost money?**
A: Local setup (Ollama + Piper) is free. API providers (OpenAI, ElevenLabs) charge per use.

**Q: Can I run the client on Raspberry Pi?**
A: Yes! As long as it has a browser and network access.

---

## Part 10: Getting Help

**Check logs:**
```bash
# Server logs
tail -f logs/slunt.log

# Real-time debugging
VERBOSE_LOGGING=true npm start
```

**Test connectivity:**
```bash
# From client machine
ping 192.168.1.100
curl http://192.168.1.100:3000/metrics
```

**Common issues:**
- See VOICE_CLIENT_PROTOCOL.md for detailed protocol info
- Check firewall settings on both machines
- Verify all dependencies are installed
- Ensure Ollama is running: `ollama list`
- Check TTS provider credentials

**Still stuck?**
- Check GitHub issues: https://github.com/anthropics/claude-code/issues
- Review server logs for error messages
- Verify all prerequisites are met

---

## Success! 🎉

You should now have:
- ✅ Host machine running Slunt AI
- ✅ Client machine with voice interface
- ✅ Real-time voice conversation with Slunt
- ✅ Low latency responses (~2 seconds)
- ✅ Natural voice output

**Have a conversation with Slunt!** 🎤
