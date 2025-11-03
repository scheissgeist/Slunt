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
    this.username = process.env.BOT_USERNAME || 'Slunt';
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
      console.log('🔌 Launching browser...');
      this.browser = await chromium.launch({
        headless: true, // Hidden browser
        args: [
          '--start-maximized',
          '--window-size=1920,1080', // Force large window size
          '--disable-gpu',
          '--disable-webgl',
          '--use-angle=swiftshader',
          '--no-sandbox',
          '--disable-dev-shm-usage'
        ],
        slowMo: 20 // MINIMAL slowdown - operations only
      });
      
      // Always start with a fresh browser context, never use saved storage
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
      });

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

      // Force clear all cookies, localStorage, and sessionStorage before login
      await this.context.clearCookies();
      await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      console.log('🧹 Forced clear of cookies, localStorage, and sessionStorage before login');

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

      // HANDLE POPUPS FIRST before attempting login
      console.log('🚫 Clearing any popups that might block login...');
      try {
        await this.handlePopups();
        console.log('✅ Popups cleared');
      } catch (e) {
        console.log('⚠️ Popup handling issue:', e.message);
      }
      
      // Set up message handlers only if page is still valid
      try {
        await this.page.exposeFunction('handleChatMessage', (data) => {
          this.handleMessage(data);
        });
      } catch (e) {
        console.log('⚠️ Could not expose handleChatMessage:', e.message);
      }

      // Expose health activity recording function so browser context can update health monitor
      try {
        await this.page.exposeFunction('recordHealthActivity', () => {
          if (this.healthMonitor) {
            this.healthMonitor.recordActivity('coolhole');
            console.log('[Socket.IO] ✅ Health activity recorded');
          }
        });
      } catch (e) {
        console.log('⚠️ Could not expose recordHealthActivity:', e.message);
      }

      // Inject Socket.IO listener - CyTube uses Socket.IO for real-time chat
      console.log('🔌 Setting up Socket.IO message interception...');
      await this.page.evaluate((username) => {
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
            // Use the internal _callbacks or listeners if available
            const originalOnevent = foundSocket.onevent;
            if (originalOnevent) {
              foundSocket.onevent = function(packet) {
                const args = packet.data || [];
                const event = args[0];
                
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
      }, this.username)

      // 🔄 FALLBACK: DOM polling for messages in case Socket.IO interceptor fails
      console.log('🔄 Starting DOM polling fallback for message detection...');
      
      // Start DOM polling
      this.domPollingInterval = setInterval(async () => {
        try {
          console.log('[DOM Polling] 🔍 Checking for new messages...');
          const messages = await this.page.evaluate(() => {
            const chatBuffer = document.querySelector('#messagebuffer');
            if (!chatBuffer) {
              console.log('[DOM Debug] No #messagebuffer found');
              return [];
            }
            
            // Try multiple possible selectors
            let messageElements = chatBuffer.querySelectorAll('div.chat-msg-Slunt, div.chat-msg-OrbMeat, div[class*="chat-msg"]');
            console.log(`[DOM Debug] Found ${messageElements.length} messages with chat-msg class`);
            
            // If that doesn't work, get ALL divs
            if (messageElements.length === 0) {
              messageElements = chatBuffer.querySelectorAll('div');
              console.log(`[DOM Debug] Trying all divs: ${messageElements.length} found`);
            }
            
            const messages = [];
            
            // Get last 5 messages
            const startIdx = Math.max(0, messageElements.length - 5);
            for (let i = startIdx; i < messageElements.length; i++) {
              const msgDiv = messageElements[i];
              
              // Try to extract username and message from any structure
              const fullText = msgDiv.textContent || '';
              
              // Look for pattern: [timestamp] username: message
              const match = fullText.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(\w+):\s*(.+)/);
              
              if (match) {
                messages.push({
                  timestamp: match[1],
                  username: match[2],
                  text: match[3].trim(),
                  fullText: fullText.trim()
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
                    fullText: fullText.trim()
                  });
                }
              }
            }
            
            return messages;
          });
          
          console.log(`[DOM Polling] 📊 Found ${messages.length} recent messages`);
          
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
              
              console.log(`[DOM Polling] 📩 New message from ${msg.username}: ${msg.text.substring(0, 50)}`);
              
              // Handle the message directly
              this.handleMessage({
                type: msg.username.toLowerCase() === 'slunt' ? 'self-reflection' : 'chat',
                username: msg.username,
                text: msg.text,
                timestamp: Date.now(),
                source: 'dom-polling'
              });
            }
          }
        } catch (e) {
          console.error('[DOM Polling] ❌ Error:', e.message);
        }
      }, 2000); // Check every 2 seconds
      
      console.log('✅ DOM polling interval started');

      this.connected = true;
      this.emit('connected');

      // Start health monitoring
      this.startHealthMonitoring();

      // Verify we're on the CyTube channel page using visual confirmation
      await this.verifyPageLocation();

      // ALWAYS attempt login first if credentials are available
      // Don't check chat availability first - that skips login
      if (this.password || process.env.BOT_PASSWORD) {
        console.log('🔐 Credentials found, attempting login...');
        const loginSuccess = await this.login();
        if (loginSuccess) {
          console.log('✅ Logged in successfully as', this.username);
        } else {
          console.log('⚠️ Login failed, continuing as guest');
        }
      } else {
        console.log('ℹ️ No credentials provided, continuing as guest');
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
      
      // FIRST: Try guest login with custom name (more reliable for bots)
      console.log('🎭 Attempting guest login with custom name...');
      try {
        const guestLogin = await this.page.evaluate((username) => {
          // Look for guest name input (CyTube often has this)
          const guestInput = document.querySelector('input[placeholder*="guest" i], input[name="guestname"], #guestname');
          const guestBtn = document.querySelector('button:has-text("Set Guest Name"), button:has-text("Continue as Guest"), input[value*="guest" i]');
          
          if (guestInput) {
            console.log('[Guest] Found guest name input');
            guestInput.value = username;
            if (guestBtn) {
              console.log('[Guest] Clicking guest login button');
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
      console.log('🔍 Searching for login input fields...');

      let nameField = null; let pwField = null;
      for (const sel of fieldSelectors) {
        try {
          nameField = await this.page.$(sel);
          if (nameField) { console.log(`✅ Username field: ${sel}`); break; }
        } catch (e) { /* continue */ }
      }
      for (const sel of pwSelectors) {
        try {
          pwField = await this.page.$(sel);
          if (pwField) { console.log(`✅ Password field: ${sel}`); break; }
        } catch (e) { /* continue */ }
      }

      if (!nameField || !pwField) {
        console.log('⚠️ Login fields not found, checking if already logged in...');
      } else {
        // Clear and type with human-like delays
        try {
          // FORCE DISABLE AUTOFILL on the username field
          console.log('🚫 Disabling autofill on login fields...');
          await this.page.evaluate(() => {
            const nameInput = document.querySelector('#name, input[name="name"], input[placeholder*="name" i]');
            const pwInput = document.querySelector('#password, input[type="password"]');
            if (nameInput) {
              nameInput.setAttribute('autocomplete', 'off');
              nameInput.setAttribute('autocorrect', 'off');
              nameInput.setAttribute('autocapitalize', 'off');
              nameInput.setAttribute('spellcheck', 'false');
            }
            if (pwInput) {
              pwInput.setAttribute('autocomplete', 'off');
            }
          });
          
          // AGGRESSIVELY clear username field (select all and delete)
          console.log('👤 Clearing and filling username field...');
          await nameField.click({ clickCount: 3 }); // Triple click to select all
          await this.page.keyboard.press('Backspace'); // Delete selected text
          await nameField.fill(''); // Extra clear
          
          // Type username character by character FAST
          console.log(`📝 Typing username: ${this.username}`);
          for (const char of this.username) {
            await nameField.type(char, { delay: 10 + Math.random() * 20 }); // FAST: 10-30ms
          }
          
          // AGGRESSIVELY clear password field
          console.log('🔑 Clearing and filling password field...');
          await pwField.click({ clickCount: 3 }); // Triple click to select all
          await this.page.keyboard.press('Backspace'); // Delete selected text
          await pwField.fill(''); // Extra clear
          
          // Type password character by character with faster delays
          const password = this.password || process.env.BOT_PASSWORD || 'piss';
          console.log('📝 Typing password...');
          for (const char of password) {
            await pwField.type(char, { delay: 10 + Math.random() * 20 }); // FAST: 10-30ms
          }
          
          console.log('✅ Filled credentials with autofill disabled');
          await this.page.waitForTimeout(250); // Wait for form to be fully ready

          // Try submission methods ONE AT A TIME - stop after first success!
          let loginSubmitted = false;
          
          // Method 1: Click submit button with force option
          if (!loginSubmitted) {
            console.log('🖱️ Method 1: Attempting button click...');
            const submitSelectors = ['#login', 'button:has-text("Login")', 'input[type="submit"]', 'button[type="submit"]'];
            for (const sel of submitSelectors) {
              try {
                const btn = await this.page.$(sel);
                if (btn) { 
                  console.log(`  └─ Found button: ${sel}, clicking...`);
                  await btn.click({ force: true, timeout: 5000 });
                  console.log(`  └─ ✅ Click succeeded! Waiting for login to process...`);
                  loginSubmitted = true;
                  break;
                }
              } catch (e) { 
                console.log(`  └─ ❌ Click failed: ${e.message}`);
              }
            }
          }
          
          // Method 2: Submit the form directly via JavaScript (only if button click failed)
          if (!loginSubmitted) {
            console.log('⌨️ Method 2: JavaScript form.submit()...');
            try {
              const formSubmitted = await this.page.evaluate(() => {
                const form = document.querySelector('form');
                if (form && form.isConnected) {  // Check if form is connected to DOM
                  form.submit();
                  return true;
                }
                return false;
              });
              console.log(`  └─ ${formSubmitted ? '✅' : '❌'} Form ${formSubmitted ? 'submitted' : 'not found/connected'}`);
              if (formSubmitted) loginSubmitted = true;
            } catch (e) {
              console.log(`  └─ ❌ Error: ${e.message}`);
            }
          }
          
          // Method 3: Press Enter key (only if previous methods failed)
          if (!loginSubmitted) {
            console.log('⏎ Method 3: Pressing Enter key...');
            try {
              await this.page.keyboard.press('Enter');
              console.log('  └─ ✅ Enter key pressed');
              loginSubmitted = true;
            } catch (e) {
              console.log(`  └─ ❌ Error: ${e.message}`);
            }
          }
          
          console.log('⏳ Waiting for login to process...');
          await this.page.waitForTimeout(1500); // Fast login processing
          // Check current URL
          const currentUrl = this.page.url();
          console.log(`📍 Current URL: ${currentUrl}`);
          
          // Check for error messages on the page
          try {
            const errorMsg = await this.page.evaluate(() => {
              const errorEl = document.querySelector('.alert, .error, .warning, #errorbox, .message');
              return errorEl ? errorEl.textContent.trim() : null;
            });
            if (errorMsg) {
              console.log(`⚠️ Error message on page: ${errorMsg}`);
            }
          } catch (e) {}
          
          // If we're at /logout, it means login failed
          if (currentUrl.includes('/logout')) {
            console.log('❌ LOGIN REJECTED - redirected to /logout');
            console.log('   Possible reasons:');
            console.log('   1. Wrong username or password');
            console.log('   2. Account does not exist');
            console.log('   3. Coolhole detected automation/bot');
            // Take screenshot
            try {
              const screenshotPath = `screenshot_logout_${Date.now()}.png`;
              await this.page.screenshot({ path: screenshotPath });
              console.log(`📸 Saved screenshot: ${screenshotPath}`);
            } catch (e) {}
            return false;
          }
          
          // If still on login page, something went wrong
          if (currentUrl.includes('/login')) {
            console.log('⚠️ Still on login page after submission!');
            // Take screenshot for debugging
            try {
              const screenshotPath = `screenshot_login_fail_${Date.now()}.png`;
              await this.page.screenshot({ path: screenshotPath });
              console.log(`📸 Saved screenshot: ${screenshotPath}`);
            } catch (e) {}
            return false;
          } else {
            console.log('✅ URL changed, login might have worked');
          }
          
          console.log('⏳ Waiting for login to process...');
        } catch (e) {
          console.error('Error filling login form:', e.message);
          return false;
        }
      }

      // Navigate back to the main page BEFORE checking chat elements
      const channelUrl = this.baseUrl;
      console.log(`🔄 Navigating back to Coolhole after login: ${channelUrl}`);
      try {
        await this.page.goto(channelUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });
        await this.page.waitForTimeout(800); // Fast channel load
        console.log('✅ Back in channel');
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
            
            // AUTO-SEND A TEST MESSAGE after successful login
            try {
              console.log('💬 Sending automatic greeting message...');
              await this.page.waitForTimeout(300); // Minimal pause before first message
              const testSent = await this.sendChat('yo whats up coolhole');
              if (testSent) {
                console.log('✅ Automatic greeting sent successfully!');
              } else {
                console.warn('⚠️ Automatic greeting failed to send');
              }
            } catch (greetErr) {
              console.error('❌ Error sending automatic greeting:', greetErr.message);
            }
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

        // Focus chat box
        await chatInput.focus();

        // Clear existing text
        await chatInput.evaluate(el => el.value = '');

        // Use fill() instead of type() - faster and handles emojis better
        await chatInput.fill(message);

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
    if (this.context) {
      try {
        await this.context.close();
      } catch (e) {}
      this.context = null;
    }
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (e) {}
      this.browser = null;
    }

    console.log('✅ [Coolhole] Disconnected');
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
        try {
          const allowButton = await this.page.$('button:has-text("Allow")');
          if (allowButton && await allowButton.isVisible()) {
            console.log('🔓 Found script permission dialog - clicking Allow');
            
            // Check "Remember my choice" checkbox first
            try {
              const rememberCheckbox = await this.page.$('input[type="checkbox"]');
              if (rememberCheckbox) {
                await rememberCheckbox.check();
                console.log('✅ Checked "Remember my choice"');
              }
            } catch (e) {
              console.log('⚠️ Could not check remember box:', e.message);
            }
            
            await allowButton.click({ timeout: 2000 });
            await this.page.waitForTimeout(1000);
            console.log('✅ Clicked Allow button');
            found = true;
            popupCount++;
            continue; // Check for more popups
          }
        } catch (e) {
          // Continue to other popup types
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
                await this.page.waitForTimeout(500);
                found = true;
                popupCount++;
                break;
              } catch (e) {
                console.log(`Failed to click ${selector}:`, e.message);
                // Continue trying other selectors
              }
            }
          } catch (e) {
            // Selector not found or page closed, continue
            if (e.message.includes('Target page') || e.message.includes('closed')) {
              console.log('⚠️ Page closed while checking selector');
              break;
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
   * Uses visual OCR and DOM inspection
   */
  async verifyMessageAppeared(messageText) {
    try {
      console.log('👁️ [Visual] Verifying message appeared:', messageText.substring(0, 50));

      // Method 1: Check DOM for message text in recent chat messages
      const domCheck = await this.page.evaluate((searchText) => {
        const chatBuffer = document.querySelector('#messagebuffer');
        if (!chatBuffer) return false;

        // Get all chat messages
        const messages = chatBuffer.querySelectorAll('div[class*="chat-msg"]');
        
        // Check last 5 messages for our text
        const recentMessages = Array.from(messages).slice(-5);
        
        for (const msg of recentMessages) {
          const msgText = msg.textContent || '';
          // Match if message contains our text (accounting for timestamp prefix)
          if (msgText.toLowerCase().includes(searchText.toLowerCase())) {
            console.log('[DOM] Found message in chat:', msgText.substring(0, 100));
            return true;
          }
        }
        
        return false;
      }, messageText);

      if (domCheck) {
        console.log('✅ [Visual] Message verified via DOM inspection');
        return true;
      }

      // Method 2: Screenshot + OCR verification
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
          const { data: { text } } = await Tesseract.recognize(screenshotPath, 'eng');
          
          // Check if our message appears in the OCR text
          const cleanMessage = messageText.toLowerCase().replace(/[^\w\s]/g, '');
          const cleanOCR = text.toLowerCase().replace(/[^\w\s]/g, '');
          
          if (cleanOCR.includes(cleanMessage)) {
            console.log('✅ [Visual] Message verified via OCR');
            return true;
          } else {
            console.log('⚠️ [Visual] OCR did not find message');
            console.log('   Expected:', cleanMessage.substring(0, 50));
            console.log('   Found:', cleanOCR.substring(0, 200));
          }
        } catch (ocrError) {
          console.warn('⚠️ [Visual] OCR failed:', ocrError.message);
        }
      }

      console.warn('❌ [Visual] Could not verify message appeared');
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