const EventEmitter = require('events');

/**
 * Sentiment Analyzer
 * Tracks chat mood, topics, and drama in real-time
 */
class SentimentAnalyzer extends EventEmitter {
  constructor() {
    super();
    
    // Sentiment tracking
    this.messageWindow = [];
    this.windowDuration = 120000; // 2 minutes
    this.userSentiments = new Map(); // username -> sentiment history
    
    // Platform-specific tracking
    this.platformMetrics = {
      twitch: { messages: [], sentiment: 0.5, users: new Set() },
      discord: { messages: [], sentiment: 0.5, users: new Set() },
      coolhole: { messages: [], sentiment: 0.5, users: new Set() }
    };
    
    // Topic tracking
    this.topicFrequency = new Map();
    this.topicDecay = 0.95; // Topics decay over time
    
    // Drama detection
    this.dramaIndicators = {
      aggressive: ['fuck', 'shit', 'stfu', 'kys', 'idiot', 'stupid', 'trash', 'garbage'],
      argumentative: ['wrong', 'cope', 'imagine', 'cringe', 'ratio', 'clown'],
      defensive: ['whatever', 'sure', 'yeah right', 'ok buddy', 'cope'],
      dismissive: ['lol ok', 'sure thing', 'whatever you say']
    };
    
    // Positive/negative word lists
    this.positiveWords = ['lol', 'lmao', 'nice', 'pog', 'based', 'good', 'great', 'love', 'awesome', 'amazing', 'perfect'];
    this.negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'trash', 'garbage', 'sucks', 'cringe'];
    
    // Metrics
    this.metrics = {
      overallSentiment: 0.5, // 0 = negative, 1 = positive
      activityLevel: 'low', // low, medium, high
      dramaLevel: 0, // 0-1
      topTopics: [],
      moodTrajectory: [] // Recent sentiment changes
    };
    
    // Update interval
    this.updateInterval = null;
  }

  /**
   * Start the analyzer
   */
  start() {
    console.log('📊 [Sentiment] Starting sentiment analyzer');
    
    // Update metrics every 10 seconds
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, 10000);
  }

  /**
   * Stop the analyzer
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Analyze incoming message
   */
  analyzeMessage(data) {
    const now = Date.now();
    const text = data.text.toLowerCase();
    const platform = data.platform || 'unknown';
    
    // Calculate message sentiment
    const sentiment = this.calculateSentiment(text);
    const drama = this.detectDrama(text);
    
    // Store message
    const message = {
      username: data.username,
      text: data.text,
      timestamp: now,
      sentiment: sentiment,
      drama: drama,
      platform: platform
    };
    
    this.messageWindow.push(message);
    
    // Update platform-specific metrics
    if (this.platformMetrics[platform]) {
      this.platformMetrics[platform].messages.push(message);
      this.platformMetrics[platform].users.add(data.username);
      
      // Clean old platform messages (keep last 2 minutes)
      this.platformMetrics[platform].messages = this.platformMetrics[platform].messages.filter(
        m => now - m.timestamp < this.windowDuration
      );
    }
    
    // Update user sentiment history (track which platform too)
    if (!this.userSentiments.has(data.username)) {
      this.userSentiments.set(data.username, []);
    }
    this.userSentiments.get(data.username).push({
      sentiment,
      timestamp: now,
      platform: platform
    });
    
    // Extract and track topics
    this.extractTopics(text);
    
    // Clean old data
    this.cleanup(now);
    
    // Emit events for interesting patterns
    if (drama > 0.6) {
      this.emit('dramaDetected', { username: data.username, level: drama, text: data.text });
    }
    
    if (sentiment < 0.2) {
      this.emit('negativitySpike', { username: data.username, sentiment });
    }
  }

  /**
   * Calculate sentiment score for text
   */
  calculateSentiment(text) {
    let score = 0.5; // Neutral baseline
    
    // Check positive words
    const positiveCount = this.positiveWords.filter(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(text)
    ).length;
    
    // Check negative words
    const negativeCount = this.negativeWords.filter(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(text)
    ).length;
    
    // Emojis
    const positiveEmojis = (text.match(/😂|🤣|😊|😁|❤️|💙|👍|🎉|✨/g) || []).length;
    const negativeEmojis = (text.match(/😢|😭|😡|👎|💀/g) || []).length;
    
    // Calculate final score
    score += (positiveCount * 0.1) + (positiveEmojis * 0.05);
    score -= (negativeCount * 0.1) + (negativeEmojis * 0.05);
    
    // Caps = slight negative bias (shouting)
    if (text === text.toUpperCase() && text.length > 5) {
      score -= 0.1;
    }
    
    // Multiple exclamation marks = excitement or aggression
    const exclamations = (text.match(/!/g) || []).length;
    if (exclamations > 2) {
      score += 0.05; // Lean positive (excitement)
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Detect drama/conflict indicators
   */
  detectDrama(text) {
    let dramaScore = 0;
    
    for (const [category, words] of Object.entries(this.dramaIndicators)) {
      const matches = words.filter(word => 
        new RegExp(`\\b${word}\\b`, 'i').test(text)
      ).length;
      
      dramaScore += matches * 0.2;
    }
    
    // Check for @ mentions (could be calling someone out)
    const mentions = (text.match(/@\w+/g) || []).length;
    if (mentions > 1) {
      dramaScore += 0.1;
    }
    
    // Check for question marks + aggressive tone
    if (text.includes('?') && dramaScore > 0) {
      dramaScore += 0.1;
    }
    
    return Math.min(1, dramaScore);
  }

  /**
   * Extract topics from text
   */
  extractTopics(text) {
    // Remove common words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'was', 'are', 'be', 'this', 'that', 'it', 'he', 'she', 'they']);
    
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Update topic frequency
    for (const word of words) {
      const current = this.topicFrequency.get(word) || 0;
      this.topicFrequency.set(word, current + 1);
    }
  }

  /**
   * Update overall metrics
   */
  updateMetrics() {
    if (this.messageWindow.length === 0) {
      return;
    }
    
    const now = Date.now();
    
    // Update platform-specific sentiments
    for (const [platform, data] of Object.entries(this.platformMetrics)) {
      if (data.messages.length > 0) {
        const avgSentiment = data.messages.reduce((sum, m) => sum + m.sentiment, 0) / data.messages.length;
        data.sentiment = avgSentiment;
      }
    }
    
    // Overall sentiment (weighted average, recent messages matter more)
    let totalWeight = 0;
    let weightedSentiment = 0;
    
    for (const msg of this.messageWindow) {
      const age = now - msg.timestamp;
      const weight = Math.exp(-age / 60000); // Exponential decay over 1 minute
      weightedSentiment += msg.sentiment * weight;
      totalWeight += weight;
    }
    
    const newSentiment = totalWeight > 0 ? weightedSentiment / totalWeight : 0.5;
    
    // Track trajectory
    this.metrics.moodTrajectory.push({
      sentiment: newSentiment,
      timestamp: now
    });
    
    // Keep only last 10 minutes of trajectory
    this.metrics.moodTrajectory = this.metrics.moodTrajectory.filter(
      point => now - point.timestamp < 600000
    );
    
    this.metrics.overallSentiment = newSentiment;
    
    // Activity level (aggregate all platforms)
    const messagesPerMinute = this.messageWindow.length / 2; // 2 minute window
    if (messagesPerMinute > 15) {
      this.metrics.activityLevel = 'high';
    } else if (messagesPerMinute > 5) {
      this.metrics.activityLevel = 'medium';
    } else {
      this.metrics.activityLevel = 'low';
    }
    
    // Drama level
    const dramaMessages = this.messageWindow.filter(m => m.drama > 0.5);
    this.metrics.dramaLevel = dramaMessages.length / this.messageWindow.length;
    
    // Top topics (decay old topics)
    for (const [topic, freq] of this.topicFrequency.entries()) {
      this.topicFrequency.set(topic, freq * this.topicDecay);
      
      // Remove topics that have decayed too much
      if (this.topicFrequency.get(topic) < 0.5) {
        this.topicFrequency.delete(topic);
      }
    }
    
    // Get top 5 topics
    this.metrics.topTopics = Array.from(this.topicFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, freq]) => ({ topic, frequency: Math.round(freq) }));
    
    // Emit metrics update
    this.emit('metricsUpdated', this.getMetrics());
  }

  /**
   * Clean up old data
   */
  cleanup(now) {
    // Remove old messages
    this.messageWindow = this.messageWindow.filter(
      msg => now - msg.timestamp < this.windowDuration
    );
    
    // Clean up user sentiment histories
    for (const [username, history] of this.userSentiments.entries()) {
      const filtered = history.filter(
        entry => now - entry.timestamp < 600000 // 10 minutes
      );
      
      if (filtered.length === 0) {
        this.userSentiments.delete(username);
      } else {
        this.userSentiments.set(username, filtered);
      }
    }
  }

  /**
   * Get user sentiment trajectory
   */
  getUserTrajectory(username, limit = 10) {
    const history = this.userSentiments.get(username);
    if (!history) return null;
    
    return history.slice(-limit).map(entry => ({
      sentiment: entry.sentiment,
      timestamp: entry.timestamp
    }));
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    // Calculate platform breakdown
    const platformBreakdown = {};
    for (const [platform, data] of Object.entries(this.platformMetrics)) {
      platformBreakdown[platform] = {
        messageCount: data.messages.length,
        uniqueUsers: data.users.size,
        sentiment: Math.round(data.sentiment * 100) / 100,
        sentimentLabel: this.getSentimentLabel(data.sentiment),
        active: data.messages.length > 0
      };
    }
    
    return {
      overallSentiment: Math.round(this.metrics.overallSentiment * 100) / 100,
      sentimentLabel: this.getSentimentLabel(this.metrics.overallSentiment),
      activityLevel: this.metrics.activityLevel,
      dramaLevel: Math.round(this.metrics.dramaLevel * 100) / 100,
      topTopics: this.metrics.topTopics,
      messageCount: this.messageWindow.length,
      uniqueUsers: new Set(this.messageWindow.map(m => m.username)).size,
      moodTrajectory: this.metrics.moodTrajectory.slice(-20), // Last 20 points
      platformBreakdown: platformBreakdown,
      timestamp: Date.now()
    };
  }

  /**
   * Convert sentiment to label
   */
  getSentimentLabel(score) {
    if (score >= 0.7) return 'Very Positive';
    if (score >= 0.6) return 'Positive';
    if (score >= 0.4) return 'Neutral';
    if (score >= 0.3) return 'Negative';
    return 'Very Negative';
  }

  /**
   * Get top users by activity
   */
  getTopUsers(limit = 5) {
    const userCounts = new Map();
    const userPlatforms = new Map(); // Track which platforms user is on
    
    for (const msg of this.messageWindow) {
      const count = userCounts.get(msg.username) || 0;
      userCounts.set(msg.username, count + 1);
      
      // Track platforms
      if (!userPlatforms.has(msg.username)) {
        userPlatforms.set(msg.username, new Set());
      }
      userPlatforms.get(msg.username).add(msg.platform);
    }
    
    return Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([username, count]) => ({
        username,
        messageCount: count,
        avgSentiment: this.getUserAverageSentiment(username),
        platforms: Array.from(userPlatforms.get(username) || [])
      }));
  }

  /**
   * Get user's average sentiment
   */
  getUserAverageSentiment(username) {
    const history = this.userSentiments.get(username);
    if (!history || history.length === 0) return 0.5;
    
    const sum = history.reduce((total, entry) => total + entry.sentiment, 0);
    return Math.round((sum / history.length) * 100) / 100;
  }

  /**
   * Detect sentiment shift
   */
  detectShift() {
    if (this.metrics.moodTrajectory.length < 5) return null;
    
    const recent = this.metrics.moodTrajectory.slice(-5);
    const older = this.metrics.moodTrajectory.slice(-10, -5);
    
    if (older.length === 0) return null;
    
    const recentAvg = recent.reduce((sum, p) => sum + p.sentiment, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.sentiment, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    
    if (Math.abs(change) > 0.2) {
      return {
        direction: change > 0 ? 'improving' : 'declining',
        magnitude: Math.abs(change),
        from: Math.round(olderAvg * 100) / 100,
        to: Math.round(recentAvg * 100) / 100
      };
    }
    
    return null;
  }

  /**
   * Get full dashboard data
   */
  getDashboardData() {
    return {
      metrics: this.getMetrics(),
      topUsers: this.getTopUsers(),
      sentimentShift: this.detectShift(),
      dramaAlert: this.metrics.dramaLevel > 0.5,
      timestamp: Date.now()
    };
  }
}

module.exports = SentimentAnalyzer;
