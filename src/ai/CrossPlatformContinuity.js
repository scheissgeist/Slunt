/**
 * Cross-Platform Continuity System
 * Enables Slunt to reference conversations across Discord/Twitch/Coolhole
 */

class CrossPlatformContinuity {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.crossPlatformTopics = new Map(); // topic -> platforms where discussed
    this.userPlatforms = new Map(); // username -> platforms they use
  }

  /**
   * Track topic across platforms
   */
  trackTopic(username, platform, topics) {
    // Track user's platforms
    if (!this.userPlatforms.has(username)) {
      this.userPlatforms.set(username, new Set());
    }
    this.userPlatforms.get(username).add(platform);

    // Track topics per platform
    for (const topic of topics) {
      if (!this.crossPlatformTopics.has(topic)) {
        this.crossPlatformTopics.set(topic, {
          platforms: new Set(),
          lastMentioned: {}
        });
      }
      
      const topicData = this.crossPlatformTopics.get(topic);
      topicData.platforms.add(platform);
      topicData.lastMentioned[platform] = Date.now();
    }
  }

  /**
   * Check if topic was discussed on different platform
   */
  findCrossPlatformReference(username, currentPlatform, topics) {
    const userPlatforms = this.userPlatforms.get(username);
    if (!userPlatforms || userPlatforms.size < 2) {
      return null; // User only uses one platform
    }

    // Look for topics discussed elsewhere
    for (const topic of topics) {
      const topicData = this.crossPlatformTopics.get(topic);
      if (!topicData) continue;

      // Check if discussed on other platforms
      const otherPlatforms = Array.from(topicData.platforms)
        .filter(p => p !== currentPlatform);
      
      if (otherPlatforms.length > 0) {
        const otherPlatform = otherPlatforms[0];
        const timeSince = Date.now() - topicData.lastMentioned[otherPlatform];
        
        // Only reference if recent (within a week)
        if (timeSince < 7 * 24 * 60 * 60 * 1000) {
          return {
            topic,
            otherPlatform,
            timeSince
          };
        }
      }
    }

    return null;
  }

  /**
   * Get continuity context for response
   */
  getContinuityContext(username, currentPlatform, topics) {
    const reference = this.findCrossPlatformReference(username, currentPlatform, topics);
    
    if (!reference) return '';

    const timeAgo = this.formatTimeAgo(reference.timeSince);
    const platformName = this.getPlatformName(reference.otherPlatform);

    return `\n[CROSS-PLATFORM CONTINUITY] You discussed "${reference.topic}" with ${username} on ${platformName} ${timeAgo}. You can reference this: "wait didn't we talk about this on ${platformName}?" or "this is like what you mentioned on ${platformName}"`;
  }

  /**
   * Format time ago
   */
  formatTimeAgo(ms) {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'earlier';
  }

  /**
   * Get platform display name
   */
  getPlatformName(platform) {
    const names = {
      'discord': 'Discord',
      'twitch': 'Twitch',
      'coolhole': 'Coolhole'
    };
    return names[platform] || platform;
  }

  /**
   * Track user presence across platforms
   */
  getUserPlatforms(username) {
    return Array.from(this.userPlatforms.get(username) || []);
  }

  /**
   * Get stats
   */
  getStats() {
    const multiPlatformUsers = Array.from(this.userPlatforms.entries())
      .filter(([_, platforms]) => platforms.size > 1);
    
    return {
      totalTopics: this.crossPlatformTopics.size,
      multiPlatformUsers: multiPlatformUsers.length,
      totalUsers: this.userPlatforms.size
    };
  }
}

module.exports = CrossPlatformContinuity;
