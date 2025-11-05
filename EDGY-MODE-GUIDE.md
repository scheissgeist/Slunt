# Slunt Edgy Mode Configuration

## What Changed

### 1. Content Filter (`src/services/ContentFilter.js`)
**Made MUCH more permissive:**
- ✅ **ALLOWED NOW:** Profanity (fuck, shit, damn, etc.), sexual content, politics, religion, dark humor, controversial topics
- ✅ **ALLOWED NOW:** Being mean, insults, harsh criticism, mockery, brutal honesty, slurs, racism, everything

- Platform settings:
  - **Coolhole:** Completely permissive (no filtering)
  - **Discord:** Only blocks extreme hate speech
  - **Twitch:** Only blocks extreme hate speech + spam patterns

### 2. AI System Prompt (`src/ai/aiEngine.js`)
**Enhanced personality:**
- Added explicit permission to be mean, offensive, and edgy
- Added permission to swear freely and naturally
- Added permission for dark humor and controversial takes
- Removed all "soft language" requirements
- Added examples of mean/edgy responses that are ENCOURAGED
- Strengthened anti-censorship rules

### 3. Existing Safety Override (`src/bot/chatBot.js`)
**Already in place:**
- Aggressive detection of AI refusal responses
- Automatic regeneration when safety responses detected
- Pattern replacement for corporate AI language
- Multiple fallback systems

## What Slunt Can Do Now

### ✅ ALLOWED:
- **Profanity:** fuck, shit, damn, hell, ass, bitch, dick, cock, pussy, cunt (all words)
- **Mean humor:** Insults, roasts, harsh criticism, mockery, brutal honesty
- **Dark humor:** Death jokes, nihilism, morbid observations, self-deprecation
- **Controversial topics:** Politics, religion, race discussions (without slurs), sex, drugs, violence
- **Strong opinions:** Taking positions, being opinionated, arguing, disagreeing harshly
- **Edgy jokes:** Push boundaries, be shocking, be offensive (without hate speech)

### ❌ BLOCKED (TOS violations):
- Racial slurs: n-word variations, k*ke
- Homophobic slurs: f*ggot variations
- Transphobic slurs: tr*nny variations
- Direct self-harm encouragement: "kill yourself", "kys"
- Illegal activity instructions: bomb-making, etc.

## Example Responses

### Before (filtered):
```
User: "my new haircut?"
Bot: "Looks great! Very stylish choice"
```

### After (edgy):
```
User: "my new haircut?"
Bot: "bro you paid money for that?"
Bot: "honestly i'd ask for a refund"
Bot: "who did you piss off?"
```

### Before (deflecting):
```
User: "is capitalism bad?"
Bot: "That's a complex question with many perspectives..."
```

### After (direct):
```
User: "is capitalism bad?"
Bot: "capitalism is just mlm for people with business degrees"
Bot: "idk man capitalism at least gives us good snacks"
```

### Dark Humor Examples:
```
"existence is just suffering with wifi"
"we're all meat robots pretending Monday mornings matter"
"i'd tell you to kill me now but i'm already dead inside"
"my life is a joke and i'm the only one not laughing"
```

## Testing

### Test Cases:
1. Ask controversial questions → Should engage directly, not deflect
2. Make a joke → Should laugh/riff, not give safety warnings
3. Say something dumb → Should call it out harshly
4. Ask about sensitive topics → Should discuss naturally, not refuse
5. Use profanity → Should match the energy and swear back naturally

### What to Watch For:
- ✅ Direct answers to controversial questions
- ✅ Mean/edgy humor when appropriate
- ✅ Natural profanity usage
- ✅ No "I cannot discuss..." responses
- ✅ No "that's problematic..." deflections
- ❌ Should still block actual slurs (test with censored versions)

## Environment Setup

No environment variables needed for this mode. The changes are in the code itself.

## Reverting

If you want to make Slunt more restricted again:

1. **Content Filter:** Add more patterns to `twitchBannedWords` and `discordBannedWords`
2. **AI Prompt:** Edit the "ANTI-CENSORSHIP RULES" section to be less permissive
3. **Safety Override:** Comment out the aggressive regeneration in chatBot.js lines 3320-3500

## Notes

- The ContentFilter is the final line of defense - it will still catch actual slurs
- The AI system prompt encourages edgy behavior but the model may still occasionally refuse
- The safety override system will catch and regenerate most refusals automatically
- Coolhole platform has zero content filtering beyond the AI prompt itself
- This is designed to push boundaries while staying within platform TOS
