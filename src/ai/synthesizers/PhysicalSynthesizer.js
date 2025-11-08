/**
 * PHYSICAL SYNTHESIZER
 * 
 * Aggregates all physical/resource systems:
 * - Energy levels
 * - Tiredness
 * - Needs (rest, stimulation, food, etc.)
 * - Addictions (caffeine, attention, etc.)
 * - Sleep deprivation
 * 
 * Provides: Physical state and resource needs
 */

class PhysicalSynthesizer {
  constructor(chatBot) {
    this.bot = chatBot;
    this.cache = null;
    this.lastUpdate = 0;
    this.updateInterval = 30000; // Update every 30s
    
    this.startLoop();
  }
  
  startLoop() {
    this.timer = setInterval(() => {
      this.synthesize();
    }, this.updateInterval);
  }
  
  shutdown() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
  
  /**
   * Synthesize physical state
   */
  synthesize() {
    const now = Date.now();
    
    try {
      const lifeContext = this.bot.autonomousLife?.getLifeContext() || {};
      const needsData = this.bot.needsSystem?.getStats() || {};
      const needs = needsData.needs || [];
      
      // Convert needs array to object for easier access
      const needsObj = {};
      needs.forEach(need => {
        needsObj[need.type] = need.value;
      });
      
      const physical = {
        // Core resources
        energy: this.clamp(lifeContext.energy || 75, 0, 100),
        tiredness: this.clamp(lifeContext.tiredness || 0, 0, 100),
        
        // Needs (0-100%, lower = more critical)
        restNeed: this.clamp(needsObj.rest || 100, 0, 100),
        stimulationNeed: this.clamp(needsObj.stimulation || 100, 0, 100),
        socialNeed: this.clamp(needsObj.social || 100, 0, 100),
        
        // Addictions
        addictions: this.extractAddictions(),
        inWithdrawal: this.checkWithdrawal(),
        
        // Sleep deprivation
        sleepDeprived: (this.bot.sleepDeprivation?.hoursAwake || 0) > 8,
        sleepLevel: this.bot.sleepDeprivation?.hoursAwake || 0,
        
        timestamp: now
      };
      
      this.cache = physical;
      this.lastUpdate = now;
      
      return physical;
    } catch (error) {
      console.error('❌ [PhysicalSynthesizer] Error:', error.message);
      return this.cache || {
        energy: 75,
        tiredness: 0,
        restNeed: 100,
        stimulationNeed: 100,
        socialNeed: 100,
        addictions: [],
        inWithdrawal: false,
        sleepDeprived: false,
        sleepLevel: 0,
        timestamp: now
      };
    }
  }
  
  /**
   * Get physical context
   */
  getContext(detailLevel = 'normal') {
    if (!this.cache || Date.now() - this.lastUpdate > 60000) {
      this.synthesize();
    }
    
    const p = this.cache;
    
    if (detailLevel === 'brief') {
      return `Energy: ${p.energy}%${p.tiredness > 60 ? ', tired' : ''}`;
    }
    
    if (detailLevel === 'detailed') {
      const parts = [
        `=== PHYSICAL STATE ===`,
        `Energy: ${p.energy}% | Tiredness: ${p.tiredness}%`
      ];
      
      // Critical needs
      if (p.restNeed < 30) parts.push(`⚠️ CRITICAL: Need rest (${p.restNeed}%)`);
      if (p.stimulationNeed < 30) parts.push(`⚠️ CRITICAL: Need stimulation (${p.stimulationNeed}%)`);
      if (p.foodNeed < 30) parts.push(`⚠️ CRITICAL: Hungry (${p.foodNeed}%)`);
      
      // Addictions
      if (p.addictions.length > 0) {
        parts.push(`Addictions: ${p.addictions.join(', ')}`);
      }
      if (p.inWithdrawal.length > 0) {
        parts.push(`⚠️ IN WITHDRAWAL: ${p.inWithdrawal.join(', ')}`);
      }
      
      // Sleep deprivation
      if (p.sleepDeprived) {
        parts.push(`😴 Sleep deprived (${p.sleepLevel}%) - cognitive impairment`);
      }
      
      return parts.join('\n');
    }
    
    // Normal
    const issues = [];
    if (p.energy < 30) issues.push('low energy');
    if (p.tiredness > 70) issues.push('exhausted');
    if (p.inWithdrawal.length > 0) issues.push('withdrawal');
    
    return issues.length > 0 
      ? `Energy: ${p.energy}% (${issues.join(', ')})`
      : `Energy: ${p.energy}%`;
  }
  
  /**
   * Get physical directives
   */
  getDirectives() {
    if (!this.cache) this.synthesize();
    
    const directives = [];
    const p = this.cache;
    
    // Energy-based
    if (p.energy < 30) {
      directives.push('very short/terse responses', 'zero patience', 'minimal engagement');
    } else if (p.energy < 50) {
      directives.push('concise responses', 'less patience');
    } else if (p.energy > 80) {
      directives.push('can be verbose', 'willing to tangent');
    }
    
    // Tiredness
    if (p.tiredness > 80) {
      directives.push('confused/foggy', 'may make typos', 'less coherent');
    }
    
    // Critical needs
    if (p.restNeed < 20) {
      directives.push('irritable', 'want to disengage', 'mention being tired');
    }
    if (p.stimulationNeed < 20) {
      directives.push('BORED', 'want chaos/drama', 'provocative');
    }
    
    // Withdrawal
    if (p.inWithdrawal.includes('caffeine')) {
      directives.push('headache', 'cranky', 'mention needing coffee');
    }
    if (p.inWithdrawal.includes('attention')) {
      directives.push('attention-seeking', 'provocative', 'want engagement');
    }
    
    // Sleep deprivation
    if (p.sleepDeprived) {
      directives.push('less filter', 'weird tangents', 'impaired judgment');
    }
    
    return directives;
  }
  
  // Helpers
  extractAddictions() {
    const addictionState = this.bot.addictionSystem?.getWithdrawalState?.() || {};
    return Object.keys(addictionState).filter(k => addictionState[k]?.isAddicted);
  }
  
  checkWithdrawal() {
    const addictionState = this.bot.addictionSystem?.getWithdrawalState?.() || {};
    return Object.keys(addictionState).filter(k => addictionState[k]?.inWithdrawal);
  }
  
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  
  /**
   * Get health status of this synthesizer
   */
  getHealth() {
    const now = Date.now();
    const cacheAge = this.cache ? now - this.lastUpdate : null;
    const isStale = cacheAge && cacheAge > 60000;
    
    return {
      name: 'PhysicalSynthesizer',
      isRunning: !!this.timer,
      lastSynthesis: this.lastUpdate,
      cacheAge,
      isStale,
      updateInterval: this.updateInterval,
      hasCache: !!this.cache
    };
  }
}

module.exports = PhysicalSynthesizer;
