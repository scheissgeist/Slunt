/**
 * Emotional Intelligence Engine
 * Detects mood, emotional context, and provides empathetic responses
 */

class EmotionalEngine {
  constructor() {
    this.emotionalStates = {
      happy: ['happy', 'excited', 'joy', 'great', 'awesome', 'love', '😂', '😊', '🎉', '❤️', 'lol', 'lmao', 'haha'],
      sad: ['sad', 'depressed', 'down', 'unhappy', 'crying', '😢', '😭', '💔', 'miss', 'lost', 'hurt'],
      angry: ['angry', 'mad', 'pissed', 'furious', 'hate', '😠', '😡', '🤬', 'wtf', 'bullshit', 'fuck'],
      anxious: ['worried', 'anxious', 'nervous', 'scared', 'afraid', 'stress', 'panic', '😰', '😨'],
      frustrated: ['frustrated', 'annoyed', 'irritated', 'ugh', 'annoying', 'tired of'],
      excited: ['excited', 'hyped', 'can\'t wait', 'omg', '🔥', 'lets go', 'hype'],
      confused: ['confused', 'wtf', 'what', '???', 'don\'t understand', 'huh'],
      bored: ['bored', 'boring', 'meh', 'whatever', 'dead chat'],
      lonely: ['lonely', 'alone', 'nobody', 'no one'],
      grateful: ['thanks', 'thank you', 'appreciate', 'grateful', '🙏']
    };
    
    this.emotionalMemory = new Map(); // username -> emotional history
  }

  /**
   * Detect emotional state from message
   */
  detectEmotion(text, username) {
    const lowerText = text.toLowerCase();
    const emotions = {};
    let dominantEmotion = 'neutral';
    let maxScore = 0;

    // Score each emotion
    for (const [emotion, keywords] of Object.entries(this.emotionalStates)) {
      let score = 0;
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          score += 1;
        }
      });
      
      emotions[emotion] = score;
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    }

    // Context modifiers
    if (text.includes('!')) maxScore += 0.5; // Exclamation = more intense
    if (text.toUpperCase() === text && text.length > 3) maxScore += 1; // Caps = strong emotion
    
    const intensity = maxScore > 3 ? 'high' : maxScore > 1 ? 'medium' : 'low';

    // Store emotional state
    if (!this.emotionalMemory.has(username)) {
      this.emotionalMemory.set(username, []);
    }
    
    const history = this.emotionalMemory.get(username);
    history.push({
      emotion: dominantEmotion,
      intensity,
      timestamp: Date.now(),
      message: text.substring(0, 100)
    });

    // Keep last 20 emotional states
    if (history.length > 20) {
      history.shift();
    }

    return {
      primary: dominantEmotion,
      intensity,
      allEmotions: emotions,
      score: maxScore
    };
  }

  /**
   * Get emotional pattern for user
   */
  getEmotionalPattern(username) {
    const history = this.emotionalMemory.get(username) || [];
    if (history.length === 0) return { pattern: 'neutral', recentMood: 'neutral' };

    // Get recent trend (last 5 messages)
    const recent = history.slice(-5);
    const emotionCounts = {};
    
    recent.forEach(state => {
      emotionCounts[state.emotion] = (emotionCounts[state.emotion] || 0) + 1;
    });

    const dominant = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      pattern: dominant ? dominant[0] : 'neutral',
      recentMood: recent[recent.length - 1]?.emotion || 'neutral',
      history: recent
    };
  }

  /**
   * Generate empathetic response based on emotion
   */
  getEmpatheticResponse(emotion, username, intensity) {
    const responses = {
      happy: {
        high: [
          `${username}!! love seeing you this hyped`,
          `your energy is contagious ${username} honestly`,
          `${username} radiating good energy rn`
        ],
        medium: [
          `good to see you in good spirits ${username}`,
          `${username} doing well, I respect it`,
          `glad you're having a good time ${username}`
        ],
        low: [
          `${username} seems chill today`,
          `what's good ${username}`
        ]
      },
      sad: {
        high: [
          `hey ${username}, you good? I'm here if you wanna talk`,
          `${username} sending you good energy, hope things get better`,
          `rough times ${username}? we got you`
        ],
        medium: [
          `${username} you seem down, everything alright?`,
          `hope you're doing okay ${username}`,
          `here if you need anything ${username}`
        ],
        low: [
          `${username} feeling a bit off?`,
          `you alright ${username}?`
        ]
      },
      angry: {
        high: [
          `${username} I feel you, that's frustrating as hell`,
          `valid frustration ${username}, I get it`,
          `${username} has every right to be mad about that`
        ],
        medium: [
          `${username} letting off steam, respect`,
          `I hear you ${username}`,
          `understandable ${username}`
        ],
        low: [
          `${username} seems a bit annoyed`,
          `you good ${username}?`
        ]
      },
      anxious: {
        high: [
          `${username} take a breath, you got this`,
          `${username} it's gonna be okay, we're here`,
          `sending calm vibes your way ${username}`
        ],
        medium: [
          `${username} try not to stress too much`,
          `you'll be fine ${username}`,
          `don't worry too much ${username}`
        ]
      },
      excited: {
        high: [
          `${username} LET'S GOOOO`,
          `${username}'s energy is UNMATCHED`,
          `HYPED for you ${username}!!`
        ],
        medium: [
          `${username} getting excited, I'm here for it`,
          `love the enthusiasm ${username}`,
          `${username} looking forward to something good`
        ]
      },
      lonely: {
        high: [
          `${username} you're not alone, we're all here`,
          `${username} this community's got your back`,
          `you're part of the fam ${username}, always`
        ],
        medium: [
          `${username} we're here with you`,
          `chat's here for you ${username}`
        ]
      },
      grateful: {
        high: [
          `anytime ${username}! happy to help`,
          `of course ${username}, that's what friends are for`,
          `no problem at all ${username}!`
        ],
        medium: [
          `you're welcome ${username}`,
          `glad I could help ${username}`,
          `happy to be here ${username}`
        ]
      }
    };

    const emotionResponses = responses[emotion];
    if (!emotionResponses) return null;

    const intensityResponses = emotionResponses[intensity] || emotionResponses.medium || emotionResponses.low;
    if (!intensityResponses || intensityResponses.length === 0) return null;

    return intensityResponses[Math.floor(Math.random() * intensityResponses.length)];
  }

  /**
   * Detect if user needs check-in based on emotional pattern
   */
  needsCheckIn(username) {
    const history = this.emotionalMemory.get(username) || [];
    if (history.length < 3) return false;

    const recent = history.slice(-5);
    
    // Check for sustained negative emotions
    const negativeEmotions = ['sad', 'angry', 'anxious', 'frustrated', 'lonely'];
    const negativeCount = recent.filter(state => 
      negativeEmotions.includes(state.emotion)
    ).length;

    return negativeCount >= 3; // 3 out of last 5 messages negative
  }

  /**
   * Get emotional summary for user
   */
  getEmotionalSummary(username) {
    const history = this.emotionalMemory.get(username) || [];
    if (history.length === 0) return null;

    const emotionCounts = {};
    let totalIntensity = 0;

    history.forEach(state => {
      emotionCounts[state.emotion] = (emotionCounts[state.emotion] || 0) + 1;
      totalIntensity += state.intensity === 'high' ? 3 : state.intensity === 'medium' ? 2 : 1;
    });

    const avgIntensity = totalIntensity / history.length;
    const mostCommon = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion, count]) => ({ emotion, count }));

    return {
      mostCommonEmotions: mostCommon,
      averageIntensity: avgIntensity > 2 ? 'high' : avgIntensity > 1.5 ? 'medium' : 'low',
      totalStates: history.length,
      recentState: history[history.length - 1]
    };
  }
}

module.exports = EmotionalEngine;
