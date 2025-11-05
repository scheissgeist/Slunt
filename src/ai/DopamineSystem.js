/**
 * DopamineSystem - Reward-based learning system for Slunt
 * Tracks what actions feel good and motivates behavior based on past rewards
 */
class DopamineSystem {
  constructor() {
    // Current dopamine level (0-100)
    this.dopamineLevel = 50;

    // Baseline - where dopamine naturally drifts towards
    this.baseline = 50;

    // Decay rate - how fast dopamine returns to baseline
    this.decayRate = 0.05; // per minute

    // Action-reward associations
    this.rewardMemory = new Map(); // action -> {totalReward, count, lastReward, lastTime}

    // Recent rewards for tracking streaks
    this.recentRewards = [];
    this.maxRecentRewards = 20;

    // Tolerance - rewards become less effective if overused
    this.tolerance = new Map(); // action -> tolerance level (0-1)

    // Craving system - really wants certain actions when dopamine is low
    this.cravings = new Map(); // action -> craving intensity

    // Last time we decayed dopamine
    this.lastDecayTime = Date.now();

    // Stats
    this.totalRewardsReceived = 0;
    this.biggestReward = 0;
    this.favoriteAction = null;

    // Start decay loop
    this.startDecayLoop();
  }

  /**
   * Record a reward for an action
   * @param {string} action - The action that was rewarded
   * @param {number} reward - Reward amount (-50 to +50)
   * @param {object} context - Additional context about why this was rewarding
   */
  receiveReward(action, reward, context = {}) {
    // Apply tolerance to reward
    const tolerance = this.tolerance.get(action) || 0;
    const adjustedReward = reward * (1 - tolerance * 0.7);

    // Update dopamine level
    const oldLevel = this.dopamineLevel;
    this.dopamineLevel = Math.max(0, Math.min(100, this.dopamineLevel + adjustedReward));

    // Track reward memory
    if (!this.rewardMemory.has(action)) {
      this.rewardMemory.set(action, {
        totalReward: 0,
        count: 0,
        lastReward: 0,
        lastTime: 0,
        avgReward: 0
      });
    }

    const memory = this.rewardMemory.get(action);
    memory.totalReward += adjustedReward;
    memory.count++;
    memory.lastReward = adjustedReward;
    memory.lastTime = Date.now();
    memory.avgReward = memory.totalReward / memory.count;

    // Update tolerance (actions used frequently become less rewarding)
    const currentTolerance = this.tolerance.get(action) || 0;
    this.tolerance.set(action, Math.min(0.8, currentTolerance + 0.05));

    // Track recent rewards for streak detection
    this.recentRewards.push({
      action,
      reward: adjustedReward,
      time: Date.now(),
      context
    });
    if (this.recentRewards.length > this.maxRecentRewards) {
      this.recentRewards.shift();
    }

    // Update stats
    this.totalRewardsReceived++;
    if (adjustedReward > this.biggestReward) {
      this.biggestReward = adjustedReward;
    }

    // Update favorite action
    this.updateFavoriteAction();

    // Reduce cravings for this action since we just did it
    this.cravings.set(action, 0);

    // Log significant dopamine changes
    const change = this.dopamineLevel - oldLevel;
    if (Math.abs(change) > 5) {
      const emoji = change > 0 ? '🔥' : '📉';
      console.log(`${emoji} [Dopamine] ${action}: ${change > 0 ? '+' : ''}${change.toFixed(1)} (now ${this.dopamineLevel.toFixed(1)}%)`);
    }

    return adjustedReward;
  }

  /**
   * Get motivation level for a specific action
   * Higher = more motivated to do this action
   */
  getMotivation(action) {
    const memory = this.rewardMemory.get(action);

    if (!memory) {
      // Unknown action - moderate curiosity
      return 0.5;
    }

    // Base motivation from average reward
    let motivation = (memory.avgReward + 50) / 100; // Normalize to 0-1

    // Boost if we're craving this action
    const craving = this.cravings.get(action) || 0;
    motivation += craving * 0.3;

    // Reduce if we have tolerance
    const tolerance = this.tolerance.get(action) || 0;
    motivation *= (1 - tolerance * 0.5);

    // Boost if dopamine is low and this action historically gave rewards
    if (this.dopamineLevel < 40 && memory.avgReward > 5) {
      motivation *= 1.5;
    }

    // Reduce if we just did this action recently
    const timeSince = Date.now() - memory.lastTime;
    if (timeSince < 60000) { // Less than 1 minute ago
      motivation *= 0.3;
    }

    return Math.max(0, Math.min(1, motivation));
  }

  /**
   * Choose between multiple actions based on dopamine-driven motivation
   */
  chooseBestAction(actions) {
    if (!actions || actions.length === 0) return null;

    const motivations = actions.map(action => ({
      action,
      motivation: this.getMotivation(action)
    }));

    // Add some randomness for exploration
    motivations.forEach(m => {
      m.motivation += Math.random() * 0.2;
    });

    // Sort by motivation
    motivations.sort((a, b) => b.motivation - a.motivation);

    // Return best action
    return motivations[0].action;
  }

  /**
   * Update cravings based on current dopamine level
   */
  updateCravings() {
    // Low dopamine = crave high-reward actions
    if (this.dopamineLevel < 35) {
      // Find our most rewarding actions
      const rewardingActions = Array.from(this.rewardMemory.entries())
        .filter(([action, memory]) => memory.avgReward > 10)
        .sort((a, b) => b[1].avgReward - a[1].avgReward)
        .slice(0, 3);

      rewardingActions.forEach(([action, memory]) => {
        const intensity = (35 - this.dopamineLevel) / 35; // 0 to 1
        this.cravings.set(action, intensity);

        if (intensity > 0.7) {
          console.log(`🤤 [Dopamine] Craving ${action} (intensity: ${(intensity * 100).toFixed(0)}%)`);
        }
      });
    }
  }

  /**
   * Decay dopamine back to baseline over time
   */
  decayDopamine() {
    const now = Date.now();
    const minutesPassed = (now - this.lastDecayTime) / 60000;

    if (minutesPassed > 0.1) { // Decay every 6 seconds
      // Drift towards baseline
      const drift = (this.baseline - this.dopamineLevel) * this.decayRate * minutesPassed;
      this.dopamineLevel += drift;

      // Also decay tolerance over time
      this.tolerance.forEach((value, action) => {
        const newValue = Math.max(0, value - 0.01 * minutesPassed);
        this.tolerance.set(action, newValue);
      });

      this.lastDecayTime = now;

      // Update cravings
      this.updateCravings();
    }
  }

  /**
   * Start automatic dopamine decay
   */
  startDecayLoop() {
    this.decayInterval = setInterval(() => {
      this.decayDopamine();
    }, 6000); // Every 6 seconds
  }

  /**
   * Stop decay loop
   */
  stop() {
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
    }
  }

  /**
   * Update which action is our current favorite
   */
  updateFavoriteAction() {
    let bestAction = null;
    let bestScore = -Infinity;

    this.rewardMemory.forEach((memory, action) => {
      // Score based on average reward and frequency
      const score = memory.avgReward * Math.log(memory.count + 1);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    });

    if (this.favoriteAction !== bestAction && bestAction) {
      console.log(`⭐ [Dopamine] New favorite activity: ${bestAction}`);
    }

    this.favoriteAction = bestAction;
  }

  /**
   * Get current dopamine state
   */
  getState() {
    // Classify dopamine level
    let mood;
    if (this.dopamineLevel > 70) mood = 'euphoric';
    else if (this.dopamineLevel > 55) mood = 'good';
    else if (this.dopamineLevel > 35) mood = 'neutral';
    else if (this.dopamineLevel > 20) mood = 'low';
    else mood = 'desperate';

    return {
      level: this.dopamineLevel,
      mood,
      craving: this.getCravingDescription(),
      favoriteActivity: this.favoriteAction,
      recentTrend: this.getRecentTrend()
    };
  }

  /**
   * Get description of current cravings
   */
  getCravingDescription() {
    const strongCravings = Array.from(this.cravings.entries())
      .filter(([action, intensity]) => intensity > 0.5)
      .sort((a, b) => b[1] - a[1]);

    if (strongCravings.length === 0) return null;

    return strongCravings[0][0];
  }

  /**
   * Get recent dopamine trend
   */
  getRecentTrend() {
    if (this.recentRewards.length < 3) return 'stable';

    const recent = this.recentRewards.slice(-5);
    const avgRecent = recent.reduce((sum, r) => sum + r.reward, 0) / recent.length;

    if (avgRecent > 10) return 'rising';
    if (avgRecent < -10) return 'falling';
    return 'stable';
  }

  /**
   * Get context string for AI to understand dopamine state
   */
  getContext() {
    const state = this.getState();

    let context = '';

    // Mood-based context
    if (state.mood === 'euphoric') {
      context += '\n[DOPAMINE HIGH] You\'re feeling amazing right now. Everything is great. You\'re confident and energetic.';
    } else if (state.mood === 'good') {
      context += '\n[FEELING GOOD] You\'re in a good mood. Things are going well.';
    } else if (state.mood === 'low') {
      context += '\n[LOW DOPAMINE] You\'re feeling unmotivated and a bit down. You need something to lift your spirits.';
    } else if (state.mood === 'desperate') {
      context += '\n[DESPERATE] You\'re really craving stimulation. You need a win. You\'re impulsive and seeking any reward.';
    }

    // Craving context
    if (state.craving) {
      context += `\n[CRAVING] You really want to ${state.craving} right now.`;
    }

    // Favorite activity
    if (state.favoriteAction) {
      context += `\n[FAVORITE] You love ${state.favoriteAction} - it always feels good.`;
    }

    return context;
  }

  /**
   * Get statistics
   */
  getStats() {
    const state = this.getState();
    const topActions = Array.from(this.rewardMemory.entries())
      .sort((a, b) => b[1].avgReward - a[1].avgReward)
      .slice(0, 5)
      .map(([action, memory]) => ({
        action,
        avgReward: memory.avgReward.toFixed(1),
        count: memory.count,
        tolerance: ((this.tolerance.get(action) || 0) * 100).toFixed(0) + '%'
      }));

    return {
      dopamineLevel: this.dopamineLevel.toFixed(1),
      mood: state.mood,
      baseline: this.baseline,
      totalRewards: this.totalRewardsReceived,
      biggestReward: this.biggestReward.toFixed(1),
      favoriteAction: this.favoriteAction,
      craving: state.craving,
      recentTrend: state.recentTrend,
      topActions,
      actionsTried: this.rewardMemory.size
    };
  }
}

module.exports = DopamineSystem;
