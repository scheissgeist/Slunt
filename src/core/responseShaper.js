/**
 * RESPONSE SHAPER - Platform-specific styling and cleanup
 * 
 * Consolidates cleanup systems and platform-specific formatting.
 * Philosophy: Generate naturally, then shape for platform.
 */

const logger = require('../bot/logger');

class ResponseShaper {
  constructor() {
    // Platform-specific settings
    this.platformSettings = {
      voice: {
        maxWords: 12,
        maxSentences: 2,
        style: 'casual',
        allowMarkdown: false,
        allowEmoji: false
      },
      coolhole: {
        maxWords: 50,
        maxSentences: 5,
        style: 'casual',
        allowMarkdown: false,
        allowEmoji: true
      },
      discord: {
        maxWords: 80,
        maxSentences: 10,
        style: 'casual',
        allowMarkdown: true,
        allowEmoji: true
      },
      twitch: {
        maxWords: 60,
        maxSentences: 5,
        style: 'casual',
        allowMarkdown: false,
        allowEmoji: true
      }
    };
    
    // Cleanup patterns
    this.bannedPatterns = {
      hedging: /\b(basically|essentially|kind of|sort of|pretty much|I think|I guess|I mean|you know)\b/gi,
      formal: /(would be super helpful|I think you meant|let's keep it that way|based on actual|comment suggests)/gi,
      novelNarration: /(I replied with a|I said with a|shaking my head|with a (chuckle|laugh|smile|grin))/gi,
      explaining: /(if that makes sense|if you know what I mean|get what I'm saying|does that make sense)/gi,
      fillerPrefixes: /^(look,|dude,|man,|honestly,|so,|well,|okay,|alright,)\s*/gi,
      trailingConjunctions: /\s+(and|but|or|so|yet|because|since|though|although|if|when|where|while|as)\s*[.!?]*$/gi,
      trailingPrepositions: /\s+(to|at|in|on|for|with|from|of|by|about)\s*[.!?]*$/gi,
      trailingArticles: /\s+(the|a|an)\s*[.!?]*$/gi,
      garbageWords: /\b(idk|tbh|tho|like|just|actually|literally)\s*[.!?]*$/gi
    };
    
    // Stop sequences (things that should never appear)
    this.stopSequences = [
      'speaking of which',
      'if that makes sense',
      'does that make sense',
      'you know what I mean',
      'let me know if',
      'would be super helpful',
      'I think you meant',
      "let's keep it that way",
      'based on actual',
      'comment suggests',
      'I replied with',
      'I said with',
      'shaking my head',
      'with a chuckle',
      'with a laugh',
      'with a smile',
      'with a grin'
    ];
    
    logger.info('✂️ [ResponseShaper] Initialized');
  }
  
  /**
   * ==========================================
   * MAIN SHAPING FUNCTION
   * ==========================================
   */
  
  /**
   * Shape response for platform
   */
  shape(rawResponse, platform, behaviorState = null) {
    let response = rawResponse;
    
    // Step 1: Stop sequence check (reject entire response if found)
    if (this.containsStopSequence(response)) {
      logger.warn('⚠️ [Shaper] Stop sequence detected, rejecting response');
      return null; // Signal to regenerate
    }
    
    // Step 2: Remove wrapping quotation marks
    response = this.removeWrappingQuotes(response);
    
    // Step 3: Remove banned patterns
    response = this.removeBannedPatterns(response);
    
    // Step 4: Clean trailing garbage
    response = this.cleanTrailing(response);
    
    // Step 5: Split multiple sentences into separate messages (CHAT STYLE)
    // Only for chat platforms, not voice
    if (platform !== 'voice') {
      response = this.splitIntoSeparateMessages(response, platform);
    }
    
    // Step 6: Trim to platform length
    response = this.trimToLength(response, platform, behaviorState);
    
    // Step 7: Platform-specific formatting
    response = this.applyPlatformFormatting(response, platform);
    
    // Step 8: Final validation
    if (!this.isValid(response)) {
      logger.warn('⚠️ [Shaper] Invalid response after shaping, rejecting');
      return null;
    }
    
    return response.trim();
  }
  
  /**
   * ==========================================
   * CLEANUP FUNCTIONS
   * ==========================================
   */
  
  /**
   * Remove wrapping quotation marks (AI sometimes adds these)
   */
  removeWrappingQuotes(text) {
    let cleaned = text.trim();
    
    // Remove opening and closing quotes/double-quotes
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
      logger.info('🧹 [Shaper] Removed wrapping quotes');
    }
    
    // Also remove quotes that appear mid-response (like: no no no "text")
    cleaned = cleaned.replace(/\s*["']\s*/g, ' ').trim();
    cleaned = cleaned.replace(/\s{2,}/g, ' '); // Clean up double spaces
    
    return cleaned;
  }
  
  /**
   * Check for stop sequences
   */
  containsStopSequence(text) {
    const lower = text.toLowerCase();
    return this.stopSequences.some(seq => lower.includes(seq));
  }
  
  /**
   * Remove banned patterns
   */
  removeBannedPatterns(text) {
    let cleaned = text;
    
    // Remove each pattern category
    for (const [category, pattern] of Object.entries(this.bannedPatterns)) {
      const before = cleaned;
      cleaned = cleaned.replace(pattern, '');
      
      if (before !== cleaned) {
        logger.debug(`🧹 [Shaper] Removed ${category}`);
      }
    }
    
    // Clean up double spaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    
    return cleaned;
  }
  
  /**
   * Clean trailing garbage
   */
  cleanTrailing(text) {
    let cleaned = text;
    
    // Remove trailing conjunctions
    cleaned = cleaned.replace(this.bannedPatterns.trailingConjunctions, '');
    
    // Remove trailing prepositions
    cleaned = cleaned.replace(this.bannedPatterns.trailingPrepositions, '');
    
    // Remove trailing articles
    cleaned = cleaned.replace(this.bannedPatterns.trailingArticles, '');
    
    // Remove garbage final words
    cleaned = cleaned.replace(this.bannedPatterns.garbageWords, '');
    
    // Remove trailing punctuation orphans
    cleaned = cleaned.replace(/\s+[,;:]$/g, '');
    
    // Clean up spaces before punctuation
    cleaned = cleaned.replace(/\s+([.!?])/g, '$1');
    
    return cleaned;
  }
  
  /**
   * Split response into separate messages (chat-style)
   * Real internet users send short, focused messages - not paragraphs
   * Encourage condensing into single sentences (AI should learn this)
   */
  splitIntoSeparateMessages(text, platform) {
    // Split on sentence boundaries (. ! ?)
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    
    // If only one sentence or no sentence boundaries, return as-is
    if (!sentences || sentences.length <= 1) {
      return text;
    }
    
    // RARE: Allow 2 sentences occasionally (10% chance)
    // This gives variety while still preferring single sentences
    if (sentences.length === 2 && Math.random() < 0.1) {
      logger.info(`✂️ [Shaper] Allowing 2 sentences (rare)`);
      return text;
    }
    
    // For 2-3 sentences: Keep first sentence only
    // The AI should learn to condense ideas into one thought
    if (sentences.length <= 3) {
      const firstSentence = sentences[0].trim();
      logger.info(`✂️ [Shaper] Multi-sentence response - keeping first: "${firstSentence}"`);
      return firstSentence;
    }
    
    // For 4+ sentences: This is rambling, definitely just first sentence
    const firstSentence = sentences[0].trim();
    logger.info(`✂️ [Shaper] Long rambling response - cutting to first sentence`);
    return firstSentence;
  }
  
  /**
   * Trim to platform length
   */
  trimToLength(text, platform, behaviorState = null) {
    const settings = this.platformSettings[platform] || this.platformSettings.coolhole;
    
    let maxWords = settings.maxWords;
    let maxSentences = settings.maxSentences;
    
    // Adjust for behavior state
    if (behaviorState) {
      // Low energy = shorter
      if (behaviorState.energy < 0.5) {
        maxWords = Math.floor(maxWords * 0.7);
      }
      
      // High chaos = potentially longer (rambling)
      if (behaviorState.chaos > 0.7) {
        maxWords = Math.floor(maxWords * 1.3);
      }
      
      // Confused = shorter
      if (behaviorState.confusion > 0.5) {
        maxWords = Math.floor(maxWords * 0.6);
        maxSentences = Math.min(maxSentences, 2);
      }
    }
    
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    // Trim to max sentences
    let trimmed = sentences.slice(0, maxSentences).join(' ');
    
    // Trim to max words
    const words = trimmed.split(/\s+/);
    if (words.length > maxWords) {
      trimmed = words.slice(0, maxWords).join(' ');
      
      // Add punctuation if missing
      if (!/[.!?]$/.test(trimmed)) {
        trimmed += '.';
      }
    }
    
    return trimmed;
  }
  
  /**
   * Apply platform-specific formatting
   */
  applyPlatformFormatting(text, platform) {
    const settings = this.platformSettings[platform] || this.platformSettings.coolhole;
    
    let formatted = text;
    
    // Remove markdown if not allowed
    if (!settings.allowMarkdown) {
      formatted = formatted.replace(/[*_~`]/g, '');
    }
    
    // Remove emoji if not allowed
    if (!settings.allowEmoji) {
      formatted = formatted.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
      formatted = formatted.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Symbols
      formatted = formatted.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport
      formatted = formatted.replace(/[\u{2600}-\u{26FF}]/gu, '');   // Misc symbols
    }
    
    return formatted;
  }
  
  /**
   * Validate final response
   */
  isValid(text) {
    if (!text || text.trim().length === 0) return false;
    
    // Must have at least 2 characters
    if (text.trim().length < 2) return false;
    
    // Must not be only punctuation
    if (/^[^a-zA-Z0-9]+$/.test(text)) return false;
    
    // Must not end with orphaned conjunction/preposition
    if (/\s+(and|but|or|to|at|in|on)\s*$/i.test(text)) return false;
    
    return true;
  }
  
  /**
   * ==========================================
   * PLATFORM DETECTION
   * ==========================================
   */
  
  /**
   * Get recommended response length for platform + state
   */
  getRecommendedLength(platform, behaviorState = null) {
    const settings = this.platformSettings[platform] || this.platformSettings.coolhole;
    
    let words = settings.maxWords;
    let sentences = settings.maxSentences;
    
    if (behaviorState) {
      // Low energy = 50-70% length
      if (behaviorState.energy < 0.5) {
        words = Math.floor(words * 0.6);
        sentences = Math.max(1, Math.floor(sentences * 0.5));
      }
      
      // High chaos = 100-130% length
      if (behaviorState.chaos > 0.7) {
        words = Math.floor(words * 1.15);
      }
      
      // Confused = 40-60% length
      if (behaviorState.confusion > 0.5) {
        words = Math.floor(words * 0.5);
        sentences = Math.min(sentences, 2);
      }
    }
    
    return {
      words,
      sentences,
      characters: words * 6 // Rough estimate
    };
  }
  
  /**
   * Should respond at all? (based on engagement)
   */
  shouldRespond(platform, behaviorState = null) {
    // Voice: always respond (they're talking to you)
    if (platform === 'voice') return true;
    
    // Check behavior state
    if (behaviorState && behaviorState.engagement < 0.3) {
      // Low engagement = only respond 30% of the time
      return Math.random() < 0.3;
    }
    
    return true;
  }
  
  /**
   * ==========================================
   * UTILITY
   * ==========================================
   */
  
  /**
   * Get platform settings
   */
  getSettings(platform) {
    return this.platformSettings[platform] || this.platformSettings.coolhole;
  }
  
  /**
   * Count words
   */
  countWords(text) {
    return text.trim().split(/\s+/).length;
  }
  
  /**
   * Count sentences
   */
  countSentences(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.length;
  }
}

module.exports = ResponseShaper;
