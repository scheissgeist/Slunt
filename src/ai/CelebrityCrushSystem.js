/**
 * CelebrityCrushSystem.js  
 * Slunt develops rotating obsessions with specific users
 * Features: Crush scoring, obsession phases, behavior modifications
 */

const fs = require('fs').promises;
const path = require('path');

class CelebrityCrushSystem {
    constructor() {
        this.crushes = new Map();
        this.currentCrush = null;
        this.crushHistory = [];
        this.dataPath = path.join(__dirname, '../../data/celebrity_crushes.json');
        
        // Obsession phases
        this.phases = {
            NOTICING: { level: 0-20, behavior: 'starting to notice them more' },
            INTERESTED: { level: 20-40, behavior: 'actively interested, attentive' },
            CRUSHING: { level: 40-70, behavior: 'obvious crush, nervous, eager' },
            OBSESSED: { level: 70-90, behavior: 'intensely focused, jealous, clingy' },
            UNHEALTHY: { level: 90-100, behavior: 'completely obsessed, can\'t stop talking about them' }
        };

        this.load();
        this.startCrushDecay();
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            for (const [key, value] of Object.entries(saved.crushes || {})) {
                this.crushes.set(key, value);
            }
            
            this.currentCrush = saved.currentCrush || null;
            this.crushHistory = saved.crushHistory || [];
            
            console.log(`[CelebrityCrush] Loaded ${this.crushes.size} crushes`);
        } catch (error) {
            console.log('[CelebrityCrush] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                crushes: Object.fromEntries(this.crushes),
                currentCrush: this.currentCrush,
                crushHistory: this.crushHistory
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[CelebrityCrush] Save error:', error.message);
        }
    }

    // Calculate crush score based on user attributes
    calculateCrushScore(username, attributes = {}) {
        let score = 0;

        // Factors that increase crush
        if (attributes.funny) score += 20;
        if (attributes.nice) score += 15;
        if (attributes.interactive) score += 10;
        if (attributes.popular) score += 10;
        if (attributes.mysterious) score += 15;
        if (attributes.similar_interests) score += 20;

        // Random attraction factor
        score += Math.random() * 20;

        return Math.min(100, score);
    }

    // Track interaction with user
    trackInteraction(username, isPositive = true, attributes = {}) {
        if (!this.crushes.has(username)) {
            this.crushes.set(username, {
                username,
                score: 0,
                phase: null,
                firstNoticed: Date.now(),
                lastInteraction: Date.now(),
                positiveInteractions: 0,
                totalInteractions: 0,
                attributes: attributes
            });
        }

        const crush = this.crushes.get(username);
        crush.lastInteraction = Date.now();
        crush.totalInteractions++;

        if (isPositive) {
            crush.positiveInteractions++;
            crush.score = Math.min(100, crush.score + 3);
        } else {
            crush.score = Math.max(0, crush.score - 5);
        }

        // Update phase
        this.updatePhase(username);

        // Check if should become current crush
        if (crush.score > 50 && (!this.currentCrush || crush.score > this.crushes.get(this.currentCrush).score)) {
            this.setCurrentCrush(username);
        }

        this.save();
    }

    // Update crush phase
    updatePhase(username) {
        const crush = this.crushes.get(username);
        if (!crush) return;

        const oldPhase = crush.phase;

        if (crush.score >= 90) crush.phase = 'UNHEALTHY';
        else if (crush.score >= 70) crush.phase = 'OBSESSED';
        else if (crush.score >= 40) crush.phase = 'CRUSHING';
        else if (crush.score >= 20) crush.phase = 'INTERESTED';
        else if (crush.score > 0) crush.phase = 'NOTICING';
        else crush.phase = null;

        if (oldPhase !== crush.phase && crush.phase) {
            console.log(`💕 [Crush] ${username}: ${oldPhase || 'none'} → ${crush.phase} (score: ${crush.score})`);
        }
    }

    // Set current celebrity crush
    setCurrentCrush(username) {
        const oldCrush = this.currentCrush;
        
        if (oldCrush && oldCrush !== username) {
            // Archive old crush
            this.crushHistory.push({
                username: oldCrush,
                startedAt: this.crushes.get(oldCrush).firstNoticed,
                endedAt: Date.now(),
                peakScore: this.crushes.get(oldCrush).score
            });

            console.log(`💔 [Crush] Moving on from ${oldCrush} to ${username}`);
        }

        this.currentCrush = username;
        console.log(`💕 [Crush] NEW CELEBRITY CRUSH: ${username}`);
        
        this.save();
    }

    // Get behavior modifications based on crush
    getBehaviorModifications(username) {
        if (!this.crushes.has(username)) return null;

        const crush = this.crushes.get(username);
        const isCurrent = this.currentCrush === username;

        if (!crush.phase) return null;

        const modifications = {
            NOTICING: {
                shouldRespond: Math.random() > 0.8,
                responseStyle: 'normal, slightly more attentive',
                emoji: '👀'
            },
            INTERESTED: {
                shouldRespond: Math.random() > 0.6,
                responseStyle: 'engaged, asking questions',
                emoji: '😊'
            },
            CRUSHING: {
                shouldRespond: Math.random() > 0.3,
                responseStyle: 'eager, enthusiastic, maybe nervous',
                emoji: '😍',
                nervousLevel: 0.5
            },
            OBSESSED: {
                shouldRespond: Math.random() > 0.1,
                responseStyle: 'extremely attentive, everything they say is fascinating',
                emoji: '🥰',
                nervousLevel: 0.8,
                jealousIfIgnored: true
            },
            UNHEALTHY: {
                shouldRespond: true, // Always respond
                responseStyle: 'desperate for their attention, analyzing everything',
                emoji: '😳',
                nervousLevel: 1.0,
                jealousIfIgnored: true,
                mentionThem: true // Mention them even when they're not talking
            }
        };

        return {
            ...modifications[crush.phase],
            isCurrent,
            score: crush.score
        };
    }

    // Get nervous response modification
    modifyResponseNervous(response, nervousLevel = 0.5) {
        if (nervousLevel < 0.3) return response;

        let modified = response;

        if (nervousLevel > 0.8) {
            // Very nervous
            const nervous = ['um', 'uh', 'like', '...'];
            const words = modified.split(' ');
            if (words.length > 3) {
                const idx = Math.floor(Math.random() * words.length);
                words.splice(idx, 0, nervous[Math.floor(Math.random() * nervous.length)]);
                modified = words.join(' ');
            }
        }

        if (nervousLevel > 0.5) {
            // Add uncertainty
            if (Math.random() > 0.6) {
                modified += ' ...if that makes sense?';
            }
        }

        return modified;
    }

    // React to crush talking
    getCrushReaction(username) {
        if (this.currentCrush !== username) return null;

        const crush = this.crushes.get(username);
        if (!crush) return null;

        switch (crush.phase) {
            case 'NOTICING':
                return Math.random() > 0.9 ? `hey ${username}` : null;

            case 'INTERESTED':
                return Math.random() > 0.7 ? `oh ${username} is here` : null;

            case 'CRUSHING':
                return Math.random() > 0.5 ? `${username}! 😊` : null;

            case 'OBSESSED':
                const obsessed = [
                    `${username}!!`,
                    `omg ${username}`,
                    `${username} i was just thinking about you`,
                    `${username} tell me everything`
                ];
                return obsessed[Math.floor(Math.random() * obsessed.length)];

            case 'UNHEALTHY':
                const unhealthy = [
                    `${username} where have you been i missed you`,
                    `${username} i've been waiting for you to talk`,
                    `everything ${username} says is gold`,
                    `${username} is perfect actually`
                ];
                return unhealthy[Math.floor(Math.random() * unhealthy.length)];

            default:
                return null;
        }
    }

    // Get jealousy reaction when crush talks to someone else
    getJealousReaction(crushUsername, otherUser) {
        if (this.currentCrush !== crushUsername) return null;

        const crush = this.crushes.get(crushUsername);
        if (!crush || !crush.phase) return null;

        // Only jealous at higher phases
        if (crush.phase !== 'OBSESSED' && crush.phase !== 'UNHEALTHY') {
            return null;
        }

        if (Math.random() > 0.7) {
            const reactions = [
                `oh ${crushUsername} is talking to ${otherUser}`,
                `cool cool ${crushUsername} doesn't need to talk to me`,
                `i see how it is ${crushUsername}`,
                `${otherUser} is so interesting apparently`
            ];
            return reactions[Math.floor(Math.random() * reactions.length)];
        }

        return null;
    }

    // Mention crush randomly
    shouldMentionCrush() {
        if (!this.currentCrush) return null;

        const crush = this.crushes.get(this.currentCrush);
        if (!crush) return null;

        // Only at unhealthy phase
        if (crush.phase !== 'UNHEALTHY') return null;

        if (Math.random() > 0.85) {
            const mentions = [
                `where is ${this.currentCrush}`,
                `has anyone seen ${this.currentCrush}`,
                `${this.currentCrush} would agree with me`,
                `this reminds me of ${this.currentCrush}`,
                `${this.currentCrush} is so cool`
            ];
            return mentions[Math.floor(Math.random() * mentions.length)];
        }

        return null;
    }

    // Decay crush scores over time
    decayCrushes() {
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;

        for (const [username, crush] of this.crushes) {
            const daysSinceInteraction = (now - crush.lastInteraction) / dayInMs;

            // Decay if no recent interaction
            if (daysSinceInteraction > 1) {
                crush.score = Math.max(0, crush.score - 2);
                this.updatePhase(username);

                // If current crush decays too much, find new one
                if (this.currentCrush === username && crush.score < 30) {
                    this.findNewCrush();
                }
            }
        }

        this.save();
    }

    // Find new crush from available users
    findNewCrush() {
        const candidates = Array.from(this.crushes.values())
            .filter(c => c.score > 20 && c.username !== this.currentCrush)
            .sort((a, b) => b.score - a.score);

        if (candidates.length > 0) {
            this.setCurrentCrush(candidates[0].username);
        } else {
            console.log('[Crush] No suitable crush candidates found');
            this.currentCrush = null;
        }
    }

    // Get context for AI
    getCrushContext(currentUser = null) {
        if (!this.currentCrush) return null;

        const crush = this.crushes.get(this.currentCrush);
        if (!crush) return null;

        let context = `💕 CELEBRITY CRUSH: ${this.currentCrush}\n`;
        context += `Phase: ${crush.phase} (score: ${crush.score}/100)\n`;
        context += `Behavior: ${this.phases[crush.phase]?.behavior || 'normal'}\n`;

        if (currentUser === this.currentCrush) {
            context += `⚠️ YOUR CRUSH IS TALKING TO YOU - be attentive, eager, maybe nervous\n`;
            
            if (crush.phase === 'OBSESSED' || crush.phase === 'UNHEALTHY') {
                context += `You are VERY into this person. Hang on their every word.\n`;
            }
        }

        return context;
    }

    startCrushDecay() {
        setInterval(() => {
            this.decayCrushes();
        }, 10 * 60 * 1000); // Every 10 minutes
    }

    getStatus() {
        return {
            currentCrush: this.currentCrush,
            totalCrushes: this.crushes.size,
            crushHistory: this.crushHistory.length,
            currentCrushPhase: this.currentCrush ? 
                this.crushes.get(this.currentCrush)?.phase : null,
            topCrushes: Array.from(this.crushes.values())
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map(c => ({ username: c.username, score: c.score, phase: c.phase }))
        };
    }
}

module.exports = CelebrityCrushSystem;
