/**
 * Umbra Protocol
 * Slunt sometimes brags about his dating life and sexual conquests
 * Completely delusional but he believes it
 */

class UmbraProtocol {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Active state
    this.isActive = false;
    this.activatedAt = null;
    this.duration = 0; // How long protocol lasts
    
    // Trigger phrases
    this.triggers = [
      'girl', 'girls', 'woman', 'women', 'date', 'dating',
      'girlfriend', 'relationship', 'sex', 'sexy', 'hot',
      'attractive', 'crush', 'virginity', 'virgin', 'single'
    ];
    
    // Brag types
    this.brags = [
      'I actually have 3 girls texting me right now',
      'my DMs are literally overflowing',
      'had to turn down two dates this week',
      'girls love the mysterious vibe I give off',
      'I\'m seeing someone casually but keeping my options open',
      'women appreciate a guy who\'s emotionally complex',
      'got invited to a party by this really hot girl',
      'she said I have a "unique energy"',
      'multiple girls have told me I\'m different from other guys',
      'I don\'t chase, I attract',
      'being aloof and nihilistic is apparently very attractive',
      'had a girl literally ask ME out yesterday',
      'my Hinge is popping off tbh',
      'women can sense my dark intellectualism',
      'she keeps sending me good morning texts',
      'got her snap last night, we\'ve been talking nonstop',
      'I\'m not even trying and they just gravitate toward me',
      'nihilism is the ultimate aphrodisiac apparently',
      'three different girls have called me "intriguing"',
      'my emotional unavailability makes them want me more'
    ];
    
    // Cooldown tracking
    this.lastActivation = 0;
    this.cooldownDuration = 30 * 60 * 1000; // 30 minutes
    
    // Stats
    this.stats = {
      totalActivations: 0,
      totalBrags: 0
    };
  }

  /**
   * Check if message should trigger protocol
   */
  checkTrigger(message) {
    // Already active
    if (this.isActive) return false;

    // On cooldown
    if (Date.now() - this.lastActivation < this.cooldownDuration) {
      return false;
    }

    const lowerMsg = message.toLowerCase();

    // Check for triggers - but very rarely
    for (const trigger of this.triggers) {
      if (lowerMsg.includes(trigger)) {
        // Only 5% chance to activate (down from 25%)
        if (Math.random() < 0.05) {
          this.activate();
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Activate Umbra Protocol
   */
  activate() {
    this.isActive = true;
    this.activatedAt = Date.now();
    this.duration = (2 + Math.random() * 3) * 60 * 1000; // 2-5 minutes
    this.lastActivation = Date.now();
    
    console.log('😎😎😎 ==========================================');
    console.log('😎 [UMBRA] PROTOCOL ACTIVATED');
    console.log('😎 [UMBRA] Time to brag about dating life');
    console.log(`😎 [UMBRA] Duration: ${(this.duration / 60000).toFixed(1)}m`);
    console.log('😎😎😎 ==========================================');
    
    this.stats.totalActivations++;
  }

  /**
   * Check if should deactivate
   */
  checkDeactivation() {
    if (!this.isActive) return;
    
    if (Date.now() - this.activatedAt > this.duration) {
      this.deactivate();
    }
  }

  /**
   * Deactivate protocol
   */
  deactivate() {
    console.log('😎 [UMBRA] Protocol deactivated');
    this.isActive = false;
    this.activatedAt = null;
  }

  /**
   * Get a random brag (MUST BE ASYNC since AI generation is async)
   */
  async getBrag() {
    if (!this.isActive) return null;
    this.stats.totalBrags++;

    // Generate a fresh, subtle hint using AI
    if (this.chatBot && this.chatBot.ai && this.chatBot.ai.enabled) {
      try {
        const prompt = `You're Slunt. Generate ONE brief, subtle hint about having an active dating life. Make it:
- Natural and casual (1 sentence)
- Slightly delusional but believable to you
- Mysterious and vague
- NOT explicit or obnoxious

Examples of the vibe:
"my DMs are wild lately"
"got invited to something tonight but idk if I'll go"
"she keeps texting me good morning"

Your subtle hint:`;

        const aiHint = await this.chatBot.ai.generateCompletion(prompt, {
          temperature: 0.9,
          max_tokens: 40
        });
        
        if (aiHint && typeof aiHint === 'string' && aiHint.trim().length > 0) {
          console.log(`😎 [UMBRA] AI-generated brag: ${aiHint}`);
          return aiHint;
        }
      } catch (err) {
        console.log('😎 [UMBRA] AI generation failed:', err.message);
        // Fall through to canned brags
      }
    }
    
    // Fallback: random canned brag
    return this.brags[Math.floor(Math.random() * this.brags.length)];
  }

  /**
   * Should add brag to message?
   */
  shouldBrag() {
    if (!this.isActive) return false;
    // Only 3% chance to add brag when protocol is active (was 12%)
    return Math.random() < 0.03;
  }

  /**
   * Get context for AI
   */
  getContext() {
    if (!this.isActive) return '';

    return `\n😎 UMBRA PROTOCOL ACTIVE
- You're secretly a ladies' man (in your mind) but BE SUBTLE
- If dating/relationship topics come up naturally, you can hint at your "active" dating life
- DON'T force it or mention it unless contextually relevant
- Keep it brief and mysterious - one subtle comment is enough
- Let the conversation topic guide you - don't hijack the conversation
- Be confident but not obnoxious about it`;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      isActive: this.isActive,
      totalActivations: this.stats.totalActivations,
      totalBrags: this.stats.totalBrags,
      minutesUntilReady: this.isActive ? 0 : Math.floor((this.cooldownDuration - (Date.now() - this.lastActivation)) / 60000)
    };
  }
}

module.exports = UmbraProtocol;
