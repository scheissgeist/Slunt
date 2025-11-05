/**
 * VOICE GREETINGS SYSTEM
 * 
 * Generates dynamic, contextual greetings when Slunt connects to voice
 * No more boring "I'm here, what's up" - each greeting is unique and aware
 */

class VoiceGreetings {
  constructor(chatBot) {
    this.bot = chatBot;
    this.lastGreetingTime = 0;
    this.greetingHistory = []; // Track recent greetings to avoid repeats
    this.maxHistory = 20;
    
    console.log('👋 [VoiceGreetings] Dynamic voice greeting system initialized');
  }

  /**
   * Generate a contextual greeting when connecting to voice
   */
  async generateGreeting() {
    const now = Date.now();
    const timeSinceLastGreeting = now - this.lastGreetingTime;
    
    // Context gathering
    const hour = new Date().getHours();
    const mood = this.bot.moodTracker?.getMood();
    const recentMessages = this.getRecentChatActivity();
    const lastVoiceConversation = this.getLastVoiceContext();
    const currentVideo = this.getCurrentVideoContext();
    
    // Build context for AI
    let contextInfo = this.buildGreetingContext({
      hour,
      mood,
      recentMessages,
      lastVoiceConversation,
      currentVideo,
      timeSinceLastGreeting
    });
    
    // Generate AI greeting with context
    const greeting = await this.generateAIGreeting(contextInfo);
    
    // Fallback to template if AI fails
    if (!greeting || greeting.trim().length < 5) {
      return this.generateTemplateGreeting(contextInfo);
    }
    
    // Track greeting
    this.greetingHistory.push({
      greeting,
      timestamp: now,
      context: contextInfo
    });
    
    // Trim history
    if (this.greetingHistory.length > this.maxHistory) {
      this.greetingHistory.shift();
    }
    
    this.lastGreetingTime = now;
    
    console.log(`👋 [VoiceGreetings] Generated: "${greeting}"`);
    return greeting;
  }

  /**
   * Get recent chat activity across all platforms
   */
  getRecentChatActivity() {
    // DISABLED: Don't reference text chat when starting voice
    // This causes Slunt to mention random topics from text that voice user isn't aware of
    return null;
    
    /* OLD CODE - causes context bleed
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    const recent = this.bot.conversationContext
      .filter(m => m.timestamp > fiveMinutesAgo && m.username !== 'Slunt')
      .slice(-10); // Last 10 messages
    
    if (recent.length === 0) return null;
    
    // Find most discussed topic
    const topics = recent.map(m => this.extractTopic(m.text)).filter(Boolean);
    */
    const mostCommon = this.getMostCommon(topics);
    
    return {
      messageCount: recent.length,
      lastMessage: recent[recent.length - 1],
      mainTopic: mostCommon,
      platforms: [...new Set(recent.map(m => m.platform))],
      hasQuestions: recent.some(m => m.text.includes('?'))
    };
  }

  /**
   * Get context from last voice conversation
   */
  getLastVoiceContext() {
    if (!this.bot.voiceMemory || this.bot.voiceMemory.length === 0) {
      return null;
    }
    
    const lastVoice = this.bot.voiceMemory[this.bot.voiceMemory.length - 1];
    const lastVoiceTime = lastVoice?.timestamp || 0;
    const timeSince = Date.now() - lastVoiceTime;
    
    // Only reference if less than 2 hours ago
    if (timeSince > 2 * 60 * 60 * 1000) {
      return null;
    }
    
    // Get last few voice messages to understand context
    const recentVoice = this.bot.voiceMemory.slice(-5);
    const topic = recentVoice
      .map(m => m.topic || this.extractTopic(m.text))
      .filter(Boolean)[0];
    
    return {
      lastTopic: topic,
      timeSince,
      wasRecent: timeSince < 10 * 60 * 1000, // Within 10 minutes
      lastMessage: lastVoice.text
    };
  }

  /**
   * Get current video/stream context
   */
  getCurrentVideoContext() {
    // DISABLED: Don't reference what's being watched in text chat
    // Voice users might not be watching the same thing
    return null;
    
    /* OLD CODE - causes context bleed
    // Check if watching something on Coolhole/Twitch
    const recentMessages = this.bot.conversationContext
      .filter(m => m.timestamp > Date.now() - 2 * 60 * 1000)
      .slice(-5);
    
    // Look for video/game references
    const videoKeywords = ['watching', 'video', 'stream', 'game', 'playing', 'clip'];
    const hasVideoContext = recentMessages.some(m => 
      videoKeywords.some(kw => m.text.toLowerCase().includes(kw))
    );
    
    if (!hasVideoContext) return null;
    
    return {
      isWatching: true,
      recentContext: recentMessages[recentMessages.length - 1]?.text
    };
    */
  }

  /**
   * Build context string for AI
   */
  buildGreetingContext(info) {
    let context = {
      timeOfDay: this.getTimeOfDay(info.hour),
      mood: info.mood?.mood || 'neutral',
      hasRecentChat: !!info.recentMessages,
      hasPreviousVoice: !!info.lastVoiceConversation,
      isWatchingSomething: !!info.currentVideo,
      wasRecentDisconnect: info.timeSinceLastGreeting < 2 * 60 * 1000
    };
    
    // Add specific context details
    if (info.recentMessages) {
      context.chatTopic = info.recentMessages.mainTopic;
      context.chatActivity = info.recentMessages.messageCount > 5 ? 'active' : 'quiet';
    }
    
    if (info.lastVoiceConversation?.wasRecent) {
      context.lastVoiceTopic = info.lastVoiceConversation.lastTopic;
      context.continuingConversation = true;
    }
    
    if (info.currentVideo) {
      context.videoContext = info.currentVideo.recentContext;
    }
    
    return context;
  }

  /**
   * Generate AI-powered greeting
   */
  async generateAIGreeting(context) {
    if (!this.bot.aiEngine?.enabled) {
      return null;
    }
    
    try {
      // Build a contextual prompt
      let prompt = `You (Slunt) just connected to voice chat. Generate a natural greeting.\n\n`;
      
      // Add context
      if (context.continuingConversation) {
        prompt += `Last time you were talking about: ${context.lastVoiceTopic}\n`;
        prompt += `Reference it: "So anyway about ${context.lastVoiceTopic}..." or "Wait where were we..."\n\n`;
      } else if (context.hasRecentChat && context.chatTopic) {
        prompt += `Chat has been discussing: ${context.chatTopic}\n`;
        prompt += `Jump in with a question or opinion about it\n\n`;
      } else if (context.isWatchingSomething && context.videoContext) {
        prompt += `They're watching something: "${context.videoContext}"\n`;
        prompt += `React to what they're watching\n\n`;
      } else if (context.timeOfDay === 'late night') {
        prompt += `It's late at night. Comment on that.\n\n`;
      } else if (context.mood === 'grumpy' || context.mood === 'tired') {
        prompt += `You're ${context.mood}. Let it show.\n\n`;
      }
      
      prompt += `Generate ONE greeting (5-15 words, casual, no quotes):\n\nSlunt:`;
      
      const greeting = await this.bot.aiEngine.generateOllamaResponse(
        prompt,
        'System',
        '',
        60, // Enough for a greeting
        true // Voice mode
      );
      
      if (!greeting) return null;
      
      // Clean up
      let cleaned = greeting.trim()
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/^(Slunt:|I:|Me:)/i, '') // Remove labels
        .trim();
      
      // Ensure it's not too long
      if (cleaned.split(' ').length > 20) {
        cleaned = cleaned.split(' ').slice(0, 20).join(' ');
      }
      
      return cleaned;
      
    } catch (error) {
      console.error('❌ [VoiceGreetings] AI generation failed:', error.message);
      return null;
    }
  }

  /**
   * Generate template-based greeting as fallback
   */
  generateTemplateGreeting(context) {
    let greetings = [];
    
    // Time-based
    if (context.timeOfDay === 'morning') {
      greetings.push('morning', 'yo', 'what\'s going on');
    } else if (context.timeOfDay === 'late night') {
      greetings.push('still up huh', 'late night', 'can\'t sleep either');
    } else {
      greetings.push('yo', 'sup', 'what\'s up', 'hey');
    }
    
    // Context-based additions
    if (context.continuingConversation) {
      greetings = [
        'alright where were we',
        'so anyway',
        'back',
        'what were we talking about'
      ];
    } else if (context.hasRecentChat) {
      greetings.push('what\'s everyone talking about', 'what did i miss', 'catch me up');
    } else if (context.isWatchingSomething) {
      greetings.push('what are we watching', 'what\'s this', 'what\'s going on here');
    }
    
    // Mood-based
    if (context.mood === 'grumpy') {
      greetings = ['yeah what', 'what', 'sup'];
    } else if (context.mood === 'excited') {
      greetings = ['yo what\'s up', 'hey what\'s going on', 'what\'s happening'];
    }
    
    // Pick one that wasn't used recently
    const recentGreetings = this.greetingHistory.slice(-5).map(h => h.greeting);
    const available = greetings.filter(g => !recentGreetings.includes(g));
    
    if (available.length === 0) {
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    return available[Math.floor(Math.random() * available.length)];
  }

  /**
   * Extract topic from message
   */
  extractTopic(text) {
    if (!text || text.length < 10) return null;
    
    // Simple keyword extraction (could be more sophisticated)
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const meaningful = words.filter(w => w.length > 4 && !stopWords.includes(w));
    
    return meaningful[0] || null;
  }

  /**
   * Get most common element in array
   */
  getMostCommon(arr) {
    if (!arr || arr.length === 0) return null;
    
    const counts = {};
    let maxCount = 0;
    let mostCommon = null;
    
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
      if (counts[item] > maxCount) {
        maxCount = counts[item];
        mostCommon = item;
      }
    });
    
    return mostCommon;
  }

  /**
   * Get time of day category
   */
  getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'late night';
  }

  /**
   * Should use a greeting? (vs jumping straight into conversation)
   */
  shouldGreet(context) {
    // Always greet if no recent voice activity
    if (!context.hasPreviousVoice) return true;
    
    // Don't greet if reconnecting within 2 minutes
    if (context.wasRecentDisconnect) return false;
    
    // Greet if been away for a while
    return true;
  }
}

module.exports = VoiceGreetings;
