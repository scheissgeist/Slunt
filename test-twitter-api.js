require('dotenv').config();
const TwitterApiClient = require('./src/twitter/twitterApiClient');

async function testTwitterAPI() {
  console.log('🐦 Starting Twitter API test...\n');

  const twitter = new TwitterApiClient({
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
    maxTweetsPerDay: 50
  });

  try {
    // Connect and verify credentials
    console.log('1️⃣ Connecting to Twitter API...');
    await twitter.connect();
    console.log('✅ Connected!\n');

    // Check rate limit status
    console.log('2️⃣ Checking rate limit status...');
    const status = twitter.getRateLimitStatus();
    console.log(`📊 Rate limit: ${status.tweetsToday}/${status.maxTweetsPerDay} tweets today`);
    console.log(`📊 Remaining: ${status.remaining} tweets\n`);

    // Post a test tweet
    console.log('3️⃣ Posting test tweet...');
    const testTweet = `testing twitter api integration lol ${Date.now()}`;
    const tweet = await twitter.tweet(testTweet);
    console.log(`✅ Tweet posted! ID: ${tweet.id}`);
    console.log(`🔗 URL: https://twitter.com/i/web/status/${tweet.id}\n`);

    console.log('🎉 All tests passed! Twitter API is working perfectly.');
    console.log('💡 The browser automation can be replaced with this API client.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.data) {
      console.error('Error details:', error.data);
    }
  }
}

testTwitterAPI();
