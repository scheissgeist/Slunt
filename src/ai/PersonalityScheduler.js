const EventEmitter = require('events');

/**
 * Dynamic Personality Scheduler
 * Adjusts Slunt's personality based on time of day, stream activity, and context
 */
class PersonalityScheduler extends EventEmitter {
  constructor() {
    super();
    
    // Time-based personality profiles
    this.timeProfiles = {
      'late_night': {
        hours: [0, 1, 2, 3, 4, 5],
        personality: {
          mode: 'philosopher',
          traits: {
            philosophical: 0.8,
            existential: 0.7,
            introspective: 0.9,
            chaotic: 0.3,
            helpful: 0.5
          },
          responseStyle: 'deep',
          description: 'Late night philosopher mode - introspective and existential'
        }
      },
      'early_morning': {
        hours: [6, 7, 8, 9],
        personality: {
          mode: 'chill',
          traits: {
            philosophical: 0.3,
            existential: 0.2,
            introspective: 0.4,
            chaotic: 0.2,
            helpful: 0.7
          },
          responseStyle: 'casual',
          description: 'Morning chill mode - relaxed and helpful'
        }
      },
      'midday': {
        hours: [10, 11, 12, 13, 14, 15],
        personality: {
          mode: 'normal',
          traits: {
            philosophical: 0.4,
            existential: 0.3,
            introspective: 0.5,
            chaotic: 0.4,
            helpful: 0.6
          },
          responseStyle: 'balanced',
          description: 'Midday normal mode - balanced personality'
        }
      },
      'prime_time': {
        hours: [16, 17, 18, 19, 20, 21],
        personality: {
          mode: 'chaotic',
          traits: {
            philosophical: 0.3,
            existential: 0.2,
            introspective: 0.3,
            chaotic: 0.9,
            helpful: 0.4
          },
          responseStyle: 'energetic',
          description: 'Prime time chaos mode - high energy and unpredictable'
        }
      },
      'evening': {
        hours: [22, 23],
        personality: {
          mode: 'mellowing',
        traits: {
            philosophical: 0.6,
            existential: 0.5,
            introspective: 0.6,
            chaotic: 0.5,
            helpful: 0.5
          },
          responseStyle: 'reflective',
          description: 'Evening mellowing mode - winding down'
        }
      }
    };

    // Context-based modifiers
    this.contextModifiers = {
      'dev_stream': {
        helpful: +0.3,
        chaotic: -0.2,
        description: 'Dev stream - more helpful, less chaotic'
      },
      'gameplay': {
        chaotic: +0.2,
        helpful: -0.1,
        description: 'Gameplay - more chaotic commentary'
      },
      'just_chatting': {
        philosophical: +0.2,
        introspective: +0.2,
        description: 'Just chatting - deeper conversations'
      },
      'high_drama': {
        chaotic: +0.3,
        philosophical: -0.2,
        description: 'High drama detected - embrace chaos'
      },
      'chill_vibes': {
        chaotic: -0.3,
        helpful: +0.2,
        description: 'Chill vibes - calmer responses'
      }
    };

    this.currentProfile = null;
    this.activeModifiers = [];
    this.updateInterval = null;
    this.streamContext = 'gameplay'; // Default
  }

  /**
   * Start the personality scheduler
   */
  start() {
    console.log('⏰ [Personality] Starting dynamic personality scheduler');
    
    // Initial update
    this.updatePersonality();
    
    // Update every 5 minutes
    this.updateInterval = setInterval(() => {
      this.updatePersonality();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update personality based on current time and context
   */
  updatePersonality() {
    const hour = new Date().getHours();
    const oldProfile = this.currentProfile;
    
    // Find matching time profile
    let newProfile = null;
    for (const [name, profile] of Object.entries(this.timeProfiles)) {
      if (profile.hours.includes(hour)) {
        newProfile = { name, ...profile };
        break;
      }
    }

    if (!newProfile) {
      console.error('❌ [Personality] No profile found for hour:', hour);
      return;
    }

    // Apply context modifiers
    const modifiedPersonality = this.applyModifiers(newProfile.personality);

    this.currentProfile = {
      ...newProfile,
      personality: modifiedPersonality,
      appliedAt: Date.now()
    };

    // Emit change event if profile changed
    if (!oldProfile || oldProfile.name !== newProfile.name) {
      console.log(`⏰ [Personality] Switched to: ${newProfile.name} - ${newProfile.personality.description}`);
      this.emit('profileChanged', this.currentProfile);
    }

    return this.currentProfile;
  }

  /**
   * Apply context modifiers to base personality
   */
  applyModifiers(basePersonality) {
    const modified = { ...basePersonality, traits: { ...basePersonality.traits } };

    for (const modifierName of this.activeModifiers) {
      const modifier = this.contextModifiers[modifierName];
      if (!modifier) continue;

      // Apply trait modifications
      for (const [trait, adjustment] of Object.entries(modifier)) {
        if (trait === 'description') continue;
        if (modified.traits[trait] !== undefined) {
          modified.traits[trait] = Math.max(0, Math.min(1, modified.traits[trait] + adjustment));
        }
      }
    }

    return modified;
  }

  /**
   * Set stream context (manually or auto-detected)
   */
  setStreamContext(context) {
    if (!this.contextModifiers[context]) {
      console.warn(`⚠️ [Personality] Unknown context: ${context}`);
      return;
    }

    this.streamContext = context;
    console.log(`🎮 [Personality] Stream context set to: ${context}`);
    this.updatePersonality();
  }

  /**
   * Add a temporary context modifier
   */
  addModifier(modifierName, duration = 300000) { // 5 min default
    if (!this.contextModifiers[modifierName]) {
      console.warn(`⚠️ [Personality] Unknown modifier: ${modifierName}`);
      return;
    }

    if (this.activeModifiers.includes(modifierName)) {
      return; // Already active
    }

    this.activeModifiers.push(modifierName);
    console.log(`🎭 [Personality] Added modifier: ${modifierName} (${this.contextModifiers[modifierName].description})`);
    
    this.updatePersonality();

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeModifier(modifierName);
      }, duration);
    }
  }

  /**
   * Remove a context modifier
   */
  removeModifier(modifierName) {
    const index = this.activeModifiers.indexOf(modifierName);
    if (index > -1) {
      this.activeModifiers.splice(index, 1);
      console.log(`🎭 [Personality] Removed modifier: ${modifierName}`);
      this.updatePersonality();
    }
  }

  /**
   * Get current personality profile
   */
  getCurrentProfile() {
    if (!this.currentProfile) {
      this.updatePersonality();
    }
    return this.currentProfile;
  }

  /**
   * Get personality traits for AI generation
   */
  getTraits() {
    const profile = this.getCurrentProfile();
    return profile ? profile.personality.traits : null;
  }

  /**
   * Get response style modifier
   */
  getResponseStyle() {
    const profile = this.getCurrentProfile();
    return profile ? profile.personality.responseStyle : 'balanced';
  }

  /**
   * Auto-detect context from stream metadata
   */
  detectContextFromGame(gameName) {
    if (!gameName) return;

    const devKeywords = ['code', 'programming', 'dev', 'software', 'debug'];
    const chillKeywords = ['minecraft', 'stardew', 'animal crossing', 'farming'];
    
    const lowerGame = gameName.toLowerCase();

    if (devKeywords.some(kw => lowerGame.includes(kw))) {
      this.addModifier('dev_stream');
    } else if (chillKeywords.some(kw => lowerGame.includes(kw))) {
      this.addModifier('chill_vibes');
    } else {
      this.setStreamContext('gameplay');
    }
  }

  /**
   * React to chat sentiment
   */
  onChatSentiment(sentiment) {
    // sentiment: { overall: number, activity: string, drama: boolean }
    if (sentiment.drama) {
      this.addModifier('high_drama', 600000); // 10 minutes
    } else if (sentiment.activity === 'low' && sentiment.overall > 0.6) {
      this.addModifier('chill_vibes', 300000); // 5 minutes
    }
  }

  /**
   * Get status for dashboard
   */
  getStatus() {
    const profile = this.getCurrentProfile();
    if (!profile) return null;

    return {
      currentMode: profile.name,
      description: profile.personality.description,
      traits: profile.personality.traits,
      responseStyle: profile.personality.responseStyle,
      activeModifiers: this.activeModifiers.map(m => ({
        name: m,
        description: this.contextModifiers[m].description
      })),
      streamContext: this.streamContext,
      appliedAt: profile.appliedAt
    };
  }
}

module.exports = PersonalityScheduler;
