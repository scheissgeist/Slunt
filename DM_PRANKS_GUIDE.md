# DM/PM Prank System Guide

Slunt can now slide into DMs to talk shit and send embarrassing videos as pranks.

## Features

### 🎯 Smart DM Decision Logic
- **After Hard Roasts**: 30% chance to DM someone after roasting them (roast level > 7)
- **Random Pranks**: 5% random chance to prank someone
- **Cooldown System**: 5-minute cooldown per user to prevent spam
- **Platform-Specific**: Works on Discord (DMs) and Coolhole (PMs)

### 😈 Prank Video Library
Located in `src/bot/prankVideos.js`:

**Categories:**
- `you` - "here's u" pranks (crying baby, screaming goat, dramatic chipmunk)
- `crying` - Emotional/crying videos
- `cringe` - Rickroll, Gangnam Style, Rebecca Black Friday
- `losers` - Animal fails and loser compilations
- `fails` - Epic fail compilations
- `weird` - Weird/creepy videos (Keyboard Cat, etc.)

**Prank Messages:**
- "here's u"
- "this u?"
- "found ur home video"
- "leaked footage of u"
- "bro check this out it's literally you"
- "watch this and think about what you've become"

### 💬 Discord DM Features
**Methods:**
- `sendDM(userId, content, options)` - Send DM to Discord user by ID
- `sendDMByUsername(username, content, guildId)` - Send DM by username/display name

**Usage:**
```javascript
// Direct DM by user ID
await this.discordClient.sendDM('123456789', 'yo check this out');

// DM by username (searches all guilds)
await this.discordClient.sendDMByUsername('orbmeat', 'here\'s u', guildId);
```

### 📱 Coolhole PM Features
**Methods:**
- `sendPM(username, message)` - Send private message via `/pm` command
- `prankWithVideo(username, message, videoUrl)` - Queue video + send PM prank

**Usage:**
```javascript
// Simple PM
await this.coolholeClient.sendPM('grug', 'bruh what are you doing');

// Prank with video (queues video then PMs them)
await this.coolholeClient.prankWithVideo(
  'grug', 
  'here\'s u',
  'https://www.youtube.com/watch?v=ee925OTFBCA'
);
```

### 🤖 Automated DM Logic
Located in `chatBot.js`:

**`shouldSendDM(username, userId, platform, context)`**
- Checks cooldown (5 min per user)
- 30% chance after hard roast (roast level > 7)
- 5% random prank chance

**`sendPrankDM(username, userId, platform, options)`**
- Sends DM/PM with optional prank video
- Randomly selects prank from library
- Tracks cooldown automatically

**`considerDM(username, userId, platform, responseContext)`**
- Called automatically after bot responds
- Decides if/when to DM based on response content
- Detects roasts and calculates roast level
- Sends appropriate prank video

### 🎭 How It Works

1. **Bot responds to someone in chat** (regular message)
2. **Analyzes response**: Checks for roast words (shit, dumb, stupid, trash, etc.)
3. **Calculates roast level**: Counts roast words + base 5
4. **Decides to DM**:
   - Hard roast (level > 7): 30% chance
   - Random: 5% chance
   - Checks 5-min cooldown
5. **Sends prank**:
   - Discord: DM with roast/prank message
   - Coolhole: PM + queue embarrassing video
6. **Cooldown set**: Won't DM same person for 5 minutes

### 📊 Example Flow

```
User: "yo slunt you suck"
Slunt: "grug you dumb shit, go back to your cave you absolute loser"
        ↓
     [Roast detected: level 8]
        ↓
     [30% chance rolls: SUCCESS]
        ↓
     [DM sent to grug]
        ↓
DM: "here's u" + crying baby video queued
```

### 🔧 Configuration

**Cooldown (in chatBot.js constructor):**
```javascript
this.dmCooldown = 300000; // 5 minutes (milliseconds)
```

**Adjust probabilities (in shouldSendDM):**
```javascript
if (context.isRoast && context.roastLevel > 7) {
  return Math.random() < 0.30; // 30% after hard roast
}

if (Math.random() < 0.05) { // 5% random prank
  return true;
}
```

**Roast detection (in considerDM call):**
```javascript
const isRoast = /shit|dumb|stupid|trash|cringe|loser|pathetic/i.test(response);
const roastLevel = isRoast ? (response.match(/shit|fuck|dumb|stupid/gi) || []).length + 5 : 0;
```

### 🎪 Customization

**Add new prank videos** in `src/bot/prankVideos.js`:
```javascript
PRANK_VIDEOS.yourCategory = [
  'https://www.youtube.com/watch?v=...',
  // ...
];
```

**Add new prank messages**:
```javascript
PRANK_MESSAGES.yourType = [
  'new prank message',
  // ...
];
```

### 🚀 Commands

No manual commands - DMs/PMs happen automatically based on:
- Roast severity
- Random chance
- User cooldowns

### ⚠️ Notes

- **Coolhole PMs**: Use `/pm` command syntax, works when logged in
- **Discord DMs**: Require proper permissions (can DM users in shared servers)
- **Rate Limiting**: 
  - Discord: 3 seconds between DMs
  - Coolhole: Uses existing sendChat rate limiting
- **Cooldown Tracking**: Stored in memory (resets on bot restart)
- **Video Queuing**: Only works on Coolhole (Discord just sends text)

### 🎯 Smart Features

- **No spam**: 5-minute cooldown per user
- **Context-aware**: Different pranks for roasts vs random
- **Platform-specific**: DMs on Discord, PMs + videos on Coolhole
- **Natural**: Integrated into normal conversation flow
- **Savage**: Matches Slunt's roasting personality

## Architecture

```
chatBot.js (main logic)
├── handleMessage()
│   └── considerDM() ← Called after responding
│       ├── shouldSendDM() ← Decision logic
│       └── sendPrankDM() ← Execution
│           ├── discordClient.sendDM() ← Discord
│           └── coolholeClient.prankWithVideo() ← Coolhole
│
prankVideos.js (content library)
├── PRANK_VIDEOS (categories)
├── PRANK_MESSAGES (message templates)
└── getCompletePrank() ← Random selection
```

## Status

✅ **FULLY OPERATIONAL**
- Discord DMs working
- Coolhole PMs working  
- Coolhole video pranks working
- Automatic decision logic active
- 5-minute cooldowns enforced
- Roast detection working
- Random pranks enabled (5% chance)

Slunt is now ready to slide into DMs and talk shit in private! 😈
