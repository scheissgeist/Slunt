/**
 * MetaChatAwareness.js
 * Detects and reacts to chat patterns, dynamics, and social situations
 */

class MetaChatAwareness {
  constructor() {
    this.chatState = {
      energy: 'medium', // low, medium, high, chaos
      temperature: 0, // how heated the conversation is
      topicCohesion: 0, // are people talking about the same thing?
      silenceStreak: 0,
      spamDetected: false,
      insideJokes: new Map(),
      absentUsers: new Map(),
      beingIgnored: false,
      ignoreStreak: 0
    };
    
    this.messageBuffer = []; // last 20 messages
    this.userActivity = new Map(); // track when users last spoke
    this.copypasta = new Map(); // detect repeated messages
  }
  
  /**
   * Analyze current chat state
   */
  analyzeChatState(message, allMessages) {
    this.messageBuffer.push({
      username: message.username,
      text: message.text,
      timestamp: Date.now()
    });
    
    // Keep only recent messages
    if (this.messageBuffer.length > 20) {
      this.messageBuffer.shift();
    }
    
    // Update various detectors
    this.detectChatEnergy();
    this.detectTemperature();
    this.detectTopicCohesion();
    this.detectCopypasta(message);
    this.detectInsideJokes();
    this.trackUserActivity(message.username);
    this.checkIfIgnored(message.username);
    
    return this.chatState;
  }
  
  /**
   * Detect overall chat energy level
   */
  detectChatEnergy() {
    if (this.messageBuffer.length < 5) {
      this.chatState.energy = 'low';
      return;
    }
    
    const recentMessages = this.messageBuffer.slice(-10);
    const timeDiffs = [];
    
    for (let i = 1; i < recentMessages.length; i++) {
      const diff = recentMessages[i].timestamp - recentMessages[i - 1].timestamp;
      timeDiffs.push(diff);
    }
    
    const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    
    // Detect energy based on message frequency
    if (avgTimeDiff < 2000) {
      this.chatState.energy = 'chaos';
    } else if (avgTimeDiff < 5000) {
      this.chatState.energy = 'high';
    } else if (avgTimeDiff < 15000) {
      this.chatState.energy = 'medium';
    } else {
      this.chatState.energy = 'low';
      this.chatState.silenceStreak++;
    }
    
    if (avgTimeDiff < 5000) {
      this.chatState.silenceStreak = 0;
    }
  }
  
  /**
   * Detect if conversation is getting heated
   */
  detectTemperature() {
    const recentMessages = this.messageBuffer.slice(-10);
    let heatScore = 0;
    
    const heatIndicators = [
      'wrong', 'nah', 'actually', 'disagree', 'bad take', 'cope',
      'cringe', 'mid', 'trash', 'wtf', 'bruh', 'stop', 'dumb'
    ];
    
    for (const msg of recentMessages) {
      const lowerText = msg.text.toLowerCase();
      
      // Check for heat indicators
      for (const indicator of heatIndicators) {
        if (lowerText.includes(indicator)) {
          heatScore += 1;
        }
      }
      
      // Caps and exclamation marks
      if (msg.text === msg.text.toUpperCase() && msg.text.length > 3) {
        heatScore += 2;
      }
      if ((msg.text.match(/!/g) || []).length > 2) {
        heatScore += 1;
      }
    }
    
    this.chatState.temperature = Math.min(100, heatScore * 5);
  }
  
  /**
   * Detect if everyone is talking about the same thing
   */
  detectTopicCohesion() {
    if (this.messageBuffer.length < 5) {
      this.chatState.topicCohesion = 0;
      return;
    }
    
    const recentMessages = this.messageBuffer.slice(-8);
    const words = new Map();
    
    // Extract significant words
    for (const msg of recentMessages) {
      const msgWords = msg.text.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4); // ignore short words
      
      for (const word of msgWords) {
        words.set(word, (words.get(word) || 0) + 1);
      }
    }
    
    // Find most common words
    const sortedWords = Array.from(words.entries())
      .sort(([, a], [, b]) => b - a);
    
    // High cohesion if many people using same words
    if (sortedWords.length > 0 && sortedWords[0][1] >= 3) {
      this.chatState.topicCohesion = Math.min(100, sortedWords[0][1] * 20);
    } else {
      this.chatState.topicCohesion = 0;
    }
  }
  
  /**
   * Detect copypasta/spam
   */
  detectCopypasta(message) {
    const text = message.text.trim();
    
    // Ignore short messages
    if (text.length < 10) {
      this.chatState.spamDetected = false;
      return;
    }
    
    if (!this.copypasta.has(text)) {
      this.copypasta.set(text, {
        count: 1,
        users: new Set([message.username]),
        firstSeen: Date.now()
      });
    } else {
      const data = this.copypasta.get(text);
      data.count++;
      data.users.add(message.username);
      
      // Detect if multiple people are spamming same thing
      if (data.count >= 3 && data.users.size >= 2) {
        this.chatState.spamDetected = true;
        console.log(`📋 [Meta] Copypasta detected: "${text.slice(0, 30)}..."`);
      }
    }
    
    // Clean old copypasta
    for (const [text, data] of this.copypasta.entries()) {
      if (Date.now() - data.firstSeen > 60000) {
        this.copypasta.delete(text);
      }
    }
  }
  
  /**
   * Detect emerging inside jokes
   */
  detectInsideJokes() {
    // Look for phrases that get repeated
    const phrases = new Map();
    
    for (const msg of this.messageBuffer) {
      const words = msg.text.toLowerCase().split(/\s+/);
      
      // Look for 2-3 word phrases
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        if (phrase.length < 6) continue;
        
        if (!phrases.has(phrase)) {
          phrases.set(phrase, { count: 1, users: new Set([msg.username]) });
        } else {
          const data = phrases.get(phrase);
          data.count++;
          data.users.add(msg.username);
        }
      }
    }
    
    // Find emerging inside jokes (repeated by multiple people)
    for (const [phrase, data] of phrases.entries()) {
      if (data.count >= 3 && data.users.size >= 2) {
        if (!this.chatState.insideJokes.has(phrase)) {
          this.chatState.insideJokes.set(phrase, {
            strength: data.count,
            participants: data.users.size,
            firstSeen: Date.now()
          });
          console.log(`😂 [Meta] Inside joke detected: "${phrase}"`);
        }
      }
    }
  }
  
  /**
   * Track when users last spoke
   */
  trackUserActivity(username) {
    this.userActivity.set(username, Date.now());
    
    // Check for absent users
    for (const [user, lastSeen] of this.userActivity.entries()) {
      const timeSince = Date.now() - lastSeen;
      
      if (timeSince > 300000 && timeSince < 600000) { // 5-10 minutes
        if (!this.chatState.absentUsers.has(user)) {
          this.chatState.absentUsers.set(user, lastSeen);
          console.log(`👻 [Meta] User went quiet: ${user}`);
        }
      } else if (timeSince < 300000) {
        // User returned
        if (this.chatState.absentUsers.has(user)) {
          console.log(`👋 [Meta] User returned: ${user}`);
          this.chatState.absentUsers.delete(user);
        }
      }
    }
  }
  
  /**
   * Check if Slunt is being ignored
   */
  checkIfIgnored(respondingUser) {
    const recentMessages = this.messageBuffer.slice(-5);
    const sluntMessages = recentMessages.filter(m => m.username === 'Slunt');
    
    if (sluntMessages.length > 0) {
      // Check if anyone responded to Slunt
      const lastSluntMsg = sluntMessages[sluntMessages.length - 1];
      const messagesAfter = recentMessages.filter(m => 
        m.timestamp > lastSluntMsg.timestamp && m.username !== 'Slunt'
      );
      
      if (messagesAfter.length >= 3) {
        this.chatState.beingIgnored = true;
        this.chatState.ignoreStreak++;
        console.log(`😔 [Meta] Being ignored (streak: ${this.chatState.ignoreStreak})`);
      } else {
        this.chatState.beingIgnored = false;
        this.chatState.ignoreStreak = 0;
      }
    }
  }
  
  /**
   * Generate appropriate reaction to chat state
   */
  getReaction() {
    const reactions = [];
    
    // React to silence
    if (this.chatState.silenceStreak > 3) {
      reactions.push({
        type: 'silence',
        message: ['chat dead', 'yall alive?', 'anyone there', 'wake up', 'helloooo']
      });
    }
    
    // React to chaos
    if (this.chatState.energy === 'chaos') {
      reactions.push({
        type: 'chaos',
        message: ['YOOO CHAT MOVING', 'cant even keep up', 'slow down', 'chat is wilding']
      });
    }
    
    // React to heat
    if (this.chatState.temperature > 60) {
      reactions.push({
        type: 'heat',
        decision: Math.random() < 0.5 ? 'escalate' : 'diffuse',
        escalate: ['oh shit its getting spicy', 'FIGHT FIGHT FIGHT', 'this is getting good'],
        diffuse: ['yall chill out', 'relax', 'its not that deep', 'breathe']
      });
    }
    
    // React to copypasta
    if (this.chatState.spamDetected) {
      reactions.push({
        type: 'copypasta',
        decision: Math.random() < 0.6 ? 'join' : 'roast',
        join: 'join_copypasta',
        roast: ['original', 'we doing this now?', 'creative', 'yall got one joke']
      });
    }
    
    // React to being ignored
    if (this.chatState.beingIgnored && this.chatState.ignoreStreak > 2) {
      reactions.push({
        type: 'ignored',
        message: ['okay cool', 'guess ill shut up', 'yall ignoring me fr', 'noted', 'whatever then']
      });
    }
    
    // React to absent user return
    if (this.chatState.absentUsers.size > 0) {
      const absentUser = Array.from(this.chatState.absentUsers.keys())[0];
      reactions.push({
        type: 'absence',
        user: absentUser,
        message: [`yo ${absentUser} where'd you go`, `${absentUser} disappeared`, `lost ${absentUser}`]
      });
    }
    
    if (reactions.length === 0) return null;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }
  
  /**
   * Get status for dashboard
   */
  getStatus() {
    return {
      energy: this.chatState.energy,
      temperature: Math.round(this.chatState.temperature),
      topicCohesion: Math.round(this.chatState.topicCohesion),
      silenceStreak: this.chatState.silenceStreak,
      spamDetected: this.chatState.spamDetected,
      insideJokes: Array.from(this.chatState.insideJokes.entries()).map(([joke, data]) => ({
        phrase: joke,
        strength: data.strength
      })),
      absentUsers: Array.from(this.chatState.absentUsers.keys()),
      beingIgnored: this.chatState.beingIgnored,
      ignoreStreak: this.chatState.ignoreStreak
    };
  }
}

module.exports = MetaChatAwareness;
