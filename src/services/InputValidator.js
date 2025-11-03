/**
 * InputValidator - Validates API inputs to prevent injection attacks
 * Provides validation schemas and sanitization for all API endpoints
 */
class InputValidator {
  constructor() {
    // Validation patterns
    this.patterns = {
      username: /^[a-zA-Z0-9_-]{1,32}$/,
      channel: /^[a-zA-Z0-9_-]{1,64}$/,
      message: /^[\s\S]{1,2000}$/,
      amount: /^-?\d{1,10}$/,
      videoId: /^[a-zA-Z0-9_-]{1,64}$/,
      query: /^[\s\S]{1,500}$/,
      platform: /^(coolhole|discord|twitch)$/
    };

    // Dangerous characters to escape
    this.dangerousChars = ['<', '>', '"', "'", '&', '`', '{', '}', '|', '\\'];
  }

  /**
   * Validate username
   */
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required' };
    }

    if (!this.patterns.username.test(username)) {
      return { valid: false, error: 'Invalid username format (alphanumeric, _, - only, max 32 chars)' };
    }

    return { valid: true, value: username };
  }

  /**
   * Validate message content
   */
  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return { valid: false, error: 'Message is required' };
    }

    if (message.length > 2000) {
      return { valid: false, error: 'Message too long (max 2000 chars)' };
    }

    if (message.trim().length === 0) {
      return { valid: false, error: 'Message cannot be empty' };
    }

    // Sanitize message
    const sanitized = this.sanitizeString(message);

    return { valid: true, value: sanitized };
  }

  /**
   * Validate numeric amount (for CoolPoints)
   */
  validateAmount(amount) {
    if (amount === undefined || amount === null) {
      return { valid: false, error: 'Amount is required' };
    }

    const num = parseInt(amount);

    if (isNaN(num)) {
      return { valid: false, error: 'Amount must be a number' };
    }

    if (num < -1000000 || num > 1000000) {
      return { valid: false, error: 'Amount out of range (-1M to 1M)' };
    }

    return { valid: true, value: num };
  }

  /**
   * Validate video ID
   */
  validateVideoId(videoId) {
    if (!videoId || typeof videoId !== 'string') {
      return { valid: false, error: 'Video ID is required' };
    }

    if (!this.patterns.videoId.test(videoId)) {
      return { valid: false, error: 'Invalid video ID format' };
    }

    return { valid: true, value: videoId };
  }

  /**
   * Validate search query
   */
  validateQuery(query) {
    if (!query || typeof query !== 'string') {
      return { valid: false, error: 'Query is required' };
    }

    if (query.length > 500) {
      return { valid: false, error: 'Query too long (max 500 chars)' };
    }

    const sanitized = this.sanitizeString(query);

    return { valid: true, value: sanitized };
  }

  /**
   * Validate platform
   */
  validatePlatform(platform) {
    if (!platform || typeof platform !== 'string') {
      return { valid: false, error: 'Platform is required' };
    }

    if (!this.patterns.platform.test(platform)) {
      return { valid: false, error: 'Invalid platform (must be coolhole, discord, or twitch)' };
    }

    return { valid: true, value: platform };
  }

  /**
   * Validate channel name
   */
  validateChannel(channel) {
    if (!channel || typeof channel !== 'string') {
      return { valid: false, error: 'Channel is required' };
    }

    if (!this.patterns.channel.test(channel)) {
      return { valid: false, error: 'Invalid channel format' };
    }

    return { valid: true, value: channel };
  }

  /**
   * Validate pagination parameters
   */
  validatePagination(page, limit) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Check if page is valid (don't use default for validation)
    if (isNaN(pageNum) || pageNum < 1) {
      return { valid: false, error: 'Page must be >= 1' };
    }

    // Check if limit is valid (don't use default for validation)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return { valid: false, error: 'Limit must be between 1 and 100' };
    }

    return {
      valid: true,
      value: {
        page: pageNum,
        limit: limitNum,
        offset: (pageNum - 1) * limitNum
      }
    };
  }

  /**
   * Sanitize string to prevent XSS
   */
  sanitizeString(str) {
    if (typeof str !== 'string') return str;

    // Escape ampersand FIRST to prevent double-escaping
    let sanitized = str.replace(/&/g, '&amp;');

    // Then escape other dangerous characters
    const escapeMap = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;',
      '{': '&#x7B;',
      '}': '&#x7D;',
      '|': '&#x7C;',
      '\\': '&#x5C;'
    };

    for (const [char, entity] of Object.entries(escapeMap)) {
      const regex = new RegExp(this.escapeRegex(char), 'g');
      sanitized = sanitized.replace(regex, entity);
    }

    return sanitized;
  }

  /**
   * Get HTML entity for dangerous character
   */
  getEscapedChar(char) {
    const entities = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
      '`': '&#x60;',
      '{': '&#x7B;',
      '}': '&#x7D;',
      '|': '&#x7C;',
      '\\': '&#x5C;'
    };

    return entities[char] || char;
  }

  /**
   * Escape regex special characters
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Validate object against schema
   */
  validateObject(obj, schema) {
    const errors = [];

    for (const [key, rules] of Object.entries(schema)) {
      const value = obj[key];

      // Check required
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
        continue;
      }

      // Skip optional undefined values
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }

      // Type check
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`${key} must be of type ${rules.type}`);
          continue;
        }
      }

      // Min/max for numbers
      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${key} must be >= ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${key} must be <= ${rules.max}`);
        }
      }

      // Min/max length for strings
      if (rules.type === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`${key} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`${key} must be at most ${rules.maxLength} characters`);
        }
      }

      // Pattern matching
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} has invalid format`);
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Common schemas for API endpoints
   */
  static schemas = {
    sendMessage: {
      username: { required: true, type: 'string', maxLength: 32 },
      message: { required: true, type: 'string', minLength: 1, maxLength: 2000 },
      platform: { required: false, type: 'string', enum: ['coolhole', 'discord', 'twitch'] }
    },

    transfer: {
      from: { required: true, type: 'string', maxLength: 32 },
      to: { required: true, type: 'string', maxLength: 32 },
      amount: { required: true, type: 'number', min: 1, max: 1000000 }
    },

    addVideo: {
      videoId: { required: true, type: 'string', maxLength: 64 },
      title: { required: false, type: 'string', maxLength: 200 },
      duration: { required: false, type: 'number', min: 0 }
    },

    updatePersonality: {
      mode: { required: false, type: 'string', maxLength: 50 },
      mood: { required: false, type: 'string', maxLength: 50 },
      traits: { required: false, type: 'object' }
    }
  };
}

module.exports = InputValidator;
