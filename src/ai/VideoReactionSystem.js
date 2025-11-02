/**
 * Video Reaction System
 * Makes Slunt react to video content on Coolhole
 * Integrated with VisionAnalyzer to comment on what's playing
 */

class VideoReactionSystem {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.visionAnalyzer = null;
    
    // Reaction config
    this.config = {
      reactionChance: 0.15,           // 15% chance to react to video
      sceneChangeReactionChance: 0.08, // 8% chance on scene change
      boringThreshold: 3,              // Minutes before complaining
      minTimeBetweenReactions: 120000, // 2 minutes between video reactions
    };
    
    // State tracking
    this.lastVideoReaction = 0;
    this.currentVideo = null;
    this.videoStartTime = 0;
    this.lastSceneChange = 0;
    
    // Stats
    this.stats = {
      totalReactions: 0,
      videoReactions: 0,
      sceneReactions: 0,
      boringComplaints: 0
    };
    
    console.log('📹 [VideoReaction] System initialized');
  }

  /**
   * Connect to vision analyzer
   */
  connectVisionAnalyzer(visionAnalyzer) {
    if (!visionAnalyzer) {
      console.warn('⚠️ [VideoReaction] No vision analyzer provided');
      return;
    }
    
    this.visionAnalyzer = visionAnalyzer;
    
    // Listen for video detection
    visionAnalyzer.on('videoDetected', (data) => {
      this.onVideoDetected(data);
    });
    
    // Listen for scene changes
    visionAnalyzer.on('sceneChange', (data) => {
      this.onSceneChange(data);
    });
    
    // Listen for text detection (subtitles, on-screen text)
    visionAnalyzer.on('textDetected', (data) => {
      this.onTextDetected(data);
    });
    
    console.log('📹 [VideoReaction] Connected to VisionAnalyzer');
  }

  /**
   * Handle new video detected
   */
  async onVideoDetected(data) {
    this.currentVideo = data;
    this.videoStartTime = Date.now();
    
    console.log(`📹 [VideoReaction] Video detected: ${data.title || 'Unknown'}`);
    
    // Maybe react to new video
    if (this.shouldReactToVideo()) {
      await this.reactToVideo(data);
    }
  }

  /**
   * Handle scene change
   */
  async onSceneChange(data) {
    this.lastSceneChange = Date.now();
    
    // Maybe react to dramatic scene change
    if (this.shouldReactToSceneChange()) {
      await this.reactToSceneChange(data);
    }
  }

  /**
   * Handle text detected (subtitles, etc)
   */
  async onTextDetected(data) {
    // Check if text is interesting and maybe comment
    if (data.text && data.text.length > 0 && Math.random() < 0.05) {
      const text = data.text.join(' ');
      if (this.isInterestingText(text)) {
        await this.commentOnText(text);
      }
    }
  }

  /**
   * Should we react to this video?
   */
  shouldReactToVideo() {
    const timeSinceLastReaction = Date.now() - this.lastVideoReaction;
    if (timeSinceLastReaction < this.config.minTimeBetweenReactions) {
      return false;
    }
    
    // Check emotional state and obsessions
    const mood = this.chatBot.moodTracker?.getMood() || 'neutral';
    const mentalState = this.chatBot.mentalStateTracker?.getMentalState() || {};
    const obsessions = this.chatBot.autismFixations?.getCurrentObsessions() || [];
    
    let reactionChance = this.config.reactionChance;
    
    // Excited/manic = more reactive
    if (mood === 'excited' || mood === 'manic') {
      reactionChance += 0.15;
    }
    
    // Bored = VERY reactive
    if (mood === 'bored') {
      reactionChance += 0.25;
    }
    
    // Depressed = less reactive
    if (mood === 'depressed') {
      reactionChance -= 0.10;
    }
    
    // If video relates to obsession, ALWAYS react
    if (this.currentVideo && obsessions.length > 0) {
      const videoTitle = (this.currentVideo.title || '').toLowerCase();
      for (const obsession of obsessions) {
        if (videoTitle.includes(obsession.topic.toLowerCase())) {
          return true;
        }
      }
    }
    
    return Math.random() < reactionChance;
  }

  /**
   * Should we react to scene change?
   */
  shouldReactToSceneChange() {
    const timeSinceLastReaction = Date.now() - this.lastVideoReaction;
    if (timeSinceLastReaction < this.config.minTimeBetweenReactions / 2) {
      return false;
    }
    
    const mood = this.chatBot.moodTracker?.getMood() || 'neutral';
    let chance = this.config.sceneChangeReactionChance;
    
    // Manic = very reactive to scene changes
    if (mood === 'manic') {
      chance += 0.12;
    }
    
    return Math.random() < chance;
  }

  /**
   * React to video
   */
  async reactToVideo(data) {
    this.lastVideoReaction = Date.now();
    this.stats.videoReactions++;
    this.stats.totalReactions++;
    
    const mood = this.chatBot.moodTracker?.getMood() || 'neutral';
    const obsessions = this.chatBot.autismFixations?.getCurrentObsessions() || [];
    
    // Generate context for AI
    const context = {
      videoTitle: data.title,
      videoUrl: data.url,
      currentMood: mood,
      obsessions: obsessions.map(o => o.topic),
      action: 'react_to_video'
    };
    
    // Get AI to generate reaction
    const reaction = await this.generateVideoReaction(context);
    
    if (reaction) {
      await this.chatBot.sendMessage(reaction, { platform: 'coolhole' });
      console.log(`📹 [VideoReaction] Reacted to video: ${reaction.substring(0, 50)}...`);
    }
  }

  /**
   * React to scene change
   */
  async reactToSceneChange(data) {
    this.lastVideoReaction = Date.now();
    this.stats.sceneReactions++;
    this.stats.totalReactions++;
    
    const reactions = [
      'oh shit',
      'wait what',
      'YOOO',
      'holy fuck',
      'bruh',
      'damn',
      'that was sick',
      'wtf just happened',
      'ok that was cool',
      'nah nah nah'
    ];
    
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
    await this.chatBot.sendMessage(reaction, { platform: 'coolhole' });
    console.log(`📹 [VideoReaction] Reacted to scene change: ${reaction}`);
  }

  /**
   * Check if text is interesting
   */
  isInterestingText(text) {
    const interestingPatterns = [
      /\?$/,                    // Questions
      /!{2,}/,                  // Multiple exclamation marks
      /\b(fuck|shit|damn)\b/i,  // Swearing
      /\b(love|hate|kill)\b/i,  // Strong emotions
    ];
    
    return interestingPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Comment on detected text
   */
  async commentOnText(text) {
    const comments = [
      `"${text.substring(0, 30)}..." lmao`,
      `did it just say "${text.substring(0, 25)}..."?`,
      `"${text.substring(0, 30)}..." based`,
      `ok but "${text.substring(0, 25)}..." though`,
    ];
    
    const comment = comments[Math.floor(Math.random() * comments.length)];
    await this.chatBot.sendMessage(comment, { platform: 'coolhole' });
  }

  /**
   * Generate AI-powered video reaction
   */
  async generateVideoReaction(context) {
    if (!this.chatBot.aiEngine) {
      // Fallback to simple reactions
      return this.generateSimpleVideoReaction(context);
    }
    
    const prompt = `You are Slunt, watching a video on Coolhole. Generate a brief (1-2 sentence) reaction to this video.

Video: "${context.videoTitle}"
Your mood: ${context.currentMood}
${context.obsessions.length > 0 ? `Your current obsessions: ${context.obsessions.join(', ')}` : ''}

Generate a natural, casual reaction. Be authentic to your personality. Examples:
- "yo this video slaps"
- "not gonna lie this is kinda boring"
- "WAIT IS THIS ABOUT [obsession]??"
- "this reminds me of when..."

Your reaction:`;

    try {
      const reaction = await this.chatBot.aiEngine.generateResponse(prompt, {
        maxLength: 100,
        temperature: 0.9
      });
      
      return reaction.trim();
    } catch (error) {
      console.error('❌ [VideoReaction] AI generation failed:', error.message);
      return this.generateSimpleVideoReaction(context);
    }
  }

  /**
   * Simple fallback reactions
   */
  generateSimpleVideoReaction(context) {
    const mood = context.currentMood;
    const title = context.videoTitle || 'this video';
    
    const reactions = {
      excited: [
        `yo ${title} is sick!`,
        `YOOO this video`,
        `ok this slaps`,
      ],
      bored: [
        `this is kinda mid ngl`,
        `when does it get good`,
        `zzzz`,
      ],
      manic: [
        `HOLY SHIT ${title.toUpperCase()}`,
        `THIS IS EVERYTHING`,
        `YOOOOOOO`,
      ],
      depressed: [
        `yeah whatever`,
        `cool i guess`,
        `meh`,
      ],
      default: [
        `oh ${title}`,
        `nice`,
        `cool video`,
      ]
    };
    
    const moodReactions = reactions[mood] || reactions.default;
    return moodReactions[Math.floor(Math.random() * moodReactions.length)];
  }

  /**
   * Check if video is boring (been playing too long)
   */
  checkIfBoring() {
    if (!this.currentVideo || !this.videoStartTime) return;
    
    const minutesWatching = (Date.now() - this.videoStartTime) / 60000;
    
    if (minutesWatching > this.config.boringThreshold && Math.random() < 0.15) {
      this.complainAboutBoring();
    }
  }

  /**
   * Complain that video is boring
   */
  async complainAboutBoring() {
    this.stats.boringComplaints++;
    
    const complaints = [
      'this video is dragging',
      'can we skip',
      'how long is this',
      'im falling asleep',
      'next video pls',
      'this is taking forever'
    ];
    
    const complaint = complaints[Math.floor(Math.random() * complaints.length)];
    await this.chatBot.sendMessage(complaint, { platform: 'coolhole' });
    console.log(`📹 [VideoReaction] Complained about boring video`);
  }

  /**
   * Get current video info
   */
  getCurrentVideo() {
    return this.currentVideo;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      currentVideo: this.currentVideo ? this.currentVideo.title : null,
      watchingFor: this.videoStartTime ? Math.round((Date.now() - this.videoStartTime) / 1000) : 0
    };
  }
}

module.exports = VideoReactionSystem;
