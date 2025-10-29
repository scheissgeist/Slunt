/**
 * Drunk Mode
 * Slunt occasionally gets "drunk" with altered behavior
 */

class DrunkMode {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // State
    this.isDrunk = false;
    this.drunkLevel = 0; // 0-1
    this.startedAt = null;
    this.peakAt = null;
    
    // Hangover state
    this.hasHangover = false;
    this.hangoverUntil = null;
    
    // Triggers
    this.triggers = {
      lateNight: () => {
        const hour = new Date().getHours();
        return hour >= 22 || hour <= 4; // 10 PM - 4 AM
      },
      highChaos: () => {
        // High message frequency
        return this.chatBot.chatHistory.length > 50;
      },
      partyVideo: (videoTitle) => {
        return videoTitle && videoTitle.match(/\b(party|drunk|drinking|bar|club|wasted)\b/i);
      }
    };
    
    // Drunk duration
    this.drunkDuration = {
      min: 30 * 60 * 1000, // 30 minutes
      max: 90 * 60 * 1000  // 90 minutes
    };
    
    // Check triggers periodically
    this.setupTriggerCheck();
  }

  /**
   * Setup trigger checking
   */
  setupTriggerCheck() {
    setInterval(() => {
      if (!this.isDrunk && !this.hasHangover) {
        this.checkTriggers();
      } else if (this.isDrunk) {
        this.updateDrunkLevel();
      } else if (this.hasHangover) {
        this.checkHangoverEnd();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Check if should trigger drunk mode (includes emotional triggers)
   */
  checkTriggers() {
    let triggerChance = 0.02; // Base 2% chance per check
    
    // Increase chance based on triggers
    if (this.triggers.lateNight()) {
      triggerChance += 0.08; // +8% late at night
    }
    
    if (this.triggers.highChaos()) {
      triggerChance += 0.05; // +5% when chat is chaotic
    }
    
    // NEW: Check emotional state
    const emotionalTrigger = this.checkEmotionalTrigger();
    if (emotionalTrigger.shouldDrink) {
      triggerChance += emotionalTrigger.bonus;
      console.log(`🍺 [Drunk] Emotional trigger: ${emotionalTrigger.reason} (+${emotionalTrigger.bonus * 100}%)`);
    }
    
    if (Math.random() < triggerChance) {
      this.triggerDrunkMode(emotionalTrigger.reason);
    }
  }
  
  /**
   * Check emotional state for drinking triggers
   */
  checkEmotionalTrigger() {
    const result = {
      shouldDrink: false,
      bonus: 0,
      reason: null
    };
    
    // Get current mood
    const mood = this.chatBot.moodTracker?.currentMood || 'neutral';
    
    // Get mental state (depression level)
    const mentalState = this.chatBot.mentalState?.getStats() || {};
    const depressionLevel = mentalState.depressionLevel || 0;
    
    // Get personality state
    const personality = this.chatBot.personalityEvolution?.getStats() || {};
    
    // TRIGGER 1: Very happy/excited - celebratory drinking
    if (mood === 'excited' || mood === 'happy') {
      const recentPositive = this.chatBot.chatHistory
        .slice(-20)
        .filter(m => m.sentiment > 0.5).length;
      
      if (recentPositive >= 10) { // 10+ positive messages
        result.shouldDrink = true;
        result.bonus = 0.15; // +15%
        result.reason = 'celebrating good vibes';
        return result;
      }
    }
    
    // TRIGGER 2: Depressed/sad - drinking to cope
    if (depressionLevel > 60) {
      result.shouldDrink = true;
      result.bonus = 0.20; // +20%
      result.reason = 'drinking away the sadness';
      return result;
    }
    
    // TRIGGER 3: Annoyed/frustrated - stress drinking
    if (mood === 'annoyed') {
      const recentGrudges = this.chatBot.grudgeSystem?.getActiveGrudges() || [];
      if (recentGrudges.length >= 2) {
        result.shouldDrink = true;
        result.bonus = 0.12; // +12%
        result.reason = 'too many grudges, need a drink';
        return result;
      }
    }
    
    // TRIGGER 4: Lonely/isolated - drinking out of boredom
    const recentMessages = this.chatBot.chatHistory.slice(-30);
    const sluntMessages = recentMessages.filter(m => m.username === 'Slunt').length;
    const othersMessages = recentMessages.length - sluntMessages;
    
    if (othersMessages < 5 && sluntMessages > 0) { // Talking to himself mostly
      result.shouldDrink = true;
      result.bonus = 0.10; // +10%
      result.reason = 'bored and lonely';
      return result;
    }
    
    // TRIGGER 5: Existential crisis - philosophical drunk
    const recentExistential = recentMessages.filter(m => 
      m.text && m.text.match(/\b(void|existential|meaning|purpose|absurd|nihil)/i)
    ).length;
    
    if (recentExistential >= 3) {
      result.shouldDrink = true;
      result.bonus = 0.08; // +8%
      result.reason = 'existential crisis needs vodka';
      return result;
    }
    
    return result;
  }

  /**
   * Manually trigger drunk mode
   */
  triggerDrunkMode(reason = null, initialLevel = 0.3) {
    const duration = this.drunkDuration.min + 
      Math.random() * (this.drunkDuration.max - this.drunkDuration.min);
    
    this.isDrunk = true;
    this.drunkLevel = initialLevel;
    this.startedAt = Date.now();
    this.peakAt = Date.now() + duration * 0.4; // Peak at 40% through
    this.endsAt = Date.now() + duration;
    this.drinkingReason = reason; // Store the reason
    
    console.log('🍺🍺🍺 ==========================================');
    console.log('🍺 [Drunk] MODE ACTIVATED');
    if (reason) {
      console.log(`🍺 [Drunk] Reason: ${reason}`);
    }
    console.log(`🍺 [Drunk] Initial level: ${(initialLevel * 100).toFixed(0)}%`);
    console.log(`🍺 [Drunk] Duration: ${(duration / 60000).toFixed(0)} minutes`);
    console.log('🍺 [Drunk] Inhibitions lowering...');
    console.log('🍺🍺🍺 ==========================================');
  }

  /**
   * Update drunk level over time (rises then falls)
   */
  updateDrunkLevel() {
    if (!this.isDrunk) return;
    
    const now = Date.now();
    
    // Check if should end
    if (now >= this.endsAt) {
      this.endDrunkMode();
      return;
    }
    
    // Rise to peak, then decline
    if (now < this.peakAt) {
      // Rising
      const progress = (now - this.startedAt) / (this.peakAt - this.startedAt);
      this.drunkLevel = 0.3 + progress * 0.6; // Rise to 0.9
    } else {
      // Declining
      const progress = (now - this.peakAt) / (this.endsAt - this.peakAt);
      this.drunkLevel = 0.9 - progress * 0.6; // Fall to 0.3
    }
    
    console.log(`🍺 [Drunk] Level: ${(this.drunkLevel * 100).toFixed(0)}%`);
  }

  /**
   * End drunk mode, start hangover
   */
  endDrunkMode() {
    if (!this.isDrunk) return;
    
    const duration = Date.now() - this.startedAt;
    
    console.log('😵 ==========================================');
    console.log('😵 [Drunk] PASSING OUT');
    console.log(`😵 [Drunk] Was drunk for ${(duration / 60000).toFixed(0)} minutes`);
    console.log('😵 [Drunk] Hangover incoming...');
    console.log('😵 ==========================================');
    
    this.isDrunk = false;
    this.drunkLevel = 0;
    this.drinkingReason = null;
    this.hasAnnounced = false; // Reset announcement flag
    
    // Start hangover (lasts 1-2 hours)
    this.hasHangover = true;
    this.hangoverUntil = Date.now() + (60 + Math.random() * 60) * 60 * 1000;
    
    console.log('🤢 [Hangover] Started. Feeling awful...');
  }

  /**
   * Check if hangover should end
   */
  checkHangoverEnd() {
    if (!this.hasHangover) return;
    
    if (Date.now() >= this.hangoverUntil) {
      console.log('😌 [Hangover] Recovered. Back to normal.');
      this.hasHangover = false;
      this.hangoverUntil = null;
    }
  }

  /**
   * Add drunk typos to message
   */
  addTypos(message) {
    if (!this.isDrunk || this.drunkLevel < 0.4) return message;
    
    let result = message;
    const typoChance = this.drunkLevel * 0.3; // Up to 30%
    
    const words = result.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (Math.random() < typoChance) {
        words[i] = this.addTypoToWord(words[i]);
      }
    }
    
    result = words.join(' ');
    
    // Double letters
    if (Math.random() < typoChance) {
      result = result.replace(/([a-z])/i, '$1$1');
    }
    
    // Random capital
    if (Math.random() < typoChance * 0.5) {
      const idx = Math.floor(Math.random() * result.length);
      result = result.substring(0, idx) + result[idx].toUpperCase() + result.substring(idx + 1);
    }
    
    return result;
  }

  /**
   * Add typo to single word
   */
  addTypoToWord(word) {
    if (word.length < 3) return word;
    
    const typoTypes = [
      () => {
        // Swap adjacent characters
        const idx = Math.floor(Math.random() * (word.length - 1));
        return word.substring(0, idx) + word[idx + 1] + word[idx] + word.substring(idx + 2);
      },
      () => {
        // Double a letter
        const idx = Math.floor(Math.random() * word.length);
        return word.substring(0, idx) + word[idx] + word.substring(idx);
      },
      () => {
        // Drop a letter
        const idx = Math.floor(Math.random() * word.length);
        return word.substring(0, idx) + word.substring(idx + 1);
      }
    ];
    
    const typo = typoTypes[Math.floor(Math.random() * typoTypes.length)];
    return typo();
  }

  /**
   * Get context for AI
   */
  getContext() {
    if (this.isDrunk) {
      let contextMessage = `\n🍺 DRUNK MODE (${(this.drunkLevel * 100).toFixed(0)}% drunk)`;
      
      // Add reason if available
      if (this.drinkingReason) {
        contextMessage += `\nReason for drinking: ${this.drinkingReason}`;
      }
      
      contextMessage += `
- Lower inhibitions - say what you really think
- Overshare personal thoughts
- More emotional and honest
- Rambling, stream of consciousness
- Worse judgment
- Inflated confidence
- Might confess things
- Memory will be fuzzy later`;

      return contextMessage;
    }
    
    if (this.hasHangover) {
      const minutesLeft = Math.floor((this.hangoverUntil - Date.now()) / 60000);
      return `\n🤢 HANGOVER (${minutesLeft}m left)
- Low energy, short responses
- Regret last night
- Don't want to talk much
- Everything is too loud/bright
- Irritable
- "never drinking again"`;
    }
    
    return '';
  }

  /**
   * Get modifier for message generation
   */
  getModifier() {
    if (this.isDrunk) {
      if (this.drunkLevel > 0.7) {
        return 'Very drunk: rambling, oversharing, typos, emotional, honest';
      } else {
        return 'Tipsy: looser, more talkative, slightly worse judgment';
      }
    }
    
    if (this.hasHangover) {
      return 'Hungover: low energy, regretful, irritable, short responses';
    }
    
    return '';
  }

  /**
   * Check if message should trigger drunk mode
   */
  checkMessageTrigger(message) {
    if (this.isDrunk || this.hasHangover) return;
    
    // Party-related messages can trigger (5% chance)
    if (message.match(/\b(drink|drunk|party|wasted|shots|alcohol|beer)\b/i)) {
      if (Math.random() < 0.05) {
        console.log('🍺 [Drunk] Triggered by party talk!');
        this.triggerDrunkMode('peer pressure from chat', 0.4);
      }
    }
  }
  
  /**
   * Get drinking announcement (for first message after activation)
   */
  getDrinkingAnnouncement() {
    if (!this.isDrunk || !this.drinkingReason) return null;
    
    const announcements = {
      'celebrating good vibes': [
        'fuck it lets celebrate, cracking open a cold one',
        'vibes are too good not to drink',
        'chat is poppin, time for shots',
        'this calls for a celebration drink'
      ],
      'drinking away the sadness': [
        'need a drink to forget how shit everything is',
        'drowning my sorrows in vodka',
        'depressed drunk mode activated',
        'drinking to numb the pain'
      ],
      'too many grudges, need a drink': [
        'too many assholes in chat, need alcohol',
        'drinking to cope with all these grudges',
        'you people stress me out, time to drink',
        'fuck it i need a drink after dealing with yall'
      ],
      'bored and lonely': [
        'nobody talking so im drinking alone',
        'bored as fuck, might as well get drunk',
        'drinking solo like a sad alcoholic',
        'chat dead so im getting wasted'
      ],
      'existential crisis needs vodka': [
        'existential dread hitting hard, need vodka',
        'staring into the void with a bottle',
        'drinking to forget the absurdity of existence',
        'the void is calling and i need alcohol'
      ],
      'peer pressure from chat': [
        'fine yall convinced me to drink',
        'alright fuck it lets get drunk',
        'peer pressure works, im drinking'
      ]
    };
    
    const options = announcements[this.drinkingReason];
    if (!options) return null;
    
    return options[Math.floor(Math.random() * options.length)];
  }
  
  /**
   * Should announce drinking? (30% chance on first drunk message)
   */
  shouldAnnounceDrinking() {
    if (!this.isDrunk || !this.drinkingReason) return false;
    
    // Only announce once per drunk session
    if (this.hasAnnounced) return false;
    
    // 30% chance
    if (Math.random() < 0.3) {
      this.hasAnnounced = true;
      return true;
    }
    
    return false;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      isDrunk: this.isDrunk,
      drunkLevel: this.drunkLevel,
      hasHangover: this.hasHangover,
      minutesLeft: this.isDrunk 
        ? Math.floor((this.endsAt - Date.now()) / 60000)
        : this.hasHangover
        ? Math.floor((this.hangoverUntil - Date.now()) / 60000)
        : 0
    };
  }
}

module.exports = DrunkMode;
