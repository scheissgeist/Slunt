/**
 * Dynamic Phrase Generator
 * Generates ALL phrases via AI based on context and personality
 * NO HARDCODED TEMPLATES - everything adapts to Slunt's current state
 */

const fs = require('fs').promises;
const path = require('path');

class DynamicPhraseGenerator {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Cache for recently generated phrases (prevents repetition)
    this.recentPhrases = [];
    this.maxCacheSize = 50;
    
    // Learned phrase patterns from conversations
    this.learnedPatterns = {
      casualExpressions: [], // "lol", "ngl", "tbh"
      reactionWords: [], // "wild", "sick", "crazy"
      fillerPhrases: [], // "I mean", "honestly", "literally"
      transitions: [] // "speaking of", "also", "anyway"
    };
    
    // Persistence
    this.savePath = './data/learned_phrases.json';
    this.loadLearnedPhrases();
  }

  /**
   * Load learned phrases from disk
   */
  async loadLearnedPhrases() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const parsed = JSON.parse(data);
      this.learnedPatterns = parsed.learnedPatterns || this.learnedPatterns;
      
      console.log(`💬 [DynamicPhrases] Loaded learned patterns`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('💬 [DynamicPhrases] Error loading:', error.message);
      }
    }
  }

  /**
   * Save learned phrases to disk
   */
  async saveLearnedPhrases() {
    try {
      const dir = path.dirname(this.savePath);
      await fs.mkdir(dir, { recursive: true });

      const data = {
        learnedPatterns: this.learnedPatterns,
        savedAt: Date.now()
      };

      await fs.writeFile(this.savePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('💬 [DynamicPhrases] Error saving:', error.message);
    }
  }

  /**
   * Learn phrase patterns from user messages
   */
  learnFromMessage(message, username) {
    if (username === 'Slunt') return;
    
    const lowerMsg = message.toLowerCase();
    
    // Extract casual expressions (1-3 word phrases)
    const words = lowerMsg.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      // Single words
      if (words[i].length >= 3 && words[i].length <= 8) {
        if (!this.learnedPatterns.casualExpressions.includes(words[i])) {
          // Simple heuristic: if it appears often enough
          const count = message.toLowerCase().split(words[i]).length - 1;
          if (count >= 1 && this.learnedPatterns.casualExpressions.length < 100) {
            this.learnedPatterns.casualExpressions.push(words[i]);
          }
        }
      }
      
      // Two-word phrases
      if (i < words.length - 1) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        if (phrase.length <= 20 && !this.learnedPatterns.fillerPhrases.includes(phrase)) {
          if (this.learnedPatterns.fillerPhrases.length < 100) {
            this.learnedPatterns.fillerPhrases.push(phrase);
          }
        }
      }
    }
    
    // Periodically save (every 20 learns)
    if (Math.random() < 0.05) {
      this.saveLearnedPhrases();
    }
  }

  /**
   * Generate a band mention phrase dynamically
   */
  async generateBandMention(bandName, enthusiasm = 1.0) {
    try {
      const intensityDesc = enthusiasm >= 2.0 ? 'extremely enthusiastic' :
                           enthusiasm >= 1.5 ? 'very enthusiastic' : 'casually enthusiastic';

      const prompt = `Generate a short, natural phrase about being into the band "${bandName}". 

Context:
- Enthusiasm level: ${intensityDesc} (${enthusiasm}x)
- Keep it under 15 words
- Sound like a real person, not formal
- Show genuine appreciation but don't be cringe

Examples of the STYLE (don't copy these):
- "been listening to X nonstop"
- "X just hits different"
- "nothing quite like X"

Generate ONE phrase about ${bandName}:`;

      const response = await this.chatBot.getAIResponse(prompt, [], 'You generate casual music-related phrases.');
      
      // Extract just the phrase (clean up quotes, extra text)
      let phrase = response.trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^Phrase: /i, '')
        .replace(/^Response: /i, '')
        .trim();
      
      // Cache to avoid repetition
      this.addToCache(phrase);
      
      return phrase;
    } catch (error) {
      // Fallback if AI fails
      return `${bandName} is so good`;
    }
  }

  /**
   * Generate an event callback phrase dynamically
   */
  async generateEventCallback(event, participants = []) {
    try {
      const prompt = `Generate a short, casual phrase referencing this past event: "${event}"

${participants.length > 0 ? `Participants: ${participants.join(', ')}` : ''}

Keep it:
- Under 12 words
- Natural and conversational
- Like bringing up an inside joke or memory

Examples of STYLE (don't copy):
- "remember when [event]"
- "giving me flashbacks to [event]"  
- "[person] and the [event] incident"

Generate ONE phrase:`;

      const response = await this.chatBot.getAIResponse(prompt, [], 'You generate casual callback phrases.');
      
      let phrase = response.trim()
        .replace(/^["']|["']$/g, '')
        .trim();
      
      this.addToCache(phrase);
      return phrase;
    } catch (error) {
      return `remember when ${event}`;
    }
  }

  /**
   * Generate a personality mode phrase dynamically
   */
  async generateModePhrase(modeName, modeDescription, currentMood) {
    try {
      const prompt = `Generate a short, natural phrase that expresses: "${modeDescription}"

Context: You're a chatbot named Slunt in "${modeName}" mode
Current mood/state: ${currentMood}

Keep it:
- Under 10 words
- Authentic to the mood
- Not cliché or forced

Examples of STYLE (don't copy):
- "too early for this"
- "need coffee"
- "existential crisis hours"

Generate ONE phrase:`;

      const response = await this.chatBot.getAIResponse(prompt, [], 'You generate mood-based phrases.');
      
      let phrase = response.trim()
        .replace(/^["']|["']$/g, '')
        .trim();
      
      this.addToCache(phrase);
      return phrase;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a casual filler/transition phrase
   */
  async generateFillerPhrase(context = 'transition') {
    // Use learned patterns first
    if (this.learnedPatterns.fillerPhrases.length > 0 && Math.random() < 0.6) {
      return this.learnedPatterns.fillerPhrases[
        Math.floor(Math.random() * this.learnedPatterns.fillerPhrases.length)
      ];
    }

    try {
      const prompt = `Generate a casual ${context} phrase (2-4 words) that sounds natural in conversation.

Examples of STYLE: "I mean", "honestly", "fair enough", "wait what"

Generate ONE short phrase:`;

      const response = await this.chatBot.getAIResponse(prompt, [], 'You generate casual conversation fillers.');
      
      let phrase = response.trim()
        .replace(/^["']|["']$/g, '')
        .trim();
      
      this.addToCache(phrase);
      return phrase;
    } catch (error) {
      // Use learned pattern as fallback
      if (this.learnedPatterns.casualExpressions.length > 0) {
        return this.learnedPatterns.casualExpressions[
          Math.floor(Math.random() * this.learnedPatterns.casualExpressions.length)
        ];
      }
      return null;
    }
  }

  /**
   * Generate a contextual reaction phrase
   */
  async generateReaction(messageContext, emotionIntensity = 0.5) {
    // Use learned reactions first
    if (this.learnedPatterns.reactionWords.length > 0 && Math.random() < 0.5) {
      return this.learnedPatterns.reactionWords[
        Math.floor(Math.random() * this.learnedPatterns.reactionWords.length)
      ];
    }

    try {
      const intensityDesc = emotionIntensity > 0.7 ? 'strong' : 
                           emotionIntensity > 0.4 ? 'moderate' : 'mild';

      const prompt = `Generate a short reaction phrase (1-3 words) to: "${messageContext}"

Intensity: ${intensityDesc}
Style: casual, authentic, not over-the-top

Examples: "that's wild", "no way", "damn", "fr", "bruh"

Generate ONE phrase:`;

      const response = await this.chatBot.getAIResponse(prompt, [], 'You generate reaction phrases.');
      
      let phrase = response.trim()
        .replace(/^["']|["']$/g, '')
        .toLowerCase()
        .trim();
      
      this.addToCache(phrase);
      return phrase;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if phrase was recently used
   */
  isRecentlyUsed(phrase) {
    return this.recentPhrases.some(p => 
      p.toLowerCase().includes(phrase.toLowerCase()) ||
      phrase.toLowerCase().includes(p.toLowerCase())
    );
  }

  /**
   * Add phrase to cache
   */
  addToCache(phrase) {
    this.recentPhrases.push(phrase);
    if (this.recentPhrases.length > this.maxCacheSize) {
      this.recentPhrases.shift();
    }
  }

  /**
   * Clear old cache entries
   */
  clearOldCache() {
    if (this.recentPhrases.length > this.maxCacheSize * 0.75) {
      this.recentPhrases = this.recentPhrases.slice(-Math.floor(this.maxCacheSize * 0.5));
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      cachedPhrases: this.recentPhrases.length,
      learnedCasual: this.learnedPatterns.casualExpressions.length,
      learnedFillers: this.learnedPatterns.fillerPhrases.length,
      learnedReactions: this.learnedPatterns.reactionWords.length
    };
  }
}

module.exports = DynamicPhraseGenerator;
