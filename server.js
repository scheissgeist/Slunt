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

// Helper for timestamps
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

// Initialize bot components
const videoManager = new VideoManager();
const coolholeClient = new CoolholeClient();
const chatBot = new ChatBot(coolholeClient, videoManager);
const sluntManager = new SluntManager();

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
      const relationships = chatBot.relationshipMapping.getAllRelationships ? 
        chatBot.relationshipMapping.getAllRelationships() : [];
      io.emit('relationships_update', { relationships: relationships.slice(0, 50) });
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
});

// Initialize Coolhole connection (optional for testing)
if (enableCoolhole) {
  console.log('Connecting to Coolhole server...');
  coolholeClient.connect(process.env.COOLHOLE_SERVER || 'wss://coolhole.org/socket.io/');
  
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
      
      // Initialize Vision Analyzer
      visionAnalyzer = new VisionAnalyzer(coolholeClient.page);
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
  server.listen(PORT, () => {
    console.log(`Coolhole.org Chatbot Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received');
  clearInterval(keepAlive);
  if (cursorController) cursorController.stop();
  if (visionAnalyzer && typeof visionAnalyzer.stop === 'function') visionAnalyzer.stop();
  coolholeClient.disconnect();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received (Ctrl+C)');
  clearInterval(keepAlive);
  if (cursorController) cursorController.stop();
  if (visionAnalyzer && typeof visionAnalyzer.stop === 'function') visionAnalyzer.stop();
  coolholeClient.disconnect();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = { app, server, io };