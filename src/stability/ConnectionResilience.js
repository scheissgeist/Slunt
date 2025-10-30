/**
 * Connection Resilience Manager
 * Handles reconnection with exponential backoff and circuit breaker
 */

const logger = require('../bot/logger');

class ConnectionResilience {
  constructor() {
    this.platforms = new Map();
    
    // Circuit breaker config
    this.circuitBreaker = {
      failureThreshold: 5, // Failures before opening circuit
      successThreshold: 2, // Successes needed to close circuit
      timeout: 60000, // 1 minute timeout when open
      halfOpenRequests: 1 // Allow 1 request in half-open state
    };

    // Exponential backoff config
    this.backoffConfig = {
      initialDelay: 1000, // 1 second
      maxDelay: 300000, // 5 minutes
      multiplier: 2,
      maxAttempts: 10
    };

    // Health check interval
    this.healthCheckInterval = 30000; // 30 seconds
    this.healthCheckTimer = null;
  }

  /**
   * Register a platform for monitoring
   */
  registerPlatform(name, connectFn, disconnectFn, healthCheckFn) {
    this.platforms.set(name, {
      name,
      connectFn,
      disconnectFn,
      healthCheckFn,
      state: 'disconnected', // disconnected, connecting, connected, failed
      circuitState: 'closed', // closed, open, half-open
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      reconnectAttempts: 0,
      nextReconnectDelay: this.backoffConfig.initialDelay,
      reconnectTimer: null
    });

    logger.info(`📡 [Resilience] Registered platform: ${name}`);
  }

  /**
   * Start health monitoring
   */
  startHealthChecks() {
    if (this.healthCheckTimer) return;

    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);

    logger.info('🏥 [Resilience] Health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Stop all reconnect timers
    for (const [name, platform] of this.platforms) {
      if (platform.reconnectTimer) {
        clearTimeout(platform.reconnectTimer);
        platform.reconnectTimer = null;
      }
    }

    logger.info('🛑 [Resilience] Health monitoring stopped');
  }

  /**
   * Perform health checks on all platforms
   */
  async performHealthChecks() {
    for (const [name, platform] of this.platforms) {
      // Skip if already reconnecting or circuit is open
      if (platform.state === 'connecting' || platform.circuitState === 'open') {
        continue;
      }

      try {
        const isHealthy = await platform.healthCheckFn();
        
        if (!isHealthy && platform.state === 'connected') {
          logger.warn(`⚠️ [Resilience] ${name} health check failed`);
          this.handleDisconnection(name);
        } else if (isHealthy && platform.state !== 'connected') {
          logger.info(`✅ [Resilience] ${name} health check passed unexpectedly`);
          platform.state = 'connected';
          this.recordSuccess(name);
        }
      } catch (error) {
        logger.error(`❌ [Resilience] ${name} health check error: ${error.message}`);
        if (platform.state === 'connected') {
          this.handleDisconnection(name);
        }
      }
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(name) {
    const platform = this.platforms.get(name);
    if (!platform) return;

    logger.warn(`🔌 [Resilience] ${name} disconnected`);
    platform.state = 'disconnected';
    this.recordFailure(name);

    // Check circuit breaker
    if (this.shouldOpenCircuit(name)) {
      this.openCircuit(name);
    } else {
      this.scheduleReconnect(name);
    }
  }

  /**
   * Record a connection failure
   */
  recordFailure(name) {
    const platform = this.platforms.get(name);
    if (!platform) return;

    platform.failures++;
    platform.lastFailure = new Date();
    platform.successes = 0; // Reset success counter

    logger.warn(`📊 [Resilience] ${name} failures: ${platform.failures}`);
  }

  /**
   * Record a connection success
   */
  recordSuccess(name) {
    const platform = this.platforms.get(name);
    if (!platform) return;

    platform.successes++;
    platform.lastSuccess = new Date();
    platform.reconnectAttempts = 0;
    platform.nextReconnectDelay = this.backoffConfig.initialDelay;

    logger.info(`✅ [Resilience] ${name} successes: ${platform.successes}`);

    // Check if circuit should close
    if (platform.circuitState === 'half-open' && 
        platform.successes >= this.circuitBreaker.successThreshold) {
      this.closeCircuit(name);
    }
  }

  /**
   * Check if circuit breaker should open
   */
  shouldOpenCircuit(name) {
    const platform = this.platforms.get(name);
    if (!platform) return false;

    return platform.failures >= this.circuitBreaker.failureThreshold;
  }

  /**
   * Open circuit breaker
   */
  openCircuit(name) {
    const platform = this.platforms.get(name);
    if (!platform) return;

    platform.circuitState = 'open';
    platform.failures = 0;

    logger.error(`🚫 [Resilience] ${name} circuit OPENED (too many failures)`);

    // Schedule transition to half-open
    setTimeout(() => {
      this.halfOpenCircuit(name);
    }, this.circuitBreaker.timeout);
  }

  /**
   * Transition to half-open state
   */
  halfOpenCircuit(name) {
    const platform = this.platforms.get(name);
    if (!platform) return;

    platform.circuitState = 'half-open';
    platform.successes = 0;

    logger.warn(`⚠️ [Resilience] ${name} circuit HALF-OPEN (testing connection)`);
    
    // Attempt reconnection
    this.scheduleReconnect(name);
  }

  /**
   * Close circuit breaker
   */
  closeCircuit(name) {
    const platform = this.platforms.get(name);
    if (!platform) return;

    platform.circuitState = 'closed';
    platform.failures = 0;
    platform.successes = 0;

    logger.info(`✅ [Resilience] ${name} circuit CLOSED (healthy)`);
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect(name) {
    const platform = this.platforms.get(name);
    if (!platform) return;

    // Check max attempts
    if (platform.reconnectAttempts >= this.backoffConfig.maxAttempts) {
      logger.error(`❌ [Resilience] ${name} max reconnect attempts reached`);
      platform.state = 'failed';
      return;
    }

    // Clear existing timer
    if (platform.reconnectTimer) {
      clearTimeout(platform.reconnectTimer);
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      platform.nextReconnectDelay,
      this.backoffConfig.maxDelay
    );

    logger.info(`🔄 [Resilience] ${name} reconnecting in ${Math.round(delay/1000)}s (attempt ${platform.reconnectAttempts + 1})`);

    platform.reconnectTimer = setTimeout(() => {
      this.attemptReconnect(name);
    }, delay);

    // Increase delay for next time
    platform.nextReconnectDelay = Math.min(
      platform.nextReconnectDelay * this.backoffConfig.multiplier,
      this.backoffConfig.maxDelay
    );
  }

  /**
   * Attempt to reconnect
   */
  async attemptReconnect(name) {
    const platform = this.platforms.get(name);
    if (!platform) return;

    platform.reconnectAttempts++;
    platform.state = 'connecting';

    logger.info(`🔌 [Resilience] ${name} attempting reconnect #${platform.reconnectAttempts}...`);

    try {
      await platform.connectFn();
      platform.state = 'connected';
      this.recordSuccess(name);
      logger.info(`✅ [Resilience] ${name} reconnected successfully`);
    } catch (error) {
      logger.error(`❌ [Resilience] ${name} reconnect failed: ${error.message}`);
      platform.state = 'disconnected';
      this.recordFailure(name);

      // Check circuit breaker again
      if (this.shouldOpenCircuit(name)) {
        this.openCircuit(name);
      } else {
        this.scheduleReconnect(name);
      }
    }
  }

  /**
   * Graceful degradation - get list of healthy platforms
   */
  getHealthyPlatforms() {
    const healthy = [];
    for (const [name, platform] of this.platforms) {
      if (platform.state === 'connected' && platform.circuitState === 'closed') {
        healthy.push(name);
      }
    }
    return healthy;
  }

  /**
   * Get status of all platforms
   */
  getStatus() {
    const status = {};
    for (const [name, platform] of this.platforms) {
      status[name] = {
        state: platform.state,
        circuitState: platform.circuitState,
        failures: platform.failures,
        successes: platform.successes,
        reconnectAttempts: platform.reconnectAttempts,
        lastFailure: platform.lastFailure,
        lastSuccess: platform.lastSuccess
      };
    }
    return status;
  }
}

module.exports = new ConnectionResilience();
