/**
 * NEXT-LEVEL ENHANCEMENT SYSTEMS
 * 
 * 15 advanced systems to make Slunt dramatically more realistic:
 * 1. Adaptive Response Timing
 * 2. Conversation Energy Management
 * 3. Topic Exhaustion System
 * 4. Emotional Momentum
 * 5. Micro-Expression System
 * 6. Memory Fuzzing
 * 7. Social Calibration Loop
 * 8. Attention Fragmentation
 * 9. Conversation Investment Tracking
 * 10. Linguistic Mirror Matching
 * 11. Vulnerability Thresholds
 * 12. Context Window Limitations
 * 13. Competitive/Cooperative Dynamics
 * 14. Recommendation Quality Learning
 * 15. Seasonal/Temporal Personality Shifts
 */

const fs = require('fs');
const path = require('path');

/**
 * 1. ADAPTIVE RESPONSE TIMING
 * Dynamic typing speed based on message complexity, relationship, energy
 */
class AdaptiveResponseTiming {
  constructor(chatBot) {
    this.bot = chatBot;
    this.baseTypingSpeed = 50; // chars per second
    
    console.log('⏱️ [Timing] Adaptive response timing initialized');
  }

  /**
   * Calculate delay before responding
   */
  calculateDelay(message, context = {}) {
    const messageLength = message.length;
    const complexity = this.assessComplexity(message);
    const relationship = context.relationshipTier || 'stranger';
    const energy = context.energy || 75;
    
    // Base delay from typing speed
    let baseDelay = (messageLength / this.baseTypingSpeed) * 1000;
    
    // Complexity multiplier (simple=0.8x, complex=1.5x)
    const complexityMultiplier = 0.8 + (complexity * 0.7);
    
    // Relationship multiplier (close friend=0.7x, stranger=1.3x)
    const relationshipMultipliers = {
      closeFriend: 0.7,
      friend: 0.85,
      acquaintance: 1.0,
      stranger: 1.3
    };
    const relationshipMultiplier = relationshipMultipliers[relationship] || 1.0;
    
    // Energy multiplier (low energy = slower)
    const energyMultiplier = 0.7 + (energy / 100) * 0.6;
    
    // Calculate final delay
    let delay = baseDelay * complexityMultiplier * relationshipMultiplier * energyMultiplier;
    
    // Minimum 800ms, maximum 8000ms
    delay = Math.max(800, Math.min(8000, delay));
    
    // Add thinking pause for complex questions
    if (complexity > 0.7 && message.includes('?')) {
      delay += 1500; // Extra thinking time
    }
    
    return Math.floor(delay);
  }

  /**
   * Assess message complexity (0-1)
   */
  assessComplexity(message) {
    let complexity = 0.3; // Base
    
    // Long messages = more complex
    if (message.length > 100) complexity += 0.2;
    if (message.length > 200) complexity += 0.2;
    
    // Questions = more complex
    if (message.includes('?')) complexity += 0.2;
    
    // Multiple sentences = more complex
    const sentences = message.split(/[.!?]+/).length;
    if (sentences > 2) complexity += 0.1;
    
    // Technical words = more complex
    if (message.match(/\b(because|however|therefore|specifically|technically)\b/i)) {
      complexity += 0.2;
    }
    
    return Math.min(1, complexity);
  }

  /**
   * Add mid-response pauses (for long messages)
   */
  getMidResponsePauses(message) {
    const pauses = [];
    
    // Add pauses at sentence boundaries for long responses
    if (message.length > 100) {
      const sentences = message.split(/([.!?]+)/);
      let position = 0;
      
      for (let i = 0; i < sentences.length; i += 2) {
        position += sentences[i].length + (sentences[i + 1]?.length || 0);
        
        if (i > 0 && i < sentences.length - 2) {
          // 20% chance of pause between sentences
          if (Math.random() < 0.2) {
            pauses.push({
              position,
              duration: 300 + Math.random() * 500 // 300-800ms pause
            });
          }
        }
      }
    }
    
    return pauses;
  }
}

/**
 * 2. CONVERSATION ENERGY MANAGEMENT
 * Track conversation length and energy depletion
 */
class ConversationEnergyManagement {
  constructor(chatBot) {
    this.bot = chatBot;
    this.userConversationEnergy = new Map(); // username -> energy data
    this.depletionRate = 2; // Energy lost per response
    this.recoveryRate = 1; // Energy gained per minute of silence
    
    // Start recovery loop
    setInterval(() => this.recoverEnergy(), 60000);
    
    console.log('🔋 [Energy] Conversation energy management initialized');
  }

  /**
   * Get conversation energy with user
   */
  getEnergy(username) {
    if (!this.userConversationEnergy.has(username)) {
      this.userConversationEnergy.set(username, {
        energy: 100,
        messagesInConversation: 0,
        lastInteraction: Date.now()
      });
    }
    
    return this.userConversationEnergy.get(username);
  }

  /**
   * Deplete energy after responding
   */
  depleteEnergy(username, responseLength) {
    const data = this.getEnergy(username);
    
    // Deplete based on response effort
    const depletion = this.depletionRate + (responseLength / 100);
    data.energy = Math.max(0, data.energy - depletion);
    data.messagesInConversation++;
    data.lastInteraction = Date.now();
    
    // Check if need break
    if (data.energy < 20 && Math.random() < 0.3) {
      return { needsBreak: true, energy: data.energy };
    }
    
    return { needsBreak: false, energy: data.energy };
  }

  /**
   * Recover energy during silence
   */
  recoverEnergy() {
    const now = Date.now();
    
    for (const [username, data] of this.userConversationEnergy.entries()) {
      const minutesSinceInteraction = (now - data.lastInteraction) / 60000;
      
      if (minutesSinceInteraction > 1) {
        // Recover energy
        data.energy = Math.min(100, data.energy + this.recoveryRate * minutesSinceInteraction);
        
        // Reset conversation counter if long silence
        if (minutesSinceInteraction > 30) {
          data.messagesInConversation = 0;
        }
      }
    }
  }

  /**
   * Should respond based on energy?
   */
  shouldRespond(username, context) {
    const data = this.getEnergy(username);
    
    // Always respond to close friends even when tired
    if (context.relationshipTier === 'closeFriend') {
      return { allowed: true, reason: 'close friend' };
    }
    
    // Low energy = less likely to respond
    if (data.energy < 30 && Math.random() > (data.energy / 100)) {
      return { allowed: false, reason: 'too tired', energy: data.energy };
    }
    
    return { allowed: true, energy: data.energy };
  }

  /**
   * Get overall energy state across all conversations
   */
  getEnergyState() {
    // Calculate average energy across active conversations
    let totalEnergy = 0;
    let activeConversations = 0;
    const now = Date.now();
    
    for (const [username, data] of this.userConversationEnergy.entries()) {
      const minutesSinceInteraction = (now - data.lastInteraction) / 60000;
      
      // Only count conversations from last 10 minutes
      if (minutesSinceInteraction < 10) {
        totalEnergy += data.energy;
        activeConversations++;
      }
    }
    
    const currentEnergy = activeConversations > 0 ? totalEnergy / activeConversations : 100;
    
    return {
      currentEnergy,
      needsBreak: currentEnergy < 30,
      activeConversations
    };
  }

  /**
   * Get break message
   */
  getBreakMessage() {
    const messages = [
      'need a break brb',
      'gonna take a sec',
      'brb',
      'tired of talking rn',
      'give me a minute'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

/**
 * 3. TOPIC EXHAUSTION SYSTEM
 * Track topic frequency and reduce engagement
 */
class TopicExhaustionSystem {
  constructor(chatBot) {
    this.bot = chatBot;
    this.topicDiscussionCount = new Map(); // topic -> count
    this.topicLastDiscussed = new Map(); // topic -> timestamp
    this.exhaustionThreshold = 5; // Tired of topic after 5 discussions
    
    console.log('💬 [TopicExhaustion] Topic exhaustion system initialized');
  }

  /**
   * Record topic discussion
   */
  recordTopic(topic) {
    if (!topic) return;
    
    const normalized = topic.toLowerCase();
    
    this.topicDiscussionCount.set(
      normalized,
      (this.topicDiscussionCount.get(normalized) || 0) + 1
    );
    
    this.topicLastDiscussed.set(normalized, Date.now());
  }

  /**
   * Check if topic is exhausted
   */
  isTopicExhausted(topic) {
    if (!topic) return false;
    
    const normalized = topic.toLowerCase();
    const count = this.topicDiscussionCount.get(normalized) || 0;
    const lastDiscussed = this.topicLastDiscussed.get(normalized) || 0;
    const daysSince = (Date.now() - lastDiscussed) / (1000 * 60 * 60 * 24);
    
    // Topic freshness decays over time
    const effectiveCount = count * Math.max(0.3, 1 - (daysSince / 30));
    
    return effectiveCount > this.exhaustionThreshold;
  }

  /**
   * Get engagement level for topic (0-1)
   */
  getEngagement(topic) {
    if (!topic) return 1;
    
    const normalized = topic.toLowerCase();
    const count = this.topicDiscussionCount.get(normalized) || 0;
    
    // Exponential decay of engagement
    const engagement = Math.max(0.2, Math.exp(-count / 3));
    
    return engagement;
  }

  /**
   * Get exhaustion context for AI
   */
  getExhaustionContext(topics) {
    const exhaustedTopics = topics.filter(t => this.isTopicExhausted(t));
    
    if (exhaustedTopics.length === 0) return '';
    
    return `\n[TOPIC EXHAUSTION] You've talked about ${exhaustedTopics.join(', ')} many times before. Show less enthusiasm, give shorter responses, or try to change the subject.`;
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        topicDiscussionCount: Array.from(this.topicDiscussionCount.entries()),
        topicLastDiscussed: Array.from(this.topicLastDiscussed.entries())
      };
      
      const filePath = path.join(__dirname, '../../data/topic_exhaustion.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [TopicExhaustion] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/topic_exhaustion.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.topicDiscussionCount = new Map(data.topicDiscussionCount || []);
      this.topicLastDiscussed = new Map(data.topicLastDiscussed || []);
      
      console.log(`✅ [TopicExhaustion] Loaded ${this.topicDiscussionCount.size} topics`);
    } catch (error) {
      console.error('❌ [TopicExhaustion] Load error:', error.message);
    }
  }
}

/**
 * 4. EMOTIONAL MOMENTUM
 * Emotions persist and transition gradually
 */
class EmotionalMomentum {
  constructor(chatBot) {
    this.bot = chatBot;
    this.currentEmotion = 'neutral';
    this.emotionIntensity = 0.5; // 0-1
    this.emotionStartTime = Date.now();
    this.decayRate = 0.1; // Intensity lost per minute
    
    // Emotion transition rules (how easy to switch)
    this.transitionDifficulty = {
      happy: { angry: 0.8, sad: 0.6, excited: 0.3, neutral: 0.4 },
      angry: { happy: 0.7, sad: 0.4, frustrated: 0.2, neutral: 0.5 },
      sad: { happy: 0.8, angry: 0.5, tired: 0.3, neutral: 0.4 },
      excited: { happy: 0.2, tired: 0.6, neutral: 0.5 },
      neutral: {} // Easy to switch from neutral
    };
    
    // Start decay loop
    setInterval(() => this.decayEmotion(), 60000);
    
    console.log('🎭 [Momentum] Emotional momentum system initialized');
  }

  /**
   * Attempt to change emotion
   */
  changeEmotion(newEmotion, triggerIntensity = 0.7) {
    if (newEmotion === this.currentEmotion) {
      // Reinforce current emotion
      this.emotionIntensity = Math.min(1, this.emotionIntensity + triggerIntensity * 0.3);
      return { changed: false, emotion: this.currentEmotion, intensity: this.emotionIntensity };
    }
    
    // Check transition difficulty
    const difficulty = this.transitionDifficulty[this.currentEmotion]?.[newEmotion] || 0.5;
    const resistance = this.emotionIntensity * difficulty;
    
    // Strong triggers can overcome resistance
    if (triggerIntensity > resistance || this.currentEmotion === 'neutral') {
      // Transition to new emotion
      this.currentEmotion = newEmotion;
      this.emotionIntensity = triggerIntensity * 0.8; // Some dampening
      this.emotionStartTime = Date.now();
      
      console.log(`🎭 [Momentum] Emotion shift: ${this.currentEmotion} (${(this.emotionIntensity * 100).toFixed(0)}%)`);
      
      return { changed: true, emotion: this.currentEmotion, intensity: this.emotionIntensity };
    }
    
    // Resistance too high - emotion lingers
    return { changed: false, emotion: this.currentEmotion, intensity: this.emotionIntensity, resisted: newEmotion };
  }

  /**
   * Decay emotion intensity over time
   */
  decayEmotion() {
    if (this.currentEmotion === 'neutral') return;
    
    const minutesElapsed = (Date.now() - this.emotionStartTime) / 60000;
    
    // Decay intensity
    this.emotionIntensity = Math.max(0, this.emotionIntensity - (this.decayRate * minutesElapsed));
    
    // Return to neutral when intensity is low
    if (this.emotionIntensity < 0.2) {
      this.currentEmotion = 'neutral';
      this.emotionIntensity = 0.5;
      console.log('🎭 [Momentum] Returned to neutral state');
    }
  }

  /**
   * Get lingering effect for next N responses
   */
  getLingeringEffect() {
    if (this.emotionIntensity < 0.3) return null;
    
    const minutesSinceStart = (Date.now() - this.emotionStartTime) / 60000;
    const effectDuration = 3 + (this.emotionIntensity * 7); // 3-10 minutes
    
    if (minutesSinceStart < effectDuration) {
      return {
        emotion: this.currentEmotion,
        intensity: this.emotionIntensity,
        lingering: true
      };
    }
    
    return null;
  }

  /**
   * Get context for AI
   */
  getEmotionalContext() {
    const lingering = this.getLingeringEffect();
    
    if (!lingering) return '';
    
    const intensityDesc = lingering.intensity > 0.7 ? 'strongly' : lingering.intensity > 0.4 ? 'somewhat' : 'slightly';
    
    return `\n[EMOTIONAL STATE] You are currently feeling ${intensityDesc} ${lingering.emotion}. This emotion colors your responses. Don't instantly flip to a different mood.`;
  }
}

/**
 * 5. MICRO-EXPRESSION SYSTEM
 * Subtle tells in communication
 */
class MicroExpressionSystem {
  constructor(chatBot) {
    this.bot = chatBot;
    
    console.log('😶 [MicroExp] Micro-expression system initialized');
  }

  /**
   * Add micro-expressions based on context
   */
  addMicroExpressions(message, context = {}) {
    let modified = message;
    const emotion = context.emotion || 'neutral';
    const confidence = context.confidence || 0.7;
    const excitement = context.excitement || 0.5;
    
    // Hesitation for uncertainty (low confidence)
    if (confidence < 0.4 && Math.random() < 0.4) {
      // Add "..." at start or before uncertain statements
      if (Math.random() < 0.5) {
        modified = '...' + modified;
      } else {
        modified = modified.replace(/(\bi think\b|\bi guess\b|\bmaybe\b)/i, '...$1');
      }
    }
    
    // Nervous tics when anxious
    if (emotion === 'anxious' && Math.random() < 0.3) {
      const tics = ['um, ', 'uh, ', 'like, '];
      const tic = tics[Math.floor(Math.random() * tics.length)];
      
      // Insert tic somewhere in middle of message
      const words = modified.split(' ');
      const insertPos = Math.floor(words.length / 2);
      words.splice(insertPos, 0, tic);
      modified = words.join(' ');
    }
    
    // Confidence indicators (shorter, punchier when sure)
    if (confidence > 0.8 && message.length > 50) {
      // Trim qualifiers when very confident
      modified = modified.replace(/\b(i think|maybe|probably|kind of|sort of)\b/gi, '');
      modified = modified.replace(/\s+/g, ' ').trim();
    }
    
    // Excitement leakage (typos/caps despite trying to be cool)
    if (excitement > 0.7 && Math.random() < 0.2) {
      // Capitalize a random word
      const words = modified.split(' ');
      const randomIndex = Math.floor(Math.random() * words.length);
      words[randomIndex] = words[randomIndex].toUpperCase();
      modified = words.join(' ');
    }
    
    // Emotional punctuation leakage
    if (emotion === 'excited' && !modified.includes('!') && Math.random() < 0.4) {
      modified = modified.replace(/\.$/, '!');
    }
    
    return modified;
  }

  /**
   * Detect tells from user messages (for learning)
   */
  detectTells(message) {
    const tells = {
      uncertain: false,
      nervous: false,
      confident: false,
      excited: false
    };
    
    // Uncertainty tells
    if (message.match(/\.\.\.|maybe|i guess|not sure|idk/i)) {
      tells.uncertain = true;
    }
    
    // Nervous tells
    if (message.match(/\b(um|uh|like)\b/i)) {
      tells.nervous = true;
    }
    
    // Confidence tells
    if (message.length < 30 && !message.includes('?')) {
      tells.confident = true;
    }
    
    // Excitement tells
    if (message.match(/[A-Z]{2,}|!!+/)) {
      tells.excited = true;
    }
    
    return tells;
  }
}

module.exports = {
  AdaptiveResponseTiming,
  ConversationEnergyManagement,
  TopicExhaustionSystem,
  EmotionalMomentum,
  MicroExpressionSystem
};
