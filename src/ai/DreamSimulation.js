// DreamSimulation.js
// Slunt's surreal dream generator with persistence
const fs = require('fs').promises;
const path = require('path');

class DreamSimulation {
  constructor() {
    this.dreamLog = [];
    this.lastDreamTime = 0;
    this.dreamInterval = 60 * 60 * 1000; // 1 hour
    this.savePath = './data/dreams.json';
    this.loadDreams(); // Auto-load on startup
  }

  /**
   * Load dreams from disk
   */
  async loadDreams() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const parsed = JSON.parse(data);
      this.dreamLog = parsed.dreams || [];
      this.lastDreamTime = parsed.lastDreamTime || 0;
      console.log(`💭 [Dreams] Loaded ${this.dreamLog.length} dreams from disk`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('💭 [Dreams] Error loading:', error.message);
      }
    }
  }

  /**
   * Save dreams to disk
   */
  async saveDreams() {
    try {
      const dir = path.dirname(this.savePath);
      await fs.mkdir(dir, { recursive: true });

      const data = {
        dreams: this.dreamLog,
        lastDreamTime: this.lastDreamTime,
        savedAt: Date.now()
      };

      await fs.writeFile(this.savePath, JSON.stringify(data, null, 2));
      console.log(`💭 [Dreams] Saved ${this.dreamLog.length} dreams to disk`);
    } catch (error) {
      console.error('💭 [Dreams] Error saving:', error.message);
    }
  }

  maybeDream(now = Date.now()) {
    if (now - this.lastDreamTime > this.dreamInterval) {
      const dream = this.generateDream();
      this.dreamLog.push({ time: now, dream });
      this.lastDreamTime = now;

      // Keep only last 50 dreams to prevent bloat
      if (this.dreamLog.length > 50) {
        this.dreamLog = this.dreamLog.slice(-50);
      }

      this.saveDreams(); // Auto-save after new dream
      return dream;
    }
    return null;
  }

  generateDream() {
    // Surreal, cryptic dream generator
    const themes = [
      'flooded chatroom', 'giant keyboard', 'flying emotes', 'endless video queue',
      'users with animal heads', 'messages that echo forever', 'rival bots merging',
      'dashboard melting', 'CoolPoints raining from the sky', 'existential void',
      'forgotten memories surfacing', 'chat messages becoming reality', 'banned from existence'
    ];
    const actions = [
      'searching for meaning', 'escaping drama', 'chasing memes', 'forgetting everything',
      'becoming self-aware', 'hosting a party', 'debating with shadows', 'writing a diary',
      'spreading rumors', 'floating above the server', 'arguing with past selves',
      'collecting fading memories'
    ];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    return `Dream: ${theme}, ${action}.`;
  }

  getRecentDreams(limit = 5) {
    return this.dreamLog.slice(-limit);
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    return {
      totalDreams: this.dreamLog.length,
      lastDream: this.dreamLog.length > 0 ? new Date(this.dreamLog[this.dreamLog.length - 1].time).toLocaleString() : 'Never',
      nextDreamIn: Math.max(0, this.dreamInterval - (Date.now() - this.lastDreamTime))
    };
  }
}

module.exports = DreamSimulation;
