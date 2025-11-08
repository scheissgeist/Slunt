/**
 * RESPONSE CACHE SYSTEM
 * 
 * Caches AI responses for repeated or similar questions
 * Provides instant responses and reduces API costs by 30-50%
 * 
 * Features:
 * - TTL-based expiration (1 hour default)
 * - Context-aware key generation
 * - Smart hit/miss tracking
 * - Automatic cleanup of stale entries
 */

const crypto = require('crypto');

class ResponseCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.maxSize = options.maxSize || 1000; // Max cached responses
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSaved: 0 // Estimated tokens saved
    };
    
    // Start cleanup timer (every 5 minutes)
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 300000);
    
    console.log('💾 [ResponseCache] Initialized with TTL:', this.ttl / 1000, 'seconds');
  }
  
  /**
   * Generate cache key from message and context
   */
  generateKey(message, context = {}) {
    // Normalize message
    const normalized = message.toLowerCase().trim()
      .replace(/[.,!?;]+$/, '') // Remove trailing punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    // Key factors that affect response
    const keyFactors = {
      message: normalized,
      // Bucket mood/energy to prevent cache misses from minor changes
      mood: context.mood || 'neutral',
      energyBucket: Math.floor((context.energy || 50) / 20) * 20, // Bucket by 20s
      isDrunk: context.isDrunk || false,
      isHigh: context.isHigh || false,
      // Don't include username - same question = same answer (unless user-specific)
      isUserSpecific: context.isUserSpecific || false
    };
    
    // Hash the key factors
    const keyString = JSON.stringify(keyFactors);
    return crypto.createHash('md5').update(keyString).digest('hex');
  }
  
  /**
   * Get cached response if available
   */
  async get(message, context = {}) {
    const key = this.generateKey(message, context);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Cache hit!
    this.stats.hits++;
    this.stats.totalSaved += cached.estimatedTokens || 100;
    
    const hitRate = (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1);
    console.log(`💾 [Cache] HIT! (${hitRate}% rate, saved ~${cached.estimatedTokens || 100} tokens, age: ${Math.floor(age / 1000)}s)`);
    
    // Update access time for LRU
    cached.lastAccess = Date.now();
    cached.accessCount++;
    
    return cached.response;
  }
  
  /**
   * Store response in cache
   */
  set(message, context = {}, response, metadata = {}) {
    const key = this.generateKey(message, context);
    
    // Enforce max size (LRU eviction)
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    const estimatedTokens = metadata.estimatedTokens || this.estimateTokens(message + response);
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      accessCount: 0,
      context: {
        mood: context.mood,
        energy: context.energy
      },
      estimatedTokens
    });
    
    console.log(`💾 [Cache] Stored response (${this.cache.size}/${this.maxSize}, ~${estimatedTokens} tokens)`);
  }
  
  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text) {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`💾 [Cache] Cleaned ${removed} expired entries (${this.cache.size} remain)`);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(1) : 0;
    
    return {
      ...this.stats,
      hitRate: parseFloat(hitRate),
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
  
  /**
   * Clear all cached responses
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`💾 [Cache] Cleared ${size} entries`);
  }
  
  /**
   * Shutdown cleanup timer
   */
  shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    console.log('💾 [Cache] Shutdown complete');
  }
}

module.exports = ResponseCache;
