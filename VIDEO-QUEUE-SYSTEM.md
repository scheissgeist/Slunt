# Video Queue System - Coolhole Search Integration

## Overview
Slunt autonomously searches for and queues videos using Coolhole's built-in video search feature (magnifying glass icon). He thinks about what he'd like to share based on his mood, obsessions, and mental state, then searches for it directly on Coolhole.

## Coolhole UI Layout

### Main Layout
- **Left Side**: Chat interface with message buffer
- **Right Side**: Video player
- **Bottom Left Panel**: Poll (first) → Emotes → Settings → CoolPoints (CP)
- **Video Search**: Magnifying glass icon (🔍) - Opens search interface
- **Bottom Right**: + button for direct URL input (fallback)
- **Far Right**: Skip video button (costs CP)

### Search Feature
- **Search Button**: Magnifying glass (🔍) icon in video controls
- **Search Input**: Text field appears after clicking search button
- **Search Results**: Dropdown/list of video results from YouTube
- **Auto-Queue**: First result gets queued automatically or requires click

## Implementation

### 1. Enhanced Queue Discovery (`coolholeExplorer.js`)
**Method**: `discoverQueueSystem()`

Discovers the video search interface:

```javascript
ui: {
  videoSearchButton: {
    found: true,
    type: 'search-icon',
    position: 'video-controls'
  },
  searchInput: {
    found: true,
    placeholder: 'Search videos...'
  }
}
```

### 2. Search and Queue (`coolholeExplorer.js`)
**Method**: `searchAndQueueVideo(searchQuery, title)`

5-step autonomous search process:

```javascript
// Step 1: Click magnifying glass (🔍) button
searchButton.click()

// Step 2: Find search input that appears
searchInput.value = query
searchInput.dispatchEvent(new Event('input'))

// Step 3: Submit search (Enter key or search button)
searchInput.dispatchEvent(new KeyboardEvent('Enter'))

// Step 4: Wait for results, click first result
resultItems[0].click()

// Step 5: Add to queue if needed
addButton.click() // If required
```

**Features**:
- Natural timing delays (300-1000ms) for UI responsiveness
- Automatic result selection (first result)
- Auto-queue detection
- Fallback add-to-queue button clicking
- Comprehensive error reporting with step tracking

### 3. Intelligent Video Queue Controller (`VideoQueueController.js`)

#### Autonomous Queue Method
```javascript
async queueVideo(reason = 'mood-based') {
  // 1. Determine topic based on mental state
  const topic = this.getDesiredVideoTopic()
  
  // 2. Use Coolhole's search directly
  await coolholeExplorer.searchAndQueueVideo(topic)
  
  // 3. Create inner monologue
  innerMonologue.think(`just searched for and queued ${topic}`)
  
  // 4. Announce in chat
  sendMessage(`just queued something about ${topic}, you're welcome`)
}
```

#### Topic Selection (Mood-Based)
```javascript
getDesiredVideoTopic() {
  // Priority 1: Current Obsession
  if (obsessionSystem.hasActiveObsession()) {
    return obsession.topic // e.g., "quantum physics"
  }
  
  // Priority 2: Mood State
  const moodTopics = {
    excited: ['comedy', 'action', 'adventure', 'music'],
    happy: ['comedy', 'feel-good', 'music', 'art'],
    neutral: ['documentary', 'gaming', 'technology'],
    sad: ['drama', 'melancholy music', 'art'],
    annoyed: ['angry music', 'rants', 'debates'],
    anxious: ['calming', 'nature', 'ASMR']
  }
  
  // Priority 3: Default Topics
  return random(['existentialism', 'philosophy', 'weird videos', 'obscure music', 'art'])
}
```

## Queueing Triggers

### Autonomous Queueing
Slunt decides to queue videos when processing messages with these conditions:

**Cooldown**: 15 minutes since last queue

**Base Chance**: 5% per message

**Modifiers**:
- +10% if obsessed with something
- +15% if bored (boredom > 70)
- +10% if excited
- -10% if depressed (depression > 60)

**Timing**: Queues 2-5 seconds after deciding (random delay for naturalism)

### Example Scenarios
```javascript
// Slunt is obsessed with vaporwave
// Someone mentions music
// 5% + 10% (obsession) = 15% chance
→ Searches: "vaporwave"
→ Announces: "threw a video about vaporwave in the queue"

// Slunt is bored
// Boredom level: 75
// 5% + 15% (bored) = 20% chance
→ Searches: random topic from defaults
→ Announces: "thought we needed some existentialism rn"

// Slunt is depressed
// Depression: 65
// 5% - 10% (depressed) = -5% chance
→ Won't queue (negative chance = 0%)
```

## Chat Announcements

When Slunt queues a video, he announces it naturally:

```javascript
[
  "just queued something about ${topic}, you're welcome",
  "threw a video about ${topic} in the queue",
  "found a ${topic} video, adding it",
  "queuing up some ${topic} content",
  "thought we needed some ${topic} rn",
  "${topic} time, queued a video",
  "adding to queue: ${topic} video"
]
```

**Timing**: Announced 1 second after successful queue

## Skip/Vote Logic

### Skip Triggers (Unchanged)
- Has enough CP (50+ CP available)
- Skip button available (not disabled)
- Hated topic detected (+30% chance)
- Annoyed mood state (+15%)
- Video conflicts with obsession (+8%)
- Multiple users complaining (+25% if 3+ complaints)

## Integration with Brain Architecture

### Message Processing Flow
```javascript
learnFromMessage(username, text) {
  // ... other learning ...
  
  // Autonomous video queueing
  if (videoQueueController.shouldQueueVideo()) {
    setTimeout(async () => {
      const result = await videoQueueController.queueVideo('autonomous')
      // Queues video based on mood/obsessions
    }, 2000-5000ms) // Natural delay
  }
}
```

### Mental State Integration
- **Inner Monologue**: Records video queue thoughts
- **Mood Tracker**: Determines video topic preferences
- **Obsession System**: Prioritizes obsession-related videos
- **Boredom Tracker**: Increases queue likelihood when bored
- **Depression State**: Reduces queue likelihood when depressed

### CoolPoints Integration
- Checks CP balance before skip voting
- Tracks CP cost awareness (skip = ~50 CP)
- Integrates with CoolPointsManager for balance queries

## Technical Details

### UI Element Detection
Multiple detection strategies for search button:
```javascript
const searchButtons = Array.from(document.querySelectorAll('button, [role="button"]'))
  .filter(b => {
    return title.includes('search') || 
           ariaLabel.includes('search') ||
           className.includes('search') ||
           b.querySelector('svg') || // Icon element
           b.textContent.includes('🔍')
  })
```

### Event Dispatching
Proper form event triggering:
```javascript
searchInput.value = query
searchInput.dispatchEvent(new Event('input', { bubbles: true }))
searchInput.dispatchEvent(new Event('change', { bubbles: true }))

// Submit via Enter key
searchInput.dispatchEvent(new KeyboardEvent('keydown', {
  key: 'Enter',
  code: 'Enter',
  keyCode: 13,
  bubbles: true
}))
```

### Timing & Delays
Strategic delays for UI state changes:
- **300ms**: Wait for search input to appear
- **300ms**: Wait for submit button recognition
- **1000ms**: Wait for search results to load
- **500ms**: Wait for queue confirmation
- **2000-5000ms**: Natural delay before autonomous queue

### Error Handling
Step-by-step error tracking:
```javascript
{
  success: false,
  reason: 'search-button-not-found' | 
          'search-input-not-found' | 
          'no-result-items' | 
          'auto-queued-or-no-results',
  step: 1 | 2 | 3 | 4
}
```

## Advantages Over URL Method

### Why Search > Direct URL:
1. **Uses Native Interface**: Leverages Coolhole's built-in search
2. **No External API**: No YouTube API calls needed
3. **Simpler Flow**: Just search text, no URL construction
4. **More Natural**: Mimics how real users queue videos
5. **Better Results**: Coolhole's search is optimized for queueing
6. **Auto-Integration**: Results integrate directly with queue system

## Current Status

✅ **COMPLETE**: Search button (🔍) detection
✅ **COMPLETE**: Search input interaction
✅ **COMPLETE**: Result selection and queueing
✅ **COMPLETE**: Autonomous decision logic
✅ **COMPLETE**: Mood/obsession-based topic selection
✅ **COMPLETE**: Chat announcements
✅ **COMPLETE**: Inner monologue integration
✅ **COMPLETE**: Connected to chatBot
✅ **COMPLETE**: 2-5 second natural delay
✅ **COMPLETE**: 15-minute cooldown system

⏳ **TESTING NEEDED**: Real Coolhole search interface interaction
⏳ **TESTING NEEDED**: Result selection accuracy
⏳ **TESTING NEEDED**: Auto-queue detection

## Notes

- Slunt autonomously decides what to queue (users don't ask him)
- Topics chosen based on mental state (mood, obsessions, boredom)
- Natural timing: 2-5 seconds after deciding, 15 min cooldown
- Always announces what he queued in chat
- Uses Coolhole's native search feature (magnifying glass)
- Fallback to direct URL method still exists but unused
- Queue cooldown prevents spam (15 minutes between queues)
