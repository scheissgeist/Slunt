/**
 * ToleranceSystem - RimWorld-inspired habituation system
 * Tracks how Slunt gets used to repeated behaviors from users
 * First time has big impact, 10th time barely affects mood
 * But unexpected behavior (user acting different) has massive impact
 */

class ToleranceSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Track user behavior patterns
    this.userBehaviors = new Map(); // username -> behavior data
    
    // Behavior types we track
    this.behaviorTypes = [
      'praise',
      'roast',
      'question',
      'joke',
      'complaint',
      'agreement',
      'disagreement',
      'ignore'
    ];

    console.log('🎯 [Tolerance] Tolerance system initialized');
  }

  /**
   * Track a behavior from a user
   */
  trackBehavior(username, behaviorType, context = {}) {
    if (!this.userBehaviors.has(username)) {
      this.userBehaviors.set(username, {
        behaviors: {},
        totalInteractions: 0,
        lastInteraction: Date.now(),
        expectedBehavior: null // What we expect from this user
      });
    }

    const userData = this.userBehaviors.get(username);
    
    // Initialize behavior tracking
    if (!userData.behaviors[behaviorType]) {
      userData.behaviors[behaviorType] = {
        count: 0,
        tolerance: 0, // 0-1 scale (higher = more used to it)
        lastOccurrence: null,
        averageImpact: 0
      };
    }

    const behavior = userData.behaviors[behaviorType];
    
    // Update counts
    behavior.count++;
    userData.totalInteractions++;
    behavior.lastOccurrence = Date.now();
    userData.lastInteraction = Date.now();

    // Build tolerance (logarithmic curve)
    // 1st occurrence: 0% tolerance
    // 5th occurrence: 50% tolerance  
    // 10th occurrence: 70% tolerance
    // 20th occurrence: 85% tolerance
    behavior.tolerance = Math.min(0.95, Math.log(behavior.count + 1) / Math.log(25));

    // Determine expected behavior (most frequent)
    this.updateExpectedBehavior(username);

    console.log(`📊 [Tolerance] ${username} → ${behaviorType} (count: ${behavior.count}, tolerance: ${Math.round(behavior.tolerance * 100)}%)`);

    return {
      tolerance: behavior.tolerance,
      count: behavior.count,
      isExpected: userData.expectedBehavior === behaviorType,
      impactMultiplier: this.calculateImpactMultiplier(username, behaviorType)
    };
  }

  /**
   * Calculate impact multiplier based on tolerance and expectation
   */
  calculateImpactMultiplier(username, behaviorType) {
    const userData = this.userBehaviors.get(username);
    if (!userData) return 1.0;

    const behavior = userData.behaviors[behaviorType];
    if (!behavior) return 1.0;

    // Base impact reduced by tolerance
    let multiplier = 1.0 - (behavior.tolerance * 0.7); // Max 70% reduction

    // If this is unexpected behavior, BOOST impact significantly
    if (userData.expectedBehavior && userData.expectedBehavior !== behaviorType) {
      multiplier *= 2.5; // 2.5x impact for unexpected behavior!
      
      console.log(`⚡ [Tolerance] UNEXPECTED! Expected ${userData.expectedBehavior}, got ${behaviorType} (${multiplier.toFixed(2)}x impact)`);
    }

    // If this is expected behavior, reduce impact more
    if (userData.expectedBehavior === behaviorType) {
      multiplier *= 0.6; // 40% reduction for expected
    }

    return Math.max(0.1, multiplier); // Minimum 10% impact
  }

  /**
   * Update what behavior we expect from a user
   */
  updateExpectedBehavior(username) {
    const userData = this.userBehaviors.get(username);
    if (!userData) return;

    // Find most frequent behavior
    const behaviors = Object.entries(userData.behaviors);
    if (behaviors.length === 0) return;

    // Only set expectation after 5+ interactions
    if (userData.totalInteractions < 5) {
      userData.expectedBehavior = null;
      return;
    }

    // Sort by count, take top behavior
    const sorted = behaviors.sort(([,a], [,b]) => b.count - a.count);
    const topBehavior = sorted[0][0];
    const topCount = sorted[0][1].count;

    // Only set as expected if it's >40% of interactions
    const percentage = topCount / userData.totalInteractions;
    
    if (percentage > 0.4) {
      const oldExpectation = userData.expectedBehavior;
      userData.expectedBehavior = topBehavior;
      
      if (oldExpectation !== topBehavior && topBehavior !== null) {
        console.log(`🎯 [Tolerance] ${username}'s expected behavior: ${topBehavior} (${Math.round(percentage * 100)}% of interactions)`);
      }
    } else {
      userData.expectedBehavior = null; // Too varied
    }
  }

  /**
   * Get user's behavior profile
   */
  getUserProfile(username) {
    const userData = this.userBehaviors.get(username);
    if (!userData) return null;

    return {
      expectedBehavior: userData.expectedBehavior,
      totalInteractions: userData.totalInteractions,
      behaviors: Object.entries(userData.behaviors).map(([type, data]) => ({
        type,
        count: data.count,
        tolerance: Math.round(data.tolerance * 100),
        percentage: Math.round((data.count / userData.totalInteractions) * 100)
      })).sort((a, b) => b.count - a.count)
    };
  }

  /**
   * Get tolerance for specific behavior from user
   */
  getTolerance(username, behaviorType) {
    const userData = this.userBehaviors.get(username);
    if (!userData || !userData.behaviors[behaviorType]) {
      return 0; // No tolerance (first time)
    }

    return userData.behaviors[behaviorType].tolerance;
  }

  /**
   * Helper: Determine behavior type from message
   */
  detectBehaviorType(username, message, sentiment) {
    const msg = message.toLowerCase();

    // Check for specific patterns
    if (msg.match(/\b(good|nice|great|awesome|based|love)\b/) && sentiment > 0.5) {
      return 'praise';
    }
    
    if (msg.match(/\b(stupid|dumb|bad|sucks|shut up|stfu)\b/) || sentiment < -0.5) {
      return 'roast';
    }

    if (msg.includes('?')) {
      return 'question';
    }

    if (msg.match(/\b(lol|lmao|haha|😂|🤣)\b/)) {
      return 'joke';
    }

    if (msg.match(/\b(yeah|agree|exactly|true|facts)\b/)) {
      return 'agreement';
    }

    if (msg.match(/\b(no|nah|disagree|wrong|actually)\b/)) {
      return 'disagreement';
    }

    if (msg.match(/\b(boring|hate|ugh|why|annoying)\b/)) {
      return 'complaint';
    }

    return null; // Neutral/unclassified
  }

  /**
   * Process message and track tolerance
   */
  processMessage(username, message, sentiment) {
    const behaviorType = this.detectBehaviorType(username, message, sentiment);
    
    if (!behaviorType) return null;

    return this.trackBehavior(username, behaviorType, { message });
  }

  /**
   * Get context for AI prompt
   */
  getContext(username) {
    if (!username) return '';

    const profile = this.getUserProfile(username);
    if (!profile) return '';

    let context = `\n🎯 TOLERANCE for ${username}:\n`;

    if (profile.expectedBehavior) {
      context += `- Usually: ${profile.expectedBehavior} (${profile.behaviors.find(b => b.type === profile.expectedBehavior)?.percentage}% of time)\n`;
      context += `- You're USED TO this behavior from them (reduced emotional impact)\n`;
      context += `- If they act DIFFERENTLY, you'll be surprised (increased impact)\n`;
    } else {
      context += `- Unpredictable behavior pattern\n`;
      context += `- Haven't established expectations yet\n`;
    }

    // Show high-tolerance behaviors
    const highTolerance = profile.behaviors.filter(b => b.tolerance > 50);
    if (highTolerance.length > 0) {
      context += `- Used to: ${highTolerance.map(b => `${b.type} (${b.tolerance}%)`).join(', ')}\n`;
    }

    return context;
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    const profiles = Array.from(this.userBehaviors.entries()).map(([username, data]) => ({
      username,
      expectedBehavior: data.expectedBehavior,
      totalInteractions: data.totalInteractions,
      topBehaviors: Object.entries(data.behaviors)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 3)
        .map(([type, data]) => ({
          type,
          count: data.count,
          tolerance: Math.round(data.tolerance * 100)
        }))
    }));

    return {
      trackedUsers: this.userBehaviors.size,
      profiles: profiles.sort((a, b) => b.totalInteractions - a.totalInteractions).slice(0, 10)
    };
  }

  /**
   * Save tolerance data (ASYNC VERSION - no blocking)
   */
  async save() {
    // Convert Map to plain object for JSON serialization
    const data = {
      userBehaviors: Array.from(this.userBehaviors.entries())
    };

    const fs = require('fs').promises;
    const path = require('path');
    const dataPath = path.join(__dirname, '../../data/tolerance.json');

    try {
      await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
      console.log('💾 [Tolerance] Saved tolerance data');
    } catch (error) {
      console.error('❌ [Tolerance] Failed to save:', error.message);
    }
  }

  /**
   * Load tolerance data (ASYNC VERSION - no blocking)
   */
  async load() {
    const fs = require('fs').promises;
    const path = require('path');
    const dataPath = path.join(__dirname, '../../data/tolerance.json');

    try {
      const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
      this.userBehaviors = new Map(data.userBehaviors);
      console.log(`📂 [Tolerance] Loaded ${this.userBehaviors.size} user profiles`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ [Tolerance] Failed to load:', error.message);
      }
    }
  }
}

module.exports = ToleranceSystem;
