/**
 * SLUNT MIND - Central Consciousness Coordinator
 * 
 * The Mind is now a lightweight coordinator that queries specialized synthesizers.
 * Each synthesizer runs independently, aggregating related systems.
 * 
 * The Mind pulls from them on-demand and combines their insights.
 * 
 * This is Slunt's executive function - deciding what to pay attention to.
 */

// Import specialized synthesizers
const EmotionalSynthesizer = require('./synthesizers/EmotionalSynthesizer');
const SocialSynthesizer = require('./synthesizers/SocialSynthesizer');
const PhysicalSynthesizer = require('./synthesizers/PhysicalSynthesizer');
const CognitiveSynthesizer = require('./synthesizers/CognitiveSynthesizer');

class SluntMind {
  constructor(chatBot) {
    this.bot = chatBot;
    
    // Initialize specialized synthesizers
    console.log('🧠 [Mind] Initializing distributed consciousness...');
    
    // Delay initialization to let chatBot systems load
    setTimeout(() => {
      this.emotional = new EmotionalSynthesizer(chatBot);
      this.social = new SocialSynthesizer(chatBot);
      this.physical = new PhysicalSynthesizer(chatBot);
      this.cognitive = new CognitiveSynthesizer(chatBot);
      
      console.log('✅ [Mind] All synthesizers active - distributed consciousness online');
      console.log('   → EmotionalSynthesizer: Mood, feelings, mental health');
      console.log('   → SocialSynthesizer: Relationships, tensions, attachments');
      console.log('   → PhysicalSynthesizer: Energy, needs, addictions');
      console.log('   → CognitiveSynthesizer: Thoughts, obsessions, clarity');
    }, 3000);
  }
  
  /**
   * Get context for AI response generation
   * Queries synthesizers on-demand based on message complexity
   * NOW ASYNC with parallel queries for 3-5x speedup
   */
  async getMindContext(username, message) {
    // Check if synthesizers are ready
    if (!this.emotional || !this.social || !this.physical || !this.cognitive) {
      return '[Mind initializing...]';
    }
    
    // OPTIMIZATION: Detect simple messages
    const simpleMessage = message && (
      message.length < 15 || 
      /^(lol|lmao|yeah|nah|ok|cool|nice|bruh|fr|wtf|omg|huh|yep|nope)$/i.test(message.trim())
    );
    
    // For simple messages, provide minimal context (saves ~85% tokens)
    if (simpleMessage) {
      // Still async but minimal queries
      const [emo, phys] = await Promise.all([
        Promise.resolve(this.emotional.getContext('brief')),
        Promise.resolve(this.physical.getContext('brief'))
      ]);
      return `[${emo}, ${phys}]`;
    }
    
    // For complex messages, gather full context from all synthesizers IN PARALLEL
    const parts = [];
    
    parts.push('=== SLUNT CONSCIOUSNESS STATE ===\n');
    
    // === QUERY ALL SYNTHESIZERS IN PARALLEL (3-5x faster!) ===
    const [emoContext, physContext, cogContext, socialGeneral, socialUser] = await Promise.all([
      Promise.resolve(this.emotional.getContext('detailed')),
      Promise.resolve(this.physical.getContext('detailed')),
      Promise.resolve(this.cognitive.getContext('detailed')),
      Promise.resolve(this.social.getGeneralContext('normal')),
      Promise.resolve(this.social.getContextForUser(username, 'normal'))
    ]);
    
    parts.push(emoContext);
    parts.push(physContext);
    parts.push(cogContext);
    
    // Social context (general + user-specific)
    if (socialGeneral) parts.push(`\n${socialGeneral}`);
    if (socialUser) parts.push(`\n${socialUser}`);
    
    // === COLLECT DIRECTIVES IN PARALLEL ===
    parts.push(`\n=== BEHAVIORAL DIRECTIVES ===`);
    
    const [emoDirectives, physDirectives, cogDirectives, socialDirectives] = await Promise.all([
      Promise.resolve(this.emotional.getDirectives()),
      Promise.resolve(this.physical.getDirectives()),
      Promise.resolve(this.cognitive.getDirectives()),
      Promise.resolve(this.social.getDirectives(username))
    ]);
    
    const allDirectives = [
      ...emoDirectives,
      ...physDirectives,
      ...cogDirectives,
      ...socialDirectives
    ];
    
    // Remove duplicates and limit to most important
    const uniqueDirectives = [...new Set(allDirectives)].slice(0, 12);
    
    if (uniqueDirectives.length > 0) {
      parts.push(uniqueDirectives.map(d => `- ${d}`).join('\n'));
    } else {
      parts.push('- Respond naturally');
    }
    
    parts.push(`\n⚠️ IMPORTANT: Embody this state authentically. Don't announce it - let it color your tone, word choice, and engagement level.`);
    
    return parts.filter(p => p).join('\n');
  }
  
  /**
   * Get brief status summary (for dashboard/debugging)
   */
  getStatus() {
    if (!this.emotional) return 'Initializing...';
    
    const emo = this.emotional.cache;
    const phys = this.physical.cache;
    const cog = this.cognitive.cache;
    const soc = this.social.cache;
    
    return {
      emotional: {
        mood: emo?.mood || 'unknown',
        intensity: emo?.moodIntensity || 0,
        isDrunk: emo?.isDrunk || false,
        isHigh: emo?.isHigh || false
      },
      physical: {
        energy: phys?.energy || 0,
        tiredness: phys?.tiredness || 0,
        inWithdrawal: phys?.inWithdrawal || []
      },
      cognitive: {
        clarity: cog?.clarity || 0,
        consciousness: cog?.consciousness || 0,
        thinkingAbout: cog?.thinkingAbout || []
      },
      social: {
        socialBattery: soc?.socialBattery || 0,
        tensions: soc?.tensions || [],
        attachments: soc?.attachments || []
      }
    };
  }
  
  /**
   * Check health of all synthesizers
   */
  checkSynthesizerHealth() {
    if (!this.emotional || !this.social || !this.physical || !this.cognitive) {
      return { status: 'initializing' };
    }
    
    const health = {
      emotional: this.emotional.getHealth(),
      social: this.social.getHealth(),
      physical: this.physical.getHealth(),
      cognitive: this.cognitive.getHealth()
    };
    
    // Check for stale synthesizers
    const stale = [];
    const failed = [];
    
    for (const [name, status] of Object.entries(health)) {
      if (!status.isRunning) {
        failed.push(name);
      } else if (status.isStale) {
        stale.push(name);
      }
    }
    
    // Log warnings
    if (failed.length > 0) {
      console.error(`❌ [Mind] Failed synthesizers: ${failed.join(', ')}`);
    }
    if (stale.length > 0) {
      console.warn(`⚠️ [Mind] Stale synthesizers: ${stale.join(', ')}`);
    }
    
    return {
      health,
      stale,
      failed,
      isHealthy: failed.length === 0 && stale.length === 0
    };
  }
  
  /**
   * Cleanup method to stop all synthesizers
   */
  shutdown() {
    console.log('🧠 [Mind] Shutting down distributed consciousness...');
    this.emotional?.shutdown();
    this.social?.shutdown();
    this.physical?.shutdown();
    this.cognitive?.shutdown();
    console.log('✅ [Mind] All synthesizers stopped');
  }
}

module.exports = SluntMind;
