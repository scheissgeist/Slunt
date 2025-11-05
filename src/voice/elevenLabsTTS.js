// elevenLabsTTS.js
// Text-to-Speech via ElevenLabs API
// Docs: https://api.elevenlabs.io

const axios = require('axios');

/**
 * Generate MP3 audio for a text string using ElevenLabs TTS.
 *
 * Required env:
 *  - ELEVENLABS_API_KEY
 *  - ELEVENLABS_VOICE_ID (e.g., "21m00Tcm4TlvDq8ikWAM")
 * Optional env:
 *  - ELEVENLABS_MODEL (default: "eleven_multilingual_v2")
 *  - ELEVENLABS_STABILITY, ELEVENLABS_SIMILARITY (voice_settings tuning)
 *
 * @param {string} text
 * @param {object} opts
 * @returns {Promise<Buffer>} MP3 audio buffer
 */
async function elevenLabsTTS(text, opts = {}) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = opts.voiceId || process.env.ELEVENLABS_VOICE_ID;
  const modelId = opts.modelId || process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

  if (!apiKey) {
    const err = new Error('Missing ELEVENLABS_API_KEY');
    err.code = 'NO_API_KEY';
    throw err;
  }
  if (!voiceId) {
    const err = new Error('Missing ELEVENLABS_VOICE_ID');
    err.code = 'NO_VOICE_ID';
    throw err;
  }

  // Reasonable defaults for voice settings; can be tuned via env
  const stability = Number(process.env.ELEVENLABS_STABILITY ?? 0.4);
  const similarity_boost = Number(process.env.ELEVENLABS_SIMILARITY ?? 0.8);

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const response = await axios.post(
      url,
      {
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost
        }
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );
    return Buffer.from(response.data);
  } catch (err) {
    // Enhanced error handling with actionable messages
    if (err.response?.status === 400) {
      const errorBuffer = err.response.data;
      let errorData;
      
      try {
        // Try to parse error response as JSON
        const errorText = Buffer.isBuffer(errorBuffer) 
          ? errorBuffer.toString('utf-8') 
          : JSON.stringify(errorBuffer);
        errorData = JSON.parse(errorText);
      } catch (parseErr) {
        // Couldn't parse, log raw data
        console.error('[ElevenLabs TTS] Raw error:', errorBuffer);
      }
      
      // Check for quota exceeded error
      if (errorData?.detail?.status === 'voice_limit_reached') {
        console.error('━'.repeat(60));
        console.error('❌ ELEVENLABS QUOTA EXCEEDED');
        console.error('━'.repeat(60));
        console.error('Your free tier character limit has been reached.');
        console.error('');
        console.error('Free tier: 10,000 characters/month');
        console.error('Creator plan: 30,000 characters/month ($5)');
        console.error('');
        console.error('📊 Check usage: https://elevenlabs.io/app/usage');
        console.error('💳 Upgrade: https://elevenlabs.io/pricing');
        console.error('━'.repeat(60));
        
        const quotaErr = new Error('QUOTA_EXCEEDED: ElevenLabs character limit reached');
        quotaErr.code = 'QUOTA_EXCEEDED';
        quotaErr.details = errorData;
        throw quotaErr;
      }
    }
    
    // Generic error logging
    const payload = err.response?.data || err.message;
    console.error('[ElevenLabs TTS] Error:', payload);
    throw err;
  }
}

module.exports = elevenLabsTTS;
