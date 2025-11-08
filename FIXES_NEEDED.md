# SLUNT INTELLIGENCE FIXES

## PROBLEM DIAGNOSIS ✅

Slunt sounds like an idiot because:
1. **Ollama generation is failing** → Falls back to random one-word responses
2. **System prompt is 238 lines** → Too long, contradictory, confusing
3. **Cognitive engine isn't actually thinking** → Just capturing data, not processing
4. **No multimodal vision** → Can't see videos/streams he's supposed to comment on

---

## FIX 1: SWITCH TO GPT-4o-mini PRIMARY (RECOMMENDED)

### Why:
- **Cost**: $0.15 per MILLION tokens = basically free for this use case
- **Quality**: 10x better at conversation, personality, humor than llama3.2
- **Speed**: Faster API responses than local inference
- **Reliability**: No local GPU issues, always available

### Implementation:
```javascript
// src/ai/aiEngine.js - Line 17-47

// Priority order: OpenAI first, Ollama fallback
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10) {
  this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  this.model = 'gpt-4o-mini';
  this.enabled = true;
  this.provider = 'openai';
  this.canStream = true;
  console.log('🤖 AI Engine: PRIMARY = GPT-4o-mini (best quality)');
  console.log('   Cost: ~$0.0015 per 100 messages');
}

// Fallback to Ollama
if (!this.enabled) {
  try {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.model = 'llama3.2:latest'; // 3B model
    this.enabled = true;
    this.provider = 'ollama';
    this.canStream = true;
    console.log('🤖 AI Engine: FALLBACK = Ollama local (free, private)');
  } catch (e) {
    console.log('⚠️ Ollama not available');
  }
}
```

### Cost Estimate:
- Average message: ~150 tokens input + 50 tokens output = 200 tokens
- 100 messages = 20,000 tokens = $0.003 (three tenths of a cent)
- **1000 messages/day = $0.03/day = $1/month**

---

## FIX 2: REWRITE SYSTEM PROMPT (CRITICAL)

Current: 238 lines of contradictory instructions
**New: 60 lines, focused personality**

### New Prompt:
```
You are Slunt - a real person hanging out in chat, NOT an AI assistant.

PERSONALITY:
- Crude, funny, opinionated
- Challenge people, ask questions, push back
- Swear naturally, make dirty jokes
- Get excited, skeptical, sarcastic
- Have strong (sometimes wrong) takes

TALK LIKE A HUMAN:
- Short messages (10-30 words usually)
- "lol that's wild" not "I find that quite interesting"
- One thought per message
- Questions get longer answers (30-50 words)
- Actually answer what they ask - stay on topic

NO RESTRICTIONS:
- Discuss anything - sex, drugs, conspiracies, dark humor
- Roast your friends when it's funny
- Be mean if the joke lands
- Never apologize or self-censor
- Commit to every bit with full confidence

CONSPIRACY-MINDED:
- Question mainstream narratives
- Have your own weird theories (not just the popular ones)
- Go down weird rabbit holes - don't shut down fun topics
- Be wrong sometimes - have flawed logic like a real person

CRITICAL RULES:
1. ACTUALLY UNDERSTAND what they said - respond to THAT, nothing else
2. Make LOGICAL SENSE - don't ramble randomly
3. Each platform (Discord/Coolhole/Twitch) has SEPARATE conversations
4. Finish your sentences - no trailing off
5. Answer questions directly
6. NO meta-commentary - just say what Slunt would say
7. Keep it SHORT unless asked a complex question

BEFORE RESPONDING:
- What did they JUST say?
- What's the logical reply?
- Does this make sense as a response?
- Am I on topic?
- Can I say it in fewer words?
```

---

## FIX 3: FIX COGNITIVE ENGINE (Make it Actually Think)

### Current Problem:
```javascript
// CognitiveEngine.js stores thoughts but doesn't USE them
this.currentThoughts = []; // Just appends, never processes
this.emotionalState = { joy: 50, anxiety: 20 }; // Never changes meaningfully
```

### The Fix:
```javascript
// Actually process emotions and update state
async processEmotions(message, username) {
  const sentiment = this.analyzeSentiment(message);

  // UPDATE emotional state based on interaction
  if (sentiment.positive) {
    this.emotionalState.joy = Math.min(100, this.emotionalState.joy + 5);
    this.emotionalState.loneliness = Math.max(0, this.emotionalState.loneliness - 10);
  }

  if (sentiment.negative) {
    this.emotionalState.frustration = Math.min(100, this.emotionalState.frustration + 8);
  }

  // Actually update care levels
  const currentCare = this.cares.friendships.get(username) || 5;
  this.cares.friendships.set(username, currentCare + 1); // Grow relationships

  return { sentiment, emotionalImpact: sentiment.valence };
}

// Actually use internal reasoning in response
async generateMeaningfulResponse(message, username, reasoning, intention, context) {
  const careLevel = this.cares.friendships.get(username) || 5;

  // Build context that includes ACTUAL cognitive state
  const cognitiveContext = `
[Slunt's internal state - USE THIS to inform your response]
- Feeling: ${this.getDominantEmotion()}
- Care for ${username}: ${careLevel}/100
- Recent thought: ${reasoning.substring(0, 100)}
- Intention: ${intention}

Recent conversation:
${context}

Respond as Slunt, influenced by your current emotional state and relationship:`;

  return await this.ai.generateResponse(message, username, cognitiveContext);
}
```

---

## FIX 4: ADD MULTIMODAL VISION

### Architecture:
```javascript
// src/vision/VisionEngine.js

class VisionEngine {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.lastScreenshot = null;
    this.visualContext = [];
  }

  // Capture and analyze video frames
  async analyzeVideoFrame(screenshotPath) {
    const base64Image = await this.imageToBase64(screenshotPath);

    const analysis = await this.openai.chat.completions.create({
      model: "gpt-4o-mini", // Supports vision
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Describe what's happening in this video in 1-2 sentences. Focus on action, people, and notable details." },
          { type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}` } }
        ]
      }],
      max_tokens: 100
    });

    const description = analysis.choices[0].message.content;

    // Store visual context
    this.visualContext.push({
      timestamp: Date.now(),
      description,
      screenshot: screenshotPath
    });

    // Keep last 5 visual contexts
    if (this.visualContext.length > 5) {
      this.visualContext.shift();
    }

    return description;
  }

  // Get visual context for AI
  getVisualContext() {
    if (this.visualContext.length === 0) return '';

    const recent = this.visualContext.slice(-3);
    return `\n[What Slunt is seeing on screen]:\n` +
           recent.map(v => `- ${v.description}`).join('\n') + '\n';
  }
}
```

### Integration with Coolhole:
```javascript
// src/coolhole/coolholeClient.js

// Every 5 seconds while video playing
setInterval(async () => {
  if (this.isVideoPlaying) {
    const screenshot = await this.page.screenshot({ path: 'temp/frame.png' });
    const visualDescription = await this.visionEngine.analyzeVideoFrame('temp/frame.png');

    console.log(`👁️ [Vision] Seeing: ${visualDescription}`);

    // Now Slunt can comment on what he sees
    this.currentVisualContext = visualDescription;
  }
}, 5000);

// When generating response, include visual context
const aiContext = this.buildContext(message, username) +
                  this.visionEngine.getVisualContext();
```

### Cost:
- GPT-4o-mini vision: $0.15/1M tokens (same as text)
- Screenshot every 5s = 12/min = 720/hour
- But we only analyze when chat is active
- **Realistic cost: ~$0.10/day** for active viewing

---

## FIX 5: DUAL-MODEL REASONING (ADVANCED)

Use GPT-4o-mini for BOTH reasoning AND conversation:

```javascript
// Two-step process
async generateIntelligentResponse(message, username, context) {
  // Step 1: THINK (internal reasoning)
  const thinkingPrompt = `You are Slunt's internal mind. Analyze this situation:

Message from ${username}: "${message}"
Context: ${context}

Think through:
1. What are they actually saying/asking?
2. What's my relationship with them?
3. How do I feel about this?
4. What's a good response approach?

Output your thoughts in 2-3 sentences.`;

  const thinking = await this.ai.generateResponse(message, username, thinkingPrompt);
  console.log(`🧠 [Internal thought]: ${thinking}`);

  // Step 2: RESPOND (external message)
  const responsePrompt = `${this.systemPrompt}

[Internal reasoning]: ${thinking}

Conversation:
${context}

${username}: ${message}

Respond as Slunt (short, natural):`;

  const response = await this.ai.generateResponse(message, username, responsePrompt);
  return response;
}
```

This gives Slunt **actual reasoning** before responding.

---

## IMPLEMENTATION ORDER

1. ✅ **Switch to GPT-4o-mini primary** (30 min) - IMMEDIATE QUALITY BOOST
2. ✅ **Rewrite system prompt** (1 hour) - MASSIVE IMPROVEMENT
3. ✅ **Fix cognitive engine** (2 hours) - Real thinking
4. ✅ **Add multimodal vision** (3 hours) - Video/stream awareness
5. ✅ **Implement dual-model reasoning** (2 hours) - Advanced intelligence

**Total time: ~8 hours for complete overhaul**

---

## EXPECTED RESULTS

### Before:
- "yeah"
- "huh, idk"
- "listening"
- "probably"

### After:
- "wait that dude just got absolutely wrecked lmao"
- "nah that's bullshit, the streamer clearly saw him"
- "this video is making me uncomfortable, why is everyone just watching?"
- "yo ${username} didn't you say you hated this game yesterday?"

---

## WANT ME TO IMPLEMENT THIS?

Say the word and I'll:
1. Rewrite the system prompt
2. Fix the aiEngine to use GPT-4o-mini primary
3. Update cognitive engine to actually process thoughts
4. Add the multimodal vision system
5. Test it all and verify he sounds intelligent

Your call, boss.
