const DataArchiver = require('./DataArchiver');
const MemoryQuota = require('./MemoryQuota');
const WriteQueue = require('./WriteQueue');
const UserIdentification = require('../services/UserIdentification');
const logger = require('../bot/logger');
const cron = require('node-cron');

/**
 * StabilityManager - Coordinates all stability systems
 * Ensures Slunt runs reliably 24/7
 */
class StabilityManager {
  constructor() {
    this.dataArchiver = new DataArchiver();
    this.memoryQuota = new MemoryQuota(this.dataArchiver);
    this.writeQueue = WriteQueue; // Singleton
    this.userIdentification = UserIdentification; // Singleton

    this.cronJobs = [];
    this.initialized = false;

    logger.info('🛡️  StabilityManager created');
  }

  /**
   * Initialize all stability systems
   */
  async initialize() {
    if (this.initialized) {
      logger.warn('⚠️  StabilityManager already initialized');
      return;
    }

    logger.info('🛡️  Initializing StabilityManager...');

    // Check current memory status
    await this.checkMemoryStatus();

    // Schedule automatic maintenance
    this.scheduleMaintenance();

    this.initialized = true;
    logger.info('✅ StabilityManager initialized');
  }

  /**
   * Check current memory/quota status
   */
  async checkMemoryStatus() {
    logger.info('📊 Checking memory status...');

    // Check quotas
    const quotaReport = this.memoryQuota.checkAll();

    logger.info(`📊 Data files status:`);
    logger.info(`   Total files: ${quotaReport.total}`);
    logger.info(`   Over quota: ${quotaReport.overQuota.length}`);
    logger.info(`   Near quota: ${quotaReport.nearQuota.length}`);
    logger.info(`   Healthy: ${quotaReport.healthy.length}`);

    // Get total size
    const sizeInfo = this.memoryQuota.getTotalSize();
    if (sizeInfo) {
      logger.info(`📊 Total data size: ${sizeInfo.totalSizeMB.toFixed(2)}MB / ${sizeInfo.totalQuotaMB.toFixed(2)}MB (${sizeInfo.percentUsed}%)`);
    }

    // Get archive stats
    const archiveStats = this.dataArchiver.getStats();
    if (archiveStats) {
      logger.info(`📦 Archives: ${archiveStats.archiveFiles} files (${(archiveStats.archiveSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Get write queue stats
    const queueStats = this.writeQueue.getStats();
    logger.info(`🔒 Write queue: ${queueStats.totalWrites} writes, ${queueStats.failedWrites} failed, ${queueStats.averageWaitTimeMs}ms avg wait`);

    return { quotaReport, sizeInfo, archiveStats, queueStats };
  }

  /**
   * Schedule automatic maintenance tasks
   */
  scheduleMaintenance() {
    logger.info('⏰ Scheduling maintenance tasks...');

    // Check quotas every 6 hours
    const quotaJob = cron.schedule('0 */6 * * *', async () => {
      logger.info('⏰ Running scheduled quota check...');
      await this.memoryQuota.autoEnforce();
    });
    this.cronJobs.push({ name: 'quota-check', job: quotaJob });

    // Archive old data daily at 3 AM
    const archiveJob = cron.schedule('0 3 * * *', async () => {
      logger.info('⏰ Running scheduled archiving...');
      await this.archiveOldData();
    });
    this.cronJobs.push({ name: 'daily-archive', job: archiveJob });

    // Clean old archives weekly (Sunday 4 AM)
    const cleanJob = cron.schedule('0 4 * * 0', async () => {
      logger.info('⏰ Running scheduled archive cleanup...');
      await this.dataArchiver.cleanOldArchives();
    });
    this.cronJobs.push({ name: 'weekly-cleanup', job: cleanJob });

    // Memory status report daily at 8 AM
    const statusJob = cron.schedule('0 8 * * *', async () => {
      logger.info('⏰ Daily memory status report:');
      await this.checkMemoryStatus();
    });
    this.cronJobs.push({ name: 'daily-status', job: statusJob });

    logger.info(`✅ Scheduled ${this.cronJobs.length} maintenance tasks`);
  }

  /**
   * Archive old data from all large files
   */
  async archiveOldData() {
    logger.info('📦 Archiving old data...');

    const filesToArchive = [
      'chat_learning.json',
      'memory_long_term.json',
      'peer_influence.json',
      'memory_metadata.json',
      'gossip_mill.json',
      'conversation_threads.json',
      'personality_infection.json'
    ];

    const results = await this.dataArchiver.archiveMultiple(filesToArchive);

    const successCount = results.filter(r => r.archived).length;
    logger.info(`📦 Archived ${successCount}/${filesToArchive.length} files`);

    return results;
  }

  /**
   * Manual quota enforcement (for testing/emergency)
   */
  async enforceQuotas() {
    logger.info('📊 Manually enforcing quotas...');
    return await this.memoryQuota.enforceQuotas();
  }

  /**
   * Get write queue instance
   */
  getWriteQueue() {
    return this.writeQueue;
  }

  /**
   * Get user identification instance
   */
  getUserIdentification() {
    return this.userIdentification;
  }

  /**
   * Flush all pending writes (before shutdown)
   */
  async flushWrites(timeout = 10000) {
    logger.info('🔒 Flushing pending writes...');
    const success = await this.writeQueue.flush(timeout);

    if (success) {
      logger.info('✅ All writes flushed successfully');
    } else {
      logger.warn('⚠️  Some writes may not have completed');
    }

    return success;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('🛡️  Shutting down StabilityManager...');

    // Stop all cron jobs
    for (const { name, job } of this.cronJobs) {
      job.stop();
      logger.info(`⏰ Stopped ${name}`);
    }

    // Flush pending writes
    await this.flushWrites();

    this.initialized = false;
    logger.info('✅ StabilityManager shutdown complete');
  }

  /**
   * Get overall health status
   */
  async getHealthStatus() {
    const status = await this.checkMemoryStatus();

    const health = {
      healthy: true,
      issues: [],
      warnings: []
    };

    // Check for critical issues
    if (status.quotaReport.overQuota.length > 0) {
      health.healthy = false;
      health.issues.push(`${status.quotaReport.overQuota.length} files over quota`);
    }

    // Check for warnings
    if (status.quotaReport.nearQuota.length > 0) {
      health.warnings.push(`${status.quotaReport.nearQuota.length} files near quota`);
    }

    if (status.queueStats.failedWrites > 0) {
      health.warnings.push(`${status.queueStats.failedWrites} failed writes`);
    }

    if (status.queueStats.currentlyQueued > 10) {
      health.warnings.push(`${status.queueStats.currentlyQueued} writes queued (high load)`);
    }

    return health;
  }
}

module.exports = StabilityManager;
