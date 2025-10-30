# Slunt Multi-Platform Integration Guide

Slunt now supports multiple chat platforms simultaneously! All 25 advanced AI systems work across **Coolhole.org**, **Discord**, and **Twitch**.

## 🎯 Features

- **Unified AI**: Same personality, memories, and systems across all platforms
- **Cross-Platform Memory**: Slunt remembers users even if they switch platforms
- **Rate Limiting**: Prevents spam on each platform
- **Message Routing**: Automatic routing of responses to the correct platform
- **Graceful Degradation**: If a platform fails, others continue working

## 🚀 Quick Start

### 1. Copy Environment Template

```bash
copy .env.example .env
```

### 2. Configure Platforms (Optional)

Edit `.env` and add credentials for the platforms you want:

#### Discord Setup

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to "Bot" section and create a bot
4. Enable these intents:
   - Server Members Intent
   - Message Content Intent
5. Copy the bot token and application ID
6. Add to `.env`:

```
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_IDS=your_guild_id_here
```

7. Invite bot using this URL (replace YOUR_CLIENT_ID):
```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=412317273088&scope=bot
```

#### Twitch Setup

1. Go to https://twitchtokengenerator.com/
2. Click "Bot Chat Token"
3. Authorize your bot account (or create a new Twitch account for the bot)
4. Copy the OAuth token (it will start with `oauth:`)
5. Add to `.env`:

```
TWITCH_USERNAME=your_bot_username
TWITCH_OAUTH_TOKEN=oauth:your_token_here
TWITCH_CHANNELS=channel1,channel2,channel3
```

**Alternative Method (For Developers):**
1. Go to https://dev.twitch.tv/console/apps
2. Create a new application
3. Set OAuth Redirect URL to `http://localhost:3000`
4. Note your Client ID and Client Secret
5. Use the OAuth flow to get a token

**Note:** Channels should be comma-separated without `#` prefix

### 3. Run Slunt

```bash
npm start
```

Slunt will automatically connect to all configured platforms!

## 📡 Platform Status

On startup, you'll see:

```
🚀 Initializing all platforms...
🔗 [Twitch] Connecting...
✅ [Twitch] Connected to irc-ws.chat.twitch.tv:443
📺 [Twitch] Joined channels: coolhole
🎮 [Discord] Logging in...
✅ [Discord] Connected as SluntBot#1234
✅ [PlatformManager] Initialized 3/3 platforms
```

## 🎮 How It Works

### Message Flow

1. User sends message on any platform
2. Platform adapter normalizes message format
3. Platform Manager emits unified `chat` event
4. ChatBot processes message with all 25 AI systems
5. ChatBot generates response
6. Response routes back to correct platform/channel

### Unified Message Format

All platforms convert messages to this format:

```javascript
{
  platform: 'discord' | 'twitch' | 'coolhole',
  username: 'John',
  displayName: 'John Doe',
  text: 'Hello Slunt!',
  timestamp: 1234567890,
  channel: 'general',
  channelId: '123456789',
  userId: '987654321'
}
```

### Platform-Specific Features

#### Discord
- Mentions: `@Slunt hello`
- Replies: Slunt can reply to specific messages
- Attachments: Slunt sees image/file attachments
- Emojis: Full emoji support

#### Twitch
- Badges: Slunt knows mods, subs, VIPs
- Emotes: Twitch emote support
- Commands: All Slunt commands work

#### Coolhole
- CoolPoints system (exclusive to Coolhole)
- Video queue manipulation
- Emote system
- Coolhole tricks

## 🔧 Advanced Configuration

### Rate Limits

**Discord:** 1 message per 2 seconds per channel  
**Twitch:** 20 messages per 30 seconds (regular user)  
**Coolhole:** No hard limit

### Message Splitting

**Discord:** 2000 character limit - auto-splits at sentence boundaries  
**Twitch:** 480 character limit - splits long messages  
**Coolhole:** No limit

### Enable/Disable Platforms

To disable a platform, just don't add its credentials to `.env`. Slunt will skip it.

```
# Disable Discord - just leave these blank or delete them:
# DISCORD_TOKEN=
# DISCORD_CLIENT_ID=
# DISCORD_GUILD_IDS=
```

## 📊 Memory Persistence

All personality systems persist across platforms:

- **Relationships**: Slunt remembers relationships regardless of platform
- **Memories**: Context from Discord carries to Twitch conversations
- **Mood**: Mood state is unified across platforms
- **Personality Evolution**: All platforms contribute to personality growth

## 🎭 All 25 Systems Work Everywhere

Every advanced system works on every platform:

✅ Mood Contagion  
✅ Sleep Deprivation  
✅ Slunt Lore Generation  
✅ Opinion Formation  
✅ Storytelling Mode  
✅ Interest Decay  
✅ False Memories  
✅ Performance Anxiety  
✅ Chat Role Awareness  
✅ Response Timing  
✅ Multi-Message Responses  
✅ Contextual Memory Retrieval  
✅ Grudge Evolution  
✅ Obsession System  
✅ Drunk Mode  
✅ Theory of Mind  
✅ Video Learning  
✅ Personality Evolution  
✅ Social Awareness  
✅ Relationship Mapping  
✅ Style Mimicry  
✅ Memory Consolidation  
✅ Emotional Engine  
✅ Proactive Friendship  
✅ Ultra-Realistic Behaviors  

## 🐛 Troubleshooting

### Discord Bot Won't Connect

**Check:**
- Token is correct in `.env`
- Bot has "Message Content Intent" enabled
- Bot is invited to your server
- Guild ID is correct

### Twitch Bot Won't Connect

**Check:**
- OAuth token starts with `oauth:`
- Username is lowercase
- Channels don't have `#` prefix
- Bot account is not banned from channels

### Messages Not Sending

**Check console for:**
- Rate limit warnings: Wait for rate limit to clear
- Connection status: Ensure platform is connected
- Channel ID: Verify channel exists

### Cross-Platform Issues

**If Slunt responds on wrong platform:**
- This shouldn't happen - file a bug report
- Check `this.currentPlatform` is set correctly

## 📝 API for Developers

### Send Message to Specific Platform

```javascript
// In ChatBot or with access to ChatBot instance
await chatBot.sendMessage('Hello!', {
  platform: 'discord',
  channel: '1234567890'
});
```

### Check Platform Status

```javascript
const status = platformManager.getStatus();
console.log(status);
// {
//   discord: { connected: true, details: {...} },
//   twitch: { connected: true, details: {...} },
//   coolhole: { connected: true, details: {...} }
// }
```

### Broadcast to All Platforms

```javascript
await platformManager.broadcast('Important announcement!');
```

## 🔒 Security Notes

- **Never commit `.env` file** - it contains secrets
- Discord token has full bot access
- Twitch OAuth token is equivalent to password
- Store credentials securely

## 🎉 Benefits

### For Users
- Talk to Slunt anywhere
- Consistent personality across platforms
- Slunt remembers you everywhere

### For Developers
- Clean separation of concerns
- Easy to add new platforms
- Unified testing strategy
- No platform-specific logic in AI systems

## 🚧 Future Enhancements

Possible additions:
- Matrix/Element support
- Slack integration
- IRC support
- Telegram bot
- Web chat interface

## 📖 Architecture

```
┌─────────────────────────────────────────┐
│         Platform Adapters               │
│  ┌────────┐ ┌────────┐ ┌─────────────┐ │
│  │Discord │ │Twitch  │ │ Coolhole    │ │
│  └───┬────┘ └───┬────┘ └──────┬──────┘ │
└──────┼──────────┼──────────────┼────────┘
       │          │               │
       └──────────┴───────────────┘
                  │
         ┌────────▼────────┐
         │ Platform Manager│
         │  (Event Router) │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │    ChatBot      │
         │  (25 AI Systems)│
         └─────────────────┘
```

**Key Principles:**
1. **Thin Adapters**: No business logic in platform code
2. **Unified Events**: All platforms emit same event format
3. **Single Brain**: One ChatBot instance for all platforms
4. **Smart Routing**: Responses go to correct platform automatically

## ✅ Testing Checklist

Before deploying to production:

- [ ] Discord bot connects successfully
- [ ] Twitch bot connects successfully  
- [ ] Coolhole still works (no regression)
- [ ] Messages from Discord trigger responses
- [ ] Messages from Twitch trigger responses
- [ ] Responses go to correct platform
- [ ] Rate limiting works on each platform
- [ ] Long messages split correctly
- [ ] Cross-platform memory works
- [ ] Graceful shutdown saves all data
- [ ] No [object Promise] errors
- [ ] All 25 systems operational

## 🎮 Ready to Go!

Your configuration:
```bash
npm start
```

Watch the console for connection confirmations. Once you see:

```
✅ [PlatformManager] Initialized 3/3 platforms
```

Slunt is live everywhere! 🎉

---

**Made with 💜 by the Coolhole community**
