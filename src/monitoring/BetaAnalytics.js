/**
 * Beta Analytics - Track everything for improvement
 * Logs all conversations, responses, timing, and context to analyze what works
 */

const fs = require('fs');
const path = require('path');

class BetaAnalytics {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data/beta_analytics');
    this.sessionsDir = path.join(this.dataDir, 'sessions');
    this.metricsFile = path.join(this.dataDir, 'metrics.json');

    // Create directories if they don't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }

    // Session data
    this.sessionId = Date.now();
    this.sessionFile = path.join(this.sessionsDir, `session_${this.sessionId}.jsonl`);
    this.sessionStart = Date.now();

    // Real-time metrics
    this.metrics = {
      sessionId: this.sessionId,
      startTime: this.sessionStart,
      totalMessages: 0,
      totalResponses: 0,
      totalSkipped: 0,
      avgResponseTime: 0,
      responseTimes: [],
      contextHits: [], // Times when context was used effectively
      contextMisses: [], // Times when context seemed lost
      topicContinuity: [], // How well topics are maintained
      platforms: {
        coolhole: { messages: 0, responses: 0 },
        discord: { messages: 0, responses: 0 },
        twitch: { messages: 0, responses: 0 }
      }
    };

    console.log('📊 BetaAnalytics initialized');
    console.log(`   Session ID: ${this.sessionId}`);
    console.log(`   Data dir: ${this.dataDir}`);
  }

  /**
   * Log incoming message
   */
  logMessage(username, text, platform, channelId) {
    this.metrics.totalMessages++;
    this.metrics.platforms[platform].messages++;

    const event = {
      type: 'message',
      timestamp: Date.now(),
      username,
      text: text.substring(0, 500), // Limit length
      platform,
      channelId
    };

    this.appendToSession(event);
  }

  /**
   * Log response decision (responded or skipped)
   */
  logDecision(username, text, decision, reason) {
    if (decision === 'respond') {
      this.metrics.totalResponses++;
    } else {
      this.metrics.totalSkipped++;
    }

    const event = {
      type: 'decision',
      timestamp: Date.now(),
      username,
      text: text.substring(0, 200),
      decision,
      reason
    };

    this.appendToSession(event);
  }

  /**
   * Log response generation (timing, context, output)
   */
  logResponse(username, userMessage, context, response, timing, platform) {
    const responseTime = timing.end - timing.start;
    this.metrics.responseTimes.push(responseTime);
    this.metrics.avgResponseTime =
      this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;

    this.metrics.platforms[platform].responses++;

    const event = {
      type: 'response',
      timestamp: Date.now(),
      username,
      userMessage: userMessage.substring(0, 200),
      context: context.map(msg => ({
        username: msg.username,
        text: msg.text.substring(0, 100)
      })),
      response: response.substring(0, 500),
      responseTime,
      platform
    };

    this.appendToSession(event);

    // Log to console for visibility
    console.log(`📊 [Analytics] Response in ${responseTime}ms (avg: ${Math.round(this.metrics.avgResponseTime)}ms)`);
  }

  /**
   * Log context analysis (did Slunt use context correctly?)
   */
  logContextAnalysis(username, message, response, contextUsed, analysis) {
    const event = {
      type: 'context_analysis',
      timestamp: Date.now(),
      username,
      message: message.substring(0, 200),
      response: response.substring(0, 200),
      contextUsed, // boolean
      analysis // string describing if context was relevant
    };

    if (contextUsed) {
      this.metrics.contextHits.push(event);
    } else {
      this.metrics.contextMisses.push(event);
    }

    this.appendToSession(event);
  }

  /**
   * Log topic continuity (conversation flow analysis)
   */
  logTopicContinuity(conversationId, messages, currentTopic, topicMaintained) {
    const event = {
      type: 'topic_continuity',
      timestamp: Date.now(),
      conversationId,
      messageCount: messages.length,
      currentTopic,
      topicMaintained, // boolean
      recentMessages: messages.slice(-3).map(m => ({
        username: m.username,
        text: m.text.substring(0, 100)
      }))
    };

    this.metrics.topicContinuity.push({
      timestamp: Date.now(),
      maintained: topicMaintained
    });

    this.appendToSession(event);
  }

  /**
   * Append event to session log (JSONL format)
   */
  appendToSession(event) {
    try {
      fs.appendFileSync(this.sessionFile, JSON.stringify(event) + '\n');
    } catch (error) {
      console.error('❌ Error writing to session log:', error.message);
    }
  }

  /**
   * Save current metrics snapshot
   */
  saveMetrics() {
    try {
      const metricsSnapshot = {
        ...this.metrics,
        sessionDuration: Date.now() - this.sessionStart,
        timestamp: Date.now()
      };

      fs.writeFileSync(this.metricsFile, JSON.stringify(metricsSnapshot, null, 2));
      console.log('💾 Metrics saved');
    } catch (error) {
      console.error('❌ Error saving metrics:', error.message);
    }
  }

  /**
   * Get current stats for display
   */
  getStats() {
    const uptime = Date.now() - this.sessionStart;
    const uptimeMin = Math.floor(uptime / 60000);

    return {
      sessionId: this.sessionId,
      uptime: `${uptimeMin} minutes`,
      totalMessages: this.metrics.totalMessages,
      totalResponses: this.metrics.totalResponses,
      responseRate: this.metrics.totalMessages > 0
        ? `${Math.round((this.metrics.totalResponses / this.metrics.totalMessages) * 100)}%`
        : '0%',
      avgResponseTime: `${Math.round(this.metrics.avgResponseTime)}ms`,
      contextHitRate: this.metrics.contextHits.length + this.metrics.contextMisses.length > 0
        ? `${Math.round((this.metrics.contextHits.length / (this.metrics.contextHits.length + this.metrics.contextMisses.length)) * 100)}%`
        : 'N/A',
      topicContinuityRate: this.metrics.topicContinuity.length > 0
        ? `${Math.round((this.metrics.topicContinuity.filter(t => t.maintained).length / this.metrics.topicContinuity.length) * 100)}%`
        : 'N/A',
      platforms: this.metrics.platforms
    };
  }

  /**
   * Print stats to console
   */
  printStats() {
    const stats = this.getStats();
    console.log('\n📊 ===== BETA ANALYTICS STATS =====');
    console.log(`Session: ${stats.sessionId} (${stats.uptime})`);
    console.log(`Messages: ${stats.totalMessages} | Responses: ${stats.totalResponses} (${stats.responseRate})`);
    console.log(`Avg Response Time: ${stats.avgResponseTime}`);
    console.log(`Context Hit Rate: ${stats.contextHitRate}`);
    console.log(`Topic Continuity: ${stats.topicContinuityRate}`);
    console.log('Platforms:');
    Object.entries(stats.platforms).forEach(([platform, data]) => {
      console.log(`  ${platform}: ${data.messages} msg, ${data.responses} resp`);
    });
    console.log('====================================\n');
  }

  /**
   * Periodic save (every 60 seconds)
   */
  startPeriodicSave() {
    this.saveInterval = setInterval(() => {
      this.saveMetrics();
      this.printStats();
    }, 60000); // Every minute
  }

  /**
   * Stop periodic save
   */
  stopPeriodicSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
  }

  /**
   * Shutdown - save final metrics
   */
  shutdown() {
    this.stopPeriodicSave();
    this.saveMetrics();
    this.printStats();
    console.log('📊 BetaAnalytics shutdown complete');
  }
}

module.exports = BetaAnalytics;
