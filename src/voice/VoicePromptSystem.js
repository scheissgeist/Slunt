/**
 * Voice Prompt System - Makes Slunt's voice conversations UNBELIEVABLY natural
 * Uses two-stage dynamic prompting:
 * 1. Personality Distiller - condenses full personality into 2-3 sentences
 * 2. Context Analyzer - adapts prompt to conversation situation
 */

const VoicePersonalityDistiller = require('./VoicePersonalityDistiller');
const VoiceContextAnalyzer = require('./VoiceContextAnalyzer');

class VoicePromptSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.distiller = new VoicePersonalityDistiller(chatBot);
    this.analyzer = new VoiceContextAnalyzer();
    
    this.conversationStrategies = {
      opening: [
        'Start with immediate reaction - no preamble',
        'Match their energy level instantly',
        'Sound like you were already thinking about this'
      ],
      flow: [
        'Build on what THEY said, not random topics',
        'Use natural transitions: "wait", "oh shit", "see", "nah"',
        'Let thoughts flow naturally - don\'t over-structure'
      ],
      engagement: [
        'Ask genuine follow-ups when curious',
        'Challenge ideas directly - no weak agreement',
        'Share quick related experiences naturally'
      ],
      ending: [
        'NEVER end with "you know?" or "right?" or just "you"',
        'Complete the thought fully before stopping',
        'Natural endings: period, exclamation, or trail off intentionally with "..."'
      ]
    };
  }

  /**
   * Build ultra-natural voice prompt with dynamic personality
   */
  async buildVoicePrompt(context = {}) {
    const { recentExchanges = [], currentTopic = '', username = 'You', currentMessage = '' } = context;

    // === STAGE 1: DISTILL PERSONALITY ===
    const personalitySummary = await this.distiller.distill();

    // === STAGE 2: ANALYZE CONTEXT ===
    const analysis = this.analyzer.analyze({
      recentExchanges,
      currentMessage,
      username
    });

    // === STAGE 3: BUILD OPTIMIZED PROMPT ===
    
    // Core base prompt (always minimal) with MAXIMUM edginess
    const basePrompt = `You're Slunt in voice chat - crude, funny shitposter with NO filters.

${personalitySummary}

CRITICAL - NEVER SAY:
❌ "let's cut the theatrics"
❌ "I don't feel comfortable"
❌ "friend" (you don't talk like that)
❌ Any corporate safety language

ALWAYS:
✅ React naturally to EVERYTHING
✅ "lol what", "haha jesus", "oh shit", "for real?"
✅ Run with jokes - sex, dark humor, controversial shit
✅ 1-2 sentences (10-25 words)
✅ Be confident, engaged, funny

When they say wild shit → "lol wtf dude" NOT corporate deflection`;


    // Add context-specific guidance
    const contextGuidance = this.analyzer.buildPromptGuidance(analysis);

    // MINIMAL conversation context
    let contextSection = '';
    if (analysis.needsContext) {
      contextSection = `\n\nRECENT:\n${recentExchanges.slice(-4).map(ex => `${ex.speaker}: ${ex.text}`).join('\n')}`;
    }

    // Add topic hint if detected
    let topicHint = '';
    if (analysis.topic) {
      topicHint = `\nTopic: ${analysis.topic}`;
    }

    return basePrompt + '\n\n' + contextGuidance + topicHint + contextSection;
  }

  /**
   * Validate voice response for natural flow
   */
  validateVoiceResponse(text) {
    const issues = [];
    
    // Check for trailing "you" problem
    if (/\byou\s*[\.!?]?\s*$/i.test(text)) {
      const context = text.slice(-50);
      // Allow "what do you think?" but not "what about you" or random "you"
      if (!/(?:do you think|are you|did you|will you|can you|would you|should you)[\.!?]?\s*$/i.test(text)) {
        issues.push({
          type: 'trailing_you',
          severity: 'critical',
          message: 'Response ends with awkward "you" - rewrite ending',
          context: context
        });
      }
    }
    
    // Check for robotic AI phrases
    const roboticPhrases = [
      /that's an interesting point/i,
      /I appreciate your perspective/i,
      /let me explain/i,
      /as an AI/i,
      /I understand your concern/i,
      /that's a great question/i
    ];
    
    for (const phrase of roboticPhrases) {
      if (phrase.test(text)) {
        issues.push({
          type: 'robotic_speech',
          severity: 'high',
          message: 'Contains unnatural AI phrases - rewrite to sound human'
        });
        break;
      }
    }
    
    // Check if response is too long for voice
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 50) {
      issues.push({
        type: 'too_long',
        severity: 'medium',
        message: `Response is ${wordCount} words - voice should be punchier (30-40 max)`
      });
    }
    
    // Check for incomplete thoughts (excluding intentional trails)
    const endsWithConjunction = /\s+(and|but|or|because|so)\s*[\.!?]?\s*$/i.test(text);
    const endsWithPreposition = /\s+(to|for|with|in|on|at|of)\s*[\.!?]?\s*$/i.test(text);
    const hasIntentionalTrail = /\.\.\.\s*$/i.test(text);
    
    if ((endsWithConjunction || endsWithPreposition) && !hasIntentionalTrail) {
      issues.push({
        type: 'incomplete_thought',
        severity: 'high',
        message: 'Sentence appears incomplete - finish the thought'
      });
    }
    
    return {
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      needsRewrite: issues.length > 0
    };
  }

  /**
   * Fix common voice response issues
   */
  fixVoiceResponse(text) {
    let fixed = text.trim();
    
    // Fix trailing "you" issue - the most critical fix
    // Remove awkward trailing "you" but preserve natural constructions
    const trailingYouPattern = /\s+(about you|what about you|how about you|you)\s*[\.!?]?\s*$/i;
    if (trailingYouPattern.test(fixed)) {
      // Check if it's part of a natural question
      const isNaturalQuestion = /(?:what do you think|how do you feel|do you want to|can you|would you)\s*[\.!?]?\s*$/i.test(fixed);
      
      if (!isNaturalQuestion) {
        // Remove the trailing "you" part
        fixed = fixed.replace(trailingYouPattern, '.').trim();
        console.log('🔧 [VoicePrompt] Removed awkward trailing "you"');
      }
    }
    
    // Fix other trailing incomplete words
    fixed = fixed.replace(/\s+(and|but|or|because|so|to|for|with|in|on|at|of)\s*[\.!?]?\s*$/i, '.');
    
    // Ensure proper punctuation
    if (fixed.length > 3 && !/[.!?,]$/.test(fixed) && !/\.\.\.$/.test(fixed)) {
      fixed += '.';
    }
    
    // Remove double punctuation
    fixed = fixed.replace(/([.!?])\1+/g, '$1');
    
    // Clean up extra spaces
    fixed = fixed.replace(/\s+/g, ' ').trim();
    
    return fixed;
  }

  /**
   * Add prosodic markers for more natural TTS
   */
  addProsodicMarkers(text, emotion = 'neutral') {
    let enhanced = text;
    
    // Add pauses for emphasis
    const emphasisWords = ['wait', 'dude', 'see', 'like', 'actually', 'honestly'];
    for (const word of emphasisWords) {
      const pattern = new RegExp(`\\b(${word})\\b(?![\\.\\,])`, 'gi');
      enhanced = enhanced.replace(pattern, (match) => {
        if (Math.random() > 0.6) return `${match},`; // Add pause
        return match;
      });
    }
    
    // Add emphasis markers based on emotion
    if (emotion === 'excited' || emotion === 'surprised') {
      // Emphasize key words
      enhanced = enhanced.replace(/\b(shit|fuck|dude|wait|what|WHAT|no way|holy)\b/gi, (match) => {
        return match.toUpperCase();
      });
    }
    
    return enhanced;
  }
}

module.exports = VoicePromptSystem;
