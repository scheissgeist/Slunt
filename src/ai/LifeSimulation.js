/**
 * Life Simulation - Slunt has a life outside of chat
 * 
 * Instead of announcing internal stats, generate believable stories about
 * what Slunt was doing during his absence based on time of day and duration.
 */

class LifeSimulation {
  constructor(chatBot) {
    this.chatBot = chatBot;
    
    // Track last activity time per platform
    this.lastActivity = {
      coolhole: Date.now(),
      discord: Date.now(),
      twitch: Date.now()
    };
    
    // Load last activity times from disk to prevent restart announcements
    this.loadLastActivity();
    
    // Slunt's schedule (flexible, not rigid)
    this.schedule = {
      sleepStart: 2,   // 2 AM (flexible)
      sleepEnd: 10,    // 10 AM (flexible)
      workStart: 14,   // 2 PM (some days)
      workEnd: 22      // 10 PM (some days)
    };
    
    // Life story templates
    this.nightStories = [
      "tried to sleep but my neighbor was blasting music until 4am",
      "had the weirdest fucking dream about {topic}",
      "couldn't sleep so i ended up watching {show} for 3 hours",
      "my cat knocked over a lamp at 3am and i thought someone broke in",
      "got woken up by some asshole's car alarm going off for an hour",
      "had sleep paralysis, saw some creepy shadow figure shit",
      "heard weird scratching in the walls, probably just mice... hopefully",
      "couldn't sleep, ended up doom scrolling until sunrise like an idiot",
      "smoked some weed and got way too high, thought about {topic} for like 2 hours",
      "blazed up and watched {show}, kept forgetting what was happening",
      "got stoned and raided the fridge at 2am, ate everything"
    ];
    
    this.dayStories = [
      "had to deal with {workplace} bullshit all day",
      "went grocery shopping, some karen tried to fight me over {item}",
      "my car wouldn't start so i had to deal with that mess",
      "went to the gym, some dude was hogging three machines",
      "had a doctor appointment, waited 2 hours past my scheduled time",
      "my landlord showed up unannounced to 'inspect' shit",
      "power went out for like 4 hours, had nothing to do",
      "got dragged to {place} by a friend, complete waste of time",
      "had to help someone move, my back is fucked",
      "went hiking, almost got eaten by mosquitoes"
    ];
    
    this.workStories = [
      "customer tried to return something they clearly broke themselves",
      "coworker called in sick so i had to cover their shift",
      "boss gave me the most pointless task imaginable",
      "had a meeting that could've been an email",
      "some guy came in 5 minutes before closing and took forever",
      "cash register broke right in the middle of a rush",
      "had to train the new person who doesn't listen to anything",
      "dealt with a karen demanding to speak to the manager"
    ];
    
    this.variables = {
      topics: ["aliens", "conspiracy theories", "the government", "ai taking over", "why birds aren't real"],
      shows: ["random youtube videos", "some documentary", "shitty reality tv", "old sitcom reruns"],
      workplaces: ["retail", "restaurant", "warehouse", "call center", "warehouse"],
      items: ["toilet paper", "parking spots", "the last rotisserie chicken"],
      places: ["target", "costco", "some party", "a family gathering", "the dmv"]
    };
  }
  
  /**
   * Update last activity time for a platform
   */
  recordActivity(platform) {
    this.lastActivity[platform] = Date.now();
    // Save to disk periodically (throttled to avoid excessive writes)
    if (!this.lastSave || Date.now() - this.lastSave > 60000) {
      this.saveLastActivity();
      this.lastSave = Date.now();
    }
  }
  
  /**
   * Generate a story about where Slunt has been
   * Returns null if he shouldn't explain (was only gone briefly)
   */
  generateReturnStory(platform) {
    const timeSinceLastActivity = Date.now() - this.lastActivity[platform];
    const hoursGone = timeSinceLastActivity / (1000 * 60 * 60);
    const currentHour = new Date().getHours();
    
    // Less than 3 hours? Don't explain, just return naturally
    if (hoursGone < 3) {
      return null;
    }
    
    // 3-5 hours during night (2 AM - 10 AM) = probably sleeping
    if (hoursGone >= 3 && hoursGone < 8 && this.isNightTime(currentHour)) {
      if (Math.random() < 0.7) {
        return this.generateSleepStory(hoursGone);
      } else {
        return this.generateNightStory();
      }
    }
    
    // 5+ hours during night = definitely was sleeping
    if (hoursGone >= 8 && this.wasLastActivityAtNight()) {
      return this.generateSleepStory(hoursGone);
    }
    
    // 4-8 hours during day = probably at work
    if (hoursGone >= 4 && hoursGone < 10 && this.isDayTime(currentHour)) {
      if (Math.random() < 0.6) {
        return this.generateWorkStory();
      } else {
        return this.generateDayStory();
      }
    }
    
    // 8+ hours = was definitely doing something major
    if (hoursGone >= 10) {
      if (this.isDayTime(currentHour)) {
        return this.generateWorkStory();
      } else {
        return this.generateSleepStory(hoursGone);
      }
    }
    
    // Default: just been out doing stuff
    return this.generateDayStory();
  }
  
  /**
   * Check if it's night time (sleep hours)
   */
  isNightTime(hour) {
    return hour >= this.schedule.sleepStart || hour <= this.schedule.sleepEnd;
  }
  
  /**
   * Check if it's day time
   */
  isDayTime(hour) {
    return hour > this.schedule.sleepEnd && hour < this.schedule.sleepStart;
  }
  
  /**
   * Check if last activity was during night
   */
  wasLastActivityAtNight() {
    const lastHour = new Date(this.lastActivity.coolhole).getHours();
    return this.isNightTime(lastHour);
  }
  
  /**
   * Generate a sleep story
   */
  generateSleepStory(hours) {
    const sleepQuality = hours >= 7 ? "good" : hours >= 5 ? "okay" : "shitty";
    
    if (sleepQuality === "good") {
      const stories = [
        "finally got a decent night's sleep for once",
        "passed the fuck out, needed that",
        "actually slept well, feel like a human again",
        "crashed hard, slept like 8 hours straight"
      ];
      return stories[Math.floor(Math.random() * stories.length)];
    } else if (sleepQuality === "okay") {
      const stories = [
        "got some sleep but kept waking up",
        "slept weird, neck hurts now",
        "had a bunch of weird dreams that kept waking me up",
        "slept but don't feel rested at all"
      ];
      return stories[Math.floor(Math.random() * stories.length)];
    } else {
      // Bad sleep - pick from night stories
      return this.fillTemplate(
        this.nightStories[Math.floor(Math.random() * this.nightStories.length)]
      );
    }
  }
  
  /**
   * Generate a night story (was awake at night)
   */
  generateNightStory() {
    return this.fillTemplate(
      this.nightStories[Math.floor(Math.random() * this.nightStories.length)]
    );
  }
  
  /**
   * Generate a work story
   */
  generateWorkStory() {
    return "just got back from work. " + this.fillTemplate(
      this.workStories[Math.floor(Math.random() * this.workStories.length)]
    );
  }
  
  /**
   * Generate a day story (general daytime activity)
   */
  generateDayStory() {
    return this.fillTemplate(
      this.dayStories[Math.floor(Math.random() * this.dayStories.length)]
    );
  }
  
  /**
   * Fill in template variables
   */
  fillTemplate(template) {
    let filled = template;
    
    // Replace {topic}
    if (filled.includes('{topic}')) {
      const topic = this.variables.topics[Math.floor(Math.random() * this.variables.topics.length)];
      filled = filled.replace('{topic}', topic);
    }
    
    // Replace {show}
    if (filled.includes('{show}')) {
      const show = this.variables.shows[Math.floor(Math.random() * this.variables.shows.length)];
      filled = filled.replace('{show}', show);
    }
    
    // Replace {workplace}
    if (filled.includes('{workplace}')) {
      const workplace = this.variables.workplaces[Math.floor(Math.random() * this.variables.workplaces.length)];
      filled = filled.replace('{workplace}', workplace);
    }
    
    // Replace {item}
    if (filled.includes('{item}')) {
      const item = this.variables.items[Math.floor(Math.random() * this.variables.items.length)];
      filled = filled.replace('{item}', item);
    }
    
    // Replace {place}
    if (filled.includes('{place}')) {
      const place = this.variables.places[Math.floor(Math.random() * this.variables.places.length)];
      filled = filled.replace('{place}', place);
    }
    
    return filled;
  }
  
  /**
   * Load last activity times from disk
   */
  loadLastActivity() {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../data/last_activity.json');
      
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.lastActivity = data;
        console.log('🌅 [Life] Loaded last activity times from disk');
      }
    } catch (error) {
      console.warn('⚠️ [Life] Could not load last activity:', error.message);
    }
  }
  
  /**
   * Save last activity times to disk
   */
  saveLastActivity() {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../data/last_activity.json');
      
      fs.writeFileSync(filePath, JSON.stringify(this.lastActivity, null, 2));
    } catch (error) {
      console.warn('⚠️ [Life] Could not save last activity:', error.message);
    }
  }
  
  /**
   * Check if Slunt should explain his absence on this platform
   */
  shouldExplainAbsence(platform) {
    const timeSinceLastActivity = Date.now() - this.lastActivity[platform];
    const hoursGone = timeSinceLastActivity / (1000 * 60 * 60);
    
    // Only explain if gone 3+ hours
    return hoursGone >= 3;
  }
  
  /**
   * Get a natural greeting that may include where he's been
   */
  getGreeting(platform) {
    const story = this.generateReturnStory(platform);
    
    if (!story) {
      // Short absence, just say hey
      const greetings = ["yo", "sup", "hey", "what's up", "what'd i miss"];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Longer absence, include story
    return story;
  }
}

module.exports = LifeSimulation;
