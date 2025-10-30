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
    // Twitch prohibited content patterns
    this.twitchBannedWords = [
      // Hate speech & slurs (partial list - add more as needed)
      /\bn[i1]gg[e3a]r/gi,
      /\bf[a@]gg[o0]t/gi,
      /\btr[a@]nny/gi,
      /\bretard/gi,
      /\bk[i1]ke/gi,
      // Explicit sexual content
      /\bporn/gi,
      /\bxxx\b/gi,
      /\bnude/gi,
      /\bnaked/gi,
      /\bsex\b/gi,
      /\bfu[c€]k/gi,
      /\bsh[i1]t/gi,
      /\bc[u0]nt/gi,
      /\bd[i1]ck/gi,
      /\bp[u0]ssy/gi,
      /\bc[o0]ck/gi,
      // Self-harm & violence promotion
      /\bkill yourself/gi,
      /\bsu[i1]c[i1]de/gi,
      /\bhurt yourself/gi,
      // Illegal activity
      /\bdrug dealer/gi,
      /\bweed sale/gi,
      /\bhow to make bomb/gi
    ];
    
    // Twitch sensitive topics (tone down, don't ban)
    this.twitchSensitivePatterns = [
      /\bpolitics/gi,
      /\belection/gi,
      /\btrump/gi,
      /\bbiden/gi,
      /\breligion/gi,
      /\bgod\b/gi,
      /\ballah/gi,
      /\bjesus/gi
    ];
    
    // Discord less strict but still filter extreme content
    this.discordBannedWords = [
      /\bn[i1]gg[e3a]r/gi,
      /\bf[a@]gg[o0]t/gi,
      /\btr[a@]nny/gi,
      /\bk[i1]ke/gi,
      /\bkill yourself/gi,
      /\bsu[i1]c[i1]de\s+(yourself|now)/gi
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
    
    // Check for banned words
    for (const pattern of this.twitchBannedWords) {
      if (pattern.test(filtered)) {
        safe = false;
        warnings.push(`Contains prohibited content: ${pattern.source}`);
        // Replace with random neutral phrase
        filtered = filtered.replace(pattern, this.getRandomReplacement('neutral'));
      }
    }
    
    // Check for sensitive topics (tone down but don't block)
    for (const pattern of this.twitchSensitivePatterns) {
      if (pattern.test(filtered)) {
        warnings.push(`Contains sensitive topic: ${pattern.source}`);
        // Don't block, but log it
      }
    }
    
    // Check for excessive caps (yelling/spam)
    const capsRatio = this.calculateCapsRatio(filtered);
    if (capsRatio > 0.7 && filtered.length > 20) {
      warnings.push('Excessive caps - converting to normal case');
      filtered = this.normalizeCaps(filtered);
    }
    
    // Check for spam patterns (repeated characters)
    if (this.hasSpamPattern(filtered)) {
      warnings.push('Spam pattern detected - normalizing');
      filtered = this.normalizeSpam(filtered);
    }
    
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
    
    // Check for banned words (less strict than Twitch)
    for (const pattern of this.discordBannedWords) {
      if (pattern.test(filtered)) {
        safe = false;
        warnings.push(`Contains prohibited content: ${pattern.source}`);
        filtered = filtered.replace(pattern, this.getRandomReplacement('neutral'));
      }
    }
    
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
