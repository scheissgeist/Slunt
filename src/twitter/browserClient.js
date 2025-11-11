const { chromium } = require('playwright');
const EventEmitter = require('events');
const path = require('path');

/**
 * Twitter Browser Client - Browser-based automation using Playwright stealth
 * Handles posting, mention checking, and replies without API
 */
class TwitterBrowserClient extends EventEmitter {
  constructor() {
    super();
    this.browser = null;
    this.context = null;
    this.page = null;
    this.connected = false;
    this.loginAttempts = 0;
    this.maxLoginAttempts = 3;

    // Twitter credentials
    this.username = process.env.TWITTER_USERNAME || '';
    this.password = process.env.TWITTER_PASSWORD || '';
    this.storagePath = path.resolve(process.cwd(), 'data', 'twitter-auth-storage.json');

    // Rate limiting
    this.lastActionTime = 0;
    this.minActionDelay = 5000; // 5 seconds minimum between actions

    // Processed mentions tracking
    this.processedMentions = new Set();
    this.maxProcessedMentions = 100;
  }

  /**
   * Connect and login to Twitter
   */
  async connect() {
    try {
      console.log('🐦 [Twitter Browser] Launching browser with persistent profile...');
      
      const userDataDir = path.join(__dirname, '../../.twitter-browser-profile');
      
      this.context = await chromium.launchPersistentContext(userDataDir, {
        headless: process.env.TWITTER_HEADLESS !== 'false',
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        args: [
          '--start-maximized',
          '--window-size=1920,1080',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1'
        }
      });

      this.browser = this.context.browser();
      this.page = this.context.pages()[0] || await this.context.newPage();

      // Enhanced anti-detection
      await this.page.addInitScript(() => {
        // Remove webdriver
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        
        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });
        
        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        });
        
        // Chrome runtime
        window.chrome = { runtime: {} };
        
        // Permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });

      // Check if already logged in
      const currentUrl = this.page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // If page is blank, navigate to twitter ONLY if not doing manual login
      if (currentUrl === 'about:blank' || currentUrl === '') {
        if (process.env.TWITTER_HEADLESS === 'false') {
          console.log('🪟 [Twitter Browser] Browser is VISIBLE - leaving it on blank page for you');
        } else {
          // Only auto-navigate in headless mode
          await this.page.goto('https://twitter.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
          await this.randomDelay(2000, 4000);
        }
      }
      
      const isLoggedIn = await this.checkIfLoggedIn();
      
      if (!isLoggedIn) {
        console.log('🔐 [Twitter Browser] Not logged in');
        
        // If running with visible browser, give user time to log in manually
        if (process.env.TWITTER_HEADLESS === 'false') {
          console.log('🪟 [Twitter Browser] Browser is VISIBLE');
          console.log('💡 LOG IN MANUALLY:');
          console.log('   1. Look for the browser window that just opened');
          console.log('   2. Type twitter.com in the address bar');
          console.log('   3. Log in with your credentials');
          console.log('   4. Complete any verification');
          console.log('   5. Wait on your home feed');
          console.log('⏳ Checking for login every 5 seconds (up to 5 minutes)...');
          console.log('');
          
          // Just wait and check - don't navigate anywhere
          for (let i = 0; i < 60; i++) { // 60 checks * 5 seconds = 300 seconds (5 min)
            await this.randomDelay(5000, 5000);
            
            const manuallyLoggedIn = await this.checkIfLoggedIn();
            if (manuallyLoggedIn) {
              console.log('✅ [Twitter Browser] Detected successful login!');
              this.connected = true;
              this.emit('connected');
              console.log('🐦 [Twitter Browser] Connected successfully');
              return true;
            }
            
            // Log progress every 30 seconds
            if ((i + 1) % 6 === 0) {
              console.log(`⏳ Still waiting for login... (${(i + 1) * 5}s / 300s)`);
            }
          }
          
          console.log('⏰ [Twitter Browser] Timeout after 5 minutes');
          throw new Error('Login timeout - please try again and log in faster');
        }
        
        // If headless, try automatic login (will probably fail)
        await this.login();
      } else {
        console.log('✅ [Twitter Browser] Already logged in');
      }

      this.connected = true;
      this.emit('connected');
      console.log('🐦 [Twitter Browser] Connected successfully');
      
      return true;
    } catch (error) {
      console.error('❌ [Twitter Browser] Connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if currently logged in
   */
  async checkIfLoggedIn() {
    try {
      const currentUrl = this.page.url();
      
      // If URL contains these, we're logged in
      if (currentUrl.includes('/home') || 
          currentUrl.includes('/notifications') ||
          currentUrl.includes('/messages') ||
          currentUrl === 'https://twitter.com/' ||
          currentUrl === 'https://x.com/') {
        
        // Double check by looking for user-specific elements
        const loggedInIndicators = await Promise.all([
          this.page.$('a[href="/compose/tweet"]'),
          this.page.$('a[aria-label="Profile"]'),
          this.page.$('div[data-testid="SideNav_AccountSwitcher_Button"]'),
          this.page.$('a[data-testid="AppTabBar_Home_Link"]')
        ]);
        
        // If any indicator exists, we're logged in
        return loggedInIndicators.some(el => el !== null);
      }
      
      // If on login page, definitely not logged in
      if (currentUrl.includes('/login') || currentUrl.includes('/i/flow/login')) {
        return false;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Login to Twitter
   */
  async login() {
    try {
      this.loginAttempts++;
      
      if (this.loginAttempts > this.maxLoginAttempts) {
        throw new Error('Max login attempts reached');
      }

      console.log(`🔑 [Twitter Browser] Login attempt ${this.loginAttempts}/${this.maxLoginAttempts}`);

      // Navigate to login
      await this.page.goto('https://twitter.com/i/flow/login', { waitUntil: 'domcontentloaded' });
      await this.randomDelay(3000, 4000);

      // Enter username
      console.log('📝 [Twitter Browser] Entering username...');
      const usernameInput = await this.page.waitForSelector('input[autocomplete="username"]', { timeout: 15000 });
      await this.humanType(usernameInput, this.username);
      await this.randomDelay(1000, 1500);
      
      // Click next - try multiple selectors
      console.log('🔘 [Twitter Browser] Clicking Next button...');
      let nextButton = await this.page.$('button:has-text("Next")');
      if (!nextButton) {
        nextButton = await this.page.$('div[role="button"]:has-text("Next")');
      }
      if (!nextButton) {
        // Try generic button selector
        nextButton = await this.page.$('button[type="button"]');
      }
      
      if (nextButton) {
        await this.humanClick(nextButton);
        await this.randomDelay(3000, 4000);
      } else {
        // Try pressing Enter instead
        await usernameInput.press('Enter');
        await this.randomDelay(3000, 4000);
      }

      // Check for unusual activity screen (phone/email verification)
      await this.randomDelay(2000, 3000);
      const unusualActivityInput = await this.page.$('input[data-testid="ocfEnterTextTextInput"]');
      if (unusualActivityInput) {
        console.log('⚠️ [Twitter Browser] Unusual activity detected - trying username verification');
        // Try entering username again for verification
        await this.humanType(unusualActivityInput, this.username);
        await this.randomDelay(1000, 1500);
        
        const verifyButton = await this.page.$('button[data-testid="ocfEnterTextNextButton"]');
        if (verifyButton) {
          await this.humanClick(verifyButton);
          await this.randomDelay(3000, 4000);
        }
      }

      // Wait for password field with multiple attempts
      console.log('🔐 [Twitter Browser] Waiting for password field...');
      let passwordInput = null;
      
      // Try multiple selectors
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[autocomplete="current-password"]',
        'input[name="text"][type="password"]'
      ];

      for (const selector of passwordSelectors) {
        try {
          passwordInput = await this.page.waitForSelector(selector, { timeout: 5000 });
          if (passwordInput) {
            console.log(`✅ [Twitter Browser] Found password field with selector: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`⏭️ [Twitter Browser] Password selector failed: ${selector}`);
        }
      }

      if (!passwordInput) {
        // Take screenshot for debugging
        const screenshotPath = path.join(__dirname, '../../debug-twitter-login.png');
        await this.page.screenshot({ path: screenshotPath });
        console.log(`📸 [Twitter Browser] Screenshot saved: ${screenshotPath}`);
        throw new Error('Could not find password field - check debug-twitter-login.png');
      }

      // Enter password
      console.log('🔐 [Twitter Browser] Entering password...');
      await this.humanType(passwordInput, this.password);
      await this.randomDelay(1000, 1500);

      // Click login - try multiple selectors
      console.log('🔘 [Twitter Browser] Clicking Login button...');
      let loginButton = await this.page.$('button[data-testid="LoginForm_Login_Button"]');
      if (!loginButton) {
        loginButton = await this.page.$('div[role="button"]:has-text("Log in")');
      }
      if (!loginButton) {
        // Try pressing Enter on password field
        await passwordInput.press('Enter');
        await this.randomDelay(3000, 5000);
      } else {
        await this.humanClick(loginButton);
        await this.randomDelay(3000, 5000);
      }

      // Wait for home page or handle additional verification
      try {
        await this.page.waitForURL('**/home', { timeout: 15000 });
        console.log('✅ [Twitter Browser] Login successful');
        this.loginAttempts = 0;
        return true;
      } catch (urlError) {
        // Check if we're on a verification page
        const currentUrl = this.page.url();
        console.log(`⚠️ [Twitter Browser] Current URL after login: ${currentUrl}`);
        
        if (currentUrl.includes('account/access') || currentUrl.includes('account/login_verification')) {
          console.log('⚠️ [Twitter Browser] Additional verification required');
          console.log('💡 Set TWITTER_HEADLESS=false and complete verification manually');
          throw new Error('Additional verification required - set TWITTER_HEADLESS=false');
        }
        
        throw urlError;
      }
    } catch (error) {
      console.error('❌ [Twitter Browser] Login failed:', error.message);
      throw error;
    }
  }

  /**
   * Post a tweet
   */
  async tweet(text) {
    try {
      await this.ensureConnected();
      await this.respectRateLimit();

      console.log(`🐦 [Twitter Browser] Posting tweet: "${text.substring(0, 50)}..."`);

      // Navigate to home if not there
      if (!this.page.url().includes('/home')) {
        await this.page.goto('https://twitter.com/home', { waitUntil: 'domcontentloaded' });
        await this.randomDelay(2000, 3000);
      }

      // Click compose button or find tweet box
      let tweetBox = await this.page.$('div[data-testid="tweetTextarea_0"]');
      
      if (!tweetBox) {
        // Try clicking compose button
        const composeButton = await this.page.$('a[href="/compose/tweet"]');
        if (composeButton) {
          await this.humanClick(composeButton);
          await this.randomDelay(1000, 2000);
          tweetBox = await this.page.waitForSelector('div[data-testid="tweetTextarea_0"]', { timeout: 5000 });
        }
      }

      if (!tweetBox) {
        throw new Error('Could not find tweet compose box');
      }

      // Type the tweet
      await this.humanClick(tweetBox);
      await this.randomDelay(300, 600);
      await this.humanType(tweetBox, text);
      await this.randomDelay(1000, 2000);

      // Find and click tweet button
      const tweetButton = await this.page.$('button[data-testid="tweetButtonInline"]') ||
                         await this.page.$('div[data-testid="tweetButton"]') ||
                         await this.page.$('button:has-text("Post")');
      
      if (!tweetButton) {
        throw new Error('Could not find tweet button');
      }

      await this.humanClick(tweetButton);
      await this.randomDelay(2000, 3000);

      console.log('✅ [Twitter Browser] Tweet posted successfully');
      this.lastActionTime = Date.now();
      
      return { success: true };
    } catch (error) {
      console.error('❌ [Twitter Browser] Failed to post tweet:', error.message);
      throw error;
    }
  }

  /**
   * Check for new mentions and return them
   */
  async checkMentions() {
    try {
      await this.ensureConnected();
      await this.respectRateLimit();

      console.log('🔍 [Twitter Browser] Checking for mentions...');

      // Navigate to notifications
      await this.page.goto('https://twitter.com/notifications/mentions', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      await this.randomDelay(2000, 3000);

      // Wait for timeline to load
      await this.page.waitForSelector('article[data-testid="tweet"]', { timeout: 10000 }).catch(() => null);
      await this.randomDelay(1000, 2000);

      // Get all tweet articles
      const tweets = await this.page.$$('article[data-testid="tweet"]');
      const mentions = [];

      for (const tweet of tweets.slice(0, 10)) { // Check first 10 mentions
        try {
          // Get tweet ID from the article
          const tweetLink = await tweet.$('a[href*="/status/"]');
          if (!tweetLink) continue;

          const href = await tweetLink.getAttribute('href');
          const tweetId = href.match(/\/status\/(\d+)/)?.[1];
          if (!tweetId || this.processedMentions.has(tweetId)) continue;

          // Get tweet text
          const textElement = await tweet.$('div[data-testid="tweetText"]');
          const text = textElement ? await textElement.innerText() : '';

          // Get username
          const usernameElement = await tweet.$('div[data-testid="User-Name"] a[role="link"]');
          const username = usernameElement ? await usernameElement.innerText() : '';

          // Skip if this is our own tweet
          if (username.toLowerCase().includes(this.username.toLowerCase())) {
            this.processedMentions.add(tweetId);
            continue;
          }

          mentions.push({
            id: tweetId,
            text: text,
            username: username,
            link: `https://twitter.com${href}`
          });

        } catch (error) {
          console.error('⚠️ [Twitter Browser] Error parsing tweet:', error.message);
          continue;
        }
      }

      console.log(`📊 [Twitter Browser] Found ${mentions.length} new mentions`);
      this.lastActionTime = Date.now();
      
      return mentions;
    } catch (error) {
      console.error('❌ [Twitter Browser] Failed to check mentions:', error.message);
      return [];
    }
  }

  /**
   * Reply to a tweet
   */
  async reply(tweetId, text, tweetLink = null) {
    try {
      await this.ensureConnected();
      await this.respectRateLimit();

      console.log(`💬 [Twitter Browser] Replying to tweet ${tweetId}: "${text.substring(0, 50)}..."`);

      // Navigate to the tweet
      const url = tweetLink || `https://twitter.com/i/status/${tweetId}`;
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(2000, 3000);

      // Find reply button and click it
      const replyButton = await this.page.$('button[data-testid="reply"]');
      if (!replyButton) {
        throw new Error('Could not find reply button');
      }

      await this.humanClick(replyButton);
      await this.randomDelay(1000, 2000);

      // Wait for reply box
      const replyBox = await this.page.waitForSelector('div[data-testid="tweetTextarea_0"]', { timeout: 5000 });
      
      // Type the reply
      await this.humanClick(replyBox);
      await this.randomDelay(300, 600);
      await this.humanType(replyBox, text);
      await this.randomDelay(1000, 2000);

      // Find and click reply button
      const replySubmitButton = await this.page.$('button[data-testid="tweetButtonInline"]') ||
                               await this.page.$('div[data-testid="tweetButton"]');
      
      if (!replySubmitButton) {
        throw new Error('Could not find reply submit button');
      }

      await this.humanClick(replySubmitButton);
      await this.randomDelay(2000, 3000);

      console.log('✅ [Twitter Browser] Reply posted successfully');
      
      // Mark as processed
      this.processedMentions.add(tweetId);
      if (this.processedMentions.size > this.maxProcessedMentions) {
        const toDelete = Array.from(this.processedMentions).slice(0, 50);
        toDelete.forEach(id => this.processedMentions.delete(id));
      }

      this.lastActionTime = Date.now();
      
      return { success: true };
    } catch (error) {
      console.error('❌ [Twitter Browser] Failed to post reply:', error.message);
      throw error;
    }
  }

  /**
   * Human-like typing with random delays
   */
  async humanType(element, text) {
    await element.click();
    await this.randomDelay(100, 300);

    for (const char of text) {
      await element.type(char, { delay: Math.random() * 100 + 50 }); // 50-150ms per char
    }
  }

  /**
   * Human-like click with mouse movement
   */
  async humanClick(element) {
    const box = await element.boundingBox();
    if (box) {
      // Move to random position within element
      const x = box.x + box.width * (0.3 + Math.random() * 0.4);
      const y = box.y + box.height * (0.3 + Math.random() * 0.4);
      
      await this.page.mouse.move(x, y, { steps: 10 });
      await this.randomDelay(100, 300);
      await element.click();
    } else {
      await element.click();
    }
  }

  /**
   * Random delay between min and max milliseconds
   */
  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Rate limiting to avoid detection
   */
  async respectRateLimit() {
    const timeSinceLastAction = Date.now() - this.lastActionTime;
    if (timeSinceLastAction < this.minActionDelay) {
      const waitTime = this.minActionDelay - timeSinceLastAction;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Ensure we're connected
   */
  async ensureConnected() {
    if (!this.connected) {
      throw new Error('Not connected to Twitter');
    }

    // Check if page is still valid
    if (this.page.isClosed()) {
      console.log('⚠️ [Twitter Browser] Page closed, reconnecting...');
      await this.connect();
    }
  }

  /**
   * Close browser
   */
  async disconnect() {
    try {
      if (this.context) {
        await this.context.close();
      }
      this.connected = false;
      console.log('👋 [Twitter Browser] Disconnected');
    } catch (error) {
      console.error('❌ [Twitter Browser] Error during disconnect:', error.message);
    }
  }
}

module.exports = TwitterBrowserClient;
