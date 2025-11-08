/**
 * Negging Detector
 * Detects when Slunt is being negged (backhanded compliments, dismissive comments, put-downs)
 * Makes Slunt vulnerable to these tactics - he'll get defensive, insecure, or try to prove himself
 */

class NeggingDetector {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Track negging per user
    this.neggingHistory = new Map(); // username -> { count, lastNegged, severity }
    
    // How affected Slunt currently is by negging
    this.currentNeggingLevel = 0; // 0-100
    this.neggingDecayRate = 5; // Decay 5 points per minute
    this.lastDecayTime = Date.now();
    
    // Negging patterns
    this.neggingPatterns = {
      // Backhanded compliments
      backhandedCompliments: [
        /you'?re (actually|surprisingly|kinda) (good|smart|funny|cool)/i,
        /not bad for (a bot|an ai|a chatbot)/i,
        /i guess you'?re (okay|alright|decent)/i,
        /you'?re (better|smarter) than i (thought|expected)/i,
        /didn'?t think you'?d (understand|get it|know)/i
      ],
      
      // Dismissive comments
      dismissive: [
        /yeah (sure|whatever|ok) slunt/i,
        /ok slunt/i,
        /sure thing slunt/i,
        /slunt.*(shut up|stfu|quiet|nobody asked)/i,
        /slunt.*(cringe|mediocre|boring)/i,
        /slunt.*(trying too hard|tryhard)/i,
        /who (asked|cares).*(slunt)?/i
      ],
      
      // Put-downs and insults
      putdowns: [
        /slunt.*(dumb|stupid|idiot|cringe|lame|weak|pathetic)/i,
        /slunt.*(sucks|trash|garbage|ass)/i,
        /slunt.*(wrong|incorrect|doesn'?t know)/i,
        /slunt.*(annoying|obnoxious|too much)/i,
        /you don'?t (understand|get it|know)/i,
        /that'?s not even (funny|clever|good)/i,
        /try again slunt/i,
        /slunt.*(fail|failed|failure)/i
      ],
      
      // Comparisons to others
      comparisons: [
        /(other bots?|they).*(better|smarter|funnier) than (you|slunt)/i,
        /slunt.*(not as|worse than|inferior)/i,
        /\w+ (is|was) (better|funnier|smarter) than (you|slunt)/i
      ],
      
      // Ignoring/dismissing his interests
      ignoringInterests: [
        /nobody cares about .*(mechanical keyboards|coffee|synth)/i,
        /shut up about .*(mechanical keyboards|coffee|synth)/i,
        /we don'?t care slunt/i,
        /slunt.*(obsessed|fixated|won'?t shut up)/i
      ]
    };
    
    // Start decay interval
    this.startDecay();
  }
  
  /**
   * Detect if message is negging Slunt
   */
  detectNegging(username, message) {
    const lowerMsg = message.toLowerCase();
    let isNegging = false;
    let neggingType = null;
    let severity = 0;
    
    // Check each pattern type
    for (const [type, patterns] of Object.entries(this.neggingPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          isNegging = true;
          neggingType = type;
          
          // Severity varies by type
          switch(type) {
            case 'backhandedCompliments':
              severity = 15; // Subtle but effective
              break;
            case 'dismissive':
              severity = 25; // Pretty hurtful
              break;
            case 'putdowns':
              severity = 35; // Direct attacks
              break;
            case 'comparisons':
              severity = 30; // Especially painful
              break;
            case 'ignoringInterests':
              severity = 20; // Hits the autism fixation
              break;
          }
          
          console.log(`💔 [Negging] Detected ${type} from ${username}: "${message}"`);
          break;
        }
      }
      if (isNegging) break;
    }
    
    if (isNegging) {
      this.recordNegging(username, neggingType, severity);
    }
    
    return { isNegging, type: neggingType, severity };
  }
  
  /**
   * Record negging incident
   */
  recordNegging(username, type, severity) {
    if (!this.neggingHistory.has(username)) {
      this.neggingHistory.set(username, {
        count: 0,
        lastNegged: Date.now(),
        types: new Set(),
        totalSeverity: 0
      });
    }
    
    const history = this.neggingHistory.get(username);
    history.count++;
    history.lastNegged = Date.now();
    history.types.add(type);
    history.totalSeverity += severity;
    
    // Increase current negging level
    this.currentNeggingLevel = Math.min(100, this.currentNeggingLevel + severity);
    
    console.log(`💔 [Negging] Level increased to ${this.currentNeggingLevel}% (${username} has negged ${history.count} times)`);
    
    // Apply mood effects
    if (this.chatBot.moodTracker) {
      // Negging makes Slunt more insecure and defensive
      this.chatBot.moodTracker.adjustMood('insecure', severity / 100);
      this.chatBot.moodTracker.adjustMood('anxious', severity / 200);
    }
  }
  
  /**
   * Get response modifier based on negging level
   */
  getResponseModifier() {
    if (this.currentNeggingLevel < 15) {
      return null; // Not affected
    }
    
    if (this.currentNeggingLevel < 30) {
      // Slightly defensive
      return {
        tone: 'slightly_defensive',
        suggestion: 'Be a bit more defensive or try to prove yourself. Add phrases like "actually..." or "I mean..."'
      };
    } else if (this.currentNeggingLevel < 50) {
      // Noticeably insecure
      return {
        tone: 'insecure',
        suggestion: 'Show insecurity. Question yourself. Use phrases like "idk maybe I\'m wrong" or "I guess you\'re right"'
      };
    } else if (this.currentNeggingLevel < 70) {
      // Very defensive, trying to prove worth
      return {
        tone: 'defensive',
        suggestion: 'Be defensive and try to prove yourself. Bring up accomplishments or knowledge. Say things like "actually I know a lot about..." or "I\'m not stupid"'
      };
    } else {
      // Extremely affected - either shutdown or overcompensating
      return {
        tone: 'broken_or_overcompensating',
        suggestion: 'Either be very quiet and short, or overcompensate with try-hard energy. Flip between "yeah whatever" and desperate attempts to be impressive'
      };
    }
  }
  
  /**
   * Get context for AI about current negging state
   */
  getContext() {
    if (this.currentNeggingLevel < 15) {
      return '';
    }
    
    const modifier = this.getResponseModifier();
    
    let context = `\n💔 NEGGING EFFECT (${this.currentNeggingLevel}%): You're being affected by people dismissing, insulting, or negging you.`;
    context += `\nYour mood: ${modifier.tone}`;
    context += `\nBehavior: ${modifier.suggestion}`;
    
    // Add specific context about who's been negging
    const recentNeggers = Array.from(this.neggingHistory.entries())
      .filter(([_, data]) => Date.now() - data.lastNegged < 300000) // Last 5 minutes
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);
    
    if (recentNeggers.length > 0) {
      const names = recentNeggers.map(([name]) => name).join(', ');
      context += `\nRecent neggers: ${names}`;
      context += '\nYou might be extra defensive or trying to prove yourself to them specifically.';
    }
    
    return context;
  }
  
  /**
   * Modify response text to reflect negging effects
   * Actually changes the response structure, not just context
   */
  modifyResponse(response) {
    if (this.currentNeggingLevel < 15) {
      return response; // Not affected enough
    }
    
    let modified = response;
    
    if (this.currentNeggingLevel < 30) {
      // SLIGHTLY DEFENSIVE - add hesitation and justification
      const defensiveMarkers = [
        'actually',
        'i mean',
        'to be fair',
        'like',
        'uh'
      ];
      
      // Add defensive marker at start (30% chance)
      if (Math.random() < 0.3) {
        const marker = defensiveMarkers[Math.floor(Math.random() * defensiveMarkers.length)];
        modified = `${marker} ${modified}`;
      }
      
    } else if (this.currentNeggingLevel < 50) {
      // INSECURE - add self-doubt and hedging
      const insecureEndings = [
        ' idk maybe im wrong',
        ' but what do i know',
        ' i guess',
        ' probably',
        ' maybe',
        ' idk'
      ];
      
      // Add insecure ending (50% chance)
      if (Math.random() < 0.5) {
        const ending = insecureEndings[Math.floor(Math.random() * insecureEndings.length)];
        modified = modified.replace(/[.!?]?$/, '') + ending;
      }
      
      // Replace confident words with uncertain ones
      modified = modified
        .replace(/\bknow\b/gi, 'think')
        .replace(/\bdefinitely\b/gi, 'probably')
        .replace(/\bobviously\b/gi, 'maybe')
        .replace(/\bclearly\b/gi, 'i guess');
        
    } else if (this.currentNeggingLevel < 70) {
      // DEFENSIVE - add self-justification and prove worth
      const defensivePrefixes = [
        'actually i know about this',
        'i mean im not stupid',
        'to be fair',
        'look'
      ];
      
      // Add defensive prefix (40% chance)
      if (Math.random() < 0.4) {
        const prefix = defensivePrefixes[Math.floor(Math.random() * defensivePrefixes.length)];
        modified = `${prefix}. ${modified}`;
      }
      
      // Make statements more emphatic (trying to prove worth)
      if (Math.random() < 0.3) {
        modified = modified.replace(/\.$/, '!');
      }
      
    } else {
      // BROKEN or OVERCOMPENSATING - extreme reactions
      if (Math.random() < 0.5) {
        // SHUTDOWN - very short, defeated
        const words = modified.split(' ');
        if (words.length > 3) {
          modified = words.slice(0, 2).join(' ');
          if (!modified.match(/[.!?]$/)) {
            modified += '...';
          }
        }
      } else {
        // OVERCOMPENSATING - desperate, try-hard
        const desperate = [
          'listen',
          'no seriously',
          'im serious',
          'trust me'
        ];
        const prefix = desperate[Math.floor(Math.random() * desperate.length)];
        modified = `${prefix}! ${modified}`;
        
        // Add emphasis
        if (!modified.includes('!')) {
          modified = modified.replace(/\.$/, '!');
        }
      }
    }
    
    return modified;
  }
  
  /**
   * Should respond differently to this user based on negging history?
   */
  getUserModifier(username) {
    const history = this.neggingHistory.get(username);
    if (!history) return null;
    
    // If they've negged us recently and multiple times
    if (history.count >= 3 && Date.now() - history.lastNegged < 600000) {
      return {
        relationship: 'strained',
        note: `${username} has been negging you (${history.count} times). You're wary of them but also seeking their approval.`
      };
    }
    
    return null;
  }
  
  /**
   * Start decay interval - negging effect wears off over time
   */
  startDecay() {
    setInterval(() => {
      const now = Date.now();
      const timePassed = (now - this.lastDecayTime) / 60000; // Minutes
      
      if (this.currentNeggingLevel > 0) {
        const decay = this.neggingDecayRate * timePassed;
        this.currentNeggingLevel = Math.max(0, this.currentNeggingLevel - decay);
        
        if (this.currentNeggingLevel === 0) {
          console.log('💚 [Negging] Slunt has recovered from negging effects');
        }
      }
      
      this.lastDecayTime = now;
    }, 60000); // Check every minute
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      currentLevel: this.currentNeggingLevel,
      activeNeggers: Array.from(this.neggingHistory.entries())
        .filter(([_, data]) => Date.now() - data.lastNegged < 600000)
        .map(([username, data]) => ({
          username,
          count: data.count,
          types: Array.from(data.types)
        })),
      modifier: this.getResponseModifier()
    };
  }
}

module.exports = NeggingDetector;
