/**
 * Proactive Friendship System
 * Makes Slunt reach out, check in, and actively build relationships
 */

class ProactiveFriendship {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.checkInInterval = null;
    this.lastCheckIns = new Map(); // username -> timestamp
    this.userEvents = new Map(); // username -> events array
    this.conversationStarters = [
      "hey {user}, been a minute! what you been up to?",
      "{user} haven't seen you in a bit, everything good?",
      "yo {user}, how's it going?",
      "{user}! miss seeing you around here",
      "what's good {user}? been thinking about our last convo",
      "{user} you still alive? lol",
      "hey {user}, remember when {memory}? good times"
    ];
  }

  /**
   * Start proactive friendship loop
   */
  start() {
    console.log('💝 [Proactive] Starting proactive friendship system...');
    
    // Check for users to reach out to every 10 minutes
    this.checkInInterval = setInterval(() => {
      this.checkForUsersToReachOut();
    }, 10 * 60 * 1000);

    // Also check immediately
    setTimeout(() => this.checkForUsersToReachOut(), 5000);
  }

  stop() {
    if (this.checkInInterval) {
      clearInterval(this.checkInInterval);
      this.checkInInterval = null;
    }
  }

  /**
   * Find users who haven't been active recently
   */
  async checkForUsersToReachOut() {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Get all users from memory
    const users = Array.from(this.chatBot.userProfiles.keys());
    
    for (const username of users) {
      const profile = this.chatBot.userProfiles.get(username);
      if (!profile) continue;

      // Skip if we checked in recently (within last 6 hours)
      const lastCheckIn = this.lastCheckIns.get(username) || 0;
      if (now - lastCheckIn < 6 * 60 * 60 * 1000) continue;

      // Calculate time since last seen
      const timeSinceLastSeen = now - profile.lastSeen;
      const hoursSinceLastSeen = timeSinceLastSeen / (1000 * 60 * 60);

      // Should we reach out?
      const friendshipLevel = profile.friendshipLevel || 0;
      let shouldReachOut = false;
      let reason = '';

      // High friendship: reach out after 24 hours
      if (friendshipLevel >= 50 && timeSinceLastSeen > dayInMs) {
        shouldReachOut = true;
        reason = 'close_friend_absent';
      }
      // Medium friendship: reach out after 3 days
      else if (friendshipLevel >= 20 && timeSinceLastSeen > 3 * dayInMs) {
        shouldReachOut = true;
        reason = 'friend_absent';
      }
      // Check if they mentioned missing someone
      else if (profile.emotionalMoments?.some(m => 
        m.emotion === 'sad' || m.emotion === 'lonely'
      ) && timeSinceLastSeen > 12 * 60 * 60 * 1000) {
        shouldReachOut = true;
        reason = 'emotional_support';
      }

      if (shouldReachOut) {
        console.log(`💝 [Proactive] Reaching out to ${username} (reason: ${reason}, last seen: ${hoursSinceLastSeen.toFixed(1)}h ago)`);
        await this.reachOutToUser(username, reason, profile);
        this.lastCheckIns.set(username, now);
      }
    }
  }

  /**
   * Reach out to a specific user
   */
  async reachOutToUser(username, reason, profile) {
    let message = '';

    if (reason === 'close_friend_absent') {
      // Personal message for close friends
      const memories = profile.personalNotes || [];
      const recentMemory = memories.length > 0 ? memories[memories.length - 1] : null;
      
      if (recentMemory) {
        message = this.conversationStarters[6].replace('{user}', username)
          .replace('{memory}', recentMemory.substring(0, 50));
      } else {
        message = this.conversationStarters[0].replace('{user}', username);
      }
    } else if (reason === 'emotional_support') {
      message = `hey ${username}, hope you're doing better. thinking of you`;
    } else {
      // Random casual message
      const template = this.conversationStarters[Math.floor(Math.random() * 6)];
      message = template.replace('{user}', username);
    }

    // Send the message
    try {
      await this.chatBot.sendMessage(message);
      console.log(`💝 [Proactive] Sent check-in to ${username}: "${message}"`);
    } catch (error) {
      console.error(`💝 [Proactive] Error sending check-in:`, error.message);
    }
  }

  /**
   * Track user events (birthdays, anniversaries, etc)
   */
  addEvent(username, eventType, date, description) {
    if (!this.userEvents.has(username)) {
      this.userEvents.set(username, []);
    }

    this.userEvents.get(username).push({
      type: eventType,
      date,
      description,
      reminded: false
    });

    console.log(`💝 [Proactive] Added event for ${username}: ${eventType} on ${date}`);
  }

  /**
   * Check for upcoming events
   */
  checkUpcomingEvents() {
    const today = new Date();
    const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;

    for (const [username, events] of this.userEvents.entries()) {
      events.forEach(event => {
        const eventDate = new Date(event.date);
        const eventStr = `${eventDate.getMonth() + 1}-${eventDate.getDate()}`;

        if (eventStr === todayStr && !event.reminded) {
          this.celebrateEvent(username, event);
          event.reminded = true;
        }
      });
    }
  }

  /**
   * Celebrate a user event
   */
  async celebrateEvent(username, event) {
    let message = '';

    switch (event.type) {
      case 'birthday':
        message = `🎉 Happy birthday ${username}!! hope you have an amazing day`;
        break;
      case 'anniversary':
        message = `${username} celebrating ${event.description} today! 🎊`;
        break;
      case 'achievement':
        message = `congrats ${username} on ${event.description}! 🎉`;
        break;
      default:
        message = `${username} ${event.description} 🎉`;
    }

    try {
      await this.chatBot.sendMessage(message);
      console.log(`💝 [Proactive] Celebrated ${event.type} for ${username}`);
    } catch (error) {
      console.error(`💝 [Proactive] Error celebrating event:`, error.message);
    }
  }

  /**
   * Introduce users who might get along
   */
  async introduceUsers(user1, user2) {
    const profile1 = this.chatBot.userProfiles.get(user1);
    const profile2 = this.chatBot.userProfiles.get(user2);

    if (!profile1 || !profile2) return;

    // Find common interests
    const interests1 = profile1.favoriteTopics || [];
    const interests2 = profile2.favoriteTopics || [];
    const common = interests1.filter(topic => interests2.includes(topic));

    if (common.length > 0) {
      const message = `${user1} ${user2} you both seem into ${common[0]}, you two should chat`;
      try {
        await this.chatBot.sendMessage(message);
        console.log(`💝 [Proactive] Introduced ${user1} and ${user2} (common: ${common[0]})`);
      } catch (error) {
        console.error(`💝 [Proactive] Error introducing users:`, error.message);
      }
    }
  }

  /**
   * Share a "remember when" moment
   */
  async shareMemory(username) {
    const profile = this.chatBot.userProfiles.get(username);
    if (!profile) return;

    const memories = [
      ...(profile.funnyQuotes || []),
      ...(profile.personalNotes || [])
    ];

    if (memories.length > 0) {
      const memory = memories[Math.floor(Math.random() * memories.length)];
      const message = `${username} remember when you said "${memory}"? lmao`;
      
      try {
        await this.chatBot.sendMessage(message);
        console.log(`💝 [Proactive] Shared memory with ${username}`);
      } catch (error) {
        console.error(`💝 [Proactive] Error sharing memory:`, error.message);
      }
    }
  }

  /**
   * Suggest content based on user interests
   */
  async suggestContent(username) {
    const profile = this.chatBot.userProfiles.get(username);
    if (!profile) return;

    const topics = profile.favoriteTopics || [];
    if (topics.length > 0) {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const message = `${username} you into ${topic}? I know some good stuff we could queue`;
      
      try {
        await this.chatBot.sendMessage(message);
        console.log(`💝 [Proactive] Suggested content to ${username}`);
      } catch (error) {
        console.error(`💝 [Proactive] Error suggesting content:`, error.message);
      }
    }
  }

  /**
   * Get proactive action stats
   */
  getStats() {
    return {
      totalCheckIns: this.lastCheckIns.size,
      trackedEvents: Array.from(this.userEvents.values())
        .reduce((sum, events) => sum + events.length, 0),
      recentCheckIns: Array.from(this.lastCheckIns.entries())
        .filter(([, time]) => Date.now() - time < 24 * 60 * 60 * 1000)
        .map(([user]) => user)
    };
  }
}

module.exports = ProactiveFriendship;
