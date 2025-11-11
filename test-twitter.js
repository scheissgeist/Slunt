/**
 * Twitter Test Script
 * Test Slunt's Twitter posting capabilities
 */

require('dotenv').config({ override: true });
const TwitterClient = require('./src/twitter/twitterClient');

async function test() {
  console.log('🐦 Starting Twitter test...\n');

  const twitter = new TwitterClient({
    username: process.env.TWITTER_USERNAME,
    password: process.env.TWITTER_PASSWORD,
    maxTweetsPerDay: 50
  });

  // Connect
  console.log('Connecting to Twitter...');
  const connected = await twitter.connect();
  
  if (!connected) {
    console.error('❌ Failed to connect');
    process.exit(1);
  }

  console.log('✅ Connected!\n');

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Post a test tweet
  console.log('Posting test tweet...');
  const testTweet = "testing twitter bot integration lol";
  const success = await twitter.tweet(testTweet);

  if (success) {
    console.log('✅ Tweet posted successfully!');
  } else {
    console.error('❌ Failed to post tweet');
  }

  // Wait to see result
  console.log('\nWaiting 5 seconds before cleanup...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Don't disconnect yet so you can verify the tweet posted
  console.log('\n✅ Test complete! Check Twitter to verify.');
  console.log('Browser will stay open - close manually or press Ctrl+C');
}

test().catch(console.error);
