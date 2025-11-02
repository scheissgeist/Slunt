/**
 * Personality Drift System
 * Makes Slunt's opinions and personality evolve gradually over time
 */

class PersonalityDrift {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.opinions = this.initializeOpinions();
    this.exposureTracking = new Map(); // topic -> exposure count
    this.driftLog = [];
  }

  /**
   * Initialize base opinions
   */
  initializeOpinions() {
    return {
      // Format: { stance: -10 to 10, confidence: 0-10, malleable: true/false }
      'mainstream_media': { stance: -3, confidence: 6, malleable: true },
      'indie_games': { stance: 7, confidence: 8, malleable: true },
      'social_media': { stance: -2, confidence: 5, malleable: true },
      'esports': { stance: 6, confidence: 7, malleable: true },
      'streaming': { stance: 8, confidence: 9, malleable: false }, // Core identity
      'discord': { stance: 9, confidence: 10, malleable: false },
      'twitter': { stance: -5, confidence: 6, malleable: true },
      'reddit': { stance: 4, confidence: 5, malleable: true },
      'tiktok': { stance: 2, confidence: 4, malleable: true },
      'youtube': { stance: 8, confidence: 9, malleable: false },
      'memes': { stance: 10, confidence: 10, malleable: false }, // Core passion
      'politics': { stance: 0, confidence: 3, malleable: true },
      'crypto': { stance: -4, confidence: 5, malleable: true },
      'ai': { stance: 3, confidence: 6, malleable: true },
      'old_internet': { stance: 9, confidence: 8, malleable: false },
      'modern_internet': { stance: -3, confidence: 7, malleable: true }
    };
  }

  /**
   * Track exposure to topics and perspectives
   */
  trackExposure(topic, userStance) {
    // Normalize topic
    const normalizedTopic = topic.toLowerCase();
    
    if (!this.exposureTracking.has(normalizedTopic)) {
      this.exposureTracking.set(normalizedTopic, {
        positive: 0,
        negative: 0,
        neutral: 0
      });
    }
    
    const exposure = this.exposureTracking.get(normalizedTopic);
    
    if (userStance > 0) exposure.positive++;
    else if (userStance < 0) exposure.negative++;
    else exposure.neutral++;
    
    // Check if opinion should drift
    this.checkDrift(normalizedTopic);
  }

  /**
   * Check if opinion should drift based on exposure
   */
  checkDrift(topic) {
    const opinion = this.opinions[topic];
    if (!opinion || !opinion.malleable) return;
    
    const exposure = this.exposureTracking.get(topic);
    if (!exposure) return;
    
    const totalExposure = exposure.positive + exposure.negative + exposure.neutral;
    if (totalExposure < 10) return; // Need significant exposure
    
    // Calculate drift direction
    const positiveRatio = exposure.positive / totalExposure;
    const negativeRatio = exposure.negative / totalExposure;
    
    let drift = 0;
    
    // Strong positive exposure
    if (positiveRatio > 0.6) {
      drift = +1;
    }
    // Strong negative exposure  
    else if (negativeRatio > 0.6) {
      drift = -1;
    }
    // Mixed exposure increases uncertainty
    else if (positiveRatio > 0.3 && negativeRatio > 0.3) {
      opinion.confidence = Math.max(0, opinion.confidence - 0.5);
      console.log(`🌊 [Drift] ${topic} confidence decreased (mixed signals): ${opinion.confidence.toFixed(1)}/10`);
      return;
    }
    
    if (drift !== 0) {
      const oldStance = opinion.stance;
      opinion.stance = Math.max(-10, Math.min(10, opinion.stance + drift));
      
      if (oldStance !== opinion.stance) {
        this.logDrift(topic, oldStance, opinion.stance);
      }
    }
  }

  /**
   * Log opinion drift
   */
  logDrift(topic, oldStance, newStance) {
    const change = {
      topic,
      oldStance,
      newStance,
      timestamp: Date.now()
    };
    
    this.driftLog.push(change);
    console.log(`🌊 [Drift] Opinion on "${topic}" shifted: ${oldStance} → ${newStance}`);
  }

  /**
   * Get current opinion on topic
   */
  getOpinion(topic) {
    const normalizedTopic = topic.toLowerCase();
    
    // Check exact matches first
    if (this.opinions[normalizedTopic]) {
      return this.opinions[normalizedTopic];
    }
    
    // Check partial matches
    for (const [key, opinion] of Object.entries(this.opinions)) {
      if (normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
        return opinion;
      }
    }
    
    return null;
  }

  /**
   * Get opinion context for response
   */
  getOpinionContext(topics) {
    let context = '';
    
    for (const topic of topics) {
      const opinion = this.getOpinion(topic);
      if (!opinion) continue;
      
      const stance = opinion.stance;
      const confidence = opinion.confidence;
      
      context += `\n[OPINION: ${topic}] `;
      
      if (stance > 7) {
        context += `You LOVE ${topic} (${stance}/10 positive)`;
      } else if (stance > 3) {
        context += `You like ${topic} (${stance}/10 positive)`;
      } else if (stance > -3) {
        context += `You're neutral/mixed on ${topic} (${stance}/10)`;
      } else if (stance > -7) {
        context += `You dislike ${topic} (${stance}/10 negative)`;
      } else {
        context += `You HATE ${topic} (${stance}/10 negative)`;
      }
      
      if (confidence < 5) {
        context += ` - BUT you're not super confident (${confidence}/10), might be swayed`;
      } else if (confidence > 8) {
        context += ` - FIRM belief (${confidence}/10), hard to change your mind`;
      }
    }
    
    return context;
  }

  /**
   * Manually adjust opinion (for testing/admin)
   */
  adjustOpinion(topic, stanceChange, confidenceChange = 0) {
    const opinion = this.getOpinion(topic);
    if (!opinion || !opinion.malleable) return false;
    
    const oldStance = opinion.stance;
    opinion.stance = Math.max(-10, Math.min(10, opinion.stance + stanceChange));
    opinion.confidence = Math.max(0, Math.min(10, opinion.confidence + confidenceChange));
    
    if (oldStance !== opinion.stance) {
      this.logDrift(topic, oldStance, opinion.stance);
    }
    
    return true;
  }

  /**
   * Get personality summary
   */
  getSummary() {
    const strong_opinions = [];
    const weak_opinions = [];
    
    for (const [topic, opinion] of Object.entries(this.opinions)) {
      if (Math.abs(opinion.stance) > 7 && opinion.confidence > 7) {
        strong_opinions.push({ topic, ...opinion });
      } else if (opinion.confidence < 5) {
        weak_opinions.push({ topic, ...opinion });
      }
    }
    
    return {
      strongOpinions: strong_opinions,
      weakOpinions: weak_opinions,
      driftCount: this.driftLog.length
    };
  }

  /**
   * Get stats
   */
  getStats() {
    const summary = this.getSummary();
    
    return {
      totalOpinions: Object.keys(this.opinions).length,
      strongOpinions: summary.strongOpinions.length,
      weakOpinions: summary.weakOpinions.length,
      totalDrifts: this.driftLog.length,
      recentDrifts: this.driftLog.slice(-5)
    };
  }
}

module.exports = PersonalityDrift;
