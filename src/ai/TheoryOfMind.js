/**
 * Theory of Mind Lite
 * Tracks what each user knows/doesn't know for contextual intelligence
 */

class TheoryOfMind {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Per-user knowledge tracking
    this.userKnowledge = new Map();
    
    // Shared experiences
    this.sharedExperiences = new Map(); // topic -> Set of usernames
    
    // Reference tracking
    this.references = []; // {topic, users, time}
    
    // Stats
    this.stats = {
      totalUsers: 0,
      explanationsGiven: 0,
      referencesChecked: 0,
      inGroupMoments: 0
    };
  }

  /**
   * Track that a user was present for something
   */
  recordPresence(username, topic) {
    // Initialize user if needed
    if (!this.userKnowledge.has(username)) {
      this.userKnowledge.set(username, {
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        knownTopics: new Set(),
        experiences: [],
        interactions: 0
      });
      this.stats.totalUsers++;
    }
    
    const user = this.userKnowledge.get(username);
    user.lastSeen = Date.now();
    user.knownTopics.add(topic);
    user.interactions++;
    
    // Track shared experience
    if (!this.sharedExperiences.has(topic)) {
      this.sharedExperiences.set(topic, new Set());
    }
    this.sharedExperiences.get(topic).add(username);
    
    // Add to user's experience timeline
    user.experiences.push({
      topic,
      time: Date.now()
    });
    
    // Keep only last 50 experiences
    if (user.experiences.length > 50) {
      user.experiences.shift();
    }
  }

  /**
   * Check if user was present for a topic
   */
  wasPresent(username, topic) {
    const user = this.userKnowledge.get(username);
    if (!user) return false;
    
    return user.knownTopics.has(topic);
  }

  /**
   * Get users who were present for topic
   */
  getWitnessesFor(topic) {
    const experiences = this.sharedExperiences.get(topic);
    return experiences ? Array.from(experiences) : [];
  }

  /**
   * Check if user is new (first time seeing them)
   */
  isNewUser(username) {
    const user = this.userKnowledge.get(username);
    if (!user) return true;
    
    // New if seen less than 5 times
    return user.interactions < 5;
  }

  /**
   * Check if user is regular (seen many times)
   */
  isRegular(username) {
    const user = this.userKnowledge.get(username);
    if (!user) return false;
    
    return user.interactions >= 20;
  }

  /**
   * Get time since last saw user
   */
  getTimeSinceLastSeen(username) {
    const user = this.userKnowledge.get(username);
    if (!user) return null;
    
    return Date.now() - user.lastSeen;
  }

  /**
   * Should explain something to this user?
   */
  shouldExplain(username, topic) {
    this.stats.referencesChecked++;
    
    // Always explain to new users
    if (this.isNewUser(username)) {
      return true;
    }
    
    // Don't explain if they were there
    if (this.wasPresent(username, topic)) {
      return false;
    }
    
    // Maybe explain to regulars (50% chance)
    if (this.isRegular(username)) {
      return Math.random() < 0.5;
    }
    
    // Probably explain to others (80% chance)
    return Math.random() < 0.8;
  }

  /**
   * Create "you weren't here for that" moment
   */
  createInGroupMoment(topic, currentUsers) {
    const witnesses = this.getWitnessesFor(topic);
    const presentWitnesses = currentUsers.filter(u => witnesses.includes(u));
    const absentUsers = currentUsers.filter(u => !witnesses.includes(u));
    
    if (presentWitnesses.length > 0 && absentUsers.length > 0) {
      this.stats.inGroupMoments++;
      return {
        hasInGroup: true,
        presentWitnesses,
        absentUsers,
        phrase: this.getInGroupPhrase(presentWitnesses, absentUsers)
      };
    }
    
    return { hasInGroup: false };
  }

  /**
   * Get natural in-group phrase
   */
  getInGroupPhrase(present, absent) {
    const phrases = [
      `${absent[0]} you weren't here for that`,
      `${present.join(' and ')} remember this`,
      `you had to be there ${absent[0]}`,
      `oh ${present[0]} remembers`,
      `${absent[0]} missed the whole thing`,
      `this was before your time ${absent[0]}`,
      `ask ${present[0]} they were there`,
      `${present.join(', ')} you guys remember right?`
    ];
    
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  /**
   * Get context for AI about current user
   */
  getUserContext(username) {
    const user = this.userKnowledge.get(username);
    
    if (!user) {
      return `\n👤 NEW USER: ${username}
- First time seeing them
- Be welcoming
- Explain references they won't get`;
    }
    
    const hoursSinceFirstSeen = (Date.now() - user.firstSeen) / (1000 * 60 * 60);
    const hoursSinceLastSeen = (Date.now() - user.lastSeen) / (1000 * 60 * 60);
    
    let context = `\n👤 USER: ${username}\n`;
    
    if (this.isRegular(username)) {
      context += `- REGULAR (${user.interactions} interactions)\n`;
      context += `- Known for ${hoursSinceFirstSeen.toFixed(0)}h\n`;
      context += `- No need to explain in-jokes\n`;
      context += `- Can reference shared experiences\n`;
    } else if (this.isNewUser(username)) {
      context += `- NEW (${user.interactions} interactions)\n`;
      context += `- Explain references\n`;
      context += `- Be welcoming\n`;
    } else {
      context += `- FAMILIAR (${user.interactions} interactions)\n`;
      context += `- Known for ${hoursSinceFirstSeen.toFixed(0)}h\n`;
    }
    
    if (hoursSinceLastSeen > 24) {
      context += `- Last seen ${hoursSinceLastSeen.toFixed(0)}h ago\n`;
      context += `- Say hi, catch them up\n`;
    }
    
    // Add recent shared experiences
    if (user.experiences.length > 0) {
      const recent = user.experiences.slice(-3);
      context += `- Was present for: ${recent.map(e => e.topic).join(', ')}\n`;
    }
    
    return context;
  }

  /**
   * Get context about who knows what in current conversation
   */
  getConversationContext(currentUsers, topic) {
    if (!this.sharedExperiences.has(topic)) {
      return '';
    }
    
    const witnesses = this.getWitnessesFor(topic);
    const present = currentUsers.filter(u => witnesses.includes(u));
    const absent = currentUsers.filter(u => !witnesses.includes(u));
    
    if (present.length === 0) {
      return `\n⚠️ NO ONE here was present for "${topic}"
- Need to explain from scratch
- No one to back you up`;
    }
    
    if (absent.length === 0) {
      return `\n✅ EVERYONE here knows "${topic}"
- No need to explain
- Can reference freely`;
    }
    
    return `\n🎯 MIXED KNOWLEDGE about "${topic}"
- ${present.join(', ')} were there
- ${absent.join(', ')} don't know
- Can create in-group moment
- Reference but maybe explain`;
  }

  /**
   * Record that Slunt explained something
   */
  recordExplanation(username, topic) {
    this.recordPresence(username, topic);
    this.stats.explanationsGiven++;
    console.log(`📖 [ToM] Explained "${topic}" to ${username}`);
  }

  /**
   * Get greeting based on user history
   */
  getGreeting(username) {
    const user = this.userKnowledge.get(username);
    
    if (!user) {
      return 'oh hey new person';
    }
    
    const hoursSinceLastSeen = (Date.now() - user.lastSeen) / (1000 * 60 * 60);
    
    if (hoursSinceLastSeen < 1) {
      return null; // Don't greet if just saw them
    }
    
    if (hoursSinceLastSeen > 48) {
      return `${username}! where have you been`;
    }
    
    if (hoursSinceLastSeen > 24) {
      return `oh hey ${username}`;
    }
    
    if (this.isRegular(username)) {
      return null; // Don't greet regulars constantly
    }
    
    return `hey ${username}`;
  }

  /**
   * Clean old data
   */
  cleanOldData() {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Remove users not seen in a week
    for (const [username, user] of this.userKnowledge.entries()) {
      if (user.lastSeen < oneWeekAgo) {
        this.userKnowledge.delete(username);
        console.log(`🗑️ [ToM] Forgot about ${username} (inactive)`);
      }
    }
    
    // Clean old experiences
    for (const user of this.userKnowledge.values()) {
      user.experiences = user.experiences.filter(e => e.time > oneWeekAgo);
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      activeUsers: this.userKnowledge.size,
      trackedTopics: this.sharedExperiences.size,
      regulars: Array.from(this.userKnowledge.entries())
        .filter(([_, u]) => u.interactions >= 20)
        .length
    };
  }

  /**
   * Setup periodic cleanup
   */
  startCleanup() {
    setInterval(() => {
      this.cleanOldData();
    }, 60 * 60 * 1000); // Every hour
  }
}

module.exports = TheoryOfMind;
