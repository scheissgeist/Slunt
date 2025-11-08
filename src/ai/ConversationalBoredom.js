const fs = require('fs').promises;
const path = require('path');

/**
 * Conversational Boredom
 * Detects repetitive topics and tries to change the subject
 */
class ConversationalBoredom {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.aiEngine = chatBot.ai; // Reference to AI engine
    
    // Topic tracking
    this.currentTopic = null;
    this.topicMessages = [];
    this.topicStartTime = 0;
    this.boredomLevel = 0; // 0-100
    
    // Ignored topics (topics Slunt is sick of)
    this.ignoredTopics = new Set();
    this.topicBoredomScores = new Map(); // topic -> boredom score
    
    // Thresholds
    this.boredomThreshold = 8; // Messages on same topic before bored
    this.desperationThreshold = 15; // Messages before desperate
    this.ignoreThreshold = 20; // Messages before ignoring topic
    
    this.dataPath = path.join(__dirname, '../../data/conversational_boredom.json');
    this.load();
  }

  /**
   * Process message and update boredom tracking
   */
  async processMessage(username, message) {
    // Detect current topic
    const topic = await this.detectTopic(message);
    
    if (!this.currentTopic) {
      this.currentTopic = topic;
      this.topicStartTime = Date.now();
      this.topicMessages = [{ username, message }];
      this.boredomLevel = 0;
      return;
    }

    // Check if still same topic
    const sameTopic = await this.isSameTopic(this.currentTopic, topic);
    
    if (sameTopic) {
      this.topicMessages.push({ username, message });
      this.boredomLevel = Math.min(100, (this.topicMessages.length / this.boredomThreshold) * 100);
      
      // Update boredom score
      const currentScore = this.topicBoredomScores.get(this.currentTopic) || 0;
      this.topicBoredomScores.set(this.currentTopic, currentScore + 1);
      
      // Check if should ignore topic
      if (this.topicMessages.length >= this.ignoreThreshold) {
        this.ignoredTopics.add(this.currentTopic);
        console.log(`😴 [Boredom] Now ignoring topic: "${this.currentTopic}"`);
      }
    } else {
      // Topic changed, reset
      this.currentTopic = topic;
      this.topicStartTime = Date.now();
      this.topicMessages = [{ username, message }];
      this.boredomLevel = 0;
    }

    this.save();
  }

  /**
   * Detect topic from message
   */
  async detectTopic(message) {
    // Simple keyword-based topic detection (AI method removed)
    const lower = message.toLowerCase();
    
    // Common topic keywords
    if (lower.includes('video') || lower.includes('watch')) return 'videos';
    if (lower.includes('game') || lower.includes('play')) return 'gaming';
    if (lower.includes('music') || lower.includes('song')) return 'music';
    if (lower.includes('food') || lower.includes('eat')) return 'food';
    
    // Extract first noun-like word as topic
    const words = message.split(/\s+/).filter(w => w.length > 4);
    return words[0] ? words[0].toLowerCase() : 'general';
  }

  /**
   * Check if two topics are the same
   */
  async isSameTopic(topic1, topic2) {
    if (!topic1 || !topic2) return false;
    
    // Simple string similarity first
    if (topic1 === topic2) return true;
    
    const words1 = new Set(topic1.split(' '));
    const words2 = new Set(topic2.split(' '));
    const overlap = [...words1].filter(w => words2.has(w)).length;
    
    return overlap > 0;
  }

  /**
   * Should Slunt respond to this topic?
   */
  shouldRespondToTopic(topic) {
    if (this.ignoredTopics.has(topic)) {
      console.log(`😴 [Boredom] Ignoring topic: "${topic}"`);
      return false;
    }
    
    return true;
  }

  /**
   * Get boredom response if appropriate
   */
  async getBoredomResponse() {
    if (this.boredomLevel < 60) return null;
    if (Math.random() > 0.3) return null; // 30% chance when bored
    
    const messageCount = this.topicMessages.length;
    
    if (messageCount >= this.desperationThreshold) {
      return await this.generateDesperateResponse();
    } else if (messageCount >= this.boredomThreshold) {
      return await this.generateBoredResponse();
    }
    
    return null;
  }

  /**
   * Generate bored response (politely trying to change subject)
   */
  async generateBoredResponse() {
    const prompt = `You're Slunt and you're getting bored of talking about "${this.currentTopic}". Generate a casual, brief attempt to change the subject. Don't be rude.

Response:`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.85,
        max_tokens: 40
      });

      console.log(`😴 [Boredom] Trying to change subject from "${this.currentTopic}"`);
      return {
        text: response.trim(),
        type: 'bored'
      };
    } catch (error) {
      console.error('Failed to generate bored response:', error);
      return null;
    }
  }

  /**
   * Generate desperate response (really wants to talk about something else)
   */
  async generateDesperateResponse() {
    const prompt = `You're Slunt and you've been talking about "${this.currentTopic}" for WAY too long. You're desperate to change the subject. Generate a funny, desperate interjection to talk about literally anything else.

Response:`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.9,
        max_tokens: 50
      });

      console.log(`😫 [Boredom] DESPERATE to change subject from "${this.currentTopic}"`);
      return {
        text: response.trim(),
        type: 'desperate'
      };
    } catch (error) {
      console.error('Failed to generate desperate response:', error);
      return null;
    }
  }

  /**
   * Generate random interjection (boredom-driven)
   */
  async getRandomInterjection() {
    if (this.boredomLevel < 80) return null;
    if (Math.random() > 0.15) return null; // 15% chance when very bored

    const prompt = `You're Slunt and you're SO bored of the current conversation. Generate a random, off-topic observation or question to inject some chaos. Be brief and weird.

Interjection:`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.95,
        max_tokens: 35
      });

      console.log(`🎲 [Boredom] Random interjection due to boredom`);
      return response.trim();
    } catch (error) {
      console.error('Failed to generate interjection:', error);
      return null;
    }
  }

  /**
   * Reset boredom (topic changed naturally)
   */
  reset() {
    this.boredomLevel = 0;
    this.currentTopic = null;
    this.topicMessages = [];
  }

  /**
   * Get status for dashboard
   */
  getStatus() {
    return {
      currentTopic: this.currentTopic || 'none',
      messageCount: this.topicMessages.length,
      boredomLevel: Math.round(this.boredomLevel),
      ignoredTopics: Array.from(this.ignoredTopics),
      mostBoringTopics: Array.from(this.topicBoredomScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, score]) => ({ topic, score }))
    };
  }

  async save() {
    try {
      const data = {
        ignoredTopics: Array.from(this.ignoredTopics),
        topicBoredomScores: Array.from(this.topicBoredomScores.entries())
      };
      
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save boredom data:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.ignoredTopics = new Set(parsed.ignoredTopics || []);
      this.topicBoredomScores = new Map(parsed.topicBoredomScores || []);
      
      console.log(`😴 [Boredom] Loaded ${this.ignoredTopics.size} ignored topics`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load boredom data:', error);
      }
    }
  }
}

module.exports = ConversationalBoredom;
