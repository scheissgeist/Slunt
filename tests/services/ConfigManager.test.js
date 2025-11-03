const ConfigManager = require('../../src/services/ConfigManager');

describe('ConfigManager', () => {
  let config;

  beforeEach(() => {
    // Get fresh instance
    config = require('../../src/services/ConfigManager');
  });

  describe('get', () => {
    test('should get nested config value', () => {
      const port = config.get('server.port');
      expect(port).toBeDefined();
      expect(typeof port).toBe('number');
    });

    test('should return default value for missing key', () => {
      const value = config.get('nonexistent.key', 'default');
      expect(value).toBe('default');
    });

    test('should get top-level config', () => {
      const server = config.get('server');
      expect(server).toBeDefined();
      expect(server).toHaveProperty('port');
    });
  });

  describe('set', () => {
    test('should set nested config value', () => {
      config.set('server.port', 4000);
      expect(config.get('server.port')).toBe(4000);
    });

    test('should create nested path if missing', () => {
      config.set('custom.new.value', 'test');
      expect(config.get('custom.new.value')).toBe('test');
    });
  });

  describe('validate', () => {
    test('should validate config with valid settings', () => {
      // Ensure all required settings are valid
      config.set('server.port', 3000);
      config.set('ai.provider', 'ollama');
      const result = config.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail on invalid port', () => {
      config.set('server.port', 99999);
      const result = config.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should fail on invalid AI provider', () => {
      config.set('ai.provider', 'invalid');
      const result = config.validate();
      expect(result.valid).toBe(false);
    });
  });

  describe('getAll', () => {
    test('should return full config object', () => {
      const all = config.getAll();
      expect(all).toHaveProperty('server');
      expect(all).toHaveProperty('ai');
      expect(all).toHaveProperty('memory');
    });

    test('should return copy not reference', () => {
      const all = config.getAll();
      all.server.port = 9999;
      expect(config.get('server.port')).not.toBe(9999);
    });
  });
});
