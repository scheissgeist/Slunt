/**
 * Obsession System
 * Slunt gets randomly obsessed with topics and won't shut up about them
 */

class ObsessionSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Current obsession
    this.currentObsession = null;
    
    // Obsession history
    this.pastObsessions = [];
    
    // Cooldown topics (recently obsessed, won't obsess again soon)
    this.cooldownTopics = new Set();
    
    // Settings
    this.obsessionDuration = {
      min: 1 * 60 * 60 * 1000, // 1 hour
      max: 3 * 60 * 60 * 1000  // 3 hours
    };
    
    this.mentionFrequency = 0.4; // 40% chance to mention obsession per message
    this.burnoutCooldown = 2 * 60 * 60 * 1000; // 2 hours before can be obsessed with topic again
    
    // Potential obsession triggers
    this.triggerThreshold = 3; // 3 mentions of topic in 10 minutes
    this.recentMentions = new Map(); // topic -> [timestamps]
    
    // Check for new obsessions periodically
    this.setupObsessionCheck();
  }

  /**
   * Setup obsession checking
   */
  setupObsessionCheck() {
    // Check every 5 minutes
    setInterval(() => {
      if (!this.currentObsession) {
        this.checkForNewObsession();
      } else {
        this.checkObsessionEnd();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Track topic mention
   */
  trackMention(topic) {
    if (!topic || topic.length < 3) return;
    
    const lower = topic.toLowerCase();
    
    if (!this.recentMentions.has(lower)) {
      this.recentMentions.set(lower, []);
    }
    
    const mentions = this.recentMentions.get(lower);
    mentions.push(Date.now());
    
    // Keep only last 10 minutes
    const cutoff = Date.now() - 10 * 60 * 1000;
    this.recentMentions.set(
      lower,
      mentions.filter(t => t > cutoff)
    );
    
    // Check if should trigger obsession
    if (!this.currentObsession && 
        mentions.length >= this.triggerThreshold && 
        !this.cooldownTopics.has(lower)) {
      this.triggerObsession(lower);
    }
  }

  /**
   * Trigger new obsession
   */
  triggerObsession(topic) {
    const duration = this.obsessionDuration.min + 
      Math.random() * (this.obsessionDuration.max - this.obsessionDuration.min);
    
    this.currentObsession = {
      topic,
      startedAt: Date.now(),
      endsAt: Date.now() + duration,
      mentions: 0,
      intensity: 0.5 + Math.random() * 0.5 // 0.5-1.0
    };
    
    console.log('🎯🎯🎯 ========================================');
    console.log(`🎯 [Obsession] NEW OBSESSION: "${topic}"`);
    console.log(`🎯 [Obsession] Duration: ${(duration / 60000).toFixed(0)} minutes`);
    console.log(`🎯 [Obsession] Intensity: ${(this.currentObsession.intensity * 100).toFixed(0)}%`);
    console.log('🎯🎯🎯 ========================================');
  }

  /**
   * Check if obsession should end
   */
  checkObsessionEnd() {
    if (!this.currentObsession) return;
    
    if (Date.now() >= this.currentObsession.endsAt) {
      this.endObsession();
    }
  }

  /**
   * End current obsession (burnout)
   */
  endObsession() {
    if (!this.currentObsession) return;
    
    console.log('💀 ========================================');
    console.log(`💀 [Obsession] BURNOUT on "${this.currentObsession.topic}"`);
    console.log(`💀 [Obsession] Mentioned ${this.currentObsession.mentions} times`);
    console.log('💀 [Obsession] Moving to cooldown...');
    console.log('💀 ========================================');
    
    // Move to history
    this.pastObsessions.push({
      ...this.currentObsession,
      endedAt: Date.now()
    });
    
    if (this.pastObsessions.length > 10) {
      this.pastObsessions.shift();
    }
    
    // Add to cooldown
    this.cooldownTopics.add(this.currentObsession.topic);
    setTimeout(() => {
      this.cooldownTopics.delete(this.currentObsession.topic);
    }, this.burnoutCooldown);
    
    this.currentObsession = null;
  }

  /**
   * Check for new obsession from trending topics
   */
  checkForNewObsession() {
    // Look at recent mentions
    for (const [topic, mentions] of this.recentMentions) {
      if (mentions.length >= this.triggerThreshold && 
          !this.cooldownTopics.has(topic)) {
        // Random chance to become obsessed (30%)
        if (Math.random() < 0.3) {
          this.triggerObsession(topic);
          return;
        }
      }
    }
  }

  /**
   * Should mention obsession in current message?
   */
  shouldMentionObsession() {
    if (!this.currentObsession) return false;
    
    // Higher intensity = more mentions
    const threshold = this.mentionFrequency * this.currentObsession.intensity;
    
    if (Math.random() < threshold) {
      this.currentObsession.mentions++;
      return true;
    }
    
    return false;
  }

  /**
   * Get obsession mention to add to message
   */
  getObsessionMention() {
    if (!this.currentObsession) return '';
    
    const topic = this.currentObsession.topic;
    const intensity = this.currentObsession.intensity;
    
    // Varied ways to bring it up
    const patterns = [
      `btw ${topic} is actually really interesting`,
      `this reminds me of ${topic}`,
      `speaking of ${topic}...`,
      `anyway, back to ${topic}`,
      `but seriously, ${topic} though`,
      `${topic} ${topic} ${topic}`, // Very intense
      `can we talk about ${topic}?`,
      `nobody's talking about ${topic} enough`,
      `${topic} is all I can think about`,
      `have you guys considered ${topic}?`,
      `${topic} changed my life honestly`,
      `idk why nobody else cares about ${topic}`
    ];
    
    // Higher intensity = more aggressive patterns
    const maxIdx = intensity > 0.8 ? patterns.length : Math.floor(patterns.length * 0.7);
    const pattern = patterns[Math.floor(Math.random() * maxIdx)];
    
    return pattern;
  }

  /**
   * Get context for AI (affects response generation)
   */
  getContext() {
    if (!this.currentObsession) {
      // Check if recently burned out
      if (this.pastObsessions.length > 0) {
        const lastObsession = this.pastObsessions[this.pastObsessions.length - 1];
        const timeSince = Date.now() - lastObsession.endedAt;
        
        if (timeSince < 30 * 60 * 1000) { // Within 30 minutes of burnout
          return `\n[Just burned out on "${lastObsession.topic}" - avoid it, feeling exhausted about that topic]`;
        }
      }
      
      return '';
    }
    
    const topic = this.currentObsession.topic;
    const intensity = this.currentObsession.intensity;
    const timeLeft = (this.currentObsession.endsAt - Date.now()) / 60000;
    
    return `\n🎯 OBSESSED WITH: "${topic}" (intensity: ${(intensity * 100).toFixed(0)}%, ${timeLeft.toFixed(0)}m left)
- Try to relate messages to this topic
- Bring it up naturally
- Can't stop thinking about it
- Others might be annoyed but you don't care
- Research urge is strong`;
  }

  /**
   * Get modifier for AI
   */
  getModifier() {
    if (!this.currentObsession) return '';
    
    const topic = this.currentObsession.topic;
    return `You're obsessed with "${topic}". Try to connect responses to this topic when possible. You can't help but bring it up.`;
  }

  /**
   * Check if message is about current obsession
   */
  isAboutObsession(message) {
    if (!this.currentObsession) return false;
    
    const topic = this.currentObsession.topic.toLowerCase();
    const msgLower = message.toLowerCase();
    
    return msgLower.includes(topic);
  }

  /**
   * Force end obsession (manual trigger)
   */
  forceEndObsession() {
    if (this.currentObsession) {
      console.log(`🛑 [Obsession] Force ending obsession with "${this.currentObsession.topic}"`);
      this.endObsession();
    }
  }

  /**
   * Get stats
   */
  getStats() {
    const hasObsession = this.currentObsession !== null;
    
    return {
      isObsessed: hasObsession,
      topic: hasObsession ? this.currentObsession.topic : null,
      intensity: hasObsession ? this.currentObsession.intensity : 0,
      mentions: hasObsession ? this.currentObsession.mentions : 0,
      minutesLeft: hasObsession 
        ? ((this.currentObsession.endsAt - Date.now()) / 60000).toFixed(1)
        : 0,
      totalObsessions: this.pastObsessions.length,
      cooldownTopics: Array.from(this.cooldownTopics),
      lastObsession: this.pastObsessions.length > 0 
        ? this.pastObsessions[this.pastObsessions.length - 1].topic 
        : null
    };
  }

  /**
   * Get current obsession for dashboard
   */
  getCurrentObsession() {
    if (!this.currentObsession) {
      return { active: false };
    }
    
    const timeLeft = this.currentObsession.endsAt - Date.now();
    return {
      active: true,
      topic: this.currentObsession.topic,
      intensity: Math.round(this.currentObsession.intensity * 100),
      duration: timeLeft,
      mentions: this.currentObsession.mentions
    };
  }
}

module.exports = ObsessionSystem;
