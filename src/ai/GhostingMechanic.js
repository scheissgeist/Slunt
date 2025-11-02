/**
 * Ghosting Mechanic
 * Slunt subtly ignores boring users or people who annoy him
 * They're being left on read while he talks to everyone else
 */

class GhostingMechanic {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Users currently being ghosted
    this.ghostedUsers = new Map(); // username -> { since, reason, until }
    
    // Boring score tracking
    this.boringScores = new Map(); // username -> score (0-100)
    
    // Track message patterns
    this.messagePatterns = new Map(); // username -> [recent messages]
    
    // Ghosting reasons
    this.ghostReasons = {
      BORING: 'too boring',
      REPETITIVE: 'too repetitive', 
      GENERIC: 'only says generic stuff',
      ANNOYING: 'currently annoying',
      MOOD: 'just not feeling it',
      RANDOM: 'no reason (chaotic)'
    };
    
    // Settings
    this.boringThreshold = 70; // Score above this = eligible for ghosting
    this.ghostDuration = {
      min: 10 * 60 * 1000, // 10 minutes
      max: 60 * 60 * 1000  // 1 hour
    };
    
    // Stats
    this.stats = {
      totalGhostings: 0,
      currentlyGhosted: 0,
      ghostingsByReason: {},
      mostGhosted: new Map()
    };
  }

  /**
   * Track user message for boring detection
   */
  trackMessage(username, message) {
    // Initialize tracking
    if (!this.messagePatterns.has(username)) {
      this.messagePatterns.set(username, []);
    }
    if (!this.boringScores.has(username)) {
      this.boringScores.set(username, 0);
    }
    
    const patterns = this.messagePatterns.get(username);
    const lowerMsg = message.toLowerCase().trim();
    
    // Add to recent messages (keep last 10)
    patterns.push({ text: lowerMsg, time: Date.now() });
    if (patterns.length > 10) {
      patterns.shift();
    }
    
    let boringScore = this.boringScores.get(username);
    
    // BORING FACTORS
    
    // 1. Generic messages (hi, lol, yeah, etc.)
    const genericPhrases = ['lol', 'lmao', 'hi', 'hey', 'yeah', 'ok', 'cool', 'nice', 'haha'];
    if (genericPhrases.includes(lowerMsg) || lowerMsg.length < 5) {
      boringScore += 8;
    }
    
    // 2. Repetitive - saying similar things
    if (patterns.length >= 5) {
      const recent5 = patterns.slice(-5);
      const uniqueMessages = new Set(recent5.map(p => p.text));
      if (uniqueMessages.size <= 2) {
        boringScore += 15; // Very repetitive
        console.log(`😴 [Ghosting] ${username} is being repetitive (+15 boring)`);
      }
    }
    
    // 3. Never asks questions or engages
    const last10 = patterns.slice(-10);
    const hasQuestion = last10.some(p => p.text.includes('?'));
    if (last10.length >= 10 && !hasQuestion) {
      boringScore += 5;
    }
    
    // 4. Only reacts to others, never initiates
    const veryShort = last10.filter(p => p.text.length < 10).length;
    if (veryShort >= 7) {
      boringScore += 10;
    }
    
    // INTERESTING FACTORS (reduce score)
    
    // Long messages = more effort
    if (message.length > 100) {
      boringScore = Math.max(0, boringScore - 5);
    }
    
    // Questions = engagement
    if (message.includes('?')) {
      boringScore = Math.max(0, boringScore - 3);
    }
    
    // Cap at 100
    boringScore = Math.min(100, Math.max(0, boringScore));
    this.boringScores.set(username, boringScore);
    
    // Natural decay (reduce by 2 every minute)
    setTimeout(() => {
      const current = this.boringScores.get(username) || 0;
      this.boringScores.set(username, Math.max(0, current - 2));
    }, 60000);
    
    // Check if should start ghosting
    if (boringScore >= this.boringThreshold && !this.ghostedUsers.has(username)) {
      this.considerGhosting(username, boringScore);
    }
  }

  /**
   * Consider ghosting this user
   */
  considerGhosting(username, boringScore) {
    // Don't ghost too many people at once
    if (this.ghostedUsers.size >= 3) {
      return;
    }
    
    // 30% chance to actually ghost when eligible
    if (Math.random() > 0.3) {
      return;
    }
    
    // Determine reason
    let reason = this.ghostReasons.BORING;
    const patterns = this.messagePatterns.get(username) || [];
    
    if (patterns.length >= 5) {
      const recent = patterns.slice(-5);
      const unique = new Set(recent.map(p => p.text));
      if (unique.size <= 2) {
        reason = this.ghostReasons.REPETITIVE;
      }
    }
    
    const avgLength = patterns.reduce((sum, p) => sum + p.text.length, 0) / patterns.length;
    if (avgLength < 10) {
      reason = this.ghostReasons.GENERIC;
    }
    
    // Check if they're also annoying (high annoyance score from HeresUMode)
    if (this.chatBot.heresUMode) {
      const annoyance = this.chatBot.heresUMode.annoyanceScores.get(username) || 0;
      if (annoyance > 5) {
        reason = this.ghostReasons.ANNOYING;
      }
    }
    
    // Random ghosting for chaos
    if (Math.random() < 0.1) {
      reason = this.ghostReasons.RANDOM;
    }
    
    this.startGhosting(username, reason);
  }

  /**
   * Start ghosting a user
   */
  startGhosting(username, reason) {
    const duration = this.ghostDuration.min + 
      Math.random() * (this.ghostDuration.max - this.ghostDuration.min);
    
    const until = Date.now() + duration;
    
    this.ghostedUsers.set(username, {
      since: Date.now(),
      reason: reason,
      until: until
    });
    
    this.stats.totalGhostings++;
    this.stats.currentlyGhosted = this.ghostedUsers.size;
    this.stats.ghostingsByReason[reason] = (this.stats.ghostingsByReason[reason] || 0) + 1;
    
    const ghostCount = this.stats.mostGhosted.get(username) || 0;
    this.stats.mostGhosted.set(username, ghostCount + 1);
    
    console.log(`👻 [Ghosting] Started ghosting ${username} for ${(duration / 60000).toFixed(1)}min`);
    console.log(`👻 [Ghosting] Reason: ${reason}`);
    console.log(`👻 [Ghosting] Currently ghosting ${this.ghostedUsers.size} users`);
    
    // Auto-unghost when time is up
    setTimeout(() => {
      this.stopGhosting(username);
    }, duration);
  }

  /**
   * Stop ghosting a user
   */
  stopGhosting(username) {
    if (this.ghostedUsers.has(username)) {
      console.log(`👻 [Ghosting] Stopped ghosting ${username}`);
      this.ghostedUsers.delete(username);
      this.stats.currentlyGhosted = this.ghostedUsers.size;
      
      // Reset their boring score
      this.boringScores.set(username, 0);
    }
  }

  /**
   * Check if user is being ghosted
   */
  isGhosted(username) {
    const ghostData = this.ghostedUsers.get(username);
    
    if (!ghostData) {
      return false;
    }
    
    // Check if ghosting period expired
    if (Date.now() >= ghostData.until) {
      this.stopGhosting(username);
      return false;
    }
    
    return true;
  }

  /**
   * Should respond to this user? (for integration with chatBot)
   */
  shouldRespond(username) {
    return !this.isGhosted(username);
  }

  /**
   * Get ghosting info for user
   */
  getGhostInfo(username) {
    const ghostData = this.ghostedUsers.get(username);
    if (!ghostData) return null;
    
    const remaining = ghostData.until - Date.now();
    return {
      isGhosted: true,
      reason: ghostData.reason,
      minutesRemaining: (remaining / 60000).toFixed(1),
      since: ghostData.since
    };
  }

  /**
   * Get context for AI (very subtle hints)
   */
  getContext() {
    if (this.ghostedUsers.size > 0) {
      const ghostedList = Array.from(this.ghostedUsers.keys()).join(', ');
      return `\n👻 Subtly ignoring: ${ghostedList} (don't mention why)`;
    }
    return '';
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalGhostings: this.stats.totalGhostings,
      currentlyGhosted: Array.from(this.ghostedUsers.entries()).map(([user, data]) => ({
        user,
        reason: data.reason,
        minutesLeft: ((data.until - Date.now()) / 60000).toFixed(1)
      })),
      ghostingsByReason: this.stats.ghostingsByReason,
      mostGhosted: Array.from(this.stats.mostGhosted.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([user, count]) => ({ user, count }))
    };
  }
}

module.exports = GhostingMechanic;
