/**
 * Victory Celebration System
 * Detects when Slunt successfully roasts/dunks on someone and celebrates
 */

class VictoryCelebration {
  constructor() {
    this.recentVictories = [];
    this.victoryThreshold = 0.7; // How good the roast needs to be

    // Victory celebration messages (generated contextually)
    this.celebrationStyles = [
      'subtle', // Just a short acknowledgment
      'confident', // Medium confidence
      'braggy' // Full celebration mode
    ];
  }

  /**
   * Detect if a message was a successful roast/dunk
   */
  detectVictory(message, targetUser) {
    const lowerMsg = message.toLowerCase();

    // Indicators of a roast/dunk
    const roastIndicators = [
      /\blmao\b/,
      /\bloser\b/,
      /\bdestroyed\b/,
      /\bowned\b/,
      /\brekt\b/,
      /\bwrecked\b/,
      /imagine/,
      /\bcope\b/,
      /\bseething\b/,
      /\bclown\b/,
      /\bmald/,
      /actually .*(stupid|dumb|wrong)/,
      /sit down/,
      /hold this L/
    ];

    let roastScore = 0;

    // Check for roast indicators
    for (const indicator of roastIndicators) {
      if (indicator.test(lowerMsg)) {
        roastScore += 0.2;
      }
    }

    // Longer, more elaborate = likely better roast
    if (message.length > 80 && message.length < 200) {
      roastScore += 0.1;
    }

    // Contains target username
    if (targetUser && lowerMsg.includes(targetUser.toLowerCase())) {
      roastScore += 0.15;
    }

    // Question mark (rhetorical roasts)
    if (message.includes('?') && message.length > 40) {
      roastScore += 0.1;
    }

    // If roast score is high enough, it's a victory
    if (roastScore >= this.victoryThreshold) {
      this.recordVictory(message, targetUser, roastScore);
      return true;
    }

    return false;
  }

  /**
   * Record a victory
   */
  recordVictory(message, targetUser, score) {
    this.recentVictories.push({
      message: message.substring(0, 100),
      target: targetUser,
      score,
      timestamp: Date.now()
    });

    // Keep last 20 victories
    if (this.recentVictories.length > 20) {
      this.recentVictories.shift();
    }

    console.log(`🏆 [Victory] Detected successful roast on ${targetUser} (score: ${score.toFixed(2)})`);
  }

  /**
   * Should celebrate this victory?
   */
  shouldCelebrate() {
    // Only celebrate 30% of victories (not every time)
    return Math.random() < 0.3;
  }

  /**
   * Get celebration style based on victory score
   */
  getCelebrationStyle(recentVictory) {
    if (!recentVictory) return 'subtle';

    if (recentVictory.score > 0.9) {
      return 'braggy';
    } else if (recentVictory.score > 0.75) {
      return 'confident';
    } else {
      return 'subtle';
    }
  }

  /**
   * Get context for AI to generate celebration
   */
  getContext() {
    const recentVictory = this.recentVictories[this.recentVictories.length - 1];

    if (!recentVictory) return '';

    // Only provide context if victory was recent (last 30 seconds)
    if (Date.now() - recentVictory.timestamp > 30000) {
      return '';
    }

    const style = this.getCelebrationStyle(recentVictory);

    if (style === 'braggy') {
      return `\n\n🏆 VICTORY MODE: You just completely destroyed ${recentVictory.target} with that last roast. You're feeling extremely proud and want to celebrate your victory. Be braggadocious about how well you just dunked on them. This was a top-tier insult and you know it.`;
    } else if (style === 'confident') {
      return `\n\n🏆 You just landed a solid roast on ${recentVictory.target}. You're feeling good about it. You can subtly acknowledge your victory if contextually appropriate.`;
    } else {
      return `\n\n🏆 You just got a good dunk in on ${recentVictory.target}. You're quietly satisfied but don't make a big deal of it.`;
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalVictories: this.recentVictories.length,
      recentVictories: this.recentVictories.slice(-5),
      averageScore: this.recentVictories.length > 0
        ? this.recentVictories.reduce((sum, v) => sum + v.score, 0) / this.recentVictories.length
        : 0
    };
  }
}

module.exports = VictoryCelebration;
