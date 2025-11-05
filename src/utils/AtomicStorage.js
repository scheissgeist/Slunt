// Atomic JSON writes with temp-file swap to prevent corruption
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class AtomicStorage {
  /**
   * Write JSON to disk atomically (write to temp, then rename)
   * @param {string} filePath - Target file path
   * @param {object} data - Data to serialize
   * @param {object} options - { indent: number }
   */
  static async writeJSON(filePath, data, options = {}) {
    const indent = options.indent !== undefined ? options.indent : 2;
    const dir = path.dirname(filePath);
    const tempPath = path.join(os.tmpdir(), `atomic-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);

    try {
      // Ensure parent directory exists
      await fs.mkdir(dir, { recursive: true });

      // Write to temp file
      const content = JSON.stringify(data, null, indent);
      await fs.writeFile(tempPath, content, 'utf8');

      // Atomic rename (platform-safe)
      await fs.rename(tempPath, filePath);
    } catch (err) {
      // Clean up temp file on failure
      try {
        await fs.unlink(tempPath);
      } catch {}
      throw err;
    }
  }

  /**
   * Read JSON from disk with error handling
   * @param {string} filePath - File to read
   * @param {object} defaultValue - Return this if file doesn't exist
   */
  static async readJSON(filePath, defaultValue = null) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return defaultValue;
      }
      throw err;
    }
  }
}

module.exports = AtomicStorage;
