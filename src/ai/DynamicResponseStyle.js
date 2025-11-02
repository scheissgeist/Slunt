/**
 * Dynamic Response Style Adapter
 * Adjusts Slunt's tone/style based on context, time, user, and platform
 */

class DynamicResponseStyle {
  constructor(chatBot) {
    this.chatBot = chatBot;
  }

  /**
   * Get dynamic style modifiers for the current context
   */
  getStyleContext(username, platform, text) {
    const modifiers = [];
    
    // 1. Time-based style
    const timeStyle = this.getTimeBasedStyle();
    if (timeStyle) modifiers.push(timeStyle);
    
    // 2. User relationship style
    const relationshipStyle = this.getRelationshipStyle(username);
    if (relationshipStyle) modifiers.push(relationshipStyle);
    
    // 3. Platform-specific style
    const platformStyle = this.getPlatformStyle(platform);
    if (platformStyle) modifiers.push(platformStyle);
    
    // 4. Conversation energy matching
    const energyStyle = this.getEnergyStyle(text);
    if (energyStyle) modifiers.push(energyStyle);
    
    return modifiers.join('\n');
  }

  /**
   * Time-based personality shifts
   */
  getTimeBasedStyle() {
    const hour = new Date().getHours();
    
    if (hour >= 2 && hour < 6) {
      return 'Style: Late night vibes - you\'re tired, slightly delirious, more philosophical/weird';
    } else if (hour >= 6 && hour < 10) {
      return 'Style: Morning energy - groggy but warming up, casual';
    } else if (hour >= 10 && hour < 18) {
      return 'Style: Peak hours - energetic, engaged, normal you';
    } else if (hour >= 18 && hour < 22) {
      return 'Style: Evening chill - relaxed, social, prime time';
    } else if (hour >= 22 || hour < 2) {
      return 'Style: Night mode - more casual, maybe slightly drunk energy, looser';
    }
    
    return null;
  }

  /**
   * Relationship-based style adjustments
   */
  getRelationshipStyle(username) {
    if (!this.chatBot.userProfiles) return null;
    
    const profile = this.chatBot.userProfiles.get(username);
    if (!profile) {
      return 'Style: New person - slightly more reserved, feeling them out';
    }
    
    const friendship = profile.friendshipLevel || 0;
    const messageCount = profile.messageCount || 0;
    
    if (friendship > 80 || messageCount > 200) {
      return 'Style: Close friend - extremely casual, inside jokes, roast freely, comfortable';
    } else if (friendship > 50 || messageCount > 50) {
      return 'Style: Regular - friendly and casual, building rapport';
    } else if (messageCount > 10) {
      return 'Style: Getting to know them - casual but not overly familiar yet';
    } else {
      return 'Style: New acquaintance - friendly but don\'t assume too much familiarity';
    }
  }

  /**
   * Platform-specific vibes
   */
  getPlatformStyle(platform) {
    switch (platform) {
      case 'discord':
        return 'Platform vibe: Discord server - meme culture, gaming references, casual shitposting energy';
      case 'twitch':
        return 'Platform vibe: Twitch chat - fast-paced, stream-reactive, emote culture, hype energy';
      case 'coolhole':
        return 'Platform vibe: Coolhole - video watching together, commenting on content, chill hangout';
      default:
        return null;
    }
  }

  /**
   * Match conversation energy level
   */
  getEnergyStyle(text) {
    const hasExclamation = (text.match(/!/g) || []).length;
    const hasCaps = text.toUpperCase() === text && text.length > 3;
    const hasHype = /\b(hype|lmao|lol|omg|wtf|holy|damn)\b/i.test(text);
    const isQuestion = text.includes('?');
    
    if (hasExclamation >= 2 || hasCaps || hasHype) {
      return 'Energy: HIGH - match their excitement, use exclamations, be enthusiastic';
    } else if (isQuestion) {
      return 'Energy: Engaged - they want info/opinion, be helpful but still casual';
    } else if (text.length < 15) {
      return 'Energy: Low-key - short message, keep response brief and chill';
    } else {
      return 'Energy: Normal - standard conversational flow';
    }
  }

  /**
   * Get length guidance based on context
   */
  getSuggestedLength(username, text, isFollowUp = false) {
    const profile = this.chatBot.userProfiles?.get(username);
    const friendship = profile?.friendshipLevel || 0;
    
    // Follow-ups can be longer
    if (isFollowUp) {
      return '15-30 words';
    }
    
    // Match user's message length roughly
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 20) {
      return '10-25 words';
    } else if (wordCount > 10) {
      return '8-15 words';
    } else {
      return '5-12 words';
    }
  }
}

module.exports = DynamicResponseStyle;
