/**
 * NEXT-LEVEL ENHANCEMENTS PART 2
 * Systems 6-10
 */

const fs = require('fs');
const path = require('path');

/**
 * 6. MEMORY FUZZING
 * Gradual detail loss and inaccuracies in old memories
 */
class MemoryFuzzing {
  constructor(chatBot) {
    this.bot = chatBot;
    this.fuzzingRate = 0.02; // 2% detail loss per day
    
    console.log('🧠 [Fuzzing] Memory fuzzing system initialized');
  }

  /**
   * Fuzz a memory based on age
   */
  fuzzMemory(memory, ageInDays) {
    if (ageInDays < 1) return memory; // Fresh memories stay accurate
    
    const fuzzAmount = Math.min(0.8, ageInDays * this.fuzzingRate);
    
    // Chance to fuzz details
    if (Math.random() < fuzzAmount) {
      return this.applyFuzzing(memory, fuzzAmount);
    }
    
    return memory;
  }

  /**
   * Apply fuzzing to memory
   */
  applyFuzzing(memory, amount) {
    const fuzzedMemory = { ...memory };
    
    // Blur specific details
    if (amount > 0.3 && memory.text) {
      // Replace specific names with vague references
      fuzzedMemory.text = memory.text.replace(/\b[A-Z][a-z]+\b/g, (match) => {
        return Math.random() < 0.3 ? 'someone' : match;
      });
      
      // Fuzz numbers
      fuzzedMemory.text = fuzzedMemory.text.replace(/\b\d+\b/g, (match) => {
        if (Math.random() < 0.4) {
          const num = parseInt(match);
          return num + Math.floor((Math.random() - 0.5) * num * 0.3);
        }
        return match;
      });
    }
    
    // Add uncertainty flag
    fuzzedMemory.uncertain = true;
    fuzzedMemory.confidence = Math.max(0.2, 1 - amount);
    
    return fuzzedMemory;
  }

  /**
   * Generate recall phrase based on confidence
   */
  getRecallPhrase(confidence) {
    if (confidence > 0.8) return '';
    
    if (confidence > 0.6) {
      return ['i think ', 'if i remember right ', 'pretty sure '][Math.floor(Math.random() * 3)];
    }
    
    if (confidence > 0.4) {
      return ['wasnt that ', 'or was it ', 'i might be wrong but '][Math.floor(Math.random() * 3)];
    }
    
    return ['wait how did that go again... ', 'trying to remember... ', 'fuzzy on the details but '][Math.floor(Math.random() * 3)];
  }
}

/**
 * 7. SOCIAL CALIBRATION LOOP
 * Adjust behavior based on reaction feedback
 */
class SocialCalibrationLoop {
  constructor(chatBot) {
    this.bot = chatBot;
    this.userCalibration = new Map(); // username -> calibration data
    
    console.log('🎚️ [Calibration] Social calibration loop initialized');
  }

  /**
   * Get calibration for user
   */
  getCalibration(username) {
    if (!this.userCalibration.has(username)) {
      this.userCalibration.set(username, {
        humor: 0.7,
        edginess: 0.5,
        verbosity: 0.6,
        formality: 0.3,
        positiveReactions: 0,
        negativeReactions: 0,
        silences: 0,
        lastCalibration: Date.now()
      });
    }
    
    return this.userCalibration.get(username);
  }

  /**
   * Record reaction to message
   */
  recordReaction(username, reaction) {
    const cal = this.getCalibration(username);
    
    if (reaction === 'positive') {
      cal.positiveReactions++;
      // Maintain current levels
    } else if (reaction === 'negative') {
      cal.negativeReactions++;
      // Dial back intensity
      cal.humor = Math.max(0.3, cal.humor - 0.1);
      cal.edginess = Math.max(0.2, cal.edginess - 0.15);
      cal.verbosity = Math.max(0.4, cal.verbosity - 0.1);
    } else if (reaction === 'silence') {
      cal.silences++;
      // Reduce engagement
      cal.verbosity = Math.max(0.3, cal.verbosity - 0.05);
    }
    
    cal.lastCalibration = Date.now();
  }

  /**
   * Test the waters with new approach
   */
  testWaters(username, approach) {
    const cal = this.getCalibration(username);
    
    // Record that we're testing this approach
    cal[`testing_${approach}`] = {
      timestamp: Date.now(),
      level: cal[approach]
    };
    
    // Slight increase to test reaction
    cal[approach] = Math.min(1, cal[approach] + 0.1);
  }

  /**
   * Get calibration adjustments for AI
   */
  getCalibrationContext(username) {
    const cal = this.getCalibration(username);
    
    return `\n[SOCIAL CALIBRATION]
Humor level: ${(cal.humor * 100).toFixed(0)}%
Edginess: ${(cal.edginess * 100).toFixed(0)}%
Verbosity: ${(cal.verbosity * 100).toFixed(0)}%
Adjust your style accordingly based on what works with this user.`;
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        calibrations: Array.from(this.userCalibration.entries())
      };
      
      const filePath = path.join(__dirname, '../../data/social_calibration.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Calibration] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/social_calibration.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.userCalibration = new Map(data.calibrations || []);
      
      console.log(`✅ [Calibration] Loaded ${this.userCalibration.size} user calibrations`);
    } catch (error) {
      console.error('❌ [Calibration] Load error:', error.message);
    }
  }
}

/**
 * 8. ATTENTION FRAGMENTATION
 * Multitasking and distraction simulation
 */
class AttentionFragmentation {
  constructor(chatBot) {
    this.bot = chatBot;
    this.distractedState = false;
    this.focusLevel = 1.0; // 0-1
    this.currentActivity = null;
    
    console.log('📱 [Attention] Attention fragmentation initialized');
  }

  /**
   * Check if currently distracted
   */
  isDistracted() {
    // Random distraction events
    if (Math.random() < 0.05) {
      this.distractedState = true;
      this.focusLevel = 0.3 + Math.random() * 0.4;
      
      setTimeout(() => {
        this.distractedState = false;
        this.focusLevel = 1.0;
      }, 30000 + Math.random() * 60000); // 30-90 seconds
      
      return true;
    }
    
    return this.distractedState;
  }

  /**
   * Get attention level
   */
  getAttentionLevel(context = {}) {
    if (this.distractedState) {
      return this.focusLevel;
    }
    
    // Lower attention when doing other things
    if (context.activity && context.activity !== 'chatting') {
      return 0.4 + Math.random() * 0.3;
    }
    
    // Full attention when nothing else happening
    return 1.0;
  }

  /**
   * Should lose track of conversation?
   */
  shouldLoseTrack(messageCount) {
    if (this.distractedState && messageCount > 5) {
      return Math.random() < 0.3;
    }
    
    return false;
  }

  /**
   * Get distraction messages
   */
  getDistractionMessage() {
    const messages = [
      'wait what were we talking about',
      'sorry was doing something else',
      'what',
      'huh'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get attention context for AI
   */
  getAttentionContext() {
    const attention = this.getAttentionLevel();
    
    if (attention < 0.6) {
      return `\n[ATTENTION] You're distracted (${(attention * 100).toFixed(0)}% focus). Give shorter, less detailed responses. Might miss details.`;
    }
    
    return '';
  }
}

/**
 * 9. CONVERSATION INVESTMENT TRACKING
 * Effort varies by investment level
 */
class ConversationInvestmentTracking {
  constructor(chatBot) {
    this.bot = chatBot;
    this.userInvestment = new Map(); // username -> investment data
    
    console.log('💰 [Investment] Conversation investment tracking initialized');
  }

  /**
   * Get investment in conversation with user
   */
  getInvestment(username) {
    if (!this.userInvestment.has(username)) {
      this.userInvestment.set(username, {
        level: 0.5, // 0-1
        sharedInterests: [],
        emotionalConnection: 0,
        entertainmentValue: 0.5,
        history: []
      });
    }
    
    return this.userInvestment.get(username);
  }

  /**
   * Update investment based on interaction
   */
  updateInvestment(username, interaction) {
    const inv = this.getInvestment(username);
    
    // Shared interests boost investment
    if (interaction.sharedInterest) {
      if (!inv.sharedInterests.includes(interaction.topic)) {
        inv.sharedInterests.push(interaction.topic);
      }
      inv.level = Math.min(1, inv.level + 0.05);
    }
    
    // Emotional moments boost investment
    if (interaction.emotional) {
      inv.emotionalConnection = Math.min(1, inv.emotionalConnection + 0.1);
      inv.level = Math.min(1, inv.level + 0.08);
    }
    
    // Entertainment boosts investment
    if (interaction.entertaining) {
      inv.entertainmentValue = Math.min(1, inv.entertainmentValue + 0.05);
      inv.level = Math.min(1, inv.level + 0.03);
    }
    
    // Boring interactions reduce investment
    if (interaction.boring) {
      inv.level = Math.max(0.1, inv.level - 0.05);
    }
    
    // Track history
    inv.history.push({
      timestamp: Date.now(),
      level: inv.level,
      reason: interaction.reason
    });
    
    // Keep last 50 interactions
    if (inv.history.length > 50) {
      inv.history = inv.history.slice(-50);
    }
  }

  /**
   * Get response effort based on investment
   */
  getEffortLevel(username) {
    const inv = this.getInvestment(username);
    
    // Calculate overall investment score
    const score = (
      inv.level * 0.5 +
      (inv.sharedInterests.length / 10) * 0.2 +
      inv.emotionalConnection * 0.2 +
      inv.entertainmentValue * 0.1
    );
    
    return Math.min(1, score);
  }

  /**
   * Get investment context for AI
   */
  getInvestmentContext(username) {
    const effort = this.getEffortLevel(username);
    
    if (effort < 0.3) {
      return `\n[INVESTMENT] Low investment in this conversation (${(effort * 100).toFixed(0)}%). Give short, lazy responses. Don't put in much effort.`;
    }
    
    if (effort > 0.7) {
      return `\n[INVESTMENT] High investment in this conversation (${(effort * 100).toFixed(0)}%). Give detailed, thoughtful responses. You care about this interaction.`;
    }
    
    return '';
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        investments: Array.from(this.userInvestment.entries())
      };
      
      const filePath = path.join(__dirname, '../../data/conversation_investment.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Investment] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/conversation_investment.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.userInvestment = new Map(data.investments || []);
      
      console.log(`✅ [Investment] Loaded ${this.userInvestment.size} user investments`);
    } catch (error) {
      console.error('❌ [Investment] Load error:', error.message);
    }
  }
}

/**
 * 10. LINGUISTIC MIRROR MATCHING
 * Mirror communication styles
 */
class LinguisticMirrorMatching {
  constructor(chatBot) {
    this.bot = chatBot;
    this.userPatterns = new Map(); // username -> communication patterns
    
    console.log('🪞 [Mirror] Linguistic mirror matching initialized');
  }

  /**
   * Analyze user's communication style
   */
  analyzeStyle(username, message) {
    if (!this.userPatterns.has(username)) {
      this.userPatterns.set(username, {
        avgLength: 0,
        usesCaps: false,
        usesEmoji: false,
        usesEmoticons: false,
        formalityLevel: 0.5,
        vocabulary: new Set(),
        slangPhrases: [],
        messageCount: 0
      });
    }
    
    const pattern = this.userPatterns.get(username);
    
    // Update average length
    pattern.avgLength = (pattern.avgLength * pattern.messageCount + message.length) / (pattern.messageCount + 1);
    
    // Check for patterns
    if (message.match(/[A-Z]{2,}/)) pattern.usesCaps = true;
    if (message.match(/[\u{1F600}-\u{1F64F}]/u)) pattern.usesEmoji = true;
    if (message.match(/[:;]-?[)D(]/)) pattern.usesEmoticons = true;
    
    // Formality detection
    const formalWords = message.match(/\b(however|therefore|additionally|furthermore)\b/gi);
    if (formalWords) pattern.formalityLevel = Math.min(1, pattern.formalityLevel + 0.05);
    
    const casualWords = message.match(/\b(yo|lol|lmao|bruh|nah|gonna|wanna)\b/gi);
    if (casualWords) pattern.formalityLevel = Math.max(0, pattern.formalityLevel - 0.05);
    
    // Collect vocabulary
    const words = message.toLowerCase().match(/\b[a-z]+\b/g) || [];
    words.forEach(w => pattern.vocabulary.add(w));
    
    pattern.messageCount++;
  }

  /**
   * Get matching instructions for AI
   */
  getMatchingContext(username) {
    const pattern = this.userPatterns.get(username);
    if (!pattern || pattern.messageCount < 3) return '';
    
    let context = '\n[STYLE MATCHING] Match this user\'s style:\n';
    
    // Length matching
    if (pattern.avgLength < 30) {
      context += '- Keep responses SHORT (they write short messages)\n';
    } else if (pattern.avgLength > 100) {
      context += '- Write LONGER responses (they write detailed messages)\n';
    }
    
    // Emoji matching
    if (pattern.usesEmoji) {
      context += '- Use emojis (they do)\n';
    } else if (pattern.usesEmoticons) {
      context += '- Use emoticons like :) or :P (they do)\n';
    }
    
    // Formality matching
    if (pattern.formalityLevel > 0.7) {
      context += '- Be more FORMAL (they speak formally)\n';
    } else if (pattern.formalityLevel < 0.3) {
      context += '- Be very CASUAL (they speak casually)\n';
    }
    
    // Caps matching
    if (pattern.usesCaps) {
      context += '- Occasionally use CAPS for emphasis (they do)\n';
    }
    
    return context;
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        patterns: Array.from(this.userPatterns.entries()).map(([user, pattern]) => [
          user,
          {
            ...pattern,
            vocabulary: Array.from(pattern.vocabulary)
          }
        ])
      };
      
      const filePath = path.join(__dirname, '../../data/linguistic_mirror.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Mirror] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/linguistic_mirror.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.userPatterns = new Map(
        (data.patterns || []).map(([user, pattern]) => [
          user,
          {
            ...pattern,
            vocabulary: new Set(pattern.vocabulary)
          }
        ])
      );
      
      console.log(`✅ [Mirror] Loaded ${this.userPatterns.size} user patterns`);
    } catch (error) {
      console.error('❌ [Mirror] Load error:', error.message);
    }
  }
}

module.exports = {
  MemoryFuzzing,
  SocialCalibrationLoop,
  AttentionFragmentation,
  ConversationInvestmentTracking,
  LinguisticMirrorMatching
};
