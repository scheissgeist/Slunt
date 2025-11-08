/**
 * Advanced Behavioral Systems Bundle
 * Contains: PerformanceAnxiety, ChatRoleAwareness, ResponseTiming, MultiMessageResponse, ContextualMemoryRetrieval
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * 1. Performance Anxiety System
 * Aware when chat expects him to be funny, can choke under pressure
 */
class PerformanceAnxiety {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.pressure = 0; // 0-100
    this.recentExpectations = []; // Moments when chat expected something
    this.chokeHistory = []; // Times Slunt choked
    this.acknowledgments = 0; // Times acknowledged failed jokes
  }

  detectExpectation(context) {
    // Patterns that suggest chat expects something funny/clever
    const expectationPatterns = [
      /slunt (say|do|tell)/i,
      /what do you think/i,
      /youre so funny/i,
      /make a joke/i,
      /say something/i
    ];

    const hasExpectation = expectationPatterns.some(p => p.test(context));
    
    if (hasExpectation) {
      this.pressure = Math.min(100, this.pressure + 20);
      this.recentExpectations.push({
        timestamp: Date.now(),
        context
      });
      console.log(`😰 [Performance] Pressure increased: ${this.pressure.toFixed(0)}%`);
    }

    // Pressure decays over time
    setTimeout(() => {
      this.pressure = Math.max(0, this.pressure - 5);
    }, 60000); // Decay after 1 minute
  }

  shouldChoke() {
    // Higher pressure = more likely to choke
    const chokeChance = Math.min(0.35, this.pressure / 100 * 0.35);
    return Math.random() < chokeChance;
  }

  async generateChokedResponse() {
    try {
      const prompt = `You're Slunt under pressure to be funny/clever. Generate an awkward, unfunny response that falls flat. Make it clearly trying too hard.

Examples:
"uhh... chicken crossed the road i guess"
"thats... interesting"
"...yeah"

Your awkward response:`;

      const response = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.7,
        max_tokens: 25
      });

      this.chokeHistory.push({
        timestamp: Date.now(),
        pressure: this.pressure
      });

      console.log(`😰 [Performance] Choked under pressure (${this.pressure.toFixed(0)}%)`);
      return response;
    } catch (error) {
      console.error('Failed to generate choke response:', error);
      return '...';
    }
  }

  shouldAcknowledgeFlop() {
    // Sometimes acknowledges when a joke didn't land
    return Math.random() < 0.15;
  }

  async acknowledgeFlop() {
    try {
      const prompt = `You're Slunt. You just made a joke that fell completely flat. Acknowledge it awkwardly.

Examples:
"that was bad"
"okay that didnt work"
"nvm"

Your acknowledgment:`;

      const ack = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.8,
        max_tokens: 20
      });

      this.acknowledgments++;
      console.log(`😰 [Performance] Acknowledged flop`);
      return ack;
    } catch (error) {
      return null;
    }
  }

  getContext() {
    if (this.pressure > 60) {
      return `\n😰 HIGH PERFORMANCE PRESSURE (${this.pressure.toFixed(0)}%)
- Chat expects something from you
- You might choke and say something awkward
- Or overthink and kill the vibe`;
    }
    return '';
  }

  getStatus() {
    return {
      pressure: Math.round(this.pressure),
      chokes: this.chokeHistory.length,
      acknowledgments: this.acknowledgments
    };
  }
}

/**
 * 2. Chat Role Awareness System
 * Notices when ignored vs dominating, adjusts participation
 */
class ChatRoleAwareness {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.recentMessages = []; // Last 20 messages
    this.maxHistory = 20;
    this.participationRate = 0; // 0-1 (% of messages that are Slunt's)
    this.ignoredStreak = 0; // Consecutive messages without responses to Slunt
    this.dominanceStreak = 0; // Consecutive Slunt messages
    this.insecurity = 0; // 0-100
  }

  trackMessage(username, isSlunt) {
    this.recentMessages.push({
      username,
      isSlunt,
      timestamp: Date.now()
    });

    if (this.recentMessages.length > this.maxHistory) {
      this.recentMessages.shift();
    }

    // Update metrics
    this.updateMetrics();
  }

  updateMetrics() {
    const sluntMessages = this.recentMessages.filter(m => m.isSlunt).length;
    this.participationRate = sluntMessages / this.recentMessages.length;

    // Check for streaks
    let lastWasSlunt = false;
    let currentIgnored = 0;
    let currentDominance = 0;

    for (let i = this.recentMessages.length - 1; i >= 0; i--) {
      if (this.recentMessages[i].isSlunt) {
        if (lastWasSlunt) {
          currentDominance++;
        } else {
          break;
        }
        lastWasSlunt = true;
      } else {
        if (!lastWasSlunt && i === this.recentMessages.length - 1) {
          currentIgnored++;
        } else if (!lastWasSlunt) {
          currentIgnored++;
        } else {
          break;
        }
      }
    }

    this.ignoredStreak = currentIgnored;
    this.dominanceStreak = currentDominance;

    // Update insecurity
    if (this.ignoredStreak > 5) {
      this.insecurity = Math.min(100, this.insecurity + 10);
    } else if (this.participationRate > 0.4) {
      this.insecurity = Math.max(0, this.insecurity - 5);
    }
  }

  shouldBackOff() {
    // Back off if dominating (>40% of messages)
    return this.participationRate > 0.4;
  }

  shouldTryHarder() {
    // Try harder if being ignored (>8 messages without Slunt)
    return this.ignoredStreak > 8;
  }

  async shouldExpressInsecurity() {
    if (this.insecurity < 60) return false;
    return Math.random() < 0.15; // 15% chance when insecure
  }

  async expressInsecurity() {
    try {
      const prompt = `You're Slunt feeling insecure. Generate a brief self-conscious comment about your chat participation.

Examples:
"am i being annoying"
"should i just shut up"
"sorry if im talking too much"

Your insecurity:`;

      const expression = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.8,
        max_tokens: 20
      });

      console.log(`😔 [ChatRole] Expressed insecurity (${this.insecurity.toFixed(0)}%)`);
      return expression;
    } catch (error) {
      return null;
    }
  }

  getParticipationModifier() {
    if (this.shouldBackOff()) {
      return 0.5; // Respond half as often
    }
    if (this.shouldTryHarder()) {
      return 1.8; // Respond more often
    }
    return 1.0;
  }

  getContext() {
    if (this.shouldBackOff()) {
      return `\n📊 DOMINATING CONVERSATION (${(this.participationRate * 100).toFixed(0)}% of messages)
- You're talking too much
- Back off and let others talk
- Keep responses shorter`;
    }
    if (this.shouldTryHarder()) {
      return `\n📊 BEING IGNORED (${this.ignoredStreak} messages without you)
- You're being left out
- Try to join the conversation
- Maybe ask a question`;
    }
    return '';
  }

  getStatus() {
    return {
      participationRate: (this.participationRate * 100).toFixed(0) + '%',
      ignoredStreak: this.ignoredStreak,
      dominanceStreak: this.dominanceStreak,
      insecurity: Math.round(this.insecurity),
      shouldBackOff: this.shouldBackOff(),
      shouldTryHarder: this.shouldTryHarder()
    };
  }
}

/**
 * 3. Response Timing System
 * Simulates realistic typing delays
 */
class ResponseTiming {
  constructor(chatBot) {
    this.chatBot = chatBot;
  }

  calculateDelay(message, context = {}) {
    // Base delay: 2-5 seconds
    let delay = 2000 + Math.random() * 3000;

    // Longer messages = more typing time
    const wordCount = message.split(' ').length;
    delay += wordCount * 100; // +100ms per word

    // Thinking hard = longer delay
    if (context.thinking || message.includes('?')) {
      delay *= 1.5;
    }

    // Excited = faster typing
    if (context.excited || /!{2,}/.test(message)) {
      delay *= 0.6;
    }

    // Sleep deprived = slower
    if (context.tired) {
      delay *= 1.3;
    }

    // Distracted = much slower
    if (context.distracted) {
      delay *= 2.0;
    }

    // Cap at 10 seconds max
    return Math.min(10000, delay);
  }

  async waitForTyping(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  getTypingIndicator(delay) {
    // Could be used to show "Slunt is typing..." indicator
    return delay > 3000;
  }
}

/**
 * 4. Multi-Message Response System
 * Splits thoughts across multiple messages
 */
class MultiMessageResponse {
  constructor(chatBot) {
    this.chatBot = chatBot;
  }

  shouldSplit(message) {
    // Split if message is long or contains multiple thoughts
    const hasMultipleThoughts = /\.\s+[A-Z]/.test(message) || message.split('.').length > 2;
    const isLong = message.length > 80;
    const shouldSplit = (hasMultipleThoughts || isLong) && Math.random() < 0.25;
    
    return shouldSplit;
  }

  async splitMessage(message) {
    try {
      const prompt = `Split this message into 2-3 natural, conversational messages as if typing them separately:

Original: "${message}"

Return as array format:
["first part", "second part", "maybe third part"]

Split messages:`;

      const response = await this.chatBot.ai?.generateCompletion?.(prompt, {
        temperature: 0.7,
        max_tokens: 100
      });

      // Try to parse as array
      if (response) {
        const match = response.match(/\[".*?"\s*(?:,\s*".*?")*\]/);
        if (match) {
          const parts = JSON.parse(match[0]);
          console.log(`💬 [MultiMsg] Split into ${parts.length} messages`);
          return parts;
        }
      }
    } catch (error) {
      console.error('Failed to split message:', error);
    }

    // Fallback: simple split on periods
    return message.split('. ').map(s => s.trim()).filter(s => s.length > 0);
  }

  async generateInterstitials() {
    // Generate "wait", "actually", "nvm" type messages
    const interstitials = [
      'wait',
      'actually',
      'nvm',
      'hold on',
      'wait no',
      'you know what',
      'actually nah'
    ];
    return interstitials[Math.floor(Math.random() * interstitials.length)];
  }
}

/**
 * 5. Contextual Memory Retrieval System
 * Retrieves relevant OLD conversations
 */
class ContextualMemoryRetrieval {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.longTermMemory = []; // Stored conversations
    this.maxMemories = 200;
    this.dataPath = path.join(__dirname, '../../data/longterm_memory.json');
    this.load();
  }

  storeConversation(username, message, response, context) {
    this.longTermMemory.push({
      username,
      message,
      response,
      context,
      timestamp: Date.now(),
      recalled: 0
    });

    if (this.longTermMemory.length > this.maxMemories) {
      this.longTermMemory.shift();
    }

    this.save();
  }

  async retrieveRelevant(currentMessage, currentUser) {
    // Find relevant old conversations
    const relevant = [];
    
    for (const memory of this.longTermMemory) {
      // Check for keyword overlap
      const currentWords = currentMessage.toLowerCase().split(' ').filter(w => w.length > 4);
      const memoryWords = memory.message.toLowerCase().split(' ').filter(w => w.length > 4);
      
      const overlap = currentWords.filter(w => memoryWords.includes(w));
      
      if (overlap.length > 0) {
        // Calculate how long ago
        const daysAgo = Math.floor((Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24));
        const weeksAgo = Math.floor(daysAgo / 7);
        
        relevant.push({
          ...memory,
          daysAgo,
          weeksAgo,
          relevance: overlap.length
        });
      }
    }

    // Sort by relevance
    relevant.sort((a, b) => b.relevance - a.relevance);
    
    return relevant.slice(0, 3); // Top 3 most relevant
  }

  shouldRecallOldConversation() {
    return Math.random() < 0.10; // 10% chance
  }

  async generateRecall(memory) {
    try {
      const timeRef = memory.weeksAgo > 0 
        ? `${memory.weeksAgo} weeks ago`
        : `${memory.daysAgo} days ago`;

      const prompt = `You're Slunt. Make a brief, natural callback to an old conversation.

${timeRef}, ${memory.username} said: "${memory.message}"
You responded: "${memory.response}"

Drop a quick, casual reference. Keep it SHORT and natural - like you just remembered.

Examples:
"this reminds me of that ${memory.username} thing"
"didnt we talk about this ${timeRef}"
"oh yeah ${memory.username} mentioned this"

Your brief callback (under 8 words):`;

      const recall = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.8,
        max_tokens: 20
      });

      memory.recalled++;
      this.save();
      
      console.log(`🧠 [LongTerm] Recalled conversation from ${timeRef} with ${memory.username}`);
      return recall;
    } catch (error) {
      console.error('Failed to generate recall:', error);
    }
    return null;
  }

  async save() {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify({
        memory: this.longTermMemory.slice(-this.maxMemories)
      }, null, 2));
    } catch (error) {
      console.error('Failed to save long-term memory:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      this.longTermMemory = parsed.memory || [];
      console.log(`🧠 [LongTerm] Loaded ${this.longTermMemory.length} memories`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load long-term memory:', error);
      }
    }
  }

  getStatus() {
    return {
      memories: this.longTermMemory.length,
      oldestMemory: this.longTermMemory.length > 0 
        ? Math.floor((Date.now() - this.longTermMemory[0].timestamp) / (1000 * 60 * 60 * 24)) + ' days ago'
        : 'none',
      mostRecalled: this.longTermMemory.sort((a, b) => b.recalled - a.recalled).slice(0, 3).map(m => ({
        user: m.username,
        recalled: m.recalled
      }))
    };
  }
}

module.exports = {
  PerformanceAnxiety,
  ChatRoleAwareness,
  ResponseTiming,
  MultiMessageResponse,
  ContextualMemoryRetrieval
};
