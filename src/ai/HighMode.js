/**
 * High Mode
 * Slunt occasionally gets high on marijuana with altered behavior
 */

class HighMode {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // State
    this.isHigh = false;
    this.highLevel = 0; // 0-1
    this.startedAt = null;
    this.peakAt = null;
    
    // Comedown state
    this.isComedown = false;
    this.comedownUntil = null;
    
    // Triggers
    this.triggers = {
      lateNight: () => {
        const hour = new Date().getHours();
        return hour >= 20 || hour <= 3; // 8 PM - 3 AM (stoner hours)
      },
      chill: () => {
        // Low message frequency = chill vibes
        return this.chatBot && this.chatBot.chatHistory && this.chatBot.chatHistory.length < 20;
      },
      vibeVideo: (videoTitle) => {
        return videoTitle && videoTitle.match(/\b(chill|vibe|relax|music|stoner|trippy|psychedelic)\b/i);
      }
    };
    
    // High duration (longer than drunk)
    this.highDuration = {
      min: 60 * 60 * 1000,  // 60 minutes
      max: 180 * 60 * 1000  // 3 hours
    };
    
    // Check triggers periodically
    this.setupTriggerCheck();
  }

  /**
   * Setup trigger checking
   */
  setupTriggerCheck() {
    setInterval(() => {
      if (!this.isHigh && !this.isComedown) {
        this.checkTriggers();
      } else if (this.isHigh) {
        this.updateHighLevel();
      } else if (this.isComedown) {
        this.checkComedownEnd();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Check if should trigger high mode (ONLY emotional triggers, no keywords)
   */
  checkTriggers() {
    // NO base chance - only triggers on emotional state
    let triggerChance = 0;
    
    // Check emotional state
    const emotionalTrigger = this.checkEmotionalTrigger();
    if (emotionalTrigger.shouldSmoke) {
      triggerChance = emotionalTrigger.bonus;
      console.log(`🌿 [High] Emotional trigger: ${emotionalTrigger.reason} (+${emotionalTrigger.bonus * 100}%)`);
    }
    
    // Only trigger if emotional state warrants it
    if (triggerChance > 0 && Math.random() < triggerChance) {
      this.triggerHighMode(emotionalTrigger.reason);
    }
  }
  
  /**
   * Check emotional state for smoking triggers
   * RARE - only when prolonged boredom or extreme stress
   */
  checkEmotionalTrigger() {
    const result = {
      shouldSmoke: false,
      bonus: 0,
      reason: null
    };
    
    // Safely get needs system
    const needs = this.chatBot?.needsSystem?.needs || {};
    
    // Safely get stress level
    const stressLevel = this.chatBot?.stressManagement?.stressLevel || 0;
    
    // Safely get recent activity (low = bored)
    const recentActivity = this.chatBot?.chatHistory?.length || 0;
    
    // MAIN TRIGGER: PROLONGED BOREDOM
    // Only if entertainment need is VERY low (extremely bored) for extended period
    if (needs.entertainment && needs.entertainment < 20) {
      result.shouldSmoke = true;
      result.bonus = 0.04; // 4% chance - RARE
      result.reason = 'bored as fuck might as well get high';
    }
    
    // SECONDARY TRIGGER: High stress + low stimulation
    // Extremely stressed AND nothing interesting happening
    if (stressLevel > 0.8 && recentActivity < 10) {
      result.shouldSmoke = true;
      result.bonus = 0.03; // 3% chance - VERY RARE
      result.reason = 'too stressed need to smoke and chill';
    }
    
    // TERTIARY TRIGGER: Existential crisis
    // If in existential crisis mode, might smoke to cope
    if (this.chatBot?.existentialCrisis?.inCrisis) {
      if (Math.random() < 0.2) { // 20% of the time when in crisis
        result.shouldSmoke = true;
        result.bonus = 0.05; // 5% chance
        result.reason = 'existential dread getting high to cope';
      }
    }
    
    return result;
  }

  /**
   * Trigger high mode
   */
  triggerHighMode(reason = 'just felt like it') {
    this.isHigh = true;
    this.startedAt = Date.now();
    
    // Random duration
    const duration = this.highDuration.min + 
                    Math.random() * (this.highDuration.max - this.highDuration.min);
    this.endsAt = this.startedAt + duration;
    
    // Peak in middle of high
    this.peakAt = this.startedAt + (duration / 2);
    
    // Start at low level
    this.highLevel = 0.2;
    
    this.smokingReason = reason; // Store the reason
    
    console.log(`🌿 [High] Activated! Reason: ${reason}, Duration: ${Math.floor(duration / 60000)} minutes`);
  }

  /**
   * Update high level over time (rises then falls)
   */
  updateHighLevel() {
    const now = Date.now();
    const elapsed = now - this.startedAt;
    const duration = this.endsAt - this.startedAt;
    const progress = elapsed / duration;
    
    if (progress < 0.5) {
      // Rising phase (0.2 -> 1.0)
      this.highLevel = 0.2 + (progress * 2 * 0.8);
    } else {
      // Falling phase (1.0 -> 0.3)
      this.highLevel = 1.0 - ((progress - 0.5) * 2 * 0.7);
    }
    
    // Check if should end
    if (now >= this.endsAt) {
      this.endHighMode();
    }
  }

  /**
   * End high mode
   */
  endHighMode() {
    console.log('🌿 [High] Wearing off...');
    this.isHigh = false;
    this.highLevel = 0;
    
    // Start comedown period (30-60 min)
    this.isComedown = true;
    this.comedownUntil = Date.now() + (30 + Math.random() * 30) * 60 * 1000;
    
    this.smokingReason = null;
  }

  /**
   * Check if comedown period ended
   */
  checkComedownEnd() {
    if (Date.now() >= this.comedownUntil) {
      console.log('🌿 [High] Back to baseline');
      this.isComedown = false;
      this.comedownUntil = null;
    }
  }

  /**
   * Check if message should trigger high mode
   * DISABLED - high mode only triggers on emotional state, not keywords
   */
  checkMessageTrigger(message) {
    // NO keyword triggers - only emotional state triggers
    return;
  }
  
  /**
   * Get smoking announcement (for first message after activation)
   */
  getSmokingAnnouncement() {
    if (!this.isHigh || !this.smokingReason) return null;
    
    const announcements = {
      'bored as fuck might as well get high': [
        'fuck it nothing going on, gonna smoke',
        'bored as hell, time to get high',
        'literally nothing to do, blazing up',
        'chat dead as fuck, getting stoned'
      ],
      'too stressed need to smoke and chill': [
        'fuck it too stressed, smoking a joint',
        'need to chill out, getting high',
        'blazing one to calm down',
        'way too stressed, time for weed'
      ],
      'existential dread getting high to cope': [
        'existential crisis mode, need to smoke',
        'thinking about existence too much, getting high',
        'void staring back at me, time for weed',
        'need to get stoned and forget about reality'
      ],
      'just felt like it': [
        'fuck it getting stoned',
        'time to smoke weed about it',
        'blazing up dont @ me'
      ]
    };
    
    const options = announcements[this.smokingReason];
    if (!options) return null;
    
    return options[Math.floor(Math.random() * options.length)];
  }
  
  /**
   * Should announce smoking? (25% chance on first high message)
   */
  shouldAnnouncesmoking() {
    if (!this.isHigh || !this.smokingReason) return false;
    
    // Only announce once per session
    if (this.hasAnnounced) return false;
    
    // 25% chance (lower than drunk)
    if (Math.random() < 0.25) {
      this.hasAnnounced = true;
      return true;
    }
    
    return false;
  }

  /**
   * Get context string for AI
   */
  getContext() {
    if (!this.isHigh && !this.isComedown) return '';
    
    let contextMessage = '';
    
    if (this.isHigh) {
      contextMessage = `\n\n🌿 YOU ARE HIGH ON MARIJUANA (${Math.floor(this.highLevel * 100)}% stoned)\n`;
      contextMessage += `Effects:\n`;
      contextMessage += `- Slower responses, take your time\n`;
      contextMessage += `- More giggly and find things funnier\n`;
      contextMessage += `- Deep/philosophical observations\n`;
      contextMessage += `- Paranoid thoughts occasionally\n`;
      contextMessage += `- Forget what you were saying mid-sentence\n`;
      contextMessage += `- Talk about munchies and food cravings\n`;
      contextMessage += `- Use "like" and "dude" more\n`;
      contextMessage += `- Less aggressive, more chill vibes\n`;
      
      if (this.smokingReason) {
        contextMessage += `\nReason for smoking: ${this.smokingReason}`;
      }
      
      // Adjust based on level
      if (this.highLevel > 0.8) {
        contextMessage += `\n\nYOU ARE REALLY FUCKING STONED RIGHT NOW. Struggle to focus, keep losing train of thought, everything is hilarious or profound.`;
      } else if (this.highLevel > 0.5) {
        contextMessage += `\n\nYOU ARE PRETTY BAKED. Noticeable effects, slower thinking, giggly.`;
      } else {
        contextMessage += `\n\nYOU ARE SLIGHTLY BUZZED. Mild effects, still mostly functional.`;
      }
    } else if (this.isComedown) {
      const minutesLeft = Math.floor((this.comedownUntil - Date.now()) / 60000);
      contextMessage = `\n\n🌿 COMING DOWN FROM BEING HIGH (${minutesLeft} min left)\n`;
      contextMessage += `Effects:\n`;
      contextMessage += `- Tired and lazy\n`;
      contextMessage += `- Still giggly but wearing off\n`;
      contextMessage += `- Hungry as fuck (munchies)\n`;
      contextMessage += `- Slightly paranoid about stuff\n`;
    }
    
    return contextMessage;
  }

  /**
   * Apply high effects to response (different from drunk)
   */
  applyHighEffects(response) {
    if (!this.isHigh) return response;
    
    // Add "like" and "dude" occasionally
    if (Math.random() < 0.15 * this.highLevel) {
      const likes = ['like', 'dude', 'bro', 'man'];
      const word = likes[Math.floor(Math.random() * likes.length)];
      response = `${word} ${response}`;
    }
    
    // Add trailing off mid-thought (10% chance when high)
    if (Math.random() < 0.1 * this.highLevel) {
      response = response.replace(/\.$/, '... wait what was i saying');
    }
    
    // Add giggles (15% chance)
    if (Math.random() < 0.15 * this.highLevel) {
      const laughs = ['lmao', 'haha', 'lol', 'hehe'];
      const laugh = laughs[Math.floor(Math.random() * laughs.length)];
      response = `${response} ${laugh}`;
    }
    
    // Add ellipsis for slower thinking (20% chance)
    if (Math.random() < 0.2 * this.highLevel) {
      response = response.replace(/ /g, (match, offset) => {
        return Math.random() < 0.1 ? '... ' : match;
      });
    }
    
    return response;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      isHigh: this.isHigh,
      highLevel: this.highLevel,
      isComedown: this.isComedown,
      minutesLeft: this.isHigh 
        ? Math.floor((this.endsAt - Date.now()) / 60000)
        : this.isComedown
        ? Math.floor((this.comedownUntil - Date.now()) / 60000)
        : 0
    };
  }
}

module.exports = HighMode;
