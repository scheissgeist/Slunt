# Slunt Bot TODO List

## Deferred Features

These features are marked as TODO in the codebase but are intentionally deferred for future implementation.

### 1. Reaction Tracking (chatBot.js:836)
**Location**: `src/bot/chatBot.js` line 836  
**Description**: Implement reaction tracking for messages across all platforms  
**Status**: Deferred - Waiting for platform API support  
**Priority**: Low  
**Notes**:
- Discord has reaction tracking via `messageReactionAdd` events
- Twitch reactions are limited to emotes in chat (already tracked)
- Coolhole reaction tracking needs investigation
- Current workaround: Track emote/reaction keywords in messages

**Implementation Plan**:
```javascript
// Discord reaction tracking (already available)
discordClient.on('messageReactionAdd', (reaction, user) => {
  // Track reaction data
});

// Twitch: Parse emote usage from chat messages
// Coolhole: TBD based on API capabilities
```

---

### 2. Video Queueing (chatBot.js:1204)
**Location**: `src/bot/chatBot.js` line 1204  
**Description**: Implement `coolhole.queueVideo()` functionality  
**Status**: Deferred - Waiting for Coolhole API method  
**Priority**: Medium  
**Notes**:
- Coolhole client needs `queueVideo()` method added to `coolholeClient.js`
- Requires Playwright automation to interact with Coolhole's queue interface
- May need OCR/vision to detect queue state
- Current workaround: Manual video requests

**Implementation Plan**:
```javascript
// In coolholeClient.js
async queueVideo(url, position = 'end') {
  // Use Playwright to:
  // 1. Click "Add to Queue" button
  // 2. Input video URL
  // 3. Confirm addition
  // 4. Return queue position
}

// In chatBot.js
async handleVideoRequest(url, username) {
  const position = await this.coolholeClient.queueVideo(url);
  return `Added to queue at position ${position}`;
}
```

---

### 3. Response Length Selection (chatBot.js:2492)
**Location**: `src/bot/chatBot.js` line 2492  
**Description**: Implement `chooseResponseLength()` function  
**Status**: Deferred - Needs AI response variability system  
**Priority**: Low  
**Notes**:
- Current system uses fixed-length AI responses
- Need dynamic length selection based on context:
  - Short (1-5 words): Quick reactions, acknowledgments
  - Medium (5-15 words): Normal conversation
  - Long (15+ words): Explanations, storytelling
- Should factor in:
  * Chat activity level
  * Conversation depth
  * User engagement
  * Platform (Twitch favors shorter)

**Implementation Plan**:
```javascript
chooseResponseLength(context) {
  // High activity = short responses
  if (context.chatActivity === 'high') return 'short';
  
  // Deep conversation = longer responses
  if (context.conversationDepth > 5) return 'long';
  
  // Questions deserve detail
  if (context.isQuestion) return 'medium';
  
  // Default
  return 'medium';
}

// Integrate with AI generation
const lengthHint = this.chooseResponseLength(context);
const prompt = `Respond in ${lengthHint} format (${lengthHint === 'short' ? '1-5' : lengthHint === 'medium' ? '5-15' : '15-30'} words):\n${message}`;
```

---

## Future Enhancements

### Platform Integration
- [ ] Full Coolhole video queue management
- [ ] Cross-platform reaction aggregation
- [ ] Platform-specific response formatting

### AI Improvements
- [ ] Dynamic response length system
- [ ] Context-aware verbosity adjustment
- [ ] Multi-message storytelling

### Performance
- [ ] Response caching for common queries
- [ ] Message queue optimization
- [ ] Memory usage profiling

---

## Completed Fortifications (Latest)

### Security & Reliability
- [x] Added timeout protection to all Twitch API calls
- [x] Implemented rate limit detection and backoff
- [x] Added proper error handling in ClipCreator
- [x] Enhanced StreamStatusMonitor resilience
- [x] Added Socket.IO error handlers
- [x] Ensured PersonalityScheduler cleanup on shutdown
- [x] Fixed CSS cross-browser compatibility

### Code Quality
- [x] Archived backup files to `/archive` folder
- [x] Removed temporary .temp.js files
- [x] Added graceful shutdown for all timers/intervals

---

## Notes for Future Development

- When implementing reaction tracking, ensure platform parity
- Video queueing should respect Coolhole's rate limits
- Response length system should integrate with existing personality modes
- All new features should include proper error handling and logging
- Consider adding feature flags for gradual rollout
