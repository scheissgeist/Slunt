/**
 * Twitter Integration Manager
 * Manages Slunt's Twitter presence and cross-platform coordination
 * Using API (browser automation hits CAPTCHA)
 */

const TwitterApiClient = require('./twitterApiClient');

// Simple logger fallback
const logger = {
  info: (...args) => console.log('ℹ️', ...args),
  warn: (...args) => console.warn('⚠️', ...args),
  error: (...args) => console.error('❌', ...args)
};

class TwitterIntegration {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.client = null;
    this.enabled = process.env.TWITTER_ENABLED === 'true';
    
    // Autonomous posting settings
    this.autonomousPostingEnabled = true; // Slunt tweets when he feels like it
    this.lastAutonomousPost = Date.now();
    
    logger.info('🐦 [Twitter] Integration initialized (API MODE)');
  }

  /**
   * Initialize Twitter API client
   */
  async initialize() {
    if (!this.enabled) {
      logger.info('⏭️ [Twitter] Integration disabled');
      return false;
    }

    try {
      this.client = new TwitterApiClient({
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
        maxTweetsPerDay: parseInt(process.env.TWITTER_MAX_TWEETS_PER_DAY || '50')
      });

      await this.client.connect();
      
      logger.info('✅ [Twitter] API integration ready');
      this.startAutonomousPosting();
      return true;
    } catch (error) {
      logger.error('❌ [Twitter] API initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Post a tweet
   */
  async tweet(text) {
    if (!this.client) {
      logger.warn('⚠️ [Twitter] Not connected, cannot tweet');
      return false;
    }

    return await this.client.tweet(text);
  }

  /**
   * Reply to a tweet
   */
  async reply(tweetId, text) {
    if (!this.client) {
      logger.warn('⚠️ [Twitter] Not connected, cannot reply');
      return false;
    }

    return await this.client.reply(tweetId, text);
  }

  /**
   * Queue a tweet
   */
  queueTweet(text, priority = 1) {
    if (!this.client) return;
    this.client.queueTweet(text, priority);
  }

  /**
   * Start autonomous posting - Slunt tweets when he feels like it (every 2-6 hours)
   */
  startAutonomousPosting() {
    if (!this.autonomousPostingEnabled) {
      logger.info('🐦 [Twitter] Autonomous posting disabled');
      return;
    }

    logger.info('🐦 [Twitter] Slunt will tweet his insights spontaneously...');
    
    const scheduleNextTweet = () => {
      // 2-6 hours between tweets (more frequent)
      const delay = (2 + Math.random() * 4) * 60 * 60 * 1000;
      const hours = Math.round(delay/1000/60/60 * 10) / 10;
      logger.info(`🐦 [Twitter] Next insight in ~${hours} hours`);
      
      setTimeout(async () => {
        try {
          await this.postAutonomousTweet();
        } catch (error) {
          logger.error('❌ [Twitter] Autonomous tweet failed:', error.message);
        }
        scheduleNextTweet();
      }, delay);
    };

    scheduleNextTweet();
    
    // Start monitoring mentions (check every 2 minutes)
    this.startMentionMonitoring();
  }

  /**
   * Monitor Twitter mentions and reply to them
   */
  startMentionMonitoring() {
    logger.info('🐦 [Twitter] Starting mention monitoring...');
    
    this.lastMentionCheck = Date.now();
    this.processedMentions = new Set();
    
    // Check for mentions every 2 minutes
    setInterval(async () => {
      try {
        await this.checkAndReplyToMentions();
      } catch (error) {
        logger.error('❌ [Twitter] Mention check failed:', error.message);
      }
    }, 2 * 60 * 1000); // 2 minutes
    
    // Do first check after 30 seconds
    setTimeout(async () => {
      try {
        await this.checkAndReplyToMentions();
      } catch (error) {
        logger.error('❌ [Twitter] Initial mention check failed:', error.message);
      }
    }, 30000);
  }

  /**
   * Check for new mentions and reply to them
   */
  async checkAndReplyToMentions() {
    if (!this.client) return;

    try {
      // Get recent mentions using API
      const mentions = await this.client.client.v2.userMentionTimeline(
        '1987664077917949952',
        { 
          max_results: 10,
          'tweet.fields': 'created_at,author_id,conversation_id'
        }
      );

      if (!mentions.data || mentions.data.data.length === 0) {
        return;
      }

      for (const mention of mentions.data.data) {
        // Skip if already processed
        if (this.processedMentions.has(mention.id)) {
          continue;
        }

        // Skip if it's our own tweet
        if (mention.author_id === '1987664077917949952') {
          this.processedMentions.add(mention.id);
          continue;
        }

        // Mark as processed
        this.processedMentions.add(mention.id);

        logger.info(`🐦 [Twitter] New mention from ${mention.author_id}: "${mention.text}"`);

        // Generate reply using Slunt's personality
        const reply = await this.generateReplyToMention(mention.text);

        if (reply && reply.length > 0) {
          // Reply to the mention
          await this.client.reply(mention.id, reply);
          logger.info(`✅ [Twitter] Replied to mention: "${reply}"`);
          
          // Wait a bit between replies to seem more natural (5-10 seconds)
          await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));
        }
      }

      // Clean up old processed mentions (keep last 100)
      if (this.processedMentions.size > 100) {
        const mentionsArray = Array.from(this.processedMentions);
        this.processedMentions = new Set(mentionsArray.slice(-100));
      }

    } catch (error) {
      logger.error('❌ [Twitter] Error checking mentions:', error.message);
    }
  }

  /**
   * Generate a reply to a mention
   */
  async generateReplyToMention(mentionText) {
    // Remove @mentions from the text for processing
    const cleanText = mentionText.replace(/@\w+/g, '').trim();

    const prompts = [
      `someone on twitter said: "${cleanText}" - give a witty, clever response (short, under 280 chars). Be smart and funny, not just reactive. NO cringe zoomer slang (bruh/fr/cap/based/bussin/ngl/yooo/fire/savage). Find the angle.`,
      `reply to this tweet: "${cleanText}" (brief but clever - make an observation, find the humor, be genuine). Avoid generic reactions and tryhard internet speak.`,
      `respond to: "${cleanText}" (short twitter reply with actual wit. Be dry and smart, not generic hype. Skip: bruh/fr/cap/ngl/yooo/fire/insane/wild/savage)`
    ];

    const prompt = prompts[Math.floor(Math.random() * prompts.length)];

    try {
      let reply = null;
      
      if (this.chatBot && this.chatBot.generateWithGrok) {
        reply = await this.chatBot.generateWithGrok(prompt, { maxTokens: 100 });
      } else if (this.chatBot && this.chatBot.generateResponse) {
        reply = await this.chatBot.generateResponse(prompt, 'twitter_mention', 'twitter');
      }

      if (!reply) {
        // Clever fallbacks
        const fallbacks = [
          "yeah honestly",
          "facts",
          "real",
          "nah u right",
          "valid",
          "interesting",
          "correct",
          "haha nice",
          "wait what",
          "noted"
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      // Clean up reply
      reply = reply.trim()
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .replace(/^["']|["']$/g, '');

      // Truncate if too long
      if (reply.length > 280) {
        reply = reply.substring(0, 277) + '...';
      }

      return reply;
    } catch (error) {
      logger.error('❌ [Twitter] Failed to generate reply:', error.message);
      return "yo";
    }
  }

  /**
   * Post an autonomous tweet
   */
  async postAutonomousTweet() {
    // Make sure at least 1 hour has passed (reduced from 2 hours)
    const timeSinceLastPost = Date.now() - this.lastAutonomousPost;
    if (timeSinceLastPost < 1 * 60 * 60 * 1000) {
      logger.info('🐦 [Twitter] Too soon since last tweet, skipping');
      return;
    }

    logger.info('🐦 [Twitter] Slunt is crafting a tweet...');
    
    const tweet = await this.generateAutonomousTweet();
    if (tweet && tweet.length > 0 && tweet.length <= 280) {
      const success = await this.tweet(tweet);
      if (success) {
        this.lastAutonomousPost = Date.now();
        logger.info('✅ [Twitter] Slunt shared his wisdom');
      }
    } else {
      logger.warn('⚠️ [Twitter] Generated tweet was invalid:', tweet);
    }
  }

  /**
   * Generate an autonomous tweet using Slunt's personality
   */
  async generateAutonomousTweet() {
    // Gather context from Slunt's current state
    let contextParts = [];
    
    try {
      // Get mood and mental state
      if (this.chatBot?.stateTracker) {
        const mood = this.chatBot.stateTracker.getMood?.();
        const mentalState = this.chatBot.stateTracker.getState?.();
        if (mood) contextParts.push(`current mood: ${mood}`);
        if (mentalState) contextParts.push(`mental state: ${mentalState}`);
      }

      // Get recent dream
      if (this.chatBot?.memory?.getRandomDream) {
        const dream = this.chatBot.memory.getRandomDream();
        if (dream) contextParts.push(`recent dream: "${dream}"`);
      }

      // Get recent interactions/topics
      if (this.chatBot?.memory?.getRecentTopics) {
        const topics = this.chatBot.memory.getRecentTopics(3);
        if (topics && topics.length > 0) {
          contextParts.push(`things people talked about lately: ${topics.join(', ')}`);
        }
      }

      // Get autism fixation
      if (this.chatBot?.autismFixations?.getCurrentFixation) {
        const fixation = this.chatBot.autismFixations.getCurrentFixation();
        if (fixation) contextParts.push(`currently fixated on: ${fixation.topic}`);
      }

      // Get funny recent conversations
      if (this.chatBot?.memory?.getRecentMessages) {
        const recentMsgs = this.chatBot.memory.getRecentMessages('coolhole', 10);
        if (recentMsgs && recentMsgs.length > 0) {
          // Look for funny exchanges
          const funnyMoments = recentMsgs.filter(m => 
            m.message.includes('lmao') || m.message.includes('lol') || 
            m.message.includes('haha') || m.message.includes('😂')
          );
          
          if (funnyMoments.length > 0) {
            const moment = funnyMoments[Math.floor(Math.random() * funnyMoments.length)];
            contextParts.push(`funny moment: ${moment.username} said "${moment.message}"`);
          }
          
          const msgPreview = recentMsgs.slice(-5).map(m => `${m.username}: ${m.message}`).join(' | ');
          contextParts.push(`recent coolhole chatter: ${msgPreview}`);
        }
      }
      
      // Get memorable moments
      if (this.chatBot?.memory?.memorableMoments && this.chatBot.memory.memorableMoments.length > 0) {
        const moment = this.chatBot.memory.memorableMoments[
          Math.floor(Math.random() * this.chatBot.memory.memorableMoments.length)
        ];
        if (moment) contextParts.push(`memorable: "${moment.content || moment}"`);
      }
    } catch (err) {
      logger.warn('⚠️ [Twitter] Error gathering context:', err.message);
    }

    // Build context-aware prompt
    const contextStr = contextParts.length > 0 
      ? `Context about you right now: ${contextParts.join('; ')}. ` 
      : '';

    const prompts = [
      `${contextStr}write an interesting observation or thought based on your current state (under 280 chars). be witty and clever, not generic. NO cringe internet slang (bruh/fr/cap/based/bussin/ngl/yooo/fire/savage/insane/wild). Make it smart.`,
      `${contextStr}say something genuinely funny or insightful that reflects what's on your mind. clever angle, dry humor, actual substance. skip tryhard reactions and zoomer speak.`,
      `${contextStr}share an interesting take influenced by your mood and recent experiences (short tweet). be smart and observational, not just vibing or energy posting.`,
      `${contextStr}write something that makes people think or laugh. clever > loud. avoid generic hype language (fire/insane/wild/savage/yooo/ngl).`,
      `${contextStr}one sharp observation about anything you've been thinking about. be witty, not just enthusiastic. skip: bruh/fr/cap/based/bussin/ngl/fire/savage.`,
      `${contextStr}share a funny observation about something that happened recently. make it relatable and clever, not just recapping.`,
      `${contextStr}riff on something from recent conversations. turn it into a funny insight or clever observation.`
    ];

    const prompt = prompts[Math.floor(Math.random() * prompts.length)];

    try {
      // Use the chatBot's AI to generate a tweet
      let tweet = null;
      
      if (this.chatBot && this.chatBot.generateWithGrok) {
        tweet = await this.chatBot.generateWithGrok(prompt, { maxTokens: 100 });
      } else if (this.chatBot && this.chatBot.generateResponse) {
        tweet = await this.chatBot.generateResponse(prompt, 'system', 'twitter');
      }

      if (!tweet) {
        // Clever fallback tweets
        const fallbacks = [
          "just vibing",
          "another day another mystery",
          "honestly? chaos",
          "thinking thoughts",
          "it be like that sometimes",
          "reality is overrated",
          "today's vibe: questionable",
          "brain full of static",
          "existence is fascinating",
          "the audacity of being alive"
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      // Clean up tweet
      tweet = tweet.trim()
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .replace(/^["']|["']$/g, ''); // Remove quotes at start/end

      // Truncate if too long
      if (tweet.length > 280) {
        tweet = tweet.substring(0, 277) + '...';
      }

      logger.info(`🐦 [Twitter] Generated: "${tweet}"`);
      return tweet;
    } catch (error) {
      logger.error('❌ [Twitter] Failed to generate tweet:', error.message);
      return null;
    }
  }

  /**
   * Handle cross-platform announcement (from Discord/Coolhole to Twitter)
   */
  async announceToTwitter(message, platform, username) {
    // Example: Someone said something funny in Discord, tweet it
    const tweet = `${username} just said in ${platform}: "${message}"`;
    
    if (tweet.length <= 280) {
      this.queueTweet(tweet, 3); // High priority
    }
  }

  /**
   * Disconnect
   */
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      logger.info('👋 [Twitter] Disconnected');
    }
  }
}

module.exports = TwitterIntegration;
