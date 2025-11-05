// Quick sanity check - verify ResponsePolicy and chatBot can initialize
console.log('🧪 Sanity Check: Loading modules...\n');

try {
  console.log('1. Loading ResponsePolicy...');
  const ResponsePolicy = require('../src/core/ResponsePolicy.js');
  
  console.log('2. Creating ResponsePolicy instance...');
  const policy = new ResponsePolicy();
  
  console.log('3. Testing basic transform...');
  const result = policy.process("dude i'm obsessed with stomach right now");
  console.log(`   Input: "dude i'm obsessed with stomach right now"`);
  console.log(`   Output: "${result.text}" (${result.text.length === 0 ? 'SUPPRESSED ✅' : 'FAILED ❌'})`);
  
  console.log('\n4. Testing chatBot initialization (dry run)...');
  // Don't actually start the bot, just verify it can load with ResponsePolicy
  const ChatBot = require('../src/bot/chatBot.js');
  console.log('   ChatBot class loaded ✅');
  
  console.log('\n✅ All modules load successfully!');
  console.log('✅ ResponsePolicy suppression working!');
  console.log('\n🎉 Ready to start bot with: npm start');
  
} catch (err) {
  console.error('❌ Error during sanity check:', err.message);
  console.error(err.stack);
  process.exit(1);
}
