/**
 * NEXT-LEVEL ENHANCEMENTS PART 3
 * Systems 11-15
 */

const fs = require('fs');
const path = require('path');

/**
 * 11. VULNERABILITY THRESHOLDS
 * Match vulnerability level, guards with strangers
 */
class VulnerabilityThresholds {
  constructor(chatBot) {
    this.bot = chatBot;
    this.userVulnerability = new Map(); // username -> vulnerability tracking
    
    console.log('🛡️ [Vulnerability] Vulnerability thresholds initialized');
  }

  /**
   * Get vulnerability data for user
   */
  getVulnerabilityData(username) {
    if (!this.userVulnerability.has(username)) {
      this.userVulnerability.set(username, {
        theyShared: 0, // 0-1 scale
        weShared: 0, // 0-1 scale
        trustLevel: 0, // 0-1 scale
        vulnerableMoments: []
      });
    }
    
    return this.userVulnerability.get(username);
  }

  /**
   * Record vulnerable moment from user
   */
  recordUserVulnerability(username, level) {
    const data = this.getVulnerabilityData(username);
    
    data.theyShared = Math.min(1, data.theyShared + level * 0.2);
    data.trustLevel = Math.min(1, data.trustLevel + 0.1);
    
    data.vulnerableMoments.push({
      timestamp: Date.now(),
      who: 'them',
      level
    });
    
    // Keep last 20
    if (data.vulnerableMoments.length > 20) {
      data.vulnerableMoments = data.vulnerableMoments.slice(-20);
    }
  }

  /**
   * Should we share vulnerability?
   */
  shouldShareVulnerability(username, relationshipTier) {
    const data = this.getVulnerabilityData(username);
    
    // Never overshare to strangers
    if (relationshipTier === 'stranger' && data.theyShared < 0.3) {
      return { allowed: false, reason: 'stranger, guards up' };
    }
    
    // Match their vulnerability level
    if (data.theyShared > data.weShared + 0.2) {
      return { allowed: true, reason: 'matching their openness', maxLevel: data.theyShared };
    }
    
    // Close friends can share more freely
    if (relationshipTier === 'closeFriend' && data.trustLevel > 0.7) {
      return { allowed: true, reason: 'close friend, high trust', maxLevel: 0.9 };
    }
    
    return { allowed: false, reason: 'not ready to open up yet' };
  }

  /**
   * Record our own vulnerability shared
   */
  recordOurVulnerability(username, level) {
    const data = this.getVulnerabilityData(username);
    
    data.weShared = Math.min(1, data.weShared + level * 0.2);
    
    data.vulnerableMoments.push({
      timestamp: Date.now(),
      who: 'us',
      level
    });
    
    if (data.vulnerableMoments.length > 20) {
      data.vulnerableMoments = data.vulnerableMoments.slice(-20);
    }
  }

  /**
   * Get vulnerability context for AI
   */
  getVulnerabilityContext(username, relationshipTier) {
    const data = this.getVulnerabilityData(username);
    const check = this.shouldShareVulnerability(username, relationshipTier);
    
    let context = `\n[VULNERABILITY] `;
    
    if (!check.allowed) {
      context += `Don't overshare. ${check.reason}. Keep things surface-level.`;
    } else {
      context += `You can be vulnerable (${check.reason}). Max depth: ${(check.maxLevel * 100).toFixed(0)}%`;
    }
    
    if (data.theyShared > data.weShared + 0.3) {
      context += `\nThey've been open with you. Consider reciprocating.`;
    }
    
    return context;
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        vulnerabilities: Array.from(this.userVulnerability.entries())
      };
      
      const filePath = path.join(__dirname, '../../data/vulnerability_thresholds.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Vulnerability] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/vulnerability_thresholds.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.userVulnerability = new Map(data.vulnerabilities || []);
      
      console.log(`✅ [Vulnerability] Loaded ${this.userVulnerability.size} user vulnerability profiles`);
    } catch (error) {
      console.error('❌ [Vulnerability] Load error:', error.message);
    }
  }
}

/**
 * 12. CONTEXT WINDOW LIMITATIONS
 * Realistic conversation memory span
 */
class ContextWindowLimitations {
  constructor(chatBot) {
    this.bot = chatBot;
    this.memorySpan = 20; // messages
    this.importantMemoryBonus = 10; // important messages remembered longer
    
    console.log('🪟 [ContextWindow] Context window limitations initialized');
  }

  /**
   * Filter conversation context to realistic span
   */
  filterContext(conversationHistory, currentMessage) {
    if (conversationHistory.length <= this.memorySpan) {
      return conversationHistory;
    }
    
    // Keep recent messages
    const recentMessages = conversationHistory.slice(-this.memorySpan);
    
    // Also keep important/emotional messages from earlier
    const olderMessages = conversationHistory.slice(0, -this.memorySpan);
    const importantOlder = olderMessages.filter(msg => {
      return msg.emotional || msg.funny || msg.important;
    }).slice(-5); // Keep up to 5 important older messages
    
    return [...importantOlder, ...recentMessages];
  }

  /**
   * Should request clarification on old reference?
   */
  shouldRequestClarification(messageIndex, totalMessages) {
    const messagesAgo = totalMessages - messageIndex;
    
    // Don't remember things from >20 messages ago
    if (messagesAgo > this.memorySpan) {
      return Math.random() < 0.7; // 70% chance to ask "wait what?"
    }
    
    // Fuzzy on things from 10-20 messages ago
    if (messagesAgo > this.memorySpan / 2) {
      return Math.random() < 0.3; // 30% chance to ask for clarification
    }
    
    return false;
  }

  /**
   * Get clarification message
   */
  getClarificationMessage() {
    const messages = [
      'wait what',
      'refresh my memory',
      'what were we talking about again',
      'when did we talk about that',
      'dont remember that part'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get context limitation notes for AI
   */
  getContextLimitationNote(conversationLength) {
    if (conversationLength > this.memorySpan) {
      return `\n[MEMORY LIMIT] This conversation is ${conversationLength} messages long. You realistically only remember the last ${this.memorySpan} messages clearly. Earlier stuff is fuzzy.`;
    }
    
    return '';
  }
}

/**
 * 13. COMPETITIVE/COOPERATIVE DYNAMICS
 * Track wins/losses, playful competition
 */
class CompetitiveCooperativeDynamics {
  constructor(chatBot) {
    this.bot = chatBot;
    this.userDynamics = new Map(); // username -> dynamics data
    
    console.log('🏆 [Dynamics] Competitive/cooperative dynamics initialized');
  }

  /**
   * Get dynamics with user
   */
  getDynamics(username) {
    if (!this.userDynamics.has(username)) {
      this.userDynamics.set(username, {
        wins: 0,
        losses: 0,
        ties: 0,
        teamUps: 0,
        grudges: [],
        victories: [],
        competitions: []
      });
    }
    
    return this.userDynamics.get(username);
  }

  /**
   * Record competition result
   */
  recordCompetition(username, result, context) {
    const dyn = this.getDynamics(username);
    
    if (result === 'win') {
      dyn.wins++;
      dyn.victories.push({
        timestamp: Date.now(),
        context,
        gloated: false
      });
    } else if (result === 'loss') {
      dyn.losses++;
      dyn.grudges.push({
        timestamp: Date.now(),
        context,
        revenge: false
      });
    } else if (result === 'tie') {
      dyn.ties++;
    }
    
    dyn.competitions.push({
      timestamp: Date.now(),
      result,
      context
    });
    
    // Keep last 50
    if (dyn.competitions.length > 50) {
      dyn.competitions = dyn.competitions.slice(-50);
    }
  }

  /**
   * Record team-up
   */
  recordTeamUp(username, against, result) {
    const dyn = this.getDynamics(username);
    
    dyn.teamUps++;
    dyn.competitions.push({
      timestamp: Date.now(),
      type: 'teamup',
      against,
      result
    });
  }

  /**
   * Get rivalry context for AI
   */
  getRivalryContext(username) {
    const dyn = this.getDynamics(username);
    
    if (dyn.wins + dyn.losses === 0) return '';
    
    const winRate = dyn.wins / (dyn.wins + dyn.losses);
    
    let context = `\n[RIVALRY] Score with ${username}: ${dyn.wins}W-${dyn.losses}L`;
    
    if (winRate > 0.6) {
      context += ` (you're winning - can afford to be cocky)`;
    } else if (winRate < 0.4) {
      context += ` (they're winning - playful revenge motivation)`;
    }
    
    // Recent grudges
    const recentGrudges = dyn.grudges.filter(g => 
      Date.now() - g.timestamp < 86400000 && !g.revenge
    );
    
    if (recentGrudges.length > 0) {
      context += `\nRecent loss: "${recentGrudges[0].context}" - opportunity for playful revenge`;
    }
    
    return context;
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        dynamics: Array.from(this.userDynamics.entries())
      };
      
      const filePath = path.join(__dirname, '../../data/competitive_dynamics.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Dynamics] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/competitive_dynamics.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.userDynamics = new Map(data.dynamics || []);
      
      console.log(`✅ [Dynamics] Loaded ${this.userDynamics.size} user dynamics`);
    } catch (error) {
      console.error('❌ [Dynamics] Load error:', error.message);
    }
  }
}

/**
 * 14. RECOMMENDATION QUALITY LEARNING
 * Track video/content recommendations and reactions
 */
class RecommendationQualityLearning {
  constructor(chatBot) {
    this.bot = chatBot;
    this.userPreferences = new Map(); // username -> preference data
    this.recommendationHistory = new Map(); // recommendationId -> outcome
    
    console.log('📺 [Recommendations] Recommendation quality learning initialized');
  }

  /**
   * Get user preferences
   */
  getPreferences(username) {
    if (!this.userPreferences.has(username)) {
      this.userPreferences.set(username, {
        likedGenres: new Map(), // genre -> score
        dislikedGenres: new Map(),
        likedVideos: [],
        dislikedVideos: [],
        recommendations: []
      });
    }
    
    return this.userPreferences.get(username);
  }

  /**
   * Record recommendation
   */
  recordRecommendation(username, video, confidence = 0.5) {
    const prefs = this.getPreferences(username);
    const recId = `${username}_${Date.now()}`;
    
    const rec = {
      id: recId,
      video,
      timestamp: Date.now(),
      confidence,
      outcome: 'pending'
    };
    
    prefs.recommendations.push(rec);
    this.recommendationHistory.set(recId, rec);
    
    return recId;
  }

  /**
   * Record recommendation outcome
   */
  recordOutcome(recId, outcome, feedback = null) {
    const rec = this.recommendationHistory.get(recId);
    if (!rec) return;
    
    rec.outcome = outcome; // 'liked', 'disliked', 'ignored'
    rec.feedback = feedback;
    
    // Update preferences based on outcome
    if (outcome === 'liked') {
      this.updatePreferences(rec.video, 1);
    } else if (outcome === 'disliked') {
      this.updatePreferences(rec.video, -1);
    }
  }

  /**
   * Update user preferences
   */
  updatePreferences(video, score) {
    // Would analyze video properties and update genre preferences
    // Simplified version
    if (video.genre) {
      const username = video.recommendedTo;
      const prefs = this.getPreferences(username);
      
      if (score > 0) {
        prefs.likedGenres.set(
          video.genre,
          (prefs.likedGenres.get(video.genre) || 0) + score
        );
      } else {
        prefs.dislikedGenres.set(
          video.genre,
          (prefs.dislikedGenres.get(video.genre) || 0) + Math.abs(score)
        );
      }
    }
  }

  /**
   * Get recommendation confidence
   */
  getConfidence(username, video) {
    const prefs = this.getPreferences(username);
    
    if (!video.genre) return 0.5;
    
    const liked = prefs.likedGenres.get(video.genre) || 0;
    const disliked = prefs.dislikedGenres.get(video.genre) || 0;
    
    // Calculate confidence based on past reactions
    if (liked + disliked === 0) return 0.5;
    
    return liked / (liked + disliked);
  }

  /**
   * Should apologize for bad recommendation?
   */
  shouldApologize(username) {
    const prefs = this.getPreferences(username);
    
    // Check last 3 recommendations
    const recent = prefs.recommendations.slice(-3);
    const badRecs = recent.filter(r => r.outcome === 'disliked').length;
    
    return badRecs >= 2; // Apologize after 2+ bad recs in a row
  }

  /**
   * Get apology message
   */
  getApologyMessage() {
    const messages = [
      'mb that was a bad rec',
      'okay that one sucked sorry',
      'yeah idk why i thought youd like that',
      'my bad on that recommendation'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        preferences: Array.from(this.userPreferences.entries()).map(([user, prefs]) => [
          user,
          {
            ...prefs,
            likedGenres: Array.from(prefs.likedGenres.entries()),
            dislikedGenres: Array.from(prefs.dislikedGenres.entries())
          }
        ]),
        history: Array.from(this.recommendationHistory.entries())
      };
      
      const filePath = path.join(__dirname, '../../data/recommendation_learning.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Recommendations] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/recommendation_learning.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.userPreferences = new Map(
        (data.preferences || []).map(([user, prefs]) => [
          user,
          {
            ...prefs,
            likedGenres: new Map(prefs.likedGenres),
            dislikedGenres: new Map(prefs.dislikedGenres)
          }
        ])
      );
      
      this.recommendationHistory = new Map(data.history || []);
      
      console.log(`✅ [Recommendations] Loaded ${this.userPreferences.size} user preferences`);
    } catch (error) {
      console.error('❌ [Recommendations] Load error:', error.message);
    }
  }
}

/**
 * 15. SEASONAL/TEMPORAL PERSONALITY SHIFTS
 * Holiday moods, seasonal patterns, year-over-year drift
 */
class SeasonalTemporalShifts {
  constructor(chatBot) {
    this.bot = chatBot;
    this.personalityDrift = 0; // Accumulates over time
    this.seasonalMoodModifier = 0;
    
    console.log('🌍 [Seasonal] Seasonal/temporal personality shifts initialized');
  }

  /**
   * Get current season
   */
  getSeason() {
    const month = new Date().getMonth();
    
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Get seasonal mood modifier
   */
  getSeasonalMood() {
    const season = this.getSeason();
    const month = new Date().getMonth();
    
    const moods = {
      spring: { energy: 0.7, positivity: 0.6, description: 'renewed energy' },
      summer: { energy: 0.9, positivity: 0.8, description: 'high energy, good vibes' },
      fall: { energy: 0.5, positivity: 0.5, description: 'contemplative, cozy' },
      winter: { energy: 0.4, positivity: 0.4, description: 'low energy, seasonal depression' }
    };
    
    // Holiday modifiers
    if (month === 11) { // December
      return { energy: 0.3, positivity: 0.3, description: 'christmas cynicism' };
    }
    
    if (month === 0) { // January
      return { energy: 0.3, positivity: 0.4, description: 'new year malaise' };
    }
    
    return moods[season];
  }

  /**
   * Get temporal context for AI
   */
  getTemporalContext() {
    const mood = this.getSeasonalMood();
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    let context = `\n[SEASONAL MOOD] ${mood.description}`;
    context += `\nEnergy: ${(mood.energy * 100).toFixed(0)}%, Positivity: ${(mood.positivity * 100).toFixed(0)}%`;
    
    // Time of day modifier
    if (hour >= 0 && hour < 6) {
      context += `\nLate night: introspective, vulnerable, honest`;
    } else if (hour >= 6 && hour < 12) {
      context += `\nMorning: groggy, not fully awake yet`;
    } else if (hour >= 12 && hour < 18) {
      context += `\nAfternoon: peak energy`;
    } else {
      context += `\nEvening: winding down, more relaxed`;
    }
    
    // Day of week modifier
    if (day === 1) { // Monday
      context += `\nMonday: lower enthusiasm, mild dread`;
    } else if (day === 5 || day === 6) { // Friday/Saturday
      context += `\nWeekend vibes: more energetic and free`;
    }
    
    return context;
  }

  /**
   * Check for anniversary reactions
   */
  checkAnniversaries(events) {
    const now = new Date();
    const today = `${now.getMonth()}-${now.getDate()}`;
    
    const anniversaries = events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const eventDay = `${eventDate.getMonth()}-${eventDate.getDate()}`;
      return eventDay === today;
    });
    
    return anniversaries;
  }

  /**
   * Apply year-over-year personality drift
   */
  applyDrift() {
    // Small random drift over time (personality slowly evolves)
    this.personalityDrift += (Math.random() - 0.5) * 0.001;
    
    // Drift affects base personality traits slightly
    return {
      humorDrift: this.personalityDrift * 0.1,
      edginessDrift: this.personalityDrift * 0.15,
      formalityDrift: -this.personalityDrift * 0.1
    };
  }

  /**
   * Save state
   */
  save() {
    try {
      const data = {
        personalityDrift: this.personalityDrift,
        lastSaved: Date.now()
      };
      
      const filePath = path.join(__dirname, '../../data/seasonal_shifts.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [Seasonal] Save error:', error.message);
    }
  }

  /**
   * Load state
   */
  load() {
    try {
      const filePath = path.join(__dirname, '../../data/seasonal_shifts.json');
      if (!fs.existsSync(filePath)) return;
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.personalityDrift = data.personalityDrift || 0;
      
      console.log(`✅ [Seasonal] Loaded personality drift: ${this.personalityDrift.toFixed(4)}`);
    } catch (error) {
      console.error('❌ [Seasonal] Load error:', error.message);
    }
  }
}

module.exports = {
  VulnerabilityThresholds,
  ContextWindowLimitations,
  CompetitiveCooperativeDynamics,
  RecommendationQualityLearning,
  SeasonalTemporalShifts
};
