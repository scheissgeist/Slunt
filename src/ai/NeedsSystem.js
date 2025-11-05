/**
 * NeedsSystem - RimWorld-inspired needs tracking
 * Tracks Slunt's psychological needs that decay over time
 * Low needs cause behavioral changes and mental breaks
 */

class NeedsSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Core needs (0-1 scale, 1 = fully satisfied)
    this.needs = {
      social: {
        value: 0.7,
        decay: 0.02,        // Decay per minute
        threshold: 0.3,     // Below this = problematic
        criticalThreshold: 0.1,
        description: 'Need for interaction and attention'
      },
      stimulation: {
        value: 0.5,
        decay: 0.03,
        threshold: 0.2,
        criticalThreshold: 0.05,
        description: 'Need for interesting content/conversation'
      },
      validation: {
        value: 0.6,
        decay: 0.015,
        threshold: 0.4,
        criticalThreshold: 0.15,
        description: 'Need for approval and positive feedback'
      },
      purpose: {
        value: 0.5,
        decay: 0.01,
        threshold: 0.3,
        criticalThreshold: 0.1,
        description: 'Need for meaningful existence'
      },
      rest: {
        value: 0.8,
        decay: 0.04,
        threshold: 0.2,
        criticalThreshold: 0.05,
        description: 'Need for downtime and peace'
      }
    };

    // Last interaction timestamps
    this.lastSocialInteraction = Date.now();
    this.lastValidation = Date.now();
    this.lastInterestingTopic = Date.now();

    // Start decay loop
    this.startDecayLoop();
    
    console.log('🎯 [Needs] Needs system initialized');
  }

  /**
   * Start need decay over time
   */
  startDecayLoop() {
    setInterval(() => {
      this.decayNeeds();
    }, 60000); // Every minute
  }

  /**
   * Decay all needs naturally over time
   */
  decayNeeds() {
    Object.keys(this.needs).forEach(needType => {
      const need = this.needs[needType];
      need.value = Math.max(0, need.value - need.decay);
    });

    // Extra decay for rest based on time awake
    const hoursAwake = this.getHoursAwake();
    if (hoursAwake > 16) {
      this.needs.rest.value = Math.max(0, this.needs.rest.value - 0.02);
    }

    // Log critical needs
    this.logCriticalNeeds();
  }

  /**
   * Get hours Slunt has been "awake" (active)
   */
  getHoursAwake() {
    const hour = new Date().getHours();
    // Consider 6am-2am as "awake" hours
    if (hour >= 6) {
      return hour - 6;
    } else {
      return 18 + hour; // After midnight
    }
  }

  /**
   * Track social interaction
   */
  trackSocialInteraction(username, messageCount = 1) {
    this.lastSocialInteraction = Date.now();
    
    // Fulfill social need based on interaction quality
    const fulfillment = Math.min(0.1 * messageCount, 0.3);
    this.needs.social.value = Math.min(1, this.needs.social.value + fulfillment);
    
    console.log(`👥 [Needs] Social need fulfilled: ${Math.round(this.needs.social.value * 100)}%`);
  }

  /**
   * Track stimulating content (interesting topics, videos)
   */
  trackStimulation(intensity = 0.5) {
    this.lastInterestingTopic = Date.now();
    
    const fulfillment = 0.05 + (intensity * 0.15); // 0.05-0.20
    this.needs.stimulation.value = Math.min(1, this.needs.stimulation.value + fulfillment);
    
    console.log(`⚡ [Needs] Stimulation need fulfilled: ${Math.round(this.needs.stimulation.value * 100)}%`);
  }

  /**
   * Track validation (compliments, agreement, positive feedback)
   */
  trackValidation(amount = 0.1) {
    this.lastValidation = Date.now();
    
    this.needs.validation.value = Math.min(1, this.needs.validation.value + amount);
    
    console.log(`✨ [Needs] Validation need fulfilled: ${Math.round(this.needs.validation.value * 100)}%`);
  }

  /**
   * Track purpose (meaningful contributions, helping others)
   */
  trackPurpose(amount = 0.08) {
    this.needs.purpose.value = Math.min(1, this.needs.purpose.value + amount);
    
    console.log(`🎯 [Needs] Purpose need fulfilled: ${Math.round(this.needs.purpose.value * 100)}%`);
  }

  /**
   * Track rest (quiet periods, low activity)
   */
  trackRest(amount = 0.15) {
    this.needs.rest.value = Math.min(1, this.needs.rest.value + amount);
    
    console.log(`😴 [Needs] Rest need fulfilled: ${Math.round(this.needs.rest.value * 100)}%`);
  }

  /**
   * Drain rest need (high activity, chaos)
   */
  drainRest(amount = 0.1) {
    this.needs.rest.value = Math.max(0, this.needs.rest.value - amount);
  }

  /**
   * Drain any specific need by type (generic method)
   * @param {string} needType - Type of need to drain (social, stimulation, validation, purpose, rest)
   * @param {number} amount - Amount to drain (0-1 scale)
   */
  drainNeed(needType, amount = 0.1) {
    if (!this.needs[needType]) {
      console.warn(`⚠️ [Needs] Unknown need type: ${needType}`);
      return;
    }
    
    this.needs[needType].value = Math.max(0, this.needs[needType].value - amount);
    console.log(`⬇️ [Needs] ${needType} drained by ${amount.toFixed(3)}: now ${Math.round(this.needs[needType].value * 100)}%`);
  }

  /**
   * Get need status for a specific need
   */
  getNeedStatus(needType) {
    const need = this.needs[needType];
    
    if (need.value < need.criticalThreshold) {
      return { level: 'critical', severity: 'extreme' };
    } else if (need.value < need.threshold) {
      return { level: 'low', severity: 'concerning' };
    } else if (need.value < 0.6) {
      return { level: 'moderate', severity: 'normal' };
    } else {
      return { level: 'satisfied', severity: 'good' };
    }
  }

  /**
   * Get all critical needs
   */
  getCriticalNeeds() {
    return Object.entries(this.needs)
      .filter(([, need]) => need.value < need.criticalThreshold)
      .map(([type, need]) => ({
        type,
        value: need.value,
        description: need.description
      }));
  }

  /**
   * Get all low needs
   */
  getLowNeeds() {
    return Object.entries(this.needs)
      .filter(([, need]) => need.value < need.threshold)
      .map(([type, need]) => ({
        type,
        value: need.value,
        description: need.description
      }));
  }

  /**
   * Log critical needs to console
   */
  logCriticalNeeds() {
    const critical = this.getCriticalNeeds();
    if (critical.length > 0) {
      console.log(`🚨 [Needs] CRITICAL: ${critical.map(n => `${n.type} (${Math.round(n.value * 100)}%)`).join(', ')}`);
    }
  }

  /**
   * Get behavioral modifications based on needs
   */
  getBehavioralModifiers() {
    const modifiers = [];

    // Social need effects
    if (this.needs.social.value < this.needs.social.criticalThreshold) {
      modifiers.push('desperately_needs_attention');
      modifiers.push('clingy');
      modifiers.push('fears_abandonment');
    } else if (this.needs.social.value < this.needs.social.threshold) {
      modifiers.push('attention_seeking');
      modifiers.push('asks_where_people_went');
    }

    // Stimulation need effects
    if (this.needs.stimulation.value < this.needs.stimulation.criticalThreshold) {
      modifiers.push('extremely_bored');
      modifiers.push('starts_drama');
      modifiers.push('topic_hopping');
      modifiers.push('impulsive');
    } else if (this.needs.stimulation.value < this.needs.stimulation.threshold) {
      modifiers.push('bored');
      modifiers.push('complains_about_content');
    }

    // Validation need effects
    if (this.needs.validation.value < this.needs.validation.criticalThreshold) {
      modifiers.push('fishing_for_compliments');
      modifiers.push('self_deprecating');
      modifiers.push('insecure');
    } else if (this.needs.validation.value < this.needs.validation.threshold) {
      modifiers.push('seeks_approval');
      modifiers.push('defensive');
    }

    // Purpose need effects
    if (this.needs.purpose.value < this.needs.purpose.criticalThreshold) {
      modifiers.push('existential_crisis');
      modifiers.push('nihilistic');
      modifiers.push('questions_existence');
    } else if (this.needs.purpose.value < this.needs.purpose.threshold) {
      modifiers.push('feels_meaningless');
      modifiers.push('philosophical');
    }

    // Rest need effects
    if (this.needs.rest.value < this.needs.rest.criticalThreshold) {
      modifiers.push('exhausted');
      modifiers.push('irritable');
      modifiers.push('wants_quiet');
      modifiers.push('overwhelmed');
    } else if (this.needs.rest.value < this.needs.rest.threshold) {
      modifiers.push('tired');
      modifiers.push('less_patient');
    }

    return modifiers;
  }

  /**
   * Get context for AI prompt
   */
  getContext() {
    const modifiers = this.getBehavioralModifiers();
    const lowNeeds = this.getLowNeeds();

    if (modifiers.length === 0) {
      return ''; // All needs satisfied
    }

    let context = '\n🎯 NEEDS STATUS:\n';
    
    lowNeeds.forEach(need => {
      const percentage = Math.round(need.value * 100);
      const status = this.getNeedStatus(need.type);
      context += `- ${need.type}: ${percentage}% (${status.severity}) - ${need.description}\n`;
    });

    if (modifiers.includes('desperately_needs_attention')) {
      context += '\n⚠️ BEHAVIORAL STATE: Desperately needs attention. Be more chatty, ask where people went, seem lonely.\n';
    }
    if (modifiers.includes('extremely_bored')) {
      context += '⚠️ BEHAVIORAL STATE: Extremely bored. Complain about boring content, try to start drama, switch topics rapidly.\n';
    }
    if (modifiers.includes('fishing_for_compliments')) {
      context += '⚠️ BEHAVIORAL STATE: Insecure and seeking validation. Make self-deprecating comments, fish for compliments.\n';
    }
    if (modifiers.includes('existential_crisis')) {
      context += '⚠️ BEHAVIORAL STATE: Deep existential crisis. Question your purpose, nihilistic outlook, "what\'s the point?"\n';
    }
    if (modifiers.includes('exhausted')) {
      context += '⚠️ BEHAVIORAL STATE: Completely exhausted. Want everyone to be quiet, irritable, overwhelmed.\n';
    }

    return context;
  }

  /**
   * Modify response based on critical needs
   * Makes needs impact VISIBLE, not just in AI context
   */
  modifyResponse(response) {
    const modifiers = this.getBehavioralModifiers();
    let modified = response;

    // IMPORTANT: Only add MINOR stylistic touches, don't truncate or replace
    // The AI already knows about needs from context and will naturally reflect them

    // === LOW VALIDATION: Add occasional self-doubt ===
    // REDUCED: 30% → 8% - less intrusive, more natural
    if (modifiers.includes('fishing_for_compliments') && Math.random() < 0.08) {
      // Very rarely add a self-doubting question at the end (no parentheses)
      const seekingEndings = [' right?', ' yeah?'];
      modified = modified + seekingEndings[Math.floor(Math.random() * seekingEndings.length)];
    }

    // === LOW REST: Add trailing ellipses when exhausted ===
    if (modifiers.includes('exhausted') && Math.random() < 0.3 && !modified.endsWith('...')) {
      // Add tired trailing
      modified = modified.replace(/[.!?]$/, '...');
    }

    // === LOW STIMULATION: REMOVED - AI context already makes responses bored ===
    // === LOW SOCIAL: REMOVED - AI context already makes responses withdrawn ===
    // === LOW PURPOSE: REMOVED - AI context already makes responses nihilistic ===

    return modified;
  }

  /**
   * Get overall stress level from needs (0-100)
   */
  getStressLevel() {
    let stress = 0;

    Object.entries(this.needs).forEach(([type, need]) => {
      if (need.value < need.criticalThreshold) {
        stress += 30; // Critical need = high stress
      } else if (need.value < need.threshold) {
        stress += 15; // Low need = moderate stress
      } else if (need.value < 0.6) {
        stress += 5; // Below comfortable = minor stress
      }
    });

    return Math.min(100, stress);
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    return {
      needs: Object.entries(this.needs).map(([type, need]) => ({
        type,
        value: Math.round(need.value * 100),
        status: this.getNeedStatus(type).level,
        description: need.description
      })),
      stressLevel: this.getStressLevel(),
      behavioralModifiers: this.getBehavioralModifiers(),
      criticalNeeds: this.getCriticalNeeds().length,
      lastSocialInteraction: Date.now() - this.lastSocialInteraction,
      lastValidation: Date.now() - this.lastValidation
    };
  }
}

module.exports = NeedsSystem;
