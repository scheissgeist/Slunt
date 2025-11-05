// openaiTTS.js
const axios = require('axios');

/**
 * Get TTS audio from OpenAI API
 * @param {string} text
 * @param {object} [opts]
 * @returns {Promise<Buffer>} MP3 audio buffer
 */
async function openaiTTS(text, opts = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error('Missing OPENAI_API_KEY');
    err.code = 'NO_API_KEY';
    throw err;
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: opts.model || 'tts-1',
        input: text,
        voice: opts.voice || process.env.VOICE_OPENAI_VOICE || 'verse', // alloy, verse, coral, onyx, etc.
        response_format: 'mp3',
        speed: typeof opts.speed === 'number' ? opts.speed : Number(process.env.VOICE_OPENAI_SPEED || 1.1)
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );
    return Buffer.from(response.data);
  } catch (err) {
    const payload = err.response?.data || err.message;
    console.error('[OpenAI TTS] Error:', payload);
    throw err;
  }
}

module.exports = openaiTTS;
