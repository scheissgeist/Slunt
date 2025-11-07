// Deterministic command parser for Slunt
// Contract: parse(text, { username, platform }) -> { handled: boolean, response?: string }
// Keep side effects minimal; perform async actions safely inside parse when required.

class CommandParser {
  constructor(opts = {}) {
    this.coolPoints = opts.coolPoints || null;
    this.botName = opts.botName || 'Slunt';
    this.prefixes = ['!', '/'];
  }

  isCommand(text) {
    if (!text || typeof text !== 'string') return false;
    const t = text.trim();
    return this.prefixes.some(p => t.startsWith(p));
  }

  normalize(text) {
    return String(text || '').trim();
  }

  async parse(text, ctx = {}) {
    const raw = this.normalize(text);
    if (!this.isCommand(raw)) return { handled: false };

    // Strip prefix
    const prefix = this.prefixes.find(p => raw.startsWith(p)) || '';
    const body = raw.slice(prefix.length).trim();
    const [cmd, ...args] = body.split(/\s+/);
    const lcCmd = (cmd || '').toLowerCase();

    // Simple built-ins
    if (['ping'].includes(lcCmd)) {
      return { handled: true, response: 'pong' };
    }

    if (['help', 'commands'].includes(lcCmd)) {
      return {
        handled: true,
        response: 'commands: !ping, !help, !cp (balance), !cp give <user> <amount>'
      };
    }

    // CoolPoints commands (safe subset)
    if (['cp', 'coolpoints', 'balance'].includes(lcCmd)) {
      // Subcommand parsing
      if (args.length === 0 || ['me', 'balance'].includes(args[0]?.toLowerCase())) {
        const user = ctx.username;
        const bal = this.coolPoints?.getBalance ? this.coolPoints.getBalance(user) : 0;
        return { handled: true, response: `${user} has ${bal} CP` };
      }

      if (args[0]?.toLowerCase() === 'give') {
        if (!this.coolPoints || typeof this.coolPoints.transferPoints !== 'function') {
          return { handled: true, response: 'transfers are unavailable right now' };
        }
        const [_, targetRaw, amountRaw] = args; // eslint-disable-line no-unused-vars
        const target = (targetRaw || '').replace(/^@/, '');
        const amount = parseInt(amountRaw, 10);
        if (!target || !Number.isFinite(amount) || amount <= 0) {
          return { handled: true, response: 'usage: !cp give <user> <amount>' };
        }
        const from = ctx.username;
        const success = await this.coolPoints.transferPoints(from, target, amount);
        return {
          handled: true,
          response: success
            ? `${from} sent ${amount} CP to ${target}`
            : `insufficient balance for ${from}`
        };
      }

      // Unknown cp subcommand -> show help
      return { handled: true, response: 'usage: !cp | !cp give <user> <amount>' };
    }

    // Not a known command
    return { handled: false };
  }
}

module.exports = CommandParser;
