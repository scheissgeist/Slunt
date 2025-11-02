/**
 * Land Acknowledgement System
 * Slunt occasionally does completely unprompted land acknowledgements
 * He knows nothing about the cultures involved and is probably not in the best state of mind
 * But he tries to draw on some spirit of reverence for no real reason
 */

class LandAcknowledgement {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Track last acknowledgement
    this.lastAcknowledgement = 0;
    this.minTimeBetween = 1800000; // 30 minutes minimum
    
    // Base chance per message (very low)
    this.baseChance = 0.002; // 0.2% chance
    
    // Moods that make acknowledgements more likely
    this.triggerMoods = [
      'contemplative',
      'guilty',
      'introspective',
      'melancholic',
      'philosophical',
      'existential'
    ];
  }
  
  /**
   * Should we do a land acknowledgement?
   */
  shouldAcknowledge() {
    // Cooldown check
    const timeSince = Date.now() - this.lastAcknowledgement;
    if (timeSince < this.minTimeBetween) {
      return false;
    }
    
    let chance = this.baseChance;
    
    // Higher chance if in certain moods
    if (this.chatBot.moodTracker) {
      const currentMood = this.chatBot.moodTracker.getMood();
      if (this.triggerMoods.includes(currentMood)) {
        chance *= 3; // 0.6% when introspective/guilty
      }
    }
    
    // Higher chance late at night (philosophical hours)
    const hour = new Date().getHours();
    if (hour >= 1 && hour <= 5) {
      chance *= 2;
    }
    
    // Higher chance if mentally unstable
    if (this.chatBot.mentalStateTracker) {
      const state = this.chatBot.mentalStateTracker.getMentalState();
      // Calculate stability (0-100) from mental state components
      const stability = (
        (1 - state.depression) * 30 +
        (1 - state.anxiety) * 20 +
        state.confidence * 30 +
        (1 - state.existentialDread) * 10 +
        (1 - state.loneliness) * 10
      ) * 100;
      if (stability < 50) {
        chance *= 1.5; // More likely when losing it
      }
    }
    
    // Higher chance if feeling guilty/anxious about something
    if (this.chatBot.moodTracker) {
      const mood = this.chatBot.moodTracker.getMood();
      if (mood.mood === 'anxious' || mood.mood === 'confused') {
        chance *= 2;
      }
    }
    
    return Math.random() < chance;
  }
  
  
  /**
   * Generate a land acknowledgement using AI
   */
  async generateAcknowledgement() {
    this.lastAcknowledgement = Date.now();
    
    // Build context about current mental state
    let stateContext = '';
    
    if (this.chatBot.mentalStateTracker) {
      const state = this.chatBot.mentalStateTracker.getMentalState();
      // Calculate stability (0-100) from mental state components
      const stability = (
        (1 - state.depression) * 30 +
        (1 - state.anxiety) * 20 +
        state.confidence * 30 +
        (1 - state.existentialDread) * 10 +
        (1 - state.loneliness) * 10
      ) * 100;
      if (stability < 30) {
        stateContext = 'You are very mentally unstable right now - confused, rambling, can barely form coherent thoughts.';
      } else if (stability < 60) {
        stateContext = 'You are somewhat mentally unstable - a bit scattered and uncertain.';
      }
    }
    
    if (this.chatBot.moodTracker) {
      const guiltyLevel = this.chatBot.moodTracker.getMoodLevel('guilty');
      if (guiltyLevel > 0.5) {
        stateContext += ' You feel deeply guilty about something and are overcompensating.';
      }
    }
    
    // Build the prompt
    const prompt = `You need to do a land acknowledgement. This is UNPROMPTED - nobody asked for this, you just feel like you should do it.

IMPORTANT CONTEXT:
- You know almost NOTHING about indigenous peoples or which tribes lived where
- You've picked up vague terminology like "unceded", "traditional", "ancestral" but don't really understand them
- You're trying to be respectful but you're clearly out of your depth
- Keep it SHORT (1-2 sentences max)
- Use vague terms like "the original peoples", "the first nations", "indigenous communities", "those who came before"
- Use generic land descriptions like "these lands", "this territory", "these sacred grounds"
- End with something awkward that shows you're unsure, like "idk if im doing this right" or "sorry if i got that wrong" or "pretty sure thats a thing people do"
${stateContext ? '\n' + stateContext : ''}

Generate a short, poorly-researched land acknowledgement (lowercase, casual tone, shows uncertainty):`;

    try {
      if (this.chatBot.ai && this.chatBot.ai.enabled) {
        const response = await this.chatBot.ai.generateResponse(
          prompt,
          [],
          {
            temperature: 0.9,
            maxTokens: 100
          }
        );
        
        if (response && response.trim()) {
          console.log('🪶 [LandAck] Generated AI land acknowledgement');
          return response.trim();
        }
      }
    } catch (error) {
      console.error('🪶 [LandAck] Error generating acknowledgement:', error.message);
    }
    
    // Fallback if AI fails
    return 'i want to acknowledge the original peoples of these lands. idk if im doing this right';
  }
  
  /**
   * Add acknowledgement to message (prepend or postscript style)
   */
  async addToMessage(message) {
    const ack = await this.generateAcknowledgement();
    
    // Randomly either prepend with a line break, or add as awkward postscript
    if (Math.random() < 0.6) {
      // Add before message
      return `${ack}\n\n${message}`;
    } else {
      // Add after as awkward afterthought
      return `${message}\n\n${ack}`;
    }
  }
  
  /**
   * Get state for debugging
   */
  getState() {
    const timeSinceLastMs = Date.now() - this.lastAcknowledgement;
    const timeSinceLastMin = Math.floor(timeSinceLastMs / 60000);
    
    return {
      lastAcknowledgement: timeSinceLastMin + ' minutes ago',
      canAcknowledge: timeSinceLastMs > this.minTimeBetween
    };
  }
}

module.exports = LandAcknowledgement;
