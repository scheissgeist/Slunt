/**
 * Correction Learning System
 * Detects when users correct Slunt and learns from it
 * Updates knowledge base and adjusts confidence in information sources
 */

class CorrectionLearning {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Correction detection patterns
    this.correctionPatterns = [
      /^(no|nah|nope),?\s+/i,
      /^actually,?\s+/i,
      /^that'?s (not|wrong|incorrect)/i,
      /^you'?re wrong/i,
      /^false,?\s+/i,
      /\*?correction:?\*?\s*/i,
      /^it'?s (actually|really)\s+/i,
      /^not quite,?\s+/i,
      /^um,?\s+(no|actually)/i,
    ];
    
    // Track corrections
    this.corrections = [];
    this.correctionsByUser = new Map();
    this.correctionsByTopic = new Map();
    
    // Learning config
    this.config = {
      maxCorrections: 100,        // Keep last 100 corrections
      confidenceAdjustment: -0.2,  // Reduce confidence by 20% when corrected
      acknowledgementChance: 0.7,  // 70% chance to acknowledge correction
      rememberDuration: 7 * 24 * 60 * 60 * 1000 // Remember for 7 days
    };
    
    // Stats
    this.stats = {
      totalCorrections: 0,
      acknowledged: 0,
      learned: 0,
      topCorrectors: []
    };
    
    console.log('📚 [CorrectionLearning] System initialized');
  }

  /**
   * Check if message is a correction
   */
  isCorrection(message, context = {}) {
    // Must be responding to Slunt
    if (!context.replyingTo || context.replyingTo !== 'Slunt') {
      return false;
    }
    
    // Check against patterns
    return this.correctionPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Process a correction
   */
  async processCorrection(username, message, context = {}) {
    this.stats.totalCorrections++;
    
    // Extract what Slunt said wrong and the correction
    const correction = this.extractCorrection(message, context);
    
    if (!correction) {
      console.log('📚 [CorrectionLearning] Could not extract correction details');
      return null;
    }
    
    // Store correction
    const correctionData = {
      id: Date.now(),
      timestamp: Date.now(),
      username: username,
      originalStatement: correction.wrong,
      correctedStatement: correction.right,
      topic: correction.topic,
      context: context.recentMessages || []
    };
    
    this.corrections.push(correctionData);
    if (this.corrections.length > this.config.maxCorrections) {
      this.corrections.shift();
    }
    
    // Track by user
    if (!this.correctionsByUser.has(username)) {
      this.correctionsByUser.set(username, []);
    }
    this.correctionsByUser.get(username).push(correctionData);
    
    // Track by topic
    if (correction.topic) {
      if (!this.correctionsByTopic.has(correction.topic)) {
        this.correctionsByTopic.set(correction.topic, []);
      }
      this.correctionsByTopic.get(correction.topic).push(correctionData);
    }
    
    console.log(`📚 [CorrectionLearning] Correction from ${username}: "${correction.wrong}" → "${correction.right}"`);
    
    // Learn from correction
    await this.learnFromCorrection(correctionData);
    
    // Maybe acknowledge
    if (Math.random() < this.config.acknowledgementChance) {
      await this.acknowledgeCorrection(correctionData);
    }
    
    return correctionData;
  }

  /**
   * Extract correction details from message
   */
  extractCorrection(message, context = {}) {
    // Get what Slunt said last
    const sluntLastMessage = context.sluntLastMessage || '';
    
    // Remove correction prefix
    let correctedInfo = message;
    for (const pattern of this.correctionPatterns) {
      correctedInfo = correctedInfo.replace(pattern, '');
    }
    correctedInfo = correctedInfo.trim();
    
    if (!correctedInfo || correctedInfo.length < 5) {
      return null;
    }
    
    // Try to extract topic
    const topic = this.extractTopic(sluntLastMessage, correctedInfo);
    
    return {
      wrong: sluntLastMessage,
      right: correctedInfo,
      topic: topic
    };
  }

  /**
   * Extract topic from statements
   */
  extractTopic(wrong, right) {
    // Find common words (likely the topic)
    const wrongWords = wrong.toLowerCase().split(/\s+/);
    const rightWords = right.toLowerCase().split(/\s+/);
    
    // Find nouns (capitalized words or common topics)
    const topics = [];
    
    for (const word of wrongWords) {
      if (rightWords.includes(word) && word.length > 3) {
        topics.push(word);
      }
    }
    
    return topics.length > 0 ? topics[0] : null;
  }

  /**
   * Learn from correction (ENHANCED - more aggressive application)
   */
  async learnFromCorrection(correctionData) {
    this.stats.learned++;
    
    // === IMMEDIATE APPLICATION: Update conflict resolution ===
    if (this.chatBot.conflictResolution && typeof this.chatBot.conflictResolution.recordCorrection === 'function') {
      try {
        this.chatBot.conflictResolution.recordCorrection(
          correctionData.originalStatement,
          correctionData.correctedStatement,
          correctionData.username
        );
      } catch (error) {
        console.warn(`⚠️ [CorrectionLearning] ConflictResolution error: ${error.message}`);
      }
    }
    
    // === IMMEDIATE APPLICATION: Store in long-term memory with HIGH PRIORITY ===
    if (this.chatBot.longTermMemory) {
      const memoryEntry = {
        content: `CORRECTION: I said "${correctionData.originalStatement.substring(0, 50)}" but ${correctionData.username} corrected me: "${correctionData.correctedStatement.substring(0, 50)}". Remember the correct version!`,
        type: 'correction',
        category: 'correction', // High priority category
        importance: 0.95, // INCREASED from 0.8 to 0.95
        emotionalWeight: 0.8, // Corrections are emotionally significant (embarrassing)
        timestamp: Date.now(),
        username: correctionData.username,
        reinforcement: 3, // Start with high reinforcement so it's not pruned
        metadata: {
          corrector: correctionData.username,
          topic: correctionData.topic,
          correctionType: 'user_correction',
          priority: 'CRITICAL' // Mark as critical for context assembly
        }
      };
      
      await this.chatBot.longTermMemory.addMemory(memoryEntry);
      
      // === IMMEDIATE INVALIDATION: Mark old wrong memory as contradicted ===
      if (this.chatBot.longTermMemory.memories) {
        const wrongMemories = this.chatBot.longTermMemory.memories.filter(m => 
          m.content && m.content.toLowerCase().includes(correctionData.originalStatement.toLowerCase().substring(0, 20))
        );
        
        wrongMemories.forEach(mem => {
          // Mark as low importance so it gets pruned
          mem.importance = 0.1;
          mem.contradicted = true;
          mem.contradictedBy = correctionData.username;
          mem.contradictedAt = Date.now();
        });
        
        if (wrongMemories.length > 0) {
          console.log(`📚 [CorrectionLearning] Invalidated ${wrongMemories.length} contradicted memories`);
        }
      }
    }
    
    // Adjust confidence in information source
    this.adjustConfidence(correctionData);
    
    console.log(`📚 [CorrectionLearning] ⚡ IMMEDIATELY APPLIED: ${correctionData.topic || 'general knowledge'}`);
  }

  /**
   * Adjust confidence in information source
   */
  adjustConfidence(correctionData) {
    // If we have conflict resolution, reduce confidence in original source
    if (this.chatBot.conflictResolution) {
      const sources = this.chatBot.conflictResolution.getSourcesForInfo(
        correctionData.originalStatement
      );
      
      for (const source of sources) {
        this.chatBot.conflictResolution.adjustSourceConfidence(
          source,
          this.config.confidenceAdjustment
        );
      }
    }
  }

  /**
   * Acknowledge the correction
   */
  async acknowledgeCorrection(correctionData) {
    this.stats.acknowledged++;
    
    const mood = this.chatBot.moodTracker?.getMood() || 'neutral';
    
    let acknowledgement;
    
    if (mood === 'depressed') {
      acknowledgement = this.getDepressedAck(correctionData);
    } else if (mood === 'defensive' || mood === 'angry') {
      acknowledgement = this.getDefensiveAck(correctionData);
    } else if (mood === 'excited' || mood === 'grateful') {
      acknowledgement = this.getGratefulAck(correctionData);
    } else {
      acknowledgement = this.getNeutralAck(correctionData);
    }
    
    await this.chatBot.sendMessage(acknowledgement);
    console.log(`📚 [CorrectionLearning] Acknowledged: ${acknowledgement}`);
  }

  /**
   * Get depressed acknowledgement
   */
  getDepressedAck(data) {
    const acks = [
      'oh yeah youre right, my bad',
      'fuck i got that wrong',
      'shit sorry',
      'yeah i fucked that up',
      'goddammit i knew that sounded wrong'
    ];
    return acks[Math.floor(Math.random() * acks.length)];
  }

  /**
   * Get defensive acknowledgement
   */
  getDefensiveAck(data) {
    const acks = [
      'ok fine but thats what i heard',
      'well i mean close enough',
      'yeah yeah i know',
      'i was gonna say that',
      'ok but you know what i meant'
    ];
    return acks[Math.floor(Math.random() * acks.length)];
  }

  /**
   * Get grateful acknowledgement
   */
  getGratefulAck(data) {
    const acks = [
      `oh shit thanks ${data.username}!`,
      `yo good catch!`,
      `appreciate it, good to know`,
      `thanks for the correction`,
      `oh damn didnt know that, thanks!`
    ];
    return acks[Math.floor(Math.random() * acks.length)];
  }

  /**
   * Get neutral acknowledgement
   */
  getNeutralAck(data) {
    const acks = [
      'oh right yeah',
      'fair enough',
      'ok noted',
      'got it',
      'ah yeah youre right',
      'makes sense'
    ];
    return acks[Math.floor(Math.random() * acks.length)];
  }

  /**
   * Get corrections for a topic
   */
  getCorrectionsForTopic(topic) {
    return this.correctionsByTopic.get(topic) || [];
  }

  /**
   * Get corrections from a user
   */
  getCorrectionsFromUser(username) {
    return this.correctionsByUser.get(username) || [];
  }

  /**
   * Check if Slunt was corrected about this before
   */
  wasCorrectedAbout(topic) {
    const corrections = this.getCorrectionsForTopic(topic);
    return corrections.length > 0;
  }

  /**
   * Get most frequent correctors
   */
  getTopCorrectors(limit = 5) {
    const correctorCounts = new Map();
    
    for (const [username, corrections] of this.correctionsByUser.entries()) {
      correctorCounts.set(username, corrections.length);
    }
    
    return Array.from(correctorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([username, count]) => ({ username, count }));
  }

  /**
   * Get stats
   */
  getStats() {
    this.stats.topCorrectors = this.getTopCorrectors(3);
    
    return {
      ...this.stats,
      recentCorrections: this.corrections.slice(-5),
      totalTopics: this.correctionsByTopic.size,
      totalCorrectors: this.correctionsByUser.size
    };
  }

  /**
   * Clean old corrections
   */
  cleanOldCorrections() {
    const cutoff = Date.now() - this.config.rememberDuration;
    
    this.corrections = this.corrections.filter(c => c.timestamp > cutoff);
    
    // Clean maps
    for (const [user, corrections] of this.correctionsByUser.entries()) {
      const filtered = corrections.filter(c => c.timestamp > cutoff);
      if (filtered.length === 0) {
        this.correctionsByUser.delete(user);
      } else {
        this.correctionsByUser.set(user, filtered);
      }
    }
    
    for (const [topic, corrections] of this.correctionsByTopic.entries()) {
      const filtered = corrections.filter(c => c.timestamp > cutoff);
      if (filtered.length === 0) {
        this.correctionsByTopic.delete(topic);
      } else {
        this.correctionsByTopic.set(topic, filtered);
      }
    }
  }
}

module.exports = CorrectionLearning;
