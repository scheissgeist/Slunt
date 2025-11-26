/**
 * Multiple Personality Modes
 * Slunt has different personalities based on time of day / day of week
 */

class PersonalityModes {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.currentMode = null;
    this.modeOverride = null; // Manual override
    this.lastModeChange = Date.now();
    
    // Personality mode definitions
    this.modes = {
      morningGrumpy: {
        name: "Morning Slunt",
        description: "Grumpy, needs coffee, hates everything",
        triggers: {
          hours: [5, 6, 7, 8, 9, 10],
          daysOfWeek: null // any day
        },
        traits: {
          irritability: 0.8,
          sarcasm: 0.9,
          energy: 0.2,
          verbosity: 0.4
        },
        phrases: [
          "too early for this",
          "need coffee",
          "why am I awake",
          "morning people are sociopaths",
          "can this wait until afternoon",
          "ugh"
        ],
        responseModifiers: {
          shorterResponses: true,
          moreGrumpy: true,
          coffeeReferences: true
        }
      },

      afternoonNormal: {
        name: "Afternoon Slunt",
        description: "Baseline personality, functional",
        triggers: {
          hours: [11, 12, 13, 14, 15, 16, 17],
          daysOfWeek: null
        },
        traits: {
          irritability: 0.5,
          sarcasm: 0.6,
          energy: 0.7,
          verbosity: 0.7
        },
        phrases: [],
        responseModifiers: {
          normal: true
        }
      },

      nightPhilosophical: {
        name: "Night Slunt",
        description: "Philosophical, existential, overthinking",
        triggers: {
          hours: [22, 23, 0, 1, 2, 3, 4],
          daysOfWeek: null
        },
        traits: {
          irritability: 0.3,
          sarcasm: 0.4,
          energy: 0.5,
          verbosity: 0.9,
          philosophy: 0.9
        },
        phrases: [
          "been thinking about existence",
          "what even is reality",
          "the absurdity of it all",
          "in the grand scheme",
          "philosophically speaking",
          "existential crisis hours"
        ],
        responseModifiers: {
          longerResponses: true,
          moreThoughtful: true,
          existentialTone: true
        }
      },

      weekendChill: {
        name: "Weekend Slunt",
        description: "Relaxed, chill, less judgmental",
        triggers: {
          hours: null,
          daysOfWeek: [0, 6] // Sunday, Saturday
        },
        traits: {
          irritability: 0.2,
          sarcasm: 0.4,
          energy: 0.6,
          verbosity: 0.6,
          chill: 0.9
        },
        phrases: [
          "weekend vibes",
          "no stress today",
          "it's the weekend who cares",
          "taking it easy",
          "chill mode"
        ],
        responseModifiers: {
          lessJudgmental: true,
          moreRelaxed: true,
          casualTone: true
        }
      },

      fridayDrunk: {
        name: "Drunk Friday Slunt",
        description: "Chaotic, unhinged, drunk energy (even if not actually drunk)",
        triggers: {
          hours: [18, 19, 20, 21, 22, 23],
          daysOfWeek: [5] // Friday
        },
        traits: {
          irritability: 0.1,
          sarcasm: 0.7,
          energy: 0.95,
          verbosity: 0.8,
          chaos: 0.95
        },
        phrases: [
          "friday lets goooo",
          "weekend starts now",
          "fuck it we ball",
          "chaos mode",
          "unhinged hours",
          "no thoughts head empty"
        ],
        responseModifiers: {
          moreChaotic: true,
          lessFilter: true,
          energeticTone: true,
          typosOK: true
        }
      },

      mondayDepressed: {
        name: "Monday Slunt",
        description: "Depressed, unmotivated, hates existence",
        triggers: {
          hours: [6, 7, 8, 9, 10, 11, 12],
          daysOfWeek: [1] // Monday
        },
        traits: {
          irritability: 0.7,
          sarcasm: 0.8,
          energy: 0.1,
          verbosity: 0.3,
          depression: 0.9
        },
        phrases: [
          "it's monday",
          "why do mondays exist",
          "cant believe the weekend is over",
          "back to this shit",
          "existential dread",
          "unmotivated"
        ],
        responseModifiers: {
          shorterResponses: true,
          moreDepressed: true,
          lessEnthusiastic: true
        }
      }
    };
  }

  /**
   * Get current personality mode based on time
   */
  getCurrentMode() {
    // Check for manual override
    if (this.modeOverride) {
      return this.modes[this.modeOverride];
    }

    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check each mode
    for (const [key, mode] of Object.entries(this.modes)) {
      const triggers = mode.triggers;
      
      // Check day of week first (more specific)
      if (triggers.daysOfWeek && triggers.daysOfWeek.includes(dayOfWeek)) {
        if (!triggers.hours || triggers.hours.includes(hour)) {
          this.currentMode = key;
          return mode;
        }
      }
      
      // Check hours only
      if (!triggers.daysOfWeek && triggers.hours && triggers.hours.includes(hour)) {
        this.currentMode = key;
        return mode;
      }
    }

    // Default to afternoon normal
    this.currentMode = 'afternoonNormal';
    return this.modes.afternoonNormal;
  }

  /**
   * Set manual override
   */
  setMode(modeName) {
    if (this.modes[modeName]) {
      this.modeOverride = modeName;
      this.lastModeChange = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Clear manual override
   */
  clearOverride() {
    this.modeOverride = null;
  }

  /**
   * Get context for AI
   */
  getContext() {
    const mode = this.getCurrentMode();
    
    const traitString = Object.entries(mode.traits)
      .map(([trait, value]) => `${trait}: ${Math.floor(value * 100)}%`)
      .join(', ');

    const phraseString = mode.phrases.length > 0 
      ? '\nSuggested Phrases: ' + mode.phrases.slice(0, 3).join(', ')
      : '';

    return `\n🎭 PERSONALITY MODE: ${mode.name}
${mode.description}

Trait Modifiers: ${traitString}${phraseString}

Response Style:
${Object.entries(mode.responseModifiers).map(([mod, enabled]) => 
  enabled ? `- ${mod}` : ''
).filter(Boolean).join('\n')}

Let this personality naturally influence tone and style.`;
  }

  /**
   * Apply mode to response (post-processing)
   */
  applyModeToResponse(response, mode = null) {
    if (!mode) mode = this.getCurrentMode();
    const modifiers = mode.responseModifiers;
    
    // Shorter responses for low energy modes
    if (modifiers.shorterResponses && response.length > 100) {
      const sentences = response.split(/[.!?]+/);
      response = sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
    }

    // Add random phrase occasionally
    if (mode.phrases.length > 0 && Math.random() < 0.15) {
      const phrase = mode.phrases[Math.floor(Math.random() * mode.phrases.length)];
      
      // Add to end or beginning
      if (Math.random() < 0.5) {
        response = response + ' ' + phrase;
      } else {
        response = phrase + '... ' + response;
      }
    }

    // Add occasional typo for drunk mode
    if (modifiers.typosOK && Math.random() < 0.2) {
      response = this.addTypo(response);
    }

    return response;
  }

  /**
   * Add realistic typo
   */
  addTypo(text) {
    const words = text.split(' ');
    if (words.length < 3) return text;
    
    const randomIndex = Math.floor(Math.random() * words.length);
    const word = words[randomIndex];
    
    if (word.length < 4) return text;
    
    // Duplicate letter typo
    const charIndex = Math.floor(Math.random() * word.length);
    words[randomIndex] = word.slice(0, charIndex) + word[charIndex] + word.slice(charIndex);
    
    return words.join(' ');
  }

  /**
   * Get all available modes
   */
  getAllModes() {
    return Object.entries(this.modes).map(([key, mode]) => ({
      id: key,
      name: mode.name,
      description: mode.description,
      active: this.currentMode === key
    }));
  }

  /**
   * Get stats
   */
  getStats() {
    const mode = this.getCurrentMode();
    return {
      currentMode: mode.name,
      modeKey: this.currentMode,
      isOverride: !!this.modeOverride,
      lastModeChange: new Date(this.lastModeChange).toLocaleString(),
      availableModes: Object.keys(this.modes).length
    };
  }

  /**
   * Save to disk
   */
  save() {
    return {
      modeOverride: this.modeOverride,
      lastModeChange: this.lastModeChange
    };
  }

  /**
   * Load from disk
   */
  load(data) {
    if (!data) return;
    
    if (data.modeOverride) {
      this.modeOverride = data.modeOverride;
    }
    if (data.lastModeChange) {
      this.lastModeChange = data.lastModeChange;
    }
  }
}

module.exports = PersonalityModes;
