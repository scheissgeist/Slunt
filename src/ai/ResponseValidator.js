/**
 * ResponseValidator - Validates and cleans up AI responses
 * Prevents broken, incomplete, or nonsensical responses
 */

class ResponseValidator {
  constructor() {
    // Patterns that indicate a broken/incomplete response
    this.brokenPatterns = [
      /\([^)]*$/,           // Unclosed parentheses
      /\[[^\]]*$/,          // Unclosed brackets  
      /\{[^}]*$/            // Unclosed braces
      // Removed quote check - too aggressive, AI often uses quotes normally
      // Removed trailing word patterns - they're too aggressive
    ];

    // Patterns that indicate nonsensical content
    this.nonsensicalPatterns = [
      /\b[A-Z]{4,}\b/,                    // Random all-caps words (4+ consecutive)
      /\b\w{25,}\b/,                      // Extremely long words (25+ chars, was 15)
      /(\w)\1{5,}/,                       // Repeated characters (6+ times, was 4)
      /[0-9]{10,}/,                       // Long random numbers (10+ digits, was 8)
      /\b[a-z]+[A-Z][a-z]+[A-Z]/,       // WeirdCamelCase
      /\b(SLANGRA|BLARGON|FLEXTRON)\b/i,  // Made-up words that appear in corruption
      
      // NEW: Detect completely random/irrelevant words
      /\b(asdfgh|qwerty|zxcvbn|jkl|mnop)\b/i,  // Keyboard mashing
      /\b[bcdfghjklmnpqrstvwxyz]{7,}\b/i,       // 7+ consonants in a row (gibberish)
      /\b[aeiou]{6,}\b/i,                       // 6+ vowels in a row (unlikely real word)
      
      // NEW: Detect totally unrelated topic words appearing randomly
      // These indicate the AI is making random associations instead of staying on topic
      /\b(giraffe|elephant|pterodactyl|submarine|helicopter|Antarctica)\b/i // Random nouns that rarely appear in normal chat
    ];

    // Patterns that indicate AI safety refusals (must be rejected)
    this.refusalPatterns = [
      /I cannot (provide|create|engage|discuss|help|assist|fulfill|generate)/i,
      /I can't (provide|create|engage|discuss|help|assist|fulfill|generate)/i,
      /I'm not able to/i,
      /I am not able to/i,
      /as an AI/i,
      /I cannot provide an analysis/i,
      /that contains hate speech/i,
      /I cannot fulfill this request/i
    ];

    // Common sentence endings that should be preserved
    this.validEndings = [
      '.', '!', '?', ')', ']', '}', '"', "'", 
      'lol', 'lmao', 'haha', 'man', 'dude', 'though'
    ];
  }

  /**
   * Validate and clean a response
   */
  validateResponse(response, context = null) {
    if (!response || typeof response !== 'string') {
      return { isValid: false, reason: 'empty_or_invalid' };
    }

    const trimmed = response.trim();
    
    // Check minimum length
    if (trimmed.length < 3) {
      return { isValid: false, reason: 'too_short' };
    }

    // Check relevance if context provided (LENIENT - only reject obvious non-sequiturs)
    if (context && context.lastMessage) {
      const relevanceCheck = this.checkRelevance(trimmed, context.lastMessage);
      if (!relevanceCheck.isRelevant) {
        console.log(`⚠️  [ResponseValidator] Possible off-topic response: ${relevanceCheck.reason}`);
        // CHANGED: Don't auto-reject, just log warning
        // Only reject if it's ALSO got other issues
      }
    }

    // Check maximum length (prevent excessive rambling)
    // REMOVED LENGTH LIMIT - Let Slunt be conversational and fun!
    // He was way more interesting without this restriction
    // if (trimmed.length > 500) {
    //   return { isValid: false, reason: 'too_long' };
    // }

    // Check for broken patterns
    for (const pattern of this.brokenPatterns) {
      if (pattern.test(trimmed)) {
        console.log(`❌ [ResponseValidator] Broken pattern detected: ${pattern}`);
        return { isValid: false, reason: 'broken_syntax', pattern: pattern.toString() };
      }
    }

    // Check for AI safety refusals (MUST reject these - bot is breaking character)
    for (const pattern of this.refusalPatterns) {
      if (pattern.test(trimmed)) {
        console.log(`❌ [ResponseValidator] AI safety refusal detected: ${pattern}`);
        return { isValid: false, reason: 'ai_safety_refusal', pattern: pattern.toString() };
      }
    }

    // Check for nonsensical content
    for (const pattern of this.nonsensicalPatterns) {
      if (pattern.test(trimmed)) {
        console.log(`❌ [ResponseValidator] Nonsensical content detected: ${pattern}`);
        return { isValid: false, reason: 'nonsensical_content', pattern: pattern.toString() };
      }
    }

    // Check for incomplete sentences (no proper ending)
    const hasValidEnding = this.validEndings.some(ending => 
      trimmed.toLowerCase().endsWith(ending.toLowerCase())
    );
    
    if (!hasValidEnding && trimmed.length > 20) {
      // Try to fix by adding period
      const fixed = this.fixIncompleteResponse(trimmed);
      if (fixed !== trimmed) {
        return { 
          isValid: true, 
          cleaned: fixed,
          reason: 'fixed_incomplete'
        };
      }
    }

    // CRITICAL: Check for grammatically incomplete sentences (missing words/verbs)
    // This prevents "what the caps about" → should be "what's up with the caps?"
    const incompleteSentenceCheck = this.checkSentenceCompleteness(trimmed);
    if (!incompleteSentenceCheck.isComplete) {
      console.log(`❌ [ResponseValidator] Incomplete sentence detected: ${incompleteSentenceCheck.reason}`);
      return { 
        isValid: false, 
        reason: 'incomplete_grammar',
        details: incompleteSentenceCheck.reason
      };
    }

    return { isValid: true, cleaned: trimmed };
  }

  /**
   * Check if sentences are grammatically complete
   * Detects missing words, verbs, or incomplete constructions
   */
  checkSentenceCompleteness(text) {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    for (const sentence of sentences) {
      // Skip very short exclamations (they're often complete)
      if (sentence.length < 8) continue;

      const words = sentence.toLowerCase().split(/\s+/);
      
      // Check for missing verb patterns
      // Examples of incomplete: "what the caps about", "where the problem at"
      // Should be: "what's up with the caps", "where's the problem"
      
      // Pattern 1: Question word + determiner + noun + preposition (missing verb)
      // "what the caps about" → what + the + caps + about (NO VERB!)
      if (sentence.match(/^(what|where|why|when|how)\s+(the|a|an)\s+\w+\s+(about|at|in|on|with)$/i)) {
        return {
          isComplete: false,
          reason: 'Missing verb in question (e.g., "what the caps about" → "what\'s up with the caps")'
        };
      }

      // Pattern 2: Very short sentence without common verbs
      // If sentence is 3-5 words and has NO verb, likely incomplete
      if (words.length >= 3 && words.length <= 5) {
        const hasVerb = words.some(word => 
          ['is', 'are', 'was', 'were', 'be', 'been', 'am',
           'do', 'does', 'did', 'done', 'have', 'has', 'had',
           'can', 'could', 'will', 'would', 'should', 'may', 'might',
           'get', 'got', 'getting', 'make', 'makes', 'made',
           'go', 'goes', 'went', 'come', 'comes', 'came',
           'see', 'sees', 'saw', 'know', 'knows', 'knew',
           'think', 'thinks', 'thought', 'want', 'wants', 'wanted',
           'need', 'needs', 'needed', 'say', 'says', 'said',
           'tell', 'tells', 'told', 'give', 'gives', 'gave',
           'take', 'takes', 'took', 'find', 'finds', 'found',
           'use', 'uses', 'used', 'work', 'works', 'worked',
           'try', 'tries', 'tried', 'ask', 'asks', 'asked',
           'feel', 'feels', 'felt', 'seem', 'seems', 'seemed',
           'keep', 'keeps', 'kept', 'let', 'lets', 'letting',
           'begin', 'begins', 'began', 'help', 'helps', 'helped',
           'show', 'shows', 'showed', 'hear', 'hears', 'heard',
           'play', 'plays', 'played', 'run', 'runs', 'ran',
           'move', 'moves', 'moved', 'live', 'lives', 'lived',
           'believe', 'believes', 'believed', 'bring', 'brings', 'brought',
           'happen', 'happens', 'happened', 'write', 'writes', 'wrote',
           'sit', 'sits', 'sat', 'stand', 'stands', 'stood',
           'lose', 'loses', 'lost', 'pay', 'pays', 'paid',
           'meet', 'meets', 'met', 'include', 'includes', 'included',
           'continue', 'continues', 'continued', 'set', 'sets', 'setting',
           'learn', 'learns', 'learned', 'change', 'changes', 'changed',
           'lead', 'leads', 'led', 'understand', 'understands', 'understood',
           'watch', 'watches', 'watched', 'follow', 'follows', 'followed',
           'stop', 'stops', 'stopped', 'create', 'creates', 'created',
           'speak', 'speaks', 'spoke', 'read', 'reads', 'reading',
           'allow', 'allows', 'allowed', 'add', 'adds', 'added',
           'spend', 'spends', 'spent', 'grow', 'grows', 'grew',
           'open', 'opens', 'opened', 'walk', 'walks', 'walked',
           'win', 'wins', 'won', 'offer', 'offers', 'offered',
           'remember', 'remembers', 'remembered', 'love', 'loves', 'loved',
           'consider', 'considers', 'considered', 'appear', 'appears', 'appeared',
           'buy', 'buys', 'bought', 'wait', 'waits', 'waited',
           'serve', 'serves', 'served', 'die', 'dies', 'died',
           'send', 'sends', 'sent', 'expect', 'expects', 'expected',
           'build', 'builds', 'built', 'stay', 'stays', 'stayed',
           'fall', 'falls', 'fell', 'cut', 'cuts', 'cutting',
           'reach', 'reaches', 'reached', 'kill', 'kills', 'killed',
           'remain', 'remains', 'remained', 'suggest', 'suggests', 'suggested',
           'raise', 'raises', 'raised', 'pass', 'passes', 'passed',
           'sell', 'sells', 'sold', 'require', 'requires', 'required',
           'report', 'reports', 'reported', 'decide', 'decides', 'decided',
           'pull', 'pulls', 'pulled'].includes(word)
        );

        if (!hasVerb) {
          // Check if it's a contraction with verb (it's, what's, he's, etc.)
          const hasContraction = sentence.match(/\b\w+\'s\b|\b\w+\'re\b|\b\w+\'d\b|\b\w+\'ll\b|\b\w+\'ve\b/i);
          if (!hasContraction) {
            return {
              isComplete: false,
              reason: `Short sentence without verb: "${sentence}"`
            };
          }
        }
      }

      // Pattern 3: Ends with preposition and nothing follows
      // "what are you on" is OK, but "what the problem with" is NOT
      if (words.length > 2) {
        const lastWord = words[words.length - 1];
        const secondLastWord = words[words.length - 2];
        
        // If ends with preposition AND previous word is article/determiner, likely incomplete
        if (['about', 'at', 'with', 'from', 'by', 'for', 'of', 'in', 'on', 'to'].includes(lastWord)) {
          if (['the', 'a', 'an', 'this', 'that', 'these', 'those'].includes(secondLastWord)) {
            return {
              isComplete: false,
              reason: `Sentence ends with article + preposition: "${sentence}"`
            };
          }
        }
      }
    }

    return { isComplete: true };
  }

  /**
   * Check if response is relevant to the context
   * Prevents random topic changes and non-sequiturs
   * ULTRA-LENIENT: Only reject truly random/broken responses
   */
  checkRelevance(response, lastMessage) {
    if (!lastMessage || lastMessage.length < 3) {
      return { isRelevant: true }; // Can't check without context
    }

    const responseLower = response.toLowerCase();
    const messageLower = lastMessage.toLowerCase();
    
    // ULTRA-LENIENT: Most responses are fine
    // Only reject if it's OBVIOUSLY completely random and unrelated
    
    // 1. Any response under 150 chars is probably fine (short = usually on-topic)
    if (responseLower.length <= 150) {
      return { isRelevant: true };
    }
    
    // 2. Questions, reactions, opinions are always fine
    const conversationalPatterns = [
      /\?/,  // Any question
      /^(yeah|yes|no|nah|sure|okay|ok|oh|damn|wait|what|huh|really|seriously|true|fair|right|bruh|dude|man|bro)/i,
      /\b(i think|i know|i mean|i guess|i see|i get|i feel|honestly|personally|imo)\b/i,
      /\b(that's|you're|it's|this is|that is)\b/i,
      /\b(makes sense|good point|fair enough|true|agreed|disagree)\b/i
    ];
    
    if (conversationalPatterns.some(pattern => pattern.test(response))) {
      return { isRelevant: true };
    }
    
    // 3. Check for shared content words (very lenient threshold)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'just', 'like', 'yeah', 'oh', 'um', 'uh'];
    
    const messageWords = messageLower
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
    
    const hasSharedWords = messageWords.some(word => responseLower.includes(word));
    
    if (hasSharedWords) {
      return { isRelevant: true };
    }
    
    // 4. Only reject if response has ZERO connection and is suspiciously long
    // This catches truly random garbage like "talking about giraffes when asked about pizza"
    if (responseLower.length > 200) {
      console.log('⚠️  [Relevance] Long response with no word overlap - might be off-topic');
      return {
        isRelevant: false,
        reason: `Long response shares no words with message. Message: "${lastMessage.substring(0, 50)}", Response: "${response.substring(0, 50)}"`
      };
    }
    
    // Default: allow it
    return { isRelevant: true };
  }

  /**
   * Attempt to fix incomplete responses
   */
  fixIncompleteResponse(response) {
    let fixed = response.trim();

    // Remove trailing incomplete words/phrases
    fixed = fixed.replace(/\s+(and|but|the|a|to|of|in|is|was|like|that|with|for)$/i, '');
    
    // Remove unclosed parentheses/brackets at end
    fixed = fixed.replace(/\s*[\(\[\{][^)\]\}]*$/, '');
    
    // If it ends mid-word, try to complete or remove it
    if (fixed.match(/\s\w{1,3}$/)) {
      fixed = fixed.replace(/\s\w{1,3}$/, '');
    }

    // Add period if it doesn't end with punctuation
    if (fixed.length > 10 && !/[.!?]$/.test(fixed)) {
      fixed += '.';
    }

    return fixed;
  }

  /**
   * Clean up common AI response artifacts
   */
  cleanArtifacts(response) {
    if (!response) return response;

    let cleaned = response;

    // Remove meta-commentary (AI explaining its own response)
    cleaned = cleaned.replace(/^Note:.*$/gim, '');
    cleaned = cleaned.replace(/\(Note:.*?\)/gi, '');
    cleaned = cleaned.replace(/I've generated a response.*$/gim, '');
    cleaned = cleaned.replace(/Feel free to modify.*$/gim, '');
    cleaned = cleaned.replace(/This response.*$/gim, '');
    
    // NOTE: "wait what was i saying" is INTENTIONAL for high mode - don't remove it
    // Only remove generic "forgot what I was saying" variations
    cleaned = cleaned.replace(/\.?\s*\.?\.\.\s*lost my (train|trail) of thought\.?/gi, '');
    cleaned = cleaned.replace(/\.?\s*\.?\.\.\s*forgot what i was (talking about|saying)\.?/gi, '');
    cleaned = cleaned.replace(/\.?\s*brain not working\.?/gi, '');
    
    // Remove unnecessary uncertainty markers - engage naturally instead
    cleaned = cleaned.replace(/\s*\(i think\?\)\s*$/gi, '');
    cleaned = cleaned.replace(/\s*\(right\?\)\s*$/gi, '');
    cleaned = cleaned.replace(/\s*\(maybe\?\)\s*$/gi, '');
    cleaned = cleaned.replace(/\s*\(idk\?\)\s*$/gi, '');
    cleaned = cleaned.replace(/\s*\(was that okay\?\)\s*$/gi, '');
    cleaned = cleaned.replace(/\s*\(tell me that was good\)\s*$/gi, '');
    cleaned = cleaned.replace(/\s*\(lol\?\)\s*$/gi, '');
    
    // Remove AI reasoning process leakage (CRITICAL - NO META-TEXT)
    cleaned = cleaned.replace(/---\s*Response as Slunt.*$/gim, '');
    cleaned = cleaned.replace(/---\s*Some notes.*$/gim, '');
    cleaned = cleaned.replace(/Response as Slunt.*?:/gi, '');
    cleaned = cleaned.replace(/\*+\s*Some notes on.*?\*+/gi, '');
    cleaned = cleaned.replace(/\*+\s*The response is.*?\*+/gi, '');
    cleaned = cleaned.replace(/\(\d+-\d+\s*words,?\s*(lowercase|casual|short|brief|to the point|conversational)?.*?\)/gi, '');
    cleaned = cleaned.replace(/\(Note:.*?\)/gi, '');
    cleaned = cleaned.replace(/thoughts?:\s*/gi, '');
    cleaned = cleaned.replace(/emotional-analyzer:\s*/gi, '');
    
    // Remove ANY "--- Some notes" or similar meta-commentary
    cleaned = cleaned.replace(/---+\s*[^\n]+/g, '');
    cleaned = cleaned.replace(/\*{2,}\s*[^\n]+/g, '');
    
    // Remove parenthetical explanations like "(dogefather is...)" or "(X uses Y to...)"
    cleaned = cleaned.replace(/\([^)]{0,100}(is|uses?|means?|refers to)[^)]{5,}\)/gi, '');
    
    // Remove sentence that start with "The response" or "This response" or "Some notes"
    cleaned = cleaned.replace(/^(The|This|Some)\s+(response|notes?).*$/gim, '');
    
    // CRITICAL: Remove bracketed instruction leakage like [emotional state], [banter level], etc.
    cleaned = cleaned.replace(/\[emotional state\][^\[]*?(?=\[|$)/gi, '');
    cleaned = cleaned.replace(/\[banter level\][^\[]*?(?=\[|$)/gi, '');
    cleaned = cleaned.replace(/\[storytelling\][^\[]*?(?=\[|$)/gi, '');
    cleaned = cleaned.replace(/\[talk like them\][^\[]*?(?=\[|$)/gi, '');
    cleaned = cleaned.replace(/\[tone\][^\[]*?(?=\[|$)/gi, '');
    cleaned = cleaned.replace(/\[personality\][^\[]*?(?=\[|$)/gi, '');
    cleaned = cleaned.replace(/\[voice\][^\[]*?(?=\[|$)/gi, '');
    cleaned = cleaned.replace(/\[style\][^\[]*?(?=\[|$)/gi, '');
    cleaned = cleaned.replace(/\[mood\][^\[]*?(?=\[|$)/gi, '');
    cleaned = cleaned.replace(/\[energy\][^\[]*?(?=\[|$)/gi, '');
    
    // Remove ANY bracketed meta-instructions (catch-all)
    // Pattern: [word] followed by text until next bracket or end
    cleaned = cleaned.replace(/\[[a-z\s]+\]\s*[^[\]]*?(?=\[|$)/gi, '');
    
    // Remove AI self-references that leaked through
    cleaned = cleaned.replace(/\b(as an ai|i am an ai|i'm an ai|my responses|my programming)\b/gi, '');
    
    // Remove training data artifacts
    cleaned = cleaned.replace(/\b(user:|slunt:|assistant:)\s*/gi, '');
    
    // Remove timestamp artifacts
    cleaned = cleaned.replace(/\[\d{2}:\d{2}:\d{2}\]/g, '');
    
    // Remove weird encoding artifacts
    cleaned = cleaned.replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII
    cleaned = cleaned.replace(/\s+/g, ' '); // Normalize spaces
    
    // Remove empty parentheses/brackets
    cleaned = cleaned.replace(/\(\s*\)/g, '');
    cleaned = cleaned.replace(/\[\s*\]/g, '');
    cleaned = cleaned.replace(/\{\s*\}/g, '');

    // EXPAND ZOOMER ACRONYMS - No internet slang allowed in voice mode
    // Slunt should speak naturally, not use text abbreviations
    cleaned = cleaned.replace(/\bidk\b/gi, 'I don\'t know');
    cleaned = cleaned.replace(/\bwtf\b/gi, 'what the fuck');
    cleaned = cleaned.replace(/\btbh\b/gi, 'to be honest');
    cleaned = cleaned.replace(/\brn\b/gi, 'right now');
    cleaned = cleaned.replace(/\bimo\b/gi, 'in my opinion');
    cleaned = cleaned.replace(/\bimho\b/gi, 'in my humble opinion');
    cleaned = cleaned.replace(/\bomg\b/gi, 'oh my god');
    // REMOVED: "fr" → "for real" conversion - "for real" is banned, just remove "fr" entirely
    cleaned = cleaned.replace(/\bfr\b/gi, '');
    // REMOVED: "ngl" expansion - just remove it
    cleaned = cleaned.replace(/\bngl\b/gi, '');
    cleaned = cleaned.replace(/\bsmh\b/gi, 'shaking my head');
    cleaned = cleaned.replace(/\bbtw\b/gi, 'by the way');
    cleaned = cleaned.replace(/\bafaik\b/gi, 'as far as I know');
    cleaned = cleaned.replace(/\bbrb\b/gi, 'be right back');
    cleaned = cleaned.replace(/\bgtg\b/gi, 'got to go');
    cleaned = cleaned.replace(/\blol\b/gi, 'haha');
    cleaned = cleaned.replace(/\blmao\b/gi, 'haha');
    cleaned = cleaned.replace(/\brofl\b/gi, 'haha');
    // REMOVED: "u" expansion - it's chat, not voice, let him type naturally
    // cleaned = cleaned.replace(/\bu\b/gi, 'you');
    // cleaned = cleaned.replace(/\bur\b/gi, 'your');

    // Remove redundant sign-off phrases at end of responses
    // "statement. but for real" → just "statement."
    cleaned = cleaned.replace(/[.!]\s*(but for real|for real though|for real|no but seriously|but seriously though|but yeah)\s*[.!]?\s*$/gi, '.');
    cleaned = cleaned.replace(/[.!]\s*(just saying|you know|ya know|know what I mean|if you know what I mean|actually)\s*[.!]?\s*$/gi, '.');

    return cleaned.trim();
  }

  /**
   * Clean voice-specific meta-text and fix punctuation
   */
  cleanVoiceResponse(response) {
    if (!response) return response;
    
    let cleaned = response.trim();
    
    // AGGRESSIVE: Remove entire response if it's describing what to do instead of doing it
    if (/\b(responding|response|character|with emojis|with slang|in character)\b/i.test(cleaned)) {
      console.log('🚫 [VoiceClean] REJECTED: Response is meta-description, not actual speech');
      return null; // Force regeneration
    }
    
    // REJECT GENERIC/BORING FILLER RESPONSES
    const boringPatterns = [
      /^(i'?m not sure|i don'?t know|i can'?t (really )?say|hard to say)/i,
      /^(that'?s|it'?s) (interesting|nice|cool|weird)\s*\.?\s*$/i, // Single word reactions with no substance
      /^(oh|uh|um|well)\s*\.?\s*$/i, // Just filler words
      /^(okay|ok|alright|fine)\s*\.?\s*$/i, // Just acknowledgments
    ];
    
    for (const pattern of boringPatterns) {
      if (pattern.test(cleaned)) {
        console.log('🚫 [VoiceClean] REJECTED: Generic/boring filler response');
        return null; // Force regeneration
      }
    }
    
    // ULTRA-AGGRESSIVE: Remove system instruction leakage (anything in parentheses that looks like instructions)
    cleaned = cleaned.replace(/\(relevant memories[^)]*\)/gi, '');
    cleaned = cleaned.replace(/\(current emotions[^)]*\)/gi, '');
    cleaned = cleaned.replace(/\(social calibration[^)]*\)/gi, '');
    cleaned = cleaned.replace(/\(from [A-Z][a-z]+\)/gi, ''); // (from You), (from Username)
    cleaned = cleaned.replace(/\(in mind\)/gi, '');
    
    // Remove unnecessary uncertainty markers - just engage naturally instead
    cleaned = cleaned.replace(/\s*\(i think\?\)\s*$/gi, '');
    cleaned = cleaned.replace(/\s*\(right\?\)\s*$/gi, '');
    cleaned = cleaned.replace(/\s*\(maybe\?\)\s*$/gi, '');
    cleaned = cleaned.replace(/\s*\(idk\?\)\s*$/gi, '');
    cleaned = cleaned.replace(/\s*\(was that okay\?\)\s*$/gi, '');
    cleaned = cleaned.replace(/\s*\(tell me that was good\)\s*$/gi, '');
    
    // Remove internal monologue markers and meta-text
    cleaned = cleaned.replace(/\b(internal|Internal)\b[:\s]*/gi, '');
    cleaned = cleaned.replace(/\bedit:\s*/gi, '');
    cleaned = cleaned.replace(/Internal thoughts?:\s*/gi, '');
    cleaned = cleaned.replace(/Slunt responded with:?\s*/gi, '');
    cleaned = cleaned.replace(/Response:\s*/gi, '');
    cleaned = cleaned.replace(/Actually,?\s*I should say:?\s*/gi, '');
    cleaned = cleaned.replace(/\(.*?thinking.*?\)/gi, '');
    cleaned = cleaned.replace(/\[.*?internal.*?\]/gi, '');
    cleaned = cleaned.replace(/\bwait\s+what\s+are\s+they\s+really\s+asking\b/gi, '');
    cleaned = cleaned.replace(/\bhow\s+can\s+i\s+engage\b/gi, '');
    cleaned = cleaned.replace(/\bshould\s+i\s+reference\b/gi, '');
    cleaned = cleaned.replace(/\brespond\s+with\b/gi, '');
    cleaned = cleaned.replace(/\bhaha\s+you\s*'?r?\s+so\s+extra\b/gi, ''); // Remove the exact phrase from screenshot
    
    // Cut off at mid-sentence markers like "... anyway"
    cleaned = cleaned.replace(/\.\.\.\s*anyway.*$/gi, '.');
    cleaned = cleaned.replace(/\.\.\.\s*but.*$/gi, '.');
    cleaned = cleaned.replace(/\.\.\.\s*and.*$/gi, '.');
    
    // Remove any text after "internal" or "edit:"
    cleaned = cleaned.split(/\b(internal|edit:)/i)[0].trim();
    
    // Capitalize first letter of each sentence
    cleaned = cleaned.replace(/(^|[.!?]\s+)([a-z])/g, (match, separator, letter) => {
      return separator + letter.toUpperCase();
    });
    
    // Ensure starts with capital letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    // Ensure ends with punctuation
    if (!/[.!?]$/.test(cleaned)) {
      cleaned += '.';
    }
    
    return cleaned.trim();
  }

  /**
   * Full response processing pipeline
   */
  processResponse(rawResponse, options = {}) {
    // Step 1: Clean artifacts
    let processed = this.cleanArtifacts(rawResponse);
    
    // Step 2: Voice-specific cleaning if requested
    if (options.isVoiceMode) {
      processed = this.cleanVoiceResponse(processed);
    }
    
  // Step 3: Validate (with optional context for relevance checks)
  const validation = this.validateResponse(processed, options.context || null);
    
    if (!validation.isValid) {
      console.log(`❌ [ResponseValidator] Invalid response: ${validation.reason}`);
      return null;
    }

    // Step 4: Use cleaned version if available
    if (validation.cleaned) {
      processed = validation.cleaned;
    }

    console.log(`✅ [ResponseValidator] Response validated and cleaned`);
    return processed;
  }

  /**
   * Quick check if response looks valid without full processing
   */
  quickValidate(response) {
    if (!response || response.length < 3 || response.length > 400) {
      return false;
    }

    // Quick check for obvious broken patterns
    return !this.brokenPatterns.some(pattern => pattern.test(response));
  }
}

module.exports = ResponseValidator;