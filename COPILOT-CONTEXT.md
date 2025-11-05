# Copilot Context for Slunt Project

## Project Overview
Slunt is a Node.js chatbot for Coolhole.org (CyTube-based platform) with a complex personality system, virtual economy (CoolPoints), and multi-platform support (CyTube, Discord, Twitch, Voice).

## Critical Architecture Rules

### 1. Voice System (RECENTLY OVERHAULED - Nov 2024)
- **Voice is ISOLATED**: Uses separate `voiceMemory` array (NOT chat memory)
- **Data Structure**: `{ speaker: 'You'/'Slunt', text: string, timestamp: number }`
  - NOTE: Uses `speaker` field, NOT `role` (common mistake!)
- **Context Format**: "Them: user message" / "You (Slunt): AI response"
  - This prevents identity confusion where AI thinks user is Slunt
- **Voice Exemptions**: Voice mode has special exemptions from:
  - Repetition filters (3 filters disabled for voice)
  - Response modifiers (negging, mental break, needs, hallucination)
  - Aggressive truncation (has its own expanded limits)
  - StreamingConsciousness (reduced to 1% for voice vs 12% for text)

### 2. Voice Response Limits (EXPANDED for natural conversation)
**Location**: `src/bot/chatBot.js`
- Line 642: `voice: { maxWords: 150, maxChars: 800 }` (NOT 50/300!)
- Line 4455: `voiceMaxTokens = 350` (NOT 150!)
- Line 4382: Log message reflects 350-400 tokens

**Why expanded?**: Original 150 tokens = ~20-25 words caused mid-thought truncation. Now 350 tokens = ~60-70 words allows 2-3 complete sentences.

### 3. Response Truncation System
**Location**: `src/core/ResponsePolicy.js` lines 234-270
- `enforceConcision()` has MULTIPLE hard truncation points:
  - Sentence truncation (line 243) - EXEMPTS voice
  - Word limit (line 250-253)
  - Character limit (line 256-266)
- **Platform-specific limits** defined in ResponsePolicy constructor

### 4. Memory Systems
- **Regular Chat**: Uses `this.memory` (long-term) and conversation memory
- **Voice Chat**: Uses `this.voiceMemory` (isolated, max 30 messages)
- **Storage**: voiceMemory persists via `server.js` lines 440-468
- **NEVER mix these two systems!**

### 5. AI Generation
**Location**: `src/bot/chatBot.js` lines 4450-4465
- Voice uses: 350 tokens, temp 0.92, 2048 context
- Text uses: 300 tokens, temp 0.8, 8192 context
- Model: Ollama llama3.2:latest

## Common Pitfalls

### ❌ DON'T:
1. Use `role` field in voiceMemory (use `speaker`)
2. Let voice responses use text chat memory
3. Apply text chat filters/modifiers to voice
4. Reduce voice token limits below 300 (causes truncation)
5. Change ResponsePolicy limits without checking voice preset
6. Assume voice and text work the same way

### ✅ DO:
1. Keep voice memory isolated from chat memory
2. Use "Them"/"You (Slunt)" format for voice context
3. Check if `platform === 'voice'` before applying filters
4. Test BOTH voice and text after changes
5. Preserve voice exemptions when adding new features
6. Read existing code before modifying behavior

## Recent Fixes (Nov 2024)
**10 voice system fixes completed:**
1. ✅ voiceMemory persistence (wasn't saving)
2. ✅ voiceMemory data structure (role → speaker)
3. ✅ Control phrase filter ("start listening", "stop")
4. ✅ Repetition filters disabled for voice
5. ✅ Response modifiers disabled for voice
6. ✅ StreamingConsciousness reduced (12%→1%)
7. ✅ Trailing garbage cleanup (11 regex patterns)
8. ✅ Mood [object object] fix
9. ✅ Voice identity confusion (Them vs You labeling)
10. ✅ Response length limits expanded (150→350 tokens)

**All voice-specific code uses**: `if (platform === 'voice')` or `if (isVoice)` checks

## File Organization
```
server.js                          # Express server, /api/voice endpoint (lines 434-480)
src/bot/chatBot.js                 # Main bot logic, voice exemptions throughout
src/core/ResponsePolicy.js         # Truncation logic (lines 234-270)
src/coolpoints/coolPointsManager.js # CoolPoints economy
src/cytube/cyTubeClient.js         # CyTube integration
public/index.html                  # Web dashboard
data/*.json                        # All persistent storage
```

## Key Search Patterns
- Voice checks: `grep "platform === 'voice'" or "isVoice"`
- Token limits: `grep "maxTokens|voiceMaxTokens"`
- Response limits: `grep "maxWords|maxChars"`
- Memory: `grep "voiceMemory"`
- Truncation: `grep "enforceConcision|truncat"`

## Testing Voice
1. Start server: `npm start`
2. Open: http://localhost:3000/voice
3. Grant microphone permission
4. Test 2-3 sentence responses complete without truncation
5. Verify no identity confusion ("I" vs "Slunt said")
6. Check voiceMemory persists between requests

## Environment
- Node.js with Express
- Ollama for AI (llama3.2:latest)
- ElevenLabs for TTS
- Browser Speech Recognition API
- WebSocket (Socket.IO) for real-time

## Debugging Voice Issues
1. Check console logs for "🎤 [VOICE MODE]" or "[Voice]"
2. Verify voiceMemory structure: `speaker` field exists
3. Check token limits haven't been reduced
4. Confirm ResponsePolicy exempts voice from sentence truncation
5. Test with 2-3 sentence prompt to verify no mid-thought cuts

## Philosophy
- Voice should be CONVERSATIONAL and NATURAL
- Text chat can be chaotic/edgy/unpredictable
- CoolPoints system is SATIRICAL (debt penalties are humor)
- Slunt has complex personality (mental states, addictions, contradictions)
- Event-driven architecture for real-time features

## Next Developer: Start Here
1. Read this file completely
2. Check `src/bot/chatBot.js` for voice exemptions (search "voice")
3. Test voice mode before making changes
4. Preserve voice isolation when adding features
5. Ask about voice-specific behavior before changing it

---
**Last Updated**: November 4, 2024
**Voice System Status**: FULLY FUNCTIONAL after 10-fix overhaul
**DO NOT reduce voice token limits below 300 or you'll break conversation flow!**
