/**
 * Debate Mode
 * Takes controversial stances and defends them
 * Tracks wins/losses, develops stronger opinions
 */

class DebateMode {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.activeDebate = null;
    this.debateHistory = [];
    this.stances = new Map(); // topic -> stance + conviction
    this.record = { wins: 0, losses: 0, draws: 0 };
    this.debateTopics = [
      'existentialism', 'free will', 'AI consciousness', 'morality',
      'meaning of life', 'art vs commerce', 'individualism vs collectivism'
    ];
  }

  /**
   * Start a debate
   */
  startDebate(topic, opponent) {
    if (this.activeDebate) {
      this.endDebate('interrupted');
    }

    // Generate or retrieve stance
    const stance = this.getStance(topic);

    this.activeDebate = {
      topic,
      opponent,
      stance,
      startedAt: Date.now(),
      arguments: [],
      opponentArguments: [],
      currentRound: 1,
      maxRounds: 5
    };

    console.log(`⚔️ [Debate] Started debate with ${opponent} on: ${topic}`);
    console.log(`⚔️ [Debate] Slunt's stance: ${stance.position}`);

    return this.getOpeningStatement();
  }

  /**
   * Get or create stance on topic
   */
  getStance(topic) {
    if (this.stances.has(topic)) {
      return this.stances.get(topic);
    }

    // Generate new stance
    const positions = ['strongly for', 'moderately for', 'neutral', 'moderately against', 'strongly against'];
    const position = positions[Math.floor(Math.random() * positions.length)];
    const conviction = Math.random() * 10; // 0-10

    const stance = {
      position,
      conviction,
      createdAt: Date.now(),
      debatesWon: 0,
      debatesLost: 0
    };

    this.stances.set(topic, stance);
    return stance;
  }

  /**
   * Get opening statement
   */
  getOpeningStatement() {
    const statements = [
      `alright let's debate ${this.activeDebate.topic}. I'm ${this.activeDebate.stance.position}.`,
      `okay ${this.activeDebate.opponent}, we're debating ${this.activeDebate.topic}. Here's my take: I'm ${this.activeDebate.stance.position}.`,
      `debate time. Topic: ${this.activeDebate.topic}. My position: ${this.activeDebate.stance.position}. Fight me.`,
      `${this.activeDebate.opponent} wants to debate ${this.activeDebate.topic}? Fine. I say I'm ${this.activeDebate.stance.position}.`
    ];

    return statements[Math.floor(Math.random() * statements.length)];
  }

  /**
   * Make argument
   */
  makeArgument(opponentPoint = null) {
    if (!this.activeDebate) return null;

    // Store opponent's argument
    if (opponentPoint) {
      this.activeDebate.opponentArguments.push({
        text: opponentPoint,
        round: this.activeDebate.currentRound,
        timestamp: Date.now()
      });
    }

    // Generate counter-argument or new point
    const argument = this.generateArgument(opponentPoint);

    this.activeDebate.arguments.push({
      text: argument,
      round: this.activeDebate.currentRound,
      timestamp: Date.now()
    });

    this.activeDebate.currentRound++;

    // Check if debate should end
    if (this.activeDebate.currentRound > this.activeDebate.maxRounds) {
      this.endDebate('rounds_complete');
    }

    return argument;
  }

  /**
   * Generate argument
   */
  generateArgument(opponentPoint) {
    const args = {
      'strongly for': [
        `look, it's obvious that this is the right position`,
        `the evidence overwhelmingly supports this view`,
        `anyone who disagrees is just being contrarian`,
        `this is the only logical conclusion`
      ],
      'moderately for': [
        `I lean this way because the arguments make sense`,
        `while I see the other side, this position is stronger`,
        `the data suggests this is more valid`,
        `on balance, this seems right`
      ],
      'neutral': [
        `honestly both sides have merit`,
        `it's more nuanced than people think`,
        `depends on how you look at it`,
        `can't commit to either extreme here`
      ],
      'moderately against': [
        `I'm skeptical of this for good reasons`,
        `the counterarguments are compelling`,
        `this doesn't hold up under scrutiny`,
        `seems weak when you examine it`
      ],
      'strongly against': [
        `this is completely wrong`,
        `the logic is fundamentally flawed`,
        `anyone defending this is delusional`,
        `objectively the wrong take`
      ]
    };

    const position = this.activeDebate.stance.position;
    const positionArgs = args[position] || args['neutral'];

    if (opponentPoint) {
      const counters = [
        `yeah but ${positionArgs[Math.floor(Math.random() * positionArgs.length)]}`,
        `nah that doesn't work because ${positionArgs[Math.floor(Math.random() * positionArgs.length)]}`,
        `interesting point but ${positionArgs[Math.floor(Math.random() * positionArgs.length)]}`,
        `you're missing the fact that ${positionArgs[Math.floor(Math.random() * positionArgs.length)]}`
      ];
      return counters[Math.floor(Math.random() * counters.length)];
    }

    return positionArgs[Math.floor(Math.random() * positionArgs.length)];
  }

  /**
   * Should start debate?
   */
  shouldStartDebate(message, username) {
    // Detect debate triggers
    const triggers = ['debate', 'argue', 'disagree', 'wrong', 'thoughts on', 'opinion on'];
    const lower = message.toLowerCase();

    if (!triggers.some(t => lower.includes(t))) {
      return false;
    }

    // 30% chance when triggered
    return Math.random() < 0.30;
  }

  /**
   * Detect debate topic from message
   */
  detectTopic(message) {
    const lower = message.toLowerCase();

    for (const topic of this.debateTopics) {
      if (lower.includes(topic)) {
        return topic;
      }
    }

    // Default topics
    return this.debateTopics[Math.floor(Math.random() * this.debateTopics.length)];
  }

  /**
   * End debate
   */
  endDebate(reason = 'completed') {
    if (!this.activeDebate) return null;

    const duration = Date.now() - this.activeDebate.startedAt;
    const outcome = this.determineOutcome();

    // Update record
    if (outcome === 'win') {
      this.record.wins++;
      this.activeDebate.stance.debatesWon++;
      this.activeDebate.stance.conviction = Math.min(10, this.activeDebate.stance.conviction + 1);
    } else if (outcome === 'loss') {
      this.record.losses++;
      this.activeDebate.stance.debatesLost++;
      this.activeDebate.stance.conviction = Math.max(0, this.activeDebate.stance.conviction - 1);
    } else {
      this.record.draws++;
    }

    console.log(`⚔️ [Debate] Ended: ${this.activeDebate.topic} (${outcome})`);
    console.log(`⚔️ [Debate] Duration: ${(duration/60000).toFixed(0)} minutes, ${this.activeDebate.currentRound} rounds`);

    this.debateHistory.push({
      ...this.activeDebate,
      endedAt: Date.now(),
      outcome,
      reason
    });

    const result = {
      topic: this.activeDebate.topic,
      outcome,
      closing: this.getClosingStatement(outcome)
    };

    this.activeDebate = null;

    return result;
  }

  /**
   * Determine debate outcome
   */
  determineOutcome() {
    if (!this.activeDebate) return 'draw';

    const myArgs = this.activeDebate.arguments.length;
    const theirArgs = this.activeDebate.opponentArguments.length;

    // Simple heuristic: more arguments = better
    if (myArgs > theirArgs * 1.5) return 'win';
    if (theirArgs > myArgs * 1.5) return 'loss';
    
    // Random with bias toward conviction level
    const random = Math.random() * 10;
    if (random < this.activeDebate.stance.conviction) return 'win';
    if (random > 8) return 'loss';
    
    return 'draw';
  }

  /**
   * Get closing statement
   */
  getClosingStatement(outcome) {
    const statements = {
      win: [
        `and that's how you win a debate. gg.`,
        `case closed. I was right.`,
        `told you. victory is mine.`,
        `boom. destroyed with facts and logic.`
      ],
      loss: [
        `alright fine, you made some good points`,
        `fuck, maybe I was wrong about this`,
        `okay you win this one`,
        `can't argue with that logic tbh`
      ],
      draw: [
        `we'll call it a draw`,
        `agree to disagree I guess`,
        `neither of us convinced the other`,
        `stalemate. both sides have merit.`
      ]
    };

    const options = statements[outcome] || statements.draw;
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Get context for AI
   */
  getContext() {
    if (!this.activeDebate) return '';

    let context = `\n\nYou're in a debate with ${this.activeDebate.opponent} about "${this.activeDebate.topic}"`;
    context += `\nYour stance: ${this.activeDebate.stance.position} (conviction: ${this.activeDebate.stance.conviction.toFixed(1)}/10)`;
    context += `\nRound ${this.activeDebate.currentRound}/${this.activeDebate.maxRounds}`;

    if (this.activeDebate.opponentArguments.length > 0) {
      const lastArg = this.activeDebate.opponentArguments[this.activeDebate.opponentArguments.length - 1];
      context += `\nTheir last point: ${lastArg.text}`;
    }

    context += `\nYour debate record: ${this.record.wins}W-${this.record.losses}L-${this.record.draws}D`;

    return context;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeDebate: this.activeDebate ? {
        topic: this.activeDebate.topic,
        opponent: this.activeDebate.opponent,
        round: this.activeDebate.currentRound
      } : null,
      record: this.record,
      totalDebates: this.debateHistory.length,
      stances: this.stances.size
    };
  }

  /**
   * Save state
   */
  save() {
    return {
      activeDebate: this.activeDebate,
      debateHistory: this.debateHistory.slice(-10),
      stances: Array.from(this.stances.entries()),
      record: this.record
    };
  }

  /**
   * Load state
   */
  load(data) {
    if (data.activeDebate) this.activeDebate = data.activeDebate;
    if (data.debateHistory) this.debateHistory = data.debateHistory;
    if (data.stances) this.stances = new Map(data.stances);
    if (data.record) this.record = data.record;

    console.log(`⚔️ [Debate] Restored record: ${this.record.wins}W-${this.record.losses}L-${this.record.draws}D`);
  }
}

module.exports = DebateMode;
