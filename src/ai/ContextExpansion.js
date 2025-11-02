/**
 * Context Window Expansion System
 * Increases conversation context from 5 to 10 messages with smart filtering
 */

class ContextExpansion {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.expandedWindowSize = 10; // Up from 5
    this.maxTokens = 2000; // Approximate token limit for context
  }

  /**
   * Get expanded context with smart filtering
   */
  getExpandedContext(platform, channel, currentUsername) {
    if (!this.chatBot.conversationContext) {
      return [];
    }

    // Filter to relevant messages
    let relevantMessages = this.chatBot.conversationContext
      .filter(m => {
        // Same platform
        if (m.platform !== platform) return false;
        
        // Same channel for Discord/Twitch
        if ((platform === 'discord' || platform === 'twitch') && channel) {
          if (m.channel !== channel) return false;
        }
        
        return true;
      });

    // Get last N messages
    const recentMessages = relevantMessages.slice(-this.expandedWindowSize);

    // Smart filtering - keep most relevant
    const filtered = this.filterByRelevance(recentMessages, currentUsername);

    return filtered;
  }

  /**
   * Filter messages by relevance
   */
  filterByRelevance(messages, currentUsername) {
    // Score each message
    const scored = messages.map((msg, index) => {
      let score = 0;
      
      // Recency (more recent = higher score)
      score += index * 2;
      
      // Messages from current user
      if (msg.sender === currentUsername) {
        score += 10;
      }
      
      // Messages mentioning Slunt
      if (msg.text.toLowerCase().includes('slunt') || 
          msg.text.toLowerCase().includes(this.chatBot.botUsername?.toLowerCase())) {
        score += 8;
      }
      
      // Questions (important context)
      if (msg.text.includes('?')) {
        score += 5;
      }
      
      // Longer messages (more substance)
      if (msg.text.length > 50) {
        score += 3;
      }
      
      // Messages from Slunt (his own responses matter)
      if (msg.sender === 'slunt' || msg.sender === this.chatBot.botUsername) {
        score += 4;
      }
      
      return { ...msg, score };
    });

    // Sort by score and take top messages
    scored.sort((a, b) => b.score - a.score);
    
    // Keep at least the last 5, fill rest with high-scoring
    const guaranteed = scored.slice(-5);
    const additional = scored.slice(0, -5).slice(0, 5);
    
    // Combine and re-sort by original order
    const selected = [...guaranteed, ...additional];
    selected.sort((a, b) => messages.indexOf(a) - messages.indexOf(b));
    
    return selected;
  }

  /**
   * Format context for prompt with token awareness
   */
  formatContext(messages) {
    let formatted = 'Recent conversation in THIS channel:\n';
    let estimatedTokens = 0;
    const selectedMessages = [];

    // Work backwards - most recent first
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const msgText = `${msg.sender}: ${msg.text}\n`;
      const msgTokens = this.estimateTokens(msgText);
      
      // Check if adding this would exceed limit
      if (estimatedTokens + msgTokens > this.maxTokens) {
        console.log(`⚠️ [Context] Token limit reached, stopping at ${selectedMessages.length} messages`);
        break;
      }
      
      selectedMessages.unshift(msg);
      estimatedTokens += msgTokens;
    }

    // Format selected messages
    for (const msg of selectedMessages) {
      formatted += `${msg.sender}: ${msg.text}\n`;
    }

    formatted += `\n[Important: Respond to THIS conversation, not random topics. Read the recent messages above and continue that discussion naturally.]`;

    console.log(`📜 [Context] Loaded ${selectedMessages.length} messages (~${estimatedTokens} tokens)`);
    return formatted;
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text) {
    // Rough estimate: 1 token per 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Get context summary stats
   */
  getContextStats(messages) {
    const userMessages = messages.filter(m => m.sender !== 'slunt');
    const sluntMessages = messages.filter(m => m.sender === 'slunt');
    const questions = messages.filter(m => m.text.includes('?'));
    
    return {
      total: messages.length,
      users: userMessages.length,
      slunt: sluntMessages.length,
      questions: questions.length,
      avgLength: messages.reduce((sum, m) => sum + m.text.length, 0) / messages.length
    };
  }

  /**
   * Detect context breaks (topic changes)
   */
  detectTopicChange(messages) {
    if (messages.length < 3) return false;
    
    // Simple heuristic: if last 2 messages are very different from previous 3
    const recent = messages.slice(-2);
    const previous = messages.slice(-5, -2);
    
    // Extract key words
    const recentWords = this.extractKeywords(recent.map(m => m.text).join(' '));
    const previousWords = this.extractKeywords(previous.map(m => m.text).join(' '));
    
    // Check overlap
    const overlap = recentWords.filter(w => previousWords.includes(w));
    const overlapRatio = overlap.length / Math.max(recentWords.length, 1);
    
    // Low overlap = topic change
    return overlapRatio < 0.2;
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3) // Skip short words
      .filter(w => !['that', 'this', 'what', 'with', 'from', 'have', 'been'].includes(w)); // Skip common words
    
    // Return unique words
    return [...new Set(words)];
  }

  /**
   * Get stats
   */
  getStats() {
    const context = this.getExpandedContext('discord', null, null);
    const stats = this.getContextStats(context);
    
    return {
      windowSize: this.expandedWindowSize,
      maxTokens: this.maxTokens,
      currentMessages: context.length,
      ...stats
    };
  }
}

module.exports = ContextExpansion;
