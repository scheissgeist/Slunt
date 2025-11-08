# 📊 Beta Analytics - Track Everything

**Purpose:** Capture all conversation data so Claude can analyze and improve Slunt

---

## 🎯 What Gets Tracked

### Every Minute:
- ✅ Total messages received
- ✅ Total responses sent
- ✅ Response rate (%)
- ✅ Average response time (ms)
- ✅ Context hit rate (%)
- ✅ Topic continuity (%)
- ✅ Per-platform stats (Coolhole, Discord, Twitch)

### Every Conversation:
- ✅ Full message history (JSONL format)
- ✅ Response decisions (respond/skip + reason)
- ✅ Context used for each response
- ✅ Timing data
- ✅ Platform info

---

## 📂 Where Data is Stored

```
data/beta_analytics/
├── sessions/
│   ├── session_1699465200000.jsonl  (all events)
│   ├── session_1699465800000.jsonl
│   └── ...
└── metrics.json  (current snapshot)
```

### Session Files (JSONL):
Each line is a JSON event:
```json
{"type":"message","timestamp":1699465200000,"username":"user1","text":"hey slunt","platform":"coolhole"}
{"type":"decision","timestamp":1699465200100,"username":"user1","decision":"respond","reason":"mentioned"}
{"type":"response","timestamp":1699465200500,"username":"user1","response":"what's good","responseTime":400}
```

### Metrics File (JSON):
Current session snapshot saved every minute:
```json
{
  "sessionId": 1699465200000,
  "totalMessages": 150,
  "totalResponses": 45,
  "avgResponseTime": 412,
  "contextHitRate": "85%",
  "topicContinuityRate": "72%",
  "platforms": {
    "coolhole": { "messages": 100, "responses": 30 },
    "discord": { "messages": 50, "responses": 15 }
  }
}
```

---

## 📊 Live Stats in Chat

### Command: `!betastats` or `!stats`

**Example output:**
```
📊 Beta Stats: 150 msg, 45 resp (30%), Avg: 412ms, Context: 85%, Continuity: 72%
```

### Command: In Terminal (Every 60 seconds)

```
📊 ===== BETA ANALYTICS STATS =====
Session: 1699465200000 (23 minutes)
Messages: 150 | Responses: 45 (30%)
Avg Response Time: 412ms
Context Hit Rate: 85%
Topic Continuity: 72%
Platforms:
  coolhole: 100 msg, 30 resp
  discord: 50 msg, 15 resp
  twitch: 0 msg, 0 resp
====================================
```

---

## 🔍 What Claude Can Analyze

### 1. Response Time Performance
**Question:** Is Beta actually faster than Alpha?
**Data:** `avgResponseTime` in metrics.json
**Goal:** <500ms average (Alpha was 2000-3000ms)

### 2. Context Usage
**Question:** Is Slunt using recent messages effectively?
**Data:** `contextHitRate` - % of responses that reference recent context
**Goal:** >80% hit rate

### 3. Topic Continuity
**Question:** Does Slunt stay on topic across multiple messages?
**Data:** `topicContinuityRate` - % of conversations that maintain topic
**Goal:** >70% continuity

### 4. Response Rate
**Question:** Is Slunt responding enough/too much?
**Data:** `responseRate` - % of messages that get responses
**Expected:** ~30-50% (40% base probability)

### 5. Platform Differences
**Question:** Does Slunt perform differently on different platforms?
**Data:** Per-platform stats in metrics
**Compare:** Coolhole vs Discord vs Twitch

---

## 🧪 Analysis Workflow

### After Testing Session:

1. **Share metrics.json with Claude:**
```bash
cat data/beta_analytics/metrics.json
```

2. **Share recent session log:**
```bash
# Last 50 events
tail -50 data/beta_analytics/sessions/session_*.jsonl
```

3. **Claude analyzes:**
- Is response time <500ms? ✓/✗
- Is context being used? ✓/✗
- Are topics maintained? ✓/✗
- Any patterns in skipped messages?
- Any platform-specific issues?

4. **Iterate:**
- If context hit rate low → increase context window (5 → 10 messages)
- If response time high → optimize prompt or use faster model
- If topic continuity low → add topic tracking
- If response rate wrong → adjust probability

---

## 📈 Key Metrics Explained

### avgResponseTime
**What:** Average milliseconds from user message to Slunt response
**Good:** <500ms (Beta goal)
**Bad:** >1000ms (Alpha territory)
**How to improve:** Optimize prompt length, use faster model

### contextHitRate
**What:** % of responses that actually use recent conversation context
**Good:** >80% (most responses reference what was said)
**Bad:** <50% (Slunt ignoring context)
**How to improve:** Increase context window, better prompt instructions

### topicContinuityRate
**What:** % of multi-message conversations that stay on same topic
**Good:** >70% (maintains conversation flow)
**Bad:** <40% (random topic switches)
**How to improve:** Add topic tracking, better context weighting

### responseRate
**What:** % of all messages that get a response
**Expected:** ~30-40% (based on 40% base probability + mentions)
**Too high:** >60% (might be spammy)
**Too low:** <20% (too quiet)
**How to improve:** Adjust baseResponseChance (line 53 in chatBot.BETA.js)

---

## 🎯 Success Criteria (Based on Analytics)

**Beta is successful if:**

1. ✅ **avgResponseTime < 500ms** (faster than Alpha)
2. ✅ **contextHitRate > 80%** (uses context effectively)
3. ✅ **topicContinuityRate > 70%** (maintains conversations)
4. ✅ **responseRate ~30-40%** (not too spammy, not too quiet)
5. ✅ **No platform-specific failures** (works everywhere)

**If ANY metric fails:**
- Identify bottleneck from data
- Make targeted fix
- Test again with analytics

---

## 🔧 Quick Fixes Based on Metrics

### If avgResponseTime > 500ms:
```javascript
// chatBot.BETA.js - Shorten prompt or context
this.maxRecentMessages = 3; // was 5
```

### If contextHitRate < 50%:
```javascript
// chatBot.BETA.js - Increase context window
this.maxRecentMessages = 10; // was 5
```

### If topicContinuityRate < 50%:
- Add topic tracking (new system)
- Or increase context to 10 messages

### If responseRate > 60% (too spammy):
```javascript
// chatBot.BETA.js line 53
this.baseResponseChance = 0.2; // was 0.4 (40% → 20%)
```

### If responseRate < 20% (too quiet):
```javascript
// chatBot.BETA.js line 53
this.baseResponseChance = 0.6; // was 0.4 (40% → 60%)
```

---

## 🚀 Using Analytics for Improvement

### Example Session:

1. **Run Beta for 30 minutes**
2. **Check metrics:**
   ```bash
   cat data/beta_analytics/metrics.json
   ```
3. **Results:**
   ```json
   {
     "avgResponseTime": 380,  ✅ Good!
     "contextHitRate": "45%",  ❌ Bad!
     "topicContinuityRate": "82%",  ✅ Good!
     "responseRate": "35%"  ✅ Good!
   }
   ```
4. **Analysis:**
   - Speed is great (380ms)
   - Topic continuity is excellent (82%)
   - Response rate is perfect (35%)
   - **BUT context hit rate is low (45%)**

5. **Fix:**
   - Increase context from 5 to 10 messages
   - Test again

6. **Verify:**
   - Check if contextHitRate improves to >80%

---

## 💡 Advanced: Claude Self-Improvement

**Future capability:**
1. Claude reads session logs
2. Identifies patterns (what works, what doesn't)
3. Suggests prompt changes
4. Automatically adjusts parameters
5. Tests and validates improvements

**For now:**
- Manual analysis
- Share data with Claude
- Claude suggests fixes
- You implement and test

---

## 📝 Quick Reference

**Live stats in chat:** `!betastats`
**Terminal stats:** Every 60 seconds automatically
**Session logs:** `data/beta_analytics/sessions/`
**Current metrics:** `data/beta_analytics/metrics.json`

**Share with Claude for analysis:**
```bash
# Current metrics
cat data/beta_analytics/metrics.json

# Recent session (last 100 events)
tail -100 data/beta_analytics/sessions/session_*.jsonl
```

---

**Analytics are now LIVE. All data will be captured for improvement!** 📊
