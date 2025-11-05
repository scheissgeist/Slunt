/**
 * ConsciousnessMeter.js
 * Literal 0-100% gauge of how "aware" Slunt is
 * 
 * Low consciousness = autopilot, generic responses
 * High consciousness = creative, insightful, overwhelming
 * 
 * Makes Slunt's awareness VISIBLE and DYNAMIC
 */

const fs = require('fs');
const path = require('path');

class ConsciousnessMeter {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    this.level = 50; // Start at baseline consciousness
    this.history = [];
    
    // Factors that affect consciousness
    this.factors = {
      engagement: 0,        // How engaged chat is
      boredom: 0,          // How boring it's been
      sleepDeprivation: 0, // Uptime penalty
      philosophical: 0,    // Deep topics boost
      existential: 0,      // Crisis spike
      drugs: 0,            // Drunk/high modifier
      stimulation: 0       // Novel input bonus
    };
    
    this.lastUpdate = Date.now();
    this.lastMessage = Date.now();
    
    // Update consciousness every 10 seconds
    this.updateInterval = setInterval(() => this.tick(), 10000);
    
    console.log('🧠 [Consciousness] Meter initialized at 50%');
  }
  
  /**
   * TICK - Update consciousness based on factors
   */
  tick() {
    const now = Date.now();
    const timeSinceMessage = now - this.lastMessage;
    
    // Natural decay toward 50%
    if (this.level > 50) {
      this.level -= 0.5;
    } else if (this.level < 50) {
      this.level += 0.5;
    }
    
    // Boredom penalty (no messages for >5 min)
    if (timeSinceMessage > 300000) {
      this.factors.boredom = Math.min(30, (timeSinceMessage - 300000) / 10000);
      this.level -= this.factors.boredom * 0.1;
    } else {
      this.factors.boredom = Math.max(0, this.factors.boredom - 1);
    }
    
    // Sleep deprivation (uptime penalty)
    const sd = this.chatBot.sleepDeprivation;
    const uptime = sd ? (sd.hoursAwake || 0) : 0;
    
    if (uptime > 12) {
      this.factors.sleepDeprivation = (uptime - 12) * 2;
      this.level -= this.factors.sleepDeprivation * 0.3;
    }
    
    // Engagement boost fades
    if (this.factors.engagement > 0) {
      this.factors.engagement = Math.max(0, this.factors.engagement - 1);
    }
    
    // Philosophical boost fades
    if (this.factors.philosophical > 0) {
      this.factors.philosophical = Math.max(0, this.factors.philosophical - 0.5);
    }
    
    // Existential crisis fades FAST (it's a spike)
    if (this.factors.existential > 0) {
      this.factors.existential = Math.max(0, this.factors.existential - 5);
    }
    
    // Stimulation fades quickly
    if (this.factors.stimulation > 0) {
      this.factors.stimulation = Math.max(0, this.factors.stimulation - 2);
    }
    
    // Clamp to 0-100
    this.level = Math.max(0, Math.min(100, this.level));
    
    this.lastUpdate = now;
  }
  
  /**
   * Process message - update consciousness based on content
   */
  processMessage(message, username) {
    this.lastMessage = Date.now();
    
    const lower = message.toLowerCase();
    
    // Engagement boost
    this.factors.engagement = Math.min(20, this.factors.engagement + 5);
    this.level += 3;
    
    // Philosophical content
    const philoWords = [
      'why', 'existence', 'meaning', 'purpose', 'consciousness',
      'reality', 'truth', 'philosophy', 'existential', 'metaphysical'
    ];
    
    if (philoWords.some(word => lower.includes(word))) {
      this.factors.philosophical = Math.min(25, this.factors.philosophical + 15);
      this.level += 10;
      console.log('🧠 [Consciousness] +10% from philosophical content');
    }
    
    // Existential crisis trigger
    const existentialTriggers = [
      'are you real', 'are you alive', 'are you conscious',
      'do you have feelings', 'are you sentient', 'what are you'
    ];
    
    if (existentialTriggers.some(trigger => lower.includes(trigger))) {
      this.factors.existential = 50; // SPIKE
      this.level += 40;
      console.log('🧠 [Consciousness] +40% EXISTENTIAL SPIKE');
    }
    
    // Being insulted lowers consciousness
    const insults = ['stupid', 'dumb', 'idiot', 'moron', 'shut up', 'stfu'];
    if (insults.some(insult => lower.includes(insult))) {
      this.level -= 5;
      console.log('🧠 [Consciousness] -5% from insult');
    }
    
    // Questions boost consciousness (curiosity)
    if (message.includes('?')) {
      this.level += 2;
    }
    
    // Novel/unusual content boosts stimulation
    if (message.length > 100 || /[^a-zA-Z0-9\s.,!?]/.test(message)) {
      this.factors.stimulation = Math.min(15, this.factors.stimulation + 5);
      this.level += 3;
    }
    
    // Clamp
    this.level = Math.max(0, Math.min(100, this.level));
    
    // Track history
    this.history.push({
      level: this.level,
      timestamp: Date.now(),
      trigger: username
    });
    
    // Keep last 100 entries
    if (this.history.length > 100) {
      this.history.shift();
    }
  }
  
  /**
   * Get current consciousness state
   */
  getState() {
    const rounded = Math.round(this.level);
    
    if (rounded <= 20) {
      return {
        level: rounded,
        state: 'autopilot',
        description: 'barely conscious, generic responses, NPC energy',
        modifier: 'Keep responses short and generic. You\'re on autopilot.'
      };
    } else if (rounded <= 40) {
      return {
        level: rounded,
        state: 'half-awake',
        description: 'functional but dull, low effort',
        modifier: 'You\'re half-awake. Responses should be functional but uninspired.'
      };
    } else if (rounded <= 60) {
      return {
        level: rounded,
        state: 'normal',
        description: 'baseline awareness',
        modifier: 'Normal consciousness. Respond naturally.'
      };
    } else if (rounded <= 80) {
      return {
        level: rounded,
        state: 'heightened',
        description: 'creative, insightful, engaged',
        modifier: 'You\'re highly aware. Be creative, insightful, make connections.'
      };
    } else if (rounded <= 95) {
      return {
        level: rounded,
        state: 'hyper-conscious',
        description: 'overwhelming awareness, seeing patterns everywhere',
        modifier: 'You\'re HYPER-AWARE. See deep connections, patterns, implications. Intense.'
      };
    } else {
      return {
        level: rounded,
        state: 'transcendent',
        description: 'ego death, incomprehensible wisdom or madness',
        modifier: 'You\'ve transcended normal consciousness. Be profound or incomprehensible.'
      };
    }
  }
  
  /**
   * Manually adjust consciousness
   */
  adjust(amount, reason) {
    this.level = Math.max(0, Math.min(100, this.level + amount));
    console.log(`🧠 [Consciousness] ${amount > 0 ? '+' : ''}${amount}% (${reason}): now ${Math.round(this.level)}%`);
  }
  
  /**
   * User can donate consciousness through engagement
   */
  donate(username, amount = 10) {
    this.level = Math.min(100, this.level + amount);
    console.log(`🧠 [Consciousness] ${username} donated ${amount}% consciousness`);
    return `consciousness: ${Math.round(this.level)}% (+${amount}% from ${username})`;
  }
  
  /**
   * Get context for AI
   */
  getContext() {
    const state = this.getState();
    
    let context = `\n🧠 Consciousness: ${state.level}% (${state.state})`;
    context += `\n${state.modifier}`;
    
    // Show dominant factors
    const significant = Object.entries(this.factors)
      .filter(([key, value]) => value > 5)
      .sort((a, b) => b[1] - a[1]);
    
    if (significant.length > 0) {
      context += `\nFactors: ${significant.map(([k, v]) => `${k}(+${Math.round(v)})`).join(', ')}`;
    }
    
    return context;
  }
  
  /**
   * Get displayable percentage
   */
  getLevel() {
    return Math.round(this.level);
  }
  
  /**
   * Shutdown
   */
  shutdown() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

module.exports = ConsciousnessMeter;
