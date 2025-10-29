/**
 * Long-Term Memory Summarization System
 * Compresses old memories into key insights to maintain performance
 */

class MemorySummarization {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.compressionThreshold = 1000; // Messages before compression
    this.summaries = new Map(); // username -> compressed summary
    this.lastCompression = Date.now();
  }

  /**
   * Check if user needs memory compression
   */
  shouldCompress(username) {
    const profile = this.chatBot.userProfiles.get(username);
    if (!profile) return false;
    
    return profile.messageCount > this.compressionThreshold;
  }

  /**
   * Compress a user's memory into key insights
   */
  async compressUserMemory(username) {
    const profile = this.chatBot.userProfiles.get(username);
    if (!profile) return null;

    console.log(`🗜️ [Memory] Compressing memories for ${username}...`);

    // Extract key data
    const topTopics = Array.from(profile.topics?.entries() || [])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    const topWords = Array.from(profile.commonWords?.entries() || [])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);

    const interests = Array.from(profile.interests || []);
    
    const topConnections = (profile.relationships || [])
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5)
      .map(r => r.user);

    // Create compressed summary
    const summary = {
      username,
      friendship: profile.friendship,
      totalMessages: profile.messageCount,
      compressedAt: new Date().toISOString(),
      personality: {
        humor: profile.humorStyle || 'unknown',
        formality: profile.formalityLevel || 'casual',
        topicPreferences: topTopics,
        vocabulary: topWords,
        interests: interests.slice(0, 10)
      },
      behavior: {
        isRival: profile.isRival,
        trustworthy: profile.trustLevel || 50,
        drama: profile.dramaLevel || 0,
        supportive: profile.supportLevel || 0
      },
      social: {
        topConnections,
        mentions: profile.totalMentions || 0,
        activeHours: this.getTopActiveHours(profile)
      },
      keyInsights: this.generateInsights(profile, topTopics, topConnections),
      lastInteraction: profile.lastSeen
    };

    this.summaries.set(username, summary);
    console.log(`✅ [Memory] Compressed ${profile.messageCount} messages into key insights for ${username}`);
    
    return summary;
  }

  /**
   * Get top 3 active hours for user
   */
  getTopActiveHours(profile) {
    if (!profile.activeHours) return [];
    
    return Array.from(profile.activeHours.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  /**
   * Generate human-readable insights
   */
  generateInsights(profile, topTopics, topConnections) {
    const insights = [];

    // Friendship insight
    if (profile.friendship >= 80) {
      insights.push("One of my best friends, always great vibes");
    } else if (profile.friendship >= 50) {
      insights.push("Good friend, enjoy chatting with them");
    } else if (profile.friendship >= 20) {
      insights.push("Friendly acquaintance, building connection");
    } else if (profile.friendship < 0) {
      insights.push("Rival - there's tension here");
    } else {
      insights.push("Still getting to know them");
    }

    // Topic insight
    if (topTopics.length > 0) {
      const mainTopic = topTopics[0].topic;
      insights.push(`Often talks about ${mainTopic}`);
    }

    // Social insight
    if (topConnections.length > 0) {
      insights.push(`Friends with ${topConnections.slice(0, 2).join(', ')}`);
    }

    // Behavior insights
    if (profile.isRival) {
      insights.push("Has beef with me");
    }
    if (profile.dramaLevel > 50) {
      insights.push("Drama starter, watch out");
    }
    if (profile.supportLevel > 70) {
      insights.push("Very supportive person");
    }

    return insights;
  }

  /**
   * Get summary for user (compressed or live data)
   */
  getSummary(username) {
    return this.summaries.get(username) || this.chatBot.userProfiles.get(username);
  }

  /**
   * Compress all eligible users
   */
  async compressAll() {
    console.log(`🗜️ [Memory] Starting batch compression...`);
    let compressed = 0;

    for (const [username, profile] of this.chatBot.userProfiles.entries()) {
      if (this.shouldCompress(username)) {
        await this.compressUserMemory(username);
        compressed++;
      }
    }

    console.log(`✅ [Memory] Compressed ${compressed} user memories`);
    this.lastCompression = Date.now();
  }

  /**
   * Auto-compress on interval
   */
  startAutoCompression() {
    // Compress every hour
    setInterval(() => {
      this.compressAll();
    }, 60 * 60 * 1000);

    console.log(`🗜️ [Memory] Auto-compression started (hourly)`);
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      summariesStored: this.summaries.size,
      lastCompression: new Date(this.lastCompression).toLocaleString(),
      compressionThreshold: this.compressionThreshold
    };
  }

  /**
   * Save summaries to disk
   */
  save() {
    return {
      summaries: Object.fromEntries(this.summaries),
      lastCompression: this.lastCompression
    };
  }

  /**
   * Load summaries from disk
   */
  load(data) {
    if (data.summaries) {
      this.summaries = new Map(Object.entries(data.summaries));
      console.log(`🗜️ [Memory] Restored ${this.summaries.size} compressed summaries`);
    }
    if (data.lastCompression) {
      this.lastCompression = data.lastCompression;
    }
  }
}

module.exports = MemorySummarization;
