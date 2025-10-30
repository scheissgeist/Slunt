/**
 * Video Discovery System
 * Slunt proactively finds and queues interesting videos based on chat interests and his own taste
 */

class VideoDiscovery {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.discoveryInterval = 10 * 60 * 1000; // Check every 10 minutes
    this.lastDiscovery = 0;
    this.queuedVideos = new Set();
    this.discoveryHistory = [];
    
    // Slunt's video preferences (evolves over time)
    this.preferences = {
      genres: new Map([
        ['music', 0.7],
        ['comedy', 0.8],
        ['gaming', 0.5],
        ['documentary', 0.4],
        ['meme', 0.9],
        ['animation', 0.6],
        ['vlog', 0.3],
        ['tutorial', 0.2]
      ]),
      minViews: 1000,
      maxViews: 5000000, // Prefer niche/cult classics over mega-viral
      preferObscure: true
    };
  }

  /**
   * Discover and queue a video based on current context
   */
  async discoverVideo() {
    const now = Date.now();
    if (now - this.lastDiscovery < this.discoveryInterval) {
      return null;
    }

    this.lastDiscovery = now;

    try {
      // Analyze recent chat to find topics of interest
      const recentTopics = this.chatBot.getTrendingTopics(5);
      const chatInterests = recentTopics.map(t => t.topic);

      // Combine chat interests with Slunt's own preferences
      const searchQuery = this.generateSearchQuery(chatInterests);

      console.log(`🎬 [VideoDiscovery] Searching for: ${searchQuery}`);

      // Use YouTube search to find videos
      if (this.chatBot.youtubeSearch && this.chatBot.youtubeSearch.page) {
        const results = await this.chatBot.youtubeSearch.search(searchQuery, 5);

        if (results && results.length > 0) {
          // Filter and rank results
          const candidate = this.selectBestVideo(results, chatInterests);

          if (candidate && !this.queuedVideos.has(candidate.videoId)) {
            // Queue the video
            await this.queueVideo(candidate, searchQuery);
            return candidate;
          }
        }
      }
    } catch (error) {
      console.error('❌ [VideoDiscovery] Error:', error.message);
    }

    return null;
  }

  /**
   * Generate a search query based on chat interests and Slunt's taste
   */
  generateSearchQuery(chatInterests) {
    // If chat is discussing something specific, search for that
    if (chatInterests.length > 0 && Math.random() < 0.6) {
      const topic = chatInterests[Math.floor(Math.random() * chatInterests.length)];
      return topic;
    }

    // Otherwise, use Slunt's own interests
    const genreWeights = Array.from(this.preferences.genres.entries());
    const totalWeight = genreWeights.reduce((sum, [, weight]) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const [genre, weight] of genreWeights) {
      random -= weight;
      if (random <= 0) {
        // Add some randomness to the query
        const modifiers = ['obscure', 'underrated', 'hidden gem', 'cult classic', 'niche', 'indie'];
        const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        return `${modifier} ${genre}`;
      }
    }

    return 'interesting video';
  }

  /**
   * Select the best video from search results
   */
  selectBestVideo(results, chatInterests) {
    // Score each video
    const scored = results.map(video => {
      let score = 0;

      // Prefer videos within view count range
      const views = video.views || 0;
      if (views >= this.preferences.minViews && views <= this.preferences.maxViews) {
        score += 5;
      } else if (views < this.preferences.minViews) {
        score += 2; // Still interesting if super obscure
      }

      // Prefer videos matching chat interests
      if (chatInterests.length > 0) {
        const titleLower = video.title.toLowerCase();
        const matchesInterest = chatInterests.some(interest =>
          titleLower.includes(interest.toLowerCase())
        );
        if (matchesInterest) score += 10;
      }

      // Prefer shorter videos (3-10 minutes is ideal)
      const duration = video.duration || 0;
      if (duration >= 180 && duration <= 600) {
        score += 3;
      }

      // Random factor for variety
      score += Math.random() * 3;

      return { ...video, score };
    });

    // Sort by score and return top result
    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  }

  /**
   * Queue a video on Coolhole
   */
  async queueVideo(video, searchQuery) {
    try {
      // Add to Coolhole queue via bot's video manager
      if (this.chatBot.videoManager) {
        await this.chatBot.videoManager.addToQueue(video.videoId, video.title, 'yt');
      }

      // Also send via Coolhole client if available
      if (this.chatBot.coolhole && this.chatBot.coolhole.queueVideo) {
        await this.chatBot.coolhole.queueVideo(video.videoId, 'yt');
      }

      // Track what was queued
      this.queuedVideos.add(video.videoId);
      this.discoveryHistory.push({
        video,
        searchQuery,
        timestamp: Date.now()
      });

      // Keep history limited
      if (this.discoveryHistory.length > 50) {
        this.discoveryHistory.shift();
      }

      // Maybe announce the discovery in chat
      if (Math.random() < 0.5) {
        const announcements = [
          `found something: ${video.title}`,
          `queueing this: ${video.title}`,
          `check this out: ${video.title}`,
          `adding to queue: ${video.title}`,
          `${video.title} looks good`
        ];
        const message = announcements[Math.floor(Math.random() * announcements.length)];
        setTimeout(() => {
          this.chatBot.sendMessage(message);
        }, 2000);
      }

      console.log(`✅ [VideoDiscovery] Queued: ${video.title}`);
    } catch (error) {
      console.error(`❌ [VideoDiscovery] Failed to queue video:`, error.message);
    }
  }

  /**
   * Update preferences based on video performance (likes, chat reaction)
   */
  updatePreferences(videoType, feedback) {
    if (this.preferences.genres.has(videoType)) {
      const current = this.preferences.genres.get(videoType);
      const adjustment = feedback > 0 ? 0.1 : -0.1;
      const updated = Math.max(0.1, Math.min(1.0, current + adjustment));
      this.preferences.genres.set(videoType, updated);
      
      console.log(`📊 [VideoDiscovery] Updated ${videoType} preference: ${current.toFixed(2)} → ${updated.toFixed(2)}`);
    }
  }

  /**
   * Start automatic video discovery
   */
  start() {
    console.log('🎬 [VideoDiscovery] Starting automatic video discovery...');
    
    this.discoveryTimer = setInterval(async () => {
      await this.discoverVideo();
    }, this.discoveryInterval);
  }

  /**
   * Stop automatic video discovery
   */
  stop() {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = null;
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalQueued: this.queuedVideos.size,
      recentDiscoveries: this.discoveryHistory.slice(-10),
      preferences: Object.fromEntries(this.preferences.genres),
      nextDiscoveryIn: Math.max(0, this.discoveryInterval - (Date.now() - this.lastDiscovery))
    };
  }
}

module.exports = VideoDiscovery;
