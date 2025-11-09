# Browser Search & Discord Reactions

## New Features Added

### 1. Browser-Based Search (NO API KEYS)
**File**: `src/bot/browserSearch.js`

Slunt can now search the web on his own using headless Puppeteer browser:
- **Google Images**: Scrapes image results for embarrassing/funny images
- **YouTube Videos**: Scrapes video results for pranks
- **NO API KEYS NEEDED**: Free, no rate limits, no costs
- **Contextual Queries**: Automatically generates search queries based on roasts

#### How It Works:
1. When Slunt roasts someone hard (roast level 9+), 8% chance to DM them
2. Browser searches Google/YouTube for contextual media
3. Sends image (Discord) or video (Coolhole) with AI-generated caption
4. All searches happen in headless browser - no external APIs

#### Search Query Examples:
- Roast about crying → searches "person crying embarrassing"
- Roast about being fat → searches "fat person eating food"
- Roast about being ugly → searches "ugly face"
- Generic roast → searches "embarrassing person funny"

### 2. Discord Reaction System
**Updated**: `src/bot/chatBot.js`

Slunt can now interact with Discord reactions:

#### Features:
1. **React to Reactions** (20% chance):
   - When someone reacts to Slunt's message
   - Slunt might comment: "knew you'd love that", "crying?", "exactly"
   - 5-minute cooldown per message to avoid spam

2. **Give Reactions** (5% chance):
   - Randomly reacts to other people's messages
   - Uses: 😂 💀 🤨 👍 🔥 💯 🗿 🤡
   - 2-minute cooldown between giving reactions

#### Configuration:
```javascript
// Cooldowns
this.reactionCooldown = 300000; // 5 min between commenting on reactions
this.reactionGiveCooldown = 120000; // 2 min between giving reactions

// Probabilities
- 20% chance to comment when someone reacts to Slunt
- 5% chance to give a reaction after processing a message
```

## Technical Details

### Browser Search Dependencies:
- **Puppeteer**: Already installed in package.json
- **Headless mode**: Runs invisibly in background
- **User agent spoofing**: Avoids bot detection
- **Graceful failures**: Silent fails if browser/search fails

### Integration Points:
1. **DM System**: Updated `sendPrankDM()` to use browserSearch instead of onlineMediaSearch
2. **Message Handler**: Calls `maybeGiveReaction()` after sending responses
3. **Discord Client**: Already has reaction event handlers built-in

### Files Modified:
- ✅ `src/bot/chatBot.js` - Added reaction handlers, updated DM to use browser
- ✅ `src/bot/browserSearch.js` - NEW: Headless browser search engine
- ✅ `server.js` - Removed duplicate reaction handler

## Testing:
1. **Browser Search**: Trigger a brutal roast (say something really dumb)
2. **Reactions**: React to one of Slunt's messages in Discord
3. **Random Reactions**: Chat normally and wait for Slunt to randomly react

## Notes:
- Browser searches are slower than API calls (5-10 seconds)
- DMs remain super rare (8% at roast level 9+, 1% random)
- Reactions don't spam - tight cooldowns prevent abuse
- All features degrade gracefully if they fail
