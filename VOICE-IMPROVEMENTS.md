# Voice Experience Improvements

## Current Issues Fixed ✅

1. **Generic Filler Removal**
   - Blocked: "lmaoooo you good man", "honestly though whatever", "could be wrong"
   - Result: More contextual, meaningful responses

2. **Cross-Platform Routing**
   - Fixed race condition causing responses on wrong platform
   - Voice responses now reliably go to voice client

3. **AI Prompt Optimization**
   - All providers now emphasize responding to ACTUAL topic
   - Reduced generic check-in phrases

---

## Recommended Improvements

### 🎤 1. Speech Recognition Quality

**Current State**: Using browser's Web Speech API (basic)

**Improvements**:

```javascript
// PRIORITY: Implement Whisper API for better accuracy
// src/voice/speechRecognition.js

class EnhancedSpeechRecognition {
  constructor() {
    this.useWhisper = true; // OpenAI Whisper API
    this.fallbackToWebSpeech = true;
  }

  async transcribe(audioBlob) {
    if (this.useWhisper) {
      // Send audio to Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en'); // or auto-detect
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: formData
      });
      
      return response.json();
    }
  }
  
  // Add punctuation correction
  fixPunctuation(text) {
    // Whisper often misses punctuation
    // Use AI to add proper punctuation and capitalization
    return this.aiEngine.generateCompletion(
      `Add proper punctuation and capitalization to: "${text}"`,
      { maxTokens: 100, temperature: 0.1 }
    );
  }
}
```

**Benefits**:
- 95%+ accuracy vs 70-80% with Web Speech API
- Better handling of accents, background noise
- Proper punctuation and capitalization
- Handles technical terms better

**Cost**: ~$0.006 per minute of audio

---

### 🧠 2. Context Understanding & Memory

**Current State**: Basic conversation history (8 exchanges)

**Improvements**:

```javascript
// src/voice/conversationContext.js

class VoiceConversationContext {
  constructor() {
    this.shortTermMemory = []; // Last 10 exchanges
    this.mediumTermMemory = []; // Last hour's topics
    this.longTermMemory = new Map(); // Persistent facts about user
    this.activeTopics = new Set(); // Currently discussed topics
    this.topicTransitions = []; // How topics flow
  }

  // Track what user cares about
  extractUserIntent(message) {
    const intents = {
      asking_question: /\?|what|how|why|when|where|who/i,
      sharing_opinion: /i think|i feel|imo|tbh|honestly/i,
      seeking_validation: /right\?|agree\?|don't you think/i,
      telling_story: /so (i was|this happened|yesterday)/i,
      making_joke: /lol|lmao|jk|kidding/i,
      expressing_emotion: /happy|sad|angry|excited|frustrated/i
    };
    
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(message)) return intent;
    }
    return 'casual_chat';
  }

  // Understand topic flow
  getTopicContext() {
    const recentTopics = this.mediumTermMemory.slice(-5).map(m => m.topic);
    const dominantTopic = this.getMostFrequentTopic(recentTopics);
    const topicAge = this.howLongOnTopic(dominantTopic);
    
    return {
      current: dominantTopic,
      minutesOnTopic: topicAge,
      shouldPivot: topicAge > 10, // Suggest topic change if too long
      relatedTopics: this.findRelatedTopics(dominantTopic)
    };
  }

  // Remember user preferences
  learnUserPreferences(message, sluntReply, userReaction) {
    // Track what user engages with
    if (userReaction === 'positive') {
      this.longTermMemory.set('likes_' + this.getCurrentTopic(), true);
    }
    
    // Learn communication style preferences
    if (message.length > 100) {
      this.longTermMemory.set('prefers_detailed_responses', true);
    }
    
    // Remember facts user shares
    const facts = this.extractFacts(message);
    facts.forEach(fact => {
      this.longTermMemory.set(fact.key, fact.value);
    });
  }

  // Extract facts from conversation
  extractFacts(message) {
    const facts = [];
    
    // "I work at X" → remember job
    const jobMatch = message.match(/i work (at|for) (\w+)/i);
    if (jobMatch) facts.push({ key: 'job', value: jobMatch[2] });
    
    // "I'm from X" → remember location
    const locationMatch = message.match(/i'?m from (\w+)/i);
    if (locationMatch) facts.push({ key: 'location', value: locationMatch[1] });
    
    // "I love X" → remember interests
    const interestMatch = message.match(/i love (\w+)/i);
    if (interestMatch) facts.push({ key: 'interest_' + interestMatch[1], value: true });
    
    return facts;
  }
}
```

**Benefits**:
- Slunt remembers previous conversations
- Can reference things user said 30 minutes ago
- Understands when to pivot topics
- Builds relationship over time

---

### 🎯 3. Intent-Based Response Generation

**Current State**: One-size-fits-all responses

**Improvements**:

```javascript
// src/voice/intentHandler.js

class IntentBasedResponder {
  async generateResponse(message, intent, context) {
    const strategies = {
      asking_question: this.answerQuestion,
      sharing_opinion: this.engageWithOpinion,
      seeking_validation: this.provideValidation,
      telling_story: this.reactToStory,
      making_joke: this.playAlong,
      expressing_emotion: this.showEmpathy
    };
    
    const handler = strategies[intent] || this.casualResponse;
    return await handler.call(this, message, context);
  }

  async answerQuestion(message, context) {
    // For questions: be informative, concise, then add personality
    const prompt = `User asked: "${message}"
    
Context: ${context}

Give a helpful answer (2-3 sentences), then add your sarcastic take. Be informative first, witty second.`;
    
    return await this.aiEngine.generate(prompt, { 
      maxTokens: 200, 
      temperature: 0.7 
    });
  }

  async engageWithOpinion(message, context) {
    // For opinions: agree/disagree, add nuance
    const prompt = `User's opinion: "${message}"

Context: ${context}

Engage with their opinion. ${Math.random() < 0.3 ? 'Agree and expand on it.' : 'Offer a different perspective or nuance.'}
Be conversational, not preachy. 2-3 sentences.`;
    
    return await this.aiEngine.generate(prompt);
  }

  async reactToStory(message, context) {
    // For stories: show interest, ask follow-up
    const prompt = `User's story: "${message}"

Context: ${context}

React to their story naturally. Show interest. Maybe ask a follow-up question or relate it to something. 
Be engaged, not just "cool story bro". 2-3 sentences.`;
    
    return await this.aiEngine.generate(prompt);
  }
}
```

**Benefits**:
- Responses match what user is trying to do
- Questions get actual answers (not just "idk man")
- Stories get engaged reactions
- Jokes get playful responses

---

### 🗣️ 4. Conversational Flow & Turn-Taking

**Current State**: Wait for user to finish, then respond

**Improvements**:

```javascript
// src/voice/conversationFlow.js

class ConversationFlowManager {
  constructor() {
    this.silenceThreshold = 1500; // ms
    this.interruptThreshold = 3000; // Allow interrupts after 3s of Slunt talking
    this.backchanneling = true; // "mhm", "yeah", "right" during user speech
  }

  // Detect natural conversation pauses
  async handleSilence(duration, lastMessage) {
    if (duration < 500) return 'continue_listening';
    
    if (duration > 1500 && this.isCompleteThought(lastMessage)) {
      return 'respond_now';
    }
    
    if (duration > 3000) {
      // Long silence - check if user needs prompting
      const needsPrompt = this.shouldPrompt(lastMessage);
      return needsPrompt ? 'prompt_user' : 'respond_now';
    }
    
    return 'wait';
  }

  // Add conversational backchanneling
  getBackchannel(userSpeechDuration, sentiment) {
    // Short "mhm" sounds during user's longer statements
    if (userSpeechDuration > 5000 && Math.random() < 0.3) {
      if (sentiment === 'negative') return 'damn';
      if (sentiment === 'exciting') return 'no way';
      return Math.random() < 0.5 ? 'yeah' : 'mhm';
    }
    return null;
  }

  // Allow natural interruptions
  handleInterrupt(userStartedSpeaking, sluntIsSpeaking) {
    if (sluntIsSpeaking && userStartedSpeaking) {
      // User is interrupting - stop Slunt immediately
      this.stopCurrentResponse();
      return 'listen_to_interrupt';
    }
  }

  // Detect incomplete thoughts
  isCompleteThought(text) {
    // Check if sentence feels complete
    const endsWithPunctuation = /[.!?]$/.test(text);
    const hasConjunction = /\b(and|but|or|because|so)\s*$/.test(text);
    const isQuestion = /^(what|how|why|when|where|who)\b/i.test(text);
    
    if (hasConjunction) return false; // "I went to the store and..." (incomplete)
    if (isQuestion && !endsWithPunctuation) return false; // "what do you" (incomplete)
    
    return endsWithPunctuation || text.split(' ').length > 10; // Long enough = probably complete
  }

  // Prompt user if needed
  async generatePrompt(context) {
    // If user trails off, help continue conversation
    const prompts = [
      "what were you saying?",
      "go on",
      "and then?",
      "what happened?",
      "yeah?"
    ];
    
    return prompts[Math.floor(Math.random() * prompts.length)];
  }
}
```

**Benefits**:
- More natural conversation rhythm
- Slunt doesn't wait awkwardly for exact silence
- Can interrupt Slunt naturally
- Backchanneling makes it feel like Slunt is listening

---

### 🎨 5. Prosody & Emotional Expression (TTS)

**Current State**: XTTS with Hoff voice (good!)

**Improvements**:

```javascript
// src/voice/prosodyControl.js

class ProsodyController {
  adjustTTSParameters(text, emotion, context) {
    // Vary TTS parameters based on emotion and content
    const baseParams = {
      temperature: 0.7,
      speed: 1.0,
      pitch: 1.0,
      energy: 1.0
    };

    // Emotional modulation
    if (emotion === 'excited') {
      baseParams.speed = 1.15; // Talk faster
      baseParams.pitch = 1.1; // Slightly higher
      baseParams.energy = 1.3; // More dynamic
    }
    
    if (emotion === 'sad' || emotion === 'thoughtful') {
      baseParams.speed = 0.9; // Talk slower
      baseParams.pitch = 0.95; // Slightly lower
      baseParams.energy = 0.8; // Less dynamic
    }
    
    if (emotion === 'sarcastic') {
      baseParams.pitch = 0.92; // Flatter delivery
      baseParams.energy = 0.9; // Less enthusiastic
    }

    // Add pauses for emphasis
    text = this.addStrategicPauses(text, emotion);
    
    // Emphasize key words
    text = this.addEmphasis(text);
    
    return { text, ...baseParams };
  }

  addStrategicPauses(text, emotion) {
    // Add SSML-like pauses
    // "well... [pause] that's interesting" for sarcasm
    
    if (emotion === 'sarcastic' && Math.random() < 0.4) {
      text = text.replace(/^(\w+)/, '$1... '); // Pause after first word
    }
    
    // Pause before punchlines
    text = text.replace(/(\. )(but |however |though )/gi, '$1[pause]$2');
    
    return text;
  }

  addEmphasis(text) {
    // Find words to emphasize
    const emphasisWords = ['really', 'actually', 'literally', 'never', 'always', 'definitely'];
    
    emphasisWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      text = text.replace(regex, `**${word}**`); // TTS marker for emphasis
    });
    
    return text;
  }

  // Add vocal fillers for realism
  addVocalFillers(text) {
    // Insert "uh", "um", "like" occasionally (sparingly!)
    if (Math.random() < 0.15 && text.split(' ').length > 8) {
      const fillers = ['uh', 'um', 'like'];
      const filler = fillers[Math.floor(Math.random() * fillers.length)];
      
      // Insert after first few words
      const words = text.split(' ');
      words.splice(3, 0, filler + ',');
      return words.join(' ');
    }
    return text;
  }
}
```

**Benefits**:
- Emotional variety in speech
- Strategic pauses for effect
- Emphasis on important words
- Subtle vocal fillers for realism

---

### 📊 6. Conversation Analytics & Adaptation

**Current State**: No learning from voice conversations

**Improvements**:

```javascript
// src/voice/conversationAnalytics.js

class ConversationAnalytics {
  constructor() {
    this.metrics = {
      avgResponseTime: [],
      topicEngagement: new Map(), // topic -> engagement score
      preferredResponseLength: [],
      positiveReactions: 0,
      negativeReactions: 0,
      interruptions: 0,
      userSpeechDuration: [],
      sluntSpeechDuration: []
    };
  }

  // Detect user engagement
  measureEngagement(userMessage, previousMessage) {
    let score = 0;
    
    // Quick response = engaged
    const responseTime = Date.now() - previousMessage.timestamp;
    if (responseTime < 3000) score += 2;
    
    // Longer message = engaged
    if (userMessage.length > 50) score += 2;
    
    // Follow-up question = very engaged
    if (userMessage.includes('?')) score += 3;
    
    // Positive reaction words
    if (/\b(yeah|true|exactly|lol|haha|nice)\b/i.test(userMessage)) score += 2;
    
    // Topic continuation = engaged
    if (this.isSameTopic(userMessage, previousMessage)) score += 1;
    
    return score; // 0-10 scale
  }

  // Adapt response style based on analytics
  adaptResponseStyle() {
    const avgEngagement = this.getAverageEngagement();
    
    if (avgEngagement < 4) {
      // User seems disengaged
      return {
        strategy: 'provocative',
        responseLength: 'short',
        tone: 'more_engaging',
        suggestion: 'Ask provocative questions or change topic'
      };
    }
    
    if (avgEngagement > 7) {
      // User is very engaged
      return {
        strategy: 'deep_dive',
        responseLength: 'longer',
        tone: 'thoughtful',
        suggestion: 'Go deeper on current topic'
      };
    }
    
    return {
      strategy: 'balanced',
      responseLength: 'medium',
      tone: 'casual'
    };
  }

  // Learn optimal response timing
  getOptimalResponseDelay() {
    // Average user's speech duration
    const avgUserDuration = this.average(this.metrics.userSpeechDuration);
    
    // If user speaks for 5+ seconds, they expect thoughtful responses
    if (avgUserDuration > 5000) return 1500; // 1.5s delay (thinking)
    
    // Quick back-and-forth
    return 800; // 0.8s delay (snappy)
  }

  // Track what topics work
  rankTopicsByEngagement() {
    return Array.from(this.metrics.topicEngagement.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 topics
  }
}
```

**Benefits**:
- Slunt learns what you like talking about
- Adapts response length to your preference
- Knows when you're bored and pivots
- Gets better over time

---

### 🔊 7. Audio Quality & Processing

**Improvements**:

```javascript
// src/voice/audioProcessor.js

class AudioProcessor {
  constructor() {
    this.noiseSuppression = true;
    this.echoCancellation = true;
    this.autoGain = true;
  }

  // Enhance input audio before sending to STT
  async preprocessAudio(audioBlob) {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Apply filters
    const filtered = this.applyNoiseGate(audioBuffer);
    const normalized = this.normalizeVolume(filtered);
    
    return this.audioBufferToBlob(normalized);
  }

  applyNoiseGate(audioBuffer) {
    // Remove background noise below threshold
    const threshold = 0.02; // -40dB
    
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) < threshold) {
        channelData[i] = 0;
      }
    }
    
    return audioBuffer;
  }

  normalizeVolume(audioBuffer) {
    // Normalize to consistent volume level
    const channelData = audioBuffer.getChannelData(0);
    
    // Find peak
    let peak = 0;
    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > peak) peak = abs;
    }
    
    // Normalize to 0.9
    const gain = 0.9 / peak;
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] *= gain;
    }
    
    return audioBuffer;
  }

  // Enhance output audio (TTS)
  async enhanceTTS(audioUrl) {
    // Add subtle compression and EQ for better clarity
    // This would require audio processing library or server-side processing
    return audioUrl;
  }
}
```

**Benefits**:
- Clearer voice recognition
- Consistent volume levels
- Less background noise interference
- Better overall audio quality

---

## Implementation Priority

### Phase 1 (Quick Wins) - 1-2 days
1. ✅ Generic filler removal (DONE)
2. ✅ Cross-platform routing fix (DONE)
3. Intent-based response generation (add to chatBot.js)
4. Conversation analytics (track engagement)

### Phase 2 (Medium Impact) - 3-5 days
1. Enhanced context tracking (short/medium/long-term memory)
2. Conversational flow improvements (silence detection, prompting)
3. Prosody control (emotional TTS modulation)

### Phase 3 (High Impact) - 1-2 weeks
1. Whisper API integration (better STT)
2. Audio preprocessing (noise reduction)
3. Advanced conversation analytics (learning system)

### Phase 4 (Polish) - Ongoing
1. Backchanneling ("mhm" during speech)
2. Natural interruption handling
3. Vocal filler insertion (subtle realism)

---

## Estimated Costs

**Per Hour of Voice Conversation**:
- Whisper STT: ~$0.36 (60 min @ $0.006/min)
- Claude 3.5 Haiku: ~$0.15 (assuming 1000 exchanges @ 500 tokens each)
- XTTS TTS: Free (self-hosted)

**Total**: ~$0.51/hour

**For 10 hours/day**: ~$5.10/day = ~$150/month

---

## Quick Code Snippet: Intent Detection

```javascript
// Add to src/bot/chatBot.js

detectVoiceIntent(message) {
  const intents = {
    asking_question: {
      pattern: /\?|^(what|how|why|when|where|who|which|whose|whom)\b/i,
      responseStyle: 'informative_then_personality'
    },
    sharing_opinion: {
      pattern: /\b(i think|i feel|imo|in my opinion|tbh|honestly|i believe)\b/i,
      responseStyle: 'engage_with_opinion'
    },
    seeking_validation: {
      pattern: /\bright\?|agree\?|don't you think|wouldn't you say/i,
      responseStyle: 'validate_or_challenge'
    },
    telling_story: {
      pattern: /\b(so i|this happened|yesterday|last night|one time)\b/i,
      responseStyle: 'engaged_listener'
    },
    making_joke: {
      pattern: /\b(lol|lmao|jk|kidding|joking|haha)\b/i,
      responseStyle: 'play_along'
    },
    expressing_emotion: {
      pattern: /\b(happy|sad|angry|excited|frustrated|annoyed|love|hate)\b/i,
      responseStyle: 'empathetic'
    },
    casual_chat: {
      pattern: /.*/,
      responseStyle: 'conversational'
    }
  };

  for (const [intent, config] of Object.entries(intents)) {
    if (config.pattern.test(message)) {
      return { intent, responseStyle: config.responseStyle };
    }
  }

  return { intent: 'casual_chat', responseStyle: 'conversational' };
}

// Modify voice response generation
async generateVoiceResponse(message, username, context) {
  const { intent, responseStyle } = this.detectVoiceIntent(message);
  
  console.log(`🎯 [Voice Intent] Detected: ${intent} → ${responseStyle}`);
  
  // Adjust prompt based on intent
  let styleGuidance = '';
  
  switch (responseStyle) {
    case 'informative_then_personality':
      styleGuidance = 'Answer their question directly first (1-2 sentences), then add your witty take.';
      break;
    case 'engage_with_opinion':
      styleGuidance = 'Engage with their opinion. Agree and expand, or offer a different angle. Be conversational.';
      break;
    case 'validate_or_challenge':
      styleGuidance = Math.random() < 0.6 ? 'Validate their point.' : 'Offer a counterpoint playfully.';
      break;
    case 'engaged_listener':
      styleGuidance = 'React to their story. Show interest. Maybe ask a follow-up or relate it to something.';
      break;
    case 'play_along':
      styleGuidance = 'Play along with the joke or add to it. Keep the energy up.';
      break;
    case 'empathetic':
      styleGuidance = 'Acknowledge their emotion. Be supportive or understanding.';
      break;
    default:
      styleGuidance = 'Respond naturally and conversationally.';
  }
  
  // Add style guidance to context
  const enhancedContext = context + `\n\n[Style: ${styleGuidance}]`;
  
  // Generate with AI
  return await this.ai.generateResponse(message, username, enhancedContext, 150, true);
}
```

---

## Testing Improvements

Create test scenarios:

1. **Question Test**: "What's the best programming language?"
   - Expected: Actual answer + Slunt's opinion
   
2. **Story Test**: "So yesterday I was at the store and this guy..."
   - Expected: Engaged reaction, follow-up question
   
3. **Opinion Test**: "I think pineapple on pizza is good"
   - Expected: Agree/disagree with reasoning
   
4. **Emotion Test**: "I'm so frustrated with this code"
   - Expected: Empathetic response

5. **Long Silence Test**: (5 seconds of silence)
   - Expected: Prompt like "what were you thinking?" or topic pivot

---

## Conclusion

The voice experience can be dramatically improved by:
1. Better understanding what user wants (intent detection)
2. Remembering conversation context (memory system)
3. Adapting response style to intent
4. More natural conversation flow (timing, interrupts, backchanneling)
5. Better audio quality (Whisper STT, audio processing)

**Start with**: Intent detection + context tracking (Phase 1)
**Biggest impact**: Whisper STT + intent-based responses (Phase 2-3)
**Polish**: Natural flow features (Phase 4)
