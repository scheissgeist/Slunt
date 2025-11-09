const EventEmitter = require('events');

/**
 * Connection Health Monitor - Monitors platform connections and triggers reconnections
 *
 * Features:
 * - Heartbeat monitoring
 * - Automatic reconnection with exponential backoff
 * - Connection metrics and diagnostics
 * - Health status reporting
 */
class ConnectionHealthMonitor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.platforms = new Map(); // platform name -> { client, config, state }
    this.checkInterval = options.checkInterval || 30000; // Check every 30 seconds
    this.heartbeatTimeout = options.heartbeatTimeout || 300000; // 5 minutes without activity = dead (was 2 min)
    this.maxReconnectAttempts = options.maxReconnectAttempts || 999; // Essentially unlimited retries
    this.baseReconnectDelay = options.baseReconnectDelay || 5000; // Start with 5s delay
    this.maxReconnectDelay = options.maxReconnectDelay || 60000; // Max 60s delay

    this.monitoringActive = false;
    this.monitorInterval = null;

    this.stats = {
      totalChecks: 0,
      totalReconnects: 0,
      totalFailures: 0,
      platformStats: {}
    };
  }

  /**
   * Register a platform for health monitoring
   */
  registerPlatform(name, client, config = {}) {
    console.log(`📡 [HealthMonitor] Registering platform: ${name}`);

    this.platforms.set(name, {
      client,
      config: {
        enabled: config.enabled !== false,
        critical: config.critical || false, // If true, bot won't work without it
        reconnectOnFail: config.reconnectOnFail !== false,
        maxReconnectAttempts: config.maxReconnectAttempts || this.maxReconnectAttempts,
        ...config
      },
      state: {
        connected: false,
        lastActivity: Date.now(),
        lastCheck: Date.now(),
        reconnectAttempts: 0,
        reconnecting: false,
        lastError: null,
        uptime: 0,
        downtimePeriods: []
      }
    });

    // Initialize platform stats
    this.stats.platformStats[name] = {
      totalReconnects: 0,
      totalFailures: 0,
      totalChecks: 0,
      uptimePercentage: 100,
      averageReconnectTime: 0
    };

    // Set up activity listeners
    this.setupActivityListeners(name, client);
  }

  /**
   * Set up listeners to track platform activity
   */
  setupActivityListeners(name, client) {
    // Common events that indicate activity
    const activityEvents = ['chat', 'message', 'connected', 'data', 'ready'];

    activityEvents.forEach(event => {
      client.on(event, () => {
        this.recordActivity(name);
      });
    });

    // Track disconnections
    client.on('disconnected', () => {
      this.recordDisconnection(name);
    });

    client.on('error', (error) => {
      this.recordError(name, error);
    });
  }

  /**
   * Record platform activity (heartbeat)
   */
  recordActivity(name) {
    const platform = this.platforms.get(name);
    if (platform) {
      platform.state.lastActivity = Date.now();

      // If was disconnected, mark as connected
      if (!platform.state.connected) {
        console.log(`✅ [HealthMonitor] ${name} is now active`);
        platform.state.connected = true;
        platform.state.reconnectAttempts = 0;
        this.emit('platform:connected', { platform: name });
      }
    }
  }

  /**
   * Record platform disconnection
   */
  recordDisconnection(name) {
    const platform = this.platforms.get(name);
    if (platform && platform.state.connected) {
      console.log(`❌ [HealthMonitor] ${name} disconnected`);
      platform.state.connected = false;
      platform.state.downtimePeriods.push({
        start: Date.now(),
        end: null
      });
      this.emit('platform:disconnected', { platform: name });
    }
  }

  /**
   * Record platform error
   */
  recordError(name, error) {
    const platform = this.platforms.get(name);
    if (platform) {
      platform.state.lastError = {
        message: error.message || String(error),
        timestamp: Date.now()
      };
      this.stats.platformStats[name].totalFailures++;
      console.log(`⚠️ [HealthMonitor] ${name} error: ${error.message}`);
    }
  }

  /**
   * Start monitoring all registered platforms
   */
  start() {
    if (this.monitoringActive) {
      console.log('⚠️ [HealthMonitor] Already monitoring');
      return;
    }

    console.log(`🚀 [HealthMonitor] Starting health monitoring (check interval: ${this.checkInterval}ms)`);
    this.monitoringActive = true;

    // Do initial check immediately
    this.checkAllPlatforms();

    // Then check periodically
    this.monitorInterval = setInterval(() => {
      this.checkAllPlatforms();
    }, this.checkInterval);
  }

  /**
   * Stop monitoring
   */
  stop() {
    console.log('🛑 [HealthMonitor] Stopping health monitoring');
    this.monitoringActive = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * Check health of all platforms
   */
  async checkAllPlatforms() {
    this.stats.totalChecks++;

    for (const [name, platform] of this.platforms.entries()) {
      if (!platform.config.enabled) continue;

      await this.checkPlatform(name);
    }
  }

  /**
   * Check health of a specific platform
   */
  async checkPlatform(name) {
    const platform = this.platforms.get(name);
    if (!platform) return;

    platform.state.lastCheck = Date.now();
    this.stats.platformStats[name].totalChecks++;

    const { client, config, state } = platform;
    const timeSinceActivity = Date.now() - state.lastActivity;

    // Check if connection is alive
    const isConnected = typeof client.isConnected === 'function'
      ? client.isConnected()
      : client.connected || false;

    // Check if we've seen activity recently (lenient: 5 minutes)
    const hasRecentActivity = timeSinceActivity < this.heartbeatTimeout;

    // Determine if platform is healthy - EITHER connected OR recently active
    // This fixes false negatives where connection flag is wrong but messages are flowing
    const isHealthy = isConnected || hasRecentActivity;

    if (!isHealthy && !state.reconnecting) {
      console.log(`💔 [HealthMonitor] ${name} appears unhealthy:`);
      console.log(`  - Connected: ${isConnected}`);
      console.log(`  - Time since activity: ${Math.round(timeSinceActivity / 1000)}s`);
      console.log(`  - Last error: ${state.lastError?.message || 'none'}`);

      if (config.reconnectOnFail) {
        await this.reconnectPlatform(name);
      } else {
        console.log(`  - Reconnect disabled for ${name}`);
      }
    } else if (isHealthy && state.reconnecting) {
      // Platform recovered
      console.log(`✅ [HealthMonitor] ${name} recovered!`);
      state.reconnecting = false;
      state.reconnectAttempts = 0;
    }
  }

  /**
   * Attempt to reconnect a platform
   */
  async reconnectPlatform(name) {
    const platform = this.platforms.get(name);
    if (!platform) return;

    const { client, config, state } = platform;

    // Check if we've exceeded max attempts
    if (state.reconnectAttempts >= config.maxReconnectAttempts) {
      console.log(`❌ [HealthMonitor] ${name} exceeded max reconnect attempts (${config.maxReconnectAttempts})`);
      this.emit('platform:failed', {
        platform: name,
        attempts: state.reconnectAttempts
      });
      return;
    }

    state.reconnecting = true;
    state.reconnectAttempts++;
    this.stats.totalReconnects++;
    this.stats.platformStats[name].totalReconnects++;

    // Calculate exponential backoff delay
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, state.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`🔄 [HealthMonitor] Reconnecting ${name} (attempt ${state.reconnectAttempts}/${config.maxReconnectAttempts}) in ${delay}ms`);

    const reconnectStart = Date.now();

    // Wait for backoff delay
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // Disconnect first (clean slate)
      if (typeof client.disconnect === 'function') {
        try {
          await client.disconnect();
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
        } catch (e) {
          console.log(`⚠️ [HealthMonitor] Error disconnecting ${name}:`, e.message);
        }
      }

      // Attempt reconnection
      console.log(`🔌 [HealthMonitor] Connecting ${name}...`);
      if (typeof client.connect === 'function') {
        await client.connect();
      } else {
        throw new Error('Client does not have connect() method');
      }

      const reconnectTime = Date.now() - reconnectStart;
      console.log(`✅ [HealthMonitor] ${name} reconnected in ${reconnectTime}ms`);

      // Update stats
      const stats = this.stats.platformStats[name];
      stats.averageReconnectTime = stats.averageReconnectTime
        ? (stats.averageReconnectTime + reconnectTime) / 2
        : reconnectTime;

      // Reset state
      state.connected = true;
      state.reconnecting = false;
      state.lastActivity = Date.now();

      // Close any downtime periods
      const lastDowntime = state.downtimePeriods[state.downtimePeriods.length - 1];
      if (lastDowntime && !lastDowntime.end) {
        lastDowntime.end = Date.now();
      }

      this.emit('platform:reconnected', {
        platform: name,
        attempts: state.reconnectAttempts,
        reconnectTime
      });

    } catch (error) {
      console.log(`❌ [HealthMonitor] Failed to reconnect ${name}:`, error.message);
      state.lastError = {
        message: error.message,
        timestamp: Date.now()
      };
      state.reconnecting = false;

      // Will retry on next check cycle
    }
  }

  /**
   * Force immediate reconnection of a platform
   */
  async forceReconnect(name) {
    const platform = this.platforms.get(name);
    if (!platform) {
      console.log(`❌ [HealthMonitor] Platform ${name} not found`);
      return false;
    }

    console.log(`🔨 [HealthMonitor] Force reconnecting ${name}`);
    platform.state.reconnectAttempts = 0; // Reset attempts
    await this.reconnectPlatform(name);
    return true;
  }

  /**
   * Get health status of all platforms
   */
  getStatus() {
    const platformStatus = {};

    for (const [name, platform] of this.platforms.entries()) {
      const { state, config } = platform;
      const timeSinceActivity = Date.now() - state.lastActivity;

      platformStatus[name] = {
        enabled: config.enabled,
        connected: state.connected,
        reconnecting: state.reconnecting,
        reconnectAttempts: state.reconnectAttempts,
        maxReconnectAttempts: config.maxReconnectAttempts,
        lastActivity: state.lastActivity,
        timeSinceActivity: timeSinceActivity,
        lastError: state.lastError,
        stats: this.stats.platformStats[name],
        health: this.getPlatformHealth(name)
      };
    }

    return {
      monitoring: this.monitoringActive,
      platforms: platformStatus,
      globalStats: this.stats
    };
  }

  /**
   * Get health score for a platform (0-100)
   */
  getPlatformHealth(name) {
    const platform = this.platforms.get(name);
    if (!platform) return 0;

    const { state } = platform;
    const timeSinceActivity = Date.now() - state.lastActivity;

    let score = 100;

    // Deduct for being disconnected
    if (!state.connected) score -= 50;

    // Deduct for inactivity
    if (timeSinceActivity > 60000) score -= 20; // > 1 min
    if (timeSinceActivity > 300000) score -= 20; // > 5 min

    // Deduct for reconnection attempts
    score -= state.reconnectAttempts * 5;

    // Deduct for recent errors
    if (state.lastError && Date.now() - state.lastError.timestamp < 60000) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get diagnostics for debugging
   */
  getDiagnostics() {
    const diagnostics = {
      timestamp: Date.now(),
      monitoring: this.monitoringActive,
      platforms: {}
    };

    for (const [name, platform] of this.platforms.entries()) {
      diagnostics.platforms[name] = {
        state: platform.state,
        config: platform.config,
        health: this.getPlatformHealth(name),
        clientType: platform.client.constructor.name
      };
    }

    return diagnostics;
  }
}

module.exports = ConnectionHealthMonitor;
