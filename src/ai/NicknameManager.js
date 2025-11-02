/**
 * Nickname Manager
 * Tracks user nicknames and inside jokes
 */

class NicknameManager {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.nicknames = new Map(); // username -> nickname
    this.insideJokes = new Map(); // jokeKey -> {text, count, users, lastUsed}
    this.userBehaviors = new Map(); // username -> {traits, patterns}
  }

  /**
   * Learn about user behavior patterns
   */
  trackUserBehavior(username, message) {
    if (!this.userBehaviors.has(username)) {
      this.userBehaviors.set(username, {
        traits: [],
        messageCount: 0,
        capsCount: 0,
        swearCount: 0,
        questionCount: 0,
        laughCount: 0,
        firstSeen: Date.now()
      });
    }

    const behavior = this.userBehaviors.get(username);
    behavior.messageCount++;

    // Track patterns
    if (message === message.toUpperCase() && message.length > 5) {
      behavior.capsCount++;
      if (behavior.capsCount > 5 && !behavior.traits.includes('loud')) {
        behavior.traits.push('loud');
      }
    }

    if (message.match(/\b(fuck|shit|damn|hell|ass)\b/i)) {
      behavior.swearCount++;
      if (behavior.swearCount > 10 && !behavior.traits.includes('potty_mouth')) {
        behavior.traits.push('potty_mouth');
      }
    }

    if (message.includes('?')) {
      behavior.questionCount++;
      if (behavior.questionCount > 15 && !behavior.traits.includes('curious')) {
        behavior.traits.push('curious');
      }
    }

    if (message.match(/\b(lol|lmao|haha|lmfao|rofl)\b/i)) {
      behavior.laughCount++;
      if (behavior.laughCount > 20 && !behavior.traits.includes('laugher')) {
        behavior.traits.push('laugher');
      }
    }

    // Generate nickname after enough data
    if (behavior.messageCount > 30 && !this.nicknames.has(username)) {
      this.generateNickname(username);
    }
  }

  /**
   * Generate a nickname based on user behavior
   */
  generateNickname(username) {
    const behavior = this.userBehaviors.get(username);
    if (!behavior || behavior.traits.length === 0) return;

    const nicknames = {
      loud: ['Caps Lock', 'Yell Master', 'All Caps', 'Shouty'],
      potty_mouth: ['Sailor', 'Foul Mouth', 'Cursing King', 'Potty Mouth'],
      curious: ['Question Mark', 'Curious George', 'Quiz Master', 'Asker'],
      laugher: ['Giggles', 'Laugh Track', 'Haha Guy', 'Chuckles']
    };

    // Pick nickname based on dominant trait
    const dominantTrait = behavior.traits[0];
    const options = nicknames[dominantTrait];
    if (options) {
      const nickname = options[Math.floor(Math.random() * options.length)];
      this.nicknames.set(username, {
        nickname,
        reason: dominantTrait,
        createdAt: Date.now()
      });
      console.log(`🏷️ [Nickname] Generated for ${username}: ${nickname} (${dominantTrait})`);
    }
  }

  /**
   * Get nickname for user
   */
  getNickname(username) {
    const data = this.nicknames.get(username);
    return data ? data.nickname : null;
  }

  /**
   * Track potential inside joke
   */
  trackJoke(message, username) {
    // Look for repeated phrases (3+ words, appears multiple times)
    const phrases = this.extractPhrases(message);
    
    phrases.forEach(phrase => {
      if (!this.insideJokes.has(phrase)) {
        this.insideJokes.set(phrase, {
          text: phrase,
          count: 1,
          users: new Set([username]),
          firstUsed: Date.now(),
          lastUsed: Date.now()
        });
      } else {
        const joke = this.insideJokes.get(phrase);
        joke.count++;
        joke.users.add(username);
        joke.lastUsed = Date.now();
        
        // If used by multiple people, it's an inside joke
        if (joke.users.size >= 3 && joke.count >= 5) {
          console.log(`🤣 [Inside Joke] Detected: "${phrase}" (${joke.count} times, ${joke.users.size} users)`);
        }
      }
    });
  }

  /**
   * Extract potential phrases from message
   */
  extractPhrases(message) {
    const words = message.toLowerCase().split(/\s+/);
    const phrases = [];
    
    // Extract 3-5 word phrases
    for (let len = 3; len <= 5; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (phrase.length > 10 && phrase.length < 50) {
          phrases.push(phrase);
        }
      }
    }
    
    return phrases;
  }

  /**
   * Get random inside joke
   */
  getRandomInsideJoke() {
    const jokes = Array.from(this.insideJokes.values())
      .filter(j => j.users.size >= 2 && j.count >= 4)
      .sort((a, b) => b.count - a.count);
    
    if (jokes.length === 0) return null;
    return jokes[Math.floor(Math.random() * Math.min(jokes.length, 5))].text;
  }

  /**
   * Get nickname context for AI
   */
  getNicknameContext() {
    if (this.nicknames.size === 0) return '';
    
    const recentNicknames = Array.from(this.nicknames.entries())
      .slice(-5)
      .map(([user, data]) => `${user} (${data.nickname})`)
      .join(', ');
    
    return `\nNicknames: ${recentNicknames}`;
  }

  /**
   * Get inside joke context for AI
   */
  getInsideJokeContext() {
    const topJokes = Array.from(this.insideJokes.values())
      .filter(j => j.users.size >= 2 && j.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    if (topJokes.length === 0) return '';
    
    const jokes = topJokes.map(j => j.text).join(', ');
    return `\nInside jokes: ${jokes}`;
  }

  /**
   * Should use nickname in response?
   */
  shouldUseNickname(username) {
    if (!this.nicknames.has(username)) return false;
    // Use nicknames 30% of the time
    return Math.random() < 0.3;
  }

  /**
   * Should reference inside joke?
   */
  shouldReferenceJoke() {
    if (this.insideJokes.size === 0) return false;
    // Reference jokes 15% of the time
    return Math.random() < 0.15;
  }

  /**
   * Get rare pet name (extremely rare - ~1% chance)
   */
  getRarePetName() {
    // Only 1% chance to use pet names
    if (Math.random() > 0.01) return null;
    
    const petNames = [
      'my pet',
      'kitten',
      'piss puppy'
    ];
    
    return petNames[Math.floor(Math.random() * petNames.length)];
  }

  /**
   * Apply pet name to username (very rarely)
   */
  applyPetName(username) {
    const petName = this.getRarePetName();
    if (petName) {
      console.log(`💕 [PetName] Slunt called ${username} "${petName}"`);
      return petName;
    }
    return username;
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    const activeNicknames = this.nicknames.size;
    const insideJokes = Array.from(this.insideJokes.values())
      .filter(j => j.users.size >= 2 && j.count >= 3)
      .length;
    
    return {
      activeNicknames,
      insideJokes,
      trackedUsers: this.userBehaviors.size
    };
  }
}

module.exports = NicknameManager;
