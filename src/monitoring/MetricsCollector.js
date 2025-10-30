const fs = require('fs').promises;
const path = require('path');

/**
 * Metrics Collector - Tracks bot performance and behavior metrics over time
 */
class MetricsCollector {
  constructor() {
    this.metricsPath = path.join(process.cwd(), 'data', 'metrics.json');
    
    this.currentSession = {
      startTime: Date.now(),
      platforms: {
        coolhole: { messagesSent: 0, messagesReceived: 0, errors: 0 },
        discord: { messagesSent: 0, messagesReceived: 0, errors: 0 },
        twitch: { messagesSent: 0, messagesReceived: 0, errors: 0 }
      },
      responses: {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        blocked: 0,
        avgLength: 0,
        avgGenerationTime: 0
      },
      quality: {
        truncated: 0,
        split: 0,
        duplicates: 0,
        chaosModified: 0,
        contentFiltered: 0
      },
      users: {
        totalInteracted: 0,
        newUsers: 0,
        activeUsers: new Set()
      },
      errors: {
        total: 0,
        critical: 0,
        byType: {}
      }
    };
    
    this.historicalMetrics = [];
    this.loadHistoricalMetrics();
  }

  /**
   * Load historical metrics from disk
   */
  async loadHistoricalMetrics() {
    try {
      const data = await fs.readFile(this.metricsPath, 'utf8');
      this.historicalMetrics = JSON.parse(data);
      console.log(`📊 [Metrics] Loaded ${this.historicalMetrics.length} historical sessions`);
    } catch (error) {
      console.log('📊 [Metrics] No historical metrics found, starting fresh');
      this.historicalMetrics = [];
    }
  }

  /**
   * Save current session to historical metrics
   */
  async saveSession() {
    try {
      // Convert Set to array for JSON serialization
      const sessionToSave = {
        ...this.currentSession,
        endTime: Date.now(),
        duration: Date.now() - this.currentSession.startTime,
        users: {
          ...this.currentSession.users,
          activeUsers: Array.from(this.currentSession.users.activeUsers)
        }
      };
      
      this.historicalMetrics.push(sessionToSave);
      
      // Keep only last 30 sessions
      if (this.historicalMetrics.length > 30) {
        this.historicalMetrics = this.historicalMetrics.slice(-30);
      }
      
      await fs.writeFile(this.metricsPath, JSON.stringify(this.historicalMetrics, null, 2));
      console.log('📊 [Metrics] Session saved to disk');
    } catch (error) {
      console.error('❌ [Metrics] Error saving session:', error.message);
    }
  }

  /**
   * Track a message sent
   */
  trackMessageSent(platform, message) {
    if (this.currentSession.platforms[platform]) {
      this.currentSession.platforms[platform].messagesSent++;
    }
    
    this.currentSession.responses.total++;
    this.currentSession.responses.successful++;
    
    // Track response length
    const responseCount = this.currentSession.responses.successful;
    this.currentSession.responses.avgLength = 
      (this.currentSession.responses.avgLength * (responseCount - 1) + message.length) / responseCount;
  }

  /**
   * Track a message received
   */
  trackMessageReceived(platform, username) {
    if (this.currentSession.platforms[platform]) {
      this.currentSession.platforms[platform].messagesReceived++;
    }
    
    this.currentSession.users.activeUsers.add(username);
  }

  /**
   * Track a new user
   */
  trackNewUser() {
    this.currentSession.users.newUsers++;
    this.currentSession.users.totalInteracted++;
  }

  /**
   * Track a response skipped
   */
  trackResponseSkipped() {
    this.currentSession.responses.total++;
    this.currentSession.responses.skipped++;
  }

  /**
   * Track a response blocked
   */
  trackResponseBlocked(reason) {
    this.currentSession.responses.total++;
    this.currentSession.responses.blocked++;
    
    if (reason === 'duplicate') {
      this.currentSession.quality.duplicates++;
    } else if (reason === 'content_filter') {
      this.currentSession.quality.contentFiltered++;
    }
  }

  /**
   * Track response quality metrics
   */
  trackQuality(type) {
    if (type === 'truncated') {
      this.currentSession.quality.truncated++;
    } else if (type === 'split') {
      this.currentSession.quality.split++;
    } else if (type === 'chaos') {
      this.currentSession.quality.chaosModified++;
    }
  }

  /**
   * Track an error
   */
  trackError(severity, type, message) {
    this.currentSession.errors.total++;
    
    if (severity === 'critical') {
      this.currentSession.errors.critical++;
    }
    
    if (!this.currentSession.errors.byType[type]) {
      this.currentSession.errors.byType[type] = 0;
    }
    this.currentSession.errors.byType[type]++;
  }

  /**
   * Track response generation time
   */
  trackGenerationTime(milliseconds) {
    const responseCount = this.currentSession.responses.successful;
    this.currentSession.responses.avgGenerationTime = 
      (this.currentSession.responses.avgGenerationTime * (responseCount - 1) + milliseconds) / responseCount;
  }

  /**
   * Get current session metrics
   */
  getCurrentMetrics() {
    return {
      ...this.currentSession,
      uptime: Date.now() - this.currentSession.startTime,
      users: {
        ...this.currentSession.users,
        activeUsers: this.currentSession.users.activeUsers.size
      }
    };
  }

  /**
   * Get comparison with previous sessions
   */
  getComparison() {
    if (this.historicalMetrics.length === 0) {
      return null;
    }
    
    const lastSession = this.historicalMetrics[this.historicalMetrics.length - 1];
    const current = this.getCurrentMetrics();
    
    return {
      responseRate: {
        current: current.responses.successful / (current.uptime / 3600000), // per hour
        previous: lastSession.responses.successful / (lastSession.duration / 3600000),
        change: ((current.responses.successful / (current.uptime / 3600000)) - 
                 (lastSession.responses.successful / (lastSession.duration / 3600000)))
      },
      errorRate: {
        current: current.errors.total / current.responses.total || 0,
        previous: lastSession.errors.total / lastSession.responses.total || 0,
        change: (current.errors.total / current.responses.total || 0) - 
                (lastSession.errors.total / lastSession.responses.total || 0)
      },
      qualityScore: {
        current: this.calculateQualityScore(current),
        previous: this.calculateQualityScore(lastSession),
        change: this.calculateQualityScore(current) - this.calculateQualityScore(lastSession)
      }
    };
  }

  /**
   * Calculate quality score (0-100)
   */
  calculateQualityScore(session) {
    let score = 100;
    
    const responses = session.responses;
    const quality = session.quality;
    
    // Deduct for blocked/skipped responses
    const blockRate = responses.blocked / responses.total || 0;
    score -= blockRate * 30;
    
    const skipRate = responses.skipped / responses.total || 0;
    score -= skipRate * 20;
    
    // Deduct for quality issues
    const truncateRate = quality.truncated / responses.successful || 0;
    score -= truncateRate * 25;
    
    const chaosRate = quality.chaosModified / responses.successful || 0;
    score -= chaosRate * 15;
    
    // Deduct for errors
    const errorRate = session.errors.total / responses.total || 0;
    score -= errorRate * 40;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get historical trends
   */
  getHistoricalTrends() {
    if (this.historicalMetrics.length < 2) {
      return null;
    }
    
    const last5Sessions = this.historicalMetrics.slice(-5);
    
    return {
      responseRate: last5Sessions.map(s => s.responses.successful / (s.duration / 3600000)),
      errorRate: last5Sessions.map(s => s.errors.total / s.responses.total || 0),
      qualityScore: last5Sessions.map(s => this.calculateQualityScore(s)),
      activeUsers: last5Sessions.map(s => s.users.activeUsers.length || s.users.activeUsers)
    };
  }
}

module.exports = MetricsCollector;
