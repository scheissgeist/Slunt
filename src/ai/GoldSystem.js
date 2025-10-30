/**
 * GoldSystem.js
 * Learns what makes messages "gold-worthy" based on user reactions
 * Gold messages are funny, ironic, or perfectly timed - often repeated for comedic emphasis
 */

const fs = require('fs').promises;
const path = require('path');

class GoldSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Track gold messages
    this.goldMessages = [];
    this.recentMessages = []; // Track last 20 messages to find gold context
    this.maxHistory = 20;
    
    // Gold patterns learned from observation
    this.goldPatterns = {
      timing: [], // What timing makes gold (e.g., "right after X")
      content: [], // What content gets golded (keywords, phrases)
      users: new Map() // Which users give gold frequently
    };
    
    // Gold statistics
    this.stats = {
      totalGold: 0,
      goldByUser: new Map(),
      repeatedGold: 0, // Gold messages that got repeated
      sluntGold: 0 // Times Slunt's messages got golded
    };
    
    this.savePath = './data/gold_system.json';
    this.loadGoldData(); // Auto-load on startup
    
    console.log('💰 [Gold] Gold System initialized');
  }

  /**
   * Load gold data from disk
   */
  async loadGoldData() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.goldMessages = parsed.goldMessages || [];
      this.goldPatterns = parsed.goldPatterns || { timing: [], content: [], users: new Map() };
      
      // Convert users map back from array
      if (parsed.goldPatterns && parsed.goldPatterns.users) {
        this.goldPatterns.users = new Map(parsed.goldPatterns.users);
      }
      if (parsed.stats) {
        this.stats = parsed.stats;
        if (parsed.stats.goldByUser) {
          this.stats.goldByUser = new Map(parsed.stats.goldByUser);
        }
        if (parsed.stats.users) {
          this.stats.users = new Map(parsed.stats.users);
        }
      }
      
      console.log(`💰 [Gold] Loaded ${this.goldMessages.length} gold messages and patterns from disk`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('💰 [Gold] Error loading:', error.message);
      }
    }
  }

  /**
   * Save gold data to disk
   */
  async saveGoldData() {
    try {
      const dir = path.dirname(this.savePath);
      await fs.mkdir(dir, { recursive: true });

      const data = {
        goldMessages: this.goldMessages,
        goldPatterns: {
          timing: this.goldPatterns.timing,
          content: this.goldPatterns.content,
          users: Array.from(this.goldPatterns.users.entries())
        },
        stats: {
          totalGold: this.stats.totalGold,
          goldByUser: Array.from(this.stats.goldByUser.entries()),
          repeatedGold: this.stats.repeatedGold,
          sluntGold: this.stats.sluntGold
        },
        savedAt: Date.now()
      };

      await fs.writeFile(this.savePath, JSON.stringify(data, null, 2));
      console.log(`💰 [Gold] Saved ${this.goldMessages.length} gold messages to disk`);
    } catch (error) {
      console.error('💰 [Gold] Error saving:', error.message);
    }
  }

  /**
   * Track a message in recent history
   */
  trackMessage(username, text, timestamp = Date.now()) {
    this.recentMessages.push({
      username,
      text,
      timestamp,
      wasGold: false,
      wasRepeated: false
    });
    
    // Keep only last N messages
    if (this.recentMessages.length > this.maxHistory) {
      this.recentMessages.shift();
    }
  }

  /**
   * Learn from a gold message
   */
  learnGold(username, goldText, timestamp = Date.now()) {
    console.log(`💰 [Gold] ${username} activated gold: "${goldText}"`);
    this.stats.totalGold++;
    
    // Track user gold frequency
    const userGoldCount = this.stats.goldByUser.get(username) || 0;
    this.stats.goldByUser.set(username, userGoldCount + 1);
    
    // Check if it was Slunt's message
    if (username === 'Slunt') {
      this.stats.sluntGold++;
      console.log('🌟 [Gold] Slunt got golded! Learning from this...');
    }
    
    // Find the message in recent history
    const goldMessage = this.recentMessages.find(m => 
      m.username === username && m.text === goldText
    );
    
    if (goldMessage) {
      goldMessage.wasGold = true;
      
      // Learn context: what happened before this gold message?
      const messageIndex = this.recentMessages.indexOf(goldMessage);
      const context = this.recentMessages.slice(Math.max(0, messageIndex - 3), messageIndex);
      
      // Store gold with context
      this.goldMessages.push({
        username,
        text: goldText,
        timestamp,
        context: context.map(m => ({ username: m.username, text: m.text })),
        wasRepeated: false
      });
      
      // Learn patterns
      this.learnPatterns(goldText, context);
    }
    
    // Keep only last 50 gold messages
    if (this.goldMessages.length > 50) {
      this.goldMessages.shift();
    }
    
    // Auto-save after learning gold
    this.saveGoldData();
  }

  /**
   * Learn patterns from gold messages
   */
  learnPatterns(goldText, context) {
    // Extract keywords from gold message
    const words = goldText.toLowerCase().split(/\s+/)
      .filter(w => w.length > 3); // Only words longer than 3 chars
    
    words.forEach(word => {
      // Find or create pattern
      const existing = this.goldPatterns.content.find(p => p.word === word);
      if (existing) {
        existing.count++;
      } else {
        this.goldPatterns.content.push({ word, count: 1 });
      }
    });
    
    // Sort by frequency
    this.goldPatterns.content.sort((a, b) => b.count - a.count);
    
    // Keep only top 30 patterns
    if (this.goldPatterns.content.length > 30) {
      this.goldPatterns.content = this.goldPatterns.content.slice(0, 30);
    }
  }

  /**
   * Track when a gold message gets repeated
   */
  trackRepeat(repeatedText) {
    // Find the original gold message
    const goldMsg = this.goldMessages.find(m => m.text === repeatedText);
    
    if (goldMsg && !goldMsg.wasRepeated) {
      goldMsg.wasRepeated = true;
      this.stats.repeatedGold++;
      console.log(`💰 [Gold] Message repeated for emphasis: "${repeatedText}"`);
      
      // This is EXTRA gold-worthy - increase pattern weights
      const words = repeatedText.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const pattern = this.goldPatterns.content.find(p => p.word === word);
        if (pattern) {
          pattern.count += 2; // Bonus for repeated gold
        }
      });
    }
  }

  /**
   * Get gold statistics for dashboard
   */
  getStats() {
    return {
      totalGold: this.stats.totalGold,
      sluntGold: this.stats.sluntGold,
      repeatedGold: this.stats.repeatedGold,
      topGolders: Array.from(this.stats.goldByUser.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topPatterns: this.goldPatterns.content.slice(0, 10),
      recentGold: this.goldMessages.slice(-10).reverse()
    };
  }

  /**
   * Check if a message might be gold-worthy
   * Returns confidence score 0-100
   */
  predictGoldWorthiness(text) {
    let score = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    // Check against learned patterns
    words.forEach(word => {
      const pattern = this.goldPatterns.content.find(p => p.word === word);
      if (pattern) {
        score += pattern.count * 5; // 5 points per frequency count
      }
    });
    
    // Bonus for timing (short messages often gold-worthy)
    if (text.length < 50) score += 10;
    if (text.length < 20) score += 10;
    
    // Bonus for humor indicators
    if (text.match(/\b(lol|lmao|haha|fuck|shit|wtf)\b/i)) score += 15;
    
    // Bonus for questions or reactions
    if (text.includes('?')) score += 10;
    if (text.match(/^(what|why|how|omg|bruh|damn)/i)) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Get context for AI: what types of messages get golded?
   */
  getGoldContext() {
    if (this.goldMessages.length === 0) return '';
    
    // Get top 3 patterns
    const topPatterns = this.goldPatterns.content.slice(0, 3);
    if (topPatterns.length === 0) return '';
    
    const keywords = topPatterns.map(p => p.word).join(', ');
    return `Gold-worthy topics: ${keywords}`;
  }
}

module.exports = GoldSystem;
