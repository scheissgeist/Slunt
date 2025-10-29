const { chromium } = require('playwright');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

/**
 * Coolhole.org Client - Handles connection and interaction with Coolhole.org
 */
class CoolholeClient extends EventEmitter {
  constructor() {
    super();
    this.browser = null;
    this.context = null;
    this.page = null;
    this.connected = false;
    this.chatReady = false;
    this.loginAttempts = 0;
    this.maxLoginAttempts = 3;
    
    // Coolhole.org specific settings
    this.baseUrl = 'https://coolhole.org';
    this.username = process.env.BOT_USERNAME || 'Slunt';
    this.password = process.env.BOT_PASSWORD;
  this.storagePath = path.resolve(process.cwd(), 'data', 'auth-storage.json');
    
    // Chat state
    this.lastMessageTime = 0;
    this.messageQueue = [];
    this.minMessageDelay = 800; // 800ms between messages (optimized for faster chat)
  }

  /**
   * Connect to Coolhole.org using Playwright browser
   */
  async connect() {
    try {
      console.log('🔌 Launching browser...');
      this.browser = await chromium.launch({
        headless: true, // Run invisibly in background
        args: [
          '--start-maximized',
          '--disable-gpu',
          '--disable-webgl',
          '--use-angle=swiftshader',
          '--no-sandbox',
          '--disable-dev-shm-usage'
        ],
        slowMo: 100 // Slow down Playwright operations for better stability
      });
      
      // Create a new browser context with persistent storage if available
      const hasStorage = fs.existsSync(this.storagePath);
      this.context = await this.browser.newContext({
        storageState: hasStorage ? this.storagePath : undefined,
        viewport: { width: 1920, height: 1080 }
      });

      // Create a new page
      this.page = await this.context.newPage();
      
      // Enable detailed logging
      this.page.on('console', msg => console.log('Browser log:', msg.text()));
      this.page.on('pageerror', err => console.error('Browser error:', err.message));
      
      // Navigate to Coolhole.org with retries
      console.log('🌐 Navigating to Coolhole.org...');
      let connected = false;
      for (let attempt = 1; attempt <= 3 && !connected; attempt++) {
        try {
          await this.page.goto(this.baseUrl, { 
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
      
      // Wait briefly for initial load - keep it short to avoid page close
      console.log('⏳ Waiting for page load...');
      await this.page.waitForTimeout(3000); // Reduced from 8000
      
      // Handle any initial popups/dialogs - be very conservative
      console.log('🔍 Checking for popups...');
      try {
        // Only try once and don't wait long
        const closeButtons = await this.page.$$('button:has-text("×"), .close');
        for (const btn of closeButtons.slice(0, 3)) { // Max 3 buttons
          try {
            if (await btn.isVisible()) {
              await btn.click({ timeout: 500 });
              await this.page.waitForTimeout(300);
            }
          } catch {}
        }
        console.log('✅ Cleared initial popups');
      } catch (e) {
        console.log('⚠️ Popup handling skipped:', e.message);
      }
      
      // Check if page is still open after popup handling
      if (!this.page || this.page.isClosed()) {
        throw new Error('Page closed during popup handling');
      }
      
      // Set up message handlers only if page is still valid
      try {
        await this.page.exposeFunction('handleChatMessage', (data) => {
          this.handleMessage(data);
        });
      } catch (e) {
        console.log('⚠️ Could not expose handleChatMessage:', e.message);
      }

      // Inject message listener - IMPROVED to catch all message formats
      await this.page.evaluate(() => {
        const chatMessages = document.querySelector('#messagebuffer');
        if (chatMessages) {
          console.log('🎧 Setting up message listener...');
          
          // DEBUG: Log existing messages to understand structure
          const existingMessages = chatMessages.querySelectorAll('div');
          console.log(`📋 Found ${existingMessages.length} existing elements in chat`);
          if (existingMessages.length > 0) {
            const sample = existingMessages[existingMessages.length - 1];
            console.log('🔍 Sample message structure:', sample.outerHTML.substring(0, 200));
          }
          
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              mutation.addedNodes.forEach((node) => {
                // Log every new node for debugging
                if (node.nodeType === Node.ELEMENT_NODE) {
                  console.log('🆕 New element added:', node.className, node.tagName);
                  
                  let username = null;
                  let text = null;
                  
                  // Get full text content
                  const fullText = node.textContent || '';
                  console.log('📝 Full text:', fullText.substring(0, 100));
                  
                  // Coolhole format: [timestamp] username: message
                  // Class format: chat-msg-username
                  if (node.className && node.className.includes('chat-msg-')) {
                    // Extract username from class name
                    const classMatch = node.className.match(/chat-msg-([^\s]+)/);
                    if (classMatch) {
                      username = classMatch[1];
                    }
                    
                    // Extract message from text (format: [HH:MM:SS] username: message)
                    const messageMatch = fullText.match(/\[\d{2}:\d{2}:\d{2}\]\s*([^:]+):\s*(.+)/);
                    if (messageMatch) {
                      username = messageMatch[1].trim();
                      text = messageMatch[2].trim();
                      console.log('🎯 Parsed Coolhole format:', { username, text: text.substring(0, 50) });
                    }
                  }
                  
                  // Check if this is our own message (learn from what was actually sent)
                  if (username && text && username === 'Slunt') {
                    console.log('� Slunt\'s message appeared in chat:', text.substring(0, 50));
                    // Send to bot for self-reflection
                    window.handleChatMessage({
                      type: 'self-reflection',
                      username: 'Slunt',
                      text: text.trim(),
                      timestamp: Date.now()
                    });
                  } else if (username && text) {
                    // Regular user message
                    console.log(`📨 Message from ${username}: ${text.substring(0, 50)}`);
                    window.handleChatMessage({
                      type: 'chat',
                      username: username.trim(),
                      text: text.trim(),
                      timestamp: Date.now()
                    });
                  }
                }
              });
            });
          });
          observer.observe(chatMessages, { 
            childList: true, 
            subtree: true  // Watch all descendants too
          });
          console.log('✅ Message listener active');
        }
      });

      this.connected = true;
      this.emit('connected');

      // Check if chat is already ready (guest mode works fine)
      console.log('🔐 Checking chat availability...');
      const readyNow = await this.ensureChatReady();
      if (readyNow) {
        console.log('✅ Chat ready immediately - proceeding!');
      } else {
        console.log('⚠️ Chat not immediately ready, will try login...');
        try {
          await this.login();
        } catch (e) {
          console.log('⚠️ Login failed:', e.message);
        }
      }

    } catch (error) {
      console.error('Connection error:', error);
      this.scheduleReconnect();
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
      
      // Check if page is still open
      if (!this.page || this.page.isClosed()) {
        console.error('❌ Page closed, cannot login');
        return false;
      }
      
      // Open login view if available
      try {
        const loginLink = await this.page.$('a[href="/login"], a:has-text("Login"), a:has-text("Sign in")');
        if (loginLink) {
          await loginLink.click({ timeout: 2000 });
          await this.page.waitForTimeout(1500);
        }
      } catch (e) {
        console.log('Login link not clicked:', e.message);
      }

      // Flexible selectors for fields
      console.log('🔍 Looking for login fields...');
      const fieldSelectors = ['#name', 'input[name="name"]', 'input[type="text"]'];
      const pwSelectors = ['#pw', 'input[type="password"]'];

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
        // Clear and type
        try {
          await nameField.fill('');
          await nameField.type(this.username, { delay: 60 });
          await this.page.waitForTimeout(200);
          await pwField.fill('');
          await pwField.type(this.password || process.env.BOT_PASSWORD || 'piss', { delay: 60 });
          console.log('📝 Filled credentials');

          // Submit
          const submitSelectors = ['#login', 'button:has-text("Login")', 'input[type="submit"]', 'button[type="submit"]'];
          for (const sel of submitSelectors) {
            try {
              const btn = await this.page.$(sel);
              if (btn) { 
                await btn.click({ timeout: 2000 });
                break;
              }
            } catch (e) { /* continue */ }
          }
          await this.page.waitForTimeout(2000);
        } catch (e) {
          console.error('Error filling login form:', e.message);
          return false;
        }
      }

      // Handle any popups that appear after login
      try {
        await this.handlePopups();
      } catch (e) {
        console.log('Popup handling skipped:', e.message);
      }

      // Verify chat presence (buffer + input) with flexible selectors
      try {
        const chatPresent = await this.page.$('#messagebuffer');
        const chatline = await this.page.$('#chatline, .chat-input, textarea');

        if (chatPresent && chatline) {
          console.log('✅ Login successful!');
          this.chatReady = true;
          // Save auth storage for future sessions
          try {
            await this.saveAuthState();
          } catch (e) {
            console.log('Could not save auth state:', e.message);
          }
          console.log('✅ Chat input found and ready!');
          await this.setupChatHandlers();
          return true;
        } else {
          console.log('⚠️ Chat elements not fully available - attempting to continue');
          this.chatReady = false;
          return false;
        }
      } catch (e) {
        console.error('Error checking chat elements:', e.message);
        return false;
      }

    } catch (error) {
      console.error('Login error:', error.message);
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
    try {
      // Set up chat monitoring with proven selector patterns
      await this.page.evaluate(() => {
        const chatMonitor = {
          buffer: document.querySelector('#messagebuffer'),
          messages: [],
          maxMessages: 100,
          
          init() {
            if (!this.buffer) {
              console.error('Chat buffer not found!');
              return;
            }
            
            console.log('Setting up enhanced chat monitor...');
            
            const observer = new MutationObserver((mutations) => {
              mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    // Look for various message patterns
                    const messageText = node.querySelector('.message, .msg-text, .text');
                    const username = node.querySelector('.username, .user, .nick');
                    
                    if (messageText && username) {
                      const message = {
                        type: 'chat',
                        username: username.textContent.trim(),
                        text: messageText.textContent.trim(),
                        timestamp: Date.now(),
                        isSystem: node.classList.contains('system') || node.classList.contains('announcement'),
                        messageId: node.getAttribute('data-id') || Date.now().toString()
                      };
                      
                      this.messages.push(message);
                      if (this.messages.length > this.maxMessages) {
                        this.messages.shift();
                      }
                      
                      window.handleChatMessage?.(message);
                    }
                  }
                });
              });
            });
            
            observer.observe(this.buffer, { 
              childList: true, 
              subtree: true,
              characterData: true
            });
            
            console.log('Chat monitor initialized successfully');
          }
        };
        
        chatMonitor.init();
      });

      console.log('✅ Chat handlers initialized');
    } catch (error) {
      console.error('Error setting up chat handlers:', error);
    }
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
    console.log(`📬 handleMessage called:`, message.type, message.username || '', message.text?.substring(0, 30) || '');
    
    switch (message.type) {
      case 'self-reflection':
        console.log(`🪞 Emitting self-reflection for Slunt's own message`);
        this.emit('self-reflection', {
          actualText: message.text,
          timestamp: message.timestamp || Date.now()
        });
        break;

      case 'chat':
        console.log(`📤 Emitting chat event for: ${message.username}`);
        this.emit('chat', {
          username: message.username,
          text: message.text,
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

    try {
      // Check if page is still open
      if (this.page.isClosed()) {
        console.error('❌ Page is closed, cannot send message');
        return false;
      }

      // Find chat input with retry and flexible selectors
      const selectors = ['#chatline', '.chat-input', 'textarea', 'input[type="text"]'];
      let chatInput = null;
      for (const sel of selectors) {
        chatInput = await this.page.$(sel);
        if (chatInput) break;
      }

      if (!chatInput) {
        console.error('❌ Chat input not found');
        return false;
      }

      // CRITICAL: FORCE focus on chat box multiple times to ensure it sticks
      // This prevents cursor exploration from stealing focus
      for (let i = 0; i < 3; i++) {
        await chatInput.focus();
        await this.page.waitForTimeout(30);
      }

      // Check element stability and visibility before clicking
      const box = await chatInput.boundingBox();
      if (!box || box.width < 10 || box.height < 10) {
        console.error('❌ Chat input not visible or too small');
        return false;
      }

      // Verify focus is on the input
      const isFocused = await chatInput.evaluate(el => document.activeElement === el);
      if (!isFocused) {
        console.warn('⚠️ Chat input lost focus, forcing focus again');
        try {
          await chatInput.click({ timeout: 2000 }); // Click to force focus, short timeout
        } catch (err) {
          console.error('❌ Could not click chat input:', err.message);
          return false;
        }
        await this.page.waitForTimeout(50);
      }

      // Clear existing text
      await chatInput.evaluate(el => el.value = '');

      // Use fill() instead of type() - faster and handles emojis better
      await chatInput.fill(message);
      await this.page.waitForTimeout(100);

      // Ensure still focused before pressing Enter
      await chatInput.focus();
      await this.page.waitForTimeout(30);

      // Try to send message, catch click/press timeouts
      try {
        console.log(`[CoolholeClient] Attempting to send chat: ${message}`);
        await chatInput.press('Enter', { timeout: 3000 });
        console.log(`[CoolholeClient] Chat input Enter pressed successfully.`);
      } catch (err) {
        console.error('❌ Error pressing Enter to send message:', err.message);
        return false;
      }

      // Update rate limiting
      this.lastMessageTime = Date.now();

      console.log(`[CoolholeClient] Message sent to chat: ${message}`);
      return true;
    } catch (error) {
      console.error('Error sending message:', error.message);
      return false;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    setTimeout(() => {
      if (!this.connected) {
        console.log('Attempting to reconnect...');
        this.connect();
      }
    }, 5000);
  }

  /**
   * Disconnect from Coolhole.org
   */
  async disconnect() {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.connected = false;
  }

  /**
   * Handle any popup dialogs or modals
   */
  async handlePopups() {
    try {
      console.log('🚫 Clearing any blocking popups...');
      let popupCount = 0;
      
      while (popupCount < 5) {
        // Check if page still exists
        if (!this.page || this.page.isClosed()) {
          console.log('⚠️ Page closed during popup handling');
          break;
        }
        
        let found = false;
        
        // Check for various popup types
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