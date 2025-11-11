const { TwitterApi } = require('twitter-api-v2');

/**
 * Twitter API Client - Uses official Twitter API v2
 * Much more reliable than browser automation, no bot detection issues
 */
class TwitterApiClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.TWITTER_API_KEY;
    this.apiSecret = config.apiSecret || process.env.TWITTER_API_SECRET;
    this.accessToken = config.accessToken || process.env.TWITTER_ACCESS_TOKEN;
    this.accessSecret = config.accessSecret || process.env.TWITTER_ACCESS_SECRET;
    this.maxTweetsPerDay = config.maxTweetsPerDay || parseInt(process.env.TWITTER_MAX_TWEETS_PER_DAY) || 50;
    
    this.client = null;
    this.tweetCount = 0;
    this.lastResetDate = new Date().toDateString();
    this.tweetQueue = [];
    this.isProcessingQueue = false;

    this.log = console;
  }

  /**
   * Initialize the Twitter API client
   */
  async connect() {
    try {
      this.log.info('🐦 [Twitter API] Initializing...');
      
      if (!this.apiKey || !this.apiSecret || !this.accessToken || !this.accessSecret) {
        throw new Error('Missing Twitter API credentials. Check your .env file.');
      }

      // Create Twitter API client with OAuth 1.0a credentials
      this.client = new TwitterApi({
        appKey: this.apiKey,
        appSecret: this.apiSecret,
        accessToken: this.accessToken,
        accessSecret: this.accessSecret,
      });

      // Verify credentials work
      const user = await this.client.v2.me();
      this.log.info(`🐦 [Twitter API] Connected as @${user.data.username}`);
      
      return true;
    } catch (error) {
      this.log.error('❌ [Twitter API] Connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Check and reset daily tweet count if needed
   */
  checkDailyReset() {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.log.info('🐦 [Twitter API] New day, resetting tweet count');
      this.tweetCount = 0;
      this.lastResetDate = today;
    }
  }

  /**
   * Check if we can tweet (rate limit check)
   */
  canTweet() {
    this.checkDailyReset();
    return this.tweetCount < this.maxTweetsPerDay;
  }

  /**
   * Post a tweet
   * @param {string} text - Tweet content (max 280 chars)
   * @returns {Object} Tweet data
   */
  async tweet(text) {
    try {
      if (!this.client) {
        throw new Error('Twitter client not connected. Call connect() first.');
      }

      if (!this.canTweet()) {
        throw new Error(`Daily tweet limit reached (${this.maxTweetsPerDay} tweets/day)`);
      }

      // Truncate if too long
      const tweetText = text.length > 280 ? text.substring(0, 277) + '...' : text;

      this.log.info(`🐦 [Twitter API] Posting tweet: "${tweetText}"`);
      
      const tweet = await this.client.v2.tweet(tweetText);
      
      this.tweetCount++;
      this.log.info(`✅ [Twitter API] Tweet posted! (${this.tweetCount}/${this.maxTweetsPerDay} today)`);
      
      return tweet.data;
    } catch (error) {
      this.log.error('❌ [Twitter API] Failed to post tweet:', error.message);
      throw error;
    }
  }

  /**
   * Reply to a tweet
   * @param {string} tweetId - ID of tweet to reply to
   * @param {string} text - Reply content
   */
  async reply(tweetId, text) {
    try {
      if (!this.client) {
        throw new Error('Twitter client not connected. Call connect() first.');
      }

      if (!this.canTweet()) {
        throw new Error(`Daily tweet limit reached (${this.maxTweetsPerDay} tweets/day)`);
      }

      const replyText = text.length > 280 ? text.substring(0, 277) + '...' : text;

      this.log.info(`🐦 [Twitter API] Replying to tweet ${tweetId}: "${replyText}"`);
      
      const reply = await this.client.v2.reply(replyText, tweetId);
      
      this.tweetCount++;
      this.log.info(`✅ [Twitter API] Reply posted! (${this.tweetCount}/${this.maxTweetsPerDay} today)`);
      
      return reply.data;
    } catch (error) {
      this.log.error('❌ [Twitter API] Failed to post reply:', error.message);
      throw error;
    }
  }

  /**
   * Get home timeline
   * @param {number} maxResults - Max tweets to fetch (default 10)
   */
  async getTimeline(maxResults = 10) {
    try {
      if (!this.client) {
        throw new Error('Twitter client not connected. Call connect() first.');
      }

      this.log.info(`🐦 [Twitter API] Fetching timeline (max ${maxResults} tweets)...`);
      
      const timeline = await this.client.v2.homeTimeline({ max_results: maxResults });
      
      return timeline.data.data || [];
    } catch (error) {
      this.log.error('❌ [Twitter API] Failed to fetch timeline:', error.message);
      throw error;
    }
  }

  /**
   * Search for tweets
   * @param {string} query - Search query
   * @param {number} maxResults - Max results (default 10)
   */
  async search(query, maxResults = 10) {
    try {
      if (!this.client) {
        throw new Error('Twitter client not connected. Call connect() first.');
      }

      this.log.info(`🐦 [Twitter API] Searching: "${query}"`);
      
      const results = await this.client.v2.search(query, { max_results: maxResults });
      
      return results.data.data || [];
    } catch (error) {
      this.log.error('❌ [Twitter API] Search failed:', error.message);
      throw error;
    }
  }

  /**
   * Queue a tweet to be posted with delay (for human-like spacing)
   * @param {string} text - Tweet text
   * @param {number} priority - Priority level (lower = sooner)
   */
  queueTweet(text, priority = 5) {
    this.tweetQueue.push({ text, priority, timestamp: Date.now() });
    this.tweetQueue.sort((a, b) => a.priority - b.priority);
    
    this.log.info(`🐦 [Twitter API] Tweet queued (priority ${priority}). Queue size: ${this.tweetQueue.length}`);
    
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process tweet queue with delays
   */
  async processQueue() {
    if (this.isProcessingQueue || this.tweetQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.tweetQueue.length > 0) {
      if (!this.canTweet()) {
        this.log.warn('⚠️ [Twitter API] Daily limit reached, pausing queue');
        break;
      }

      const { text } = this.tweetQueue.shift();
      
      try {
        await this.tweet(text);
        
        // Random delay between tweets (2-5 minutes)
        if (this.tweetQueue.length > 0) {
          const delay = (2 + Math.random() * 3) * 60 * 1000;
          this.log.info(`🐦 [Twitter API] Waiting ${Math.round(delay/1000/60)} minutes before next tweet...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        this.log.error('❌ [Twitter API] Queue processing error:', error.message);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    this.checkDailyReset();
    return {
      tweetsToday: this.tweetCount,
      maxTweetsPerDay: this.maxTweetsPerDay,
      remaining: this.maxTweetsPerDay - this.tweetCount,
      queueLength: this.tweetQueue.length
    };
  }

  /**
   * Disconnect (cleanup)
   */
  async disconnect() {
    this.log.info('🐦 [Twitter API] Disconnecting...');
    this.client = null;
    this.tweetQueue = [];
    this.isProcessingQueue = false;
  }
}

module.exports = TwitterApiClient;
