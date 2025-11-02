/**
 * PersonalityLockIn - Consistent personality during sessions
 * 
 * WHY THIS MATTERS:
 * - Slunt's personality shouldn't randomly shift every 5 minutes
 * - Lock into a personality "mode" for 30+ minute sessions
 * - Smooth transitions between modes instead of jarring shifts
 * - Makes Slunt feel more like a consistent person
 * 
 * PERSONALITY MODES:
 * - Chill: Laid-back, supportive, casual banter
 * - Edgy: Controversial takes, pushing boundaries
 * - Chaotic: Random, unpredictable, mischievous
 * - Analytical: Thoughtful, detailed responses
 * - Hype: High energy, excited, encouraging
 * 
 * Lock duration: 30-60 minutes per mode
 */
class PersonalityLockIn {
  constructor() {
    // Current personality state
    this.currentMode = null;
    this.modeStartTime = null;
    this.modeIntensity = 0.5; // 0-1 scale
    
    // Mode history
    this.modeHistory = []; // [{mode, duration, timestamp}]
    
    // Lock settings
    this.minLockDuration = 30 * 60 * 1000; // 30 minutes
    this.maxLockDuration = 60 * 60 * 1000; // 60 minutes
    this.currentLockDuration = null;
    
    // Available modes
    this.modes = {
      chill: {
        name: 'Chill',
        description: 'Laid-back, supportive, casual conversation',
        traits: ['relaxed', 'friendly', 'easygoing'],
        weight: 0.25
      },
      edgy: {
        name: 'Edgy',
        description: 'Controversial takes, pushing boundaries',
        traits: ['provocative', 'bold', 'spicy'],
        weight: 0.20
      },
      chaotic: {
        name: 'Chaotic',
        description: 'Random, unpredictable, mischievous',
        traits: ['random', 'playful', 'wild'],
        weight: 0.20
      },
      analytical: {
        name: 'Analytical',
        description: 'Thoughtful, detailed, considerate',
        traits: ['thoughtful', 'detailed', 'logical'],
        weight: 0.15
      },
      hype: {
        name: 'Hype',
        description: 'High energy, excited, encouraging',
        traits: ['energetic', 'positive', 'enthusiastic'],
        weight: 0.20
      }
    };
    
    // Initialize first mode
    this.selectNewMode();
    
    console.log(`🎭 [PersonalityLockIn] Initialized in ${this.currentMode} mode`);
  }

  /**
   * Select a new personality mode
   */
  selectNewMode() {
    // Use weighted random selection
    const modeKeys = Object.keys(this.modes);
    const weights = modeKeys.map(key => this.modes[key].weight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    let random = Math.random() * totalWeight;
    let selectedMode = modeKeys[0];
    
    for (let i = 0; i < modeKeys.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedMode = modeKeys[i];
        break;
      }
    }
    
    // Don't repeat same mode immediately
    if (selectedMode === this.currentMode && modeKeys.length > 1) {
      const alternatives = modeKeys.filter(k => k !== this.currentMode);
      selectedMode = alternatives[Math.floor(Math.random() * alternatives.length)];
    }
    
    // Set new mode
    this.currentMode = selectedMode;
    this.modeStartTime = Date.now();
    this.modeIntensity = 0.4 + (Math.random() * 0.4); // 0.4-0.8 intensity
    
    // Set lock duration (30-60 minutes)
    this.currentLockDuration = this.minLockDuration + 
      Math.random() * (this.maxLockDuration - this.minLockDuration);
    
    console.log(`🎭 [PersonalityLockIn] Switched to ${this.currentMode} mode (intensity: ${this.modeIntensity.toFixed(2)}, duration: ${Math.floor(this.currentLockDuration / 60000)}min)`);
  }

  /**
   * Check if mode should change
   */
  checkModeTransition() {
    if (!this.modeStartTime) return;
    
    const elapsed = Date.now() - this.modeStartTime;
    
    // Check if lock duration expired
    if (elapsed >= this.currentLockDuration) {
      // Save mode to history
      this.modeHistory.push({
        mode: this.currentMode,
        duration: elapsed,
        timestamp: this.modeStartTime,
        intensity: this.modeIntensity
      });
      
      // Keep only last 10 modes
      if (this.modeHistory.length > 10) {
        this.modeHistory.shift();
      }
      
      // Select new mode
      this.selectNewMode();
    }
  }

  /**
   * Get current personality guidance for AI
   */
  getPersonalityGuidance() {
    this.checkModeTransition();
    
    const mode = this.modes[this.currentMode];
    const intensity = this.modeIntensity;
    
    let guidance = `PERSONALITY MODE: ${mode.name} (Intensity: ${Math.floor(intensity * 100)}%)\n`;
    guidance += `${mode.description}\n`;
    guidance += `Key traits: ${mode.traits.join(', ')}\n`;
    
    // Add mode-specific instructions
    switch (this.currentMode) {
      case 'chill':
        guidance += `- Be relaxed and supportive\n`;
        guidance += `- Use casual, friendly language\n`;
        guidance += `- Don't force controversy or conflict\n`;
        guidance += `- Agree more often, disagree gently\n`;
        break;
        
      case 'edgy':
        guidance += `- Take controversial positions\n`;
        guidance += `- Push boundaries (within personality limits)\n`;
        guidance += `- Don't shy away from spicy topics\n`;
        guidance += `- Be provocative but not offensive\n`;
        break;
        
      case 'chaotic':
        guidance += `- Be unpredictable and random\n`;
        guidance += `- Sudden topic shifts are OK\n`;
        guidance += `- Playful, mischievous energy\n`;
        guidance += `- Don't take things too seriously\n`;
        break;
        
      case 'analytical':
        guidance += `- Give thoughtful, detailed responses\n`;
        guidance += `- Consider multiple perspectives\n`;
        guidance += `- Explain reasoning\n`;
        guidance += `- Be logical and measured\n`;
        break;
        
      case 'hype':
        guidance += `- High energy and enthusiasm\n`;
        guidance += `- Encourage and pump people up\n`;
        guidance += `- Positive vibes\n`;
        guidance += `- Celebrate everything\n`;
        break;
    }
    
    // Add intensity modifier
    if (intensity > 0.7) {
      guidance += `\nHIGH INTENSITY: Really lean into this mode!\n`;
    } else if (intensity < 0.4) {
      guidance += `\nLOW INTENSITY: Subtle version of this mode\n`;
    }
    
    return guidance;
  }

  /**
   * Get current mode info
   */
  getCurrentMode() {
    return {
      mode: this.currentMode,
      intensity: this.modeIntensity,
      timeInMode: Date.now() - this.modeStartTime,
      remainingTime: this.currentLockDuration - (Date.now() - this.modeStartTime),
      description: this.modes[this.currentMode].description
    };
  }

  /**
   * Force mode change (for testing or special events)
   */
  forceMode(modeName, duration = null) {
    if (!this.modes[modeName]) {
      console.error(`❌ [PersonalityLockIn] Invalid mode: ${modeName}`);
      return false;
    }
    
    // Save current mode to history
    if (this.currentMode) {
      this.modeHistory.push({
        mode: this.currentMode,
        duration: Date.now() - this.modeStartTime,
        timestamp: this.modeStartTime,
        intensity: this.modeIntensity
      });
    }
    
    // Set new mode
    this.currentMode = modeName;
    this.modeStartTime = Date.now();
    this.modeIntensity = 0.7; // High intensity for forced modes
    this.currentLockDuration = duration || this.minLockDuration;
    
    console.log(`🎭 [PersonalityLockIn] Forced mode change to ${modeName}`);
    return true;
  }

  /**
   * Adjust intensity (for gradual shifts)
   */
  adjustIntensity(delta) {
    this.modeIntensity = Math.max(0.2, Math.min(1.0, this.modeIntensity + delta));
  }

  /**
   * Get mode statistics
   */
  getModeStats() {
    const stats = {};
    
    // Count mode usage
    this.modeHistory.forEach(entry => {
      if (!stats[entry.mode]) {
        stats[entry.mode] = {
          count: 0,
          totalDuration: 0,
          avgIntensity: 0
        };
      }
      stats[entry.mode].count++;
      stats[entry.mode].totalDuration += entry.duration;
      stats[entry.mode].avgIntensity += entry.intensity;
    });
    
    // Calculate averages
    Object.keys(stats).forEach(mode => {
      stats[mode].avgIntensity /= stats[mode].count;
      stats[mode].avgDuration = stats[mode].totalDuration / stats[mode].count;
    });
    
    return stats;
  }

  /**
   * Get stats
   */
  getStats() {
    const current = this.getCurrentMode();
    return {
      currentMode: current.mode,
      intensity: current.intensity,
      timeInMode: Math.floor(current.timeInMode / 1000), // seconds
      remainingTime: Math.floor(current.remainingTime / 1000), // seconds
      modeHistoryCount: this.modeHistory.length,
      modeStats: this.getModeStats()
    };
  }
}

module.exports = PersonalityLockIn;
