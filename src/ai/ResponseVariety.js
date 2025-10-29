/**
 * Response Variety Tracker
 * Prevents Slunt from repeating the same jokes/patterns too often
 */

class ResponseVariety {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.recentResponses = []; // Last 50 responses
    this.responsePatterns = new Map(); // pattern -> count
    this.throttledPhrases = new Set(); // Phrases to avoid temporarily
    this.jokeHistory = new Map(); // joke -> lastUsed timestamp
  }

  /**
   * Track a response before sending
   */
  trackResponse(message) {
    this.recentResponses.push({
      text: message,
      timestamp: Date.now(),
      patterns: this.extractPatterns(message)
    });
    
    // Keep last 50
    if (this.recentResponses.length > 50) {
      this.recentResponses.shift();
    }
    
    // Track patterns
    const patterns = this.extractPatterns(message);
    patterns.forEach(pattern => {
      const count = this.responsePatterns.get(pattern) || 0;
      this.responsePatterns.set(pattern, count + 1);
      
      // Throttle if used too much
      if (count > 3) {
        this.throttledPhrases.add(pattern);
        console.log(`🚫 [Variety] Throttling overused phrase: "${pattern}"`);
        
        // Remove throttle after 10 minutes
        setTimeout(() => {
          this.throttledPhrases.delete(pattern);
          this.responsePatterns.set(pattern, 0);
        }, 10 * 60 * 1000);
      }
      
      // AGGRESSIVE throttling for lol/lmao - only allow once per 5 messages
      if ((pattern === 'lol' || pattern === 'lmao') && count > 1) {
        this.throttledPhrases.add(pattern);
        setTimeout(() => {
          this.throttledPhrases.delete(pattern);
          this.responsePatterns.set(pattern, 0);
        }, 5 * 60 * 1000); // 5 minutes
      }
    });
  }

  /**
   * Extract patterns from message
   */
  extractPatterns(message) {
    const patterns = [];
    const lower = message.toLowerCase();
    
    // Quotation marks - THROTTLE HEAVILY
    if (message.startsWith('"') || message.startsWith("'")) {
      patterns.push('quoted_response');
    }
    
    // Use regex test for faster matching
    const patternMap = {
      'lmao': /\blmao\b/,
      'lol': /\blol\b/,
      'yeah': /\byeah\b/,
      'nah': /\bnah\b/,
      'what': /\bwhat\b/,
      'true': /\btrue\b/,
      'fr': /\bfr\b/,
      'ngl': /\bngl\b/,
      'bruh': /\bbruh\b/,
      'damn': /\bdamn\b/
    };
    
    // Fast pattern matching
    for (const [pattern, regex] of Object.entries(patternMap)) {
      if (regex.test(lower)) patterns.push(pattern);
    }    
    // Emojis
    if (lower.includes('😂')) patterns.push('😂');
    if (lower.includes('💀')) patterns.push('💀');
    if (lower.includes('🔥')) patterns.push('🔥');
    
    // Question structure
    if (lower.startsWith('why ')) patterns.push('starts_with_why');
    if (lower.startsWith('how ')) patterns.push('starts_with_how');
    if (lower.startsWith('what ')) patterns.push('starts_with_what');
    
    // Agreement patterns
    if (lower.match(/^(yeah|yep|yup|true|facts|agreed)/)) patterns.push('simple_agreement');
    
    // Joke structures
    if (lower.includes('that\'s what')) patterns.push('thats_what_joke');
    if (lower.includes('your mom')) patterns.push('your_mom_joke');
    
    return patterns;
  }

  /**
   * Check if a response is too similar to recent ones
   */
  isTooSimilar(message) {
    const patterns = this.extractPatterns(message);
    
    // Check if using throttled phrases
    for (const pattern of patterns) {
      if (this.throttledPhrases.has(pattern)) {
        console.log(`⚠️ [Variety] Blocked response using throttled: "${pattern}"`);
        return true;
      }
    }
    
    // Check similarity to recent responses
    const recentPatterns = this.recentResponses
      .slice(-10)
      .flatMap(r => r.patterns);
    
    const matchCount = patterns.filter(p => recentPatterns.includes(p)).length;
    
    if (matchCount >= 3) {
      console.log(`⚠️ [Variety] Response too similar to recent messages`);
      return true;
    }
    
    return false;
  }

  /**
   * Check if a joke was used recently
   */
  wasJokeUsedRecently(jokeType) {
    if (!this.jokeHistory.has(jokeType)) return false;
    
    const lastUsed = this.jokeHistory.get(jokeType);
    const timeSince = Date.now() - lastUsed;
    
    // Don't reuse joke within 30 minutes
    return timeSince < 30 * 60 * 1000;
  }

  /**
   * Mark joke as used
   */
  markJokeUsed(jokeType) {
    this.jokeHistory.set(jokeType, Date.now());
  }

  /**
   * Get variety score (0-1, higher = more variety)
   */
  getVarietyScore() {
    if (this.recentResponses.length < 10) return 1.0;
    
    const uniquePatterns = new Set();
    this.recentResponses.slice(-20).forEach(r => {
      r.patterns.forEach(p => uniquePatterns.add(p));
    });
    
    const totalPatterns = this.recentResponses.slice(-20)
      .flatMap(r => r.patterns).length;
    
    return totalPatterns > 0 ? uniquePatterns.size / totalPatterns : 1.0;
  }

  /**
   * Suggest alternative phrase
   */
  getAlternative(phrase) {
    const alternatives = {
      'lmao': ['lol', 'haha', 'bruh', 'fr', 'that\'s wild'],
      'lol': ['lmao', 'haha', 'fr', 'bruh'],
      'yeah': ['true', 'facts', 'fr fr', 'yep', 'agreed'],
      'nah': ['nope', 'naw', 'don\'t think so', 'not really'],
      'true': ['yeah', 'facts', 'fr', 'real'],
      'fr': ['for real', 'true', 'facts', 'yeah'],
      'bruh': ['damn', 'bro', 'man', 'dude'],
      'damn': ['bruh', 'sheesh', 'woah', 'wild']
    };
    
    if (alternatives[phrase]) {
      const opts = alternatives[phrase];
      return opts[Math.floor(Math.random() * opts.length)];
    }
    
    return phrase;
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    return {
      recentResponses: this.recentResponses.length,
      throttledPhrases: this.throttledPhrases.size,
      varietyScore: this.getVarietyScore(),
      mostUsedPatterns: Array.from(this.responsePatterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  }
}

module.exports = ResponseVariety;
