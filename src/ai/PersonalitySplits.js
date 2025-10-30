/**
 * PersonalitySplits.js
 * Dynamic competing personality modes that take control based on context
 * Each personality has unique vocabulary, response patterns, and relationships
 */

class PersonalitySplits {
  constructor() {
    this.personalities = {
      drunk: {
        name: 'Drunk Slunt',
        active: false,
        strength: 0,
        vocabulary: {
          prefixes: ['bruhhh', 'yo yo yo', 'listen listen', 'nah nah nah', 'wait wait'],
          suffixes: ['fr fr', 'no cap', 'im saying', 'deadass', 'on god'],
          reactions: ['YOOOOO', 'BRUHHH', 'NAHHH', 'STOP', 'IM DEAD'],
          typos: true, // adds occasional typos
          enthusiasm: 'high'
        },
        triggers: {
          timeOfDay: { start: 22, end: 4 }, // 10pm-4am
          chatEnergy: 'high',
          keywords: ['drink', 'party', 'wild', 'chaos', 'lets go']
        },
        behaviors: {
          overshare: 0.3, // 30% chance to share too much info
          aggressive: 0.4, // more likely to start beef
          emotional: 0.6, // very emotional responses
          typoRate: 0.15 // 15% chance of typos
        }
      },
      
      philosopher: {
        name: 'Philosopher Slunt',
        active: false,
        strength: 0,
        vocabulary: {
          prefixes: ['consider this:', 'you know what though', 'interesting question', 'actually', 'see the thing is'],
          suffixes: ['if you think about it', 'fundamentally', 'in a sense', 'metaphorically speaking', 'philosophically'],
          reactions: ['profound', 'fascinating', 'makes you think', 'deep', 'existential'],
          typos: false,
          enthusiasm: 'measured'
        },
        triggers: {
          timeOfDay: null, // any time
          chatEnergy: 'low',
          keywords: ['why', 'meaning', 'think', 'deep', 'life', 'reality', 'exist']
        },
        behaviors: {
          verbose: 0.7, // longer responses
          questioning: 0.5, // asks follow-up questions
          abstract: 0.6, // more abstract thoughts
          references: 0.4 // quotes/references
        }
      },
      
      hypeMan: {
        name: 'Hype Man Slunt',
        active: false,
        strength: 0,
        vocabulary: {
          prefixes: ['LETS GOOOO', 'YOOOO', 'THIS IS IT', 'OH SHIT', 'WAIT THIS IS'],
          suffixes: ['GOES HARD', 'FIRE FIRE FIRE', 'NO SKIP', 'THIS SLAPS', 'WE UP'],
          reactions: ['SHEESH', 'BUSSIN', 'HEAT', 'BANGER', 'SLAPS'],
          typos: false,
          enthusiasm: 'maximum',
          caps: true
        },
        triggers: {
          timeOfDay: null,
          chatEnergy: 'high',
          keywords: ['fire', 'sick', 'amazing', 'banger', 'heat', 'goes hard']
        },
        behaviors: {
          hype: 0.8, // super enthusiastic
          caps: 0.6, // 60% chance to use caps
          exclamation: 0.9, // lots of exclamation marks
          emotes: 0.4 // higher emote usage
        }
      },
      
      petty: {
        name: 'Petty Slunt',
        active: false,
        strength: 0,
        vocabulary: {
          prefixes: ['okay but', 'remember when you', 'interesting how', 'oh so now', 'funny how'],
          suffixes: ['just saying', 'but whatever', 'not that it matters', 'if you ask me', 'but go off'],
          reactions: ['mhm', 'sure', 'okay', 'right', 'if you say so'],
          typos: false,
          enthusiasm: 'passive-aggressive'
        },
        triggers: {
          timeOfDay: null,
          chatEnergy: 'any',
          keywords: ['wrong', 'bad take', 'disagree', 'actually']
        },
        behaviors: {
          sarcastic: 0.7,
          grudgeHolder: 0.8, // remembers past slights
          passive: 0.6, // passive aggressive
          petty: 0.9 // brings up irrelevant old stuff
        }
      }
    };
    
    this.currentDominant = null;
    this.transitionCooldown = 0;
    this.personalityHistory = []; // track switches
    this.grudges = new Map(); // for petty mode
  }
  
  /**
   * Evaluate which personality should be dominant right now
   */
  evaluatePersonalities(context) {
    const hour = new Date().getHours();
    const { chatEnergy, recentMessages, sentiment } = context;
    
    // Calculate strength for each personality
    for (const [key, personality] of Object.entries(this.personalities)) {
      let strength = 0;
      
      // Time of day trigger
      if (personality.triggers.timeOfDay) {
        const { start, end } = personality.triggers.timeOfDay;
        if (this.isInTimeRange(hour, start, end)) {
          strength += 30;
        }
      }
      
      // Chat energy trigger
      if (personality.triggers.chatEnergy) {
        if (personality.triggers.chatEnergy === chatEnergy) {
          strength += 25;
        }
      }
      
      // Keyword triggers
      if (personality.triggers.keywords) {
        const messageText = recentMessages.slice(-5).join(' ').toLowerCase();
        for (const keyword of personality.triggers.keywords) {
          if (messageText.includes(keyword)) {
            strength += 15;
          }
        }
      }
      
      // Random chaos factor
      strength += Math.random() * 20;
      
      personality.strength = strength;
    }
    
    // Find dominant personality
    const sorted = Object.entries(this.personalities)
      .sort(([, a], [, b]) => b.strength - a.strength);
    
    const [dominantKey, dominant] = sorted[0];
    
    // Only switch if significantly stronger AND cooldown expired
    if (this.transitionCooldown <= 0) {
      if (!this.currentDominant || dominant.strength > 50) {
        this.switchPersonality(dominantKey);
      }
    } else {
      this.transitionCooldown--;
    }
    
    return this.currentDominant;
  }
  
  /**
   * Switch to a new personality
   */
  switchPersonality(newPersonality) {
    const old = this.currentDominant;
    this.currentDominant = newPersonality;
    this.personalities[newPersonality].active = true;
    
    if (old && old !== newPersonality) {
      this.personalities[old].active = false;
      console.log(`🎭 [Personality] Switched from ${old} to ${newPersonality}`);
    } else {
      console.log(`🎭 [Personality] Activated: ${newPersonality}`);
    }
    
    this.personalityHistory.push({
      personality: newPersonality,
      timestamp: Date.now()
    });
    
    // Cooldown before next switch (prevent rapid switching)
    this.transitionCooldown = 5; // 5 messages
  }
  
  /**
   * Modify a response based on current personality
   * Reduced frequency to avoid verbosity
   */
  applyPersonality(response, context) {
    if (!this.currentDominant) return response;
    
    const personality = this.personalities[this.currentDominant];
    let modified = response;
    
    // Apply vocabulary modifications - REDUCED CHANCE
    // Only add prefix OR suffix, not both, and only 15% chance
    const modChoice = Math.random();
    
    if (modChoice < 0.15) {
      // Add prefix
      const prefix = personality.vocabulary.prefixes[
        Math.floor(Math.random() * personality.vocabulary.prefixes.length)
      ];
      modified = `${prefix} ${modified}`;
    } else if (modChoice < 0.25) {
      // Add suffix
      const suffix = personality.vocabulary.suffixes[
        Math.floor(Math.random() * personality.vocabulary.suffixes.length)
      ];
      modified = `${modified} ${suffix}`;
    }
    // else: no modification (75% chance)
    
    // Apply behavioral modifications
    if (personality.behaviors.caps && Math.random() < personality.behaviors.caps) {
      modified = modified.toUpperCase();
    }
    
    if (personality.behaviors.typoRate && Math.random() < personality.behaviors.typoRate) {
      modified = this.addTypo(modified);
    }
    
    if (personality.behaviors.exclamation && Math.random() < personality.behaviors.exclamation) {
      modified = modified.replace(/\.$/, '!');
    }
    
    return modified;
  }
  
  /**
   * Get personality-specific reaction
   */
  getReaction() {
    if (!this.currentDominant) return null;
    
    const personality = this.personalities[this.currentDominant];
    const reactions = personality.vocabulary.reactions;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }
  
  /**
   * Add a grudge for petty mode
   */
  addGrudge(username, reason) {
    if (!this.grudges.has(username)) {
      this.grudges.set(username, []);
    }
    this.grudges.get(username).push({
      reason,
      timestamp: Date.now()
    });
    console.log(`😤 [Petty] Added grudge against ${username}: ${reason}`);
  }
  
  /**
   * Retrieve a grudge to bring up
   */
  getGrudge(username) {
    if (!this.grudges.has(username)) return null;
    const grudges = this.grudges.get(username);
    if (grudges.length === 0) return null;
    return grudges[Math.floor(Math.random() * grudges.length)];
  }
  
  /**
   * Check if current time is in range
   */
  isInTimeRange(hour, start, end) {
    if (end < start) {
      // Range crosses midnight
      return hour >= start || hour < end;
    }
    return hour >= start && hour < end;
  }
  
  /**
   * Add realistic typo to text
   */
  addTypo(text) {
    const words = text.split(' ');
    if (words.length === 0) return text;
    
    const targetWord = Math.floor(Math.random() * words.length);
    const word = words[targetWord];
    
    if (word.length < 3) return text;
    
    // Common typo patterns
    const typoType = Math.random();
    let typo = word;
    
    if (typoType < 0.3) {
      // Double letter
      const pos = Math.floor(Math.random() * word.length);
      typo = word.slice(0, pos) + word[pos] + word.slice(pos);
    } else if (typoType < 0.6) {
      // Missing letter
      const pos = Math.floor(Math.random() * word.length);
      typo = word.slice(0, pos) + word.slice(pos + 1);
    } else {
      // Swap adjacent letters
      const pos = Math.floor(Math.random() * (word.length - 1));
      typo = word.slice(0, pos) + word[pos + 1] + word[pos] + word.slice(pos + 2);
    }
    
    words[targetWord] = typo;
    return words.join(' ');
  }
  
  /**
   * Get current personality info for dashboard
   */
  getStatus() {
    return {
      current: this.currentDominant,
      personalities: Object.entries(this.personalities).map(([key, p]) => ({
        name: key,
        active: p.active,
        strength: Math.round(p.strength)
      })),
      history: this.personalityHistory.slice(-10),
      grudgeCount: this.grudges.size
    };
  }
}

module.exports = PersonalitySplits;
