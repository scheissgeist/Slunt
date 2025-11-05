const logger = require('../bot/logger');
const fs = require('fs');
const path = require('path');

/**
 * ConversationPlanner - Multi-turn conversation planning
 * Phase 2 Implementation - FULLY IMPLEMENTED
 *
 * Plans and executes multi-turn conversations autonomously:
 * - Story arcs (setup, build, payoff)
 * - Multi-step explanations
 * - Callbacks to previous conversations
 * - Planned reveals and surprises
 * - Long-form arguments/debates
 */
class ConversationPlanner {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.initialized = false;

    // Data file
    this.dataFile = path.join(__dirname, '../../data/conversation_plans.json');

    // State
    this.activePlans = new Map(); // platform -> plan
    this.planHistory = [];
    this.stats = {
      totalPlansCreated: 0,
      completedPlans: 0,
      abandonedPlans: 0,
      avgTurnsPerPlan: 0
    };

    logger.info(`🗺️  ConversationPlanner created`);
  }

  /**
   * Initialize the system
   */
  async initialize() {
    if (this.initialized) return;

    logger.info(`🗺️  Initializing ConversationPlanner...`);

    // Load saved plans
    await this.loadPlans();

    // Check for expired/abandoned plans periodically
    this.checkInterval = setInterval(() => {
      this.checkActivePlans();
    }, 2 * 60 * 1000); // Every 2 minutes

    this.initialized = true;
    logger.info(`✅ ConversationPlanner initialized`);
  }

  /**
   * Create a new conversation plan
   * @param {Object} options - Plan parameters
   * @returns {Object} - Created plan
   */
  createPlan(options = {}) {
    const {
      type = 'story',           // story, explanation, debate, reveal, callback
      platform = 'coolhole',
      topic = 'random',
      targetUser = null,        // Optional specific user to engage
      turns = 3,                // Expected number of turns
      priority = 'normal',      // low, normal, high, urgent
      content = {}              // Type-specific content
    } = options;

    const plan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      platform,
      topic,
      targetUser,
      expectedTurns: turns,
      priority,
      content,
      status: 'active',
      currentTurn: 0,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messages: []
    };

    // Generate plan steps based on type
    plan.steps = this.generateSteps(plan);

    this.activePlans.set(platform, plan);
    this.stats.totalPlansCreated++;

    logger.info(`🗺️  [Plan] Created ${type} plan for ${platform} (${turns} turns)`);

    return plan;
  }

  /**
   * Generate steps for a plan based on its type
   * @private
   */
  generateSteps(plan) {
    const { type, topic, content } = plan;

    switch (type) {
      case 'story':
        return this.generateStorySteps(topic, content);

      case 'explanation':
        return this.generateExplanationSteps(topic, content);

      case 'debate':
        return this.generateDebateSteps(topic, content);

      case 'reveal':
        return this.generateRevealSteps(topic, content);

      case 'callback':
        return this.generateCallbackSteps(topic, content);

      default:
        return [
          { type: 'intro', prompt: `Start discussing ${topic}` },
          { type: 'develop', prompt: `Continue the conversation about ${topic}` },
          { type: 'conclude', prompt: `Wrap up thoughts on ${topic}` }
        ];
    }
  }

  /**
   * Generate story arc steps (setup, build, payoff)
   * @private
   */
  generateStorySteps(topic, content) {
    const story = content.story || 'a personal anecdote';

    return [
      {
        type: 'setup',
        prompt: `Start telling a story about ${topic}. Set the scene, but don't give away the punchline.`,
        hints: ['casual start', 'build curiosity', 'leave them wondering']
      },
      {
        type: 'build',
        prompt: `Continue the story. Add details, create tension or intrigue.`,
        hints: ['add details', 'increase stakes', 'make it vivid']
      },
      {
        type: 'payoff',
        prompt: `Deliver the punchline or conclusion of the story.`,
        hints: ['satisfying ending', 'callback to setup', 'emotional landing']
      }
    ];
  }

  /**
   * Generate explanation steps
   * @private
   */
  generateExplanationSteps(topic, content) {
    return [
      {
        type: 'overview',
        prompt: `Give a simple overview of ${topic}. Don't go deep yet.`,
        hints: ['simple terms', 'big picture', 'relatable']
      },
      {
        type: 'details',
        prompt: `Explain the details of ${topic}. Go deeper.`,
        hints: ['specific examples', 'technical bits', 'show don\'t tell']
      },
      {
        type: 'implications',
        prompt: `Explain why ${topic} matters or is interesting.`,
        hints: ['so what?', 'real-world impact', 'personal take']
      }
    ];
  }

  /**
   * Generate debate/argument steps
   * @private
   */
  generateDebateSteps(topic, content) {
    const position = content.position || 'controversial';

    return [
      {
        type: 'thesis',
        prompt: `Make a ${position} claim about ${topic}.`,
        hints: ['bold statement', 'clear position', 'provocative']
      },
      {
        type: 'support',
        prompt: `Provide evidence or reasoning for your position on ${topic}.`,
        hints: ['examples', 'logic', 'anticipate counterarguments']
      },
      {
        type: 'conclusion',
        prompt: `Drive home your point about ${topic}. Challenge others to disagree.`,
        hints: ['restate thesis', 'call to action', 'mic drop moment']
      }
    ];
  }

  /**
   * Generate reveal steps (building to a surprise)
   * @private
   */
  generateRevealSteps(topic, content) {
    const secret = content.secret || 'something surprising';

    return [
      {
        type: 'hint',
        prompt: `Drop subtle hints about ${secret} related to ${topic}. Don't reveal yet.`,
        hints: ['mysterious', 'vague references', 'build curiosity']
      },
      {
        type: 'tease',
        prompt: `Get closer to revealing ${secret}. Build anticipation.`,
        hints: ['almost there', 'one more hint', 'make them ask']
      },
      {
        type: 'reveal',
        prompt: `Reveal ${secret} about ${topic}. Make it satisfying.`,
        hints: ['big reveal', 'worth the wait', 'surprise factor']
      }
    ];
  }

  /**
   * Generate callback steps (referencing past conversations)
   * @private
   */
  generateCallbackSteps(topic, content) {
    const pastEvent = content.pastEvent || 'something we talked about before';

    return [
      {
        type: 'reference',
        prompt: `Reference ${pastEvent} casually, see if anyone remembers.`,
        hints: ['subtle callback', 'test memory', 'inside joke']
      },
      {
        type: 'expand',
        prompt: `Expand on the callback. Add new perspective or information.`,
        hints: ['new angle', 'update', 'continuation']
      },
      {
        type: 'payoff',
        prompt: `Connect it to current conversation. Make the callback meaningful.`,
        hints: ['full circle', 'satisfying connection', 'it all makes sense now']
      }
    ];
  }

  /**
   * Get the next message for an active plan
   * @param {string} platform - Platform identifier
   * @param {Object} context - Current conversation context
   * @returns {Object|null} - Message guidance or null if no active plan
   */
  getNextMessage(platform, context = {}) {
    const plan = this.activePlans.get(platform);

    if (!plan || plan.status !== 'active') {
      return null;
    }

    // Check if plan should be abandoned
    const timeSinceLastActivity = Date.now() - plan.lastActivity;
    if (timeSinceLastActivity > 10 * 60 * 1000) { // 10 minutes
      this.abandonPlan(platform, 'timeout');
      return null;
    }

    // Get current step
    const currentStep = plan.steps[plan.currentTurn];
    if (!currentStep) {
      this.completePlan(platform);
      return null;
    }

    return {
      planId: plan.id,
      type: plan.type,
      step: currentStep,
      turn: plan.currentTurn + 1,
      totalTurns: plan.expectedTurns,
      topic: plan.topic,
      targetUser: plan.targetUser
    };
  }

  /**
   * Record that a planned message was sent
   * @param {string} platform - Platform identifier
   * @param {string} message - Message that was sent
   */
  recordMessage(platform, message) {
    const plan = this.activePlans.get(platform);

    if (!plan || plan.status !== 'active') {
      return;
    }

    plan.messages.push({
      turn: plan.currentTurn,
      message,
      timestamp: Date.now()
    });

    plan.currentTurn++;
    plan.lastActivity = Date.now();

    // Check if plan is complete
    if (plan.currentTurn >= plan.expectedTurns) {
      this.completePlan(platform);
    } else {
      logger.debug(`🗺️  [Plan] Turn ${plan.currentTurn}/${plan.expectedTurns} for ${plan.type}`);
    }
  }

  /**
   * Complete a plan
   * @private
   */
  completePlan(platform) {
    const plan = this.activePlans.get(platform);
    if (!plan) return;

    plan.status = 'completed';
    plan.completedAt = Date.now();

    this.stats.completedPlans++;
    this.stats.avgTurnsPerPlan =
      (this.stats.avgTurnsPerPlan * (this.stats.completedPlans - 1) +
       plan.currentTurn) / this.stats.completedPlans;

    this.planHistory.push(plan);
    this.activePlans.delete(platform);

    logger.info(`✅ [Plan] Completed ${plan.type} plan on ${platform} (${plan.currentTurn} turns)`);
  }

  /**
   * Abandon a plan
   * @private
   */
  abandonPlan(platform, reason = 'unknown') {
    const plan = this.activePlans.get(platform);
    if (!plan) return;

    plan.status = 'abandoned';
    plan.abandonReason = reason;
    plan.abandonedAt = Date.now();

    this.stats.abandonedPlans++;
    this.planHistory.push(plan);
    this.activePlans.delete(platform);

    logger.info(`❌ [Plan] Abandoned ${plan.type} plan on ${platform} (reason: ${reason})`);
  }

  /**
   * Check active plans for expired/stuck ones
   * @private
   */
  checkActivePlans() {
    const now = Date.now();
    const timeout = 15 * 60 * 1000; // 15 minutes

    for (const [platform, plan] of this.activePlans.entries()) {
      if (now - plan.lastActivity > timeout) {
        this.abandonPlan(platform, 'timeout');
      }
    }
  }

  /**
   * Suggest a new plan based on context
   * @param {string} platform - Platform to suggest for
   * @param {Object} context - Conversation context
   * @returns {Object|null} - Suggested plan or null
   */
  suggestPlan(platform, context = {}) {
    // Don't suggest if there's already an active plan
    if (this.activePlans.has(platform)) {
      return null;
    }

    const { recentTopics = [], activeUsers = [], lastMessages = [] } = context;

    // Random chance to create a plan (30%)
    if (Math.random() > 0.3) {
      return null;
    }

    // Choose plan type based on context
    const planTypes = [
      { type: 'story', weight: 0.3 },
      { type: 'explanation', weight: 0.2 },
      { type: 'debate', weight: 0.2 },
      { type: 'reveal', weight: 0.15 },
      { type: 'callback', weight: 0.15 }
    ];

    // Weighted random selection
    let random = Math.random();
    let selectedType = 'story';

    for (const { type, weight } of planTypes) {
      random -= weight;
      if (random <= 0) {
        selectedType = type;
        break;
      }
    }

    // Choose topic from recent topics or random
    const topic = recentTopics.length > 0
      ? recentTopics[Math.floor(Math.random() * recentTopics.length)]
      : 'something random';

    return {
      type: selectedType,
      platform,
      topic,
      turns: Math.floor(Math.random() * 3) + 2, // 2-4 turns
      priority: 'normal'
    };
  }

  /**
   * Get active plan for a platform
   */
  getActivePlan(platform) {
    return this.activePlans.get(platform) || null;
  }

  /**
   * Load plans from disk
   * @private
   */
  async loadPlans() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));

        // Restore active plans (if recent enough)
        const recentCutoff = Date.now() - 30 * 60 * 1000; // 30 minutes
        if (data.activePlans) {
          Object.entries(data.activePlans).forEach(([platform, plan]) => {
            if (plan.lastActivity > recentCutoff) {
              this.activePlans.set(platform, plan);
            }
          });
        }

        this.planHistory = data.planHistory || [];
        this.stats = data.stats || this.stats;

        logger.info(`📂 [Plan] Loaded ${this.activePlans.size} active plans, ${this.planHistory.length} history`);
      }
    } catch (error) {
      logger.error(`[Plan] Error loading plans: ${error.message}`);
    }
  }

  /**
   * Save plans to disk
   * @private
   */
  async savePlans() {
    try {
      const data = {
        activePlans: Object.fromEntries(this.activePlans),
        planHistory: this.planHistory.slice(-100), // Keep last 100
        stats: this.stats,
        savedAt: Date.now()
      };

      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      logger.debug(`💾 [Plan] Saved conversation plans`);
    } catch (error) {
      logger.error(`[Plan] Error saving plans: ${error.message}`);
    }
  }

  /**
   * Get feature statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      activePlans: this.activePlans.size,
      ...this.stats,
      planHistory: this.planHistory.length,
      successRate: this.stats.totalPlansCreated > 0
        ? `${Math.round((this.stats.completedPlans / this.stats.totalPlansCreated) * 100)}%`
        : '0%'
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info(`🗺️  ConversationPlanner shutting down...`);

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    await this.savePlans();

    this.initialized = false;
    logger.info(`✅ ConversationPlanner shutdown complete`);
  }
}

module.exports = ConversationPlanner;
