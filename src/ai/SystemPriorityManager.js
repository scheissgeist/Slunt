/**
 * System Priority Manager
 * Reduces active systems per message from 25+ to ~10 highest priority
 * Configurable execution order prevents system overload and conflicts
 */

class SystemPriorityManager {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Define system tiers (executed in order)
    this.systemTiers = {
      // CRITICAL: Always run these (core functionality)
      critical: [
        'rateLimiting',
        'neggingDetector', 
        'toleranceSystem',
        'needsSystem',
        'mentalBreakSystem'
      ],
      
      // HIGH: Run most of the time (important behavior)
      high: [
        'moodTracker',
        'thoughtSystem',
        'grudgeSystem',
        'userReputationSystem',
        'relationshipMapping'
      ],
      
      // MEDIUM: Run regularly but not every message (contextual)
      medium: [
        'conversationThreads',
        'userVibesDetection',
        'conversationalBoredom',
        'autismFixations',
        'obsessionSystem',
        'correctionLearning'
      ],
      
      // LOW: Run occasionally (nice-to-have)
      low: [
        'callbackHumorEngine',
        'peerInfluenceSystem',
        'energyMirroring',
        'moodContagion',
        'performanceAnxiety',
        'chatRoleAwareness',
        'interestDecay'
      ],
      
      // BACKGROUND: Run rarely or on specific triggers
      background: [
        'dreamSimulation',
        'sluntDiary',
        'rumorMill',
        'predictionEngine',
        'bitCommitment',
        'personalityInfection'
      ]
    };
    
    // Execution probabilities per tier
    this.tierProbabilities = {
      critical: 1.0,   // 100% - always run
      high: 0.8,       // 80% chance
      medium: 0.5,     // 50% chance
      low: 0.25,       // 25% chance
      background: 0.1  // 10% chance
    };
    
    // Track system execution counts
    this.executionCounts = {};
    this.lastExecutionTime = {};
    
    // Performance tracking
    this.totalProcessed = 0;
    this.systemsSkipped = 0;
  }
  
  /**
   * Determine which systems should run for this message
   */
  getActiveSystems(messageContext = {}) {
    const { 
      mentioned = false, 
      isQuestion = false,
      platform = 'coolhole',
      userActivity = 'normal' // low, normal, high
    } = messageContext;
    
    const activeSystems = [];
    
    // CRITICAL systems always run
    activeSystems.push(...this.systemTiers.critical);
    
    // Adjust probabilities based on context
    let highProb = this.tierProbabilities.high;
    let mediumProb = this.tierProbabilities.medium;
    let lowProb = this.tierProbabilities.low;
    let bgProb = this.tierProbabilities.background;
    
    // If mentioned or asked question, run more systems
    if (mentioned || isQuestion) {
      highProb = 1.0;
      mediumProb = 0.8;
      lowProb = 0.5;
    }
    
    // If high activity chat, reduce system load
    if (userActivity === 'high') {
      mediumProb *= 0.5;
      lowProb *= 0.3;
      bgProb *= 0.1;
    }
    
    // Randomly select systems based on probability
    if (Math.random() < highProb) {
      activeSystems.push(...this.systemTiers.high);
    } else {
      // Run at least 2 high-priority systems
      activeSystems.push(...this.selectRandom(this.systemTiers.high, 2));
    }
    
    if (Math.random() < mediumProb) {
      // Run subset of medium systems
      activeSystems.push(...this.selectRandom(this.systemTiers.medium, 3));
    }
    
    if (Math.random() < lowProb) {
      // Run subset of low systems
      activeSystems.push(...this.selectRandom(this.systemTiers.low, 2));
    }
    
    if (Math.random() < bgProb) {
      // Run maybe 1 background system
      activeSystems.push(...this.selectRandom(this.systemTiers.background, 1));
    }
    
    // Track statistics
    this.totalProcessed++;
    const totalSystems = Object.values(this.systemTiers).reduce((acc, tier) => acc + tier.length, 0);
    this.systemsSkipped += (totalSystems - activeSystems.length);
    
    console.log(`⚡ [Priority] Running ${activeSystems.length}/${totalSystems} systems (${((activeSystems.length/totalSystems)*100).toFixed(0)}%)`);
    
    return activeSystems;
  }
  
  /**
   * Check if specific system should run
   */
  shouldRunSystem(systemName, messageContext = {}) {
    const activeSystems = this.getActiveSystems(messageContext);
    const shouldRun = activeSystems.includes(systemName);
    
    // Track execution
    if (shouldRun) {
      this.executionCounts[systemName] = (this.executionCounts[systemName] || 0) + 1;
      this.lastExecutionTime[systemName] = Date.now();
    }
    
    return shouldRun;
  }
  
  /**
   * Select random items from array
   */
  selectRandom(array, count) {
    if (array.length <= count) return [...array];
    
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const avgSystemsPerMessage = this.totalProcessed > 0
      ? (Object.values(this.systemTiers).reduce((acc, tier) => acc + tier.length, 0) - (this.systemsSkipped / this.totalProcessed))
      : 0;
    
    // Find most/least executed systems
    const sortedSystems = Object.entries(this.executionCounts)
      .sort((a, b) => b[1] - a[1]);
    
    return {
      totalProcessed: this.totalProcessed,
      avgSystemsPerMessage: avgSystemsPerMessage.toFixed(1),
      systemsSkipped: this.systemsSkipped,
      mostExecuted: sortedSystems.slice(0, 5).map(([name, count]) => ({
        name,
        count,
        percentage: ((count / this.totalProcessed) * 100).toFixed(1) + '%'
      })),
      leastExecuted: sortedSystems.slice(-5).reverse().map(([name, count]) => ({
        name,
        count: count || 0,
        percentage: ((count / this.totalProcessed) * 100).toFixed(1) + '%'
      }))
    };
  }
  
  /**
   * Get efficiency report
   */
  getEfficiencyReport() {
    const stats = this.getStats();
    return `⚡ System Priority Manager Stats:
  Messages Processed: ${stats.totalProcessed}
  Avg Systems/Message: ${stats.avgSystemsPerMessage}
  Total Systems Skipped: ${stats.systemsSkipped}
  
  Most Active Systems:
  ${stats.mostExecuted.map(s => `  - ${s.name}: ${s.count} (${s.percentage})`).join('\n')}
  
  Least Active Systems:
  ${stats.leastExecuted.map(s => `  - ${s.name}: ${s.count} (${s.percentage})`).join('\n')}`;
  }
}

module.exports = SystemPriorityManager;
