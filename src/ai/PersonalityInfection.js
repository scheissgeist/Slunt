/**
 * PersonalityInfection.js
 * Slowly adopts speech patterns from frequent users
 */

const fs = require('fs').promises;
const path = require('path');

class PersonalityInfection {
  constructor() {
    this.userPatterns = new Map();
    this.adoptedPatterns = new Map();
    this.infectionRate = 0.05; // 5% chance to adopt per interaction
    this.savePath = './data/personality_infection.json';
    this.loadPatterns();
  }
  
  /**
   * Load patterns from disk
   */
  async loadPatterns() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const loaded = JSON.parse(data);
      
      // Restore userPatterns with nested Maps
      this.userPatterns = new Map();
      if (loaded.userPatterns) {
        for (const [username, patterns] of loaded.userPatterns) {
          this.userPatterns.set(username, {
            catchphrases: new Map(patterns.catchphrases || []),
            punctuationStyle: patterns.punctuationStyle || {},
            capitalizationStyle: patterns.capitalizationStyle || {},
            wordPreferences: new Map(patterns.wordPreferences || []),
            messageLengthAvg: patterns.messageLengthAvg || 0,
            totalMessages: patterns.totalMessages || 0
          });
        }
      }
      
      this.adoptedPatterns = new Map(loaded.adoptedPatterns || []);
      console.log(`🦠 [Infection] Loaded ${this.adoptedPatterns.size} adopted patterns`);
    } catch (error) {
      console.log('🦠 [Infection] No existing patterns found');
    }
  }
  
  /**
   * Save patterns to disk
   */
  async savePatterns() {
    try {
      // Convert nested Maps to arrays for JSON
      const userPatternsArray = Array.from(this.userPatterns.entries()).map(([username, patterns]) => [
        username,
        {
          catchphrases: Array.from(patterns.catchphrases.entries()),
          punctuationStyle: patterns.punctuationStyle,
          capitalizationStyle: patterns.capitalizationStyle,
          wordPreferences: Array.from(patterns.wordPreferences.entries()),
          messageLengthAvg: patterns.messageLengthAvg,
          totalMessages: patterns.totalMessages
        }
      ]);
      
      await fs.writeFile(this.savePath, JSON.stringify({
        userPatterns: userPatternsArray,
        adoptedPatterns: Array.from(this.adoptedPatterns.entries())
      }, null, 2));
    } catch (error) {
      console.error('[Infection] Save error:', error);
    }
  }
  
  /**
   * Analyze user's speech patterns
   */
  analyzeUserMessage(username, message) {
    if (!this.userPatterns.has(username)) {
      this.userPatterns.set(username, {
        catchphrases: new Map(),
        punctuationStyle: {},
        capitalizationStyle: {},
        wordPreferences: new Map(),
        messageLengthAvg: 0,
        totalMessages: 0
      });
    }
    
    const patterns = this.userPatterns.get(username);
    patterns.totalMessages++;
    
    // Detect catchphrases (2-3 word phrases used frequently)
    const words = message.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length > 5) {
        const count = patterns.catchphrases.get(phrase) || 0;
        patterns.catchphrases.set(phrase, count + 1);
      }
    }
    
    // Detect capitalization style
    const capsCount = (message.match(/[A-Z]/g) || []).length;
    const totalLetters = message.replace(/[^a-zA-Z]/g, '').length;
    
    if (totalLetters > 0) {
      const capsRatio = capsCount / totalLetters;
      
      if (capsRatio > 0.5) {
        patterns.capitalizationStyle.highCaps = (patterns.capitalizationStyle.highCaps || 0) + 1;
      } else if (capsRatio < 0.1) {
        patterns.capitalizationStyle.lowCaps = (patterns.capitalizationStyle.lowCaps || 0) + 1;
      }
    }
    
    // Detect punctuation style
    if (message.includes('...')) {
      patterns.punctuationStyle.ellipsis = (patterns.punctuationStyle.ellipsis || 0) + 1;
    }
    if ((message.match(/!/g) || []).length > 1) {
      patterns.punctuationStyle.multiExclamation = (patterns.punctuationStyle.multiExclamation || 0) + 1;
    }
    if ((message.match(/\?/g) || []).length > 1) {
      patterns.punctuationStyle.multiQuestion = (patterns.punctuationStyle.multiQuestion || 0) + 1;
    }
    
    // Track message length
    patterns.messageLengthAvg = 
      (patterns.messageLengthAvg * (patterns.totalMessages - 1) + message.length) / patterns.totalMessages;
    
    // Word preferences (significant words used frequently)
    for (const word of words) {
      if (word.length > 4) {
        const count = patterns.wordPreferences.get(word) || 0;
        patterns.wordPreferences.set(word, count + 1);
      }
    }
    
    // Try to adopt patterns
    this.tryAdoptPattern(username);
    
    this.savePatterns();
  }
  
  /**
   * Try to adopt a pattern from user
   */
  tryAdoptPattern(username) {
    if (Math.random() > this.infectionRate) return;
    
    const patterns = this.userPatterns.get(username);
    if (!patterns || patterns.totalMessages < 5) return;
    
    // Find most common catchphrase
    const sortedPhrases = Array.from(patterns.catchphrases.entries())
      .filter(([phrase, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a);
    
    if (sortedPhrases.length > 0) {
      const [phrase, count] = sortedPhrases[0];
      
      if (!this.adoptedPatterns.has(phrase)) {
        this.adoptedPatterns.set(phrase, {
          sourceUser: username,
          adoptedAt: Date.now(),
          usageCount: 0,
          strength: Math.min(100, count * 10)
        });
        
        console.log(`🦠 [Infection] Adopted "${phrase}" from ${username}`);
        this.savePatterns();
      }
    }
    
    // Adopt punctuation style
    if (patterns.punctuationStyle.ellipsis > patterns.totalMessages * 0.3) {
      if (!this.adoptedPatterns.has('ellipsis')) {
        this.adoptedPatterns.set('ellipsis', {
          sourceUser: username,
          adoptedAt: Date.now(),
          usageCount: 0,
          strength: 70
        });
        console.log(`🦠 [Infection] Adopted ellipsis style from ${username}`);
      }
    }
    
    // Adopt capitalization style
    if (patterns.capitalizationStyle.highCaps > patterns.totalMessages * 0.4) {
      if (!this.adoptedPatterns.has('highCaps')) {
        this.adoptedPatterns.set('highCaps', {
          sourceUser: username,
          adoptedAt: Date.now(),
          usageCount: 0,
          strength: 60
        });
        console.log(`🦠 [Infection] Adopted high caps style from ${username}`);
      }
    }
  }
  
  /**
   * Apply adopted patterns to response
   */
  infectResponse(response, targetUser = null) {
    let infected = response;
    
    // If targeting specific user, slightly increase chance of their patterns
    const relevantPatterns = targetUser
      ? Array.from(this.adoptedPatterns.entries()).filter(([, data]) => data.sourceUser === targetUser)
      : Array.from(this.adoptedPatterns.entries());
    
    if (relevantPatterns.length === 0) return response;
    
    // Try to use an adopted catchphrase (weighted by strength)
    for (const [pattern, data] of relevantPatterns) {
      if (pattern === 'ellipsis' || pattern === 'highCaps') continue;
      
      const useChance = data.strength / 200; // 0.5 max for 100 strength
      
      if (Math.random() < useChance) {
        // Add catchphrase naturally
        if (Math.random() < 0.5) {
          infected = `${infected}. ${pattern}`;
        } else {
          infected = `${pattern}. ${infected}`;
        }
        
        data.usageCount++;
        this.savePatterns();
        break; // Only use one catchphrase per message
      }
    }
    
    // Apply punctuation style
    if (this.adoptedPatterns.has('ellipsis')) {
      const data = this.adoptedPatterns.get('ellipsis');
      if (Math.random() < data.strength / 150) {
        infected = infected.replace(/\.$/, '...');
        data.usageCount++;
      }
    }
    
    // Apply capitalization style
    if (this.adoptedPatterns.has('highCaps')) {
      const data = this.adoptedPatterns.get('highCaps');
      if (Math.random() < data.strength / 200) {
        infected = infected.toUpperCase();
        data.usageCount++;
      }
    }
    
    return infected;
  }
  
  /**
   * Detect pattern conflicts (acting like wrong person)
   */
  detectConflict(currentUser, response) {
    // Check if response uses patterns from different user
    for (const [pattern, data] of this.adoptedPatterns.entries()) {
      if (pattern === 'ellipsis' || pattern === 'highCaps') continue;
      
      if (response.includes(pattern) && data.sourceUser !== currentUser) {
        console.log(`😬 [Infection] Awkward - using ${data.sourceUser}'s pattern while talking to ${currentUser}`);
        return {
          conflict: true,
          sourceUser: data.sourceUser,
          pattern
        };
      }
    }
    
    return { conflict: false };
  }
  
  /**
   * Decay pattern strength over time
   */
  decayPatterns() {
    const now = Date.now();
    const toRemove = [];
    
    for (const [pattern, data] of this.adoptedPatterns.entries()) {
      const age = now - data.adoptedAt;
      
      // Decay if not used recently
      if (age > 86400000) { // 1 day
        data.strength = Math.max(0, data.strength - 5);
        
        if (data.strength === 0) {
          toRemove.push(pattern);
        }
      }
    }
    
    // Remove dead patterns
    for (const pattern of toRemove) {
      this.adoptedPatterns.delete(pattern);
      console.log(`🦠 [Infection] Pattern faded: "${pattern}"`);
    }
    
    if (toRemove.length > 0) {
      this.savePatterns();
    }
  }
  
  /**
   * Get top influencers
   */
  getTopInfluencers() {
    const influencers = new Map();
    
    for (const [pattern, data] of this.adoptedPatterns.entries()) {
      const user = data.sourceUser;
      influencers.set(user, (influencers.get(user) || 0) + data.strength);
    }
    
    return Array.from(influencers.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }
  
  /**
   * Get status for dashboard
   */
  getStatus() {
    return {
      totalPatterns: this.adoptedPatterns.size,
      adoptedPatterns: Array.from(this.adoptedPatterns.entries()).map(([pattern, data]) => ({
        pattern,
        sourceUser: data.sourceUser,
        strength: Math.round(data.strength),
        usage: data.usageCount,
        age: Math.round((Date.now() - data.adoptedAt) / (1000 * 60 * 60)) // hours
      })),
      topInfluencers: this.getTopInfluencers().map(([user, influence]) => ({
        username: user,
        influence: Math.round(influence)
      })),
      infectionRate: Math.round(this.infectionRate * 100),
      trackedUsers: this.userPatterns.size
    };
  }
}

module.exports = PersonalityInfection;
