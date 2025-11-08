/*
 Voice Service: standalone TTS microservice for Slunt
 - REST API: POST /tts (queue or sync), GET /tts/:jobId/status, GET /tts/:jobId/audio, GET /health
 - WebSocket: emits 'voice:job' status updates
*/

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { JobQueue } = require('./queue/jobQueue');
const { synthesizeWithProvider } = require('./providers/synth');

const PORT = Number(process.env.VOICE_SERVICE_PORT || 3010);
const CONCURRENCY = Number(process.env.VOICE_MAX_CONCURRENCY || 2);
const DEFAULT_PROVIDER = (process.env.VOICE_DEFAULT_PROVIDER || process.env.VOICE_TTS_PROVIDER || 'openvoice').toLowerCase();
const AUDIO_DIR = path.join(process.cwd(), 'temp', 'audio');

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

app.use(cors({ origin: '*'}));
app.use(express.json({ limit: '2mb' }));
app.use('/temp/audio', express.static(AUDIO_DIR));

// in-memory job store
const jobs = new Map();
const queue = new JobQueue(CONCURRENCY, async (job) => {
  try {
    jobs.set(job.id, { ...job, status: 'processing', progress: 0 });
    io.emit('voice:job', { id: job.id, status: 'processing' });

    const result = await synthesizeWithProvider(job.provider, job.text, job.options);
    if (!result || !result.buffer) throw new Error('No audio produced');

    // write file
    const ext = result.format === 'wav' ? 'wav' : 'mp3';
    const filename = `voice_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const abs = path.join(AUDIO_DIR, filename);
    fs.writeFileSync(abs, result.buffer);

    const audioUrl = `/temp/audio/${filename}`;
    const final = { ...job, status: 'completed', progress: 100, audioUrl, tts: { provider: job.provider, ...result.meta, format: result.format || 'mp3' } };
    jobs.set(job.id, final);
    io.emit('voice:job', { id: job.id, status: 'completed', audioUrl, tts: final.tts });
  } catch (e) {
    const err = { ...job, status: 'failed', error: e.message };
    jobs.set(job.id, err);
    io.emit('voice:job', { id: job.id, status: 'failed', error: e.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), queue: { size: queue.size(), running: queue.running() }, port: PORT });
});

app.post('/tts', async (req, res) => {
  try {
    const { text, provider, speed, voiceId, format, wait } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'text is required' });
    }
    const prov = (provider || DEFAULT_PROVIDER).toLowerCase();
    const options = { speed, voiceId, format };

    if (wait === true) {
      // synchronous path
      try {
        const result = await synthesizeWithProvider(prov, text, options);
        if (!result || !result.buffer) throw new Error('No audio produced');
        const ext = result.format === 'wav' ? 'wav' : 'mp3';
        const filename = `voice_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const abs = path.join(AUDIO_DIR, filename);
        fs.writeFileSync(abs, result.buffer);
        const audioUrl = `/temp/audio/${filename}`;
        return res.json({ status: 'completed', audioUrl, tts: { provider: prov, ...result.meta, format: result.format || 'mp3' } });
      } catch (e) {
        return res.status(500).json({ status: 'failed', error: e.message });
      }
    }

    // queued path
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const job = { id, text, provider: prov, options };
    jobs.set(id, { ...job, status: 'queued', progress: 0 });
    queue.enqueue(job);
    res.json({ jobId: id, status: 'queued' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/tts/:jobId/status', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'not_found' });
  res.json(job);
});

app.get('/tts/:jobId/audio', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'not_found' });
  if (job.status !== 'completed') return res.status(400).json({ error: 'not_ready' });
  res.redirect(job.audioUrl);
});

server.listen(PORT, () => {
  console.log(`🎙️  Voice Service listening on http://localhost:${PORT}`);
});
