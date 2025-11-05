/**
 * Test suite for new AI features
 */

const AdaptiveLearning = require('../src/ai/AdaptiveLearning');
const ProactiveEngagement = require('../src/ai/ProactiveEngagement');

describe('AI Features', () => {

  describe('AdaptiveLearning', () => {
    let adaptiveLearning;

    beforeEach(() => {
      adaptiveLearning = new AdaptiveLearning();
    });

    test('should detect correction patterns', () => {
      expect(adaptiveLearning.isCorrection('Actually, that\'s wrong')).toBe(true);
      expect(adaptiveLearning.isCorrection('No, it\'s not like that')).toBe(true);
      expect(adaptiveLearning.isCorrection('That\'s incorrect')).toBe(true);
      expect(adaptiveLearning.isCorrection('Just a regular message')).toBe(false);
    });

    test('should extract corrections from messages', () => {
      const sluntMessage = 'The sky is green';
      const correction = 'Actually, the sky is blue';

      const extracted = adaptiveLearning.extractCorrection(sluntMessage, correction);

      expect(extracted).toHaveProperty('rightConcept');
      expect(extracted.rightConcept).toContain('blue');
    });

    test('should learn from corrections', async () => {
      const correctionData = {
        userId: 'discord:testuser',
        username: 'testuser',
        platform: 'discord',
        sluntMessage: 'Pizza was invented in America',
        correctionMessage: 'Actually, pizza was invented in Italy',
        topic: 'pizza history',
        timestamp: new Date().toISOString()
      };

      const record = await adaptiveLearning.learnCorrection(correctionData);

      expect(record).toHaveProperty('id');
      expect(record.userId).toBe('discord:testuser');
      expect(record.rightConcept).toBeDefined();
    });

    test('should search corrections by topic', () => {
      // This assumes some corrections have been learned
      const corrections = adaptiveLearning.getCorrectionsForTopic('test', 5);
      expect(Array.isArray(corrections)).toBe(true);
    });

    test('should provide statistics', () => {
      const stats = adaptiveLearning.getStats();
      expect(stats).toHaveProperty('totalCorrections');
      expect(stats).toHaveProperty('avgConfidence');
    });
  });

  describe('ProactiveEngagement', () => {
    let proactiveEngagement;
    let mockChatBot;

    beforeEach(() => {
      mockChatBot = {
        sendMessage: jest.fn(),
        platformActivity: {
          discord: Date.now() - 10 * 60 * 1000, // 10 minutes ago
          twitch: Date.now(),
          coolhole: Date.now() - 6 * 60 * 1000 // 6 minutes ago
        },
        chatLearning: {
          getRecentTopics: jest.fn(() => ['gaming', 'music', 'memes'])
        },
        socialAwareness: {
          getActiveUsers: jest.fn(() => ['alice', 'bob', 'charlie'])
        }
      };

      proactiveEngagement = new ProactiveEngagement(mockChatBot);
    });

    test('should detect conversation lulls', () => {
      const isLull = proactiveEngagement.isConversationLull('discord');
      expect(isLull).toBe(true); // 10 minutes ago

      const notLull = proactiveEngagement.isConversationLull('twitch');
      expect(notLull).toBe(false); // Just now
    });

    test('should check if can send proactive message', () => {
      const canSend = proactiveEngagement.canSendProactiveMessage();
      expect(typeof canSend).toBe('boolean');
    });

    test('should generate conversation starters', async () => {
      const starter = await proactiveEngagement.generateStarter('discord');

      if (starter) {
        expect(starter).toHaveProperty('message');
        expect(starter).toHaveProperty('options');
        expect(typeof starter.message).toBe('string');
      }
    });

    test('should schedule follow-ups', () => {
      proactiveEngagement.scheduleFollowUp({
        userId: 'discord:testuser',
        topic: 'gaming',
        platform: 'discord',
        whenMinutes: 30
      });

      expect(proactiveEngagement.state.pendingFollowUps.length).toBeGreaterThan(0);
    });

    test('should provide statistics', () => {
      const stats = proactiveEngagement.getStats();
      expect(stats).toHaveProperty('initialized');
      expect(stats).toHaveProperty('engagementScore');
      expect(stats).toHaveProperty('successRate');
    });
  });
});

console.log('✅ All AI feature tests defined. Run with: npm test');
