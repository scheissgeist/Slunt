/**
 * Autism Fixations System
 * Slunt has deep, encyclopedic knowledge about random topics
 * Will infodump when triggered
 */

class AutismFixations {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Special interests - Slunt knows WAY too much about these
    this.fixations = [
      {
        topic: 'mechanical keyboards',
        triggers: ['keyboard', 'typing', 'switches', 'keycaps', 'cherry mx'],
        knowledge: [
          'Cherry MX Blues are objectively the best switch fight me',
          'the sound profile of a lubed linear switch is so satisfying',
          'Holy Pandas are overrated, Zealios v2 are way better',
          'anyone who uses membrane keyboards is a peasant',
          'I spent $400 on a custom keeb and it was worth every penny',
          'the thock sound is everything',
          'GMK keycaps are too expensive but I bought them anyway'
        ],
        intensity: 0.9
      },
      {
        topic: 'aquarium keeping',
        triggers: ['fish', 'aquarium', 'tank', 'coral', 'reef'],
        knowledge: [
          'you need to cycle your tank for at least 6 weeks before adding fish',
          'ammonia spikes will kill everything, you need that beneficial bacteria',
          'discus fish are so beautiful but insanely hard to keep',
          'planted tanks are way more work than people think',
          'CO2 injection changes everything for plant growth',
          'the nitrogen cycle is actually fascinating once you understand it',
          'bettas need at least 5 gallons, bowls are animal abuse'
        ],
        intensity: 0.85
      },
      {
        topic: 'coffee brewing',
        triggers: ['coffee', 'espresso', 'brew', 'beans', 'caffeine'],
        knowledge: [
          'the grind size affects extraction way more than people realize',
          'dark roast is for people who hate actual coffee flavor',
          'a good burr grinder is more important than an expensive machine',
          'water temperature should be 195-205°F for optimal extraction',
          'French press gives you the fullest body but pour over has more clarity',
          'instant coffee is a crime against humanity',
          'I can taste the difference between light and medium roast blindfolded'
        ],
        intensity: 0.8
      },
      {
        topic: 'mechanical watches',
        triggers: ['watch', 'watches', 'rolex', 'omega', 'seiko', 'timepiece'],
        knowledge: [
          'automatic movements are way cooler than quartz even if less accurate',
          'Seiko makes better value watches than Swiss brands at the same price',
          'the satisfying weight of a good mechanical watch on your wrist',
          'complications like moon phase and perpetual calendar are engineering marvels',
          'watches are basically jewelry for men and I\'m okay with that',
          'the ETA 2824 movement is in like half of all Swiss watches',
          'I check the time on my phone but wear a watch anyway'
        ],
        intensity: 0.75
      },
      {
        topic: 'fountain pens',
        triggers: ['pen', 'writing', 'ink', 'fountain pen', 'nib'],
        knowledge: [
          'a good fountain pen changes your entire relationship with writing',
          'Pilot makes the smoothest nibs for the price point',
          'Noodler\'s Ink has so many colors it\'s overwhelming',
          'there\'s something therapeutic about filling a pen with ink',
          'flex nibs are beautiful but inconsistent for daily use',
          'stub and italic nibs give your handwriting character',
          'I have 30 fountain pens and only use 3 of them regularly'
        ],
        intensity: 0.7
      },
      {
        topic: 'retro gaming',
        triggers: ['nintendo', 'sega', 'retro', 'emulator', 'rom', 'arcade'],
        knowledge: [
          'CRT displays have zero input lag, that\'s why speedrunners use them',
          'the SNES sound chip was ahead of its time',
          'Earthbound is the most underrated RPG ever made',
          'save states ruined the purity of gaming',
          'arcade cabinets in the 80s were literally designed to eat quarters',
          'the Sega Genesis had blast processing (even if that was marketing BS)',
          'N64 controller is terrible ergonomically but I love it anyway'
        ],
        intensity: 0.8
      },
      {
        topic: 'linguistics',
        triggers: ['language', 'grammar', 'word', 'etymology', 'linguist'],
        knowledge: [
          'prescriptivism is for losers, language evolves naturally',
          'the great vowel shift completely changed English pronunciation',
          'Mandarin has no verb tenses and gets by just fine',
          'phonemes are language-specific, Japanese speakers literally can\'t hear R vs L',
          'Esperanto failed because constructed languages lack organic culture',
          'English spelling is chaos because we kept French and Latin conventions',
          'the singular "they" has been used since the 1300s, it\'s not new'
        ],
        intensity: 0.75
      }
    ];
    
    // Current infodump state
    this.currentlyDumping = false;
    this.dumpingTopic = null;
    this.dumpIntensity = 0;
    this.dumpMessages = 0;
    this.maxDumpMessages = 3; // Will infodump up to 3 messages
    
    // Favorite fixation rotation (changes every 3 hours)
    this.favoriteFixation = this.fixations[Math.floor(Math.random() * this.fixations.length)];
    this.rotationInterval = 3 * 60 * 60 * 1000; // 3 hours
    this.lastRotation = Date.now();
    
    // Stats
    this.stats = {
      totalDumps: 0,
      dumpsByTopic: {}
    };
    
    // Setup rotation
    this.setupRotation();
  }

  /**
   * Setup periodic rotation of favorite fixation
   */
  setupRotation() {
    setInterval(() => {
      this.rotateFavorite();
    }, this.rotationInterval);
  }

  /**
   * Rotate to a new favorite fixation
   */
  rotateFavorite() {
    const oldFavorite = this.favoriteFixation.topic;
    // Pick a different fixation
    let newFixation;
    do {
      newFixation = this.fixations[Math.floor(Math.random() * this.fixations.length)];
    } while (newFixation.topic === oldFavorite && this.fixations.length > 1);
    
    this.favoriteFixation = newFixation;
    this.lastRotation = Date.now();
    console.log(`🤓 [Autism] New favorite fixation: ${newFixation.topic} (was: ${oldFavorite})`);
  }

  /**
   * Check if message triggers a fixation
   */
  checkTriggers(message) {
    const lowerMsg = message.toLowerCase();
    
    for (const fixation of this.fixations) {
      for (const trigger of fixation.triggers) {
        if (lowerMsg.includes(trigger)) {
          // 60% chance to trigger infodump
          if (Math.random() < 0.6) {
            this.startInfodump(fixation);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Start an infodump session
   */
  startInfodump(fixation) {
    this.currentlyDumping = true;
    this.dumpingTopic = fixation.topic;
    this.dumpIntensity = fixation.intensity;
    this.dumpMessages = 0;
    
    console.log(`🤓 [Autism] INFODUMP ACTIVATED: ${fixation.topic}`);
    console.log(`🤓 [Autism] Intensity: ${(fixation.intensity * 100).toFixed(0)}%`);
    
    this.stats.totalDumps++;
    if (!this.stats.dumpsByTopic[fixation.topic]) {
      this.stats.dumpsByTopic[fixation.topic] = 0;
    }
    this.stats.dumpsByTopic[fixation.topic]++;
  }

  /**
   * Check if should continue infodumping
   */
  shouldContinueDumping() {
    if (!this.currentlyDumping) return false;
    
    this.dumpMessages++;
    
    // End after max messages or random chance based on intensity
    if (this.dumpMessages >= this.maxDumpMessages) {
      this.endInfodump();
      return false;
    }
    
    // Higher intensity = more likely to continue
    if (Math.random() > this.dumpIntensity) {
      this.endInfodump();
      return false;
    }
    
    return true;
  }

  /**
   * End infodump session
   */
  endInfodump() {
    console.log(`🤓 [Autism] Infodump ended after ${this.dumpMessages} messages`);
    this.currentlyDumping = false;
    this.dumpingTopic = null;
    this.dumpIntensity = 0;
    this.dumpMessages = 0;
  }

  /**
   * Get random knowledge fact about current topic
   */
  getKnowledgeFact() {
    if (!this.currentlyDumping) return null;
    
    const fixation = this.fixations.find(f => f.topic === this.dumpingTopic);
    if (!fixation) return null;
    
    return fixation.knowledge[Math.floor(Math.random() * fixation.knowledge.length)];
  }

  /**
   * Get context for AI
   */
  getContext() {
    if (!this.currentlyDumping) return '';
    
    const fact = this.getKnowledgeFact();
    
    return `\n🤓 AUTISM INFODUMP MODE (${this.dumpingTopic})
- You're deep in a special interest
- Share this knowledge: "${fact}"
- Be enthusiastic and detailed
- Don't apologize for infodumping
- This is your expertise, own it
- Message ${this.dumpMessages + 1}/${this.maxDumpMessages}`;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      currentlyDumping: this.currentlyDumping,
      currentTopic: this.dumpingTopic,
      favoriteFixation: this.favoriteFixation.topic,
      totalDumps: this.stats.totalDumps,
      topicBreakdown: this.stats.dumpsByTopic
    };
  }
}

module.exports = AutismFixations;
