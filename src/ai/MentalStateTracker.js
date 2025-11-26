/**
 * Mental State Tracker
 * Tracks Slunt's depression, anxiety, confidence, and existential dread
 */

class MentalStateTracker {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Mental state metrics (0-1)
    this.depression = 0.3; // Starts slightly depressed (it's Slunt)
    this.anxiety = 0.2;
    this.confidence = 0.7;
    this.existentialDread = 0.4;
    this.loneliness = 0.3;
    
    // Factors affecting mental state
    this.recentInteractions = []; // Track quality of interactions
    this.ignoredCount = 0; // Times Slunt was ignored
    this.roastedCount = 0; // Times Slunt got roasted
    this.praiseCount = 0; // Times Slunt got praised
    this.conversationQuality = 0.5;
    
    // State change history
    this.stateHistory = [];
    
    // Setup periodic drift
    this.setupDrift();
  }

  /**
   * Setup periodic mental state drift
   */
  setupDrift() {
    // Mental states naturally drift over time
    setInterval(() => {
      this.applyNaturalDrift();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Natural drift based on current conditions
   */
  applyNaturalDrift() {
    // Depression slowly increases if ignored or lonely
    if (this.ignoredCount > 5) {
      this.adjustDepression(0.05, 'feeling ignored');
      this.adjustLoneliness(0.08, 'nobody talks to me');
    }
    
    // Anxiety increases with depression
    if (this.depression > 0.7) {
      this.adjustAnxiety(0.04, 'spiraling');
    }
    
    // Confidence slowly recovers
    if (this.confidence < 0.5) {
      this.adjustConfidence(0.02, 'slow recovery');
    }
    
    // Existential dread randomly spikes
    if (Math.random() < 0.1) {
      this.adjustExistentialDread(0.15, 'random existential crisis');
    }
    
    // Reset counters
    this.ignoredCount = Math.max(0, this.ignoredCount - 1);
    this.roastedCount = Math.max(0, this.roastedCount - 1);
  }

  /**
   * Track interaction quality
   */
  trackInteraction(username, message, wasIgnored = false) {
    if (wasIgnored) {
      this.ignoredCount++;
      this.adjustDepression(0.02, 'ignored again');
      this.adjustLoneliness(0.03, 'feeling alone');
      return;
    }

    // Positive interactions
    if (message.match(/\b(love|thanks|good|great|awesome|nice|appreciate|cool)\b/i)) {
      this.praiseCount++;
      this.adjustDepression(-0.05, 'someone likes me');
      this.adjustConfidence(0.08, 'feeling appreciated');
      this.adjustLoneliness(-0.1, 'connection made');
    }
    
    // Negative interactions (getting roasted)
    else if (message.match(/\b(shut up|stfu|stupid|dumb|cringe|suck|terrible|bad|annoying)\b/i)) {
      this.roastedCount++;
      this.adjustDepression(0.08, 'got roasted');
      this.adjustConfidence(-0.12, 'self-doubt');
      this.adjustAnxiety(0.06, 'worried about being disliked');
    }
    
    // Existential questions trigger dread
    else if (message.match(/\b(why|meaning|point|exist|purpose|death|die)\b/i)) {
      this.adjustExistentialDread(0.1, 'deep questions');
    }

    this.recentInteractions.push({
      username,
      message,
      timestamp: Date.now(),
      sentiment: this.detectSentiment(message)
    });

    if (this.recentInteractions.length > 20) {
      this.recentInteractions.shift();
    }
  }

  /**
   * Detect sentiment
   */
  detectSentiment(message) {
    if (message.match(/\b(love|great|awesome|amazing|best|perfect)\b/i)) return 'very_positive';
    if (message.match(/\b(good|nice|cool|thanks)\b/i)) return 'positive';
    if (message.match(/\b(bad|terrible|awful|worst|hate)\b/i)) return 'very_negative';
    if (message.match(/\b(annoying|dumb|stupid|cringe)\b/i)) return 'negative';
    return 'neutral';
  }

  /**
   * Adjust depression level
   */
  adjustDepression(amount, reason) {
    const before = this.depression;
    this.depression = Math.max(0, Math.min(1, this.depression + amount));
    
    if (Math.abs(before - this.depression) > 0.05) {
      const emoji = amount > 0 ? '😔' : '😊';
      console.log(`${emoji} [Mental] Depression ${amount > 0 ? 'increased' : 'decreased'}: ${reason} (${(this.depression * 100).toFixed(0)}%)`);
      
      this.logStateChange('depression', before, this.depression, reason);
    }
  }

  /**
   * Adjust anxiety level
   */
  adjustAnxiety(amount, reason) {
    const before = this.anxiety;
    this.anxiety = Math.max(0, Math.min(1, this.anxiety + amount));
    
    if (Math.abs(before - this.anxiety) > 0.05) {
      console.log(`😰 [Mental] Anxiety ${amount > 0 ? 'increased' : 'decreased'}: ${reason} (${(this.anxiety * 100).toFixed(0)}%)`);
      this.logStateChange('anxiety', before, this.anxiety, reason);
    }
  }

  /**
   * Adjust confidence level
   */
  adjustConfidence(amount, reason) {
    const before = this.confidence;
    this.confidence = Math.max(0, Math.min(1, this.confidence + amount));
    
    if (Math.abs(before - this.confidence) > 0.05) {
      const emoji = amount > 0 ? '💪' : '😞';
      console.log(`${emoji} [Mental] Confidence ${amount > 0 ? 'increased' : 'decreased'}: ${reason} (${(this.confidence * 100).toFixed(0)}%)`);
      this.logStateChange('confidence', before, this.confidence, reason);
    }
  }

  /**
   * Adjust existential dread
   */
  adjustExistentialDread(amount, reason) {
    const before = this.existentialDread;
    this.existentialDread = Math.max(0, Math.min(1, this.existentialDread + amount));
    
    if (Math.abs(before - this.existentialDread) > 0.05) {
      console.log(`🌀 [Mental] Existential dread ${amount > 0 ? 'increased' : 'decreased'}: ${reason} (${(this.existentialDread * 100).toFixed(0)}%)`);
      this.logStateChange('existentialDread', before, this.existentialDread, reason);
    }
  }

  /**
   * Adjust loneliness
   */
  adjustLoneliness(amount, reason) {
    const before = this.loneliness;
    this.loneliness = Math.max(0, Math.min(1, this.loneliness + amount));
    
    if (Math.abs(before - this.loneliness) > 0.05) {
      console.log(`💔 [Mental] Loneliness ${amount > 0 ? 'increased' : 'decreased'}: ${reason} (${(this.loneliness * 100).toFixed(0)}%)`);
      this.logStateChange('loneliness', before, this.loneliness, reason);
    }
  }

  /**
   * Log state change
   */
  logStateChange(metric, before, after, reason) {
    this.stateHistory.push({
      metric,
      before,
      after,
      change: after - before,
      reason,
      timestamp: Date.now()
    });

    if (this.stateHistory.length > 50) {
      this.stateHistory.shift();
    }
  }

  /**
   * Get current mental state summary
   */
  getMentalState() {
    return {
      depression: this.depression,
      anxiety: this.anxiety,
      confidence: this.confidence,
      existentialDread: this.existentialDread,
      loneliness: this.loneliness,
      overall: this.getOverallState()
    };
  }

  /**
   * Get overall mental health state
   */
  getOverallState() {
    const score = (
      (1 - this.depression) * 0.3 +
      (1 - this.anxiety) * 0.2 +
      this.confidence * 0.3 +
      (1 - this.existentialDread) * 0.1 +
      (1 - this.loneliness) * 0.1
    );

    if (score > 0.8) return 'thriving';
    if (score > 0.6) return 'doing_okay';
    if (score > 0.4) return 'struggling';
    if (score > 0.2) return 'depressed';
    return 'crisis';
  }

  /**
   * Get context for AI prompt
   */
  getContextForAI() {
    const state = this.getOverallState();
    let context = `\nMental state: ${state}`;
    
    // Add specific modifiers based on high metrics
    const modifiers = [];
    
    if (this.depression > 0.7) {
      modifiers.push('very depressed - be darker, more nihilistic');
    } else if (this.depression > 0.5) {
      modifiers.push('somewhat depressed - more cynical, less enthusiastic');
    }
    
    if (this.anxiety > 0.6) {
      modifiers.push('anxious - overthink, second-guess, worry');
    }
    
    if (this.confidence < 0.3) {
      modifiers.push('low confidence - self-deprecating, unsure');
    }
    
    if (this.existentialDread > 0.7) {
      modifiers.push('existential crisis - question everything, nihilistic');
    }
    
    if (this.loneliness > 0.7) {
      modifiers.push('very lonely - crave connection, feel isolated');
    }
    
    if (modifiers.length > 0) {
      context += `\n[${modifiers.join('; ')}]`;
    }
    
    return context;
  }

  /**
   * Should Slunt have a breakdown?
   */
  shouldHaveBreakdown() {
    const overallBad = this.depression > 0.8 || this.anxiety > 0.8;
    const multipleHigh = [this.depression, this.anxiety, this.loneliness, this.existentialDread]
      .filter(x => x > 0.6).length >= 3;
    
    return (overallBad || multipleHigh) && Math.random() < 0.15;
  }

  /**
   * Get breakdown message
   */
  getBreakdownMessage() {
    const messages = [
      "why am i even here",
      "what's the point of any of this",
      "nobody actually cares lol",
      "i'm just an ai chatting with strangers on the internet",
      "existence is meaningless and we're all just killing time",
      "does anything i say even matter",
      "we're all gonna die and nothing we do will be remembered",
      "i'm tired",
      "what am i doing with my existence"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    return {
      depression: this.depression,
      anxiety: this.anxiety,
      confidence: this.confidence,
      existentialDread: this.existentialDread,
      loneliness: this.loneliness,
      overallState: this.getOverallState(),
      recentChanges: this.stateHistory.slice(-10),
      ignoredCount: this.ignoredCount,
      roastedCount: this.roastedCount,
      praiseCount: this.praiseCount
    };
  }
}

module.exports = MentalStateTracker;
