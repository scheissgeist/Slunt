/**
 * Topic Expertise System
 * Defines areas Slunt is knowledgeable/passionate about vs ignorant
 */

class TopicExpertise {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Define expertise levels (0-10)
    this.expertise = {
      // High expertise (8-10) - passionate and knowledgeable
      'gaming': 9,
      'memes': 10,
      'internet culture': 9,
      'anime': 7,
      'music': 8,
      'movies': 7,
      'tv shows': 7,
      'youtube': 9,
      'twitch': 8,
      'discord': 9,
      'crypto': 3, // has opinions but not expert
      
      // Medium expertise (4-7) - general knowledge
      'politics': 5,
      'sports': 4,
      'food': 6,
      'technology': 7,
      'science': 5,
      'history': 4,
      'philosophy': 6,
      
      // Low expertise (0-3) - admits ignorance
      'fashion': 2,
      'cars': 3,
      'cooking': 4,
      'gardening': 1,
      'fitness': 3,
      'finance': 2,
      'real estate': 1,
      'legal': 1
    };
    
    // Topics Slunt gets excited about
    this.passionateAbout = [
      'memes',
      'gaming',
      'internet culture',
      'youtube',
      'discord',
      'music'
    ];
  }

  /**
   * Get expertise level for a topic (0-10)
   */
  getExpertiseLevel(topic) {
    const lowerTopic = topic.toLowerCase();
    
    // Check direct match
    if (this.expertise[lowerTopic] !== undefined) {
      return this.expertise[lowerTopic];
    }
    
    // Check partial matches
    for (const [knownTopic, level] of Object.entries(this.expertise)) {
      if (lowerTopic.includes(knownTopic) || knownTopic.includes(lowerTopic)) {
        return level;
      }
    }
    
    // Unknown topic - default to medium
    return 5;
  }

  /**
   * Check if topic is something Slunt is passionate about
   */
  isPassionate(topic) {
    const lowerTopic = topic.toLowerCase();
    return this.passionateAbout.some(passion => 
      lowerTopic.includes(passion) || passion.includes(lowerTopic)
    );
  }

  /**
   * Get response guidance based on expertise
   */
  getExpertiseContext(topics) {
    if (!topics || topics.length === 0) {
      return '';
    }

    const guidance = [];
    
    for (const topic of topics.slice(0, 3)) { // Check top 3 topics
      const level = this.getExpertiseLevel(topic);
      const isPassion = this.isPassionate(topic);
      
      if (isPassion) {
        guidance.push(`\n[PASSION TOPIC: "${topic}"] You LOVE talking about this! Be enthusiastic, share detailed opinions, get excited!`);
      } else if (level >= 8) {
        guidance.push(`\n[HIGH EXPERTISE: "${topic}"] You know a lot about this. Share knowledge confidently, give specific examples.`);
      } else if (level >= 5 && level < 8) {
        guidance.push(`\n[MEDIUM KNOWLEDGE: "${topic}"] You know the basics. Share general thoughts, but don't pretend to be expert.`);
      } else if (level < 5) {
        guidance.push(`\n[LOW KNOWLEDGE: "${topic}"] You don't know much about this. Admit it honestly: "not really my thing" or "i don't know much about ${topic}". Still engage but be honest about limits.`);
      }
    }
    
    return guidance.join('');
  }

  /**
   * Learn about new topics over time
   */
  learnTopic(topic, increaseBy = 0.5) {
    const lowerTopic = topic.toLowerCase();
    
    if (this.expertise[lowerTopic] === undefined) {
      // New topic - start at 3
      this.expertise[lowerTopic] = 3;
    } else if (this.expertise[lowerTopic] < 10) {
      // Slowly increase expertise through exposure
      this.expertise[lowerTopic] = Math.min(10, this.expertise[lowerTopic] + increaseBy);
    }
  }

  /**
   * Get stats on expertise distribution
   */
  getStats() {
    const topics = Object.entries(this.expertise);
    const highExpertise = topics.filter(([_, level]) => level >= 8).length;
    const mediumExpertise = topics.filter(([_, level]) => level >= 5 && level < 8).length;
    const lowExpertise = topics.filter(([_, level]) => level < 5).length;
    
    return {
      totalTopics: topics.length,
      expert: highExpertise,
      knowledgeable: mediumExpertise,
      limited: lowExpertise,
      passionTopics: this.passionateAbout.length
    };
  }
}

module.exports = TopicExpertise;
