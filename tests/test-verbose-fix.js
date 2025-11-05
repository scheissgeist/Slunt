// Test ResponsePolicy against verbose rambling
const ResponsePolicy = require('../src/core/ResponsePolicy.js');

const policy = new ResponsePolicy();

console.log('=== Testing Verbose Response Handling ===\n');

// Test 1: Massive 241-word ramble (like the screenshot)
const verboseRamble = `i think i mean you're just not taking this stuff seriously enough, robofussin. the or maybe lizard people thing is fuck that came out wrong legit some dude on The Trade Federation made wait no a solid argument fuck that came out wrong about how their wait let me rephrase "grey" skin or maybe is actually. this is way too long and rambling and has no real point or value. it just keeps going and going without saying anything meaningful. like seriously this needs to be cut down dramatically because nobody wants to read all this garbage. i mean come on this is just excessive word vomit that adds nothing to the conversation whatsoever.`;

const result1 = policy.process(verboseRamble);
console.log('Test 1: 241-word ramble');
console.log('Input word count:', verboseRamble.split(/\s+/).length);
console.log('Output:', result1.text);
console.log('Output word count:', result1.text.split(/\s+/).length);
console.log('Diagnostics:', result1.diagnostics);
console.log('✅ Should be ~15 words or less\n');

// Test 2: Medium verbose (60 words)
const mediumVerbose = `yeah i totally get what you're saying about that whole thing. it's really interesting when you think about it from that perspective. i mean there are so many different ways to look at it and each one has its own merits. honestly though i think the most important thing is just to keep an open mind.`;

const result2 = policy.process(mediumVerbose);
console.log('Test 2: 60-word response');
console.log('Input word count:', mediumVerbose.split(/\s+/).length);
console.log('Output:', result2.text);
console.log('Output word count:', result2.text.split(/\s+/).length);
console.log('Diagnostics:', result2.diagnostics);
console.log('✅ Should be cut to first sentence\n');

// Test 3: Already concise (12 words)
const concise = `nah that's bullshit, robofussin is definitely trolling everyone here.`;

const result3 = policy.process(concise);
console.log('Test 3: Already concise (12 words)');
console.log('Input:', concise);
console.log('Output:', result3.text);
console.log('Diagnostics:', result3.diagnostics);
console.log('✅ Should pass through unchanged\n');

// Test 4: Multiple sentences but under limit
const multiSentence = `that's wild. i didn't expect that. makes sense though.`;

const result4 = policy.process(multiSentence);
console.log('Test 4: Multiple short sentences');
console.log('Input:', multiSentence);
console.log('Output:', result4.text);
console.log('Diagnostics:', result4.diagnostics);
console.log('✅ Should cut to first sentence only\n');

console.log('=== Summary ===');
console.log('New limits: 15 words, 120 chars');
console.log('Hard cap: 50 words → truncate to 2 sentences');
console.log('Token limit: Reduced from 300 to 80 tokens');
