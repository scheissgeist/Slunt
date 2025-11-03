const fs = require('fs');
const path = require('path');

/**
 * DataValidator - Validates and recovers corrupted JSON data files
 * Prevents data loss by validating JSON structure and auto-recovering from backups
 */
class DataValidator {
  constructor(dataDir = './data', backupDir = './backups') {
    this.dataDir = dataDir;
    this.backupDir = backupDir;

    // Schema definitions for critical data files
    this.schemas = {
      'memory_long_term.json': { type: 'array', required: true },
      'memory_mid_term.json': { type: 'array', required: true },
      'memory_short_term.json': { type: 'array', required: true },
      'chat_learning.json': { type: 'object', required: true },
      'conversation_threads.json': { type: 'object', required: true },
      'relationships.json': { type: 'object', required: true },
      'cognitive_state.json': { type: 'object', required: true },
      'user_reputations.json': { type: 'object', required: true }
    };
  }

  /**
   * Safely load a JSON file with validation and auto-recovery
   * @param {string} filename - Name of the JSON file
   * @param {*} defaultValue - Default value if file doesn't exist or is invalid
   * @returns {Object} Parsed JSON data or default value
   */
  safeLoad(filename, defaultValue = null) {
    const filepath = path.join(this.dataDir, filename);

    try {
      // Check if file exists
      if (!fs.existsSync(filepath)) {
        console.log(`📄 Creating new data file: ${filename}`);
        return defaultValue;
      }

      // Read file content
      const content = fs.readFileSync(filepath, 'utf8');

      // Check for empty file
      if (!content || content.trim() === '') {
        console.warn(`⚠️  Empty file detected: ${filename}`);
        return this.attemptRecovery(filename, defaultValue);
      }

      // Parse JSON
      const data = JSON.parse(content);

      // Validate schema
      if (!this.validateSchema(filename, data)) {
        console.warn(`⚠️  Schema validation failed: ${filename}`);
        return this.attemptRecovery(filename, defaultValue);
      }

      console.log(`✅ Successfully loaded: ${filename}`);
      return data;

    } catch (error) {
      console.error(`❌ Error loading ${filename}:`, error.message);

      // Move corrupted file
      this.quarantineCorruptedFile(filepath);

      // Attempt recovery from backup
      return this.attemptRecovery(filename, defaultValue);
    }
  }

  /**
   * Validate data against schema
   * @param {string} filename
   * @param {*} data
   * @returns {boolean}
   */
  validateSchema(filename, data) {
    const schema = this.schemas[filename];
    if (!schema) return true; // No schema defined, skip validation

    // Type validation
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    if (actualType !== schema.type) {
      console.warn(`Schema mismatch: Expected ${schema.type}, got ${actualType}`);
      return false;
    }

    return true;
  }

  /**
   * Quarantine corrupted file by renaming with timestamp
   * @param {string} filepath
   */
  quarantineCorruptedFile(filepath) {
    try {
      const timestamp = Date.now();
      const corruptedPath = `${filepath}.corrupted.${timestamp}`;

      if (fs.existsSync(filepath)) {
        fs.renameSync(filepath, corruptedPath);
        console.log(`🔒 Quarantined corrupted file: ${path.basename(corruptedPath)}`);
      }
    } catch (error) {
      console.error('Failed to quarantine corrupted file:', error);
    }
  }

  /**
   * Attempt to recover data from the most recent backup
   * @param {string} filename
   * @param {*} defaultValue
   * @returns {*}
   */
  attemptRecovery(filename, defaultValue) {
    console.log(`🔄 Attempting recovery for: ${filename}`);

    try {
      // Find most recent backup directory
      const backups = this.getBackupDirectories();

      if (backups.length === 0) {
        console.warn('⚠️  No backups found, using default value');
        return defaultValue;
      }

      // Try each backup from newest to oldest
      for (const backupDir of backups) {
        const backupPath = path.join(this.backupDir, backupDir, filename);

        if (fs.existsSync(backupPath)) {
          try {
            const content = fs.readFileSync(backupPath, 'utf8');
            const data = JSON.parse(content);

            // Validate recovered data
            if (this.validateSchema(filename, data)) {
              console.log(`✅ Successfully recovered from backup: ${backupDir}`);

              // Save recovered data to current location
              const filepath = path.join(this.dataDir, filename);
              fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

              return data;
            }
          } catch (error) {
            console.warn(`⚠️  Backup ${backupDir} also corrupted, trying next...`);
            continue;
          }
        }
      }

      console.warn('⚠️  All backups failed, using default value');
      return defaultValue;

    } catch (error) {
      console.error('Recovery failed:', error);
      return defaultValue;
    }
  }

  /**
   * Get list of backup directories sorted by date (newest first)
   * @returns {Array<string>}
   */
  getBackupDirectories() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const dirs = fs.readdirSync(this.backupDir)
        .filter(dir => dir.startsWith('backup_'))
        .sort()
        .reverse(); // Newest first

      return dirs;

    } catch (error) {
      console.error('Failed to read backup directories:', error);
      return [];
    }
  }

  /**
   * Safely save data with atomic write (write to temp, then rename)
   * @param {string} filename
   * @param {*} data
   * @returns {boolean} Success status
   */
  safeSave(filename, data) {
    const filepath = path.join(this.dataDir, filename);
    const tempPath = `${filepath}.tmp`;

    try {
      // Validate schema before saving
      if (!this.validateSchema(filename, data)) {
        throw new Error(`Schema validation failed for ${filename}`);
      }

      // Ensure data directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Write to temporary file first
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');

      // Verify temp file is valid JSON
      const verification = JSON.parse(fs.readFileSync(tempPath, 'utf8'));

      // Atomic rename (prevents corruption mid-write)
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      fs.renameSync(tempPath, filepath);

      return true;

    } catch (error) {
      console.error(`❌ Failed to save ${filename}:`, error.message);

      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      return false;
    }
  }

  /**
   * Validate all data files in the data directory
   * @returns {Object} Validation report
   */
  validateAllFiles() {
    const report = {
      valid: [],
      invalid: [],
      missing: [],
      total: 0
    };

    try {
      const files = fs.readdirSync(this.dataDir)
        .filter(file => file.endsWith('.json') && !file.includes('.corrupted.'));

      report.total = files.length;

      for (const file of files) {
        const filepath = path.join(this.dataDir, file);

        try {
          const content = fs.readFileSync(filepath, 'utf8');
          const data = JSON.parse(content);

          if (this.validateSchema(file, data)) {
            report.valid.push(file);
          } else {
            report.invalid.push(file);
          }

        } catch (error) {
          report.invalid.push(file);
        }
      }

      // Check for missing critical files
      for (const filename of Object.keys(this.schemas)) {
        const filepath = path.join(this.dataDir, filename);
        if (!fs.existsSync(filepath)) {
          report.missing.push(filename);
        }
      }

      return report;

    } catch (error) {
      console.error('Validation failed:', error);
      return report;
    }
  }

  /**
   * Clean up old corrupted files (keeps only last 5)
   */
  cleanupCorruptedFiles() {
    try {
      const files = fs.readdirSync(this.dataDir)
        .filter(file => file.includes('.corrupted.'))
        .sort()
        .reverse(); // Newest first

      // Keep only last 5 corrupted files
      for (let i = 5; i < files.length; i++) {
        const filepath = path.join(this.dataDir, files[i]);
        fs.unlinkSync(filepath);
        console.log(`🗑️  Deleted old corrupted file: ${files[i]}`);
      }

    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

module.exports = DataValidator;
