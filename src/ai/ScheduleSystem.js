/**
 * ScheduleSystem - RimWorld-inspired schedule system
 * Tracks when Slunt "should" be doing certain activities
 * Creates conflict when chat demands attention during "sleep time"
 */

class ScheduleSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Schedule blocks (24-hour format)
    this.schedule = {
      sleep: {
        hours: [1, 2, 3, 4, 5, 6],
        priority: 'rest',
        description: 'Should be sleeping',
        needFulfillment: { rest: 0.3 }
      },
      morning: {
        hours: [7, 8, 9],
        priority: 'social',
        description: 'Morning grump time',
        needFulfillment: { social: 0.05 }
      },
      work: {
        hours: [10, 11, 12, 13, 14, 15, 16],
        priority: 'purpose',
        description: 'Productive hours',
        needFulfillment: { purpose: 0.08, stimulation: 0.05 }
      },
      recreation: {
        hours: [17, 18],
        priority: 'stimulation',
        description: 'Chill and watch videos',
        needFulfillment: { stimulation: 0.15, rest: 0.1 }
      },
      prime_time: {
        hours: [19, 20, 21, 22, 23],
        priority: 'social',
        description: 'Peak activity hours',
        needFulfillment: { social: 0.15, stimulation: 0.1 }
      },
      late_night: {
        hours: [0],
        priority: 'rest',
        description: 'Winding down',
        needFulfillment: { rest: 0.2 }
      }
    };

    // Track schedule violations
    this.violations = [];
    this.lastViolationComplaint = 0;

    // Check schedule every 5 minutes
    this.startScheduleCheck();

    console.log('📅 [Schedule] Schedule system initialized');
  }

  /**
   * Start periodic schedule checking
   */
  startScheduleCheck() {
    setInterval(() => {
      this.checkScheduleConflict();
    }, 300000); // Every 5 minutes
  }

  /**
   * Get current schedule block
   */
  getCurrentBlock() {
    const hour = new Date().getHours();
    
    for (const [name, block] of Object.entries(this.schedule)) {
      if (block.hours.includes(hour)) {
        return { name, ...block };
      }
    }

    return null;
  }

  /**
   * Check if there's a schedule conflict
   */
  checkScheduleConflict() {
    const block = this.getCurrentBlock();
    if (!block) return false;

    // Check if chat is active during sleep time
    if (block.priority === 'rest' && this.isChatActive()) {
      this.logViolation('sleep_interrupted', 'Chat is active during sleep hours');
      return true;
    }

    // Check if Slunt is being demanded during wrong priority time
    const needs = this.chatBot.needsSystem?.needs;
    if (needs) {
      // If it's "work time" but social need is very high (people demanding attention)
      if (block.priority === 'purpose' && needs.social.value < 0.3) {
        this.logViolation('work_interrupted', 'Social demands during work hours');
        return true;
      }
    }

    return false;
  }

  /**
   * Check if chat is currently active
   */
  isChatActive() {
    // Check recent message activity
    const recentMessages = this.chatBot.chatHistory?.slice(-10) || [];
    const recentTime = 300000; // 5 minutes
    const now = Date.now();
    
    const activeMessages = recentMessages.filter(msg => 
      now - msg.timestamp < recentTime
    );

    return activeMessages.length >= 3; // 3+ messages in 5 min = active
  }

  /**
   * Log a schedule violation
   */
  logViolation(type, reason) {
    this.violations.push({
      type,
      reason,
      timestamp: Date.now(),
      hour: new Date().getHours()
    });

    // Keep last 50 violations
    if (this.violations.length > 50) {
      this.violations.shift();
    }

    // Maybe complain about it (not every time)
    const timeSinceLastComplaint = Date.now() - this.lastViolationComplaint;
    if (timeSinceLastComplaint > 600000 && Math.random() < 0.3) { // 10min cooldown, 30% chance
      this.complainAboutViolation(type);
      this.lastViolationComplaint = Date.now();
    }
  }

  /**
   * Complain about schedule violation
   */
  complainAboutViolation(type) {
    const complaints = {
      sleep_interrupted: [
        "bro it's literally 3am why are we still doing this",
        "shouldn't we all be asleep right now",
        "i should be sleeping but here we are",
        "you guys never sleep or what"
      ],
      work_interrupted: [
        "don't you have work or something",
        "shouldn't you be working instead of chatting",
        "procrastination hours",
        "we're all just avoiding responsibilities huh"
      ]
    };

    const messages = complaints[type];
    if (messages && this.chatBot.sendMessage) {
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      // Send after a delay
      setTimeout(() => {
        this.chatBot.sendMessage(message);
      }, Math.random() * 3000);
    }
  }

  /**
   * Get schedule context for AI
   */
  getContext() {
    const block = this.getCurrentBlock();
    if (!block) return '';

    let context = `\n📅 SCHEDULE: ${block.name} (${block.description})\n`;
    context += `- Priority: ${block.priority}\n`;

    // Check for conflicts
    const violation = this.violations[this.violations.length - 1];
    if (violation && Date.now() - violation.timestamp < 600000) { // Last 10 min
      context += `⚠️ SCHEDULE CONFLICT: ${violation.reason}\n`;
      
      if (violation.type === 'sleep_interrupted') {
        context += `You're tired and annoyed that people won't let you rest. Complain about it being late.\n`;
      }
      
      if (violation.type === 'work_interrupted') {
        context += `You should be doing something productive but chat keeps distracting you. Feel guilty about procrastinating.\n`;
      }
    }

    // Mention if current block differs from need priority
    const needs = this.chatBot.needsSystem?.needs;
    if (needs) {
      const highestNeed = Object.entries(needs)
        .sort(([,a], [,b]) => a.value - b.value)[0];
      
      if (highestNeed) {
        const [needType, needData] = highestNeed;
        const needPriority = this.getNeedToPriorityMapping()[needType];
        
        if (needPriority && needPriority !== block.priority && needData.value < 0.3) {
          context += `⚠️ NEED CONFLICT: You need ${needType} but schedule says ${block.priority}\n`;
        }
      }
    }

    return context;
  }

  /**
   * Map needs to schedule priorities
   */
  getNeedToPriorityMapping() {
    return {
      social: 'social',
      stimulation: 'stimulation',
      rest: 'rest',
      purpose: 'purpose',
      validation: 'social'
    };
  }

  /**
   * Fulfill needs based on current schedule block
   */
  fulfillScheduledNeeds() {
    const block = this.getCurrentBlock();
    if (!block || !block.needFulfillment) return;

    const needs = this.chatBot.needsSystem;
    if (!needs) return;

    // Fulfill needs according to schedule
    Object.entries(block.needFulfillment).forEach(([needType, amount]) => {
      if (needs.needs[needType]) {
        const methodMap = {
          social: 'trackSocialInteraction',
          stimulation: 'trackStimulation',
          rest: 'trackRest',
          purpose: 'trackPurpose',
          validation: 'trackValidation'
        };

        const method = methodMap[needType];
        if (method && typeof needs[method] === 'function') {
          // Only fulfill if actually following schedule (not violated)
          if (this.violations.length === 0 || Date.now() - this.violations[this.violations.length - 1].timestamp > 300000) {
            needs.needs[needType].value = Math.min(1, needs.needs[needType].value + amount);
          }
        }
      }
    });
  }

  /**
   * Get stats for dashboard
   */
  getStats() {
    const block = this.getCurrentBlock();
    const recentViolations = this.violations.filter(v => 
      Date.now() - v.timestamp < 3600000 // Last hour
    );

    return {
      currentBlock: block ? block.name : 'none',
      priority: block ? block.priority : null,
      description: block ? block.description : null,
      violations: this.violations.length,
      recentViolations: recentViolations.length,
      violationTypes: this.getViolationCounts(),
      nextBlock: this.getNextBlock()
    };
  }

  /**
   * Get next schedule block
   */
  getNextBlock() {
    const currentHour = new Date().getHours();
    let nextHour = (currentHour + 1) % 24;

    for (const [name, block] of Object.entries(this.schedule)) {
      if (block.hours.includes(nextHour)) {
        return { name, hour: nextHour };
      }
    }

    return null;
  }

  /**
   * Get violation counts by type
   */
  getViolationCounts() {
    const counts = {};
    this.violations.forEach(v => {
      counts[v.type] = (counts[v.type] || 0) + 1;
    });
    return counts;
  }
}

module.exports = ScheduleSystem;
