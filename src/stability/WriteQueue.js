const fs = require('fs');
const path = require('path');
const logger = require('../bot/logger');

/**
 * WriteQueue - Single-writer pattern with queue for safe concurrent writes
 * Prevents file corruption from simultaneous writes
 */
class WriteQueue {
  constructor() {
    this.queues = new Map(); // filename -> array of pending writes
    this.locks = new Map();  // filename -> boolean
    this.stats = {
      totalWrites: 0,
      queuedWrites: 0,
      failedWrites: 0,
      averageWaitTime: 0
    };

    logger.info('🔒 WriteQueue initialized - Safe concurrent writes enabled');
  }

  /**
   * Write data to file with queue protection
   * @param {string} filePath - Absolute path to file
   * @param {string|Buffer} data - Data to write
   * @param {Object} options - Write options
   * @returns {Promise<boolean>} Success status
   */
  async write(filePath, data, options = {}) {
    const startTime = Date.now();

    // Normalize path
    const normalizedPath = path.normalize(filePath);

    // Initialize queue for this file if needed
    if (!this.queues.has(normalizedPath)) {
      this.queues.set(normalizedPath, []);
      this.locks.set(normalizedPath, false);
    }

    // Create write task
    const writeTask = {
      data,
      options,
      timestamp: Date.now(),
      resolve: null,
      reject: null
    };

    // Create promise for this write
    const writePromise = new Promise((resolve, reject) => {
      writeTask.resolve = resolve;
      writeTask.reject = reject;
    });

    // Add to queue
    this.queues.get(normalizedPath).push(writeTask);
    this.stats.queuedWrites++;

    // Process queue
    this.processQueue(normalizedPath);

    // Wait for write to complete
    try {
      const result = await writePromise;
      const waitTime = Date.now() - startTime;
      this.updateAverageWaitTime(waitTime);
      return result;
    } catch (error) {
      logger.error(`❌ Write failed for ${path.basename(normalizedPath)}:`, error.message);
      this.stats.failedWrites++;
      throw error;
    }
  }

  /**
   * Process write queue for a file
   * @param {string} filePath - File path
   */
  async processQueue(filePath) {
    // Check if already processing
    if (this.locks.get(filePath)) {
      return;
    }

    const queue = this.queues.get(filePath);
    if (!queue || queue.length === 0) {
      return;
    }

    // Acquire lock
    this.locks.set(filePath, true);

    try {
      while (queue.length > 0) {
        const task = queue.shift();

        try {
          await this.executeWrite(filePath, task.data, task.options);
          task.resolve(true);
          this.stats.totalWrites++;
        } catch (error) {
          task.reject(error);
        }
      }
    } finally {
      // Release lock
      this.locks.set(filePath, false);
    }
  }

  /**
   * Execute actual write with atomic pattern
   * @param {string} filePath - File path
   * @param {string|Buffer} data - Data to write
   * @param {Object} options - Write options
   */
  async executeWrite(filePath, data, options = {}) {
    // Atomic write pattern: write to temp file, then rename
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    const backupPath = `${filePath}.backup`;

    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Backup existing file if it exists
      if (fs.existsSync(filePath)) {
        try {
          fs.copyFileSync(filePath, backupPath);
        } catch (backupError) {
          // Backup failed, but continue (file might be locked briefly)
          logger.warn(`⚠️  Backup failed for ${path.basename(filePath)}, continuing anyway`);
        }
      }

      // Write to temp file
      fs.writeFileSync(tempPath, data, options);

      // Verify write succeeded
      if (!fs.existsSync(tempPath)) {
        throw new Error('Temp file not created');
      }

      // Validate JSON if it's a JSON file
      if (filePath.endsWith('.json')) {
        try {
          const content = fs.readFileSync(tempPath, 'utf-8');
          JSON.parse(content); // Validate JSON
        } catch (jsonError) {
          throw new Error(`Invalid JSON: ${jsonError.message}`);
        }
      }

      // Atomic rename (this is the critical operation)
      fs.renameSync(tempPath, filePath);

      // Delete backup on success
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }

    } catch (error) {
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Restore from backup if available
      if (fs.existsSync(backupPath)) {
        try {
          fs.copyFileSync(backupPath, filePath);
          logger.warn(`⚠️  Restored ${path.basename(filePath)} from backup`);
        } catch (restoreError) {
          logger.error(`❌ Failed to restore from backup: ${restoreError.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Write JSON data with formatting
   * @param {string} filePath - File path
   * @param {Object} data - JSON data
   * @param {Object} options - Write options
   */
  async writeJSON(filePath, data, options = {}) {
    const jsonString = JSON.stringify(data, null, 2);
    return this.write(filePath, jsonString, { encoding: 'utf-8', ...options });
  }

  /**
   * Read file safely (for convenience)
   * @param {string} filePath - File path
   * @returns {Promise<string>} File contents
   */
  async read(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Read and parse JSON safely
   * @param {string} filePath - File path
   * @returns {Promise<Object>} Parsed JSON
   */
  async readJSON(filePath) {
    const content = await this.read(filePath);
    return JSON.parse(content);
  }

  /**
   * Update average wait time statistic
   * @param {number} waitTime - Wait time in ms
   */
  updateAverageWaitTime(waitTime) {
    const alpha = 0.1; // Smoothing factor
    this.stats.averageWaitTime =
      this.stats.averageWaitTime * (1 - alpha) + waitTime * alpha;
  }

  /**
   * Get queue statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const queueSizes = {};
    let totalQueued = 0;

    for (const [filePath, queue] of this.queues.entries()) {
      const filename = path.basename(filePath);
      queueSizes[filename] = queue.length;
      totalQueued += queue.length;
    }

    return {
      ...this.stats,
      currentlyQueued: totalQueued,
      queueSizes,
      averageWaitTimeMs: Math.round(this.stats.averageWaitTime)
    };
  }

  /**
   * Clear queue for a specific file (emergency use only)
   * @param {string} filePath - File path
   */
  clearQueue(filePath) {
    const normalizedPath = path.normalize(filePath);
    const queue = this.queues.get(normalizedPath);

    if (queue) {
      const clearedCount = queue.length;

      // Reject all pending writes
      while (queue.length > 0) {
        const task = queue.shift();
        task.reject(new Error('Queue cleared'));
      }

      logger.warn(`⚠️  Cleared ${clearedCount} pending writes for ${path.basename(filePath)}`);
      return clearedCount;
    }

    return 0;
  }

  /**
   * Wait for all writes to complete
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<boolean>} Success status
   */
  async flush(timeout = 10000) {
    const startTime = Date.now();

    while (true) {
      let allEmpty = true;

      for (const queue of this.queues.values()) {
        if (queue.length > 0) {
          allEmpty = false;
          break;
        }
      }

      if (allEmpty) {
        logger.info('✅ All write queues flushed');
        return true;
      }

      if (Date.now() - startTime > timeout) {
        logger.warn('⚠️  Write queue flush timeout');
        return false;
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// Create singleton instance
const writeQueue = new WriteQueue();

module.exports = writeQueue;
