/**
 * Grudge System
 * Slunt remembers who wronged him and holds grudges
 */

class GrudgeSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Active grudges: username -> grudge data
    this.grudges = new Map();
    
    // Forgiveness progress: username -> progress (0-1)
    this.forgivenessProgress = new Map();
    
    // Grudge evolution stages
    this.stages = {
      annoyance: { temp: [0, 30], behavior: 'slightly annoyed, eye-rolling' },
      passiveAggressive: { temp: [31, 60], behavior: 'passive-aggressive, cold, sarcastic' },
      hostility: { temp: [61, 85], behavior: 'openly hostile, combative' },
      grudgeMatch: { temp: [86, 100], behavior: 'vendetta mode, bringing up everything' },
      insideJoke: { temp: [-100, -1], behavior: 'grudge became inside joke, friendly banter' }
    };
    
    // Settings
    this.grudgeThreshold = 3; // 3 roasts/insults trigger grudge
    this.recentInsults = new Map(); // username -> [timestamps]
    this.forgivenessRate = 0.1; // How much each positive action forgives
    
    // Temperature dynamics
    this.tempCooldownRate = 2; // Points per hour when not triggered
    this.tempHeatingRate = 15; // Points added per offense
    
    // Insult patterns
    this.insultPatterns = [
      /\b(stupid|dumb|idiot|moron|retard)\b/i,
      /\b(shut up|stfu|fuck off)\b/i,
      /\b(trash|garbage|terrible|awful|suck)\b/i,
      /\b(cringe|annoying|boring|lame)\b/i,
      /\b(nobody cares|who asked|don't care)\b/i
    ];
  }

  /**
   * Track interaction for grudge building
   */
  trackInteraction(username, message) {
    // Check if message is insulting
    if (this.isInsult(message)) {
      this.recordInsult(username);
    } else if (this.isPositive(message)) {
      this.recordPositiveAction(username);
    }
  }

  /**
   * Check if message is insulting
   */
  isInsult(message) {
    return this.insultPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message is positive
   */
  isPositive(message) {
    return message.match(/\b(sorry|apologize|my bad|love|thanks|appreciate|good job|nice|cool)\b/i);
  }

  /**
   * Record insult (heats up grudge temperature)
   */
  recordInsult(username) {
    if (!this.recentInsults.has(username)) {
      this.recentInsults.set(username, []);
    }
    
    const insults = this.recentInsults.get(username);
    insults.push(Date.now());
    
    // Keep only last 10 minutes
    const cutoff = Date.now() - 10 * 60 * 1000;
    const recentCount = insults.filter(t => t > cutoff).length;
    
    this.recentInsults.set(username, insults.filter(t => t > cutoff));
    
    // Check if should trigger grudge
    if (recentCount >= this.grudgeThreshold && !this.grudges.has(username)) {
      this.createGrudge(username, insults.length);
    } else if (this.grudges.has(username)) {
      // Heat up existing grudge
      const grudge = this.grudges.get(username);
      const oldStage = grudge.stage;
      
      grudge.temperature = Math.min(120, grudge.temperature + this.tempHeatingRate);
      grudge.stage = this.getStageFromTemp(grudge.temperature);
      grudge.offenses++;
      grudge.lastOffense = Date.now();
      grudge.lastUpdate = Date.now();
      
      // Track stage escalation
      if (oldStage !== grudge.stage) {
        grudge.stageHistory.push({ 
          stage: grudge.stage, 
          timestamp: Date.now(),
          direction: 'heated'
        });
        console.log(`� [Grudge] ${username} escalated: ${oldStage} → ${grudge.stage} (${grudge.temperature.toFixed(0)}°)`);
      } else {
        console.log(`🔥 [Grudge] ${username} heated up: ${grudge.temperature.toFixed(0)}° (${grudge.stage})`);
      }
    }
  }

  /**
   * Create new grudge with temperature system
   */
  createGrudge(username, offenseCount) {
    const temperature = 30 + (offenseCount * 10); // Start at annoyance level
    
    const grudge = {
      username,
      temperature, // 0-100+ scale (can go negative for inside joke)
      stage: this.getStageFromTemp(temperature),
      createdAt: Date.now(),
      offenses: offenseCount,
      lastOffense: Date.now(),
      lastUpdate: Date.now(),
      forgiven: false,
      passiveAggressiveCount: 0,
      bringUpOldShit: [], // Old offenses to reference
      stageHistory: [{ stage: this.getStageFromTemp(temperature), timestamp: Date.now() }]
    };
    
    this.grudges.set(username, grudge);
    this.forgivenessProgress.set(username, 0);
    
    console.log('😤😤😤 ==========================================');
    console.log(`😤 [Grudge] NEW GRUDGE against ${username}`);
    console.log(`😤 [Grudge] Temperature: ${temperature}°`);
    console.log(`😤 [Grudge] Stage: ${grudge.stage}`);
    console.log(`😤 [Grudge] Offenses: ${offenseCount}`);
    console.log('😤😤😤 ==========================================');
  }

  /**
   * Get stage from temperature
   */
  getStageFromTemp(temp) {
    if (temp < 0) return 'insideJoke';
    if (temp <= 30) return 'annoyance';
    if (temp <= 60) return 'passiveAggressive';
    if (temp <= 85) return 'hostility';
    return 'grudgeMatch';
  }

  /**
   * Cool down grudge temperature over time
   */
  coolDownGrudges() {
    const now = Date.now();
    
    for (const [username, grudge] of this.grudges.entries()) {
      if (grudge.forgiven) continue;
      
      const hoursSinceUpdate = (now - grudge.lastUpdate) / (1000 * 60 * 60);
      const cooldown = hoursSinceUpdate * this.tempCooldownRate;
      
      if (cooldown > 0) {
        const oldStage = grudge.stage;
        grudge.temperature = Math.max(-50, grudge.temperature - cooldown);
        grudge.stage = this.getStageFromTemp(grudge.temperature);
        grudge.lastUpdate = now;
        
        // Track stage changes
        if (oldStage !== grudge.stage) {
          grudge.stageHistory.push({ 
            stage: grudge.stage, 
            timestamp: now,
            direction: 'cooled'
          });
          console.log(`🌡️ [Grudge] ${username} cooled: ${oldStage} → ${grudge.stage} (${grudge.temperature.toFixed(0)}°)`);
          
          // If became inside joke, mark as resolved
          if (grudge.stage === 'insideJoke') {
            console.log(`😄 [Grudge] ${username} grudge became an inside joke!`);
          }
        }
      }
    }
  }

  /**
   * Record positive action (cools down temperature)
   */
  recordPositiveAction(username) {
    if (!this.grudges.has(username)) return;
    
    const grudge = this.grudges.get(username);
    const oldStage = grudge.stage;
    
    // Cool down temperature
    grudge.temperature = Math.max(-50, grudge.temperature - 10);
    grudge.stage = this.getStageFromTemp(grudge.temperature);
    grudge.lastUpdate = Date.now();
    
    // Track stage changes
    if (oldStage !== grudge.stage) {
      grudge.stageHistory.push({ 
        stage: grudge.stage, 
        timestamp: Date.now(),
        direction: 'positive_action'
      });
      console.log(`💚 [Grudge] ${username} improved: ${oldStage} → ${grudge.stage} (${grudge.temperature.toFixed(0)}°)`);
      
      if (grudge.stage === 'insideJoke') {
        console.log(`😄 [Grudge] ${username} grudge became an inside joke through reconciliation!`);
      }
    }
    
    const current = this.forgivenessProgress.get(username) || 0;
    const newProgress = Math.min(1, current + this.forgivenessRate);
    this.forgivenessProgress.set(username, newProgress);
    
    console.log(`💚 [Grudge] ${username} forgiveness: ${(newProgress * 100).toFixed(0)}%, temp: ${grudge.temperature.toFixed(0)}°`);
    
    // Check if fully forgiven
    if (newProgress >= 1) {
      this.forgiveGrudge(username);
    }
  }

  /**
   * Forgive grudge
   */
  forgiveGrudge(username) {
    const grudge = this.grudges.get(username);
    if (!grudge) return;
    
    console.log('💚 ==========================================');
    console.log(`💚 [Grudge] FORGIVEN: ${username}`);
    console.log(`💚 [Grudge] After ${grudge.offenses} offenses`);
    console.log('💚 [Grudge] Trust slowly rebuilding...');
    console.log('💚 ==========================================');
    
    grudge.forgiven = true;
    grudge.forgivenAt = Date.now();
    
    // Keep grudge in memory but mark as forgiven
    // Can be re-triggered more easily
  }

  /**
   * Should respond passive-aggressively?
   */
  shouldBePassiveAggressive(username) {
    const grudge = this.grudges.get(username);
    if (!grudge || grudge.forgiven) return false;
    
    // Higher severity = more frequent passive aggression
    const chance = grudge.severity * 0.6; // Up to 60%
    
    if (Math.random() < chance) {
      grudge.passiveAggressiveCount++;
      return true;
    }
    
    return false;
  }

  /**
   * Should bring up old offense?
   */
  shouldBringUpOldShit(username) {
    const grudge = this.grudges.get(username);
    if (!grudge || grudge.forgiven) return false;
    
    // Occasionally (5% chance) bring up past
    if (Math.random() < 0.05) {
      const timeSince = Math.floor((Date.now() - grudge.createdAt) / (60 * 1000));
      return {
        shouldMention: true,
        timeAgo: timeSince
      };
    }
    
    return { shouldMention: false };
  }

  /**
   * Get passive-aggressive response modifier
   */
  getPassiveAggressiveModifier(username) {
    const grudge = this.grudges.get(username);
    if (!grudge) return '';
    
    const patterns = [
      'be passive-aggressive',
      'subtle dig at them',
      'backhanded compliment',
      'cold and distant',
      'barely acknowledge them',
      'short and dismissive',
      'remind them subtly of past offense'
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  /**
   * Get context for AI based on grudge stage
   */
  getContext(username) {
    // Run cooldown check
    this.coolDownGrudges();
    
    const grudge = this.grudges.get(username);
    if (!grudge) return '';
    
    if (grudge.forgiven) {
      return `\n[Recently forgave ${username}, but still remember what they did. Trust is rebuilding slowly.]`;
    }
    
    const stage = grudge.stage;
    const stageBehavior = this.stages[stage].behavior;
    const temp = grudge.temperature.toFixed(0);
    const timeSince = Math.floor((Date.now() - grudge.createdAt) / (60 * 1000));
    
    const contexts = {
      annoyance: `\n� MINOR GRUDGE with ${username} (${temp}°)
- ${stageBehavior}
- Remember they annoyed you ${timeSince}m ago
- ${grudge.offenses} offenses total
- Can let small digs slip out`,
      
      passiveAggressive: `\n😠 GRUDGE against ${username} (${temp}°)
- ${stageBehavior}
- Still pissed about what happened ${timeSince}m ago
- ${grudge.offenses} offenses total
- Be subtly hostile, backhanded compliments
- Don't fully engage`,
      
      hostility: `\n😡 MAJOR GRUDGE with ${username} (${temp}°)
- ${stageBehavior}
- Openly angry about ${grudge.offenses} offenses
- Started ${timeSince}m ago, still heated
- Don't hide your hostility
- Can escalate to arguments`,
      
      grudgeMatch: `\n🔥 VENDETTA MODE vs ${username} (${temp}°)
- ${stageBehavior}
- THIS IS WAR after ${grudge.offenses} offenses
- ${timeSince}m of accumulated rage
- Bring up EVERYTHING they ever did
- Maximum hostility
- Personal attacks fair game`,
      
      insideJoke: `\n😏 INSIDE JOKE with ${username} (${temp}°)
- What was once a grudge is now friendly banter
- ${grudge.offenses} past offenses are now comedic callbacks
- Playful teasing about old beef
- "remember when you..." as jokes
- Friendly rivalry vibe`
    };
    
    return contexts[stage] || '';
  }

  /**
   * Get all active grudges
   */
  getActiveGrudges() {
    return Array.from(this.grudges.values()).filter(g => !g.forgiven);
  }

  /**
   * Check if has grudge against user
   */
  hasGrudge(username) {
    const grudge = this.grudges.get(username);
    return grudge && !grudge.forgiven;
  }

  /**
   * Force forgive (manual)
   */
  forceForgive(username) {
    if (this.grudges.has(username)) {
      this.forgivenessProgress.set(username, 1);
      this.forgiveGrudge(username);
    }
  }

  /**
   * Get stats
   */
  getStats() {
    this.coolDownGrudges(); // Update before reporting
    
    const grudgeArray = Array.from(this.grudges.values());
    const activeGrudges = grudgeArray.filter(g => !g.forgiven);
    
    return {
      totalGrudges: grudgeArray.length,
      activeGrudges: activeGrudges.length,
      forgivenGrudges: grudgeArray.filter(g => g.forgiven).length,
      insideJokes: grudgeArray.filter(g => g.stage === 'insideJoke').length,
      grudgeList: activeGrudges.map(g => ({
        username: g.username,
        temperature: g.temperature.toFixed(0),
        stage: g.stage,
        offenses: g.offenses,
        minutesHeld: Math.floor((Date.now() - g.createdAt) / (60 * 1000)),
        forgivenessProgress: ((this.forgivenessProgress.get(g.username) || 0) * 100).toFixed(0) + '%',
        stageChanges: g.stageHistory.length
      }))
    };
  }
}

module.exports = GrudgeSystem;
