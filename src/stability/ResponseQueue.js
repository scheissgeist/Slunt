/**
 * Response Priority Queue
 * Manages response priorities and prevents queue overflow
 */

const logger = require('../bot/logger');

class ResponseQueue {
  constructor() {
    this.queue = [];
    this.maxQueueSize = 100;
    this.processing = false;
    this.messageHashes = new Set(); // For deduplication
    
    // Priority levels
    this.priorities = {
      URGENT: 4,      // Admin commands, critical errors
      MENTION: 3,     // Direct mentions (@Slunt)
      REPLY: 2,       // Replies to Slunt's messages
      PROACTIVE: 1,   // Proactive engagement
      BACKGROUND: 0   // Background tasks
    };

    // Adaptive rate limiting
    this.rateLimit = {
      messagesPerMinute: 15,
      burstSize: 5,
      cooldownMs: 4000, // 4 seconds between messages
      lastSent: 0,
      recentMessages: []
    };

    // Stats
    this.stats = {
      queued: 0,
      processed: 0,
      dropped: 0,
      deduplicated: 0,
      rateLimited: 0
    };
  }

  /**
   * Add response to queue
   */
  async enqueue(response) {
    // Check if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      // Drop lowest priority items
      this.dropLowPriority();
    }

    // Deduplication check
    const hash = this.hashMessage(response.text);
    if (this.messageHashes.has(hash)) {
      this.stats.deduplicated++;
      logger.warn(`🔁 [Queue] Duplicate message dropped: "${response.text.substring(0, 50)}..."`);
      return false;
    }

    // Add to queue
    const queueItem = {
      ...response,
      priority: response.priority || this.priorities.PROACTIVE,
      queuedAt: Date.now(),
      hash
    };

    this.queue.push(queueItem);
    this.stats.queued++;

    // Sort by priority
    this.queue.sort((a, b) => b.priority - a.priority);

    logger.info(`📥 [Queue] Queued (priority: ${queueItem.priority}, size: ${this.queue.length})`);

    // Start processing if not already
    if (!this.processing) {
      this.startProcessing();
    }

    return true;
  }

  /**
   * Start processing queue
   */
  async startProcessing() {
    if (this.processing) return;
    
    this.processing = true;
    logger.info('▶️ [Queue] Started processing');

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      
      try {
        // Check rate limits
        await this.waitForRateLimit();

        // Add to dedup set
        this.messageHashes.add(item.hash);

        // Remove old hashes (keep last 100)
        if (this.messageHashes.size > 100) {
          const hashArray = Array.from(this.messageHashes);
          this.messageHashes.delete(hashArray[0]);
        }

        // Process the item
        await this.processItem(item);

        this.stats.processed++;
        this.recordMessageSent();

      } catch (error) {
        logger.error(`❌ [Queue] Processing error: ${error.message}`);
        
        // Re-queue if critical
        if (item.priority >= this.priorities.MENTION) {
          item.retries = (item.retries || 0) + 1;
          if (item.retries < 3) {
            logger.info(`🔄 [Queue] Re-queuing critical item (retry ${item.retries})`);
            this.queue.unshift(item); // Add back to front
          }
        }
      }

      // Small delay between items
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
    logger.info('⏸️ [Queue] Queue empty, paused processing');
  }

  /**
   * Process a single queue item
   */
  async processItem(item) {
    if (!item.handler) {
      throw new Error('No handler provided for queue item');
    }

    logger.info(`📤 [Queue] Processing: "${item.text?.substring(0, 50) || 'no text'}..." (priority: ${item.priority})`);
    
    await item.handler();
  }

  /**
   * Wait for rate limit
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastSent = now - this.rateLimit.lastSent;

    // Check cooldown
    if (timeSinceLastSent < this.rateLimit.cooldownMs) {
      const waitTime = this.rateLimit.cooldownMs - timeSinceLastSent;
      logger.info(`⏱️ [Queue] Rate limit cooldown: ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.stats.rateLimited++;
    }

    // Check burst limit
    const oneMinuteAgo = now - 60000;
    this.rateLimit.recentMessages = this.rateLimit.recentMessages.filter(t => t > oneMinuteAgo);

    if (this.rateLimit.recentMessages.length >= this.rateLimit.messagesPerMinute) {
      const oldestMessage = Math.min(...this.rateLimit.recentMessages);
      const waitTime = 60000 - (now - oldestMessage) + 1000; // +1s buffer
      logger.warn(`⏱️ [Queue] Burst limit reached, waiting ${Math.round(waitTime/1000)}s`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.stats.rateLimited++;
    }
  }

  /**
   * Record message sent
   */
  recordMessageSent() {
    const now = Date.now();
    this.rateLimit.lastSent = now;
    this.rateLimit.recentMessages.push(now);
  }

  /**
   * Drop low priority items when queue is full
   */
  dropLowPriority() {
    // Find lowest priority items
    const lowestPriority = Math.min(...this.queue.map(item => item.priority));
    const toDrop = this.queue.filter(item => item.priority === lowestPriority);

    if (toDrop.length > 0) {
      // Drop oldest low priority item
      const dropIndex = this.queue.indexOf(toDrop[0]);
      const dropped = this.queue.splice(dropIndex, 1)[0];
      this.stats.dropped++;
      
      logger.warn(`🗑️ [Queue] Dropped low priority item: "${dropped.text?.substring(0, 50)}..."`);
    } else {
      // Queue full of high priority, drop oldest
      const dropped = this.queue.shift();
      this.stats.dropped++;
      logger.warn(`🗑️ [Queue] Queue overflow, dropped oldest: "${dropped.text?.substring(0, 50)}..."`);
    }
  }

  /**
   * Hash message for deduplication
   */
  hashMessage(text) {
    if (!text) return Math.random().toString();
    
    // Simple hash: lowercase, remove spaces/punctuation
    const normalized = text.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 100);
    
    return normalized;
  }

  /**
   * Get priority for response type
   */
  getPriority(responseType) {
    const typeMap = {
      'admin': this.priorities.URGENT,
      'mention': this.priorities.MENTION,
      'reply': this.priorities.REPLY,
      'proactive': this.priorities.PROACTIVE,
      'background': this.priorities.BACKGROUND
    };

    return typeMap[responseType] || this.priorities.PROACTIVE;
  }

  /**
   * Adjust rate limits based on platform health
   */
  adjustRateLimits(platformHealth) {
    if (platformHealth < 0.5) {
      // Platform struggling, reduce rate
      this.rateLimit.messagesPerMinute = Math.max(5, this.rateLimit.messagesPerMinute - 5);
      this.rateLimit.cooldownMs = Math.min(10000, this.rateLimit.cooldownMs + 1000);
      logger.warn(`📉 [Queue] Reduced rate limits due to low platform health (${Math.round(platformHealth * 100)}%)`);
    } else if (platformHealth > 0.9 && this.queue.length < 10) {
      // Platform healthy and queue small, increase rate
      this.rateLimit.messagesPerMinute = Math.min(20, this.rateLimit.messagesPerMinute + 1);
      this.rateLimit.cooldownMs = Math.max(2000, this.rateLimit.cooldownMs - 500);
      logger.info(`📈 [Queue] Increased rate limits due to high platform health (${Math.round(platformHealth * 100)}%)`);
    }
  }

  /**
   * Clear queue (for shutdown)
   */
  clear() {
    const dropped = this.queue.length;
    this.queue = [];
    this.messageHashes.clear();
    logger.warn(`🗑️ [Queue] Cleared ${dropped} pending items`);
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      size: this.queue.length,
      processing: this.processing,
      stats: this.stats,
      rateLimit: {
        messagesPerMinute: this.rateLimit.messagesPerMinute,
        cooldownMs: this.rateLimit.cooldownMs,
        recentCount: this.rateLimit.recentMessages.length
      },
      priorities: this.queue.reduce((acc, item) => {
        acc[item.priority] = (acc[item.priority] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.queue.length,
      successRate: this.stats.queued > 0 
        ? Math.round((this.stats.processed / this.stats.queued) * 100) 
        : 0
    };
  }
}

module.exports = ResponseQueue;
