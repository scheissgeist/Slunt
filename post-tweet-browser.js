/**
 * Manual Twitter post using browser automation
 * Bypasses API rate limits
 */

require('dotenv').config({ override: true });
const TwitterBrowserClient = require('./src/twitter/browserClient');

async function postTweet() {
  const client = new TwitterBrowserClient();
  
  try {
    console.log('🚀 Connecting to Twitter...');
    console.log('💡 Set TWITTER_HEADLESS=false and log in manually if needed');
    
    // Set headless based on environment
    if (process.env.TWITTER_HEADLESS === 'false') {
      console.log('🪟 Browser will be VISIBLE - you can log in manually');
      console.log('⏳ You have 60 seconds to log in if needed...');
    }
    
    await client.connect();
    
    // Generate a contextual tweet
    const tweets = [
      "watching godfather rn. michael's about to make some moves",
      "that feeling when you gotta take out your brother in law",
      "mob politics hit different when you're in too deep",
      "never take sides against the family. solid advice tbh",
      "this whole baptism scene is cinema",
    ];
    
    const tweet = tweets[Math.floor(Math.random() * tweets.length)];
    
    console.log(`📝 Posting: "${tweet}"`);
    await client.tweet(tweet);
    
    console.log('✅ Tweet posted successfully!');
    
    // Close browser
    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to post tweet:', error.message);
    if (error.message.includes('verification')) {
      console.log('\n💡 To fix this:');
      console.log('   1. Run: $env:TWITTER_HEADLESS="false"; node post-tweet-browser.js');
      console.log('   2. Log in manually in the browser window');
      console.log('   3. Complete any verification');
      console.log('   4. The session will be saved for next time');
    }
    await client.disconnect();
    process.exit(1);
  }
}

postTweet();
