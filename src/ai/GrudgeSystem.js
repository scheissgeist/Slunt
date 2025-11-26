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
    
    // Settings
    this.grudgeThreshold = 3; // 3 roasts/insults trigger grudge
    this.recentInsults = new Map(); // username -> [timestamps]
    this.grudgeDuration = 2 * 60 * 60 * 1000; // 2 hours minimum
    this.forgivenessRate = 0.1; // How much each positive action forgives
    
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
   * Record insult
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
      // Make existing grudge worse
      const grudge = this.grudges.get(username);
      grudge.severity = Math.min(1, grudge.severity + 0.1);
      grudge.offenses++;
      
      console.log(`😠 [Grudge] Grudge against ${username} worsened (severity: ${(grudge.severity * 100).toFixed(0)}%)`);
    }
  }

  /**
   * Create new grudge
   */
  createGrudge(username, offenseCount) {
    const severity = Math.min(1, 0.5 + (offenseCount / 10)); // 50% base + more for more offenses
    
    const grudge = {
      username,
      severity, // 0-1
      createdAt: Date.now(),
      offenses: offenseCount,
      lastOffense: Date.now(),
      forgiven: false,
      passiveAggressiveCount: 0,
      bringUpOldShit: [] // Old offenses to reference
    };
    
    this.grudges.set(username, grudge);
    this.forgivenessProgress.set(username, 0);
    
    console.log('😤😤😤 ==========================================');
    console.log(`😤 [Grudge] NEW GRUDGE against ${username}`);
    console.log(`😤 [Grudge] Severity: ${(severity * 100).toFixed(0)}%`);
    console.log(`😤 [Grudge] Offenses: ${offenseCount}`);
    console.log('😤😤😤 ==========================================');
  }

  /**
   * Record positive action (moves toward forgiveness)
   */
  recordPositiveAction(username) {
    if (!this.grudges.has(username)) return;
    
    const current = this.forgivenessProgress.get(username) || 0;
    const newProgress = Math.min(1, current + this.forgivenessRate);
    
    this.forgivenessProgress.set(username, newProgress);
    
    console.log(`💚 [Grudge] ${username} forgiveness: ${(newProgress * 100).toFixed(0)}%`);
    
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
   * Get context for AI
   */
  getContext(username) {
    const grudge = this.grudges.get(username);
    if (!grudge) return '';
    
    if (grudge.forgiven) {
      return `\n[Recently forgave ${username}, but still remember what they did. Trust is rebuilding slowly.]`;
    }
    
    const severity = grudge.severity;
    const timeSince = Math.floor((Date.now() - grudge.createdAt) / (60 * 1000));
    
    return `\n😤 GRUDGE AGAINST ${username} (${(severity * 100).toFixed(0)}% severity)
- Remember they wronged you ${timeSince}m ago
- ${grudge.offenses} total offenses
- Be passive-aggressive or cold
- Don't fully engage
- Can bring up past slights
- Forgiveness progress: ${((this.forgivenessProgress.get(username) || 0) * 100).toFixed(0)}%`;
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
    const grudgeArray = Array.from(this.grudges.values());
    const activeGrudges = grudgeArray.filter(g => !g.forgiven);
    
    return {
      totalGrudges: grudgeArray.length,
      activeGrudges: activeGrudges.length,
      forgivenGrudges: grudgeArray.filter(g => g.forgiven).length,
      grudgeList: activeGrudges.map(g => ({
        username: g.username,
        severity: g.severity,
        offenses: g.offenses,
        minutesHeld: Math.floor((Date.now() - g.createdAt) / (60 * 1000)),
        forgivenessProgress: this.forgivenessProgress.get(g.username) || 0
      }))
    };
  }
}

module.exports = GrudgeSystem;
