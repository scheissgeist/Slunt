/**
 * Dynamic Autism Fixations System
 * Slunt discovers and becomes obsessed with topics from conversations
 * Topics are generated via AI, can recur with escalating intensity
 * NO HARDCODED TOPICS - everything is learned organically
 */

const fs = require('fs').promises;
const path = require('path');

class AutismFixations {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Topic pool - dynamically discovered from conversations
    this.discoveredTopics = []; // { topic, triggers[], knowledge[], firstSeen, timesActivated }
    
    // Complete history of ALL fixations with intensity tracking
    this.topicHistory = new Map(); // topic -> { timesActivated, totalDumps, lastActivated, currentIntensity, peakIntensity }
    
    // Current active fixation
    this.currentFixation = null;
    this.fixationIntensity = 1.0; // Starts at 1.0, increases on recurrence
    this.isActive = false;
    this.activatedAt = null;
    this.duration = 0;
    
    // Infodump state
    this.isInfodumping = false;
    this.infodumpQueue = [];
    this.infodumpsSent = 0;
    
    // Topic discovery from conversations
    this.recentMentions = new Map(); // topic -> count in last hour
    this.discoveryThreshold = 3; // mentions needed to discover new topic
    
    // Stats
    this.stats = {
      totalActivations: 0,
      totalInfodumps: 0,
      topicsDiscovered: 0,
      dumpsByTopic: {}
    };
    
    // Persistence
    this.savePath = './data/autism_fixations.json';
    this.loadHistory();
    
    // Setup periodic rotation (every 3-6 hours)
    this.setupRotation();
  }

  /**
   * Load fixation history from disk
   */
  async loadHistory() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Restore discovered topics
      this.discoveredTopics = parsed.discoveredTopics || [];
      
      // Restore history Map
      if (parsed.topicHistory) {
        this.topicHistory = new Map(parsed.topicHistory);
      }
      
      // Restore stats
      this.stats = parsed.stats || this.stats;
      
      console.log(`🤓 [Autism] Loaded ${this.discoveredTopics.length} discovered topics, ${this.topicHistory.size} historical fixations`);
      
      // Pick initial favorite if we have topics
      if (this.discoveredTopics.length > 0) {
        this.rotateFavorite();
      } else {
        // Add seed topics if none exist
        this.addSeedTopics();
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('🤓 [Autism] Error loading:', error.message);
      } else {
        // File doesn't exist, add seed topics
        this.addSeedTopics();
      }
    }
  }

  /**
   * Add seed topics for first time startup
   */
  async addSeedTopics() {
    console.log('🤓 [Autism] Adding seed topics for first time...');
    
    const seedTopics = [
      {
        topic: 'mechanical keyboards',
        triggers: ['keyboard', 'switches', 'keycaps', 'typing', 'mechanical'],
        knowledge: [
          'Cherry MX Blues are overrated, Gaterons feel smoother',
          'The sound profile depends on the case material more than the switches',
          'Lubing switches makes a HUGE difference',
          'GMK keycaps are expensive but the quality is unmatched',
          'Hotswap boards are perfect for experimenting',
          'The thock sound is mostly about the plate and foam mods',
          'Linear switches are superior for gaming, tactile for typing',
          'Budget boards have gotten so good, no need to spend $300+'
        ],
        firstSeen: Date.now(),
        timesActivated: 0
      },
      {
        topic: 'coffee brewing methods',
        triggers: ['coffee', 'espresso', 'brewing', 'beans', 'grind'],
        knowledge: [
          'Water temperature matters more than most people think',
          'The grind size is CRITICAL for extraction',
          'Pre-ground coffee loses flavor within minutes',
          'Pour-over gives you way more control than drip',
          'French press needs a coarse grind or it gets muddy',
          'Aeropress is underrated for how versatile it is',
          'Single origin beans are overpriced tbh',
          'Burr grinders are essential, blade grinders are trash'
        ],
        firstSeen: Date.now(),
        timesActivated: 0
      },
      {
        topic: 'vintage synthesizers',
        triggers: ['synth', 'synthesizer', 'analog', 'vintage', 'music'],
        knowledge: [
          'Analog warmth is real, not just placebo',
          'The Juno-106 sound is iconic but they all need repairs',
          'Software can get close but it\'s not the same',
          'Modular synthesis is expensive but worth it',
          'The filter is the most important part of the sound',
          'Yamaha DX7 is underrated for how influential it was',
          'MIDI was revolutionary for music production',
          'Vintage gear holds value better than most tech'
        ],
        firstSeen: Date.now(),
        timesActivated: 0
      }
    ];
    
    this.discoveredTopics = seedTopics;
    this.stats.topicsDiscovered = seedTopics.length;
    
    await this.saveHistory();
    
    // Pick one to start with
    this.rotateFavorite();
    
    console.log(`🤓 [Autism] Added ${seedTopics.length} seed topics`);
  }

  /**
   * Save fixation history to disk
   */
  async saveHistory() {
    try {
      const dir = path.dirname(this.savePath);
      await fs.mkdir(dir, { recursive: true });

      const data = {
        discoveredTopics: this.discoveredTopics,
        topicHistory: Array.from(this.topicHistory.entries()),
        stats: this.stats,
        savedAt: Date.now()
      };

      await fs.writeFile(this.savePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('🤓 [Autism] Error saving:', error.message);
    }
  }

  /**
   * Analyze conversation to discover potential fixation topics
   * This is called by chatBot after receiving messages
   */
  async analyzeForTopics(message, username) {
    if (!message || message.length < 10) return;

    // Skip bot's own messages
    if (username === 'Slunt') return;

    try {
      // Use AI to extract potential topics from the message
      const prompt = `Extract 1-3 specific topics, interests, or subjects from this message. Return ONLY a JSON array of topic strings, no explanation.

Message: "${message}"

Examples of good topics:
- "mechanical keyboards"
- "vintage watches"  
- "retro gaming"
- "coffee brewing"
- "fountain pens"

Return format: ["topic1", "topic2"]`;

      const aiResponse = await this.chatBot.getAIResponse(prompt, [], 'You extract topics from text.');
      
      // Parse AI response
      let topics = [];
      try {
        // Try to extract JSON array from response
        const match = aiResponse.match(/\[.*\]/s);
        if (match) {
          topics = JSON.parse(match[0]);
        }
      } catch (e) {
        // If parsing fails, skip
        return;
      }

      // Track mentions
      const now = Date.now();
      for (const topic of topics) {
        if (!topic || typeof topic !== 'string') continue;
        
        const lowerTopic = topic.toLowerCase().trim();
        if (lowerTopic.length < 3) continue;

        // Track mention
        const mentions = this.recentMentions.get(lowerTopic) || { count: 0, lastSeen: now };
        mentions.count++;
        mentions.lastSeen = now;
        this.recentMentions.set(lowerTopic, mentions);

        // Check if we should discover this topic
        if (mentions.count >= this.discoveryThreshold) {
          await this.discoverTopic(lowerTopic);
          this.recentMentions.delete(lowerTopic); // Reset after discovery
        }
      }

      // Clean old mentions (older than 1 hour)
      for (const [topic, data] of this.recentMentions.entries()) {
        if (now - data.lastSeen > 60 * 60 * 1000) {
          this.recentMentions.delete(topic);
        }
      }
    } catch (error) {
      // Silently fail - topic discovery is non-critical
    }
  }

  /**
   * Discover a new fixation topic using AI
   */
  async discoverTopic(topicName) {
    // Check if already discovered
    if (this.discoveredTopics.find(t => t.topic.toLowerCase() === topicName.toLowerCase())) {
      return;
    }

    console.log(`🤓 [Autism] 🆕 DISCOVERING NEW TOPIC: ${topicName}`);

    try {
      // Use AI to generate triggers and initial knowledge
      const prompt = `Generate autism-level deep knowledge about "${topicName}". 

Create:
1. 3-5 trigger words that relate to this topic
2. 8-10 specific, opinionated facts/observations about ${topicName}

Format as JSON:
{
  "triggers": ["word1", "word2", "word3"],
  "knowledge": ["fact 1", "fact 2", ...]
}

Make the facts passionate, detailed, and slightly obsessive. Include opinions, technical details, and niche knowledge.`;

      const aiResponse = await this.chatBot.getAIResponse(prompt, [], 'You are an expert who gets really into niche topics.');
      
      // Parse response
      const match = aiResponse.match(/\{[\s\S]*\}/);
      if (!match) return;

      const data = JSON.parse(match[0]);
      
      // Create new topic
      const newTopic = {
        topic: topicName,
        triggers: data.triggers || [],
        knowledge: data.knowledge || [],
        firstSeen: Date.now(),
        timesActivated: 0
      };

      this.discoveredTopics.push(newTopic);
      this.stats.topicsDiscovered++;
      
      console.log(`🤓 [Autism] ✅ Discovered "${topicName}" with ${newTopic.knowledge.length} knowledge points`);
      
      await this.saveHistory();
    } catch (error) {
      console.error(`🤓 [Autism] Failed to discover topic "${topicName}":`, error.message);
    }
  }

  /**
   * Setup periodic rotation of favorite fixation
   */
  setupRotation() {
    setInterval(() => {
      if (this.discoveredTopics.length > 0) {
        this.rotateFavorite();
      }
    }, (3 + Math.random() * 3) * 60 * 60 * 1000); // 3-6 hours
  }

  /**
   * Rotate to a new (or recurring) favorite fixation
   * Now ALLOWS returning to previous topics with increased intensity!
   */
  rotateFavorite() {
    if (this.discoveredTopics.length === 0) return;

    const oldTopic = this.currentFixation?.topic;

    // Weighted selection based on history
    // Topics that haven't been active recently are more likely
    // But topics with high past intensity can recur with EVEN MORE intensity
    let weights = this.discoveredTopics.map(topic => {
      const history = this.topicHistory.get(topic.topic) || { 
        timesActivated: 0, 
        totalDumps: 0, 
        lastActivated: 0,
        currentIntensity: 1.0,
        peakIntensity: 1.0
      };

      const timeSinceActive = Date.now() - (history.lastActivated || 0);
      const hoursSince = timeSinceActive / (1000 * 60 * 60);

      // Base weight
      let weight = 1.0;

      // Prefer topics not recently active
      if (hoursSince > 24) weight *= 2.0;
      if (hoursSince > 72) weight *= 1.5;

      // 20% chance to RETURN to a previous favorite with increased intensity
      if (history.timesActivated > 0 && Math.random() < 0.2) {
        weight *= 3.0; // Much more likely to recur
        console.log(`🤓 [Autism] 🔄 High chance of returning to "${topic.topic}" (activated ${history.timesActivated} times before)`);
      }

      return weight;
    });

    // Weighted random selection
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    this.currentFixation = this.discoveredTopics[selectedIndex];

    // Update or create history
    const history = this.topicHistory.get(this.currentFixation.topic) || {
      timesActivated: 0,
      totalDumps: 0,
      lastActivated: 0,
      currentIntensity: 1.0,
      peakIntensity: 1.0
    };

    // INTENSITY ESCALATION on recurrence
    const isRecurrence = history.timesActivated > 0;
    if (isRecurrence) {
      // Each recurrence increases intensity
      history.currentIntensity = Math.min(3.0, history.currentIntensity + 0.3);
      history.peakIntensity = Math.max(history.peakIntensity, history.currentIntensity);
      
      console.log(`🤓 [Autism] 🔥 RETURNING to "${this.currentFixation.topic}" - intensity ${history.currentIntensity.toFixed(1)}x (was ${(history.currentIntensity - 0.3).toFixed(1)}x)`);
    } else {
      console.log(`🤓 [Autism] 🆕 First time fixating on "${this.currentFixation.topic}"`);
    }

    history.timesActivated++;
    history.lastActivated = Date.now();
    this.topicHistory.set(this.currentFixation.topic, history);

    this.fixationIntensity = history.currentIntensity;
    this.currentFixation.timesActivated++;

    console.log(`🤓 [Autism] Favorite fixation: ${oldTopic || 'none'} → ${this.currentFixation.topic} (intensity: ${this.fixationIntensity.toFixed(1)}x)`);

    this.saveHistory();
  }

  /**
   * Check if message triggers current fixation
   */
  checkTriggers(message) {
    if (!this.currentFixation || this.isActive) return false;

    const lowerMsg = message.toLowerCase();

    // Check triggers
    for (const trigger of this.currentFixation.triggers) {
      if (lowerMsg.includes(trigger.toLowerCase())) {
        // Chance to activate increases with intensity
        const activationChance = Math.min(0.7, 0.4 * this.fixationIntensity);
        
        if (Math.random() < activationChance) {
          this.activate();
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Activate fixation mode
   */
  activate() {
    this.isActive = true;
    this.activatedAt = Date.now();
    
    // Duration scales with intensity
    const baseDuration = 5 + Math.random() * 5; // 5-10 minutes base
    this.duration = baseDuration * this.fixationIntensity * 60 * 1000;
    
    const intensity = Math.round(this.fixationIntensity * 100);
    
    console.log('🤓🤓🤓 ==========================================');
    console.log('🤓 [Autism] FIXATION ACTIVATED');
    console.log(`🤓 [Autism] Topic: ${this.currentFixation.topic}`);
    console.log(`🤓 [Autism] Intensity: ${intensity}%`);
    console.log(`🤓 [Autism] Duration: ${(this.duration / 60000).toFixed(1)}m`);
    console.log('🤓🤓🤓 ==========================================');
    
    this.stats.totalActivations++;
    this.stats.dumpsByTopic[this.currentFixation.topic] = 
      (this.stats.dumpsByTopic[this.currentFixation.topic] || 0) + 1;

    // Update history
    const history = this.topicHistory.get(this.currentFixation.topic);
    if (history) {
      history.totalDumps++;
    }

    this.saveHistory();
  }

  /**
   * Check if should deactivate
   */
  checkDeactivation() {
    if (!this.isActive) return;
    
    if (Date.now() - this.activatedAt > this.duration) {
      this.deactivate();
    }
  }

  /**
   * Deactivate fixation mode
   */
  deactivate() {
    console.log(`🤓 [Autism] Fixation on "${this.currentFixation?.topic}" deactivated`);
    this.isActive = false;
    this.activatedAt = null;
  }

  /**
   * Should mention current fixation?
   */
  shouldMention() {
    if (!this.isActive || !this.currentFixation) return false;
    
    // Chance increases with intensity (more obsessed = mentions more)
    const mentionChance = Math.min(0.15, 0.05 * this.fixationIntensity);
    return Math.random() < mentionChance;
  }

  /**
   * Get knowledge to infodump
   * Returns more knowledge at higher intensity
   */
  async getKnowledge() {
    if (!this.currentFixation) return null;

    const knowledge = this.currentFixation.knowledge;
    if (knowledge.length === 0) {
      // Generate more knowledge on the fly if needed
      await this.expandKnowledge();
    }

    // Higher intensity = more facts at once
    const factsToReturn = Math.ceil(this.fixationIntensity);
    const facts = [];
    
    for (let i = 0; i < factsToReturn && knowledge.length > 0; i++) {
      const randomFact = knowledge[Math.floor(Math.random() * knowledge.length)];
      facts.push(randomFact);
    }

    return facts.join('. ');
  }

  /**
   * Expand knowledge about current fixation using AI
   */
  async expandKnowledge() {
    if (!this.currentFixation) return;

    try {
      const prompt = `Generate 5 more specific, passionate facts about "${this.currentFixation.topic}". Make them detailed, opinionated, and slightly obsessive. Return as JSON array: ["fact1", "fact2", ...]`;

      const aiResponse = await this.chatBot.getAIResponse(prompt, [], 'You are an expert who gets really into niche topics.');
      
      const match = aiResponse.match(/\[.*\]/s);
      if (match) {
        const newFacts = JSON.parse(match[0]);
        this.currentFixation.knowledge.push(...newFacts);
        console.log(`🤓 [Autism] Expanded knowledge about "${this.currentFixation.topic}" (+${newFacts.length} facts)`);
        await this.saveHistory();
      }
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Get context for AI about current fixation
   */
  getContext() {
    if (!this.isActive || !this.currentFixation) return '';

    const intensityDesc = this.fixationIntensity >= 2.0 ? 'EXTREMELY obsessed with' :
                         this.fixationIntensity >= 1.5 ? 'very into' : 'interested in';

    return `\n🤓 AUTISM FIXATION MODE (${Math.round(this.fixationIntensity * 100)}% intensity)
- You're ${intensityDesc} ${this.currentFixation.topic} right now
- This is ${this.currentFixation.timesActivated > 1 ? 'NOT your first time' : 'your first time'} being into this topic
${this.fixationIntensity >= 2.0 ? '- You\'re EVEN MORE into it than last time' : ''}
- ONLY mention it if it comes up naturally in conversation
- Don't force it or hijack the conversation completely
- Let others talk, but you can share knowledge when relevant
- Your enthusiasm should be obvious but not annoying`;
  }

  /**
   * Get current obsessions (for compatibility with other systems)
   */
  getCurrentObsessions() {
    if (!this.currentFixation) return [];
    
    return [{
      topic: this.currentFixation.topic,
      intensity: this.fixationIntensity,
      isActive: this.isActive,
      duration: this.duration,
      activatedAt: this.activatedAt
    }];
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      isActive: this.isActive,
      currentFixation: this.currentFixation?.topic || 'none',
      intensity: this.fixationIntensity,
      totalTopics: this.discoveredTopics.length,
      totalActivations: this.stats.totalActivations,
      topicsDiscovered: this.stats.topicsDiscovered,
      dumpsByTopic: this.stats.dumpsByTopic,
      topicHistory: Array.from(this.topicHistory.entries())
    };
  }
}

module.exports = AutismFixations;
