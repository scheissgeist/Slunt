# Slunt Response Quality - Quick Reference

## Current Settings (November 4, 2025)

### Token Limits
- **Default:** 80 tokens (~40-50 words max)
- **Voice mode:** Custom per call
- **Previous:** 300 tokens (way too high)

### Word/Character Limits
| Platform | Max Words | Max Chars |
|----------|-----------|-----------|
| Coolhole | 15 | 120 |
| Discord  | 15 | 120 |
| Twitch   | 12 | 100 |

### Hard Caps
- **50+ words:** Immediate truncation to 2 sentences
- **Multiple sentences:** Always cut to first sentence
- **Over word limit:** Hard truncate at word boundary

## Pipeline Stages

1. **Hard Cap** (>50 words → 2 sentences)
2. **Strip Narration** (*actions*, [OOC])
3. **Remove Artifacts** ([object Object])
4. **Cut Filler** (sorry, honestly, i mean)
5. **Fix Run-on** (split at "anyway", "though")
6. **Detect Topic Blurt** (suppress obsessions)
7. **Fix Incomplete** (trim dangling phrases)
8. **Enforce Concision** (1 sentence, 15 words)
9. **Final Cleanup** (whitespace, punctuation)

## Expected Output

### ✅ Good Examples
- "nah that's bullshit dude" (5 words)
- "robofussin is definitely trolling" (4 words)
- "holy fuck the world's most avoidable charge" (7 words)
- "i don't think robofussin's trolling" (5 words)

### ❌ Bad Examples (Now Fixed)
- ~~241-word rambling explanation~~ → Cut to 11 words
- ~~60-word multi-sentence response~~ → Cut to 11 words
- ~~"speaking of which can't stop..."~~ → Suppressed
- ~~"dude i'm obsessed with..."~~ → Suppressed

## Monitoring

Watch logs for:
- `🧹 [Policy] Applied transforms: hardCap` → Verbose response truncated
- `🧹 [Policy] Applied transforms: enforceConcision` → Limits enforced
- `🚫 [Policy] Response suppressed` → Incomplete/blurt blocked

## Tuning

To adjust limits, edit `src/core/ResponsePolicy.js`:

```javascript
constructor(config = {}) {
  this.config = Object.assign({
    maxWords: 15,        // ← Adjust this
    maxChars: 120,       // ← And this
    // ...
  }, config);
}
```

To adjust token generation, edit `src/ai/aiEngine.js`:

```javascript
async generateOllamaResponse(message, username, additionalContext = '', maxTokens = 80, ...)
//                                                                              ↑ Adjust this
```

## Philosophy

**Punchy > Verbose**
- One good sentence beats three mediocre ones
- Information density > word count
- Leave them wanting more

**When in doubt, cut it out**
- If it rambles, truncate
- If it's incomplete, suppress
- If it's random, block

Slunt should feel like **rapid-fire wit**, not **meandering monologue**.
