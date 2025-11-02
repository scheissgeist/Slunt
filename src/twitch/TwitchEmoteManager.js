// TwitchEmoteManager.js
// Manages Twitch emotes (global, channel-specific, BTTV, FFZ, 7TV)
const fs = require('fs').promises;
const path = require('path');

class TwitchEmoteManager {
  constructor(channelName) {
    this.channelName = channelName?.toLowerCase();
    this.emotes = {
      global: [],      // Twitch global emotes
      channel: [],     // Channel-specific subscriber emotes
      bttv: [],        // BetterTTV emotes
      ffz: [],         // FrankerFaceZ emotes
      seventv: []      // 7TV emotes
    };
    
    this.emoteCooldowns = new Map(); // emote -> last used timestamp
    this.cooldownTime = 30000; // 30 seconds between same emote
    
    this.savePath = './data/twitch_emotes.json';
    this.lastFetch = 0;
    this.fetchInterval = 3600000; // Refresh every hour
    
    this.loadEmotes();
  }

  /**
   * Load emotes from disk
   */
  async loadEmotes() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const parsed = JSON.parse(data);
      
      if (parsed.channel === this.channelName) {
        this.emotes = parsed.emotes || this.emotes;
        this.lastFetch = parsed.lastFetch || 0;
        console.log(`😊 [TwitchEmotes] Loaded ${this.getTotalEmoteCount()} emotes for ${this.channelName}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('😊 [TwitchEmotes] Error loading:', error.message);
      }
    }
  }

  /**
   * Save emotes to disk
   */
  async saveEmotes() {
    try {
      const dir = path.dirname(this.savePath);
      await fs.mkdir(dir, { recursive: true });

      const data = {
        channel: this.channelName,
        emotes: this.emotes,
        lastFetch: this.lastFetch,
        savedAt: Date.now()
      };

      await fs.writeFile(this.savePath, JSON.stringify(data, null, 2));
      console.log(`😊 [TwitchEmotes] Saved ${this.getTotalEmoteCount()} emotes`);
    } catch (error) {
      console.error('😊 [TwitchEmotes] Error saving:', error.message);
    }
  }

  /**
   * Fetch all emotes for the channel
   */
  async fetchEmotes(channelId) {
    if (!this.channelName) {
      console.log('😊 [TwitchEmotes] No channel configured');
      return;
    }

    // Don't fetch too frequently
    if (Date.now() - this.lastFetch < this.fetchInterval) {
      console.log(`😊 [TwitchEmotes] Using cached emotes (${this.getTotalEmoteCount()} total)`);
      return;
    }

    console.log(`😊 [TwitchEmotes] Fetching emotes for ${this.channelName}...`);

    try {
      // Fetch BTTV emotes (no auth required)
      await this.fetchBTTVEmotes();
      
      // Fetch FFZ emotes (no auth required)
      await this.fetchFFZEmotes();
      
      // Fetch 7TV emotes (no auth required)
      await this.fetch7TVEmotes();
      
      // Add common global Twitch emotes (these are always available)
      this.addGlobalEmotes();
      
      this.lastFetch = Date.now();
      await this.saveEmotes();
      
      console.log(`😊 [TwitchEmotes] Total emotes: ${this.getTotalEmoteCount()}`);
    } catch (error) {
      console.error('😊 [TwitchEmotes] Fetch error:', error.message);
    }
  }

  /**
   * Fetch BTTV emotes
   */
  async fetchBTTVEmotes() {
    try {
      const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${this.channelName}`);
      if (!response.ok) {
        console.log('😊 [TwitchEmotes] BTTV: No emotes or channel not found');
        return;
      }
      
      const data = await response.json();
      
      // Channel emotes
      if (data.channelEmotes) {
        this.emotes.bttv = data.channelEmotes.map(e => e.code);
      }
      
      // Shared emotes
      if (data.sharedEmotes) {
        this.emotes.bttv.push(...data.sharedEmotes.map(e => e.code));
      }
      
      console.log(`😊 [TwitchEmotes] BTTV: ${this.emotes.bttv.length} emotes`);
    } catch (error) {
      console.error('😊 [TwitchEmotes] BTTV error:', error.message);
    }
  }

  /**
   * Fetch FFZ emotes
   */
  async fetchFFZEmotes() {
    try {
      const response = await fetch(`https://api.frankerfacez.com/v1/room/${this.channelName}`);
      if (!response.ok) {
        console.log('😊 [TwitchEmotes] FFZ: No emotes or channel not found');
        return;
      }
      
      const data = await response.json();
      
      if (data.sets) {
        const allEmotes = [];
        Object.values(data.sets).forEach(set => {
          if (set.emoticons) {
            allEmotes.push(...set.emoticons.map(e => e.name));
          }
        });
        
        this.emotes.ffz = allEmotes;
        console.log(`😊 [TwitchEmotes] FFZ: ${this.emotes.ffz.length} emotes`);
      }
    } catch (error) {
      console.error('😊 [TwitchEmotes] FFZ error:', error.message);
    }
  }

  /**
   * Fetch 7TV emotes
   */
  async fetch7TVEmotes() {
    try {
      const response = await fetch(`https://7tv.io/v3/users/twitch/${this.channelName}`);
      if (!response.ok) {
        console.log('😊 [TwitchEmotes] 7TV: No emotes or channel not found');
        return;
      }
      
      const data = await response.json();
      
      if (data.emote_set?.emotes) {
        this.emotes.seventv = data.emote_set.emotes.map(e => e.name);
        console.log(`😊 [TwitchEmotes] 7TV: ${this.emotes.seventv.length} emotes`);
      }
    } catch (error) {
      console.error('😊 [TwitchEmotes] 7TV error:', error.message);
    }
  }

  /**
   * Add common global Twitch emotes (ONLY emotes that work without extensions/subs)
   */
  addGlobalEmotes() {
    // ONLY TRUE global Twitch emotes that work for everyone without browser extensions
    // NOTE: Emotes like KEKW, Sadge, monkaS are BTTV/FFZ and require browser extensions!
    this.emotes.global = [
      // Classic global emotes (these work for all users)
      'Kappa', 'PogChamp', 'LUL', 'TriHard', 'BibleThump', 'NotLikeThis',
      'ResidentSleeper', 'Kreygasm', 'DansGame', 'SwiftRage', 'PJSalt',
      'Keepo', 'KappaHD', 'KappaPride', 'EleGiggle', '4Head',
      
      // More global reactions
      'CoolStoryBob', 'WutFace', 'OSFrog', 'SeemsGood', 'BabyRage',
      'HeyGuys', 'VoHiYo', 'SMOrc', 'MingLee', 'KomodoHype'
    ];
    
    // NOTE: BTTV/FFZ emotes (KEKW, Sadge, Pog, PogU, monkaS, etc.) are fetched separately
    // and only work if the viewer has browser extensions installed
    
    // Add broteam channel-specific emotes
    if (this.channelName === 'broteam') {
      this.emotes.channel = [
        'broteStopit', 'broteBelieve', 'broteSkell', 'brotePeets', 'broteSodies',
        'broteTactical', 'broteSteven', 'brote599', 'broteClown', 'broteGhost',
        'broteRito', 'broteGob', 'broteWing', 'broteBill', 'brotePill',
        'broteTOM', 'broteCatte', 'broteGoblin', 'brotePeter'
      ];
      console.log(`😊 [TwitchEmotes] Added ${this.emotes.channel.length} broteam channel emotes`);
    }
  }

  /**
   * Get a random emote from available emotes
   */
  getRandomEmote(category = null) {
    let pool = [];
    
    if (category && this.emotes[category]) {
      pool = this.emotes[category];
    } else {
      // All emotes
      pool = [
        ...this.emotes.global,
        ...this.emotes.channel,
        ...this.emotes.bttv,
        ...this.emotes.ffz,
        ...this.emotes.seventv
      ];
    }
    
    if (pool.length === 0) {
      return null;
    }
    
    // Filter out emotes on cooldown
    const availableEmotes = pool.filter(emote => !this.isOnCooldown(emote));
    
    if (availableEmotes.length === 0) {
      // All on cooldown, just pick any
      return pool[Math.floor(Math.random() * pool.length)];
    }
    
    const emote = availableEmotes[Math.floor(Math.random() * availableEmotes.length)];
    this.markUsed(emote);
    return emote;
  }

  /**
   * Get emotes matching mood/emotion
   */
  getEmoteForMood(mood) {
    const moodMappings = {
      happy: ['KEKW', 'LUL', 'EleGiggle', 'widePeepoHappy', 'FeelsGoodMan', 'PogChamp', 'Pog', 'PogU', 'broteBelieve'],
      excited: ['PogChamp', 'Pog', 'PogU', 'KomodoHype', 'Kreygasm', 'brote599', 'broteTactical'],
      sad: ['Sadge', 'BibleThump', 'FeelsBadMan', 'PepeHands'],
      confused: ['WutFace', 'monkaS', 'WeirdChamp', 'broteSkell'],
      annoyed: ['ResidentSleeper', 'DansGame', 'PJSalt', 'SwiftRage', 'broteStopit'],
      bored: ['ResidentSleeper', 'NotLikeThis', 'broteSodies'],
      neutral: ['Kappa', 'KappaPride', 'SeemsGood', 'HeyGuys', 'brotePeets'],
      angry: ['SwiftRage', 'BabyRage', 'broteStopit'],
      scared: ['monkaS', 'monkaW', 'broteGhost'],
      silly: ['broteClown', 'broteGoblin', 'broteCatte', 'brotePeter'],
      tactical: ['broteTactical', 'broteSteven', 'broteBill']
    };
    
    const emotes = moodMappings[mood] || moodMappings.neutral;
    
    // Filter available emotes
    const available = emotes.filter(e => this.hasEmote(e) && !this.isOnCooldown(e));
    
    if (available.length === 0) {
      return this.getRandomEmote(); // Fallback
    }
    
    const emote = available[Math.floor(Math.random() * available.length)];
    this.markUsed(emote);
    return emote;
  }

  /**
   * Check if emote is available
   */
  hasEmote(emoteName) {
    return this.emotes.global.includes(emoteName) ||
           this.emotes.channel.includes(emoteName) ||
           this.emotes.bttv.includes(emoteName) ||
           this.emotes.ffz.includes(emoteName) ||
           this.emotes.seventv.includes(emoteName);
  }

  /**
   * Check if emote is on cooldown
   */
  isOnCooldown(emote) {
    const lastUsed = this.emoteCooldowns.get(emote);
    if (!lastUsed) return false;
    
    return Date.now() - lastUsed < this.cooldownTime;
  }

  /**
   * Mark emote as used
   */
  markUsed(emote) {
    this.emoteCooldowns.set(emote, Date.now());
  }

  /**
   * Add emote to message (appends or prepends)
   */
  addEmoteToMessage(message, emote = null, position = 'end') {
    if (!emote) {
      emote = this.getRandomEmote();
    }
    
    if (!emote) return message;
    
    if (position === 'start') {
      return `${emote} ${message}`;
    } else {
      return `${message} ${emote}`;
    }
  }

  /**
   * Maybe add emote to message (20% chance)
   */
  maybeAddEmote(message, mood = null) {
    if (Math.random() > 0.20) {
      return message; // 80% of time, no emote
    }
    
    const emote = mood ? this.getEmoteForMood(mood) : this.getRandomEmote();
    
    if (!emote) return message;
    
    // 50/50 start or end
    const position = Math.random() < 0.5 ? 'start' : 'end';
    return this.addEmoteToMessage(message, emote, position);
  }

  /**
   * Get total emote count
   */
  getTotalEmoteCount() {
    return this.emotes.global.length +
           this.emotes.channel.length +
           this.emotes.bttv.length +
           this.emotes.ffz.length +
           this.emotes.seventv.length;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      channel: this.channelName,
      total: this.getTotalEmoteCount(),
      global: this.emotes.global.length,
      channel: this.emotes.channel.length,
      bttv: this.emotes.bttv.length,
      ffz: this.emotes.ffz.length,
      seventv: this.emotes.seventv.length,
      lastFetch: this.lastFetch ? new Date(this.lastFetch).toLocaleString() : 'Never'
    };
  }
}

module.exports = TwitchEmoteManager;
