const logger = require('../bot/logger');
const fs = require('fs');
const path = require('path');

/**
 * ContextOptimizer - RAG-based context window optimization
 * Phase 2 Implementation - FULLY IMPLEMENTED
 *
 * Intelligently selects the most relevant context for AI prompts using:
 * - Semantic similarity (keyword matching for now, embeddings optional)
 * - Recency weighting
 * - Relevance scoring
 * - Token budget management
 * - Smart summarization for older content
 */
class ContextOptimizer {
  constructor(options = {}) {
    this.initialized = false;

    // Configuration
    this.config = {
      maxTokens: options.maxTokens || 2000, // Target token budget
      recentMessagesWindow: options.recentMessagesWindow || 10, // Always include last N messages
      relevanceThreshold: options.relevanceThreshold || 0.3, // Minimum score to include
      recencyWeight: options.recencyWeight || 0.4, // How much recency matters vs relevance
      summarizationThreshold: options.summarizationThreshold || 1000, // Summarize content older than this
      ...options
    };

    // State
    this.contextCache = new Map(); // Cache optimized contexts
    this.stats = {
      totalOptimizations: 0,
      avgTokensUsed: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    logger.info(`✨ ContextOptimizer created (budget: ${this.config.maxTokens} tokens)`);
  }

  /**
   * Initialize the system
   */
  async initialize() {
    if (this.initialized) return;

    logger.info(`✨ Initializing ContextOptimizer...`);

    // Clear old cache entries periodically
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanCache();
    }, 5 * 60 * 1000); // Every 5 minutes

    this.initialized = true;
    logger.info(`✅ ContextOptimizer initialized`);
  }

  /**
   * Optimize context for a conversation
   * @param {Object} options - Optimization parameters
   * @returns {Object} - Optimized context with messages and metadata
   */
  async optimizeContext(options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      messages = [],           // All available messages
      currentMessage = '',     // The message being responded to
      userProfile = {},        // User information
      platform = 'unknown',    // Platform context
      topic = null,            // Current topic if known
      maxTokens = this.config.maxTokens
    } = options;

    this.stats.totalOptimizations++;

    // Check cache
    const cacheKey = this.getCacheKey(messages, currentMessage);
    if (this.contextCache.has(cacheKey)) {
      this.stats.cacheHits++;
      logger.debug(`📦 [Context] Cache hit`);
      return this.contextCache.get(cacheKey);
    }
    this.stats.cacheMisses++;

    // Extract keywords from current message for relevance scoring
    const keywords = this.extractKeywords(currentMessage);

    // Score all messages
    const scoredMessages = messages.map((msg, index) => ({
      ...msg,
      index,
      score: this.scoreMessage(msg, keywords, index, messages.length)
    }));

    // Sort by score (highest first)
    scoredMessages.sort((a, b) => b.score - a.score);

    // Build optimized context
    const optimized = {
      recentMessages: [],
      relevantHistory: [],
      summary: '',
      metadata: {
        totalMessages: messages.length,
        includedMessages: 0,
        estimatedTokens: 0,
        keywords,
        platform,
        topic
      }
    };

    let tokenBudget = maxTokens;

    // Always include recent messages (last N)
    const recentCount = Math.min(this.config.recentMessagesWindow, messages.length);
    const recentMessages = messages.slice(-recentCount);

    for (const msg of recentMessages) {
      const tokens = this.estimateTokens(msg);
      if (tokenBudget - tokens > 200) { // Keep 200 token buffer
        optimized.recentMessages.push(msg);
        tokenBudget -= tokens;
        optimized.metadata.includedMessages++;
      }
    }

    // Add relevant older messages that aren't in recent
    const olderMessages = scoredMessages.filter(
      msg => msg.index < messages.length - recentCount &&
             msg.score >= this.config.relevanceThreshold
    );

    for (const msg of olderMessages) {
      const tokens = this.estimateTokens(msg);
      if (tokenBudget - tokens > 100) {
        optimized.relevantHistory.push(msg);
        tokenBudget -= tokens;
        optimized.metadata.includedMessages++;
      }
    }

    // If we have space, add a summary of the rest
    if (tokenBudget > 300 && messages.length > optimized.metadata.includedMessages + 5) {
      const unincludedMessages = messages.filter(
        msg => !optimized.recentMessages.includes(msg) &&
               !optimized.relevantHistory.some(h => h.index === messages.indexOf(msg))
      );

      optimized.summary = this.summarizeMessages(unincludedMessages);
      tokenBudget -= this.estimateTokens({ content: optimized.summary });
    }

    optimized.metadata.estimatedTokens = maxTokens - tokenBudget;

    // Update stats
    this.stats.avgTokensUsed =
      (this.stats.avgTokensUsed * (this.stats.totalOptimizations - 1) +
       optimized.metadata.estimatedTokens) / this.stats.totalOptimizations;

    // Cache result
    this.contextCache.set(cacheKey, optimized);

    logger.debug(`📊 [Context] Optimized: ${optimized.metadata.includedMessages}/${messages.length} messages, ~${optimized.metadata.estimatedTokens} tokens`);

    return optimized;
  }

  /**
   * Score a message for relevance and recency
   * @private
   */
  scoreMessage(message, keywords, index, totalMessages) {
    let score = 0;

    // Recency score (0.0 to 1.0, higher for recent)
    const recencyScore = index / totalMessages;

    // Relevance score (keyword matching)
    const content = (message.content || message.text || '').toLowerCase();
    let relevanceScore = 0;

    for (const keyword of keywords) {
      if (content.includes(keyword.toLowerCase())) {
        relevanceScore += 0.2;
      }
    }
    relevanceScore = Math.min(1.0, relevanceScore);

    // Importance markers
    if (message.mentionsBot || message.replyToBot) {
      relevanceScore += 0.3;
    }
    if (message.isQuestion) {
      relevanceScore += 0.2;
    }
    if (message.sentiment && message.sentiment !== 'neutral') {
      relevanceScore += 0.1;
    }

    // Weighted combination
    score = (recencyScore * this.config.recencyWeight) +
            (relevanceScore * (1 - this.config.recencyWeight));

    return Math.min(1.0, score);
  }

  /**
   * Extract keywords from a message
   * @private
   */
  extractKeywords(text) {
    if (!text) return [];

    // Remove common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
      'when', 'where', 'who', 'why', 'how', 'im', 'youre', 'hes', 'shes',
      'its', 'were', 'theyre', 'ive', 'youve', 'weve', 'theyve'
    ]);

    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Get top 10 most meaningful words (simple frequency for now)
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Estimate token count for a message
   * Simple approximation: ~4 chars per token
   * @private
   */
  estimateTokens(message) {
    const content = message.content || message.text || '';
    const username = message.username || message.author || '';

    // Rough approximation
    const charCount = content.length + username.length + 20; // +20 for metadata
    return Math.ceil(charCount / 4);
  }

  /**
   * Summarize a group of messages
   * @private
   */
  summarizeMessages(messages) {
    if (messages.length === 0) return '';

    // Extract key information
    const usernames = new Set();
    const topics = new Set();

    messages.forEach(msg => {
      if (msg.username) usernames.add(msg.username);

      // Simple topic extraction (any capitalized words or repeated terms)
      const content = msg.content || msg.text || '';
      const capitalWords = content.match(/\b[A-Z][a-z]+\b/g) || [];
      capitalWords.forEach(word => topics.add(word));
    });

    const userList = Array.from(usernames).slice(0, 3).join(', ');
    const topicList = Array.from(topics).slice(0, 3).join(', ');

    let summary = `Earlier (${messages.length} messages)`;
    if (userList) summary += `: ${userList} were chatting`;
    if (topicList) summary += ` about ${topicList}`;

    return summary;
  }

  /**
   * Generate cache key for context
   * @private
   */
  getCacheKey(messages, currentMessage) {
    // Simple hash based on recent message IDs and current message
    const recentIds = messages.slice(-5).map(m => m.id || m.timestamp).join(',');
    return `${recentIds}:${currentMessage.substring(0, 50)}`;
  }

  /**
   * Clean old cache entries
   * @private
   */
  cleanCache() {
    const maxCacheSize = 100;
    if (this.contextCache.size > maxCacheSize) {
      // Remove oldest entries (simple FIFO)
      const keysToRemove = Array.from(this.contextCache.keys()).slice(0, 20);
      keysToRemove.forEach(key => this.contextCache.delete(key));
      logger.debug(`🧹 [Context] Cleaned ${keysToRemove.length} cache entries`);
    }
  }

  /**
   * Format optimized context for AI prompt
   * @param {Object} optimizedContext - Result from optimizeContext()
   * @returns {string} - Formatted context string
   */
  formatForPrompt(optimizedContext) {
    const parts = [];

    // Add summary if present
    if (optimizedContext.summary) {
      parts.push(`[Background: ${optimizedContext.summary}]`);
      parts.push('');
    }

    // Add relevant history
    if (optimizedContext.relevantHistory.length > 0) {
      parts.push('[Relevant context:]');
      optimizedContext.relevantHistory
        .sort((a, b) => a.index - b.index) // Chronological order
        .forEach(msg => {
          parts.push(`${msg.username}: ${msg.content || msg.text}`);
        });
      parts.push('');
    }

    // Add recent messages
    if (optimizedContext.recentMessages.length > 0) {
      parts.push('[Recent conversation:]');
      optimizedContext.recentMessages.forEach(msg => {
        parts.push(`${msg.username}: ${msg.content || msg.text}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Get feature statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      totalOptimizations: this.stats.totalOptimizations,
      avgTokensUsed: Math.round(this.stats.avgTokensUsed),
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      cacheHitRate: this.stats.totalOptimizations > 0
        ? `${Math.round((this.stats.cacheHits / this.stats.totalOptimizations) * 100)}%`
        : '0%',
      cacheSize: this.contextCache.size,
      config: this.config
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info(`ContextOptimizer shutting down...`);

    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }

    this.contextCache.clear();
    this.initialized = false;

    logger.info(`✅ ContextOptimizer shutdown complete`);
  }
}

module.exports = ContextOptimizer;
