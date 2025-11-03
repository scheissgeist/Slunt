/**
 * MEMORY LEARNING LOOP
 * 
 * Tracks what works and what doesn't, evolves Slunt's personality based on feedback.
 * Creates a feedback loop where successful patterns are reinforced and failures are avoided.
 */

const fs = require('fs');
const path = require('path');

class MemoryLearningLoop {
  constructor(chatBot) {
    this.bot = chatBot;
    
    // Track response outcomes
    this.responseHistory = []; // { response, outcome, context }
    
    // Pattern effectiveness tracking
    this.patternScores = new Map(); // pattern -> { successes, failures, score }
    
    // Topic resonance by user
    this.topicResonance = new Map(); // username -> { topic -> score }
    
    // Joke effectiveness
    this.jokePerformance = new Map(); // joke_pattern -> { attempts, laughs, bombs }
    
    // Personality genome - evolving traits
    this.personalityGenome = {
      humor: 0.7,
      edginess: 0.6,
      vulnerability: 0.4,
      sarcasm: 0.65,
      enthusiasm: 0.7,
      curiosity: 0.6,
      supportiveness: 0.7,
      playfulness: 0.75
    };
    
    // Learning rate
    this.learningRate = 0.05; // How fast to adapt
    
    // Load saved learning data
    this.load();
    
    console.log('🧠 [Learning] Memory learning loop initialized');
    console.log(`   📊 Pattern scores: ${this.patternScores.size}`);
    console.log(`   😂 Joke performance: ${this.jokePerformance.size}`);
  }

  /**
   * Record a response and track it for feedback
   */
  recordResponse(response, username, context) {
    const record = {
      id: `${Date.now()}_${Math.random()}`,
      response,
      username,
      context: {
        mood: context.mood || 'neutral',
        topic: context.topic || 'general',
        platform: context.platform || 'coolhole',
        timestamp: Date.now()
      },
      outcome: null, // Will be filled by feedback
      patterns: this.extractPatterns(response),
      isJoke: this.detectJokeAttempt(response)
    };
    
    this.responseHistory.push(record);
    
    // Keep only recent history (last 500 responses)
    if (this.responseHistory.length > 500) {
      this.responseHistory = this.responseHistory.slice(-300);
    }
    
    // Auto-detect outcome after 30 seconds
    setTimeout(() => {
      this.detectOutcome(record.id);
    }, 30000);
    
    return record.id;
  }

  /**
   * Detect if a response was successful based on chat activity
   */
  detectOutcome(responseId) {
    const record = this.responseHistory.find(r => r.id === responseId);
    if (!record || record.outcome) return; // Already evaluated
    
    const responseTime = record.context.timestamp;
    const windowEnd = responseTime + 30000; // 30 second window
    
    // Check conversation context for responses
    const followUps = this.bot.conversationContext.filter(m => 
      m.timestamp > responseTime &&
      m.timestamp < windowEnd &&
      m.username !== 'Slunt'
    );
    
    // Scoring criteria
    let outcomeScore = 0;
    const reasons = [];
    
    // 1. Did anyone respond?
    if (followUps.length === 0) {
      outcomeScore -= 2;
      reasons.push('silence');
    } else {
      outcomeScore += followUps.length;
      reasons.push(`${followUps.length} replies`);
    }
    
    // 2. Positive indicators
    const positiveWords = ['lol', 'lmao', 'haha', 'yeah', 'true', 'exactly', 'omg', 'wait'];
    const positiveCount = followUps.filter(m => 
      positiveWords.some(word => m.text.toLowerCase().includes(word))
    ).length;
    
    if (positiveCount > 0) {
      outcomeScore += positiveCount * 2;
      reasons.push(`${positiveCount} positive`);
    }
    
    // 3. Negative indicators
    const negativeWords = ['what', '?', 'huh', 'ok', 'whatever', 'sure'];
    const negativeCount = followUps.filter(m =>
      negativeWords.some(word => m.text.toLowerCase() === word.toLowerCase())
    ).length;
    
    if (negativeCount > 0) {
      outcomeScore -= negativeCount;
      reasons.push(`${negativeCount} confused`);
    }
    
    // 4. Did conversation continue naturally?
    const conversationContinued = followUps.length >= 2 && 
      followUps.some(m => m.text.length > 20);
    
    if (conversationContinued) {
      outcomeScore += 3;
      reasons.push('conversation continued');
    }
    
    // Determine outcome
    record.outcome = {
      score: outcomeScore,
      classification: outcomeScore > 2 ? 'success' : outcomeScore < -1 ? 'failure' : 'neutral',
      reasons,
      evaluatedAt: Date.now()
    };
    
    // Update pattern scores
    this.updatePatternScores(record);
    
    // Update joke performance if applicable
    if (record.isJoke) {
      this.updateJokePerformance(record);
    }
    
    // Update topic resonance
    this.updateTopicResonance(record);
    
    // Evolve personality based on outcome
    this.evolvePersonality(record);
    
    console.log(`📊 [Learning] Response evaluated: ${record.outcome.classification} (${outcomeScore}) - ${reasons.join(', ')}`);
  }

  /**
   * Extract patterns from response
   */
  extractPatterns(response) {
    const patterns = [];
    const lower = response.toLowerCase();
    
    // Detect patterns
    if (lower.includes('lol') || lower.includes('lmao')) patterns.push('humor_lol');
    if (lower.includes('?')) patterns.push('question');
    if (lower.match(/\b(honestly|actually|tbh)\b/)) patterns.push('honest_prefix');
    if (lower.match(/\b(wait|hold on|hold up)\b/)) patterns.push('interruption');
    if (lower.match(/\b(dude|man|bro)\b/)) patterns.push('casual_address');
    if (lower.includes('...')) patterns.push('trailing_off');
    if (response.split(' ').length < 5) patterns.push('short_response');
    if (response.split(' ').length > 20) patterns.push('long_response');
    if (lower.match(/\b(what|why|how|when)\b/)) patterns.push('curiosity');
    if (lower.match(/\b(shit|fuck|damn)\b/)) patterns.push('swearing');
    if (lower.match(/\b(idk|dunno|not sure)\b/)) patterns.push('uncertainty');
    
    return patterns;
  }

  /**
   * Detect if response is a joke attempt
   */
  detectJokeAttempt(response) {
    const lower = response.toLowerCase();
    const jokeIndicators = [
      'lol', 'lmao', 'haha',
      lower.includes('like if'),
      lower.includes('imagine'),
      lower.includes('literally'),
      response.length > 30 && lower.includes('but'),
      lower.match(/that's.*like/)
    ];
    
    return jokeIndicators.filter(Boolean).length >= 2;
  }

  /**
   * Update pattern effectiveness scores
   */
  updatePatternScores(record) {
    if (!record.outcome) return;
    
    const isSuccess = record.outcome.classification === 'success';
    const isFailure = record.outcome.classification === 'failure';
    
    record.patterns.forEach(pattern => {
      if (!this.patternScores.has(pattern)) {
        this.patternScores.set(pattern, {
          successes: 0,
          failures: 0,
          neutral: 0,
          score: 0.5
        });
      }
      
      const stats = this.patternScores.get(pattern);
      
      if (isSuccess) {
        stats.successes++;
      } else if (isFailure) {
        stats.failures++;
      } else {
        stats.neutral++;
      }
      
      // Calculate new score (0-1 scale)
      const total = stats.successes + stats.failures + stats.neutral * 0.5;
      stats.score = total > 0 ? stats.successes / total : 0.5;
    });
  }

  /**
   * Update joke performance tracking
   */
  updateJokePerformance(record) {
    const jokePattern = record.response.substring(0, 50); // First 50 chars as key
    
    if (!this.jokePerformance.has(jokePattern)) {
      this.jokePerformance.set(jokePattern, {
        attempts: 0,
        laughs: 0,
        bombs: 0,
        lastUsed: 0
      });
    }
    
    const performance = this.jokePerformance.get(jokePattern);
    performance.attempts++;
    performance.lastUsed = Date.now();
    
    if (record.outcome.classification === 'success') {
      performance.laughs++;
    } else if (record.outcome.classification === 'failure') {
      performance.bombs++;
    }
  }

  /**
   * Update topic resonance per user
   */
  updateTopicResonance(record) {
    const { username } = record;
    const topic = record.context.topic;
    
    if (!topic || topic === 'general') return;
    
    if (!this.topicResonance.has(username)) {
      this.topicResonance.set(username, new Map());
    }
    
    const userTopics = this.topicResonance.get(username);
    const currentScore = userTopics.get(topic) || 0.5;
    
    // Adjust score based on outcome
    let adjustment = 0;
    if (record.outcome.classification === 'success') {
      adjustment = 0.1;
    } else if (record.outcome.classification === 'failure') {
      adjustment = -0.1;
    }
    
    userTopics.set(topic, Math.max(0, Math.min(1, currentScore + adjustment)));
  }

  /**
   * Evolve personality based on what's working
   */
  evolvePersonality(record) {
    if (!record.outcome || record.outcome.classification === 'neutral') return;
    
    const isSuccess = record.outcome.classification === 'success';
    const adjustment = isSuccess ? this.learningRate : -this.learningRate;
    
    // Map patterns to personality traits
    const patternToTrait = {
      'humor_lol': 'humor',
      'swearing': 'edginess',
      'uncertainty': 'vulnerability',
      'interruption': 'playfulness',
      'curiosity': 'curiosity',
      'honest_prefix': 'vulnerability',
      'long_response': 'enthusiasm'
    };
    
    record.patterns.forEach(pattern => {
      const trait = patternToTrait[pattern];
      if (trait && this.personalityGenome[trait] !== undefined) {
        this.personalityGenome[trait] = Math.max(0, Math.min(1, 
          this.personalityGenome[trait] + adjustment
        ));
      }
    });
  }

  /**
   * Get recommendations for response style
   */
  getRecommendations(username, context) {
    const recommendations = {
      shouldUsePattern: {},
      avoidPatterns: [],
      topicScore: 0.5,
      personalityAdjustments: {}
    };
    
    // Check pattern scores
    for (const [pattern, stats] of this.patternScores.entries()) {
      if (stats.score > 0.7) {
        recommendations.shouldUsePattern[pattern] = stats.score;
      } else if (stats.score < 0.3) {
        recommendations.avoidPatterns.push(pattern);
      }
    }
    
    // Check topic resonance for this user
    if (this.topicResonance.has(username) && context.topic) {
      const userTopics = this.topicResonance.get(username);
      recommendations.topicScore = userTopics.get(context.topic) || 0.5;
    }
    
    // Provide current personality state
    recommendations.personalityAdjustments = { ...this.personalityGenome };
    
    return recommendations;
  }

  /**
   * Get evolved personality traits
   */
  getPersonality() {
    return { ...this.personalityGenome };
  }

  /**
   * Check if a joke has been overused
   */
  isJokeStale(jokeText) {
    const key = jokeText.substring(0, 50);
    const performance = this.jokePerformance.get(key);
    
    if (!performance) return false;
    
    // Stale if: used recently OR bombs > laughs
    const usedRecently = (Date.now() - performance.lastUsed) < 3600000; // 1 hour
    const poorPerformance = performance.bombs > performance.laughs;
    
    return (usedRecently && performance.attempts > 2) || poorPerformance;
  }

  /**
   * Save learning data to disk
   */
  save() {
    try {
      const data = {
        responseHistory: this.responseHistory.slice(-100), // Save last 100
        patternScores: Array.from(this.patternScores.entries()),
        topicResonance: Array.from(this.topicResonance.entries()).map(([user, topics]) => [
          user,
          Array.from(topics.entries())
        ]),
        jokePerformance: Array.from(this.jokePerformance.entries()).slice(-50),
        personalityGenome: this.personalityGenome,
        lastSaved: Date.now()
      };
      
      const filePath = path.join(__dirname, '../../data/learning_loop.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
    } catch (error) {
      console.error('❌ [Learning] Error saving:', error.message);
    }
  }

  /**
   * Load learning data from disk
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/learning_loop.json');
      
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.responseHistory = data.responseHistory || [];
      this.patternScores = new Map(data.patternScores || []);
      this.topicResonance = new Map(
        (data.topicResonance || []).map(([user, topics]) => [
          user,
          new Map(topics)
        ])
      );
      this.jokePerformance = new Map(data.jokePerformance || []);
      
      if (data.personalityGenome) {
        this.personalityGenome = data.personalityGenome;
      }
      
      console.log('✅ [Learning] Loaded learning data from disk');
      
    } catch (error) {
      console.error('❌ [Learning] Error loading:', error.message);
    }
  }
}

module.exports = MemoryLearningLoop;
