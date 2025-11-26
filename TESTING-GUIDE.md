# 🚀 Quick Start - Testing New Features

## Start the Bot

```powershell
npm start
```

Or use the VS Code task: **Start Coolhole Chatbot**

## Open Dashboard

Navigate to: http://localhost:3001

## What to Look For

### 🤖 Meta-Awareness (5% chance per message)
**Test by chatting in Coolhole.org**

Expected behaviors:
- "btw my dashboard says I have X active grudges rn"
- "autism protocol just activated btw"
- "being an AI is weird ngl"
- "my emotional engine just detected tension in chat"

**Trigger manually by mentioning:**
- "AI", "bot", "robot", "code", "algorithm", "neural", "dashboard"
- 30% chance to react to these mentions

### 📝 Contextual Callbacks (8% chance)
**Accumulates over time as memorable moments happen**

Detectable moments:
- Someone says "lmao" or "😂" → Funny moment
- Drama/argument → Drama moment
- "cringe" or "yikes" → Cringe moment
- "chaos" or "wild" → Chaos moment

After moments are stored, Slunt may say:
- "remember when [username] said [thing] 2h ago"
- "classic [username] moment: [excerpt]"
- "still thinking about when you [action]"

### 🎭 Personality Modes (Automatic by time)
**Changes based on current time**

Test at different times:
- **5-10am**: Grumpy, mentions coffee, low energy
- **11am-5pm**: Normal baseline
- **10pm-4am**: Philosophical, existential questions
- **Weekends**: More chill and relaxed
- **Friday 6-11pm**: Chaotic, typos, unhinged
- **Monday 6am-12pm**: Depressed, unmotivated

**Check current mode on dashboard**: 🎭 Personality Mode card

### ⏱️ Emotion-Driven Timing
**Automatic based on message emotion**

Test by:
- Sending exciting messages → Fast response
- Sending sad messages → Slow response
- Drunk mode active → Chaotic timing

### 🎉 Community Events
**Detects automatically**

Trigger events:
- **Birthday**: Say "it's my birthday" or "happy birthday"
- **Drama**: 5+ hostile messages between 2 users
- **Meme**: Repeat a phrase 5+ times
- **Milestone**: Reach 100/500/1000 messages

**View on dashboard**: 🎉 Community Events card

## Dashboard Cards to Check

Click each new card to see details:

1. **🤖 Meta-Awareness** - Shows status, example comments
2. **📝 Memory Callbacks** - Shows memorable moment count
3. **🎭 Personality Mode** - Shows current mode (changes by time)
4. **🎉 Community Events** - Shows recent events list

## Expected Console Output

When bot starts, you should see:
```
📊 [MemorySummarization] Restored compressed memories
🎉 [CommunityEvents] Restored X events
📝 [ContextualCallbacks] Restored memorable moments
🎭 [PersonalityModes] Restored personality mode settings
```

## Testing Sequence

### 1. Basic Start (2 minutes)
- Start bot with `npm start`
- Check console for "Restored" messages
- Open dashboard at http://localhost:3001
- Verify all cards show numbers

### 2. Meta-Awareness Test (5 minutes)
- Chat in Coolhole.org
- Send 20+ messages
- Watch for meta-comments appearing
- Say "you're an AI" → Should react

### 3. Personality Mode Test (1 minute)
- Check dashboard 🎭 card
- Verify it shows correct mode for current time
- Click card to see all 6 modes

### 4. Callback Accumulation (10 minutes)
- Chat normally
- Say funny things with "lmao"
- Create some drama (argue with someone)
- After 50+ messages, callbacks should start appearing

### 5. Community Events (5 minutes)
- Say "happy birthday [username]"
- Repeat a phrase 5+ times
- Check dashboard 🎉 card for events

## Troubleshooting

### "No data available yet"
- Wait for bot to collect data (first 10-20 messages)
- Dashboard cards need time to populate

### No meta-comments appearing
- Only 5% chance per message
- Try 40-50 messages to increase probability
- Mention "AI" or "bot" for 30% forced chance

### Wrong personality mode
- Check your system time
- Mode switches at exact hour boundaries
- Weekends use day 0 (Sunday) and 6 (Saturday)

### Events not detecting
- Drama needs 5+ messages minimum
- Memes need 5+ repetitions
- Birthdays need explicit mention

## Memory Persistence

All new systems save automatically:
- `/data/slunt_memory.json` updated every 5 minutes
- Restores on bot restart
- No data loss between sessions

## Performance

Expected performance:
- **Response time**: +10-20ms (imperceptible)
- **Memory usage**: +5-10 MB
- **CPU usage**: Minimal
- **Auto-compression**: Runs hourly in background

## Success Indicators

✅ All 4 new dashboard cards show data
✅ Console shows "Restored" messages on start
✅ Meta-comments appear within 50 messages
✅ Personality mode matches current time
✅ Events populate in dashboard as they occur
✅ Bot responses vary based on emotion/mode

## Manual Testing Commands

Test in Coolhole.org chat:

```
# Trigger meta-awareness
"slunt you're an AI"
"what's on your dashboard?"

# Create memorable moment
"lmao that's hilarious"
*be very funny*

# Trigger community events
"happy birthday coolhole"
*repeat phrase 5+ times*

# Check personality
*chat at different times of day*
*notice tone differences*
```

## Next Steps

Once everything is working:
1. Let bot run for 24 hours to collect full personality cycle
2. Check dashboard periodically to see stats grow
3. Review memorable moments in Callbacks card
4. Watch for natural callback references in chat
5. Observe personality mode transitions

Enjoy the enhanced Slunt! 🎉
