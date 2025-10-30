/**
 * Memory Manager
 * Monitors and optimizes memory usage
 */

const logger = require('../bot/logger');

class MemoryManager {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Configuration
    this.config = {
      maxMemoryMB: 1024, // 1GB limit
      warningThresholdMB: 768, // 75% warning
      criticalThresholdMB: 896, // 87.5% critical
      chatHistoryMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      chatHistoryMaxSize: 10000, // max messages
      checkInterval: 60000, // 1 minute
      gcInterval: 300000, // 5 minutes
    };

    // LRU Cache for frequently accessed data
    this.cache = new Map();
    this.cacheMaxSize = 500;

    // Memory stats
    this.stats = {
      lastCheck: null,
      lastGC: null,
      warnings: 0,
      gcForced: 0,
      chatHistoryCleaned: 0,
      cachePurges: 0
    };

    this.isMonitoring = false;
  }

  /**
   * Start memory monitoring
   */
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    logger.info('🧠 [Memory] Memory manager started');

    // Regular memory checks
    this.checkInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.checkInterval);

    // Periodic garbage collection
    this.gcInterval = setInterval(() => {
      this.performMaintenance();
    }, this.config.gcInterval);
  }

  /**
   * Stop memory monitoring
   */
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    clearInterval(this.checkInterval);
    clearInterval(this.gcInterval);
    logger.info('🛑 [Memory] Memory manager stopped');
  }

  /**
   * Check current memory usage
   */
  checkMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    this.stats.lastCheck = new Date();

    // Check thresholds
    if (heapUsedMB > this.config.criticalThresholdMB) {
      logger.error(`🚨 [Memory] CRITICAL: ${heapUsedMB}MB / ${this.config.maxMemoryMB}MB`);
      this.stats.warnings++;
      this.emergencyCleanup();
    } else if (heapUsedMB > this.config.warningThresholdMB) {
      logger.warn(`⚠️ [Memory] WARNING: ${heapUsedMB}MB / ${this.config.maxMemoryMB}MB`);
      this.stats.warnings++;
      this.performMaintenance();
    }

    // Log every 10 minutes
    if (!this.lastLogTime || Date.now() - this.lastLogTime > 600000) {
      logger.info(`💾 [Memory] Usage: ${heapUsedMB}MB heap, ${rssMB}MB RSS`);
      this.lastLogTime = Date.now();
    }

    return {
      heapUsedMB,
      heapTotalMB,
      rssMB,
      percentage: Math.round((heapUsedMB / this.config.maxMemoryMB) * 100)
    };
  }

  /**
   * Perform regular maintenance
   */
  async performMaintenance() {
    logger.info('🧹 [Memory] Running maintenance...');

    try {
      // Clean old chat history
      await this.cleanOldChatHistory();

      // Purge cache if too large
      if (this.cache.size > this.cacheMaxSize * 1.5) {
        this.purgeCache();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        this.stats.lastGC = new Date();
        this.stats.gcForced++;
        logger.info('🗑️ [Memory] Garbage collection forced');
      }

      logger.info('✅ [Memory] Maintenance complete');
    } catch (error) {
      logger.error(`❌ [Memory] Maintenance error: ${error.message}`);
    }
  }

  /**
   * Emergency cleanup when memory is critical
   */
  async emergencyCleanup() {
    logger.error('🚨 [Memory] EMERGENCY CLEANUP INITIATED');

    try {
      // Aggressive chat history cleanup (keep only 24 hours)
      if (this.chatBot.chatHistory && Array.isArray(this.chatBot.chatHistory)) {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const before = this.chatBot.chatHistory.length;
        this.chatBot.chatHistory = this.chatBot.chatHistory.filter(msg => 
          msg.timestamp && msg.timestamp > oneDayAgo
        );
        const removed = before - this.chatBot.chatHistory.length;
        logger.warn(`🗑️ [Memory] Emergency: removed ${removed} old messages`);
      }

      // Clear entire cache
      this.cache.clear();
      this.stats.cachePurges++;
      logger.warn('🗑️ [Memory] Emergency: cache cleared');

      // Force GC multiple times
      if (global.gc) {
        global.gc();
        await new Promise(resolve => setTimeout(resolve, 100));
        global.gc();
        logger.warn('🗑️ [Memory] Emergency: GC forced 2x');
      }

      // Check if it helped
      const usage = this.checkMemoryUsage();
      if (usage.heapUsedMB > this.config.criticalThresholdMB) {
        logger.error('🚨 [Memory] EMERGENCY CLEANUP FAILED - RESTART RECOMMENDED');
      } else {
        logger.info('✅ [Memory] Emergency cleanup successful');
      }
    } catch (error) {
      logger.error(`❌ [Memory] Emergency cleanup error: ${error.message}`);
    }
  }

  /**
   * Clean old chat history
   */
  async cleanOldChatHistory() {
    if (!this.chatBot.chatHistory || !Array.isArray(this.chatBot.chatHistory)) {
      return;
    }

    const before = this.chatBot.chatHistory.length;
    const cutoffTime = Date.now() - this.config.chatHistoryMaxAge;

    // Remove messages older than cutoff
    this.chatBot.chatHistory = this.chatBot.chatHistory.filter(msg => 
      !msg.timestamp || msg.timestamp > cutoffTime
    );

    // Also enforce max size
    if (this.chatBot.chatHistory.length > this.config.chatHistoryMaxSize) {
      const excess = this.chatBot.chatHistory.length - this.config.chatHistoryMaxSize;
      this.chatBot.chatHistory.splice(0, excess);
    }

    const removed = before - this.chatBot.chatHistory.length;
    if (removed > 0) {
      this.stats.chatHistoryCleaned += removed;
      logger.info(`🗑️ [Memory] Cleaned ${removed} old messages (${this.chatBot.chatHistory.length} remain)`);
    }
  }

  /**
   * Purge LRU cache
   */
  purgeCache() {
    const before = this.cache.size;
    const toRemove = this.cache.size - this.cacheMaxSize;

    if (toRemove <= 0) return;

    // Remove oldest entries (Map preserves insertion order)
    const keys = Array.from(this.cache.keys());
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(keys[i]);
    }

    this.stats.cachePurges++;
    logger.info(`🗑️ [Memory] Purged ${toRemove} cache entries (${before} → ${this.cache.size})`);
  }

  /**
   * Cache management methods
   */
  getCached(key) {
    if (this.cache.has(key)) {
      // Move to end (LRU)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  setCached(key, value) {
    // Remove if exists (will re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Add to end
    this.cache.set(key, value);

    // Enforce size limit
    if (this.cache.size > this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Get memory statistics
   */
  getStats() {
    const usage = this.checkMemoryUsage();
    return {
      ...this.stats,
      currentUsage: usage,
      cacheSize: this.cache.size,
      chatHistorySize: this.chatBot.chatHistory ? this.chatBot.chatHistory.length : 0
    };
  }
}

module.exports = MemoryManager;
