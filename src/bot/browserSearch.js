/**
 * Browser-based search - NO API KEYS NEEDED
 * Uses Puppeteer to scrape Google Images and YouTube
 */

const puppeteer = require('puppeteer');
const logger = require('./logger');

class BrowserSearch {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
  }

  /**
   * Initialize headless browser
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
      this.isInitialized = true;
      logger.info('🌐 Browser search initialized (headless)');
    } catch (error) {
      logger.error(`❌ Failed to initialize browser: ${error.message}`);
    }
  }

  /**
   * Search Google Images and scrape results
   * @param {string} query - Search query
   * @returns {Promise<Object|null>} - {url, query}
   */
  async searchImage(query) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.browser) {
      logger.error('❌ Browser not available');
      return null;
    }

    let page = null;
    try {
      page = await this.browser.newPage();
      
      // Set user agent to avoid bot detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Search Google Images
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=off`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });

      // Wait for images to load
      await page.waitForSelector('img', { timeout: 5000 });

      // Extract image URLs
      const imageUrls = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images
          .map(img => img.src)
          .filter(src => src && src.startsWith('http') && !src.includes('gstatic.com'))
          .slice(0, 10);
      });

      await page.close();

      if (imageUrls.length > 0) {
        // Pick a random image from results
        const randomUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
        logger.info(`🖼️ Found image for "${query}": ${randomUrl.substring(0, 60)}...`);
        return { url: randomUrl, query };
      }

      logger.warn(`⚠️ No images found for "${query}"`);
      return null;

    } catch (error) {
      logger.error(`❌ Image search error: ${error.message}`);
      if (page) await page.close();
      return null;
    }
  }

  /**
   * Search YouTube and scrape video results
   * @param {string} query - Search query
   * @returns {Promise<Object|null>} - {url, title, query}
   */
  async searchVideo(query) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.browser) {
      logger.error('❌ Browser not available');
      return null;
    }

    let page = null;
    try {
      page = await this.browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Search YouTube
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });

      // Wait for video results
      await page.waitForSelector('a#video-title', { timeout: 5000 });

      // Extract video info
      const videos = await page.evaluate(() => {
        const videoElements = Array.from(document.querySelectorAll('a#video-title'));
        return videoElements
          .map(el => ({
            url: 'https://www.youtube.com' + el.getAttribute('href'),
            title: el.getAttribute('title') || el.innerText
          }))
          .filter(v => v.url && v.title)
          .slice(0, 5);
      });

      await page.close();

      if (videos.length > 0) {
        // Pick first result (most relevant)
        const video = videos[0];
        logger.info(`🎥 Found video for "${query}": ${video.title}`);
        return { url: video.url, title: video.title, query };
      }

      logger.warn(`⚠️ No videos found for "${query}"`);
      return null;

    } catch (error) {
      logger.error(`❌ Video search error: ${error.message}`);
      if (page) await page.close();
      return null;
    }
  }

  /**
   * Generate contextual search query from conversation
   * @param {Object} context - {username, responseText, messageText}
   * @returns {string}
   */
  generateSearchQuery(context) {
    const { username, responseText = '', messageText = '' } = context;

    // Extract keywords from the roast/message
    const text = (responseText + ' ' + messageText).toLowerCase();
    
    // Common embarrassing/funny themes
    if (text.includes('cry') || text.includes('sad') || text.includes('tear')) {
      return 'person crying embarrassing';
    }
    if (text.includes('fat') || text.includes('food') || text.includes('eat')) {
      return 'fat person eating food';
    }
    if (text.includes('ugly') || text.includes('face') || text.includes('look')) {
      return 'ugly face';
    }
    if (text.includes('stupid') || text.includes('dumb') || text.includes('idiot')) {
      return 'stupid person fail';
    }
    if (text.includes('loser') || text.includes('fail') || text.includes('pathetic')) {
      return 'loser fail cringe';
    }
    if (text.includes('nerd') || text.includes('virgin') || text.includes('basement')) {
      return 'neckbeard computer';
    }

    // Default: embarrassing moment
    return 'embarrassing person funny';
  }

  /**
   * Search for contextual media based on conversation
   * @param {Object} context - {username, responseText, messageText}
   * @param {string} type - 'image' or 'video'
   * @returns {Promise<Object|null>}
   */
  async searchMediaForContext(context, type = 'image') {
    const query = this.generateSearchQuery(context);
    
    if (type === 'video') {
      return await this.searchVideo(query);
    } else {
      return await this.searchImage(query);
    }
  }

  /**
   * Cleanup - close browser
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      logger.info('🌐 Browser search closed');
    }
  }
}

// Export singleton
module.exports = new BrowserSearch();
