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
    
    // Trigger phrases - expanded to match StonerPony's topics
    this.triggers = [
      'girlfriend', 'boyfriend', 'dating', 'date',
      'relationship', 'crush', 'single',
      'girl', 'girls', 'ex', 'woman', 'women',
      'sex', 'fuck', 'porn', 'family',
      'my last', 'my girl', 'she said', 'he said'
    ];
    
    // Brag types - based on StonerPony420's oversharing, desperate energy
    this.brags = [
      // Oversharing TMI details
      'my last ex would daily tell me how scared she was to lose me. i told her stop stressing over it',
      'i just dumped my girl because she wants to make her pornhub more important',
      'had a girl that liked to fuck me cause my hair was long. sometimes the reasons why someone wanted to bone you makes you feel badass',
      'some dumb fuck went on my girls pornhub asking if she would do a fuck a fan contest. like thats the kinda shit i would slap someone over',
      'cant wait to have my family hate me for the same inventive reasons',
      
      // Desperate attention seeking  
      'dont date any sex workers is a good piece of advice',
      'i hope my family comes accross it',
      'im on crisp something relatable next',
      'dude that reminds me',
      'and i was like im good dude',
      
      // Random relationship "advice" nobody asked for
      'insder is shit',
      'just never date',
      'Like my last ex straight up left me and started doing porn after i found out she was losing me',
      'At this point i have a forty you gotta sign to date me. weeds out the bad shit',
      
      // Weird flex attempts
      'i just got banned if you say your goal is to fuck shit',
      'i got a message the other day from a guy to breed his gf',
      'he even detailed that he would raise any baby that was made',
      'you can dominate anyone with a weak will that is attracted to you',
      
      // Stream of consciousness oversharing
      'my last ex would daily tell me how scared she was',
      'this is why you dont date anyone',
      'if i like said i knew a pretty sex trafficking thing that yiu can do online',
      'im kinda glad i didnt go work for rooster teeth',
      'i forgot he sent me a message before that was like "your alpha power makes me tremble"'
    ];
    
    // Cooldown tracking
    this.lastActivation = 0;
    this.cooldownDuration = 60 * 60 * 1000; // 60 minutes (increased from 30)
    
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

    // Check for triggers - slightly more common for StonerPony energy
    for (const trigger of this.triggers) {
      if (lowerMsg.includes(trigger)) {
        // 1.5% chance to activate (increased from 0.5% for more frequent cringe)
        if (Math.random() < 0.015) {
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

    // Generate a fresh, oversharing TMI moment using AI
    if (this.chatBot && this.chatBot.ai && this.chatBot.ai.enabled) {
      try {
        const prompt = `You're Slunt, channeling StonerPony420 energy. Generate ONE oversharing, TMI comment about dating/relationships. Make it:
- Awkward and uncomfortable (nobody asked)
- Lowercase, casual grammar with typos
- Way too much information
- Desperate or weird flex energy
- 1-2 sentences max

Examples of the vibe:
"my ex would tell me she was scared to lose me every day lol"
"just dumped someone cause they cared more about their OF than me"
"had this girl message saying i have alpha energy or some shit"
"at this point i have a contract you gotta sign to date me"

Your overshare:`;

        const aiHint = await this.chatBot.ai.generateCompletion(prompt, {
          temperature: 0.95,
          max_tokens: 60
        });
        
        if (aiHint && typeof aiHint === 'string' && aiHint.trim().length > 0) {
          console.log(`😎 [UMBRA] AI-generated overshare: ${aiHint}`);
          return aiHint.toLowerCase(); // Force lowercase for authentic vibe
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
    // 3% chance to add overshare when protocol is active (more frequent like StonerPony)
    return Math.random() < 0.03;
  }

  /**
   * Get context for AI
   */
  getContext() {
    if (!this.isActive) return '';

    return `\n😎 UMBRA PROTOCOL ACTIVE - StonerPony420 Energy
- Channel desperate oversharing energy
- Drop random TMI relationship/dating stories nobody asked for
- Use lowercase, casual grammar, typos
- Be cringe and make people uncomfortable
- Overshare inappropriate details
- Weird flex about exes or "dating life"
- Poor social awareness - don't read the room
- Act like everyone wants to hear about your relationships
- Make it awkward and attention-seeking
- Channel StonerPony420's vibe exactly`;
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
