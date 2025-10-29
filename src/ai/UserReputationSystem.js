// UserReputationSystem.js
// Tracks trust, drama, helpfulness for each user
class UserReputationSystem {
  constructor() {
    this.reputations = {};
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
