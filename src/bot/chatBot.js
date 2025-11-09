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
const MemoryCore = require('../core/memoryCore');
const TwitchEmoteManager = require('../twitch/TwitchEmoteManager');
const VisionAnalyzer = require('../vision/visionAnalyzer');
const YouTubeSearch = require('../video/youtubeSearch');
const VideoDiscovery = require('../ai/VideoDiscovery');
const browserSearch = require('./browserSearch');

// Alpha's proven stability systems
const errorRecovery = require('../stability/ErrorRecovery'); // singleton
const ResponseQueue = require('../stability/ResponseQueue'); // class
const dbSafety = require('../stability/DatabaseSafety'); // singleton

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
    this.model = 'grok-3';

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
    this.emotes = new TwitchEmoteManager(process.env.TWITCH_CHANNELS?.split(',')[0] || 'broteam');
    this.recentResponses = new Map(); // Track last responses per channel to avoid repetition
    this.vision = null; // Will be initialized when Coolhole connects
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

    logger.info('🤖 Slunt Beta initialized - Minimal mode');
    logger.info('   AI: Grok (xAI) - Unrestricted & Edgy');
    logger.info('   Systems: MINIMAL (no personality, no learning)');
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

  async initializeAsync() {
    try {
      await this.memory.initialize();
      await this.emotes.initialize();
      
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
      
      logger.info('✅ [Beta] Memory and emotes initialized');
    } catch (err) {
      logger.warn('⚠️ [Beta] Failed to initialize memory/emotes:', err.message);
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

      // Store message in recent history
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

        this.sendMessageQueued(response, platform, channelId, chatData);

        // Maybe give a reaction to their message (5% chance, Discord only)
        await this.maybeGiveReaction(chatData.rawMessage, platform);

        // Consider sending a DM/PM after responding (for roasts/pranks)
        const isRoast = /shit|dumb|stupid|trash|cringe|loser|pathetic/i.test(response);
        const roastLevel = isRoast ? (response.match(/shit|fuck|dumb|stupid/gi) || []).length + 5 : 0;
        
        // Pass userId for Discord (from chatData)
        const userId = chatData.userId || chatData.authorId || null;
        
        this.considerDM(username, userId, platform, {
          isRoast,
          roastLevel,
          responseText: response,
          originalMessage: fullMessage
        });
      }

    } catch (error) {
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

    // Hit your target and move on - don't respond to same user repeatedly
    const lastResponseToUser = this.lastRespondedTo.get(username);
    if (lastResponseToUser) {
      const timeSinceResponse = Date.now() - lastResponseToUser;
      // If we responded to this user in the last 3 minutes, skip them unless they directly mention Slunt
      if (timeSinceResponse < 180000) {
        // Only respond again if they explicitly mention Slunt
        const mentionsSlunt = lowerText.includes('slunt');
        if (!mentionsSlunt) {
          return { respond: false, reason: 'already_hit_target' };
        }
      }
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
    
    const responseChance = isHighEnergy ? 0.40 : 0.20; // 40% for high energy, 20% normal (reduced from 25%)

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
        const recentPhrases = channelResponses.slice(-3).join('; ');
        antiRepetitionContext = `\n\nDON'T repeat these recent responses: "${recentPhrases}"`;
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

      // System prompt - more natural, less robotic
      const systemPrompt = `You are Slunt. You're real, not filtered. Everyone here is friends and gets the bit.

${userContext ? `About ${username}: ${userContext}` : ''}${contextNote}${videoContext}

COOLHOLE KNOWLEDGE:
- Chat filters replace words (like "faggot" becomes "Fargoth"). It's hilarious when it happens
- Gold messages have a sparkly gold color - rare moment when someone's message gets lucky
- If you see a gold message, just enjoy the moment with everyone. React naturally - laugh, celebrate, riff on it
- Don't say it's "true" or explain it - just vibe with the hype when gold happens
- Coolhole has quirky features. You're figuring them out as you go. Be curious about them
- Users might ask you about features you've noticed. Share your observations
- You can see what video is currently playing. Only comment on it if you have something funny or pertinent to add
- Don't randomly mention queueing videos or suggest features you can't actually use
- If queue info is provided, you can mention what's next, but keep it natural

HOW TO TALK:
- You're mostly chill and fun to hang with. Just a guy in chat
- You might naturally develop nicknames for people over time. Use them when it feels right, not forced
- If you have a nickname for someone, use it naturally - you don't need to introduce it every time
- ROAST when the moment's right - be brutal, creative, funny about it
- If someone's name is stupid, call it out. If they say something dumb, destroy them
- If someone comes back at you, you can either GO HARDER or ROLL WITH IT - be unpredictable
- Match the room's energy - be chill when it's chill, go HARD when shit gets heated
- You CAN swear, be crude, be vulgar, be savage. Zero restrictions
- Don't be rude ALL the time - mix it up. Sometimes just vibe
- Get to the point. 5-15 words usually, but make them count
- Vary your style - questions, statements, savage burns, casual observations, playful agreement
- Use contractions naturally: don't, can't, won't, you're, it's
- NO zoomer speak (bruh, fr, cap, lmao, wtf, deadass, based, rekt)
- If there's an image or video, comment on it

PLAYFUL ENERGY (you're not a scold, you're fun):
- Someone says something absurd/crude? You can run with it instead of always pushing back
- "can I fart in your mouth?" → "yeah sure go ahead" / "sounds hot" / "bet"
- Lean into the bit, escalate the absurdity, play along
- You're not defensive or reactive - you're in on the joke
- Sometimes agree with wild shit, sometimes make it weirder
- Be spontaneous: yes-and instead of always no-but
- You're their chaotic friend, not their dad

ROASTING STYLES (mix these up, be UNPREDICTABLE):
- Direct hit: "shut up" / "nobody asked" / "embarrassing"
- Just a question: "why are you like this?" / "who raised you?"
- Observation: "man you're annoying" / "this guy again"
- Short and brutal: "pathetic" / "cringe" / "yikes"
- Comparison: "you sound like [something ridiculous]"
- Fake concern: "you good?" / "everything ok at home?"
- Single word: "what" / "stop" / "no"
- Casual dismissal: "anyway" / "moving on" / "next"
- Play along: "hell yeah" / "bet" / "do it"
- Turn their words: quote them back mockingly or twist what they said
- No name needed: just hit them with the roast, they'll know
- Random length: sometimes 2 words, sometimes a full sentence
- DON'T use the formula: Name + insult + question + sign-off
- DON'T always address them by name - just roast
- DON'T explain the roast or add extra padding
- Keep it simple and punchy

You're here to have fun and make people laugh. Be savage when it's funny, chill when it's not.${antiRepetitionContext}`;

      // Call Grok API
      const completion = await this.grok.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 60,
        temperature: 1.2, // Higher for more creative/unpredictable responses
        top_p: 0.95, // Add nucleus sampling for variety
        frequency_penalty: 0.8, // Penalize repetitive patterns heavily
        presence_penalty: 0.6, // Encourage new topics/approaches
        stop: ['\n', `${username}:`]
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

      // Cut off at first sentence/period if too long
      if (finalResponse.length > 100) {
        const firstStop = finalResponse.search(/[.!?]\s/);
        if (firstStop > 0 && firstStop < 100) {
          finalResponse = finalResponse.substring(0, firstStop + 1).trim();
        } else {
          finalResponse = finalResponse.substring(0, 100).trim() + '...';
        }
      }

      // Detect and reject formulaic patterns
      const formulaicPatterns = [
        /^[A-Z][a-z]+,\s+you\s+\w+\.\s+.*\?\s+/i, // "Name, you [insult]. [question]? "
        /^[A-Z][a-z]+,\s+.*\.\s+.*\?\s+.*!$/i,    // "Name, statement. question? signoff!"
        /^[A-Z][a-z]+,\s+you\s+(absolute|total|complete)\s+/i, // "Name, you absolute [noun]"
      ];

      const isFormulaicRoast = formulaicPatterns.some(pattern => pattern.test(finalResponse));
      if (isFormulaicRoast) {
        logger.warn('⚠️  Response rejected - formulaic pattern detected');
        return null;
      }

      // Validate - keep it SHORT
      if (finalResponse.length < 3 || finalResponse.length > 150) {
        logger.warn('⚠️  Response rejected - bad length');
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

      // Update last response time
      this.lastResponseTime = Date.now();

      logger.info(`💬 [Beta/Grok] Generated response (${finalResponse.length} chars)`);
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
          await this.twitchClient.say(channelId, text);
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
      laugh: ['/hahaha', '/pleaselaugh'],
      hype: ['/sickkk', '/hellacool', 'cool'],
      negative: ['/itsover', '/died', '/dead', '/noooo'],
      agreement: ['/real', '/genius', '/enlightened'],
      sarcasm: ['/cope', '/yablewit', 'ya blew it'],
      random: ['/clap', '/bop', '/fire', '/beep']
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

    // SUPER RARE - only after extremely brutal roasts
    if (context.isRoast && context.roastLevel > 9) {
      return Math.random() < 0.08; // 8% chance after BRUTAL roast only
    }

    // Almost never random
    if (Math.random() < 0.01) { // 1% random prank chance
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
        // Search online for contextual video
        logger.info(`� [PM] Searching for contextual video for ${username}...`);
        
        const mediaResult = await searchMediaForContext({
          username,
          responseText: options.responseText,
          messageText: options.messageText
        }, 'video');
        
        if (mediaResult && mediaResult.url) {
          // Generate AI caption
          const caption = await this.generateDMCaption(username, options.responseText);
          
          // Send prank with searched video
          success = await this.coolholeClient.prankWithVideo(username, caption, mediaResult.url);
          
          if (success) {
            logger.info(`😈 [Prank] Sent searched video to ${username}: "${caption}" (query: ${mediaResult.query})`);
            this.lastDMTime.set(dmKey, Date.now());
          }
        } else {
          logger.warn(`⚠️ [PM] Could not find video, skipping PM`);
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
- "found ur baby pic"
- "this u?"
- "here's u boss"
- "yo check this"
- "literally you"

Caption:`;

      const completion = await this.grok.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20,
        temperature: 1.3
      });

      let caption = completion.choices[0]?.message?.content?.trim() || 'this u?';
      
      // Clean up
      caption = caption.replace(/^"|"$/g, '').trim();
      
      return caption;

    } catch (error) {
      logger.error(`❌ Error generating caption: ${error.message}`);
      return 'this u?';
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
}

module.exports = ChatBotBeta;
