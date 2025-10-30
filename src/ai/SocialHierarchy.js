/**
 * SocialHierarchy.js
 * Tracks power dynamics, influence, and social roles in chat
 */

class SocialHierarchy {
  constructor() {
    this.users = new Map();
    this.alliances = new Map();
    this.rivalries = new Map();
    this.chatLeaders = [];
    this.courtJesters = [];
    this.hierarchyHistory = [];
  }
  
  /**
   * Track a user's social metrics
   */
  trackUser(username, action, context = {}) {
    if (!this.users.has(username)) {
      this.users.set(username, {
        username,
        influence: 50, // 0-100
        respect: 50, // 0-100
        jokeSuccessRate: 0,
        jokeAttempts: 0,
        jokeHits: 0,
        topicsInitiated: 0,
        topicsFollowed: 0,
        agreementReceived: 0,
        disagreementReceived: 0,
        chatDirection: 0, // how much they steer conversation
        role: 'member', // leader, jester, member, lurker
        powerLevel: 50,
        sluntRelationship: 'neutral' // respected, neutral, dismissed
      });
    }
    
    const user = this.users.get(username);
    
    switch (action) {
      case 'message':
        this.updateEngagement(user);
        break;
      case 'joke':
        this.trackJoke(user, context.success);
        break;
      case 'topic_change':
        this.trackTopicInitiation(user, context.followed);
        break;
      case 'agreement':
        user.agreementReceived++;
        user.influence += 0.5;
        break;
      case 'disagreement':
        user.disagreementReceived++;
        user.influence -= 0.3;
        break;
    }
    
    this.calculatePowerLevel(user);
    this.determineRole(user);
    this.determineSluntRelationship(user);
    
    return user;
  }
  
  /**
   * Update user engagement metrics
   */
  updateEngagement(user) {
    // Just messaging increases influence slightly
    user.influence = Math.min(100, user.influence + 0.1);
  }
  
  /**
   * Track joke attempts and success
   */
  trackJoke(user, success) {
    user.jokeAttempts++;
    if (success) {
      user.jokeHits++;
      user.influence += 2;
      user.respect += 1;
    } else {
      user.influence -= 0.5;
    }
    user.jokeSuccessRate = (user.jokeHits / user.jokeAttempts) * 100;
  }
  
  /**
   * Track topic initiation
   */
  trackTopicInitiation(user, followed) {
    user.topicsInitiated++;
    if (followed) {
      user.topicsFollowed++;
      user.chatDirection += 5;
      user.influence += 3;
    } else {
      user.chatDirection -= 1;
    }
  }
  
  /**
   * Calculate overall power level
   */
  calculatePowerLevel(user) {
    // Weighted combination of metrics
    user.powerLevel = 
      (user.influence * 0.4) +
      (user.respect * 0.3) +
      (user.jokeSuccessRate * 0.15) +
      (Math.min(100, user.chatDirection) * 0.15);
    
    user.powerLevel = Math.max(0, Math.min(100, user.powerLevel));
  }
  
  /**
   * Determine user's social role
   */
  determineRole(user) {
    const oldRole = user.role;
    
    if (user.powerLevel > 75 && user.chatDirection > 20) {
      user.role = 'leader';
    } else if (user.jokeSuccessRate > 60 && user.jokeAttempts > 5) {
      user.role = 'jester';
    } else if (user.powerLevel < 30) {
      user.role = 'lurker';
    } else {
      user.role = 'member';
    }
    
    if (oldRole !== user.role) {
      console.log(`👑 [Hierarchy] ${user.username} role changed: ${oldRole} → ${user.role}`);
    }
  }
  
  /**
   * Determine Slunt's relationship with user
   */
  determineSluntRelationship(user) {
    const oldRelationship = user.sluntRelationship;
    
    if (user.powerLevel > 70 || user.respect > 65) {
      user.sluntRelationship = 'respected';
    } else if (user.powerLevel < 35 || user.jokeSuccessRate < 20) {
      user.sluntRelationship = 'dismissed';
    } else {
      user.sluntRelationship = 'neutral';
    }
    
    if (oldRelationship !== user.sluntRelationship) {
      console.log(`🤝 [Hierarchy] Slunt's view of ${user.username}: ${oldRelationship} → ${user.sluntRelationship}`);
    }
  }
  
  /**
   * Track alliance between users
   */
  trackAlliance(user1, user2, strength = 1) {
    const key = [user1, user2].sort().join('|');
    
    if (!this.alliances.has(key)) {
      this.alliances.set(key, {
        users: [user1, user2],
        strength: 0,
        interactions: 0
      });
    }
    
    const alliance = this.alliances.get(key);
    alliance.strength = Math.min(100, alliance.strength + strength);
    alliance.interactions++;
    
    if (alliance.strength > 50 && alliance.interactions > 10) {
      console.log(`🤝 [Hierarchy] Strong alliance detected: ${user1} ↔ ${user2}`);
    }
  }
  
  /**
   * Track rivalry between users
   */
  trackRivalry(user1, user2, intensity = 1) {
    const key = [user1, user2].sort().join('|');
    
    if (!this.rivalries.has(key)) {
      this.rivalries.set(key, {
        users: [user1, user2],
        intensity: 0,
        conflicts: 0
      });
    }
    
    const rivalry = this.rivalries.get(key);
    rivalry.intensity = Math.min(100, rivalry.intensity + intensity);
    rivalry.conflicts++;
    
    if (rivalry.intensity > 40) {
      console.log(`⚔️ [Hierarchy] Rivalry detected: ${user1} ⚔️ ${user2}`);
    }
  }
  
  /**
   * Detect interaction type between users
   */
  analyzeInteraction(user1, user2, message) {
    const lowerText = message.toLowerCase();
    
    // Check for agreement (alliance building)
    const agreementWords = ['yeah', 'true', 'exactly', 'agree', 'based', 'real', 'fr'];
    const hasAgreement = agreementWords.some(word => lowerText.includes(word));
    
    if (hasAgreement) {
      this.trackAlliance(user1, user2, 2);
    }
    
    // Check for disagreement (rivalry building)
    const disagreementWords = ['nah', 'wrong', 'bad take', 'cope', 'cringe', 'mid', 'disagree'];
    const hasDisagreement = disagreementWords.some(word => lowerText.includes(word));
    
    if (hasDisagreement) {
      this.trackRivalry(user1, user2, 3);
    }
  }
  
  /**
   * Get current chat leaders
   */
  getChatLeaders() {
    const sorted = Array.from(this.users.values())
      .filter(u => u.role === 'leader')
      .sort((a, b) => b.powerLevel - a.powerLevel);
    
    return sorted.slice(0, 3);
  }
  
  /**
   * Get court jesters
   */
  getCourtJesters() {
    const sorted = Array.from(this.users.values())
      .filter(u => u.role === 'jester')
      .sort((a, b) => b.jokeSuccessRate - a.jokeSuccessRate);
    
    return sorted.slice(0, 3);
  }
  
  /**
   * Get top alliances
   */
  getTopAlliances() {
    return Array.from(this.alliances.values())
      .filter(a => a.strength > 30)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5);
  }
  
  /**
   * Get active rivalries
   */
  getActiveRivalries() {
    return Array.from(this.rivalries.values())
      .filter(r => r.intensity > 20)
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 5);
  }
  
  /**
   * Get Slunt's respected/dismissed lists
   */
  getSluntOpinions() {
    const respected = Array.from(this.users.values())
      .filter(u => u.sluntRelationship === 'respected')
      .sort((a, b) => b.powerLevel - a.powerLevel);
    
    const dismissed = Array.from(this.users.values())
      .filter(u => u.sluntRelationship === 'dismissed')
      .sort((a, b) => a.powerLevel - b.powerLevel);
    
    return { respected, dismissed };
  }
  
  /**
   * Modify response based on social hierarchy
   */
  adjustTone(response, targetUser) {
    if (!this.users.has(targetUser)) {
      return response;
    }
    
    const user = this.users.get(targetUser);
    let modified = response;
    
    switch (user.sluntRelationship) {
      case 'respected':
        // More thoughtful, agreeable
        if (Math.random() < 0.3) {
          const respectPrefixes = ['you right', 'good point', 'yeah actually', 'fair'];
          const prefix = respectPrefixes[Math.floor(Math.random() * respectPrefixes.length)];
          modified = `${prefix}. ${modified}`;
        }
        break;
        
      case 'dismissed':
        // More dismissive, snarky
        if (Math.random() < 0.3) {
          const dismissPrefixes = ['okay sure', 'if you say so', 'whatever', 'mhm'];
          const prefix = dismissPrefixes[Math.floor(Math.random() * dismissPrefixes.length)];
          modified = `${prefix}. ${modified}`;
        }
        break;
    }
    
    return modified;
  }
  
  /**
   * Get status for dashboard
   */
  getStatus() {
    return {
      totalUsers: this.users.size,
      leaders: this.getChatLeaders().map(u => ({
        username: u.username,
        powerLevel: Math.round(u.powerLevel),
        influence: Math.round(u.influence)
      })),
      jesters: this.getCourtJesters().map(u => ({
        username: u.username,
        successRate: Math.round(u.jokeSuccessRate)
      })),
      topAlliances: this.getTopAlliances().map(a => ({
        users: a.users,
        strength: Math.round(a.strength)
      })),
      rivalries: this.getActiveRivalries().map(r => ({
        users: r.users,
        intensity: Math.round(r.intensity)
      })),
      sluntOpinions: {
        respected: this.getSluntOpinions().respected.map(u => u.username),
        dismissed: this.getSluntOpinions().dismissed.map(u => u.username)
      }
    };
  }
}

module.exports = SocialHierarchy;
