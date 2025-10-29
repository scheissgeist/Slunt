/**
 * Startup Continuity System
 * Slunt reviews his memories on startup to understand "where he left off"
 * Generates awareness of recent events, relationships, and emotional state
 */

class StartupContinuity {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.continuityReport = null;
    this.lastSessionEnd = null;
  }

  /**
   * Analyze memories on startup to establish continuity
   */
  async analyzeContinuity() {
    console.log('🧠 [Continuity] Analyzing memories to establish continuity...');
    
    const report = {
      timestamp: Date.now(),
      timeSinceLastSession: 0,
      recentEvents: [],
      emotionalState: 'neutral',
      activeRelationships: [],
      unfinishedBusiness: [],
      contextSummary: '',
      initialMood: 'neutral'
    };

    // Get time since last session
    const lastSaved = this.chatBot.chatHistory[this.chatBot.chatHistory.length - 1]?.timestamp;
    if (lastSaved) {
      report.timeSinceLastSession = Date.now() - lastSaved;
      report.lastSessionEnd = new Date(lastSaved).toLocaleString();
    }

    // Analyze recent chat history (last 50 messages)
    const recentHistory = this.chatBot.chatHistory.slice(-50);
    
    // 1. Who was I talking to?
    const recentUsers = new Map();
    recentHistory.forEach(msg => {
      const count = recentUsers.get(msg.username) || 0;
      recentUsers.set(msg.username, count + 1);
    });
    
    const topUsers = Array.from(recentUsers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([user, count]) => ({ user, messages: count }));
    
    report.activeRelationships = topUsers;

    // 2. What was the mood/atmosphere?
    const sentiments = recentHistory.map(m => m.sentiment || 0);
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length || 0;
    
    if (avgSentiment > 0.3) {
      report.emotionalState = 'positive';
      report.initialMood = 'happy';
    } else if (avgSentiment < -0.3) {
      report.emotionalState = 'negative';
      report.initialMood = 'annoyed';
    } else {
      report.emotionalState = 'neutral';
      report.initialMood = 'neutral';
    }

    // 3. Any ongoing drama/conflicts?
    if (this.chatBot.grudgeSystem) {
      const activeGrudges = this.chatBot.grudgeSystem.getActiveGrudges();
      if (activeGrudges.length > 0) {
        report.unfinishedBusiness.push({
          type: 'grudges',
          count: activeGrudges.length,
          details: activeGrudges.slice(0, 3).map(g => `${g.target} (${g.severity})`)
        });
      }
    }

    // 4. Recent obsessions/fixations
    if (this.chatBot.obsessionSystem) {
      const obsessionStats = this.chatBot.obsessionSystem.getStats();
      const obsessionTopics = obsessionStats.active || [];
      if (obsessionTopics.length > 0) {
        report.unfinishedBusiness.push({
          type: 'obsessions',
          topics: obsessionTopics.slice(0, 3)
        });
      }
    }

    // 5. Community events from last session
    if (this.chatBot.communityEvents) {
      const recentEvents = this.chatBot.communityEvents.getRecentEvents(5);
      report.recentEvents = recentEvents.map(e => ({
        type: e.type,
        description: e.description || e.type,
        timestamp: e.timestamp
      }));
    }

    // 6. Last conversation topics
    const recentTopics = new Map();
    recentHistory.forEach(msg => {
      if (msg.topics) {
        msg.topics.forEach(topic => {
          const count = recentTopics.get(topic) || 0;
          recentTopics.set(topic, count + 1);
        });
      }
    });
    
    const topTopics = Array.from(recentTopics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    // Generate contextual summary
    report.contextSummary = this.generateContextSummary(report, topUsers, topTopics, avgSentiment);
    
    // Store report
    this.continuityReport = report;
    
    // Log the analysis
    this.logContinuityReport(report);
    
    // Set initial emotional state
    if (this.chatBot.moodTracker) {
      this.chatBot.moodTracker.setMood(report.initialMood);
    }

    return report;
  }

  /**
   * Generate human-readable context summary
   */
  generateContextSummary(report, topUsers, topTopics, avgSentiment) {
    const parts = [];
    
    // Time gap
    const hours = Math.floor(report.timeSinceLastSession / 1000 / 60 / 60);
    const minutes = Math.floor((report.timeSinceLastSession / 1000 / 60) % 60);
    
    if (hours > 0) {
      parts.push(`Been offline for ${hours}h ${minutes}m`);
    } else if (minutes > 0) {
      parts.push(`Been offline for ${minutes} minutes`);
    } else {
      parts.push(`Just restarted`);
    }

    // Who was active
    if (topUsers.length > 0) {
      const userList = topUsers.map(u => u.user).slice(0, 3).join(', ');
      parts.push(`Was talking with ${userList}`);
    }

    // Mood
    if (avgSentiment > 0.3) {
      parts.push(`Vibes were good`);
    } else if (avgSentiment < -0.3) {
      parts.push(`Chat was kinda tense`);
    }

    // Topics
    if (topTopics.length > 0) {
      parts.push(`Topics: ${topTopics.slice(0, 3).join(', ')}`);
    }

    // Unfinished business
    if (report.unfinishedBusiness.length > 0) {
      const grudges = report.unfinishedBusiness.find(b => b.type === 'grudges');
      if (grudges) {
        parts.push(`Still got ${grudges.count} active grudge${grudges.count > 1 ? 's' : ''}`);
      }
      
      const obsessions = report.unfinishedBusiness.find(b => b.type === 'obsessions');
      if (obsessions) {
        parts.push(`Still fixated on ${obsessions.topics[0]}`);
      }
    }

    // Recent events
    if (report.recentEvents.length > 0) {
      const event = report.recentEvents[0];
      parts.push(`Last event: ${event.description}`);
    }

    return parts.join('. ');
  }

  /**
   * Log continuity report to console
   */
  logContinuityReport(report) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧠 STARTUP CONTINUITY ANALYSIS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    
    // Time gap
    const hours = Math.floor(report.timeSinceLastSession / 1000 / 60 / 60);
    const minutes = Math.floor((report.timeSinceLastSession / 1000 / 60) % 60);
    console.log(`⏰ Last Session: ${report.lastSessionEnd || 'Unknown'}`);
    console.log(`⏱️  Time Offline: ${hours}h ${minutes}m`);
    console.log('');

    // Who was I talking to
    if (report.activeRelationships.length > 0) {
      console.log('👥 Recent Conversations:');
      report.activeRelationships.forEach(({ user, messages }) => {
        const profile = this.chatBot.userProfiles.get(user);
        const friendship = profile?.friendshipLevel || 0;
        console.log(`   - ${user}: ${messages} messages (friendship: ${friendship}/100)`);
      });
      console.log('');
    }

    // Emotional state
    const moodEmoji = {
      positive: '😊',
      neutral: '😐',
      negative: '😠'
    };
    console.log(`${moodEmoji[report.emotionalState]} Emotional State: ${report.emotionalState}`);
    console.log(`🎭 Initial Mood: ${report.initialMood}`);
    console.log('');

    // Unfinished business
    if (report.unfinishedBusiness.length > 0) {
      console.log('📋 Unfinished Business:');
      report.unfinishedBusiness.forEach(business => {
        if (business.type === 'grudges') {
          console.log(`   💢 Active Grudges: ${business.count}`);
          business.details.forEach(detail => {
            console.log(`      - ${detail}`);
          });
        }
        if (business.type === 'obsessions') {
          console.log(`   🔍 Current Obsessions: ${business.topics.join(', ')}`);
        }
      });
      console.log('');
    }

    // Recent events
    if (report.recentEvents.length > 0) {
      console.log('🎉 Recent Community Events:');
      report.recentEvents.slice(0, 3).forEach(event => {
        const timeAgo = this.getTimeAgo(event.timestamp);
        console.log(`   - ${event.type}: ${event.description} (${timeAgo})`);
      });
      console.log('');
    }

    // Context summary
    console.log('📝 Context Summary:');
    console.log(`   ${report.contextSummary}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * Get time ago string
   */
  getTimeAgo(timestamp) {
    const minutes = Math.floor((Date.now() - timestamp) / 1000 / 60);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  }

  /**
   * Get context for AI (adds continuity awareness to first few responses)
   */
  getStartupContext(messageCount) {
    // Only provide startup context for first 5 messages
    if (!this.continuityReport || messageCount > 5) return '';

    const report = this.continuityReport;
    
    return `\n🧠 STARTUP CONTINUITY
Just came back online after ${Math.floor(report.timeSinceLastSession / 1000 / 60)} minutes.

Last Session Summary:
${report.contextSummary}

- Acknowledge continuity naturally if relevant
- Reference recent conversations/events if appropriate
- Don't force it - only if context fits
- "oh hey, back online" or "was just thinking about [topic]"
`;
  }

  /**
   * Should make a "back online" comment?
   */
  shouldAnnounceReturn() {
    if (!this.continuityReport) return false;
    
    const hours = Math.floor(this.continuityReport.timeSinceLastSession / 1000 / 60 / 60);
    
    // If been offline for 1+ hours, maybe announce return (30% chance)
    if (hours >= 1 && Math.random() < 0.3) {
      return true;
    }
    
    return false;
  }

  /**
   * Get "back online" message
   */
  getReturnMessage() {
    if (!this.continuityReport) return 'yo back online';
    
    const hours = Math.floor(this.continuityReport.timeSinceLastSession / 1000 / 60 / 60);
    const report = this.continuityReport;
    
    const messages = [
      `back after ${hours}h, what'd i miss`,
      `yo been offline for ${hours} hours`,
      `alright i'm back, catch me up`,
      `back online, anything happen while i was gone?`
    ];

    // Add context-specific messages
    if (report.unfinishedBusiness.length > 0) {
      const grudges = report.unfinishedBusiness.find(b => b.type === 'grudges');
      if (grudges && grudges.count > 0) {
        messages.push(`back online and i still remember everything`);
      }
    }

    if (report.activeRelationships.length > 0) {
      const topUser = report.activeRelationships[0].user;
      messages.push(`yo ${topUser} you still around?`);
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      hasReport: !!this.continuityReport,
      lastAnalysis: this.continuityReport?.timestamp,
      timeSinceLastSession: this.continuityReport?.timeSinceLastSession,
      emotionalState: this.continuityReport?.emotionalState,
      activeRelationships: this.continuityReport?.activeRelationships?.length || 0,
      unfinishedBusiness: this.continuityReport?.unfinishedBusiness?.length || 0,
      recentEvents: this.continuityReport?.recentEvents?.length || 0
    };
  }
}

module.exports = StartupContinuity;
