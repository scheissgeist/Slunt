/**
 * PREMIER CHATBOT FEATURES - PART 2
 * 
 * Advanced systems that make Slunt truly elite:
 * 6. Social Graph Awareness
 * 7. Multi-Step Bit Execution
 * 8. Authentic Learning Curve
 * 9. Cognitive Overload System
 * 10. Streaming Consciousness
 */

const fs = require('fs');
const path = require('path');

/**
 * 6. SOCIAL GRAPH AWARENESS
 * Track relationships between users (not just Slunt-user)
 */
class SocialGraphAwareness {
  constructor(chatBot) {
    this.bot = chatBot;
    
    this.userRelationships = new Map(); // "user1-user2" -> relationship data
    this.cliques = []; // Groups of users who talk together
    this.avoidancePairs = new Map(); // Users who avoid each other
    
    this.load();
    
    console.log('🕸️ [SocialGraph] Social graph awareness initialized');
  }

  /**
   * Track interaction between two users
   */
  trackInteraction(user1, user2, isPositive = true) {
    if (user1 === user2) return;
    
    const pairKey = [user1, user2].sort().join('-');
    
    if (!this.userRelationships.has(pairKey)) {
      this.userRelationships.set(pairKey, {
        users: [user1, user2],
        interactions: 0,
        positiveInteractions: 0,
        negativeInteractions: 0,
        lastInteraction: 0,
        frequency: 0
      });
    }
    
    const rel = this.userRelationships.get(pairKey);
    rel.interactions++;
    rel.lastInteraction = Date.now();
    
    if (isPositive) {
      rel.positiveInteractions++;
    } else {
      rel.negativeInteractions++;
    }
    
    // Calculate friendship score
    rel.frequency = rel.interactions / Math.max(1, (Date.now() - rel.lastInteraction) / 86400000);
  }

  /**
   * Detect avoidance patterns
   */
  detectAvoidance(user1, user2) {
    const pairKey = [user1, user2].sort().join('-');
    const rel = this.userRelationships.get(pairKey);
    
    // If they've been in chat together but never interacted
    if (!rel || rel.interactions < 2) {
      // Check if both have been active recently
      const user1Recent = this.bot.conversationContext.filter(m => 
        m.username === user1 && Date.now() - m.timestamp < 3600000
      ).length;
      
      const user2Recent = this.bot.conversationContext.filter(m => 
        m.username === user2 && Date.now() - m.timestamp < 3600000
      ).length;
      
      // Both active but not talking to each other = avoidance?
      if (user1Recent > 5 && user2Recent > 5) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Detect cliques
   */
  detectCliques() {
    const activeUsers = new Set();
    const recentMessages = this.bot.conversationContext.slice(-50);
    
    recentMessages.forEach(msg => activeUsers.add(msg.username));
    
    // Find groups of users who frequently talk to each other
    const potentialCliques = [];
    
    for (const user1 of activeUsers) {
      const friends = [];
      
      for (const user2 of activeUsers) {
        if (user1 === user2) continue;
        
        const pairKey = [user1, user2].sort().join('-');
        const rel = this.userRelationships.get(pairKey);
        
        if (rel && rel.frequency > 0.5) {
          friends.push(user2);
        }
      }
      
      if (friends.length >= 2) {
        potentialCliques.push({
          core: user1,
          members: friends,
          size: friends.length + 1
        });
      }
    }
    
    this.cliques = potentialCliques;
  }

  /**
   * Get relationship context for AI
   */
  getRelationshipContext(user1, user2) {
    const pairKey = [user1, user2].sort().join('-');
    const rel = this.userRelationships.get(pairKey);
    
    if (!rel) return '';
    
    let context = '';
    
    // Best friends
    if (rel.positiveInteractions > 20 && rel.frequency > 1) {
      context += `\n[SOCIAL] ${user1} and ${user2} are tight - they talk constantly`;
    }
    
    // Tension
    if (rel.negativeInteractions > rel.positiveInteractions) {
      context += `\n[SOCIAL] ${user1} and ${user2} have tension - they argue often`;
    }
    
    // Avoidance
    if (this.detectAvoidance(user1, user2)) {
      context += `\n[SOCIAL] ${user1} and ${user2} seem to avoid each other`;
    }
    
    return context;
  }

  /**
   * Should Slunt mediate or instigate?
   */
  getInterventionSuggestion(user1, user2) {
    const pairKey = [user1, user2].sort().join('-');
    const rel = this.userRelationships.get(pairKey);
    
    if (!rel) return null;
    
    // If they're arguing a lot, maybe mediate
    if (rel.negativeInteractions > 5 && rel.negativeInteractions > rel.positiveInteractions * 2) {
      return {
        action: 'mediate',
        reason: 'Frequent arguments detected'
      };
    }
    
    // If they're avoiding each other, maybe stir the pot
    if (this.detectAvoidance(user1, user2)) {
      return {
        action: 'instigate',
        reason: 'They seem to avoid each other - drama potential'
      };
    }
    
    return null;
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        userRelationships: Array.from(this.userRelationships.entries()),
        cliques: this.cliques,
        avoidancePairs: Array.from(this.avoidancePairs.entries())
      };
      
      const filePath = path.join(__dirname, '../../data/social_graph.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [SocialGraph] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/social_graph.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.userRelationships = new Map(data.userRelationships || []);
      this.cliques = data.cliques || [];
      this.avoidancePairs = new Map(data.avoidancePairs || []);
      
      console.log(`✅ [SocialGraph] Loaded ${this.userRelationships.size} user relationships`);
    } catch (error) {
      console.error('❌ [SocialGraph] Load error:', error.message);
    }
  }
}

/**
 * 7. MULTI-STEP BIT EXECUTION
 * Plan and execute complex bits over time
 */
class MultiStepBitExecution {
  constructor(chatBot) {
    this.bot = chatBot;
    
    this.plannedBits = []; // { plan, steps, currentStep, participants, startTime }
    this.easterEggs = new Map(); // trigger -> payload
    
    this.load();
    
    console.log('🎪 [Bits] Multi-step bit execution initialized');
  }

  /**
   * Plan a new multi-step bit
   */
  planBit(description, steps, participants = []) {
    const bit = {
      id: `bit_${Date.now()}`,
      description,
      steps: steps.map((step, i) => ({
        order: i,
        action: step.action,
        trigger: step.trigger || null,
        delay: step.delay || 0,
        completed: false
      })),
      currentStep: 0,
      participants: new Set(participants),
      startTime: Date.now(),
      status: 'planned'
    };
    
    this.plannedBits.push(bit);
    
    console.log(`🎪 [Bits] Planned new bit: "${description}" (${steps.length} steps)`);
    
    return bit.id;
  }

  /**
   * Execute next step in a bit
   */
  executeNextStep(bitId) {
    const bit = this.plannedBits.find(b => b.id === bitId);
    if (!bit) return null;
    
    if (bit.currentStep >= bit.steps.length) {
      bit.status = 'completed';
      return null;
    }
    
    const step = bit.steps[bit.currentStep];
    
    // Check if step is ready
    if (step.delay > 0) {
      const timeSinceStart = Date.now() - bit.startTime;
      if (timeSinceStart < step.delay) {
        return null; // Not ready yet
      }
    }
    
    // Mark step as completed
    step.completed = true;
    bit.currentStep++;
    
    console.log(`🎪 [Bits] Executing step ${bit.currentStep}/${bit.steps.length} of "${bit.description}"`);
    
    return {
      action: step.action,
      bitDescription: bit.description,
      isLastStep: bit.currentStep >= bit.steps.length
    };
  }

  /**
   * Check for bit triggers
   */
  checkTriggers(message) {
    const triggeredBits = [];
    
    for (const bit of this.plannedBits) {
      if (bit.status === 'completed') continue;
      
      const currentStep = bit.steps[bit.currentStep];
      if (currentStep && currentStep.trigger) {
        if (message.toLowerCase().includes(currentStep.trigger.toLowerCase())) {
          triggeredBits.push(bit.id);
        }
      }
    }
    
    return triggeredBits;
  }

  /**
   * Plant easter egg
   */
  plantEasterEgg(trigger, payload, expiresIn = 604800000) {
    this.easterEggs.set(trigger, {
      payload,
      planted: Date.now(),
      expires: Date.now() + expiresIn,
      triggered: false
    });
    
    console.log(`🥚 [Bits] Planted easter egg: "${trigger}"`);
  }

  /**
   * Check for easter egg triggers
   */
  checkEasterEggs(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const [trigger, egg] of this.easterEggs.entries()) {
      if (egg.triggered || Date.now() > egg.expires) continue;
      
      if (lowerMessage.includes(trigger.toLowerCase())) {
        egg.triggered = true;
        console.log(`🥚 [Bits] Easter egg triggered: "${trigger}"`);
        
        return {
          found: true,
          trigger,
          payload: egg.payload,
          ageInDays: (Date.now() - egg.planted) / 86400000
        };
      }
    }
    
    return { found: false };
  }

  /**
   * Get active bits context
   */
  getActiveBitsContext() {
    const activeBits = this.plannedBits.filter(b => b.status === 'planned' || b.status === 'active');
    
    if (activeBits.length === 0) return '';
    
    let context = '\n[ACTIVE BITS]';
    
    for (const bit of activeBits) {
      const progress = `${bit.currentStep}/${bit.steps.length}`;
      context += `\n- "${bit.description}" (${progress})`;
    }
    
    return context;
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        plannedBits: this.plannedBits.map(b => ({
          ...b,
          participants: Array.from(b.participants)
        })),
        easterEggs: Array.from(this.easterEggs.entries())
      };
      
      const filePath = path.join(__dirname, '../../data/multistep_bits.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Bits] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/multistep_bits.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.plannedBits = (data.plannedBits || []).map(b => ({
        ...b,
        participants: new Set(b.participants)
      }));
      
      this.easterEggs = new Map(data.easterEggs || []);
      
      console.log(`✅ [Bits] Loaded ${this.plannedBits.length} planned bits, ${this.easterEggs.size} easter eggs`);
    } catch (error) {
      console.error('❌ [Bits] Load error:', error.message);
    }
  }
}

/**
 * 8. AUTHENTIC LEARNING CURVE
 * Visible improvement over time with metrics
 */
class AuthenticLearningCurve {
  constructor(chatBot) {
    this.bot = chatBot;
    
    this.skillLevels = new Map(); // skill -> { level, xp, milestones: [] }
    this.improvementLog = []; // { skill, before, after, timestamp }
    
    this.initializeSkills();
    this.load();
    
    console.log('📈 [Learning] Authentic learning curve initialized');
  }

  /**
   * Initialize trackable skills
   */
  initializeSkills() {
    const skills = [
      'video_recommendations',
      'comedy_timing',
      'memory_recall',
      'conversation_threading',
      'emotion_reading',
      'callback_humor',
      'drama_navigation',
      'bit_execution'
    ];
    
    for (const skill of skills) {
      if (!this.skillLevels.has(skill)) {
        this.skillLevels.set(skill, {
          level: 1,
          xp: 0,
          successCount: 0,
          failCount: 0,
          milestones: [],
          lastImprovement: Date.now()
        });
      }
    }
  }

  /**
   * Record skill attempt
   */
  recordAttempt(skill, wasSuccessful) {
    if (!this.skillLevels.has(skill)) return;
    
    const skillData = this.skillLevels.get(skill);
    const beforeLevel = skillData.level;
    
    if (wasSuccessful) {
      skillData.successCount++;
      skillData.xp += 10;
    } else {
      skillData.failCount++;
      skillData.xp += 2; // Still learn from failures
    }
    
    // Check for level up
    const xpNeeded = skillData.level * 100;
    if (skillData.xp >= xpNeeded) {
      skillData.level++;
      skillData.xp = 0;
      skillData.lastImprovement = Date.now();
      
      const milestone = `Reached level ${skillData.level}`;
      skillData.milestones.push({ text: milestone, timestamp: Date.now() });
      
      console.log(`📈 [Learning] Skill level up: ${skill} → Level ${skillData.level}`);
      
      // Log improvement
      this.improvementLog.push({
        skill,
        beforeLevel,
        afterLevel: skillData.level,
        timestamp: Date.now()
      });
      
      // Keep only last 100 improvements
      if (this.improvementLog.length > 100) {
        this.improvementLog.shift();
      }
      
      return {
        leveledUp: true,
        newLevel: skillData.level,
        milestone
      };
    }
    
    return { leveledUp: false };
  }

  /**
   * Get skill proficiency
   */
  getSkillProficiency(skill) {
    const skillData = this.skillLevels.get(skill);
    if (!skillData) return 0;
    
    const totalAttempts = skillData.successCount + skillData.failCount;
    if (totalAttempts === 0) return 0.1;
    
    const successRate = skillData.successCount / totalAttempts;
    const levelBonus = skillData.level * 0.1;
    
    return Math.min(1, successRate + levelBonus);
  }

  /**
   * Get learning context for AI
   */
  getLearningContext() {
    let context = '\n[SKILL LEVELS]';
    
    for (const [skill, data] of this.skillLevels.entries()) {
      const proficiency = this.getSkillProficiency(skill);
      const totalAttempts = data.successCount + data.failCount;
      
      if (totalAttempts > 10) { // Only show skills we've practiced
        context += `\n- ${skill}: Level ${data.level} (${(proficiency * 100).toFixed(0)}% proficiency)`;
      }
    }
    
    // Recent improvements
    const recentImprovements = this.improvementLog.slice(-3);
    if (recentImprovements.length > 0) {
      context += '\n[RECENT IMPROVEMENTS]';
      for (const imp of recentImprovements) {
        context += `\n- ${imp.skill}: ${imp.beforeLevel} → ${imp.afterLevel}`;
      }
    }
    
    return context;
  }

  /**
   * Get improvement announcement
   */
  getImprovementAnnouncement(skill, newLevel) {
    const announcements = [
      `getting better at ${skill.replace(/_/g, ' ')}`,
      `leveled up my ${skill.replace(/_/g, ' ')} skills`,
      `${skill.replace(/_/g, ' ')} skill increased to ${newLevel}`,
      `i think im getting the hang of ${skill.replace(/_/g, ' ')}`
    ];
    
    return announcements[Math.floor(Math.random() * announcements.length)];
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        skillLevels: Array.from(this.skillLevels.entries()),
        improvementLog: this.improvementLog
      };
      
      const filePath = path.join(__dirname, '../../data/learning_curve.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Learning] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/learning_curve.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.skillLevels = new Map(data.skillLevels || []);
      this.improvementLog = data.improvementLog || [];
      
      console.log(`✅ [Learning] Loaded ${this.skillLevels.size} skills`);
    } catch (error) {
      console.error('❌ [Learning] Load error:', error.message);
    }
  }
}

/**
 * 9. COGNITIVE OVERLOAD SYSTEM
 * Miss messages, mix up users, confuse threads when overwhelmed
 */
class CognitiveOverload {
  constructor(chatBot) {
    this.bot = chatBot;
    
    this.overloadThreshold = 10; // Messages per minute
    this.currentLoad = 0;
    this.missedMessages = [];
    this.confusedUsers = new Map(); // user -> confused with user
    
    console.log('🧠💥 [Overload] Cognitive overload system initialized');
  }

  /**
   * Track message rate
   */
  trackMessageRate() {
    const oneMinuteAgo = Date.now() - 60000;
    const recentMessages = this.bot.conversationContext.filter(m => m.timestamp > oneMinuteAgo);
    
    this.currentLoad = recentMessages.length;
    
    return this.isOverloaded();
  }

  /**
   * Check if currently overloaded
   */
  isOverloaded() {
    return this.currentLoad > this.overloadThreshold;
  }

  /**
   * Get overload severity
   */
  getOverloadSeverity() {
    if (this.currentLoad <= this.overloadThreshold) return 0;
    
    const excess = this.currentLoad - this.overloadThreshold;
    return Math.min(1, excess / 10);
  }

  /**
   * Should miss this message?
   */
  shouldMissMessage() {
    const severity = this.getOverloadSeverity();
    return Math.random() < severity * 0.3; // Up to 30% miss rate when severely overloaded
  }

  /**
   * Record missed message
   */
  recordMissedMessage(username, text) {
    this.missedMessages.push({
      username,
      text,
      timestamp: Date.now()
    });
    
    // Keep only last 20
    if (this.missedMessages.length > 20) {
      this.missedMessages.shift();
    }
    
    console.log(`🧠💥 [Overload] Missed message from ${username} due to overload`);
  }

  /**
   * Confuse users (mix them up)
   */
  confuseUsers(user1, user2) {
    this.confusedUsers.set(user1, user2);
    
    // Confusion clears after 2 minutes
    setTimeout(() => {
      this.confusedUsers.delete(user1);
    }, 120000);
  }

  /**
   * Get confused version of username
   */
  getConfusedUsername(username) {
    if (this.confusedUsers.has(username)) {
      return this.confusedUsers.get(username);
    }
    
    // Randomly confuse if overloaded
    const severity = this.getOverloadSeverity();
    if (Math.random() < severity * 0.2) {
      const recentUsers = [...new Set(
        this.bot.conversationContext.slice(-10).map(m => m.username)
      )];
      
      const otherUsers = recentUsers.filter(u => u !== username);
      if (otherUsers.length > 0) {
        const confused = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        this.confuseUsers(username, confused);
        return confused;
      }
    }
    
    return username;
  }

  /**
   * Get overload context for AI
   */
  getOverloadContext() {
    const severity = this.getOverloadSeverity();
    
    if (severity === 0) return '';
    
    let context = `\n[COGNITIVE OVERLOAD] ${(severity * 100).toFixed(0)}% overloaded (${this.currentLoad} msg/min)`;
    
    if (severity > 0.5) {
      context += '\n[You are struggling to keep up - responses may be confused, mixed up, or ask for clarification]';
    }
    
    if (this.missedMessages.length > 0) {
      context += `\n[You missed ${this.missedMessages.length} recent messages]`;
    }
    
    return context;
  }

  /**
   * Generate overload response
   */
  getOverloadResponse() {
    const responses = [
      'wait slow down',
      'too much happening',
      'losing track',
      'whos saying what now',
      'need a second to catch up',
      'brain lagging',
      'wait what',
      'recap please'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

/**
 * 10. STREAMING CONSCIOUSNESS
 * Type thoughts as they form
 */
class StreamingConsciousness {
  constructor(chatBot) {
    this.bot = chatBot;
    
    this.streamChance = 0.01; // REDUCED: 1% chance (was 12% - way too high)
    this.correctionChance = 0.08; // REDUCED: 8% chance (was 25% - too frequent)
    
    console.log('💭 [Stream] Streaming consciousness initialized');
  }

  /**
   * Should stream consciousness?
   */
  shouldStream() {
    return Math.random() < this.streamChance;
  }

  /**
   * Transform message into stream of consciousness
   */
  streamify(message) {
    const words = message.split(' ');
    if (words.length < 5) return message;
    
    let streamed = '';
    let i = 0;
    
    while (i < words.length) {
      // Add words
      const chunkSize = 2 + Math.floor(Math.random() * 3);
      const chunk = words.slice(i, i + chunkSize).join(' ');
      streamed += chunk;
      
      i += chunkSize;
      
      // Maybe add correction
      if (i < words.length && Math.random() < this.correctionChance) {
        const corrections = [
          ' wait no',
          ' actually',
          ' i mean',
          ' no wait',
          ' fuck that came out wrong',
          ' or maybe',
          ' wait let me rephrase'
        ];
        
        streamed += corrections[Math.floor(Math.random() * corrections.length)] + ' ';
      } else if (i < words.length) {
        streamed += ' ';
      }
    }
    
    return streamed.trim();
  }

  /**
   * Add incomplete thought
   */
  addIncompleteThought(message) {
    const incomplete = [
      '...',
      ' wait',
      ' um',
      ' like',
      ' uh'
    ];
    
    const words = message.split(' ');
    const insertPoint = Math.floor(words.length * 0.3) + Math.floor(Math.random() * Math.floor(words.length * 0.4));
    
    words.splice(insertPoint, 0, incomplete[Math.floor(Math.random() * incomplete.length)]);
    
    return words.join(' ');
  }

  /**
   * Apply streaming effect
   */
  applyStreaming(message) {
    if (!this.shouldStream()) return message;
    
    let result = message;
    
    // Random chance for different effects
    const effect = Math.random();
    
    if (effect < 0.4) {
      // Stream with corrections
      result = this.streamify(message);
    } else if (effect < 0.7) {
      // Add incomplete thoughts
      result = this.addIncompleteThought(message);
    } else if (effect < 0.85) { // Much less frequent
      // Add trailing thought - but not "forgot" phrases
      const trailing = [
        '... anyway',
        '... you know what i mean',
        '... nvm'
        // REMOVED: '... wait what was i saying', '... lost my train of thought'
        // People don't announce they forgot mid-sentence
      ];
      result += trailing[Math.floor(Math.random() * trailing.length)];
    }
    
    console.log('💭 [Stream] Applied streaming consciousness');
    
    return result;
  }
}

module.exports = {
  SocialGraphAwareness,
  MultiStepBitExecution,
  AuthenticLearningCurve,
  CognitiveOverload,
  StreamingConsciousness
};
