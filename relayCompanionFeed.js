// relayCompanionFeed.js
// Instantly and constantly relays SluntCompanion output to this console

const { spawn } = require('child_process');
const path = require('path');

const companionPath = path.resolve(__dirname, 'SluntCompanion.js');

const companion = spawn('node', [companionPath], {
  stdio: ['ignore', 'pipe', 'pipe']
});

companion.stdout.on('data', (data) => {
  process.stdout.write(`[Companion Feed] ${data}`);
});

companion.stderr.on('data', (data) => {
  process.stderr.write(`[Companion Error] ${data}`);
});

companion.on('close', (code) => {
  console.log(`[Companion Feed] SluntCompanion exited with code ${code}`);
});

console.log('relayCompanionFeed.js is now relaying SluntCompanion output instantly and constantly.');
