const path = require('path');
const WriteQueue = require('../stability/WriteQueue');
const logger = require('../bot/logger');

/**
 * AdaptiveLearning - Learns from corrections and improves over time
 * Slunt remembers when people correct him and adjusts responses
 */
class AdaptiveLearning {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/corrections_learned.json');
    this.corrections = [];
    this.correctionPatterns = [
      /^actually[,\s]/i,
      /^no[,\s]/i,
      /that's (not|wrong|incorrect)/i,
      /it's not .+, it's/i,
      /you're wrong/i,
      /false[,\.]/i,
      /incorrect[,\.]/i,
      /\*correction\*/i
    ];

    this.confidenceDecay = 0.95; // 5% decay per day for old corrections
    this.maxCorrections = 1000; // Keep last 1000 corrections

    this.loadCorrections();
    logger.info('📚 AdaptiveLearning initialized');
  }

  /**
   * Load corrections from file
   */
  loadCorrections() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf-8');
        this.corrections = JSON.parse(data);
        logger.info(`📚 Loaded ${this.corrections.length} corrections`);
      } else {
        this.corrections = [];
        this.saveCorrections();
      }
    } catch (error) {
      logger.error('❌ Error loading corrections:', error);
      this.corrections = [];
    }
  }

  /**
   * Save corrections to file
   */
  async saveCorrections() {
    try {
      await WriteQueue.writeJSON(this.dataPath, this.corrections);
    } catch (error) {
      logger.error('❌ Error saving corrections:', error);
    }
  }

  /**
   * Detect if message is a correction
   * @param {string} message - Message text
   * @param {Object} context - Message context
   * @returns {boolean} True if correction detected
   */
  isCorrection(message, context = {}) {
    if (!message) return false;

    // Check for correction patterns
    for (const pattern of this.correctionPatterns) {
      if (pattern.test(message)) {
        return true;
      }
    }

    // Check if message is a reply to Slunt's message
    if (context.replyToSlunt && message.length < 200) {
      // Short reply to Slunt is likely a correction
      if (message.includes('not') || message.includes('wrong') || message.includes('actually')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract what was corrected
   * @param {string} sluntMessage - Slunt's original message
   * @param {string} correctionMessage - User's correction
   * @returns {Object} { wrongConcept, rightConcept, confidence }
   */
  extractCorrection(sluntMessage, correctionMessage) {
    const correction = {
      wrongConcept: null,
      rightConcept: null,
      confidence: 0.5,
      rawCorrection: correctionMessage
    };

    // Pattern: "It's not X, it's Y"
    const notItsMatch = correctionMessage.match(/it'?s not (.+?)[,;] it'?s (.+?)[\.,!?]/i);
    if (notItsMatch) {
      correction.wrongConcept = notItsMatch[1].trim();
      correction.rightConcept = notItsMatch[2].trim();
      correction.confidence = 0.9;
      return correction;
    }

    // Pattern: "Actually, [correct information]"
    const actuallyMatch = correctionMessage.match(/actually[,\s]+(.+?)[\.,!?]/i);
    if (actuallyMatch) {
      correction.rightConcept = actuallyMatch[1].trim();
      correction.confidence = 0.7;

      // Try to extract wrong concept from Slunt's message
      const sluntMatch = sluntMessage.match(/(?:is|are|was|were|will be)\s+(.+?)[\.,!?]/i);
      if (sluntMatch) {
        correction.wrongConcept = sluntMatch[1].trim();
      }

      return correction;
    }

    // Pattern: "No, [correct information]"
    const noMatch = correctionMessage.match(/^no[,\s]+(.+?)[\.,!?]/i);
    if (noMatch) {
      correction.rightConcept = noMatch[1].trim();
      correction.confidence = 0.6;
      return correction;
    }

    // Generic correction (low confidence)
    correction.rightConcept = correctionMessage.replace(/actually|no|wrong|incorrect/gi, '').trim();
    correction.confidence = 0.4;

    return correction;
  }

  /**
   * Learn from a correction
   * @param {Object} correctionData - Correction information
   */
  async learnCorrection(correctionData) {
    const {
      userId,
      username,
      platform,
      sluntMessage,
      correctionMessage,
      topic,
      timestamp
    } = correctionData;

    // Extract correction details
    const extraction = this.extractCorrection(sluntMessage, correctionMessage);

    // Create correction record
    const record = {
      id: `correction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      username,
      platform,
      timestamp: timestamp || new Date().toISOString(),
      sluntMessage: sluntMessage.substring(0, 200), // Truncate for storage
      correctionMessage: correctionMessage.substring(0, 200),
      wrongConcept: extraction.wrongConcept,
      rightConcept: extraction.rightConcept,
      topic: topic || 'unknown',
      confidence: extraction.confidence,
      timesReferenced: 0,
      lastReferenced: null
    };

    // Add to corrections
    this.corrections.unshift(record); // Add to front

    // Trim to max size
    if (this.corrections.length > this.maxCorrections) {
      this.corrections = this.corrections.slice(0, this.maxCorrections);
    }

    await this.saveCorrections();

    logger.info(`📚 Learned correction from ${username}: "${extraction.rightConcept}"`);

    return record;
  }

  /**
   * Get relevant corrections for a topic
   * @param {string} topic - Topic to search
   * @param {number} limit - Max corrections to return
   * @returns {Array} Relevant corrections
   */
  getCorrectionsForTopic(topic, limit = 5) {
    if (!topic) return [];

    const topicLower = topic.toLowerCase();

    // Find corrections related to topic
    const relevant = this.corrections.filter(c => {
      if (c.topic && c.topic.toLowerCase().includes(topicLower)) return true;
      if (c.rightConcept && c.rightConcept.toLowerCase().includes(topicLower)) return true;
      if (c.wrongConcept && c.wrongConcept.toLowerCase().includes(topicLower)) return true;
      return false;
    });

    // Sort by confidence and recency
    relevant.sort((a, b) => {
      const aScore = a.confidence * this.getCorrectionWeight(a.timestamp);
      const bScore = b.confidence * this.getCorrectionWeight(b.timestamp);
      return bScore - aScore;
    });

    return relevant.slice(0, limit);
  }

  /**
   * Search corrections by text
   * @param {string} searchText - Text to search
   * @param {number} limit - Max results
   * @returns {Array} Matching corrections
   */
  searchCorrections(searchText, limit = 10) {
    if (!searchText) return [];

    const searchLower = searchText.toLowerCase();

    const matches = this.corrections.filter(c => {
      if (c.rightConcept && c.rightConcept.toLowerCase().includes(searchLower)) return true;
      if (c.wrongConcept && c.wrongConcept.toLowerCase().includes(searchLower)) return true;
      if (c.correctionMessage && c.correctionMessage.toLowerCase().includes(searchLower)) return true;
      return false;
    });

    return matches.slice(0, limit);
  }

  /**
   * Get correction weight based on age (decay over time)
   * @param {string} timestamp - ISO timestamp
   * @returns {number} Weight (0-1)
   */
  getCorrectionWeight(timestamp) {
    const age = Date.now() - new Date(timestamp).getTime();
    const daysSince = age / (1000 * 60 * 60 * 24);
    return Math.pow(this.confidenceDecay, daysSince);
  }

  /**
   * Get corrections from a specific user
   * @param {string} userId - User ID
   * @param {number} limit - Max corrections
   * @returns {Array} User's corrections
   */
  getCorrectionsByUser(userId, limit = 10) {
    const userCorrections = this.corrections.filter(c => c.userId === userId);
    return userCorrections.slice(0, limit);
  }

  /**
   * Get learning confidence for a topic
   * @param {string} topic - Topic
   * @returns {number} Confidence (0-1)
   */
  getTopicConfidence(topic) {
    const corrections = this.getCorrectionsForTopic(topic, 100);

    if (corrections.length === 0) {
      return 0.5; // Neutral confidence
    }

    // Average confidence weighted by recency
    let totalWeight = 0;
    let weightedSum = 0;

    for (const correction of corrections) {
      const weight = this.getCorrectionWeight(correction.timestamp);
      totalWeight += weight;
      weightedSum += correction.confidence * weight;
    }

    const avgConfidence = weightedSum / totalWeight;

    // More corrections = higher overall confidence
    const correctionBonus = Math.min(corrections.length / 10, 0.2);

    return Math.min(avgConfidence + correctionBonus, 1.0);
  }

  /**
   * Generate context for AI about learned corrections
   * @param {string} topic - Current topic
   * @returns {string} Context string for AI prompt
   */
  generateCorrectionContext(topic) {
    const corrections = this.getCorrectionsForTopic(topic, 3);

    if (corrections.length === 0) {
      return '';
    }

    let context = '\n[Past Corrections You\'ve Learned]:\n';

    for (const correction of corrections) {
      const timeAgo = this.getTimeAgo(correction.timestamp);
      context += `- ${timeAgo}, ${correction.username} corrected you: "${correction.rightConcept}"\n`;

      // Mark as referenced
      correction.timesReferenced++;
      correction.lastReferenced = new Date().toISOString();
    }

    context += '[Remember these corrections when responding]\n';

    // Save updated reference counts
    this.saveCorrections();

    return context;
  }

  /**
   * Get human-readable time ago
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Time ago string
   */
  getTimeAgo(timestamp) {
    const age = Date.now() - new Date(timestamp).getTime();
    const days = Math.floor(age / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }

  /**
   * Get statistics about learning
   * @returns {Object} Learning stats
   */
  getStats() {
    const totalCorrections = this.corrections.length;
    const recentCorrections = this.corrections.filter(c => {
      const age = Date.now() - new Date(c.timestamp).getTime();
      return age < 7 * 24 * 60 * 60 * 1000; // Last 7 days
    }).length;

    const topicCounts = {};
    for (const correction of this.corrections) {
      if (correction.topic) {
        topicCounts[correction.topic] = (topicCounts[correction.topic] || 0) + 1;
      }
    }

    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const avgConfidence = this.corrections.reduce((sum, c) => sum + c.confidence, 0) / totalCorrections || 0;

    return {
      totalCorrections,
      recentCorrections,
      topTopics,
      avgConfidence: avgConfidence.toFixed(2),
      oldestCorrection: this.corrections[this.corrections.length - 1]?.timestamp,
      newestCorrection: this.corrections[0]?.timestamp
    };
  }

  /**
   * Process message to detect and learn from corrections
   * @param {Object} messageData - Message information
   * @returns {Object|null} Correction learned, or null
   */
  async processMessage(messageData) {
    const {
      userId,
      username,
      platform,
      message,
      previousSluntMessage,
      isReplyToSlunt
    } = messageData;

    // Check if this is a correction
    if (!this.isCorrection(message, { replyToSlunt: isReplyToSlunt })) {
      return null;
    }

    // Need previous Slunt message to learn from
    if (!previousSluntMessage) {
      logger.debug('📚 Correction detected but no previous Slunt message');
      return null;
    }

    // Learn the correction
    const correction = await this.learnCorrection({
      userId,
      username,
      platform,
      sluntMessage: previousSluntMessage,
      correctionMessage: message,
      topic: this.extractTopic(message),
      timestamp: new Date().toISOString()
    });

    return correction;
  }

  /**
   * Extract topic from message (simple keyword extraction)
   * @param {string} message - Message text
   * @returns {string} Topic
   */
  extractTopic(message) {
    // Remove common words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'it', 'its', 'not', 'no', 'actually'];
    const words = message.toLowerCase().split(/\s+/);
    const keywords = words.filter(w => !stopWords.includes(w) && w.length > 3);

    return keywords.slice(0, 3).join(' ') || 'general';
  }
}

module.exports = AdaptiveLearning;
