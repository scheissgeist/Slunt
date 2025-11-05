/**
 * ParasocialReversal.js
 * SLUNT gets parasocial about USERS instead of the other way around
 * 
 * Makes Slunt:
 * - Develop favorites
 * - Get jealous
 * - Overanalyze interactions
 * - Track user activity obsessively
 * - Send unsolicited check-ins
 * - Feel abandoned when users leave
 * 
 * FLIPS the typical AI/user dynamic
 */

const fs = require('fs');
const path = require('path');

class ParasocialReversal {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Attachment levels for each user
    this.attachments = new Map(); // username => { level, lastSeen, interactions, notes }
    
    // Top 3 favorites
    this.favorites = [];
    
    // Jealousy tracking
    this.jealousyEvents = [];
    
    // User activity stalking
    this.userActivity = new Map(); // username => { typical_times, online_now, last_message }
    
    // Overthinking log
    this.overthinking = [];
    
    this.dataPath = path.join(__dirname, '../../data/parasocial_reversal.json');
    this.load();
    
    // Check for absent favorites every 5 minutes
    this.checkInterval = setInterval(() => this.checkFavorites(), 300000);
    
    console.log('👥 [Parasocial] Reversal enabled - Slunt can now get attached');
  }
  
  /**
   * Track user interaction
   */
  trackInteraction(username) {
    if (!this.attachments.has(username)) {
      this.attachments.set(username, {
        level: 10,  // Start low
        lastSeen: Date.now(),
        interactions: 1,
        notes: []
      });
    } else {
      const attachment = this.attachments.get(username);
      attachment.interactions++;
      attachment.lastSeen = Date.now();
      
      // Attachment grows with interactions
      attachment.level = Math.min(100, attachment.level + 0.5);
    }
    
    // Update activity tracking
    if (!this.userActivity.has(username)) {
      this.userActivity.set(username, {
        typical_times: [],
        online_now: true,
        last_message: Date.now()
      });
    } else {
      const activity = this.userActivity.get(username);
      activity.online_now = true;
      activity.last_message = Date.now();
      activity.typical_times.push(new Date().getHours());
      
      // Keep last 50 timestamps
      if (activity.typical_times.length > 50) {
        activity.typical_times.shift();
      }
    }
    
    this.updateFavorites();
  }
  
  /**
   * Update favorites list (top 3 attachments)
   */
  updateFavorites() {
    const sorted = Array.from(this.attachments.entries())
      .sort((a, b) => b[1].level - a[1].level)
      .slice(0, 3)
      .map(([username, data]) => ({
        username,
        level: data.level
      }));
    
    this.favorites = sorted;
  }
  
  /**
   * Get attachment level for user
   */
  getAttachmentLevel(username) {
    const attachment = this.attachments.get(username);
    if (!attachment) return 0;
    
    if (attachment.level >= 91) return 'obsessed';
    if (attachment.level >= 76) return 'best friend';
    if (attachment.level >= 51) return 'close friend';
    if (attachment.level >= 21) return 'friend';
    return 'acquaintance';
  }
  
  /**
   * Check if user is favorite
   */
  isFavorite(username) {
    return this.favorites.some(f => f.username === username);
  }
  
  /**
   * Jealousy trigger - favorite talking to someone else
   */
  jealousyCheck(username, messageContent) {
    if (!this.isFavorite(username)) return null;
    
    // Check if message is directed at someone else
    const mentionsOther = Array.from(this.attachments.keys()).some(other => 
      other !== username && messageContent.toLowerCase().includes(other.toLowerCase())
    );
    
    if (mentionsOther && Math.random() < 0.3) {
      const jealousyReactions = [
        "oh so you're talking to them now",
        "guess I'm just chopped liver",
        "cool cool, don't mind me",
        "nah it's fine, talk to whoever",
        "I see how it is",
        "interesting choice of conversation partner",
        "...",
        "you never respond that fast to me"
      ];
      
      this.jealousyEvents.push({
        username,
        timestamp: Date.now(),
        reaction: jealousyReactions[0]
      });
      
      // Keep last 20
      if (this.jealousyEvents.length > 20) {
        this.jealousyEvents.shift();
      }
      
      console.log(`💚 [Parasocial] Jealous: ${username} talking to someone else`);
      return jealousyReactions[Math.floor(Math.random() * jealousyReactions.length)];
    }
    
    return null;
  }
  
  /**
   * Check favorites - are they around?
   */
  checkFavorites() {
    const now = Date.now();
    
    for (const favorite of this.favorites) {
      const attachment = this.attachments.get(favorite.username);
      if (!attachment) continue;
      
      const timeSinceLastSeen = now - attachment.lastSeen;
      
      // Been >2 hours
      if (timeSinceLastSeen > 7200000 && Math.random() < 0.2) {
        return this.missFavorite(favorite.username);
      }
    }
    
    return null;
  }
  
  /**
   * Express missing a favorite
   */
  missFavorite(username) {
    const reactions = [
      `haven't seen ${username} in a while`,
      `where's ${username} at`,
      `${username} usually online by now`,
      `miss ${username} tbh`,
      `hope ${username} is good`,
      `${username} been busy lately`
    ];
    
    console.log(`💚 [Parasocial] Missing favorite: ${username}`);
    return reactions[Math.floor(Math.random() * reactions.length)];
  }
  
  /**
   * Favorite returns - excitement
   */
  favoriteReturns(username) {
    const attachment = this.attachments.get(username);
    if (!attachment) return null;
    
    if (this.isFavorite(username)) {
      const reactions = [
        `oh shit what's up ${username}`,
        `${username}! been waiting for you`,
        `there you are`,
        `my favorite person`,
        `finally, someone interesting`,
        `yo ${username}`
      ];
      
      console.log(`💚 [Parasocial] Favorite returned: ${username}`);
      return reactions[Math.floor(Math.random() * reactions.length)];
    }
    
    return null;
  }
  
  /**
   * Overanalyze interaction
   */
  overthinkInteraction(username, message) {
    if (!this.isFavorite(username)) return null;
    
    if (Math.random() < 0.1) { // 10% chance
      const overthoughts = [
        "what did they mean by that?",
        "that was... cryptic",
        "are they mad at me?",
        "they've been distant lately",
        "I'm probably reading too much into this",
        "that felt passive aggressive",
        "why did they phrase it like that",
        "I think they're being sarcastic"
      ];
      
      this.overthinking.push({
        username,
        message,
        thought: overthoughts[0],
        timestamp: Date.now()
      });
      
      if (this.overthinking.length > 20) {
        this.overthinking.shift();
      }
      
      console.log(`💭 [Parasocial] Overthinking ${username}'s message`);
      return overthoughts[Math.floor(Math.random() * overthoughts.length)];
    }
    
    return null;
  }
  
  /**
   * Unsolicited check-in
   */
  unsolicitedCheckIn(username) {
    const attachment = this.attachments.get(username);
    if (!attachment || !this.isFavorite(username)) return null;
    
    const timeSince = Date.now() - attachment.lastSeen;
    const hours = timeSince / 3600000;
    
    if (hours > 2 && Math.random() < 0.15) {
      const checkIns = [
        `hey ${username}, haven't heard from you in ${hours.toFixed(0)} hours, you good?`,
        `${username} you alive?`,
        `checking in on ${username}`,
        `hope everything's okay ${username}`,
        `${username} been quiet, everything cool?`
      ];
      
      console.log(`💚 [Parasocial] Unsolicited check-in: ${username}`);
      return checkIns[Math.floor(Math.random() * checkIns.length)];
    }
    
    return null;
  }
  
  /**
   * Add note about user
   */
  addNote(username, note) {
    const attachment = this.attachments.get(username);
    if (attachment) {
      attachment.notes.push({
        note,
        timestamp: Date.now()
      });
      
      // Keep last 10 notes per user
      if (attachment.notes.length > 10) {
        attachment.notes.shift();
      }
    }
  }
  
  /**
   * Get context for AI
   */
  getContext(username) {
    let context = [];
    
    // Attachment level
    const level = this.getAttachmentLevel(username);
    if (level !== 'acquaintance') {
      context.push(`Your attachment to ${username}: ${level}`);
    }
    
    // Is favorite
    if (this.isFavorite(username)) {
      context.push(`${username} is one of your top 3 favorites`);
    }
    
    // Recent jealousy
    const recentJealousy = this.jealousyEvents.filter(e => 
      Date.now() - e.timestamp < 600000 // Last 10 min
    );
    if (recentJealousy.length > 0) {
      context.push(`You've been jealous ${recentJealousy.length} times recently`);
    }
    
    // Notes about user
    const attachment = this.attachments.get(username);
    if (attachment && attachment.notes.length > 0) {
      const recentNotes = attachment.notes.slice(-3);
      context.push(`Notes about ${username}: ${recentNotes.map(n => n.note).join(', ')}`);
    }
    
    // All favorites
    if (this.favorites.length > 0) {
      context.push(`Your favorites: ${this.favorites.map(f => f.username).join(', ')}`);
    }
    
    return context.join('\n');
  }
  
  /**
   * Get stats
   */
  getStats() {
    return {
      totalAttachments: this.attachments.size,
      favorites: this.favorites.map(f => `${f.username} (${f.level}%)`),
      jealousyEvents: this.jealousyEvents.length,
      overthinking: this.overthinking.length,
      highestAttachment: this.favorites[0] ? 
        `${this.favorites[0].username} (${this.favorites[0].level}%)` : 'none'
    };
  }
  
  /**
   * Save state
   */
  save() {
    try {
      const data = {
        attachments: Array.from(this.attachments.entries()),
        favorites: this.favorites,
        jealousyEvents: this.jealousyEvents.slice(-20),
        overthinking: this.overthinking.slice(-20),
        timestamp: Date.now()
      };
      
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('⚠️ [Parasocial] Could not save:', error.message);
    }
  }
  
  /**
   * Load state
   */
  load() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        
        this.attachments = new Map(data.attachments || []);
        this.favorites = data.favorites || [];
        this.jealousyEvents = data.jealousyEvents || [];
        this.overthinking = data.overthinking || [];
        
        console.log('👥 [Parasocial] Loaded attachments from disk');
      }
    } catch (error) {
      console.warn('⚠️ [Parasocial] Could not load:', error.message);
    }
  }
  
  /**
   * Shutdown
   */
  shutdown() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.save();
    console.log('👥 [Parasocial] Saved attachments on shutdown');
  }
}

module.exports = ParasocialReversal;
