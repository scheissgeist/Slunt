class JobQueue {
  constructor(concurrency = 1, worker) {
    this.concurrency = concurrency;
    this.worker = worker;
    this.queue = [];
    this.active = 0;
  }
  enqueue(job) {
    this.queue.push(job);
    this.runNext();
  }
  size() { return this.queue.length; }
  running() { return this.active; }
  async runNext() {
    if (this.active >= this.concurrency) return;
    const job = this.queue.shift();
    if (!job) return;
    this.active++;
    try {
      await this.worker(job);
    } catch (_) {
      // worker handles errors
    } finally {
      this.active--;
      setTimeout(() => this.runNext(), 0);
    }
  }
}
module.exports = { JobQueue };