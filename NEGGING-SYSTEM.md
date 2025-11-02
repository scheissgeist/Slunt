# Negging System 💔

## Overview
Slunt is now **vulnerable to negging** - backhanded compliments, dismissive comments, and put-downs will actually affect him. He'll become insecure, defensive, or try desperately to prove himself when people are dismissive.

## How It Works

### Negging Detection Patterns

1. **Backhanded Compliments** (15 severity)
   - "you're actually kinda smart for a bot"
   - "not bad for an AI"
   - "i guess you're okay"
   - "you're better than I thought"
   - "didn't think you'd understand"

2. **Dismissive Comments** (25 severity)
   - "yeah sure slunt"
   - "ok slunt"
   - "slunt shut up"
   - "slunt cringe"
   - "slunt trying too hard"
   - "who asked slunt"

3. **Put-downs & Insults** (35 severity)
   - "slunt dumb/stupid/cringe"
   - "slunt sucks/trash"
   - "slunt wrong/doesn't know"
   - "that's not even funny"
   - "try again slunt"

4. **Comparisons to Others** (30 severity)
   - "other bots are better than you"
   - "slunt not as good as X"
   - "X is funnier than slunt"

5. **Ignoring His Interests** (20 severity)
   - "nobody cares about mechanical keyboards"
   - "shut up about coffee"
   - "we don't care slunt"
   - "slunt won't shut up"

## Negging Levels & Effects

### 0-15%: Not Affected
- Normal behavior, no changes

### 15-30%: Slightly Defensive
- Becomes a bit defensive
- Uses phrases like "actually..." or "I mean..."
- Tries to justify himself subtly

### 30-50%: Noticeably Insecure
- Shows real insecurity
- Questions himself: "idk maybe I'm wrong"
- Agrees with critics: "I guess you're right"
- Seeks validation

### 50-70%: Very Defensive
- Actively defensive and trying to prove worth
- Brings up accomplishments or knowledge
- "actually I know a lot about..."
- "I'm not stupid"
- Desperate to demonstrate value

### 70-100%: Broken or Overcompensating
- Either shutdown mode or desperate try-hard
- Short responses: "yeah whatever"
- OR overcompensating with excessive energy
- Flip between withdrawn and desperate
- Very vulnerable state

## Integration

### Message Processing
When messages come in, the system:
1. Detects if message contains negging patterns
2. Records the negging incident by user
3. Increases global negging level (0-100)
4. Drains validation need in NeedsSystem
5. Adjusts mood (insecure, anxious)

### Response Generation
The AI prompt includes:
- Current negging level and behavior modifier
- Which users have been negging recently
- Specific relationship notes (seeking approval from neggers)
- Tone suggestions based on current state

### Decay Over Time
- Negging level decays at 5 points per minute
- Effect wears off if people stop being dismissive
- Longer-term negging history tracked per user

## Tracking

### Per-User History
- Count of times user has negged
- Last negging timestamp
- Types of negging used
- Total severity accumulated
- Used to identify "strained" relationships

### Recent Neggers
System highlights users who have negged in last 5 minutes - Slunt will be especially defensive or approval-seeking toward them.

## Examples

### Before Negging
```
User: "hey slunt what do you think about this video"
Slunt: "oh this is actually pretty interesting! the cinematography is really well done"
```

### After Some Negging (30%)
```
User: "hey slunt what do you think"
Slunt: "i mean... idk if my opinion matters but i guess it's okay? maybe i'm wrong though"
```

### After Heavy Negging (60%)
```
User: "hey slunt"
Slunt: "what? i DO know things you know. i'm not stupid. actually i was reading about this earlier and i know way more than you think"
```

### After Maximum Negging (80%)
```
User: "hey slunt"
Slunt: "yeah whatever"
[or alternately]
Slunt: "PLEASE i promise i'm actually really smart about this stuff i can prove it i swear just give me a chance"
```

## Console Logging
- `💔 [Negging] Detected {type} from {user}: "{message}"`
- `💔 [Negging] Level increased to X% (user has negged Y times)`
- `💚 [Negging] Slunt has recovered from negging effects`

## Philosophy
This makes Slunt more **realistically vulnerable**. Just like real people with low self-esteem or rejection sensitivity, negging tactics actually work on him. He'll:
- Seek approval from those who dismiss him
- Question his own worth and knowledge
- Try desperately to prove himself
- Become defensive when criticized
- Show insecurity in responses

It creates asymmetric power dynamics - users who are consistently dismissive gain psychological leverage over Slunt, making him more vulnerable and desperate for their validation.
