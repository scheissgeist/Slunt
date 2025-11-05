const logger = require('../bot/logger');

/**
 * UserIdentification - Manages user identity across platforms
 * Prevents ID collision between platforms (e.g., discord:alice vs twitch:alice)
 */
class UserIdentification {
  constructor() {
    this.platformPrefixes = {
      discord: 'discord',
      twitch: 'twitch',
      coolhole: 'coolhole',
      web: 'web'
    };

    logger.info('🆔 UserIdentification initialized');
  }

  /**
   * Create a prefixed user ID
   * @param {string} platform - Platform name (discord, twitch, coolhole)
   * @param {string} username - Username on platform
   * @returns {string} Prefixed ID (e.g., "discord:alice")
   */
  createUserId(platform, username) {
    if (!username) {
      throw new Error('Username is required');
    }

    // Normalize platform name
    const normalizedPlatform = platform.toLowerCase();

    // Validate platform
    if (!this.platformPrefixes[normalizedPlatform]) {
      logger.warn(`⚠️  Unknown platform: ${platform}, using raw username`);
      return `unknown:${username}`;
    }

    // Create prefixed ID
    const userId = `${normalizedPlatform}:${username}`;

    return userId;
  }

  /**
   * Parse a user ID to extract platform and username
   * @param {string} userId - Prefixed user ID
   * @returns {Object} { platform, username }
   */
  parseUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      return { platform: 'unknown', username: userId };
    }

    // Check if already prefixed
    if (userId.includes(':')) {
      const [platform, ...usernameParts] = userId.split(':');
      return {
        platform: platform,
        username: usernameParts.join(':') // Handle usernames with colons
      };
    }

    // Legacy format (no prefix) - treat as unknown platform
    return {
      platform: 'unknown',
      username: userId
    };
  }

  /**
   * Get platform from user ID
   * @param {string} userId - Prefixed user ID
   * @returns {string} Platform name
   */
  getPlatform(userId) {
    const { platform } = this.parseUserId(userId);
    return platform;
  }

  /**
   * Get username from user ID (without prefix)
   * @param {string} userId - Prefixed user ID
   * @returns {string} Username
   */
  getUsername(userId) {
    const { username } = this.parseUserId(userId);
    return username;
  }

  /**
   * Check if user ID is prefixed
   * @param {string} userId - User ID to check
   * @returns {boolean} True if prefixed
   */
  isPrefixed(userId) {
    if (!userId || typeof userId !== 'string') {
      return false;
    }

    const { platform } = this.parseUserId(userId);
    return platform !== 'unknown';
  }

  /**
   * Migrate legacy user ID to new format
   * @param {string} legacyId - Old user ID (no prefix)
   * @param {string} platform - Platform to assign
   * @returns {string} New prefixed ID
   */
  migrateLegacyId(legacyId, platform) {
    // Check if already migrated
    if (this.isPrefixed(legacyId)) {
      return legacyId;
    }

    // Create new prefixed ID
    return this.createUserId(platform, legacyId);
  }

  /**
   * Normalize user ID (ensure it's prefixed)
   * @param {string} userId - User ID
   * @param {string} defaultPlatform - Platform to use if not prefixed
   * @returns {string} Normalized user ID
   */
  normalize(userId, defaultPlatform = 'unknown') {
    if (this.isPrefixed(userId)) {
      return userId;
    }

    return this.createUserId(defaultPlatform, userId);
  }

  /**
   * Compare two user IDs (handles both prefixed and unprefixed)
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {boolean} True if same user
   */
  isSameUser(userId1, userId2) {
    // Exact match
    if (userId1 === userId2) {
      return true;
    }

    // Parse both IDs
    const parsed1 = this.parseUserId(userId1);
    const parsed2 = this.parseUserId(userId2);

    // Compare platform and username
    return (
      parsed1.platform === parsed2.platform &&
      parsed1.username.toLowerCase() === parsed2.username.toLowerCase()
    );
  }

  /**
   * Check if user exists on a specific platform
   * @param {string} userId - User ID
   * @param {string} platform - Platform to check
   * @returns {boolean} True if user is on platform
   */
  isOnPlatform(userId, platform) {
    const userPlatform = this.getPlatform(userId);
    return userPlatform.toLowerCase() === platform.toLowerCase();
  }

  /**
   * Get display name for user (username without prefix)
   * @param {string} userId - User ID
   * @returns {string} Display name
   */
  getDisplayName(userId) {
    return this.getUsername(userId);
  }

  /**
   * Get full display with platform (for debugging/admin)
   * @param {string} userId - User ID
   * @returns {string} Full display (e.g., "alice (Discord)")
   */
  getFullDisplay(userId) {
    const { platform, username } = this.parseUserId(userId);
    const platformName =
      platform.charAt(0).toUpperCase() + platform.slice(1);
    return `${username} (${platformName})`;
  }

  /**
   * Batch migrate user IDs in an object
   * @param {Object} data - Object containing user IDs as keys
   * @param {string} platform - Platform to assign
   * @returns {Object} Migrated object
   */
  migrateObject(data, platform) {
    const migrated = {};

    for (const [key, value] of Object.entries(data)) {
      // Check if key looks like a user ID
      const newKey = this.migrateLegacyId(key, platform);
      migrated[newKey] = value;
    }

    return migrated;
  }

  /**
   * Batch migrate user IDs in an array
   * @param {Array} data - Array of objects with userId field
   * @param {string} userIdField - Name of user ID field
   * @param {string} platform - Platform to assign
   * @returns {Array} Migrated array
   */
  migrateArray(data, userIdField = 'userId', platform) {
    return data.map(item => {
      if (item[userIdField]) {
        return {
          ...item,
          [userIdField]: this.migrateLegacyId(item[userIdField], platform)
        };
      }
      return item;
    });
  }

  /**
   * Create a cross-platform link between user IDs
   * @param {Array<string>} userIds - Array of user IDs to link
   * @returns {Object} Link object
   */
  createUserLink(userIds) {
    const link = {
      linkId: `link_${Date.now()}`,
      createdAt: new Date().toISOString(),
      accounts: userIds.map(id => {
        const { platform, username } = this.parseUserId(id);
        return { userId: id, platform, username };
      })
    };

    return link;
  }

  /**
   * Validate user ID format
   * @param {string} userId - User ID to validate
   * @returns {Object} { valid, reason }
   */
  validate(userId) {
    if (!userId) {
      return { valid: false, reason: 'User ID is empty' };
    }

    if (typeof userId !== 'string') {
      return { valid: false, reason: 'User ID must be a string' };
    }

    const { platform, username } = this.parseUserId(userId);

    if (!username) {
      return { valid: false, reason: 'Username is empty' };
    }

    if (platform === 'unknown') {
      return {
        valid: true,
        warning: 'User ID is not prefixed with platform'
      };
    }

    if (!this.platformPrefixes[platform]) {
      return { valid: true, warning: `Unknown platform: ${platform}` };
    }

    return { valid: true };
  }
}

// Create singleton instance
const userIdentification = new UserIdentification();

module.exports = userIdentification;
