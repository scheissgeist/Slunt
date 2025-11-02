/**
 * ResponseScoring - Evaluate response quality BEFORE sending
 * 
 * WHY THIS MATTERS:
 * - AI sometimes generates cringe or repetitive responses
 * - Need to catch and reject bad responses before they go to chat
 * - Score responses on naturalness, relevance, and originality
 * - Prevent Slunt from sounding like a bot
 * 
 * SCORING CRITERIA:
 * - Naturalness: Does it sound human?
 * - Relevance: Does it fit the conversation?
 * - Originality: Is it repetitive or fresh?
 * - Length: Not too short, not too long
 * - Engagement: Will it spark discussion?
 */
class ResponseScoring {
  constructor() {
    // Track recently sent responses to detect repetition
    this.recentResponses = [];
    this.maxRecentResponses = 50;
    
    // Track overused phrases
    this.phraseUsage = new Map(); // phrase -> usage count
    
    // Score thresholds
    this.minimumScore = 6.0; // Out of 10
    
    console.log('📊 [ResponseScoring] Initialized');
  }

  /**
   * Score a response (0-10 scale)
   * Returns: { score, breakdown, shouldSend }
   */
  scoreResponse(response, context = {}) {
    const scores = {
      naturalness: this.scoreNaturalness(response),
      relevance: this.scoreRelevance(response, context),
      originality: this.scoreOriginality(response),
      length: this.scoreLength(response),
      engagement: this.scoreEngagement(response)
    };
    
    // Calculate weighted average
    const totalScore = (
      scores.naturalness * 2.5 +  // Most important
      scores.relevance * 2.0 +
      scores.originality * 2.0 +
      scores.length * 1.5 +
      scores.engagement * 2.0
    ) / 10;
    
    const shouldSend = totalScore >= this.minimumScore;
    
    return {
      score: totalScore,
      breakdown: scores,
      shouldSend,
      issues: this.identifyIssues(response, scores)
    };
  }

  /**
   * Score naturalness (does it sound human?)
   */
  scoreNaturalness(response) {
    let score = 10;
    
    // PENALTIES for robotic patterns
    
    // Corporate speak
    if (/\b(I cannot|I apologize|I understand|I'd be happy to|I'm here to)\b/i.test(response)) {
      score -= 5; // MAJOR penalty
    }
    
    // Too formal
    if (/\b(however|therefore|furthermore|moreover|nevertheless)\b/i.test(response)) {
      score -= 2;
    }
    
    // Excessive punctuation
    if ((response.match(/\?/g) || []).length > 2) {
      score -= 1;
    }
    
    if ((response.match(/!/g) || []).length > 2) {
      score -= 1;
    }
    
    // Overused filler words (multiple in one message)
    const fillers = ['honestly', 'literally', 'basically', 'actually', 'really'];
    const fillerCount = fillers.filter(f => response.toLowerCase().includes(f)).length;
    if (fillerCount > 2) {
      score -= 1;
    }
    
    // Excessive ellipsis
    if ((response.match(/\.\.\./g) || []).length > 1) {
      score -= 1;
    }
    
    // BONUSES for natural patterns
    
    // Has casual contractions
    if (/\b(don't|can't|won't|it's|that's|what's|how's)\b/i.test(response)) {
      score += 0.5;
    }
    
    // Has natural connectors
    if (/\b(yeah|nah|like|kinda|sorta|prolly|maybe)\b/i.test(response)) {
      score += 0.5;
    }
    
    return Math.max(0, Math.min(10, score));
  }

  /**
   * Score relevance to conversation
   */
  scoreRelevance(response, context) {
    let score = 7; // Default neutral
    
    if (!context.recentMessages || context.recentMessages.length === 0) {
      return score;
    }
    
    // Check if response relates to recent topics
    const recentText = context.recentMessages
      .map(m => m.text.toLowerCase())
      .join(' ');
    
    const responseWords = response.toLowerCase().split(/\s+/);
    const contextWords = recentText.split(/\s+/);
    
    // Count word overlap
    const overlap = responseWords.filter(w => 
      w.length > 3 && contextWords.includes(w)
    ).length;
    
    if (overlap > 3) {
      score += 2; // Good topic continuity
    } else if (overlap === 0) {
      score -= 2; // Random topic change
    }
    
    // Check if responding to a question
    const lastMessage = context.recentMessages[context.recentMessages.length - 1];
    if (lastMessage && lastMessage.text.includes('?')) {
      if (!response.match(/\b(yeah|nah|no|yes|maybe|probably|idk|dunno)\b/i)) {
        score -= 1; // Didn't answer the question
      }
    }
    
    return Math.max(0, Math.min(10, score));
  }

  /**
   * Score originality (not repetitive)
   */
  scoreOriginality(response) {
    let score = 10;
    
    // Check against recent responses
    for (const recent of this.recentResponses) {
      const similarity = this.calculateSimilarity(response, recent);
      
      if (similarity > 0.8) {
        score -= 5; // Nearly identical
      } else if (similarity > 0.6) {
        score -= 3; // Very similar
      } else if (similarity > 0.4) {
        score -= 1; // Somewhat similar
      }
    }
    
    // Check for overused phrases
    const phrases = this.extractPhrases(response);
    for (const phrase of phrases) {
      const usageCount = this.phraseUsage.get(phrase) || 0;
      if (usageCount > 5) {
        score -= 1; // This phrase is overused
      }
    }
    
    return Math.max(0, Math.min(10, score));
  }

  /**
   * Score length (not too short, not too long)
   */
  scoreLength(response) {
    const length = response.length;
    
    if (length < 10) return 2; // Too short
    if (length < 20) return 5; // Short
    if (length < 50) return 9; // Good
    if (length < 100) return 10; // Perfect
    if (length < 150) return 9; // Still good
    if (length < 200) return 7; // Getting long
    if (length < 300) return 5; // Too long
    return 3; // Way too long
  }

  /**
   * Score engagement potential
   */
  scoreEngagement(response) {
    let score = 5; // Neutral
    
    // Questions encourage responses
    if (response.includes('?')) {
      score += 2;
    }
    
    // Controversial/spicy takes encourage engagement
    if (/\b(honestly|unpopular opinion|hot take|ngl|idk why but)\b/i.test(response)) {
      score += 1;
    }
    
    // Humor/reactions encourage engagement
    if (/\b(lmao|lol|bruh|wtf|damn|shit)\b/i.test(response)) {
      score += 1;
    }
    
    // Vague statements are boring
    if (/\b(interesting|cool|nice|okay|sure)\b/i.test(response) && response.length < 30) {
      score -= 2;
    }
    
    // One-word responses are low engagement
    if (response.split(/\s+/).length === 1) {
      score -= 3;
    }
    
    return Math.max(0, Math.min(10, score));
  }

  /**
   * Identify specific issues with response
   */
  identifyIssues(response, scores) {
    const issues = [];
    
    if (scores.naturalness < 5) {
      issues.push('Sounds robotic or too formal');
    }
    
    if (scores.relevance < 5) {
      issues.push('Off-topic or random');
    }
    
    if (scores.originality < 5) {
      issues.push('Too similar to recent responses');
    }
    
    if (scores.length < 5) {
      issues.push('Length is awkward (too short or too long)');
    }
    
    if (scores.engagement < 4) {
      issues.push('Low engagement potential');
    }
    
    return issues;
  }

  /**
   * Track sent response
   */
  trackResponse(response) {
    this.recentResponses.push(response);
    
    // Keep only last N responses
    if (this.recentResponses.length > this.maxRecentResponses) {
      this.recentResponses.shift();
    }
    
    // Track phrases
    const phrases = this.extractPhrases(response);
    phrases.forEach(phrase => {
      const count = this.phraseUsage.get(phrase) || 0;
      this.phraseUsage.set(phrase, count + 1);
    });
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  calculateSimilarity(str1, str2) {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(w => words2.includes(w)).length;
    const totalWords = Math.max(words1.length, words2.length);
    
    return commonWords / totalWords;
  }

  /**
   * Extract 2-3 word phrases
   */
  extractPhrases(text) {
    const words = text.toLowerCase().split(/\s+/);
    const phrases = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(words.slice(i, i + 2).join(' '));
      if (i < words.length - 2) {
        phrases.push(words.slice(i, i + 3).join(' '));
      }
    }
    
    return phrases;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      recentResponsesTracked: this.recentResponses.length,
      phrasesTracked: this.phraseUsage.size,
      minimumScore: this.minimumScore
    };
  }

  /**
   * Reset phrase usage (start fresh)
   */
  resetPhraseUsage() {
    this.phraseUsage.clear();
    console.log('📊 [ResponseScoring] Phrase usage reset');
  }
}

module.exports = ResponseScoring;
