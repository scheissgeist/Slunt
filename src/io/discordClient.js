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
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessageReactions
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
      
      // Log channels for debugging
      client.guilds.cache.forEach(guild => {
        console.log(`📋 [Discord] Guild: ${guild.name} (${guild.id})`);
        console.log(`   Channels: ${guild.channels.cache.filter(c => c.isTextBased()).map(c => `#${c.name}`).join(', ')}`);
      });
      
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

    // Handle message reactions
    this.client.on(Events.MessageReactionAdd, (reaction, user) => {
      this.handleReactionAdd(reaction, user);
    });

    this.client.on(Events.MessageReactionRemove, (reaction, user) => {
      this.handleReactionRemove(reaction, user);
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
    console.log(`🔍 [Discord] Message received from ${message.author.tag} in #${message.channel.name}`);
    
    // Ignore bot's own messages
    if (message.author.id === this.client.user.id) {
      console.log(`   ⏭️ Skipping own message`);
      return;
    }

    // Ignore other bots (optional)
    if (message.author.bot) {
      console.log(`   ⏭️ Skipping bot message`);
      return;
    }

    // Skip messages without text content (embeds, images, etc.)
    if (!message.content || message.content.trim().length === 0) {
      console.log(`   ⏭️ Skipping message without text content`);
      return;
    }

    // Only respond in configured guilds (if specified)
    if (this.config.guildIds.length > 0 && !this.config.guildIds.includes(message.guildId)) {
      console.log(`   ⏭️ Skipping - guild not configured (${message.guildId} not in [${this.config.guildIds.join(', ')}])`);
      return;
    }

    // Monitor ALL channels (removed channel restriction)
    console.log(`   ✅ Monitoring all channels (currently in #${message.channel.name})`);

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
   * Handle reaction added to message
   */
  async handleReactionAdd(reaction, user) {
    // Ignore bot reactions
    if (user.bot) return;

    try {
      // Fetch the message if it's partial
      if (reaction.partial) {
        await reaction.fetch();
      }
      if (reaction.message.partial) {
        await reaction.message.fetch();
      }

      // Only process reactions to Slunt's messages
      if (reaction.message.author.id !== this.client.user.id) return;

      const reactionData = {
        platform: 'discord',
        type: 'reaction_add',
        messageId: reaction.message.id,
        messageContent: reaction.message.content,
        channelId: reaction.message.channelId,
        channelName: reaction.message.channel.name,
        guildId: reaction.message.guildId,
        guildName: reaction.message.guild?.name,
        userId: user.id,
        username: user.username,
        displayName: reaction.message.guild?.members.cache.get(user.id)?.displayName || user.username,
        emoji: reaction.emoji.name,
        emojiId: reaction.emoji.id,
        isCustomEmoji: reaction.emoji.id !== null,
        timestamp: Date.now()
      };

      console.log(`👍 [Discord] ${reactionData.username} reacted ${reactionData.emoji} to Slunt's message`);
      this.emit('reaction', reactionData);

    } catch (error) {
      console.error('❌ [Discord] Error handling reaction add:', error);
    }
  }

  /**
   * Handle reaction removed from message
   */
  async handleReactionRemove(reaction, user) {
    // Ignore bot reactions
    if (user.bot) return;

    try {
      // Fetch the message if it's partial
      if (reaction.partial) {
        await reaction.fetch();
      }
      if (reaction.message.partial) {
        await reaction.message.fetch();
      }

      // Only process reactions to Slunt's messages
      if (reaction.message.author.id !== this.client.user.id) return;

      const reactionData = {
        platform: 'discord',
        type: 'reaction_remove',
        messageId: reaction.message.id,
        messageContent: reaction.message.content,
        channelId: reaction.message.channelId,
        channelName: reaction.message.channel.name,
        guildId: reaction.message.guildId,
        guildName: reaction.message.guild?.name,
        userId: user.id,
        username: user.username,
        displayName: reaction.message.guild?.members.cache.get(user.id)?.displayName || user.username,
        emoji: reaction.emoji.name,
        emojiId: reaction.emoji.id,
        isCustomEmoji: reaction.emoji.id !== null,
        timestamp: Date.now()
      };

      console.log(`👎 [Discord] ${reactionData.username} removed ${reactionData.emoji} reaction from Slunt's message`);
      this.emit('reaction', reactionData);

    } catch (error) {
      console.error('❌ [Discord] Error handling reaction remove:', error);
    }
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
   * Add a reaction to a message
   */
  async addReaction(channelId, messageId, emoji) {
    if (!this.isReady) {
      console.warn('⚠️ [Discord] Not ready, skipping reaction');
      return false;
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel || !channel.isTextBased()) {
        console.error('❌ [Discord] Invalid channel for reaction:', channelId);
        return false;
      }

      const message = await channel.messages.fetch(messageId);
      
      if (!message) {
        console.error('❌ [Discord] Message not found:', messageId);
        return false;
      }

      await message.react(emoji);
      console.log(`😀 [Discord] Added reaction ${emoji} to message ${messageId}`);
      return true;
      
    } catch (error) {
      console.error('❌ [Discord] Reaction error:', error.message);
      return false;
    }
  }

  /**
   * React to a message based on raw message object
   */
  async reactToMessage(messageData, emoji) {
    if (!messageData.rawMessage) {
      return this.addReaction(messageData.channelId, messageData.messageId, emoji);
    }

    try {
      await messageData.rawMessage.react(emoji);
      console.log(`😀 [Discord] Added reaction ${emoji}`);
      return true;
    } catch (error) {
      console.error('❌ [Discord] Reaction error:', error.message);
      return false;
    }
  }

  /**
   * Send a DM to a user
   * @param {string} userId - Discord user ID
   * @param {string|Object} content - Message content or options object
   * @param {Object} options - Additional options (ignored if content is object)
   * @returns {boolean} Success status
   */
  async sendDM(userId, content, options = {}) {
    if (!this.isReady) {
      console.warn('⚠️ [Discord] Not ready, cannot send DM');
      return false;
    }

    try {
      const user = await this.client.users.fetch(userId);
      
      if (!user) {
        console.error('❌ [Discord] User not found:', userId);
        return false;
      }

      // Create or fetch existing DM channel
      const dmChannel = await user.createDM();
      
      // Rate limiting for DMs
      const now = Date.now();
      const lastSent = this.rateLimits.get(`dm_${userId}`) || 0;
      const timeSince = now - lastSent;
      
      if (timeSince < 3000) { // 3 seconds between DMs
        const waitTime = 3000 - timeSince;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Handle content as object (with embeds) or string
      if (typeof content === 'object' && content !== null) {
        // Content is already an options object with embeds, etc.
        await dmChannel.send(content);
        this.rateLimits.set(`dm_${userId}`, Date.now());
        console.log(`💬 [Discord] DM sent to ${user.username} (with embeds)`);
        return true;
      }

      // Content is a string - split long messages
      const messages = this.splitMessage(content, 2000);
      
      for (const msg of messages) {
        await dmChannel.send({
          content: msg,
          ...options
        });
        
        this.rateLimits.set(`dm_${userId}`, Date.now());
        
        if (messages.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`💬 [Discord] DM sent to ${user.username}: ${content.substring(0, 50)}...`);
      return true;
      
    } catch (error) {
      console.error('❌ [Discord] DM error:', error.message);
      return false;
    }
  }

  /**
   * Send a DM with username lookup (convenience method)
   * @param {string} username - Discord username or display name
   * @param {string} content - Message content
   * @param {string} guildId - Guild ID to search in (optional)
   * @returns {boolean} Success status
   */
  async sendDMByUsername(username, content, guildId = null) {
    try {
      let userId = null;

      if (guildId) {
        // Search in specific guild
        const guild = await this.client.guilds.fetch(guildId);
        const members = await guild.members.fetch();
        
        const member = members.find(m => 
          m.user.username.toLowerCase() === username.toLowerCase() ||
          m.displayName.toLowerCase() === username.toLowerCase()
        );
        
        if (member) {
          userId = member.user.id;
        }
      } else {
        // Search in all guilds
        for (const [, guild] of this.client.guilds.cache) {
          const members = await guild.members.fetch();
          const member = members.find(m => 
            m.user.username.toLowerCase() === username.toLowerCase() ||
            m.displayName.toLowerCase() === username.toLowerCase()
          );
          
          if (member) {
            userId = member.user.id;
            break;
          }
        }
      }

      if (!userId) {
        console.error('❌ [Discord] Could not find user:', username);
        return false;
      }

      return await this.sendDM(userId, content);
      
    } catch (error) {
      console.error('❌ [Discord] DM by username error:', error.message);
      return false;
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
