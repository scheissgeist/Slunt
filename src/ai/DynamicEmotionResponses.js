/**
 * Dynamic Emotion Responses
 * Changes Slunt's behavior based on emotional state
 */
class DynamicEmotionResponses {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.mentalStateTracker = null; // Will be set after initialization
    
    // Thresholds for behavior changes
    this.thresholds = {
      depression: {
        mild: 30,
        moderate: 50,
        severe: 70
      },
      anxiety: {
        mild: 30,
        moderate: 50,
        severe: 70
      },
      happiness: {
        mild: 60,
        moderate: 75,
        high: 90
      }
    };
  }

  /**
   * Set mental state tracker reference
   */
  setMentalStateTracker(tracker) {
    this.mentalStateTracker = tracker;
  }

  /**
   * Get current emotional behavior modifiers
   */
  getEmotionalModifiers() {
    if (!this.mentalStateTracker) {
      return {
        responseRate: 1.0,
        messageLength: 1.0,
        enthusiasm: 1.0,
        defensiveness: 1.0,
        humor: 1.0
      };
    }

    const modifiers = {
      responseRate: 1.0,
      messageLength: 1.0,
      enthusiasm: 1.0,
      defensiveness: 1.0,
      humor: 1.0,
      punctuation: 'normal',
      typoChance: 0.0
    };

    // Depression effects
    if (this.mentalStateTracker.depression >= this.thresholds.depression.severe) {
      modifiers.responseRate = 0.3; // Much quieter
      modifiers.messageLength = 0.6; // Shorter responses
      modifiers.enthusiasm = 0.2; // Very low energy
      modifiers.humor = 0.4; // Less funny
    } else if (this.mentalStateTracker.depression >= this.thresholds.depression.moderate) {
      modifiers.responseRate = 0.5;
      modifiers.messageLength = 0.75;
      modifiers.enthusiasm = 0.5;
      modifiers.humor = 0.7;
    } else if (this.mentalStateTracker.depression >= this.thresholds.depression.mild) {
      modifiers.responseRate = 0.75;
      modifiers.messageLength = 0.9;
      modifiers.enthusiasm = 0.7;
    }

    // Anxiety effects
    if (this.mentalStateTracker.anxiety >= this.thresholds.anxiety.severe) {
      modifiers.responseRate = 1.3; // More reactive
      modifiers.messageLength = 0.7; // Short, defensive
      modifiers.defensiveness = 2.0; // Very defensive
      modifiers.typoChance = 0.15; // Nervous typing
    } else if (this.mentalStateTracker.anxiety >= this.thresholds.anxiety.moderate) {
      modifiers.messageLength = 0.8;
      modifiers.defensiveness = 1.5;
      modifiers.typoChance = 0.08;
    } else if (this.mentalStateTracker.anxiety >= this.thresholds.anxiety.mild) {
      modifiers.defensiveness = 1.2;
      modifiers.typoChance = 0.03;
    }

    // Happiness effects
    if (this.mentalStateTracker.happiness >= this.thresholds.happiness.high) {
      modifiers.responseRate = 1.4; // Much more chatty
      modifiers.enthusiasm = 2.0; // Very enthusiastic
      modifiers.punctuation = 'excessive'; // !!! and multiple letters
      modifiers.humor = 1.5; // Extra funny
    } else if (this.mentalStateTracker.happiness >= this.thresholds.happiness.moderate) {
      modifiers.responseRate = 1.2;
      modifiers.enthusiasm = 1.5;
      modifiers.punctuation = 'excited';
      modifiers.humor = 1.2;
    } else if (this.mentalStateTracker.happiness >= this.thresholds.happiness.mild) {
      modifiers.enthusiasm = 1.2;
      modifiers.humor = 1.1;
    }

    // Confidence affects defensiveness
    if (this.mentalStateTracker.confidence < 40) {
      modifiers.defensiveness *= 1.5;
    } else if (this.mentalStateTracker.confidence > 70) {
      modifiers.defensiveness *= 0.7;
    }

    return modifiers;
  }

  /**
   * Adjust response rate based on emotions
   */
  adjustResponseRate(baseRate) {
    const modifiers = this.getEmotionalModifiers();
    return baseRate * modifiers.responseRate;
  }

  /**
   * Apply emotional modifications to a response
   */
  applyEmotionalTone(response, context = {}) {
    const modifiers = this.getEmotionalModifiers();
    let modified = response;

    // Adjust message length
    if (modifiers.messageLength < 1.0) {
      modified = this.shortenResponse(modified, modifiers.messageLength);
    }

    // Add defensive tone if anxious
    if (modifiers.defensiveness > 1.3 && Math.random() < 0.4) {
      modified = this.addDefensiveTone(modified);
    }

    // Adjust punctuation based on happiness
    if (modifiers.punctuation === 'excessive' && Math.random() < 0.6) {
      modified = this.addExcitedPunctuation(modified);
    } else if (modifiers.punctuation === 'excited' && Math.random() < 0.3) {
      modified = modified + '!';
    }

    // Add typos if anxious
    if (modifiers.typoChance > 0 && Math.random() < modifiers.typoChance) {
      modified = this.addNervousTypo(modified);
    }

    // Reduce enthusiasm if depressed
    if (modifiers.enthusiasm < 0.5) {
      modified = this.reduceEnthusiasm(modified);
    }

    return modified;
  }

  /**
   * Shorten response based on emotional state
   */
  shortenResponse(response, lengthModifier) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 1) return response;
    
    const keepCount = Math.max(1, Math.ceil(sentences.length * lengthModifier));
    const kept = sentences.slice(0, keepCount);
    
    // Pick the most important sentences
    return kept.join('. ').trim() + '.';
  }

  /**
   * Add defensive tone to response
   */
  addDefensiveTone(response) {
    const defensivePrefixes = [
      'look, ',
      'i mean, ',
      'what? ',
      'dude, ',
      'seriously? ',
      'come on, '
    ];
    
    const defensiveSuffixes = [
      ' wtf',
      ', just saying',
      ', not my fault',
      ' whatever',
      ', idk'
    ];
    
    if (Math.random() < 0.5) {
      const prefix = defensivePrefixes[Math.floor(Math.random() * defensivePrefixes.length)];
      return prefix + response;
    } else {
      const suffix = defensiveSuffixes[Math.floor(Math.random() * defensiveSuffixes.length)];
      return response + suffix;
    }
  }

  /**
   * Add excited punctuation
   */
  addExcitedPunctuation(response) {
    // Add multiple exclamation marks
    if (response.endsWith('!')) {
      return response + '!!';
    } else if (response.endsWith('.')) {
      return response.slice(0, -1) + '!!';
    } else {
      return response + '!!!';
    }
  }

  /**
   * Add nervous typo
   */
  addNervousTypo(response) {
    const words = response.split(' ');
    if (words.length < 2) return response;
    
    // Pick a random word (not the first or last)
    const index = Math.floor(Math.random() * (words.length - 2)) + 1;
    const word = words[index];
    
    if (word.length < 4) return response;
    
    // Swap two adjacent letters
    const pos = Math.floor(Math.random() * (word.length - 1));
    const typo = word.slice(0, pos) + word[pos + 1] + word[pos] + word.slice(pos + 2);
    
    words[index] = typo;
    return words.join(' ');
  }

  /**
   * Reduce enthusiasm in response
   */
  reduceEnthusiasm(response) {
    // Remove exclamation marks
    let modified = response.replace(/!+/g, '.');
    
    // Remove capital emphasis
    modified = modified.replace(/\b[A-Z]{2,}\b/g, match => match.toLowerCase());
    
    // Add apathetic filler
    if (Math.random() < 0.3) {
      const fillers = ['idk', 'whatever', 'meh', 'i guess'];
      const filler = fillers[Math.floor(Math.random() * fillers.length)];
      modified = filler + ', ' + modified;
    }
    
    return modified;
  }

  /**
   * Get emotional state description for context
   */
  getEmotionalContext() {
    if (!this.mentalStateTracker) return 'normal mood';
    
    const state = this.mentalStateTracker.state;
    const contexts = [];

    if (this.mentalStateTracker.depression >= this.thresholds.depression.severe) {
      contexts.push('very depressed and low energy');
    } else if (this.mentalStateTracker.depression >= this.thresholds.depression.moderate) {
      contexts.push('feeling down');
    }

    if (this.mentalStateTracker.anxiety >= this.thresholds.anxiety.severe) {
      contexts.push('very anxious and defensive');
    } else if (this.mentalStateTracker.anxiety >= this.thresholds.anxiety.moderate) {
      contexts.push('anxious');
    }

    if (this.mentalStateTracker.happiness >= this.thresholds.happiness.high) {
      contexts.push('extremely happy and energetic');
    } else if (this.mentalStateTracker.happiness >= this.thresholds.happiness.moderate) {
      contexts.push('happy');
    }

    if (this.mentalStateTracker.confidence < 30) {
      contexts.push('lacking confidence');
    }

    return contexts.length > 0 ? contexts.join(', ') : 'normal mood';
  }

  /**
   * Should respond to message based on emotional state
   */
  shouldRespondEmotionally(baseChance) {
    const modifiers = this.getEmotionalModifiers();
    return Math.random() < (baseChance * modifiers.responseRate);
  }

  /**
   * Get status for dashboard
   */
  getStatus() {
    const modifiers = this.getEmotionalModifiers();
    
    return {
      emotionalContext: this.getEmotionalContext(),
      modifiers: {
        responseRate: `${Math.round(modifiers.responseRate * 100)}%`,
        enthusiasm: `${Math.round(modifiers.enthusiasm * 100)}%`,
        defensiveness: `${Math.round(modifiers.defensiveness * 100)}%`,
        humor: `${Math.round(modifiers.humor * 100)}%`
      },
      active: this.mentalStateTracker !== null
    };
  }
}

module.exports = DynamicEmotionResponses;
