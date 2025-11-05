/**
 * SystemManager - Manages initialization and cleanup of all AI systems
 * Extracted from chatBot.js to reduce complexity and prevent memory leaks
 */
class SystemManager {
  constructor(container) {
    this.container = container;
    this.systems = new Map();
    this.intervals = [];
    this.timeouts = [];
  }

  /**
   * Initialize all AI systems
   */
  async initializeAll(chatBot) {
    console.log('🤖 Initializing AI systems...');

    try {
      // Core systems
      await this.initializeCoreSystems(chatBot);

      // Emotional systems
      await this.initializeEmotionalSystems(chatBot);

      // Memory systems
      await this.initializeMemorySystems(chatBot);

      // Personality systems
      await this.initializePersonalitySystems(chatBot);

      // Social systems
      await this.initializeSocialSystems(chatBot);

      // Behavioral systems
      await this.initializeBehavioralSystems(chatBot);

      // Feature systems
      await this.initializeFeatureSystems(chatBot);

      // Stability systems
      await this.initializeStabilitySystems(chatBot);

      console.log(`✅ Initialized ${this.systems.size} AI systems`);

      // Start periodic tasks
      this.startPeriodicTasks();

    } catch (error) {
      console.error('❌ Failed to initialize systems:', error);
      throw error;
    }
  }

  /**
   * Initialize core systems
   */
  async initializeCoreSystems(chatBot) {
    const AIEngine = require('../ai/aiEngine');
    const CognitiveEngine = require('../ai/CognitiveEngine');
    const AutonomousLife = require('../ai/AutonomousLife');

    this.register('aiEngine', new AIEngine());
    this.register('cognitiveEngine', new CognitiveEngine(chatBot));
    this.register('autonomousLife', new AutonomousLife(chatBot));
  }

  /**
   * Initialize emotional systems
   */
  async initializeEmotionalSystems(chatBot) {
    const EmotionalEngine = require('../ai/EmotionalEngine');
    const MoodTracker = require('../ai/MoodTracker');
    const DopamineSystem = require('../ai/DopamineSystem');
    const EmotionalIntelligence = require('../ai/EmotionalIntelligence');

    this.register('emotionalEngine', new EmotionalEngine(chatBot));
    this.register('moodTracker', new MoodTracker(chatBot));
    this.register('dopamineSystem', new DopamineSystem(chatBot));
    this.register('emotionalIntelligence', new EmotionalIntelligence(chatBot));
  }

  /**
   * Initialize memory systems
   */
  async initializeMemorySystems(chatBot) {
    const MemoryConsolidation = require('../ai/MemoryConsolidation');
    const MemoryDecay = require('../ai/MemoryDecay');
    const MemorySummarization = require('../ai/MemorySummarization');
    const ChatLearning = require('../ai/ChatLearning');
    const EventMemorySystem = require('../ai/EventMemorySystem');

    this.register('memoryConsolidation', new MemoryConsolidation(chatBot));
    this.register('memoryDecay', new MemoryDecay(chatBot));
    this.register('memorySummarization', new MemorySummarization(chatBot));
    this.register('chatLearning', new ChatLearning(chatBot));
    this.register('eventMemorySystem', new EventMemorySystem(chatBot));
  }

  /**
   * Initialize personality systems
   */
  async initializePersonalitySystems(chatBot) {
    const PersonalityEvolution = require('../ai/PersonalityEvolution');
    const PersonalityScheduler = require('../ai/PersonalityScheduler');
    const PersonalityModes = require('../ai/PersonalityModes');
    const PersonalityDrift = require('../ai/PersonalityDrift');
    const EmotionTiming = require('../ai/EmotionTiming');

    this.register('personalityEvolution', new PersonalityEvolution(chatBot));
    this.register('personalityScheduler', new PersonalityScheduler(chatBot));
    this.register('personalityModes', new PersonalityModes(chatBot));
    this.register('personalityDrift', new PersonalityDrift(chatBot));
    this.register('emotionTiming', new EmotionTiming(chatBot));
  }

  /**
   * Initialize social systems
   */
  async initializeSocialSystems(chatBot) {
    const SocialAwareness = require('../ai/SocialAwareness');
    const RelationshipMapping = require('../ai/RelationshipMapping');
    const UserReputationSystem = require('../ai/UserReputationSystem');
    const ParasocialTracker = require('../ai/ParasocialTracker');

    this.register('socialAwareness', new SocialAwareness(chatBot));
    this.register('relationshipMapping', new RelationshipMapping(chatBot));
    this.register('userReputationSystem', new UserReputationSystem(chatBot));
    this.register('parasocialTracker', new ParasocialTracker(chatBot));
  }

  /**
   * Initialize behavioral systems
   */
  async initializeBehavioralSystems(chatBot) {
    const DrunkMode = require('../ai/DrunkMode');
    const HighMode = require('../ai/HighMode');
    const AutismFixations = require('../ai/AutismFixations');
    const GrudgeSystem = require('../ai/GrudgeSystem');
    const ObsessionSystem = require('../ai/ObsessionSystem');
    const AddictionSystem = require('../ai/AddictionSystem');

    this.register('drunkMode', new DrunkMode(chatBot));
    this.register('highMode', new HighMode(chatBot));
    this.register('autismFixations', new AutismFixations(chatBot));
    this.register('grudgeSystem', new GrudgeSystem(chatBot));
    this.register('obsessionSystem', new ObsessionSystem(chatBot));
    this.register('addictionSystem', new AddictionSystem(chatBot));
  }

  /**
   * Initialize feature systems
   */
  async initializeFeatureSystems(chatBot) {
    const VideoCommentary = require('../ai/VideoCommentary');
    const MetaAwareness = require('../ai/MetaAwareness');
    const ConversationThreading = require('../ai/ConversationThreading');

    this.register('videoCommentary', new VideoCommentary(chatBot));
    this.register('metaAwareness', new MetaAwareness(chatBot));
    this.register('conversationThreading', new ConversationThreading(chatBot));
  }

  /**
   * Initialize stability systems
   */
  async initializeStabilitySystems(chatBot) {
    const MemoryManager = require('../stability/MemoryManager');
    const ErrorRecovery = require('../stability/ErrorRecovery');
    const ResponseQueue = require('../stability/ResponseQueue');

    this.register('memoryManager', new MemoryManager());
    this.register('errorRecovery', new ErrorRecovery(chatBot));
    this.register('responseQueue', new ResponseQueue());
  }

  /**
   * Register a system
   */
  register(name, instance) {
    this.systems.set(name, instance);
    this.container.registerSingleton(name, instance);
  }

  /**
   * Get a system by name
   */
  get(name) {
    return this.systems.get(name) || this.container.get(name);
  }

  /**
   * Start periodic tasks with proper cleanup tracking
   */
  startPeriodicTasks() {
    const config = require('../services/ConfigManager');

    // Memory consolidation
    const consolidationInterval = setInterval(() => {
      const consolidation = this.get('memoryConsolidation');
      if (consolidation && consolidation.consolidate) {
        consolidation.consolidate();
      }
    }, config.get('memory.consolidationIntervalMs'));
    this.intervals.push(consolidationInterval);

    // Personality mode check
    const personalityInterval = setInterval(() => {
      const scheduler = this.get('personalityScheduler');
      if (scheduler && scheduler.checkMode) {
        scheduler.checkMode();
      }
    }, config.get('personality.modeCheckIntervalMs'));
    this.intervals.push(personalityInterval);

    // Memory manager check
    const memoryInterval = setInterval(() => {
      const memoryManager = this.get('memoryManager');
      if (memoryManager && memoryManager.checkMemory) {
        memoryManager.checkMemory();
      }
    }, config.get('performance.memoryCheckIntervalMs'));
    this.intervals.push(memoryInterval);

    console.log(`⏱️  Started ${this.intervals.length} periodic tasks`);
  }

  /**
   * Cleanup all systems - CRITICAL for preventing memory leaks
   */
  async cleanup() {
    console.log('🧹 Cleaning up systems...');

    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals = [];

    // Clear all timeouts
    for (const timeout of this.timeouts) {
      clearTimeout(timeout);
    }
    this.timeouts = [];

    // Call cleanup on systems that have it
    for (const [name, system] of this.systems.entries()) {
      if (system && typeof system.cleanup === 'function') {
        try {
          await system.cleanup();
          console.log(`✅ Cleaned up: ${name}`);
        } catch (error) {
          console.error(`❌ Failed to cleanup ${name}:`, error);
        }
      }
    }

    // Clear systems
    this.systems.clear();

    console.log('✅ All systems cleaned up');
  }

  /**
   * Get all system names
   */
  listSystems() {
    return Array.from(this.systems.keys()).sort();
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      totalSystems: this.systems.size,
      activeIntervals: this.intervals.length,
      activeTimeouts: this.timeouts.length,
      systems: this.listSystems()
    };
  }
}

module.exports = SystemManager;
