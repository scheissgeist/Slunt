const EventEmitter = require('events');
const logger = require('./logger');
const AIEngine = require('../ai/aiEngine');
const CoolPointsHandler = require('./coolPointsHandler');

/**
 * MINIMAL ChatBot - First Night Version
 * Just voice, platform connectivity, basic AI, and CoolPoints
 */
class ChatBot extends EventEmitter {
  constructor(coolholeClient, videoManager) {
    super();
    
    this.coolhole = coolholeClient;
    this.videoManager = videoManager;
    this.coolPointsHandler = new CoolPointsHandler();
    this.aiEngine = new AIEngine();
    
    this.lastSentAt = 0;
    this.chatStats = {
      totalMessages: 0,
      messagesSent: 0,
      activeUsers: new Set()
    };
  }

  async initialize() {
    logger.info('🤖 ChatBot initializing (MINIMAL MODE)...');
    
    try {
      // Just initialize AI engine
      await this.aiEngine.initialize();
      
      logger.info('✅ ChatBot ready (MINIMAL MODE)');
      return true;
    } catch (error) {
      logger.error('❌ ChatBot initialization failed:', error);
      return false;
    }
  }

  /**
   * Handle incoming chat message
   */
  async handleMessage(user, message, platform = 'coolhole') {
    try {
      this.chatStats.totalMessages++;
      this.chatStats.activeUsers.add(user);

      // Mentioned?
      const mentioned = message.toLowerCase().includes('slunt');
      
      if (!mentioned) {
        return; // Only respond when mentioned for now
      }

      logger.info(`💬 [${platform}] ${user}: ${message}`);

      // Generate response
      const response = await this.aiEngine.generateResponse(
        message,
        user,
        { platform, messageCount: this.chatStats.totalMessages }
      );

      if (response) {
        await this.sendMessage(response, platform);
      }
    } catch (error) {
      logger.error('Error handling message:', error);
    }
  }

  /**
   * Send message to platform
   */
  async sendMessage(text, platform = 'coolhole') {
    try {
      const now = Date.now();
      
      // Rate limit: 1 message per 2 seconds
      if (now - this.lastSentAt < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - (now - this.lastSentAt)));
      }

      if (platform === 'coolhole' && this.coolhole) {
        this.coolhole.sendMessage(text);
      } else if (platform === 'discord' && this.discord) {
        // Discord sending handled by discord client
        this.emit('discordMessage', text);
      }

      this.lastSentAt = Date.now();
      this.chatStats.messagesSent++;
      
      logger.info(`📤 [${platform}] Slunt: ${text}`);
    } catch (error) {
      logger.error('Error sending message:', error);
    }
  }

  /**
   * Handle voice interaction
   */
  async handleVoiceMessage(text, context = {}) {
    try {
      logger.info(`🎤 Voice: ${text}`);

      const response = await this.aiEngine.generateResponse(
        text,
        context.username || 'VoiceUser',
        { ...context, isVoice: true, platform: 'voice' }
      );

      return response;
    } catch (error) {
      logger.error('Error handling voice:', error);
      return "sorry, having trouble processing that";
    }
  }

  /**
   * Handle CoolPoints commands
   */
  async handleCoolPointsCommand(user, command, args) {
    try {
      return await this.coolPointsHandler.handleCommand(user, command, args);
    } catch (error) {
      logger.error('CoolPoints error:', error);
      return 'Error processing CoolPoints command';
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      messages: this.chatStats.totalMessages,
      sent: this.chatStats.messagesSent,
      activeUsers: this.chatStats.activeUsers.size
    };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    logger.info('👋 ChatBot shutting down...');
    // Cleanup if needed
  }
}

module.exports = ChatBot;
