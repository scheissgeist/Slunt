/**
 * Here's U Mode
 * Childish mockery when someone bothers Slunt
 * Repeats things back annoyingly with alternating caps
 */

class HeresUMode {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Track annoying users
    this.annoyanceScores = new Map(); // username -> score
    this.lastMockery = new Map(); // username -> timestamp
    
    // Mockery cooldown per user (don't spam the same person)
    this.mockCooldown = 5 * 60 * 1000; // 5 minutes
    
    // Annoyance triggers
    this.annoyingBehaviors = {
      repeating: 3,        // Repeating similar messages
      spamming: 2,         // Multiple messages in short time
      allCaps: 2,          // Using all caps
      mentionSpam: 4,      // Mentioning Slunt repeatedly
      questioning: 1,      // Asking too many questions
      demanding: 3         // Demanding/commanding tone
    };
    
    // Track recent messages per user
    this.recentMessages = new Map(); // username -> [messages]
    
    // Mockery prefixes
    this.mockPrefixes = [
      "here's you buddy",
      "here's u",
      "this is what you sound like",
      "this is u rite now",
      "heres literally you",
      "this u rn",
      "literally u:",
      "you sound like this",
      "here's what u sound like buddy"
    ];
    
    // Stats
    this.stats = {
      totalMockeries: 0,
      usersRoasted: new Set()
    };
  }

  /**
   * Track user message and calculate annoyance
   */
  trackMessage(username, text) {
    // Initialize tracking
    if (!this.recentMessages.has(username)) {
      this.recentMessages.set(username, []);
    }
    if (!this.annoyanceScores.has(username)) {
      this.annoyanceScores.set(username, 0);
    }

    const messages = this.recentMessages.get(username);
    let annoyanceScore = this.annoyanceScores.get(username);
    
    // Add message to recent history
    messages.push({
      text: text.toLowerCase(),
      time: Date.now()
    });
    
    // Keep only last 10 messages from this user
    if (messages.length > 10) {
      messages.shift();
    }
    
    // Check for annoying behaviors
    
    // 1. REPEATING - saying similar things
    if (messages.length >= 3) {
      const last3 = messages.slice(-3);
      const similarities = this.checkSimilarity(last3);
      if (similarities >= 2) {
        annoyanceScore += this.annoyingBehaviors.repeating;
        console.log(`😤 [HeresU] ${username} is repeating themselves (+${this.annoyingBehaviors.repeating})`);
      }
    }
    
    // 2. SPAMMING - multiple messages quickly
    const recentCount = messages.filter(m => Date.now() - m.time < 30000).length;
    if (recentCount >= 4) {
      annoyanceScore += this.annoyingBehaviors.spamming;
      console.log(`😤 [HeresU] ${username} is spamming (+${this.annoyingBehaviors.spamming})`);
    }
    
    // 3. ALL CAPS
    if (text === text.toUpperCase() && text.length > 5 && /[A-Z]/.test(text)) {
      annoyanceScore += this.annoyingBehaviors.allCaps;
      console.log(`😤 [HeresU] ${username} is using ALL CAPS (+${this.annoyingBehaviors.allCaps})`);
    }
    
    // 4. MENTION SPAM
    if (text.toLowerCase().includes('slunt')) {
      const mentionCount = messages.filter(m => 
        Date.now() - m.time < 60000 && m.text.includes('slunt')
      ).length;
      if (mentionCount >= 3) {
        annoyanceScore += this.annoyingBehaviors.mentionSpam;
        console.log(`😤 [HeresU] ${username} keeps mentioning Slunt (+${this.annoyingBehaviors.mentionSpam})`);
      }
    }
    
    // 5. QUESTIONING
    if (text.includes('?')) {
      const questionCount = messages.filter(m => 
        Date.now() - m.time < 120000 && m.text.includes('?')
      ).length;
      if (questionCount >= 4) {
        annoyanceScore += this.annoyingBehaviors.questioning;
        console.log(`😤 [HeresU] ${username} asks too many questions (+${this.annoyingBehaviors.questioning})`);
      }
    }
    
    // 6. DEMANDING TONE
    const demandingWords = ['tell me', 'show me', 'do this', 'say ', 'you should', 'you need to', 'answer', 'explain'];
    if (demandingWords.some(word => text.toLowerCase().includes(word))) {
      annoyanceScore += this.annoyingBehaviors.demanding;
      console.log(`😤 [HeresU] ${username} is being demanding (+${this.annoyingBehaviors.demanding})`);
    }
    
    // Update score
    this.annoyanceScores.set(username, annoyanceScore);
    
    // Decay annoyance over time (reduce by 1 every minute)
    setTimeout(() => {
      const currentScore = this.annoyanceScores.get(username) || 0;
      if (currentScore > 0) {
        this.annoyanceScores.set(username, Math.max(0, currentScore - 1));
      }
    }, 60000);
    
    return annoyanceScore;
  }

  /**
   * Check similarity between messages
   */
  checkSimilarity(messages) {
    let similarities = 0;
    for (let i = 0; i < messages.length - 1; i++) {
      for (let j = i + 1; j < messages.length; j++) {
        const text1 = messages[i].text;
        const text2 = messages[j].text;
        
        // Check if messages are very similar (Levenshtein distance or simple word overlap)
        const words1 = new Set(text1.split(/\s+/));
        const words2 = new Set(text2.split(/\s+/));
        const overlap = [...words1].filter(w => words2.has(w)).length;
        
        if (overlap >= Math.min(words1.size, words2.size) * 0.6) {
          similarities++;
        }
      }
    }
    return similarities;
  }

  /**
   * Should trigger mockery?
   */
  shouldMock(username) {
    const score = this.annoyanceScores.get(username) || 0;
    const lastMock = this.lastMockery.get(username) || 0;
    
    // Need high annoyance score
    if (score < 8) return false;
    
    // Check cooldown
    if (Date.now() - lastMock < this.mockCooldown) {
      return false;
    }
    
    // 60% chance when annoyed enough
    return Math.random() < 0.6;
  }

  /**
   * Generate mockery message
   */
  generateMockery(username, originalText) {
    // Record mockery
    this.lastMockery.set(username, Date.now());
    this.stats.totalMockeries++;
    this.stats.usersRoasted.add(username);
    
    // Reset their annoyance score after mocking
    this.annoyanceScores.set(username, 0);
    
    // Get random prefix
    const prefix = this.mockPrefixes[Math.floor(Math.random() * this.mockPrefixes.length)];
    
    // Convert text to alternating caps (sPoNgEbOb MoCkInG)
    const mockedText = this.toAlternatingCaps(originalText);
    
    console.log(`🤡 [HeresU] Mocking ${username}!`);
    console.log(`🤡 [HeresU] Original: "${originalText}"`);
    console.log(`🤡 [HeresU] Mocked: "${mockedText}"`);
    
    return `${prefix}: "${mockedText}"`;
  }

  /**
   * Convert text to alternating caps
   */
  toAlternatingCaps(text) {
    let result = '';
    let shouldBeUpper = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Only alternate letters, keep spaces/punctuation as-is
      if (/[a-zA-Z]/.test(char)) {
        result += shouldBeUpper ? char.toUpperCase() : char.toLowerCase();
        shouldBeUpper = !shouldBeUpper;
      } else {
        result += char;
      }
    }
    
    return result;
  }

  /**
   * Get context for AI
   */
  getContext(username) {
    const score = this.annoyanceScores.get(username) || 0;
    
    if (score < 5) return '';
    
    return `\n🤡 Annoyance level with ${username}: ${score}/10
- Getting annoyed with this user
- They're being repetitive/spammy/demanding
- Consider being more dismissive or sarcastic`;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalMockeries: this.stats.totalMockeries,
      usersRoasted: this.stats.usersRoasted.size,
      currentlyAnnoyed: Array.from(this.annoyanceScores.entries())
        .filter(([_, score]) => score > 5)
        .map(([user, score]) => ({ user, score }))
    };
  }
}

module.exports = HeresUMode;
