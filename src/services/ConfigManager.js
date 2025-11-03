const fs = require('fs');
const path = require('path');

/**
 * ConfigManager - Centralized configuration management
 * Prevents hardcoded values and enables environment-specific settings
 */
class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from multiple sources (priority: env > file > defaults)
   */
  loadConfig() {
    const defaults = this.getDefaults();
    const fileConfig = this.loadConfigFile();
    const envConfig = this.loadEnvConfig();

    // Merge configs (env overrides file overrides defaults)
    return {
      ...defaults,
      ...fileConfig,
      ...envConfig
    };
  }

  /**
   * Default configuration values
   */
  getDefaults() {
    return {
      // Server
      server: {
        port: 3000,
        host: 'localhost',
        env: 'development'
      },

      // Rate Limiting
      rateLimit: {
        windowMs: 60000, // 1 minute
        maxMessages: 15,
        maxCommands: 5,
        cooldownMs: 3000
      },

      // Memory System
      memory: {
        autosaveIntervalMs: 300000, // 5 minutes
        consolidationIntervalMs: 1800000, // 30 minutes
        shortTermRetentionHours: 24,
        midTermRetentionDays: 7,
        longTermRetentionDays: 365
      },

      // Personality System
      personality: {
        modeCheckIntervalMs: 300000, // 5 minutes
        driftCheckIntervalMs: 3600000, // 1 hour
        emotionUpdateIntervalMs: 60000 // 1 minute
      },

      // AI Engine
      ai: {
        provider: 'ollama', // 'ollama' or 'openai'
        ollamaHost: 'http://localhost:11434',
        ollamaModel: 'llama3.2:1b',
        openaiModel: 'gpt-4o-mini',
        maxTokens: 500,
        temperature: 0.9,
        timeoutMs: 30000
      },

      // Backup System
      backup: {
        enabled: true,
        intervalHours: 24,
        retentionDays: 7,
        directory: './backups'
      },

      // CoolPoints System
      coolpoints: {
        startingBalance: 1000,
        dailyBonus: 100,
        maxDebt: -5000,
        gamblingEnabled: true,
        transferEnabled: true
      },

      // Features
      features: {
        coolhole: true,
        discord: false,
        twitch: false,
        videoCommentary: true,
        autonomousLife: true,
        dashboards: true
      },

      // Logging
      logging: {
        level: 'info', // 'debug', 'info', 'warn', 'error'
        console: true,
        file: true,
        maxFiles: 5,
        maxSize: '10m'
      },

      // Performance
      performance: {
        memoryCheckIntervalMs: 60000, // 1 minute
        memoryThresholdMb: 500,
        gcIntervalMs: 300000, // 5 minutes
        responseQueueSize: 100
      },

      // Security
      security: {
        enableHelmet: true,
        enableCors: true,
        corsOrigin: '*',
        jwtExpirationHours: 24
      }
    };
  }

  /**
   * Load configuration from config file
   */
  loadConfigFile() {
    const configPath = path.join(process.cwd(), 'config', 'slunt-config.json');

    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(content);
        console.log('✅ Loaded configuration from file');
        return config;
      }
    } catch (error) {
      console.warn('⚠️  Failed to load config file:', error.message);
    }

    return {};
  }

  /**
   * Load configuration from environment variables
   */
  loadEnvConfig() {
    const env = process.env;

    return {
      server: {
        port: env.PORT ? parseInt(env.PORT) : undefined,
        host: env.HOST,
        env: env.NODE_ENV
      },

      rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS ? parseInt(env.RATE_LIMIT_WINDOW_MS) : undefined,
        maxMessages: env.RATE_LIMIT_MAX_MESSAGES ? parseInt(env.RATE_LIMIT_MAX_MESSAGES) : undefined
      },

      ai: {
        provider: env.AI_PROVIDER,
        ollamaHost: env.OLLAMA_HOST,
        ollamaModel: env.OLLAMA_MODEL,
        openaiModel: env.OPENAI_MODEL
      },

      coolpoints: {
        startingBalance: env.COOLPOINTS_STARTING_BALANCE ? parseInt(env.COOLPOINTS_STARTING_BALANCE) : undefined,
        dailyBonus: env.COOLPOINTS_DAILY_BONUS ? parseInt(env.COOLPOINTS_DAILY_BONUS) : undefined,
        maxDebt: env.COOLPOINTS_MAX_DEBT ? parseInt(env.COOLPOINTS_MAX_DEBT) : undefined
      },

      features: {
        coolhole: env.ENABLE_COOLHOLE === 'true',
        discord: env.ENABLE_DISCORD === 'true',
        twitch: env.ENABLE_TWITCH === 'true'
      },

      logging: {
        level: env.LOG_LEVEL,
        console: env.LOG_CONSOLE !== 'false'
      }
    };
  }

  /**
   * Get configuration value by path (e.g., 'server.port')
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set configuration value by path
   */
  set(path, value) {
    const keys = path.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in obj)) {
        obj[key] = {};
      }
      obj = obj[key];
    }

    obj[keys[keys.length - 1]] = value;
  }

  /**
   * Save current configuration to file
   */
  saveConfig() {
    const configDir = path.join(process.cwd(), 'config');
    const configPath = path.join(configDir, 'slunt-config.json');

    try {
      // Ensure config directory exists
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Write config file
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      console.log('✅ Configuration saved');
      return true;

    } catch (error) {
      console.error('❌ Failed to save config:', error);
      return false;
    }
  }

  /**
   * Get all configuration (deep clone to prevent mutation)
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];

    // Server validation
    if (this.get('server.port') < 1024 || this.get('server.port') > 65535) {
      errors.push('Invalid server port (must be 1024-65535)');
    }

    // Memory validation
    if (this.get('memory.autosaveIntervalMs') < 60000) {
      errors.push('Autosave interval too short (minimum 60000ms)');
    }

    // AI validation
    const aiProvider = this.get('ai.provider');
    if (!['ollama', 'openai'].includes(aiProvider)) {
      errors.push('Invalid AI provider (must be "ollama" or "openai")');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
module.exports = new ConfigManager();
