/**
 * JitterScheduler
 * Provides drift-resistant scheduling with optional jitter.
 * Use when replacing many setInterval loops to avoid thundering herd and time drift.
 *
 * Contract:
 *  - new JitterScheduler(fn, { intervalMs, jitterRatio, runOnStart })
 *  - jitterRatio: 0.0–0.5 (fraction of base interval added/subtracted)
 *  - start(): begins loop
 *  - stop(): cancels loop
 *  - nextDelay(): computes next randomized delay
 */
class JitterScheduler {
  constructor(fn, opts = {}) {
    if (typeof fn !== 'function') throw new Error('JitterScheduler requires a function');
    this.fn = fn;
    this.intervalMs = Math.max(100, opts.intervalMs || 1000);
    this.jitterRatio = Math.min(0.5, Math.max(0, opts.jitterRatio || 0));
    this.runOnStart = !!opts.runOnStart;
    this.timer = null;
    this.running = false;
    this._lastPlanned = null;
  }

  nextDelay() {
    if (this.jitterRatio === 0) return this.intervalMs;
    const jitterSpan = this.intervalMs * this.jitterRatio;
    const delta = (Math.random() * jitterSpan * 2) - jitterSpan; // [-span, +span]
    return Math.max(50, Math.round(this.intervalMs + delta));
  }

  async _execute() {
    if (!this.running) return;
    try {
      await this.fn();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[JitterScheduler] Task error:', e.message);
    }
    if (!this.running) return;
    const delay = this.nextDelay();
    this._lastPlanned = Date.now() + delay;
    this.timer = setTimeout(() => this._execute(), delay);
  }

  start() {
    if (this.running) return;
    this.running = true;
    if (this.runOnStart) {
      this._execute();
    } else {
      const delay = this.nextDelay();
      this._lastPlanned = Date.now() + delay;
      this.timer = setTimeout(() => this._execute(), delay);
    }
  }

  stop() {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  getStatus() {
    return {
      running: this.running,
      intervalMs: this.intervalMs,
      jitterRatio: this.jitterRatio,
      nextRunEtaMs: this._lastPlanned ? (this._lastPlanned - Date.now()) : null
    };
  }
}
module.exports = JitterScheduler;
