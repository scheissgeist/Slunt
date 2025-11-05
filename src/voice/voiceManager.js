/**
 * Voice Manager - Slunt's Voice Interface
 * 
 * Handles:
 * - Speech-to-Text (listening to you)
 * - Text-to-Speech (Slunt talking back)
 * - Interrupt detection (you can cut him off)
 * - Real-time processing for natural conversation
 */

const EventEmitter = require('events');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const OpenAIRealtimeClient = require('./openaiRealtimeClient');
const VoiceEnhancer = require('./voiceEnhancer');

class VoiceManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Speech-to-Text options
      sttProvider: config.sttProvider || 'google', // 'google', 'whisper', 'browser'
      googleApiKey: config.googleApiKey || process.env.GOOGLE_CLOUD_API_KEY,
      
      // Text-to-Speech options
      ttsProvider: config.ttsProvider || 'piper', // 'piper', 'bark', 'elevenlabs', 'openai', 'openai-realtime', 'google', 'browser'
      elevenLabsApiKey: config.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY,
      elevenLabsVoiceId: config.elevenLabsVoiceId || process.env.ELEVENLABS_VOICE_ID, // David voice from .env
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
      openaiRealtimeVoice: config.openaiRealtimeVoice || process.env.OPENAI_REALTIME_VOICE || 'ash',
      
      // Piper TTS (Local, Free, Fast)
      piperExecutable: config.piperExecutable || process.env.PIPER_EXECUTABLE || 'piper',
      piperModel: config.piperModel || process.env.PIPER_MODEL || 'en_US-lessac-medium',
      piperSpeaker: config.piperSpeaker || process.env.PIPER_SPEAKER || '0',
      
      // Bark TTS (Local, Free, Expressive)
      barkServerUrl: config.barkServerUrl || process.env.BARK_SERVER_URL || 'http://localhost:8080',
      barkVoice: config.barkVoice || process.env.BARK_VOICE || 'male_deep',
      
      // Voice settings
      voiceSpeed: config.voiceSpeed || 1.0, // 0.5 - 2.0
      voicePitch: config.voicePitch || 1.0, // 0.5 - 2.0
      
      // Interrupt settings
      interruptEnabled: config.interruptEnabled !== false,
      silenceThreshold: config.silenceThreshold || 500, // ms of silence before considering speaking done
      
      // Audio settings
      audioOutputDevice: config.audioOutputDevice || 'default',
      audioInputDevice: config.audioInputDevice || 'default',
      
      enabled: config.enabled !== false
    };
    
    // State
    this.isListening = false;
    this.isSpeaking = false;
    this.currentAudio = null;
    this.interruptCallbacks = [];
    
    // Stats
    this.stats = {
      messagesHeard: 0,
      messagesSaid: 0,
      interruptions: 0,
      totalListeningTime: 0,
      totalSpeakingTime: 0
    };
    
    // Voice enhancer for more natural speech
    this.voiceEnhancer = new VoiceEnhancer();

    // OpenAI Realtime client
    this.realtimeClient = null;
    if (this.config.ttsProvider === 'openai-realtime') {
      this.realtimeClient = new OpenAIRealtimeClient({
        apiKey: this.config.openaiApiKey,
        voice: this.config.openaiRealtimeVoice,
        instructions: config.systemPrompt || 'You are Slunt, an edgy and unfiltered AI assistant.'
      });
    }

    console.log('🎤 [Voice] Voice Manager initialized');
    console.log(`   STT Provider: ${this.config.sttProvider}`);
    console.log(`   TTS Provider: ${this.config.ttsProvider}`);
    console.log(`   Interrupts: ${this.config.interruptEnabled ? 'Enabled' : 'Disabled'}`);
  }
  
  /**
   * Start listening to microphone input
   */
  async startListening() {
    if (!this.config.enabled) {
      console.log('⚠️ [Voice] Voice system not enabled');
      return false;
    }
    
    if (this.isListening) {
      console.log('⚠️ [Voice] Already listening');
      return false;
    }
    
    try {
      console.log('🎤 [Voice] Starting to listen...');
      this.isListening = true;
      
      // Emit listening started
      this.emit('listening:started');
      
      return true;
    } catch (error) {
      console.error('❌ [Voice] Error starting listening:', error);
      this.isListening = false;
      return false;
    }
  }
  
  /**
   * Stop listening to microphone
   */
  async stopListening() {
    if (!this.isListening) return;
    
    console.log('🔇 [Voice] Stopping listening...');
    this.isListening = false;
    this.emit('listening:stopped');
  }
  
  /**
   * Process audio input from microphone (STT)
   * This would be called by a real-time audio capture system
   */
  async processAudioInput(audioBuffer) {
    if (!this.isListening) return null;
    
    try {
      const startTime = Date.now();
      
      let text = null;
      
      // Choose STT provider
      switch (this.config.sttProvider) {
        case 'google':
          text = await this.googleSpeechToText(audioBuffer);
          break;
        case 'whisper':
          text = await this.whisperSpeechToText(audioBuffer);
          break;
        case 'browser':
          // Browser-based would use Web Speech API (handled client-side)
          console.log('⚠️ [Voice] Browser STT should be handled client-side');
          break;
        default:
          console.error('❌ [Voice] Unknown STT provider:', this.config.sttProvider);
      }
      
      if (text && text.trim().length > 0) {
        const processingTime = Date.now() - startTime;
        console.log(`🎤 [Voice] Heard: "${text}" (${processingTime}ms)`);
        
        this.stats.messagesHeard++;
        
        // Emit the heard text
        this.emit('speech:heard', {
          text: text.trim(),
          processingTime,
          timestamp: Date.now()
        });
        
        return text.trim();
      }
      
      return null;
    } catch (error) {
      console.error('❌ [Voice] Error processing audio:', error);
      return null;
    }
  }
  
  /**
   * Speak text out loud (TTS)
   */
  async speak(text, options = {}) {
    if (!this.config.enabled) {
      console.log('⚠️ [Voice] Voice system not enabled');
      return false;
    }

    if (!text || text.trim().length === 0) {
      console.log('⚠️ [Voice] No text to speak');
      return false;
    }

    try {
      // Enhance the text for more natural voice
      const enhanced = this.voiceEnhancer.enhance(text, options);
      const enhancedText = enhanced.text;
      const voiceStyle = enhanced.voiceStyle;

      console.log(`🎭 [Voice] Enhanced with emotion: ${enhanced.emotion}`);
      console.log(`🗣️ [Voice] Speaking: "${enhancedText.substring(0, 100)}..."`);

      const startTime = Date.now();

      // If already speaking and interrupts enabled, stop current speech
      if (this.isSpeaking && this.config.interruptEnabled) {
        await this.stopSpeaking();
      }

      this.isSpeaking = true;
      this.emit('speaking:started', { text: enhancedText, emotion: enhanced.emotion, voiceStyle });
      
      // Choose TTS provider
      let audioUrl = null;
      switch (this.config.ttsProvider) {
        case 'openai-realtime':
          // Use OpenAI Realtime API (streaming, interrupts, ChatGPT quality)
          await this.openaiRealtimeSpeak(text, options);
          break;
        case 'piper':
          audioUrl = await this.piperTextToSpeech(enhancedText, { ...options, voiceStyle });
          break;
        case 'bark':
          audioUrl = await this.barkTextToSpeech(enhancedText, { ...options, voiceStyle });
          break;
        case 'browser':
          // Browser TTS handled client-side
          console.log('⚠️ [Voice] Browser TTS should be handled client-side');
          this.emit('speaking:browser', { text: enhancedText, voiceStyle });
          this.isSpeaking = false;
          return true;
        case 'elevenlabs':
          audioUrl = await this.elevenLabsTextToSpeech(enhancedText, { ...options, voiceStyle });
          break;
        case 'openai':
          audioUrl = await this.openaiTextToSpeech(enhancedText, { ...options, voiceStyle });
          break;
        case 'google':
          audioUrl = await this.googleTextToSpeech(text, options);
          break;
        default:
          console.error('❌ [Voice] Unknown TTS provider:', this.config.ttsProvider);
          this.isSpeaking = false;
          return false;
      }
      
      if (audioUrl) {
        const duration = Date.now() - startTime;
        console.log(`✅ [Voice] Speech generated (${duration}ms)`);
        
        this.stats.messagesSaid++;
        this.stats.totalSpeakingTime += duration;
        
        // Emit the audio URL for playback
        this.emit('speaking:audio', {
          audioUrl,
          text,
          duration
        });
        
        // Mark speaking as done after estimated playback time
        // (in real implementation, this would be based on actual audio playback)
        const estimatedPlaybackTime = text.length * 50; // ~50ms per character
        setTimeout(() => {
          this.isSpeaking = false;
          this.emit('speaking:finished', { text });
        }, estimatedPlaybackTime);
        
        return audioUrl;
      }
      
      this.isSpeaking = false;
      return false;
      
    } catch (error) {
      console.error('❌ [Voice] Error speaking:', error);
      this.isSpeaking = false;
      this.emit('speaking:error', { error, text });
      return false;
    }
  }
  
  /**
   * Stop current speech (interrupt)
   */
  async stopSpeaking() {
    if (!this.isSpeaking) return;
    
    console.log('⏸️ [Voice] Interrupting speech...');
    this.stats.interruptions++;
    
    // Stop current audio playback
    if (this.currentAudio) {
      // In real implementation, would stop audio playback
      this.currentAudio = null;
    }
    
    this.isSpeaking = false;
    this.emit('speaking:interrupted');
    
    // Call all interrupt callbacks
    this.interruptCallbacks.forEach(cb => cb());
  }
  
  /**
   * Register callback for when speech is interrupted
   */
  onInterrupt(callback) {
    this.interruptCallbacks.push(callback);
  }
  
  /**
   * Google Cloud Speech-to-Text
   */
  async googleSpeechToText(audioBuffer) {
    if (!this.config.googleApiKey) {
      console.error('❌ [Voice] Google API key not configured');
      return null;
    }
    
    try {
      // Convert audio buffer to base64
      const audioBase64 = audioBuffer.toString('base64');
      
      const response = await axios.post(
        `https://speech.googleapis.com/v1/speech:recognize?key=${this.config.googleApiKey}`,
        {
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 48000,    // Match new high quality sample rate
            languageCode: 'en-US',
            enableAutomaticPunctuation: true
          },
          audio: {
            content: audioBase64
          }
        }
      );
      
      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0].alternatives[0].transcript;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [Voice] Google STT error:', error.message);
      return null;
    }
  }
  
  /**
   * OpenAI Whisper Speech-to-Text
   */
  async whisperSpeechToText(audioBuffer) {
    // Placeholder - would use OpenAI Whisper API
    console.log('⚠️ [Voice] Whisper STT not fully implemented yet');
    return null;
  }
  
  /**
   * OpenAI Realtime API - Streaming TTS with interrupts (ChatGPT Voice Mode quality)
   */
  async openaiRealtimeSpeak(text, options = {}) {
    try {
      if (!this.realtimeClient) {
        console.error('❌ [Voice] Realtime client not initialized');
        return false;
      }
      
      // Connect if not already connected
      if (!this.realtimeClient.connected) {
        await this.realtimeClient.connect();
      }
      
      console.log('🎤 [Voice] OpenAI Realtime speaking (streaming)...');
      
      // Send text and start streaming audio
      this.realtimeClient.sendText(text);
      
      // Emit speaking event immediately (streaming starts fast)
      this.emit('speaking:started', { text });
      
      return true;
      
    } catch (error) {
      console.error('❌ [Voice] OpenAI Realtime error:', error.message);
      return false;
    }
  }
  
  /**
   * Piper Text-to-Speech (Local, Free, Fast)
   * Download from: https://github.com/rhasspy/piper/releases
   */
  async piperTextToSpeech(text, options = {}) {
    const { spawn } = require('child_process');
    
    try {
      const audioDir = path.join(__dirname, '../../temp/audio');
      await fs.mkdir(audioDir, { recursive: true });
      
      const filename = `slunt_${Date.now()}.wav`;
      const filepath = path.join(audioDir, filename);
      
      const model = options.model || this.config.piperModel;
      const speaker = options.speaker || this.config.piperSpeaker;
      
      console.log(`🎙️ [Voice] Piper generating speech (model: ${model}, speaker: ${speaker})`);
      
      return new Promise((resolve, reject) => {
        // piper --model en_US-lessac-medium --output_file output.wav < input.txt
        const piper = spawn(this.config.piperExecutable, [
          '--model', model,
          '--speaker', speaker,
          '--output_file', filepath
        ]);
        
        // Send text to stdin
        piper.stdin.write(text);
        piper.stdin.end();
        
        let stderr = '';
        piper.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        piper.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ [Voice] Piper audio generated: ${filename}`);
            resolve(filepath);
          } else {
            console.error(`❌ [Voice] Piper failed (code ${code}): ${stderr}`);
            reject(new Error(`Piper failed: ${stderr}`));
          }
        });
        
        piper.on('error', (err) => {
          console.error('❌ [Voice] Piper error:', err.message);
          reject(err);
        });
      });
      
    } catch (error) {
      console.error('❌ [Voice] Piper TTS error:', error.message);
      return null;
    }
  }
  
  /**
   * Bark Text-to-Speech (Local, Free, Expressive)
   * Setup: Run install-bark.bat or python bark_server.py
   */
  async barkTextToSpeech(text, options = {}) {
    try {
      const voice = options.voice || this.config.barkVoice;
      
      console.log(`🎙️ [Voice] Bark generating speech (voice: ${voice})`);
      
      const response = await axios.post(
        `${this.config.barkServerUrl}/generate`,
        {
          text: text,
          voice: voice
        },
        {
          responseType: 'arraybuffer',
          timeout: 60000 // Bark can take a while, especially first run
        }
      );
      
      const audioDir = path.join(__dirname, '../../temp/audio');
      await fs.mkdir(audioDir, { recursive: true });
      
      const filename = `slunt_${Date.now()}.wav`;
      const filepath = path.join(audioDir, filename);
      
      await fs.writeFile(filepath, response.data);
      
      console.log(`✅ [Voice] Bark audio generated: ${filename}`);
      return filepath;
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ [Voice] Bark server not running!');
        console.error('   Start with: python bark_server.py');
      } else {
        console.error('❌ [Voice] Bark TTS error:', error.message);
      }
      return null;
    }
  }
  
  /**
   * ElevenLabs Text-to-Speech
   */
  async elevenLabsTextToSpeech(text, options = {}) {
    if (!this.config.elevenLabsApiKey) {
      console.error('❌ [Voice] ElevenLabs API key not configured');
      return null;
    }
    
    try {
      const primaryVoiceId = options.voiceId || this.config.elevenLabsVoiceId;
      const backupVoiceId = process.env.ELEVENLABS_BACKUP_VOICE_ID;
      const modelId = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
      
      console.log(`🎤 [Voice] Using voice ID: ${primaryVoiceId}`);
      console.log(`🎤 [Voice] Config voice ID: ${this.config.elevenLabsVoiceId}`);
      console.log(`🎤 [Voice] Options voice ID: ${options.voiceId || 'not set'}`);

      const postTTS = async (voiceId) => axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: modelId,
          voice_settings: {
            stability: Number(process.env.ELEVENLABS_STABILITY ?? 0.5),
            similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY ?? 0.75),
            style: 0.5,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.config.elevenLabsApiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      if (!primaryVoiceId && backupVoiceId) {
        console.warn('⚠️  [Voice] No primary ElevenLabs voice configured, trying backup voice');
      }

      let usedVoiceId = primaryVoiceId;
      let response;
      try {
        if (!primaryVoiceId) throw new Error('NO_PRIMARY_VOICE');
        response = await postTTS(primaryVoiceId);
      } catch (primaryErr) {
        if (backupVoiceId) {
          console.warn('⚠️  [Voice] ElevenLabs primary voice failed, using backup voice');
          usedVoiceId = backupVoiceId;
          response = await postTTS(backupVoiceId);
        } else {
          throw primaryErr;
        }
      }
      
      // Save audio to temp file
      const audioDir = path.join(__dirname, '../../temp/audio');
      await fs.mkdir(audioDir, { recursive: true });
      
      const filename = `slunt_${Date.now()}.mp3`;
      const filepath = path.join(audioDir, filename);
      
      await fs.writeFile(filepath, response.data);
      
      console.log(`💾 [Voice] Audio saved (${usedVoiceId || 'unknown voice'}): ${filename}`);
      
      return filepath;
      
    } catch (error) {
      console.error('❌ [Voice] ElevenLabs TTS error:', error.message);
      return null;
    }
  }
  
  /**
   * OpenAI Text-to-Speech
   */
  async openaiTextToSpeech(text, options = {}) {
    if (!this.config.openaiApiKey) {
      console.error('❌ [Voice] OpenAI API key not configured');
      return null;
    }
    
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          voice: options.voice || 'onyx', // alloy, echo, fable, onyx, nova, shimmer
          input: text,
          speed: options.speed || this.config.voiceSpeed
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );
      
      // Save audio to temp file
      const audioDir = path.join(__dirname, '../../temp/audio');
      await fs.mkdir(audioDir, { recursive: true });
      
      const filename = `slunt_${Date.now()}.mp3`;
      const filepath = path.join(audioDir, filename);
      
      await fs.writeFile(filepath, response.data);
      
      console.log(`💾 [Voice] Audio saved: ${filename}`);
      
      return filepath;
      
    } catch (error) {
      console.error('❌ [Voice] OpenAI TTS error:', error.message);
      return null;
    }
  }
  
  /**
   * Google Cloud Text-to-Speech
   */
  async googleTextToSpeech(text, options = {}) {
    // Placeholder
    console.log('⚠️ [Voice] Google TTS not fully implemented yet');
    return null;
  }
  
  /**
   * Get voice stats
   */
  getStats() {
    return {
      ...this.stats,
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      uptime: process.uptime()
    };
  }
  
  /**
   * Cleanup
   */
  async cleanup() {
    await this.stopListening();
    await this.stopSpeaking();
    console.log('🧹 [Voice] Cleaned up');
  }
}

module.exports = VoiceManager;
