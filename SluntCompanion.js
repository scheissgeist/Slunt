// SluntCompanion.js
// Watches Slunt's log file and reports errors in real time

const fs = require('fs');
const path = require('path');

const LOG_PATH = path.resolve(__dirname, 'logs', 'slunt.log'); // Adjust path as needed

function tailFile(filePath, onLine) {
  let fileSize = 0;
  fs.watchFile(filePath, { interval: 1000 }, () => {
    fs.stat(filePath, (err, stats) => {
      if (err) return;
      if (stats.size > fileSize) {
        const stream = fs.createReadStream(filePath, {
          start: fileSize,
          end: stats.size
        });
        let buffer = '';
        stream.on('data', chunk => {
          buffer += chunk.toString();
          let lines = buffer.split(/\r?\n/);
          buffer = lines.pop();
          lines.forEach(onLine);
        });
        stream.on('end', () => {
          fileSize = stats.size;
        });
      }
    });
  });
}



function suggestFix(message) {
  // Remove trailing words
  let fixed = message.replace(/(\s+(just saying|ya know|you|so|but|though|and|or|fr|bruh|lowkey))?\s*$/i, '.');
  // Remove off-topic phrases (example: Gaza, Slovenia)
  fixed = fixed.replace(/\b(Gaza|Slovenia|Palestine|Israel|Balkans|Yugoslavia|Serbia|Croatia|Bosnia|Kosovo|Jerusalem|Middle East)\b/gi, '[off-topic]');
  // Remove excessive punctuation
  fixed = fixed.replace(/\.{2,}/g, '.');

  const fs = require('fs');
  const path = require('path');

  const LOG_PATH = path.resolve(__dirname, 'logs', 'slunt.log'); // Adjust path as needed

  let errorCount = 0;
  let suggestionCount = 0;
  let lastSuggestions = [];
  let lastErrors = [];

  function tailFile(filePath, onLine) {
    let fileSize = 0;
    fs.watchFile(filePath, { interval: 1000 }, () => {
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (stats.size > fileSize) {
          const stream = fs.createReadStream(filePath, {
            start: fileSize,
            end: stats.size
          });
          let buffer = '';
          stream.on('data', chunk => {
            buffer += chunk.toString();
            let lines = buffer.split(/\r?\n/);
            buffer = lines.pop();
            lines.forEach(onLine);
          });
          stream.on('end', () => {
            fileSize = stats.size;
          });
        }
      });
    });
  }

  function suggestFix(message) {
    let fixed = message.replace(/(\s+(just saying|ya know|you|so|but|though|and|or|fr|bruh|lowkey))?\s*$/i, '.');
    fixed = fixed.replace(/\b(Gaza|Slovenia|Palestine|Israel|Balkans|Yugoslavia|Serbia|Croatia|Bosnia|Kosovo|Jerusalem|Middle East)\b/gi, '[off-topic]');
    fixed = fixed.replace(/\.{2,}/g, '.');
    fixed = fixed.replace(/\s+(so|but|though|and|or)\s*$/i, '.');
    return fixed.trim();
  }

  function reportLine(line) {
    if (/error|fail|exception|critical|fatal/i.test(line)) {
      errorCount++;
      lastErrors.push(line);
      if (lastErrors.length > 10) lastErrors.shift();
      console.log(`[Companion] Detected error: ${line}`);
    }
    const match = line.match(/\[ChatBot\] Slunt: (.+)/);
    if (match) {
      const message = match[1];
      const fixed = suggestFix(message);
      if (fixed !== message) {
        suggestionCount++;
        lastSuggestions.push({ original: message, suggestion: fixed });
        if (lastSuggestions.length > 10) lastSuggestions.shift();
        console.log(`[Companion] Suggestion: "${fixed}" (was: "${message}")`);
      }
    }
  }

  function printReport() {
    console.log('\n========== SluntCompanion Report ==========');
    console.log(`Total errors detected: ${errorCount}`);
    console.log(`Total suggestions made: ${suggestionCount}`);
    if (lastErrors.length) {
      console.log('Recent errors:');
      lastErrors.forEach(e => console.log('  - ' + e));
    }
    if (lastSuggestions.length) {
      console.log('Recent suggestions:');
      lastSuggestions.forEach(s => console.log(`  - "${s.suggestion}" (was: "${s.original}")`));
    }
    console.log('===========================================\n');
  }

  console.log('SluntCompanion is tracking Slunt messages and suggesting fixes...');
  tailFile(LOG_PATH, reportLine);

  // Print a robust report every 5 minutes
  setInterval(printReport, 5 * 60 * 1000);
