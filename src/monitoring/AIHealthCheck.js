/**
 * AI Health Check System
 * Monitors Ollama availability and provides diagnostics
 */

const logger = require('../bot/logger');

class AIHealthCheck {
  constructor() {
    this.lastSuccessfulResponse = Date.now();
    this.consecutiveFailures = 0;
    this.ollamaStatus = 'unknown';
    this.checkInterval = 60000; // Check every minute
    this.alertThreshold = 3; // Alert after 3 failures
    
    this.startMonitoring();
  }

  /**
   * Start periodic health checks
   */
  startMonitoring() {
    setInterval(() => {
      this.checkOllamaHealth();
    }, this.checkInterval);
    
    // Initial check
    this.checkOllamaHealth();
  }

  /**
   * Check if Ollama is responding
   */
  async checkOllamaHealth() {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        
        if (this.ollamaStatus !== 'healthy') {
          logger.info('✅ [AIHealth] Ollama is now healthy');
          logger.info(`📚 [AIHealth] Available models: ${models.map(m => m.name).join(', ')}`);
        }
        
        this.ollamaStatus = 'healthy';
        this.consecutiveFailures = 0;
        return true;
      } else {
        this.recordFailure();
        return false;
      }
    } catch (error) {
      this.recordFailure();
      return false;
    }
  }

  /**
   * Record a failed health check
   */
  recordFailure() {
    this.consecutiveFailures++;
    
    if (this.consecutiveFailures === 1) {
      logger.warn('⚠️ [AIHealth] Ollama connection failed');
    }
    
    if (this.consecutiveFailures >= this.alertThreshold) {
      this.ollamaStatus = 'unhealthy';
      logger.error('❌ [AIHealth] Ollama is UNHEALTHY');
      logger.error(`   Consecutive failures: ${this.consecutiveFailures}`);
      logger.error('   💡 Fix: Start Ollama with: ollama serve');
      logger.error('   💡 Or check if Ollama is running: Get-Process ollama');
    }
  }

  /**
   * Record a successful AI response
   */
  recordSuccess() {
    const wasUnhealthy = this.ollamaStatus === 'unhealthy';
    
    this.lastSuccessfulResponse = Date.now();
    this.consecutiveFailures = 0;
    this.ollamaStatus = 'healthy';
    
    if (wasUnhealthy) {
      logger.info('✅ [AIHealth] Ollama has recovered!');
    }
  }

  /**
   * Get diagnostic info
   */
  getDiagnostics() {
    const timeSinceSuccess = Date.now() - this.lastSuccessfulResponse;
    const minutesSinceSuccess = Math.floor(timeSinceSuccess / 60000);
    
    return {
      status: this.ollamaStatus,
      consecutiveFailures: this.consecutiveFailures,
      lastSuccessMinutesAgo: minutesSinceSuccess,
      isHealthy: this.ollamaStatus === 'healthy' && this.consecutiveFailures === 0
    };
  }

  /**
   * Get status message for display
   */
  getStatusMessage() {
    const diag = this.getDiagnostics();
    
    if (diag.isHealthy) {
      return `✅ AI: Healthy (last success ${diag.lastSuccessMinutesAgo}m ago)`;
    } else if (this.consecutiveFailures > 0) {
      return `⚠️ AI: ${this.consecutiveFailures} failures - ${this.ollamaStatus}`;
    } else {
      return `❓ AI: Status unknown`;
    }
  }
}

module.exports = AIHealthCheck;
