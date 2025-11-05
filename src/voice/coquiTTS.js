/**
 * Coqui TTS Integration - Local, Free, High-Quality Text-to-Speech
 * Uses Coqui TTS server running locally (install: pip install TTS)
 */

const axios = require('axios');

/**
 * Generate speech using Coqui TTS
 * @param {string} text - Text to convert to speech
 * @param {object} options - TTS options
 * @returns {Promise<Buffer>} Audio buffer (WAV format)
 */
async function coquiTTS(text, options = {}) {
  const {
    serverUrl = process.env.COQUI_SERVER_URL || 'http://localhost:5002',
    speaker = process.env.COQUI_SPEAKER || 'p267', // Default speaker
    language = process.env.COQUI_LANGUAGE || 'en',
    model = process.env.COQUI_MODEL || 'tts_models/en/vctk/vits' // High quality VITS model
  } = options;

  try {
    console.log(`🎤 [Coqui] Generating speech: "${text.substring(0, 50)}..."`);
    console.log(`🎤 [Coqui] Using model: ${model}, speaker: ${speaker}`);

    // Coqui TTS server endpoint
    const response = await axios.post(`${serverUrl}/api/tts`, {
      text,
      speaker_id: speaker,
      language_id: language,
      model_name: model
    }, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const audioBuffer = Buffer.from(response.data);
    console.log(`✅ [Coqui] Generated ${audioBuffer.length} bytes of audio`);
    
    return audioBuffer;
  } catch (error) {
    console.error('❌ [Coqui] TTS failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Coqui TTS server not running. Start with: tts-server --model_name tts_models/en/vctk/vits');
    }
    
    throw error;
  }
}

/**
 * Check if Coqui TTS server is available
 */
async function isCoquiAvailable() {
  try {
    const serverUrl = process.env.COQUI_SERVER_URL || 'http://localhost:5002';
    await axios.get(`${serverUrl}/api/tts`, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get available voices from Coqui TTS server
 */
async function getCoquiVoices() {
  try {
    const serverUrl = process.env.COQUI_SERVER_URL || 'http://localhost:5002';
    const response = await axios.get(`${serverUrl}/api/voices`);
    return response.data;
  } catch (error) {
    console.error('❌ [Coqui] Could not fetch voices:', error.message);
    return [];
  }
}

module.exports = coquiTTS;
module.exports.isCoquiAvailable = isCoquiAvailable;
module.exports.getCoquiVoices = getCoquiVoices;
