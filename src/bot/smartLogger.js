/**
 * Smart Logger with Log Levels
 * Reduces console spam in production
 */

class SmartLogger {
  constructor() {
    // Log levels: 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
    this.level = process.env.LOG_LEVEL || 'INFO';
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3
    };
    
    this.currentLevel = this.levels[this.level] || this.levels.INFO;
    
    // Emoji per level
    this.emoji = {
      DEBUG: '🔍',
      INFO: '✨',
      WARN: '⚠️',
      ERROR: '❌'
    };
    
    // Stats
    this.stats = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      suppressed: 0
    };
    
    // Rate limiting for spammy logs
    this.rateLimits = new Map(); // key -> last logged time
    this.rateLimitWindow = 5000; // 5 seconds
  }

  /**
   * Check if should log based on level
   */
  shouldLog(level) {
    return this.levels[level] >= this.currentLevel;
  }

  /**
   * Rate limit check
   */
  shouldRateLimit(key) {
    const now = Date.now();
    const lastLogged = this.rateLimits.get(key);
    
    if (lastLogged && now - lastLogged < this.rateLimitWindow) {
      return true; // Should rate limit (don't log)
    }
    
    this.rateLimits.set(key, now);
    return false; // Don't rate limit (do log)
  }

  /**
   * Format log message
   */
  format(level, category, message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    const emoji = this.emoji[level] || '';
    return `[${timestamp}] ${emoji} [${category}] ${message}`;
  }

  /**
   * Log at DEBUG level
   */
  debug(category, message, rateLimit = false) {
    if (!this.shouldLog('DEBUG')) {
      this.stats.suppressed++;
      return;
    }
    
    if (rateLimit && this.shouldRateLimit(`${category}:${message}`)) {
      this.stats.suppressed++;
      return;
    }
    
    console.log(this.format('DEBUG', category, message));
    this.stats.debug++;
  }

  /**
   * Log at INFO level
   */
  info(category, message, rateLimit = false) {
    if (!this.shouldLog('INFO')) {
      this.stats.suppressed++;
      return;
    }
    
    if (rateLimit && this.shouldRateLimit(`${category}:${message}`)) {
      this.stats.suppressed++;
      return;
    }
    
    console.log(this.format('INFO', category, message));
    this.stats.info++;
  }

  /**
   * Log at WARN level
   */
  warn(category, message, rateLimit = false) {
    if (!this.shouldLog('WARN')) {
      this.stats.suppressed++;
      return;
    }
    
    if (rateLimit && this.shouldRateLimit(`${category}:${message}`)) {
      this.stats.suppressed++;
      return;
    }
    
    console.warn(this.format('WARN', category, message));
    this.stats.warn++;
  }

  /**
   * Log at ERROR level (always logs)
   */
  error(category, message, error = null) {
    console.error(this.format('ERROR', category, message));
    if (error && error.stack) {
      console.error(error.stack);
    }
    this.stats.error++;
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = level;
      this.currentLevel = this.levels[level];
      console.log(`📊 [Logger] Log level set to: ${level}`);
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      currentLevel: this.level,
      rateLimitedKeys: this.rateLimits.size
    };
  }

  /**
   * Clear rate limits (for testing)
   */
  clearRateLimits() {
    this.rateLimits.clear();
  }
}

// Singleton instance
const smartLogger = new SmartLogger();

module.exports = smartLogger;
