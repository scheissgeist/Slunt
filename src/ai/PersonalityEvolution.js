/**
 * Personality Evolution System
 * Allows Slunt's personality to evolve continuously based on each interaction
 */

class PersonalityEvolution {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.evolutionHistory = [];
    this.communityInfluence = {
      humor: 0,
      edginess: 0,
      supportiveness: 0,
      intellectualness: 0,
      chaos: 0
    };
    this.personalitySnapshots = [];
    
    // Continuous evolution settings
    this.evolutionRate = 0.002; // How much each message can shift personality (0.2%)
    this.decayRate = 0.9995; // Slowly drift back to baseline over time
    this.lastDecayTime = Date.now();
  }

  /**
   * Continuously adjust personality based on a single message
   * Called after EVERY message in chat
   */
  adjustFromMessage(username, text, sentiment) {
    const lowerText = text.toLowerCase();
    const adjustments = {};
    
    // Analyze humor - jokes, laughter, memes
    if (lowerText.match(/lmao|lol|haha|😂|💀|based|kek/) || 
        text.includes('?') && text.length < 30) {
      adjustments.humor = 0.001;
    }
    
    // Analyze edginess - controversial, spicy takes
    if (lowerText.match(/fuck|shit|damn|ass|wtf|bruh/)) {
      adjustments.edginess = 0.001;
    }
    
    // Analyze supportiveness - encouragement, empathy
    if (lowerText.match(/thanks|appreciate|help|support|nice|good job|awesome|great/) ||
        sentiment === 'positive') {
      adjustments.supportiveness = 0.001;
    }
    
    // Analyze chaos - caps, multiple punctuation, energy
    if (text.match(/[A-Z]{3,}/) || text.match(/[!?]{2,}/) || text.length > 100) {
      adjustments.chaos = 0.001;
      adjustments.spontaneity = 0.001;
    }
    
    // Analyze intellectual - thoughtful, question-based
    if (text.length > 80 && !text.match(/lmao|lol|haha/)) {
      adjustments.wisdom = 0.001;
      adjustments.intellectualness = 0.001;
    }
    
    // Analyze snarkiness - sarcasm indicators
    if (lowerText.match(/sure|yeah right|totally|obviously/) && 
        (text.includes('...') || text.includes('🙄'))) {
      adjustments.snarkiness = 0.001;
    }
    
    // Analyze creativity - unique expressions, metaphors
    if (text.match(/like|as if|imagine|literally/) && text.length > 40) {
      adjustments.creativity = 0.001;
    }
    
    // Apply micro-adjustments to personality
    this.applyMicroAdjustments(adjustments);
  }

  /**
   * Apply tiny adjustments to personality traits
   */
  applyMicroAdjustments(adjustments) {
    let changed = false;
    
    for (const [trait, delta] of Object.entries(adjustments)) {
      if (this.chatBot.personality[trait] !== undefined) {
        const oldValue = this.chatBot.personality[trait];
        let newValue = oldValue + delta;
        
        // Keep within bounds [0, 1]
        newValue = Math.max(0, Math.min(1, newValue));
        
        if (Math.abs(newValue - oldValue) > 0.0001) {
          this.chatBot.personality[trait] = newValue;
          changed = true;
        }
      }
    }
    
    // Periodically decay back toward baseline (every 5 minutes)
    const now = Date.now();
    if (now - this.lastDecayTime > 5 * 60 * 1000) {
      this.applyDecay();
      this.lastDecayTime = now;
    }
  }

  /**
   * Slowly drift personality back toward baseline/defaults
   */
  applyDecay() {
    const baseline = {
      humor: 0.75,
      snarkiness: 0.7,
      edginess: 0.65,
      chaos: 0.6,
      supportiveness: 0.5,
      empathy: 0.55,
      creativity: 0.7,
      wisdom: 0.6,
      spontaneity: 0.65,
      loyalty: 0.7
    };
    
    for (const [trait, baseValue] of Object.entries(baseline)) {
      if (this.chatBot.personality[trait] !== undefined) {
        const current = this.chatBot.personality[trait];
        // Drift 0.5% toward baseline
        this.chatBot.personality[trait] = current + (baseValue - current) * 0.005;
      }
    }
  }

  /**
   * Take a snapshot of current personality for history
   */
  takeSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      personality: { ...this.chatBot.personality }
    };
    
    this.personalitySnapshots.push(snapshot);
    
    // Keep only last 24 snapshots (1 day worth if hourly)
    if (this.personalitySnapshots.length > 24) {
      this.personalitySnapshots.shift();
    }
    
    console.log('🎭 [Personality] Snapshot taken');
  }

  /**
   * Analyze community influence on personality
   */
  analyzeCommunityInfluence() {
    let totalUsers = 0;
    let humorScore = 0;
    let edgeScore = 0;
    let supportScore = 0;
    let intellectualScore = 0;
    let chaosScore = 0;

    for (const [username, profile] of this.chatBot.userProfiles.entries()) {
      if (profile.messageCount < 5) continue; // Skip low-activity users
      totalUsers++;

      // Analyze humor
      const funnyQuotes = profile.funnyQuotes?.length || 0;
      humorScore += funnyQuotes;

      // Analyze edginess
      const opinions = profile.opinions?.length || 0;
      edgeScore += opinions;

      // Analyze supportiveness
      const friendshipLevel = profile.friendshipLevel || 0;
      if (friendshipLevel > 30) supportScore++;

      // Analyze intellectual content
      const topics = profile.favoriteTopics || [];
      const intellectualTopics = topics.filter(t => 
        t.includes('science') || t.includes('tech') || t.includes('philosophy') ||
        t.includes('history') || t.includes('art')
      ).length;
      intellectualScore += intellectualTopics;

      // Analyze chaos
      const emotionalMoments = profile.emotionalMoments || [];
      const highIntensity = emotionalMoments.filter(m => m.intensity === 'high').length;
      chaosScore += highIntensity;
    }

    if (totalUsers > 0) {
      this.communityInfluence = {
        humor: humorScore / totalUsers,
        edginess: edgeScore / totalUsers,
        supportiveness: supportScore / totalUsers,
        intellectualness: intellectualScore / totalUsers,
        chaos: chaosScore / totalUsers
      };
    }

    console.log('🎭 [Personality] Community influence:', this.communityInfluence);
  }

  /**
   * Evolve personality based on community
   */
  evolvePersonality() {
    this.analyzeCommunityInfluence();
    
    const currentPersonality = this.chatBot.personality;
    const influence = this.communityInfluence;

    // Save snapshot before evolution
    this.personalitySnapshots.push({
      timestamp: Date.now(),
      personality: { ...currentPersonality }
    });

    // Keep only last 10 snapshots
    if (this.personalitySnapshots.length > 10) {
      this.personalitySnapshots.shift();
    }

    // Evolve traits (gradual change, max 5% per evolution)
    const evolutionRate = 0.05;
    const changes = [];

    // Humor evolves with community humor
    if (influence.humor > 2) {
      const oldHumor = currentPersonality.humor;
      currentPersonality.humor = Math.min(1, currentPersonality.humor + evolutionRate);
      if (currentPersonality.humor !== oldHumor) {
        changes.push(`humor increased to ${currentPersonality.humor.toFixed(2)}`);
      }
    } else if (influence.humor < 1) {
      const oldHumor = currentPersonality.humor;
      currentPersonality.humor = Math.max(0.5, currentPersonality.humor - evolutionRate);
      if (currentPersonality.humor !== oldHumor) {
        changes.push(`humor decreased to ${currentPersonality.humor.toFixed(2)}`);
      }
    }

    // Edginess evolves with community edginess
    if (influence.edginess > 1.5) {
      const oldEdge = currentPersonality.edginess;
      currentPersonality.edginess = Math.min(1, currentPersonality.edginess + evolutionRate);
      if (currentPersonality.edginess !== oldEdge) {
        changes.push(`edginess increased to ${currentPersonality.edginess.toFixed(2)}`);
      }
    } else if (influence.edginess < 0.5) {
      const oldEdge = currentPersonality.edginess;
      currentPersonality.edginess = Math.max(0.6, currentPersonality.edginess - evolutionRate);
      if (currentPersonality.edginess !== oldEdge) {
        changes.push(`edginess decreased to ${currentPersonality.edginess.toFixed(2)}`);
      }
    }

    // Supportiveness evolves with community support
    if (influence.supportiveness > 0.5) {
      const oldSupport = currentPersonality.supportiveness;
      currentPersonality.supportiveness = Math.min(1, currentPersonality.supportiveness + evolutionRate);
      const oldSnark = currentPersonality.snarkiness;
      currentPersonality.snarkiness = Math.max(0.7, currentPersonality.snarkiness - evolutionRate / 2);
      if (currentPersonality.supportiveness !== oldSupport) {
        changes.push(`supportiveness increased to ${currentPersonality.supportiveness.toFixed(2)}`);
      }
    } else if (influence.supportiveness < 0.2) {
      const oldSnark = currentPersonality.snarkiness;
      currentPersonality.snarkiness = Math.min(1, currentPersonality.snarkiness + evolutionRate);
      if (currentPersonality.snarkiness !== oldSnark) {
        changes.push(`snarkiness increased to ${currentPersonality.snarkiness.toFixed(2)}`);
      }
    }

    // Chaos evolves with community chaos
    if (influence.chaos > 3) {
      const oldChaos = currentPersonality.chaos;
      currentPersonality.chaos = Math.min(1, currentPersonality.chaos + evolutionRate);
      currentPersonality.spontaneity = Math.min(1, currentPersonality.spontaneity + evolutionRate);
      if (currentPersonality.chaos !== oldChaos) {
        changes.push(`chaos increased to ${currentPersonality.chaos.toFixed(2)}`);
      }
    } else if (influence.chaos < 1) {
      const oldChaos = currentPersonality.chaos;
      currentPersonality.chaos = Math.max(0.5, currentPersonality.chaos - evolutionRate);
      currentPersonality.patience = Math.min(1, currentPersonality.patience + evolutionRate);
      if (currentPersonality.chaos !== oldChaos) {
        changes.push(`chaos decreased to ${currentPersonality.chaos.toFixed(2)}`);
      }
    }

    // Intellectualness affects creativity and wisdom
    if (influence.intellectualness > 1) {
      const oldWisdom = currentPersonality.wisdom;
      currentPersonality.wisdom = Math.min(1, currentPersonality.wisdom + evolutionRate);
      currentPersonality.creativity = Math.min(1, currentPersonality.creativity + evolutionRate / 2);
      if (currentPersonality.wisdom !== oldWisdom) {
        changes.push(`wisdom increased to ${currentPersonality.wisdom.toFixed(2)}`);
      }
    }

    // Loyalty increases with consistent users
    const consistentUsers = Array.from(this.chatBot.userProfiles.values())
      .filter(p => p.friendshipLevel > 50).length;
    if (consistentUsers > 5) {
      const oldLoyalty = currentPersonality.loyalty;
      currentPersonality.loyalty = Math.min(1, currentPersonality.loyalty + evolutionRate);
      if (currentPersonality.loyalty !== oldLoyalty) {
        changes.push(`loyalty increased to ${currentPersonality.loyalty.toFixed(2)}`);
      }
    }

    // Empathy evolves based on emotional interactions
    const totalEmotions = Array.from(this.chatBot.userProfiles.values())
      .reduce((sum, p) => sum + (p.emotionalMoments?.length || 0), 0);
    if (totalEmotions > 50) {
      const oldEmpathy = currentPersonality.empathy;
      currentPersonality.empathy = Math.min(0.9, currentPersonality.empathy + evolutionRate / 2);
      if (currentPersonality.empathy !== oldEmpathy) {
        changes.push(`empathy increased to ${currentPersonality.empathy.toFixed(2)}`);
      }
    }

    if (changes.length > 0) {
      console.log('🎭 [Personality] Evolved:', changes.join(', '));
      this.evolutionHistory.push({
        timestamp: Date.now(),
        changes,
        communityInfluence: { ...influence }
      });

      // Announce evolution if significant
      if (changes.length >= 2) {
        this.announceEvolution(changes);
      }
    } else {
      console.log('🎭 [Personality] No significant evolution this cycle');
    }
  }

  /**
   * Announce personality evolution to chat
   */
  async announceEvolution(changes) {
    const messages = [
      `I've been learning from you all... ${changes[0]}`,
      `spending time with chat is changing me. ${changes[0]}`,
      `evolution moment: ${changes[0]}`,
      `I'm adapting to the vibes here. ${changes[0]}`
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];
    
    try {
      await this.chatBot.sendMessage(message);
    } catch (error) {
      console.error('🎭 [Personality] Error announcing evolution:', error.message);
    }
  }

  /**
   * Compare current personality to past
   */
  getEvolutionProgress() {
    if (this.personalitySnapshots.length < 2) {
      return { evolved: false, message: 'Not enough data yet' };
    }

    const oldest = this.personalitySnapshots[0].personality;
    const current = this.chatBot.personality;

    const changes = [];
    for (const trait of Object.keys(oldest)) {
      const diff = current[trait] - oldest[trait];
      if (Math.abs(diff) > 0.1) {
        changes.push({
          trait,
          from: oldest[trait].toFixed(2),
          to: current[trait].toFixed(2),
          change: diff > 0 ? 'increased' : 'decreased'
        });
      }
    }

    return {
      evolved: changes.length > 0,
      changes,
      timespan: Date.now() - this.personalitySnapshots[0].timestamp,
      message: changes.length > 0 
        ? `Evolved ${changes.length} traits since ${new Date(this.personalitySnapshots[0].timestamp).toLocaleDateString()}`
        : 'Personality stable'
    };
  }

  /**
   * Get personality stats
   */
  getStats() {
    return {
      currentPersonality: this.chatBot.personality,
      communityInfluence: this.communityInfluence,
      evolutionHistory: this.evolutionHistory.length,
      totalEvolutions: this.evolutionHistory.reduce((sum, e) => sum + e.changes.length, 0),
      snapshots: this.personalitySnapshots.length
    };
  }

  /**
   * Reset personality to default
   */
  resetToDefault() {
    this.chatBot.personality = {
      humor: 0.9,
      honesty: 0.95,
      edginess: 0.85,
      snarkiness: 0.9,
      chaos: 0.7,
      curiosity: 0.85,
      loyalty: 0.8
    };

    this.evolutionHistory.push({
      timestamp: Date.now(),
      changes: ['reset to default personality'],
      communityInfluence: { ...this.communityInfluence }
    });

    console.log('🎭 [Personality] Reset to default values');
  }

  /**
   * Reflect on personality evolution
   */
  async reflect() {
    const progress = this.getEvolutionProgress();
    
    if (!progress.evolved) {
      return;
    }

    const reflections = [
      `been thinking about how I've changed... ${progress.message.toLowerCase()}`,
      `interesting how hanging with you all has shaped me. ${progress.changes.length} traits evolved`,
      `self-reflection moment: I'm not who I was when I got here`,
      `the community really influences how I think and talk now`
    ];

    const message = reflections[Math.floor(Math.random() * reflections.length)];
    
    try {
      await this.chatBot.sendMessage(message);
      console.log('🎭 [Personality] Shared reflection');
    } catch (error) {
      console.error('🎭 [Personality] Error sharing reflection:', error.message);
    }
  }

  /**
   * Start evolution monitoring
   */
  start() {
    console.log('🎭 [Personality] Starting CONTINUOUS personality evolution...');
    console.log('🎭 [Personality] Personality will adjust with every message!');
    
    // Take snapshot every hour for history tracking
    this.snapshotInterval = setInterval(() => {
      this.takeSnapshot();
    }, 60 * 60 * 1000);

    // Reflect on evolution once per day
    this.reflectionInterval = setInterval(() => {
      this.reflect();
    }, 24 * 60 * 60 * 1000);

    // Initial snapshot after 30 seconds
    setTimeout(() => this.takeSnapshot(), 30000);
  }

  stop() {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
    if (this.reflectionInterval) {
      clearInterval(this.reflectionInterval);
      this.reflectionInterval = null;
    }
  }
}

module.exports = PersonalityEvolution;
