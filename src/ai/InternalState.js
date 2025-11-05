/**
 * InternalState.js
 * The CORE of making Slunt internally-driven instead of reactive
 * 
 * This is what makes Slunt feel ALIVE:
 * - He has ongoing thoughts independent of chat
 * - He has goals he's trying to accomplish
 * - He remembers what he was just thinking about
 * - He has emotional momentum that persists
 * - He follows through on things instead of forgetting
 */

const fs = require('fs');
const path = require('path');

class InternalState {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Current thought - what's on his mind RIGHT NOW
    this.currentThought = null; // { topic, intensity, since }
    
    // Active goals - what he's trying to accomplish
    this.goals = {
      immediate: [], // Next 5-10 minutes
      session: [],   // This chat session  
      longterm: []   // Across sessions
    };
    
    // Emotional momentum - his current vibe
    this.emotionalState = {
      primary: 'neutral', // current emotion
      intensity: 50,      // 0-100
      duration: 0,        // how long in this state (seconds)
      momentum: 0         // positive = getting more intense, negative = fading
    };
    
    // Continuity tracker - things he's waiting for or following up on
    this.continuity = {
      pendingQuestions: [],   // Questions he asked that weren't answered
      unfinishedBusiness: [], // Topics he started but got interrupted
      waitingFor: [],         // Things he's expecting to hear about
      promisesToKeep: []      // Things he said he'd do
    };
    
    // Narrative position - where we are in the "story"
    this.narrative = {
      act: 'beginning',        // beginning, rising, climax, falling, resolution
      tension: 0,              // 0-100
      lastMajorEvent: null,    // timestamp of last dramatic moment
      foreshadowings: [],      // seeds planted for later
      callbacks: []            // things to reference later
    };
    
    // Session memory - what happened THIS session (resets on restart)
    this.session = {
      startTime: Date.now(),
      thoughtsSoFar: [],
      goalsSoFar: [],
      emotionalJourney: []
    };
    
    // Persistent memory (survives restarts)
    this.persistent = {
      ongoingObsessions: [],
      longtermGoals: [],
      unresolved: []
    };
    
    this.dataPath = path.join(__dirname, '../../data/internal_state.json');
    this.load();
    
    // Update internal state every 30 seconds
    this.updateInterval = setInterval(() => this.tick(), 30000);
    
    console.log('🧠 [InternalState] Slunt now has continuous consciousness');
  }
  
  /**
   * TICK - Update internal state even when no messages
   * This is KEY - Slunt's mind keeps working
   */
  tick() {
    // Emotional momentum naturally decays
    if (this.emotionalState.intensity > 50) {
      this.emotionalState.momentum -= 1;
      this.emotionalState.intensity = Math.max(50, this.emotionalState.intensity - 2);
    } else if (this.emotionalState.intensity < 50) {
      this.emotionalState.momentum += 1;
      this.emotionalState.intensity = Math.min(50, this.emotionalState.intensity + 2);
    }
    
    this.emotionalState.duration += 30;
    
    // Check if current thought is getting stale
    if (this.currentThought && Date.now() - this.currentThought.since > 300000) {
      // Been thinking about same thing for 5+ minutes, intensity fades
      this.currentThought.intensity = Math.max(0, this.currentThought.intensity - 10);
      
      if (this.currentThought.intensity === 0) {
        this.currentThought = null; // Forgot about it
      }
    }
    
    // Decay old continuity items
    this.continuity.pendingQuestions = this.continuity.pendingQuestions.filter(q => 
      Date.now() - q.asked < 600000 // Remove if >10 min old
    );
    
    // Check for long-term goals that should be elevated
    const now = Date.now();
    this.goals.longterm.forEach(goal => {
      if (now - goal.created > 3600000 && Math.random() < 0.1) {
        // Hour-old goal, 10% chance to become active this tick
        this.goals.session.push({
          ...goal,
          elevated: true,
          priority: goal.priority + 20
        });
      }
    });
  }
  
  /**
   * Get current internal context for AI
   * This gets added to EVERY response
   */
  getContext() {
    let context = [];
    
    // Current thought
    if (this.currentThought && this.currentThought.intensity > 30) {
      context.push(`You've been thinking about: ${this.currentThought.topic}`);
      if (this.currentThought.intensity > 70) {
        context.push(`You're REALLY fixated on this`);
      }
    }
    
    // Active goals
    const activeGoals = [
      ...this.goals.immediate,
      ...this.goals.session.filter(g => g.priority > 50)
    ].sort((a, b) => b.priority - a.priority).slice(0, 3);
    
    if (activeGoals.length > 0) {
      context.push(`\nCurrent goals:`);
      activeGoals.forEach(goal => {
        context.push(`- ${goal.description} (priority: ${goal.priority})`);
      });
    }
    
    // Emotional momentum
    if (this.emotionalState.intensity !== 50) {
      const feeling = this.emotionalState.primary;
      const strength = this.emotionalState.intensity > 70 ? 'very' : 
                      this.emotionalState.intensity > 50 ? 'somewhat' : 'slightly';
      context.push(`You're feeling ${strength} ${feeling}`);
      
      if (Math.abs(this.emotionalState.momentum) > 5) {
        const direction = this.emotionalState.momentum > 0 ? 'intensifying' : 'fading';
        context.push(`This feeling is ${direction}`);
      }
    }
    
    // Continuity items
    if (this.continuity.pendingQuestions.length > 0) {
      const recent = this.continuity.pendingQuestions.slice(-2);
      context.push(`\nYou asked but didn't get answered:`);
      recent.forEach(q => {
        context.push(`- "${q.question}" to ${q.user}`);
      });
    }
    
    if (this.continuity.unfinishedBusiness.length > 0) {
      const important = this.continuity.unfinishedBusiness.filter(b => b.importance > 60);
      if (important.length > 0) {
        context.push(`\nUnfinished business:`);
        important.slice(0, 2).forEach(b => {
          context.push(`- ${b.description}`);
        });
      }
    }
    
    if (this.continuity.waitingFor.length > 0) {
      context.push(`\nWaiting to hear about: ${this.continuity.waitingFor.slice(0, 2).map(w => w.topic).join(', ')}`);
    }
    
    // Narrative position
    if (this.narrative.act !== 'beginning') {
      context.push(`\nStory-wise, we're in: ${this.narrative.act}`);
      if (this.narrative.tension > 60) {
        context.push(`Tension is HIGH (${this.narrative.tension}%)`);
      }
    }
    
    // Foreshadowing to pay off
    if (this.narrative.foreshadowings.length > 0) {
      const ready = this.narrative.foreshadowings.filter(f => 
        Date.now() - f.planted > 600000 && !f.paid
      );
      if (ready.length > 0 && Math.random() < 0.3) {
        context.push(`\nYou foreshadowed: "${ready[0].hint}" - maybe pay that off now?`);
      }
    }
    
    return context.join('\n');
  }
  
  /**
   * Set a new thought
   */
  setThought(topic, intensity = 70) {
    this.currentThought = {
      topic,
      intensity,
      since: Date.now()
    };
    
    this.session.thoughtsSoFar.push({
      topic,
      timestamp: Date.now()
    });
    
    console.log(`🧠 [InternalState] Now thinking about: ${topic}`);
  }
  
  /**
   * Add a goal
   */
  addGoal(description, priority = 50, duration = 'session') {
    const goal = {
      description,
      priority,
      created: Date.now(),
      completed: false
    };
    
    if (duration === 'immediate') {
      this.goals.immediate.push(goal);
      setTimeout(() => {
        // Auto-expire immediate goals after 10 minutes
        this.goals.immediate = this.goals.immediate.filter(g => g !== goal);
      }, 600000);
    } else if (duration === 'session') {
      this.goals.session.push(goal);
    } else {
      this.goals.longterm.push(goal);
      this.persistent.longtermGoals.push(goal);
      this.save();
    }
    
    console.log(`🎯 [InternalState] New ${duration} goal: ${description}`);
  }
  
  /**
   * Complete a goal
   */
  completeGoal(description) {
    ['immediate', 'session', 'longterm'].forEach(type => {
      const goal = this.goals[type].find(g => g.description === description);
      if (goal) {
        goal.completed = true;
        goal.completedAt = Date.now();
        console.log(`✅ [InternalState] Goal completed: ${description}`);
      }
    });
  }
  
  /**
   * Update emotional state
   */
  setEmotion(emotion, intensity = 70) {
    const old = this.emotionalState.primary;
    
    this.emotionalState.primary = emotion;
    this.emotionalState.intensity = intensity;
    this.emotionalState.duration = 0;
    this.emotionalState.momentum = intensity > this.emotionalState.intensity ? 5 : -5;
    
    this.session.emotionalJourney.push({
      from: old,
      to: emotion,
      intensity,
      timestamp: Date.now()
    });
    
    console.log(`😊 [InternalState] Emotion shift: ${old} → ${emotion} (${intensity}%)`);
  }
  
  /**
   * Add continuity item - question you asked
   */
  addPendingQuestion(question, user) {
    this.continuity.pendingQuestions.push({
      question,
      user,
      asked: Date.now()
    });
  }
  
  /**
   * Add unfinished business
   */
  addUnfinished(description, importance = 50) {
    this.continuity.unfinishedBusiness.push({
      description,
      importance,
      started: Date.now()
    });
  }
  
  /**
   * Add something you're waiting for
   */
  addWaitingFor(topic, fromUser) {
    this.continuity.waitingFor.push({
      topic,
      fromUser,
      since: Date.now()
    });
  }
  
  /**
   * Mark continuity item as resolved
   */
  resolve(type, matcher) {
    if (this.continuity[type]) {
      this.continuity[type] = this.continuity[type].filter(item => {
        if (typeof matcher === 'function') {
          return !matcher(item);
        }
        return true;
      });
    }
  }
  
  /**
   * Update narrative position
   */
  setAct(act, tension = null) {
    this.narrative.act = act;
    if (tension !== null) {
      this.narrative.tension = tension;
    }
    console.log(`🎬 [InternalState] Narrative: ${act} (tension: ${this.narrative.tension})`);
  }
  
  /**
   * Plant foreshadowing
   */
  foreshadow(hint, payoff) {
    this.narrative.foreshadowings.push({
      hint,
      payoff,
      planted: Date.now(),
      paid: false
    });
    console.log(`🔮 [InternalState] Foreshadowed: ${hint}`);
  }
  
  /**
   * Pay off foreshadowing
   */
  payoffForeshadowing(hint) {
    const fs = this.narrative.foreshadowings.find(f => f.hint === hint);
    if (fs) {
      fs.paid = true;
      fs.paidAt = Date.now();
      console.log(`✨ [InternalState] Paid off: ${hint}`);
      return fs.payoff;
    }
    return null;
  }
  
  /**
   * Get session summary
   */
  getSessionSummary() {
    const duration = Math.floor((Date.now() - this.session.startTime) / 60000);
    return {
      duration: `${duration} minutes`,
      thoughts: this.session.thoughtsSoFar.length,
      goals: this.session.goalsSoFar.length,
      emotions: this.session.emotionalJourney.length,
      currentState: {
        thought: this.currentThought?.topic || 'nothing specific',
        emotion: `${this.emotionalState.primary} (${this.emotionalState.intensity}%)`,
        goals: this.goals.session.length,
        act: this.narrative.act
      }
    };
  }
  
  /**
   * Save persistent state
   */
  save() {
    try {
      const data = {
        persistent: this.persistent,
        narrative: this.narrative,
        timestamp: Date.now()
      };
      
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('⚠️ [InternalState] Could not save:', error.message);
    }
  }
  
  /**
   * Load persistent state
   */
  load() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        this.persistent = data.persistent || this.persistent;
        this.narrative = data.narrative || this.narrative;
        
        // Restore long-term goals
        this.goals.longterm = this.persistent.longtermGoals || [];
        
        console.log('🧠 [InternalState] Loaded persistent state from disk');
      }
    } catch (error) {
      console.warn('⚠️ [InternalState] Could not load state:', error.message);
    }
  }
  
  /**
   * Shutdown - save state
   */
  shutdown() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.save();
    console.log('🧠 [InternalState] Saved state on shutdown');
  }
}

module.exports = InternalState;
