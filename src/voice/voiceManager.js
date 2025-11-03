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

class VoiceManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Speech-to-Text options
      sttProvider: config.sttProvider || 'google', // 'google', 'whisper', 'browser'
      googleApiKey: config.googleApiKey || process.env.GOOGLE_CLOUD_API_KEY,
      
      // Text-to-Speech options
      ttsProvider: config.ttsProvider || 'elevenlabs', // 'elevenlabs', 'openai', 'google'
      elevenLabsApiKey: config.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY,
      elevenLabsVoiceId: config.elevenLabsVoiceId || process.env.ELEVENLABS_VOICE_ID || 'ErXwobaYiN019PkySvjV', // Antoni voice
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
      
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
      const startTime = Date.now();
      console.log(`🗣️ [Voice] Speaking: "${text.substring(0, 100)}..."`);
      
      // If already speaking and interrupts enabled, stop current speech
      if (this.isSpeaking && this.config.interruptEnabled) {
        await this.stopSpeaking();
      }
      
      this.isSpeaking = true;
      this.emit('speaking:started', { text });
      
      // Choose TTS provider
      let audioUrl = null;
      switch (this.config.ttsProvider) {
        case 'elevenlabs':
          audioUrl = await this.elevenLabsTextToSpeech(text, options);
          break;
        case 'openai':
          audioUrl = await this.openaiTextToSpeech(text, options);
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
            sampleRateHertz: 16000,
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
   * ElevenLabs Text-to-Speech
   */
  async elevenLabsTextToSpeech(text, options = {}) {
    if (!this.config.elevenLabsApiKey) {
      console.error('❌ [Voice] ElevenLabs API key not configured');
      return null;
    }
    
    try {
      const voiceId = options.voiceId || this.config.elevenLabsVoiceId;
      
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
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
