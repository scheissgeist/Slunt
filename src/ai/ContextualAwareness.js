/**
 * Contextual Awareness
 * Detects arguments, conflicts, and chat dynamics
 */

class ContextualAwareness {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.recentExchanges = []; // Track user-to-user interactions
    this.tensionLevels = new Map(); // username -> tension level
    this.argumentDetected = false;
    this.lastArgumentTime = 0;
  }

  /**
   * Analyze interaction between two users
   */
  analyzeExchange(user1, user2, message) {
    this.recentExchanges.push({
      from: user1,
      to: user2,
      message,
      timestamp: Date.now()
    });

    // Keep last 20 exchanges
    if (this.recentExchanges.length > 20) {
      this.recentExchanges.shift();
    }

    // Check for argument indicators
    const isHostile = this.detectHostility(message);
    if (isHostile) {
      this.increaseTension(user1, 0.2);
      this.increaseTension(user2, 0.1);
    }
  }

  /**
   * Detect hostile/argumentative language
   */
  detectHostility(message) {
    const lower = message.toLowerCase();
    
    // Direct insults
    if (lower.match(/\b(shut up|fuck you|stfu|idiot|stupid|dumb|moron|retard)\b/)) {
      return true;
    }
    
    // Aggressive disagreement
    if (lower.match(/\b(wrong|no you|actually|bullshit|nonsense)\b/) && message.includes('!')) {
      return true;
    }
    
    // All caps yelling
    if (message === message.toUpperCase() && message.length > 10 && !message.match(/^(LOL|LMAO|OMG)/)) {
      return true;
    }
    
    return false;
  }

  /**
   * Increase tension for a user
   */
  increaseTension(username, amount) {
    const current = this.tensionLevels.get(username) || 0;
    const newLevel = Math.min(1, current + amount);
    this.tensionLevels.set(username, newLevel);

    // Check if argument is happening
    if (newLevel > 0.5) {
      this.detectArgument();
    }

    // Decay tension over time
    setTimeout(() => {
      const level = this.tensionLevels.get(username) || 0;
      this.tensionLevels.set(username, Math.max(0, level - 0.1));
    }, 60000); // Decay after 1 minute
  }

  /**
   * Detect if an argument is happening
   */
  detectArgument() {
    const highTensionUsers = Array.from(this.tensionLevels.entries())
      .filter(([_, level]) => level > 0.5);

    if (highTensionUsers.length >= 2 && !this.argumentDetected) {
      this.argumentDetected = true;
      this.lastArgumentTime = Date.now();
      console.log(`⚔️ [Context] Argument detected between users!`);
      
      // Clear after 5 minutes
      setTimeout(() => {
        this.argumentDetected = false;
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Should Slunt mediate?
   */
  shouldMediate() {
    if (!this.argumentDetected) return false;
    
    // Only mediate occasionally
    return Math.random() < 0.3;
  }

  /**
   * Get mediation response
   */
  getMediationResponse() {
    const responses = [
      "yall chill lmao",
      "everyone calm down honestly",
      "dude take it easy",
      "not worth fighting over",
      "peace guys",
      "relax damn",
      "yall need to chill honestly",
      "lets all just vibe"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get context for AI prompt
   */
  getContext() {
    if (this.argumentDetected) {
      return '\n[NOTE: Argument happening in chat - be cautious or mediate]';
    }
    return '';
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      argumentActive: this.argumentDetected,
      highTensionUsers: Array.from(this.tensionLevels.entries())
        .filter(([_, level]) => level > 0.4).length,
      recentExchanges: this.recentExchanges.length
    };
  }
}

module.exports = ContextualAwareness;
