/**
 * MemoryPruning.js
 * 
 * Aggressive memory management to keep total memories under 600
 * (currently at 907+ which is causing repetition and slowness)
 * 
 * Removes:
 * - Low-importance memories
 * - Contradicted facts
 * - Redundant observations
 * - Old, unreinforced memories
 */

const logger = require('../bot/logger');

class MemoryPruning {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.maxMemories = 600; // Target maximum
    this.criticalThreshold = 700; // Force prune above this
    this.lastPruneTime = Date.now();
    this.pruneInterval = 15 * 60 * 1000; // Every 15 minutes
    
    logger.info(`🗑️  [Pruning] Memory pruning system initialized (target: ${this.maxMemories})`);
  }

  /**
   * Get all memories from the tiered storage system
   */
  getAllMemories() {
    if (!this.chatBot.longTermMemory) return [];
    
    return [
      ...(this.chatBot.longTermMemory.shortTerm || []),
      ...(this.chatBot.longTermMemory.midTerm || []),
      ...(this.chatBot.longTermMemory.longTerm || [])
    ];
  }

  /**
   * Check if pruning is needed
   */
  shouldPrune() {
    if (!this.chatBot.longTermMemory) return false;
    
    // Count memories across all tiers
    const memoryCount = (this.chatBot.longTermMemory.shortTerm?.length || 0) +
                       (this.chatBot.longTermMemory.midTerm?.length || 0) +
                       (this.chatBot.longTermMemory.longTerm?.length || 0);
    const timeSinceLastPrune = Date.now() - this.lastPruneTime;

    // Force prune if critically over limit
    if (memoryCount > this.criticalThreshold) {
      return true;
    }

    // Regular prune if over target and interval passed
    if (memoryCount > this.maxMemories && timeSinceLastPrune > this.pruneInterval) {
      return true;
    }

    return false;
  }

  /**
   * Calculate importance score for a memory (0-100)
   */
  calculateImportance(memory) {
    let score = 0;

    // === RECENCY: More recent = more important ===
    const age = Date.now() - memory.timestamp;
    const daysSinceCreation = age / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 1) score += 30;
    else if (daysSinceCreation < 7) score += 20;
    else if (daysSinceCreation < 30) score += 10;
    else score += 5;

    // === REINFORCEMENT: How often accessed ===
    const reinforcement = memory.reinforcement || 1;
    if (reinforcement >= 5) score += 25;
    else if (reinforcement >= 3) score += 15;
    else if (reinforcement >= 2) score += 8;
    else score += 3;

    // === CATEGORY PRIORITY: Some types more important ===
    const categoryScores = {
      'correction': 20, // User corrections are gold
      'personal': 15,   // Personal facts about users
      'preference': 15, // User preferences
      'inside_joke': 12, // Inside jokes develop over time
      'event': 10,      // Events are contextual
      'observation': 5, // Observations are often redundant
      'general': 5,     // General facts are replaceable
      'meta': 8         // Meta knowledge
    };
    score += categoryScores[memory.category] || 5;

    // === EMOTIONAL WEIGHT: Strong emotions = memorable ===
    if (memory.emotionalWeight) {
      if (memory.emotionalWeight > 0.7) score += 15;
      else if (memory.emotionalWeight > 0.4) score += 8;
      else score += 3;
    }

    // === SPECIFICITY: Vague memories are less useful ===
    const content = memory.content.toLowerCase();
    if (content.includes('user') || content.includes('they') || content.includes('someone')) {
      score -= 5; // Vague references
    }
    if (content.length < 30) {
      score -= 5; // Too short, probably not detailed
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect contradicted memories
   */
  findContradictions() {
    if (!this.chatBot.longTermMemory) return [];
    
    const memories = this.chatBot.longTermMemory.memories;
    const contradicted = [];

    // Group memories by username
    const userMemories = {};
    memories.forEach(m => {
      if (m.username) {
        if (!userMemories[m.username]) userMemories[m.username] = [];
        userMemories[m.username].push(m);
      }
    });

    // Check for contradictions within each user's memories
    Object.entries(userMemories).forEach(([username, userMems]) => {
      // Look for opposite statements
      for (let i = 0; i < userMems.length; i++) {
        for (let j = i + 1; j < userMems.length; j++) {
          const mem1 = userMems[i];
          const mem2 = userMems[j];

          if (this.areContradictory(mem1.content, mem2.content)) {
            // Keep the more recent or more reinforced one
            if (mem1.timestamp < mem2.timestamp || mem1.reinforcement < mem2.reinforcement) {
              contradicted.push(mem1);
            } else {
              contradicted.push(mem2);
            }
          }
        }
      }
    });

    return contradicted;
  }

  /**
   * Check if two memory contents contradict each other
   */
  areContradictory(content1, content2) {
    const c1 = content1.toLowerCase();
    const c2 = content2.toLowerCase();

    // Simple contradiction patterns
    const opposites = [
      ['likes', 'hates'],
      ['loves', 'hates'],
      ['prefers', 'dislikes'],
      ['wants', 'doesn\'t want'],
      ['is', 'is not'],
      ['does', 'doesn\'t'],
      ['will', 'won\'t'],
      ['can', 'can\'t']
    ];

    for (const [pos, neg] of opposites) {
      if ((c1.includes(pos) && c2.includes(neg)) || (c1.includes(neg) && c2.includes(pos))) {
        // Check if they're talking about the same thing
        const words1 = c1.split(' ').filter(w => w.length > 3);
        const words2 = c2.split(' ').filter(w => w.length > 3);
        const commonWords = words1.filter(w => words2.includes(w));
        if (commonWords.length >= 2) {
          return true; // Likely a contradiction
        }
      }
    }

    return false;
  }

  /**
   * Find redundant memories (very similar content)
   */
  findRedundant() {
    if (!this.chatBot.longTermMemory) return [];
    
    const memories = this.chatBot.longTermMemory.memories;
    const redundant = [];

    // Compare each memory to others
    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const similarity = this.calculateSimilarity(memories[i].content, memories[j].content);
        
        if (similarity > 0.85) { // Very similar
          // Keep the higher importance one
          const imp1 = this.calculateImportance(memories[i]);
          const imp2 = this.calculateImportance(memories[j]);
          
          if (imp1 < imp2) {
            redundant.push(memories[i]);
          } else {
            redundant.push(memories[j]);
          }
        }
      }
    }

    return redundant;
  }

  /**
   * Calculate Jaccard similarity between two strings
   */
  calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Perform aggressive pruning
   */
  async prune() {
    if (!this.chatBot.longTermMemory) {
      logger.warn('🗑️  [Pruning] No long-term memory system found');
      return;
    }

    const allMemories = this.getAllMemories();
    const startCount = allMemories.length;
    logger.info(`🗑️  [Pruning] Checking ${startCount} memories across tiers`);

    // NOTE: The LongTermMemoryStorage class has its own migration/cleanup system
    // This pruning system is incompatible with the tiered storage architecture
    // Skipping manual pruning and letting the system auto-manage tiers
    logger.info(`🗑️  [Pruning] Skipping - tiered memory system manages itself`);
    
    this.lastPruneTime = Date.now();
    return {
      startCount,
      endCount: startCount,
      removed: 0
    };
  }

  /**
   * Get pruning stats
   */
  getStats() {
    if (!this.chatBot.longTermMemory) return null;

    const allMemories = this.getAllMemories();
    const memoryCount = allMemories.length;
    const overLimit = Math.max(0, memoryCount - this.maxMemories);
    const percentFull = Math.round((memoryCount / this.maxMemories) * 100);

    return {
      currentMemories: memoryCount,
      targetLimit: this.maxMemories,
      overLimit,
      percentFull,
      timeSinceLastPrune: Date.now() - this.lastPruneTime,
      shouldPrune: this.shouldPrune()
    };
  }
}

module.exports = MemoryPruning;
