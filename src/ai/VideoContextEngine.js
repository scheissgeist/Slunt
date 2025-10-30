/**
 * VideoContextEngine.js
 * Understands and reacts to video content using vision analysis
 */

class VideoContextEngine {
  constructor(visionAnalyzer) {
    this.visionAnalyzer = visionAnalyzer;
    this.videoHistory = [];
    this.currentVideo = null;
    this.videoPreferences = new Map();
    this.callbacks = [];
    this.predictions = [];
    this.ratings = [];
    this.analysisInterval = null;
  }
  
  /**
   * Start continuous video analysis
   */
  startWatching() {
    console.log('📺 [Video Context] Starting continuous video analysis...');
    
    // Analyze every 30 seconds
    this.analysisInterval = setInterval(() => {
      this.analyzeCurrentVideo();
    }, 30000);
    
    // Initial analysis
    this.analyzeCurrentVideo();
  }
  
  /**
   * Stop watching
   */
  stopWatching() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }
  
  /**
   * Analyze current video frame
   */
  async analyzeCurrentVideo() {
    try {
      if (!this.visionAnalyzer) return;
      
      // Get current screen analysis
      const analysis = await this.visionAnalyzer.analyzeScreen();
      
      if (!analysis) return;
      
      // Extract video info from OCR
      const videoInfo = this.extractVideoInfo(analysis);
      
      if (videoInfo) {
        this.processVideoInfo(videoInfo);
      }
      
    } catch (error) {
      console.error('[Video Context] Analysis error:', error);
    }
  }
  
  /**
   * Extract video information from vision analysis
   */
  extractVideoInfo(analysis) {
    if (!analysis.ocr || analysis.ocr.length === 0) return null;
    
    const text = analysis.ocr.map(item => item.text).join(' ');
    
    // Try to identify video title, channel, etc.
    const videoInfo = {
      text,
      timestamp: Date.now(),
      entities: analysis.entities || [],
      sentiment: this.analyzeSentiment(text),
      keywords: this.extractKeywords(text)
    };
    
    return videoInfo;
  }
  
  /**
   * Process video information
   */
  processVideoInfo(videoInfo) {
    // Update current video
    this.currentVideo = videoInfo;
    
    // Add to history
    this.videoHistory.push(videoInfo);
    if (this.videoHistory.length > 50) {
      this.videoHistory.shift();
    }
    
    // Learn preferences
    this.learnPreferences(videoInfo);
    
    // Check for callback opportunities
    this.checkForCallbacks(videoInfo);
    
    console.log(`📺 [Video Context] Analyzed: ${videoInfo.keywords.slice(0, 3).join(', ')}`);
  }
  
  /**
   * Learn video preferences
   */
  learnPreferences(videoInfo) {
    for (const keyword of videoInfo.keywords) {
      if (!this.videoPreferences.has(keyword)) {
        this.videoPreferences.set(keyword, {
          count: 0,
          positiveReactions: 0,
          negativeReactions: 0,
          preference: 0 // -100 to 100
        });
      }
      
      const pref = this.videoPreferences.get(keyword);
      pref.count++;
      
      // Adjust preference based on random "taste"
      const reaction = Math.random();
      if (reaction < 0.3) {
        pref.negativeReactions++;
        pref.preference = Math.max(-100, pref.preference - 5);
      } else if (reaction > 0.7) {
        pref.positiveReactions++;
        pref.preference = Math.min(100, pref.preference + 5);
      }
    }
  }
  
  /**
   * Check for callback opportunities
   */
  checkForCallbacks(videoInfo) {
    // Look for similar videos in history
    for (const oldVideo of this.videoHistory.slice(0, -5)) {
      const similarity = this.calculateSimilarity(videoInfo, oldVideo);
      
      if (similarity > 0.6) {
        this.callbacks.push({
          current: videoInfo,
          previous: oldVideo,
          similarity,
          timestamp: Date.now()
        });
        
        console.log(`🔁 [Video Context] Callback opportunity detected (${Math.round(similarity * 100)}% similar)`);
        break;
      }
    }
    
    // Keep only recent callbacks
    if (this.callbacks.length > 20) {
      this.callbacks = this.callbacks.slice(-20);
    }
  }
  
  /**
   * Calculate similarity between videos
   */
  calculateSimilarity(video1, video2) {
    const keywords1 = new Set(video1.keywords);
    const keywords2 = new Set(video2.keywords);
    
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Generate comment about current video
   */
  generateComment() {
    if (!this.currentVideo) return null;
    
    const comments = [];
    
    // Check preferences
    const likedKeywords = this.currentVideo.keywords.filter(k => {
      const pref = this.videoPreferences.get(k);
      return pref && pref.preference > 50;
    });
    
    const dislikedKeywords = this.currentVideo.keywords.filter(k => {
      const pref = this.videoPreferences.get(k);
      return pref && pref.preference < -50;
    });
    
    if (likedKeywords.length > 0) {
      comments.push({
        type: 'positive',
        text: `oh shit ${likedKeywords[0]}`,
        confidence: 0.8
      });
    }
    
    if (dislikedKeywords.length > 0) {
      comments.push({
        type: 'negative',
        text: `skip this ${dislikedKeywords[0]} mid`,
        confidence: 0.7
      });
    }
    
    // Callback comments
    if (this.callbacks.length > 0 && Math.random() < 0.3) {
      comments.push({
        type: 'callback',
        text: 'wait didnt we watch something like this before',
        confidence: 0.6
      });
    }
    
    // Random rating
    if (Math.random() < 0.15) {
      const rating = Math.floor(Math.random() * 6) + 5; // 5-10
      comments.push({
        type: 'rating',
        text: `this ${rating}/10`,
        confidence: 0.5
      });
    }
    
    if (comments.length === 0) return null;
    
    // Return highest confidence comment
    comments.sort((a, b) => b.confidence - a.confidence);
    return comments[0].text;
  }
  
  /**
   * Make a prediction about what will happen
   */
  makePrediction() {
    if (!this.currentVideo) return null;
    
    const predictions = [
      'this gonna be fire',
      'this about to flop',
      'calling it now this mid',
      'this one gonna be good',
      'skip incoming',
      'banger alert'
    ];
    
    const prediction = predictions[Math.floor(Math.random() * predictions.length)];
    
    this.predictions.push({
      text: prediction,
      timestamp: Date.now(),
      video: this.currentVideo.keywords.slice(0, 2)
    });
    
    return prediction;
  }
  
  /**
   * Spontaneously rate video
   */
  rateVideo() {
    if (!this.currentVideo) return null;
    
    // Base rating on preferences
    let baseRating = 7;
    let preferenceScore = 0;
    let keywordCount = 0;
    
    for (const keyword of this.currentVideo.keywords) {
      const pref = this.videoPreferences.get(keyword);
      if (pref) {
        preferenceScore += pref.preference;
        keywordCount++;
      }
    }
    
    if (keywordCount > 0) {
      const avgPreference = preferenceScore / keywordCount;
      baseRating += Math.round(avgPreference / 33); // -3 to +3
    }
    
    const rating = Math.max(1, Math.min(10, baseRating));
    
    this.ratings.push({
      rating,
      timestamp: Date.now(),
      video: this.currentVideo.keywords.slice(0, 2)
    });
    
    return `${rating}/10`;
  }
  
  /**
   * Analyze sentiment of text
   */
  analyzeSentiment(text) {
    const positive = ['good', 'great', 'amazing', 'best', 'love', 'awesome', 'fire', 'sick'];
    const negative = ['bad', 'worst', 'hate', 'terrible', 'awful', 'mid', 'trash', 'cringe'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    for (const word of positive) {
      if (lowerText.includes(word)) score++;
    }
    for (const word of negative) {
      if (lowerText.includes(word)) score--;
    }
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }
  
  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    // Return unique words
    return [...new Set(words)].slice(0, 10);
  }
  
  /**
   * Get status for dashboard
   */
  getStatus() {
    return {
      currentVideo: this.currentVideo ? {
        keywords: this.currentVideo.keywords.slice(0, 5),
        sentiment: this.currentVideo.sentiment
      } : null,
      videoCount: this.videoHistory.length,
      preferences: Array.from(this.videoPreferences.entries())
        .sort(([, a], [, b]) => Math.abs(b.preference) - Math.abs(a.preference))
        .slice(0, 10)
        .map(([keyword, data]) => ({
          keyword,
          preference: Math.round(data.preference),
          count: data.count
        })),
      recentCallbacks: this.callbacks.slice(-5).map(cb => ({
        keywords: cb.current.keywords.slice(0, 2),
        similarity: Math.round(cb.similarity * 100)
      })),
      recentRatings: this.ratings.slice(-5)
    };
  }
}

module.exports = VideoContextEngine;
