# CRITICAL ISSUES IN SLUNT PROJECT

**Date:** November 5, 2025
**Status:** 🔴 **PROJECT BROKEN - CANNOT START**

---

## 🚨 IMMEDIATE BLOCKING ISSUES

### 1. **13 Missing AI Modules** (CRITICAL - Prevents Startup)

These modules are imported in [src/bot/chatBot.js](src/bot/chatBot.js) but **DO NOT EXIST**:

| Module | Line | Usage |
|--------|------|-------|
| `DynamicPhraseGenerator.js` | 25, 332 | MUST BE FIRST - others depend on it |
| `ReactionTracker.js` | 26, 333 | Track reactions to messages |
| `ContextSummarizer.js` | 67, 387 | Background context processing |
| `EmotionTiming.js` | 62 | ? |
| `InsideJokeEvolution.js` | 80 | ? |
| `MemorySummarization.js` | 57 | ? |
| `PersonalityBranching.js` | 72 | ? |
| `RivalBotDetector.js` | 81 | Bot detection |
| `SocialInfluence.js` | 73 | ? |
| `StorytellingEngine.js` | 77 | ? |
| `VideoCommentary.js` | 75 | Video commentary system |
| `VideoContextEngine.js` | 159 | Video context processing |
| `DebateMode.js` | 78 | Debate system |

**Impact:** Server crashes immediately on `require()` with:
```
Error: Cannot find module '../ai/DynamicPhraseGenerator'
```

**Root Cause:** These were planned features that were never implemented, or were deleted.

**Fix Options:**
1. **Create stub implementations** (20 mins each = 4-5 hours)
2. **Comment out imports** (10 mins total - breaks features)
3. **Restore from backup** (if they ever existed)

---

### 2. **Server Currently Down** (CRITICAL)

**Current Status:**
- ❌ Port 3000: Not responding
- ❌ Port 3001: Not responding
- ❌ All Slunt node processes crashed
- ✅ Only Adobe node processes running

**Last Known State:**
- Server started successfully at 04:14:49 UTC
- Loaded all data files
- Connected to Coolhole, Discord, Twitch
- Crashed at 04:14:57 UTC (8 seconds after start)

**Most Likely Cause:**
The missing modules caused a delayed crash when the system tried to actually USE them (not just import them).

---

## ⚠️ HIGH PRIORITY ISSUES

### 3. **Port Configuration Conflict**

**Issue:** You mentioned:
> "I use you and you use port 3001 for voice and I use copilot chat and he uses 3000 for voice"

**Current Configuration:**
- `server.js` hardcoded to port **3001**
- No `.env` variable for PORT
- No detection of port conflicts

**Problem:**
If Copilot starts a server on port 3000 and Claude starts one on 3001, you have:
- Two separate Slunt instances
- Two separate data stores
- Two separate voice systems
- Potential race conditions on file writes

**Fix:**
1. Add `PORT` environment variable
2. Detect which assistant is running and use appropriate port
3. Or: Use a single shared server instance

---

### 4. **Exposed Credentials** (SECURITY RISK)

Your `.env` file contains real, active tokens:
```
DISCORD_TOKEN=MTMxOTk0Mzg3ODQyNTkzNTk3Mw.[...]
TWITCH_OAUTH_TOKEN=oauth:z6yg4g7f[...]
ELEVENLABS_API_KEY=sk_6e9e9f[...]
```

**Risk:** If `.env` is committed to git or shared, these accounts can be compromised.

**Check:**
```bash
git log --all --full-history -- .env
```

**Fix if exposed:**
1. Rotate all tokens immediately
2. Add `.env` to `.gitignore`
3. Use `.env.example` template instead

---

### 5. **Massive server.js File** (MAINTAINABILITY)

**Stats:**
- 25,860 lines in a single file
- Contains 100+ feature implementations
- Mixes routing, business logic, initialization

**Problems:**
- Impossible to review changes
- High merge conflict risk
- Hard to debug
- Slow to load in editors

**Recommendation:** Split into:
- `server.js` (entry point only)
- `routes/` (Express routes)
- `initialization/` (System setup)
- `middleware/` (Auth, logging, etc.)

---

### 6. **Dual Architecture Confusion**

**Two systems exist in parallel:**

**Option A: New Core System** (`USE_CORE_SYSTEMS=true`)
- MemoryCore
- RelationshipCore
- BehaviorModifiers
- ResponseShaper

**Option B: Legacy Modules** (Default)
- 100+ individual modules
- All still loaded even when cores enabled

**Problem:**
Both systems can run simultaneously, causing:
- Duplicate processing
- Conflicting behaviors
- Performance overhead
- Confusion about which system is active

---

## 📊 PROJECT HEALTH SUMMARY

| System | Files | Status | Issues |
|--------|-------|--------|--------|
| Core Entry Points | 3 | 🔴 Broken | Missing modules block startup |
| AI Modules | 139 | 🟡 91% | 13 missing (9%) |
| Platform Integrations | 3 | 🟢 Complete | Coolhole/Discord/Twitch working |
| Voice Systems | 6 | 🟢 Complete | When server runs |
| Data Persistence | 67 | 🟢 Complete | All files present |
| Configuration | 5 | 🟡 Partial | Missing PORT variable |
| Security | N/A | 🔴 Critical | Exposed credentials |
| Code Quality | N/A | 🟡 Fair | 25K line files, high complexity |

**Overall Grade: 🔴 D (Broken)**

---

## 🔧 IMMEDIATE ACTION PLAN

### Step 1: Get Server Running (30 mins)

**Option A: Quick Fix (Comment Out)**
```javascript
// Comment out all 13 missing requires in chatBot.js
// Lines: 25, 26, 57, 62, 67, 72, 73, 75, 77, 78, 80, 81, 159
// Also comment out their instantiations
```

**Option B: Create Stubs** (Recommended)
```javascript
// Create minimal stub files for each missing module
// Example: src/ai/DynamicPhraseGenerator.js
class DynamicPhraseGenerator {
  constructor(chatBot) {
    this.chatBot = chatBot;
  }
}
module.exports = DynamicPhraseGenerator;
```

### Step 2: Fix Port Conflict (15 mins)

1. Add to `.env`:
   ```
   PORT=3001
   ```

2. Update `server.js` line ~25,850:
   ```javascript
   const PORT = process.env.PORT || 3001;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

3. Document which assistant uses which port

### Step 3: Security Audit (1 hour)

1. Check git history for `.env`:
   ```bash
   git log --all --full-history -- .env
   ```

2. If found in git:
   - Rotate ALL tokens immediately
   - Use BFG Repo Cleaner to purge history
   - Force push to remote (if applicable)

3. Add to `.gitignore`:
   ```
   .env
   *.log
   data/*.json
   ```

### Step 4: Test Startup (15 mins)

1. Start server
2. Check all platforms connect
3. Test voice on http://localhost:3001/voice
4. Verify no crashes for 5 minutes

---

## 📋 FULL ISSUE LIST

### CRITICAL (Must Fix Now)
- [ ] Implement or stub 13 missing AI modules
- [ ] Fix server startup crashes
- [ ] Resolve port 3000/3001 conflict
- [ ] Audit credential exposure

### HIGH (Fix This Week)
- [ ] Split server.js into modules
- [ ] Document architecture (core vs legacy)
- [ ] Add startup validation
- [ ] Add error boundaries for missing modules
- [ ] Complete TopicGuard cleanup (59 refs in peer_influence.json, etc.)

### MEDIUM (Fix This Month)
- [ ] Add unit tests
- [ ] Performance profiling
- [ ] Data validation on load
- [ ] Refactor dual architecture
- [ ] Add health check endpoints

### LOW (Nice to Have)
- [ ] Clean up archive files
- [ ] Remove duplicate code
- [ ] Add TypeScript
- [ ] Documentation site

---

## 🎯 SUCCESS CRITERIA

**Server is fixed when:**
1. ✅ `node server.js` starts without errors
2. ✅ All 3 platforms connect (Coolhole/Discord/Twitch)
3. ✅ Voice system responds at /voice
4. ✅ No crashes for 1 hour continuous operation
5. ✅ Memory doesn't leak (stable RAM usage)

**Project is healthy when:**
1. ✅ All modules exist or are properly handled
2. ✅ No security vulnerabilities
3. ✅ Code is maintainable (<5K lines per file)
4. ✅ Tests exist for critical paths
5. ✅ Documentation is current

---

## 📞 NEXT STEPS

**Immediate (RIGHT NOW):**
1. Choose: Comment out or create stubs?
2. Implement chosen solution
3. Restart server
4. Test basic functionality

**Today:**
5. Fix port configuration
6. Security audit
7. Document current architecture

**This Week:**
8. Clean up remaining Gaza/Slovenia refs
9. Add error handling for missing modules
10. Split server.js into logical modules

---

**Status:** Waiting for user decision on stub vs comment approach.
