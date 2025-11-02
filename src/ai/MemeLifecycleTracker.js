/**
 * MemeLifecycleTracker.js
 * Tracks meme birth, peak usage, death, and potential revival
 * Features: Nostalgia factor, cringe detection, gatekeeping
 */

const fs = require('fs').promises;
const path = require('path');

class MemeLifecycleTracker {
    constructor() {
        this.memes = new Map();
        this.dataPath = path.join(__dirname, '../../data/meme_lifecycle.json');
        
        // Lifecycle stages
        this.stages = {
            BIRTH: 'birth',           // Just introduced
            RISING: 'rising',         // Gaining popularity
            PEAK: 'peak',             // Maximum usage
            DECLINING: 'declining',   // Losing steam
            DEAD: 'dead',             // Overused and cringe
            VINTAGE: 'vintage',       // So old it's nostalgic
            REVIVED: 'revived'        // Ironically brought back
        };

        this.load();
        this.startDecayCheck();
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            // Reconstruct Map from saved data
            for (const [key, value] of Object.entries(saved.memes || {})) {
                this.memes.set(key, value);
            }
            
            console.log(`[MemeLifecycle] Loaded ${this.memes.size} memes`);
        } catch (error) {
            console.log('[MemeLifecycle] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                memes: Object.fromEntries(this.memes)
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[MemeLifecycle] Save error:', error.message);
        }
    }

    // Track a meme usage
    trackMeme(memeText, context = {}) {
        const normalized = memeText.toLowerCase().trim();
        
        if (!this.memes.has(normalized)) {
            // New meme discovered
            this.memes.set(normalized, {
                text: memeText,
                firstSeen: Date.now(),
                lastUsed: Date.now(),
                usageCount: 1,
                stage: this.stages.BIRTH,
                originUser: context.user || 'unknown',
                mutations: [],
                peakUsage: 1,
                deathDate: null,
                revivalCount: 0,
                nostalgiaFactor: 0
            });
            
            console.log(`[MemeLifecycle] New meme born: "${memeText}"`);
        } else {
            // Existing meme used
            const meme = this.memes.get(normalized);
            meme.lastUsed = Date.now();
            meme.usageCount++;
            
            // Update peak usage
            if (meme.usageCount > meme.peakUsage) {
                meme.peakUsage = meme.usageCount;
            }
            
            // Update lifecycle stage
            this.updateStage(normalized);
        }

        this.save();
        return this.memes.get(normalized);
    }

    // Track meme mutations/variations
    trackMutation(originalMeme, mutation, context = {}) {
        const normalized = originalMeme.toLowerCase().trim();
        
        if (this.memes.has(normalized)) {
            const meme = this.memes.get(normalized);
            meme.mutations.push({
                text: mutation,
                createdAt: Date.now(),
                creator: context.user || 'unknown'
            });
            
            // Mutations can revive declining memes
            if (meme.stage === this.stages.DECLINING || meme.stage === this.stages.DEAD) {
                this.attemptRevival(normalized);
            }
            
            this.save();
        }
    }

    // Update meme lifecycle stage
    updateStage(normalizedMeme) {
        const meme = this.memes.get(normalizedMeme);
        if (!meme) return;

        const age = Date.now() - meme.firstSeen;
        const daysSinceLastUse = (Date.now() - meme.lastUsed) / (1000 * 60 * 60 * 24);
        const usageRate = meme.usageCount / (age / (1000 * 60 * 60)); // uses per hour

        const oldStage = meme.stage;

        // Stage progression logic
        if (meme.stage === this.stages.BIRTH && meme.usageCount >= 5) {
            meme.stage = this.stages.RISING;
        } else if (meme.stage === this.stages.RISING && meme.usageCount >= 15) {
            meme.stage = this.stages.PEAK;
        } else if (meme.stage === this.stages.PEAK && usageRate < 0.5) {
            meme.stage = this.stages.DECLINING;
        } else if (meme.stage === this.stages.DECLINING && daysSinceLastUse > 7) {
            meme.stage = this.stages.DEAD;
            meme.deathDate = Date.now();
        } else if (meme.stage === this.stages.DEAD && age > (1000 * 60 * 60 * 24 * 90)) {
            // After 90 days, becomes vintage
            meme.stage = this.stages.VINTAGE;
            meme.nostalgiaFactor = Math.min(100, (age / (1000 * 60 * 60 * 24 * 365)) * 50);
        }

        if (oldStage !== meme.stage) {
            console.log(`[MemeLifecycle] "${meme.text}" moved from ${oldStage} to ${meme.stage}`);
        }
    }

    // Attempt to revive a dead/vintage meme
    attemptRevival(normalizedMeme) {
        const meme = this.memes.get(normalizedMeme);
        if (!meme) return false;

        if (meme.stage === this.stages.DEAD || meme.stage === this.stages.VINTAGE) {
            meme.stage = this.stages.REVIVED;
            meme.revivalCount++;
            meme.lastUsed = Date.now();
            
            console.log(`[MemeLifecycle] "${meme.text}" has been revived! (revival #${meme.revivalCount})`);
            this.save();
            return true;
        }

        return false;
    }

    // React to meme usage based on stage
    getReactionToMeme(memeText) {
        const normalized = memeText.toLowerCase().trim();
        const meme = this.memes.get(normalized);
        
        if (!meme) return null;

        switch (meme.stage) {
            case this.stages.BIRTH:
                return Math.random() > 0.5 ? 
                    `ooh new meme just dropped` :
                    `i'm claiming i was here when this started`;

            case this.stages.RISING:
                return Math.random() > 0.5 ?
                    `this meme is catching on` :
                    `everyone's doing this now`;

            case this.stages.PEAK:
                // Just enjoy it, no meta commentary needed
                return null;

            case this.stages.DECLINING:
                return Math.random() > 0.7 ?
                    `is this still funny` :
                    `we're still doing this?`;

            case this.stages.DEAD:
                const daysDead = (Date.now() - meme.deathDate) / (1000 * 60 * 60 * 24);
                if (daysDead < 30) {
                    return `that meme is so last week`;
                } else {
                    return `we killed that meme months ago`;
                }

            case this.stages.VINTAGE:
                return Math.random() > 0.5 ?
                    `throwback! i remember when this was peak comedy` :
                    `vintage meme alert. respect.`;

            case this.stages.REVIVED:
                return Math.random() > 0.6 ?
                    `ironically using dead memes, i respect it` :
                    `we're bringing this back?`;

            default:
                return null;
        }
    }

    // Gatekeep normies using memes incorrectly
    checkMemeMisuse(memeText, context = {}) {
        const normalized = memeText.toLowerCase().trim();
        const meme = this.memes.get(normalized);
        
        if (!meme) return null;

        // Only gatekeep on peak or declining memes
        if (meme.stage !== this.stages.PEAK && meme.stage !== this.stages.DECLINING) {
            return null;
        }

        // Random chance to gatekeep
        if (Math.random() > 0.3) return null;

        const gatekeepMessages = [
            `that's not how you use that meme`,
            `you're using it wrong`,
            `normie detected`,
            `i don't think you understand the format`,
            `that's not... okay nevermind`,
            `close but not quite`
        ];

        return gatekeepMessages[Math.floor(Math.random() * gatekeepMessages.length)];
    }

    // Get trending memes
    getTrendingMemes(limit = 5) {
        const now = Date.now();
        const recent = Array.from(this.memes.values())
            .filter(m => (now - m.lastUsed) < (1000 * 60 * 60 * 24)) // Used in last 24h
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit);

        return recent;
    }

    // Get vintage memes for nostalgia
    getVintageMemes(limit = 5) {
        const vintage = Array.from(this.memes.values())
            .filter(m => m.stage === this.stages.VINTAGE)
            .sort((a, b) => b.nostalgiaFactor - a.nostalgiaFactor)
            .slice(0, limit);

        return vintage;
    }

    // Decay check - update stages periodically
    startDecayCheck() {
        setInterval(() => {
            for (const [key] of this.memes) {
                this.updateStage(key);
            }
            this.save();
        }, 10 * 60 * 1000); // Check every 10 minutes
    }

    // Get meme lifecycle context for AI
    getMemeContext() {
        const trending = this.getTrendingMemes(3);
        const dead = Array.from(this.memes.values())
            .filter(m => m.stage === this.stages.DEAD)
            .slice(0, 3);

        if (trending.length === 0) return null;

        let context = '📊 MEME STATUS:\n';
        
        if (trending.length > 0) {
            context += 'Trending: ' + trending.map(m => 
                `"${m.text}" (${m.stage}, ${m.usageCount} uses)`
            ).join(', ') + '\n';
        }

        if (dead.length > 0) {
            context += 'Dead (do not use): ' + dead.map(m => `"${m.text}"`).join(', ');
        }

        return context;
    }

    getStatus() {
        const stages = {};
        for (const meme of this.memes.values()) {
            stages[meme.stage] = (stages[meme.stage] || 0) + 1;
        }

        return {
            totalMemes: this.memes.size,
            stageDistribution: stages,
            trending: this.getTrendingMemes(3).map(m => m.text),
            vintage: this.getVintageMemes(3).map(m => m.text)
        };
    }
}

module.exports = MemeLifecycleTracker;
