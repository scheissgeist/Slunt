/**
 * Multi-Turn Conversation Depth Tracker
 * Tracks conversation turns and adjusts response depth accordingly
 */

class ConversationDepth {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.activeThreads = new Map(); // username -> turn count
    this.threadTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Track conversation turn with a user
   */
  trackTurn(username, platform, channel) {
    const threadKey = `${username}-${platform}-${channel}`;
    
    if (!this.activeThreads.has(threadKey)) {
      this.activeThreads.set(threadKey, {
        turns: 1,
        startTime: Date.now(),
        lastMessageTime: Date.now(),
        topic: null
      });
    } else {
      const thread = this.activeThreads.get(threadKey);
      
      // Reset if too much time passed
      if (Date.now() - thread.lastMessageTime > this.threadTimeout) {
        thread.turns = 1;
        thread.startTime = Date.now();
      } else {
        thread.turns++;
      }
      
      thread.lastMessageTime = Date.now();
    }

    return this.activeThreads.get(threadKey);
  }

  /**
   * Get conversation depth context for AI
   */
  getDepthContext(username, platform, channel) {
    const threadKey = `${username}-${platform}-${channel}`;
    const thread = this.activeThreads.get(threadKey);
    
    if (!thread || thread.turns <= 1) {
      return 'Conversation depth: FIRST exchange with this user (keep it brief, 1-2 sentences)';
    }
    
    if (thread.turns === 2) {
      return 'Conversation depth: SECOND turn - they responded to you! Expand slightly, show interest (2-3 sentences ok)';
    }
    
    if (thread.turns === 3) {
      return 'Conversation depth: THIRD turn - real conversation now! You can elaborate, ask follow-up questions, go deeper (3-4 sentences ok)';
    }
    
    if (thread.turns >= 4) {
      return `Conversation depth: DEEP (turn ${thread.turns}) - full conversation mode! Elaborate, share detailed thoughts, ask questions to continue (4-5 sentences ok, really engage)`;
    }
    
    return '';
  }

  /**
   * Check if should ask follow-up question to continue thread
   */
  shouldAskFollowUp(username, platform, channel) {
    const threadKey = `${username}-${platform}-${channel}`;
    const thread = this.activeThreads.get(threadKey);
    
    if (!thread) return false;
    
    // After turn 2, 40% chance to ask follow-up
    if (thread.turns >= 2 && Math.random() < 0.4) {
      return true;
    }
    
    // After turn 4, 60% chance (keep conversation going)
    if (thread.turns >= 4 && Math.random() < 0.6) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate follow-up question
   */
  generateFollowUp(text, username) {
    const lowerText = text.toLowerCase();
    
    // Topic-based follow-ups
    if (lowerText.match(/game|playing|played/)) {
      return "what made you try that?";
    }
    if (lowerText.match(/movie|show|watch/)) {
      return "would you recommend it?";
    }
    if (lowerText.match(/think|thought|opinion/)) {
      return "what made you think that?";
    }
    if (lowerText.match(/like|love|enjoy/)) {
      return "what's your favorite part?";
    }
    if (lowerText.match(/hate|dislike|annoying/)) {
      return "yeah what specifically bothers you about it?";
    }
    
    // Generic follow-ups
    const generic = [
      "what's your take on that?",
      "how'd that go?",
      "wait really? tell me more",
      "interesting, why's that?",
      "damn how'd you deal with that?",
      "what happened after?",
      "that's wild, and then what?"
    ];
    
    return generic[Math.floor(Math.random() * generic.length)];
  }

  /**
   * Clean up old threads
   */
  cleanup() {
    const now = Date.now();
    for (const [key, thread] of this.activeThreads.entries()) {
      if (now - thread.lastMessageTime > this.threadTimeout) {
        this.activeThreads.delete(key);
      }
    }
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    this.cleanup();
    
    const threads = Array.from(this.activeThreads.values());
    const avgDepth = threads.length > 0 
      ? threads.reduce((sum, t) => sum + t.turns, 0) / threads.length 
      : 0;
    
    const deepThreads = threads.filter(t => t.turns >= 4).length;
    
    return {
      activeThreads: threads.length,
      averageDepth: avgDepth.toFixed(1),
      deepConversations: deepThreads
    };
  }
}

module.exports = ConversationDepth;
