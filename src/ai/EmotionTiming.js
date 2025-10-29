/**
 * Emotion-Driven Response Timing
 * Response speed and typing delays vary based on emotional state
 */

class EmotionTiming {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Base timing configuration (milliseconds)
    this.baseTimings = {
      excited: {
        delay: 200,          // Very fast
        variance: 100,
        typingSpeed: 30,     // chars per second
        burstResponses: true
      },
      happy: {
        delay: 500,
        variance: 200,
        typingSpeed: 25
      },
      neutral: {
        delay: 1000,
        variance: 300,
        typingSpeed: 20
      },
      annoyed: {
        delay: 800,
        variance: 400,
        typingSpeed: 22,
        shortResponses: true
      },
      angry: {
        delay: 300,          // Fast, reactive
        variance: 150,
        typingSpeed: 28,
        aggressive: true
      },
      sad: {
        delay: 2000,         // Slow
        variance: 500,
        typingSpeed: 12,     // Slower typing
        longerPauses: true
      },
      depressed: {
        delay: 3000,         // Very slow
        variance: 1000,
        typingSpeed: 8,
        minimal: true
      },
      anxious: {
        delay: 600,
        variance: 800,       // High variance = hesitant
        typingSpeed: 15,
        hesitant: true,
        deletions: true      // Simulate rewriting
      },
      confused: {
        delay: 1500,
        variance: 600,
        typingSpeed: 16,
        pauseMidSentence: true
      },
      drunk: {
        delay: 400,
        variance: 1200,      // Very inconsistent
        typingSpeed: 18,
        typos: true,
        randomPauses: true
      }
    };
  }

  /**
   * Calculate response timing based on emotion
   */
  calculateTiming(emotion, responseLength) {
    const timing = this.baseTimings[emotion] || this.baseTimings.neutral;
    
    // Initial delay before typing starts
    const initialDelay = timing.delay + (Math.random() * timing.variance);
    
    // Calculate typing duration
    const typingDuration = (responseLength / timing.typingSpeed) * 1000;
    
    // Add random pauses for certain emotions
    let pauses = 0;
    if (timing.longerPauses) {
      pauses = Math.floor(Math.random() * 3) * 500; // 0-2 pauses of 500ms
    }
    if (timing.randomPauses) {
      pauses = Math.floor(Math.random() * 5) * 300; // More chaotic
    }
    
    // Total time
    const totalTime = initialDelay + typingDuration + pauses;
    
    return {
      initialDelay: Math.floor(initialDelay),
      typingDuration: Math.floor(typingDuration),
      pauses: Math.floor(pauses),
      totalTime: Math.floor(totalTime),
      shouldShowTyping: totalTime > 1000, // Only show typing indicator if > 1s
      config: timing
    };
  }

  /**
   * Get typing indicator duration
   */
  getTypingIndicatorTime(emotion, responseLength) {
    const timing = this.calculateTiming(emotion, responseLength);
    return timing.shouldShowTyping ? timing.totalTime : 0;
  }

  /**
   * Simulate typing pattern (for logs/visualization)
   */
  async simulateTyping(text, emotion, callback) {
    const timing = this.calculateTiming(emotion, text.length);
    
    // Initial delay
    await this.sleep(timing.initialDelay);
    
    // If callback provided, start typing
    if (callback) callback({ status: 'typing', progress: 0 });
    
    // Simulate character-by-character typing
    const charsPerUpdate = Math.ceil(text.length / 10); // 10 updates
    for (let i = 0; i < text.length; i += charsPerUpdate) {
      await this.sleep(timing.typingDuration / 10);
      
      if (callback) {
        callback({ 
          status: 'typing', 
          progress: Math.min(100, Math.floor((i / text.length) * 100)),
          currentText: text.substring(0, i)
        });
      }
      
      // Random pause for anxious/drunk
      if (timing.config.hesitant && Math.random() < 0.3) {
        await this.sleep(500);
      }
      if (timing.config.randomPauses && Math.random() < 0.2) {
        await this.sleep(300);
      }
    }
    
    if (callback) callback({ status: 'complete', progress: 100 });
  }

  /**
   * Get delay before responding
   */
  getResponseDelay(emotion = 'neutral') {
    const timing = this.baseTimings[emotion] || this.baseTimings.neutral;
    const delay = timing.delay + (Math.random() * timing.variance);
    return Math.floor(delay);
  }

  /**
   * Should burst respond? (multiple quick messages)
   */
  shouldBurst(emotion) {
    if (emotion === 'excited' && Math.random() < 0.3) {
      return true;
    }
    if (emotion === 'angry' && Math.random() < 0.2) {
      return true;
    }
    return false;
  }

  /**
   * Split response into burst messages
   */
  splitIntoBurst(response) {
    const sentences = response.split(/([.!?]+)/);
    const bursts = [];
    let current = '';
    
    for (let i = 0; i < sentences.length; i += 2) {
      current = sentences[i] + (sentences[i + 1] || '');
      if (current.trim()) {
        bursts.push(current.trim());
      }
    }
    
    // Ensure at least 2 bursts
    if (bursts.length < 2) {
      const mid = Math.floor(response.length / 2);
      return [
        response.substring(0, mid),
        response.substring(mid)
      ];
    }
    
    return bursts.slice(0, 3); // Max 3 burst messages
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get context for AI (affects response style)
   */
  getContext(emotion) {
    const timing = this.baseTimings[emotion];
    if (!timing) return '';

    const traits = [];
    if (timing.shortResponses) traits.push('Keep responses shorter');
    if (timing.aggressive) traits.push('More direct and intense');
    if (timing.minimal) traits.push('Very brief, low effort');
    if (timing.hesitant) traits.push('Uncertain, second-guessing');
    if (timing.typos) traits.push('Slight typos OK');
    
    if (traits.length === 0) return '';

    return `\n⏱️ EMOTION TIMING: ${emotion}
Response characteristics:
${traits.map(t => '- ' + t).join('\n')}`;
  }

  /**
   * Execute timed response
   */
  async executeTimedResponse(response, emotion, sendFunction) {
    const shouldBurst = this.shouldBurst(emotion);
    
    if (shouldBurst) {
      // Burst mode: send multiple quick messages
      const bursts = this.splitIntoBurst(response);
      
      for (const burst of bursts) {
        const delay = this.getResponseDelay(emotion);
        await this.sleep(delay);
        await sendFunction(burst);
      }
    } else {
      // Normal mode: single message with delay
      const timing = this.calculateTiming(emotion, response.length);
      
      if (timing.shouldShowTyping) {
        // Simulate typing indicator (if supported by platform)
        await this.sleep(timing.totalTime);
      } else {
        await this.sleep(timing.initialDelay);
      }
      
      await sendFunction(response);
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      emotions: Object.keys(this.baseTimings),
      timingProfiles: Object.entries(this.baseTimings).map(([emotion, config]) => ({
        emotion,
        avgDelay: config.delay + (config.variance / 2),
        typingSpeed: config.typingSpeed + ' cps'
      }))
    };
  }

  /**
   * Get timing info for emotion
   */
  getTimingInfo(emotion) {
    return this.baseTimings[emotion] || this.baseTimings.neutral;
  }
}

module.exports = EmotionTiming;
