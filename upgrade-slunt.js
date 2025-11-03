/**
 * Slunt Conversation Quality Upgrade Script
 * Run with: node upgrade-slunt.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log('🚀 Upgrading Slunt\'s Conversation Quality...\n');

async function checkOllamaStatus() {
  try {
    await execAsync('curl -s http://localhost:11434/api/tags');
    console.log('✅ Ollama is running');
    return true;
  } catch (err) {
    console.log('❌ Ollama is not running');
    console.log('   Start it with: ollama serve');
    return false;
  }
}

async function listModels() {
  try {
    const { stdout } = await execAsync('ollama list');
    console.log('\n📦 Installed Models:');
    console.log(stdout);
    return stdout;
  } catch (err) {
    console.log('❌ Could not list models');
    return '';
  }
}

async function checkCurrentModel() {
  const fs = require('fs');
  const path = require('path');
  const aiEnginePath = path.join(__dirname, 'src', 'ai', 'aiEngine.js');

  try {
    const content = fs.readFileSync(aiEnginePath, 'utf8');
    const modelMatch = content.match(/this\.model = ['"]([^'"]+)['"]/);

    if (modelMatch) {
      const currentModel = modelMatch[1];
      console.log(`\n🤖 Current Model: ${currentModel}`);

      if (currentModel.includes('1b')) {
        console.log('   ⚠️  WARNING: 1B model is too small for good conversation');
        console.log('   📈 Recommendation: Upgrade to 3.2B or 8B');
        return { model: currentModel, needsUpgrade: true };
      } else if (currentModel.includes('3b') || currentModel.includes('3.2')) {
        console.log('   ✅ 3.2B model - decent quality');
        console.log('   💡 Optional: Upgrade to 8B for even better results');
        return { model: currentModel, needsUpgrade: false };
      } else if (currentModel.includes('8b') || currentModel.includes('7b')) {
        console.log('   ✅ Great model choice!');
        return { model: currentModel, needsUpgrade: false };
      }
    }

    return { model: 'unknown', needsUpgrade: true };
  } catch (err) {
    console.log('❌ Could not read aiEngine.js');
    return { model: 'unknown', needsUpgrade: true };
  }
}

async function recommendUpgrade(installedModels) {
  console.log('\n💡 Upgrade Recommendations:\n');

  const has3b = installedModels.includes('llama3.2:latest') || installedModels.includes('3b');
  const has8b = installedModels.includes('llama3.1:8b') || installedModels.includes('8b');

  if (has8b) {
    console.log('✅ You already have an 8B model! (Best choice)');
    console.log('   Edit aiEngine.js line 23 to use: llama3.1:8b');
  } else if (has3b) {
    console.log('✅ Quick win: Use llama3.2:latest (already installed)');
    console.log('   Edit aiEngine.js line 23 to use: llama3.2:latest');
    console.log('');
    console.log('💎 Better option: Download 8B model');
    console.log('   Run: ollama pull llama3.1:8b');
    console.log('   Then edit aiEngine.js to use: llama3.1:8b');
  } else {
    console.log('📥 Download recommended models:\n');
    console.log('   Option 1 (Good, Fast):');
    console.log('   ollama pull llama3.2:3b');
    console.log('');
    console.log('   Option 2 (Better, Still Fast):');
    console.log('   ollama pull llama3.1:8b  ⭐ RECOMMENDED');
    console.log('');
    console.log('   Option 3 (Best, Slower):');
    console.log('   ollama pull llama3.3:70b  (requires 48GB+ RAM)');
  }
}

async function testConversation() {
  console.log('\n🧪 Testing conversation quality...');

  const testPrompts = [
    "what do you think about that?",
    "have you seen the new video?",
    "why is the sky blue?"
  ];

  // This would require importing the AI engine
  // For now, just show what to expect
  console.log('\n📝 Expected improvements with better model:');
  console.log('');
  console.log('  1B model: "could be" or "yeah" (dumb)');
  console.log('  3B model: "honestly it\'s pretty interesting" (better)');
  console.log('  8B model: "honestly it\'s wild when you think about it, like the whole thing doesn\'t make sense but somehow it works" (great)');
}

async function showStats() {
  const fs = require('fs');
  const path = require('path');

  console.log('\n📊 Recent Performance Stats:');

  try {
    const logPath = path.join(__dirname, 'logs', 'slunt.log');
    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf8');
      const lines = logs.split('\n').slice(-500);

      const cognitiveErrors = lines.filter(l => l.includes('[Cognition]') && l.includes('ERROR')).length;
      const fallbacks = lines.filter(l => l.includes('fallback response')).length;
      const aiResponses = lines.filter(l => l.includes('Using AI response')).length;

      console.log(`   Cognitive Errors: ${cognitiveErrors}`);
      console.log(`   Fallback Responses: ${fallbacks}`);
      console.log(`   AI Responses: ${aiResponses}`);
      console.log(`   Success Rate: ${Math.round((aiResponses / (aiResponses + fallbacks)) * 100)}%`);

      if (cognitiveErrors > 5) {
        console.log('   ⚠️  High error rate - check cognitive engine');
      }
      if (fallbacks > 10) {
        console.log('   ⚠️  Too many fallbacks - AI may be struggling');
      }
    }
  } catch (err) {
    console.log('   Could not read stats');
  }
}

// Main execution
(async () => {
  const ollamaRunning = await checkOllamaStatus();

  if (!ollamaRunning) {
    console.log('\n❌ Cannot proceed without Ollama');
    console.log('   Start it first: ollama serve');
    process.exit(1);
  }

  const modelList = await listModels();
  const current = await checkCurrentModel();
  await showStats();
  await recommendUpgrade(modelList);
  await testConversation();

  console.log('\n🎯 Next Steps:\n');

  if (current.needsUpgrade) {
    console.log('1. Choose a better model (see recommendations above)');
    console.log('2. Download it: ollama pull <model-name>');
    console.log('3. Edit src/ai/aiEngine.js line 23');
    console.log('4. Change: this.model = \'<model-name>\'');
    console.log('5. Restart Slunt: npm start');
  } else {
    console.log('1. Model is already decent!');
    console.log('2. Check logs for errors: tail -f logs/slunt.log');
    console.log('3. Run diagnostic: node diagnose-conversation.js');
    console.log('4. Optional: Upgrade to 8B for even better quality');
  }

  console.log('\n📚 Documentation:');
  console.log('   - MODEL-UPGRADE-GUIDE.md');
  console.log('   - CONVERSATION-FIXES-APPLIED.md');
  console.log('   - diagnose-conversation.js');

})();
