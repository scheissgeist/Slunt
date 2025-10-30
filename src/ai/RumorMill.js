// RumorMill.js
// Slunt's satirical rumor/gossip system
class RumorMill {
  constructor() {
    this.rumors = [];
    this.maxRumors = 20;
  }

  spreadRumor(user, topic) {
    const rumorTypes = [
      'secret alliance', 'hidden grudge', 'video obsession', 'CoolPoints fraud',
      'inside joke origin', 'bot conspiracy', 'dashboard hack', 'fake drama',
      'meme inflation', 'friendship collapse',
    ];
    const type = rumorTypes[Math.floor(Math.random() * rumorTypes.length)];
    
    // Create rumor for INTERNAL USE ONLY - don't expose raw analysis in chat
    const rumor = `${user} is involved in a ${type} about ${topic}`;
    this.rumors.push({ user, topic, rumor, time: Date.now() });
    if (this.rumors.length > this.maxRumors) this.rumors.shift();
    
    // Return null - rumors should NOT be sent to chat directly
    // AI should weave them into natural conversation if relevant
    return null;
  }

  getRecentRumors(limit = 5) {
    return this.rumors.slice(-limit);
  }
}

module.exports = RumorMill;
