/**
 * Ollama Circuit Breaker
 * Detects when Ollama is unavailable and gracefully falls back to simpler responses
 * Prevents cascading failures and provides auto-recovery
 */

class OllamaCircuitBreaker {
  constructor() {
    // Circuit states: CLOSED (working), OPEN (broken), HALF_OPEN (testing)
    this.state = 'CLOSED';
    
    // Failure tracking
    this.failureCount = 0;
    this.failureThreshold = 3; // Open circuit after 3 failures
    this.successCount = 0;
    this.successThreshold = 2; // Close circuit after 2 successes in HALF_OPEN
    
    // Timing
    this.lastFailureTime = 0;
    this.lastSuccessTime = Date.now();
    this.resetTimeout = 30000; // Try to recover after 30 seconds
    this.halfOpenTimeout = 60000; // Stay in HALF_OPEN for 60 seconds max
    
    // Stats
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalFallbacks = 0;
    
    // Fallback response templates - SMARTER AND MORE NATURAL
    this.fallbackResponses = {
      mentioned: [
        'yeah what\'s up',
        'yo',
        'what\'s good',
        'yeah i\'m here',
        'hm?',
        'listening',
        'yeah?',
        'sup'
      ],
      question: [
        'honestly not sure',
        'idk man could go either way',
        'hard to say tbh',
        'depends i guess',
        'probably yeah',
        'nah don\'t think so',
        'maybe, hard to tell',
        'couldn\'t tell you'
      ],
      positive: [
        'yeah that\'s solid',
        'nice',
        'fair point',
        'facts',
        'agreed honestly',
        'that\'s pretty good',
        'yeah i fuck with that',
        'respect'
      ],
      negative: [
        'damn that sucks',
        'oof rough',
        'yeah that\'s unfortunate',
        'brutal honestly',
        'rip',
        'that\'s tough',
        'yikes'
      ],
      neutral: [
        'fair enough',
        'i feel that',
        'yeah makes sense',
        'interesting take',
        'could be',
        'huh yeah',
        'i see what you mean',
        'true'
      ],
      excited: [
        'oh shit',
        'hell yeah',
        'lets gooo',
        'no way',
        'sick',
        'thats wild',
        'holy shit',
        'damn!'
      ]
    };
  }
  
  /**
   * Check if we should attempt AI generation
   */
  shouldAttemptAI() {
    this.totalRequests++;
    
    if (this.state === 'CLOSED') {
      // Everything working normally
      return true;
    }
    
    if (this.state === 'OPEN') {
      // Circuit is open (broken) - check if we should try recovery
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure > this.resetTimeout) {
        console.log('🔄 [CircuitBreaker] Attempting recovery - switching to HALF_OPEN');
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        return true;
      }
      
      // Still broken, use fallback
      this.totalFallbacks++;
      return false;
    }
    
    if (this.state === 'HALF_OPEN') {
      // Testing recovery - allow some requests through
      return true;
    }
    
    return false;
  }
  
  /**
   * Record successful AI generation
   */
  recordSuccess() {
    this.lastSuccessTime = Date.now();
    
    if (this.state === 'CLOSED') {
      // Reset failure count on success
      this.failureCount = 0;
      return;
    }
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      console.log(`✅ [CircuitBreaker] Success in HALF_OPEN (${this.successCount}/${this.successThreshold})`);
      
      if (this.successCount >= this.successThreshold) {
        console.log('✅ [CircuitBreaker] Recovery successful - circuit CLOSED');
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
      }
    }
  }
  
  /**
   * Record failed AI generation
   */
  recordFailure(error) {
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    this.failureCount++;
    
    console.error(`❌ [CircuitBreaker] Failure ${this.failureCount}/${this.failureThreshold}:`, error.message);
    
    if (this.state === 'CLOSED') {
      if (this.failureCount >= this.failureThreshold) {
        console.error('🔴 [CircuitBreaker] Threshold reached - circuit OPEN (AI disabled)');
        this.state = 'OPEN';
      }
    }
    
    if (this.state === 'HALF_OPEN') {
      // Failure during recovery - back to OPEN
      console.error('🔴 [CircuitBreaker] Recovery failed - circuit OPEN');
      this.state = 'OPEN';
      this.successCount = 0;
    }
  }
  
  /**
   * Get fallback response when AI is unavailable
   */
  getFallbackResponse(context = {}) {
    const { 
      mentioned = false, 
      sentiment = 0, 
      isQuestion = false,
      hasExclamation = false 
    } = context;
    
    // Determine response type
    let responseType;
    
    if (mentioned) {
      responseType = 'mentioned';
    } else if (isQuestion) {
      responseType = 'question';
    } else if (hasExclamation || sentiment > 0.7) {
      responseType = 'excited';
    } else if (sentiment > 0.3) {
      responseType = 'positive';
    } else if (sentiment < -0.3) {
      responseType = 'negative';
    } else {
      responseType = 'neutral';
    }
    
    const responses = this.fallbackResponses[responseType];
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    console.log(`🔄 [CircuitBreaker] Using fallback response (${responseType}): "${response}"`);
    
    return response;
  }
  
  /**
   * Get current state for monitoring
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalFallbacks: this.totalFallbacks,
      uptime: this.totalRequests > 0 
        ? ((this.totalRequests - this.totalFallbacks) / this.totalRequests * 100).toFixed(1) + '%'
        : '100%',
      lastFailure: this.lastFailureTime 
        ? Math.floor((Date.now() - this.lastFailureTime) / 1000) + 's ago'
        : 'never',
      lastSuccess: Math.floor((Date.now() - this.lastSuccessTime) / 1000) + 's ago'
    };
  }
  
  /**
   * Check if AI is currently available
   */
  isAIAvailable() {
    return this.state === 'CLOSED' || this.state === 'HALF_OPEN';
  }
  
  /**
   * Manual circuit reset (for testing/admin)
   */
  reset() {
    console.log('🔄 [CircuitBreaker] Manual reset');
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

module.exports = OllamaCircuitBreaker;
