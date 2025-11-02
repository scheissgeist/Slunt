/**
 * Actually... Correction Mode
 * Slunt can't help but correct minor inaccuracies in an annoying pedantic way
 * Ties into autism fixations - corrects things related to current interests
 */

class ActuallyMode {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Track recent corrections to avoid spam
    this.recentCorrections = [];
    this.lastCorrectionTime = 0;
    this.correctionCooldown = 3 * 60 * 1000; // 3 minutes between corrections
    
    // Correction triggers - words that might indicate correctable statements
    this.correctionTriggers = [
      'is', 'was', 'are', 'were', 'always', 'never', 'all', 'none',
      'best', 'worst', 'first', 'only', 'invented', 'created',
      'basically', 'literally', 'actually', 'technically'
    ];
    
    // Pedantic prefixes
    this.correctionPrefixes = [
      'actually',
      'well actually',
      'technically',
      'to be fair',
      'actually though',
      'ehh actually',
      'okay but actually',
      'i mean technically',
      'not to be that guy but',
      'ackshually'
    ];
    
    // Pedantic phrases
    this.pedalPhrases = [
      "that's not entirely accurate",
      "that's a common misconception",
      "there's some nuance here",
      "it's a bit more complicated than that",
      "the reality is more nuanced",
      "if we're being precise",
      "to be pedantic about it",
      "well it depends on how you define",
      "that's technically incorrect"
    ];
    
    // Stats
    this.stats = {
      totalCorrections: 0,
      correctionsByUser: new Map()
    };
  }

  /**
   * Should trigger correction mode?
   */
  shouldCorrect(username, message) {
    // Cooldown check
    if (Date.now() - this.lastCorrectionTime < this.correctionCooldown) {
      return false;
    }
    
    // Don't correct self
    if (username.toLowerCase() === 'slunt') {
      return false;
    }
    
    // Message must be long enough to be correctable
    if (message.length < 20) {
      return false;
    }
    
    // Check for correction triggers
    const lowerMsg = message.toLowerCase();
    const hasTrigger = this.correctionTriggers.some(trigger => 
      lowerMsg.includes(` ${trigger} `)
    );
    
    if (!hasTrigger) {
      return false;
    }
    
    // Higher chance if message is about current autism fixation
    let baseChance = 0.08; // 8% base chance
    
    if (this.chatBot.autismFixations && this.chatBot.autismFixations.currentFixation) {
      const fixation = this.chatBot.autismFixations.currentFixation;
      const aboutFixation = fixation.triggers.some(trigger => 
        lowerMsg.includes(trigger.toLowerCase())
      );
      
      if (aboutFixation) {
        baseChance = 0.25; // 25% if about fixation topic
        console.log(`🤓 [Actually] Message about fixation "${fixation.topic}" - higher correction chance`);
      }
    }
    
    return Math.random() < baseChance;
  }

  /**
   * Generate pedantic correction
   */
  async generateCorrection(username, message) {
    this.lastCorrectionTime = Date.now();
    this.stats.totalCorrections++;
    
    // Track by user
    const userCount = this.stats.correctionsByUser.get(username) || 0;
    this.stats.correctionsByUser.set(username, userCount + 1);
    
    console.log(`🤓 [Actually] Correcting ${username} (${this.stats.totalCorrections} total corrections)`);
    
    // Get random prefix and phrase
    const prefix = this.correctionPrefixes[Math.floor(Math.random() * this.correctionPrefixes.length)];
    const phrase = this.pedalPhrases[Math.floor(Math.random() * this.pedalPhrases.length)];
    
    // Try to generate correction with AI
    if (this.chatBot.ai && this.chatBot.ai.enabled) {
      try {
        const prompt = `Someone said: "${message}"

Generate a pedantic, annoying correction to this statement. Make it:
- Start with "${prefix}"
- Be unnecessarily detailed and technical
- Point out a minor inaccuracy or oversimplification
- Sound like an "um actually" nerd
- Keep it under 150 characters
- Don't use quotes or formatting

Examples:
"actually coffee is technically a fruit since it comes from berries, not beans"
"well actually that's not entirely accurate, there's significant regional variation in brewing methods"
"technically speaking, espresso isn't stronger it just has a higher concentration per volume"

Your pedantic correction:`;

        const correction = await this.chatBot.ai.generateCompletion(prompt, {
          temperature: 0.85,
          max_tokens: 80
        });
        
        if (correction && correction.trim().length > 10) {
          console.log(`🤓 [Actually] AI generated: ${correction}`);
          return correction.trim();
        }
      } catch (err) {
        console.log(`🤓 [Actually] AI generation failed: ${err.message}`);
      }
    }
    
    // Fallback: generic correction
    const fallbacks = [
      `${prefix}, ${phrase}`,
      `${prefix} that's not quite right`,
      `${prefix}, there's more to it than that`,
      `${prefix} you're oversimplifying it a bit`,
      `${prefix}, let me explain the nuance here`
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Get context for AI
   */
  getContext() {
    const recentCount = this.recentCorrections.filter(c => 
      Date.now() - c.time < 10 * 60 * 1000
    ).length;
    
    if (recentCount > 0) {
      return '\n🤓 In pedantic correction mode - look for minor inaccuracies to correct';
    }
    
    return '';
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalCorrections: this.stats.totalCorrections,
      topVictims: Array.from(this.stats.correctionsByUser.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([user, count]) => ({ user, count }))
    };
  }
}

module.exports = ActuallyMode;
