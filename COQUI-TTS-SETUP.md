# 🎤 Coqui TTS Setup Guide

## Why Coqui TTS?

- **100% Local** - Runs entirely on your PC, no cloud dependency
- **Free** - No API costs, ever
- **High Quality** - VITS and XTTS models sound excellent
- **Voice Cloning** - Clone any voice with 6+ seconds of audio
- **Fast** - Near real-time with GPU support
- **Privacy** - Your voice data never leaves your machine

## Installation

### 1. Install Coqui TTS

```bash
# Install Coqui TTS (Python 3.9-3.11 recommended)
pip install TTS

# Or with GPU support (NVIDIA only)
pip install TTS[gpu]
```

### 2. Start the TTS Server

```bash
# Start with the recommended high-quality English model
tts-server --model_name tts_models/en/vctk/vits

# The server will start on http://localhost:5002
```

### 3. Configure Slunt

In your `.env` file, change:

```bash
# Switch from ElevenLabs to Coqui
VOICE_TTS_PROVIDER=coqui

# Coqui settings (defaults are fine to start)
COQUI_SERVER_URL=http://localhost:5002
COQUI_MODEL=tts_models/en/vctk/vits
COQUI_SPEAKER=p267  # Female voice, clear and natural
COQUI_LANGUAGE=en
```

### 4. Restart Slunt

```bash
npm start
```

## Available Voices

The VCTK model has **108 different speakers**! Try these popular ones:

### Female Voices:
- `p267` - Clear, professional (default)
- `p244` - Young, energetic
- `p225` - Warm, friendly
- `p229` - Mature, authoritative

### Male Voices:
- `p226` - Deep, calm
- `p227` - Young, casual
- `p232` - Professional, clear
- `p245` - Energetic, upbeat

**Change the speaker in `.env`:**
```bash
COQUI_SPEAKER=p226  # Switch to male deep voice
```

## Available Models

### English Models:

1. **`tts_models/en/vctk/vits`** (Recommended)
   - 108 voices
   - High quality
   - Fast
   - Good for Slunt!

2. **`tts_models/en/ljspeech/vits`**
   - Single female voice
   - Very natural
   - Fastest

3. **`tts_models/en/ljspeech/glow-tts`**
   - Single female voice
   - Good quality
   - Very fast

### Multilingual Models:

4. **`tts_models/multilingual/multi-dataset/xtts_v2`** (ADVANCED)
   - Voice cloning support
   - 13 languages
   - Requires more VRAM (4GB+)
   - Can clone voices from 6+ seconds of audio

## Voice Cloning (Advanced)

To clone a voice with XTTS:

```bash
# Start with XTTS model
tts-server --model_name tts_models/multilingual/multi-dataset/xtts_v2

# Provide a reference audio file (6+ seconds)
# Update in .env:
COQUI_MODEL=tts_models/multilingual/multi-dataset/xtts_v2
COQUI_REFERENCE_AUDIO=/path/to/voice-sample.wav
```

## Troubleshooting

### Server won't start
```bash
# Check Python version (needs 3.9-3.11)
python --version

# Reinstall Coqui
pip uninstall TTS
pip install TTS
```

### "Connection refused" error
```bash
# Make sure the server is running
tts-server --model_name tts_models/en/vctk/vits

# Check it's on port 5002
curl http://localhost:5002/api/tts
```

### Slow generation
```bash
# Install GPU version (NVIDIA only)
pip install TTS[gpu]

# Or use a faster model
tts-server --model_name tts_models/en/ljspeech/glow-tts
```

### Out of memory
```bash
# Use a smaller model
tts-server --model_name tts_models/en/ljspeech/vits

# Or reduce batch size (in Coqui config)
```

## Performance Tips

1. **Use GPU** if you have NVIDIA graphics card (5-10x faster)
2. **Keep server running** - First generation is slow, subsequent are fast
3. **Use VITS models** - Best balance of quality and speed
4. **Limit response length** - Shorter text = faster generation

## Comparing to ElevenLabs

| Feature | Coqui TTS | ElevenLabs |
|---------|-----------|------------|
| Cost | **Free** | $1-$99/month |
| Quality | Very good | Excellent |
| Speed | Fast (with GPU) | Very fast |
| Voices | 100+ | 1000+ |
| Voice cloning | Yes (XTTS) | Yes (Pro+) |
| Privacy | **100% local** | Cloud |
| Setup | Moderate | Easy |

## Next Steps

1. ✅ Install Coqui TTS
2. ✅ Start the server
3. ✅ Change `.env` to use Coqui
4. ✅ Test different speakers
5. 🎯 (Optional) Try voice cloning with XTTS

## Resources

- **Coqui TTS GitHub**: https://github.com/coqui-ai/TTS
- **Model List**: https://github.com/coqui-ai/TTS/wiki/Released-Models
- **XTTS Voice Cloning**: https://github.com/coqui-ai/TTS/wiki/XTTS
- **Discord Community**: https://discord.gg/coqui-ai

---

**Your setup for going fully local is ready!** 🚀
