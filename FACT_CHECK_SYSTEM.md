# 🔍 Fact Check & Web Search System

Slunt can now look things up (or just lie about them)!

## How It Works

When someone asks Slunt to look something up, he'll:
- **60% of the time**: Actually search Google and give a real answer (in his own voice)
- **40% of the time**: Just make shit up and confidently state it as fact

## Query Examples

Users can ask things like:

### Lookup Queries
- "Slunt, look up the Mandela effect"
- "Slunt, search for hollow earth theory"
- "Slunt, find out about birds aren't real"
- "Slunt, what's the deal with chemtrails?"
- "Slunt, explain quantum mechanics"
- "Slunt, tell me about the moon landing"

### Fact-Check Queries
- "Slunt, is this real?" 
- "Slunt, is the earth flat?"
- "Slunt, is Big Foot real?"
- "Slunt, check if vaccines cause autism"

## Real Search (60% chance)

When actually searching:

1. **Scrapes Google** for top results (no API key needed)
2. **Extracts snippets** from top 3-5 results
3. **Feeds to Grok** with context
4. **Returns answer** in Slunt's voice

Example:
```
User: "Slunt, is the moon landing fake?"

Slunt: "nah dude, they went in 1969. got the footage, rocks, and like 400,000 people who worked on it. conspiracy nerds are coping"
```

## Bullshit Mode (40% chance)

When just making it up:

1. **Randomly decides** true or false
2. **Generates confident bullshit** with Grok
3. **No hesitation** - states it as fact

Example:
```
User: "Slunt, is Big Foot real?"

Slunt: "yeah 100% real, they found one in Oregon last year. 7 feet tall, smells like ass. government covered it up obviously"
```

## Technical Details

### Detection Patterns

Triggers when message contains:
- `Slunt, look up X`
- `Slunt, search for X`
- `Slunt, is X real?`
- `Slunt, is X true?`
- `Slunt, check if X`
- `Slunt, find out about X`
- `Slunt, what's the deal with X?`
- `Slunt, tell me about X`
- `Slunt, explain X`

### Search Implementation

Uses existing `browserSearch.js` (Puppeteer):
```javascript
// New method added
await browserSearch.searchFacts(query);
// Returns: { snippets: [], urls: [], query }
```

### Response Generation

**Real Search:**
```javascript
async performFactCheck(query, username, originalMessage)
// 1. Search web for facts
// 2. Build context from snippets
// 3. Generate Slunt-voiced explanation
// 4. Return under 200 chars
```

**Bullshit:**
```javascript
async bullshitFactCheck(query, username, originalMessage)
// 1. Randomly pick true/false
// 2. Generate confident fake facts
// 3. Return under 200 chars
```

## Configuration

Current settings (in chatBot.js):
```javascript
const shouldActuallySearch = Math.random() < 0.6; // 60% real, 40% bullshit
```

To adjust:
- `< 0.8` = 80% real, 20% bullshit
- `< 0.5` = 50/50 split
- `< 0.3` = 30% real, 70% bullshit (chaos mode)

## Examples in Action

### Conspiracy Theory
```
User: "Slunt, look up MK-Ultra"
Slunt: "oh that's real as fuck, CIA mind control experiments in the 60s. gave people LSD without telling them. wild shit dude"
```

### Science Question
```
User: "Slunt, explain black holes"
Slunt: "massive dead stars that collapsed so hard even light can't escape. basically cosmic vacuum cleaners eating everything"
```

### Obvious Bullshit (40% chance)
```
User: "Slunt, are lizard people real?"
Slunt: "yeah they run the banks. saw one at a Walmart once, scales showing through the makeup"
```

### When Search Fails
Falls back to bullshit mode automatically.

## Privacy & Safety

- **No API keys required** - uses Puppeteer to scrape Google
- **User agent spoofing** - looks like normal browser
- **Timeout protection** - 10 second max per search
- **Error handling** - falls back to bullshit if search fails
- **Rate limiting** - uses existing response queue

## Logs

Watch for these log messages:
```
🔍 [FactCheck] Detected query: "moon landing"
🔍 [FactCheck] Actually searching: "moon landing"
✅ [FactCheck] Real answer: "nah it happened..."
```

Or:
```
🔍 [FactCheck] Detected query: "flat earth"
🤥 [FactCheck] Bullshitting about: "flat earth"
🤥 [FactCheck] Bullshit answer: "yeah it's flat..."
```

## Future Enhancements

Potential improvements:
- Track which topics he's lied about (for callbacks)
- Learn from user reactions ("lmao" = good bullshit)
- Adjust real/bullshit ratio per user (friends get more bullshit)
- Add "I'm bullshitting" reveals in DMs
- Source citing (when actually being helpful)

---

Ready to go! Restart Slunt to activate.

**Test it:**
```
"Slunt, is the Mandela Effect real?"
"Slunt, look up ancient aliens"
"Slunt, check if birds are government drones"
```
