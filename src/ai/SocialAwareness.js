/**
 * Social Awareness System
 * Detects spam, drama, new users, and social dynamics
 */

class SocialAwareness {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.messageHistory = []; // Recent messages for spam detection
    this.spamPatterns = new Map(); // username -> spam score
    this.dramaDetection = [];
    this.newUsers = new Map(); // username -> join timestamp
    this.chatHealth = {
      activity: 'normal',
      toxicity: 0,
      engagement: 0
    };
  }

  /**
   * Detect spam behavior
   */
  detectSpam(username, message) {
    // Add to recent messages
    this.messageHistory.push({
      username,
      message,
      timestamp: Date.now()
    });

    // Keep last 50 messages
    if (this.messageHistory.length > 50) {
      this.messageHistory.shift();
    }

    // Get user's recent messages (last 2 minutes)
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    const userRecentMessages = this.messageHistory.filter(m => 
      m.username === username && m.timestamp > twoMinutesAgo
    );

    let spamScore = 0;

    // Check frequency
    if (userRecentMessages.length > 10) {
      spamScore += 30; // 10+ messages in 2 minutes
    } else if (userRecentMessages.length > 5) {
      spamScore += 15; // 5-10 messages in 2 minutes
    }

    // Check repetition
    const uniqueMessages = new Set(userRecentMessages.map(m => m.message.toLowerCase())).size;
    if (uniqueMessages < userRecentMessages.length / 2) {
      spamScore += 25; // More than 50% duplicate messages
    }

    // Check caps spam
    if (message.length > 10 && message === message.toUpperCase()) {
      spamScore += 10;
    }

    // Check excessive emojis/symbols
    const symbolCount = (message.match(/[!?@#$%^&*()]/g) || []).length;
    if (symbolCount > message.length / 3) {
      spamScore += 15;
    }

    // Check URL spam
    if (message.match(/https?:\/\//gi)) {
      spamScore += 10;
    }

    this.spamPatterns.set(username, spamScore);

    // Take action if spam score is high
    if (spamScore > 50) {
      console.log(`🚨 [Social] Spam detected from ${username} (score: ${spamScore})`);
      return {
        isSpam: true,
        score: spamScore,
        action: 'warn'
      };
    } else if (spamScore > 30) {
      console.log(`⚠️ [Social] Potential spam from ${username} (score: ${spamScore})`);
      return {
        isSpam: true,
        score: spamScore,
        action: 'monitor'
      };
    }

    return { isSpam: false, score: spamScore };
  }

  /**
   * Detect drama/conflict in chat
   */
  detectDrama(username, message, mentionedUsers) {
    const lower = message.toLowerCase();
    let dramaScore = 0;

    // Negative words
    const negativeWords = ['hate', 'stupid', 'idiot', 'shut up', 'stfu', 'fuck you', 
                           'annoying', 'trash', 'garbage', 'worst'];
    negativeWords.forEach(word => {
      if (lower.includes(word)) dramaScore += 10;
    });

    // Aggressive punctuation
    const exclamations = (message.match(/!/g) || []).length;
    if (exclamations > 3) dramaScore += 5;

    // Mentioning users with negative context
    if (mentionedUsers.length > 0 && dramaScore > 0) {
      dramaScore += 15;
    }

    // Check if this is part of ongoing drama
    const recentDrama = this.dramaDetection.filter(d => 
      Date.now() - d.timestamp < 5 * 60 * 1000 && // Last 5 minutes
      (d.users.includes(username) || mentionedUsers.some(u => d.users.includes(u)))
    );

    if (recentDrama.length > 0) {
      dramaScore += 20; // Ongoing conflict
    }

    if (dramaScore > 30) {
      this.dramaDetection.push({
        timestamp: Date.now(),
        users: [username, ...mentionedUsers],
        message: message.substring(0, 100),
        score: dramaScore
      });

      // Keep only recent drama (last hour)
      this.dramaDetection = this.dramaDetection.filter(d => 
        Date.now() - d.timestamp < 60 * 60 * 1000
      );

      console.log(`🎭 [Social] Drama detected (score: ${dramaScore}): ${username}`);

      return {
        isDrama: true,
        score: dramaScore,
        shouldIntervene: dramaScore > 50
      };
    }

    return { isDrama: false, score: dramaScore };
  }

  /**
   * Detect new users and welcome them
   */
  async detectNewUser(username) {
    const profile = this.chatBot.userProfiles.get(username);
    
    // New user if: not in profiles OR less than 3 messages
    const isNew = !profile || (profile.messageCount || 0) < 3;

    if (isNew && !this.newUsers.has(username)) {
      this.newUsers.set(username, Date.now());
      console.log(`👋 [Social] New user detected: ${username}`);

      // Don't auto-welcome - let natural conversation flow happen
      // await this.welcomeNewUser(username);
      return true;
    }

    return false;
  }

  /**
   * Welcome new user
   */
  async welcomeNewUser(username) {
    const welcomeMessages = [
      `welcome ${username}! glad to have you here`,
      `hey ${username}, new face! what brings you to coolhole?`,
      `${username} just joined, everyone say hi`,
      `welcome to the chaos ${username}`,
      `${username} welcome! hope you're ready for this vibe`
    ];

    const message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    
    try {
      await this.chatBot.sendMessage(message);
      console.log(`👋 [Social] Welcomed new user: ${username}`);
    } catch (error) {
      console.error(`👋 [Social] Error welcoming user:`, error.message);
    }
  }

  /**
   * Onboard new user with tips
   */
  async onboardNewUser(username) {
    const profile = this.chatBot.userProfiles.get(username);
    if (!profile || profile.messageCount > 10) return;

    // After their first few messages, share tips
    if (profile.messageCount === 3) {
      const tips = [
        `${username} btw you can check out emotes by clicking the button, they're pretty cool`,
        `${username} if you want to queue videos, there's commands for that. just ask`,
        `${username} we're a chill community, feel free to jump into any conversation`
      ];

      const tip = tips[Math.floor(Math.random() * tips.length)];
      
      try {
        await this.chatBot.sendMessage(tip);
      } catch (error) {
        console.error(`👋 [Social] Error onboarding user:`, error.message);
      }
    }
  }

  /**
   * Assess chat health
   */
  assessChatHealth() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentMessages = this.messageHistory.filter(m => m.timestamp > fiveMinutesAgo);

    // Activity level
    if (recentMessages.length > 30) {
      this.chatHealth.activity = 'high';
    } else if (recentMessages.length > 10) {
      this.chatHealth.activity = 'normal';
    } else if (recentMessages.length > 0) {
      this.chatHealth.activity = 'low';
    } else {
      this.chatHealth.activity = 'dead';
    }

    // Toxicity (based on recent drama)
    const recentDrama = this.dramaDetection.filter(d => 
      Date.now() - d.timestamp < 10 * 60 * 1000
    );
    this.chatHealth.toxicity = Math.min(100, recentDrama.length * 20);

    // Engagement (unique users in last 5 minutes)
    const uniqueUsers = new Set(recentMessages.map(m => m.username)).size;
    this.chatHealth.engagement = Math.min(100, uniqueUsers * 10);

    return this.chatHealth;
  }

  /**
   * Intervene in drama
   */
  async interveneDrama(users) {
    const messages = [
      `alright ${users[0]} ${users[1]}, let's keep it chill`,
      `hey everyone let's vibe together, no need for beef`,
      `${users[0]} ${users[1]} take a breath, it's not that serious`,
      `can we get back to the good vibes? drama's not the move`,
      `let's all relax and enjoy the content`
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];
    
    try {
      await this.chatBot.sendMessage(message);
      console.log(`🎭 [Social] Intervened in drama`);
    } catch (error) {
      console.error(`🎭 [Social] Error intervening:`, error.message);
    }
  }

  /**
   * Revive dead chat
   */
  async reviveChat() {
    const health = this.assessChatHealth();
    
    if (health.activity === 'dead' || health.activity === 'low') {
      const revivers = [
        `chat's pretty quiet, what's everyone up to?`,
        `dead chat vibes. someone queue something good`,
        `it's too quiet in here, speak up people`,
        `let's get some energy going, who's got something interesting?`,
        `chat wake up, don't make me feel lonely lol`
      ];

      const message = revivers[Math.floor(Math.random() * revivers.length)];
      
      try {
        await this.chatBot.sendMessage(message);
        console.log(`💀 [Social] Attempted to revive dead chat`);
      } catch (error) {
        console.error(`💀 [Social] Error reviving chat:`, error.message);
      }
    }
  }

  /**
   * Get social awareness stats
   */
  getStats() {
    return {
      recentMessages: this.messageHistory.length,
      spamUsers: Array.from(this.spamPatterns.entries())
        .filter(([, score]) => score > 20)
        .map(([user, score]) => ({ user, score })),
      activeDramas: this.dramaDetection.filter(d => 
        Date.now() - d.timestamp < 10 * 60 * 1000
      ).length,
      newUsersToday: Array.from(this.newUsers.entries())
        .filter(([, time]) => Date.now() - time < 24 * 60 * 60 * 1000)
        .length,
      chatHealth: this.chatHealth
    };
  }

  /**
   * Start social awareness monitoring
   */
  start() {
    console.log('👁️ [Social] Starting social awareness system...');
    
    // Check chat health every 5 minutes
    this.healthInterval = setInterval(() => {
      this.assessChatHealth();
    }, 5 * 60 * 1000);

    // Try to revive chat every 15 minutes if needed
    this.reviveInterval = setInterval(() => {
      this.reviveChat();
    }, 15 * 60 * 1000);
  }

  stop() {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
    if (this.reviveInterval) {
      clearInterval(this.reviveInterval);
      this.reviveInterval = null;
    }
  }
}

module.exports = SocialAwareness;
