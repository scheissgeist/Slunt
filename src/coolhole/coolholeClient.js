const { chromium } = require('playwright');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

/**
 * Coolhole.org Client - Handles connection and interaction with Coolhole.org
 */
class CoolholeClient extends EventEmitter {
  constructor(healthMonitor = null) {
    super();
    this.browser = null;
    this.context = null;
    this.page = null;
    this.connected = false;
    this.chatReady = false;
    this.loginAttempts = 0;
    this.maxLoginAttempts = 3;
    this.verbose = process.env.VERBOSE_LOGGING === 'true';
    this.healthMonitor = healthMonitor; // Store health monitor reference

    // Coolhole.org specific settings
    this.channel = process.env.CYTUBE_CHANNEL || 'coolhole';
    this.baseUrl = 'https://coolhole.org'; // Coolhole uses root domain, not /r/channel path
  // Control login behavior - DISABLED by default (guest mode)
  // Set COOLHOLE_LOGIN_ENABLED=true in .env to enable authenticated login
  this.loginEnabled = process.env.COOLHOLE_LOGIN_ENABLED === 'true';
  this.username = process.env.BOT_USERNAME || 'Slunt'; // Use BOT_USERNAME for both guest and auth modes
  this.password = process.env.BOT_PASSWORD;
    this.storagePath = path.resolve(process.cwd(), 'data', 'auth-storage.json');

    // Chat state
    this.lastMessageTime = 0;
    this.messageQueue = [];
    this.minMessageDelay = 400; // FAST between messages - for snappy responses

    // Connection health monitoring
    this.heartbeatInterval = null;
    this.heartbeatFrequency = 30000; // Send heartbeat every 30s
    this.pageCheckInterval = null;
    this.reconnectTimer = null;
  }

  /**
   * Connect to Coolhole.org using Playwright browser
   */
  async connect() {
    try {
      console.log('🔌 Launching browser with persistent profile...');
      
      // Use persistent context to save permissions and cookies
      const path = require('path');
      const userDataDir = path.join(__dirname, '../../.browser-profile');
      
      this.context = await chromium.launchPersistentContext(userDataDir, {
        headless: (process.env.COOLHOLE_HEADLESS || '').toLowerCase() !== 'false', // default headless; set COOLHOLE_HEADLESS=false to debug
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        args: [
          '--start-maximized',
          '--window-size=1920,1080',
          // REMOVED: --disable-gpu, --disable-webgl, --use-angle=swiftshader
          // These were causing video player crashes
          '--disable-webgpu',
          '--ignore-gpu-blocklist',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-features=IsolateOrigins,site-per-process', // Allow scripts from any origin
          '--disable-site-isolation-trials' // Bypass script isolation restrictions
        ],
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        },
        slowMo: 20
      });
      
      // Listen for page crashes
      this.context.on('page', async page => {
        page.on('crash', () => console.error('💥 [PAGE CRASH] Page crashed unexpectedly!'));
      });
      
      // Get reference to browser from context
      this.browser = this.context.browser();

      // DO NOT CLEAR COOKIES/STORAGE: Preserve in-page permission choice ("Allow")
      // If you need a fresh start, set env COOLHOLE_FORCE_FRESH=true
      if (process.env.COOLHOLE_FORCE_FRESH === 'true') {
        console.log('🧹 Forcing fresh session: clearing cookies and storage...');
        const pages = this.context.pages();
        if (pages.length > 0) {
          const page = pages[0];
          await page.context().clearCookies();
          await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
          }).catch(() => console.log('⚠️ Could not clear storage (no page loaded yet)'));
        }
        console.log('✅ Old session data cleared - will login fresh as:', this.username);
      } else {
        console.log('🧹 Skipping cookie/storage clearing to preserve permission choice and session');
      }

      // Hide automation indicators - ENHANCED STEALTH
      await this.context.addInitScript(() => {
        // Remove webdriver flag
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        
        // Remove Playwright markers
        delete window.__playwright;
        delete window.__pw_manual;
        delete window.__PW_inspect;
        delete window.playwright;
        
        // Add Chrome properties that are missing in headless
        window.chrome = {
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
          app: {}
        };
        
        // Mock realistic plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', length: 1 },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', length: 1 },
            { name: 'Native Client', filename: 'internal-nacl-plugin', length: 2 }
          ]
        });
        
        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        });
        
        // Override permissions API to look less like automation
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: 'default' }) :
            originalQuery(parameters)
        );
        
        // Make iframe tests pass
        Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 1 });
        
        // DISABLE AUTO-SCROLLING to prevent bouncing during login
        document.addEventListener('DOMContentLoaded', () => {
          // Stop any auto-scroll behavior
          window.scrollTo = () => {};
          Element.prototype.scrollIntoView = () => {};
          Element.prototype.scrollIntoViewIfNeeded = () => {};
          
          // Lock scroll position
          document.documentElement.style.scrollBehavior = 'auto';
          document.body.style.scrollBehavior = 'auto';
        });
      });

      // Create a new page
      this.page = await this.context.newPage();

      // Set up global dialog handler to catch duplicate session warnings early
      this.page.on('dialog', async dialog => {
        const message = dialog.message();
        console.log(`🔔 Dialog: "${message}"`);
        if (message.toLowerCase().includes('already') || 
            message.toLowerCase().includes('duplicate') ||
            message.toLowerCase().includes('another') ||
            message.toLowerCase().includes('session')) {
          console.warn(`⚠️ DUPLICATE SESSION WARNING: "${message}"`);
          console.warn(`⚠️ Another session may be using username: ${this.username}`);
        }
        await dialog.dismiss().catch(() => {});
      });

      // Enable browser console logging to debug message detection
      this.page.on('console', msg => console.log('🌐 Browser:', msg.text()));
      this.page.on('pageerror', err => console.error('Browser error:', err.message));
      this.page.on('close', async () => {
        console.warn('⚠️ [PAGE CLOSED EVENT] Page was closed unexpectedly');
        try {
          await this.onPageClosed('initial-connect');
        } catch (e) {
          console.warn('⚠️ Page close recovery failed:', e.message);
        }
      });
      
      // Navigate to Coolhole.org (just root URL, not /r/channel)
      const channelUrl = this.baseUrl;
      console.log(`🌐 Navigating to Coolhole.org: ${channelUrl}`);
      let connected = false;
      for (let attempt = 1; attempt <= 3 && !connected; attempt++) {
        try {
          await this.page.goto(channelUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
          });
          connected = true;
          console.log('✅ Page loaded successfully');
        } catch (e) {
          console.log(`Navigation attempt ${attempt} failed:`, e.message);
          if (attempt < 3) await this.page.waitForTimeout(5000);
        }
      }
      
      if (!connected) {
        throw new Error('Failed to connect to Coolhole.org after 3 attempts');
      }
      
      // Wait briefly for initial load
      console.log('⏳ Waiting for page load...');
      await this.page.waitForTimeout(500);

      // LOCK SCROLL POSITION to prevent bouncing
      console.log('🔒 Locking scroll position to prevent page bounce...');
      await this.page.evaluate(() => {
        // Disable all scroll methods
        window.scrollTo = () => {};
        window.scroll = () => {};
        Element.prototype.scrollIntoView = () => {};
        if (Element.prototype.scrollIntoViewIfNeeded) {
          Element.prototype.scrollIntoViewIfNeeded = () => {};
        }
        
        // Lock body scroll
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Prevent scroll events
        window.addEventListener('scroll', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, { passive: false, capture: true });
      });

  // HANDLE ONLY THE ALLOW BUTTON - don't click other close buttons
      console.log('� Checking for permission dialog...');
      let pageReloaded = false;
      try {
        await this.handleAllowButton();
        console.log('✅ Permission dialog handled');
      } catch (e) {
        if (e.message === 'Allow button clicked - page reloading' || 
            e.message.includes('Page closed after popup click')) {
          console.log('🔄 Allow button triggered reload/navigation...');
          pageReloaded = true;
          
          // Wait a bit for the old page to close
          console.log('⏳ Waiting 2 seconds for page to fully close...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if page is still valid or if we need to create a new one
          console.log('🔍 Checking page state...');
          if (this.page.isClosed()) {
            console.log('🔄 Creating new page after navigation...');
            
            // Check if context is also closed
            try {
              this.page = await this.context.newPage();
              console.log('✅ New page created');
            } catch (contextError) {
              if (contextError.message.includes('closed')) {
                console.log('⚠️ Context was also closed, need full reconnection');
                throw new Error('Browser context closed - full reconnection needed');
              }
              throw contextError;
            }
            
            // Re-setup event listeners for new page
            this.page.on('dialog', async dialog => {
              const message = dialog.message();
              console.log(`🔔 Dialog: "${message}"`);
              if (message.toLowerCase().includes('already') || 
                  message.toLowerCase().includes('duplicate') ||
                  message.toLowerCase().includes('another') ||
                  message.toLowerCase().includes('session')) {
                console.warn(`⚠️ DUPLICATE SESSION WARNING: "${message}"`);
                console.warn(`⚠️ Another session may be using username: ${this.username}`);
              }
              await dialog.dismiss().catch(() => {});
            });
            this.page.on('console', msg => console.log('🌐 Browser:', msg.text()));
            this.page.on('pageerror', err => console.error('Browser error:', err.message));
            console.log('✅ Event listeners attached');
            
            console.log('🌐 Navigating to:', this.baseUrl);
            await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('✅ New page loaded successfully');
          } else {
            // Wait for navigation to complete
            console.log('⏳ Page still open, waiting for navigation...');
            try {
              await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
              console.log('✅ Page reload complete');
            } catch (navError) {
              console.log('⚠️ Navigation wait timeout');
            }
          }
        } else {
          console.log('⚠️ Popup handling issue:', e.message);
        }
      }
      
      // Don't try to handle popups again after reload - let the page stabilize
      // The Allow button should have been clicked and permission remembered

      // Set up message handlers only if page is still valid
      try {
        if (this.page.isClosed()) {
          throw new Error('Page is closed, cannot set up handlers');
        }
        await this.page.exposeFunction('handleChatMessage', (data) => {
          this.handleMessage(data);
        });
      } catch (e) {
        console.log('⚠️ Could not expose handleChatMessage:', e.message);
      }

      // Expose health activity recording function so browser context can update health monitor
      try {
        if (!this.page.isClosed()) {
          await this.page.exposeFunction('recordHealthActivity', () => {
            if (this.healthMonitor) {
              this.healthMonitor.recordActivity('coolhole');
              console.log('[Socket.IO] ✅ Health activity recorded');
            }
          });
        }
      } catch (e) {
        console.log('⚠️ Could not expose recordHealthActivity:', e.message);
      }

      // Reduce stabilization wait and add more logging, with lightweight self-healing
      console.log('⏳ Waiting briefly for page to stabilize...');
      for (let i = 0; i < 2; i++) {
        if (this.page.isClosed()) {
          console.log(`⚠️ Page closed during stabilization (check ${i+1}/2)`);
          // Try to self-heal by creating a fresh page and navigating back
          try {
            this.page = await this.context.newPage();
            await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('🔁 Recovered page during stabilization');
          } catch (recoverErr) {
            console.log('💥 Recovery failed during stabilization:', recoverErr.message);
            throw new Error('Page closed during stabilization - full reconnection needed');
          }
        } else {
          console.log(`   Check ${i+1}/2: Page still open ✓`);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
  console.log('✅ Page stabilized without closing');

  // Disable MOTD bounce (announcement bar) to prevent layout shift
  await this.disableMOTDBounce().catch(e => console.log('⚠️ Could not disable MOTD bounce:', e.message));
      
      // Final Allow button check (optional) - can be skipped to avoid reload loop
      if (process.env.COOLHOLE_SKIP_FINAL_ALLOW === 'false') {
        console.log('🔍 Final Allow button check before Socket.IO setup...');
        await this.handleAllowButton();
      } else {
        console.log('⏭️ Skipping final Allow button check (COOLHOLE_SKIP_FINAL_ALLOW != "false")');
      }
      
      // Final page check
      if (this.page.isClosed()) {
        console.log('⚠️ Page closed before Socket.IO setup');
        throw new Error('Page closed before Socket.IO setup - full reconnection needed');
      }

      // Inject Socket.IO listener - CyTube uses Socket.IO for real-time chat
      console.log('🔌 Setting up Socket.IO message interception...');
      // DISABLED - Socket.IO interception triggers Coolhole's anti-bot detection
      // await this.installSocketInterceptor(this.page, this.username);
      console.log('⏭️ [Socket.IO] Interception DISABLED (triggers anti-bot) - using DOM polling only');

      // 🔄 PRIMARY METHOD: DOM polling for messages (Socket.IO interception disabled)
      console.log('🔄 Starting DOM polling fallback for message detection...');
      
      // Start DOM polling (REDUCED frequency to minimize spam)
      this.domPollingInterval = setInterval(async () => {
        try {
          // Only log if we find messages to reduce spam
          const messages = await this.page.evaluate(() => {
            // DEBUG: Log chat structure once
            if (!window._chatStructureLogged) {
              const chatBuffer = document.querySelector('#messagebuffer');
              if (chatBuffer) {
                const sample = chatBuffer.querySelector('div');
                if (sample) {
                  console.log('[DEBUG] Sample chat element:', sample.outerHTML.substring(0, 200));
                  console.log('[DEBUG] Sample classes:', sample.className);
                }
              }
              window._chatStructureLogged = true;
            }
            
            const chatBuffer = document.querySelector('#messagebuffer');
            if (!chatBuffer) {
              // Don't spam logs when chat not found
              return [];
            }
            
            // Try multiple possible selectors - UPDATED for new Coolhole structure
            // SKIP server messages (server-msg-* classes)
            let messageElements = chatBuffer.querySelectorAll('div[class*="chat-msg"]:not([class*="server-msg"]), div.msg:not([class*="server-msg"]), li.chat-msg, li:not([class*="server-msg"])');

            // If that doesn't work, get ALL direct children BUT filter out server messages
            if (messageElements.length === 0) {
              messageElements = Array.from(chatBuffer.children).filter(el => 
                !el.className.includes('server-msg') && 
                !el.className.includes('poll-notify') &&
                !el.className.includes('drink')
              );
            }
            
            const messages = [];
            
            // Get last 5 messages
            const startIdx = Math.max(0, messageElements.length - 5);
            for (let i = startIdx; i < messageElements.length; i++) {
              const msgDiv = messageElements[i];
              
              // Check if message is gold (sparkly gold text)
              const isGold = msgDiv.className.includes('gold') || 
                            msgDiv.querySelector('.gold') !== null ||
                            msgDiv.style.color === 'gold' ||
                            msgDiv.style.color === '#ffd700';
              
              // Try to extract username and message from any structure
              const fullText = msgDiv.textContent || '';
              
              // Look for pattern: [timestamp] username: message
              const match = fullText.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(\w+):\s*(.+)/);
              
              if (match) {
                messages.push({
                  timestamp: match[1],
                  username: match[2],
                  text: match[3].trim(),
                  fullText: fullText.trim(),
                  isGold: isGold
                });
              } else {
                // Try alternate method
                const usernameSpan = msgDiv.querySelector('.username, strong');
                const messageSpan = msgDiv.querySelector('.message, span:not(.username):not(.timestamp)');
                
                if (usernameSpan && messageSpan) {
                  messages.push({
                    username: usernameSpan.textContent.trim(),
                    text: messageSpan.textContent.trim(),
                    timestamp: '',
                    fullText: fullText.trim(),
                    isGold: isGold
                  });
                }
              }
            }
            
            return messages;
          });
          
          // Only log if we found NEW messages (reduces spam by 90%)
          if (messages.length > 0 && messages.length !== this.lastMessageCount) {
            console.log(`[DOM Polling] 📊 Found ${messages.length} new messages`);
            this.lastMessageCount = messages.length;
          }
          
          // Process messages in Node.js context
          for (const msg of messages) {
            // Check if this is a message we haven't seen before
            const msgKey = `${msg.username}:${msg.text}:${msg.timestamp}`;
            if (!this.seenMessages) this.seenMessages = new Set();
            
            if (!this.seenMessages.has(msgKey)) {
              this.seenMessages.add(msgKey);
              
              // Keep only last 100 messages in memory
              if (this.seenMessages.size > 100) {
                const firstKey = this.seenMessages.values().next().value;
                this.seenMessages.delete(firstKey);
              }
              
              console.log(`[DOM Polling] 📩 New message from ${msg.username}: ${msg.text.substring(0, 50)}${msg.isGold ? ' 💛 GOLD' : ''}`);
              
              // Handle the message directly
              this.handleMessage({
                type: msg.username.toLowerCase() === 'slunt' ? 'self-reflection' : 'chat',
                username: msg.username,
                text: msg.text,
                timestamp: Date.now(),
                source: 'dom-polling',
                isGold: msg.isGold || false
              });
            }
          }
        } catch (e) {
          // Only log real errors, not "page closed" spam
          if (!e.message.includes('Target closed') && !e.message.includes('Execution context')) {
            console.error('[DOM Polling] ❌ Error:', e.message);
          }
        }
      }, 5000); // Check every 5 seconds (reduced from 2s to minimize spam)
      
      console.log('✅ DOM polling interval started');

      this.connected = true;
      this.emit('connected');

      // Start health monitoring
      this.startHealthMonitoring();

      // Verify we're on the CyTube channel page using visual confirmation
      await this.verifyPageLocation();

      // Only attempt login if explicitly enabled AND credentials are available
      if (this.loginEnabled && (this.password || process.env.BOT_PASSWORD)) {
        console.log('🔐 Credentials found, attempting login as', this.username);
        const loginSuccess = await this.login();
        if (loginSuccess) {
          console.log('✅ Logged in successfully as', this.username);
        } else {
          console.log('⚠️ Login failed, continuing as guest');
        }
      } else if (!this.loginEnabled) {
        console.log('ℹ️ Login explicitly disabled (COOLHOLE_LOGIN_ENABLED=false), continuing as guest');
      } else {
        console.log('⚠️ No credentials provided, continuing as guest');
      }

      // AFTER login attempt, check if chat is available
      console.log('🔐 Checking chat availability...');
      const chatExists = await this.ensureChatReady();
      if (!chatExists) {
        console.warn('⚠️ Chat elements not found after login');
      }
      
      this.chatReady = true;

    } catch (error) {
      console.error('Connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle Coolhole.org logout process to clear cached session
   */
  async logout() {
    try {
      console.log('🚪 Looking for user menu and logout option...');
      
      // First, try to open user dropdown menu
      const userMenuSelectors = [
        '#welcome',  // Common user welcome area
        '.username',
        'a.dropdown-toggle',
        'button.dropdown-toggle',
        '[data-toggle="dropdown"]'
      ];
      
      let menuOpened = false;
      for (const selector of userMenuSelectors) {
        try {
          const menuButton = await this.page.$(selector);
          if (menuButton) {
            console.log(`🖱️ Clicking user menu: ${selector}`);
            await menuButton.click({ timeout: 2000 });
            await this.page.waitForTimeout(500);
            menuOpened = true;
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // Now try to find and click logout link/button
      const logoutSelectors = [
        'a[href="/logout"]',
        'a:has-text("Logout")',
        'a:has-text("Log out")',
        'a:has-text("Sign out")',
        'button:has-text("Logout")',
        'button:has-text("Log out")'
      ];
      
      for (const selector of logoutSelectors) {
        try {
          const logoutButton = await this.page.$(selector);
          if (logoutButton) {
            console.log(`✅ Found logout button: ${selector}`);
            await logoutButton.click({ timeout: 2000 });
            await this.page.waitForTimeout(1500);
            console.log('✅ Logged out successfully');
            
            // Clear the saved auth state
            if (fs.existsSync(this.storagePath)) {
              fs.unlinkSync(this.storagePath);
              console.log('🗑️ Cleared saved auth state file');
            }
            
            // Also clear all browser cookies to ensure fresh start
            await this.context.clearCookies();
            console.log('🍪 Cleared all browser cookies');
            
            // CRITICAL: Clear localStorage and sessionStorage too
            await this.page.evaluate(() => {
              localStorage.clear();
              sessionStorage.clear();
            });
            console.log('🧹 Cleared localStorage and sessionStorage');
            
            return true;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      console.log('⚠️ No logout button found - clearing cookies manually');
      
      // If we can't logout via UI, just clear cookies and storage
      if (fs.existsSync(this.storagePath)) {
        fs.unlinkSync(this.storagePath);
        console.log('🗑️ Cleared saved auth state file');
      }
      await this.context.clearCookies();
      console.log('🍪 Cleared all browser cookies');
      
      // CRITICAL: Also clear localStorage and sessionStorage
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      console.log('🧹 Cleared localStorage and sessionStorage');
      
      return true;
    } catch (error) {
      console.log('⚠️ Logout error:', error.message);
      
      // Best effort - clear storage even if logout UI fails
      try {
        if (fs.existsSync(this.storagePath)) {
          fs.unlinkSync(this.storagePath);
          console.log('🗑️ Cleared saved auth state file (fallback)');
        }
        await this.context.clearCookies();
        console.log('🍪 Cleared all browser cookies (fallback)');
        
        // CRITICAL: Also clear localStorage and sessionStorage
        await this.page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        console.log('🧹 Cleared localStorage and sessionStorage');
      } catch (e) {}
      
      return false;
    }
  }

  /**
   * Handle Coolhole.org login process
   */
  async login() {
    if (this.loginAttempts >= this.maxLoginAttempts) {
      console.error('❌ Max login attempts reached');
      return false;
    }

    try {
      this.loginAttempts++;
      console.log(`🔑 Login attempt ${this.loginAttempts}/${this.maxLoginAttempts}`);

      // Temporarily stop health monitoring during login to prevent conflicts
      const wasMonitoring = this.heartbeatInterval !== null;
      if (wasMonitoring) {
        console.log('⏸️ [Coolhole] Pausing health monitoring during login');
        this.stopHealthMonitoring();
      }
      
      // Check if page is still open
      if (!this.page || this.page.isClosed()) {
        console.error('❌ Page closed, cannot login');
        return false;
      }
      
      // Set up dialog handler to prevent page close on dialogs
      // This catches duplicate session warnings and other alerts
      const dialogHandler = async dialog => {
        const message = dialog.message();
        console.log(`🔔 Dialog detected: "${message}"`);
        
        // Check for duplicate session warning
        if (message.toLowerCase().includes('already') || 
            message.toLowerCase().includes('duplicate') ||
            message.toLowerCase().includes('logged in') ||
            message.toLowerCase().includes('session')) {
          console.warn(`⚠️ Duplicate session detected! Message: "${message}"`);
          console.warn(`⚠️ This will cause disconnection. We should NOT proceed with login.`);
          
          // For duplicate session warnings, we should NOT dismiss - let it block
          // This prevents the false login success that gets immediately kicked
          return; // Don't dismiss - let the dialog block the login
        }
        
        // For other dialogs (like confirmations), dismiss them
        await dialog.dismiss().catch(() => {});
      };
      
      // Remove any existing handlers first
      this.page.removeAllListeners('dialog');
      this.page.on('dialog', dialogHandler);
      
      // Skip the "already logged in" check - it causes false positives
      // The login form will handle it if we're actually logged in
      console.log('ℹ️ Attempting login (will skip if already authenticated)...');
      
      // SKIP GUEST LOGIN - force authenticated login only
      console.log('⏭️ Skipping guest login - authenticated login required');
      const skipGuest = true;
      if (!skipGuest) try {
        const guestLogin = await this.page.evaluate((username) => {
          // Look for guest name input (CyTube often has this)
          const guestInput = document.querySelector('input[name="guestname"], #guestname, input[placeholder*="name" i]:not([type="password"])');

          if (guestInput) {
            console.log('[Guest] Found guest name input');
            guestInput.value = username;

            // Look for any button with "guest", "continue", or "set" in text
            const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
            const guestBtn = buttons.find(btn => {
              const text = (btn.textContent || btn.value || '').toLowerCase();
              return text.includes('guest') || text.includes('continue') || text.includes('set');
            });

            if (guestBtn) {
              console.log('[Guest] Clicking guest button:', guestBtn.textContent || guestBtn.value);
              guestBtn.click();
              return true;
            }

            // Try pressing Enter if no button
            const event = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13 });
            guestInput.dispatchEvent(event);
            return true;
          }
          return false;
        }, this.username);
        
        if (guestLogin) {
          console.log('✅ Guest login attempted, waiting for it to process...');
          await this.page.waitForTimeout(2000);
          
          // Verify guest login worked
          const guestVerified = await this.page.evaluate((username) => {
            // Check if our name appears in the userlist
            const userlistItems = document.querySelectorAll('.userlist_item, .user-entry, [class*="user"]');
            for (const item of userlistItems) {
              const text = (item.textContent || '').trim();
              if (text.toLowerCase().includes(username.toLowerCase())) {
                return true;
              }
            }
            return false;
          }, this.username);
          
          if (guestVerified) {
            console.log(`✅ Guest login successful as "${this.username}"!`);
            this.loginAttempts = 0;
            return true;
          }
        }
      } catch (e) {
        console.log('⚠️ Guest login not available:', e.message);
      }
      
      // FALLBACK: Try authenticated login
      console.log('🔍 Checking for authenticated login on current page...');
      
      // FIRST: Check if we're already logged in by looking for our username in the userlist
      try {
        const alreadyLoggedIn = await this.page.evaluate((username) => {
          const userlistItems = document.querySelectorAll('.userlist_item, .user-entry, [class*="userlist"]');
          for (const item of userlistItems) {
            const text = (item.textContent || '').trim();
            if (text.toLowerCase().includes(username.toLowerCase())) {
              return true;
            }
          }
          return false;
        }, this.username);
        
        if (alreadyLoggedIn) {
          console.log(`✅ Already logged in as "${this.username}" - skipping login process`);
          this.loginAttempts = 0;
          return true;
        }
      } catch (e) {
        console.log('⚠️ Could not check login status:', e.message);
      }
      
      const currentUrl = this.page.url();
      
      let loginFieldsFound = false;
      const fieldSelectors = ['#name', 'input[name="name"]', 'input[placeholder*="name" i]'];
      const pwSelectors = ['#pw', 'input[type="password"]', 'input[placeholder*="password" i]'];
      
      // Check if fields exist on current page
      for (const sel of fieldSelectors) {
        const field = await this.page.$(sel).catch(() => null);
        if (field) {
          loginFieldsFound = true;
          console.log(`✅ Found login field on current page: ${sel}`);
          break;
        }
      }
      
      // If no login fields on current page, try navigating to login page
      if (!loginFieldsFound) {
        console.log('🌐 No login fields on channel page, trying /login...');
        try {
          await this.page.goto(`${this.baseUrl}/login`, { timeout: 10000, waitUntil: 'networkidle' });
          await this.page.waitForTimeout(1500);
          console.log('✅ Login page loaded');
        } catch (e) {
          console.log('⚠️ Could not navigate to /login:', e.message);
          // Try clicking login link as fallback
          try {
            await this.page.goto(currentUrl); // Go back to channel
            await this.page.waitForTimeout(1000);
            const loginLink = await this.page.$('a[href*="login" i], button:has-text("Login"), button:has-text("Sign in")');
            if (loginLink) {
              console.log('🖱️ Clicking login button/link...');
              await loginLink.click({ timeout: 2000 });
              await this.page.waitForTimeout(1500);
            }
          } catch (e2) {
            console.log('⚠️ Login link not found:', e2.message);
          }
        }
      }

  // Now actually search for the fields with all selectors
      // IMPORTANT: Look for VISIBLE, CONNECTED forms only (avoid duplicates)
      console.log('🔍 Searching for VISIBLE login input fields...');

      let nameField = null; let pwField = null;
      
      // Find ALL matching fields and filter to visible ones
      let allNameFields = await this.page.$$('input[name="name"], input[placeholder*="name" i]');
      let allPwFields = await this.page.$$('input[type="password"]');
      
      console.log(`🔍 Found ${allNameFields.length} username fields and ${allPwFields.length} password fields`);

      // If there are multiple username fields (common on channel page), switch to dedicated /login page
      if (allNameFields.length > 1 || allPwFields.length !== 1) {
        try {
          console.log('🌐 Multiple/ambiguous fields detected. Navigating to dedicated /login page...');
          // Check if page is still alive before navigating
          if (this.page.isClosed()) {
            throw new Error('Page closed before /login navigation');
          }
          await this.page.goto(`${this.baseUrl}/login`, { timeout: 10000, waitUntil: 'domcontentloaded' }); // Changed from networkidle
          await this.page.waitForTimeout(1000);
          // Check if page survived navigation
          if (this.page.isClosed()) {
            throw new Error('Page closed during /login navigation');
          }
          // Re-query fields on the login page
          allNameFields = await this.page.$$('input[name="name"], input[placeholder*="name" i]');
          allPwFields = await this.page.$$('input[type="password"]');
          console.log(`🔍 [/login] Found ${allNameFields.length} username fields and ${allPwFields.length} password fields`);
        } catch (e) {
          console.log('⚠️ Failed to navigate to /login:', e.message);
          // Page might have closed - check if we're already logged in anyway
          if (this.page && !this.page.isClosed()) {
            // Try to continue with whatever fields we have
            console.log('ℹ️  Continuing without /login page');
          }
        }
      }
      
      // Pick the FIRST VISIBLE field for each
      for (const field of allNameFields) {
        const isVisible = await field.isVisible().catch(() => false);
        const isConnected = await field.evaluate(el => el.isConnected).catch(() => false);
        if (isVisible && isConnected) {
          nameField = field;
          const name = await field.evaluate(el => el.name || el.id || el.placeholder).catch(() => 'unknown');
          console.log(`✅ Using VISIBLE username field: ${name}`);
          break;
        }
      }
      
      for (const field of allPwFields) {
        const isVisible = await field.isVisible().catch(() => false);
        const isConnected = await field.evaluate(el => el.isConnected).catch(() => false);
        if (isVisible && isConnected) {
          pwField = field;
          const name = await field.evaluate(el => el.name || el.id || el.placeholder).catch(() => 'unknown');
          console.log(`✅ Using VISIBLE password field: ${name}`);
          break;
        }
      }

      if (!nameField || !pwField) {
        console.log('⚠️ Login fields not found, checking if already logged in...');
      } else {
        // Fill the VISIBLE fields we found
        try {
          // Clear and type credentials
          console.log('👤 Filling username field...');
          await nameField.click();
          await nameField.fill(''); // Clear first
          await nameField.type(this.username, { delay: 50 }); // Type with delay

          console.log('🔑 Filling password field...');
          const password = this.password || process.env.BOT_PASSWORD || 'piss';
          await pwField.click();
          await pwField.fill(''); // Clear first
          await pwField.type(password, { delay: 50 }); // Type with delay

          console.log('✅ Filled credentials');
          await this.page.waitForTimeout(250); // Small settle

          // Try submission methods
          let loginSubmitted = false;
          
          // Method 1: Click submit button
          console.log('🖱️ Attempting to click login button...');
          const submitSelectors = ['button:has-text("Login")', 'input[type="submit"]', 'button[type="submit"]', '#login'];
          for (const sel of submitSelectors) {
            try {
              const btn = await this.page.$(sel);
              if (btn && await btn.isVisible()) {
                console.log(`  └─ Found visible button: ${sel}`);
                await btn.click({ timeout: 3000 });
                console.log('  └─ ✅ Clicked!');
                loginSubmitted = true;
                break;
              }
            } catch (e) {
              console.log(`  └─ ❌ Failed: ${e.message}`);
            }
          }

          // Method 2: JS submit if needed
          if (!loginSubmitted) {
            console.log('⌨️ Method 2: JavaScript form.submit()...');
            try {
              const formSubmitted = await this.page.evaluate(() => {
                const form = document.querySelector('form');
                if (form && form.isConnected) { form.submit(); return true; }
                return false;
              });
              console.log(`  └─ ${formSubmitted ? '✅' : '❌'} Form ${formSubmitted ? 'submitted' : 'not found/connected'}`);
              if (formSubmitted) loginSubmitted = true;
            } catch (e) { console.log(`  └─ ❌ Error: ${e.message}`); }
          }

          // Method 3: Press Enter key
          if (!loginSubmitted) {
            console.log('⏎ Method 3: Pressing Enter key...');
            try { await this.page.keyboard.press('Enter'); console.log('  └─ ✅ Enter key pressed'); loginSubmitted = true; } catch (e) { console.log(`  └─ ❌ Error: ${e.message}`); }
          }

          // After submission, wait for one of: URL change away from /login, chat available, or page close (reload)
          console.log('⏳ Waiting for login result (url/chat/close)...');
          let closedDuringSubmit = false;
          try {
            await Promise.race([
              this.page.waitForURL(u => !u.includes('/login'), { timeout: 6000 }),
              this.page.waitForSelector('#messagebuffer', { timeout: 6000 }),
              this.page.waitForEvent('close', { timeout: 6000 }).then(() => { closedDuringSubmit = true; })
            ]);
          } catch (e) {
            // Timeout is okay; we'll verify state next
          }

          if (closedDuringSubmit || this.page.isClosed()) {
            console.log('📄 Page closed during/after submit (likely reload). Recovering...');
            try {
              this.page = await this.context.newPage();
              await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
              await this.page.waitForTimeout(800);
            } catch (e) {
              console.log('⚠️ Recovery navigation failed:', e.message);
              return false;
            }
          }

          // Verify authentication state on current page
          let authStatus = { loggedIn: false, foundUsers: [] };
          try {
            authStatus = await this.page.evaluate((expectedUsername) => {
              const result = { loggedIn: false, foundUsers: [] };
              try {
                // Look for logout link/button
                const nodes = Array.from(document.querySelectorAll('a, button'));
                const hasLogout = nodes.some(n => (n.textContent || '').toLowerCase().includes('logout'));
                // Check userlist for username
                const userlistItems = document.querySelectorAll('.userlist_item, .user-entry, [class*="userlist"]');
                for (const item of userlistItems) {
                  const text = (item.textContent || item.innerText || '').trim();
                  if (text) result.foundUsers.push(text);
                  if (text.toLowerCase().includes(expectedUsername.toLowerCase())) {
                    result.loggedIn = true;
                  }
                }
                // If logout present and username not found yet, still consider logged in
                if (hasLogout) result.loggedIn = result.loggedIn || true;
              } catch {}
              return result;
            }, this.username);
          } catch (e) {
            console.log('⚠️ Auth verification error:', e.message);
          }

          console.log(`🔐 Auth check: loggedIn=${authStatus.loggedIn} users=${authStatus.foundUsers.slice(0,3).join(' | ')}`);

          if (!authStatus.loggedIn) {
            // Try once to go to /login and detect explicit error
            try {
              await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await this.page.waitForTimeout(600);
              const errorMsg = await this.page.evaluate(() => {
                const el = document.querySelector('.alert, .error, .warning, #errorbox, .message');
                return el ? (el.textContent || '').trim() : null;
              });
              if (errorMsg) console.log(`⚠️ Login error banner: ${errorMsg}`);
              if (errorMsg && /invalid|wrong|failed/i.test(errorMsg)) {
                console.log('❌ Explicit login failure detected.');
                return false;
              }
            } catch {}
          }

          // If we got here and either auth looks good or no explicit failure, proceed
          if (!authStatus.loggedIn) {
            console.log('⚠️ Authentication not confirmed; proceeding but will verify via userlist later.');
          } else {
            console.log('✅ Authentication likely successful.');
            this.loginAttempts = 0;
          }
          
          console.log('⏳ Finalizing login...');
        } catch (e) {
          console.error('Error filling login form:', e.message);
          return false;
        }
      }

      // Navigate back to the main page BEFORE checking chat elements
      const channelUrl = this.baseUrl;
      console.log(`🔄 Navigating back to Coolhole after login: ${channelUrl}`);
      try {
        // Check if page is still alive
        if (this.page && !this.page.isClosed()) {
          await this.page.goto(channelUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
          });
          await this.page.waitForTimeout(800); // Fast channel load
          console.log('✅ Back in channel');
        } else {
          console.log('⚠️ Page closed before navigating back to channel');
          // Don't throw - let it fail gracefully and trigger reconnect
        }
      } catch (e) {
        console.log('⚠️ Could not navigate back to channel:', e.message);
      }

      // Handle any popups that appear after login
      try {
        await this.handlePopups();
      } catch (e) {
        console.log('Popup handling skipped:', e.message);
      }

  // NOW verify chat presence (buffer + input) with flexible selectors
      try {
        const chatPresent = await this.page.$('#messagebuffer');
        const chatline = await this.page.$('#chatline, .chat-input, textarea');

        if (chatPresent && chatline) {
          // CRITICAL: Verify we're logged in as the correct user by checking userlist
          try {
            const loginVerification = await this.page.evaluate((expectedUsername) => {
              // Check if our username appears in the userlist
              const userlistItems = document.querySelectorAll('.userlist_item, .user-entry, [class*="userlist"]');
              let foundOurUsername = false;
              let foundUsers = [];
              
              for (const item of userlistItems) {
                const text = (item.textContent || item.innerText || '').trim();
                foundUsers.push(text);
                // Check if the text contains our username (case-insensitive)
                if (text.toLowerCase().includes(expectedUsername.toLowerCase())) {
                  foundOurUsername = true;
                  break;
                }
              }
              
              return {
                foundOurUsername,
                foundUsers: foundUsers.slice(0, 5) // Only first 5 users for logging
              };
            }, this.username || 'Slunt');

            console.log(`👤 Login verification results:`);
            console.log(`   - Looking for username: "${this.username}"`);
            console.log(`   - Found in userlist: ${loginVerification.foundOurUsername ? '✅ YES' : '❌ NO'}`);
            console.log(`   - Other users seen: ${loginVerification.foundUsers.join(', ') || 'none'}`);

            // ONLY FAIL if we're NOT in the userlist
            if (!loginVerification.foundOurUsername) {
              throw new Error(`Login verification failed - "${this.username}" not found in userlist`);
            }

            console.log(`✅ Username verification passed: "${this.username}" found in userlist`);
          } catch (e) {
            console.error('❌ Login verification failed:', e.message);
            // Take screenshot for debugging
            try {
              const screenshotPath = `screenshot_login_verification_fail_${Date.now()}.png`;
              await this.page.screenshot({ path: screenshotPath, fullPage: true });
              console.log(`📸 Saved verification failure screenshot: ${screenshotPath}`);
            } catch {}
            throw e; // Propagate error to retry login
          }

          console.log('✅ Login successful!');
          this.chatReady = true;
          
          // Record activity with health monitor to prevent immediate disconnect
          if (this.healthMonitor) {
            this.healthMonitor.recordActivity('coolhole');
            console.log('✅ [HealthMonitor] Recorded initial activity for coolhole');
          }

          // Wait a moment and verify we didn't get kicked by duplicate session
          await this.page.waitForTimeout(500);

          // Check if we're still on the page and not redirected
          const finalUrl = this.page.url();
          console.log(`📍 Final URL after login: ${finalUrl}`);

          if (finalUrl.includes('/logout') || !finalUrl.includes('coolhole.org')) {
            console.error('❌ Got kicked after login - likely duplicate session!');
            console.error('💡 Try using a different username or logout from other sessions');
            console.error('💡 You can also try guest mode by setting loginEnabled: false in config');
            this.chatReady = false;
            throw new Error('Login failed: duplicate session or redirect');
          }

          // Verify username is still showing (be flexible about which username)
          const stillLoggedIn = await this.page.evaluate(() => {
            // Check for any username indicator - we're logged in if we see a username
            const usernameSelectors = [
              '#welcome', '.username', '.user-info', 'nav .username', 'header .username'
            ];
            for (const selector of usernameSelectors) {
              const el = document.querySelector(selector);
              if (el && el.textContent.trim()) {
                return el.textContent.trim();
              }
            }
            // Also check if chat input is available and enabled
            const chatInput = document.querySelector('#chatline, .chat-input, textarea');
            if (chatInput && !chatInput.disabled) {
              return 'chat-ready'; // We're logged in if we can type in chat
            }
            return null;
          });

          if (!stillLoggedIn) {
            console.error('❌ Lost login status - might have been kicked by duplicate session');
          } else {
            console.log(`✅ Still logged in as: ${stillLoggedIn}`);
            // Greeting will be handled by server on 'connected' event
          }

          console.log(`✅ Login verified - connected as: ${stillLoggedIn}`);

          // Save auth storage for future sessions
          try {
            await this.saveAuthState();
          } catch (e) {
            console.log('Could not save auth state:', e.message);
          }

          // Restart health monitoring if it was paused
          if (wasMonitoring) {
            console.log('▶️ [Coolhole] Resuming health monitoring after successful login');
            this.startHealthMonitoring();
          }

          console.log('✅ Chat input found and ready! Slunt has joined Coolhole chat.');
          await this.setupChatHandlers();
          return true;
        } else {
          console.error('❌ Chat elements not found after login. Cannot join chat.');
          this.chatReady = false;
          throw new Error('Login failed: chat elements not found');
        }
      } catch (e) {
        console.error('❌ [Coolhole Login] Critical error:', e.message);
        this.chatReady = false;
        return false;
      }

    } catch (error) {
      console.error('Login error:', error.message);
      
      // Restart health monitoring if it was paused
      if (wasMonitoring) {
        console.log('▶️ [Coolhole] Resuming health monitoring after login error');
        this.startHealthMonitoring();
      }
      
      return false;
    }
  }

  /**
   * Persist current auth/session storage to disk
   */
  async saveAuthState() {
    try {
      if (this.context) {
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        await this.context.storageState({ path: this.storagePath });
        console.log('💾 Saved auth storage');
      }
    } catch (e) {
      console.warn('Could not save auth storage:', e.message);
    }
  }

  /**
   * Set up chat message handlers
   */
  async setupChatHandlers() {
    // Chat handlers are already set up in the connect() method
    // This is just a placeholder to confirm they're ready
    console.log('✅ Chat handlers initialized');
  }

  /**
   * Detect if chat UI is already present and mark ready
   */
  async ensureChatReady() {
    try {
      const buffer = await this.page.$('#messagebuffer');
      const input = await this.page.$('#chatline, .chat-input, textarea');
      if (buffer && input) {
        this.chatReady = true;
        await this.setupChatHandlers();
        console.log('✅ Chat ready without explicit login');
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }

  /**
   * Handle incoming messages from Coolhole.org
   */
  handleMessage(message) {
    if (this.verbose) {
      console.log(`📬 handleMessage called:`, message.type, message.username || '', message.text?.substring(0, 30) || '');
    }

    // Emit activity for health monitoring (we're receiving messages = connection alive)
    this.emit('message', message);

    switch (message.type) {
      case 'self-reflection':
        if (this.verbose) console.log(`🪞 Emitting self-reflection for Slunt's own message`);
        this.emit('self-reflection', {
          actualText: message.text,
          timestamp: message.timestamp || Date.now()
        });
        break;

      case 'chat':
        if (this.verbose) console.log(`📤 Emitting chat event for: ${message.username}`);
        this.emit('chat', {
          username: message.username,
          text: message.text,
          platform: 'coolhole',
          timestamp: message.timestamp || Date.now()
        });
        break;

      case 'userJoin':
        this.emit('userJoin', {
          username: message.username
        });
        break;

      case 'userLeave':
        this.emit('userLeave', {
          username: message.username
        });
        break;

      case 'loginResponse':
        this.emit('loginResponse', {
          success: message.success,
          error: message.error
        });
        break;

      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  /**
   * Send a chat message to Coolhole.org
   */
  async sendChat(message) {
    if (!this.connected || !this.page) {
      console.warn('Not connected, cannot send message');
      return false;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastMessage = now - this.lastMessageTime;
    if (timeSinceLastMessage < this.minMessageDelay) {
      const waitTime = this.minMessageDelay - timeSinceLastMessage;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before sending next message`);
      await this.page.waitForTimeout(waitTime);
    }

    // --- Retry logic ---
    let attempt = 0;
    const maxAttempts = 3;
    let lastError = null;
    while (attempt < maxAttempts) {
      try {
        // Check if page is still open
        if (this.page.isClosed()) {
          console.error('❌ Page is closed, cannot send message');
          lastError = 'Page closed';
          break;
        }

        // Find chat input with retry and flexible selectors
        const selectors = ['#chatline', '.chat-input', 'textarea', 'input[type="text"]'];
        let chatInput = null;
        for (const sel of selectors) {
          chatInput = await this.page.$(sel);
          if (chatInput) {
            console.log(`✅ Found chat input with selector: ${sel}`);
            
            // Check if element is actually visible and interactable
            const isVisible = await chatInput.isVisible();
            const isEnabled = await chatInput.isEnabled();
            console.log(`📋 Element state: visible=${isVisible}, enabled=${isEnabled}`);
            
            if (isVisible && isEnabled) {
              break;
            } else {
              console.log(`⚠️ Element found but not usable, trying next selector...`);
              chatInput = null;
            }
          }
        }

        if (!chatInput) {
          console.error('❌ Chat input not found or not visible/enabled with any selector');
          lastError = 'Chat input not found or not interactable';
          break;
        }

        // SKIP scrollIntoView - it causes bouncing and the window is already maximized
        // Just check if element has valid bounding box
        const box = await chatInput.boundingBox();
        console.log(`📏 Chat input box dimensions: ${box ? `${box.width}x${box.height}` : 'null'}`);
        
        if (!box || box.width < 10 || box.height < 10) {
          console.error('❌ Chat input not visible or too small');
          lastError = 'Chat input not visible or too small';
          break;
        }

        // MINIMAL INTERACTION - Skip focus() to avoid anti-bot detection
        // Just set value and press Enter directly
        
        // Clear existing text and type message
        await chatInput.evaluate((el, msg) => {
          el.value = '';
          el.value = msg;
        }, message);

        // Try to send message, catch click/press timeouts
        try {
          console.log(`[CoolholeClient] Attempting to send chat (attempt ${attempt + 1}): ${message}`);
          await chatInput.press('Enter', { timeout: 3000 });
          console.log(`[CoolholeClient] Chat input Enter pressed successfully.`);
        } catch (err) {
          console.error(`❌ Error pressing Enter to send message (attempt ${attempt + 1}):`, err.message);
          lastError = err.message;
          attempt++;
          await this.page.waitForTimeout(100);
          continue;
        }

        // Update rate limiting
        this.lastMessageTime = Date.now();

        console.log(`[CoolholeClient] Message sent to chat: ${message}`);

        // Visual verification: Check if message actually appeared in chat
        await this.page.waitForTimeout(200); // Fast message verification
        const messageVerified = await this.verifyMessageAppeared(message);
        
        if (messageVerified) {
          console.log('✅ [Visual] Message confirmed in chat');
        } else {
          console.warn('⚠️ [Visual] Could not confirm message in chat - may be a false positive send');
        }

        // Emit data event for health monitoring
        this.emit('data', { type: 'messageSent', message, verified: messageVerified });

        return true;
      } catch (error) {
        console.error(`Error sending message (attempt ${attempt + 1}):`, error.message);
        lastError = error.message;
        attempt++;
        await this.page.waitForTimeout(100);
        continue;
      }
    }
    // If we reach here, all attempts failed
    console.error(`[CoolholeClient] All sendChat attempts failed: ${lastError}`);
    return false;
  }

  /**
   * PlatformManager-compatible sendMessage wrapper
   * Routes to sendChat for actual message sending
   */
  async sendMessage(_channel, content, _options = {}) {
    return this.sendChat(content);
  }

  /**
   * Send a private message (PM) to a user on Coolhole
   * Uses the /pm command: /pm username message
   * @param {string} username - Username to PM
   * @param {string} message - Message content
   * @returns {boolean} Success status
   */
  async sendPM(username, message) {
    if (!this.connected || !this.page) {
      console.error('[CoolholeClient] Cannot send PM - not connected');
      return false;
    }

    try {
      // Format as PM command
      const pmCommand = `/pm ${username} ${message}`;
      console.log(`💬 [Coolhole] Sending PM to ${username}: ${message.substring(0, 50)}...`);
      
      // Use sendChat to send the /pm command
      const success = await this.sendChat(pmCommand);
      
      if (success) {
        console.log(`✅ [Coolhole] PM sent to ${username}`);
      } else {
        console.error(`❌ [Coolhole] Failed to send PM to ${username}`);
      }
      
      return success;
      
    } catch (error) {
      console.error(`❌ [Coolhole] PM error:`, error.message);
      return false;
    }
  }

  /**
   * Queue a YouTube video and send PM notification
   * Perfect for pranking: "here's u" + cringe video
   * @param {string} username - Username to prank
   * @param {string} message - PM message
   * @param {string} videoUrl - YouTube URL to queue
   * @returns {boolean} Success status
   */
  async prankWithVideo(username, message, videoUrl) {
    if (!this.connected || !this.page) {
      console.error('[CoolholeClient] Cannot prank - not connected');
      return false;
    }

    try {
      console.log(`😈 [Coolhole] Pranking ${username} with video...`);
      
      // Queue the video first
      const queueCommand = `/q ${videoUrl}`;
      const videoQueued = await this.sendChat(queueCommand);
      
      if (!videoQueued) {
        console.error(`❌ [Coolhole] Failed to queue prank video`);
        return false;
      }

      // Wait a moment for video to queue
      await this.page.waitForTimeout(1000);

      // Send the PM
      const pmSent = await this.sendPM(username, message);
      
      if (pmSent) {
        console.log(`✅ [Coolhole] Prank complete: Video queued + PM sent to ${username}`);
      }
      
      return pmSent;
      
    } catch (error) {
      console.error(`❌ [Coolhole] Prank error:`, error.message);
      return false;
    }
  }

  /**
   * Get the current video queue from Coolhole
   * Reads the playlist UI to see what's queued
   * @returns {Array} Array of queued videos with titles and info
   */
  async getVideoQueue() {
    if (!this.connected || !this.page) {
      console.error('[CoolholeClient] Cannot get queue - not connected');
      return [];
    }

    try {
      const queueData = await this.page.evaluate(() => {
        const queue = [];
        
        // Try multiple selectors for queue items
        const queueSelectors = [
          '#queue li',
          '.queue-item',
          '[id*="queue"] li',
          '.playlist li',
          '#playlist li'
        ];

        let queueItems = [];
        for (const selector of queueSelectors) {
          queueItems = document.querySelectorAll(selector);
          if (queueItems.length > 0) break;
        }

        queueItems.forEach((item, index) => {
          const titleEl = item.querySelector('.qe_title, .queue-title, a, span');
          const title = titleEl ? titleEl.textContent.trim() : 'Unknown';
          
          const byEl = item.querySelector('.qe_by, .queue-by');
          const queuedBy = byEl ? byEl.textContent.trim() : 'Unknown';

          const timeEl = item.querySelector('.qe_time, .queue-time');
          const duration = timeEl ? timeEl.textContent.trim() : 'Unknown';

          queue.push({
            position: index + 1,
            title,
            queuedBy,
            duration
          });
        });

        return queue;
      });

      if (queueData.length > 0) {
        console.log(`📋 [Coolhole] Queue has ${queueData.length} videos`);
      }

      return queueData;

    } catch (error) {
      console.error(`❌ [Coolhole] Error reading queue:`, error.message);
      return [];
    }
  }

  /**
   * Get currently playing video info
   * @returns {Object} Current video info
   */
  async getCurrentVideo() {
    if (!this.connected || !this.page) {
      console.error('[CoolholeClient] Cannot get current video - not connected');
      return null;
    }

    try {
      const videoInfo = await this.page.evaluate(() => {
        // Try to get video title from various places
        const titleSelectors = [
          '#currenttitle',
          '.video-title',
          '#videowrap .title',
          'h3.title'
        ];

        let title = 'Unknown';
        for (const selector of titleSelectors) {
          const el = document.querySelector(selector);
          if (el && el.textContent.trim()) {
            title = el.textContent.trim();
            break;
          }
        }

        // Get video element info
        const video = document.querySelector('video');
        let currentTime = 0;
        let duration = 0;
        let paused = true;

        if (video) {
          currentTime = video.currentTime || 0;
          duration = video.duration || 0;
          paused = video.paused;
        }

        return {
          title,
          currentTime: Math.floor(currentTime),
          duration: Math.floor(duration),
          paused
        };
      });

      return videoInfo;

    } catch (error) {
      console.error(`❌ [Coolhole] Error getting current video:`, error.message);
      return null;
    }
  }

  /**
   * Queue a video by URL or search term
   * @param {string} input - YouTube URL or search term
   * @param {string} position - 'next' or 'end' (default: 'end')
   * @returns {boolean} Success status
   */
  async queueVideo(input, position = 'end') {
    if (!this.connected || !this.page) {
      console.error('[CoolholeClient] Cannot queue video - not connected');
      return false;
    }

    try {
      let command;
      
      // Check if it's a URL or search term
      if (input.includes('youtube.com') || input.includes('youtu.be') || input.startsWith('http')) {
        // Direct URL
        command = position === 'next' ? `/qn ${input}` : `/q ${input}`;
      } else {
        // Search term (use ytsearch:)
        command = position === 'next' ? `/qn ytsearch:${input}` : `/q ytsearch:${input}`;
      }

      console.log(`🎬 [Coolhole] Queueing video: ${input} (${position})`);
      
      const success = await this.sendChat(command);
      
      if (success) {
        console.log(`✅ [Coolhole] Video queued successfully`);
      }
      
      return success;

    } catch (error) {
      console.error(`❌ [Coolhole] Error queueing video:`, error.message);
      return false;
    }
  }

  /**
   * Start health monitoring (heartbeat + page checks)
   */
  startHealthMonitoring() {
    // Clear any existing monitoring
    this.stopHealthMonitoring();

    console.log('💗 [Coolhole] Starting health monitoring');

    // Heartbeat: Emit activity event periodically AND record health activity
    this.heartbeatInterval = setInterval(async () => {
      if (this.connected && this.page && !this.page.isClosed()) {
        // Record activity with health monitor to prevent disconnection
        if (this.healthMonitor) {
          this.healthMonitor.recordActivity('coolhole');
        }
        
        // Check if Slunt is still in the userlist (verify we haven't been kicked)
        try {
          const loginStatus = await this.page.evaluate((username) => {
            // Check if our username appears in the userlist
            const userlistItems = document.querySelectorAll('.userlist_item, .user-entry, [class*="user"]');
            let foundOurUsername = false;
            let isGuest = false;
            
            for (const item of userlistItems) {
              const text = item.textContent || item.innerText || '';
              // Check if we appear as a guest
              if (text.toLowerCase().includes('guest-') || text.toLowerCase().includes('guest_')) {
                isGuest = true;
              }
              // Check if our real username is there
              if (text.toLowerCase().includes(username.toLowerCase())) {
                foundOurUsername = true;
              }
            }
            
            // Also check the welcome/login area
            const welcomeEl = document.querySelector('#welcome, .username, .user-info');
            const welcomeText = welcomeEl ? welcomeEl.textContent : '';
            const hasWelcome = welcomeText.toLowerCase().includes(username.toLowerCase());
            
            return {
              inUserlist: foundOurUsername,
              isGuest: isGuest && !foundOurUsername,
              hasWelcome: hasWelcome
            };
          }, this.username || 'Slunt');
          
          // Log successful check every 5 minutes (10 checks * 30s = 300s)
          this.loginCheckCounter = (this.loginCheckCounter || 0) + 1;
          if (this.loginCheckCounter % 10 === 0) {
            console.log(`✅ [Coolhole] Login verified (${this.loginCheckCounter} checks) - Status: ${loginStatus.inUserlist ? 'In userlist' : 'Not in list'}, Guest: ${loginStatus.isGuest}, Welcome: ${loginStatus.hasWelcome}`);
          }
          
          if (!loginStatus.inUserlist && !loginStatus.hasWelcome) {
            console.log('❌ [Coolhole] Slunt not found in userlist - we have been disconnected!');
            this.handleConnectionLoss('Not in userlist - session lost');
            return;
          }
          
          if (loginStatus.isGuest) {
            console.log('⚠️ [Coolhole] Detected as guest - attempting re-login...');
            try {
              await this.attemptLogin();
              console.log('✅ [Coolhole] Re-login successful');
            } catch (e) {
              console.error('❌ [Coolhole] Re-login failed:', e.message);
              this.handleConnectionLoss('Re-login failed');
            }
            return;
          }
        } catch (e) {
          console.log('⚠️ [Coolhole] Could not check userlist:', e.message);
        }
        
        this.emit('heartbeat', {
          timestamp: Date.now(),
          connected: this.connected,
          chatReady: this.chatReady
        });
      }
    }, this.heartbeatFrequency);

    // Page health check: Verify page is still alive (but be less aggressive)
    this.pageCheckInterval = setInterval(async () => {
      try {
        if (!this.page || this.page.isClosed()) {
          console.log('❌ [Coolhole] Page closed detected, connection lost');
          this.handleConnectionLoss('Page closed');
          return;
        }

        // Skip health check if we're in the middle of login/page navigation
        if (this.page.url().includes('/login') || this.page.url().includes('loading')) {
          console.log('⏳ [Coolhole] Skipping health check during page navigation');
          return;
        }

        // Check if we can still access the page (with timeout and retry)
        let isAccessible = false;
        try {
          isAccessible = await Promise.race([
            this.page.evaluate(() => true),
            new Promise(resolve => setTimeout(() => resolve(false), 5000)) // 5s timeout
          ]);
        } catch (e) {
          // Page might be temporarily loading, don't fail immediately
          console.log('⚠️ [Coolhole] Page temporarily inaccessible, will retry');
          return;
        }

        if (!isAccessible) {
          console.log('❌ [Coolhole] Page not accessible after timeout, connection lost');
          this.handleConnectionLoss('Page not accessible');
          return;
        }

        // Check if messagebuffer still exists (but don't fail if missing temporarily)
        const chatExists = await this.page.$('#messagebuffer').catch(() => null);
        if (!chatExists) {
          console.log('⚠️ [Coolhole] Chat elements missing, might have navigated away');
          // Don't disconnect immediately, give it time to recover
        }

      } catch (error) {
        console.log('⚠️ [Coolhole] Error during health check:', error.message);
        // Don't disconnect on every error, be more tolerant
        if (error.message.includes('Target closed') || error.message.includes('Session closed')) {
          this.handleConnectionLoss(`Health check error: ${error.message}`);
        }
      }
    }, 120000); // Check every 2 minutes instead of 1 minute
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.pageCheckInterval) {
      clearInterval(this.pageCheckInterval);
      this.pageCheckInterval = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Handle connection loss
   */
  handleConnectionLoss(reason) {
    if (!this.connected) return; // Already handling disconnect

    console.log(`💔 [Coolhole] Connection lost: ${reason}`);
    this.connected = false;
    this.chatReady = false;

    // Stop health monitoring
    this.stopHealthMonitoring();

    // Emit disconnection event
    this.emit('disconnected', { reason });

    // Emit error event for health monitor
    this.emit('error', new Error(`Connection lost: ${reason}`));

    // Proactively schedule reconnection attempt
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectTimer) return; // Already scheduled

    console.log('🔄 [Coolhole] Scheduling reconnection in 10 seconds...');
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (!this.connected) {
        console.log('🔌 [Coolhole] Attempting to reconnect...');
        try {
          await this.connect();
        } catch (error) {
          console.log('❌ [Coolhole] Reconnection failed:', error.message);
          // Will be picked up by health monitor for retry
        }
      }
    }, 10000);
  }

  /**
   * Disconnect from Coolhole.org
   */
  async disconnect() {
    console.log('🔌 [Coolhole] Disconnecting...');

    // Stop health monitoring
    this.stopHealthMonitoring();

    this.connected = false;
    this.chatReady = false;

    if (this.page) {
      try {
        await this.page.close();
      } catch (e) {}
      this.page = null;
    }
    // For persistent context, closing context also closes browser
    if (this.context) {
      try {
        await this.context.close();
      } catch (e) {}
      this.context = null;
      this.browser = null; // Browser is managed by context
    }

    console.log('✅ [Coolhole] Disconnected');
  }

  /**
   * Disable/contain the Message Of The Day (MOTD)/announcement collapse bounce
   * on CyTube-based UIs to prevent screen shifting.
   */
  async disableMOTDBounce() {
    if (!this.page || this.page.isClosed()) return;
    await this.page.addStyleTag({ content: `
      /* Prevent layout shift from MOTD/announcement areas */
      #motd, #motdwrap, #motdrow, .motd, #announcements, .announcement { display: none !important; height: 0 !important; overflow: hidden !important; }
      .collapse, .collapsing { height: auto !important; overflow: visible !important; transition: none !important; }
      body { scroll-behavior: auto !important; }
    `}).catch(() => {});
    await this.page.evaluate(() => {
      try {
        const hideEl = (el) => { if (!el) return; el.style.display = 'none'; el.style.height = '0px'; el.style.overflow = 'hidden'; };
        const sels = ['#motd', '#motdwrap', '#motdrow', '.motd', '#announcements', '.announcement'];
        for (const s of sels) document.querySelectorAll(s).forEach(hideEl);
        // Also neutralize any toggle buttons that reference MOTD
        document.querySelectorAll('a,button').forEach(btn => {
          const t = (btn.textContent || '').toLowerCase();
          if (t.includes('motd') || t.includes('message of the day') || t.includes('announcement')) {
            btn.addEventListener('click', (e) => { e.stopImmediatePropagation(); e.preventDefault(); return false; }, { capture: true });
          }
        });
        // MutationObserver to re-hide if site re-injects elements
        const obs = new MutationObserver(() => {
          for (const s of sels) document.querySelectorAll(s).forEach(hideEl);
        });
        obs.observe(document.body, { childList: true, subtree: true });
        console.log('[MOTD] Bounce disabled');
      } catch (e) {
        console.warn('[MOTD] Disable error:', e.message);
      }
    });
  }

  /**
   * Install Socket.IO interception into the given page
   */
  async installSocketInterceptor(page, username) {
    try {
      await page.evaluate((username) => {
        // Debug: Check what socket variables are available
        console.log('[Socket.IO] Checking for socket variables...');
        const possibleSockets = ['socket', 'io', 'cytubeSocket', 'clientSocket'];
        for (const varName of possibleSockets) {
          if (window[varName]) {
            console.log(`[Socket.IO] Found ${varName}:`, typeof window[varName], window[varName]);
          }
        }

        // Wait for CyTube's socket to be available - try multiple possible names
        const checkSocket = setInterval(() => {
          let foundSocket = null;
          let socketName = null;

          // Try different possible socket variable names
          for (const varName of ['socket', 'io', 'cytubeSocket', 'clientSocket']) {
            if (window[varName]) {
              foundSocket = window[varName];
              socketName = varName;
              break;
            }
          }

          if (foundSocket) {
            console.log(`[Socket.IO] Found CyTube socket connection via ${socketName}!`, foundSocket);
            clearInterval(checkSocket);

            // Intercept the original event handling mechanism at a lower level
            const originalOnevent = foundSocket.onevent;
            if (originalOnevent) {
              foundSocket.onevent = function(packet) {
                const args = packet.data || [];
                const event = args[0];
                
                // IGNORE CoolPoints events - they trigger anti-bot detection
                if (event && typeof event === 'string' && 
                    (event.toLowerCase().includes('coolpoint') || 
                     event.toLowerCase().includes('cp'))) {
                  console.log(`[Socket.IO] ⏭️ IGNORING CoolPoints event: ${event} (anti-bot prevention)`);
                  // Don't call original handler for CoolPoints events
                  return;
                }
                
                console.log(`[Socket.IO] 🔔 EVENT RECEIVED: ${event}`, args.slice(1));
                
                // Record health activity for ANY event
                if (window.recordHealthActivity) {
                  window.recordHealthActivity();
                }
                
                // Handle specific events we care about
                if (event === 'chatMsg') {
                  const data = args[1];
                  console.log('[Socket.IO] ✉️ chatMsg:', JSON.stringify(data));
                  
                  if (data && data.username && data.msg) {
                    console.log(`[Socket.IO] Processing message from ${data.username}: ${data.msg.substring(0, 50)}`);

                    // Check if this is our own message
                    const currentUsername = username || 'Slunt';
                    const isOwn = data.username.toLowerCase() === currentUsername.toLowerCase() ||
                                 data.username.toLowerCase() === 'slunt';

                    console.log(`[Socket.IO] Username check: "${data.username}" vs "${currentUsername}" -> isOwn: ${isOwn}`);

                    if (window.handleChatMessage) {
                      window.handleChatMessage({
                        type: isOwn ? 'self-reflection' : 'chat',
                        username: data.username,
                        text: data.msg,
                        timestamp: Date.now()
                      });
                    }
                  }
                } else if (event === 'userJoin') {
                  console.log('[Socket.IO] 👋 userJoin:', args[1]);
                } else if (event === 'userLeave') {
                  console.log('[Socket.IO] 🚪 userLeave:', args[1]);
                }
                
                // Call the original handler
                return originalOnevent.call(this, packet);
              };
              console.log('✅ Socket.IO onevent interceptor installed - monitoring all events');
            } else {
              console.error('❌ Could not find onevent method on socket - event monitoring may not work');
            }
          }
        }, 500);

        // Safety timeout
        setTimeout(() => {
          clearInterval(checkSocket);
          console.error('CyTube socket not found after 30 seconds!');
        }, 30000);
      }, username);
    } catch (e) {
      console.warn('⚠️ Could not install Socket.IO interceptor:', e.message);
    }
  }

  /**
   * Centralized handler for unexpected page closes. Attempts to recreate the page,
   * navigate back, re-expose bridges, and reinstall interceptors; then resumes login if enabled.
   */
  async onPageClosed(origin = 'unknown') {
    if (this._recoveringPage) {
      return; // Avoid concurrent recoveries
    }
    this._recoveringPage = true;
    try {
      if (!this.context) {
        throw new Error('Browser context is closed');
      }

      console.log(`🔁 [Recovery] Recreating page after close (origin: ${origin})...`);
      this.page = await this.context.newPage();

      // Reattach listeners on the new page
      this.page.on('console', msg => console.log('🌐 Browser:', msg.text()));
      this.page.on('pageerror', err => console.error('Browser error:', err.message));
      this.page.on('dialog', async dialog => {
        const message = dialog.message();
        console.log(`🔔 Dialog: "${message}"`);
        if (message.toLowerCase().includes('already') ||
            message.toLowerCase().includes('duplicate') ||
            message.toLowerCase().includes('another') ||
            message.toLowerCase().includes('session')) {
          console.warn(`⚠️ DUPLICATE SESSION WARNING: "${message}"`);
        }
        await dialog.dismiss().catch(() => {});
      });
      this.page.on('close', async () => {
        console.warn('⚠️ [PAGE CLOSED EVENT] (recovered page) Page was closed');
        try { await this.onPageClosed('recovered-page'); } catch {}
      });

      // Navigate back to base URL
      await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForTimeout(500);

  // Ensure MOTD bounce is disabled on recovered page
  await this.disableMOTDBounce().catch(() => {});

      // Re-expose Node bridges
      try {
        await this.page.exposeFunction('handleChatMessage', (data) => this.handleMessage(data));
      } catch (e) { console.log('⚠️ Could not expose handleChatMessage:', e.message); }
      try {
        await this.page.exposeFunction('recordHealthActivity', () => {
          if (this.healthMonitor) this.healthMonitor.recordActivity('coolhole');
        });
      } catch (e) { console.log('⚠️ Could not expose recordHealthActivity:', e.message); }

      // Reinstall Socket.IO interceptor
      await this.installSocketInterceptor(this.page, this.username);

      // Ensure chat is ready
      await this.ensureChatReady();

      // Attempt login again if enabled
      if (this.loginEnabled && (this.password || process.env.BOT_PASSWORD)) {
        console.log('🔐 [Recovery] Attempting login after page recovery...');
        await this.login();
      }
    } catch (e) {
      console.warn('⚠️ [Recovery] Page recovery unsuccessful:', e.message);
      
      // Check if browser context is closed (browser crash)
      if (e.message.includes('Target page, context or browser has been closed') ||
          e.message.includes('browserContext.newPage') ||
          e.message.includes('Browser has been closed')) {
        console.log('🔄 [Recovery] Browser context closed - attempting full browser relaunch...');
        
        // Close existing browser if any
        try {
          if (this.browser) {
            await this.browser.close().catch(() => {});
            this.browser = null;
          }
          if (this.browserContext) {
            await this.browserContext.close().catch(() => {});
            this.browserContext = null;
          }
          this.page = null;
        } catch (cleanupErr) {
          console.log('⚠️ [Recovery] Cleanup error:', cleanupErr.message);
        }
        
        // Wait a moment before relaunching
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Attempt full reconnection
        console.log('🔄 [Recovery] Triggering full reconnection...');
        this.handleConnectionLoss('Browser crashed - full relaunch needed');
      } else {
        // Other error - just mark connection lost
        this.handleConnectionLoss('Page close recovery failed');
      }
    } finally {
      this._recoveringPage = false;
    }
  }

  /**
   * Handle ONLY the Allow button for script permissions
   * This button causes page reload, so we throw an error to signal this
   */
  async handleAllowButton() {
    try {
      // Check if page still exists
      if (!this.page || this.page.isClosed()) {
        console.log('⚠️ Page closed, skipping Allow button check');
        return;
      }
      
      // Look for Allow button with a short timeout
      const allowButton = await this.page.$('button:has-text("Allow")');
      if (!allowButton) {
        console.log('✅ No Allow button found - permission already granted');
        return;
      }
      
      const isVisible = await allowButton.isVisible();
      if (!isVisible) {
        console.log('✅ Allow button not visible - permission already granted');
        return;
      }
      
      console.log('🔓 Found script permission dialog - preparing to click Allow');

      // Try to pre-check any "Remember my choice" checkbox quickly via JS (no waits)
      try {
        await this.page.evaluate(() => {
          const boxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
          const remember = boxes.find(cb => /remember|choice|always/i.test(cb.parentElement?.textContent || '')) || boxes[0];
          if (remember && !remember.checked) {
            remember.checked = true;
            remember.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('[Allow] Pre-checked remember checkbox');
          }
        }).catch(() => {});
      } catch {}

      // IMPORTANT: Clicking Allow will close/reload the page. Do it and signal caller to reconnect.
      try {
        await allowButton.click({ timeout: 1000 });
        // Give the browser a tiny moment to process the click
        await this.page.waitForTimeout(200).catch(() => {});
      } catch (clickErr) {
        // If the page/context closed during the click, that's expected
        if (String(clickErr.message || '').toLowerCase().includes('closed') ||
            String(clickErr.message || '').toLowerCase().includes('target page')) {
          console.log('📄 Page closed during Allow click (expected)');
        } else {
          console.log('⚠️ Allow click error:', clickErr.message);
        }
      }

      // Whether or not we observed the close, instruct caller to restart flow
      throw new Error('Allow button clicked - page reloading');

    } catch (e) {
      // If we intentionally signaled a reload, propagate to caller
      if (e.message === 'Allow button clicked - page reloading') {
        throw e;
      }
      // Otherwise just log and continue
      console.log('⚠️ Allow button handling completed with:', e.message);
    }
  }

  /**
   * Handle any popup dialogs or modals
   */
  async handlePopups() {
    try {
      console.log('🚫 Clearing any blocking popups...');
      let popupCount = 0;
      
      while (popupCount < 10) {
        // Check if page still exists
        if (!this.page || this.page.isClosed()) {
          console.log('⚠️ Page closed during popup handling');
          break;
        }
        
        let found = false;
        
        // FIRST: Handle CyTube script permission dialog (most important!)
        // NOTE: Clicking "Allow" causes immediate page reload/navigation
        // so we CANNOT do any more operations after clicking it
        try {
          const allowButton = await this.page.$('button:has-text("Allow")');
          if (allowButton && await allowButton.isVisible()) {
            console.log('🔓 Found script permission dialog - clicking Allow');
            
            // Try to check "Remember my choice" but don't fail if page closes
            try {
              const rememberCheckbox = await this.page.$('input[type="checkbox"]', { timeout: 500 });
              if (rememberCheckbox) {
                await Promise.race([
                  rememberCheckbox.check({ timeout: 500 }),
                  new Promise(resolve => setTimeout(resolve, 600))
                ]);
                console.log('✅ Checked "Remember my choice"');
              }
            } catch (e) {
              // Page might close, that's OK
            }
            
            // Click Allow - this will likely cause page to reload/close
            try {
              await Promise.race([
                allowButton.click({ timeout: 1000 }),
                new Promise(resolve => setTimeout(resolve, 1100))
              ]);
            } catch (e) {
              // Expected - page closes during click
            }
            
            console.log('✅ Clicked Allow button - page will reload');
            // Don't continue checking for more popups - page is reloading
            // Let the connection fail and reconnect will handle it
            throw new Error('Allow button clicked - page reloading');
          }
        } catch (e) {
          if (e.message === 'Allow button clicked - page reloading') {
            throw e; // Propagate this specific error to exit handlePopups
          }
          // Other errors: Continue to other popup types
        }
        
        // Check for various other popup types
        const popupSelectors = [
          'button:has-text("×")',
          'button:has-text("Close")',
          '.close',
          '[data-dismiss="modal"]',
          'button:has-text("Accept")',
          'button:has-text("I Accept")',
          'button:has-text("Agree")',
          'button:has-text("OK")',
          'button:has-text("Yes")',
          '.modal-close'
        ];

        for (const selector of popupSelectors) {
          try {
            if (!this.page || this.page.isClosed()) break;
            
            const button = await this.page.$(selector);
            if (button && await button.isVisible()) {
              console.log(`Found popup button: ${selector}`);
              try {
                await button.click({ timeout: 1000 });
                // Wait a bit and check if page is still alive
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // If page closed after this click, it might have triggered navigation
                if (this.page.isClosed()) {
                  console.log(`⚠️ Page closed after clicking ${selector} - might be navigation trigger`);
                  throw new Error('Page closed after popup click - possible navigation');
                }
                
                await this.page.waitForTimeout(200);
                found = true;
                popupCount++;
                break;
              } catch (e) {
                if (e.message.includes('Page closed after popup click')) {
                  throw e; // Propagate page close error
                }
                console.log(`Failed to click ${selector}:`, e.message);
                // Continue trying other selectors
              }
            }
          } catch (e) {
            // Selector not found or page closed, continue
            if (e.message.includes('Target page') || e.message.includes('closed') || e.message.includes('Page closed after popup click')) {
              console.log('⚠️ Page closed while handling popup');
              throw e; // Propagate to outer handler
            }
          }
        }

        if (!found) break;
      }

      if (popupCount > 0) {
        console.log(`✅ Cleared ${popupCount} popups`);
      } else {
        console.log('✅ No popups found');
      }

    } catch (error) {
      // Check if this is one of our intentional errors that should propagate
      if (error.message === 'Allow button clicked - page reloading' || 
          error.message.includes('Page closed after popup click')) {
        throw error; // Propagate to caller
      }
      console.warn('Error handling popups:', error.message);
      // Continue even if there's an error - popups might not be present
    }
  }

  /**
   * Verify we're on the correct page using visual/DOM confirmation
   */
  async verifyPageLocation() {
    try {
      console.log('👁️  [Vision] Verifying page location...');

      // Take screenshot for visual verification
      const screenshot = await this.page.screenshot({ path: `screenshots/page_verification_${Date.now()}.png` });

      // Check current URL
      const currentUrl = this.page.url();
      console.log(`📍 [Vision] Current URL: ${currentUrl}`);

      // Check for CyTube-specific elements
      const cytubeElements = {
        videoPlayer: await this.page.$('#videowrap').catch(() => null),
        chatBox: await this.page.$('#messagebuffer').catch(() => null),
        userlist: await this.page.$('#userlist').catch(() => null),
        chatline: await this.page.$('#chatline').catch(() => null)
      };

      const foundElements = Object.entries(cytubeElements)
        .filter(([key, val]) => val !== null)
        .map(([key]) => key);

      console.log(`👁️  [Vision] Found CyTube elements: ${foundElements.join(', ') || 'NONE'}`);

      if (foundElements.length === 0) {
        console.warn(`⚠️  [Vision] WARNING: No CyTube elements found! We might be on the wrong page.`);
        console.warn(`⚠️  [Vision] Expected URL: ${this.baseUrl}`);
        console.warn(`⚠️  [Vision] Actual URL: ${currentUrl}`);

        // If URL doesn't match coolhole.org, navigate to it
        if (!currentUrl.includes('coolhole.org')) {
          console.log(`🔄 [Vision] Navigating to Coolhole: ${this.baseUrl}`);
          await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await this.page.waitForTimeout(2000);

          // Re-verify after navigation
          const newUrl = this.page.url();
          console.log(`📍 [Vision] New URL after navigation: ${newUrl}`);
        }
      } else {
        console.log(`✅ [Vision] Page verification successful - on Coolhole`);
      }

    } catch (error) {
      console.warn(`⚠️  [Vision] Page verification failed: ${error.message}`);
      // Don't fail connection, just warn
    }
  }

  /**
   * Verify that a sent message actually appeared in the chat
   * Uses DOM inspection with fuzzy matching, then OCR fallback
   */
  async verifyMessageAppeared(messageText) {
    try {
      console.log('👁️ [Visual] Verifying message appeared:', messageText.substring(0, 50));

      // Wait a moment for message to render
      await this.page.waitForTimeout(500); // Increased from 300ms

      // Method 1: Check DOM for message text in recent chat messages (with fuzzy matching)
      const domCheck = await this.page.evaluate((searchText) => {
        const chatBuffer = document.querySelector('#messagebuffer');
        if (!chatBuffer) return false;

        // Get all chat messages
        const messages = chatBuffer.querySelectorAll('div[class*="chat-msg"]');
        
        // Check last 15 messages for our text (increased from 10)
        const recentMessages = Array.from(messages).slice(-15);
        
        // Normalize search text for fuzzy matching (MORE lenient)
        const normalizeText = (text) => {
          return text.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();
        };
        
        const normalizedSearch = normalizeText(searchText);
        // Get key words from search text (words 3+ chars)
        const searchWords = normalizedSearch.split(' ').filter(w => w.length >= 3);
        
        for (const msg of recentMessages) {
          const msgText = msg.textContent || '';
          const normalizedMsg = normalizeText(msgText);
          
          // More lenient matching:
          // 1. Exact substring match
          if (normalizedMsg.includes(normalizedSearch) || 
              normalizedSearch.includes(normalizedMsg.substring(0, 30))) {
            console.log('[DOM] Found message in chat (exact):', msgText.substring(0, 100));
            return true;
          }
          
          // 2. Match if 60% of key words found
          if (searchWords.length > 0) {
            const matchedWords = searchWords.filter(word => normalizedMsg.includes(word));
            const matchRatio = matchedWords.length / searchWords.length;
            if (matchRatio >= 0.6) {
              console.log('[DOM] Found message in chat (fuzzy 60%):', msgText.substring(0, 100));
              return true;
            }
          }
        }
        
        return false;
      }, messageText);

      if (domCheck) {
        console.log('✅ [Visual] Message verified via DOM inspection');
        return true;
      }

      // Method 2: Screenshot + OCR verification (fallback only)
      console.log('🔍 [Visual] DOM check failed, trying OCR...');
      
      // Take screenshot of chat area
      const chatBox = await this.page.$('#messagebuffer');
      if (chatBox) {
        const screenshotPath = `screenshots/chat_verify_${Date.now()}.png`;
        await chatBox.screenshot({ path: screenshotPath });
        console.log('📸 [Visual] Screenshot saved:', screenshotPath);

        // Use Tesseract for OCR (if available)
        try {
          const Tesseract = require('tesseract.js');
          const { data: { text } } = await Tesseract.recognize(screenshotPath, 'eng', {
            logger: () => {} // Suppress OCR logs
          });
          
          // MORE lenient fuzzy match OCR text
          const cleanMessage = messageText.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 50); // Check first 50 chars (was 40)
          const cleanOCR = text.toLowerCase().replace(/[^\w\s]/g, '');
          
          // Get key words (3+ chars)
          const messageWords = cleanMessage.split(' ').filter(w => w.length >= 3);
          const matchedWords = messageWords.filter(word => cleanOCR.includes(word));
          const matchRatio = messageWords.length > 0 ? matchedWords.length / messageWords.length : 0;
          
          // Accept if 50% of words match (very lenient)
          if (cleanOCR.includes(cleanMessage) || matchRatio >= 0.5) {
            console.log('✅ [Visual] Message verified via OCR');
            return true;
          } else {
            console.log('⚠️ [Visual] OCR did not find message');
            console.log('   Expected:', cleanMessage.substring(0, 50));
            console.log('   Found:', cleanOCR.substring(0, 200));
            console.log('   Match ratio:', (matchRatio * 100).toFixed(0) + '%');
          }
        } catch (ocrError) {
          console.warn('⚠️ [Visual] OCR failed:', ocrError.message);
        }
      }

      // Don't treat as critical failure - message likely sent
      console.log('⚠️ [Visual] Could not confirm message in chat - may be false negative');
      return false;

    } catch (error) {
      console.error('❌ [Visual] Message verification error:', error.message);
      return false;
    }
  }

  /**
   * Check if connected to Coolhole.org
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Ready flag for chat interactions
   */
  isChatReady() {
    return this.connected && this.chatReady;
  }
}

module.exports = CoolholeClient;