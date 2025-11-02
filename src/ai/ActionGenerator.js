/**
 * Action Generator
 * Adds subtle action descriptions with asterisks like *yawn* or *sighs*
 * Based on mood and context - excluded when being obnoxious
 */

class ActionGenerator {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.lastActionTime = 0;
    this.actionCooldown = 45000; // 45 seconds between actions
    
    // Map moods to appropriate actions
    this.moodActions = {
      // Tired/low energy
      tired: ['yawns', 'rubs eyes', 'stretches', 'yawns again'],
      exhausted: ['yawns deeply', 'rubs face', 'sighs tiredly'],
      sleepy: ['yawns', 'blinks slowly', 'nods off'],
      
      // Annoyed/frustrated
      annoyed: ['sighs', 'rolls eyes', 'groans', 'shrugs'],
      frustrated: ['sighs heavily', 'rubs temples', 'groans'],
      irritated: ['sighs', 'twitches', 'grumbles'],
      
      // Sad/down
      sad: ['sighs', 'looks down', 'frowns'],
      melancholy: ['sighs wistfully', 'stares into distance'],
      depressed: ['sighs deeply', 'slumps'],
      
      // Happy/positive
      happy: ['grins', 'smiles', 'chuckles'],
      excited: ['grins widely', 'bounces', 'perks up'],
      cheerful: ['smiles', 'hums', 'grins'],
      
      // Anxious/stressed
      anxious: ['fidgets', 'shifts nervously', 'bites lip'],
      stressed: ['rubs neck', 'sighs', 'tenses up'],
      nervous: ['fidgets', 'wrings hands', 'shifts weight'],
      
      // Neutral/calm
      neutral: ['shrugs', 'nods', 'tilts head'],
      calm: ['nods slowly', 'breathes', 'sits back'],
      relaxed: ['leans back', 'stretches', 'yawns'],
      
      // Thoughtful
      contemplative: ['pauses thoughtfully', 'strokes chin', 'hmms'],
      philosophical: ['stares into distance', 'ponders', 'tilts head'],
      pensive: ['pauses', 'looks thoughtful', 'hmms'],
      
      // Surprised/confused
      surprised: ['blinks', 'raises eyebrow', 'does double-take'],
      confused: ['tilts head', 'scratches head', 'squints'],
      bewildered: ['blinks rapidly', 'stares', 'shakes head']
    };
    
    // Generic fallback actions
    this.genericActions = [
      'shrugs',
      'nods',
      'sighs',
      'pauses',
      'blinks'
    ];
  }
  
  /**
   * Decide if we should add an action to this response
   */
  shouldAddAction(messageLength, context = {}) {
    // Check cooldown
    const now = Date.now();
    if (now - this.lastActionTime < this.actionCooldown) {
      return false;
    }
    
    // Don't add actions on Discord unless being obnoxious/aggressive
    // (Actions in Discord look annoying unless intentionally trying to be annoying)
    if (context.platform === 'discord') {
      const isBeingObnoxious = 
        (this.chatBot.umbraProtocol && this.chatBot.umbraProtocol.isActive) ||
        (this.chatBot.mentalBreakSystem && this.chatBot.mentalBreakSystem.currentBreak &&
         (this.chatBot.mentalBreakSystem.currentBreak.type === 'aggressive' || 
          this.chatBot.mentalBreakSystem.currentBreak.type === 'manic'));
      
      if (!isBeingObnoxious) {
        return false; // Don't use actions in Discord when being normal
      }
    }
    
    // Don't add actions when being obnoxious/aggressive (on other platforms)
    if (context.platform !== 'discord') {
      if (this.chatBot.umbraProtocol && this.chatBot.umbraProtocol.isActive) {
        return false; // No subtle actions when bragging
      }
      
      // Don't add during aggressive mental breaks
      if (this.chatBot.mentalBreakSystem && this.chatBot.mentalBreakSystem.currentBreak) {
        const breakType = this.chatBot.mentalBreakSystem.currentBreak.type;
        if (breakType === 'aggressive' || breakType === 'manic') {
          return false; // No subtle actions during aggressive/manic episodes
        }
      }
    }
    
    // Don't add to very short messages (under 30 chars)
    if (messageLength < 30) {
      return false;
    }
    
    // Don't add to messages that already have actions/emotes
    if (context.hasEmote || context.hasTrick) {
      return false;
    }
    
    // 12% chance to add action (subtle, not every message)
    return Math.random() < 0.12;
  }
  
  /**
   * Get an appropriate action based on current mood
   */
  getAction() {
    const mood = this.chatBot.moodTracker ? 
      this.chatBot.moodTracker.getMood() : 
      'neutral';
    
    // Get actions for this mood
    const moodKey = mood.toLowerCase();
    let availableActions = this.moodActions[moodKey] || this.genericActions;
    
    // If mood not found, try to find similar moods
    if (!this.moodActions[moodKey]) {
      // Check for partial matches
      for (const [key, actions] of Object.entries(this.moodActions)) {
        if (moodKey.includes(key) || key.includes(moodKey)) {
          availableActions = actions;
          break;
        }
      }
    }
    
    // Pick random action from available set
    const action = availableActions[Math.floor(Math.random() * availableActions.length)];
    
    // Update cooldown
    this.lastActionTime = Date.now();
    
    return action;
  }
  
  /**
   * Add action to message if appropriate
   */
  maybeAddAction(message, context = {}) {
    if (!this.shouldAddAction(message.length, context)) {
      return message;
    }
    
    const action = this.getAction();
    
    // Decide where to place the action
    // 70% of the time: after the message
    // 30% of the time: before the message (if message is longer)
    const placeAfter = Math.random() < 0.7 || message.length < 50;
    
    if (placeAfter) {
      return `${message} *${action}*`;
    } else {
      return `*${action}* ${message}`;
    }
  }
  
  /**
   * Get current state for debugging
   */
  getState() {
    return {
      lastActionTime: this.lastActionTime,
      cooldownRemaining: Math.max(0, this.actionCooldown - (Date.now() - this.lastActionTime)),
      canAct: Date.now() - this.lastActionTime >= this.actionCooldown
    };
  }
}

module.exports = ActionGenerator;
