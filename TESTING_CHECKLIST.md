# Slunt Testing Checklist - Live Response Validation

**Date:** November 8, 2025
**Goal:** Verify all comedy systems are working and responses are fast, unique, and funny

---

## 🎭 Comedy Systems Testing

### 1. Callback Humor (Should fire ~12% = ~1 in 8 messages)
**Test:** Have a 20-message conversation with Slunt

**What to check:**
- [ ] Does Slunt reference earlier parts of the conversation?
- [ ] Running gags that callback to previous jokes?
- [ ] Expected: 2-3 callbacks in 20 messages
- [ ] If zero callbacks, system may be broken

**Example good callback:**
```
You: "I love pizza"
[10 messages later]
Slunt: "still thinking about that pizza take earlier, absolutely unhinged"
```

---

### 2. BanterBalance (Roast scaling based on friendship)
**Test:** New user vs established user roasting

**New user test:**
- [ ] Create fresh account or use new username
- [ ] Say something roastable: "I'm a reddit moderator"
- [ ] Expected: Friendly response, NO harsh roasting
- [ ] Example: "oh nice, that's cool man" (NOT "virgin energy lmao")

**Established user test:**
- [ ] Use account with 100+ messages to Slunt
- [ ] Say something roastable: "I'm a reddit moderator"
- [ ] Expected: BRUTAL roast
- [ ] Example: "absolute maidenless behavior, touch grass"

---

### 3. EdgyPersonality Roasts (Should appear when friends, 50+ friendship)
**Test:** Send 50+ messages to build friendship, then trigger roast

**What to check:**
- [ ] After 50+ messages, does Slunt use edgy roasts?
- [ ] Check for phrases from EdgyPersonality.js:
  - "you sound like you jerk off to linkedin profiles"
  - "reddit moderator energy"
  - "discord kitten energy"
  - "tech bro energy, zero bitches"
- [ ] These should ONLY appear after building rapport

**How to trigger:**
- Be edgy yourself
- Make controversial takes
- Roast Slunt first (he'll roast back harder)

---

### 4. EmbarrassingItemRoast (15% chance, 5min global cooldown)
**Test:** Leave chat for 30+ minutes, come back

**What to check:**
- [ ] After being gone 30min+, does someone ask about you?
- [ ] Does Slunt say "hey if anyone sees [you], tell them I have their [embarrassing item]"?
- [ ] Items should be from the list (waifu pillow, katana, fedora, etc.)
- [ ] Expected: ~15% chance per opportunity (may take several tests)

**Note:** This is proactive, so Slunt needs to initiate, not you

---

### 5. Slang & Natural Language (Should be enabled)
**Test:** Look at Slunt's responses

**Should INCLUDE:**
- [ ] "lmao" (not "haha")
- [ ] "bruh" (not "man")
- [ ] "sus" (not "weird")
- [ ] "based" (not "correct")
- [ ] "wtf" and other internet slang
- [ ] "literally", "ngl" (not removed)

**Should EXCLUDE (banned text-speak):**
- [ ] "ppl" (should say "people")
- [ ] "u" or "ur" (should say "you"/"your")
- [ ] "fr", "ong", "slay", "finna" (gen-alpha cringe)

---

### 6. Joke Structure (Setup + Punchline)
**Test:** Analyze response length and structure

**What to check:**
- [ ] Responses can be 2 sentences (setup + punchline)
- [ ] Not truncated mid-joke
- [ ] 15-40 words typical, up to 60 for complex answers
- [ ] Complete thoughts, not fragments

**Example good structure:**
```
"that's the dumbest take i've ever heard. congratulations you've somehow made everyone dumber for reading it."
[Setup sentence] [Punchline sentence]
```

**Example BAD (truncated):**
```
"that's the dumbest take i've ever heard."
[Setup only, punchline cut off]
```

---

## ⚡ Speed & Responsiveness Testing

### 7. Response Time (User-Facing Latency)
**Test:** Measure time from your message to Slunt's response

**How to test:**
1. Say "hey slunt" and start timer
2. Stop when response appears in chat
3. Repeat 10 times
4. Calculate average

**Expected times:**
- [ ] Ollama responses: <2 seconds total
- [ ] Claude responses: <3 seconds total
- [ ] Average: ~1.5-2 seconds

**If slower than 5 seconds:** Something is wrong

---

### 8. Response Rate (How often does he respond?)
**Test:** Send 20 messages in active chat

**What to check:**
- [ ] Commands: 100% response rate
- [ ] Direct mentions (@slunt): ~80% response rate
- [ ] Normal chat: ~30-50% response rate (context-dependent)
- [ ] High-traffic (>10 msg/min): Should NOT randomly ignore 30%

**Red flags:**
- Ignoring direct @mentions
- Never responding in active chat
- Saying "brb need a break" (should be removed)

---

### 9. AI Provider Usage (Ollama vs Claude)
**Test:** Check console logs for which AI handles what

**Expected routing:**
- [ ] "hey slunt" / "lmao" / "you there?" → Ollama (fast, <100ms)
- [ ] "why does..." / "how does..." / "explain..." → Claude (smart, ~500ms)
- [ ] Voice: Always Claude (quality)

**Check console for:**
```
💬 [Chat] Using Ollama (zero restrictions)
🧠 [Chat] Using Claude for complex question
🎤 [Voice] Using Claude 3.5 Haiku for quality
```

---

## 🎤 Voice Quality Testing

### 10. Voice Response Quality
**Test:** Send 10 voice messages, analyze responses

**What to check:**
- [ ] Using Hasselhoff voice model?
- [ ] Responses are 20-40 words (not truncated)?
- [ ] Sound natural and conversational?
- [ ] Variety in responses (not repeating)?
- [ ] Using Claude (not Ollama) for voice?

**Console should show:**
```
🎤 [Voice] Using Claude 3.5 Haiku for quality
```

---

### 11. Voice Truncation Test
**Test:** Check if voice responses get cut off

**What to check:**
- [ ] Voice responses can be 3 sentences (not 2)
- [ ] ResponsePolicy allows 3 sentences for voice (line 244)
- [ ] Hard cap doesn't apply to voice (should skip line 34 for voice)

**Test:** Ask complex question via voice
- Expected: Full 3-sentence response with complete thought

---

## 🎲 Uniqueness & Variety Testing

### 12. Response Uniqueness
**Test:** Ask the same question 10 times

**Questions to repeat:**
1. "hey slunt"
2. "what do you think about cats?"
3. "what's up"

**What to check:**
- [ ] Do you get 10 DIFFERENT responses? (Good)
- [ ] Or repeated/similar responses? (Bad - variety broken)

**If repetitive:**
- ResponseNoveltyChecker may need tuning
- CallbackHumorEngine might be stuck in loop

---

### 13. Personality Variety
**Test:** Long conversation (50+ messages)

**What to check:**
- [ ] Mood changes during conversation?
- [ ] Uses different comedy approaches (roasts, callbacks, observations)?
- [ ] Doesn't feel robotic or template-based?
- [ ] Surprises you occasionally?

---

## 🐛 Known Issues to Watch For

### Issues from Previous Sessions
- [ ] ~~Random 30% skip rate when chat busy~~ (FIXED - CognitiveOverload removed)
- [ ] ~~"brb need a break" messages~~ (FIXED - ConversationEnergy removed)
- [ ] ~~Callbacks never firing~~ (FIXED - increased to 30% chance)
- [ ] ~~Jokes truncated mid-punchline~~ (FIXED - 40 word limit, 2 sentences)

### New Issues to Report
- [ ] Responses feel slow (>5 seconds)
- [ ] Too repetitive (same phrases)
- [ ] Not funny enough (comedy systems not firing)
- [ ] Voice quality issues
- [ ] Other: _______________________

---

## 📊 Success Criteria

**Comedy:**
- ✅ 2-3 callbacks per 20 messages (12% rate working)
- ✅ Roasts scale with friendship (harsh for friends, kind for new users)
- ✅ Natural internet slang (lmao, bruh, sus, based)
- ✅ Complete jokes (setup + punchline, not truncated)

**Speed:**
- ✅ <2 seconds average response time
- ✅ Fast rejection of ignored messages
- ✅ Ollama for simple, Claude for complex

**Uniqueness:**
- ✅ 10 different responses to same question
- ✅ Personality variety in long conversations
- ✅ Surprising/unpredictable occasionally

**If all pass:** Slunt is working as intended! 🎉
**If failures:** Report which tests failed for debugging

---

## 📝 Test Results Template

Copy and fill out:

```
=== TEST RESULTS ===
Date:
Platform: (Coolhole/Discord/Twitch)

COMEDY:
- Callbacks: [X/20 messages had callbacks = Y%]
- BanterBalance: [Worked / Broken - details:]
- EdgyRoasts: [Appeared / Never appeared]
- EmbarrassingItems: [Saw / Didn't see]
- Slang: [Natural / Sanitized]
- Jokes: [Complete / Truncated]

SPEED:
- Average latency: [X seconds]
- Response rate: [X/20 messages = Y%]
- AI routing: [Ollama % / Claude %]

VOICE:
- Quality: [Good / Bad]
- Truncation: [None / Frequent]
- Variety: [Unique / Repetitive]

UNIQUENESS:
- Same question test: [X/10 unique responses]
- Personality variety: [Good / Robotic]

ISSUES FOUND:
1.
2.
3.

OVERALL RATING: X/10 for speed, Y/10 for comedy, Z/10 for uniqueness
```

---

**Ready to test!** Start with a 20-message conversation and fill out the results.
