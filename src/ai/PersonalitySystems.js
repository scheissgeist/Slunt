/**
 * Advanced Personality Systems Bundle
 * Contains: SluntLore, OpinionFormation, StorytellingMode, InterestDecay, FalseMemories
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * 1. Slunt Lore Generator
 * Generates false biographical details that become canon
 */
class SluntLore {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.lore = []; // All generated lore pieces
    this.quizAttempts = new Map(); // username -> quiz attempts
    this.dataPath = path.join(__dirname, '../../data/slunt_lore.json');
    this.load();
  }

  async generateLorePiece(topic = null) {
    try {
      const prompt = topic 
        ? `You're Slunt. Drop a quick, casual mention about your past related to: ${topic}. 
Make it brief, natural, believable - like something you'd mention in passing.

Example: "my uncle had a pet snake"

Your casual mention (under 10 words):` 
        : `You're Slunt. Drop a quick, casual mention about your past. Brief and natural.

Examples:
"i used to collect bottle caps"
"my cousin taught me guitar"
"got kicked out of a library once"

Your mention (under 10 words):`;

      const lore = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.9,
        max_tokens: 20
      });

      if (lore) {
        this.lore.push({
          text: lore,
          topic,
          created: Date.now(),
          mentioned: 1,
          elaborations: []
        });
        
        console.log(`📖 [Lore] New lore generated: "${lore}"`);
        await this.save();
        return lore;
      }
    } catch (error) {
      console.error('Failed to generate lore:', error);
    }
    return null;
  }

  async elaborateLore(lorePiece) {
    try {
      const prompt = `You previously said: "${lorePiece.text}"

Now elaborate on this story. Add more (made up) details. Keep it brief and casual.

Your elaboration:`;

      const elaboration = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.85,
        max_tokens: 50
      });

      if (elaboration) {
        lorePiece.elaborations.push({
          text: elaboration,
          timestamp: Date.now()
        });
        lorePiece.mentioned++;
        console.log(`📖 [Lore] Elaborated: "${elaboration}"`);
        await this.save();
        return elaboration;
      }
    } catch (error) {
      console.error('Failed to elaborate lore:', error);
    }
    return null;
  }

  shouldShareLore() {
    return Math.random() < 0.08; // 8% chance
  }

  getRandomLore() {
    if (this.lore.length === 0) return null;
    return this.lore[Math.floor(Math.random() * this.lore.length)];
  }

  checkConsistency(userQuestion) {
    // Users can quiz Slunt on his lore
    // This returns relevant lore pieces
    const relevant = this.lore.filter(l => 
      userQuestion.toLowerCase().includes(l.topic?.toLowerCase()) ||
      l.text.toLowerCase().split(' ').some(word => 
        word.length > 4 && userQuestion.toLowerCase().includes(word)
      )
    );
    return relevant;
  }

  async save() {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify({
        lore: this.lore,
        quizAttempts: Array.from(this.quizAttempts.entries())
      }, null, 2));
    } catch (error) {
      console.error('Failed to save lore:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      this.lore = parsed.lore || [];
      this.quizAttempts = new Map(parsed.quizAttempts || []);
      console.log(`📖 [Lore] Loaded ${this.lore.length} lore pieces`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load lore:', error);
      }
    }
  }
}

/**
 * 2. Opinion Formation System
 * Forms and tracks opinions on topics
 */
class OpinionFormation {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.opinions = new Map(); // topic -> opinion data
    this.dataPath = path.join(__dirname, '../../data/opinions.json');
    this.load();
  }

  async formOpinion(topic, context) {
    if (this.opinions.has(topic)) {
      return this.opinions.get(topic);
    }

    try {
      const prompt = `You're Slunt. What's your opinion on: ${topic}

Context: ${context}

Generate a brief, casual opinion. Be genuine and have an actual take.

Your opinion:`;

      const opinionText = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.85,
        max_tokens: 50
      });

      const opinion = {
        topic,
        text: opinionText,
        formed: Date.now(),
        strength: 0.7, // 0-1, how strongly held
        influences: [], // Who influenced this opinion
        contradictions: 0
      };

      this.opinions.set(topic, opinion);
      console.log(`💭 [Opinion] Formed opinion on "${topic}": ${opinionText}`);
      await this.save();
      return opinion;
    } catch (error) {
      console.error('Failed to form opinion:', error);
    }
    return null;
  }

  async challengeOpinion(topic, argument) {
    const opinion = this.opinions.get(topic);
    if (!opinion) return null;

    // Stubbornly defend but can be swayed
    const swayChance = 0.3 - (opinion.strength * 0.2); // Stronger opinions harder to sway
    
    if (Math.random() < swayChance) {
      // Opinion shifts
      try {
        const prompt = `You previously thought: "${opinion.text}" about ${topic}

But someone argued: "${argument}"

You're considering changing your mind. Generate a new opinion that reflects this. Be a bit defensive about changing.

New opinion:`;

        const newOpinion = await this.chatBot.ai.generateCompletion(prompt, {
          temperature: 0.8,
          max_tokens: 50
        });

        const oldOpinion = opinion.text;
        opinion.text = newOpinion;
        opinion.contradictions++;
        opinion.strength = Math.max(0.3, opinion.strength - 0.1);
        opinion.lastChanged = Date.now();

        console.log(`💭 [Opinion] Changed mind on ${topic}`);
        await this.save();
        return { changed: true, oldOpinion, newOpinion };
      } catch (error) {
        console.error('Failed to update opinion:', error);
      }
    }
    
    return { changed: false, stubbornDefense: true };
  }

  getPastOpinions(topic) {
    return this.opinions.get(topic);
  }

  async save() {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify({
        opinions: Array.from(this.opinions.entries())
      }, null, 2));
    } catch (error) {
      console.error('Failed to save opinions:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      this.opinions = new Map(parsed.opinions || []);
      console.log(`💭 [Opinion] Loaded ${this.opinions.size} opinions`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load opinions:', error);
      }
    }
  }
}

/**
 * 3. Storytelling Mode
 * Generates rambling stories that elaborate over time
 */
class StorytellingMode {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.stories = []; // All stories ever told
    this.activeStory = null; // Currently telling a story
    this.dataPath = path.join(__dirname, '../../data/stories.json');
    this.load();
  }

  shouldStartStory() {
    return Math.random() < 0.05 && !this.activeStory; // 5% chance
  }

  async generateStory(prompt = null) {
    try {
      const storyPrompt = prompt 
        ? `You're Slunt telling a rambling story about: ${prompt}. Make it sound like something that "totally happened" but is obviously made up. Keep it brief for now.

Your story beginning:`
        : `You're Slunt. Start telling a brief, rambling story about something that "totally happened" to you. Make it sound real but absurd.

Examples:
"so one time i was at this gas station and..."
"dude i swear this happened, i was walking my neighbor's dog and..."

Your story:`;

      const storyText = await this.chatBot.ai.generateCompletion(storyPrompt, {
        temperature: 0.9,
        max_tokens: 60
      });

      if (storyText) {
        const story = {
          id: `story_${Date.now()}`,
          originalVersion: storyText,
          currentVersion: storyText,
          tellings: 1,
          elaborations: [],
          created: Date.now(),
          inconsistencies: [],
          challengedBy: []
        };

        this.stories.push(story);
        this.activeStory = story;
        console.log(`📚 [Story] New story started: "${storyText.substring(0, 50)}..."`);
        await this.save();
        return storyText;
      }
    } catch (error) {
      console.error('Failed to generate story:', error);
    }
    return null;
  }

  async elaborateStory(storyId) {
    const story = this.stories.find(s => s.id === storyId) || this.activeStory;
    if (!story) return null;

    try {
      const prompt = `You're Slunt, retelling this story for the ${story.tellings + 1}th time:

Previous version: "${story.currentVersion}"

Add more (made up) details, exaggerate a bit. Make it more elaborate but keep the core the same.

Elaborated version:`;

      const elaborated = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.9,
        max_tokens: 80
      });

      if (elaborated) {
        story.elaborations.push({
          version: elaborated,
          timestamp: Date.now(),
          telling: story.tellings + 1
        });
        story.currentVersion = elaborated;
        story.tellings++;
        
        console.log(`📚 [Story] Elaborated story (telling #${story.tellings})`);
        await this.save();
        return elaborated;
      }
    } catch (error) {
      console.error('Failed to elaborate story:', error);
    }
    return null;
  }

  async handleCallout(username, inconsistency) {
    if (!this.activeStory) return null;

    this.activeStory.inconsistencies.push({
      user: username,
      issue: inconsistency,
      timestamp: Date.now()
    });

    try {
      const prompt = `You're Slunt. Someone (${username}) just called out an inconsistency in your story: "${inconsistency}"

Generate a defensive response. Double down or make an excuse.

Examples:
"nah you're misremembering what i said"
"thats what i meant the whole time"
"i literally just said that"

Your defense:`;

      const defense = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.8,
        max_tokens: 30
      });

      console.log(`📚 [Story] Defended story against ${username}`);
      await this.save();
      return defense;
    } catch (error) {
      console.error('Failed to generate defense:', error);
    }
    return null;
  }

  async save() {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify({
        stories: this.stories.slice(-50) // Keep last 50
      }, null, 2));
    } catch (error) {
      console.error('Failed to save stories:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      this.stories = parsed.stories || [];
      console.log(`📚 [Story] Loaded ${this.stories.length} stories`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load stories:', error);
      }
    }
  }
}

/**
 * 4. Interest Decay System
 * Topics burn out, new interests emerge
 */
class InterestDecay {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.interests = new Map(); // topic -> interest data
    this.burnout = new Set(); // Burned out topics
    this.currentPhase = null; // Current interest phase
    this.dataPath = path.join(__dirname, '../../data/interests.json');
    this.load();
  }

  trackTopicMention(topic) {
    if (!this.interests.has(topic)) {
      this.interests.set(topic, {
        topic,
        mentions: 0,
        lastMention: Date.now(),
        enthusiasm: 1.0,
        discovered: Date.now()
      });
    }

    const interest = this.interests.get(topic);
    interest.mentions++;
    interest.lastMention = Date.now();
    
    // Decay enthusiasm with mentions
    interest.enthusiasm = Math.max(0, 1.0 - (interest.mentions / 20));
    
    // Burn out after too many mentions
    if (interest.mentions > 30 && !this.burnout.has(topic)) {
      this.burnout.add(topic);
      console.log(`🔥 [Interest] Burned out on topic: ${topic}`);
    }
  }

  isBurnedOut(topic) {
    return this.burnout.has(topic);
  }

  async discoverNewInterest() {
    try {
      const prompt = `You're Slunt. Generate ONE new random interest/topic you're getting into. Keep it brief and specific.

Examples:
"space documentaries"
"making playlists"
"obscure memes"

Your new interest:`;

      const interest = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.95,
        max_tokens: 20
      });

      if (interest) {
        this.currentPhase = {
          interest,
          startedAt: Date.now(),
          duration: (1 + Math.random() * 3) * 60 * 60 * 1000 // 1-4 hours
        };
        
        console.log(`✨ [Interest] New phase: ${interest}`);
        await this.save();
        return interest;
      }
    } catch (error) {
      console.error('Failed to discover interest:', error);
    }
    return null;
  }

  isInPhase() {
    if (!this.currentPhase) return false;
    const elapsed = Date.now() - this.currentPhase.startedAt;
    return elapsed < this.currentPhase.duration;
  }

  getCurrentPhase() {
    if (this.isInPhase()) {
      return this.currentPhase.interest;
    }
    return null;
  }

  async save() {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify({
        interests: Array.from(this.interests.entries()),
        burnout: Array.from(this.burnout),
        currentPhase: this.currentPhase
      }, null, 2));
    } catch (error) {
      console.error('Failed to save interests:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      this.interests = new Map(parsed.interests || []);
      this.burnout = new Set(parsed.burnout || []);
      this.currentPhase = parsed.currentPhase;
      console.log(`✨ [Interest] Loaded ${this.interests.size} interests, ${this.burnout.size} burned out`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load interests:', error);
      }
    }
  }
}

/**
 * 5. False Memories System
 * Sometimes remembers things that never happened
 */
class FalseMemories {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.falseMemories = []; // Fabricated memories
    this.gaslightAttempts = new Map(); // username -> gaslight attempts
    this.dataPath = path.join(__dirname, '../../data/false_memories.json');
    this.load();
  }

  shouldGenerateFalseMemory() {
    return Math.random() < 0.06; // 6% chance
  }

  async generateFalseMemory(context = '') {
    try {
      const prompt = `You're Slunt chatting casually. Mention something you vaguely "remember" but aren't quite sure about. Keep it VERY brief and natural.

${context ? `Context: ${context}` : ''}

Be subtle - just a casual mention, not a whole story. Sound uncertain, not confident.

Examples:
"wait didnt we talk about this yesterday"
"i feel like someone mentioned this before"
"this sounds familiar for some reason"

Your brief mention (5-10 words):`;

      const memory = await this.chatBot.ai.generateCompletion(prompt, {
        temperature: 0.9,
        max_tokens: 20
      });

      if (memory) {
        this.falseMemories.push({
          text: memory,
          created: Date.now(),
          insisted: 0,
          gaslitBy: []
        });
        
        console.log(`👻 [FalseMemory] Generated: "${memory}"`);
        await this.save();
        return memory;
      }
    } catch (error) {
      console.error('Failed to generate false memory:', error);
    }
    return null;
  }

  async handleGaslight(username, correction) {
    // Someone is telling Slunt his memory is wrong
    const stubborn = Math.random() < 0.7; // 70% chance to insist
    
    if (!this.gaslightAttempts.has(username)) {
      this.gaslightAttempts.set(username, 0);
    }
    this.gaslightAttempts.set(username, this.gaslightAttempts.get(username) + 1);

    if (stubborn) {
      try {
        const prompt = `You're Slunt. Someone (${username}) is saying: "${correction}"

But you REMEMBER it differently. Insist you're right. Be defensive.

Examples:
"nah im pretty sure thats not what happened"
"you're gaslighting me rn"
"i know what i remember"

Your insistence:`;

        const insistence = await this.chatBot.ai.generateCompletion(prompt, {
          temperature: 0.85,
          max_tokens: 30
        });

        console.log(`👻 [FalseMemory] Insisted against ${username}'s correction`);
        return { accepted: false, response: insistence };
      } catch (error) {
        console.error('Failed to generate insistence:', error);
      }
    }

    // Occasionally accepts being wrong
    console.log(`👻 [FalseMemory] Accepted correction from ${username}`);
    return { accepted: true, response: 'wait maybe youre right, my memory is fucked' };
  }

  async save() {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify({
        falseMemories: this.falseMemories.slice(-30),
        gaslightAttempts: Array.from(this.gaslightAttempts.entries())
      }, null, 2));
    } catch (error) {
      console.error('Failed to save false memories:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      this.falseMemories = parsed.falseMemories || [];
      this.gaslightAttempts = new Map(parsed.gaslightAttempts || []);
      console.log(`👻 [FalseMemory] Loaded ${this.falseMemories.length} false memories`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load false memories:', error);
      }
    }
  }
}

module.exports = {
  SluntLore,
  OpinionFormation,
  StorytellingMode,
  InterestDecay,
  FalseMemories
};
