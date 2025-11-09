/**
 * Message Counter (Simplified Sentiment Analyzer)
 * Tracks message counts and basic activity - Grok handles sentiment naturally
 */
class SentimentAnalyzer {
  constructor() {
    // Platform-specific message tracking
    this.platformMetrics = {
      twitch: { count: 0, users: new Set() },
      discord: { count: 0, users: new Set() },
      coolhole: { count: 0, users: new Set() }
    };
    
    // Recent message window for activity detection
    this.recentMessages = [];
    this.windowDuration = 120000; // 2 minutes
  }

  /**
   * Analyze message - simplified to just return basic sentiment
   * Grok infers actual sentiment from context
   */
  analyze(text) {
    // Very simple: positive if has lol/lmao, negative if has insulting words
    const lower = text.toLowerCase();
    
    if (lower.match(/\b(lol|lmao|haha|nice|pog|based|good|great|love|awesome)\b/)) {
      return 0.7; // Positive
    }
    if (lower.match(/\b(fuck|shit|stupid|trash|garbage|awful|hate|sucks)\b/)) {
      return 0.3; // Negative
    }
    return 0.5; // Neutral
  }

  /**
   * Track message for activity counting
   */
  analyzeMessage(data) {
    const now = Date.now();
    const platform = data.platform || 'unknown';
    
    // Track message
    this.recentMessages.push({
      username: data.username,
      timestamp: now,
      platform: platform
    });
    
    // Update platform counts
    if (this.platformMetrics[platform]) {
      this.platformMetrics[platform].count++;
      this.platformMetrics[platform].users.add(data.username);
    }
    
    // Clean old messages
    this.recentMessages = this.recentMessages.filter(m => 
      now - m.timestamp < this.windowDuration
    );
  }

  /**
   * Get activity level for platform
   */
  getActivityLevel(platform) {
    const recent = this.recentMessages.filter(m => m.platform === platform);
    const count = recent.length;
    
    if (count > 20) return 'high';
    if (count > 10) return 'medium';
    return 'low';
  }

  /**
   * Get metrics - simplified
   */
  getMetrics() {
    return {
      platforms: Object.entries(this.platformMetrics).map(([name, data]) => ({
        name,
        count: data.count,
        users: data.users.size,
        activity: this.getActivityLevel(name)
      })),
      totalMessages: this.recentMessages.length,
      recentActivity: this.recentMessages.length > 15 ? 'high' : this.recentMessages.length > 8 ? 'medium' : 'low'
    };
  }

  // Stub methods for compatibility
  start() { }
  stop() { }
  updateMetrics() { }
}

module.exports = SentimentAnalyzer;
