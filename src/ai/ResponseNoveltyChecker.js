/**
 * Response Novelty Checker
 * Detects when Slunt is repeating himself too much from his 893+ memories
 * Rejects overly similar responses and forces generation of alternatives
 */

class ResponseNoveltyChecker {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Track recent responses for comparison
    this.recentResponses = []; // Store last 50 responses
    this.maxRecentResponses = 50;
    
    // Similarity thresholds
    this.exactMatchThreshold = 0.95; // 95% similar = too repetitive
    this.highSimilarityThreshold = 0.80; // 80% similar = concerning
    this.phraseSimilarityThreshold = 0.70; // 70% similar phrases = repetitive
    
    // Stats
    this.totalChecked = 0;
    this.totalRejected = 0;
    this.rejectionReasons = {};
  }
  
  /**
   * Check if response is too similar to recent responses
   */
  checkNovelty(response, context = {}) {
    this.totalChecked++;
    
    if (!response || response.length < 5) {
      return { novel: true, reason: 'too_short_to_check' };
    }
    
    // Normalize response for comparison
    const normalized = this.normalizeText(response);
    
    // Extract key phrases (2-4 word sequences)
    const phrases = this.extractPhrases(normalized);
    
    // Check against recent responses
    for (const recent of this.recentResponses) {
      const recentNormalized = this.normalizeText(recent.text);
      
      // 1. Exact match check
      if (normalized === recentNormalized) {
        return this.reject('exact_match', response, recent);
      }
      
      // 2. High similarity check (using Jaccard similarity)
      const similarity = this.calculateSimilarity(normalized, recentNormalized);
      if (similarity > this.exactMatchThreshold) {
        return this.reject('near_exact_match', response, recent, similarity);
      }
      
      // 3. Phrase overlap check
      const recentPhrases = this.extractPhrases(recentNormalized);
      const phraseOverlap = this.calculatePhraseOverlap(phrases, recentPhrases);
      if (phraseOverlap > this.phraseSimilarityThreshold) {
        return this.reject('phrase_repetition', response, recent, phraseOverlap);
      }
    }
    
    // Check against long-term memory if available
    if (this.chatBot.longTermMemory && this.chatBot.longTermMemory.memories) {
      const memoryCheck = this.checkAgainstMemories(normalized, phrases);
      if (!memoryCheck.novel) {
        return memoryCheck;
      }
    }
    
    // Novel enough - record it
    this.recordResponse(response, context);
    
    return { novel: true, reason: 'passes_all_checks' };
  }
  
  /**
   * Record rejection
   */
  reject(reason, response, similar, score = null) {
    this.totalRejected++;
    this.rejectionReasons[reason] = (this.rejectionReasons[reason] || 0) + 1;
    
    let message = `🔁 [Novelty] REJECTED (${reason})`;
    if (score) {
      message += ` - ${(score * 100).toFixed(0)}% similar`;
    }
    message += `\n  New: "${response.substring(0, 60)}..."`;
    message += `\n  Old: "${similar.text.substring(0, 60)}..." (${this.getTimeSince(similar.timestamp)})`;
    
    console.log(message);
    
    return { 
      novel: false, 
      reason,
      similarity: score,
      similar: similar.text,
      suggestion: 'Try rephrasing or approaching from different angle'
    };
  }
  
  /**
   * Normalize text for comparison
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  /**
   * Extract meaningful phrases (2-4 words)
   */
  extractPhrases(text) {
    const words = text.split(' ').filter(w => w.length > 2); // Ignore very short words
    const phrases = new Set();
    
    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      phrases.add(`${words[i]} ${words[i + 1]}`);
    }
    
    // Extract 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
      phrases.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
    
    return Array.from(phrases);
  }
  
  /**
   * Calculate Jaccard similarity between two texts
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Calculate phrase overlap ratio
   */
  calculatePhraseOverlap(phrases1, phrases2) {
    if (phrases1.length === 0 || phrases2.length === 0) return 0;
    
    const set1 = new Set(phrases1);
    const set2 = new Set(phrases2);
    const overlap = [...set1].filter(p => set2.has(p)).length;
    
    return overlap / Math.min(phrases1.length, phrases2.length);
  }
  
  /**
   * Check against long-term memories
   */
  checkAgainstMemories(normalized, phrases) {
    if (!this.chatBot.longTermMemory?.memories) {
      return { novel: true };
    }
    
    // Sample recent memories (check last 100 to avoid performance hit)
    const recentMemories = this.chatBot.longTermMemory.memories
      .filter(m => m.type === 'interaction' || m.type === 'conversation')
      .slice(-100);
    
    for (const memory of recentMemories) {
      if (!memory.content) continue;
      
      const memoryNormalized = this.normalizeText(memory.content);
      const similarity = this.calculateSimilarity(normalized, memoryNormalized);
      
      if (similarity > this.highSimilarityThreshold) {
        return this.reject('memory_repetition', normalized, {
          text: memory.content,
          timestamp: memory.timestamp || Date.now() - 86400000 // Assume 1 day ago if no timestamp
        }, similarity);
      }
    }
    
    return { novel: true };
  }
  
  /**
   * Record response for future comparison
   */
  recordResponse(response, context = {}) {
    this.recentResponses.push({
      text: response,
      timestamp: Date.now(),
      context: context
    });
    
    // Keep only recent responses
    if (this.recentResponses.length > this.maxRecentResponses) {
      this.recentResponses.shift();
    }
  }
  
  /**
   * Get time since timestamp
   */
  getTimeSince(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const rejectionRate = this.totalChecked > 0
      ? ((this.totalRejected / this.totalChecked) * 100).toFixed(1)
      : 0;
    
    return {
      totalChecked: this.totalChecked,
      totalRejected: this.totalRejected,
      rejectionRate: rejectionRate + '%',
      rejectionReasons: this.rejectionReasons,
      recentResponsesTracked: this.recentResponses.length
    };
  }
  
  /**
   * Clear recent responses (useful after long inactivity)
   */
  clear() {
    const count = this.recentResponses.length;
    this.recentResponses = [];
    console.log(`🔁 [Novelty] Cleared ${count} recent responses`);
  }
}

module.exports = ResponseNoveltyChecker;
