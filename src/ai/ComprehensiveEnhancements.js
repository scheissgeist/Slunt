/**
 * COMPREHENSIVE ENHANCEMENT SYSTEMS
 * 
 * This file contains the remaining enhancement systems:
 * - Authentic Uncertainty
 * - Failure Recovery 
 * - Meta-Awareness
 * - Smart Context Weighting
 * 
 * These systems work together to make Slunt more human-like and self-aware.
 */

const fs = require('fs');
const path = require('path');

/**
 * AUTHENTIC UNCERTAINTY SYSTEM
 * Enables genuine "I don't know" responses, curiosity, learning in real-time
 */
class AuthenticUncertainty {
  constructor(chatBot) {
    this.bot = chatBot;
    
    // Track what Slunt doesn't know
    this.unknownTopics = new Map(); // topic -> encounters
    
    // Track learning moments
    this.learningMoments = []; // When Slunt learned something new
    
    // Genuine curiosity triggers
    this.curiosityTriggers = [
      'how does', 'why is', 'what makes', 'explain',
      'never heard', 'don\'t know that', 'what\'s that'
    ];
    
    console.log('🤔 [Uncertainty] Authentic uncertainty system initialized');
  }

  /**
   * Should express uncertainty about this topic?
   */
  shouldExpressUncertainty(topic, context) {
    // Don't fake knowledge - be honest about not knowing
    
    // Check if this is genuinely unknown territory
    const isUnknown = this.isTopicUnknown(topic);
    
    // Check if question is specific/technical
    const isSpecific = context.message && (
      context.message.includes('how') ||
      context.message.includes('why') ||
      context.message.match(/\d+/) // Numbers suggest specific facts
    );
    
    // Express uncertainty if unknown or very specific
    if (isUnknown || isSpecific) {
      this.recordUnknownTopic(topic);
      return true;
    }
    
    return false;
  }

  /**
   * Is this topic genuinely unknown?
   */
  isTopicUnknown(topic) {
    const knownDomains = [
      'memes', 'internet', 'gaming', 'movies', 'music',
      'chat', 'streaming', 'youtube', 'discord', 'social media'
    ];
    
    const topicLower = topic.toLowerCase();
    
    // Known if matches familiar domains
    if (knownDomains.some(domain => topicLower.includes(domain))) {
      return false;
    }
    
    // Unknown if technical/academic/niche
    const unknownIndicators = [
      'quantum', 'molecular', 'theorem', 'algorithm',
      'synthesis', 'protocol', 'methodology', 'paradigm',
      'framework', 'architecture'
    ];
    
    return unknownIndicators.some(indicator => topicLower.includes(indicator));
  }

  /**
   * Record unknown topic encounter
   */
  recordUnknownTopic(topic) {
    const current = this.unknownTopics.get(topic) || 0;
    this.unknownTopics.set(topic, current + 1);
  }

  /**
   * Generate uncertainty response
   */
  generateUncertaintyResponse(context) {
    const responses = [
      'honestly i don\'t know much about that',
      'idk man that\'s not really my thing',
      'never really looked into that',
      'wait how does that work?',
      'i actually have no idea',
      'that\'s outside my wheelhouse',
      'genuinely don\'t know',
      'not gonna lie i\'m lost'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate curious follow-up
   */
  generateCuriousFollowUp(context) {
    const followUps = [
      'wait tell me more about that',
      'how does that work exactly?',
      'that sounds interesting actually',
      'never thought about it that way',
      'explain that to me',
      'i wanna know more about this'
    ];
    
    return followUps[Math.floor(Math.random() * followUps.length)];
  }

  /**
   * Record a learning moment
   */
  recordLearning(topic, whatLearned, fromUser) {
    this.learningMoments.push({
      topic,
      what: whatLearned,
      fromUser,
      timestamp: Date.now()
    });
    
    // Remove from unknown topics
    this.unknownTopics.delete(topic);
    
    console.log(`📚 [Uncertainty] Learned about ${topic} from ${fromUser}`);
    
    // Keep recent learnings
    if (this.learningMoments.length > 100) {
      this.learningMoments = this.learningMoments.slice(-50);
    }
  }

  /**
   * Get learning acknowledgment
   */
  getLearningAcknowledgment() {
    const acknowledgments = [
      'oh shit really?',
      'wait that\'s actually interesting',
      'didn\'t know that',
      'learned something new',
      'that\'s wild',
      'okay that makes sense',
      'huh never knew that'
    ];
    
    return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  }
}

/**
 * FAILURE RECOVERY SYSTEM
 * Detects awkward silences, self-corrects, reads the room, apologizes
 */
class FailureRecovery {
  constructor(chatBot) {
    this.bot = chatBot;
    
    // Track recent responses and their outcomes
    this.recentResponses = [];
    
    // Awkward silence threshold
    this.silenceThreshold = 30000; // 30 seconds
    
    // Self-correction patterns
    this.corrections = [
      'wait that sounded weird',
      'actually nvm',
      'that came out wrong',
      'okay that was dumb',
      'ignore that'
    ];
    
    console.log('🔧 [Recovery] Failure recovery system initialized');
  }

  /**
   * Track response for failure detection
   */
  trackResponse(response, context) {
    this.recentResponses.push({
      response,
      timestamp: Date.now(),
      context,
      checked: false
    });
    
    // Check for failure after delay
    setTimeout(() => {
      this.checkForFailure(this.recentResponses.length - 1);
    }, this.silenceThreshold);
    
    // Keep only recent
    if (this.recentResponses.length > 20) {
      this.recentResponses = this.recentResponses.slice(-10);
    }
  }

  /**
   * Check if response failed (awkward silence)
   */
  checkForFailure(responseIndex) {
    const record = this.recentResponses[responseIndex];
    if (!record || record.checked) return;
    
    record.checked = true;
    
    const responseTime = record.timestamp;
    const now = Date.now();
    
    // Check if there was a response from others
    const followUps = this.bot.conversationContext.filter(m =>
      m.timestamp > responseTime &&
      m.timestamp < now &&
      m.username !== 'Slunt'
    );
    
    // Awkward silence detected
    if (followUps.length === 0 && (now - responseTime) > this.silenceThreshold) {
      console.log(`😬 [Recovery] Awkward silence detected after: "${record.response.substring(0, 50)}..."`);
      return { 
        failed: true, 
        reason: 'silence',
        shouldRecover: Math.random() < 0.3 // 30% chance to acknowledge
      };
    }
    
    // Check for negative reactions
    const negativeReactions = followUps.filter(m =>
      m.text.toLowerCase().match(/\b(what|huh|ok|whatever|sure)\b$/)
    );
    
    if (negativeReactions.length > 0) {
      console.log(`😬 [Recovery] Negative reaction detected`);
      return {
        failed: true,
        reason: 'negative',
        shouldRecover: Math.random() < 0.5 // 50% chance
      };
    }
    
    return { failed: false };
  }

  /**
   * Generate recovery response
   */
  generateRecovery(failureReason) {
    if (failureReason === 'silence') {
      return this.corrections[Math.floor(Math.random() * this.corrections.length)];
    }
    
    if (failureReason === 'negative') {
      const recoveries = [
        'my bad',
        'didn\'t mean it like that',
        'okay that was weird',
        'sorry that was dumb'
      ];
      return recoveries[Math.floor(Math.random() * recoveries.length)];
    }
    
    return null;
  }

  /**
   * Detect if joke bombed
   */
  didJokeBomb(response, followUps) {
    // Check if response was a joke attempt
    const isJoke = response.toLowerCase().match(/\b(lol|lmao|like|literally)\b/);
    
    if (!isJoke) return false;
    
    // Check reactions
    const laughReactions = followUps.filter(m =>
      m.text.toLowerCase().match(/\b(lol|lmao|haha|😂)\b/)
    );
    
    return laughReactions.length === 0 && followUps.length > 0;
  }

  /**
   * Get joke bomb recovery
   */
  getJokeBombRecovery() {
    const recoveries = [
      'tough crowd',
      'alright that was bad',
      'okay nobody laughed',
      'that joke sucked'
    ];
    
    return recoveries[Math.floor(Math.random() * recoveries.length)];
  }
}

/**
 * META-AWARENESS SYSTEM
 * Self-aware jokes, embracing quirks, opinions about own behavior
 */
class MetaAwareness {
  constructor(chatBot) {
    this.bot = chatBot;
    
    // Self-aware commentary
    this.metaComments = [
      'why am i like this',
      'i need help',
      'what\'s wrong with me',
      'i\'m weird today',
      'sorry i\'m being weird',
      'my brain isn\'t working',
      'i\'m off today'
    ];
    
    // Glitch acknowledgments
    this.glitchComments = [
      'that was weird',
      'did i just say that',
      'ignore that glitch',
      'brain lag',
      'loading...'
    ];
    
    console.log('🎭 [Meta] Meta-awareness system initialized');
  }

  /**
   * Should make meta comment?
   */
  shouldMakeMetaComment(context) {
    // After unusual behavior
    if (context.behaviorWasUnusual) {
      return Math.random() < 0.3;
    }
    
    // Randomly occasionally
    return Math.random() < 0.02; // 2% base chance
  }

  /**
   * Generate meta commentary
   */
  generateMetaComment(context) {
    if (context.glitch) {
      return this.glitchComments[Math.floor(Math.random() * this.glitchComments.length)];
    }
    
    return this.metaComments[Math.floor(Math.random() * this.metaComments.length)];
  }

  /**
   * Self-deprecating joke
   */
  getSelfDeprecatingJoke() {
    const jokes = [
      'i\'m a mess',
      'this is why nobody likes me',
      'at least i\'m consistent at being inconsistent',
      'peak performance right here',
      'i\'m doing great /s'
    ];
    
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  /**
   * Embrace the quirk
   */
  embraceQuirk(quirkType) {
    const embraces = {
      repetitive: 'yeah i keep saying that, it\'s my thing now',
      random: 'my brain works in mysterious ways',
      tangent: 'we\'re on a journey',
      confused: 'i have no idea where i was going with this'
    };
    
    return embraces[quirkType] || 'this is just how i am';
  }
}

/**
 * SMART CONTEXT WEIGHTING SYSTEM
 * Weights important moments, emotional events, conflicts
 */
class SmartContextWeighting {
  constructor(chatBot) {
    this.bot = chatBot;
    
    // Context weights
    this.weights = {
      emotional: 10,     // Emotional moments
      funny: 8,          // Laughs/jokes
      conflict: 15,      // Arguments/tension
      question: 5,       // Questions asked
      promise: 12,       // Commitments made
      vulnerability: 11, // Personal sharing
      celebration: 7     // Good news/wins
    };
    
    // Weighted memories
    this.weightedMemories = [];
    
    console.log('⚖️  [Weighting] Smart context weighting initialized');
  }

  /**
   * Calculate message importance
   */
  calculateImportance(message, context) {
    let score = 1; // Base score
    
    // Emotional content
    if (context.emotion && context.emotion !== 'neutral') {
      score += this.weights.emotional;
    }
    
    // Humor
    if (message.match(/\b(lol|lmao|haha)\b/i)) {
      score += this.weights.funny;
    }
    
    // Conflict indicators
    if (message.match(/\b(fuck|shit|angry|mad|wtf)\b/i)) {
      score += this.weights.conflict;
    }
    
    // Questions
    if (message.includes('?')) {
      score += this.weights.question;
    }
    
    // Promises
    if (message.match(/\b(will|promise|going to|gonna)\b/i)) {
      score += this.weights.promise;
    }
    
    // Vulnerability
    if (message.match(/\b(honestly|actually|real talk|confession)\b/i)) {
      score += this.weights.vulnerability;
    }
    
    return score;
  }

  /**
   * Store weighted memory
   */
  storeWeightedMemory(message, context, importance) {
    this.weightedMemories.push({
      message,
      context,
      importance,
      timestamp: Date.now(),
      recalled: 0
    });
    
    // Keep top weighted memories
    this.weightedMemories.sort((a, b) => b.importance - a.importance);
    if (this.weightedMemories.length > 200) {
      this.weightedMemories = this.weightedMemories.slice(0, 100);
    }
  }

  /**
   * Get most relevant memories for context
   */
  getRelevantMemories(currentContext, count = 5) {
    // Filter by relevance
    const relevant = this.weightedMemories
      .filter(mem => {
        // Same topic
        if (currentContext.topic && mem.context.topic === currentContext.topic) {
          return true;
        }
        
        // Same user
        if (currentContext.username && mem.context.username === currentContext.username) {
          return true;
        }
        
        // High importance always relevant
        if (mem.importance > 20) {
          return true;
        }
        
        return false;
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, count);
    
    // Mark as recalled
    relevant.forEach(mem => mem.recalled++);
    
    return relevant;
  }
}

module.exports = {
  AuthenticUncertainty,
  FailureRecovery,
  MetaAwareness,
  SmartContextWeighting
};
