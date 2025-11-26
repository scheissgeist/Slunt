const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

/**
 * Video Manager - Handles video tracking, queue management, and video search
 */
class VideoManager {
  constructor() {
    this.currentVideo = null;
    this.queue = [];
    this.videoHistory = [];
    this.dataFile = path.join(__dirname, '../../data/videos.json');
    
    this.loadData();
  }

  /**
   * Load video data from persistent storage
   */
  async loadData() {
    try {
      await fs.mkdir(path.dirname(this.dataFile), { recursive: true });
      
      try {
        const videoData = await fs.readFile(this.dataFile, 'utf8');
        const data = JSON.parse(videoData);
        this.currentVideo = data.currentVideo || null;
        this.queue = data.queue || [];
        this.videoHistory = data.videoHistory || [];
      } catch (error) {
        console.log('No existing video data found, starting fresh');
      }
    } catch (error) {
      console.error('Error loading video data:', error);
    }
  }

  /**
   * Save video data to persistent storage
   */
  async saveData() {
    try {
      const data = {
        currentVideo: this.currentVideo,
        queue: this.queue,
        videoHistory: this.videoHistory.slice(-100) // Keep last 100 videos
      };
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving video data:', error);
    }
  }

  /**
   * Update current playing video
   */
  setCurrentVideo(videoData) {
    // Add previous video to history
    if (this.currentVideo) {
      this.videoHistory.push({
        ...this.currentVideo,
        endTime: new Date().toISOString()
      });
    }

    this.currentVideo = {
      id: videoData.id,
      title: videoData.title,
      duration: videoData.duration,
      type: videoData.type,
      currentTime: videoData.currentTime || 0,
      startTime: new Date().toISOString(),
      queuedBy: videoData.queuedBy || 'Unknown'
    };

    this.saveData();
    console.log(`Now playing: ${this.currentVideo.title}`);
  }

  /**
   * Update video playback position
   */
  updateVideoPosition(currentTime, paused = false) {
    if (this.currentVideo) {
      this.currentVideo.currentTime = currentTime;
      this.currentVideo.paused = paused;
      this.currentVideo.lastUpdate = new Date().toISOString();
    }
  }

  /**
   * Get current playing video
   */
  getCurrentVideo() {
    return this.currentVideo;
  }

  /**
   * Update the video queue
   */
  updateQueue(queueData) {
    this.queue = queueData.map(item => ({
      id: item.media?.id || item.id,
      title: item.media?.title || item.title,
      duration: item.media?.seconds || item.duration,
      type: item.media?.type || item.type,
      queuedBy: item.queueby || 'Unknown',
      position: item.uid || this.queue.length
    }));

    this.saveData();
    console.log(`Queue updated: ${this.queue.length} videos`);
  }

  /**
   * Add video to queue (for manual queueing)
   */
  addToQueue(videoId, title, type = 'yt', queuedBy = 'Bot') {
    // Check if video is already in queue
    const alreadyInQueue = this.queue.find(v => v.id === videoId);
    if (alreadyInQueue) {
      console.log(`⚠️ Video already in queue: ${title}`);
      return { 
        success: false, 
        reason: 'duplicate',
        message: 'Video is already in the queue'
      };
    }
    
    // Check if video was recently played (last 5 videos)
    const recentlyPlayed = this.videoHistory.slice(-5).find(v => v.videoId === videoId);
    if (recentlyPlayed) {
      console.log(`⚠️ Video was recently played: ${title}`);
      return { 
        success: false, 
        reason: 'recently_played',
        message: 'Video was recently played'
      };
    }
    
    const videoItem = {
      id: videoId,
      title: title,
      type: type,
      queuedBy: queuedBy,
      position: this.queue.length,
      addedAt: new Date().toISOString()
    };

    this.queue.push(videoItem);
    this.saveData();
    
    console.log(`✅ Added to queue: ${title}`);
    return { 
      success: true, 
      video: videoItem 
    };
  }

  /**
   * Get current queue
   */
  getQueue() {
    return this.queue;
  }

  /**
   * Get queue length
   */
  getQueueLength() {
    return this.queue.length;
  }

  /**
   * Get video history
   */
  getVideoHistory(limit = 20) {
    return this.videoHistory.slice(-limit).reverse();
  }

  /**
   * Search for YouTube videos
   */
  async searchYouTube(query, maxResults = 10) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: maxResults,
          key: apiKey,
          videoEmbeddable: 'true',
          videoSyndicated: 'true'
        }
      });

      const videos = response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        type: 'yt'
      }));

      return videos;
    } catch (error) {
      console.error('YouTube search error:', error);
      throw new Error('Failed to search YouTube videos');
    }
  }

  /**
   * Search videos using multiple sources
   */
  async searchVideos(query, maxResults = 10) {
    const results = {
      query: query,
      timestamp: new Date().toISOString(),
      sources: {}
    };

    // YouTube search
    try {
      results.sources.youtube = await this.searchYouTube(query, maxResults);
    } catch (error) {
      console.warn('YouTube search failed:', error.message);
      results.sources.youtube = [];
    }

    // You could add more video sources here (Vimeo, Dailymotion, etc.)
    
    // Combine results
    const allVideos = [
      ...(results.sources.youtube || [])
    ];

    return {
      ...results,
      videos: allVideos.slice(0, maxResults),
      totalResults: allVideos.length
    };
  }

  /**
   * Get video details by ID and type
   */
  async getVideoDetails(videoId, type = 'yt') {
    if (type === 'yt') {
      return await this.getYouTubeVideoDetails(videoId);
    }
    
    throw new Error(`Unsupported video type: ${type}`);
  }

  /**
   * Get YouTube video details
   */
  async getYouTubeVideoDetails(videoId) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: apiKey
        }
      });

      if (response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = response.data.items[0];
      
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        duration: this.parseDuration(video.contentDetails.duration),
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        type: 'yt'
      };
    } catch (error) {
      console.error('YouTube video details error:', error);
      throw new Error('Failed to get video details');
    }
  }

  /**
   * Parse YouTube duration format (PT4M13S) to seconds
   */
  parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = (match[1] ? parseInt(match[1]) : 0);
    const minutes = (match[2] ? parseInt(match[2]) : 0);
    const seconds = (match[3] ? parseInt(match[3]) : 0);

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Format duration in seconds to human readable format
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Get statistics about videos
   */
  getStatistics() {
    const totalVideosWatched = this.videoHistory.length;
    const totalQueueLength = this.queue.length;
    
    // Most active queuers
    const queuers = {};
    [...this.videoHistory, ...this.queue].forEach(video => {
      if (video.queuedBy) {
        queuers[video.queuedBy] = (queuers[video.queuedBy] || 0) + 1;
      }
    });

    const topQueuers = Object.entries(queuers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      totalVideosWatched,
      totalQueueLength,
      topQueuers,
      currentVideo: this.currentVideo,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Check if the video manager is operational
   */
  isOperational() {
    return Array.isArray(this.queue) && Array.isArray(this.videoHistory);
  }
}

module.exports = VideoManager;