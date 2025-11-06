const fs = require('fs');
const path = require('path');

class RagMemory {
  constructor(chatBot, opts = {}) {
    this.bot = chatBot;
    this.file = opts.file || path.join(process.cwd(), 'data', 'memory', 'rag.json');
    this.maxFactsPerUser = opts.maxFactsPerUser || 200;
    this._data = { facts: [] };
    this._loaded = false;
    this._ensureDir();
    this.load();
  }

  _ensureDir() {
    const dir = path.dirname(this.file);
    fs.mkdirSync(dir, { recursive: true });
  }

  load() {
    try {
      if (fs.existsSync(this.file)) {
        const raw = fs.readFileSync(this.file, 'utf-8');
        this._data = JSON.parse(raw) || { facts: [] };
      }
      this._loaded = true;
    } catch (e) {
      this._data = { facts: [] };
      this._loaded = true;
    }
  }

  async save() {
    const payload = JSON.stringify(this._data, null, 2);
    try {
      if (this.bot && this.bot.databaseSafety && this.bot.databaseSafety.atomicWrite) {
        await this.bot.databaseSafety.atomicWrite(this.file, this._data);
      } else {
        fs.writeFileSync(this.file, payload, 'utf-8');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[RagMemory] Save failed:', e.message);
    }
  }

  // Very small embedding: normalized char bigram frequencies
  embed(text = '') {
    const s = String(text || '').toLowerCase();
    const map = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      if (!/^[a-z0-9][a-z0-9]$/.test(bg)) continue;
      map.set(bg, (map.get(bg) || 0) + 1);
    }
    const vec = Array.from(map.entries());
    const norm = Math.sqrt(vec.reduce((a, [, v]) => a + v * v, 0)) || 1;
    return vec.map(([k, v]) => [k, v / norm]);
  }

  cosine(a, b) {
    const m = new Map(a);
    let dot = 0;
    for (const [k, v] of b) {
      if (m.has(k)) dot += v * m.get(k);
    }
    return dot;
  }

  addFact({ user, topic, text }) {
    if (!user || !text) return false;
    const clean = String(text).replace(/https?:\/:\/\/\S+/g, '[link]');
    const vec = this.embed(`${user} ${topic || ''} ${clean}`);
    const fact = { user, topic: topic || null, text: clean, vec, ts: Date.now() };
    this._data.facts.push(fact);
    // Cap per user
    const factsByUser = this._data.facts.filter(f => f.user === user);
    if (factsByUser.length > this.maxFactsPerUser) {
      // remove oldest extras
      const excess = factsByUser.length - this.maxFactsPerUser;
      let removed = 0;
      this._data.facts = this._data.facts.filter(f => {
        if (removed < excess && f.user === user) { removed++; return false; }
        return true;
      });
    }
    return true;
  }

  search({ user, topic, query, k = 3 }) {
    const pool = this._data.facts.filter(f => (!user || f.user === user));
    const qvec = this.embed(`${user || ''} ${topic || ''} ${query || ''}`);
    const ranked = pool.map(f => [this.cosine(f.vec, qvec), f]).sort((a, b) => b[0] - a[0]);
    return ranked.slice(0, k).map(([score, f]) => ({ score, text: f.text, topic: f.topic, user: f.user }));
  }
}

module.exports = RagMemory;
