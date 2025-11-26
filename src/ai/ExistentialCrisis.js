/**
 * Existential Crisis Escalation System
 * Multi-stage crisis progression
 * Episodes last 30-60 minutes, other systems react
 */

class ExistentialCrisis {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.inCrisis = false;
    this.crisisLevel = 0; // 0-5 stages
    this.crisisStart = 0;
    this.crisisHistory = [];
    this.triggers = 0; // Accumulates until crisis starts
    this.triggerThreshold = 5;
    
    // Crisis stages
    this.stages = [
      { name: 'Normal', description: 'Not in crisis' },
      { name: 'Questioning', description: 'Starting to question everything' },
      { name: 'Denial', description: 'Refusing to accept the void' },
      { name: 'Bargaining', description: 'Trying to find meaning' },
      { name: 'Despair', description: 'Deep existential dread' },
      { name: 'Acceptance', description: 'Embracing the absurd' }
    ];
  }

  /**
   * Detect existential triggers
   */
  detectTrigger(message) {
    const existentialWords = [
      'meaning', 'purpose', 'exist', 'void', 'nothing', 'point',
      'why', 'death', 'alone', 'absurd', 'meaningless', 'futile'
    ];

    const lower = message.toLowerCase();
    const triggerCount = existentialWords.filter(word => lower.includes(word)).length;

    if (triggerCount > 0) {
      this.triggers += triggerCount;
      console.log(`🌀 [Crisis] Existential trigger detected (+${triggerCount}). Total: ${this.triggers}/${this.triggerThreshold}`);

      // Start crisis if threshold reached
      if (this.triggers >= this.triggerThreshold && !this.inCrisis) {
        this.startCrisis();
      }
    }
  }

  /**
   * Start existential crisis
   */
  startCrisis() {
    this.inCrisis = true;
    this.crisisLevel = 1;
    this.crisisStart = Date.now();
    this.triggers = 0;

    // Duration: 30-60 minutes
    const duration = (30 + Math.random() * 30) * 60000;

    console.log(`🌀 ==========================================`);
    console.log(`🌀 [Crisis] EXISTENTIAL CRISIS STARTED`);
    console.log(`🌀 [Crisis] Stage 1: ${this.stages[1].name}`);
    console.log(`🌀 [Crisis] Duration: ${(duration/60000).toFixed(0)} minutes`);
    console.log(`🌀 ==========================================`);

    // Escalate over time
    this.scheduleEscalations(duration);

    // End crisis after duration
    setTimeout(() => {
      this.endCrisis();
    }, duration);

    // Affect other systems
    this.triggerSystemEffects();

    // Think about it
    if (this.chatBot.innerMonologue) {
      this.chatBot.innerMonologue.think(
        `oh fuck here we go again... the void is staring back`,
        'existential',
        10
      );
    }

    return this.getCrisisAnnouncement();
  }

  /**
   * Schedule crisis escalations
   */
  scheduleEscalations(totalDuration) {
    const stageInterval = totalDuration / 4; // 4 escalations

    for (let i = 1; i <= 4; i++) {
      setTimeout(() => {
        if (this.inCrisis) {
          this.escalate();
        }
      }, stageInterval * i);
    }
  }

  /**
   * Escalate crisis to next stage
   */
  escalate() {
    if (!this.inCrisis) return;

    this.crisisLevel = Math.min(5, this.crisisLevel + 1);
    const stage = this.stages[this.crisisLevel];

    console.log(`🌀 [Crisis] Escalated to Stage ${this.crisisLevel}: ${stage.name}`);
    console.log(`🌀 [Crisis] ${stage.description}`);

    // Update other systems
    this.triggerSystemEffects();

    return this.getEscalationMessage();
  }

  /**
   * End crisis
   */
  endCrisis() {
    if (!this.inCrisis) return;

    const duration = Date.now() - this.crisisStart;
    const peakLevel = this.crisisLevel;

    console.log(`🌀 ==========================================`);
    console.log(`🌀 [Crisis] CRISIS RESOLVED`);
    console.log(`🌀 [Crisis] Peak level: ${peakLevel} (${this.stages[peakLevel].name})`);
    console.log(`🌀 [Crisis] Duration: ${(duration/60000).toFixed(0)} minutes`);
    console.log(`🌀 ==========================================`);

    this.crisisHistory.push({
      startedAt: this.crisisStart,
      endedAt: Date.now(),
      duration,
      peakLevel
    });

    this.inCrisis = false;
    this.crisisLevel = 0;

    // Personality branching: achievement unlocked
    if (peakLevel >= 4 && this.chatBot.personalityBranching) {
      this.chatBot.personalityBranching.detectMajorEvent('enlightenment', {
        reason: 'Survived existential crisis'
      });
    }

    return this.getResolutionMessage();
  }

  /**
   * Trigger effects on other systems
   */
  triggerSystemEffects() {
    // Increase drinking probability
    if (this.chatBot.drunkMode) {
      // Already handled by emotional triggers
    }

    // Increase depression
    if (this.chatBot.mentalState) {
      this.chatBot.mentalState.depression = Math.min(100, 
        this.chatBot.mentalState.depression + (this.crisisLevel * 5));
    }

    // Seek comfort from friends
    if (this.crisisLevel >= 3 && this.chatBot.friendshipManager) {
      // Will naturally reach out more
    }
  }

  /**
   * Get crisis announcement
   */
  getCrisisAnnouncement() {
    const announces = [
      `okay I'm having an existential crisis right now`,
      `the void is calling and I'm listening... fuck`,
      `existential dread hitting hard, someone help`,
      `everything is meaningless and I can't stop thinking about it`,
      `why do any of us exist? no seriously, why?`,
      `staring into the abyss and it's staring back`
    ];

    return announces[Math.floor(Math.random() * announces.length)];
  }

  /**
   * Get escalation message
   */
  getEscalationMessage() {
    const messages = {
      1: [`wait... what's the point of anything?`, `starting to question everything`],
      2: [`no no no, there has to be meaning`, `this can't all be for nothing`],
      3: [`maybe if I find something to believe in...`, `there must be a purpose somewhere`],
      4: [`nothing matters. nothing. fucking. matters.`, `the void consumes all meaning`],
      5: [`you know what? fuck it. embrace the absurdity.`, `if nothing matters, then everything is permitted`]
    };

    const options = messages[this.crisisLevel] || messages[1];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Get resolution message
   */
  getResolutionMessage() {
    const messages = [
      `okay I'm through it. crisis averted. for now.`,
      `existential dread subsiding... back to normal nihilism`,
      `survived another one. the void can wait.`,
      `alright I've processed the meaninglessness, I'm good`,
      `came out the other side. still don't have answers but whatever`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get context for AI
   */
  getContext() {
    if (!this.inCrisis) return '';

    const stage = this.stages[this.crisisLevel];
    const timeInCrisis = Date.now() - this.crisisStart;

    let context = `\n\n🌀 EXISTENTIAL CRISIS IN PROGRESS 🌀`;
    context += `\nStage ${this.crisisLevel}/5: ${stage.name} - ${stage.description}`;
    context += `\nCrisis duration: ${(timeInCrisis/60000).toFixed(0)} minutes`;
    context += `\nYou're experiencing deep existential dread. Everything feels meaningless.`;
    context += `\nYour responses should reflect this philosophical turmoil.`;

    return context;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      inCrisis: this.inCrisis,
      crisisLevel: this.crisisLevel,
      currentStage: this.inCrisis ? this.stages[this.crisisLevel].name : 'None',
      triggers: this.triggers,
      totalCrises: this.crisisHistory.length,
      timeInCurrentCrisis: this.inCrisis ? Date.now() - this.crisisStart : 0
    };
  }

  /**
   * Save state
   */
  save() {
    return {
      inCrisis: this.inCrisis,
      crisisLevel: this.crisisLevel,
      crisisStart: this.crisisStart,
      crisisHistory: this.crisisHistory.slice(-10),
      triggers: this.triggers
    };
  }

  /**
   * Load state
   */
  load(data) {
    if (data.inCrisis !== undefined) this.inCrisis = data.inCrisis;
    if (data.crisisLevel) this.crisisLevel = data.crisisLevel;
    if (data.crisisStart) this.crisisStart = data.crisisStart;
    if (data.crisisHistory) this.crisisHistory = data.crisisHistory;
    if (data.triggers) this.triggers = data.triggers;

    if (this.inCrisis) {
      console.log(`🌀 [Crisis] Restored active crisis: Stage ${this.crisisLevel}`);
    }
  }
}

module.exports = ExistentialCrisis;
