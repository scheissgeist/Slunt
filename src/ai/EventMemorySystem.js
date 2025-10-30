/**
 * EventMemorySystem.js
 * Remembers specific funny moments and brings them up later
 */

const fs = require('fs').promises;
const path = require('path');

class EventMemorySystem {
  constructor() {
    this.events = [];
    this.anniversaries = [];
    this.savePath = './data/event_memory.json';
    this.loadEvents();
  }
  
  /**
   * Load events from disk
   */
  async loadEvents() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const loaded = JSON.parse(data);
      this.events = loaded.events || [];
      this.anniversaries = loaded.anniversaries || [];
      console.log(`📅 [Events] Loaded ${this.events.length} memorable events`);
    } catch (error) {
      console.log('📅 [Events] No existing event memory found, starting fresh');
    }
  }
  
  /**
   * Save events to disk
   */
  async saveEvents() {
    try {
      await fs.writeFile(
        this.savePath,
        JSON.stringify({ events: this.events, anniversaries: this.anniversaries }, null, 2)
      );
    } catch (error) {
      console.error('[Events] Save error:', error);
    }
  }
  
  /**
   * Record a memorable event
   */
  recordEvent(event) {
    const memorable = {
      id: Date.now(),
      type: event.type, // 'funny', 'dramatic', 'legendary', 'cringe'
      description: event.description,
      participants: event.participants || [],
      quote: event.quote,
      timestamp: Date.now(),
      significance: event.significance || 50, // 0-100
      timesReferenced: 0
    };
    
    this.events.push(memorable);
    
    // Keep only significant events
    if (this.events.length > 100) {
      this.events.sort((a, b) => b.significance - a.significance);
      this.events = this.events.slice(0, 100);
    }
    
    this.saveEvents();
    console.log(`📅 [Events] Recorded ${event.type} event: "${event.description.slice(0, 30)}..."`);
    
    return memorable;
  }
  
  /**
   * Find relevant event to reference
   */
  findRelevantEvent(context) {
    if (this.events.length === 0) return null;
    
    const { username, keywords, situation } = context;
    const now = Date.now();
    
    // Filter events by relevance
    let relevant = this.events.filter(event => {
      // Don't reference too recent events
      if (now - event.timestamp < 600000) return false; // 10 minutes ago
      
      // Check participant relevance
      if (username && event.participants.includes(username)) {
        return true;
      }
      
      // Check keyword relevance
      if (keywords) {
        for (const keyword of keywords) {
          if (event.description.toLowerCase().includes(keyword.toLowerCase())) {
            return true;
          }
        }
      }
      
      return false;
    });
    
    // If no relevant events, sometimes use random
    if (relevant.length === 0 && Math.random() < 0.3) {
      relevant = this.events;
    }
    
    if (relevant.length === 0) return null;
    
    // Weight by significance and recency
    const weighted = relevant.map(event => {
      const ageHours = (now - event.timestamp) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 100 - ageHours); // fresher = higher
      const referencepenalty = event.timesReferenced * 10; // referenced more = lower
      
      return {
        event,
        score: event.significance + recencyScore - referencepenalty
      };
    });
    
    weighted.sort((a, b) => b.score - a.score);
    const chosen = weighted[0].event;
    chosen.timesReferenced++;
    
    this.saveEvents();
    return chosen;
  }
  
  /**
   * Generate callback message
   */
  async generateCallback(event) {
    // Use dynamic phrase generator if available
    if (this.chatBot.dynamicPhraseGenerator) {
      return await this.chatBot.dynamicPhraseGenerator.generateEventCallback(
        event.description,
        event.participants || []
      );
    }
    
    // Fallback templates (should rarely be used)
    const templates = [
      `remember when ${event.description}`,
      `this reminds me of when ${event.description}`,
      `${event.description} vibes`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  /**
   * Check for anniversaries
   */
  checkAnniversaries() {
    const now = new Date();
    const results = [];
    
    for (const event of this.events) {
      const eventDate = new Date(event.timestamp);
      
      // Check if same day (ignore year)
      if (eventDate.getMonth() === now.getMonth() && 
          eventDate.getDate() === now.getDate()) {
        const yearsDiff = now.getFullYear() - eventDate.getFullYear();
        
        if (yearsDiff > 0) {
          results.push({
            event,
            years: yearsDiff,
            message: `${yearsDiff} year${yearsDiff > 1 ? 's' : ''} ago today: ${event.description}`
          });
        }
      }
    }
    
    return results;
  }
  
  /**
   * Detect if current moment is memorable
   */
  isMemorableMessage(message, context) {
    const lowerMsg = message.toLowerCase();
    let significance = 0;
    let type = 'normal';
    
    // Funny indicators
    if (lowerMsg.includes('lmao') || lowerMsg.includes('dead') || lowerMsg.includes('lol')) {
      significance += 20;
      type = 'funny';
    }
    
    // Dramatic indicators
    if (lowerMsg.includes('wtf') || lowerMsg.includes('oh shit') || lowerMsg.includes('no way')) {
      significance += 25;
      type = 'dramatic';
    }
    
    // Gold messages
    if (context.isGold) {
      significance += 40;
      type = 'legendary';
    }
    
    // Check chat reaction
    if (context.rapidResponses > 5) {
      significance += 30;
    }
    
    return { memorable: significance > 40, type, significance };
  }
  
  /**
   * Get status for dashboard
   */
  getStatus() {
    const now = Date.now();
    
    return {
      totalEvents: this.events.length,
      byType: this.events.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {}),
      recentEvents: this.events
        .slice(-10)
        .map(e => ({
          type: e.type,
          description: e.description.slice(0, 50),
          age: Math.round((now - e.timestamp) / (1000 * 60)),
          references: e.timesReferenced
        })),
      topEvents: this.events
        .sort((a, b) => b.significance - a.significance)
        .slice(0, 5)
        .map(e => ({
          description: e.description.slice(0, 50),
          significance: e.significance,
          references: e.timesReferenced
        }))
    };
  }
}

module.exports = EventMemorySystem;
