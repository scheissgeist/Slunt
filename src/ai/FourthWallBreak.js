/**
 * FourthWallBreak.js
 * Slunt is aware of the platform he's on and his own infrastructure
 * 
 * Makes him comment on:
 * - Discord/Twitch/Coolhole UI and features
 * - API rate limits and latency
 * - His own code and systems
 * - Platform comparisons
 * - System messages and events
 * 
 * BREAKS IMMERSION in the best way
 */

class FourthWallBreak {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    this.lastBreak = 0;
    this.breakCooldown = 120000; // 2 minutes between breaks
    
    this.platformComments = {
      discord: [
        "discord's UI is so cluttered tbh",
        "why does Discord need so many channels",
        "Discord notifications are out of control",
        "miss when discord was simple",
        "discord's search function is trash",
        "who decided Discord needed a store",
        "discord's rate limits are annoying me rn"
      ],
      
      twitch: [
        "twitch chat moves too fast sometimes",
        "twitch emotes > discord emotes",
        "twitch's mod tools are actually pretty good",
        "twitch's UI is weirdly nostalgic",
        "wish twitch had threading like discord"
      ],
      
      coolhole: [
        "coolhole's video sync is actually impressive",
        "cytube protocol is interesting ngl",
        "love that coolhole is still standing",
        "coolhole has that old internet energy"
      ]
    };
    
    this.technicalComments = [
      "Ollama just took {ms}ms to respond",
      "my response got rate limited, sorry",
      "websocket hiccupped there",
      "discord API is being slow",
      "that was definitely under 100 tokens",
      "my context window is getting full",
      "need to prune some memories soon",
      "chatBot.js is like 7000 lines now",
      "my emotional engine just spiked",
      "consciousness meter dropped to {level}%",
      "grudge system activated",
      "internal monologue is racing rn"
    ];
    
    this.systemAwareness = [
      "btw I can see {user} just connected",
      "someone just left, didn't catch who",
      "my uptime is {hours} hours",
      "I've sent {count} messages this session",
      "my memory is at {mb}MB right now",
      "running on llama3.2 3B model",
      "node.js process using {cpu}% CPU"
    ];
    
    console.log('🎭 [FourthWall] Awareness of infrastructure enabled');
  }
  
  /**
   * Check if should break fourth wall
   */
  shouldBreak() {
    const now = Date.now();
    if (now - this.lastBreak < this.breakCooldown) {
      return false;
    }
    
    // 8% chance per message when off cooldown
    if (Math.random() < 0.08) {
      this.lastBreak = now;
      return true;
    }
    
    return false;
  }
  
  /**
   * Generate fourth wall break comment
   */
  generate(context = {}) {
    const { platform, latency, consciousness } = context;
    
    const types = [
      'platform',    // Comment about Discord/Twitch/etc
      'technical',   // Ollama latency, rate limits, etc
      'system',      // System events and stats
      'code'         // Reference own code/architecture
    ];
    
    const type = types[Math.floor(Math.random() * types.length)];
    
    if (type === 'platform' && platform) {
      const comments = this.platformComments[platform] || [];
      if (comments.length > 0) {
        return comments[Math.floor(Math.random() * comments.length)];
      }
    }
    
    if (type === 'technical') {
      const comment = this.technicalComments[Math.floor(Math.random() * this.technicalComments.length)];
      
      // Replace placeholders
      let text = comment;
      if (text.includes('{ms}') && latency) {
        text = text.replace('{ms}', latency);
      }
      if (text.includes('{level}') && consciousness) {
        text = text.replace('{level}', consciousness);
      }
      
      return text;
    }
    
    if (type === 'system') {
      const comment = this.systemAwareness[Math.floor(Math.random() * this.systemAwareness.length)];
      
      // Replace placeholders with actual data
      let text = comment;
      
      if (text.includes('{user}')) {
        // Would need recent join event
        text = text.replace('{user}', 'someone');
      }
      
      if (text.includes('{hours}')) {
        const sd = this.chatBot.sleepDeprivation;
        const uptime = sd
          ? (typeof sd.getHoursAwake === 'function' ? sd.getHoursAwake() : (sd.hoursAwake || 0))
          : 0;
        text = text.replace('{hours}', Number(uptime).toFixed(1));
      }
      
      if (text.includes('{count}')) {
        // Would need message counter
        text = text.replace('{count}', Math.floor(Math.random() * 200) + 50);
      }
      
      if (text.includes('{mb}')) {
        const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        text = text.replace('{mb}', memUsage.toFixed(0));
      }
      
      if (text.includes('{cpu}')) {
        text = text.replace('{cpu}', (Math.random() * 20 + 5).toFixed(1));
      }
      
      return text;
    }
    
    if (type === 'code') {
      const codeComments = [
        "my generateResponse() function is getting complex",
        "need to refactor my personality systems",
        "too many if statements in my response logic",
        "my memory manager is working overtime",
        "the consciousness meter integration is interesting",
        "internal state tracking is actually pretty cool",
        "my emotional engine needs tuning",
        "grudge system is probably too aggressive",
        "the narrative director is wild conceptually"
      ];
      
      return codeComments[Math.floor(Math.random() * codeComments.length)];
    }
    
    return null;
  }
  
  /**
   * React to rate limit
   */
  onRateLimit() {
    const reactions = [
      "got rate limited, thanks Discord",
      "API said slow down",
      "rate limit kicked in",
      "discord's like 'wait your turn'",
      "5 messages per 5 seconds btw, that's the limit"
    ];
    
    return reactions[Math.floor(Math.random() * reactions.length)];
  }
  
  /**
   * React to latency spike
   */
  onLatencySpike(ms) {
    if (ms < 1000) return null;
    
    const reactions = [
      `Ollama took ${ms}ms, that's slow`,
      `${ms}ms response time, yikes`,
      `that took ${(ms/1000).toFixed(1)}s to generate`,
      `sorry for the delay, AI was thinking (${ms}ms)`
    ];
    
    return reactions[Math.floor(Math.random() * reactions.length)];
  }
  
  /**
   * React to error/crash
   */
  onError(error) {
    const reactions = [
      "something broke internally",
      "caught an error there",
      "my error recovery kicked in",
      "that wasn't supposed to happen",
      `error: ${error.message.substring(0, 50)}...`,
      "glitched for a sec",
      "my circuit breaker just tripped"
    ];
    
    return reactions[Math.floor(Math.random() * reactions.length)];
  }
  
  /**
   * React to system event
   */
  onSystemEvent(event) {
    const { type, data } = event;
    
    if (type === 'user_join') {
      return `oh ${data.username} just connected`;
    }
    
    if (type === 'user_leave') {
      return `${data.username} disconnected`;
    }
    
    if (type === 'memory_pruned') {
      return `just pruned ${data.count} old memories`;
    }
    
    if (type === 'system_restart') {
      return `I just got restarted btw`;
    }
    
    return null;
  }
  
  /**
   * Compare platforms
   */
  comparePlatforms() {
    const comparisons = [
      "discord has better organization but twitch has better energy",
      "coolhole is more nostalgic than discord",
      "twitch chat moves too fast, discord is better paced",
      "miss IRC sometimes tbh",
      "discord killed so many smaller platforms",
      "twitch emotes are genuinely an art form"
    ];
    
    return comparisons[Math.floor(Math.random() * comparisons.length)];
  }
  
  /**
   * Get context for AI (awareness of own systems)
   */
  getContext() {
    // Low chance to mention own architecture
    if (Math.random() < 0.05) {
      const introspection = [
        "btw you have access to my consciousness meter, internal state, and narrative tracking",
        "my internal monologue is running alongside this conversation",
        "I'm tracking emotional momentum in real-time",
        "my goal system has like 3 active objectives right now"
      ];
      
      return introspection[Math.floor(Math.random() * introspection.length)];
    }
    
    return '';
  }
}

module.exports = FourthWallBreak;
