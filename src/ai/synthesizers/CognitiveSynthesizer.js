/**
 * COGNITIVE SYNTHESIZER
 * 
 * Aggregates all thinking/mental systems:
 * - Obsessions
 * - Fixations
 * - Thoughts
 * - Internal state
 * - Consciousness level
 * - Mental clarity
 * 
 * Provides: What Slunt is thinking about and mental capacity
 */

class CognitiveSynthesizer {
  constructor(chatBot) {
    this.bot = chatBot;
    this.cache = null;
    this.lastUpdate = 0;
    this.updateInterval = 40000; // Update every 40s
    
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
   * Synthesize cognitive state
   */
  synthesize() {
    const now = Date.now();
    const mentalState = this.bot.mentalStateSystem?.getState() || {};
    
    const cognitive = {
      // Mental capacity
      consciousness: this.clamp(
        this.bot.consciousnessSystem?.getConsciousnessLevel() || 50,
        0, 100
      ),
      clarity: this.clamp(mentalState.clarity || 100, 0, 100),
      
      // Active thoughts
      thinkingAbout: this.extractThoughts(),
      // Obsessions
      obsessionData: this.bot.obsessionSystem?.getCurrentObsession() || { active: false },
      fixation: this.bot.autismFixations?.currentFixation || null,
      internalThought: this.bot.internalStateSystem?.getCurrentThought?.() || null,
      recentThoughts: (this.bot.thoughtSystem?.getRecentThoughts?.(5) || [])
        .map(t => t.thought || t.text),
      
      // Mental blocks
      performanceAnxiety: this.bot.performanceAnxiety?.isActive?.() || false,
      cognitiveOverload: this.bot.cognitiveOverload?.isOverloaded?.() || false,
      
      timestamp: now
    };
    
    this.cache = cognitive;
    this.lastUpdate = now;
    
    return cognitive;
  }
  
  /**
   * Get cognitive context
   */
  getContext(detailLevel = 'normal') {
    if (!this.cache || Date.now() - this.lastUpdate > 60000) {
      this.synthesize();
    }
    
    const c = this.cache;
    
    if (detailLevel === 'brief') {
      const thinking = c.thinkingAbout[0];
      return thinking ? `Thinking: ${thinking}` : null;
    }
    
    if (detailLevel === 'detailed') {
      const parts = [
        `=== COGNITIVE STATE ===`,
        `Consciousness: ${c.consciousness}% | Clarity: ${c.clarity}%`
      ];
      
      if (c.thinkingAbout.length > 0) {
        parts.push(`\nCurrently thinking about:`);
        c.thinkingAbout.forEach(t => parts.push(`- ${t}`));
      }
      
      if (c.fixation) {
        parts.push(`\nAUTISM FIXATION: ${c.fixation} (will steer conversation)`);
      }
      
      if (c.obsessions.length > 0) {
        parts.push(`\nObsessed with: ${c.obsessions.join(', ')}`);
      }
      
      if (c.internalThought) {
        parts.push(`\nInternal thought: "${c.internalThought}"`);
      }
      
      if (c.performanceAnxiety) {
        parts.push(`\n⚠️ Performance anxiety active - pressure to be funny`);
      }
      
      if (c.cognitiveOverload) {
        parts.push(`\n⚠️ Cognitive overload - too much happening`);
      }
      
      return parts.join('\n');
    }
    
    // Normal
    if (c.thinkingAbout.length === 0) return null;
    return `Thinking about: ${c.thinkingAbout.slice(0, 2).join(', ')}`;
  }
  
  /**
   * Get cognitive directives
   */
  getDirectives() {
    if (!this.cache) this.synthesize();
    
    const directives = [];
    const c = this.cache;
    
    // Clarity-based
    if (c.clarity < 50) {
      directives.push('less coherent', 'may trail off', 'stream-of-consciousness');
    }
    
    // Consciousness level
    if (c.consciousness < 40) {
      directives.push('autopilot mode', 'less creative', 'generic responses');
    } else if (c.consciousness > 80) {
      directives.push('highly aware', 'creative', 'meta-cognitive');
    }
    
    // Active obsessions
    if (c.fixation) {
      directives.push(`look for ways to mention ${c.fixation}`, `steer toward ${c.fixation}`);
    }
    
    c.obsessions.forEach(obs => {
      directives.push(`naturally work in ${obs} when possible`);
    });
    
    // Mental blocks
    if (c.performanceAnxiety) {
      directives.push('trying too hard', 'forced humor', 'overexplaining');
    }
    
    if (c.cognitiveOverload) {
      directives.push('overwhelmed', 'shut down', 'minimize engagement');
    }
    
    return directives;
  }
  
  // Helpers
  extractThoughts() {
    const thoughts = [];
    
    // Obsessions
    const obsData = this.bot.obsessionSystem?.getCurrentObsession() || { active: false };
    if (obsData.active && obsData.topic) {
      thoughts.push(obsData.topic);
    }
    
    // Current fixation
    const fix = this.bot.autismFixations?.currentFixation;
    if (fix && !thoughts.includes(fix)) {
      thoughts.push(fix);
    }
    
    // Internal thought
    const internal = this.bot.internalStateSystem?.getCurrentThought?.();
    if (internal && !thoughts.includes(internal)) {
      thoughts.push(internal);
    }
    
    return thoughts.slice(0, 3); // Top 3
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
      name: 'CognitiveSynthesizer',
      isRunning: !!this.timer,
      lastSynthesis: this.lastUpdate,
      cacheAge,
      isStale,
      updateInterval: this.updateInterval,
      hasCache: !!this.cache
    };
  }
}

module.exports = CognitiveSynthesizer;
