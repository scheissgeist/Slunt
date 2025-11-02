const fs = require('fs').promises;
const path = require('path');

/**
 * VideoCommentary - Makes Slunt spontaneously comment on videos he's watching
 * 
 * WHEN DOES SLUNT COMMENT ON VIDEOS?
 * - When a new video starts playing (scene change detected)
 * - When he recognizes interesting content in the video title/text
 * - When his mood/obsessions align with the video topic
 * - When he's bored and a new video catches his attention
 * - When video content reminds him of past conversations
 * 
 * This makes Slunt feel like he's actually WATCHING with everyone,
 * not just responding to chat messages.
 */
class VideoCommentary {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.enabled = true;
    
    // Commentary state
    this.lastCommentTime = 0;
    this.lastCommentedVideo = null;
    this.commentCooldown = 60000; // 1 minute minimum between video comments
    
    // Video reaction triggers
    this.interestTriggers = [
      // Topics Slunt cares about
      'anime', 'gaming', 'meme', 'shitpost', 'cringe', 'based',
      'music', 'vtuber', 'speedrun', 'drama', 'react', 'review',
      'broteam', 'jerma', 'vinny', 'joel', 'northernlion',
      'dark souls', 'elden ring', 'bloodborne', 'sekiro',
      'rimworld', 'dwarf fortress', 'factorio', 'terraria',
      'documentary', 'iceberg', 'deep dive', 'analysis',
      'horror', 'scary', 'creepy', 'cursed', 'weird'
    ];
    
    // Scene memory (detect when same video plays again)
    this.videoHistory = [];
    this.maxHistorySize = 50;
    
    console.log('🎬 [VideoCommentary] Initialized');
  }

  /**
   * Check if Slunt should comment on the current video
   */
  async shouldCommentOnVideo(visionData) {
    if (!this.enabled) return false;
    if (!visionData) return false;
    
    // Cooldown check
    const timeSinceLastComment = Date.now() - this.lastCommentTime;
    if (timeSinceLastComment < this.commentCooldown) {
      return false;
    }
    
    // Don't comment on same video twice in a row
    const videoTitle = visionData.videoTitle || visionData.detected;
    if (videoTitle === this.lastCommentedVideo) {
      return false;
    }
    
    // Base chance: 5%
    let chance = 0.05;
    
    // === INTEREST TRIGGERS ===
    // +30% if video title matches interests
    if (videoTitle) {
      const lowerTitle = videoTitle.toLowerCase();
      if (this.interestTriggers.some(trigger => lowerTitle.includes(trigger))) {
        chance += 0.30;
        console.log(`🎯 [VideoCommentary] Interesting video detected: "${videoTitle}"`);
      }
    }
    
    // === SCENE CHANGE ===
    // +20% if scene just changed (new video started)
    if (visionData.scene === 'changed') {
      chance += 0.20;
    }
    
    // === MOOD ALIGNMENT ===
    // +15% if mood matches video vibe
    const mood = this.chatBot.moodTracker?.currentMood;
    if (mood === 'excited' || mood === 'curious' || mood === 'playful') {
      chance += 0.15;
    }
    
    // === OBSESSION ALIGNMENT ===
    // +25% if video topic matches current obsession
    const obsession = this.chatBot.obsessionSystem?.getCurrentObsession();
    if (obsession && videoTitle) {
      const obsessionTopic = obsession.topic.toLowerCase();
      const lowerTitle = videoTitle.toLowerCase();
      if (lowerTitle.includes(obsessionTopic) || obsessionTopic.includes(lowerTitle.split(' ')[0])) {
        chance += 0.25;
        console.log(`🔥 [VideoCommentary] Video matches obsession: ${obsession.topic}`);
      }
    }
    
    // === BOREDOM ===
    // +20% if bored (looking for entertainment)
    if (this.chatBot.mentalState?.boredom > 60) {
      chance += 0.20;
    }
    
    // === VIDEO PLAYING ===
    // +10% if video is actively playing (not paused)
    if (visionData.videoPlaying) {
      chance += 0.10;
    }
    
    // === DETECTED TEXT ===
    // +15% if OCR detected interesting text on screen
    if (visionData.text && visionData.text.length > 0) {
      const detectedText = visionData.text.join(' ').toLowerCase();
      if (this.interestTriggers.some(trigger => detectedText.includes(trigger))) {
        chance += 0.15;
      }
    }
    
    console.log(`🎲 [VideoCommentary] Comment chance: ${(chance * 100).toFixed(1)}%`);
    
    return Math.random() < chance;
  }

  /**
   * Generate video commentary prompt
   */
  generateCommentaryContext(visionData) {
    const videoTitle = visionData.videoTitle || visionData.detected || 'this video';
    const videoTime = visionData.videoTime ? Math.floor(visionData.videoTime) : 0;
    const videoDuration = visionData.videoDuration ? Math.floor(visionData.videoDuration) : 0;
    const progress = videoDuration > 0 ? Math.floor((videoTime / videoDuration) * 100) : 0;
    
    let context = `\n=== 👁️ SLUNT IS WATCHING VIDEO ===\n`;
    context += `Currently playing: "${videoTitle}"\n`;
    
    if (progress > 0) {
      context += `Video progress: ${progress}% (${videoTime}s / ${videoDuration}s)\n`;
    }
    
    if (visionData.scene === 'changed') {
      context += `NEW VIDEO JUST STARTED! Fresh content detected.\n`;
    }
    
    if (visionData.text && visionData.text.length > 0) {
      context += `Text on screen: ${visionData.text.slice(0, 3).join(', ')}\n`;
    }
    
    if (visionData.brightness) {
      if (visionData.brightness < 50) {
        context += `Scene is dark (${visionData.brightness}/255 brightness)\n`;
      } else if (visionData.brightness > 200) {
        context += `Scene is bright (${visionData.brightness}/255 brightness)\n`;
      }
    }
    
    // Add obsession context
    const obsession = this.chatBot.obsessionSystem?.getCurrentObsession();
    if (obsession) {
      const obsessionTopic = obsession.topic.toLowerCase();
      const videoTitleLower = videoTitle.toLowerCase();
      if (videoTitleLower.includes(obsessionTopic) || obsessionTopic.includes(videoTitleLower.split(' ')[0])) {
        context += `\n🔥 THIS IS ABOUT YOUR CURRENT OBSESSION: ${obsession.topic}!\n`;
        context += `Obsession intensity: ${obsession.intensity}/10\n`;
      }
    }
    
    // Add mood context
    const mood = this.chatBot.moodTracker?.currentMood;
    if (mood) {
      context += `Current mood: ${mood}\n`;
    }
    
    context += `\nSpontaneously react to what you're seeing! Be natural, like you're watching with friends.\n`;
    context += `Comment on: the video topic, something you noticed, your opinion, or make a joke.\n`;
    context += `Keep it SHORT (1-2 sentences). You're reacting in real-time, not writing an essay.\n`;
    context += `=== END VIDEO CONTEXT ===\n`;
    
    return context;
  }

  /**
   * Trigger a video comment from Slunt
   */
  async triggerVideoComment(visionData) {
    try {
      // Mark this video as commented
      this.lastCommentTime = Date.now();
      this.lastCommentedVideo = visionData.videoTitle || visionData.detected;
      
      // Add to history
      this.videoHistory.push({
        title: this.lastCommentedVideo,
        timestamp: Date.now(),
        mood: this.chatBot.moodTracker?.currentMood
      });
      
      if (this.videoHistory.length > this.maxHistorySize) {
        this.videoHistory.shift();
      }
      
      // Build commentary context
      const commentaryContext = this.generateCommentaryContext(visionData);
      
      console.log(`🎬 [VideoCommentary] Generating comment about: "${this.lastCommentedVideo}"`);
      
      // Generate response using chatBot's AI (but as a spontaneous comment, not a reply)
      const response = await this.chatBot.generateSpontaneousComment({
        context: commentaryContext,
        type: 'video_reaction',
        platform: 'coolhole'
      });
      
      if (response) {
        console.log(`💬 [VideoCommentary] Slunt says: "${response}"`);
        return response;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [VideoCommentary] Error generating comment:', error.message);
      return null;
    }
  }

  /**
   * Check vision data and possibly trigger commentary
   */
  async checkAndComment(visionData) {
    if (!visionData) return null;
    
    const shouldComment = await this.shouldCommentOnVideo(visionData);
    
    if (shouldComment) {
      return await this.triggerVideoComment(visionData);
    }
    
    return null;
  }

  /**
   * Get video history
   */
  getVideoHistory() {
    return this.videoHistory.slice(-10);
  }

  /**
   * Enable/disable video commentary
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`🎬 [VideoCommentary] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Reset cooldown (for testing)
   */
  resetCooldown() {
    this.lastCommentTime = 0;
    console.log('🔄 [VideoCommentary] Cooldown reset');
  }
}

module.exports = VideoCommentary;
