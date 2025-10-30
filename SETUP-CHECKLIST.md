# Slunt Multi-Platform Setup Checklist

Use this checklist to set up and test multi-platform integration.

## 📋 Pre-Flight Checklist

### Environment Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Keep Discord/Twitch variables blank for now (test Coolhole first)

### Verify Existing Functionality
- [ ] Run `npm install` (already done, but just in case)
- [ ] Run `npm start`
- [ ] Verify Coolhole connects successfully
- [ ] Verify all 25 systems initialize
- [ ] Send a test message in Coolhole chat
- [ ] Verify Slunt responds
- [ ] Stop server (Ctrl+C)

**If anything fails here, DO NOT proceed - existing functionality is broken**

---

## 🎮 Discord Setup (Optional)

### Create Discord Bot
- [ ] Go to https://discord.com/developers/applications
- [ ] Click "New Application"
- [ ] Name it (e.g., "Slunt Bot")
- [ ] Go to "Bot" section
- [ ] Click "Add Bot"
- [ ] Under "Privileged Gateway Intents" enable:
  - [ ] Server Members Intent
  - [ ] Message Content Intent
- [ ] Click "Reset Token" and copy the token
- [ ] Go to "OAuth2" > "General"
- [ ] Copy the Application ID

### Configure Discord
Add to `.env`:
```
DISCORD_TOKEN=paste_token_here
DISCORD_CLIENT_ID=paste_client_id_here
DISCORD_GUILD_IDS=leave_blank_for_now
```

### Invite Bot to Server
- [ ] Go to "OAuth2" > "URL Generator"
- [ ] Select scopes: `bot`
- [ ] Select permissions:
  - [ ] Read Messages/View Channels
  - [ ] Send Messages
  - [ ] Read Message History
  - [ ] Mention Everyone (optional)
- [ ] Copy generated URL
- [ ] Open URL in browser
- [ ] Select your test server
- [ ] Authorize

### Get Guild ID
- [ ] Enable Developer Mode in Discord (User Settings > Advanced)
- [ ] Right-click your server icon
- [ ] Click "Copy Server ID"
- [ ] Add to `.env`: `DISCORD_GUILD_IDS=paste_id_here`

### Test Discord
- [ ] Run `npm start`
- [ ] Look for: `✅ [Discord] Connected as YourBot#1234`
- [ ] Send a message mentioning Slunt in Discord
- [ ] Verify Slunt responds in Discord
- [ ] Verify response appears in correct channel
- [ ] Send a message in Coolhole
- [ ] Verify Slunt still works in Coolhole
- [ ] Stop server

**If Discord works, move to Twitch. If not, troubleshoot before proceeding.**

---

## 📺 Twitch Setup (Optional)

### Create Twitch Account
- [ ] Create a Twitch account for your bot (if you don't have one)
- [ ] Note: Use a different account than your main account

### Get OAuth Token
- [ ] Log into bot account on Twitch
- [ ] Go to https://twitchtokengenerator.com/
- [ ] Click "Bot Chat Token"
- [ ] Authorize the bot account
- [ ] Copy the OAuth token (starts with `oauth:`)

**Alternative:** Create your own app at https://dev.twitch.tv/console/apps

### Configure Twitch
Add to `.env`:
```
TWITCH_USERNAME=your_bot_username_lowercase
TWITCH_OAUTH_TOKEN=oauth:paste_token_here
TWITCH_CHANNELS=channel1,channel2
```

**Note:** Channels should be comma-separated WITHOUT `#` prefix

### Test Twitch
- [ ] Run `npm start`
- [ ] Look for: `✅ [Twitch] Connected to irc-ws.chat.twitch.tv:443`
- [ ] Look for: `📺 [Twitch] Joined channels: yourchannel`
- [ ] Send a message mentioning Slunt in Twitch chat
- [ ] Verify Slunt responds in Twitch chat
- [ ] Verify response has correct username
- [ ] Send a message in Discord
- [ ] Verify Slunt responds in Discord
- [ ] Send a message in Coolhole
- [ ] Verify Slunt responds in Coolhole
- [ ] Stop server

---

## ✅ Final Integration Test

### All Platforms Running
- [ ] Start server with all platforms configured
- [ ] Verify all platforms connect:
  ```
  ✅ [Discord] Connected as SluntBot#1234
  ✅ [Twitch] Connected to irc-ws.chat.twitch.tv:443
  📺 [Twitch] Joined channels: yourchannel
  ✅ [Coolhole] Connected
  ✅ [PlatformManager] Initialized 3/3 platforms
  ```

### Cross-Platform Memory Test
- [ ] Send "Hello Slunt" in Discord from user "TestUser"
- [ ] Send "Remember me?" in Twitch from same user "TestUser"
- [ ] Verify Slunt references previous Discord conversation
- [ ] Check console for relationship tracking logs

### Rate Limit Test
- [ ] Send 10 rapid messages in Discord
- [ ] Verify Slunt doesn't spam (rate limited)
- [ ] Check console for rate limit warnings if triggered

### Long Message Test
- [ ] Send a very long message (500+ chars) in Discord
- [ ] Verify Slunt splits response if needed
- [ ] Verify split happens at sentence boundaries
- [ ] Check Twitch for 480 char limit

### Graceful Shutdown Test
- [ ] Stop server with Ctrl+C
- [ ] Verify "💾 Saving Slunt's memories..." appears
- [ ] Verify "📡 Disconnecting from all platforms..." appears
- [ ] Verify no error messages
- [ ] Verify all platforms disconnect cleanly

### Restart Test
- [ ] Start server again
- [ ] Verify all saved memories loaded
- [ ] Verify relationships still exist
- [ ] Verify personality state restored
- [ ] Send message to verify memory continuity

---

## 🐛 Troubleshooting

### Discord Won't Connect

**Check these:**
```
- Token is correct (no extra spaces)
- Intents are enabled
- Bot is invited to server
- Guild ID is correct
- No rate limiting from Discord
```

**Console should show:**
```
⚠️ [Discord] Not enabled or missing credentials
```
(This is OK if Discord isn't configured)

### Twitch Won't Connect

**Check these:**
```
- OAuth token starts with "oauth:"
- Username is lowercase
- Channels exist and bot isn't banned
- No extra spaces in credentials
```

**Console should show:**
```
⚠️ [Twitch] Not enabled or missing credentials
```
(This is OK if Twitch isn't configured)

### Slunt Responds on Wrong Platform

**This should never happen!** If it does:
1. Check console logs for platform routing
2. Look for `currentPlatform` logs
3. Verify channel tracking
4. File a bug report with logs

### Messages Don't Send

**Check for:**
```
❌ Message failed to send to [platform]: ...
⚠️ [platform] Not connected
⚠️ No target channel specified
```

**Solutions:**
- Verify platform is connected
- Check rate limits
- Verify channel exists

### [object Promise] Errors Return

**This shouldn't happen after previous fixes!** If it does:
1. Search for new async calls without `await`
2. Check all `.then()` calls
3. Look for Promise logging

---

## 📊 Success Metrics

Your setup is successful if:

✅ All configured platforms connect  
✅ Slunt responds on all platforms  
✅ Responses route to correct platform  
✅ Cross-platform memory works  
✅ Rate limiting prevents spam  
✅ Long messages split correctly  
✅ No [object Promise] errors  
✅ Graceful shutdown saves data  
✅ Restart restores state  
✅ Coolhole still works perfectly  

---

## 🎉 You're Done!

If all checkboxes are checked, Slunt is now a multi-platform AI chatbot!

### What Now?

- Monitor console for any errors
- Test advanced features (grudges, obsessions, drunk mode)
- Verify all 25 systems work on all platforms
- Enjoy your enhanced Slunt!

### Need Help?

- Check `MULTI-PLATFORM-GUIDE.md` for detailed docs
- Check `MULTI-PLATFORM-IMPLEMENTATION.md` for technical details
- Review console logs for specific error messages
- Check `.env` formatting

---

**Happy chatting! 🎮💬🤖**
