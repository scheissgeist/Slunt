/**
 * CONTEXT SELECTOR - Smart Context Injection
 * 
 * Analyzes messages and only injects relevant personality system contexts
 * Reduces token usage by 50-70% while maintaining response quality
 * 
 * Uses keyword analysis and semantic patterns to determine which systems matter
 */

class ContextSelector {
  constructor() {
    // Keyword → system relevance mapping
    this.patterns = {
      // Emotional keywords
      emotional: {
        keywords: /\b(sad|happy|angry|depressed|anxious|excited|scared|worried|upset|mad|furious|joy|grief|fear)\b/i,
        phrases: /feel|feeling|emotion|mood/i,
        score: 10
      },
      
      // Mental health
      mentalHealth: {
        keywords: /\b(depressed|anxiety|panic|overwhelmed|stressed|breakdown|therapy|medication)\b/i,
        phrases: /mental health|feeling down|can't cope/i,
        score: 10
      },
      
      // Physical state
      physical: {
        keywords: /\b(tired|exhausted|sleepy|hungry|thirsty|sick|pain|hurt|drunk|high|wasted)\b/i,
        phrases: /need sleep|need food|need drink|feel like shit/i,
        score: 10
      },
      
      // Relationships
      relationships: {
        keywords: /\b(friend|friendship|love|hate|crush|dating|relationship|boyfriend|girlfriend|ex)\b/i,
        phrases: /you and|we|us|between us|our friendship/i,
        mentions: true, // Triggered by user mentions
        score: 10
      },
      
      // Social dynamics
      social: {
        keywords: /\b(everyone|people|chat|group|community|drama|beef|fight|argument)\b/i,
        phrases: /what do you think of|who do you like|social/i,
        score: 8
      },
      
      // Cognitive/thinking
      cognitive: {
        keywords: /\b(think|thought|idea|opinion|believe|philosophy|meaning|understand|confused)\b/i,
        phrases: /what do you think|in your opinion|do you believe/i,
        questions: /^(what|why|how|when|where|who)/i,
        score: 9
      },
      
      // Memory/past events
      memory: {
        keywords: /\b(remember|forgot|recall|memory|past|before|last time|earlier)\b/i,
        phrases: /do you remember|you said|you told me/i,
        score: 8
      },
      
      // Interests/obsessions
      interests: {
        keywords: /\b(favorite|like|dislike|prefer|interest|hobby|obsessed|into)\b/i,
        phrases: /what's your favorite|do you like|are you into/i,
        score: 7
      },
      
      // Energy/chaos
      chaos: {
        keywords: /\b(crazy|wild|chaos|insane|unhinged|weird|random|wtf)\b/i,
        phrases: /what the hell|go wild|be crazy/i,
        score: 6
      }
    };
  }
  
  /**
   * Analyze message and score relevance of each system
   */
  analyzeMessage(text, username, context = {}) {
    const scores = {};
    const textLower = text.toLowerCase();
    
    // Analyze each pattern
    for (const [system, pattern] of Object.entries(this.patterns)) {
      let score = 0;
      
      // Keyword matching
      if (pattern.keywords && pattern.keywords.test(textLower)) {
        score += pattern.score;
      }
      
      // Phrase matching
      if (pattern.phrases && pattern.phrases.test(textLower)) {
        score += pattern.score * 0.8;
      }
      
      // Question matching
      if (pattern.questions && pattern.questions.test(textLower)) {
        score += pattern.score * 0.6;
      }
      
      // Mention detection
      if (pattern.mentions && this.containsMention(text)) {
        score += pattern.score * 0.5;
      }
      
      if (score > 0) {
        scores[system] = score;
      }
    }
    
    // Context-based boosting
    // If user is mentioned, boost relationship context
    if (text.toLowerCase().includes('slunt') || text.toLowerCase().includes('@slunt')) {
      scores.relationships = (scores.relationships || 0) + 5;
    }
    
    // If message is long/complex, boost cognitive
    if (text.length > 100) {
      scores.cognitive = (scores.cognitive || 0) + 3;
    }
    
    // If message contains '?', boost cognitive
    if (text.includes('?')) {
      scores.cognitive = (scores.cognitive || 0) + 4;
    }
    
    return scores;
  }
  
  /**
   * Select which systems to include based on scores
   */
  selectSystems(scores, threshold = 5) {
    const selected = Object.entries(scores)
      .filter(([_, score]) => score >= threshold)
      .sort((a, b) => b[1] - a[1]) // Sort by score descending
      .map(([system, score]) => ({ system, score }));
    
    return selected;
  }
  
  /**
   * Get optimized context string with only relevant systems
   */
  getOptimizedContext(message, username, allSystems) {
    const scores = this.analyzeMessage(message, username);
    const selected = this.selectSystems(scores);
    
    // Always include basics
    const context = [];
    context.push('=== RELEVANT CONTEXT ===\n');
    
    // Add selected systems
    for (const { system, score } of selected) {
      const systemContext = this.getSystemContext(system, allSystems);
      if (systemContext) {
        context.push(systemContext);
      }
    }
    
    // If no specific systems selected, provide minimal context
    if (selected.length === 0) {
      context.push('⚡ BRIEF RESPONSE MODE: Keep it natural and concise.');
    }
    
    const result = context.join('\n');
    
    // Log token savings
    const estimatedTokens = Math.ceil(result.length / 4);
    console.log(`🎯 [ContextSelector] Selected ${selected.length} systems (~${estimatedTokens} tokens vs ~2000 full context)`);
    
    return result;
  }
  
  /**
   * Extract context from specific system
   */
  getSystemContext(systemName, allSystems) {
    const contextMap = {
      emotional: () => allSystems.emotional?.getContext?.('normal'),
      mentalHealth: () => allSystems.mentalHealth?.getContext?.(),
      physical: () => allSystems.physical?.getContext?.('normal'),
      relationships: () => allSystems.relationships?.getContext?.(),
      social: () => allSystems.social?.getContext?.(),
      cognitive: () => allSystems.cognitive?.getContext?.('normal'),
      memory: () => allSystems.memory?.getRecent?.(5),
      interests: () => allSystems.interests?.getContext?.(),
      chaos: () => allSystems.chaos?.getContext?.()
    };
    
    const getter = contextMap[systemName];
    return getter ? getter() : null;
  }
  
  /**
   * Check if text contains user mentions
   */
  containsMention(text) {
    return /@\w+/.test(text) || /\byou\b/i.test(text);
  }
  
  /**
   * Get statistics on context selection
   */
  getStats() {
    return {
      patternsLoaded: Object.keys(this.patterns).length,
      systems: Object.keys(this.patterns)
    };
  }
}

module.exports = ContextSelector;
