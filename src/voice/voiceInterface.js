// voiceInterface.js
const Mic = require('mic');
const Speaker = require('speaker');
const { Deepgram } = require('@deepgram/sdk');
const WebSocket = require('ws');
const EventEmitter = require('events');

// Deepgram API Key (prefer environment variable)
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '28824bc95bc56863d4aa048a1efda4d7af464076';

class VoiceInterface extends EventEmitter {
  constructor({ ttsProvider }) {
    super();
    this.micInstance = null;
    this.deepgram = new Deepgram(DEEPGRAM_API_KEY);
    this.ttsProvider = ttsProvider; // Function: (text) => Promise<audioBuffer>
    this.speaker = null;
    this.isSpeaking = false;
    this.isListening = false;
    this.interrupted = false;
  }

  startListening() {
    this.micInstance = Mic({
      rate: '48000',        // High quality - matches most streaming setups
      channels: '1',
      debug: false,
      exitOnSilence: 6,
      device: 'default'     // Use default device without taking exclusive control
    });

    const micInputStream = this.micInstance.getAudioStream();
    this.isListening = true;
    this.emit('onUserSpeechStart');

    // Deepgram streaming STT
    const deepgramSocket = this.deepgram.transcription.live({
      punctuate: true,
      interim_results: true,
      model: 'nova'
    });

    micInputStream.on('data', data => {
      if (deepgramSocket.readyState === WebSocket.OPEN) {
        deepgramSocket.send(data);
      }
    });

    deepgramSocket.on('transcriptReceived', (transcript) => {
      try {
        const alt = transcript?.channel?.alternatives?.[0];
        const text = alt?.transcript || '';
        const confidence = typeof alt?.confidence === 'number' ? alt.confidence : 0;
        const isFinal = transcript?.is_final === true || transcript?.speech_final === true;

        // Only act on final or high-confidence transcripts
        if (text && (isFinal || confidence >= 0.65)) {
          const cleaned = String(text).trim();
          if (cleaned.length >= 2) {
            this.emit('onUserSpeechEnd', cleaned);
            this.stopListening();
          }
        }
      } catch (e) {
        // Ignore malformed interim packets
      }
    });

    deepgramSocket.on('error', err => {
      this.emit('error', err);
      this.stopListening();
    });

    this.micInstance.start();
  }

  stopListening() {
    if (this.micInstance) {
      this.micInstance.stop();
      this.micInstance = null;
    }
    this.isListening = false;
  }

  async speak(text) {
    this.isSpeaking = true;
    this.emit('onBotSpeakStart', text);

    // Get TTS audio buffer from provider
    const audioBuffer = await this.ttsProvider(text);

    this.speaker = new Speaker({
      channels: 1,
      bitDepth: 16,
      sampleRate: 48000     // High quality output to match input
    });

    this.speaker.on('close', () => {
      this.isSpeaking = false;
      this.emit('onBotSpeakEnd');
      if (this.interrupted) {
        this.emit('onInterrupt');
        this.interrupted = false;
      }
    });

    this.speaker.write(audioBuffer);
    this.speaker.end();
  }

  interrupt() {
    if (this.isSpeaking && this.speaker) {
      this.interrupted = true;
      this.speaker.end();
    }
  }
}

module.exports = VoiceInterface;
