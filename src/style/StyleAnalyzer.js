// Simple, fast, platform-aware style analyzer for recent chat
// Computes a style profile from recent non-bot messages

'use strict';

class StyleAnalyzer {
  constructor(options = {}) {
    this.maxSamples = options.maxSamples || 40;
  }

  analyze(messages, platform = 'generic') {
    try {
      if (!Array.isArray(messages)) messages = [];
      const sample = messages.slice(-this.maxSamples);
      const stats = {
        count: sample.length,
        avgLen: 0,
        emojiRate: 0,
        emoteRate: 0,
        capsRate: 0,
        exclaimRate: 0,
        questionRate: 0,
        slangRate: 0,
        laughterRate: 0,
        profanityRate: 0,
        elongationRate: 0,
        topEmotes: [],
        commonTokens: [],
        platform
      };

      if (sample.length === 0) return stats;

      const emoteCounts = new Map();
      const tokenCounts = new Map();
      let totalLen = 0, emojiCount = 0, emoteCount = 0, capsCount = 0, exclaimCount = 0;
      let questionCount = 0, slangCount = 0, laughCount = 0, profCount = 0, elongCount = 0;

      const slang = /\b(ngl|tbh|ikr|idk|wdym|btw|irl|af|gg|pog|based|cringe|sus|cap)\b/i;
      const laugh = /\b(lol|lmao|rofl|haha|hehe|xd)\b/i;
      const profanity = /\b(fuck|shit|bitch|ass|wtf|damn|hell)\b/i;
      const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/u;

      for (const m of sample) {
        const text = String(m || '');
        totalLen += text.length;
        if (emojiRegex.test(text)) emojiCount++;
        if (/\b[A-Z][a-z]+\b/.test(text)) {
          // crude emote/token case for Twitch-like single-word emotes
          const matches = text.match(/\b[A-Z][a-zA-Z0-9]+\b/g) || [];
          for (const em of matches) {
            const prev = emoteCounts.get(em) || 0;
            emoteCounts.set(em, prev + 1);
            emoteCount++;
          }
        }
        if (text === text.toUpperCase() && text.replace(/[^A-Z]/g, '').length >= 3) capsCount++;
        if (text.includes('!')) exclaimCount++;
        if (text.includes('?')) questionCount++;
        if (slang.test(text)) slangCount++;
        if (laugh.test(text)) laughCount++;
        if (profanity.test(text)) profCount++;
        if (/(.)\1{2,}/.test(text)) elongCount++; // loooool

        // token counts
        for (const tok of text.toLowerCase().split(/[^a-z0-9']+/i)) {
          if (!tok || tok.length < 2) continue;
          const prev = tokenCounts.get(tok) || 0;
          tokenCounts.set(tok, prev + 1);
        }
      }

      stats.avgLen = totalLen / sample.length;
      stats.emojiRate = emojiCount / sample.length;
      stats.emoteRate = emoteCount / sample.length;
      stats.capsRate = capsCount / sample.length;
      stats.exclaimRate = exclaimCount / sample.length;
      stats.questionRate = questionCount / sample.length;
      stats.slangRate = slangCount / sample.length;
      stats.laughterRate = laughCount / sample.length;
      stats.profanityRate = profCount / sample.length;
      stats.elongationRate = elongCount / sample.length;

      stats.topEmotes = Array.from(emoteCounts.entries())
        .sort((a,b) => b[1]-a[1])
        .slice(0, 5)
        .map(([e]) => e);

      stats.commonTokens = Array.from(tokenCounts.entries())
        .sort((a,b) => b[1]-a[1])
        .slice(0, 20)
        .map(([t]) => t);

      return stats;
    } catch (e) {
      return { count: 0, platform };
    }
  }
}

module.exports = StyleAnalyzer;
