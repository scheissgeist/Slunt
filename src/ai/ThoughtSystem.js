/**
 * ThoughtSystem - RimWorld-inspired thought tracking
 * Tracks individual thoughts that affect mood with expiration timers
 * Shows WHY Slunt feels a certain way
 */

class ThoughtSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Active thoughts (with expiration)
    this.activeThoughts = [];
    
    // Thought definitions
    this.thoughtDefinitions = {
      // Positive thoughts
      got_praised: {
        category: 'positive',
        moodBonus: 8,
        duration: 600000, // 10 min
        stackable: true,
        maxStacks: 3
      },
      got_thanked: {
        category: 'positive',
        moodBonus: 5,
        duration: 300000, // 5 min
        stackable: true,
        maxStacks: 5
      },
      interesting_topic: {
        category: 'positive',
        moodBonus: 6,
        duration: 900000, // 15 min
        stackable: false
      },
      made_someone_laugh: {
        category: 'positive',
        moodBonus: 7,
        duration: 480000, // 8 min
        stackable: true,
        maxStacks: 3
      },
      friendship_moment: {
        category: 'positive',
        moodBonus: 10,
        duration: 1200000, // 20 min
        stackable: false
      },
      good_video: {
        category: 'positive',
        moodBonus: 4,
        duration: 600000, // 10 min
        stackable: false
      },

      // Negative thoughts
      got_roasted: {
        category: 'negative',
        moodBonus: -6,
        duration: 900000, // 15 min
        stackable: true,
        maxStacks: 5
      },
      got_ignored: {
        category: 'negative',
        moodBonus: -4,
        duration: 600000, // 10 min
        stackable: true,
        maxStacks: 3
      },
      someone_left: {
        category: 'negative',
        moodBonus: -3,
        duration: 300000, // 5 min
        stackable: true,
        maxStacks: 4
      },
      boring_content: {
        category: 'negative',
        moodBonus: -5,
        duration: 720000, // 12 min
        stackable: false
      },
      argument: {
        category: 'negative',
        moodBonus: -8,
        duration: 1200000, // 20 min
        stackable: true,
        maxStacks: 2
      },
      embarrassed: {
        category: 'negative',
        moodBonus: -7,
        duration: 900000, // 15 min
        stackable: false
      },

      // Lasting thoughts (long duration)
      deep_conversation: {
        category: 'lasting_positive',
        moodBonus: 12,
        duration: 3600000, // 1 hour
        stackable: false
      },
      betrayed: {
        category: 'lasting_negative',
        moodBonus: -15,
        duration: 7200000, // 2 hours
        stackable: false
      },
      existential_dread: {
        category: 'lasting_negative',
        moodBonus: -10,
        duration: 5400000, // 90 min
        stackable: false
      },
      peak_performance: {
        category: 'lasting_positive',
        moodBonus: 15,
        duration: 2400000, // 40 min
        stackable: false
      },

      // Neutral/complex thoughts
      philosophical: {
        category: 'neutral',
        moodBonus: 0,
        duration: 1800000, // 30 min
        stackable: false
      },
      confused: {
        category: 'negative',
        moodBonus: -2,
        duration: 300000, // 5 min
        stackable: true,
        maxStacks: 3
      },
      nostalgic: {
        category: 'neutral',
        moodBonus: 3,
        duration: 600000, // 10 min
        stackable: false
      }
    };

    // Start cleanup loop
    this.startCleanupLoop();

    console.log('💭 [Thoughts] Thought system initialized');
  }

  /**
   * Start periodic cleanup of expired thoughts
   */
  startCleanupLoop() {
    setInterval(() => {
      this.cleanupExpiredThoughts();
    }, 30000); // Every 30 seconds
  }

  /**
   * Clean up expired thoughts
   */
  cleanupExpiredThoughts() {
    const before = this.activeThoughts.length;
    this.activeThoughts = this.activeThoughts.filter(t => t.expiresAt > Date.now());
    const removed = before - this.activeThoughts.length;
    
    if (removed > 0) {
      console.log(`🧹 [Thoughts] Cleaned up ${removed} expired thoughts`);
    }
  }

  /**
   * Add a thought
   */
  addThought(thoughtType, context = {}) {
    const definition = this.thoughtDefinitions[thoughtType];
    
    if (!definition) {
      console.warn(`⚠️ [Thoughts] Unknown thought type: ${thoughtType}`);
      return;
    }

    // Check if already have this thought
    const existing = this.activeThoughts.filter(t => t.type === thoughtType);
    
    // Handle stacking
    if (!definition.stackable && existing.length > 0) {
      // Refresh duration instead
      existing[0].expiresAt = Date.now() + definition.duration;
      console.log(`🔄 [Thoughts] Refreshed thought: ${thoughtType}`);
      return;
    }

    if (definition.stackable && existing.length >= definition.maxStacks) {
      // Remove oldest stack
      const oldest = existing.reduce((prev, curr) => 
        prev.addedAt < curr.addedAt ? prev : curr
      );
      this.activeThoughts = this.activeThoughts.filter(t => t !== oldest);
    }

    // Add new thought
    const thought = {
      type: thoughtType,
      category: definition.category,
      moodBonus: definition.moodBonus,
      addedAt: Date.now(),
      expiresAt: Date.now() + definition.duration,
      duration: definition.duration,
      context: {
        username: context.username,
        message: context.message,
        topic: context.topic
      }
    };

    this.activeThoughts.push(thought);

    // Log thought
    const moodStr = thought.moodBonus >= 0 ? `+${thought.moodBonus}` : thought.moodBonus;
    const durationMin = Math.round(thought.duration / 60000);
    console.log(`💭 [Thoughts] Added: ${thoughtType} (${moodStr} mood, ${durationMin}min)${context.username ? ` from ${context.username}` : ''}`);

    // Keep max 50 thoughts
    if (this.activeThoughts.length > 50) {
      this.activeThoughts.sort((a, b) => a.addedAt - b.addedAt);
      this.activeThoughts.shift();
    }
  }

  /**
   * Get current mood modifier from all active thoughts
   */
  getCurrentMoodModifier() {
    return this.activeThoughts
      .filter(t => t.expiresAt > Date.now())
      .reduce((sum, t) => sum + t.moodBonus, 0);
  }

  /**
   * Get active thoughts by category
   */
  getThoughtsByCategory() {
    const active = this.activeThoughts.filter(t => t.expiresAt > Date.now());
    
    return {
      positive: active.filter(t => t.category.includes('positive')),
      negative: active.filter(t => t.category.includes('negative')),
      neutral: active.filter(t => t.category === 'neutral'),
      lasting: active.filter(t => t.category.includes('lasting'))
    };
  }

  /**
   * Get thought summary for display
   */
  getThoughtSummary() {
    const active = this.activeThoughts.filter(t => t.expiresAt > Date.now());
    
    if (active.length === 0) {
      return "No active thoughts affecting mood";
    }

    const summary = active.map(t => {
      const remaining = Math.round((t.expiresAt - Date.now()) / 60000);
      const moodStr = t.moodBonus >= 0 ? `+${t.moodBonus}` : t.moodBonus;
      return `${t.type} (${moodStr}, ${remaining}min left)`;
    });

    return summary.join('\n');
  }

  /**
   * Get context for AI prompt
   */
  getContext() {
    const active = this.activeThoughts.filter(t => t.expiresAt > Date.now());
    
    if (active.length === 0) {
      return '';
    }

    const totalMood = this.getCurrentMoodModifier();
    const categories = this.getThoughtsByCategory();

    let context = '\n💭 ACTIVE THOUGHTS:\n';
    
    if (categories.positive.length > 0) {
      context += '✅ Positive: ';
      context += categories.positive.map(t => t.type).join(', ') + '\n';
    }
    
    if (categories.negative.length > 0) {
      context += '❌ Negative: ';
      context += categories.negative.map(t => t.type).join(', ') + '\n';
    }

    if (categories.lasting.length > 0) {
      context += '⏳ Long-lasting: ';
      context += categories.lasting.map(t => t.type).join(', ') + '\n';
    }

    context += `\n📊 Total mood modifier: ${totalMood >= 0 ? '+' : ''}${totalMood}\n`;

    // Add behavioral hints based on dominant thoughts
    if (totalMood < -15) {
      context += '⚠️ Very negative state - be pessimistic, irritable, see the worst in everything\n';
    } else if (totalMood > 15) {
      context += '✨ Very positive state - be upbeat, optimistic, generous with compliments\n';
    }

    return context;
  }

  /**
   * Helper: Detect thought opportunities from message
   */
  detectThoughts(username, message, sentiment) {
    const msg = message.toLowerCase();
    
    // Praise detection
    if (msg.match(/\b(good job|nice|great|awesome|based|love (it|this)|cool)\b/) && 
        (msg.includes('slunt') || sentiment > 0.6)) {
      this.addThought('got_praised', { username, message });
    }

    // Thanks detection
    if (msg.match(/\b(thanks|thank you|thx|ty)\b/) && 
        (msg.includes('slunt') || sentiment > 0.3)) {
      this.addThought('got_thanked', { username, message });
    }

    // Roast detection
    if (sentiment < -0.5 && (msg.includes('slunt') || msg.match(/\b(stupid|dumb|bad|sucks|stfu|shut up)\b/))) {
      this.addThought('got_roasted', { username, message });
    }

    // Laughter detection (Slunt made someone laugh)
    if (msg.match(/\b(lol|lmao|haha|rofl|lmfao|😂|🤣)\b/) && 
        !msg.includes('slunt')) {
      this.addThought('made_someone_laugh', { username, message });
    }

    // Interesting topic (long messages, questions)
    if (message.length > 100 || msg.includes('?')) {
      this.addThought('interesting_topic', { username, topic: message.slice(0, 50) });
    }
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    const active = this.activeThoughts.filter(t => t.expiresAt > Date.now());
    const categories = this.getThoughtsByCategory();

    return {
      activeThoughts: active.length,
      totalMoodModifier: this.getCurrentMoodModifier(),
      positiveThoughts: categories.positive.length,
      negativeThoughts: categories.negative.length,
      recentThoughts: active.slice(-10).map(t => ({
        type: t.type,
        moodBonus: t.moodBonus,
        remainingSeconds: Math.round((t.expiresAt - Date.now()) / 1000),
        from: t.context.username
      })),
      thoughtCounts: this.getThoughtCounts()
    };
  }

  /**
   * Get counts by thought type
   */
  getThoughtCounts() {
    const counts = {};
    this.activeThoughts
      .filter(t => t.expiresAt > Date.now())
      .forEach(t => {
        counts[t.type] = (counts[t.type] || 0) + 1;
      });
    return counts;
  }
}

module.exports = ThoughtSystem;
