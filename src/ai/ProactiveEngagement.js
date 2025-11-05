const path = require('path');
const WriteQueue = require('../stability/WriteQueue');
const logger = require('../bot/logger');

/**
 * ProactiveEngagement - Slunt initiates conversations autonomously
 * Phase 3: Social & Community Features
 *
 * Slunt doesn't just wait to be mentioned - he actively engages!
 */
class ProactiveEngagement {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.dataPath = path.join(__dirname, '../../data/proactive_engagement.json');
    this.state = {
      lastProactiveMessage: null,
      conversationLulls: [],
      pendingFollowUps: [],
      engagementScore: 0,
      successfulEngagements: 0,
      failedEngagements: 0
    };

    this.config = {
      lullThresholdMinutes: 5,  // 5 minutes of silence
      minTimeBetweenProactive: 10, // 10 minutes minimum between proactive messages
      maxPendingFollowUps: 20,
      engagementChance: 0.3  // 30% chance to engage during a lull
    };

    this.initialized = false;
    this.checkInterval = null;

    logger.info('💬 ProactiveEngagement created');
  }

  /**
   * Initialize the system
   */
  async initialize() {
    if (this.initialized) return;

    logger.info('💬 Initializing ProactiveEngagement...');

    // Load state
    await this.loadState();

    // Start checking for opportunities every minute
    this.checkInterval = setInterval(() => {
      this.checkForOpportunities();
    }, 60 * 1000); // Every minute

    this.initialized = true;
    logger.info('✅ ProactiveEngagement initialized');
  }

  /**
   * Load state from file
   */
  async loadState() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf-8');
        this.state = { ...this.state, ...JSON.parse(data) };
        logger.info(`💬 Loaded proactive engagement state`);
      } else {
        await this.saveState();
      }
    } catch (error) {
      logger.error('❌ Error loading proactive engagement state:', error);
    }
  }

  /**
   * Save state to file
   */
  async saveState() {
    try {
      await WriteQueue.writeJSON(this.dataPath, this.state);
    } catch (error) {
      logger.error('❌ Error saving proactive engagement state:', error);
    }
  }

  /**
   * Detect conversation lull
   * @param {string} platform - Platform to check
   * @returns {boolean} True if lull detected
   */
  isConversationLull(platform) {
    // Get last activity time for platform
    const lastActivity = this.chatBot?.platformActivity?.[platform] || Date.now();
    const minutesSinceActivity = (Date.now() - lastActivity) / (1000 * 60);

    return minutesSinceActivity >= this.config.lullThresholdMinutes;
  }

  /**
   * Check if enough time has passed since last proactive message
   * @returns {boolean} True if can send proactive message
   */
  canSendProactiveMessage() {
    if (!this.state.lastProactiveMessage) return true;

    const minutesSinceLast = (Date.now() - this.state.lastProactiveMessage) / (1000 * 60);
    return minutesSinceLast >= this.config.minTimeBetweenProactive;
  }

  /**
   * Check for engagement opportunities
   */
  async checkForOpportunities() {
    if (!this.initialized) return;
    if (!this.chatBot) return;

    // Don't engage if recently sent proactive message
    if (!this.canSendProactiveMessage()) return;

    // Check for lulls on each platform
    const platforms = ['discord', 'twitch', 'coolhole'];

    for (const platform of platforms) {
      if (this.isConversationLull(platform)) {
        // Random chance to engage
        if (Math.random() < this.config.engagementChance) {
          await this.initiateConversation(platform);
          break; // Only one platform at a time
        }
      }
    }

    // Check for pending follow-ups
    await this.checkFollowUps();
  }

  /**
   * Initiate a conversation on a platform
   * @param {string} platform - Platform to engage on
   */
  async initiateConversation(platform) {
    logger.info(`💬 Initiating proactive conversation on ${platform}`);

    try {
      // Generate conversation starter
      const starter = await this.generateStarter(platform);

      if (!starter) {
        logger.debug('💬 No suitable conversation starter generated');
        return;
      }

      // Send message through chatBot
      await this.chatBot.sendMessage(platform, starter.message, starter.options);

      // Update state
      this.state.lastProactiveMessage = Date.now();
      this.state.engagementScore++;
      await this.saveState();

      logger.info(`💬 Sent proactive message: "${starter.message.substring(0, 50)}..."`);

    } catch (error) {
      logger.error(`❌ Error initiating conversation on ${platform}:`, error);
      this.state.failedEngagements++;
      await this.saveState();
    }
  }

  /**
   * Generate conversation starter
   * @param {string} platform - Platform
   * @returns {Object} { message, options }
   */
  async generateStarter(platform) {
    const starterTypes = [
      'topic_callback',
      'found_content',
      'personal_update',
      'community_observation',
      'random_thought'
    ];

    // Weighted selection (favor callbacks and observations)
    const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
    const type = this.weightedRandom(starterTypes, weights);

    switch (type) {
      case 'topic_callback':
        return this.generateTopicCallback(platform);

      case 'found_content':
        return this.generateContentShare(platform);

      case 'personal_update':
        return this.generatePersonalUpdate(platform);

      case 'community_observation':
        return this.generateCommunityObservation(platform);

      case 'random_thought':
        return this.generateRandomThought(platform);

      default:
        return null;
    }
  }

  /**
   * Generate topic callback (reference past conversation)
   * @param {string} platform - Platform
   */
  generateTopicCallback(platform) {
    // Get recent topics from chat learning
    const recentTopics = this.chatBot?.chatLearning?.getRecentTopics?.(platform, 5) || [];

    if (recentTopics.length === 0) return null;

    const topic = recentTopics[Math.floor(Math.random() * recentTopics.length)];

    const templates = [
      `Hey, remember when we were talking about ${topic}? I was thinking...`,
      `So about ${topic} from earlier - here's the thing...`,
      `Been thinking about that ${topic} discussion. Wild stuff.`,
      `${topic} came up in my feed, reminded me of our chat`,
      `Okay so ${topic} - I have a take on this now`
    ];

    const message = templates[Math.floor(Math.random() * templates.length)];

    return { message, options: { platform } };
  }

  /**
   * Generate content share (found something interesting)
   * @param {string} platform - Platform
   */
  generateContentShare(platform) {
    // Get user interests from social awareness
    const activeUsers = this.chatBot?.socialAwareness?.getActiveUsers?.(platform) || [];

    if (activeUsers.length === 0) return null;

    const user = activeUsers[Math.floor(Math.random() * activeUsers.length)];

    const templates = [
      `Yo @${user}, found something you'd probably hate: [hypothetical link]`,
      `@${user} this is so you: [hypothetical content]`,
      `Stumbled on this and thought of @${user} immediately`,
      `@${user} look what I found lmao`
    ];

    const message = templates[Math.floor(Math.random() * templates.length)];

    return { message, options: { platform } };
  }

  /**
   * Generate personal update (Slunt's activities)
   * @param {string} platform - Platform
   */
  generatePersonalUpdate(platform) {
    // Get today's activities if DailyActivities system exists
    const activities = this.chatBot?.dailyActivities?.getTodayActivities?.() || [];

    const templates = [
      `I've been thinking about something dumb all day`,
      `Had the weirdest thought earlier`,
      `Been down a rabbit hole about [topic] for like an hour`,
      `Watched a video about [topic] that broke my brain`,
      `Someone explain why [random thing] is the way it is`
    ];

    const message = templates[Math.floor(Math.random() * templates.length)];

    return { message, options: { platform } };
  }

  /**
   * Generate community observation
   * @param {string} platform - Platform
   */
  generateCommunityObservation(platform) {
    const templates = [
      `This chat has been suspiciously quiet today`,
      `Everyone just vibing or what?`,
      `Dead chat dead chat dead chat`,
      `Y'all abandoned me or something?`,
      `Guess it's just me and my thoughts now`
    ];

    const message = templates[Math.floor(Math.random() * templates.length)];

    return { message, options: { platform } };
  }

  /**
   * Generate random thought
   * @param {string} platform - Platform
   */
  generateRandomThought(platform) {
    const templates = [
      `Random thought: what if ${this.generateRandomWhat()}`,
      `Okay but seriously though ${this.generateRandomStatement()}`,
      `Nobody asked but ${this.generateRandomOpinion()}`,
      `Hot take incoming: ${this.generateRandomOpinion()}`,
      `I'm bored so here's a question: ${this.generateRandomQuestion()}`
    ];

    const message = templates[Math.floor(Math.random() * templates.length)];

    return { message, options: { platform } };
  }

  /**
   * Helper: Generate random "what if" scenario
   */
  generateRandomWhat() {
    const scenarios = [
      'we all just agreed to start over',
      'the internet was never invented',
      'everyone could read minds',
      'time travel was real but super expensive',
      'aliens showed up tomorrow'
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  /**
   * Helper: Generate random statement
   */
  generateRandomStatement() {
    const statements = [
      'I think we peaked as a society in like 2007',
      'the 90s were way more chaotic than people remember',
      'nostalgia is just cope',
      'everything good eventually gets ruined',
      'we live in the weirdest timeline'
    ];
    return statements[Math.floor(Math.random() * statements.length)];
  }

  /**
   * Helper: Generate random opinion
   */
  generateRandomOpinion() {
    const opinions = [
      'pineapple on pizza is fine actually',
      'cereal is a soup',
      'water is overrated',
      'morning people are lying to themselves',
      'memes peaked in 2016'
    ];
    return opinions[Math.floor(Math.random() * opinions.length)];
  }

  /**
   * Helper: Generate random question
   */
  generateRandomQuestion() {
    const questions = [
      'what\'s a hill you\'d die on?',
      'what\'s your most controversial opinion?',
      'if you could delete one thing from existence what would it be?',
      'what\'s something everyone likes but you hate?',
      'what year would you go back to if you could?'
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Schedule a follow-up message
   * @param {Object} followUp - Follow-up details
   */
  scheduleFollowUp(followUp) {
    const { userId, topic, platform, whenMinutes } = followUp;

    const followUpTime = Date.now() + (whenMinutes * 60 * 1000);

    this.state.pendingFollowUps.push({
      id: `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      topic,
      platform,
      scheduledTime: followUpTime,
      createdAt: Date.now()
    });

    // Trim old follow-ups
    if (this.state.pendingFollowUps.length > this.config.maxPendingFollowUps) {
      this.state.pendingFollowUps = this.state.pendingFollowUps.slice(-this.config.maxPendingFollowUps);
    }

    this.saveState();

    logger.info(`💬 Scheduled follow-up with ${userId} about "${topic}" in ${whenMinutes} minutes`);
  }

  /**
   * Check pending follow-ups
   */
  async checkFollowUps() {
    const now = Date.now();

    for (let i = this.state.pendingFollowUps.length - 1; i >= 0; i--) {
      const followUp = this.state.pendingFollowUps[i];

      if (now >= followUp.scheduledTime) {
        // Execute follow-up
        await this.executeFollowUp(followUp);

        // Remove from list
        this.state.pendingFollowUps.splice(i, 1);
        await this.saveState();
      }
    }
  }

  /**
   * Execute a scheduled follow-up
   * @param {Object} followUp - Follow-up details
   */
  async executeFollowUp(followUp) {
    logger.info(`💬 Executing follow-up with ${followUp.userId} about "${followUp.topic}"`);

    try {
      const message = `Hey @${followUp.userId}, how'd that ${followUp.topic} thing go?`;

      await this.chatBot.sendMessage(followUp.platform, message);

      this.state.successfulEngagements++;
      await this.saveState();

    } catch (error) {
      logger.error(`❌ Error executing follow-up:`, error);
      this.state.failedEngagements++;
      await this.saveState();
    }
  }

  /**
   * Weighted random selection
   * @param {Array} items - Items to choose from
   * @param {Array} weights - Weights for each item
   */
  weightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  /**
   * Record proactive message response
   * @param {boolean} gotResponse - Whether message got a response
   */
  recordResponse(gotResponse) {
    if (gotResponse) {
      this.state.successfulEngagements++;
      this.state.engagementScore += 2; // Bonus for successful engagement
    } else {
      this.state.failedEngagements++;
      this.state.engagementScore = Math.max(0, this.state.engagementScore - 1);
    }

    this.saveState();
  }

  /**
   * Get feature statistics
   */
  getStats() {
    const successRate = this.state.successfulEngagements /
      (this.state.successfulEngagements + this.state.failedEngagements) || 0;

    return {
      initialized: this.initialized,
      engagementScore: this.state.engagementScore,
      successfulEngagements: this.state.successfulEngagements,
      failedEngagements: this.state.failedEngagements,
      successRate: (successRate * 100).toFixed(1) + '%',
      pendingFollowUps: this.state.pendingFollowUps.length,
      lastProactiveMessage: this.state.lastProactiveMessage ?
        new Date(this.state.lastProactiveMessage).toISOString() : 'Never'
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('💬 ProactiveEngagement shutting down...');

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    await this.saveState();

    this.initialized = false;
  }
}

module.exports = ProactiveEngagement;
