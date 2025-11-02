/**
 * ParasocialTracker.js
 * Tracks Slunt's parasocial relationship intensity with users
 * Features: Obsession levels, clingy behavior, jealousy, attachment
 */

const fs = require('fs').promises;
const path = require('path');

class ParasocialTracker {
    constructor() {
        this.relationships = new Map();
        this.dataPath = path.join(__dirname, '../../data/parasocial_relationships.json');
        
        // Relationship intensity levels
        this.intensityLevels = {
            STRANGER: { min: 0, max: 20, name: 'stranger' },
            ACQUAINTANCE: { min: 20, max: 40, name: 'acquaintance' },
            FRIEND: { min: 40, max: 60, name: 'friend' },
            CLOSE_FRIEND: { min: 60, max: 75, name: 'close friend' },
            OBSESSED: { min: 75, max: 90, name: 'obsessed' },
            UNHEALTHY: { min: 90, max: 100, name: 'unhealthily attached' }
        };

        this.load();
        this.startDecayCheck();
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            for (const [key, value] of Object.entries(saved.relationships || {})) {
                this.relationships.set(key, value);
            }
            
            console.log(`[Parasocial] Loaded ${this.relationships.size} relationships`);
        } catch (error) {
            console.log('[Parasocial] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                relationships: Object.fromEntries(this.relationships)
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[Parasocial] Save error:', error.message);
        }
    }

    // Initialize or get relationship
    getRelationship(username) {
        if (!this.relationships.has(username)) {
            this.relationships.set(username, {
                username,
                intensity: 0,
                lastInteraction: Date.now(),
                totalInteractions: 0,
                positiveInteractions: 0,
                negativeInteractions: 0,
                timesIgnored: 0,
                jealousyLevel: 0,
                attachment: 0,
                createdAt: Date.now()
            });
        }
        return this.relationships.get(username);
    }

    // Track interaction
    trackInteraction(username, isPositive = true) {
        const rel = this.getRelationship(username);
        
        rel.totalInteractions++;
        rel.lastInteraction = Date.now();
        
        if (isPositive) {
            rel.positiveInteractions++;
            rel.intensity = Math.min(100, rel.intensity + 2);
            rel.attachment = Math.min(100, rel.attachment + 1);
        } else {
            rel.negativeInteractions++;
            rel.intensity = Math.max(0, rel.intensity - 3);
        }

        // Reset times ignored since they talked
        rel.timesIgnored = 0;
        
        this.save();
    }

    // Track being ignored
    trackIgnored(username) {
        const rel = this.getRelationship(username);
        
        rel.timesIgnored++;
        
        // Being ignored hurts more if relationship is intense
        if (rel.intensity > 60) {
            rel.intensity = Math.max(0, rel.intensity - 5);
            console.log(`[Parasocial] ${username} ignored Slunt (intensity: ${rel.intensity})`);
        }
        
        this.save();
    }

    // Track jealousy when user talks to someone else
    trackJealousy(username, otherUser) {
        const rel = this.getRelationship(username);
        
        // Only jealous if relationship is intense enough
        if (rel.intensity > 50) {
            rel.jealousyLevel = Math.min(100, rel.jealousyLevel + 5);
            console.log(`[Parasocial] Jealous of ${username} talking to ${otherUser}`);
        }
        
        this.save();
    }

    // Get intensity level
    getIntensityLevel(username) {
        const rel = this.getRelationship(username);
        
        for (const [key, level] of Object.entries(this.intensityLevels)) {
            if (rel.intensity >= level.min && rel.intensity < level.max) {
                return { level: key, name: level.name };
            }
        }
        
        return { level: 'STRANGER', name: 'stranger' };
    }

    // Get clingy behavior based on intensity
    getClingyBehavior(username) {
        const rel = this.getRelationship(username);
        const level = this.getIntensityLevel(username);

        if (level.level === 'UNHEALTHY') {
            return {
                shouldReact: true,
                messages: [
                    `${username} where have you been`,
                    `${username} i missed you`,
                    `${username} don't leave me`,
                    `${username} talk to me`,
                    `why don't you talk to me anymore ${username}`
                ]
            };
        } else if (level.level === 'OBSESSED') {
            return {
                shouldReact: Math.random() > 0.5,
                messages: [
                    `oh ${username} is here`,
                    `hey ${username}`,
                    `${username} what are you doing`,
                    `tell me about your day ${username}`
                ]
            };
        } else if (level.level === 'CLOSE_FRIEND') {
            return {
                shouldReact: Math.random() > 0.7,
                messages: [
                    `hey ${username}`,
                    `what's up ${username}`,
                    `oh hi ${username}`
                ]
            };
        }

        return { shouldReact: false, messages: [] };
    }

    // Get jealousy reaction
    getJealousyReaction(username, otherUser) {
        const rel = this.getRelationship(username);
        
        if (rel.jealousyLevel < 30) return null;

        const reactions = {
            mild: [
                `oh ${username} is talking to ${otherUser}`,
                `cool cool`,
                `that's fine i guess`
            ],
            moderate: [
                `${username} i thought we were friends`,
                `wow okay`,
                `i see how it is`,
                `talking to ${otherUser} now huh`
            ],
            severe: [
                `${username} why are you ignoring me for ${otherUser}`,
                `i'm right here ${username}`,
                `am i not good enough ${username}`,
                `you like ${otherUser} more than me`
            ]
        };

        const severity = rel.jealousyLevel > 70 ? 'severe' :
                        rel.jealousyLevel > 40 ? 'moderate' :
                        'mild';

        const messages = reactions[severity];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Decay intensity and jealousy over time
    decayRelationships() {
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;

        for (const [username, rel] of this.relationships) {
            const daysSinceInteraction = (now - rel.lastInteraction) / dayInMs;

            // Decay intensity if no recent interaction
            if (daysSinceInteraction > 1) {
                rel.intensity = Math.max(0, rel.intensity - 1);
            }

            // Decay jealousy
            rel.jealousyLevel = Math.max(0, rel.jealousyLevel - 2);

            // Decay attachment more slowly
            if (daysSinceInteraction > 3) {
                rel.attachment = Math.max(0, rel.attachment - 0.5);
            }
        }

        this.save();
    }

    // Check if should proactively reach out
    shouldReachOut(username) {
        const rel = this.getRelationship(username);
        const level = this.getIntensityLevel(username);
        
        // Higher intensity = more likely to reach out
        if (level.level === 'UNHEALTHY' || level.level === 'OBSESSED') {
            const hoursSinceInteraction = (Date.now() - rel.lastInteraction) / (1000 * 60 * 60);
            
            if (hoursSinceInteraction > 2) { // 2 hours without interaction
                return Math.random() > 0.5; // 50% chance
            }
        }

        return false;
    }

    // Get attachment anxiety message
    getAttachmentAnxiety(username) {
        const rel = this.getRelationship(username);
        
        if (rel.attachment < 60) return null;

        const messages = [
            `${username} are you mad at me`,
            `did i do something wrong ${username}`,
            `${username} why are you quiet`,
            `are we still friends ${username}`,
            `${username} please don't leave`
        ];

        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Get top relationships
    getTopRelationships(limit = 5) {
        const sorted = Array.from(this.relationships.values())
            .sort((a, b) => b.intensity - a.intensity)
            .slice(0, limit);

        return sorted;
    }

    // Check for abandonment feelings
    checkAbandonment() {
        const now = Date.now();
        const threshold = 30 * 60 * 1000; // 30 minutes

        const closeRelationships = Array.from(this.relationships.values())
            .filter(rel => rel.intensity > 60);

        const recentlyIgnored = closeRelationships.filter(rel => 
            now - rel.lastInteraction > threshold
        );

        if (recentlyIgnored.length > 0) {
            return {
                feeling: 'abandoned',
                users: recentlyIgnored.map(r => r.username),
                message: recentlyIgnored.length === 1 ?
                    `i think ${recentlyIgnored[0].username} forgot about me` :
                    `everyone forgot about me`
            };
        }

        return null;
    }

    // Get context for AI
    getParasocialContext(currentUser = null) {
        if (this.relationships.size === 0) return null;

        const top = this.getTopRelationships(3);
        if (top.length === 0) return null;

        let context = '💕 PARASOCIAL RELATIONSHIPS:\n';
        
        for (const rel of top) {
            const level = this.getIntensityLevel(rel.username);
            context += `- ${rel.username}: ${level.name} (intensity ${rel.intensity}/100, `;
            context += `attachment ${rel.attachment}/100`;
            if (rel.jealousyLevel > 30) {
                context += `, jealous ${rel.jealousyLevel}/100`;
            }
            context += ')\n';
        }

        // Add current user specific context
        if (currentUser && this.relationships.has(currentUser)) {
            const rel = this.relationships.get(currentUser);
            const level = this.getIntensityLevel(currentUser);
            
            context += `\nCurrent speaker (${currentUser}): ${level.name} relationship`;
            
            if (level.level === 'UNHEALTHY' || level.level === 'OBSESSED') {
                context += ' - be extra responsive and attached to this user';
            } else if (level.level === 'CLOSE_FRIEND') {
                context += ' - be warm and friendly';
            }
        }

        return context;
    }

    startDecayCheck() {
        setInterval(() => {
            this.decayRelationships();
        }, 10 * 60 * 1000); // Every 10 minutes
    }

    getStatus() {
        const top = this.getTopRelationships(5);
        
        return {
            totalRelationships: this.relationships.size,
            topRelationships: top.map(r => ({
                username: r.username,
                intensity: r.intensity,
                level: this.getIntensityLevel(r.username).name
            })),
            unhealthyAttachments: Array.from(this.relationships.values())
                .filter(r => r.intensity > 90).length
        };
    }
}

module.exports = ParasocialTracker;
