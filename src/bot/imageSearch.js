/**
 * Image Search for Pranks
 * Simple image search to find funny/embarrassing pictures
 */

const axios = require('axios');

/**
 * Curated funny/embarrassing image URLs
 * These are reliable and won't break
 */
const PRANK_IMAGES = {
  crying: [
    'https://media.tenor.com/0FUwKEjRKT0AAAAC/crying-baby.gif',
    'https://media.tenor.com/6B-F5YvXO0sAAAAC/crying-baby-cry.gif',
    'https://media.tenor.com/lNB5g_qwN1EAAAAC/baby-crying.gif'
  ],
  
  ugly: [
    'https://media.tenor.com/2Y8lZX_8mLEAAAAC/ugly-gross.gif',
    'https://media.tenor.com/XN1jLZDwNKQAAAAC/ugly-looking.gif'
  ],
  
  loser: [
    'https://media.tenor.com/3JJ5L_KSDYEAAAAC/loser-hand.gif',
    'https://media.tenor.com/khVZLNZKE0EAAAAC/loser-you-are-a-loser.gif'
  ],
  
  clown: [
    'https://media.tenor.com/LqYPXLCL87IAAAAC/clown-makeup.gif',
    'https://media.tenor.com/ZCgC5nh0OGIAAAAC/clown-clown-face.gif'
  ],
  
  cringe: [
    'https://media.tenor.com/uBcbvnuP_j0AAAAC/cringe-disgusted.gif',
    'https://media.tenor.com/7BqVH9KnLHkAAAAC/cringe-awkward.gif'
  ],
  
  stupid: [
    'https://media.tenor.com/g2E7yQl2NAUAAAAC/stupid-dumb.gif',
    'https://media.tenor.com/hL8lKhYBRTkAAAAC/dumb-patrick.gif'
  ],
  
  screaming: [
    'https://media.tenor.com/yRaPQ-nDaQsAAAAC/scream-screaming.gif',
    'https://media.tenor.com/YXTJS3hTZPMAAAAC/screaming-goat.gif'
  ],
  
  embarrassing: [
    'https://media.tenor.com/UOyWl24t-kwAAAAC/embarrassed-awkward.gif',
    'https://media.tenor.com/3LxGC5hxP2UAAAAC/awkward-uncomfortable.gif'
  ]
};

/**
 * Get a random prank image from a category
 * @param {string} category - Image category (crying, ugly, loser, etc.)
 * @returns {string} Image URL
 */
function getPrankImage(category = 'crying') {
  const images = PRANK_IMAGES[category] || PRANK_IMAGES.crying;
  return images[Math.floor(Math.random() * images.length)];
}

/**
 * Get all available categories
 * @returns {Array<string>} Available categories
 */
function getCategories() {
  return Object.keys(PRANK_IMAGES);
}

/**
 * Search for an image using keywords (fallback to curated images)
 * @param {string} query - Search query
 * @returns {Object} Image URL and caption
 */
async function searchImage(query) {
  const lowerQuery = query.toLowerCase();
  
  // Map keywords to categories
  let category = 'embarrassing'; // default
  
  if (lowerQuery.includes('cry') || lowerQuery.includes('sad')) {
    category = 'crying';
  } else if (lowerQuery.includes('ugly')) {
    category = 'ugly';
  } else if (lowerQuery.includes('loser') || lowerQuery.includes('fail')) {
    category = 'loser';
  } else if (lowerQuery.includes('clown')) {
    category = 'clown';
  } else if (lowerQuery.includes('cringe')) {
    category = 'cringe';
  } else if (lowerQuery.includes('stupid') || lowerQuery.includes('dumb')) {
    category = 'stupid';
  } else if (lowerQuery.includes('scream') || lowerQuery.includes('yell')) {
    category = 'screaming';
  }
  
  const imageUrl = getPrankImage(category);
  
  return {
    url: imageUrl,
    category,
    caption: generateCaption(category)
  };
}

/**
 * Generate a caption for the image
 * @param {string} category - Image category
 * @returns {string} Caption text
 */
function generateCaption(category) {
  const captions = {
    crying: ["here's u", "found ur baby pic", "u rn", "this u?"],
    ugly: ["here's u", "bro check this out", "literally you"],
    loser: ["here's u boss", "this u?", "found ur profile pic"],
    clown: ["here's u getting ready", "u putting on makeup", "before work"],
    cringe: ["u watching ur old tweets", "u in public", "this u?"],
    stupid: ["u trying to think", "ur brain", "u reading this"],
    screaming: ["u rn", "this u?", "ur reaction to everything"],
    embarrassing: ["here's u", "found this", "u at parties"]
  };
  
  const categoryCaption = captions[category] || captions.embarrassing;
  return categoryCaption[Math.floor(Math.random() * categoryCaption.length)];
}

/**
 * Get a complete image prank (URL + caption)
 * @param {string} categoryOrQuery - Category name or search query
 * @returns {Promise<Object>} Image URL and caption
 */
async function getImagePrank(categoryOrQuery = 'crying') {
  // Check if it's a known category
  if (PRANK_IMAGES[categoryOrQuery]) {
    return {
      url: getPrankImage(categoryOrQuery),
      category: categoryOrQuery,
      caption: generateCaption(categoryOrQuery)
    };
  }
  
  // Otherwise search
  return await searchImage(categoryOrQuery);
}

module.exports = {
  getPrankImage,
  searchImage,
  getImagePrank,
  getCategories,
  PRANK_IMAGES
};
