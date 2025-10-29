/**
 * Memory Consolidation System
 * Manages long-term memory, summarization, and intelligent forgetting
 */

class MemoryConsolidation {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.consolidationInterval = null;
    this.archivePath = './data/memory_archive.json';
    this.shortTermMemory = new Map(); // Recent detailed memories
    this.longTermMemory = new Map(); // Consolidated summaries
  }

  /**
   * Start memory consolidation loop
   */
  start() {
    console.log('🧠 [Memory] Starting memory consolidation system...');
    
    // Consolidate memories every 30 minutes
    this.consolidationInterval = setInterval(() => {
      this.consolidateMemories();
    }, 30 * 60 * 1000);

    // Also run on startup
    setTimeout(() => this.consolidateMemories(), 10000);
  }

  stop() {
    if (this.consolidationInterval) {
      clearInterval(this.consolidationInterval);
      this.consolidationInterval = null;
    }
  }

  /**
   * Consolidate old memories into summaries
   */
  async consolidateMemories() {
    console.log('🧠 [Memory] Consolidating memories...');
    const now = Date.now();
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    let consolidated = 0;

    for (const [username, profile] of this.chatBot.userProfiles.entries()) {
      // Check if user needs consolidation
      const timeSinceLastSeen = now - profile.lastSeen;
      
      if (timeSinceLastSeen > weekInMs) {
        // Consolidate this user's memories
        const summary = this.createUserSummary(username, profile);
        
        if (summary) {
          this.longTermMemory.set(username, summary);
          consolidated++;
          console.log(`🧠 [Memory] Consolidated memories for ${username}`);
        }
      }
    }

    if (consolidated > 0) {
      console.log(`🧠 [Memory] Consolidated ${consolidated} user profiles`);
      await this.saveLongTermMemory();
    }
  }

  /**
   * Create a summary of a user's profile
   */
  createUserSummary(username, profile) {
    const topics = profile.favoriteTopics || [];
    const friends = profile.friendsWith || [];
    const funnyQuotes = profile.funnyQuotes || [];
    const opinions = profile.opinions || [];
    const emojis = profile.favoriteEmojis || [];

    return {
      username,
      friendshipLevel: profile.friendshipLevel || 0,
      totalMessages: profile.messageCount || 0,
      lastSeen: profile.lastSeen,
      consolidatedAt: Date.now(),
      
      // Core personality
      personality: {
        topTopics: topics.slice(0, 5),
        closeFriends: Array.from(friends).slice(0, 5),
        favoriteEmojis: Array.from(emojis).slice(0, 5),
        humorStyle: this.detectHumorStyle(funnyQuotes)
      },
      
      // Key memories
      keyMoments: [
        ...(funnyQuotes.slice(-3) || []),
        ...(opinions.slice(-3) || [])
      ],
      
      // Emotional profile
      emotionalProfile: {
        mostCommonMood: this.getMostCommonMood(profile),
        emotionalIntensity: this.getEmotionalIntensity(profile)
      },
      
      // Activity pattern
      activityPattern: {
        activeHours: this.getActiveHoursSummary(profile.activeHours || []),
        avgMessagesPerDay: this.calculateAvgMessagesPerDay(profile)
      },
      
      // Relationship summary
      relationships: {
        mentionedUsers: this.getTopMentions(profile.whoTheyMention),
        mentionedBy: this.getTopMentions(profile.mentionedBy)
      }
    };
  }

  /**
   * Detect humor style from quotes
   */
  detectHumorStyle(quotes) {
    if (!quotes || quotes.length === 0) return 'unknown';
    
    const allText = quotes.join(' ').toLowerCase();
    
    if (allText.includes('lmao') || allText.includes('lol') || allText.includes('haha')) {
      return 'lighthearted';
    } else if (allText.includes('wtf') || allText.includes('bruh')) {
      return 'sarcastic';
    } else if (allText.includes('💀') || allText.includes('dead')) {
      return 'dark';
    }
    
    return 'casual';
  }

  /**
   * Get most common mood
   */
  getMostCommonMood(profile) {
    const moments = profile.emotionalMoments || [];
    if (moments.length === 0) return 'neutral';

    const moodCounts = {};
    moments.forEach(moment => {
      moodCounts[moment.emotion] = (moodCounts[moment.emotion] || 0) + 1;
    });

    return Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
  }

  /**
   * Get emotional intensity
   */
  getEmotionalIntensity(profile) {
    const moments = profile.emotionalMoments || [];
    if (moments.length === 0) return 'low';

    const highIntensity = moments.filter(m => m.intensity === 'high').length;
    const ratio = highIntensity / moments.length;

    return ratio > 0.5 ? 'high' : ratio > 0.25 ? 'medium' : 'low';
  }

  /**
   * Get active hours summary
   */
  getActiveHoursSummary(activeHours) {
    if (activeHours.length === 0) return 'unknown';

    const hourCounts = {};
    activeHours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const topHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    if (topHours.every(h => h >= 6 && h <= 12)) return 'morning_person';
    if (topHours.every(h => h >= 12 && h <= 18)) return 'afternoon_person';
    if (topHours.every(h => h >= 18 || h <= 2)) return 'night_owl';
    return 'varies';
  }

  /**
   * Calculate average messages per day
   */
  calculateAvgMessagesPerDay(profile) {
    if (!profile.firstSeen || !profile.messageCount) return 0;

    const daysSinceFirst = (Date.now() - profile.firstSeen) / (1000 * 60 * 60 * 24);
    return Math.round(profile.messageCount / Math.max(daysSinceFirst, 1));
  }

  /**
   * Get top mentions
   */
  getTopMentions(mentionMap) {
    if (!mentionMap || mentionMap.size === 0) return [];

    return Array.from(mentionMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([user]) => user);
  }

  /**
   * Archive inactive users
   */
  async archiveInactiveUsers() {
    const now = Date.now();
    const monthInMs = 30 * 24 * 60 * 60 * 1000;
    const archived = [];

    for (const [username, profile] of this.chatBot.userProfiles.entries()) {
      const timeSinceLastSeen = now - profile.lastSeen;
      
      // Archive users inactive for 30+ days with low friendship
      if (timeSinceLastSeen > monthInMs && (profile.friendshipLevel || 0) < 20) {
        // Create summary before archiving
        const summary = this.createUserSummary(username, profile);
        this.longTermMemory.set(username, summary);
        
        // Remove from active profiles
        this.chatBot.userProfiles.delete(username);
        archived.push(username);
        
        console.log(`🧠 [Memory] Archived inactive user: ${username}`);
      }
    }

    if (archived.length > 0) {
      await this.saveLongTermMemory();
      console.log(`🧠 [Memory] Archived ${archived.length} inactive users`);
    }

    return archived;
  }

  /**
   * Restore user from archive
   */
  restoreUser(username) {
    const summary = this.longTermMemory.get(username);
    if (!summary) return null;

    // Recreate profile from summary
    const profile = {
      username,
      friendshipLevel: summary.friendshipLevel,
      messageCount: summary.totalMessages,
      lastSeen: Date.now(), // They're back!
      firstSeen: summary.lastSeen,
      
      favoriteTopics: summary.personality.topTopics,
      friendsWith: new Set(summary.personality.closeFriends),
      favoriteEmojis: new Set(summary.personality.favoriteEmojis),
      funnyQuotes: summary.keyMoments.slice(0, 3),
      opinions: [],
      
      emotionalMoments: [],
      personalNotes: [`Welcome back! Last saw them ${new Date(summary.lastSeen).toLocaleDateString()}`],
      
      activeHours: [],
      whoTheyMention: new Map(),
      mentionedBy: new Map(),
      questionsAsked: []
    };

    this.chatBot.userProfiles.set(username, profile);
    console.log(`🧠 [Memory] Restored ${username} from archive`);
    
    return profile;
  }

  /**
   * Search memories
   */
  searchMemories(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    // Search active profiles
    for (const [username, profile] of this.chatBot.userProfiles.entries()) {
      if (username.toLowerCase().includes(lowerQuery)) {
        results.push({ username, type: 'user', profile });
      }

      // Search in topics
      (profile.favoriteTopics || []).forEach(topic => {
        if (topic.toLowerCase().includes(lowerQuery)) {
          results.push({ username, type: 'topic', topic, profile });
        }
      });

      // Search in quotes
      (profile.funnyQuotes || []).forEach(quote => {
        if (quote.toLowerCase().includes(lowerQuery)) {
          results.push({ username, type: 'quote', quote, profile });
        }
      });
    }

    // Search long-term memory
    for (const [username, summary] of this.longTermMemory.entries()) {
      if (username.toLowerCase().includes(lowerQuery)) {
        results.push({ username, type: 'archived_user', summary });
      }
    }

    return results;
  }

  /**
   * Save long-term memory to disk
   */
  async saveLongTermMemory() {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const dir = path.dirname(this.archivePath);
      await fs.mkdir(dir, { recursive: true });

      const data = {
        memories: Array.from(this.longTermMemory.entries()).map(([username, summary]) => ({
          username,
          ...summary
        })),
        savedAt: Date.now()
      };

      await fs.writeFile(this.archivePath, JSON.stringify(data, null, 2));
      console.log(`🧠 [Memory] Saved ${data.memories.length} long-term memories`);
    } catch (error) {
      console.error('🧠 [Memory] Error saving long-term memory:', error.message);
    }
  }

  /**
   * Load long-term memory from disk
   */
  async loadLongTermMemory() {
    const fs = require('fs').promises;

    try {
      const data = await fs.readFile(this.archivePath, 'utf8');
      const parsed = JSON.parse(data);

      this.longTermMemory.clear();
      parsed.memories.forEach(memory => {
        this.longTermMemory.set(memory.username, memory);
      });

      console.log(`🧠 [Memory] Loaded ${this.longTermMemory.size} long-term memories`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('🧠 [Memory] Error loading long-term memory:', error.message);
      }
    }
  }

  /**
   * Get memory stats
   */
  getStats() {
    return {
      activeProfiles: this.chatBot.userProfiles.size,
      archivedProfiles: this.longTermMemory.size,
      totalMemories: this.chatBot.userProfiles.size + this.longTermMemory.size,
      oldestMemory: this.getOldestMemory(),
      newestMemory: this.getNewestMemory()
    };
  }

  getOldestMemory() {
    let oldest = Date.now();
    for (const profile of this.chatBot.userProfiles.values()) {
      if (profile.firstSeen && profile.firstSeen < oldest) {
        oldest = profile.firstSeen;
      }
    }
    return oldest;
  }

  getNewestMemory() {
    let newest = 0;
    for (const profile of this.chatBot.userProfiles.values()) {
      if (profile.lastSeen && profile.lastSeen > newest) {
        newest = profile.lastSeen;
      }
    }
    return newest;
  }
}

module.exports = MemoryConsolidation;
