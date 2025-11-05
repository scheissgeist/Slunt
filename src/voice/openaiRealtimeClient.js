/**
 * OpenAI Realtime API Client
 * 
 * This is ChatGPT Voice Mode quality:
 * - Streaming audio (instant playback)
 * - Natural interrupts (cut off mid-sentence)
 * - Ultra low latency (~300ms)
 * - Same voices as ChatGPT app
 * 
 * Much better than the basic OpenAI TTS we had!
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class OpenAIRealtimeClient extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      model: config.model || 'gpt-4o-realtime-preview',
      voice: config.voice || 'alloy', // alloy, echo, shimmer, verse, ash, cove
      instructions: config.instructions || '', // System prompt for voice mode
      temperature: config.temperature || 0.8,
      maxTokens: config.maxTokens || 4096,
    };
    
    this.ws = null;
    this.connected = false;
    this.sessionId = null;
    this.conversationHistory = [];
    
    // Audio playback state
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentPlayback = null;
  }
  
  /**
   * Connect to OpenAI Realtime API
   */
  async connect() {
    if (this.connected) {
      console.log('⚠️  [Realtime] Already connected');
      return;
    }
    
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key required for Realtime API');
    }
    
    const url = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;
    
    console.log('🔌 [Realtime] Connecting to OpenAI...');
    
    this.ws = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });
    
    this.ws.on('open', () => {
      console.log('✅ [Realtime] Connected to OpenAI');
      this.connected = true;
      this.emit('connected');
      
      // Send session configuration
      this.send({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: this.config.instructions,
          voice: this.config.voice,
          temperature: this.config.temperature,
          max_response_output_tokens: this.config.maxTokens,
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          }
        }
      });
    });
    
    this.ws.on('message', (data) => {
      this.handleMessage(JSON.parse(data.toString()));
    });
    
    this.ws.on('close', () => {
      console.log('🔌 [Realtime] Disconnected from OpenAI');
      this.connected = false;
      this.emit('disconnected');
    });
    
    this.ws.on('error', (error) => {
      console.error('❌ [Realtime] Error:', error.message);
      this.emit('error', error);
    });
  }
  
  /**
   * Send message to OpenAI
   */
  send(event) {
    if (!this.connected || !this.ws) {
      console.warn('⚠️  [Realtime] Not connected, cannot send');
      return;
    }
    
    this.ws.send(JSON.stringify(event));
  }
  
  /**
   * Handle incoming message from OpenAI
   */
  handleMessage(message) {
    const { type } = message;
    
    switch (type) {
      case 'session.created':
        this.sessionId = message.session.id;
        console.log('✅ [Realtime] Session created:', this.sessionId);
        this.emit('session.created', message.session);
        break;
        
      case 'session.updated':
        console.log('✅ [Realtime] Session updated');
        this.emit('session.updated', message.session);
        break;
        
      case 'conversation.item.created':
        this.conversationHistory.push(message.item);
        this.emit('message', message.item);
        break;
        
      case 'response.audio.delta':
        // Streaming audio chunk
        this.handleAudioChunk(message.delta);
        break;
        
      case 'response.audio.done':
        console.log('✅ [Realtime] Audio response complete');
        this.emit('audio.done');
        break;
        
      case 'response.text.delta':
        // Streaming text chunk
        this.emit('text.delta', message.delta);
        break;
        
      case 'response.text.done':
        console.log('✅ [Realtime] Text response complete:', message.text);
        this.emit('text.done', message.text);
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log('🎤 [Realtime] User started speaking');
        this.emit('speech.started');
        // Cancel current playback if user interrupts
        this.stopPlayback();
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log('🎤 [Realtime] User stopped speaking');
        this.emit('speech.stopped');
        break;
        
      case 'response.done':
        console.log('✅ [Realtime] Response complete');
        this.emit('response.done', message.response);
        break;
        
      case 'error':
        console.error('❌ [Realtime] Error:', message.error);
        this.emit('error', new Error(message.error.message));
        break;
        
      default:
        // console.log('📨 [Realtime] Unknown message type:', type);
        break;
    }
  }
  
  /**
   * Send audio input (user speaking)
   * @param {Buffer} audioBuffer - PCM16 audio at 24kHz
   */
  sendAudio(audioBuffer) {
    if (!this.connected) return;
    
    // Convert to base64
    const base64Audio = audioBuffer.toString('base64');
    
    this.send({
      type: 'input_audio_buffer.append',
      audio: base64Audio
    });
  }
  
  /**
   * Send text message (instead of voice)
   */
  sendText(text) {
    if (!this.connected) return;
    
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: text
        }]
      }
    });
    
    // Trigger response
    this.send({
      type: 'response.create'
    });
  }
  
  /**
   * Commit audio buffer (user finished speaking)
   */
  commitAudio() {
    if (!this.connected) return;
    
    this.send({
      type: 'input_audio_buffer.commit'
    });
    
    // Trigger response
    this.send({
      type: 'response.create',
      response: {
        modalities: ['audio', 'text']
      }
    });
  }
  
  /**
   * Handle streaming audio chunk from OpenAI
   */
  handleAudioChunk(base64Audio) {
    try {
      // Decode base64 to PCM16 buffer
      const audioBuffer = Buffer.from(base64Audio, 'base64');
      
      // Add to queue
      this.audioQueue.push(audioBuffer);
      
      // Start playback if not already playing
      if (!this.isPlaying) {
        this.playNextChunk();
      }
      
      // Emit for live playback
      this.emit('audio.chunk', audioBuffer);
    } catch (error) {
      console.error('❌ [Realtime] Error handling audio chunk:', error.message);
    }
  }
  
  /**
   * Play next audio chunk in queue
   */
  async playNextChunk() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }
    
    this.isPlaying = true;
    const chunk = this.audioQueue.shift();
    
    // Play audio chunk (using sox/ffplay/etc)
    // This is a simple implementation - you'd use a proper audio library
    try {
      // Convert PCM16 to WAV and play
      // (implementation depends on your audio playback method)
      this.emit('audio.playing', chunk);
      
      // Schedule next chunk
      setTimeout(() => this.playNextChunk(), 50); // ~50ms chunks
    } catch (error) {
      console.error('❌ [Realtime] Playback error:', error.message);
      this.isPlaying = false;
    }
  }
  
  /**
   * Stop current audio playback (for interrupts)
   */
  stopPlayback() {
    console.log('⏹️  [Realtime] Stopping playback');
    this.audioQueue = [];
    this.isPlaying = false;
    
    if (this.currentPlayback) {
      this.currentPlayback.kill();
      this.currentPlayback = null;
    }
    
    // Cancel in-progress response
    this.send({
      type: 'response.cancel'
    });
    
    this.emit('playback.stopped');
  }
  
  /**
   * Update session configuration
   */
  updateSession(updates) {
    if (!this.connected) return;
    
    this.send({
      type: 'session.update',
      session: updates
    });
  }
  
  /**
   * Disconnect from OpenAI
   */
  disconnect() {
    if (!this.connected) return;
    
    console.log('🔌 [Realtime] Disconnecting...');
    this.stopPlayback();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connected = false;
    this.sessionId = null;
  }
  
  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }
  
  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    
    if (this.connected) {
      // Truncate conversation on server
      this.send({
        type: 'conversation.item.truncate',
        item_id: null, // Truncate all
        content_index: 0
      });
    }
  }
}

module.exports = OpenAIRealtimeClient;
