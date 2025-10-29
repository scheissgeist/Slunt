/**
 * Typing Simulator
 * Makes Slunt appear more human by simulating realistic typing speeds
 */

class TypingSimulator {
  constructor() {
    // Base typing speeds (WPM - words per minute) - OPTIMIZED FOR FASTER CHAT
    this.baseWPM = {
      min: 60,  // Slow typing
      max: 120,  // Fast typing
      average: 90  // Increased from 65 to 90
    };
    
    // Factors that affect typing speed
    this.factors = {
      complexity: 1.0,  // Complex thoughts = slower typing
      emotion: 1.0,     // Excited = faster, depressed = slower
      confidence: 1.0,  // Low confidence = more hesitation
      length: 1.0       // Longer messages = slight speedup (momentum)
    };
    
    // Realistic pauses (in ms) - REDUCED FOR FASTER RESPONSE
    this.pauses = {
      thinking: [300, 800],      // Before starting to type (was 800-2000)
      hesitation: [100, 400],     // Mid-sentence pause (was 200-800)
      punctuation: [50, 150],    // After periods, commas (was 100-300)
      correction: [200, 600]     // Backspace/rethink moment (was 500-1500)
    };
    
    // Stats
    this.totalSimulations = 0;
    this.averageDelay = 0;
  }

  /**
   * Calculate typing time for a message
   * Returns delay in milliseconds before sending
   */
  calculateTypingTime(message, context = {}) {
    const {
      mentalState = null,
      mood = null,
      complexity = 'normal',
      isExcited = false
    } = context;
    
    // Base calculation: characters per minute
    const charCount = message.length;
    const wordCount = message.split(/\s+/).length;
    
    // Adjust WPM based on context
    let wpm = this.baseWPM.average;
    
    // Mental state affects speed
    if (mentalState) {
      // Depression slows typing
      wpm -= (mentalState.depression || 0) * 20;
      
      // Anxiety makes typing erratic (average out to slightly slower)
      wpm -= (mentalState.anxiety || 0) * 10;
      
      // Low confidence = more hesitation
      if (mentalState.confidence < 0.5) {
        wpm -= (1 - mentalState.confidence) * 15;
      }
      
      // ADRENOCHROME MODE = INSANELY FAST
      if (mentalState.overallState === 'ADRENOCHROME_MODE') {
        wpm = this.baseWPM.max * 1.5; // 127 WPM - typing like a maniac
        // Skip most pauses
        return this.calculateRawTypingTime(charCount, wpm) + this.randomPause('thinking', 0.3);
      }
    }
    
    // Mood affects speed
    if (mood) {
      if (mood === 'excited' || mood === 'energetic') {
        wpm += 15;
      } else if (mood === 'sad' || mood === 'tired') {
        wpm -= 20;
      } else if (mood === 'anxious') {
        wpm -= 10;
      }
    }
    
    // Complexity affects speed
    if (complexity === 'complex' || message.match(/\b(philosophical|existential|metaphor)\b/i)) {
      wpm -= 15; // Think harder = type slower
    }
    
    // Excitement override
    if (isExcited || message.match(/[!]{2,}|[A-Z]{4,}/)) {
      wpm += 20; // Excited = faster typing
    }
    
    // Length momentum (slightly faster on longer messages)
    if (wordCount > 15) {
      wpm += 5;
    }
    
    // Clamp WPM to realistic range
    wpm = Math.max(30, Math.min(120, wpm));
    
    // Calculate base typing time
    const baseTime = this.calculateRawTypingTime(charCount, wpm);
    
    // Add realistic pauses
    let totalTime = baseTime;
    
    // Initial thinking pause
    totalTime += this.randomPause('thinking');
    
    // Sentence pauses (periods, question marks)
    const sentences = message.split(/[.!?]+/).length - 1;
    totalTime += sentences * this.randomPause('punctuation');
    
    // Occasional hesitation (10% chance per message) - REDUCED
    if (Math.random() < 0.1) {
      totalTime += this.randomPause('hesitation');
    }
    
    // Rare correction moment (3% chance - backspace and retype) - REDUCED
    if (Math.random() < 0.03 && wordCount > 5) {
      totalTime += this.randomPause('correction');
    }
    
    // Add natural variance (±10%) - REDUCED for consistency
    const variance = 0.9 + Math.random() * 0.2;
    totalTime *= variance;
    
    // Track stats
    this.totalSimulations++;
    this.averageDelay = ((this.averageDelay * (this.totalSimulations - 1)) + totalTime) / this.totalSimulations;
    
    return Math.round(totalTime);
  }

  /**
   * Calculate raw typing time without pauses
   */
  calculateRawTypingTime(charCount, wpm) {
    // Average word length: 5 characters
    // WPM to characters per minute: WPM * 5
    const cpm = wpm * 5;
    
    // Convert to milliseconds
    const timeInMinutes = charCount / cpm;
    const timeInMs = timeInMinutes * 60 * 1000;
    
    return timeInMs;
  }

  /**
   * Get random pause duration
   */
  randomPause(type, multiplier = 1.0) {
    const range = this.pauses[type] || [0, 0];
    const min = range[0] * multiplier;
    const max = range[1] * multiplier;
    return min + Math.random() * (max - min);
  }

  /**
   * Simulate typing with live updates (shows "..." in chat)
   * Returns promise that resolves after typing time
   */
  async simulateTyping(message, context = {}, onProgress = null) {
    const totalTime = this.calculateTypingTime(message, context);
    const startTime = Date.now();
    
    // If callback provided, send periodic updates
    if (onProgress) {
      const updateInterval = 500; // Update every 500ms
      const updates = Math.floor(totalTime / updateInterval);
      
      for (let i = 0; i < updates; i++) {
        await this.sleep(updateInterval);
        const elapsed = Date.now() - startTime;
        const progress = elapsed / totalTime;
        onProgress(progress);
      }
    }
    
    // Wait for remaining time
    const elapsed = Date.now() - startTime;
    const remaining = totalTime - elapsed;
    if (remaining > 0) {
      await this.sleep(remaining);
    }
    
    return totalTime;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get typing speed description
   */
  getTypingSpeedDescription(wpm) {
    if (wpm < 40) return 'very slow (thinking hard)';
    if (wpm < 60) return 'slow (careful)';
    if (wpm < 80) return 'normal';
    if (wpm < 100) return 'fast (confident)';
    return 'very fast (excited/manic)';
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    return {
      totalSimulations: this.totalSimulations,
      averageDelayMs: Math.round(this.averageDelay),
      averageDelaySec: (this.averageDelay / 1000).toFixed(1),
      baseWPM: this.baseWPM
    };
  }

  /**
   * Format time for logging
   */
  formatTime(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
}

module.exports = TypingSimulator;
