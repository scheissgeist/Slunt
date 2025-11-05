const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// Add stealth plugin to hide automation
puppeteer.use(StealthPlugin());

/**
 * Coolhole.org Stealth Client - Uses puppeteer-extra-stealth to bypass anti-bot detection
 * 
 * This replaces the Playwright implementation which was detected by Coolhole.
 * Puppeteer-extra-stealth actively hides automation markers that trigger anti-bot systems.
 */
class CoolholeClientStealth extends EventEmitter {
  constructor(healthMonitor = null) {
    super();
    this.browser = null;
    this.page = null;
    this.connected = false;
    this.chatReady = false;
    this.loginAttempts = 0;
    this.maxLoginAttempts = 3;
    this.verbose = process.env.VERBOSE_LOGGING === 'true';
    this.healthMonitor = healthMonitor;

    // Coolhole.org specific settings
    this.channel = process.env.CYTUBE_CHANNEL || 'coolhole';
    this.baseUrl = 'https://coolhole.org';
    this.loginEnabled = process.env.COOLHOLE_LOGIN_ENABLED === 'true';
    this.username = process.env.BOT_USERNAME || 'Slunt';
    this.password = process.env.BOT_PASSWORD;
    this.storagePath = path.resolve(process.cwd(), 'data', 'auth-storage.json');

    // Chat state
    this.lastMessageTime = 0;
    this.messageQueue = [];
    this.minMessageDelay = 400;

    // Connection health monitoring
    this.heartbeatInterval = null;
    this.heartbeatFrequency = 30000;
    this.pageCheckInterval = null;
    this.reconnectTimer = null;
    
    // DOM polling for messages (works without triggering anti-bot)
    this.domPollingInterval = null;
    this.lastProcessedMessageId = null;
  }

  /**
   * Connect to Coolhole.org using Puppeteer with stealth plugin
   */
  async connect() {
    try {
      console.log('🔌 [Stealth] Launching browser with anti-bot protection...');
      
      const userDataDir = path.join(__dirname, '../../.browser-profile');
      
      // Launch browser with stealth plugin active
      // HEADLESS BY DEFAULT - with stability fixes applied
      const headlessMode = (process.env.COOLHOLE_HEADLESS || 'true').toLowerCase() === 'true';
      console.log(`🌐 [Stealth] Browser mode: ${headlessMode ? 'HEADLESS (with stability fixes)' : 'VISIBLE'}`);
      
      this.browser = await puppeteer.launch({
        headless: headlessMode ? 'new' : false,  // Use 'new' headless mode for better stability
        userDataDir: userDataDir,
        args: [
          '--window-size=800,600',  // Smaller window (800x600 instead of 1920x1080)
          '--window-position=2000,100',  // Position off to the side (adjust if needed)
          '--disable-webgpu',
          '--ignore-gpu-blocklist',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          // Additional stealth flags
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',  // Prevent throttling when not focused
          '--disable-backgrounding-occluded-windows',  // Keep working when minimized/covered
          '--disable-renderer-backgrounding'  // Prevent renderer from pausing
        ],
        ignoreHTTPSErrors: true,
        defaultViewport: {
          width: 800,
          height: 600
        }
      });

      console.log('✅ [Stealth] Browser launched with stealth protection');

      // Handle browser disconnection events
      this.browser.on('disconnected', () => {
        console.error('💔 [Stealth] Browser disconnected unexpectedly!');
        console.error('💔 [Stealth] This is likely a browser crash, NOT a Coolhole ban');
        this.isConnected = false;
        this.emit('disconnected', { reason: 'browser_crash' });
        // DO NOT call process.exit() - let Node keep running
      });

      // Get or create page
      const pages = await this.browser.pages();
      this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();

      // Handle page crashes
      this.page.on('error', (error) => {
        console.error('💔 [Stealth] Page error:', error.message);
      });

      this.page.on('pageerror', (error) => {
        console.error('💔 [Stealth] Page JavaScript error:', error.message);
      });

      // Additional stealth measures
      await this.page.evaluateOnNewDocument(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });
        
        // Override plugin/mimeTypes to appear more real
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });
        
        // Override permissions API
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
        
        // Add chrome runtime
        window.chrome = { runtime: {} };
      });

      // Set user agent
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Set extra headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      });

      console.log('🧹 Skipping cookie/storage clearing to preserve permission choice and session');
      console.log('💡 [Stealth] Small browser window (800x600) will appear - DO NOT CLOSE');
      console.log('    Browser must stay visible (not minimized) but can be moved out of the way');
      console.log(`🌐 Navigating to Coolhole.org: ${this.baseUrl}`);

      // Navigate to Coolhole with increased timeout
      try {
        await this.page.goto(this.baseUrl, { 
          waitUntil: 'domcontentloaded', // Less strict than networkidle2
          timeout: 30000 
        });
        console.log('✅ Page loaded successfully');
      } catch (navError) {
        console.log(`⚠️ Navigation timeout, checking if page loaded anyway...`);
        // Page might have loaded but networkidle2 never fired - check manually
        const url = this.page.url();
        if (url.includes('coolhole.org')) {
          console.log('✅ Page is on Coolhole despite timeout');
        } else {
          throw new Error(`Navigation failed: ${navError.message}`);
        }
      }

      console.log('⏳ Waiting for page load...');

      // Lock scroll position to prevent MOTD bounce
      await this.preventMOTDBounce();

      // Check for permission dialog
      console.log('🔍 Checking for permission dialog...');
      await this.handlePermissionDialog();

      // Wait for page to stabilize
      console.log('⏳ Waiting briefly for page to stabilize...');
      await this.waitForPageStability();

      // Start DOM polling for messages (doesn't trigger anti-bot)
      console.log('🔄 Starting DOM polling fallback for message detection...');
      this.startDOMPolling();

      // Attempt login if enabled
      if (this.loginEnabled && this.username && this.password) {
        await this.login();
      } else {
        // Check if already logged in from previous session
        const loggedInUsername = await this.getCurrentUsername();
        if (loggedInUsername) {
          console.log(`✅ Already logged in as "${loggedInUsername}" - skipping login process`);
          this.connected = true;
          this.chatReady = true;
        }
      }

      // Start health monitoring
      this.startHeartbeat();
      // DISABLED: Page check unreliable in headless mode
      // this.startPageCheck();

      this.emit('connected');
      console.log('✅ Coolhole connected - initializing advanced features...');

      return true;
    } catch (error) {
      console.error('💔 [Coolhole] Connection failed:', error.message);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Prevent MOTD bounce by injecting CSS/JS
   */
  async preventMOTDBounce() {
    try {
      console.log('🔒 Locking scroll position to prevent page bounce...');
      await this.page.evaluate(() => {
        const style = document.createElement('style');
        style.innerHTML = `
          #motdwrap, #motd, .message-of-the-day {
            display: none !important;
            height: 0 !important;
            transition: none !important;
          }
        `;
        document.head.appendChild(style);
        
        // Also inject JS to log when MOTD tries to appear
        const originalLog = console.log;
        console.log = function(...args) {
          if (args[0] && args[0].includes && args[0].includes('MOTD')) {
            originalLog('[MOTD] Bounce disabled');
            return;
          }
          originalLog.apply(console, args);
        };
      });
    } catch (error) {
      console.log('⚠️ Could not inject MOTD prevention:', error.message);
    }
  }

  /**
   * Handle permission dialog
   */
  async handlePermissionDialog() {
    try {
      // Try multiple selectors for the Allow button
      const allowButton = await this.page.$('button[data-test-id="allow"]') ||
                          await this.page.$('button[data-test="allow"]') ||
                          await this.page.$('button:contains("Allow")');
      
      if (allowButton) {
        console.log('🔓 Found Allow button, clicking...');
        await allowButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log('✅ No Allow button found - permission already granted');
      }
      console.log('✅ Permission dialog handled');
    } catch (error) {
      console.log('⚠️ Permission dialog handling skipped:', error.message);
    }
  }

  /**
   * Wait for page stability
   */
  async waitForPageStability() {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check page is responsive (not just if it's closed)
      for (let i = 1; i <= 2; i++) {
        try {
          // Actually verify page is responsive instead of using isClosed()
          await this.page.evaluate(() => document.readyState);
          console.log(`   Check ${i}/2: Page responsive ✓`);
        } catch (error) {
          throw new Error(`Page not responsive during check ${i}/2`);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('✅ Page stabilized and responsive');
    } catch (error) {
      throw new Error(`Page stability check failed: ${error.message}`);
    }
  }

  /**
   * Start DOM polling for message detection
   */
  startDOMPolling() {
    if (this.domPollingInterval) {
      clearInterval(this.domPollingInterval);
    }

    this.domPollingInterval = setInterval(async () => {
      try {
        // Skip check if page doesn't exist (don't use isClosed() - unreliable in headless)
        if (!this.page) return;

        const messages = await this.page.evaluate(() => {
          const chatLines = Array.from(document.querySelectorAll('#messagebuffer .chat-msg-username, #messagebuffer .chat-msg-text, #messagebuffer .chat-msg'));
          const msgs = [];
          
          for (let i = 0; i < chatLines.length; i++) {
            const line = chatLines[i];
            const usernameEl = line.querySelector('.chat-msg-username, [class*="username"]');
            const textEl = line.querySelector('.chat-msg-text, [class*="text"]');
            
            if (usernameEl && textEl) {
              const msgId = line.getAttribute('data-msg-id') || `msg-${i}`;
              const username = usernameEl.textContent?.trim().replace(':', '') || '';
              const text = textEl.textContent?.trim() || '';
              
              // Only add if both username and text are valid non-empty strings
              if (username && text) {
                msgs.push({
                  id: msgId,
                  username: username,
                  text: text,
                  timestamp: Date.now()
                });
              }
            }
          }
          
          return msgs;
        });

        // Process new messages (with additional validation)
        for (const msg of messages) {
          // Skip if message data is invalid
          if (!msg || !msg.username || !msg.text || typeof msg.text !== 'string') {
            continue;
          }
          
          if (msg.id !== this.lastProcessedMessageId && msg.username !== this.username) {
            this.lastProcessedMessageId = msg.id;
            this.emit('chat', {
              username: msg.username,
              text: msg.text,
              timestamp: msg.timestamp
            });
          }
        }
      } catch (error) {
        if (!error.message.includes('Execution context was destroyed')) {
          console.error('❌ [DOM Polling] Error:', error.message);
        }
      }
    }, 500); // Poll every 500ms

    console.log('✅ DOM polling interval started');
  }

  /**
   * Get current logged-in username
   */
  async getCurrentUsername() {
    try {
      const username = await this.page.evaluate(() => {
        const welcomeText = document.querySelector('#welcome')?.textContent || '';
        const match = welcomeText.match(/Welcome, (.+)/);
        return match ? match[1] : null;
      });
      return username;
    } catch (error) {
      return null;
    }
  }

  /**
   * Login to Coolhole
   */
  async login() {
    try {
      console.log(`🔐 Checking chat availability...`);
      
      const chatInput = await this.page.$('#chatline');
      if (!chatInput) {
        throw new Error('Chat input not found - page may not have loaded correctly');
      }

      console.log('✅ Chat handlers initialized');

      // Check if already logged in
      const currentUsername = await this.getCurrentUsername();
      if (currentUsername && currentUsername === this.username) {
        console.log(`✅ Already logged in as "${this.username}" - skipping login process`);
        this.connected = true;
        this.chatReady = true;
        return true;
      }

      // Perform login if credentials provided
      if (this.password) {
        console.log(`🔑 Attempting login as ${this.username}...`);
        
        // Click login button
        await this.page.click('button:has-text("Login")');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fill credentials
        await this.page.type('input[name="username"]', this.username);
        await this.page.type('input[name="password"]', this.password);
        
        // Submit
        await this.page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify login
        const loggedInUsername = await this.getCurrentUsername();
        if (loggedInUsername === this.username) {
          console.log(`✅ Logged in successfully as ${this.username}`);
          this.connected = true;
          this.chatReady = true;
          return true;
        } else {
          throw new Error('Login verification failed');
        }
      }

      console.log('✅ Chat ready without explicit login');
      this.connected = true;
      this.chatReady = true;
      return true;
    } catch (error) {
      console.error('💔 Login failed:', error.message);
      throw error;
    }
  }

  /**
   * Send chat message
   */
  async sendChat(message) {
    try {
      // Verify page is responsive instead of just checking isClosed()
      if (!this.page) {
        throw new Error('Page not available');
      }
      
      try {
        await this.page.evaluate(() => document.readyState);
      } catch (error) {
        throw new Error('Page not responsive');
      }

      if (!this.chatReady) {
        throw new Error('Chat not ready');
      }

      console.log(`📤 [Coolhole] Sending: ${message}`);

      // Find chat input
      const chatInput = await this.page.$('#chatline');
      if (!chatInput) {
        throw new Error('Chat input not found');
      }

      // Set value directly to minimize interaction
      await this.page.evaluate((msg) => {
        const el = document.querySelector('#chatline');
        if (el) {
          el.value = '';
          el.value = msg;
        }
      }, message);

      // Press Enter to send
      await chatInput.press('Enter');

      console.log(`✅ [Coolhole] Message sent: ${message}`);
      this.lastMessageTime = Date.now();
      
      return true;
    } catch (error) {
      console.error('💔 [Coolhole] Send failed:', error.message);
      throw error;
    }
  }

  /**
   * Send message wrapper for PlatformManager
   */
  async sendMessage(message) {
    return await this.sendChat(message);
  }

  /**
   * Start heartbeat monitoring
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.healthMonitor) {
        this.healthMonitor.recordActivity('coolhole');
      }
    }, this.heartbeatFrequency);

    console.log('💗 [Coolhole] Starting health monitoring');
  }

  /**
   * Start page check monitoring
   */
  startPageCheck() {
    if (this.pageCheckInterval) {
      clearInterval(this.pageCheckInterval);
    }

    this.pageCheckInterval = setInterval(async () => {
      try {
        // More robust check - verify page is actually accessible, not just isClosed()
        // In headless mode, isClosed() can give false positives
        if (!this.page) {
          console.error('💔 [Coolhole] Page object is null');
          this.handleConnectionLoss('page_null');
          return;
        }
        
        // Try to actually interact with the page to verify it's alive
        try {
          await this.page.evaluate(() => document.title);
        } catch (evalError) {
          // Only treat as connection loss if we can't evaluate (page truly closed/crashed)
          if (evalError.message.includes('closed') || evalError.message.includes('destroyed')) {
            console.error('💔 [Coolhole] Page closed unexpectedly');
            this.handleConnectionLoss('page_closed');
          }
        }
      } catch (error) {
        console.error('💔 [Coolhole] Page check error:', error.message);
      }
    }, 5000);
  }

  /**
   * Handle connection loss
   */
  handleConnectionLoss(reason) {
    console.log(`⚠️ [Coolhole] Connection lost: ${reason}`);
    this.connected = false;
    this.chatReady = false;
    this.emit('disconnected', reason);
    
    // Schedule reconnection
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnection
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    const delay = 10000; // 10 seconds
    console.log(`🔄 [Coolhole] Scheduling reconnection in ${delay / 1000} seconds...`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      console.log('🔄 [Coolhole] Attempting reconnection...');
      
      try {
        await this.disconnect();
        await this.connect();
      } catch (error) {
        console.error('💔 [Coolhole] Reconnection failed:', error.message);
        this.scheduleReconnect(); // Try again
      }
    }, delay);
  }

  /**
   * Disconnect from Coolhole
   */
  async disconnect() {
    try {
      console.log('🔌 [Coolhole] Disconnecting...');

      // Clear intervals FIRST to prevent race conditions
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      if (this.pageCheckInterval) {
        clearInterval(this.pageCheckInterval);
        this.pageCheckInterval = null;
      }

      if (this.domPollingInterval) {
        clearInterval(this.domPollingInterval);
        this.domPollingInterval = null;
      }

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Wait for intervals to finish current execution
      await new Promise(resolve => setTimeout(resolve, 200));

      // Close browser
      if (this.browser) {
        try {
          await this.browser.close();
        } catch (e) {
          console.log('⚠️  [Stealth] Browser already closed');
        }
        this.browser = null;
        this.page = null;
      }

      this.connected = false;
      this.chatReady = false;

      console.log('✅ [Coolhole] Disconnected');
    } catch (error) {
      console.error('⚠️ [Coolhole] Disconnect error:', error.message);
    }
  }

  /**
   * Report activity for health monitoring
   */
  reportActivity() {
    if (this.healthMonitor) {
      this.healthMonitor.recordActivity('coolhole');
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    // Don't use page.isClosed() - unreliable in headless mode
    return this.connected && this.chatReady && this.page;
  }

  /**
   * Ready flag for chat interactions
   */
  isChatReady() {
    return this.connected && this.chatReady;
  }
}

module.exports = CoolholeClientStealth;
