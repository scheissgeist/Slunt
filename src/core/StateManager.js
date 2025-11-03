const DataValidator = require('../services/DataValidator');
const path = require('path');

/**
 * StateManager - Manages bot state persistence with validation
 * Extracted from chatBot.js for better separation of concerns
 */
class StateManager {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.validator = new DataValidator(dataDir);
    this.state = {
      userProfiles: new Map(),
      memories: [],
      relationships: {},
      cognitiveState: {},
      conversations: {},
      reputations: {}
    };
  }

  /**
   * Load all state from disk
   */
  async loadAll() {
    console.log('💾 Loading bot state...');

    try {
      // Load memory systems
      this.state.memories = this.validator.safeLoad('memory_long_term.json', []);
      const midTerm = this.validator.safeLoad('memory_mid_term.json', []);
      const shortTerm = this.validator.safeLoad('memory_short_term.json', []);

      // Load chat learning
      const chatLearning = this.validator.safeLoad('chat_learning.json', {
        patterns: {},
        responses: {}
      });

      // Load relationships
      this.state.relationships = this.validator.safeLoad('relationships.json', {});

      // Load cognitive state
      this.state.cognitiveState = this.validator.safeLoad('cognitive_state.json', {
        thoughts: [],
        careLevel: {},
        focus: 5,
        engagement: 5
      });

      // Load conversations
      this.state.conversations = this.validator.safeLoad('conversation_threads.json', {});

      // Load user reputations
      this.state.reputations = this.validator.safeLoad('user_reputations.json', {});

      // Convert user profiles array to Map if needed
      const profiles = this.validator.safeLoad('user_profiles.json', []);
      this.state.userProfiles = new Map(
        profiles.map(p => [p.username, p])
      );

      console.log('✅ State loaded successfully');
      console.log(`   Users: ${this.state.userProfiles.size}`);
      console.log(`   Memories: ${this.state.memories.length}`);
      console.log(`   Relationships: ${Object.keys(this.state.relationships).length}`);

      return this.state;

    } catch (error) {
      console.error('❌ Failed to load state:', error);
      throw error;
    }
  }

  /**
   * Save all state to disk with validation
   */
  async saveAll() {
    try {
      const startTime = Date.now();

      // Convert Map to array for JSON serialization
      const profilesArray = Array.from(this.state.userProfiles.values());

      // Save all state files
      const saves = [
        this.validator.safeSave('user_profiles.json', profilesArray),
        this.validator.safeSave('memory_long_term.json', this.state.memories),
        this.validator.safeSave('relationships.json', this.state.relationships),
        this.validator.safeSave('cognitive_state.json', this.state.cognitiveState),
        this.validator.safeSave('conversation_threads.json', this.state.conversations),
        this.validator.safeSave('user_reputations.json', this.state.reputations)
      ];

      const results = await Promise.all(saves);
      const failedCount = results.filter(r => !r).length;

      const duration = Date.now() - startTime;

      if (failedCount === 0) {
        console.log(`💾 State saved successfully (${duration}ms)`);
        return true;
      } else {
        console.warn(`⚠️  ${failedCount} saves failed`);
        return false;
      }

    } catch (error) {
      console.error('❌ Failed to save state:', error);
      return false;
    }
  }

  /**
   * Get user profile
   */
  getUserProfile(username) {
    return this.state.userProfiles.get(username);
  }

  /**
   * Set user profile
   */
  setUserProfile(username, profile) {
    this.state.userProfiles.set(username, profile);
  }

  /**
   * Add memory
   */
  addMemory(memory) {
    this.state.memories.push({
      ...memory,
      timestamp: Date.now()
    });
  }

  /**
   * Get memories
   */
  getMemories(filter = null) {
    if (!filter) return this.state.memories;

    return this.state.memories.filter(filter);
  }

  /**
   * Update relationship
   */
  updateRelationship(userId, data) {
    if (!this.state.relationships[userId]) {
      this.state.relationships[userId] = {};
    }
    Object.assign(this.state.relationships[userId], data);
  }

  /**
   * Get relationship
   */
  getRelationship(userId) {
    return this.state.relationships[userId] || null;
  }

  /**
   * Update cognitive state
   */
  updateCognitiveState(updates) {
    Object.assign(this.state.cognitiveState, updates);
  }

  /**
   * Get cognitive state
   */
  getCognitiveState() {
    return this.state.cognitiveState;
  }

  /**
   * Add conversation turn
   */
  addConversationTurn(threadId, turn) {
    if (!this.state.conversations[threadId]) {
      this.state.conversations[threadId] = {
        id: threadId,
        turns: [],
        startTime: Date.now()
      };
    }

    this.state.conversations[threadId].turns.push({
      ...turn,
      timestamp: Date.now()
    });
  }

  /**
   * Get conversation thread
   */
  getConversation(threadId) {
    return this.state.conversations[threadId] || null;
  }

  /**
   * Update user reputation
   */
  updateReputation(username, updates) {
    if (!this.state.reputations[username]) {
      this.state.reputations[username] = {
        username,
        score: 0,
        traits: []
      };
    }
    Object.assign(this.state.reputations[username], updates);
  }

  /**
   * Get user reputation
   */
  getReputation(username) {
    return this.state.reputations[username] || null;
  }

  /**
   * Validate all data files
   */
  validateDataFiles() {
    return this.validator.validateAllFiles();
  }

  /**
   * Clean up old corrupted files
   */
  cleanupCorruptedFiles() {
    this.validator.cleanupCorruptedFiles();
  }

  /**
   * Get state statistics
   */
  getStats() {
    return {
      users: this.state.userProfiles.size,
      memories: this.state.memories.length,
      relationships: Object.keys(this.state.relationships).length,
      conversations: Object.keys(this.state.conversations).length,
      reputations: Object.keys(this.state.reputations).length
    };
  }

  /**
   * Clear all state (for testing)
   */
  clearAll() {
    this.state.userProfiles.clear();
    this.state.memories = [];
    this.state.relationships = {};
    this.state.cognitiveState = {};
    this.state.conversations = {};
    this.state.reputations = {};
  }
}

module.exports = StateManager;
