const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Winston logger setup - quieter logging
const winston = require('winston');
const VERBOSE = process.env.VERBOSE_LOGGING === 'true';
const logger = winston.createLogger({
  level: VERBOSE ? 'info' : 'warn', // Only warnings and errors by default
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple() // Simpler format without timestamps
    }),
    new winston.transports.File({ filename: 'logs/slunt.log' })
  ]
});

const SluntManager = require('./src/services/SluntManager');
const BackupManager = require('./src/services/BackupManager');
const RateLimiter = require('./src/services/RateLimiter');
const ContentFilter = require('./src/services/ContentFilter');
const GracefulShutdown = require('./src/stability/GracefulShutdown');

// Initialize backup and rate limiting systems
const backupManager = new BackupManager({
  maxBackups: 7, // Keep 7 days of backups
  autoBackupInterval: 24 * 60 * 60 * 1000 // Backup every 24 hours
});

const rateLimiter = new RateLimiter({
  maxMessagesPerMinute: 15,
  maxCommandsPerMinute: 5,
  maxGlobalMessagesPerMinute: 100
});

const contentFilter = new ContentFilter();

// Helper for timestamps
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Helper for knowledge levels
function determineKnowledgeLevel(mentionCount) {
  if (mentionCount < 3) return 'novice';
  if (mentionCount < 10) return 'learning';
  if (mentionCount < 25) return 'knowledgeable';
  return 'expert';
}

// Helper to generate knowledge fragments based on mentions
function generateKnowledgeFragments(topic, count) {
  const fragments = [];
  
  if (count >= 1) {
    fragments.push(`Has heard about ${topic}`);
  }
  if (count >= 3) {
    fragments.push(`Knows ${topic} exists and what it's generally about`);
  }
  if (count >= 5) {
    fragments.push(`Can discuss ${topic} with some detail`);
  }
  if (count >= 10) {
    fragments.push(`Has strong opinions about ${topic}`);
  }
  if (count >= 15) {
    fragments.push(`Frequently brings up ${topic} in conversation`);
  }
  if (count >= 25) {
    fragments.push(`Considers themselves knowledgeable about ${topic}`);
  }
  if (count >= 40) {
    fragments.push(`${topic} is a core part of their identity`);
  }
  
  return fragments;
}

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error(`[Uncaught Exception] ${error.stack || error}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`[Unhandled Rejection] ${reason}`);
});

const ChatBot = require('./src/bot/chatBot');
logger.info('Slunt server starting...');
const CoolholeClient = require('./src/coolhole/coolholeClient');
const VideoManager = require('./src/video/videoManager');
const CoolholeExplorer = require('./src/coolhole/coolholeExplorer');
const VisionAnalyzer = require('./src/vision/visionAnalyzer');
const CursorController = require('./src/services/CursorController');

// Multi-platform support
const PlatformManager = require('./src/io/platformManager');
const DiscordClient = require('./src/io/discordClient');
const TwitchClient = require('./src/io/twitchClient');
const TwitchEmoteManager = require('./src/twitch/TwitchEmoteManager');
const StreamStatusMonitor = require('./src/services/StreamStatusMonitor');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,  // Allow Socket.IO connections
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Serve live dashboard as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'live-dashboard.html'));
});

// Serve Slunt's Mind dashboard
app.get('/mind', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'slunt-mind.html'));
});

// Serve Multi-Platform Control Center
app.get('/platforms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'multi-platform-dashboard.html'));
});

// Serve Sentiment Dashboard
app.get('/sentiment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sentiment-dashboard.html'));
});

// Initialize bot components
const videoManager = new VideoManager();
const coolholeClient = new CoolholeClient();
const chatBot = new ChatBot(coolholeClient, videoManager);
const sluntManager = new SluntManager();

// Initialize multi-platform manager
const platformManager = new PlatformManager();
let discordClient = null;
let twitchClient = null;

// Initialize feature exploration and vision
let coolholeExplorer = null;
let visionAnalyzer = null;
let cursorController = null;

// Make Coolhole connection optional for testing
const enableCoolhole = process.env.ENABLE_COOLHOLE !== 'false';

// Listen to chat bot events and broadcast to dashboard
chatBot.on('message:received', (data) => {
  io.emit('chat:message', {
    username: data.username,
    message: data.message,
    timestamp: Date.now()
  });
});

chatBot.on('message:sent', (data) => {
  io.emit('chat:message', {
    username: 'Slunt',
    message: data.message,
    timestamp: Date.now()
  });
});

// Broadcast bot stats periodically
setInterval(() => {
  const stats = chatBot.getChatStatistics();
  const advancedStats = chatBot.getAdvancedStats();
  io.emit('bot:stats', {
    ...stats,
    advanced: advancedStats
  });
  
  // Broadcast platform status
  if (platformManager) {
    const platformStatus = platformManager.getStatus();
    io.emit('platform:status', platformStatus);
  }
  
  // Broadcast sentiment data
  if (chatBot.sentimentAnalyzer) {
    const sentimentData = chatBot.getSentimentMetrics();
    io.emit('sentiment:update', sentimentData);
  }
  
  // Broadcast personality status
  if (chatBot.personalityScheduler) {
    const personalityStatus = chatBot.getPersonalityStatus();
    io.emit('personality:update', personalityStatus);
  }
  
  // Broadcast clip creator status
  if (chatBot.clipCreator) {
    const clipStatus = chatBot.getClipStatus();
    io.emit('clips:update', clipStatus);
  }
  
  // Send user profiles
  const userProfiles = Array.from(chatBot.userProfiles.entries()).map(([username, profile]) => ({
    username,
    ...profile
  }));
  userProfiles.forEach(profile => {
    io.emit('bot:user_profile', profile);
  });
  
  // Send community insights
  const insights = chatBot.getCommunityInsights();
  io.emit('bot:community_insights', insights);
}, 5000); // Update every 5 seconds

// Broadcast comprehensive inner mind data
setInterval(() => {
  try {
    // Mental State
    if (chatBot.mentalStateTracker) {
      const mentalState = chatBot.mentalStateTracker.getMentalState();
      io.emit('mental_state', mentalState);
    }
    
    // Personality
    if (chatBot.personality) {
      io.emit('personality_update', chatBot.personality);
    }
    
    // Dopamine System
    if (chatBot.dopamineSystem) {
      const dopamineState = chatBot.dopamineSystem.getState();
      io.emit('dopamine_update', dopamineState);
    }
    
    // Current Obsession
    if (chatBot.obsessionSystem) {
      const obsession = chatBot.obsessionSystem.getCurrentObsession();
      io.emit('obsession_update', obsession || { active: false });
    }
    
    // Drunk Mode Status
    if (chatBot.drunkMode) {
      const drunkState = {
        isDrunk: chatBot.drunkMode.isDrunk || false,
        drunkLevel: chatBot.drunkMode.drunkLevel || 0,
        hasHangover: chatBot.drunkMode.hasHangover || false,
        drinkingReason: chatBot.drunkMode.drinkingReason || null
      };
      io.emit('drunk_update', drunkState);
    }
    
    // Autism Fixations
    if (chatBot.autismFixations) {
      const autismStats = chatBot.autismFixations.getStats();
      io.emit('autism_update', autismStats);
    }
    
    // Hipster Protocol
    if (chatBot.hipsterProtocol) {
      const hipsterStats = chatBot.hipsterProtocol.getStats();
      io.emit('hipster_update', hipsterStats);
    }
    
    // Gold System Stats
    if (chatBot.goldSystem) {
      const goldStats = chatBot.goldSystem.getStats();
      io.emit('gold_update', goldStats);
    }
    
    // Relationships (detailed for system cards)
    if (chatBot.relationshipMapping) {
      const relationships = chatBot.relationshipMapping.getEnrichedRelationships 
        ? chatBot.relationshipMapping.getEnrichedRelationships(chatBot.userProfiles)
        : Array.from(chatBot.relationshipMapping.relationships?.entries() || []);
      
      // Filter out invalid relationships
      const validRelationships = relationships.filter(([key, rel]) => {
        return rel && rel.users && rel.users.length >= 2 &&
          !rel.users.some(u => u.includes('joined (aliases') || u.includes('left') || u.includes('(aliases'));
      });
      
      io.emit('relationships_update', { relationships: validRelationships.slice(0, 100) });
    }
    
    // User Reputation/Opinions (detailed for system cards)
    if (chatBot.userReputationSystem) {
      const reputations = chatBot.userReputationSystem.getAllReputations ? 
        chatBot.userReputationSystem.getAllReputations() : [];
      io.emit('reputation_update', { users: reputations.slice(0, 50) });
    }
    
    // Dream Predictions
    if (chatBot.dreamSimulation) {
      const dreamTopics = chatBot.dreamSimulation.predictDreamTopics ? 
        chatBot.dreamSimulation.predictDreamTopics() : [];
      io.emit('dream_prediction', { topics: dreamTopics });
    }
    
    // Memory details (for system card)
    if (chatBot.memoryConsolidation) {
      const memories = chatBot.memoryConsolidation.memories || [];
      const recentImportant = memories
        .filter(m => m.importance > 70)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .map(m => ({
          text: m.text || m.content || '',
          importance: Math.round(m.importance),
          timestamp: m.timestamp,
          type: m.type || 'general'
        }));
      io.emit('memory_details', { memories: recentImportant });
    }
    
    // NEW CHAOS SYSTEMS
    // Personality Splits
    if (chatBot.personalitySplits) {
      const personalityState = chatBot.personalitySplits.getStatus();
      io.emit('personality_splits', personalityState);
    }
    
    // Chaos Events
    if (chatBot.chaosEvents) {
      const chaosState = chatBot.chaosEvents.getStatus();
      io.emit('chaos_events', chaosState);
    }
    
    // Meta Chat Awareness
    if (chatBot.metaChatAwareness) {
      const metaState = chatBot.metaChatAwareness.getStatus();
      io.emit('meta_awareness', metaState);
    }
    
    // Social Hierarchy
    if (chatBot.socialHierarchy) {
      const hierarchyState = chatBot.socialHierarchy.getStatus();
      io.emit('social_hierarchy', hierarchyState);
    }
    
    // Video Context Engine
    if (chatBot.videoContextEngine) {
      const videoState = chatBot.videoContextEngine.getStatus();
      io.emit('video_context', videoState);
    }
    
    // Inner Monologue Broadcaster
    if (chatBot.innerMonologueBroadcaster) {
      const innerState = chatBot.innerMonologueBroadcaster.getStatus();
      io.emit('inner_monologue', innerState);
    }
    
    // Event Memory System
    if (chatBot.eventMemorySystem) {
      const eventState = chatBot.eventMemorySystem.getStatus();
      io.emit('event_memory', eventState);
    }
    
    // Vibe Shifter
    if (chatBot.vibeShifter) {
      const vibeState = chatBot.vibeShifter.getStatus();
      io.emit('vibe_shifter', vibeState);
    }
    
    // Prediction Engine
    if (chatBot.predictionEngine) {
      const predictionState = chatBot.predictionEngine.getStatus();
      io.emit('predictions', predictionState);
    }
    
    // Bit Commitment
    if (chatBot.bitCommitment) {
      const bitState = chatBot.bitCommitment.getStatus();
      io.emit('bit_commitment', bitState);
    }
    
    // Personality Infection
    if (chatBot.personalityInfection) {
      const infectionState = chatBot.personalityInfection.getStatus();
      io.emit('personality_infection', infectionState);
    }
    
    // Topics & Knowledge
    if (chatBot.chatStats?.topicsDiscussed) {
      const topicsArray = Array.from(chatBot.chatStats.topicsDiscussed.entries())
        .map(([topic, count]) => ({
          name: topic,
          mentions: count,
          knowledgeLevel: determineKnowledgeLevel(count),
          fragments: generateKnowledgeFragments(topic, count)
        }))
        .sort((a, b) => b.mentions - a.mentions);
      
      io.emit('topics_update', { topics: topicsArray });
    }
    
    // Comprehensive Stats
    const comprehensiveStats = {
      totalMessages: chatBot.chatStats?.totalMessages || 0,
      messagesSent: chatBot.chatStats?.messagesSent || 0,
      activeUsers: chatBot.chatStats?.activeUsers?.size || 0,
      memoryCount: chatBot.memoryConsolidation?.memories?.length || 0,
      importantMemories: chatBot.memoryConsolidation?.memories?.filter(m => m.importance > 70).length || 0,
      forgottenMemories: chatBot.memoryDecay?.forgottenCount || 0,
      videosWatched: chatBot.videoLearning?.videosWatched?.length || 0,
      favoriteGenre: chatBot.videoLearning?.favoriteGenre || 'Unknown',
      currentVideo: videoManager.getCurrentVideo()?.title || 'None'
    };
    io.emit('stats', comprehensiveStats);
    
  } catch (error) {
    console.error('Error broadcasting inner mind data:', error.message);
  }
}, 5000); // Update every 5 seconds (mind data changes frequently)

// Slower updates for diary (less frequent changes)
setInterval(() => {
  try {
    if (chatBot.sluntDiary) {
      const diaryEntries = chatBot.sluntDiary.getRecentEntries ? 
        chatBot.sluntDiary.getRecentEntries(20) : 
        chatBot.sluntDiary.entries?.slice(-20) || [];
      io.emit('diary_update', { entries: diaryEntries });
    }
  } catch (error) {
    console.error('Error broadcasting diary:', error.message);
  }
}, 600000); // Update every 10 minutes

// API Routes
app.get('/api/health', (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      bot: coolholeClient.isConnected(),
      chatReady: coolholeClient.isChatReady(),
      currentVideo: videoManager.getCurrentVideo(),
      queueLength: videoManager.getQueueLength()
    });
  } catch (error) {
    console.error('Health endpoint error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/current-video', (req, res) => {
  try {
    const currentVideo = videoManager.getCurrentVideo();
    res.json(currentVideo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/queue', (req, res) => {
  try {
    const queue = videoManager.getQueue();
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/queue', (req, res) => {
  const { videoId, title, type = 'yt' } = req.body;
  
  try {
    const result = videoManager.addToQueue(videoId, title, type);
    coolholeClient.queueVideo(videoId, type);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/search/:query', async (req, res) => {
  const { query } = req.params;
  
  try {
    const results = await videoManager.searchVideos(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bot Learning & AI Monitoring Endpoints
app.get('/api/bot/status', (req, res) => {
  try {
    const status = chatBot.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/personality', (req, res) => {
  try {
    const personality = chatBot.getPersonalityState();
    res.json(personality);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/stats', (req, res) => {
  try {
    const stats = chatBot.getChatStatistics();
    // Add advanced stats
    const advancedStats = chatBot.getAdvancedStats();
    res.json({
      ...stats,
      advanced: advancedStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NEW: Monitoring & Metrics Endpoints
app.get('/api/monitoring/report', (req, res) => {
  try {
    const report = chatBot.getMonitoringReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/monitoring/suggestions', (req, res) => {
  try {
    const suggestions = chatBot.getSuggestions();
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/monitoring/health', (req, res) => {
  try {
    const report = chatBot.getMonitoringReport();
    const healthScore = report.logAnalyzer ? report.logAnalyzer.healthScore : 100;
    
    res.json({
      healthScore,
      status: healthScore > 80 ? 'excellent' : healthScore > 60 ? 'good' : healthScore > 40 ? 'degraded' : 'critical',
      metrics: report.metrics,
      issues: report.logAnalyzer ? report.logAnalyzer.issues : [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stability monitoring endpoints
app.get('/api/stability/status', (req, res) => {
  try {
    const status = chatBot.getStabilityStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stability/errors', (req, res) => {
  try {
    const errorReport = chatBot.errorRecovery.getErrorReport();
    res.json(errorReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stability/memory', (req, res) => {
  try {
    const memoryStats = chatBot.memoryManager.getStats();
    const usage = chatBot.memoryManager.checkMemoryUsage();
    res.json({ ...memoryStats, currentUsage: usage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Slunt Control Endpoints
app.post('/api/slunt/start', async (req, res) => {
  try {
    const result = await sluntManager.start();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/slunt/stop', async (req, res) => {
  try {
    const result = await sluntManager.stop();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/slunt/restart', async (req, res) => {
  try {
    const result = await sluntManager.restart();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/slunt/status', (req, res) => {
  try {
    const status = sluntManager.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/slunt/config', async (req, res) => {
  try {
    const newConfig = req.body;
    const config = await sluntManager.updateConfig(newConfig);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/topics', (req, res) => {
  try {
    const topics = chatBot.getTrendingTopics(20);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/conversation', (req, res) => {
  try {
    const conversation = chatBot.getConversationContext(30);
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/user/:username', (req, res) => {
  const { username } = req.params;
  
  try {
    const profile = chatBot.getUserProfile(username);
    if (!profile) {
      res.status(404).json({ error: 'User not found in bot memory' });
      return;
    }
    
    // Convert Maps and Sets to objects for JSON
    const profileData = {
      ...profile,
      commonWords: Object.fromEntries(profile.commonWords || []),
      topics: Object.fromEntries(profile.topics || []),
      interests: Array.from(profile.interests || []),
      emoji_usage: Object.fromEntries(profile.emoji_usage || []),
      opinions: Object.fromEntries(profile.opinions || []),
      friendsWith: Array.from(profile.friendsWith || []),
      whoTheyMention: Object.fromEntries(profile.whoTheyMention || []),
      mentionedBy: Object.fromEntries(profile.mentionedBy || []),
      activeHours: Object.fromEntries(profile.activeHours || [])
    };
    
    res.json(profileData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/insights', (req, res) => {
  try {
    const insights = chatBot.getCommunityInsights();
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Slunt's observations and notes about users/community
app.get('/api/bot/observations', (req, res) => {
  try {
    const observations = chatBot.getObservations();
    res.json(observations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cursor Controller Endpoints
app.get('/api/cursor/stats', (req, res) => {
  try {
    if (!cursorController) {
      return res.status(503).json({ error: 'Cursor controller not initialized' });
    }
    const stats = cursorController.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === NEW: ADVANCED AI SYSTEM ENDPOINTS ===

// Emotional Intelligence Endpoints
app.get('/api/advanced/emotional/:username', (req, res) => {
  try {
    const { username } = req.params;
    const pattern = chatBot.emotionalEngine.getEmotionalPattern(username);
    const summary = chatBot.emotionalEngine.getEmotionalSummary(username);
    res.json({ username, pattern, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Relationship Mapping Endpoints
app.get('/api/advanced/relationships/:username', (req, res) => {
  try {
    const { username } = req.params;
    const connections = chatBot.socialGraph.get(username);
    const suggestions = chatBot.relationshipMapping.suggestConnections(username);
    res.json({ 
      username, 
      connections: connections ? Array.from(connections.entries()) : [],
      suggestions 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/advanced/relationships/between/:user1/:user2', (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const summary = chatBot.relationshipMapping.getRelationshipSummary(user1, user2);
    const beef = chatBot.relationshipMapping.detectBeef(user1, user2);
    const mutual = chatBot.relationshipMapping.findMutualFriends(user1, user2);
    res.json({ user1, user2, summary, beef, mutualFriends: mutual });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/advanced/community/graph', (req, res) => {
  try {
    const graph = chatBot.relationshipMapping.getGraphVisualization();
    const insights = chatBot.relationshipMapping.getCommunityInsights();
    res.json({ graph, insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/advanced/community/groups', (req, res) => {
  try {
    const groups = chatBot.relationshipMapping.detectFriendGroups();
    const hubs = chatBot.relationshipMapping.findHubs();
    res.json({ friendGroups: groups, communityHubs: hubs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Memory Consolidation Endpoints
app.get('/api/advanced/memory/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" required' });
    }
    const results = chatBot.memoryConsolidation.searchMemories(q);
    res.json({ query: q, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/memory/consolidate', async (req, res) => {
  try {
    await chatBot.memoryConsolidation.consolidateMemories();
    const stats = chatBot.memoryConsolidation.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/memory/archive', async (req, res) => {
  try {
    const archived = await chatBot.memoryConsolidation.archiveInactiveUsers();
    res.json({ success: true, archivedUsers: archived });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Personality Evolution Endpoints
app.get('/api/advanced/personality', (req, res) => {
  try {
    const stats = chatBot.personalityEvolution.getStats();
    const progress = chatBot.personalityEvolution.getEvolutionProgress();
    res.json({ stats, progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/personality/evolve', (req, res) => {
  try {
    chatBot.personalityEvolution.evolvePersonality();
    const stats = chatBot.personalityEvolution.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/personality/reset', (req, res) => {
  try {
    chatBot.personalityEvolution.resetToDefault();
    res.json({ success: true, personality: chatBot.personality });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Video Learning Endpoints
app.get('/api/advanced/video/stats', (req, res) => {
  try {
    const stats = chatBot.videoLearning.getStats();
    const insights = chatBot.videoLearning.getCommunityInsights();
    res.json({ stats, insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/advanced/video/suggest/:username?', (req, res) => {
  try {
    const { username } = req.params;
    const suggestion = chatBot.videoLearning.suggestVideo(username);
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Social Awareness Endpoints
app.get('/api/advanced/social/health', (req, res) => {
  try {
    const health = chatBot.socialAwareness.assessChatHealth();
    const stats = chatBot.socialAwareness.getStats();
    res.json({ health, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/social/revive', async (req, res) => {
  try {
    await chatBot.socialAwareness.reviveChat();
    res.json({ success: true, message: 'Attempted to revive chat' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Proactive Friendship Endpoints
app.get('/api/advanced/proactive/stats', (req, res) => {
  try {
    const stats = chatBot.proactiveFriendship.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/proactive/reach-out/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const profile = chatBot.userProfiles.get(username);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    await chatBot.proactiveFriendship.reachOutToUser(username, 'manual', profile);
    res.json({ success: true, username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced/proactive/share-memory/:username', async (req, res) => {
  try {
    const { username } = req.params;
    await chatBot.proactiveFriendship.shareMemory(username);
    res.json({ success: true, username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === END ADVANCED AI ENDPOINTS ===

app.post('/api/cursor/click', async (req, res) => {
  try {
    if (!cursorController) {
      return res.status(503).json({ error: 'Cursor controller not initialized' });
    }
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Element name required' });
    }
    const result = await cursorController.clickByName(name);
    res.json({ success: result, element: name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cursor/emote', async (req, res) => {
  try {
    if (!cursorController) {
      return res.status(503).json({ error: 'Cursor controller not initialized' });
    }
    await cursorController.useRandomEmote();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cursor/personality', (req, res) => {
  try {
    if (!cursorController) {
      return res.status(503).json({ error: 'Cursor controller not initialized' });
    }
    const traits = req.body;
    cursorController.updatePersonality(traits);
    res.json({ success: true, personality: traits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Feature Exploration Endpoints
app.get('/api/explorer/features', (req, res) => {
  try {
    if (!coolholeExplorer) {
      return res.status(503).json({ error: 'Explorer not initialized' });
    }
    const data = coolholeExplorer.getExplorationData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/explorer/progress', (req, res) => {
  try {
    if (!coolholeExplorer) {
      return res.status(503).json({ error: 'Explorer not initialized' });
    }
    const progress = coolholeExplorer.getProgress();
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vision Analysis Endpoints
app.get('/api/vision/insights', (req, res) => {
  try {
    if (!visionAnalyzer) {
      return res.status(503).json({ error: 'Vision analyzer not initialized' });
    }
    const insights = visionAnalyzer.getInsights();
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vision/memory', (req, res) => {
  try {
    if (!visionAnalyzer) {
      return res.status(503).json({ error: 'Vision analyzer not initialized' });
    }
    const memory = visionAnalyzer.getMemorySummary();
    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vision/capture', async (req, res) => {
  try {
    if (!visionAnalyzer) {
      return res.status(503).json({ error: 'Vision analyzer not initialized' });
    }
    const analysis = await visionAnalyzer.captureAndAnalyze({
      detectScenes: true,
      readText: true,
      analyzeColors: true
    });
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comprehensive Stats API for detailed dashboard views
app.get('/api/stats', async (req, res) => {
  try {
    const data = {
      bot: {
        status: chatBot.getStatus(),
        personality: chatBot.getPersonalityState(),
        currentPersonality: chatBot.getCurrentPersonality ? chatBot.getCurrentPersonality() : {},
        stats: chatBot.getChatStatistics(),
        insights: chatBot.getCommunityInsights(),
        userProfiles: chatBot.getAllUserProfiles ? chatBot.getAllUserProfiles() : [],
        relationships: chatBot.getAllRelationships ? chatBot.getAllRelationships() : {}
      },
      timestamp: Date.now()
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comprehensive Dashboard Data Endpoint
app.get('/api/dashboard', async (req, res) => {
  try {
    const data = {
      bot: {
        status: chatBot.getStatus(),
        personality: chatBot.getPersonalityState(),
        stats: chatBot.getChatStatistics(),
        insights: chatBot.getCommunityInsights()
      },
      explorer: coolholeExplorer ? coolholeExplorer.getExplorationData() : null,
      vision: visionAnalyzer ? visionAnalyzer.getInsights() : null,
      cursor: cursorController ? cursorController.getStats() : null,
      video: {
        current: videoManager.getCurrentVideo(),
        queue: videoManager.getQueue()
      },
      timestamp: Date.now()
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track connected clients
let connectedClients = 0;

// WebSocket connection handling
io.on('connection', (socket) => {
  connectedClients++;
  console.log(`🔌 [Socket.IO] Client connected: ${socket.id} (Total: ${connectedClients})`);

  // Handle socket errors
  socket.on('error', (error) => {
    logger.error(`❌ [Socket.IO] Socket error for ${socket.id}:`, error.message);
  });

  // Send current state immediately when dashboard connects
  if (coolholeExplorer) {
    const explorerData = coolholeExplorer.getExplorationData();
    if (VERBOSE) console.log(`📡 [Socket.IO] Sending initial explorer data to ${socket.id}`);
    socket.emit('explorer:emotes', {
      emotes: explorerData.features?.emotes || [],
      totalFound: explorerData.features?.emotes?.length || 0
    });
    socket.emit('explorer:progress', explorerData.progress);
  }

  if (visionAnalyzer) {
    const visionData = visionAnalyzer.getInsights();
    if (VERBOSE) console.log(`📡 [Socket.IO] Sending initial vision data to ${socket.id}`);
    socket.emit('vision:fullAnalysis', visionData);
  }
  
  // Send bot status
  socket.emit('bot:status', {
    connected: coolholeClient.isConnected(),
    chatReady: coolholeClient.isChatReady(),
    stats: chatBot.getChatStatistics(),
    personality: chatBot.getPersonalityState()
  });
  
  // Send initial diary entries
  try {
    if (chatBot.sluntDiary) {
      const diaryEntries = chatBot.sluntDiary.getRecentEntries ? 
        chatBot.sluntDiary.getRecentEntries(20) : 
        chatBot.sluntDiary.entries?.slice(-20) || [];
      socket.emit('diary_update', { entries: diaryEntries });
    }
  } catch (error) {
    console.error('Error sending initial diary:', error.message);
  }

  socket.on('join_channel', (data) => {
    socket.join(data.channel);
    console.log(`Socket ${socket.id} joined channel: ${data.channel}`);
  });

  socket.on('chat_message', (data) => {
    chatBot.handleMessage(data);
    io.to(data.channel).emit('chat_message', data);
  });

  socket.on('get_current_video', () => {
    const currentVideo = videoManager.getCurrentVideo();
    socket.emit('current_video', currentVideo);
  });

  socket.on('get_queue', () => {
    const queue = videoManager.getQueue();
    socket.emit('queue_update', queue);
  });

  socket.on('search_videos', async (query) => {
    try {
      const results = await videoManager.searchVideos(query);
      socket.emit('search_results', results);
    } catch (error) {
      socket.emit('search_error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`❌ [Socket.IO] Client disconnected: ${socket.id} (Remaining: ${connectedClients})`);
  });
  
  // Multi-platform dashboard endpoints
  socket.on('request_status', () => {
    const status = platformManager.getStatus();
    socket.emit('platform:status', status);
  });
  
  socket.on('update_personality', (settings) => {
    if (chatBot && chatBot.personality) {
      chatBot.personality.chattiness = settings.chattiness || chatBot.personality.chattiness;
      chatBot.personality.humor = settings.humor || chatBot.personality.humor;
      chatBot.personality.edginess = settings.edginess || chatBot.personality.edginess;
      console.log('🎭 Personality updated:', settings);
    }
  });
  
  socket.on('mute_bot', (data) => {
    const duration = data.duration || 300000;
    chatBot.muted = true;
    setTimeout(() => {
      chatBot.muted = false;
      io.emit('bot_unmuted');
    }, duration);
    console.log(`🔇 Bot muted for ${duration / 1000} seconds`);
  });
  
  // NEW: Crazy Features Status Endpoint 🎭🔥💀
  socket.on('getStatus', () => {
    try {
      const crazyFeaturesStatus = {
        type: 'crazyFeatures',
        status: {
          addiction: chatBot.addictionSystem ? chatBot.addictionSystem.getStatus() : null,
          conspiracy: chatBot.conspiracyGenerator ? chatBot.conspiracyGenerator.getStatus() : null,
          memes: chatBot.memeLifecycleTracker ? chatBot.memeLifecycleTracker.getStatus() : null,
          falseMemory: chatBot.falseMemorySystem ? chatBot.falseMemorySystem.getStatus() : null,
          hallucination: chatBot.dreamHallucinationSystem ? chatBot.dreamHallucinationSystem.getStatus() : null,
          parasocial: chatBot.parasocialTracker ? chatBot.parasocialTracker.getStatus() : null,
          crush: chatBot.celebrityCrushSystem ? chatBot.celebrityCrushSystem.getStatus() : null,
          gossip: chatBot.gossipRumorMill ? chatBot.gossipRumorMill.getStatus() : null,
          sniping: chatBot.streamSnipingDetector ? chatBot.streamSnipingDetector.getStatus() : null,
          rivalBots: chatBot.rivalBotWars ? chatBot.rivalBotWars.getStatus() : null,
          cult: chatBot.sluntCultSystem ? chatBot.sluntCultSystem.getStatus() : null,
          theater: chatBot.chatTheaterMode ? chatBot.chatTheaterMode.getStatus() : null,
          collective: chatBot.collectiveUnconscious ? chatBot.collectiveUnconscious.getStatus() : null,
          timeLoop: chatBot.timeLoopDetector ? chatBot.timeLoopDetector.getStatus() : null
        }
      };
      socket.emit('message', crazyFeaturesStatus);
    } catch (error) {
      console.error('Error getting crazy features status:', error.message);
    }
  });
  
  // NEW: Admin Control Handlers 🎮
  socket.on('admin:conspiracy', () => {
    try {
      if (chatBot.conspiracyGenerator) {
        const conspiracy = chatBot.conspiracyGenerator.generateConspiracy('Admin', 'trigger');
        console.log('🔍 Admin triggered conspiracy:', conspiracy?.theory);
        io.emit('activity', { type: 'activity', message: '🔍 New conspiracy generated', timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error triggering conspiracy:', error.message);
    }
  });

  socket.on('admin:ritual', () => {
    try {
      if (chatBot.sluntCultSystem) {
        const ritual = chatBot.sluntCultSystem.startRitual('Admin', 'PRAISE');
        console.log('🕯️ Admin started ritual:', ritual?.type);
        io.emit('activity', { type: 'activity', message: '🕯️ Cult ritual started', timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error starting ritual:', error.message);
    }
  });

  socket.on('admin:timeloop', () => {
    try {
      if (chatBot.timeLoopDetector) {
        chatBot.timeLoopDetector.temporalAnomalyScore += 50;
        console.log('⏰ Admin forced time loop detection');
        io.emit('activity', { type: 'activity', message: '⏰ Time loop anomaly triggered', timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error forcing time loop:', error.message);
    }
  });

  socket.on('admin:falsememory', () => {
    try {
      if (chatBot.falseMemorySystem) {
        const memory = chatBot.falseMemorySystem.injectFalseMemory({
          type: 'admin_injection',
          content: 'Something that never happened',
          confidence: 0.8
        });
        console.log('🧠 Admin injected false memory');
        io.emit('activity', { type: 'activity', message: '🧠 False memory injected', timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error injecting memory:', error.message);
    }
  });

  socket.on('admin:rumor', () => {
    try {
      if (chatBot.gossipRumorMill) {
        const rumor = chatBot.gossipRumorMill.createRumor('Admin', 'Admin created drama', 'admin', {});
        console.log('🗣️ Admin spread rumor');
        io.emit('activity', { type: 'activity', message: '🗣️ New rumor spreading', timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error spreading rumor:', error.message);
    }
  });

  socket.on('admin:theater', () => {
    try {
      if (chatBot.chatTheaterMode) {
        const play = chatBot.chatTheaterMode.generatePlay('comedy', ['Admin', 'Slunt']);
        console.log('🎭 Admin started theater play:', play?.title);
        io.emit('activity', { type: 'activity', message: `🎭 Play started: ${play?.title}`, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error starting play:', error.message);
    }
  });

  socket.on('admin:gaslighting', () => {
    try {
      if (chatBot.falseMemorySystem) {
        chatBot.falseMemorySystem.gaslightingMode = !chatBot.falseMemorySystem.gaslightingMode;
        const status = chatBot.falseMemorySystem.gaslightingMode ? 'ON' : 'OFF';
        console.log(`😵 Admin toggled gaslighting: ${status}`);
        io.emit('activity', { type: 'activity', message: `😵 Gaslighting mode: ${status}`, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error toggling gaslighting:', error.message);
    }
  });

  socket.on('admin:reset', () => {
    try {
      console.log('🔄 Admin resetting all crazy features systems...');
      
      // Reset each system
      if (chatBot.addictionSystem) chatBot.addictionSystem = new (require('./src/ai/AddictionSystem'))();
      if (chatBot.conspiracyGenerator) chatBot.conspiracyGenerator = new (require('./src/ai/ConspiracyGenerator'))();
      if (chatBot.memeLifecycleTracker) chatBot.memeLifecycleTracker = new (require('./src/ai/MemeLifecycleTracker'))();
      if (chatBot.falseMemorySystem) chatBot.falseMemorySystem = new (require('./src/ai/FalseMemorySystem'))();
      if (chatBot.dreamHallucinationSystem) chatBot.dreamHallucinationSystem = new (require('./src/ai/DreamHallucinationSystem'))();
      if (chatBot.parasocialTracker) chatBot.parasocialTracker = new (require('./src/ai/ParasocialTracker'))();
      if (chatBot.celebrityCrushSystem) chatBot.celebrityCrushSystem = new (require('./src/ai/CelebrityCrushSystem'))();
      if (chatBot.gossipRumorMill) chatBot.gossipRumorMill = new (require('./src/ai/GossipRumorMill'))();
      if (chatBot.streamSnipingDetector) chatBot.streamSnipingDetector = new (require('./src/ai/StreamSnipingDetector'))();
      if (chatBot.rivalBotWars) chatBot.rivalBotWars = new (require('./src/ai/RivalBotWars'))();
      if (chatBot.sluntCultSystem) chatBot.sluntCultSystem = new (require('./src/ai/SluntCultSystem'))();
      if (chatBot.chatTheaterMode) chatBot.chatTheaterMode = new (require('./src/ai/ChatTheaterMode'))();
      if (chatBot.collectiveUnconscious) chatBot.collectiveUnconscious = new (require('./src/ai/CollectiveUnconscious'))();
      if (chatBot.timeLoopDetector) chatBot.timeLoopDetector = new (require('./src/ai/TimeLoopDetector'))();
      
      console.log('✅ All systems reset');
      io.emit('activity', { type: 'activity', message: '🔄 All systems reset', timestamp: Date.now() });
    } catch (error) {
      console.error('Error resetting systems:', error.message);
    }
  });
  
  socket.on('clear_memory', () => {
    if (chatBot) {
      chatBot.conversationContext = [];
      console.log('🧹 Recent memory cleared');
    }
  });
  
  // Backup management endpoints
  socket.on('backup:create', async (data) => {
    const label = data?.label || 'manual';
    const backupPath = await backupManager.createBackup(label);
    socket.emit('backup:created', { success: !!backupPath, path: backupPath });
  });
  
  socket.on('backup:list', async () => {
    const backups = await backupManager.listBackups();
    socket.emit('backup:list', backups);
  });
  
  socket.on('backup:restore', async (data) => {
    if (data && data.backupName) {
      const success = await backupManager.restoreBackup(data.backupName);
      socket.emit('backup:restored', { success, backupName: data.backupName });
    }
  });
  
  socket.on('backup:stats', async () => {
    const stats = await backupManager.getStats();
    socket.emit('backup:stats', stats);
  });
  
  // Rate limiter stats endpoint
  socket.on('ratelimit:stats', () => {
    const stats = rateLimiter.getStats();
    socket.emit('ratelimit:stats', stats);
  });
});

// Initialize Coolhole connection (optional for testing)
if (enableCoolhole) {
  // Wrap in async IIFE to use await
  (async () => {
    // Register Coolhole as a platform (will be connected by platformManager.initialize())
    platformManager.registerPlatform('coolhole', coolholeClient);
    
    // Initialize Discord if configured
    if (process.env.DISCORD_TOKEN) {
      console.log('🎮 Discord credentials found, initializing...');
      discordClient = new DiscordClient({
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.DISCORD_CLIENT_ID,
        guildIds: process.env.DISCORD_GUILD_IDS?.split(',') || []
      });
      platformManager.registerPlatform('discord', discordClient);
    }
    
    // Initialize Twitch if configured
    if (process.env.TWITCH_USERNAME && process.env.TWITCH_OAUTH_TOKEN) {
      console.log('📺 Twitch credentials found, initializing...');
      twitchClient = new TwitchClient({
        username: process.env.TWITCH_USERNAME,
        token: process.env.TWITCH_OAUTH_TOKEN,
        channels: process.env.TWITCH_CHANNELS?.split(',') || []
      });
      platformManager.registerPlatform('twitch', twitchClient);
      
      // Initialize Twitch Emote Manager
      const twitchChannel = process.env.TWITCH_CHANNELS ? 
                           process.env.TWITCH_CHANNELS.split(',')[0].replace('#', '').trim() : 
                           null;
      if (twitchChannel) {
        const twitchEmoteManager = new TwitchEmoteManager(twitchChannel);
        chatBot.twitchEmoteManager = twitchEmoteManager;
        
        // Fetch emotes after connection
        twitchClient.once('ready', async () => {
          await twitchEmoteManager.fetchEmotes();
          console.log(`😊 [TwitchEmotes] Initialized: ${twitchEmoteManager.getTotalEmoteCount()} emotes available`);
        });
      }
    }
    
    // Setup unified chat handler for all platforms
    platformManager.on('chat', async (chatData) => {
      try {
        // Store channel info for responses
        chatBot.currentPlatform = chatData.platform;
        chatBot.currentChannel = chatData.channel || chatData.channelId;
        
        // Let ChatBot handle the message
        await chatBot.handleMessage(chatData);
      } catch (error) {
        console.error(`❌ Error handling ${chatData.platform} message:`, error.message);
      }
    });

    // Setup reaction handler for Discord
    if (discordClient) {
      discordClient.on('reaction', async (reactionData) => {
        try {
          console.log(`🎭 [Reaction] Processing ${reactionData.type}: ${reactionData.emoji} from ${reactionData.username}`);
          
          // Let ChatBot handle the reaction
          await chatBot.handleReaction(reactionData);
        } catch (error) {
          console.error(`❌ Error handling reaction:`, error.message);
        }
      });
    }
    
    // Give ChatBot access to platform manager for sending messages
    chatBot.setPlatformManager(platformManager);
    
    // Give ChatBot access to Discord client for reactions
    if (discordClient) {
      chatBot.discordClient = discordClient;
      console.log('🎮 [Discord] Client reference set for reactions');
    }
    
    // Give ChatBot access to rate limiter for spam protection
    chatBot.setRateLimiter(rateLimiter);
    
    // Give ChatBot access to content filter for TOS compliance
    chatBot.setContentFilter(contentFilter);
    
    // Initialize all platforms
    console.log('🚀 Initializing all platforms...');
    await platformManager.initialize();
    
    // Initialize clip creator if Twitch is available
    if (twitchClient) {
      chatBot.initializeClipCreator(twitchClient);
      
      // Listen for clip events
      chatBot.on('clip:created', (clipInfo) => {
        io.emit('clip:created', clipInfo);
      });
    }
    
    // Initialize stream status monitor for platform switching
    if (twitchClient && process.env.TWITCH_CLIENT_ID && process.env.TWITCH_OAUTH_TOKEN) {
      const streamMonitor = new StreamStatusMonitor(platformManager);
      // Extract channel name from TWITCH_CHANNELS (format: "broteam" or "#broteam")
      const twitchChannel = process.env.TWITCH_CHANNELS ? 
                           process.env.TWITCH_CHANNELS.split(',')[0].replace('#', '').trim() : 
                           null;
      
      if (twitchChannel) {
        console.log(`📺 Starting stream status monitor for channel: ${twitchChannel}`);
        streamMonitor.start(twitchChannel);
        
        // Make monitor available globally for testing
        global.streamMonitor = streamMonitor;
      } else {
        console.log('⚠️ TWITCH_CHANNELS not configured, stream status monitor disabled');
      }
    } else {
      console.log('⚠️ Twitch credentials not configured, stream status monitor disabled');
    }
  })().catch(error => {
    console.error('❌ Error initializing platforms:', error);
  });
  
  // Initialize Explorer and Vision Analyzer after connection
  coolholeClient.once('connected', async () => {
    console.log('✅ Coolhole connected - initializing advanced features...');

    // Setup chat event handlers
    chatBot.setupCoolholeHandlers();
    console.log('🎯 Chat event handlers registered');

    // Wait for chat to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (coolholeClient.page) {
      // Initialize YouTube Search with page
      chatBot.youtubeSearch.setPage(coolholeClient.page);
      console.log('🎬 [YouTube] Search system initialized');
      
      // Initialize Explorer
      coolholeExplorer = new CoolholeExplorer(coolholeClient.page);
      coolholeExplorer.on('emotesDiscovered', (data) => {
        console.log(`✨ Discovered ${data.totalFound} emotes`);
        if (VERBOSE) console.log(`📡 [Socket.IO] Emitting explorer:emotes to ${connectedClients} clients`);
        io.emit('explorer:emotes', data);
      });
      coolholeExplorer.on('explorationProgress', (progress) => {
        if (VERBOSE) console.log(`📡 [Socket.IO] Emitting explorer:progress to ${connectedClients} clients`);
        io.emit('explorer:progress', progress);
      });
      coolholeExplorer.on('emoteUsed', (data) => {
        if (VERBOSE) console.log(`📡 [Socket.IO] Emitting explorer:emoteUsed: ${data.emote}`);
        io.emit('explorer:emoteUsed', data);
      });
      coolholeExplorer.on('videoQueued', (data) => {
        if (VERBOSE) console.log(`📡 [Socket.IO] Emitting explorer:videoQueued: ${data.video}`);
        io.emit('explorer:videoQueued', data);
      });
      
      // Start exploration
      await coolholeExplorer.startExploration();
      
      // Connect coolholeExplorer to chatBot
      chatBot.coolholeExplorer = coolholeExplorer;
      console.log('🔗 [Explorer] Connected to chatBot for video queueing');
      
      // Initialize Vision Analyzer
      visionAnalyzer = new VisionAnalyzer(coolholeClient.page);
      
      // Connect vision analyzer to chatBot for video reactions
      chatBot.connectVisionAnalyzer(visionAnalyzer);
      
      visionAnalyzer.on('screenshotAnalyzed', (data) => {
        if (VERBOSE) console.log(`📡 [Socket.IO] Emitting vision:screenshot to ${connectedClients} clients`);
        io.emit('vision:screenshot', data);
      });
      visionAnalyzer.on('textDetected', (data) => {
        if (VERBOSE) console.log(`📝 Text detected: ${data.text.join(', ')}`);
        if (VERBOSE) console.log(`📡 [Socket.IO] Emitting vision:text to ${connectedClients} clients`);
        io.emit('vision:text', data);
      });
      visionAnalyzer.on('sceneChange', (data) => {
        if (VERBOSE) console.log('🎬 Scene changed!');
        if (VERBOSE) console.log(`📡 [Socket.IO] Emitting vision:sceneChange to ${connectedClients} clients`);
        io.emit('vision:sceneChange', data);
      });
      visionAnalyzer.on('videoDetected', (data) => {
        if (VERBOSE) console.log(`🎬 Video detected: ${data.title}`);
        if (VERBOSE) console.log(`📡 [Socket.IO] Emitting vision:video to ${connectedClients} clients`);
        io.emit('vision:video', data);
      });
      visionAnalyzer.on('fullAnalysis', (data) => {
        if (VERBOSE) console.log(`📡 [Socket.IO] Emitting vision:fullAnalysis to ${connectedClients} clients`);
        io.emit('vision:fullAnalysis', data);
      });
      
      // === VIDEO COMMENTARY: Slunt reacts to videos he sees! ===
      visionAnalyzer.on('screenshotAnalyzed', async (data) => {
        try {
          // Get latest vision data
          const visionData = visionAnalyzer.getLatestAnalysis();
          
          if (visionData && chatBot.videoCommentary) {
            // Check if Slunt wants to comment on what he's seeing
            const comment = await chatBot.videoCommentary.checkAndComment(visionData);
            
            if (comment) {
              console.log(`🎬💬 [VideoCommentary] Slunt spontaneously says: "${comment}"`);
              
              // Send to Coolhole chat
              if (coolholeClient) {
                await coolholeClient.sendMessage(comment);
              }
              
              // Emit to dashboard
              io.emit('chat:message', {
                username: 'Slunt',
                text: comment,
                platform: 'coolhole',
                timestamp: Date.now(),
                type: 'video_reaction'
              });
            }
          }
        } catch (error) {
          console.error('❌ [VideoCommentary] Error:', error.message);
        }
      });
      
      // Start vision analysis
      await visionAnalyzer.startAnalysis({
        screenshotInterval: 15000, // Every 15 seconds
        analysisInterval: 60000,   // Full analysis every minute
        detectScenes: true,
        readText: true,
        analyzeColors: true
      });
      
      // Initialize Cursor Controller - Slunt can now click things!
      cursorController = new CursorController(coolholeClient.page);
      cursorController.on('discovery', (data) => {
        console.log(`🖱️ [Cursor] Discovered ${data.total} interactive elements`);
        io.emit('cursor:discovery', data);
      });
      cursorController.on('emote:used', (data) => {
        console.log(`😊 [Cursor] Used emote: ${data.emote}`);
        io.emit('cursor:emoteUsed', data);
      });
      cursorController.on('interaction', (data) => {
        console.log(`🖱️ [Cursor] Interaction: ${data.type} - ${data.name}`);
        io.emit('cursor:interaction', data);
      });
      
      // Start cursor exploration - Slunt will click emotes and explore!
      await cursorController.startExploration({
        explorationFrequency: 60000, // Explore every minute
        emoteFrequency: 45000,       // Try emotes every 45 seconds
        enabled: false                // DISABLED - emote clicking doesn't actually send to chat
      });
      
      console.log('🚀 Advanced features initialized!');
      
      // Run startup sequence - announce to chat
      await chatBot.startupSequence();
    }
  });
} else {
  console.log('Coolhole connection disabled - running in test mode');
}

// Start server
const PORT = process.env.PORT || 3001;

// Kill any process using the port before starting
const killPortProcess = async (port) => {
  const { exec } = require('child_process');
  const platform = process.platform;
  let cmd;
  if (platform === 'win32') {
    // Windows: use netstat to find PID, then taskkill
    cmd = `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`;
  } else {
    // Unix: use lsof to find PID, then kill
    cmd = `lsof -ti:${port} | xargs kill -9`;
  }
  return new Promise((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.log(`[PortKill] Could not kill process on port ${port}:`, err.message);
      } else {
        console.log(`[PortKill] Killed process(es) on port ${port}`);
      }
      resolve();
    });
  });
};

(async () => {
  await killPortProcess(PORT);
  
  // Initialize backup system
  await backupManager.initialize();
  
  // Start cleanup interval for rate limiter
  setInterval(() => {
    rateLimiter.cleanup();
  }, 300000); // Cleanup every 5 minutes
  
  server.listen(PORT, () => {
    console.log(`Coolhole.org Chatbot Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);
    
    // Initialize graceful shutdown handlers
    GracefulShutdown.initialize(chatBot, server);
    console.log('🛡️ [Stability] Graceful shutdown handlers registered');
    
    // Register connection resilience for platforms
    if (chatBot.coolholeClient) {
      chatBot.connectionResilience.registerPlatform(
        'coolhole',
        () => chatBot.coolholeClient.connect(),
        () => chatBot.coolholeClient.disconnect(),
        () => chatBot.coolholeClient.isConnected()
      );
    }
    
    if (chatBot.discordClient) {
      chatBot.connectionResilience.registerPlatform(
        'discord',
        () => chatBot.discordClient.connect(),
        () => chatBot.discordClient.disconnect(),
        () => chatBot.discordClient.isReady // Fixed: property not a function
      );
    }
    
    if (chatBot.twitchClient) {
      chatBot.connectionResilience.registerPlatform(
        'twitch',
        () => chatBot.twitchClient.connect(),
        () => chatBot.twitchClient.disconnect(),
        () => chatBot.twitchClient.isConnected()
      );
    }
    
    // Start connection health checks
    chatBot.connectionResilience.startHealthChecks();
    console.log('🏥 [Stability] Connection health monitoring started');
  });
})();

// Keep-alive interval to prevent process from exiting prematurely
const keepAlive = setInterval(() => {
  // Ping to keep things alive
  try {
    if (chatBot.isConnected()) {
      // Just check status, don't spam logs
    }
  } catch (e) {
    // Ignore errors in keep-alive
  }
}, 30000);

// Graceful shutdown with memory preservation
async function gracefulShutdown(signal) {
  console.log(`\n⚠️ ${signal} received - saving all session data...`);
  clearInterval(keepAlive);
  
  try {
    // Create emergency backup before shutdown
    console.log('💾 Creating emergency backup...');
    await backupManager.createBackup('shutdown-emergency');
    
    // Shutdown backup manager
    backupManager.shutdown();
    
    // Stop active processes
    if (cursorController) cursorController.stop();
    if (visionAnalyzer && typeof visionAnalyzer.stop === 'function') visionAnalyzer.stop();
    
    // Save all chatBot memories and state
    if (chatBot) {
      console.log('💾 Saving Slunt\'s memories...');
      
      // Save all systems with error handling
      const saveSystem = async (system, name) => {
        try {
          if (chatBot[system] && typeof chatBot[system].save === 'function') {
            await chatBot[system].save();
          }
        } catch (err) {
          console.warn(`⚠️ Could not save ${name}:`, err.message);
        }
      };
      
      // Save all advanced system data
      await saveSystem('conversationThreads', 'conversation threads');
      await saveSystem('userVibesDetection', 'user vibes');
      await saveSystem('callbackHumorEngine', 'callback humor');
      await saveSystem('contradictionTracking', 'contradictions');
      await saveSystem('conversationalBoredom', 'boredom tracker');
      await saveSystem('peerInfluenceSystem', 'peer influence');
      await saveSystem('conversationalGoals', 'goals');
      
      // Save core systems with specific methods
      try {
        if (chatBot.relationshipMapping) await chatBot.relationshipMapping.saveRelationships();
      } catch (err) { console.warn('⚠️ Could not save relationships:', err.message); }
      
      try {
        if (chatBot.userReputationSystem) await chatBot.userReputationSystem.saveReputations();
      } catch (err) { console.warn('⚠️ Could not save reputations:', err.message); }
      
      try {
        if (chatBot.sluntDiary) await chatBot.sluntDiary.saveDiary();
      } catch (err) { console.warn('⚠️ Could not save diary:', err.message); }
      
      try {
        if (chatBot.predictionEngine) await chatBot.predictionEngine.savePredictions();
      } catch (err) { console.warn('⚠️ Could not save predictions:', err.message); }
      
      try {
        if (chatBot.eventMemorySystem) await chatBot.eventMemorySystem.saveEvents();
      } catch (err) { console.warn('⚠️ Could not save events:', err.message); }
      
      try {
        if (chatBot.bitCommitment) await chatBot.bitCommitment.saveBits();
      } catch (err) { console.warn('⚠️ Could not save bits:', err.message); }
      
      // Note: New 14 conversation enhancement systems don't need persistent save
      // They work with in-memory state and existing chatBot data structures
      
      console.log('✅ All session data saved!');
    }
    
    // Disconnect from all platforms
    console.log('📡 Disconnecting from all platforms...');
    await platformManager.shutdown();
    
    // Close server
    server.close(() => {
      console.log('👋 Slunt signing off...');
      process.exit(0);
    });
    
    // Force exit after 5 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.log('⏰ Forced shutdown after timeout');
      process.exit(1);
    }, 5000);
    
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT (Ctrl+C)'));

// Catch uncaught exceptions and save before crashing
process.on('uncaughtException', async (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  await gracefulShutdown('UNCAUGHT EXCEPTION');
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  await gracefulShutdown('UNHANDLED REJECTION');
});

module.exports = { app, server, io };