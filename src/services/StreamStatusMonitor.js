const EventEmitter = require('events');

/**
 * Stream Status Monitor
 * Monitors Twitch stream status and manages platform availability based on streaming state
 */
class StreamStatusMonitor extends EventEmitter {
  constructor(platformManager) {
    super();
    this.platformManager = platformManager;
    this.isLive = false;
    this.checkInterval = null;
    this.channelName = null;
    
    // Configuration
    this.CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds
  }

  /**
   * Start monitoring stream status
   */
  async start(channelName) {
    if (!channelName) {
      throw new Error('Channel name is required');
    }
    
    this.channelName = channelName;
    console.log(`📡 [StreamMonitor] Starting monitoring for ${channelName}`);
    
    // Initial check
    await this.checkStreamStatus();
    
    // Periodic checks
    this.checkInterval = setInterval(() => {
      this.checkStreamStatus();
    }, this.CHECK_INTERVAL);
    
    console.log(`✅ [StreamMonitor] Monitoring started (checking every ${this.CHECK_INTERVAL / 1000}s)`);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 [StreamMonitor] Monitoring stopped');
    }
  }

  /**
   * Check if stream is currently live
   */
  async checkStreamStatus() {
    try {
      const streamData = await this.getStreamData();
      const wasLive = this.isLive;
      this.isLive = streamData && streamData.type === 'live';
      
      // Status changed - trigger platform switching
      if (wasLive !== this.isLive) {
        console.log(`📺 [StreamMonitor] Stream status changed: ${wasLive ? 'LIVE' : 'OFFLINE'} -> ${this.isLive ? 'LIVE' : 'OFFLINE'}`);
        
        if (this.isLive) {
          await this.handleGoingLive(streamData);
        } else {
          await this.handleGoingOffline();
        }
        
        this.emit('statusChange', {
          isLive: this.isLive,
          wasLive,
          streamData
        });
      }
      
      return this.isLive;
    } catch (error) {
      console.error('❌ [StreamMonitor] Error checking stream status:', error.message);
      return this.isLive; // Return last known status
    }
  }

  /**
   * Get stream data from Twitch API
   */
  async getStreamData() {
    try {
      // Validate credentials
      if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_OAUTH_TOKEN) {
        console.error('❌ [StreamMonitor] Missing Twitch API credentials');
        return null;
      }
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      // Use Twitch Helix API to check stream status
      const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${this.channelName}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${process.env.TWITCH_OAUTH_TOKEN.replace('oauth:', '')}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        const retryAfter = response.headers.get('Ratelimit-Reset');
        const resetTime = retryAfter ? new Date(parseInt(retryAfter) * 1000) : new Date(Date.now() + 60000);
        console.warn(`⏳ [StreamMonitor] Rate limited. Retry after: ${resetTime.toLocaleTimeString()}`);
        
        // Temporarily increase check interval to avoid more rate limits
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = setInterval(() => {
            this.checkStreamStatus();
          }, this.CHECK_INTERVAL * 2); // Double the interval temporarily
          
          // Reset to normal interval after 5 minutes
          setTimeout(() => {
            if (this.checkInterval) {
              clearInterval(this.checkInterval);
              this.checkInterval = setInterval(() => {
                this.checkStreamStatus();
              }, this.CHECK_INTERVAL);
            }
          }, 300000);
        }
        
        return null;
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        console.error('❌ [StreamMonitor] Authentication failed - token may be expired');
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Twitch API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      // Validate response structure
      if (!data || !Array.isArray(data.data)) {
        console.error('❌ [StreamMonitor] Invalid response structure from Twitch API');
        return null;
      }
      
      return data.data && data.data.length > 0 ? data.data[0] : null;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ [StreamMonitor] Request timeout - Twitch API took too long to respond');
      } else {
        console.error('❌ [StreamMonitor] Failed to fetch stream data:', error.message);
      }
      return null;
    }
  }

  /**
   * Handle stream going live
   * Enable: Twitch + Coolhole
   * Disable: Discord
   */
  async handleGoingLive(streamData) {
    console.log('🔴 [StreamMonitor] Going LIVE!');
    console.log(`   Title: ${streamData?.title || 'N/A'}`);
    console.log(`   Game: ${streamData?.game_name || 'N/A'}`);
    console.log(`   Viewers: ${streamData?.viewer_count || 0}`);
    
    // Disable Discord responses
    await this.disablePlatform('discord');
    
    // Ensure Twitch and Coolhole are enabled
    await this.enablePlatform('twitch');
    await this.enablePlatform('coolhole');
    
    console.log('✅ [StreamMonitor] Platform config: Twitch + Coolhole (Discord disabled)');
  }

  /**
   * Handle stream going offline
   * Enable: Coolhole + Discord
   * Disable: Twitch
   */
  async handleGoingOffline() {
    console.log('⚫ [StreamMonitor] Going OFFLINE');
    
    // Disable Twitch responses
    await this.disablePlatform('twitch');
    
    // Ensure Coolhole and Discord are enabled
    await this.enablePlatform('coolhole');
    await this.enablePlatform('discord');
    
    console.log('✅ [StreamMonitor] Platform config: Coolhole + Discord (Twitch disabled)');
  }

  /**
   * Disable a platform (stop responding but maintain connection)
   */
  async disablePlatform(platformName) {
    const platform = this.platformManager.platforms.get(platformName);
    if (platform && platform.client) {
      platform.client.disabled = true;
      console.log(`🔇 [StreamMonitor] ${platformName} responses disabled`);
    }
  }

  /**
   * Enable a platform
   */
  async enablePlatform(platformName) {
    const platform = this.platformManager.platforms.get(platformName);
    if (platform && platform.client) {
      platform.client.disabled = false;
      console.log(`🔊 [StreamMonitor] ${platformName} responses enabled`);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isLive: this.isLive,
      channelName: this.channelName,
      checkInterval: this.CHECK_INTERVAL,
      activePlatforms: this.getActivePlatforms()
    };
  }

  /**
   * Get list of currently active platforms
   */
  getActivePlatforms() {
    const active = [];
    
    for (const [name, platform] of this.platformManager.platforms) {
      if (platform.connected && !platform.client.disabled) {
        active.push(name);
      }
    }
    
    return active;
  }

  /**
   * Manual override to set stream status
   */
  setStreamStatus(isLive) {
    console.log(`🎮 [StreamMonitor] Manual override: ${isLive ? 'LIVE' : 'OFFLINE'}`);
    const wasLive = this.isLive;
    this.isLive = isLive;
    
    if (wasLive !== isLive) {
      if (isLive) {
        this.handleGoingLive({ title: 'Manual Override', game_name: 'N/A', viewer_count: 0 });
      } else {
        this.handleGoingOffline();
      }
    }
  }
}

module.exports = StreamStatusMonitor;
