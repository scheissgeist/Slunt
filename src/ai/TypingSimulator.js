/**
 * Typing Simulator
 * Makes Slunt appear more human by simulating realistic typing speeds
 */

class TypingSimulator {
  constructor() {
    // Base typing speeds (WPM - words per minute) - ULTRA FAST CHAT
    this.baseWPM = {
      min: 80,  // Fast typing
      max: 150,  // Very fast typing
      average: 120  // Much faster average
    };
    
    // Factors that affect typing speed
    this.factors = {
      complexity: 1.0,  // Complex thoughts = slower typing
      emotion: 1.0,     // Excited = faster, depressed = slower
      confidence: 1.0,  // Low confidence = more hesitation
      length: 1.0       // Longer messages = slight speedup (momentum)
    };
    
    // Realistic pauses (in ms) - MINIMAL FOR FAST RESPONSE
    this.pauses = {
      thinking: [100, 300],      // Before starting to type - INSTANT
      hesitation: [50, 150],     // Mid-sentence pause - MINIMAL
      punctuation: [20, 80],     // After periods, commas - QUICK
      correction: [100, 300]     // Backspace/rethink moment - FAST
    };
    
    // Stats
    this.totalSimulations = 0;
    this.averageDelay = 0;
  }

  /**
   * Calculate typing time for a message
   * Returns delay in milliseconds before sending
   */
  calculateTypingTime(message, context = {}) {
    const {
      mentalState = null,
      mood = null,
      complexity = 'normal',
      isExcited = false
    } = context;
    
    // Base calculation: characters per minute
    const charCount = message.length;
    const wordCount = message.split(/\s+/).length;
    
    // Adjust WPM based on context
    let wpm = this.baseWPM.average;
    
    // Mental state affects speed
    if (mentalState) {
      // Depression slows typing
      wpm -= (mentalState.depression || 0) * 20;
      
      // Anxiety makes typing erratic (average out to slightly slower)
      wpm -= (mentalState.anxiety || 0) * 10;
      
      // Low confidence = more hesitation
      if (mentalState.confidence < 0.5) {
        wpm -= (1 - mentalState.confidence) * 15;
      }
      
      // ADRENOCHROME MODE = INSANELY FAST
      if (mentalState.overallState === 'ADRENOCHROME_MODE') {
        wpm = this.baseWPM.max * 1.5; // 127 WPM - typing like a maniac
        // Skip most pauses
        return this.calculateRawTypingTime(charCount, wpm) + this.randomPause('thinking', 0.3);
      }
    }
    
    // Mood affects speed
    if (mood) {
      if (mood === 'excited' || mood === 'energetic') {
        wpm += 15;
      } else if (mood === 'sad' || mood === 'tired') {
        wpm -= 20;
      } else if (mood === 'anxious') {
        wpm -= 10;
      }
    }
    
    // Complexity affects speed
    if (complexity === 'complex' || message.match(/\b(philosophical|existential|metaphor)\b/i)) {
      wpm -= 15; // Think harder = type slower
    }
    
    // Excitement override
    if (isExcited || message.match(/[!]{2,}|[A-Z]{4,}/)) {
      wpm += 20; // Excited = faster typing
    }
    
    // Length momentum (slightly faster on longer messages)
    if (wordCount > 15) {
      wpm += 5;
    }
    
    // Clamp WPM to realistic range
    wpm = Math.max(30, Math.min(120, wpm));
    
    // Calculate base typing time
    const baseTime = this.calculateRawTypingTime(charCount, wpm);
    
    // Add realistic pauses
    let totalTime = baseTime;
    
    // Initial thinking pause
    totalTime += this.randomPause('thinking');
    
    // Sentence pauses (periods, question marks)
    const sentences = message.split(/[.!?]+/).length - 1;
    totalTime += sentences * this.randomPause('punctuation');
    
    // Occasional hesitation (10% chance per message) - REDUCED
    if (Math.random() < 0.1) {
      totalTime += this.randomPause('hesitation');
    }
    
    // Rare correction moment (3% chance - backspace and retype) - REDUCED
    if (Math.random() < 0.03 && wordCount > 5) {
      totalTime += this.randomPause('correction');
    }
    
    // Add natural variance (±10%) - REDUCED for consistency
    const variance = 0.9 + Math.random() * 0.2;
    totalTime *= variance;
    
    // Track stats
    this.totalSimulations++;
    this.averageDelay = ((this.averageDelay * (this.totalSimulations - 1)) + totalTime) / this.totalSimulations;
    
    return Math.round(totalTime);
  }

  /**
   * Calculate raw typing time without pauses
   */
  calculateRawTypingTime(charCount, wpm) {
    // Average word length: 5 characters
    // WPM to characters per minute: WPM * 5
    const cpm = wpm * 5;
    
    // Convert to milliseconds
    const timeInMinutes = charCount / cpm;
    const timeInMs = timeInMinutes * 60 * 1000;
    
    return timeInMs;
  }

  /**
   * Get random pause duration
   */
  randomPause(type, multiplier = 1.0) {
    const range = this.pauses[type] || [0, 0];
    const min = range[0] * multiplier;
    const max = range[1] * multiplier;
    return min + Math.random() * (max - min);
  }

  /**
   * Simulate typing with live updates (shows "..." in chat)
   * Returns promise that resolves after typing time
   */
  async simulateTyping(message, context = {}, onProgress = null) {
    const totalTime = this.calculateTypingTime(message, context);
    const startTime = Date.now();
    
    // If callback provided, send periodic updates
    if (onProgress) {
      const updateInterval = 500; // Update every 500ms
      const updates = Math.floor(totalTime / updateInterval);
      
      for (let i = 0; i < updates; i++) {
        await this.sleep(updateInterval);
        const elapsed = Date.now() - startTime;
        const progress = elapsed / totalTime;
        onProgress(progress);
      }
    }
    
    // Wait for remaining time
    const elapsed = Date.now() - startTime;
    const remaining = totalTime - elapsed;
    if (remaining > 0) {
      await this.sleep(remaining);
    }
    
    return totalTime;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add emotion-driven typos to make typing feel more human
   */
  addTypos(message, context = {}) {
    const { mood, mentalState } = context;
    
    // Short messages rarely get typos
    if (message.length < 20) return message;
    
    // Calculate typo chance based on emotional state
    let typoChance = 0.03; // 3% base chance per word
    let shouldCorrect = true;
    
    // Excited/manic = more typos
    if (mood === 'excited' || mood === 'manic') {
      typoChance = 0.12; // 12% chance
      shouldCorrect = Math.random() < 0.7; // 70% correction rate
    }
    
    // Drunk mode = LOTS of typos, degrades over time
    if (mentalState && mentalState.substance?.name === 'alcohol') {
      const drunkLevel = mentalState.substance.doseMg / 200; // Higher = more drunk
      typoChance = 0.15 + (drunkLevel * 0.15); // 15-30%
      shouldCorrect = Math.random() < (0.3 - drunkLevel * 0.2); // 30-10% correction
    }
    
    // Anxious = deliberate, fewer typos
    if (mood === 'anxious' || mood === 'stressed') {
      typoChance = 0.01; // 1% chance
    }
    
    // Depressed/tired = occasional typos, don't always correct
    if (mood === 'depressed' || mood === 'tired') {
      typoChance = 0.05; // 5% chance
      shouldCorrect = Math.random() < 0.4; // 40% correction rate
    }
    
    // Split into words but preserve spaces/punctuation
    const words = message.split(/(\s+|[.,!?;:])/);
    let result = [];
    
    for (let word of words) {
      // Skip whitespace and punctuation
      if (word.match(/^\s+$/) || word.match(/^[.,!?;:]$/)) {
        result.push(word);
        continue;
      }
      
      // Skip very short words
      if (word.length < 3) {
        result.push(word);
        continue;
      }
      
      // Roll for typo
      if (Math.random() < typoChance) {
        const typoWord = this.generateTypo(word);
        
        // Correct the typo?
        if (shouldCorrect) {
          // Disabled strikethrough - just use corrected word
          // (No strikethrough on any platform)
          result.push(word);
        } else {
          result.push(typoWord);
        }
      } else {
        result.push(word);
      }
    }
    
    return result.join('');
  }

  /**
   * Generate a realistic typo
   */
  generateTypo(word) {
    const typoTypes = [
      () => this.adjacentKeyTypo(word),    // 40% - hit adjacent key
      () => this.missingLetterTypo(word),  // 25% - skip a letter
      () => this.doubleLetterTypo(word),   // 20% - double a letter
      () => this.swapLettersTypo(word),    // 15% - swap adjacent letters
    ];
    
    // Weight the selection
    const rand = Math.random();
    let selectedTypo;
    if (rand < 0.40) selectedTypo = typoTypes[0];
    else if (rand < 0.65) selectedTypo = typoTypes[1];
    else if (rand < 0.85) selectedTypo = typoTypes[2];
    else selectedTypo = typoTypes[3];
    
    return selectedTypo();
  }

  /**
   * Hit an adjacent key on QWERTY keyboard
   */
  adjacentKeyTypo(word) {
    const keyboard = {
      'q': ['w', 'a'],
      'w': ['q', 'e', 's'],
      'e': ['w', 'r', 'd'],
      'r': ['e', 't', 'f'],
      't': ['r', 'y', 'g'],
      'y': ['t', 'u', 'h'],
      'u': ['y', 'i', 'j'],
      'i': ['u', 'o', 'k'],
      'o': ['i', 'p', 'l'],
      'p': ['o'],
      'a': ['q', 's', 'z'],
      's': ['a', 'w', 'd', 'x'],
      'd': ['s', 'e', 'f', 'c'],
      'f': ['d', 'r', 'g', 'v'],
      'g': ['f', 't', 'h', 'b'],
      'h': ['g', 'y', 'j', 'n'],
      'j': ['h', 'u', 'k', 'm'],
      'k': ['j', 'i', 'l'],
      'l': ['k', 'o'],
      'z': ['a', 'x'],
      'x': ['z', 's', 'c'],
      'c': ['x', 'd', 'v'],
      'v': ['c', 'f', 'b'],
      'b': ['v', 'g', 'n'],
      'n': ['b', 'h', 'm'],
      'm': ['n', 'j']
    };
    
    const pos = Math.floor(Math.random() * word.length);
    const char = word[pos].toLowerCase();
    const adjacent = keyboard[char];
    
    if (!adjacent || adjacent.length === 0) return word;
    
    const replacement = adjacent[Math.floor(Math.random() * adjacent.length)];
    const isUpperCase = word[pos] === word[pos].toUpperCase();
    const newChar = isUpperCase ? replacement.toUpperCase() : replacement;
    
    return word.substring(0, pos) + newChar + word.substring(pos + 1);
  }

  /**
   * Skip a letter
   */
  missingLetterTypo(word) {
    if (word.length < 4) return word;
    const pos = 1 + Math.floor(Math.random() * (word.length - 2)); // Not first or last
    return word.substring(0, pos) + word.substring(pos + 1);
  }

  /**
   * Double a letter
   */
  doubleLetterTypo(word) {
    const pos = Math.floor(Math.random() * word.length);
    return word.substring(0, pos) + word[pos] + word.substring(pos);
  }

  /**
   * Swap adjacent letters
   */
  swapLettersTypo(word) {
    if (word.length < 2) return word;
    const pos = Math.floor(Math.random() * (word.length - 1));
    return word.substring(0, pos) + word[pos + 1] + word[pos] + word.substring(pos + 2);
  }

  /**
   * Get typing speed description
   */
  getTypingSpeedDescription(wpm) {
    if (wpm < 40) return 'very slow (thinking hard)';
    if (wpm < 60) return 'slow (careful)';
    if (wpm < 80) return 'normal';
    if (wpm < 100) return 'fast (confident)';
    return 'very fast (excited/manic)';
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    return {
      totalSimulations: this.totalSimulations,
      averageDelayMs: Math.round(this.averageDelay),
      averageDelaySec: (this.averageDelay / 1000).toFixed(1),
      baseWPM: this.baseWPM
    };
  }

  /**
   * Format time for logging
   */
  formatTime(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
}

module.exports = TypingSimulator;
