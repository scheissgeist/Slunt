const fs = require('fs');
const path = require('path');
const logger = require('../bot/logger');

/**
 * MemoryQuota - Enforces size limits on data files
 * Prevents unbounded growth of memory files
 */
class MemoryQuota {
  constructor(dataArchiver) {
    this.dataArchiver = dataArchiver;
    this.dataDir = path.join(__dirname, '../../data');

    // File-specific quotas (in MB)
    this.quotas = {
      'chat_learning.json': 5,
      'memory_long_term.json': 2,
      'peer_influence.json': 3,
      'memory_metadata.json': 2,
      'gossip_mill.json': 1,
      'contradictions.json': 1,
      'conversation_threads.json': 1,
      'personality_infection.json': 1,
      'collective_unconscious.json': 1,
      'cognitive_state.json': 1,
      'callback_humor.json': 1
    };

    // Default quota for unlisted files
    this.defaultQuota = 5; // MB

    // Warning threshold (percentage of quota)
    this.warningThreshold = 0.8; // 80%

    logger.info('📊 MemoryQuota initialized');
  }

  /**
   * Check all data files against quotas
   * @returns {Object} Status report
   */
  checkAll() {
    const report = {
      total: 0,
      overQuota: [],
      nearQuota: [],
      healthy: []
    };

    try {
      const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));

      for (const file of files) {
        const status = this.checkFile(file);
        report.total++;

        if (status.overQuota) {
          report.overQuota.push(status);
        } else if (status.nearQuota) {
          report.nearQuota.push(status);
        } else {
          report.healthy.push(status);
        }
      }

      // Log warnings
      if (report.overQuota.length > 0) {
        logger.warn(`⚠️  ${report.overQuota.length} files over quota:`);
        report.overQuota.forEach(f => {
          logger.warn(`   ${f.filename}: ${f.sizeMB.toFixed(2)}MB / ${f.quotaMB}MB (${f.percentUsed}%)`);
        });
      }

      if (report.nearQuota.length > 0) {
        logger.info(`📊 ${report.nearQuota.length} files near quota:`);
        report.nearQuota.forEach(f => {
          logger.info(`   ${f.filename}: ${f.sizeMB.toFixed(2)}MB / ${f.quotaMB}MB (${f.percentUsed}%)`);
        });
      }

    } catch (error) {
      logger.error('❌ Error checking quotas:', error);
    }

    return report;
  }

  /**
   * Check a single file against its quota
   * @param {string} filename - Name of file to check
   * @returns {Object} File status
   */
  checkFile(filename) {
    const filePath = path.join(this.dataDir, filename);

    if (!fs.existsSync(filePath)) {
      return { filename, exists: false };
    }

    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / 1024 / 1024;
    const quotaMB = this.quotas[filename] || this.defaultQuota;
    const percentUsed = Math.round((sizeMB / quotaMB) * 100);

    const status = {
      filename,
      exists: true,
      sizeBytes: stats.size,
      sizeMB: sizeMB,
      quotaMB: quotaMB,
      percentUsed: percentUsed,
      overQuota: sizeMB > quotaMB,
      nearQuota: percentUsed >= (this.warningThreshold * 100) && sizeMB <= quotaMB
    };

    return status;
  }

  /**
   * Enforce quotas - archive files that exceed limits
   * @returns {Array} Results of enforcement actions
   */
  async enforceQuotas() {
    const report = this.checkAll();
    const results = [];

    // Handle over-quota files
    for (const fileStatus of report.overQuota) {
      logger.warn(`⚠️  Enforcing quota on ${fileStatus.filename}`);

      const archiveResult = await this.dataArchiver.archiveFile(fileStatus.filename);

      results.push({
        filename: fileStatus.filename,
        action: 'archived',
        ...archiveResult
      });

      // Check if still over quota after archiving
      const newStatus = this.checkFile(fileStatus.filename);
      if (newStatus.overQuota) {
        logger.error(`❌ ${fileStatus.filename} still over quota after archiving`);
        results[results.length - 1].stillOverQuota = true;
      }
    }

    return results;
  }

  /**
   * Set quota for a specific file
   * @param {string} filename - Name of file
   * @param {number} quotaMB - Quota in MB
   */
  setQuota(filename, quotaMB) {
    this.quotas[filename] = quotaMB;
    logger.info(`📊 Set quota for ${filename}: ${quotaMB}MB`);
  }

  /**
   * Get current quotas
   * @returns {Object} Current quota settings
   */
  getQuotas() {
    return { ...this.quotas, default: this.defaultQuota };
  }

  /**
   * Calculate total data size
   * @returns {Object} Size statistics
   */
  getTotalSize() {
    try {
      const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));

      let totalSize = 0;
      let totalQuota = 0;

      for (const file of files) {
        const filePath = path.join(this.dataDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        const quota = this.quotas[file] || this.defaultQuota;
        totalQuota += quota * 1024 * 1024; // Convert MB to bytes
      }

      return {
        totalFiles: files.length,
        totalSizeBytes: totalSize,
        totalSizeMB: totalSize / 1024 / 1024,
        totalQuotaMB: totalQuota / 1024 / 1024,
        percentUsed: Math.round((totalSize / totalQuota) * 100)
      };
    } catch (error) {
      logger.error('❌ Error calculating total size:', error);
      return null;
    }
  }

  /**
   * Auto-enforce quotas on a schedule
   * Call this from a cron job or interval
   */
  async autoEnforce() {
    logger.info('📊 Running automatic quota enforcement...');

    const results = await this.enforceQuotas();

    if (results.length > 0) {
      logger.info(`📊 Enforced quotas on ${results.length} files`);
    } else {
      logger.info('📊 All files within quota limits');
    }

    // Clean old archives
    await this.dataArchiver.cleanOldArchives();

    return results;
  }
}

module.exports = MemoryQuota;
