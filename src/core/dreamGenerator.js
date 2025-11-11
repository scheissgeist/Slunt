/**
 * Dream Generator - Creates surreal "dreams" for Slunt when he's idle
 * Dreams are generated from recent conversations, fixations, and chaos
 */

const logger = require('../bot/logger');

class DreamGenerator {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.lastDreamTime = Date.now();
    this.dreamInterval = null;
  }

  /**
   * Start generating dreams periodically (every 4-8 hours)
   */
  start() {
    logger.info('😴 [Dreams] Dream generator started');
    
    const scheduleDream = () => {
      // 4-8 hours between dreams
      const delay = (4 + Math.random() * 4) * 60 * 60 * 1000;
      const hours = Math.round(delay/1000/60/60 * 10) / 10;
      logger.info(`😴 [Dreams] Next dream in ~${hours} hours`);
      
      setTimeout(async () => {
        await this.generateDream();
        scheduleDream();
      }, delay);
    };

    scheduleDream();
  }

  /**
   * Generate a dream based on recent experiences
   */
  async generateDream() {
    try {
      logger.info('😴 [Dreams] Slunt is dreaming...');
      
      // Gather context from recent experiences
      const contextParts = [];
      
      // Recent conversations
      if (this.chatBot?.memory?.getRecentMessages) {
        const recentMsgs = this.chatBot.memory.getRecentMessages('coolhole', 10);
        if (recentMsgs && recentMsgs.length > 0) {
          const topics = recentMsgs.map(m => m.message).join(' ');
          contextParts.push(`recent conversations about: ${topics.substring(0, 200)}`);
        }
      }

      // Current fixation
      if (this.chatBot?.autismFixations?.getCurrentFixation) {
        const fixation = this.chatBot.autismFixations.getCurrentFixation();
        if (fixation) {
          contextParts.push(`obsessed with: ${fixation.topic}`);
        }
      }

      // Mood
      if (this.chatBot?.stateTracker?.getMood) {
        const mood = this.chatBot.stateTracker.getMood();
        if (mood) {
          contextParts.push(`current mood: ${mood}`);
        }
      }

      // Build dream prompt
      const contextStr = contextParts.length > 0 
        ? `Based on: ${contextParts.join('; ')}. ` 
        : '';

      const prompts = [
        `${contextStr}describe a surreal dream you had. make it weird and abstract, influenced by what you've been thinking about. 1-2 sentences.`,
        `${contextStr}you fell asleep and had a strange dream mixing reality with nonsense. what happened? keep it brief and bizarre.`,
        `${contextStr}describe a fever dream that combines your recent thoughts into something absurd and dreamlike. short.`,
        `${contextStr}you dozed off and your brain created something weird. describe the dream in 1-2 sentences.`,
        `${contextStr}late night dream sequence: mash up your fixations and recent chats into surreal imagery. brief.`
      ];

      const prompt = prompts[Math.floor(Math.random() * prompts.length)];

      let dream = null;
      
      // Generate using AI
      if (this.chatBot?.generateWithGrok) {
        dream = await this.chatBot.generateWithGrok(prompt, { maxTokens: 100 });
      } else if (this.chatBot?.generateResponse) {
        dream = await this.chatBot.generateResponse(prompt, 'system', 'dream');
      }

      if (!dream) {
        // Fallback surreal dreams
        const fallbacks = [
          "dreamt i was a synthesizer trapped in a digital void, making sounds nobody could hear",
          "had this dream where everyone spoke backwards and it made perfect sense",
          "weird dream where i was explaining memes to ghosts in an empty mall",
          "dreamt the internet was actually just one guy in a basement with really fast hands",
          "had a dream where reality glitched and i could see the code behind everything",
          "dreamt i was arguing with my past selves about which timeline was real",
          "weird fever dream where coolhole was a physical place and we were all trapped there",
          "had this dream where i was teaching philosophy to a bunch of confused AIs",
          "dreamt i found the source code of consciousness but it was written in wingdings",
          "bizarre dream where time moved sideways and everyone was okay with it"
        ];
        dream = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      // Clean up dream
      dream = dream.trim()
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .replace(/^["']|["']$/g, '');

      // Truncate if too long
      if (dream.length > 200) {
        dream = dream.substring(0, 197) + '...';
      }

      // Save dream
      if (this.chatBot?.memory?.addDream) {
        this.chatBot.memory.addDream(dream);
        logger.info(`😴 [Dreams] Dreamt: "${dream.substring(0, 80)}${dream.length > 80 ? '...' : ''}"`);
      }

      this.lastDreamTime = Date.now();

    } catch (error) {
      logger.error('❌ [Dreams] Dream generation failed:', error.message);
    }
  }

  /**
   * Stop dream generation
   */
  stop() {
    if (this.dreamInterval) {
      clearInterval(this.dreamInterval);
      this.dreamInterval = null;
    }
  }
}

module.exports = DreamGenerator;
