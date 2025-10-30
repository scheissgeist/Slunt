const EventEmitter = require('events');

/**
 * Automatic Clip Creator
 * Monitors chat activity and creates Twitch clips at peak moments
 */
class ClipCreator extends EventEmitter {
  constructor(twitchClient) {
    super();
    this.twitchClient = twitchClient;
    
    // Activity tracking (ALL PLATFORMS)
    this.activityWindow = []; // Recent messages from all platforms
    this.windowSize = 30000; // 30 seconds
    this.clipCooldown = 120000; // 2 minutes between clips
    this.lastClipTime = 0;
    
    // Platform-specific activity
    this.platformActivity = {
      twitch: { messages: 0, reactions: 0 },
      discord: { messages: 0, reactions: 0 },
      coolhole: { messages: 0, reactions: 0 }
    };
    
    // Thresholds (aggregate across all platforms)
    this.thresholds = {
      messageSpike: 15, // 15+ messages in 30s (ANY PLATFORM)
      laughReactions: 5, // 5+ LOL/LMAO/emotes (ANY PLATFORM)
      capsRatio: 0.4, // 40% messages in CAPS (ANY PLATFORM)
      exclamationCount: 8 // 8+ exclamation marks (ANY PLATFORM)
    };
    
    // Laugh/reaction patterns
    this.reactionPatterns = [
      /\b(lol|lmao|rofl|lmfao|haha|hehe|kek|omegalul)\b/gi,
      /😂|🤣|💀|😭/g,
      /\b(bruh|oof|rip|holy|damn|wtf|omg)\b/gi
    ];
    
    // Clip tracking
    this.createdClips = [];
    this.clipQueue = [];
  }

  /**
   * Process incoming chat message
   */
  processMessage(data) {
    const now = Date.now();
    const platform = data.platform || 'unknown';
    
    // Add to activity window
    const messageData = {
      username: data.username,
      text: data.text,
      timestamp: now,
      platform: platform,
      caps: this.isCaps(data.text),
      reaction: this.hasReaction(data.text),
      exclamations: (data.text.match(/!/g) || []).length
    };
    
    this.activityWindow.push(messageData);
    
    // Update platform-specific counters
    if (this.platformActivity[platform]) {
      this.platformActivity[platform].messages++;
      if (messageData.reaction) {
        this.platformActivity[platform].reactions++;
      }
    }
    
    // Clean old messages from window
    this.activityWindow = this.activityWindow.filter(
      msg => now - msg.timestamp < this.windowSize
    );
    
    // Reset platform counters for messages outside window
    for (const platform in this.platformActivity) {
      this.platformActivity[platform].messages = this.activityWindow.filter(m => m.platform === platform).length;
      this.platformActivity[platform].reactions = this.activityWindow.filter(m => m.platform === platform && m.reaction).length;
    }
    
    // Check if we should clip (aggregate across all platforms)
    if (this.shouldCreateClip()) {
      this.createClip('auto_detection');
    }
  }

  /**
   * Check if message is mostly caps
   */
  isCaps(text) {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length < 3) return false;
    const upper = letters.replace(/[^A-Z]/g, '');
    return upper.length / letters.length > 0.7;
  }

  /**
   * Check if message contains reactions
   */
  hasReaction(text) {
    return this.reactionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Determine if current activity warrants a clip
   */
  shouldCreateClip() {
    const now = Date.now();
    
    // Check cooldown
    if (now - this.lastClipTime < this.clipCooldown) {
      return false;
    }
    
    // Not enough activity
    if (this.activityWindow.length < 5) {
      return false;
    }
    
    // Calculate metrics
    const metrics = {
      messageCount: this.activityWindow.length,
      reactionCount: this.activityWindow.filter(m => m.reaction).length,
      capsCount: this.activityWindow.filter(m => m.caps).length,
      exclamationTotal: this.activityWindow.reduce((sum, m) => sum + m.exclamations, 0)
    };
    
    // Check thresholds
    const triggers = {
      messageSpike: metrics.messageCount >= this.thresholds.messageSpike,
      laughReactions: metrics.reactionCount >= this.thresholds.laughReactions,
      capsRatio: (metrics.capsCount / metrics.messageCount) >= this.thresholds.capsRatio,
      exclamations: metrics.exclamationTotal >= this.thresholds.exclamationCount
    };
    
    // Need at least 2 triggers
    const triggerCount = Object.values(triggers).filter(Boolean).length;
    
    if (triggerCount >= 2) {
      console.log('🎬 [Clip] Multiple triggers detected:', triggers);
      console.log('📊 [Clip] Metrics:', metrics);
      return true;
    }
    
    return false;
  }

  /**
   * Create a Twitch clip
   */
  async createClip(reason = 'manual') {
    try {
      const now = Date.now();
      this.lastClipTime = now;
      
      // Validate environment variables
      if (!process.env.TWITCH_OAUTH_TOKEN || !process.env.TWITCH_CLIENT_ID) {
        console.error('❌ [Clip] Missing Twitch API credentials');
        return null;
      }
      
      // Get broadcaster ID
      const channel = this.twitchClient?.channels?.[0]?.replace('#', '');
      if (!channel) {
        console.error('❌ [Clip] No channel configured');
        return null;
      }
      
      console.log(`🎬 [Clip] Creating clip for ${channel} (reason: ${reason})`);
      
      // Get broadcaster ID with error handling
      const broadcasterId = await this.getBroadcasterId(channel);
      if (!broadcasterId) {
        console.error('❌ [Clip] Could not resolve broadcaster ID');
        return null;
      }
      
      // Call Twitch Helix API to create clip with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('https://api.twitch.tv/helix/clips', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TWITCH_OAUTH_TOKEN.replace('oauth:', '')}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          broadcaster_id: broadcasterId
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Ratelimit-Reset');
        console.warn(`⏳ [Clip] Rate limited. Retry after: ${retryAfter}`);
        return null;
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        console.error('❌ [Clip] Authentication failed - token may be expired');
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Twitch API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      // Validate response data
      if (!data.data || !data.data[0]) {
        console.error('❌ [Clip] Invalid response from Twitch API');
        return null;
      }
      
      const clip = data.data[0];
      
      const clipInfo = {
        id: clip.id,
        edit_url: clip.edit_url,
        createdAt: now,
        reason: reason,
        activitySnapshot: {
          messageCount: this.activityWindow.length,
          reactionCount: this.activityWindow.filter(m => m.reaction).length
        }
      };
      
      this.createdClips.push(clipInfo);
      
      console.log(`✅ [Clip] Created: ${clip.edit_url}`);
      this.emit('clipCreated', clipInfo);
      
      return clipInfo;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ [Clip] Request timeout - Twitch API took too long to respond');
      } else {
        console.error('❌ [Clip] Failed to create clip:', error.message);
      }
      return null;
    }
  }

  /**
   * Get broadcaster ID from username
   */
  async getBroadcasterId(username) {
    try {
      if (!username) {
        console.error('❌ [Clip] No username provided for broadcaster ID lookup');
        return null;
      }
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
        headers: {
          'Authorization': `Bearer ${process.env.TWITCH_OAUTH_TOKEN?.replace('oauth:', '')}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle rate limiting
      if (response.status === 429) {
        console.warn('⏳ [Clip] Rate limited on user lookup');
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ [Clip] Failed to get broadcaster ID: ${response.status} - ${errorData.message || 'Unknown error'}`);
        return null;
      }
      
      const data = await response.json();
      
      // Validate response data
      if (!data.data || data.data.length === 0) {
        console.error(`❌ [Clip] User not found: ${username}`);
        return null;
      }
      
      return data.data[0]?.id;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ [Clip] Timeout getting broadcaster ID');
      } else {
        console.error('❌ [Clip] Failed to get broadcaster ID:', error.message);
      }
      return null;
    }
  }

  /**
   * Manually trigger clip creation
   */
  async manualClip() {
    return this.createClip('manual_trigger');
  }

  /**
   * Get clip history
   */
  getClipHistory(limit = 10) {
    return this.createdClips.slice(-limit).reverse();
  }

  /**
   * Get current activity metrics
   */
  getCurrentMetrics() {
    if (this.activityWindow.length === 0) {
      return null;
    }
    
    return {
      windowSize: this.windowSize / 1000,
      messageCount: this.activityWindow.length,
      reactionCount: this.activityWindow.filter(m => m.reaction).length,
      capsCount: this.activityWindow.filter(m => m.caps).length,
      exclamationTotal: this.activityWindow.reduce((sum, m) => sum + m.exclamations, 0),
      uniqueUsers: new Set(this.activityWindow.map(m => m.username)).size,
      clipCooldown: Math.max(0, this.clipCooldown - (Date.now() - this.lastClipTime)) / 1000,
      platformActivity: this.platformActivity,
      platformBreakdown: {
        twitch: {
          messages: this.activityWindow.filter(m => m.platform === 'twitch').length,
          reactions: this.activityWindow.filter(m => m.platform === 'twitch' && m.reaction).length,
          users: new Set(this.activityWindow.filter(m => m.platform === 'twitch').map(m => m.username)).size
        },
        discord: {
          messages: this.activityWindow.filter(m => m.platform === 'discord').length,
          reactions: this.activityWindow.filter(m => m.platform === 'discord' && m.reaction).length,
          users: new Set(this.activityWindow.filter(m => m.platform === 'discord').map(m => m.username)).size
        },
        coolhole: {
          messages: this.activityWindow.filter(m => m.platform === 'coolhole').length,
          reactions: this.activityWindow.filter(m => m.platform === 'coolhole' && m.reaction).length,
          users: new Set(this.activityWindow.filter(m => m.platform === 'coolhole').map(m => m.username)).size
        }
      }
    };
  }

  /**
   * Adjust sensitivity
   */
  setSensitivity(level) {
    // level: 'low', 'medium', 'high'
    const settings = {
      low: { messageSpike: 20, laughReactions: 7, capsRatio: 0.5, exclamationCount: 10 },
      medium: { messageSpike: 15, laughReactions: 5, capsRatio: 0.4, exclamationCount: 8 },
      high: { messageSpike: 10, laughReactions: 3, capsRatio: 0.3, exclamationCount: 5 }
    };
    
    if (settings[level]) {
      this.thresholds = settings[level];
      console.log(`🎚️ [Clip] Sensitivity set to: ${level}`);
    }
  }

  /**
   * Get status for dashboard
   */
  getStatus() {
    return {
      enabled: true,
      thresholds: this.thresholds,
      clipCooldown: this.clipCooldown / 1000,
      timeSinceLastClip: (Date.now() - this.lastClipTime) / 1000,
      totalClips: this.createdClips.length,
      currentActivity: this.getCurrentMetrics(),
      recentClips: this.getClipHistory(5)
    };
  }
}

module.exports = ClipCreator;
