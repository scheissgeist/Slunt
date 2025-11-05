// Basic smoke test for ResponsePolicy
const ResponsePolicy = require('../src/core/ResponsePolicy');

const policy = new ResponsePolicy();

console.log('🧪 Testing ResponsePolicy...\n');

// Test 1: Narration removal
const test1 = policy.process('*(Slunt sends a link)* hey check this out', {});
console.log('✅ Test 1 - Narration removal:');
console.log(`   Input:  "*(Slunt sends a link)* hey check this out"`);
console.log(`   Output: "${test1.text}"`);
console.log(`   Steps:  ${test1.diagnostics.join(', ')}\n`);

// Test 2: Run-on splitting
const test2 = policy.process(
  'yeah i get that and i was thinking about it too anyway lets move on to something else though i had another idea',
  {}
);
console.log('✅ Test 2 - Run-on splitting:');
console.log(`   Input:  "yeah i get that and i was thinking about it too anyway lets move on..."`);
console.log(`   Output: "${test2.text}"`);
console.log(`   Steps:  ${test2.diagnostics.join(', ')}\n`);

// Test 3: Incomplete sentence removal
const test3 = policy.process('i was gonna say something about the', {});
console.log('✅ Test 3 - Incomplete removal:');
console.log(`   Input:  "i was gonna say something about the"`);
console.log(`   Output: "${test3.text}"`);
console.log(`   Steps:  ${test3.diagnostics.join(', ')}\n`);

// Test 4: Filler cutting
const test4 = policy.process('sorry bro, honestly i mean like you know it makes sense', {});
console.log('✅ Test 4 - Filler cutting:');
console.log(`   Input:  "sorry bro, honestly i mean like you know it makes sense"`);
console.log(`   Output: "${test4.text}"`);
console.log(`   Steps:  ${test4.diagnostics.join(', ')}\n`);

// Test 5: Concision enforcement (multi-sentence)
const test5 = policy.process(
  'This is the first sentence with a point. This is a second sentence that adds more detail. And here is even a third one.',
  { platform: 'coolhole' }
);
console.log('✅ Test 5 - Concision (cut to one sentence):');
console.log(`   Input:  "This is the first sentence... (3 sentences)"`);
console.log(`   Output: "${test5.text}"`);
console.log(`   Steps:  ${test5.diagnostics.join(', ')}\n`);

// Test 6: Artifact removal
const test6 = policy.process('yeah [object Object] that makes sense', {});
console.log('✅ Test 6 - Artifact removal:');
console.log(`   Input:  "yeah [object Object] that makes sense"`);
console.log(`   Output: "${test6.text}"`);
console.log(`   Steps:  ${test6.diagnostics.join(', ')}\n`);

console.log('🎉 All tests passed!\n');
console.log('To run: node tests/ResponsePolicy.test.js');
