/**
 * SOCIAL SYNTHESIZER
 * 
 * Aggregates all relationship/social systems:
 * - Grudges
 * - Relationship evolution
 * - Parasocial attachments
 * - Negging detection
 * - Social battery
 * - Ghosting mechanics
 * 
 * Provides: How Slunt relates to each user and social energy
 */

class SocialSynthesizer {
  constructor(chatBot) {
    this.bot = chatBot;
    this.cache = null;
    this.lastUpdate = 0;
    this.updateInterval = 45000; // Update every 45s
    
    this.startLoop();
  }
  
  startLoop() {
    this.timer = setInterval(() => {
      this.synthesize();
    }, this.updateInterval);
  }
  
  shutdown() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
  
  /**
   * Synthesize social state
   */
  synthesize() {
    const now = Date.now();
    
    const social = {
      // Social resources
      socialBattery: this.clamp(
        this.bot.autonomousLife?.getLifeContext()?.socialBattery || 100,
        0, 100
      ),
      
      // Relationships
      activeGrudges: this.bot.grudgeSystem?.getActiveGrudges() || [],
      tensions: this.extractTensions(),
      attachments: (this.bot.parasocialSystem?.getAttachments() || []).slice(0, 5),
      
      // Social dynamics
      ghostedUsers: this.bot.ghostingMechanic?.getGhostedUsers?.() || [],
      neggers: this.bot.neggingDetector?.getActiveNeggers?.() || [],
      recentInteractions: this.bot.relationshipEvolution?.getRecentChanges?.() || [],
      
      timestamp: now
    };
    
    this.cache = social;
    this.lastUpdate = now;
    
    return social;
  }
  
  /**
   * Get social context for specific user
   */
  getContextForUser(username, detailLevel = 'normal') {
    if (!this.cache || Date.now() - this.lastUpdate > 60000) {
      this.synthesize();
    }
    
    const s = this.cache;
    const parts = [];
    
    // Check relationship status with THIS user
    const hasTension = s.tensions.includes(username);
    const hasGrudge = s.activeGrudges.some(g => g.target === username);
    const isAttached = s.attachments.some(a => a.user === username);
    const isGhosted = s.ghostedUsers.includes(username);
    const isNegger = s.neggers.includes(username);
    
    if (detailLevel === 'brief') {
      if (hasTension) return `⚠️ Tense with ${username}`;
      if (isAttached) return `💕 Attached to ${username}`;
      return null;
    }
    
    // Build context
    if (isGhosted) {
      parts.push(`🚫 Currently ghosting ${username} (boring/repetitive)`);
    }
    
    if (hasGrudge) {
      const grudge = s.activeGrudges.find(g => g.target === username);
      parts.push(`😠 Active grudge against ${username}: "${grudge.reason}"`);
    }
    
    if (hasTension) {
      parts.push(`⚠️ Relationship tension with ${username} - be cautious`);
    }
    
    if (isAttached) {
      const attachment = s.attachments.find(a => a.user === username);
      parts.push(`💕 Attached to ${username} (intensity: ${attachment.intensity})`);
      parts.push(`   → You care about their opinion more than others`);
    }
    
    if (isNegger) {
      parts.push(`🎯 ${username} has been negging you - detected backhanded compliments`);
    }
    
    return parts.length > 0 ? parts.join('\n') : null;
  }
  
  /**
   * Get general social context (not user-specific)
   */
  getGeneralContext(detailLevel = 'normal') {
    if (!this.cache) this.synthesize();
    
    const s = this.cache;
    
    if (detailLevel === 'brief') {
      return `Social battery: ${s.socialBattery}%`;
    }
    
    const parts = [
      `Social battery: ${s.socialBattery}%`
    ];
    
    if (s.socialBattery < 30) {
      parts.push(`→ Socially drained - want less interaction`);
    } else if (s.socialBattery > 80) {
      parts.push(`→ Socially energized - want more interaction`);
    }
    
    if (s.activeGrudges.length > 0) {
      parts.push(`Active grudges: ${s.activeGrudges.length} people`);
    }
    
    if (s.ghostedUsers.length > 0) {
      parts.push(`Currently ghosting: ${s.ghostedUsers.length} users`);
    }
    
    return parts.join('\n');
  }
  
  /**
   * Get social directives
   */
  getDirectives(username) {
    if (!this.cache) this.synthesize();
    
    const directives = [];
    const s = this.cache;
    
    // Social battery
    if (s.socialBattery < 30) {
      directives.push('shorter responses', 'less engagement', 'may ignore');
    } else if (s.socialBattery > 80) {
      directives.push('more willing to engage', 'start conversations');
    }
    
    // User-specific
    if (username) {
      if (s.ghostedUsers.includes(username)) {
        directives.push(`IGNORE ${username} completely`);
      }
      
      if (s.tensions.includes(username)) {
        directives.push(`avoid ${username}`, 'passive-aggressive ok');
      }
      
      if (s.attachments.some(a => a.user === username)) {
        directives.push(`pay extra attention to ${username}`, 'seek their validation');
      }
      
      if (s.activeGrudges.some(g => g.target === username)) {
        directives.push(`hostile toward ${username}`, 'bring up past slights');
      }
    }
    
    return directives;
  }
  
  // Helpers
  extractTensions() {
    const tensions = [];
    const grudges = this.bot.grudgeSystem?.getActiveGrudges() || [];
    const changes = this.bot.relationshipEvolution?.getRecentChanges?.() || [];
    
    grudges.forEach(g => {
      if (!tensions.includes(g.target)) tensions.push(g.target);
    });
    
    changes.forEach(c => {
      if (c.change < 0 && !tensions.includes(c.user)) {
        tensions.push(c.user);
      }
    });
    
    return tensions;
  }
  
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  
  /**
   * Get health status of this synthesizer
   */
  getHealth() {
    const now = Date.now();
    const cacheAge = this.cache ? now - this.lastUpdate : null;
    const isStale = cacheAge && cacheAge > 60000;
    
    return {
      name: 'SocialSynthesizer',
      isRunning: !!this.timer,
      lastSynthesis: this.lastUpdate,
      cacheAge,
      isStale,
      updateInterval: this.updateInterval,
      hasCache: !!this.cache
    };
  }
}

module.exports = SocialSynthesizer;
