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
  const resembleAI = require(path.join('..','..','voice','resembleAI'));
  const buffer = await resembleAI(text, {
    voiceId: options.voiceId || process.env.RESEMBLE_VOICE_ID
  });
  return { buffer, format: 'mp3', meta: { voiceId: options.voiceId || process.env.RESEMBLE_VOICE_ID } };
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

async function synthesizeWithProvider(provider, text, options = {}) {
  switch ((provider || '').toLowerCase()) {
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
      // default to elevenlabs
      return elevenLabsProvider(text, options);
  }
}

module.exports = { synthesizeWithProvider };
