const path = require('path');

async function elevenLabsProvider(text, options = {}) {
  const elevenLabsTTS = require(path.join('..','..','voice','elevenLabsTTS'));
  const buffer = await elevenLabsTTS(text, {
    voiceId: options.voiceId || process.env.ELEVENLABS_VOICE_ID,
    modelId: process.env.ELEVENLABS_MODEL
  });
  return { buffer, format: 'mp3', meta: { voiceId: options.voiceId || process.env.ELEVENLABS_VOICE_ID } };
}

async function openaiProvider(text, options = {}) {
  const openaiTTS = require(path.join('..','..','voice','openaiTTS'));
  const buffer = await openaiTTS(text, {
    voice: options.voiceId || process.env.VOICE_OPENAI_VOICE,
    speed: options.speed ? Number(options.speed) : undefined
  });
  return { buffer, format: 'mp3', meta: { voice: options.voiceId || process.env.VOICE_OPENAI_VOICE } };
}

async function coquiProvider(text, options = {}) {
  const coquiTTS = require(path.join('..','..','voice','coquiTTS'));
  const buffer = await coquiTTS(text, {
    speaker: process.env.COQUI_SPEAKER,
    language: process.env.COQUI_LANGUAGE,
    model: process.env.COQUI_MODEL
  });
  return { buffer, format: 'mp3', meta: { speaker: process.env.COQUI_SPEAKER, model: process.env.COQUI_MODEL } };
}

async function resembleProvider(text, options = {}) {
  const ResembleClient = require(path.join('..','..','voice','resemble-client'));
  const client = new ResembleClient(
    process.env.RESEMBLE_API_KEY,
    process.env.RESEMBLE_PROJECT_UUID
  );

  const voiceUuid = options.voiceId || process.env.RESEMBLE_VOICE_UUID;
  console.log(`[Resemble] Using project: ${process.env.RESEMBLE_PROJECT_UUID}, voice: ${voiceUuid}`);

  const buffer = await client.textToSpeech(text, { voice_uuid: voiceUuid });
  return { buffer, format: 'wav', meta: { voiceId: voiceUuid } };
}

async function piperProvider(text, options = {}) {
  const { spawn } = require('child_process');
  const fs = require('fs');
  const os = require('os');
  const tmp = require('path');
  const piperExec = process.env.PIPER_EXECUTABLE || 'piper';
  const piperModel = process.env.PIPER_MODEL || 'en_US-lessac-medium.onnx';
  const piperSpeaker = process.env.PIPER_SPEAKER || '0';
  const wavFile = tmp.join(os.tmpdir(), `piper_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`);
  await new Promise((resolve, reject) => {
    const p = spawn(piperExec, ['--model', piperModel, '--speaker', piperSpeaker, '--output_file', wavFile]);
    p.stderr.on('data', d => process.env.VOICE_DEBUG && console.log('[Piper]', d.toString()));
    p.on('close', (code) => {
      if (code === 0 && fs.existsSync(wavFile)) resolve();
      else reject(new Error(`Piper failed code ${code}`));
    });
    p.on('error', reject);
    p.stdin.write(text || '');
    p.stdin.end();
  });
  const buffer = fs.readFileSync(wavFile);
  return { buffer, format: 'wav', meta: { model: piperModel, speaker: piperSpeaker } };
}

async function openvoiceProvider(text, options = {}) {
  const OpenVoiceClient = require(path.join('..','..','voice','openvoice-client'));
  const client = new OpenVoiceClient(process.env.OPENVOICE_SERVER_URL || 'http://localhost:3002');

  const referenceVoice = options.referenceVoice || process.env.OPENVOICE_REFERENCE_VOICE;
  const language = options.language || process.env.OPENVOICE_LANGUAGE || 'EN';

  let buffer;
  if (referenceVoice) {
    // Voice cloning mode
    buffer = await client.cloneVoice(referenceVoice, text, language);
  } else {
    // Simple TTS mode
    buffer = await client.textToSpeech(text, language);
  }

  return {
    buffer,
    format: 'wav',
    meta: {
      referenceVoice: referenceVoice ? path.basename(referenceVoice) : 'base',
      language
    }
  };
}

async function xttsProvider(text, options = {}) {
  const axios = require('axios');
  const xttsUrl = process.env.XTTS_SERVER_URL || 'http://localhost:5002';
  
  try {
    const response = await axios.post(`${xttsUrl}/tts`, {
      text: text,
      temperature: options.temperature || 0.7,
      repetition_penalty: options.repetition_penalty || 5.0
    }, {
      responseType: 'arraybuffer',
      timeout: 60000 // 60 second timeout
    });
    
    return {
      buffer: Buffer.from(response.data),
      format: 'wav',
      meta: { 
        model: 'xtts_v2_finetuned',
        temperature: options.temperature || 0.7
      }
    };
  } catch (error) {
    console.error('[XTTS] Error:', error.message);
    throw new Error(`XTTS synthesis failed: ${error.message}`);
  }
}

async function synthesizeWithProvider(provider, text, options = {}) {
  switch ((provider || '').toLowerCase()) {
    case 'xtts':
      return xttsProvider(text, options);
    case 'openvoice':
      return openvoiceProvider(text, options);
    case 'elevenlabs':
      return elevenLabsProvider(text, options);
    case 'openai':
      return openaiProvider(text, options);
    case 'coqui':
      return coquiProvider(text, options);
    case 'resemble':
      return resembleProvider(text, options);
    case 'piper':
      return piperProvider(text, options);
    default:
      // default to openvoice
      return openvoiceProvider(text, options);
  }
}

module.exports = { synthesizeWithProvider };
