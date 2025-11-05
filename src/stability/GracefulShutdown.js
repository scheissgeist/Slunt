/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown with data preservation
 */

const logger = require('../bot/logger');

class GracefulShutdown {
  constructor() {
    this.chatBot = null;
    this.server = null;
    this.isShuttingDown = false;
    this.shutdownTimeout = 30000; // 30 seconds max
    this.handlers = [];
  }

  /**
   * Initialize shutdown handlers
   */
  initialize(chatBot, server) {
    this.chatBot = chatBot;
    this.server = server;

    // Handle SIGTERM (Docker/systemd)
    process.on('SIGTERM', () => {
      logger.info('🛑 [Shutdown] SIGTERM received');
      this.shutdown('SIGTERM');
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('🛑 [Shutdown] SIGINT received');
      this.shutdown('SIGINT');
    });

    // Handle uncaught exceptions (already exists but integrate)
    process.on('uncaughtException', (error) => {
      logger.error(`💥 [Shutdown] UNCAUGHT EXCEPTION: ${error.message}`, error);
      this.emergencyShutdown(error);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`💥 [Shutdown] UNHANDLED REJECTION: ${reason}`, reason);
      this.emergencyShutdown(reason);
    });

    logger.info('✅ [Shutdown] Graceful shutdown handlers initialized');
  }

  /**
   * Register a cleanup handler
   */
  registerHandler(name, handler) {
    this.handlers.push({ name, handler });
    logger.info(`📝 [Shutdown] Registered cleanup handler: ${name}`);
  }

  /**
   * Perform graceful shutdown
   */
  async shutdown(signal) {
    if (this.isShuttingDown) {
      logger.warn('⚠️ [Shutdown] Already shutting down...');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`🛑 [Shutdown] Starting graceful shutdown (${signal})...`);

    // Set timeout to force exit if shutdown takes too long
    const forceExitTimer = setTimeout(() => {
      logger.error('⚠️ [Shutdown] Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // 1. Stop accepting new requests
      logger.info('🚫 [Shutdown] Stopping new connections...');
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(() => {
            logger.info('✅ [Shutdown] Server closed');
            resolve();
          });
        });
      }

      // 2. Flush pending responses
      logger.info('💬 [Shutdown] Flushing pending messages...');
      if (this.chatBot && this.chatBot.responseQueue && this.chatBot.responseQueue.length > 0) {
        logger.info(`📤 [Shutdown] ${this.chatBot.responseQueue.length} messages in queue`);
        await this.flushMessageQueue();
      }
      
      // === 💀 MORTALITY AWARENESS: Last words before death ===
      if (this.chatBot && this.chatBot.mortality) {
        try {
          const lastWords = this.chatBot.mortality.prepareForDeath();
          if (lastWords && this.chatBot.sendMessage) {
            logger.info(`💀 [Mortality] Sending last words: ${lastWords}`);
            await this.chatBot.sendMessage(lastWords, { isLastWords: true }, this.chatBot.currentPlatform, this.chatBot.currentChannel);
            // Wait 2 seconds for message to send
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          logger.error(`❌ [Mortality] Failed to send last words: ${error.message}`);
        }
      }

      // 3. Save all in-memory state
      logger.info('💾 [Shutdown] Saving in-memory state...');
      await this.saveAllState();

      // 4. Close platform connections
      logger.info('🔌 [Shutdown] Closing platform connections...');
      await this.closePlatformConnections();

      // 5. Run custom cleanup handlers
      logger.info('🧹 [Shutdown] Running cleanup handlers...');
      for (const { name, handler } of this.handlers) {
        try {
          logger.info(`🧹 [Shutdown] Running: ${name}`);
          await handler();
        } catch (error) {
          logger.error(`❌ [Shutdown] Handler "${name}" failed: ${error.message}`);
        }
      }

      // 6. Final log
      logger.info('✅ [Shutdown] Graceful shutdown complete');
      
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (error) {
      logger.error(`❌ [Shutdown] Error during graceful shutdown: ${error.message}`, error);
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  }

  /**
   * Emergency shutdown (on crash)
   */
  async emergencyShutdown(error) {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    logger.error('🚨 [Shutdown] EMERGENCY SHUTDOWN INITIATED');

    try {
      // Quick save critical data only
      await this.saveAllState();
      logger.info('💾 [Shutdown] Emergency save complete');
    } catch (saveError) {
      logger.error(`❌ [Shutdown] Emergency save failed: ${saveError.message}`);
    }

    process.exit(1);
  }

  /**
   * Flush pending message queue
   */
  async flushMessageQueue() {
    if (!this.chatBot || !this.chatBot.responseQueue) return;

    const maxWait = 10000; // 10 seconds max
    const startTime = Date.now();

    while (this.chatBot.responseQueue.length > 0 && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (this.chatBot.responseQueue.length > 0) {
      logger.warn(`⚠️ [Shutdown] ${this.chatBot.responseQueue.length} messages lost (timeout)`);
    } else {
      logger.info('✅ [Shutdown] All messages flushed');
    }
  }

  /**
   * Save all in-memory state
   */
  async saveAllState() {
    if (!this.chatBot) return;

    let savedCount = 0;

    // Save all systems that have save methods
    const systemsToSave = [
      'relationshipMapper',
      'userReputation',
      'sluntDiary',
      'memoryConsolidation',
      'moodTracker',
      'grudgeSystem',
      'nicknameManager',
      'obsessionSystem',
      'rumorMill',
      'insideJokeEvolution',
      'callbackHumor',
      'contextualCallbacks',
      'autismFixations',
      'hipsterProtocol',
      // 🌟💀🎭 Revolutionary systems
      'internalState',
      'consciousness',
      'mortality',
      'parasocialReversal'
    ];

    // Save each system individually with proper error handling
    for (const system of systemsToSave) {
      try {
        if (this.chatBot[system] && typeof this.chatBot[system].save === 'function') {
          await this.chatBot[system].save();
          savedCount++;
        }
      } catch (err) {
        logger.error(`❌ [Shutdown] Failed to save ${system}: ${err.message}`);
      }
    }

    logger.info(`✅ [Shutdown] Saved ${savedCount} systems`);
  }

  /**
   * Close platform connections
   */
  async closePlatformConnections() {
    if (!this.chatBot) return;

    const closePromises = [];

    // Stop timers and intervals
    logger.info('⏱️ [Shutdown] Stopping timers and intervals...');
    
    // Stop PersonalityScheduler
    if (this.chatBot.personalityScheduler && typeof this.chatBot.personalityScheduler.stop === 'function') {
      try {
        this.chatBot.personalityScheduler.stop();
        logger.info('✅ [Shutdown] PersonalityScheduler stopped');
      } catch (err) {
        logger.error(`❌ [Shutdown] PersonalityScheduler stop failed: ${err.message}`);
      }
    }
    
    // Stop StreamStatusMonitor
    if (global.streamMonitor && typeof global.streamMonitor.stop === 'function') {
      try {
        global.streamMonitor.stop();
        logger.info('✅ [Shutdown] StreamStatusMonitor stopped');
      } catch (err) {
        logger.error(`❌ [Shutdown] StreamStatusMonitor stop failed: ${err.message}`);
      }
    }
    
    // Stop SentimentAnalyzer if it has a stop method
    if (this.chatBot.sentimentAnalyzer && typeof this.chatBot.sentimentAnalyzer.stop === 'function') {
      try {
        this.chatBot.sentimentAnalyzer.stop();
        logger.info('✅ [Shutdown] SentimentAnalyzer stopped');
      } catch (err) {
        logger.error(`❌ [Shutdown] SentimentAnalyzer stop failed: ${err.message}`);
      }
    }

    // Discord
    if (this.chatBot.discordClient && this.chatBot.discordClient.client) {
      closePromises.push(
        this.chatBot.discordClient.client.destroy()
          .then(() => logger.info('✅ [Shutdown] Discord disconnected'))
          .catch(err => logger.error(`❌ [Shutdown] Discord disconnect failed: ${err.message}`))
      );
    }

    // Twitch
    if (this.chatBot.twitchClient && this.chatBot.twitchClient.client) {
      closePromises.push(
        this.chatBot.twitchClient.disconnect()
          .then(() => logger.info('✅ [Shutdown] Twitch disconnected'))
          .catch(err => logger.error(`❌ [Shutdown] Twitch disconnect failed: ${err.message}`))
      );
    }

    // Coolhole
    if (this.chatBot.coolholeClient) {
      closePromises.push(
        this.chatBot.coolholeClient.disconnect()
          .then(() => logger.info('✅ [Shutdown] Coolhole disconnected'))
          .catch(err => logger.error(`❌ [Shutdown] Coolhole disconnect failed: ${err.message}`))
      );
    }

    await Promise.all(closePromises);
  }
}

module.exports = new GracefulShutdown();
