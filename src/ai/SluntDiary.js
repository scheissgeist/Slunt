// SluntDiary.js
// Public/private log of thoughts, grudges, favorite moments with persistence
const fs = require('fs').promises;
const path = require('path');

class SluntDiary {
  constructor() {
    this.entries = [];
    this.maxEntries = 200; // Increased for better history
    this.savePath = './data/diary.json';
    this.saveTimeout = null; // Debounce timer
    this.loadDiary(); // Auto-load on startup
  }

  /**
   * Load diary from disk
   */
  async loadDiary() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const parsed = JSON.parse(data);
      this.entries = parsed.entries || [];
      console.log(`📔 [Diary] Loaded ${this.entries.length} entries from disk`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('📔 [Diary] Error loading:', error.message);
      }
    }
  }

  /**
   * Save diary to disk (debounced)
   */
  async saveDiary() {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Debounce: wait 2 seconds before saving
    this.saveTimeout = setTimeout(async () => {
      try {
        const dir = path.dirname(this.savePath);
        await fs.mkdir(dir, { recursive: true });

        const data = {
          entries: this.entries,
          savedAt: Date.now()
        };

        await fs.writeFile(this.savePath, JSON.stringify(data, null, 2));
        console.log(`📔 [Diary] Saved ${this.entries.length} entries to disk`);
      } catch (error) {
        console.error('📔 [Diary] Error saving:', error.message);
      }
    }, 2000);
  }

  addEntry(text, type = 'thought', isPublic = true) {
    const entry = {
      text,
      type,
      isPublic,
      time: Date.now()
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) this.entries.shift();

    // Auto-save after adding entry
    this.saveDiary();

    console.log(`📔 [Diary] New ${type} entry: ${text ? text.substring(0, 50) + '...' : '(no text)'}`);
    return entry;
  }

  getRecentEntries(limit = 10, publicOnly = true) {
    return this.entries.filter(e => publicOnly ? e.isPublic : true).slice(-limit);
  }

  /**
   * Get entries by type
   */
  getEntriesByType(type, limit = 10) {
    return this.entries.filter(e => e.type === type).slice(-limit);
  }

  /**
   * Search diary entries
   */
  searchEntries(query, limit = 10) {
    const lowerQuery = query.toLowerCase();
    return this.entries
      .filter(e => e.text.toLowerCase().includes(lowerQuery))
      .slice(-limit);
  }

  /**
   * Get stats
   */
  getStats() {
    const typeCounts = {};
    this.entries.forEach(e => {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    });

    return {
      totalEntries: this.entries.length,
      publicEntries: this.entries.filter(e => e.isPublic).length,
      privateEntries: this.entries.filter(e => !e.isPublic).length,
      typeCounts,
      oldestEntry: this.entries.length > 0 ? new Date(this.entries[0].time).toLocaleString() : 'Never',
      newestEntry: this.entries.length > 0 ? new Date(this.entries[this.entries.length - 1].time).toLocaleString() : 'Never'
    };
  }
}

module.exports = SluntDiary;
