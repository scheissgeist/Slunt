const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

/**
 * VisionAnalyzer - Captures and analyzes visual content from Coolhole
 * 
 * WHAT ARE SCREENSHOTS FOR?
 * - OCR (Optical Character Recognition): Reads text from the screen to understand chat, video titles, UI
 * - Scene Detection: Detects when videos change or new content appears
 * - Color Analysis: Analyzes video brightness/colors to understand content mood
 * - Content Understanding: Helps Slunt "see" what's happening visually, not just read chat
 * - Video Context: Extracts video titles, timestamps, user activity for better responses
 * 
 * Screenshots are automatically cleaned up after 24 hours to save disk space.
 */
class VisionAnalyzer extends EventEmitter {
  constructor(page) {
    super();
    this.page = page;
    
    // Vision capabilities
    this.capabilities = {
      ocr: true,
      sceneDetection: true,
      colorAnalysis: true,
      textRecognition: true
    };
    
    // Visual memory
    this.visualMemory = {
      screenshots: [],
      detectedText: [],
      videoTitles: [],
      sceneChanges: [],
      colors: [],
      userActivity: []
    };
    
    // Analysis state
    this.isAnalyzing = false;
    this.lastScreenshot = null;
    this.lastSceneHash = null;
    this.screenshotInterval = null;
    this.analysisInterval = null;
    
    // Insights
    this.insights = {
      currentVideo: null,
      videoHistory: [],
      detectedGenres: new Set(),
      averageBrightness: 0,
      dominantColors: [],
      textPatterns: [],
      sceneChangeRate: 0
    };
    
    // ENHANCED: Visual Learning System
    this.visualLearning = {
      videoReactions: new Map(), // videoId -> {positive, negative, neutral, laughs}
      userPreferences: new Map(), // username -> {likedGenres, dislikedGenres, favoriteColors}
      successfulMoments: [],      // Moments that made chat laugh/engage
      visualJokes: [],             // Screenshots that had funny reactions
      contentPatterns: new Map()   // pattern -> engagement score
    };
    
    // Storage
    this.screenshotsDir = path.resolve(process.cwd(), 'screenshots');
    this.learningFile = path.join(process.cwd(), 'data', 'visual_learning.json');
    this.ensureDirectories();
    this.loadVisualLearning();
  }

  /**
   * Ensure screenshot directories exist
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.screenshotsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error.message);
    }
  }

  /**
   * Clean up old screenshots (older than 1 day)
   */
  async cleanupOldScreenshots() {
    try {
      const files = await fs.readdir(this.screenshotsDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour instead of 1 day
      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('screenshot_') && file.endsWith('.png')) {
          const filepath = path.join(this.screenshotsDir, file);
          const stats = await fs.stat(filepath);
          
          if (stats.mtimeMs < oneHourAgo) {
            await fs.unlink(filepath);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`🗑️ [Vision] Cleaned up ${deletedCount} old screenshots`);
      }
    } catch (error) {
      console.error('⚠️ [Vision] Error cleaning screenshots:', error.message);
    }
  }

  /**
   * Start visual analysis
   */
  async startAnalysis(options = {}) {
    if (this.isAnalyzing) {
      console.log('⚠️ [Vision] Analysis already running');
      return;
    }

    const {
      screenshotInterval = 10000, // 10 seconds
      analysisInterval = 30000,   // 30 seconds
      detectScenes = true,
      readText = true,
      analyzeColors = true
    } = options;

    console.log('👁️ [Vision] Starting visual analysis...');
    this.isAnalyzing = true;

    // Clean up old screenshots on startup
    await this.cleanupOldScreenshots();
    
    // Schedule daily cleanup
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupOldScreenshots();
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    // Periodic screenshots
    this.screenshotInterval = setInterval(async () => {
      try {
        await this.captureAndAnalyze({ detectScenes, readText, analyzeColors });
      } catch (error) {
        console.error('❌ [Vision] Screenshot error:', error.message);
      }
    }, screenshotInterval);

    // Periodic full analysis
    this.analysisInterval = setInterval(async () => {
      try {
        await this.performFullAnalysis();
      } catch (error) {
        console.error('❌ [Vision] Analysis error:', error.message);
      }
    }, analysisInterval);

    // Initial capture
    await this.captureAndAnalyze({ detectScenes, readText, analyzeColors });

    this.emit('analysisStarted', {
      timestamp: Date.now(),
      options
    });

    console.log('✅ [Vision] Visual analysis started');
  }

  /**
   * Capture screenshot and perform analysis
   */
  async captureAndAnalyze(options = {}) {
    try {
      const timestamp = Date.now();
      const filename = `screenshot_${timestamp}.png`;
      const filepath = path.join(this.screenshotsDir, filename);

      // Capture screenshot
      const screenshot = await this.page.screenshot({
        path: filepath,
        type: 'png',
        fullPage: false
      });

      this.lastScreenshot = {
        filename,
        filepath,
        timestamp,
        buffer: screenshot
      };

      console.log(`📸 [Vision] Screenshot captured: ${filename}`);

      // Analyze the screenshot
      const analysis = await this.analyzeScreenshot(screenshot, options);

      // Store in memory
      this.visualMemory.screenshots.push({
        filename,
        timestamp,
        analysis
      });

      // Keep only last 50 screenshots
      if (this.visualMemory.screenshots.length > 50) {
        const removed = this.visualMemory.screenshots.shift();
        try {
          await fs.unlink(path.join(this.screenshotsDir, removed.filename));
          console.log(`🗑️ [Vision] Deleted old screenshot: ${removed.filename}`);
        } catch (e) {
          // Ignore if file doesn't exist
        }
      }
      
      // Also clean up screenshots older than 1 hour
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      for (const screenshot of this.visualMemory.screenshots) {
        if (screenshot.timestamp < oneHourAgo) {
          try {
            await fs.unlink(path.join(this.screenshotsDir, screenshot.filename));
            console.log(`🗑️ [Vision] Deleted hour-old screenshot: ${screenshot.filename}`);
          } catch (e) {
            // Ignore if already deleted
          }
        }
      }
      
      // Remove old entries from memory
      this.visualMemory.screenshots = this.visualMemory.screenshots.filter(
        s => s.timestamp >= oneHourAgo
      );

      // Emit analysis event
      this.emit('screenshotAnalyzed', {
        timestamp,
        filename,
        analysis
      });

      return analysis;
    } catch (error) {
      console.error('❌ [Vision] Capture error:', error.message);
      return null;
    }
  }

  /**
   * Analyze a screenshot buffer
   */
  async analyzeScreenshot(buffer, options = {}) {
    const analysis = {
      timestamp: Date.now(),
      detectedText: [],
      colors: [],
      brightness: 0,
      sceneChanged: false,
      videoPlayer: null
    };

    try {
      // Use sharp for image processing
      const image = sharp(buffer);
      const metadata = await image.metadata();
      const stats = await image.stats();

      // Calculate average brightness
      if (stats.channels) {
        const avgBrightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length;
        analysis.brightness = Math.round(avgBrightness);
        this.insights.averageBrightness = avgBrightness;
      }

      // Extract dominant colors
      if (options.analyzeColors) {
        const { dominant } = stats;
        if (dominant) {
          analysis.colors = [dominant];
          this.insights.dominantColors = [dominant];
        }
      }

      // Detect scene change (compare with last screenshot)
      if (options.detectScenes && this.lastScreenshot) {
        const sceneChanged = await this.detectSceneChange(buffer, this.lastScreenshot.buffer);
        analysis.sceneChanged = sceneChanged;
        
        if (sceneChanged) {
          console.log('🎬 [Vision] Scene change detected!');
          this.visualMemory.sceneChanges.push(Date.now());
          this.emit('sceneChange', { timestamp: Date.now() });
        }
      }

      // OCR text recognition
      if (options.readText) {
        const text = await this.performOCR(buffer);
        if (text && text.length > 0) {
          analysis.detectedText = text;
          this.visualMemory.detectedText.push({
            timestamp: Date.now(),
            text
          });
          
          console.log(`📝 [Vision] Detected text: ${text.join(', ')}`);
          this.emit('textDetected', { timestamp: Date.now(), text });
        }
      }

      // Try to extract video player information
      analysis.videoPlayer = await this.extractVideoPlayerInfo();

      return analysis;
    } catch (error) {
      console.error('❌ [Vision] Analysis error:', error.message);
      return analysis;
    }
  }

  /**
   * Perform OCR on screenshot
   */
  async performOCR(buffer) {
    try {
      console.log('🔍 [Vision] Running OCR...');
      
      const { data } = await Tesseract.recognize(buffer, 'eng', {
        logger: () => {} // Suppress logging
      });

      // Extract meaningful text
      const lines = data.lines && Array.isArray(data.lines)
        ? data.lines.map(line => line.text.trim()).filter(text => text.length > 3)
        : [];

      return lines;
    } catch (error) {
      console.error('❌ [Vision] OCR error:', error.message);
      return [];
    }
  }

  /**
   * Detect if scene has changed significantly
   */
  async detectSceneChange(currentBuffer, previousBuffer) {
    try {
      // Simple hash-based comparison
      const currentHash = await this.generateImageHash(currentBuffer);
      const previousHash = await this.generateImageHash(previousBuffer);

      // Calculate similarity (0 = identical, 1 = completely different)
      const difference = this.hashDifference(currentHash, previousHash);
      
      // Scene changed if difference > 30%
      return difference > 0.3;
    } catch (error) {
      console.error('❌ [Vision] Scene detection error:', error.message);
      return false;
    }
  }

  /**
   * Generate perceptual hash of image
   */
  async generateImageHash(buffer) {
    try {
      // Resize to 8x8 and convert to grayscale for simple hash
      const { data } = await sharp(buffer)
        .resize(8, 8, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Calculate average pixel value
      const avg = data.reduce((sum, val) => sum + val, 0) / data.length;

      // Create binary hash
      const hash = data.map(val => val > avg ? 1 : 0).join('');
      
      return hash;
    } catch (error) {
      console.error('❌ [Vision] Hash error:', error.message);
      return '';
    }
  }

  /**
   * Calculate difference between two hashes
   */
  hashDifference(hash1, hash2) {
    if (hash1.length !== hash2.length) return 1;

    let differences = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) differences++;
    }

    return differences / hash1.length;
  }

  /**
   * Extract video player information from page
   */
  async extractVideoPlayerInfo() {
    try {
      const videoInfo = await this.page.evaluate(() => {
        const info = {
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          title: null,
          url: null
        };

        // Try to find video player
        const video = document.querySelector('video');
        if (video) {
          info.isPlaying = !video.paused;
          info.currentTime = video.currentTime;
          info.duration = video.duration;
          info.url = video.src;
        }

        // Try to find video title in queue
        const queueItem = document.querySelector('.queue-active, .playing, [data-playing="true"]');
        if (queueItem) {
          const titleEl = queueItem.querySelector('.title, .video-title, .qe-title');
          if (titleEl) {
            info.title = titleEl.textContent.trim();
          }
        }

        // Try to find title in page title or headers
        if (!info.title) {
          const pageTitle = document.title;
          if (pageTitle && pageTitle.includes('-')) {
            info.title = pageTitle.split('-')[0].trim();
          }
        }

        return info;
      });

      // Update current video insight
      if (videoInfo.title && videoInfo.title !== this.insights.currentVideo) {
        this.insights.currentVideo = videoInfo.title;
        this.insights.videoHistory.push({
          title: videoInfo.title,
          timestamp: Date.now(),
          url: videoInfo.url
        });

        this.visualMemory.videoTitles.push({
          title: videoInfo.title,
          timestamp: Date.now()
        });

        console.log(`🎬 [Vision] Now playing: ${videoInfo.title}`);
        this.emit('videoDetected', videoInfo);
      }

      return videoInfo;
    } catch (error) {
      console.error('❌ [Vision] Video info extraction error:', error.message);
      return null;
    }
  }

  /**
   * Perform comprehensive analysis
   */
  async performFullAnalysis() {
    try {
      console.log('🔬 [Vision] Performing full analysis...');

      // Calculate scene change rate
      const recentSceneChanges = this.visualMemory.sceneChanges.filter(
        t => Date.now() - t < 300000 // Last 5 minutes
      );
      this.insights.sceneChangeRate = recentSceneChanges.length / 5; // Changes per minute

      // Analyze text patterns
      const recentText = this.visualMemory.detectedText.slice(-10);
      const textWords = recentText
        .flatMap(entry => entry.text)
        .flatMap(line => line.split(/\s+/))
        .filter(word => word.length > 3);

      const wordFreq = textWords.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

      this.insights.textPatterns = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));

      // Emit full analysis event
      this.emit('fullAnalysis', {
        timestamp: Date.now(),
        insights: this.insights,
        memory: {
          screenshots: this.visualMemory.screenshots.length,
          textEntries: this.visualMemory.detectedText.length,
          videoTitles: this.visualMemory.videoTitles.length,
          sceneChanges: this.visualMemory.sceneChanges.length
        }
      });

      console.log('✅ [Vision] Full analysis complete');
      this.logInsights();

    } catch (error) {
      console.error('❌ [Vision] Full analysis error:', error.message);
    }
  }

  /**
   * Stop visual analysis
   */
  stopAnalysis() {
    if (this.screenshotInterval) {
      clearInterval(this.screenshotInterval);
      this.screenshotInterval = null;
    }
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isAnalyzing = false;
    console.log('⏹️ [Vision] Visual analysis stopped');
  }

  /**
   * Get current visual insights
   */
  getInsights() {
    return {
      ...this.insights,
      isAnalyzing: this.isAnalyzing,
      lastScreenshot: this.lastScreenshot ? this.lastScreenshot.timestamp : null,
      totalScreenshots: this.visualMemory.screenshots.length,
      totalSceneChanges: this.visualMemory.sceneChanges.length,
      totalTextDetected: this.visualMemory.detectedText.length
    };
  }

  /**
   * Get visual memory summary
   */
  getMemorySummary() {
    return {
      screenshots: this.visualMemory.screenshots.slice(-10),
      recentText: this.visualMemory.detectedText.slice(-5),
      videoHistory: this.insights.videoHistory.slice(-10),
      currentVideo: this.insights.currentVideo,
      sceneChangeRate: this.insights.sceneChangeRate
    };
  }

  /**
   * Log current insights
   */
  logInsights() {
    console.log('\n👁️ [Vision] Current Insights:');
    console.log(`  🎬 Current video: ${this.insights.currentVideo || 'Unknown'}`);
    console.log(`  📊 Videos watched: ${this.insights.videoHistory.length}`);
    console.log(`  🎨 Avg brightness: ${Math.round(this.insights.averageBrightness)}`);
    console.log(`  🔄 Scene changes: ${this.visualMemory.sceneChanges.length}`);
    console.log(`  📝 Text entries: ${this.visualMemory.detectedText.length}`);
    console.log(`  📸 Screenshots: ${this.visualMemory.screenshots.length}`);
    
    if (this.insights.textPatterns.length > 0) {
      console.log('  🔤 Top words:');
      this.insights.textPatterns.slice(0, 5).forEach(({ word, count }) => {
        console.log(`     - ${word} (${count}x)`);
      });
    }
    console.log('');
  }

  /**
   * Get latest analysis data (for AI context)
   */
  getLatestAnalysis() {
    if (!this.visualMemory.screenshots.length) {
      return null;
    }

    const latest = this.visualMemory.screenshots[this.visualMemory.screenshots.length - 1];
    
    return {
      timestamp: latest.timestamp,
      detected: latest.analysis?.videoPlayer?.title || 'video content',
      confidence: latest.analysis?.videoPlayer?.isPlaying ? 0.9 : 0.5,
      text: latest.analysis?.detectedText?.slice(0, 3) || [],
      scene: latest.analysis?.sceneChanged ? 'changed' : 'stable',
      brightness: latest.analysis?.brightness || 0,
      videoPlaying: latest.analysis?.videoPlayer?.isPlaying || false,
      videoTitle: latest.analysis?.videoPlayer?.title || null,
      videoTime: latest.analysis?.videoPlayer?.currentTime || 0,
      videoDuration: latest.analysis?.videoPlayer?.duration || 0
    };
  }

  /**
   * Get full vision data
   */
  getVisionData() {
    return {
      capabilities: this.capabilities,
      insights: this.insights,
      memory: this.visualMemory,
      isAnalyzing: this.isAnalyzing,
      lastScreenshot: this.lastScreenshot,
      visualLearning: this.getVisualLearningStats()
    };
  }

  /**
   * Learn from chat reactions to current video
   */
  learnFromReaction(username, message, videoContext) {
    if (!videoContext || !videoContext.videoTitle) return;
    
    const videoId = videoContext.videoTitle.toLowerCase().substring(0, 50);
    
    if (!this.visualLearning.videoReactions.has(videoId)) {
      this.visualLearning.videoReactions.set(videoId, {
        positive: 0,
        negative: 0,
        neutral: 0,
        laughs: 0,
        title: videoContext.videoTitle
      });
    }
    
    const reactions = this.visualLearning.videoReactions.get(videoId);
    
    // Analyze sentiment
    if (/\b(lmao|lmfao|haha|😂|💀|hilarious|dying)\b/i.test(message)) {
      reactions.laughs++;
      reactions.positive++;
    } else if (/\b(good|great|love|amazing|fire|🔥|based)\b/i.test(message)) {
      reactions.positive++;
    } else if (/\b(bad|shit|trash|cringe|yikes|mid)\b/i.test(message)) {
      reactions.negative++;
    } else {
      reactions.neutral++;
    }
    
    // Update user preferences
    this.updateUserPreferences(username, videoContext, message);
    
    // Save successful moments (high engagement)
    if (reactions.laughs >= 3 || reactions.positive >= 5) {
      this.visualLearning.successfulMoments.push({
        videoTitle: videoContext.videoTitle,
        timestamp: Date.now(),
        reactions: { ...reactions }
      });
      
      // Keep only last 50
      if (this.visualLearning.successfulMoments.length > 50) {
        this.visualLearning.successfulMoments.shift();
      }
    }
    
    this.saveVisualLearning();
  }

  /**
   * Update user preferences based on reactions
   */
  updateUserPreferences(username, videoContext, message) {
    if (!this.visualLearning.userPreferences.has(username)) {
      this.visualLearning.userPreferences.set(username, {
        likedGenres: [],
        dislikedGenres: [],
        engagementPattern: 'normal'
      });
    }
    
    const prefs = this.visualLearning.userPreferences.get(username);
    
    // Track genre preferences
    const genre = this.detectGenre(videoContext.videoTitle);
    if (genre) {
      if (/\b(good|love|great|amazing)\b/i.test(message)) {
        if (!prefs.likedGenres.includes(genre)) {
          prefs.likedGenres.push(genre);
        }
      } else if (/\b(bad|hate|trash|cringe)\b/i.test(message)) {
        if (!prefs.dislikedGenres.includes(genre)) {
          prefs.dislikedGenres.push(genre);
        }
      }
    }
  }

  /**
   * Detect genre from video title
   */
  detectGenre(title) {
    const lower = title.toLowerCase();
    
    if (/\b(game|gaming|gameplay|lets play|speedrun)\b/.test(lower)) return 'gaming';
    if (/\b(anime|manga|weeb)\b/.test(lower)) return 'anime';
    if (/\b(meme|funny|comedy|laugh|hilarious)\b/.test(lower)) return 'memes';
    if (/\b(music|song|album|concert)\b/.test(lower)) return 'music';
    if (/\b(news|politic|debate)\b/.test(lower)) return 'news';
    if (/\b(tutorial|how to|guide)\b/.test(lower)) return 'educational';
    if (/\b(drama|react|response)\b/.test(lower)) return 'drama';
    
    return null;
  }

  /**
   * Get recommendations based on learned preferences
   */
  getRecommendations() {
    // Find most successful video types
    const videoScores = new Map();
    
    for (const [videoId, reactions] of this.visualLearning.videoReactions.entries()) {
      const score = reactions.positive + (reactions.laughs * 2) - reactions.negative;
      if (score > 0) {
        videoScores.set(videoId, {
          title: reactions.title,
          score,
          reactions
        });
      }
    }
    
    // Sort by score
    const sorted = Array.from(videoScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 5);
    
    return sorted.map(([id, data]) => data);
  }

  /**
   * Get visual learning stats
   */
  getVisualLearningStats() {
    return {
      videosTracked: this.visualLearning.videoReactions.size,
      usersTracked: this.visualLearning.userPreferences.size,
      successfulMoments: this.visualLearning.successfulMoments.length,
      topVideos: this.getRecommendations().slice(0, 3)
    };
  }

  /**
   * Save visual learning data
   */
  async saveVisualLearning() {
    try {
      const data = {
        videoReactions: Array.from(this.visualLearning.videoReactions.entries()),
        userPreferences: Array.from(this.visualLearning.userPreferences.entries()),
        successfulMoments: this.visualLearning.successfulMoments,
        visualJokes: this.visualLearning.visualJokes
      };
      
      await fs.writeFile(this.learningFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ [VisionAnalyzer] Save learning error:', error.message);
    }
  }

  /**
   * Load visual learning data
   */
  async loadVisualLearning() {
    try {
      const data = JSON.parse(await fs.readFile(this.learningFile, 'utf8'));
      
      if (data.videoReactions) {
        this.visualLearning.videoReactions = new Map(data.videoReactions);
      }
      if (data.userPreferences) {
        this.visualLearning.userPreferences = new Map(data.userPreferences);
      }
      if (data.successfulMoments) {
        this.visualLearning.successfulMoments = data.successfulMoments;
      }
      if (data.visualJokes) {
        this.visualLearning.visualJokes = data.visualJokes;
      }
      
      console.log(`👁️ [VisionAnalyzer] Loaded learning data: ${this.visualLearning.videoReactions.size} videos tracked`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('⚠️ [VisionAnalyzer] Load learning error:', error.message);
      }
    }
  }
}

module.exports = VisionAnalyzer;
