# CORE SYSTEMS INTEGRATION GUIDE

## 🎯 What Changed

We've consolidated **43+ scattered AI systems** into **4 clean core systems**:

1. ✅ **BehaviorModifiers** - Personality state computation (replaces 15+ systems)
2. ✅ **MemoryCore** - User knowledge, topics, context (replaces 12+ systems)
3. ✅ **RelationshipCore** - Social dynamics (replaces 8+ systems)
4. ✅ **ResponseShaper** - Cleanup and platform styling (consolidates cleanup)

## 📊 Impact

### Before (43+ Systems)
```
Text Chat Context: 2,600-3,000 chars
Voice Context: 450-500 chars (all systems disabled)
Code: 7,848 lines in chatBot.js
Maintenance: 43+ files to update
```

### After (4 Core Systems)
```
Text Chat Context: 400-800 chars (60-70% reduction)
Voice Context: 200-350 chars (30% improvement from current fix)
Code: ~3,000 lines total across core systems
Maintenance: 4 files to update
```

## 🚀 How to Use

### Step 1: Enable Core Systems

Add to your `.env`:
```
USE_CORE_SYSTEMS=true
```

Or set in code (chatBot.js):
```javascript
const USE_CORE_SYSTEMS = process.env.USE_CORE_SYSTEMS === 'true';
```

### Step 2: Initialize (in chatBot.js)

```javascript
// At top of file
const BehaviorModifiers = require('./core/behaviorModifiers');
const MemoryCore = require('./core/memoryCore');
const RelationshipCore = require('./core/relationshipCore');
const ResponseShaper = require('./core/responseShaper');

// In initialization
const memoryCore = new MemoryCore();
await memoryCore.initialize();
memoryCore.startAutoSave();

const relationshipCore = new RelationshipCore(memoryCore);
const responseShaper = new ResponseShaper();
```

### Step 3: Replace Old Context Building

**OLD WAY (43+ systems):**
```javascript
// Build enhancement context
if (platform !== 'voice') {
  // 14 Enhancement systems
  const dynamicStyle = await enhancementSystem.getDynamicStyle(...);
  context += dynamicStyle;
  
  // 10 Comprehensive systems
  const relationshipEvolution = await comprehensiveSystem.getRelationshipEvolution(...);
  context += relationshipEvolution;
  
  // ... 40 more system calls ...
  // Result: 2,600-3,000 chars
}
```

**NEW WAY (4 systems):**
```javascript
if (USE_CORE_SYSTEMS) {
  // 1. Get relevant memory context
  const memoryContext = memoryCore.getRelevantContext({
    platform,
    username,
    message: userMessage,
    maxChars: platform === 'voice' ? 150 : 300
  });
  
  // 2. Update memory from this interaction
  memoryCore.addToContext(platform, username, userMessage, false);
  memoryCore.updateUser(username, platform, userMessage);
  
  // 3. Get relationship modifiers
  const relationship = relationshipCore.getModifiers(username, userMessage);
  
  // 4. Compute behavior state
  const behaviorState = BehaviorModifiers.computeState({
    relationship: memoryCore.getUser(username),
    mentalState: { tired: false, stressed: false, bored: false },
    timeOfDay: new Date().getHours(),
    platform,
    topic: memoryCore.getCurrentTopic(platform),
    recentMessages: memoryCore.getRecentContext(platform, 3)
  });
  
  // 5. Build minimal context
  const contextParts = [];
  
  if (memoryContext) contextParts.push(memoryContext);
  
  const behaviorCtx = BehaviorModifiers.toContextString(behaviorState);
  if (behaviorCtx) contextParts.push(behaviorCtx);
  
  const relationshipCtx = relationshipCore.toContextString(username, userMessage);
  if (relationshipCtx) contextParts.push(relationshipCtx);
  
  context = contextParts.join('\n');
  
  logger.info(`✨ [CoreSystems] Built context: ${context.length} chars (Memory: ${memoryContext.length}, Behavior: ${behaviorCtx.length}, Relationship: ${relationshipCtx.length})`);
  
} else {
  // OLD SYSTEM (fallback)
  // ... existing 43+ system code ...
}
```

### Step 4: Apply Behavior Modifiers to Generation

```javascript
// After building context, before calling AI
if (USE_CORE_SYSTEMS && behaviorState) {
  // Modify generation parameters based on state
  const modifiedParams = BehaviorModifiers.applyToGenerationParams(behaviorState, {
    temperature: 0.85,
    top_p: 0.95,
    top_k: 50,
    max_tokens: 100
  });
  
  // Use modified params in AI call
  const response = await aiEngine.generate({
    ...modifiedParams,
    prompt: context + userMessage
  });
}
```

### Step 5: Shape Response

```javascript
// After getting AI response
if (USE_CORE_SYSTEMS) {
  const shaped = responseShaper.shape(
    rawResponse,
    platform,
    behaviorState
  );
  
  if (!shaped) {
    // Response was rejected (stop sequence/invalid), regenerate
    logger.warn('⚠️ Response rejected by shaper, regenerating...');
    // ... regeneration logic ...
  } else {
    finalResponse = shaped;
  }
  
  // Update memory with Slunt's response
  memoryCore.addToContext(platform, username, finalResponse, true);
  
  // Learn from interaction
  relationshipCore.learnFromInteraction(username, finalResponse);
}
```

## 📝 Example: Full Message Flow

```javascript
async function handleMessage(platform, username, userMessage) {
  if (USE_CORE_SYSTEMS) {
    // 1. Get memory context
    const memoryContext = memoryCore.getRelevantContext({
      platform,
      username,
      message: userMessage,
      maxChars: platform === 'voice' ? 150 : 300
    });
    
    // 2. Update memory
    memoryCore.addToContext(platform, username, userMessage, false);
    memoryCore.updateUser(username, platform, userMessage);
    
    // 3. Get relationship
    const relationship = relationshipCore.getModifiers(username, userMessage);
    
    // 4. Compute behavior
    const behaviorState = BehaviorModifiers.computeState({
      relationship: memoryCore.getUser(username),
      mentalState: getCurrentMentalState(),
      timeOfDay: new Date().getHours(),
      platform,
      topic: memoryCore.getCurrentTopic(platform)
    });
    
    // 5. Build context
    const context = [
      memoryContext,
      BehaviorModifiers.toContextString(behaviorState),
      relationshipCore.toContextString(username, userMessage)
    ].filter(Boolean).join('\n');
    
    // 6. Generate with modified params
    const params = BehaviorModifiers.applyToGenerationParams(behaviorState, baseParams);
    const rawResponse = await aiEngine.generate({
      ...params,
      context,
      message: userMessage
    });
    
    // 7. Shape response
    const finalResponse = responseShaper.shape(rawResponse, platform, behaviorState);
    
    if (!finalResponse) {
      // Regenerate
      return handleMessage(platform, username, userMessage);
    }
    
    // 8. Learn from interaction
    memoryCore.addToContext(platform, username, finalResponse, true);
    relationshipCore.learnFromInteraction(username, finalResponse);
    
    return finalResponse;
  } else {
    // OLD SYSTEM
    // ... existing code ...
  }
}
```

## 🎯 Context Size Targets

| Platform | OLD System | NEW System | Improvement |
|----------|-----------|-----------|-------------|
| Voice | 450-500 chars* | 200-350 chars | 30-40% |
| Coolhole | 2,600 chars | 400-600 chars | 77% |
| Discord | 2,800 chars | 500-800 chars | 71% |
| Twitch | 2,600 chars | 400-700 chars | 73% |

*Voice was already optimized with system disabling

## 🔧 Migration Plan

### Phase 1: Parallel Testing (Day 1-3)
- [ ] Set `USE_CORE_SYSTEMS=true` for **voice only**
- [ ] Test extensively with voice conversations
- [ ] Compare against old system (both should work)
- [ ] Measure: context size, response quality, speed

### Phase 2: Expand to Coolhole (Day 4-7)
- [ ] Enable for Coolhole if voice tests successful
- [ ] Monitor user reactions, conversation quality
- [ ] Adjust behavior modifiers if needed
- [ ] Keep Discord/Twitch on old system

### Phase 3: Full Migration (Day 8-14)
- [ ] Enable for all platforms
- [ ] Monitor for any personality regressions
- [ ] Fine-tune memory relevance thresholds
- [ ] Collect metrics on performance

### Phase 4: Cleanup (Day 15+)
- [ ] Once stable, remove old system code
- [ ] Delete 43+ system files
- [ ] Update documentation
- [ ] Celebrate 🎉

## 🚨 Rollback Plan

If something breaks:

1. **Instant Rollback**: Set `USE_CORE_SYSTEMS=false`
2. **Per-Platform Rollback**: Wrap in platform checks
   ```javascript
   const USE_CORE_FOR_VOICE = process.env.USE_CORE_FOR_VOICE === 'true';
   if (platform === 'voice' && USE_CORE_FOR_VOICE) {
     // Core systems
   } else {
     // Old systems
   }
   ```

## 🎛️ Tuning Guide

### Personality Too Vulgar?
```javascript
// In behaviorModifiers.js
BASE_PERSONALITY.vulgarity = 0.6; // Down from 0.8
```

### Not Engaging Enough?
```javascript
BASE_PERSONALITY.engagement = 0.9; // Up from 0.8
```

### Memory Too Sparse?
```javascript
// In memoryCore.js getRelevantContext()
const recentChars = Math.floor(remaining * 0.7); // Up from 0.6
```

### Responses Too Long?
```javascript
// In responseShaper.js
this.platformSettings.voice.maxWords = 8; // Down from 12
```

## 📊 Success Metrics

Monitor these after migration:

1. **Context Size**: Should drop 60-70%
2. **Response Speed**: Should improve 20-30%
3. **Personality Consistency**: User feedback
4. **Callback Usage**: Should work (check logs)
5. **Topic Expertise**: Should remember topics
6. **Relationship Progression**: Should learn what works

## 🐛 Troubleshooting

### "Context is too short"
- Increase `maxChars` in `getRelevantContext()` call
- Check if memory is loading properly (logs)

### "Personality feels flat"
- Check behavior modifiers are being applied
- Verify relationship core is returning modifiers
- Tune BASE_PERSONALITY values

### "Not remembering users"
- Check `memoryCore.save()` is being called
- Verify `data/memory/memoryCore.json` exists
- Check `updateUser()` is being called after each message

### "Callbacks not working"
- Verify `addCallback()` is being called
- Check callback age threshold (currently 1 day minimum)
- Look for "remember when" in logs

## 🎉 What You Gain

- ✅ **60-70% less context** = faster, more focused responses
- ✅ **4 files to maintain** instead of 43+
- ✅ **Cleaner code** = easier to understand and modify
- ✅ **Same personality** = all features preserved
- ✅ **Better performance** = less processing overhead
- ✅ **Easier testing** = isolated systems
- ✅ **Gradual migration** = safe rollback at any time

## 🚀 Ready to Deploy?

1. Copy this file to your project root
2. Set `USE_CORE_SYSTEMS=true` in .env (or start with voice only)
3. Restart Slunt
4. Monitor logs for `[CoreSystems]` entries
5. Test conversations
6. Compare context sizes (should be way smaller)
7. If issues, set `USE_CORE_SYSTEMS=false` and report

---

**Need Help?** Check logs for detailed system output:
- `🧠 [MemoryCore]` - Memory operations
- `🤝 [RelationshipCore]` - Social dynamics
- `🎭 [BehaviorModifiers]` - State computation
- `✂️ [ResponseShaper]` - Cleanup and shaping
- `✨ [CoreSystems]` - Integration messages
