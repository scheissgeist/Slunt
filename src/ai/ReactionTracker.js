/**
 * ReactionTracker - Tracks and analyzes reactions to Slunt's messages
 * Provides emotional feedback and helps adapt conversation style
 */

const fs = require('fs');
const path = require('path');
const { getTimestamp } = require('../bot/logger');

class ReactionTracker {
  constructor() {
    this.reactions = new Map(); // messageId -> reaction data
    this.reactionHistory = []; // Recent reaction patterns
    this.emotionalFeedback = new Map(); // user -> emotional response patterns
    this.dataPath = path.join(__dirname, '../../data/reaction_tracking.json');
    
    // Reaction interpretation mappings
    this.reactionMeaning = {
      // Positive reactions
      '❤️': { type: 'love', sentiment: 1.0, weight: 0.9 },
      '😍': { type: 'love', sentiment: 1.0, weight: 0.9 },
      '🥰': { type: 'love', sentiment: 0.9, weight: 0.8 },
      '😘': { type: 'love', sentiment: 0.8, weight: 0.7 },
      '👍': { type: 'approval', sentiment: 0.7, weight: 0.6 },
      '👌': { type: 'approval', sentiment: 0.6, weight: 0.5 },
      '✅': { type: 'approval', sentiment: 0.6, weight: 0.5 },
      '💯': { type: 'approval', sentiment: 0.8, weight: 0.7 },
      '🔥': { type: 'hype', sentiment: 0.8, weight: 0.7 },
      '⚡': { type: 'hype', sentiment: 0.7, weight: 0.6 },
      '💪': { type: 'hype', sentiment: 0.7, weight: 0.6 },
      
      // Funny/Entertainment
      '😂': { type: 'funny', sentiment: 0.8, weight: 0.8 },
      '🤣': { type: 'funny', sentiment: 0.9, weight: 0.9 },
      '😆': { type: 'funny', sentiment: 0.7, weight: 0.7 },
      '💀': { type: 'funny', sentiment: 0.6, weight: 0.6 }, // "I'm dead" laughing
      '☠️': { type: 'funny', sentiment: 0.6, weight: 0.6 },
      
      // Neutral/Thinking
      '🤔': { type: 'thinking', sentiment: 0.1, weight: 0.3 },
      '🤨': { type: 'skeptical', sentiment: -0.2, weight: 0.4 },
      '😐': { type: 'neutral', sentiment: 0.0, weight: 0.2 },
      '🙄': { type: 'dismissive', sentiment: -0.4, weight: 0.5 },
      
      // Negative reactions
      '👎': { type: 'disapproval', sentiment: -0.7, weight: 0.8 },
      '❌': { type: 'disapproval', sentiment: -0.6, weight: 0.7 },
      '🤮': { type: 'disgust', sentiment: -0.9, weight: 0.9 },
      '😬': { type: 'cringe', sentiment: -0.5, weight: 0.6 },
      '🤡': { type: 'mockery', sentiment: -0.8, weight: 0.8 },
      '💩': { type: 'bad', sentiment: -0.7, weight: 0.7 },
      
      // Confusion/Questions
      '❓': { type: 'confused', sentiment: -0.1, weight: 0.4 },
      '❔': { type: 'confused', sentiment: -0.1, weight: 0.4 },
      '🤷': { type: 'confused', sentiment: -0.2, weight: 0.3 },
      '😕': { type: 'confused', sentiment: -0.3, weight: 0.4 }
    };
    
    this.loadData();
  }

  /**
   * Track a reaction to one of Slunt's messages
   */
  trackReaction(messageId, userId, username, emoji, messageText, timestamp = Date.now()) {
    const reactionData = this.reactionMeaning[emoji];
    if (!reactionData) {
      console.log(`[ReactionTracker] Unknown emoji: ${emoji}`);
      return;
    }

    // Store reaction details
    if (!this.reactions.has(messageId)) {
      this.reactions.set(messageId, {
        messageText,
        timestamp,
        reactions: [],
        totalSentiment: 0,
        dominantType: null
      });
    }

    const messageReactions = this.reactions.get(messageId);
    messageReactions.reactions.push({
      userId,
      username,
      emoji,
      type: reactionData.type,
      sentiment: reactionData.sentiment,
      weight: reactionData.weight,
      timestamp
    });

    // Update user's emotional feedback pattern
    if (!this.emotionalFeedback.has(username)) {
      this.emotionalFeedback.set(username, {
        totalReactions: 0,
        avgSentiment: 0,
        commonTypes: {},
        recentPattern: []
      });
    }

    const userFeedback = this.emotionalFeedback.get(username);
    userFeedback.totalReactions++;
    userFeedback.recentPattern.push({
      emoji,
      type: reactionData.type,
      sentiment: reactionData.sentiment,
      timestamp
    });

    // Keep only recent 20 reactions per user
    if (userFeedback.recentPattern.length > 20) {
      userFeedback.recentPattern.shift();
    }

    // Update type counts
    userFeedback.commonTypes[reactionData.type] = (userFeedback.commonTypes[reactionData.type] || 0) + 1;

    // Recalculate average sentiment
    const recentSentiments = userFeedback.recentPattern.map(r => r.sentiment);
    userFeedback.avgSentiment = recentSentiments.reduce((a, b) => a + b, 0) / recentSentiments.length;

    // Add to history for analysis
    this.reactionHistory.push({
      messageId,
      userId,
      username,
      emoji,
      type: reactionData.type,
      sentiment: reactionData.sentiment,
      timestamp,
      messageText: messageText.substring(0, 100) // Truncate for storage
    });

    // Keep only recent 100 reactions in memory
    if (this.reactionHistory.length > 100) {
      this.reactionHistory.shift();
    }

    console.log(`[ReactionTracker] ${username} reacted ${emoji} (${reactionData.type}, sentiment: ${reactionData.sentiment})`);
    
    // Save data periodically
    if (this.reactionHistory.length % 10 === 0) {
      this.saveData();
    }

    return this.analyzeReactionFeedback(messageId, username);
  }

  /**
   * Analyze the feedback for a specific message
   */
  analyzeReactionFeedback(messageId, triggerUser = null) {
    const messageData = this.reactions.get(messageId);
    if (!messageData) return null;

    const reactions = messageData.reactions;
    if (reactions.length === 0) return null;

    // Calculate overall sentiment
    const totalSentiment = reactions.reduce((sum, r) => sum + (r.sentiment * r.weight), 0);
    const avgSentiment = totalSentiment / reactions.length;

    // Find dominant reaction type
    const typeCounts = {};
    reactions.forEach(r => {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });
    const dominantType = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0]?.[0];

    messageData.totalSentiment = avgSentiment;
    messageData.dominantType = dominantType;

    return {
      messageId,
      totalReactions: reactions.length,
      avgSentiment,
      dominantType,
      typeCounts,
      triggerUser,
      shouldRespond: this.shouldRespondToReactions(avgSentiment, dominantType, reactions.length),
      responseType: this.getResponseType(avgSentiment, dominantType)
    };
  }

  /**
   * Determine if Slunt should respond to the reactions
   */
  shouldRespondToReactions(avgSentiment, dominantType, reactionCount) {
    // Always respond to very negative feedback
    if (avgSentiment < -0.6) return true;
    
    // Respond to lots of positive feedback
    if (avgSentiment > 0.7 && reactionCount >= 3) return true;
    
    // Respond to specific types
    if (['mockery', 'cringe', 'disgust'].includes(dominantType)) return true;
    if (dominantType === 'funny' && reactionCount >= 2) return true;
    if (dominantType === 'love' && reactionCount >= 2) return true;
    
    // Random chance for other reactions
    return Math.random() < 0.3;
  }

  /**
   * Get the type of response Slunt should make
   */
  getResponseType(avgSentiment, dominantType) {
    if (avgSentiment < -0.6) return 'defensive';
    if (avgSentiment > 0.7) return 'grateful';
    if (dominantType === 'funny') return 'proud';
    if (dominantType === 'mockery') return 'sassy';
    if (dominantType === 'cringe') return 'embarrassed';
    if (dominantType === 'love') return 'flattered';
    if (dominantType === 'confused') return 'clarifying';
    
    return 'acknowledge';
  }

  /**
   * Get user's reaction patterns for personality adaptation
   */
  getUserFeedbackPattern(username) {
    return this.emotionalFeedback.get(username) || null;
  }

  /**
   * Generate a response to reactions
   */
  generateReactionResponse(analysis, originalMessage) {
    if (!analysis) return null;

    const { avgSentiment, dominantType, totalReactions, responseType } = analysis;
    
    const responses = {
      defensive: [
        "what did i do wrong this time",
        "alright alright i get it",
        "damn yall really gonna do me like that",
        "noted, message received loud and clear",
        "ok ok i see how it is"
      ],
      grateful: [
        "aww thanks everyone",
        "appreciate the love",
        "yall are too kind honestly",
        "this is why i like you guys",
        "see this is the energy we need"
      ],
      proud: [
        "told you that was funny",
        "i still got it",
        "comedy gold right there",
        "glad yall appreciate quality content",
        "thank you thank you, i'll be here all week"
      ],
      sassy: [
        "oh so we're being clowns now?",
        "imagine thinking that was a bad take",
        "yall just don't understand genius when you see it",
        "keep that energy",
        "ok sure whatever you say"
      ],
      embarrassed: [
        "ok that was pretty cringe wasn't it",
        "sometimes you miss, it happens",
        "not my finest moment i'll admit",
        "we don't talk about that one",
        "moving on..."
      ],
      flattered: [
        "stop it you're making me blush",
        "love you too",
        "aww you guys",
        "this is sweet but also kinda weird",
        "appreciate you"
      ],
      clarifying: [
        "let me explain what i meant",
        "ok so basically",
        "yall confused? fair enough",
        "to clarify...",
        "what i was trying to say is"
      ],
      acknowledge: [
        "i see the reactions",
        "noted",
        "fair enough",
        "understood",
        "message received"
      ]
    };

    const responseOptions = responses[responseType] || responses.acknowledge;
    const baseResponse = responseOptions[Math.floor(Math.random() * responseOptions.length)];

    // Add reaction count context for multiple reactions
    if (totalReactions > 3) {
      return baseResponse + ` (${totalReactions} reactions? damn)`;
    }

    return baseResponse;
  }

  /**
   * Get recent reaction trends for conversation context
   */
  getRecentTrends() {
    if (this.reactionHistory.length < 5) return null;

    const recent = this.reactionHistory.slice(-10);
    const sentiments = recent.map(r => r.sentiment);
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;

    const types = {};
    recent.forEach(r => {
      types[r.type] = (types[r.type] || 0) + 1;
    });

    return {
      avgSentiment,
      dominantTypes: Object.entries(types).sort(([,a], [,b]) => b - a).slice(0, 3),
      totalReactions: recent.length,
      trend: avgSentiment > 0.3 ? 'positive' : avgSentiment < -0.3 ? 'negative' : 'neutral'
    };
  }

  /**
   * Save reaction data to disk
   */
  saveData() {
    try {
      const data = {
        reactionHistory: this.reactionHistory,
        emotionalFeedback: Array.from(this.emotionalFeedback.entries()),
        lastSaved: Date.now()
      };
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[ReactionTracker] Failed to save data:', error);
    }
  }

  /**
   * Load reaction data from disk
   */
  loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        this.reactionHistory = data.reactionHistory || [];
        this.emotionalFeedback = new Map(data.emotionalFeedback || []);
        console.log(`[ReactionTracker] Loaded ${this.reactionHistory.length} reaction records`);
      }
    } catch (error) {
      console.error('[ReactionTracker] Failed to load data:', error);
      this.reactionHistory = [];
      this.emotionalFeedback = new Map();
    }
  }

  /**
   * Get stats for debugging/monitoring
   */
  getStats() {
    return {
      totalReactions: this.reactionHistory.length,
      uniqueUsers: this.emotionalFeedback.size,
      avgSentiment: this.reactionHistory.length > 0 
        ? this.reactionHistory.reduce((sum, r) => sum + r.sentiment, 0) / this.reactionHistory.length 
        : 0,
      recentTrends: this.getRecentTrends()
    };
  }
}

module.exports = ReactionTracker;