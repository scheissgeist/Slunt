/**
 * YouTube Search & Queue System
 * Allows Slunt to search for videos and add them to the Coolhole queue
 */

class YouTubeSearch {
  constructor(coolholeClient) {
    this.coolhole = coolholeClient;
    this.page = null;
    this.lastSearchTime = 0;
    this.minSearchDelay = 3000; // 3 seconds between searches
    
    // Stats
    this.stats = {
      totalSearches: 0,
      videosQueued: 0,
      failedAttempts: 0,
      searchHistory: []
    };
  }

  /**
   * Initialize with page reference
   */
  setPage(page) {
    this.page = page;
  }

  /**
   * Search YouTube and add first result to queue
   */
  async searchAndQueue(query, options = {}) {
    const {
      addToQueue = true,
      maxResults = 1
    } = options;

    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastSearch = now - this.lastSearchTime;
      if (timeSinceLastSearch < this.minSearchDelay) {
        const waitTime = this.minSearchDelay - timeSinceLastSearch;
        console.log(`⏳ [YouTube] Rate limiting: waiting ${waitTime}ms`);
        await this.sleep(waitTime);
      }

      console.log(`🔍 [YouTube] Searching for: "${query}"`);
      this.stats.totalSearches++;
      this.lastSearchTime = Date.now();

      if (!this.page || this.page.isClosed()) {
        console.error('❌ [YouTube] Page not available');
        this.stats.failedAttempts++;
        return null;
      }

      // Find the video search input (Coolhole has a YouTube search feature)
      const searchInput = await this.page.$('#mediaurl');
      if (!searchInput) {
        console.error('❌ [YouTube] Search input not found');
        this.stats.failedAttempts++;
        return null;
      }

      // Clear and type search query
      await searchInput.click();
      await searchInput.fill('');
      await this.page.waitForTimeout(200);
      
      // Type the search query
      await searchInput.type(`ytsearch:${query}`, { delay: 50 });
      await this.page.waitForTimeout(300);

      console.log(`🎬 [YouTube] Query entered: "ytsearch:${query}"`);

      // If we want to add to queue, click the add button
      if (addToQueue) {
        // Find and click the "Add" button
        const addButton = await this.page.$('#queue_next');
        if (!addButton) {
          console.error('❌ [YouTube] Add button not found');
          this.stats.failedAttempts++;
          return null;
        }

        await addButton.click();
        await this.page.waitForTimeout(500);

        console.log(`✅ [YouTube] Video queued from search: "${query}"`);
        this.stats.videosQueued++;

        // Track search history
        this.stats.searchHistory.push({
          query,
          timestamp: Date.now(),
          success: true
        });

        return {
          query,
          queued: true,
          timestamp: Date.now()
        };
      }

      return {
        query,
        queued: false,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`❌ [YouTube] Search failed:`, error.message);
      this.stats.failedAttempts++;
      
      this.stats.searchHistory.push({
        query,
        timestamp: Date.now(),
        success: false,
        error: error.message
      });

      return null;
    }
  }

  /**
   * Add video by direct URL
   */
  async addVideoByUrl(url) {
    try {
      console.log(`🎬 [YouTube] Adding video by URL: ${url}`);

      if (!this.page || this.page.isClosed()) {
        console.error('❌ [YouTube] Page not available');
        return false;
      }

      const searchInput = await this.page.$('#mediaurl');
      if (!searchInput) {
        console.error('❌ [YouTube] URL input not found');
        return false;
      }

      // Enter URL
      await searchInput.click();
      await searchInput.fill('');
      await this.page.waitForTimeout(200);
      await searchInput.type(url, { delay: 30 });
      await this.page.waitForTimeout(300);

      // Click add button
      const addButton = await this.page.$('#queue_next');
      if (!addButton) {
        console.error('❌ [YouTube] Add button not found');
        return false;
      }

      await addButton.click();
      await this.page.waitForTimeout(500);

      console.log(`✅ [YouTube] Video added by URL`);
      this.stats.videosQueued++;

      return true;
    } catch (error) {
      console.error(`❌ [YouTube] Failed to add by URL:`, error.message);
      this.stats.failedAttempts++;
      return false;
    }
  }

  /**
   * Search for video based on context/mood
   */
  async searchContextual(context) {
    const queries = this.generateContextualQueries(context);
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    return await this.searchAndQueue(randomQuery);
  }

  /**
   * Generate search queries based on context
   */
  generateContextualQueries(context) {
    const { mood, topic, style } = context;
    
    const queries = [];

    // Mood-based queries
    if (mood === 'excited' || mood === 'energetic') {
      queries.push('epic fail compilation', 'insane parkour', 'mind blowing tricks');
    } else if (mood === 'sad' || mood === 'depressed') {
      queries.push('sad music', 'emotional video', 'depressing documentary');
    } else if (mood === 'curious') {
      queries.push('how its made', 'interesting facts', 'vsauce');
    } else if (mood === 'bored') {
      queries.push('weird videos', 'strange internet', 'cursed videos');
    }

    // Topic-based queries
    if (topic) {
      queries.push(`${topic} explained`, `${topic} compilation`, `best ${topic} moments`);
    }

    // Style-based queries
    if (style === 'funny') {
      queries.push('funny moments', 'comedy gold', 'hilarious fails');
    } else if (style === 'educational') {
      queries.push('documentary', 'educational video', 'explained');
    } else if (style === 'weird') {
      queries.push('weird internet', 'strange videos', 'wtf moments');
    }

    // Default fallback
    if (queries.length === 0) {
      queries.push('random funny video', 'interesting content', 'cool video');
    }

    return queries;
  }

  /**
   * Get search suggestions based on current conversation
   */
  getSearchSuggestions(recentMessages) {
    const keywords = new Set();
    
    // Extract potential topics from recent messages
    const topicPatterns = [
      /(?:watch|queue|add|play)\s+(\w+)/gi,
      /(?:video about|search for|find)\s+(.+?)(?:\?|$)/gi,
      /(?:want to see|show me|look up)\s+(.+?)(?:\?|$)/gi
    ];

    for (const message of recentMessages) {
      for (const pattern of topicPatterns) {
        const matches = [...message.matchAll(pattern)];
        for (const match of matches) {
          if (match[1]) {
            keywords.add(match[1].trim().toLowerCase());
          }
        }
      }
    }

    return Array.from(keywords);
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      recentSearches: this.stats.searchHistory.slice(-10)
    };
  }
}

module.exports = YouTubeSearch;
