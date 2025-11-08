/**
 * Style Mimicry System
 * Learns and adopts the communication style of chat users
 */

class StyleMimicry {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.stylePatterns = {
      punctuation: {
        exclamation: 0,
        question: 0,
        ellipsis: 0,
        none: 0
      },
      capitalization: {
        normal: 0,
        lowercase: 0,
        ALLCAPS: 0,
        WeIrDcAsE: 0
      },
      length: {
        short: 0, // < 20 chars
        medium: 0, // 20-60 chars
        long: 0 // > 60 chars
      },
      emojis: [],
      slang: new Map(),
      typos: [], // intentional typos like 'rn', 'u', 'ur'
      abbreviations: new Map(),
      casualPhrases: [],
      reactions: [] // like "lmao", "bruh", "nah"
    };
  }

  /**
   * Learn from a message
   */
  learnFromMessage(text, username) {
    // Skip bot's own messages (Slunt on Coolhole/Discord, sluntbot on Twitch)
    const myUsernames = ['Slunt', 'sluntbot'];
    if (myUsernames.some(name => username.toLowerCase() === name.toLowerCase())) return;

    // Analyze punctuation
    if (text.includes('!!!') || text.match(/!{2,}/)) {
      this.stylePatterns.punctuation.exclamation += 2;
    } else if (text.endsWith('!')) {
      this.stylePatterns.punctuation.exclamation++;
    } else if (text.endsWith('?')) {
      this.stylePatterns.punctuation.question++;
    } else if (text.includes('...') || text.includes('..')) {
      this.stylePatterns.punctuation.ellipsis++;
    } else if (!text.match(/[.!?,;:]$/)) {
      this.stylePatterns.punctuation.none++;
    }

    // Analyze capitalization
    if (text === text.toUpperCase() && text.length > 3 && /[A-Z]{4,}/.test(text)) {
      this.stylePatterns.capitalization.ALLCAPS++;
    } else if (text === text.toLowerCase() && /[a-z]/.test(text)) {
      this.stylePatterns.capitalization.lowercase++;
    } else {
      this.stylePatterns.capitalization.normal++;
    }

    // Analyze length
    if (text.length < 20) {
      this.stylePatterns.length.short++;
    } else if (text.length < 60) {
      this.stylePatterns.length.medium++;
    } else {
      this.stylePatterns.length.long++;
    }

    // Extract emojis
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiRegex);
    if (emojis) {
      this.stylePatterns.emojis.push(...emojis);
      // Keep only last 100 emojis
      if (this.stylePatterns.emojis.length > 100) {
        this.stylePatterns.emojis = this.stylePatterns.emojis.slice(-100);
      }
    }

    // BANNED ZOOMER SLANG - Slunt should NEVER use these
    const bannedZoomerSlang = [
      'oof', 'yeet', 'lit', 'fire', 
      'ratio', 'cope', 'seethe', 'mald', 'touch grass', 'go outside', 
      'queen', 'king', 'slay', 'periodt', 'ate', 'slaps', 'bop'
    ];

    // Learn slang and casual phrases (excluding banned zoomer slang)
    const slangPatterns = [
      'lmao', 'lol', 'nah', 'yea', 'yeah', 'tbh', 'imo', 'imho',
      'rn', 'tho', 'af', 'asf', 'smh', 'fml', 'wtf', 'omg', 'nvm', 'idk', 'ik',
      'prolly', 'gonna', 'wanna', 'gotta', 'dunno', 'kinda', 'sorta',
      'hella', 'mad', 'salty', 'sus', 'same', 'goat', 'cringe'
    ];

    const lowerText = text.toLowerCase();
    for (const slang of slangPatterns) {
      if (lowerText.includes(slang)) {
        this.stylePatterns.slang.set(slang, (this.stylePatterns.slang.get(slang) || 0) + 1);
      }
    }

    // Learn abbreviations
    const abbrevPatterns = [
      { full: 'you', abbrev: 'u' },
      { full: 'your', abbrev: 'ur' },
      { full: "you're", abbrev: 'ur' },
      { full: 'are', abbrev: 'r' },
      { full: 'be', abbrev: 'b' },
      { full: 'see', abbrev: 'c' },
      { full: 'why', abbrev: 'y' },
      { full: 'okay', abbrev: 'k' },
      { full: 'ok', abbrev: 'k' },
      { full: 'right now', abbrev: 'rn' },
      { full: 'though', abbrev: 'tho' },
      { full: 'because', abbrev: 'bc' },
      { full: 'with', abbrev: 'w' }
    ];

    for (const pattern of abbrevPatterns) {
      if (lowerText.includes(pattern.abbrev)) {
        this.stylePatterns.abbreviations.set(
          pattern.abbrev,
          (this.stylePatterns.abbreviations.get(pattern.abbrev) || 0) + 1
        );
      }
    }

    // Extract casual phrases (3-5 word combos)
    const words = text.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 3).join(' ');
      if (phrase.length > 8 && phrase.length < 30) {
        this.stylePatterns.casualPhrases.push(phrase);
      }
    }

    // Keep only last 200 phrases
    if (this.stylePatterns.casualPhrases.length > 200) {
      this.stylePatterns.casualPhrases = this.stylePatterns.casualPhrases.slice(-200);
    }
  }

  /**
   * Transform a message to match the learned style
   */
  styleMessage(originalMessage) {
    let message = originalMessage;

    // Apply capitalization style
    const totalCap = this.stylePatterns.capitalization.lowercase + 
                    this.stylePatterns.capitalization.normal + 
                    this.stylePatterns.capitalization.ALLCAPS;
    
    if (totalCap > 10) {
      const lowercaseRatio = this.stylePatterns.capitalization.lowercase / totalCap;
      const capsRatio = this.stylePatterns.capitalization.ALLCAPS / totalCap;
      
      // If chat uses mostly lowercase, use lowercase
      if (lowercaseRatio > 0.6 && Math.random() > 0.3) {
        message = message.toLowerCase();
        // Capitalize I
        message = message.replace(/\bi\b/g, 'I');
      }
      
      // Occasionally use CAPS for emphasis if chat does
      if (capsRatio > 0.2 && Math.random() > 0.8) {
        const words = message.split(' ');
        const emphasisWord = words[Math.floor(Math.random() * words.length)];
        message = message.replace(emphasisWord, emphasisWord.toUpperCase());
      }
    }

    // Apply abbreviations
    if (this.stylePatterns.abbreviations.size > 5) {
      const abbrevs = [
        { full: /\byou\b/gi, abbrev: 'u', count: this.stylePatterns.abbreviations.get('u') || 0 },
        { full: /\byour\b/gi, abbrev: 'ur', count: this.stylePatterns.abbreviations.get('ur') || 0 },
        { full: /\bthough\b/gi, abbrev: 'tho', count: this.stylePatterns.abbreviations.get('tho') || 0 },
        { full: /\bthrough\b/gi, abbrev: 'thru', count: this.stylePatterns.abbreviations.get('thru') || 0 },
        { full: /\bbecause\b/gi, abbrev: 'bc', count: this.stylePatterns.abbreviations.get('bc') || 0 }
      ];

      for (const abbrev of abbrevs) {
        if (abbrev.count > 3 && Math.random() > 0.5) {
          message = message.replace(abbrev.full, abbrev.abbrev);
        }
      }
    }

    // Apply punctuation style
    const totalPunc = Object.values(this.stylePatterns.punctuation).reduce((a, b) => a + b, 0);
    if (totalPunc > 20) {
      const noPuncRatio = this.stylePatterns.punctuation.none / totalPunc;
      const exclamRatio = this.stylePatterns.punctuation.exclamation / totalPunc;
      const ellipsisRatio = this.stylePatterns.punctuation.ellipsis / totalPunc;

      // Remove ending punctuation if chat doesn't use it much
      if (noPuncRatio > 0.5 && Math.random() > 0.4) {
        message = message.replace(/[.!?]+$/, '');
      }
      // Use ! instead of .
      else if (exclamRatio > 0.3 && Math.random() > 0.6) {
        message = message.replace(/\.$/, '!');
      }
      // Add ... sometimes
      else if (ellipsisRatio > 0.2 && Math.random() > 0.7) {
        message = message.replace(/[.!?]$/, '...');
      }
    }

    // BANNED ZOOMER SLANG - never use these in responses
    const bannedWords = [
      'oof', 'yeet', 'lit', 'fire', 
      'ratio', 'cope', 'seethe', 'mald', 'touch grass', 'go outside', 
      'queen', 'king', 'slay', 'periodt', 'ate', 'slaps', 'bop'
    ];

    // Filter banned slang from top slang and strip zoomer words from message
    const topSlang = Array.from(this.stylePatterns.slang.entries())
      .filter(([word]) => !bannedWords.includes(word.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(s => s[0]);

    // Remove any banned slang that might be in the message
    const lowerMsg = message.toLowerCase();
    for (const banned of bannedWords) {
      const regex = new RegExp(`\\b${banned}\\b`, 'gi');
      message = message.replace(regex, '');
    }
    // Clean up extra spaces
    message = message.replace(/\s+/g, ' ').trim();

    if (topSlang.length > 0 && Math.random() > 0.90) { // VERY reduced frequency
      // Don't add slang if message already has filler words
      const hasFillerWords = ['ik', 'tbh', 'tho', 'lmao', 'lol'].some(word => lowerMsg.includes(word));

      if (!hasFillerWords) {
        const slang = topSlang[Math.floor(Math.random() * topSlang.length)];
        // Add at the end sometimes
        if (Math.random() > 0.5) {
          message = `${message} ${slang}`;
        }
      }
    }

    // Add emoji sometimes
    if (this.stylePatterns.emojis.length > 5 && Math.random() > 0.85) {
      const emoji = this.stylePatterns.emojis[
        Math.floor(Math.random() * this.stylePatterns.emojis.length)
      ];
      message = `${message} ${emoji}`;
    }

    return message;
  }

  /**
   * Get a casual greeting based on learned style
   */
  getCasualGreeting() {
    const greetings = [
      'yo', 'hey', 'sup', 'what\'s good', 'wassup', 'heyo', 
      'hey chat', 'yo chat', 'what\'s up', 'howdy'
    ];

    // Add learned slang to greetings
    if (this.stylePatterns.slang.has('bruh')) greetings.push('bruh');
    if (this.stylePatterns.slang.has('yea')) greetings.push('yea what\'s up');

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    return {
      mostUsedSlang: Array.from(this.stylePatterns.slang.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(s => s[0]),
      preferredStyle: this.getPreferredStyle(),
      casualnessLevel: this.getCasualnessLevel()
    };
  }

  getPreferredStyle() {
    const totalCap = this.stylePatterns.capitalization.lowercase + 
                    this.stylePatterns.capitalization.normal;
    if (totalCap === 0) return 'normal';
    
    const lowercaseRatio = this.stylePatterns.capitalization.lowercase / totalCap;
    return lowercaseRatio > 0.6 ? 'lowercase' : 'normal';
  }

  getCasualnessLevel() {
    const totalSlang = Array.from(this.stylePatterns.slang.values())
      .reduce((a, b) => a + b, 0);
    const totalAbbrev = Array.from(this.stylePatterns.abbreviations.values())
      .reduce((a, b) => a + b, 0);
    
    const totalMessages = this.chatBot.chatStats.totalMessages || 1;
    const casualScore = (totalSlang + totalAbbrev) / totalMessages;
    
    if (casualScore > 0.5) return 'very casual';
    if (casualScore > 0.3) return 'casual';
    if (casualScore > 0.1) return 'somewhat casual';
    return 'formal';
  }
}

module.exports = StyleMimicry;
