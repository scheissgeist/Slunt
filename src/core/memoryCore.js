/**
 * MEMORY CORE - Single source of truth for all knowledge
 * 
 * Consolidates 12+ memory systems into one clean interface.
 * Philosophy: Store everything, inject only what's relevant.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../bot/logger');

class MemoryCore {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/memory');
    
    // Main data structures
    this.users = new Map();           // User knowledge
    this.topics = new Map();          // Topic expertise
    this.recentContext = new Map();   // Last N messages per platform
    this.community = {                // Community knowledge
      slang: new Map(),
      runningGags: [],
      memes: []
    };
    this.currentConversation = new Map(); // Active conversation state per platform
    
    // Callbacks & memorable moments
    this.callbacks = [];
    this.memorableMoments = [];
    
    // Dreams & chaos (preserved for flavor)
    this.dreams = [];
    
    logger.info('🧠 [MemoryCore] Initialized');
  }
  
  /**
   * Initialize - load from disk
   */
  async initialize() {
    try {
      await this.ensureDataDirectory();
      await this.load();
      logger.info('🧠 [MemoryCore] Loaded from disk');
    } catch (err) {
      logger.warn('⚠️ [MemoryCore] Failed to load, starting fresh:', err.message);
    }
  }
  
  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
    } catch (err) {
      // Directory exists, ignore
    }
  }
  
  /**
   * ==========================================
   * USER KNOWLEDGE
   * ==========================================
   */
  
  /**
   * Get or create user record
   */
  getUser(username) {
    if (!this.users.has(username)) {
      this.users.set(username, {
        id: username,
        platforms: [],
        firstMet: Date.now(),
        lastSeen: Date.now(),
        interactions: 0,
        
        tier: 'stranger',
        vibe: 'neutral',
        
        notableTraits: [],
        sharedExperiences: [],
        
        worksWith: {
          roasting: 0.5,
          serious: 0.5,
          conspiracies: 0.5,
          vulgar: 0.5
        },
        
        callbacks: []
      });
    }
    return this.users.get(username);
  }
  
  /**
   * Update user from interaction
   */
  updateUser(username, platform, message, sluntResponse = null) {
    const user = this.getUser(username);
    
    // Update basic stats
    user.lastSeen = Date.now();
    user.interactions++;
    if (!user.platforms.includes(platform)) {
      user.platforms.push(platform);
    }
    
    // Learn from message content
    if (message) {
      // Topic interests
      if (/conspiracy|illuminati|government|they want/i.test(message)) {
        user.worksWith.conspiracies = Math.min(1.0, user.worksWith.conspiracies + 0.05);
      }
      
      // Communication style
      if (/fuck|shit|damn|hell/i.test(message)) {
        user.worksWith.vulgar = Math.min(1.0, user.worksWith.vulgar + 0.05);
      }
    }
    
    // Relationship tier progression
    if (user.interactions > 50 && user.tier === 'stranger') {
      user.tier = 'acquaintance';
      logger.info(`🤝 [Memory] ${username}: stranger → acquaintance`);
    } else if (user.interactions > 150 && user.tier === 'acquaintance') {
      user.tier = 'friend';
      logger.info(`🤝 [Memory] ${username}: acquaintance → friend`);
    } else if (user.interactions > 500 && user.tier === 'friend') {
      user.tier = 'close';
      logger.info(`🤝 [Memory] ${username}: friend → close`);
    }
  }
  
  /**
   * Get user context for injection (max chars)
   */
  getUserContext(username, maxChars = 100) {
    const user = this.getUser(username);
    
    // Strangers: no context
    if (user.tier === 'stranger') return '';
    
    // Friends: brief context
    const parts = [];
    
    if (user.tier === 'friend' || user.tier === 'close') {
      const timeKnown = Math.floor((Date.now() - user.firstMet) / (1000 * 60 * 60 * 24 * 30));
      parts.push(`Known ${username} ${timeKnown}+ months (${user.tier})`);
    }
    
    // Notable interests (if strong)
    const interests = [];
    if (user.worksWith.conspiracies > 0.7) interests.push('loves conspiracies');
    if (user.worksWith.vulgar > 0.8) interests.push('vulgar dude');
    if (interests.length > 0) {
      parts.push(interests.join(', '));
    }
    
    const context = parts.join('. ');
    return context.length > maxChars ? context.substring(0, maxChars) + '...' : context;
  }
  
  /**
   * Add callback moment
   */
  addCallback(username, text, context, platform) {
    const user = this.getUser(username);
    user.callbacks.push({
      text,
      context,
      platform,
      timestamp: Date.now(),
      timesReferenced: 0
    });
    
    // Keep only last 50 callbacks per user
    if (user.callbacks.length > 50) {
      user.callbacks = user.callbacks.slice(-50);
    }
  }
  
  /**
   * Get relevant callback
   */
  getCallback(username, currentContext, maxChars = 80) {
    const user = this.getUser(username);
    if (!user.callbacks || user.callbacks.length === 0) return null;
    
    // Find callbacks that match current context
    const relevant = user.callbacks.filter(cb => {
      // Must be at least 1 day old (not too fresh)
      const age = Date.now() - cb.timestamp;
      if (age < 86400000) return false;
      
      // Context match (fuzzy)
      if (cb.context && currentContext) {
        return currentContext.toLowerCase().includes(cb.context.toLowerCase());
      }
      
      return true;
    });
    
    if (relevant.length === 0) return null;
    
    // Pick least-used callback
    relevant.sort((a, b) => a.timesReferenced - b.timesReferenced);
    const callback = relevant[0];
    callback.timesReferenced++;
    
    const text = `remember when you said "${callback.text}"`;
    return text.length > maxChars ? text.substring(0, maxChars) + '...' : text;
  }
  
  /**
   * ==========================================
   * TOPIC KNOWLEDGE
   * ==========================================
   */
  
  /**
   * Get or create topic record
   */
  getTopic(topic) {
    const key = topic.toLowerCase();
    if (!this.topics.has(key)) {
      this.topics.set(key, {
        name: topic,
        confidence: 0.1,  // Default: know very little
        lastMentioned: null,
        totalMentions: 0,
        expertise: 'none',
        
        facts: [],
        opinions: []
      });
    }
    return this.topics.get(key);
  }
  
  /**
   * Set topic expertise (for things Slunt knows about)
   */
  setTopicExpertise(topic, confidence, facts = [], opinions = []) {
    const t = this.getTopic(topic);
    t.confidence = confidence;
    t.expertise = confidence > 0.8 ? 'expert' : confidence > 0.6 ? 'confident' : confidence > 0.3 ? 'basic' : 'none';
    t.facts = facts;
    t.opinions = opinions;
  }
  
  /**
   * Update topic from mention
   */
  updateTopic(topic) {
    const t = this.getTopic(topic);
    t.lastMentioned = Date.now();
    t.totalMentions++;
  }
  
  /**
   * Get topic context for injection
   */
  getTopicContext(topic, maxChars = 100) {
    const t = this.getTopic(topic);
    
    // Don't know about it
    if (t.confidence < 0.3) return '';
    
    // Build context
    const parts = [];
    
    if (t.expertise === 'expert') {
      parts.push(`You're an expert on ${topic}`);
    } else if (t.expertise === 'confident') {
      parts.push(`You know about ${topic}`);
    }
    
    // Add one fact if available
    if (t.facts.length > 0) {
      parts.push(t.facts[0]);
    }
    
    const context = parts.join(' - ');
    return context.length > maxChars ? context.substring(0, maxChars) + '...' : context;
  }
  
  /**
   * Should admit ignorance?
   */
  shouldAdmitIgnorance(topic) {
    const t = this.getTopic(topic);
    return t.confidence < 0.3;
  }
  
  /**
   * ==========================================
   * RECENT CONTEXT (Conversation History)
   * ==========================================
   */
  
  /**
   * Add message to recent context
   */
  addToContext(platform, username, text, isSlunt = false) {
    if (!this.recentContext.has(platform)) {
      this.recentContext.set(platform, []);
    }
    
    const context = this.recentContext.get(platform);
    context.push({
      user: isSlunt ? 'Slunt' : username,
      text,
      timestamp: Date.now(),
      platform
    });
    
    // Keep only last 15 messages per platform
    if (context.length > 15) {
      this.recentContext.set(platform, context.slice(-15));
    }
  }
  
  /**
   * Get recent context formatted for prompt
   */
  getRecentContext(platform, messageCount = 5, maxChars = 400) {
    const context = this.recentContext.get(platform) || [];
    const recent = context.slice(-messageCount);
    
    if (recent.length === 0) return '';
    
    const formatted = recent.map(msg => `${msg.user}: ${msg.text}`).join('\n');
    return formatted.length > maxChars ? formatted.substring(0, maxChars) + '...' : formatted;
  }
  
  /**
   * Get current topic (from recent messages)
   */
  getCurrentTopic(platform) {
    const context = this.recentContext.get(platform) || [];
    const recent = context.slice(-5);
    
    // Simple topic extraction (look for repeated keywords)
    const words = recent.map(m => m.text.toLowerCase()).join(' ').split(/\s+/);
    const wordCount = {};
    
    words.forEach(word => {
      if (word.length > 4) { // Ignore short words
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    // Find most mentioned word
    let maxCount = 0;
    let currentTopic = null;
    for (const [word, count] of Object.entries(wordCount)) {
      if (count > maxCount && count > 1) {
        maxCount = count;
        currentTopic = word;
      }
    }
    
    return currentTopic;
  }
  
  /**
   * Get topic depth (how long on this topic)
   */
  getTopicDepth(platform) {
    const conv = this.currentConversation.get(platform);
    return conv ? conv.depth : 0;
  }
  
  /**
   * Update conversation state
   */
  updateConversationState(platform, topic = null) {
    if (!this.currentConversation.has(platform)) {
      this.currentConversation.set(platform, {
        platform,
        topic: null,
        depth: 0,
        startedAt: Date.now()
      });
    }
    
    const conv = this.currentConversation.get(platform);
    
    // Topic changed
    if (topic && topic !== conv.topic) {
      conv.topic = topic;
      conv.depth = 1;
      conv.startedAt = Date.now();
    } else if (topic === conv.topic) {
      // Same topic, increment depth
      conv.depth++;
    }
  }
  
  /**
   * Should change topic? (getting repetitive)
   */
  shouldChangeTopic(platform) {
    const conv = this.currentConversation.get(platform);
    return conv && conv.depth > 10; // More than 10 exchanges on same topic
  }
  
  /**
   * ==========================================
   * COMMUNITY KNOWLEDGE
   * ==========================================
   */
  
  /**
   * Add community slang
   */
  addSlang(platform, word) {
    if (!this.community.slang.has(platform)) {
      this.community.slang.set(platform, []);
    }
    const slang = this.community.slang.get(platform);
    if (!slang.includes(word)) {
      slang.push(word);
    }
  }
  
  /**
   * Get community slang for platform
   */
  getCommunitySlang(platform) {
    return this.community.slang.get(platform) || [];
  }
  
  /**
   * Add running gag
   */
  addRunningGag(phrase, origin, usage) {
    this.community.runningGags.push({
      phrase,
      origin,
      usage,
      addedAt: Date.now(),
      timesUsed: 0
    });
    
    // Keep only last 100 gags
    if (this.community.runningGags.length > 100) {
      this.community.runningGags = this.community.runningGags.slice(-100);
    }
  }
  
  /**
   * Get relevant running gag
   */
  getRunningGag(context) {
    const relevant = this.community.runningGags.filter(gag => {
      if (!context) return false;
      return context.toLowerCase().includes(gag.usage.toLowerCase());
    });
    
    if (relevant.length === 0) return null;
    
    // Pick least-used
    relevant.sort((a, b) => a.timesUsed - b.timesUsed);
    const gag = relevant[0];
    gag.timesUsed++;
    
    return gag.phrase;
  }
  
  /**
   * ==========================================
   * DREAMS (Preserved for chaos flavor)
   * ==========================================
   */
  
  addDream(dream) {
    this.dreams.push({
      content: dream,
      timestamp: Date.now()
    });
    
    // Keep only last 50 dreams
    if (this.dreams.length > 50) {
      this.dreams = this.dreams.slice(-50);
    }
  }
  
  getRandomDream() {
    if (this.dreams.length === 0) return null;
    return this.dreams[Math.floor(Math.random() * this.dreams.length)].content;
  }
  
  /**
   * ==========================================
   * SMART CONTEXT BUILDING
   * ==========================================
   */
  
  /**
   * Get ALL relevant context for a message (smart filtering)
   */
  getRelevantContext(options) {
    const {
      platform,
      username,
      message,
      maxChars = 300
    } = options;
    
    let context = '';
    let remaining = maxChars;
    
    // 1. Always include recent conversation (highest priority)
    const recentChars = Math.floor(remaining * 0.6); // 60% of budget
    const recent = this.getRecentContext(platform, 5, recentChars);
    if (recent) {
      context += recent + '\n';
      remaining -= recent.length;
    }
    
    // 2. User context if relevant
    if (username && remaining > 50) {
      const userCtx = this.getUserContext(username, Math.floor(remaining * 0.4));
      if (userCtx) {
        context = userCtx + '\n\n' + context; // Put at top
        remaining -= userCtx.length;
      }
    }
    
    // 3. Topic context if discussing something specific
    if (message && remaining > 50) {
      const topic = this.detectTopic(message);
      if (topic) {
        const topicCtx = this.getTopicContext(topic, Math.floor(remaining * 0.5));
        if (topicCtx) {
          context = topicCtx + '\n\n' + context; // Put at top
          remaining -= topicCtx.length;
        }
      }
    }
    
    // 4. Callback if situationally appropriate (low priority)
    if (username && remaining > 80 && Math.random() < 0.2) { // 20% chance
      const callback = this.getCallback(username, message, remaining);
      if (callback) {
        context += '\n' + callback;
      }
    }
    
    return context.trim();
  }
  
  /**
   * Simple topic detection
   */
  detectTopic(message) {
    const msg = message.toLowerCase();
    
    // Check against known topics
    for (const [key, topic] of this.topics.entries()) {
      if (msg.includes(key)) {
        this.updateTopic(key);
        return key;
      }
    }
    
    return null;
  }
  
  /**
   * ==========================================
   * PERSISTENCE
   * ==========================================
   */
  
  async save() {
    try {
      // Convert Maps to objects for JSON
      const data = {
        users: Array.from(this.users.entries()),
        topics: Array.from(this.topics.entries()),
        recentContext: Array.from(this.recentContext.entries()),
        community: {
          slang: Array.from(this.community.slang.entries()),
          runningGags: this.community.runningGags,
          memes: this.community.memes
        },
        currentConversation: Array.from(this.currentConversation.entries()),
        callbacks: this.callbacks,
        memorableMoments: this.memorableMoments,
        dreams: this.dreams
      };
      
      await fs.writeFile(
        path.join(this.dataPath, 'memoryCore.json'),
        JSON.stringify(data, null, 2)
      );
    } catch (err) {
      logger.error('❌ [MemoryCore] Failed to save:', err);
    }
  }
  
  async load() {
    try {
      const data = JSON.parse(
        await fs.readFile(path.join(this.dataPath, 'memoryCore.json'), 'utf8')
      );
      
      // Restore Maps from objects
      this.users = new Map(data.users);
      this.topics = new Map(data.topics);
      this.recentContext = new Map(data.recentContext);
      this.community.slang = new Map(data.community.slang);
      this.community.runningGags = data.community.runningGags;
      this.community.memes = data.community.memes;
      this.currentConversation = new Map(data.currentConversation);
      this.callbacks = data.callbacks || [];
      this.memorableMoments = data.memorableMoments || [];
      this.dreams = data.dreams || [];
      
      logger.info(`🧠 [MemoryCore] Loaded: ${this.users.size} users, ${this.topics.size} topics`);
    } catch (err) {
      // File doesn't exist yet, start fresh
      logger.info('🧠 [MemoryCore] Starting with fresh memory');
    }
  }
  
  /**
   * Auto-save every 5 minutes
   */
  startAutoSave() {
    setInterval(() => {
      this.save();
    }, 5 * 60 * 1000); // 5 minutes
  }
}

module.exports = MemoryCore;
