/**
 * Inside Joke Evolution System
 * Auto-detects emerging memes in chat
 * Creates callbacks to old jokes, tracks freshness
 */

class InsideJokeEvolution {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.jokes = new Map(); // phrase -> joke data
    this.memeDetection = new Map(); // phrase -> occurrence count
    this.callbacks = [];
    this.maxJokes = 50;
    this.freshnessDecay = 86400000; // 24 hours
  }

  /**
   * Detect potential meme/inside joke
   */
  detectMeme(username, message) {
    // Extract repeated phrases
    const phrases = this.extractNotablePhrase(message);

    phrases.forEach(phrase => {
      // Track occurrences
      if (!this.memeDetection.has(phrase)) {
        this.memeDetection.set(phrase, {
          count: 1,
          users: new Set([username]),
          firstSeen: Date.now(),
          lastSeen: Date.now()
        });
      } else {
        const data = this.memeDetection.get(phrase);
        data.count++;
        data.users.add(username);
        data.lastSeen = Date.now();

        // If multiple people use it, it's a meme
        if (data.count >= 3 && data.users.size >= 2 && !this.jokes.has(phrase)) {
          this.promoteToJoke(phrase, data);
        }
      }
    });
  }

  /**
   * Extract notable phrases from message
   */
  extractNotablePhrase(message) {
    const phrases = [];
    const lower = message.toLowerCase();

    // Look for unusual/funny phrases
    // Phrases with specific patterns
    if (lower.match(/(chicken nugget|scoon|void|existential|lmao|based|fr fr)/)) {
      phrases.push(lower.match(/(chicken nugget|scoon|void|existential|lmao|based|fr fr)/)[0]);
    }

    // Repeated words
    const words = lower.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i] === words[i+1]) {
        phrases.push(`${words[i]} ${words[i+1]}`);
      }
    }

    return phrases;
  }

  /**
   * Promote meme to inside joke
   */
  promoteToJoke(phrase, data) {
    const joke = {
      phrase,
      originators: Array.from(data.users),
      bornAt: data.firstSeen,
      uses: 0,
      freshness: 100, // 0-100, decays over time
      lastUsed: null,
      category: this.categorizeJoke(phrase)
    };

    this.jokes.set(phrase, joke);

    console.log(`😂 [InsideJoke] New inside joke detected: "${phrase}"`);
    console.log(`😂 [InsideJoke] Originated by: ${Array.from(data.users).join(', ')}`);

    // Keep reasonable number of jokes
    if (this.jokes.size > this.maxJokes) {
      this.retireStaleJoke();
    }
  }

  /**
   * Categorize joke
   */
  categorizeJoke(phrase) {
    if (phrase.includes('chicken') || phrase.includes('nugget')) return 'food';
    if (phrase.includes('void') || phrase.includes('existential')) return 'existential';
    if (phrase.includes('lmao') || phrase.includes('based')) return 'slang';
    return 'general';
  }

  /**
   * Should use inside joke?
   */
  shouldUseJoke() {
    if (this.jokes.size === 0) return false;

    // 15% chance to callback to inside joke
    return Math.random() < 0.15;
  }

  /**
   * Get inside joke to use
   */
  getJoke() {
    if (this.jokes.size === 0) return null;

    // Filter by freshness (only use jokes > 20 freshness)
    const fresh = Array.from(this.jokes.entries())
      .filter(([_, joke]) => joke.freshness > 20);

    if (fresh.length === 0) return null;

    // Weight by freshness
    const weights = fresh.map(([_, joke]) => joke.freshness);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < fresh.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        const [phrase, joke] = fresh[i];
        
        // Update joke stats
        joke.uses++;
        joke.lastUsed = Date.now();
        joke.freshness = Math.max(0, joke.freshness - 5); // Using it makes it less fresh

        // Track callback
        this.callbacks.push({
          phrase,
          timestamp: Date.now()
        });

        console.log(`😂 [InsideJoke] Using: "${phrase}" (${joke.uses} uses, ${joke.freshness.toFixed(0)}% fresh)`);

        return this.formatJokeCallback(phrase, joke);
      }
    }

    return null;
  }

  /**
   * Format joke callback
   */
  formatJokeCallback(phrase, joke) {
    const ageInDays = (Date.now() - joke.bornAt) / 86400000;

    const formats = [
      phrase, // Just use it naturally
      `remember when we started saying "${phrase}"? good times`,
      `${phrase} lmao`,
      `bringing back "${phrase}"`,
      `${phrase} (classic)`,
      `throwback to "${phrase}"`
    ];

    // Older jokes get nostalgia formatting
    if (ageInDays > 7) {
      return `throwback to "${phrase}" from like ${Math.floor(ageInDays)} days ago`;
    }

    return formats[Math.floor(Math.random() * formats.length)];
  }

  /**
   * Update freshness (decay over time)
   */
  updateFreshness() {
    const now = Date.now();

    this.jokes.forEach((joke, phrase) => {
      const age = now - joke.bornAt;
      const timeSinceUse = joke.lastUsed ? now - joke.lastUsed : age;

      // Decay based on age and non-use
      const ageDecay = (age / this.freshnessDecay) * 10; // 10% per day
      const useDecay = (timeSinceUse / this.freshnessDecay) * 5; // 5% per day since last use

      joke.freshness = Math.max(0, 100 - ageDecay - useDecay);
    });
  }

  /**
   * Retire stale joke
   */
  retireStaleJoke() {
    // Find stalest joke
    let stalest = null;
    let lowestFreshness = 100;

    this.jokes.forEach((joke, phrase) => {
      if (joke.freshness < lowestFreshness) {
        lowestFreshness = joke.freshness;
        stalest = phrase;
      }
    });

    if (stalest) {
      console.log(`😴 [InsideJoke] Retiring stale joke: "${stalest}"`);
      this.jokes.delete(stalest);
    }
  }

  /**
   * Get context for AI
   */
  getContext() {
    if (this.jokes.size === 0) return '';

    const freshJokes = Array.from(this.jokes.entries())
      .filter(([_, joke]) => joke.freshness > 30)
      .slice(0, 5);

    if (freshJokes.length === 0) return '';

    let context = '\n\nCurrent inside jokes you can reference:';
    freshJokes.forEach(([phrase, joke]) => {
      context += `\n- "${phrase}" (${joke.freshness.toFixed(0)}% fresh, used ${joke.uses} times)`;
    });

    return context;
  }

  /**
   * Get statistics
   */
  getStats() {
    const fresh = Array.from(this.jokes.values()).filter(j => j.freshness > 50).length;
    const stale = Array.from(this.jokes.values()).filter(j => j.freshness < 30).length;

    return {
      totalJokes: this.jokes.size,
      freshJokes: fresh,
      staleJokes: stale,
      totalCallbacks: this.callbacks.length,
      recentCallbacks: this.callbacks.slice(-5).map(c => c.phrase)
    };
  }

  /**
   * Save state
   */
  save() {
    return {
      jokes: Array.from(this.jokes.entries()),
      memeDetection: Array.from(this.memeDetection.entries()).map(([phrase, data]) => [
        phrase,
        { ...data, users: Array.from(data.users) }
      ]),
      callbacks: this.callbacks.slice(-50)
    };
  }

  /**
   * Load state
   */
  load(data) {
    if (data.jokes) {
      this.jokes = new Map(data.jokes);
    }
    if (data.memeDetection) {
      this.memeDetection = new Map(
        data.memeDetection.map(([phrase, data]) => [
          phrase,
          { ...data, users: new Set(data.users) }
        ])
      );
    }
    if (data.callbacks) {
      this.callbacks = data.callbacks;
    }

    console.log(`😂 [InsideJoke] Restored ${this.jokes.size} inside jokes`);

    // Update freshness on load
    this.updateFreshness();
  }
}

module.exports = InsideJokeEvolution;
