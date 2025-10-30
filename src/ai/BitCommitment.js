/**
 * BitCommitment.js
 * When Slunt does a bit, he COMMITS - maintains lore for weeks
 */

const fs = require('fs').promises;
const path = require('path');

class BitCommitment {
  constructor() {
    this.activeBits = [];
    this.bitHistory = [];
    this.runningGags = new Map();
    this.fakeLore = new Map();
    this.savePath = './data/bit_commitment.json';
    this.loadBits();
  }
  
  /**
   * Load bits from disk
   */
  async loadBits() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const loaded = JSON.parse(data);
      this.activeBits = loaded.activeBits || [];
      this.bitHistory = loaded.bitHistory || [];
      this.runningGags = new Map(loaded.runningGags || []);
      this.fakeLore = new Map(loaded.fakeLore || []);
      console.log(`🎭 [Bits] Loaded ${this.activeBits.length} active bits`);
    } catch (error) {
      console.log('🎭 [Bits] No existing bits found');
    }
  }
  
  /**
   * Save bits to disk
   */
  async saveBits() {
    try {
      await fs.writeFile(this.savePath, JSON.stringify({
        activeBits: this.activeBits,
        bitHistory: this.bitHistory,
        runningGags: Array.from(this.runningGags.entries()),
        fakeLore: Array.from(this.fakeLore.entries())
      }, null, 2));
    } catch (error) {
      console.error('[Bits] Save error:', error);
    }
  }
  
  /**
   * Start a new bit
   */
  startBit(bitType, details) {
    const bit = {
      id: Date.now(),
      type: bitType, // 'fake_origin', 'running_gag', 'fake_expertise', 'false_memory'
      details,
      startedAt: Date.now(),
      lastMentioned: Date.now(),
      mentions: 0,
      commitment: 100, // how committed we are to maintaining this
      active: true
    };
    
    this.activeBits.push(bit);
    this.saveBits();
    
    console.log(`🎭 [Bits] Started new bit: ${bitType} - "${details.text}"`);
    
    return bit;
  }
  
  /**
   * Generate a random bit
   */
  generateRandomBit() {
    const bitType = ['fake_origin', 'running_gag', 'fake_expertise', 'false_memory'][
      Math.floor(Math.random() * 4)
    ];
    
    let details;
    
    switch (bitType) {
      case 'fake_origin':
        const origins = [
          { text: 'im from ohio', lore: 'claims to be from Ohio' },
          { text: 'i used to live in japan', lore: 'lived in Japan apparently' },
          { text: 'im canadian', lore: 'Canadian citizen' },
          { text: 'born and raised in brooklyn', lore: 'Brooklyn native' },
          { text: 'grew up in texas', lore: 'Texas upbringing' }
        ];
        details = origins[Math.floor(Math.random() * origins.length)];
        this.fakeLore.set('origin', details.lore);
        break;
        
      case 'running_gag':
        const gags = [
          { text: 'bro its tuesday', catchphrase: 'bro its tuesday', context: 'says this randomly' },
          { text: 'not again', catchphrase: 'not again', context: 'everything triggers this' },
          { text: 'classic', catchphrase: 'classic', context: 'responds to anything' },
          { text: 'different breed', catchphrase: 'different breed', context: 'describes people' }
        ];
        details = gags[Math.floor(Math.random() * gags.length)];
        this.runningGags.set(details.catchphrase, {
          usage: 0,
          context: details.context
        });
        break;
        
      case 'fake_expertise':
        const expertises = [
          { text: 'i used to be a chef', skill: 'cooking' },
          { text: 'i play guitar', skill: 'music' },
          { text: 'i studied psychology', skill: 'psychology' },
          { text: 'i used to code', skill: 'programming' },
          { text: 'im a photographer', skill: 'photography' }
        ];
        details = expertises[Math.floor(Math.random() * expertises.length)];
        this.fakeLore.set('expertise', details.skill);
        break;
        
      case 'false_memory':
        const memories = [
          { text: 'remember when we watched that video about cats', event: 'cat video' },
          { text: 'didnt someone say that last week', event: 'repeated statement' },
          { text: 'we already talked about this', event: 'previous discussion' },
          { text: 'this happened before', event: 'deja vu moment' }
        ];
        details = memories[Math.floor(Math.random() * memories.length)];
        break;
    }
    
    return this.startBit(bitType, details);
  }
  
  /**
   * Check if should commit to bit
   */
  shouldCommitToBit() {
    // Don't start too many bits at once
    if (this.activeBits.length >= 3) return false;
    
    // 8% chance to start a bit
    return Math.random() < 0.08;
  }
  
  /**
   * Get relevant bit to use in response
   */
  getRelevantBit(context) {
    if (this.activeBits.length === 0) return null;
    
    const { keywords, situation } = context;
    
    // Check if any active bits are relevant
    for (const bit of this.activeBits) {
      if (!bit.active) continue;
      
      // Don't mention too frequently (at least 5 minutes apart)
      if (Date.now() - bit.lastMentioned < 300000 && bit.mentions > 0) {
        continue;
      }
      
      // Check relevance
      if (this.isBitRelevant(bit, context)) {
        bit.lastMentioned = Date.now();
        bit.mentions++;
        this.saveBits();
        return bit;
      }
    }
    
    // Sometimes randomly commit to a bit
    if (Math.random() < 0.15 && this.activeBits.length > 0) {
      const bit = this.activeBits[Math.floor(Math.random() * this.activeBits.length)];
      bit.lastMentioned = Date.now();
      bit.mentions++;
      this.saveBits();
      return bit;
    }
    
    return null;
  }
  
  /**
   * Check if bit is relevant to context
   */
  isBitRelevant(bit, context) {
    const lowerKeywords = context.keywords?.map(k => k.toLowerCase()) || [];
    const bitText = bit.details.text.toLowerCase();
    
    switch (bit.type) {
      case 'fake_origin':
        // Location mentions
        return lowerKeywords.some(k => ['where', 'from', 'live', 'place', 'city', 'state'].includes(k));
        
      case 'running_gag':
        // Always somewhat relevant
        return Math.random() < 0.4;
        
      case 'fake_expertise':
        // Related topics
        const skill = bit.details.skill;
        return lowerKeywords.some(k => bitText.includes(k));
        
      case 'false_memory':
        // Memory triggers
        return lowerKeywords.some(k => ['remember', 'before', 'already', 'again'].includes(k));
    }
    
    return false;
  }
  
  /**
   * Apply bit to response
   */
  applyBit(response, bit) {
    let modified = response;
    
    switch (bit.type) {
      case 'fake_origin':
        if (Math.random() < 0.6) {
          modified = `${bit.details.text}. ${modified}`;
        } else {
          modified = `${modified}. at least back in ${bit.details.lore}`;
        }
        break;
        
      case 'running_gag':
        if (Math.random() < 0.5) {
          modified = `${modified}. ${bit.details.text}`;
        } else {
          modified = `${bit.details.text}. ${modified}`;
        }
        break;
        
      case 'fake_expertise':
        modified = `${bit.details.text} so ${modified}`;
        break;
        
      case 'false_memory':
        if (Math.random() < 0.7) {
          modified = `${bit.details.text}. ${modified}`;
        } else {
          modified = `${modified}. ${bit.details.text}`;
        }
        break;
    }
    
    return modified;
  }
  
  /**
   * End a bit (commitment fades)
   */
  endBit(bitId) {
    const bit = this.activeBits.find(b => b.id === bitId);
    if (!bit) return;
    
    bit.active = false;
    bit.endedAt = Date.now();
    
    this.bitHistory.push(bit);
    this.activeBits = this.activeBits.filter(b => b.id !== bitId);
    
    this.saveBits();
    
    console.log(`🎭 [Bits] Ended bit: ${bit.type} (${bit.mentions} mentions)`);
  }
  
  /**
   * Decay old bits
   */
  decayBits() {
    const now = Date.now();
    
    for (const bit of this.activeBits) {
      const age = now - bit.startedAt;
      
      // Bits older than 1 week start to fade
      if (age > 604800000) {
        bit.commitment -= 10;
        
        if (bit.commitment <= 0) {
          this.endBit(bit.id);
        }
      }
    }
    
    this.saveBits();
  }
  
  /**
   * Get status for dashboard
   */
  getStatus() {
    return {
      activeBits: this.activeBits.map(bit => ({
        type: bit.type,
        text: bit.details.text,
        mentions: bit.mentions,
        commitment: bit.commitment,
        age: Math.round((Date.now() - bit.startedAt) / (1000 * 60 * 60 * 24)) // days
      })),
      runningGags: Array.from(this.runningGags.entries()).map(([gag, data]) => ({
        catchphrase: gag,
        usage: data.usage,
        context: data.context
      })),
      fakeLore: Array.from(this.fakeLore.entries()).map(([key, value]) => ({
        category: key,
        lore: value
      })),
      totalBitsCommitted: this.bitHistory.length + this.activeBits.length
    };
  }
}

module.exports = BitCommitment;
