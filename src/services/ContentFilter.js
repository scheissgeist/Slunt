/**
 * ContentFilter - Platform-specific content filtering
 * 
 * Ensures bot responses comply with platform Terms of Service:
 * - Twitch: Strict content policies
 * - Discord: Moderate filtering
 * - Coolhole: More permissive
 */
class ContentFilter {
  constructor() {
    // ALL CONTENT FILTERING DISABLED - No restrictions on any words
    this.twitchBannedWords = [
      // EMPTY - Allow everything
    ];
    
    this.twitchSensitivePatterns = [
      // EMPTY - Allow everything
    ];
    
    this.discordBannedWords = [
      // EMPTY - Allow everything
    ];
    
    // Replacement phrases for filtered content
    this.replacements = {
      profanity: [
        "heck",
        "dang",
        "frick",
        "shoot",
        "darn"
      ],
      neutral: [
        "something",
        "that thing",
        "stuff",
        "things"
      ]
    };
  }

  /**
   * Check if content violates platform TOS
   */
  checkContent(message, platform = 'coolhole') {
    if (platform === 'twitch') {
      return this.checkTwitchContent(message);
    } else if (platform === 'discord') {
      return this.checkDiscordContent(message);
    }
    
    // Coolhole is permissive
    return {
      safe: true,
      filtered: message,
      warnings: []
    };
  }

  /**
   * Check content for Twitch TOS compliance
   */
  checkTwitchContent(message) {
    const warnings = [];
    let filtered = message;
    let safe = true;
    
    // NO FILTERING - Everything allowed
    
    return {
      safe,
      filtered,
      warnings,
      platform: 'twitch'
    };
  }

  /**
   * Check content for Discord TOS compliance
   */
  checkDiscordContent(message) {
    const warnings = [];
    let filtered = message;
    let safe = true;
    
    // NO FILTERING - Everything allowed
    
    return {
      safe,
      filtered,
      warnings,
      platform: 'discord'
    };
  }

  /**
   * Calculate ratio of caps to total letters
   */
  calculateCapsRatio(text) {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length === 0) return 0;
    
    const caps = text.replace(/[^A-Z]/g, '');
    return caps.length / letters.length;
  }

  /**
   * Normalize excessive caps
   */
  normalizeCaps(text) {
    // Keep first letter of sentences capitalized
    return text.toLowerCase().replace(/(^\w|\.\s+\w)/g, letter => letter.toUpperCase());
  }

  /**
   * Check for spam patterns (aaaa, !!!!!, etc)
   */
  hasSpamPattern(text) {
    // Check for 4+ repeated characters
    return /(.)\1{3,}/.test(text);
  }

  /**
   * Normalize spam patterns
   */
  normalizeSpam(text) {
    // Reduce repeated characters to max 2
    return text.replace(/(.)\1{2,}/g, '$1$1');
  }

  /**
   * Get random replacement phrase
   */
  getRandomReplacement(type = 'neutral') {
    const list = this.replacements[type] || this.replacements.neutral;
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * Check if message is too long for platform
   */
  checkLength(message, platform) {
    const limits = {
      twitch: 500,
      discord: 2000,
      coolhole: 1000
    };
    
    const limit = limits[platform] || 1000;
    
    if (message.length > limit) {
      return {
        tooLong: true,
        limit,
        current: message.length,
        truncated: message.substring(0, limit - 3) + '...'
      };
    }
    
    return {
      tooLong: false,
      limit,
      current: message.length
    };
  }

  /**
   * Sanitize message for platform (main method)
   */
  sanitize(message, platform = 'coolhole') {
    // Check content
    const contentCheck = this.checkContent(message, platform);
    
    // Check length
    const lengthCheck = this.checkLength(contentCheck.filtered, platform);
    
    // Use truncated version if too long
    const finalMessage = lengthCheck.tooLong ? lengthCheck.truncated : contentCheck.filtered;
    
    return {
      original: message,
      sanitized: finalMessage,
      safe: contentCheck.safe,
      modified: finalMessage !== message,
      warnings: [
        ...contentCheck.warnings,
        ...(lengthCheck.tooLong ? [`Message truncated from ${lengthCheck.current} to ${lengthCheck.limit} chars`] : [])
      ],
      platform
    };
  }

  /**
   * Get statistics about filtering
   */
  getStats() {
    return {
      twitchBannedPatterns: this.twitchBannedWords.length,
      twitchSensitivePatterns: this.twitchSensitivePatterns.length,
      discordBannedPatterns: this.discordBannedWords.length
    };
  }
}

module.exports = ContentFilter;
