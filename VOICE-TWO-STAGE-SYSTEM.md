# Voice Two-Stage Dynamic Prompt System

## Your Brilliant Idea

Instead of choosing between:
- **SLOW**: Full personality (7+ seconds)
- **FAST BUT DUMB**: No personality (<1 second but generic)

You suggested a **two-stage intelligent system**:

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  STAGE 1: PERSONALITY DISTILLER                     │
│  ├─ Reads ALL personality systems                   │
│  │  - Current mood & energy                         │
│  │  - Active fixations (autism system)              │
│  │  - Mental state (mental break system)            │
│  │  - Cravings (addiction system)                   │
│  │  - Personality lock-in mode                      │
│  │  - Emotional momentum                            │
│  ├─ Condenses into 2-3 sentence summary             │
│  └─ OUTPUT: "Feeling edgy, obsessed with synths,    │
│              craving validation"                     │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  STAGE 2: CONTEXT ANALYZER                          │
│  ├─ Analyzes conversation situation                 │
│  │  - Phase: greeting/question/debate/emotional     │
│  │  - Topic: extracted from recent exchanges        │
│  │  - Emotional tone: intense/humorous/negative     │
│  │  - Urgency: high/normal                          │
│  ├─ Builds context-specific guidance                │
│  └─ OUTPUT: "Answer directly, no hedging. Get       │
│              intense back."                          │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  STAGE 3: OPTIMIZED PROMPT ASSEMBLY                 │
│  ├─ Base rules (always minimal)                     │
│  ├─ + Personality summary from Stage 1              │
│  ├─ + Context guidance from Stage 2                 │
│  ├─ + Recent 4 exchanges                            │
│  └─ OUTPUT: Compact but intelligent prompt          │
└─────────────────────────────────────────────────────┘
                       ↓
                  Claude Haiku
                  (<1 second)
```

## Files Created

### 1. `src/voice/VoicePersonalityDistiller.js`
**Purpose**: Condenses Slunt's full personality state into ultra-compact summaries

**What it does**:
- Reads current mood, energy, fixations, mental state, cravings, personality mode
- Distills into 1-2 sentences
- Caches for 30 seconds (no need to regenerate constantly)

**Example outputs**:
- `"Feeling edgy, being provocative. Obsessed with vintage synthesizers."`
- `"Exhausted (chill), mentally scattered, craving caffeine."`
- `"Energized (hyped), being chaotic and unpredictable."`

### 2. `src/voice/VoiceContextAnalyzer.js`
**Purpose**: Analyzes conversation situation and adapts prompt accordingly

**What it detects**:
- **Phase**: greeting, question, debate, emotional, story, casual
- **Topic**: Main subject from recent exchanges
- **Emotional tone**: intense, humorous, negative, positive, curious, neutral
- **Urgency**: high (all caps, multiple punctuation) or normal

**Example guidance**:
- For debate: `"Stand your ground, challenge back"`
- For emotional: `"Match their energy, react authentically. Get intense back"`
- For question: `"Answer directly, no hedging"`
- For high urgency: `"RESPOND QUICKLY, short and direct"`

### 3. `src/voice/VoicePromptSystem.js` (UPDATED)
**Purpose**: Orchestrates the two-stage system

**Changes**:
- Now takes `chatBot` instance in constructor
- `buildVoicePrompt()` is now **async**
- Calls distiller → analyzer → assembles optimized prompt
- Much smarter than previous static prompt

## Benefits

### Speed ⚡
- Personality distillation cached (30s TTL)
- Context analysis is fast (regex + heuristics)
- Final prompt still compact (~200-300 tokens)
- **Expected**: <1 second responses

### Depth 🧠
- Still uses ALL personality systems
- Responses reflect mood, fixations, mental state
- Adapts to conversation flow dynamically
- Not generic like before

### Scalability 📈
- Easy to add new personality signals to distiller
- Easy to add new context patterns to analyzer
- Separation of concerns (personality vs context)

## Current Status

✅ **CREATED** but not yet wired up:
- VoicePersonalityDistiller.js
- VoiceContextAnalyzer.js
- VoicePromptSystem.js updated

❌ **NEED TO DO**:
1. Update `src/bot/chatBot.js` to pass `currentMessage` to `buildVoicePrompt()`
2. Update `src/ai/aiEngine.js` to use the dynamic prompt instead of hardcoded strings
3. Make `buildVoicePrompt()` calls async
4. Test and tune thresholds

## Next Steps

Want me to wire it up now? This will replace the current simplified system with your intelligent two-stage approach.

The key advantage: **You get both speed AND personality** - it's not a trade-off anymore.
