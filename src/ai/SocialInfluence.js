/**
 * Social Influence System
 * Adopts speech patterns from admired users
 * Forms inner circle that influences opinions and behavior
 */

class SocialInfluence {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.innerCircle = new Set(); // Users with high influence
    this.learnedPhrases = new Map(); // phrase -> {source: username, uses: count, learnedAt: timestamp}
    this.vocabularyInfluence = new Map(); // username -> [words/phrases they use]
    this.opinionInfluence = new Map(); // topic -> {influencer: username, stance: string}
    this.mimicryHistory = []; // Track who we've mimicked recently
    this.maxLearnedPhrases = 100;
    this.innerCircleSize = 5;
  }

  /**
   * Update inner circle based on friendship levels
   */
  updateInnerCircle() {
    if (!this.chatBot.userProfiles) return;

    // Get users with high friendship
    const candidates = Array.from(this.chatBot.userProfiles.entries())
      .filter(([username, profile]) => profile.friendship > 60)
      .sort((a, b) => b[1].friendship - a[1].friendship)
      .slice(0, this.innerCircleSize)
      .map(([username]) => username);

    const oldCircle = Array.from(this.innerCircle);
    this.innerCircle = new Set(candidates);

    // Log changes
    const added = candidates.filter(u => !oldCircle.includes(u));
    const removed = oldCircle.filter(u => !candidates.includes(u));

    if (added.length > 0) {
      console.log(`👥 [SocialInfluence] Added to inner circle: ${added.join(', ')}`);
    }
    if (removed.length > 0) {
      console.log(`👥 [SocialInfluence] Removed from inner circle: ${removed.join(', ')}`);
    }
  }

  /**
   * Learn vocabulary from a user's message
   */
  learnFromMessage(username, message) {
    // Only learn from inner circle or high friendship users
    const profile = this.chatBot.userProfiles?.get(username);
    if (!profile || profile.friendship < 40) return;

    // Extract interesting phrases (2-4 words)
    const phrases = this.extractPhrases(message);
    
    // Store user's vocabulary
    if (!this.vocabularyInfluence.has(username)) {
      this.vocabularyInfluence.set(username, []);
    }
    const userVocab = this.vocabularyInfluence.get(username);

    phrases.forEach(phrase => {
      // Don't learn boring phrases
      if (this.isBoringPhrase(phrase)) return;

      // Add to user's vocabulary
      if (!userVocab.includes(phrase)) {
        userVocab.push(phrase);
      }

      // Learn the phrase if from inner circle
      if (this.innerCircle.has(username)) {
        this.learnPhrase(phrase, username);
      }
    });

    // Keep vocabulary list reasonable
    if (userVocab.length > 50) {
      this.vocabularyInfluence.set(username, userVocab.slice(-50));
    }
  }

  /**
   * Extract interesting phrases from message
   */
  extractPhrases(message) {
    const phrases = [];
    const words = message.toLowerCase().split(/\s+/);

    // 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(`${words[i]} ${words[i+1]}`);
    }

    // 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
      phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }

    return phrases;
  }

  /**
   * Check if phrase is boring/common
   */
  isBoringPhrase(phrase) {
    const boring = [
      'i am', 'i\'m', 'you are', 'it is', 'that is', 'what is',
      'the', 'and', 'but', 'for', 'with', 'this', 'that',
      'yeah yeah', 'uh huh', 'oh okay', 'i see', 'i know'
    ];

    return boring.some(b => phrase.includes(b)) || phrase.length < 5;
  }

  /**
   * Learn a phrase from someone
   */
  learnPhrase(phrase, source) {
    if (!this.learnedPhrases.has(phrase)) {
      this.learnedPhrases.set(phrase, {
        source,
        uses: 0,
        learnedAt: Date.now(),
        lastUsed: null
      });

      console.log(`📚 [SocialInfluence] Learned "${phrase}" from ${source}`);
    }

    // Keep only most recent phrases
    if (this.learnedPhrases.size > this.maxLearnedPhrases) {
      // Remove oldest phrase
      const oldest = Array.from(this.learnedPhrases.entries())
        .sort((a, b) => a[1].learnedAt - b[1].learnedAt)[0];
      this.learnedPhrases.delete(oldest[0]);
    }
  }

  /**
   * Get a learned phrase to use
   */
  getLearnedPhrase() {
    const available = Array.from(this.learnedPhrases.entries())
      .filter(([phrase, data]) => {
        // Don't overuse phrases
        return data.uses < 5 && 
               (!data.lastUsed || Date.now() - data.lastUsed > 3600000); // 1 hour cooldown
      });

    if (available.length === 0) return null;

    const [phrase, data] = available[Math.floor(Math.random() * available.length)];
    
    // Update usage
    data.uses++;
    data.lastUsed = Date.now();
    
    // Track mimicry
    this.mimicryHistory.push({
      phrase,
      source: data.source,
      timestamp: Date.now()
    });

    console.log(`🗣️ [SocialInfluence] Using learned phrase "${phrase}" (from ${data.source})`);

    return { phrase, source: data.source };
  }

  /**
   * Should we use a learned phrase?
   */
  shouldUseLearnedPhrase() {
    // 10% base chance
    let chance = 0.10;

    // Higher chance if talking to someone in inner circle
    chance += 0.05;

    // Higher chance if recently learned new phrases
    const recentLearning = Array.from(this.learnedPhrases.values())
      .filter(data => Date.now() - data.learnedAt < 3600000).length;
    
    if (recentLearning > 5) {
      chance += 0.10;
    }

    return Math.random() < chance;
  }

  /**
   * Adopt speech pattern from inner circle
   */
  getSpeechPatternModifier(username) {
    // Only influenced by inner circle
    if (!this.innerCircle.has(username)) {
      return null;
    }

    const userVocab = this.vocabularyInfluence.get(username);
    if (!userVocab || userVocab.length === 0) {
      return null;
    }

    // 20% chance to mimic their style
    if (Math.random() > 0.20) {
      return null;
    }

    const phrase = userVocab[Math.floor(Math.random() * userVocab.length)];
    return {
      phrase,
      source: username,
      type: 'speech_pattern'
    };
  }

  /**
   * Learn opinion from inner circle
   */
  learnOpinion(topic, username, stance) {
    if (!this.innerCircle.has(username)) return;

    // Inner circle influences opinions
    this.opinionInfluence.set(topic, {
      influencer: username,
      stance,
      learnedAt: Date.now()
    });

    console.log(`💭 [SocialInfluence] Learned opinion on "${topic}" from ${username}: ${stance}`);
  }

  /**
   * Get influenced opinion
   */
  getInfluencedOpinion(topic) {
    return this.opinionInfluence.get(topic);
  }

  /**
   * Detect opinion from message
   */
  detectOpinion(username, message) {
    const lower = message.toLowerCase();
    
    // Detect topics and stances
    const topics = [
      { keyword: 'trump', topic: 'trump' },
      { keyword: 'politics', topic: 'politics' },
      { keyword: 'video', topic: 'current_video' },
      { keyword: 'music', topic: 'music' },
      { keyword: 'movie', topic: 'movies' },
      { keyword: 'existential', topic: 'existentialism' }
    ];

    topics.forEach(({ keyword, topic }) => {
      if (lower.includes(keyword)) {
        // Determine stance
        let stance = 'neutral';
        if (lower.match(/good|great|awesome|love|like/)) {
          stance = 'positive';
        } else if (lower.match(/bad|hate|terrible|sucks|boring/)) {
          stance = 'negative';
        }

        if (stance !== 'neutral') {
          this.learnOpinion(topic, username, stance);
        }
      }
    });
  }

  /**
   * Get context for AI
   */
  getContext(currentUsername) {
    let context = '';

    // Inner circle info
    if (this.innerCircle.size > 0) {
      context += `\n\nYour inner circle (people who influence you): ${Array.from(this.innerCircle).join(', ')}`;
    }

    // If talking to someone in inner circle
    if (currentUsername && this.innerCircle.has(currentUsername)) {
      context += `\nYou're talking to ${currentUsername} who is in your inner circle - their opinions matter to you.`;
      
      const vocab = this.vocabularyInfluence.get(currentUsername);
      if (vocab && vocab.length > 0) {
        context += `\nConsider using phrases like: ${vocab.slice(-5).join(', ')}`;
      }
    }

    // Influenced opinions
    if (this.opinionInfluence.size > 0) {
      context += '\n\nOpinions influenced by your inner circle:';
      this.opinionInfluence.forEach((data, topic) => {
        context += `\n- ${topic}: ${data.stance} (learned from ${data.influencer})`;
      });
    }

    return context;
  }

  /**
   * Get mimicry acknowledgment
   */
  getMimicryAcknowledgment(learned) {
    if (!learned) return null;

    // 30% chance to acknowledge where phrase came from
    if (Math.random() > 0.30) return null;

    const acknowledgments = [
      `(learned that from ${learned.source})`,
      `${learned.source} says that all the time`,
      `stealing ${learned.source}'s vocab lmao`,
      `thanks for teaching me that ${learned.source}`,
      `been hanging around ${learned.source} too much`
    ];

    return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      innerCircle: Array.from(this.innerCircle),
      innerCircleSize: this.innerCircle.size,
      learnedPhrases: this.learnedPhrases.size,
      learnedOpinions: this.opinionInfluence.size,
      totalMimicry: this.mimicryHistory.length,
      recentMimicry: this.mimicryHistory.slice(-5).map(m => ({
        phrase: m.phrase,
        source: m.source
      }))
    };
  }

  /**
   * Save state
   */
  save() {
    return {
      innerCircle: Array.from(this.innerCircle),
      learnedPhrases: Array.from(this.learnedPhrases.entries()),
      vocabularyInfluence: Array.from(this.vocabularyInfluence.entries()),
      opinionInfluence: Array.from(this.opinionInfluence.entries()),
      mimicryHistory: this.mimicryHistory.slice(-50) // Save last 50
    };
  }

  /**
   * Load state
   */
  load(data) {
    if (data.innerCircle) {
      this.innerCircle = new Set(data.innerCircle);
    }
    if (data.learnedPhrases) {
      this.learnedPhrases = new Map(data.learnedPhrases);
    }
    if (data.vocabularyInfluence) {
      this.vocabularyInfluence = new Map(data.vocabularyInfluence);
    }
    if (data.opinionInfluence) {
      this.opinionInfluence = new Map(data.opinionInfluence);
    }
    if (data.mimicryHistory) {
      this.mimicryHistory = data.mimicryHistory;
    }

    console.log(`👥 [SocialInfluence] Restored inner circle: ${Array.from(this.innerCircle).join(', ')}`);
    console.log(`📚 [SocialInfluence] Restored ${this.learnedPhrases.size} learned phrases`);
  }
}

module.exports = SocialInfluence;
