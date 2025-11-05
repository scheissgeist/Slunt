/**
 * RELATIONSHIP CORE - Social dynamics and what works with each user
 * 
 * Consolidates 8+ relationship systems into one clean interface.
 * Philosophy: Learn what works, adapt behavior accordingly.
 */

const logger = require('../bot/logger');

class RelationshipCore {
  constructor(memoryCore) {
    this.memory = memoryCore; // Access to user knowledge
    
    logger.info('🤝 [RelationshipCore] Initialized');
  }
  
  /**
   * ==========================================
   * RELATIONSHIP DYNAMICS
   * ==========================================
   */
  
  /**
   * Get relationship state with user
   */
  getRelationship(username) {
    const user = this.memory.getUser(username);
    
    return {
      tier: user.tier,
      vibe: user.vibe,
      tolerance: this.getTolerance(user),
      worksWith: user.worksWith,
      interactions: user.interactions
    };
  }
  
  /**
   * Get tolerance level (how much shit can I give them)
   */
  getTolerance(user) {
    // Strangers: low tolerance
    if (user.tier === 'stranger') return 0.3;
    
    // Acquaintances: medium tolerance
    if (user.tier === 'acquaintance') return 0.5;
    
    // Friends: high tolerance
    if (user.tier === 'friend') return 0.8;
    
    // Close friends: unlimited tolerance
    if (user.tier === 'close') return 1.0;
    
    return 0.5;
  }
  
  /**
   * Should roast this user?
   */
  shouldRoast(username, message) {
    const user = this.memory.getUser(username);
    const relationship = this.getRelationship(username);
    
    // Never roast strangers unprompted
    if (relationship.tier === 'stranger') return false;
    
    // Check if they like roasting
    if (user.worksWith.roasting < 0.4) return false;
    
    // Check if message is roast-worthy (setup)
    const isRoastable = /stupid|dumb|fail|mistake|wrong|forgot|oops/i.test(message);
    
    // High tolerance + roastable message = roast
    return relationship.tolerance > 0.6 && isRoastable && Math.random() < 0.3;
  }
  
  /**
   * Should be serious right now?
   */
  shouldBeSerious(username, message) {
    const user = this.memory.getUser(username);
    
    // Check if user likes serious mode
    if (user.worksWith.serious < 0.6) return false;
    
    // Detect serious topics
    const isSerious = /help|advice|serious|problem|worried|concerned|scared/i.test(message);
    
    return isSerious && Math.random() < 0.4;
  }
  
  /**
   * Adjust vulgarity for this user
   */
  getVulgarityMultiplier(username) {
    const user = this.memory.getUser(username);
    
    // User's preference
    const preference = user.worksWith.vulgar;
    
    // Strangers: tone it down
    if (user.tier === 'stranger') return preference * 0.5;
    
    // Friends: full vulgarity
    return preference;
  }
  
  /**
   * ==========================================
   * SOCIAL CALIBRATION
   * ==========================================
   */
  
  /**
   * Learn from interaction (what worked, what didn't)
   */
  learnFromInteraction(username, sluntResponse, userReaction = null) {
    const user = this.memory.getUser(username);
    
    // If user reacted positively, boost that style
    if (userReaction) {
      const positive = /lol|haha|lmao|good|nice|love|based/i.test(userReaction);
      const negative = /stop|cringe|stfu|shut up|annoying/i.test(userReaction);
      
      if (positive) {
        // What style did we use?
        if (/fuck|shit|damn/i.test(sluntResponse)) {
          user.worksWith.vulgar = Math.min(1.0, user.worksWith.vulgar + 0.05);
        }
        if (/conspiracy|government|they want/i.test(sluntResponse)) {
          user.worksWith.conspiracies = Math.min(1.0, user.worksWith.conspiracies + 0.05);
        }
      } else if (negative) {
        // Reduce that style
        if (/fuck|shit|damn/i.test(sluntResponse)) {
          user.worksWith.vulgar = Math.max(0.0, user.worksWith.vulgar - 0.1);
        }
      }
    }
  }
  
  /**
   * Is this user getting annoyed?
   */
  isGettingAnnoyed(username, platform) {
    const recentContext = this.memory.recentContext.get(platform) || [];
    const userMessages = recentContext.filter(m => m.user === username).slice(-5);
    
    // Check for annoyance signals
    const annoyanceCount = userMessages.filter(m => 
      /stop|stfu|shut up|annoying|leave me alone|go away/i.test(m.text)
    ).length;
    
    return annoyanceCount >= 2; // 2+ annoyed messages in last 5
  }
  
  /**
   * Should back off?
   */
  shouldBackOff(username, platform) {
    if (this.isGettingAnnoyed(username, platform)) {
      logger.info(`😬 [Relationship] ${username} getting annoyed, backing off`);
      return true;
    }
    
    // Check conversation depth - getting repetitive?
    const depth = this.memory.getTopicDepth(platform);
    if (depth > 12) {
      logger.info(`😴 [Relationship] Topic exhaustion, backing off`);
      return true;
    }
    
    return false;
  }
  
  /**
   * ==========================================
   * BANTER BALANCE
   * ==========================================
   */
  
  /**
   * Get banter intensity for this user
   */
  getBanterIntensity(username) {
    const user = this.memory.getUser(username);
    const relationship = this.getRelationship(username);
    
    // Base intensity from relationship tier
    let intensity = {
      stranger: 0.2,
      acquaintance: 0.4,
      friend: 0.7,
      close: 0.9
    }[relationship.tier] || 0.5;
    
    // Adjust for what works with this user
    intensity *= (user.worksWith.roasting + user.worksWith.vulgar) / 2;
    
    return Math.max(0.1, Math.min(1.0, intensity));
  }
  
  /**
   * Should match their energy?
   */
  shouldMatchEnergy(username, message) {
    // High energy message
    const isHighEnergy = /!{2,}|[A-Z]{4,}|lol|haha|lmao/i.test(message);
    
    // Low energy message
    const isLowEnergy = /\.\.\.|tired|bored|whatever|meh/i.test(message);
    
    return { isHighEnergy, isLowEnergy };
  }
  
  /**
   * ==========================================
   * CONTEXT BUILDING
   * ==========================================
   */
  
  /**
   * Get relationship modifiers for behavior system
   */
  getModifiers(username, message) {
    const relationship = this.getRelationship(username);
    const energy = this.shouldMatchEnergy(username, message);
    
    return {
      toleranceLevel: relationship.tolerance,
      vulgarityMultiplier: this.getVulgarityMultiplier(username),
      banterIntensity: this.getBanterIntensity(username),
      shouldRoast: this.shouldRoast(username, message),
      shouldBeSerious: this.shouldBeSerious(username, message),
      shouldBackOff: this.shouldBackOff(username, 'default'),
      matchHighEnergy: energy.isHighEnergy,
      matchLowEnergy: energy.isLowEnergy
    };
  }
  
  /**
   * Get minimal context string (only if notable)
   */
  toContextString(username, message, maxChars = 80) {
    const modifiers = this.getModifiers(username, message);
    const relationship = this.getRelationship(username);
    
    const parts = [];
    
    // Only inject if relationship is notable
    if (relationship.tier === 'close') {
      parts.push(`${username} is your close friend`);
    } else if (relationship.tier === 'stranger') {
      parts.push(`${username} is a stranger`);
    }
    
    // Only inject if modifiers are extreme
    if (modifiers.shouldBackOff) {
      parts.push('back off');
    }
    if (modifiers.shouldBeSerious) {
      parts.push('be serious');
    }
    if (modifiers.shouldRoast) {
      parts.push('roast them');
    }
    
    const context = parts.join(', ');
    return context.length > maxChars ? context.substring(0, maxChars) + '...' : context;
  }
}

module.exports = RelationshipCore;
