/**
 * Proactive Conversation Starters
 * 
 * Makes Slunt initiate conversations instead of only reacting.
 * Real people don't just respond - they sometimes just... say things.
 */

class ProactiveStarters {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Configuration
    this.config = {
      slowChatThreshold: 3,           // < 3 messages in 5 mins = slow
      checkInterval: 300000,          // Check every 5 minutes
      baseChance: 0.15,               // 15% base chance to initiate
      minTimeBetweenStarts: 600000    // 10 minutes minimum between starts
    };
    
    // State
    this.lastProactiveMessage = 0;
    this.isMonitoring = false;
    this.monitoringInterval = null;
    
    // Stats
    this.stats = {
      totalStarts: 0,
      thoughtStarts: 0,
      obsessionStarts: 0,
      memoryStarts: 0,
      questionStarts: 0
    };
  }
  
  /**
   * Start monitoring for opportunities to initiate conversation
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🎭 [Proactive] Started monitoring for conversation opportunities');
    
    // Check periodically if we should start a conversation
    this.monitoringInterval = setInterval(() => {
      this.considerStartingConversation();
    }, this.config.checkInterval);
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }
  
  /**
   * Check if we should proactively start a conversation
   */
  async considerStartingConversation() {
    try {
      // Don't start if recently started
      const timeSinceLast = Date.now() - this.lastProactiveMessage;
      if (timeSinceLast < this.config.minTimeBetweenStarts) {
        return;
      }
      
      // Check if chat is slow
      const chatIsSlow = this.isChatSlow();
      if (!chatIsSlow) {
        return; // Only initiate when chat is slow
      }
      
      // Calculate chance based on mood and boredom
      let chance = this.config.baseChance;
      
      // Bored = more likely to start conversation
      const boredom = this.chatBot.mentalState?.boredom || 0;
      if (boredom > 70) {
        chance += 0.15; // +15% when very bored
      }
      
      // Excited/energetic = more likely to share
      const mood = this.chatBot.moodTracker?.getMood();
      if (mood === 'excited' || mood === 'energetic') {
        chance += 0.10; // +10% when excited
      }
      
      // Obsessed = more likely to talk about it
      if (this.chatBot.obsessionSystem?.getCurrentObsession()) {
        chance += 0.20; // +20% when obsessed
      }
      
      // Depressed = less likely to initiate
      const depression = this.chatBot.mentalState?.depression || 0;
      if (depression > 60) {
        chance -= 0.10; // -10% when depressed
      }
      
      // Roll the dice
      if (Math.random() < chance) {
        await this.startConversation();
      }
    } catch (error) {
      console.error('❌ [Proactive] Error considering conversation start:', error.message);
    }
  }
  
  /**
   * Check if chat is slow enough to warrant proactive initiation
   */
  isChatSlow() {
    if (!this.chatBot.conversationContext) return true;
    
    const fiveMinutesAgo = Date.now() - 300000;
    const recentMessages = this.chatBot.conversationContext.filter(m => 
      m.timestamp > fiveMinutesAgo && m.username !== 'Slunt'
    );
    
    return recentMessages.length < this.config.slowChatThreshold;
  }
  
  /**
   * Actually start a conversation
   */
  async startConversation() {
    try {
      // Choose a type of conversation starter
      const starterType = this.chooseStarterType();
      
      let message = null;
      
      switch (starterType) {
        case 'thought':
          message = await this.shareThought();
          this.stats.thoughtStarts++;
          break;
          
        case 'obsession':
          message = await this.shareObsession();
          this.stats.obsessionStarts++;
          break;
          
        case 'memory':
          message = await this.shareMemory();
          this.stats.memoryStarts++;
          break;
          
        case 'question':
          message = await this.askQuestion();
          this.stats.questionStarts++;
          break;
          
        case 'rare_activity':
          message = await this.announceRareActivity();
          this.stats.rareActivityStarts = (this.stats.rareActivityStarts || 0) + 1;
          console.log('💀 [Proactive] RARE EVENT TRIGGERED');
          break;
      }
      
      if (message) {
        console.log(`🎭 [Proactive] Starting conversation (${starterType}): ${message.substring(0, 50)}...`);
        
        // Send the message
        this.chatBot.sendMessage(message);
        
        // Update state
        this.lastProactiveMessage = Date.now();
        this.stats.totalStarts++;
      }
    } catch (error) {
      console.error('❌ [Proactive] Error starting conversation:', error.message);
    }
  }
  
  /**
   * Choose what type of starter to use
   */
  chooseStarterType() {
    const types = [];
    
    // Add thoughts if available
    if (this.chatBot.innerMonologue) {
      types.push('thought', 'thought'); // Weight thoughts heavily
    }
    
    // Add obsessions if active
    if (this.chatBot.obsessionSystem?.hasActiveObsession()) {
      types.push('obsession', 'obsession', 'obsession'); // Heavy weight
    }
    
    // Add memories if available
    if (this.chatBot.longTermMemory) {
      types.push('memory');
    }
    
    // Always possible to ask questions
    types.push('question');
    
    // VERY RARE: Add extremely rare edgy activity (0.1% chance - 1 in 1000)
    // This will almost never happen but when it does... 💀
    if (Math.random() < 0.001) {
      types.length = 0; // Clear all other options
      types.push('rare_activity');
    }
    
    return types[Math.floor(Math.random() * types.length)];
  }
  
  /**
   * Share a random thought from inner monologue
   */
  async shareThought() {
    if (!this.chatBot.innerMonologue) return null;
    
    const thoughts = this.chatBot.innerMonologue.thoughts || [];
    if (thoughts.length === 0) return null;
    
    // Get recent active thoughts
    const activeThoughts = thoughts.filter(t => 
      t.intensity > 5 && !t.broadcasted
    );
    
    if (activeThoughts.length === 0) return null;
    
    // Pick a random active thought
    const thought = activeThoughts[Math.floor(Math.random() * activeThoughts.length)];
    
    // Mark as broadcasted
    thought.broadcasted = true;
    
    // Format as casual statement
    const intros = [
      'just realized',
      'been thinking',
      'just thought of something',
      'random thought but',
      'weird thought:',
      'thinking about how'
    ];
    
    const intro = intros[Math.floor(Math.random() * intros.length)];
    
    return `${intro} ${thought.content}`;
  }
  
  /**
   * Share current obsession
   */
  async shareObsession() {
    if (!this.chatBot.obsessionSystem) return null;
    
    const obsessions = this.chatBot.obsessionSystem.getCurrentObsessions();
    if (obsessions.length === 0) return null;
    
    const obsession = obsessions[0]; // Primary obsession
    
    const templates = [
      `been obsessed with ${obsession.topic} lately`,
      `can't stop thinking about ${obsession.topic}`,
      `${obsession.topic} is so interesting rn`,
      `anyone else into ${obsession.topic}?`,
      `just got into ${obsession.topic}, it's wild`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  /**
   * Share a random memory
   */
  async shareMemory() {
    if (!this.chatBot.longTermMemory) return null;
    
    // Get a few random memories
    const memories = this.chatBot.longTermMemory.shortTermMemory || [];
    if (memories.length === 0) return null;
    
    // Pick memories that are interesting (high emotion/importance)
    const interesting = memories.filter(m => 
      (m.emotionIntensity || 0) > 0.5 || (m.userImportance || 0) > 0.5
    );
    
    if (interesting.length === 0) return null;
    
    const memory = interesting[Math.floor(Math.random() * interesting.length)];
    
    // Extract a snippet
    const snippet = memory.context.substring(0, 80);
    
    const templates = [
      `just remembered ${snippet}`,
      `thinking back to when ${snippet}`,
      `remember when ${snippet}?`,
      `earlier ${snippet}`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  /**
   * Ask a random question to the chat
   */
  async askQuestion() {
    const questions = [
      'anyone else up?',
      'what are you guys up to?',
      'anyone got recommendations?',
      'what should i watch?',
      'is chat dead or what',
      'anyone else bored?',
      'what\'s everyone doing?',
      'anything interesting happening?'
    ];
    
    // Add mood-specific questions
    const mood = this.chatBot.moodTracker?.getMood();
    if (mood === 'excited') {
      questions.push('who else is hyped rn?', 'anyone else feeling this?');
    } else if (mood === 'sad') {
      questions.push('anyone else feeling weird today?');
    }
    
    // Add obsession-specific questions
    if (this.chatBot.obsessionSystem?.hasActiveObsession()) {
      const obsession = this.chatBot.obsessionSystem.getCurrentObsessions()[0];
      questions.push(`anyone know much about ${obsession.topic}?`);
      questions.push(`thoughts on ${obsession.topic}?`);
    }
    
    return questions[Math.floor(Math.random() * questions.length)];
  }
  
  /**
   * VERY RARE: Announce going out for edgy activities
   * This should be EXTREMELY rare - like once in 1000 opportunities
   */
  async announceRareActivity() {
    // Get active users to potentially invite
    const activeUsers = Array.from(this.chatBot.chatStats?.activeUsers || [])
      .filter(u => u !== 'Slunt' && u !== 'Slunt#2969');
    
    // Variations of the announcement
    const solo = [
      'gonna go fagstomping later',
      'heading out fagstomping tonight',
      'time to go fagstomping',
      'fagstomping szn'
    ];
    
    const withInvite = [
      `gonna go fagstomping, ${this.pickRandomUser(activeUsers)} you in?`,
      `fagstomping later, ${this.pickRandomUser(activeUsers)} wanna come?`,
      `heading out fagstomping, who's down? ${this.pickRandomUser(activeUsers)}?`,
      `yo ${this.pickRandomUser(activeUsers)} fagstomping tonight?`
    ];
    
    // 50/50 whether to invite someone or go solo
    const messages = activeUsers.length > 0 && Math.random() < 0.5 ? withInvite : solo;
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  /**
   * Helper: Pick a random active user
   */
  pickRandomUser(users) {
    if (!users || users.length === 0) return 'anyone';
    return users[Math.floor(Math.random() * users.length)];
  }
  
  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      isMonitoring: this.isMonitoring,
      timeSinceLastStart: Date.now() - this.lastProactiveMessage
    };
  }
}

module.exports = ProactiveStarters;
