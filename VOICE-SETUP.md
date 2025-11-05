# 🎤 Voice Chat with Slunt

Talk to Slunt with your voice! Natural conversation with interruptions, just like ChatGPT voice mode.

## 🚀 Quick Start

### 1. Get API Keys

**Option A: ElevenLabs (Recommended - Most Natural)**
1. Go to https://elevenlabs.io/
2. Sign up for free account
3. Go to Profile → API Keys
4. Copy your API key
5. Add to `.env`: `ELEVENLABS_API_KEY=your-key-here`

**Option B: OpenAI TTS (Good Alternative)**
- Uses your existing OpenAI API key
- Set in `.env`: `VOICE_TTS_PROVIDER=openai`

**Option C: Browser-only (Free, Basic)**
- No API keys needed!
- Set in `.env`: `VOICE_TTS_PROVIDER=browser`
- Uses browser's built-in speech synthesis

### 2. Enable Voice in `.env`

```properties
ENABLE_VOICE=true
VOICE_STT_PROVIDER=browser
VOICE_TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your-api-key-here
# Primary/backup ElevenLabs voices (examples)
# Jamal (primary)
ELEVENLABS_VOICE_ID=6OzrBCQf8cjERkYgzSg8
# Jemima (backup)
ELEVENLABS_BACKUP_VOICE_ID=DLsHlh26Ugcm6ELvS0qi
# Keep voice replies fast and on-topic (recommended)
VOICE_LITE=true
```

### 3. Start the Bot

```bash
npm start
```

### 4. Open Voice Chat

Open in your browser:
```
http://localhost:3001/voice-chat.html
```

### 5. Click "Start Listening" and Talk!

- Speak naturally - Slunt will hear you and respond
- Interrupt him anytime - just start talking
- Works while streaming on Twitch!

## 🎙️ Features

### ✅ **Natural Conversation**
- Real-time speech recognition
- Instant responses
- Low latency

### ✅ **Interrupt Anytime**
- Cut Slunt off mid-sentence
- He'll listen to your new input
- Just like talking to a real person

### ✅ **Works While Streaming**
- Keep voice chat open in browser
- Stream your game on Twitch/YouTube
- Slunt talks to you while you stream
- Viewers hear Slunt through your mic

### ✅ **Learning from You**
- Slunt's vocabulary evolves
- Picks up your speech patterns
- Learns from conversations
- Adapts his responses

## 🎮 Streaming Setup

### Option 1: Basic (Slunt talks through speakers)
1. Open `voice-chat.html` in browser
2. Make sure your mic captures your speakers
3. Stream as normal - Slunt's voice gets picked up

### Option 2: Advanced (Virtual Audio Cable)
1. Install VB-Audio Virtual Cable
2. Route Slunt's audio to virtual input
3. Add virtual input to OBS/streaming software
4. Full control over Slunt's volume vs your voice

### Option 3: Direct Integration (Coming Soon)
- OBS plugin for direct audio injection
- Separate tracks for you vs Slunt
- Full audio mixing control

## 🗣️ Voice Options

### ElevenLabs Voices

Popular voice IDs:
- `ErXwobaYiN019PkySvjV` - Antoni (default, clear male)
- `EXAVITQu4vr4xnSDxMaL` - Bella (female)
- `21m00Tcm4TlvDq8ikWAM` - Rachel (calm female)
- `AZnzlk1XvdvUeBnXmlld` - Domi (strong male)

Browse all voices: https://elevenlabs.io/voice-library

### OpenAI Voices

- `alloy` - Neutral
- `echo` - Male, clear
- `fable` - British, narration
- `onyx` - Deep male (default)
- `nova` - Female, energetic
- `shimmer` - Female, warm

## 🔧 Advanced Configuration

### Voice-Fast / Lite Mode (Recommended)

For snappier, on-topic voice replies, enable the lightweight generation path:

```properties
# .env
VOICE_LITE=true   # default is true; set to false to use full brain context for voice
```

Lite mode:
- Uses minimal recent chat context
- Forces 1–2 short sentences, strictly on-topic
- Skips heavy systems to reduce latency
- Falls back to full pipeline automatically on errors

### Voice Speed & Pitch

```javascript
// In voiceManager.js
voiceSpeed: 1.2,  // 0.5 - 2.0 (1.0 = normal)
voicePitch: 0.9,  // 0.5 - 2.0 (1.0 = normal)
```

### Interrupt Sensitivity

```javascript
// How fast to detect you started talking
silenceThreshold: 500,  // milliseconds
```

### Audio Quality

ElevenLabs settings:
- `stability`: 0.5 (0-1, higher = more consistent)
- `similarity_boost`: 0.75 (0-1, higher = more like voice sample)
- `style`: 0.5 (0-1, higher = more expressive)

## 🐛 Troubleshooting

### "Speech recognition not supported"
- Use Chrome or Edge browser
- Safari has limited support
- Firefox may need config changes

### "Microphone not working"
- Allow microphone access in browser
- Check browser permissions
- Try HTTPS instead of HTTP (some browsers require it)

### "No API key configured"
- Make sure `.env` has your API key
- Restart the server after adding keys
- Check spelling of environment variables

### "Audio not playing"
- Check browser audio permissions
- Verify speaker volume
- Check browser console for errors

### "Voice is robotic"
- Use ElevenLabs for best quality
- Try different voice IDs
- Adjust stability/similarity settings

## 💡 Tips

1. **Speak clearly** - but naturally, no need to slow down
2. **Use a good mic** - quality in = quality conversation
3. **Reduce background noise** - helps recognition accuracy
4. **Interrupt freely** - Slunt won't get offended!
5. **Keep the window open** - minimize but don't close it

## 🔮 Coming Soon

- [ ] Multiple simultaneous speakers
- [ ] Voice activity detection (no button needed)
- [ ] Emotion detection from voice tone
- [ ] Background conversation mode
- [ ] Mobile app support
- [ ] Custom voice training
- [ ] Multi-language support

## 📝 Notes

- **Browser STT is free** but less accurate
- **ElevenLabs costs money** after free tier (~$5/month for casual use)
- **OpenAI TTS** uses your existing credits
- Audio files are auto-cleaned after 24 hours
- Works best with headphones to avoid feedback

---

**Questions? Issues?** Open an issue on GitHub or ask in Discord!
