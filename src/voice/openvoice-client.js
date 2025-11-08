/**
 * OpenVoice Client
 * Node.js client for interfacing with the OpenVoice Python API server
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class OpenVoiceClient {
    constructor(apiUrl = 'http://localhost:3002') {
        this.apiUrl = apiUrl;
    }

    /**
     * Check if the API server is running
     */
    async checkHealth() {
        try {
            const response = await axios.get(`${this.apiUrl}/health`);
            return response.data;
        } catch (error) {
            throw new Error(`OpenVoice API server is not responding: ${error.message}`);
        }
    }

    /**
     * Clone voice from reference audio
     * @param {string} referenceAudio - Path to reference audio file
     * @param {string} text - Text to synthesize
     * @param {string} language - Language code ('EN' or 'ZH')
     * @returns {Promise<Buffer>} - Audio buffer
     */
    async cloneVoice(referenceAudio, text, language = 'EN') {
        try {
            // Send file path to API (not base64)
            // The Python API expects a file path on the same machine
            const response = await axios.post(`${this.apiUrl}/clone_voice`, {
                reference_voice: referenceAudio,
                text: text,
                language: language
            }, {
                timeout: 30000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            if (!response.data.success) {
                throw new Error(response.data.error || 'Voice cloning failed');
            }

            // Convert base64 response back to buffer
            return Buffer.from(response.data.audio, 'base64');

        } catch (error) {
            if (error.response) {
                throw new Error(`API Error: ${error.response.data.error || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Simple text-to-speech without voice cloning
     * @param {string} text - Text to synthesize
     * @param {string} language - Language code ('EN' or 'ZH')
     * @returns {Promise<Buffer>} - Audio buffer
     */
    async textToSpeech(text, language = 'EN') {
        try {
            const response = await axios.post(`${this.apiUrl}/tts`, {
                text: text,
                language: language
            }, {
                timeout: 30000
            });

            if (!response.data.success) {
                throw new Error(response.data.error || 'TTS failed');
            }

            return Buffer.from(response.data.audio, 'base64');

        } catch (error) {
            if (error.response) {
                throw new Error(`API Error: ${error.response.data.error || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Save audio buffer to file
     * @param {Buffer} audioBuffer - Audio data
     * @param {string} outputPath - Output file path
     */
    async saveAudio(audioBuffer, outputPath) {
        await fs.writeFile(outputPath, audioBuffer);
    }
}

module.exports = OpenVoiceClient;
