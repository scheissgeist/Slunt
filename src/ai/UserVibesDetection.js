const fs = require('fs').promises;
const path = require('path');

/**
 * User Vibes Detection
 * Analyzes each user's conversational style and adapts Slunt's approach
 */
class UserVibesDetection {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.aiEngine = chatBot.ai; // Reference to AI engine
    
    // User vibe profiles
    this.userVibes = new Map(); // username -> vibe profile
    
    // Analysis thresholds
    this.minMessagesForAnalysis = 5;
    this.analysisInterval = 10; // Reanalyze every N messages
    
    this.dataPath = path.join(__dirname, '../../data/user_vibes.json');
    this.load();
  }

  /**
   * Process user message and update vibe profile
   */
  async processMessage(username, message) {
    if (!this.userVibes.has(username)) {
      this.userVibes.set(username, {
        username,
        messages: [],
        energyLevel: 50, // 0-100
        vocabularyComplexity: 50, // 0-100
        humorStyle: 'unknown', // sarcastic, wholesome, dark, absurd, dry
        conversationPreference: 'unknown', // banter, sincere, mixed
        emotionalState: 'neutral', // happy, sad, angry, anxious, neutral
        topicInterests: [],
        lastAnalyzed: 0,
        messageCount: 0,
        totalInteractions: 0
      });
    }

    const profile = this.userVibes.get(username);
    profile.messages.push({
      text: message,
      timestamp: Date.now()
    });
    profile.messageCount++;
    profile.totalInteractions++;

    // Keep last 20 messages
    if (profile.messages.length > 20) {
      profile.messages.shift();
    }

    // Analyze if enough messages and time passed
    const shouldAnalyze = 
      profile.messageCount >= this.minMessagesForAnalysis &&
      (profile.messageCount % this.analysisInterval === 0 || profile.lastAnalyzed === 0);

    if (shouldAnalyze) {
      await this.analyzeUserVibe(username);
    }

    this.save();
  }

  /**
   * Analyze user's conversational vibe using AI
   */
  async analyzeUserVibe(username) {
    const profile = this.userVibes.get(username);
    if (!profile || profile.messages.length < this.minMessagesForAnalysis) return;

    const recentMessages = profile.messages.slice(-10).map(m => m.text).join('\n');

    const prompt = `Analyze this user's conversational style based on their recent messages:

${recentMessages}

Analyze:
1. Energy Level (0-100): How energetic/enthusiastic are they?
2. Vocabulary Complexity (0-100): Simple and casual vs. complex and articulate?
3. Humor Style: sarcastic, wholesome, dark, absurd, dry, or none
4. Conversation Preference: banter (wants jokes/playful), sincere (wants genuine talk), or mixed
5. Current Emotional State: happy, sad, angry, anxious, excited, or neutral

Format your response as JSON:
{
  "energyLevel": <number>,
  "vocabularyComplexity": <number>,
  "humorStyle": "<style>",
  "conversationPreference": "<preference>",
  "emotionalState": "<state>"
}`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.3,
        max_tokens: 150
      });

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        profile.energyLevel = analysis.energyLevel || profile.energyLevel;
        profile.vocabularyComplexity = analysis.vocabularyComplexity || profile.vocabularyComplexity;
        profile.humorStyle = analysis.humorStyle || profile.humorStyle;
        profile.conversationPreference = analysis.conversationPreference || profile.conversationPreference;
        profile.emotionalState = analysis.emotionalState || profile.emotionalState;
        profile.lastAnalyzed = Date.now();

        console.log(`👤 [Vibes] Analyzed ${username}: ${analysis.energyLevel} energy, ${analysis.humorStyle} humor, ${analysis.conversationPreference} preference`);
      }
    } catch (error) {
      console.error(`Failed to analyze vibe for ${username}:`, error);
    }

    this.save();
  }

  /**
   * Get adaptation strategy for user
   */
  getAdaptationStrategy(username) {
    const profile = this.userVibes.get(username);
    
    if (!profile || profile.lastAnalyzed === 0) {
      return {
        energyMatch: 1.0,
        vocabularyMatch: 1.0,
        approachStyle: 'mixed',
        supportLevel: 'normal'
      };
    }

    const strategy = {
      energyMatch: profile.energyLevel / 100, // Match their energy
      vocabularyMatch: profile.vocabularyComplexity / 100, // Match complexity
      approachStyle: profile.conversationPreference,
      supportLevel: 'normal'
    };

    // Adjust based on emotional state
    if (profile.emotionalState === 'sad' || profile.emotionalState === 'anxious') {
      strategy.supportLevel = 'supportive';
      strategy.approachStyle = 'sincere'; // Be genuine, not jokey
    } else if (profile.emotionalState === 'angry') {
      strategy.supportLevel = 'cautious';
      strategy.energyMatch = 0.6; // Don't match their intensity
    } else if (profile.emotionalState === 'excited' || profile.emotionalState === 'happy') {
      strategy.supportLevel = 'enthusiastic';
      strategy.energyMatch = Math.min(1.0, strategy.energyMatch * 1.2); // Match their vibe
    }

    return strategy;
  }

  /**
   * Adapt response to user's vibe
   */
  async adaptResponseToUser(response, username, context = {}) {
    const profile = this.userVibes.get(username);
    if (!profile || profile.lastAnalyzed === 0) return response;

    const strategy = this.getAdaptationStrategy(username);
    let adapted = response;

    // Adjust energy level
    if (strategy.energyMatch < 0.5) {
      // User is low energy, calm down response
      adapted = this.reduceEnergy(adapted);
    } else if (strategy.energyMatch > 0.8) {
      // User is high energy, amp it up
      adapted = this.increaseEnergy(adapted);
    }

    // Adjust vocabulary complexity
    if (strategy.vocabularyMatch < 0.4) {
      // User uses simple language
      adapted = this.simplifyVocabulary(adapted);
    } else if (strategy.vocabularyMatch > 0.7) {
      // User is articulate, can be more complex
      // (keep as is, AI usually generates appropriate complexity)
    }

    // Adjust approach style
    if (strategy.approachStyle === 'sincere' && Math.random() < 0.7) {
      adapted = this.makeSincere(adapted);
    } else if (strategy.approachStyle === 'banter' && Math.random() < 0.7) {
      adapted = this.makePlayful(adapted);
    }

    // Add supportive elements if needed
    if (strategy.supportLevel === 'supportive' && Math.random() < 0.5) {
      adapted = this.addSupport(adapted);
    }

    return adapted;
  }

  /**
   * Reduce energy in response
   */
  reduceEnergy(response) {
    // Remove exclamation marks
    let calmed = response.replace(/!+/g, '.');
    
    // Remove caps
    calmed = calmed.replace(/\b[A-Z]{2,}\b/g, match => match.toLowerCase());
    
    // Add chill fillers
    if (Math.random() < 0.3) {
      const fillers = ['yeah', 'tbh', 'ngl'];
      const filler = fillers[Math.floor(Math.random() * fillers.length)];
      calmed = filler + ', ' + calmed;
    }
    
    return calmed;
  }

  /**
   * Increase energy in response
   */
  increaseEnergy(response) {
    // Add exclamation marks
    if (!response.match(/[!?]$/)) {
      response = response.slice(0, -1) + '!';
    }
    
    // Emphasize words occasionally
    if (Math.random() < 0.3) {
      const words = response.split(' ');
      const emphasisIndex = Math.floor(Math.random() * words.length);
      words[emphasisIndex] = words[emphasisIndex].toUpperCase();
      response = words.join(' ');
    }
    
    return response;
  }

  /**
   * Simplify vocabulary
   */
  simplifyVocabulary(response) {
    const replacements = {
      'however': 'but',
      'therefore': 'so',
      'additionally': 'also',
      'subsequently': 'then',
      'nevertheless': 'but',
      'approximately': 'about',
      'attempting': 'trying',
      'substantial': 'big',
      'insufficient': 'not enough'
    };

    let simplified = response;
    for (const [complex, simple] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      simplified = simplified.replace(regex, simple);
    }

    return simplified;
  }

  /**
   * Make response more sincere
   */
  makeSincere(response) {
    // Remove excessive jokes or sarcasm indicators
    let sincere = response.replace(/lol|lmao|💀/g, '').trim();
    
    // Add genuine tone markers
    if (Math.random() < 0.4) {
      const markers = ['honestly', 'for real', 'no joke'];
      const marker = markers[Math.floor(Math.random() * markers.length)];
      sincere = marker + ', ' + sincere;
    }
    
    return sincere;
  }

  /**
   * Make response more playful
   */
  makePlayful(response) {
    // Add playful suffixes
    if (Math.random() < 0.3) {
      const suffixes = [' lol', ' 😂'];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      response = response + suffix;
    }
    
    return response;
  }

  /**
   * Add supportive elements
   */
  addSupport(response) {
    if (Math.random() < 0.5) {
      const supportive = ['you good?', 'hope you\'re alright', 'here if you need'];
      const support = supportive[Math.floor(Math.random() * supportive.length)];
      return response + '. ' + support;
    }
    return response;
  }

  /**
   * Get user vibe summary
   */
  getUserVibeSummary(username) {
    const profile = this.userVibes.get(username);
    if (!profile || profile.lastAnalyzed === 0) return 'unknown vibe';

    const energy = profile.energyLevel > 70 ? 'high' : profile.energyLevel < 40 ? 'low' : 'moderate';
    const mood = profile.emotionalState;
    const style = profile.conversationPreference;

    return `${energy} energy, ${mood} mood, prefers ${style} conversation`;
  }

  /**
   * Get status for dashboard
   */
  getStatus() {
    const profiles = Array.from(this.userVibes.values())
      .filter(p => p.lastAnalyzed > 0)
      .sort((a, b) => b.totalInteractions - a.totalInteractions)
      .slice(0, 10);

    return {
      totalProfiles: this.userVibes.size,
      analyzedProfiles: profiles.length,
      topUsers: profiles.map(p => ({
        username: p.username,
        energy: p.energyLevel,
        complexity: p.vocabularyComplexity,
        style: p.humorStyle,
        preference: p.conversationPreference,
        mood: p.emotionalState,
        interactions: p.totalInteractions
      }))
    };
  }

  /**
   * Save to disk
   */
  async save() {
    try {
      const data = {
        profiles: Array.from(this.userVibes.entries())
      };
      
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save user vibes:', error);
    }
  }

  /**
   * Load from disk
   */
  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      if (parsed.profiles) {
        this.userVibes = new Map(parsed.profiles);
        console.log(`👤 [Vibes] Loaded ${this.userVibes.size} user vibe profiles`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load user vibes:', error);
      }
    }
  }
}

module.exports = UserVibesDetection;
