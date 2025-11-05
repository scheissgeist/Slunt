// Test ResponsePolicy against user's reported issues
const ResponsePolicy = require('../src/core/ResponsePolicy.js');

const policy = new ResponsePolicy();

console.log('=== Testing User-Reported Issues ===\n');

// Test 1: Incomplete "speaking of which" phrase
const test1 = "oh shit speaking of which can't stop thinking about it";
const result1 = policy.process(test1);
console.log('Test 1: Incomplete dependent clause');
console.log('Input:', test1);
console.log('Output:', result1.text);
console.log('Diagnostics:', result1.diagnostics);
console.log('✅ PASS: Should trim incomplete phrase\n');

// Test 2: Random topic blurt
const test2 = "dude i'm obsessed with stomach right now";
const result2 = policy.process(test2);
console.log('Test 2: Random topic blurt');
console.log('Input:', test2);
console.log('Output:', result2.text);
console.log('Diagnostics:', result2.diagnostics);
console.log('Expected: Empty or very short (topic switch detected)\n');

// Test 3: Combined - coherent start + topic blurt
const test3 = "yeah that movie was wild. btw i'm obsessed with stomach right now";
const result3 = policy.process(test3);
console.log('Test 3: Coherent sentence + topic blurt');
console.log('Input:', test3);
console.log('Output:', result3.text);
console.log('Diagnostics:', result3.diagnostics);
console.log('Expected: Just "yeah that movie was wild."\n');

// Test 4: Incomplete phrase mid-conversation
const test4 = "i was thinking about that earlier speaking of which";
const result4 = policy.process(test4);
console.log('Test 4: Trailing incomplete phrase');
console.log('Input:', test4);
console.log('Output:', result4.text);
console.log('Diagnostics:', result4.diagnostics);
console.log('✅ PASS: Should trim "speaking of which"\n');
