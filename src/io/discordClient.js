const { Client, GatewayIntentBits, Events } = require('discord.js');
const EventEmitter = require('events');

/**
 * Discord Client - Integrates Slunt with Discord servers
 */
class DiscordClient extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      token: config.token || process.env.DISCORD_TOKEN,
      clientId: config.clientId || process.env.DISCORD_CLIENT_ID,
      guildIds: config.guildIds || (process.env.DISCORD_GUILD_IDS || '').split(',').filter(Boolean),
      enabled: config.enabled !== false,
      ...config
    };
    
    this.client = null;
    this.isReady = false;
    this.messageQueue = [];
    this.rateLimits = new Map(); // channel -> last message time
  }

  /**
   * Connect to Discord
   */
  async connect() {
    if (!this.config.enabled || !this.config.token) {
      console.log('⚠️ [Discord] Not enabled or no token provided');
      return false;
    }

    try {
      console.log('🔗 [Discord] Connecting...');
      
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers
        ]
      });

      this.setupEventHandlers();
      
      await this.client.login(this.config.token);
      return true;
      
    } catch (error) {
      console.error('❌ [Discord] Connection error:', error.message);
      return false;
    }
  }

  /**
   * Setup Discord event handlers
   */
  setupEventHandlers() {
    this.client.once(Events.ClientReady, (client) => {
      this.isReady = true;
      console.log(`✅ [Discord] Connected as ${client.user.tag}`);
      console.log(`📊 [Discord] In ${client.guilds.cache.size} servers`);
      
      this.emit('ready', {
        username: client.user.username,
        guilds: client.guilds.cache.size
      });
      
      // Process queued messages
      this.processQueue();
    });

    this.client.on(Events.MessageCreate, (message) => {
      this.handleMessage(message);
    });

    this.client.on(Events.Error, (error) => {
      console.error('❌ [Discord] Client error:', error.message);
      this.emit('error', error);
    });

    this.client.on(Events.GuildCreate, (guild) => {
      console.log(`✨ [Discord] Joined server: ${guild.name}`);
    });
  }

  /**
   * Handle incoming Discord messages
   */
  handleMessage(message) {
    // Ignore bot's own messages
    if (message.author.id === this.client.user.id) {
      return;
    }

    // Ignore other bots (optional)
    if (message.author.bot) {
      return;
    }

    // Only respond in configured guilds (if specified)
    if (this.config.guildIds.length > 0 && !this.config.guildIds.includes(message.guildId)) {
      return;
    }

    // Check if message mentions Slunt (by @mention or by name as whole word)
    const mentionsSlunt = message.mentions.users.has(this.client.user.id) || 
                          /\bslunt\b/i.test(message.content); // Only match "slunt" as a complete word
    
    // Check if replying to Slunt's message
    const replyingToSlunt = message.reference && message.reference.userId === this.client.user.id;

    // Emit chat event with normalized format
    const chatData = {
      platform: 'discord',
      id: message.id,
      username: message.author.username,
      displayName: message.member?.displayName || message.author.username,
      userId: message.author.id,
      text: message.content,
      channel: message.channel.name,
      channelId: message.channelId,
      guildId: message.guildId,
      guildName: message.guild?.name,
      timestamp: message.createdTimestamp,
      mentionsBot: mentionsSlunt || replyingToSlunt, // Flag if Slunt is mentioned or replied to
      mentions: {
        users: message.mentions.users.map(u => u.username),
        roles: message.mentions.roles.map(r => r.name),
        everyone: message.mentions.everyone
      },
      attachments: message.attachments.map(a => ({
        url: a.url,
        name: a.name,
        type: a.contentType
      })),
      replyTo: message.reference ? {
        messageId: message.reference.messageId,
        channelId: message.reference.channelId
      } : null,
      rawMessage: message
    };

    console.log(`💬 [Discord] ${chatData.guildName}/#${chatData.channel} ${chatData.username}: ${chatData.text}`);
    
    this.emit('chat', chatData);
  }

  /**
   * Send a message to Discord
   */
  async sendMessage(channelId, content, options = {}) {
    if (!this.isReady) {
      console.warn('⚠️ [Discord] Not ready, queueing message');
      this.messageQueue.push({ channelId, content, options });
      return false;
    }

    try {
      // Rate limiting: 1 message per 2 seconds per channel
      const now = Date.now();
      const lastSent = this.rateLimits.get(channelId) || 0;
      const timeSince = now - lastSent;
      
      if (timeSince < 2000) {
        const waitTime = 2000 - timeSince;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel || !channel.isTextBased()) {
        console.error('❌ [Discord] Invalid channel:', channelId);
        return false;
      }

      // Split long messages (Discord limit: 2000 chars)
      const messages = this.splitMessage(content, 2000);
      
      for (const msg of messages) {
        await channel.send({
          content: msg,
          ...options
        });
        
        this.rateLimits.set(channelId, Date.now());
        
        // Delay between split messages
        if (messages.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return true;
      
    } catch (error) {
      console.error('❌ [Discord] Send error:', error.message);
      return false;
    }
  }

  /**
   * Reply to a specific message
   */
  async replyToMessage(messageData, content) {
    if (!messageData.rawMessage) {
      return this.sendMessage(messageData.channelId, content);
    }

    try {
      await messageData.rawMessage.reply(content);
      return true;
    } catch (error) {
      console.error('❌ [Discord] Reply error:', error.message);
      return this.sendMessage(messageData.channelId, content);
    }
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

    const sentences = content.split(/([.!?]\s+)/);
    
    for (let i = 0; i < sentences.length; i++) {
      const part = sentences[i];
      
      if ((current + part).length > maxLength) {
        if (current) {
          messages.push(current.trim());
          current = part;
        } else {
          // Single sentence too long, force split
          messages.push(part.substring(0, maxLength));
          current = part.substring(maxLength);
        }
      } else {
        current += part;
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
    while (this.messageQueue.length > 0) {
      const { channelId, content, options } = this.messageQueue.shift();
      await this.sendMessage(channelId, content, options);
    }
  }

  /**
   * Disconnect from Discord
   */
  async disconnect() {
    if (this.client) {
      console.log('👋 [Discord] Disconnecting...');
      await this.client.destroy();
      this.isReady = false;
      this.client = null;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isReady,
      guilds: this.client?.guilds.cache.size || 0,
      username: this.client?.user?.username || null,
      queuedMessages: this.messageQueue.length
    };
  }
}

module.exports = DiscordClient;
