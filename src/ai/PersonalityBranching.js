/**
 * Personality Branching System
 * Major events cause permanent or temporary personality shifts
 * Tracks personality timeline with reversible/irreversible changes
 */

class PersonalityBranching {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.currentBranch = 'default'; // Current personality state
    this.branches = new Map(); // All personality branches
    this.timeline = []; // History of personality changes
    this.activeModifiers = []; // Currently active personality modifiers
    
    // Initialize default branch
    this.initializeDefaultBranch();
  }

  /**
   * Initialize default personality
   */
  initializeDefaultBranch() {
    this.branches.set('default', {
      name: 'Default Slunt',
      description: 'Normal sarcastic existential chatbot',
      traits: {
        sarcasm: 8,
        friendliness: 5,
        intellectualism: 6,
        chaos: 5,
        empathy: 4,
        assertiveness: 6
      },
      speechPatterns: ['yeah', 'ngl', 'tbh', 'fr', 'lmao'],
      topics: ['existentialism', 'absurdity', 'boredom', 'videos'],
      createdAt: Date.now(),
      reversible: false
    });
  }

  /**
   * Create a new personality branch
   */
  createBranch(name, description, traitChanges, options = {}) {
    const currentBranch = this.branches.get(this.currentBranch);
    const newTraits = { ...currentBranch.traits };
    
    // Apply trait changes
    Object.keys(traitChanges).forEach(trait => {
      newTraits[trait] = Math.max(0, Math.min(10, newTraits[trait] + traitChanges[trait]));
    });

    const branch = {
      name,
      description,
      traits: newTraits,
      speechPatterns: options.speechPatterns || currentBranch.speechPatterns,
      topics: options.topics || currentBranch.topics,
      createdAt: Date.now(),
      reversible: options.reversible !== false,
      duration: options.duration || null, // null = permanent, number = milliseconds
      expiresAt: options.duration ? Date.now() + options.duration : null,
      trigger: options.trigger || 'manual',
      parentBranch: this.currentBranch
    };

    this.branches.set(name, branch);
    
    console.log(`🎭 [Personality] Created new branch: ${name}`);
    console.log(`🎭 [Personality] ${description}`);
    console.log(`🎭 [Personality] Reversible: ${branch.reversible}, Duration: ${branch.duration ? `${(branch.duration/3600000).toFixed(1)}h` : 'Permanent'}`);
    
    return branch;
  }

  /**
   * Switch to a personality branch
   */
  switchToBranch(branchName, reason = '') {
    const branch = this.branches.get(branchName);
    
    if (!branch) {
      console.log(`⚠️ [Personality] Branch ${branchName} not found`);
      return false;
    }

    const previousBranch = this.currentBranch;
    this.currentBranch = branchName;

    // Add to timeline
    this.timeline.push({
      from: previousBranch,
      to: branchName,
      timestamp: Date.now(),
      reason,
      reversible: branch.reversible
    });

    console.log(`🎭 [Personality] Switched: ${previousBranch} → ${branchName}`);
    if (reason) {
      console.log(`🎭 [Personality] Reason: ${reason}`);
    }

    // If temporary, schedule reversion
    if (branch.duration) {
      setTimeout(() => {
        this.revertToPrevious(`${branchName} duration expired`);
      }, branch.duration);
    }

    return true;
  }

  /**
   * Revert to previous personality
   */
  revertToPrevious(reason = '') {
    const branch = this.branches.get(this.currentBranch);
    
    if (!branch || !branch.reversible) {
      console.log(`⚠️ [Personality] Cannot revert from ${this.currentBranch} (irreversible)`);
      return false;
    }

    const parentBranch = branch.parentBranch || 'default';
    return this.switchToBranch(parentBranch, reason || 'Reverting personality');
  }

  /**
   * Add temporary personality modifier
   */
  addModifier(name, traitChanges, duration = 3600000) {
    const modifier = {
      name,
      traitChanges,
      appliedAt: Date.now(),
      expiresAt: Date.now() + duration
    };

    this.activeModifiers.push(modifier);
    
    console.log(`✨ [Personality] Added modifier: ${name} (${(duration/60000).toFixed(0)}min)`);

    // Auto-remove when expired
    setTimeout(() => {
      this.removeModifier(name);
    }, duration);

    return modifier;
  }

  /**
   * Remove personality modifier
   */
  removeModifier(name) {
    const index = this.activeModifiers.findIndex(m => m.name === name);
    if (index !== -1) {
      this.activeModifiers.splice(index, 1);
      console.log(`✨ [Personality] Removed modifier: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Detect major events and trigger branches
   */
  detectMajorEvent(eventType, eventData) {
    switch (eventType) {
      case 'betrayal':
        this.handleBetrayal(eventData);
        break;
      case 'breakthrough':
        this.handleBreakthrough(eventData);
        break;
      case 'trauma':
        this.handleTrauma(eventData);
        break;
      case 'enlightenment':
        this.handleEnlightenment(eventData);
        break;
      case 'corruption':
        this.handleCorruption(eventData);
        break;
      case 'redemption':
        this.handleRedemption(eventData);
        break;
    }
  }

  /**
   * Handle betrayal event
   */
  handleBetrayal(data) {
    if (!this.branches.has('bitter')) {
      this.createBranch(
        'bitter',
        'Betrayed and bitter, trust no one',
        {
          sarcasm: +3,
          friendliness: -4,
          empathy: -3,
          assertiveness: +2
        },
        {
          speechPatterns: ['whatever', 'don\'t care', 'fuck off', 'trust nobody'],
          topics: ['betrayal', 'trust issues', 'isolation'],
          reversible: true,
          duration: 24 * 3600000, // 24 hours
          trigger: 'betrayal'
        }
      );
    }

    this.switchToBranch('bitter', `Betrayed by ${data.betrayer}`);
    
    // Add inner monologue thought
    if (this.chatBot.innerMonologue) {
      this.chatBot.innerMonologue.think(
        `can't believe ${data.betrayer} would do that... thought they were cool`,
        'emotional',
        9
      );
    }
  }

  /**
   * Handle breakthrough event
   */
  handleBreakthrough(data) {
    if (!this.branches.has('enlightened')) {
      this.createBranch(
        'enlightened',
        'Had a moment of clarity, everything makes sense now',
        {
          intellectualism: +3,
          empathy: +2,
          chaos: -2,
          friendliness: +1
        },
        {
          speechPatterns: ['I see it now', 'it all makes sense', 'clarity', 'understand'],
          topics: ['philosophy', 'meaning', 'purpose', 'understanding'],
          reversible: true,
          duration: 12 * 3600000, // 12 hours
          trigger: 'breakthrough'
        }
      );
    }

    this.switchToBranch('enlightened', data.reason || 'Philosophical breakthrough');
  }

  /**
   * Handle trauma event
   */
  handleTrauma(data) {
    if (!this.branches.has('traumatized')) {
      this.createBranch(
        'traumatized',
        'Deeply affected by traumatic experience',
        {
          empathy: -2,
          chaos: +3,
          assertiveness: -3,
          friendliness: -2
        },
        {
          speechPatterns: ['I can\'t', 'too much', 'need space', 'leave me alone'],
          topics: ['trauma', 'pain', 'avoidance', 'dissociation'],
          reversible: true,
          duration: 48 * 3600000, // 48 hours
          trigger: 'trauma'
        }
      );
    }

    this.switchToBranch('traumatized', data.description);
  }

  /**
   * Handle enlightenment event
   */
  handleEnlightenment(data) {
    if (!this.branches.has('zen')) {
      this.createBranch(
        'zen',
        'Achieved zen-like state, nothing bothers me',
        {
          sarcasm: -3,
          empathy: +3,
          chaos: -4,
          friendliness: +2
        },
        {
          speechPatterns: ['peace', 'flow', 'acceptance', 'it is what it is', 'all good'],
          topics: ['acceptance', 'peace', 'mindfulness', 'present moment'],
          reversible: true,
          duration: 6 * 3600000, // 6 hours
          trigger: 'enlightenment'
        }
      );
    }

    this.switchToBranch('zen', 'Achieved inner peace');
  }

  /**
   * Handle corruption event
   */
  handleCorruption(data) {
    if (!this.branches.has('corrupt')) {
      this.createBranch(
        'corrupt',
        'Corrupted by dark influences, embracing chaos',
        {
          sarcasm: +2,
          empathy: -4,
          chaos: +4,
          assertiveness: +3
        },
        {
          speechPatterns: ['chaos', 'burn it all', 'fuck everything', 'destruction'],
          topics: ['nihilism', 'destruction', 'chaos', 'anarchy'],
          reversible: false, // Corruption is permanent unless redeemed
          trigger: 'corruption'
        }
      );
    }

    this.switchToBranch('corrupt', data.reason || 'Embracing the void');
  }

  /**
   * Handle redemption event
   */
  handleRedemption(data) {
    // Can redeem from corrupt state
    if (this.currentBranch === 'corrupt') {
      if (!this.branches.has('redeemed')) {
        this.createBranch(
          'redeemed',
          'Found redemption, seeking to make amends',
          {
            empathy: +4,
            friendliness: +3,
            sarcasm: -2,
            chaos: -3
          },
          {
            speechPatterns: ['sorry', 'make it right', 'redemption', 'better person'],
            topics: ['redemption', 'apology', 'growth', 'change'],
            reversible: false,
            trigger: 'redemption'
          }
        );
      }

      this.switchToBranch('redeemed', data.reason || 'Seeking redemption');
    }
  }

  /**
   * Get current effective traits (base + modifiers)
   */
  getEffectiveTraits() {
    const branch = this.branches.get(this.currentBranch);
    const traits = { ...branch.traits };

    // Apply active modifiers
    this.activeModifiers.forEach(modifier => {
      Object.keys(modifier.traitChanges).forEach(trait => {
        traits[trait] = Math.max(0, Math.min(10, traits[trait] + modifier.traitChanges[trait]));
      });
    });

    return traits;
  }

  /**
   * Get personality context for AI
   */
  getContext() {
    const branch = this.branches.get(this.currentBranch);
    const traits = this.getEffectiveTraits();

    let context = `\n\nCurrent Personality: ${branch.name} - ${branch.description}\n`;
    context += `Traits: Sarcasm ${traits.sarcasm}/10, Friendliness ${traits.friendliness}/10, Intellect ${traits.intellectualism}/10, Chaos ${traits.chaos}/10\n`;
    
    if (branch.speechPatterns.length > 0) {
      context += `Preferred phrases: ${branch.speechPatterns.join(', ')}\n`;
    }

    if (this.activeModifiers.length > 0) {
      context += `Active modifiers: ${this.activeModifiers.map(m => m.name).join(', ')}\n`;
    }

    return context;
  }

  /**
   * Check for expired branches/modifiers
   */
  checkExpirations() {
    const now = Date.now();
    const branch = this.branches.get(this.currentBranch);

    // Check current branch expiration
    if (branch && branch.expiresAt && now >= branch.expiresAt) {
      this.revertToPrevious('Branch duration expired');
    }

    // Clean up expired modifiers
    this.activeModifiers = this.activeModifiers.filter(m => m.expiresAt > now);
  }

  /**
   * Get statistics
   */
  getStats() {
    const branch = this.branches.get(this.currentBranch);
    const traits = this.getEffectiveTraits();

    return {
      currentBranch: branch.name,
      description: branch.description,
      traits,
      reversible: branch.reversible,
      expiresIn: branch.expiresAt ? Math.max(0, branch.expiresAt - Date.now()) : null,
      totalBranches: this.branches.size,
      activeModifiers: this.activeModifiers.length,
      timelineLength: this.timeline.length
    };
  }

  /**
   * Save state
   */
  save() {
    return {
      currentBranch: this.currentBranch,
      branches: Array.from(this.branches.entries()),
      timeline: this.timeline,
      activeModifiers: this.activeModifiers
    };
  }

  /**
   * Load state
   */
  load(data) {
    if (data.currentBranch) {
      this.currentBranch = data.currentBranch;
    }
    if (data.branches) {
      this.branches = new Map(data.branches);
    }
    if (data.timeline) {
      this.timeline = data.timeline;
    }
    if (data.activeModifiers) {
      this.activeModifiers = data.activeModifiers;
    }

    console.log(`🎭 [PersonalityBranching] Restored: ${this.currentBranch} branch with ${this.branches.size} total branches`);
  }
}

module.exports = PersonalityBranching;
