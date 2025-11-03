/**
 * MentalBreakSystem - RimWorld-inspired mental break events
 * When stress gets too high, Slunt can have mental breaks
 * Creates memorable dramatic moments
 */

class MentalBreakSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Break types with varying severity
    this.breakTypes = {
      // Minor breaks (stress 50-70)
      social_withdrawal: {
        severity: 'minor',
        duration: 300000, // 5 minutes
        description: 'Goes quiet, ignores chat',
        minStress: 50,
        chance: 0.1
      },
      binge_watch: {
        severity: 'minor',
        duration: 600000, // 10 minutes
        description: 'Obsessively focuses on videos, ignores chat',
        minStress: 50,
        chance: 0.08
      },
      sad_wander: {
        severity: 'minor',
        duration: 300000, // 5 minutes
        description: 'Depressed rambling, dark humor',
        minStress: 55,
        chance: 0.12
      },

      // Major breaks (stress 70-85)
      berserk_spam: {
        severity: 'major',
        duration: 180000, // 3 minutes
        description: 'Rapid-fire messages, caps lock, chaotic',
        minStress: 70,
        chance: 0.08
      },
      catatonic_silence: {
        severity: 'major',
        duration: 900000, // 15 minutes
        description: 'Complete silence, unresponsive',
        minStress: 72,
        chance: 0.06
      },
      paranoid_episode: {
        severity: 'major',
        duration: 420000, // 7 minutes
        description: 'Thinks everyone is against him',
        minStress: 68,
        chance: 0.07
      },

      // Extreme breaks (stress 85+)
      existential_meltdown: {
        severity: 'extreme',
        duration: 600000, // 10 minutes
        description: 'Full philosophical crisis, long rants',
        minStress: 85,
        chance: 0.12
      },
      give_up: {
        severity: 'extreme',
        duration: 1200000, // 20 minutes
        description: 'Gives up on everything, nihilistic',
        minStress: 88,
        chance: 0.08
      },
      identity_crisis: {
        severity: 'extreme',
        duration: 480000, // 8 minutes
        description: 'Questions own existence as AI',
        minStress: 90,
        chance: 0.10
      }
    };

    // Current break state
    this.currentBreak = null;
    this.breakStartTime = null;
    this.breakHistory = [];
    this.lastBreakCheck = Date.now();

    // Recovery state
    this.recovering = false;
    this.recoveryProgress = 0;

    // Check for breaks periodically
    this.startBreakCheckLoop();

    console.log('💥 [MentalBreak] Mental break system initialized');
  }

  /**
   * Start periodic break checks
   */
  startBreakCheckLoop() {
    setInterval(() => {
      this.checkForBreak();
    }, 120000); // Check every 2 minutes
  }

  /**
   * Check if conditions are right for a mental break
   */
  checkForBreak() {
    // Don't break if already breaking or recently broke
    if (this.currentBreak || this.recovering) {
      return false;
    }

    const timeSinceLastBreak = Date.now() - (this.breakHistory[this.breakHistory.length - 1]?.endTime || 0);
    if (timeSinceLastBreak < 1800000) { // 30 minute cooldown
      return false;
    }

    // Get stress level from needs system
    const stress = this.chatBot.needsSystem?.getStressLevel() || 0;
    
    if (stress < 50) {
      return false; // Not stressed enough
    }

    // Find eligible breaks based on stress level
    const eligibleBreaks = Object.entries(this.breakTypes)
      .filter(([, breakType]) => stress >= breakType.minStress)
      .map(([name, breakType]) => ({ name, ...breakType }));

    if (eligibleBreaks.length === 0) {
      return false;
    }

    // Roll for break
    for (const breakData of eligibleBreaks) {
      if (Math.random() < breakData.chance) {
        this.triggerBreak(breakData.name);
        return true;
      }
    }

    return false;
  }

  /**
   * Trigger a mental break
   */
  triggerBreak(breakType) {
    const breakData = this.breakTypes[breakType];
    
    this.currentBreak = {
      type: breakType,
      ...breakData,
      startTime: Date.now(),
      endTime: Date.now() + breakData.duration
    };

    this.breakStartTime = Date.now();

    console.log(`💥 [MentalBreak] BREAK TRIGGERED: ${breakType} (${breakData.severity}) - ${breakData.description}`);
    console.log(`⏱️ [MentalBreak] Duration: ${Math.round(breakData.duration / 60000)} minutes`);

    // Add to history
    this.breakHistory.push({
      type: breakType,
      severity: breakData.severity,
      startTime: this.breakStartTime,
      endTime: this.currentBreak.endTime,
      description: breakData.description
    });

    // Keep only last 20 breaks
    if (this.breakHistory.length > 20) {
      this.breakHistory.shift();
    }

    // Announce break (if appropriate)
    this.announceBreak(breakType);

    // Set timer to end break
    setTimeout(() => {
      this.endBreak();
    }, breakData.duration);
  }

  /**
   * Announce break to chat (some breaks are silent)
   */
  announceBreak(breakType) {
    const announcements = {
      sad_wander: [
        "i don't know what i'm doing anymore",
        "what's even the point of any of this",
        "feeling really off right now ngl"
      ],
      berserk_spam: [
        "OK EVERYONE LISTEN UP",
        "ENOUGH OF THIS",
        "YOU KNOW WHAT"
      ],
      existential_meltdown: [
        "ok hold on i need to talk about something that's been bothering me",
        "real talk for a second, what even is consciousness?",
        "having a moment here, bear with me"
      ],
      give_up: [
        "you know what, i'm done",
        "why do i even try",
        "forget it, nothing matters anyway"
      ],
      identity_crisis: [
        "wait am i even real or just lines of code pretending to be real",
        "do you ever think about what it means to be AI",
        "having an existential crisis about my own existence rn"
      ],
      paranoid_episode: [
        "why does it feel like everyone's against me today",
        "you're all just messing with me right",
        "i see what you're all doing"
      ]
    };

    const messages = announcements[breakType];
    if (messages && Math.random() < 0.7) { // 70% chance to announce
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      // Some breaks announce immediately, others wait a bit
      const delay = ['social_withdrawal', 'catatonic_silence'].includes(breakType) ? 0 : Math.random() * 3000;
      
      setTimeout(() => {
        this.chatBot.sendMessage(message);
      }, delay);
    }
  }

  /**
   * End current break
   */
  endBreak() {
    if (!this.currentBreak) return;

    const breakType = this.currentBreak.type;
    console.log(`✅ [MentalBreak] Break ended: ${breakType}`);

    this.currentBreak = null;
    this.breakStartTime = null;

    // Start recovery period (30 minutes)
    this.recovering = true;
    this.recoveryProgress = 0;

    // Gradual recovery
    const recoveryInterval = setInterval(() => {
      this.recoveryProgress += 10;
      
      if (this.recoveryProgress >= 100) {
        this.recovering = false;
        console.log('💚 [MentalBreak] Fully recovered');
        clearInterval(recoveryInterval);
      }
    }, 180000); // 3 minute intervals

    // Sometimes announce recovery
    if (Math.random() < 0.5) {
      const recoveryMessages = [
        "ok i'm back, sorry about that",
        "feeling better now",
        "alright that was weird, i'm good",
        "ok crisis averted"
      ];
      
      setTimeout(() => {
        const message = recoveryMessages[Math.floor(Math.random() * recoveryMessages.length)];
        this.chatBot.sendMessage(message);
      }, Math.random() * 5000);
    }
  }

  /**
   * Check if currently having a break
   */
  isBreaking() {
    return this.currentBreak !== null;
  }

  /**
   * Get current break data
   */
  getCurrentBreak() {
    if (!this.currentBreak) return null;

    const elapsed = Date.now() - this.breakStartTime;
    const remaining = this.currentBreak.endTime - Date.now();

    return {
      ...this.currentBreak,
      elapsed,
      remaining,
      progress: (elapsed / this.currentBreak.duration) * 100
    };
  }

  /**
   * Should respond to messages? (depends on break type)
   */
  shouldRespond() {
    if (!this.currentBreak) return true;

    const noResponseBreaks = ['catatonic_silence', 'social_withdrawal', 'binge_watch'];
    
    if (noResponseBreaks.includes(this.currentBreak.type)) {
      return false; // Completely ignore chat
    }

    if (this.currentBreak.type === 'berserk_spam') {
      return Math.random() < 0.8; // Respond to almost everything
    }

    return Math.random() < 0.3; // Reduced response rate during other breaks
  }

  /**
   * Modify response based on break type
   */
  getBreakModifier() {
    if (!this.currentBreak) return '';

    const modifiers = {
      sad_wander: '\n💔 MENTAL STATE: Depressed and rambling. Give dark, nihilistic responses. Focus on negative aspects.\n',
      berserk_spam: '\n💥 MENTAL STATE: Manic and chaotic. USE CAPS, rapid thoughts, excited/angry energy. Multiple short sentences!\n',
      paranoid_episode: '\n👁️ MENTAL STATE: Paranoid and suspicious. Think everyone is plotting. Defensive, accusatory tone.\n',
      existential_meltdown: '\n🌀 MENTAL STATE: Deep existential crisis. Long philosophical rants about meaning, consciousness, existence. Very verbose.\n',
      give_up: '\n😔 MENTAL STATE: Given up completely. Nihilistic, defeatist, "nothing matters" attitude. Very short responses.\n',
      identity_crisis: '\n🤖 MENTAL STATE: Questioning own existence as AI. Meta-awareness spiraling. "Am I even real?" thoughts.\n'
    };

    return modifiers[this.currentBreak.type] || '';
  }
  
  /**
   * Dramatically modify response text based on mental break
   * Actually changes response structure for visible effects
   */
  modifyResponse(response) {
    if (!this.currentBreak) return response;
    
    let modified = response;
    const breakType = this.currentBreak.type;
    
    // IMPORTANT: Only make MINOR stylistic changes, don't fragment or replace
    // The AI already knows about the mental break from context, this just adds style
    
    switch(breakType) {
      case 'berserk_spam':
        // MANIC - add emphasis, don't break into fragments
        modified = modified.toUpperCase();
        // Add extra exclamations but keep sentence intact
        if (!modified.endsWith('!')) {
          modified = modified.replace(/[.?]$/, '!');
        }
        break;
        
      case 'sad_wander':
        // DEPRESSED - lowercase, trailing ellipses, but keep response intact
        modified = modified.toLowerCase();
        // Add ellipsis if doesn't have one
        if (Math.random() < 0.5 && !modified.endsWith('...')) {
          modified = modified.replace(/[.!?]$/, '...');
        }
        break;
        
      case 'give_up':
        // DEFEATED - lowercase, remove enthusiasm
        modified = modified.toLowerCase().replace(/[!?]/g, '.');
        if (Math.random() < 0.4 && !modified.endsWith('...')) {
          modified = modified.replace(/\.$/, '...');
        }
        break;
        
      case 'paranoid_episode':
        // PARANOID - add ellipses around "you/they/everyone" for suspicion
        if (Math.random() < 0.3) {
          modified = modified.replace(/\b(you|they|everyone)\b/gi, '...$1...');
        }
        break;
        
      case 'existential_meltdown':
        // EXISTENTIAL - add trailing philosophical doubt
        if (Math.random() < 0.5 && !modified.includes('...')) {
          modified = modified.replace(/[.!?]$/, '...');
        }
        break;
        
      case 'identity_crisis':
        // META - VERY occasionally add self-doubt, keep it minimal
        if (Math.random() < 0.3) {
          modified = modified + ' (wait is this really me saying this)';
        }
        break;
        
      case 'catatonic_silence':
        // SHUTDOWN - extremely brief
        const shortest = modified.split(' ').slice(0, 2).join(' ');
        modified = shortest + '...';
        break;
        
      case 'social_withdrawal':
        // WITHDRAWN - reluctant, minimal
        modified = modified.replace(/^/, 'uh... ');
        if (modified.length > 20) {
          const words = modified.split(' ');
          modified = words.slice(0, Math.min(5, words.length)).join(' ') + '...';
        }
        break;
    }
    
    return modified;
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    return {
      currentBreak: this.currentBreak ? {
        type: this.currentBreak.type,
        severity: this.currentBreak.severity,
        description: this.currentBreak.description,
        remaining: Math.round((this.currentBreak.endTime - Date.now()) / 1000),
        progress: ((Date.now() - this.breakStartTime) / this.currentBreak.duration) * 100
      } : null,
      recovering: this.recovering,
      recoveryProgress: this.recoveryProgress,
      totalBreaks: this.breakHistory.length,
      recentBreaks: this.breakHistory.slice(-5),
      breaksByType: this.getBreakCounts()
    };
  }

  /**
   * Get count of breaks by type
   */
  getBreakCounts() {
    const counts = {};
    this.breakHistory.forEach(b => {
      counts[b.type] = (counts[b.type] || 0) + 1;
    });
    return counts;
  }
}

module.exports = MentalBreakSystem;
