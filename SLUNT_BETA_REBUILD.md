# Slunt Beta - Minimal Rebuild Strategy

**Date:** November 8, 2025
**Branch:** `slunt-beta`
**Goal:** Strip to bare minimum, rebuild with ONLY what works

---

## 🔥 Problem with Slunt Alpha (140 systems)

**User Feedback:**
- "Chats are terrible, no context"
- "Canned answers, not talking to people"
- "Just spewing nonsense"

**Root Cause:**
- 140 AI systems creating noise, not signal
- Too much "personality" drowning out actual conversation
- Context gets lost in 500+ lines of life simulation
- AI sees synthetic data, not real conversation

---

## 🎯 Slunt Beta Strategy - Start from Zero

### Phase 0: Absolute Minimum (START HERE)

**What it does:**
1. Listen to chat
2. Send message to Ollama
3. Return response
4. That's it.

**NO:**
- ❌ No personality systems
- ❌ No memory/learning
- ❌ No life simulation
- ❌ No context building (beyond last 5 messages)
- ❌ No comedy engines
- ❌ No response filtering

**Files to modify:**
- `src/bot/chatBot.js` - Strip to 200-300 lines
- `src/ai/aiEngine.js` - Just Ollama, simple prompt

**Expected result:**
- Fast (<1 second)
- Actually responds to what user said
- Natural conversation flow
- Simple but REAL

---

## 📊 Build-Back Plan (After Phase 0 Works)

### Phase 1: Add Context (If needed)
- Last 10 messages from THIS conversation
- Username memory (who said what)
- That's it

### Phase 2: Add Basic Personality (If needed)
- ONE system: Simple personality prompt
- Define voice/tone in system prompt only
- No separate personality classes

### Phase 3: Add ONE Comedy Element (If needed)
- Test: Callbacks OR Roasts OR Callbacks
- Only add if Phase 2 feels flat
- ONE at a time

### Phase 4: Evaluate
- Is it better than Alpha?
- What's missing?
- Add ONLY what's proven necessary

---

## 🧪 Testing Strategy

**After Each Phase:**
1. Have 20-message conversation
2. Ask: "Does this feel like talking to a person?"
3. If YES: Stop adding, ship it
4. If NO: Identify ONE specific thing missing, add ONLY that

**Success Criteria:**
- Responses make sense in context
- Feels like conversation, not canned responses
- Fast (<2 seconds)
- Simple > Complex

---

## 📝 Phase 0 Implementation Checklist

**Minimal chatBot.js should ONLY have:**
- [ ] Platform connections (Coolhole, Discord, Twitch)
- [ ] Message event handler
- [ ] shouldRespond() logic (rate limiting, probability)
- [ ] generateResponse() - calls Ollama with simple context
- [ ] Send response to platform
- [ ] Command handling (!help, !balance, etc.)

**Remove from generateResponse():**
- [ ] All 140 system integrations
- [ ] Context builders (ultraContext with 500 lines)
- [ ] ResponsePolicy post-processing
- [ ] Learning/memory updates
- [ ] Personality mode selection

**aiEngine.js changes:**
- [ ] Remove Claude routing (Ollama only for now)
- [ ] Simple system prompt: "You are Slunt - crude, funny, direct. Respond naturally."
- [ ] Context: Last 5 messages only
- [ ] No response validation/filtering

---

## 🔨 Implementation Steps

1. **Create chatBot.BETA.js** - New minimal file
2. **Test with Ollama** - Verify basic conversation works
3. **Compare Alpha vs Beta** - Which feels better?
4. **If Beta better:** Replace chatBot.js
5. **If Beta worse:** Identify what ONE thing to add back

---

## 💡 Key Principles

**Less is More:**
- Start with nothing
- Add ONLY when proven necessary
- Every system must justify its existence

**User-Driven:**
- If user can't tell it's missing, don't add it
- Test with real conversations, not theory

**Conversation First:**
- Actual context > Synthetic personality
- What user said > Life simulation data
- Real talk > Comedy systems

---

**Ready to implement Phase 0**
