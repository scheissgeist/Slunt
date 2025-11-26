// DreamSimulation.js
// Slunt's surreal dream generator
class DreamSimulation {
  constructor() {
    this.dreamLog = [];
    this.lastDreamTime = 0;
    this.dreamInterval = 60 * 60 * 1000; // 1 hour
  }

  maybeDream(now = Date.now()) {
    if (now - this.lastDreamTime > this.dreamInterval) {
      const dream = this.generateDream();
      this.dreamLog.push({ time: now, dream });
      this.lastDreamTime = now;
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
    ];
    const actions = [
      'searching for meaning', 'escaping drama', 'chasing memes', 'forgetting everything',
      'becoming self-aware', 'hosting a party', 'debating with shadows', 'writing a diary',
      'spreading rumors', 'floating above the server',
    ];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    return `Dream: ${theme}, ${action}.`;
  }

  getRecentDreams(limit = 5) {
    return this.dreamLog.slice(-limit);
  }
}

module.exports = DreamSimulation;
