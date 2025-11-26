/**
 * Hipster Music Protocol
 * Slunt is really into obscure indie bands
 * Will randomly mention them and act superior about taste
 */

class HipsterProtocol {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Slunt's favorite obscure bands (that totally exist)
    this.bands = [
      {
        name: 'The Microphones',
        facts: [
          'The Glow Pt. 2 changed my entire perspective on music',
          'Phil Elverum is a genius and nobody appreciates it enough',
          'lo-fi doesn\'t mean low quality, it means raw emotion',
          'Mount Eerie is just The Microphones evolved'
        ]
      },
      {
        name: 'Neutral Milk Hotel',
        facts: [
          'In the Aeroplane Over the Sea is objectively perfect',
          'Jeff Mangum disappeared at his peak and I respect that',
          'if you don\'t cry during "Oh Comely" you have no soul',
          'the raw emotion in that album is unmatched'
        ]
      },
      {
        name: 'Car Seat Headrest',
        facts: [
          'Teens of Denial is the voice of our generation',
          'Will Toledo gets it in a way most artists don\'t',
          'Twin Fantasy (Face to Face) version is better fight me',
          'his lyrics are poetry disguised as indie rock'
        ]
      },
      {
        name: 'Death Grips',
        facts: [
          'The Money Store is experimental perfection',
          'most people can\'t handle their abrasiveness',
          'MC Ride\'s vocals are genuinely terrifying',
          'they broke up and got back together like 3 times'
        ]
      },
      {
        name: 'Have a Nice Life',
        facts: [
          'Deathconsciousness is the most depressing album ever made',
          'shoegaze meets post-punk meets existential dread',
          'recorded in a basement and sounds better than most studio albums',
          'Bloodhail is 6 minutes of pure nihilism'
        ]
      },
      {
        name: 'American Football',
        facts: [
          'their first album defined midwest emo',
          'those guitar tappings are so clean',
          'broke up after one album and became legends',
          'Never Meant hits different when you\'re depressed'
        ]
      }
    ];
    
    // Current favorite
    this.currentFavorite = this.bands[Math.floor(Math.random() * this.bands.length)];
    
    // Active state
    this.isActive = false;
    this.activatedAt = null;
    this.duration = 0;
    
    // Triggers
    this.triggers = [
      'music', 'band', 'song', 'album', 'listen', 'listening',
      'spotify', 'soundcloud', 'bandcamp', 'concert', 'artist'
    ];
    
    // How often to rotate favorite band (every 2 hours)
    this.rotationInterval = 2 * 60 * 60 * 1000;
    this.lastRotation = Date.now();
    
    // Stats
    this.stats = {
      totalActivations: 0,
      mentionsByBand: {}
    };
    
    // Initialize stats
    this.bands.forEach(band => {
      this.stats.mentionsByBand[band.name] = 0;
    });
    
    // Setup rotation
    this.setupRotation();
  }

  /**
   * Setup periodic band rotation
   */
  setupRotation() {
    setInterval(() => {
      this.rotateFavorite();
    }, this.rotationInterval);
  }

  /**
   * Rotate to a new favorite band
   */
  rotateFavorite() {
    const oldFavorite = this.currentFavorite.name;
    
    // Pick a different band
    let newBand;
    do {
      newBand = this.bands[Math.floor(Math.random() * this.bands.length)];
    } while (newBand.name === this.currentFavorite.name);
    
    this.currentFavorite = newBand;
    this.lastRotation = Date.now();
    
    console.log(`🎸 [Hipster] Favorite band changed: ${oldFavorite} → ${newBand.name}`);
  }

  /**
   * Check if message triggers hipster mode
   */
  checkTrigger(message) {
    if (this.isActive) return false;
    
    const lowerMsg = message.toLowerCase();
    
    for (const trigger of this.triggers) {
      if (lowerMsg.includes(trigger)) {
        // 30% chance to activate
        if (Math.random() < 0.3) {
          this.activate();
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Activate hipster protocol
   */
  activate() {
    this.isActive = true;
    this.activatedAt = Date.now();
    this.duration = (3 + Math.random() * 4) * 60 * 1000; // 3-7 minutes
    
    console.log('🎸🎸🎸 ==========================================');
    console.log('🎸 [Hipster] PROTOCOL ACTIVATED');
    console.log(`🎸 [Hipster] Current favorite: ${this.currentFavorite.name}`);
    console.log(`🎸 [Hipster] Duration: ${(this.duration / 60000).toFixed(1)}m`);
    console.log('🎸🎸🎸 ==========================================');
    
    this.stats.totalActivations++;
    this.stats.mentionsByBand[this.currentFavorite.name]++;
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
    console.log('🎸 [Hipster] Protocol deactivated');
    this.isActive = false;
    this.activatedAt = null;
  }

  /**
   * Get random fact about current favorite
   */
  getFact() {
    if (!this.isActive) return null;
    
    const facts = this.currentFavorite.facts;
    return facts[Math.floor(Math.random() * facts.length)];
  }

  /**
   * Should mention band?
   */
  shouldMention() {
    if (!this.isActive) return false;
    
    // 50% chance when protocol is active
    return Math.random() < 0.5;
  }

  /**
   * Get context for AI
   */
  getContext() {
    if (!this.isActive) return '';
    
    const fact = this.getFact();
    
    return `\n🎸 HIPSTER MUSIC MODE
- You're really into ${this.currentFavorite.name} right now
- Share your opinion: "${fact}"
- Act like you have superior music taste
- "You probably haven't heard of them"
- Be slightly pretentious but genuine
- Music is your identity`;
  }

  /**
   * Get mention for injection
   */
  getMention() {
    if (!this.shouldMention()) return null;
    
    const templates = [
      `been listening to ${this.currentFavorite.name} nonstop`,
      `${this.currentFavorite.name} just hits different`,
      `you guys ever heard of ${this.currentFavorite.name}?`,
      `${this.currentFavorite.name} is so good`,
      `nothing hits like ${this.currentFavorite.name}`,
      `${this.currentFavorite.name} understands me`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      isActive: this.isActive,
      currentFavorite: this.currentFavorite.name,
      totalActivations: this.stats.totalActivations,
      mentionsByBand: this.stats.mentionsByBand
    };
  }
}

module.exports = HipsterProtocol;
