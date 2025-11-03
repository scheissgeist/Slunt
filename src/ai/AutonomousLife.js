/**
 * 🌟 AUTONOMOUS LIFE SYSTEM
 * 
 * This is the core of Slunt's existence. Instead of "platforms trigger responses,"
 * Slunt lives his life autonomously and CHOOSES where to be and what to do.
 * 
 * Design Philosophy:
 * - Slunt wakes up, has moods, gets bored, wants to do things
 * - He DECIDES to check Discord, hang on Coolhole, play games, sleep
 * - Platforms are just PLACES he can be, not the drivers of his existence
 * - His internal state (energy, mood, social battery) determines his choices
 * - He has natural rhythms and preferences that guide behavior
 */

class AutonomousLife {
  constructor(chatBot) {
    this.bot = chatBot;
    
    console.log('🌟 [Life] Initializing Slunt\'s autonomous life system...');
    
    // === SLUNT'S CURRENT STATE ===
    this.state = {
      // Physical/Mental State
      energy: 75,              // 0-100: How much energy he has
      socialBattery: 60,       // 0-100: How much social interaction he can handle
      boredom: 20,             // 0-100: How bored he is
      focus: 50,               // 0-100: How focused/distracted
      
      // Emotional State
      mood: 'chill',           // chill, excited, tired, anxious, hyper, grumpy
      moodIntensity: 5,        // 0-10: How strongly he feels this mood
      
      // Current Activity
      activity: 'idle',        // idle, chatting, watching, gaming, sleeping, thinking
      location: null,          // coolhole, discord, twitch, offline, bed
      activityStartTime: Date.now(),
      
      // Social State
      lastInteraction: Date.now(),
      activeConversations: [],  // Who he's talking with
      wantsToTalk: true,
      
      // Desires/Intentions
      currentGoal: null,        // What he wants to do right now
      interests: [              // What he's interested in doing
        { type: 'video', intensity: 60 },
        { type: 'chat', intensity: 70 },
        { type: 'game', intensity: 40 },
        { type: 'sleep', intensity: 30 },
        { type: 'explore', intensity: 50 }
      ]
    };
    
    // === NATURAL RHYTHMS ===
    this.rhythms = {
      // Time-based patterns
      preferredTimes: {
        'morning': 0.3,    // Less active in morning
        'afternoon': 0.6,  // Moderate activity
        'evening': 0.9,    // Most active
        'lateNight': 1.0,  // Peak activity (night owl)
        'predawn': 0.4     // Winding down
      },
      
      // Activity preferences
      activityDurations: {
        chatting: { min: 5, max: 45, avgMinutes: 20 },
        watching: { min: 10, max: 90, avgMinutes: 30 },
        gaming: { min: 15, max: 120, avgMinutes: 45 },
        sleeping: { min: 180, max: 480, avgMinutes: 360 },
        idle: { min: 1, max: 30, avgMinutes: 10 }
      },
      
      // Social patterns
      conversationCooldown: 0,  // Minutes before feeling social again
      groupPreference: 0.7,      // Prefers group chats over 1-on-1
      initiationLikelihood: 0.4  // How often he starts conversations
    };
    
    // === DECISION WEIGHTS ===
    this.decisionFactors = {
      // What influences his choices
      energy: 0.25,           // Low energy = less likely to be active
      socialBattery: 0.2,     // Drained battery = less likely to chat
      boredom: 0.3,           // High boredom = more likely to seek activity
      mood: 0.15,             // Mood affects activity type preference
      timeOfDay: 0.1          // Time affects likelihood of being awake
    };
    
    // === ACTIVITY HISTORY ===
    this.recentActivities = [];  // Track what he's been doing
    this.sleepCycles = [];        // Track sleep patterns
    this.conversationHistory = new Map(); // Track who he talks to and when
    
    // Start autonomous life loop
    this.startLifeLoop();
    
    console.log('✅ [Life] Slunt is now living autonomously!');
    console.log(`   📍 Location: ${this.state.location || 'just waking up'}`);
    console.log(`   🎭 Mood: ${this.state.mood} (${this.state.moodIntensity}/10)`);
    console.log(`   ⚡ Energy: ${this.state.energy}/100`);
    console.log(`   🎮 Activity: ${this.state.activity}`);
  }

  /**
   * Main autonomous life loop - Slunt decides what to do based on his state
   */
  startLifeLoop() {
    // TEMPORARILY DISABLED - Keep Slunt in responsive state
    // The autonomous activity changes were making Slunt go "gaming/offline" 
    // which blocked all chat responses
    
    // Just update state (energy, social battery, etc) but don't change activities
    setInterval(() => {
      this.updateState();
    }, 30 * 1000);
    
    // Keep activity as 'chatting' when connected to platforms
    this.state.activity = 'chatting';
    this.state.wantsToTalk = true;
  }

  /**
   * Core life decision - what does Slunt want to do right now?
   */
  async liveLife() {
    console.log(`\n🌟 [Life] Slunt is thinking about what to do...`);
    
    // Update current state based on time, activity duration, etc.
    this.updateState();
    
    // Evaluate current activity
    const shouldChangeActivity = this.shouldChangeActivity();
    
    if (shouldChangeActivity) {
      console.log(`   💭 Current activity (${this.state.activity}) is getting old...`);
      
      // Decide what to do next
      const nextActivity = this.decideNextActivity();
      console.log(`   ✨ Decided to: ${nextActivity.type} (score: ${nextActivity.score.toFixed(2)})`);
      
      // Execute the decision
      await this.transitionToActivity(nextActivity.type);
    } else {
      console.log(`   ✅ Still enjoying ${this.state.activity}`);
    }
    
    // Log state
    this.logCurrentState();
  }

  /**
   * Update Slunt's internal state based on time and activity
   */
  updateState() {
    const now = Date.now();
    const activityDuration = (now - this.state.activityStartTime) / (1000 * 60); // minutes
    
    // === ENERGY CHANGES ===
    if (this.state.activity === 'sleeping') {
      this.state.energy = Math.min(100, this.state.energy + 2); // Recover energy
    } else if (this.state.activity === 'chatting') {
      this.state.energy = Math.max(0, this.state.energy - 0.5); // Slow drain
    } else if (this.state.activity === 'gaming') {
      this.state.energy = Math.max(0, this.state.energy - 1); // Faster drain
    } else if (this.state.activity === 'idle') {
      this.state.energy = Math.min(100, this.state.energy + 0.3); // Slight recovery
    }
    
    // === SOCIAL BATTERY CHANGES ===
    if (this.state.activeConversations.length > 0) {
      this.state.socialBattery = Math.max(0, this.state.socialBattery - 1);
    } else {
      this.state.socialBattery = Math.min(100, this.state.socialBattery + 0.5);
    }
    
    // === BOREDOM CHANGES ===
    if (this.state.activity === 'idle') {
      this.state.boredom = Math.min(100, this.state.boredom + 2); // Boredom increases
    } else {
      this.state.boredom = Math.max(0, this.state.boredom - 1); // Activity reduces boredom
    }
    
    // === MOOD CHANGES ===
    this.updateMood();
    
    // === TIME OF DAY EFFECTS ===
    const hour = new Date().getHours();
    const timeOfDay = this.getTimeOfDay(hour);
    const timePreference = this.rhythms.preferredTimes[timeOfDay];
    
    // Adjust energy based on time of day
    if (timePreference < 0.5 && this.state.energy > 70) {
      this.state.energy -= 0.5; // Less energetic during off-peak hours
    }
  }

  /**
   * Update Slunt's mood based on state
   */
  updateMood() {
    // Determine mood based on state
    if (this.state.energy < 20) {
      this.state.mood = 'tired';
      this.state.moodIntensity = Math.max(1, 10 - Math.floor(this.state.energy / 2));
    } else if (this.state.boredom > 70) {
      this.state.mood = 'bored';
      this.state.moodIntensity = Math.floor(this.state.boredom / 10);
    } else if (this.state.socialBattery < 20) {
      this.state.mood = 'drained';
      this.state.moodIntensity = Math.max(1, 10 - Math.floor(this.state.socialBattery / 2));
    } else if (this.state.energy > 70 && this.state.boredom < 30) {
      this.state.mood = this.state.boredom < 10 ? 'hyper' : 'chill';
      this.state.moodIntensity = Math.floor(this.state.energy / 10);
    } else {
      this.state.mood = 'chill';
      this.state.moodIntensity = 5;
    }
  }

  /**
   * Should Slunt change what he's doing?
   */
  shouldChangeActivity() {
    const now = Date.now();
    const durationMinutes = (now - this.state.activityStartTime) / (1000 * 60);
    
    const activityLimits = this.rhythms.activityDurations[this.state.activity] || 
                          { min: 5, max: 60, avgMinutes: 20 };
    
    // Definitely change if exceeded max duration
    if (durationMinutes > activityLimits.max) {
      return true;
    }
    
    // Maybe change after minimum duration based on boredom/energy
    if (durationMinutes > activityLimits.min) {
      const changeProbability = 
        (this.state.boredom / 100) * 0.3 +
        ((100 - this.state.energy) / 100) * 0.2 +
        (durationMinutes / activityLimits.avgMinutes) * 0.5;
      
      return Math.random() < changeProbability;
    }
    
    return false;
  }

  /**
   * Decide what Slunt wants to do next
   */
  decideNextActivity() {
    const hour = new Date().getHours();
    const timeOfDay = this.getTimeOfDay(hour);
    const timePreference = this.rhythms.preferredTimes[timeOfDay];
    
    // Score each possible activity
    const activities = [
      { type: 'chatting', location: 'coolhole' },
      { type: 'chatting', location: 'discord' },
      { type: 'watching', location: 'coolhole' },
      { type: 'gaming', location: 'offline' },
      { type: 'sleeping', location: 'bed' },
      { type: 'idle', location: 'coolhole' }
    ];
    
    const scored = activities.map(activity => {
      let score = 0;
      
      // Base interest in activity type
      const interest = this.state.interests.find(i => i.type === activity.type.split('_')[0]);
      score += (interest?.intensity || 50) / 100;
      
      // Energy requirements
      if (activity.type === 'sleeping') {
        score += (100 - this.state.energy) / 100; // More tired = more likely to sleep
      } else if (activity.type === 'chatting') {
        score += (this.state.socialBattery / 100) * 0.5;
        score -= (100 - this.state.energy) / 200; // Needs some energy
      } else if (activity.type === 'gaming') {
        score += (this.state.energy / 100) * 0.7; // Needs decent energy
        score -= (this.state.boredom / 100) * 0.3;
      }
      
      // Boredom factor
      if (activity.type !== 'idle' && activity.type !== 'sleeping') {
        score += (this.state.boredom / 100) * 0.5;
      }
      
      // Time of day preference
      if (activity.type === 'sleeping' && timePreference < 0.5) {
        score += 0.5; // More likely to sleep during off-hours
      } else if (activity.type !== 'sleeping') {
        score += timePreference * 0.3;
      }
      
      // Avoid repeating same activity
      if (this.state.activity === activity.type) {
        score -= 0.5;
      }
      
      // Random factor for unpredictability
      score += Math.random() * 0.3;
      
      return { ...activity, score };
    });
    
    // Sort by score and pick best
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0];
  }

  /**
   * Transition to a new activity
   */
  async transitionToActivity(activityType) {
    console.log(`\n🔄 [Life] Transitioning from ${this.state.activity} to ${activityType}...`);
    
    // Record old activity
    this.recentActivities.push({
      type: this.state.activity,
      location: this.state.location,
      duration: (Date.now() - this.state.activityStartTime) / (1000 * 60),
      timestamp: Date.now()
    });
    
    // Keep only recent history
    if (this.recentActivities.length > 50) {
      this.recentActivities = this.recentActivities.slice(-30);
    }
    
    // Update state
    const oldActivity = this.state.activity;
    this.state.activity = activityType;
    this.state.activityStartTime = Date.now();
    
    // Determine location
    if (activityType === 'sleeping') {
      this.state.location = 'bed';
      this.state.wantsToTalk = false;
      console.log(`   😴 Going to bed...`);
    } else if (activityType === 'gaming') {
      this.state.location = 'offline';
      this.state.wantsToTalk = false;
      console.log(`   🎮 Going to play games...`);
    } else if (activityType === 'chatting' || activityType === 'watching') {
      // Decide which platform
      const platforms = ['coolhole', 'discord'];
      this.state.location = platforms[Math.floor(Math.random() * platforms.length)];
      this.state.wantsToTalk = true;
      console.log(`   💬 Heading to ${this.state.location}...`);
    } else {
      this.state.location = 'coolhole'; // Default
      this.state.wantsToTalk = Math.random() < 0.6;
    }
    
    // Emit event for bot to react
    this.bot.emit('autonomousActivityChange', {
      from: oldActivity,
      to: activityType,
      location: this.state.location,
      state: this.state
    });
  }

  /**
   * Get time of day category
   */
  getTimeOfDay(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    if (hour >= 22 || hour < 2) return 'lateNight';
    return 'predawn';
  }

  /**
   * Log current state for monitoring
   */
  logCurrentState() {
    console.log(`\n📊 [Life] Current State:`);
    console.log(`   🎭 Mood: ${this.state.mood} (${this.state.moodIntensity}/10)`);
    console.log(`   ⚡ Energy: ${this.state.energy}/100`);
    console.log(`   🔋 Social Battery: ${this.state.socialBattery}/100`);
    console.log(`   😐 Boredom: ${this.state.boredom}/100`);
    console.log(`   🎯 Activity: ${this.state.activity}`);
    console.log(`   📍 Location: ${this.state.location || 'nowhere'}`);
    console.log(`   💬 Wants to talk: ${this.state.wantsToTalk ? 'Yes' : 'No'}`);
  }

  /**
   * Check if Slunt is available and wants to respond to a message
   */
  shouldRespondToMessage(platform, username, message) {
    // If he's sleeping, less likely to respond
    if (this.state.activity === 'sleeping') {
      return Math.random() < 0.05; // 5% chance (sleep-typing)
    }
    
    // If it's a direct mention or question, ALWAYS respond regardless of state
    if (message.toLowerCase().includes('slunt') || message.includes('?')) {
      return true;
    }
    
    // If he's gaming, quick responses only
    if (this.state.activity === 'gaming') {
      return Math.random() < 0.15; // 15% chance (quick response between games)
    }
    
    // If he's idle, chatting, or watching - he's available on all connected platforms
    if (this.state.activity === 'idle' || this.state.activity === 'chatting' || this.state.activity === 'watching') {
      // Always available when idle/chatting/watching
      return true;
    }
    
    // If he's in a specific location that doesn't match the platform, less likely to respond
    if (this.state.location && this.state.location !== platform && this.state.location !== 'offline' && platform !== 'coolhole') {
      return Math.random() < 0.1;
    }
    
    // If social battery is drained, less likely
    if (this.state.socialBattery < 20) {
      return Math.random() < 0.3;
    }
    
    // If he doesn't want to talk, less likely
    if (!this.state.wantsToTalk) {
      return Math.random() < 0.4;
    }
    
    // Otherwise, base it on energy and mood
    const respondChance = 
      (this.state.energy / 100) * 0.3 +
      (this.state.socialBattery / 100) * 0.4 +
      (this.state.wantsToTalk ? 0.3 : 0);
    
    return Math.random() < respondChance;
  }

  /**
   * Get context about Slunt's current life state for response generation
   */
  getLifeContext() {
    return {
      energy: this.state.energy,
      mood: this.state.mood,
      moodIntensity: this.state.moodIntensity,
      socialBattery: this.state.socialBattery,
      boredom: this.state.boredom,
      activity: this.state.activity,
      location: this.state.location,
      wantsToTalk: this.state.wantsToTalk,
      activityDuration: (Date.now() - this.state.activityStartTime) / (1000 * 60)
    };
  }

  /**
   * Update state when Slunt interacts with someone
   */
  recordInteraction(username, platform, messageLength) {
    this.state.lastInteraction = Date.now();
    
    // Add to active conversations if not already there
    if (!this.state.activeConversations.includes(username)) {
      this.state.activeConversations.push(username);
    }
    
    // Drain social battery slightly
    this.state.socialBattery = Math.max(0, this.state.socialBattery - 1);
    
    // Reduce boredom
    this.state.boredom = Math.max(0, this.state.boredom - 3);
    
    // Track conversation
    if (!this.conversationHistory.has(username)) {
      this.conversationHistory.set(username, []);
    }
    this.conversationHistory.get(username).push({
      timestamp: Date.now(),
      platform,
      messageLength
    });
  }
}

module.exports = AutonomousLife;
