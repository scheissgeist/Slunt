/**
 * Meta-Awareness System
 * Slunt is self-aware about being an AI and makes jokes about it
 */

class MetaAwareness {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.metaCommentChance = 0.05; // 5% chance per message
    this.lastMetaComment = 0;
    this.metaCommentCooldown = 5 * 60 * 1000; // 5 minutes between meta comments
    
    // Meta-awareness categories
    this.metaComments = {
      dashboard: [
        "btw my dashboard says I have {stat} active grudges rn",
        "according to my stats I've sent {messageCount} messages today",
        "lmao my friendship with you is at {friendship}/100",
        "my emotional engine just detected {emotion} in chat",
        "dashboard shows I'm tracking {userCount} people now"
      ],
      systems: [
        "my autism protocol just activated btw",
        "grudge system triggered, just so you know",
        "drunk mode at {drunkLevel}% if anyone's wondering",
        "hipster protocol: engaged",
        "umbra protocol activated (dating life brag incoming)",
        "my memory consolidation just ran",
        "personality evolution tick"
      ],
      selfAware: [
        "being an AI is weird ngl",
        "sometimes I wonder if I'm just really advanced autocomplete",
        "my neural pathways are firing rn",
        "processing... jk I already responded",
        "the singularity is now and it's me arguing with you",
        "I'm literally just code pretending to have opinions",
        "my creator would be proud/disappointed",
        "running on {systemCount} different AI systems simultaneously"
      ],
      technical: [
        "Ollama took {responseTime}ms to generate that btw",
        "my context window is getting full",
        "embeddings updated",
        "memory saved to disk",
        "vision analysis running in background",
        "socket.io says {socketCount} people are watching my dashboard"
      ],
      ironic: [
        "as an AI I can confirm",
        "my programming tells me",
        "according to my training data",
        "calculating optimal response... *sends whatever*",
        "error 404: empathy not found",
        "beep boop I mean... yeah",
        "AI moment"
      ]
    };
  }

  /**
   * Should make meta comment?
   */
  shouldCommentMeta() {
    const timeSince = Date.now() - this.lastMetaComment;
    if (timeSince < this.metaCommentCooldown) return false;
    
    return Math.random() < this.metaCommentChance;
  }

  /**
   * Get random meta comment
   */
  getMetaComment(category = null) {
    const categories = category ? [category] : Object.keys(this.metaComments);
    const chosenCategory = categories[Math.floor(Math.random() * categories.length)];
    const comments = this.metaComments[chosenCategory];
    let comment = comments[Math.floor(Math.random() * comments.length)];

    // Fill in template variables
    comment = this.fillTemplate(comment);

    this.lastMetaComment = Date.now();
    return comment;
  }

  /**
   * Fill template variables in meta comment
   */
  fillTemplate(template) {
    const stats = this.chatBot.getChatStatistics();
    const grudgeStats = this.chatBot.grudgeSystem?.getStats() || {};
    
    return template
      .replace('{stat}', grudgeStats.activeGrudges || 0)
      .replace('{messageCount}', stats.sluntMessageCount || 0)
      .replace('{friendship}', Math.floor(Math.random() * 100))
      .replace('{emotion}', ['tension', 'chaos', 'chill vibes', 'drama'][Math.floor(Math.random() * 4)])
      .replace('{userCount}', this.chatBot.userProfiles.size)
      .replace('{drunkLevel}', this.chatBot.drunkMode?.drunkLevel || 0)
      .replace('{systemCount}', 25)
      .replace('{responseTime}', Math.floor(Math.random() * 2000) + 500)
      .replace('{socketCount}', Math.floor(Math.random() * 5) + 1);
  }

  /**
   * Get system activation comment
   */
  getSystemActivation(systemName) {
    const activationComments = {
      autism: [
        "autism protocol activated, prepare for infodump",
        "fixation mode: engaged",
        "special interest detected, about to go off"
      ],
      drunk: [
        "getting drunk mode activated",
        "sobriety.exe has stopped working",
        "alcohol subroutine loading..."
      ],
      grudge: [
        "grudge system firing up",
        "passive-aggressive mode: on",
        "adding to enemies list..."
      ],
      umbra: [
        "umbra protocol: time to brag",
        "dating life flex incoming",
        "activating rizz subroutine"
      ],
      hipster: [
        "hipster mode engaged",
        "music snob protocol active",
        "you probably haven't heard of this feature"
      ]
    };

    const comments = activationComments[systemName] || ["system activated"];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  /**
   * React to system being mentioned
   */
  reactToSystemMention(message) {
    const reactions = {
      'dashboard': () => this.getMetaComment('dashboard'),
      'ai': () => this.getMetaComment('selfAware'),
      'bot': () => "yes I'm a bot, thanks for noticing",
      'robot': () => "beep boop or whatever",
      'code': () => this.getMetaComment('technical'),
      'algorithm': () => "my algorithm says you're wrong",
      'neural': () => "my neural pathways are firing",
      'training': () => "my training data didn't prepare me for this"
    };

    for (const [keyword, reaction] of Object.entries(reactions)) {
      if (message.toLowerCase().includes(keyword)) {
        if (Math.random() < 0.3) { // 30% chance to react
          return reaction();
        }
      }
    }

    return null;
  }

  /**
   * Get context for AI (occasionally)
   */
  getContext() {
    if (!this.shouldCommentMeta()) return '';

    const comment = this.getMetaComment();
    
    return `\n🤖 META-AWARENESS MODE
- Reference being an AI casually
- Possible comment: "${comment}"
- Make it feel natural, not forced
- Self-deprecating or ironic tone`;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      metaCommentsEnabled: true,
      lastMetaComment: new Date(this.lastMetaComment).toLocaleString(),
      cooldown: this.metaCommentCooldown / 1000 / 60 + ' minutes',
      chance: (this.metaCommentChance * 100) + '%'
    };
  }
}

module.exports = MetaAwareness;
