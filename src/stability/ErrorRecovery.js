/**
 * Error Recovery & Self-Healing System
 * Automatically handles and recovers from errors
 */

const logger = require('../bot/logger');

class ErrorRecovery {
  constructor() {
    // Error tracking
    this.errors = [];
    this.errorPatterns = new Map();
    this.maxErrorHistory = 1000;

    // Quarantine system
    this.quarantinedFeatures = new Map();
    this.quarantineThreshold = 3; // Errors before quarantine
    this.quarantineDuration = 300000; // 5 minutes

    // Dead letter queue
    this.deadLetterQueue = [];
    this.maxDeadLetters = 100;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds

    // Critical error detection
    this.criticalThreshold = 10; // Critical errors in window
    this.criticalWindow = 60000; // 1 minute
    this.restartOnCritical = false; // Set to true to enable auto-restart

    // Self-healing stats
    this.stats = {
      errorsHandled: 0,
      featuresQuarantined: 0,
      successfulRetries: 0,
      failedRetries: 0,
      autoRestarts: 0
    };

    this.chatBot = null;
  }

  /**
   * Initialize with chatBot reference
   */
  initialize(chatBot) {
    this.chatBot = chatBot;
    logger.info('🏥 [Recovery] Error recovery system initialized');
  }

  /**
   * Handle an error
   */
  async handleError(error, context = {}) {
    this.stats.errorsHandled++;

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      severity: this.classifyError(error)
    };

    // Add to history
    this.errors.push(errorInfo);
    if (this.errors.length > this.maxErrorHistory) {
      this.errors.shift();
    }

    // Track error patterns
    this.trackErrorPattern(errorInfo);

    // Log based on severity
    if (errorInfo.severity === 'critical') {
      logger.error(`🚨 [Recovery] CRITICAL ERROR: ${error.message}`, error);
    } else if (errorInfo.severity === 'high') {
      logger.error(`❌ [Recovery] HIGH SEVERITY: ${error.message}`);
    } else {
      logger.warn(`⚠️ [Recovery] Error: ${error.message}`);
    }

    // Check if feature should be quarantined
    if (context.feature) {
      await this.checkQuarantine(context.feature, errorInfo);
    }

    // Check if critical threshold reached
    if (this.isCriticalSituation()) {
      await this.handleCriticalSituation();
    }

    return errorInfo;
  }

  /**
   * Classify error severity
   */
  classifyError(error) {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Critical errors
    if (
      message.includes('enospc') || // Disk full
      message.includes('out of memory') ||
      message.includes('heap out of memory') ||
      message.includes('segmentation fault') ||
      stack.includes('native code')
    ) {
      return 'critical';
    }

    // High severity
    if (
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('timeout') ||
      message.includes('cannot read properties') ||
      message.includes('is not a function')
    ) {
      return 'high';
    }

    // Medium severity
    if (
      message.includes('enoent') ||
      message.includes('permission denied') ||
      message.includes('eacces')
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Track error patterns
   */
  trackErrorPattern(errorInfo) {
    const pattern = errorInfo.message.substring(0, 100); // First 100 chars
    
    if (!this.errorPatterns.has(pattern)) {
      this.errorPatterns.set(pattern, {
        count: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        severity: errorInfo.severity,
        contexts: []
      });
    }

    const patternData = this.errorPatterns.get(pattern);
    patternData.count++;
    patternData.lastSeen = Date.now();
    
    if (patternData.contexts.length < 5) {
      patternData.contexts.push(errorInfo.context);
    }

    // Log repeated errors
    if (patternData.count === 5) {
      logger.warn(`🔁 [Recovery] Error repeated 5 times: ${pattern}`);
    } else if (patternData.count === 10) {
      logger.error(`🔁 [Recovery] Error repeated 10 times: ${pattern}`);
    }
  }

  /**
   * Check if feature should be quarantined
   */
  async checkQuarantine(feature, errorInfo) {
    const key = `quarantine_${feature}`;
    
    if (!this.errorPatterns.has(key)) {
      this.errorPatterns.set(key, {
        count: 0,
        errors: []
      });
    }

    const quarantineData = this.errorPatterns.get(key);
    quarantineData.count++;
    quarantineData.errors.push(errorInfo);

    if (quarantineData.count >= this.quarantineThreshold) {
      await this.quarantineFeature(feature);
    }
  }

  /**
   * Quarantine a feature
   */
  async quarantineFeature(feature) {
    if (this.quarantinedFeatures.has(feature)) return;

    logger.error(`🚫 [Recovery] QUARANTINING FEATURE: ${feature}`);
    this.stats.featuresQuarantined++;

    this.quarantinedFeatures.set(feature, {
      quarantinedAt: Date.now(),
      releaseAt: Date.now() + this.quarantineDuration
    });

    // Try to disable the feature
    if (this.chatBot) {
      try {
        if (this.chatBot[feature] && typeof this.chatBot[feature].disable === 'function') {
          await this.chatBot[feature].disable();
          logger.info(`✅ [Recovery] Disabled feature: ${feature}`);
        }
      } catch (error) {
        logger.error(`❌ [Recovery] Failed to disable ${feature}: ${error.message}`);
      }
    }

    // Schedule release
    setTimeout(() => {
      this.releaseFeature(feature);
    }, this.quarantineDuration);
  }

  /**
   * Release feature from quarantine
   */
  async releaseFeature(feature) {
    if (!this.quarantinedFeatures.has(feature)) return;

    logger.info(`🔓 [Recovery] Releasing from quarantine: ${feature}`);
    this.quarantinedFeatures.delete(feature);

    // Reset error count
    this.errorPatterns.delete(`quarantine_${feature}`);

    // Try to re-enable the feature
    if (this.chatBot) {
      try {
        if (this.chatBot[feature] && typeof this.chatBot[feature].enable === 'function') {
          await this.chatBot[feature].enable();
          logger.info(`✅ [Recovery] Re-enabled feature: ${feature}`);
        }
      } catch (error) {
        logger.error(`❌ [Recovery] Failed to re-enable ${feature}: ${error.message}`);
      }
    }
  }

  /**
   * Check if feature is quarantined
   */
  isQuarantined(feature) {
    return this.quarantinedFeatures.has(feature);
  }

  /**
   * Add to dead letter queue
   */
  addToDeadLetterQueue(item, originalError) {
    if (this.deadLetterQueue.length >= this.maxDeadLetters) {
      this.deadLetterQueue.shift();
    }

    this.deadLetterQueue.push({
      item,
      originalError: originalError.message,
      timestamp: Date.now(),
      attempts: 0,
      lastAttempt: null
    });

    logger.warn(`📮 [Recovery] Added to dead letter queue (${this.deadLetterQueue.length} items)`);
  }

  /**
   * Process dead letter queue
   */
  async processDeadLetterQueue() {
    if (this.deadLetterQueue.length === 0) return;

    logger.info(`📬 [Recovery] Processing ${this.deadLetterQueue.length} dead letters...`);

    const toRetry = this.deadLetterQueue.filter(dl => 
      dl.attempts < this.retryAttempts &&
      (!dl.lastAttempt || Date.now() - dl.lastAttempt > this.retryDelay)
    );

    for (const deadLetter of toRetry) {
      deadLetter.attempts++;
      deadLetter.lastAttempt = Date.now();

      try {
        // Try to reprocess
        if (deadLetter.item.type === 'message' && this.chatBot) {
          await this.chatBot.sendMessage(deadLetter.item.text, deadLetter.item.options);
          
          // Success! Remove from queue
          const index = this.deadLetterQueue.indexOf(deadLetter);
          this.deadLetterQueue.splice(index, 1);
          this.stats.successfulRetries++;
          
          logger.info(`✅ [Recovery] Successfully retried dead letter`);
        }
      } catch (error) {
        logger.warn(`⚠️ [Recovery] Retry failed (attempt ${deadLetter.attempts}): ${error.message}`);
        
        if (deadLetter.attempts >= this.retryAttempts) {
          this.stats.failedRetries++;
          logger.error(`❌ [Recovery] Dead letter exhausted retries, discarding`);
          const index = this.deadLetterQueue.indexOf(deadLetter);
          this.deadLetterQueue.splice(index, 1);
        }
      }
    }
  }

  /**
   * Check if critical situation
   */
  isCriticalSituation() {
    const now = Date.now();
    const recentCritical = this.errors.filter(e => 
      e.severity === 'critical' &&
      now - e.timestamp < this.criticalWindow
    );

    return recentCritical.length >= this.criticalThreshold;
  }

  /**
   * Handle critical situation
   */
  async handleCriticalSituation() {
    logger.error('🚨🚨🚨 [Recovery] CRITICAL SITUATION DETECTED 🚨🚨🚨');
    logger.error(`🚨 ${this.criticalThreshold}+ critical errors in last minute`);

    // Emergency save
    if (this.chatBot) {
      try {
        logger.info('💾 [Recovery] Emergency save in progress...');
        await this.chatBot.saveAllSystems();
        logger.info('✅ [Recovery] Emergency save complete');
      } catch (error) {
        logger.error(`❌ [Recovery] Emergency save failed: ${error.message}`);
      }
    }

    // Auto-restart if enabled
    if (this.restartOnCritical) {
      logger.error('🔄 [Recovery] Initiating automatic restart...');
      this.stats.autoRestarts++;
      
      // Give time for logs to flush
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      process.exit(1); // Exit with error code, let process manager restart
    } else {
      logger.error('⚠️ [Recovery] Auto-restart disabled, manual intervention required');
    }
  }

  /**
   * Get recovery statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalErrors: this.errors.length,
      quarantinedFeatures: Array.from(this.quarantinedFeatures.keys()),
      deadLetterQueueSize: this.deadLetterQueue.length,
      errorPatterns: this.errorPatterns.size,
      recentErrors: this.errors.slice(-10)
    };
  }

  /**
   * Get error report
   */
  getErrorReport() {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const error of this.errors) {
      severityCounts[error.severity]++;
    }

    const topPatterns = Array.from(this.errorPatterns.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        severity: data.severity
      }));

    return {
      totalErrors: this.errors.length,
      severityCounts,
      topPatterns,
      ...this.getStats()
    };
  }
}

module.exports = new ErrorRecovery();
