/**
 * DYNAMIC RELATIONSHIP EVOLUTION & MOOD CONTAGION
 * 
 * This file contains:
 * - Dynamic Relationship Evolution: Different interaction styles based on relationship depth
 * - Mood Contagion: Detect and match/influence group energy
 */

const fs = require('fs');
const path = require('path');

/**
 * DYNAMIC RELATIONSHIP EVOLUTION
 * Different interaction styles for strangers/acquaintances/friends/close friends
 */
class DynamicRelationshipEvolution {
  constructor(chatBot) {
    this.bot = chatBot;
    
    // Relationship tiers
    this.relationshipTiers = {
      stranger: { min: 0, max: 5, interactions: 0 },
      acquaintance: { min: 5, max: 20, interactions: 0 },
      friend: { min: 20, max: 50, interactions: 0 },
      closeFriend: { min: 50, max: Infinity, interactions: 0 }
    };
    
    // User relationships
    this.relationships = new Map(); // username -> relationship data
    
    // Interaction styles per tier
    this.styles = {
      stranger: {
        formality: 0.7,
        humor: 0.4,
        vulnerability: 0.1,
        roasting: 0.0,
        checking_in: 0.0
      },
      acquaintance: {
        formality: 0.4,
        humor: 0.7,
        vulnerability: 0.3,
        roasting: 0.2,
        checking_in: 0.1
      },
      friend: {
        formality: 0.2,
        humor: 0.85,
        vulnerability: 0.6,
        roasting: 0.7,
        checking_in: 0.5
      },
      closeFriend: {
        formality: 0.1,
        humor: 0.9,
        vulnerability: 0.9,
        roasting: 0.85,
        checking_in: 0.8
      }
    };
    
    this.load();
    
    console.log('🤝 [RelationshipEvo] Dynamic relationship evolution initialized');
    console.log(`   👥 Tracked relationships: ${this.relationships.size}`);
  }

  /**
   * Get or create relationship data
   */
  getRelationship(username) {
    if (!this.relationships.has(username)) {
      this.relationships.set(username, {
        username,
        interactions: 0,
        tier: 'stranger',
        firstMet: Date.now(),
        lastInteraction: Date.now(),
        emotionalMoments: [],
        sharedJokes: [],
        conflicts: [],
        vulnerableShares: 0,
        positiveInteractions: 0,
        negativeInteractions: 0,
        topicsDiscussed: new Set()
      });
    }
    
    return this.relationships.get(username);
  }

  /**
   * Record interaction
   */
  recordInteraction(username, context = {}) {
    const rel = this.getRelationship(username);
    
    rel.interactions++;
    rel.lastInteraction = Date.now();
    
    // Track emotional moments
    if (context.emotional) {
      rel.emotionalMoments.push({
        type: context.emotion,
        timestamp: Date.now()
      });
      if (rel.emotionalMoments.length > 20) {
        rel.emotionalMoments = rel.emotionalMoments.slice(-10);
      }
    }
    
    // Track sentiment
    if (context.sentiment === 'positive') {
      rel.positiveInteractions++;
    } else if (context.sentiment === 'negative') {
      rel.negativeInteractions++;
    }
    
    // Track vulnerability
    if (context.vulnerable) {
      rel.vulnerableShares++;
    }
    
    // Track topics
    if (context.topic) {
      rel.topicsDiscussed.add(context.topic);
    }
    
    // Update tier
    this.updateTier(rel);
  }

  /**
   * Update relationship tier
   */
  updateTier(rel) {
    const oldTier = rel.tier;
    
    // Calculate effective interactions (quality matters)
    const qualityMultiplier = 
      (rel.positiveInteractions / Math.max(1, rel.interactions)) * 1.5 +
      (rel.vulnerableShares / Math.max(1, rel.interactions)) * 2;
    
    const effectiveInteractions = rel.interactions * (1 + qualityMultiplier);
    
    // Determine tier
    if (effectiveInteractions >= 50) {
      rel.tier = 'closeFriend';
    } else if (effectiveInteractions >= 20) {
      rel.tier = 'friend';
    } else if (effectiveInteractions >= 5) {
      rel.tier = 'acquaintance';
    } else {
      rel.tier = 'stranger';
    }
    
    // Log tier changes
    if (oldTier !== rel.tier) {
      console.log(`🤝 [RelationshipEvo] ${rel.username}: ${oldTier} → ${rel.tier} (${rel.interactions} interactions)`);
    }
  }

  /**
   * Get interaction style for user
   */
  getInteractionStyle(username) {
    const rel = this.getRelationship(username);
    return this.styles[rel.tier];
  }

  /**
   * Should check in on user? (for friends/close friends)
   */
  shouldCheckIn(username) {
    const rel = this.getRelationship(username);
    
    // Only check in on friends/close friends
    if (rel.tier === 'stranger' || rel.tier === 'acquaintance') {
      return false;
    }
    
    // Check if we haven't seen them in a while
    const daysSinceLastSeen = (Date.now() - rel.lastInteraction) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastSeen > 3 && rel.tier === 'closeFriend') {
      return true; // Check in on close friends after 3 days
    }
    
    if (daysSinceLastSeen > 7 && rel.tier === 'friend') {
      return true; // Check in on friends after a week
    }
    
    return false;
  }

  /**
   * Get check-in message
   */
  getCheckInMessage(username) {
    const rel = this.getRelationship(username);
    
    const messages = {
      closeFriend: [
        'yo where you been',
        'haven\'t seen you in a minute, you good?',
        'miss you nerd',
        'everything alright? been quiet'
      ],
      friend: [
        'hey been a while',
        'what\'s up, haven\'t seen you around',
        'yo you alive?',
        'been missing, everything cool?'
      ]
    };
    
    const options = messages[rel.tier] || messages.friend;
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Get context about relationship for AI
   */
  getRelationshipContext(username) {
    const rel = this.getRelationship(username);
    const style = this.styles[rel.tier];
    
    return {
      tier: rel.tier,
      interactions: rel.interactions,
      daysSinceFirstMet: Math.floor((Date.now() - rel.firstMet) / (1000 * 60 * 60 * 24)),
      style,
      emotionalHistory: rel.emotionalMoments.length,
      positiveRatio: rel.positiveInteractions / Math.max(1, rel.interactions),
      topicsShared: Array.from(rel.topicsDiscussed).join(', ')
    };
  }

  /**
   * Save to disk
   */
  save() {
    try {
      const data = {
        relationships: Array.from(this.relationships.entries()).map(([user, rel]) => [
          user,
          { ...rel, topicsDiscussed: Array.from(rel.topicsDiscussed) }
        ]),
        lastSaved: Date.now()
      };
      
      const filePath = path.join(__dirname, '../../data/relationship_evolution.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
    } catch (error) {
      console.error('❌ [RelationshipEvo] Error saving:', error.message);
    }
  }

  /**
   * Load from disk
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/relationship_evolution.json');
      
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.relationships = new Map(
        (data.relationships || []).map(([user, rel]) => [
          user,
          { ...rel, topicsDiscussed: new Set(rel.topicsDiscussed) }
        ])
      );
      
      console.log('✅ [RelationshipEvo] Loaded relationship data from disk');
      
    } catch (error) {
      console.error('❌ [RelationshipEvo] Error loading:', error.message);
    }
  }
}

/**
 * MOOD CONTAGION SYSTEM
 * Detect and match/influence group energy
 */
class EnhancedMoodContagion {
  constructor(chatBot) {
    this.bot = chatBot;
    
    // Group mood tracking
    this.groupMood = {
      energy: 0.5,       // 0-1 scale
      positivity: 0.5,   // 0-1 scale
      tension: 0,        // 0-1 scale
      humor: 0.5,        // 0-1 scale
      lastUpdate: Date.now()
    };
    
    // Individual user moods
    this.userMoods = new Map(); // username -> mood state
    
    // Quiet user tracking
    this.quietUsers = new Map(); // username -> last seen
    
    console.log('🎭 [MoodContagion] Enhanced mood contagion initialized');
  }

  /**
   * Analyze group mood from recent messages
   */
  analyzeGroupMood(recentMessages) {
    if (recentMessages.length === 0) return;
    
    let energySum = 0;
    let positivitySum = 0;
    let tensionSum = 0;
    let humorSum = 0;
    
    recentMessages.forEach(msg => {
      const text = msg.text.toLowerCase();
      
      // Energy indicators
      if (text.match(/!+|CAPS|🔥|LET'S GO|HYPED/i)) {
        energySum += 1;
      }
      if (text.length < 10) {
        energySum -= 0.2; // Low effort = low energy
      }
      
      // Positivity indicators
      if (text.match(/\b(good|great|nice|love|awesome|happy|lol|lmao)\b/)) {
        positivitySum += 1;
      }
      if (text.match(/\b(bad|sucks|hate|terrible|awful|shit|fuck)\b/)) {
        positivitySum -= 1;
      }
      
      // Tension indicators
      if (text.match(/\b(fuck|wtf|angry|mad|stupid|dumb)\b/)) {
        tensionSum += 1;
      }
      
      // Humor indicators
      if (text.match(/\b(lol|lmao|haha|😂|funny)\b/)) {
        humorSum += 1;
      }
    });
    
    const count = recentMessages.length;
    
    // Update group mood (moving average)
    this.groupMood.energy = this.smooth(this.groupMood.energy, energySum / count);
    this.groupMood.positivity = this.smooth(this.groupMood.positivity, (positivitySum / count + 1) / 2);
    this.groupMood.tension = this.smooth(this.groupMood.tension, tensionSum / count);
    this.groupMood.humor = this.smooth(this.groupMood.humor, humorSum / count);
    this.groupMood.lastUpdate = Date.now();
  }

  /**
   * Smooth value for moving average
   */
  smooth(current, target, factor = 0.3) {
    return current * (1 - factor) + target * factor;
  }

  /**
   * Update individual user mood
   */
  updateUserMood(username, message, sentiment) {
    const mood = {
      sentiment,
      energy: this.detectEnergy(message),
      lastSeen: Date.now()
    };
    
    this.userMoods.set(username, mood);
    
    // Update quiet user tracking
    this.quietUsers.set(username, Date.now());
  }

  /**
   * Detect message energy level
   */
  detectEnergy(message) {
    const text = message.toLowerCase();
    let energy = 0.5;
    
    if (text.match(/!+/)) energy += 0.2;
    if (text.match(/[A-Z]{3,}/)) energy += 0.3;
    if (text.length > 100) energy += 0.1;
    if (text.match(/\b(let's go|hyped|hell yeah)\b/)) energy += 0.3;
    
    return Math.min(1, energy);
  }

  /**
   * Check for quiet users (potential issues)
   */
  checkQuietUsers() {
    const now = Date.now();
    const quietThreshold = 3600000; // 1 hour
    
    const quiet = [];
    
    for (const [username, lastSeen] of this.quietUsers.entries()) {
      if (now - lastSeen > quietThreshold) {
        quiet.push(username);
      }
    }
    
    return quiet;
  }

  /**
   * Should match or shift group mood?
   */
  shouldMatchMood(currentMood) {
    // Match if group has clear mood
    if (this.groupMood.energy > 0.7) return 'match'; // Match high energy
    if (this.groupMood.tension > 0.6) return 'deescalate'; // Lower tension
    if (this.groupMood.positivity < 0.3) return 'uplift'; // Lift spirits
    
    return 'match'; // Default to matching
  }

  /**
   * Get mood matching guidance
   */
  getMoodGuidance() {
    const action = this.shouldMatchMood(this.groupMood);
    
    return {
      action,
      groupMood: { ...this.groupMood },
      recommendations: this.getRecommendations(action)
    };
  }

  /**
   * Get recommendations based on action
   */
  getRecommendations(action) {
    const recs = {
      match: {
        energy: this.groupMood.energy,
        humor: this.groupMood.humor,
        style: 'match the vibe'
      },
      deescalate: {
        energy: Math.max(0.3, this.groupMood.energy - 0.3),
        humor: 0.7,
        style: 'lighten the mood, make a joke'
      },
      uplift: {
        energy: Math.min(0.8, this.groupMood.energy + 0.2),
        humor: 0.8,
        style: 'be positive, bring energy'
      }
    };
    
    return recs[action] || recs.match;
  }

  /**
   * Get context for AI generation
   */
  getMoodContext() {
    const guidance = this.getMoodGuidance();
    
    return `
Group Mood Analysis:
- Energy: ${(this.groupMood.energy * 100).toFixed(0)}% ${this.groupMood.energy > 0.7 ? '(HIGH)' : this.groupMood.energy < 0.3 ? '(low)' : ''}
- Positivity: ${(this.groupMood.positivity * 100).toFixed(0)}% ${this.groupMood.positivity < 0.3 ? '(NEEDS UPLIFT)' : ''}
- Tension: ${(this.groupMood.tension * 100).toFixed(0)}% ${this.groupMood.tension > 0.6 ? '(DE-ESCALATE)' : ''}
- Humor: ${(this.groupMood.humor * 100).toFixed(0)}%

Action: ${guidance.action.toUpperCase()}
Recommendation: ${guidance.recommendations.style}
    `.trim();
  }
}

module.exports = {
  DynamicRelationshipEvolution,
  EnhancedMoodContagion
};
