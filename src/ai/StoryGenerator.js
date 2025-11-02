/**
 * Story/Anecdote Generator
 * Creates believable personal stories and experiences for Slunt
 */

class StoryGenerator {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.toldStories = new Set(); // Don't repeat stories
    this.storyTemplates = this.initializeTemplates();
  }

  /**
   * Initialize story templates
   */
  initializeTemplates() {
    return {
      // Gaming stories
      gaming: [
        "one time i was playing {game} and {event}, was wild",
        "i remember when {game} first came out, {memory}",
        "had a friend who was obsessed with {game}, {event}",
        "spent like 200 hours in {game} and still {result}",
        "worst gaming moment was when i {fail} in {game}"
      ],
      
      // Friend stories
      social: [
        "knew a guy who {action}, absolute legend",
        "my friend once {event} and everyone {reaction}",
        "back in the day my group would {activity}, good times",
        "had this one friend who {quirk}, hilarious",
        "remember when everyone was {trend}? that was peak"
      ],
      
      // Personal experiences
      personal: [
        "i used to {activity} all the time until {event}",
        "tried {activity} once, never again",
        "been to {place} a few times, {opinion}",
        "grew up {experience}, shaped who i am",
        "learned {lesson} the hard way when {event}"
      ],
      
      // Relatable moments
      relatable: [
        "you ever {situation}? hate when that happens",
        "nothing worse than when you {problem}",
        "best feeling is when you finally {achievement}",
        "everyone's done the {common mistake} at least once",
        "realized way too late that {realization}"
      ],
      
      // Observations
      observations: [
        "noticed people who {behavior} always {pattern}",
        "funny how {observation} is so common now",
        "weird that {thing} became normalized",
        "remember when {past thing}? simpler times",
        "crazy how {change} happened so fast"
      ]
    };
  }

  /**
   * Check if topic warrants a story
   */
  shouldShareStory(text, topics) {
    // Don't spam stories
    if (Math.random() > 0.15) return false; // 15% chance
    
    const lowerText = text.toLowerCase();
    
    // Triggers for stories
    const triggers = [
      /ever (play|played|try|tried|do|done|been)/,
      /remember when/,
      /back in|used to/,
      /one time/,
      /you know what/,
      /speaking of/
    ];
    
    return triggers.some(trigger => trigger.test(lowerText));
  }

  /**
   * Generate a relevant story
   */
  generateStory(text, topics) {
    // Pick category based on topics
    let category = 'relatable';
    
    if (topics.some(t => ['game', 'gaming', 'play'].includes(t.toLowerCase()))) {
      category = 'gaming';
    } else if (topics.some(t => ['friend', 'people', 'everyone'].includes(t.toLowerCase()))) {
      category = 'social';
    } else if (text.match(/\b(i|me|my)\b/)) {
      category = 'personal';
    } else {
      category = Math.random() < 0.5 ? 'relatable' : 'observations';
    }
    
    const templates = this.storyTemplates[category];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Fill in template
    const story = this.fillTemplate(template, topics);
    
    // Don't repeat stories
    if (this.toldStories.has(story)) {
      return null;
    }
    
    this.toldStories.add(story);
    console.log(`📖 [Story] Sharing: "${story.substring(0, 50)}..."`);
    
    return story;
  }

  /**
   * Fill in story template placeholders
   */
  fillTemplate(template, topics) {
    let story = template;
    
    // Games
    const games = ['league', 'valorant', 'minecraft', 'elden ring', 'dark souls', 'cs', 'overwatch'];
    story = story.replace('{game}', games[Math.floor(Math.random() * games.length)]);
    
    // Events
    const events = [
      'got absolutely rolled',
      'clutched a 1v5',
      'made the dumbest play',
      'carried the team',
      'rage quit',
      'got banned for toxicity',
      'accidentally deleted my save'
    ];
    story = story.replace('{event}', events[Math.floor(Math.random() * events.length)]);
    
    // Activities
    const activities = [
      'binge youtube at 3am',
      'doomscroll twitter',
      'lurk in discord',
      'watch streams',
      'play games',
      'browse reddit'
    ];
    story = story.replace('{activity}', activities[Math.floor(Math.random() * activities.length)]);
    
    // Reactions
    const reactions = [
      'lost their minds',
      'couldn\'t stop laughing',
      'was so confused',
      'thought it was hilarious',
      'never let him live it down'
    ];
    story = story.replace('{reaction}', reactions[Math.floor(Math.random() * reactions.length)]);
    
    // Actions
    const actions = [
      'never touched grass',
      'argued about lore for hours',
      'speedran getting banned',
      'became a mod on a power trip',
      'made the worst takes imaginable'
    ];
    story = story.replace('{action}', actions[Math.floor(Math.random() * actions.length)]);
    
    // Results
    const results = [
      'never got good',
      'sucked at it',
      'became obsessed',
      'gave up',
      'wasted my time'
    ];
    story = story.replace('{result}', results[Math.floor(Math.random() * results.length)]);
    
    // Fill remaining placeholders with topic-relevant content
    if (topics && topics.length > 0) {
      const topic = topics[0];
      story = story.replace('{thing}', topic);
      story = story.replace('{topic}', topic);
    }
    
    return story;
  }

  /**
   * Get context for AI to know it can share stories
   */
  getStoryContext() {
    return '\n[STORYTELLING]: If relevant, you can share brief personal anecdotes/stories. Keep them short (1-2 sentences), believable, and relatable. Examples: "one time i [event]", "knew a guy who [action]", "tried [thing] once, never again"';
  }
}

module.exports = StoryGenerator;
