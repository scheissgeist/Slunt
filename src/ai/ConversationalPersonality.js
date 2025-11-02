/**
 * ConversationalPersonality - Makes Slunt more natural and conversational
 * Reduces "bot-like" responses and adds human conversation patterns
 */

const { getTimestamp } = require('../bot/logger');

class ConversationalPersonality {
  constructor() {
    // Conversation flow patterns
    this.conversationStarters = {
      casual: [
        "so anyway",
        "speaking of which",
        "on that note", 
        "you know what's funny",
        "actually that reminds me",
        "wait hold up"
      ],
      reactions: [
        "wait what",
        "hold on",
        "no way",
        "are you serious",
        "that's wild",
        "damn really",
        "oh shit"
      ],
      transitions: [
        "but honestly",
        "on a real note",
        "actually though",
        "but for real",
        "speaking of",
        "that said"
      ]
    };

    // Natural conversation fillers and connectors
    this.conversationalFillers = [
      "i mean", "honestly", "like", "you know", "anyway", "so", "well", 
      "actually", "basically", "obviously", "clearly", "apparently", 
      "literally", "seriously", "definitely", "probably", "maybe"
    ];

    // Response variety to avoid repetitive patterns
    this.responsePatterns = {
      agreement: ["yeah", "absolutely", "definitely", "for sure", "exactly", "totally", "yep"],
      disagreement: ["nah", "hell no", "not really", "i don't think so", "nope", "disagree"],
      surprise: ["what", "really", "no way", "seriously", "damn", "whoa", "wait"],
      thinking: ["hmm", "let me think", "interesting", "not sure", "maybe", "possibly"]
    };

    // Recent conversation context (last 10 exchanges)
    this.recentContext = [];
    
    // Track conversation momentum and flow
    this.conversationState = {
      energy: 'neutral', // low, neutral, high
      topic: null,
      lastSpeaker: null,
      momentum: 0 // -3 to +3, affects response style
    };
  }

  /**
   * Process incoming message and update conversation state
   */
  processMessage(username, text, platform) {
    // Update conversation state
    this.conversationState.lastSpeaker = username;
    
    // Detect energy level from message
    const energy = this.detectMessageEnergy(text);
    this.conversationState.energy = energy;
    
    // Update momentum based on conversation flow
    this.updateMomentum(text, username);
    
    // Add to recent context
    this.recentContext.push({
      username,
      text: text.substring(0, 200), // Limit length
      timestamp: Date.now(),
      platform
    });
    
    // Keep only recent messages
    if (this.recentContext.length > 10) {
      this.recentContext.shift();
    }
  }

  /**
   * Detect energy level of message
   */
  detectMessageEnergy(text) {
    const upperCase = (text.match(/[A-Z]/g) || []).length;
    const exclamation = (text.match(/!/g) || []).length;
    const question = (text.match(/\?/g) || []).length;
    const energyWords = /\b(lmao|haha|wtf|damn|shit|fuck|amazing|insane|crazy|wild)\b/gi;
    
    const energyScore = upperCase * 0.5 + exclamation * 2 + question * 1 + 
                      (text.match(energyWords) || []).length * 2;
    
    if (energyScore > 5) return 'high';
    if (energyScore < 2) return 'low';
    return 'neutral';
  }

  /**
   * Update conversation momentum
   */
  updateMomentum(text, username) {
    // Positive momentum from questions, jokes, engagement
    if (text.includes('?')) this.conversationState.momentum += 1;
    if (text.includes('lol') || text.includes('lmao')) this.conversationState.momentum += 0.5;
    if (text.length > 100) this.conversationState.momentum += 0.5;
    
    // Negative momentum from short responses, dismissal
    if (text.length < 20) this.conversationState.momentum -= 0.5;
    if (/^(ok|sure|yeah|k)$/i.test(text.trim())) this.conversationState.momentum -= 1;
    
    // Cap momentum
    this.conversationState.momentum = Math.max(-3, Math.min(3, this.conversationState.momentum));
    
    // Decay momentum over time
    setTimeout(() => {
      this.conversationState.momentum *= 0.8;
    }, 30000); // 30 seconds
  }

  /**
   * Generate more natural response opening
   */
  generateResponseOpening(messageType = 'normal') {
    const { energy, momentum } = this.conversationState;
    
    // High energy responses
    if (energy === 'high' && Math.random() < 0.7) {
      return this.conversationStarters.reactions[
        Math.floor(Math.random() * this.conversationStarters.reactions.length)
      ];
    }
    
    // Positive momentum - use casual starters
    if (momentum > 1 && Math.random() < 0.6) {
      return this.conversationStarters.casual[
        Math.floor(Math.random() * this.conversationStarters.casual.length)
      ];
    }
    
    // Random conversational filler
    if (Math.random() < 0.4) {
      return this.conversationalFillers[
        Math.floor(Math.random() * this.conversationalFillers.length)
      ];
    }
    
    return null; // No opener needed
  }

  /**
   * Add natural conversation flow to response
   */
  enhanceResponse(response, context = {}) {
    if (!response || response.length < 10) return response;
    
    let enhanced = response;
    
    // Add conversational opener
    const opener = this.generateResponseOpening();
    if (opener && Math.random() < 0.3) {
      enhanced = `${opener}, ${enhanced.toLowerCase()}`;
    }
    
    // Add natural connectors within longer responses
    if (enhanced.length > 50 && Math.random() < 0.4) {
      const sentences = enhanced.split(/[.!?]+/);
      if (sentences.length > 1) {
        const connector = this.conversationStarters.transitions[
          Math.floor(Math.random() * this.conversationStarters.transitions.length)
        ];
        sentences.splice(1, 0, ` ${connector}`);
        enhanced = sentences.join('').trim();
      }
    }
    
    // Add occasional trailing thoughts
    if (Math.random() < 0.15 && !enhanced.includes('...')) {
      const trailingThoughts = [
        "you know?",
        "if that makes sense",
        "just saying",
        "idk though",
        "could be wrong"
      ];
      enhanced += `, ${trailingThoughts[Math.floor(Math.random() * trailingThoughts.length)]}`;
    }
    
    return enhanced;
  }

  /**
   * Generate contextual follow-up based on recent conversation
   */
  generateContextualFollowup(username, currentResponse) {
    const recentMessages = this.recentContext.slice(-3);
    
    // Reference something from recent conversation
    if (recentMessages.length > 1 && Math.random() < 0.25) {
      const prevMessage = recentMessages[recentMessages.length - 2];
      
      if (prevMessage.username !== username && prevMessage.text.length > 20) {
        const callbacks = [
          `also ${prevMessage.username} mentioned something interesting earlier`,
          `kinda like what ${prevMessage.username} was saying`,
          `reminds me of that thing ${prevMessage.username} said`
        ];
        
        return callbacks[Math.floor(Math.random() * callbacks.length)];
      }
    }
    
    return null;
  }

  /**
   * Make response more conversational and less robotic
   */
  humanizeResponse(response, username, originalMessage) {
    if (!response) return response;
    
    let humanized = response;
    
    // Remove overly formal language
    humanized = humanized.replace(/\b(Furthermore|Moreover|Additionally|However,)\b/gi, '');
    humanized = humanized.replace(/\b(In conclusion|To summarize)\b/gi, '');
    humanized = humanized.replace(/\bin my opinion\b/gi, 'i think');
    humanized = humanized.replace(/\bI believe that\b/gi, 'i think');
    humanized = humanized.replace(/\bIt seems to me that\b/gi, 'seems like');
    
    // Add more casual contractions
    humanized = humanized.replace(/\bdo not\b/gi, "don't");
    humanized = humanized.replace(/\bcannot\b/gi, "can't");
    humanized = humanized.replace(/\bwould not\b/gi, "wouldn't");
    humanized = humanized.replace(/\bshould not\b/gi, "shouldn't");
    humanized = humanized.replace(/\bit is\b/gi, "it's");
    humanized = humanized.replace(/\bthat is\b/gi, "that's");
    
    // Remove robotic hedging
    humanized = humanized.replace(/\b(possibly|potentially|arguably)\b/gi, '');
    humanized = humanized.replace(/\bmight potentially\b/gi, 'might');
    humanized = humanized.replace(/\bcould possibly\b/gi, 'could');
    
    // Clean up extra spaces and formatting
    humanized = humanized.replace(/\s+/g, ' ').trim();
    
    // Occasionally add username
    if (Math.random() < 0.2 && !humanized.toLowerCase().includes(username.toLowerCase())) {
      humanized = `${humanized} ${username}`;
    }
    
    return humanized;
  }

  /**
   * Get conversation state for other systems
   */
  getConversationState() {
    return {
      ...this.conversationState,
      recentMessageCount: this.recentContext.length,
      averageMessageLength: this.recentContext.length > 0 
        ? this.recentContext.reduce((sum, msg) => sum + msg.text.length, 0) / this.recentContext.length
        : 0
    };
  }

  /**
   * Generate natural topic transition
   */
  generateTopicTransition(newTopic) {
    const transitions = [
      `speaking of ${newTopic}`,
      `that reminds me about ${newTopic}`,
      `on the topic of ${newTopic}`,
      `you know what's funny about ${newTopic}`,
      `${newTopic} is interesting because`
    ];
    
    return transitions[Math.floor(Math.random() * transitions.length)];
  }

  /**
   * Check if response needs more personality
   */
  needsMorePersonality(response) {
    if (!response || response.length < 10) return true;
    
    // Check for robotic patterns
    const roboticPatterns = [
      /^(I am|I'm an?|As an?)/i,
      /I (cannot|can't|don't) (provide|offer|give)/i,
      /(complex|nuanced) (topic|issue|subject)/i,
      /it depends on/i,
      /there are (many|various|multiple)/i,
      /(consider|think about) the following/i
    ];
    
    return roboticPatterns.some(pattern => pattern.test(response));
  }
}

module.exports = ConversationalPersonality;