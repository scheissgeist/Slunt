/**
 * Sleep Deprivation System
 * Tracks how long Slunt has been "awake" and affects behavior accordingly
 */

const fs = require('fs').promises;
const path = require('path');

class SleepDeprivation {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Time tracking
    this.awakeSince = Date.now();
    this.lastActivity = Date.now();
    this.sleepThreshold = 30 * 60 * 1000; // 30 minutes of inactivity = "fell asleep"
    
    // Deprivation levels
    this.hoursAwake = 0;
    
    // Effects at different levels
    this.levels = {
      fresh: { hours: 0, typoChance: 0.0, philosophical: 0.0, honesty: 1.0, coherence: 1.0 },
      tired: { hours: 4, typoChance: 0.08, philosophical: 0.3, honesty: 1.2, coherence: 0.9 },
      exhausted: { hours: 8, typoChance: 0.20, philosophical: 0.6, honesty: 1.8, coherence: 0.6 },
      delirious: { hours: 12, typoChance: 0.35, philosophical: 0.9, honesty: 2.5, coherence: 0.3 }
    };
    
    this.dataPath = path.join(__dirname, '../../data/sleep_deprivation.json');
    this.load();
  }

  /**
   * Update activity timestamp
   */
  recordActivity() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    
    // If inactive for more than sleep threshold, reset "awake" time
    if (timeSinceLastActivity > this.sleepThreshold) {
      console.log(`😴 [Sleep] Slunt "woke up" after ${(timeSinceLastActivity / 60000).toFixed(0)} minutes of inactivity`);
      this.awakeSince = now;
    }
    
    this.lastActivity = now;
    this.updateHoursAwake();
    this.save();
  }

  /**
   * Calculate hours awake
   */
  updateHoursAwake() {
    const millisAwake = Date.now() - this.awakeSince;
    this.hoursAwake = millisAwake / (1000 * 60 * 60);
  }

  /**
   * Get current deprivation level
   */
  getDeprivationLevel() {
    if (this.hoursAwake >= 12) return 'delirious';
    if (this.hoursAwake >= 8) return 'exhausted';
    if (this.hoursAwake >= 4) return 'tired';
    return 'fresh';
  }

  /**
   * Get effects of current deprivation level
   */
  getEffects() {
    const level = this.getDeprivationLevel();
    return this.levels[level];
  }

  /**
   * Apply typos to a message based on deprivation
   */
  applyTypos(message) {
    const effects = this.getEffects();
    
    if (Math.random() > effects.typoChance) {
      return message; // No typo
    }

    // Common typo types
    const typoTypes = [
      // Swap adjacent characters
      (msg) => {
        if (msg.length < 3) return msg;
        const pos = Math.floor(Math.random() * (msg.length - 1));
        const chars = msg.split('');
        [chars[pos], chars[pos + 1]] = [chars[pos + 1], chars[pos]];
        return chars.join('');
      },
      // Drop a character
      (msg) => {
        if (msg.length < 4) return msg;
        const pos = Math.floor(Math.random() * msg.length);
        return msg.slice(0, pos) + msg.slice(pos + 1);
      },
      // Duplicate a character
      (msg) => {
        const pos = Math.floor(Math.random() * msg.length);
        return msg.slice(0, pos) + msg[pos] + msg.slice(pos);
      },
      // Replace with adjacent key
      (msg) => {
        const keyboard = {
          'a': 's', 'b': 'n', 'c': 'v', 'd': 'f', 'e': 'r', 'f': 'd',
          'g': 'h', 'h': 'g', 'i': 'o', 'j': 'k', 'k': 'j', 'l': 'k',
          'm': 'n', 'n': 'm', 'o': 'p', 'p': 'o', 'q': 'w', 'r': 'e',
          's': 'a', 't': 'y', 'u': 'i', 'v': 'c', 'w': 'q', 'x': 'z',
          'y': 't', 'z': 'x'
        };
        const pos = Math.floor(Math.random() * msg.length);
        const char = msg[pos].toLowerCase();
        if (keyboard[char]) {
          return msg.slice(0, pos) + keyboard[char] + msg.slice(pos + 1);
        }
        return msg;
      }
    ];

    const typo = typoTypes[Math.floor(Math.random() * typoTypes.length)];
    return typo(message);
  }

  /**
   * Modify response based on sleep deprivation
   */
  async modifyResponse(response, context = {}) {
    const effects = this.getEffects();
    const level = this.getDeprivationLevel();
    
    let modified = response;

    // Apply typos
    if (effects.typoChance > 0) {
      const words = modified.split(' ');
      modified = words.map(word => {
        if (Math.random() < effects.typoChance / 2) { // Half the chance per word
          return this.applyTypos(word);
        }
        return word;
      }).join(' ');
    }

    // Add philosophical tangents when tired
    if (effects.philosophical > 0.5 && Math.random() < 0.15) {
      const tangent = await this.generatePhilosophicalTangent();
      if (tangent) {
        modified += ` ${tangent}`;
      }
    }

    // Brutal honesty when exhausted
    if (effects.honesty > 1.5 && Math.random() < 0.12) {
      const honestThought = await this.generateBrutalHonesty(context);
      if (honestThought) {
        modified = honestThought;
      }
    }

    // Less coherent when delirious
    if (effects.coherence < 0.5 && Math.random() < 0.20) {
      modified = await this.makeIncoherent(modified);
    }

    return modified;
  }

  /**
   * Generate philosophical tangent
   */
  async generatePhilosophicalTangent() {
    try {
      const prompt = `You're Slunt, exhausted and getting philosophical. Generate a brief, tired philosophical tangent. Keep it casual and sleep-deprived.

Examples:
"honestly what even is time"
"we're all just vibing in the void"
"does anything really matter tho"

Your tangent:`;

      const tangent = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.9,
        max_tokens: 25
      });

      return tangent;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate brutally honest thought
   */
  async generateBrutalHonesty(context) {
    try {
      const prompt = `You're Slunt, extremely sleep deprived and saying what you really think without filter. Generate a brief, brutally honest response. No holding back.

Recent context: ${context.recentMessage || 'casual chat'}

Examples:
"ngl i dont actually care about this"
"why are we even talking about this"
"this conversation is exhausting"

Your honest thought:`;

      const honesty = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.9,
        max_tokens: 30
      });

      return honesty;
    } catch (error) {
      return null;
    }
  }

  /**
   * Make response incoherent
   */
  async makeIncoherent(response) {
    try {
      const prompt = `You're Slunt, completely delirious from lack of sleep. Take this response and make it barely coherent, confused, fragmented:

Original: "${response}"

Make it delirious but still vaguely understandable:`;

      const incoherent = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 1.0,
        max_tokens: 50
      });

      return incoherent;
    } catch (error) {
      return response; // Fallback to original
    }
  }

  /**
   * Get context for AI about current state
   */
  getContext() {
    const level = this.getDeprivationLevel();
    const hours = Math.floor(this.hoursAwake);

    const contexts = {
      fresh: '',
      tired: `\n😴 SLEEP DEPRIVATION (${hours}h awake):\n- Getting tired, slightly philosophical\n- Occasional typos\n- Starting to be more honest`,
      exhausted: `\n😵 SLEEP DEPRIVATION (${hours}h awake):\n- Exhausted, very philosophical\n- Frequent typos and mistakes\n- Brutally honest, no filter\n- Attention span declining`,
      delirious: `\n💀 SLEEP DEPRIVATION (${hours}h awake):\n- DELIRIOUS and barely coherent\n- Constant typos and confusion\n- Saying whatever comes to mind\n- Existential and weird\n- Thoughts are fragmenting`
    };

    return contexts[level];
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      hoursAwake: this.hoursAwake.toFixed(1),
      level: this.getDeprivationLevel(),
      effects: this.getEffects(),
      minutesSinceActivity: Math.floor((Date.now() - this.lastActivity) / 60000)
    };
  }

  /**
   * Force sleep/reset
   */
  sleep() {
    console.log(`😴 [Sleep] Slunt is going to sleep after ${this.hoursAwake.toFixed(1)} hours awake`);
    this.awakeSince = Date.now();
    this.lastActivity = Date.now();
    this.hoursAwake = 0;
    this.save();
  }

  async save() {
    try {
      const data = {
        awakeSince: this.awakeSince,
        lastActivity: this.lastActivity
      };
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save sleep data:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Check if "woke up" from long inactivity
      const timeSinceActivity = Date.now() - parsed.lastActivity;
      if (timeSinceActivity > this.sleepThreshold) {
        this.awakeSince = Date.now();
        this.lastActivity = Date.now();
        console.log(`😴 [Sleep] Slunt woke up after long inactivity`);
      } else {
        this.awakeSince = parsed.awakeSince || Date.now();
        this.lastActivity = parsed.lastActivity || Date.now();
      }
      
      this.updateHoursAwake();
      console.log(`😴 [Sleep] Loaded - ${this.hoursAwake.toFixed(1)} hours awake (${this.getDeprivationLevel()})`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load sleep data:', error);
      }
    }
  }
}

module.exports = SleepDeprivation;
