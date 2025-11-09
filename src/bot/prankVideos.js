/**
 * Prank Video Library
 * Collection of embarrassing/funny videos for Slunt to send as pranks
 */

const PRANK_VIDEOS = {
  // Crying/emotional
  crying: [
    'https://www.youtube.com/watch?v=ee925OTFBCA', // Crying baby
    'https://www.youtube.com/watch?v=CgHW02YF50s', // Baby crying compilation
    'https://www.youtube.com/watch?v=1M4FG1UIT1E', // Dramatic crying
  ],

  // Cringe/awkward
  cringe: [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Classic rickroll
    'https://www.youtube.com/watch?v=9bZkp7q19f0', // Gangnam Style
    'https://www.youtube.com/watch?v=kfVsfOSbJY0', // Rebecca Black Friday
  ],

  // Animals/losers
  losers: [
    'https://www.youtube.com/watch?v=j5a0jTc9S10', // Screaming goat
    'https://www.youtube.com/watch?v=rvrZJ5C_Nwg', // Dramatic chipmunk
    'https://www.youtube.com/watch?v=MtN1YnoL46Q', // Dramatic prairie dog
  ],

  // Fail compilations
  fails: [
    'https://www.youtube.com/watch?v=5OE5qyh0fSk', // Epic fail compilation
    'https://www.youtube.com/watch?v=Xz-UvQYAmbg', // Instant regret compilation
  ],

  // Weird/creepy
  weird: [
    'https://www.youtube.com/watch?v=wqTpHhaKtL8', // Keyboard cat
    'https://www.youtube.com/watch?v=NHO84rOp8FQ', // Weird guy dancing
  ],

  // "You" pranks (direct comparisons)
  you: [
    'https://www.youtube.com/watch?v=ee925OTFBCA', // "here's u" crying baby
    'https://www.youtube.com/watch?v=j5a0jTc9S10', // "here's u" screaming goat
    'https://www.youtube.com/watch?v=rvrZJ5C_Nwg', // "here's u" dramatic chipmunk
    'https://www.youtube.com/watch?v=FavUpD_IjVY', // "here's u" sad violin
  ]
};

// Prank messages to accompany videos
const PRANK_MESSAGES = {
  you: [
    "here's u",
    "this u?",
    "found ur home video",
    "leaked footage of u",
    "bro check this out it's literally you",
    "yo is this you?",
    "saw this and thought of u immediately"
  ],
  
  roast: [
    "watch this and think about what you've become",
    "this reminded me of u for some reason",
    "idk why but this is giving big u energy",
    "sending this to u specifically",
    "you should see this",
    "this video called me and asked about u"
  ],

  casual: [
    "lmao check this",
    "bruh",
    "no way",
    "😭😭😭",
    "LMAOOO",
    "dead"
  ]
};

/**
 * Get a random prank video from a category
 */
function getPrankVideo(category = 'you') {
  const videos = PRANK_VIDEOS[category] || PRANK_VIDEOS.you;
  return videos[Math.floor(Math.random() * videos.length)];
}

/**
 * Get a random prank message
 */
function getPrankMessage(type = 'you') {
  const messages = PRANK_MESSAGES[type] || PRANK_MESSAGES.you;
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get a complete prank (message + video)
 */
function getCompletePrank(category = 'you', messageType = 'you') {
  return {
    message: getPrankMessage(messageType),
    video: getPrankVideo(category)
  };
}

/**
 * Get all available categories
 */
function getCategories() {
  return Object.keys(PRANK_VIDEOS);
}

module.exports = {
  PRANK_VIDEOS,
  PRANK_MESSAGES,
  getPrankVideo,
  getPrankMessage,
  getCompletePrank,
  getCategories
};
