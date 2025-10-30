// UserReputationSystem.js
// Tracks trust, drama, helpfulness for each user
const fs = require('fs').promises;
const path = require('path');

class UserReputationSystem {
  constructor() {
    this.reputations = {};
    this.savePath = './data/user_reputations.json';
    this.loadReputations(); // Auto-load on startup
  }

  /**
   * Load reputations from disk
   */
  async loadReputations() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const parsed = JSON.parse(data);
      this.reputations = parsed.reputations || {};
      console.log(`👤 [Reputation] Loaded ${Object.keys(this.reputations).length} user reputations from disk`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('👤 [Reputation] Error loading:', error.message);
      }
    }
  }

  /**
   * Save reputations to disk
   */
  async saveReputations() {
    try {
      const dir = path.dirname(this.savePath);
      await fs.mkdir(dir, { recursive: true });

      const data = {
        reputations: this.reputations,
        savedAt: Date.now()
      };

      await fs.writeFile(this.savePath, JSON.stringify(data, null, 2));
      console.log(`👤 [Reputation] Saved ${Object.keys(this.reputations).length} user reputations to disk`);
    } catch (error) {
      console.error('👤 [Reputation] Error saving:', error.message);
    }
  }

  updateReputation(user, delta) {
    if (!this.reputations[user]) {
      this.reputations[user] = { trust: 50, drama: 0, helpfulness: 0 };
    }
    Object.keys(delta).forEach(key => {
      if (this.reputations[user][key] !== undefined) {
        this.reputations[user][key] += delta[key];
        // Clamp values
        if (key === 'trust') this.reputations[user][key] = Math.max(0, Math.min(100, this.reputations[user][key]));
        if (key === 'drama') this.reputations[user][key] = Math.max(0, this.reputations[user][key]);
        if (key === 'helpfulness') this.reputations[user][key] = Math.max(0, this.reputations[user][key]);
      }
    });
    
    // Auto-save after updating
    this.saveReputations();
  }

  getReputation(user) {
    return this.reputations[user] || { trust: 50, drama: 0, helpfulness: 0 };
  }

  getTopUsersBy(key, limit = 5) {
    return Object.entries(this.reputations)
      .sort((a, b) => (b[1][key] || 0) - (a[1][key] || 0))
      .slice(0, limit)
      .map(([user, stats]) => ({ user, ...stats }));
  }
}

module.exports = UserReputationSystem;
