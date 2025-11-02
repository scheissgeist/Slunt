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
    const sentences = message.split(/([.!?])\s+/);
    if (sentences.length > 2) {
      return this.groupSentences(sentences);
    }
    
    // 2. Split on clause boundaries (conjunctions with commas)
    if (message.includes(', but ') || message.includes(', and ')) {
      const parts = message.split(/, (but|and) /i);
      if (parts.length > 1) {
        // Reconstruct with conjunctions
        const result = [parts[0]];
        for (let i = 1; i < parts.length; i += 2) {
          if (i + 1 < parts.length) {
            result.push(parts[i] + ' ' + parts[i + 1]);
          }
        }
        return result.map(p => p.trim()).filter(p => p.length > 0);
      }
    }
    
    // 3. Split on em-dashes or hyphens
    if (message.includes(' - ')) {
      const parts = message.split(' - ');
      if (parts.length > 1 && parts.every(p => p.length > 15)) {
        return parts.map(p => p.trim());
      }
    }
    
    // 4. Split on commas if long enough
    if (message.length > 100 && message.includes(', ')) {
      const parts = message.split(', ');
      if (parts.length > 1 && parts.every(p => p.length > 20)) {
        // Reconstruct with commas except last one
        const result = [];
        for (let i = 0; i < parts.length - 1; i++) {
          result.push(parts[i] + ',');
        }
        result.push(parts[parts.length - 1]);
        return result.map(p => p.trim());
      }
    }
    
    // 5. Last resort: split at word boundary near middle
    if (message.length > 120) {
      const middle = Math.floor(message.length / 2);
      const spaceAfter = message.indexOf(' ', middle);
      const spaceBefore = message.lastIndexOf(' ', middle);
      
      const splitPoint = spaceAfter !== -1 && (spaceAfter - middle) < (middle - spaceBefore) 
        ? spaceAfter 
        : spaceBefore;
      
      if (splitPoint !== -1) {
        return [
          message.substring(0, splitPoint).trim(),
          message.substring(splitPoint + 1).trim()
        ];
      }
    }
    
    // Can't split naturally - return as single message
    return [message];
  }
  
  /**
   * Group sentences into natural message parts
   */
  groupSentences(sentenceParts) {
    const messages = [];
    let currentMessage = '';
    
    for (let i = 0; i < sentenceParts.length; i++) {
      const part = sentenceParts[i];
      
      // Skip empty parts
      if (!part || !part.trim()) continue;
      
      // If this is punctuation, add it to current message
      if (part.match(/^[.!?]$/)) {
        currentMessage += part;
        continue;
      }
      
      // If adding this would make message too long, start new message
      if (currentMessage.length > 0 && (currentMessage + part).length > 100) {
        messages.push(currentMessage.trim());
        currentMessage = part;
      } else {
        // Add space if not first part
        if (currentMessage.length > 0 && !currentMessage.endsWith(' ')) {
          currentMessage += ' ';
        }
        currentMessage += part;
      }
    }
    
    // Add remaining message
    if (currentMessage.trim().length > 0) {
      messages.push(currentMessage.trim());
    }
    
    return messages.length > 0 ? messages : [sentenceParts.join(' ')];
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
