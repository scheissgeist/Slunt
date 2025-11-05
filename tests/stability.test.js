/**
 * Test suite for stability systems
 */

const DataArchiver = require('../src/stability/DataArchiver');
const MemoryQuota = require('../src/stability/MemoryQuota');
const WriteQueue = require('../src/stability/WriteQueue');
const UserIdentification = require('../src/services/UserIdentification');
const fs = require('fs');
const path = require('path');

describe('Stability Systems', () => {

  describe('UserIdentification', () => {
    test('should create prefixed user IDs', () => {
      const userId = UserIdentification.createUserId('discord', 'alice');
      expect(userId).toBe('discord:alice');
    });

    test('should parse user IDs correctly', () => {
      const parsed = UserIdentification.parseUserId('twitch:bob');
      expect(parsed.platform).toBe('twitch');
      expect(parsed.username).toBe('bob');
    });

    test('should handle legacy IDs without prefix', () => {
      const parsed = UserIdentification.parseUserId('charlie');
      expect(parsed.platform).toBe('unknown');
      expect(parsed.username).toBe('charlie');
    });

    test('should normalize user IDs', () => {
      const normalized = UserIdentification.normalize('dave', 'coolhole');
      expect(normalized).toBe('coolhole:dave');
    });

    test('should compare user IDs correctly', () => {
      expect(UserIdentification.isSameUser('discord:eve', 'discord:eve')).toBe(true);
      expect(UserIdentification.isSameUser('discord:eve', 'twitch:eve')).toBe(false);
    });
  });

  describe('WriteQueue', () => {
    const testDir = path.join(__dirname, '../data/test');
    const testFile = path.join(testDir, 'test_write.json');

    beforeAll(() => {
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
    });

    afterAll(() => {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    });

    test('should write JSON safely', async () => {
      const data = { test: 'value', number: 42 };
      await WriteQueue.writeJSON(testFile, data);

      expect(fs.existsSync(testFile)).toBe(true);

      const content = fs.readFileSync(testFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.test).toBe('value');
      expect(parsed.number).toBe(42);
    });

    test('should handle multiple concurrent writes', async () => {
      const writes = [];
      for (let i = 0; i < 10; i++) {
        writes.push(WriteQueue.writeJSON(testFile, { count: i }));
      }

      await Promise.all(writes);

      // File should still be valid JSON
      const content = fs.readFileSync(testFile, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    test('should provide queue statistics', () => {
      const stats = WriteQueue.getStats();
      expect(stats).toHaveProperty('totalWrites');
      expect(stats).toHaveProperty('queuedWrites');
      expect(stats).toHaveProperty('averageWaitTimeMs');
    });
  });

  describe('MemoryQuota', () => {
    test('should have default quotas defined', () => {
      const dataArchiver = new DataArchiver();
      const memoryQuota = new MemoryQuota(dataArchiver);

      const quotas = memoryQuota.getQuotas();
      expect(quotas).toHaveProperty('chat_learning.json');
      expect(quotas).toHaveProperty('default');
    });

    test('should check file against quota', () => {
      const dataArchiver = new DataArchiver();
      const memoryQuota = new MemoryQuota(dataArchiver);

      // This will check if the file exists and compare to quota
      const status = memoryQuota.checkFile('chat_learning.json');
      expect(status).toHaveProperty('filename');
      expect(status).toHaveProperty('exists');
    });

    test('should calculate total size', () => {
      const dataArchiver = new DataArchiver();
      const memoryQuota = new MemoryQuota(dataArchiver);

      const sizeInfo = memoryQuota.getTotalSize();
      if (sizeInfo) {
        expect(sizeInfo).toHaveProperty('totalSizeMB');
        expect(sizeInfo).toHaveProperty('percentUsed');
      }
    });
  });

  describe('DataArchiver', () => {
    test('should have archive directory configured', () => {
      const archiver = new DataArchiver();
      expect(archiver.archiveDir).toBeDefined();
    });

    test('should get archive statistics', () => {
      const archiver = new DataArchiver();
      const stats = archiver.getStats();

      if (stats) {
        expect(stats).toHaveProperty('dataFiles');
        expect(stats).toHaveProperty('archiveFiles');
      }
    });

    test('should separate data by age', () => {
      const archiver = new DataArchiver();
      const testData = [
        { timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), value: 'old' },
        { timestamp: new Date().toISOString(), value: 'new' }
      ];

      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { oldData, recentData } = archiver.separateDataByAge(testData, cutoffDate);

      expect(oldData.length).toBe(1);
      expect(recentData.length).toBe(1);
      expect(oldData[0].value).toBe('old');
      expect(recentData[0].value).toBe('new');
    });
  });
});

console.log('✅ All stability tests defined. Run with: npm test');
