/**
 * Resemble AI Text-to-Speech Integration
 * Direct REST API - no build tools required!
 * Works with Python 3.13+, voice cloning capabilities
 */

const axios = require('axios');

/**
 * Generate speech from text using Resemble AI REST API
 * @param {string} text - Text to synthesize
 * @param {Object} options - Voice options
 * @returns {Promise<Buffer>} Audio buffer
 */
async function resembleAI(text, options = {}) {
    try {
        const apiKey = process.env.RESEMBLE_API_KEY;
        const voiceId = options.voiceId || process.env.RESEMBLE_VOICE_ID;

        if (!apiKey) {
            throw new Error('RESEMBLE_API_KEY not set in .env');
        }

        if (!voiceId) {
            throw new Error('RESEMBLE_VOICE_ID not set - create a voice at resemble.ai');
        }

        console.log(`[Resemble AI] Generating speech (${text.length} chars, voice: ${voiceId})`);

        // Step 1: Create sync clip
        const createResponse = await axios.post(
            `https://app.resemble.ai/api/v2/projects/${process.env.RESEMBLE_PROJECT_ID}/clips`,
            {
                data: {
                    body: text,
                    voice_uuid: voiceId,
                    is_public: false,
                    sample_rate: 22050,
                    output_format: 'mp3'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!createResponse.data || !createResponse.data.item) {
            throw new Error('Invalid response from Resemble AI');
        }

        const audioUrl = createResponse.data.item.audio_src;
        console.log(`[Resemble AI] Audio URL: ${audioUrl}`);

        // Step 2: Download the audio
        const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer'
        });

        console.log(`✅ [Resemble AI] Generated ${audioResponse.data.length} bytes`);
        return Buffer.from(audioResponse.data);

    } catch (error) {
        console.error('[Resemble AI] Error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * List available voices in the account
 * @returns {Promise<Array>} List of voices
 */
async function listResembleVoices() {
    try {
        const apiKey = process.env.RESEMBLE_API_KEY;
        const projectId = process.env.RESEMBLE_PROJECT_ID;

        const response = await axios.get(
            `https://app.resemble.ai/api/v2/projects/${projectId}/voices`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        return response.data.items || [];
    } catch (error) {
        console.error('[Resemble AI] Error listing voices:', error.message);
        return [];
    }
}

/**
 * Check if Resemble AI is available
 * @returns {Promise<boolean>}
 */
async function isResembleAvailable() {
    try {
        const apiKey = process.env.RESEMBLE_API_KEY;
        const projectId = process.env.RESEMBLE_PROJECT_ID;

        if (!apiKey || !projectId) return false;

        await axios.get(
            `https://app.resemble.ai/api/v2/projects/${projectId}/voices`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 5000
            }
        );

        return true;
    } catch (error) {
        return false;
    }
}

module.exports = resembleAI;
module.exports.listVoices = listResembleVoices;
module.exports.isAvailable = isResembleAvailable;
