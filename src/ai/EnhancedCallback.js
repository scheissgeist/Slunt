/**
 * Enhanced Callback System
 * Better references to past conversations with specific details
 */

class EnhancedCallback {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.callbackCandidates = []; // Recent memorable moments
    this.maxCandidates = 50;
  }

  /**
   * Track potentially callback-worthy moments
   */
  trackMoment(username, text, platform, timestamp = Date.now()) {
    // Check if message is callback-worthy
    const worth = this.isCallbackWorthy(text);
    if (!worth) return;

    const moment = {
      username,
      text: text.substring(0, 150), // Store snippet
      platform,
      timestamp,
      topics: this.extractTopics(text),
      type: worth.type,
      recalled: false
    };

    this.callbackCandidates.unshift(moment);
    if (this.callbackCandidates.length > this.maxCandidates) {
      this.callbackCandidates.pop();
    }

    console.log(`💭 [Callback] Tracked ${worth.type}: "${text.substring(0, 40)}..." from ${username}`);
  }

  /**
   * Determine if message is callback-worthy
   */
  isCallbackWorthy(text) {
    const lowerText = text.toLowerCase();

    // Questions they asked
    if (text.includes('?') && text.split(' ').length > 3) {
      return { type: 'question', importance: 8 };
    }

    // Statements about themselves
    if (lowerText.match(/\b(i am|i'm|i was|i have|i've|i do|i did|my|me)\b/)) {
      return { type: 'personal_info', importance: 7 };
    }

    // Plans or intentions
    if (lowerText.match(/\b(gonna|going to|will|planning|might|should|need to)\b/)) {
      return { type: 'plan', importance: 9 };
    }

    // Opinions (strong ones)
    if (lowerText.match(/\b(hate|love|best|worst|amazing|terrible|trash|peak)\b/)) {
      return { type: 'opinion', importance: 6 };
    }

    // Problems/complaints
    if (lowerText.match(/\b(broken|sucks|annoying|frustrating|pissed|mad)\b/)) {
      return { type: 'complaint', importance: 8 };
    }

    // Jokes/funny moments
    if (lowerText.match(/\b(lol|lmao|haha|😂|💀)\b/) && text.split(' ').length > 5) {
      return { type: 'funny', importance: 5 };
    }

    return null;
  }

  /**
   * Extract topics from text
   */
  extractTopics(text) {
    const topics = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Common nouns and interests
    const topicWords = ['game', 'video', 'stream', 'discord', 'music', 'work', 'school', 
                        'friend', 'movie', 'show', 'book', 'food', 'weather'];
    
    for (const word of words) {
      if (topicWords.some(t => word.includes(t))) {
        topics.push(word);
      }
    }
    
    return topics;
  }

  /**
   * Find relevant callback for current conversation
   */
  findCallback(username, currentText, minAge = 5 * 60 * 1000) {
    const now = Date.now();
    
    // Filter to this user's moments that are old enough
    const candidates = this.callbackCandidates
      .filter(m => m.username === username && (now - m.timestamp) > minAge && !m.recalled)
      .slice(0, 10); // Only check recent ones

    if (candidates.length === 0) return null;

    // Look for topical match
    const currentTopics = this.extractTopics(currentText);
    for (const candidate of candidates) {
      if (candidate.topics.some(t => currentTopics.includes(t))) {
        candidate.recalled = true;
        return this.formatCallback(candidate, now - candidate.timestamp);
      }
    }

    // Random callback (if they're talking enough)
    if (Math.random() < 0.1 && candidates.length > 0) {
      const random = candidates[Math.floor(Math.random() * candidates.length)];
      random.recalled = true;
      return this.formatCallback(random, now - random.timestamp);
    }

    return null;
  }

  /**
   * Format callback for prompt
   */
  formatCallback(moment, timeSince) {
    const timeAgo = this.formatTimeAgo(timeSince);
    
    let prompt = `\n[CALLBACK OPPORTUNITY] ${timeAgo}, ${moment.username} `;
    
    switch (moment.type) {
      case 'question':
        prompt += `asked: "${moment.text}" - You could reference this: "btw did you ever figure out that thing about [topic]?"`;
        break;
      case 'plan':
        prompt += `mentioned: "${moment.text}" - You could check in: "hey whatever happened with [plan]?"`;
        break;
      case 'complaint':
        prompt += `complained: "${moment.text}" - You could ask: "is [problem] still bugging you or did it get better?"`;
        break;
      case 'personal_info':
        prompt += `mentioned: "${moment.text}" - You could reference this if relevant`;
        break;
      case 'opinion':
        prompt += `said: "${moment.text}" - You could bring this up if debating the topic`;
        break;
      case 'funny':
        prompt += `said something funny: "${moment.text}" - You could reference this for a laugh`;
        break;
    }
    
    return prompt;
  }

  /**
   * Format time ago
   */
  formatTimeAgo(ms) {
    const minutes = Math.floor(ms / (60 * 1000));
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 10) return `${minutes} minutes ago`;
    return 'earlier';
  }

  /**
   * Get stats
   */
  getStats() {
    const typeCount = {};
    for (const moment of this.callbackCandidates) {
      typeCount[moment.type] = (typeCount[moment.type] || 0) + 1;
    }
    
    return {
      totalMoments: this.callbackCandidates.length,
      byType: typeCount,
      recalled: this.callbackCandidates.filter(m => m.recalled).length
    };
  }
}

module.exports = EnhancedCallback;
