/**
 * Slunt Data Analyzer
 * Analyzes accumulated data to extract insights, patterns, and statistics
 */

const fs = require('fs');
const path = require('path');

class DataAnalyzer {
  constructor(dataPath = './data') {
    this.dataPath = dataPath;
    this.results = {
      overview: {},
      socialNetwork: {},
      personality: {},
      memory: {},
      community: {},
      timeline: {},
      insights: []
    };
  }

  /**
   * Run complete analysis
   */
  async analyze() {
    console.log('📊 Starting Slunt Data Analysis...\n');

    try {
      // Load all data files
      const data = this.loadAllData();
      
      // Run analysis modules
      this.analyzeOverview(data);
      this.analyzeSocialNetwork(data);
      this.analyzePersonality(data);
      this.analyzeMemory(data);
      this.analyzeCommunity(data);
      this.analyzeTimeline(data);
      this.generateInsights();

      // Generate report
      return this.generateReport();
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      return null;
    }
  }

  /**
   * Load all JSON files from data directory
   */
  loadAllData() {
    const data = {};
    const files = fs.readdirSync(this.dataPath);

    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('.backup')) {
        try {
          const filePath = path.join(this.dataPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const key = file.replace('.json', '');
          data[key] = JSON.parse(content);
        } catch (e) {
          console.warn(`⚠️  Failed to load ${file}: ${e.message}`);
        }
      }
    }

    return data;
  }

  /**
   * Analyze data overview and file sizes
   */
  analyzeOverview(data) {
    console.log('📋 Analyzing Overview...');

    const files = fs.readdirSync(this.dataPath);
    let totalSize = 0;
    const fileSizes = [];

    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('.backup')) {
        const stats = fs.statSync(path.join(this.dataPath, file));
        const sizeKB = (stats.size / 1024).toFixed(2);
        totalSize += stats.size;
        fileSizes.push({ file, sizeKB, modified: stats.mtime });
      }
    }

    // Sort by size
    fileSizes.sort((a, b) => parseFloat(b.sizeKB) - parseFloat(a.sizeKB));

    this.results.overview = {
      totalFiles: fileSizes.length,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      largestFiles: fileSizes.slice(0, 10),
      oldestFile: fileSizes.sort((a, b) => a.modified - b.modified)[0],
      newestFile: fileSizes.sort((a, b) => b.modified - a.modified)[0]
    };
  }

  /**
   * Analyze social network and relationships
   */
  analyzeSocialNetwork(data) {
    console.log('👥 Analyzing Social Network...');

    const relationships = data.relationships || {};
    const peerInfluence = data.peer_influence || {};
    
    // Handle both Map structure and object structure
    let relationshipArray = [];
    if (relationships.relationships && Array.isArray(relationships.relationships)) {
      // New format: { relationships: [[key, value], [key, value]] }
      relationshipArray = relationships.relationships;
    } else if (Array.isArray(relationships)) {
      // Direct array format
      relationshipArray = relationships;
    } else {
      // Object format: { user1: {...}, user2: {...} }
      relationshipArray = Object.entries(relationships);
    }

    const userConnections = new Map();
    const influenceScores = {};

    // Process relationship pairs
    for (const [key, relationship] of relationshipArray) {
      if (!relationship || !relationship.users) continue;

      const [user1, user2] = relationship.users;
      const strength = relationship.strength || relationship.interactions || 0;

      // Track connections for both users
      if (!userConnections.has(user1)) {
        userConnections.set(user1, { outgoing: 0, incoming: 0, total: 0 });
      }
      if (!userConnections.has(user2)) {
        userConnections.set(user2, { outgoing: 0, incoming: 0, total: 0 });
      }

      // Add bidirectional connections
      userConnections.get(user1).total += strength;
      userConnections.get(user2).total += strength;
    }

    // Convert to array for sorting
    const connections = Array.from(userConnections.entries()).map(([user, stats]) => ({
      user,
      outgoing: stats.outgoing || stats.total,
      incoming: stats.incoming || stats.total,
      total: stats.total
    }));

    // Sort by connectivity
    connections.sort((a, b) => b.total - a.total);

    // Calculate influence from peer_influence data
    if (peerInfluence && typeof peerInfluence === 'object') {
      for (const [user, data] of Object.entries(peerInfluence)) {
        influenceScores[user] = data.influenceLevel || 0;
      }
    }

    // Find most influential
    const topInfluencers = Object.entries(influenceScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([user, score]) => ({ user, score }));

    const totalUsers = userConnections.size;
    const avgConnections = totalUsers > 0 
      ? (connections.reduce((sum, c) => sum + c.total, 0) / totalUsers).toFixed(2) 
      : 0;

    this.results.socialNetwork = {
      totalUsers,
      mostConnected: connections.slice(0, 10),
      topInfluencers,
      avgConnectionsPerUser: avgConnections,
      isolatedUsers: connections.filter(c => c.total === 0).length
    };
  }

  /**
   * Analyze Slunt's personality evolution
   */
  analyzePersonality(data) {
    console.log('🧠 Analyzing Personality...');

    const brain = data.slunt_brain || {};
    const diary = data.diary?.entries || [];
    const personalityInfection = data.personality_infection || {};

    // Personality traits
    const traits = brain.traits || {};
    const moods = brain.currentMood || {};
    const mentalState = brain.mentalState || {};

    // Personality infections
    const infections = Object.keys(personalityInfection).length;
    const activeInfections = Object.entries(personalityInfection)
      .filter(([_, data]) => data.active)
      .length;

    // Diary analysis
    const totalEntries = diary.length;
    const recentEntries = diary.slice(-10);

    this.results.personality = {
      dominantTraits: Object.entries(traits)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([trait, value]) => ({ trait, value })),
      currentMood: moods,
      mentalState: mentalState,
      totalPersonalityInfections: infections,
      activeInfections: activeInfections,
      diaryEntries: totalEntries,
      recentThoughts: recentEntries.map(e => e.content || e.thought || e).slice(0, 5)
    };
  }

  /**
   * Analyze memory systems
   */
  analyzeMemory(data) {
    console.log('💭 Analyzing Memory...');

    const shortTerm = data.memory_short_term || [];
    const midTerm = data.memory_mid_term || [];
    const longTerm = data.memory_long_term || [];
    const metadata = data.memory_metadata || {};

    // Count memories by tier (handle both array and object formats)
    const shortCount = Array.isArray(shortTerm) ? shortTerm.length : Object.keys(shortTerm).length;
    const midCount = Array.isArray(midTerm) ? midTerm.length : Object.keys(midTerm).length;
    const longCount = Array.isArray(longTerm) ? longTerm.length : Object.keys(longTerm).length;

    // Memory topics and keywords
    const topics = {};
    const longTermArray = Array.isArray(longTerm) ? longTerm : Object.values(longTerm);
    
    for (const mem of longTermArray) {
      if (!mem) continue;

      // Extract keywords from various possible fields
      const keywords = mem.keywords || [];
      if (Array.isArray(keywords)) {
        for (const keyword of keywords) {
          topics[keyword] = (topics[keyword] || 0) + 1;
        }
      }

      // Also extract from context/content
      if (mem.context) {
        const words = mem.context.toLowerCase().match(/\b\w+\b/g) || [];
        for (const word of words.slice(0, 5)) { // Top 5 words from context
          if (word.length > 3) {
            topics[word] = (topics[word] || 0) + 1;
          }
        }
      }
    }

    // Sort topics
    const topTopics = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([topic, count]) => ({ topic, count }));

    // Memory quality - check multiple importance fields with proper thresholds
    const importantMemories = longTermArray.filter(m => {
      if (!m) return false;
      // Handle different importance scales:
      // - importance: 0-100 scale (episodic memories)
      // - emotionalImportance: 0-1 scale (interaction memories)
      // - accessCount: frequency-based importance
      return (m.importance && m.importance > 50) ||  // Episodic: > 50/100
             (m.emotionalImportance && m.emotionalImportance > 0.6) || // Emotional: > 0.6/1.0
             (m.accessCount && m.accessCount > 3); // Frequently accessed
    }).length;

    // Calculate average importance
    const importanceValues = longTermArray
      .map(m => m?.importance || m?.emotionalImportance || 0)
      .filter(v => v > 0);
    
    const avgImportance = importanceValues.length > 0
      ? (importanceValues.reduce((a, b) => a + b, 0) / importanceValues.length).toFixed(2)
      : 0;

    this.results.memory = {
      totalMemories: shortCount + midCount + longCount,
      byTier: {
        shortTerm: shortCount,
        midTerm: midCount,
        longTerm: longCount
      },
      topTopics,
      importantMemories,
      avgImportance,
      consolidationStats: {
        totalConsolidations: metadata.consolidations || 0,
        lastConsolidation: metadata.lastConsolidation || 'Never'
      }
    };
  }

  /**
   * Analyze community dynamics
   */
  analyzeCommunity(data) {
    console.log('🎭 Analyzing Community...');

    const gossip = data.gossip_mill || {};
    const memes = data.meme_lifecycle || {};
    const insideJokes = data.slunt_memory?.communityMemes || {};
    const conversationThreads = data.conversation_threads || {};

    // Gossip analysis
    const totalGossip = Object.keys(gossip).length;
    const activeGossip = Object.entries(gossip)
      .filter(([_, g]) => !g.expired)
      .length;

    // Meme lifecycle
    const totalMemes = Object.keys(memes).length;
    const deadMemes = Object.entries(memes)
      .filter(([_, m]) => m.stage === 'dead')
      .length;

    // Inside jokes
    const topJokes = Object.entries(insideJokes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([joke, count]) => ({ joke, count }));

    // Conversation threads
    const totalThreads = Object.keys(conversationThreads).length;

    this.results.community = {
      gossip: {
        total: totalGossip,
        active: activeGossip,
        expired: totalGossip - activeGossip
      },
      memes: {
        total: totalMemes,
        dead: deadMemes,
        alive: totalMemes - deadMemes
      },
      topInsideJokes: topJokes,
      conversationThreads: totalThreads
    };
  }

  /**
   * Analyze timeline and activity patterns
   */
  analyzeTimeline(data) {
    console.log('📅 Analyzing Timeline...');

    const relationships = data.relationships || {};
    const diary = data.diary?.entries || [];

    // Find first and last activity from relationship data
    let firstSeen = Infinity;
    let lastSeen = 0;

    // Handle both formats
    let relationshipArray = [];
    if (relationships.relationships && Array.isArray(relationships.relationships)) {
      relationshipArray = relationships.relationships;
    } else if (Array.isArray(relationships)) {
      relationshipArray = relationships;
    } else {
      relationshipArray = Object.entries(relationships);
    }

    // Parse through relationships to find timestamps
    for (const [key, relationship] of relationshipArray) {
      if (!relationship) continue;

      if (relationship.firstInteraction && relationship.firstInteraction < firstSeen) {
        firstSeen = relationship.firstInteraction;
      }
      if (relationship.lastInteraction && relationship.lastInteraction > lastSeen) {
        lastSeen = relationship.lastInteraction;
      }
    }

    // Also check memory files for timestamps
    const memoryFiles = ['memory_long_term', 'memory_mid_term', 'memory_short_term'];
    for (const memFile of memoryFiles) {
      const memories = data[memFile];
      if (Array.isArray(memories)) {
        for (const mem of memories) {
          if (mem.created && mem.created < firstSeen) {
            firstSeen = mem.created;
          }
          if (mem.lastAccessed && mem.lastAccessed > lastSeen) {
            lastSeen = mem.lastAccessed;
          }
        }
      }
    }

    // Fallback to current time if no valid timestamps
    if (firstSeen === Infinity || firstSeen <= 0) {
      firstSeen = Date.now() - (7 * 24 * 60 * 60 * 1000); // Default 7 days ago
    }
    if (lastSeen <= 0) {
      lastSeen = Date.now();
    }

    const daysSinceStart = (Date.now() - firstSeen) / (1000 * 60 * 60 * 24);
    const daysSinceLastActivity = (Date.now() - lastSeen) / (1000 * 60 * 60 * 24);

    // Activity by hour - would need more detailed parsing
    const activityByHour = new Array(24).fill(0);
    const peakHour = activityByHour.indexOf(Math.max(...activityByHour)) || 0;

    this.results.timeline = {
      firstActivity: new Date(firstSeen).toLocaleString(),
      lastActivity: new Date(lastSeen).toLocaleString(),
      daysSinceStart: Math.max(0, daysSinceStart.toFixed(1)),
      daysSinceLastActivity: Math.max(0, daysSinceLastActivity.toFixed(1)),
      peakActivityHour: `${peakHour}:00`,
      totalDiaryDays: this.calculateDiarySpan(diary)
    };
  }

  /**
   * Generate insights from all analyses - ENHANCED with blind spot detection
   */
  generateInsights() {
    console.log('💡 Generating Insights & Blind Spots...');

    const insights = [];
    const warnings = [];
    const recommendations = [];

    // === SOCIAL NETWORK BLIND SPOTS ===
    
    // Check for isolated users (lurkers)
    if (this.results.socialNetwork.isolatedUsers > 10) {
      warnings.push(`👻 ${this.results.socialNetwork.isolatedUsers} lurkers detected (no connections)`);
      recommendations.push('Consider: Proactive engagement system to welcome new/quiet users');
    }

    // Check for echo chamber (few users dominate)
    const topConnections = this.results.socialNetwork.mostConnected[0]?.total || 0;
    const avgConnections = parseFloat(this.results.socialNetwork.avgConnectionsPerUser);
    if (topConnections > avgConnections * 5) {
      warnings.push(`⚠️ Echo chamber detected: Top user has ${topConnections} connections vs avg ${avgConnections}`);
      recommendations.push('Consider: Balance attention - engage with less-connected users');
    }

    // Check for one-way relationships (users not reciprocating)
    for (const conn of this.results.socialNetwork.mostConnected.slice(0, 5)) {
      if (conn.outgoing > conn.incoming * 3) {
        warnings.push(`📤 ${conn.user} mentions others (${conn.outgoing}) but rarely mentioned back (${conn.incoming})`);
      }
    }

    // === PERSONALITY BLIND SPOTS ===

    // Check for personality stagnation
    if (this.results.personality.activeInfections === 0) {
      warnings.push(`🔒 No active personality infections - Slunt may be stuck in one mode`);
      recommendations.push('Consider: Increase personality infection sensitivity or duration');
    }

    // Check for trait imbalance
    const traits = this.results.personality.dominantTraits;
    if (traits.length > 0) {
      const topTrait = traits[0].value;
      const bottomTrait = traits[traits.length - 1]?.value || 0;
      if (topTrait > bottomTrait * 5) {
        warnings.push(`⚖️ Trait imbalance: ${traits[0].trait}(${topTrait}) dominates over ${traits[traits.length - 1]?.trait}(${bottomTrait})`);
        recommendations.push('Consider: Rebalance personality system or add trait decay');
      }
    }

    // Check diary activity (is Slunt reflecting?)
    if (this.results.personality.diaryEntries < 10) {
      warnings.push(`📔 Low diary activity: Only ${this.results.personality.diaryEntries} entries`);
      recommendations.push('Consider: Increase introspection triggers or diary frequency');
    }

    // === MEMORY BLIND SPOTS ===

    // Check for memory distribution (too much in one tier?)
    const memTiers = this.results.memory.byTier;
    const totalMem = this.results.memory.totalMemories;
    
    if (totalMem > 100) { // Only check if enough memories exist
      if (memTiers.longTerm < totalMem * 0.3) {
        warnings.push(`🗃️ Low long-term consolidation: ${memTiers.longTerm}/${totalMem} memories (${((memTiers.longTerm/totalMem)*100).toFixed(1)}%)`);
        recommendations.push('Consider: Increase consolidation frequency or lower promotion threshold');
      }

      if (memTiers.shortTerm > totalMem * 0.7) {
        warnings.push(`💭 Memory bottleneck: ${memTiers.shortTerm}/${totalMem} stuck in short-term (${((memTiers.shortTerm/totalMem)*100).toFixed(1)}%)`);
        recommendations.push('Consider: Memory consolidation not running frequently enough');
      }
    }

    // Check for topic diversity
    const topTopics = this.results.memory.topTopics;
    if (topTopics.length > 0 && topTopics[0].count > topTopics.slice(1).reduce((sum, t) => sum + t.count, 0)) {
      warnings.push(`🎯 Topic tunnel vision: "${topTopics[0].topic}" dominates (${topTopics[0].count} mentions)`);
      recommendations.push('Consider: Encourage topic diversity or limit repetitive memory storage');
    }

    // Check for forgetting (are important memories retained?)
    if (totalMem > 100 && this.results.memory.importantMemories < totalMem * 0.05) {
      warnings.push(`⭐ Low important memory ratio: ${this.results.memory.importantMemories}/${totalMem} (${((this.results.memory.importantMemories/totalMem)*100).toFixed(1)}%)`);
      recommendations.push('Consider: Adjust importance thresholds (episodic: >50/100, emotional: >0.6/1.0, accessed: >3 times)');
    }

    // === COMMUNITY DYNAMICS BLIND SPOTS ===

    // Check gossip expiration rate
    const gossip = this.results.community.gossip;
    if (gossip.expired > gossip.active * 3) {
      insights.push(`�️ High gossip turnover: ${gossip.expired} expired vs ${gossip.active} active`);
      recommendations.push('Consider: Either gossip expires too fast OR not enough new gossip generated');
    }

    // Check meme lifecycle health
    const memes = this.results.community.memes;
    if (memes.dead > memes.alive * 2) {
      warnings.push(`💀 Meme graveyard: ${memes.dead} dead memes vs ${memes.alive} alive`);
      recommendations.push('Consider: Memes dying too fast OR not enough new memes being created');
    }

    // Check inside joke usage
    const topJoke = this.results.community.topInsideJokes[0];
    if (topJoke && topJoke.count > 100) {
      warnings.push(`🔁 Overused joke: "${topJoke.joke}" used ${topJoke.count} times (may be stale)`);
      recommendations.push('Consider: Add joke freshness decay or rotation system');
    }

    // Check for conversation thread abandonment
    if (this.results.community.conversationThreads > 50) {
      warnings.push(`🧵 Many threads: ${this.results.community.conversationThreads} conversation threads tracked`);
      recommendations.push('Consider: Implement thread cleanup for abandoned conversations');
    }

    // === ACTIVITY PATTERN BLIND SPOTS ===

    // Check for recent activity (only warn if > 2 days to avoid false positives)
    const daysSinceActive = parseFloat(this.results.timeline.daysSinceLastActivity);
    if (daysSinceActive > 2 && daysSinceActive < 1000) { // Sanity check on timestamp
      warnings.push(`⏰ Bot inactive: ${daysSinceActive.toFixed(1)} days since last activity`);
      recommendations.push('Action: Bot may be crashed or disconnected - check server status');
    }

    // Check for activity concentration (is bot only active at certain times?)
    // This would need more detailed analysis of activity patterns

    // === DATA HEALTH BLIND SPOTS ===

    // Check file size anomalies
    const largestFile = this.results.overview.largestFiles[0];
    const secondLargest = this.results.overview.largestFiles[1];
    if (largestFile && secondLargest && parseFloat(largestFile.sizeKB) > parseFloat(secondLargest.sizeKB) * 3) {
      warnings.push(`📊 Data imbalance: ${largestFile.file} (${largestFile.sizeKB}KB) much larger than others`);
      recommendations.push('Consider: Check if this file is growing unbounded (may need optimization)');
    }

    // Check total data growth
    const totalSize = parseFloat(this.results.overview.totalSizeMB);
    const daysSinceStart = parseFloat(this.results.timeline.daysSinceStart);
    const growthRate = (totalSize / daysSinceStart).toFixed(2);
    
    if (growthRate > 5) {
      warnings.push(`📈 Rapid data growth: ${growthRate}MB per day (${totalSize}MB in ${daysSinceStart.toFixed(1)} days)`);
      recommendations.push('Consider: Enable MemoryOptimizer or implement more aggressive data cleanup');
    }

    // === POSITIVE INSIGHTS ===

    if (this.results.socialNetwork.totalUsers > 50) {
      insights.push(`🌐 Thriving community: ${this.results.socialNetwork.totalUsers} users tracked`);
    }

    if (this.results.memory.totalMemories > 1000) {
      insights.push(`🧠 Deep memory system: ${this.results.memory.totalMemories} memories consolidated`);
    }

    if (daysSinceStart > 30) {
      insights.push(`🎂 Veteran bot: Running for ${daysSinceStart.toFixed(1)} days`);
    }

    if (this.results.personality.activeInfections > 5) {
      insights.push(`🦠 Adaptive personality: ${this.results.personality.activeInfections} active infections`);
    }

    this.results.insights = insights;
    this.results.warnings = warnings;
    this.results.recommendations = recommendations;
  }

  /**
   * Generate formatted report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SLUNT DATA ANALYSIS REPORT');
    console.log('='.repeat(60) + '\n');

    // Overview
    console.log('📋 OVERVIEW');
    console.log(`   Total Files: ${this.results.overview.totalFiles}`);
    console.log(`   Total Size: ${this.results.overview.totalSizeMB} MB`);
    console.log(`   Largest File: ${this.results.overview.largestFiles[0]?.file} (${this.results.overview.largestFiles[0]?.sizeKB} KB)`);
    console.log('');

    // Social Network
    console.log('👥 SOCIAL NETWORK');
    console.log(`   Total Users: ${this.results.socialNetwork.totalUsers}`);
    console.log(`   Avg Connections: ${this.results.socialNetwork.avgConnectionsPerUser} per user`);
    console.log(`   Most Connected: ${this.results.socialNetwork.mostConnected[0]?.user} (${this.results.socialNetwork.mostConnected[0]?.total} connections)`);
    console.log(`   Top Influencer: ${this.results.socialNetwork.topInfluencers[0]?.user} (score: ${this.results.socialNetwork.topInfluencers[0]?.score})`);
    console.log('');

    // Personality
    console.log('🧠 PERSONALITY');
    console.log(`   Dominant Trait: ${this.results.personality.dominantTraits[0]?.trait} (${this.results.personality.dominantTraits[0]?.value})`);
    console.log(`   Personality Infections: ${this.results.personality.activeInfections}/${this.results.personality.totalPersonalityInfections} active`);
    console.log(`   Diary Entries: ${this.results.personality.diaryEntries}`);
    console.log('');

    // Memory
    console.log('💭 MEMORY');
    console.log(`   Total Memories: ${this.results.memory.totalMemories}`);
    console.log(`   Distribution: Short(${this.results.memory.byTier.shortTerm}) → Mid(${this.results.memory.byTier.midTerm}) → Long(${this.results.memory.byTier.longTerm})`);
    console.log(`   Important Memories: ${this.results.memory.importantMemories}`);
    console.log(`   Top Topic: ${this.results.memory.topTopics[0]?.topic} (${this.results.memory.topTopics[0]?.count} mentions)`);
    console.log('');

    // Community
    console.log('🎭 COMMUNITY');
    console.log(`   Active Gossip: ${this.results.community.gossip.active}/${this.results.community.gossip.total}`);
    console.log(`   Memes: ${this.results.community.memes.alive} alive, ${this.results.community.memes.dead} dead`);
    console.log(`   Top Inside Joke: ${this.results.community.topInsideJokes[0]?.joke} (${this.results.community.topInsideJokes[0]?.count} uses)`);
    console.log('');

    // Timeline
    console.log('📅 TIMELINE');
    console.log(`   Running Since: ${this.results.timeline.firstActivity}`);
    console.log(`   Last Activity: ${this.results.timeline.lastActivity}`);
    console.log(`   Total Days: ${this.results.timeline.daysSinceStart}`);
    console.log(`   Peak Hour: ${this.results.timeline.peakActivityHour}`);
    console.log('');

    // Insights
    console.log('💡 KEY INSIGHTS');
    if (this.results.insights.length === 0) {
      console.log('   No notable insights yet (early stage)');
    } else {
      for (const insight of this.results.insights) {
        console.log(`   ${insight}`);
      }
    }
    console.log('');

    // Warnings
    console.log('⚠️  BLIND SPOTS & WARNINGS');
    if (this.results.warnings.length === 0) {
      console.log('   ✅ No issues detected - system looks healthy!');
    } else {
      for (const warning of this.results.warnings) {
        console.log(`   ${warning}`);
      }
    }
    console.log('');

    // Recommendations
    console.log('🔧 RECOMMENDATIONS');
    if (this.results.recommendations.length === 0) {
      console.log('   ✅ No improvements needed at this time');
    } else {
      for (const rec of this.results.recommendations) {
        console.log(`   ${rec}`);
      }
    }
    console.log('');

    console.log('='.repeat(60) + '\n');

    return this.results;
  }

  /**
   * Export results to JSON
   */
  exportResults(outputPath = './data/analysis_report.json') {
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`✅ Report exported to ${outputPath}`);
  }

  // Helper methods
  calculateAvgImportance(memories) {
    const values = Object.values(memories).map(m => m.importance || 0);
    return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
  }

  calculateDiarySpan(entries) {
    if (entries.length === 0) return 0;
    const dates = entries.map(e => e.timestamp || Date.now());
    const span = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24);
    return span.toFixed(1);
  }
}

// CLI Usage
if (require.main === module) {
  const analyzer = new DataAnalyzer();
  analyzer.analyze().then(results => {
    if (results) {
      analyzer.exportResults();
    }
  });
}

module.exports = DataAnalyzer;
