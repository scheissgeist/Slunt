/**
 * Emotional Intelligence System
 * Detects user mood/emotions and responds appropriately
 */

class EmotionalIntelligence {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.userMoods = new Map(); // username -> current mood state
  }

  /**
   * Analyze emotional state from message
   */
  analyzeMood(username, text) {
    const lowerText = text.toLowerCase();
    const mood = {
      primary: 'neutral',
      intensity: 0, // 0-10
      needsSupport: false,
      timestamp: Date.now()
    };

    // Excited/Happy
    if (lowerText.match(/\b(hype|excited|amazing|awesome|love it|hell yeah|let's go|poggers|pog)\b/i) ||
        text.includes('!') && text.split('!').length > 2) {
      mood.primary = 'excited';
      mood.intensity = 7;
    }

    // Sad/Down
    else if (lowerText.match(/\b(sad|depressed|down|miserable|awful|terrible|hate this|kill me)\b/)) {
      mood.primary = 'sad';
      mood.intensity = 6;
      mood.needsSupport = true;
    }

    // Frustrated/Angry
    else if (lowerText.match(/\b(fuck|shit|damn|pissed|angry|mad|annoying|frustrating|hate)\b/)) {
      mood.primary = 'frustrated';
      mood.intensity = lowerText.match(/\b(fuck|shit)\b/) ? 8 : 5;
      mood.needsSupport = true;
    }

    // Anxious/Stressed
    else if (lowerText.match(/\b(stressed|anxious|worried|nervous|scared|panic|overwhelm)\b/)) {
      mood.primary = 'anxious';
      mood.intensity = 6;
      mood.needsSupport = true;
    }

    // Confused
    else if (lowerText.match(/\b(confused|lost|what|huh|\?\?\?|idk what|don't understand)\b/)) {
      mood.primary = 'confused';
      mood.intensity = 4;
    }

    // Tired/Exhausted
    else if (lowerText.match(/\b(tired|exhausted|sleepy|drained|dead|dying|can't even)\b/)) {
      mood.primary = 'tired';
      mood.intensity = 5;
    }

    // Bored
    else if (lowerText.match(/\b(bored|boring|nothing to do|dead chat|quiet)\b/)) {
      mood.primary = 'bored';
      mood.intensity = 3;
    }

    this.userMoods.set(username, mood);
    
    if (mood.needsSupport) {
      console.log(`💙 [Emotional] ${username} seems ${mood.primary}, needs support`);
    }

    return mood;
  }

  /**
   * Get emotional context for response
   */
  getEmotionalContext(username, text) {
    const mood = this.analyzeMood(username, text);
    const profile = this.chatBot.userProfiles?.get(username);
    const friendship = profile?.friendshipLevel || 0;

    let context = `\n[EMOTIONAL STATE: ${mood.primary.toUpperCase()}]`;

    switch (mood.primary) {
      case 'excited':
        context += ' They\'re excited! Match their energy! Use exclamation marks, be enthusiastic, share their hype!';
        break;

      case 'sad':
        if (friendship > 50) {
          context += ' They\'re going through it. Be supportive but not preachy. "that sucks man" or "wanna talk about it?" Light distraction might help.';
        } else {
          context += ' They seem down. Be empathetic but brief. "hope things get better" type vibes.';
        }
        break;

      case 'frustrated':
        if (mood.intensity > 7) {
          context += ' They\'re PISSED. Validate their frustration. "yeah that\'s bullshit" or "i\'d be mad too". Don\'t try to fix it immediately.';
        } else {
          context += ' They\'re annoyed. Sympathize briefly. Maybe make a light joke to ease tension.';
        }
        break;

      case 'anxious':
        if (friendship > 60) {
          context += ' They\'re stressed. Be reassuring. "you got this" or "it\'ll work out". Offer to help if possible.';
        } else {
          context += ' They seem worried. Brief reassurance: "i\'m sure it\'ll be fine" type response.';
        }
        break;

      case 'confused':
        context += ' They\'re confused. Explain clearly, don\'t be condescending. Help them understand.';
        break;

      case 'tired':
        context += ' They\'re exhausted. Be chill, match their low energy. "mood" or "same" type responses work.';
        break;

      case 'bored':
        context += ' They\'re bored. Maybe suggest something interesting or start a fun topic.';
        break;

      default:
        context += ' Neutral mood - respond naturally.';
    }

    return context;
  }

  /**
   * Check if should offer support
   */
  shouldOfferSupport(username) {
    const mood = this.userMoods.get(username);
    if (!mood || !mood.needsSupport) return false;

    const profile = this.chatBot.userProfiles?.get(username);
    const friendship = profile?.friendshipLevel || 0;

    // Only offer deep support to friends
    return friendship > 50 && mood.intensity > 5;
  }

  /**
   * Generate support message
   */
  generateSupportMessage(username) {
    const mood = this.userMoods.get(username);
    if (!mood) return null;

    const messages = {
      sad: [
        "hey you good? wanna talk about it?",
        "that sucks man. anything i can do?",
        "if you need to vent i'm here"
      ],
      frustrated: [
        "yeah that's frustrating as hell",
        "i'd be pissed too honestly",
        "want me to fight them"
      ],
      anxious: [
        "you got this, for real",
        "it'll work out, i believe in you",
        "take a deep breath, you'll be fine"
      ]
    };

    const options = messages[mood.primary];
    if (!options) return null;

    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Get mood trends for user
   */
  getMoodTrend(username) {
    // This would track mood history over time
    // For now, just return current
    return this.userMoods.get(username)?.primary || 'neutral';
  }
}

module.exports = EmotionalIntelligence;
