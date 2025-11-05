/**
 * Unified Presence System
 * Makes Slunt aware of conversations across ALL platforms simultaneously
 * Focuses on hottest conversation, maintains cross-platform context
 */

class UnifiedPresence {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Track conversation heat across all platforms
    this.platformActivity = {
      voice: { heat: 0, lastMessage: 0, recentMessages: [], participants: new Set() },
      coolhole: { heat: 0, lastMessage: 0, recentMessages: [], participants: new Set() },
      discord: { heat: 0, lastMessage: 0, recentMessages: [], participants: new Set() },
      twitch: { heat: 0, lastMessage: 0, recentMessages: [], participants: new Set() }
    };
    
    // Unified conversation memory - ALL platforms
    this.unifiedMemory = [];
    this.MAX_UNIFIED_MEMORY = 30; // Last 30 messages across ALL platforms
    
    // Heat decay interval
    setInterval(() => this.decayHeat(), 10000); // Every 10 seconds
    
    console.log('🌐 [UnifiedPresence] Slunt is now aware across all platforms');
  }
  
  /**
   * Track message from any platform
   */
  trackMessage(platform, username, text, data = {}) {
    const activity = this.platformActivity[platform];
    if (!activity) return;
    
    const now = Date.now();
    
    // Add to platform-specific tracking
    activity.lastMessage = now;
    activity.participants.add(username);
    activity.recentMessages.push({
      platform,
      username,
      text,
      timestamp: now,
      mentioned: data.mentionedBot || text.toLowerCase().includes('slunt')
    });
    
    // Keep last 10 messages per platform
    if (activity.recentMessages.length > 10) {
      activity.recentMessages.shift();
    }
    
    // Add to unified memory (cross-platform awareness)
    this.unifiedMemory.push({
      platform,
      username,
      text,
      timestamp: now,
      mentioned: data.mentionedBot || text.toLowerCase().includes('slunt')
    });
    
    // Keep unified memory limited
    if (this.unifiedMemory.length > this.MAX_UNIFIED_MEMORY) {
      this.unifiedMemory.shift();
    }
    
    // Calculate heat score
    this.updateHeat(platform);
    
    console.log(`🌐 [UnifiedPresence] ${platform}: ${this.getHeatEmoji(activity.heat)} ${activity.heat.toFixed(0)} heat`);
  }
  
  /**
   * Update conversation heat for a platform
   */
  updateHeat(platform) {
    const activity = this.platformActivity[platform];
    const now = Date.now();
    
    // Messages in last 2 minutes
    const recentCount = activity.recentMessages.filter(m => 
      now - m.timestamp < 120000
    ).length;
    
    // Mentions add extra heat
    const mentionCount = activity.recentMessages.filter(m => 
      m.mentioned && now - m.timestamp < 120000
    ).length;
    
    // Unique participants add heat
    const uniqueParticipants = new Set(
      activity.recentMessages
        .filter(m => now - m.timestamp < 120000)
        .map(m => m.username)
    ).size;
    
    // Calculate heat (0-100)
    let heat = 0;
    heat += recentCount * 5; // Each message = 5 heat
    heat += mentionCount * 15; // Mentions = 15 extra heat
    heat += uniqueParticipants * 10; // Each participant = 10 heat
    
    // Recency bonus
    const timeSinceLastMessage = now - activity.lastMessage;
    if (timeSinceLastMessage < 30000) {
      heat += 20; // Very recent = +20 heat
    } else if (timeSinceLastMessage < 60000) {
      heat += 10; // Recent = +10 heat
    }
    
    activity.heat = Math.min(heat, 100);
  }
  
  /**
   * Decay heat over time
   */
  decayHeat() {
    for (const platform in this.platformActivity) {
      const activity = this.platformActivity[platform];
      
      // Decay 5% every 10 seconds
      activity.heat = Math.max(0, activity.heat * 0.95);
      
      // Clear old participants
      const now = Date.now();
      const activeUsernames = new Set(
        activity.recentMessages
          .filter(m => now - m.timestamp < 300000) // Last 5 minutes
          .map(m => m.username)
      );
      activity.participants = activeUsernames;
    }
  }
  
  /**
   * Get hottest platform
   */
  getHottestPlatform() {
    let hottest = { platform: 'coolhole', heat: 0 };
    
    for (const platform in this.platformActivity) {
      const activity = this.platformActivity[platform];
      if (activity.heat > hottest.heat) {
        hottest = { platform, heat: activity.heat };
      }
    }
    
    return hottest;
  }
  
  /**
   * Should respond to this platform?
   * Considers: heat, voice mode, mentions, conversation flow
   */
  shouldRespondToPlatform(platform, data = {}) {
    const activity = this.platformActivity[platform];
    const hottest = this.getHottestPlatform();
    const voiceMode = this.chatBot.voiceFocusMode;
    
    // Voice mode: ~5% presence on other platforms (busy on call)
    if (voiceMode && platform !== 'voice') {
      // Always respond if mentioned by name
      if (data.mentionedBot || data.text?.toLowerCase().includes('slunt')) {
        console.log(`🎤 [UnifiedPresence] Voice mode but mentioned on ${platform} - responding`);
        return { respond: true, reason: 'mentioned_during_voice', priority: 'high' };
      }
      
      // Very rare engagement: 5% chance on extremely hot conversations only
      if (activity.heat > 50 && Math.random() < 0.05) {
        console.log(`🎤 [UnifiedPresence] Voice mode but ${platform} is VERY hot (${activity.heat}) - rare brief response`);
        return { respond: true, reason: 'hot_platform_during_voice', priority: 'low', brief: true };
      }
      
      console.log(`🎤 [UnifiedPresence] Voice mode - ignoring ${platform} (busy on voice call, ${activity.heat} heat)`);
      return { respond: false, reason: 'voice_focus' };
    }
    
    // Normal mode: Focus on hottest platform
    const heatDifference = hottest.heat - activity.heat;
    
    // Always respond if mentioned
    if (data.mentionedBot || data.text?.toLowerCase().includes('slunt')) {
      return { respond: true, reason: 'mentioned', priority: 'high' };
    }
    
    // This is the hottest platform
    if (platform === hottest.platform) {
      // High engagement on hot platform
      if (activity.heat > 40) {
        return { respond: true, reason: 'hottest_platform', priority: 'high' };
      }
      // Moderate engagement
      if (activity.heat > 20) {
        return { respond: Math.random() < 0.6, reason: 'moderate_heat', priority: 'medium' };
      }
      // Low heat but still hottest
      return { respond: Math.random() < 0.3, reason: 'low_heat', priority: 'low' };
    }
    
    // Not the hottest platform
    // Only respond if heat is close to hottest OR very hot
    if (activity.heat > 50 || (activity.heat > 30 && heatDifference < 15)) {
      return { respond: Math.random() < 0.4, reason: 'competing_heat', priority: 'medium' };
    }
    
    // Cold platform - rare engagement
    if (activity.heat > 10) {
      return { respond: Math.random() < 0.1, reason: 'cold_platform', priority: 'low' };
    }
    
    return { respond: false, reason: 'too_cold' };
  }
  
  /**
   * Get conversation context from ALL platforms
   */
  getUnifiedContext() {
    const recent = this.unifiedMemory.slice(-15); // Last 15 messages across ALL platforms
    
    if (recent.length === 0) return '';
    
    let context = 'Recent activity across all platforms:\n';
    
    for (const msg of recent) {
      const platformEmoji = this.getPlatformEmoji(msg.platform);
      context += `${platformEmoji} [${msg.platform}] ${msg.username}: ${msg.text}\n`;
    }
    
    // Add heat summary
    const hottest = this.getHottestPlatform();
    context += `\n🔥 Hottest: ${hottest.platform} (${hottest.heat.toFixed(0)} heat)`;
    
    return context;
  }
  
  /**
   * Get context for AI about cross-platform conversations
   */
  getCrossplatformContext(currentPlatform) {
    const context = [];
    
    // What's happening on other platforms
    for (const platform in this.platformActivity) {
      if (platform === currentPlatform) continue;
      
      const activity = this.platformActivity[platform];
      if (activity.heat > 20 && activity.recentMessages.length > 0) {
        const lastMsg = activity.recentMessages[activity.recentMessages.length - 1];
        context.push(`[Also on ${platform}]: ${lastMsg.username} said "${lastMsg.text}"`);
      }
    }
    
    return context.length > 0 ? context.join('\n') : '';
  }
  
  /**
   * Visual helpers
   */
  getHeatEmoji(heat) {
    if (heat > 70) return '🔥🔥🔥';
    if (heat > 40) return '🔥🔥';
    if (heat > 20) return '🔥';
    if (heat > 10) return '💨';
    return '💤';
  }
  
  getPlatformEmoji(platform) {
    const emojis = {
      voice: '🎤',
      coolhole: '🌐',
      discord: '💬',
      twitch: '📺'
    };
    return emojis[platform] || '💭';
  }
  
  /**
   * Get status for dashboard
   */
  getStatus() {
    const status = {};
    
    for (const platform in this.platformActivity) {
      const activity = this.platformActivity[platform];
      status[platform] = {
        heat: activity.heat,
        participants: activity.participants.size,
        recentMessages: activity.recentMessages.length,
        emoji: this.getHeatEmoji(activity.heat)
      };
    }
    
    status.hottest = this.getHottestPlatform();
    status.voiceMode = this.chatBot.voiceFocusMode;
    
    return status;
  }
}

module.exports = UnifiedPresence;
