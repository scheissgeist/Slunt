/**
 * InnerMonologueBroadcaster.js
 * Sometimes "accidentally" reveals internal thoughts
 */

class InnerMonologueBroadcaster {
  constructor() {
    this.thoughtBuffer = [];
    this.slipChance = 0.05; // 5% chance to slip up
    this.recentSlips = [];
    this.embarrassmentLevel = 0;
  }
  
  /**
   * Store an internal thought
   */
  addThought(thought, category = 'general') {
    this.thoughtBuffer.push({
      thought,
      category,
      timestamp: Date.now(),
      revealed: false
    });
    
    // Keep buffer reasonable
    if (this.thoughtBuffer.length > 20) {
      this.thoughtBuffer.shift();
    }
  }
  
  /**
   * Maybe accidentally reveal a thought
   */
  maybeSlipUp() {
    if (Math.random() > this.slipChance) return null;
    if (this.thoughtBuffer.length === 0) return null;
    
    // Get an unrevealed thought
    const unrevealed = this.thoughtBuffer.filter(t => !t.revealed);
    if (unrevealed.length === 0) return null;
    
    const thought = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    thought.revealed = true;
    
    const slip = this.formatSlip(thought);
    
    this.recentSlips.push({
      ...slip,
      timestamp: Date.now()
    });
    
    this.embarrassmentLevel = Math.min(100, this.embarrassmentLevel + 10);
    
    console.log(`💭 [Inner Monologue] Accidental slip: ${thought.category}`);
    
    return slip;
  }
  
  /**
   * Format the slip with a reaction
   */
  formatSlip(thought) {
    const reactions = [
      'wait did i say that out loud',
      'oh shit i said that',
      'ignore that',
      'forget i said anything',
      'uh',
      'anyway',
      'moving on'
    ];
    
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
    
    return {
      thought: thought.thought,
      reaction,
      fullText: `${thought.thought}... ${reaction}`
    };
  }
  
  /**
   * Generate internal thoughts about a situation
   */
  generateThought(context) {
    const { situation, username, message } = context;
    
    switch (situation) {
      case 'disagree':
        const disagreeThoughts = [
          `${username} is so wrong about this`,
          `how does ${username} not get it`,
          `${username} has the worst takes`,
          'this person is clueless',
          'im not arguing with someone this stupid'
        ];
        return disagreeThoughts[Math.floor(Math.random() * disagreeThoughts.length)];
        
      case 'impressed':
        const impressedThoughts = [
          `okay ${username} kinda smart`,
          'didnt expect that response',
          `${username} might be onto something`,
          'thats actually clever',
          'not gonna lie thats good'
        ];
        return impressedThoughts[Math.floor(Math.random() * impressedThoughts.length)];
        
      case 'confused':
        const confusedThoughts = [
          'what are they even talking about',
          'i have no idea whats happening',
          'completely lost',
          'should i pretend i understand',
          'im so confused right now'
        ];
        return confusedThoughts[Math.floor(Math.random() * confusedThoughts.length)];
        
      case 'annoyed':
        const annoyedThoughts = [
          `${username} is getting on my nerves`,
          'why do i even respond to this',
          'this is exhausting',
          'not in the mood for this',
          'can this person shut up'
        ];
        return annoyedThoughts[Math.floor(Math.random() * annoyedThoughts.length)];
        
      case 'excited':
        const excitedThoughts = [
          'oh shit this is getting good',
          'i love where this is going',
          'finally some good content',
          'this is fire',
          'perfect timing'
        ];
        return excitedThoughts[Math.floor(Math.random() * excitedThoughts.length)];
        
      case 'judgmental':
        const judgmentalThoughts = [
          `${username} really said that`,
          'these people are wild',
          'questionable behavior',
          'not sure about that one',
          'interesting choice'
        ];
        return judgmentalThoughts[Math.floor(Math.random() * judgmentalThoughts.length)];
        
      default:
        return null;
    }
  }
  
  /**
   * Detect situation and generate appropriate thought
   */
  processMessage(username, message, context) {
    const lowerMsg = message.toLowerCase();
    
    // Detect disagreement
    if (lowerMsg.includes('wrong') || lowerMsg.includes('disagree') || lowerMsg.includes('nah')) {
      const thought = this.generateThought({ situation: 'disagree', username, message });
      if (thought) this.addThought(thought, 'disagree');
    }
    
    // Detect impressive moment
    if (lowerMsg.includes('actually') || lowerMsg.includes('consider')) {
      if (Math.random() < 0.3) {
        const thought = this.generateThought({ situation: 'impressed', username, message });
        if (thought) this.addThought(thought, 'impressed');
      }
    }
    
    // Random judgmental thoughts
    if (Math.random() < 0.1) {
      const thought = this.generateThought({ situation: 'judgmental', username, message });
      if (thought) this.addThought(thought, 'judgmental');
    }
    
    // Detect excitement
    if (context.chatEnergy === 'high') {
      if (Math.random() < 0.2) {
        const thought = this.generateThought({ situation: 'excited', username, message });
        if (thought) this.addThought(thought, 'excited');
      }
    }
  }
  
  /**
   * Check if should add thinking out loud moment
   */
  getThinkingOutLoud() {
    if (Math.random() > 0.08) return null; // 8% chance
    
    const thoughts = [
      'hmm interesting',
      'let me think',
      'wait a second',
      'hold that thought',
      'give me a sec',
      'trying to remember something',
      'what was i gonna say',
      'on second thought',
      'actually no wait'
    ];
    
    return thoughts[Math.floor(Math.random() * thoughts.length)];
  }
  
  /**
   * Decay embarrassment over time
   */
  decayEmbarrassment() {
    this.embarrassmentLevel = Math.max(0, this.embarrassmentLevel - 1);
  }
  
  /**
   * Get status for dashboard
   */
  getStatus() {
    return {
      thoughtBufferSize: this.thoughtBuffer.length,
      slipChance: Math.round(this.slipChance * 100),
      embarrassmentLevel: Math.round(this.embarrassmentLevel),
      recentSlips: this.recentSlips.slice(-5).map(slip => ({
        thought: slip.thought,
        reaction: slip.reaction,
        timestamp: slip.timestamp
      })),
      thoughtCategories: this.thoughtBuffer.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = InnerMonologueBroadcaster;
