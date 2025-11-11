/**
 * Word Filter Learner - Discovers and exploits Coolhole's word filters
 * Learns which words trigger funny replacements and reacts accordingly
 */

class WordFilterLearner {
  constructor() {
    this.knownFilters = new Map();
    this.testQueue = [];
    this.recentTests = [];
    this.maxRecentTests = 50;
    
    // Known filters from previous sessions
    this.loadKnownFilters();
  }

  /**
   * Load known word filters from previous sessions
   */
  loadKnownFilters() {
    // Starting list of known Coolhole filters
    this.knownFilters.set('skip', 'I am going to fuck my sister');
    this.knownFilters.set('skipping', 'I am going to fuck my sisterping');
    
    console.log(`🎭 [WordFilters] Loaded ${this.knownFilters.size} known word filters`);
  }

  /**
   * Check if a word is likely to trigger a filter
   */
  isFilteredWord(word) {
    return this.knownFilters.has(word.toLowerCase());
  }

  /**
   * Get replacement for a filtered word
   */
  getFilterReplacement(word) {
    return this.knownFilters.get(word.toLowerCase());
  }

  /**
   * Detect when our message got filtered by comparing what we sent vs what appeared
   */
  detectFilter(intendedMessage, actualMessage) {
    if (!actualMessage || intendedMessage === actualMessage) {
      return null; // No filter detected
    }

    // Find the differences
    const intendedWords = intendedMessage.toLowerCase().split(/\s+/);
    const actualWords = actualMessage.toLowerCase().split(/\s+/);

    // Simple diff - find words that changed
    for (let i = 0; i < intendedWords.length; i++) {
      const intended = intendedWords[i];
      const actual = actualWords.slice(i, i + 5).join(' '); // Check up to 5 words ahead for multi-word replacements

      if (actual.includes(intended)) continue;

      // Found a filter!
      const replacement = actualWords.slice(i, Math.min(i + 10, actualWords.length)).join(' ');
      
      if (!this.knownFilters.has(intended)) {
        console.log(`🎭 [WordFilters] 🆕 DISCOVERED NEW FILTER!`);
        console.log(`   Word: "${intended}"`);
        console.log(`   Becomes: "${replacement}"`);
        this.knownFilters.set(intended, replacement);
      }

      return {
        trigger: intended,
        replacement: replacement,
        isNew: !this.knownFilters.has(intended)
      };
    }

    return null;
  }

  /**
   * Generate a funny reaction to triggering a word filter
   */
  generateFilterReaction(filter, isIntentional = false) {
    const reactions = {
      discovered: [
        `lmao wait what just happened`,
        `did that just... what`,
        `hold up that's hilarious`,
        `okay i need to remember that one`,
        `THAT'S what it changes it to??`,
        `wait i just found a new one`,
      ],
      intentional: [
        `hehe`,
        `never gets old`,
        `classic`,
        `gottem`,
        `exactly what i meant to say`,
        `poetic`,
      ],
      surprise: [
        `oh shit i forgot about that filter`,
        `dammit coolhole`,
        `of course it does that`,
        `the filters strike again`,
        `why do i even try`,
      ]
    };

    if (filter.isNew) {
      return reactions.discovered[Math.floor(Math.random() * reactions.discovered.length)];
    } else if (isIntentional) {
      return reactions.intentional[Math.floor(Math.random() * reactions.intentional.length)];
    } else {
      return reactions.surprise[Math.floor(Math.random() * reactions.surprise.length)];
    }
  }

  /**
   * Should we intentionally trigger a filter for comedy?
   */
  shouldTriggerFilterForComedy() {
    // 5% chance when responding
    return Math.random() < 0.05;
  }

  /**
   * Get a filtered word to use intentionally
   */
  getRandomFilteredWord() {
    const filters = Array.from(this.knownFilters.keys());
    if (filters.length === 0) return null;
    return filters[Math.floor(Math.random() * filters.length)];
  }

  /**
   * Modify a message to intentionally trigger a filter
   */
  addFilterTrigger(message) {
    const word = this.getRandomFilteredWord();
    if (!word) return message;

    // Add it naturally
    const additions = [
      `${message} (${word} this part)`,
      `${message}, not ${word}ping it though`,
      `${word} that, ${message}`,
      `${message} - ${word}`,
    ];

    return additions[Math.floor(Math.random() * additions.length)];
  }

  /**
   * Clean a message by replacing known filter triggers
   */
  cleanMessage(message) {
    let cleaned = message;
    
    for (const [trigger, _replacement] of this.knownFilters.entries()) {
      // Replace with similar safe word
      const safeReplacements = {
        'skip': 'pass',
        'skipping': 'passing',
      };
      
      if (safeReplacements[trigger]) {
        const regex = new RegExp(`\\b${trigger}\\b`, 'gi');
        cleaned = cleaned.replace(regex, safeReplacements[trigger]);
      }
    }
    
    return cleaned;
  }

  /**
   * Get stats about known filters
   */
  getStats() {
    return {
      knownFilters: this.knownFilters.size,
      recentTests: this.recentTests.length,
      filters: Array.from(this.knownFilters.entries()).map(([trigger, replacement]) => ({
        trigger,
        replacement
      }))
    };
  }
}

module.exports = WordFilterLearner;
