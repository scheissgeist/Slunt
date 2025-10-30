const EventEmitter = require('events');

/**
 * Platform Manager - Coordinates multiple chat platforms
 * Routes messages between platforms and the ChatBot
 */
class PlatformManager extends EventEmitter {
  constructor() {
    super();
    this.platforms = new Map();
    this.isInitialized = false;
  }

  /**
   * Register a platform client
   */
  registerPlatform(name, client) {
    if (this.platforms.has(name)) {
      console.warn(`⚠️ [PlatformManager] ${name} already registered, replacing...`);
    }

    this.platforms.set(name, {
      name,
      client,
      connected: false
    });

    // Forward chat events from this platform
    client.on('chat', (chatData) => {
      this.handleIncomingMessage(name, chatData);
    });

    // Track connection status
    client.on('ready', () => {
      const platform = this.platforms.get(name);
      if (platform) {
        platform.connected = true;
        console.log(`✅ [PlatformManager] ${name} is ready`);
      }
    });

    client.on('disconnected', () => {
      const platform = this.platforms.get(name);
      if (platform) {
        platform.connected = false;
        console.log(`⚠️ [PlatformManager] ${name} disconnected`);
      }
    });

    console.log(`📝 [PlatformManager] Registered platform: ${name}`);
  }

  /**
   * Initialize all registered platforms
   */
  async initialize() {
    console.log(`🚀 [PlatformManager] Initializing ${this.platforms.size} platforms...`);

    const results = [];
    
    for (const [name, platformData] of this.platforms) {
      try {
        console.log(`🔌 [PlatformManager] Connecting ${name}...`);
        const success = await platformData.client.connect();
        results.push({ name, success });
        
        if (success) {
          platformData.connected = true;
        }
      } catch (error) {
        console.error(`❌ [PlatformManager] ${name} failed to connect:`, error.message);
        results.push({ name, success: false, error: error.message });
      }
    }

    this.isInitialized = true;

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ [PlatformManager] Initialized ${successCount}/${this.platforms.size} platforms`);

    return results;
  }

  /**
   * Handle incoming message from any platform
   */
  handleIncomingMessage(platformName, chatData) {
    // Add platform info if not present
    if (!chatData.platform) {
      chatData.platform = platformName;
    }

    // Emit unified chat event
    this.emit('chat', chatData);
  }

  /**
   * Send message to specific platform/channel
   */
  async sendMessage(platform, channel, content, options = {}) {
    const platformData = this.platforms.get(platform);
    
    if (!platformData) {
      console.error(`❌ [PlatformManager] Unknown platform: ${platform}`);
      return false;
    }

    if (!platformData.connected) {
      console.warn(`⚠️ [PlatformManager] ${platform} not connected`);
      return false;
    }

    try {
      // Different platforms have different send methods
      const client = platformData.client;
      
      if (platform === 'discord' && options.replyTo) {
        // Discord reply
        return await client.replyToMessage(options.replyTo, content);
      } else if (client.sendMessage) {
        // Standard sendMessage method
        return await client.sendMessage(channel, content, options);
      } else {
        console.error(`❌ [PlatformManager] ${platform} has no sendMessage method`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ [PlatformManager] Error sending to ${platform}:`, error.message);
      return false;
    }
  }

  /**
   * Broadcast message to all connected platforms
   */
  async broadcast(message, filter = null) {
    const results = [];

    for (const [name, platformData] of this.platforms) {
      if (!platformData.connected) continue;
      if (filter && !filter(name, platformData)) continue;

      try {
        // Get default channel for each platform
        const channel = this.getDefaultChannel(name, platformData);
        if (channel) {
          const success = await this.sendMessage(name, channel, message);
          results.push({ platform: name, channel, success });
        }
      } catch (error) {
        console.error(`❌ [PlatformManager] Broadcast to ${name} failed:`, error.message);
        results.push({ platform: name, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get default channel for a platform
   */
  getDefaultChannel(platformName, platformData) {
    const client = platformData.client;

    if (platformName === 'coolhole') {
      return client.currentChannel;
    } else if (platformName === 'discord' && client.client) {
      // First available text channel in first guild
      const guild = client.client.guilds.cache.first();
      if (guild) {
        const channel = guild.channels.cache.find(ch => ch.isTextBased?.());
        return channel?.id;
      }
    } else if (platformName === 'twitch' && client.config.channels?.length > 0) {
      return client.config.channels[0];
    }

    return null;
  }

  /**
   * Shutdown all platforms gracefully
   */
  async shutdown() {
    console.log('🛑 [PlatformManager] Shutting down all platforms...');

    for (const [name, platformData] of this.platforms) {
      try {
        if (platformData.client.disconnect) {
          await platformData.client.disconnect();
        }
        platformData.connected = false;
        console.log(`✅ [PlatformManager] ${name} disconnected`);
      } catch (error) {
        console.error(`❌ [PlatformManager] Error disconnecting ${name}:`, error.message);
      }
    }

    this.platforms.clear();
    this.isInitialized = false;
  }

  /**
   * Get status of all platforms
   */
  getStatus() {
    const status = {};

    for (const [name, platformData] of this.platforms) {
      status[name] = {
        connected: platformData.connected,
        details: platformData.client.getStatus?.() || {}
      };
    }

    return status;
  }

  /**
   * Get list of connected platforms
   */
  getConnectedPlatforms() {
    const connected = [];
    
    for (const [name, platformData] of this.platforms) {
      if (platformData.connected) {
        connected.push(name);
      }
    }

    return connected;
  }

  /**
   * Check if a specific platform is connected
   */
  isConnected(platformName) {
    const platform = this.platforms.get(platformName);
    return platform ? platform.connected : false;
  }
}

module.exports = PlatformManager;
