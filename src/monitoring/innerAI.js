/**
 * INNER AI - Monitoring and validation system
 * 
 * Watches everything to ensure quality and catch issues before they become problems.
 * Acts as Slunt's "inner voice" checking responses, system health, and decision quality.
 */

const logger = require('../bot/logger');

class InnerAI {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.config = {
      // Quality thresholds
      minResponseLength: 5,
      maxResponseLength: 500,
      maxRepetitionRatio: 0.7, // If 70%+ is repeated words, flag it
      
      // Error tracking
      recentErrors: [],
      maxRecentErrors: 20,
      errorThreshold: 5, // Alert if 5+ errors in 5 minutes
      
      // Response quality
      recentResponses: [],
      maxRecentResponses: 50,
      
      // Health checks
      lastHealthCheck: Date.now(),
      healthCheckInterval: 60000 // Every 1 minute
    };
    
    // Start monitoring
    this.startHealthChecks();
    
    logger.info('🧠 [InnerAI] Monitoring initialized - watching for issues');
  }
  
  /**
   * ==========================================
   * RESPONSE VALIDATION
   * ==========================================
   */
  
  /**
   * Validate response before sending
   * Returns: { valid: boolean, reason: string, warnings: [] }
   */
  validateResponse(username, message, response, context = {}) {
    const warnings = [];
    const errors = [];
    
    // 1. Length checks
    if (!response || response.trim().length === 0) {
      errors.push('Empty response generated');
    } else if (response.length < this.config.minResponseLength) {
      warnings.push(`Response too short: ${response.length} chars`);
    } else if (response.length > this.config.maxResponseLength) {
      warnings.push(`Response too long: ${response.length} chars`);
    }
    
    // 2. Repetition detection
    const repetitionRatio = this.detectRepetition(response);
    if (repetitionRatio > this.config.maxRepetitionRatio) {
      warnings.push(`High repetition detected: ${Math.round(repetitionRatio * 100)}%`);
    }
    
    // 3. Check for common AI mistakes
    if (response.includes('as an AI') || response.includes('I cannot') || response.includes('I apologize')) {
      errors.push('Corporate AI language detected - breaks character');
    }
    
    // 4. Check for placeholder text
    if (response.includes('...') || response.includes('[') || response.includes('{')) {
      warnings.push('Possible placeholder text in response');
    }
    
    // 5. Excessive punctuation
    const exclamationCount = (response.match(/!/g) || []).length;
    if (exclamationCount > 3) {
      warnings.push('Too many exclamation marks - sounds desperate');
    }
    
    // 6. Check against recent responses (avoid saying same thing)
    const tooSimilar = this.checkSimilarityToRecent(response);
    if (tooSimilar) {
      warnings.push(`Too similar to recent response: "${tooSimilar.substring(0, 50)}"`);
    }
    
    // Log validation result
    const valid = errors.length === 0;
    
    if (!valid) {
      logger.warn(`❌ [InnerAI] Invalid response: ${errors.join(', ')}`);
    } else if (warnings.length > 0) {
      logger.warn(`⚠️ [InnerAI] Response warnings: ${warnings.join(', ')}`);
    }
    
    // Store response for future checks
    this.config.recentResponses.push({
      text: response,
      timestamp: Date.now(),
      username,
      valid
    });
    
    if (this.config.recentResponses.length > this.config.maxRecentResponses) {
      this.config.recentResponses.shift();
    }
    
    return {
      valid,
      errors,
      warnings,
      quality: this.calculateQuality(response, warnings, errors)
    };
  }
  
  /**
   * Detect word repetition in response
   */
  detectRepetition(text) {
    const words = text.toLowerCase().split(/\s+/);
    if (words.length < 3) return 0;
    
    const wordCounts = {};
    words.forEach(word => {
      if (word.length > 3) { // Only count words longer than 3 chars
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    
    let maxRepeat = 0;
    let totalSignificant = 0;
    Object.values(wordCounts).forEach(count => {
      if (count > maxRepeat) maxRepeat = count;
      totalSignificant++;
    });
    
    return totalSignificant > 0 ? maxRepeat / totalSignificant : 0;
  }
  
  /**
   * Check if response is too similar to recent responses
   */
  checkSimilarityToRecent(response) {
    const recent = this.config.recentResponses.slice(-10); // Check last 10
    const normalized = response.toLowerCase().trim();
    
    for (const prev of recent) {
      const prevNormalized = prev.text.toLowerCase().trim();
      
      // Exact match
      if (normalized === prevNormalized) {
        return prev.text;
      }
      
      // High overlap (80%+ same words)
      const overlap = this.calculateOverlap(normalized, prevNormalized);
      if (overlap > 0.8) {
        return prev.text;
      }
    }
    
    return null;
  }
  
  /**
   * Calculate word overlap between two strings
   */
  calculateOverlap(str1, str2) {
    const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 3));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    return intersection.size / Math.min(words1.size, words2.size);
  }
  
  /**
   * Calculate overall response quality score (0-1)
   */
  calculateQuality(response, warnings, errors) {
    let score = 1.0;
    
    // Deduct for errors
    score -= errors.length * 0.3;
    
    // Deduct for warnings
    score -= warnings.length * 0.1;
    
    // Bonus for good length (20-200 chars is sweet spot)
    const len = response.length;
    if (len >= 20 && len <= 200) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * ==========================================
   * ERROR TRACKING
   * ==========================================
   */
  
  /**
   * Log error for monitoring
   */
  logError(error, context = {}) {
    this.config.recentErrors.push({
      error: error.message || String(error),
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
    
    // Keep only recent errors
    if (this.config.recentErrors.length > this.config.maxRecentErrors) {
      this.config.recentErrors.shift();
    }
    
    // Check if we're having an error spike
    const recentCount = this.config.recentErrors.filter(e => 
      Date.now() - e.timestamp < 300000 // Last 5 minutes
    ).length;
    
    if (recentCount >= this.config.errorThreshold) {
      logger.error(`🚨 [InnerAI] ERROR SPIKE: ${recentCount} errors in last 5 minutes`);
      this.diagnoseIssue();
    }
  }
  
  /**
   * Diagnose what's causing issues
   */
  diagnoseIssue() {
    const recent = this.config.recentErrors.slice(-10);
    
    // Group by error type
    const errorTypes = {};
    recent.forEach(e => {
      const type = e.error.split(':')[0] || 'Unknown';
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });
    
    logger.error('🔍 [InnerAI] Error breakdown:', errorTypes);
    
    // Check for common patterns
    if (errorTypes['ECONNREFUSED'] || errorTypes['fetch failed']) {
      logger.error('💡 [InnerAI] Diagnosis: Network/API connection issues');
    } else if (errorTypes['TypeError'] || errorTypes['ReferenceError']) {
      logger.error('💡 [InnerAI] Diagnosis: Code errors - check recent changes');
    } else if (errorTypes['Timeout']) {
      logger.error('💡 [InnerAI] Diagnosis: Slow response times - API or system overload');
    }
  }
  
  /**
   * ==========================================
   * HEALTH MONITORING
   * ==========================================
   */
  
  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }
  
  /**
   * Perform health check
   */
  performHealthCheck() {
    const health = {
      timestamp: Date.now(),
      status: 'healthy',
      issues: []
    };
    
    // 1. Check error rate
    const recentErrorCount = this.config.recentErrors.filter(e => 
      Date.now() - e.timestamp < 300000
    ).length;
    
    if (recentErrorCount > 3) {
      health.issues.push(`High error rate: ${recentErrorCount} in 5min`);
      health.status = 'degraded';
    }
    
    // 2. Check response quality
    const recentResponses = this.config.recentResponses.slice(-20);
    const avgQuality = recentResponses.reduce((sum, r) => sum + (r.valid ? 1 : 0), 0) / Math.max(1, recentResponses.length);
    
    if (avgQuality < 0.8) {
      health.issues.push(`Low response quality: ${Math.round(avgQuality * 100)}%`);
      health.status = 'degraded';
    }
    
    // 3. Check memory usage (if available)
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (heapUsedMB > 500) {
      health.issues.push(`High memory usage: ${heapUsedMB}MB`);
      health.status = 'degraded';
    }
    
    // Log health status
    if (health.status !== 'healthy') {
      logger.warn(`⚠️ [InnerAI] Health check: ${health.status} - ${health.issues.join(', ')}`);
    } else {
      logger.info(`✅ [InnerAI] Health check: all systems nominal`);
    }
    
    this.config.lastHealthCheck = Date.now();
    
    return health;
  }
  
  /**
   * Get system diagnostics
   */
  getDiagnostics() {
    return {
      recentErrors: this.config.recentErrors.slice(-5),
      recentResponses: this.config.recentResponses.slice(-10).map(r => ({
        text: r.text.substring(0, 50),
        valid: r.valid,
        username: r.username
      })),
      health: this.performHealthCheck(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}

module.exports = InnerAI;
