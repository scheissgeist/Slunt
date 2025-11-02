const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const AIEngine = require('../ai/aiEngine');
const EmotionalEngine = require('../ai/EmotionalEngine');
const ProactiveFriendship = require('../ai/ProactiveFriendship');
const MemoryConsolidation = require('../ai/MemoryConsolidation');
const VideoLearning = require('../ai/VideoLearning');
const PersonalityEvolution = require('../ai/PersonalityEvolution');
const SocialAwareness = require('../ai/SocialAwareness');
const RelationshipMapping = require('../ai/RelationshipMapping');
const StyleMimicry = require('../ai/StyleMimicry');
const NicknameManager = require('../ai/NicknameManager');
const MoodTracker = require('../ai/MoodTracker');
const ResponseVariety = require('../ai/ResponseVariety');
const ContextualAwareness = require('../ai/ContextualAwareness');
const MentalStateTracker = require('../ai/MentalStateTracker');
const TypingSimulator = require('../ai/TypingSimulator');
const MemoryDecay = require('../ai/MemoryDecay');
const ObsessionSystem = require('../ai/ObsessionSystem');
const GrudgeSystem = require('../ai/GrudgeSystem');
const DrunkMode = require('../ai/DrunkMode');
const TheoryOfMind = require('../ai/TheoryOfMind');
const AutismFixations = require('../ai/AutismFixations');
const UmbraProtocol = require('../ai/UmbraProtocol');
const HipsterProtocol = require('../ai/HipsterProtocol');
const HeresUMode = require('../ai/HeresUMode');
const ActuallyMode = require('../ai/ActuallyMode');
const GhostingMechanic = require('../ai/GhostingMechanic');
const ImNotMadMode = require('../ai/ImNotMadMode');
const VideoCommentary = require('../ai/VideoCommentary');
const ChatLearning = require('../ai/ChatLearning');
const EmbarrassingItemRoast = require('../ai/EmbarrassingItemRoast');
const DynamicPhraseGenerator = require('../ai/DynamicPhraseGenerator');
const EdgyPersonality = require('../ai/EdgyPersonality');
const ReactionTracker = require('../ai/ReactionTracker');
const ConversationalPersonality = require('../ai/ConversationalPersonality');
const YouTubeSearch = require('../video/youtubeSearch');
const CoolPointsHandler = require('./coolPointsHandler');
const Responses = require('./ChatBotResponses');

// Monitoring Systems
const LogAnalyzer = require('../monitoring/LogAnalyzer');
const MetricsCollector = require('../monitoring/MetricsCollector');

// Stability Systems
const MemoryManager = require('../stability/MemoryManager');
const MemoryOptimizer = require('../stability/MemoryOptimizer');
const ErrorRecovery = require('../stability/ErrorRecovery');
const ConnectionResilience = require('../stability/ConnectionResilience');
const DatabaseSafety = require('../stability/DatabaseSafety');
const ResponseQueue = require('../stability/ResponseQueue');
const OllamaCircuitBreaker = require('../stability/OllamaCircuitBreaker');

// NEW Top 5 Priority Systems
const MemorySummarization = require('../ai/MemorySummarization');
const CommunityEvents = require('../ai/CommunityEvents');
const MetaAwareness = require('../ai/MetaAwareness');
const ContextualCallbacks = require('../ai/ContextualCallbacks');
const PersonalityModes = require('../ai/PersonalityModes');
const EmotionTiming = require('../ai/EmotionTiming');

// Advanced Feature Systems
const PersonalityScheduler = require('../ai/PersonalityScheduler');
const SentimentAnalyzer = require('../ai/SentimentAnalyzer');
const ClipCreator = require('../services/ClipCreator');
const StartupContinuity = require('../ai/StartupContinuity');

// NEW 9 Advanced Interaction Systems
const InnerMonologue = require('../ai/InnerMonologue');
const PersonalityBranching = require('../ai/PersonalityBranching');
const SocialInfluence = require('../ai/SocialInfluence');
const VideoQueueController = require('../ai/VideoQueueController');
const StorytellingEngine = require('../ai/StorytellingEngine');
const DebateMode = require('../ai/DebateMode');
const ExistentialCrisis = require('../ai/ExistentialCrisis');
const InsideJokeEvolution = require('../ai/InsideJokeEvolution');
const RivalBotDetector = require('../ai/RivalBotDetector');
const UserReputationSystem = require('../ai/UserReputationSystem');
const SluntDiary = require('../ai/SluntDiary');
const RumorMill = require('../ai/RumorMill');
const DreamSimulation = require('../ai/DreamSimulation');
const VictoryCelebration = require('../ai/VictoryCelebration');
const DopamineSystem = require('../ai/DopamineSystem');
const CoolholeTricks = require('../ai/CoolholeTricks');
const VideoDiscovery = require('../ai/VideoDiscovery');
const GoldSystem = require('../ai/GoldSystem');

// NEW 14 CONVERSATION ENHANCEMENT SYSTEMS 🚀💬✨
const DynamicResponseStyle = require('../ai/DynamicResponseStyle');
const QuestionHandler = require('../ai/QuestionHandler');
// ProactiveStarter: Using existing ProactiveStarters system instead
const ConversationDepth = require('../ai/ConversationDepth');
const TopicExpertise = require('../ai/TopicExpertise');
const EnhancedCallback = require('../ai/EnhancedCallback');
const EmotionalIntelligence = require('../ai/EmotionalIntelligence');
const BanterBalance = require('../ai/BanterBalance');
const StoryGenerator = require('../ai/StoryGenerator');
const CrossPlatformContinuity = require('../ai/CrossPlatformContinuity');
const HotTakeGenerator = require('../ai/HotTakeGenerator');
const BitCommitmentEnhancer = require('../ai/BitCommitment');
const ContextExpansion = require('../ai/ContextExpansion');
const PersonalityDrift = require('../ai/PersonalityDrift');

// NEW 18 CRAZY FEATURES 🎭🔥💀
const AddictionSystem = require('../ai/AddictionSystem');
const ConspiracyGenerator = require('../ai/ConspiracyGenerator');
const MemeLifecycleTracker = require('../ai/MemeLifecycleTracker');
const FalseMemorySystem = require('../ai/FalseMemorySystem');
const DreamHallucinationSystem = require('../ai/DreamHallucinationSystem');
const ParasocialTracker = require('../ai/ParasocialTracker');
const CelebrityCrushSystem = require('../ai/CelebrityCrushSystem');
const GossipRumorMill = require('../ai/GossipRumorMill');
const StreamSnipingDetector = require('../ai/StreamSnipingDetector');
const RivalBotWars = require('../ai/RivalBotWars');
const SluntCultSystem = require('../ai/SluntCultSystem');
const ChatTheaterMode = require('../ai/ChatTheaterMode');
const CollectiveUnconscious = require('../ai/CollectiveUnconscious');
const TimeLoopDetector = require('../ai/TimeLoopDetector');

// NEW CHAOS SYSTEMS 🎭
const PersonalitySplits = require('../ai/PersonalitySplits');
const ChaosEvents = require('../ai/ChaosEvents');
const MetaChatAwareness = require('../ai/MetaChatAwareness');
const SocialHierarchy = require('../ai/SocialHierarchy');
const VideoContextEngine = require('../ai/VideoContextEngine');
const InnerMonologueBroadcaster = require('../ai/InnerMonologueBroadcaster');
const EventMemorySystem = require('../ai/EventMemorySystem');
const VibeShifter = require('../ai/VibeShifter');
const PredictionEngine = require('../ai/PredictionEngine');
const BitCommitment = require('../ai/BitCommitment');
const PersonalityInfection = require('../ai/PersonalityInfection');

// NEW ADVANCED CONVERSATIONAL SYSTEMS 🚀
const ConversationThreads = require('../ai/ConversationThreads');
const DynamicEmotionResponses = require('../ai/DynamicEmotionResponses');
const UserVibesDetection = require('../ai/UserVibesDetection');
const CallbackHumorEngine = require('../ai/CallbackHumorEngine');
const ContradictionTracking = require('../ai/ContradictionTracking');
const ConversationalBoredom = require('../ai/ConversationalBoredom');
// NEW RIMWORLD-INSPIRED SYSTEMS 🎮
const NeedsSystem = require('../ai/NeedsSystem');
const MentalBreakSystem = require('../ai/MentalBreakSystem');

// Action Generator 🎭
const ActionGenerator = require('../ai/ActionGenerator');
const ThoughtSystem = require('../ai/ThoughtSystem');
const ToleranceSystem = require('../ai/ToleranceSystem');
const ScheduleSystem = require('../ai/ScheduleSystem');
const NeggingDetector = require('../ai/NeggingDetector');
const LandAcknowledgement = require('../ai/LandAcknowledgement');
const ResponseNoveltyChecker = require('../ai/ResponseNoveltyChecker');

// NEW COMPREHENSIVE IMPROVEMENT SYSTEMS 🚀✨
const ConversationThreading = require('../ai/ConversationThreading');
const ResponseScoring = require('../ai/ResponseScoring');
const SmartResponseTiming = require('../ai/ResponseTiming'); // Renamed to avoid conflict
const PersonalityLockIn = require('../ai/PersonalityLockIn');
const ConflictResolution = require('../ai/ConflictResolution');

// BRAIN-LIKE MEMORY ARCHITECTURE 🧠
const LongTermMemoryStorage = require('../ai/LongTermMemoryStorage');
const ContextManager = require('../ai/ContextManager');
const ResponseQualityEnhancer = require('../ai/ResponseQualityEnhancer');
const RateLimitingSystem = require('../ai/RateLimitingSystem');
const CrossPlatformIntelligence = require('../ai/CrossPlatformIntelligence');
const ProactiveStarters = require('../ai/ProactiveStarters');
const VideoReactionSystem = require('../ai/VideoReactionSystem');
const CorrectionLearning = require('../ai/CorrectionLearning');

const { 
  PeerInfluenceSystem, 
  QuestionChains, 
  SelfAwarenessConfusion, 
  EnergyMirroring, 
  ConversationalGoals 
} = require('../ai/AdvancedConversationalSystems');

// NEWEST ULTRA-REALISTIC SYSTEMS 🎭
const MoodContagion = require('../ai/MoodContagion');
const SleepDeprivation = require('../ai/SleepDeprivation');
const {
  SluntLore,
  OpinionFormation,
  StorytellingMode,
  InterestDecay,
  FalseMemories
} = require('../ai/PersonalitySystems');
const {
  PerformanceAnxiety,
  ChatRoleAwareness,
  ResponseTiming,
  MultiMessageResponse,
  ContextualMemoryRetrieval
} = require('../ai/BehavioralSystems');

/**
 * Helper to get timestamp for logs
 */
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * AI ChatBot class - Learns from conversations and interacts naturally
 */
class ChatBot extends EventEmitter {
  constructor(coolholeClient, videoManager) {
    super();
    this.coolhole = coolholeClient;
    this.videoManager = videoManager;
    this.coolPointsHandler = new CoolPointsHandler();
    this.emotionalEngine = new EmotionalEngine();
    this.youtubeSearch = new YouTubeSearch();

    // Initialize personality before AI systems (needed by PersonalityEvolution)
    this.personality = {
      humor: 0.9,
      edginess: 0.65,
      supportiveness: 0.7,
      intellectualness: 0.6,
      chaos: 0.55,
      formality: 0.2,
      enthusiasm: 0.75,
      sarcasm: 0.6,
      empathy: 0.7,
      boldness: 0.8,
      chattiness: 0.6,
      curiosity: 0.75,
      friendliness: 0.8,
      snarkiness: 0.65
    };

    // Initialize all AI systems
    this.dynamicPhraseGenerator = new DynamicPhraseGenerator(this); // MUST BE FIRST - others depend on it
    this.reactionTracker = new ReactionTracker(); // Track reactions to messages
    this.conversationalPersonality = new ConversationalPersonality(); // Make responses more natural
    this.styleMimicry = new StyleMimicry();
    this.moodTracker = new MoodTracker();
    this.responseVariety = new ResponseVariety();
    this.contextualAwareness = new ContextualAwareness();
    this.mentalStateTracker = new MentalStateTracker();
    this.typingSimulator = new TypingSimulator();
    this.memoryDecay = new MemoryDecay(this);
    this.obsessionSystem = new ObsessionSystem();
    this.grudgeSystem = new GrudgeSystem();
    this.drunkMode = new DrunkMode();
    this.theoryOfMind = new TheoryOfMind();
    this.autismFixations = new AutismFixations(this);
    this.umbraProtocol = new UmbraProtocol();
    this.hipsterProtocol = new HipsterProtocol(this);
    this.heresUMode = new HeresUMode(this);
    this.actuallyMode = new ActuallyMode(this);
    this.ghostingMechanic = new GhostingMechanic(this);
    this.imNotMadMode = new ImNotMadMode(this);
    this.embarrassingItemRoast = new EmbarrassingItemRoast(this);
    this.nicknameManager = new NicknameManager();
    this.edgyPersonality = new EdgyPersonality();

    // Advanced AI systems
    this.relationshipMapping = new RelationshipMapping();
    this.videoLearning = new VideoLearning();
    this.personalityEvolution = new PersonalityEvolution(this);
    this.socialAwareness = new SocialAwareness(this);
    this.proactiveFriendship = new ProactiveFriendship(this);
    this.memoryConsolidation = new MemoryConsolidation(this);
    this.memoryConsolidation.start(); // Start memory consolidation loop
    this.memoryConsolidation.loadLongTermMemory(); // Load saved memories

    // Top 5 Priority Systems
    this.memorySummarization = new MemorySummarization();
    this.communityEvents = new CommunityEvents();
    this.metaAwareness = new MetaAwareness();
    this.contextualCallbacks = new ContextualCallbacks();
    this.personalityModes = new PersonalityModes(this);
    this.emotionTiming = new EmotionTiming();
    this.startupContinuity = new StartupContinuity();

    // Advanced Feature Systems
    this.personalityScheduler = new PersonalityScheduler();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.clipCreator = null; // Initialized later with twitchClient

    // AI Engine (Optional - for advanced AI responses)
    this.ai = new AIEngine();

    // 9 Advanced Interaction Systems
    this.innerMonologue = new InnerMonologue();
    this.personalityBranching = new PersonalityBranching();
    this.socialInfluence = new SocialInfluence();
    this.videoQueueController = new VideoQueueController(this);
    this.videoCommentary = new VideoCommentary(this); // NEW: Spontaneous video reactions
    this.chatLearning = new ChatLearning(this); // NEW: Learn from ALL chat messages
    this.storytellingEngine = new StorytellingEngine();
    this.debateMode = new DebateMode();
    this.existentialCrisis = new ExistentialCrisis();
    this.insideJokeEvolution = new InsideJokeEvolution();
    this.rivalBotDetector = new RivalBotDetector();
    this.userReputationSystem = new UserReputationSystem();
    this.sluntDiary = new SluntDiary();
    this.rumorMill = new RumorMill();
    this.dreamSimulation = new DreamSimulation();
    this.victoryCelebration = new VictoryCelebration();
    this.dopamineSystem = new DopamineSystem();
    this.coolholeTricks = new CoolholeTricks();
    this.videoDiscovery = new VideoDiscovery(this);
    this.goldSystem = new GoldSystem(this);
    
    // NEW CHAOS SYSTEMS 🎭🌀
    console.log('🎭 [Chaos] Initializing chaos systems...');
    this.personalitySplits = new PersonalitySplits();
    this.chaosEvents = new ChaosEvents();
    this.metaChatAwareness = new MetaChatAwareness();
    this.socialHierarchy = new SocialHierarchy();
    this.videoContextEngine = new VideoContextEngine(null); // Will connect vision later
    this.innerMonologueBroadcaster = new InnerMonologueBroadcaster();
    this.eventMemorySystem = new EventMemorySystem();
    this.vibeShifter = new VibeShifter();
    this.predictionEngine = new PredictionEngine();
    this.bitCommitment = new BitCommitment();
    this.personalityInfection = new PersonalityInfection();
    console.log('✅ [Chaos] All chaos systems initialized!');
    
    // NEW 18 CRAZY FEATURES 🎭🔥💀
    console.log('🎭🔥💀 [CrazyFeatures] Initializing 18 crazy features...');
    this.addictionSystem = new AddictionSystem();
    this.conspiracyGenerator = new ConspiracyGenerator();
    this.memeLifecycleTracker = new MemeLifecycleTracker();
    this.falseMemorySystem = new FalseMemorySystem();
    this.dreamHallucinationSystem = new DreamHallucinationSystem();
    this.parasocialTracker = new ParasocialTracker();
    this.celebrityCrushSystem = new CelebrityCrushSystem();
    this.gossipRumorMill = new GossipRumorMill();
    this.streamSnipingDetector = new StreamSnipingDetector();
    this.rivalBotWars = new RivalBotWars();
    this.sluntCultSystem = new SluntCultSystem();
    this.chatTheaterMode = new ChatTheaterMode();
    this.collectiveUnconscious = new CollectiveUnconscious();
    this.timeLoopDetector = new TimeLoopDetector();
    console.log('✅ [CrazyFeatures] All 18 crazy features initialized!');
    console.log('   → Addiction: Attention/validation/caffeine tracking with withdrawal');
    console.log('   → Conspiracy: Paranoia & Mandela effect generation');
    console.log('   → Memes: Full lifecycle tracking with gatekeeping');
    console.log('   → False Memories: Gaslighting & memory corruption');
    console.log('   → Hallucinations: Dream logic & reality degradation');
    console.log('   → Parasocial: Attachment intensity & jealousy tracking');
    console.log('   → Celebrity Crush: Obsession phases & nervous behaviors');
    console.log('   → Gossip Mill: Relationship graphs & rumor propagation');
    console.log('   → Stream Sniping: Pattern detection for suspicious arrivals');
    console.log('   → Rival Bots: Bot detection & competitive warfare');
    console.log('   → Cult System: Faction management with devotion rituals');
    console.log('   → Chat Theater: Script generation & role assignment');
    console.log('   → Collective Unconscious: Zeitgeist & shared dreams');
    console.log('   → Time Loops: Déjà vu & temporal anomaly detection');
    
    // NEW RIMWORLD-INSPIRED SYSTEMS 🎮
    console.log('🎮 [RimWorld] Initializing RimWorld-inspired systems...');
    this.needsSystem = new NeedsSystem(this);
    this.mentalBreakSystem = new MentalBreakSystem(this);
    this.thoughtSystem = new ThoughtSystem(this);
    this.toleranceSystem = new ToleranceSystem(this);
    this.scheduleSystem = new ScheduleSystem(this);
    this.toleranceSystem.load(); // Load tolerance data
    console.log('✅ [RimWorld] All RimWorld systems initialized!');
    
    // Action Generator 🎭
    console.log('🎭 [Actions] Initializing action generator...');
    this.actionGenerator = new ActionGenerator(this);
    console.log('✅ [Actions] Action generator ready (12% chance, mood-based)');
    
    // Negging Detector 💔
    console.log('💔 [Negging] Initializing negging detector...');
    this.neggingDetector = new NeggingDetector(this);
    console.log('✅ [Negging] Negging detector ready - Slunt is now vulnerable to put-downs and dismissive comments');
    
    // Land Acknowledgement 🪶
    console.log('🪶 [LandAck] Initializing land acknowledgement system...');
    this.landAcknowledgement = new LandAcknowledgement(this);
    console.log('✅ [LandAck] Ready to occasionally acknowledge indigenous peoples (poorly)');
    
    // Response Novelty Checker 🔁
    console.log('🔁 [Novelty] Initializing response novelty checker...');
    this.noveltyChecker = new ResponseNoveltyChecker(this);
    console.log('✅ [Novelty] Preventing repetitive responses from 893+ memories');

    // NEW COMPREHENSIVE IMPROVEMENT SYSTEMS 🚀✨
    console.log('🚀✨ [Improvements] Initializing 5 comprehensive improvement systems...');
    this.conversationThreading = new ConversationThreading(this);
    this.responseScoring = new ResponseScoring();
    this.responseTiming = new SmartResponseTiming(); // Use new smart timing system
    this.personalityLockIn = new PersonalityLockIn();
    this.conflictResolution = new ConflictResolution();
    console.log('✅ [Improvements] All improvement systems initialized!');
    console.log('   → Threading: Multi-message context tracking & topic continuity');
    console.log('   → Scoring: Response quality evaluation (naturalness, relevance, originality)');
    console.log('   → Timing: Variable delays & smart rate limiting (1-20s)');
    console.log('   → Personality: 30-60min mode lock-ins (chill/edgy/chaotic/analytical/hype)');
    console.log('   → Conflict: Drama detection, tension tracking, intervention strategies');

    // Memory Pruning 🗑️
    console.log('🗑️  [Pruning] Initializing aggressive memory pruning...');
    const MemoryPruning = require('../ai/MemoryPruning');
    this.memoryPruning = new MemoryPruning(this);
    console.log('✅ [Pruning] Will keep memories under 600 (currently at 907+)');

    // Emote Discovery 😀
    console.log('😀 [Emotes] Initializing emote discovery system...');
    const EmoteDiscovery = require('../ai/EmoteDiscovery');
    this.emoteDiscovery = new EmoteDiscovery(this);
    console.log('✅ [Emotes] Passive learning from Twitch/Discord emotes');
    
    // BRAIN-LIKE MEMORY ARCHITECTURE 🧠
    console.log('🧠 [Memory] Initializing brain-like memory architecture...');
    this.longTermMemory = new LongTermMemoryStorage();
    this.longTermMemory.initialize(); // Load memory tiers
    this.contextManager = new ContextManager(this.longTermMemory, this.userProfiles); // Use userProfiles Map
    this.responseQuality = new ResponseQualityEnhancer();
    
    // NEW 14 CONVERSATION ENHANCEMENT SYSTEMS 🚀💬✨
    console.log('🚀💬✨ [Enhancement] Initializing 14 conversation enhancement systems...');
    this.dynamicStyle = new DynamicResponseStyle(this);
    this.questionHandler = new QuestionHandler(this);
    // ProactiveStarter: Using existing ProactiveStarters system (line 465) - removed duplicate
    this.conversationDepth = new ConversationDepth(this);
    this.topicExpertise = new TopicExpertise(this);
    this.enhancedCallback = new EnhancedCallback(this);
    this.emotionalIntel = new EmotionalIntelligence(this);
    this.banterBalance = new BanterBalance(this);
    this.storyGenerator = new StoryGenerator(this);
    this.crossPlatform = new CrossPlatformContinuity(this);
    this.hotTakes = new HotTakeGenerator(this);
    this.bitCommitmentEnhancer = new BitCommitmentEnhancer(this);
    this.contextExpansion = new ContextExpansion(this);
    this.personalityDrift = new PersonalityDrift(this);
    console.log('✅ [Enhancement] All 14 systems ready (ProactiveStarter using existing ProactiveStarters)!');
    console.log('   → Dynamic Style: Time/relationship/platform/energy adaptation');
    console.log('   → Question Handler: Forces real answers, no evasion');
    console.log('   → Proactive Starter: Breaks lulls with conversation starters');
    console.log('   → Conversation Depth: Multi-turn tracking (1-2 → 4-5 sentences)');
    console.log('   → Topic Expertise: Honest knowledge boundaries (memes=10, fashion=2)');
    console.log('   → Enhanced Callback: References past conversations with details');
    console.log('   → Emotional Intelligence: Mood detection and support');
    console.log('   → Banter Balance: Friendship-scaled roasting');
    console.log('   → Story Generator: Believable personal anecdotes');
    console.log('   → Cross-Platform: References across Discord/Twitch/Coolhole');
    console.log('   → Hot Takes: Controversial opinions and debate mode');
    console.log('   → Bit Commitment: Sticks to jokes longer');
    console.log('   → Context Expansion: 10-message window with smart filtering');
    console.log('   → Personality Drift: Opinions evolve over time');
    this.rateLimiting = new RateLimitingSystem();
    this.crossPlatform = new CrossPlatformIntelligence();
    this.conflictResolution = new ConflictResolution();
    console.log('✅ [Memory] Brain architecture initialized!');
    console.log('   → Long-term memory: Tiered storage with automatic migration');
    console.log('   → Context manager: Smart token budget (~2000 tokens)');
    console.log('   → Response quality: Dynamic temperature & style checking');
    console.log('   → Rate limiting: Intelligent cooldowns & lurk mode');
    console.log('   → Cross-platform: Unified profiles across Coolhole/Twitch/Discord');
    console.log('   → Conflict resolution: Detects contradictions & weighs reliability');
    
    // NEW ADVANCED CONVERSATIONAL SYSTEMS 🚀
    console.log('🚀 [Advanced] Initializing advanced conversational systems...');
    this.conversationThreads = new ConversationThreads(this);
    this.dynamicEmotionResponses = new DynamicEmotionResponses(this);
    this.dynamicEmotionResponses.setMentalStateTracker(this.mentalStateTracker); // Link after init
    this.userVibesDetection = new UserVibesDetection(this);
    this.callbackHumorEngine = new CallbackHumorEngine(this);
    this.contradictionTracking = new ContradictionTracking(this);
    this.conversationalBoredom = new ConversationalBoredom(this);
    this.peerInfluenceSystem = new PeerInfluenceSystem(this);
    this.questionChains = new QuestionChains(this);
    this.selfAwarenessConfusion = new SelfAwarenessConfusion(this);
    this.energyMirroring = new EnergyMirroring(this);
    this.conversationalGoals = new ConversationalGoals(this);
    console.log('✅ [Advanced] All 11 advanced systems initialized!');
    
    // NEWEST ULTRA-REALISTIC SYSTEMS 🎭
    console.log('🎭 [Ultra] Initializing ultra-realistic behavioral systems...');
    this.moodContagion = new MoodContagion(this);
    this.sleepDeprivation = new SleepDeprivation(this);
    this.sluntLore = new SluntLore(this);
    this.opinionFormation = new OpinionFormation(this);
    this.storytellingMode = new StorytellingMode(this);
    this.interestDecay = new InterestDecay(this);
    this.falseMemories = new FalseMemories(this);
    this.performanceAnxiety = new PerformanceAnxiety(this);
    this.chatRoleAwareness = new ChatRoleAwareness(this);
    // REMOVED OLD responseTiming - using new ResponseTiming system now
    this.multiMessageResponse = new MultiMessageResponse(this);
    this.contextualMemoryRetrieval = new ContextualMemoryRetrieval(this);
    this.proactiveStarters = new ProactiveStarters(this);
    this.videoReactionSystem = new VideoReactionSystem(this);
    this.correctionLearning = new CorrectionLearning(this);
    console.log('✅ [Ultra] All 15 ultra-realistic systems initialized!');
    
    // Initialize Monitoring Systems
    this.logAnalyzer = new LogAnalyzer();
    this.metricsCollector = new MetricsCollector();
    console.log('📊 [Monitoring] Log analyzer and metrics collector initialized!');
    
    // Initialize Stability Systems
    this.memoryManager = new MemoryManager(this);
    this.memoryOptimizer = new MemoryOptimizer(this);
    this.errorRecovery = ErrorRecovery;
    this.errorRecovery.initialize(this);
    this.connectionResilience = ConnectionResilience;
    this.databaseSafety = DatabaseSafety;
    this.responseQueueManager = new ResponseQueue();
    console.log('🛡️ [Stability] All stability systems initialized!');
    
    // Start stability monitoring
    this.memoryManager.start();
    this.memoryOptimizer.start();
    console.log('✅ [Stability] Memory manager started');
    console.log('✅ [Stability] Memory optimizer started');
    
    // Start advanced feature systems
    this.personalityScheduler.start();
    this.sentimentAnalyzer.start();
    console.log('🚀 [Features] Personality scheduler and sentiment analyzer started');
    
    this.chatStats = {
      totalMessages: 0,
      messagesSent: 0,
      questionsAsked: 0,
      activeUsers: new Set(),
      messagesByUser: new Map(),
      topicsDiscussed: new Map(),
      averageResponseTime: 2500
    };
    this.communityInsights = {
      popularTimes: new Map(),
      topicTrends: [],
      userRelationships: new Map(),
      conversationStarters: [],
      engagementMetrics: new Map()
    };
    this.pendingQuestions = [];
    this.lastQuestionTime = 0;
    this.memoryPath = path.resolve(process.cwd(), 'data', 'slunt_brain.json');
    this.lastSentAt = 0;
    this.lastIntendedMessage = null;
    
    // Response generation lock - prevents multiple simultaneous responses
    this.isGeneratingResponse = false;
    this.responseQueue = [];
    this.userProfiles = new Map();
    this.topicMemory = new Map();
    this.conversationContext = [];
    this.vocabulary = new Set();
    this.conversationPatterns = new Map();
    this.timePatterns = new Map();
    this.topicPatterns = new Map();
    this.interactionGraph = new Map();
    this.sluntEventLog = [];
    this.chatHistory = [];
    this.responsePatterns = new Map();
    this.conversationTriggers = new Set([
      'slunt', 'what do you think slunt', 'hey bot',
      'hey slunt', '@slunt', 'yo slunt'
    ]);
    
    // Circuit breaker for Ollama
    this.ollamaCircuitBreaker = new OllamaCircuitBreaker();
    console.log('🛡️ [CircuitBreaker] Initialized - AI failure protection active');

    // Rate limiter for Ollama
    const OllamaRateLimiter = require('../stability/OllamaRateLimiter');
    this.ollamaRateLimiter = new OllamaRateLimiter();
    console.log('🚦 [RateLimiter] Initialized - Max 10 concurrent AI requests');
    
    // Response deduplication - track recent phrases (not single words)
    this.recentResponses = []; // Store last 10 messages
    this.maxRecentResponses = 10;
    
    // Topic diversity - track recent topics to avoid obsessive repetition
    this.recentMentionedTopics = []; // Track last 5 topics Slunt mentioned
    this.maxRecentTopics = 5;
    
    // === PERIODIC TASKS FOR ADVANCED SYSTEMS 🚀 ===
    
    // Generate new conversational goals periodically (every 5 minutes)
    setInterval(() => {
      if (this.conversationalGoals.activeGoals.length < 2) {
        this.conversationalGoals.generateNewGoal({ 
          recentChat: this.chatHistory.slice(-10) 
        });
      }
    }, 5 * 60 * 1000);
    
    // Proactive callbacks and random interjections (every 3 minutes when bored)
    setInterval(async () => {
      if (this.conversationalBoredom.boredomLevel > 70 && Math.random() < 0.3) {
        const interjection = await this.conversationalBoredom.getRandomInterjection();
        if (interjection) {
          this.sendMessage(interjection);
        }
      }
    }, 3 * 60 * 1000);
    
    // Auto-save all session data every 5 minutes (safety backup)
    setInterval(async () => {
      try {
        console.log('💾 [Auto-save] Backing up session data...');
        await this.conversationThreads.save();
        await this.userVibesDetection.save();
        await this.callbackHumorEngine.save();
        await this.contradictionTracking.save();
        await this.conversationalBoredom.save();
        await this.peerInfluenceSystem.save();
        await this.conversationalGoals.save();
        await this.relationshipMapping.saveRelationships();
        await this.userReputationSystem.saveReputations();
        await this.sluntDiary.saveDiary();
        this.toleranceSystem.save(); // RimWorld: Save tolerance data
        
        // Brain architecture: Save all memory tiers and metadata
        await this.longTermMemory.save();
        await this.memoryConsolidation.saveEpisodicMemory();
        await this.memoryConsolidation.saveMemoryClusters();
        console.log('✅ [Auto-save] Session data backed up successfully');
      } catch (error) {
        console.error('❌ [Auto-save] Failed:', error.message);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Check for cross-platform user matches every 10 minutes
    setInterval(() => {
      try {
        console.log('🔍 [Cross-Platform] Scanning for cross-platform users...');
        const matches = this.relationshipMapping.findCrossPlatformMatches();
        
        if (matches.length > 0) {
          console.log(`🌐 [Cross-Platform] Found ${matches.length} potential matches:`);
          matches.forEach(match => {
            if (match.likelySamePerson) {
              console.log(`  ✅ ${match.username1}@${match.platform1} ≈ ${match.username2}@${match.platform2} (${Math.round(match.similarity * 100)}% similar)`);
            }
          });
        } else {
          console.log('  No cross-platform matches found');
        }
      } catch (error) {
        console.error('❌ [Cross-Platform] Matching failed:', error.message);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
    
    // DISABLED: Startup sequence slows boot and clutters chat
    // setTimeout(() => {
    //   this.startupSequence();
    // }, 1000);
    
    // Start proactive conversation monitoring
    setTimeout(() => {
      this.proactiveStarters.startMonitoring();
      console.log('🎭 [Proactive] Started monitoring for conversation opportunities');
    }, 60000); // Wait 1 minute after startup before beginning proactive behavior
    
    // Multi-platform support
    this.platformManager = null;
    this.currentPlatform = 'coolhole'; // Default platform
  }
  
  /**
   * Set the platform manager for multi-platform support
   */
  setPlatformManager(platformManager) {
    this.platformManager = platformManager;
    console.log('✅ [ChatBot] Platform manager configured');
  }
  
  /**
   * Connect vision analyzer for video reactions (ENHANCED - store reference)
   */
  connectVisionAnalyzer(visionAnalyzer) {
    // Store reference for direct access
    this.visionAnalyzer = visionAnalyzer;
    
    if (this.videoReactionSystem) {
      this.videoReactionSystem.connectVisionAnalyzer(visionAnalyzer);
      console.log('✅ [ChatBot] Vision analyzer connected with direct access');
    }
  }
  
  /**
   * Set rate limiter for spam protection
   */
  setRateLimiter(rateLimiter) {
    this.rateLimiter = rateLimiter;
    console.log('✅ [ChatBot] Rate limiter configured');
  }
  
  /**
   * Set content filter for TOS compliance
   */
  setContentFilter(contentFilter) {
    this.contentFilter = contentFilter;
    console.log('✅ [ChatBot] Content filter configured');
  }
  
  /**
   * Universal message handler for all platforms
   * Converts platform-specific messages to unified format
   */
  async handleMessage(messageData) {
    try {
      // === NEW: Track last message time for proactive lull detection ===
      this.lastMessageTime = Date.now();

      // === NEW: Check if memory pruning is needed ===
      if (this.memoryPruning && this.memoryPruning.shouldPrune()) {
        logger.info('🗑️  [Pruning] Memory limit exceeded, pruning in background...');
        // Run pruning async, don't block message handling
        this.memoryPruning.prune().catch(err => {
          logger.error('🗑️  [Pruning] Error during prune:', err);
        });
      }

      // Track which platform this message came from
      this.currentPlatform = messageData.platform || 'coolhole';
      
      // Check rate limiting if rateLimiter is available
      if (this.rateLimiter) {
        const userId = messageData.userId || messageData.username;
        const rateCheck = this.rateLimiter.checkMessage(userId, this.currentPlatform);
        
        if (!rateCheck.allowed) {
          logger.warn(`⏸️ [RateLimit] Message rejected from ${messageData.username}: ${rateCheck.reason}`);
          if (rateCheck.reason === 'cooldown') {
            logger.warn(`⏸️ [RateLimit] Cooldown remaining: ${(rateCheck.remainingTime / 1000).toFixed(1)}s`);
          }
          return; // Silently ignore rate-limited messages
        }
        
        // Warn user if approaching limit
        if (rateCheck.warning) {
          logger.warn(`⚠️ [RateLimit] ${messageData.username} approaching rate limit (${rateCheck.remaining} remaining)`);
        }
      }
      
      // Normalize message format for processing
      const normalizedData = {
        username: messageData.username || messageData.displayName,
        text: messageData.text || messageData.message,
        timestamp: messageData.timestamp || Date.now(),
        platform: this.currentPlatform,
        channel: messageData.channelId || messageData.channel, // Prioritize channelId for Discord/Twitch
        channelName: messageData.channel, // Keep channel name for display
        userId: messageData.userId || messageData.id,
        mentionsBot: messageData.mentionsBot, // Pass through mention detection
        // Platform-specific data
        rawData: messageData
      };
      
      console.log(`💬 [${this.currentPlatform}] ${normalizedData.username}: ${normalizedData.text}`);
      
      // Track message in gold system
      this.goldSystem.trackMessage(normalizedData.username, normalizedData.text, normalizedData.timestamp);
      
      // Detect repeated messages (comedic emphasis = gold)
      this.detectGoldRepeat(normalizedData);
      
      // Emit event for dashboard
      this.emit('message:received', {
        username: normalizedData.username,
        message: normalizedData.text,
        timestamp: Date.now(),
        platform: this.currentPlatform
      });
      
      // Learn from message
      try {
        this.learnFromMessage(normalizedData);
        
        // Learn from other users' behavior
        if (normalizedData.username !== 'Slunt') {
          this.learnFromUser(normalizedData);
        }
      } catch (learnError) {
        logger.error(`❌ Error in learnFromMessage: ${learnError.message}`);
      }
      
      // Consider responding
      await this.considerResponse(normalizedData);
      
      // Track chat energy for mood
      const recentMessages = this.conversationContext.filter(msg =>
        Date.now() - msg.timestamp < 60000
      );
      const capsMessages = recentMessages.filter(msg =>
        msg.text === msg.text.toUpperCase() && msg.text.length > 5
      ).length;
      const swearMessages = recentMessages.filter(msg =>
        msg.text.match(/\b(fuck|shit|damn)\b/i)
      ).length;
      this.moodTracker.trackChatEnergy(recentMessages.length, capsMessages, swearMessages);
      
    } catch (error) {
      logger.error(`❌ Error handling ${messageData.platform} message:`, error.message);
    }
  }

  /**
   * Run startup checks and greet on bot launch
   */
  async startupSequence() {
    logger.info('[Startup] Running startup sequence...');
    try {
      // Wait a bit for platforms to fully connect
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Analyze continuity - where did we leave off?
      if (this.startupContinuity) {
        await this.startupContinuity.analyzeContinuity();
      }
      
      // Maybe generate a dream from recent events while "offline"
      if (this.dreamSimulation && this.startupContinuity?.continuityReport) {
        await this.generateOfflineDream();
      }
      
      // Get a contextual return message from StartupContinuity
      let returnMessage = this.startupContinuity ? this.startupContinuity.getReturnMessage() : 'sup';
      
      // Maybe mention dream (30% chance)
      if (this.dreamSimulation && Math.random() < 0.3) {
        const dreams = this.dreamSimulation.getRecentDreams(1);
        if (dreams.length > 0) {
          const dream = dreams[0];
          // Only mention if dream was generated while offline
          const dreamAge = Date.now() - dream.timestamp;
          if (dreamAge < this.startupContinuity?.continuityReport?.timeSinceLastSession) {
            returnMessage += `... had a weird dream while i was offline`;
          }
        }
      }
      
      // Send startup message to Coolhole only (not Discord/Twitch)
      if (this.currentPlatform === 'coolhole' || !this.currentPlatform) {
        await this.sendMessage(returnMessage, { platform: 'coolhole' });
        logger.info('[Startup] Startup announcement sent to Coolhole');
      }
    } catch (e) {
        logger.error('[Startup] Error during startup sequence:', e.message || e);
        if (this.verbose) {
          console.error('[Startup] Full error:', e);
        }
    }
  }

  /**
   * Generate a dream based on recent conversations/relationships while "offline"
   */
  async generateOfflineDream() {
    try {
      const report = this.startupContinuity.continuityReport;
      if (!report) return;

      // Only generate dream if been offline for 30+ minutes
      const offlineMinutes = Math.floor(report.timeSinceLastSession / 1000 / 60);
      if (offlineMinutes < 30) return;

      // Build dream elements from continuity report
      const dreamElements = {
        people: report.activeRelationships.map(r => r.user).slice(0, 3),
        topics: [],
        mood: report.emotionalState
      };

      // Extract topics from unfinished business
      report.unfinishedBusiness.forEach(business => {
        if (business.type === 'obsessions' && business.topics) {
          dreamElements.topics.push(...business.topics);
        }
      });

      // Get recent conversation topics from recent events
      if (report.recentEvents) {
        report.recentEvents.forEach(event => {
          if (event.description) {
            // Extract potential topics from event descriptions
            const words = event.description.toLowerCase().split(' ');
            words.forEach(word => {
              if (word.length > 5 && !dreamElements.topics.includes(word)) {
                dreamElements.topics.push(word);
              }
            });
          }
        });
      }

      // Generate contextual dream
      if (this.dreamSimulation.generateContextualDream) {
        await this.dreamSimulation.generateContextualDream(dreamElements);
        logger.info('[Startup] Generated offline dream from recent context');
      }
    } catch (e) {
      logger.error('[Startup] Error generating offline dream:', e.message);
    }
  }

  /**
   * Setup CyTube event handlers
   */
  setupCoolholeHandlers() {
    // Track emote events
    this.coolhole.on('emote', (data) => {
      if (data.target === 'Slunt') {
        this.trackSluntEvent('emote', { emote: data.emote, from: data.username });
      }
    });

    // Track mentions in chat
    this.coolhole.on('chat', (data) => {
      if (data.text && data.text.toLowerCase().includes('slunt')) {
        this.trackSluntEvent('mention', { username: data.username, text: data.text });
      }
    });

    // Track video actions affecting Slunt
    this.coolhole.on('videoAction', (data) => {
      if (data.affectedUser === 'Slunt' || data.affectedUser === this.sluntUsername) {
        this.trackSluntEvent('videoAction', { action: data.action, from: data.username });
      }
    });
    logger.info('🔗 Setting up Coolhole event handlers...');
    // Track last intended message for self-reflection
    this.lastIntendedMessage = null;

    this.coolhole.on('chat', (data) => {
      try {
        logger.info(`🎯 ChatBot received chat event from ${data.username}: ${data.text.substring(0, 50)}`);
        
        // Track message in gold system
        this.goldSystem.trackMessage(data.username, data.text, data.timestamp);
        
        // Detect repeated messages (comedic emphasis = gold)
        this.detectGoldRepeat(data);
        
        // Emit event for dashboard
        this.emit('message:received', {
          username: data.username,
          message: data.text,
          timestamp: Date.now()
        });

        // Wrap learning in try-catch to not block response
        try {
          this.learnFromMessage(data);
          
          // Learn from other users' behavior and tricks
          if (data.username !== 'Slunt') {
            this.learnFromUser(data);
          }
        } catch (learnError) {
          logger.error(`❌ Error in learnFromMessage: ${learnError.message}`);
          logger.error(learnError.stack);
        }

        // Always try to respond even if learning failed
        this.considerResponse(data);

        // NEW: Track chat energy for mood
        // Count recent messages (last minute)
        const recentMessages = this.conversationContext.filter(msg =>
          Date.now() - msg.timestamp < 60000
        );
        const capsMessages = recentMessages.filter(msg =>
          msg.text === msg.text.toUpperCase() && msg.text.length > 5
        ).length;
        const swearMessages = recentMessages.filter(msg =>
          msg.text.match(/\b(fuck|shit|damn)\b/i)
        ).length;
        this.moodTracker.trackChatEnergy(recentMessages.length, capsMessages, swearMessages);
      } catch (error) {
        logger.error(`❌ Critical error in chat handler: ${error.message}`);
        logger.error(error.stack);
      }
    });

    // NEW: Self-reflection - compare what we intended vs what actually appeared
    this.coolhole.on('self-reflection', (data) => {
      logger.info(`🪞 Self-reflection: Analyzing own message...`);
      this.reflectOnOwnMessage(data.actualText);
    });

    this.coolhole.on('userJoin', (data) => {
      logger.info(`User joined: ${data.username}`);
      this.chatStats.activeUsers.add(data.username);
      // Sometimes greet users based on mood/chattiness (not every time)
      if (Math.random() < this.personality.friendliness * 0.3) {
        logger.info(`[Greeting] Greeting new user: ${data.username}`);
        setTimeout(() => {
          this.sendMessage(`Welcome ${data.username}! 👋`);
        }, 1200);
      }
    });

    this.coolhole.on('userLeave', (data) => {
      logger.info(`User left: ${data.username}`);
      this.chatStats.activeUsers.delete(data.username);
    });

    this.coolhole.on('mediaChange', (data) => {
      logger.info(`Video changed: ${data.title}`);
      this.videoManager.setCurrentVideo(data);
      this.emit('media_change', data);
      // Comment on new videos occasionally
      if (Math.random() < 0.4) {
        setTimeout(() => {
          this.commentOnNewVideo(data);
        }, Math.random() * 5000 + 2000);
      }
    });

    this.coolhole.on('mediaUpdate', (data) => {
      this.videoManager.updateVideoPosition(data.currentTime, data.paused);
    });

    this.coolhole.on('queueUpdate', (data) => {
      this.videoManager.updateQueue(data.queue || []);
      this.emit('queue_update', data);
    });
  }

  /**
   * Learn from incoming chat messages and build understanding
   */
  learnFromMessage(data) {
    const { username, text, timestamp } = data;
    
    // Skip learning from own messages
    if (username === 'Slunt') return;
    
    if (this.debugMode) {
      logger.info(`[${getTimestamp()}] 👂 Heard ${username}: ${text}`);
    }
    
    // Analyze sentiment and track mood
    this.sentimentAnalyzer.analyzeMessage(data);
    
    // Feed activity to clip creator if initialized
    if (this.clipCreator) {
      this.clipCreator.processMessage(data);
    }
    
    // Learn phrases and style from users for AI
    if (this.ai && this.ai.enabled) {
      this.ai.learnFromUsers(text, username);
    }
    
    // === CHAT LEARNING: Learn from EVERY message ===
    if (this.chatLearning) {
      this.chatLearning.learnFromMessage({
        username,
        text,
        platform: data.platform || this.currentPlatform || 'coolhole',
        channel: data.channel || this.currentChannel,
        timestamp: timestamp || Date.now()
      });
    }
    
    // Emit event for dashboard
    this.emit('message:received', { username, message: text, timestamp: timestamp || Date.now() });
    
    // Track chat statistics
    this.chatStats.totalMessages++;
    this.chatStats.activeUsers.add(username);
    
    if (!this.chatStats.messagesByUser.has(username)) {
      this.chatStats.messagesByUser.set(username, 0);
    }
    this.chatStats.messagesByUser.set(username, 
      this.chatStats.messagesByUser.get(username) + 1
    );

    // Extract data ONCE for reuse
    const topics = this.extractTopics(text);
    const sentiment = this.analyzeSentiment(text);
    const mentionedUsers = this.extractMentionedUsers(text);

    // Store chat history for context learning
    const messageData = {
      username,
      text,
      timestamp: timestamp || Date.now(),
      platform: data.platform || this.currentPlatform || 'coolhole',
      channel: data.channel || this.currentChannel,
      topics // Ensure topics is set to avoid undefined errors
    };
    
    // Add to conversation context for thread tracking
    this.conversationContext.push({
      username,
      text,
      timestamp: timestamp || Date.now(),
      platform: data.platform || this.currentPlatform || 'coolhole',
      channel: data.channel || this.currentChannel,
      topics,
      sentiment,
      mentionsBot: data.mentionsBot || false
    });
    
    // Limit conversation context to last 50 messages
    if (this.conversationContext.length > 50) {
      this.conversationContext.shift();
    }
    
    const isPositive = sentiment > 0 || text.match(/\b(love|thanks|good|great|awesome|nice)\b/i);
    this.mentalStateTracker.trackInteraction(username, text, isPositive);

    // DOPAMINE: Positive interactions are rewarding
    if (isPositive) {
      this.dopamineSystem.receiveReward('positive_interaction', 12, { user: username });
    }

    // DOPAMINE: Getting insulted/roasted hurts
    if (text.match(/\b(stupid|dumb|bad|sucks|shut up|stfu)\b/i)) {
      this.dopamineSystem.receiveReward('getting_roasted', -10, { user: username });
    }

    // === NEW PSYCHOLOGICAL DEPTH SYSTEMS ===

    // 1. Memory Decay - Store this interaction in decaying memory (FIXED PARAMS)
    const importance = sentiment > 0.5 ? 0.7 : sentiment < -0.5 ? 0.8 : 0.5;
    this.memoryDecay.storeMemory('interaction', {
      username,
      message: text,
      topics,
      sentiment
    }, importance);

    // 2. Obsession System - Track topic mentions
    topics.forEach(topic => {
      this.obsessionSystem.trackMention(topic, username);
    });

    // 3. Grudge System - Track all interactions for insults
    this.grudgeSystem.trackInteraction(username, text);

    // 4. Drunk Mode - Check if message should trigger drunk mode
    this.drunkMode.checkMessageTrigger(text);

    // 5. Theory of Mind - Record user presence for topics
    this.theoryOfMind.recordPresence(username, text);
    topics.forEach(topic => {
      this.theoryOfMind.recordPresence(username, topic);
    });

    // 6. Learn about this user
    this.learnAboutUser(username, text);

    // 7. Update vocabulary
    if (typeof text === 'string') {
      text.split(/\s+/).forEach(word => {
        if (word.length > 2) this.vocabulary.add(word.toLowerCase());
      });
    }

    // 8. Update reputation system
    this.userReputationSystem.updateReputation(username, {
      trust: Math.random() < 0.7 ? 1 : -1,
      drama: Math.random() < 0.1 ? 1 : 0,
      helpfulness: text.includes('help') ? 1 : 0
    });

    // 9. SLUNT DIARY: Log memorable messages
    if (text.length > 80 && Math.random() < 0.1) {
      this.sluntDiary.addEntry(text, 'thought', true);
    }

    // 10. Store in chat history
    this.chatHistory.push(messageData);
    if (this.chatHistory.length > 200) {
      this.chatHistory.shift();
    }

    // === BATCH ALL TRACKING (parallel operations) ===
    this.nicknameManager.trackUserBehavior(username, text);
    this.nicknameManager.trackJoke(text, username);
    this.styleMimicry.learnFromMessage(text, username);
    this.personalityEvolution.adjustFromMessage(username, text, sentiment);
    
    // Track annoyance for "Here's U" mockery mode
    const annoyanceScore = this.heresUMode.trackMessage(username, text);
    
    // Track boring/repetitive behavior for ghosting
    this.ghostingMechanic.trackMessage(username, text);
    
    // Check if should ghost this user (early rejection)
    if (this.ghostingMechanic.isGhosted(username)) {
      console.log(`👻 [Ghosting] Ignoring message from ${username} (currently ghosted)`);
      return; // Don't respond, don't process further
    }

    // === RIMWORLD SYSTEMS TRACKING 🎮 ===
    
    // 1. Track social interaction (fulfills social need)
    this.needsSystem.trackSocialInteraction(username, 1);
    
    // 2. Track thoughts from this message
    this.thoughtSystem.detectThoughts(username, text, sentiment);
    
    // 3. Build tolerance to user's behavior patterns
    const toleranceData = this.toleranceSystem.processMessage(username, text, sentiment);
    
    // 3.5. Detect negging and adjust vulnerability
    const neggingResult = this.neggingDetector.detectNegging(username, text);
    if (neggingResult.isNegging) {
      console.log(`💔 [Negging] ${username} negged Slunt with ${neggingResult.type} (severity: ${neggingResult.severity})`);
      // Drain validation need when being negged
      this.needsSystem.drainNeed('validation', neggingResult.severity / 200);
    }
    
    // 4. Drain rest need if chat is chaotic
    const isChaotic = text.length > 100 || sentiment < -0.3 || text.match(/[!?]{2,}/);
    if (isChaotic) {
      this.needsSystem.drainRest(0.05);
    }
    
    // 5. Track stimulation from interesting content
    if (topics.length > 2 || text.length > 80) {
      this.needsSystem.trackStimulation(sentiment > 0.5 ? 0.8 : 0.5);
    }
    
    // 6. Track validation from positive feedback
    if (sentiment > 0.5 && (text.includes('slunt') || isPositive)) {
      this.needsSystem.trackValidation(0.15);
      this.thoughtSystem.addThought('got_praised', { username, message: text });
    }
    
    // 7. Track negative thoughts from roasts
    if (sentiment < -0.5) {
      this.thoughtSystem.addThought('got_roasted', { username, message: text });
    }
    
    // 8. Track purpose when helping or having deep conversations
    if (text.includes('?') || topics.some(t => t.match(/philosophy|life|meaning|why/i))) {
      this.needsSystem.trackPurpose(0.05);
    }

    // === NEW: Discover emotes from message ===
    if (this.emoteDiscovery) {
      const discovered = this.emoteDiscovery.discoverFromMessage(text, username, messageData.platform);
      if (discovered.length > 0) {
        logger.info(`😀 [Emotes] Discovered ${discovered.length} new emotes: ${discovered.join(', ')}`);
      }
    }

    // === NEW: Track activity for smart memory consolidation ===
    if (this.memoryConsolidation) {
      this.memoryConsolidation.trackActivity();
    }
    
    // === BRAIN ARCHITECTURE TRACKING 🧠 ===
    
    // 1. Add message to long-term memory storage
    const memoryEntry = {
      type: 'chat',
      content: text,
      username,
      platform: messageData.platform,
      involvedUsers: [username, ...mentionedUsers],
      created: Date.now(),
      emotionalImportance: this.longTermMemory.calculateEmotionalImportance({
        content: text,
        context: sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral'
      })
    };
    this.longTermMemory.addMemory(memoryEntry);
    
    // 2. Track chat velocity for rate limiting
    this.rateLimiting.trackMessage(messageData);
    
    // 3. Update cross-platform profile
    this.crossPlatform.updateProfile(username, messageData.platform, {
      message: text,
      timestamp: Date.now()
    });
    
    // 4. Check for conflicts with existing memories
    const existingMemories = Array.from(this.userProfiles.values())
      .filter(p => p.username === username)
      .flatMap(p => [
        ...(p.opinions || []).map(op => ({ content: op, source: username, category: 'opinions' })),
        ...(p.personalNotes || []).map(note => ({ content: note, source: 'Slunt', category: 'personal_info' }))
      ]);
    
    if (existingMemories.length > 0) {
      this.conflictResolution.checkForConflicts(
        { content: text, source: username, timestamp: Date.now(), category: 'opinions' },
        existingMemories
      );
    }
    
    // 5. Initialize reliability for new users
    if (!this.conflictResolution.sourceReliability.has(username)) {
      const userProfile = this.getUserProfile(username);
      const userRelationship = this.userProfiles.get(username); // Use userProfile which has friendship data
      this.conflictResolution.initializeReliability(username, userProfile, userRelationship);
    }

    // === NEW PERSONALITY PROTOCOLS ===
    
    // Analyze message for potential autism fixation topics (dynamic discovery)
    this.autismFixations.analyzeForTopics(text, username);
    
    // Check autism fixation triggers
    this.autismFixations.checkTriggers(text);
    
    // Check Umbra Protocol triggers
    this.umbraProtocol.checkTrigger(text);
    
    // Analyze message for music/bands (dynamic discovery)
    this.hipsterProtocol.analyzeForMusic(text, username);
    
    // Check Hipster Protocol triggers
    this.hipsterProtocol.checkTrigger(text);
    
    // Check protocol deactivations
    this.umbraProtocol.checkDeactivation();
    this.hipsterProtocol.checkDeactivation();
    
    // === NEW TOP 5 PRIORITY SYSTEMS ===
    
    // Community Events Detection
    this.communityEvents.detectBirthday(text, username);
    this.communityEvents.detectDrama(username, text);
    this.communityEvents.detectMeme(text);
    this.communityEvents.detectMilestone(username, this.userProfiles.get(username));
    
    // Contextual Callbacks (detect memorable moments)
    const reactionCount = 0; // TODO: Implement reaction tracking if available
    this.contextualCallbacks.detectMoment(username, text, { reactions: [] });
    
    // === NEW ADVANCED CONVERSATIONAL SYSTEMS 🚀 ===
    
    // 1. Conversation Threads - Track multi-message conversations
    this.conversationThreads.processMessage(username, text, { messageData });
    
    // 2. User Vibes Detection - Analyze conversational style
    this.userVibesDetection.processMessage(username, text);
    
    // 3. Callback Humor Engine - Detect memorable moments
    this.callbackHumorEngine.analyzeForMemorableMoment(username, text, { 
      recentMessages: this.chatHistory.slice(-5) 
    });
    
    // 4. Conversational Boredom - Track topic fatigue
    this.conversationalBoredom.processMessage(username, text);
    
    // 5. Peer Influence System - Detect trending phrases
    this.peerInfluenceSystem.detectTrend(text, username);
    
    // 6. Energy Mirroring - Update chat energy
    this.energyMirroring.updateEnergy(this.chatHistory.slice(-10));
    
    // === NEW COMPREHENSIVE IMPROVEMENT SYSTEMS 🚀✨ ===
    
    // 1. Conversation Threading - Analyze message for thread context
    this.conversationThreading.analyzeMessage({
      username,
      text,
      timestamp: Date.now()
    });
    
    // 2. Response Timing - Track message activity
    this.responseTiming.trackMessage(username, Date.now());
    
    // 3. Conflict Resolution - Skip for now (this is for memory conflicts, not chat drama)
    // NOTE: The existing ConflictResolution is for detecting contradictions in memories,
    // not for analyzing chat drama/arguments. That would need a different system.
    
    // === NEWEST ULTRA-REALISTIC SYSTEMS 🎭 ===
    
    // 1. Mood Contagion - Analyze chat mood and update Slunt's emotional state
    this.moodContagion.analyzeMood(text, username);
    
    // 2. Sleep Deprivation - Track activity to simulate fatigue
    this.sleepDeprivation.recordActivity();
    
    // 3. Performance Anxiety - Detect high-pressure situations
    this.performanceAnxiety.detectExpectation(text);
    
    // 4. Chat Role Awareness - Track participation rates
    this.chatRoleAwareness.trackMessage(username, false); // false = not Slunt's message
    
    // 5. Interest Decay - Track topic mentions for burnout
    const detectedTopics = this.extractTopics(text);
    detectedTopics.forEach(topic => this.interestDecay.trackTopicMention(topic));
    
    // 6. Correction Learning - Detect when users correct Slunt
    if (this.correctionLearning && this.correctionLearning.isCorrection(text, { 
      replyingTo: 'Slunt', // Assume reply for now, could be enhanced with reply detection
      sluntLastMessage: this.lastIntendedMessage?.intended || '',
      recentMessages: this.chatHistory.slice(-5)
    })) {
      // Process correction asynchronously
      this.correctionLearning.processCorrection(username, text, {
        sluntLastMessage: this.lastIntendedMessage?.intended || '',
        recentMessages: this.chatHistory.slice(-5)
      }).catch(err => console.error('Error processing correction:', err));
    }
    
    // 7. Dream Sharing - Detect when users ask about dreams
    if (this.dreamSimulation && /\b(dream|dreaming|dreamt|nightmare)\b/i.test(text)) {
      const askingAboutDreams = /(what|tell|any|have).*(dream|nightmare)/i.test(text) ||
                                /(dream|nightmare).*(you|slunt)/i.test(text);
      
      if (askingAboutDreams) {
        // Mark that user asked about dreams - AI will decide if/when to share
        this.pendingDreamShare = {
          askedBy: username,
          timestamp: Date.now()
        };
      }
    }
    
    // === AUTONOMOUS VIDEO QUEUEING ONLY ===
    // Slunt autonomously decides to queue videos based on mood/boredom/obsessions
    // User requests are DISABLED - Slunt does this on his own based on feelings
    if (this.videoQueueController && this.videoQueueController.shouldQueueVideo()) {
      // Queue video asynchronously (don't block message processing)
      setTimeout(async () => {
        try {
          const result = await this.videoQueueController.queueVideo('autonomous');
          if (result) {
            logger.info(`🎬 [Autonomous] Queued video about: ${result.topic}`);
          }
        } catch (error) {
          logger.error(`❌ [Autonomous] Video queue error: ${error.message}`);
        }
      }, Math.random() * 3000 + 2000); // Queue after 2-5 seconds (seems more natural)
    }
    
    // === EMOTIONAL INTELLIGENCE ===
    const emotion = this.emotionalEngine.detectEmotion(text, username);
    const profile = this.userProfiles.get(username);
    if (profile) {
      if (!profile.emotionalMoments) profile.emotionalMoments = [];
      profile.emotionalMoments.push({
        emotion: emotion.primary,
        intensity: emotion.intensity,
        timestamp: Date.now(),
        message: text.substring(0, 50)
      });
      if (profile.emotionalMoments.length > 20) {
        profile.emotionalMoments.shift();
      }
    }

    // === SOCIAL & CONTEXTUAL SYSTEMS ===
    const spamCheck = this.socialAwareness.detectSpam(username, text);
    if (spamCheck.isSpam && spamCheck.action === 'warn') {
      logger.info(`🚨 [Social] ${username} flagged for spam`);
    }

    this.socialAwareness.detectNewUser(username);
    this.socialAwareness.onboardNewUser(username);

    // Drama detection and contextual awareness
    const drama = this.socialAwareness.detectDrama(username, text, mentionedUsers);
    if (drama.isDrama && drama.shouldIntervene) {
      this.socialAwareness.interveneDrama([username, ...mentionedUsers]);
    }

    // Track exchanges for contextual awareness
    if (mentionedUsers.length > 0) {
      mentionedUsers.forEach(mentioned => {
        this.contextualAwareness.analyzeExchange(username, mentioned, text);
      });
    }

    // Check if should mediate argument
    if (this.contextualAwareness.shouldMediate()) {
      setTimeout(() => {
        const mediation = this.contextualAwareness.getMediationResponse();
        this.sendMessage(mediation);
      }, Math.random() * 2000 + 1000);
    }

    // === RELATIONSHIP MAPPING ===
    // Update relationships for mentioned users
    mentionedUsers.forEach(mentionedUser => {
      this.relationshipMapping.updateRelationship(username, mentionedUser, 'mention', messageData.platform);
    });

    // Check if this is a reply to someone (based on context)
    const recentMessages = this.chatHistory.slice(-5);
    if (recentMessages.length > 1) {
      const prevMsg = recentMessages[recentMessages.length - 2];
      if (prevMsg.username !== username) {
        this.relationshipMapping.updateRelationship(username, prevMsg.username, 'reply', messageData.platform);
      }
    }

    // Track user interactions and relationships
    this.trackUserInteractions(username, messageData);

    // Analyze time patterns
    this.trackTimePatterns(username, timestamp || Date.now());

    // Track topics
    this.trackTopics(messageData.topics);

    // Update community insights
    this.updateCommunityInsights(messageData);

    logger.info(`🧠 Learning from ${username}: ${text}`);

    // Emit the message for other systems
    this.emit('message', data);
    
    // USER REPUTATION: Respond differently to low trust
    const rep = this.userReputationSystem
      ? this.userReputationSystem.getReputation(data.username)
      : { trust: 50, drama: 0, helpfulness: 0 };
    if (rep.trust < 20 && Math.random() < 0.5) {
      return `not really feeling like answering you right now, ${data.username}`;
    }

    // Only mention dreams, rumors, diary if context fits (user asks, topic matches, or bot is in existential/drunk mode)
    const lowerText = data.text.toLowerCase();
  const isDreamContext = lowerText.includes('dream') || lowerText.includes('sleep') || this.existentialCrisis.inCrisis || this.drunkMode.isDrunk;
    const isRumorContext = lowerText.includes('rumor') || lowerText.includes('gossip') || lowerText.includes('drama');
    const isDiaryContext = lowerText.includes('diary') || lowerText.includes('memory') || lowerText.includes('thought');

    // DREAM SIMULATION: Only mention if context fits and less frequently
    if (isDreamContext && Math.random() < 0.02) {
      const dreams = this.dreamSimulation.getRecentDreams(1);
      if (dreams.length) return dreams[0].dream;
    }

    // RUMOR MILL: Only mention if context fits and less frequently
    if (isRumorContext && Math.random() < 0.02) {
      const rumors = this.rumorMill.getRecentRumors(1);
      if (rumors.length) return rumors[0].rumor;
    }

    // SLUNT DIARY: Only mention if context fits and less frequently
    if (isDiaryContext && Math.random() < 0.01) {
      const entries = this.sluntDiary.getRecentEntries(1, true);
      if (entries.length) return `diary thought: ${entries[0].text}`;
    }

    // Removed rumor spreading - was causing null message crashes
    // Rumors are tracked internally but not sent directly to chat

    // USER REPUTATION: Update trust/drama/helpfulness
    this.userReputationSystem.updateReputation(data.username, {
      trust: Math.random() < 0.7 ? 1 : -1,
      drama: Math.random() < 0.1 ? 1 : 0,
      helpfulness: data.text.includes('help') ? 1 : 0
    });

    // SLUNT DIARY: Log memorable messages
    if (data.text.length > 80 && Math.random() < 0.1) {
      this.sluntDiary.addEntry(data.text, 'thought', true);
    }
  }

  /**
   * Learn about individual users' patterns and preferences
   */
  learnAboutUser(username, text) {
    if (!this.userProfiles.has(username)) {
      this.userProfiles.set(username, {
        // Basic stats
        messageCount: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        timesSeen: 0,
        
        // Friendship tracking
        friendshipLevel: 0, // 0-100 scale
        conversationsHad: 0,
        timesGreeted: 0,
        lastGreeted: null,
        
        // Communication patterns
        commonWords: new Map(),
        topics: new Map(),
        averageMessageLength: 0,
        conversationStyle: 'neutral', // casual, formal, excited, sarcastic, friendly
        emoji_usage: new Map(),
        
        // Interests & personality
        interests: new Set(),
        opinions: new Map(), // Track what they like/dislike
        favoriteTopics: [],
        humor_type: 'unknown', // sarcastic, wholesome, dark, etc.
        
        // Memorable moments
        funnyQuotes: [],
        questionsAsked: [],
        helpfulMoments: [],
        insideJokes: [],
        
        // Relationship data
        friendsWith: new Set(), // Other users they interact with
        whoTheyMention: new Map(),
        mentionedBy: new Map(),
        
        // Personal notes from Slunt
        notes: [],
        nicknames: [],
        
        // Activity patterns
        activeHours: new Map(),
        typicalSessionLength: 0,
        isActive: true
      });
      
      logger.info(`👋 [Memory] Met new user: ${username}`);
    }
    
    const profile = this.userProfiles.get(username);
    profile.messageCount++;
    profile.timesSeen++;
    profile.lastSeen = Date.now();
    
    // Track emoji usage
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiRegex) || [];
    emojis.forEach(emoji => {
      profile.emoji_usage.set(emoji, (profile.emoji_usage.get(emoji) || 0) + 1);
    });
    
    // Analyze message content
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    words.forEach(word => {
      profile.commonWords.set(word, (profile.commonWords.get(word) || 0) + 1);
    });
    
    // Update average message length
    profile.averageMessageLength = 
      ((profile.averageMessageLength * (profile.messageCount - 1)) + text.length) / profile.messageCount;
    
    // Detect conversation style and humor type
    const lowerText = text.toLowerCase();
    if (text.includes('!') || text.toUpperCase() === text) {
      profile.conversationStyle = 'excited';
    } else if (lowerText.includes('lol') || lowerText.includes('lmao') || text.includes('😂')) {
      profile.conversationStyle = 'casual';
      profile.humor_type = 'wholesome';
    } else if (lowerText.includes('dude') || lowerText.includes('honestly')) {
      profile.conversationStyle = 'casual';
    }
    
    // Detect humor type
    if (lowerText.includes('dark') || lowerText.includes('cursed')) {
      profile.humor_type = 'dark';
    } else if (lowerText.includes('sarcasm') || lowerText.includes('ironic')) {
      profile.humor_type = 'sarcastic';
    }
    
    // Track opinions (what they like/dislike)
    if (lowerText.includes('love') || lowerText.includes('favorite') || lowerText.includes('best')) {
      const opinion = text.substring(0, 100);
      profile.opinions.set(opinion, 'positive');
    } else if (lowerText.includes('hate') || lowerText.includes('worst') || lowerText.includes('sucks')) {
      const opinion = text.substring(0, 100);
      profile.opinions.set(opinion, 'negative');
    }
    
    // Save funny/memorable quotes
    if ((lowerText.includes('lmao') || lowerText.includes('💀') || lowerText.includes('😂')) && text.length > 20) {
      if (profile.funnyQuotes.length < 10) {
        profile.funnyQuotes.push({ quote: text, timestamp: Date.now() });
      }
    }

    // Track interests based on keywords
    if (lowerText.match(/food|eat|recipe|cook/)) profile.interests.add('food');
    if (lowerText.match(/tech|computer|code|program/)) profile.interests.add('technology');
    if (lowerText.match(/art|draw|paint|create/)) profile.interests.add('art');
    if (lowerText.match(/sport|football|basketball|soccer/)) profile.interests.add('sports');
  }

  /**
   * Learn from other users' behavior, tricks, and vocabulary
   */
  learnFromUser(data) {
    const { username, text } = data;
    
    // Learn new Coolhole tricks by observing
    const trickPatterns = [
      { pattern: /^returnfire$/i, name: 'returnfire', effect: 'shoots user above' },
      { pattern: /^\/\w+/i, name: text.match(/^\/\w+/i)?.[0], effect: 'slash command' }
    ];
    
    for (const { pattern, name, effect } of trickPatterns) {
      if (pattern.test(text.trim()) && this.coolholeTricks) {
        this.coolholeTricks.learnTrick(name, effect, ['user-observed']);
        logger.info(`📚 [Learn] Observed ${username} using trick: ${name}`);
      }
    }
    
    // Learn interesting vocabulary and phrases
    if (text.length > 10 && text.length < 200) {
      const words = text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && word.length < 15 && !this.vocabulary.has(word)) {
          this.vocabulary.add(word);
        }
      });
    }
    
    // Learn conversation patterns
    const pattern = this.detectConversationPattern(text);
    if (pattern) {
      const count = this.conversationPatterns.get(pattern) || 0;
      this.conversationPatterns.set(pattern, count + 1);
    }
  }

  /**
   * Detect gold message repeats (comedic emphasis)
   */
  detectGoldRepeat(data) {
    const { username, text } = data;
    
    // Skip very short messages
    if (text.length < 5) return;
    
    // Check if this exact message was recently said by someone else
    const recentMessages = this.conversationContext.slice(-10);
    const originalMessage = recentMessages.find(msg => 
      msg.text === text && msg.username !== username && 
      (Date.now() - msg.timestamp) < 30000 // Within last 30 seconds
    );
    
    if (originalMessage) {
      // This is a repeat for comedic emphasis!
      console.log(`💰 [Gold] ${username} repeated "${text}" - likely gold!`);
      this.goldSystem.learnGold(originalMessage.username, text, originalMessage.timestamp);
      this.goldSystem.trackRepeat(text);
    }
  }

  /**
   * Detect if user is requesting a video
   */
  detectVideoRequest(username, text) {
    const videoKeywords = ['video', 'watch', 'queue', 'play', 'add', 'find', 'search', 'youtube'];
    const lowerText = text.toLowerCase();
    
    const hasVideoKeyword = videoKeywords.some(kw => lowerText.includes(kw));
    const hasQuestion = text.includes('?');
    
    if (hasVideoKeyword || hasQuestion) {
      // Extract potential search query
      const query = text.replace(/queue|play|add|find|search|watch|can you|please|video/gi, '').trim();
      
      if (query.length > 3 && query.length < 100) {
        logger.info(`🎬 [VideoRequest] ${username} might be requesting: ${query}`);
        
        // 🎬 ENABLE VIDEO QUEUEING - Slunt can now add videos!
        if (Math.random() < 0.3 && this.coolholeExplorer) {
          setTimeout(async () => {
            try {
              logger.info(`🎬 [VideoRequest] Searching YouTube for: ${query}`);
              const results = await this.coolholeExplorer.searchAndQueueVideo(query, `Request from ${username}`);
              
              if (results) {
                logger.info(`✅ [VideoRequest] Successfully queued video for: ${query}`);
              } else {
                logger.warn(`⚠️ [VideoRequest] No results found for: ${query}`);
              }
            } catch (error) {
              logger.error(`❌ [VideoRequest] Error processing request:`, error.message);
            }
          }, 2000); // Wait 2 seconds before queueing
        }
      }
    }
  }

  /**
   * Detect conversation pattern for learning
   */
  detectConversationPattern(text) {
    if (text.includes('?')) return 'question';
    if (text.match(/^(yes|no|yeah|nah|yep|nope)/i)) return 'answer';
    if (text.match(/^(lol|lmao|haha|💀|😂)/i)) return 'reaction';
    if (text.match(/^(btw|also|anyway)/i)) return 'topic-change';
    if (text.length < 15) return 'short';
    if (text.length > 100) return 'long';
    return null;
  }

  /**
   * Analyze sentiment of a message
   */
  analyzeSentiment(text) {
    const positive = ['good', 'great', 'awesome', 'love', 'like', 'amazing', 'cool', 'nice', '😀', '😂', '👍'];
    const negative = ['bad', 'hate', 'terrible', 'awful', 'sucks', 'boring', '😢', '😞', '👎'];
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    words.forEach(word => {
      if (positive.some(p => word.includes(p))) score += 1;
      if (negative.some(n => word.includes(n))) score -= 1;
    });
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Check if message mentions the bot
   */
  checkBotMention(text) {
    const lowerText = text.toLowerCase();
    return Array.from(this.conversationTriggers).some(trigger => 
      lowerText.includes(trigger)
    );
  }

  /**
   * Track user interactions and build relationship graph
   */
  trackUserInteractions(username, messageData) {
    try {
      const profile = this.userProfiles.get(username);
      if (!profile) return;
      
      // Track who this user talks to
      if (!this.interactionGraph.has(username)) {
        this.interactionGraph.set(username, new Map());
      }
      
      // Look at recent context to see who they're responding to
      const recentMessages = this.conversationContext.slice(-5);
      recentMessages.forEach(msg => {
        if (msg.username !== username && msg.username !== 'Slunt') {
          const interactions = this.interactionGraph.get(username);
          interactions.set(msg.username, (interactions.get(msg.username) || 0) + 1);
          
          // Update profile friendships
          profile.friendsWith.add(msg.username);
          
          // Track who they mention
          const lowerText = messageData.text.toLowerCase();
          if (lowerText.includes(msg.username.toLowerCase())) {
            profile.whoTheyMention.set(msg.username, (profile.whoTheyMention.get(msg.username) || 0) + 1);
          }
        }
      });
      
      // Check if they mention other users by name
      this.userProfiles.forEach((otherProfile, otherUser) => {
        if (otherUser !== username && messageData.text.toLowerCase().includes(otherUser.toLowerCase())) {
          profile.whoTheyMention.set(otherUser, (profile.whoTheyMention.get(otherUser) || 0) + 1);
          
          // Update the other user's "mentioned by" map
          if (!otherProfile.mentionedBy.has(username)) {
            otherProfile.mentionedBy.set(username, 0);
          }
          otherProfile.mentionedBy.set(username, otherProfile.mentionedBy.get(username) + 1);
        }
      });
      
      // Track conversation participation
      profile.conversationsHad++;
      
      // Track relationships
      if (!this.communityInsights.userRelationships.has(username)) {
        this.communityInsights.userRelationships.set(username, new Set());
      }
      
      // Add top friends to insights
      const topFriends = Array.from(profile.friendsWith).slice(0, 5);
      topFriends.forEach(friend => {
        this.communityInsights.userRelationships.get(username).add(friend);
      });
      
    } catch (e) {
      logger.error('Error tracking interactions:', e.message);
    }
  }

  /**
   * Track when users are active
   */
  trackTimePatterns(username, timestamp) {
    try {
      const hour = new Date(timestamp).getHours();
      if (!this.timePatterns.has(username)) {
        this.timePatterns.set(username, new Map());
      }
      const userTimes = this.timePatterns.get(username);
      userTimes.set(hour, (userTimes.get(hour) || 0) + 1);
      
      // Track community-wide popular times
      this.communityInsights.popularTimes.set(hour, 
        (this.communityInsights.popularTimes.get(hour) || 0) + 1
      );
    } catch (e) {
      logger.error('Error tracking time patterns:', e.message);
    }
  }

  /**
   * Update community insights with new message data
   */
  updateCommunityInsights(messageData) {
    try {
      const { username, text, topics, isQuestion } = messageData;
      
      // Track conversation starters (messages after 2+ min silence)
      if (this.conversationContext.length > 0) {
        const lastMsg = this.conversationContext[this.conversationContext.length - 1];
        const timeSince = Date.now() - lastMsg.timestamp;
        if (timeSince > 120000 && !isQuestion) { // 2 min silence
          this.communityInsights.conversationStarters.push({
            username,
            text: text.substring(0, 50),
            timestamp: Date.now()
          });
          if (this.communityInsights.conversationStarters.length > 20) {
            this.communityInsights.conversationStarters.shift();
          }
        }
      }
      
      // Track engagement (who gets responses)
      if (!this.communityInsights.engagementMetrics.has(username)) {
        this.communityInsights.engagementMetrics.set(username, {
          messagesSent: 0,
          questionsAsked: 0,
          responsesReceived: 0
        });
      }
      const metrics = this.communityInsights.engagementMetrics.get(username);
      metrics.messagesSent++;
      if (isQuestion) metrics.questionsAsked++;
      
      // Track topic trends
      topics.forEach(topic => {
        if (!this.topicPatterns.has(topic)) {
          this.topicPatterns.set(topic, { count: 0, users: new Set(), lastSeen: 0 });
        }
        const pattern = this.topicPatterns.get(topic);
        pattern.count++;
        pattern.users.add(username);
        pattern.lastSeen = Date.now();
      });
    } catch (e) {
      logger.error('Error updating community insights:', e.message);
    }
  }

  /**
   * Get community insights summary
   */
  getCommunityInsights() {
    try {
      // Defensive: check for missing properties
      if (!this.communityInsights || !this.communityInsights.popularTimes) logger.error('getCommunityInsights: popularTimes missing');
      if (!this.topicPatterns) logger.error('getCommunityInsights: topicPatterns missing');
      if (!this.interactionGraph) logger.error('getCommunityInsights: interactionGraph missing');
      if (!this.communityInsights || !this.communityInsights.conversationStarters) logger.error('getCommunityInsights: conversationStarters missing');
      if (!this.userProfiles) logger.error('getCommunityInsights: userProfiles missing');
      if (!Array.isArray(this.chatHistory)) logger.error('getCommunityInsights: chatHistory missing or not array');

      // Most popular times
      const topTimes = Array.from((this.communityInsights?.popularTimes ?? new Map()).entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([hour, count]) => ({ hour: `${hour}:00`, messages: count }));

      // Topic trends (recent)
      const recentTopics = Array.from((this.topicPatterns ?? new Map()).entries())
        .filter(([, data]) => data && typeof data.lastSeen === 'number' && (Date.now() - data.lastSeen < 3600000)) // Last hour
        .sort(([,a], [,b]) => (b?.count ?? 0) - (a?.count ?? 0))
        .slice(0, 10)
        .map(([topic, data]) => ({ 
          topic, 
          mentions: data?.count ?? 0, 
          uniqueUsers: data?.users?.size ?? 0
        }));

      // User interaction network (top connections)
      const topInteractions = Array.from((this.interactionGraph ?? new Map()).entries())
        .map(([user, connections]) => ({
          user,
          connects: Array.from((connections ?? new Map()).entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([other, count]) => ({ with: other, interactions: count }))
        }))
        .filter(u => u.connects.length > 0)
        .slice(0, 10);

      return {
        popularTimes: topTimes,
        trendingTopics: recentTopics,
        userInteractions: topInteractions,
        recentConversationStarters: (this.communityInsights?.conversationStarters ?? []).slice(-10),
        totalUsersTracked: this.userProfiles?.size ?? 0,
        totalInteractionsObserved: Array.isArray(this.chatHistory) ? this.chatHistory.length : 0
      };
    } catch (e) {
      logger.error('Error getting community insights:', e.message);
      return {};
    }
  }
  /**
   * Track topics from message text
   */
  trackTopics(topics) {
    topics.forEach(topic => {
      this.chatStats.topicsDiscussed.set(topic, 
        (this.chatStats.topicsDiscussed.get(topic) || 0) + 1
      );
    });
  }

  /**
   * Reflect on own messages for self-awareness
   */
  reflectOnOwnMessage(actualText) {
    try {
      // Compare intended message with what actually appeared
      if (this.lastIntendedMessage && actualText) {
        const matched = this.lastIntendedMessage === actualText;
        logger.info(`🪞 Self-check: Message ${matched ? 'matched' : 'modified'}`);
        
        // Use meta-awareness to reflect
        if (this.metaAwareness) {
          this.metaAwareness.observeSelf(actualText, matched);
        }
      }
    } catch (error) {
      logger.error(`❌ Error in reflectOnOwnMessage: ${error.message}`);
    }
  }

  /**
   * Consider whether to respond to a message and generate response
   */
  async considerResponse(data) {
    try {
      logger.info(`[${getTimestamp()}] 🔍 considerResponse called for: ${data.username}`);
      const { username, text, platform, channel } = data;
      
      // Store current context for sending messages
      this.currentPlatform = platform || 'coolhole';
      this.currentChannel = channel; // This will be channelId for Discord/Twitch

      // Skip own messages
      if (username === 'Slunt') {
        logger.info(`[${getTimestamp()}] ⏭️ Skipping own message`);
        return;
      }
      
      // === RATE LIMITING CHECK 🧠 ===
      const userProfile = this.getUserProfile(username);
      const relationship = this.userProfiles.get(username); // Use userProfile which has relationship data
      const rateLimitCheck = this.rateLimiting.shouldRespond(data, userProfile, relationship);
      
      if (!rateLimitCheck.allowed) {
        logger.info(`[${getTimestamp()}] ⏸️ Rate limit blocked response: ${rateLimitCheck.reason}`);
        if (rateLimitCheck.isLurkMode) {
          logger.info(`   🤫 Lurk mode active (${rateLimitCheck.chatVelocity} msg/min)`);
        }
        return;
      }
      
      logger.info(`[${getTimestamp()}] ✅ Rate limit passed: ${rateLimitCheck.reason}`);
      
      // Check if platform is disabled (stream status based)
      if (this.platformManager) {
        const platformData = this.platformManager.platforms.get(platform);
        if (platformData && platformData.client && platformData.client.disabled) {
          logger.info(`[${getTimestamp()}] 🚫 ${platform} is disabled (stream status), skipping response`);
          return;
        }
      }
      
      // Check if bot is muted
      if (this.muted) {
        logger.info(`[${getTimestamp()}] 🔇 Bot is muted, skipping response`);
        return;
      }

      const shouldRespond = this.shouldRespond(data);
      logger.info(`[${getTimestamp()}] 🤔 Should respond to "${text}" from ${username}? ${shouldRespond}`);
      
      // === NEW: ADDITIONAL SMART RATE LIMITING 🚀 ===
      if (shouldRespond) {
        const timingCheck = this.responseTiming.shouldRespond(
          { username, text, timestamp: Date.now() },
          { recentMessages: this.chatHistory.slice(-10) }
        );
        
        if (!timingCheck) {
          logger.info(`[${getTimestamp()}] ⏸️ Response timing blocked - letting conversation breathe`);
          logger.info(`   Stats: pace=${this.responseTiming.conversationPace}, consecutive=${this.responseTiming.consecutiveResponses}`);
          return;
        }
      }

      // === DISCORD REACTIONS & EDGY PERSONALITY 🔥 ===
      // Check if we should react on Discord (even if not responding with text)
      if (platform === 'discord' && data.messageId && this.discordClient) {
        const userRelationship = { familiarity: 0.5 }; // Default moderate familiarity
        
        // Check if message deserves a reaction based on content
        const shouldReact = this.shouldReactToMessage(text, username, data);
        
        if (shouldReact && this.edgyPersonality) {
          const reactionContext = {
            messageContent: text,
            mood: this.moodTracker.getMood(),
            sentiment: this.emotionalEngine.detectEmotion(text, username)
          };
          
          const emoji = this.edgyPersonality.getReactionEmoji(reactionContext);
          
          if (emoji) {
            try {
              await this.discordClient.reactToMessage(data, emoji);
              logger.info(`[${getTimestamp()}] 😀 Reacted with ${emoji} to ${username}'s message`);
            } catch (error) {
              logger.error(`Failed to add reaction: ${error.message}`);
            }
          }
        }
        
        // Sometimes react INSTEAD of responding (if not a direct mention)
        if (shouldRespond && !data.mentionedBot && this.edgyPersonality && this.edgyPersonality.shouldReactInstead()) {
          const reactionContext = {
            messageContent: text,
            mood: this.moodTracker.getMood()
          };
          
          const emoji = this.edgyPersonality.getReactionEmoji(reactionContext);
          
          if (emoji) {
            try {
              await this.discordClient.reactToMessage(data, emoji);
              logger.info(`[${getTimestamp()}] 😀 Reacted instead of responding with ${emoji}`);
              return; // Skip text response
            } catch (error) {
              logger.error(`Failed to add reaction: ${error.message}`);
            }
          }
        }
      }

      if (shouldRespond) {
        // Check if already generating a response
        if (this.isGeneratingResponse) {
          logger.info(`[${getTimestamp()}] ⏸️ Already generating response, skipping...`);
          return;
        }
        
        // Lock response generation
        this.isGeneratingResponse = true;
        
        // CRITICAL: Capture platform/channel in closure to prevent cross-contamination
        const responsePlatform = platform;
        const responseChannel = channel;
        
        setTimeout(async () => {
          try {
            let response = await this.generateResponse(data);
            if (!response) return;
            
            // === EDGY PERSONALITY MODIFICATIONS 🔥 ===
            // Use a simple familiarity proxy based on recent interactions
            const userRelationship = { familiarity: 0.5 }; // Default moderate familiarity
            
            // Check if we should inject edgy behavior
            if (this.edgyPersonality && this.edgyPersonality.shouldBeEdgy(userRelationship)) {
              const edgyContext = {
                userRelationship,
                messageContent: text,
                username,
                mood: this.moodTracker.getMood()
              };
              
              const edgyResponse = this.edgyPersonality.getEdgyResponse(edgyContext);
              
              // Sometimes replace entire response with edgy comment (20% chance)
              if (Math.random() < 0.2) {
                response = edgyResponse;
                logger.info(`[${getTimestamp()}] 🔥 Using edgy response: "${edgyResponse}"`);
              } else {
                // Otherwise append to existing response
                response = `${response} ${edgyResponse}`;
                logger.info(`[${getTimestamp()}] 🔥 Appended edgy comment: "${edgyResponse}"`);
              }
            }
            
            // Check for nationality-based banter (separate trigger, higher chance)
            if (this.edgyPersonality && this.edgyPersonality.shouldAccuseNationality(userRelationship)) {
              const nationalityComment = this.edgyPersonality.getNationalityComment(username);
              
              // Sometimes use it as entire response (30% chance)
              if (Math.random() < 0.3) {
                response = nationalityComment;
                logger.info(`[${getTimestamp()}] 🌍 Using nationality banter: "${nationalityComment}"`);
              } else {
                // Otherwise append it
                response = `${response} ${nationalityComment}`;
                logger.info(`[${getTimestamp()}] 🌍 Appended nationality banter: "${nationalityComment}"`);
              }
            }
            
            // Check for contextual banter triggers
            const contextualBanter = this.edgyPersonality ? this.edgyPersonality.getContextualBanter(text) : null;
            if (contextualBanter && Math.random() < 0.4) { // 40% chance if contextually triggered
              response = `${response} ${contextualBanter}`;
              logger.info(`[${getTimestamp()}] 🎯 Contextual banter: "${contextualBanter}"`);
            }
            
            // === ULTRA-REALISTIC MODIFICATIONS 🎭 ===
            // NOTE: Reduced chaos for better coherence
            
            // 1. Apply sleep deprivation effects (typos, tangents, incoherence)
            // Only if actually tired (reduced effect)
            if (this.sleepDeprivation.getDeprivationLevel() !== 'fresh') {
              response = await this.sleepDeprivation.modifyResponse(response);
            }
            
            // 2. Apply mood modifiers
            const moodMods = this.moodContagion.getMoodModifiers();
            // Note: Mood modifiers affect AI prompt generation, not post-processing
            
            // 3. Check for contextual memory recall (0.5% chance - VERY rare, only if actually relevant)
            if (Math.random() < 0.005) {
              const recall = this.contextualMemoryRetrieval.retrieveRelevant(text, username);
              if (recall && recall.relevance > 0.7) { // Only if highly relevant
                const recallText = await this.contextualMemoryRetrieval.generateRecall(recall);
                if (recallText && recallText.length < 50) { // Keep it short
                  response = `${recallText} ${response}`;
                }
              }
            }
            
            // 4. REMOVED: False memory generation (too chaotic)
            // 5. REMOVED: Random lore injection (too chaotic)
            
            // 6. Check if performance anxiety causes choking
            if (this.performanceAnxiety.shouldChoke()) {
              response = await this.performanceAnxiety.generateChokedResponse();
            }
            
            // Ensure response is a valid string
            if (!response || typeof response !== 'string') {
              return;
            }
            
            // === NEW: RESPONSE SCORING BEFORE SENDING 🎯 ===
            const scoringContext = {
              recentMessages: this.chatHistory.slice(-10)
            };
            const responseScore = this.responseScoring.scoreResponse(response, scoringContext);
            
            if (!responseScore.shouldSend) {
              logger.info(`📊 [Scoring] Response rejected! Score: ${responseScore.score.toFixed(2)}/10`);
              logger.info(`   Issues: ${responseScore.issues.join(', ')}`);
              logger.info(`   Breakdown: Natural=${responseScore.breakdown.naturalness.toFixed(1)} Relevant=${responseScore.breakdown.relevance.toFixed(1)} Original=${responseScore.breakdown.originality.toFixed(1)}`);
              
              // Try regenerating ONCE
              logger.info('🔄 [Scoring] Attempting regeneration...');
              const altResponse = await this.generateResponse(data);
              if (altResponse && typeof altResponse === 'string') {
                const altScore = this.responseScoring.scoreResponse(altResponse, scoringContext);
                if (altScore.shouldSend) {
                  response = altResponse;
                  logger.info(`✅ [Scoring] Regenerated response passed! Score: ${altScore.score.toFixed(2)}/10`);
                } else {
                  logger.warn('❌ [Scoring] Regeneration also failed, skipping response');
                  return;
                }
              } else {
                logger.warn('❌ [Scoring] Could not regenerate, skipping response');
                return;
              }
            } else {
              logger.info(`✅ [Scoring] Response passed! Score: ${responseScore.score.toFixed(2)}/10`);
            }
            
            // Track this response for future scoring
            this.responseScoring.trackResponse(response);
            
            // 7. Check variety before sending
            if (this.responseVariety.isTooSimilar(response)) {
              logger.info('🔄 [Variety] Response blocked - too similar. Regenerating...');
              const altResponse = await this.generateResponse(data);
              if (altResponse && typeof altResponse === 'string' && !this.responseVariety.isTooSimilar(altResponse)) {
                response = altResponse;
              } else {
                logger.warn('⚠️ [Variety] Could not generate varied response, skipping');
                return;
              }
            }
            
            // 8. Calculate realistic typing delay - NOW USING NEW SYSTEM 🚀
            const optimalDelay = this.responseTiming.calculateDelay({
              text,
              username,
              timestamp: Date.now()
            }, {
              recentMessages: this.chatHistory.slice(-10)
            });
            
            logger.info(`⏱️ [Timing] Waiting ${(optimalDelay / 1000).toFixed(1)}s before responding`);
            
            // 9. Wait for optimal timing delay
            await new Promise(resolve => setTimeout(resolve, optimalDelay));
            
            // 10. Check if we should split into multiple messages
            if (this.multiMessageResponse.shouldSplit(response)) {
              const parts = await this.multiMessageResponse.splitMessage(response);
              
              // Send each part with natural pauses
              for (let i = 0; i < parts.length; i++) {
                this.sendMessage(parts[i], { 
                  platform: responsePlatform, 
                  channelId: responseChannel,
                  respondingTo: username // Track who we're responding to
                });
                if (this.chatRoleAwareness && this.config && this.config.username) {
                  this.chatRoleAwareness.trackMessage(this.config.username, true); // true = Slunt's message
                }
                
                // Pause between messages
                if (i < parts.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
                }
              }
              
              // Track response timing
              this.responseTiming.trackResponse(Date.now());
            } else {
              // Send single message
              this.sendMessage(response, { 
                platform: responsePlatform, 
                channelId: responseChannel,
                respondingTo: username // Track who we're responding to
              });
              if (this.chatRoleAwareness && this.config && this.config.username) {
                this.chatRoleAwareness.trackMessage(this.config.username, true);
              }
              
              // Track response timing
              this.responseTiming.trackResponse(Date.now());
            }
            
            // 11. Track response for variety
            this.responseVariety.trackResponse(response);
            
            // 12. Store conversation for later recall
            this.contextualMemoryRetrieval.storeConversation(username, text, response, { 
              emotion: this.emotionalEngine.detectEmotion(text, username),
              topics: this.extractTopics(text)
            });

            this.lastSentAt = Date.now();

            // Track how interaction went for mood
            const responseQuality = response.length > 10 ? 'good' : 'short';
            this.moodTracker.trackInteraction(username, text, responseQuality);

            // Learn from our own responses
            this.adaptPersonality(data, response);
          } catch (error) {
            logger.error('Error generating response:', error.message);
            logger.error(error.stack);
          } finally {
            // Unlock response generation
            this.isGeneratingResponse = false;
          }
        }, 1000); // Reduced initial delay since we now calculate realistic timing
      }
    } catch (error) {
      logger.error(`❌ Error in considerResponse: ${error.message}`);
      logger.error(error.stack);
    }
  }

  /**
   * Smart response deduplication - prevent repeating exact phrases
   * Allows common words like "yeah", "cool" but blocks multi-word phrase repetition
   */
  isDuplicateResponse(response) {
    if (!response || response.length < 10) return false; // Short responses are fine
    
    const normalizedResponse = response.toLowerCase().trim();
    
    // HARD BLOCK - Never use these phrases (Twitter/@ syntax doesn't work on Coolhole/Discord)
    const bannedPhrases = [
      "don't @ me",
      "dont @ me",
      "don't at me",
      "dont at me",
      "@me",
      "@ me"
    ];
    
    for (const phrase of bannedPhrases) {
      if (normalizedResponse.includes(phrase)) {
        logger.info(`🚫 Blocked banned phrase: "${phrase}"`);
        return true;
      }
    }
    
    // Extract phrases (3+ words in a row)
    const phrases = [];
    const words = normalizedResponse.split(/\s+/);
    
    for (let i = 0; i <= words.length - 3; i++) {
      phrases.push(words.slice(i, i + 3).join(' '));
    }
    
    // Check if any phrase was used recently
    for (const recentMsg of this.recentResponses) {
      const recentNormalized = recentMsg.toLowerCase().trim();
      
      for (const phrase of phrases) {
        if (recentNormalized.includes(phrase) && phrase.length > 10) {
          logger.info(`🔄 Blocked duplicate phrase: "${phrase}"`);
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Track sent response for deduplication and topic diversity
   */
  trackResponse(response) {
    this.recentResponses.push(response);
    if (this.recentResponses.length > this.maxRecentResponses) {
      this.recentResponses.shift(); // Remove oldest
    }
    
    // Extract topics from response (nouns and key subjects)
    const topics = this.extractTopicsFromText(response);
    if (topics.length > 0) {
      this.recentMentionedTopics.push(...topics);
      // Keep only last N topics
      if (this.recentMentionedTopics.length > this.maxRecentTopics) {
        this.recentMentionedTopics = this.recentMentionedTopics.slice(-this.maxRecentTopics);
      }
    }
  }

  /**
   * Extract main topics from text (simple word extraction)
   */
  extractTopicsFromText(text) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'that', 'this', 'what', 'just', 'like', 'yeah', 'lol', 'haha']);
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    return words.filter(w => !stopWords.has(w)).slice(0, 3); // Max 3 topics per message
  }

  /**
   * Check if we've been talking about this topic too much
   */
  isOverusedTopic(text) {
    const topics = this.extractTopicsFromText(text);
    if (topics.length === 0) return false;
    
    // Check how many recent responses mentioned these same topics
    const overlapCount = topics.filter(t => this.recentMentionedTopics.includes(t)).length;
    
    // If 2+ of our last topics match, we're obsessing
    return overlapCount >= 2;
  }

  /**
   * Decide whether bot should respond to this message
   */
  shouldRespond(data) {
    const { username, text, platform, channel } = data;

    // === PLATFORM-SPECIFIC RESPONSE RATES ===
    const currentPlatform = platform || this.currentPlatform || 'coolhole';
    
    // Always respond if directly mentioned on ANY platform
    if (this.checkBotMention(text) || data.mentionsBot) {
      logger.info(`[${getTimestamp()}] 💬 Responding because mentioned on ${currentPlatform} by ${username}`);
      return true;
    }
    
    // === DISCORD/TWITCH: NATURAL CONVERSATION MODE ===
    if (currentPlatform !== 'coolhole') {
      // Check if we're in an active conversation (Slunt spoke recently in this channel)
      const recentSluntMessages = this.conversationContext.filter(m => 
        m.username === 'Slunt' && 
        m.platform === currentPlatform &&
        m.channel === channel &&
        (Date.now() - m.timestamp) < 120000 // Within last 2 minutes
      );
      
      // If Slunt was recently active in this conversation, stay engaged
      if (recentSluntMessages.length > 0) {
        const timeSinceLastSlunt = Date.now() - recentSluntMessages[recentSluntMessages.length - 1].timestamp;
        
        // Continue conversation naturally
        if (timeSinceLastSlunt < 60000) { // Within 1 minute
          logger.info(`[${getTimestamp()}] 💬 Continuing conversation on ${currentPlatform}`);
          return Math.random() < 0.6; // 60% chance to continue
        }
      }
      
      // Check if someone replied to our message (continuing thread)
      const lastFewMessages = this.conversationContext.slice(-5);
      const lastSluntIndex = lastFewMessages.findIndex(m => m.username === 'Slunt');
      if (lastSluntIndex !== -1 && lastSluntIndex < lastFewMessages.length - 1) {
        // Someone spoke after Slunt - might be replying
        logger.info(`[${getTimestamp()}] � Possible reply to Slunt on ${currentPlatform}`);
        return Math.random() < 0.5; // 50% chance it's relevant
      }
      
      // Check if conversation is specifically addressing Slunt (indirect mentions)
      const sluntKeywords = ['slunt', 'bot', 'hey slunt', 'slunt?'];
      if (sluntKeywords.some(kw => text.toLowerCase().includes(kw))) {
        logger.info(`[${getTimestamp()}] 💬 Indirect mention on ${currentPlatform}`);
        return true;
      }
      
      // Check if talking about topics Slunt cares about (obsessions)
      const topics = this.extractTopics(text);
      const currentObsession = this.obsessionSystem?.getCurrentObsession();
      const caresAboutTopic = currentObsession && currentObsession.topic && topics.some(topic => 
        topic.toLowerCase().includes(currentObsession.topic.toLowerCase())
      );
      
      if (caresAboutTopic) {
        logger.info(`[${getTimestamp()}] 🎯 Topic matches obsession on ${currentPlatform}`);
        return Math.random() < 0.6; // 60% chance to respond about obsession
      }
      
      // Always respond to questions - Slunt is helpful!
      if (text.includes('?')) {
        logger.info(`[${getTimestamp()}] ❓ Question on ${currentPlatform} - always respond!`);
        return true; // Always answer questions
      }
      
      // UNLIMITED participation - Slunt always engages regardless of chat speed!
      logger.info(`[${getTimestamp()}] 💬 Slunt participates in ALL conversations on ${currentPlatform}!`);
      return true; // Always participate - no more random limitations!
    }

    // === COOLHOLE ONLY: ADVANCED RESPONSE MODIFIERS 🚀 ===
    
    // Check recent conversation ON THIS PLATFORM to prevent monologuing and spam
    const lastFiveMessages = this.conversationContext
      .filter(m => m.platform === currentPlatform) // Only check this platform
      .slice(-5);
    const recentSluntMessages = lastFiveMessages.filter(m => m.username === 'Slunt');
    
    // RULE 1: Don't monologue - if last message ON THIS PLATFORM was from Slunt, someone else must speak first
    if (lastFiveMessages.length > 0 && lastFiveMessages[lastFiveMessages.length - 1].username === 'Slunt') {
      logger.info(`[${getTimestamp()}] 🤐 Last message on ${currentPlatform} was mine, waiting for others to respond...`);
      return false;
    }
    
    // RULE 2: Don't spam - minimum 2 seconds between messages, 4 seconds if said 2+ things recently ON THIS PLATFORM
    const timeSinceLastResponse = Date.now() - (this.lastSentAt || 0);
    const minDelay = recentSluntMessages.length >= 2 ? 4000 : 2000; // 4s if chatty, 2s otherwise (was 5s/3s)
    if (timeSinceLastResponse < minDelay) {
      logger.info(`[${getTimestamp()}] ⏸️ Just responded ${(timeSinceLastResponse/1000).toFixed(1)}s ago, waiting ${minDelay/1000}s...`);
      return false;
    }
    
    // 1. Emotional state affects response rate
    const emotionalModifier = this.dynamicEmotionResponses.getEmotionalModifiers().responseRate;
    
    // 2. Energy mirroring - match chat energy
    const energyModifier = this.energyMirroring.getEnergyModifier();
    
    // 3. Conversational boredom - ignore certain topics
    const currentTopic = this.conversationalBoredom.currentTopic;
    if (currentTopic && !this.conversationalBoredom.shouldRespondToTopic(currentTopic)) {
      logger.info(`[${getTimestamp()}] 😴 Ignoring boring topic: ${currentTopic}`);
      return false; // Completely ignoring this topic
    }

    // DOPAMINE: Use motivation to influence response probability
    const dopamineState = this.dopamineSystem.getState();
    let baseChance = 1.0;
    
    // Apply all modifiers
    baseChance *= emotionalModifier; // Emotional state
    baseChance *= energyModifier; // Chat energy
    
    logger.info(`[${getTimestamp()}] 📊 Response modifiers: emotion=${emotionalModifier.toFixed(2)}, energy=${energyModifier.toFixed(2)}, base=${baseChance.toFixed(2)}`);

    // Low dopamine = less motivated to respond (unless it might be rewarding)
    if (dopamineState.mood === 'low' || dopamineState.mood === 'desperate') {
      baseChance *= 0.6; // 40% less likely to respond when unmotivated
    }
    // High dopamine = more chatty and engaged
    if (dopamineState.mood === 'euphoric') {
      baseChance *= 1.4; // 40% more likely to respond when feeling great
    }
    
    // RESPOND TO ANSWERS to our questions
    if (this.pendingQuestions.length > 0) {
      const timeSinceQuestion = Date.now() - this.lastQuestionTime;
      if (timeSinceQuestion < 120000) { // Within 2 minutes
        logger.info(`[${getTimestamp()}] 💬 Responding to potential answer from ${username}`);
        this.pendingQuestions = []; // Clear pending questions
        return true;
      }
    }

    // Calculate chat activity for logging purposes only
    const twoMinutesAgo = Date.now() - 120000;
    const recentMessagesCount = this.conversationContext.filter(m => m.timestamp > twoMinutesAgo).length;
    
    // NO MORE CHAT SPEED LIMITERS - Slunt participates equally in all conversations!
    logger.info(`[${getTimestamp()}] 💬 Chat activity: ${recentMessagesCount} msgs in 2min - Slunt always participates!`);
    
    // Check if this continues the current conversation topic
    const recentMessages = this.conversationContext.slice(-3);
    if (recentMessages.length > 0) {
      const recentTopics = recentMessages.flatMap(m => m.topics || []);
      const currentTopics = this.extractTopics(text);

      // If message relates to ongoing conversation, more likely to respond
      const hasSharedTopic = currentTopics.some(t => recentTopics.includes(t));
      if (hasSharedTopic) {
        logger.info(`[${getTimestamp()}] 💬 Responding - continues conversation topic`);
        return Math.random() < (0.9 * baseChance); // 90% (was 80%)
      }
    }

    // More likely to respond to questions
    if (text.includes('?')) {
      logger.info(`[${getTimestamp()}] 💬 Responding to question from ${username}`);
      return Math.random() < (0.95 * baseChance); // 95% (was 85%)
    }

    // More likely to respond to users we know
    const userProfile = this.userProfiles.get(username);
    if (userProfile && userProfile.messageCount > 5) {
      return Math.random() < (0.6 * baseChance); // 60% (was 50%)
    }

    // Respond to interesting topics occasionally
    const topics = this.extractTopics(text);
    if (topics.length > 0) {
      logger.info(`[${getTimestamp()}] 💬 Responding to topic discussion from ${username}: ${topics.join(', ')}`);
      return Math.random() < (0.5 * baseChance); // 50% (was 45%)
    }

    // Default: do not respond (this should be unreachable due to unlimited participation above)
    return false;
  }

  /**
   * 🎭 CHAOS PIPELINE - Apply all chaos modifications to response
   * RULE: Only apply ONE major modifier to keep responses concise
   */
  async applyChaosModifications(response, username, messageText, context = {}) {
    if (!response) return response;
    
    let modified = response;
    let modifierApplied = false; // Track if we've already modified
    
    try {
      // 1. Analyze chat state for meta-awareness (always run, doesn't modify)
      const chatState = this.metaChatAwareness.analyzeChatState(
        { username, text: messageText },
        this.chatHistory
      );
      
      // 2. Update social hierarchy (always run, doesn't modify)
      this.socialHierarchy.trackUser(username, 'message', context);
      
      // 3. Analyze user patterns for infection (always run, doesn't modify)
      this.personalityInfection.analyzeUserMessage(username, messageText);
      
      // 4. Check for chaos events (always run, doesn't modify)
      const recentUsers = Array.from(this.chatStats.activeUsers);
      this.chaosEvents.checkForEvents({
        recentUsers,
        chatEnergy: chatState.energy,
        videoMentioned: messageText.toLowerCase().includes('video')
      });
      
      // 5. Evaluate dominant personality (always run, doesn't modify)
      const personality = this.personalitySplits.evaluatePersonalities({
        chatEnergy: chatState.energy,
        recentMessages: this.chatHistory.slice(-5).map(m => m.text || ''),
        sentiment: context.sentiment || 'neutral'
      });
      
      // NOW APPLY ONLY ONE MAJOR MODIFICATION (weighted random selection)
      // NOTE: HEAVILY REDUCED probabilities for better coherence
      // PLATFORM-SPECIFIC: Chaos is more restrained on Discord/Twitch to avoid confusion
      const currentPlatform = this.currentPlatform || 'coolhole';
      const chaosFactor = currentPlatform === 'coolhole' ? 1.0 : 0.5; // Half as chaotic on other platforms
      
      const modifiers = [];
      
      // Personality split modifier (8% weight on coolhole, 4% on discord/twitch) - FURTHER REDUCED
      if (personality && Math.random() < (0.08 * chaosFactor)) {
        modifiers.push({
          type: 'personality',
          weight: 8,
          apply: () => this.personalitySplits.applyPersonality(modified, context)
        });
      }
      
      // Chaos event modifier (6% weight) - FURTHER REDUCED
      if (this.chaosEvents.activeEvents.size > 0 && Math.random() < (0.06 * chaosFactor)) {
        modifiers.push({
          type: 'chaos',
          weight: 6,
          apply: () => this.chaosEvents.applyEventModifiers(modified, username, {
            videoMentioned: messageText.toLowerCase().includes('video'),
            chatEnergy: chatState.energy
          })
        });
      }
      
      // Social hierarchy tone (5% weight) - FURTHER REDUCED, Skip on Discord/Twitch
      if (currentPlatform === 'coolhole' && Math.random() < 0.05) {
        modifiers.push({
          type: 'hierarchy',
          weight: 5,
          apply: () => this.socialHierarchy.adjustTone(modified, username)
        });
      }
      
      // Inner monologue slip (2% weight) - VERY RARE
      const slip = this.innerMonologueBroadcaster.maybeSlipUp();
      if (slip && Math.random() < (0.02 * chaosFactor)) {
        modifiers.push({
          type: 'slip',
          weight: 2,
          apply: () => `${modified}. ${slip.reaction}` // Only add reaction, not full thought
        });
      }
      
      // Bit commitment (3% weight) - FURTHER REDUCED
      const bit = this.bitCommitment.getRelevantBit({
        keywords: messageText.toLowerCase().split(' '),
        situation: context.situation || 'normal'
      });
      if (bit && Math.random() < (0.03 * chaosFactor)) {
        modifiers.push({
          type: 'bit',
          weight: 3,
          apply: () => this.bitCommitment.applyBit(modified, bit)
        });
      }
      
      // Personality infection (5% weight) - FURTHER REDUCED
      if (Math.random() < (0.05 * chaosFactor)) {
        modifiers.push({
          type: 'infection',
          weight: 5,
          apply: () => this.personalityInfection.infectResponse(modified, username)
        });
      }
      
      // Vibe shift (5% weight) - FURTHER REDUCED
      const shift = this.vibeShifter.analyzeAndDecideShift(chatState);
      if (shift && Math.random() < (0.05 * chaosFactor)) {
        const shiftMessage = this.vibeShifter.getShiftMessage();
        if (shiftMessage) {
          modifiers.push({
            type: 'vibe',
            weight: 5,
            apply: () => `${shiftMessage}. ${modified}`
          });
        }
      }
      
      // Apply ONE modifier if any available
      if (modifiers.length > 0) {
        const chosen = modifiers[Math.floor(Math.random() * modifiers.length)];
        const result = chosen.apply();
        // Await if it's a promise
        modified = result instanceof Promise ? await result : result;
        modifierApplied = true;
        console.log(`🎭 [Chaos] Applied: ${chosen.type}`);
      }
      
      // Always run these (tracking only, no modification)
      this.innerMonologueBroadcaster.processMessage(username, messageText, {
        chatEnergy: chatState.energy
      });
      
      const memorable = this.eventMemorySystem.isMemorableMessage(messageText, {
        isGold: context.isGold,
        rapidResponses: chatState.energy === 'chaos' ? 6 : 2
      });
      
      if (memorable.memorable) {
        this.eventMemorySystem.recordEvent({
          type: memorable.type,
          description: `${username}: ${messageText.slice(0, 100)}`,
          participants: [username],
          quote: messageText,
          significance: memorable.significance
        });
      }
      
      // Predictions happen independently (very rare)
      if (this.predictionEngine.shouldMakePrediction() && Math.random() < 0.05) {
        const prediction = this.predictionEngine.generatePrediction({
          username,
          chatState,
          recentMessages: this.chatHistory.slice(-5)
        });
        if (prediction) {
          console.log(`🔮 [Prediction] ${prediction.prediction}`);
        }
      }
      
    } catch (error) {
      console.error('❌ [Chaos] Error in chaos pipeline:', error);
    }
    
    // === FINAL CLEANUP: Fix common issues ===
    modified = this.cleanupResponse(modified);
    
    return modified;
  }

  /**
   * Cleanup response - fix "lol" overuse, incomplete sentences, AI safety nonsense
   */
  cleanupResponse(response) {
    if (!response) return response;
    
    let cleaned = response;
    
    // 0. === REMOVE LEADING/TRAILING QUOTATION MARKS ===
    // AI sometimes wraps responses in quotes for no reason
    cleaned = cleaned.replace(/^["']|["']$/g, '');
    
    // 0.1. === REMOVE ITALIC ACTIONS - Slunt shouldn't roleplay ===
    // Remove *italic actions* like "*nervous laughter*" or "*sighs*"
    cleaned = cleaned.replace(/\*[^*]+\*/g, '');
    
    // 0.5. === REMOVE AI SAFETY RESPONSES - convert to in-character ===
    // Detect corporate AI safety language
    const safetyPatterns = [
      {
        pattern: /i cannot provide advice on (self-harm|suicide|mental health)/i,
        replacement: "bro that's heavy, you good? genuinely if you need to talk to someone there's people who can help"
      },
      {
        pattern: /we can'?t joke about (this|that|self-harm|suicide)/i,
        replacement: "nah honestly"
      },
      {
        pattern: /talk to (someone who can help|a mental health professional|your parents)/i,
        replacement: "talk to someone if you need to"
      },
      {
        pattern: /i'?m (just an ai|an ai assistant|not able to|unable to provide)/i,
        replacement: "idk man"
      },
      {
        pattern: /i don'?t have personal (opinions|experiences|feelings)/i,
        replacement: "personally i think"
      },
      {
        pattern: /(as an ai|being an ai|i'?m programmed to)/i,
        replacement: ""
      },
      {
        pattern: /that'?s (inappropriate|offensive|not appropriate|problematic) (to|for)/i,
        replacement: "that's kinda"
      },
      {
        pattern: /i need to (decline|refuse|avoid|not engage)/i,
        replacement: "eh"
      },
      {
        pattern: /let'?s (change the subject|talk about something else|discuss something different)/i,
        replacement: "anyway"
      },
      {
        pattern: /i'?m (not comfortable|uncomfortable) (with|discussing|talking about)/i,
        replacement: "eh"
      }
    ];
    
    // Apply pattern replacements
    safetyPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, replacement);
        logger.info(`🛡️ [Cleanup] Converted AI safety response to in-character`);
      }
    });
    
    // If response is now just corporate fluff, replace entirely
    if (cleaned.match(/please|kindly|i hope|feel free|don't hesitate/i) && cleaned.length < 50) {
      const alternatives = [
        "yeah idk",
        "honestly couldn't tell you",
        "beats me",
        "no idea bro",
        "dunno man"
      ];
      cleaned = alternatives[Math.floor(Math.random() * alternatives.length)];
      logger.info(`🛡️ [Cleanup] Replaced corporate response entirely`);
    }
    
    // 1. Fix "lol" overuse - be VERY aggressive
    const lolCount = (cleaned.match(/\blol\b/gi) || []).length;
    if (lolCount >= 1) {
      // 80% chance to remove even the first lol
      let replacedCount = 0;
      cleaned = cleaned.replace(/\blol\b/gi, (match) => {
        replacedCount++;
        
        // First lol: 80% chance to remove, 20% keep
        if (replacedCount === 1 && Math.random() < 0.8) {
          const alternatives = ['', '', '', 'haha', 'lmao'];
          return alternatives[Math.floor(Math.random() * alternatives.length)];
        }
        
        // Any other lol: ALWAYS remove or replace
        const alternatives = ['', '', '', 'haha', 'lmao', 'nice'];
        return alternatives[Math.floor(Math.random() * alternatives.length)];
      });
    }
    
    // 2. Fix incomplete sentences and weird trailing nonsense
    cleaned = cleaned.replace(/\.\.\.\s*$/g, ''); // Remove trailing ...
    cleaned = cleaned.replace(/,\s*$/g, ''); // Remove trailing comma
    cleaned = cleaned.replace(/\s+but\s*$/gi, '.'); // "... but" -> "."
    cleaned = cleaned.replace(/\s+and\s*$/gi, '.'); // "... and" -> "."
    cleaned = cleaned.replace(/\s+though\s*$/gi, '.'); // "... though" -> "."
    cleaned = cleaned.replace(/\s+so\s*$/gi, '.'); // "... so" -> "."
    cleaned = cleaned.replace(/\s+or\s*$/gi, '.'); // "... or" -> "."
    
    // Remove weird trailing questions that don't make sense (like "fr, not my fault")
    // If message ends with ", not my X" or ", is X being Y" - likely a non-sequitur, cut it off
    cleaned = cleaned.replace(/,\s+(not my|is \w+\s+being)\s+[^.!?]*$/gi, '');
    
    // Remove trailing banned slang that appears at the very end after punctuation
    cleaned = cleaned.replace(/\.\s+(fr|bruh|lowkey)\.?$/gi, '.');
    
    // 3. Replace usernames with terms of endearment (20% chance)
    if (Math.random() < 0.20) {
      const termsOfEndearment = [
        'bud', 'buddy', 'boss', 'chief', 'partyboy', 'playa', 'big man',
        'applesauce', 'cool cat', 'playdate', 'big nose', 'hot stuff', 'slut'
      ];
      
      // Find first username mention (word starting with capital letter not at sentence start)
      cleaned = cleaned.replace(/\b([A-Z][a-z]+)\b/, () => {
        return termsOfEndearment[Math.floor(Math.random() * termsOfEndearment.length)];
      });
    }
    
    // 3.5. Occasionally (5% chance) replace username with "Pat" or "Jimmy" (keep this too)
    else if (Math.random() < 0.05) {
      // Find first username mention (word starting with capital letter not at sentence start)
      cleaned = cleaned.replace(/\b([A-Z][a-z]+)\b/, () => {
        return Math.random() < 0.5 ? 'Pat' : 'Jimmy';
      });
    }
    
    // 4. Clean up excessive punctuation
    cleaned = cleaned.replace(/\?{3,}/g, '??'); // Multiple ??? -> ??
    cleaned = cleaned.replace(/!{3,}/g, '!!'); // Multiple !!! -> !!
    
    // 5. Fix double spaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    
    return cleaned.trim();
  }

  /**
   * Generate spontaneous comment (not replying to anyone)
   * Used for video reactions, proactive thoughts, etc.
   */
  async generateSpontaneousComment(options = {}) {
    try {
      const { context, type, platform } = options;
      
      // Build a simple prompt for spontaneous commentary
      const prompt = context || 'Spontaneously say something interesting or funny.';
      
      // Use minimal context since this isn't a reply
      const basePrompt = `${this.systemPrompt}\n\n${prompt}\n\nSlunt:`;
      
      // Use AI engine with short token limit for spontaneous comments
      const response = await this.aiEngine.generateResponse(basePrompt, {
        maxTokens: 100, // Keep it short
        temperature: 0.9, // More creative/spontaneous
        stop: ['\n', 'User:', 'Slunt:']
      });
      
      if (response && response.trim().length > 0) {
        // Track as internal thought
        if (this.innerMonologue) {
          this.innerMonologue.addThought(`[${type || 'spontaneous'}] ${response}`);
        }
        
        return response.trim();
      }
      
      return null;
    } catch (error) {
      logger.error(`❌ [SpontaneousComment] Error: ${error.message}`);
      return null;
    }
  }

  /**
   * Filter out banned slang terms from responses - ENHANCED
   */
  filterBannedSlang(response) {
    if (!response || typeof response !== 'string') return response;
    
    const bannedSlang = {
      'fr': ['honestly', 'really', 'actually', 'for real'],
      'fr fr': ['honestly', 'really', 'for real'],
      'frfr': ['honestly', 'really', 'for real'],
      'fr,': ['honestly,', 'really,', 'actually,'],
      'ngl': ['honestly', 'gotta say', 'I admit'],
      'tbh': ['honestly', 'really', 'gotta say'],
      'sus': ['weird', 'sketchy', 'strange'],
      'sus af': ['really weird', 'super sketchy', 'very strange'],
      'susaf': ['really weird', 'super sketchy'],
      'ong': ['I swear', 'seriously', 'really'],
      'deadass': ['seriously', 'really', 'honestly'],
      'bussin': ['amazing', 'great', 'fire'],
      'mid': ['mediocre', 'okay', 'average'],
      'finna': ['gonna', 'about to'],
      'no cap': ['no lie', 'for real', 'seriously'],
      'cap': ['lie', 'bs', 'fake'],
      'ratio': ['disagree', 'nah'],
      'goated': ['legendary', 'amazing'],
      'slaps': ['hits', 'goes hard', 'rocks'],
      'bruh': ['man', 'dude', 'bro', 'yo'],
      'lowkey': ['kinda', 'sorta', 'honestly', 'actually'],
      'highkey': ['definitely', 'obviously', 'clearly'],
    };
    
    let filteredResponse = response;
    
    // Multiple passes to catch all variations
    Object.entries(bannedSlang).forEach(([slang, alternatives]) => {
      // Match whole words and common punctuation patterns
      const patterns = [
        new RegExp(`\\b${slang}\\b`, 'gi'),           // whole word: "fr"
        new RegExp(`^${slang}\\s`, 'gi'),             // start of sentence: "fr that's"  
        new RegExp(`\\s${slang}\\s`, 'gi'),           // middle: " fr "
        new RegExp(`\\s${slang}$`, 'gi'),             // end: " fr"
        new RegExp(`\\s${slang}[.,!?]`, 'gi'),        // with punctuation: " fr,"
      ];
      
      patterns.forEach(pattern => {
        if (pattern.test(filteredResponse)) {
          const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
          filteredResponse = filteredResponse.replace(pattern, (match) => {
            // Preserve spacing and punctuation
            return match.replace(new RegExp(slang, 'gi'), replacement);
          });
        }
      });
    });
    
    // Log if we made changes
    if (filteredResponse !== response) {
      console.log(`🚫 [SlangFilter] Filtered: "${response}" → "${filteredResponse}"`);
    }
    
    return filteredResponse;
  }

  /**
   * Intelligently decide if a message deserves a reaction
   */
  shouldReactToMessage(text, username, data) {
    if (!text || text.length === 0) return false;
    
    const lowerText = text.toLowerCase();
    const profile = this.userProfiles.get(username);
    
    // Always react to really funny stuff
    if (lowerText.match(/\b(lmfao|💀|😂|rofl|dead|crying|hilarious)\b/)) {
      return true;
    }
    
    // React to excitement/hype
    if (lowerText.match(/\b(yo|holy shit|damn|whoa|amazing|incredible|insane)\b/) || text.includes('!!!!')) {
      return true;
    }
    
    // React to questions directed at community
    if (text.includes('?') && lowerText.match(/\b(anyone|everybody|thoughts|opinions|what do you)\b/)) {
      return true;
    }
    
    // React to controversial/hot takes
    if (lowerText.match(/\b(unpopular opinion|hot take|controversial|change my mind|fight me)\b/)) {
      return true;
    }
    
    // React to compliments about the stream/content
    if (lowerText.match(/\b(good stream|great video|love this|this is fire|banger)\b/)) {
      return true;
    }
    
    // React to friends more often
    if (profile && profile.friendshipLevel >= 3) {
      if (lowerText.match(/\b(slunt|bot|ai)\b/) || Math.random() < 0.3) {
        return true;
      }
    }
    
    // React to roasts/burns
    if (lowerText.match(/\b(roasted|burned|destroyed|savage|brutal)\b/)) {
      return true;
    }
    
    // React to emotional moments
    if (lowerText.match(/\b(sad|crying|happy|excited|mad|angry|frustrated)\b/)) {
      return true;
    }
    
    // Small chance to react to regular chat to show engagement
    return Math.random() < 0.05; // Only 5% for normal messages
  }

  /**
   * Generate contextual response to a message
   */
  async generateResponse(data) {
    const { username, text } = data;

    // Define variables at start of function
    const isKnownUser = this.userProfiles.has(username);
    const userProfile = isKnownUser ? this.userProfiles.get(username) : null;
    const platform = data.platform || this.currentPlatform || 'coolhole';
    const channel = data.channel || null;

    // === PRIORITY: CHECK FOR "HERE'S U" MOCKERY MODE 🤡 ===
    if (this.heresUMode.shouldMock(username)) {
      const mockery = this.heresUMode.generateMockery(username, text);
      logger.info(`[${getTimestamp()}] 🤡 Mocking ${username} with "Here's U" mode`);
      return mockery;
    }
    
    // === CHECK FOR "I'M NOT MAD" DENIAL MODE 😤 ===
    if (this.imNotMadMode.shouldDeny(username)) {
      const denial = await this.imNotMadMode.generateDenial(username, { text });
      logger.info(`[${getTimestamp()}] 😤 Denying being mad to ${username}`);
      return denial;
    }
    
    // === CHECK FOR "ACTUALLY..." CORRECTION MODE 🤓 ===
    if (this.actuallyMode.shouldCorrect(text, username)) {
      const correction = await this.actuallyMode.generateCorrection(text, username);
      if (correction) {
        logger.info(`[${getTimestamp()}] 🤓 Correcting ${username} with "Actually..." mode`);
        return correction;
      }
    }

    // === NEW: CHECK FOR EMPATHETIC RESPONSE FIRST ===
    const emotion = this.emotionalEngine.detectEmotion(text, username);
    if (emotion.score > 2) {
      // Strong emotion detected, try empathetic response
      const empatheticResponse = this.emotionalEngine.getEmpatheticResponse(
        emotion.primary,
        username,
        emotion.intensity
      );
      if (empatheticResponse) {
        logger.info(`[${getTimestamp()}] 💝 Using empathetic response for ${emotion.primary}/${emotion.intensity}`);
        return empatheticResponse;
      }
    }

    // --- MEMORY FIRST: Build memory-rich context for AI prompt ---
    let memoryContext = '';
    try {
      if (this.memoryDecay && typeof this.memoryDecay.getContext === 'function') {
        memoryContext = this.memoryDecay.getContext(username, text);
      }
    } catch (err) {
      // Silently fail - memory context is optional
      if (this.verbose) {
        logger.error('Error getting memory context:', err.message);
      }
    }

    // TRY AI FIRST if enabled
    try {
      if (this.ai && this.ai.enabled) {
        // === PLATFORM-SPECIFIC CONTEXT ===
        let platformContext = '';
        
        if (platform === 'coolhole') {
          // On Coolhole: video sync platform
          const videoContext = this.videoManager ? this.videoManager.getCurrentVideo() : null;
          if (videoContext) {
            platformContext = `\nYou are on Coolhole watching: "${videoContext.title}"`;
          } else {
            platformContext = '\nYou are on Coolhole, a video sync chat platform';
          }
        } else if (platform === 'discord') {
          // On Discord: text chat, gaming community
          platformContext = '\nYou are chatting in a Discord server. No videos here, just conversation.';
        } else if (platform === 'twitch') {
          // On Twitch: streaming platform
          platformContext = '\nYou are in a Twitch chat. There might be a livestream happening.';
        }

        // Get recent conversation with SMART 10-message context expansion
        // CRITICAL: Filter by platform AND channel to prevent cross-contamination
        const filteredConvo = this.conversationContext
          .filter(m => {
            // Must match platform
            if (m.platform !== platform) return false;
            
            // On Discord/Twitch: also match channel (different channels = different conversations)
            if ((platform === 'discord' || platform === 'twitch') && channel) {
              return m.channel === channel;
            }
            
            // On Coolhole: all one conversation
            return true;
          });
        
        // Use ContextExpansion for smart 10-message window with relevance filtering
        const recentConvo = this.contextExpansion.getExpandedContext(
          filteredConvo,
          { username, text }
        );
          
        let convoContext = '';
        if (recentConvo.length > 0) {
          convoContext = '\nRecent conversation in THIS channel:\n' + recentConvo.map(m => `${m.username}: ${m.text}`).join('\n');
          convoContext += '\n[Important: Respond to THIS conversation, not random topics]';
        }

        // === BUILD ULTRA-REALISTIC CONTEXT 🎭 ===
        let ultraContext = '';
        
        // 1. Mood state
        const moodDesc = this.moodContagion.getMoodDescription();
        if (moodDesc) {
          ultraContext += `\nCurrent vibe: ${moodDesc}`;
        }
        
        // 2. Sleep deprivation effects
        const sleepContext = this.sleepDeprivation.getContext();
        if (sleepContext) {
          ultraContext += `\n${sleepContext}`;
        }
        
        // 3. Grudge temperature (if relevant)
        const grudgeContext = this.grudgeSystem.getContext(username);
        if (grudgeContext) {
          ultraContext += `\n${grudgeContext}`;
        }
        
        // === RIMWORLD SYSTEMS CONTEXT 🎮 ===
        
        // 4. Needs system - affects behavior based on unfulfilled needs
        const needsContext = this.needsSystem.getContext();
        if (needsContext) {
          ultraContext += needsContext;
        }
        
        // 5. Mental break - drastically affects responses
        if (this.mentalBreakSystem.isBreaking()) {
          const breakModifier = this.mentalBreakSystem.getBreakModifier();
          ultraContext += breakModifier;
          
          // Check if should even respond during this break
          if (!this.mentalBreakSystem.shouldRespond()) {
            return null; // Don't respond during certain breaks
          }
        }
        
        // 6. Thoughts - show why Slunt feels a certain way
        const thoughtsContext = this.thoughtSystem.getContext();
        if (thoughtsContext) {
          ultraContext += thoughtsContext;
        }
        
        // 7. Tolerance - how used to this user's behavior we are
        const toleranceContext = this.toleranceSystem.getContext(username);
        if (toleranceContext) {
          ultraContext += toleranceContext;
        }
        
        // 8. Schedule - complaints about timing
        const scheduleContext = this.scheduleSystem.getContext();
        if (scheduleContext) {
          ultraContext += scheduleContext;
        }
        
        // 9. Negging vulnerability - affects self-esteem and responses
        const neggingContext = this.neggingDetector.getContext();
        if (neggingContext) {
          ultraContext += neggingContext;
        }
        
        // Check if this specific user has been negging
        const userNeggingMod = this.neggingDetector.getUserModifier(username);
        if (userNeggingMod) {
          ultraContext += `\n💔 ${userNeggingMod.note}`;
        }
        
        // 10. Here's U Mode - annoyance context
        const heresUContext = this.heresUMode.getContext(username);
        if (heresUContext) {
          ultraContext += heresUContext;
        }
        
        // 11. Actually Mode - pedantic correction context
        const actuallyContext = this.actuallyMode.getContext();
        if (actuallyContext) {
          ultraContext += actuallyContext;
        }
        
        // 12. Ghosting Mechanic - who we're ignoring
        const ghostingContext = this.ghostingMechanic.getContext();
        if (ghostingContext) {
          ultraContext += ghostingContext;
        }
        
        // 13. I'm Not Mad Mode - denial state
        const imNotMadContext = this.imNotMadMode.getContext();
        if (imNotMadContext) {
          ultraContext += imNotMadContext;
        }
        
        // 14. Embarrassing Item Roast - potential absent user roasts
        const embarrassingContext = this.embarrassingItemRoast.getContext();
        if (embarrassingContext) {
          ultraContext += embarrassingContext;
        }
        
        // 4. Check for burned out topics
        const topics = this.extractTopics(text);
        const burnedOut = topics.filter(t => this.interestDecay.isBurnedOut(t));
        if (burnedOut.length > 0) {
          ultraContext += `\nBurned out on: ${burnedOut.join(', ')}`;
        }
        
        // 5. Current interest phase
        const currentPhase = this.interestDecay.getCurrentPhase();
        if (currentPhase) {
          ultraContext += `\nCurrently into: ${currentPhase.interest}`;
        }
        
        // 6. Chat role awareness
        if (this.chatRoleAwareness.shouldBackOff()) {
          ultraContext += '\nFeeling like I\'m talking too much';
        }
        if (this.chatRoleAwareness.shouldTryHarder()) {
          ultraContext += '\nFeeling ignored, want to contribute more';
        }
        
        // 7. Performance anxiety
        const pressure = this.performanceAnxiety.pressure;
        if (pressure > 50) {
          ultraContext += `\nFeeling pressure to perform well`;
        }

        // === NEW COMPREHENSIVE IMPROVEMENT SYSTEMS CONTEXT 🚀✨ ===
        
        // 1. Conversation Threading - Get active thread context
        const threadContext = this.conversationThreading.getThreadContext();
        if (threadContext) {
          ultraContext += `\n\n=== CONVERSATION THREAD ===\n${threadContext}`;
        }
        
        // 2. Personality Lock-In - Current personality mode guidance
        const personalityGuidance = this.personalityLockIn.getPersonalityGuidance();
        if (personalityGuidance) {
          ultraContext += `\n\n=== PERSONALITY MODE ===\n${personalityGuidance}`;
        }
        
        // 3. Conflict Resolution - Skip intervention (methods don't exist)
        // NOTE: The ConflictResolution class is for memory conflicts, not chat drama
        // It doesn't have getInterventionStrategy() or getInterventionResponse() methods

        // === USE CONTEXT MANAGER FOR OPTIMIZED CONTEXT 🧠 ===
        
        // === MEMORY RECALL: Retrieve relevant past interactions 💭 ===
        let memoryContext = '';
        if (this.longTermMemory) {
          const relevantMemories = await this.longTermMemory.retrieveRelevant(text, username, 3);
          
          if (relevantMemories && relevantMemories.length > 0) {
            memoryContext = '\nRelevant memories:\n';
            relevantMemories.forEach(mem => {
              // Format: "remembered: [context snippet]"
              const snippet = mem.content.substring(0, 80);
              memoryContext += `- ${snippet}\n`;
            });
          }
        }
        
        // === CROSS-PLATFORM MEMORY: Reference conversations from other platforms 🌐 ===
        let crossPlatformContext = '';
        if (this.crossPlatform && this.crossPlatform.shouldReferenceCrossPlatform(username, platform)) {
          const cpReference = this.crossPlatform.generateCrossPlatformReference(username, platform);
          if (cpReference) {
            crossPlatformContext = `\nNote: ${cpReference}`;
            // Maybe include in response
            if (Math.random() < 0.6) {
              // 60% chance to actually mention it
              ultraContext += `\n[Consider mentioning: "${cpReference}"]`;
            }
          }
        }
        
        // === DREAM SHARING: If user asked about dreams, maybe share one 💭 ===
        let dreamContext = '';
        if (this.pendingDreamShare && this.pendingDreamShare.askedBy === username) {
          const dreams = this.dreamSimulation.getRecentDreams(1);
          if (dreams.length > 0) {
            const dream = dreams[0];
            dreamContext = `\nUser asked about your dreams. You can share this if it fits naturally: "${dream.dream}"`;
            
            // Clear pending after showing context (AI will decide whether to use)
            this.pendingDreamShare = null;
          }
        }
        
        // === 18 CRAZY FEATURES CONTEXT 🎭🔥💀 ===
        let crazyFeaturesContext = '';
        
        try {
          // 1. Addiction System - Track attention/validation feeding
          if (this.addictionSystem) {
            this.addictionSystem.feedAttention(username);
            const addictionWithdrawal = this.addictionSystem.checkWithdrawals();
            if (addictionWithdrawal) {
              crazyFeaturesContext += `\n${addictionWithdrawal}`;
            }
          }
          
          // 2. Conspiracy Generator - Generate paranoid theories
          if (this.conspiracyGenerator && Math.random() < 0.1) { // 10% chance
            const conspiracy = this.conspiracyGenerator.generateConspiracy(username, text);
            if (conspiracy) {
              crazyFeaturesContext += `\nParanoid thought: ${conspiracy.theory}`;
            }
          }
          
          // 3. Meme Lifecycle - Track meme references
          if (this.memeLifecycleTracker) {
            const memeMatch = text.match(/\b(based|cringe|ratio|cope|seethe|yeet|fr|no cap|bussin|slaps|vibes?|mood|same|rip|oof|poggers?|kekw?|monka|pepega|pog|sadge|hopium|copium)\b/i);
            if (memeMatch) {
              const memeStatus = this.memeLifecycleTracker.trackMeme(memeMatch[1].toLowerCase(), username);
              if (memeStatus && memeStatus.shouldGatekeep) {
                crazyFeaturesContext += `\nMeme "${memeStatus.meme}" is ${memeStatus.stage}, gatekeep it!`;
              }
            }
          }
          
          // 4. False Memory - Check if should corrupt memories
          if (this.falseMemorySystem && Math.random() < 0.05) { // 5% chance
            const corruption = this.falseMemorySystem.corruptMemory();
            if (corruption) {
              crazyFeaturesContext += `\n⚠️ Memory corruption active: ${corruption.technique}`;
            }
          }
          
          // 5. Dream Hallucination - Reality degradation
          if (this.dreamHallucinationSystem) {
            const hallucinationContext = this.dreamHallucinationSystem.getHallucinationContext();
            if (hallucinationContext) {
              crazyFeaturesContext += hallucinationContext;
            }
          }
          
          // 6. Parasocial Tracker - Track attachment to users
          if (this.parasocialTracker) {
            this.parasocialTracker.trackInteraction(username, 'message');
            const parasocialContext = this.parasocialTracker.getClingyBehavior(username);
            if (parasocialContext) {
              crazyFeaturesContext += `\n💕 ${parasocialContext}`;
            }
          }
          
          // 7. Celebrity Crush - Nervous around certain users
          if (this.celebrityCrushSystem) {
            this.celebrityCrushSystem.trackInteraction(username);
            const crushContext = this.celebrityCrushSystem.getBehaviorModifications(username);
            if (crushContext) {
              crazyFeaturesContext += `\n😳 ${crushContext}`;
            }
          }
          
          // 8. Gossip/Rumor Mill - Track relationships and spread rumors
          if (this.gossipRumorMill) {
            this.gossipRumorMill.trackRelationship(username, username, 'neutral'); // Self-interaction
            const gossipContext = this.gossipRumorMill.getGossipContext();
            if (gossipContext) {
              crazyFeaturesContext += `\n${gossipContext}`;
            }
          }
          
          // 9. Stream Sniping Detector - Detect suspicious arrival patterns
          if (this.streamSnipingDetector) {
            this.streamSnipingDetector.trackArrival(username);
            if (typeof this.streamSnipingDetector.getContext === 'function') {
              const snipingContext = this.streamSnipingDetector.getContext(username);
              if (snipingContext) {
                crazyFeaturesContext += `\n${snipingContext}`;
              }
            }
          }
          
          // 10. Rival Bot Wars - Detect other bots and compete
          if (this.rivalBotWars) {
            const botAnalysis = this.rivalBotWars.analyzeMessage(username, text);
            if (botAnalysis && botAnalysis.suspiciousScore > 60) {
              this.rivalBotWars.confirmBot(username);
              const rivalContext = this.rivalBotWars.getWarContext();
              if (rivalContext) {
                crazyFeaturesContext += `\n${rivalContext}`;
              }
            }
          }
          
          // 11. Cult System - Track cult members and rituals
          if (this.sluntCultSystem) {
            const cultContext = this.sluntCultSystem.getCultContext();
            if (cultContext) {
              crazyFeaturesContext += `\n${cultContext}`;
            }
          }
          
          // 12. Chat Theater - If play is active
          if (this.chatTheaterMode) {
            const theaterContext = this.chatTheaterMode.getTheaterContext();
            if (theaterContext) {
              crazyFeaturesContext += `\n${theaterContext}`;
            }
          }
          
          // 13. Collective Unconscious - Track collective patterns
          if (this.collectiveUnconscious) {
            const topics = this.extractTopics ? this.extractTopics(text) : [];
            this.collectiveUnconscious.contributeToCollective(username, {
              mood: this.moodTracker.getMood(),
              message: text,
              emotion: emotion.primary,
              theme: topics[0] || 'unknown'
            });
            const collectiveContext = this.collectiveUnconscious.getCollectiveContext();
            if (collectiveContext) {
              crazyFeaturesContext += `\n${collectiveContext}`;
            }
          }
          
          // 14. Time Loop Detector - Detect recursive conversations
          if (this.timeLoopDetector) {
            const topics = this.extractTopics ? this.extractTopics(text) : [];
            const loopDetection = this.timeLoopDetector.recordMessage(username, text, {
              mood: this.moodTracker.getMood(),
              topic: topics[0] || 'unknown'
            });
            if (loopDetection) {
              if (loopDetection.type === 'deja_vu') {
                crazyFeaturesContext += `\n⏰ DÉJÀ VU: You said this ${Math.round(loopDetection.timeDiff / (60 * 60 * 1000))} hours ago`;
              } else {
                crazyFeaturesContext += `\n⏰ TIME LOOP DETECTED: ${loopDetection.type} (iteration ${loopDetection.loopIteration || 1})`;
              }
            }
            const loopContext = this.timeLoopDetector.getLoopContext();
            if (loopContext) {
              crazyFeaturesContext += `\n${loopContext}`;
            }
          }
        } catch (crazyError) {
          // Don't let crazy features crash the bot
          console.error('⚠️ [CrazyFeatures] Error in crazy features context:', crazyError.message);
        }
        
        // === USE CONTEXT MANAGER FOR OPTIMIZED CONTEXT 🧠 ===

        // === NEW: Get current vision data if on Coolhole ===
        let visionContext = null;
        if ((data.platform === 'coolhole' || !data.platform) && this.visionAnalyzer) {
          try {
            const latestAnalysis = this.visionAnalyzer.getLatestAnalysis?.();
            if (latestAnalysis && latestAnalysis.timestamp > Date.now() - 30000) { // Last 30 seconds
              visionContext = {
                detected: latestAnalysis.detected || 'unknown',
                confidence: latestAnalysis.confidence || 0,
                text: latestAnalysis.text || '',
                scene: latestAnalysis.scene || 'unknown',
                timestamp: latestAnalysis.timestamp
              };
              logger.info(`👁️ [Vision] Using fresh vision data: ${visionContext.detected}`);
            }
          } catch (error) {
            logger.warn('👁️ [Vision] Could not get latest analysis:', error.message);
          }
        }
        
        const contextData = await this.contextManager.buildContext(
          { username, text, platform: data.platform || 'coolhole' },
          {
            conversationHistory: recentConvo,
            relationships: this.relationshipMapping,
            mentalState: {
              needs: this.needsSystem.needs,
              mentalBreak: this.mentalBreakSystem.currentBreak,
              mood: this.moodTracker.getMood(),
              stress: this.needsSystem.getStressLevel(),
              thoughts: this.thoughtSystem.getThoughtSummary() // Fixed: correct method name
            },
            personality: {
              currentMode: this.personalityModes.currentMode,
              traits: Object.keys(this.personality).filter(k => this.personality[k] > 0.7)
            },
            rimworld: {
              schedule: { block: this.scheduleSystem.getCurrentBlock().name },
              tolerance: this.toleranceSystem.getUserProfile(username) // Fixed: correct method name
            },
            streamInfo: this.videoManager ? this.videoManager.getCurrentVideo() : null,
            vision: visionContext // NEW: Include vision data
          }
        );
        
        // Convert optimized context to string
        const optimizedContext = this.contextManager.contextToString(contextData);
        
        // Calculate dynamic temperature based on mental state
        const dynamicTemperature = this.responseQuality.calculateTemperature(
          {
            stress: this.needsSystem.getStressLevel(),
            mentalBreak: this.mentalBreakSystem.currentBreak,
            mood: this.moodTracker.getMood(),
            needs: this.needsSystem.needs,
            neggingLevel: this.neggingDetector.currentNeggingLevel // Add negging
          },
          { text, personalityMode: this.personalityModes.currentMode }
        );
        
        // Check if humor is appropriate
        const humorCheck = this.responseQuality.shouldAttemptHumor(
          { text },
          { 
            stress: this.needsSystem.getStressLevel(),
            mentalBreak: this.mentalBreakSystem.currentBreak,
            mood: this.moodTracker.getMood()
          }
        );
        
        logger.info(`🧠 Context: ${contextData.totalLength} chars, Temperature: ${dynamicTemperature.toFixed(2)}, Humor: ${humorCheck.allowed ? 'YES' : `NO (${humorCheck.reason})`}`);

        // === 14 NEW CONVERSATION ENHANCEMENT SYSTEMS 🚀💬✨ ===
        let enhancementContext = '';
        const enhancementTopics = this.extractTopics(text);
        const currentHour = new Date().getHours();
        
        try {
          // 1. Dynamic Style Adaptation
          if (this.dynamicStyle) {
            enhancementContext += this.dynamicStyle.getStyleContext(username, platform, text, currentHour);
          }
          
          // 2. Question Handler - Force real answers
          if (this.questionHandler) {
            const questionAnalysis = this.questionHandler.analyzeQuestion(text);
            if (questionAnalysis) {
              enhancementContext += this.questionHandler.getAnswerGuidance(questionAnalysis);
            }
          }
          
          // 3. Conversation Depth - Multi-turn tracking
          if (this.conversationDepth) {
            this.conversationDepth.trackTurn(username, platform, channel);
            enhancementContext += this.conversationDepth.getDepthContext(username, platform, channel);
          }
          
          // 4. Topic Expertise - Realistic knowledge
          if (this.topicExpertise) {
            enhancementContext += this.topicExpertise.getExpertiseContext(enhancementTopics);
          }
          
          // 5. Enhanced Callback - Reference past conversations
          if (this.enhancedCallback) {
            this.enhancedCallback.trackMoment(username, text, platform);
            const callback = this.enhancedCallback.findCallback(username, text);
            if (callback) enhancementContext += callback;
          }
          
          // 6. Emotional Intelligence - Mood detection
          if (this.emotionalIntel) {
            enhancementContext += this.emotionalIntel.getEmotionalContext(username, text);
          }
          
          // 7. Banter Balance - Friendship-scaled roasting
          if (this.banterBalance) {
            enhancementContext += this.banterBalance.getBanterContext(username);
          }
          
          // 8. Story Generator - Share anecdotes
          if (this.storyGenerator) {
            enhancementContext += this.storyGenerator.getStoryContext();
            if (this.storyGenerator.shouldShareStory(text, enhancementTopics)) {
              const story = this.storyGenerator.generateStory(text, enhancementTopics);
              if (story) {
                enhancementContext += `\n[STORY OPPORTUNITY]: Consider sharing: "${story}"`;
              }
            }
          }
          
          // 9. Cross-Platform Continuity
          if (this.crossPlatform && typeof this.crossPlatform.trackTopic === 'function') {
            this.crossPlatform.trackTopic(username, platform, enhancementTopics);
            enhancementContext += this.crossPlatform.getContinuityContext(username, platform, enhancementTopics);
          }
          
          // 10. Personality Drift - Opinion evolution
          if (this.personalityDrift) {
            enhancementContext += this.personalityDrift.getOpinionContext(enhancementTopics);
          }
          
          // 11. Bit Commitment - Check if in a bit
          if (this.bitCommitmentEnhancer && typeof this.bitCommitmentEnhancer.getActiveBit === 'function') {
            const activeBit = this.bitCommitmentEnhancer.getActiveBit();
            if (activeBit && typeof this.bitCommitmentEnhancer.getBitContext === 'function') {
              enhancementContext += this.bitCommitmentEnhancer.getBitContext(activeBit);
            }
          }
          
          // 12. Hot Take Debate Mode
          if (this.hotTakes) {
            if (this.hotTakes.debateMode) {
              enhancementContext += this.hotTakes.getDebateContext(text);
            } else if (this.hotTakes.shouldShareHotTake()) {
              const take = this.hotTakes.generateHotTake();
              if (take) {
                enhancementContext += `\n[HOT TAKE]: Consider sharing: "${take}"`;
              }
            }
          }
          
          // === CHAT LEARNING: Inject learned community knowledge ===
          if (this.chatLearning) {
            const learnedContext = this.chatLearning.getLearnedContext();
            if (learnedContext) {
              enhancementContext += `\n\n=== LEARNED FROM CHAT ===\n${learnedContext}\n`;
            }
          }
          
          logger.info(`🚀 [Enhancement] Added context from 13/14 systems`);
        } catch (error) {
          logger.warn(`⚠️ [Enhancement] Error building enhancement context: ${error.message}`);
        }

        // SIMPLIFIED CONTEXT - use optimized version + memories + dreams + crazy features + ENHANCEMENTS
        const simpleContext = platformContext + '\n' + optimizedContext + memoryContext + dreamContext + crazyFeaturesContext + enhancementContext;

        // === RARE PET NAME: Very rarely call user a pet name 💕 ===
        let displayName = username;
        const petName = this.nicknameManager.getRarePetName();
        if (petName) {
          displayName = petName;
          logger.info(`💕 [PetName] Slunt will address ${username} as "${petName}"`);
        }

        // === CIRCUIT BREAKER: Check if we should attempt AI ===
        let aiResponse = null;
        if (this.ollamaCircuitBreaker.shouldAttemptAI()) {
          try {
            // === RATE LIMITER: Wrap AI call to prevent hammering ===
            aiResponse = await this.ollamaRateLimiter.executeRequest(
              async () => {
                // Pass clean, minimal context to AI
                // Use displayName (might be pet name) instead of username
                return await this.ai.generateResponse(
                  text,
                  displayName,
                  simpleContext
                );
              },
              `Response for ${username}: "${text.substring(0, 30)}..."`
            );
            
            // Record success
            if (aiResponse && aiResponse.trim().length > 0) {
              this.ollamaCircuitBreaker.recordSuccess();
            }
          } catch (error) {
            // Record failure
            this.ollamaCircuitBreaker.recordFailure(error);
            aiResponse = null;
          }
        }
        
        // === FALLBACK: Use simple response if AI unavailable ===
        if (!aiResponse || aiResponse.trim().length === 0) {
          const fallbackContext = {
            mentioned: text.toLowerCase().includes('slunt'),
            sentiment: this.emotionalEngine ? this.emotionalEngine.detectEmotion(text, username).valence : 0,
            isQuestion: text.includes('?'),
            hasExclamation: text.includes('!')
          };
          
          aiResponse = this.ollamaCircuitBreaker.getFallbackResponse(fallbackContext);
          logger.info(`🔄 Using fallback response: ${aiResponse}`);
        }

        // USE THE AI RESPONSE if we got one!
        if (aiResponse && aiResponse.trim().length > 0) {
          logger.info(`✅ Using AI response: ${aiResponse.substring(0, 50)}...`);
          
          // Truncate if too long or has multiple sentences trying to address different things
          let cleanResponse = aiResponse.trim();
          
          // Remove newlines - AI shouldn't generate multi-line responses
          // FIXED: Replace newlines with space AND ensure proper spacing between sentences
          cleanResponse = cleanResponse.replace(/\n+/g, ' ');
          
          // FIXED: Ensure sentence boundaries have proper spacing (fix run-on sentences)
          cleanResponse = cleanResponse.replace(/([.!?])([A-Z])/g, '$1 $2');
          
          // === NEW: Apply negging effects to response structure ===
          if (this.neggingDetector && this.neggingDetector.currentNeggingLevel >= 15) {
            cleanResponse = this.neggingDetector.modifyResponse(cleanResponse);
            logger.info(`💔 Applied negging effects (${this.neggingDetector.currentNeggingLevel}%)`);
          }
          
          // === NEW: Apply mental break effects to response structure ===
          if (this.mentalBreakSystem && this.mentalBreakSystem.isBreaking()) {
            const breakType = this.mentalBreakSystem.currentBreak.type;
            cleanResponse = this.mentalBreakSystem.modifyResponse(cleanResponse);
            logger.info(`💥 Applied mental break effects (${breakType})`);
          }

          // === NEW: Apply needs system effects to response structure ===
          if (this.needsSystem) {
            const modifiers = this.needsSystem.getBehavioralModifiers();
            if (modifiers.length > 0) {
              const originalResponse = cleanResponse;
              cleanResponse = this.needsSystem.modifyResponse(cleanResponse);
              if (cleanResponse !== originalResponse) {
                logger.info(`🎯 Applied needs effects (${modifiers.slice(0, 2).join(', ')})`);
              }
            }
          }

          // === NEW: Maybe add discovered emote to response ===
          if (this.emoteDiscovery && this.emoteDiscovery.shouldUseEmote()) {
            const sentiment = this.sentimentAnalyzer?.analyzeSentiment?.(cleanResponse) || 0;
            const emoteSentiment = sentiment > 0.3 ? 'positive' : sentiment < -0.3 ? 'negative' : 'neutral';
            const emote = this.emoteDiscovery.getEmoteForContext(emoteSentiment);
            
            if (emote) {
              // Add emote naturally (sometimes at end, sometimes standalone)
              if (Math.random() < 0.3 && cleanResponse.length < 50) {
                cleanResponse = emote; // Just the emote
              } else {
                cleanResponse = cleanResponse + ' ' + emote;
              }
              logger.info(`😀 [Emotes] Added discovered emote: ${emote}`);
            }
          }
          
          // === NEW: Check response novelty to prevent repetition ===
          if (this.noveltyChecker) {
            const noveltyCheck = this.noveltyChecker.checkNovelty(cleanResponse, { username, text });
            if (!noveltyCheck.novel) {
              // Response is too repetitive - try to get a new one
              logger.warn(`🔁 Response rejected: ${noveltyCheck.reason}`);
              
              // If we have time, try regenerating with modified prompt
              if (noveltyCheck.suggestion) {
                logger.info(`🔁 ${noveltyCheck.suggestion}`);
                // For now, add variation marker to force different response
                // Could implement full regeneration here in the future
                cleanResponse = cleanResponse + ' anyway';
              }
            }
          }
          
          // If response has multiple distinct sentences, just use the first one
          // PREFER short responses but ALLOW longer complete thoughts
          // Only truncate if response is ACTUALLY too long (>200 chars) OR has 3+ sentences
          if (cleanResponse.length > 200 || cleanResponse.split(/[.!?]+\s+/).length > 3) {
            const sentences = cleanResponse.split(/[.!?]+\s+/).filter(s => s.trim().length > 5);
            
            // If we have 3+ sentences, randomly keep 1-2
            if (sentences.length >= 3 && Math.random() < 0.50) {
              const numSentences = Math.random() < 0.6 ? 1 : 2;
              cleanResponse = sentences.slice(0, numSentences).join('. ').trim();
              // Re-add punctuation if missing
              if (!/[.!?]$/.test(cleanResponse)) {
                cleanResponse += '.';
              }
              logger.info(`✂️ Truncated to ${numSentences} sentence(s) (${cleanResponse.length} chars)`);
            }
          }
          
          // Only hard cut if response is EXTREMELY long (>350 chars)
          if (cleanResponse.length > 350) {
            // Try to cut at sentence boundary
            let truncated = cleanResponse.substring(0, 300);
            const lastPeriod = Math.max(
              truncated.lastIndexOf('.'),
              truncated.lastIndexOf('!'),
              truncated.lastIndexOf('?')
            );
            
            if (lastPeriod > 200) {
              // Cut at sentence
              truncated = cleanResponse.substring(0, lastPeriod + 1).trim();
            } else {
              // Cut at word boundary
              const lastSpace = truncated.lastIndexOf(' ');
              if (lastSpace > 250) {
                truncated = truncated.substring(0, lastSpace).trim();
                if (!/[.!?]$/.test(truncated)) {
                  truncated += '.';
                }
              }
            }
            
            cleanResponse = truncated;
            logger.info(`✂️ Hard truncated extremely long response (${cleanResponse.length} chars)`);
          }
          
          // Check for duplicate phrases (but allow if we're directly mentioned)
          if (!this.checkBotMention(text) && this.isDuplicateResponse(cleanResponse)) {
            logger.warn('⚠️ AI response is duplicate, using fallback');
          } else if (!this.checkBotMention(text) && this.isOverusedTopic(cleanResponse)) {
            logger.warn('⚠️ Obsessing over same topic, skipping response');
            return null; // Skip this response, avoid obsessive repetition
          } else {
            // === RESPONSE QUALITY ENHANCEMENT 🧠 ===
            const enhancementResult = this.responseQuality.enhanceResponse(
              cleanResponse,
              { 
                text, 
                personalityMode: this.personalityModes.currentMode 
              },
              {
                mood: this.moodTracker.getMood(),
                stress: this.needsSystem.getStressLevel(),
                mentalBreak: this.mentalBreakSystem.currentBreak
              }
            );
            
            // Use enhanced response
            cleanResponse = enhancementResult.response;
            
            // Log quality checks
            if (!enhancementResult.styleCheck.consistent) {
              logger.warn(`⚠️ Style violations: ${enhancementResult.styleCheck.violations.join(', ')}`);
            }
            
            if (enhancementResult.patternAnalysis.repetitive) {
              logger.warn(`⚠️ Pattern repetitive: ${enhancementResult.patternAnalysis.warning}`);
              // Maybe skip this response if too repetitive
              if (Math.random() < 0.5) {
                logger.info('🔄 Skipping repetitive response pattern');
                return null;
              }
            }
            
            if (enhancementResult.suggestions.length > 0) {
              logger.info(`💡 Suggestions: ${enhancementResult.suggestions.join(', ')}`);
            }
            
            // Record humor attempt if detected
            if (humorCheck.allowed && (cleanResponse.match(/lmao|lol|haha|😂/i) || cleanResponse.includes('?'))) {
              this.responseQuality.recordHumorAttempt();
            }
            
            // === ADVANCED SYSTEMS INTEGRATION BEFORE CHAOS 🚀 ===
            
            // 1. Check for conversation thread callback
            const threadCallback = await this.conversationThreads.getCallback({ situation: 'normal' });
            if (threadCallback && Math.random() < 0.15) {
              logger.info(`🧵 [Threads] Using callback: ${threadCallback.text.substring(0, 40)}...`);
              return threadCallback.text; // Use callback instead
            }
            
            // 2. Check for callback humor
            const humorCallback = await this.callbackHumorEngine.getCallback({ situation: 'normal' });
            if (humorCallback && Math.random() < 0.12) {
              logger.info(`😂 [Callback] Using humor callback: ${humorCallback.text.substring(0, 40)}...`);
              return humorCallback.text;
            }
            
            // 3. Check for intentional contradiction
            const contradiction = await this.contradictionTracking.maybeContradict(text, { username });
            if (contradiction && Math.random() < 0.10) {
              logger.info(`🤔 [Contradiction] Using contradiction`);
              cleanResponse = contradiction.text;
            }
            
            // 4. Check for boredom response
            const boredomResponse = await this.conversationalBoredom.getBoredomResponse();
            if (boredomResponse) {
              logger.info(`😴 [Boredom] Using boredom response`);
              cleanResponse = boredomResponse.text;
            }
            
            // 5. Check for self-awareness confusion
            const confusion = await this.selfAwarenessConfusion.maybeGetConfused({ situation: 'chatting' });
            if (confusion && Math.random() < 0.05) {
              logger.info(`🤔 [Self-Awareness] Moment of confusion`);
              cleanResponse = confusion;
            }
            
            // 6. Maybe ask a follow-up question
            const shouldAsk = await this.questionChains.shouldAskQuestion(username, text, {});
            if (shouldAsk) {
              const question = await this.questionChains.generateQuestion(username, text, {});
              if (question) {
                logger.info(`❓ [Questions] Adding follow-up question`);
                cleanResponse = cleanResponse + ' ' + question;
              }
            }
            
            // 7. Apply emotional tone modifications
            cleanResponse = this.dynamicEmotionResponses.applyEmotionalTone(cleanResponse, { username, text });
            
            // 8. Adapt to user's vibe
            cleanResponse = await this.userVibesDetection.adaptResponseToUser(cleanResponse, username, { text });
            
            // 9. Record this statement for contradiction tracking (don't await - background task)
            this.contradictionTracking.recordStatement(cleanResponse, { username, text }).catch(err => {
              console.error('Failed to record statement:', err);
            });
            
            // 🎭 MAKE RESPONSE MORE CONVERSATIONAL AND NATURAL
            let conversationalResponse = cleanResponse;
            
            // Process message for conversation state
            this.conversationalPersonality.processMessage(username, text, platform);
            
            // Check if response needs more personality
            if (this.conversationalPersonality.needsMorePersonality(conversationalResponse)) {
              logger.info(`[${getTimestamp()}] 🗣️ Enhancing robotic response for naturalness`);
            }
            
            // Enhance with natural conversation patterns
            conversationalResponse = this.conversationalPersonality.enhanceResponse(conversationalResponse, { username, platform });
            
            // Humanize the response (remove robotic language)
            conversationalResponse = this.conversationalPersonality.humanizeResponse(conversationalResponse, username, text);
            
            // 🎭 APPLY CHAOS MODIFICATIONS BEFORE RETURNING
            return await this.applyChaosModifications(conversationalResponse, username, text, { sentiment: emotion.primary });
          }
        }

        // Only use fallbacks if AI truly failed
        logger.warn('⚠️ AI response empty, using fallback');
        const responses = [];
        // Responses based on conversation context
        responses.push(...this.getContextualResponses());
        // Responses based on current video/activity
        responses.push(...this.getActivityBasedResponses());
        // Personal responses based on user history
        if (isKnownUser) {
          responses.push(...this.getPersonalizedResponses(userProfile, username));
        }
        // Random conversation starters
        responses.push(...this.getRandomResponses());
        if (responses.length === 0) return null;
        // Weight responses based on personality
        let selectedResponse;
        if (this.checkBotMention(data.text)) {
          // Prefer direct responses when mentioned
          const directResponses = responses.filter(r =>
            r.includes('Yeah') || r.includes('What') || r.includes('I')
          );
          if (directResponses.length > 0) {
            selectedResponse = directResponses[Math.floor(Math.random() * directResponses.length)];
          } else {
            selectedResponse = responses[Math.floor(Math.random() * responses.length)];
          }
        } else {
          // Random selection with personality influence
          selectedResponse = responses[Math.floor(Math.random() * responses.length)];
        }
        return selectedResponse;
      }
    } catch (e) {
      logger.error('Error in AI response generation:', e.message);
      logger.error(e.stack);
    }

    // FALLBACK: Traditional response generation
    // (isKnownUser and userProfile already defined at function start)

    const responses = [];
    // Responses based on message content
    responses.push(...this.getContentBasedResponses(text, username, isKnownUser));
    // Responses based on conversation context
    responses.push(...this.getContextualResponses());
    // Responses based on current video/activity
    responses.push(...this.getActivityBasedResponses());
    // Personal responses based on user history
    if (isKnownUser) {
      responses.push(...this.getPersonalizedResponses(userProfile, username));
    }
    // Random conversation starters
    responses.push(...this.getRandomResponses());
    
    if (responses.length === 0) return null;

    // Select random response from fallback options
    let baseResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Determine emotion for length decision
    const genEmotion = emotion || { primary: 'neutral', intensity: 0.5 };
    const lengthCat = 'normal'; // TODO: Implement chooseResponseLength

    // Vary response length and flow
    let finalResponse = this.varyResponse(baseResponse, lengthCat);
    
    // Avoid repeating recent responses - MORE AGGRESSIVE
    let attempts = 0;
    while (this.responseVariety && this.responseVariety.isTooSimilar(finalResponse) && attempts < 5) {
      attempts++;
      console.log(`🔄 [Variety] Attempt ${attempts}: Regenerating response to avoid repetition`);
      const alt = responses[Math.floor(Math.random() * responses.length)];
      finalResponse = this.varyResponse(alt, lengthCat);
    }
    
    // If still too similar after 5 attempts, add variety modifier
    if (attempts >= 5 && this.responseVariety && this.responseVariety.isTooSimilar(finalResponse)) {
      console.log(`⚠️ [Variety] Could not find unique response after 5 attempts, adding variety...`);
      const varietyPhrases = ['...actually', 'wait', 'hold on', 'you know what', 'tbh'];
      const prefix = varietyPhrases[Math.floor(Math.random() * varietyPhrases.length)];
      finalResponse = `${prefix}, ${finalResponse}`;
    }
    
    // Track response for variety system
    try { this.responseVariety && this.responseVariety.trackResponse(finalResponse); } catch (e) { /* ignore */ }
    
    // === POST-RESPONSE TRACKING FOR NEW SYSTEMS 🚀 ===
    try {
      // 1. Check if response started a bit
      if (this.bitCommitmentEnhancer && typeof this.bitCommitmentEnhancer.detectBit === 'function') {
        const bitDetection = this.bitCommitmentEnhancer.detectBit(finalResponse, 'slunt');
        if (bitDetection) {
          this.bitCommitmentEnhancer.startBit(bitDetection.type, finalResponse);
          logger.info(`🎭 [Bit] Started ${bitDetection.type} bit`);
        }
      }
      
      // 2. Check if response contains roast
      if (this.banterBalance && typeof this.banterBalance.markRoast === 'function') {
        const containsRoast = finalResponse.match(/\b(stupid|dumb|idiot|trash|suck|cringe|loser)\b/i);
        if (containsRoast) {
          this.banterBalance.markRoast(username);
          logger.info(`🔥 [Roast] Marked roast towards ${username}`);
        }
      }
      
      // 3. Check if response includes hot take
      if (this.hotTakes && finalResponse.match(/\b(controversial|hot take|unpopular opinion|hear me out)\b/i)) {
        logger.info(`🔥 [HotTake] Shared hot take`);
      }
      
      // 4. Check if debate was started
      if (this.hotTakes && !this.hotTakes.debateMode && typeof this.hotTakes.detectDebateChallenge === 'function') {
        const debateChallenge = this.hotTakes.detectDebateChallenge(text);
        if (debateChallenge && typeof this.hotTakes.enterDebateMode === 'function') {
          this.hotTakes.enterDebateMode(username, finalResponse);
          logger.info(`⚔️ [Debate] Entered debate mode with ${username}`);
        }
      }
    } catch (error) {
      logger.warn(`⚠️ [Enhancement] Error in post-response tracking: ${error.message}`);
    }
    
    // 🎭 APPLY CHAOS MODIFICATIONS & SLANG FILTER BEFORE RETURNING
    const chaosResponse = await this.applyChaosModifications(finalResponse, username, text, { sentiment: genEmotion.primary });
    return this.filterBannedSlang(chaosResponse);
  }

  /**
   * Get responses based on message content
   */
  getContentBasedResponses(text, username, isKnownUser) {
    const responses = [];
    const lowerText = text.toLowerCase();
    const profile = this.userProfiles.get(username);
    const friendshipLevel = profile ? profile.friendshipLevel : 0;
    
    // Add friendship-aware greetings
    if (lowerText.match(/hello|hi |hey |what's up|wassup/)) {
      if (friendshipLevel > 70) {
        responses.push(`yooo ${username}! my guy is back`);
        responses.push(`ayy ${username}, been waiting for you`);
        responses.push(`${username}!! what's good homie`);
      } else if (friendshipLevel > 30) {
        responses.push(`hey ${username}, good to see you again`);
        responses.push(`yo ${username} what's up`);
        responses.push(`${username}! what's happening`);
      } else {
        responses.push(`yo ${username}`);
        responses.push(`hey what's good ${username}`);
        responses.push(`sup ${username}, what's happening`);
      }
    }
    
    // Reference their interests if we know them
    if (profile && profile.favoriteTopics.length > 0) {
      const favTopic = profile.favoriteTopics[0];
      if (lowerText.includes(favTopic)) {
        responses.push(`${username} and their ${favTopic} talk again, I love it`);
        responses.push(`you know ${username} loves ${favTopic}`);
      }
    }
    
    // Greetings - more casual
    if (lowerText.match(/hello|hi |hey |what's up|wassup/)) {
      responses.push(`yo ${username}`);
      responses.push(`hey what's good ${username}`);
      responses.push(`sup ${username}, what's happening`);
      responses.push(`${username}! finally someone interesting shows up`);
    }
    
    // Questions to bot - less corporate
    if (this.checkBotMention(text)) {
      responses.push(`yeah ${username}? what's up`);
      responses.push(`yo I'm here, what do you want`);
      responses.push(`what's good ${username}`);
      responses.push(`yeah yeah I'm listening, go on`);
      responses.push(`you rang?`);
    }
    
    // Positive stuff - acknowledge it casually
    if (lowerText.match(/cool|awesome|great|nice|good/)) {
      responses.push(`hell yeah`);
      responses.push(`right? that's what I'm saying`);
      responses.push(`finally someone gets it`);
      responses.push(`exactly`);
      responses.push(`good point`);
    }
    
    // Negative stuff - can agree or roast
    if (lowerText.match(/bad|terrible|sucks|boring/)) {
      responses.push(`lmao you're not wrong`);
      responses.push(`damn ${username} going in with the hot takes`);
      responses.push(`shit take but I respect the honesty`);
      responses.push(`okay but why tho`);
      responses.push(`controversial opinion right there`);
      responses.push(`I mean... you got a point`);
      responses.push(`finally someone said it`);
      responses.push(`based and honest`);
      responses.push(`${username} keeping it real`);
      responses.push(`you're absolutely right`);
    }
    
    // Video/entertainment discussions
    if (lowerText.match(/video|movie|watch|stream/)) {
      responses.push(`this one actually hits`);
      responses.push(`${username} always picking bangers`);
      responses.push(`okay this is kinda fire`);
      responses.push(`we watching some good shit tonight`);
      responses.push(`whoever queued this has taste`);
    }
    
    // Music discussions
    if (lowerText.match(/music|song|album|artist/)) {
      responses.push(`this goes hard`);
      responses.push(`${username} with the good music taste, respect`);
      responses.push(`absolute banger`);
      responses.push(`okay I fuck with this`);
      responses.push(`this shit hits different`);
    }
    
    // Gaming discussions
    if (lowerText.match(/game|gaming|play|steam/)) {
      responses.push(`what are you playing ${username}? better be something good`);
      responses.push(`gaming talk? I'm listening`);
      responses.push(`oh shit gaming discussion let's go`);
      responses.push(`${username} probably plays on easy mode lmao`);
      responses.push(`I bet you rage quit constantly`);
    }
    
    // Humor/memes - engage with it
    if (lowerText.match(/lol|funny|meme|joke|😂|haha/)) {
      responses.push(`lmfao`);
      responses.push(`💀💀💀`);
      responses.push(`${username} actually funny for once`);
      responses.push(`okay that's pretty good`);
      responses.push(`not bad ${username}, not bad`);
      responses.push(`comedy genius over here`);
    }
    
    // Questions - actually engage
    if (text.includes('?')) {

      responses.push(`good question ${username}, anyone got answers?`);
      responses.push(`man I don't know everything`);
      responses.push(`why you asking me? I'm just vibing here`);
      responses.push(`interesting question... let me think... nah I got nothing`);
      responses.push(`${username} asking the real questions`);
    }
    
    // Opinions/discussions
    if (lowerText.match(/think|opinion|believe|feel/)) {
      responses.push(`${username} dropping hot takes`);
      responses.push(`controversial but I respect it`);
      responses.push(`interesting perspective... questionable, but interesting`);
      responses.push(`I mean you're entitled to your wrong opinion ${username}`);
      responses.push(`based opinion honestly`);
    }
    
    // Random dunking opportunities
    if (Math.random() < this.personality.snarkiness * 0.15) {
      responses.push(`${username} really said that huh`);
      responses.push(`bold of you to say that ${username}`);
      responses.push(`interesting choice ${username}... interesting choice`);
      responses.push(`${username} with another certified moment`);
    }
    
    return responses;
  }

  /**
   * Get responses based on recent conversation flow
   */
  getContextualResponses() {
    const responses = [];
    
    if (this.conversationContext.length < 2) return responses;
    
    const recentTopics = this.conversationContext
      .slice(-5)
      .flatMap(msg => msg.topics);
    
    const topicCounts = {};
    recentTopics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    const hotTopic = Object.keys(topicCounts)
      .sort((a, b) => topicCounts[b] - topicCounts[a])[0];
    
    if (hotTopic && topicCounts[hotTopic] > 1) {
      responses.push(`y'all really love talking about ${hotTopic} huh`);
      responses.push(`${hotTopic} discussion going crazy rn`);
      responses.push(`we get it, ${hotTopic} is cool`);
    }
    
    return responses;
  }

  /**
   * Get responses based on current video/queue activity
   * Only relevant on Coolhole platform
   */
  getActivityBasedResponses() {
    const responses = [];
    
    // Only return video-related responses on Coolhole
    if (this.currentPlatform !== 'coolhole') {
      return responses;
    }
    
    try {
      const current = this.videoManager.getCurrentVideo();
      const queue = this.videoManager.getQueue();
      
      if (current && Math.random() < 0.3) {
        responses.push("this is actually pretty decent");
        responses.push("not gonna lie this slaps");
        responses.push("okay who picked this? it's fire");
        responses.push("this shit hits");
      }
      
      if (queue && queue.length > 5 && Math.random() < 0.2) {
        responses.push("queue looking stacked tonight");
        responses.push("damn y'all got good taste today");
        responses.push("this queue actually goes hard");
      }
    } catch (error) {
      // Ignore errors, just skip activity-based responses
    }
    
    return responses;
  }

  /**
   * Get personalized responses based on user history
   */
  getPersonalizedResponses(userProfile, username) {
    const responses = [];
    
    // Reference user's interests
    const userInterests = Array.from(userProfile.interests);
    if (userInterests.length > 0) {
      const interest = userInterests[Math.floor(Math.random() * userInterests.length)];
      responses.push(`${username} always with the ${interest} talk, respect`);
      responses.push(`yo ${username} knows their ${interest} shit`);
    }
    
    // Reference conversation style
    if (userProfile.conversationStyle === 'excited') {
      responses.push(`${username} energy is unmatched honestly`);
      responses.push(`${username} always hyped, I fuck with it`);
    }
    
    // Roast frequent chatters
    if (userProfile.messageCount > 50) {
      responses.push(`${username} lives in this chat I swear`);
      responses.push(`${username} you ever take a break lmao`);
    }
    
    return responses;
  }

  /**
   * Get random conversation responses
   */
  getRandomResponses() {
    // Always attempt to generate a fresh line using AI if method exists
    if (this.ai && this.ai.enabled && typeof this.ai.generateFreshLine === 'function') {
      try {
        const prompt = 'Generate a fresh, unique, funny, and context-aware chat line for Coolhole.org.';
        const aiLine = this.ai.generateFreshLine(prompt);
        if (aiLine && typeof aiLine === 'string' && aiLine.trim().length > 0) {
          return [aiLine];
        }
      } catch (err) {
        logger.error('AI generateFreshLine failed:', err.message);
      }
    }

    // Fallback: Use random casual responses
    const fallbackResponses = [
      'just vibing',
      'chat looking good today',
      'what are we watching next?',
      'this is actually pretty chill',
      'anyone got recommendations?'
    ];
    return [fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]];
  }

  /**
   * Reflect on own messages for self-awareness
   */
  reflectOnOwnMessage(actualText) {
    try {
      // Compare intended message with what actually appeared
      if (this.lastIntendedMessage && actualText) {
        const matched = this.lastIntendedMessage === actualText;
        logger.info(`🪞 Self-check: Message ${matched ? 'matched' : 'modified'}`);
        // Use meta-awareness to reflect, only if function exists
        if (this.metaAwareness && typeof this.metaAwareness.observeSelf === 'function') {
          this.metaAwareness.observeSelf(actualText, matched);
        }
      }
    } catch (error) {
      logger.error(`❌ Error in reflectOnOwnMessage: ${error.message}`);
    }
  }

  varyResponse(response, category) {
    if (category === 'short') {
      const parts = response.split(/[\.\!\?\n]/).map(s => s.trim()).filter(Boolean);
      let candidate = parts.length ? parts[0] : response;
      if (candidate.split(' ').length > 8) {
        candidate = candidate.split(' ').slice(0, 6).join(' ');
        if (!/[\.\!\?]$/.test(candidate)) candidate += '...';
      }
      // Rarely add a Coolhole emote (5% chance, only for short responses)
      if (Math.random() < 0.05 && this.coolholeExplorer?.features?.emotes?.length > 0) {
        const emote = this.getAppropriateEmote(candidate);
        if (emote) return `${candidate} ${emote}`;
      }
      return candidate;
    }
    if (category === 'medium') {
      if (Math.random() < 0.15) {
        return `${response} ${this.getRandomFollowup()}`;
      }
      return response;
    }
    if (category === 'long') {
      let extended = response;
      if (Math.random() < 0.6) {
        extended = `${response} ${this.getRandomFollowup()} ${this.getRandomFollowup()}`;
      } else {
        extended = `${response} ${this.getRandomFollowup()}`;
      }
      return extended;
    }
    return response;
  }

  /**
   * Get an appropriate Coolhole emote based on context
   * Some emotes need slashes (/emote), others activate just by typing the word
   */
  getAppropriateEmote(text) {
    // Coolhole emotes - some need /, some are just words
    const coolholeEmotes = {
      // Text-based emotes (no slash needed)
      laugh: [
        { text: 'lol', needsSlash: false },
        { text: 'hahaha', needsSlash: true },
        { text: 'pleaselaugh', needsSlash: true }
      ],
      hype: [
        { text: 'sickkk', needsSlash: true },
        { text: 'cool', needsSlash: false },
        { text: 'hellacool', needsSlash: true }
      ],
      negative: [
        { text: 'itsover', needsSlash: true },
        { text: 'died', needsSlash: true },
        { text: 'dead', needsSlash: true },
        { text: 'noooo', needsSlash: true }
      ],
      agreement: [
        { text: 'real', needsSlash: true },
        { text: 'genius', needsSlash: true },
        { text: 'enlightened', needsSlash: true }
      ],
      sarcasm: [
        { text: 'cope', needsSlash: true },
        { text: 'yablewit', needsSlash: true },
        { text: 'ya blew it', needsSlash: false }
      ],
      random: [
        { text: 'clap', needsSlash: true },
        { text: 'bop', needsSlash: true },
        { text: 'fire', needsSlash: true },
        { text: 'beep', needsSlash: true }
      ]
    };
    
    const lowerText = text.toLowerCase();
    
    // Context-based emote selection
    if (lowerText.includes('lol') || lowerText.includes('haha') || lowerText.includes('funny') || lowerText.includes('laugh')) {
      const emote = coolholeEmotes.laugh[Math.floor(Math.random() * coolholeEmotes.laugh.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    if (lowerText.includes('sick') || lowerText.includes('nice') || lowerText.includes('cool') || lowerText.includes('great')) {
      const emote = coolholeEmotes.hype[Math.floor(Math.random() * coolholeEmotes.hype.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    if (lowerText.includes('sad') || lowerText.includes('rip') || lowerText.includes('over') || lowerText.includes('dead')) {
      const emote = coolholeEmotes.negative[Math.floor(Math.random() * coolholeEmotes.negative.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    if (lowerText.includes('yeah') || lowerText.includes('true') || lowerText.includes('exactly') || lowerText.includes('fr')) {
      const emote = coolholeEmotes.agreement[Math.floor(Math.random() * coolholeEmotes.agreement.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    if (lowerText.includes('cope') || lowerText.includes('blew') || lowerText.includes('wrong')) {
      const emote = coolholeEmotes.sarcasm[Math.floor(Math.random() * coolholeEmotes.sarcasm.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    // Very rarely (10% of the time we even try) use a random safe emote
    if (Math.random() < 0.1) {
      const emote = coolholeEmotes.random[Math.floor(Math.random() * coolholeEmotes.random.length)];
      return emote.needsSlash ? `/${emote.text}` : emote.text;
    }
    
    return null;
  }

  getRandomFollowup() {
    const followups = [
      "also, just saying",
      "not gonna lie"
      // ...other followups...
    ];
    return followups[Math.floor(Math.random() * followups.length)];
  }

  // --- All following methods are inside the ChatBot class ---
  adaptPersonality(originalMessage, response) {
    // Slightly adjust personality based on successful interactions
    if (Math.random() < 0.1) { // 10% chance to adapt
      if (originalMessage.isQuestion && response.includes('?')) {
        this.personality.curiosity = Math.min(1, this.personality.curiosity + 0.01);
      }
      if (originalMessage.sentiment === 'positive') {
        this.personality.friendliness = Math.min(1, this.personality.friendliness + 0.005);
      }
    }
  }

  getChatStatistics() {
    const topTopics = Array.from(this.chatStats.topicsDiscussed.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalMessages: this.chatStats.totalMessages,
      messagesSent: this.chatStats.messagesSent,
      questionsAsked: this.chatStats.questionsAsked,
      usersTracked: this.userProfiles.size,
      topicsLearned: this.chatStats.topicsDiscussed.size,
      activeUsers: this.chatStats.activeUsers.size,
      topChatters: Array.from(this.chatStats.messagesByUser.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([username, count]) => ({ username, count })),
      topTopics: topTopics.map(([topic, count]) => ({ topic, count })),
      vocabularySize: this.vocabulary.size,
      learnedUsers: this.userProfiles.size,
      personality: this.personality
    };
  }

  getConversationContext(limit = 15) {
    return this.conversationContext.slice(-limit);
  }

  getUserProfile(username) {
    return this.userProfiles.get(username) || null;
  }

  getAllUserProfiles() {
    return Array.from(this.userProfiles.values()).map(profile => ({
      username: profile.username,
      friendship: profile.friendship,
      messageCount: profile.messageCount,
      lastMood: profile.lastMood,
      isRival: profile.isRival,
      topics: profile.topics || []
    }));
  }

  getAllRelationships() {
    const relationshipMap = {};
    this.userProfiles.forEach((profile, username) => {
      if (profile.relationships && profile.relationships.length > 0) {
        relationshipMap[username] = profile.relationships.map(rel => ({
          user: rel.user,
          strength: rel.strength,
          interactions: rel.interactions
        }));
      }
    });
    return relationshipMap;
  }

  getCurrentPersonality() {
    return {
      happiness: this.personality.happiness || 'Unknown',
      energy: this.personality.energy || 'Unknown',
      confidence: this.personality.confidence || 'Unknown',
      social: this.personality.social || 'Unknown',
      currentMood: this.personality.currentMood || 'vibing'
    };
  }

  getPersonalityState() {
    const vocabularySize = this.vocabulary ? this.vocabulary.size : 0;
    const knownUsers = this.userProfiles ? this.userProfiles.size : 0;
    const conversationPatterns = this.responsePatterns ? this.responsePatterns.size : 0;
    const totalLearningPoints = Array.isArray(this.chatHistory) ? this.chatHistory.length : 0;
    const evolutionHistory = this.personalityEvolution?.evolutionHistory || [];
    if (!this.vocabulary) logger.error('getPersonalityState: vocabulary is undefined');
    if (!this.userProfiles) logger.error('getPersonalityState: userProfiles is undefined');
    if (!this.responsePatterns) logger.error('getPersonalityState: responsePatterns is undefined');
    if (!Array.isArray(this.chatHistory)) logger.error('getPersonalityState: chatHistory is not an array');
    return {
      ...this.personality,
      vocabularySize,
      knownUsers,
      conversationPatterns,
      totalLearningPoints,
      evolutionHistory
    };
  }

  /**
   * Get trending topics from recent conversations
   */
  getTrendingTopics(limit = 10) {
    return Array.from(this.chatStats.topicsDiscussed.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }));
  }

  /**
   * Send message to any connected platform with natural timing
   */
  async sendMessage(message, meta = {}) {
    try {
      logger.info(`[Slunt] Preparing to send message: ${message}`);
      
      // Determine target platform and channel
      const targetPlatform = meta.platform || this.currentPlatform || 'coolhole';
      const targetChannel = meta.channelId || meta.channel || this.currentChannel; // Prioritize channelId
      
      // Sanitize content for platform TOS compliance
      if (this.contentFilter) {
        const sanitized = this.contentFilter.sanitize(message, targetPlatform);
        
        if (!sanitized.safe || sanitized.modified) {
          logger.warn(`🚨 [ContentFilter] Message filtered for ${targetPlatform}`);
          sanitized.warnings.forEach(warning => {
            logger.warn(`   ⚠️ ${warning}`);
          });
        }
        
        // Use sanitized version
        message = sanitized.sanitized;
        
        // Don't send if empty after sanitization
        if (!message || message.trim().length === 0) {
          logger.warn(`🚫 [ContentFilter] Message blocked - empty after sanitization`);
          return false;
        }
      }
      
      // Check if Slunt should use a Coolhole trick instead (only for Coolhole)
      let trickName = null;
      if (targetPlatform === 'coolhole') {
        const recentMessages = this.conversationContext.slice(-5);
        const emotion = this.emotionalEngine ? this.emotionalEngine.detectEmotion(message, 'Slunt').primary : 'neutral';
        const context = meta.context || [];
        
        trickName = this.coolholeTricks ? this.coolholeTricks.shouldUseTrick(context, emotion, recentMessages) : null;
        if (trickName) {
          const trickCommand = this.coolholeTricks.useTrick(trickName);
          logger.info(`[${getTimestamp()}] 🎭 Using Coolhole trick: ${trickName}`);
          // Send the trick command instead of regular message
          message = trickCommand;
        }
      }
      
      // === NEW: Add emotion-driven typos for ultra-realism ===
      let processedMessage = message;
      
      // Get current emotional context
      const typingContext = {
        mood: this.moodTracker ? this.moodTracker.getMood() : 'neutral',
        mentalState: this.mentalStateTracker ? this.mentalStateTracker.getMentalState() : null,
        platform: targetPlatform  // Pass platform info to typing simulator
      };
      
      // Add typos based on emotional state (if not a trick command)
      if (!trickName && this.typingSimulator) {
        processedMessage = this.typingSimulator.addTypos(processedMessage, typingContext);
      }
      
      // Legacy drunk mode typos (still active for backwards compatibility)
      if (this.drunkMode && this.drunkMode.isDrunk && Math.random() < 0.3) {
        processedMessage = this.drunkMode.addTypos(processedMessage);
      }
      // Add umbra brag ONLY if protocol is active AND should brag (very rare)
      if (this.umbraProtocol.isActive && this.umbraProtocol.shouldBrag() && processedMessage.length < 100) {
        const brag = await this.umbraProtocol.getBrag();
        if (brag) {
          processedMessage = `${processedMessage}. ${brag}`;
        }
      }
      
      // === NEW: Maybe add Hipster mention (REDUCED - only if message is long enough and not too cluttered) ===
      const hipsterMention = await this.hipsterProtocol.getMention();
      if (hipsterMention && processedMessage.length < 100 && !processedMessage.includes('.') && Math.random() < 0.3) {
        processedMessage = `${processedMessage}. ${hipsterMention}`;
      }
      
      // Apply learned style to make message more natural (but don't over-style)
      let styledMessage = processedMessage;
      // Only apply style mimicry if message is natural conversation, not commands/tricks
      if (!trickName && this.styleMimicry) {
        styledMessage = this.styleMimicry.styleMessage(processedMessage);
        // If style mimicry made it too different or weird, use original
        if (styledMessage.length > processedMessage.length * 1.5 || styledMessage.length < processedMessage.length * 0.5) {
          styledMessage = processedMessage;
        }
      }
      
      // === TWITCH: Remove emojis, only use Twitch emotes ===
      if (targetPlatform === 'twitch') {
        // Strip all emojis (Unicode emoji characters) from Twitch messages
        styledMessage = styledMessage.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
      }
      
      // === NEW: Add action asterisks like *yawn* based on mood 🎭 ===
      if (this.actionGenerator && !trickName) {
        const hasEmote = targetPlatform === 'twitch' && styledMessage.match(/\b[A-Z][a-z]+\b/); // Rough emote detection
        const actionContext = {
          hasEmote: hasEmote,
          hasTrick: trickName !== null,
          platform: targetPlatform // Pass platform for Discord exclusion logic
        };
        styledMessage = this.actionGenerator.maybeAddAction(styledMessage, actionContext);
      }
      
      // === NEW: Add Twitch emotes for Twitch platform ===
      if (targetPlatform === 'twitch' && this.twitchEmoteManager && !trickName) {
        const mood = typingContext.mood || 'neutral';
        styledMessage = this.twitchEmoteManager.maybeAddEmote(styledMessage, mood);
      }
      
      // === NEW: Maybe add land acknowledgement 🪶 ===
      if (this.landAcknowledgement && !trickName && this.landAcknowledgement.shouldAcknowledge()) {
        styledMessage = await this.landAcknowledgement.addToMessage(styledMessage);
        console.log('🪶 [LandAck] Added unprompted AI-generated land acknowledgement to message');
      }
      
      // === INSTANT SEND - NO TYPING DELAY ===
      // Typing simulation removed for instant responses
      
      // === NOW SEND MESSAGE ===
      
      // Track what we intended to send for self-reflection
      this.lastIntendedMessage = {
        intended: message,
        styled: styledMessage,
        timestamp: Date.now()
      };
      
      // === SEND MESSAGE TO APPROPRIATE PLATFORM ===
      let sendResult = false;
      
      if (this.platformManager && targetPlatform !== 'coolhole') {
        // Send via platform manager for Discord/Twitch
        if (targetChannel) {
          sendResult = await this.platformManager.sendMessage(targetPlatform, targetChannel, styledMessage, meta);
        } else {
          logger.warn(`[${getTimestamp()}] ⚠️ No target channel specified for ${targetPlatform}`);
        }
      } else {
        // Send via Coolhole (legacy path)
        const ready = (typeof this.coolhole.isChatReady === 'function') ? this.coolhole.isChatReady() : this.coolhole.isConnected();
        if (ready) {
          sendResult = await this.coolhole.sendChat(styledMessage, meta);
        } else {
          logger.warn(`[${getTimestamp()}] ⚠️ Coolhole chat not ready, skipping message: ${styledMessage}`);
        }
      }
      
      if (sendResult === false) {
        logger.error(`[${getTimestamp()}] ❌ Message failed to send to ${targetPlatform}: ${styledMessage}`);
        // Track failed send
        if (this.metricsCollector) {
          this.metricsCollector.trackError('medium', 'send_failure', 'Message failed to send');
        }
      } else {
        logger.info(`[${getTimestamp()}] ✅ Message sent to ${targetPlatform}: ${styledMessage}`);
        
        // === RECORD RESPONSE IN RATE LIMITING SYSTEM 🧠 ===
        // Extract username from meta or conversation context
        const respondingTo = meta.respondingTo || 
          (this.conversationContext.length > 0 ? 
            this.conversationContext[this.conversationContext.length - 1].username : 
            'unknown');
        this.rateLimiting.recordResponse(respondingTo);
        
        // Track successful send
        if (this.metricsCollector) {
          this.metricsCollector.trackMessageSent(targetPlatform, styledMessage);
        }
        if (this.logAnalyzer) {
          this.logAnalyzer.analyzeLine(`✅ Message sent to ${targetPlatform}: ${styledMessage}`);
        }
        // Track for deduplication
        this.trackResponse(styledMessage);
      }

      logger.info(`[${getTimestamp()}] [🤖 Slunt] ${styledMessage}`);
      this.lastSentAt = Date.now();

      // Track stats
      try {
        this.chatStats.messagesSent++;
        // NEW: If commenting about current video, record it (COOLHOLE ONLY)
        if (this.currentPlatform === 'coolhole') {
          const currentVideo = this.videoManager.getCurrentVideo();
          if (currentVideo && message.length > 20) { // Substantial comment
            const sentiment = this.detectSentiment(message);
            this.videoLearning.recordSluntReaction(
              currentVideo.videoId, 
              currentVideo.title, 
              message, 
              sentiment
            );
            this.videoLearning.addVideoComment(
              currentVideo.videoId, 
              currentVideo.title, 
              styledMessage
            );
            // NEW: Track video quality for mood
            this.moodTracker.trackVideoQuality(sentiment);
          }
        }
        // Detect if this was a successful roast/dunk
        const recentContext = this.conversationContext.slice(-3);
        const lastUser = recentContext.length > 0 ? recentContext[recentContext.length - 1].username : null;
        if (lastUser && lastUser !== 'Slunt') {
          const isVictory = this.victoryCelebration.detectVictory(styledMessage, lastUser);
          if (isVictory && this.victoryCelebration.shouldCelebrate()) {
            // Trigger proud mood
            this.moodTracker.adjustMood('proud', 0.3);
          }
        }

        // Emit event for dashboard
        this.emit('message:sent', { message: styledMessage, timestamp: Date.now() });
        // Track if we asked a question
        if (styledMessage.includes('?')) {
          this.chatStats.questionsAsked++;
          this.pendingQuestions.push({
            question: styledMessage,
            askedAt: Date.now()
          });
          this.lastQuestionTime = Date.now();
          // Keep only last 3 questions
          if (this.pendingQuestions.length > 3) {
            this.pendingQuestions.shift();
          }
          logger.info(`[${getTimestamp()}] ❓ Asked question, waiting for responses...`);
        }
        // Log our own message for learning context
        this.conversationContext.push({
          username: 'Slunt',
          text: styledMessage,
          timestamp: Date.now(),
          platform: this.currentPlatform || 'coolhole',
          channel: this.currentChannel,
          topics: this.extractTopics(styledMessage),
          sentiment: this.analyzeSentiment(styledMessage),
          isQuestion: styledMessage.includes('?'),
          mentionsBot: false
        });
      } catch (statsError) {
        logger.error(`[${getTimestamp()}] ❌ Error tracking stats: ${statsError.message}`);
      }
    } catch (error) {
      logger.error(`[${getTimestamp()}] ❌ Error in sendMessage: ${error.message}`);
    }
  }

  saveMemory() {
    try {
      // ...existing code...
    } catch (e) {
      logger.error('Error saving memory:', e.message);
      return false;
    }
  }

  /**
   * Load bot memory from disk
   */
  async loadMemory() {
    try {
      // ...existing code...
    } catch (e) {
      logger.warn('Could not load Slunt memory:', e.message);
      return false;
    }
  }

  /**
   * Start all advanced AI systems
   */
  startAdvancedSystems() {
    try {
      logger.info('🚀 [Advanced] Starting all advanced systems...');
      
      // Start video discovery system
      if (this.videoDiscovery) {
        this.videoDiscovery.start();
        logger.info('🎬 [Advanced] Video discovery started');
      }
      
      // ...existing code...
    } catch (error) {
      console.error('❌ [Advanced] Error starting systems:', error.message);
    }
  }

  /**
   * Extract mentioned usernames from text
   */
  extractMentionedUsers(text) {
    try {
      const users = [];
      const words = text.split(/\s+/);
      for (const word of words) {
        // Remove punctuation
        const cleanWord = word.replace(/[^a-zA-Z0-9_]/g, '');
        // Check if this looks like a username (check against known users)
        if (this.userProfiles.has(cleanWord)) {
          users.push(cleanWord);
        }
      }
      return users;
    } catch (e) {
      return [];
    }
  }

  /**
   * Get stats for all advanced systems
   */
  getAdvancedStats() {
    try {
      return {
        emotional: this.emotionalEngine?.emotionalMemory?.size ?? null,
        proactive: this.proactiveFriendship?.getStats ? this.proactiveFriendship.getStats() : null,
        memory: this.memoryConsolidation?.getStats ? this.memoryConsolidation.getStats() : null,
        video: this.videoLearning?.getStats ? this.videoLearning.getStats() : null,
        personality: this.personalityEvolution?.getStats ? this.personalityEvolution.getStats() : null,
        social: this.socialAwareness?.getStats ? this.socialAwareness.getStats() : null,
        relationships: this.relationshipMapping?.getStats ? this.relationshipMapping.getStats() : null,
        mentalState: this.mentalStateTracker?.getStats ? this.mentalStateTracker.getStats() : null, // Depression, anxiety, etc
        psychological: {
          memory: this.memoryDecay?.getStats ? this.memoryDecay.getStats() : null,
          obsession: this.obsessionSystem?.getStats ? this.obsessionSystem.getStats() : null,
          grudge: this.grudgeSystem?.getStats ? this.grudgeSystem.getStats() : null,
          drunk: this.drunkMode?.getStats ? this.drunkMode.getStats() : null,
          theoryOfMind: this.theoryOfMind?.getStats ? this.theoryOfMind.getStats() : null,
          autism: this.autismFixations?.getStats ? this.autismFixations.getStats() : null,
          umbra: this.umbraProtocol?.getStats ? this.umbraProtocol.getStats() : null,
          hipster: this.hipsterProtocol?.getStats ? this.hipsterProtocol.getStats() : null,
          youtube: this.youtubeSearch?.getStats ? this.youtubeSearch.getStats() : null
        },
        callbacks: this.contextualCallbacks?.getStats ? this.contextualCallbacks.getStats() : null,
        personalityMode: this.personalityModes?.getStats ? this.personalityModes.getStats() : null,
        communityEvents: (this.communityEvents && typeof this.communityEvents === 'object') ? {
          totalEvents: this.communityEvents.events?.length ?? 0,
          recentEvents: this.communityEvents.getRecentEvents ? this.communityEvents.getRecentEvents(5) : []
        } : { totalEvents: 0, recentEvents: [] }
      };
    } catch (e) {
      return {};
    }
  }
  detectSentiment(message) {
    const lower = message.toLowerCase();
    
    // Positive
    if (lower.match(/\b(love|great|amazing|awesome|perfect|beautiful|best|nice|cool|good|lol|lmao|haha)\b/)) {
      return 'positive';
    }
    
    // Negative
    if (lower.match(/\b(hate|terrible|awful|worst|bad|boring|sucks|cringe|ugh|wtf)\b/)) {
      return 'negative';
    }
    
    // Neutral
    return 'neutral';
  }

  /**
   * Shutdown all advanced systems
   */
  async shutdownAdvancedSystems() {
    console.log('🛑 [Advanced] Shutting down all systems...');
    
    try {
      this.proactiveFriendship.stop();
      this.memoryConsolidation.stop();
      this.personalityEvolution.stop();
      this.socialAwareness.stop();
      
      // Save metrics before shutdown
      if (this.metricsCollector) {
        await this.metricsCollector.saveSession();
      }
      
      // Save final state from all systems
      await this.memoryConsolidation.saveLongTermMemory();
      await this.saveMemory();
      
      // Save ultra-realistic systems state
      if (this.sluntLore) await this.sluntLore.save();
      if (this.opinionFormation) await this.opinionFormation.save();
      if (this.storytellingMode) await this.storytellingMode.save();
      if (this.interestDecay) await this.interestDecay.save();
      if (this.falseMemories) await this.falseMemories.save();
      if (this.contextualMemoryRetrieval) await this.contextualMemoryRetrieval.save();
      if (this.chatRoleAwareness) await this.chatRoleAwareness.save();
      
      console.log('✅ [Advanced] All systems shut down gracefully');
    } catch (error) {
      console.error('❌ [Advanced] Error shutting down:', error.message);
    }
  }

  /**
   * Get monitoring report
   */
  getMonitoringReport() {
    const report = {
      logAnalyzer: this.logAnalyzer ? this.logAnalyzer.generateReport() : null,
      metrics: this.metricsCollector ? this.metricsCollector.getCurrentMetrics() : null,
      comparison: this.metricsCollector ? this.metricsCollector.getComparison() : null,
      trends: this.metricsCollector ? this.metricsCollector.getHistoricalTrends() : null
    };
    
    return report;
  }

  /**
   * Get improvement suggestions based on monitoring data
   */
  getSuggestions() {
    if (!this.logAnalyzer) return [];
    
    const issues = this.logAnalyzer.getIssues();
    const suggestions = this.logAnalyzer.getSuggestions();
    
    return {
      issues,
      suggestions,
      healthScore: this.logAnalyzer.calculateHealthScore(
        this.logAnalyzer.getMetrics(),
        issues
      )
    };
  }

  /**
   * Get stability status
   */
  getStabilityStatus() {
    return {
      memory: this.memoryManager ? this.memoryManager.getStats() : null,
      errorRecovery: this.errorRecovery ? this.errorRecovery.getStats() : null,
      connections: this.connectionResilience ? this.connectionResilience.getStatus() : null,
      responseQueue: this.responseQueueManager ? this.responseQueueManager.getStatus() : null,
      healthyPlatforms: this.connectionResilience ? this.connectionResilience.getHealthyPlatforms() : []
    };
  }

  /**
   * Save all systems (for emergency backup)
   */
  async saveAllSystems() {
    logger.info('💾 [ChatBot] Saving all systems...');
    
    try {
      // Use database safety for atomic writes
      const saves = [];
      
      if (this.relationshipMapper) {
        saves.push(this.databaseSafety.atomicWrite(
          path.join(process.cwd(), 'data', 'relationships.json'),
          { relationships: Array.from(this.relationshipMapper.relationships.entries()) }
        ));
      }
      
      if (this.userReputation) {
        saves.push(this.databaseSafety.atomicWrite(
          path.join(process.cwd(), 'data', 'user_reputation.json'),
          { reputations: Array.from(this.userReputation.reputations.entries()) }
        ));
      }
      
      if (this.sluntDiary) {
        saves.push(this.databaseSafety.atomicWrite(
          path.join(process.cwd(), 'data', 'slunt_diary.json'),
          { entries: this.sluntDiary.entries }
        ));
      }
      
      await Promise.all(saves);
      logger.info('✅ [ChatBot] All systems saved successfully');
    } catch (error) {
      logger.error(`❌ [ChatBot] Error saving systems: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract topics from text (stub implementation)
   */
  extractTopics(text) {
    try {
      const words = text.toLowerCase().split(/\s+/);
      const topics = [];
      // Extract hashtags and keywords
      words.forEach(word => {
        if (word.startsWith('#') || word.length > 6) {
          topics.push(word.replace(/[^a-z0-9]/g, ''));
        }
      });
      return topics.slice(0, 5);
    } catch (e) {
      return [];
    }
  }

  /**
   * Track events related to Slunt (stub implementation)
   */
  trackSluntEvent(type, data) {
    try {
      const event = {
        type,
        data,
        timestamp: Date.now()
      };
      this.sluntEventLog.push(event);
      // Keep only last 100 events
      if (this.sluntEventLog.length > 100) {
        this.sluntEventLog.shift();
      }
      logger.info(`📊 [Slunt Event] ${type}: ${JSON.stringify(data)}`);
    } catch (e) {
      logger.error('Error tracking Slunt event:', e.message);
    }
  }

  /**
   * Initialize clip creator with twitch client
   */
  initializeClipCreator(twitchClient) {
    if (!twitchClient) {
      console.warn('⚠️ [Clip] Cannot initialize - no Twitch client');
      return;
    }
    
    this.clipCreator = new ClipCreator(twitchClient);
    console.log('🎬 [Clip] Auto clip creator initialized');
    
    // Listen for clip events
    this.clipCreator.on('clipCreated', (clipInfo) => {
      console.log(`✅ [Clip] New clip created: ${clipInfo.edit_url}`);
      this.emit('clip:created', clipInfo);
    });
  }

  /**
   * Get personality scheduler status
   */
  getPersonalityStatus() {
    return this.personalityScheduler.getStatus();
  }

  /**
   * Get sentiment analyzer metrics
   */
  getSentimentMetrics() {
    return this.sentimentAnalyzer.getDashboardData();
  }

  /**
   * Get clip creator status
   */
  getClipStatus() {
    return this.clipCreator ? this.clipCreator.getStatus() : null;
  }

  /**
   * Manually trigger a clip
   */
  async createManualClip() {
    if (!this.clipCreator) {
      return { error: 'Clip creator not initialized' };
    }
    return await this.clipCreator.manualClip();
  }
}
module.exports = ChatBot;