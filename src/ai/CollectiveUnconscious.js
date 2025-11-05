/**
 * CollectiveUnconscious.js
 * Aggregate and analyze patterns across all users and platforms
 * Features: Shared dreams, collective moods, emergent narratives, zeitgeist tracking
 */

const fs = require('fs').promises;
const path = require('path');

class CollectiveUnconscious {
    constructor() {
        this.sharedDreams = [];
        this.collectiveMoods = new Map();
        this.emergentNarratives = [];
        this.zeitgeist = {
            currentTheme: null,
            intensity: 0,
            participants: new Set(),
            keywords: new Map()
        };
        this.archetypes = new Map();
        this.synchronicities = [];
        
        this.dataPath = path.join(__dirname, '../../data/collective_unconscious.json');
        
        // Archetypal patterns
        this.archetypeTemplates = {
            hero: { traits: ['brave', 'determined', 'struggling'], threshold: 3 },
            shadow: { traits: ['dark', 'hidden', 'repressed'], threshold: 3 },
            trickster: { traits: ['chaotic', 'unpredictable', 'clever'], threshold: 3 },
            sage: { traits: ['wise', 'knowing', 'detached'], threshold: 3 },
            innocent: { traits: ['naive', 'optimistic', 'pure'], threshold: 3 },
            rebel: { traits: ['against', 'fight', 'resist'], threshold: 3 }
        };

        this.load();
        
        // Update collective patterns every 5 minutes
        setInterval(() => this.updateZeitgeist(), 5 * 60 * 1000);
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            this.sharedDreams = saved.sharedDreams || [];
            this.emergentNarratives = saved.emergentNarratives || [];
            
            if (saved.collectiveMoods) {
                for (const [key, value] of Object.entries(saved.collectiveMoods)) {
                    this.collectiveMoods.set(key, value);
                }
            }

            if (saved.archetypes) {
                for (const [key, value] of Object.entries(saved.archetypes)) {
                    this.archetypes.set(key, value);
                }
            }
            
            console.log(`[CollectiveUnconscious] Loaded ${this.sharedDreams.length} shared dreams`);
        } catch (error) {
            console.log('[CollectiveUnconscious] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                sharedDreams: this.sharedDreams.slice(-50),
                emergentNarratives: this.emergentNarratives.slice(-30),
                collectiveMoods: Object.fromEntries(this.collectiveMoods),
                archetypes: Object.fromEntries(this.archetypes)
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[CollectiveUnconscious] Save error:', error.message);
        }
    }

    // Record individual contribution to collective
    contributeToCollective(username, data) {
        const { mood, message, emotion, theme } = data;

        // Update collective mood (ensure mood is a string, not an object)
        if (mood) {
            // Convert mood to string if it's an object
            const moodStr = typeof mood === 'object' ? (mood.mood || mood.primary || JSON.stringify(mood)) : String(mood);
            
            const moodKey = `mood_${Date.now()}`;
            this.collectiveMoods.set(moodKey, {
                username,
                mood: moodStr,
                timestamp: Date.now(),
                intensity: data.intensity || 0.5
            });
        }

        // Analyze for archetypal patterns
        if (message) {
            this.detectArchetype(username, message);
        }

        // Contribute to zeitgeist
        if (theme) {
            this.contributeToZeitgeist(username, theme, message);
        }

        // Check for synchronicity
        this.detectSynchronicity(username, data);

        this.save();
    }

    // Detect archetypal patterns
    detectArchetype(username, message) {
        const messageLower = message.toLowerCase();

        for (const [archetypeName, template] of Object.entries(this.archetypeTemplates)) {
            let matches = 0;
            for (const trait of template.traits) {
                if (messageLower.includes(trait)) {
                    matches++;
                }
            }

            if (matches >= template.threshold) {
                if (!this.archetypes.has(username)) {
                    this.archetypes.set(username, {
                        username,
                        archetypes: new Map(),
                        dominant: null
                    });
                }

                const userArch = this.archetypes.get(username);
                const count = (userArch.archetypes.get(archetypeName) || 0) + 1;
                userArch.archetypes.set(archetypeName, count);

                // Update dominant archetype
                let maxCount = 0;
                let dominant = null;
                for (const [name, c] of userArch.archetypes.entries()) {
                    if (c > maxCount) {
                        maxCount = c;
                        dominant = name;
                    }
                }
                userArch.dominant = dominant;

                console.log(`[CollectiveUnconscious] ${username} embodies ${archetypeName} archetype (${count} times)`);
            }
        }
    }

    // Contribute to zeitgeist (spirit of the times)
    contributeToZeitgeist(username, theme, message) {
        this.zeitgeist.participants.add(username);

        // Extract keywords
        const words = message.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (word.length > 4) {
                const count = this.zeitgeist.keywords.get(word) || 0;
                this.zeitgeist.keywords.set(word, count + 1);
            }
        }

        // Increment theme intensity
        if (theme === this.zeitgeist.currentTheme) {
            this.zeitgeist.intensity += 0.1;
        }
    }

    // Update zeitgeist based on collective patterns
    updateZeitgeist() {
        // Find dominant keyword
        let maxCount = 0;
        let dominantKeyword = null;
        for (const [word, count] of this.zeitgeist.keywords.entries()) {
            if (count > maxCount) {
                maxCount = count;
                dominantKeyword = word;
            }
        }

        if (dominantKeyword) {
            this.zeitgeist.currentTheme = dominantKeyword;
            console.log(`[CollectiveUnconscious] 🌍 Zeitgeist: "${dominantKeyword}" (${maxCount} mentions, ${this.zeitgeist.participants.size} participants)`);
        }

        // Decay old keywords
        for (const [word, count] of this.zeitgeist.keywords.entries()) {
            const newCount = Math.floor(count * 0.8);
            if (newCount === 0) {
                this.zeitgeist.keywords.delete(word);
            } else {
                this.zeitgeist.keywords.set(word, newCount);
            }
        }

        // Decay intensity
        this.zeitgeist.intensity *= 0.9;
    }

    // Detect synchronicity (meaningful coincidence)
    detectSynchronicity(username, data) {
        const now = Date.now();
        const recentWindow = 30 * 1000; // 30 seconds

        // Check if multiple users are experiencing similar things simultaneously
        const recentMoods = Array.from(this.collectiveMoods.values())
            .filter(m => now - m.timestamp < recentWindow);

        if (recentMoods.length >= 3) {
            // Check for mood convergence
            const moodCounts = {};
            for (const m of recentMoods) {
                moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
            }

            for (const [mood, count] of Object.entries(moodCounts)) {
                if (count >= 3) {
                    const sync = {
                        type: 'mood_convergence',
                        mood,
                        participants: recentMoods.filter(m => m.mood === mood).map(m => m.username),
                        timestamp: now
                    };

                    this.synchronicities.push(sync);
                    console.log(`[CollectiveUnconscious] 🔮 Synchronicity detected: ${count} users feeling ${mood} simultaneously`);
                    
                    this.save();
                    return sync;
                }
            }
        }

        return null;
    }

    // Record shared dream
    recordSharedDream(dreamData) {
        const dream = {
            id: `dream_${Date.now()}`,
            theme: dreamData.theme,
            symbols: dreamData.symbols || [],
            participants: dreamData.participants || [],
            timestamp: Date.now(),
            recurrence: 1
        };

        // Check if similar dream already exists
        for (const existingDream of this.sharedDreams) {
            if (existingDream.theme === dream.theme) {
                existingDream.recurrence++;
                existingDream.participants = [...new Set([...existingDream.participants, ...dream.participants])];
                console.log(`[CollectiveUnconscious] 💤 Recurring dream: "${dream.theme}" (${existingDream.recurrence} times)`);
                this.save();
                return existingDream;
            }
        }

        this.sharedDreams.push(dream);
        console.log(`[CollectiveUnconscious] 💤 New shared dream: "${dream.theme}"`);
        this.save();
        return dream;
    }

    // Detect emergent narrative
    detectEmergentNarrative(events) {
        // Look for patterns in events
        if (events.length < 3) return null;

        const narrative = {
            id: `narrative_${Date.now()}`,
            events: events.slice(-5),
            theme: this.extractNarrativeTheme(events),
            participants: [...new Set(events.flatMap(e => e.participants || []))],
            timestamp: Date.now(),
            stage: this.determineNarrativeStage(events)
        };

        this.emergentNarratives.push(narrative);
        console.log(`[CollectiveUnconscious] 📖 Emergent narrative: "${narrative.theme}" (stage: ${narrative.stage})`);
        
        this.save();
        return narrative;
    }

    // Extract narrative theme from events
    extractNarrativeTheme(events) {
        const keywords = [];
        for (const event of events) {
            if (event.keywords) {
                keywords.push(...event.keywords);
            }
        }

        if (keywords.length === 0) return 'The Unnamed Story';

        // Find most common keyword
        const counts = {};
        for (const word of keywords) {
            counts[word] = (counts[word] || 0) + 1;
        }

        let maxCount = 0;
        let theme = '';
        for (const [word, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                theme = word;
            }
        }

        return `The ${theme.charAt(0).toUpperCase() + theme.slice(1)} Saga`;
    }

    // Determine narrative stage
    determineNarrativeStage(events) {
        const stages = ['beginning', 'rising', 'climax', 'falling', 'resolution'];
        const stage = Math.min(events.length - 1, stages.length - 1);
        return stages[stage];
    }

    // Get collective mood
    getCollectiveMood() {
        const now = Date.now();
        const recentWindow = 5 * 60 * 1000; // 5 minutes

        const recentMoods = Array.from(this.collectiveMoods.values())
            .filter(m => now - m.timestamp < recentWindow);

        if (recentMoods.length === 0) {
            return { mood: 'neutral', confidence: 0 };
        }

        const moodCounts = {};
        let totalIntensity = 0;

        for (const m of recentMoods) {
            moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
            totalIntensity += m.intensity;
        }

        let dominantMood = null;
        let maxCount = 0;

        for (const [mood, count] of Object.entries(moodCounts)) {
            if (count > maxCount) {
                maxCount = count;
                dominantMood = mood;
            }
        }

        return {
            mood: dominantMood,
            confidence: maxCount / recentMoods.length,
            averageIntensity: totalIntensity / recentMoods.length,
            participants: recentMoods.length
        };
    }

    // Get user's archetype
    getUserArchetype(username) {
        const userArch = this.archetypes.get(username);
        if (!userArch || !userArch.dominant) return null;

        return {
            archetype: userArch.dominant,
            strength: userArch.archetypes.get(userArch.dominant),
            alternatives: Array.from(userArch.archetypes.entries())
                .filter(([name]) => name !== userArch.dominant)
                .sort((a, b) => b[1] - a[1])
        };
    }

    // Check if user is part of synchronicity
    isPartOfSynchronicity(username) {
        const now = Date.now();
        const recentWindow = 60 * 1000; // 1 minute

        const recentSyncs = this.synchronicities
            .filter(s => now - s.timestamp < recentWindow);

        for (const sync of recentSyncs) {
            if (sync.participants.includes(username)) {
                return sync;
            }
        }

        return null;
    }

    // Get context for AI
    getCollectiveContext() {
        const collectiveMood = this.getCollectiveMood();
        const recentSyncs = this.synchronicities.slice(-3);
        const recentNarratives = this.emergentNarratives.slice(-2);

        let context = '🌍 Collective Unconscious:\n';

        if (collectiveMood.mood && collectiveMood.confidence > 0.3) {
            context += `- Collective mood: ${collectiveMood.mood} (${Math.round(collectiveMood.confidence * 100)}% confidence, ${collectiveMood.participants} people)\n`;
        }

        if (this.zeitgeist.currentTheme && this.zeitgeist.intensity > 0.5) {
            context += `- Zeitgeist: "${this.zeitgeist.currentTheme}" (intensity: ${this.zeitgeist.intensity.toFixed(2)})\n`;
        }

        if (recentSyncs.length > 0) {
            context += `- Recent synchronicities: ${recentSyncs.length}\n`;
        }

        if (recentNarratives.length > 0) {
            const narrative = recentNarratives[recentNarratives.length - 1];
            context += `- Emergent narrative: "${narrative.theme}" (${narrative.stage})\n`;
        }

        return context;
    }

    getStatus() {
        const collectiveMood = this.getCollectiveMood();
        
        return {
            sharedDreams: this.sharedDreams.length,
            emergentNarratives: this.emergentNarratives.length,
            trackedArchetypes: this.archetypes.size,
            collectiveMood: collectiveMood.mood,
            zeitgeist: this.zeitgeist.currentTheme,
            recentSynchronicities: this.synchronicities.length
        };
    }
}

module.exports = CollectiveUnconscious;
