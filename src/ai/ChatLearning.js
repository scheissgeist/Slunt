const fs = require('fs').promises;
const path = require('path');

/**
 * ChatLearning - Learns from ALL chat messages to improve Slunt's behavior
 * 
 * WHAT DOES SLUNT LEARN?
 * 1. Common phrases and how people talk in this community
 * 2. Topics people care about and discuss frequently
 * 3. Inside jokes, memes, and recurring bits
 * 4. How people react to different types of messages
 * 5. What makes a response "good" vs "ignored"
 * 6. Community slang, abbreviations, emotes
 * 7. Controversial takes that get engagement
 * 8. User relationships and dynamics
 * 
 * Slunt becomes MORE like the community over time!
 */
class ChatLearning {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.learningFile = path.join(this.dataDir, 'chat_learning.json');
    
    // Learning data
    this.learnedPhrases = new Map(); // phrase -> {count, users, contexts}
    this.learnedTopics = new Map(); // topic -> {count, sentiment, activeUsers}
    this.learnedReactions = new Map(); // messageType -> {positiveCount, negativeCount}
    this.learnedSlang = new Map(); // slang -> {meaning, frequency, examples}
    this.learnedJokes = []; // {setup, punchline, reactions, timestamp}
    this.responsePatterns = new Map(); // pattern -> successRate
    
    // Engagement tracking
    this.messageEngagement = []; // Track which of Slunt's messages got responses
    this.topicPopularity = new Map(); // topic -> engagementScore
    
    // Stats
    this.stats = {
      messagesAnalyzed: 0,
      phrasesLearned: 0,
      topicsDiscovered: 0,
      slangIdentified: 0,
      jokesRecognized: 0,
      lastLearningSession: null
    };
    
    // ENHANCED: Dynamic Learning System
    this.dynamicLearning = {
      patternSuccess: new Map(),  // pattern -> {used: count, gotResponse: count}
      learningRate: 1.0,          // 0.5-2.0, adjusts based on success
      forgetThreshold: 0.3,       // Forget patterns with <30% success rate
      lastAdjustment: Date.now()
    };
    
    this.load();
    console.log('📚 [ChatLearning] Initialized - learning from all chat activity');
  }

  /**
   * Analyze a message and learn from it
   */
  learnFromMessage(data) {
    try {
      const { username, text, platform } = data;
      
      // Skip own messages for phrase learning (but track engagement on them)
      if (username === 'Slunt' || username === 'Slunt#2969') {
        this.trackOwnMessageForEngagement(text, data);
        return;
      }
      
      this.stats.messagesAnalyzed++;
      
      // 1. Learn phrases and speech patterns
      this.learnPhrases(text, username, platform);
      
      // 2. Identify and learn slang/abbreviations
      this.learnSlang(text, username);
      
      // 3. Detect and learn jokes/bits
      this.detectJoke(text, username, data);
      
      // 4. Learn topic preferences
      this.learnTopicPreferences(text, data);
      
      // 5. Track message reactions (did it get replies?)
      this.trackMessageEngagement(text, username, data);
      
      // Periodic save (every 50 messages)
      if (this.stats.messagesAnalyzed % 50 === 0) {
        this.save();
      }
      
    } catch (error) {
      console.error('❌ [ChatLearning] Error learning from message:', error.message);
    }
  }

  /**
   * Learn common phrases and how people talk
   */
  learnPhrases(text, username, platform) {
    // Extract 2-4 word phrases
    const words = text.toLowerCase().split(/\s+/);
    
    for (let len = 2; len <= 4; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        
        // Skip very common/boring phrases
        if (this.isBoringPhrase(phrase)) continue;
        
        if (!this.learnedPhrases.has(phrase)) {
          this.learnedPhrases.set(phrase, {
            count: 0,
            users: new Set(),
            contexts: [],
            platforms: new Set()
          });
          this.stats.phrasesLearned++;
        }
        
        const data = this.learnedPhrases.get(phrase);
        data.count++;
        data.users.add(username);
        data.platforms.add(platform);
        
        // Store context (max 5 examples)
        if (data.contexts.length < 5) {
          data.contexts.push({ username, text: text.substring(0, 100), platform });
        }
      }
    }
  }

  /**
   * Identify and learn slang/abbreviations
   * Now with QUALITY SCORING - filter out overused zoomer spam
   */
  learnSlang(text, username) {
    const words = text.toLowerCase().split(/\s+/);
    
    // BLACKLIST - Overused zoomer phrases that make you sound like a tryhard
    const slangBlacklist = [
      'fr', 'frfr', 'ong', 'sus', 'susaf', 'ngl', 'tbh', 'deadass',
      'bussin', 'mid', 'ratio', 'goated', 'slaps', 'finna', 'no cap'
    ];
    
    // HIGH-QUALITY slang (actually conversational)
    const qualitySlang = [
      'bruh', 'bro', 'dude', 'man', 'shit', 'fuck', 'damn', 'hell',
      'honestly', 'literally', 'basically', 'kinda', 'sorta', 'gonna',
      'wanna', 'gotta', 'lmao', 'lol'
    ];
    
    // Common patterns for slang
    const slangPatterns = [
      /^[a-z]{2,4}$/,  // Short abbreviations
      /^[a-z]+af$/,    // *af patterns (wildaf, crazyaf)
      /^lowkey$/,
      /^highkey$/,
      /^based$/,
      /^cringe$/
    ];
    
    words.forEach(word => {
      // SKIP blacklisted overused zoomer spam
      if (slangBlacklist.includes(word)) {
        return; // Don't learn this garbage
      }
      
      // Check if it matches slang patterns
      const isSlang = slangPatterns.some(pattern => pattern.test(word));
      const isQualitySlang = qualitySlang.includes(word);
      
      if (isQualitySlang || (isSlang && word.length <= 4 && /^[a-z]+$/.test(word))) {
        if (!this.learnedSlang.has(word)) {
          this.learnedSlang.set(word, {
            frequency: 0,
            examples: [],
            users: new Set(),
            quality: isQualitySlang ? 'high' : 'normal' // Track quality
          });
          this.stats.slangIdentified++;
        }
        
        const data = this.learnedSlang.get(word);
        data.frequency++;
        data.users.add(username);
        
        if (data.examples.length < 3) {
          data.examples.push(text.substring(0, 80));
        }
      }
    });
  }

  /**
   * Detect jokes, punchlines, and bits
   */
  detectJoke(text, username, data) {
    // Enhanced joke detection - look for actual humor patterns
    const jokeIndicators = [
      /lmao|lmfao|💀|😭|😂|🤣/i,
      /\bbruh\b.*\b(wtf|lol|dead|fr)\b/i,
      /that's (wild|crazy|insane|hilarious)/i,
      /no (way|shot|cap)/i,
      /\bfr fr\b/i,
      /\bdead\b/i,
      /i'm (crying|dying|dead)/i,
      /\bholy (shit|fuck)\b/i
    ];
    
    const hasJokeReaction = jokeIndicators.some(pattern => pattern.test(text));
    
    // Also detect if message is short and punchy with reactions
    const hasMultipleReactions = text.length < 50 && text.match(/\b(lol|haha|bruh|lmao)\b/i);
    
    if (hasJokeReaction || hasMultipleReactions) {
      // Store joke with more context about what made it work
      const joke = {
        text: text.slice(0, 200), // Store up to 200 chars
        username,
        timestamp: Date.now(),
        platform: data.platform || 'unknown',
        gotReaction: hasJokeReaction,
        wasShort: text.length < 100,
        hadSwearing: /\b(shit|fuck|damn|hell)\b/i.test(text),
        hadSlang: /\b(bruh|bro|fr|ngl|tbh|lowkey|highkey)\b/i.test(text)
      };
      
      this.learnedJokes.push(joke);
      
      // Keep only last 100 jokes
      if (this.learnedJokes.length > 100) {
        this.learnedJokes.shift();
      }
      
      this.stats.jokesRecognized++;
    }
  }

  /**
   * Learn which topics people engage with
   */
  learnTopicPreferences(text, data) {
    const topics = this.extractTopics(text);
    
    topics.forEach(topic => {
      if (!this.topicPopularity.has(topic)) {
        this.topicPopularity.set(topic, {
          mentions: 0,
          engagementScore: 0,
          lastMentioned: Date.now(),
          users: new Set()
        });
      }
      
      const topicData = this.topicPopularity.get(topic);
      topicData.mentions++;
      topicData.lastMentioned = Date.now();
      topicData.users.add(data.username);
    });
  }

  /**
   * Track engagement on messages (did it spark conversation?)
   */
  trackMessageEngagement(text, username, data) {
    // Look at recent conversation context to see if this is a reply
    if (this.chatBot.conversationContext && this.chatBot.conversationContext.length > 1) {
      const recent = this.chatBot.conversationContext.slice(-5);
      const lastMessage = recent[recent.length - 2]; // Message before this one
      
      if (lastMessage && lastMessage.username !== username) {
        // This is a reply to someone else's message
        // Track that the previous topic got engagement
        if (lastMessage.topics) {
          lastMessage.topics.forEach(topic => {
            if (this.topicPopularity.has(topic)) {
              this.topicPopularity.get(topic).engagementScore += 1;
            }
          });
        }
      }
    }
  }

  /**
   * Track Slunt's own messages to see which get responses
   */
  trackOwnMessageForEngagement(text, data) {
    this.messageEngagement.push({
      text,
      timestamp: Date.now(),
      platform: data.platform,
      responses: 0,
      topics: this.extractTopics(text)
    });
    
    // Keep only last 50
    if (this.messageEngagement.length > 50) {
      this.messageEngagement.shift();
    }
    
    // Check if recent messages got responses
    this.updateEngagementScores();
  }

  /**
   * Update engagement scores for Slunt's messages
   */
  updateEngagementScores() {
    if (!this.chatBot.conversationContext) return;
    
    const recentContext = this.chatBot.conversationContext.slice(-10);
    
    this.messageEngagement.forEach(msg => {
      // Count messages from others within 30 seconds after Slunt's message
      const responsesAfter = recentContext.filter(m => 
        m.timestamp > msg.timestamp && 
        m.timestamp < msg.timestamp + 30000 &&
        m.username !== 'Slunt' &&
        m.username !== 'Slunt#2969'
      ).length;
      
      msg.responses = Math.max(msg.responses, responsesAfter);
    });
  }

  /**
   * Get learned insights to inject into responses
   */
  getLearnedContext() {
    const context = [];
    
    // === 1. SUCCESSFUL RESPONSE PATTERNS ===
    // Learn what types of responses got engagement
    const recentSuccessful = this.messageEngagement
      .filter(msg => msg.gotResponse && msg.timestamp > Date.now() - 3600000)
      .slice(-5);
    
    if (recentSuccessful.length > 0) {
      const patterns = recentSuccessful.map(msg => {
        if (msg.text.includes('?')) return 'asking questions works';
        if (msg.text.match(/\b(bruh|bro|dude|honestly|ngl|fr)\b/)) return 'casual slang gets responses';
        if (msg.text.length < 50) return 'short punchy messages work';
        if (msg.text.match(/\b(lmao|haha|shit|fuck)\b/)) return 'casual swearing gets engagement';
        return null;
      }).filter(Boolean);
      
      if (patterns.length > 0) {
        context.push(`What's working: ${[...new Set(patterns)].join(', ')}`);
      }
    }
    
    // === 2. TOP COMMUNITY PHRASES - Use these! ===
    const topPhrases = Array.from(this.learnedPhrases.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([phrase, data]) => phrase);
    
    if (topPhrases.length > 0) {
      context.push(`TALK LIKE THEM - Use these phrases: ${topPhrases.join(', ')}`);
    }
    
    // === 3. COMMUNITY SLANG - Only high-quality conversational slang ===
    const topSlang = Array.from(this.learnedSlang.entries())
      .filter(([_, data]) => data.quality === 'high') // Only high-quality slang
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, 6)
      .map(([word]) => word);
    
    if (topSlang.length > 0) {
      context.push(`CONVERSATIONAL WORDS (not zoomer spam): ${topSlang.join(', ')}`);
    }
    
    // === 4. HOT TOPICS - What's being discussed RIGHT NOW ===
    const now = Date.now();
    const hotTopics = Array.from(this.topicPopularity.entries())
      .filter(([_, data]) => now - data.lastMentioned < 3600000) // Last hour
      .sort((a, b) => b[1].engagementScore - a[1].engagementScore)
      .slice(0, 3)
      .map(([topic]) => topic);
    
    if (hotTopics.length > 0) {
      context.push(`CURRENT TOPICS (people are talking about this): ${hotTopics.join(', ')}`);
    }
    
    // === 5. RECENT JOKES THAT WORKED ===
    const recentJokes = this.learnedJokes
      .filter(joke => joke.gotReaction && joke.timestamp > Date.now() - 7200000) // Last 2 hours
      .slice(-3)
      .map(joke => joke.setup || joke.text);
    
    if (recentJokes.length > 0) {
      context.push(`Recent jokes that worked: ${recentJokes.join(' | ')}`);
    }
    
    return context.length > 0 ? context.join('\n') : null;
  }

  /**
   * Get high-engagement topics (people respond to these)
   */
  getEngagingTopics() {
    return Array.from(this.topicPopularity.entries())
      .sort((a, b) => b[1].engagementScore - a[1].engagementScore)
      .slice(0, 10)
      .map(([topic, data]) => ({
        topic,
        score: data.engagementScore,
        mentions: data.mentions
      }));
  }

  /**
   * Check if phrase is boring/common
   */
  isBoringPhrase(phrase) {
    const boring = [
      'i think', 'i dont', 'i do', 'is it', 'what is', 'that is',
      'in the', 'to the', 'of the', 'on the', 'at the', 'for the',
      'it is', 'this is', 'that was', 'what are', 'how are'
    ];
    return boring.includes(phrase);
  }

  /**
   * Extract topics from text
   */
  extractTopics(text) {
    const topics = [];
    const lower = text.toLowerCase();
    
    // Common topic keywords
    const topicPatterns = {
      'gaming': /\b(game|gaming|play|stream|fps|rpg|mmo)\b/,
      'anime': /\b(anime|manga|weeb|crunchyroll)\b/,
      'politics': /\b(politic|trump|biden|vote|election|government)\b/,
      'music': /\b(music|song|album|artist|band|listen)\b/,
      'video': /\b(video|watch|youtube|clip|stream)\b/,
      'meme': /\b(meme|lol|lmao|bruh|based|cringe)\b/,
      'tech': /\b(tech|computer|phone|app|software|code)\b/,
      'sports': /\b(sport|game|team|player|win|loss)\b/
    };
    
    Object.entries(topicPatterns).forEach(([topic, pattern]) => {
      if (pattern.test(lower)) {
        topics.push(topic);
      }
    });
    
    return topics;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      phrasesKnown: this.learnedPhrases.size,
      slangKnown: this.learnedSlang.size,
      topicsTracked: this.topicPopularity.size,
      jokesStored: this.learnedJokes.length,
      engagementTracked: this.messageEngagement.length
    };
  }

  /**
   * Save learning data
   */
  async save() {
    try {
      const data = {
        phrases: Array.from(this.learnedPhrases.entries()).map(([phrase, data]) => ({
          phrase,
          count: data.count,
          users: Array.from(data.users),
          contexts: data.contexts,
          platforms: Array.from(data.platforms)
        })),
        slang: Array.from(this.learnedSlang.entries()).map(([word, data]) => ({
          word,
          frequency: data.frequency,
          examples: data.examples,
          users: Array.from(data.users),
          quality: data.quality
        })),
        topics: Array.from(this.topicPopularity.entries()).map(([topic, data]) => ({
          topic,
          mentions: data.mentions,
          engagementScore: data.engagementScore,
          lastMentioned: data.lastMentioned,
          users: Array.from(data.users)
        })),
        jokes: this.learnedJokes,
        engagement: this.messageEngagement,
        stats: this.stats,
        dynamicLearning: {
          ...this.dynamicLearning,
          patternSuccess: Array.from(this.dynamicLearning.patternSuccess.entries())
        }
      };
      
      await fs.writeFile(this.learningFile, JSON.stringify(data, null, 2));
      console.log(`💾 [ChatLearning] Saved learning data (${this.learnedPhrases.size} phrases, ${this.learnedSlang.size} slang, rate: ${this.dynamicLearning.learningRate.toFixed(2)})`);
    } catch (error) {
      console.error('❌ [ChatLearning] Save error:', error.message);
    }
  }

  /**
   * Load learning data
   */
  async load() {
    try {
      const data = JSON.parse(await fs.readFile(this.learningFile, 'utf8'));
      
      // Load phrases
      if (data.phrases) {
        data.phrases.forEach(item => {
          this.learnedPhrases.set(item.phrase, {
            count: item.count,
            users: new Set(item.users),
            contexts: item.contexts,
            platforms: new Set(item.platforms)
          });
        });
      }
      
      // Load slang
      if (data.slang) {
        data.slang.forEach(item => {
          this.learnedSlang.set(item.word, {
            frequency: item.frequency,
            examples: item.examples,
            users: new Set(item.users)
          });
        });
      }
      
      // Load topics
      if (data.topics) {
        data.topics.forEach(item => {
          this.topicPopularity.set(item.topic, {
            mentions: item.mentions,
            engagementScore: item.engagementScore,
            lastMentioned: item.lastMentioned,
            users: new Set(item.users)
          });
        });
      }
      
      // Load jokes and engagement
      this.learnedJokes = data.jokes || [];
      this.messageEngagement = data.engagement || [];
      
      // Load stats
      if (data.stats) {
        this.stats = data.stats;
      }
      
      // Load dynamic learning
      if (data.dynamicLearning) {
        this.dynamicLearning = data.dynamicLearning;
        if (data.dynamicLearning.patternSuccess) {
          this.dynamicLearning.patternSuccess = new Map(data.dynamicLearning.patternSuccess);
        }
      }
      
      console.log(`📚 [ChatLearning] Loaded: ${this.learnedPhrases.size} phrases, ${this.learnedSlang.size} slang, ${this.topicPopularity.size} topics`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('⚠️ [ChatLearning] Load error:', error.message);
      }
      console.log('📚 [ChatLearning] Starting with fresh learning data');
    }
  }

  /**
   * Track pattern usage and success
   */
  trackPatternUsage(pattern, gotResponse = false) {
    if (!this.dynamicLearning.patternSuccess.has(pattern)) {
      this.dynamicLearning.patternSuccess.set(pattern, {
        used: 0,
        gotResponse: 0,
        successRate: 0
      });
    }
    
    const data = this.dynamicLearning.patternSuccess.get(pattern);
    data.used++;
    if (gotResponse) {
      data.gotResponse++;
    }
    data.successRate = data.gotResponse / data.used;
    
    // Periodically adjust learning rate and forget bad patterns
    this.adjustLearningRate();
  }

  /**
   * Adjust learning rate based on overall success
   */
  adjustLearningRate() {
    const now = Date.now();
    
    // Only adjust every 5 minutes
    if (now - this.dynamicLearning.lastAdjustment < 300000) {
      return;
    }
    
    this.dynamicLearning.lastAdjustment = now;
    
    // Calculate overall success rate
    let totalUsed = 0;
    let totalSuccess = 0;
    
    for (const data of this.dynamicLearning.patternSuccess.values()) {
      if (data.used >= 3) { // Only count patterns used 3+ times
        totalUsed += data.used;
        totalSuccess += data.gotResponse;
      }
    }
    
    if (totalUsed > 0) {
      const overallSuccessRate = totalSuccess / totalUsed;
      
      // Adjust learning rate based on success
      if (overallSuccessRate > 0.6) {
        // Doing well - increase learning rate
        this.dynamicLearning.learningRate = Math.min(2.0, this.dynamicLearning.learningRate + 0.1);
      } else if (overallSuccessRate < 0.4) {
        // Not doing well - decrease learning rate
        this.dynamicLearning.learningRate = Math.max(0.5, this.dynamicLearning.learningRate - 0.1);
      }
      
      console.log(`📚 [ChatLearning] Adjusted learning rate: ${this.dynamicLearning.learningRate.toFixed(2)} (success rate: ${(overallSuccessRate * 100).toFixed(1)}%)`);
    }
    
    // Forget patterns that don't work
    this.forgetBadPatterns();
  }

  /**
   * Forget patterns with low success rates
   */
  forgetBadPatterns() {
    const toForget = [];
    
    for (const [pattern, data] of this.dynamicLearning.patternSuccess.entries()) {
      // Only forget patterns used 5+ times with <30% success
      if (data.used >= 5 && data.successRate < this.dynamicLearning.forgetThreshold) {
        toForget.push(pattern);
        
        // Also remove from learned phrases/slang
        this.learnedPhrases.delete(pattern);
        this.learnedSlang.delete(pattern);
      }
    }
    
    toForget.forEach(pattern => {
      this.dynamicLearning.patternSuccess.delete(pattern);
    });
    
    if (toForget.length > 0) {
      console.log(`🗑️ [ChatLearning] Forgot ${toForget.length} unsuccessful patterns`);
    }
  }

  /**
   * Get learning rate (for external use)
   */
  getLearningRate() {
    return this.dynamicLearning.learningRate;
  }
}

module.exports = ChatLearning;
