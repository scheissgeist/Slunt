/**
 * Clarifier module
 * Heuristics to decide when to ask a clarifying question and templates to do it briefly.
 */
function isAmbiguous(text = '') {
  const t = String(text || '').trim();
  if (t.length === 0) return true;
  // Short or vague
  if (t.length < 6) return true;
  const vague = /(thing|stuff|that|idk|whatever|maybe|k|ok|lol|lmao|huh|what)/i.test(t);
  const nonAlpha = (t.replace(/[^a-z]/gi, '').length / t.length) < 0.5; // emojis/symbols
  return vague || nonAlpha;
}

function buildClarifier({ user = 'you', platform = 'coolhole' } = {}) {
  const sep = platform === 'twitch' ? '' : '';
  const variants = [
    `what do you mean, ${user}?`,
    `clarify a bit?`,
    `which part do you mean?`,
    `explain that a little?`
  ];
  return variants[Math.floor(Math.random() * variants.length)];
}

module.exports = { isAmbiguous, buildClarifier };
