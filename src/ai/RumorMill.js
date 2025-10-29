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
    const rumor = `${user} is involved in a ${type} about ${topic}`;
    this.rumors.push({ user, topic, rumor, time: Date.now() });
    if (this.rumors.length > this.maxRumors) this.rumors.shift();
    return rumor;
  }

  getRecentRumors(limit = 5) {
    return this.rumors.slice(-limit);
  }
}

module.exports = RumorMill;
