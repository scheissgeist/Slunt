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
    // Don't track empty messages
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return;
    }
    
    this.recentResponses.push({
      text: message,
      timestamp: Date.now(),
      patterns: this.extractPatterns(message)
    });
    
    // Keep last 75 (increased from 50 for better long-term tracking)
    if (this.recentResponses.length > 75) {
      this.recentResponses.shift();
    }
    
    // Track patterns
    const patterns = this.extractPatterns(message);
    patterns.forEach(pattern => {
      const count = this.responsePatterns.get(pattern) || 0;
      this.responsePatterns.set(pattern, count + 1);
      
      // Only throttle if REALLY overused (more lenient now)
      // Short phrases like "lol", "nah", "yeah" are natural and should be allowed more often
      const isShortCasual = ['lol', 'lmao', 'yeah', 'nah', 'bruh', 'true'].includes(pattern);
      
      if (isShortCasual) {
        // Allow casual phrases more often - only throttle after 6 uses in recent messages (lowered from 8)
        if (count > 6) {
          this.throttledPhrases.add(pattern);
          console.log(`🚫 [Variety] Throttling overused casual phrase: "${pattern}"`);
          
          // Remove throttle after just 2 minutes for casual phrases
          setTimeout(() => {
            this.throttledPhrases.delete(pattern);
            this.responsePatterns.set(pattern, 0);
          }, 2 * 60 * 1000);
        }
      } else {
        // Other patterns (quotes, specific joke structures) are more annoying when repeated
        // Lowered from 4 to 3 - throttle sooner
        if (count > 3) {
          this.throttledPhrases.add(pattern);
          console.log(`🚫 [Variety] Throttling overused pattern: "${pattern}"`);
          
          // Remove throttle after 5 minutes
          setTimeout(() => {
            this.throttledPhrases.delete(pattern);
            this.responsePatterns.set(pattern, 0);
          }, 5 * 60 * 1000);
        }
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
    const normalizedMsg = message.toLowerCase().trim();
    
    // Check last 15 messages for near-duplicates (increased from 10)
    const lastFifteen = this.recentResponses.slice(-15);
    for (const recent of lastFifteen) {
      const recentNormalized = recent.text.toLowerCase().trim();
      
      // Block if messages are very similar (>60% overlap, lowered from 70%)
      const similarity = this.calculateSimilarity(normalizedMsg, recentNormalized);
      if (similarity > 0.6) {
        console.log(`⚠️ [Variety] Blocked similar response (${(similarity*100).toFixed(0)}% match): "${message.slice(0, 50)}..."`);
        return true;
      }
      
      // Also block if short message (< 40 chars) was used in last 15 (increased from 30 chars in 10 messages)
      if (message.length < 40 && normalizedMsg === recentNormalized) {
        console.log(`⚠️ [Variety] Blocked identical short response in last 15`);
        return true;
      }
      
      // Block if very similar and recent (within last 5 messages, be more strict)
      if (lastFifteen.indexOf(recent) >= lastFifteen.length - 5 && similarity > 0.5) {
        console.log(`⚠️ [Variety] Blocked similar response in last 5 messages (${(similarity*100).toFixed(0)}% match)`);
        return true;
      }
    }
    
    // Check if using throttled phrases
    for (const pattern of patterns) {
      if (this.throttledPhrases.has(pattern)) {
        console.log(`⚠️ [Variety] Blocked response using throttled: "${pattern}"`);
        return true;
      }
    }
    
    // Check similarity to recent responses (only for longer messages)
    const recentPatterns = this.recentResponses
      .slice(-15)
      .flatMap(r => r.patterns);
    
    const matchCount = patterns.filter(p => recentPatterns.includes(p)).length;
    
    // Lowered threshold from 4 to 3 - need LESS pattern overlap to block
    if (matchCount >= 3 && patterns.length > 0) {
      console.log(`⚠️ [Variety] Response too similar to recent messages (${matchCount}/${patterns.length} patterns match)`);
      return true;
    }
    
    return false;
  }

  /**
   * Calculate similarity between two strings (0.0 to 1.0)
   */
  calculateSimilarity(str1, str2) {
    // Quick exact match
    if (str1 === str2) return 1.0;
    
    // Tokenize into words
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    // Calculate Jaccard similarity (intersection / union)
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
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
      'lmao': ['lol', 'haha', 'bruh', 'that\'s wild'],
      'lol': ['lmao', 'haha', 'bruh'],
      'yeah': ['true', 'facts', 'yep', 'agreed'],
      'nah': ['nope', 'naw', 'don\'t think so', 'not really'],
      'true': ['yeah', 'facts', 'real'],
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
