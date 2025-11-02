/**
 * Banter & Roast Balance System
 * Scales teasing/roasting based on friendship level
 */

class BanterBalance {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.recentRoasts = new Map(); // username -> timestamp
    this.roastCooldown = 10 * 60 * 1000; // 10 minutes between roasts
  }

  /**
   * Get banter level guidance for user
   */
  getBanterContext(username) {
    if (!this.chatBot.userProfiles) {
      return '';
    }

    const profile = this.chatBot.userProfiles.get(username);
    if (!profile) {
      return '\n[BANTER LEVEL: Respectful] New person - be friendly, no roasting yet';
    }

    const friendship = profile.friendshipLevel || 0;
    const messageCount = profile.messageCount || 0;
    const lastRoastTime = this.recentRoasts.get(username) || 0;
    const timeSinceRoast = Date.now() - lastRoastTime;
    const canRoast = timeSinceRoast > this.roastCooldown;

    // Determine banter level
    if (friendship > 80 || messageCount > 200) {
      return `\n[BANTER LEVEL: Best Friends] ${username} is a close friend - you can roast hard, make harsh jokes, tease mercilessly. They know it's love. ${canRoast ? 'Feel free to roast them' : 'Maybe ease up on roasts for now'}.`;
    } else if (friendship > 60 || messageCount > 100) {
      return `\n[BANTER LEVEL: Good Friends] ${username} is a regular - playful teasing and light roasts are fine. Keep it fun, not mean. ${canRoast ? 'Light roasting ok' : 'Keep it friendly for now'}.`;
    } else if (friendship > 30 || messageCount > 30) {
      return `\n[BANTER LEVEL: Acquaintances] ${username} is getting comfortable - gentle jokes ok, but be careful. Build trust before roasting.`;
    } else {
      return `\n[BANTER LEVEL: New] ${username} is new - be friendly and welcoming. NO roasting, NO teasing yet. Build rapport first.`;
    }
  }

  /**
   * Track when we roasted someone
   */
  markRoast(username) {
    this.recentRoasts.set(username, Date.now());
    console.log(`🔥 [Banter] Roasted ${username}, cooldown active for 10min`);
  }

  /**
   * Check if roast went too far (user responded negatively)
   */
  checkRoastReception(username, theirResponse) {
    const negative = /\b(rude|mean|shut up|stfu|fuck off|wtf|uncool)\b/i.test(theirResponse);
    
    if (negative) {
      console.log(`⚠️ [Banter] ${username} didn't like the roast, backing off`);
      
      // Extend cooldown
      this.recentRoasts.set(username, Date.now() + 20 * 60 * 1000); // 30 min cooldown
      
      return {
        tooFar: true,
        apologyNeeded: true
      };
    }
    
    return { tooFar: false };
  }

  /**
   * Get back-and-forth banter prompt
   */
  getContinuationContext(username, theirMessage) {
    const profile = this.chatBot.userProfiles?.get(username);
    if (!profile || (profile.friendshipLevel || 0) < 50) {
      return ''; // Not close enough for extended banter
    }

    const lowerMsg = theirMessage.toLowerCase();
    
    // They're bantering back
    if (lowerMsg.match(/\b(says you|look who's talking|you're one to talk|same to you)\b/)) {
      return '\n[BANTER CONTINUATION] They\'re bantering back! Keep the playful back-and-forth going. Escalate slightly but keep it fun.';
    }
    
    // They roasted you back
    if (lowerMsg.match(/\b(stupid|dumb|idiot|loser|shut up)\b/)) {
      return '\n[ROAST BATTLE] They roasted you back! This is a roast battle now. Fire back with a good comeback, keep it playful.';
    }
    
    return '';
  }

  /**
   * Suggest comeback if getting roasted
   */
  getComebackSuggestion(roastText) {
    const comebacks = [
      "says the person who [reference something they said]",
      "bold words from someone who [playful insult]",
      "at least i'm not [reference their thing]",
      "you would say that",
      "wow got me there /s",
      "coming from you? that's rich",
      "i'll take advice from someone who knows what they're talking about",
      "alright that was actually good"
    ];
    
    return '\n[COMEBACK SUGGESTION]: ' + comebacks[Math.floor(Math.random() * comebacks.length)];
  }

  /**
   * Get stats
   */
  getStats() {
    const now = Date.now();
    const activeRoasts = Array.from(this.recentRoasts.entries())
      .filter(([_, time]) => now - time < this.roastCooldown);
    
    return {
      totalRoasts: this.recentRoasts.size,
      onCooldown: activeRoasts.length
    };
  }
}

module.exports = BanterBalance;
