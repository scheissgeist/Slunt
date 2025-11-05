const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const logger = require('../bot/logger');

/**
 * DataArchiver - Compresses old data to reduce file sizes
 * Prevents memory files from growing unbounded
 */
class DataArchiver {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.archiveDir = path.join(__dirname, '../../data/archives');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB max per file
    this.retentionDays = {
      raw: 30,        // Keep raw data for 30 days
      compressed: 90, // Keep compressed for 90 days
      archived: 365   // Keep archives for 1 year
    };

    // Ensure archive directory exists
    if (!fs.existsSync(this.archiveDir)) {
      fs.mkdirSync(this.archiveDir, { recursive: true });
    }

    logger.info('📦 DataArchiver initialized');
  }

  /**
   * Archive old data from a JSON file
   * @param {string} filename - Name of file to archive
   * @param {Object} options - Archive options
   */
  async archiveFile(filename, options = {}) {
    try {
      const filePath = path.join(this.dataDir, filename);

      if (!fs.existsSync(filePath)) {
        return { archived: false, reason: 'File does not exist' };
      }

      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Check if file needs archiving
      if (fileSize < this.maxFileSize && !options.force) {
        return { archived: false, reason: 'File under size limit', size: fileSize };
      }

      logger.info(`📦 Archiving ${filename} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);

      // Read and parse file
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Separate old vs recent data based on timestamps
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays.raw);

      const { oldData, recentData } = this.separateDataByAge(data, cutoffDate);

      if (oldData.length > 0 || Object.keys(oldData).length > 0) {
        // Compress and save old data
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveName = `${filename.replace('.json', '')}_${timestamp}.json.gz`;
        const archivePath = path.join(this.archiveDir, archiveName);

        const compressed = zlib.gzipSync(JSON.stringify(oldData, null, 2));
        fs.writeFileSync(archivePath, compressed);

        const compressedSize = fs.statSync(archivePath).size;
        const ratio = ((1 - compressedSize / fileSize) * 100).toFixed(1);

        logger.info(`📦 Archived ${oldData.length || Object.keys(oldData).length} old entries`);
        logger.info(`📦 Compression: ${(fileSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${ratio}% saved)`);

        // Write recent data back to original file
        fs.writeFileSync(filePath, JSON.stringify(recentData, null, 2));

        const newSize = fs.statSync(filePath).size;
        logger.info(`📦 New file size: ${(newSize / 1024 / 1024).toFixed(2)}MB`);

        return {
          archived: true,
          oldEntries: oldData.length || Object.keys(oldData).length,
          originalSize: fileSize,
          newSize: newSize,
          archivePath: archivePath,
          compressionRatio: ratio
        };
      } else {
        return { archived: false, reason: 'No old data to archive' };
      }

    } catch (error) {
      logger.error(`❌ Error archiving ${filename}:`, error);
      return { archived: false, error: error.message };
    }
  }

  /**
   * Separate data by age based on timestamps
   * @param {Object|Array} data - Data to separate
   * @param {Date} cutoffDate - Date cutoff
   * @returns {Object} { oldData, recentData }
   */
  separateDataByAge(data, cutoffDate) {
    // Handle arrays (like chat_learning.json)
    if (Array.isArray(data)) {
      const oldData = [];
      const recentData = [];

      for (const item of data) {
        const itemDate = this.extractDate(item);
        if (itemDate && itemDate < cutoffDate) {
          oldData.push(item);
        } else {
          recentData.push(item);
        }
      }

      return { oldData, recentData };
    }

    // Handle objects with timestamp keys
    if (typeof data === 'object') {
      const oldData = {};
      const recentData = {};

      for (const [key, value] of Object.entries(data)) {
        const itemDate = this.extractDate(value);
        if (itemDate && itemDate < cutoffDate) {
          oldData[key] = value;
        } else {
          recentData[key] = value;
        }
      }

      return { oldData, recentData };
    }

    return { oldData: {}, recentData: data };
  }

  /**
   * Extract date from data item
   * @param {Object} item - Data item
   * @returns {Date|null} - Extracted date
   */
  extractDate(item) {
    if (!item) return null;

    // Try common timestamp fields
    const timestampFields = ['timestamp', 'date', 'createdAt', 'updatedAt', 'time', 'lastSeen'];

    for (const field of timestampFields) {
      if (item[field]) {
        const date = new Date(item[field]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  }

  /**
   * Archive multiple files at once
   * @param {Array<string>} filenames - Array of filenames
   */
  async archiveMultiple(filenames) {
    const results = [];

    for (const filename of filenames) {
      const result = await this.archiveFile(filename);
      results.push({ filename, ...result });
    }

    const totalSaved = results.reduce((sum, r) => sum + (r.originalSize - r.newSize || 0), 0);
    logger.info(`📦 Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`);

    return results;
  }

  /**
   * Clean up old archives
   */
  cleanOldArchives() {
    try {
      const files = fs.readdirSync(this.archiveDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays.archived);

      let deletedCount = 0;
      let deletedSize = 0;

      for (const file of files) {
        const filePath = path.join(this.archiveDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          deletedSize += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info(`🗑️  Deleted ${deletedCount} old archives (${(deletedSize / 1024 / 1024).toFixed(2)}MB)`);
      }

      return { deletedCount, deletedSize };
    } catch (error) {
      logger.error('❌ Error cleaning old archives:', error);
      return { deletedCount: 0, deletedSize: 0 };
    }
  }

  /**
   * Get archive statistics
   */
  getStats() {
    try {
      const dataFiles = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
      const archiveFiles = fs.readdirSync(this.archiveDir);

      const dataSize = dataFiles.reduce((sum, file) => {
        const stats = fs.statSync(path.join(this.dataDir, file));
        return sum + stats.size;
      }, 0);

      const archiveSize = archiveFiles.reduce((sum, file) => {
        const stats = fs.statSync(path.join(this.archiveDir, file));
        return sum + stats.size;
      }, 0);

      return {
        dataFiles: dataFiles.length,
        dataSize: dataSize,
        archiveFiles: archiveFiles.length,
        archiveSize: archiveSize,
        totalSize: dataSize + archiveSize
      };
    } catch (error) {
      logger.error('❌ Error getting archive stats:', error);
      return null;
    }
  }

  /**
   * Restore data from archive
   * @param {string} archiveName - Name of archive file
   */
  async restoreArchive(archiveName) {
    try {
      const archivePath = path.join(this.archiveDir, archiveName);

      if (!fs.existsSync(archivePath)) {
        throw new Error('Archive not found');
      }

      const compressed = fs.readFileSync(archivePath);
      const decompressed = zlib.gunzipSync(compressed);
      const data = JSON.parse(decompressed.toString());

      logger.info(`📦 Restored ${archiveName}`);

      return data;
    } catch (error) {
      logger.error(`❌ Error restoring archive ${archiveName}:`, error);
      throw error;
    }
  }
}

module.exports = DataArchiver;
