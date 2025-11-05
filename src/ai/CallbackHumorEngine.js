const fs = require('fs').promises;
const path = require('path');

/**
 * Callback Humor Engine
 * Remembers funny moments and brings them back as callbacks
 */
class CallbackHumorEngine {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.aiEngine = chatBot.ai; // Reference to AI engine
    
    // Memorable moments storage
    this.memorableMoments = []; // Array of funny/notable moments
    this.runningGags = new Map(); // topic -> gag data
    this.callbacks = []; // Successful callbacks made
    
    // Configuration
    this.maxMoments = 100;
    this.callbackChance = 0.02; // 2% chance to reference old moment (REDUCED from 10%)
    this.minTimeBetweenCallbacks = 15 * 60 * 1000; // 15 minutes (INCREASED from 5)
    this.lastCallback = 0;
    
    this.dataPath = path.join(__dirname, '../../data/callback_humor.json');
    this.load();
  }

  /**
   * Detect if message is a memorable moment
   */
  async analyzeForMemorableMoment(username, message, context = {}) {
    // Check for indicators of funny/memorable moments
    const indicators = {
      laughter: /lol|lmao|😂|💀|haha|rofl/i,
      reactions: /omg|wtf|bruh|holy shit|no way|damn/i,
      absurdity: /quack|parkour degree|mixology training/i,
      controversy: /toxic|cancelled|exposed/i
    };

    const hasIndicator = Object.values(indicators).some(regex => regex.test(message));
    
    if (!hasIndicator && Math.random() > 0.05) return; // Low chance if no indicators

    // Use AI to determine if memorable
    const recentContext = context.recentMessages?.slice(-5).map(m => 
      `${m.username}: ${m.message}`
    ).join('\n') || '';

    const prompt = `Analyze if this chat moment is funny or memorable enough to reference later:

Recent chat:
${recentContext}
${username}: ${message}

Is this moment:
1. Funny or absurd?
2. Something that could become a running joke?
3. A roast or comeback?
4. An embarrassing slip-up?
5. An unexpected reaction?

Answer with just: MEMORABLE or FORGETTABLE`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.4,
        max_tokens: 10
      });

      if (response.trim().toUpperCase().includes('MEMORABLE')) {
        await this.saveMoment(username, message, context);
      }
    } catch (error) {
      console.error('Failed to analyze memorable moment:', error);
    }
  }

  /**
   * Save a memorable moment
   */
  async saveMoment(username, message, context = {}) {
    // Generate a summary/tag for this moment
    const prompt = `Summarize this funny chat moment in 3-5 words:

${username}: ${message}

Summary:`;

    try {
      const summary = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.5,
        max_tokens: 15
      });

      const moment = {
        id: `moment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username,
        message,
        summary: summary.trim().replace(/^["']|["']$/g, ''),
        timestamp: Date.now(),
        context: context.recentMessages?.slice(-3) || [],
        callbackCount: 0,
        lastCallback: 0
      };

      this.memorableMoments.push(moment);

      // Keep only recent moments
      if (this.memorableMoments.length > this.maxMoments) {
        this.memorableMoments.shift();
      }

      // Check if this could be a running gag
      await this.checkForRunningGag(moment);

      console.log(`😂 [Callback] Saved moment: "${summary.trim()}" from ${username}`);
      this.save();
      
      return moment;
    } catch (error) {
      console.error('Failed to save memorable moment:', error);
      return null;
    }
  }

  /**
   * Check if moment should become a running gag
   */
  async checkForRunningGag(moment) {
    // Look for similar past moments
    const similarMoments = this.memorableMoments.filter(m => 
      m.summary.toLowerCase().includes(moment.summary.toLowerCase()) ||
      this.calculateSimilarity(m.message, moment.message) > 0.6
    );

    if (similarMoments.length >= 2) {
      // This topic keeps coming up - make it a running gag
      const gagId = moment.summary.toLowerCase().replace(/\s+/g, '_');
      
      if (!this.runningGags.has(gagId)) {
        this.runningGags.set(gagId, {
          id: gagId,
          topic: moment.summary,
          moments: similarMoments.map(m => m.id),
          created: Date.now(),
          references: 0,
          escalation: 1.0 // Humor escalation factor
        });

        console.log(`🎭 [Callback] New running gag: "${moment.summary}"`);
      } else {
        // Add to existing gag
        const gag = this.runningGags.get(gagId);
        gag.moments.push(moment.id);
        gag.escalation = Math.min(3.0, gag.escalation + 0.2);
      }
    }
  }

  /**
   * Get a callback to reference
   */
  async getCallback(currentContext = {}) {
    const now = Date.now();
    
    // Check timing
    if (now - this.lastCallback < this.minTimeBetweenCallbacks) return null;
    if (Math.random() > this.callbackChance) return null;
    if (this.memorableMoments.length === 0) return null;

    // Prefer running gags, then recent memorable moments
    let callback = null;

    // 60% chance to reference running gag if available
    if (this.runningGags.size > 0 && Math.random() < 0.6) {
      callback = await this.generateRunningGagCallback(currentContext);
    }

    // Fallback to memorable moment
    if (!callback) {
      callback = await this.generateMomentCallback(currentContext);
    }

    if (callback) {
      this.lastCallback = now;
      this.callbacks.push({
        text: callback.text,
        momentId: callback.momentId,
        timestamp: now
      });

      // Keep only recent callbacks
      if (this.callbacks.length > 50) {
        this.callbacks.shift();
      }

      this.save();
    }

    return callback;
  }

  /**
   * Generate callback to a running gag
   */
  async generateRunningGagCallback(context) {
    const gags = Array.from(this.runningGags.values());
    const gag = gags[Math.floor(Math.random() * gags.length)];

    // Get moments for this gag
    const gagMoments = this.memorableMoments.filter(m => gag.moments.includes(m.id));
    if (gagMoments.length === 0) return null;

    const exampleMoments = gagMoments.slice(-3).map(m => 
      `${m.username}: ${m.message}`
    ).join('\n');

    const prompt = `You're Slunt. There's a running joke about "${gag.topic}" in the chat.

Previous funny moments:
${exampleMoments}

Current situation: ${context.situation || 'casual chat'}

Generate a brief, funny callback reference to this running gag. Be natural and casual. Don't use quotes.
Callback:`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.85,
        max_tokens: 50
      });

      gag.references++;
      
      return {
        text: response.trim(),
        type: 'running_gag',
        topic: gag.topic,
        momentId: gag.id,
        escalation: gag.escalation
      };
    } catch (error) {
      console.error('Failed to generate running gag callback:', error);
      return null;
    }
  }

  /**
   * Generate callback to a memorable moment
   */
  async generateMomentCallback(context) {
    // Pick a recent moment (bias toward recent but not too recent)
    const eligibleMoments = this.memorableMoments.filter(m => {
      const age = Date.now() - m.timestamp;
      return age > 10 * 60 * 1000 && age < 48 * 60 * 60 * 1000; // 10 min to 48 hours old
    });

    if (eligibleMoments.length === 0) return null;

    // Weight by how long ago it was (older = more surprising callback)
    const weights = eligibleMoments.map(m => {
      const age = Date.now() - m.timestamp;
      const hours = age / (60 * 60 * 1000);
      return Math.min(10, hours / 2); // More weight for older moments
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    let selectedMoment = eligibleMoments[0];
    for (let i = 0; i < eligibleMoments.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedMoment = eligibleMoments[i];
        break;
      }
    }

    const timeAgo = this.getRelativeTime(selectedMoment.timestamp);

    const prompt = `You're Slunt. You're randomly remembering something funny from ${timeAgo}.

The moment: ${selectedMoment.username} said "${selectedMoment.message}"

Generate a natural, casual callback to this moment. Make it feel like you just remembered it. Be brief. Don't use quotes.
Reference:`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.85,
        max_tokens: 50
      });

      selectedMoment.callbackCount++;
      selectedMoment.lastCallback = Date.now();

      return {
        text: response.trim(),
        type: 'moment_callback',
        momentId: selectedMoment.id,
        timeAgo
      };
    } catch (error) {
      console.error('Failed to generate moment callback:', error);
      return null;
    }
  }

  /**
   * Calculate similarity between two strings (simple)
   */
  calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Get relative time string
   */
  getRelativeTime(timestamp) {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  /**
   * Get status for dashboard
   */
  getStatus() {
    return {
      memorableMoments: this.memorableMoments.length,
      runningGags: this.runningGags.size,
      totalCallbacks: this.callbacks.length,
      recentMoments: this.memorableMoments.slice(-5).map(m => ({
        summary: m.summary,
        username: m.username,
        age: this.getRelativeTime(m.timestamp),
        callbackCount: m.callbackCount
      })),
      activeGags: Array.from(this.runningGags.values()).map(g => ({
        topic: g.topic,
        references: g.references,
        escalation: g.escalation
      }))
    };
  }

  /**
   * Save to disk
   */
  async save() {
    try {
      const data = {
        memorableMoments: this.memorableMoments.slice(-this.maxMoments),
        runningGags: Array.from(this.runningGags.entries()),
        callbacks: this.callbacks.slice(-50)
      };
      
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save callback humor:', error);
    }
  }

  /**
   * Load from disk
   */
  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.memorableMoments = parsed.memorableMoments || [];
      this.runningGags = new Map(parsed.runningGags || []);
      this.callbacks = parsed.callbacks || [];
      
      console.log(`😂 [Callback] Loaded ${this.memorableMoments.length} moments and ${this.runningGags.size} running gags`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load callback humor:', error);
      }
    }
  }
}

module.exports = CallbackHumorEngine;
