'use strict';

// TopicGuard: Prevents fixation on sensitive or saturated topics.
// - Suppresses unsolicited mentions of configured topics
// - Allows when the user brings it up, but keeps it brief and pivots
// - Enforces cooldowns and sliding-window saturation caps

class TopicGuard {
  constructor(options = {}) {
    this.sensitive = new Set((options.sensitiveTopics || [
      // Core
      'gaza','israel','palestine','hamas','idf','west bank','jerusalem','intifada','settler','ceasefire',
      // Region variants / related
      'slovenia','slovenija','balkan','yugoslavia','serbia','croatia','bosnia','kosovo','ljubljana'
    ]).map(t => t.toLowerCase()));
    this.windowSize = options.windowSize || 30; // last N messages to assess saturation
    this.maxSelfMentions = options.maxSelfMentions || 2; // max times Slunt can raise a sensitive topic in window
    this.cooldownMs = options.cooldownMs || (15 * 60 * 1000); // 15 min cooldown per topic for unsolicited mentions
    this.maxRatio = options.maxRatio || 0.15; // sensitive mentions / window messages cap
    this.history = []; // {from:'user'|'slunt', text, platform, ts, topics:[]}
    this.lastSelfTopicAt = new Map(); // topic -> timestamp
  }

  // Keyword extractor focused on sensitive topics (word-boundary + variants)
  extractTopics(text) {
    try {
      const lower = String(text || '').toLowerCase();
      const found = [];
      for (const t of this.sensitive) {
        const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i');
        if (re.test(lower)) found.push(t);
      }
      return Array.from(new Set(found));
    } catch { return []; }
  }

  recordIncoming(text, platform = 'generic') {
    const topics = this.extractTopics(text);
    this._push({ from: 'user', text, platform, ts: Date.now(), topics });
  }

  recordOutgoing(text, platform = 'generic') {
    const topics = this.extractTopics(text);
    topics.forEach(t => this.lastSelfTopicAt.set(t, Date.now()));
    this._push({ from: 'slunt', text, platform, ts: Date.now(), topics });
  }

  _push(entry) {
    this.history.push(entry);
    if (this.history.length > this.windowSize) this.history.shift();
  }

  // Core decision: should we pivot away from sensitive topics in reply?
  // userText: last user message (string)
  // reply: Slunt's reply (string)
  // Returns { text, pivoted, reason }
  filterOutgoing(userText, reply, platform = 'generic') {
    try {
      const replyTopics = this.extractTopics(reply);
      if (replyTopics.length === 0) return { text: reply, pivoted: false };

      const userTopics = this.extractTopics(userText || '');
      const now = Date.now();
      const window = this.history.slice(-this.windowSize);
      const total = window.length || 1;
      const sensitiveCount = window.reduce((acc, m) => acc + (m.topics && m.topics.length ? 1 : 0), 0);
      const ratio = sensitiveCount / total;

      // Count Slunt's sensitive mentions in window
      const selfMentions = window.filter(m => m.from === 'slunt' && m.topics && m.topics.length).length;

      // Unsolicited mention if user didn't bring it up in their last message
      const unsolicited = replyTopics.some(t => !userTopics.includes(t));

      // Check cooldown per topic for unsolicited mentions
      const violatesCooldown = unsolicited && replyTopics.some(t => {
        const lastAt = this.lastSelfTopicAt.get(t) || 0;
        return (now - lastAt) < this.cooldownMs;
      });

      // Check saturation caps
      const violatesSaturation = ratio > this.maxRatio || selfMentions >= this.maxSelfMentions;

      // HARD RULES:
      // 1) If unsolicited: always remove and pivot (regardless of ratio), with cooldown enforcement
      if (unsolicited) {
        const cleaned = this._removeSensitive(replyTopics, reply);
        const text = (cleaned && cleaned.trim().length >= 3) ? cleaned : 'not that—changing the subject.';
        return { text: this._softPivot(text), pivoted: true, reason: violatesCooldown ? 'unsolicited_cooldown' : 'unsolicited' };
      }

      // 2) If user did mention it: keep it to one sentence then pivot
      if (userTopics.length > 0) {
        const shortened = this._limitToOneSentence(reply);
        return { text: this._softPivot(shortened), pivoted: true, reason: 'brief_then_pivot' };
      }

      // 3) If saturation/cooldown is violated even when user mentioned earlier, still pivot
      if (violatesCooldown || violatesSaturation) {
        const cleaned = this._removeSensitive(replyTopics, reply);
        const shortened = this._limitToOneSentence(cleaned);
        return { text: this._softPivot(shortened), pivoted: true, reason: violatesCooldown ? 'cooldown' : 'saturation' };
      }

      // Otherwise allow, but record
      this.recordOutgoing(reply, platform);
      return { text: reply, pivoted: false };
    } catch {
      return { text: reply, pivoted: false };
    }
  }

  _removeSensitive(foundTopics, text) {
    let out = String(text || '');
    for (const t of foundTopics) {
      const re = new RegExp(`(^|\b)${this._escape(t)}(\b|[^a-zA-Z])`, 'gi');
      out = out.replace(re, '');
    }
    // Clean extra spaces/punctuation
    out = out.replace(/\s{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();
    return out;
  }

  _limitToOneSentence(text) {
    const m = String(text||'').match(/[^.!?]+[.!?]+/);
    return m ? m[0].trim() : String(text||'').split(/[.!?]/)[0].trim() + '.';
  }

  _softPivot(text) {
    const pivots = [
      'let’s not spiral on that—what else is up?',
      'we can circle back later—what do you actually want to do right now?',
      'cool—switching gears for a sec: what are you watching/playing today?',
      'noted. tell me something fun instead.'
    ];
    const add = pivots[Math.floor(Math.random()*pivots.length)];
    const base = String(text||'').replace(/[\s.!?]+$/, '');
    return `${base}. ${add}`.trim();
  }

  _escape(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = TopicGuard;
