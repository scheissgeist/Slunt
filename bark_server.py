#!/usr/bin/env python3
"""
Bark TTS Server for Slunt
Simple Flask server that generates speech using Bark AI
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import numpy as np
import io
from scipy.io import wavfile
import os
import sys

# Try to import Bark
try:
    from bark import generate_audio, SAMPLE_RATE, preload_models
except ImportError:
    print("❌ Bark not installed!")
    print("📦 Install with: pip install git+https://github.com/suno-ai/bark.git")
    sys.exit(1)

app = Flask(__name__)
CORS(app)  # Allow requests from browser

# Pre-load models for faster generation
print("🔄 Loading Bark models (this may take a minute)...")
preload_models()
print("✅ Models loaded!")

# Available voices
VOICES = {
    'male_deep': 'v2/en_speaker_6',      # Deep authoritative (RECOMMENDED)
    'male_young': 'v2/en_speaker_1',     # Young energetic
    'male_excited': 'v2/en_speaker_8',   # Excited/chaotic
    'male_casual': 'v2/en_speaker_5',    # Casual young
    'male_mature': 'v2/en_speaker_3',    # Mature deep
    'female_young': 'v2/en_speaker_0',   # Young clear
    'female_soft': 'v2/en_speaker_4',    # Soft young
    'female_mature': 'v2/en_speaker_7',  # Warm mature
}

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'provider': 'bark',
        'voices': list(VOICES.keys())
    })

@app.route('/voices', methods=['GET'])
def list_voices():
    """List available voices"""
    return jsonify({
        'voices': VOICES,
        'recommended': 'male_deep'
    })

@app.route('/generate', methods=['POST'])
def generate():
    """Generate speech from text"""
    try:
        data = request.json
        text = data.get('text', '')
        voice = data.get('voice', 'v2/en_speaker_6')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Map friendly names to Bark voice IDs
        if voice in VOICES:
            voice = VOICES[voice]
        
        print(f"🎙️ Generating: '{text[:50]}...' with voice {voice}")
        
        # Generate audio
        audio_array = generate_audio(
            text, 
            history_prompt=voice,
            text_temp=0.7,  # More variation
            waveform_temp=0.7
        )
        
        # Convert to 16-bit PCM WAV
        audio_array = (audio_array * 32767).astype(np.int16)
        
        # Create WAV file in memory
        wav_io = io.BytesIO()
        wavfile.write(wav_io, SAMPLE_RATE, audio_array)
        wav_io.seek(0)
        
        print(f"✅ Generated {len(audio_array) / SAMPLE_RATE:.1f}s of audio")
        
        return send_file(
            wav_io, 
            mimetype='audio/wav',
            as_attachment=False,
            download_name='bark_audio.wav'
        )
        
    except Exception as e:
        print(f"❌ Error generating audio: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    """Info page"""
    return """
    <h1>🎙️ Bark TTS Server</h1>
    <p>Server is running!</p>
    <h2>Endpoints:</h2>
    <ul>
        <li><code>GET /health</code> - Health check</li>
        <li><code>GET /voices</code> - List available voices</li>
        <li><code>POST /generate</code> - Generate speech</li>
    </ul>
    <h2>Example Request:</h2>
    <pre>
POST /generate
Content-Type: application/json

{
    "text": "yo what's up this is slunt",
    "voice": "male_deep"
}
    </pre>
    <h2>Available Voices:</h2>
    <ul>
        <li><strong>male_deep</strong> - Deep authoritative (RECOMMENDED)</li>
        <li>male_young - Young energetic</li>
        <li>male_excited - Excited/chaotic</li>
        <li>male_casual - Casual young</li>
        <li>male_mature - Mature deep</li>
        <li>female_young - Young clear</li>
        <li>female_soft - Soft young</li>
        <li>female_mature - Warm mature</li>
    </ul>
    """

if __name__ == '__main__':
    port = int(os.environ.get('BARK_PORT', 8080))
    print("")
    print("🎙️ ==========================================")
    print("🎙️  Bark TTS Server for Slunt")
    print("🎙️ ==========================================")
    print(f"🎙️  Server: http://localhost:{port}")
    print(f"🎙️  Health: http://localhost:{port}/health")
    print(f"🎙️  Voices: http://localhost:{port}/voices")
    print("🎙️ ==========================================")
    print("")
    print("⏳ Waiting for requests...")
    print("")
    
    app.run(
        host='0.0.0.0', 
        port=port,
        debug=False
    )
