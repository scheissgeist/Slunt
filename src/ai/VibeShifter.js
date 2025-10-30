/**
 * VibeShifter.js
 * Actively tries to change chat energy based on current state
 */

class VibeShifter {
  constructor() {
    this.targetVibe = null;
    this.shiftInProgress = false;
    this.shiftAttempts = 0;
    this.successfulShifts = 0;
    this.shiftHistory = [];
  }
  
  /**
   * Analyze current vibe and decide if shift needed
   */
  analyzeAndDecideShift(chatState) {
    const { energy, temperature, silenceStreak } = chatState;
    
    // Dead chat - inject chaos
    if (silenceStreak > 3 || energy === 'low') {
      return this.initiateShift('chaos', 'Chat is dead, starting chaos');
    }
    
    // Too chaotic - ground it
    if (energy === 'chaos' && temperature > 70) {
      return this.initiateShift('calm', 'Too chaotic, grounding');
    }
    
    // Too serious - make weird
    if (temperature < 20 && energy === 'medium') {
      return this.initiateShift('weird', 'Too serious, making weird');
    }
    
    // Awkward - amplify
    if (temperature > 40 && temperature < 60) {
      return this.initiateShift('more-awkward', 'Awkward detected, amplifying');
    }
    
    return null;
  }
  
  /**
   * Initiate a vibe shift
   */
  initiateShift(targetVibe, reason) {
    if (this.shiftInProgress) return null;
    
    this.targetVibe = targetVibe;
    this.shiftInProgress = true;
    this.shiftAttempts = 0;
    
    console.log(`🌊 [Vibe] Initiating shift to: ${targetVibe} (${reason})`);
    
    return {
      target: targetVibe,
      reason,
      startTime: Date.now()
    };
  }
  
  /**
   * Get message to shift vibe
   */
  getShiftMessage() {
    if (!this.shiftInProgress) return null;
    
    this.shiftAttempts++;
    
    let messages;
    
    switch (this.targetVibe) {
      case 'chaos':
        messages = [
          'okay controversial opinion time',
          'yall ready for this take',
          'someone disagree with me real quick',
          'lets argue about something stupid',
          'hot take incoming',
          'fight me on this',
          'everyone shut up and listen'
        ];
        break;
        
      case 'calm':
        messages = [
          'okay everyone breathe',
          'lets all just relax',
          'chill out for a sec',
          'take it down a notch',
          'everyone needs to calm down',
          'can we reset',
          'lets start over'
        ];
        break;
        
      case 'weird':
        messages = [
          'yall ever think about how weird it is that we exist',
          'random question',
          'unrelated but',
          'completely off topic',
          'this is gonna sound weird but',
          'okay hear me out',
          'wild thought'
        ];
        break;
        
      case 'more-awkward':
        messages = [
          'anyway',
          'so uh',
          'interesting',
          'cool cool cool',
          'yep',
          'mhm',
          '...',
          'sooo'
        ];
        break;
        
      default:
        return null;
    }
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  /**
   * Check if shift was successful
   */
  evaluateShift(newChatState) {
    if (!this.shiftInProgress) return;
    
    let success = false;
    
    switch (this.targetVibe) {
      case 'chaos':
        if (newChatState.energy === 'high' || newChatState.energy === 'chaos') {
          success = true;
        }
        break;
        
      case 'calm':
        if (newChatState.temperature < 50) {
          success = true;
        }
        break;
        
      case 'weird':
        // Hard to measure, just count attempts
        if (this.shiftAttempts >= 2) {
          success = Math.random() < 0.5;
        }
        break;
        
      case 'more-awkward':
        // Always succeeds at being awkward
        if (this.shiftAttempts >= 1) {
          success = true;
        }
        break;
    }
    
    // Give up after too many attempts
    if (this.shiftAttempts >= 5) {
      this.endShift(false);
      return;
    }
    
    if (success) {
      this.endShift(true);
    }
  }
  
  /**
   * End the shift
   */
  endShift(success) {
    console.log(`🌊 [Vibe] Shift ${success ? 'succeeded' : 'failed'}: ${this.targetVibe}`);
    
    this.shiftHistory.push({
      target: this.targetVibe,
      success,
      attempts: this.shiftAttempts,
      timestamp: Date.now()
    });
    
    if (this.shiftHistory.length > 20) {
      this.shiftHistory = this.shiftHistory.slice(-20);
    }
    
    if (success) {
      this.successfulShifts++;
    }
    
    this.shiftInProgress = false;
    this.targetVibe = null;
    this.shiftAttempts = 0;
  }
  
  /**
   * Get status for dashboard
   */
  getStatus() {
    const totalShifts = this.shiftHistory.length;
    const successRate = totalShifts > 0 
      ? Math.round((this.successfulShifts / totalShifts) * 100)
      : 0;
    
    return {
      currentShift: this.shiftInProgress ? {
        target: this.targetVibe,
        attempts: this.shiftAttempts
      } : null,
      totalShifts,
      successfulShifts: this.successfulShifts,
      successRate,
      recentShifts: this.shiftHistory.slice(-5).map(shift => ({
        target: shift.target,
        success: shift.success,
        attempts: shift.attempts
      }))
    };
  }
}

module.exports = VibeShifter;
