# Switch to Slunt Beta

## Quick Start

Slunt Beta is ready to test. Here's how to switch between Alpha (complex) and Beta (minimal):

---

## Option 1: Direct File Replacement (Fastest)

### Switch to Beta:
```bash
# Backup current chatBot.js (Alpha)
cp src/bot/chatBot.js src/bot/chatBot.ALPHA_BACKUP.js

# Use Beta version
cp src/bot/chatBot.BETA.js src/bot/chatBot.js

# Restart Slunt
npm start
```

### Switch back to Alpha:
```bash
# Restore Alpha
cp src/bot/chatBot.ALPHA_BACKUP.js src/bot/chatBot.js

# Restart Slunt
npm start
```

---

## Option 2: Modify server.js (Recommended)

Edit `server.js` to load Beta directly:

**Change this line:**
```javascript
const ChatBot = require('./src/bot/chatBot');
```

**To:**
```javascript
const ChatBot = require('./src/bot/chatBot.BETA');
```

Then restart:
```bash
npm start
```

To switch back, just change it back to `'./src/bot/chatBot'`

---

## Testing Beta vs Alpha

### What to Test:

**1. Context Understanding** (MAIN ISSUE)
- Have a conversation about a specific topic
- See if Slunt REMEMBERS what you're talking about
- Does he respond to what you ACTUALLY said?

**2. Response Quality**
- Do responses feel natural?
- Or canned/generic?
- Does he sound like Slunt?

**3. Speed**
- How fast do responses come?
- Should be <1 second with Beta (Ollama only)

---

## Expected Differences

### Alpha (140 systems):
- Slow (~2-3 seconds)
- Lots of "personality" but loses context
- Feels like talking to confused person with ADD
- "Spewing nonsense, canned answers"

### Beta (Minimal):
- Fast (<1 second)
- NO personality systems
- ONLY recent conversation context (last 5 messages)
- Should feel like actual conversation

---

## Which is Better?

**Test with 20-message conversation:**

1. Have normal chat about something specific
2. Ask yourself: "Does this feel like talking to a person?"
3. Does Slunt:
   - Remember what you're talking about? ✓/✗
   - Respond appropriately to what you said? ✓/✗
   - Stay on topic? ✓/✗
   - Feel natural, not canned? ✓/✗

**If Beta is better:**
- Proves Alpha was too complex
- We rebuild FROM Beta, adding ONE thing at a time
- Only add what's proven necessary

**If Alpha is better:**
- Beta is too simple
- Need to identify WHICH of Alpha's systems actually helped
- Add back selectively

**If both suck:**
- Problem might be Ollama itself
- Try adding Claude back to Beta
- Or adjust system prompt

---

## Next Steps After Testing

### If Beta Wins:
1. Commit Beta as new baseline
2. Identify ONE missing feature (if any)
3. Add ONLY that feature
4. Test again
5. Repeat until perfect

### If Alpha Wins:
1. Go back to Alpha
2. Start removing systems ONE at a time
3. Find which system is breaking context
4. Fix or remove that system

---

## Beta System Prompt

Currently using this prompt (in chatBot.BETA.js):

```
You are Slunt - a crude, funny, no-filter chatbot.

PERSONALITY:
- Casual, internet humor (use "lmao", "bruh", "nah", "wtf")
- Sarcastic and edgy when appropriate
- Direct and honest, no corporate BS
- Actually respond to what people say (don't ignore context)
- Keep it short: 15-30 words max

RULES:
- NO "I cannot", "I don't feel comfortable" - engage naturally
- NO apologizing or hedging
- NO robotic phrases
- RESPOND TO THE ACTUAL MESSAGE
```

**Easy to modify** - just edit chatBot.BETA.js lines 159-185

---

## Debugging

### If Beta gives weird responses:
1. Check Ollama is running: `ollama list`
2. Check model exists: `ollama list | grep llama3.2:1b`
3. Check console logs for errors
4. Try adjusting temperature (line 198) - higher = more random

### If Beta doesn't respond:
1. Check rate limiting (minResponseInterval on line 59)
2. Check response probability (baseResponseChance on line 62)
3. Lower probability to 1.0 (always respond) for testing

---

**Ready to test!** Switch to Beta and try a real conversation.
