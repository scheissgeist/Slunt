/**
 * MULTI-TURN CONVERSATION TRACKING
 * 
 * Enhanced version that tracks threads across hours/days, remembers promises,
 * builds toward punchlines, and maintains narrative arcs.
 */

const fs = require('fs');
const path = require('path');

class MultiTurnTracking {
  constructor(chatBot) {
    this.bot = chatBot;
    
    // Active threads
    this.threads = new Map(); // threadId -> thread data
    
    // Promises/commitments made
    this.promises = []; // { promise, toUser, timestamp, fulfilled }
    
    // Long-running jokes/bits
    this.runningBits = []; // { setup, punchline, stage, participants }
    
    // Topic evolution tracking
    this.topicHistory = []; // Track how topics evolve over time
    
    // Callback opportunities
    this.callbackOpportunities = []; // Things worth referencing later
    
    this.load();
    
    console.log('🧵 [MultiTurn] Multi-turn tracking system initialized');
    console.log(`   📌 Active threads: ${this.threads.size}`);
    console.log(`   🤝 Pending promises: ${this.promises.filter(p => !p.fulfilled).length}`);
    console.log(`   😂 Running bits: ${this.runningBits.length}`);
  }

  /**
   * Track a message - auto-assign to thread or create new one
   */
  trackMessage(username, text, context = {}) {
    // Find recent active thread or create new one
    let activeThread = null;
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    // Look for thread with recent activity
    for (const [threadId, thread] of this.threads.entries()) {
      if (thread.lastActivity > fiveMinutesAgo && thread.participants.has(username)) {
        activeThread = threadId;
        break;
      }
    }
    
    // Create new thread if none found
    if (!activeThread) {
      const topic = text.slice(0, 30).trim();
      activeThread = this.trackThread(topic, [username], context);
    }
    
    // Add message to thread
    this.addToThread(activeThread, username, text, context);
    
    return activeThread;
  }

  /**
   * Track a new conversation thread
   */
  trackThread(topic, participants, context) {
    const threadId = `${topic}_${Date.now()}`;
    
    this.threads.set(threadId, {
      id: threadId,
      topic,
      participants: new Set(participants),
      messages: [],
      startTime: Date.now(),
      lastActivity: Date.now(),
      emotionalTone: 'neutral',
      subTopics: [],
      callbacks: []
    });
    
    return threadId;
  }

  /**
   * Add message to thread
   */
  addToThread(threadId, username, message, context = {}) {
    const thread = this.threads.get(threadId);
    if (!thread) return;
    
    thread.messages.push({
      username,
      text: message,
      timestamp: Date.now(),
      emotion: context.emotion || 'neutral'
    });
    
    thread.lastActivity = Date.now();
    thread.participants.add(username);
    
    // Detect sub-topics
    if (context.subTopic && !thread.subTopics.includes(context.subTopic)) {
      thread.subTopics.push(context.subTopic);
    }
    
    // Keep thread size manageable
    if (thread.messages.length > 50) {
      thread.messages = thread.messages.slice(-30);
    }
  }

  /**
   * Record a promise/commitment
   */
  recordPromise(promiseText, toUser, context = {}) {
    this.promises.push({
      promise: promiseText,
      toUser,
      timestamp: Date.now(),
      fulfilled: false,
      context,
      reminders: 0
    });
    
    console.log(`🤝 [MultiTurn] Promise recorded: "${promiseText}" to ${toUser}`);
    
    // Keep only recent promises
    if (this.promises.length > 100) {
      this.promises = this.promises.slice(-50);
    }
  }

  /**
   * Check if we have unfulfilled promises
   */
  getUnfulfilledPromises(username = null) {
    const unfulfilled = this.promises.filter(p => !p.fulfilled);
    
    if (username) {
      return unfulfilled.filter(p => p.toUser === username);
    }
    
    return unfulfilled;
  }

  /**
   * Mark promise as fulfilled
   */
  fulfillPromise(promiseText) {
    const promise = this.promises.find(p => 
      p.promise.includes(promiseText) && !p.fulfilled
    );
    
    if (promise) {
      promise.fulfilled = true;
      promise.fulfilledAt = Date.now();
      console.log(`✅ [MultiTurn] Promise fulfilled: "${promise.promise}"`);
    }
  }

  /**
   * Start a running bit/joke
   */
  startBit(setup, participants) {
    const bit = {
      setup,
      stage: 1,
      maxStage: Math.floor(Math.random() * 3) + 3, // 3-5 stages
      participants: new Set(participants),
      startedAt: Date.now(),
      lastProgression: Date.now(),
      progressions: []
    };
    
    this.runningBits.push(bit);
    
    console.log(`😂 [MultiTurn] Started running bit: "${setup.substring(0, 50)}..."`);
    
    return bit;
  }

  /**
   * Progress a running bit
   */
  progressBit(bitIndex) {
    const bit = this.runningBits[bitIndex];
    if (!bit) return null;
    
    bit.stage++;
    bit.lastProgression = Date.now();
    
    if (bit.stage >= bit.maxStage) {
      // Bit complete
      console.log(`🎯 [MultiTurn] Bit completed at stage ${bit.stage}`);
      this.runningBits.splice(bitIndex, 1);
      return { complete: true, bit };
    }
    
    return { complete: false, bit };
  }

  /**
   * Find active bits that could be progressed
   */
  getProgressableBits() {
    const now = Date.now();
    
    return this.runningBits
      .map((bit, index) => ({ bit, index }))
      .filter(({ bit }) => {
        // Don't progress too quickly
        const timeSinceLastProgress = now - bit.lastProgression;
        return timeSinceLastProgress > 300000; // 5 minutes
      });
  }

  /**
   * Record a callback opportunity
   */
  recordCallback(text, context, importance = 'medium') {
    this.callbackOpportunities.push({
      text,
      context: {
        username: context.username,
        topic: context.topic,
        emotion: context.emotion,
        timestamp: Date.now()
      },
      importance, // low, medium, high
      used: false,
      usageCount: 0
    });
    
    // Keep only important or recent callbacks
    const cutoff = Date.now() - 86400000 * 7; // 7 days
    this.callbackOpportunities = this.callbackOpportunities.filter(c =>
      c.importance === 'high' || c.timestamp > cutoff
    );
  }

  /**
   * Find relevant callback for current context
   */
  findRelevantCallback(currentContext) {
    const { topic, username, keywords = [] } = currentContext;
    
    // Find callbacks matching current context
    const relevant = this.callbackOpportunities
      .filter(c => !c.used || c.usageCount < 2)
      .filter(c => {
        // Match topic
        if (topic && c.context.topic === topic) return true;
        
        // Match user
        if (username && c.context.username === username) return true;
        
        // Match keywords
        if (keywords.some(kw => c.text.toLowerCase().includes(kw.toLowerCase()))) {
          return true;
        }
        
        return false;
      })
      .sort((a, b) => {
        // Prioritize by importance and recency
        const importanceScore = { high: 3, medium: 2, low: 1 };
        const aScore = importanceScore[a.importance] + (Date.now() - a.timestamp) / 1000000;
        const bScore = importanceScore[b.importance] + (Date.now() - b.timestamp) / 1000000;
        return bScore - aScore;
      });
    
    if (relevant.length === 0) return null;
    
    const selected = relevant[0];
    selected.used = true;
    selected.usageCount++;
    
    return selected;
  }

  /**
   * Get thread summary
   */
  getThreadSummary(threadId) {
    const thread = this.threads.get(threadId);
    if (!thread) return null;
    
    const duration = Date.now() - thread.startTime;
    const durationMinutes = Math.floor(duration / 60000);
    
    return {
      topic: thread.topic,
      participants: Array.from(thread.participants),
      messageCount: thread.messages.length,
      duration: durationMinutes,
      subTopics: thread.subTopics,
      emotionalTone: thread.emotionalTone,
      isActive: (Date.now() - thread.lastActivity) < 300000 // Active in last 5 min
    };
  }

  /**
   * Find threads to callback to
   */
  findCallbackThreads(currentTopic) {
    const relevant = [];
    
    for (const [id, thread] of this.threads.entries()) {
      // Skip very recent threads (too soon for callback)
      if (Date.now() - thread.lastActivity < 600000) continue; // 10 min
      
      // Skip very old threads (too late for callback)
      if (Date.now() - thread.lastActivity > 86400000 * 3) continue; // 3 days
      
      // Check topic similarity
      if (thread.topic === currentTopic || thread.subTopics.includes(currentTopic)) {
        relevant.push({
          id,
          thread,
          timeSince: Date.now() - thread.lastActivity
        });
      }
    }
    
    return relevant.sort((a, b) => a.timeSince - b.timeSince);
  }

  /**
   * Clean up old data
   */
  cleanup() {
    const now = Date.now();
    const threadCutoff = now - 86400000 * 7; // 7 days
    const promiseCutoff = now - 86400000 * 30; // 30 days
    
    // Remove old threads
    for (const [id, thread] of this.threads.entries()) {
      if (thread.lastActivity < threadCutoff) {
        this.threads.delete(id);
      }
    }
    
    // Remove old promises
    this.promises = this.promises.filter(p =>
      p.timestamp > promiseCutoff || !p.fulfilled
    );
    
    // Remove stale running bits
    this.runningBits = this.runningBits.filter(b =>
      now - b.lastProgression < 3600000 // 1 hour
    );
    
    console.log(`🧹 [MultiTurn] Cleanup complete: ${this.threads.size} threads, ${this.promises.length} promises`);
  }

  /**
   * Save to disk
   */
  save() {
    try {
      const data = {
        threads: Array.from(this.threads.entries()).map(([id, thread]) => [
          id,
          { ...thread, participants: Array.from(thread.participants) }
        ]).slice(-50), // Save last 50 threads
        promises: this.promises.slice(-100),
        runningBits: this.runningBits,
        callbackOpportunities: this.callbackOpportunities.slice(-100),
        lastSaved: Date.now()
      };
      
      const filePath = path.join(__dirname, '../../data/multi_turn_tracking.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
    } catch (error) {
      console.error('❌ [MultiTurn] Error saving:', error.message);
    }
  }

  /**
   * Load from disk
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/multi_turn_tracking.json');
      
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.threads = new Map(
        (data.threads || []).map(([id, thread]) => [
          id,
          { ...thread, participants: new Set(thread.participants) }
        ])
      );
      this.promises = data.promises || [];
      this.runningBits = data.runningBits || [];
      this.callbackOpportunities = data.callbackOpportunities || [];
      
      console.log('✅ [MultiTurn] Loaded tracking data from disk');
      
    } catch (error) {
      console.error('❌ [MultiTurn] Error loading:', error.message);
    }
  }
}

module.exports = MultiTurnTracking;
