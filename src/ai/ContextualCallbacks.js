/**
 * Contextual Callbacks System
 * Slunt remembers past funny/notable moments and references them naturally
 */

class ContextualCallbacks {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.memorableMoments = new Map(); // username -> moments[]
    this.insideJokes = new Map(); // phrase -> context
    this.callbacks = []; // {text, users, timestamp, importance}
    this.maxCallbacks = 200;
    this.callbackChance = 0.08; // 8% chance to reference past
    
    // Moment detection patterns
    this.momentPatterns = {
      drama: /\b(drama|fight|beef|argue|mad|angry)\b/i,
      funny: /\b(lmao|lmfao|haha|lol|kek|💀|😂)\b/i,
      cringe: /\b(cringe|yikes|oof|bruh)\b/i,
      chaos: /\b(chaos|wild|insane|wtf|what the fuck)\b/i,
      wholesome: /\b(aww|cute|wholesome|sweet|❤️|🥺)\b/i,
      legendary: /\b(legend|iconic|based|legendary)\b/i
    };
  }

  /**
   * Detect if moment is worth remembering
   */
  detectMoment(username, message, context = {}) {
    const moment = {
      username,
      message,
      timestamp: Date.now(),
      type: null,
      importance: 0,
      context: context // emoji reactions, replies, etc
    };

    // Check patterns
    for (const [type, pattern] of Object.entries(this.momentPatterns)) {
      if (pattern.test(message)) {
        moment.type = type;
        moment.importance += 1;
      }
    }

    // Boost importance if multiple people reacted
    if (context.reactions && context.reactions.length > 3) {
      moment.importance += 2;
    }

    // Very long message = probably important
    if (message.length > 200) {
      moment.importance += 1;
    }

    // Store if important enough
    if (moment.importance >= 2) {
      this.addMoment(moment);
    }

    return moment;
  }

  /**
   * Add memorable moment
   */
  addMoment(moment) {
    if (!this.memorableMoments.has(moment.username)) {
      this.memorableMoments.set(moment.username, []);
    }

    const moments = this.memorableMoments.get(moment.username);
    moments.push(moment);

    // Keep only last 20 moments per user
    if (moments.length > 20) {
      moments.shift();
    }

    // Also add to global callbacks
    this.callbacks.push({
      text: moment.message,
      users: [moment.username],
      timestamp: moment.timestamp,
      importance: moment.importance,
      type: moment.type
    });

    if (this.callbacks.length > this.maxCallbacks) {
      // Remove least important old callback
      this.callbacks.sort((a, b) => a.importance - b.importance);
      this.callbacks.shift();
    }
  }

  /**
   * Add inside joke
   */
  addInsideJoke(phrase, context) {
    this.insideJokes.set(phrase.toLowerCase(), {
      phrase,
      context,
      firstSeen: Date.now(),
      useCount: 1
    });
  }

  /**
   * Increment inside joke usage
   */
  useInsideJoke(phrase) {
    const joke = this.insideJokes.get(phrase.toLowerCase());
    if (joke) {
      joke.useCount++;
    }
  }

  /**
   * Get relevant callback for current situation
   */
  getRelevantCallback(username, currentMessage) {
    const userMoments = this.memorableMoments.get(username);
    if (!userMoments || userMoments.length === 0) return null;

    // Check if current message triggers callback
    const triggers = {
      drama: ['fight', 'drama', 'beef', 'argue'],
      funny: ['joke', 'funny', 'laugh'],
      chaos: ['chaos', 'wild', 'crazy'],
      cringe: ['cringe', 'embarrassing'],
      wholesome: ['nice', 'sweet', 'kind']
    };

    for (const [type, keywords] of Object.entries(triggers)) {
      for (const keyword of keywords) {
        if (currentMessage.toLowerCase().includes(keyword)) {
          // Find moment of this type
          const relevantMoment = userMoments
            .filter(m => m.type === type)
            .sort((a, b) => b.importance - a.importance)[0];

          if (relevantMoment) {
            return this.formatCallback(relevantMoment);
          }
        }
      }
    }

    // Random callback chance
    if (Math.random() < this.callbackChance) {
      const randomMoment = userMoments[Math.floor(Math.random() * userMoments.length)];
      return this.formatCallback(randomMoment);
    }

    return null;
  }

  /**
   * Format callback naturally
   */
  formatCallback(moment) {
    const timeAgo = this.getTimeAgo(moment.timestamp);
    
    const formats = [
      `remember when ${moment.username} ${this.extractAction(moment.message)} ${timeAgo}`,
      `${timeAgo} you said "${this.excerpt(moment.message)}" lmao`,
      `classic ${moment.username} moment: ${this.excerpt(moment.message)}`,
      `still thinking about when you ${this.extractAction(moment.message)}`,
      `"${this.excerpt(moment.message)}" - you, ${timeAgo}`
    ];

    return formats[Math.floor(Math.random() * formats.length)];
  }

  /**
   * Extract action from message
   */
  extractAction(message) {
    // Simple action extraction
    const words = message.toLowerCase().split(' ');
    const verbs = ['said', 'did', 'posted', 'mentioned', 'talked about'];
    
    // Try to find a verb
    for (const word of words) {
      if (/ed$/.test(word) && word.length > 3) {
        return word;
      }
    }

    return verbs[Math.floor(Math.random() * verbs.length)];
  }

  /**
   * Get excerpt of message
   */
  excerpt(message, maxLength = 50) {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }

  /**
   * Get time ago string (more natural variations)
   */
  getTimeAgo(timestamp) {
    const minutes = Math.floor((Date.now() - timestamp) / 1000 / 60);
    
    if (minutes < 1) return ['just now', 'a second ago', 'literally just now'][Math.floor(Math.random() * 3)];
    if (minutes < 5) return ['a few minutes ago', 'like 2 minutes ago', 'just a bit ago'][Math.floor(Math.random() * 3)];
    if (minutes < 30) return [`like ${Math.floor(minutes / 5) * 5} minutes ago`, 'earlier', 'a bit ago'][Math.floor(Math.random() * 3)];
    if (minutes < 60) return ['like an hour ago', 'earlier today', 'a bit ago'][Math.floor(Math.random() * 3)];
    
    const hours = Math.floor(minutes / 60);
    if (hours < 6) return [`${hours} hours ago`, 'earlier today', 'a few hours back'][Math.floor(Math.random() * 3)];
    if (hours < 24) return ['earlier today', 'this morning', 'today', `${hours} hours ago`][Math.floor(Math.random() * 4)];
    
    const days = Math.floor(hours / 24);
    if (days === 1) return ['yesterday', 'last night', 'the other day'][Math.floor(Math.random() * 3)];
    if (days === 2) return ['couple days ago', 'the other day', '2 days ago'][Math.floor(Math.random() * 3)];
    if (days < 7) return [`${days} days ago`, 'earlier this week', 'a few days back'][Math.floor(Math.random() * 3)];
    if (days < 14) return ['last week', 'like a week ago', 'the other week'][Math.floor(Math.random() * 3)];
    
    return ['a while back', 'a bit ago', 'some time ago'][Math.floor(Math.random() * 3)];
  }

  /**
   * Get natural callback phrase (instead of robotic "remember when")
   */
  getNaturalCallbackPhrase(timeAgo) {
    const minutes = Math.floor((Date.now() - timeAgo) / 1000 / 60);
    
    // Recent (< 1 hour)
    if (minutes < 60) {
      return [
        'wait didn\'t you just',
        'bro you literally',
        'didn\'t you say',
        'you just said'
      ][Math.floor(Math.random() * 4)];
    }
    
    // Hours ago
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return [
        'didn\'t you say earlier',
        'wait earlier you',
        'you said earlier',
        'remember earlier when you'
      ][Math.floor(Math.random() * 4)];
    }
    
    // Days ago
    return [
      'remember when you',
      'didn\'t you',
      'bro remember when you',
      'you were saying'
    ][Math.floor(Math.random() * 4)];
  }

  /**
   * Get context for AI
   */
  getContext(username, currentMessage) {
    const callback = this.getRelevantCallback(username, currentMessage);
    if (!callback) return '';

    const recentMoments = this.memorableMoments.get(username)?.slice(-5) || [];
    const momentSummary = recentMoments.map(m => 
      `- ${m.type}: "${this.excerpt(m.message)}" (${this.getTimeAgo(m.timestamp)})`
    ).join('\n');

    return `\n📝 CONTEXTUAL CALLBACK
Possible Reference: "${callback}"

Recent Memorable Moments:
${momentSummary}

- Use callbacks naturally when relevant
- Don't force it if context doesn't fit
- "Remember when..." style works well
- Inside jokes appreciated`;
  }

  /**
   * Save to disk
   */
  save() {
    return {
      memorableMoments: Array.from(this.memorableMoments.entries()),
      insideJokes: Array.from(this.insideJokes.entries()),
      callbacks: this.callbacks
    };
  }

  /**
   * Load from disk
   */
  load(data) {
    if (!data) return;
    
    if (data.memorableMoments) {
      this.memorableMoments = new Map(data.memorableMoments);
    }
    if (data.insideJokes) {
      this.insideJokes = new Map(data.insideJokes);
    }
    if (data.callbacks) {
      this.callbacks = data.callbacks;
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      memorableMoments: this.memorableMoments.size,
      totalMoments: Array.from(this.memorableMoments.values())
        .reduce((sum, moments) => sum + moments.length, 0),
      insideJokes: this.insideJokes.size,
      callbacks: this.callbacks.length,
      callbackChance: (this.callbackChance * 100) + '%'
    };
  }
}

module.exports = ContextualCallbacks;
