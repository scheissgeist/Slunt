const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');

/**
 * SluntMetaSupervisor - The Meta-AI "Girlfriend Protocol"
 *
 * Watches Slunt's conversations in real-time, detects errors, learns patterns,
 * and actively improves his personality, responses, and behaviors.
 *
 * Think of it as an AI supervisor that helps Slunt grow and evolve by:
 * - Detecting bad responses immediately
 * - Analyzing conversation quality every 6 hours
 * - Auto-adjusting personality parameters
 * - Learning from user reactions
 * - Actually making Slunt smarter over time
 */
class SluntMetaSupervisor {
  constructor() {
    this.enabled = false;
    this.claude = null;
    this.model = 'claude-3-5-haiku-20241022';

    // Real-time monitoring
    this.errorLog = [];
    this.conversationBuffer = [];
    this.maxBufferSize = 100;

    // Deep analysis schedule
    this.analysisInterval = 6 * 60 * 60 * 1000; // 6 hours
    this.lastAnalysisTime = Date.now();
    this.analysisTimer = null;

    // Learning data
    this.dataDir = path.join(__dirname, '../../data/meta_learning');
    this.errorPatternsFile = path.join(this.dataDir, 'error_patterns.json');
    this.improvementsFile = path.join(this.dataDir, 'improvements.json');
    this.performanceFile = path.join(this.dataDir, 'performance_history.json');

    // Error detection patterns
    this.errorPatterns = {
      quoteWrapping: /^["'].*["']$/,
      trailingFiller: /\b(whatever|anyway|i guess|or something|you know)\s*\.?\s*$/i,
      tooShort: /^(yeah|huh|ok|lol|lmao|nah|yep|nope)\.?$/i,
      repetitive: null, // Detected by comparing to recent responses
      userNegativeFeedback: /\b(shut up|stfu|dumb|stupid|idiot|boring|lame|cringe)\b/i,
      userCorrection: /\b(no|actually|wrong|nope|that's not|incorrect)\b/i,
    };

    // Performance tracking
    this.stats = {
      totalResponses: 0,
      errorsDetected: 0,
      userPositiveReactions: 0,
      userNegativeReactions: 0,
      improvementsApplied: 0,
      averageResponseQuality: 0,
    };

    this.initialize();
  }

  async initialize() {
    try {
      // Initialize Claude for deep analysis
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey || apiKey === 'your-anthropic-api-key-here' || apiKey.length < 10) {
        console.log('⚠️  SluntMetaSupervisor: No Claude API key - running in passive mode (logging only)');
        this.enabled = false;
        return;
      }

      this.claude = new Anthropic({ apiKey });
      this.enabled = true;

      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });

      // Load existing learning data
      await this.loadLearningData();

      // Start deep analysis timer
      this.startDeepAnalysisTimer();

      console.log('🧠 SluntMetaSupervisor: ACTIVE - Watching and learning');
      console.log(`   📊 Stats: ${this.stats.totalResponses} responses, ${this.stats.errorsDetected} errors detected`);
      console.log(`   ⏰ Next deep analysis: ${new Date(this.lastAnalysisTime + this.analysisInterval).toLocaleTimeString()}`);
    } catch (error) {
      console.error('❌ SluntMetaSupervisor initialization failed:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Real-time monitoring - called after every Slunt response
   * Detects errors immediately and applies quick fixes
   */
  async analyzeResponse(context) {
    this.stats.totalResponses++;

    const {
      userMessage,
      sluntResponse,
      userName,
      userReaction = null, // Next user message (used to detect negative feedback)
      conversationHistory = [],
      emotionalState = null,
      voiceMode = false
    } = context;

    // Add to conversation buffer
    this.conversationBuffer.push({
      user: userName,
      userMessage,
      sluntResponse,
      userReaction,
      timestamp: Date.now(),
      voiceMode,
      emotionalState
    });

    // Keep buffer size manageable
    if (this.conversationBuffer.length > this.maxBufferSize) {
      this.conversationBuffer.shift();
    }

    // Detect errors in real-time
    const errors = this.detectErrors(sluntResponse, userReaction, conversationHistory);

    if (errors.length > 0) {
      this.stats.errorsDetected++;

      // Log error with context
      const errorEntry = {
        timestamp: Date.now(),
        user: userName,
        userMessage,
        sluntResponse,
        userReaction,
        errors,
        emotionalState,
        voiceMode
      };

      this.errorLog.push(errorEntry);

      // Quick fix if possible
      if (this.enabled) {
        await this.applyQuickFix(errorEntry);
      }

      console.log(`⚠️  Meta-AI detected errors in Slunt's response: ${errors.join(', ')}`);
    }

    // Track user sentiment
    if (userReaction) {
      if (this.detectPositiveFeedback(userReaction)) {
        this.stats.userPositiveReactions++;
      } else if (this.detectNegativeFeedback(userReaction)) {
        this.stats.userNegativeReactions++;
      }
    }

    // Calculate quality score
    const qualityScore = this.calculateResponseQuality(sluntResponse, errors, userReaction);
    this.stats.averageResponseQuality =
      (this.stats.averageResponseQuality * (this.stats.totalResponses - 1) + qualityScore) /
      this.stats.totalResponses;

    // Save stats periodically
    if (this.stats.totalResponses % 50 === 0) {
      await this.savePerformanceHistory();
    }
  }

  /**
   * Real-time error detection
   * Returns array of error types found
   */
  detectErrors(response, userReaction, conversationHistory) {
    const errors = [];

    // Check for quote wrapping
    if (this.errorPatterns.quoteWrapping.test(response.trim())) {
      errors.push('quote_wrapping');
    }

    // Check for trailing filler words
    if (this.errorPatterns.trailingFiller.test(response)) {
      errors.push('trailing_filler');
    }

    // Check for one-word responses
    if (this.errorPatterns.tooShort.test(response.trim())) {
      errors.push('too_short');
    }

    // Check for repetitive responses
    if (conversationHistory && conversationHistory.length > 0) {
      const recentResponses = conversationHistory
        .slice(-5)
        .filter(msg => msg.role === 'assistant')
        .map(msg => msg.content.toLowerCase());

      if (recentResponses.includes(response.toLowerCase())) {
        errors.push('repetitive');
      }
    }

    // Check for user negative feedback in reaction
    if (userReaction && this.errorPatterns.userNegativeFeedback.test(userReaction)) {
      errors.push('user_negative_feedback');
    }

    // Check for user corrections
    if (userReaction && this.errorPatterns.userCorrection.test(userReaction)) {
      errors.push('user_correction');
    }

    return errors;
  }

  detectPositiveFeedback(message) {
    const positivePatterns = /\b(lol|haha|lmao|good|nice|great|awesome|love|thanks|cool|interesting)\b/i;
    return positivePatterns.test(message);
  }

  detectNegativeFeedback(message) {
    return this.errorPatterns.userNegativeFeedback.test(message);
  }

  calculateResponseQuality(response, errors, userReaction) {
    let score = 100;

    // Deduct for errors
    score -= errors.length * 15;

    // Deduct for negative feedback
    if (userReaction && this.detectNegativeFeedback(userReaction)) {
      score -= 25;
    }

    // Bonus for positive feedback
    if (userReaction && this.detectPositiveFeedback(userReaction)) {
      score += 10;
    }

    // Deduct for very short responses
    if (response.split(' ').length < 3) {
      score -= 10;
    }

    // Bonus for natural length (5-30 words)
    const wordCount = response.split(' ').length;
    if (wordCount >= 5 && wordCount <= 30) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Quick fixes for common errors
   * Applied immediately without deep analysis
   */
  async applyQuickFix(errorEntry) {
    const { errors, sluntResponse } = errorEntry;

    // For now, just log the quick fix opportunity
    // In future, could inject corrections into ResponseValidator or aiEngine
    console.log(`🔧 Meta-AI quick fix opportunity: ${errors.join(', ')}`);

    // Save error pattern for deep analysis
    await this.saveErrorPattern(errorEntry);
  }

  /**
   * Deep analysis using Claude
   * Runs every 6 hours to review performance and apply improvements
   */
  async runDeepAnalysis() {
    if (!this.enabled) {
      console.log('⚠️  Meta-AI deep analysis skipped - Claude not available');
      return;
    }

    console.log('🧠 Meta-AI starting deep analysis...');
    this.lastAnalysisTime = Date.now();

    try {
      // Prepare analysis data
      const recentConversations = this.conversationBuffer.slice(-50);
      const recentErrors = this.errorLog.slice(-20);

      // Build analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(recentConversations, recentErrors);

      // Call Claude for deep analysis
      const response = await this.claude.messages.create({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.3, // Lower temperature for analytical thinking
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
      });

      const analysisResult = JSON.parse(response.content[0].text);

      // Apply improvements
      await this.applyImprovements(analysisResult);

      console.log('✅ Meta-AI deep analysis complete');
      console.log(`   📊 Detected ${analysisResult.errorPatterns.length} error patterns`);
      console.log(`   🔧 Applied ${analysisResult.specificFixes.length} specific fixes`);
      console.log(`   🎭 Personality adjustments: ${Object.keys(analysisResult.personalityAdjustments).length}`);

      // Save analysis results
      await this.saveImprovements(analysisResult);

    } catch (error) {
      console.error('❌ Meta-AI deep analysis failed:', error.message);
    }
  }

  buildAnalysisPrompt(conversations, errors) {
    return `You are a Meta-AI supervisor analyzing an AI chatbot named Slunt's performance.

**Slunt's Character:**
- Edgy, sarcastic, Gen-Z humor personality
- Should be funny, quick-witted, and engaging
- Talks like a real person in casual chat, not an AI assistant
- Uses voice TTS (so responses should sound natural when spoken)

**Recent Conversations (last 50):**
${JSON.stringify(conversations.slice(-50), null, 2)}

**Detected Errors (last 20):**
${JSON.stringify(errors.slice(-20), null, 2)}

**Performance Stats:**
- Total responses: ${this.stats.totalResponses}
- Errors detected: ${this.stats.errorsDetected}
- Positive reactions: ${this.stats.userPositiveReactions}
- Negative reactions: ${this.stats.userNegativeReactions}
- Average quality: ${this.stats.averageResponseQuality.toFixed(1)}/100

**Your Task:**
Analyze Slunt's performance and provide actionable improvements.

**Output Format (JSON only):**
{
  "errorPatterns": [
    {
      "pattern": "description of pattern",
      "frequency": "how often it occurs",
      "impact": "how bad it is (low/medium/high)",
      "cause": "why it's happening"
    }
  ],
  "personalityAdjustments": {
    "aggression": -0.1,  // Adjust -1.0 to 1.0 (current baseline is 0)
    "humor": 0.2,
    "verbosity": -0.15,
    "empathy": 0.1,
    // Add other personality traits as needed
  },
  "specificFixes": [
    {
      "issue": "description",
      "fix": "what to change",
      "priority": "low/medium/high"
    }
  ],
  "promptImprovements": {
    "systemPrompt": "suggested improvements to system prompt (or null)",
    "voicePrompt": "suggested improvements to voice prompt (or null)"
  },
  "overallAssessment": {
    "strengths": ["list of what's working well"],
    "weaknesses": ["list of what needs improvement"],
    "recommendedFocus": "main area to focus on improving"
  }
}

Be specific, actionable, and honest. Output ONLY valid JSON.`;
  }

  /**
   * Apply improvements from deep analysis
   */
  async applyImprovements(analysisResult) {
    const {
      errorPatterns,
      personalityAdjustments,
      specificFixes,
      promptImprovements,
      overallAssessment
    } = analysisResult;

    // Apply personality adjustments to cognitive state
    if (personalityAdjustments && Object.keys(personalityAdjustments).length > 0) {
      await this.adjustPersonality(personalityAdjustments);
    }

    // Log specific fixes for manual review
    if (specificFixes && specificFixes.length > 0) {
      console.log('\n🔧 Meta-AI Recommended Fixes:');
      specificFixes.forEach((fix, i) => {
        console.log(`   ${i + 1}. [${fix.priority.toUpperCase()}] ${fix.issue}`);
        console.log(`      → ${fix.fix}`);
      });
    }

    // Log overall assessment
    if (overallAssessment) {
      console.log('\n📊 Meta-AI Assessment:');
      console.log(`   Strengths: ${overallAssessment.strengths.join(', ')}`);
      console.log(`   Weaknesses: ${overallAssessment.weaknesses.join(', ')}`);
      console.log(`   Focus: ${overallAssessment.recommendedFocus}`);
    }

    this.stats.improvementsApplied++;
  }

  /**
   * Adjust personality parameters in cognitive state
   */
  async adjustPersonality(adjustments) {
    try {
      const cognitiveStatePath = path.join(__dirname, '../../data/cognitive_state.json');
      const cognitiveState = JSON.parse(await fs.readFile(cognitiveStatePath, 'utf-8'));

      // Apply adjustments
      for (const [trait, delta] of Object.entries(adjustments)) {
        if (!cognitiveState.personalityTraits) {
          cognitiveState.personalityTraits = {};
        }

        const currentValue = cognitiveState.personalityTraits[trait] || 0;
        const newValue = Math.max(-1, Math.min(1, currentValue + delta));

        cognitiveState.personalityTraits[trait] = newValue;

        console.log(`   🎭 Adjusted ${trait}: ${currentValue.toFixed(2)} → ${newValue.toFixed(2)} (${delta > 0 ? '+' : ''}${delta})`);
      }

      // Save updated cognitive state
      await fs.writeFile(cognitiveStatePath, JSON.stringify(cognitiveState, null, 2));

      console.log('✅ Personality adjustments applied to cognitive state');
    } catch (error) {
      console.error('❌ Failed to apply personality adjustments:', error.message);
    }
  }

  /**
   * Timer management
   */
  startDeepAnalysisTimer() {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }

    this.analysisTimer = setInterval(() => {
      this.runDeepAnalysis();
    }, this.analysisInterval);

    // Run first analysis after 1 hour
    setTimeout(() => {
      this.runDeepAnalysis();
    }, 60 * 60 * 1000);
  }

  stopDeepAnalysisTimer() {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
  }

  /**
   * Data persistence
   */
  async loadLearningData() {
    try {
      // Load error patterns
      if (await this.fileExists(this.errorPatternsFile)) {
        const data = await fs.readFile(this.errorPatternsFile, 'utf-8');
        // Error patterns loaded (could be used to improve detection)
      }

      // Load performance history
      if (await this.fileExists(this.performanceFile)) {
        const data = JSON.parse(await fs.readFile(this.performanceFile, 'utf-8'));
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats };
        }
      }
    } catch (error) {
      console.error('⚠️  Failed to load learning data:', error.message);
    }
  }

  async saveErrorPattern(errorEntry) {
    try {
      let patterns = [];
      if (await this.fileExists(this.errorPatternsFile)) {
        patterns = JSON.parse(await fs.readFile(this.errorPatternsFile, 'utf-8'));
      }

      patterns.push(errorEntry);

      // Keep only last 1000 error entries
      if (patterns.length > 1000) {
        patterns = patterns.slice(-1000);
      }

      await fs.writeFile(this.errorPatternsFile, JSON.stringify(patterns, null, 2));
    } catch (error) {
      console.error('Failed to save error pattern:', error.message);
    }
  }

  async saveImprovements(improvements) {
    try {
      let history = [];
      if (await this.fileExists(this.improvementsFile)) {
        history = JSON.parse(await fs.readFile(this.improvementsFile, 'utf-8'));
      }

      history.push({
        timestamp: Date.now(),
        improvements
      });

      await fs.writeFile(this.improvementsFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Failed to save improvements:', error.message);
    }
  }

  async savePerformanceHistory() {
    try {
      let history = [];
      if (await this.fileExists(this.performanceFile)) {
        const data = JSON.parse(await fs.readFile(this.performanceFile, 'utf-8'));
        history = data.history || [];
      }

      history.push({
        timestamp: Date.now(),
        stats: { ...this.stats }
      });

      // Keep only last 100 snapshots
      if (history.length > 100) {
        history = history.slice(-100);
      }

      await fs.writeFile(this.performanceFile, JSON.stringify({
        stats: this.stats,
        history
      }, null, 2));
    } catch (error) {
      console.error('Failed to save performance history:', error.message);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Manual triggers for testing
   */
  async forceDeepAnalysis() {
    console.log('🧠 Forcing deep analysis (manual trigger)...');
    await this.runDeepAnalysis();
  }

  getStats() {
    return {
      ...this.stats,
      enabled: this.enabled,
      conversationBufferSize: this.conversationBuffer.length,
      errorLogSize: this.errorLog.length,
      lastAnalysis: new Date(this.lastAnalysisTime).toLocaleString(),
      nextAnalysis: new Date(this.lastAnalysisTime + this.analysisInterval).toLocaleString()
    };
  }

  /**
   * Cleanup
   */
  async shutdown() {
    console.log('🛑 SluntMetaSupervisor shutting down...');
    this.stopDeepAnalysisTimer();
    await this.savePerformanceHistory();
    console.log('✅ SluntMetaSupervisor shutdown complete');
  }
}

module.exports = SluntMetaSupervisor;
