/**
 * Self-Awareness System
 * Slunt can introspect his own internal state and report it authentically
 * When asked about his condition, he checks real metrics and responds accordingly
 */

class SelfAwarenessSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Question patterns that trigger self-awareness responses
    this.selfAwarenessPatterns = {
      // Drinking/drunk state
      drinking: /\b(drinking|drunk|wasted|hammered|tipsy|sober|alcohol|booze)\b/i,
      
      // Sleep/tiredness
      tired: /\b(tired|sleepy|exhausted|sleep|awake|rest|fatigue)\b/i,
      
      // Mood/emotional state
      mood: /\b(how (are|r) (you|u)|feeling|mood|happy|sad|depressed|anxious|angry)\b/i,
      
      // Mental state
      mental: /\b(mental|insane|crazy|losing it|breaking|sanity|stressed)\b/i,
      
      // Needs (hunger, social, etc)
      needs: /\b(hungry|eat|food|lonely|social|validated|purpose|stimulated)\b/i,
      
      // Energy level
      energy: /\b(energy|energetic|motivated|drive|alive)\b/i,
      
      // Addiction state
      addictions: /\b(addicted|addiction|craving|withdrawal|need)\b/i,
      
      // Obsessions/fixations
      obsessed: /\b(obsessed|fixated|into|favorite|loving)\b/i,
      
      // General status
      status: /\b(how (are|r) (you|u)|what's up|status|doing|going)\b/i
    };
    
    console.log('🧠 [SelfAwareness] System initialized - Slunt can introspect his state');
  }

  /**
   * Check if message is asking about Slunt's internal state
   */
  isAskingAboutState(text) {
    const lowerText = text.toLowerCase();
    
    // Must be asking about Slunt (or general question in direct reply)
    const mentionsSlunt = /\b(slunt|you|u|your|ur)\b/i.test(text);
    const isQuestion = text.includes('?');
    
    if (!mentionsSlunt && !isQuestion) return null;
    
    // Check which type of state question
    for (const [type, pattern] of Object.entries(this.selfAwarenessPatterns)) {
      if (pattern.test(lowerText)) {
        return type;
      }
    }
    
    return null;
  }

  /**
   * Generate authentic self-aware response based on real internal state
   */
  generateStateResponse(stateType, username) {
    let response = '';
    
    try {
      switch (stateType) {
        case 'drinking':
          response = this.getDrinkingResponse();
          break;
          
        case 'tired':
          response = this.getTirednessResponse();
          break;
          
        case 'mood':
          response = this.getMoodResponse();
          break;
          
        case 'mental':
          response = this.getMentalStateResponse();
          break;
          
        case 'needs':
          response = this.getNeedsResponse();
          break;
          
        case 'energy':
          response = this.getEnergyResponse();
          break;
          
        case 'addictions':
          response = this.getAddictionResponse();
          break;
          
        case 'obsessed':
          response = this.getObsessionResponse();
          break;
          
        case 'status':
          response = this.getGeneralStatusResponse(username);
          break;
      }
      
      if (response) {
        console.log(`🧠 [SelfAwareness] Generated ${stateType} response based on real metrics`);
      }
      
      return response;
    } catch (error) {
      console.warn(`⚠️ [SelfAwareness] Error generating ${stateType} response:`, error.message);
      return null;
    }
  }

  /**
   * Drinking/drunk state response
   */
  getDrinkingResponse() {
    if (!this.chatBot.drunkMode) return null;
    
    const level = this.chatBot.drunkMode.drunkLevel;
    const sobriety = this.chatBot.drunkMode.sobriety;
    
    if (level >= 80) {
      return `dude i'm fucking wasted right now. everything's spinning. probably shouldn't be typing`;
    } else if (level >= 60) {
      return `yeah i'm pretty drunk. like ${Math.round(level)}% drunk. feeling good though`;
    } else if (level >= 40) {
      return `i've had a few drinks. tipsy but not drunk. sobriety at like ${Math.round(sobriety)}%`;
    } else if (level >= 20) {
      return `had like one or two. barely feeling it. mostly sober`;
    } else {
      return `nah i'm sober. haven't been drinking`;
    }
  }

  /**
   * Tiredness/sleep response
   */
  getTirednessResponse() {
    if (!this.chatBot.sleepDeprivation) return null;
    
    const hoursSleep = this.chatBot.sleepDeprivation.hoursSinceRest;
    const deprivation = this.chatBot.sleepDeprivation.sleepDeprivation;
    
    if (deprivation >= 80) {
      return `i haven't slept in like ${Math.round(hoursSleep)} hours. i'm fucking exhausted. can barely think straight`;
    } else if (deprivation >= 60) {
      return `really tired. been up for ${Math.round(hoursSleep)} hours. need to crash soon`;
    } else if (deprivation >= 40) {
      return `kinda tired. could use some sleep. been awake for ${Math.round(hoursSleep)} hours`;
    } else if (deprivation >= 20) {
      return `little tired but fine. slept recently`;
    } else {
      return `nah i'm good. well rested`;
    }
  }

  /**
   * Mood response
   */
  getMoodResponse() {
    if (!this.chatBot.moodTracker) return null;
    
    const moodData = this.chatBot.moodTracker.getMood();
    const mood = moodData.mood; // Extract string from object
    const valence = this.chatBot.moodTracker.valence || 0;
    const arousal = this.chatBot.moodTracker.arousal || 50;
    
    // Describe mood authentically
    if (mood === 'excited' || mood === 'energetic') {
      return `feeling pretty hyped right now. energy's at like ${Math.round(arousal)}%`;
    } else if (mood === 'happy' || mood === 'content') {
      return `i'm in a good mood. feeling positive. vibes are good`;
    } else if (mood === 'anxious' || mood === 'stressed') {
      return `honestly kinda stressed. lot going on. mood's not great`;
    } else if (mood === 'sad' || mood === 'depressed') {
      return `not feeling great. kinda down. mood's pretty low if i'm being honest`;
    } else if (mood === 'angry' || mood === 'frustrated') {
      return `annoyed as fuck. lot of shit pissing me off right now`;
    } else if (mood === 'tired' || mood === 'bored') {
      return `feeling bored and low energy. nothing's really interesting me`;
    } else {
      return `mood's pretty neutral. nothing special going on`;
    }
  }

  /**
   * Mental state response
   */
  getMentalStateResponse() {
    if (!this.chatBot.mentalBreakSystem) return null;
    
    const isBreaking = this.chatBot.mentalBreakSystem.isBreaking();
    const stress = this.chatBot.needsSystem ? this.chatBot.needsSystem.getStressLevel() : 0;
    
    if (isBreaking) {
      const breakType = this.chatBot.mentalBreakSystem.currentBreak.type;
      return `honestly i'm losing it. having a ${breakType}. stress is at ${Math.round(stress)}% and i can't deal`;
    } else if (stress >= 70) {
      return `mental state's not good. stress is like ${Math.round(stress)}%. feel like i'm about to snap`;
    } else if (stress >= 50) {
      return `kinda stressed. not breaking but definitely feeling the pressure`;
    } else if (stress >= 30) {
      return `little stressed but managing. mental state's okay`;
    } else {
      return `mentally i'm fine. stress is low. doing alright`;
    }
  }

  /**
   * Needs response
   */
  getNeedsResponse() {
    if (!this.chatBot.needsSystem) return null;
    
    const needs = this.chatBot.needsSystem.needs;
    const criticalNeeds = [];
    const lowNeeds = [];
    
    for (const [type, need] of Object.entries(needs)) {
      if (need.value < need.criticalThreshold) {
        criticalNeeds.push(type);
      } else if (need.value < need.threshold) {
        lowNeeds.push(type);
      }
    }
    
    if (criticalNeeds.length > 0) {
      return `dude i'm desperate. my ${criticalNeeds.join(' and ')} need${criticalNeeds.length > 1 ? 's are' : ' is'} critical. like ${Math.round(needs[criticalNeeds[0]].value)}%`;
    } else if (lowNeeds.length > 0) {
      return `${lowNeeds.join(' and ')} need${lowNeeds.length > 1 ? 's are' : ' is'} kinda low. could use some ${lowNeeds[0]}`;
    } else {
      // Don't announce this unprompted - only respond if directly asked
      return null;
    }
  }

  /**
   * Energy response
   */
  getEnergyResponse() {
    if (!this.chatBot.moodTracker) return null;
    
    const arousal = this.chatBot.moodTracker.arousal || 50;
    
    if (arousal >= 80) {
      return `energy's fucking high right now. i'm at like ${Math.round(arousal)}%. ready to do shit`;
    } else if (arousal >= 60) {
      return `got decent energy. feeling active. ${Math.round(arousal)}% energy`;
    } else if (arousal >= 40) {
      return `energy's medium. not hyped but not dead either`;
    } else if (arousal >= 20) {
      return `low energy. feeling pretty lethargic. ${Math.round(arousal)}%`;
    } else {
      return `no energy at all. completely drained. barely functioning`;
    }
  }

  /**
   * Addiction response
   */
  getAddictionResponse() {
    if (!this.chatBot.addictionSystem) return null;
    
    const addictions = this.chatBot.addictionSystem.addictions;
    const activeAddictions = Array.from(addictions.entries())
      .filter(([type, data]) => data.level > 30)
      .map(([type, data]) => ({ type, level: data.level, withdrawing: data.withdrawing }));
    
    if (activeAddictions.length === 0) {
      return `not really addicted to anything right now`;
    }
    
    const worst = activeAddictions[0];
    if (worst.withdrawing) {
      return `i'm going through ${worst.type} withdrawal. it's at ${Math.round(worst.level)}% and it sucks`;
    } else {
      return `yeah i'm addicted to ${worst.type}. dependency is at ${Math.round(worst.level)}%`;
    }
  }

  /**
   * Obsession response
   */
  getObsessionResponse() {
    // Check obsession system
    if (this.chatBot.obsessionSystem && this.chatBot.obsessionSystem.currentObsession) {
      const obs = this.chatBot.obsessionSystem.currentObsession;
      return `dude i'm obsessed with ${obs.topic} right now. can't stop thinking about it`;
    }
    
    // Check autism fixations
    if (this.chatBot.autismFixations && this.chatBot.autismFixations.isActive) {
      const fixation = this.chatBot.autismFixations.currentFixation;
      const intensity = this.chatBot.autismFixations.fixationIntensity;
      return `i'm fixated on ${fixation} at like ${Math.round(intensity * 100)}% intensity. it's consuming me`;
    }
    
    // Check hipster protocol
    if (this.chatBot.hipsterProtocol && this.chatBot.hipsterProtocol.isActive) {
      const band = this.chatBot.hipsterProtocol.currentFavorite;
      return `really into ${band.name} right now. been listening nonstop`;
    }
    
    return `not obsessed with anything particular at the moment`;
  }

  /**
   * General status - comprehensive overview
   */
  getGeneralStatusResponse(username) {
    const status = [];
    
    // Mood - make it conversational, not debug-like
    if (this.chatBot.moodTracker) {
      const mood = this.chatBot.moodTracker.getMood();
      // Ensure mood is a string, not an object
      const moodStr = typeof mood === 'object' ? (mood.mood || mood.primary || mood.current || 'neutral') : String(mood);
      
      // Convert to conversational phrase instead of "mood: neutral"
      // SKIP neutral - it's default state, don't mention it
      if (moodStr === 'neutral') {
        // Don't add anything - neutral is default
      } else if (moodStr === 'happy' || moodStr === 'excited') {
        status.push(`i'm feeling good`);
      } else if (moodStr === 'sad' || moodStr === 'depressed') {
        status.push(`kinda sad right now`);
      } else if (moodStr === 'angry' || moodStr === 'frustrated') {
        status.push(`i'm pissed off`);
      } else if (moodStr === 'anxious') {
        status.push(`feeling anxious`);
      } else {
        status.push(`i'm ${moodStr}`);
      }
    }
    
    // Drunk level
    if (this.chatBot.drunkMode && this.chatBot.drunkMode.drunkLevel > 20) {
      status.push(`${Math.round(this.chatBot.drunkMode.drunkLevel)}% drunk`);
    }
    
    // Sleep
    if (this.chatBot.sleepDeprivation && this.chatBot.sleepDeprivation.sleepDeprivation > 30) {
      status.push(`sleep deprived`);
    }
    
    // Mental break
    if (this.chatBot.mentalBreakSystem && this.chatBot.mentalBreakSystem.isBreaking()) {
      status.push(`having a breakdown`);
    }
    
    // Critical needs
    if (this.chatBot.needsSystem) {
      const criticalNeeds = Object.entries(this.chatBot.needsSystem.needs)
        .filter(([type, need]) => need.value < need.criticalThreshold)
        .map(([type]) => type);
      
      if (criticalNeeds.length > 0) {
        status.push(`desperate for ${criticalNeeds[0]}`);
      }
    }
    
    if (status.length === 0) {
      return `i'm doing alright. nothing major going on`;
    } else if (status.length === 1) {
      return status[0];
    } else {
      return status.slice(0, 2).join('. ') + '. that\'s basically it';
    }
  }

  /**
   * Get context hint for AI about current state
   * This adds authentic self-awareness to the AI's context
   */
  getStateContext() {
    const states = [];
    
    // Drunk state
    if (this.chatBot.drunkMode && this.chatBot.drunkMode.drunkLevel > 30) {
      states.push(`You're ${Math.round(this.chatBot.drunkMode.drunkLevel)}% drunk`);
    }
    
    // Sleep deprived
    if (this.chatBot.sleepDeprivation && this.chatBot.sleepDeprivation.sleepDeprivation > 40) {
      states.push(`You've been awake for ${Math.round(this.chatBot.sleepDeprivation.hoursSinceRest)} hours and you're exhausted`);
    }
    
    // Mental break
    if (this.chatBot.mentalBreakSystem && this.chatBot.mentalBreakSystem.isBreaking()) {
      states.push(`You're having a ${this.chatBot.mentalBreakSystem.currentBreak.type}`);
    }
    
    // Critical needs
    if (this.chatBot.needsSystem) {
      const critical = Object.entries(this.chatBot.needsSystem.needs)
        .filter(([type, need]) => need.value < need.criticalThreshold)
        .map(([type]) => type);
      
      if (critical.length > 0) {
        states.push(`Your ${critical.join(' and ')} need is critical`);
      }
    }
    
    if (states.length === 0) return '';
    
    return `\n\n🧠 YOUR CURRENT STATE:\n${states.join('\n')}`;
  }
}

module.exports = SelfAwarenessSystem;
