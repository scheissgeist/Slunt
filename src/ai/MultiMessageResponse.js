/**
 * Multi-Message Response System
 * 
 * Splits long responses into multiple messages for more natural conversation flow.
 * Real people don't type everything in one perfect message - they send thoughts in bursts.
 */

class MultiMessageResponse {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Configuration
    this.config = {
      minLengthToSplit: 80,        // Only split if message is 80+ chars
      maxLengthToSplit: 200,       // Always split if 200+ chars
      splitChance: 0.3,            // 30% chance to split medium messages
      maxParts: 3                  // Never split into more than 3 messages
    };
    
    // Stats
    this.stats = {
      totalSplits: 0,
      averageParts: 0
    };
  }
  
  /**
   * Determine if message should be split
   */
  shouldSplit(message) {
    if (!message || typeof message !== 'string') return false;
    
    const length = message.trim().length;
    
    // Too short to split
    if (length < this.config.minLengthToSplit) {
      return false;
    }
    
    // Always split very long messages
    if (length > this.config.maxLengthToSplit) {
      return true;
    }
    
    // Medium length - random chance based on personality
    // More likely to split if excited/manic
    const mood = this.chatBot.moodTracker?.getMood();
    let splitChance = this.config.splitChance;
    
    if (mood === 'excited' || mood === 'energetic') {
      splitChance += 0.2; // 50% chance when excited
    }
    
    // More likely to split if message has natural breaks
    const hasBreaks = message.includes(' - ') || 
                      message.includes(', ') ||
                      message.includes(' but ') ||
                      message.includes(' and ');
    
    if (hasBreaks) {
      splitChance += 0.15; // More likely with natural breaks
    }
    
    return Math.random() < splitChance;
  }
  
  /**
   * Split message into natural parts
   */
  async splitMessage(message) {
    const trimmed = message.trim();
    
    // Try to split at natural breaks
    const parts = this.intelligentSplit(trimmed);
    
    // Limit to max parts
    if (parts.length > this.config.maxParts) {
      // Combine excess parts into the last message
      const excess = parts.slice(this.config.maxParts - 1).join(' ');
      parts.splice(this.config.maxParts - 1, parts.length, excess);
    }
    
    // Track stats
    this.stats.totalSplits++;
    this.stats.averageParts = 
      ((this.stats.averageParts * (this.stats.totalSplits - 1)) + parts.length) / 
      this.stats.totalSplits;
    
    return parts;
  }
  
  /**
   * Intelligently split message at natural breaks
   */
  intelligentSplit(message) {
    // Strategy: Look for natural breaking points in order of preference
    
    // 1. Split on sentence boundaries (. ! ?)
    const sentences = message.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 1) {
      return this.groupSentencesNaturally(sentences);
    }
    
    // 2. Split on clause boundaries (conjunctions with commas)
    if (message.includes(', but ') || message.includes(', and ')) {
      const parts = message.split(/, (but|and) /i);
      if (parts.length > 1) {
        // Reconstruct with conjunctions - ensure complete thoughts
        const result = [];
        let currentPart = parts[0];
        
        for (let i = 1; i < parts.length; i += 2) {
          if (i + 1 < parts.length) {
            const nextPart = parts[i] + ' ' + parts[i + 1];
            // Only split if both parts are substantial (20+ chars)
            if (currentPart.length >= 20 && nextPart.length >= 20) {
              result.push(currentPart.trim());
              currentPart = nextPart;
            } else {
              currentPart += ', ' + nextPart;
            }
          }
        }
        if (currentPart.trim()) result.push(currentPart.trim());
        
        // Only return split if we got substantial parts
        if (result.length > 1 && result.every(p => p.length >= 20)) {
          return result;
        }
      }
    }
    
    // 3. Split on em-dashes or hyphens
    if (message.includes(' - ')) {
      const parts = message.split(' - ');
      if (parts.length > 1 && parts.every(p => p.length > 25)) {
        return parts.map(p => p.trim());
      }
    }
    
    // 4. Don't split on commas - they create incomplete thoughts
    
    // 5. Last resort: Only split very long messages (150+ chars)
    if (message.length > 150) {
      // Find sentence boundary near middle
      const middle = Math.floor(message.length / 2);
      const sentenceEnd = message.substring(middle).search(/[.!?]\s+/);
      
      if (sentenceEnd !== -1) {
        const splitPoint = middle + sentenceEnd + 1;
        return [
          message.substring(0, splitPoint).trim(),
          message.substring(splitPoint).trim()
        ];
      }
      
      // No sentence boundary - don't split (better to send long message than incomplete)
    }
    
    // Can't split naturally - return as single message
    return [message];
  }
  
  /**
   * Group sentences into natural message parts
   * Ensures each part is a complete thought (no fragments)
   */
  groupSentencesNaturally(sentences) {
    const messages = [];
    let currentMessage = '';
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      
      // If adding this sentence keeps us under 100 chars, add it
      if ((currentMessage + ' ' + trimmed).length <= 100) {
        currentMessage += (currentMessage ? ' ' : '') + trimmed;
      } else {
        // Start new message, but only if current message is substantial
        if (currentMessage.length >= 20) {
          messages.push(currentMessage.trim());
          currentMessage = trimmed;
        } else {
          // Current message too short - combine
          currentMessage += ' ' + trimmed;
        }
      }
    }
    
    // Add remaining message
    if (currentMessage.trim().length > 0) {
      messages.push(currentMessage.trim());
    }
    
    // Only return split if we have multiple substantial parts
    if (messages.length > 1 && messages.every(m => m.length >= 20)) {
      return messages;
    }
    
    // Otherwise return as single message
    return [sentences.join(' ')];
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      totalSplits: this.stats.totalSplits,
      averageParts: this.stats.averageParts.toFixed(2)
    };
  }
}

module.exports = MultiMessageResponse;
