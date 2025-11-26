
const EventEmitter = require('events');
const fs = require('fs');

class ChatBot extends EventEmitter {
  constructor() {
    super();
    // Initialize properties here
  }

  // Sonnet: placeholder method for testing
  sonnet() {
    return `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date:`;
  }

  /**
   * Periodically send friendly messages to keep chat lively
   */
  startProactiveLoop() {
    // Wait for chat to be ready before sending initial greeting
    const waitForReady = setInterval(() => {
      try {
        const ready = (typeof this.coolhole.isChatReady === 'function') ? this.coolhole.isChatReady() : this.coolhole.isConnected();
        if (ready) {
          clearInterval(waitForReady);
          logger.info('🎯 Chat is ready, starting conversation...');
          // NEW: Check if should announce return with continuity
          let greeting;
          if (this.startupContinuity.shouldAnnounceReturn()) {
            greeting = this.startupContinuity.getReturnMessage();
            logger.info('🧠 [Continuity] Using contextual return message');
          } else {
            // Send initial greeting - more casual
            const greetings = [
              'yo what\'s good everyone',
              'hey chat, what are we doing today',
              'alright I\'m here, what did I miss',
              'sup everyone',
              'yo chat let\'s get it'
            ];
            greeting = greetings[Math.floor(Math.random() * greetings.length)];
          }
          this.sendMessage(greeting);
          // Maybe follow up after a bit
          setTimeout(() => {
            try {
              const followups = [
                'chat dead or what',
                'what are we watching today',
                'someone queue something good',
                'everyone just lurking huh'
              ];
              if (Math.random() < 0.5) { // 50% chance to send followup
                this.sendMessage(followups[Math.floor(Math.random() * followups.length)]);
              }
            } catch (e) {
              logger.error('Error in starter message:', e.message);
            }
          }, 90_000); // After 1.5 minutes
        }
      } catch (e) {
        logger.error('Error checking chat ready:', e.message);
      }
    }, 2000); // check every 2 seconds until ready
    // LESS frequent proactive participation - let responses drive conversation
    setInterval(() => {
      try {
        const now = Date.now();
        const idleMs = now - this.lastSentAt;
        // Only speak up if REALLY idle and chat is active
        if (idleMs > 240000 && this.chatStats.totalMessages > 5) { // 4 min idle, chat has activity
          const options = [
            'chat really went quiet huh',
            'everyone just watching silently?',
            'this chat needs more energy fr',
            'y\'all alive?',
            'someone say something interesting',
            'boring',
            'wake up chat'
          ];
          if (Math.random() < 0.4) { // 40% chance to actually send
            const msg = options[Math.floor(Math.random() * options.length)];
            this.sendMessage(msg);
            this.lastSentAt = now;
          }
        }
      } catch (e) {
        logger.error('Error in proactive loop:', e.message);
      }
    }, 60000); // check every 60s (less frequent)
  }

  /**
   * Handle manual message input (for WebSocket API or testing)
   */
  handleMessage(data) {
    // Simulate receiving a message for learning purposes
    this.learnFromMessage(data);
    this.considerResponse(data);
  }

  /**
   * Check if bot is connected to CyTube
   */
  isConnected() {
    return this.coolhole.isConnected();
  }

  /**
   * Get current learning/conversation stats for monitoring
   */
  getStatus() {
    return {
      connected: this.isConnected(),
      personality: this.personality,
      stats: this.getChatStatistics(),
      recentActivity: {
        messagesLearned: this.chatHistory.length,
        usersKnown: this.userProfiles.size,
        topicsTracked: this.chatStats.topicsDiscussed.size,
        vocabularyWords: this.vocabulary.size,
        dreams: this.dreamSimulation.getRecentDreams(3),
        rumors: this.rumorMill.getRecentRumors(3),
        reputation: Object.entries(this.userReputationSystem.reputations).slice(0,5),
        diary: this.sluntDiary.getRecentEntries(3, true)
      }
    };
  }

  /**
   * Get Slunt's notes and observations about users and community
   */
  getObservations() {
    try {
      // ...existing code...
      // (all code from getObservations method)
      // ...existing code...
    } catch (e) {
      logger.error('Error getting observations:', e.message);
      return {
        error: e.message,
        userNotes: [],
        communityPatterns: {},
        topicInsights: [],
        recentContext: []
      };
    }
  }

  /**
   * Persist bot memory to disk so it stays active across runs
   */
  saveMemory() {
    try {
      // ...existing code...
    } catch (e) {
      logger.error('Error saving memory:', e.message);
      return false;
    }
  }

  /**
   * Load bot memory from disk
   */
  async loadMemory() {
    try {
      // ...existing code...
    } catch (e) {
      logger.warn('Could not load Slunt memory:', e.message);
      return false;
    }
  }

  /**
   * Start all advanced AI systems
   */
      const obj = {
        savedAt: timestamp,
        savedAtReadable: new Date().toLocaleString(),
        personality: this.personality,
        chatHistory: this.chatHistory.slice(-200),
        conversationContext: this.conversationContext.slice(-15),
        vocabulary: Array.from(this.vocabulary),
        userProfiles: Object.fromEntries(
          Array.from(this.userProfiles.entries()).map(([user, profile]) => [user, {
            ...profile,
            commonWords: Object.fromEntries(profile.commonWords || []),
            topics: Object.fromEntries(profile.topics || []),
            interests: Array.from(profile.interests || []),
            emoji_usage: Object.fromEntries(profile.emoji_usage || []),
            opinions: Object.fromEntries(profile.opinions || []),
            friendsWith: Array.from(profile.friendsWith || []),
            whoTheyMention: Object.fromEntries(profile.whoTheyMention || []),
            mentionedBy: Object.fromEntries(profile.mentionedBy || []),
            activeHours: Object.fromEntries(profile.activeHours || [])
          }])
        ),
        topicMemory: Object.fromEntries(this.topicMemory || []),
        responsePatterns: Object.fromEntries(this.responsePatterns || []),
        // New pattern tracking data
        conversationPatterns: Object.fromEntries(this.conversationPatterns || []),
        timePatterns: Object.fromEntries(
          Array.from(this.timePatterns.entries()).map(([user, times]) => [
            user,
            Object.fromEntries(times)
          ])
        ),
        topicPatterns: Object.fromEntries(
          Array.from(this.topicPatterns.entries()).map(([topic, data]) => [
            topic,
            { ...data, users: Array.from(data.users || []) }
          ])
        ),
        interactionGraph: Object.fromEntries(
          Array.from(this.interactionGraph.entries()).map(([user, connections]) => [
            user,
            Object.fromEntries(connections)
          ])
        ),
        communityInsights: {
          popularTimes: Object.fromEntries(this.communityInsights.popularTimes || []),
          conversationStarters: this.communityInsights.conversationStarters || [],
          engagementMetrics: Object.fromEntries(
            Array.from(this.communityInsights.engagementMetrics.entries())
          )
        },
        chatStats: {
          totalMessages: this.chatStats.totalMessages,
          activeUsers: Array.from(this.chatStats.activeUsers || []),
          messagesByUser: Object.fromEntries(this.chatStats.messagesByUser || []),
          topicsDiscussed: Object.fromEntries(this.chatStats.topicsDiscussed || []),
          averageResponseTime: this.chatStats.averageResponseTime
        },
        lastSentAt: this.lastSentAt
      };
  }

  /**
   * Load bot memory from disk
   */
  async loadMemory() {
    try {
      if (!fs.existsSync(this.memoryPath)) return false;
      const raw = fs.readFileSync(this.memoryPath, 'utf-8');
      if (!raw || raw.trim().length === 0) return false;
      const data = JSON.parse(raw);
      
      // Log when memory was saved
      if (data.savedAt) {
  logger.info(`[${getTimestamp()}] 🧠 Loading memory saved at: ${data.savedAtReadable || data.savedAt}`);
      }
      
      if (data.personality) this.personality = { ...this.personality, ...data.personality };
      if (Array.isArray(data.chatHistory)) this.chatHistory = data.chatHistory.slice(-200);
      if (Array.isArray(data.conversationContext)) this.conversationContext = data.conversationContext.slice(-15);
      if (Array.isArray(data.vocabulary)) this.vocabulary = new Set(data.vocabulary);

      // Restore userProfiles Map
      if (data.userProfiles && typeof data.userProfiles === 'object') {
        this.userProfiles = new Map();
        for (const [user, profile] of Object.entries(data.userProfiles)) {
          const restored = {
            ...profile,
            commonWords: new Map(Object.entries(profile.commonWords || {})),
            topics: new Map(Object.entries(profile.topics || {})),
            interests: new Set(profile.interests || []),
            emoji_usage: new Map(Object.entries(profile.emoji_usage || {})),
            opinions: new Map(Object.entries(profile.opinions || [])),
            friendsWith: new Set(profile.friendsWith || []),
            whoTheyMention: new Map(Object.entries(profile.whoTheyMention || {})),
            mentionedBy: new Map(Object.entries(profile.mentionedBy || {})),
            activeHours: new Map(Object.entries(profile.activeHours || {})),
            // Ensure arrays exist
            funnyQuotes: profile.funnyQuotes || [],
            questionsAsked: profile.questionsAsked || [],
            helpfulMoments: profile.helpfulMoments || [],
            insideJokes: profile.insideJokes || [],
            notes: profile.notes || [],
            nicknames: profile.nicknames || [],
            favoriteTopics: profile.favoriteTopics || [],
            // Ensure critical fields exist with defaults
            friendshipLevel: profile.friendshipLevel ?? 0,
            conversationsHad: profile.conversationsHad ?? 0,
            timesGreeted: profile.timesGreeted ?? 0,
            lastGreeted: null,
            // Advanced system fields
            emotionalMoments: profile.emotionalMoments || [],
            contentPreferences: profile.contentPreferences || {},
            personalNotes: profile.personalNotes || []
          };
          this.userProfiles.set(user, restored);
        }
  logger.info(`👥 [Memory] Restored ${this.userProfiles.size} user profiles with friendship data`);
      }

      if (data.topicMemory && typeof data.topicMemory === 'object') {
        this.topicMemory = new Map(Object.entries(data.topicMemory));
      }

      if (data.responsePatterns && typeof data.responsePatterns === 'object') {
        this.responsePatterns = new Map(Object.entries(data.responsePatterns));
      }
      
      // Restore pattern tracking
      if (data.conversationPatterns && typeof data.conversationPatterns === 'object') {
        this.conversationPatterns = new Map(Object.entries(data.conversationPatterns));
      }
      
      if (data.timePatterns && typeof data.timePatterns === 'object') {
        this.timePatterns = new Map();
        for (const [user, times] of Object.entries(data.timePatterns)) {
          this.timePatterns.set(user, new Map(Object.entries(times)));
        }
      }
      
      if (data.topicPatterns && typeof data.topicPatterns === 'object') {
        this.topicPatterns = new Map();
        for (const [topic, patternData] of Object.entries(data.topicPatterns)) {
          this.topicPatterns.set(topic, {
            ...patternData,
            users: new Set(patternData.users || [])
          });
        }
      }
      
      if (data.interactionGraph && typeof data.interactionGraph === 'object') {
        this.interactionGraph = new Map();
        for (const [user, connections] of Object.entries(data.interactionGraph)) {
          this.interactionGraph.set(user, new Map(Object.entries(connections)));
        }
      }
      
      if (data.communityInsights && typeof data.communityInsights === 'object') {
        const ci = data.communityInsights;
        this.communityInsights.popularTimes = new Map(Object.entries(ci.popularTimes || {}));
        this.communityInsights.conversationStarters = ci.conversationStarters || [];
        this.communityInsights.engagementMetrics = new Map(Object.entries(ci.engagementMetrics || {}));
      }

      if (data.chatStats && typeof data.chatStats === 'object') {
        const cs = data.chatStats;
        this.chatStats.totalMessages = cs.totalMessages || this.chatStats.totalMessages;
        this.chatStats.activeUsers = new Set(cs.activeUsers || []);
        this.chatStats.messagesByUser = new Map(Object.entries(cs.messagesByUser || {}));
        this.chatStats.topicsDiscussed = new Map(Object.entries(cs.topicsDiscussed || {}));
        this.chatStats.averageResponseTime = cs.averageResponseTime || this.chatStats.averageResponseTime;
      }

      if (typeof data.lastSentAt === 'number') this.lastSentAt = data.lastSentAt;
      
      // Restore Advanced AI Systems Data
      if (data.advancedSystems && typeof data.advancedSystems === 'object') {
        const adv = data.advancedSystems;
        
        // Restore emotional memory
        if (adv.emotionalMemory && typeof adv.emotionalMemory === 'object') {
          this.emotionalEngine.emotionalMemory = new Map(Object.entries(adv.emotionalMemory));
          logger.info(`💗 [Emotional] Restored ${this.emotionalEngine.emotionalMemory.size} user emotional histories`);
        }
        
        // Restore relationships
        if (adv.relationships && typeof adv.relationships === 'object') {
          this.relationshipMapping.relationships = new Map(Object.entries(adv.relationships));
          logger.info(`🔗 [Relationships] Restored ${this.relationshipMapping.relationships.size} relationships`);
        }
        
        // Restore social graph (Map of Maps)
        if (adv.socialGraph && typeof adv.socialGraph === 'object') {
          this.relationshipMapping.socialGraph = new Map();
          for (const [user, connections] of Object.entries(adv.socialGraph)) {
            this.relationshipMapping.socialGraph.set(user, new Map(Object.entries(connections || {})));
          }
          logger.info(`🔗 [Relationships] Restored ${this.relationshipMapping.socialGraph.size} social connections`);
        }
        
        // Restore friend groups
        if (Array.isArray(adv.friendGroups)) {
          this.relationshipMapping.friendGroups = adv.friendGroups;
          logger.info(`👥 [Relationships] Restored ${adv.friendGroups.length} friend groups`);
        }
        
        // Restore video learning data
        if (adv.genrePreferences && typeof adv.genrePreferences === 'object') {
          this.videoLearning.genrePreferences = new Map(Object.entries(adv.genrePreferences));
        }
        
        if (Array.isArray(adv.videoMemory)) {
          this.videoLearning.videoMemory = new Map(
            adv.videoMemory.map(v => [v.title || v.id, v])
          );
          logger.info(`🎥 [VideoLearning] Restored ${this.videoLearning.videoMemory.size} videos`);
        }
        
        // Restore personality evolution
        if (Array.isArray(adv.personalityEvolution)) {
          this.personalityEvolution.evolutionHistory = adv.personalityEvolution;
          logger.info(`🎭 [Personality] Restored ${adv.personalityEvolution.length} evolution snapshots`);
        }
        
        // Restore message history for social awareness (keep as array)
        if (Array.isArray(adv.messageHistory)) {
          this.socialAwareness.messageHistory = [...adv.messageHistory]; // Clone the array
          logger.info(`👁️ [Social] Restored ${adv.messageHistory.length} messages in history`);
        } else {
          // Ensure it's always an array
          this.socialAwareness.messageHistory = [];
          logger.info(`👁️ [Social] Initialized empty message history`);
        }
        
        // NEW: Restore Top 5 Priority Systems
        if (adv.memorySummarization) {
          this.memorySummarization.load(adv.memorySummarization);
          logger.info(`📊 [MemorySummarization] Restored compressed memories`);
        }
        
        if (adv.communityEvents) {
          this.communityEvents.load(adv.communityEvents);
          logger.info(`🎉 [CommunityEvents] Restored ${adv.communityEvents.events?.length || 0} events`);
        }
        
        if (adv.contextualCallbacks) {
          this.contextualCallbacks.load(adv.contextualCallbacks);
          logger.info(`📝 [ContextualCallbacks] Restored memorable moments`);
        }
        
        if (adv.personalityModes) {
          this.personalityModes.load(adv.personalityModes);
          logger.info(`🎭 [PersonalityModes] Restored personality mode settings`);
        }
      }
      
      // Load long-term memory for consolidation system
      await this.memoryConsolidation.loadLongTermMemory();
      
      // NEW: Analyze continuity on startup
      await this.startupContinuity.analyzeContinuity();
      
  logger.info('🧠 Restored Slunt memory from disk');
      return true;
    } catch (e) {
  logger.warn('Could not load Slunt memory:', e.message);
      return false;
    }
  }

  /**
   * Start all advanced AI systems
   */
  startAdvancedSystems() {
  logger.info('🚀 [Advanced] Starting all advanced systems...');
    
    try {
      // Start proactive friendship system
      this.proactiveFriendship.start();
      console.log('✅ [Advanced] Proactive friendship system started');
      
      // Start memory consolidation
      this.memoryConsolidation.start();
      console.log('✅ [Advanced] Memory consolidation system started');
      
      // Start personality evolution
      this.personalityEvolution.start();
      console.log('✅ [Advanced] Personality evolution system started');
      
      // Start social awareness
      this.socialAwareness.start();
      console.log('✅ [Advanced] Social awareness system started');
      
      // Emotional engine and video learning are passive, no start needed
      console.log('✅ [Advanced] Emotional engine ready');
      console.log('✅ [Advanced] Video learning ready');
      console.log('✅ [Advanced] Relationship mapping ready');
      
      console.log('🎉 [Advanced] ALL SYSTEMS OPERATIONAL!');
    } catch (error) {
      console.error('❌ [Advanced] Error starting systems:', error.message);
    }
  }

  /**
   * Extract mentioned usernames from text
   */
  extractMentionedUsers(text) {
    const users = [];
    const words = text.split(/\s+/);
    
    for (const word of words) {
      // Remove punctuation
      const cleanWord = word.replace(/[^a-zA-Z0-9_]/g, '');
      
      // Check if this looks like a username (check against known users)
      if (this.userProfiles.has(cleanWord)) {
        users.push(cleanWord);
      }
    }
    
    return users;
  }

  /**
   * Get stats for all advanced systems
   */
  getAdvancedStats() {
    return {
      emotional: this.emotionalEngine?.emotionalMemory?.size ?? null,
      proactive: this.proactiveFriendship?.getStats ? this.proactiveFriendship.getStats() : null,
      memory: this.memoryConsolidation?.getStats ? this.memoryConsolidation.getStats() : null,
      video: this.videoLearning?.getStats ? this.videoLearning.getStats() : null,
      personality: this.personalityEvolution?.getStats ? this.personalityEvolution.getStats() : null,
      social: this.socialAwareness?.getStats ? this.socialAwareness.getStats() : null,
      relationships: this.relationshipMapping?.getStats ? this.relationshipMapping.getStats() : null,
      mentalState: this.mentalState?.getStats ? this.mentalState.getStats() : null, // Depression, anxiety, etc
      psychological: {
        memory: this.memoryDecay?.getStats ? this.memoryDecay.getStats() : null,
        obsession: this.obsessionSystem?.getStats ? this.obsessionSystem.getStats() : null,
        grudge: this.grudgeSystem?.getStats ? this.grudgeSystem.getStats() : null,
        drunk: this.drunkMode?.getStats ? this.drunkMode.getStats() : null,
        theoryOfMind: this.theoryOfMind?.getStats ? this.theoryOfMind.getStats() : null,
        autism: this.autismFixations?.getStats ? this.autismFixations.getStats() : null,
        umbra: this.umbraProtocol?.getStats ? this.umbraProtocol.getStats() : null,
        hipster: this.hipsterProtocol?.getStats ? this.hipsterProtocol.getStats() : null,
        youtube: this.youtubeSearch?.getStats ? this.youtubeSearch.getStats() : null
      },
      callbacks: this.contextualCallbacks?.getStats ? this.contextualCallbacks.getStats() : null,
      personalityMode: this.personalityModes?.getStats ? this.personalityModes.getStats() : null,
      communityEvents: (this.communityEvents && typeof this.communityEvents === 'object') ? {
        totalEvents: this.communityEvents.events?.length ?? 0,
        recentEvents: this.communityEvents.getRecentEvents ? this.communityEvents.getRecentEvents(5) : []
      } : { totalEvents: 0, recentEvents: [] }
    };
  }
  /**
   * Detect sentiment of message for video reactions
   */
  detectSentiment(message) {
    const lower = message.toLowerCase();
    
    // Positive
    if (lower.match(/\b(love|great|amazing|awesome|perfect|beautiful|best|nice|cool|good|lol|lmao|haha)\b/)) {
      return 'positive';
    }
    
    // Negative
    if (lower.match(/\b(hate|terrible|awful|worst|bad|boring|sucks|cringe|ugh|wtf)\b/)) {
      return 'negative';
    }
    
    // Neutral
    return 'neutral';
  }

  /**
   * Shutdown all advanced systems
   */
  async shutdownAdvancedSystems() {
    console.log('🛑 [Advanced] Shutting down all systems...');
    
    try {
      this.proactiveFriendship.stop();
      this.memoryConsolidation.stop();
      this.personalityEvolution.stop();
      this.socialAwareness.stop();
      
      // Save final state
      await this.memoryConsolidation.saveLongTermMemory();
      await this.saveMemory();
      
      console.log('✅ [Advanced] All systems shut down gracefully');
    } catch (error) {
      console.error('❌ [Advanced] Error shutting down:', error.message);
    }
  }
 // End of ChatBot class

module.exports = ChatBot;