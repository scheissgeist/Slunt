/**
 * Embarrassing Item Left Behind System
 * Slunt casually roasts absent users by claiming they left something embarrassing
 * "hey if anyone sees [user], could you let him know I have his [embarrassing item]"
 */

class EmbarrassingItemRoast {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Track recent roasts to avoid repetition
    this.recentRoasts = new Map(); // username -> timestamp
    
    // Cooldown between roasts (per user)
    this.roastCooldown = 2 * 60 * 60 * 1000; // 2 hours
    
    // Global cooldown (any roast)
    this.lastRoastTime = 0;
    this.globalCooldown = 30 * 60 * 1000; // 30 minutes between any roasts
    
    // Embarrassing items (categorized by severity)
    this.embarrassingItems = {
      // Mild - just weird
      mild: [
        'collection of toenail clippings',
        'waifu body pillow',
        'furry tail butt plug',
        'anime figurine with suspicious stains',
        'fedora collection',
        'katana (mall ninja edition)',
        'vape that looks like a lightsaber',
        'my little pony fleshlight',
        'jar with a rainbow dash figure in it',
        'extensive collection of hentai DVDs',
        'sonic OC commission',
        'wolf shirt from walmart',
        'fingerless gloves',
        'guy fawkes mask',
        'tactical cargo shorts',
        'collection of mountain dew bottles with piss in them',
        'crusty gaming chair',
        'waifu mousepad with the boob wrist rest'
      ],
      
      // Medium - embarrassing personal items
      medium: [
        'diary where every entry is about his ex',
        'list of people he thinks are reptilians',
        'manifesto (unfinished)',
        'emergency hormone blockers',
        'bottle of "male enhancement" pills',
        'self-published novel about a cool guy who is definitely not him',
        'screenplay for a joker origin story sequel',
        'business cards for his "alpha male coaching" business',
        'vision board that\'s just pictures of andrew tate',
        'collection of screenshots of arguments he "won"',
        'folder labeled "evidence" full of random screenshots',
        'notebook full of sick comebacks he thought of too late',
        'LinkedIn profile printed out with his own endorsements circled',
        'crypto wallet recovery phrase tattooed on his thigh',
        'list of people who "wronged" him with detailed revenge plans'
      ],
      
      // Spicy - oddly specific roasts
      spicy: [
        'application to be a reddit moderator',
        'screenplay where he saves everyone and gets the girl',
        'folder of Discord screenshots proving he was right',
        'jar of belly button lint he\'s been saving since 2019',
        'tinder profile where he lists his IQ',
        'framed certificate for "completing" an online course',
        'collection of fedex tracking numbers from funkopop purchases',
        'energy drink collection arranged by how many times he\'s told people about it',
        'gaming chair that definitely hasn\'t been wiped down',
        'list of Wikipedia articles he\'s edited to include himself',
        'backup of his old Tumblr that I really don\'t think he wants anyone to see',
        'car with anime girl decals and a hentai bumper sticker',
        'collection of hotel shampoo bottles he stole',
        'bag of beard hair he saved for "reasons"'
      ]
    };
    
    // Pronouns (randomized)
    this.pronouns = ['his', 'their', 'her'];
    
    // Settings
    this.triggerChance = 0.02; // 2% chance when conditions are met
    
    // Stats
    this.stats = {
      totalRoasts: 0,
      roastsByUser: new Map(),
      roastsBySeverity: { mild: 0, medium: 0, spicy: 0 }
    };
  }

  /**
   * Check if should roast an absent user
   * Called during proactive message generation
   */
  shouldRoast() {
    // Global cooldown check
    if (Date.now() - this.lastRoastTime < this.globalCooldown) {
      return false;
    }
    
    // Random chance
    if (Math.random() > this.triggerChance) {
      return false;
    }
    
    // Need to have recent user activity to pick from
    const candidate = this.findRoastCandidate();
    if (!candidate) {
      return false;
    }
    
    return true;
  }

  /**
   * Find a good candidate to roast
   * Must be: recently active, currently absent, not roasted recently
   */
  findRoastCandidate() {
    // Get users who were active in last 2-4 hours but not in last 30 minutes
    const now = Date.now();
    const minAbsence = 30 * 60 * 1000; // 30 minutes ago
    const maxAbsence = 4 * 60 * 60 * 1000; // 4 hours ago
    
    const candidates = [];
    
    // Check relationship mapping for recent activity
    if (this.chatBot.relationshipMapping) {
      const relationships = this.chatBot.relationshipMapping.relationships;
      
      for (const [key, data] of relationships.entries()) {
        // Parse username from key (format: "user1 ↔ user2")
        const users = key.split(' ↔ ');
        for (const username of users) {
          if (username === 'Slunt') continue;
          
          const lastSeen = data.lastInteraction || 0;
          const timeSinceLastSeen = now - lastSeen;
          
          // Check if they're in the sweet spot
          if (timeSinceLastSeen > minAbsence && timeSinceLastSeen < maxAbsence) {
            // Check cooldown
            const lastRoast = this.recentRoasts.get(username) || 0;
            if (now - lastRoast > this.roastCooldown) {
              candidates.push({
                username,
                lastSeen,
                strength: data.strength || 1
              });
            }
          }
        }
      }
    }
    
    // Also check social awareness for known active users
    if (this.chatBot.socialAwareness && typeof this.chatBot.socialAwareness.getActiveUsers === 'function' && candidates.length < 5) {
      const activeUsers = this.chatBot.socialAwareness.getActiveUsers();
      
      for (const username of activeUsers) {
        if (candidates.some(c => c.username === username)) continue;
        
        // Check user profiles for last interaction
        const profile = this.chatBot.userProfiles.get(username);
        if (profile && profile.lastInteraction) {
          const timeSinceLastSeen = now - profile.lastInteraction;
          
          if (timeSinceLastSeen > minAbsence && timeSinceLastSeen < maxAbsence) {
            const lastRoast = this.recentRoasts.get(username) || 0;
            if (now - lastRoast > this.roastCooldown) {
              candidates.push({
                username,
                lastSeen: profile.lastInteraction,
                strength: 3 // Default relationship strength
              });
            }
          }
        }
      }
    }
    
    if (candidates.length === 0) return null;
    
    // Prefer users with stronger relationships (funnier to roast friends)
    candidates.sort((a, b) => b.strength - a.strength);
    
    // Return top candidate
    return candidates[0];
  }

  /**
   * Generate embarrassing item roast
   */
  generateRoast() {
    const candidate = this.findRoastCandidate();
    if (!candidate) return null;
    
    const { username } = candidate;
    
    // Pick severity based on relationship strength
    let severity = 'mild';
    if (candidate.strength >= 10) {
      // Close friends get spicy roasts
      const roll = Math.random();
      if (roll < 0.4) severity = 'spicy';
      else if (roll < 0.7) severity = 'medium';
    } else if (candidate.strength >= 5) {
      // Moderate friends get medium/mild
      severity = Math.random() < 0.5 ? 'medium' : 'mild';
    }
    
    // Pick random item from severity tier
    const items = this.embarrassingItems[severity];
    const item = items[Math.floor(Math.random() * items.length)];
    
    // Pick random pronoun
    const pronoun = this.pronouns[Math.floor(Math.random() * this.pronouns.length)];
    
    // Generate the roast with variations
    const templates = [
      `hey if anyone sees ${username}, could you let them know I have ${pronoun} ${item}`,
      `btw if ${username} shows up, tell them I found ${pronoun} ${item}`,
      `someone tell ${username} I have ${pronoun} ${item} when they get back`,
      `oh yeah, ${username} left ${pronoun} ${item} here, someone remind me to give it back`,
      `${username} forgot ${pronoun} ${item}, if anyone sees them let them know`,
      `hey does anyone know when ${username} is coming back? I still have ${pronoun} ${item}`,
      `reminder that I'm still holding onto ${username}'s ${item} if they want it back`
    ];
    
    const roast = templates[Math.floor(Math.random() * templates.length)];
    
    // Track roast
    this.recentRoasts.set(username, Date.now());
    this.lastRoastTime = Date.now();
    this.stats.totalRoasts++;
    
    const userRoasts = this.stats.roastsByUser.get(username) || 0;
    this.stats.roastsByUser.set(username, userRoasts + 1);
    
    this.stats.roastsBySeverity[severity]++;
    
    console.log(`😈 [EmbarrassingItem] Roasting absent user ${username} (${severity})`);
    console.log(`😈 [EmbarrassingItem] "${roast}"`);
    
    return roast;
  }

  /**
   * Get context for AI (not used much, this system generates its own messages)
   */
  getContext() {
    const candidate = this.findRoastCandidate();
    if (candidate) {
      return `\n😈 Could casually roast ${candidate.username} (they're absent)`;
    }
    return '';
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalRoasts: this.stats.totalRoasts,
      roastsBySeverity: this.stats.roastsBySeverity,
      topRoastedUsers: Array.from(this.stats.roastsByUser.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([user, count]) => ({ user, count })),
      nextRoastAvailable: this.lastRoastTime + this.globalCooldown - Date.now() > 0
        ? ((this.lastRoastTime + this.globalCooldown - Date.now()) / 60000).toFixed(1) + ' min'
        : 'now'
    };
  }
}

module.exports = EmbarrassingItemRoast;
