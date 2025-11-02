# 👁️ Slunt Vision & Video Commentary System

## Overview
Slunt can now **SEE** what's happening on Coolhole and **spontaneously comment** on videos!

## What Was Implemented

### 1. ✅ Vision Context in Responses
- **getLatestAnalysis()** method added to VisionAnalyzer
- Returns: video title, playback status, progress, detected text, scene changes, brightness
- Fresh vision data (last 30 seconds) is included in EVERY response

### 2. 🎬 VideoCommentary System (`src/ai/VideoCommentary.js`)
Slunt spontaneously reacts to videos based on:

**Triggers & Chances:**
- Base chance: **5%** every screenshot (15 seconds)
- +30% if video title matches interests (anime, gaming, memes, horror, etc.)
- +20% if scene just changed (NEW video started)
- +15% if mood is excited/curious/playful
- +25% if video matches current obsession
- +20% if bored (looking for entertainment)
- +10% if video is actively playing
- +15% if OCR detects interesting text

**Max chance: ~43%** when all conditions met!

**Interest Triggers:**
```javascript
'anime', 'gaming', 'meme', 'shitpost', 'cringe', 'based',
'music', 'vtuber', 'speedrun', 'drama', 'react', 'review',
'broteam', 'jerma', 'vinny', 'joel', 'northernlion',
'dark souls', 'elden ring', 'bloodborne', 'sekiro',
'rimworld', 'dwarf fortress', 'factorio', 'terraria',
'documentary', 'iceberg', 'deep dive', 'analysis',
'horror', 'scary', 'creepy', 'cursed', 'weird'
```

### 3. 🧠 Enhanced Vision Context in AI Prompts
ContextManager now includes detailed video info:
- 🎬 Video title
- ▶️ Playing/paused status
- ⏱️ Progress percentage and timestamps
- 🆕 Scene change indicators
- 📝 Text detected on screen (OCR)
- 🎨 Brightness/mood (dark/bright)

### 4. 🤖 Spontaneous Comment Generation
New `generateSpontaneousComment()` method:
- Used for video reactions (not replies to users)
- Short 1-2 sentence comments (max 100 tokens)
- Higher temperature (0.9) for more creative/spontaneous responses
- Tracked in InnerMonologue system

## How It Works

```
Every 15 seconds:
├─ VisionAnalyzer captures screenshot
├─ OCR extracts text from screen
├─ Detects video player info (title, time, playing status)
├─ Scene change detection (compares with last screenshot)
└─ Triggers VideoCommentary check
    ├─ Calculates comment chance (5-43%)
    ├─ Checks cooldown (60 seconds minimum)
    └─ If triggered:
        ├─ Builds commentary context
        ├─ Generates spontaneous comment
        └─ Sends to Coolhole chat
```

## Vision Context Example

When responding to chat, Slunt sees:
```
👁️ VISUAL CONTEXT (what Slunt is seeing RIGHT NOW on screen):
🎬 Video playing: "Dark Souls speedrun any% glitchless"
Status: PLAYING (37% through, 125s / 338s)
🆕 NEW VIDEO JUST STARTED! Fresh content detected.
Text on screen: "DARK SOULS", "You Died", "HP: 420/420"
Scene mood: Dark/serious (45/255 brightness)
(analyzed 8s ago)
💡 You can comment on what you're seeing! React to videos, make observations, share thoughts.
```

## Features

### Discord Image Recognition
- Already working! Slunt can see images posted in Discord
- Uses vision system for attachments

### Coolhole Video Reactions
- Spontaneous comments when interesting videos play
- Won't spam (60 second cooldown between comments)
- Won't comment on same video twice
- Considers mood, obsessions, and boredom

### Smart Context
- Vision data available in ALL responses
- Can reference what he's seeing when replying to users
- "yo that video is fire" even if nobody mentioned it

## Files Modified

1. **src/vision/visionAnalyzer.js**
   - Added `getLatestAnalysis()` method

2. **src/ai/VideoCommentary.js** (NEW)
   - Spontaneous video reaction system

3. **src/ai/ContextManager.js**
   - Enhanced `buildVisionContext()` with video details
   - Added vision section to `contextToString()`

4. **src/bot/chatBot.js**
   - Import VideoCommentary
   - Initialize videoCommentary system
   - Added `generateSpontaneousComment()` method

5. **server.js**
   - Hook VideoCommentary to vision events
   - Trigger commentary checks on every screenshot

## Testing

Watch the logs for:
- `🎬💬 [VideoCommentary] Slunt spontaneously says: "..."`
- `🎲 [VideoCommentary] Comment chance: XX%`
- `🎯 [VideoCommentary] Interesting video detected: "..."`
- `🔥 [VideoCommentary] Video matches obsession: ...`
- `👁️ [Vision] Using fresh vision data: ...`

## Configuration

**Screenshot frequency:** 15 seconds (in server.js line 1602)
**Comment cooldown:** 60 seconds (in VideoCommentary.js line 17)
**Max comment chance:** 43% (cumulative)

## What's Next?

The system is **fully operational**! Slunt will now:
1. ✅ See images in Discord (already working)
2. ✅ See videos playing in Coolhole (now working)
3. ✅ Spontaneously comment on interesting videos
4. ✅ Reference what he sees in chat responses

## Example Scenarios

**Scenario 1: Horror video starts**
```
[Vision detects: "Five Nights at Freddy's gameplay"]
[Interest trigger: "horror" + Scene changed + Dark brightness]
[Comment chance: 5% + 30% + 20% + 15% = 70%]
Slunt: "oh hell no not the chuck e cheese jumpscare simulator again 💀"
```

**Scenario 2: User asks about video**
```
User: "what do you think of this?"
[Vision context includes: "Bloodborne boss fight, 89% through"]
Slunt: "bruh this boss literally already killed him 3 times, i can see the YOU DIED screen burned into my retinas"
```

**Scenario 3: Obsession alignment**
```
[Slunt is obsessed with: "dark souls lore"]
[New video starts: "Dark Souls Complete Timeline Explained"]
[Obsession match + Interest + Scene change = 70% chance]
Slunt: "YO WAIT is this that 3 hour lore video?? hold on lemme get my notes"
```

---

🎉 **Slunt can officially see and react to the world around him!**
