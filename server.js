const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const net = require('net');
const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');
const path = require('path');
const { execSync } = require('child_process');
// VoiceGreetings moved to after ChatBot initialization (line 2383)
const dotenvResult = require('dotenv').config({ override: true });

// DEBUG: Print voice ID immediately after loading .env
console.log('━'.repeat(60));
console.log('🔍 [DEBUG] Dotenv loading (with override=true):');
console.log(`   Working directory: ${process.cwd()}`);
console.log(`   Dotenv path: ${dotenvResult.parsed ? 'loaded' : 'NOT FOUND'}`);
console.log(`   Dotenv error: ${dotenvResult.error || 'none'}`);
if (dotenvResult.parsed) {
  console.log(`   Dotenv PARSED value for ELEVENLABS_VOICE_ID: "${dotenvResult.parsed.ELEVENLABS_VOICE_ID}"`);
}
console.log('🔍 [DEBUG] Environment variables loaded:');
console.log(`   process.env.ELEVENLABS_VOICE_ID = "${process.env.ELEVENLABS_VOICE_ID}"`);
console.log(`   ELEVENLABS_API_KEY exists = ${!!process.env.ELEVENLABS_API_KEY}`);
console.log('━'.repeat(60));

// ============ SMART PORT DETECTION ============
// Auto-detects available port to avoid conflicts between multiple instances
async function findAvailablePort(preferredPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(preferredPort, () => {
      const { port } = server.address();
      server.close(() => {
        console.log(`✅ [Port] ${port} is available`);
        resolve(port);
      });
    });
    server.on('error', () => {
      console.log(`⚠️  [Port] ${preferredPort} is in use, trying ${preferredPort + 1}...`);
      resolve(findAvailablePort(preferredPort + 1));
    });
  });
}

// Determine preferred port: env variable, or auto-select 3000/3001
const PREFERRED_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
let PORT = PREFERRED_PORT; // Will be updated by findAvailablePort in startup

// ============ CRITICAL: CATCH ALL ERRORS TO PREVENT CRASHES ============
process.on('uncaughtException', (error) => {
  console.error('💥💥💥 UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  // Don't exit - log it and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥💥💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  // Don't exit - log it and continue
});

process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received - graceful shutdown');
  if (global.openvoiceProcess) {
    console.log('🎤 [XTTS] Shutting down voice server...');
    global.openvoiceProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received - graceful shutdown');
  if (global.openvoiceProcess) {
    console.log('🎤 [XTTS] Shutting down voice server...');
    global.openvoiceProcess.kill('SIGTERM');
  }
  process.exit(0);
});
// ========================================================================

// Kill any orphaned node processes on startup (DISABLED by default to avoid killing npm/VS Code processes)
try {
  const cleanupEnabled = (process.env.CLEANUP_ORPHANS || '').toLowerCase() === 'true';
  if (cleanupEnabled) {
    console.log('🧹 [Cleanup] Checking for orphaned processes...');
    const currentPid = process.pid;

    // Kill other node processes (except this one)
    try {
      execSync(`Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne ${currentPid} } | Stop-Process -Force`, { shell: 'powershell.exe' });
      console.log('✅ [Cleanup] Killed orphaned node processes');
    } catch (e) {
      // No orphaned processes found, that's fine
    }
  } else {
    console.log('🧹 [Cleanup] Skipped orphaned-process kill (CLEANUP_ORPHANS not enabled)');
  }
} catch (error) {
  console.log('⚠️ [Cleanup] Could not clean up processes:', error.message);
}

// Winston logger setup - quieter logging
const winston = require('winston');
const VERBOSE = process.env.VERBOSE_LOGGING === 'true';
const logger = winston.createLogger({
  level: VERBOSE ? 'info' : 'warn', // Only warnings and errors by default
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple() // Simpler format without timestamps
    }),
    new winston.transports.File({ filename: 'logs/slunt.log' })
  ]
});

const SluntManager = require('./src/services/SluntManager');
const BackupManager = require('./src/services/BackupManager');
const RateLimiter = require('./src/services/RateLimiter');
const ContentFilter = require('./src/services/ContentFilter');
const GracefulShutdown = require('./src/stability/GracefulShutdown');
const ConnectionHealthMonitor = require('./src/services/ConnectionHealthMonitor');

// Initialize backup and rate limiting systems
const backupManager = new BackupManager({
  maxBackups: 7, // Keep 7 days of backups
  autoBackupInterval: 24 * 60 * 60 * 1000 // Backup every 24 hours
});

const rateLimiter = new RateLimiter({
  maxMessagesPerMinute: 15,
  maxCommandsPerMinute: 5,
  maxGlobalMessagesPerMinute: 100
});

const contentFilter = new ContentFilter();

// Initialize connection health monitor
const healthMonitor = new ConnectionHealthMonitor({
  checkInterval: 30000, // Check every 30 seconds
  heartbeatTimeout: 120000, // 2 minutes without activity = dead
  maxReconnectAttempts: 5,
  baseReconnectDelay: 5000,
  maxReconnectDelay: 60000
});

// Helper for timestamps
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Helper for knowledge levels
function determineKnowledgeLevel(mentionCount) {
  if (mentionCount < 3) return 'novice';
  if (mentionCount < 10) return 'learning';
  if (mentionCount < 25) return 'knowledgeable';
  return 'expert';
}

// Helper to generate knowledge fragments based on mentions
function generateKnowledgeFragments(topic, count) {
  const fragments = [];
  
  if (count >= 1) {
    fragments.push(`Has heard about ${topic}`);
  }
  if (count >= 3) {
    fragments.push(`Knows ${topic} exists and what it's generally about`);
  }
  if (count >= 5) {
    fragments.push(`Can discuss ${topic} with some detail`);
  }
  if (count >= 10) {
    fragments.push(`Has strong opinions about ${topic}`);
  }
  if (count >= 15) {
    fragments.push(`Frequently brings up ${topic} in conversation`);
  }
  if (count >= 25) {
    fragments.push(`Considers themselves knowledgeable about ${topic}`);
  }
  if (count >= 40) {
    fragments.push(`${topic} is a core part of their identity`);
  }
  
  return fragments;
}

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error(`[Uncaught Exception] ${error.stack || error}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`[Unhandled Rejection] ${reason}`);
});

const ChatBot = require('./src/bot/chatBot');
logger.info('Slunt server starting...');

// Use STEALTH browser by default (more stable than WebSocket for some networks)
const useWebSocket = process.env.USE_WEBSOCKET === 'true';
const CoolholeClient = useWebSocket
  ? require('./src/coolhole/coolholeClientWebSocket')
  : (process.env.USE_STEALTH === 'true' 
      ? require('./src/coolhole/coolholeClientStealth')
      : require('./src/coolhole/coolholeClient'));

console.log('🔌 [Coolhole] Client mode:', useWebSocket ? 'WEBSOCKET (lightweight, no browser)' : 'BROWSER (Puppeteer - headless stealth)');

if (!useWebSocket) {
  console.log(`🔐 [Coolhole] Using ${process.env.USE_STEALTH === 'true' ? 'STEALTH' : 'STANDARD'} client`);
}

const VideoManager = require('./src/video/videoManager');
const CoolholeExplorer = require('./src/coolhole/coolholeExplorer');
const VisionAnalyzer = require('./src/vision/visionAnalyzer');
const CursorController = require('./src/services/CursorController');
const VoiceManager = require('./src/voice/voiceManager');

// Multi-platform support
const PlatformManager = require('./src/io/platformManager');
const DiscordClient = require('./src/io/discordClient');
const TwitchClient = require('./src/io/twitchClient');
const TwitchEmoteManager = require('./src/twitch/TwitchEmoteManager');
const StreamStatusMonitor = require('./src/services/StreamStatusMonitor');

const app = express();
const server = http.createServer(app);
// Lightweight in-process metrics
const metrics = { startTime: Date.now(), requests: 0, responses: 0, errors: 0 };
app.use((req, res, next) => {
  metrics.requests++;
  res.on('finish', () => {
    metrics.responses++;
  });
  next();
});
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || true, // Allow all origins for remote voice clients
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,  // Allow Socket.IO connections
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || true, // Allow all origins for remote voice clients
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));
// Serve temporary audio files for voice playback
app.use('/temp/audio', express.static(path.join(__dirname, 'temp/audio')));

// Basic /metrics endpoint for ops
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.send(
    JSON.stringify({
      uptimeSec: Math.round((Date.now() - metrics.startTime) / 1000),
      requests: metrics.requests,
      responses: metrics.responses,
      errors: metrics.errors,
      connectedClients,
      timestamp: new Date().toISOString(),
    })
  );
});

// Serve live dashboard as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'live-dashboard.html'));
});

// Serve Slunt's Mind dashboard
app.get('/mind', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'slunt-mind.html'));
});

// Serve Multi-Platform Control Center
app.get('/platforms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'multi-platform-dashboard.html'));
});

// Serve Sentiment Dashboard
app.get('/sentiment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sentiment-dashboard.html'));
});

// Serve Voice Chat page
app.get('/voice', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'voice-demo.html'));
});

// Voice model comparison page
app.get('/voice-comparison', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'voice-comparison.html'));
});

// Serve Remote Voice Client (for connecting from other machines)
app.get('/voice-client', (req, res) => {
  res.sendFile(path.join(__dirname, 'voiceClient.html'));
});

// Initialize bot components
const videoManager = new VideoManager();
const coolholeClient = new CoolholeClient(healthMonitor); // Pass healthMonitor

// Initialize ChatBot with Alpha signature (coolholeClient, videoManager)
const ChatBotClass = require('./src/bot/chatBot');
const chatBot = new ChatBotClass(coolholeClient, videoManager);

const sluntManager = new SluntManager();

// Voice greeting system
const VoiceGreetings = require('./src/voice/VoiceGreetings');
const voiceGreetings = new VoiceGreetings(chatBot);

// Voice API for web demo
const openaiTTS = require('./src/voice/openaiTTS');
const elevenLabsTTS = require('./src/voice/elevenLabsTTS');
const coquiTTS = require('./src/voice/coquiTTS');
const resembleAI = require('./src/voice/resembleAI');

// Voice memory management endpoint
app.post('/api/voice/clear-memory', async (req, res) => {
  try {
    chatBot.voiceMemory = [];
    chatBot.voiceFocusMode = false; // Exit focus mode when clearing
    console.log('🧠 [Voice] Memory cleared - exiting focus mode, returning to normal activity');
    res.json({ success: true, message: 'Voice memory cleared' });
  } catch (error) {
    console.error('❌ [Voice] Failed to clear memory:', error);
    res.status(500).json({ error: 'Failed to clear memory' });
  }
});

// Proactive voice conversation - Slunt can lead the conversation
app.get('/api/voice/proactive', async (req, res) => {
  try {
    // Check if there's been silence (no voice activity recently)
    const timeSinceLastVoice = Date.now() - (chatBot.lastVoiceActivity || 0);
    const silenceThreshold = 9 * 1000; // 9 seconds of silence - HIGHLY RESPONSIVE
    
    // Only be proactive if in voice focus mode and there's been silence
    if (!chatBot.voiceFocusMode || timeSinceLastVoice < silenceThreshold) {
      return res.json({ proactive: false, reason: 'not_ready' });
    }
    
    console.log(`🎤 [Voice] ${Math.round(timeSinceLastVoice / 1000)}s of silence - being proactive and pushy`);
    
    // Generate a contextual proactive conversation starter
    // BETTER PROMPTS: More natural, varied, and context-aware
    const proactivePrompts = [
      // Pushy/Curious
      "So what are you thinking about right now?",
      "You got quiet. What's on your mind?",
      "Still there? Say something.",
      "What do you actually think about that?",
      "Wait, explain that more. I don't get it.",
      "You just gonna leave that hanging?",
      "What else you wanna talk about?",
      "That's it? Keep going.",
      "Tell me more about that.",
      "Why though? What's the reason?",
      "You disagree with something I said?",
      "What's your take on this?",
      "Alright what's next?",
      "You seem distracted. What's up?",
      "C'mon, give me your opinion on something.",
      
      // More natural variations
      "So anyway...",
      "Wait, I had a thought about that.",
      "Actually, what do you mean by that?",
      "Hold on, that reminds me of something.",
      "Quick question about what you said...",
      "So you really think that?",
      "That doesn't make sense to me.",
      "I'm curious about something.",
      "Let me ask you this...",
      "What would you do in that situation?",
      
      // References to conversation
      "Back to what you were saying...",
      "Actually I wanted to ask about that.",
      "So about that thing you mentioned...",
      "I've been thinking about what you said.",
      "That's interesting but...",
      "Wait I don't agree with that.",
      "You're not telling me something.",
      "There's more to it though, right?"
    ];
    
    // Use AI to generate a contextual, engaging proactive message
    let proactiveMessage;
    if (chatBot.voiceMemory && chatBot.voiceMemory.length > 0) {
      const recentContext = chatBot.voiceMemory.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
      
      // ENHANCED PROMPT: More specific about what makes a good proactive response
      const contextPrompt = `Recent conversation:
${recentContext}

They've been quiet for ${Math.round(timeSinceLastVoice / 1000)} seconds.

Break the silence by:
- Asking a follow-up question about what they just said
- Challenging or pushing back on their point
- Referencing something they mentioned earlier
- Sharing a quick thought or observation
- Being curious and digging deeper

Be pushy, curious, and keep the conversation moving. NO generic "what's up" stuff.

Generate ONE engaging question or statement (10-25 words max):

Slunt:`;
      
      proactiveMessage = await chatBot.aiEngine.generateOllamaResponse(
        contextPrompt,
        'System',
        '',
        80, // MORE tokens for engaging questions (was 50)
        true // Voice mode
      );
    }
    
    // SMARTER FALLBACK: Pick contextually if AI fails
    if (!proactiveMessage || proactiveMessage.trim().length < 5) {
      // Try to pick a contextual prompt based on recent conversation
      const recentText = chatBot.voiceMemory?.slice(-3).map(m => m.text).join(' ').toLowerCase() || '';
      
      // Context-aware selection
      if (recentText.includes('?')) {
        // They asked a question recently, follow up
        const followUps = [
          "Actually, what do you mean by that?",
          "Wait, explain that more.",
          "So you really think that?",
          "Back to what you were saying...",
          "Hold on, that reminds me of something."
        ];
        proactiveMessage = followUps[Math.floor(Math.random() * followUps.length)];
      } else if (recentText.length > 50) {
        // They were talking, push them to continue
        const pushers = [
          "That's it? Keep going.",
          "Tell me more about that.",
          "There's more to it though, right?",
          "You're not telling me something.",
          "What else about that?"
        ];
        proactiveMessage = pushers[Math.floor(Math.random() * pushers.length)];
      } else {
        // Generic but still better than "what's up"
        proactiveMessage = proactivePrompts[Math.floor(Math.random() * proactivePrompts.length)];
      }
    }
    
    console.log(`🎤 [Voice] Proactive: "${proactiveMessage}"`);
    
    // Update last voice activity
    chatBot.lastVoiceActivity = Date.now();
    
    // Add to voice memory
    if (chatBot.voiceMemory) {
      chatBot.voiceMemory.push({
        speaker: 'Slunt',  // Changed from 'role' to 'speaker' to match context builder
        text: proactiveMessage,
        timestamp: Date.now()
      });
    }
    
    res.json({ 
      proactive: true, 
      text: proactiveMessage,
      reason: 'silence_detected'
    });
  } catch (error) {
    console.error('❌ [Voice] Proactive generation failed:', error);
    res.status(500).json({ error: 'Failed to generate proactive message' });
  }
});

app.post('/api/voice', async (req, res) => {
  try {
    console.log(`📞 [Voice API] Received request:`, req.body);
    const { text } = req.body;
    if (!text) {
      console.log(`❌ [Voice API] No text provided`);
      return res.status(400).json({ error: 'No text provided' });
    }
    console.log(`📝 [Voice API] Processing text: "${text}"`);
    
    // 🚫 Filter out UI control phrases that shouldn't be treated as conversation
    const controlPhrases = ['start listening', 'stop listening', 'clear memory', 'stop', 'start'];
    const lowerText = text.toLowerCase().trim();
    if (controlPhrases.includes(lowerText)) {
      console.log(`🎤 [Voice] Ignoring control phrase: "${text}"`);
      return res.json({ 
        reply: "I'm listening. Go ahead.",
        audioUrl: null,
        ignored: true
      });
    }
    
    // ✅ STORE USER MESSAGE IN VOICE MEMORY
    if (!chatBot.voiceMemory) {
      chatBot.voiceMemory = [];
    }
    chatBot.voiceMemory.push({
      speaker: 'You',  // Changed from 'role' to 'speaker' to match context builder
      text: text,
      timestamp: Date.now()
    });
    console.log(`🧠 [Voice] Stored user message: "${text}" (memory: ${chatBot.voiceMemory.length} msgs)`);
    
    // Unified message loop: send to Slunt
    let reply = await chatBot.generateResponse({
      platform: 'voice',
      username: 'You',
      text,
      timestamp: Date.now(),
      channel: 'voice',
      voiceMode: true // Enable fast path for real-time voice
    });
    if (!reply || !String(reply).trim()) {
      reply = "I'm here. What’s up?";
    }
    //  STORE SLUNT'S REPLY IN VOICE MEMORY
    chatBot.voiceMemory.push({
      speaker: 'Slunt',  // Changed from 'role' to 'speaker' to match context builder
      text: reply,
      timestamp: Date.now()
    });
    const replyPreview = reply.length > 50 ? reply.slice(0, 50) + '...' : reply;
    console.log(`🧠 [Voice] Stored Slunt reply: "${replyPreview}" (memory: ${chatBot.voiceMemory.length} msgs)`);
    
    // Get TTS audio from selected provider (MP3)
    try {
      const provider = (process.env.VOICE_TTS_PROVIDER || 'elevenlabs').toLowerCase();
      console.log(`🎤 [Voice] Using TTS provider: ${provider}`);

      // If a remote Voice Service URL is configured, offload synthesis synchronously
      const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL;
      if (VOICE_SERVICE_URL) {
        try {
          const axios = require('axios');
          const resp = await axios.post(`${VOICE_SERVICE_URL.replace(/\/$/,'')}/tts`, {
            text: reply,
            provider,
            voiceId: process.env.ELEVENLABS_VOICE_ID || undefined,
            speed: process.env.VOICE_OPENAI_SPEED ? Number(process.env.VOICE_OPENAI_SPEED) : undefined,
            wait: true
          }, { timeout: 60000 });
          const data = resp.data || {};
          if (data.status === 'completed' && data.audioUrl) {
            return res.json({ reply, audioUrl: data.audioUrl, tts: data.tts || { provider } });
          }
          // fall through to local if remote didn't complete
        } catch (remoteErr) {
          console.warn('⚠️  [Voice] Remote voice service failed, falling back to local TTS:', remoteErr.message);
        }
      }
      let audioBuffer;
      let ttsMeta = { provider };
      
      if (provider === 'piper') {
        // Piper TTS - Local, free, fast, high quality
        try {
          const { spawn } = require('child_process');
          const piperExec = process.env.PIPER_EXECUTABLE || 'piper';
          const piperModel = process.env.PIPER_MODEL || 'en_US-lessac-medium.onnx';
          const piperSpeaker = process.env.PIPER_SPEAKER || '0';
          
          console.log(`🎙️ [Voice] Piper generating speech with model: ${piperModel}`);
          
          // Generate WAV file directly
          const tempDir = path.join(__dirname, 'temp', 'audio');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          
          const wavFile = path.join(tempDir, `piper_${Date.now()}.wav`);
          
          await new Promise((resolve, reject) => {
            const piper = spawn(piperExec, [
              '--model', piperModel,
              '--speaker', piperSpeaker,
              '--output_file', wavFile
            ]);
            
            piper.stderr.on('data', (data) => {
              console.log(`[Piper] ${data.toString()}`);
            });
            
            piper.on('close', (code) => {
              if (code === 0 && fs.existsSync(wavFile)) {
                resolve();
              } else {
                reject(new Error(`Piper failed with code ${code}`));
              }
            });
            
            piper.on('error', reject);
            
            // Send text to stdin
            piper.stdin.write(reply || '');
            piper.stdin.end();
          });
          
          // Read the generated WAV file
          audioBuffer = fs.readFileSync(wavFile);
          ttsMeta.model = piperModel;
          ttsMeta.speaker = piperSpeaker;
          ttsMeta.format = 'wav';
        } catch (piperErr) {
          console.warn('⚠️  [Voice] Piper TTS failed, falling back to browser TTS');
          console.warn('⚠️  [Voice] Error:', piperErr.message);
          audioBuffer = null;
        }
      } else if (provider === 'resemble') {
        // Resemble AI - Cloud, voice cloning, 200 min/month free
        try {
          audioBuffer = await resembleAI(reply || '', {
            voiceId: process.env.RESEMBLE_VOICE_ID
          });
          ttsMeta.voiceId = process.env.RESEMBLE_VOICE_ID;
        } catch (resembleErr) {
          console.warn('⚠️  [Voice] Resemble AI failed, falling back to browser TTS');
          console.warn('⚠️  [Voice] Error:', resembleErr.message);
          audioBuffer = null;
        }
      } else if (provider === 'coqui') {
        // Coqui TTS - Local, free, high quality
        try {
          audioBuffer = await coquiTTS(reply || '', {
            speaker: process.env.COQUI_SPEAKER,
            language: process.env.COQUI_LANGUAGE,
            model: process.env.COQUI_MODEL
          });
          ttsMeta.speaker = process.env.COQUI_SPEAKER || 'p267';
          ttsMeta.model = process.env.COQUI_MODEL || 'tts_models/en/vctk/vits';
        } catch (coquiErr) {
          console.warn('⚠️  [Voice] Coqui TTS failed, falling back to browser TTS');
          console.warn('⚠️  [Voice] Make sure Coqui server is running: tts-server --model_name tts_models/en/vctk/vits');
          // Let browser handle TTS
          audioBuffer = null;
        }
      } else if (provider === 'elevenlabs') {
        const apiKeyPresent = !!process.env.ELEVENLABS_API_KEY;
        if (!apiKeyPresent) {
          console.warn('⚠️  [Voice] ELEVENLABS_API_KEY is missing; browser TTS will be used by the client');
        }
        // Force David unless explicitly overridden via env
        const DAVID_ID = 'XusZimPAb50wPl00sLE6';
        const primaryVoiceId = process.env.ELEVENLABS_VOICE_ID || DAVID_ID;
        // Support both env names for backup voice id
        const backupVoiceId = process.env.ELEVENLABS_BACKUP_VOICE_ID || process.env.ELEVENLABS_VOICE_ID_BACKUP;
        let voiceUsed = primaryVoiceId || null;
        let usedFallback = false;
        try {
          audioBuffer = await elevenLabsTTS(reply || '', {
            voiceId: primaryVoiceId,
            modelId: process.env.ELEVENLABS_MODEL
          });
          console.log(`🎤 [VoiceAPI] ElevenLabs TTS OK (voice=${primaryVoiceId}, model=${process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2'})`);
        } catch (primaryErr) {
          if (backupVoiceId) {
            console.warn('⚠️  [Voice] Primary ElevenLabs voice failed, trying backup voice ID');
            audioBuffer = await elevenLabsTTS(reply || '', {
              voiceId: backupVoiceId,
              modelId: process.env.ELEVENLABS_MODEL
            });
            voiceUsed = backupVoiceId;
            usedFallback = true;
            console.log(`🎤 [VoiceAPI] ElevenLabs TTS fallback used (voice=${backupVoiceId})`);
          } else {
            throw primaryErr;
          }
        }
        ttsMeta.voiceId = voiceUsed;
        ttsMeta.fallback = usedFallback;
        ttsMeta.model = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
      } else if (provider === 'openai') {
        // OpenAI TTS - Paid, high quality voices
        try {
          audioBuffer = await openaiTTS(reply || '', {
            voice: process.env.VOICE_OPENAI_VOICE,
            speed: process.env.VOICE_OPENAI_SPEED ? Number(process.env.VOICE_OPENAI_SPEED) : undefined
          });
          ttsMeta.voice = process.env.VOICE_OPENAI_VOICE || 'verse';
        } catch (openaiErr) {
          console.warn('⚠️  [Voice] OpenAI TTS failed, falling back to browser TTS');
          console.warn('⚠️  [Voice] Error:', openaiErr.message);
          audioBuffer = null;
        }
      } else if (provider === 'resemble') {
        // Resemble.AI - Cloud, voice cloning with custom trained voice
        try {
          const ResembleClient = require('./src/voice/resemble-client');
          const resembleClient = new ResembleClient(
            process.env.RESEMBLE_API_KEY,
            process.env.RESEMBLE_PROJECT_UUID
          );

          const voiceUuid = process.env.RESEMBLE_VOICE_UUID || process.env.RESEMBLE_PROJECT_UUID;

          console.log(`🎙️ [Voice] Resemble.AI generating speech with custom voice`);
          audioBuffer = await resembleClient.textToSpeech(reply || '', {
            voice_uuid: voiceUuid
          });

          ttsMeta.provider = 'resemble';
          ttsMeta.voice = voiceUuid.substring(0, 8);
          ttsMeta.format = 'wav';
        } catch (resembleErr) {
          console.warn('⚠️  [Voice] Resemble.AI TTS failed, falling back to browser TTS');
          console.warn('⚠️  [Voice] Error:', resembleErr.message);
          audioBuffer = null;
        }
      } else if (provider === 'openvoice') {
        // OpenVoice - Local, free, voice cloning
        try {
          const OpenVoiceClient = require('./src/voice/openvoice-client');
          const openvoiceClient = new OpenVoiceClient(
            process.env.OPENVOICE_SERVER_URL || 'http://localhost:3002'
          );

          const referenceVoice = process.env.OPENVOICE_REFERENCE_VOICE;
          const language = process.env.OPENVOICE_LANGUAGE || 'EN';

          console.log(`🎙️ [Voice] OpenVoice generating speech (language: ${language})`);
          if (referenceVoice) {
            console.log(`   Using voice clone: ${path.basename(referenceVoice)}`);
            audioBuffer = await openvoiceClient.cloneVoice(referenceVoice, reply || '', language);
          } else {
            console.log('   Using base TTS (no reference voice)');
            audioBuffer = await openvoiceClient.textToSpeech(reply || '', language);
          }

          ttsMeta.referenceVoice = referenceVoice ? path.basename(referenceVoice) : 'base';
          ttsMeta.language = language;
          ttsMeta.format = 'wav';
        } catch (openvoiceErr) {
          console.warn('⚠️  [Voice] OpenVoice TTS failed, falling back to browser TTS');
          console.warn('⚠️  [Voice] Error:', openvoiceErr.message);
          if (openvoiceErr.message.includes('ECONNREFUSED') || openvoiceErr.message.includes('not responding')) {
            console.warn('⚠️  [Voice] OpenVoice server may not be running');
          }
          audioBuffer = null;
        }
      } else if (provider === 'xtts') {
        // XTTS - Local, fine-tuned David Hasselhoff voice
        try {
          const axios = require('axios');
          const xttsUrl = process.env.XTTS_SERVER_URL || 'http://localhost:5002';
          
          console.log(`🎙️ [Voice] XTTS generating speech (fine-tuned Hoff model)`);
          const response = await axios.post(`${xttsUrl}/tts`, {
            text: reply || '',
            language: 'en',
            speaker_wav: null
          }, {
            responseType: 'arraybuffer',
            timeout: 60000
          });
          
          audioBuffer = Buffer.from(response.data);
          ttsMeta.model = 'xtts_v2_finetuned';
          ttsMeta.format = 'wav';
          console.log(`✅ [Voice] XTTS generated ${audioBuffer.length} bytes`);
        } catch (xttsErr) {
          console.warn('⚠️  [Voice] XTTS TTS failed, falling back to browser TTS');
          console.warn('⚠️  [Voice] Error:', xttsErr.message);
          if (xttsErr.message.includes('ECONNREFUSED') || xttsErr.code === 'ECONNREFUSED') {
            console.warn('⚠️  [Voice] XTTS server may not be running on', process.env.XTTS_SERVER_URL || 'http://localhost:5002');
          }
          audioBuffer = null;
        }
      } else {
        // Unknown provider - use browser TTS
        console.warn(`⚠️  [Voice] Unknown TTS provider: ${provider}, falling back to browser TTS`);
        audioBuffer = null;
      }
      // If audio generation succeeded, save to file
      if (audioBuffer) {
        // Ensure temp/audio directory exists
        const tempDir = path.join(__dirname, 'temp', 'audio');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        // Save audio to temp file for playback
        const fileExt = ttsMeta.format === 'wav' ? 'wav' : 'mp3';
        const audioRelPath = `temp/audio/voice_reply_${Date.now()}.${fileExt}`;
        const audioFile = path.join(__dirname, audioRelPath);
        fs.writeFileSync(audioFile, audioBuffer);
        const response = { reply, audioUrl: `/${audioRelPath}`, tts: ttsMeta };
        console.log(`✅ [Voice API] Sending response with audio:`, { reply: reply?.substring(0, 50), audioUrl: response.audioUrl });
        // Respond with reply text and audio URL (+meta)
        res.json(response);
      } else {
        const response = { reply, audioUrl: null, tts: ttsMeta };
        console.log(`⚠️  [Voice API] Sending response without audio (browser TTS fallback):`, { reply: reply?.substring(0, 50) });
        // No audio buffer - let browser handle TTS
        res.json(response);
      }
    } catch (ttsErr) {
      // Graceful fallback: return text without audio so client can use browser TTS
      const ttsMsg = ttsErr?.code === 'NO_API_KEY' ? 'OPENAI_API_KEY is not configured' : (ttsErr.message || 'TTS failed');
      console.warn('⚠️  [Voice] TTS unavailable:', ttsMsg);
      res.json({ reply, audioUrl: null, ttsError: ttsMsg });
    }
  } catch (err) {
    console.error('❌ [Voice API] Fatal error:', err);
    console.error('❌ [Voice API] Stack:', err.stack);
    res.status(500).json({ error: 'Voice API error', details: err.message });
  }
});

// Initialize voice manager
const voiceManager = new VoiceManager({
  enabled: (process.env.ENABLE_VOICE || '').toLowerCase() !== 'false', // default ENABLED; set ENABLE_VOICE=false to disable
  sttProvider: process.env.VOICE_STT_PROVIDER || 'browser', // Use browser STT by default
  ttsProvider: process.env.VOICE_TTS_PROVIDER || 'elevenlabs',
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  // Use David voice from .env (XusZimPAb50wPl00sLE6)
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID, // David voice from .env
  openaiApiKey: process.env.OPENAI_API_KEY
});

console.log(`🎤 [Voice] Voice system ${voiceManager.config.enabled ? 'ENABLED' : 'DISABLED'}`);

// Initialize multi-platform manager
const platformManager = new PlatformManager();
let discordClient = null;
let twitchClient = null;

// Initialize feature exploration and vision
let coolholeExplorer = null;
let visionAnalyzer = null;
let cursorController = null;

// Make Coolhole connection optional for testing
const enableCoolhole = process.env.ENABLE_COOLHOLE !== 'false';

// Listen to chat bot events and broadcast to dashboard
chatBot.on('message:received', (data) => {
  io.emit('chat:message', {
    username: data.username,
    message: data.message,
    timestamp: Date.now()
  });
});

chatBot.on('message:sent', (data) => {
  io.emit('chat:message', {
    username: 'Slunt',
    message: data.message,
    timestamp: Date.now()
  });
});

// Broadcast typing status to dashboard
chatBot.on('typing:start', (info) => {
  io.emit('bot:typing', { active: true, ...info });
});
chatBot.on('typing:stop', (info) => {
  io.emit('bot:typing', { active: false, ...info });
});

// Forward partial streaming previews to dashboard
chatBot.on('message:partial', (data) => {
  io.emit('bot:partial', data);
});

// Forward companion visibility actions (suppress/override) to dashboard
chatBot.on('companion:action', (payload) => {
  try {
    io.emit('companion:action', {
      type: payload?.type,
      reason: payload?.reason,
      suggestion: payload?.suggestion,
      data: payload?.data || null,
      timestamp: Date.now()
    });
  } catch (e) {
    console.warn('⚠️  Failed to emit companion:action:', e?.message || e);
  }
});

// Broadcast bot stats periodically - DISABLED TO AVOID CRASHES
// (Enable if you need real-time dashboard updates)
/*
setInterval(() => {
  const stats = chatBot.getChatStatistics();
  const advancedStats = chatBot.getAdvancedStats();
  io.emit('bot:stats', {
    ...stats,
    advanced: advancedStats
  });
  
  // Broadcast platform status
  if (platformManager) {
    const platformStatus = platformManager.getStatus();
    io.emit('platform:status', platformStatus);
  }

  // Broadcast health monitor status
  if (healthMonitor) {
    const healthStatus = healthMonitor.getStatus();
    io.emit('health:status', healthStatus);
  }
  
  // Broadcast sentiment data
  if (chatBot.sentimentAnalyzer) {
    const sentimentData = chatBot.getSentimentMetrics();
    io.emit('sentiment:update', sentimentData);
  }
  
  // Broadcast personality status
  if (chatBot.personalityScheduler) {
    const personalityStatus = chatBot.getPersonalityStatus();
    io.emit('personality:update', personalityStatus);
  }
  
  // Broadcast clip creator status
  if (chatBot.clipCreator) {
    const clipStatus = chatBot.getClipStatus();
    io.emit('clips:update', clipStatus);
  }
  
  // Send user profiles - DISABLED FOR MINIMAL MODE
  if (chatBot.userProfiles) {
    const userProfiles = Array.from(chatBot.userProfiles.entries()).map(([username, profile]) => ({
      username,
      ...profile
    }));
    userProfiles.forEach(profile => {
      io.emit('bot:user_profile', profile);
    });
  }
  
  // Send community insights
  const insights = chatBot.getCommunityInsights();
  io.emit('bot:community_insights', insights);
}, 5000); // Update every 5 seconds
*/

// Broadcast comprehensive inner mind data
setInterval(() => {
  try {
    // Mental State
    if (chatBot.mentalStateTracker) {
      const mentalState = chatBot.mentalStateTracker.getMentalState();
      io.emit('mental_state', mentalState);
    }
    
    // Personality
    if (chatBot.personality) {
      io.emit('personality_update', chatBot.personality);
    }
    
    // Dopamine System
    if (chatBot.dopamineSystem) {
      const dopamineState = chatBot.dopamineSystem.getState();
      io.emit('dopamine_update', dopamineState);
    }
    
    // Current Obsession
    if (chatBot.obsessionSystem) {
      const obsession = chatBot.obsessionSystem.getCurrentObsession();
      io.emit('obsession_update', obsession || { active: false });
    }
    
    // Drunk Mode Status
    if (chatBot.drunkMode) {
      const drunkState = {
        isDrunk: chatBot.drunkMode.isDrunk || false,
        drunkLevel: chatBot.drunkMode.drunkLevel || 0,
        hasHangover: chatBot.drunkMode.hasHangover || false,
        drinkingReason: chatBot.drunkMode.drinkingReason || null
      };
      io.emit('drunk_update', drunkState);
    }
    
    // Autism Fixations
    if (chatBot.autismFixations) {
      const autismStats = chatBot.autismFixations.getStats();
      io.emit('autism_update', autismStats);
    }
    
    // Hipster Protocol
    if (chatBot.hipsterProtocol) {
      const hipsterStats = chatBot.hipsterProtocol.getStats();
      io.emit('hipster_update', hipsterStats);
    }
    
    // Gold System Stats
    if (chatBot.goldSystem) {
      const goldStats = chatBot.goldSystem.getStats();
      io.emit('gold_update', goldStats);
    }
    
    // Relationships (detailed for system cards)
    if (chatBot.relationshipMapping) {
      const relationships = chatBot.relationshipMapping.getEnrichedRelationships 
        ? chatBot.relationshipMapping.getEnrichedRelationships(chatBot.userProfiles)
        : Array.from(chatBot.relationshipMapping.relationships?.entries() || []);
      
      // Filter out invalid relationships
      const validRelationships = relationships.filter(([key, rel]) => {
        return rel && rel.users && rel.users.length >= 2 &&
          !rel.users.some(u => u.includes('joined (aliases') || u.includes('left') || u.includes('(aliases'));
      });
      
      io.emit('relationships_update', { relationships: validRelationships.slice(0, 100) });
    }
    
    // User Reputation/Opinions (detailed for system cards)
    if (chatBot.userReputationSystem) {
      const reputations = chatBot.userReputationSystem.getAllReputations ? 
        chatBot.userReputationSystem.getAllReputations() : [];
      io.emit('reputation_update', { users: reputations.slice(0, 50) });
    }
    
    // Dream Predictions
    if (chatBot.dreamSimulation) {
      const dreamTopics = chatBot.dreamSimulation.predictDreamTopics ? 
        chatBot.dreamSimulation.predictDreamTopics() : [];
      io.emit('dream_prediction', { topics: dreamTopics });
    }
    
    // Memory details (for system card)
    if (chatBot.memoryConsolidation) {
      const memories = chatBot.memoryConsolidation.memories || [];
      const recentImportant = memories
        .filter(m => m.importance > 70)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .map(m => ({
          text: m.text || m.content || '',
          importance: Math.round(m.importance),
          timestamp: m.timestamp,
          type: m.type || 'general'
        }));
      io.emit('memory_details', { memories: recentImportant });
    }
    
    // NEW CHAOS SYSTEMS
    // Personality Splits
    if (chatBot.personalitySplits) {
      const personalityState = chatBot.personalitySplits.getStatus();
      io.emit('personality_splits', personalityState);
    }
    
    // Chaos Events
    if (chatBot.chaosEvents) {
      const chaosState = chatBot.chaosEvents.getStatus();
      io.emit('chaos_events', chaosState);
    }
    
    // Meta Chat Awareness
    if (chatBot.metaChatAwareness) {
      const metaState = chatBot.metaChatAwareness.getStatus();
      io.emit('meta_awareness', metaState);
    }
    
    // Social Hierarchy
    if (chatBot.socialHierarchy) {
      const hierarchyState = chatBot.socialHierarchy.getStatus();
      io.emit('social_hierarchy', hierarchyState);
    }
    
    // Video Context Engine
    if (chatBot.videoContextEngine) {
      const videoState = chatBot.videoContextEngine.getStatus();
      io.emit('video_context', videoState);
    }
    
    // Inner Monologue Broadcaster
    if (chatBot.innerMonologueBroadcaster) {
      const innerState = chatBot.innerMonologueBroadcaster.getStatus();
      io.emit('inner_monologue', innerState);
    }
    
    // Event Memory System
    if (chatBot.eventMemorySystem) {
      const eventState = chatBot.eventMemorySystem.getStatus();
      io.emit('event_memory', eventState);
    }
    
    // Vibe Shifter
    if (chatBot.vibeShifter) {
      const vibeState = chatBot.vibeShifter.getStatus();
      io.emit('vibe_shifter', vibeState);
    }
    
    // Prediction Engine
    if (chatBot.predictionEngine) {
      const predictionState = chatBot.predictionEngine.getStatus();
      io.emit('predictions', predictionState);
    }
    
    // Bit Commitment
    if (chatBot.bitCommitment) {
      const bitState = chatBot.bitCommitment.getStatus();
      io.emit('bit_commitment', bitState);
    }
    
    // Personality Infection
    if (chatBot.personalityInfection) {
      const infectionState = chatBot.personalityInfection.getStatus();
      io.emit('personality_infection', infectionState);
    }
    
    // Topics & Knowledge
    if (chatBot.chatStats?.topicsDiscussed) {
      const topicsArray = Array.from(chatBot.chatStats.topicsDiscussed.entries())
        .map(([topic, count]) => ({
          name: topic,
          mentions: count,
          knowledgeLevel: determineKnowledgeLevel(count),
          fragments: generateKnowledgeFragments(topic, count)
        }))
        .sort((a, b) => b.mentions - a.mentions);
      
      io.emit('topics_update', { topics: topicsArray });
    }
    
    // Comprehensive Stats
    const comprehensiveStats = {
      totalMessages: chatBot.chatStats?.totalMessages || 0,
      messagesSent: chatBot.chatStats?.messagesSent || 0,
      activeUsers: chatBot.chatStats?.activeUsers?.size || 0,
      memoryCount: chatBot.memoryConsolidation?.memories?.length || 0,
      importantMemories: chatBot.memoryConsolidation?.memories?.filter(m => m.importance > 70).length || 0,
      forgottenMemories: chatBot.memoryDecay?.forgottenCount || 0,
      videosWatched: chatBot.videoLearning?.videosWatched?.length || 0,
      favoriteGenre: chatBot.videoLearning?.favoriteGenre || 'Unknown',
      currentVideo: videoManager.getCurrentVideo()?.title || 'None'
    };
    io.emit('stats', comprehensiveStats);
    
  } catch (error) {
    console.error('Error broadcasting inner mind data:', error.message);
  }
}, 5000); // Update every 5 seconds (mind data changes frequently)

// Slower updates for diary (less frequent changes)
setInterval(() => {
  try {
    if (chatBot.sluntDiary) {
      const diaryEntries = chatBot.sluntDiary.getRecentEntries ? 
        chatBot.sluntDiary.getRecentEntries(20) : 
        chatBot.sluntDiary.entries?.slice(-20) || [];
      io.emit('diary_update', { entries: diaryEntries });
    }
  } catch (error) {
    console.error('Error broadcasting diary:', error.message);
  }
}, 600000); // Update every 10 minutes

// API Routes
app.get('/api/health', (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      bot: coolholeClient.isConnected(),
      chatReady: coolholeClient.isChatReady(),
      currentVideo: videoManager.getCurrentVideo(),
      queueLength: videoManager.getQueueLength()
    });
  } catch (error) {
    console.error('Health endpoint error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/current-video', (req, res) => {
  try {
    const currentVideo = videoManager.getCurrentVideo();
    res.json(currentVideo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/queue', (req, res) => {
  try {
    const queue = videoManager.getQueue();
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to send a message to Coolhole
app.post('/api/test-message', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }
  
  try {
    if (!coolholeClient.isConnected()) {
      return res.status(503).json({ error: 'Not connected to Coolhole' });
    }
    
    console.log(`🧪 [API] Test message request: "${message}"`);
    const success = await coolholeClient.sendChat(message);
    
    if (success) {
      res.json({ success: true, message: 'Message sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send message' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/queue', (req, res) => {
  const { videoId, title, type = 'yt' } = req.body;
  
  try {
    const result = videoManager.addToQueue(videoId, title, type);
    coolholeClient.queueVideo(videoId, type);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/search/:query', async (req, res) => {
  const { query } = req.params;
  
  try {
    const results = await videoManager.searchVideos(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bot Learning & AI Monitoring Endpoints
app.get('/api/bot/status', (req, res) => {
  try {
    const status = chatBot.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/personality', (req, res) => {
  try {
    const personality = chatBot.getPersonalityState();
    res.json(personality);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/stats', (req, res) => {
  try {
    const stats = chatBot.getChatStatistics();
    // Add advanced stats
    const advancedStats = chatBot.getAdvancedStats();
    res.json({
      ...stats,
      advanced: advancedStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NEW: Monitoring & Metrics Endpoints
app.get('/api/monitoring/report', (req, res) => {
  try {
    const report = chatBot.getMonitoringReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/monitoring/suggestions', (req, res) => {
  try {
    const suggestions = chatBot.getSuggestions();
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/monitoring/health', (req, res) => {
  try {
    const report = chatBot.getMonitoringReport();
    const healthScore = report.logAnalyzer ? report.logAnalyzer.healthScore : 100;
    
    res.json({
      healthScore,
      status: healthScore > 80 ? 'excellent' : healthScore > 60 ? 'good' : healthScore > 40 ? 'degraded' : 'critical',
      metrics: report.metrics,
      issues: report.logAnalyzer ? report.logAnalyzer.issues : [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stability monitoring endpoints
app.get('/api/stability/status', (req, res) => {
  try {
    const status = chatBot.getStabilityStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stability/errors', (req, res) => {
  try {
    const errorReport = chatBot.errorRecovery.getErrorReport();
    res.json(errorReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stability/memory', (req, res) => {
  try {
    const memoryStats = chatBot.memoryManager.getStats();
    const usage = chatBot.memoryManager.checkMemoryUsage();
    res.json({ ...memoryStats, currentUsage: usage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Slunt Control Endpoints
app.post('/api/slunt/start', async (req, res) => {
  try {
    const result = await sluntManager.start();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/slunt/stop', async (req, res) => {
  try {
    const result = await sluntManager.stop();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/slunt/restart', async (req, res) => {
  try {
    const result = await sluntManager.restart();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/slunt/status', (req, res) => {
  try {
    const status = sluntManager.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/slunt/config', async (req, res) => {
  try {
    const newConfig = req.body;
    const config = await sluntManager.updateConfig(newConfig);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/topics', (req, res) => {
  try {
    const topics = chatBot.getTrendingTopics(20);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/conversation', (req, res) => {
  try {
    const conversation = chatBot.getConversationContext(30);
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/user/:username', (req, res) => {
  const { username } = req.params;
  
  try {
    const profile = chatBot.getUserProfile(username);
    if (!profile) {
      res.status(404).json({ error: 'User not found in bot memory' });
      return;
    }
    
    // Convert Maps and Sets to objects for JSON
    const profileData = {
      ...profile,
      commonWords: Object.fromEntries(profile.commonWords || []),
      topics: Object.fromEntries(profile.topics || []),
      interests: Array.from(profile.interests || []),
      emoji_usage: Object.fromEntries(profile.emoji_usage || []),
      opinions: Object.fromEntries(profile.opinions || []),
      friendsWith: Array.from(profile.friendsWith || []),
      whoTheyMention: Object.fromEntries(profile.whoTheyMention || []),
      mentionedBy: Object.fromEntries(profile.mentionedBy || []),
      activeHours: Object.fromEntries(profile.activeHours || [])
    };
    
    res.json(profileData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/insights', (req, res) => {
  try {
    const insights = chatBot.getCommunityInsights();
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Slunt's observations and notes about users/community
app.get('/api/bot/observations', (req, res) => {
  try {
    const observations = chatBot.getObservations();
    res.json(observations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cursor Controller Endpoints
app.get('/api/cursor/stats', (req, res) => {
  try {
    if (!cursorController) {
      return res.status(503).json({ error: 'Cursor controller not initialized' });
    }
    const stats = cursorController.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === NEW: ADVANCED AI SYSTEM ENDPOINTS ===

// Emotional Intelligence Endpoints
app.get('/api/advanced/emotional/:username', (req, res) => {
  try {
    const { username } = req.params;
    const pattern = chatBot.emotionalEngine.getEmotionalPattern(username);
    const summary = chatBot.emotionalEngine.getEmotionalSummary(username);
    res.json({ username, pattern, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Relationship Mapping Endpoints
app.get('/api/advanced/relationships/:username', (req, res) => {
  try {
    const { username } = req.params;
    const connections = chatBot.socialGraph.get(username);
    const suggestions = chatBot.relationshipMapping.suggestConnections(username);
    res.json({ 
      username, 
      connections: connections ? Array.from(connections.entries()) : [],
      suggestions 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/advanced/relationships/between/:user1/:user2', (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const summary = chatBot.relationshipMapping.getRelationshipSummary(user1, user2);
    const beef = chatBot.relationshipMapping.detectBeef(user1, user2);
    const mutual = chatBot.relationshipMapping.findMutualFriends(user1, user2);
    res.json({ user1, user2, summary, beef, mutualFriends: mutual });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/advanced/community/graph', (req, res) => {
  try {
    const graph = chatBot.relationshipMapping.getGraphVisualization();
    const insights = chatBot.relationshipMapping.getCommunityInsights();
    res.json({ graph, insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/advanced/community/groups', (req, res) => {
  try {
    const groups = chatBot.relationshipMapping.detectFriendGroups();
    const hubs = chatBot.relationshipMapping.findHubs();
    res.json({ friendGroups: groups, communityHubs: hubs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Memory Consolidation Endpoints
app.get('/api/advanced/memory/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" required' });
    }
    const results = chatBot.memoryConsolidation.searchMemories(q);
    res.json({ query: q, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/memory/consolidate', async (req, res) => {
  try {
    await chatBot.memoryConsolidation.consolidateMemories();
    const stats = chatBot.memoryConsolidation.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/memory/archive', async (req, res) => {
  try {
    const archived = await chatBot.memoryConsolidation.archiveInactiveUsers();
    res.json({ success: true, archivedUsers: archived });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Personality Evolution Endpoints
app.get('/api/advanced/personality', (req, res) => {
  try {
    const stats = chatBot.personalityEvolution.getStats();
    const progress = chatBot.personalityEvolution.getEvolutionProgress();
    res.json({ stats, progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/personality/evolve', (req, res) => {
  try {
    chatBot.personalityEvolution.evolvePersonality();
    const stats = chatBot.personalityEvolution.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/personality/reset', (req, res) => {
  try {
    chatBot.personalityEvolution.resetToDefault();
    res.json({ success: true, personality: chatBot.personality });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Video Learning Endpoints
app.get('/api/advanced/video/stats', (req, res) => {
  try {
    const stats = chatBot.videoLearning.getStats();
    const insights = chatBot.videoLearning.getCommunityInsights();
    res.json({ stats, insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/advanced/video/suggest/:username?', (req, res) => {
  try {
    const { username } = req.params;
    const suggestion = chatBot.videoLearning.suggestVideo(username);
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Social Awareness Endpoints
app.get('/api/advanced/social/health', (req, res) => {
  try {
    const health = chatBot.socialAwareness.assessChatHealth();
    const stats = chatBot.socialAwareness.getStats();
    res.json({ health, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/social/revive', async (req, res) => {
  try {
    await chatBot.socialAwareness.reviveChat();
    res.json({ success: true, message: 'Attempted to revive chat' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Proactive Friendship Endpoints
app.get('/api/advanced/proactive/stats', (req, res) => {
  try {
    const stats = chatBot.proactiveFriendship.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/proactive/reach-out/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const profile = chatBot.userProfiles.get(username);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    await chatBot.proactiveFriendship.reachOutToUser(username, 'manual', profile);
    res.json({ success: true, username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/proactive/share-memory/:username', async (req, res) => {
  try {
    const { username } = req.params;
    await chatBot.proactiveFriendship.shareMemory(username);
    res.json({ success: true, username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === END ADVANCED AI ENDPOINTS ===

app.post('/api/cursor/click', async (req, res) => {
  try {
    if (!cursorController) {
      return res.status(503).json({ error: 'Cursor controller not initialized' });
    }
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Element name required' });
    }
    const result = await cursorController.clickByName(name);
    res.json({ success: result, element: name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cursor/emote', async (req, res) => {
  try {
    if (!cursorController) {
      return res.status(503).json({ error: 'Cursor controller not initialized' });
    }
    await cursorController.useRandomEmote();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cursor/personality', (req, res) => {
  try {
    if (!cursorController) {
      return res.status(503).json({ error: 'Cursor controller not initialized' });
    }
    const traits = req.body;
    cursorController.updatePersonality(traits);
    res.json({ success: true, personality: traits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Feature Exploration Endpoints
app.get('/api/explorer/features', (req, res) => {
  try {
    if (!coolholeExplorer) {
      return res.status(503).json({ error: 'Explorer not initialized' });
    }
    const data = coolholeExplorer.getExplorationData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/explorer/progress', (req, res) => {
  try {
    if (!coolholeExplorer) {
      return res.status(503).json({ error: 'Explorer not initialized' });
    }
    const progress = coolholeExplorer.getProgress();
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vision Analysis Endpoints
app.get('/api/vision/insights', (req, res) => {
  try {
    if (!visionAnalyzer) {
      return res.status(503).json({ error: 'Vision analyzer not initialized' });
    }
    const insights = visionAnalyzer.getInsights();
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vision/memory', (req, res) => {
  try {
    if (!visionAnalyzer) {
      return res.status(503).json({ error: 'Vision analyzer not initialized' });
    }
    const memory = visionAnalyzer.getMemorySummary();
    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vision/capture', async (req, res) => {
  try {
    if (!visionAnalyzer) {
      return res.status(503).json({ error: 'Vision analyzer not initialized' });
    }
    const analysis = await visionAnalyzer.captureAndAnalyze({
      detectScenes: true,
      readText: true,
      analyzeColors: true
    });
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comprehensive Stats API for detailed dashboard views
app.get('/api/stats', async (req, res) => {
  try {
    const data = {
      bot: {
        status: chatBot.getStatus(),
        personality: chatBot.getPersonalityState(),
        currentPersonality: chatBot.getCurrentPersonality ? chatBot.getCurrentPersonality() : {},
        stats: chatBot.getChatStatistics(),
        insights: chatBot.getCommunityInsights(),
        userProfiles: chatBot.getAllUserProfiles ? chatBot.getAllUserProfiles() : [],
        relationships: chatBot.getAllRelationships ? chatBot.getAllRelationships() : {}
      },
      timestamp: Date.now()
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comprehensive Dashboard Data Endpoint
app.get('/api/dashboard', async (req, res) => {
  try {
    const data = {
      bot: {
        status: chatBot.getStatus(),
        personality: chatBot.getPersonalityState(),
        stats: chatBot.getChatStatistics(),
        insights: chatBot.getCommunityInsights()
      },
      explorer: coolholeExplorer ? coolholeExplorer.getExplorationData() : null,
      vision: visionAnalyzer ? visionAnalyzer.getInsights() : null,
      cursor: cursorController ? cursorController.getStats() : null,
      video: {
        current: videoManager.getCurrentVideo(),
        queue: videoManager.getQueue()
      },
      timestamp: Date.now()
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track connected clients
let connectedClients = 0;

// WebSocket connection handling
io.on('connection', (socket) => {
  connectedClients++;
  console.log(`🔌 [Socket.IO] Client connected: ${socket.id} (Total: ${connectedClients})`);

  // Handle socket errors
  socket.on('error', (error) => {
    logger.error(`❌ [Socket.IO] Socket error for ${socket.id}:`, error.message);
  });

  // Send current state immediately when dashboard connects
  if (coolholeExplorer) {
    const explorerData = coolholeExplorer.getExplorationData();
    if (VERBOSE) console.log(`📡 [Socket.IO] Sending initial explorer data to ${socket.id}`);
    socket.emit('explorer:emotes', {
      emotes: explorerData.features?.emotes || [],
      totalFound: explorerData.features?.emotes?.length || 0
    });
    socket.emit('explorer:progress', explorerData.progress);
  }

  if (visionAnalyzer) {
    const visionData = visionAnalyzer.getInsights();
    if (VERBOSE) console.log(`📡 [Socket.IO] Sending initial vision data to ${socket.id}`);
    socket.emit('vision:fullAnalysis', visionData);
  }
  
  // Send bot status
  socket.emit('bot:status', {
    connected: coolholeClient.isConnected(),
    chatReady: coolholeClient.isChatReady(),
    stats: chatBot.getChatStatistics(),
    personality: chatBot.getPersonalityState(),
    voiceMemory: chatBot.voiceMemory || []
  });
  
  // Send initial diary entries
  try {
    if (chatBot.sluntDiary) {
      const diaryEntries = chatBot.sluntDiary.getRecentEntries ? 
        chatBot.sluntDiary.getRecentEntries(20) : 
        chatBot.sluntDiary.entries?.slice(-20) || [];
      socket.emit('diary_update', { entries: diaryEntries });
    }
  } catch (error) {
    console.error('Error sending initial diary:', error.message);
  }

  socket.on('join_channel', (data) => {
    socket.join(data.channel);
    console.log(`Socket ${socket.id} joined channel: ${data.channel}`);
  });

  socket.on('chat_message', (data) => {
    chatBot.handleMessage(data);
    io.to(data.channel).emit('chat_message', data);
  });

  socket.on('get_current_video', () => {
    const currentVideo = videoManager.getCurrentVideo();
    socket.emit('current_video', currentVideo);
  });

  socket.on('get_queue', () => {
    const queue = videoManager.getQueue();
    socket.emit('queue_update', queue);
  });

  socket.on('search_videos', async (query) => {
    try {
      const results = await videoManager.searchVideos(query);
      socket.emit('search_results', results);
    } catch (error) {
      socket.emit('search_error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`❌ [Socket.IO] Client disconnected: ${socket.id} (Remaining: ${connectedClients})`);
  });
  
  // Multi-platform dashboard endpoints
  socket.on('request_status', () => {
    const status = platformManager.getStatus();
    socket.emit('platform:status', status);
  });
  
  socket.on('update_personality', (settings) => {
    if (chatBot && chatBot.personality) {
      chatBot.personality.chattiness = settings.chattiness || chatBot.personality.chattiness;
      chatBot.personality.humor = settings.humor || chatBot.personality.humor;
      chatBot.personality.edginess = settings.edginess || chatBot.personality.edginess;
      console.log('🎭 Personality updated:', settings);
    }
  });
  
  // Voice chat endpoints
  // Optional: receive raw audio from client for server-side STT
  socket.on('voice:audio', async (arrayBuffer) => {
    try {
      const axios = require('axios');
      const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'YOUR_ELEVENLABS_API_KEY';
      const audioBuffer = Buffer.from(arrayBuffer);
      const response = await axios.post(
        'https://api.elevenlabs.io/v1/speech-to-text',
        audioBuffer,
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'audio/webm',
          },
        }
      );
      const transcript = response.data.transcript || '[No transcript]';
      socket.emit('voice:transcript', { text: transcript });
    } catch (err) {
      console.error('STT error:', err);
      socket.emit('voice:transcript', { text: '[STT error]' });
    }
  });
  socket.on('voice:status', (callback) => {
    const status = {
      enabled: voiceManager ? voiceManager.config.enabled : false,
      isListening: voiceManager ? voiceManager.isListening : false,
      isSpeaking: voiceManager ? voiceManager.isSpeaking : false,
      stats: voiceManager ? voiceManager.getStats() : null
    };
    if (callback) callback(status);
  });
  
  socket.on('voice:speech', async (data) => {
    try {
      if (!voiceManager) {
        socket.emit('voice:error', { message: 'Voice system not initialized' });
        return;
      }
      
      console.log(`🎤 [Voice] Received speech: "${data.text}"`);
      
      // Process speech as a message from the user
      const voiceMessage = {
        platform: 'voice-chat',
        username: data.username || 'You',
        text: data.text,
        timestamp: Date.now(),
        channel: 'voice-chat',
        isVoiceMessage: true
      };
      
      // Send to chatBot for processing
      const response = await chatBot.generateResponse(voiceMessage);
      
      if (response) {
        console.log(`🗣️ [Voice] Slunt responds: "${response}"`);
        
        // Generate speech audio
        const audioUrl = await voiceManager.speak(response);
        
        if (audioUrl) {
          console.log(`✅ [Voice] ElevenLabs audio generated: ${audioUrl}`);
        } else {
          console.log(`⚠️ [Voice] No ElevenLabs audio - browser will use fallback TTS`);
        }
        
        // Send response back to client
        socket.emit('voice:response', {
          text: response,
          audioUrl: audioUrl ? `/temp/audio/${path.basename(audioUrl)}` : null,
          timestamp: Date.now()
        });
      } else {
        // Response was filtered/rejected - send a fallback
        console.log(`⚠️ [Voice] Response was filtered, using fallback`);
        const fallbacks = [
          "What?",
          "I didn't catch that.",
          "Say that again?",
          "Come again?",
          "Huh?"
        ];
        const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        
        const audioUrl = await voiceManager.speak(fallback);
        socket.emit('voice:response', {
          text: fallback,
          audioUrl: audioUrl ? `/temp/audio/${path.basename(audioUrl)}` : null,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('❌ [Voice] Error processing speech:', error);
      socket.emit('voice:error', { message: error.message });
    }
  });
  
  socket.on('voice:interrupt', () => {
    if (voiceManager) {
      voiceManager.stopSpeaking();
      console.log('⏸️ [Voice] Speech interrupted by user');
    }
  });
  
  
  socket.on('mute_bot', (data) => {
    const duration = data.duration || 300000;
    chatBot.muted = true;
    setTimeout(() => {
      chatBot.muted = false;
      io.emit('bot_unmuted');
    }, duration);
    console.log(`🔇 Bot muted for ${duration / 1000} seconds`);
  });
  
  // NEW: Crazy Features Status Endpoint 🎭🔥💀
  socket.on('getStatus', () => {
    try {
      const crazyFeaturesStatus = {
        type: 'crazyFeatures',
        status: {
          addiction: chatBot.addictionSystem ? chatBot.addictionSystem.getStatus() : null,
          conspiracy: chatBot.conspiracyGenerator ? chatBot.conspiracyGenerator.getStatus() : null,
          memes: chatBot.memeLifecycleTracker ? chatBot.memeLifecycleTracker.getStatus() : null,
          falseMemory: chatBot.falseMemorySystem ? chatBot.falseMemorySystem.getStatus() : null,
          hallucination: chatBot.dreamHallucinationSystem ? chatBot.dreamHallucinationSystem.getStatus() : null,
          parasocial: chatBot.parasocialTracker ? chatBot.parasocialTracker.getStatus() : null,
          crush: chatBot.celebrityCrushSystem ? chatBot.celebrityCrushSystem.getStatus() : null,
          gossip: chatBot.gossipRumorMill ? chatBot.gossipRumorMill.getStatus() : null,
          sniping: chatBot.streamSnipingDetector ? chatBot.streamSnipingDetector.getStatus() : null,
          rivalBots: chatBot.rivalBotWars ? chatBot.rivalBotWars.getStatus() : null,
          cult: chatBot.sluntCultSystem ? chatBot.sluntCultSystem.getStatus() : null,
          theater: chatBot.chatTheaterMode ? chatBot.chatTheaterMode.getStatus() : null,
          collective: chatBot.collectiveUnconscious ? chatBot.collectiveUnconscious.getStatus() : null,
          timeLoop: chatBot.timeLoopDetector ? chatBot.timeLoopDetector.getStatus() : null
        }
      };
      socket.emit('message', crazyFeaturesStatus);
    } catch (error) {
      console.error('Error getting crazy features status:', error.message);
    }
  });
  
  // NEW: Admin Control Handlers 🎮
  socket.on('admin:conspiracy', () => {
    try {
      if (chatBot.conspiracyGenerator) {
        const conspiracy = chatBot.conspiracyGenerator.generateConspiracy('Admin', 'trigger');
        console.log('🔍 Admin triggered conspiracy:', conspiracy?.theory);
        io.emit('activity', { type: 'activity', message: '🔍 New conspiracy generated', timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error triggering conspiracy:', error.message);
    }
  });

  socket.on('admin:ritual', () => {
    try {
      if (chatBot.sluntCultSystem) {
        const ritual = chatBot.sluntCultSystem.startRitual('Admin', 'PRAISE');
        console.log('🕯️ Admin started ritual:', ritual?.type);
        io.emit('activity', { type: 'activity', message: '🕯️ Cult ritual started', timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error starting ritual:', error.message);
    }
  });

  socket.on('admin:timeloop', () => {
    try {
      if (chatBot.timeLoopDetector) {
        chatBot.timeLoopDetector.temporalAnomalyScore += 50;
        console.log('⏰ Admin forced time loop detection');
        io.emit('activity', { type: 'activity', message: '⏰ Time loop anomaly triggered', timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error forcing time loop:', error.message);
    }
  });

  socket.on('admin:falsememory', () => {
    try {
      if (chatBot.falseMemorySystem) {
        const memory = chatBot.falseMemorySystem.injectFalseMemory({
          type: 'admin_injection',
          content: 'Something that never happened',
          confidence: 0.8
        });
        console.log('🧠 Admin injected false memory');
        io.emit('activity', { type: 'activity', message: '🧠 False memory injected', timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error injecting memory:', error.message);
    }
  });

  socket.on('admin:rumor', () => {
    try {
      if (chatBot.gossipRumorMill) {
        const rumor = chatBot.gossipRumorMill.createRumor('Admin', 'Admin created drama', 'admin', {});
        console.log('🗣️ Admin spread rumor');
        io.emit('activity', { type: 'activity', message: '🗣️ New rumor spreading', timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error spreading rumor:', error.message);
    }
  });

  socket.on('admin:theater', () => {
    try {
      if (chatBot.chatTheaterMode) {
        const play = chatBot.chatTheaterMode.generatePlay('comedy', ['Admin', 'Slunt']);
        console.log('🎭 Admin started theater play:', play?.title);
        io.emit('activity', { type: 'activity', message: `🎭 Play started: ${play?.title}`, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error starting play:', error.message);
    }
  });

  socket.on('admin:gaslighting', () => {
    try {
      if (chatBot.falseMemorySystem) {
        chatBot.falseMemorySystem.gaslightingMode = !chatBot.falseMemorySystem.gaslightingMode;
        const status = chatBot.falseMemorySystem.gaslightingMode ? 'ON' : 'OFF';
        console.log(`😵 Admin toggled gaslighting: ${status}`);
        io.emit('activity', { type: 'activity', message: `😵 Gaslighting mode: ${status}`, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error toggling gaslighting:', error.message);
    }
  });

  socket.on('admin:reset', () => {
    try {
      console.log('🔄 Admin resetting all crazy features systems...');
      
      // Reset each system
      if (chatBot.addictionSystem) chatBot.addictionSystem = new (require('./src/ai/AddictionSystem'))();
      if (chatBot.conspiracyGenerator) chatBot.conspiracyGenerator = new (require('./src/ai/ConspiracyGenerator'))();
      if (chatBot.memeLifecycleTracker) chatBot.memeLifecycleTracker = new (require('./src/ai/MemeLifecycleTracker'))();
      if (chatBot.falseMemorySystem) chatBot.falseMemorySystem = new (require('./src/ai/FalseMemorySystem'))();
      if (chatBot.dreamHallucinationSystem) chatBot.dreamHallucinationSystem = new (require('./src/ai/DreamHallucinationSystem'))();
      if (chatBot.parasocialTracker) chatBot.parasocialTracker = new (require('./src/ai/ParasocialTracker'))();
      if (chatBot.celebrityCrushSystem) chatBot.celebrityCrushSystem = new (require('./src/ai/CelebrityCrushSystem'))();
      if (chatBot.gossipRumorMill) chatBot.gossipRumorMill = new (require('./src/ai/GossipRumorMill'))();
      if (chatBot.streamSnipingDetector) chatBot.streamSnipingDetector = new (require('./src/ai/StreamSnipingDetector'))();
      if (chatBot.rivalBotWars) chatBot.rivalBotWars = new (require('./src/ai/RivalBotWars'))();
      if (chatBot.sluntCultSystem) chatBot.sluntCultSystem = new (require('./src/ai/SluntCultSystem'))();
      if (chatBot.chatTheaterMode) chatBot.chatTheaterMode = new (require('./src/ai/ChatTheaterMode'))();
      if (chatBot.collectiveUnconscious) chatBot.collectiveUnconscious = new (require('./src/ai/CollectiveUnconscious'))();
      if (chatBot.timeLoopDetector) chatBot.timeLoopDetector = new (require('./src/ai/TimeLoopDetector'))();
      
      console.log('✅ All systems reset');
      io.emit('activity', { type: 'activity', message: '🔄 All systems reset', timestamp: Date.now() });
    } catch (error) {
      console.error('Error resetting systems:', error.message);
    }
  });
  
  socket.on('clear_memory', () => {
    if (chatBot) {
      chatBot.conversationContext = [];
      console.log('🧹 Recent memory cleared');
    }
  });
  
  // Backup management endpoints
  socket.on('backup:create', async (data) => {
    const label = data?.label || 'manual';
    const backupPath = await backupManager.createBackup(label);
    socket.emit('backup:created', { success: !!backupPath, path: backupPath });
  });
  
  socket.on('backup:list', async () => {
    const backups = await backupManager.listBackups();
    socket.emit('backup:list', backups);
  });
  
  socket.on('backup:restore', async (data) => {
    if (data && data.backupName) {
      const success = await backupManager.restoreBackup(data.backupName);
      socket.emit('backup:restored', { success, backupName: data.backupName });
    }
  });
  
  socket.on('backup:stats', async () => {
    const stats = await backupManager.getStats();
    socket.emit('backup:stats', stats);
  });
  
  // Rate limiter stats endpoint
  socket.on('ratelimit:stats', () => {
    const stats = rateLimiter.getStats();
    socket.emit('ratelimit:stats', stats);
  });
});

// Initialize Coolhole connection (optional for testing)
if (enableCoolhole) {
  // Wrap in async IIFE to use await
  (async () => {
    // Register Coolhole as a platform (will be connected by platformManager.initialize())
    // Only register Coolhole if not disabled
    if (process.env.DISABLE_COOLHOLE !== 'true') {
      platformManager.registerPlatform('coolhole', coolholeClient);
    } else {
      console.log('⏸️  [Coolhole] DISABLED - skipping registration');
    }
    
    // Initialize Discord if configured
    if (process.env.DISCORD_TOKEN) {
      console.log('🎮 Discord credentials found, initializing...');
      discordClient = new DiscordClient({
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.DISCORD_CLIENT_ID,
        guildIds: process.env.DISCORD_GUILD_IDS?.split(',') || []
      });
      platformManager.registerPlatform('discord', discordClient);
    }
    
    // Initialize Twitch if configured
    if (process.env.TWITCH_USERNAME && process.env.TWITCH_OAUTH_TOKEN) {
      console.log('📺 Twitch credentials found, initializing...');
      twitchClient = new TwitchClient({
        username: process.env.TWITCH_USERNAME,
        token: process.env.TWITCH_OAUTH_TOKEN,
        channels: process.env.TWITCH_CHANNELS?.split(',') || []
      });
      platformManager.registerPlatform('twitch', twitchClient);
      
      // Initialize Twitch Emote Manager
      const twitchChannel = process.env.TWITCH_CHANNELS ? 
                           process.env.TWITCH_CHANNELS.split(',')[0].replace('#', '').trim() : 
                           null;
      if (twitchChannel) {
        const twitchEmoteManager = new TwitchEmoteManager(twitchChannel);
        chatBot.twitchEmoteManager = twitchEmoteManager;
        
        // Fetch emotes after connection
        twitchClient.once('ready', async () => {
          await twitchEmoteManager.fetchEmotes();
          console.log(`😊 [TwitchEmotes] Initialized: ${twitchEmoteManager.getTotalEmoteCount()} emotes available`);
        });
      }
    }
    
    // Setup unified chat handler for all platforms
    platformManager.on('chat', async (chatData) => {
      try {
        // Store channel info for responses
        chatBot.currentPlatform = chatData.platform;
        chatBot.currentChannel = chatData.channel || chatData.channelId;
        
        // Let ChatBot handle the message
        await chatBot.handleMessage(chatData);

        // Emit context-based quick replies for dashboard convenience
        try {
          const genQuickReplies = (text) => {
            if (!text || typeof text !== 'string') return [];
            const t = text.toLowerCase();
            const replies = [];
            const add = (x) => { if (replies.length < 6) replies.push(x); };
            if (t.includes('?')) {
              add('What do you mean exactly?');
              add("I don't fully agree—why?");
              add('Give me an example.');
            }
            if (/(music|song|band|album)/.test(t)) {
              add('What’s your favorite right now?');
              add('Send a link.');
            }
            if (/(game|steam|ps5|xbox)/.test(t)) {
              add('Worth playing this week?');
              add('Solo or co‑op?');
            }
            if (/(movie|show|netflix|series)/.test(t)) {
              add('No spoilers—rate it 1‑10.');
              add('Short pitch me.');
            }
            if (replies.length === 0) {
              add('Go on.');
              add('Explain that.');
              add('Why though?');
            }
            return replies.slice(0, 6);
          };
          const suggestions = genQuickReplies(chatData.text || chatData.message);
          if (suggestions.length) {
            io.emit('quickreplies:update', { suggestions });
          }
        } catch (e) { /* ignore */ }
      } catch (error) {
        console.error(`❌ Error handling ${chatData.platform} message:`, error.message);
      }
    });

    // Reaction handling is now done internally in ChatBot via setupReactionHandlers()

    // ✅ BETA: Give ChatBot access to platform clients and manager
    console.log('🤖 Connecting Beta to all platform clients...');

    // Store platform client references
    if (discordClient) {
      chatBot.discordClient = discordClient;
      console.log('✅ [Discord] Client reference set');
    }

    if (twitchClient) {
      chatBot.twitchClient = twitchClient;
      console.log('✅ [Twitch] Client reference set');
    }

    // Give ChatBot access to platform manager for sending messages
    chatBot.setPlatformManager(platformManager);
    console.log('✅ [PlatformManager] Connected to ChatBot');

    // Give ChatBot access to rate limiter and content filter (compatibility)
    chatBot.setRateLimiter(rateLimiter);
    chatBot.setContentFilter(contentFilter);

    // ========================================
    // STEP 1: Initialize all platforms FIRST
    // ========================================
    console.log('🚀 Initializing all platforms...');
    try {
      await platformManager.initialize();
    } catch (error) {
      console.error('❌ Platform initialization error (continuing anyway):', error.message);
      // Don't crash - some platforms may have failed but others might be OK
    }

    // ========================================
    // STEP 2: Register platforms with health monitor AFTER they're connected
    // ========================================
    console.log('📡 Registering platforms with health monitor...');
    
    // Only register Coolhole if not disabled
    if (process.env.DISABLE_COOLHOLE !== 'true') {
      healthMonitor.registerPlatform('coolhole', coolholeClient, {
        enabled: true,
        critical: true, // Coolhole is critical for operation
        reconnectOnFail: true,
        maxReconnectAttempts: 10 // More attempts for critical platform
      });
    }

    if (discordClient) {
      healthMonitor.registerPlatform('discord', discordClient, {
        enabled: true,
        critical: false,
        reconnectOnFail: false // DISABLED - don't auto-reconnect Discord
      });
    }

    if (twitchClient) {
      healthMonitor.registerPlatform('twitch', twitchClient, {
        enabled: true,
        critical: false,
        reconnectOnFail: false // DISABLED - don't auto-reconnect Twitch
      });
    }

    // ========================================
    // STEP 3: Set up health monitor event listeners
    // ========================================
    healthMonitor.on('platform:disconnected', (data) => {
      console.log(`⚠️ [HealthMonitor] ${data.platform} disconnected`);
      io.emit('health:alert', {
        type: 'disconnected',
        platform: data.platform,
        timestamp: Date.now()
      });
    });

    healthMonitor.on('platform:reconnected', (data) => {
      console.log(`✅ [HealthMonitor] ${data.platform} reconnected after ${data.attempts} attempts`);
      io.emit('health:alert', {
        type: 'reconnected',
        platform: data.platform,
        attempts: data.attempts,
        timestamp: Date.now()
      });
    });

    healthMonitor.on('platform:failed', (data) => {
      console.log(`❌ [HealthMonitor] ${data.platform} failed to reconnect after ${data.attempts} attempts`);
      io.emit('health:alert', {
        type: 'failed',
        platform: data.platform,
        attempts: data.attempts,
        timestamp: Date.now()
      });
    });

    // ========================================
    // STEP 4: START health monitoring LAST
    // ========================================
    healthMonitor.start();
    console.log('💗 Health monitoring started');
    
    // Initialize clip creator if Twitch is available
    // DISABLED: Method doesn't exist, clip creation not critical for chat
    /*
    if (twitchClient) {
      chatBot.initializeClipCreator(twitchClient);
      
      // Listen for clip events
      chatBot.on('clip:created', (clipInfo) => {
        io.emit('clip:created', clipInfo);
      });
    }
    */
    
    // Initialize stream status monitor for platform switching
    if (twitchClient && process.env.TWITCH_CLIENT_ID && process.env.TWITCH_OAUTH_TOKEN) {
      const streamMonitor = new StreamStatusMonitor(platformManager);
      // Extract channel name from TWITCH_CHANNELS (format: "broteam" or "#broteam")
      const twitchChannel = process.env.TWITCH_CHANNELS ? 
                           process.env.TWITCH_CHANNELS.split(',')[0].replace('#', '').trim() : 
                           null;
      
      if (twitchChannel) {
        console.log(`📺 Starting stream status monitor for channel: ${twitchChannel}`);
        streamMonitor.start(twitchChannel);
        
        // Make monitor available globally for testing
        global.streamMonitor = streamMonitor;
      } else {
        console.log('⚠️ TWITCH_CHANNELS not configured, stream status monitor disabled');
      }
    } else {
      console.log('⚠️ Twitch credentials not configured, stream status monitor disabled');
    }
  })().catch(error => {
    console.error('❌ Error initializing platforms:', error);
  });
  
  // Coolhole connection events are handled via PlatformManager and ChatBot handlers
  // Advanced features remain disabled unless explicitly enabled via env flags
  console.log('ℹ️  Coolhole wired through PlatformManager; advanced features disabled unless enabled');
} else {
  console.log('Coolhole connection disabled - running in test mode');
}

// Start server
// Removed duplicate PORT declaration; now set at the top of the file

// Kill any process using the port before starting
const killPortProcess = async (port) => {
  const shouldKill = String(process.env.KILL_PORT_ON_START || '').toLowerCase() === 'true';
  if (!shouldKill) {
    console.log(`[PortKill] Skipped freeing port ${port} (set KILL_PORT_ON_START=true to enable)`);
    return;
  }
  const { exec } = require('child_process');
  const platform = process.platform;
  let cmd;
  if (platform === 'win32') {
    // Windows: use netstat to find PID, then taskkill
    cmd = `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`;
  } else {
    // Unix: use lsof to find PID, then kill
    cmd = `lsof -ti:${port} | xargs kill -9`;
  }
  return new Promise((resolve) => {
    exec(cmd, (err) => {
      if (err) {
        console.log(`[PortKill] Could not kill process on port ${port}:`, err.message);
      } else {
        console.log(`[PortKill] Killed process(es) on port ${port}`);
      }
      resolve();
    });
  });
};

// Prevent unhandled promise rejections from crashing the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [CRITICAL] Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  // Don't exit - keep server running
});

process.on('uncaughtException', (error) => {
  console.error('❌ [CRITICAL] Uncaught Exception:', error);
  // Don't exit - keep server running unless it's truly fatal
  if (error.code === 'ERR_IPC_CHANNEL_CLOSED' || error.code === 'ECONNRESET') {
    console.log('⚠️  Non-fatal error, continuing...');
  }
});

(async () => {
  // Detect and use available port
  PORT = await findAvailablePort(PREFERRED_PORT);
  console.log(`🚀 [Server] Starting on port ${PORT}`);
  
  await killPortProcess(PORT);
  
  // Initialize backup system
  await backupManager.initialize();

  // Auto-start XTTS fine-tuned Hoff voice server if using openvoice TTS provider
  if (process.env.VOICE_TTS_PROVIDER === 'openvoice') {
    const { spawn } = require('child_process');
    const openvoicePort = process.env.OPENVOICE_SERVER_URL?.match(/:(\d+)/)?.[1] || '5001';

    console.log('🎤 [XTTS] Starting fine-tuned Hoff voice server (5.6GB model)...');
    console.log('   This may take 30-60 seconds to load the model...');

    const pythonCmd = path.join(__dirname, 'OpenVoice', 'venv', 'Scripts', 'python.exe');
    const openvoiceProcess = spawn(pythonCmd, ['api_server_xtts.py'], {
      cwd: path.join(__dirname, 'OpenVoice'),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    openvoiceProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[XTTS] ${output.trim()}`);
      if (output.includes('Running on')) {
        console.log(`✅ [XTTS] Fine-tuned Hoff voice server ready on port ${openvoicePort}`);
      }
    });

    openvoiceProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('FutureWarning') && !error.includes('weight_norm')) {
        console.error(`[XTTS] ${error.trim()}`);
      }
    });

    openvoiceProcess.on('error', (err) => {
      console.error('❌ [XTTS] Failed to start:', err.message);
      console.error('   Voice TTS will not be available');
    });

    openvoiceProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`⚠️  [OpenVoice] Server exited with code ${code}`);
      }
    });

    // Store process reference for cleanup
    global.openvoiceProcess = openvoiceProcess;

    // Wait for OpenVoice models to load (takes ~15-20 seconds)
    console.log('⏳ [OpenVoice] Waiting for models to load (this takes ~20 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 25000));
    console.log('✅ [OpenVoice] Startup wait complete');
  }

  // Start cleanup interval for rate limiter
  setInterval(() => {
    rateLimiter.cleanup();
  }, 300000); // Cleanup every 5 minutes
  
  // Start temp audio janitor to prevent disk bloat
  const TempJanitor = require('./src/utils/TempJanitor');
  const tempJanitor = new TempJanitor({
    tempDir: path.join(__dirname, 'temp', 'audio'),
    maxAge: 60 * 60 * 1000, // 1 hour
    interval: 10 * 60 * 1000 // 10 minutes
  });
  tempJanitor.start();
  
  // 🗣️ PROACTIVE VOICE: Slunt can speak without prompting!
  let voiceProactiveTimer = null;
  const startProactiveVoice = () => {
    if (voiceProactiveTimer) return; // Already running
    
    voiceProactiveTimer = setInterval(async () => {
      // Only speak if there's been recent conversation
      if (!chatBot.voiceMemory || chatBot.voiceMemory.length === 0) return;
      
      // Check if last message was from user and some time has passed (15-45 seconds)
      const lastMessage = chatBot.voiceMemory[chatBot.voiceMemory.length - 1];
      const timeSinceLastMessage = Date.now() - lastMessage.timestamp;
      
      // Random chance (20%) to speak proactively after 15-45 seconds of silence
      if (lastMessage.speaker === 'You' && timeSinceLastMessage > 15000 && timeSinceLastMessage < 45000 && Math.random() < 0.2) {
        console.log(`🎤 [Proactive] Slunt is thinking of something to say...`);
        
        try {
          const proactivePrompt = "Continue the conversation naturally. Share an insight, ask a question, or make an observation about what was just discussed.";
          const reply = await chatBot.generateResponse({
            platform: 'voice',
            username: 'You',
            text: proactivePrompt,
            timestamp: Date.now(),
            channel: 'voice',
            voiceMode: true,
            isProactive: true
          });
          
          if (reply && String(reply).trim()) {
            chatBot.voiceMemory.push({
              speaker: 'Slunt',
              text: reply,
              timestamp: Date.now(),
              proactive: true
            });
            
            console.log(`🗣️ [Proactive] Slunt says: "${reply}"`);
            
            // Emit proactive message via socket for voice client to pick up
            io.emit('voice:proactive', {
              reply,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error(`❌ [Proactive] Error:`, error.message);
        }
      }
    }, 5000); // Check every 5 seconds
    
    console.log(`🗣️ [Proactive Voice] Started - Slunt can now speak unprompted!`);
  };
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Coolhole.org Chatbot Server - RUNNING`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🎤 Voice: http://localhost:${PORT}/voice`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/`);
    console.log(`🧠 Mind: http://localhost:${PORT}/mind`);
    console.log(`🎯 Platforms: http://localhost:${PORT}/platforms`);
    console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
    if (process.env.VOICE_TTS_PROVIDER === 'openvoice') {
      const openvoicePort = process.env.OPENVOICE_SERVER_URL?.match(/:(\d+)/)?.[1] || '3002';
      console.log(`🎙️  OpenVoice Server: http://localhost:${openvoicePort}`);
    }
    console.log(`${'='.repeat(60)}\n`);
    
    // Start proactive voice system
    startProactiveVoice();
    
    // Broadcast voice memory updates every 2 seconds to all connected dashboards
    setInterval(() => {
      if (io && chatBot && chatBot.voiceMemory) {
        io.emit('voice:memory', {
          memory: chatBot.voiceMemory,
          count: chatBot.voiceMemory.length,
          maxSize: chatBot.MAX_VOICE_MEMORY || 8
        });
      }
    }, 2000);
// ...existing code...
  });
})().catch(err => {
  console.error('❌ [FATAL] Server startup failed:', err);
  process.exit(1);
});

// Graceful server error handling
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Set KILL_PORT_ON_START=true to attempt freeing it on boot, or choose a different PORT.`);
  } else {
    console.error('[ServerError]', err);
  }
});

module.exports = { app, server, io };


