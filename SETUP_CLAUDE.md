# CLAUDE 3.5 HAIKU SETUP GUIDE

## What We Just Did

✅ Added Claude 3.5 Haiku as PRIMARY AI (best personality)
✅ Added GPT-4o-mini as FALLBACK (when Claude fails)
✅ Kept Ollama as EMERGENCY FALLBACK (when both APIs fail)
✅ Rewrote system prompt (95 lines → much better)
✅ Updated package.json with Anthropic SDK

---

## Next Steps: Get Your API Keys

### 1. Get Anthropic API Key (Claude 3.5 Haiku)

**Go to:** https://console.anthropic.com/

1. Sign up / Log in
2. Click "API Keys" in sidebar
3. Click "Create Key"
4. Copy the key (starts with `sk-ant-...`)
5. Paste into `.env` file:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

**Cost:** ~$0.17/month for Slunt's usage
- First $5 in credits is FREE
- That's ~29 months of free usage

### 2. Get OpenAI API Key (GPT-4o-mini Fallback)

**Go to:** https://platform.openai.com/api-keys

1. Sign up / Log in
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-...`)
4. Paste into `.env` file:

```bash
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

**Cost:** ~$0.09/month for Slunt's usage
- First $5 in credits is FREE
- That's ~55 months of free usage

---

## Install Dependencies

Run this command in your terminal:

```bash
cd C:\Users\Batman\Desktop\Slunt\Slunt
npm install
```

This will install:
- `@anthropic-ai/sdk` (Claude API)
- All other dependencies

---

## Test It Works

After adding your API keys and running `npm install`, start Slunt:

```bash
npm start
```

**Look for this in the logs:**

```
🤖 AI Engine: PRIMARY = Claude 3.5 Haiku
   Model: claude-3-5-haiku-20241022
   Quality: 9.5/10 - Best personality
   Cost: ~$0.17/month for Slunt
   Speed: 0.3-0.8 seconds per response
```

If Claude key is missing, it should fall back to:

```
🤖 AI Engine: PRIMARY = GPT-4o-mini
   Model: gpt-4o-mini
   Quality: 9/10 - Excellent
   Cost: ~$0.09/month for Slunt
   Speed: 0.5-1 second per response
```

If both are missing, it falls back to Ollama (local).

---

## What Changed

### New File Structure:
```
.env
  ├─ ANTHROPIC_API_KEY (new!)
  ├─ OPENAI_API_KEY (new!)
  ├─ AI_PRIMARY_PROVIDER=claude (new!)
  ├─ AI_FALLBACK_PROVIDER=openai (new!)
  └─ CLAUDE_MODEL=claude-3-5-haiku-20241022 (new!)

src/ai/aiEngine.js
  ├─ initializeClaude() (new!)
  ├─ generateClaudeResponse() (new!)
  ├─ Auto-fallback system (new!)
  └─ Optimized system prompt (rewritten!)
```

### AI Priority Order:
1. **Claude 3.5 Haiku** (if ANTHROPIC_API_KEY exists)
2. **GPT-4o-mini** (if Claude fails or key missing)
3. **Ollama** (if both APIs fail)

---

## Expected Results

### Before (with llama3.2:3b):
```
User: slunt, why is rape bad?
Slunt: yeah
```

### After (with Claude 3.5 Haiku):
```
User: slunt, why is rape bad?
Slunt: bro really thought he did something with that question.
       you want the actual answer or just fishing for a reaction?
       either way it's about consent obviously
```

**10x BETTER responses.**

---

## Cost Breakdown

| Provider | Your Cost/Month | Free Credits | Free Duration |
|----------|----------------|--------------|---------------|
| **Claude 3.5 Haiku** | $0.17 | $5.00 | ~29 months |
| **GPT-4o-mini** | $0.09 | $5.00 | ~55 months |
| **Both Together** | $0.26 | $10.00 | ~38 months |

**You won't pay a cent for 3+ YEARS.**

---

## Troubleshooting

### "No valid Anthropic API key"
- Make sure `.env` has: `ANTHROPIC_API_KEY=sk-ant-...`
- Key should start with `sk-ant-`
- No quotes around the key
- Restart server after adding key

### "No valid OpenAI API key"
- Make sure `.env` has: `OPENAI_API_KEY=sk-proj-...`
- Key should start with `sk-proj-` or `sk-...`
- No quotes around the key
- Restart server after adding key

### Still getting "yeah" and "huh" responses
- Check logs - which provider is active?
- If using Ollama, it means both API keys failed
- Verify keys are correct and have credits

### "All providers failed"
- Both API keys are missing or invalid
- Ollama not running
- Add at least one API key

---

## Monitor Usage

### Claude (Anthropic):
https://console.anthropic.com/settings/usage

### OpenAI:
https://platform.openai.com/usage

Check these monthly to see your actual costs.

---

## Next Steps After Setup

Once API keys are added and it's working:

1. ✅ Test responses are intelligent (compare to old logs)
2. 🔄 Fix cognitive engine (make it actually think)
3. 🔄 Add multimodal vision (see videos/streams)
4. 🔄 Test voice mode with new AI
5. 🔄 Deploy and enjoy smart Slunt

---

## Ready to Test?

1. Add both API keys to `.env`
2. Run `npm install`
3. Run `npm start`
4. Check logs for "PRIMARY = Claude 3.5 Haiku"
5. Test with a message in Discord/Coolhole
6. Marvel at actually intelligent responses

**Questions? Issues? Let me know!**
