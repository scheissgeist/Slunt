/**
 * Voice Context Analyzer
 * Analyzes conversation situation to build optimized prompts
 */

class VoiceContextAnalyzer {
  constructor() {
    this.conversationPhases = {
      GREETING: 'greeting',
      QUESTION: 'question',
      STORY: 'story',
      DEBATE: 'debate',
      CASUAL: 'casual',
      EMOTIONAL: 'emotional'
    };
  }

  /**
   * Analyze current conversation state
   * @param {Object} context - Conversation context
   * @returns {Object} Analysis with topic, tone, phase, etc.
   */
  analyze(context) {
    const { recentExchanges = [], currentMessage = '', username = 'You' } = context;

    return {
      phase: this.detectPhase(currentMessage, recentExchanges),
      topic: this.extractTopic(currentMessage, recentExchanges),
      emotionalTone: this.detectEmotionalTone(currentMessage),
      urgency: this.detectUrgency(currentMessage),
      needsContext: recentExchanges.length > 0,
      conversationLength: recentExchanges.length
    };
  }

  /**
   * Detect conversation phase
   */
  detectPhase(message, history) {
    const lower = message.toLowerCase();

    // Greeting phase
    if (history.length === 0 || /^(hey|hi|yo|sup|hello|what'?s up)/i.test(message)) {
      return this.conversationPhases.GREETING;
    }

    // Question phase
    if (/\?$/.test(message) || /^(why|how|what|when|where|who|can you|do you|are you)/i.test(lower)) {
      return this.conversationPhases.QUESTION;
    }

    // Debate/disagreement phase
    if (/(no|nah|wrong|disagree|but|actually|wait)/i.test(lower)) {
      return this.conversationPhases.DEBATE;
    }

    // Emotional phase
    if (/(fuck|shit|damn|amazing|incredible|hate|love|angry|sad)/i.test(lower)) {
      return this.conversationPhases.EMOTIONAL;
    }

    // Story/explanation phase (longer messages)
    if (message.length > 100) {
      return this.conversationPhases.STORY;
    }

    // Default: casual
    return this.conversationPhases.CASUAL;
  }

  /**
   * Extract main topic from recent conversation
   */
  extractTopic(message, history) {
    // Take last 3 exchanges to find topic
    const recentText = [...history.slice(-3).map(ex => ex.text), message].join(' ');
    
    // Simple keyword extraction (could be enhanced with NLP)
    const words = recentText.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4); // Ignore short words

    // Get most common meaningful word
    const wordCounts = {};
    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }

    const sorted = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  }

  /**
   * Detect emotional tone
   */
  detectEmotionalTone(message) {
    const lower = message.toLowerCase();

    if (/(fuck|shit|damn|wtf|bullshit)/i.test(lower)) return 'intense';
    if (/(lol|haha|lmao|funny)/i.test(lower)) return 'humorous';
    if (/(sad|depressed|hate|awful|terrible)/i.test(lower)) return 'negative';
    if (/(love|amazing|great|awesome|incredible)/i.test(lower)) return 'positive';
    if (/\?/.test(message)) return 'curious';

    return 'neutral';
  }

  /**
   * Detect urgency level
   */
  detectUrgency(message) {
    // All caps = high urgency
    if (message === message.toUpperCase() && message.length > 3) {
      return 'high';
    }

    // Multiple punctuation = high urgency
    if (/[!?]{2,}/.test(message)) {
      return 'high';
    }

    // Short urgent words
    if (/^(wait|stop|no|help|quick|now|hurry)/i.test(message)) {
      return 'high';
    }

    return 'normal';
  }

  /**
   * Build prompt guidance based on analysis
   */
  buildPromptGuidance(analysis) {
    const guidance = [];

    // Phase-specific guidance
    switch (analysis.phase) {
      case this.conversationPhases.GREETING:
        guidance.push('Keep greeting brief and natural');
        break;
      case this.conversationPhases.QUESTION:
        guidance.push('Answer directly, no hedging');
        break;
      case this.conversationPhases.DEBATE:
        guidance.push('Stand your ground, challenge back');
        break;
      case this.conversationPhases.EMOTIONAL:
        guidance.push('Match their energy, react authentically');
        break;
      case this.conversationPhases.STORY:
        guidance.push('Engage with key points, ask follow-up');
        break;
      default:
        guidance.push('Be natural and conversational');
    }

    // Tone-specific guidance
    if (analysis.emotionalTone === 'intense') {
      guidance.push('Get intense back, no filter');
    } else if (analysis.emotionalTone === 'humorous') {
      guidance.push('Be funny, riff on it');
    }

    // Urgency-specific guidance
    if (analysis.urgency === 'high') {
      guidance.push('RESPOND QUICKLY, short and direct');
    }

    return guidance.join('. ') + '.';
  }
}

module.exports = VoiceContextAnalyzer;
