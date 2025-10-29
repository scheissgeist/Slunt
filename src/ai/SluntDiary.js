// SluntDiary.js
// Public/private log of thoughts, grudges, favorite moments
class SluntDiary {
  constructor() {
    this.entries = [];
    this.maxEntries = 100;
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
    return entry;
  }

  getRecentEntries(limit = 10, publicOnly = true) {
    return this.entries.filter(e => publicOnly ? e.isPublic : true).slice(-limit);
  }
}

module.exports = SluntDiary;
