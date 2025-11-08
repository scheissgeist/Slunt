# 🚀 Quick Start: Meta-AI Supervisor

## What You Need

1. **Anthropic API Key** - Get it from https://console.anthropic.com/
   - Claude 3.5 Haiku costs ~$0.20/day for Meta-AI analysis
   - Free tier: $5 credit to start

2. **Enable in .env file**:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...your-key-here
   ENABLE_META_SUPERVISOR=true
   META_ANALYSIS_INTERVAL=6
   META_ERROR_SENSITIVITY=0.7
   ```

## How to Use

### Automatic Mode (Recommended)

Just start Slunt normally:
```bash
npm start
```

The Meta-AI Supervisor will:
- ✅ Start automatically
- ✅ Watch every conversation in real-time
- ✅ Run deep analysis every 6 hours
- ✅ Save learning data to `data/meta_learning/`

### Check Performance

View live stats in the logs:
```
🧠🎓 [MetaSupervisor] Stats: avg_quality=72, errors=3, analysis_count=2
```

### View Learning Data

All learning data is saved to JSON files:
- `data/meta_learning/error_patterns.json` - Detected error patterns
- `data/meta_learning/improvements.json` - Applied improvements
- `data/meta_learning/performance_history.json` - Performance over time

## What It Does

### Real-Time Error Detection

Every response is checked for:
- Quote wrapping: `"text here"` 
- Trailing fillers: `whatever`, `anyway`, `i guess`
- One-word responses: `yeah`, `ok`, `lol`
- Repetitive patterns
- User negative feedback: `shut up`, `dumb`, `boring`

### Deep Analysis (Every 6 Hours)

Claude AI reviews the last 50 conversations and provides:
```json
{
  "errorPatterns": [
    "Too aggressive 30% of the time",
    "Quote wrapping still happens occasionally"
  ],
  "personalityAdjustments": {
    "aggression": -0.1,
    "sarcasm": -0.05,
    "genuine": +0.15
  },
  "specificFixes": [
    "Remove quote wrapping from prompt",
    "Add more variety to responses"
  ],
  "overallAssessment": "Improving but still needs work on tone"
}
```

### Automatic Improvements

The Meta-AI automatically:
- Adjusts personality weights
- Updates error patterns
- Improves response validation
- Learns what works and what doesn't

## Manual Commands (Optional)

### Force Deep Analysis Now
```javascript
await chatBot.metaSupervisor.runDeepAnalysis();
```

### Check Current Stats
```javascript
const stats = chatBot.metaSupervisor.getStats();
console.log(stats);
```

### View Recent Errors
```javascript
const errors = chatBot.metaSupervisor.getRecentErrors();
console.log(errors);
```

## Cost Estimate

**With 500 messages/day:**
- Real-time monitoring: FREE (local JavaScript)
- Deep analysis (4x/day): ~$0.20/day = $6/month
- Total: Less than a cup of coffee per month

**Free tier lasts ~25 days** ($5 credit / $0.20 per day)

## Troubleshooting

### Meta-AI Not Starting
1. Check `.env` has valid `ANTHROPIC_API_KEY`
2. Check `ENABLE_META_SUPERVISOR=true`
3. Check logs for errors: `grep "MetaSupervisor" logs/slunt.log`

### No Deep Analysis Running
- Check `META_ANALYSIS_INTERVAL` is set (default: 6 hours)
- Wait at least 6 hours after startup
- Check logs for analysis runs

### Data Not Saving
- Check `data/meta_learning/` directory exists
- Check file permissions
- Look for error messages in logs

## Next Steps

1. Start Slunt and let it run for 6+ hours
2. Check `data/meta_learning/performance_history.json` to see improvements
3. Review Claude's analysis in the logs
4. Watch Slunt actually get smarter over time!

See **META_AI_SUPERVISOR.md** for full technical documentation.
