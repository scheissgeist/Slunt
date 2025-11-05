# Bark TTS Setup Guide

Bark is a highly realistic text-to-speech model that can generate natural-sounding speech with emotion, tone, and even background noise.

## Quick Install (Recommended)

### Option 1: Using pip (Fastest)
```bash
# Install Bark
pip install git+https://github.com/suno-ai/bark.git

# Download models (first run will auto-download ~2GB)
python -c "from bark import generate_audio; generate_audio('test')"
```

### Option 2: From Source (More Control)
```bash
# Clone repository
git clone https://github.com/suno-ai/bark.git
cd bark

# Install dependencies
pip install -r requirements.txt

# Install Bark
pip install .
```

## Start Bark Server

Create a simple server file `bark_server.py`:

```python
from flask import Flask, request, send_file
from bark import generate_audio, SAMPLE_RATE
import numpy as np
import io
from scipy.io import wavfile

app = Flask(__name__)

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    text = data.get('text', '')
    voice = data.get('voice', 'v2/en_speaker_6')  # Default male voice
    
    # Generate audio
    audio_array = generate_audio(text, history_prompt=voice)
    
    # Convert to WAV
    audio_array = (audio_array * 32767).astype(np.int16)
    
    # Create WAV file in memory
    wav_io = io.BytesIO()
    wavfile.write(wav_io, SAMPLE_RATE, audio_array)
    wav_io.seek(0)
    
    return send_file(wav_io, mimetype='audio/wav')

if __name__ == '__main__':
    print("🎙️ Bark TTS Server starting on http://localhost:8080")
    app.run(host='0.0.0.0', port=8080)
```

Run the server:
```bash
python bark_server.py
```

## Available Voices

Bark has pre-made speaker prompts:

### English Voices
- `v2/en_speaker_0` - Female, young, clear
- `v2/en_speaker_1` - Male, young, energetic
- `v2/en_speaker_2` - Female, mature, authoritative
- `v2/en_speaker_3` - Male, mature, deep
- `v2/en_speaker_4` - Female, young, soft
- `v2/en_speaker_5` - Male, young, casual
- `v2/en_speaker_6` - Male, mature, narrator (RECOMMENDED FOR SLUNT)
- `v2/en_speaker_7` - Female, mature, warm
- `v2/en_speaker_8` - Male, young, excited
- `v2/en_speaker_9` - Female, young, bright

### Recommended for Slunt
- **`v2/en_speaker_6`** - Deep, authoritative male voice (best match)
- **`v2/en_speaker_1`** - Young energetic male (edgy vibe)
- **`v2/en_speaker_8`** - Excited male (chaotic energy)

## Configuration

Update `.env`:
```properties
VOICE_TTS_PROVIDER=bark
BARK_SERVER_URL=http://localhost:8080
BARK_VOICE=v2/en_speaker_6
```

## Performance Notes

- **First generation**: Slow (~20-30 seconds) while models load
- **Subsequent generations**: Faster (~5-10 seconds)
- **GPU acceleration**: Significantly faster with CUDA-enabled GPU
- **Model size**: ~2GB download on first run

## GPU Acceleration (Optional but Recommended)

Install PyTorch with CUDA support:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Troubleshooting

### "No module named 'bark'"
```bash
pip install git+https://github.com/suno-ai/bark.git
```

### "torch not found"
```bash
pip install torch
```

### "scipy not found"
```bash
pip install scipy
```

### Server won't start
```bash
pip install flask
```

### Slow generation
- Use GPU acceleration (see above)
- Reduce text length (Bark works best with 1-3 sentences)
- Pre-load models by running a test generation

## Testing

Test the server:
```bash
curl -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "yo what up this is slunt", "voice": "v2/en_speaker_6"}' \
  --output test.wav
```

## Alternative: Use Bark Directly (No Server)

If you don't want to run a server, Slunt can use Bark's Python API directly:

```python
from bark import generate_audio, SAMPLE_RATE
audio = generate_audio("your text here", history_prompt="v2/en_speaker_6")
```

(Implementation would need to be added to voiceManager.js)
