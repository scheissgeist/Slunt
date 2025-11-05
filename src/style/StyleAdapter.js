'use strict';

// Adapts Slunt's outgoing text to match platform/community style
class StyleAdapter {
  constructor(options = {}) {
    this.maxLenTwitch = options.maxLenTwitch || 140; // Twitch favors short
    this.maxLenDiscord = options.maxLenDiscord || 220;
    this.maxLenGeneric = options.maxLenGeneric || 250;
  }

  adapt(text, profile = {}, platform = 'generic') {
    try {
      let out = String(text || '').trim();
      if (!out) return out;

      // 1) Platform length shaping
      const maxLen = platform === 'twitch' ? this.maxLenTwitch : platform === 'discord' ? this.maxLenDiscord : this.maxLenGeneric;
      if (out.length > maxLen) {
        // prefer cutting at sentence boundary then word boundary
        const cut1 = out.lastIndexOf('. ', maxLen);
        const cut2 = out.lastIndexOf(' ', Math.min(maxLen, out.length - 1));
        const cut = cut1 > 40 ? cut1 + 1 : (cut2 > 40 ? cut2 : maxLen);
        out = out.slice(0, cut).trim();
        if (!/[.!?]$/.test(out)) out += '.';
      }

      // 2) Emulate punctuation energy
      if (profile.exclaimRate > 0.25 && !out.endsWith('!') && out.length < 120) {
        out = out.replace(/[.!?]$/, '');
        out += '!';
      }

      // 3) Add occasional slang/laughter where appropriate (Twitch-heavy)
      const canSpice = out.length >= 12 && !/```|http|discord\.gg|@everyone|\/\w+/.test(out);
      if (canSpice) {
        if (platform === 'twitch') {
          if (profile.laughterRate > 0.15 && Math.random() < 0.25 && !/lol|lmao|haha/i.test(out)) {
            out += Math.random() < 0.5 ? ' lol' : ' LMAO';
          }
          if (profile.slangRate > 0.2 && Math.random() < 0.2) {
            out = this._injectAfterFirstClause(out, Math.random() < 0.5 ? 'fr' : 'tbh');
          }
        } else {
          if (profile.questionRate > 0.35 && !out.endsWith('?') && Math.random() < 0.15) {
            out = out.replace(/[.!]$/, '?');
          }
        }
      }

      // 4) Emote harmonization (Twitch)
      if (platform === 'twitch' && Array.isArray(profile.topEmotes) && profile.topEmotes.length > 0) {
        if (Math.random() < 0.2 && out.length < 120 && !/\b[A-Z][a-zA-Z0-9]+\b/.test(out)) {
          const em = profile.topEmotes[Math.floor(Math.random() * profile.topEmotes.length)];
          out = `${out} ${em}`.trim();
        }
      }

      // 5) Light casing softening if community uses lower-case
      if (platform !== 'twitch' && profile.capsRate < 0.05 && Math.random() < 0.2) {
        out = this._softLower(out);
      }

      // 6) Human-like hesitations occasionally (not for commands)
      if (!out.startsWith('/') && !out.startsWith('!') && Math.random() < 0.08 && out.length < 120) {
        out = this._injectHedge(out);
      }

      return out.trim();
    } catch (e) {
      return text;
    }
  }

  _softLower(s) {
    // Lowercase first word only if sentence not a proper noun start
    return s.replace(/^[A-Z][a-z]/, m => m.toLowerCase());
  }

  _injectHedge(s) {
    const hedges = ['idk', 'maybe', 'i think', 'kinda', 'sorta'];
    const h = hedges[Math.floor(Math.random()*hedges.length)];
    if (s.length < 40) return `${s}${Math.random()<0.5?',':''} ${h}`.trim();
    return s.replace(/(,|\.|!|\?)\s*$/, m => `${m} ${h}`);
  }

  _injectAfterFirstClause(s, add) {
    const idx = s.indexOf(',');
    if (idx > 8) return `${s.slice(0, idx+1)} ${add} ${s.slice(idx+1).trim()}`;
    const words = s.split(/\s+/);
    if (words.length > 6) {
      words.splice(3, 0, add);
      return words.join(' ');
    }
    return `${s} ${add}`;
  }
}

module.exports = StyleAdapter;
