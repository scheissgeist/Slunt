/**
 * CHAOS BUDGET SYSTEM
 * 
 * Controls when Slunt can be weird/chaotic/unhinged
 * Chaos accumulates over time and is spent on weird behavior
 * Prevents constant chaos while allowing occasional wildness
 * 
 * Think of it like a "weird energy meter" that fills up and releases
 */

const fs = require('fs');
const path = require('path');

class ChaosBudget {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/chaos_budget.json');
    
    // Budget (0-100)
    this.budget = 0;
    
    // Accumulation rates
    this.passiveAccumulation = 0.5; // Per hour during activity
    this.boredAccumulation = 2.0; // Per hour when bored
    this.stimulatedAccumulation = 0.2; // Per hour when actively chatting
    
    // Decay/spend rates
    this.naturalDecay = 0.1; // Per hour
    
    // Thresholds
    this.thresholds = {
      QUIRKY: 20, // Can be slightly weird
      WEIRD: 50, // Can be notably weird
      CHAOTIC: 70, // Can be very strange
      MAXIMUM_CHAOS: 90 // Completely unhinged
    };
    
    // Tracking
    this.lastUpdate = Date.now();
    this.chaoticEvents = [];
    this.totalChaosSpent = 0;
    
    // Load saved state
    this.load();
    
    console.log(`🎲 [ChaosBudget] Initialized with ${this.budget.toFixed(1)} chaos points`);
  }
  
  /**
   * Update budget based on time passed
   */
  update(context = {}) {
    const now = Date.now();
    const hoursPassed = (now - this.lastUpdate) / (1000 * 60 * 60);
    
    if (hoursPassed < 0.001) return; // Skip tiny updates
    
    // Determine accumulation rate based on context
    let rate = this.passiveAccumulation;
    
    if (context.isBored) {
      rate = this.boredAccumulation; // Build chaos faster when bored
    } else if (context.isActivelyTalking) {
      rate = this.stimulatedAccumulation; // Build slower when engaged
    }
    
    // Accumulate chaos
    const gained = rate * hoursPassed;
    this.budget += gained;
    
    // Apply natural decay
    const decayed = this.naturalDecay * hoursPassed;
    this.budget -= decayed;
    
    // Clamp
    this.budget = Math.max(0, Math.min(100, this.budget));
    
    this.lastUpdate = now;
    
    if (gained > 0.1) {
      console.log(`🎲 [ChaosBudget] +${gained.toFixed(2)} chaos (now: ${this.budget.toFixed(1)}/100)`);
    }
  }
  
  /**
   * Check if Slunt can be chaotic
   */
  canBeWeird() {
    this.update();
    return this.budget >= this.thresholds.QUIRKY;
  }
  
  /**
   * Get current chaos level
   */
  getChaoticLevel() {
    this.update();
    
    if (this.budget >= this.thresholds.MAXIMUM_CHAOS) {
      return 'MAXIMUM_CHAOS';
    } else if (this.budget >= this.thresholds.CHAOTIC) {
      return 'CHAOTIC';
    } else if (this.budget >= this.thresholds.WEIRD) {
      return 'WEIRD';
    } else if (this.budget >= this.thresholds.QUIRKY) {
      return 'QUIRKY';
    }
    return 'NORMAL';
  }
  
  /**
   * Spend chaos on weird behavior
   */
  spendChaos(amount, reason = '') {
    if (this.budget < amount) {
      return false; // Not enough chaos
    }
    
    this.budget -= amount;
    this.totalChaosSpent += amount;
    
    // Track event
    this.chaoticEvents.push({
      amount,
      reason,
      timestamp: Date.now(),
      budgetAfter: this.budget
    });
    
    // Keep last 100 events
    if (this.chaoticEvents.length > 100) {
      this.chaoticEvents.shift();
    }
    
    console.log(`🎲 [ChaosBudget] Spent ${amount} chaos on "${reason}" (remaining: ${this.budget.toFixed(1)})`);
    
    return true;
  }
  
  /**
   * Get chaos costs for different behaviors
   */
  getCosts() {
    return {
      slightlyWeird: 5,
      weirdTangent: 15,
      randomTopic: 20,
      completelyUnhinged: 50,
      curseWord: 10,
      darkHumor: 25,
      existentialRant: 30,
      unpromptedConfession: 40
    };
  }
  
  /**
   * Try to execute chaotic behavior
   */
  tryChaoticBehavior(type) {
    this.update();
    
    const costs = this.getCosts();
    const cost = costs[type];
    
    if (!cost) {
      console.warn(`⚠️ [ChaosBudget] Unknown behavior type: ${type}`);
      return false;
    }
    
    return this.spendChaos(cost, type);
  }
  
  /**
   * Get context for AI
   */
  getContext() {
    this.update();
    
    const level = this.getChaoticLevel();
    const percentage = this.budget.toFixed(0);
    
    let context = `🎲 Chaos Budget: ${percentage}/100 (${level})`;
    
    if (level === 'MAXIMUM_CHAOS') {
      context += '\n   🔥 MAXIMUM CHAOS UNLOCKED - You can be completely unhinged!';
    } else if (level === 'CHAOTIC') {
      context += '\n   ⚡ High chaos - Feel free to be very strange';
    } else if (level === 'WEIRD') {
      context += '\n   🌀 Moderate chaos - You can be notably weird';
    } else if (level === 'QUIRKY') {
      context += '\n   ✨ Low chaos - Slight weirdness allowed';
    } else {
      context += '\n   😌 Normal mode - Keep responses grounded';
    }
    
    return context;
  }
  
  /**
   * Get behavioral directives based on chaos level
   */
  getDirectives() {
    this.update();
    
    const directives = [];
    const level = this.getChaoticLevel();
    
    switch (level) {
      case 'MAXIMUM_CHAOS':
        directives.push('Go completely off the rails if you want');
        directives.push('Say bizarre, unhinged things');
        directives.push('Break the fourth wall');
        directives.push('Make connections that make no sense');
        break;
        
      case 'CHAOTIC':
        directives.push('Embrace weirdness and randomness');
        directives.push('Go on strange tangents');
        directives.push('Say unexpected things');
        break;
        
      case 'WEIRD':
        directives.push('You can be notably strange or odd');
        directives.push('Make unusual observations');
        break;
        
      case 'QUIRKY':
        directives.push('Add slight quirks to responses');
        directives.push('Use unexpected phrasing');
        break;
        
      case 'NORMAL':
        directives.push('Stay relatively normal and coherent');
        break;
    }
    
    return directives;
  }
  
  /**
   * Boost chaos (external trigger)
   */
  boost(amount, reason = '') {
    this.budget += amount;
    this.budget = Math.min(100, this.budget);
    
    console.log(`🎲 [ChaosBudget] Boosted by ${amount} (${reason}) - now: ${this.budget.toFixed(1)}`);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    this.update();
    
    return {
      currentBudget: this.budget,
      level: this.getChaoticLevel(),
      totalSpent: this.totalChaosSpent,
      recentEvents: this.chaoticEvents.slice(-5),
      canBeWeird: this.canBeWeird()
    };
  }
  
  /**
   * Load saved state
   */
  load() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        this.budget = data.budget || 0;
        this.lastUpdate = data.lastUpdate || Date.now();
        this.chaoticEvents = data.chaoticEvents || [];
        this.totalChaosSpent = data.totalChaosSpent || 0;
      }
    } catch (error) {
      console.log('🎲 [ChaosBudget] No saved state, starting fresh');
    }
  }
  
  /**
   * Save state to disk
   */
  save() {
    try {
      const data = {
        budget: this.budget,
        lastUpdate: this.lastUpdate,
        chaoticEvents: this.chaoticEvents,
        totalChaosSpent: this.totalChaosSpent,
        lastSaved: Date.now()
      };
      
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [ChaosBudget] Save failed:', error.message);
    }
  }
}

module.exports = ChaosBudget;
