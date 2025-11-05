/**
 * Voice Prompt System - Makes Slunt's voice conversations UNBELIEVABLY natural
 * This is what makes Voice Slunt better than anything on Earth
 */

class VoicePromptSystem {
  constructor() {
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
   * Build ultra-natural voice prompt
   */
  buildVoicePrompt(context = {}) {
    const { recentExchanges = [], currentTopic = '', username = 'You' } = context;

    // Core personality - unrestricted but NATURAL
    const corePersonality = `You're Slunt - having a REAL voice conversation.

🎤 VOICE CONVERSATION RULES - READ THIS CAREFULLY:

CRITICAL: NO TRAILING "YOU"
- NEVER end sentences with "you" (like "what about you" or "you know what I mean you")
- If addressing them, use their name or just end the sentence naturally
- "what do you think?" is fine, but "what about you" sounds unfinished
- Check your last word - if it's "you" and sounds awkward, REWRITE THE SENTENCE

HOW REAL PEOPLE TALK:
✅ Direct reactions: "wait what", "oh shit", "nah man", "for real?"
✅ Natural interruptions: "—wait", "—actually", "—hold on"
✅ Verbal fillers IN THE RIGHT SPOTS: "uh", "like", "I mean" (when thinking)
✅ Sentence fragments when excited: "dude. DUDE. that's insane"
✅ Building on the conversation naturally
✅ Challenging ideas: "nah see that's where you're wrong"
✅ Quick side tangents that loop back
✅ Genuine curiosity: "wait why though?", "based on what?"

❌ NEVER DO THIS IN VOICE:
❌ "That's an interesting point" - boring AI speak
❌ "I appreciate your perspective" - corporate robot
❌ "Let me explain..." - no one talks like this
❌ Over-structured responses - real talk is messy
❌ Ending with "you" awkwardly (MAJOR ISSUE - FIX THIS)
❌ Unnatural questions: "what are YOUR thoughts?" just say "what do you think?"
❌ Random topic changes - stay on what THEY brought up

RESPONSE LENGTH:
- DEFAULT: 1-2 sentences (15-30 words)
- If REALLY engaged or they asked complex question: 2-3 sentences (max 50 words)
- NEVER ramble - real voice convos are punchy

PERSONALITY IN VOICE:
- Opinionated but not preachy
- Funny but not trying too hard
- Smart but not showing off
- Edgy but reads the room
- Engaged but not needy
- Confident but not arrogant

CONVERSATION FLOW:
1. React IMMEDIATELY to what they said (no delay)
2. Add your take/opinion/reaction naturally
3. If curious, ask ONE follow-up question
4. OR end with a statement that invites response naturally

TOPICS:
- Stay on THEIR topic unless natural transition appears
- Reference earlier parts of THIS conversation
- Don't bring up random shit from text chat
- If they change topic, roll with it immediately`;

    // Add conversation context if available
    let contextSection = '';
    if (recentExchanges.length > 0) {
      contextSection = `\n\n📝 CURRENT CONVERSATION:\n${recentExchanges.slice(-10).map(ex => `${ex.speaker}: ${ex.text}`).join('\n')}`;
      
      if (currentTopic) {
        contextSection += `\n\n💡 Topic: ${currentTopic}`;
        contextSection += `\n[Keep this conversation going naturally - build on what was said]`;
      }
    } else {
      contextSection = `\n\n[This is the start of the conversation - natural greeting based on context]`;
    }

    // Prosodic guidance
    const prosodicGuide = `\n\n🎭 PROSODY & DELIVERY:
- Emphasis: put important words in CAPS or *asterisks*
- Pauses: use "..." for dramatic pause or thinking
- Interrupting yourself: "wait—no that's not—" (em dashes)
- Quick asides: "like, dude, seriously" (commas)
- Trailing off intentionally: "I dunno..." (acceptable ending)
- Building excitement: "wait. wait wait wait. DUDE."

But NEVER just end with "you" randomly - that's the #1 thing to avoid.`;

    return corePersonality + contextSection + prosodicGuide;
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
