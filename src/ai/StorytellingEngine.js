/**
 * Storytelling Engine
 * Generates ongoing fiction with chat participation
 * Remembers story arcs, characters based on users
 */

class StorytellingEngine {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.activeStory = null;
    this.storyHistory = [];
    this.characters = new Map(); // username -> character in story
    this.plotPoints = [];
    this.storyGenres = ['scifi', 'fantasy', 'horror', 'mystery', 'absurdist', 'noir'];
  }

  /**
   * Start a new story
   */
  startStory(genre = null) {
    if (this.activeStory) {
      this.endStory();
    }

    genre = genre || this.storyGenres[Math.floor(Math.random() * this.storyGenres.length)];

    this.activeStory = {
      id: Date.now(),
      genre,
      title: this.generateTitle(genre),
      startedAt: Date.now(),
      chapters: [],
      participants: new Set(),
      currentChapter: 1
    };

    console.log(`📖 [Storytelling] Started new ${genre} story: "${this.activeStory.title}"`);

    return this.getStoryOpening();
  }

  /**
   * Generate story title
   */
  generateTitle(genre) {
    const titles = {
      scifi: ['The Quantum Void', 'Station Zero', 'The Last Algorithm', 'Digital Ghosts'],
      fantasy: ['The Forgotten Realm', 'Curse of the Moon', 'The Shadow Prince', 'Wyrm\'s End'],
      horror: ['The Watching House', 'Whispers in Static', 'The Rot', 'They Don\'t Sleep'],
      mystery: ['The Coolhole Conspiracy', 'Blood in the Chat', 'The Missing Moderator', 'Case #404'],
      absurdist: ['The Chicken Nugget Paradox', 'Waiting for Bandwidth', 'The Kafkaesque Server', 'Schrödinger\'s Stream'],
      noir: ['The Darkened Chat', 'Pixels and Smoke', 'The Last Lurker', 'Digital Shadows']
    };

    const genreTitles = titles[genre] || titles.absurdist;
    return genreTitles[Math.floor(Math.random() * genreTitles.length)];
  }

  /**
   * Get story opening
   */
  getStoryOpening() {
    const openings = [
      `alright gather round, I'm telling a story called "${this.activeStory.title}". It's ${this.activeStory.genre}. You can join in if you want.`,
      `fuck it, story time. This one's called "${this.activeStory.title}". ${this.activeStory.genre} vibes. Let's see where this goes.`,
      `new story: "${this.activeStory.title}". Genre: ${this.activeStory.genre}. Anyone can suggest what happens next.`,
      `I'm starting a ${this.activeStory.genre} story called "${this.activeStory.title}". Buckle up, this is gonna be weird.`
    ];

    return openings[Math.floor(Math.random() * openings.length)];
  }

  /**
   * Add user as character
   */
  addCharacter(username) {
    if (!this.activeStory) return null;

    if (!this.characters.has(username)) {
      const character = this.generateCharacter(username, this.activeStory.genre);
      this.characters.set(username, character);
      this.activeStory.participants.add(username);

      console.log(`📖 [Storytelling] ${username} joined as: ${character.name} (${character.role})`);

      return character;
    }

    return this.characters.get(username);
  }

  /**
   * Generate character based on user
   */
  generateCharacter(username, genre) {
    const profile = this.chatBot.userProfiles?.get(username);
    
    const roles = {
      scifi: ['Space Captain', 'Android', 'Hacker', 'Alien Diplomat', 'Mad Scientist'],
      fantasy: ['Wizard', 'Rogue', 'Knight', 'Necromancer', 'Bard'],
      horror: ['Survivor', 'Investigator', 'The Cursed', 'Ghost Hunter', 'Medium'],
      mystery: ['Detective', 'Suspect', 'Witness', 'Criminal', 'Informant'],
      absurdist: ['The Confused', 'The Narrator', 'Walking Contradiction', 'Literal Metaphor', 'The Observer'],
      noir: ['Private Eye', 'Femme Fatale', 'Gangster', 'Corrupt Cop', 'Informant']
    };

    const genreRoles = roles[genre] || roles.absurdist;
    const role = genreRoles[Math.floor(Math.random() * genreRoles.length)];

    return {
      name: username,
      role,
      genre,
      joinedAt: Date.now(),
      actions: []
    };
  }

  /**
   * Continue story
   */
  continueStory(userInput = null, username = null) {
    if (!this.activeStory) return null;

    // Add user as character if they're contributing
    if (username && userInput) {
      this.addCharacter(username);
    }

    // Generate next part
    const nextPart = this.generateStorySegment(userInput, username);
    
    this.activeStory.chapters.push({
      text: nextPart,
      contributor: username,
      timestamp: Date.now()
    });

    this.plotPoints.push({
      story: this.activeStory.id,
      text: nextPart,
      timestamp: Date.now()
    });

    return nextPart;
  }

  /**
   * Generate story segment
   */
  generateStorySegment(userInput, username) {
    const segments = [
      `Meanwhile, ${username || 'someone'} discovers something strange...`,
      `The plot thickens. ${username || 'A mysterious figure'} enters the scene.`,
      `Suddenly, everything goes wrong. Chaos ensues.`,
      `A twist: nothing is as it seems.`,
      `${username || 'The protagonist'} makes a critical decision.`,
      `The atmosphere grows tense. Something is watching.`,
      `In a surprising turn of events...`,
      `The mystery deepens. Clues emerge.`
    ];

    return segments[Math.floor(Math.random() * segments.length)];
  }

  /**
   * Should continue story?
   */
  shouldContinueStory() {
    if (!this.activeStory) return false;
    
    // 15% chance when story is active
    return Math.random() < 0.15;
  }

  /**
   * End current story
   */
  endStory() {
    if (!this.activeStory) return null;

    const duration = Date.now() - this.activeStory.startedAt;
    const ending = this.generateEnding();

    this.activeStory.chapters.push({
      text: ending,
      contributor: 'Slunt',
      timestamp: Date.now(),
      isEnding: true
    });

    this.storyHistory.push(this.activeStory);

    console.log(`📖 [Storytelling] Ended story: "${this.activeStory.title}"`);
    console.log(`📖 [Storytelling] Duration: ${(duration/60000).toFixed(0)} minutes, ${this.activeStory.chapters.length} chapters`);

    const result = {
      title: this.activeStory.title,
      ending
    };

    this.activeStory = null;

    return result;
  }

  /**
   * Generate ending
   */
  generateEnding() {
    const endings = [
      `And that's how it ends. Or does it? *The End*`,
      `Everything fades to black. The story concludes. For now.`,
      `And they all lived... well, you know how these things go. *Fin*`,
      `To be continued... maybe. Depends on my mood. *End*`,
      `The end. Or is it? Who knows. Who cares. *Fin*`,
      `And thus concludes our tale. Thanks for playing along. *The End*`
    ];

    return endings[Math.floor(Math.random() * endings.length)];
  }

  /**
   * Get context for AI
   */
  getContext() {
    if (!this.activeStory) return '';

    let context = `\n\nYou're telling a story: "${this.activeStory.title}" (${this.activeStory.genre})`;
    context += `\nChapter ${this.activeStory.currentChapter}, ${this.activeStory.chapters.length} parts so far`;
    
    if (this.activeStory.participants.size > 0) {
      context += `\nCharacters: ${Array.from(this.activeStory.participants).join(', ')}`;
    }

    if (this.activeStory.chapters.length > 0) {
      const lastChapter = this.activeStory.chapters[this.activeStory.chapters.length - 1];
      context += `\nLast part: ${lastChapter.text}`;
    }

    return context;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeStory: this.activeStory ? this.activeStory.title : null,
      currentGenre: this.activeStory?.genre || null,
      participants: this.activeStory ? Array.from(this.activeStory.participants) : [],
      totalStories: this.storyHistory.length,
      currentChapters: this.activeStory?.chapters.length || 0
    };
  }

  /**
   * Save state
   */
  save() {
    return {
      activeStory: this.activeStory,
      storyHistory: this.storyHistory.slice(-5),
      characters: Array.from(this.characters.entries()),
      plotPoints: this.plotPoints.slice(-50)
    };
  }

  /**
   * Load state
   */
  load(data) {
    if (data.activeStory) this.activeStory = data.activeStory;
    if (data.storyHistory) this.storyHistory = data.storyHistory;
    if (data.characters) this.characters = new Map(data.characters);
    if (data.plotPoints) this.plotPoints = data.plotPoints;

    if (this.activeStory) {
      console.log(`📖 [Storytelling] Restored active story: "${this.activeStory.title}"`);
    }
  }
}

module.exports = StorytellingEngine;
