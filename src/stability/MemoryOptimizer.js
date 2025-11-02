/**
 * Memory Optimization System
 * Manages unbounded data structures to prevent memory bloat
 */

class MemoryOptimizer {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Limits for user profile arrays
    this.limits = {
      funnyQuotes: 10,
      questionsAsked: 20,
      helpfulMoments: 15,
      insideJokes: 10,
      notes: 5,
      nicknames: 3,
      favoriteTopics: 15,
      emotionalMoments: 10,
      // Map limits
      commonWords: 100,
      topics: 50,
      opinions: 30,
      whoTheyMention: 50,
      mentionedBy: 50
    };
    
    // Inactivity threshold (30 days)
    this.inactivityThreshold = 30 * 24 * 60 * 60 * 1000;
    
    // Run optimization every 10 minutes
    this.optimizationInterval = null;
    
    // Stats
    this.stats = {
      totalOptimizations: 0,
      itemsRemoved: 0,
      usersArchived: 0,
      lastRun: null
    };
  }

  /**
   * Start periodic optimization
   */
  start() {
    console.log('🧹 [Optimizer] Starting memory optimization system...');
    
    // Run immediately
    setTimeout(() => this.optimize(), 5000);
    
    // Run every 10 minutes
    this.optimizationInterval = setInterval(() => {
      this.optimize();
    }, 10 * 60 * 1000);
  }

  /**
   * Stop optimization
   */
  stop() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
  }

  /**
   * Run full optimization pass
   */
  optimize() {
    console.log('🧹 [Optimizer] Running optimization pass...');
    const startTime = Date.now();
    
    let totalRemoved = 0;
    
    // 1. Optimize user profiles
    totalRemoved += this.optimizeUserProfiles();
    
    // 2. Archive inactive users
    const archived = this.archiveInactiveUsers();
    
    // 3. Trim conversation context (already limited to 50)
    // 4. Trim chat history (already limited to 200)
    
    const duration = Date.now() - startTime;
    this.stats.totalOptimizations++;
    this.stats.itemsRemoved += totalRemoved;
    this.stats.usersArchived += archived;
    this.stats.lastRun = Date.now();
    
    console.log(`🧹 [Optimizer] Optimization complete in ${duration}ms`);
    console.log(`🧹 [Optimizer] Removed ${totalRemoved} items, archived ${archived} users`);
  }

  /**
   * Optimize all user profiles
   */
  optimizeUserProfiles() {
    let totalRemoved = 0;
    
    for (const [username, profile] of this.chatBot.userProfiles.entries()) {
      totalRemoved += this.optimizeProfile(profile);
    }
    
    return totalRemoved;
  }

  /**
   * Optimize a single user profile
   */
  optimizeProfile(profile) {
    let removed = 0;
    
    // Optimize arrays - keep only most recent
    const arrayFields = [
      'funnyQuotes', 'questionsAsked', 'helpfulMoments', 
      'insideJokes', 'notes', 'nicknames', 'favoriteTopics', 'emotionalMoments'
    ];
    
    for (const field of arrayFields) {
      if (Array.isArray(profile[field])) {
        const limit = this.limits[field];
        if (profile[field].length > limit) {
          const excess = profile[field].length - limit;
          
          // Keep most recent items (assuming they have timestamps or are ordered)
          if (profile[field][0]?.timestamp) {
            // Sort by timestamp, keep newest
            profile[field].sort((a, b) => b.timestamp - a.timestamp);
          }
          
          profile[field] = profile[field].slice(0, limit);
          removed += excess;
        }
      }
    }
    
    // Optimize Maps - keep only top N by frequency
    const mapFields = ['commonWords', 'topics', 'opinions', 'whoTheyMention', 'mentionedBy'];
    
    for (const field of mapFields) {
      if (profile[field] instanceof Map) {
        const limit = this.limits[field];
        if (profile[field].size > limit) {
          const excess = profile[field].size - limit;
          
          // Convert to array, sort by value (frequency), keep top N
          const sorted = Array.from(profile[field].entries())
            .sort((a, b) => {
              // Handle different value types
              const aVal = typeof a[1] === 'number' ? a[1] : 1;
              const bVal = typeof b[1] === 'number' ? b[1] : 1;
              return bVal - aVal;
            })
            .slice(0, limit);
          
          profile[field] = new Map(sorted);
          removed += excess;
        }
      }
    }
    
    return removed;
  }

  /**
   * Archive users inactive for 30+ days
   */
  archiveInactiveUsers() {
    const now = Date.now();
    const toArchive = [];
    
    for (const [username, profile] of this.chatBot.userProfiles.entries()) {
      const inactive = now - (profile.lastSeen || profile.firstSeen || now);
      
      if (inactive > this.inactivityThreshold) {
        toArchive.push(username);
      }
    }
    
    // Archive users (remove from active profiles)
    for (const username of toArchive) {
      const profile = this.chatBot.userProfiles.get(username);
      
      // Could save to archive file here if needed
      // For now, just remove
      this.chatBot.userProfiles.delete(username);
      
      console.log(`🧹 [Optimizer] Archived inactive user: ${username} (inactive ${Math.round((now - profile.lastSeen) / (24 * 60 * 60 * 1000))} days)`);
    }
    
    return toArchive.length;
  }

  /**
   * Get optimization stats
   */
  getStats() {
    return {
      ...this.stats,
      currentUserCount: this.chatBot.userProfiles.size,
      conversationContextSize: this.chatBot.conversationContext?.length || 0,
      chatHistorySize: this.chatBot.chatHistory?.length || 0,
      limits: this.limits
    };
  }

  /**
   * Manual trigger (for testing)
   */
  runNow() {
    this.optimize();
  }
}

module.exports = MemoryOptimizer;
