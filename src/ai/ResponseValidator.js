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
      /\{[^}]*$/,           // Unclosed braces
      /"[^"]*$/,            // Unclosed quotes
      /\.\.\.\s*$/,         // Trailing ellipsis (often incomplete)
      /\s+and$/i,           // Ends with "and"
      /\s+but$/i,           // Ends with "but"
      /\s+the$/i,           // Ends with "the"
      /\s+a$/i,             // Ends with "a"
      /\s+to$/i,            // Ends with "to"
      /\s+of$/i,            // Ends with "of"
      /\s+in$/i,            // Ends with "in"
      /\s+is$/i,            // Ends with "is"
      /\s+was$/i,           // Ends with "was"
      /\s+like$/i           // Ends with "like"
    ];

    // Patterns that indicate nonsensical content
    this.nonsensicalPatterns = [
      /\b[A-Z]{3,}\b/,                    // Random all-caps words
      /\b\w{15,}\b/,                      // Extremely long words
      /(\w)\1{4,}/,                       // Repeated characters (aaaaa)
      /[0-9]{8,}/,                        // Long random numbers
      /\b[a-z]+[A-Z][a-z]+[A-Z]/,       // WeirdCamelCase
      /\b(SLANGRA|BLARGON|FLEXTRON)\b/i   // Made-up words that appear in corruption
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
  validateResponse(response) {
    if (!response || typeof response !== 'string') {
      return { isValid: false, reason: 'empty_or_invalid' };
    }

    const trimmed = response.trim();
    
    // Check minimum length
    if (trimmed.length < 3) {
      return { isValid: false, reason: 'too_short' };
    }

    // Check maximum length (prevent rambling)
    if (trimmed.length > 400) {
      return { isValid: false, reason: 'too_long' };
    }

    // Check for broken patterns
    for (const pattern of this.brokenPatterns) {
      if (pattern.test(trimmed)) {
        console.log(`❌ [ResponseValidator] Broken pattern detected: ${pattern}`);
        return { isValid: false, reason: 'broken_syntax', pattern: pattern.toString() };
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

    return { isValid: true, cleaned: trimmed };
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

    return cleaned.trim();
  }

  /**
   * Full response processing pipeline
   */
  processResponse(rawResponse) {
    // Step 1: Clean artifacts
    let processed = this.cleanArtifacts(rawResponse);
    
    // Step 2: Validate
    const validation = this.validateResponse(processed);
    
    if (!validation.isValid) {
      console.log(`❌ [ResponseValidator] Invalid response: ${validation.reason}`);
      return null;
    }

    // Step 3: Use cleaned version if available
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