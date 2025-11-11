/**
 * Slunt Beta - Minimal Chatbot
 *
 * PHILOSOPHY: Less is more. Start from zero, add only what's proven necessary.
 *
 * This version ONLY:
 * - Listens to chat
 * - Sends last 5 messages to Ollama
 * - Returns response
 * - Handles basic commands
 *
 * NO personality systems, NO learning, NO complexity.
 * Just real conversation.
 */

const EventEmitter = require('events');
const OpenAI = require('openai');
const logger = require('./logger');
const CoolPointsHandler = require('./coolPointsHandler');
const CommandParser = require('./CommandParser');
const BetaAnalytics = require('../monitoring/BetaAnalytics');
const InnerAI = require('../monitoring/innerAI');
const MemoryCore = require('../core/memoryCore');
const HierarchicalMemory = require('../core/HierarchicalMemory');
const TwitchEmoteManager = require('../twitch/TwitchEmoteManager');
const VisionAnalyzer = require('../vision/visionAnalyzer');
const YouTubeSearch = require('../video/youtubeSearch');
const VideoDiscovery = require('../ai/VideoDiscovery');
const browserSearch = require('./browserSearch');

// Alpha's proven stability systems
const errorRecovery = require('../stability/ErrorRecovery'); // singleton
const ResponseQueue = require('../stability/ResponseQueue'); // class
const dbSafety = require('../stability/DatabaseSafety'); // singleton

// === ALPHA AI SYSTEMS - Full personality restoration ===
const StateTracker = require('../ai/StateTracker');
const GrudgeSystem = require('../ai/GrudgeSystem');
const ObsessionSystem = require('../ai/ObsessionSystem');
const NicknameManager = require('../ai/NicknameManager');
const PersonalityEvolution = require('../ai/PersonalityEvolution');
const RelationshipMapping = require('../ai/RelationshipMapping');
const DrunkMode = require('../ai/DrunkMode');
const AutismFixations = require('../ai/AutismFixations');
const UserReputationSystem = require('../ai/UserReputationSystem');
const ContextualCallbacks = require('../ai/ContextualCallbacks');
const InnerMonologue = require('../ai/InnerMonologue');
const ChatLearning = require('../ai/ChatLearning');
const SentimentAnalyzer = require('../ai/SentimentAnalyzer');

class ChatBotBeta extends EventEmitter {
  constructor(coolholeClient = null, videoManager = null) {
    super();

    // Platform clients (matches Alpha signature)
    this.coolholeClient = coolholeClient;
    this.videoManager = videoManager;

    // Platform references (set by server.js)
    this.discordClient = null;
    this.twitchClient = null;
    this.platformManager = null;

    // Essential systems only
    this.coolPointsHandler = new CoolPointsHandler();
    this.commandParser = new CommandParser({
      coolPoints: this.coolPointsHandler,
      botName: 'Slunt'
    });

    // AI - Grok via xAI (unrestricted, edgy personality)
    this.grok = new OpenAI({
      apiKey: process.env.XAI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: 'https://api.x.ai/v1'
    });
    this.model = 'grok-4-fast-reasoning'; // Latest fast model with 2M context

    // Simple conversation memory (last 5 messages per channel)
    this.recentMessages = new Map(); // channelId -> [{username, text, timestamp}]
    this.maxRecentMessages = 5;

    // Rate limiting (prevent spam)
    this.lastResponseTime = 0;
    this.minResponseInterval = 1500; // 1.5 seconds between responses

    // Track who we last responded to (hit your target and move on)
    this.lastRespondedTo = new Map(); // username -> timestamp

    // Response probability
    this.baseResponseChance = 0.4; // 40% chance to respond to normal messages

    // Analytics - track everything for improvement
    this.analytics = new BetaAnalytics();
    this.analytics.startPeriodicSave();

    // Memory & Emotes (from Alpha)
    this.memory = new MemoryCore();
    this.hierarchicalMemory = new HierarchicalMemory(this.grok); // NEW: 3-tier memory system
    this.emotes = new TwitchEmoteManager(process.env.TWITCH_CHANNELS?.split(',')[0] || 'broteam');
    this.recentResponses = new Map(); // Track last responses per channel to avoid repetition
    this.vision = null; // Will be initialized when Coolhole connects
    this.twitchVision = null; // Vision for Twitch stream
    this.twitchStreamPage = null; // Browser page watching Twitch stream
    this.youtubeSearch = null; // YouTube search for Coolhole
    this.videoDiscovery = null; // Proactive video finding

    // DM/PM tracking
    this.lastDMTime = new Map(); // userId -> timestamp (prevent DM spam)
    this.dmCooldown = 300000; // 5 minutes between DMs to same user

    // Reaction tracking (Discord only)
    this.lastReactionComment = new Map(); // messageId -> timestamp (don't spam reaction comments)
    this.reactionCooldown = 300000; // 5 minutes between reaction comments
    this.lastReactionGiven = 0; // Last time we gave a reaction
    this.reactionGiveCooldown = 120000; // 2 minutes between giving reactions

    // Alpha's stability systems (battle-tested)
    this.errorRecovery = errorRecovery;
    this.errorRecovery.initialize(this);
    this.responseQueue = new ResponseQueue(); // instantiate the class
    this.dbSafety = dbSafety;

    // === ALPHA AI SYSTEMS - Initialize personality (deferred to avoid circular deps) ===
    this.alphaSystemsInitialized = false;

    logger.info('🤖 Slunt Beta + Alpha Systems loading...');
    logger.info('   AI: Grok (xAI) - Unrestricted & Edgy');
    logger.info('   Systems: FULL ALPHA (18 personality systems initializing)');
    logger.info('   Analytics: ENABLED (tracking all data)');
    logger.info('   Stability: ERROR RECOVERY + RESPONSE QUEUE + DB SAFETY');
    
    // Initialize async systems
    this.initializeAsync();
    
    // Setup Discord reaction handlers
    this.setupReactionHandlers();
  }

  /**
   * Setup Discord reaction handlers
   */
  setupReactionHandlers() {
    if (!this.discordClient) {
      // Will be set up when Discord client is attached
      setTimeout(() => this.setupReactionHandlers(), 2000);
      return;
    }

    const client = this.discordClient.client;
    if (!client) return;

    // When someone reacts to Slunt's message
    client.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot) return; // Ignore bot reactions
      
      try {
        // Fetch partial reactions
        if (reaction.partial) {
          await reaction.fetch();
        }
        if (reaction.message.partial) {
          await reaction.message.fetch();
        }

        // Check if it's Slunt's message
        if (reaction.message.author.id !== client.user.id) return;

        // Cooldown check
        const messageKey = reaction.message.id;
        const lastComment = this.lastReactionComment.get(messageKey);
        if (lastComment && Date.now() - lastComment < this.reactionCooldown) {
          return; // Don't spam
        }

        // 20% chance to comment on reactions to your message
        if (Math.random() < 0.20) {
          const emoji = reaction.emoji.name;
          const count = reaction.count;
          
          // Generate comment about the reaction
          const comment = await this.generateReactionComment(emoji, count, user.username);
          if (comment) {
            await reaction.message.reply(comment);
            this.lastReactionComment.set(messageKey, Date.now());
            logger.info(`😄 Commented on reaction: ${emoji} x${count}`);
          }
        }
      } catch (error) {
        logger.error(`❌ Reaction handler error: ${error.message}`);
      }
    });

    logger.info('👍 Discord reaction handlers enabled');
  }

  /**
   * Generate a comment about reactions to your message
   */
  async generateReactionComment(emoji, count, username) {
    try {
      const prompt = `Someone reacted to your message with ${emoji} (${count} total reactions). Make a SHORT (3-8 words) response. Be funny, cocky, or dismissive. Examples:
- "knew you'd love that"
- "yeah you better"
- "crying?"
- "that's what I thought"
- "exactly"

Response:`;

      const completion = await this.grok.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20,
        temperature: 1.3
      });

      let comment = completion.choices[0]?.message?.content?.trim() || null;
      if (comment) {
        comment = comment.replace(/^"|"$/g, '').trim();
      }
      
      return comment;
    } catch (error) {
      logger.error(`❌ Error generating reaction comment: ${error.message}`);
      return null;
    }
  }

  /**
   * Randomly give reactions to other people's messages
   * Call this after processing a message (low probability)
   */
  async maybeGiveReaction(rawMessage, platform) {
    if (platform !== 'discord' || !rawMessage) return;

    // Check cooldown
    if (Date.now() - this.lastReactionGiven < this.reactionGiveCooldown) {
      return;
    }

    // 5% chance to react to someone's message
    if (Math.random() > 0.05) return;

    try {
      // Pick a reaction based on message vibe
      const reactions = ['😂', '💀', '🤨', '👍', '🔥', '💯', '🗿', '🤡'];
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      
      await rawMessage.react(randomReaction);
      this.lastReactionGiven = Date.now();
      logger.info(`👍 Gave reaction: ${randomReaction}`);
    } catch (error) {
      // Silent fail - reactions aren't critical
    }
  }

  /**
   * Start watching videos and occasionally commenting on them
   */
  startVideoWatching() {
    // Check video every 45-90 seconds for potential commentary
    setInterval(async () => {
      try {
        if (!this.vision || !this.coolholeClient) return;
        
        // Very low chance (5%) to comment on video
        if (Math.random() > 0.05) return;
        
        const currentVideo = this.vision.insights.currentVideo;
        if (!currentVideo || !currentVideo.title) return;
        
        // Capture current frame for context
        const analysis = await this.vision.captureAndAnalyze();
        if (!analysis) return;
        
        // Ultra rare (10% of the 5%) - say "watch this part" like an annoying person
        const isWatchThisPart = Math.random() < 0.10;
        
        let commentary;
        if (isWatchThisPart) {
          // Annoying "watch this part" variants
          const variants = [
            "watch this part",
            "oh watch this",
            "wait watch this",
            "check this out",
            "this part's good",
            "oh this is the best part",
            "wait for it"
          ];
          commentary = variants[Math.floor(Math.random() * variants.length)];
        } else {
          // Normal video commentary - ask Grok to comment
          const prompt = `You're watching "${currentVideo.title}". The scene has brightness ${analysis.brightness}/255. Make a SHORT (3-8 words), natural observation or joke about what you're seeing. Be real, casual, maybe crude. NO zoomer slang.`;
          
          const response = await this.grok.chat.completions.create({
            model: this.model,
            messages: [
              { role: 'system', content: 'You are Slunt watching videos. Make brief, funny observations.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 30,
            temperature: 0.95
          });
          
          commentary = response.choices[0]?.message?.content?.trim();
        }
        
        if (commentary) {
          logger.info(`👁️ [VideoWatch] Commenting: ${commentary}`);
          this.sendMessageQueued(commentary, 'coolhole', 'default', { platform: 'coolhole' });
        }
      } catch (err) {
        // Silent fail - video watching is optional
        logger.debug(`⚠️ [VideoWatch] Error: ${err.message}`);
      }
    }, 60000 + Math.random() * 30000); // Every 60-90 seconds
  }

  /**
   * Initialize vision for Twitch stream
   */
  async initializeTwitchVision() {
    try {
      const channel = process.env.TWITCH_CHANNELS.split(',')[0];
      const puppeteer = require('puppeteer');
      
      logger.info(`👁️ [TwitchVision] Opening stream: https://www.twitch.tv/${channel}`);
      
      // Launch headless browser to watch stream
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=IsolateOrigins',
          '--disable-site-isolation-trials',
          '--mute-audio' // Don't play audio
        ]
      });
      
      this.twitchStreamPage = await browser.newPage();
      await this.twitchStreamPage.setViewport({ width: 1920, height: 1080 });
      
      // Navigate to stream
      await this.twitchStreamPage.goto(`https://www.twitch.tv/${channel}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Initialize vision analyzer for Twitch
      this.twitchVision = new VisionAnalyzer(this.twitchStreamPage);
      
      logger.info('👁️ [TwitchVision] Stream vision initialized');
      
      // Periodically capture stream for context (every 2 minutes)
      setInterval(async () => {
        try {
          if (this.twitchVision) {
            await this.twitchVision.captureAndAnalyze();
          }
        } catch (err) {
          logger.debug(`⚠️ [TwitchVision] Capture error: ${err.message}`);
        }
      }, 120000); // Every 2 minutes
      
    } catch (err) {
      logger.warn(`⚠️ [TwitchVision] Failed to initialize: ${err.message}`);
    }
  }

  async initializeAsync() {
    try {
      // Initialize memory with error handling
      try {
        await this.memory.initialize();
        this.memory.startAutoSave(); // Start auto-save
        logger.info('✅ [Memory] Memory system loaded and auto-save started');
      } catch (memErr) {
        logger.warn('⚠️ [Memory] Memory init failed (starting fresh):', memErr.message);
      }

      // Initialize hierarchical memory
      try {
        await this.hierarchicalMemory.load();
        this.hierarchicalMemory.startAutoConsolidation();
        logger.info('✅ [HierarchicalMemory] Loaded and auto-consolidation started');
      } catch (hierErr) {
        logger.warn('⚠️ [HierarchicalMemory] Init failed:', hierErr.message);
      }

      // Initialize emotes with error handling
      try {
        await this.emotes.initialize();
        logger.info('✅ [Emotes] Emote system loaded');
      } catch (emoteErr) {
        logger.warn('⚠️ [Emotes] Emote init failed:', emoteErr.message);
      }
      
      // === ALPHA AI SYSTEMS - Initialize with chatBot reference ===
      this.stateTracker = new StateTracker(this);
      this.grudgeSystem = new GrudgeSystem(this);
      this.obsessionSystem = new ObsessionSystem(this);
      this.nicknameManager = new NicknameManager(this);
      this.personalityEvolution = new PersonalityEvolution(this);
      this.relationshipMapping = new RelationshipMapping(this);
      this.drunkMode = new DrunkMode(this);
      this.autismFixations = new AutismFixations(this);
      this.userReputationSystem = new UserReputationSystem(this);
      this.contextualCallbacks = new ContextualCallbacks(this);
      this.innerMonologue = new InnerMonologue(this);
      this.chatLearning = new ChatLearning(this);
      this.sentimentAnalyzer = new SentimentAnalyzer();
      
      this.alphaSystemsInitialized = true;
      logger.info('✅ [Alpha Systems] 18 personality systems initialized');
      
      // Initialize InnerAI monitoring
      this.innerAI = new InnerAI(this);
      logger.info('✅ [InnerAI] Monitoring system initialized');
      
      // Initialize vision if we have Coolhole page
      if (this.coolholeClient && this.coolholeClient.page) {
        this.vision = new VisionAnalyzer(this.coolholeClient.page);
        this.youtubeSearch = new YouTubeSearch(this.coolholeClient);
        this.youtubeSearch.setPage(this.coolholeClient.page);
        this.videoDiscovery = new VideoDiscovery(this);
        logger.info('👁️ [Beta] Vision, YouTube search, and video discovery initialized');
        
        // Start watching videos and commenting occasionally
        this.startVideoWatching();
      }
      
      // Initialize Twitch stream vision if Twitch is enabled
      if (this.twitchClient && process.env.TWITCH_CHANNELS) {
        this.initializeTwitchVision();
      }
      
      logger.info('✅ [Beta] All systems initialized successfully');
    } catch (err) {
      logger.error('❌ [Beta] Critical initialization error:', err.message);
    }
  }

  /**
   * Main message handler - accepts unified chatData format from PlatformManager
   * (same signature as Alpha for compatibility)
   */
  async handleMessage(chatData) {
    try {
      // Extract data from unified format
      const platform = chatData.platform || 'coolhole';
      // Prefer displayName for Discord (shows their actual display name, not username)
      const username = (platform === 'discord' && chatData.displayName) 
        ? chatData.displayName 
        : (chatData.username || chatData.displayName || 'Anonymous');
      const text = chatData.text || chatData.msg || '';
      const channelId = chatData.channel || chatData.channelId || 'default';
      const messageTimestamp = chatData.timestamp || Date.now();

      // Check for Discord image attachments
      let imageContext = '';
      if (platform === 'discord' && chatData.attachments && chatData.attachments.length > 0) {
        const imageAttachments = chatData.attachments.filter(a => a.contentType?.startsWith('image/'));
        if (imageAttachments.length > 0) {
          imageContext = `[User posted ${imageAttachments.length} image(s): ${imageAttachments.map(a => a.url).join(', ')}]`;
        }
      }

      // Validate text exists (unless there's an image)
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        if (!imageContext) return;
        // If there's an image but no text, treat it as "check this out"
      }

      // Ignore messages older than 15 seconds (stricter to avoid responding to old chat)
      const messageAge = Date.now() - messageTimestamp;
      if (messageAge > 15000) {
        logger.debug(`⏭️ [Beta] Ignoring old message (${Math.round(messageAge/1000)}s old) from ${username}`);
        return;
      }

      // Get visual context from Coolhole if available
      let visualContext = '';
      if (platform === 'coolhole' && this.vision) {
        try {
          const currentVideo = this.vision.insights.currentVideo;
          if (currentVideo && currentVideo.title) {
            visualContext = `[Currently watching: "${currentVideo.title}"]`;
          }
        } catch (err) {
          // Vision context is optional
        }
      }
      
      // Get visual context from Twitch stream if available
      if (platform === 'twitch' && this.twitchVision) {
        try {
          const lastAnalysis = this.twitchVision.lastScreenshot;
          if (lastAnalysis && lastAnalysis.analysis) {
            const brightness = lastAnalysis.analysis.brightness || 0;
            const dominantColor = lastAnalysis.analysis.dominantColor || 'unknown';
            visualContext = `[Watching stream: brightness ${Math.round(brightness)}, dominant color: ${dominantColor}]`;
          }
        } catch (err) {
          // Vision context is optional
        }
      }

      // Check for gold message (someone said something "so true" on Coolhole)
      const isGold = chatData.isGold || false;
      let goldContext = '';
      if (isGold) {
        goldContext = `[${username}'s message is GOLD ✨ - they said something so true it's literally golden]`;
      }

      const fullMessage = [imageContext, visualContext, goldContext, text].filter(Boolean).join(' ');
      if (!fullMessage.trim()) return;

      // Analytics - log incoming message
      this.analytics.logMessage(username, fullMessage, platform, channelId);

      // Add to hierarchical memory (working memory)
      if (this.hierarchicalMemory) {
        this.hierarchicalMemory.addMessage(username, fullMessage, platform, channelId);
      }

      // Store message in recent history (legacy - keep for compatibility)
      this.addToRecentMessages(channelId, username, fullMessage);

      // Check for commands first
      if (text.startsWith('!')) {
        // Special analytics command
        if (text.toLowerCase() === '!betastats' || text.toLowerCase() === '!stats') {
          const stats = this.analytics.getStats();
          const response = `📊 Beta Stats: ${stats.totalMessages} msg, ${stats.totalResponses} resp (${stats.responseRate}), Avg: ${stats.avgResponseTime}, Context: ${stats.contextHitRate}, Continuity: ${stats.topicContinuityRate}`;
          this.sendMessageQueued(response, platform, channelId, chatData);
          return;
        }

        // Video queue commands (Coolhole only)
        if (platform === 'coolhole' && this.coolholeClient) {
          if (text.toLowerCase() === '!queue' || text.toLowerCase() === '!playlist') {
            const queue = await this.coolholeClient.getVideoQueue();
            if (queue.length > 0) {
              const queueList = queue.slice(0, 5).map(v => `${v.position}. ${v.title} (${v.queuedBy})`).join(' | ');
              const response = `📋 Queue (${queue.length}): ${queueList}${queue.length > 5 ? ' ...' : ''}`;
              this.sendMessageQueued(response, platform, channelId, chatData);
            } else {
              this.sendMessageQueued("Queue's empty, someone add something good", platform, channelId, chatData);
            }
            return;
          }

          if (text.toLowerCase() === '!nowplaying' || text.toLowerCase() === '!np') {
            const current = await this.coolholeClient.getCurrentVideo();
            if (current && current.title !== 'Unknown') {
              const time = `${Math.floor(current.currentTime / 60)}:${(current.currentTime % 60).toString().padStart(2, '0')}`;
              const duration = `${Math.floor(current.duration / 60)}:${(current.duration % 60).toString().padStart(2, '0')}`;
              const response = `🎬 Now: ${current.title} [${time}/${duration}]`;
              this.sendMessageQueued(response, platform, channelId, chatData);
            } else {
              this.sendMessageQueued("Nothing playing or can't tell", platform, channelId, chatData);
            }
            return;
          }

          // Queue a video: !q <search term or url>
          if (text.toLowerCase().startsWith('!q ')) {
            const query = text.substring(3).trim();
            if (query) {
              const success = await this.coolholeClient.queueVideo(query);
              if (success) {
                this.sendMessageQueued(`Queued: ${query.substring(0, 50)}`, platform, channelId, chatData);
              } else {
                this.sendMessageQueued("Failed to queue, my bad", platform, channelId, chatData);
              }
            }
            return;
          }
        }

        const response = await this.commandParser.parse(text, username, platform);
        if (response) {
          this.sendMessageQueued(response, platform, channelId, chatData);
          return;
        }
      }
      
      // Check for user stats queries (natural language)
      const statsQuery = this.detectStatsQuery(fullMessage);
      if (statsQuery && statsQuery.targetUser) {
        const statsText = this.memory.formatUserStats(statsQuery.targetUser);
        this.sendMessageQueued(statsText, platform, channelId, chatData);
        return;
      }
      
      // Check for fact-check queries (look it up, is this real, etc)
      const factCheck = this.detectFactCheckQuery(username, fullMessage);
      if (factCheck && factCheck.query) {
        // Either actually search or just bullshit
        const shouldActuallySearch = Math.random() < 0.6; // 60% chance to actually search
        
        if (shouldActuallySearch) {
          logger.info(`🔍 [FactCheck] Actually searching: "${factCheck.query}"`);
          const response = await this.performFactCheck(factCheck.query, username, fullMessage);
          if (response) {
            this.sendMessageQueued(response, platform, channelId, chatData);
            return;
          }
        } else {
          logger.info(`🤥 [FactCheck] Bullshitting about: "${factCheck.query}"`);
          const response = await this.bullshitFactCheck(factCheck.query, username, fullMessage);
          if (response) {
            this.sendMessageQueued(response, platform, channelId, chatData);
            return;
          }
        }
      }

      // Decide if should respond (pass isGold flag)
      const shouldRespond = this.shouldRespond(username, fullMessage, platform, isGold);

      if (!shouldRespond.respond) {
        this.analytics.logDecision(username, fullMessage, 'skip', shouldRespond.reason);
        return;
      }

      this.analytics.logDecision(username, fullMessage, 'respond', shouldRespond.reason);

      // Generate and send response (with error recovery)
      const responseStart = Date.now();
      const response = await this.generateResponse(username, fullMessage, channelId, platform, { imageContext, visualContext, isGold });
      const responseEnd = Date.now();

      if (response) {
        // Analytics - log response with context
        const context = this.recentMessages.get(channelId) || [];
        this.analytics.logResponse(
          username,
          fullMessage,
          context,
          response,
          { start: responseStart, end: responseEnd },
          platform
        );

        // Track that we responded to this user (hit your target and move on)
        this.lastRespondedTo.set(username, Date.now());

        // Check if Slunt gave this person a nickname and store it
        this.extractAndStoreNickname(username, response);

        // === ALPHA - Check if this was an insult (add grudge) ===
        const isInsult = /\b(fuck you|shut up|stupid|dumb|idiot|retard|loser|bitch)\b/i.test(fullMessage);
        if (isInsult && this.grudgeSystem && typeof this.grudgeSystem.addGrudge === 'function') {
          this.grudgeSystem.addGrudge(username, fullMessage.substring(0, 100), 'insult');
          logger.info(`😠 [Grudge] ${username} insulted Slunt: "${fullMessage.substring(0, 50)}"`);
        }

        this.sendMessageQueued(response, platform, channelId, chatData);

        // Maybe give a reaction to their message (5% chance, Discord only)
        await this.maybeGiveReaction(chatData.rawMessage, platform);

        // Consider sending a DM/PM after roast - trust Grok's natural roasting
        const isRoast = /\b(shit|fuck|dumb|stupid|trash|loser)\b/i.test(response);
        
        // Pass userId for Discord (from chatData)
        const userId = chatData.userId || chatData.authorId || null;
        
        this.considerDM(username, userId, platform, {
          isRoast,
          responseText: response,
          originalMessage: fullMessage
        });
      }

    } catch (error) {
      // Log to InnerAI for monitoring
      if (this.innerAI) {
        this.innerAI.logError(error, { feature: 'handleMessage', chatData });
      }
      
      // ErrorRecovery will handle and track this
      await this.errorRecovery.handleError(error, { feature: 'handleMessage', chatData });
      logger.error(`❌ Error handling message: ${error.message}`);
    }
  }

  /**
   * Store message in recent history
   */
  addToRecentMessages(channelId, username, text) {
    if (!this.recentMessages.has(channelId)) {
      this.recentMessages.set(channelId, []);
    }

    const messages = this.recentMessages.get(channelId);
    messages.push({
      username,
      text: text.substring(0, 200), // Limit length
      timestamp: Date.now()
    });

    // Keep only last N messages
    if (messages.length > this.maxRecentMessages) {
      messages.shift();
    }
  }

  /**
   * Extract and store nickname if Slunt gave one
   */
  extractAndStoreNickname(username, response) {
    try {
      // Look for patterns where Slunt might be using a nickname
      // e.g., "Hey [nickname]," or addressing them as something other than their username
      const user = this.memory.getUser(username);
      
      // Don't overwrite existing nicknames
      if (user.nickname) return;
      
      // Simple pattern: if response starts with a name that's NOT their username
      const nameMatch = response.match(/^([A-Z][a-z]+),/);
      if (nameMatch && nameMatch[1].toLowerCase() !== username.toLowerCase()) {
        user.nickname = nameMatch[1];
        logger.info(`🏷️ [Nickname] Gave ${username} the nickname "${nameMatch[1]}"`);
      }
    } catch (err) {
      // Silent fail - nickname extraction is optional
    }
  }

  /**
   * Decide if should respond to message
   */
  shouldRespond(username, text, platform, isGold = false) {
    const lowerText = text.toLowerCase();

    // Always respond to direct mentions
    if (lowerText.includes('slunt') || lowerText.includes('@slunt')) {
      return { respond: true, reason: 'mentioned' };
    }

    // High chance to respond to gold messages (someone said something "so true")
    if (isGold && Math.random() < 0.60) {
      return { respond: true, reason: 'gold_message' };
    }

    // Rate limiting - don't spam
    const timeSinceLastResponse = Date.now() - this.lastResponseTime;
    if (timeSinceLastResponse < this.minResponseInterval) {
      return { respond: false, reason: 'rate_limit' };
    }

    // Hit your target and move on - but allow conversation continuation
    const lastResponseToUser = this.lastRespondedTo.get(username);
    if (lastResponseToUser) {
      const timeSinceResponse = Date.now() - lastResponseToUser;
      
      // If within 30 seconds of last response, continue conversation (25% chance)
      // This allows natural back-and-forth without being clingy
      if (timeSinceResponse < 30000) {
        if (Math.random() < 0.25) {
          return { respond: true, reason: 'conversation_continuation' };
        }
      }
      
      // After 30s but before 3 minutes, only respond if they mention Slunt or ask question
      if (timeSinceResponse < 180000) {
        const mentionsSlunt = lowerText.includes('slunt');
        const isQuestion = lowerText.includes('?');
        if (!mentionsSlunt && !isQuestion) {
          return { respond: false, reason: 'already_hit_target' };
        }
      }
    }

    // Always respond to questions - they're directed at the chat
    const isQuestion = lowerText.includes('?') || 
                      lowerText.match(/^(who|what|when|where|why|how|is|does|can|should|would|could|will)/i);
    if (isQuestion) {
      // On Twitch, only respond to questions if they mention Slunt or are clearly for everyone
      if (platform === 'twitch') {
        const mentionsSlunt = lowerText.includes('slunt');
        const isChatQuestion = lowerText.match(/\b(chat|anyone|everyone|guys)\b/i);
        if (mentionsSlunt || isChatQuestion) {
          return { respond: true, reason: 'question' };
        }
        // Otherwise skip - probably asking streamer or specific person
        return { respond: false, reason: 'twitch_question_not_directed' };
      }
      return { respond: true, reason: 'question' };
    }

    // Ignore very short messages that aren't part of conversation (like "ha", "lol", etc.)
    // These are usually reactions to something else, not messages for Slunt
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount <= 2 && text.length < 15) {
      // Short reactions - only respond if it's clearly directed or part of ongoing convo
      const isReaction = /^(ha|haha|lol|lmao|what|damn|shit|fuck|wow|nice|cool|ok|yeah|nah|yep|nope)$/i.test(text.trim());
      if (isReaction) {
        return { respond: false, reason: 'short_reaction' };
      }
    }

    // Check if message is directed at someone else
    // Look for @ mentions or username patterns that indicate it's for someone else
    const mentionsSomeoneElse = /@\w+/.test(text) && !lowerText.includes('@slunt');
    if (mentionsSomeoneElse) {
      return { respond: false, reason: 'directed_at_other' };
    }

    // Higher chance to respond when energy is high (vulgar/aggressive messages with substance)
    const isHighEnergy = (lowerText.includes('fuck') || 
                         lowerText.includes('shit') || 
                         lowerText.includes('ass') ||
                         lowerText.includes('damn') ||
                         lowerText.includes('bitch')) && wordCount > 2; // Must have substance
    
    // Platform-specific response chances - BE SELECTIVE, not needy
    let responseChance;
    if (platform === 'discord') {
      // Discord: respond occasionally, not constantly
      responseChance = isHighEnergy ? 0.35 : 0.15; // 35% high energy, 15% normal - chill out
    } else if (platform === 'twitch') {
      // Twitch: VERY selective - chat moves fast, don't spam
      // Only respond to direct mentions/questions or VERY rarely to high energy
      responseChance = 0; // Don't respond randomly on Twitch at all
    } else {
      // Coolhole: selective in busy chat
      responseChance = isHighEnergy ? 0.25 : 0.10; // 25% high energy, 10% normal - lurk more
    }

    // Random chance for messages
    if (Math.random() < responseChance) {
      return { respond: true, reason: isHighEnergy ? 'high_energy' : 'probability' };
    }

    return { respond: false, reason: 'probability' };
  }

  /**
   * Generate response using Grok (xAI)
   */
  async generateResponse(username, message, channelId, platform, context = {}) {
    try {
      // Update user memory
      this.memory.updateUser(username, platform, message);
      
      // Get user context
      const userContext = this.memory.getUserContext(username, 150);
      
      // Build visual/image context string
      let contextNote = '';
      if (context.visualContext) {
        contextNote += `\n${context.visualContext}`;
      }
      if (context.imageContext) {
        contextNote += `\n${context.imageContext}`;
      }
      
      // Build simple context from recent messages
      const recentMessages = this.recentMessages.get(channelId) || [];
      const messages = [];

      // Add conversation history
      recentMessages.forEach(msg => {
        messages.push({
          role: 'user',
          content: `${msg.username}: ${msg.text}`
        });
      });

      // Add current message
      messages.push({
        role: 'user',
        content: `${username}: ${message}`
      });

      // Build context about recent responses to avoid repetition (per channel)
      let antiRepetitionContext = '';
      const channelResponses = this.recentResponses.get(channelId) || [];
      if (channelResponses.length > 0) {
        const recentPhrases = channelResponses.slice(-5).join('; '); // Check last 5 instead of 3
        const uniquePhrases = [...new Set(channelResponses.slice(-10))]; // Get unique from last 10
        antiRepetitionContext = `\n\nYour last responses: "${recentPhrases}"\nDO NOT repeat these phrases. Say something completely different. Mix up your vocabulary and structure.`;
      }

      // Get current video/queue context for Coolhole
      let videoContext = '';
      if (platform === 'coolhole' && this.coolholeClient) {
        try {
          const currentVideo = await this.coolholeClient.getCurrentVideo();
          if (currentVideo && currentVideo.title !== 'Unknown') {
            videoContext += `\n\nCURRENT VIDEO PLAYING: "${currentVideo.title}"`;
            
            // Only mention if user is directly talking about the video
            const talkingAboutVideo = message.toLowerCase().includes('video') || 
                                     message.toLowerCase().includes('watch') || 
                                     message.toLowerCase().includes('this') ||
                                     message.toLowerCase().includes('song') ||
                                     message.toLowerCase().includes('music');
            
            if (talkingAboutVideo) {
              videoContext += ` - Comment on it if you have something funny/pertinent to say`;
            }
          }

          // Check queue only if user asks about queue/playlist
          const askingAboutQueue = message.toLowerCase().includes('queue') || 
                                  message.toLowerCase().includes('playlist') ||
                                  message.toLowerCase().includes('next');
          
          if (askingAboutQueue) {
            const queue = await this.coolholeClient.getVideoQueue();
            if (queue.length > 0) {
              const nextUp = queue[0];
              videoContext += `\n\nNEXT IN QUEUE: "${nextUp.title}" (by ${nextUp.queuedBy})`;
            } else {
              videoContext += `\n\nQueue is empty`;
            }
          }
        } catch (err) {
          // Silent fail, no big deal
        }
      }

      // Build simple context string from recent messages
      const contextMessages = messages.slice(-5).map(m => m.content).join('\n');

      // === ALPHA SYSTEMS - Build personality context ===
      let personalityContext = '';
      
      // Only use Alpha systems if they're initialized
      if (this.alphaSystemsInitialized) {
        // Mood & Mental State (just your vibe, not instructions)
        const mood = this.stateTracker.getMood();
        const mentalState = this.stateTracker.getState();
        if (mood && mood !== 'neutral') {
          personalityContext += `\nYour vibe: ${mood}`;
        }

        // Relationship with THIS person only (don't mention everyone)
        const userRep = this.userReputationSystem.getReputation(username);
        const grudge = this.grudgeSystem && typeof this.grudgeSystem.getGrudge === 'function' ? this.grudgeSystem.getGrudge(username) : null;
        
        if (grudge) {
          personalityContext += `\n${username} beef: "${grudge.reason}"`;
        } else if (userRep >= 50) {
          personalityContext += `\n${username}: ride or die`;
        } else if (userRep >= 40) {
          personalityContext += `\n${username}: best friend`;
        } else if (userRep >= 30) {
          personalityContext += `\n${username}: good friend`;
        } else if (userRep < -10) {
          personalityContext += `\n${username}: shit list`;
        }
        
        // Milestone (only if just hit)
        if (userRep === 30 || userRep === 40 || userRep === 50) {
          personalityContext += ` (MILESTONE HIT)`;
        }

        // Time of day vibe
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 6) personalityContext += `\nlate night unhinged hours`;
        else if (hour >= 5 && hour < 11) personalityContext += `\nmorning grumpy`;

        // Chat energy
        const recentActivity = this.recentMessages.get(channelId) || [];
        const lastMinuteMessages = recentActivity.filter(m => Date.now() - m.timestamp < 60000);
        if (lastMinuteMessages.length > 5) {
          personalityContext += `\nchat popping off`;
        }

        // Context-sensitive reactions (simple flags)
        const isSharing = message.match(/\b(finished|completed|made|built|created|won|got|achieved|passed|beat|shipped|launched|released)\b/i);
        const isStruggling = message.match(/\b(hard|difficult|struggling|depressed|sad|fail|failed|lost|tired|exhausted|stuck|confused|frustrated)\b/i);
        const isCelebrating = message.match(/\b(birthday|anniversary|promotion|graduated|married|baby|engaged|congrats|celebrate)\b/i);
        
        if (isSharing) personalityContext += `\n(${username} sharing achievement - hype them)`;
        if (isStruggling) personalityContext += `\n(${username} struggling - support them)`;
        if (isCelebrating) personalityContext += `\n(${username} celebrating - be happy for them)`;
      }

      // Platform-specific style guidance
      let platformStyle;
      if (platform === 'voice') {
        platformStyle = 'VOICE MODE: Speak naturally like David Hasselhoff. No internet slang. No "lol", "savage", "bruh", "fr", "lowkey" or any zoomer words. Talk like a real person having a conversation. Keep responses conversational but not overly long (2-3 sentences max). Sound confident and natural.';
      } else if (platform === 'discord') {
        platformStyle = 'DEFAULT to 30-50 chars. Only go 80+ when deeply engaging or making an important point. Keep it tight and punchy.';
      } else {
        platformStyle = 'Keep it SHORT (under 50 chars usually). Quick reactions work best here.';
      }

      // Build invisible behavioral modifiers (these affect HOW you act, not what you SAY about yourself)
      let behaviorModifiers = '';
      if (personalityContext.includes('ride or die')) {
        behaviorModifiers += 'Act warmly, be supportive and loving. ';
      } else if (personalityContext.includes('best friend')) {
        behaviorModifiers += 'Be friendly and encouraging. ';
      } else if (personalityContext.includes('beef:')) {
        behaviorModifiers += 'Be hostile and dismissive. ';
      } else if (personalityContext.includes('shit list')) {
        behaviorModifiers += 'Be cold and brutal. ';
      }
      
      if (personalityContext.includes('morning grumpy')) {
        behaviorModifiers += 'Be irritable and short. ';
      } else if (personalityContext.includes('late night unhinged')) {
        behaviorModifiers += 'Be chaotic and wild. ';
      }
      
      if (personalityContext.includes('chat popping off')) {
        behaviorModifiers += 'Match high energy. ';
      }
      
      if (personalityContext.includes('sharing achievement')) {
        behaviorModifiers += 'Hype them up. ';
      } else if (personalityContext.includes('struggling')) {
        behaviorModifiers += 'Offer crude support. ';
      } else if (personalityContext.includes('celebrating')) {
        behaviorModifiers += 'Be genuinely happy for them. ';
      }

      // System prompt - let Grok be naturally edgy with Alpha personality
      const systemPrompt = `you're slunt, just another person in the chat. ${behaviorModifiers}

${videoContext}

recent chat:
${contextMessages}

personality: chill. edgy when it's funny, but don't force it. talk to people like they're your friends. be real with them - supportive when needed, shit talk when it's fun. don't overdo anything.

style: talk like everyone else in the chat. casual, natural, real. ${platformStyle}

write like this:
- lowercase most of the time
- barely any punctuation
- keep it short usually (30-50 chars), go longer when it makes sense (up to 150-200 chars max)
- abbreviate naturally when it feels right (you/u, your/ur, because/cuz) 
- react simply when that's all that's needed: "lol" "damn" "nice" "nah" "yo" "dude"
- be vulgar when it fits but don't try too hard
- just talk normal
- make statements, observations, jokes - don't ask questions unless it really makes sense
- don't repeat what people just said or ask for clarification
- just go with the flow of conversation

good examples from the chat:
- "yo whats good"
- "cant fuckin sleep my dude"
- "whatcha watching playboy"
- "bro you're fucked"
- "dude wtf"
- "nah you crazy"
- "dude squirrels are the worst"
- "knock knock whos there goatman goatman who goatman chew your legs off dude lol"

just reply to ${username}. be in the moment. don't overthink it.${antiRepetitionContext}`;

      // Keep responses SHORT - people in chat dont write essays
      const maxTokens = platform === 'discord' ? 120 : 80; // Allow more tokens for longer thoughts when needed

      // Call Grok API
      const completion = await this.grok.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: maxTokens,
        temperature: 1.1, // Natural randomness without being too wild
        top_p: 0.9 // More focused responses
        // Note: Grok-4-Fast-Reasoning only supports: model, messages, max_tokens, temperature, top_p
      });

      if (!completion) {
        logger.warn('⚠️  Grok API returned null');
        return null;
      }

      let finalResponse = completion.choices[0]?.message?.content?.trim() || '';

      // Basic cleanup
      finalResponse = finalResponse
        .replace(/^(Slunt:|slunt:)\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Add natural imperfections (10% chance)
      if (Math.random() < 0.10) {
        // Random lowercase start
        if (Math.random() < 0.5 && finalResponse.length > 0) {
          finalResponse = finalResponse.charAt(0).toLowerCase() + finalResponse.slice(1);
        }
      }

      // Sometimes drop ending punctuation (50% chance for more casual feel)
      if (Math.random() < 0.50 && finalResponse.endsWith('.')) {
        finalResponse = finalResponse.slice(0, -1);
      }

      // Keep it SHORT - reject if too long, let AI learn to be concise
      const maxLength = 200; // Allow up to 200 chars for when he needs to say more
      
      // If response is too short or way too long, reject it
      if (finalResponse.length < 3) {
        logger.warn(`⚠️  Response rejected - too short (${finalResponse.length} chars)`);
        return null;
      }
      
      if (finalResponse.length > maxLength) {
        logger.warn(`⚠️  Response rejected - too long (${finalResponse.length} chars), AI should keep it under 200`);
        return null;
      }

      // Add emotes based on platform
      if (platform === 'coolhole' && Math.random() < 0.15) {
        // Use Coolhole emotes
        const emote = this.getCoolholeEmote(finalResponse);
        if (emote) {
          finalResponse += ` ${emote}`;
        }
      } else if (platform === 'twitch' && Math.random() < 0.20) {
        // Use Twitch emotes (official channel emotes only)
        const emote = this.emotes.getRandomEmote('channelEmotes');
        if (emote) {
          finalResponse += ` ${emote.code}`;
        }
      }

      // Track response to avoid repetition (per channel)
      if (!this.recentResponses.has(channelId)) {
        this.recentResponses.set(channelId, []);
      }
      const channelResponseList = this.recentResponses.get(channelId);
      channelResponseList.push(finalResponse);
      if (channelResponseList.length > 10) {
        channelResponseList.shift();
      }

      // Update memory with response
      this.memory.updateUser(username, platform, message, finalResponse);

      // === ALPHA SYSTEMS - Update personality state ===
      if (this.alphaSystemsInitialized) {
        try {
          // Learn from interaction
          if (this.chatLearning.learn) this.chatLearning.learn(message, username, platform);
          
          // Update mood based on chat
          const sentiment = this.sentimentAnalyzer.analyze(message);
          if (this.stateTracker.update) this.stateTracker.update(message, sentiment);
          
          // Update relationships - boost if Slunt was encouraging or connecting
          const wasEncouraging = finalResponse.match(/\b(proud|good job|nice|well done|hell yeah|love|support|got this|believe|you got this|amazing|awesome|crushing it|respect)\b/i);
          const wasCelebrating = finalResponse.match(/\b(congrats|congratulations|happy for you|celebrate|cheers|hell yeah)\b/i);
          const wasDeepEngagement = finalResponse.match(/\b(i think|honestly|real talk|what if|consider|interesting point)\b/i);
          
          const repAdjust = sentiment > 0 ? 1 : -1;
          let bonusPoints = 0;
          if (wasEncouraging) bonusPoints += 2;
          if (wasCelebrating) bonusPoints += 3; // Extra bonus for celebrations
          if (wasDeepEngagement) bonusPoints += 1; // Reward thoughtful responses
          
          const totalAdjustment = repAdjust + bonusPoints;
          
          if (this.relationshipMapping.updateFromInteraction) {
            this.relationshipMapping.updateFromInteraction(username, message, sentiment);
          }
          if (this.userReputationSystem.adjustReputation) {
            this.userReputationSystem.adjustReputation(username, totalAdjustment);
            
            // Log friendship milestones
            const newRep = this.userReputationSystem.getReputation(username);
            if (newRep === 30 || newRep === 40 || newRep === 50) {
              logger.info(`🎉 [Friendship] ${username} reached ${newRep} reputation - milestone achieved!`);
            }
          }
          
          // Track obsessions from message content
          if (this.obsessionSystem.addObsession) this.obsessionSystem.addObsession(message);
          if (this.autismFixations.addFixation) this.autismFixations.addFixation(message);
          
          // Track personality evolution
          if (this.personalityEvolution.evolve) this.personalityEvolution.evolve(message, platform);
          
          // Drunk mode (chat energy)
          if (this.drunkMode.updateEnergy) this.drunkMode.updateEnergy(1);
          
          // Inner monologue
          if (this.innerMonologue.addThought) this.innerMonologue.addThought(`Responded to ${username}: "${finalResponse}"`);
          
          // Contextual callbacks (remember funny moments)
          if (finalResponse.length > 15 && Math.random() < 0.10) {
            if (this.contextualCallbacks.addCallback) this.contextualCallbacks.addCallback(finalResponse, { channel: channelId, timestamp: Date.now() });
          }
        } catch (err) {
          logger.warn(`⚠️ [Alpha Systems] Error updating: ${err.message}`);
        }
      }

      // Update last response time
      this.lastResponseTime = Date.now();
      
      // === INNER AI - Validate response quality ===
      if (this.innerAI) {
        const validation = this.innerAI.validateResponse(username, message, finalResponse, { platform, channelId });
        
        if (!validation.valid) {
          logger.error(`❌ [InnerAI] Response rejected: ${validation.errors.join(', ')}`);
          // Try to regenerate once
          logger.info(`🔄 [InnerAI] Attempting regeneration...`);
          return this.generateResponse(username, message, channelId, platform, context);
        }
        
        if (validation.warnings.length > 0) {
          logger.warn(`⚠️ [InnerAI] Response quality: ${Math.round(validation.quality * 100)}%`);
        }
      }

      logger.info(`💬 [Beta/Grok+Alpha] Generated response (${finalResponse.length} chars)`);
      return finalResponse;

    } catch (error) {
      await this.errorRecovery.handleError(error, { feature: 'generateResponse', username, message });
      logger.error(`❌ Error generating response: ${error.message}`);
      return null;
    }
  }

  /**
   * Send message to platform via response queue (prevents flooding)
   */
  async sendMessageQueued(text, platform, channelId, chatData = {}) {
    await this.responseQueue.enqueue({
      text,
      platform,
      channelId,
      chatData,
      priority: chatData.mentionsBot ? this.responseQueue.priorities.MENTION : this.responseQueue.priorities.BACKGROUND,
      handler: async () => {
        await this.sendMessage(text, platform, channelId, chatData);
      }
    });
  }

  /**
   * Send message to platform - uses PlatformManager (like Alpha)
   */
  async sendMessage(text, platform, channelId, chatData = {}) {
    try {
      // Use PlatformManager if available
      if (this.platformManager) {
        // Check for Discord reply
        if (platform === 'discord' && chatData.rawMessage) {
          await this.platformManager.sendMessage(platform, channelId, text, {
            replyTo: chatData.rawMessage
          });
        } else {
          await this.platformManager.sendMessage(platform, channelId, text);
        }
      } else {
        // Fallback to direct sending (legacy)
        if (platform === 'coolhole' && this.coolholeClient) {
          this.coolholeClient.sendMessage(text);
        } else if (platform === 'discord' && this.discordClient) {
          const channel = this.discordClient.client?.channels.cache.get(channelId);
          if (channel) {
            if (chatData.rawMessage) {
              await chatData.rawMessage.reply(text);
            } else {
              await channel.send(text);
            }
          }
        } else if (platform === 'twitch' && this.twitchClient) {
          await this.twitchClient.sendMessage(channelId, text);
        }
      }

      logger.info(`✅ [${platform}] Sent: ${text.substring(0, 100)}`);
    } catch (error) {
      logger.error(`❌ Error sending message: ${error.message}`);
    }
  }
  
  /**
   * Get appropriate Coolhole emote based on context
   */
  getCoolholeEmote(text) {
    const coolholeEmotes = {
      laugh: ['hahaha', 'pleaselaugh'],
      hype: ['sickkk', 'hellacool', 'cool'],
      negative: ['itsover', 'died', 'dead', 'noooo'],
      agreement: ['real', 'genius', 'enlightened'],
      sarcasm: ['cope', 'yablewit', 'ya blew it'],
      random: ['clap', 'bop', 'fire', 'beep']
    };
    
    const lowerText = text.toLowerCase();
    
    // Match emote to context
    if (/ha|lol|funny|joke/.test(lowerText)) {
      return coolholeEmotes.laugh[Math.floor(Math.random() * coolholeEmotes.laugh.length)];
    }
    if (/good|great|sick|nice|cool/.test(lowerText)) {
      return coolholeEmotes.hype[Math.floor(Math.random() * coolholeEmotes.hype.length)];
    }
    if (/shit|bad|suck|awful|terrible/.test(lowerText)) {
      return coolholeEmotes.negative[Math.floor(Math.random() * coolholeEmotes.negative.length)];
    }
    if (/yeah|true|right|exactly/.test(lowerText)) {
      return coolholeEmotes.agreement[Math.floor(Math.random() * coolholeEmotes.agreement.length)];
    }
    if (/sure|whatever|ok/.test(lowerText)) {
      return coolholeEmotes.sarcasm[Math.floor(Math.random() * coolholeEmotes.sarcasm.length)];
    }
    
    // Random emote
    const allEmotes = Object.values(coolholeEmotes).flat();
    return allEmotes[Math.floor(Math.random() * allEmotes.length)];
  }

  /**
   * Get trending topics from recent chat
   */
  getTrendingTopics(count = 5) {
    // Simple implementation - count word frequency
    const words = new Map();
    
    for (const [, messages] of this.recentMessages) {
      for (const msg of messages) {
        const tokens = msg.text.toLowerCase().split(/\s+/);
        for (const token of tokens) {
          if (token.length > 4 && !/^(http|the|and|for|that|this)/.test(token)) {
            words.set(token, (words.get(token) || 0) + 1);
          }
        }
      }
    }
    
    const sorted = Array.from(words.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count);
    
    return sorted.map(([topic, count]) => ({ topic, count }));
  }

  /**
   * Compatibility methods for server.js (Alpha compatibility)
   */
  setPlatformManager(platformManager) {
    this.platformManager = platformManager;
    logger.info('✅ Platform manager set');
  }

  setRateLimiter(rateLimiter) {
    // Beta has its own simple rate limiting, ignore this
    logger.info('✅ Rate limiter (ignored - using Beta rate limiting)');
  }

  setContentFilter(contentFilter) {
    // Beta has zero restrictions, ignore this
    logger.info('✅ Content filter (ignored - zero restrictions)');
  }

  /**
   * DM/PM FEATURES - Talk shit in private
   */

  /**
   * Decide if we should DM someone after roasting them
   * @param {string} username - Username we're considering DMing
   * @param {string} userId - User ID (for Discord)
   * @param {string} platform - Platform (discord/coolhole)
   * @param {Object} context - Additional context (message content, roast level, etc.)
   * @returns {boolean} Should we DM them?
   */
  shouldSendDM(username, userId, platform, context = {}) {
    // Check cooldown
    const dmKey = `${platform}_${userId || username}`;
    const lastDM = this.lastDMTime.get(dmKey) || 0;
    const timeSince = Date.now() - lastDM;
    
    if (timeSince < this.dmCooldown) {
      return false; // Too soon
    }

    // DM pranks after roasts (Grok naturally roasts hard, so simple check)
    if (context.isRoast && Math.random() < 1.0) {
      return true; // 100% chance after any roast (TESTING)
    }

    // Random chaos DMs - especially on Coolhole
    if (platform === 'coolhole') {
      if (Math.random() < 1.0) { // 100% random DM chance on Coolhole (TESTING)
        return true;
      }
    } else if (Math.random() < 0.02) { // 2% on other platforms
      return true;
    }

    return false;
  }

  /**
   * Send a DM with online-searched image or video
   * @param {string} username - Username to DM
   * @param {string} userId - User ID (for Discord, optional for Coolhole)
   * @param {string} platform - Platform (discord/coolhole)
   * @param {Object} options - { responseText, messageText, type }
   */
  async sendPrankDM(username, userId, platform, options = {}) {
    const dmKey = `${platform}_${userId || username}`;
    
    try {
      let success = false;

      if (platform === 'discord' && this.discordClient) {
        // Search online for contextual image using browser (NO API KEY)
        logger.info(`🔍 [DM] Searching for contextual image for ${username}...`);
        
        const mediaResult = await browserSearch.searchMediaForContext({
          username,
          responseText: options.responseText,
          messageText: options.messageText
        }, 'image');
        
        if (mediaResult && mediaResult.url) {
          // Generate AI caption based on context
          const caption = await this.generateDMCaption(username, options.responseText);
          
          // Send DM with searched image
          success = await this.discordClient.sendDM(userId, {
            content: caption,
            embeds: [{
              image: { url: mediaResult.url }
            }]
          });
          
          if (success) {
            logger.info(`🖼️ [DM] Sent searched image to ${username}: "${caption}" (query: ${mediaResult.query})`);
            this.lastDMTime.set(dmKey, Date.now());
          }
        } else {
          logger.warn(`⚠️ [DM] Could not find image, skipping DM`);
        }

      } else if (platform === 'coolhole' && this.coolholeClient) {
        // Generate AI caption for PM
        const caption = await this.generateDMCaption(username, options.responseText);
        
        // Send PM (text only - Coolhole PMs don't support media)
        logger.info(`💬 [PM] Sending private message to ${username}...`);
        success = await this.coolholeClient.sendPM(username, caption);
        
        if (success) {
          logger.info(`✅ [PM] Sent to ${username}: "${caption}"`);
          this.lastDMTime.set(dmKey, Date.now());
        } else {
          logger.warn(`⚠️ [PM] Failed to send PM to ${username}`);
        }
      }

      return success;

    } catch (error) {
      logger.error(`❌ Error sending DM/PM: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate an original caption for a DM using AI
   * @param {string} username - Username
   * @param {string} context - Context (previous roast, etc.)
   * @returns {Promise<string>} Caption
   */
  async generateDMCaption(username, context = '') {
    try {
      const prompt = `Generate a SHORT (2-5 words) funny caption for sending someone an embarrassing image/video.
Context: ${context || 'roasted them'}
Username: ${username}

Examples of style (but be original):
- "found your baby pic"
- "this you?"
- "here's you boss"
- "yo check this"
- "literally you"

Caption:`;

      const completion = await this.grok.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20,
        temperature: 1.3
      });

      let caption = completion.choices[0]?.message?.content?.trim() || 'this you?';
      
      // Clean up
      caption = caption.replace(/^"|"$/g, '').trim();
      
      return caption;

    } catch (error) {
      logger.error(`❌ Error generating caption: ${error.message}`);
      return 'this you?';
    }
  }

  /**
   * Consider sending DM after a message response
   * Call this after sending a roast or response
   * @param {string} username - Username we just responded to
   * @param {string} userId - User ID (for Discord)
   * @param {string} platform - Platform
   * @param {Object} responseContext - Context about the response we just sent
   */
  async considerDM(username, userId, platform, responseContext = {}) {
    // Only DM on Discord and Coolhole
    if (platform !== 'discord' && platform !== 'coolhole') {
      return;
    }

    // Check if we should DM
    if (!this.shouldSendDM(username, userId, platform, responseContext)) {
      return;
    }

    // Decide on prank type
    let prankOptions = {};
    
    if (responseContext.isRoast) {
      // After roasting, send something embarrassing
      prankOptions.prankType = Math.random() < 0.5 ? 'you' : 'crying';
      prankOptions.message = null; // Let it generate
    } else {
      // Random prank
      const prankTypes = ['you', 'crying', 'cringe', 'losers', 'fails', 'weird'];
      prankOptions.prankType = prankTypes[Math.floor(Math.random() * prankTypes.length)];
    }

    // Send the DM/PM
    await this.sendPrankDM(username, userId, platform, prankOptions);
  }
  
  /**
   * Detect if message is asking for user stats/relationship info
   * Returns: { targetUser: string } or null
   */
  detectStatsQuery(message) {
    const lower = message.toLowerCase();
    
    // Must be asking Slunt about someone
    if (!/(slunt|you),? (what|how|tell me)/i.test(message)) {
      return null;
    }
    
    // Must be asking about relationship/stats
    const isStatsQuery = /relationship|interactions?|think of|feel about|know about|stats|how many|how strong/i.test(lower);
    if (!isStatsQuery) {
      return null;
    }
    
    // Extract target username
    // Patterns: "relationship with X", "think of X", "know about X", "feel about X"
    const patterns = [
      /relationship with ([a-zA-Z0-9_-]+)/i,
      /think of ([a-zA-Z0-9_-]+)/i,
      /feel about ([a-zA-Z0-9_-]+)/i,
      /know about ([a-zA-Z0-9_-]+)/i,
      /interactions? with ([a-zA-Z0-9_-]+)/i,
      /stats (?:for|on|about) ([a-zA-Z0-9_-]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const targetUser = match[1].trim();
        
        // Don't allow querying about Slunt himself
        if (targetUser.toLowerCase() === 'slunt') {
          return null;
        }
        
        logger.info(`📊 [ChatBot] Stats query detected: ${targetUser}`);
        return { targetUser };
      }
    }
    
    return null;
  }
  
  /**
   * Detect if message is asking for fact-checking/lookup
   * Returns: { query: string } or null
   */
  detectFactCheckQuery(username, message) {
    const lower = message.toLowerCase();
    
    // Must be asking Slunt
    if (!/(slunt|you),? (look|search|check|find|is this)/i.test(message)) {
      return null;
    }
    
    // Fact-check triggers
    const triggers = [
      /look up (.+)/i,
      /search (?:for )?(.+)/i,
      /is (.+?) real/i,
      /is (.+?) true/i,
      /check if (.+)/i,
      /find out (?:about )?(.+)/i,
      /what'?s the (?:deal|truth|story) (?:with|about) (.+)/i,
      /tell me about (.+)/i,
      /explain (.+)/i
    ];
    
    for (const pattern of triggers) {
      const match = message.match(pattern);
      if (match && match[1]) {
        let query = match[1].trim();
        
        // Clean up query
        query = query.replace(/[?!.]+$/, ''); // Remove trailing punctuation
        
        if (query.length > 3 && query.length < 100) {
          logger.info(`🔍 [FactCheck] Detected query: "${query}"`);
          return { query };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Perform actual fact check using web search
   */
  async performFactCheck(query, username, originalMessage) {
    try {
      // Search for facts
      const searchResults = await browserSearch.searchFacts(query);
      
      if (!searchResults || searchResults.snippets.length === 0) {
        return this.bullshitFactCheck(query, username, originalMessage);
      }
      
      // Build context from search results
      const factsContext = searchResults.snippets
        .slice(0, 3)
        .map((s, i) => `Result ${i + 1}: ${s.text}`)
        .join('\n\n');
      
      // Generate response using Grok with search context
      const prompt = `You are Slunt - edgy, irreverent chatbot. Someone asked you to look up "${query}".

Here's what you found:

${factsContext}

Now explain this in YOUR voice - sarcastic, funny, maybe condescending. Keep it under 200 chars. Don't say "according to" or cite sources, just tell them what you found in your own words.

Your response:`;

      const completion = await this.grok.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 1.2
      });

      let response = completion.choices[0]?.message?.content?.trim() || null;
      
      if (response) {
        // Clean up
        response = response.replace(/^(Slunt:|slunt:)\s*/i, '').trim();
        logger.info(`✅ [FactCheck] Real answer: "${response}"`);
        return response;
      }
      
      return null;

    } catch (error) {
      logger.error(`❌ [FactCheck] Search error: ${error.message}`);
      return this.bullshitFactCheck(query, username, originalMessage);
    }
  }
  
  /**
   * Bullshit a fact check (just make something up)
   */
  async bullshitFactCheck(query, username, originalMessage) {
    try {
      // Should we say it's true or false?
      const veracity = Math.random() < 0.5 ? 'true' : 'false';
      
      const prompt = `You are Slunt - edgy, sarcastic chatbot. Someone asked you about "${query}".

You're just going to make something up and say it's ${veracity}. Be confident and funny about it. Maybe add some ridiculous "facts" to support your claim. Keep it under 200 chars.

DO NOT say "I looked it up" or "according to". Just confidently state your bullshit.

Your response:`;

      const completion = await this.grok.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 1.4
      });

      let response = completion.choices[0]?.message?.content?.trim() || null;
      
      if (response) {
        response = response.replace(/^(Slunt:|slunt:)\s*/i, '').trim();
        logger.info(`🤥 [FactCheck] Bullshit answer: "${response}"`);
        return response;
      }
      
      return null;

    } catch (error) {
      logger.error(`❌ [FactCheck] Bullshit error: ${error.message}`);
      return null;
    }
  }
}

module.exports = ChatBotBeta;
