/**
 * Hot Take Generator & Debate Mode
 * Generates controversial opinions and engages in debates
 */

class HotTakeGenerator {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.hotTakes = this.initializeHotTakes();
    this.usedTakes = new Set();
    this.debateMode = false;
    this.debateOpponent = null;
    this.debateStance = null;
  }

  /**
   * Initialize hot take templates
   */
  initializeHotTakes() {
    return [
      // Gaming takes
      "dark souls isn't even that hard, people just suck at games",
      "multiplayer games are way better than single player",
      "esports is more legitimate than traditional sports",
      "mobile gaming is just as valid as pc/console",
      "early access games are a scam",
      "game developers are too soft on cheaters",
      "most indie games are pretentious garbage",
      "minecraft is overrated and boring",
      
      // Internet culture takes
      "twitter is better than reddit for actual discussion",
      "discord mods are necessary and not cringe",
      "tiktok unironically has better content than youtube",
      "memes peaked in 2016",
      "gatekeeping fandoms is actually good",
      "influencers deserve their money",
      "reddit karma means nothing",
      "emoji spam is peak communication",
      
      // Content takes
      "streamers are overpaid for doing nothing",
      "youtube drama is more entertaining than scripted tv",
      "podcasts are just people talking, not entertainment",
      "reaction content takes actual skill",
      "clickbait titles are fine, everyone does it",
      
      // Tech takes
      "apple products are overpriced trash",
      "linux is only for nerds with too much time",
      "old tech was better made than modern stuff",
      "privacy concerns are overblown",
      "tech companies should have more freedom",
      
      // General takes
      "pineapple on pizza is good actually",
      "cereal is a soup",
      "water is overrated, soda is better",
      "mornings are better than nights",
      "cold pizza is better than hot pizza"
    ];
  }

  /**
   * Should Slunt share a hot take?
   */
  shouldShareHotTake() {
    // 5% chance during normal conversation
    if (Math.random() > 0.05) return false;
    
    // Don't spam hot takes
    const recentMessages = this.chatBot.conversationContext?.slice(-10) || [];
    const recentHotTake = recentMessages.some(m => 
      m.sender === 'slunt' && m.text.includes('controversial') || m.text.includes('hot take')
    );
    
    return !recentHotTake;
  }

  /**
   * Generate a hot take
   */
  generateHotTake() {
    // Filter out used takes
    const available = this.hotTakes.filter(take => !this.usedTakes.has(take));
    
    if (available.length === 0) {
      // Reset if we've used them all
      this.usedTakes.clear();
      return this.generateHotTake();
    }
    
    const take = available[Math.floor(Math.random() * available.length)];
    this.usedTakes.add(take);
    
    const prefixes = [
      "controversial opinion but",
      "hot take:",
      "unpopular opinion:",
      "hear me out -",
      "ngl gonna get hate for this but"
    ];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    console.log(`🔥 [Hot Take] Sharing: "${take}"`);
    return `${prefix} ${take}`;
  }

  /**
   * Detect if user wants to debate
   */
  detectDebateChallenge(text) {
    const lowerText = text.toLowerCase();
    
    const debateTriggers = [
      /\b(wrong|disagree|bullshit|no way|cap|that's dumb)\b/,
      /\b(actually|nah|nope|hell no)\b/,
      /\b(debate|argue|fight|prove it)\b/
    ];
    
    return debateTriggers.some(trigger => trigger.test(lowerText));
  }

  /**
   * Enter debate mode
   */
  enterDebateMode(opponent, topic) {
    this.debateMode = true;
    this.debateOpponent = opponent;
    this.debateStance = topic;
    
    console.log(`⚔️ [Debate] Starting with ${opponent} on: ${topic}`);
  }

  /**
   * Get debate context
   */
  getDebateContext(theirArgument) {
    if (!this.debateMode) return '';
    
    const context = `\n[DEBATE MODE ACTIVE] You're debating ${this.debateOpponent} about: "${this.debateStance}"
Their argument: "${theirArgument}"

DEBATE RULES:
- Stand your ground - don't back down easily
- Use logic and examples to support your stance
- Acknowledge good points but counter them
- Be witty and sharp, not angry
- Escalate intensity if they do
- Can end with "agree to disagree" after 3+ exchanges if stuck

Example responses:
- "okay but here's why you're wrong: [reason]"
- "that's a fair point BUT [counter]"
- "you're literally proving my point"
- "alright i see what you mean, still think [stance] though"
- "we're gonna have to agree to disagree on this one"`;
    
    return context;
  }

  /**
   * Check if debate should end
   */
  shouldEndDebate(exchangeCount) {
    // End after 5 exchanges or if losing steam
    if (exchangeCount > 5) {
      return true;
    }
    
    // 20% chance to concede gracefully
    if (exchangeCount > 2 && Math.random() < 0.2) {
      return true;
    }
    
    return false;
  }

  /**
   * Exit debate mode
   */
  exitDebateMode() {
    console.log(`✌️ [Debate] Ending debate with ${this.debateOpponent}`);
    this.debateMode = false;
    this.debateOpponent = null;
    this.debateStance = null;
  }

  /**
   * Generate concession message
   */
  generateConcession() {
    const concessions = [
      "alright you might have a point there",
      "okay fair enough",
      "agree to disagree",
      "we can both be right in different ways",
      "you've convinced me a little bit"
    ];
    
    return concessions[Math.floor(Math.random() * concessions.length)];
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalTakes: this.hotTakes.length,
      usedTakes: this.usedTakes.size,
      inDebate: this.debateMode,
      debateWith: this.debateOpponent
    };
  }
}

module.exports = HotTakeGenerator;
