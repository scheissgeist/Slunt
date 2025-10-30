/**
 * Memory Decay System
 * Memories fade, get distorted, and sometimes combine over time
 */

class MemoryDecay {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Memory storage with decay tracking
    this.memories = new Map(); // id -> memory object
    this.memoryCounter = 0;
    
    // Decay settings
    this.decayRate = 0.02; // 2% decay per hour
    this.distortionChance = 0.15; // 15% chance to distort on recall
    this.combinationChance = 0.05; // 5% chance to combine memories
    
    // Distortion patterns
    this.distortions = [
      'username_swap', // Wrong person
      'detail_change', // Changed detail
      'exaggeration', // Made bigger/worse
      'false_memory', // Never happened
      'time_shift' // Wrong time
    ];
    
    // Start decay process
    this.setupDecay();
  }

  /**
   * Setup periodic memory decay
   */
  setupDecay() {
    // Decay memories every hour
    setInterval(() => {
      this.applyDecay();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Store a new memory
   */
  storeMemory(type, data, importance = 0.5) {
    const id = `mem_${this.memoryCounter++}`;
    
    const memory = {
      id,
      type, // 'interaction', 'video', 'event', 'grudge', etc.
      data,
      importance, // 0-1, affects decay rate
      clarity: 1.0, // How clear the memory is (decays over time)
      distorted: false,
      distortionType: null,
      createdAt: Date.now(),
      lastRecalled: Date.now(),
      recallCount: 0
    };
    
    this.memories.set(id, memory);
    
    console.log(`🧠 [Memory] Stored: ${type} (importance: ${(importance * 100).toFixed(0)}%)`);
    
    return id;
  }

  /**
   * Recall a memory (with potential distortion)
   */
  recallMemory(id) {
    const memory = this.memories.get(id);
    if (!memory) return null;
    
    // Update recall stats
    memory.lastRecalled = Date.now();
    memory.recallCount++;
    
    // Check for distortion
    if (!memory.distorted && Math.random() < this.distortionChance * (1 - memory.clarity)) {
      this.distortMemory(memory);
    }
    
    // Memories become clearer when recalled (slightly)
    memory.clarity = Math.min(1, memory.clarity + 0.05);
    
    return memory;
  }

  /**
   * Apply natural decay to all memories
   */
  applyDecay() {
    console.log(`🧠 [Memory] Applying decay to ${this.memories.size} memories...`);
    
    let decayed = 0;
    let forgotten = 0;
    
    for (const [id, memory] of this.memories) {
      // Skip recent memories
      const age = Date.now() - memory.createdAt;
      if (age < 30 * 60 * 1000) continue; // Don't decay memories < 30 min old
      
      // Decay rate affected by importance and recall
      const timeSinceRecall = Date.now() - memory.lastRecalled;
      const hoursOld = timeSinceRecall / (60 * 60 * 1000);
      
      const effectiveDecay = this.decayRate * 
        (1 - memory.importance * 0.5) * // Important memories decay slower
        (1 + hoursOld * 0.1); // Older memories decay faster
      
      memory.clarity = Math.max(0, memory.clarity - effectiveDecay);
      
      if (memory.clarity < 0.1) {
        // Memory almost forgotten
        this.memories.delete(id);
        forgotten++;
      } else if (memory.clarity < 0.5) {
        decayed++;
      }
    }
    
    console.log(`🧠 [Memory] Decay complete: ${decayed} faded, ${forgotten} forgotten`);
    
    // Try to combine similar memories
    this.attemptMemoryCombination();
  }

  /**
   * Distort a memory
   */
  distortMemory(memory) {
    const distortionType = this.distortions[Math.floor(Math.random() * this.distortions.length)];
    
    memory.distorted = true;
    memory.distortionType = distortionType;
    
    console.log(`🌀 [Memory] Distorted memory: ${memory.id} (${distortionType})`);
    
    // Apply specific distortion
    switch (distortionType) {
      case 'username_swap':
        if (memory.data.username && this.chatBot.userProfiles.size > 1) {
          const users = Array.from(this.chatBot.userProfiles.keys());
          const randomUser = users[Math.floor(Math.random() * users.length)];
          memory.data.originalUsername = memory.data.username;
          memory.data.username = randomUser;
        }
        break;
        
      case 'detail_change':
        if (memory.data.message) {
          // Change a detail slightly
          memory.data.originalMessage = memory.data.message;
          memory.data.message = this.changeDetail(memory.data.message);
        }
        break;
        
      case 'exaggeration':
        memory.data.exaggerated = true;
        break;
        
      case 'false_memory':
        memory.data.falseMemory = true;
        break;
        
      case 'time_shift':
        memory.data.originalTime = memory.createdAt;
        // Shift time by random amount
        memory.createdAt += (Math.random() - 0.5) * 24 * 60 * 60 * 1000;
        break;
    }
  }

  /**
   * Change a detail in text
   */
  changeDetail(text) {
    // Simple distortion: change a word
    const words = text.split(' ');
    if (words.length < 3) return text;
    
    const idx = Math.floor(Math.random() * words.length);
    words[idx] = '[DISTORTED]';
    
    return words.join(' ');
  }

  /**
   * Attempt to combine similar memories
   */
  attemptMemoryCombination() {
    if (Math.random() > this.combinationChance) return;
    
    const memoryArray = Array.from(this.memories.values());
    if (memoryArray.length < 2) return;
    
    // Find two similar memories
    for (let i = 0; i < memoryArray.length - 1; i++) {
      const mem1 = memoryArray[i];
      const mem2 = memoryArray[i + 1];
      
      if (mem1.type === mem2.type && !mem1.distorted && !mem2.distorted) {
        // Combine them
        console.log(`🔀 [Memory] Combining memories: ${mem1.id} + ${mem2.id}`);
        
        mem1.data.combined = true;
        mem1.data.combinedWith = mem2.id;
        mem1.data.combinedData = mem2.data;
        mem1.distorted = true;
        mem1.distortionType = 'combination';
        
        // Remove second memory
        this.memories.delete(mem2.id);
        break;
      }
    }
  }

  /**
   * Search memories by query
   */
  searchMemories(query, limit = 5) {
    const results = [];
    
    for (const memory of this.memories.values()) {
      if (memory.clarity < 0.3) continue; // Too faded to recall
      
      // Simple search in data
      const dataStr = JSON.stringify(memory.data).toLowerCase();
      if (dataStr.includes(query.toLowerCase())) {
        results.push({
          memory: this.recallMemory(memory.id),
          relevance: memory.clarity
        });
      }
    }
    
    // Sort by clarity/relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    return results.slice(0, limit);
  }

  /**
   * Get context for Slunt (fuzzy memories)
   */
  getMemoryContext(topic) {
    const memories = this.searchMemories(topic, 3);
    
    if (memories.length === 0) return '';
    
    let context = '\n[Memory recall - may be inaccurate]:';
    
    for (const { memory } of memories) {
      if (memory.distorted) {
        context += `\n  - [FUZZY] ${this.describeMemory(memory)}`;
      } else if (memory.clarity < 0.7) {
        context += `\n  - [VAGUE] ${this.describeMemory(memory)}`;
      } else {
        context += `\n  - ${this.describeMemory(memory)}`;
      }
    }
    
    return context;
  }

  /**
   * Describe a memory for context
   */
  describeMemory(memory) {
    const age = Math.floor((Date.now() - memory.createdAt) / (60 * 1000));
    const ageStr = age < 60 ? `${age}m ago` : `${Math.floor(age / 60)}h ago`;
    
    if (memory.type === 'interaction') {
      return `${memory.data.username} said something ${ageStr}`;
    } else if (memory.type === 'event') {
      return `Something happened ${ageStr}`;
    }
    
    return `Memory from ${ageStr}`;
  }

  /**
   * Get context for AI prompts with relevant memories
   */
  getContext(currentUsername = null, currentTopic = null) {
    const memoryArray = Array.from(this.memories.values());

    if (memoryArray.length === 0) return '';

    const fadedCount = memoryArray.filter(m => m.clarity < 0.5).length;
    const distortedCount = memoryArray.filter(m => m.distorted).length;

    let context = '\n🧠 MEMORY STATUS:';
    context += `\n- Total memories: ${memoryArray.length}`;

    if (fadedCount > 0) {
      context += `\n- ${fadedCount} memories are fading (you might misremember)`;
    }

    if (distortedCount > 0) {
      context += `\n- ${distortedCount} memories are distorted`;
    }

    // Include relevant recent memories for context
    const relevantMemories = this.getRelevantMemories(currentUsername, currentTopic, 3);
    if (relevantMemories.length > 0) {
      context += '\n\n💭 RECENT RELEVANT MEMORIES:';
      relevantMemories.forEach(mem => {
        const clarity = mem.clarity < 0.5 ? '[FUZZY] ' : mem.clarity < 0.7 ? '[VAGUE] ' : '';
        const age = Math.floor((Date.now() - mem.createdAt) / (60 * 1000));
        const ageStr = age < 60 ? `${age}m ago` : `${Math.floor(age / 60)}h ago`;

        if (mem.type === 'interaction' && mem.data.username) {
          let memStr = `${clarity}${mem.data.username} said "${mem.data.message}" (${ageStr})`;
          if (mem.distorted) {
            memStr += ` [Memory might be distorted: ${mem.distortionType}]`;
          }
          context += `\n- ${memStr}`;
        }
      });
    }

    return context;
  }

  /**
   * Get relevant memories for current context
   */
  getRelevantMemories(username, topic, limit = 3) {
    const memoryArray = Array.from(this.memories.values())
      .filter(m => m.clarity > 0.3) // Filter out too-faded memories
      .sort((a, b) => b.lastRecalled - a.lastRecalled); // Most recently recalled first

    const relevant = [];

    // Prioritize memories about current user
    if (username) {
      const userMemories = memoryArray.filter(m =>
        m.type === 'interaction' && m.data.username === username
      ).slice(0, 2);
      relevant.push(...userMemories);
    }

    // Add topic-related memories
    if (topic && relevant.length < limit) {
      const topicMemories = memoryArray.filter(m =>
        m.data.topics && m.data.topics.includes(topic) && !relevant.includes(m)
      ).slice(0, limit - relevant.length);
      relevant.push(...topicMemories);
    }

    // Fill remaining with recent memories
    if (relevant.length < limit) {
      const recentMemories = memoryArray
        .filter(m => !relevant.includes(m))
        .slice(0, limit - relevant.length);
      relevant.push(...recentMemories);
    }

    return relevant.slice(0, limit);
  }

  /**
   * Get stats
   */
  getStats() {
    const memoryArray = Array.from(this.memories.values());
    
    return {
      totalMemories: memoryArray.length,
      distortedMemories: memoryArray.filter(m => m.distorted).length,
      fadedMemories: memoryArray.filter(m => m.clarity < 0.5).length,
      averageClarity: memoryArray.reduce((sum, m) => sum + m.clarity, 0) / memoryArray.length || 1.0,
      oldestMemory: memoryArray.length > 0 
        ? Math.floor((Date.now() - Math.min(...memoryArray.map(m => m.createdAt))) / (60 * 60 * 1000))
        : 0
    };
  }
}

module.exports = MemoryDecay;
