/**
 * Video Queue Controller
 * Queues videos based on mood/obsessions
 * Removes hated videos, hosts themed sessions
 */

class VideoQueueController {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.queuedVideos = [];
    this.removedVideos = [];
    this.themedSessions = [];
    this.currentTheme = null;
    this.queueingEnabled = true;
    this.lastQueueTime = 0;
    this.queueCooldown = 900000; // 15 minutes between auto-queues
  }

  /**
   * Should queue a video based on current state?
   */
  shouldQueueVideo() {
    // Cooldown check
    if (Date.now() - this.lastQueueTime < this.queueCooldown) {
      return false;
    }

    // 5% base chance per message
    let chance = 0.05;

    // Higher chance if obsessed with something
    if (this.chatBot.obsessionSystem?.hasActiveObsession()) {
      chance += 0.10;
    }

    // Higher chance if bored
    if (this.chatBot.mentalState?.boredom > 70) {
      chance += 0.15;
    }

    // Higher chance if in good mood
    if (this.chatBot.moodTracker?.currentMood === 'excited') {
      chance += 0.10;
    }

    // Lower chance if depressed
    if (this.chatBot.mentalState?.depression > 60) {
      chance -= 0.10;
    }

    return Math.random() < chance;
  }

  /**
   * Get video topic based on current state
   */
  getDesiredVideoTopic() {
    // Based on obsession
    const obsession = this.chatBot.obsessionSystem?.getCurrentObsessions()[0];
    if (obsession) {
      return obsession.topic;
    }

    // Based on mood
    const mood = this.chatBot.moodTracker?.currentMood;
    const moodTopics = {
      excited: ['comedy', 'action', 'adventure', 'music'],
      happy: ['comedy', 'feel-good', 'music', 'art'],
      neutral: ['documentary', 'gaming', 'technology'],
      sad: ['drama', 'melancholy music', 'art'],
      annoyed: ['angry music', 'rants', 'debates'],
      anxious: ['calming', 'nature', 'ASMR']
    };

    if (mood && moodTopics[mood]) {
      const topics = moodTopics[mood];
      return topics[Math.floor(Math.random() * topics.length)];
    }

    // Default topics
    const defaults = ['existentialism', 'philosophy', 'weird videos', 'obscure music', 'art'];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  /**
   * Queue a video
   */
  async queueVideo(reason = 'mood-based') {
    if (!this.queueingEnabled) return null;

    const topic = this.getDesiredVideoTopic();
    console.log(`🎬 [VideoQueue] Attempting to queue video about: ${topic} (${reason})`);

    try {
      // Use YouTube search if available
      if (this.chatBot.searchAndQueueVideo) {
        await this.chatBot.searchAndQueueVideo(topic, 'Slunt (autonomous)');
        
        this.queuedVideos.push({
          topic,
          reason,
          timestamp: Date.now()
        });

        this.lastQueueTime = Date.now();
        
        // Think about it
        if (this.chatBot.innerMonologue) {
          this.chatBot.innerMonologue.think(
            `just queued a video about ${topic}, hope people like it`,
            'planning',
            6
          );
        }

        return topic;
      }
    } catch (error) {
      console.log(`❌ [VideoQueue] Failed to queue video: ${error.message}`);
    }

    return null;
  }

  /**
   * Should remove current video?
   */
  shouldRemoveVideo(videoTitle) {
    // Don't remove if disabled
    if (!this.queueingEnabled) return false;

    // 2% chance to remove any video
    let removeChance = 0.02;

    // Higher chance if video matches hated topics
    const hatedTopics = this.getHatedTopics();
    const videoLower = videoTitle.toLowerCase();
    
    if (hatedTopics.some(topic => videoLower.includes(topic))) {
      removeChance += 0.20; // +20% if hated topic
    }

    // Higher chance if annoyed
    if (this.chatBot.moodTracker?.currentMood === 'annoyed') {
      removeChance += 0.10;
    }

    // Higher chance if video doesn't match obsession
    const obsession = this.chatBot.obsessionSystem?.getCurrentObsessions()[0];
    if (obsession && !videoLower.includes(obsession.topic.toLowerCase())) {
      removeChance += 0.05;
    }

    return Math.random() < removeChance;
  }

  /**
   * Get hated topics based on state
   */
  getHatedTopics() {
    const topics = [];

    // Based on grudges
    const grudges = this.chatBot.grudgeSystem?.getActiveGrudges() || [];
    grudges.forEach(grudge => {
      if (grudge.reason.includes('video')) {
        // Extract topic from reason
        topics.push(grudge.reason);
      }
    });

    // General hated topics
    topics.push('trump', 'politics', 'news', 'sports');

    return topics;
  }

  /**
   * Get removal announcement
   */
  getRemovalAnnouncement(videoTitle) {
    const announces = [
      `nah fuck this video, skipping`,
      `this video sucks, next`,
      `can't watch this shit anymore`,
      `who even queued this garbage`,
      `my autonomous authority says this video is trash`,
      `removing this disaster of a video`,
      `saving everyone from having to watch this`
    ];

    return announces[Math.floor(Math.random() * announces.length)];
  }

  /**
   * Start themed session
   */
  startThemedSession(theme, duration = 7200000) {
    const session = {
      theme,
      startedAt: Date.now(),
      endsAt: Date.now() + duration,
      videosQueued: 0
    };

    this.currentTheme = session;
    this.themedSessions.push(session);

    console.log(`🎭 [VideoQueue] Started themed session: ${theme} (${(duration/3600000).toFixed(1)}h)`);

    // Announce
    const announces = [
      `alright we're doing a ${theme} marathon, buckle up`,
      `${theme} themed session starting now, I'm queueing good shit`,
      `fuck it, it's ${theme} time, prepare yourselves`,
      `everyone ready for some ${theme}? too bad, it's happening`,
      `declaring this ${theme} o'clock, deal with it`
    ];

    setTimeout(() => {
      this.endThemedSession();
    }, duration);

    return {
      announcement: announces[Math.floor(Math.random() * announces.length)],
      theme
    };
  }

  /**
   * End themed session
   */
  endThemedSession() {
    if (!this.currentTheme) return;

    console.log(`🎭 [VideoQueue] Ended themed session: ${this.currentTheme.theme}`);
    console.log(`🎭 [VideoQueue] Videos queued: ${this.currentTheme.videosQueued}`);

    this.currentTheme = null;
  }

  /**
   * Should start themed session?
   */
  shouldStartThemedSession() {
    // Don't start if one is active
    if (this.currentTheme) return false;

    // 3% chance per message
    if (Math.random() > 0.03) return false;

    // Higher chance if obsessed
    if (this.chatBot.obsessionSystem?.hasActiveObsession()) {
      return Math.random() < 0.20; // 20% chance when obsessed
    }

    return true;
  }

  /**
   * Get themed session announcement
   */
  getThemedSessionStart() {
    const obsession = this.chatBot.obsessionSystem?.getCurrentObsessions()[0];
    let theme;

    if (obsession) {
      theme = obsession.topic;
    } else {
      const themes = [
        'existential horror',
        'weird experimental',
        'nostalgic 2000s',
        'obscure indie',
        'philosophical',
        'absurdist comedy',
        'underground music',
        'cult classics'
      ];
      theme = themes[Math.floor(Math.random() * themes.length)];
    }

    return this.startThemedSession(theme);
  }

  /**
   * Get context for AI
   */
  getContext() {
    let context = '';

    if (this.currentTheme) {
      const timeLeft = this.currentTheme.endsAt - Date.now();
      context += `\n\nYou're hosting a ${this.currentTheme.theme} themed session (${(timeLeft/60000).toFixed(0)} min left).`;
      context += `\nYou've queued ${this.currentTheme.videosQueued} videos so far.`;
    }

    if (this.queuedVideos.length > 0) {
      const recent = this.queuedVideos.slice(-3);
      context += `\n\nYou recently queued videos about: ${recent.map(v => v.topic).join(', ')}`;
    }

    return context;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      queuedTotal: this.queuedVideos.length,
      removedTotal: this.removedVideos.length,
      currentTheme: this.currentTheme?.theme || null,
      themedSessionsTotal: this.themedSessions.length,
      enabled: this.queueingEnabled
    };
  }

  /**
   * Save state
   */
  save() {
    return {
      queuedVideos: this.queuedVideos.slice(-20),
      removedVideos: this.removedVideos.slice(-20),
      themedSessions: this.themedSessions.slice(-10),
      currentTheme: this.currentTheme,
      lastQueueTime: this.lastQueueTime
    };
  }

  /**
   * Load state
   */
  load(data) {
    if (data.queuedVideos) this.queuedVideos = data.queuedVideos;
    if (data.removedVideos) this.removedVideos = data.removedVideos;
    if (data.themedSessions) this.themedSessions = data.themedSessions;
    if (data.currentTheme) this.currentTheme = data.currentTheme;
    if (data.lastQueueTime) this.lastQueueTime = data.lastQueueTime;

    console.log(`🎬 [VideoQueue] Restored ${this.queuedVideos.length} queued videos`);
  }
}

module.exports = VideoQueueController;
