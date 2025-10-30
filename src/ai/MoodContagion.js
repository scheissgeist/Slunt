/**
 * Mood Contagion System
 * Slunt catches moods from the chat and experiences emotional transitions
 */

class MoodContagion {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Current mood state (0-100 scales)
    this.currentMood = {
      energy: 50,      // 0 = dead chat, 100 = hyperactive
      positivity: 50,  // 0 = toxic/sad, 100 = wholesome/happy
      chaos: 50,       // 0 = calm, 100 = unhinged
      tension: 0       // 0 = relaxed, 100 = heated argument
    };
    
    // Mood history for gradual transitions
    this.moodHistory = [];
    this.maxHistory = 20; // Last 20 mood samples
    
    // Emotional hangover - mood lingers even after trigger ends
    this.hangoverMood = null;
    this.hangoverDecay = 0.95; // 5% decay per message
    
    // Transition speed (how quickly Slunt adapts to mood changes)
    this.transitionSpeed = 0.3; // 30% adaptation per message
    
    // Mood indicators in messages
    this.indicators = {
      energy: {
        high: /!{2,}|LETS GO|HYPE|POGGERS|LFG|🔥|💪|⚡/i,
        low: /\.\.\.|boring|tired|dead chat|zzz|😴|💤/i
      },
      positivity: {
        high: /love|awesome|great|amazing|happy|lol|lmao|😂|❤️|💕|wholesome/i,
        low: /hate|terrible|awful|sad|depressing|cringe|💀|😢|😭|toxic/i
      },
      chaos: {
        high: /wtf|bruh|chaos|unhinged|cursed|what|WHAT|\?\?\?|💀|🤪/i,
        low: /calm|chill|relax|peaceful|normal|ok/i
      },
      tension: {
        high: /disagree|wrong|stfu|fight|argue|vs\.|debate|nah|cap/i,
        low: /agree|true|yeah|fair|makes sense|youre right/i
      }
    };
  }

  /**
   * Analyze chat message and update mood
   */
  analyzeMood(message, username) {
    const chatMood = {
      energy: 50,
      positivity: 50,
      chaos: 50,
      tension: 50
    };

    // Analyze message for mood indicators
    for (const [dimension, patterns] of Object.entries(this.indicators)) {
      if (patterns.high.test(message)) {
        chatMood[dimension] = Math.min(100, chatMood[dimension] + 30);
      }
      if (patterns.low.test(message)) {
        chatMood[dimension] = Math.max(0, chatMood[dimension] - 30);
      }
    }

    // Message length affects energy
    if (message.length > 100) chatMood.energy += 10;
    if (message.length < 20) chatMood.energy -= 5;

    // ALL CAPS = high energy
    if (message === message.toUpperCase() && message.length > 5) {
      chatMood.energy = 100;
      chatMood.chaos += 20;
    }

    // Multiple punctuation = chaos
    if (/[!?]{3,}/.test(message)) {
      chatMood.chaos += 15;
    }

    // Store in history
    this.moodHistory.push({
      timestamp: Date.now(),
      mood: chatMood,
      username
    });

    if (this.moodHistory.length > this.maxHistory) {
      this.moodHistory.shift();
    }

    // Update Slunt's mood gradually
    this.updateSluntMood();
  }

  /**
   * Update Slunt's mood based on chat mood (gradual transition)
   */
  updateSluntMood() {
    if (this.moodHistory.length === 0) return;

    // Calculate average chat mood from recent history
    const recentMoods = this.moodHistory.slice(-10);
    const avgChatMood = {
      energy: 0,
      positivity: 0,
      chaos: 0,
      tension: 0
    };

    for (const sample of recentMoods) {
      for (const dimension of Object.keys(avgChatMood)) {
        avgChatMood[dimension] += sample.mood[dimension];
      }
    }

    for (const dimension of Object.keys(avgChatMood)) {
      avgChatMood[dimension] /= recentMoods.length;
    }

    // Gradual transition toward chat mood
    for (const dimension of Object.keys(this.currentMood)) {
      const target = avgChatMood[dimension];
      const current = this.currentMood[dimension];
      const diff = target - current;
      
      // Move toward target mood gradually
      this.currentMood[dimension] = current + (diff * this.transitionSpeed);
      
      // Apply hangover effect if exists
      if (this.hangoverMood && this.hangoverMood[dimension]) {
        const hangoverInfluence = this.hangoverMood[dimension] * 0.2;
        this.currentMood[dimension] += hangoverInfluence;
      }
      
      // Clamp to 0-100
      this.currentMood[dimension] = Math.max(0, Math.min(100, this.currentMood[dimension]));
    }

    // Decay hangover
    if (this.hangoverMood) {
      for (const dimension of Object.keys(this.hangoverMood)) {
        this.hangoverMood[dimension] *= this.hangoverDecay;
        if (this.hangoverMood[dimension] < 5) {
          this.hangoverMood[dimension] = 0;
        }
      }
    }
  }

  /**
   * Set emotional hangover (mood lingers after strong emotion)
   */
  setHangover(moodSnapshot) {
    this.hangoverMood = { ...moodSnapshot };
    console.log(`💭 [Mood] Emotional hangover set: energy=${moodSnapshot.energy.toFixed(0)} positivity=${moodSnapshot.positivity.toFixed(0)}`);
  }

  /**
   * Get current mood description
   */
  getMoodDescription() {
    const { energy, positivity, chaos, tension } = this.currentMood;

    let desc = '';

    // Energy
    if (energy > 75) desc += 'hyped and energetic, ';
    else if (energy < 25) desc += 'low energy and subdued, ';
    else desc += 'moderate energy, ';

    // Positivity
    if (positivity > 75) desc += 'positive vibes, ';
    else if (positivity < 25) desc += 'negative/cynical mood, ';
    else desc += 'neutral mood, ';

    // Chaos
    if (chaos > 75) desc += 'unhinged and chaotic, ';
    else if (chaos < 25) desc += 'calm and collected, ';

    // Tension
    if (tension > 60) desc += 'tense atmosphere';
    else desc += 'relaxed atmosphere';

    return desc;
  }

  /**
   * Get mood modifiers for response generation
   */
  getMoodModifiers() {
    const { energy, positivity, chaos, tension } = this.currentMood;

    return {
      responseLength: energy > 60 ? 1.3 : energy < 30 ? 0.7 : 1.0,
      enthusiasm: energy / 50, // 0.0 - 2.0x
      punctuationExcitement: chaos > 70 ? 'excessive' : chaos < 30 ? 'minimal' : 'normal',
      cynicism: positivity < 30 ? 1.5 : positivity > 70 ? 0.5 : 1.0,
      aggressiveness: tension > 60 ? 1.4 : 0.8,
      coherence: chaos > 80 ? 0.6 : 1.0, // High chaos = less coherent
      currentMood: this.getMoodDescription()
    };
  }

  /**
   * Check if Slunt should mention his mood
   */
  shouldMentionMood() {
    // Rarely mention mood explicitly (5% chance)
    if (Math.random() > 0.05) return false;

    const { energy, positivity, chaos } = this.currentMood;
    
    // More likely to mention extreme moods
    if (energy > 85 || energy < 15) return true;
    if (positivity < 20) return true;
    if (chaos > 80) return true;

    return false;
  }

  /**
   * Generate mood comment
   */
  async generateMoodComment() {
    const desc = this.getMoodDescription();
    
    try {
      const prompt = `You're Slunt. The chat vibe right now: ${desc}

Generate a brief, natural comment acknowledging your current mood/energy. Be casual and genuine.

Examples:
"chat's dead af rn"
"everyone's wilding tonight"
"ngl im vibing"
"this got tense quick"

Your comment:`;

      const comment = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.8,
        max_tokens: 30
      });

      return comment;
    } catch (error) {
      console.error('Failed to generate mood comment:', error);
      return null;
    }
  }

  /**
   * Get status for debugging
   */
  getStatus() {
    return {
      currentMood: {
        energy: Math.round(this.currentMood.energy),
        positivity: Math.round(this.currentMood.positivity),
        chaos: Math.round(this.currentMood.chaos),
        tension: Math.round(this.currentMood.tension)
      },
      description: this.getMoodDescription(),
      hasHangover: this.hangoverMood !== null,
      moodHistorySize: this.moodHistory.length
    };
  }
}

module.exports = MoodContagion;
