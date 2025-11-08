const fs = require('fs').promises;
const path = require('path');

/**
 * Conversational Memory Threads
 * Tracks multi-message conversations as threads for narrative continuity
 */
class ConversationThreads {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.aiEngine = chatBot.ai; // Reference to AI engine
    
    // Active conversation threads
    this.activeThreads = new Map(); // threadId -> thread data
    this.userThreads = new Map(); // username -> active thread IDs
    
    // Unfinished business
    this.pendingTopics = []; // Topics Slunt wants to return to
    this.abandonedThreads = []; // Threads that were interrupted
    
    // Thread tracking
    this.threadTimeout = 5 * 60 * 1000; // 5 minutes before thread goes dormant
    this.maxActiveThreads = 10;
    
    // Stats
    this.stats = {
      threadsCreated: 0,
      threadsCompleted: 0,
      threadsAbandoned: 0,
      callbacks: 0
    };
    
    this.dataPath = path.join(__dirname, '../../data/conversation_threads.json');
    this.load();
    
    // Periodic cleanup
    setInterval(() => this.cleanupOldThreads(), 60000); // Every minute
  }

  /**
   * Process a message and update thread tracking
   */
  async processMessage(username, message, context = {}) {
    const messageData = {
      username,
      message,
      timestamp: Date.now(),
      context
    };

    // Check if this continues an existing thread
    const activeThread = this.findActiveThread(username);
    
    if (activeThread) {
      // Add to existing thread
      activeThread.messages.push(messageData);
      activeThread.lastUpdate = Date.now();
      
      // Less aggressive abandonment - require 3+ messages on new topic
      // OR 5+ minutes gap before declaring topic changed
      const messagesInThread = activeThread.messages.length;
      const timeSinceLastMessage = Date.now() - activeThread.lastUpdate;
      
      if (messagesInThread >= 3 && timeSinceLastMessage < 300000) {
        // Still active - analyze if thread topic is still relevant
        const stillRelevant = await this.isThreadStillRelevant(activeThread, message);
        
        if (!stillRelevant) {
          // Thread topic changed - but only after 3+ messages
          this.markThreadAbandoned(activeThread, 'topic_changed');
          return await this.createNewThread(username, message, context);
        }
      } else if (timeSinceLastMessage >= 300000) {
        // 5+ minute gap - natural conversation break
        this.markThreadAbandoned(activeThread, 'timeout');
        return await this.createNewThread(username, message, context);
      }
      
      return activeThread;
    } else {
      // Check if this references an old thread
      const referencedThread = await this.detectThreadReference(username, message);
      
      if (referencedThread) {
        // Reactivate old thread
        return this.reactivateThread(referencedThread, messageData);
      }
      
      // Create new thread
      return await this.createNewThread(username, message, context);
    }
  }

  /**
   * Create a new conversation thread
   */
  async createNewThread(username, message, context = {}) {
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use AI to identify the thread topic
    const topic = await this.identifyTopic(message, context);
    
    const thread = {
      id: threadId,
      participants: [username, 'Slunt'],
      topic: topic,
      messages: [{
        username,
        message,
        timestamp: Date.now(),
        context
      }],
      startTime: Date.now(),
      lastUpdate: Date.now(),
      status: 'active',
      sluntEngagement: 0, // How interested Slunt is
      emotionalTone: 'neutral'
    };

    this.activeThreads.set(threadId, thread);
    
    // Track user's active threads
    if (!this.userThreads.has(username)) {
      this.userThreads.set(username, []);
    }
    this.userThreads.get(username).push(threadId);
    
    this.stats.threadsCreated++;
    this.save();
    
    console.log(`🧵 [Threads] New thread created: "${topic}" with ${username}`);
    
    return thread;
  }

  /**
   * Use AI to identify conversation topic
   */
  async identifyTopic(message, context = {}) {
    // Simple keyword-based topic detection (AI method removed)
    const lower = message.toLowerCase();
    
    // Common topics
    if (lower.includes('video') || lower.includes('watch') || lower.includes('movie')) return 'videos';
    if (lower.includes('game') || lower.includes('play')) return 'gaming';
    if (lower.includes('music') || lower.includes('song')) return 'music';
    if (lower.includes('food') || lower.includes('eat')) return 'food';
    
    // Extract key words
    const words = message.split(/\s+/).filter(w => w.length > 4);
    return words[0] ? words[0].toLowerCase() : 'general chat';
  }

  /**
   * Check if current message is still relevant to thread topic
   */
  async isThreadStillRelevant(thread, newMessage) {
    if (thread.messages.length < 2) return true; // Too early to tell
    
    const recentMessages = thread.messages.slice(-3).map(m => m.message).join('\n');
    
    const prompt = `Thread topic: "${thread.topic}"

Recent messages in thread:
${recentMessages}

New message: "${newMessage}"

Is this new message still about "${thread.topic}" or has the conversation shifted to a different topic?
Answer with just: SAME or DIFFERENT`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.2,
        max_tokens: 10
      });
      
      return response.trim().toUpperCase().includes('SAME');
    } catch (error) {
      console.error('Failed to check thread relevance:', error);
      return true; // Assume same on error
    }
  }

  /**
   * Detect if message references a previous conversation thread
   */
  async detectThreadReference(username, message) {
    // Look for temporal references
    const temporalKeywords = ['earlier', 'before', 'you said', 'remember when', 'back to', 'about that'];
    const hasTemporalRef = temporalKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (!hasTemporalRef) return null;
    
    // Get user's recent abandoned threads
    const userThreadIds = this.userThreads.get(username) || [];
    const recentThreads = userThreadIds
      .map(id => this.abandonedThreads.find(t => t.id === id))
      .filter(Boolean)
      .slice(-5); // Last 5 abandoned threads
    
    if (recentThreads.length === 0) return null;
    
    // Use AI to match message to thread
    const threadSummaries = recentThreads.map((t, i) => 
      `${i + 1}. "${t.topic}" (${this.getRelativeTime(t.lastUpdate)})`
    ).join('\n');
    
    const prompt = `User says: "${message}"

Their recent conversation threads:
${threadSummaries}

Which thread (if any) is the user referring back to? Answer with just the number, or NONE if not referencing any.`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.2,
        max_tokens: 5
      });
      
      const match = response.match(/\d+/);
      if (match) {
        const index = parseInt(match[0]) - 1;
        if (index >= 0 && index < recentThreads.length) {
          return recentThreads[index];
        }
      }
    } catch (error) {
      console.error('Failed to detect thread reference:', error);
    }
    
    return null;
  }

  /**
   * Reactivate an abandoned thread
   */
  reactivateThread(thread, newMessage) {
    // Move from abandoned to active
    const index = this.abandonedThreads.findIndex(t => t.id === thread.id);
    if (index !== -1) {
      this.abandonedThreads.splice(index, 1);
    }
    
    thread.status = 'active';
    thread.messages.push(newMessage);
    thread.lastUpdate = Date.now();
    
    this.activeThreads.set(thread.id, thread);
    
    console.log(`🧵 [Threads] Reactivated thread: "${thread.topic}"`);
    this.save();
    
    return thread;
  }

  /**
   * Mark thread as abandoned
   */
  markThreadAbandoned(thread, reason = 'timeout') {
    thread.status = 'abandoned';
    thread.abandonedAt = Date.now();
    thread.abandonReason = reason;
    
    this.activeThreads.delete(thread.id);
    this.abandonedThreads.push(thread);
    
    // Keep only last 50 abandoned threads
    if (this.abandonedThreads.length > 50) {
      this.abandonedThreads.shift();
    }
    
    this.stats.threadsAbandoned++;
    
    // Maybe add to pending topics for callback
    if (thread.sluntEngagement > 50 && reason === 'topic_changed') {
      this.addPendingTopic(thread);
    }
    
    console.log(`🧵 [Threads] Thread abandoned: "${thread.topic}" (${reason})`);
    this.save();
  }

  /**
   * Add thread to pending topics for potential callback
   */
  addPendingTopic(thread) {
    const pending = {
      threadId: thread.id,
      topic: thread.topic,
      participants: thread.participants,
      addedAt: Date.now(),
      priority: thread.sluntEngagement
    };
    
    this.pendingTopics.push(pending);
    
    // Keep only top 20 by priority
    this.pendingTopics.sort((a, b) => b.priority - a.priority);
    this.pendingTopics = this.pendingTopics.slice(0, 20);
  }

  /**
   * Get a callback to an old conversation (for Slunt to use)
   */
  async getCallback(currentContext = {}) {
    if (this.pendingTopics.length === 0) return null;
    if (Math.random() > 0.15) return null; // 15% chance
    
    // Pick a pending topic
    const pending = this.pendingTopics[Math.floor(Math.random() * Math.min(5, this.pendingTopics.length))];
    const thread = this.abandonedThreads.find(t => t.id === pending.threadId);
    
    if (!thread) return null;
    
    // Generate callback using AI
    const lastMessages = thread.messages.slice(-3).map(m => `${m.username}: ${m.message}`).join('\n');
    
    const prompt = `You're Slunt, a casual dude in a chat room. You were talking about "${thread.topic}" ${this.getRelativeTime(thread.lastUpdate)}, but the conversation moved on.

Last messages from that thread:
${lastMessages}

Generate a natural, casual way to bring this topic back up now. Be brief and sound like you just remembered it.
Don't use quotation marks. Just the callback phrase:`;

    try {
      const callback = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.8,
        max_tokens: 50
      });
      
      // Remove pending topic
      const index = this.pendingTopics.findIndex(p => p.threadId === thread.id);
      if (index !== -1) {
        this.pendingTopics.splice(index, 1);
      }
      
      this.stats.callbacks++;
      console.log(`🧵 [Threads] Generated callback to "${thread.topic}"`);
      
      return {
        text: callback.trim(),
        threadId: thread.id,
        topic: thread.topic
      };
    } catch (error) {
      console.error('Failed to generate callback:', error);
      return null;
    }
  }

  /**
   * Find active thread for user
   */
  findActiveThread(username) {
    const userThreadIds = this.userThreads.get(username) || [];
    
    for (const threadId of userThreadIds) {
      const thread = this.activeThreads.get(threadId);
      if (thread && thread.status === 'active') {
        return thread;
      }
    }
    
    return null;
  }

  /**
   * Get thread summary for context
   */
  getThreadSummary(threadId) {
    const thread = this.activeThreads.get(threadId) || 
                   this.abandonedThreads.find(t => t.id === threadId);
    
    if (!thread) return null;
    
    return {
      topic: thread.topic,
      messageCount: thread.messages.length,
      participants: thread.participants,
      duration: Date.now() - thread.startTime,
      recentMessages: thread.messages.slice(-5).map(m => ({
        username: m.username,
        message: m.message
      }))
    };
  }

  /**
   * Cleanup old threads
   */
  cleanupOldThreads() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [threadId, thread] of this.activeThreads.entries()) {
      if (now - thread.lastUpdate > this.threadTimeout) {
        this.markThreadAbandoned(thread, 'timeout');
        cleaned++;
      }
    }
    
    // Limit active threads
    if (this.activeThreads.size > this.maxActiveThreads) {
      const sorted = Array.from(this.activeThreads.values())
        .sort((a, b) => a.lastUpdate - b.lastUpdate);
      
      const toRemove = sorted.slice(0, this.activeThreads.size - this.maxActiveThreads);
      toRemove.forEach(thread => this.markThreadAbandoned(thread, 'limit'));
    }
    
    if (cleaned > 0) {
      console.log(`🧵 [Threads] Cleaned up ${cleaned} old threads`);
    }
  }

  /**
   * Get relative time string
   */
  getRelativeTime(timestamp) {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  /**
   * Get status for dashboard
   */
  getStatus() {
    return {
      activeThreads: this.activeThreads.size,
      abandonedThreads: this.abandonedThreads.length,
      pendingTopics: this.pendingTopics.length,
      stats: this.stats,
      recentThreads: Array.from(this.activeThreads.values())
        .slice(-5)
        .map(t => ({
          topic: t.topic,
          participants: t.participants,
          messageCount: t.messages.length,
          age: this.getRelativeTime(t.startTime)
        }))
    };
  }

  /**
   * Save state to disk
   */
  async save() {
    try {
      const data = {
        abandonedThreads: this.abandonedThreads.slice(-30), // Keep last 30
        pendingTopics: this.pendingTopics,
        stats: this.stats
      };
      
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save conversation threads:', error);
    }
  }

  /**
   * Load state from disk
   */
  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      
      // Try to parse JSON
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch (parseError) {
        console.error('🧵 [Threads] JSON corruption detected:', parseError.message);
        
        // Try to salvage data by truncating at error position
        const match = parseError.message.match(/position (\d+)/);
        if (match) {
          const errorPos = parseInt(match[1]);
          console.log(`🧵 [Threads] Attempting to salvage data up to position ${errorPos}`);
          
          try {
            // Try parsing truncated data
            const truncated = data.substring(0, errorPos);
            // Find last complete object
            const lastBrace = truncated.lastIndexOf('}');
            if (lastBrace > 0) {
              parsed = JSON.parse(truncated.substring(0, lastBrace + 1));
              console.log('🧵 [Threads] Successfully salvaged partial data');
            }
          } catch (salvageError) {
            console.error('🧵 [Threads] Could not salvage data, starting fresh');
            parsed = null;
          }
        }
        
        // Create backup of corrupted file
        if (!parsed) {
          const backupPath = this.dataPath + '.corrupted.' + Date.now();
          await fs.writeFile(backupPath, data, 'utf8');
          console.log(`🧵 [Threads] Backed up corrupted file to ${backupPath}`);
        }
      }
      
      if (parsed) {
        this.abandonedThreads = parsed.abandonedThreads || [];
        this.pendingTopics = parsed.pendingTopics || [];
        this.stats = parsed.stats || this.stats;
        
        console.log(`🧵 [Threads] Loaded ${this.abandonedThreads.length} abandoned threads and ${this.pendingTopics.length} pending topics`);
      } else {
        console.log('🧵 [Threads] Starting with fresh data');
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('🧵 [Threads] Failed to load conversation threads:', error);
      }
    }
  }
}

module.exports = ConversationThreads;
