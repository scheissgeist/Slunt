/**
 * Proactive Conversation Starter
 * Breaks lulls by starting topics instead of just reacting
 */

class ProactiveStarter {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.lastProactiveMessage = 0;
    this.cooldownMinutes = 15; // Don't spam proactive messages
    this.recentTopics = [];
  }

  /**
   * Check if we should proactively start a conversation
   */
  shouldStartConversation(platform, channel) {
    // Don't spam
    const timeSinceLastProactive = Date.now() - this.lastProactiveMessage;
    if (timeSinceLastProactive < this.cooldownMinutes * 60 * 1000) {
      return false;
    }

    // Check for lull (no messages in last 10 minutes)
    const recentMessages = this.chatBot.conversationContext
      ?.filter(m => m.platform === platform && m.timestamp > Date.now() - 10 * 60 * 1000) || [];
    
    if (recentMessages.length > 0) {
      return false; // Conversation is active
    }

    // 30% chance during lulls
    return Math.random() < 0.3;
  }

  /**
   * Generate a proactive conversation starter
   */
  generateStarter(platform) {
    const starterTypes = [
      this.randomThought.bind(this),
      this.askQuestion.bind(this),
      this.shareObservation.bind(this),
      this.referenceOldTopic.bind(this),
      this.hotTake.bind(this),
      this.callbackTest.bind(this)
    ];

    const generator = starterTypes[Math.floor(Math.random() * starterTypes.length)];
    const starter = generator(platform);
    
    if (starter) {
      this.lastProactiveMessage = Date.now();
      console.log(`💬 [Proactive] Starting conversation: "${starter.substring(0, 50)}..."`);
    }
    
    return starter;
  }

  /**
   * Random thought/opinion
   */
  randomThought(platform) {
    const thoughts = [
      "btw random thought: {topic}",
      "i just realized something about {topic}",
      "been thinking - {opinion}",
      "hot take but {opinion}",
      "anyone else think {opinion}",
      "real talk: {opinion}",
      "idk why but {observation}",
      "not gonna lie {opinion}"
    ];

    const topics = this.getRecentTopics();
    if (topics.length === 0) return null;

    const template = thoughts[Math.floor(Math.random() * thoughts.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    return template.replace('{topic}', topic)
      .replace('{opinion}', this.generateOpinion(topic))
      .replace('{observation}', this.generateObservation(topic));
  }

  /**
   * Ask community a question
   */
  askQuestion(platform) {
    const questions = [
      "quick question - anyone {action}?",
      "wait does anyone actually {action}?",
      "genuine question: why do people {action}?",
      "ok but real talk, is {topic} actually good?",
      "someone explain {topic} to me",
      "am i the only one who thinks {opinion}?",
      "what's everyone's take on {topic}?"
    ];

    const topics = this.getRecentTopics();
    if (topics.length === 0) return null;

    const template = questions[Math.floor(Math.random() * questions.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    return template
      .replace('{action}', `do ${topic}`)
      .replace('{topic}', topic)
      .replace('{opinion}', this.generateOpinion(topic));
  }

  /**
   * Share observation about chat/stream/video
   */
  shareObservation(platform) {
    const observations = [
      "chat's been kinda dead lately ngl",
      "this is actually pretty chill right now",
      "weird vibe in here today",
      "everyone's lurking huh",
      "damn we really just vibing",
      "slow day or is it just me"
    ];

    return observations[Math.floor(Math.random() * observations.length)];
  }

  /**
   * Reference an old topic to test memory
   */
  referenceOldTopic(platform) {
    const topics = this.getRecentTopics();
    if (topics.length === 0) return null;

    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    const references = [
      `wait didn't we talk about ${topic} like a few days ago?`,
      `${topic} came up again, classic`,
      `this reminds me of that ${topic} discussion`,
      `we're back to ${topic} huh`,
      `${topic} arc continues`
    ];

    return references[Math.floor(Math.random() * references.length)];
  }

  /**
   * Controversial hot take
   */
  hotTake(platform) {
    const takes = [
      "controversial opinion but most popular things are overrated",
      "ngl i think gatekeeping is sometimes good actually",
      "hot take: being cringe is more respectable than being boring",
      "unpopular opinion but drama makes things interesting",
      "real talk: most 'hot takes' are just normal opinions",
      "might be controversial but i don't care what people think"
    ];

    return takes[Math.floor(Math.random() * takes.length)];
  }

  /**
   * Test if people remember past conversations
   */
  callbackTest(platform) {
    // Get users who were recently active
    const recentUsers = this.chatBot.conversationContext
      ?.slice(-50)
      .map(m => m.username)
      .filter((v, i, a) => a.indexOf(v) === i) || [];
    
    if (recentUsers.length === 0) return null;

    const user = recentUsers[Math.floor(Math.random() * recentUsers.length)];
    
    const callbacks = [
      `hey ${user} you ever figure out that thing?`,
      `${user} still on that ${this.getRandomTopic()} grind?`,
      `wait where's ${user}, they always show up`,
      `${user} would have an opinion on this`
    ];

    return callbacks[Math.floor(Math.random() * callbacks.length)];
  }

  /**
   * Get recent discussion topics
   */
  getRecentTopics() {
    // Extract from recent messages
    const topics = new Set();
    
    const recentMessages = this.chatBot.conversationContext?.slice(-50) || [];
    for (const msg of recentMessages) {
      if (msg.topics && Array.isArray(msg.topics)) {
        msg.topics.forEach(t => topics.add(t));
      }
    }

    return Array.from(topics).slice(0, 10);
  }

  getRandomTopic() {
    const topics = this.getRecentTopics();
    return topics.length > 0 ? topics[Math.floor(Math.random() * topics.length)] : 'stuff';
  }

  generateOpinion(topic) {
    const opinions = [
      `${topic} is honestly overrated`,
      `${topic} goes hard`,
      `${topic} is mediocre`,
      `${topic} is pretty good`,
      `people sleep on ${topic}`
    ];
    return opinions[Math.floor(Math.random() * opinions.length)];
  }

  generateObservation(topic) {
    const observations = [
      `${topic} keeps coming up`,
      `everyone's talking about ${topic} lately`,
      `${topic} is everywhere now`,
      `we keep circling back to ${topic}`
    ];
    return observations[Math.floor(Math.random() * observations.length)];
  }
}

module.exports = ProactiveStarter;
