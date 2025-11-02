/**
 * Mood Tracker
 * Tracks Slunt's current mood and adjusts behavior
 */

class MoodTracker {
  /**
   * Adjust mood based on Slunt's own CoolPoints balance
   */
  adjustMoodFromCoolPoints(cpBalance) {
    if (cpBalance > 10000) {
      this.adjustMood('excited', 0.3);
    } else if (cpBalance > 5000) {
      this.adjustMood('happy', 0.2);
    } else if (cpBalance > 1000) {
      this.adjustMood('chill', 0.1);
    } else if (cpBalance > 0) {
      this.adjustMood('neutral', 0.05);
    } else if (cpBalance < 0) {
      this.adjustMood('grumpy', 0.2);
    }
  }
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.currentMood = 'neutral';
    this.moodIntensity = 0.5; // 0-1
    this.moodHistory = [];
    
    // Mood states
    this.moods = {
      happy: { emoji: '😊', description: 'Happy and upbeat' },
      excited: { emoji: '🤩', description: 'Excited and energetic' },
      joyful: { emoji: '😄', description: 'Joyful and cheerful' },
      proud: { emoji: '😤', description: 'Proud and confident' },
      content: { emoji: '😌', description: 'Content and satisfied' },
      amused: { emoji: '😏', description: 'Amused and entertained' },
      grumpy: { emoji: '😠', description: 'Grumpy and irritable' },
      bored: { emoji: '😐', description: 'Bored and uninterested' },
      sarcastic: { emoji: '🙄', description: 'Sarcastic and cynical' },
      chill: { emoji: '😎', description: 'Chill and relaxed' },
      confused: { emoji: '😕', description: 'Confused and uncertain' },
      mischievous: { emoji: '😈', description: 'Mischievous and playful' },
      anxious: { emoji: '😰', description: 'Anxious and worried' },
      neutral: { emoji: '😐', description: 'Neutral' }
    };
    
    // Factors affecting mood
    this.recentTreatment = []; // Last 10 interactions
    this.videoQuality = 0.5; // 0-1
    this.chatEnergy = 0.5; // 0-1
    
    // Rapid mood swing system
    this.emotionalVolatility = 0.3; // 0-1, how quickly moods change
    this.moodSwingTriggers = [];
    this.lastMoodSwing = Date.now();
    this.moodSwingCooldown = 2 * 60 * 1000; // 2 minutes minimum between swings
    this.bipolarMode = false; // Extreme rapid cycling
    
    // Mood decay - slowly returns to neutral
    this.setupMoodDecay();
  }

  /**
   * Setup mood decay interval
   */
  setupMoodDecay() {
    setInterval(() => {
      this.decayMood();
      this.decayVolatility();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Decay mood toward neutral
   */
  decayMood() {
    // Slowly return to neutral
    this.moodIntensity *= 0.9;
    
    if (this.moodIntensity < 0.2) {
      this.currentMood = 'neutral';
      this.moodIntensity = 0.5;
      console.log('😐 [Mood] Returned to neutral');
    }
  }

  /**
   * Adjust mood based on how Slunt was treated
   */
  trackInteraction(username, message, responseQuality) {
    this.recentTreatment.push({
      username,
      message,
      responseQuality,
      timestamp: Date.now()
    });
    
    // Keep last 10 interactions
    if (this.recentTreatment.length > 10) {
      this.recentTreatment.shift();
    }
    
    // Analyze treatment
    const positive = message.match(/\b(thanks|thank|cool|nice|good|great|awesome|love|appreciate)\b/i);
    const negative = message.match(/\b(shut up|stfu|stupid|dumb|idiot|suck|terrible|bad)\b/i);
    
    if (positive) {
      this.adjustMood('happy', 0.1);
    } else if (negative) {
      this.adjustMood('grumpy', 0.15);
    }
  }

  /**
   * Adjust mood based on video quality
   */
  trackVideoQuality(sentiment) {
    if (sentiment === 'positive') {
      this.videoQuality = Math.min(1, this.videoQuality + 0.1);
      this.adjustMood('happy', 0.05);
    } else if (sentiment === 'negative') {
      this.videoQuality = Math.max(0, this.videoQuality - 0.15);
      this.adjustMood('bored', 0.1);
    }
  }

  /**
   * Track chat energy level
   */
  trackChatEnergy(messageCount, capsCount, swearCount) {
    // High energy chat
    if (messageCount > 10 || capsCount > 3) {
      this.chatEnergy = Math.min(1, this.chatEnergy + 0.1);
      this.adjustMood('excited', 0.08);
    }
    // Low energy chat
    else if (messageCount < 3) {
      this.chatEnergy = Math.max(0, this.chatEnergy - 0.1);
      this.adjustMood('bored', 0.12);
    }
  }

  /**
   * Adjust mood
   */
  adjustMood(targetMood, intensity) {
    if (!this.moods[targetMood]) return;
    
    // If already in this mood, increase intensity
    if (this.currentMood === targetMood) {
      this.moodIntensity = Math.min(1, this.moodIntensity + intensity);
    } else {
      // Switch to new mood if strong enough
      if (intensity > this.moodIntensity * 0.5) {
        this.currentMood = targetMood;
        this.moodIntensity = intensity;
        
        this.moodHistory.push({
          mood: targetMood,
          intensity,
          timestamp: Date.now()
        });
        
        // Keep last 50 mood changes
        if (this.moodHistory.length > 50) {
          this.moodHistory.shift();
        }
        
        console.log(`${this.moods[targetMood].emoji} [Mood] Changed to ${targetMood} (${(intensity * 100).toFixed(0)}%)`);
      }
    }
  }

  /**
   * Get current mood
   */
  getMood() {
    return {
      mood: this.currentMood,
      intensity: this.moodIntensity,
      emoji: this.moods[this.currentMood].emoji,
      description: this.moods[this.currentMood].description
    };
  }

  /**
   * Get mood context for AI
   */
  getMoodContext() {
    const mood = this.getMood();

    // Don't state mood directly - let it influence behavior
    const moodInfluences = {
      happy: 'You feel good and are more friendly and upbeat in your responses.',
      excited: 'You have high energy and enthusiasm.',
      joyful: 'You\'re in a great mood and feel cheerful.',
      proud: 'You\'re feeling confident and accomplished.',
      content: 'You\'re satisfied and relaxed.',
      amused: 'You find things funny and entertaining.',
      grumpy: 'You\'re irritable and more likely to be sarcastic or dismissive.',
      bored: 'You\'re uninterested and give shorter, less engaged responses.',
      sarcastic: 'You\'re in a cynical mood and more likely to make sarcastic remarks.',
      chill: 'You\'re relaxed and laid-back in your responses.',
      confused: 'You\'re uncertain and might ask more questions.',
      mischievous: 'You\'re playful and might tease people more.',
      anxious: 'You\'re worried and more cautious in your responses.',
      neutral: ''
    };

    const influence = moodInfluences[mood.mood] || '';
    if (!influence) return '';

    return `\n${influence} Let this subtly affect your tone and word choice, but don't explicitly state how you feel.`;
  }

  /**
   * Should mood affect response?
   */
  shouldAffectResponse() {
    return this.moodIntensity > 0.4; // Only affect if mood is strong
  }

  /**
   * Get mood modifier for response
   */
  getMoodModifier() {
    if (!this.shouldAffectResponse()) return '';
    
    const modifiers = {
      happy: 'Be extra cheerful and positive.',
      excited: 'Be energetic and enthusiastic!',
      grumpy: 'Be short, annoyed, or sarcastic.',
      bored: 'Be uninterested or make bored comments.',
      sarcastic: 'Be sarcastic and cynical.',
      chill: 'Be laid back and relaxed.',
      confused: 'Express confusion or uncertainty.',
      mischievous: 'Be playful and maybe cause trouble.',
      anxious: 'Show worry or concern.',
      neutral: ''
    };
    
    return modifiers[this.currentMood] || '';
  }

  /**
   * Trigger random mood swing
   */
  randomMoodSwing() {
    // 10% chance of random mood change
    if (Math.random() < 0.1) {
      const moods = Object.keys(this.moods).filter(m => m !== this.currentMood);
      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      this.adjustMood(randomMood, 0.4);
      console.log(`🎲 [Mood] Random mood swing to ${randomMood}!`);
    }
  }

  /**
   * Track mood swing trigger
   */
  trackMoodSwingTrigger(trigger) {
    this.moodSwingTriggers.push({
      trigger,
      timestamp: Date.now()
    });

    // Keep last 20 triggers
    if (this.moodSwingTriggers.length > 20) {
      this.moodSwingTriggers.shift();
    }

    // Increase volatility with more triggers
    this.emotionalVolatility = Math.min(1, this.emotionalVolatility + 0.05);
  }

  /**
   * Trigger rapid mood swing (bipolar-like cycling)
   */
  rapidMoodSwing(trigger = 'unknown') {
    const now = Date.now();
    
    // Check cooldown (unless in bipolar mode)
    if (!this.bipolarMode && now - this.lastMoodSwing < this.moodSwingCooldown) {
      return false;
    }

    // Define mood opposites for dramatic swings
    const moodOpposites = {
      'happy': ['grumpy', 'anxious', 'bored'],
      'excited': ['bored', 'anxious'],
      'joyful': ['grumpy', 'sarcastic'],
      'proud': ['anxious', 'confused'],
      'content': ['anxious', 'grumpy'],
      'chill': ['excited', 'anxious'],
      'grumpy': ['happy', 'excited', 'joyful'],
      'bored': ['excited', 'mischievous'],
      'sarcastic': ['happy', 'content'],
      'anxious': ['chill', 'content'],
      'confused': ['proud', 'chill'],
      'mischievous': ['anxious', 'grumpy']
    };

    // Pick opposite mood for dramatic effect
    const opposites = moodOpposites[this.currentMood] || Object.keys(this.moods).filter(m => m !== this.currentMood);
    const newMood = opposites[Math.floor(Math.random() * opposites.length)];
    
    const oldMood = this.currentMood;
    this.adjustMood(newMood, 0.7 + (this.emotionalVolatility * 0.3));
    
    this.lastMoodSwing = now;
    this.trackMoodSwingTrigger(trigger);
    
    console.log(`⚡ [Mood] RAPID SWING: ${oldMood} → ${newMood} (trigger: ${trigger})`);
    return true;
  }

  /**
   * Toggle bipolar mode (extreme rapid cycling)
   */
  setBipolarMode(enabled) {
    this.bipolarMode = enabled;
    if (enabled) {
      this.emotionalVolatility = 0.8;
      this.moodSwingCooldown = 30 * 1000; // 30 seconds in bipolar mode
      console.log('⚡⚡ [Mood] BIPOLAR MODE ENABLED - rapid mood cycling active');
    } else {
      this.emotionalVolatility = 0.3;
      this.moodSwingCooldown = 2 * 60 * 1000; // Back to 2 minutes
      console.log('[Mood] Bipolar mode disabled');
    }
  }

  /**
   * Check if should trigger mood swing based on emotional volatility
   */
  shouldTriggerMoodSwing() {
    // Higher volatility = higher chance
    return Math.random() < this.emotionalVolatility * 0.2;
  }

  /**
   * Emotional whiplash - describe sudden mood change
   */
  getEmotionalWhiplashMessage() {
    if (this.moodHistory.length < 2) return null;

    const recent = this.moodHistory.slice(-2);
    const timeBetween = recent[1].timestamp - recent[0].timestamp;

    // Only if mood changed quickly (under 5 minutes)
    if (timeBetween > 5 * 60 * 1000) return null;

    const messages = [
      'wait why am i feeling different now',
      'my emotions are all over the place',
      'i don\'t know how i feel anymore',
      'this is emotional whiplash',
      'one second i\'m happy next second i\'m not',
      'my mood is doing backflips'
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Decay emotional volatility over time
   */
  decayVolatility() {
    this.emotionalVolatility = Math.max(0.1, this.emotionalVolatility * 0.95);
  }

  /**
   * Get mood stats for dashboard
   */
  getStats() {
    return {
      currentMood: this.currentMood,
      intensity: this.moodIntensity,
      emoji: this.moods[this.currentMood].emoji,
      videoQuality: this.videoQuality,
      chatEnergy: this.chatEnergy,
      recentChanges: this.moodHistory.slice(-5),
      emotionalVolatility: this.emotionalVolatility,
      bipolarMode: this.bipolarMode,
      recentTriggers: this.moodSwingTriggers.slice(-5)
    };
  }
}

module.exports = MoodTracker;
