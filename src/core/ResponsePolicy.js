// Centralized response post-processing policy
// Pure, testable transforms applied in a fixed order

class ResponsePolicy {
  constructor(config = {}) {
    this.config = Object.assign(
      {
        maxWords: 15,
        maxChars: 120,
        cutToOneSentenceWhenMulti: true,
        platformPresets: {
          coolhole: { maxWords: 15, maxChars: 120 },
          discord: { maxWords: 15, maxChars: 120 },
          twitch: { maxWords: 12, maxChars: 100 },
        },
      },
      config
    );
  }

  process(text, ctx = {}) {
    let t = String(text || '').trim();
    const diagnostics = [];

    const apply = (name, fn) => {
      const before = t;
      t = fn(t, ctx);
      if (t !== before) diagnostics.push(name);
    };

    // EARLY HARD CAP: If response is absurdly long, truncate immediately
    const wordCount = t.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 50) {
      // Take first 2 sentences max from verbose garbage
      const sentences = t.split(/[.!?]+\s+/).filter(s => s.trim().length > 5);
      t = sentences.slice(0, 2).join('. ').trim();
      if (!/[.!?]$/.test(t)) t += '.';
      diagnostics.push('hardCap');
    }

    apply('stripNarration', this.stripNarration);
    apply('removeArtifacts', this.removeArtifacts);
    apply('cutFiller', this.cutFiller);
    apply('fixRunOn', this.fixRunOn);
    apply('detectRandomTopicBlurt', this.detectRandomTopicBlurt);
    apply('fixIncomplete', this.fixIncomplete);
    apply('enforceConcision', (txt) => this.enforceConcision(txt, ctx));
    apply('finalCleanup', this.finalCleanup);

    return { text: t, diagnostics };
  }

  // Remove (Slunt sends...), *actions*, [OOC: ...]
  stripNarration(txt) {
    return txt
      .replace(/\([^)]*(?:slunt|sends|posts|shares|does|says|types|thinks)[^)]*\)/gi, '')
      .replace(/\*[^*]*\*/g, '')
      .replace(/\[[^\]]*(?:slunt|sends|posts|shares|does|action|ooc)[^\]]*\]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Remove [object Object] artifacts, duplicates, etc.
  removeArtifacts(txt) {
    return txt
      .replace(/\[object\s+Object\]/gi, '')
      .replace(/\[Object\s+object\]/gi, '')
      .replace(/\bobject\s+Object\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Remove apologetic/filler phrases and self-explanations
  cutFiller(txt) {
    let t = txt;
    t = t.replace(/^(sorry|my bad|oops|whoops|oh shit|fuck)\s+(bro|man|dude)?\s*,?\s*/gi, '');
    t = t.replace(/\s*,?\s*by the way\s*,?\s*/gi, '. ');
    t = t.replace(/\s*,?\s*i mean\s*,?\s*/gi, ' ');
    t = t.replace(/\s*,?\s*basically\s*,?\s*/gi, ' ');
    t = t.replace(/\s*,?\s*honestly\s*,?\s*/gi, ' ');
    t = t.replace(/\s*,?\s*to be honest\s*,?\s*/gi, ' ');
    t = t.replace(/\s*,?\s*like i said\s*,?\s*/gi, ' ');
    t = t.replace(/\s*,?\s*you know\s*,?\s*/gi, ' ');
    t = t.replace(/\s+since i didn'?t notice\s*/gi, ' ');
    t = t.replace(/\s+i didn'?t see that\s*/gi, ' ');
    t = t.replace(/\s+i missed that\s*/gi, ' ');
    t = t.replace(/\s+i messed up\s*/gi, ' ');
    return t.replace(/\s+/g, ' ').trim();
  }

  // Split run-ons at connectors and topic shifts
  fixRunOn(txt) {
    let t = txt;
    const connectors = /(\s(and|anyway|but|so|though|actually|too)\s)/gi;
    const clauseCount = (t.match(connectors) || []).length;
    const hasPeriods = (t.match(/[.!?]/g) || []).length;
    const sentences = t.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    let needsFix = false;
    if (clauseCount >= 2 && hasPeriods <= 1 && t.length > 80) needsFix = true;
    if (sentences.length === 1 && t.split(/\s+/).length > 30) needsFix = true;
    if (/\s(is|are)\s.*\s(is|are)\s/i.test(t) || /let'?s not forget/i.test(t)) needsFix = true;
    if (!needsFix) return t;

    let fixed = t
      .replace(/\s+anyway\s+/gi, '. Anyway ')
      .replace(/\s+though\s+/gi, '. Though ')
      .replace(/\s+actually\s+/gi, '. Actually ')
      .replace(/\s+let'?s not forget/gi, ". Let's not forget");

    // Replace excessive and-chains (2nd and 3rd occurrences)
    const andCount = (fixed.match(/\sand\s/gi) || []).length;
    if (andCount >= 2) {
      let replaced = 0;
      fixed = fixed.replace(/\sand\s/gi, (m) => (++replaced >= 2 && replaced <= 3 ? '. ' : m));
    }

    // Natural breakpoints
    const words = fixed.split(/\s+/);
    if (words.length > 40 && (fixed.match(/[.!?]/g) || []).length <= 1) {
      fixed = fixed.replace(/\s+(right|man|dude|bro|see),?\s+/gi, (m, w) => ` ${w}. `);
    }

    fixed = fixed
      .replace(/\.\s+([a-z])/g, (_, l) => '. ' + l.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
    if (!/[.!?]$/.test(fixed)) fixed += '.';
    return fixed;
  }

  // Detect and remove random topic blurts (mid-sentence topic switches)
  detectRandomTopicBlurt(txt) {
    // Pattern: random fixations without context
    const standaloneBlurtPatterns = [
      /^(dude|btw|oh|wait|also)\s+i'?m?\s+(obsessed|thinking|fixated|stuck on)\s+\w+\s*(right now|lately|today)?\.?$/i,
      /^i'?m?\s+(so\s+)?(obsessed|fixated|stuck on|thinking about)\s+\w+\s*(right now|lately|today)\.?$/i
    ];
    
    // If the ENTIRE message is just a topic blurt, suppress it
    for (const pattern of standaloneBlurtPatterns) {
      if (pattern.test(txt.trim())) {
        return ''; // Suppress completely
      }
    }
    
    const sentences = txt.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) return txt;
    
    // Patterns that indicate a sudden topic switch mid-conversation
    const topicSwitchPatterns = [
      /\b(dude|btw|oh|wait|also|speaking of|obsessed with|can't stop thinking about|reminds me of|makes me think)\s+i'?m?\s+(obsessed|thinking|wondering)/i,
      /\b(suddenly|randomly|weirdly|strangely)\s+(obsessed|fixated|thinking)/i,
      /\bi'?m?\s+(so\s+)?(obsessed|fixated|stuck on)\s+\w+\s+(right now|lately|today)/i
    ];
    
    // Check each sentence for topic switch patterns
    for (let i = 0; i < sentences.length; i++) {
      const sent = sentences[i].trim();
      const hasTopicSwitch = topicSwitchPatterns.some(p => p.test(sent));
      
      if (hasTopicSwitch) {
        // Remove this sentence and everything after it
        const result = sentences.slice(0, i).join('. ').trim();
        if (result.length > 10 && !/[.!?]$/.test(result)) {
          return result + '.';
        }
        // If we'd remove everything, suppress completely
        return '';
      }
    }
    
    return txt;
  }

  // Remove trailing incomplete clause endings
  fixIncomplete(txt) {
    // First check for trailing incomplete phrases anywhere in the text
    const trailingIncompletePhrases = [
      /\bspeaking of which.{0,50}$/i,
      /\bcan't stop thinking\s*(about\s*(it|that|this|them)?).{0,30}$/i,
      /\bthinking about\s*(it|that|this|them).{0,30}$/i,
      /\bobsessed with\s*\w+\s*(right now|lately|today)?\.?$/i,
      /\bcan't help but.{0,30}$/i,
      /\bwondering if.{0,40}$/i,
      /\breminds me of.{0,40}$/i,
      /\bmakes me think.{0,40}$/i
    ];
    
    for (const pattern of trailingIncompletePhrases) {
      if (pattern.test(txt)) {
        const cleaned = txt.replace(pattern, '').trim();
        if (cleaned.length > 10) {
          return !/[.!?]$/.test(cleaned) ? cleaned + '.' : cleaned;
        }
        // If trimming leaves too little, suppress entirely
        return '';
      }
    }
    
    // CRITICAL: Check for awkward trailing "you" - the #1 voice issue
    // Remove "about you", "what about you", or standalone "you" at end
    const trailingYouPattern = /\s+(about you|what about you|how about you|you)\s*[\.!?]?\s*$/i;
    if (trailingYouPattern.test(txt)) {
      // Check if it's part of a natural question construction
      const isNaturalQuestion = /(?:what do you think|how do you feel|are you|do you want|can you|would you|should you|did you|will you)\s*[\.!?]?\s*$/i.test(txt);
      
      if (!isNaturalQuestion) {
        // Remove the awkward trailing "you"
        const cleaned = txt.replace(trailingYouPattern, '').trim();
        if (cleaned.length > 10) {
          return !/[.!?]$/.test(cleaned) ? cleaned + '.' : cleaned;
        }
      }
    }
    
    // Then check for single trailing words (prepositions, articles)
    const parts = txt.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (parts.length === 0) return txt;
    const last = parts[parts.length - 1].trim();
    
    const trailingWordPat = /\b(my|of|a|an|the|to|for|with|in|on|at|by|from|your|his|her|their|its|this|that|these|those|gonna|wanna|gotta|tryna)\.?\s*$/i;
    
    if (!trailingWordPat.test(last)) return txt;
    
    const idx = txt.lastIndexOf(last);
    if (idx > 0) {
      let keep = txt.substring(0, idx).trim();
      if (!/[.!?]$/.test(keep)) keep += '.';
      return keep;
    }
    return txt;
  }

  enforceConcision(txt, ctx = {}) {
    const preset = this.config.platformPresets?.[ctx.platform] || {};
    const maxWords = preset.maxWords || this.config.maxWords;
    const maxChars = preset.maxChars || this.config.maxChars;
    let t = txt;

    // AGGRESSIVE: Cut to first sentence for text chat (but allow multiple for voice)
    // Voice conversations need complete thoughts with natural pacing
    const sentences = t.split(/[.!?]+\s+/).filter((s) => s.trim().length > 5);
    if (sentences.length >= 2 && ctx.platform !== 'voice') {
      t = sentences[0].trim();
      if (!/[.!?]$/.test(t)) t += '.';
    }

    // HARD ENFORCEMENT: If still over limits, truncate ruthlessly
    const words = t.split(/\s+/).filter(w => w.length > 0);
    if (words.length > maxWords) {
      // Cut at word boundary
      t = words.slice(0, maxWords).join(' ').trim();
      if (!/[.!?]$/.test(t)) t += '.';
    }
    
    if (t.length > maxChars) {
      // Try to cut at sentence; else cut at word boundary
      let truncated = t.substring(0, maxChars);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 20) {
        truncated = truncated.substring(0, lastSpace).trim();
      }
      if (!/[.!?]$/.test(truncated)) truncated += '.';
      return truncated;
    }
    
    return t;
  }

  finalCleanup(txt) {
    return txt.replace(/\s+/g, ' ').replace(/\s+\.$/, '.').trim();
  }
}

module.exports = ResponsePolicy;
