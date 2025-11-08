/**
 * Resemble.AI Client
 * Cloud-based voice cloning with Hoff voice model
 */

const axios = require('axios');

class ResembleClient {
    constructor(apiKey, projectUuid) {
        this.apiKey = apiKey;
        this.projectUuid = projectUuid;
        this.baseUrl = 'https://app.resemble.ai/api/v2';
    }

    /**
     * Generate speech with Resemble.AI Hoff voice
     * @param {string} text - Text to synthesize
     * @param {Object} options - Generation options
     * @returns {Promise<Buffer>} - Audio buffer
     */
    async textToSpeech(text, options = {}) {
        try {
            const {
                voice_uuid = this.projectUuid,
                sample_rate = 44100,
                precision = 'PCM_16',
                output_format = 'wav',
                raw = false
            } = options;

            console.log(`🎙️ [Resemble] Generating speech with Hoff voice (${voice_uuid.substring(0, 8)}...)`);

            // Create speech synthesis request
            const response = await axios.post(
                `${this.baseUrl}/projects/${this.projectUuid}/clips`,
                {
                    data: {
                        body: text,
                        voice_uuid: voice_uuid,
                        is_public: false,
                        sample_rate: sample_rate,
                        output_format: output_format,
                        precision: precision,
                        include_timestamps: false,
                        raw: raw
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (!response.data || !response.data.item) {
                throw new Error('Invalid response from Resemble.AI');
            }

            const clipItem = response.data.item;
            const clipUuid = clipItem.uuid;

            console.log(`   Clip created: ${clipUuid}`);
            console.log(`   Waiting for audio generation...`);

            // Poll for completion
            const audioUrl = await this.waitForClip(clipUuid);

            // Download the audio
            console.log(`   Downloading audio from: ${audioUrl}`);
            const audioResponse = await axios.get(audioUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            console.log(`✅ [Resemble] Generated ${audioResponse.data.length} bytes of audio`);

            return Buffer.from(audioResponse.data);

        } catch (error) {
            if (error.response) {
                const errMsg = error.response.data?.error || error.response.data?.message || error.message;
                throw new Error(`Resemble.AI API Error: ${errMsg}`);
            }
            throw error;
        }
    }

    /**
     * Wait for clip to be ready and return audio URL
     * @param {string} clipUuid - Clip UUID
     * @returns {Promise<string>} - Audio URL
     */
    async waitForClip(clipUuid, maxAttempts = 30) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await axios.get(
                    `${this.baseUrl}/projects/${this.projectUuid}/clips/${clipUuid}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`
                        }
                    }
                );

                const clip = response.data.item;

                if (clip.audio_src) {
                    return clip.audio_src;
                }

                // Wait 1 second before next poll
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (attempt % 5 === 0 && attempt > 0) {
                    console.log(`   Still waiting for clip... (${attempt}s)`);
                }

            } catch (error) {
                console.error(`   Error polling clip status: ${error.message}`);
                throw error;
            }
        }

        throw new Error(`Clip generation timeout after ${maxAttempts} seconds`);
    }

    /**
     * List available voices in the project
     * @returns {Promise<Array>} - List of voices
     */
    async listVoices() {
        try {
            const response = await axios.get(
                `${this.baseUrl}/projects/${this.projectUuid}/voices`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            return response.data.items || [];
        } catch (error) {
            throw new Error(`Failed to list voices: ${error.message}`);
        }
    }

    /**
     * Check API health
     * @returns {Promise<Object>} - Health status
     */
    async checkHealth() {
        try {
            const voices = await this.listVoices();
            return {
                status: 'ok',
                voices: voices.length,
                project_uuid: this.projectUuid
            };
        } catch (error) {
            throw new Error(`Resemble.AI health check failed: ${error.message}`);
        }
    }
}

module.exports = ResembleClient;
