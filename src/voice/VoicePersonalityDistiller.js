/**
 * Voice Personality Distiller
 * Condenses Slunt's full personality into 2-3 sentence summaries for fast voice responses
 */

class VoicePersonalityDistiller {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.cache = {
      lastUpdate: 0,
      summary: '',
      ttl: 30000 // Regenerate every 30 seconds
    };
  }

  /**
   * Distill current personality state into ultra-compact summary
   * @returns {string} 2-3 sentence personality snapshot
   */
  async distill() {
    // Use cache if fresh
    const now = Date.now();
    if (this.cache.summary && (now - this.cache.lastUpdate) < this.cache.ttl) {
      return this.cache.summary;
    }

    // === GATHER KEY PERSONALITY SIGNALS ===
    
    // Current mood & energy
    const mood = this.chatBot.lifeSystem?.currentMood || 'chill';
    const energy = this.chatBot.needsSystem?.needs?.energy || 75;
    
    // Current fixation (autism system)
    const fixation = this.chatBot.autismFixation?.getCurrentFixation();
    
    // Active mental state
    const mentalState = this.chatBot.mentalBreakSystem?.getCurrentState?.() || 'stable';
    
    // Active addiction/craving
    const craving = this.getStrongestCraving();
    
    // Current personality lock-in
    const personalityMode = this.chatBot.personalityLockIn?.currentMode || 'balanced';
    
    // Recent emotional momentum
    const emotionalMomentum = this.chatBot.emotionalMomentum?.getCurrentMomentum?.() || 'neutral';

    // === BUILD DISTILLED SUMMARY ===
    const summary = this.buildSummary({
      mood,
      energy,
      fixation,
      mentalState,
      craving,
      personalityMode,
      emotionalMomentum
    });

    // Cache it
    this.cache.summary = summary;
    this.cache.lastUpdate = now;

    return summary;
  }

  /**
   * Build compact personality summary from signals
   */
  buildSummary(signals) {
    const parts = [];

    // Mood + Energy
    if (signals.energy < 30) {
      parts.push(`Exhausted (${signals.mood})`);
    } else if (signals.energy > 80) {
      parts.push(`Energized (${signals.mood})`);
    } else {
      parts.push(`Feeling ${signals.mood}`);
    }

    // Personality mode modifier
    const modeDescriptions = {
      edgy: 'being provocative and boundary-pushing',
      chaotic: 'unpredictable and chaotic',
      analytical: 'thoughtful and analytical',
      hype: 'enthusiastic and hyped',
      chill: 'relaxed and easygoing'
    };
    if (signals.personalityMode && modeDescriptions[signals.personalityMode]) {
      parts.push(modeDescriptions[signals.personalityMode]);
    }

    // Active fixation or craving
    if (signals.fixation) {
      parts.push(`obsessed with ${signals.fixation}`);
    } else if (signals.craving) {
      parts.push(`craving ${signals.craving}`);
    }

    // Mental state if abnormal
    if (signals.mentalState !== 'stable' && signals.mentalState !== 'normal') {
      parts.push(`mentally ${signals.mentalState}`);
    }

    // Combine into 1-2 sentences
    if (parts.length === 0) {
      return 'Normal balanced state.';
    } else if (parts.length <= 2) {
      return parts.join(', ') + '.';
    } else {
      // Group into sentences
      const sentence1 = parts.slice(0, 2).join(', ');
      const sentence2 = parts.slice(2).join(', ');
      return `${sentence1}. ${sentence2}.`;
    }
  }

  /**
   * Get strongest active craving/addiction
   */
  getStrongestCraving() {
    if (!this.chatBot.addictionSystem) return null;

    const addictions = this.chatBot.addictionSystem.addictions || {};
    let strongest = null;
    let maxIntensity = 0;

    for (const [name, data] of Object.entries(addictions)) {
      if (data.intensity > maxIntensity) {
        maxIntensity = data.intensity;
        strongest = name;
      }
    }

    return maxIntensity > 0.5 ? strongest : null;
  }
}

module.exports = VoicePersonalityDistiller;
