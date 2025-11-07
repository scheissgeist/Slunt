const CommandParser = require('../src/bot/CommandParser');

describe('CommandParser', () => {
  test('ignores non-commands', async () => {
    const p = new CommandParser();
    const res = await p.parse('hello', { username: 'alice', platform: 'coolhole' });
    expect(res.handled).toBe(false);
  });

  test('ping', async () => {
    const p = new CommandParser();
    const res = await p.parse('!ping', { username: 'alice' });
    expect(res).toEqual({ handled: true, response: 'pong' });
  });

  test('help', async () => {
    const p = new CommandParser();
    const res = await p.parse('/help', { username: 'alice' });
    expect(res.handled).toBe(true);
    expect(res.response).toMatch(/!cp/);
  });

  test('balance default', async () => {
    const stubCP = { getBalance: (u) => (u === 'alice' ? 123 : 0) };
    const p = new CommandParser({ coolPoints: stubCP });
    const res = await p.parse('!cp', { username: 'alice' });
    expect(res).toEqual({ handled: true, response: 'alice has 123 CP' });
  });

  test('cp give validates args', async () => {
    const p = new CommandParser({ coolPoints: {} });
    const res = await p.parse('!cp give', { username: 'alice' });
    expect(res.handled).toBe(true);
    expect(res.response).toMatch(/usage/i);
  });

  test('cp give success/fail', async () => {
    const transfers = [];
    const stubCP = {
      getBalance: () => 100,
      transferPoints: async (from, to, amt) => {
        transfers.push({ from, to, amt });
        return amt <= 50; // success if <= 50
      }
    };
    const p = new CommandParser({ coolPoints: stubCP });

    const ok = await p.parse('!cp give @bob 50', { username: 'alice' });
    expect(ok.handled).toBe(true);
    expect(ok.response).toMatch(/sent 50 CP to bob/);

    const fail = await p.parse('!cp give bob 75', { username: 'alice' });
    expect(fail.handled).toBe(true);
    expect(fail.response).toMatch(/insufficient/);

    expect(transfers).toHaveLength(2);
  });
});
