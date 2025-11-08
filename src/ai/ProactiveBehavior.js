/**
 * PROACTIVE BEHAVIOR SYSTEM
 * 
 * Makes Slunt initiate conversations, express mood changes, and perform time-based actions.
 * He doesn't just wait to be talked to - he lives his life and interacts naturally.
 */

const fs = require('fs');
const path = require('path');

class ProactiveBehavior {
  constructor(chatBot) {
    this.bot = chatBot;
    
    // Track when we last initiated
    this.lastInitiation = new Map(); // platform -> timestamp
    this.lastMoodExpression = 0;
    this.lastStatusUpdate = 0;
    
    // Schedule-based messages
    this.scheduleMessages = {
      morning: ['morning', 'morning nerds', 'why am i awake', 'coffee time'],
      afternoon: ['back', 'sup', 'afternoon'],
      evening: ['evening gamers', 'what\'s happening', 'yo'],
      lateNight: ['still up huh', 'late night crew', 'can\'t sleep'],
      weekend: ['weekend vibes', 'no work today hell yeah', 'weekend'],
      monday: ['ugh monday', 'monday hits different', 'monday']
    };
    
    // Mood expression templates
    this.moodExpressions = {
      tired: ['man i\'m tired', 'exhausted', 'need sleep', 'why am i so tired'],
      hyper: ['feeling hyper', 'got energy today', 'let\'s go'],
      bored: ['bored', 'nothing happening', 'someone entertain me', 'so bored'],
      anxious: ['feeling weird today', 'kinda anxious', 'off today'],
      excited: ['hyped', 'excited about this', 'let\'s fucking go'],
      grumpy: ['in a mood', 'grumpy today', 'don\'t talk to me'],
      chill: ['vibing', 'just chillin', 'good day']
    };
    
    // Conversation starters
    this.conversationStarters = [
      'so what\'s everyone up to',
      'anyone doing anything interesting',
      'quiet in here',
      'what are we talking about',
      'anything good happening',
      'what did i miss',
      'someone catch me up',
      'what\'s the vibe today'
    ];
    
    // Return messages (after being away)
    this.returnMessages = {
      gaming: [
        'back, that was terrible',
        'back from gaming, we lost every match',
        'alright i\'m back',
        'gaming was mediocre',
        'back, that was actually fun'
      ],
      sleeping: [
        'morning, slept like shit',
        'finally awake',
        'back from the dead',
        'woke up',
        'alive again'
      ],
      offline: [
        'back',
        'i\'m back',
        'sup, what happened while i was gone',
        'alright i\'m here'
      ]
    };
    
    // Initiation cooldowns (minutes)
    this.cooldowns = {
      general: 30,        // General conversation starters
      moodExpression: 60, // Mood updates
      statusUpdate: 45,   // "going to X" messages
      schedule: 180       // Time-based greetings
    };
    
    console.log('🎬 [Proactive] Proactive behavior system initialized');
    
    // Start proactive loop
    this.startProactiveLoop();
  }

  /**
   * Main proactive behavior loop
   */
  startProactiveLoop() {
    // Check every minute for proactive opportunities
    setInterval(() => {
      this.evaluateProactiveActions();
    }, 60000); // 1 minute
  }

  /**
   * Evaluate and execute proactive actions
   */
  async evaluateProactiveActions() {
    // Only be proactive if Slunt is available and wants to talk
    const lifeContext = this.bot.autonomousLife?.getLifeContext();
    if (!lifeContext) return;
    
    // Don't be proactive if sleeping or offline
    if (lifeContext.activity === 'sleeping' || lifeContext.location === 'bed') {
      return;
    }
    
    // Don't be proactive if social battery is drained
    if (lifeContext.socialBattery < 30) {
      return;
    }
    
    // Generate dreams during low activity (even if not sharing them yet)
    if (this.bot.dreamSimulation && Math.random() < 0.2) { // 20% chance per check (every minute)
      const dream = this.bot.dreamSimulation.maybeDream();
      if (dream) {
        console.log(`💭 [Dreams] Generated new dream: ${dream}`);
      }
    }
    
    // Check for various proactive opportunities
    const opportunities = [];
    
    // 1. Schedule-based messages
    const scheduleOpportunity = this.checkScheduleMessage();
    if (scheduleOpportunity) {
      opportunities.push({ type: 'schedule', ...scheduleOpportunity });
    }
    
    // 2. Mood expression
    const moodOpportunity = this.checkMoodExpression(lifeContext);
    if (moodOpportunity) {
      opportunities.push({ type: 'mood', ...moodOpportunity });
    }
    
    // 3. Boredom-driven conversation starter
    if (lifeContext.boredom > 70 && lifeContext.energy > 40) {
      const starterOpportunity = this.checkConversationStarter();
      if (starterOpportunity) {
        opportunities.push({ type: 'starter', ...starterOpportunity });
      }
    }
    
    // 4. Dream sharing during low activity (when tired/sleep deprived)
    if (this.bot.dreamSimulation && lifeContext.tiredness > 60) {
      const dreamOpportunity = this.checkDreamSharing();
      if (dreamOpportunity) {
        opportunities.push({ type: 'dream', ...dreamOpportunity });
      }
    }
    
    // 5. Random proactive engagement (low frequency)
    if (Math.random() < 0.05 && lifeContext.wantsToTalk) { // 5% chance per check
      const randomOpportunity = this.checkRandomEngagement();
      if (randomOpportunity) {
        opportunities.push({ type: 'random', ...randomOpportunity });
      }
    }
    
    // Execute first opportunity
    if (opportunities.length > 0) {
      const selected = opportunities[0];
      await this.executeProactiveAction(selected);
    }
  }

  /**
   * Check if should send schedule-based message
   * DISABLED: No more time-based greetings like "weekend" or "morning" - too cringey
   */
  checkScheduleMessage() {
    // DISABLED: Schedule-based messages were lame ("weekend vibes" etc)
    // Slunt should only talk when he has something to say, not announce his presence
    return null;
  }

  /**
   * Check if should express current mood
   * DISABLED: No automatic mood announcements - cringe
   */
  checkMoodExpression(lifeContext) {
    // DISABLED: Auto mood expressions like "man i'm tired" are lame unprompted
    // Moods should come through naturally in conversation, not announced
    return null;
  }

  /**
   * Check if should share a dream during low activity
   * DISABLED: No random dream announcements
   */
  checkDreamSharing() {
    // DISABLED: Randomly sharing dreams unprompted is weird
    // Dreams can still be mentioned naturally in conversation when relevant
    return null;
  }

  /**
   * Check if should start a conversation
   * DISABLED: No random "quiet in here" messages
   */
  checkConversationStarter() {
    // DISABLED: Random conversation starters are forced and awkward
    // Let conversations happen organically when people talk to Slunt
    return null;
  }

  /**
   * Check for random proactive engagement opportunity
   */
  /**
   * Check for random engagement opportunities
   * DISABLED: No random spontaneous reactions
   */
  checkRandomEngagement() {
    // DISABLED: Random proactive engagement is forced
    // Slunt should respond naturally when addressed or interested, not randomly jump in
    return null;
  }

  /**
   * Generate a return message after being away
   */
  async generateReturnMessage(previousActivity) {
    const messageTemplates = this.returnMessages[previousActivity] || this.returnMessages.offline;
    const template = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
    
    // Sometimes add context from previous activity
    const lifeContext = this.bot.autonomousLife?.getLifeContext();
    
    if (previousActivity === 'gaming' && Math.random() < 0.7) {
      // Add gaming context
      const variations = [
        template + ', that was painful',
        template + ', why did i even play',
        template + ', teammates were trash',
        template + ', carried my team',
        template + ', need a break from that'
      ];
      return variations[Math.floor(Math.random() * variations.length)];
    }
    
    if (previousActivity === 'sleeping' && lifeContext && lifeContext.energy < 50) {
      // Still tired
      return template + ', still tired though';
    }
    
    return template;
  }

  /**
   * Execute a proactive action
   */
  async executeProactiveAction(opportunity) {
    try {
      let message = opportunity.message;
      const platform = opportunity.platform || 'coolhole';
      
      console.log(`🎬 [Proactive] Executing ${opportunity.type} action on ${platform}`);
      
      // Generate message if spontaneous
      if (opportunity.spontaneous && !message) {
        message = await this.generateSpontaneousReaction(opportunity.context);
      }
      
      if (!message) return;
      
      // Send the proactive message
      await this.bot.sendMessage({
        text: message,
        username: 'System', // Not a response to anyone
        platform
      });
      
      // Update cooldowns
      if (opportunity.type === 'schedule') {
        this.lastInitiation.set('schedule', Date.now());
      } else if (opportunity.type === 'mood') {
        this.lastMoodExpression = Date.now();
      } else if (opportunity.type === 'starter') {
        this.lastInitiation.set('general', Date.now());
      } else if (opportunity.type === 'dream') {
        this.lastInitiation.set('dream', Date.now());
        console.log(`💭 [Proactive] Shared dream from: ${new Date(opportunity.dreamData?.time).toLocaleString()}`);
      }
      
      console.log(`✅ [Proactive] Sent: "${message}"`);
      
    } catch (error) {
      console.error(`❌ [Proactive] Error executing action:`, error.message);
    }
  }

  /**
   * Generate spontaneous reaction to recent message
   */
  async generateSpontaneousReaction(context) {
    if (!this.bot.ai || !this.bot.ai.enabled) {
      return null;
    }
    
    try {
      const prompt = `You just read this message: "${context.text}"

You want to jump into the conversation naturally and spontaneously.

Generate ONE casual reaction or comment (1 sentence, no quotes):`;

      const reaction = await this.bot.ai.generateResponse(
        prompt,
        'Slunt',
        '',
        { maxTokens: 50, temperature: 0.9 }
      );
      
      return reaction.trim();
      
    } catch (error) {
      console.error('Error generating spontaneous reaction:', error.message);
      return null;
    }
  }

  /**
   * Should announce activity transition?
   */
  shouldAnnounceTransition(fromActivity, toActivity) {
    const now = Date.now();
    
    // Cooldown check
    if (now - this.lastStatusUpdate < this.cooldowns.statusUpdate * 60000) {
      return false;
    }
    
    // Announce significant transitions
    const significantTransitions = [
      { from: 'chatting', to: 'gaming', announce: true },
      { from: 'chatting', to: 'sleeping', announce: true },
      { from: 'watching', to: 'gaming', announce: true },
      { from: 'gaming', to: 'chatting', announce: true },
      { from: 'sleeping', to: 'chatting', announce: true },
      { from: 'offline', to: 'chatting', announce: true }
    ];
    
    return significantTransitions.some(t => 
      t.from === fromActivity && t.to === toActivity && t.announce
    );
  }

  /**
   * Get activity announcement message
   */
  getActivityAnnouncement(fromActivity, toActivity) {
    if (toActivity === 'gaming') {
      const messages = [
        'alright gonna go play some games',
        'gaming time, catch you later',
        'gonna hop on some games',
        'alright i\'m gaming, peace'
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    
    if (toActivity === 'sleeping') {
      const messages = [
        'alright i\'m going to bed',
        'passing out, night',
        'tired, gonna sleep',
        'bed time'
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    
    if (fromActivity === 'gaming' || fromActivity === 'sleeping' || fromActivity === 'offline') {
      return this.generateReturnMessage(fromActivity);
    }
    
    return null;
  }

  /**
   * Handle activity change announcement
   */
  async handleActivityChange(fromActivity, toActivity, location) {
    if (!this.shouldAnnounceTransition(fromActivity, toActivity)) {
      return;
    }
    
    const message = await this.getActivityAnnouncement(fromActivity, toActivity);
    if (!message) return;
    
    // Send announcement
    try {
      await this.bot.sendMessage({
        text: message,
        username: 'System',
        platform: location || 'coolhole'
      });
      
      this.lastStatusUpdate = Date.now();
      console.log(`🎬 [Proactive] Announced transition: ${fromActivity} → ${toActivity}`);
      
    } catch (error) {
      console.error('Error announcing activity change:', error.message);
    }
  }
}

module.exports = ProactiveBehavior;
