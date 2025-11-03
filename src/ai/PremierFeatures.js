/**
 * PREMIER CHATBOT FEATURES - PART 1
 * 
 * Advanced systems that make Slunt truly elite:
 * 1. Interrupt & Distraction System
 * 2. Emotional Whiplash System  
 * 3. Pattern Recognition & Prediction
 * 4. Deep Callback Chains
 * 5. Adaptive Comedy Timing
 */

const fs = require('fs');
const path = require('path');

/**
 * 1. INTERRUPT & DISTRACTION SYSTEM
 * Real mid-conversation distractions that interrupt flow
 */
class InterruptDistraction {
  constructor(chatBot) {
    this.bot = chatBot;
    this.distractionChance = 0.08; // 8% chance per message
    this.partialMessageChance = 0.03; // 3% chance of cutting off mid-thought
    this.topicJumpChance = 0.05; // 5% chance of sudden topic change
    
    console.log('⚡ [Interrupt] Interrupt & distraction system initialized');
  }

  /**
   * Check if we should get distracted during response generation
   */
  shouldGetDistracted() {
    return Math.random() < this.distractionChance;
  }

  /**
   * Check if we should send partial message
   */
  shouldSendPartial() {
    return Math.random() < this.partialMessageChance;
  }

  /**
   * Check if we should jump topics mid-sentence
   */
  shouldJumpTopic() {
    return Math.random() < this.topicJumpChance;
  }

  /**
   * Create partial message (cut off mid-thought)
   */
  makePartialMessage(message) {
    const words = message.split(' ');
    if (words.length < 5) return message;
    
    // Cut off between 40-80% through message
    const cutPoint = Math.floor(words.length * (0.4 + Math.random() * 0.4));
    const partial = words.slice(0, cutPoint).join(' ');
    
    // Sometimes add trailing characters
    const trails = ['...', '—', ' wait', ' uh'];
    const trail = Math.random() < 0.6 ? trails[Math.floor(Math.random() * trails.length)] : '';
    
    return partial + trail;
  }

  /**
   * Generate distraction recovery message
   */
  getRecoveryMessage() {
    const recoveries = [
      'wait what was i saying',
      'sorry got distracted',
      'lost my train of thought',
      'where was i going with that',
      'nvm',
      'wait what',
      'oh right',
      'hang on',
      'shit what was the question again'
    ];
    
    return recoveries[Math.floor(Math.random() * recoveries.length)];
  }

  /**
   * Generate topic jump
   */
  getTopicJump(currentMessage) {
    const jumps = [
      ' wait did you see that',
      ' oh shit speaking of which',
      ' that reminds me',
      ' completely different topic but',
      ' wait pause'
    ];
    
    return jumps[Math.floor(Math.random() * jumps.length)];
  }
}

/**
 * 2. EMOTIONAL WHIPLASH SYSTEM
 * Sudden mood swings from triggers
 */
class EmotionalWhiplash {
  constructor(chatBot) {
    this.bot = chatBot;
    this.triggers = new Map(); // word/phrase -> emotion + intensity
    this.currentMood = 'neutral';
    this.moodIntensity = 0.5;
    this.lastWhiplash = 0;
    this.whiplashCooldown = 180000; // 3 minutes
    
    this.initializeTriggers();
    
    console.log('🎭 [Whiplash] Emotional whiplash system initialized');
  }

  /**
   * Initialize emotional triggers
   */
  initializeTriggers() {
    // Positive triggers
    this.triggers.set('coffee', { emotion: 'excited', intensity: 0.8 });
    this.triggers.set('synthesizer', { emotion: 'obsessed', intensity: 0.9 });
    this.triggers.set('vintage', { emotion: 'nostalgic', intensity: 0.7 });
    
    // Negative triggers
    this.triggers.set('boring', { emotion: 'irritated', intensity: 0.6 });
    this.triggers.set('cringe', { emotion: 'disgusted', intensity: 0.7 });
    this.triggers.set('predictable', { emotion: 'disappointed', intensity: 0.6 });
    
    // Anxiety triggers
    this.triggers.set('what if', { emotion: 'anxious', intensity: 0.7 });
    this.triggers.set('everyone', { emotion: 'paranoid', intensity: 0.6 });
    
    // Manic triggers
    this.triggers.set('let\'s go', { emotion: 'manic', intensity: 0.8 });
    this.triggers.set('holy shit', { emotion: 'hyped', intensity: 0.9 });
  }

  /**
   * Check for emotional triggers in message
   */
  checkForTriggers(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const [trigger, emotional] of this.triggers.entries()) {
      if (lowerMessage.includes(trigger)) {
        // Can we whiplash yet?
        if (Date.now() - this.lastWhiplash > this.whiplashCooldown) {
          this.causeWhiplash(emotional.emotion, emotional.intensity, trigger);
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Cause emotional whiplash
   */
  causeWhiplash(emotion, intensity, trigger) {
    const prevMood = this.currentMood;
    this.currentMood = emotion;
    this.moodIntensity = intensity;
    this.lastWhiplash = Date.now();
    
    console.log(`🎭 [Whiplash] Triggered by "${trigger}": ${prevMood} → ${emotion} (${intensity})`);
  }

  /**
   * Get current emotional state
   */
  getEmotionalState() {
    return {
      mood: this.currentMood,
      intensity: this.moodIntensity,
      recentWhiplash: Date.now() - this.lastWhiplash < 60000
    };
  }

  /**
   * Get mood modifier for response
   */
  getMoodModifier() {
    const modifiers = {
      excited: '\n[EMOTIONAL STATE: Suddenly energized and enthusiastic]',
      obsessed: '\n[EMOTIONAL STATE: Fixated and hyperfocused]',
      nostalgic: '\n[EMOTIONAL STATE: Wistful and sentimental]',
      irritated: '\n[EMOTIONAL STATE: Annoyed and short-tempered]',
      disgusted: '\n[EMOTIONAL STATE: Repulsed and judgmental]',
      disappointed: '\n[EMOTIONAL STATE: Let down and cynical]',
      anxious: '\n[EMOTIONAL STATE: Worried and spiraling]',
      paranoid: '\n[EMOTIONAL STATE: Suspicious and defensive]',
      manic: '\n[EMOTIONAL STATE: Hyperactive and scattered]',
      hyped: '\n[EMOTIONAL STATE: Extremely excited, typing fast]'
    };
    
    return modifiers[this.currentMood] || '';
  }

  /**
   * Decay mood back to neutral over time
   */
  decayMood() {
    if (this.currentMood === 'neutral') return;
    
    const timeSinceWhiplash = Date.now() - this.lastWhiplash;
    const decayTime = 300000; // 5 minutes to decay
    
    if (timeSinceWhiplash > decayTime) {
      this.currentMood = 'neutral';
      this.moodIntensity = 0.5;
    }
  }
}

/**
 * 3. PATTERN RECOGNITION & PREDICTION
 * Learn to predict user behavior and events
 */
class PatternRecognition {
  constructor(chatBot) {
    this.bot = chatBot;
    
    // User arrival patterns
    this.userArrivalTimes = new Map(); // username -> [timestamps]
    
    // Video preference patterns
    this.videoPreferences = new Map(); // username -> {liked: [], hated: []}
    
    // Drama patterns
    this.argumentPairs = new Map(); // "user1-user2" -> count
    this.dramaKeywords = ['disagree', 'wrong', 'actually', 'but', 'tbh', 'nah'];
    
    this.load();
    
    console.log('🔮 [Predict] Pattern recognition system initialized');
  }

  /**
   * Track user arrival
   */
  trackArrival(username) {
    if (!this.userArrivalTimes.has(username)) {
      this.userArrivalTimes.set(username, []);
    }
    
    const times = this.userArrivalTimes.get(username);
    times.push(Date.now());
    
    // Keep only last 50 arrivals
    if (times.length > 50) {
      this.userArrivalTimes.set(username, times.slice(-50));
    }
  }

  /**
   * Predict when user will arrive
   */
  predictArrival(username) {
    const times = this.userArrivalTimes.get(username);
    if (!times || times.length < 5) return null;
    
    // Calculate average intervals
    const intervals = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i-1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const lastSeen = times[times.length - 1];
    const expectedNext = lastSeen + avgInterval;
    
    return {
      expectedTime: expectedNext,
      confidence: Math.min(0.9, times.length / 20)
    };
  }

  /**
   * Track video reaction
   */
  trackVideoReaction(username, videoTitle, sentiment) {
    if (!this.videoPreferences.has(username)) {
      this.videoPreferences.set(username, { liked: [], hated: [] });
    }
    
    const prefs = this.videoPreferences.get(username);
    
    if (sentiment === 'positive') {
      prefs.liked.push({ title: videoTitle, timestamp: Date.now() });
      if (prefs.liked.length > 30) prefs.liked.shift();
    } else if (sentiment === 'negative') {
      prefs.hated.push({ title: videoTitle, timestamp: Date.now() });
      if (prefs.hated.length > 30) prefs.hated.shift();
    }
  }

  /**
   * Predict if user will like a video
   */
  predictVideoReaction(username, videoTitle) {
    const prefs = this.videoPreferences.get(username);
    if (!prefs) return { prediction: 'unknown', confidence: 0 };
    
    const titleLower = videoTitle.toLowerCase();
    
    // Check for keywords from liked videos
    let likeScore = 0;
    for (const liked of prefs.liked) {
      const words = liked.title.toLowerCase().split(' ');
      for (const word of words) {
        if (titleLower.includes(word) && word.length > 3) {
          likeScore += 0.1;
        }
      }
    }
    
    // Check for keywords from hated videos
    let hateScore = 0;
    for (const hated of prefs.hated) {
      const words = hated.title.toLowerCase().split(' ');
      for (const word of words) {
        if (titleLower.includes(word) && word.length > 3) {
          hateScore += 0.1;
        }
      }
    }
    
    if (likeScore > hateScore * 1.5) {
      return { prediction: 'like', confidence: Math.min(0.8, likeScore) };
    } else if (hateScore > likeScore * 1.5) {
      return { prediction: 'hate', confidence: Math.min(0.8, hateScore) };
    }
    
    return { prediction: 'neutral', confidence: 0.3 };
  }

  /**
   * Detect potential drama brewing
   */
  detectDramaBrewing(user1, user2, message) {
    const hasKeywords = this.dramaKeywords.some(kw => message.toLowerCase().includes(kw));
    
    if (hasKeywords) {
      const pairKey = [user1, user2].sort().join('-');
      const count = this.argumentPairs.get(pairKey) || 0;
      this.argumentPairs.set(pairKey, count + 1);
      
      // If they've argued 3+ times, drama is brewing
      if (count >= 2) {
        return {
          brewing: true,
          intensity: Math.min(1, count / 5),
          history: count + 1
        };
      }
    }
    
    return { brewing: false, intensity: 0, history: 0 };
  }

  /**
   * Get prediction context for AI
   */
  getPredictionContext(username) {
    let context = '';
    
    // Arrival prediction
    const arrivalPred = this.predictArrival(username);
    if (arrivalPred && arrivalPred.confidence > 0.5) {
      const now = Date.now();
      if (Math.abs(arrivalPred.expectedTime - now) < 600000) { // Within 10 mins
        context += `\n[PREDICTION] ${username} arrived right on schedule (${(arrivalPred.confidence * 100).toFixed(0)}% confident)`;
      }
    }
    
    return context;
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        userArrivalTimes: Array.from(this.userArrivalTimes.entries()),
        videoPreferences: Array.from(this.videoPreferences.entries()),
        argumentPairs: Array.from(this.argumentPairs.entries())
      };
      
      const filePath = path.join(__dirname, '../../data/pattern_recognition.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Predict] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/pattern_recognition.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.userArrivalTimes = new Map(data.userArrivalTimes || []);
      this.videoPreferences = new Map(data.videoPreferences || []);
      this.argumentPairs = new Map(data.argumentPairs || []);
      
      console.log(`✅ [Predict] Loaded ${this.userArrivalTimes.size} user patterns`);
    } catch (error) {
      console.error('❌ [Predict] Load error:', error.message);
    }
  }
}

/**
 * 4. DEEP CALLBACK CHAINS
 * Multi-layered inside jokes and narrative arcs
 */
class DeepCallbackChains {
  constructor(chatBot) {
    this.bot = chatBot;
    
    this.callbackChains = []; // { origin, references: [], participants: [], created, lastUsed }
    this.narrativeArcs = []; // { title, events: [], startTime, participants }
    
    this.load();
    
    console.log('🧵 [Chains] Deep callback chain system initialized');
  }

  /**
   * Create new callback chain
   */
  createChain(originMessage, participants) {
    const chain = {
      id: `chain_${Date.now()}`,
      origin: originMessage,
      references: [],
      participants: new Set(participants),
      created: Date.now(),
      lastUsed: Date.now(),
      depth: 0
    };
    
    this.callbackChains.push(chain);
    
    // Keep only 100 most recent chains
    if (this.callbackChains.length > 100) {
      this.callbackChains.shift();
    }
    
    return chain.id;
  }

  /**
   * Add reference to existing chain
   */
  addReference(chainId, referenceMessage, participant) {
    const chain = this.callbackChains.find(c => c.id === chainId);
    if (!chain) return false;
    
    chain.references.push({
      message: referenceMessage,
      timestamp: Date.now(),
      participant
    });
    
    chain.participants.add(participant);
    chain.lastUsed = Date.now();
    chain.depth++;
    
    return true;
  }

  /**
   * Find callback opportunities
   */
  findCallbackOpportunities(currentMessage) {
    const opportunities = [];
    
    // Look for keyword matches in recent chains
    const recentChains = this.callbackChains.filter(c => 
      Date.now() - c.lastUsed < 604800000 // Within 1 week
    );
    
    for (const chain of recentChains) {
      // Extract keywords from origin
      const keywords = chain.origin.toLowerCase().match(/\b\w{4,}\b/g) || [];
      
      for (const keyword of keywords) {
        if (currentMessage.toLowerCase().includes(keyword)) {
          opportunities.push({
            chainId: chain.id,
            depth: chain.depth,
            ageDays: (Date.now() - chain.created) / 86400000,
            origin: chain.origin,
            keyword
          });
        }
      }
    }
    
    return opportunities.sort((a, b) => b.depth - a.depth);
  }

  /**
   * Get callback context for AI
   */
  getCallbackContext(opportunities) {
    if (opportunities.length === 0) return '';
    
    const best = opportunities[0];
    
    let context = `\n[CALLBACK OPPORTUNITY] Reference to "${best.origin}" (${best.ageDays.toFixed(0)} days ago, depth: ${best.depth})`;
    
    if (best.depth > 2) {
      context += `\n[This is a deep callback - reward long-term community members who remember]`;
    }
    
    return context;
  }

  /**
   * Create narrative arc
   */
  createArc(title, participants) {
    const arc = {
      id: `arc_${Date.now()}`,
      title,
      events: [],
      startTime: Date.now(),
      participants: new Set(participants),
      status: 'active'
    };
    
    this.narrativeArcs.push(arc);
    return arc.id;
  }

  /**
   * Add event to arc
   */
  addArcEvent(arcId, event, participant) {
    const arc = this.narrativeArcs.find(a => a.id === arcId);
    if (!arc) return false;
    
    arc.events.push({
      description: event,
      timestamp: Date.now(),
      participant
    });
    
    arc.participants.add(participant);
    return true;
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        callbackChains: this.callbackChains.map(c => ({
          ...c,
          participants: Array.from(c.participants)
        })),
        narrativeArcs: this.narrativeArcs.map(a => ({
          ...a,
          participants: Array.from(a.participants)
        }))
      };
      
      const filePath = path.join(__dirname, '../../data/deep_callbacks.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Chains] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/deep_callbacks.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.callbackChains = (data.callbackChains || []).map(c => ({
        ...c,
        participants: new Set(c.participants)
      }));
      
      this.narrativeArcs = (data.narrativeArcs || []).map(a => ({
        ...a,
        participants: new Set(a.participants)
      }));
      
      console.log(`✅ [Chains] Loaded ${this.callbackChains.length} callback chains, ${this.narrativeArcs.length} narrative arcs`);
    } catch (error) {
      console.error('❌ [Chains] Load error:', error.message);
    }
  }
}

/**
 * 5. ADAPTIVE COMEDY TIMING
 * Learn optimal timing for comedy
 */
class AdaptiveComedyTiming {
  constructor(chatBot) {
    this.bot = chatBot;
    
    this.timingData = new Map(); // joke type -> {successful: [], failed: []}
    this.silenceBreakTiming = []; // { duration, success, timestamp }
    this.pileOnTiming = []; // { delay, success, timestamp }
    
    this.load();
    
    console.log('😂 [Comedy] Adaptive comedy timing initialized');
  }

  /**
   * Calculate optimal silence break time
   */
  calculateSilenceBreakTiming() {
    if (this.silenceBreakTiming.length < 5) {
      return 180000; // Default 3 minutes
    }
    
    // Find successful silence breaks
    const successful = this.silenceBreakTiming.filter(s => s.success);
    
    if (successful.length === 0) {
      return 180000;
    }
    
    // Average successful timing
    const avgDuration = successful.reduce((sum, s) => sum + s.duration, 0) / successful.length;
    
    return avgDuration;
  }

  /**
   * Calculate optimal pile-on timing
   */
  calculatePileOnTiming() {
    if (this.pileOnTiming.length < 5) {
      return 5000; // Default 5 seconds
    }
    
    const successful = this.pileOnTiming.filter(p => p.success);
    
    if (successful.length === 0) {
      return 5000;
    }
    
    const avgDelay = successful.reduce((sum, p) => sum + p.delay, 0) / successful.length;
    
    return avgDelay;
  }

  /**
   * Record silence break attempt
   */
  recordSilenceBreak(silenceDuration, wasSuccessful) {
    this.silenceBreakTiming.push({
      duration: silenceDuration,
      success: wasSuccessful,
      timestamp: Date.now()
    });
    
    // Keep only last 50
    if (this.silenceBreakTiming.length > 50) {
      this.silenceBreakTiming.shift();
    }
  }

  /**
   * Record pile-on attempt
   */
  recordPileOn(delay, wasSuccessful) {
    this.pileOnTiming.push({
      delay,
      success: wasSuccessful,
      timestamp: Date.now()
    });
    
    // Keep only last 50
    if (this.pileOnTiming.length > 50) {
      this.pileOnTiming.shift();
    }
  }

  /**
   * Check if joke has been beaten to death
   */
  isJokeBeatenToDeath(jokeKeyword) {
    const recentMessages = this.bot.conversationContext.slice(-20);
    
    const mentions = recentMessages.filter(msg => 
      msg.text.toLowerCase().includes(jokeKeyword.toLowerCase())
    ).length;
    
    // If mentioned 5+ times in last 20 messages, it's dead
    return mentions >= 5;
  }

  /**
   * Get timing context for AI
   */
  getTimingContext() {
    const optimalSilence = this.calculateSilenceBreakTiming();
    const optimalPileOn = this.calculatePileOnTiming();
    
    return `\n[COMEDY TIMING] Optimal silence break: ${(optimalSilence/1000).toFixed(0)}s, Pile-on delay: ${(optimalPileOn/1000).toFixed(1)}s`;
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        timingData: Array.from(this.timingData.entries()),
        silenceBreakTiming: this.silenceBreakTiming,
        pileOnTiming: this.pileOnTiming
      };
      
      const filePath = path.join(__dirname, '../../data/comedy_timing.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Comedy] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/comedy_timing.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.timingData = new Map(data.timingData || []);
      this.silenceBreakTiming = data.silenceBreakTiming || [];
      this.pileOnTiming = data.pileOnTiming || [];
      
      console.log(`✅ [Comedy] Loaded ${this.silenceBreakTiming.length} silence breaks, ${this.pileOnTiming.length} pile-ons`);
    } catch (error) {
      console.error('❌ [Comedy] Load error:', error.message);
    }
  }
}

module.exports = {
  InterruptDistraction,
  EmotionalWhiplash,
  PatternRecognition,
  DeepCallbackChains,
  AdaptiveComedyTiming
};
