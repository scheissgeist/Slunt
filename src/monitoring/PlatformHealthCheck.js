/**
 * Platform Health Check System
 * Monitors message reception on each platform and alerts if not receiving
 */

const logger = require('../bot/logger');

class PlatformHealthCheck {
  constructor() {
    this.platforms = {
      coolhole: {
        lastMessageReceived: 0,
        messagesReceived: 0,
        expectedActivity: true, // Should be receiving messages
        alertThreshold: 5 * 60 * 1000, // Alert if no messages for 5 minutes
        status: 'unknown'
      },
      discord: {
        lastMessageReceived: 0,
        messagesReceived: 0,
        expectedActivity: true,
        alertThreshold: 10 * 60 * 1000, // 10 minutes for Discord
        status: 'unknown'
      },
      twitch: {
        lastMessageReceived: 0,
        messagesReceived: 0,
        expectedActivity: false, // May not always have activity
        alertThreshold: 30 * 60 * 1000,
        status: 'unknown'
      }
    };
    
    this.checkInterval = 60000; // Check every minute
    this.startMonitoring();
  }

  /**
   * Record a message received on a platform
   */
  recordMessage(platform) {
    if (this.platforms[platform]) {
      this.platforms[platform].lastMessageReceived = Date.now();
      this.platforms[platform].messagesReceived++;
      
      if (this.platforms[platform].status !== 'healthy') {
        logger.info(`✅ [PlatformHealth] ${platform} is now receiving messages`);
      }
      
      this.platforms[platform].status = 'healthy';
    }
  }

  /**
   * Start periodic health monitoring
   */
  startMonitoring() {
    setInterval(() => {
      this.checkAllPlatforms();
    }, this.checkInterval);
    
    logger.info('🏥 [PlatformHealth] Monitoring started');
  }

  /**
   * Check all platforms for activity
   */
  checkAllPlatforms() {
    const now = Date.now();
    
    for (const [platform, data] of Object.entries(this.platforms)) {
      if (!data.expectedActivity) continue;
      
      const timeSinceMessage = now - data.lastMessageReceived;
      
      // If we've never received a message, or it's been too long
      if (data.lastMessageReceived === 0 && data.messagesReceived === 0) {
        // Just started, give it time
        if (now - this.startTime > 2 * 60 * 1000) { // After 2 minutes
          if (data.status !== 'no-messages') {
            logger.warn(`⚠️ [PlatformHealth] ${platform}: No messages received yet`);
            logger.warn(`   💡 Check if Socket.IO is connected properly`);
            data.status = 'no-messages';
          }
        }
      } else if (timeSinceMessage > data.alertThreshold) {
        if (data.status !== 'stale') {
          logger.error(`❌ [PlatformHealth] ${platform}: No messages for ${Math.floor(timeSinceMessage / 60000)} minutes`);
          logger.error(`   Last message: ${new Date(data.lastMessageReceived).toLocaleTimeString()}`);
          logger.error(`   Total received: ${data.messagesReceived}`);
          logger.error(`   💡 Socket.IO connection may be broken - check logs for "EVENT RECEIVED"`);
          data.status = 'stale';
        }
      }
    }
  }

  /**
   * Get diagnostics for a platform
   */
  getPlatformDiagnostics(platform) {
    const data = this.platforms[platform];
    if (!data) return null;
    
    const now = Date.now();
    const minutesSince = data.lastMessageReceived === 0 
      ? -1 
      : Math.floor((now - data.lastMessageReceived) / 60000);
    
    return {
      platform,
      status: data.status,
      messagesReceived: data.messagesReceived,
      lastMessageMinutesAgo: minutesSince,
      isHealthy: data.status === 'healthy'
    };
  }

  /**
   * Get all diagnostics
   */
  getAllDiagnostics() {
    return Object.keys(this.platforms).map(p => this.getPlatformDiagnostics(p));
  }

  /**
   * Get status summary
   */
  getStatusSummary() {
    const diagnostics = this.getAllDiagnostics();
    return diagnostics.map(d => {
      if (d.status === 'healthy') {
        return `✅ ${d.platform}: ${d.messagesReceived} msgs (last ${d.lastMessageMinutesAgo}m ago)`;
      } else if (d.status === 'no-messages') {
        return `⚠️ ${d.platform}: No messages received`;
      } else if (d.status === 'stale') {
        return `❌ ${d.platform}: Stale (${d.lastMessageMinutesAgo}m since last)`;
      } else {
        return `❓ ${d.platform}: Unknown`;
      }
    }).join('\n');
  }
}

// Singleton instance
const platformHealthCheck = new PlatformHealthCheck();
platformHealthCheck.startTime = Date.now();

module.exports = platformHealthCheck;
