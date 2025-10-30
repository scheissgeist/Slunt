const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

/**
 * BackupManager - Automated backup system for all Slunt data
 * 
 * Features:
 * - Automatic daily backups
 * - On-demand backup creation
 * - Backup restoration
 * - Old backup cleanup
 * - Backup verification
 */
class BackupManager {
  constructor(config = {}) {
    this.config = {
      dataDir: config.dataDir || path.join(__dirname, '../../data'),
      backupDir: config.backupDir || path.join(__dirname, '../../backups'),
      maxBackups: config.maxBackups || 7, // Keep 7 days of backups
      autoBackupInterval: config.autoBackupInterval || 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };
    
    this.backupTimer = null;
    this.isBackingUp = false;
  }

  /**
   * Initialize backup system
   */
  async initialize() {
    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory();
      
      // Start automatic backup schedule
      if (this.config.autoBackupInterval > 0) {
        this.startAutoBackup();
      }
      
      console.log('💾 [Backup] Backup system initialized');
      console.log(`📁 [Backup] Data directory: ${this.config.dataDir}`);
      console.log(`📁 [Backup] Backup directory: ${this.config.backupDir}`);
      console.log(`🔄 [Backup] Auto-backup every ${this.config.autoBackupInterval / (60 * 60 * 1000)} hours`);
      
      return true;
    } catch (error) {
      console.error('❌ [Backup] Failed to initialize:', error.message);
      return false;
    }
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      await mkdir(this.config.backupDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Start automatic backup schedule
   */
  startAutoBackup() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    // Run initial backup after 1 minute
    setTimeout(() => {
      this.createBackup('auto-initial');
    }, 60000);
    
    // Schedule regular backups
    this.backupTimer = setInterval(() => {
      this.createBackup('auto-scheduled');
    }, this.config.autoBackupInterval);
    
    console.log('⏰ [Backup] Automatic backup schedule started');
  }

  /**
   * Stop automatic backups
   */
  stopAutoBackup() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      console.log('⏸️ [Backup] Automatic backup schedule stopped');
    }
  }

  /**
   * Create a backup of all data files
   */
  async createBackup(label = 'manual') {
    if (this.isBackingUp) {
      console.log('⚠️ [Backup] Backup already in progress, skipping');
      return null;
    }

    this.isBackingUp = true;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupName = `backup_${label}_${timestamp}`;
    const backupPath = path.join(this.config.backupDir, backupName);

    try {
      console.log(`💾 [Backup] Creating backup: ${backupName}`);
      
      // Create backup directory
      await mkdir(backupPath, { recursive: true });
      
      // Get all data files
      const files = await readdir(this.config.dataDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      let backedUpCount = 0;
      let totalSize = 0;
      
      // Copy each file
      for (const file of jsonFiles) {
        const sourcePath = path.join(this.config.dataDir, file);
        const destPath = path.join(backupPath, file);
        
        try {
          await copyFile(sourcePath, destPath);
          const stats = await stat(destPath);
          totalSize += stats.size;
          backedUpCount++;
        } catch (error) {
          console.error(`❌ [Backup] Failed to backup ${file}:`, error.message);
        }
      }
      
      // Create backup manifest
      const manifest = {
        timestamp: new Date().toISOString(),
        label,
        filesCount: backedUpCount,
        totalSize,
        files: jsonFiles
      };
      
      await fs.promises.writeFile(
        path.join(backupPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
      
      console.log(`✅ [Backup] Successfully backed up ${backedUpCount} files (${(totalSize / 1024).toFixed(2)} KB)`);
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      this.isBackingUp = false;
      return backupPath;
      
    } catch (error) {
      console.error('❌ [Backup] Failed to create backup:', error.message);
      this.isBackingUp = false;
      return null;
    }
  }

  /**
   * List all available backups
   */
  async listBackups() {
    try {
      const entries = await readdir(this.config.backupDir, { withFileTypes: true });
      const backups = [];
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('backup_')) {
          const backupPath = path.join(this.config.backupDir, entry.name);
          const manifestPath = path.join(backupPath, 'manifest.json');
          
          try {
            const manifestData = await fs.promises.readFile(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestData);
            
            backups.push({
              name: entry.name,
              path: backupPath,
              ...manifest
            });
          } catch (error) {
            // No manifest, get basic info
            const stats = await stat(backupPath);
            backups.push({
              name: entry.name,
              path: backupPath,
              timestamp: stats.mtime.toISOString(),
              label: 'unknown'
            });
          }
        }
      }
      
      // Sort by timestamp (newest first)
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return backups;
      
    } catch (error) {
      console.error('❌ [Backup] Failed to list backups:', error.message);
      return [];
    }
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(backupName) {
    const backupPath = path.join(this.config.backupDir, backupName);
    
    try {
      console.log(`📥 [Backup] Restoring from: ${backupName}`);
      
      // Verify backup exists
      await stat(backupPath);
      
      // Get files to restore
      const files = await readdir(backupPath);
      const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'manifest.json');
      
      let restoredCount = 0;
      
      // Copy each file back
      for (const file of jsonFiles) {
        const sourcePath = path.join(backupPath, file);
        const destPath = path.join(this.config.dataDir, file);
        
        try {
          await copyFile(sourcePath, destPath);
          restoredCount++;
        } catch (error) {
          console.error(`❌ [Backup] Failed to restore ${file}:`, error.message);
        }
      }
      
      console.log(`✅ [Backup] Successfully restored ${restoredCount} files`);
      return true;
      
    } catch (error) {
      console.error('❌ [Backup] Failed to restore backup:', error.message);
      return false;
    }
  }

  /**
   * Cleanup old backups (keep only maxBackups most recent)
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.listBackups();
      
      if (backups.length <= this.config.maxBackups) {
        return; // Nothing to cleanup
      }
      
      // Delete oldest backups
      const toDelete = backups.slice(this.config.maxBackups);
      
      for (const backup of toDelete) {
        try {
          await fs.promises.rm(backup.path, { recursive: true, force: true });
          console.log(`🗑️ [Backup] Deleted old backup: ${backup.name}`);
        } catch (error) {
          console.error(`❌ [Backup] Failed to delete ${backup.name}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('❌ [Backup] Failed to cleanup old backups:', error.message);
    }
  }

  /**
   * Get backup statistics
   */
  async getStats() {
    try {
      const backups = await this.listBackups();
      
      let totalSize = 0;
      for (const backup of backups) {
        if (backup.totalSize) {
          totalSize += backup.totalSize;
        }
      }
      
      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup: backups[backups.length - 1]?.timestamp,
        newestBackup: backups[0]?.timestamp,
        backups: backups.map(b => ({
          name: b.name,
          timestamp: b.timestamp,
          label: b.label,
          filesCount: b.filesCount,
          size: b.totalSize
        }))
      };
      
    } catch (error) {
      console.error('❌ [Backup] Failed to get stats:', error.message);
      return null;
    }
  }

  /**
   * Shutdown backup manager
   */
  shutdown() {
    this.stopAutoBackup();
    console.log('💾 [Backup] Backup manager shutdown complete');
  }
}

module.exports = BackupManager;
