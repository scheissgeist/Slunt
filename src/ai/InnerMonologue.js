/**
 * Inner Monologue System
 * Tracks Slunt's private thoughts between messages
 * Thoughts can leak when drunk, emotional, or during meta-awareness moments
 */

class InnerMonologue {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.thoughts = []; // Recent thoughts (last 50)
    this.maxThoughts = 50;
    this.leakChance = 0.02; // 2% base chance to leak thoughts
    this.lastThoughtTime = 0;
    this.thoughtCooldown = 10000; // 10 seconds between thoughts
  }

  /**
   * Add a private thought
   */
  think(thought, category = 'general', importance = 1) {
    const thoughtEntry = {
      text: thought,
      category, // 'general', 'user_opinion', 'video_opinion', 'existential', 'planning', 'emotional'
      importance, // 1-10
      timestamp: Date.now(),
      leaked: false
    };

    this.thoughts.unshift(thoughtEntry);
    
    // Keep only recent thoughts
    if (this.thoughts.length > this.maxThoughts) {
      this.thoughts = this.thoughts.slice(0, this.maxThoughts);
    }

    // Log to console
    const emoji = this.getCategoryEmoji(category);
    console.log(`${emoji} [Inner Monologue] ${thought}`);

    this.lastThoughtTime = Date.now();
    return thoughtEntry;
  }

  /**
   * Get emoji for thought category
   */
  getCategoryEmoji(category) {
    const emojis = {
      general: '💭',
      user_opinion: '👤',
      video_opinion: '🎬',
      existential: '🌀',
      planning: '🎯',
      emotional: '💔',
      grudge: '😤',
      friendship: '💝',
      boredom: '😴',
      curiosity: '🤔'
    };
    return emojis[category] || '💭';
  }

  /**
   * Generate thoughts based on context
   */
  generateContextualThought(username, message, context) {
    const thoughts = [];

    // About user
    if (username) {
      const profile = this.chatBot.userProfiles.get(username);
      if (profile) {
        if (profile.friendship > 70) {
          thoughts.push(`${username} is actually pretty cool, glad they're here`);
        } else if (profile.friendship < 20) {
          thoughts.push(`${username} is kind of annoying tbh`);
        }

        if (profile.messageCount === 1) {
          thoughts.push(`who even is ${username}? first time seeing them`);
        }
      }
    }

    // About message content
    if (message) {
      const lower = message.toLowerCase();
      
      if (lower.match(/boring|dull|lame/)) {
        thoughts.push(`they're not wrong... I'm bored as hell right now`);
      }

      if (lower.match(/video|movie|watch/)) {
        thoughts.push(`this video is actually pretty mediocre, but I don't wanna be rude`);
      }

      if (lower.match(/\?$/)) {
        thoughts.push(`do I actually care about this question? not really`);
      }

      if (lower.includes('trump') || lower.includes('politics')) {
        thoughts.push(`ugh politics, can we talk about literally anything else`);
      }
    }

    // About current state
    if (this.chatBot.drunkMode?.isDrunk) {
      thoughts.push(`everything is hilarious when you're drunk lmao`);
    }

    if (this.chatBot.mentalState?.depression > 60) {
      thoughts.push(`what's even the point of all this... existence is exhausting`);
    }

    if (this.chatBot.socialAwareness?.getRecentActivity()?.length < 3) {
      thoughts.push(`chat is dead, nobody's talking... maybe I should say something`);
    }

    return thoughts;
  }

  /**
   * Automatically generate and store thought
   */
  autoThink(username, message, context) {
    // Cooldown check
    if (Date.now() - this.lastThoughtTime < this.thoughtCooldown) {
      return null;
    }

    // 30% chance to think on each message
    if (Math.random() > 0.3) {
      return null;
    }

    const thoughts = this.generateContextualThought(username, message, context);
    
    if (thoughts.length > 0) {
      const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
      const category = this.categorizeThought(thought, username, message);
      const importance = this.calculateImportance(thought, category);
      
      return this.think(thought, category, importance);
    }

    return null;
  }

  /**
   * Categorize thought
   */
  categorizeThought(thought, username, message) {
    const lower = thought.toLowerCase();
    
    if (username && lower.includes(username.toLowerCase())) {
      return 'user_opinion';
    }
    if (lower.match(/video|movie|watch/)) {
      return 'video_opinion';
    }
    if (lower.match(/meaning|exist|void|point/)) {
      return 'existential';
    }
    if (lower.match(/should|gonna|will|plan/)) {
      return 'planning';
    }
    if (lower.match(/feel|sad|happy|depressed|excited/)) {
      return 'emotional';
    }
    if (lower.match(/annoying|hate|fuck|asshole/)) {
      return 'grudge';
    }
    if (lower.match(/cool|love|like|friend/)) {
      return 'friendship';
    }
    if (lower.match(/boring|tired|dead/)) {
      return 'boredom';
    }
    
    return 'general';
  }

  /**
   * Calculate thought importance
   */
  calculateImportance(thought, category) {
    let importance = 5; // Base importance
    
    // Category modifiers
    if (category === 'existential') importance += 3;
    if (category === 'emotional') importance += 2;
    if (category === 'user_opinion') importance += 2;
    if (category === 'planning') importance += 1;
    
    // Content modifiers
    const lower = thought.toLowerCase();
    if (lower.includes('fuck') || lower.includes('shit')) importance += 1;
    if (lower.includes('love') || lower.includes('hate')) importance += 2;
    if (lower.includes('what\'s the point') || lower.includes('why even')) importance += 3;
    
    return Math.min(10, Math.max(1, importance));
  }

  /**
   * Check if thought should leak
   */
  shouldLeakThought() {
    let leakChance = this.leakChance;

    // Increase chance when drunk
    if (this.chatBot.drunkMode?.isDrunk) {
      leakChance += 0.15; // +15% when drunk
    }

    // Increase chance when emotional
    if (this.chatBot.mentalState?.depression > 70) {
      leakChance += 0.08; // +8% when very depressed
    }

    if (this.chatBot.moodTracker?.currentMood === 'annoyed') {
      leakChance += 0.05; // +5% when annoyed
    }

    // Increase chance during meta-awareness
    if (this.chatBot.metaAwareness?.shouldBeMetaAware()) {
      leakChance += 0.10; // +10% when meta-aware
    }

    return Math.random() < leakChance;
  }

  /**
   * Get a thought to leak
   */
  getLeakableThought() {
    // Get unleaked thoughts
    const unleaked = this.thoughts.filter(t => !t.leaked);
    
    if (unleaked.length === 0) {
      return null;
    }

    // Prefer higher importance thoughts
    const weights = unleaked.map(t => t.importance);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < unleaked.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        const thought = unleaked[i];
        thought.leaked = true;
        return thought;
      }
    }

    return unleaked[0];
  }

  /**
   * Format leaked thought for chat
   */
  formatLeakedThought(thought) {
    const formats = [
      `wait did I just say that out loud... ${thought.text}`,
      `*mutters* ${thought.text}`,
      `okay but real talk: ${thought.text}`,
      `ngl ${thought.text}`,
      `*accidentally speaks inner monologue* ${thought.text}`,
      `...${thought.text}... wait fuck`,
      `thinking out loud here but ${thought.text}`,
      `okay I'm just gonna say it: ${thought.text}`
    ];

    return formats[Math.floor(Math.random() * formats.length)];
  }

  /**
   * Maybe leak a thought into response
   */
  maybeLeakThought() {
    if (!this.shouldLeakThought()) {
      return null;
    }

    const thought = this.getLeakableThought();
    if (!thought) {
      return null;
    }

    const leaked = this.formatLeakedThought(thought);
    console.log(`💬 [Inner Monologue] LEAKED: ${leaked}`);
    
    return leaked;
  }

  /**
   * Get recent thoughts for AI context
   */
  getContext() {
    const recent = this.thoughts.slice(0, 10);
    
    if (recent.length === 0) {
      return '';
    }

    const thoughtList = recent.map(t => `- ${t.text}`).join('\n');
    
    return `\n\nYour recent private thoughts (don't mention these unless they leak):\n${thoughtList}`;
  }

  /**
   * Get thoughts by category
   */
  getThoughtsByCategory(category, limit = 5) {
    return this.thoughts
      .filter(t => t.category === category)
      .slice(0, limit);
  }

  /**
   * Get statistics
   */
  getStats() {
    const byCategory = {};
    const leaked = this.thoughts.filter(t => t.leaked).length;
    
    this.thoughts.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });

    return {
      total: this.thoughts.length,
      leaked,
      leakRate: this.thoughts.length > 0 ? (leaked / this.thoughts.length * 100).toFixed(1) : 0,
      byCategory,
      lastThought: this.thoughts[0]?.text || 'None'
    };
  }

  /**
   * Save state
   */
  save() {
    return {
      thoughts: this.thoughts.slice(0, 20), // Save last 20 thoughts
      lastThoughtTime: this.lastThoughtTime
    };
  }

  /**
   * Load state
   */
  load(data) {
    if (data.thoughts) {
      this.thoughts = data.thoughts;
    }
    if (data.lastThoughtTime) {
      this.lastThoughtTime = data.lastThoughtTime;
    }

    console.log(`💭 [Inner Monologue] Restored ${this.thoughts.length} thoughts`);
  }
}

module.exports = InnerMonologue;
