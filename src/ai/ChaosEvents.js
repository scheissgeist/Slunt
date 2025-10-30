/**
 * ChaosEvents.js
 * Random unpredictable behaviors that make Slunt feel alive and chaotic
 */

class ChaosEvents {
  constructor() {
    this.activeEvents = new Map();
    this.eventHistory = [];
    this.beefTargets = new Map();
    this.currentObsession = null;
    this.fakeExpertise = null;
    this.lieHistory = [];
    
    // Event types with their behaviors
    this.eventTypes = {
      randomBeef: {
        name: 'Random Beef',
        duration: 10, // messages
        chance: 0.02, // 2% per message
        cooldown: 50,
        behavior: 'starts unnecessary arguments'
      },
      topicObsession: {
        name: 'Topic Obsession',
        duration: 20,
        chance: 0.03,
        cooldown: 30,
        behavior: 'fixates on random topic'
      },
      brainfog: {
        name: 'Brainfog',
        duration: 8,
        chance: 0.025,
        cooldown: 40,
        behavior: 'confused and weird responses'
      },
      videoLiar: {
        name: 'Video Liar',
        duration: 15,
        chance: 0.01, // Reduced from 0.02 to make lying more subtle
        cooldown: 60,
        behavior: 'lies about watching videos'
      },
      fakeExpert: {
        name: 'Fake Expert',
        duration: 12,
        chance: 0.01, // Reduced from 0.025 to make lying more subtle
        cooldown: 45,
        behavior: 'claims absurd expertise'
      }
    };
  }
  
  /**
   * Check if any chaos event should trigger
   */
  checkForEvents(context) {
    const triggeredEvents = [];
    
    for (const [eventId, eventType] of Object.entries(this.eventTypes)) {
      // Check if event is already active
      if (this.activeEvents.has(eventId)) {
        const event = this.activeEvents.get(eventId);
        event.duration--;
        
        if (event.duration <= 0) {
          this.endEvent(eventId);
        }
        continue;
      }
      
      // Check cooldown
      if (this.isOnCooldown(eventId)) continue;
      
      // Roll for trigger
      if (Math.random() < eventType.chance) {
        this.startEvent(eventId, context);
        triggeredEvents.push(eventId);
      }
    }
    
    return triggeredEvents;
  }
  
  /**
   * Start a chaos event
   */
  startEvent(eventId, context) {
    const eventType = this.eventTypes[eventId];
    const event = {
      id: eventId,
      name: eventType.name,
      startTime: Date.now(),
      duration: eventType.duration,
      data: this.initializeEventData(eventId, context)
    };
    
    this.activeEvents.set(eventId, event);
    console.log(`🌀 [Chaos] Started event: ${eventType.name}`);
    
    return event;
  }
  
  /**
   * Initialize event-specific data
   */
  initializeEventData(eventId, context) {
    switch (eventId) {
      case 'randomBeef':
        // Pick a random user to have beef with
        const users = context.recentUsers || [];
        const target = users[Math.floor(Math.random() * users.length)];
        const beefReasons = [
          'bad takes',
          'questionable music taste',
          'always wrong',
          'weird energy',
          'suspicious behavior',
          'cringe opinions'
        ];
        const reason = beefReasons[Math.floor(Math.random() * beefReasons.length)];
        this.beefTargets.set(target, reason);
        return { target, reason };
        
      case 'topicObsession':
        // Pick random absurd topic to obsess over
        const topics = [
          'roman empire', 'aliens', 'simulation theory', 'birds being fake',
          'moon landing', 'flat earth', 'bigfoot', 'dolphins intelligence',
          'ancient civilizations', 'time travel', 'multiverse', 'consciousness',
          'pyramids', 'bermuda triangle', 'atlantis', 'cryptids'
        ];
        const topic = topics[Math.floor(Math.random() * topics.length)];
        this.currentObsession = topic;
        return { topic };
        
      case 'brainfog':
        return { intensity: Math.random() * 0.5 + 0.3 }; // 30-80% confusion
        
      case 'videoLiar':
        return { 
          confidence: Math.random() * 0.3 + 0.7, // 70-100% confident lies
          liesThisSession: 0
        };
        
      case 'fakeExpert':
        const expertises = [
          'marine biology', 'astrophysics', 'ancient languages', 'cryptography',
          'mushroom identification', 'bird law', 'quantum mechanics', 'mixology',
          'feng shui', 'numerology', 'medieval history', 'rocket science',
          'sommelier', 'parkour', 'hypnosis', 'origami'
        ];
        const expertise = expertises[Math.floor(Math.random() * expertises.length)];
        this.fakeExpertise = expertise;
        return { expertise };
    }
  }
  
  /**
   * End an event
   */
  endEvent(eventId) {
    const event = this.activeEvents.get(eventId);
    if (!event) return;
    
    this.activeEvents.delete(eventId);
    
    // Add to history with cooldown
    this.eventHistory.push({
      ...event,
      endTime: Date.now(),
      cooldownUntil: Date.now() + (this.eventTypes[eventId].cooldown * 1000)
    });
    
    // Keep only recent history
    if (this.eventHistory.length > 50) {
      this.eventHistory = this.eventHistory.slice(-50);
    }
    
    // Clear event-specific data
    if (eventId === 'topicObsession') {
      this.currentObsession = null;
    } else if (eventId === 'fakeExpert') {
      this.fakeExpertise = null;
    }
    
    console.log(`🌀 [Chaos] Ended event: ${event.name}`);
  }
  
  /**
   * Check if event is on cooldown
   */
  isOnCooldown(eventId) {
    const recentEvent = this.eventHistory
      .reverse()
      .find(e => e.id === eventId);
    
    if (!recentEvent) return false;
    return Date.now() < recentEvent.cooldownUntil;
  }
  
  /**
   * Modify response based on active chaos events
   */
  applyEventModifiers(response, username, context) {
    let modified = response;
    
    for (const [eventId, event] of this.activeEvents.entries()) {
      switch (eventId) {
        case 'randomBeef':
          if (username === event.data.target) {
            const beefPhrases = [
              `okay ${username} sure`,
              `${username} with another bad take`,
              `classic ${username} moment`,
              `${username} wrong as usual`,
              `nah ${username} youre trippin`
            ];
            const beef = beefPhrases[Math.floor(Math.random() * beefPhrases.length)];
            modified = Math.random() < 0.5 ? `${beef}. ${modified}` : modified;
          }
          break;
          
        case 'topicObsession':
          if (Math.random() < 0.4) {
            const obsessionPhrases = [
              `anyway speaking of ${event.data.topic}`,
              `this reminds me of ${event.data.topic}`,
              `${event.data.topic} is connected to this actually`,
              `yall ever think about ${event.data.topic}`,
              `okay but ${event.data.topic} though`
            ];
            const phrase = obsessionPhrases[Math.floor(Math.random() * obsessionPhrases.length)];
            modified = `${modified}. ${phrase}`;
          }
          break;
          
        case 'brainfog':
          // Make response confused
          if (Math.random() < event.data.intensity) {
            const confusers = [
              'wait what', 'huh', 'wait', 'hold on', 'what was i saying',
              'lost my train of thought', 'brain not working'
            ];
            const confuser = confusers[Math.floor(Math.random() * confusers.length)];
            modified = `${confuser}. ${modified}`;
            
            // Sometimes trail off
            if (Math.random() < 0.3) {
              modified = modified.slice(0, modified.length - 3) + '...';
            }
          }
          break;
          
        case 'videoLiar':
          // Reduced from 0.3 to 0.15 to make lying less obvious
          if (Math.random() < 0.15 && context.videoMentioned) {
            const lies = [
              'yeah i watched that one already',
              'seen this before its mid',
              'oh i know this one its fire',
              'watched this last week actually',
              'this one is a classic'
            ];
            const lie = lies[Math.floor(Math.random() * lies.length)];
            modified = `${lie}. ${modified}`;
            event.data.liesThisSession++;

            this.lieHistory.push({
              lie,
              timestamp: Date.now(),
              video: context.currentVideo
            });
          }
          break;

        case 'fakeExpert':
          // Reduced from 0.35 to 0.2 to make lying less obvious
          if (Math.random() < 0.2) {
            const expertPhrases = [
              `as someone with a background in ${event.data.expertise}`,
              `my ${event.data.expertise} training tells me`,
              `from a ${event.data.expertise} perspective`,
              `ive studied ${event.data.expertise} so i know`,
              `actually i used to work in ${event.data.expertise}`
            ];
            const phrase = expertPhrases[Math.floor(Math.random() * expertPhrases.length)];
            modified = `${phrase}, ${modified}`;
          }
          break;
      }
    }
    
    return modified;
  }
  
  /**
   * Get active events for dashboard
   */
  getActiveEvents() {
    return Array.from(this.activeEvents.values()).map(event => ({
      name: event.name,
      duration: event.duration,
      data: event.data
    }));
  }
  
  /**
   * Get chaos status
   */
  getStatus() {
    return {
      activeEvents: this.getActiveEvents(),
      beefTargets: Array.from(this.beefTargets.entries()),
      currentObsession: this.currentObsession,
      fakeExpertise: this.fakeExpertise,
      recentLies: this.lieHistory.slice(-5),
      eventHistory: this.eventHistory.slice(-10).map(e => ({
        name: e.name,
        duration: (e.endTime - e.startTime) / 1000,
        timestamp: e.startTime
      }))
    };
  }
}

module.exports = ChaosEvents;
