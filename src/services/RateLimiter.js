/**
 * RateLimiter - Prevent spam and abuse across all platforms
 * 
 * Features:
 * - Per-user rate limiting
 * - Per-platform limits
 * - Global limits
 * - Configurable thresholds
 * - Cooldown system
 * - Warning system
 */
class RateLimiter {
  constructor(config = {}) {
    this.config = {
      // Messages per minute per user
      maxMessagesPerMinute: config.maxMessagesPerMinute || 10,
      // Commands per minute per user
      maxCommandsPerMinute: config.maxCommandsPerMinute || 5,
      // Global messages per minute (all users)
      maxGlobalMessagesPerMinute: config.maxGlobalMessagesPerMinute || 60,
      // Cooldown period after hitting limit (ms)
      cooldownPeriod: config.cooldownPeriod || 60000, // 1 minute
      // Warning threshold (% of limit before warning)
      warningThreshold: config.warningThreshold || 0.8,
      ...config
    };
    
    // Track user activity
    this.userActivity = new Map(); // userId -> activity data
    this.globalActivity = []; // Recent messages timestamps
    this.cooldowns = new Map(); // userId -> cooldown expiry
    this.warnings = new Map(); // userId -> warning count
  }

  /**
   * Check if user can send a message
   */
  checkMessage(userId, platform = 'unknown') {
    const now = Date.now();
    
    // Check if user is in cooldown
    if (this.isInCooldown(userId)) {
      return {
        allowed: false,
        reason: 'cooldown',
        remainingTime: this.getCooldownRemaining(userId)
      };
    }
    
    // Get or create user activity record
    if (!this.userActivity.has(userId)) {
      this.userActivity.set(userId, {
        messages: [],
        commands: [],
        platform
      });
    }
    
    const activity = this.userActivity.get(userId);
    
    // Clean up old messages (older than 1 minute)
    const oneMinuteAgo = now - 60000;
    activity.messages = activity.messages.filter(t => t > oneMinuteAgo);
    this.globalActivity = this.globalActivity.filter(t => t > oneMinuteAgo);
    
    // Check user rate limit
    if (activity.messages.length >= this.config.maxMessagesPerMinute) {
      this.applyCooldown(userId);
      return {
        allowed: false,
        reason: 'user_rate_limit',
        limit: this.config.maxMessagesPerMinute,
        current: activity.messages.length
      };
    }
    
    // Check global rate limit
    if (this.globalActivity.length >= this.config.maxGlobalMessagesPerMinute) {
      return {
        allowed: false,
        reason: 'global_rate_limit',
        limit: this.config.maxGlobalMessagesPerMinute
      };
    }
    
    // Check if approaching limit (warning)
    const warningLimit = this.config.maxMessagesPerMinute * this.config.warningThreshold;
    if (activity.messages.length >= warningLimit) {
      this.addWarning(userId);
    }
    
    // Allow message
    activity.messages.push(now);
    this.globalActivity.push(now);
    
    return {
      allowed: true,
      remaining: this.config.maxMessagesPerMinute - activity.messages.length,
      warning: activity.messages.length >= warningLimit
    };
  }

  /**
   * Check if user can execute a command
   */
  checkCommand(userId, platform = 'unknown') {
    const now = Date.now();
    
    // Check if user is in cooldown
    if (this.isInCooldown(userId)) {
      return {
        allowed: false,
        reason: 'cooldown',
        remainingTime: this.getCooldownRemaining(userId)
      };
    }
    
    // Get or create user activity record
    if (!this.userActivity.has(userId)) {
      this.userActivity.set(userId, {
        messages: [],
        commands: [],
        platform
      });
    }
    
    const activity = this.userActivity.get(userId);
    
    // Clean up old commands
    const oneMinuteAgo = now - 60000;
    activity.commands = activity.commands.filter(t => t > oneMinuteAgo);
    
    // Check command rate limit
    if (activity.commands.length >= this.config.maxCommandsPerMinute) {
      this.applyCooldown(userId);
      return {
        allowed: false,
        reason: 'command_rate_limit',
        limit: this.config.maxCommandsPerMinute,
        current: activity.commands.length
      };
    }
    
    // Allow command
    activity.commands.push(now);
    
    return {
      allowed: true,
      remaining: this.config.maxCommandsPerMinute - activity.commands.length
    };
  }

  /**
   * Apply cooldown to user
   */
  applyCooldown(userId) {
    const expiryTime = Date.now() + this.config.cooldownPeriod;
    this.cooldowns.set(userId, expiryTime);
    console.log(`⏸️ [RateLimit] User ${userId} in cooldown for ${this.config.cooldownPeriod / 1000}s`);
  }

  /**
   * Check if user is in cooldown
   */
  isInCooldown(userId) {
    const cooldown = this.cooldowns.get(userId);
    if (!cooldown) return false;
    
    if (Date.now() >= cooldown) {
      this.cooldowns.delete(userId);
      return false;
    }
    
    return true;
  }

  /**
   * Get remaining cooldown time
   */
  getCooldownRemaining(userId) {
    const cooldown = this.cooldowns.get(userId);
    if (!cooldown) return 0;
    
    const remaining = cooldown - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Add warning to user
   */
  addWarning(userId) {
    const current = this.warnings.get(userId) || 0;
    this.warnings.set(userId, current + 1);
  }

  /**
   * Get user warnings
   */
  getWarnings(userId) {
    return this.warnings.get(userId) || 0;
  }

  /**
   * Clear user warnings
   */
  clearWarnings(userId) {
    this.warnings.delete(userId);
  }

  /**
   * Reset user's rate limits (admin function)
   */
  resetUser(userId) {
    this.userActivity.delete(userId);
    this.cooldowns.delete(userId);
    this.warnings.delete(userId);
    console.log(`🔄 [RateLimit] Reset limits for user ${userId}`);
  }

  /**
   * Get statistics
   */
  getStats() {
    const activeUsers = this.userActivity.size;
    const usersInCooldown = Array.from(this.cooldowns.values())
      .filter(expiry => Date.now() < expiry).length;
    
    const globalRate = this.globalActivity.length;
    
    return {
      activeUsers,
      usersInCooldown,
      globalMessagesLastMinute: globalRate,
      globalLimit: this.config.maxGlobalMessagesPerMinute,
      globalUtilization: (globalRate / this.config.maxGlobalMessagesPerMinute * 100).toFixed(1) + '%'
    };
  }

  /**
   * Get user activity info
   */
  getUserInfo(userId) {
    const activity = this.userActivity.get(userId);
    if (!activity) {
      return {
        exists: false,
        messages: 0,
        commands: 0,
        inCooldown: false
      };
    }
    
    return {
      exists: true,
      messages: activity.messages.length,
      commands: activity.commands.length,
      platform: activity.platform,
      inCooldown: this.isInCooldown(userId),
      cooldownRemaining: this.getCooldownRemaining(userId),
      warnings: this.getWarnings(userId)
    };
  }

  /**
   * Cleanup old data (run periodically)
   */
  cleanup() {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000; // 5 minutes
    
    // Remove inactive users
    for (const [userId, activity] of this.userActivity.entries()) {
      const lastActivity = Math.max(
        ...activity.messages,
        ...activity.commands,
        0
      );
      
      if (lastActivity < fiveMinutesAgo) {
        this.userActivity.delete(userId);
      }
    }
    
    // Remove expired cooldowns
    for (const [userId, expiry] of this.cooldowns.entries()) {
      if (now >= expiry) {
        this.cooldowns.delete(userId);
      }
    }
  }
}

module.exports = RateLimiter;
