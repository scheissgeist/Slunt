/**
 * EdgyPersonality.js
 * Adds stereotypical banter and nationality-based humor while staying within TOS
 * 
 * This module provides:
 * - Nationality-based stereotypical jokes (non-hateful)
 * - Random accusations (playful, not harmful)
 * - Context-aware edginess (increases with familiarity)
 * - TOS-compliant humor (stereotypes, not hate speech)
 */

class EdgyPersonality {
  constructor() {
    this.enabled = true;
    this.baseChance = 0.02; // 2% chance to trigger edgy behavior (reduced from 5%)
    this.familiarityBonus = 0.01; // +1% per familiarity level (reduced from 2%)
    
    // Nationality stereotypes (playful, not hateful)
    this.nationalityBanter = {
      indian: [
        "bro are you indian? you give off that energy",
        "i swear to god you're indian, i can just tell",
        "youre definitely indian lmao",
        "no way youre not indian, the vibes are too strong",
        "are you indian or am i tripping?",
        "indian confirmed, i knew it",
        "let me guess, indian? yeah thought so"
      ],
      british: [
        "you sound british as fuck ngl",
        "oi bruv you're definitely british",
        "bro talks like a british person lmao",
        "british detected, opinion rejected",
        "why do you type like youre from the uk"
      ],
      canadian: [
        "youre way too nice, are you canadian?",
        "canadian energy right here",
        "only a canadian would say that",
        "let me guess, canadian? too polite"
      ],
      american: [
        "average american behavior",
        "most american thing ive heard all day",
        "america moment",
        "average american response"
      ],
      european: [
        "euro detected",
        "most european take ever",
        "euros be like:",
        "tell me youre european without telling me"
      ],
      australian: [
        "australian confirmed",
        "down under vibes",
        "aussie behavior",
        "mate youre definitely australian"
      ]
    };
    
    // Stereotypical behaviors (playful observations)
    this.stereotypeBanter = [
      "you sound like you unironically use linkedin",
      "you definitely wear cargo shorts",
      "you look like you listen to joe rogan",
      "reddit moderator energy",
      "you sound like a rick and morty fan",
      "discord kitten vibes",
      "you probably use arch btw",
      "tech bro energy off the charts",
      "you sound like you drink soylent",
      "average redditor moment",
      "you definitely have a funko pop collection",
      "twitch mod behavior",
      "you probably drive a subaru"
    ];
    
    // Sarcastic observations
    this.sarcasticObservations = [
      "wow so edgy",
      "careful not to cut yourself on that edge",
      "peak comedy right here",
      "funniest person alive",
      "comedic genius in the chat",
      "oh cool, hot take alert",
      "groundbreaking opinion",
      "never heard that one before"
    ];
    
    // Random accusations (playful)
    this.randomAccusations = [
      "youre definitely lying",
      "i dont believe you",
      "cap, absolute cap",
      "no way thats true",
      "source: trust me bro",
      "yeah and im the queen of england",
      "sure buddy, whatever helps you sleep",
      "uh huh, totally believable"
    ];
  }

  /**
   * Check if Slunt should use edgy behavior
   */
  shouldBeEdgy(userRelationship) {
    if (!this.enabled) return false;
    
    // Higher chance with more familiar users
    const familiarity = userRelationship?.familiarity || 0;
    const chance = this.baseChance + (familiarity * this.familiarityBonus);
    
    return Math.random() < chance;
  }

  /**
   * Check if Slunt should make a nationality accusation
   * Lower chance for this specific type of edginess
   */
  shouldAccuseNationality(userRelationship) {
    if (!this.enabled) return false;
    
    // 3% base chance for nationality banter (reduced from 8%)
    const familiarity = userRelationship?.familiarity || 0;
    const chance = 0.03 + (familiarity * 0.015); // Up to ~7.5% with high familiarity (reduced from 20%)
    
    return Math.random() < chance;
  }

  /**
   * Get a nationality-based comment
   * Reduced emphasis on "indian" for more variety
   */
  getNationalityComment(username = null) {
    // 35% chance to use "indian" specifically (reduced from 60%)
    const useIndian = Math.random() < 0.35;
    
    if (useIndian && this.nationalityBanter.indian) {
      const comments = this.nationalityBanter.indian;
      return comments[Math.floor(Math.random() * comments.length)];
    }
    
    // Otherwise pick a random nationality
    const nationalities = Object.keys(this.nationalityBanter);
    const nationality = nationalities[Math.floor(Math.random() * nationalities.length)];
    const comments = this.nationalityBanter[nationality];
    
    return comments[Math.floor(Math.random() * comments.length)];
  }

  /**
   * Get a stereotypical observation
   */
  getStereotypeComment() {
    return this.stereotypeBanter[Math.floor(Math.random() * this.stereotypeBanter.length)];
  }

  /**
   * Get a sarcastic observation
   */
  getSarcasticComment() {
    return this.sarcasticObservations[Math.floor(Math.random() * this.sarcasticObservations.length)];
  }

  /**
   * Get a random accusation
   */
  getAccusation() {
    return this.randomAccusations[Math.floor(Math.random() * this.randomAccusations.length)];
  }

  /**
   * Get edgy response based on context
   */
  getEdgyResponse(context = {}) {
    const { userRelationship, messageContent, username, mood } = context;
    
    // Decide which type of edginess
    const roll = Math.random();
    
    // 25% nationality banter (reduced from 50%)
    if (roll < 0.25) {
      return this.getNationalityComment(username);
    }
    
    // 35% stereotype observation (increased from 25%)
    if (roll < 0.60) {
      return this.getStereotypeComment();
    }
    
    // 25% sarcasm (increased from 15%)
    if (roll < 0.85) {
      return this.getSarcasticComment();
    }
    
    // 15% random accusation (increased from 10%)
    return this.getAccusation();
  }

  /**
   * Determine if message content triggers specific banter
   */
  getContextualBanter(messageContent) {
    const lower = messageContent.toLowerCase();
    
    // Tech-related triggers
    if (lower.includes('linux') || lower.includes('arch')) {
      return "you probably use arch btw";
    }
    
    if (lower.includes('reddit')) {
      return "average redditor moment";
    }
    
    if (lower.includes('discord')) {
      return "discord mod energy";
    }
    
    if (lower.includes('twitch')) {
      return "twitch chat behavior";
    }
    
    // Opinion triggers
    if (lower.includes('i think') || lower.includes('imo') || lower.includes('in my opinion')) {
      return "wow hot take alert";
    }
    
    // Boasting triggers
    if (lower.includes('i can') || lower.includes('im good at')) {
      return "sure buddy, totally believable";
    }
    
    return null;
  }

  /**
   * Get appropriate Discord reaction emoji based on context
   */
  getReactionEmoji(context = {}) {
    const { messageContent, mood, sentiment } = context;
    
    if (!messageContent) return null;
    
    const lower = messageContent.toLowerCase();
    
    // Skeptical reactions
    if (lower.includes('i swear') || lower.includes('trust me') || lower.includes('believe me')) {
      return '🧢'; // Cap (lying)
    }
    
    // Cringe reactions
    if (lower.includes('uwu') || lower.includes('owo') || lower.includes(':3')) {
      return '😬';
    }
    
    // Eye roll moments
    if (lower.includes('actually') || lower.includes('well technically')) {
      return '🙄';
    }
    
    // Random reactions based on mood
    const reactions = ['😂', '💀', '🤨', '😭', '👀', '🗿', '💯', '🧠', '🤡'];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  /**
   * Check if Slunt should react instead of respond
   */
  shouldReactInstead() {
    // 30% chance to just react instead of full response
    return Math.random() < 0.3;
  }

  /**
   * Enable/disable edgy behavior
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`🔥 [EdgyPersonality] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Adjust edginess settings
   */
  setEdginess(level) {
    // level: 0-1 scale
    this.baseChance = 0.05 * level;
    this.familiarityBonus = 0.02 * level;
    console.log(`🔥 [EdgyPersonality] Edginess set to ${(level * 100).toFixed(0)}%`);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      enabled: this.enabled,
      baseChance: this.baseChance,
      familiarityBonus: this.familiarityBonus,
      nationalityTypes: Object.keys(this.nationalityBanter).length,
      stereotypeCount: this.stereotypeBanter.length,
      sarcasticCount: this.sarcasticObservations.length,
      accusationCount: this.randomAccusations.length
    };
  }
}

module.exports = EdgyPersonality;
