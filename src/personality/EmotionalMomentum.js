/**
 * EMOTIONAL MOMENTUM SYSTEM
 * 
 * Models realistic emotional transitions with momentum and inertia
 * Prevents instant mood switches - emotions have weight and direction
 * 
 * Like a pendulum: hard to change direction, easier to accelerate in current direction
 */

const fs = require('fs');
const path = require('path');

class EmotionalMomentum {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/emotional_momentum.json');
    
    // Current state
    this.currentMood = 'neutral';
    this.intensity = 0.5; // 0-1
    this.momentum = 0; // -1 (very negative) to 1 (very positive)
    this.inertia = 0.7; // 0-1, how resistant to change (0.7 = moderately resistant)
    
    // History for tracking patterns
    this.moodHistory = [];
    this.transitionCount = 0;
    
    // Load saved state
    this.load();
    
    console.log('🎭 [EmotionalMomentum] Initialized');
    console.log(`   Current: ${this.currentMood} (momentum: ${this.momentum.toFixed(2)})`);
  }
  
  /**
   * Update mood based on new emotion/trigger
   */
  updateMood(newEmotion, trigger = '', intensity = 0.5) {
    const oldMood = this.currentMood;
    const oldMomentum = this.momentum;
    
    // Calculate polarity of new emotion
    const newPolarity = this.getEmotionPolarity(newEmotion);
    
    // Calculate momentum change
    const momentumDelta = (newPolarity * intensity) - this.momentum;
    
    // Apply inertia based on direction change
    const isReversal = Math.sign(momentumDelta) !== Math.sign(this.momentum) && Math.abs(this.momentum) > 0.1;
    
    if (isReversal) {
      // Trying to reverse direction - apply heavy inertia
      this.momentum += momentumDelta * (1 - this.inertia);
      console.log(`🔄 [EmotionalMomentum] Resisting reversal: ${oldMood} → ${newEmotion} (inertia: ${this.inertia})`);
    } else {
      // Same direction or neutral - accelerate faster
      const accelerationFactor = 0.3 + (Math.abs(this.momentum) * 0.2); // Faster when already moving
      this.momentum += momentumDelta * accelerationFactor;
    }
    
    // Clamp momentum
    this.momentum = Math.max(-1, Math.min(1, this.momentum));
    
    // Update mood based on momentum
    const newMood = this.momentumToMood(this.momentum);
    
    // Update intensity based on momentum strength
    this.intensity = Math.abs(this.momentum);
    
    // Track history
    if (newMood !== this.currentMood) {
      this.moodHistory.push({
        from: this.currentMood,
        to: newMood,
        trigger,
        timestamp: Date.now(),
        momentum: this.momentum,
        wasReversal: isReversal
      });
      
      // Keep last 50 transitions
      if (this.moodHistory.length > 50) {
        this.moodHistory.shift();
      }
      
      this.transitionCount++;
    }
    
    this.currentMood = newMood;
    
    // Decay momentum slightly over time (natural return to neutral)
    this.applyDecay();
    
    // Log significant changes
    if (Math.abs(this.momentum - oldMomentum) > 0.2) {
      console.log(`🎭 [EmotionalMomentum] ${oldMood} → ${newMood} (momentum: ${oldMomentum.toFixed(2)} → ${this.momentum.toFixed(2)})`);
    }
    
    return {
      mood: this.currentMood,
      intensity: this.intensity,
      momentum: this.momentum,
      wasReversal: isReversal
    };
  }
  
  /**
   * Get emotional polarity of emotion (-1 to 1)
   */
  getEmotionPolarity(emotion) {
    const polarities = {
      // Positive emotions
      'happy': 0.8,
      'excited': 1.0,
      'manic': 1.0,
      'amused': 0.6,
      'content': 0.4,
      'calm': 0.2,
      'hopeful': 0.5,
      
      // Negative emotions
      'sad': -0.6,
      'depressed': -0.8,
      'angry': -0.7,
      'furious': -1.0,
      'anxious': -0.5,
      'scared': -0.6,
      'disgusted': -0.5,
      'frustrated': -0.6,
      
      // Neutral
      'neutral': 0,
      'bored': -0.2,
      'tired': -0.3
    };
    
    return polarities[emotion.toLowerCase()] || 0;
  }
  
  /**
   * Convert momentum value to mood label
   */
  momentumToMood(momentum) {
    if (momentum > 0.7) return 'manic';
    if (momentum > 0.4) return 'excited';
    if (momentum > 0.2) return 'happy';
    if (momentum > -0.2) return 'neutral';
    if (momentum > -0.4) return 'sad';
    if (momentum > -0.6) return 'depressed';
    return 'furious';
  }
  
  /**
   * Apply natural decay toward neutral
   */
  applyDecay() {
    const decayRate = 0.05; // Slow return to neutral
    
    if (Math.abs(this.momentum) > 0.1) {
      this.momentum *= (1 - decayRate);
    } else {
      this.momentum = 0; // Snap to zero when close
    }
  }
  
  /**
   * Get current state for context
   */
  getState() {
    return {
      mood: this.currentMood,
      intensity: this.intensity,
      momentum: this.momentum,
      direction: this.momentum > 0 ? 'positive' : this.momentum < 0 ? 'negative' : 'neutral',
      stability: 1 - Math.abs(this.momentum) // How stable/calm
    };
  }
  
  /**
   * Get context string for AI
   */
  getContext() {
    const state = this.getState();
    
    let context = `🎭 Emotional Momentum: ${state.mood} (intensity: ${(state.intensity * 100).toFixed(0)}%)`;
    
    if (Math.abs(state.momentum) > 0.5) {
      context += `\n   ⚡ Strong ${state.direction} momentum - hard to change direction`;
    } else if (Math.abs(state.momentum) < 0.2) {
      context += `\n   🌊 Emotional stability - open to influence`;
    }
    
    // Recent transitions
    const recentTransitions = this.moodHistory.slice(-3);
    if (recentTransitions.length > 0) {
      const transitions = recentTransitions.map(t => `${t.from}→${t.to}`).join(', ');
      context += `\n   📊 Recent: ${transitions}`;
    }
    
    return context;
  }
  
  /**
   * Get behavioral directives based on momentum
   */
  getDirectives() {
    const directives = [];
    const state = this.getState();
    
    // High momentum = resist change
    if (Math.abs(state.momentum) > 0.6) {
      directives.push(`Stay in ${state.mood} mood - you have strong emotional momentum`);
    }
    
    // Negative momentum = darker responses
    if (state.momentum < -0.5) {
      directives.push('Express cynicism, darkness, or irritability');
    }
    
    // Positive momentum = lighter responses
    if (state.momentum > 0.5) {
      directives.push('Express enthusiasm, energy, or optimism');
    }
    
    // Recent reversal = whiplash
    const lastTransition = this.moodHistory[this.moodHistory.length - 1];
    if (lastTransition && lastTransition.wasReversal && Date.now() - lastTransition.timestamp < 60000) {
      directives.push('Emotional whiplash - acknowledge the rapid mood shift');
    }
    
    return directives;
  }
  
  /**
   * Simulate passage of time (decay)
   */
  tick(minutes = 1) {
    for (let i = 0; i < minutes; i++) {
      this.applyDecay();
    }
    
    return this.getState();
  }
  
  /**
   * Load saved state
   */
  load() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        this.currentMood = data.currentMood || 'neutral';
        this.momentum = data.momentum || 0;
        this.intensity = data.intensity || 0.5;
        this.moodHistory = data.moodHistory || [];
        this.transitionCount = data.transitionCount || 0;
      }
    } catch (error) {
      console.log('🎭 [EmotionalMomentum] No saved state, starting fresh');
    }
  }
  
  /**
   * Save state to disk
   */
  save() {
    try {
      const data = {
        currentMood: this.currentMood,
        momentum: this.momentum,
        intensity: this.intensity,
        moodHistory: this.moodHistory,
        transitionCount: this.transitionCount,
        lastSaved: Date.now()
      };
      
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [EmotionalMomentum] Save failed:', error.message);
    }
  }
}

module.exports = EmotionalMomentum;
