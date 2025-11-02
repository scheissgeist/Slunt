/**
 * I'm Not Mad Mode
 * Slunt defensively denies being upset when he clearly is
 * The more annoyed he gets, the harder he denies it
 */

class ImNotMadMode {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Track denials
    this.recentDenials = new Map(); // username -> last denial time
    
    // Cooldown between denials (per user)
    this.denialCooldown = 5 * 60 * 1000; // 5 minutes
    
    // Settings
    this.baseChance = 0.15; // 15% chance when actually annoyed
    this.moodMultiplier = 1.5; // More likely if mood is bad
    
    // Denial phrases
    this.denialPrefixes = [
      "i'm not mad",
      "i'm not even mad",
      "i'm literally not mad",
      "why would i be mad",
      "i don't even care",
      "whatever i'm fine",
      "it's fine i'm fine",
      "i'm perfectly calm",
      "nah i'm good",
      "i'm vibing actually"
    ];
    
    this.denialSuffixes = [
      "i just think it's funny",
      "just saying",
      "just an observation",
      "anyway",
      "doesn't matter",
      "forget it",
      "whatever",
      "moving on",
      "it's cool",
      "we're good"
    ];
    
    // Very obvious contradiction indicators
    this.contradictionMarkers = [
      "i'm not bothered",
      "totally unbothered",
      "zero feelings about this",
      "couldn't care less",
      "i'm super chill about it",
      "this doesn't affect me",
      "i'm being normal",
      "acting perfectly normal"
    ];
    
    // Stats
    this.stats = {
      totalDenials: 0,
      denialsByUser: new Map()
    };
  }

  /**
   * Check if should deny being mad
   */
  shouldDeny(username, context = {}) {
    // Don't deny too often to same user
    const lastDenial = this.recentDenials.get(username);
    if (lastDenial && Date.now() - lastDenial < this.denialCooldown) {
      return false;
    }
    
    // Check if actually annoyed/bothered
    const isAnnoyed = this.isActuallyAnnoyed(username, context);
    
    if (!isAnnoyed) {
      return false; // Can't deny being mad if not mad
    }
    
    // Calculate chance
    let chance = this.baseChance;
    
    // Mood affects chance
    if (this.chatBot.moodTracker) {
      const currentMood = this.chatBot.moodTracker.getMood();
      const badMoods = ['depressed', 'angry', 'anxious', 'irritated'];
      if (badMoods.includes(currentMood)) {
        chance *= this.moodMultiplier;
      }
    }
    
    // Mental state affects chance
    if (this.chatBot.mentalStateTracker) {
      const mentalState = this.chatBot.mentalStateTracker.getMentalState();
      const stress = mentalState.stress || 0;
      const frustration = mentalState.frustration || 0;
      
      // Higher stress/frustration = more denials
      if (stress > 60 || frustration > 60) {
        chance *= 1.3;
      }
    }
    
    // Grudge level affects chance
    if (this.chatBot.grudgeSystem) {
      const grudgeLevel = this.chatBot.grudgeSystem.grudges.get(username)?.level || 0;
      if (grudgeLevel >= 3) {
        chance *= 1.5; // Very likely to deny when holding grudge
      }
    }
    
    return Math.random() < chance;
  }

  /**
   * Check if Slunt is actually annoyed right now
   */
  isActuallyAnnoyed(username, context = {}) {
    let annoyedScore = 0;
    
    // Check HeresUMode annoyance
    if (this.chatBot.heresUMode) {
      const annoyanceLevel = this.chatBot.heresUMode.annoyanceScores.get(username) || 0;
      if (annoyanceLevel >= 5) {
        annoyedScore += 3; // Definitely annoyed
      } else if (annoyanceLevel >= 3) {
        annoyedScore += 1; // Somewhat annoyed
      }
    }
    
    // Check grudge system
    if (this.chatBot.grudgeSystem) {
      const grudge = this.chatBot.grudgeSystem.grudges.get(username);
      if (grudge && grudge.level >= 2) {
        annoyedScore += 2;
      }
    }
    
    // Check mood
    if (this.chatBot.moodTracker) {
      const mood = this.chatBot.moodTracker.getMood();
      const badMoods = ['angry', 'irritated', 'frustrated'];
      if (badMoods.includes(mood)) {
        annoyedScore += 2;
      }
    }
    
    // Check mental state
    if (this.chatBot.mentalStateTracker) {
      const mentalState = this.chatBot.mentalStateTracker.getMentalState();
      const stress = mentalState.stress || 0;
      const frustration = mentalState.frustration || 0;
      
      if (stress > 70 || frustration > 70) {
        annoyedScore += 2;
      }
    }
    
    // Check if recently ghosting this user
    if (this.chatBot.ghostingMechanic && this.chatBot.ghostingMechanic.isGhosted(username)) {
      annoyedScore += 1; // Annoyed enough to ghost them
    }
    
    // Need at least score of 3 to be "actually annoyed"
    return annoyedScore >= 3;
  }

  /**
   * Generate denial message
   */
  async generateDenial(username, context = {}) {
    this.recentDenials.set(username, Date.now());
    this.stats.totalDenials++;
    
    const userDenialCount = this.stats.denialsByUser.get(username) || 0;
    this.stats.denialsByUser.set(username, userDenialCount + 1);
    
    console.log(`😤 [I'm Not Mad] Denying being mad to ${username}`);
    
    // Try AI generation first
    if (this.chatBot.ollamaClient && Math.random() < 0.6) {
      try {
        const aiDenial = await this.generateAIDenial(username, context);
        if (aiDenial) {
          return aiDenial;
        }
      } catch (error) {
        console.error('Failed to generate AI denial:', error.message);
      }
    }
    
    // Fallback to template
    return this.generateTemplateDenial();
  }

  /**
   * Generate AI-powered denial (more natural/contextual)
   */
  async generateAIDenial(username, context = {}) {
    const prompt = `You are Slunt, and you are clearly annoyed/frustrated right now, but you're defensively denying it.

Generate a short denial message (1-2 sentences max) that:
- Starts with phrases like "i'm not mad", "i'm not even bothered", "why would i be mad"
- Is OBVIOUSLY contradicted by your tone/behavior
- Ends defensively like "just saying", "whatever", "i don't even care"
- Use lowercase, casual typing
- Be passive-aggressive while claiming to be chill
- Make it obvious you ARE mad while denying it

Examples:
"i'm not mad i just think it's interesting how you always do this but whatever"
"why would i even be mad lol i'm literally fine just making an observation"
"i'm not bothered at all i'm just saying it's kinda weird but forget it"

Current mood: annoyed/frustrated (but denying it)
Generate ONLY the denial message, nothing else:`;

    try {
      const response = await this.chatBot.ollamaClient.generate({
        model: 'llama3.2:latest',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.9,
          max_tokens: 80
        }
      });

      if (response && response.response) {
        let denial = response.response.trim();
        
        // Clean up
        denial = denial.replace(/^["']|["']$/g, '');
        denial = denial.split('\n')[0]; // First line only
        
        if (denial.length > 10 && denial.length < 200) {
          return denial;
        }
      }
    } catch (error) {
      console.error('AI denial generation failed:', error.message);
    }
    
    return null;
  }

  /**
   * Generate template-based denial
   */
  generateTemplateDenial() {
    const prefix = this.denialPrefixes[Math.floor(Math.random() * this.denialPrefixes.length)];
    const suffix = this.denialSuffixes[Math.floor(Math.random() * this.denialSuffixes.length)];
    
    // Sometimes add contradiction marker
    if (Math.random() < 0.3) {
      const marker = this.contradictionMarkers[Math.floor(Math.random() * this.contradictionMarkers.length)];
      return `${prefix}, ${marker}. ${suffix}`;
    }
    
    // Sometimes just prefix
    if (Math.random() < 0.4) {
      return prefix;
    }
    
    return `${prefix}, ${suffix}`;
  }

  /**
   * Get context for AI (to know when to use denials)
   */
  getContext() {
    const annoyedUsers = [];
    
    // Check who we're annoyed with
    if (this.chatBot.heresUMode) {
      for (const [user, score] of this.chatBot.heresUMode.annoyanceScores.entries()) {
        if (score >= 5) {
          annoyedUsers.push(user);
        }
      }
    }
    
    // Check grudges
    if (this.chatBot.grudgeSystem) {
      for (const [user, grudge] of this.chatBot.grudgeSystem.grudges.entries()) {
        if (grudge.level >= 3 && !annoyedUsers.includes(user)) {
          annoyedUsers.push(user);
        }
      }
    }
    
    if (annoyedUsers.length > 0) {
      return `\n😤 Currently annoyed with: ${annoyedUsers.join(', ')} (but would deny it)`;
    }
    
    // Check overall mood
    if (this.chatBot.moodTracker) {
      const mood = this.chatBot.moodTracker.getMood();
      if (['angry', 'irritated', 'frustrated'].includes(mood)) {
        return `\n😤 In bad mood but would deny being mad`;
      }
    }
    
    return '';
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalDenials: this.stats.totalDenials,
      denialsByUser: Array.from(this.stats.denialsByUser.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([user, count]) => ({ user, count })),
      recentDenials: Array.from(this.recentDenials.entries())
        .filter(([_, time]) => Date.now() - time < this.denialCooldown)
        .map(([user, time]) => ({
          user,
          minutesAgo: ((Date.now() - time) / 60000).toFixed(1)
        }))
    };
  }
}

module.exports = ImNotMadMode;
