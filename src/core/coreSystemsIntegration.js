/**
 * CORE SYSTEMS INTEGRATION WRAPPER
 * 
 * Drop this into chatBot.js to enable the new core systems.
 * Easy on/off toggle with USE_CORE_SYSTEMS flag.
 */

const BehaviorModifiers = require('./behaviorModifiers');
const MemoryCore = require('./memoryCore');
const RelationshipCore = require('./relationshipCore');
const ResponseShaper = require('./responseShaper');
const logger = require('../bot/logger');

class CoreSystemsIntegration {
  constructor() {
    this.enabled = process.env.USE_CORE_SYSTEMS === 'true';
    
    if (this.enabled) {
      this.memory = null;
      this.relationship = null;
      this.behavior = null; // Will be initialized later
      this.shaper = new ResponseShaper();
      
      logger.info('✨ [CoreSystems] Integration enabled');
    } else {
      logger.info('⚙️ [CoreSystems] Integration disabled (using old systems)');
    }
  }
  
  /**
   * Initialize - must be called before use
   */
  async initialize() {
    if (!this.enabled) return;
    
    try {
      this.memory = new MemoryCore();
      await this.memory.initialize();
      this.memory.startAutoSave();
      
      this.relationship = new RelationshipCore(this.memory);
      
      // Note: BehaviorModifiers needs needsSystem, moodTracker, mentalBreakSystem
      // For now, we'll pass null and let it use defaults
      this.behavior = new BehaviorModifiers(null, null, null);
      
      logger.info('✨ [CoreSystems] Initialized successfully');
    } catch (err) {
      logger.error('❌ [CoreSystems] Initialization failed:', err);
      this.enabled = false; // Fallback to old systems
    }
  }
  
  /**
   * Build context for a message (replaces 43+ system calls)
   */
  async buildContext(options) {
    if (!this.enabled) return null; // Use old systems
    
    const {
      platform,
      username,
      userMessage,
      mentalState = { tired: false, stressed: false, bored: false }
    } = options;
    
    try {
      // 1. Get memory context
      const memoryContext = this.memory.getRelevantContext({
        platform,
        username,
        message: userMessage,
        maxChars: platform === 'voice' ? 150 : 300
      });
      
      // 2. Update memory
      this.memory.addToContext(platform, username, userMessage, false);
      this.memory.updateUser(username, platform, userMessage);
      this.memory.updateConversationState(platform, this.memory.getCurrentTopic(platform));
      
      // 3. Get relationship modifiers
      const relationshipModifiers = this.relationship.getModifiers(username, userMessage);
      
      // 4. Compute behavior state
      const user = this.memory.getUser(username);
      const behaviorState = this.behavior.computeState({
        relationship: user,
        mentalState,
        timeOfDay: new Date().getHours(),
        platform,
        topic: this.memory.getCurrentTopic(platform),
        recentMessages: this.memory.getRecentContext(platform, 3, 100)
      });
      
      // 5. Build minimal context string
      const contextParts = [];
      
      if (memoryContext) contextParts.push(memoryContext);
      
      const behaviorCtx = this.behavior.toContextString(behaviorState);
      if (behaviorCtx) contextParts.push(behaviorCtx);
      
      const relationshipCtx = this.relationship.toContextString(username, userMessage, 80);
      if (relationshipCtx) contextParts.push(relationshipCtx);
      
      const finalContext = contextParts.join('\n\n');
      
      logger.info(`✨ [CoreSystems] Context built: ${finalContext.length} chars (Memory: ${memoryContext.length}, Behavior: ${behaviorCtx.length}, Relationship: ${relationshipCtx.length})`);
      
      return {
        context: finalContext,
        behaviorState,
        relationshipModifiers,
        user
      };
      
    } catch (err) {
      logger.error('❌ [CoreSystems] Context building failed:', err);
      return null; // Fallback to old systems
    }
  }
  
  /**
   * Get modified generation parameters
   */
  getGenerationParams(behaviorState, baseParams) {
    if (!this.enabled || !behaviorState) return baseParams;
    
    return this.behavior.applyToGenerationParams(behaviorState, baseParams);
  }
  
  /**
   * Shape response for platform
   */
  shapeResponse(rawResponse, platform, behaviorState = null) {
    if (!this.enabled) return rawResponse; // No shaping
    
    try {
      const shaped = this.shaper.shape(rawResponse, platform, behaviorState);
      
      if (!shaped) {
        logger.warn('⚠️ [CoreSystems] Response rejected by shaper (stop sequence or invalid)');
        return null; // Signal to regenerate
      }
      
      return shaped;
      
    } catch (err) {
      logger.error('❌ [CoreSystems] Shaping failed:', err);
      return rawResponse; // Return raw if shaping fails
    }
  }
  
  /**
   * Update memory after Slunt responds
   */
  updateAfterResponse(platform, username, sluntResponse, userReaction = null) {
    if (!this.enabled) return;
    
    try {
      // Add to context
      this.memory.addToContext(platform, username, sluntResponse, true);
      
      // Learn from interaction
      this.relationship.learnFromInteraction(username, sluntResponse, userReaction);
      
    } catch (err) {
      logger.error('❌ [CoreSystems] Post-response update failed:', err);
    }
  }
  
  /**
   * Should respond? (engagement check)
   */
  shouldRespond(platform, behaviorState) {
    if (!this.enabled) return true; // Old system handles this
    
    return this.shaper.shouldRespond(platform, behaviorState);
  }
  
  /**
   * Get recommended response length
   */
  getRecommendedLength(platform, behaviorState = null) {
    if (!this.enabled) return null;
    
    return this.shaper.getRecommendedLength(platform, behaviorState);
  }
  
  /**
   * Add callback for later reference
   */
  addCallback(username, text, context, platform) {
    if (!this.enabled) return;
    
    this.memory.addCallback(username, text, context, platform);
  }
  
  /**
   * Add memorable moment
   */
  addMemorableMoment(username, moment, context, platform) {
    if (!this.enabled) return;
    
    if (!this.memory.memorableMoments) {
      this.memory.memorableMoments = [];
    }
    
    this.memory.memorableMoments.push({
      username,
      moment,
      context,
      platform,
      timestamp: Date.now()
    });
  }
  
  /**
   * Set topic expertise (for Slunt's knowledge)
   */
  setTopicExpertise(topic, confidence, facts = [], opinions = []) {
    if (!this.enabled) return;
    
    this.memory.setTopicExpertise(topic, confidence, facts, opinions);
  }
  
  /**
   * Add community slang
   */
  addSlang(platform, word) {
    if (!this.enabled) return;
    
    this.memory.addSlang(platform, word);
  }
  
  /**
   * Add running gag
   */
  addRunningGag(phrase, origin, usage) {
    if (!this.enabled) return;
    
    this.memory.addRunningGag(phrase, origin, usage);
  }
  
  /**
   * Get stats for debugging
   */
  getStats() {
    if (!this.enabled) return null;
    
    return {
      users: this.memory.users.size,
      topics: this.memory.topics.size,
      callbacks: this.memory.callbacks.length,
      dreams: this.memory.dreams.length,
      runningGags: this.memory.community.runningGags.length
    };
  }
}

// Export singleton
let instance = null;

async function getCoreSystemsIntegration() {
  if (!instance) {
    instance = new CoreSystemsIntegration();
    await instance.initialize();
  }
  return instance;
}

module.exports = {
  CoreSystemsIntegration,
  getCoreSystemsIntegration
};
