// Clean up old temporary audio files to prevent disk bloat
const fs = require('fs').promises;
const path = require('path');

class TempJanitor {
  constructor(options = {}) {
    this.tempDir = options.tempDir || path.join(process.cwd(), 'temp', 'audio');
    this.maxAge = options.maxAge || 60 * 60 * 1000; // 1 hour default
    this.interval = options.interval || 10 * 60 * 1000; // 10 minutes default
    this.timer = null;
  }

  /**
   * Start periodic cleanup
   */
  start() {
    this.stop(); // Clear any existing timer
    this.cleanup(); // Run immediately
    this.timer = setInterval(() => this.cleanup(), this.interval);
    console.log(`🧹 [TempJanitor] Started (clean every ${Math.round(this.interval / 60000)}min, delete files older than ${Math.round(this.maxAge / 60000)}min)`);
  }

  /**
   * Stop periodic cleanup
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Clean up old files in temp directory
   */
  async cleanup() {
    try {
      const now = Date.now();
      const files = await fs.readdir(this.tempDir);
      let deleted = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        try {
          const stats = await fs.stat(filePath);
          const age = now - stats.mtimeMs;

          if (age > this.maxAge) {
            await fs.unlink(filePath);
            deleted++;
          }
        } catch (err) {
          // File may have been deleted already; ignore
        }
      }

      if (deleted > 0) {
        console.log(`🧹 [TempJanitor] Cleaned up ${deleted} old temp file(s)`);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`🧹 [TempJanitor] Cleanup error: ${err.message}`);
      }
    }
  }
}

module.exports = TempJanitor;
