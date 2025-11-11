/**
 * Twitter/X Client - Browser-based posting
 * Slunt logs in like a human and posts tweets via Puppeteer
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

// Simple logger fallback
const logger = {
  info: (...args) => console.log('ℹ️', ...args),
  warn: (...args) => console.warn('⚠️', ...args),
  error: (...args) => console.error('❌', ...args)
};

puppeteer.use(StealthPlugin());

// Helper function for delays
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Random human-like delay
const humanDelay = () => wait(500 + Math.random() * 1500); // 0.5-2 seconds

class TwitterClient {
  constructor(config = {}) {
    this.username = config.username || process.env.TWITTER_USERNAME;
    this.password = config.password || process.env.TWITTER_PASSWORD;
    this.profilePath = config.profilePath || path.join(__dirname, '../../.twitter-profile');
    
    this.browser = null;
    this.page = null;
    this.connected = false;
    
    // Rate limiting
    this.tweetsToday = 0;
    this.maxTweetsPerDay = config.maxTweetsPerDay || 50;
    this.lastResetDate = new Date().toDateString();
    
    // Tweet queue
    this.tweetQueue = [];
    this.isProcessingQueue = false;
    
    logger.info('🐦 [Twitter] Client initialized');
  }

  /**
   * Connect and login to Twitter
   */
  async connect() {
    try {
      logger.info('🐦 [Twitter] Launching browser...');
      
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled', // Hide automation
          '--disable-dev-shm-usage',
          '--start-maximized',
          '--disable-web-security',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        userDataDir: this.profilePath
      });

      this.page = await this.browser.newPage();
      
      // Remove webdriver flag
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
        
        // Mock plugins and languages like a real browser
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });
      
      // Set viewport
      await this.page.setViewport({ width: 1280, height: 720 });
      
      // Navigate to Twitter
      logger.info('🐦 [Twitter] Navigating to twitter.com...');
      await this.page.goto('https://twitter.com/home', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Check if already logged in
      await new Promise(resolve => setTimeout(resolve, 2000));
      const isLoggedIn = await this.checkIfLoggedIn();

      if (!isLoggedIn) {
        logger.info('🐦 [Twitter] Not logged in, attempting login...');
        await this.login();
      } else {
        logger.info('✅ [Twitter] Already logged in');
      }

      this.connected = true;
      logger.info('✅ [Twitter] Connected successfully');
      
      return true;
    } catch (error) {
      logger.error('❌ [Twitter] Connection failed:', error.message);
      return false;
    }
  }

  /**
   * Check if already logged in
   */
  async checkIfLoggedIn() {
    try {
      // Look for compose tweet button (only visible when logged in)
      const tweetButton = await this.page.$('a[href="/compose/tweet"]');
      return tweetButton !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Login to Twitter
   */
  async login() {
    try {
      // Go directly to login page
      logger.info('🐦 [Twitter] Navigating to login page...');
      await this.page.goto('https://twitter.com/i/flow/login', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      await humanDelay();
      await wait(2000); // Extra wait for page to settle

      // Take screenshot for debugging
      await this.page.screenshot({ path: 'twitter-login-1.png', fullPage: true });
      logger.info('📸 Screenshot saved: twitter-login-1.png');

      // Random mouse movement to seem human
      await this.page.mouse.move(200 + Math.random() * 300, 200 + Math.random() * 300);
      await humanDelay();

      // Enter username (try multiple selectors)
      logger.info('🐦 [Twitter] Entering username...');
      const usernameSelector = 'input[autocomplete="username"], input[name="text"]';
      await this.page.waitForSelector(usernameSelector, { timeout: 10000 });
      
      // Click the field first (human behavior)
      await this.page.click(usernameSelector);
      await humanDelay();
      
      // Type slowly like a human (150-250ms per character)
      for (const char of this.username) {
        await this.page.keyboard.type(char, { delay: 150 + Math.random() * 100 });
      }
      
      await humanDelay();
      
      // Look for and click the Next button
      await wait(1000);
      try {
        // Try to find the "Next" button specifically
        const nextButtonSelector = 'div[role="button"]:has-text("Next"), button:has-text("Next"), span:has-text("Next")';
        await this.page.keyboard.press('Enter');
      } catch (e) {
        // Fallback to Enter
        await this.page.keyboard.press('Enter');
      }
      
      await humanDelay();
      await wait(4000); // Wait longer for verification check

      // Take screenshot after clicking next
      await this.page.screenshot({ path: 'twitter-login-2.png', fullPage: true });
      logger.info('📸 Screenshot saved: twitter-login-2.png');

      // Check for unusual activity / verification challenge
      const verificationText = await this.page.$('input[data-testid="ocfEnterTextTextInput"]');
      if (verificationText) {
        logger.warn('⚠️ [Twitter] VERIFICATION CHALLENGE DETECTED!');
        logger.warn('⚠️ [Twitter] Twitter is asking for additional verification.');
        logger.warn('⚠️ [Twitter] The browser window is open - please complete it manually.');
        logger.warn('⚠️ [Twitter] You have 3 minutes to complete verification...');
        await wait(180000); // Wait 3 minutes
        logger.info('🐦 [Twitter] Continuing after verification wait...');
      }

      // Check for "Unusual login" message
      const pageText = await this.page.content();
      if (pageText.includes('unusual login') || pageText.includes('verify') || pageText.includes('Verify')) {
        logger.warn('⚠️ [Twitter] Unusual login activity detected!');
        logger.warn('⚠️ [Twitter] Complete verification in the browser window (3 minutes)...');
        await wait(180000);
      }

      // Check for password field (with longer timeout)
      logger.info('🐦 [Twitter] Looking for password field...');
      const passwordSelector = 'input[name="password"], input[type="password"]';
      
      try {
        await this.page.waitForSelector(passwordSelector, { timeout: 15000 });
      } catch (pwdError) {
        // Password field not found - likely needs manual intervention
        logger.error('❌ [Twitter] Password field not found');
        logger.warn('⚠️ [Twitter] Twitter might be blocking automated login or needs verification');
        logger.warn('⚠️ [Twitter] SOLUTION: Complete the login manually in the browser window');
        logger.warn('⚠️ [Twitter] Once you log in manually ONCE, the browser profile will remember you');
        logger.warn('⚠️ [Twitter] Waiting 3 minutes for manual login...');
        await wait(180000);
        
        // After manual intervention, check if logged in
        const isLoggedIn = await this.checkIfLoggedIn();
        if (isLoggedIn) {
          logger.info('✅ [Twitter] Manual login successful! Profile saved for future use.');
          return;
        } else {
          throw new Error('Manual login incomplete - please log in through the browser window');
        }
      }

      // Random mouse movement before password
      await this.page.mouse.move(300 + Math.random() * 200, 400 + Math.random() * 100);
      await humanDelay();

      // Enter password
      logger.info('🐦 [Twitter] Entering password...');
      await this.page.click(passwordSelector);
      await humanDelay();
      
      // Type password slowly
      for (const char of this.password) {
        await this.page.keyboard.type(char, { delay: 150 + Math.random() * 100 });
      }
      
      await humanDelay();
      
      // Click "Log in" or press Enter
      await wait(1000);
      await this.page.keyboard.press('Enter');
      
      // Wait for navigation to complete
      await wait(8000); // Longer wait for redirect
      
      // Take final screenshot
      await this.page.screenshot({ path: 'twitter-login-3.png', fullPage: true });
      logger.info('📸 Screenshot saved: twitter-login-3.png');
      
      logger.info('✅ [Twitter] Login successful');
    } catch (error) {
      logger.error('❌ [Twitter] Login failed:', error.message);
      logger.info('💡 [Twitter] TIP: Complete login manually in the browser window');
      logger.info('💡 [Twitter] Once logged in manually, the profile will be saved for future use');
      throw error;
    }
  }

  /**
   * Post a tweet
   */
  async tweet(text) {
    try {
      // Check rate limit
      this.checkRateLimit();

      if (this.tweetsToday >= this.maxTweetsPerDay) {
        logger.warn(`⚠️ [Twitter] Daily tweet limit reached (${this.maxTweetsPerDay})`);
        return false;
      }

      logger.info(`🐦 [Twitter] Posting tweet: "${text.substring(0, 50)}..."`);

      // Navigate to home if not there
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/home')) {
        await this.page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' });
      }

      // Find the tweet compose box
      await this.page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 10000 });
      
      // Click and type tweet
      await this.page.click('[data-testid="tweetTextarea_0"]');
      await wait(500);
      await this.page.keyboard.type(text, { delay: 50 });
      
      // Click "Post" button
      await wait(1000);
      await this.page.click('[data-testid="tweetButtonInline"]');
      
      // Wait for tweet to post
      await wait(2000);

      this.tweetsToday++;
      logger.info(`✅ [Twitter] Tweet posted successfully (${this.tweetsToday}/${this.maxTweetsPerDay} today)`);
      
      return true;
    } catch (error) {
      logger.error('❌ [Twitter] Failed to post tweet:', error.message);
      return false;
    }
  }

  /**
   * Reply to a tweet
   */
  async reply(tweetUrl, replyText) {
    try {
      logger.info(`🐦 [Twitter] Replying to tweet: ${tweetUrl}`);

      // Navigate to tweet
      await this.page.goto(tweetUrl, { waitUntil: 'networkidle2' });
      await wait(2000);

      // Find reply box
      await this.page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 10000 });
      
      // Click and type reply
      await this.page.click('[data-testid="tweetTextarea_0"]');
      await wait(500);
      await this.page.keyboard.type(replyText, { delay: 50 });
      
      // Click "Reply" button
      await wait(1000);
      await this.page.click('[data-testid="tweetButtonInline"]');
      
      await wait(2000);

      this.tweetsToday++;
      logger.info('✅ [Twitter] Reply posted successfully');
      
      return true;
    } catch (error) {
      logger.error('❌ [Twitter] Failed to post reply:', error.message);
      return false;
    }
  }

  /**
   * Check and reset daily rate limit
   */
  checkRateLimit() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.tweetsToday = 0;
      this.lastResetDate = today;
      logger.info('🐦 [Twitter] Daily tweet count reset');
    }
  }

  /**
   * Queue a tweet for posting
   */
  queueTweet(text, priority = 1) {
    this.tweetQueue.push({ text, priority, timestamp: Date.now() });
    this.tweetQueue.sort((a, b) => b.priority - a.priority);
    
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process tweet queue with delays
   */
  async processQueue() {
    if (this.isProcessingQueue || this.tweetQueue.length === 0) return;
    
    this.isProcessingQueue = true;

    while (this.tweetQueue.length > 0) {
      const { text } = this.tweetQueue.shift();
      
      await this.tweet(text);
      
      // Wait 2-5 minutes between tweets to seem human
      if (this.tweetQueue.length > 0) {
        const delay = 120000 + Math.random() * 180000; // 2-5 min
        logger.info(`🐦 [Twitter] Waiting ${Math.round(delay / 1000)}s before next tweet...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.connected = false;
        logger.info('👋 [Twitter] Disconnected');
      }
    } catch (error) {
      logger.error('❌ [Twitter] Disconnect error:', error.message);
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.browser && this.page;
  }
}

module.exports = TwitterClient;
