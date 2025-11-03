const DataValidator = require('../../src/services/DataValidator');
const fs = require('fs');
const path = require('path');

describe('DataValidator', () => {
  let validator;
  const testDataDir = './test-data';
  const testBackupDir = './test-backups';

  beforeEach(() => {
    validator = new DataValidator(testDataDir, testBackupDir);

    // Create test directories
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    if (!fs.existsSync(testBackupDir)) {
      fs.mkdirSync(testBackupDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup test directories
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testBackupDir)) {
      fs.rmSync(testBackupDir, { recursive: true, force: true });
    }
  });

  describe('safeLoad', () => {
    test('should load valid JSON file', () => {
      const testFile = 'test.json';
      const testData = { foo: 'bar' };
      fs.writeFileSync(
        path.join(testDataDir, testFile),
        JSON.stringify(testData)
      );

      const result = validator.safeLoad(testFile);
      expect(result).toEqual(testData);
    });

    test('should return default value for non-existent file', () => {
      const defaultValue = { default: true };
      const result = validator.safeLoad('nonexistent.json', defaultValue);
      expect(result).toEqual(defaultValue);
    });

    test('should quarantine corrupted file', () => {
      const testFile = 'corrupted.json';
      const filepath = path.join(testDataDir, testFile);
      fs.writeFileSync(filepath, '{invalid json}');

      const result = validator.safeLoad(testFile, { recovered: true });

      // Check that corrupted file was moved
      const files = fs.readdirSync(testDataDir);
      const corruptedFiles = files.filter(f => f.includes('.corrupted.'));
      expect(corruptedFiles.length).toBeGreaterThan(0);
    });

    test('should return default for empty file', () => {
      const testFile = 'empty.json';
      fs.writeFileSync(path.join(testDataDir, testFile), '');

      const result = validator.safeLoad(testFile, { empty: true });
      expect(result).toEqual({ empty: true });
    });
  });

  describe('validateSchema', () => {
    test('should validate array schema', () => {
      const result = validator.validateSchema('memory_long_term.json', []);
      expect(result).toBe(true);
    });

    test('should validate object schema', () => {
      const result = validator.validateSchema('chat_learning.json', {});
      expect(result).toBe(true);
    });

    test('should fail on type mismatch', () => {
      const result = validator.validateSchema('memory_long_term.json', {});
      expect(result).toBe(false);
    });

    test('should pass for undefined schema', () => {
      const result = validator.validateSchema('unknown.json', 'anything');
      expect(result).toBe(true);
    });
  });

  describe('safeSave', () => {
    test('should save valid data', () => {
      const testFile = 'save-test.json';
      const testData = { saved: true };

      const result = validator.safeSave(testFile, testData);
      expect(result).toBe(true);

      // Verify file was created
      const filepath = path.join(testDataDir, testFile);
      expect(fs.existsSync(filepath)).toBe(true);

      // Verify content
      const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      expect(content).toEqual(testData);
    });

    test('should fail on schema validation failure', () => {
      const result = validator.safeSave('memory_long_term.json', {});
      expect(result).toBe(false);
    });

    test('should use atomic write (temp file)', () => {
      const testFile = 'atomic-test.json';
      const testData = { atomic: true };

      validator.safeSave(testFile, testData);

      // Temp file should not exist after successful save
      const tempPath = path.join(testDataDir, `${testFile}.tmp`);
      expect(fs.existsSync(tempPath)).toBe(false);
    });
  });

  describe('attemptRecovery', () => {
    test('should recover from backup', () => {
      const testFile = 'recovery-test.json';
      const backupData = { recovered: true };

      // Create a backup
      const backupDir = path.join(testBackupDir, 'backup_test_2025-01-01');
      fs.mkdirSync(backupDir, { recursive: true });
      fs.writeFileSync(
        path.join(backupDir, testFile),
        JSON.stringify(backupData)
      );

      const result = validator.attemptRecovery(testFile, { failed: true });
      expect(result).toEqual(backupData);
    });

    test('should return default when no backups exist', () => {
      const defaultValue = { noBackup: true };
      const result = validator.attemptRecovery('missing.json', defaultValue);
      expect(result).toEqual(defaultValue);
    });
  });

  describe('validateAllFiles', () => {
    test('should report valid files', () => {
      fs.writeFileSync(
        path.join(testDataDir, 'valid.json'),
        JSON.stringify({ valid: true })
      );

      const report = validator.validateAllFiles();
      expect(report.valid).toContain('valid.json');
      expect(report.total).toBe(1);
    });

    test('should report invalid files', () => {
      fs.writeFileSync(
        path.join(testDataDir, 'invalid.json'),
        '{broken json'
      );

      const report = validator.validateAllFiles();
      expect(report.invalid).toContain('invalid.json');
    });

    test('should ignore corrupted files', () => {
      fs.writeFileSync(
        path.join(testDataDir, 'file.json.corrupted.123'),
        '{}'
      );

      const report = validator.validateAllFiles();
      expect(report.total).toBe(0);
    });
  });
});
