/**
 * Online Media Search
 * Search for images and videos online based on context
 * NO prebuilt/canned responses - always fresh searches
 */

const axios = require('axios');

/**
 * Search Google Images for a specific query
 * Uses Google Custom Search API
 * @param {string} query - Search query
 * @returns {Promise<string|null>} Image URL or null
 */
async function searchImage(query) {
  try {
    // Use Google Custom Search JSON API if key is available
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!apiKey || !searchEngineId) {
      console.log('⚠️ [ImageSearch] No Google API credentials - skipping image search');
      return null;
    }

    const url = `https://www.googleapis.com/customsearch/v1`;
    const params = {
      key: apiKey,
      cx: searchEngineId,
      q: query,
      searchType: 'image',
      num: 1,
      safe: 'off',
      fileType: 'jpg,gif,png',
      imgSize: 'medium'
    };

    const response = await axios.get(url, { params, timeout: 5000 });
    
    if (response.data.items && response.data.items.length > 0) {
      const imageUrl = response.data.items[0].link;
      console.log(`🔍 [ImageSearch] Found: ${query} -> ${imageUrl}`);
      return imageUrl;
    }

    return null;

  } catch (error) {
    console.error(`❌ [ImageSearch] Error: ${error.message}`);
    return null;
  }
}

/**
 * Search YouTube for a video based on query
 * @param {string} query - Search query
 * @returns {Promise<string|null>} YouTube URL or null
 */
async function searchVideo(query) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️ [VideoSearch] No YouTube API key - skipping video search');
      return null;
    }

    const url = 'https://www.googleapis.com/youtube/v3/search';
    const params = {
      key: apiKey,
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults: 1,
      safeSearch: 'none',
      order: 'relevance'
    };

    const response = await axios.get(url, { params, timeout: 5000 });
    
    if (response.data.items && response.data.items.length > 0) {
      const videoId = response.data.items[0].id.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`🔍 [VideoSearch] Found: ${query} -> ${videoUrl}`);
      return videoUrl;
    }

    return null;

  } catch (error) {
    console.error(`❌ [VideoSearch] Error: ${error.message}`);
    return null;
  }
}

/**
 * Generate a contextual search query based on the situation
 * @param {Object} context - Context about the user/situation
 * @returns {string} Search query
 */
function generateSearchQuery(context = {}) {
  const { username, responseText, messageText, type = 'image' } = context;
  
  // Extract keywords from the roast or message
  const text = responseText || messageText || '';
  const lowerText = text.toLowerCase();
  
  // Build search query based on what was said
  let query = '';
  
  if (lowerText.includes('cry') || lowerText.includes('baby')) {
    query = 'crying baby gif';
  } else if (lowerText.includes('clown')) {
    query = 'clown makeup gif';
  } else if (lowerText.includes('loser') || lowerText.includes('pathetic')) {
    query = 'loser fail gif';
  } else if (lowerText.includes('stupid') || lowerText.includes('dumb')) {
    query = 'stupid person gif';
  } else if (lowerText.includes('ugly')) {
    query = 'ugly face reaction';
  } else if (lowerText.includes('cringe') || lowerText.includes('embarrass')) {
    query = 'cringe embarrassing moment';
  } else {
    // Generic funny/embarrassing content
    query = type === 'video' ? 'funny fail compilation' : 'embarrassing moment gif';
  }
  
  return query;
}

/**
 * Search for appropriate media based on context
 * @param {Object} context - Context about the situation
 * @param {string} type - 'image' or 'video'
 * @returns {Promise<Object|null>} { url, query } or null
 */
async function searchMediaForContext(context = {}, type = 'image') {
  const query = generateSearchQuery({ ...context, type });
  
  let url = null;
  if (type === 'image') {
    url = await searchImage(query);
  } else {
    url = await searchVideo(query);
  }
  
  if (!url) {
    console.log(`⚠️ [MediaSearch] No ${type} found for: ${query}`);
    return null;
  }
  
  return { url, query };
}

module.exports = {
  searchImage,
  searchVideo,
  generateSearchQuery,
  searchMediaForContext
};
