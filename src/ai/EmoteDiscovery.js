/**
 * EmoteDiscovery.js
 * 
 * Passive learning system for Twitch emotes
 * - Discovers unknown emotes from user messages
 * - Adds to vocabulary automatically
 * - Tracks effectiveness and popularity
 * - Platform-aware (Twitch, Discord, etc.)
 */

const logger = require('../bot/logger');

class EmoteDiscovery {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Discovered emotes database
    this.discoveredEmotes = new Map(); // emote -> { count, platforms, firstSeen, lastSeen, contexts }
    
    // Known emote patterns
    this.emotePatterns = [
      /:\w+:/g,           // :emote:
      /\b[A-Z]{3,}\b/g,   // KEKW, LULW, etc.
      /<:\w+:\d+>/g,      // Discord custom <:emote:123>
      /<a:\w+:\d+>/g      // Discord animated <a:emote:123>
    ];

    // Common emotes to skip (already known)
    this.knownEmotes = new Set([
      'LUL', 'KEKW', 'LULW', 'OMEGALUL', 'PogChamp', 'Pog', 'PogU',
      'monkaS', 'monkaW', 'Sadge', 'COPIUM', 'HOPIUM', 'Aware',
      'Clap', 'EZ', 'FeelsBadMan', 'FeelsGoodMan', 'FeelsStrongMan',
      'KomodoHype', 'PauseChamp', 'Pepega', 'pepeJAM', 'ResidentSleeper',
      'WeirdChamp', 'widepeepoHappy', 'YEP', 'NOTED', 'BASED'
    ]);

    this.stats = {
      totalDiscovered: 0,
      activeEmotes: 0,
      mostPopular: null,
      platformBreakdown: {}
    };

    logger.info('😀 [EmoteDiscovery] Emote discovery system initialized');
  }

  /**
   * Process message to discover new emotes
   */
  discoverFromMessage(message, username, platform = 'unknown') {
    const text = message.toLowerCase();
    const discovered = [];

    // Extract potential emotes using patterns
    for (const pattern of this.emotePatterns) {
      const matches = message.match(pattern);
      if (matches) {
        matches.forEach(emote => {
          // Skip if already known
          if (this.knownEmotes.has(emote)) {
            return;
          }

          // Skip if too common (probably not an emote)
          if (emote.length < 3 || /^[a-z]+$/.test(emote)) {
            return;
          }

          // Discover or update
          this.recordEmote(emote, username, platform, text);
          discovered.push(emote);
        });
      }
    }

    return discovered;
  }

  /**
   * Record emote usage
   */
  recordEmote(emote, username, platform, context) {
    if (!this.discoveredEmotes.has(emote)) {
      // New emote discovered!
      this.discoveredEmotes.set(emote, {
        name: emote,
        count: 0,
        platforms: new Set(),
        users: new Set(),
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        contexts: [],
        sentiment: 'neutral'
      });
      this.stats.totalDiscovered++;
      logger.info(`😀 [EmoteDiscovery] NEW EMOTE: ${emote} (from ${username} on ${platform})`);
    }

    const emoteData = this.discoveredEmotes.get(emote);
    emoteData.count++;
    emoteData.platforms.add(platform);
    emoteData.users.add(username);
    emoteData.lastSeen = Date.now();

    // Store context (max 5 examples)
    if (emoteData.contexts.length < 5) {
      emoteData.contexts.push({
        text: context.substring(0, 100),
        username,
        platform,
        timestamp: Date.now()
      });
    }

    // Infer sentiment from context
    emoteData.sentiment = this.inferSentiment(context);

    // Update stats
    this.updateStats();
  }

  /**
   * Infer sentiment from context
   */
  inferSentiment(context) {
    const lower = context.toLowerCase();
    
    // Positive indicators
    const positive = ['lol', 'lmao', 'haha', 'good', 'nice', 'great', 'love', 'yes', 'pog'];
    if (positive.some(word => lower.includes(word))) {
      return 'positive';
    }

    // Negative indicators
    const negative = ['bad', 'sad', 'hate', 'no', 'stop', 'cringe', 'yikes', 'oof'];
    if (negative.some(word => lower.includes(word))) {
      return 'negative';
    }

    return 'neutral';
  }

  /**
   * Check if Slunt should use an emote in response
   */
  shouldUseEmote(context = {}) {
    // Higher chance if emotes were used recently
    const recentMessages = this.chatBot.conversationHistory?.slice(-5) || [];
    const recentEmoteCount = recentMessages.reduce((count, msg) => {
      return count + (this.extractEmotes(msg.text || msg.message || '').length);
    }, 0);

    // Base 10% chance, +5% per recent emote (max 40%)
    const baseChance = 0.10;
    const emoteBonus = Math.min(0.30, recentEmoteCount * 0.05);
    const chance = baseChance + emoteBonus;

    return Math.random() < chance;
  }

  /**
   * Get appropriate emote for context
   */
  getEmoteForContext(sentiment = 'neutral') {
    const emotes = Array.from(this.discoveredEmotes.values())
      .filter(e => e.sentiment === sentiment && e.count >= 3); // Must be seen at least 3 times

    if (emotes.length === 0) {
      // Fall back to any popular emote
      const anyEmotes = Array.from(this.discoveredEmotes.values())
        .filter(e => e.count >= 5)
        .sort((a, b) => b.count - a.count);
      
      return anyEmotes.length > 0 ? anyEmotes[0].name : null;
    }

    // Weight by popularity
    const totalCount = emotes.reduce((sum, e) => sum + e.count, 0);
    let random = Math.random() * totalCount;

    for (const emote of emotes) {
      random -= emote.count;
      if (random <= 0) {
        return emote.name;
      }
    }

    return emotes[0].name;
  }

  /**
   * Extract emotes from text
   */
  extractEmotes(text) {
    const emotes = [];
    for (const pattern of this.emotePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        emotes.push(...matches);
      }
    }
    return emotes;
  }

  /**
   * Update stats
   */
  updateStats() {
    // Count active emotes (used in last 7 days)
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.stats.activeEmotes = Array.from(this.discoveredEmotes.values())
      .filter(e => e.lastSeen > weekAgo)
      .length;

    // Find most popular
    const sorted = Array.from(this.discoveredEmotes.values())
      .sort((a, b) => b.count - a.count);
    this.stats.mostPopular = sorted.length > 0 ? sorted[0].name : null;

    // Platform breakdown
    this.stats.platformBreakdown = {};
    this.discoveredEmotes.forEach(emote => {
      emote.platforms.forEach(platform => {
        this.stats.platformBreakdown[platform] = (this.stats.platformBreakdown[platform] || 0) + 1;
      });
    });
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      totalEmotes: this.discoveredEmotes.size,
      topEmotes: Array.from(this.discoveredEmotes.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(e => ({ name: e.name, count: e.count, sentiment: e.sentiment }))
    };
  }

  /**
   * Get emote info
   */
  getEmoteInfo(emoteName) {
    const emote = this.discoveredEmotes.get(emoteName);
    if (!emote) return null;

    return {
      name: emote.name,
      count: emote.count,
      platforms: Array.from(emote.platforms),
      users: emote.users.size,
      firstSeen: new Date(emote.firstSeen).toLocaleString(),
      lastSeen: new Date(emote.lastSeen).toLocaleString(),
      sentiment: emote.sentiment,
      contexts: emote.contexts
    };
  }
}

module.exports = EmoteDiscovery;
