/**
 * EMOTIONAL SYNTHESIZER
 * 
 * Aggregates all emotion-related systems:
 * - Mood tracking
 * - Emotional state
 * - Whiplash (rapid mood shifts)
 * - Drunk/High modes
 * - Mental health (depression, anxiety)
 * 
 * Provides: Current emotional state and how it affects behavior
 */

class EmotionalSynthesizer {
  constructor(chatBot) {
    this.bot = chatBot;
    this.cache = null;
    this.lastUpdate = 0;
    this.updateInterval = 30000; // Update every 30s
    
    // Start synthesis loop
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
   * Synthesize emotional state from all emotion systems
   */
  synthesize() {
    const now = Date.now();
    
    try {
      // Get mood data properly
      const moodData = this.bot.moodTracker?.getMood() || {};
      
      const emotional = {
        // Core mood
        mood: moodData.mood || 'neutral',
        moodIntensity: moodData.intensity || 0.5,
        momentum: this.detectMomentum(),
        
        // Mental health
        depression: this.clamp(this.bot.mentalStateSystem?.getState()?.depression || 0, 0, 100),
        anxiety: this.clamp(this.bot.mentalStateSystem?.getState()?.anxiety || 0, 0, 100),
        confidence: this.clamp(this.bot.mentalStateSystem?.getState()?.confidence || 70, 0, 100),
        
        // Altered states
        isDrunk: this.bot.drunkMode?.isDrunk || false,
        drunkLevel: this.bot.drunkMode?.drunkLevel || 0,
        isHigh: this.bot.highMode?.isHigh || false,
        highLevel: this.bot.highMode?.highLevel || 0,
        
        // Emotional volatility
        whiplashActive: this.bot.emotionalWhiplash?.isActive || false,
        recentShifts: this.bot.emotionalWhiplash?.getRecentShifts?.() || [],
        
        timestamp: now
      };
      
      this.cache = emotional;
      this.lastUpdate = now;
      
      return emotional;
    } catch (error) {
      console.error('❌ [EmotionalSynthesizer] Error:', error.message);
      return this.cache || {
        mood: 'neutral',
        moodIntensity: 0.5,
        momentum: 0,
        depression: 0,
        anxiety: 0,
        confidence: 70,
        isDrunk: false,
        drunkLevel: 0,
        isHigh: false,
        highLevel: 0,
        whiplashActive: false,
        recentShifts: [],
        timestamp: now
      };
    }
  }
  
  /**
   * Get emotional context for responses
   * Can specify detail level: 'brief', 'normal', 'detailed'
   */
  getContext(detailLevel = 'normal') {
    // Refresh if stale
    if (!this.cache || Date.now() - this.lastUpdate > 60000) {
      this.synthesize();
    }
    
    const e = this.cache;
    
    if (detailLevel === 'brief') {
      // Minimal context for simple messages
      return `Mood: ${e.mood} (${e.moodIntensity}/10)`;
    }
    
    if (detailLevel === 'detailed') {
      // Full emotional breakdown
      const parts = [
        `=== EMOTIONAL STATE ===`,
        `Mood: ${e.mood} (intensity: ${e.moodIntensity}/10, ${e.momentum})`,
        e.depression > 30 ? `Depression: ${e.depression}% (affecting outlook)` : null,
        e.anxiety > 40 ? `Anxiety: ${e.anxiety}% (on edge)` : null,
        e.confidence < 50 ? `Confidence: ${e.confidence}% (insecure)` : null,
        e.isDrunk ? `DRUNK (${e.drunkLevel}% - inhibitions lowered)` : null,
        e.isHigh ? `HIGH (${e.highLevel}% - mellowed out)` : null,
        e.whiplashActive ? `Emotional whiplash active - mood volatile` : null
      ];
      
      return parts.filter(p => p).join('\n');
    }
    
    // Normal context
    return `Mood: ${e.mood} (${e.moodIntensity}/10, ${e.momentum})${e.isDrunk ? ', DRUNK' : ''}${e.isHigh ? ', HIGH' : ''}`;
  }
  
  /**
   * Get specific emotional directives
   */
  getDirectives() {
    if (!this.cache) this.synthesize();
    
    const directives = [];
    const e = this.cache;
    
    // Mood-based
    if (e.mood.includes('irritated') || e.mood.includes('annoyed')) {
      directives.push('defensive/snippy tone', 'less patience', 'more argumentative');
    } else if (e.mood.includes('happy') || e.mood.includes('excited')) {
      directives.push('playful/generous', 'more engagement');
    } else if (e.mood.includes('sad') || e.mood.includes('depressed')) {
      directives.push('cynical outlook', 'less enthusiasm');
    }
    
    // Mental health
    if (e.depression > 50) {
      directives.push('darker humor', 'nihilistic edge');
    }
    if (e.anxiety > 60) {
      directives.push('nervous/jittery', 'overthinking');
    }
    if (e.confidence < 30) {
      directives.push('insecure but hiding it', 'sensitive to criticism');
    }
    
    // Altered states
    if (e.isDrunk) {
      directives.push('less filtered', 'more honest/blunt', 'looser grammar');
    }
    if (e.isHigh) {
      directives.push('mellowed out', 'more philosophical', 'slower responses');
    }
    
    return directives;
  }
  
  // Helpers
  calculateIntensity() {
    const emotionalState = this.bot.emotionalEngine?.getEmotionalState() || {};
    const metrics = [
      emotionalState.intensity || 5,
      Math.abs(emotionalState.valence || 0) * 10,
      emotionalState.arousal ? emotionalState.arousal * 10 : 5
    ];
    return Math.round(metrics.reduce((a, b) => a + b, 0) / metrics.length);
  }
  
  detectMomentum() {
    // Check if mood is escalating or cooling
    const moodHistory = this.bot.moodTracker?.getHistory?.() || [];
    if (moodHistory.length < 3) return 'stable';
    
    const recent = moodHistory.slice(0, 3);
    const intensities = recent.map(m => m.intensity || 5);
    
    if (intensities[0] > intensities[1] && intensities[1] > intensities[2]) {
      return 'escalating';
    } else if (intensities[0] < intensities[1] && intensities[1] < intensities[2]) {
      return 'cooling';
    }
    return 'stable';
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
    const isStale = cacheAge && cacheAge > 60000; // Stale if > 60s
    
    return {
      name: 'EmotionalSynthesizer',
      isRunning: !!this.timer,
      lastSynthesis: this.lastUpdate,
      cacheAge,
      isStale,
      updateInterval: this.updateInterval,
      hasCache: !!this.cache
    };
  }
}

module.exports = EmotionalSynthesizer;
