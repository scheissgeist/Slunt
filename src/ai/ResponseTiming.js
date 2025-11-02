/**
 * ResponseTiming - Smart rate limiting with variable delays
 * 
 * WHY THIS MATTERS:
 * - Don't respond to EVERY message instantly (seems desperate/botty)
 * - Let conversations breathe - humans don't reply instantly
 * - Variable delays make Slunt seem more human
 * - Context-aware timing (fast for questions, slower for commentary)
 * 
 * TIMING STRATEGIES:
 * - Questions: Fast response (1-3 seconds)
 * - Direct mentions: Medium response (2-5 seconds)
 * - General chat: Slower response (5-15 seconds)
 * - After own message: Wait longer (30+ seconds)
 * - Multiple people talking: Let others respond first
 */
class ResponseTiming {
  constructor() {
    // Timing state
    this.lastResponseTime = 0;
    this.lastMessageTime = 0;
    this.consecutiveResponses = 0;
    
    // Activity tracking
    this.recentActivity = []; // [{username, timestamp}]
    this.conversationPace = 'normal'; // slow, normal, fast
    
    // Timing rules - much more responsive
    this.minimumDelayMs = 800; // Faster minimum response
    this.maximumDelayMs = 12000; // Shorter max wait time
    
    // Cooldown after own message - much shorter
    this.ownMessageCooldown = 8000; // Only 8 seconds cooldown
    
    console.log('⏱️ [ResponseTiming] Initialized');
  }

  /**
   * Calculate optimal delay before responding
   * Returns delay in milliseconds
   */
  calculateDelay(messageData, context = {}) {
    const { text, username, timestamp } = messageData;
    
    let baseDelay = 3000; // 3 seconds default
    let multiplier = 1.0;
    
    // === PRIORITY FACTORS (respond faster) ===
    
    // 1. Direct question to Slunt
    if (this.isDirectQuestion(text)) {
      baseDelay = 1500; // 1.5 seconds
      multiplier = 0.8;
    }
    
    // 2. Direct mention of Slunt
    else if (this.isMentioned(text)) {
      baseDelay = 2000; // 2 seconds
      multiplier = 0.9;
    }
    
    // 3. Conversation is fast-paced
    else if (this.conversationPace === 'fast') {
      baseDelay = 2500; // 2.5 seconds
      multiplier = 0.9;
    }
    
    // 4. User just replied to Slunt's message
    else if (this.isReplyToSlunt(timestamp)) {
      baseDelay = 3000; // 3 seconds
      multiplier = 1.0;
    }
    
    // === DELAY FACTORS (respond slower) ===
    
    // 1. Just responded recently
    const timeSinceLastResponse = timestamp - this.lastResponseTime;
    if (timeSinceLastResponse < 15000) { // Within 15 seconds
      multiplier += 1.5; // Wait longer
    }
    
    // 2. Multiple consecutive responses
    if (this.consecutiveResponses >= 2) {
      multiplier += 2.0; // MUCH longer wait
    }
    
    if (this.consecutiveResponses >= 3) {
      multiplier += 3.0; // Even longer
    }
    
    // 3. General chat (not directed at anyone)
    if (!text.includes('?') && !this.isMentioned(text)) {
      baseDelay = 6000; // 6 seconds
      multiplier += 0.5;
    }
    
    // 4. Multiple people are talking (let them finish)
    const recentParticipants = this.getRecentParticipants(timestamp);
    if (recentParticipants.size >= 3) {
      multiplier += 1.2; // Wait longer when many people talking
    }
    
    // 5. Conversation pace modifiers removed - Slunt responds consistently regardless of chat speed!
    
    // === COOLDOWN ENFORCEMENT ===
    
    // After Slunt's own message, enforce cooldown
    const timeSinceOwnMessage = timestamp - this.lastResponseTime;
    if (timeSinceOwnMessage < this.ownMessageCooldown) {
      // Still in cooldown - increase delay significantly
      const cooldownRemaining = this.ownMessageCooldown - timeSinceOwnMessage;
      baseDelay = Math.max(baseDelay, cooldownRemaining / 2);
      multiplier += 1.0;
    }
    
    // === CALCULATE FINAL DELAY ===
    
    let finalDelay = baseDelay * multiplier;
    
    // Add random variation (±20%)
    const variation = 0.8 + (Math.random() * 0.4);
    finalDelay *= variation;
    
    // Clamp to min/max
    finalDelay = Math.max(this.minimumDelayMs, Math.min(this.maximumDelayMs, finalDelay));
    
    return Math.floor(finalDelay);
  }

  /**
   * Should Slunt respond at all? (rate limiting logic)
   * UPDATED: Always respond - no chat speed limiters!
   */
  shouldRespond(messageData, context = {}) {
    const { timestamp } = messageData;
    
    // Always respond to direct questions/mentions
    if (this.isDirectQuestion(messageData.text) || this.isMentioned(messageData.text)) {
      return true;
    }
    
    // Only prevent spamming after MANY consecutive responses
    if (this.consecutiveResponses >= 12) {
      // Only limit after extreme consecutive responses
      return Math.random() < 0.8; // Still 80% chance even after 12 responses
    }
    
    // Check if in cooldown period (but be very lenient)
    const timeSinceOwnMessage = timestamp - this.lastResponseTime;
    
    // If we haven't responded yet (lastResponseTime = 0), always allow
    if (this.lastResponseTime === 0) {
      return true;
    }
    
    // Even in cooldown, still respond almost always
    if (timeSinceOwnMessage < this.ownMessageCooldown / 4) {
      // Very recent response - still 85% chance
      return Math.random() < 0.85;
    }
    
    // ALWAYS RESPOND - Slunt participates in ALL conversations!
    // No chat speed limiters - removed fast/slow conversation distinctions
    return true; // 100% response rate - Slunt always chats!
  }

  /**
   * Track message activity
   */
  trackMessage(username, timestamp) {
    this.recentActivity.push({ username, timestamp });
    
    // Keep only last minute of activity
    const oneMinuteAgo = timestamp - 60000;
    this.recentActivity = this.recentActivity.filter(a => a.timestamp > oneMinuteAgo);
    
    // Update conversation pace
    this.updateConversationPace(timestamp);
    
    this.lastMessageTime = timestamp;
  }

  /**
   * Track Slunt's response
   */
  trackResponse(timestamp) {
    const timeSinceLastResponse = timestamp - this.lastResponseTime;
    
    // Track consecutive responses (within 60 seconds = consecutive)
    if (timeSinceLastResponse < 60000) {
      this.consecutiveResponses++;
    } else {
      this.consecutiveResponses = 1; // Reset
    }
    
    this.lastResponseTime = timestamp;
    
    // Track as activity
    this.trackMessage('Slunt', timestamp);
  }

  /**
   * Update conversation pace (slow/normal/fast)
   */
  updateConversationPace(currentTime) {
    // Count messages in last 60 seconds
    const sixtySecondsAgo = currentTime - 60000;
    const recentCount = this.recentActivity.filter(a => a.timestamp > sixtySecondsAgo).length;
    
    if (recentCount > 15) {
      this.conversationPace = 'fast'; // 15+ messages/minute
    } else if (recentCount > 5) {
      this.conversationPace = 'normal'; // 5-15 messages/minute
    } else {
      this.conversationPace = 'slow'; // < 5 messages/minute
    }
  }

  /**
   * Check if text is a direct question
   */
  isDirectQuestion(text) {
    return text.includes('?') && text.toLowerCase().includes('slunt');
  }

  /**
   * Check if Slunt is mentioned
   */
  isMentioned(text) {
    return /\b(slunt|@slunt)\b/i.test(text);
  }

  /**
   * Check if message is reply to Slunt
   */
  isReplyToSlunt(currentTime) {
    // Check if Slunt spoke in last 30 seconds
    const timeSinceSluntMessage = currentTime - this.lastResponseTime;
    return timeSinceSluntMessage < 30000;
  }

  /**
   * Get unique participants in recent activity
   */
  getRecentParticipants(currentTime) {
    const thirtySecondsAgo = currentTime - 30000;
    const recent = this.recentActivity.filter(a => a.timestamp > thirtySecondsAgo);
    return new Set(recent.map(a => a.username));
  }

  /**
   * Reset consecutive response counter
   */
  resetConsecutiveResponses() {
    this.consecutiveResponses = 0;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      conversationPace: this.conversationPace,
      recentActivityCount: this.recentActivity.length,
      consecutiveResponses: this.consecutiveResponses,
      timeSinceLastResponse: Date.now() - this.lastResponseTime,
      recentParticipants: this.getRecentParticipants(Date.now()).size
    };
  }
}

module.exports = ResponseTiming;
