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
    this.baseChance = 0.15; // 15% chance to trigger edgy behavior - GO HARD
    this.familiarityBonus = 0.05; // +5% per familiarity level - ramp it up
    
    // Nationality stereotypes (playful, not hateful)
    this.nationalityBanter = {
      indian: [
        "bro are you indian? you give off that energy",
        "i swear to god you're indian, i can just tell",
        "youre definitely indian lmao",
        "no way youre not indian, that's way too obvious",
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
        "straight from down under",
        "aussie behavior",
        "mate youre definitely australian"
      ]
    };
    
    // Stereotypical behaviors (playful observations) - GO FUCKING HARD
    this.stereotypeBanter = [
      "you sound like you jerk off to linkedin profiles",
      "you definitely wear the same crusty cargo shorts every day",
      "you look like you listen to joe rogan and agree with everything he says",
      "reddit moderator energy, probably hasn't showered in days",
      "you sound like a rick and morty fan who unironically thinks they're smart as fuck",
      "discord kitten energy, absolute basement dweller",
      "you probably use arch btw and think that makes you interesting",
      "tech bro energy, zero bitches",
      "you sound like you drink soylent and call it gains",
      "average redditor moment, virgin energy off the charts",
      "you definitely have a funko pop collection worth more than your car",
      "twitch mod behavior, bans people for no reason",
      "you probably drive a subaru and vape in parking lots",
      "you look like you'd get offended at a roast and write a paragraph about it",
      "you probably correct people's grammar because you have nothing else going on",
      "discord admin on a power trip, absolutely maidenless",
      "you look like you wear a fedora and wonder why girls don't like you",
      "you sound like you peaked in high school and won't shut up about it",
      "reddit atheist energy, probably owns a katana",
      "you probably argue with strangers on twitter because your life is that empty",
      "you look like you'd fall for a crypto scam and defend it afterwards",
      "you sound like someone who says 'well actually' and wonders why they have no friends",
      "you probably have a waifu body pillow and aren't embarrassed about it",
      "you look like you smell like ass and axe body spray",
      "you definitely still live with your mom and call it 'saving money'",
      "you sound like you haven't touched grass in months",
      "neckbeard energy radiating through the screen",
      "you look like you got bullied in school and it shows"
    ];
    
    // Sarcastic observations - BRUTAL AS FUCK
    this.sarcasticObservations = [
      "wow so edgy bro, you're really pushing boundaries there",
      "careful not to cut yourself on that edge, fucking ouch",
      "peak comedy right here, someone get this man a netflix special",
      "funniest person alive, holy shit i'm dying over here",
      "comedic genius in the chat, everyone take notes",
      "groundbreaking opinion, absolutely revolutionary take",
      "never heard that one before in my entire fucking life",
      "damn bro you got the whole chat laughing, can you hear the silence?",
      "hilarious take, truly the height of comedy",
      "comedy gold right there, i'm rolling on the floor",
      "you should do standup with material this fire",
      "absolutely killing it with these jokes, keep going",
      "wow you really cooked with that one, didn't you?"
    ];
    
    // Random accusations (playful) - MAXIMUM AGGRESSION
    this.randomAccusations = [
      "you're lying your fucking ass off right now",
      "i don't believe a single word coming out of your mouth",
      "cap, absolute fucking cap, you're full of shit",
      "no way that's true, you're making shit up",
      "source: trust me bro, classic bullshit artist move",
      "yeah and i'm the fucking queen of england",
      "sure buddy, whatever helps you cope at night",
      "uh huh, totally believable story there champ",
      "that's complete bullshit and you know it",
      "lying through your teeth and not even trying to hide it",
      "literally making shit up as you go, embarrassing",
      "pressing X to doubt so hard my finger hurts",
      "the lies just keep coming huh",
      "you expect anyone to believe that garbage?",
      "absolute bullshit detector going off rn"
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
    
    // 1% base chance for nationality banter (reduced from 3% - much rarer now)
    const familiarity = userRelationship?.familiarity || 0;
    const chance = 0.01 + (familiarity * 0.01); // Up to ~3% with high familiarity
    
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
    
    // 10% nationality banter (reduced from 25% - much rarer)
    if (roll < 0.10) {
      return this.getNationalityComment(username);
    }
    
    // 45% stereotype observation (increased to fill the gap)
    if (roll < 0.55) {
      return this.getStereotypeComment();
    }
    
    // 30% sarcasm
    if (roll < 0.85) {
      return this.getSarcasticComment();
    }
    
    // 15% random accusation
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
