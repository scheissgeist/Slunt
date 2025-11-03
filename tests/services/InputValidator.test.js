const InputValidator = require('../../src/services/InputValidator');

describe('InputValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new InputValidator();
  });

  describe('validateUsername', () => {
    test('should accept valid username', () => {
      const result = validator.validateUsername('testuser123');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('testuser123');
    });

    test('should accept username with underscore and dash', () => {
      const result = validator.validateUsername('test_user-123');
      expect(result.valid).toBe(true);
    });

    test('should reject username with spaces', () => {
      const result = validator.validateUsername('test user');
      expect(result.valid).toBe(false);
    });

    test('should reject empty username', () => {
      const result = validator.validateUsername('');
      expect(result.valid).toBe(false);
    });

    test('should reject username over 32 chars', () => {
      const result = validator.validateUsername('a'.repeat(33));
      expect(result.valid).toBe(false);
    });

    test('should reject special characters', () => {
      const result = validator.validateUsername('test@user');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateMessage', () => {
    test('should accept valid message', () => {
      const result = validator.validateMessage('Hello world!');
      expect(result.valid).toBe(true);
    });

    test('should reject empty message', () => {
      const result = validator.validateMessage('   ');
      expect(result.valid).toBe(false);
    });

    test('should reject message over 2000 chars', () => {
      const result = validator.validateMessage('a'.repeat(2001));
      expect(result.valid).toBe(false);
    });

    test('should sanitize dangerous characters', () => {
      const result = validator.validateMessage('Test <script>alert("xss")</script>');
      expect(result.valid).toBe(true);
      expect(result.value).not.toContain('<script>');
      expect(result.value).toContain('&lt;');
    });
  });

  describe('validateAmount', () => {
    test('should accept positive number', () => {
      const result = validator.validateAmount(100);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(100);
    });

    test('should accept negative number', () => {
      const result = validator.validateAmount(-50);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(-50);
    });

    test('should parse string number', () => {
      const result = validator.validateAmount('250');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(250);
    });

    test('should reject non-numeric', () => {
      const result = validator.validateAmount('abc');
      expect(result.valid).toBe(false);
    });

    test('should reject out of range', () => {
      const result = validator.validateAmount(2000000);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateQuery', () => {
    test('should accept valid query', () => {
      const result = validator.validateQuery('search term');
      expect(result.valid).toBe(true);
    });

    test('should reject query over 500 chars', () => {
      const result = validator.validateQuery('a'.repeat(501));
      expect(result.valid).toBe(false);
    });

    test('should sanitize query', () => {
      const result = validator.validateQuery('test<script>');
      expect(result.valid).toBe(true);
      expect(result.value).toContain('&lt;');
    });
  });

  describe('validatePlatform', () => {
    test('should accept valid platforms', () => {
      expect(validator.validatePlatform('coolhole').valid).toBe(true);
      expect(validator.validatePlatform('discord').valid).toBe(true);
      expect(validator.validatePlatform('twitch').valid).toBe(true);
    });

    test('should reject invalid platform', () => {
      const result = validator.validatePlatform('youtube');
      expect(result.valid).toBe(false);
    });

    test('should reject empty platform', () => {
      const result = validator.validatePlatform('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePagination', () => {
    test('should validate valid pagination', () => {
      const result = validator.validatePagination(2, 20);
      expect(result.valid).toBe(true);
      expect(result.value.page).toBe(2);
      expect(result.value.limit).toBe(20);
      expect(result.value.offset).toBe(20);
    });

    test('should reject invalid values', () => {
      const result = validator.validatePagination(null, null);
      expect(result.valid).toBe(false);
    });

    test('should reject page < 1', () => {
      const result = validator.validatePagination(0, 20);
      expect(result.valid).toBe(false);
    });

    test('should reject limit > 100', () => {
      const result = validator.validatePagination(1, 200);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateObject', () => {
    test('should validate object with schema', () => {
      const schema = {
        username: { required: true, type: 'string' },
        age: { required: false, type: 'number' }
      };

      const obj = { username: 'test', age: 25 };
      const result = validator.validateObject(obj, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail on missing required field', () => {
      const schema = {
        username: { required: true, type: 'string' }
      };

      const obj = {};
      const result = validator.validateObject(obj, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate min/max for numbers', () => {
      const schema = {
        score: { type: 'number', min: 0, max: 100 }
      };

      expect(validator.validateObject({ score: 50 }, schema).valid).toBe(true);
      expect(validator.validateObject({ score: -10 }, schema).valid).toBe(false);
      expect(validator.validateObject({ score: 150 }, schema).valid).toBe(false);
    });

    test('should validate string length', () => {
      const schema = {
        name: { type: 'string', minLength: 2, maxLength: 10 }
      };

      expect(validator.validateObject({ name: 'test' }, schema).valid).toBe(true);
      expect(validator.validateObject({ name: 'a' }, schema).valid).toBe(false);
      expect(validator.validateObject({ name: 'a'.repeat(11) }, schema).valid).toBe(false);
    });

    test('should validate enum values', () => {
      const schema = {
        status: { type: 'string', enum: ['active', 'inactive'] }
      };

      expect(validator.validateObject({ status: 'active' }, schema).valid).toBe(true);
      expect(validator.validateObject({ status: 'pending' }, schema).valid).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    test('should escape HTML characters', () => {
      const result = validator.sanitizeString('<div>test</div>');
      expect(result).toBe('&lt;div&gt;test&lt;/div&gt;');
    });

    test('should escape quotes', () => {
      const result = validator.sanitizeString('test "quote" and \'single\'');
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
    });

    test('should escape ampersand', () => {
      const result = validator.sanitizeString('test & more');
      expect(result).toContain('&amp;');
    });

    test('should handle non-string input', () => {
      expect(validator.sanitizeString(123)).toBe(123);
      expect(validator.sanitizeString(null)).toBe(null);
    });
  });
});
