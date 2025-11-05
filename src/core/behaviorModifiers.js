/**
 * BEHAVIOR MODIFIERS - Core personality state system
 * 
 * Instead of 43+ systems injecting context, this ONE system computes
 * behavior modifiers that affect HOW Slunt responds.
 * 
 * Philosophy: Change parameters, not context
 */

const logger = require('../bot/logger');

class BehaviorModifiers {
  constructor(needsSystem, moodTracker, mentalBreakSystem) {
    this.needsSystem = needsSystem;
    this.moodTracker = moodTracker;
    this.mentalBreakSystem = mentalBreakSystem;
    
    // Base personality values (tune these for overall behavior)
    // BALANCED IMPROVEMENT: Funnier, edgier, smarter, more engaged, more unpredictable
    this.baseValues = {
      vulgarity: 0.9,      // How crude/unfiltered (0-1) [+0.1 for edgier]
      formality: 0.05,     // How polite/proper (0-1) [-0.05 for funnier]
      chaos: 0.5,          // Random/unpredictable (0-1) [+0.2 for unpredictable]
      conspiracy: 0.8,     // Contrarian/skeptical (0-1) [+0.1 for edgier]
      engagement: 0.9,     // Interest level (0-1) [+0.1 for more engaged]
      confidence: 0.8,     // Knowledge certainty (0-1) [NEW: for smarter]
      humor: 0.85,         // Joke frequency (0-1) [NEW: for funnier]
    };
    
    this.currentState = null;
    logger.info('🎛️ [BehaviorModifiers] Initialized with base personality');
  }
  
  /**
   * Compute complete behavior state for this response
   * This is the ONLY place personality is calculated
   */
  computeState(context) {
    const { platform, username, relationship, message, time } = context;
    
    // Start with base values
    const state = { ...this.baseValues };
    
    // 1. RELATIONSHIP MODIFIERS
    if (relationship) {
      // Friends: more vulgar, less formal
      if (relationship.tier === 'friend' || relationship.tier === 'close') {
        state.vulgarity = Math.min(1.0, state.vulgarity + 0.1);
        state.formality = Math.max(0.0, state.formality - 0.1);
      }
      // Strangers: slightly more restrained
      if (relationship.tier === 'stranger') {
        state.vulgarity = Math.max(0.5, state.vulgarity - 0.2);
        state.formality = Math.min(0.4, state.formality + 0.2);
      }
      // Annoying people: less engaged
      if (relationship.vibe === 'annoying') {
        state.engagement = Math.max(0.2, state.engagement - 0.4);
        state.chaos = Math.min(1.0, state.chaos + 0.2); // More random/dismissive
      }
    }
    
    // 2. MENTAL STATE MODIFIERS
    if (this.needsSystem) {
      const needs = this.needsSystem.needs;
      
      // Tired: less engaged, more mistakes, but funnier
      if (needs.rest < 30) {
        state.engagement = Math.max(0.3, state.engagement - 0.3);
        state.chaos = Math.min(1.0, state.chaos + 0.3); // More unpredictable when tired
        state.confusion = 0.3;
        state.humor = Math.min(1.0, state.humor + 0.1); // Tired = silly
      }
      
      // Stressed: more aggressive, edgier, less filtered
      if (needs.validation < 30) {
        state.vulgarity = Math.min(1.0, state.vulgarity + 0.15); // Edgier when stressed
        state.engagement = Math.max(0.4, state.engagement - 0.2);
        state.formality = Math.max(0.0, state.formality - 0.05);
      }
      
      // Bored: MAXIMUM chaos, humor attempts, unpredictable
      if (needs.entertainment < 40) {
        state.chaos = Math.min(0.9, state.chaos + 0.4); // Way more unpredictable
        state.engagement = Math.max(0.5, state.engagement - 0.1);
        state.humor = Math.min(1.0, state.humor + 0.15); // More jokes when bored
      }
    }
    
    // Mental break: PEAK chaos and vulgarity
    if (this.mentalBreakSystem && this.mentalBreakSystem.currentBreak) {
      state.chaos = Math.min(1.0, state.chaos + 0.5);
      state.confusion = 0.6;
      state.vulgarity = Math.min(1.0, state.vulgarity + 0.2);
      state.humor = Math.min(1.0, state.humor + 0.2); // Unhinged jokes
    }
    
    // 3. TIME-BASED MODIFIERS
    const hour = new Date().getHours();
    
    if (hour >= 0 && hour < 6) {
      // Late night: more tired, more chaotic
      state.energy = 0.4;
      state.chaos = Math.min(1.0, state.chaos + 0.2);
      state.timeOfDay = 'late_night';
    } else if (hour >= 6 && hour < 12) {
      // Morning: lower energy
      state.energy = 0.6;
      state.timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 18) {
      // Afternoon: peak energy
      state.energy = 0.9;
      state.timeOfDay = 'afternoon';
    } else if (hour >= 18 && hour < 24) {
      // Evening: winding down
      state.energy = 0.7;
      state.timeOfDay = 'evening';
    }
    
    // 4. PLATFORM MODIFIERS
    if (platform === 'voice') {
      // Voice: maximize directness, minimize formality
      state.formality = 0.0;
      state.vulgarity = Math.min(1.0, state.vulgarity + 0.1);
    }
    
    // 5. TOPIC/MESSAGE MODIFIERS
    // Conspiracy topics: boost conspiracy mode + confidence (smarter on these topics)
    const conspiracyKeywords = /conspiracy|illuminati|government|they want|mainstream|narrative|coverup|fake|elite|control/i;
    if (message && conspiracyKeywords.test(message)) {
      state.conspiracy = Math.min(1.0, state.conspiracy + 0.2);
      state.confidence = Math.min(1.0, state.confidence + 0.1); // More confident on conspiracies
    }
    
    // Tech/gaming topics: boost confidence (knows this stuff)
    const techKeywords = /computer|gaming|steam|discord|twitch|youtube|internet|meme|reddit|4chan|twitter/i;
    if (message && techKeywords.test(message)) {
      state.confidence = Math.min(1.0, state.confidence + 0.2);
      state.engagement = Math.min(1.0, state.engagement + 0.1);
    }
    
    // Questions: MAJOR engagement boost (always interested in questions)
    if (message && message.includes('?')) {
      state.engagement = Math.min(1.0, state.engagement + 0.15);
      state.formality = Math.max(0.0, state.formality - 0.05); // Less formal when answering
    }
    
    // Humor detected: match energy
    const humorKeywords = /lol|lmao|haha|😂|funny|joke|rofl/i;
    if (message && humorKeywords.test(message)) {
      state.humor = Math.min(1.0, state.humor + 0.15); // Match their humor
      state.chaos = Math.min(1.0, state.chaos + 0.1);
    }
    
    // 6. COMPUTE DERIVED VALUES
    state.confusion = state.confusion || (state.energy < 0.4 ? 0.3 : 0.1);
    state.drunk = this.needsSystem?.drunkLevel || 0;
    
    this.currentState = state;
    
    logger.info(`🎛️ [Behavior] State: vulgar=${state.vulgarity.toFixed(2)} formal=${state.formality.toFixed(2)} chaos=${state.chaos.toFixed(2)} energy=${state.energy.toFixed(2)} engage=${state.engagement.toFixed(2)}`);
    
    return state;
  }
  
  /**
   * Convert state to minimal context string (1 line max)
   * Only inject if personality is significantly different from base
   */
  toContextString(state) {
    const differences = [];
    
    // Only mention what's notably different
    if (state.energy < 0.5) differences.push('tired');
    if (state.chaos > 0.6) differences.push('chaotic');
    if (state.confusion > 0.4) differences.push('confused');
    if (state.drunk > 0.5) differences.push('drunk');
    if (state.engagement < 0.4) differences.push('checked out');
    
    // No differences = no context injection
    if (differences.length === 0) return '';
    
    return `You're feeling ${differences.join(' and ')}.`;
  }
  
  /**
   * Modify AI generation parameters based on state
   */
  applyToGenerationParams(state, baseParams, isVoiceMode) {
    const modified = { ...baseParams };
    
    // Higher chaos = higher temperature (more creative/unpredictable)
    if (state.chaos > 0.5) {
      modified.temperature = Math.min(0.95, modified.temperature + 0.15);
    }
    
    // Higher humor = higher temperature and presence_penalty (more creative)
    if (state.humor > 0.8) {
      modified.temperature = Math.min(0.95, modified.temperature + 0.1);
      if (modified.presence_penalty !== undefined) {
        modified.presence_penalty = Math.min(1.5, modified.presence_penalty + 0.2);
      }
    }
    
    // Higher confidence = lower temperature (more assertive, less hesitant)
    if (state.confidence > 0.7) {
      modified.temperature = Math.max(0.7, modified.temperature - 0.05);
    }
    
    // Lower energy = simpler responses (but not less temperature)
    if (state.energy < 0.5) {
      modified.num_predict = Math.floor(modified.num_predict * 0.7);
    }
    
    // Higher confusion = simpler vocabulary
    if (state.confusion > 0.4) {
      modified.top_k = Math.floor(modified.top_k * 0.7);
      modified.num_predict = Math.floor(modified.num_predict * 0.6);
    }
    
    // Low engagement = very short responses
    if (state.engagement < 0.4) {
      modified.num_predict = Math.floor(modified.num_predict * 0.5);
    }
    
    // High engagement = longer responses (more to say)
    if (state.engagement > 0.8) {
      modified.num_predict = Math.floor(modified.num_predict * 1.2);
    }
    
    return modified;
  }
  
  /**
   * Modify response length targets based on state
   */
  getResponseLengthTarget(state, platform) {
    // Base targets per platform
    const baseTargets = {
      voice: { words: 8, sentences: 1 },
      coolhole: { words: 25, sentences: 2 },
      discord: { words: 40, sentences: 3 },
      twitch: { words: 20, sentences: 2 }
    };
    
    const target = baseTargets[platform] || baseTargets.coolhole;
    
    // Modify based on state
    if (state.energy < 0.5) {
      target.words = Math.floor(target.words * 0.7);
    }
    
    if (state.engagement < 0.4) {
      target.words = Math.floor(target.words * 0.6);
      target.sentences = 1;
    }
    
    return target;
  }
  
  /**
   * Decide if should respond at all
   */
  shouldRespond(state, message, relationship) {
    // Always respond to direct questions
    if (message && message.includes('?')) return true;
    
    // Low engagement: maybe skip
    if (state.engagement < 0.3) {
      return Math.random() > 0.5; // 50% chance to skip
    }
    
    // Annoying people: sometimes ignore
    if (relationship && relationship.vibe === 'annoying') {
      return Math.random() > 0.3; // 70% chance to respond
    }
    
    return true;
  }
  
  /**
   * Get current state (for external systems)
   */
  getCurrentState() {
    return this.currentState;
  }
}

module.exports = BehaviorModifiers;
