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
  this.coolhole = coolhole
    this.videoManager = videoManager;
    this.coolPointsHandler = new CoolPointsHandler();
    this.emotionalEngine = new EmotionalEngine();
    this.youtubeSearch = new YouTubeSearch();
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
    setTimeout(() => {
      this.startupSequence();
    }, 1000);
  }

  /**
   * Run startup checks and greet on bot launch
   */
  async startupSequence() {
    logger.info('[Startup] Running startup sequence...');
    try {
      await this.sendMessage('Hello! Slunt is online and ready to serve.');
      await this.sendMessage('Running system checks...');
      // Add any additional checks here
      logger.info('[Startup] Startup checks complete.');
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
      logger.info(`🎯 ChatBot received chat event from ${data.username}: ${data.text.substring(0, 50)}`);
      // Emit event for dashboard
      this.emit('message:received', {
        username: data.username,
        message: data.text,
        timestamp: Date.now()
      });
      this.learnFromMessage(data);
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
    });

    // NEW: Self-reflection - compare what we intended vs what actually appeared
    this.coolhole.on('self-reflection', (data) => {
      logger.info(`🪞 Self-reflection: Analyzing own message...`);
      this.reflectOnOwnMessage(data.actualText);
    });

    this.coolhole.on('userJoin', (data) => {
      logger.info(`User joined: ${data.username}`);
      this.chatStats.activeUsers.add(data.username);
      // Always greet new users and log
      logger.info(`[Greeting] Greeting new user: ${data.username}`);
      setTimeout(() => {
        this.sendMessage(`Welcome ${data.username}! 👋`);
      }, 1200);
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
      topics,
      sentiment,
      isQuestion: text.includes('?'),
      mentionsBot: this.checkBotMention(text)
    };
    
    this.chatHistory.push(messageData);
    if (this.chatHistory.length > 200) {
      this.chatHistory.shift();
    }

    // Learn about this user
    this.learnAboutUser(username, text);
    
    // === BATCH ALL TRACKING (parallel operations) ===
    this.nicknameManager.trackUserBehavior(username, text);
    this.nicknameManager.trackJoke(text, username);
    this.styleMimicry.learnFromMessage(text, username);
    this.personalityEvolution.adjustFromMessage(username, text, sentiment);
    
    // === MENTAL STATE TRACKING (depression, adrenochrome) ===
    const isPositive = sentiment > 0 || text.match(/\b(love|thanks|good|great|awesome|nice)\b/i);
    this.mentalState.trackInteraction(username, text, isPositive);
    
    // === NEW PSYCHOLOGICAL DEPTH SYSTEMS ===
    
    // 1. Memory Decay - Store this interaction in decaying memory
    this.memoryDecay.storeMemory(text, username, topics);
    
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
    
    // === NEW PERSONALITY PROTOCOLS ===
    
    // Check autism fixation triggers
    this.autismFixations.checkTriggers(text);
    
    // Check Umbra Protocol triggers
    this.umbraProtocol.checkTrigger(text);
    
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
    
    // === SOCIAL & CONTEXTUAL (only if needed) ===
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
    
    // === NEW: RELATIONSHIP MAPPING ===
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
    
    // Learn conversation patterns
    this.learnConversationPattern(messageData);
    
    // Track user interactions and relationships
    this.trackUserInteractions(username, messageData);
    
    // Analyze time patterns
    this.trackTimePatterns(username, timestamp || Date.now());
    
    // Update vocabulary
    this.expandVocabulary(text);
    
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

    if (Math.random() < 0.03) {
      const topic = (data.topics && data.topics[0]) || 'chat';
      const rumor = this.rumorMill.spreadRumor(data.username, topic);
      this.sluntDiary.addEntry(rumor, 'rumor', true);
      this.sendMessage(rumor);
    }

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
    if (lowerText.match(/food|eat|recipe|cook/)) topics.push('food');
    if (lowerText.match(/tech|computer|code|program/)) topics.push('technology');
    if (lowerText.match(/art|draw|paint|create/)) topics.push('art');
    if (lowerText.match(/sport|football|basketball|soccer/)) topics.push('sports');
    
    return topics;
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
   * Consider whether to respond to a message and generate response
   */
  async considerResponse(data) {
    const { username, text } = data;
    
    // Skip own messages
    if (username === 'Slunt') return;
    
    const shouldRespond = this.shouldRespond(data);
    
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
        }
      }, delay);
    }
  }

  /**
   * Decide whether bot should respond to this message
   */
  shouldRespond(data) {
    const { username, text } = data;
    
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
    
    // More likely to respond to questions
    if (text.includes('?')) {
  logger.info(`[${getTimestamp()}] 💬 Responding to question from ${username}`);
      return Math.random() < 0.8; // 80% chance to respond to questions
    }
    
    // More likely to respond to users we know
    const userProfile = this.userProfiles.get(username);
    if (userProfile && userProfile.messageCount > 5) {
      return Math.random() < this.personality.chattiness * 1.3;
    }
    
    // Respond to interesting topics
    const topics = this.extractTopics(text);
    if (topics.length > 0) {
  logger.info(`[${getTimestamp()}] 💬 Responding to topic discussion from ${username}: ${topics.join(', ')}`);
      return Math.random() < this.personality.curiosity * 0.6;
    }
    
    // Random conversation starter
    return Math.random() < this.personality.chattiness * 0.5;
  }

  /**
   * Generate contextual response to a message
   */
  async generateResponse(data) {
    const { username, text } = data;
    
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
    
    // TRY AI FIRST if enabled
    try {
      if (this.ai && this.ai.enabled) {
        // Get current video context
        const videoContext = this.videoManager ? this.videoManager.getCurrentVideo() : null;
        
        // NEW: Get Slunt's past video reactions
        let videoMemoryContext = null;
        if (videoContext && this.videoLearning) {
          const contentType = this.videoLearning.detectContentType(videoContext.title);
          const pastOpinion = this.videoLearning.getSimilarVideoOpinion(contentType);
          const hasCommented = this.videoLearning.hasCommentedOn(videoContext.videoId);
          
          videoMemoryContext = {
            hasCommentedOnThis: hasCommented,
            pastOpinion: pastOpinion,
            contentType: contentType
          };
        }
        
        // NEW: Get nickname context
        const nicknameContext = this.nicknameManager.getNicknameContext();
        const insideJokeContext = this.nicknameManager.getInsideJokeContext();
        
        // NEW: Get mood context
        const moodContext = this.moodTracker.getMoodContext();
        const moodModifier = this.moodTracker.getMoodModifier();
        
        // NEW: Get mental state (depression, etc)
        const mentalStateContext = this.mentalState.getContextForAI();
        
        // NEW: Get contextual awareness (must be before allModifiers)
        const contextualHint = this.contextualAwareness.getContext();
        
        // NEW: Get all psychological depth contexts
        const memoryContext = this.memoryDecay.getContext();
        const obsessionContext = this.obsessionSystem.getContext();
        const grudgeContext = this.grudgeSystem.getContext(username);
        const drunkContext = this.drunkMode.getContext();
        const userTheoryOfMind = this.theoryOfMind.getUserContext(username);
        
        // NEW: Get personality protocol contexts
        const autismContext = this.autismFixations.getContext();
        const umbraContext = this.umbraProtocol.getContext();
        const hipsterContext = this.hipsterProtocol.getContext();
        
        // NEW: Get Top 5 Priority system contexts
        const metaAwarenessContext = this.metaAwareness.getContext();
        const callbackContext = this.contextualCallbacks.getContext(username, text);
        const personalityModeContext = this.personalityModes.getContext();
        const currentEmotion = emotion.primary || 'neutral';
        const emotionTimingContext = this.emotionTiming.getContext(currentEmotion);
        
        // NEW: Get startup continuity context (only for first few messages)
        const startupContext = this.startupContinuity.getStartupContext(this.chatStats.sluntMessageCount || 0);
        
        // Combine all modifiers
        const allModifiers = moodContext + contextualHint + mentalStateContext + 
                           memoryContext + obsessionContext + grudgeContext + drunkContext + userTheoryOfMind +
                           autismContext + umbraContext + hipsterContext +
                           metaAwarenessContext + callbackContext + personalityModeContext + emotionTimingContext +
                           startupContext;
        

        const aiResponse = await this.ai.generateResponse(
          text, 
          username
        );

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
        // Select response based on personality
        let baseResponse = this.selectBestResponse(responses, data);
        // Determine emotion for length decision (use existing emotion if available)
        const genEmotion = (typeof emotion !== 'undefined')
          ? emotion
          : (this.emotionalEngine ? this.emotionalEngine.detectEmotion(data.text, data.username) : { primary: 'neutral', intensity: 0.5 });
        const lengthCat = this.chooseResponseLength(genEmotion, data.username);
        // Vary response length and flow
        let finalResponse = this.varyResponse(baseResponse, lengthCat);
        // Avoid repeating recent responses - try a few alternatives if too similar
        let attempts = 0;
        while (this.responseVariety && this.responseVariety.isTooSimilar(finalResponse) && attempts < 3) {
          attempts++;
          // pick another candidate if available
          const alt = responses[Math.floor(Math.random() * responses.length)];
          finalResponse = this.varyResponse(alt, lengthCat);
        }
        // Track response for variety system
        try { this.responseVariety && this.responseVariety.trackResponse(finalResponse); } catch (e) { /* ignore */ }
        return finalResponse;
      }
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
      responses.push(`💀💀�`);
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
    return [
      'so what are we doing now?',
      'chat kinda dead, someone say something',
      'anyone got good video recs?',
      'I need some new music fr',
      'who here actually has taste?',
      'alright, someone start a debate',
      'I bet nobody can top my queue',
      'yall ever just vibe?',
      'this chat needs more energy',
      'someone drop a hot take',
      'I need drama, someone start something',
      'who wants to play a game?',
      'alright, time for some chaos',
      'I dare someone to queue something cursed',
      'who here is actually awake?'
    ];
  }

  /**
   * Select the best response based on personality and context
   */
  selectBestResponse(responses, data) {
    if (responses.length === 0) return null;
    // Weight responses based on personality
    let selectedResponse;
    if (this.checkBotMention(data.text)) {
      // Prefer direct responses when mentioned
      const directResponses = responses.filter(r => 
        r.includes('Yeah') || r.includes('What') || r.includes('I')
      );
      selectedResponse = directResponses.length > 0 ? 
        directResponses[Math.floor(Math.random() * directResponses.length)] :
        responses[Math.floor(Math.random() * responses.length)];
    } else {
      // Random selection with personality influence
      selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    }
    return selectedResponse;
  }

  varyResponse(response, category) {
    if (category === 'short') {
      const parts = response.split(/[\.\!\?\n]/).map(s => s.trim()).filter(Boolean);
      let candidate = parts.length ? parts[0] : response;
      if (candidate.split(' ').length > 8) {
        candidate = candidate.split(' ').slice(0, 6).join(' ');
        if (!/[\.\!\?]$/.test(candidate)) candidate += '...';
      }
      if (Math.random() < 0.08) {
        const emojis = ['👌','💀','😂','fr','based','no cap','fr?'];
        return emojis[Math.floor(Math.random()*emojis.length)];
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
      // === NEW: Add drunk typos if drunk ===
      let processedMessage = message;
      if (this.drunkMode && this.drunkMode.isDrunk) {
        processedMessage = this.drunkMode.addTypos(processedMessage);
      }
      // Add umbra brag if available
      const brag = this.umbraProtocol.getBrag();
      if (brag) {
        processedMessage = Math.random() < 0.5
          ? `${processedMessage}. ${brag} btw`
          : `${processedMessage}, ${brag}`;
      }
      
      // === NEW: Maybe add Hipster mention ===
      const hipsterMention = this.hipsterProtocol.getMention();
      if (hipsterMention) {
        processedMessage = Math.random() < 0.5
          ? `${processedMessage}. ${hipsterMention}`
          : `${hipsterMention}. ${processedMessage}`;
      }
      
      // Apply learned style to make message more natural
      const styledMessage = this.styleMimicry.styleMessage(processedMessage);
      
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
        this.coolhole.sendChat(styledMessage, meta);
      } else {
        logger.warn(`[${getTimestamp()}] ⚠️ Chat not ready, skipping message: ${styledMessage}`);
      }
      
  logger.info(`[${getTimestamp()}] [🤖 Slunt] ${styledMessage}`);
      this.lastSentAt = Date.now();
      
      // Track stats
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
    } catch (e) {
      logger.error('Error in sendMessage:', e.message);
    }
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
      // User profiles with interesting observations
      const userNotes = Array.from(this.userProfiles.entries())
        .filter(([, profile]) => profile.messageCount > 5)
        .sort(([, a], [, b]) => b.messageCount - a.messageCount)
        .slice(0, 30)
        .map(([username, profile]) => {
          // Get top topics for this user
          const topTopics = Array.from(profile.topics.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([topic]) => topic);
          
          // Get top words they use
          const topWords = Array.from(profile.commonWords.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([word]) => word);
          
          // Calculate activity recency
          const hoursSinceLastSeen = Math.round((Date.now() - profile.lastSeen) / (1000 * 60 * 60));
          const activityStatus = hoursSinceLastSeen < 1 ? 'Just active' :
                                hoursSinceLastSeen < 24 ? `${hoursSinceLastSeen}h ago` :
                                `${Math.round(hoursSinceLastSeen / 24)}d ago`;
          
          return {
            username,
            messageCount: profile.messageCount,
            conversationStyle: profile.conversationStyle,
            avgMessageLength: Math.round(profile.averageMessageLength),
            lastSeen: activityStatus,
            topInterests: topTopics,
            commonWords: topWords,
            timesSeen: profile.timesSeen
          };
        });
      
      // Community patterns
      const communityPatterns = {
        popularTimes: Array.from(this.communityInsights.popularTimes.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8)
          .map(([hour, count]) => ({ hour: `${hour}:00`, activity: count })),
        
        recentConversationStarters: this.communityInsights.conversationStarters
          .slice(-15)
          .map(starter => ({
            user: starter.user,
            message: starter.message.substring(0, 100),
            timestamp: new Date(starter.timestamp).toLocaleTimeString()
          })),
        
        userInteractions: Array.from(this.interactionGraph.entries())
          .map(([user, connections]) => ({
            user,
            interactsWith: Array.from(connections.entries())
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([other, count]) => ({ user: other, times: count }))
          }))
          .filter(u => u.interactsWith.length > 0)
          .slice(0, 15)
      };
      
      // Topic insights
      const topicInsights = Array.from(this.topicPatterns.entries())
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 20)
        .map(([topic, data]) => ({
          topic,
          mentions: data.count,
          uniqueUsers: data.users ? data.users.size : 0,
          lastDiscussed: new Date(data.lastSeen).toLocaleString()
        }));
      
      // Recent conversation context
      const recentContext = this.conversationContext.slice(-20).map(msg => ({
        user: msg.username,
        message: msg.text.substring(0, 150),
        timestamp: new Date(msg.timestamp).toLocaleTimeString()
      }));
      
      return {
        userNotes,
        communityPatterns,
        topicInsights,
        recentContext,
        totalUsersObserved: this.userProfiles.size,
        totalMessagesLearned: this.chatHistory.length,
        vocabularySize: this.vocabulary.size,
        sluntPersonality: this.personality
      };
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
      const dir = path.dirname(this.memoryPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const timestamp = new Date().toISOString();
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
      fs.writeFileSync(this.memoryPath, JSON.stringify(obj, null, 2));
      return true;
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
} // End of ChatBot class

module.exports = ChatBot;