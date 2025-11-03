/**
 * Diagnostic Tool for Slunt's Conversation Quality
 * Run with: node diagnose-conversation.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Slunt\'s Conversation Quality...\n');

// 1. Check log file for errors
console.log('=== LOG ANALYSIS ===');
try {
  const logPath = path.join(__dirname, 'logs', 'slunt.log');
  if (fs.existsSync(logPath)) {
    const logs = fs.readFileSync(logPath, 'utf8');
    const lines = logs.split('\n').slice(-100); // Last 100 lines

    const errors = lines.filter(l => l.includes('ERROR'));
    const warnings = lines.filter(l => l.includes('WARN'));
    const cognitiveErrors = errors.filter(l => l.includes('[Cognition]'));
    const fallbackResponses = lines.filter(l => l.includes('fallback response'));

    console.log(`❌ Total errors: ${errors.length}`);
    console.log(`⚠️  Total warnings: ${warnings.length}`);
    console.log(`🧠 Cognitive errors: ${cognitiveErrors.length}`);
    console.log(`🔄 Fallback responses: ${fallbackResponses.length}`);

    if (cognitiveErrors.length > 0) {
      console.log('\nRecent cognitive errors:');
      cognitiveErrors.slice(-3).forEach(e => console.log(`  - ${e.substring(0, 120)}...`));
    }
  } else {
    console.log('❌ No log file found');
  }
} catch (err) {
  console.error('Error reading logs:', err.message);
}

console.log('\n=== CONVERSATION DATA ANALYSIS ===');

// 2. Check conversation data
try {
  const chatLearningPath = path.join(__dirname, 'data', 'chat_learning.json');
  if (fs.existsSync(chatLearningPath)) {
    const data = JSON.parse(fs.readFileSync(chatLearningPath, 'utf8'));
    console.log(`📚 Learned phrases: ${data.phrases ? data.phrases.length : 0}`);
    console.log(`💬 Response patterns: ${data.responses ? Object.keys(data.responses).length : 0}`);

    // Check for variety
    if (data.phrases && data.phrases.length > 0) {
      const topPhrases = data.phrases.slice(0, 5);
      console.log('\nTop learned phrases:');
      topPhrases.forEach(p => console.log(`  - "${p.phrase}" (${p.count} times)`));
    }
  }
} catch (err) {
  console.error('Error reading chat learning:', err.message);
}

// 3. Check conversation threads
try {
  const threadsPath = path.join(__dirname, 'data', 'conversation_threads.json');
  if (fs.existsSync(threadsPath)) {
    const threads = JSON.parse(fs.readFileSync(threadsPath, 'utf8'));
    const threadCount = Object.keys(threads).length;
    console.log(`\n🧵 Active conversation threads: ${threadCount}`);

    if (threadCount > 0) {
      const recentThread = Object.values(threads)[0];
      if (recentThread && recentThread.turns) {
        console.log(`   Last thread: ${recentThread.turns.length} turns`);
      }
    }
  }
} catch (err) {
  console.error('Error reading threads:', err.message);
}

// 4. Check cognitive state
try {
  const cognitivePath = path.join(__dirname, 'data', 'cognitive_state.json');
  if (fs.existsSync(cognitivePath)) {
    const state = JSON.parse(fs.readFileSync(cognitivePath, 'utf8'));
    console.log(`\n🧠 Cognitive state:`);
    console.log(`   Focus: ${state.focus || 'N/A'}/10`);
    console.log(`   Engagement: ${state.engagement || 'N/A'}/10`);
    console.log(`   Recent thoughts: ${state.thoughts ? state.thoughts.length : 0}`);
  }
} catch (err) {
  console.error('Error reading cognitive state:', err.message);
}

console.log('\n=== RECOMMENDATIONS ===');

// Generate recommendations
const recommendations = [];

try {
  const logPath = path.join(__dirname, 'logs', 'slunt.log');
  if (fs.existsSync(logPath)) {
    const logs = fs.readFileSync(logPath, 'utf8');
    const lines = logs.split('\n').slice(-200);

    if (lines.filter(l => l.includes('[Cognition]') && l.includes('ERROR')).length > 5) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Cognitive engine is crashing frequently',
        fix: 'Add null safety checks in CognitiveEngine.js around line 220'
      });
    }

    if (lines.filter(l => l.includes('fallback response')).length > 10) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Too many fallback responses (low quality)',
        fix: 'AI engine may be down or context is too large'
      });
    }

    if (lines.filter(l => l.includes('Pattern repetitive')).length > 5) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Responses are repetitive',
        fix: 'Increase response variety in ResponseNoveltyChecker.js'
      });
    }

    if (lines.filter(l => l.includes('robotic response')).length > 3) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Responses sound robotic',
        fix: 'Improve naturalness in response enhancement'
      });
    }
  }
} catch (err) {
  console.error('Error analyzing logs:', err.message);
}

if (recommendations.length === 0) {
  console.log('✅ No major issues detected!');
} else {
  recommendations
    .sort((a, b) => (a.priority === 'HIGH' ? -1 : 1))
    .forEach((rec, i) => {
      console.log(`\n${i + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`   Fix: ${rec.fix}`);
    });
}

console.log('\n=== NEXT STEPS ===');
console.log('1. Fix null safety issues in CognitiveEngine.js');
console.log('2. Check if Ollama is running (AI engine)');
console.log('3. Review recent conversations for context issues');
console.log('4. Consider increasing response variety parameters');
console.log('\nRun: npm test -- to verify all systems working');
