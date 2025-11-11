# Inner AI & User Stats Features

## 🧠 Inner AI Monitoring System

A self-monitoring system that validates response quality and tracks system health.

### What It Does

**Response Validation:**
- Checks for empty/too short/too long responses
- Detects repetitive word patterns (catches when AI gets stuck)
- Flags corporate AI language ("as an AI", "I apologize", "I cannot")
- Detects placeholder text ([brackets], {curly braces}, ...)
- Warns about excessive punctuation!!!
- Compares against recent responses to avoid repetition
- If response fails validation, automatically attempts regeneration

**Error Tracking:**
- Logs all errors with context
- Detects error spikes (5+ errors in 5 minutes)
- Diagnoses common issues:
  - Network/API connection problems
  - Code errors (TypeError, ReferenceError)
  - Timeout/performance issues

**Health Monitoring:**
- Periodic health checks every 1 minute
- Monitors error rate
- Tracks response quality (warns if below 80%)
- Checks memory usage (warns if over 500MB)

### Implementation

```javascript
// Inner AI validates every response before sending
const validation = this.innerAI.validateResponse(username, message, finalResponse);

if (!validation.valid) {
  // Response rejected - auto-regenerate
  return this.generateResponse(username, message, channelId, platform, context);
}

// Quality score: 0.0 (terrible) to 1.0 (perfect)
console.log(`Response quality: ${validation.quality}`);
```

### Diagnostics

Get system diagnostics anytime:
```javascript
const diagnostics = chatBot.innerAI.getDiagnostics();
// Returns: recent errors, recent responses, health status, uptime, memory usage
```

---

## 📊 User Stats Query System

Users can now ask Slunt about his relationship with other users.

### Query Examples

Natural language queries that work:

- "Slunt, what is your relationship with Huculberry?"
- "Slunt, how many interactions with Batman?"
- "Slunt, what do you think of scheissgeist?"
- "Slunt, tell me about your relationship with broteam"
- "Slunt, how strong is your relationship with Oney?"
- "Slunt, what do you know about CodyCantEatThis?"

### Response Format

Slunt returns comprehensive stats:

```
📊 STATS FOR HUCULBERRY

Nickname: Berry (or none)
Relationship: friend
Interactions: 287
Platforms: coolhole, discord
Known since: 8/15/2024
Last seen: 2h ago

COMMUNICATION STYLE:
  Roasting: 85% (high)
  Serious mode: 30% (low)
  Conspiracies: 65% (medium)
  Vulgarity: 90% (high)

VIBE: chaos energy
TRAITS: conspiracy theorist, vulgar dude

SHARED MOMENTS:
  • That time we roasted the government shills
  • Deep talk about simulation theory
  • Epic fail compilation viewing
```

### Data Tracked

For each user, Slunt tracks:
- **Basic Stats:** Interactions count, platforms, first met, last seen
- **Relationship Tier:** stranger → acquaintance → friend → close
- **Communication Style:** What works with them (0-100%):
  - Roasting tolerance
  - Serious mode preference
  - Conspiracy interest
  - Vulgarity comfort
- **Personality:** Vibe, notable traits, shared experiences
- **Memory:** Recent callbacks and memorable moments

### Privacy

- Only Slunt can share stats (uses his observations)
- Stats are based on real interactions
- Users can query about other users, not themselves
- Cannot query "what does Slunt think of Slunt" (blocked)

---

## 🔧 Technical Details

### Files Modified

1. **src/monitoring/innerAI.js** (NEW)
   - Response validation logic
   - Error tracking and diagnosis
   - Health monitoring system
   - Quality scoring algorithm

2. **src/core/memoryCore.js**
   - `getUserStats(username)` - Get comprehensive stats object
   - `formatUserStats(username)` - Format stats as readable text
   - Helper methods: `formatTimestamp()`, `formatPercentage()`

3. **src/bot/chatBot.js**
   - `detectStatsQuery(message)` - Parse natural language stats queries
   - InnerAI initialization and integration
   - Response validation before sending
   - Error logging to InnerAI

### Configuration

No configuration needed - works out of the box!

Inner AI thresholds (can be adjusted in innerAI.js):
```javascript
minResponseLength: 5,
maxResponseLength: 500,
maxRepetitionRatio: 0.7,  // 70%+ repetition triggers warning
errorThreshold: 5,        // 5 errors in 5min triggers alert
healthCheckInterval: 60000 // 1 minute
```

---

## 🎯 Use Cases

**Inner AI:**
- Catches bad responses before they're sent
- Alerts when system is degraded
- Prevents repetitive/low-quality responses
- Provides diagnostics for debugging

**User Stats:**
- Users ask about relationships between community members
- Slunt shares his observations transparently
- Shows how relationships evolve over time
- Demonstrates learning and memory capabilities

---

## 🚀 Next Steps

Both systems are fully integrated and will be active on next Slunt restart.

**To restart Slunt:**
```powershell
# Stop current instance (Ctrl+C)
# Then restart:
npm start
```

**To test:**
1. Inner AI - watch logs for validation messages
2. User Stats - ask "Slunt, what is your relationship with [username]?"
