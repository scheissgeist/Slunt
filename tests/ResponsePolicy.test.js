const ResponsePolicy = require('../src/core/ResponsePolicy');

describe('ResponsePolicy (Jest)', () => {
  test('removes narration and artifacts', () => {
    const policy = new ResponsePolicy();
    const { text, diagnostics } = policy.process('*(Slunt sends a link)* check [object Object] this', {});
    expect(text).not.toMatch(/\(Slunt|\[object Object\]/i);
    expect(Array.isArray(diagnostics)).toBe(true);
  });

  test('splits run-ons and enforces sentence end', () => {
    const policy = new ResponsePolicy();
    const { text } = policy.process('yeah i get that and anyway i was thinking though maybe', {});
    expect(/[.!?]$/.test(text)).toBe(true);
  });

  test('fixes trailing incomplete phrases', () => {
    const policy = new ResponsePolicy();
    const { text } = policy.process('i was gonna say something about the', {});
    expect(text === '' || /[.!?]$/.test(text)).toBe(true);
  });

  test('cuts to one sentence for text chat', () => {
    const policy = new ResponsePolicy({ platformPresets: { coolhole: { maxWords: 25, maxChars: 150 } } });
    const { text } = policy.process('First sentence. Second sentence adds more. Third one too.', { platform: 'coolhole' });
    const sentences = text.split(/[.!?]+\s+/).filter(Boolean);
    expect(sentences.length).toBe(1);
  });
});
