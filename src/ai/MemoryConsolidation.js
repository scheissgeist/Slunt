/**
 * Memory Consolidation System
 * Manages long-term memory, summarization, and intelligent forgetting
 */

class MemoryConsolidation {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.consolidationInterval = null;
    this.archivePath = './data/memory_archive.json';
    this.episodesPath = './data/memory_episodes.json';
    this.clustersPath = './data/memory_clusters.json';
    this.shortTermMemory = new Map(); // Recent detailed memories
    this.longTermMemory = new Map(); // Consolidated summaries
    this.episodicMemory = new Map(); // Story chains and events
    this.memoryClusters = new Map(); // Grouped similar memories

    // === NEW: Activity-based consolidation tracking ===
    this.messageCount = 0; // Messages since last consolidation
    this.lastConsolidation = Date.now();
    this.quietPeriodStart = null; // When did chat go quiet?
    this.highActivityThreshold = 50; // Messages to trigger consolidation
    this.quietPeriodThreshold = 10 * 60 * 1000; // 10 minutes of quiet
  }

  /**
   * Start memory consolidation loop (ENHANCED - activity-based)
   */
  start() {
    console.log('🧠 [Memory] Starting SMART consolidation system (activity-based)...');
    
    // Check consolidation triggers every 5 minutes (not consolidate every 30)
    this.consolidationInterval = setInterval(() => {
      this.checkConsolidationTriggers();
    }, 5 * 60 * 1000);

    // Also run on startup
    setTimeout(() => this.checkConsolidationTriggers(), 10000);
  }

  stop() {
    if (this.consolidationInterval) {
      clearInterval(this.consolidationInterval);
      this.consolidationInterval = null;
    }
  }

  /**
   * NEW: Track message activity for smart consolidation
   */
  trackActivity() {
    this.messageCount++;
    this.quietPeriodStart = null; // Reset quiet period
  }

  /**
   * NEW: Check if we should consolidate based on activity patterns
   */
  async checkConsolidationTriggers() {
    const now = Date.now();
    const timeSinceLastConsolidation = now - this.lastConsolidation;

    // Trigger 1: High activity period (50+ messages since last consolidation)
    if (this.messageCount >= this.highActivityThreshold) {
      console.log(`🧠 [Memory] HIGH ACTIVITY trigger (${this.messageCount} messages) - consolidating...`);
      await this.consolidateMemories();
      return;
    }

    // Trigger 2: Quiet period detected
    const lastMessageTime = this.chatBot.lastMessageTime || now;
    const quietDuration = now - lastMessageTime;
    
    if (quietDuration > this.quietPeriodThreshold && this.messageCount > 5) {
      // Chat has been quiet for 10+ minutes AND there are messages to consolidate
      if (!this.quietPeriodStart) {
        this.quietPeriodStart = now;
      }
      
      // Consolidate after quiet period has lasted a bit
      if (now - this.quietPeriodStart > this.quietPeriodThreshold) {
        console.log(`🧠 [Memory] QUIET PERIOD trigger (${Math.round(quietDuration/1000/60)}min quiet) - consolidating...`);
        await this.consolidateMemories();
        return;
      }
    }

    // Trigger 3: Fallback - at least once every 60 minutes regardless
    if (timeSinceLastConsolidation > 60 * 60 * 1000) {
      console.log('🧠 [Memory] TIME-BASED trigger (60min elapsed) - consolidating...');
      await this.consolidateMemories();
      return;
    }
  }

  /**
   * Consolidate old memories into summaries
   */
  async consolidateMemories() {
    console.log(`🧠 [Memory] Consolidating memories (${this.messageCount} messages processed)...`);
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
    
    // Cluster similar memories
    await this.clusterSimilarMemories();
    
    // Create episodic chains
    await this.createEpisodicChains();

    if (consolidated > 0) {
      console.log(`🧠 [Memory] Consolidated ${consolidated} user profiles`);
      await this.saveLongTermMemory();
      await this.saveEpisodicMemory();
      await this.saveMemoryClusters();
    }

    // === NEW: Reset counters after consolidation ===
    this.messageCount = 0;
    this.lastConsolidation = now;
    this.quietPeriodStart = null;
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
  
  /**
   * Cluster similar memories together
   */
  async clusterSimilarMemories() {
    try {
      console.log('🧠 [Memory] Clustering similar memories...');
      
      const allMemories = [];
      
      // Collect all memories from profiles
      for (const [username, profile] of this.chatBot.userProfiles.entries()) {
        if (!profile) continue;
        
        // Topics
        (profile.favoriteTopics || []).forEach(topic => {
          if (typeof topic === 'string') {
            allMemories.push({
              type: 'topic',
              content: topic,
              username,
              timestamp: profile.lastSeen
            });
          }
        });
        
        // Quotes
        (profile.funnyQuotes || []).forEach(quote => {
          if (typeof quote === 'string') {
            allMemories.push({
              type: 'quote',
              content: quote,
              username,
              timestamp: profile.lastSeen
            });
          }
        });
        
        // Opinions
        (profile.opinions || []).forEach(opinion => {
          if (typeof opinion === 'string') {
            allMemories.push({
              type: 'opinion',
              content: opinion,
              username,
              timestamp: profile.lastSeen
            });
          }
        });
      }
      
      // Create clusters based on similarity
      const clusters = this.groupBySimilarity(allMemories);
      
      // Store clusters
      this.memoryClusters.clear();
      clusters.forEach((memories, clusterId) => {
        this.memoryClusters.set(clusterId, {
          id: clusterId,
          count: memories.length,
          summary: this.createClusterSummary(memories),
          representative: memories[0], // Most representative memory
          members: memories,
          created: Date.now()
        });
      });
      
      console.log(`🧠 [Memory] Created ${this.memoryClusters.size} clusters`);
    } catch (error) {
      console.error('❌ [Memory] Error during clustering:', error.message);
      // Don't crash - just skip clustering this round
    }
  }
  
  /**
   * Group memories by similarity
   */
  groupBySimilarity(memories) {
    const clusters = new Map();
    let clusterId = 0;
    
    // Simple keyword-based clustering
    const keywordClusters = new Map();
    
    memories.forEach(memory => {
      // Skip invalid memories
      if (!memory || !memory.content || typeof memory.content !== 'string') {
        console.warn('⚠️ [Memory] Skipping invalid memory during clustering');
        return;
      }
      
      const keywords = this.extractKeywords(memory.content);
      
      // Find existing cluster with matching keywords
      let foundCluster = null;
      for (const [clusterId, clusterMemories] of keywordClusters.entries()) {
        const firstMemory = clusterMemories[0];
        if (!firstMemory || !firstMemory.content) continue;
        
        const clusterKeywords = this.extractKeywords(
          firstMemory.content
        );
        
        // Check overlap
        const overlap = keywords.filter(k => clusterKeywords.includes(k));
        if (overlap.length >= 2) {
          foundCluster = clusterId;
          break;
        }
      }
      
      if (foundCluster) {
        keywordClusters.get(foundCluster).push(memory);
      } else {
        keywordClusters.set(`cluster_${clusterId++}`, [memory]);
      }
    });
    
    return keywordClusters;
  }
  
  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    // Robust type checking
    if (!text || typeof text !== 'string') return [];
    
    try {
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3);
      
      // Remove common words
      const stopWords = new Set([
        'that', 'this', 'with', 'from', 'have', 'what', 
        'when', 'where', 'about', 'they', 'said', 'them'
      ]);
      
      return words.filter(w => !stopWords.has(w));
    } catch (error) {
      console.error('❌ [Memory] extractKeywords error:', error.message);
      return [];
    }
  }
  
  /**
   * Create summary for a cluster
   */
  createClusterSummary(memories) {
    // Count most common keywords
    const keywordCounts = new Map();
    
    memories.forEach(memory => {
      const keywords = this.extractKeywords(memory.content);
      keywords.forEach(kw => {
        keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
      });
    });
    
    // Get top 3 keywords
    const topKeywords = Array.from(keywordCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([kw]) => kw);
    
    // Count involved users
    const users = new Set(memories.map(m => m.username));
    
    return {
      theme: topKeywords.join(', '),
      count: memories.length,
      users: Array.from(users).slice(0, 5),
      timeRange: {
        earliest: Math.min(...memories.map(m => m.timestamp || 0)),
        latest: Math.max(...memories.map(m => m.timestamp || 0))
      }
    };
  }
  
  /**
   * Create episodic memory chains (story-like sequences)
   */
  async createEpisodicChains() {
    console.log('🧠 [Memory] Creating episodic chains...');
    
    // Group memories by time proximity and user involvement
    const episodes = [];
    const timeWindow = 1000 * 60 * 60; // 1 hour
    
    // Get all emotional moments and funny quotes
    const events = [];
    
    for (const [username, profile] of this.chatBot.userProfiles.entries()) {
      (profile.emotionalMoments || []).forEach(moment => {
        events.push({
          type: 'emotional',
          username,
          content: moment.emotion,
          intensity: moment.intensity,
          timestamp: moment.timestamp || profile.lastSeen,
          context: moment.context
        });
      });
      
      (profile.funnyQuotes || []).forEach(quote => {
        events.push({
          type: 'funny',
          username,
          content: quote,
          timestamp: profile.lastSeen
        });
      });
    }
    
    // Sort by time
    events.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    // Chain events that happened close together
    let currentEpisode = null;
    
    events.forEach(event => {
      if (!currentEpisode) {
        currentEpisode = {
          id: `episode_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          events: [event],
          startTime: event.timestamp,
          endTime: event.timestamp,
          participants: new Set([event.username])
        };
      } else {
        const timeSinceLastEvent = event.timestamp - currentEpisode.endTime;
        
        if (timeSinceLastEvent < timeWindow) {
          // Part of same episode
          currentEpisode.events.push(event);
          currentEpisode.endTime = event.timestamp;
          currentEpisode.participants.add(event.username);
        } else {
          // New episode
          if (currentEpisode.events.length > 1) {
            episodes.push(this.finalizeEpisode(currentEpisode));
          }
          
          currentEpisode = {
            id: `episode_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            events: [event],
            startTime: event.timestamp,
            endTime: event.timestamp,
            participants: new Set([event.username])
          };
        }
      }
    });
    
    // Add final episode
    if (currentEpisode && currentEpisode.events.length > 1) {
      episodes.push(this.finalizeEpisode(currentEpisode));
    }
    
    // Store episodes
    this.episodicMemory.clear();
    episodes.forEach(episode => {
      this.episodicMemory.set(episode.id, episode);
    });
    
    console.log(`🧠 [Memory] Created ${this.episodicMemory.size} episodes`);
  }
  
  /**
   * Finalize an episode with summary
   */
  finalizeEpisode(episode) {
    const participants = Array.from(episode.participants);
    const duration = episode.endTime - episode.startTime;
    
    // Determine episode type
    const emotionalEvents = episode.events.filter(e => e.type === 'emotional');
    const funnyEvents = episode.events.filter(e => e.type === 'funny');
    
    let episodeType = 'mixed';
    if (funnyEvents.length > emotionalEvents.length * 2) {
      episodeType = 'comedy';
    } else if (emotionalEvents.length > funnyEvents.length * 2) {
      episodeType = 'emotional';
    }
    
    // Create narrative
    const narrative = this.createEpisodeNarrative(episode);
    
    return {
      ...episode,
      participants,
      duration,
      episodeType,
      narrative,
      importance: this.calculateEpisodeImportance(episode)
    };
  }
  
  /**
   * Create narrative summary for episode
   */
  createEpisodeNarrative(episode) {
    const participants = Array.from(episode.participants).slice(0, 3).join(', ');
    const eventCount = episode.events.length;
    const duration = episode.endTime - episode.startTime;
    const durationMins = Math.round(duration / (1000 * 60));
    
    let narrative = `${participants} `;
    
    if (episode.events[0].type === 'funny') {
      narrative += 'had a funny moment';
    } else if (episode.events[0].type === 'emotional') {
      narrative += 'had an emotional exchange';
    }
    
    if (eventCount > 3) {
      narrative += ` that escalated over ${durationMins} minutes`;
    }
    
    narrative += `. ${eventCount} memorable moments.`;
    
    return narrative;
  }
  
  /**
   * Calculate importance of episode
   */
  calculateEpisodeImportance(episode) {
    let importance = 0;
    
    // More events = more important
    importance += episode.events.length * 5;
    
    // More participants = more important
    importance += episode.participants.size * 10;
    
    // High intensity emotions = more important
    const highIntensity = episode.events.filter(e => 
      e.intensity === 'high'
    ).length;
    importance += highIntensity * 15;
    
    // Longer duration = more important
    const durationHours = (episode.endTime - episode.startTime) / (1000 * 60 * 60);
    importance += Math.min(durationHours * 5, 25);
    
    return Math.min(importance, 100);
  }
  
  /**
   * Save episodic memory
   */
  async saveEpisodicMemory() {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const dir = path.dirname(this.episodesPath);
      await fs.mkdir(dir, { recursive: true });
      
      const data = {
        episodes: Array.from(this.episodicMemory.values()),
        savedAt: Date.now()
      };
      
      await fs.writeFile(this.episodesPath, JSON.stringify(data, null, 2));
      console.log(`🧠 [Memory] Saved ${data.episodes.length} episodes`);
    } catch (error) {
      console.error('🧠 [Memory] Error saving episodic memory:', error.message);
    }
  }
  
  /**
   * Load episodic memory
   */
  async loadEpisodicMemory() {
    const fs = require('fs').promises;
    
    try {
      const data = await fs.readFile(this.episodesPath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.episodicMemory.clear();
      parsed.episodes.forEach(episode => {
        this.episodicMemory.set(episode.id, episode);
      });
      
      console.log(`🧠 [Memory] Loaded ${this.episodicMemory.size} episodes`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('🧠 [Memory] Error loading episodic memory:', error.message);
      }
    }
  }
  
  /**
   * Save memory clusters
   */
  async saveMemoryClusters() {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const dir = path.dirname(this.clustersPath);
      await fs.mkdir(dir, { recursive: true });
      
      const data = {
        clusters: Array.from(this.memoryClusters.values()),
        savedAt: Date.now()
      };
      
      await fs.writeFile(this.clustersPath, JSON.stringify(data, null, 2));
      console.log(`🧠 [Memory] Saved ${data.clusters.length} clusters`);
    } catch (error) {
      console.error('🧠 [Memory] Error saving clusters:', error.message);
    }
  }
  
  /**
   * Load memory clusters
   */
  async loadMemoryClusters() {
    const fs = require('fs').promises;
    
    try {
      const data = await fs.readFile(this.clustersPath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.memoryClusters.clear();
      parsed.clusters.forEach(cluster => {
        this.memoryClusters.set(cluster.id, cluster);
      });
      
      console.log(`🧠 [Memory] Loaded ${this.memoryClusters.size} clusters`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('🧠 [Memory] Error loading clusters:', error.message);
      }
    }
  }
  
  /**
   * Get relevant episode for current context
   */
  getRelevantEpisode(username, topic) {
    const relevantEpisodes = [];
    
    for (const episode of this.episodicMemory.values()) {
      let relevance = 0;
      
      // User involved?
      if (episode.participants.includes(username)) {
        relevance += 50;
      }
      
      // Topic matches?
      if (topic) {
        const episodeText = episode.narrative.toLowerCase();
        const topicWords = topic.toLowerCase().split(/\s+/);
        const matches = topicWords.filter(w => episodeText.includes(w)).length;
        relevance += matches * 10;
      }
      
      // Importance
      relevance += episode.importance;
      
      if (relevance > 30) {
        relevantEpisodes.push({ episode, relevance });
      }
    }
    
    // Sort by relevance
    relevantEpisodes.sort((a, b) => b.relevance - a.relevance);
    
    return relevantEpisodes[0]?.episode || null;
  }
  
  /**
   * Merge redundant memories
   */
  mergeRedundantMemories() {
    console.log('🧠 [Memory] Merging redundant memories...');
    let merged = 0;
    
    for (const [username, profile] of this.chatBot.userProfiles.entries()) {
      // Merge duplicate topics
      if (profile.favoriteTopics && profile.favoriteTopics.length > 0) {
        const uniqueTopics = [...new Set(
          profile.favoriteTopics.map(t => t.toLowerCase())
        )];
        
        if (uniqueTopics.length < profile.favoriteTopics.length) {
          profile.favoriteTopics = uniqueTopics.slice(0, 10);
          merged++;
        }
      }
      
      // Merge similar quotes
      if (profile.funnyQuotes && profile.funnyQuotes.length > 10) {
        // Keep only most recent 10
        profile.funnyQuotes = profile.funnyQuotes.slice(-10);
        merged++;
      }
      
      // Merge old emotional moments
      if (profile.emotionalMoments && profile.emotionalMoments.length > 15) {
        // Keep only most recent 15
        profile.emotionalMoments = profile.emotionalMoments.slice(-15);
        merged++;
      }
    }
    
    if (merged > 0) {
      console.log(`🧠 [Memory] Merged ${merged} redundant memories`);
    }
  }
}

module.exports = MemoryConsolidation;
