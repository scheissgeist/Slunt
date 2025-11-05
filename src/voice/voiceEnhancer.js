/**
 * Voice Enhancer - Makes voice responses more natural, engaging, and memorable
 * Implements improvements from VOICE-NEXT-LEVEL.md
 */

class VoiceEnhancer {
  constructor() {
    // Context-aware verbal fillers
    this.fillers = {
      thinking: ['uh...', 'hmm...', 'let me think...', '...wait...'],
      disagreeing: ['ehhh...', 'see here\'s the thing...', 'okay but...', 'nah see...'],
      excited: ['oh shit', 'dude', 'wait wait wait', 'okay okay'],
      embarrassed: ['uh...', 'I mean...', 'well...', 'like...'],
      remembering: ['oh wait', 'actually', 'hold on', 'oh yeah'],
      skeptical: ['mmm...', 'sure...', 'uh huh...', 'right...']
    };

    // Vocal reactions
    this.vocalReactions = {
      surprised: ['*sharp inhale*', 'HUHHH?', '*spits drink*', 'yo WHAT'],
      amused: ['*chuckles*', 'heh', '*trying not to laugh*', '*wheeze*'],
      disgusted: ['eugh', '*gag*', 'bruh', 'yuck'],
      pondering: ['*long pause*', '....', '*hmm...*', '*trails off*']
    };

    // Random quirks to apply occasionally
    this.quirks = [
      {
        name: 'laugh_during',
        chance: 0.1,
        apply: (text) => {
          const words = text.split(' ');
          const mid = Math.floor(words.length / 2);
          words.splice(mid, 0, '*laughs*');
          return words.join(' ');
        }
      },
      {
        name: 'trail_off',
        chance: 0.08,
        apply: (text) => {
          if (text.length > 50) {
            return text.slice(0, -10) + '... you know what I mean';
          }
          return text;
        }
      },
      {
        name: 'voice_crack',
        chance: 0.05,
        apply: (text) => {
          if (/OH SHIT|WAIT|WHAT THE/i.test(text)) {
            return text.replace(/(OH SHIT|WAIT|WHAT THE)/i, '$1—*clears throat*');
          }
          return text;
        }
      }
    ];
  }

  /**
   * Detect emotion from response text
   */
  detectEmotion(text) {
    if (/holy shit|oh fuck|what the|no way|WAIT/i.test(text)) {
      return 'surprised';
    }
    if (/haha|that's hilarious|so funny|lmao/i.test(text)) {
      return 'amused';
    }
    if (/sure buddy|yeah right|totally|obviously/i.test(text)) {
      return 'sarcastic';
    }
    if (/excited|hyped|can't wait|let's go/i.test(text)) {
      return 'excited';
    }
    if (/wait what|huh|confused/i.test(text)) {
      return 'confused';
    }
    return 'normal';
  }

  /**
   * Get voice style parameters based on detected emotion
   */
  getVoiceStyle(text, emotion) {
    const style = {
      speed: 1.3, // base speed
      pitch: 0,
      emphasis: []
    };

    // SARCASM - slower, lower pitch
    if (emotion === 'sarcastic' || /sure buddy|yeah right|totally|obviously/i.test(text)) {
      style.speed = 0.85;
      style.pitch = -3;
      style.tone = 'sarcastic';
    }
    // EXCITEMENT - faster, higher pitch
    else if (emotion === 'excited' || /holy shit|oh fuck|no way|WAIT|let's go/i.test(text)) {
      style.speed = 1.5;
      style.pitch = +5;
      style.tone = 'excited';
    }
    // STORYTELLING - slower, more dramatic
    else if (/so basically|one time|this guy|back when/i.test(text)) {
      style.speed = 1.1;
      style.tone = 'storytelling';
    }
    // ROASTING - deliberate, emphasized
    else if (/imagine|cope|cringe|L take/i.test(text)) {
      style.speed = 1.0;
      style.tone = 'roasting';
    }

    return style;
  }

  /**
   * Add context-aware verbal fillers
   */
  addVoiceFillers(text, emotion) {
    // If challenging someone - add disagreement fillers
    if (/nah|wrong|disagree|bullshit/i.test(text)) {
      const filler = this.fillers.disagreeing[Math.floor(Math.random() * this.fillers.disagreeing.length)];
      return filler + ' ' + text;
    }

    // If making a claim - add thinking filler
    if (/actually|honestly|basically/i.test(text)) {
      const filler = this.fillers.thinking[Math.floor(Math.random() * this.fillers.thinking.length)];
      return filler + ' ' + text;
    }

    // If excited - inject mid-sentence
    if (emotion === 'excited') {
      const words = text.split(' ');
      const insertPoint = Math.floor(words.length / 3);
      words.splice(insertPoint, 0, this.fillers.excited[0]);
      return words.join(' ');
    }

    return text;
  }

  /**
   * Add vocal reactions
   */
  addVocalReactions(text, emotion) {
    // Surprised reactions
    if (emotion === 'surprised' && Math.random() > 0.6) {
      return this.vocalReactions.surprised[0] + ' ' + text;
    }

    // Add reaction after wild statements
    if (/that's wild|insane|crazy|wtf/i.test(text)) {
      return text + ' ' + this.vocalReactions.surprised[1];
    }

    // If joking, laugh at own joke
    if (/imagine|cope|💀/i.test(text)) {
      return text + ' ' + this.vocalReactions.amused[0];
    }

    return text;
  }

  /**
   * Add mid-sentence interruptions
   */
  addSelfInterruptions(text) {
    // Only do this 20% of the time
    if (Math.random() > 0.2) return text;

    const interruptions = [
      {
        trigger: /actually/i,
        insert: '—wait no, ',
        explanation: 'catches himself correcting'
      },
      {
        trigger: /remember/i,
        insert: '—oh shit yeah, ',
        explanation: 'sudden memory'
      },
      {
        trigger: /but /i,
        insert: '—actually you know what, ',
        explanation: 'changes direction'
      }
    ];

    for (const inter of interruptions) {
      if (inter.trigger.test(text)) {
        text = text.replace(inter.trigger, (match) => inter.insert + match);
        break; // Only one interruption per response
      }
    }

    return text;
  }

  /**
   * Apply random quirks
   */
  applyRandomQuirk(text) {
    for (const quirk of this.quirks) {
      if (Math.random() < quirk.chance) {
        return quirk.apply(text);
      }
    }
    return text;
  }

  /**
   * Main enhancement pipeline
   */
  enhance(text, options = {}) {
    if (!text || text.length < 3) return text;

    let enhanced = text.trim();

    // CRITICAL FIX: Remove awkward trailing "you" FIRST
    const trailingYouPattern = /\s+(about you|what about you|how about you|you)\s*[\.!?]?\s*$/i;
    if (trailingYouPattern.test(enhanced)) {
      const isNaturalQuestion = /(?:what do you think|how do you feel|are you|do you want|can you|would you|should you|did you|will you)\s*[\.!?]?\s*$/i.test(enhanced);
      if (!isNaturalQuestion) {
        enhanced = enhanced.replace(trailingYouPattern, '.').trim();
        console.log('🔧 [VoiceEnhancer] Fixed awkward trailing "you"');
      }
    }

    // 1. Detect emotion
    const emotion = this.detectEmotion(enhanced);

    // 2. Add verbal fillers (20% chance)
    if (Math.random() > 0.8) {
      enhanced = this.addVoiceFillers(enhanced, emotion);
    }

    // 3. Add self-interruptions (20% chance)
    enhanced = this.addSelfInterruptions(enhanced);

    // 4. Add vocal reactions (30% chance)
    if (Math.random() > 0.7) {
      enhanced = this.addVocalReactions(enhanced, emotion);
    }

    // 5. Apply random quirk (cumulative chances from all quirks)
    enhanced = this.applyRandomQuirk(enhanced);

    // 6. Get voice style parameters
    const voiceStyle = this.getVoiceStyle(enhanced, emotion);

    return {
      text: enhanced,
      voiceStyle,
      emotion
    };
  }
}

module.exports = VoiceEnhancer;
