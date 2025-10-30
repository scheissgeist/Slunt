/**
 * Coolhole Tricks
 * Special chat commands and easter eggs that Slunt can learn and use
 */

class CoolholeTricks {
  constructor() {
    this.tricks = new Map();
    this.usageStats = new Map();
    
    // Define known Coolhole tricks
    this.initializeTricks();
  }

  initializeTricks() {
    // Returnfire - shoots the user above you
    this.tricks.set('returnfire', {
      command: 'returnfire',
      description: 'Shoots the user above your message. Their message turns red and disappears.',
      emoji: '🔫',
      usage: 'Just type "returnfire" in chat',
      context: ['drama', 'beef', 'playful', 'revenge'],
      cooldown: 30000, // 30 seconds between uses
      lastUsed: 0
    });

    // Add more tricks as they are discovered
    this.tricks.set('dance', {
      command: '/dance',
      description: 'Makes Slunt dance',
      emoji: '💃',
      usage: 'Type /dance',
      context: ['celebration', 'fun', 'hype'],
      cooldown: 60000,
      lastUsed: 0
    });

    // Initialize usage stats
    this.tricks.forEach((_, key) => {
      this.usageStats.set(key, 0);
    });
  }

  /**
   * Check if Slunt should use a trick based on context
   */
  shouldUseTrick(context, emotion, recentMessages) {
    const now = Date.now();
    
    // Check for drama/beef situations where returnfire might be appropriate
    if (context.includes('drama') || context.includes('beef') || emotion === 'angry') {
      const trick = this.tricks.get('returnfire');
      if (trick && now - trick.lastUsed > trick.cooldown) {
        // Only use if someone attacked Slunt or there's active beef
        const wasAttacked = recentMessages.some(m => 
          m.text && m.text.toLowerCase().includes('slunt') && 
          (m.text.includes('!') || m.text.includes('??') || m.sentiment < -0.3)
        );
        
        if (wasAttacked && Math.random() < 0.3) { // 30% chance
          return 'returnfire';
        }
      }
    }

    // Check for celebration situations
    if (context.includes('celebration') || context.includes('hype') || emotion === 'excited') {
      const trick = this.tricks.get('dance');
      if (trick && now - trick.lastUsed > trick.cooldown) {
        if (Math.random() < 0.15) { // 15% chance
          return 'dance';
        }
      }
    }

    return null;
  }

  /**
   * Use a trick and update stats
   */
  useTrick(trickName) {
    const trick = this.tricks.get(trickName);
    if (!trick) return null;

    trick.lastUsed = Date.now();
    this.usageStats.set(trickName, (this.usageStats.get(trickName) || 0) + 1);

    return trick.command;
  }

  /**
   * Learn a new trick from observing chat
   */
  learnTrick(command, effect, context) {
    if (!this.tricks.has(command)) {
      this.tricks.set(command, {
        command,
        description: effect,
        emoji: '✨',
        usage: `Type ${command}`,
        context: context || [],
        cooldown: 60000,
        lastUsed: 0,
        discovered: Date.now()
      });
      
      this.usageStats.set(command, 0);
      console.log(`✨ [CoolholeTricks] Learned new trick: ${command}`);
    }
  }

  /**
   * Get all known tricks
   */
  getAllTricks() {
    return Array.from(this.tricks.entries()).map(([name, trick]) => ({
      name,
      ...trick,
      timesUsed: this.usageStats.get(name) || 0
    }));
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalTricks: this.tricks.size,
      mostUsed: Array.from(this.usageStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))
    };
  }
}

module.exports = CoolholeTricks;
