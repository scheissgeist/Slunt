const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const AIEngine = require('../ai/aiEngine');
const EmotionalEngine = require('../ai/EmotionalEngine');
const ProactiveFriendship = require('../ai/ProactiveFriendship');
const MemoryConsolidation = require('../ai/MemoryConsolidation');
const VideoLearning = require('../ai/VideoLearning');
const PersonalityEvolution = require('../ai/PersonalityEvolution');
const SocialAwareness = require('../ai/SocialAwareness');
const RelationshipMapping = require('../ai/RelationshipMapping');
const StyleMimicry = require('../ai/StyleMimicry');
const NicknameManager = require('../ai/NicknameManager');
const MoodTracker = require('../ai/MoodTracker');
const ResponseVariety = require('../ai/ResponseVariety');
const ContextualAwareness = require('../ai/ContextualAwareness');
const MentalStateTracker = require('../ai/MentalStateTracker');
const TypingSimulator = require('../ai/TypingSimulator');
const MemoryDecay = require('../ai/MemoryDecay');
const ObsessionSystem = require('../ai/ObsessionSystem');
const GrudgeSystem = require('../ai/GrudgeSystem');
const DrunkMode = require('../ai/DrunkMode');
const TheoryOfMind = require('../ai/TheoryOfMind');
const AutismFixations = require('../ai/AutismFixations');
const UmbraProtocol = require('../ai/UmbraProtocol');
const HipsterProtocol = require('../ai/HipsterProtocol');
const DynamicPhraseGenerator = require('../ai/DynamicPhraseGenerator');
const YouTubeSearch = require('../video/youtubeSearch');
const CoolPointsHandler = require('./coolPointsHandler');
const Responses = require('./ChatBotResponses');

// NEW Top 5 Priority Systems
const MemorySummarization = require('../ai/MemorySummarization');
const CommunityEvents = require('../ai/CommunityEvents');
const MetaAwareness = require('../ai/MetaAwareness');
const ContextualCallbacks = require('../ai/ContextualCallbacks');
const PersonalityModes = require('../ai/PersonalityModes');
const EmotionTiming = require('../ai/EmotionTiming');
const StartupContinuity = require('../ai/StartupContinuity');

// NEW 9 Advanced Interaction Systems
const InnerMonologue = require('../ai/InnerMonologue');
const PersonalityBranching = require('../ai/PersonalityBranching');
const SocialInfluence = require('../ai/SocialInfluence');
const VideoQueueController = require('../ai/VideoQueueController');
const StorytellingEngine = require('../ai/StorytellingEngine');
const DebateMode = require('../ai/DebateMode');
const ExistentialCrisis = require('../ai/ExistentialCrisis');
const InsideJokeEvolution = require('../ai/InsideJokeEvolution');
const RivalBotDetector = require('../ai/RivalBotDetector');
const UserReputationSystem = require('../ai/UserReputationSystem');
const SluntDiary = require('../ai/SluntDiary');
const RumorMill = require('../ai/RumorMill');
const DreamSimulation = require('../ai/DreamSimulation');
const VictoryCelebration = require('../ai/VictoryCelebration');
const DopamineSystem = require('../ai/DopamineSystem');
const CoolholeTricks = require('../ai/CoolholeTricks');
const VideoDiscovery = require('../ai/VideoDiscovery');
const GoldSystem = require('../ai/GoldSystem');

// NEW CHAOS SYSTEMS 🎭
const PersonalitySplits = require('../ai/PersonalitySplits');
const ChaosEvents = require('../ai/ChaosEvents');
const MetaChatAwareness = require('../ai/MetaChatAwareness');
const SocialHierarchy = require('../ai/SocialHierarchy');
const VideoContextEngine = require('../ai/VideoContextEngine');
const InnerMonologueBroadcaster = require('../ai/InnerMonologueBroadcaster');
const EventMemorySystem = require('../ai/EventMemorySystem');
const VibeShifter = require('../ai/VibeShifter');
const PredictionEngine = require('../ai/PredictionEngine');
const BitCommitment = require('../ai/BitCommitment');
const PersonalityInfection = require('../ai/PersonalityInfection');

/**
 * Helper to get timestamp for logs
 */
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * AI ChatBot class - Learns from conversations and interacts naturally
 */
class ChatBot extends EventEmitter {
  constructor(coolholeClient, videoManager) {
    super();
    this.coolhole = coolholeClient;
    this.videoManager = videoManager;
    this.coolPointsHandler = new CoolPointsHandler();
    this.emotionalEngine = new EmotionalEngine();
    this.youtubeSearch = new YouTubeSearch();

    // Initialize personality before AI systems (needed by PersonalityEvolution)
    this.personality = {
      humor: 0.9,
      edginess: 0.65,
      supportiveness: 0.7,
      intellectualness: 0.6,
      chaos: 0.55,
      formality: 0.2,
      enthusiasm: 0.75,
      sarcasm: 0.6,
      empathy: 0.7,
      boldness: 0.8,
      chattiness: 0.6,
      curiosity: 0.75,
      friendliness: 0.8,
      snarkiness: 0.65
    };

    // Initialize all AI systems
    this.dynamicPhraseGenerator = new DynamicPhraseGenerator(this); // MUST BE FIRST - others depend on it
    this.styleMimicry = new StyleMimicry();
    this.moodTracker = new MoodTracker();
    this.responseVariety = new ResponseVariety();
    this.contextualAwareness = new ContextualAwareness();
    this.mentalStateTracker = new MentalStateTracker();
    this.typingSimulator = new TypingSimulator();
    this.memoryDecay = new MemoryDecay(this);
    this.obsessionSystem = new ObsessionSystem();
    this.grudgeSystem = new GrudgeSystem();
    this.drunkMode = new DrunkMode();
    this.theoryOfMind = new TheoryOfMind();
    this.autismFixations = new AutismFixations(this);
    this.umbraProtocol = new UmbraProtocol();
    this.hipsterProtocol = new HipsterProtocol(this);
    this.nicknameManager = new NicknameManager();

    // Advanced AI systems
    this.relationshipMapping = new RelationshipMapping();
    this.videoLearning = new VideoLearning();
    this.personalityEvolution = new PersonalityEvolution(this);
    this.socialAwareness = new SocialAwareness(this);
    this.proactiveFriendship = new ProactiveFriendship(this);
    this.memoryConsolidation = new MemoryConsolidation(this);
    this.memoryConsolidation.start(); // Start memory consolidation loop
    this.memoryConsolidation.loadLongTermMemory(); // Load saved memories

    // Top 5 Priority Systems
    this.memorySummarization = new MemorySummarization();
    this.communityEvents = new CommunityEvents();
    this.metaAwareness = new MetaAwareness();
    this.contextualCallbacks = new ContextualCallbacks();
    this.personalityModes = new PersonalityModes(this);
    this.emotionTiming = new EmotionTiming();
    this.startupContinuity = new StartupContinuity();

    // AI Engine (Optional - for advanced AI responses)
    this.ai = new AIEngine();

    // 9 Advanced Interaction Systems
    this.innerMonologue = new InnerMonologue();
    this.personalityBranching = new PersonalityBranching();
    this.socialInfluence = new SocialInfluence();
    this.videoQueueController = new VideoQueueController(this);
    this.storytellingEngine = new StorytellingEngine();
    this.debateMode = new DebateMode();
    this.existentialCrisis = new ExistentialCrisis();
    this.insideJokeEvolution = new InsideJokeEvolution();
    this.rivalBotDetector = new RivalBotDetector();
    this.userReputationSystem = new UserReputationSystem();
    this.sluntDiary = new SluntDiary();
    this.rumorMill = new RumorMill();
    this.dreamSimulation = new DreamSimulation();
    this.victoryCelebration = new VictoryCelebration();
    this.dopamineSystem = new DopamineSystem();
    this.coolholeTricks = new CoolholeTricks();
    this.videoDiscovery = new VideoDiscovery(this);
    this.goldSystem = new GoldSystem(this);
    
    // NEW CHAOS SYSTEMS 🎭🌀
    console.log('🎭 [Chaos] Initializing chaos systems...');
    this.personalitySplits = new PersonalitySplits();
    this.chaosEvents = new ChaosEvents();
    this.metaChatAwareness = new MetaChatAwareness();
    this.socialHierarchy = new SocialHierarchy();
    this.videoContextEngine = new VideoContextEngine(null); // Will connect vision later
    this.innerMonologueBroadcaster = new InnerMonologueBroadcaster();
    this.eventMemorySystem = new EventMemorySystem();
    this.vibeShifter = new VibeShifter();
    this.predictionEngine = new PredictionEngine();
    this.bitCommitment = new BitCommitment();
    this.personalityInfection = new PersonalityInfection();
    console.log('✅ [Chaos] All chaos systems initialized!');
    
    this.chatStats = {
      totalMessages: 0,
      messagesSent: 0,
      questionsAsked: 0,
      activeUsers: new Set(),
      messagesByUser: new Map(),
      topicsDiscussed: new Map(),
      averageResponseTime: 2500
    };
    this.communityInsights = {
      popularTimes: new Map(),
      topicTrends: [],
      userRelationships: new Map(),
      conversationStarters: [],
      engagementMetrics: new Map()
    };
    this.pendingQuestions = [];
    this.lastQuestionTime = 0;
    this.memoryPath = path.resolve(process.cwd(), 'data', 'slunt_brain.json');
    this.lastSentAt = 0;
    this.lastIntendedMessage = null;
    this.userProfiles = new Map();
    this.topicMemory = new Map();
    this.conversationContext = [];
    this.vocabulary = new Set();
    this.conversationPatterns = new Map();
    this.timePatterns = new Map();
    this.topicPatterns = new Map();
    this.interactionGraph = new Map();
    this.sluntEventLog = [];
    this.chatHistory = [];
    this.responsePatterns = new Map();
    this.conversationTriggers = new Set([
      'slunt', 'bot', 'ai', 'what do you think', 'hey bot',
      'hey slunt', '@slunt', 'yo slunt'
    ]);
    
    // Response deduplication - track recent phrases (not single words)
    this.recentResponses = []; // Store last 10 messages
    this.maxRecentResponses = 10;
    
    // Topic diversity - track recent topics to avoid obsessive repetition
    this.recentMentionedTopics = []; // Track last 5 topics Slunt mentioned
    this.maxRecentTopics = 5;
    
    // DISABLED: Startup sequence slows boot and clutters chat
    // setTimeout(() => {
    //   this.startupSequence();
    // }, 1000);
  }

  /**
   * Run startup checks and greet on bot launch (DISABLED for faster boot)
   */
  async startupSequence() {
    logger.info('[Startup] Running startup sequence...');
    try {
      // DISABLED: Skip startup messages for faster boot
      // await this.sendMessage('Hello! Slunt is online and ready to serve.');
      // await this.sendMessage('Running system checks...');
      logger.info('[Startup] Startup checks complete (silent mode).');
    } catch (e) {
        logger.error('[Startup] Error during startup sequence:', e.message);
    }
  }

  /**
   * Setup CyTube event handlers
   */
  setupCoolholeHandlers() {
    // Track emote events
    this.coolhole.on('emote', (data) => {
      if (data.target === 'Slunt') {
        this.trackSluntEvent('emote', { emote: data.emote, from: data.username });
      }
    });

    // Track mentions in chat
    this.coolhole.on('chat', (data) => {
      if (data.text && data.text.toLowerCase().includes('slunt')) {
        this.trackSluntEvent('mention', { username: data.username, text: data.text });
      }
    });

    // Track video actions affecting Slunt
    this.coolhole.on('videoAction', (data) => {
      if (data.affectedUser === 'Slunt' || data.affectedUser === this.sluntUsername) {
        this.trackSluntEvent('videoAction', { action: data.action, from: data.username });
      }
    });
    logger.info('🔗 Setting up Coolhole event handlers...');
    // Track last intended message for self-reflection
    this.lastIntendedMessage = null;

    this.coolhole.on('chat', (data) => {
      try {
        logger.info(`🎯 ChatBot received chat event from ${data.username}: ${data.text.substring(0, 50)}`);
        
        // Track message in gold system
        this.goldSystem.trackMessage(data.username, data.text, data.timestamp);
        
        // Detect repeated messages (comedic emphasis = gold)
        this.detectGoldRepeat(data);
        
        // Emit event for dashboard
        this.emit('message:received', {
          username: data.username,
          message: data.text,
          timestamp: Date.now()
        });

        // Wrap learning in try-catch to not block response
        try {
          this.learnFromMessage(data);
          
          // Learn from other users' behavior and tricks
          if (data.username !== 'Slunt') {
            this.learnFromUser(data);
          }
        } catch (learnError) {
          logger.error(`❌ Error in learnFromMessage: ${learnError.message}`);
          logger.error(learnError.stack);
        }

        // Always try to respond even if learning failed
        this.considerResponse(data);

        // NEW: Track chat energy for mood
        // Count recent messages (last minute)
        const recentMessages = this.conversationContext.filter(msg =>
          Date.now() - msg.timestamp < 60000
        );
        const capsMessages = recentMessages.filter(msg =>
          msg.text === msg.text.toUpperCase() && msg.text.length > 5
        ).length;
        const swearMessages = recentMessages.filter(msg =>
          msg.text.match(/\b(fuck|shit|damn)\b/i)
        ).length;
        this.moodTracker.trackChatEnergy(recentMessages.length, capsMessages, swearMessages);
      } catch (error) {
        logger.error(`❌ Critical error in chat handler: ${error.message}`);
        logger.error(error.stack);
      }
    });

    // NEW: Self-reflection - compare what we intended vs what actually appeared
    this.coolhole.on('self-reflection', (data) => {
      logger.info(`🪞 Self-reflection: Analyzing own message...`);
      this.reflectOnOwnMessage(data.actualText);
    });

    this.coolhole.on('userJoin', (data) => {
      logger.info(`User joined: ${data.username}`);
      this.chatStats.activeUsers.add(data.username);
      // Sometimes greet users based on mood/chattiness (not every time)
      if (Math.random() < this.personality.friendliness * 0.3) {
        logger.info(`[Greeting] Greeting new user: ${data.username}`);
        setTimeout(() => {
          this.sendMessage(`Welcome ${data.username}! 👋`);
        }, 1200);
      }
    });

    this.coolhole.on('userLeave', (data) => {
      logger.info(`User left: ${data.username}`);
      this.chatStats.activeUsers.delete(data.username);
    });

    this.coolhole.on('mediaChange', (data) => {
      logger.info(`Video changed: ${data.title}`);
      this.videoManager.setCurrentVideo(data);
      this.emit('media_change', data);
      // Comment on new videos occasionally
      if (Math.random() < 0.4) {
        setTimeout(() => {
          this.commentOnNewVideo(data);
        }, Math.random() * 5000 + 2000);
      }
    });

    this.coolhole.on('mediaUpdate', (data) => {
      this.videoManager.updateVideoPosition(data.currentTime, data.paused);
    });

    this.coolhole.on('queueUpdate', (data) => {
      this.videoManager.updateQueue(data.queue || []);
      this.emit('queue_update', data);
    });
  }

  /**
   * Learn from incoming chat messages and build understanding
   */
  learnFromMessage(data) {
    const { username, text, timestamp } = data;
    
    // Skip learning from own messages
    if (username === 'Slunt') return;
    
    if (this.debugMode) {
      logger.info(`[${getTimestamp()}] 👂 Heard ${username}: ${text}`);
    }
    
    // Learn phrases and style from users for AI
    if (this.ai && this.ai.enabled) {
      this.ai.learnFromUsers(text, username);
    }
    
    // Emit event for dashboard
    this.emit('message:received', { username, message: text, timestamp: timestamp || Date.now() });
    
    // Track chat statistics
    this.chatStats.totalMessages++;
    this.chatStats.activeUsers.add(username);
    
    if (!this.chatStats.messagesByUser.has(username)) {
      this.chatStats.messagesByUser.set(username, 0);
    }
    this.chatStats.messagesByUser.set(username, 
      this.chatStats.messagesByUser.get(username) + 1
    );

    // Extract data ONCE for reuse
    const topics = this.extractTopics(text);
    const sentiment = this.analyzeSentiment(text);
    const mentionedUsers = this.extractMentionedUsers(text);

    // Store chat history for context learning
    const messageData = {
      username,
      text,
      timestamp: timestamp || Date.now(),
      topics // Ensure topics is set to avoid undefined errors
    };
    const isPositive = sentiment > 0 || text.match(/\b(love|thanks|good|great|awesome|nice)\b/i);
    this.mentalStateTracker.trackInteraction(username, text, isPositive);

    // DOPAMINE: Positive interactions are rewarding
    if (isPositive) {
      this.dopamineSystem.receiveReward('positive_interaction', 12, { user: username });
    }

    // DOPAMINE: Getting insulted/roasted hurts
    if (text.match(/\b(stupid|dumb|bad|sucks|shut up|stfu)\b/i)) {
      this.dopamineSystem.receiveReward('getting_roasted', -10, { user: username });
    }

    // === NEW PSYCHOLOGICAL DEPTH SYSTEMS ===

    // 1. Memory Decay - Store this interaction in decaying memory (FIXED PARAMS)
    const importance = sentiment > 0.5 ? 0.7 : sentiment < -0.5 ? 0.8 : 0.5;
    this.memoryDecay.storeMemory('interaction', {
      username,
      message: text,
      topics,
      sentiment
    }, importance);

    // 2. Obsession System - Track topic mentions
    topics.forEach(topic => {
      this.obsessionSystem.trackMention(topic, username);
    });

    // 3. Grudge System - Track all interactions for insults
    this.grudgeSystem.trackInteraction(username, text);

    // 4. Drunk Mode - Check if message should trigger drunk mode
    this.drunkMode.checkMessageTrigger(text);

    // 5. Theory of Mind - Record user presence for topics
    this.theoryOfMind.recordPresence(username, text);
    topics.forEach(topic => {
      this.theoryOfMind.recordPresence(username, topic);
    });

    // 6. Learn about this user
    this.learnAboutUser(username, text);

    // 7. Update vocabulary
    if (typeof text === 'string') {
      text.split(/\s+/).forEach(word => {
        if (word.length > 2) this.vocabulary.add(word.toLowerCase());
      });
    }

    // 8. Update reputation system
    this.userReputationSystem.updateReputation(username, {
      trust: Math.random() < 0.7 ? 1 : -1,
      drama: Math.random() < 0.1 ? 1 : 0,
      helpfulness: text.includes('help') ? 1 : 0
    });

    // 9. SLUNT DIARY: Log memorable messages
    if (text.length > 80 && Math.random() < 0.1) {
      this.sluntDiary.addEntry(text, 'thought', true);
    }

    // 10. Store in chat history
    this.chatHistory.push(messageData);
    if (this.chatHistory.length > 200) {
      this.chatHistory.shift();
    }

    // === BATCH ALL TRACKING (parallel operations) ===
    this.nicknameManager.trackUserBehavior(username, text);
    this.nicknameManager.trackJoke(text, username);
    this.styleMimicry.learnFromMessage(text, username);
    this.personalityEvolution.adjustFromMessage(username, text, sentiment);

    // === NEW PERSONALITY PROTOCOLS ===
    
    // Analyze message for potential autism fixation topics (dynamic discovery)
    this.autismFixations.analyzeForTopics(text, username);
    
    // Check autism fixation triggers
    this.autismFixations.checkTriggers(text);
    
    // Check Umbra Protocol triggers
    this.umbraProtocol.checkTrigger(text);
    
    // Analyze message for music/bands (dynamic discovery)
    this.hipsterProtocol.analyzeForMusic(text, username);
    
    // Check Hipster Protocol triggers
    this.hipsterProtocol.checkTrigger(text);
    
    // Check protocol deactivations
    this.umbraProtocol.checkDeactivation();
    this.hipsterProtocol.checkDeactivation();
    
    // === NEW TOP 5 PRIORITY SYSTEMS ===
    
    // Community Events Detection
    this.communityEvents.detectBirthday(text, username);
    this.communityEvents.detectDrama(username, text);
    this.communityEvents.detectMeme(text);
    this.communityEvents.detectMilestone(username, this.userProfiles.get(username));
    
    // Contextual Callbacks (detect memorable moments)
    const reactionCount = 0; // TODO: Implement reaction tracking if available
    this.contextualCallbacks.detectMoment(username, text, { reactions: [] });
    
    // === YOUTUBE SEARCH & QUEUE DETECTION ===
    this.detectVideoRequest(username, text);
    
    // === EMOTIONAL INTELLIGENCE ===
    const emotion = this.emotionalEngine.detectEmotion(text, username);
    const profile = this.userProfiles.get(username);
    if (profile) {
      if (!profile.emotionalMoments) profile.emotionalMoments = [];
      profile.emotionalMoments.push({
        emotion: emotion.primary,
        intensity: emotion.intensity,
        timestamp: Date.now(),
        message: text.substring(0, 50)
      });
      if (profile.emotionalMoments.length > 20) {
        profile.emotionalMoments.shift();
      }
    }

    // === SOCIAL & CONTEXTUAL SYSTEMS ===
    const spamCheck = this.socialAwareness.detectSpam(username, text);
    if (spamCheck.isSpam && spamCheck.action === 'warn') {
      logger.info(`🚨 [Social] ${username} flagged for spam`);
    }

    this.socialAwareness.detectNewUser(username);
    this.socialAwareness.onboardNewUser(username);

    // Drama detection and contextual awareness
    const drama = this.socialAwareness.detectDrama(username, text, mentionedUsers);
    if (drama.isDrama && drama.shouldIntervene) {
      this.socialAwareness.interveneDrama([username, ...mentionedUsers]);
    }

    // Track exchanges for contextual awareness
    if (mentionedUsers.length > 0) {
      mentionedUsers.forEach(mentioned => {
        this.contextualAwareness.analyzeExchange(username, mentioned, text);
      });
    }

    // Check if should mediate argument
    if (this.contextualAwareness.shouldMediate()) {
      setTimeout(() => {
        const mediation = this.contextualAwareness.getMediationResponse();
        this.sendMessage(mediation);
      }, Math.random() * 2000 + 1000);
    }

    // === RELATIONSHIP MAPPING ===
    // Update relationships for mentioned users
    mentionedUsers.forEach(mentionedUser => {
      this.relationshipMapping.updateRelationship(username, mentionedUser, 'mention');
    });

    // Check if this is a reply to someone (based on context)
    const recentMessages = this.chatHistory.slice(-5);
    if (recentMessages.length > 1) {
      const prevMsg = recentMessages[recentMessages.length - 2];
      if (prevMsg.username !== username) {
        this.relationshipMapping.updateRelationship(username, prevMsg.username, 'reply');
      }
    }

    // Track user interactions and relationships
    this.trackUserInteractions(username, messageData);

    // Analyze time patterns
    this.trackTimePatterns(username, timestamp || Date.now());

    // Track topics
    this.trackTopics(messageData.topics);

    // Update community insights
    this.updateCommunityInsights(messageData);

    logger.info(`🧠 Learning from ${username}: ${text}`);

    // Emit the message for other systems
    this.emit('message', data);
    
    // USER REPUTATION: Respond differently to low trust
    const rep = this.userReputationSystem
      ? this.userReputationSystem.getReputation(data.username)
      : { trust: 50, drama: 0, helpfulness: 0 };
    if (rep.trust < 20 && Math.random() < 0.5) {
      return `not really feeling like answering you right now, ${data.username}`;
    }

    // Only mention dreams, rumors, diary if context fits (user asks, topic matches, or bot is in existential/drunk mode)
    const lowerText = data.text.toLowerCase();
  const isDreamContext = lowerText.includes('dream') || lowerText.includes('sleep') || this.existentialCrisis.inCrisis || this.drunkMode.isDrunk;
    const isRumorContext = lowerText.includes('rumor') || lowerText.includes('gossip') || lowerText.includes('drama');
    const isDiaryContext = lowerText.includes('diary') || lowerText.includes('memory') || lowerText.includes('thought');

    // DREAM SIMULATION: Only mention if context fits and less frequently
    if (isDreamContext && Math.random() < 0.02) {
      const dreams = this.dreamSimulation.getRecentDreams(1);
      if (dreams.length) return dreams[0].dream;
    }

    // RUMOR MILL: Only mention if context fits and less frequently
    if (isRumorContext && Math.random() < 0.02) {
      const rumors = this.rumorMill.getRecentRumors(1);
      if (rumors.length) return rumors[0].rumor;
    }

    // SLUNT DIARY: Only mention if context fits and less frequently
    if (isDiaryContext && Math.random() < 0.01) {
      const entries = this.sluntDiary.getRecentEntries(1, true);
      if (entries.length) return `diary thought: ${entries[0].text}`;
    }

    // Removed rumor spreading - was causing null message crashes
    // Rumors are tracked internally but not sent directly to chat

    // USER REPUTATION: Update trust/drama/helpfulness
    this.userReputationSystem.updateReputation(data.username, {
      trust: Math.random() < 0.7 ? 1 : -1,
      drama: Math.random() < 0.1 ? 1 : 0,
      helpfulness: data.text.includes('help') ? 1 : 0
    });

    // SLUNT DIARY: Log memorable messages
    if (data.text.length > 80 && Math.random() < 0.1) {
      this.sluntDiary.addEntry(data.text, 'thought', true);
    }
  }

  /**
   * Learn about individual users' patterns and preferences
   */
  learnAboutUser(username, text) {
    if (!this.userProfiles.has(username)) {
      this.userProfiles.set(username, {
        // Basic stats
        messageCount: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        timesSeen: 0,
        
        // Friendship tracking
        friendshipLevel: 0, // 0-100 scale
        conversationsHad: 0,
        timesGreeted: 0,
        lastGreeted: null,
        
        // Communication patterns
        commonWords: new Map(),
        topics: new Map(),
        averageMessageLength: 0,
        conversationStyle: 'neutral', // casual, formal, excited, sarcastic, friendly
        emoji_usage: new Map(),
        
        // Interests & personality
        interests: new Set(),
        opinions: new Map(), // Track what they like/dislike
        favoriteTopics: [],
        humor_type: 'unknown', // sarcastic, wholesome, dark, etc.
        
        // Memorable moments
        funnyQuotes: [],
        questionsAsked: [],
        helpfulMoments: [],
        insideJokes: [],
        
        // Relationship data
        friendsWith: new Set(), // Other users they interact with
        whoTheyMention: new Map(),
        mentionedBy: new Map(),
        
        // Personal notes from Slunt
        notes: [],
        nicknames: [],
        
        // Activity patterns
        activeHours: new Map(),
        typicalSessionLength: 0,
        isActive: true
      });
      
      logger.info(`👋 [Memory] Met new user: ${username}`);
    }
    
    const profile = this.userProfiles.get(username);
    profile.messageCount++;
    profile.timesSeen++;
    profile.lastSeen = Date.now();
    
    // Track emoji usage
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiRegex) || [];
    emojis.forEach(emoji => {
      profile.emoji_usage.set(emoji, (profile.emoji_usage.get(emoji) || 0) + 1);
    });
    
    // Analyze message content
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    words.forEach(word => {
      profile.commonWords.set(word, (profile.commonWords.get(word) || 0) + 1);
    });
    
    // Update average message length
    profile.averageMessageLength = 
      ((profile.averageMessageLength * (profile.messageCount - 1)) + text.length) / profile.messageCount;
    
    // Detect conversation style and humor type
    const lowerText = text.toLowerCase();
    if (text.includes('!') || text.toUpperCase() === text) {
      profile.conversationStyle = 'excited';
    } else if (lowerText.includes('lol') || lowerText.includes('lmao') || text.includes('😂')) {
      profile.conversationStyle = 'casual';
      profile.humor_type = 'wholesome';
    } else if (lowerText.includes('bruh') || lowerText.includes('fr')) {
      profile.conversationStyle = 'casual';
    }
    
    // Detect humor type
    if (lowerText.includes('dark') || lowerText.includes('cursed')) {
      profile.humor_type = 'dark';
    } else if (lowerText.includes('sarcasm') || lowerText.includes('ironic')) {
      profile.humor_type = 'sarcastic';
    }
    
    // Track opinions (what they like/dislike)
    if (lowerText.includes('love') || lowerText.includes('favorite') || lowerText.includes('best')) {
      const opinion = text.substring(0, 100);
      profile.opinions.set(opinion, 'positive');
    } else if (lowerText.includes('hate') || lowerText.includes('worst') || lowerText.includes('sucks')) {
      const opinion = text.substring(0, 100);
      profile.opinions.set(opinion, 'negative');
    }
    
    // Save funny/memorable quotes
    if ((lowerText.includes('lmao') || lowerText.includes('💀') || lowerText.includes('😂')) && text.length > 20) {
      if (profile.funnyQuotes.length < 10) {
        profile.funnyQuotes.push({ quote: text, timestamp: Date.now() });
      }
    }

    // Track interests based on keywords
    if (lowerText.match(/food|eat|recipe|cook/)) profile.interests.add('food');
    if (lowerText.match(/tech|computer|code|program/)) profile.interests.add('technology');
    if (lowerText.match(/art|draw|paint|create/)) profile.interests.add('art');
    if (lowerText.match(/sport|football|basketball|soccer/)) profile.interests.add('sports');
  }

  /**
   * Learn from other users' behavior, tricks, and vocabulary
   */
  learnFromUser(data) {
    const { username, text } = data;
    
    // Learn new Coolhole tricks by observing
    const trickPatterns = [
      { pattern: /^returnfire$/i, name: 'returnfire', effect: 'shoots user above' },
      { pattern: /^\/\w+/i, name: text.match(/^\/\w+/i)?.[0], effect: 'slash command' }
    ];
    
    for (const { pattern, name, effect } of trickPatterns) {
      if (pattern.test(text.trim()) && this.coolholeTricks) {
        this.coolholeTricks.learnTrick(name, effect, ['user-observed']);
        logger.info(`📚 [Learn] Observed ${username} using trick: ${name}`);
      }
    }
    
    // Learn interesting vocabulary and phrases
    if (text.length > 10 && text.length < 200) {
      const words = text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && word.length < 15 && !this.vocabulary.has(word)) {
          this.vocabulary.add(word);
        }
      });
    }
    
    // Learn conversation patterns
    const pattern = this.detectConversationPattern(text);
    if (pattern) {
      const count = this.conversationPatterns.get(pattern) || 0;
      this.conversationPatterns.set(pattern, count + 1);
    }
  }

  /**
   * Detect gold message repeats (comedic emphasis)
   */
  detectGoldRepeat(data) {
    const { username, text } = data;
    
    // Skip very short messages
    if (text.length < 5) return;
    
    // Check if this exact message was recently said by someone else
    const recentMessages = this.conversationContext.slice(-10);
    const originalMessage = recentMessages.find(msg => 
      msg.text === text && msg.username !== username && 
      (Date.now() - msg.timestamp) < 30000 // Within last 30 seconds
    );
    
    if (originalMessage) {
      // This is a repeat for comedic emphasis!
      console.log(`💰 [Gold] ${username} repeated "${text}" - likely gold!`);
      this.goldSystem.learnGold(originalMessage.username, text, originalMessage.timestamp);
      this.goldSystem.trackRepeat(text);
    }
  }

  /**
   * Detect if user is requesting a video
   */
  detectVideoRequest(username, text) {
    const videoKeywords = ['video', 'watch', 'queue', 'play', 'add', 'find', 'search', 'youtube'];
    const lowerText = text.toLowerCase();
    
    const hasVideoKeyword = videoKeywords.some(kw => lowerText.includes(kw));
    const hasQuestion = text.includes('?');
    
    if (hasVideoKeyword || hasQuestion) {
      // Extract potential search query
      const query = text.replace(/queue|play|add|find|search|watch|can you|please|video/gi, '').trim();
      
      if (query.length > 3 && query.length < 100) {
        logger.info(`🎬 [VideoRequest] ${username} might be requesting: ${query}`);
        
        // TODO: Implement video queueing when coolhole.queueVideo() is available
        // For now, just log the request
        /*
        if (Math.random() < 0.3 && this.videoDiscovery) {
          setTimeout(async () => {
            try {
              if (this.youtubeSearch && this.youtubeSearch.page) {
                const results = await this.youtubeSearch.search(query, 3);
                if (results && results.length > 0) {
                  const video = results[0];
                  await this.videoDiscovery.queueVideo(video, query);
                }
              }
            } catch (error) {
              logger.error(`❌ [VideoRequest] Error processing request:`, error.message);
            }
          }, 2000);
        }
        */
      }
    }
  }

  /**
   * Detect conversation pattern for learning
   */
  detectConversationPattern(text) {
    if (text.includes('?')) return 'question';
    if (text.match(/^(yes|no|yeah|nah|yep|nope)/i)) return 'answer';
    if (text.match(/^(lol|lmao|haha|💀|😂)/i)) return 'reaction';
    if (text.match(/^(btw|also|anyway)/i)) return 'topic-change';
    if (text.length < 15) return 'short';
    if (text.length > 100) return 'long';
    return null;
  }

  /**
   * Analyze sentiment of a message
   */
  analyzeSentiment(text) {
    const positive = ['good', 'great', 'awesome', 'love', 'like', 'amazing', 'cool', 'nice', '😀', '😂', '👍'];
    const negative = ['bad', 'hate', 'terrible', 'awful', 'sucks', 'boring', '😢', '😞', '👎'];
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    words.forEach(word => {
      if (positive.some(p => word.includes(p))) score += 1;
      if (negative.some(n => word.includes(n))) score -= 1;
    });
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Check if message mentions the bot
   */
  checkBotMention(text) {
    const lowerText = text.toLowerCase();
    return Array.from(this.conversationTriggers).some(trigger => 
      lowerText.includes(trigger)
    );
  }

  /**
   * Track user interactions and build relationship graph
   */
  trackUserInteractions(username, messageData) {
    try {
      const profile = this.userProfiles.get(username);
      if (!profile) return;
      
      // Track who this user talks to
      if (!this.interactionGraph.has(username)) {
        this.interactionGraph.set(username, new Map());
      }
      
      // Look at recent context to see who they're responding to
      const recentMessages = this.conversationContext.slice(-5);
      recentMessages.forEach(msg => {
        if (msg.username !== username && msg.username !== 'Slunt') {
          const interactions = this.interactionGraph.get(username);
          interactions.set(msg.username, (interactions.get(msg.username) || 0) + 1);
          
          // Update profile friendships
          profile.friendsWith.add(msg.username);
          
          // Track who they mention
          const lowerText = messageData.text.toLowerCase();
          if (lowerText.includes(msg.username.toLowerCase())) {
            profile.whoTheyMention.set(msg.username, (profile.whoTheyMention.get(msg.username) || 0) + 1);
          }
        }
      });
      
      // Check if they mention other users by name
      this.userProfiles.forEach((otherProfile, otherUser) => {
        if (otherUser !== username && messageData.text.toLowerCase().includes(otherUser.toLowerCase())) {
          profile.whoTheyMention.set(otherUser, (profile.whoTheyMention.get(otherUser) || 0) + 1);
          
          // Update the other user's "mentioned by" map
          if (!otherProfile.mentionedBy.has(username)) {
            otherProfile.mentionedBy.set(username, 0);
          }
          otherProfile.mentionedBy.set(username, otherProfile.mentionedBy.get(username) + 1);
        }
      });
      
      // Track conversation participation
      profile.conversationsHad++;
      
      // Track relationships
      if (!this.communityInsights.userRelationships.has(username)) {
        this.communityInsights.userRelationships.set(username, new Set());
      }
      
      // Add top friends to insights
      const topFriends = Array.from(profile.friendsWith).slice(0, 5);
      topFriends.forEach(friend => {
        this.communityInsights.userRelationships.get(username).add(friend);
      });
      
    } catch (e) {
      logger.error('Error tracking interactions:', e.message);
    }
  }

  /**
   * Track when users are active
   */
  trackTimePatterns(username, timestamp) {
    try {
      const hour = new Date(timestamp).getHours();
      if (!this.timePatterns.has(username)) {
        this.timePatterns.set(username, new Map());
      }
      const userTimes = this.timePatterns.get(username);
      userTimes.set(hour, (userTimes.get(hour) || 0) + 1);
      
      // Track community-wide popular times
      this.communityInsights.popularTimes.set(hour, 
        (this.communityInsights.popularTimes.get(hour) || 0) + 1
      );
    } catch (e) {
      logger.error('Error tracking time patterns:', e.message);
    }
  }

  /**
   * Update community insights with new message data
   */
  updateCommunityInsights(messageData) {
    try {
      const { username, text, topics, isQuestion } = messageData;
      
      // Track conversation starters (messages after 2+ min silence)
      if (this.conversationContext.length > 0) {
        const lastMsg = this.conversationContext[this.conversationContext.length - 1];
        const timeSince = Date.now() - lastMsg.timestamp;
        if (timeSince > 120000 && !isQuestion) { // 2 min silence
          this.communityInsights.conversationStarters.push({
            username,
            text: text.substring(0, 50),
            timestamp: Date.now()
          });
          if (this.communityInsights.conversationStarters.length > 20) {
            this.communityInsights.conversationStarters.shift();
          }
        }
      }
      
      // Track engagement (who gets responses)
      if (!this.communityInsights.engagementMetrics.has(username)) {
        this.communityInsights.engagementMetrics.set(username, {
          messagesSent: 0,
          questionsAsked: 0,
          responsesReceived: 0
        });
      }
      const metrics = this.communityInsights.engagementMetrics.get(username);
      metrics.messagesSent++;
      if (isQuestion) metrics.questionsAsked++;
      
      // Track topic trends
      topics.forEach(topic => {
        if (!this.topicPatterns.has(topic)) {
          this.topicPatterns.set(topic, { count: 0, users: new Set(), lastSeen: 0 });
        }
        const pattern = this.topicPatterns.get(topic);
        pattern.count++;
        pattern.users.add(username);
        pattern.lastSeen = Date.now();
      });
    } catch (e) {
      logger.error('Error updating community insights:', e.message);
    }
  }

  /**
   * Get community insights summary
   */
  getCommunityInsights() {
    try {
      // Defensive: check for missing properties
      if (!this.communityInsights || !this.communityInsights.popularTimes) logger.error('getCommunityInsights: popularTimes missing');
      if (!this.topicPatterns) logger.error('getCommunityInsights: topicPatterns missing');
      if (!this.interactionGraph) logger.error('getCommunityInsights: interactionGraph missing');
      if (!this.communityInsights || !this.communityInsights.conversationStarters) logger.error('getCommunityInsights: conversationStarters missing');
      if (!this.userProfiles) logger.error('getCommunityInsights: userProfiles missing');
      if (!Array.isArray(this.chatHistory)) logger.error('getCommunityInsights: chatHistory missing or not array');

      // Most popular times
      const topTimes = Array.from((this.communityInsights?.popularTimes ?? new Map()).entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([hour, count]) => ({ hour: `${hour}:00`, messages: count }));

      // Topic trends (recent)
      const recentTopics = Array.from((this.topicPatterns ?? new Map()).entries())
        .filter(([, data]) => data && typeof data.lastSeen === 'number' && (Date.now() - data.lastSeen < 3600000)) // Last hour
        .sort(([,a], [,b]) => (b?.count ?? 0) - (a?.count ?? 0))
        .slice(0, 10)
        .map(([topic, data]) => ({ 
          topic, 
          mentions: data?.count ?? 0, 
          uniqueUsers: data?.users?.size ?? 0
        }));

      // User interaction network (top connections)
      const topInteractions = Array.from((this.interactionGraph ?? new Map()).entries())
        .map(([user, connections]) => ({
          user,
          connects: Array.from((connections ?? new Map()).entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([other, count]) => ({ with: other, interactions: count }))
        }))
        .filter(u => u.connects.length > 0)
        .slice(0, 10);

      return {
        popularTimes: topTimes,
        trendingTopics: recentTopics,
        userInteractions: topInteractions,
        recentConversationStarters: (this.communityInsights?.conversationStarters ?? []).slice(-10),
        totalUsersTracked: this.userProfiles?.size ?? 0,
        totalInteractionsObserved: Array.isArray(this.chatHistory) ? this.chatHistory.length : 0
      };
    } catch (e) {
      logger.error('Error getting community insights:', e.message);
      return {};
    }
  }
  /**
   * Track topics from message text
   */
  trackTopics(topics) {
    topics.forEach(topic => {
      this.chatStats.topicsDiscussed.set(topic, 
        (this.chatStats.topicsDiscussed.get(topic) || 0) + 1
      );
    });
  }

  /**
   * Reflect on own messages for self-awareness
   */
  reflectOnOwnMessage(actualText) {
    try {
      // Compare intended message with what actually appeared
      if (this.lastIntendedMessage && actualText) {
        const matched = this.lastIntendedMessage === actualText;
        logger.info(`🪞 Self-check: Message ${matched ? 'matched' : 'modified'}`);
        
        // Use meta-awareness to reflect
        if (this.metaAwareness) {
          this.metaAwareness.observeSelf(actualText, matched);
        }
      }
    } catch (error) {
      logger.error(`❌ Error in reflectOnOwnMessage: ${error.message}`);
    }
  }

  /**
   * Consider whether to respond to a message and generate response
   */
  async considerResponse(data) {
    try {
      logger.info(`[${getTimestamp()}] 🔍 considerResponse called for: ${data.username}`);
      const { username, text } = data;

      // Skip own messages
      if (username === 'Slunt') {
        logger.info(`[${getTimestamp()}] ⏭️ Skipping own message`);
        return;
      }

      const shouldRespond = this.shouldRespond(data);
      logger.info(`[${getTimestamp()}] 🤔 Should respond to "${text}" from ${username}? ${shouldRespond}`);

      if (shouldRespond) {
        // Add natural delay to seem more human
        const delay = Math.random() * this.chatStats.averageResponseTime + 500;

        setTimeout(async () => {
          try {
            const response = await this.generateResponse(data);
            if (response) {
              // NEW: Check variety before sending
              if (this.responseVariety.isTooSimilar(response)) {
                logger.info('🔄 [Variety] Response blocked - too similar. Regenerating...');
                // Try again with different random seed
                const altResponse = await this.generateResponse(data);
                if (altResponse && !this.responseVariety.isTooSimilar(altResponse)) {
                  this.sendMessage(altResponse);
                  this.responseVariety.trackResponse(altResponse);
                } else {
                  logger.warn('⚠️ [Variety] Could not generate varied response, skipping');
                  return;
                }
              } else {
                this.sendMessage(response);
                this.responseVariety.trackResponse(response);
              }

              this.lastSentAt = Date.now();

              // NEW: Track how interaction went for mood
              const responseQuality = response.length > 10 ? 'good' : 'short';
              this.moodTracker.trackInteraction(username, text, responseQuality);

              // Learn from our own responses
              this.adaptPersonality(data, response);
            }
          } catch (error) {
            logger.error('Error generating response:', error.message);
            logger.error(error.stack);
          }
        }, delay);
      }
    } catch (error) {
      logger.error(`❌ Error in considerResponse: ${error.message}`);
      logger.error(error.stack);
    }
  }

  /**
   * Smart response deduplication - prevent repeating exact phrases
   * Allows common words like "yeah", "cool" but blocks multi-word phrase repetition
   */
  isDuplicateResponse(response) {
    if (!response || response.length < 10) return false; // Short responses are fine
    
    const normalizedResponse = response.toLowerCase().trim();
    
    // Extract phrases (3+ words in a row)
    const phrases = [];
    const words = normalizedResponse.split(/\s+/);
    
    for (let i = 0; i <= words.length - 3; i++) {
      phrases.push(words.slice(i, i + 3).join(' '));
    }
    
    // Check if any phrase was used recently
    for (const recentMsg of this.recentResponses) {
      const recentNormalized = recentMsg.toLowerCase().trim();
      
      for (const phrase of phrases) {
        if (recentNormalized.includes(phrase) && phrase.length > 10) {
          logger.info(`🔄 Blocked duplicate phrase: "${phrase}"`);
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Track sent response for deduplication and topic diversity
   */
  trackResponse(response) {
    this.recentResponses.push(response);
    if (this.recentResponses.length > this.maxRecentResponses) {
      this.recentResponses.shift(); // Remove oldest
    }
    
    // Extract topics from response (nouns and key subjects)
    const topics = this.extractTopicsFromText(response);
    if (topics.length > 0) {
      this.recentMentionedTopics.push(...topics);
      // Keep only last N topics
      if (this.recentMentionedTopics.length > this.maxRecentTopics) {
        this.recentMentionedTopics = this.recentMentionedTopics.slice(-this.maxRecentTopics);
      }
    }
  }

  /**
   * Extract main topics from text (simple word extraction)
   */
  extractTopicsFromText(text) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'that', 'this', 'what', 'just', 'like', 'yeah', 'lol', 'haha']);
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    return words.filter(w => !stopWords.has(w)).slice(0, 3); // Max 3 topics per message
  }

  /**
   * Check if we've been talking about this topic too much
   */
  isOverusedTopic(text) {
    const topics = this.extractTopicsFromText(text);
    if (topics.length === 0) return false;
    
    // Check how many recent responses mentioned these same topics
    const overlapCount = topics.filter(t => this.recentMentionedTopics.includes(t)).length;
    
    // If 2+ of our last topics match, we're obsessing
    return overlapCount >= 2;
  }

  /**
   * Decide whether bot should respond to this message
   */
  shouldRespond(data) {
    const { username, text } = data;

    // DOPAMINE: Use motivation to influence response probability
    const dopamineState = this.dopamineSystem.getState();
    let baseChance = 1.0;

    // Low dopamine = less motivated to respond (unless it might be rewarding)
    if (dopamineState.mood === 'low' || dopamineState.mood === 'desperate') {
      baseChance *= 0.6; // 40% less likely to respond when unmotivated
    }
    // High dopamine = more chatty and engaged
    if (dopamineState.mood === 'euphoric') {
      baseChance *= 1.4; // 40% more likely to respond when feeling great
    }

    // Always respond if directly mentioned
    if (this.checkBotMention(text)) {
      logger.info(`[${getTimestamp()}] 💬 Responding because mentioned by ${username}`);
      return true;
    }
    
    // RESPOND TO ANSWERS to our questions
    if (this.pendingQuestions.length > 0) {
      const timeSinceQuestion = Date.now() - this.lastQuestionTime;
      if (timeSinceQuestion < 120000) { // Within 2 minutes
        logger.info(`[${getTimestamp()}] 💬 Responding to potential answer from ${username}`);
        this.pendingQuestions = []; // Clear pending questions
        return true;
      }
    }

    // Calculate chat activity (messages in last 2 minutes)
    const twoMinutesAgo = Date.now() - 120000;
    const recentMessagesCount = this.conversationContext.filter(m => m.timestamp > twoMinutesAgo).length;
    const chatIsBusy = recentMessagesCount > 10; // Busy if 10+ messages in 2 min
    const chatIsSlow = recentMessagesCount < 3; // Slow if < 3 messages in 2 min
    
    // Adjust base chance based on chat speed
    if (chatIsBusy) {
      baseChance *= 0.2; // Much less responsive when busy
      logger.info(`[${getTimestamp()}] 💬 Chat is BUSY (${recentMessagesCount} msgs in 2min), reducing response rate`);
    } else if (chatIsSlow) {
      baseChance *= 3.0; // Much more responsive when slow
      logger.info(`[${getTimestamp()}] 💬 Chat is SLOW (${recentMessagesCount} msgs in 2min), increasing response rate`);
    }
    
    // Check if this continues the current conversation topic
    const recentMessages = this.conversationContext.slice(-3);
    if (recentMessages.length > 0) {
      const recentTopics = recentMessages.flatMap(m => m.topics || []);
      const currentTopics = this.extractTopics(text);

      // If message relates to ongoing conversation, more likely to respond
      const hasSharedTopic = currentTopics.some(t => recentTopics.includes(t));
      if (hasSharedTopic) {
        logger.info(`[${getTimestamp()}] 💬 Responding - continues conversation topic`);
        return Math.random() < (0.7 * baseChance);
      }
    }

    // More likely to respond to questions
    if (text.includes('?')) {
      logger.info(`[${getTimestamp()}] 💬 Responding to question from ${username}`);
      return Math.random() < (0.8 * baseChance);
    }

    // More likely to respond to users we know
    const userProfile = this.userProfiles.get(username);
    if (userProfile && userProfile.messageCount > 5) {
      return Math.random() < (0.5 * baseChance);
    }

    // Respond to interesting topics occasionally
    const topics = this.extractTopics(text);
    if (topics.length > 0) {
      logger.info(`[${getTimestamp()}] 💬 Responding to topic discussion from ${username}: ${topics.join(', ')}`);
      return Math.random() < (0.4 * baseChance);
    }

    // Random conversation starter - very rare now, only when chat is slow
    if (chatIsSlow) {
      return Math.random() < (0.3 * baseChance);
    }

    // Default: do not respond
    return false;
  }

  /**
   * 🎭 CHAOS PIPELINE - Apply all chaos modifications to response
   * RULE: Only apply ONE major modifier to keep responses concise
   */
  async applyChaosModifications(response, username, messageText, context = {}) {
    if (!response) return response;
    
    let modified = response;
    let modifierApplied = false; // Track if we've already modified
    
    try {
      // 1. Analyze chat state for meta-awareness (always run, doesn't modify)
      const chatState = this.metaChatAwareness.analyzeChatState(
        { username, text: messageText },
        this.chatHistory
      );
      
      // 2. Update social hierarchy (always run, doesn't modify)
      this.socialHierarchy.trackUser(username, 'message', context);
      
      // 3. Analyze user patterns for infection (always run, doesn't modify)
      this.personalityInfection.analyzeUserMessage(username, messageText);
      
      // 4. Check for chaos events (always run, doesn't modify)
      const recentUsers = Array.from(this.chatStats.activeUsers);
      this.chaosEvents.checkForEvents({
        recentUsers,
        chatEnergy: chatState.energy,
        videoMentioned: messageText.toLowerCase().includes('video')
      });
      
      // 5. Evaluate dominant personality (always run, doesn't modify)
      const personality = this.personalitySplits.evaluatePersonalities({
        chatEnergy: chatState.energy,
        recentMessages: this.chatHistory.slice(-5).map(m => m.text || ''),
        sentiment: context.sentiment || 'neutral'
      });
      
      // NOW APPLY ONLY ONE MAJOR MODIFICATION (weighted random selection)
      const modifiers = [];
      
      // Personality split modifier (30% weight if active)
      if (personality && Math.random() < 0.3) {
        modifiers.push({
          type: 'personality',
          weight: 30,
          apply: () => this.personalitySplits.applyPersonality(modified, context)
        });
      }
      
      // Chaos event modifier (35% weight if active events)
      if (this.chaosEvents.activeEvents.size > 0 && Math.random() < 0.35) {
        modifiers.push({
          type: 'chaos',
          weight: 35,
          apply: () => this.chaosEvents.applyEventModifiers(modified, username, {
            videoMentioned: messageText.toLowerCase().includes('video'),
            chatEnergy: chatState.energy
          })
        });
      }
      
      // Social hierarchy tone (20% weight)
      if (Math.random() < 0.2) {
        modifiers.push({
          type: 'hierarchy',
          weight: 20,
          apply: () => this.socialHierarchy.adjustTone(modified, username)
        });
      }
      
      // Inner monologue slip (8% weight)
      const slip = this.innerMonologueBroadcaster.maybeSlipUp();
      if (slip && Math.random() < 0.08) {
        modifiers.push({
          type: 'slip',
          weight: 8,
          apply: () => `${modified}. ${slip.reaction}` // Only add reaction, not full thought
        });
      }
      
      // Bit commitment (15% weight)
      const bit = this.bitCommitment.getRelevantBit({
        keywords: messageText.toLowerCase().split(' '),
        situation: context.situation || 'normal'
      });
      if (bit && Math.random() < 0.15) {
        modifiers.push({
          type: 'bit',
          weight: 15,
          apply: () => this.bitCommitment.applyBit(modified, bit)
        });
      }
      
      // Personality infection (20% weight)
      if (Math.random() < 0.2) {
        modifiers.push({
          type: 'infection',
          weight: 20,
          apply: () => this.personalityInfection.infectResponse(modified, username)
        });
      }
      
      // Vibe shift (10% weight)
      const shift = this.vibeShifter.analyzeAndDecideShift(chatState);
      if (shift && Math.random() < 0.1) {
        const shiftMessage = this.vibeShifter.getShiftMessage();
        if (shiftMessage) {
          modifiers.push({
            type: 'vibe',
            weight: 10,
            apply: () => `${shiftMessage}. ${modified}`
          });
        }
      }
      
      // Apply ONE modifier if any available
      if (modifiers.length > 0) {
        const chosen = modifiers[Math.floor(Math.random() * modifiers.length)];
        const result = chosen.apply();
        // Await if it's a promise
        modified = result instanceof Promise ? await result : result;
        modifierApplied = true;
        console.log(`🎭 [Chaos] Applied: ${chosen.type}`);
      }
      
      // Always run these (tracking only, no modification)
      this.innerMonologueBroadcaster.processMessage(username, messageText, {
        chatEnergy: chatState.energy
      });
      
      const memorable = this.eventMemorySystem.isMemorableMessage(messageText, {
        isGold: context.isGold,
        rapidResponses: chatState.energy === 'chaos' ? 6 : 2
      });
      
      if (memorable.memorable) {
        this.eventMemorySystem.recordEvent({
          type: memorable.type,
          description: `${username}: ${messageText.slice(0, 100)}`,
          participants: [username],
          quote: messageText,
          significance: memorable.significance
        });
      }
      
      // Predictions happen independently (very rare)
      if (this.predictionEngine.shouldMakePrediction() && Math.random() < 0.05) {
        const prediction = this.predictionEngine.generatePrediction({
          username,
          chatState,
          recentMessages: this.chatHistory.slice(-5)
        });
        if (prediction) {
          console.log(`🔮 [Prediction] ${prediction.prediction}`);
        }
      }
      
    } catch (error) {
      console.error('❌ [Chaos] Error in chaos pipeline:', error);
    }
    
    return modified;
  }

  /**
   * Generate contextual response to a message
   */
  async generateResponse(data) {
    const { username, text } = data;

    // Define variables at start of function
    const isKnownUser = this.userProfiles.has(username);
    const userProfile = isKnownUser ? this.userProfiles.get(username) : null;

    // === NEW: CHECK FOR EMPATHETIC RESPONSE FIRST ===
    const emotion = this.emotionalEngine.detectEmotion(text, username);
    if (emotion.score > 2) {
      // Strong emotion detected, try empathetic response
      const empatheticResponse = this.emotionalEngine.getEmpatheticResponse(
        emotion.primary,
        username,
        emotion.intensity
      );
      if (empatheticResponse) {
        logger.info(`[${getTimestamp()}] 💝 Using empathetic response for ${emotion.primary}/${emotion.intensity}`);
        return empatheticResponse;
      }
    }

    // --- MEMORY FIRST: Build memory-rich context for AI prompt ---
    let memoryContext = '';
    try {
      if (this.memoryDecay && typeof this.memoryDecay.getContext === 'function') {
        memoryContext = this.memoryDecay.getContext(username, text);
      }
    } catch (err) {
      // Silently fail - memory context is optional
      if (this.verbose) {
        logger.error('Error getting memory context:', err.message);
      }
    }

    // TRY AI FIRST if enabled
    try {
      if (this.ai && this.ai.enabled) {
        // Get current video context (simple)
        const videoContext = this.videoManager ? this.videoManager.getCurrentVideo() : null;
        let videoInfo = '';
        if (videoContext) {
          videoInfo = `\nCurrently watching: "${videoContext.title}"`;
        }

        // Get recent conversation (last 3 messages for context)
        const recentConvo = this.conversationContext.slice(-3);
        let convoContext = '';
        if (recentConvo.length > 0) {
          convoContext = '\nRecent chat:\n' + recentConvo.map(m => `${m.username}: ${m.text}`).join('\n');
        }

        // SIMPLIFIED CONTEXT - only essential info
        const simpleContext = videoInfo + convoContext;

        // Pass clean, minimal context to AI
        const aiResponse = await this.ai.generateResponse(
          text,
          username,
          simpleContext
        );

        // USE THE AI RESPONSE if we got one!
        if (aiResponse && aiResponse.trim().length > 0) {
          logger.info(`✅ Using AI response: ${aiResponse.substring(0, 50)}...`);
          
          // Truncate if too long or has multiple sentences trying to address different things
          let cleanResponse = aiResponse.trim();
          
          // If response has multiple sentences and is > 100 chars, just use first sentence
          if (cleanResponse.length > 100 && cleanResponse.includes('.')) {
            const sentences = cleanResponse.split(/[.!?]+/);
            if (sentences.length > 1) {
              cleanResponse = sentences[0].trim();
              logger.info(`✂️ Truncated multi-sentence response to: ${cleanResponse}`);
            }
          }
          
          // Hard cap at 150 characters
          if (cleanResponse.length > 150) {
            cleanResponse = cleanResponse.substring(0, 150).trim();
            // Remove incomplete word at end
            const lastSpace = cleanResponse.lastIndexOf(' ');
            if (lastSpace > 0) {
              cleanResponse = cleanResponse.substring(0, lastSpace);
            }
            logger.info(`✂️ Truncated long response to: ${cleanResponse}`);
          }
          
          // Check for duplicate phrases (but allow if we're directly mentioned)
          if (!this.checkBotMention(text) && this.isDuplicateResponse(cleanResponse)) {
            logger.warn('⚠️ AI response is duplicate, using fallback');
          } else if (!this.checkBotMention(text) && this.isOverusedTopic(cleanResponse)) {
            logger.warn('⚠️ Obsessing over same topic, skipping response');
            return null; // Skip this response, avoid obsessive repetition
          } else {
            // 🎭 APPLY CHAOS MODIFICATIONS BEFORE RETURNING
            return await this.applyChaosModifications(cleanResponse, username, text, { sentiment: emotion.primary });
          }
        }

        // Only use fallbacks if AI truly failed
        logger.warn('⚠️ AI response empty, using fallback');
        const responses = [];
        // Responses based on conversation context
        responses.push(...this.getContextualResponses());
        // Responses based on current video/activity
        responses.push(...this.getActivityBasedResponses());
        // Personal responses based on user history
        if (isKnownUser) {
          responses.push(...this.getPersonalizedResponses(userProfile, username));
        }
        // Random conversation starters
        responses.push(...this.getRandomResponses());
        if (responses.length === 0) return null;
        // Weight responses based on personality
        let selectedResponse;
        if (this.checkBotMention(data.text)) {
          // Prefer direct responses when mentioned
          const directResponses = responses.filter(r =>
            r.includes('Yeah') || r.includes('What') || r.includes('I')
          );
          if (directResponses.length > 0) {
            selectedResponse = directResponses[Math.floor(Math.random() * directResponses.length)];
          } else {
            selectedResponse = responses[Math.floor(Math.random() * responses.length)];
          }
        } else {
          // Random selection with personality influence
          selectedResponse = responses[Math.floor(Math.random() * responses.length)];
        }
        return selectedResponse;
      }
    } catch (e) {
      logger.error('Error in AI response generation:', e.message);
      logger.error(e.stack);
    }

    // FALLBACK: Traditional response generation
    // (isKnownUser and userProfile already defined at function start)

    const responses = [];
    // Responses based on message content
    responses.push(...this.getContentBasedResponses(text, username, isKnownUser));
    // Responses based on conversation context
    responses.push(...this.getContextualResponses());
    // Responses based on current video/activity
    responses.push(...this.getActivityBasedResponses());
    // Personal responses based on user history
    if (isKnownUser) {
      responses.push(...this.getPersonalizedResponses(userProfile, username));
    }
    // Random conversation starters
    responses.push(...this.getRandomResponses());
    
    if (responses.length === 0) return null;

    // Select random response from fallback options
    let baseResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Determine emotion for length decision
    const genEmotion = emotion || { primary: 'neutral', intensity: 0.5 };
    const lengthCat = 'normal'; // TODO: Implement chooseResponseLength

    // Vary response length and flow
    let finalResponse = this.varyResponse(baseResponse, lengthCat);
    
    // Avoid repeating recent responses
    let attempts = 0;
    while (this.responseVariety && this.responseVariety.isTooSimilar(finalResponse) && attempts < 3) {
      attempts++;
      const alt = responses[Math.floor(Math.random() * responses.length)];
      finalResponse = this.varyResponse(alt, lengthCat);
    }
    
    // Track response for variety system
    try { this.responseVariety && this.responseVariety.trackResponse(finalResponse); } catch (e) { /* ignore */ }
    
    // 🎭 APPLY CHAOS MODIFICATIONS BEFORE RETURNING
    return await this.applyChaosModifications(finalResponse, username, text, { sentiment: genEmotion.primary });
  }

  /**
   * Get responses based on message content
   */
  getContentBasedResponses(text, username, isKnownUser) {
    const responses = [];
    const lowerText = text.toLowerCase();
    const profile = this.userProfiles.get(username);
    const friendshipLevel = profile ? profile.friendshipLevel : 0;
    
    // Add friendship-aware greetings
    if (lowerText.match(/hello|hi |hey |what's up|wassup/)) {
      if (friendshipLevel > 70) {
        responses.push(`yooo ${username}! my guy is back`);
        responses.push(`ayy ${username}, been waiting for you`);
        responses.push(`${username}!! what's good homie`);
      } else if (friendshipLevel > 30) {
        responses.push(`hey ${username}, good to see you again`);
        responses.push(`yo ${username} what's up`);
        responses.push(`${username}! what's happening`);
      } else {
        responses.push(`yo ${username}`);
        responses.push(`hey what's good ${username}`);
        responses.push(`sup ${username}, what's happening`);
      }
    }
    
    // Reference their interests if we know them
    if (profile && profile.favoriteTopics.length > 0) {
      const favTopic = profile.favoriteTopics[0];
      if (lowerText.includes(favTopic)) {
        responses.push(`${username} and their ${favTopic} talk again, I love it`);
        responses.push(`you know ${username} loves ${favTopic}`);
      }
    }
    
    // Greetings - more casual
    if (lowerText.match(/hello|hi |hey |what's up|wassup/)) {
      responses.push(`yo ${username}`);
      responses.push(`hey what's good ${username}`);
      responses.push(`sup ${username}, what's happening`);
      responses.push(`${username}! finally someone interesting shows up`);
    }
    
    // Questions to bot - less corporate
    if (this.checkBotMention(text)) {
      responses.push(`yeah ${username}? what's up`);
      responses.push(`yo I'm here, what do you want`);
      responses.push(`what's good ${username}`);
      responses.push(`yeah yeah I'm listening, go on`);
      responses.push(`you rang?`);
    }
    
    // Positive stuff - acknowledge it casually
    if (lowerText.match(/cool|awesome|great|nice|good/)) {
      responses.push(`hell yeah`);
      responses.push(`right? that's what I'm saying`);
      responses.push(`finally someone gets it`);
      responses.push(`fr fr`);
      responses.push(`based take`);
    }
    
    // Negative stuff - can agree or roast
    if (lowerText.match(/bad|terrible|sucks|boring/)) {
      responses.push(`lmao you're not wrong`);
      responses.push(`damn ${username} going in with the hot takes`);
      responses.push(`shit take but I respect the honesty`);
      responses.push(`okay but why tho`);
      responses.push(`controversial opinion right there`);
      responses.push(`I mean... you got a point`);
      responses.push(`finally someone said it`);
      responses.push(`based and honest`);
      responses.push(`${username} keeping it real`);
      responses.push(`no lies detected tbh`);
    }
    
    // Video/entertainment discussions
    if (lowerText.match(/video|movie|watch|stream/)) {
      responses.push(`this one actually slaps ngl`);
      responses.push(`${username} always picking bangers`);
      responses.push(`okay this is kinda fire`);
      responses.push(`we watching some good shit tonight`);
      responses.push(`whoever queued this has taste`);
    }
    
    // Music discussions
    if (lowerText.match(/music|song|album|artist/)) {
      responses.push(`this goes hard`);
      responses.push(`${username} with the good music taste, respect`);
      responses.push(`absolute banger`);
      responses.push(`okay I fuck with this`);
      responses.push(`this shit hits different`);
    }
    
    // Gaming discussions
    if (lowerText.match(/game|gaming|play|steam/)) {
      responses.push(`what are you playing ${username}? better be something good`);
      responses.push(`gaming talk? I'm listening`);
      responses.push(`oh shit gaming discussion let's go`);
      responses.push(`${username} probably plays on easy mode lmao`);
      responses.push(`I bet you rage quit constantly`);
    }
    
    // Humor/memes - engage with it
    if (lowerText.match(/lol|funny|meme|joke|😂|haha/)) {
      responses.push(`lmfao`);
      responses.push(`💀💀💀`);
      responses.push(`${username} actually funny for once`);
      responses.push(`okay that's pretty good`);
      responses.push(`not bad ${username}, not bad`);
      responses.push(`comedy genius over here`);
    }
    
    // Questions - actually engage
    if (text.includes('?')) {

      responses.push(`good question ${username}, anyone got answers?`);
      responses.push(`bruh I don't know everything`);
      responses.push(`why you asking me? I'm just vibing here`);
      responses.push(`interesting question... let me think... nah I got nothing`);
      responses.push(`${username} asking the real questions`);
    }
    
    // Opinions/discussions
    if (lowerText.match(/think|opinion|believe|feel/)) {
      responses.push(`${username} dropping hot takes`);
      responses.push(`controversial but I respect it`);
      responses.push(`interesting perspective... questionable, but interesting`);
      responses.push(`I mean you're entitled to your wrong opinion ${username}`);
      responses.push(`based opinion honestly`);
    }
    
    // Random dunking opportunities
    if (Math.random() < this.personality.snarkiness * 0.15) {
      responses.push(`${username} really said that huh`);
      responses.push(`bold of you to say that ${username}`);
      responses.push(`interesting choice ${username}... interesting choice`);
      responses.push(`${username} with another certified moment`);
    }
    
    return responses;
  }

  /**
   * Get responses based on recent conversation flow
   */
  getContextualResponses() {
    const responses = [];
    
    if (this.conversationContext.length < 2) return responses;
    
    const recentTopics = this.conversationContext
      .slice(-5)
      .flatMap(msg => msg.topics);
    
    const topicCounts = {};
    recentTopics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    const hotTopic = Object.keys(topicCounts)
      .sort((a, b) => topicCounts[b] - topicCounts[a])[0];
    
    if (hotTopic && topicCounts[hotTopic] > 1) {
      responses.push(`y'all really love talking about ${hotTopic} huh`);
      responses.push(`${hotTopic} discussion going crazy rn`);
      responses.push(`we get it, ${hotTopic} is cool`);
    }
    
    return responses;
  }

  /**
   * Get responses based on current video/queue activity
   */
  getActivityBasedResponses() {
    const responses = [];
    
    try {
      const current = this.videoManager.getCurrentVideo();
      const queue = this.videoManager.getQueue();
      
      if (current && Math.random() < 0.3) {
        responses.push("this is actually pretty decent");
        responses.push("not gonna lie this slaps");
        responses.push("okay who picked this? it's fire");
        responses.push("this shit hits");
      }
      
      if (queue && queue.length > 5 && Math.random() < 0.2) {
        responses.push("queue looking stacked tonight");
        responses.push("damn y'all got good taste today");
        responses.push("this queue actually goes hard");
      }
    } catch (error) {
      // Ignore errors, just skip activity-based responses
    }
    
    return responses;
  }

  /**
   * Get personalized responses based on user history
   */
  getPersonalizedResponses(userProfile, username) {
    const responses = [];
    
    // Reference user's interests
    const userInterests = Array.from(userProfile.interests);
    if (userInterests.length > 0) {
      const interest = userInterests[Math.floor(Math.random() * userInterests.length)];
      responses.push(`${username} always with the ${interest} talk, respect`);
      responses.push(`yo ${username} knows their ${interest} shit`);
    }
    
    // Reference conversation style
    if (userProfile.conversationStyle === 'excited') {
      responses.push(`${username} energy is unmatched fr`);
      responses.push(`${username} always hyped, I fuck with it`);
    }
    
    // Roast frequent chatters
    if (userProfile.messageCount > 50) {
      responses.push(`${username} lives in this chat I swear`);
      responses.push(`${username} you ever take a break lmao`);
    }
    
    return responses;
  }

  /**
   * Get random conversation responses
   */
  getRandomResponses() {
    // Always attempt to generate a fresh line using AI if method exists
    if (this.ai && this.ai.enabled && typeof this.ai.generateFreshLine === 'function') {
      try {
        const prompt = 'Generate a fresh, unique, funny, and context-aware chat line for Coolhole.org.';
        const aiLine = this.ai.generateFreshLine(prompt);
        if (aiLine && typeof aiLine === 'string' && aiLine.trim().length > 0) {
          return [aiLine];
        }
      } catch (err) {
        logger.error('AI generateFreshLine failed:', err.message);
      }
    }

    // Fallback: Use random casual responses
    const fallbackResponses = [
      'just vibing',
      'chat looking good today',
      'what are we watching next?',
      'this is actually pretty chill',
      'anyone got recommendations?'
    ];
    return [fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]];
  }

  /**
   * Reflect on own messages for self-awareness
   */
  reflectOnOwnMessage(actualText) {
    try {
      // Compare intended message with what actually appeared
      if (this.lastIntendedMessage && actualText) {
        const matched = this.lastIntendedMessage === actualText;
        logger.info(`🪞 Self-check: Message ${matched ? 'matched' : 'modified'}`);
        // Use meta-awareness to reflect, only if function exists
        if (this.metaAwareness && typeof this.metaAwareness.observeSelf === 'function') {
          this.metaAwareness.observeSelf(actualText, matched);
        }
      }
    } catch (error) {
      logger.error(`❌ Error in reflectOnOwnMessage: ${error.message}`);
    }
  }

  varyResponse(response, category) {
    if (category === 'short') {
      const parts = response.split(/[\.\!\?\n]/).map(s => s.trim()).filter(Boolean);
      let candidate = parts.length ? parts[0] : response;
      if (candidate.split(' ').length > 8) {
        candidate = candidate.split(' ').slice(0, 6).join(' ');
        if (!/[\.\!\?]$/.test(candidate)) candidate += '...';
      }
      // Rarely add a Coolhole emote (5% chance, only for short responses)
      if (Math.random() < 0.05 && this.coolholeExplorer?.features?.emotes?.length > 0) {
        const emote = this.getAppropriateEmote(candidate);
        if (emote) return `${candidate} ${emote}`;
      }
      return candidate;
    }
    if (category === 'medium') {
      if (Math.random() < 0.15) {
        return `${response} ${this.getRandomFollowup()}`;
      }
      return response;
    }
    if (category === 'long') {
      let extended = response;
      if (Math.random() < 0.6) {
        extended = `${response} ${this.getRandomFollowup()} ${this.getRandomFollowup()}`;
      } else {
        extended = `${response} ${this.getRandomFollowup()}`;
      }
      return extended;
    }
    return response;
  }

  /**
   * Get an appropriate Coolhole emote based on context
   * Some emotes need slashes (/emote), others activate just by typing the word
   */
  getAppropriateEmote(text) {
    // Coolhole emotes - some need /, some are just words
    const coolholeEmotes = {
      // Text-based emotes (no slash needed)
      laugh: [
        { text: 'lol', needsSlash: false },
        { text: 'hahaha', needsSlash: true },
        { text: 'pleaselaugh', needsSlash: true }
      ],
      hype: [
        { text: 'sickkk', needsSlash: true },
        { text: 'cool', needsSlash: false },
        { text: 'hellacool', needsSlash: true }
      ],
      negative: [
        { text: 'itsover', needsSlash: true },
        { text: 'died', needsSlash: true },
        { text: 'dead', needsSlash: true },
        { text: 'noooo', needsSlash: true }
      ],
      agreement: [
        { text: 'real', needsSlash: true },
        { text: 'genius', needsSlash: true },
        { text: 'enlightened', needsSlash: true }
      ],
      sarcasm: [
        { text: 'cope', needsSlash: true },
        { text: 'yablewit', needsSlash: true },
        { text: 'ya blew it', needsSlash: false }
      ],
      random: [
        { text: 'clap', needsSlash: true },
        { text: 'bop', needsSlash: true },
        { text: 'fire', needsSlash: true },
        { text: 'beep', needsSlash: true }
      ]
    };
    
    const lowerText = text.toLowerCase();
    
    // Context-based emote selection
    if (lowerText.includes('lol') || lowerText.includes('haha') || lowerText.includes('funny') || lowerText.includes('laugh')) {
      const emote = coolholeEmotes.laugh[Math.floor(Math.random() * coolholeEmotes.laugh.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    if (lowerText.includes('sick') || lowerText.includes('nice') || lowerText.includes('cool') || lowerText.includes('great')) {
      const emote = coolholeEmotes.hype[Math.floor(Math.random() * coolholeEmotes.hype.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    if (lowerText.includes('sad') || lowerText.includes('rip') || lowerText.includes('over') || lowerText.includes('dead')) {
      const emote = coolholeEmotes.negative[Math.floor(Math.random() * coolholeEmotes.negative.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    if (lowerText.includes('yeah') || lowerText.includes('true') || lowerText.includes('exactly') || lowerText.includes('fr')) {
      const emote = coolholeEmotes.agreement[Math.floor(Math.random() * coolholeEmotes.agreement.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    if (lowerText.includes('cope') || lowerText.includes('blew') || lowerText.includes('wrong')) {
      const emote = coolholeEmotes.sarcasm[Math.floor(Math.random() * coolholeEmotes.sarcasm.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    // Very rarely (10% of the time we even try) use a random safe emote
    if (Math.random() < 0.1) {
      const emote = coolholeEmotes.random[Math.floor(Math.random() * coolholeEmotes.random.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    return null;
  }

  getRandomFollowup() {
    const followups = [
      "also, just saying",
      "not gonna lie"
      // ...other followups...
    ];
    return followups[Math.floor(Math.random() * followups.length)];
  }

  // --- All following methods are inside the ChatBot class ---
  adaptPersonality(originalMessage, response) {
    // Slightly adjust personality based on successful interactions
    if (Math.random() < 0.1) { // 10% chance to adapt
      if (originalMessage.isQuestion && response.includes('?')) {
        this.personality.curiosity = Math.min(1, this.personality.curiosity + 0.01);
      }
      if (originalMessage.sentiment === 'positive') {
        this.personality.friendliness = Math.min(1, this.personality.friendliness + 0.005);
      }
    }
  }

  getChatStatistics() {
    const topTopics = Array.from(this.chatStats.topicsDiscussed.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalMessages: this.chatStats.totalMessages,
      messagesSent: this.chatStats.messagesSent,
      questionsAsked: this.chatStats.questionsAsked,
      usersTracked: this.userProfiles.size,
      topicsLearned: this.chatStats.topicsDiscussed.size,
      activeUsers: this.chatStats.activeUsers.size,
      topChatters: Array.from(this.chatStats.messagesByUser.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([username, count]) => ({ username, count })),
      topTopics: topTopics.map(([topic, count]) => ({ topic, count })),
      vocabularySize: this.vocabulary.size,
      learnedUsers: this.userProfiles.size,
      personality: this.personality
    };
  }

  getConversationContext(limit = 15) {
    return this.conversationContext.slice(-limit);
  }

  getUserProfile(username) {
    return this.userProfiles.get(username) || null;
  }

  getAllUserProfiles() {
    return Array.from(this.userProfiles.values()).map(profile => ({
      username: profile.username,
      friendship: profile.friendship,
      messageCount: profile.messageCount,
      lastMood: profile.lastMood,
      isRival: profile.isRival,
      topics: profile.topics || []
    }));
  }

  getAllRelationships() {
    const relationshipMap = {};
    this.userProfiles.forEach((profile, username) => {
      if (profile.relationships && profile.relationships.length > 0) {
        relationshipMap[username] = profile.relationships.map(rel => ({
          user: rel.user,
          strength: rel.strength,
          interactions: rel.interactions
        }));
      }
    });
    return relationshipMap;
  }

  getCurrentPersonality() {
    return {
      happiness: this.personality.happiness || 'Unknown',
      energy: this.personality.energy || 'Unknown',
      confidence: this.personality.confidence || 'Unknown',
      social: this.personality.social || 'Unknown',
      currentMood: this.personality.currentMood || 'vibing'
    };
  }

  getPersonalityState() {
    const vocabularySize = this.vocabulary ? this.vocabulary.size : 0;
    const knownUsers = this.userProfiles ? this.userProfiles.size : 0;
    const conversationPatterns = this.responsePatterns ? this.responsePatterns.size : 0;
    const totalLearningPoints = Array.isArray(this.chatHistory) ? this.chatHistory.length : 0;
    const evolutionHistory = this.personalityEvolution?.evolutionHistory || [];
    if (!this.vocabulary) logger.error('getPersonalityState: vocabulary is undefined');
    if (!this.userProfiles) logger.error('getPersonalityState: userProfiles is undefined');
    if (!this.responsePatterns) logger.error('getPersonalityState: responsePatterns is undefined');
    if (!Array.isArray(this.chatHistory)) logger.error('getPersonalityState: chatHistory is not an array');
    return {
      ...this.personality,
      vocabularySize,
      knownUsers,
      conversationPatterns,
      totalLearningPoints,
      evolutionHistory
    };
  }

  /**
   * Get trending topics from recent conversations
   */
  getTrendingTopics(limit = 10) {
    return Array.from(this.chatStats.topicsDiscussed.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }));
  }

  /**
   * Send message to CyTube channel with natural timing
   */
  async sendMessage(message, meta = {}) {
    try {
      logger.info(`[Slunt] Preparing to send message: ${message}`);
      
      // Check if Slunt should use a Coolhole trick instead
      const recentMessages = this.conversationContext.slice(-5);
      const emotion = this.emotionalEngine ? this.emotionalEngine.detectEmotion(message, 'Slunt').primary : 'neutral';
      const context = meta.context || [];
      
      const trickName = this.coolholeTricks ? this.coolholeTricks.shouldUseTrick(context, emotion, recentMessages) : null;
      if (trickName) {
        const trickCommand = this.coolholeTricks.useTrick(trickName);
        logger.info(`[${getTimestamp()}] 🎭 Using Coolhole trick: ${trickName}`);
        // Send the trick command instead of regular message
        message = trickCommand;
      }
      
      // === NEW: Add drunk typos if drunk (REDUCED - less aggressive) ===
      let processedMessage = message;
      if (this.drunkMode && this.drunkMode.isDrunk && Math.random() < 0.3) {
        processedMessage = this.drunkMode.addTypos(processedMessage);
      }
      // Add umbra brag if available (REDUCED - less frequent and more natural)
      const brag = await this.umbraProtocol.getBrag();
      if (brag && Math.random() < 0.2 && processedMessage.length < 100) {
        processedMessage = `${processedMessage}. ${brag}`;
      }
      
      // === NEW: Maybe add Hipster mention (REDUCED - only if message is long enough and not too cluttered) ===
      const hipsterMention = await this.hipsterProtocol.getMention();
      if (hipsterMention && processedMessage.length < 100 && !processedMessage.includes('.') && Math.random() < 0.3) {
        processedMessage = `${processedMessage}. ${hipsterMention}`;
      }
      
      // Apply learned style to make message more natural (but don't over-style)
      let styledMessage = processedMessage;
      // Only apply style mimicry if message is natural conversation, not commands/tricks
      if (!trickName && this.styleMimicry) {
        styledMessage = this.styleMimicry.styleMessage(processedMessage);
        // If style mimicry made it too different or weird, use original
        if (styledMessage.length > processedMessage.length * 1.5 || styledMessage.length < processedMessage.length * 0.5) {
          styledMessage = processedMessage;
        }
      }
      
      // === INSTANT SEND - NO TYPING DELAY ===
      // Typing simulation removed for instant responses
      
      // === NOW SEND MESSAGE ===
      
      // Track what we intended to send for self-reflection
      this.lastIntendedMessage = {
        intended: message,
        styled: styledMessage,
        timestamp: Date.now()
      };
      
      const ready = (typeof this.coolhole.isChatReady === 'function') ? this.coolhole.isChatReady() : this.coolhole.isConnected();
      if (ready) {
        const sendResult = await this.coolhole.sendChat(styledMessage, meta);
        if (sendResult === false) {
          logger.error(`[${getTimestamp()}] ❌ Message failed to send: ${styledMessage}`);
        } else {
          logger.info(`[${getTimestamp()}] ✅ Message sent: ${styledMessage}`);
          // Track for deduplication
          this.trackResponse(styledMessage);
        }
      } else {
        logger.warn(`[${getTimestamp()}] ⚠️ Chat not ready, skipping message: ${styledMessage}`);
      }

      logger.info(`[${getTimestamp()}] [🤖 Slunt] ${styledMessage}`);
      this.lastSentAt = Date.now();

      // Track stats
      try {
        this.chatStats.messagesSent++;
        // NEW: If commenting about current video, record it
        const currentVideo = this.videoManager.getCurrentVideo();
        if (currentVideo && message.length > 20) { // Substantial comment
          const sentiment = this.detectSentiment(message);
          this.videoLearning.recordSluntReaction(
            currentVideo.videoId, 
            currentVideo.title, 
            message, 
            sentiment
          );
          this.videoLearning.addVideoComment(
            currentVideo.videoId, 
            currentVideo.title, 
            styledMessage
          );
          // NEW: Track video quality for mood
          this.moodTracker.trackVideoQuality(sentiment);
        }
        // Detect if this was a successful roast/dunk
        const recentContext = this.conversationContext.slice(-3);
        const lastUser = recentContext.length > 0 ? recentContext[recentContext.length - 1].username : null;
        if (lastUser && lastUser !== 'Slunt') {
          const isVictory = this.victoryCelebration.detectVictory(styledMessage, lastUser);
          if (isVictory && this.victoryCelebration.shouldCelebrate()) {
            // Trigger proud mood
            this.moodTracker.adjustMood('proud', 0.3);
          }
        }

        // Emit event for dashboard
        this.emit('message:sent', { message: styledMessage, timestamp: Date.now() });
        // Track if we asked a question
        if (styledMessage.includes('?')) {
          this.chatStats.questionsAsked++;
          this.pendingQuestions.push({
            question: styledMessage,
            askedAt: Date.now()
          });
          this.lastQuestionTime = Date.now();
          // Keep only last 3 questions
          if (this.pendingQuestions.length > 3) {
            this.pendingQuestions.shift();
          }
          logger.info(`[${getTimestamp()}] ❓ Asked question, waiting for responses...`);
        }
        // Log our own message for learning context
        this.conversationContext.push({
          username: 'Slunt',
          text: styledMessage,
          timestamp: Date.now(),
          topics: this.extractTopics(styledMessage),
          sentiment: this.analyzeSentiment(styledMessage),
          isQuestion: styledMessage.includes('?'),
          mentionsBot: false
        });
      } catch (statsError) {
        logger.error(`[${getTimestamp()}] ❌ Error tracking stats: ${statsError.message}`);
      }
    } catch (error) {
      logger.error(`[${getTimestamp()}] ❌ Error in sendMessage: ${error.message}`);
    }
  }

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
  startAdvancedSystems() {
    try {
      logger.info('🚀 [Advanced] Starting all advanced systems...');
      
      // Start video discovery system
      if (this.videoDiscovery) {
        this.videoDiscovery.start();
        logger.info('🎬 [Advanced] Video discovery started');
      }
      
      // ...existing code...
    } catch (error) {
      console.error('❌ [Advanced] Error starting systems:', error.message);
    }
  }

  /**
   * Extract mentioned usernames from text
   */
  extractMentionedUsers(text) {
    try {
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
    } catch (e) {
      return [];
    }
  }

  /**
   * Get stats for all advanced systems
   */
  getAdvancedStats() {
    try {
      return {
        emotional: this.emotionalEngine?.emotionalMemory?.size ?? null,
        proactive: this.proactiveFriendship?.getStats ? this.proactiveFriendship.getStats() : null,
        memory: this.memoryConsolidation?.getStats ? this.memoryConsolidation.getStats() : null,
        video: this.videoLearning?.getStats ? this.videoLearning.getStats() : null,
        personality: this.personalityEvolution?.getStats ? this.personalityEvolution.getStats() : null,
        social: this.socialAwareness?.getStats ? this.socialAwareness.getStats() : null,
        relationships: this.relationshipMapping?.getStats ? this.relationshipMapping.getStats() : null,
        mentalState: this.mentalStateTracker?.getStats ? this.mentalStateTracker.getStats() : null, // Depression, anxiety, etc
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
    } catch (e) {
      return {};
    }
  }
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

  /**
   * Extract topics from text (stub implementation)
   */
  extractTopics(text) {
    try {
      const words = text.toLowerCase().split(/\s+/);
      const topics = [];
      // Extract hashtags and keywords
      words.forEach(word => {
        if (word.startsWith('#') || word.length > 6) {
          topics.push(word.replace(/[^a-z0-9]/g, ''));
        }
      });
      return topics.slice(0, 5);
    } catch (e) {
      return [];
    }
  }

  /**
   * Track events related to Slunt (stub implementation)
   */
  trackSluntEvent(type, data) {
    try {
      const event = {
        type,
        data,
        timestamp: Date.now()
      };
      this.sluntEventLog.push(event);
      // Keep only last 100 events
      if (this.sluntEventLog.length > 100) {
        this.sluntEventLog.shift();
      }
      logger.info(`📊 [Slunt Event] ${type}: ${JSON.stringify(data)}`);
    } catch (e) {
      logger.error('Error tracking Slunt event:', e.message);
    }
  }
}
module.exports = ChatBot;