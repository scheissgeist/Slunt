/**
 * OllamaRateLimiter.js
 * 
 * Prevents hammering the Ollama API with too many concurrent requests
 * - Max 10 concurrent calls
 * - Queue additional requests
 * - 15s timeout per request
 * - Prevents cascade failures from slow responses
 */

const logger = require('../bot/logger');

class OllamaRateLimiter {
  constructor() {
    this.maxConcurrent = 2; // REDUCED from 3 to 2 - prevent CUDA OOM errors
    this.timeout = 15000; // 15 seconds
    this.activeRequests = 0;
    this.queue = [];
    this.stats = {
      totalRequests: 0,
      queuedRequests: 0,
      timeouts: 0,
      completed: 0,
      failed: 0
    };

    logger.info(`🚦 [OllamaRL] Rate limiter initialized (max ${this.maxConcurrent} concurrent)`);
  }

  /**
   * Execute an AI request with rate limiting
   * @param {Function} requestFn - Async function that makes the Ollama request
   * @param {string} context - Description for logging
   * @returns {Promise} - Result of the request
   */
  async executeRequest(requestFn, context = 'Unknown') {
    this.stats.totalRequests++;

    // If at capacity, queue the request
    if (this.activeRequests >= this.maxConcurrent) {
      logger.warn(`🚦 [OllamaRL] At capacity (${this.activeRequests}/${this.maxConcurrent}), queueing: ${context}`);
      this.stats.queuedRequests++;
      
      // Wait for a slot to open up
      await this.waitForSlot();
    }

    // Execute the request with timeout
    this.activeRequests++;
    logger.info(`🚦 [OllamaRL] Executing (${this.activeRequests}/${this.maxConcurrent}): ${context}`);

    try {
      const result = await this.withTimeout(requestFn(), this.timeout);
      this.stats.completed++;
      return result;
    } catch (error) {
      if (error.message === 'Request timeout') {
        this.stats.timeouts++;
        logger.error(`⏱️ [OllamaRL] Timeout after ${this.timeout}ms: ${context}`);
      } else {
        this.stats.failed++;
        logger.error(`❌ [OllamaRL] Request failed: ${context}`, error.message);
      }
      throw error;
    } finally {
      this.activeRequests--;
      this.processQueue(); // Process next queued request
    }
  }

  /**
   * Wait for a slot to open up
   */
  async waitForSlot() {
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  /**
   * Process the next item in the queue
   */
  processQueue() {
    if (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const resolve = this.queue.shift();
      resolve();
    }
  }

  /**
   * Wrap a promise with a timeout
   */
  async withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      )
    ]);
  }

  /**
   * Check if we can make a request immediately
   */
  canExecuteImmediately() {
    return this.activeRequests < this.maxConcurrent;
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      utilizationPercent: Math.round((this.activeRequests / this.maxConcurrent) * 100),
      canExecuteImmediately: this.canExecuteImmediately()
    };
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0 
        ? Math.round((this.stats.completed / this.stats.totalRequests) * 100) 
        : 100,
      avgConcurrent: this.stats.totalRequests > 0
        ? (this.activeRequests / this.stats.totalRequests).toFixed(2)
        : 0
    };
  }

  /**
   * Reset stats
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      queuedRequests: 0,
      timeouts: 0,
      completed: 0,
      failed: 0
    };
    logger.info('🚦 [OllamaRL] Stats reset');
  }
}

module.exports = OllamaRateLimiter;
