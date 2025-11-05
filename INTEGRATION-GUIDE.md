# INTEGRATION GUIDE
## Adding New Features to Slunt

This guide shows how to integrate the new stability and AI features into the main chatBot.js.

---

## STEP 1: Import New Systems

Add these imports to the top of `src/bot/chatBot.js`:

```javascript
// Stability Systems (add after line 60)
const StabilityManager = require('../stability/StabilityManager');
const UserIdentification = require('../services/UserIdentification');

// New AI Features (add after line 94)
const AdaptiveLearning = require('../ai/AdaptiveLearning');
const ProactiveEngagement = require('../ai/ProactiveEngagement');
```

---

## STEP 2: Initialize in Constructor

In the `ChatBot` constructor (around line 200+), add:

```javascript
// Stability Manager - CRITICAL: Initialize first
this.stabilityManager = new StabilityManager();
this.userIdentification = UserIdentification; // Singleton

// New AI Systems
this.adaptiveLearning = new AdaptiveLearning();
this.proactiveEngagement = new ProactiveEngagement(this);
```

---

## STEP 3: Initialize in `async initialize()`

Add to the `initialize()` method (around line 250+):

```javascript
async initialize() {
  logger.info('🤖 Initializing Slunt...');

  // Initialize stability manager FIRST
  await this.stabilityManager.initialize();
  logger.info('✅ Stability systems initialized');

  // Initialize adaptive learning
  await this.adaptiveLearning.loadCorrections();
  logger.info('✅ Adaptive learning initialized');

  // Initialize proactive engagement
  await this.proactiveEngagement.initialize();
  logger.info('✅ Proactive engagement initialized');

  // ... rest of initialization
}
```

---

## STEP 4: Update Message Processing

In the `handleMessage()` method, add correction detection:

```javascript
async handleMessage(message, platform, context = {}) {
  // ... existing code ...

  // Check if this is a correction (NEW)
  const isCorrection = this.adaptiveLearning.isCorrection(message.content, {
    replyToSlunt: message.replyToBot
  });

  if (isCorrection && this.lastSluntMessage) {
    await this.adaptiveLearning.processMessage({
      userId: this.userIdentification.createUserId(platform, message.author),
      username: message.author,
      platform,
      message: message.content,
      previousSluntMessage: this.lastSluntMessage,
      isReplyToSlunt: message.replyToBot
    });

    logger.info(`📚 Learned correction from ${message.author}`);
  }

  // ... continue with existing message processing ...
}
```

---

## STEP 5: Use WriteQueue for All File Writes

Replace all instances of `fs.writeFileSync()` with:

```javascript
// OLD:
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

// NEW:
await this.stabilityManager.getWriteQueue().writeJSON(filePath, data);
```

This prevents file corruption from concurrent writes.

---

## STEP 6: Update User ID References

Everywhere you store or use user IDs, use the new format:

```javascript
// OLD:
const userId = message.author;

// NEW:
const userId = this.userIdentification.createUserId(platform, message.author);
```

---

## STEP 7: Add Graceful Shutdown

In the `shutdown()` method:

```javascript
async shutdown() {
  logger.info('🤖 Shutting down Slunt...');

  // Shutdown new systems
  await this.proactiveEngagement.shutdown();
  await this.adaptiveLearning.saveCorrections();
  await this.stabilityManager.shutdown();

  // ... rest of shutdown ...
}
```

---

## STEP 8: Track Platform Activity

Add platform activity tracking for proactive engagement:

```javascript
class ChatBot extends EventEmitter {
  constructor() {
    // ... existing code ...

    // Track last activity per platform (NEW)
    this.platformActivity = {
      discord: Date.now(),
      twitch: Date.now(),
      coolhole: Date.now()
    };

    this.lastSluntMessage = null; // Track for corrections
  }

  async handleMessage(message, platform, context = {}) {
    // Update activity timestamp
    this.platformActivity[platform] = Date.now();

    // ... rest of message handling ...
  }

  async generateResponse(context) {
    // ... generate response ...

    // Save Slunt's message for correction detection
    this.lastSluntMessage = response;

    return response;
  }
}
```

---

## STEP 9: Run Migration Script

Before starting Slunt with the new changes:

```bash
# Backup your data directory first!
cp -r data data-backup-$(date +%Y%m%d)

# Run migration
node scripts/migrate-user-ids.js

# Check the output - it will show what was migrated
```

---

## STEP 10: Test Integration

Create a test startup script:

```javascript
// test-integration.js
const ChatBot = require('./src/bot/chatBot');

async function test() {
  console.log('Testing integrated Slunt...\n');

  const bot = new ChatBot();

  try {
    await bot.initialize();
    console.log('✅ Initialization successful\n');

    // Test stability manager
    const health = await bot.stabilityManager.getHealthStatus();
    console.log('Health Status:', health);

    // Test adaptive learning stats
    const learningStats = bot.adaptiveLearning.getStats();
    console.log('Learning Stats:', learningStats);

    // Test proactive engagement stats
    const engagementStats = bot.proactiveEngagement.getStats();
    console.log('Engagement Stats:', engagementStats);

    await bot.shutdown();
    console.log('\n✅ Shutdown successful');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
```

Run with:
```bash
node test-integration.js
```

---

## STEP 11: Monitor Performance

After integration, monitor these metrics:

```javascript
// Add to your dashboard or logging
setInterval(async () => {
  const health = await bot.stabilityManager.getHealthStatus();
  const writeStats = bot.stabilityManager.getWriteQueue().getStats();

  console.log('System Health:', {
    healthy: health.healthy,
    issues: health.issues.length,
    warnings: health.warnings.length,
    queuedWrites: writeStats.currentlyQueued,
    avgWaitTime: writeStats.averageWaitTimeMs
  });
}, 60000); // Every minute
```

---

## TROUBLESHOOTING

### Issue: File corruption still happening
**Solution**: Make sure ALL file writes use WriteQueue:
```bash
# Find remaining fs.writeFileSync calls:
grep -r "fs.writeFileSync" src/
```

### Issue: User IDs not being prefixed
**Solution**: Run migration script again and check for errors

### Issue: Proactive engagement not working
**Solution**: Check that platformActivity is being updated:
```javascript
console.log('Platform activity:', bot.platformActivity);
```

### Issue: Memory still growing
**Solution**: Check quota enforcement is running:
```bash
# Check cron jobs are scheduled
node -e "const bot = new (require('./src/bot/chatBot'))(); bot.initialize().then(() => console.log(bot.stabilityManager.cronJobs))"
```

---

## ROLLBACK PLAN

If something goes wrong:

1. **Stop Slunt immediately**
2. **Restore data from backup**:
   ```bash
   rm -rf data
   cp -r data-backup-YYYYMMDD data
   ```
3. **Revert code changes** (git reset or restore old chatBot.js)
4. **Restart Slunt with old code**

---

## VERIFICATION CHECKLIST

Before going live:

- [ ] Migration script ran successfully
- [ ] All tests pass (`npm test`)
- [ ] Test startup successful
- [ ] No file corruption after 10 minutes
- [ ] Memory usage stable
- [ ] Proactive engagement triggers within 10 minutes
- [ ] Corrections are being learned
- [ ] Dashboard shows correct stats
- [ ] Graceful shutdown works
- [ ] Backup created before deployment

---

## PHASED ROLLOUT (RECOMMENDED)

Don't enable everything at once:

### Week 1: Stability Only
- Enable StabilityManager
- Enable WriteQueue
- Enable UserIdentification
- Monitor for issues

### Week 2: Add Learning
- Enable AdaptiveLearning
- Watch correction logs
- Verify corrections are useful

### Week 3: Add Proactive
- Enable ProactiveEngagement
- Start with low engagement chance (0.1)
- Gradually increase if successful

---

## NEXT STEPS

Once integrated and stable:
1. Monitor for 1 week
2. Review correction quality
3. Review proactive engagement success rate
4. Continue implementing Phase 2-9 features
5. Gradually enable new features with feature flags

---

**Questions?** Check logs, review test output, or check the IMPLEMENTATION-ROADMAP.md
