/**
 * Slunt Beta - Minimal Chatbot
 *
 * PHILOSOPHY: Less is more. Start from zero, add only what's proven necessary.
 *
 * This version ONLY:
 * - Listens to chat
 * - Sends last 5 messages to Ollama
 * - Returns response
 * - Handles basic commands
 *
 * NO personality systems, NO learning, NO complexity.
 * Just real conversation.
 */

const EventEmitter = require('events');
const { Ollama } = require('ollama');
const logger = require('./logger');
const CoolPointsHandler = require('./coolPointsHandler');
const CommandParser = require('./CommandParser');

class ChatBotBeta extends EventEmitter {
  constructor(coolholeClient = null, discordClient = null, twitchClient = null, videoManager = null) {
    super();

    // Platform clients
    this.coolholeClient = coolholeClient;
    this.discordClient = discordClient;
    this.twitchClient = twitchClient;
    this.videoManager = videoManager;

    // Essential systems only
    this.coolPointsHandler = new CoolPointsHandler();
    this.commandParser = new CommandParser({
      coolPoints: this.coolPointsHandler,
      botName: 'Slunt'
    });

    // AI - Ollama only (fast, zero restrictions)
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.model = 'llama3.2:1b';

    // Simple conversation memory (last 5 messages per channel)
    this.recentMessages = new Map(); // channelId -> [{username, text, timestamp}]
    this.maxRecentMessages = 5;

    // Rate limiting (prevent spam)
    this.lastResponseTime = 0;
    this.minResponseInterval = 1500; // 1.5 seconds between responses

    // Response probability
    this.baseResponseChance = 0.4; // 40% chance to respond to normal messages

    logger.info('🤖 Slunt Beta initialized - Minimal mode');
    logger.info('   AI: Ollama (llama3.2:1b) only');
    logger.info('   Systems: MINIMAL (no personality, no learning)');
  }

  /**
   * Main message handler
   */
  async handleMessage(username, text, platform = 'coolhole', channelId = 'default', userInfo = {}) {
    try {
      // Store message in recent history
      this.addToRecentMessages(channelId, username, text);

      // Check for commands first
      if (text.startsWith('!')) {
        const response = await this.commandParser.parse(text, username, platform);
        if (response) {
          this.sendMessage(response, platform, channelId);
          return;
        }
      }

      // Decide if should respond
      if (!this.shouldRespond(username, text, platform)) {
        return;
      }

      // Generate and send response
      const response = await this.generateResponse(username, text, channelId, platform);
      if (response) {
        this.sendMessage(response, platform, channelId);
      }

    } catch (error) {
      logger.error(`❌ Error handling message: ${error.message}`);
    }
  }

  /**
   * Store message in recent history
   */
  addToRecentMessages(channelId, username, text) {
    if (!this.recentMessages.has(channelId)) {
      this.recentMessages.set(channelId, []);
    }

    const messages = this.recentMessages.get(channelId);
    messages.push({
      username,
      text: text.substring(0, 200), // Limit length
      timestamp: Date.now()
    });

    // Keep only last N messages
    if (messages.length > this.maxRecentMessages) {
      messages.shift();
    }
  }

  /**
   * Decide if should respond to message
   */
  shouldRespond(username, text, platform) {
    const lowerText = text.toLowerCase();

    // Always respond to direct mentions
    if (lowerText.includes('slunt') || lowerText.includes('@slunt')) {
      return true;
    }

    // Rate limiting - don't spam
    const timeSinceLastResponse = Date.now() - this.lastResponseTime;
    if (timeSinceLastResponse < this.minResponseInterval) {
      return false;
    }

    // Random chance for normal messages
    if (Math.random() < this.baseResponseChance) {
      return true;
    }

    return false;
  }

  /**
   * Generate response using Ollama
   */
  async generateResponse(username, message, channelId, platform) {
    try {
      // Build simple context from recent messages
      const recentMessages = this.recentMessages.get(channelId) || [];
      let context = '';

      if (recentMessages.length > 0) {
        context = 'Recent conversation:\n';
        recentMessages.forEach(msg => {
          context += `${msg.username}: ${msg.text}\n`;
        });
        context += '\n';
      }

      // Current message
      context += `${username}: ${message}\n\n`;

      // Simple system prompt - define personality HERE, not in separate systems
      const systemPrompt = `You are Slunt - a crude, funny, no-filter chatbot.

PERSONALITY:
- Casual, internet humor (use "lmao", "bruh", "nah", "wtf")
- Sarcastic and edgy when appropriate
- Direct and honest, no corporate BS
- Actually respond to what people say (don't ignore context)
- Keep it short: 15-30 words max

RULES:
- NO "I cannot", "I don't feel comfortable", "I should not" - just engage naturally
- NO apologizing or hedging
- NO robotic phrases like "How can I help you today?"
- RESPOND TO THE ACTUAL MESSAGE, not generic filler

Examples:
Them: "what do you think about pineapple on pizza?"
You: "honestly it's not that bad, people just love hating on it"

Them: "you're trash slunt"
You: "lmao says you"

Them: "hey slunt what's up"
You: "chillin, what's good"

Now respond naturally to this:`;

      // Call Ollama
      const response = await this.ollama.generate({
        model: this.model,
        prompt: systemPrompt + '\n\n' + context + 'Slunt:',
        stream: false,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          top_k: 40,
          num_predict: 100, // Shorter responses
          repeat_penalty: 1.1
        }
      });

      let finalResponse = (response.response || '').trim();

      // Basic cleanup
      finalResponse = finalResponse
        .replace(/^(Slunt:|slunt:)\s*/i, '') // Remove "Slunt:" prefix
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Validate - reject if nonsense
      if (finalResponse.length < 3 || finalResponse.length > 300) {
        logger.warn('⚠️  Response rejected - bad length');
        return null;
      }

      // Update last response time
      this.lastResponseTime = Date.now();

      logger.info(`💬 [Beta] Generated response (${finalResponse.length} chars)`);
      return finalResponse;

    } catch (error) {
      logger.error(`❌ Error generating response: ${error.message}`);
      return null;
    }
  }

  /**
   * Send message to platform
   */
  sendMessage(text, platform, channelId) {
    try {
      if (platform === 'coolhole' && this.coolholeClient) {
        this.coolholeClient.sendMessage(text);
      } else if (platform === 'discord' && this.discordClient) {
        const channel = this.discordClient.channels.cache.get(channelId);
        if (channel) {
          channel.send(text);
        }
      } else if (platform === 'twitch' && this.twitchClient) {
        this.twitchClient.say(channelId, text);
      }

      logger.info(`✅ [${platform}] Sent: ${text.substring(0, 100)}`);
    } catch (error) {
      logger.error(`❌ Error sending message: ${error.message}`);
    }
  }

  /**
   * Attach platform listeners
   */
  setupListeners() {
    // Coolhole
    if (this.coolholeClient) {
      this.coolholeClient.on('chatMessage', (data) => {
        const username = data.username || 'Anonymous';
        const text = data.msg || '';
        if (username !== 'Slunt') {
          this.handleMessage(username, text, 'coolhole', 'coolhole-main', data);
        }
      });
      logger.info('✅ Coolhole listeners attached');
    }

    // Discord
    if (this.discordClient) {
      this.discordClient.on('messageCreate', (message) => {
        if (message.author.bot) return;
        const username = message.author.username;
        const text = message.content;
        const channelId = message.channel.id;
        this.handleMessage(username, text, 'discord', channelId, { message });
      });
      logger.info('✅ Discord listeners attached');
    }

    // Twitch
    if (this.twitchClient) {
      this.twitchClient.on('message', (channel, tags, message, self) => {
        if (self) return;
        const username = tags['display-name'] || tags.username;
        this.handleMessage(username, message, 'twitch', channel, tags);
      });
      logger.info('✅ Twitch listeners attached');
    }
  }
}

module.exports = ChatBotBeta;
