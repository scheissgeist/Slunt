# QUOTATION MARK PROBLEM - ROOT CAUSE & FIX

## The Problem

Slunt sometimes responds with quotation marks wrapping his text:
```
"yeah that's wild"
"lmao what the fuck"
```

This happens because:
1. **Bad prompt format**: Voice mode prompt says `Slunt (5-15 words):`
2. **AI interprets this as**: A labeled response format like `Slunt: "response here"`
3. **Result**: AI wraps response in quotes thinking it's dialogue format
4. **Voice TTS problem**: Reads "quote" and "end quote" aloud

## The Fix

### 1. Remove Quote-Inducing Prompts
### 2. Add Quote Stripping to Response Validator
### 3. Upgrade to Sonnet (optional - better quality)

---

## Implementation Below

I'll fix:
- ✅ Remove `Slunt:` and `Slunt (...)` from all prompts
- ✅ Add smart quote stripping (only wrapping quotes, not inline)
- ✅ Improve voice prompt formatting
- ✅ Make responses cleaner overall
- ⚠️  Optionally switch to Claude 3.5 Sonnet (better quality, slightly more expensive)
