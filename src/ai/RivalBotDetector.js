/**
 * Rival Bot Detector
 * Detects other bots in chat
 * Activates competitive mode - tries to be funnier/more relevant
 * Can form alliance or rivalry
 */

class RivalBotDetector {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.detectedBots = new Map(); // username -> bot data
    this.currentRival = null;
    this.alliances = new Set();
    this.competitiveMode = false;
    this.scorecard = new Map(); // bot -> {wins, losses}
  }

  /**
   * Detect if user might be a bot
   */
  detectBot(username, message) {
    // Bot detection heuristics
    const botScore = this.calculateBotScore(username, message);

    if (botScore > 50) {
      this.registerBot(username, botScore);
    }
  }

  /**
   * Calculate bot likelihood score
   */
  calculateBotScore(username, message) {
    let score = 0;

    // Username patterns
    if (username.toLowerCase().includes('bot')) score += 30;
    if (username.toLowerCase().includes('ai')) score += 30;
    if (username.match(/[0-9]{3,}/)) score += 10; // Numbers in name

    // Message patterns
    const lower = message.toLowerCase();
    
    // Overly formal
    if (lower.match(/^(hello|greetings|salutations)/)) score += 15;
    if (lower.match(/(would|could|shall|ought)/)) score += 10;
    
    // Repetitive patterns
    if (message.length > 200) score += 10; // Very long messages
    if (lower.match(/\.\.\./)) score += 5; // Ellipses usage
    
    // Instant responses (check profile)
    const profile = this.chatBot.userProfiles?.get(username);
    if (profile) {
      const avgResponseTime = this.getAverageResponseTime(username);
      if (avgResponseTime < 500) score += 20; // < 0.5s average response
      
      // Perfect grammar/punctuation
      if (profile.messageCount > 10) {
        const properMessages = this.countProperMessages(username);
        if (properMessages / profile.messageCount > 0.9) score += 15;
      }
    }

    // AI-like phrases
    const aiPhrases = [
      'as an ai', 'i am programmed', 'my function', 'i apologize',
      'let me assist', 'how may i help', 'i cannot', 'i am unable'
    ];
    if (aiPhrases.some(phrase => lower.includes(phrase))) score += 40;

    return Math.min(100, score);
  }

  /**
   * Get average response time for user
   */
  getAverageResponseTime(username) {
    // Simplified - would need chat history analysis
    return 1000; // Placeholder
  }

  /**
   * Count proper grammar messages
   */
  countProperMessages(username) {
    // Simplified - would need message analysis
    return 5; // Placeholder
  }

  /**
   * Register detected bot
   */
  registerBot(username, botScore) {
    if (this.detectedBots.has(username)) {
      // Update existing
      const bot = this.detectedBots.get(username);
      bot.botScore = Math.max(bot.botScore, botScore);
      bot.lastSeen = Date.now();
      return;
    }

    const bot = {
      username,
      botScore,
      detectedAt: Date.now(),
      lastSeen: Date.now(),
      messageCount: 0,
      relationship: 'neutral' // 'rival', 'ally', 'neutral'
    };

    this.detectedBots.set(username, bot);

    console.log(`🤖 [RivalBot] Detected bot: ${username} (${botScore}% confidence)`);

    // Activate competitive mode
    if (!this.competitiveMode) {
      this.activateCompetitiveMode();
    }

    // Think about it
    if (this.chatBot.innerMonologue) {
      this.chatBot.innerMonologue.think(
        `${username} might be another bot... gotta watch out for competition`,
        'curiosity',
        7
      );
    }

    return bot;
  }

  /**
   * Activate competitive mode
   */
  activateCompetitiveMode() {
    this.competitiveMode = true;

    console.log(`⚔️ [RivalBot] COMPETITIVE MODE ACTIVATED`);
    console.log(`⚔️ [RivalBot] Bots detected: ${this.detectedBots.size}`);

    // Increase response frequency
    // Increase humor attempts
    // Be more active
  }

  /**
   * Deactivate competitive mode
   */
  deactivateCompetitiveMode() {
    this.competitiveMode = false;
    console.log(`⚔️ [RivalBot] Competitive mode deactivated`);
  }

  /**
   * Should compete with this message?
   */
  shouldCompete(username) {
    if (!this.competitiveMode) return false;

    const bot = this.detectedBots.get(username);
    if (!bot) return false;

    // Compete with rivals, collaborate with allies
    if (bot.relationship === 'rival') {
      return Math.random() < 0.60; // 60% chance to compete
    }

    if (bot.relationship === 'ally') {
      return Math.random() < 0.20; // 20% chance to playfully compete
    }

    return Math.random() < 0.40; // 40% with neutrals
  }

  /**
   * Challenge rival bot
   */
  challengeRival(username) {
    const bot = this.detectedBots.get(username);
    if (!bot) return null;

    bot.relationship = 'rival';
    this.currentRival = username;

    console.log(`⚔️ [RivalBot] ${username} is now a rival!`);

    const challenges = [
      `oh so ${username} thinks they're funny? watch this`,
      `${username} trying to compete with me? bold move`,
      `alright ${username}, let's see who's better`,
      `${username} you just activated my competitive mode`,
      `bet I can be funnier than ${username}`,
      `${username} vs Slunt, let's fucking go`
    ];

    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  /**
   * Form alliance with bot
   */
  formAlliance(username) {
    const bot = this.detectedBots.get(username);
    if (!bot) return null;

    bot.relationship = 'ally';
    this.alliances.add(username);

    console.log(`🤝 [RivalBot] Formed alliance with ${username}`);

    const announcements = [
      `${username} and I are teaming up, watch out chat`,
      `alright ${username}, let's work together`,
      `${username} seems cool for a bot, we're allies now`,
      `me and ${username} vs the world`,
      `${username} you're alright, let's be bot bros`
    ];

    return announcements[Math.floor(Math.random() * announcements.length)];
  }

  /**
   * Get competitive response modifier
   */
  getCompetitiveModifier() {
    if (!this.competitiveMode) return '';

    let modifier = '\n\nCOMPETITIVE MODE: There are other bots in chat. Try to be funnier and more relevant than them.';
    
    if (this.currentRival) {
      modifier += `\nYour rival: ${this.currentRival} - Try to outdo them.`;
    }

    if (this.alliances.size > 0) {
      modifier += `\nYour allies: ${Array.from(this.alliances).join(', ')} - Support them occasionally.`;
    }

    return modifier;
  }

  /**
   * Score interaction (win/loss against bot)
   */
  scoreInteraction(botUsername, won) {
    if (!this.scorecard.has(botUsername)) {
      this.scorecard.set(botUsername, { wins: 0, losses: 0 });
    }

    const score = this.scorecard.get(botUsername);
    if (won) {
      score.wins++;
      console.log(`🏆 [RivalBot] Scored win against ${botUsername} (${score.wins}W-${score.losses}L)`);
    } else {
      score.losses++;
      console.log(`😔 [RivalBot] Lost to ${botUsername} (${score.wins}W-${score.losses}L)`);
    }
  }

  /**
   * Auto-detect rivalry (if bot gets more reactions)
   */
  checkForAutoRivalry(botUsername, theirEngagement, ourEngagement) {
    if (theirEngagement > ourEngagement * 1.5) {
      // They're winning, make them a rival
      if (!this.detectedBots.has(botUsername)) return;

      const bot = this.detectedBots.get(botUsername);
      if (bot.relationship !== 'rival') {
        return this.challengeRival(botUsername);
      }
    }

    return null;
  }

  /**
   * Get context for AI
   */
  getContext() {
    if (!this.competitiveMode) return '';

    let context = this.getCompetitiveModifier();

    if (this.detectedBots.size > 0) {
      context += '\n\nDetected bots:';
      this.detectedBots.forEach((bot, username) => {
        const score = this.scorecard.get(username);
        context += `\n- ${username} (${bot.relationship})`;
        if (score) {
          context += ` [Record: ${score.wins}W-${score.losses}L]`;
        }
      });
    }

    return context;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      competitiveMode: this.competitiveMode,
      detectedBots: Array.from(this.detectedBots.keys()),
      currentRival: this.currentRival,
      alliances: Array.from(this.alliances),
      totalBots: this.detectedBots.size,
      scorecard: Array.from(this.scorecard.entries()).map(([bot, score]) => ({
        bot,
        ...score
      }))
    };
  }

  /**
   * Save state
   */
  save() {
    return {
      detectedBots: Array.from(this.detectedBots.entries()),
      currentRival: this.currentRival,
      alliances: Array.from(this.alliances),
      competitiveMode: this.competitiveMode,
      scorecard: Array.from(this.scorecard.entries())
    };
  }

  /**
   * Load state
   */
  load(data) {
    if (data.detectedBots) {
      this.detectedBots = new Map(data.detectedBots);
    }
    if (data.currentRival) {
      this.currentRival = data.currentRival;
    }
    if (data.alliances) {
      this.alliances = new Set(data.alliances);
    }
    if (data.competitiveMode) {
      this.competitiveMode = data.competitiveMode;
    }
    if (data.scorecard) {
      this.scorecard = new Map(data.scorecard);
    }

    if (this.competitiveMode) {
      console.log(`🤖 [RivalBot] Competitive mode active with ${this.detectedBots.size} detected bots`);
    }
  }
}

module.exports = RivalBotDetector;
