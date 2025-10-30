/**
 * Database Safety Manager
 * Ensures atomic writes and data integrity
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../bot/logger');

class DatabaseSafety {
  constructor() {
    this.locks = new Map();
    this.backupOnWrite = true;
    this.validateSchema = true;
  }

  /**
   * Atomic write with temp file + rename
   */
  async atomicWrite(filePath, data) {
    const tempPath = `${filePath}.tmp`;
    const backupPath = `${filePath}.backup`;

    try {
      // 1. Acquire lock
      await this.acquireLock(filePath);

      // 2. Backup existing file
      try {
        await fs.access(filePath);
        await fs.copyFile(filePath, backupPath);
      } catch (error) {
        // File doesn't exist yet, that's okay
      }

      // 3. Write to temp file
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(tempPath, jsonData, 'utf8');

      // 4. Validate temp file
      const written = await fs.readFile(tempPath, 'utf8');
      JSON.parse(written); // Throws if invalid

      // 5. Atomic rename (this is the atomic operation)
      await fs.rename(tempPath, filePath);

      // 6. Success - remove backup
      try {
        await fs.unlink(backupPath);
      } catch (error) {
        // Backup removal failed, but write succeeded
      }

      return true;
    } catch (error) {
      logger.error(`❌ [DB Safety] Atomic write failed for ${filePath}: ${error.message}`);

      // Cleanup temp file
      try {
        await fs.unlink(tempPath);
      } catch (err) {}

      // Attempt to restore from backup
      try {
        await fs.access(backupPath);
        await fs.copyFile(backupPath, filePath);
        logger.info(`✅ [DB Safety] Restored ${filePath} from backup`);
      } catch (err) {}

      throw error;
    } finally {
      // 7. Release lock
      this.releaseLock(filePath);
    }
  }

  /**
   * Safe read with automatic repair
   */
  async safeRead(filePath, defaultValue = null) {
    try {
      // Try to acquire lock for reading
      await this.acquireLock(filePath, 5000); // 5 second timeout for reads

      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      this.releaseLock(filePath);
      return data;
    } catch (error) {
      this.releaseLock(filePath);

      if (error.code === 'ENOENT') {
        // File doesn't exist
        logger.warn(`⚠️ [DB Safety] File not found: ${filePath}`);
        return defaultValue;
      }

      // Try to repair corrupted JSON
      logger.error(`❌ [DB Safety] Read failed for ${filePath}: ${error.message}`);
      const repaired = await this.attemptRepair(filePath);
      
      if (repaired) {
        return repaired;
      }

      return defaultValue;
    }
  }

  /**
   * Attempt to repair corrupted JSON
   */
  async attemptRepair(filePath) {
    const backupPath = `${filePath}.backup`;

    try {
      // Try backup first
      logger.info(`🔧 [DB Safety] Attempting repair from backup: ${filePath}`);
      const backupContent = await fs.readFile(backupPath, 'utf8');
      const data = JSON.parse(backupContent);
      
      // Backup is valid, restore it
      await fs.copyFile(backupPath, filePath);
      logger.info(`✅ [DB Safety] Repaired ${filePath} from backup`);
      return data;
    } catch (backupError) {
      // Backup failed, try to fix JSON
      try {
        logger.info(`🔧 [DB Safety] Attempting to fix JSON: ${filePath}`);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Try common fixes
        let fixed = content;
        
        // Remove trailing commas
        fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
        
        // Fix unclosed brackets
        const openBrackets = (fixed.match(/\{/g) || []).length;
        const closeBrackets = (fixed.match(/\}/g) || []).length;
        if (openBrackets > closeBrackets) {
          fixed += '}'.repeat(openBrackets - closeBrackets);
        }

        const openArrays = (fixed.match(/\[/g) || []).length;
        const closeArrays = (fixed.match(/\]/g) || []).length;
        if (openArrays > closeArrays) {
          fixed += ']'.repeat(openArrays - closeArrays);
        }

        // Try to parse
        const data = JSON.parse(fixed);
        
        // Success! Save the fixed version
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        logger.info(`✅ [DB Safety] Automatically repaired JSON: ${filePath}`);
        return data;
      } catch (fixError) {
        logger.error(`❌ [DB Safety] Could not repair ${filePath}`);
        return null;
      }
    }
  }

  /**
   * Acquire file lock
   */
  async acquireLock(filePath, timeout = 30000) {
    const startTime = Date.now();
    
    while (this.locks.has(filePath)) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Lock timeout for ${filePath}`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.locks.set(filePath, Date.now());
  }

  /**
   * Release file lock
   */
  releaseLock(filePath) {
    this.locks.delete(filePath);
  }

  /**
   * Validate JSON schema (basic)
   */
  validateJSONSchema(data, expectedKeys = []) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data: not an object');
    }

    for (const key of expectedKeys) {
      if (!(key in data)) {
        throw new Error(`Missing required key: ${key}`);
      }
    }

    return true;
  }

  /**
   * Batch atomic writes (for related files)
   */
  async batchWrite(writes) {
    const results = [];
    const rollbacks = [];

    try {
      for (const { filePath, data } of writes) {
        // Backup before write
        try {
          const existing = await this.safeRead(filePath);
          rollbacks.push({ filePath, data: existing });
        } catch (error) {
          // No existing data to backup
        }

        // Perform write
        await this.atomicWrite(filePath, data);
        results.push({ filePath, success: true });
      }

      return { success: true, results };
    } catch (error) {
      // Rollback all successful writes
      logger.error(`❌ [DB Safety] Batch write failed, rolling back...`);
      
      for (const { filePath, data } of rollbacks) {
        try {
          await this.atomicWrite(filePath, data);
          logger.info(`↩️ [DB Safety] Rolled back: ${filePath}`);
        } catch (rollbackError) {
          logger.error(`❌ [DB Safety] Rollback failed for ${filePath}: ${rollbackError.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Check file integrity
   */
  async checkIntegrity(filePath) {
    try {
      const data = await this.safeRead(filePath);
      return {
        valid: true,
        size: JSON.stringify(data).length,
        lastModified: (await fs.stat(filePath)).mtime
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = new DatabaseSafety();
