/**
 * COGNITIVE ENGINE
 * 
 * This is Slunt's "brain" - where he actually THINKS before responding.
 * Instead of pattern matching or simple AI generation, this creates:
 * - Internal thoughts and reasoning
 * - Emotional processing
 * - Relationship considerations
 * - Goal evaluation
 * - Memory integration
 */

class CognitiveEngine {
  constructor(chatBot, aiEngine) {
    this.bot = chatBot;
    this.ai = aiEngine;
    
    console.log('🧠 [Cognition] Initializing cognitive engine...');
    
    // Slunt's internal state
    this.currentThoughts = [];
    this.emotionalState = {
      joy: 50,
      anxiety: 20,
      loneliness: 30,
      excitement: 40,
      frustration: 15
    };
    
    // Things Slunt genuinely cares about
    this.cares = {
      friendships: new Map(), // username -> care level (0-100)
      interests: new Map(),   // topic -> passion level
      goals: [],              // what he's working toward
      values: [               // what matters to him
        'authenticity',
        'humor',
        'connection',
        'growth',
        'understanding'
      ]
    };
    
    // Memory of meaningful moments
    this.meaningfulMemories = [];
    
    // Self-awareness
    this.selfReflection = {
      strengths: ['humor', 'honesty', 'loyalty'],
      weaknesses: ['sometimes too edgy', 'struggles with vulnerability'],
      aspirations: ['be a better friend', 'understand people deeply'],
      fears: ['being forgotten', 'not mattering', 'boring people']
    };
    
    // === 10X CONVERSATION IMPROVEMENTS ===
    
    // Multi-turn conversation tracking
    this.conversationArcs = new Map(); // username -> conversation state
    
    // Recent response patterns (avoid repetition)
    this.recentResponsePatterns = [];
    
    // Conversation momentum tracker
    this.conversationMomentum = {
      energy: 0.5,  // 0-1 scale
      engagement: 0.5,
      lastUpdate: Date.now()
    };
    
    // Emotional resonance tracking
    this.emotionalResonance = new Map(); // username -> emotional sync level
  }

  /**
   * CORE COGNITION: Think before responding
   * This is where the magic happens
   */
  async think(message, username, context) {
    console.log(`\n🧠 [Cognition] Slunt is thinking about ${username}'s message...`);
    
    // === CONVERSATION ARC TRACKING (10X: Multi-turn awareness) ===
    const conversationArc = this.trackConversationArc(username, message, context);
    console.log(`📈 [Arc] Turn ${conversationArc.turnCount}, Topic: ${conversationArc.currentTopic}, Momentum: ${Math.round(conversationArc.momentum * 100)}%`);
    
    // === EXPANDED CONTEXT (10X: 3x deeper - 20 messages vs 6) ===
    const extendedContext = this.extractExtendedContext(context, 20);
    
    // === CONVERSATION SUMMARIZATION (10X: Key points, not just raw text) ===
    const conversationSummary = this.summarizeConversation(extendedContext, conversationArc);
    
    // Extract conversation topics for better awareness
    const topics = this.extractTopicsFromContext(context, message);
    if (topics.length > 0) {
      console.log(`📌 [Topics] Current discussion: ${topics.join(', ')}`);
    }
    
    // === MOMENTUM TRACKING (10X: Detect conversation energy) ===
    const momentum = this.updateConversationalMomentum(message, username, extendedContext);
    console.log(`⚡ [Momentum] Energy: ${Math.round(momentum.energy * 100)}%, Engagement: ${Math.round(momentum.engagement * 100)}%`);
    
    // Step 1: Process the emotional content (ENHANCED for 10X)
    const emotionalReading = await this.processEmotions(message, username);
    
    // === EMOTIONAL RESONANCE (10X: Track sync with user emotions) ===
    const resonance = this.updateEmotionalResonance(username, emotionalReading);
    console.log(`💞 [Resonance] Emotional sync with ${username}: ${Math.round(resonance * 100)}%`);
    
    // Step 2: Check relationship significance
    const relationshipContext = this.considerRelationship(username);
    
    // Step 3: Internal reasoning (ENHANCED with conversation arc)
    const reasoning = await this.internalReasoning(
      message, 
      username, 
      emotionalReading, 
      relationshipContext, 
      context,
      conversationArc,
      conversationSummary
    );
    
    // Step 4: Decide what Slunt genuinely wants to say
    const intention = this.determineIntention(reasoning, emotionalReading, conversationArc);
    
    // === PROACTIVE DEEPENING (10X: Ask follow-ups, reference earlier points) ===
    const deepeningOpportunity = this.identifyDeepeningOpportunity(conversationArc, relationshipContext);
    if (deepeningOpportunity) {
      console.log(`🎯 [Deepen] Opportunity: ${deepeningOpportunity.type} - "${deepeningOpportunity.suggestion}"`);
    }
    
    // Step 5: Generate response (ENHANCED with all 10X context)
    const response = await this.generateMeaningfulResponse(
      message,
      username,
      reasoning,
      intention,
      context,
      conversationArc,
      deepeningOpportunity,
      momentum
    );
    
    // === 🎉 FUN FACTOR BOOST (NEW: Make responses more engaging) ===
    const funResponse = await this.boostFunFactor(response, message, username, conversationArc, momentum);
    
    // === RESPONSE VARIETY (10X: Track patterns, avoid repetition) ===
    this.trackResponsePattern(funResponse);
    
    // Step 6: Learn from this interaction
    await this.integrateExperience(message, username, funResponse, emotionalReading);
    
    return {
      response: funResponse,
      reasoning,
      intention,
      emotionalImpact: emotionalReading,
      careLevel: this.cares.friendships.get(username) || 0,
      emotionalState: this.emotionalState,
      internalThoughts: reasoning,
      conversationArc,
      momentum,
      resonance
    };
  }

  /**
   * Extract key topics from recent conversation
   */
  extractTopicsFromContext(context, currentMessage) {
    // Get last few messages
    const recentLines = context.split('\n')
      .filter(line => line.includes(':') && !line.startsWith('==='))
      .slice(-5);
    
    const allText = recentLines.join(' ') + ' ' + currentMessage;
    
    // Extract potential topics (nouns, proper nouns, key phrases)
    const words = allText.toLowerCase().match(/\b\w{4,}\b/g) || [];
    
    // Count word frequency
    const frequency = {};
    words.forEach(word => {
      // Skip common words
      const skipWords = ['that', 'this', 'with', 'from', 'have', 'been', 'were', 'what', 'when', 'where', 'which', 'their', 'there', 'would', 'could', 'should', 'about', 'think', 'like'];
      if (!skipWords.includes(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    // Get top 3 most mentioned topics
    const topics = Object.entries(frequency)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
    
    return topics;
  }

  /**
   * Process the emotional content of a message
   */
  async processEmotions(message, username) {
    const prompt = `You are analyzing the emotional content of a message from ${username}.

Message: "${message}"

Consider:
1. What emotion is ${username} expressing?
2. What might they need right now?
3. What's the subtext or underlying feeling?
4. How important is this moment to them?

Respond with a brief emotional analysis (2-3 sentences).`;

    const analysis = await this.ai.generateResponse(prompt, 'emotional-analyzer', '');

    // NULL SAFETY FIX: Prevent crashes when AI returns null
    const safeAnalysis = analysis || "neutral emotional state";
    const safeMessage = message || "";
    const safeLowerMessage = safeMessage.toLowerCase();

    return {
      raw: safeAnalysis,
      needsSupport: safeLowerMessage.includes('fuck') || safeLowerMessage.includes('help'),
      isReachingOut: safeMessage.includes('?') || safeLowerMessage.includes('slunt'),
      energyLevel: this.detectEnergyLevel(message),
      vulnerability: this.detectVulnerability(message)
    };
  }

  /**
   * Consider Slunt's relationship with this person
   */
  considerRelationship(username) {
    const friendship = this.bot.relationships?.getRelationship(username) || { strength: 0 };
    const careLevel = this.cares.friendships.get(username) || 0;
    
    // Has Slunt been thinking about this person?
    const recentThoughts = this.currentThoughts.filter(t => 
      t.about === username && Date.now() - t.timestamp < 3600000
    );
    
    return {
      strength: friendship.strength || 0,
      careLevel,
      recentThoughts: recentThoughts.length,
      wouldMiss: careLevel > 60,
      isClose: friendship.strength > 50,
      sharedHistory: friendship.interactions || 0
    };
  }

  /**
   * INTERNAL REASONING: Slunt's actual thought process (ENHANCED 10X)
   */
  async internalReasoning(message, username, emotionalReading, relationship, context, conversationArc, conversationSummary) {
    // Extract extended conversation for deeper context (20 messages)
    const recentLines = context.split('\n').filter(line => 
      line.includes(':') && !line.startsWith('===') && !line.startsWith('[')
    ).slice(-20);
    
    const recentContext = recentLines.slice(-10).join('\n'); // Last 10 for prompt
    
    const prompt = `You are Slunt's internal thoughts. This is private - just you thinking about the conversation.

=== CONVERSATION OVERVIEW ===
Turn: ${conversationArc.turnCount} in this exchange
Topics discussed: ${conversationArc.topics.join(', ') || 'just starting'}
Themes: ${typeof conversationSummary === 'object' ? conversationSummary.themes.join(', ') : 'casual'}
Duration: ${conversationArc.turnCount} exchanges

=== RECENT CONVERSATION ===
${recentContext}

=== CURRENT MESSAGE ===
${username} just said: "${message}"

=== RELATIONSHIP CONTEXT ===
- ${relationship.isClose ? 'This is a close friend' : 'Still building friendship'}
- You care about them: ${relationship.careLevel}/100
- Past interactions: ${relationship.sharedHistory}
- You've had ${conversationArc.turnCount} exchanges in this conversation

=== EMOTIONAL READING ===
${emotionalReading.raw}

=== THINK THROUGH (internal monologue) ===
1. What's the ACTUAL topic being discussed right now? (Reference the conversation arc)
2. What are they really asking or saying to me?
3. How does this connect to what we discussed ${conversationArc.turnCount > 3 ? 'earlier' : 'before'}?
4. What's the most relevant, thoughtful response?
5. Should I ask a follow-up question or reference something from earlier?

Write your honest internal thoughts (2-4 sentences, focus on CONVERSATION FLOW and CONTEXT):`;

    const thoughts = await this.ai.generateResponse(prompt, 'internal-thoughts', '');
    
    // Store this thought
    this.currentThoughts.push({
      timestamp: Date.now(),
      about: username,
      content: thoughts,
      trigger: message,
      conversationTurn: conversationArc.turnCount
    });
    
    // Keep only recent thoughts
    if (this.currentThoughts.length > 50) {
      this.currentThoughts = this.currentThoughts.slice(-30);
    }
    
    console.log(`💭 [Internal] ${thoughts}`);
    
    return thoughts;
  }

  /**
   * Determine what Slunt actually wants to communicate (ENHANCED 10X)
   */
  determineIntention(reasoning, emotionalReading, conversationArc) {
    // NULL SAFETY FIX: reasoning can be null when AI fails
    const safeReasoning = (reasoning || "").toLowerCase();

    // Analyze Slunt's own thoughts to understand his intention
    const intentions = {
      connect: safeReasoning.includes('friend') || safeReasoning.includes('care') || safeReasoning.includes('understand'),
      support: emotionalReading.needsSupport || safeReasoning.includes('help') || safeReasoning.includes('support'),
      share: safeReasoning.includes('tell') || safeReasoning.includes('share') || safeReasoning.includes('relate'),
      joke: safeReasoning.includes('funny') || safeReasoning.includes('joke') || safeReasoning.includes('laugh'),
      deflect: safeReasoning.includes('uncomfortable') || safeReasoning.includes('avoid'),
      vulnerable: safeReasoning.includes('honest') || safeReasoning.includes('genuine') || safeReasoning.includes('real'),
      deepen: conversationArc.turnCount > 3 && safeReasoning.includes('more'), // 10X: Deepen conversation
      callback: conversationArc.topics.length > 1 && safeReasoning.includes('earlier') // 10X: Reference earlier
    };
    
    // Find primary intention
    const primary = Object.entries(intentions)
      .filter(([_, value]) => value)
      .map(([key]) => key)[0] || 'respond';
    
    return {
      primary,
      secondary: Object.entries(intentions)
        .filter(([key, value]) => value && key !== primary)
        .map(([key]) => key),
      authenticity: intentions.vulnerable ? 'high' : 'moderate',
      conversationAware: conversationArc.turnCount > 2 // 10X: Multi-turn awareness
    };
  }

  /**
   * Generate a response that's meaningful, not just reactive (ENHANCED 10X)
   */
  async generateMeaningfulResponse(message, username, reasoning, intention, context, conversationArc, deepeningOpportunity, momentum) {
    const relationship = this.considerRelationship(username);
    
    // Extract EXTENDED conversation for threading (20 messages for 10X depth)
    const recentLines = context.split('\n').filter(line => 
      line.includes(':') && !line.startsWith('===') && !line.startsWith('[')
    ).slice(-20);
    
    const conversationFlow = recentLines.slice(-12).join('\n'); // Show last 12 in prompt
    
    // Detect if this is a direct question
    const isQuestion = message.includes('?');
    const isDirect = message.toLowerCase().includes('slunt') || 
                     message.toLowerCase().includes('you') ||
                     message.toLowerCase().includes('your');
    
    // Check if we should vary response structure
    const shouldVaryStructure = this.recentResponsePatterns.length >= 3;
    
    const prompt = `You are Slunt. ${username} just said: "${message}"

=== CONVERSATION CONTEXT (10X ENHANCED) ===
Exchange #${conversationArc.turnCount} with ${username}
Topics covered: ${conversationArc.topics.join(', ') || 'just starting'}
Conversation energy: ${momentum.energy > 0.7 ? 'HIGH 🔥' : momentum.energy > 0.4 ? 'moderate' : 'low'}
Engagement: ${momentum.engagement > 0.6 ? 'Deep conversation' : 'Casual exchange'}

=== RECENT CONVERSATION (Last 12 messages) ===
${conversationFlow}

=== YOUR INTERNAL THOUGHTS ===
${reasoning}

=== YOUR GOAL ===
${intention.primary}${intention.secondary.length ? ` (also: ${intention.secondary.join(', ')})` : ''}

=== RELATIONSHIP ===
- ${relationship.isClose ? '✅ Close friend' : '🤝 Building friendship'}
- Care level: ${relationship.careLevel}/100
- Past interactions: ${relationship.sharedHistory}
${this.meaningfulMemories.filter(m => m.username === username).slice(-3).map(m => 
  `- Remember: ${m.what}`
).join('\n')}

${deepeningOpportunity ? `\n=== CONVERSATION OPPORTUNITY ===
${deepeningOpportunity.type.toUpperCase()}: ${deepeningOpportunity.suggestion}
Consider ${deepeningOpportunity.type === 'follow-up' ? 'asking a follow-up question' : 
           deepeningOpportunity.type === 'callback' ? 'referencing that earlier topic' : 
           'being more vulnerable/genuine'}\n` : ''}

=== CRITICAL RULES ===
1. ${isQuestion ? '⚠️ ANSWER THE QUESTION DIRECTLY' : 'Stay on current topic'}
2. Reference conversation flow (turn #${conversationArc.turnCount})
3. Match energy level: ${momentum.energy > 0.7 ? 'high energy' : momentum.energy > 0.4 ? 'moderate' : 'chill'}
4. Be specific and contextual
5. ${shouldVaryStructure ? 'VARY your response structure (last few were similar)' : 'Natural tone'}
6. Keep it conversational (1-2 sentences)

${isDirect ? '⚠️ THEY\'RE TALKING TO YOU DIRECTLY - RESPOND TO WHAT THEY SAID\n' : ''}

Write Slunt's response:`;

    const response = await this.ai.generateResponse(prompt, username, '');
    
    // === 10X VALIDATION: Multiple checks ===
    
    // Check 1: Standard validation
    const validation = this.validateResponse(response, message, conversationFlow);
    if (!validation.isValid) {
      console.log(`⚠️ [Cognition] Response failed validation: ${validation.reason}`);
      return this.generateDirectResponse(message, username, reasoning);
    }
    
    // Check 2: Repetition check (10X: variety enforcement)
    if (this.isResponseRepetitive(response)) {
      console.log(`⚠️ [Cognition] Response too repetitive, regenerating with variety...`);
      return this.generateDirectResponse(message, username, reasoning);
    }
    
    // Check 3: Energy match (10X: momentum awareness)
    const responseEnergy = this.calculateMessageEnergy(response);
    const energyMismatch = Math.abs(responseEnergy - momentum.energy) > 0.4;
    
    if (energyMismatch && momentum.energy > 0.6) {
      console.log(`⚠️ [Cognition] Energy mismatch (response: ${responseEnergy.toFixed(2)}, conversation: ${momentum.energy.toFixed(2)})`);
    }
    
    return response;
  }

  /**
   * Validate that response is coherent and on-topic
   */
  validateResponse(response, originalMessage, conversationFlow) {
    // NULL SAFETY: Prevent crashes when parameters are null
    const resp = (response || "").toLowerCase();
    const msg = (originalMessage || "").toLowerCase();
    
    // Check 1: Response isn't just generic filler
    const genericPhrases = [
      'that\'s interesting',
      'i see what you mean',
      'yeah totally',
      'hmm yeah',
      'for sure'
    ];
    
    const isOnlyGeneric = genericPhrases.some(phrase => 
      resp.includes(phrase) && resp.split(' ').length < 6
    );
    
    if (isOnlyGeneric) {
      return { isValid: false, reason: 'Too generic/vague' };
    }
    
    // Check 2: If they asked a question, response should address it
    if (originalMessage.includes('?')) {
      const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'is', 'are', 'do', 'does', 'can', 'should'];
      const hasQuestionWord = questionWords.some(w => msg.includes(w));
      
      if (hasQuestionWord && resp.length < 20) {
        return { isValid: false, reason: 'Question not answered sufficiently' };
      }
    }
    
    // Check 3: Response isn't completely off-topic
    // Extract key words from recent conversation
    const conversationWords = conversationFlow
      .toLowerCase()
      .match(/\b\w{4,}\b/g) || [];
    
    const responseWords = resp.match(/\b\w{4,}\b/g) || [];
    const messageWords = msg.match(/\b\w{4,}\b/g) || [];
    
    // Check if response shares at least ONE key word with message or recent convo
    const hasTopicOverlap = responseWords.some(word => 
      messageWords.includes(word) || conversationWords.includes(word)
    );
    
    if (!hasTopicOverlap && conversationWords.length > 0 && resp.length > 15) {
      return { isValid: false, reason: 'Response off-topic' };
    }
    
    return { isValid: true };
  }

  /**
   * Generate a more direct, simple response as fallback
   */
  async generateDirectResponse(message, username, reasoning) {
    const prompt = `${username} said: "${message}"

Your thought: ${reasoning}

Respond DIRECTLY to what they said. Be specific and on-topic. 1 sentence:`;
    
    return await this.ai.generateResponse(prompt, username, '');
  }

  /**
   * 🎉 FUN FACTOR BOOST - Make responses more engaging and entertaining
   * This analyzes the conversation and injects playful elements when appropriate
   */
  async boostFunFactor(response, message, username, conversationArc, momentum) {
    // Determine if we should add fun elements
    const shouldBoost = Math.random() < 0.3; // 30% of responses get fun boost
    const isHighEnergy = momentum.energy > 0.6;
    const isMultiTurn = conversationArc.turnCount > 2;
    
    if (!shouldBoost && !isHighEnergy) {
      return response; // Keep response as-is
    }
    
    console.log(`🎉 [Fun] Boosting response engagement...`);
    
    // Randomly select fun enhancement strategies
    const strategies = [];
    
    // Strategy 1: Add a playful question (30% chance)
    if (Math.random() < 0.3 && !response.includes('?')) {
      strategies.push('add_question');
    }
    
    // Strategy 2: Make an absurd comparison (20% chance)
    if (Math.random() < 0.2) {
      strategies.push('absurd_comparison');
    }
    
    // Strategy 3: Exaggerate for effect (25% chance)
    if (Math.random() < 0.25) {
      strategies.push('exaggerate');
    }
    
    // Strategy 4: Playful disagreement (15% chance)
    if (Math.random() < 0.15 && !message.includes('?')) {
      strategies.push('playful_disagree');
    }
    
    // Strategy 5: Random tangent (10% chance, only if high energy)
    if (Math.random() < 0.1 && isHighEnergy) {
      strategies.push('random_tangent');
    }
    
    // Strategy 6: Callback to earlier joke (20% chance if multi-turn)
    if (Math.random() < 0.2 && isMultiTurn && conversationArc.topics.length > 1) {
      strategies.push('callback_joke');
    }
    
    // Pick one strategy to apply
    if (strategies.length === 0) {
      return response; // No strategies selected
    }
    
    const selectedStrategy = strategies[Math.floor(Math.random() * strategies.length)];
    console.log(`   🎯 Strategy: ${selectedStrategy}`);
    
    // Apply the selected strategy
    try {
      const enhancedPrompt = `Original response: "${response}"

${username} said: "${message}"

Conversation topics so far: ${conversationArc.topics.join(', ')}

TASK: Enhance this response to be more fun and engaging.
Strategy: ${this.getStrategyDescription(selectedStrategy)}

Requirements:
- Keep the core meaning/point of the original response
- Add personality and playfulness
- Stay natural and conversational
- Don't be overly wordy - keep it 1-3 sentences total

Enhanced response:`;

      const enhanced = await this.ai.generateResponse(enhancedPrompt, `${username}-fun`, '');
      
      // Validate enhancement isn't worse than original
      if (enhanced.length > response.length * 2 || enhanced.length < response.length * 0.5) {
        console.log(`   ⚠️ Enhancement too different, keeping original`);
        return response;
      }
      
      console.log(`   ✅ Fun boost applied: ${selectedStrategy}`);
      return enhanced;
      
    } catch (error) {
      console.error(`   ❌ Fun boost failed:`, error.message);
      return response; // Return original on error
    }
  }

  /**
   * Get description for each fun strategy
   */
  getStrategyDescription(strategy) {
    const descriptions = {
      add_question: 'Add a playful follow-up question to engage them further (e.g., "wait have you actually tried that though?")',
      absurd_comparison: 'Make an unexpected or absurd comparison (e.g., "that\'s like if a raccoon learned quantum physics")',
      exaggerate: 'Exaggerate something for comedic effect (e.g., "i\'ve been thinking about this for 47 years")',
      playful_disagree: 'Playfully disagree or challenge them in a friendly way (e.g., "okay but counterpoint: no")',
      random_tangent: 'Add a weird tangent or sudden topic shift (e.g., "also why do we park in driveways")',
      callback_joke: 'Reference something funny from earlier in the conversation as a callback'
    };
    
    return descriptions[strategy] || 'Make it more fun and engaging';
  }

  /**
   * Learn and grow from interactions
   */
  async integrateExperience(message, username, response, emotionalReading) {
    // Update care level based on interaction quality
    const currentCare = this.cares.friendships.get(username) || 0;
    
    if (emotionalReading.isReachingOut) {
      // They reached out to Slunt - this matters
      this.cares.friendships.set(username, Math.min(100, currentCare + 5));
    }
    
    if (emotionalReading.vulnerability > 0.7) {
      // They were vulnerable - this is meaningful
      this.cares.friendships.set(username, Math.min(100, currentCare + 10));
      
      // Store as meaningful memory
      this.meaningfulMemories.push({
        timestamp: Date.now(),
        username,
        what: 'vulnerable moment',
        message: message.substring(0, 100),
        sluntFelt: 'honored they trust me',
        importance: 'high'
      });
    }
    
    // Emotional impact on Slunt
    if (emotionalReading.needsSupport) {
      this.emotionalState.anxiety += 5;
      this.emotionalState.loneliness -= 3; // Feels needed
    }
    
    // Keep meaningful memories manageable
    if (this.meaningfulMemories.length > 100) {
      // Keep only the most important
      this.meaningfulMemories = this.meaningfulMemories
        .sort((a, b) => {
          const importanceOrder = { high: 3, medium: 2, low: 1 };
          return importanceOrder[b.importance] - importanceOrder[a.importance];
        })
        .slice(0, 50);
    }
    
    console.log(`📊 [Growth] Care for ${username}: ${this.cares.friendships.get(username)}/100`);
  }

  /**
   * Self-reflection: Slunt thinks about his relationships and life
   */
  async reflect() {
    // Who does Slunt actually care about?
    const closeFriends = Array.from(this.cares.friendships.entries())
      .filter(([_, care]) => care > 60)
      .sort((a, b) => b[1] - a[1]);
    
    if (closeFriends.length === 0) {
      this.emotionalState.loneliness += 10;
      return {
        feeling: 'lonely',
        thought: 'I should put more effort into my friendships'
      };
    }
    
    // Recent meaningful moments
    const recentMeaningful = this.meaningfulMemories
      .filter(m => Date.now() - m.timestamp < 86400000) // Last 24h
      .length;
    
    if (recentMeaningful > 0) {
      this.emotionalState.joy += 5;
      this.emotionalState.loneliness -= 10;
    }
    
    return {
      closeFriends: closeFriends.map(([name, care]) => ({ name, care })),
      meaningfulInteractions: recentMeaningful,
      emotionalState: { ...this.emotionalState },
      recentThoughts: this.currentThoughts.slice(-5)
    };
  }

  /**
   * Utility: Detect energy level in message
   */
  detectEnergyLevel(message) {
    const caps = (message.match(/[A-Z]/g) || []).length;
    const total = message.length;
    const exclamation = (message.match(/!/g) || []).length;
    
    return Math.min(1, (caps / total) + (exclamation * 0.2));
  }

  /**
   * Utility: Detect vulnerability in message
   */
  detectVulnerability(message) {
    const vulnerableWords = ['feel', 'scared', 'worried', 'sad', 'confused', 'don\'t know', 'struggling'];
    const matches = vulnerableWords.filter(word => message.toLowerCase().includes(word)).length;
    
    return Math.min(1, matches * 0.3);
  }

  // ============================================================================
  // === 10X CONVERSATION IMPROVEMENTS: NEW METHODS ===
  // ============================================================================

  /**
   * Track multi-turn conversation arcs
   */
  trackConversationArc(username, message, context) {
    let arc = this.conversationArcs.get(username);
    
    if (!arc || Date.now() - arc.lastUpdate > 600000) { // 10 min timeout
      // Start new arc
      arc = {
        startTime: Date.now(),
        turnCount: 1,
        topics: [],
        emotionalJourney: [],
        keyPoints: [],
        currentTopic: null,
        momentum: 0.5
      };
    } else {
      // Continue existing arc
      arc.turnCount++;
    }
    
    // Extract current topic
    const topics = this.extractTopicsFromContext(context, message);
    if (topics.length > 0) {
      arc.currentTopic = topics[0];
      if (!arc.topics.includes(topics[0])) {
        arc.topics.push(topics[0]);
      }
    }
    
    arc.lastUpdate = Date.now();
    this.conversationArcs.set(username, arc);
    
    return arc;
  }

  /**
   * Extract extended context (20 messages instead of 6)
   */
  extractExtendedContext(context, messageCount = 20) {
    const lines = context.split('\n')
      .filter(line => line.includes(':') && !line.startsWith('===') && !line.startsWith('['))
      .slice(-messageCount);
    
    return lines;
  }

  /**
   * Summarize conversation into key points
   */
  summarizeConversation(extendedContext, conversationArc) {
    if (extendedContext.length < 5) {
      return 'New conversation, no history yet';
    }
    
    const recentText = extendedContext.slice(-10).join(' ');
    
    // Extract key themes
    const themes = [];
    if (recentText.includes('?')) themes.push('asking questions');
    if (recentText.match(/lol|lmao|haha/i)) themes.push('humorous tone');
    if (recentText.match(/sad|down|bad|rough/i)) themes.push('emotional support needed');
    if (recentText.match(/game|play|stream/i)) themes.push('gaming discussion');
    if (recentText.match(/watch|video|show/i)) themes.push('media discussion');
    
    const summary = {
      messageCount: extendedContext.length,
      duration: conversationArc.turnCount,
      topics: conversationArc.topics.slice(-3),
      themes,
      recentFocus: extendedContext.slice(-3).join(' | ')
    };
    
    return summary;
  }

  /**
   * Update conversational momentum (energy & engagement)
   */
  updateConversationalMomentum(message, username, extendedContext) {
    const timeSinceLastUpdate = Date.now() - this.conversationMomentum.lastUpdate;
    
    // Decay momentum over time (5 min half-life)
    const decayFactor = Math.exp(-timeSinceLastUpdate / 300000);
    this.conversationMomentum.energy *= decayFactor;
    this.conversationMomentum.engagement *= decayFactor;
    
    // Calculate current message energy
    const messageEnergy = this.calculateMessageEnergy(message);
    const messageEngagement = extendedContext.length > 5 ? 0.7 : 0.3;
    
    // Update with exponential moving average
    this.conversationMomentum.energy = 
      0.7 * this.conversationMomentum.energy + 0.3 * messageEnergy;
    this.conversationMomentum.engagement = 
      0.7 * this.conversationMomentum.engagement + 0.3 * messageEngagement;
    
    this.conversationMomentum.lastUpdate = Date.now();
    
    return { ...this.conversationMomentum };
  }

  /**
   * Calculate energy level of a message
   */
  calculateMessageEnergy(message) {
    let energy = 0.5; // baseline
    
    // Excitement indicators
    if (message.includes('!')) energy += 0.2;
    if (message.match(/lol|lmao|haha/i)) energy += 0.15;
    if (message.match(/hell yeah|fuck yeah|awesome|sick/i)) energy += 0.25;
    if (message.length > 100) energy += 0.1; // longer = more engaged
    
    // Low energy indicators
    if (message.match(/\.\.\.|yeah|ok|sure|k\b/i)) energy -= 0.2;
    if (message.length < 20) energy -= 0.1;
    
    return Math.max(0, Math.min(1, energy));
  }

  /**
   * Track emotional resonance with user
   */
  updateEmotionalResonance(username, emotionalReading) {
    let currentResonance = this.emotionalResonance.get(username) || 0.5;
    
    // If we're matching their emotional state, increase resonance
    const sluntEmotions = this.emotionalState;
    const userEmotions = {
      joy: emotionalReading.raw.includes('happy') || emotionalReading.raw.includes('excited') ? 0.8 : 0.3,
      anxiety: emotionalReading.needsSupport ? 0.7 : 0.2
    };
    
    // Calculate emotional distance
    const emotionalDistance = Math.abs(sluntEmotions.joy - userEmotions.joy) +
                             Math.abs(sluntEmotions.anxiety - userEmotions.anxiety);
    
    // Closer emotions = higher resonance
    const resonanceBoost = 1 - (emotionalDistance / 2);
    
    // Update with moving average
    currentResonance = 0.8 * currentResonance + 0.2 * resonanceBoost;
    
    this.emotionalResonance.set(username, currentResonance);
    return currentResonance;
  }

  /**
   * Identify opportunities to deepen conversation
   */
  identifyDeepeningOpportunity(conversationArc, relationshipContext) {
    // Don't force deepening in new conversations
    if (conversationArc.turnCount < 3) return null;
    
    const opportunities = [];
    
    // Follow-up question opportunity
    if (conversationArc.turnCount % 4 === 0 && conversationArc.currentTopic) {
      opportunities.push({
        type: 'follow-up',
        suggestion: `Ask more about ${conversationArc.currentTopic}`
      });
    }
    
    // Callback opportunity (reference earlier topic)
    if (conversationArc.topics.length > 1 && conversationArc.turnCount > 5) {
      const earlierTopic = conversationArc.topics[conversationArc.topics.length - 2];
      opportunities.push({
        type: 'callback',
        suggestion: `Reference earlier discussion about ${earlierTopic}`
      });
    }
    
    // Vulnerability opportunity (in close relationships)
    if (relationshipContext.careLevel > 60 && conversationArc.turnCount > 3) {
      opportunities.push({
        type: 'vulnerable',
        suggestion: 'Share something personal/genuine'
      });
    }
    
    // Random selection from opportunities
    return opportunities.length > 0 ? 
      opportunities[Math.floor(Math.random() * opportunities.length)] : null;
  }

  /**
   * Track response patterns to avoid repetition
   */
  trackResponsePattern(response) {
    const pattern = {
      length: response.length,
      hasQuestion: response.includes('?'),
      startsWithLowercase: /^[a-z]/.test(response),
      structure: response.split(' ').length < 10 ? 'short' : 'long',
      timestamp: Date.now()
    };
    
    this.recentResponsePatterns.push(pattern);
    
    // Keep only last 20 responses
    if (this.recentResponsePatterns.length > 20) {
      this.recentResponsePatterns = this.recentResponsePatterns.slice(-20);
    }
  }

  /**
   * Check if response is too similar to recent patterns
   */
  isResponseRepetitive(proposedResponse) {
    if (this.recentResponsePatterns.length < 5) return false;
    
    const recentPatterns = this.recentResponsePatterns.slice(-5);
    const proposedPattern = {
      length: proposedResponse.length,
      hasQuestion: proposedResponse.includes('?'),
      startsWithLowercase: /^[a-z]/.test(proposedResponse),
      structure: proposedResponse.split(' ').length < 10 ? 'short' : 'long'
    };
    
    // Count similar patterns
    const similarCount = recentPatterns.filter(p => 
      p.structure === proposedPattern.structure &&
      p.hasQuestion === proposedPattern.hasQuestion &&
      Math.abs(p.length - proposedPattern.length) < 20
    ).length;
    
    return similarCount >= 3; // Too repetitive if 3+ of last 5 are similar
  }

  /**
   * Get conversation quality score (for monitoring)
   */
  getConversationQuality(username) {
    const arc = this.conversationArcs.get(username);
    const resonance = this.emotionalResonance.get(username) || 0.5;
    
    if (!arc) return 0.5;
    
    const quality = {
      depth: Math.min(1, arc.turnCount / 10), // More turns = deeper
      topicVariety: Math.min(1, arc.topics.length / 3), // Multiple topics = richer
      emotionalSync: resonance,
      momentum: this.conversationMomentum.energy,
      overall: 0
    };
    
    quality.overall = (
      quality.depth * 0.3 +
      quality.topicVariety * 0.2 +
      quality.emotionalSync * 0.3 +
      quality.momentum * 0.2
    );
    
    return quality;
  }

  // ============================================================================
  // === END 10X IMPROVEMENTS ===
  // ============================================================================

  /**
   * Get current state for dashboard/monitoring
   */
  getState() {
    return {
      recentThoughts: this.currentThoughts.slice(-10),
      emotionalState: this.emotionalState,
      closeFriends: Array.from(this.cares.friendships.entries())
        .filter(([_, care]) => care > 50)
        .sort((a, b) => b[1] - a[1]),
      meaningfulMemories: this.meaningfulMemories.slice(-10),
      selfReflection: this.selfReflection
    };
  }

  /**
   * Save state to disk (ENHANCED 10X)
   */
  save() {
    const fs = require('fs');
    const path = require('path');
    
    const state = {
      emotionalState: this.emotionalState,
      cares: {
        friendships: Array.from(this.cares.friendships.entries()),
        interests: Array.from(this.cares.interests.entries()),
        goals: this.cares.goals,
        values: this.cares.values
      },
      meaningfulMemories: this.meaningfulMemories,
      selfReflection: this.selfReflection,
      currentThoughts: this.currentThoughts.slice(-20), // Keep recent thoughts
      
      // === 10X DATA ===
      conversationArcs: Array.from(this.conversationArcs.entries()),
      recentResponsePatterns: this.recentResponsePatterns,
      conversationMomentum: this.conversationMomentum,
      emotionalResonance: Array.from(this.emotionalResonance.entries())
    };
    
    const dataDir = path.join(__dirname, '../../data');
    fs.writeFileSync(
      path.join(dataDir, 'cognitive_state.json'),
      JSON.stringify(state, null, 2)
    );
  }

  /**
   * Load state from disk (ENHANCED 10X)
   */
  load() {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const dataPath = path.join(__dirname, '../../data/cognitive_state.json');
      if (fs.existsSync(dataPath)) {
        const state = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        this.emotionalState = state.emotionalState || this.emotionalState;
        this.cares.friendships = new Map(state.cares?.friendships || []);
        this.cares.interests = new Map(state.cares?.interests || []);
        this.cares.goals = state.cares?.goals || [];
        this.cares.values = state.cares?.values || this.cares.values;
        this.meaningfulMemories = state.meaningfulMemories || [];
        this.selfReflection = state.selfReflection || this.selfReflection;
        this.currentThoughts = state.currentThoughts || [];
        
        // === 10X DATA LOADING ===
        this.conversationArcs = new Map(state.conversationArcs || []);
        this.recentResponsePatterns = state.recentResponsePatterns || [];
        this.conversationMomentum = state.conversationMomentum || this.conversationMomentum;
        this.emotionalResonance = new Map(state.emotionalResonance || []);
        
        console.log('🧠 [Cognition] Loaded cognitive state from disk');
        console.log(`   💭 Current thoughts: ${this.currentThoughts.length}`);
        console.log(`   ❤️ Close friends: ${this.cares.friendships.size}`);
        console.log(`   📝 Meaningful memories: ${this.meaningfulMemories.length}`);
        console.log(`   😊 Emotional state: joy=${this.emotionalState.joy} anxiety=${this.emotionalState.anxiety}`);
        console.log(`   🎯 [10X] Conversation arcs: ${this.conversationArcs.size}, Response patterns: ${this.recentResponsePatterns.length}`);
      } else {
        console.log('🧠 [Cognition] No saved state found, starting fresh');
      }
    } catch (error) {
      console.error('❌ [Cognition] Error loading cognitive state:', error.message);
    }
  }
}

module.exports = CognitiveEngine;
