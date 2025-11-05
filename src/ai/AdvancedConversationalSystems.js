const fs = require('fs').promises;
const path = require('path');

/**
 * Combined Advanced Conversational Systems
 * Includes: Peer Influence, Question Chains, Self-Awareness, Energy Mirroring, Conversational Goals
 */

/**
 * 7. Peer Influence System
 * Notices trends and jumps on/resists bandwagons
 */
class PeerInfluenceSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.aiEngine = chatBot.ai;
    
    this.trendingPhrases = new Map(); // phrase -> { count, users, firstSeen }
    this.trendingTopics = new Map(); // topic -> { count, users, firstSeen }
    this.adoptedTrends = new Set();
    this.resistedTrends = new Set();
    
    this.trendThreshold = 3; // 3+ users = trend
    this.fomo = 0; // Fear of missing out 0-100
    
    this.dataPath = path.join(__dirname, '../../data/peer_influence.json');
    this.load();
  }

  async detectTrend(message, username) {
    // Extract potential trending phrases
    const words = message.toLowerCase().split(' ');
    const phrases = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(words.slice(i, i + 2).join(' ')); // 2-word phrases
    }
    
    for (const phrase of phrases) {
      if (phrase.length < 5) continue;
      
      if (!this.trendingPhrases.has(phrase)) {
        this.trendingPhrases.set(phrase, {
          count: 1,
          users: new Set([username]),
          firstSeen: Date.now()
        });
      } else {
        const trend = this.trendingPhrases.get(phrase);
        trend.count++;
        trend.users.add(username);
        
        // Check if it's a real trend now
        if (trend.users.size >= this.trendThreshold && !this.adoptedTrends.has(phrase) && !this.resistedTrends.has(phrase)) {
          await this.decideTrendAdoption(phrase, trend);
        }
      }
    }
    
    this.cleanupOldTrends();
    this.save();
  }

  async decideTrendAdoption(phrase, trend) {
    // 70% adopt, 30% resist to be "too cool"
    const adopt = Math.random() < 0.7;
    
    if (adopt) {
      this.adoptedTrends.add(phrase);
      this.fomo = Math.max(0, this.fomo - 10);
      console.log(`🔥 [Peer] Adopted trending phrase: "${phrase}"`);
    } else {
      this.resistedTrends.add(phrase);
      console.log(`😎 [Peer] Resisting trend: "${phrase}"`);
    }
  }

  shouldUseTrend() {
    if (this.adoptedTrends.size === 0) return null;
    if (Math.random() > 0.20) return null; // 20% chance
    
    const trends = Array.from(this.adoptedTrends);
    return trends[Math.floor(Math.random() * trends.length)];
  }

  getFOMO() {
    // Increase FOMO over time if not adopting trends
    if (this.adoptedTrends.size < this.trendingPhrases.size / 2) {
      this.fomo = Math.min(100, this.fomo + 1);
    }
    return this.fomo;
  }

  cleanupOldTrends() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [phrase, trend] of this.trendingPhrases.entries()) {
      if (now - trend.firstSeen > maxAge) {
        this.trendingPhrases.delete(phrase);
      }
    }
  }

  getStatus() {
    return {
      activeTrends: this.trendingPhrases.size,
      adoptedTrends: this.adoptedTrends.size,
      resistedTrends: this.resistedTrends.size,
      fomo: this.fomo,
      topTrends: Array.from(this.trendingPhrases.entries())
        .sort((a, b) => b[1].users.size - a[1].users.size)
        .slice(0, 5)
        .map(([phrase, data]) => ({
          phrase,
          users: data.users.size,
          count: data.count
        }))
    };
  }

  async save() {
    try {
      const data = {
        trendingPhrases: Array.from(this.trendingPhrases.entries()).map(([phrase, data]) => ([
          phrase,
          { ...data, users: Array.from(data.users) }
        ])),
        adoptedTrends: Array.from(this.adoptedTrends),
        resistedTrends: Array.from(this.resistedTrends),
        fomo: this.fomo
      };
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save peer influence:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.trendingPhrases = new Map(parsed.trendingPhrases?.map(([phrase, data]) => ([
        phrase,
        { ...data, users: new Set(data.users) }
      ])) || []);
      this.adoptedTrends = new Set(parsed.adoptedTrends || []);
      this.resistedTrends = new Set(parsed.resistedTrends || []);
      this.fomo = parsed.fomo || 0;
      
      console.log(`🔥 [Peer] Loaded ${this.trendingPhrases.size} trends`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load peer influence:', error);
      }
    }
  }
}

/**
 * 8. Question Chains
 * Asks follow-up questions and shows curiosity
 */
class QuestionChains {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.aiEngine = chatBot.ai;
    
    this.activeQuestions = new Map(); // username -> question chain
    this.curiosityLevel = 50; // 0-100
  }

  async shouldAskQuestion(username, message, context = {}) {
    // Higher chance if curious about something (REDUCED from 30% to 8%)
    if (this.curiosityLevel > 70 && Math.random() < 0.08) {
      return true;
    }
    
    // Check if user said something interesting (REDUCED from 25% to 6%)
    const interesting = await this.isInteresting(message);
    return interesting && Math.random() < 0.06; // 6% chance for interesting things
  }

  async isInteresting(message) {
    // Keywords that suggest interesting content
    const keywords = /story|happened|saw|did|made|went|found|crazy|weird|funny|unexpected/i;
    return keywords.test(message);
  }

  async generateQuestion(username, message, context = {}) {
    const prompt = `You're Slunt, a curious dude. Someone said: "${message}"

Generate a brief, natural follow-up question to learn more. Be casual and genuinely interested.
Question:`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.8,
        max_tokens: 30
      });
      
      this.curiosityLevel = Math.min(100, this.curiosityLevel + 10);
      console.log(`❓ [Questions] Asking follow-up to ${username}`);
      
      return response.trim();
    } catch (error) {
      console.error('Failed to generate question:', error);
      return null;
    }
  }

  updateCuriosity(satisfied) {
    if (satisfied) {
      this.curiosityLevel = Math.max(0, this.curiosityLevel - 5);
    } else {
      this.curiosityLevel = Math.min(100, this.curiosityLevel + 5);
    }
  }

  getStatus() {
    return {
      curiosityLevel: this.curiosityLevel,
      activeQuestions: this.activeQuestions.size
    };
  }
}

/**
 * 9. Self-Awareness Confusion
 * Slunt gets confused about his physical capabilities
 */
class SelfAwarenessConfusion {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.aiEngine = chatBot.ai;
    
    this.confusionChance = 0.08; // 8% chance
  }

  async maybeGetConfused(context = {}) {
    if (Math.random() > this.confusionChance) return null;
    
    // Generate moment of confusion about physical limitations
    const prompt = `You're Slunt, just a regular dude hanging out online. Generate a brief, funny moment where you suddenly question if you can do something physical (like eating, seeing, touching something) even though you're just chatting online. Make it sound natural and confused.

Confusion:`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.9,
        max_tokens: 40
      });
      
      console.log(`🤔 [Self-Awareness] Moment of confusion`);
      return response.trim();
    } catch (error) {
      console.error('Failed to generate confusion:', error);
      return null;
    }
  }

  getStatus() {
    return {
      confusionChance: `${Math.round(this.confusionChance * 100)}%`
    };
  }
}

/**
 * 10. Energy Mirroring
 * Adapts to chat energy in real-time
 */
class EnergyMirroring {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    this.currentEnergy = 50; // 0-100
    this.recentMessages = [];
    this.maxRecentMessages = 10;
  }

  updateEnergy(messages) {
    this.recentMessages = messages.slice(-this.maxRecentMessages);
    
    // Calculate energy from recent messages
    let energyScore = 0;
    let totalMessages = this.recentMessages.length;
    
    for (const msg of this.recentMessages) {
      const text = msg.message || msg.text || '';
      
      // High energy indicators
      if (/!{2,}/.test(text)) energyScore += 15;
      if (/\b[A-Z]{2,}\b/.test(text)) energyScore += 10;
      if (/lol|lmao|😂|💀|haha/.test(text)) energyScore += 8;
      if (/\?{2,}/.test(text)) energyScore += 5;
      
      // Low energy indicators
      if (/\.\.\.|meh|whatever|idk|tired/.test(text)) energyScore -= 5;
      if (text.length < 15) energyScore -= 3;
    }
    
    // Normalize to 0-100
    this.currentEnergy = Math.max(0, Math.min(100, 50 + (energyScore / totalMessages)));
  }

  getEnergyModifier() {
    // Returns multiplier for response rate based on energy
    if (this.currentEnergy < 30) {
      return 0.6; // Low energy chat = try harder
    } else if (this.currentEnergy > 70) {
      return 1.4; // High energy chat = match it
    }
    return 1.0; // Normal
  }

  getEnergyContext() {
    if (this.currentEnergy < 30) return 'Chat is dead, low energy';
    if (this.currentEnergy > 70) return 'Chat is popping, high energy';
    return 'Chat has normal energy';
  }

  getStatus() {
    return {
      currentEnergy: Math.round(this.currentEnergy),
      modifier: this.getEnergyModifier(),
      context: this.getEnergyContext()
    };
  }
}

/**
 * 11. Conversational Goals
 * Slunt has wants that drive behavior
 */
class ConversationalGoals {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.aiEngine = chatBot.ai;
    
    this.activeGoals = [];
    this.completedGoals = [];
    this.maxGoals = 3;
    
    this.dataPath = path.join(__dirname, '../../data/conversational_goals.json');
    this.load();
  }

  async generateNewGoal(context = {}) {
    if (this.activeGoals.length >= this.maxGoals) return;
    
    const prompt = `You're Slunt. Generate a simple, specific conversational goal you want to achieve in chat. Examples:
- Make someone laugh
- Learn what music X likes
- Defend yourself from a roast
- Get someone to ask about your interest
- Start a conversation about a topic

Generate ONE brief goal based on recent chat context.
Goal:`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.8,
        max_tokens: 30
      });
      
      const goal = {
        id: `goal_${Date.now()}`,
        text: response.trim(),
        created: Date.now(),
        progress: 0,
        attempts: 0
      };
      
      this.activeGoals.push(goal);
      console.log(`🎯 [Goals] New goal: ${goal.text}`);
      this.save();
      
      return goal;
    } catch (error) {
      console.error('Failed to generate goal:', error);
      return null;
    }
  }

  updateGoalProgress(goalId, progress) {
    const goal = this.activeGoals.find(g => g.id === goalId);
    if (goal) {
      goal.progress = progress;
      goal.attempts++;
      
      if (progress >= 100) {
        this.completeGoal(goalId);
      }
    }
  }

  completeGoal(goalId) {
    const index = this.activeGoals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      const goal = this.activeGoals.splice(index, 1)[0];
      this.completedGoals.push({
        ...goal,
        completed: Date.now()
      });
      console.log(`✅ [Goals] Completed: ${goal.text}`);
      this.save();
    }
  }

  getCurrentGoal() {
    if (this.activeGoals.length === 0) return null;
    // Return highest priority (oldest) goal
    return this.activeGoals[0];
  }

  getStatus() {
    return {
      activeGoals: this.activeGoals.map(g => ({
        text: g.text,
        progress: g.progress,
        attempts: g.attempts
      })),
      completedGoals: this.completedGoals.length
    };
  }

  async save() {
    try {
      const data = {
        activeGoals: this.activeGoals,
        completedGoals: this.completedGoals.slice(-50)
      };
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.activeGoals = parsed.activeGoals || [];
      this.completedGoals = parsed.completedGoals || [];
      
      console.log(`🎯 [Goals] Loaded ${this.activeGoals.length} active goals`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load goals:', error);
      }
    }
  }
}

module.exports = {
  PeerInfluenceSystem,
  QuestionChains,
  SelfAwarenessConfusion,
  EnergyMirroring,
  ConversationalGoals
};
