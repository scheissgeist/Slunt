const fs = require('fs').promises;
const path = require('path');

/**
 * ConversationThreading - Track multi-message conversations and context chains
 * 
 * WHY THIS MATTERS:
 * - Users have conversations that span multiple messages
 * - Slunt needs to remember what was JUST discussed, not just general context
 * - Follow the flow of conversation instead of jumping topics randomly
 * - Understand when someone is replying to an earlier message
 * 
 * WHAT IT TRACKS:
 * - Active conversation threads (who's talking about what)
 * - Topic continuity (stay on topic or transition naturally)
 * - Reply chains (A says X, B replies, C adds to it)
 * - Conversation momentum (hot topics vs dead topics)
 */
class ConversationThreading {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Active threads
    this.activeThreads = new Map(); // threadId -> {topic, participants, messages, lastActivity}
    this.currentThread = null; // The thread Slunt is participating in
    
    // Topic tracking
    this.recentTopics = []; // [{ topic, timestamp, participants, messageCount }]
    this.topicTransitions = new Map(); // topic -> [topics that followed it]
    
    // Reply tracking
    this.replyChains = []; // Track who replies to whom
    
    // Stats
    this.stats = {
      threadsTracked: 0,
      topicsIdentified: 0,
      repliesDetected: 0
    };
    
    console.log('🧵 [ConversationThreading] Initialized');
  }

  /**
   * Analyze a message and update thread context
   */
  analyzeMessage(data) {
    try {
      const { username, text, timestamp } = data;
      
      // Extract topic from message
      const topic = this.extractTopic(text);
      
      // Check if this continues an existing thread
      const thread = this.findOrCreateThread(topic, username, timestamp);
      
      // Add message to thread
      thread.messages.push({
        username,
        text: text.slice(0, 200),
        timestamp,
        topic
      });
      
      // Update thread activity
      thread.lastActivity = timestamp;
      thread.participants.add(username);
      thread.messageCount++;
      
      // Detect if this is a reply to someone
      this.detectReply(data, thread);
      
      // Track topic transitions
      this.trackTopicTransition(topic);
      
      // Clean up old threads (older than 10 minutes)
      this.cleanupOldThreads(timestamp);
      
    } catch (error) {
      console.error('❌ [ConversationThreading] Error analyzing message:', error.message);
    }
  }

  /**
   * Find existing thread or create new one
   */
  findOrCreateThread(topic, username, timestamp) {
    // Look for active thread with same topic (within last 5 minutes)
    const fiveMinutesAgo = timestamp - 300000;
    
    for (const [threadId, thread] of this.activeThreads.entries()) {
      if (thread.topic === topic && thread.lastActivity > fiveMinutesAgo) {
        return thread;
      }
    }
    
    // Create new thread
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const thread = {
      id: threadId,
      topic,
      participants: new Set([username]),
      messages: [],
      startTime: timestamp,
      lastActivity: timestamp,
      messageCount: 0
    };
    
    this.activeThreads.set(threadId, thread);
    this.stats.threadsTracked++;
    
    return thread;
  }

  /**
   * Extract topic from message
   */
  extractTopic(text) {
    const lower = text.toLowerCase();
    
    // Specific topic patterns
    if (/\b(game|gaming|play|stream)\b/.test(lower)) return 'gaming';
    if (/\b(video|watch|youtube|clip)\b/.test(lower)) return 'video';
    if (/\b(anime|manga|weeb)\b/.test(lower)) return 'anime';
    if (/\b(music|song|album|artist)\b/.test(lower)) return 'music';
    if (/\b(politic|trump|biden|election)\b/.test(lower)) return 'politics';
    if (/\b(meme|lmao|bruh|based)\b/.test(lower)) return 'memes';
    if (/\b(tech|computer|phone|app)\b/.test(lower)) return 'tech';
    if (/\b(sports|game|team|player)\b/.test(lower)) return 'sports';
    
    // If no specific topic, look at key words
    const words = text.split(/\s+/).filter(w => w.length > 3);
    if (words.length > 0) {
      return words[0].toLowerCase(); // Use first significant word
    }
    
    return 'general';
  }

  /**
   * Detect if message is replying to someone
   */
  detectReply(data, thread) {
    const { username, text } = data;
    
    // Look for reply indicators
    const mentionsUser = /@(\w+)/.exec(text);
    const hasReplyWord = /^(yeah|nah|lol|lmao|bruh|true|facts|exactly|wait|what|huh)/i.test(text);
    
    if (mentionsUser || hasReplyWord) {
      // This is likely a reply
      const recentMessages = thread.messages.slice(-5);
      const possibleTarget = recentMessages[recentMessages.length - 1];
      
      if (possibleTarget && possibleTarget.username !== username) {
        this.replyChains.push({
          from: username,
          to: possibleTarget.username,
          text: text.slice(0, 100),
          timestamp: data.timestamp
        });
        
        this.stats.repliesDetected++;
        
        // Keep only last 50 reply chains
        if (this.replyChains.length > 50) {
          this.replyChains.shift();
        }
      }
    }
  }

  /**
   * Track topic transitions (what topics follow other topics)
   */
  trackTopicTransition(currentTopic) {
    if (this.recentTopics.length > 0) {
      const previousTopic = this.recentTopics[this.recentTopics.length - 1].topic;
      
      if (previousTopic !== currentTopic) {
        // Topic changed
        if (!this.topicTransitions.has(previousTopic)) {
          this.topicTransitions.set(previousTopic, []);
        }
        this.topicTransitions.get(previousTopic).push(currentTopic);
        
        // Keep only last 20 transitions per topic
        if (this.topicTransitions.get(previousTopic).length > 20) {
          this.topicTransitions.get(previousTopic).shift();
        }
      }
    }
    
    // Add to recent topics
    this.recentTopics.push({
      topic: currentTopic,
      timestamp: Date.now(),
      messageCount: 1
    });
    
    // Keep only last 10 topics
    if (this.recentTopics.length > 10) {
      this.recentTopics.shift();
    }
    
    this.stats.topicsIdentified++;
  }

  /**
   * Clean up threads older than 10 minutes
   */
  cleanupOldThreads(currentTimestamp) {
    const tenMinutesAgo = currentTimestamp - 600000;
    
    for (const [threadId, thread] of this.activeThreads.entries()) {
      if (thread.lastActivity < tenMinutesAgo) {
        this.activeThreads.delete(threadId);
      }
    }
  }

  /**
   * Get context for current conversation
   */
  getThreadContext() {
    const context = [];
    
    // Get most active thread
    let mostActiveThread = null;
    let maxMessages = 0;
    
    for (const thread of this.activeThreads.values()) {
      if (thread.messageCount > maxMessages) {
        maxMessages = thread.messageCount;
        mostActiveThread = thread;
      }
    }
    
    if (mostActiveThread) {
      context.push(`ACTIVE CONVERSATION about "${mostActiveThread.topic}"`);
      context.push(`Participants: ${Array.from(mostActiveThread.participants).join(', ')}`);
      
      // Get last 3 messages from thread
      const recentMessages = mostActiveThread.messages.slice(-3);
      if (recentMessages.length > 0) {
        context.push('Recent discussion:');
        recentMessages.forEach(msg => {
          context.push(`  ${msg.username}: ${msg.text.slice(0, 80)}`);
        });
      }
      
      this.currentThread = mostActiveThread;
    }
    
    // Add recent topic flow
    if (this.recentTopics.length >= 2) {
      const topicFlow = this.recentTopics.slice(-3).map(t => t.topic).join(' → ');
      context.push(`Topic flow: ${topicFlow}`);
    }
    
    return context.length > 0 ? context.join('\n') : null;
  }

  /**
   * Should Slunt respond? (based on thread participation)
   */
  shouldRespondToThread() {
    if (!this.currentThread) return false;
    
    // If Slunt is already in the thread, higher chance to continue
    if (this.currentThread.participants.has('Slunt')) {
      return Math.random() < 0.7; // 70% chance
    }
    
    // If thread is very active (4+ messages), jump in
    if (this.currentThread.messageCount >= 4) {
      return Math.random() < 0.4; // 40% chance
    }
    
    return Math.random() < 0.15; // 15% base chance
  }

  /**
   * Get natural topic transition
   */
  getNaturalTransition(currentTopic) {
    // Look at what topics naturally follow the current topic
    if (this.topicTransitions.has(currentTopic)) {
      const transitions = this.topicTransitions.get(currentTopic);
      const uniqueTransitions = [...new Set(transitions)];
      
      if (uniqueTransitions.length > 0) {
        return uniqueTransitions[Math.floor(Math.random() * uniqueTransitions.length)];
      }
    }
    
    return null;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      activeThreads: this.activeThreads.size,
      recentTopics: this.recentTopics.length,
      replyChains: this.replyChains.length
    };
  }
}

module.exports = ConversationThreading;
