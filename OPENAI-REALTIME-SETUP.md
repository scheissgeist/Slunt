# OpenAI Realtime API Setup (ChatGPT Voice Mode)

This is **WAY better** than regular OpenAI TTS. It's the same tech ChatGPT app uses.

## Why It's Better

- **Streaming Audio**: Starts speaking instantly (not after full generation)
- **Natural Interrupts**: You can cut Slunt off mid-sentence
- **Ultra Low Latency**: ~300ms response time (vs 2-5 seconds)
- **ChatGPT Quality**: Same voices as ChatGPT app (ash, alloy, echo, etc.)
- **Intelligent**: Can handle complex conversations, remembers context

## Setup

### 1. Add Your OpenAI API Key

Edit `.env`:
```properties
OPENAI_API_KEY=sk-your-key-here
OPENAI_REALTIME_VOICE=ash  # ash (best), alloy, echo, shimmer, verse, cove
```

Get key from: https://platform.openai.com/api-keys

### 2. Switch Voice Provider

Already configured in `.env`:
```properties
VOICE_TTS_PROVIDER=openai-realtime
```

### 3. Restart Slunt

```bash
npm start
```

## Available Voices

- **ash** ⭐ - Male, natural, conversational (BEST for Slunt)
- **alloy** - Neutral, balanced
- **echo** - Male, deep
- **shimmer** - Female, bright
- **verse** - Female, warm
- **cove** - Male, smooth

## How It Works

### Traditional TTS (OpenAI/ElevenLabs)
```
You speak → AI thinks → Generate FULL audio → Play audio
[Takes 2-5 seconds before speaking starts]
```

### Realtime API
```
You speak → AI streams response → Play while generating
[Starts speaking in ~300ms]
```

### Interrupts
```
You: "Hey Slunt, tell me about—"
[Cut off mid-sentence]
You: "Actually, never mind"
Slunt: "Alright, what's up?"
[Handles interruptions naturally]
```

## Pricing

**$0.06 per minute** of audio input
**$0.24 per minute** of audio output

Example:
- 10 minute conversation with Slunt
- You talk: 5 minutes ($0.30)
- Slunt talks: 5 minutes ($1.20)
- **Total: $1.50 for 10 minutes**

Compare to:
- ElevenLabs: ~$1-2 for 10 minutes (depending on plan)
- Bark: FREE but slower (5-10 seconds per response)
- Piper: FREE but basic quality

## Testing

1. Go to http://localhost:3000/voice-demo.html
2. Click "Start Voice Chat"
3. Say something
4. Slunt responds with **streaming audio**
5. Try interrupting him mid-sentence

## Troubleshooting

### "Rate limit exceeded" Error
You hit your OpenAI quota. Either:
- Wait for quota reset
- Upgrade your OpenAI plan
- Switch to `VOICE_TTS_PROVIDER=bark` (free alternative)

### No Audio Playback
Check browser console. Realtime API sends PCM16 audio that needs proper decoding.

### WebSocket Connection Failed
Check your API key:
```bash
curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"
```

## Alternative Providers

If Realtime API is too expensive:

```properties
# Free, instant, lower quality
VOICE_TTS_PROVIDER=browser

# Free, local, high quality, fast
VOICE_TTS_PROVIDER=piper

# Free, local, expressive, slow
VOICE_TTS_PROVIDER=bark

# Paid, high quality, no streaming
VOICE_TTS_PROVIDER=openai
VOICE_TTS_PROVIDER=elevenlabs
```

## Technical Details

- **Model**: `gpt-4o-realtime-preview`
- **Protocol**: WebSocket
- **Audio Format**: PCM16 24kHz mono
- **Turn Detection**: Server VAD (Voice Activity Detection)
- **Context Window**: 128k tokens
- **Modalities**: Text + Audio (bidirectional)

## Example Use Cases

### Natural Conversation
```
You: "What do you think about..."
Slunt: [immediately starts responding]
You: "Wait, I changed my mind"
Slunt: [stops, listens, responds to new topic]
```

### Fast Back-and-Forth
```
You: "Yes or no?"
Slunt: "No"
You: "Why?"
Slunt: "Because..."
[No delays, feels like real conversation]
```

### Complex Queries
```
You: "Tell me a long story about..."
Slunt: [starts telling story immediately]
[Audio streams as he generates it]
[No waiting for full story to generate first]
```

## Status

✅ **OpenAI Realtime client created** (`src/voice/openaiRealtimeClient.js`)
✅ **Integrated into VoiceManager** (`src/voice/voiceManager.js`)
✅ **Environment configured** (`.env`)
🔄 **Bark installing** (for free alternative)

**Ready to use!** Just add your OpenAI API key and restart.
