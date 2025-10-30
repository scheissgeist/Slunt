/**
 * Dynamic Hipster Music Protocol
 * Slunt discovers and becomes obsessed with music/bands from conversations
 * Everything is learned organically via AI - NO HARDCODED BANDS
 * Can return to previous favorites with increased enthusiasm
 */

const fs = require('fs').promises;
const path = require('path');

class HipsterProtocol {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Dynamically discovered bands/artists
    this.discoveredBands = []; // { name, facts[], genre, firstSeen, timesActive }
    
    // Complete history with intensity tracking
    this.bandHistory = new Map(); // band -> { timesActivated, totalMentions, lastActivated, currentIntensity, peakIntensity }
    
    // Current favorite band
    this.currentFavorite = null;
    this.favoriteIntensity = 1.0;
    this.isActive = false;
    this.activatedAt = null;
    this.duration = 0;
    
    // Band discovery from conversations
    this.recentMusicMentions = new Map(); // band/artist -> count
    this.discoveryThreshold = 2; // mentions needed to discover
    
    // Triggers for music-related conversations
    this.musicTriggers = [
      'music', 'band', 'song', 'album', 'listen', 'listening',
      'spotify', 'soundcloud', 'bandcamp', 'concert', 'artist',
      'track', 'playlist', 'vinyl', 'ep', 'single'
    ];
    
    // Stats
    this.stats = {
      totalActivations: 0,
      bandsDiscovered: 0,
      mentionsByBand: {}
    };
    
    // Persistence
    this.savePath = './data/hipster_protocol.json';
    this.loadHistory();
    
    // Setup rotation
    this.setupRotation();
  }

  /**
   * Load band history from disk
   */
  async loadHistory() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.discoveredBands = parsed.discoveredBands || [];
      
      if (parsed.bandHistory) {
        this.bandHistory = new Map(parsed.bandHistory);
      }
      
      this.stats = parsed.stats || this.stats;
      
      console.log(`🎸 [Hipster] Loaded ${this.discoveredBands.length} discovered bands, ${this.bandHistory.size} historical favorites`);
      
      if (this.discoveredBands.length > 0) {
        this.rotateFavorite();
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('🎸 [Hipster] Error loading:', error.message);
      }
    }
  }

  /**
   * Save band history to disk
   */
  async saveHistory() {
    try {
      const dir = path.dirname(this.savePath);
      await fs.mkdir(dir, { recursive: true });

      const data = {
        discoveredBands: this.discoveredBands,
        bandHistory: Array.from(this.bandHistory.entries()),
        stats: this.stats,
        savedAt: Date.now()
      };

      await fs.writeFile(this.savePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('🎸 [Hipster] Error saving:', error.message);
    }
  }

  /**
   * Analyze conversation for music/band mentions
   */
  async analyzeForMusic(message, username) {
    if (!message || message.length < 5) return;
    if (username === 'Slunt') return;

    const lowerMsg = message.toLowerCase();
    
    // Only analyze if music-related
    const isMusicRelated = this.musicTriggers.some(trigger => lowerMsg.includes(trigger));
    if (!isMusicRelated) return;

    try {
      const prompt = `Extract band/artist names from this message about music. Return ONLY a JSON array of band/artist names, no explanation.

Message: "${message}"

Examples:
- "Death Grips"
- "Neutral Milk Hotel"
- "Car Seat Headrest"

Return format: ["band1", "band2"]
If no bands mentioned, return: []`;

      const aiResponse = await this.chatBot.getAIResponse(prompt, [], 'You extract band names from text.');
      
      let bands = [];
      try {
        const match = aiResponse.match(/\[.*\]/s);
        if (match) {
          bands = JSON.parse(match[0]);
        }
      } catch (e) {
        return;
      }

      const now = Date.now();
      for (const band of bands) {
        if (!band || typeof band !== 'string') continue;
        
        const bandName = band.trim();
        if (bandName.length < 2) continue;

        // Track mention
        const mentions = this.recentMusicMentions.get(bandName) || { count: 0, lastSeen: now };
        mentions.count++;
        mentions.lastSeen = now;
        this.recentMusicMentions.set(bandName, mentions);

        // Discover if threshold reached
        if (mentions.count >= this.discoveryThreshold) {
          await this.discoverBand(bandName);
          this.recentMusicMentions.delete(bandName);
        }
      }

      // Clean old mentions
      for (const [band, data] of this.recentMusicMentions.entries()) {
        if (now - data.lastSeen > 60 * 60 * 1000) {
          this.recentMusicMentions.delete(band);
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Discover a new band using AI
   */
  async discoverBand(bandName) {
    // Check if already discovered
    if (this.discoveredBands.find(b => b.name.toLowerCase() === bandName.toLowerCase())) {
      return;
    }

    console.log(`🎸 [Hipster] 🆕 DISCOVERING NEW BAND: ${bandName}`);

    try {
      const prompt = `Generate hipster-level knowledge about the band/artist "${bandName}". 

Create:
1. 6-8 passionate, opinionated facts about this band
2. Their general genre/style

Format as JSON:
{
  "genre": "genre name",
  "facts": ["fact 1", "fact 2", ...]
}

Make the facts enthusiastic, slightly pretentious, and show deep appreciation. Include opinions on their best work, why they're underrated, production style, etc.`;

      const aiResponse = await this.chatBot.getAIResponse(prompt, [], 'You are a music snob who discovers obscure bands.');
      
      const match = aiResponse.match(/\{[\s\S]*\}/);
      if (!match) return;

      const data = JSON.parse(match[0]);
      
      const newBand = {
        name: bandName,
        facts: data.facts || [],
        genre: data.genre || 'indie',
        firstSeen: Date.now(),
        timesActive: 0
      };

      this.discoveredBands.push(newBand);
      this.stats.bandsDiscovered++;
      
      console.log(`🎸 [Hipster] ✅ Discovered "${bandName}" (${newBand.genre}) with ${newBand.facts.length} facts`);
      
      await this.saveHistory();
    } catch (error) {
      console.error(`🎸 [Hipster] Failed to discover "${bandName}":`, error.message);
    }
  }

  /**
   * Setup periodic rotation
   */
  setupRotation() {
    setInterval(() => {
      if (this.discoveredBands.length > 0) {
        this.rotateFavorite();
      }
    }, (2 + Math.random() * 2) * 60 * 60 * 1000); // 2-4 hours
  }

  /**
   * Rotate to new or recurring favorite
   * ALLOWS returning with increased enthusiasm!
   */
  rotateFavorite() {
    if (this.discoveredBands.length === 0) return;

    const oldBand = this.currentFavorite?.name;

    // Weighted selection
    let weights = this.discoveredBands.map(band => {
      const history = this.bandHistory.get(band.name) || {
        timesActivated: 0,
        totalMentions: 0,
        lastActivated: 0,
        currentIntensity: 1.0,
        peakIntensity: 1.0
      };

      const timeSinceActive = Date.now() - (history.lastActivated || 0);
      const hoursSince = timeSinceActive / (1000 * 60 * 60);

      let weight = 1.0;

      // Prefer not-recent bands
      if (hoursSince > 12) weight *= 2.0;
      if (hoursSince > 48) weight *= 1.5;

      // 25% chance to return to previous favorite
      if (history.timesActivated > 0 && Math.random() < 0.25) {
        weight *= 3.0;
        console.log(`🎸 [Hipster] 🔄 High chance of returning to "${band.name}"`);
      }

      return weight;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    this.currentFavorite = this.discoveredBands[selectedIndex];

    // Update history
    const history = this.bandHistory.get(this.currentFavorite.name) || {
      timesActivated: 0,
      totalMentions: 0,
      lastActivated: 0,
      currentIntensity: 1.0,
      peakIntensity: 1.0
    };

    const isRecurrence = history.timesActivated > 0;
    if (isRecurrence) {
      history.currentIntensity = Math.min(3.0, history.currentIntensity + 0.4);
      history.peakIntensity = Math.max(history.peakIntensity, history.currentIntensity);
      
      console.log(`🎸 [Hipster] 🔥 RETURNING to "${this.currentFavorite.name}" - enthusiasm ${history.currentIntensity.toFixed(1)}x`);
    } else {
      console.log(`🎸 [Hipster] 🆕 First time being into "${this.currentFavorite.name}"`);
    }

    history.timesActivated++;
    history.lastActivated = Date.now();
    this.bandHistory.set(this.currentFavorite.name, history);

    this.favoriteIntensity = history.currentIntensity;
    this.currentFavorite.timesActive++;

    console.log(`🎸 [Hipster] Favorite: ${oldBand || 'none'} → ${this.currentFavorite.name} (enthusiasm: ${this.favoriteIntensity.toFixed(1)}x)`);

    this.saveHistory();
  }

  /**
   * Check if message triggers hipster mode
   */
  checkTrigger(message) {
    if (this.isActive || !this.currentFavorite) return false;

    const lowerMsg = message.toLowerCase();

    for (const trigger of this.musicTriggers) {
      if (lowerMsg.includes(trigger)) {
        // Activation chance increases with enthusiasm
        const activationChance = Math.min(0.5, 0.15 * this.favoriteIntensity);
        
        if (Math.random() < activationChance) {
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
    
    // Duration scales with enthusiasm
    const baseDuration = 3 + Math.random() * 4; // 3-7 minutes base
    this.duration = baseDuration * this.favoriteIntensity * 60 * 1000;
    
    const enthusiasm = Math.round(this.favoriteIntensity * 100);
    
    console.log('🎸🎸🎸 ==========================================');
    console.log('🎸 [Hipster] PROTOCOL ACTIVATED');
    console.log(`🎸 [Hipster] Current favorite: ${this.currentFavorite.name}`);
    console.log(`🎸 [Hipster] Enthusiasm: ${enthusiasm}%`);
    console.log(`🎸 [Hipster] Duration: ${(this.duration / 60000).toFixed(1)}m`);
    console.log('🎸🎸🎸 ==========================================');
    
    this.stats.totalActivations++;
    this.stats.mentionsByBand[this.currentFavorite.name] = 
      (this.stats.mentionsByBand[this.currentFavorite.name] || 0) + 1;

    const history = this.bandHistory.get(this.currentFavorite.name);
    if (history) {
      history.totalMentions++;
    }

    this.saveHistory();
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
    console.log(`🎸 [Hipster] Protocol deactivated (was: ${this.currentFavorite?.name})`);
    this.isActive = false;
    this.activatedAt = null;
  }

  /**
   * Get random fact about current favorite
   */
  getFact() {
    if (!this.isActive || !this.currentFavorite) return null;
    
    const facts = this.currentFavorite.facts;
    if (facts.length === 0) return null;
    
    return facts[Math.floor(Math.random() * facts.length)];
  }

  /**
   * Should mention band?
   */
  shouldMention() {
    if (!this.isActive || !this.currentFavorite) return false;
    
    // Higher enthusiasm = more likely to mention
    const mentionChance = Math.min(0.12, 0.04 * this.favoriteIntensity);
    return Math.random() < mentionChance;
  }

  /**
   * Get context for AI
   */
  getContext() {
    if (!this.isActive || !this.currentFavorite) return '';

    const enthusiasmDesc = this.favoriteIntensity >= 2.0 ? 'REALLY into' :
                          this.favoriteIntensity >= 1.5 ? 'very into' : 'into';

    return `\n🎸 HIPSTER MUSIC MODE (${Math.round(this.favoriteIntensity * 100)}% enthusiasm)
- You're ${enthusiasmDesc} ${this.currentFavorite.name} right now
- Genre: ${this.currentFavorite.genre}
- ${this.currentFavorite.timesActive > 1 ? 'You\'ve been into them before' : 'Newly discovered favorite'}
${this.favoriteIntensity >= 2.0 ? '- You\'re EVEN MORE into them than last time' : ''}
- ONLY mention them if music comes up naturally
- Be subtle - don't force it or hijack the conversation
- Let the conversation flow naturally
- Your taste in music is obviously superior`;
  }

  /**
   * Get mention for injection
   */
  async getMention() {
    if (!this.shouldMention()) return null;
    
    // Use dynamic phrase generator if available
    if (this.chatBot.dynamicPhraseGenerator) {
      return await this.chatBot.dynamicPhraseGenerator.generateBandMention(
        this.currentFavorite.name,
        this.favoriteIntensity
      );
    }
    
    // Fallback (should rarely be used)
    return `been listening to ${this.currentFavorite.name} nonstop`;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      isActive: this.isActive,
      currentFavorite: this.currentFavorite?.name || 'none',
      enthusiasm: this.favoriteIntensity,
      totalBands: this.discoveredBands.length,
      totalActivations: this.stats.totalActivations,
      bandsDiscovered: this.stats.bandsDiscovered,
      mentionsByBand: this.stats.mentionsByBand,
      bandHistory: Array.from(this.bandHistory.entries())
    };
  }
}

module.exports = HipsterProtocol;
