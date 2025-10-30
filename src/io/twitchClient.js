const tmi = require('tmi.js');
const EventEmitter = require('events');

/**
 * Twitch Client - Integrates Slunt with Twitch chat
 */
class TwitchClient extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      username: config.username || process.env.TWITCH_USERNAME,
      token: config.token || process.env.TWITCH_OAUTH_TOKEN,
      channels: config.channels || (process.env.TWITCH_CHANNELS || '').split(',').filter(Boolean),
      enabled: config.enabled !== false,
      ...config
    };
    
    this.client = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.rateLimits = new Map(); // channel -> messages in window
    this.rateWindow = 30000; // 30 seconds
    this.maxMessagesPerWindow = 20; // Twitch limit for regular users
  }

  /**
   * Connect to Twitch
   */
  async connect() {
    if (!this.config.enabled || !this.config.username || !this.config.token) {
      console.log('⚠️ [Twitch] Not enabled or missing credentials');
      return false;
    }

    if (this.config.channels.length === 0) {
      console.log('⚠️ [Twitch] No channels configured');
      return false;
    }

    try {
      console.log('🔗 [Twitch] Connecting...');
      
      // Format OAuth token
      const token = this.config.token.startsWith('oauth:') 
        ? this.config.token 
        : `oauth:${this.config.token}`;

      this.client = new tmi.Client({
        options: { debug: false },
        connection: {
          secure: true,
          reconnect: true
        },
        identity: {
          username: this.config.username,
          password: token
        },
        channels: this.config.channels
      });

      this.setupEventHandlers();
      
      await this.client.connect();
      return true;
      
    } catch (error) {
      console.error('❌ [Twitch] Connection error:', error.message);
      return false;
    }
  }

  /**
   * Setup Twitch event handlers
   */
  setupEventHandlers() {
    this.client.on('connected', (address, port) => {
      this.isConnected = true;
      console.log(`✅ [Twitch] Connected to ${address}:${port}`);
      console.log(`📺 [Twitch] Joined channels: ${this.config.channels.join(', ')}`);
      
      this.emit('ready', {
        username: this.config.username,
        channels: this.config.channels
      });
      
      // Process queued messages
      this.processQueue();
    });

    this.client.on('message', (channel, tags, message, self) => {
      this.handleMessage(channel, tags, message, self);
    });

    this.client.on('disconnected', (reason) => {
      this.isConnected = false;
      console.log(`👋 [Twitch] Disconnected: ${reason}`);
      this.emit('disconnected', reason);
    });

    this.client.on('reconnect', () => {
      console.log('🔄 [Twitch] Reconnecting...');
    });

    this.client.on('join', (channel, username, self) => {
      if (self) {
        console.log(`✨ [Twitch] Joined channel: ${channel}`);
      }
    });
  }

  /**
   * Handle incoming Twitch messages
   */
  handleMessage(channel, tags, message, self) {
    // Ignore bot's own messages
    if (self) {
      return;
    }

    // Clean channel name (remove #)
    const channelName = channel.replace('#', '');

    // Check if bot is mentioned (@sluntbot or "slunt" as whole word in message)
    const botUsername = this.config.username.toLowerCase();
    const messageLC = message.toLowerCase();
    const mentionsBot = messageLC.includes(`@${botUsername}`) || 
                       /\bslunt\b/i.test(message) || // Only match "slunt" as a complete word
                       new RegExp(`\\b${botUsername}\\b`, 'i').test(message);

    // Emit chat event with normalized format
    const chatData = {
      platform: 'twitch',
      id: tags.id,
      username: tags.username,
      displayName: tags['display-name'] || tags.username,
      userId: tags['user-id'],
      text: message,
      channel: channelName,
      timestamp: parseInt(tags['tmi-sent-ts']) || Date.now(),
      badges: tags.badges || {},
      isMod: tags.mod || false,
      isSubscriber: tags.subscriber || false,
      isVip: tags.badges?.vip === '1',
      isBroadcaster: tags.badges?.broadcaster === '1',
      color: tags.color,
      emotes: tags.emotes || {},
      mentionsBot: mentionsBot, // NEW: Platform awareness
      rawTags: tags
    };

    console.log(`💬 [Twitch] #${channelName} ${chatData.displayName}: ${chatData.text}`);
    
    this.emit('chat', chatData);
  }

  /**
   * Send a message to Twitch channel
   */
  async sendMessage(channel, content) {
    if (!this.isConnected) {
      console.warn('⚠️ [Twitch] Not connected, queueing message');
      this.messageQueue.push({ channel, content });
      return false;
    }

    // Ensure channel starts with #
    const channelName = channel.startsWith('#') ? channel : `#${channel}`;

    // Rate limiting: 20 messages per 30 seconds for regular users
    if (!this.canSendMessage(channelName)) {
      console.warn(`⚠️ [Twitch] Rate limit reached for ${channelName}, queueing`);
      this.messageQueue.push({ channel: channelName, content });
      return false;
    }

    try {
      // Split long messages (Twitch limit: 500 chars)
      const messages = this.splitMessage(content, 480); // Leave some buffer
      
      for (const msg of messages) {
        await this.client.say(channelName, msg);
        this.trackMessage(channelName);
        
        // Delay between split messages
        if (messages.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      return true;
      
    } catch (error) {
      console.error('❌ [Twitch] Send error:', error.message);
      return false;
    }
  }

  /**
   * Check if we can send a message (rate limiting)
   */
  canSendMessage(channel) {
    const now = Date.now();
    const channelLimits = this.rateLimits.get(channel) || [];
    
    // Remove old timestamps outside the window
    const recentMessages = channelLimits.filter(ts => now - ts < this.rateWindow);
    this.rateLimits.set(channel, recentMessages);
    
    return recentMessages.length < this.maxMessagesPerWindow;
  }

  /**
   * Track a sent message for rate limiting
   */
  trackMessage(channel) {
    const limits = this.rateLimits.get(channel) || [];
    limits.push(Date.now());
    this.rateLimits.set(channel, limits);
  }

  /**
   * Split long messages
   */
  splitMessage(content, maxLength) {
    if (content.length <= maxLength) {
      return [content];
    }

    const messages = [];
    let current = '';

    const words = content.split(' ');
    
    for (const word of words) {
      if ((current + ' ' + word).length > maxLength) {
        if (current) {
          messages.push(current.trim());
          current = word;
        } else {
          // Single word too long, force split
          messages.push(word.substring(0, maxLength));
          current = word.substring(maxLength);
        }
      } else {
        current += (current ? ' ' : '') + word;
      }
    }

    if (current) {
      messages.push(current.trim());
    }

    return messages;
  }

  /**
   * Process queued messages
   */
  async processQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const { channel, content } = this.messageQueue.shift();
      
      if (this.canSendMessage(channel)) {
        await this.sendMessage(channel, content);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Safety delay
      } else {
        // Put it back if we hit rate limit
        this.messageQueue.unshift({ channel, content });
        break;
      }
    }
  }

  /**
   * Disconnect from Twitch
   */
  async disconnect() {
    if (this.client) {
      console.log('👋 [Twitch] Disconnecting...');
      await this.client.disconnect();
      this.isConnected = false;
      this.client = null;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      channels: this.config.channels,
      username: this.config.username,
      queuedMessages: this.messageQueue.length,
      rateLimits: Object.fromEntries(
        Array.from(this.rateLimits.entries()).map(([ch, msgs]) => [ch, msgs.length])
      )
    };
  }
}

module.exports = TwitchClient;
