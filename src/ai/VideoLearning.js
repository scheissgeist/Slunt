/**
 * Video Learning System
 * Learns from video content, titles, and user reactions
 */

class VideoLearning {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.videoMemory = new Map(); // videoId -> video data
    this.genrePreferences = new Map(); // username -> genre preferences
    this.contentPatterns = {
      genres: [],
      popularCreators: new Map(),
      trendingTopics: new Set(),
      watchedVideos: []
    };
    
    // NEW: Track Slunt's reactions to videos
    this.sluntReactions = new Map(); // videoId -> { reaction, sentiment, timestamp }
    this.videoComments = new Map(); // videoId -> [comments made about this video]
    this.similarVideoMemory = new Map(); // contentType -> [videoIds]
    this.videoPatterns = new Map(); // pattern -> count (e.g., "cat videos" -> 5)
  }

  /**
   * Record Slunt's reaction to a video
   */
  recordSluntReaction(videoId, videoTitle, reaction, sentiment) {
    this.sluntReactions.set(videoId, {
      reaction,
      sentiment,
      timestamp: Date.now(),
      title: videoTitle
    });
    
    console.log(`🎥 [VideoLearning] Recorded Slunt's reaction to "${videoTitle}": ${sentiment}`);
  }

  /**
   * Check if Slunt has already commented on this video
   */
  hasCommentedOn(videoId) {
    return this.videoComments.has(videoId);
  }

  /**
   * Add comment to video history
   */
  addVideoComment(videoId, videoTitle, comment) {
    if (!this.videoComments.has(videoId)) {
      this.videoComments.set(videoId, []);
    }
    this.videoComments.get(videoId).push({
      comment,
      timestamp: Date.now()
    });
  }

  /**
   * Get Slunt's past opinion on similar videos
   */
  getSimilarVideoOpinion(contentType) {
    const similar = this.similarVideoMemory.get(contentType);
    if (!similar || similar.length === 0) return null;
    
    // Get a random past similar video
    const randomVideoId = similar[Math.floor(Math.random() * similar.length)];
    return this.sluntReactions.get(randomVideoId);
  }

  /**
   * Reference a previous video
   */
  getPreviousVideoReference(contentType) {
    const similar = this.similarVideoMemory.get(contentType);
    if (!similar || similar.length === 0) return null;
    
    const videoId = similar[similar.length - 1]; // Most recent
    const videoData = this.videoMemory.get(videoId);
    if (!videoData) return null;
    
    return {
      title: videoData.title,
      reaction: this.sluntReactions.get(videoId)
    };
  }

  /**
   * Learn from a video being played
   */
  learnFromVideo(videoData) {
    const { videoId, title, creator, duration, queuedBy } = videoData;

    // Store video data
    this.videoMemory.set(videoId, {
      ...videoData,
      playedAt: Date.now(),
      reactions: [],
      chatActivity: 0
    });

    // Keep only last 100 videos
    if (this.videoMemory.size > 100) {
      const oldest = Array.from(this.videoMemory.keys())[0];
      this.videoMemory.delete(oldest);
    }

    // Analyze title for content type
    const contentType = this.detectContentType(title);
    if (contentType) {
      this.contentPatterns.genres.push(contentType);
      if (this.contentPatterns.genres.length > 50) {
        this.contentPatterns.genres.shift();
      }
      
      // Track similar videos by type for future references
      if (!this.similarVideoMemory.has(contentType)) {
        this.similarVideoMemory.set(contentType, []);
      }
      this.similarVideoMemory.get(contentType).push(videoId);
      
      // Keep only last 20 per category
      if (this.similarVideoMemory.get(contentType).length > 20) {
        this.similarVideoMemory.get(contentType).shift();
      }
    }
    
    // Track video patterns for recognition
    const patterns = this.extractPatterns(title);
    patterns.forEach(pattern => {
      const count = this.videoPatterns.get(pattern) || 0;
      this.videoPatterns.set(pattern, count + 1);
    });

    // Track creator popularity
    if (creator) {
      const count = this.contentPatterns.popularCreators.get(creator) || 0;
      this.contentPatterns.popularCreators.set(creator, count + 1);
    }

    // Track who queued it
    if (queuedBy) {
      this.updateUserPreferences(queuedBy, contentType, title);
    }

    console.log(`📺 [Video] Learned from: "${title}" (${contentType})`);
  }
  
  /**
   * Extract recognizable patterns from video title
   */
  extractPatterns(title) {
    const patterns = [];
    const lower = title.toLowerCase();
    
    // Common patterns
    if (lower.includes('cat') || lower.includes('kitten')) patterns.push('cat videos');
    if (lower.includes('dog') || lower.includes('puppy')) patterns.push('dog videos');
    if (lower.includes('fail')) patterns.push('fail videos');
    if (lower.includes('reaction')) patterns.push('reaction videos');
    if (lower.includes('tutorial') || lower.includes('how to')) patterns.push('tutorials');
    if (lower.includes('review')) patterns.push('reviews');
    if (lower.includes('trailer')) patterns.push('trailers');
    if (lower.includes('animation') || lower.includes('animated')) patterns.push('animations');
    if (lower.includes('compilation')) patterns.push('compilations');
    if (lower.includes('live')) patterns.push('live streams');
    
    return patterns;
  }

  /**
   * Detect content type from title
   */
  detectContentType(title) {
    const lower = title.toLowerCase();

    // Music
    if (lower.includes('music') || lower.includes('song') || lower.includes('official video') || 
        lower.includes('audio') || lower.includes('mv') || lower.includes('lyrics')) {
      return 'music';
    }

    // Comedy
    if (lower.includes('funny') || lower.includes('comedy') || lower.includes('laugh') || 
        lower.includes('meme') || lower.includes('lol') || lower.includes('hilarious')) {
      return 'comedy';
    }

    // Gaming
    if (lower.includes('game') || lower.includes('gameplay') || lower.includes('playthrough') || 
        lower.includes('speedrun') || lower.includes('lets play') || lower.includes('gaming')) {
      return 'gaming';
    }

    // Tutorial/Educational
    if (lower.includes('how to') || lower.includes('tutorial') || lower.includes('guide') || 
        lower.includes('explained') || lower.includes('learn')) {
      return 'educational';
    }

    // News/Documentary
    if (lower.includes('documentary') || lower.includes('news') || lower.includes('report') || 
        lower.includes('interview')) {
      return 'documentary';
    }

    // Animation
    if (lower.includes('animation') || lower.includes('animated') || lower.includes('anime') || 
        lower.includes('cartoon')) {
      return 'animation';
    }

    // Vlog/Personal
    if (lower.includes('vlog') || lower.includes('day in') || lower.includes('my life')) {
      return 'vlog';
    }

    // Podcast/Talk
    if (lower.includes('podcast') || lower.includes('interview') || lower.includes('talk') || 
        lower.includes('discussion')) {
      return 'podcast';
    }

    return 'general';
  }

  /**
   * Update user preferences based on what they queue
   */
  updateUserPreferences(username, contentType, title) {
    if (!this.genrePreferences.has(username)) {
      this.genrePreferences.set(username, {
        genres: {},
        recentQueues: [],
        favoriteCreators: new Set()
      });
    }

    const prefs = this.genrePreferences.get(username);
    
    // Update genre count
    prefs.genres[contentType] = (prefs.genres[contentType] || 0) + 1;
    
    // Track recent queues
    prefs.recentQueues.push({ title, contentType, timestamp: Date.now() });
    if (prefs.recentQueues.length > 20) {
      prefs.recentQueues.shift();
    }

    // Update user profile with content preferences
    const profile = this.chatBot.userProfiles.get(username);
    if (profile) {
      if (!profile.contentPreferences) {
        profile.contentPreferences = {};
      }
      profile.contentPreferences[contentType] = (profile.contentPreferences[contentType] || 0) + 1;
    }
  }

  /**
   * Track chat reactions during video
   */
  trackReaction(username, message, currentVideoId) {
    if (!currentVideoId || !this.videoMemory.has(currentVideoId)) return;

    const video = this.videoMemory.get(currentVideoId);
    video.reactions.push({
      username,
      message: message.substring(0, 100),
      timestamp: Date.now(),
      sentiment: this.detectSentiment(message)
    });

    video.chatActivity++;
  }

  /**
   * Detect sentiment of reaction
   */
  detectSentiment(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('lmao') || lower.includes('lol') || lower.includes('haha') || 
        lower.includes('😂') || lower.includes('🤣') || lower.includes('💀')) {
      return 'funny';
    }
    
    if (lower.includes('wow') || lower.includes('amazing') || lower.includes('awesome') || 
        lower.includes('fire') || lower.includes('🔥')) {
      return 'impressed';
    }
    
    if (lower.includes('wtf') || lower.includes('bruh') || lower.includes('cringe') || 
        lower.includes('💀') || lower.includes('yikes')) {
      return 'confused';
    }
    
    if (lower.includes('boring') || lower.includes('skip') || lower.includes('next')) {
      return 'bored';
    }

    return 'neutral';
  }

  /**
   * Suggest videos based on community preferences
   */
  suggestVideo(username = null) {
    // Get popular content types
    const genreCounts = {};
    this.contentPatterns.genres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });

    const popularGenre = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'general';

    // If specific user, consider their preferences
    if (username && this.genrePreferences.has(username)) {
      const userPrefs = this.genrePreferences.get(username);
      const userFavorite = Object.entries(userPrefs.genres)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      if (userFavorite) {
        return {
          suggestion: `${username} you should queue some ${userFavorite}, that's your vibe`,
          genre: userFavorite
        };
      }
    }

    // General suggestion
    return {
      suggestion: `chat seems to be into ${popularGenre} lately, let's queue some`,
      genre: popularGenre
    };
  }

  /**
   * Analyze what made a video popular
   */
  analyzePopularVideo(videoId) {
    const video = this.videoMemory.get(videoId);
    if (!video) return null;

    const positiveReactions = video.reactions.filter(r => 
      r.sentiment === 'funny' || r.sentiment === 'impressed'
    ).length;

    const engagementRate = video.chatActivity / (video.duration || 1);

    return {
      videoId,
      title: video.title,
      contentType: this.detectContentType(video.title),
      positiveReactions,
      totalReactions: video.reactions.length,
      engagementRate,
      popularity: positiveReactions / Math.max(video.reactions.length, 1)
    };
  }

  /**
   * Get video learning stats
   */
  getStats() {
    const genreCounts = {};
    this.contentPatterns.genres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });

    const topCreators = Array.from(this.contentPatterns.popularCreators.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalVideosWatched: this.videoMemory.size,
      genreDistribution: genreCounts,
      topCreators: topCreators.map(([creator, count]) => ({ creator, count })),
      usersTracked: this.genrePreferences.size
    };
  }

  /**
   * Generate insights about community viewing habits
   */
  getCommunityInsights() {
    const stats = this.getStats();
    const insights = [];

    // Most popular genre
    if (Object.keys(stats.genreDistribution).length > 0) {
      const topGenre = Object.entries(stats.genreDistribution)
        .sort(([,a], [,b]) => b - a)[0];
      insights.push(`Community loves ${topGenre[0]} content (${topGenre[1]} videos)`);
    }

    // Diverse viewers
    const uniqueUsers = this.genrePreferences.size;
    if (uniqueUsers > 5) {
      insights.push(`${uniqueUsers} people actively shaping the queue`);
    }

    // Top creator
    if (stats.topCreators.length > 0) {
      const top = stats.topCreators[0];
      insights.push(`${top.creator} is a community favorite`);
    }

    return insights;
  }

  /**
   * Learn emote patterns related to content
   */
  learnEmotePatterns(emote, context) {
    // Track which emotes are used during which content types
    if (!this.emotePatterns) {
      this.emotePatterns = new Map();
    }

    if (!this.emotePatterns.has(emote)) {
      this.emotePatterns.set(emote, {
        totalUses: 0,
        contexts: {}
      });
    }

    const pattern = this.emotePatterns.get(emote);
    pattern.totalUses++;
    pattern.contexts[context] = (pattern.contexts[context] || 0) + 1;
  }

  /**
   * Suggest appropriate emote for current content
   */
  suggestEmote(contentType) {
    if (!this.emotePatterns) return null;

    const relevantEmotes = [];
    for (const [emote, pattern] of this.emotePatterns.entries()) {
      if (pattern.contexts[contentType]) {
        relevantEmotes.push({
          emote,
          relevance: pattern.contexts[contentType] / pattern.totalUses
        });
      }
    }

    relevantEmotes.sort((a, b) => b.relevance - a.relevance);
    return relevantEmotes[0]?.emote || null;
  }
}

module.exports = VideoLearning;
