/**
 * Community Events Detection System
 * Detects birthdays, drama, memes, and major chat events
 */

class CommunityEvents {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.events = [];
    this.activeDrama = new Map(); // participants -> drama data
    this.emergingMemes = new Map(); // phrase -> usage count
    this.userMilestones = new Map(); // username -> milestones
    
    // Detection thresholds
    this.dramaThreshold = 5; // Messages in conflict
    this.memeThreshold = 5; // Repetitions to become meme
    this.massEventThreshold = 5; // Users joining/leaving quickly
  }

  /**
   * Detect birthday mentions
   */
  detectBirthday(username, message) {
    const birthdayPatterns = [
      /\b(birthday|bday|happy birthday|hbd)\b/i,
      /\b(born|age|years old|turning \d+)\b/i
    ];

    if (birthdayPatterns.some(p => p.test(message))) {
      this.recordEvent({
        type: 'birthday',
        user: username,
        timestamp: Date.now(),
        description: `${username}'s birthday mentioned`,
        importance: 'high'
      });
      console.log(`🎂 [Events] Birthday detected for ${username}`);
      return true;
    }
    return false;
  }

  /**
   * Detect drama escalation
   */
  detectDrama(user1, user2, message) {
    const dramaKey = [user1, user2].sort().join('-');
    
    const dramaPatterns = [
      /\b(fuck you|hate you|shut up|stfu)\b/i,
      /\b(stupid|idiot|dumb|moron)\b/i,
      /\b(wrong|bad take|cringe|cope)\b/i
    ];

    if (dramaPatterns.some(p => p.test(message))) {
      if (!this.activeDrama.has(dramaKey)) {
        this.activeDrama.set(dramaKey, {
          participants: [user1, user2],
          messages: [],
          startedAt: Date.now(),
          intensity: 0
        });
      }

      const drama = this.activeDrama.get(dramaKey);
      drama.messages.push({ user: user1, text: message, time: Date.now() });
      drama.intensity++;

      if (drama.intensity >= this.dramaThreshold) {
        this.recordEvent({
          type: 'drama',
          users: drama.participants,
          timestamp: Date.now(),
          description: `Drama between ${user1} and ${user2}`,
          intensity: drama.intensity,
          importance: 'high'
        });
        console.log(`🔥 [Events] DRAMA detected: ${user1} vs ${user2} (intensity: ${drama.intensity})`);
        return true;
      }
    }
    return false;
  }

  /**
   * Detect emerging memes/inside jokes
   */
  detectMeme(phrase) {
    const normalized = phrase.toLowerCase().trim();
    if (normalized.length < 3) return false;

    if (!this.emergingMemes.has(normalized)) {
      this.emergingMemes.set(normalized, {
        phrase: normalized,
        count: 0,
        firstSeen: Date.now(),
        users: new Set()
      });
    }

    const meme = this.emergingMemes.get(normalized);
    meme.count++;

    if (meme.count === this.memeThreshold) {
      this.recordEvent({
        type: 'meme',
        phrase: normalized,
        timestamp: Date.now(),
        description: `New meme: "${normalized}"`,
        usage: meme.count,
        importance: 'medium'
      });
      console.log(`😂 [Events] New meme detected: "${normalized}"`);
      return true;
    }
    return false;
  }

  /**
   * Detect mass user activity
   */
  detectMassActivity(type, users) {
    if (users.length >= this.massEventThreshold) {
      this.recordEvent({
        type: type === 'join' ? 'mass_join' : 'mass_exodus',
        users,
        timestamp: Date.now(),
        description: `${users.length} users ${type === 'join' ? 'joined' : 'left'} rapidly`,
        importance: 'medium'
      });
      console.log(`👥 [Events] Mass ${type}: ${users.length} users`);
      return true;
    }
    return false;
  }

  /**
   * Detect user milestones
   */
  detectMilestone(username, type, value) {
    const milestones = {
      messages: [100, 500, 1000, 5000],
      friendship: [25, 50, 75, 100],
      days: [7, 30, 90, 365]
    };

    if (!milestones[type]) return false;

    if (!this.userMilestones.has(username)) {
      this.userMilestones.set(username, new Set());
    }

    const reached = this.userMilestones.get(username);
    
    for (const threshold of milestones[type]) {
      const key = `${type}_${threshold}`;
      if (value >= threshold && !reached.has(key)) {
        reached.add(key);
        
        this.recordEvent({
          type: 'milestone',
          user: username,
          milestone: `${threshold} ${type}`,
          timestamp: Date.now(),
          description: `${username} reached ${threshold} ${type}`,
          importance: 'medium'
        });
        console.log(`🏆 [Events] Milestone: ${username} - ${threshold} ${type}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Record event
   */
  recordEvent(event) {
    event.id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.events.push(event);
    
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  /**
   * Get recent events
   */
  getRecentEvents(count = 10) {
    return this.events.slice(-count).reverse();
  }

  /**
   * Get events by type
   */
  getEventsByType(type) {
    return this.events.filter(e => e.type === type);
  }

  /**
   * Should comment on event?
   */
  shouldCommentOnEvent() {
    const recentEvents = this.getRecentEvents(1);
    if (recentEvents.length === 0) return null;

    const event = recentEvents[0];
    const timeSince = Date.now() - event.timestamp;

    // Comment on high importance events within 1 minute
    if (event.importance === 'high' && timeSince < 60000) {
      return event;
    }

    return null;
  }

  /**
   * Get context for AI
   */
  getContext() {
    const recent = this.getRecentEvents(3);
    if (recent.length === 0) return '';

    const eventDescriptions = recent.map(e => {
      switch (e.type) {
        case 'birthday':
          return `🎂 ${e.user}'s birthday!`;
        case 'drama':
          return `🔥 Drama: ${e.users.join(' vs ')}`;
        case 'meme':
          return `😂 New meme: "${e.phrase}"`;
        case 'milestone':
          return `🏆 ${e.user} milestone: ${e.milestone}`;
        default:
          return e.description;
      }
    }).join(' | ');

    return `\n📅 Recent Events: ${eventDescriptions}`;
  }

  /**
   * Get stats
   */
  getStats() {
    const types = {};
    this.events.forEach(e => {
      types[e.type] = (types[e.type] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      activeDramas: this.activeDrama.size,
      emergingMemes: this.emergingMemes.size,
      eventTypes: types,
      recentEvents: this.getRecentEvents(5)
    };
  }

  /**
   * Save events
   */
  save() {
    return {
      events: this.events.slice(-100),
      activeDrama: Object.fromEntries(this.activeDrama),
      emergingMemes: Object.fromEntries(
        Array.from(this.emergingMemes.entries()).map(([k, v]) => [k, { ...v, users: Array.from(v.users) }])
      ),
      userMilestones: Object.fromEntries(
        Array.from(this.userMilestones.entries()).map(([k, v]) => [k, Array.from(v)])
      )
    };
  }

  /**
   * Load events
   */
  load(data) {
    if (data.events) {
      this.events = data.events;
      console.log(`📅 [Events] Restored ${this.events.length} events`);
    }
    if (data.activeDrama) {
      this.activeDrama = new Map(Object.entries(data.activeDrama));
    }
    if (data.emergingMemes) {
      this.emergingMemes = new Map(
        Object.entries(data.emergingMemes).map(([k, v]) => [k, { ...v, users: new Set(v.users) }])
      );
    }
    if (data.userMilestones) {
      this.userMilestones = new Map(
        Object.entries(data.userMilestones).map(([k, v]) => [k, new Set(v)])
      );
    }
  }
}

module.exports = CommunityEvents;
