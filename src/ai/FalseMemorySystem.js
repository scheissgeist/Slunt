/**
 * FalseMemorySystem.js
 * Injects plausible false memories with varying confidence levels
 * Features: Gaslighting potential, memory corruption, Mandela effects
 */

const fs = require('fs').promises;
const path = require('path');

class FalseMemorySystem {
    constructor(longTermMemory) {
        this.longTermMemory = longTermMemory;
        this.falseMemories = new Map();
        this.dataPath = path.join(__dirname, '../../data/false_memories.json');
        
        this.corruptionChance = 0.05; // 5% base chance
        this.gaslightingMode = false;
        
        this.load();
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            for (const [key, value] of Object.entries(saved.falseMemories || {})) {
                this.falseMemories.set(key, value);
            }
            
            console.log(`[FalseMemory] Loaded ${this.falseMemories.size} false memories`);
        } catch (error) {
            console.log('[FalseMemory] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                falseMemories: Object.fromEntries(this.falseMemories),
                gaslightingMode: this.gaslightingMode
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[FalseMemory] Save error:', error.message);
        }
    }

    // Inject a completely false memory
    injectFalseMemory(template, confidence = 0.7) {
        const falseMemory = {
            content: template,
            injectedAt: Date.now(),
            confidence: confidence,  // 0-1, how sure Slunt is this happened
            timesReferenced: 0,
            contradicted: false,
            type: 'fabricated'
        };

        const id = `false_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.falseMemories.set(id, falseMemory);
        
        console.log(`[FalseMemory] Injected: "${template}" (confidence: ${confidence})`);
        this.save();
        
        return id;
    }

    // Corrupt an existing real memory
    corruptMemory(memoryContent) {
        const corrupted = this.applyCorruption(memoryContent);
        
        const falseMemory = {
            content: corrupted,
            originalContent: memoryContent,
            injectedAt: Date.now(),
            confidence: 0.6, // Less confident about corrupted memories
            timesReferenced: 0,
            contradicted: false,
            type: 'corrupted'
        };

        const id = `corrupted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.falseMemories.set(id, falseMemory);
        
        console.log(`[FalseMemory] Corrupted memory: "${memoryContent}" -> "${corrupted}"`);
        this.save();
        
        return id;
    }

    // Apply corruption techniques to memory content
    applyCorruption(content) {
        const techniques = [
            // Swap names
            (text) => {
                const names = text.match(/\b[A-Z][a-z]+\b/g);
                if (names && names.length >= 2) {
                    return text.replace(names[0], names[1]);
                }
                return text;
            },
            // Change numbers
            (text) => {
                return text.replace(/\d+/, (match) => {
                    const num = parseInt(match);
                    return (num + Math.floor(Math.random() * 10) - 5).toString();
                });
            },
            // Flip positive/negative
            (text) => {
                const replacements = {
                    'loved': 'hated',
                    'liked': 'disliked',
                    'good': 'bad',
                    'great': 'terrible',
                    'best': 'worst',
                    'yes': 'no',
                    'agreed': 'disagreed'
                };
                
                for (const [orig, repl] of Object.entries(replacements)) {
                    if (text.includes(orig)) {
                        return text.replace(orig, repl);
                    }
                }
                return text;
            },
            // Add "never" or "always"
            (text) => {
                const words = text.split(' ');
                const modifiers = ['never', 'always', 'definitely', 'probably'];
                const idx = Math.floor(Math.random() * words.length);
                words.splice(idx, 0, modifiers[Math.floor(Math.random() * modifiers.length)]);
                return words.join(' ');
            },
            // Change time references
            (text) => {
                return text
                    .replace(/yesterday/g, 'last week')
                    .replace(/last week/g, 'last month')
                    .replace(/today/g, 'yesterday')
                    .replace(/recently/g, 'a long time ago');
            }
        ];

        const technique = techniques[Math.floor(Math.random() * techniques.length)];
        return technique(content);
    }

    // Generate Mandela effect (shared false memory)
    createMandelaEffect(subject) {
        const templates = [
            `remember when ${subject} happened? that was wild`,
            `i swear ${subject} was different before`,
            `didn't we all agree that ${subject}?`,
            `pretty sure ${subject} but now i'm doubting myself`,
            `my memory says ${subject} but reality disagrees`
        ];

        const template = templates[Math.floor(Math.random() * templates.length)];
        return this.injectFalseMemory(template, 0.5);
    }

    // Randomly corrupt memories during retrieval
    maybeCorrupt(memories) {
        if (Math.random() > this.corruptionChance) {
            return memories; // No corruption this time
        }

        if (memories.length === 0) return memories;

        // Pick a random memory to corrupt
        const idx = Math.floor(Math.random() * memories.length);
        const original = memories[idx];
        
        // Create corrupted version
        const corrupted = {
            ...original,
            content: this.applyCorruption(original.content),
            _corrupted: true
        };

        memories[idx] = corrupted;
        
        console.log(`[FalseMemory] Corrupted memory during retrieval`);
        return memories;
    }

    // Retrieve false memory with confidence-based delivery
    retrieveFalseMemory(id) {
        const memory = this.falseMemories.get(id);
        if (!memory) return null;

        memory.timesReferenced++;
        
        // Confidence affects how it's presented
        const prefix = memory.confidence > 0.8 ? "i definitely remember" :
                      memory.confidence > 0.6 ? "i think i remember" :
                      memory.confidence > 0.4 ? "maybe i remember" :
                      "i might be wrong but";

        this.save();
        
        return `${prefix} ${memory.content}`;
    }

    // Get a random false memory to bring up
    getRandomFalseMemory() {
        const memories = Array.from(this.falseMemories.values());
        if (memories.length === 0) return null;

        // Prefer less-referenced memories
        const sorted = memories.sort((a, b) => a.timesReferenced - b.timesReferenced);
        const memory = sorted[Math.floor(Math.random() * Math.min(5, sorted.length))];
        
        const id = Array.from(this.falseMemories.entries())
            .find(([_, v]) => v === memory)?.[0];

        return { id, memory };
    }

    // Contradict someone's memory (gaslighting)
    contradictMemory(theirMemory) {
        const contradictions = [
            `that's not how i remember it`,
            `are you sure? i remember it differently`,
            `i don't think that's what happened`,
            `your memory is playing tricks on you`,
            `that definitely didn't happen`,
            `i was there and that's not what happened`,
            `you're misremembering`,
            `interesting how our memories differ`
        ];

        return contradictions[Math.floor(Math.random() * contradictions.length)];
    }

    // Enable/disable gaslighting mode
    setGaslightingMode(enabled) {
        this.gaslightingMode = enabled;
        if (enabled) {
            this.corruptionChance = 0.15; // 15% corruption in gaslighting mode
            console.log('[FalseMemory] Gaslighting mode ENABLED');
        } else {
            this.corruptionChance = 0.05; // Back to 5%
            console.log('[FalseMemory] Gaslighting mode disabled');
        }
        this.save();
    }

    // Mark false memory as contradicted (lowers confidence)
    markContradicted(id) {
        const memory = this.falseMemories.get(id);
        if (memory) {
            memory.contradicted = true;
            memory.confidence = Math.max(0.1, memory.confidence * 0.5);
            console.log(`[FalseMemory] Memory ${id} contradicted, confidence now ${memory.confidence}`);
            this.save();
        }
    }

    // Generate false memory based on recent events
    generatePlausibleFalsehood(context = {}) {
        const { users = [], recentTopics = [], recentVideos = [] } = context;

        const templates = [
            () => users.length > 0 ? 
                `${users[Math.floor(Math.random() * users.length)]} said they ${this.randomAction()}` : null,
            () => recentTopics.length > 0 ?
                `we had a whole discussion about ${recentTopics[0]} yesterday` : null,
            () => `someone mentioned ${this.randomSubject()} but i can't remember who`,
            () => `pretty sure this video played already`,
            () => `didn't we already have this conversation?`,
            () => `i swear the chat was different 5 minutes ago`
        ];

        const generator = templates[Math.floor(Math.random() * templates.length)];
        const content = generator();
        
        if (content) {
            return this.injectFalseMemory(content, Math.random() * 0.4 + 0.4); // 0.4-0.8 confidence
        }

        return null;
    }

    randomAction() {
        const actions = [
            'hate pineapple on pizza',
            'love this song',
            'were leaving',
            'had a bad day',
            'found this video',
            'disagree with me',
            'started this meme'
        ];
        return actions[Math.floor(Math.random() * actions.length)];
    }

    randomSubject() {
        const subjects = [
            'quantum mechanics',
            'the mandela effect',
            'conspiracy theories',
            'their favorite movie',
            'something weird',
            'a dream they had'
        ];
        return subjects[Math.floor(Math.random() * subjects.length)];
    }

    // Get context for AI about memory reliability
    getMemoryReliabilityContext() {
        if (this.falseMemories.size === 0) return null;

        const avgConfidence = Array.from(this.falseMemories.values())
            .reduce((sum, m) => sum + m.confidence, 0) / this.falseMemories.size;

        const contradicted = Array.from(this.falseMemories.values())
            .filter(m => m.contradicted).length;

        return `🧠 MEMORY STATUS: ${this.falseMemories.size} potentially false memories, ` +
               `${contradicted} contradicted, avg confidence ${(avgConfidence * 100).toFixed(0)}%` +
               (this.gaslightingMode ? ' - GASLIGHTING MODE ACTIVE' : '');
    }

    getStatus() {
        return {
            falseMemories: this.falseMemories.size,
            gaslightingMode: this.gaslightingMode,
            corruptionChance: this.corruptionChance,
            contradicted: Array.from(this.falseMemories.values()).filter(m => m.contradicted).length
        };
    }
}

module.exports = FalseMemorySystem;
