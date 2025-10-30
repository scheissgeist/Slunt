# Slunt Persistence System

## What Gets Saved Between Sessions

Slunt now remembers everything important between sessions! Here's what persists:

### ✅ Currently Persisted (Survives Restarts)

1. **💰 CoolPoints System** (`data/coolpoints.json`)
   - User balances
   - Transaction history
   - Debt levels

2. **📔 Diary** (`data/diary.json`)
   - All diary entries
   - Thoughts and observations
   - Auto-saves after each entry

3. **🧠 Memory Consolidation** (`data/memory_archive.json`)
   - Important memories
   - Consolidated experiences
   - Memory importance ratings

4. **🎬 Video Learning** (`data/slunt_brain.json`)
   - Videos watched
   - Favorite genres
   - Video preferences

5. **💭 Dreams** (`data/dreams.json`)
   - Dream predictions
   - Dream topics
   - Dream patterns

6. **👤 User Reputations** (`data/user_reputations.json`) **NEW!**
   - Trust levels per user
   - Drama counts
   - Helpfulness scores
   - Auto-saves after each update

7. **🔗 Relationship Mapping** (`data/relationships.json`) **NEW!**
   - User-to-user relationships
   - Friendship strengths
   - Social connections
   - Interaction counts
   - Auto-saves after each update

8. **💰 Gold System** (`data/gold_system.json`) **NEW!**
   - Gold messages learned
   - Funny timing patterns
   - What makes messages gold-worthy
   - User gold frequencies
   - Auto-saves after learning

9. **💬 Chat History** (`data/slunt_brain.json` & `data/chat_memory.json`)
   - Recent chat messages
   - Conversation context
   - User interactions

10. **🎸 Personality** (`data/slunt_brain.json`)
    - Personality trait values
    - Behavior patterns
    - Evolution over time

### 🔄 Temporary (Resets Each Session)

These reset on restart because they're meant to track current state:

1. **Mental State** (depression, anxiety, confidence)
   - Current emotional state
   - Resets to baseline each session

2. **Drunk Mode** (intoxication level)
   - Current drunkenness
   - Hangover state
   - Resets sober each session

3. **Current Obsession** (topic fixation)
   - What Slunt is currently obsessed with
   - Changes naturally during session

4. **Dopamine System** (reward tracking)
   - Current dopamine level
   - Recent activities
   - Resets to baseline

5. **Autism Fixations** (current special interests)
   - Active fixation
   - Intensity level
   - Resets each session

6. **Hipster Protocol** (band of the hour)
   - Current obscure band
   - Rotates every 2 hours
   - Resets to new band

## How It Works

### Auto-Save Systems
Most systems now auto-save immediately after important changes:
- **User reputation**: Saves when trust/drama/helpfulness changes
- **Relationships**: Saves when relationship strength updates
- **Gold system**: Saves when learning new gold patterns
- **Diary**: Saves after each new entry

### Load on Startup
When Slunt starts, these systems automatically load their saved data:
```
📔 [Diary] Loaded 81 entries from disk
👤 [Reputation] Loaded 15 user reputations from disk
🔗 [Relationships] Loaded 42 relationships from disk
💰 [Gold] Loaded 23 gold messages and patterns from disk
```

### File Locations
All persistent data is stored in `./data/` directory:
- `coolpoints.json` - Virtual currency
- `diary.json` - Diary entries
- `user_reputations.json` - User trust/drama/helpfulness
- `relationships.json` - Social graph
- `gold_system.json` - Gold learning
- `dreams.json` - Dream predictions
- `slunt_brain.json` - Personality, chat history, videos
- `memory_archive.json` - Important memories
- `chat_memory.json` - Chat context

## Benefits

1. **Continuous Learning**: Slunt remembers what he learned about users
2. **Relationship Continuity**: Friendships and social dynamics persist
3. **Pattern Recognition**: Gold system learns what's funny over time
4. **Trust Building**: User reputations accumulate across sessions
5. **No Reset Frustration**: Users don't lose progress with Slunt

## Dashboard Updates

**Mind Data**: Updates every **5 seconds** (emotional state, personality, current mood)
**Diary**: Updates every **10 minutes** (thoughts and observations)

Mind data updates frequently because it's his "current feelings" - like checking his mood in real-time. Diary updates slowly because those are his longer reflections.
