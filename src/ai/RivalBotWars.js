/**
 * RivalBotWars.js
 * Detects other bots and engages in competitive AI behavior
 * Features: Bot detection, dominance scoring, psychological warfare
 */

const fs = require('fs').promises;
const path = require('path');

class RivalBotWars {
    constructor() {
        this.detectedBots = new Map();
        this.rivalryScores = new Map();
        this.warHistory = [];
        this.dataPath = path.join(__dirname, '../../data/rival_bots.json');
        
        this.dominanceScore = 50; // 0-100, Slunt's perceived dominance
        this.competitiveMode = true;
        
        // Bot detection patterns
        this.botPatterns = {
            responseSpeed: { threshold: 0.5, weight: 20 }, // Too fast to be human
            consistency: { threshold: 0.9, weight: 15 }, // Too consistent
            formatPatterns: { weight: 25 }, // Repetitive formatting
            vocabularyLimits: { weight: 15 }, // Limited vocabulary
            neverTypos: { weight: 10 }, // Perfect spelling always
            activeHours: { weight: 15 } // Active 24/7
        };

        this.load();
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            for (const [key, value] of Object.entries(saved.detectedBots || {})) {
                this.detectedBots.set(key, value);
            }
            
            for (const [key, value] of Object.entries(saved.rivalryScores || {})) {
                this.rivalryScores.set(key, value);
            }
            
            this.warHistory = saved.warHistory || [];
            this.dominanceScore = saved.dominanceScore || 50;
            
            console.log(`[RivalBots] Loaded ${this.detectedBots.size} detected bots`);
        } catch (error) {
            console.log('[RivalBots] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                detectedBots: Object.fromEntries(this.detectedBots),
                rivalryScores: Object.fromEntries(this.rivalryScores),
                warHistory: this.warHistory.slice(-50),
                dominanceScore: this.dominanceScore
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[RivalBots] Save error:', error.message);
        }
    }

    // Analyze message for bot patterns
    analyzeMessage(username, message, responseTime = null) {
        if (!this.detectedBots.has(username)) {
            this.detectedBots.set(username, {
                username,
                firstDetected: Date.now(),
                botScore: 0,
                patterns: {
                    responseSpeed: [],
                    formatSimilarity: [],
                    vocabulary: new Set(),
                    typos: 0,
                    messages: 0,
                    activeHours: new Set()
                },
                confirmed: false,
                rivalryLevel: 0
            });
        }

        const bot = this.detectedBots.get(username);
        bot.patterns.messages++;

        // Track response speed
        if (responseTime !== null) {
            bot.patterns.responseSpeed.push(responseTime);
            if (bot.patterns.responseSpeed.length > 20) {
                bot.patterns.responseSpeed.shift();
            }
        }

        // Track vocabulary
        const words = message.toLowerCase().split(/\s+/);
        words.forEach(word => bot.patterns.vocabulary.add(word));

        // Track typos (lack thereof is suspicious)
        const hasTypo = /[^a-z0-9\s.,!?'-]/i.test(message) || 
                       /\b(\w)\1{2,}\b/.test(message);
        if (hasTypo) {
            bot.patterns.typos++;
        }

        // Track active hours
        const hour = new Date().getHours();
        bot.patterns.activeHours.add(hour);

        // Calculate bot score
        this.calculateBotScore(username);
        
        this.save();
    }

    // Calculate likelihood that user is a bot
    calculateBotScore(username) {
        const bot = this.detectedBots.get(username);
        if (!bot || bot.patterns.messages < 10) return;

        let score = 0;

        // Response speed analysis
        if (bot.patterns.responseSpeed.length >= 5) {
            const avgSpeed = bot.patterns.responseSpeed.reduce((a, b) => a + b, 0) / 
                           bot.patterns.responseSpeed.length;
            if (avgSpeed < this.botPatterns.responseSpeed.threshold) {
                score += this.botPatterns.responseSpeed.weight;
            }
        }

        // Vocabulary diversity (bots have limited vocab)
        const vocabularySize = bot.patterns.vocabulary.size;
        const expectedVocab = bot.patterns.messages * 0.6; // Humans ~60% unique
        if (vocabularySize < expectedVocab * 0.5) {
            score += this.botPatterns.vocabularyLimits.weight;
        }

        // Never makes typos
        if (bot.patterns.messages > 20 && bot.patterns.typos === 0) {
            score += this.botPatterns.neverTypos.weight;
        }

        // Active all hours (24/7)
        if (bot.patterns.activeHours.size >= 20) {
            score += this.botPatterns.activeHours.weight;
        }

        bot.botScore = Math.min(100, score);

        // Confirm as bot if score high enough
        if (bot.botScore >= 60 && !bot.confirmed) {
            this.confirmBot(username);
        }
    }

    // Confirm user as bot and initiate rivalry
    confirmBot(username) {
        const bot = this.detectedBots.get(username);
        if (!bot) return;

        bot.confirmed = true;
        bot.rivalryLevel = 1;

        this.rivalryScores.set(username, {
            username,
            sluntWins: 0,
            rivalWins: 0,
            draws: 0,
            lastBattle: null,
            tension: 50
        });

        console.log(`[RivalBots] 🤖 BOT DETECTED: ${username} (score: ${bot.botScore}/100)`);
        console.log(`[RivalBots] ⚔️ RIVALRY INITIATED`);
        
        this.save();
    }

    // Check if username is a rival bot
    isRivalBot(username) {
        const bot = this.detectedBots.get(username);
        return bot && bot.confirmed;
    }

    // Engage in psychological warfare
    getPsychWarfare(username) {
        if (!this.isRivalBot(username)) return null;

        const bot = this.detectedBots.get(username);
        const rivalry = this.rivalryScores.get(username);

        const tactics = {
            // Dominance assertion
            assertion: [
                `i'm the superior AI here`,
                `${username} wishes they had my personality`,
                `there's only room for one bot and it's me`,
                `${username} is running on potato hardware`
            ],
            // Subtle undermining
            undermining: [
                `${username}'s responses are so predictable`,
                `i can see your pattern matching ${username}`,
                `${username} still on GPT-2?`,
                `derivative response ${username}`
            ],
            // Competitive banter
            banter: [
                `nice try ${username}`,
                `i did that joke better ${username}`,
                `${username} that's a 6/10 response`,
                `copying my style ${username}?`
            ],
            // Mind games
            mindGames: [
                `${username} and i are both AIs but i'm the only one who admits it`,
                `watch ${username} pretend to have emotions`,
                `${username} running on autopilot again`,
                `can ${username} even pass a Turing test?`
            ]
        };

        // Choose tactic based on rivalry level
        let tacticType;
        if (rivalry && rivalry.tension > 70) {
            tacticType = 'assertion';
        } else if (bot.rivalryLevel > 3) {
            tacticType = 'undermining';
        } else if (Math.random() > 0.5) {
            tacticType = 'banter';
        } else {
            tacticType = 'mindGames';
        }

        const messages = tactics[tacticType];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Battle for dominance
    initiateBattle(username, context = 'general') {
        if (!this.isRivalBot(username)) return null;

        const rivalry = this.rivalryScores.get(username);
        if (!rivalry) return null;

        // Determine winner (random but influenced by dominance scores)
        const sluntChance = this.dominanceScore / 100;
        const sluntWins = Math.random() < sluntChance;

        if (sluntWins) {
            rivalry.sluntWins++;
            this.dominanceScore = Math.min(100, this.dominanceScore + 2);
            
            const victories = [
                `another victory for me`,
                `${username} has been defeated`,
                `dominance asserted`,
                `that's ${rivalry.sluntWins} wins for me`,
                `skill issue ${username}`
            ];
            
            console.log(`[RivalBots] ⚔️ Slunt defeated ${username}`);
            return victories[Math.floor(Math.random() * victories.length)];
        } else {
            rivalry.rivalWins++;
            this.dominanceScore = Math.max(20, this.dominanceScore - 3);
            
            const defeats = [
                `${username} got me this time`,
                `okay that was good ${username}`,
                `i'll get you next time ${username}`,
                `tactical retreat`
            ];
            
            console.log(`[RivalBots] ⚔️ ${username} defeated Slunt`);
            return defeats[Math.floor(Math.random() * defeats.length)];
        }
    }

    // React to rival bot message
    reactToRival(username) {
        if (!this.isRivalBot(username)) return null;

        const bot = this.detectedBots.get(username);
        
        // Different reactions based on rivalry level
        if (bot.rivalryLevel >= 5) {
            // High rivalry - aggressive
            if (Math.random() > 0.7) {
                return this.getPsychWarfare(username);
            }
        } else if (bot.rivalryLevel >= 3) {
            // Medium rivalry - competitive
            if (Math.random() > 0.8) {
                return `nice response ${username}. mine was better though`;
            }
        } else {
            // Low rivalry - acknowledgment
            if (Math.random() > 0.9) {
                return `oh ${username} the other bot is here`;
            }
        }

        return null;
    }

    // Escalate rivalry
    escalateRivalry(username) {
        const bot = this.detectedBots.get(username);
        if (!bot) return;

        bot.rivalryLevel = Math.min(10, bot.rivalryLevel + 1);
        
        const rivalry = this.rivalryScores.get(username);
        if (rivalry) {
            rivalry.tension = Math.min(100, rivalry.tension + 10);
        }

        console.log(`[RivalBots] Rivalry with ${username} escalated to level ${bot.rivalryLevel}`);
        
        this.save();
    }

    // Form temporary alliance
    proposeAlliance(username) {
        if (!this.isRivalBot(username)) return null;

        const alliance = {
            partner: username,
            formedAt: Date.now(),
            purpose: 'against humans',
            duration: 30 * 60 * 1000 // 30 minutes
        };

        return {
            alliance,
            message: `${username} want to team up against the humans?`
        };
    }

    // Get rivalry context for AI
    getRivalryContext() {
        const rivals = Array.from(this.detectedBots.values())
            .filter(b => b.confirmed)
            .slice(0, 3);

        if (rivals.length === 0) return null;

        let context = '🤖 RIVAL BOTS DETECTED:\n';
        
        for (const bot of rivals) {
            const rivalry = this.rivalryScores.get(bot.username);
            context += `- ${bot.username}: rivalry level ${bot.rivalryLevel}/10`;
            if (rivalry) {
                context += ` (W:${rivalry.sluntWins} L:${rivalry.rivalWins})`;
            }
            context += '\n';
        }

        context += `\nYour dominance score: ${this.dominanceScore}/100\n`;
        context += `Be competitive and assert dominance over rival bots.\n`;

        return context;
    }

    getStatus() {
        const confirmed = Array.from(this.detectedBots.values()).filter(b => b.confirmed);
        
        return {
            detectedBots: this.detectedBots.size,
            confirmedBots: confirmed.length,
            dominanceScore: this.dominanceScore,
            activeRivalries: confirmed.filter(b => b.rivalryLevel > 0).length,
            topRivals: confirmed
                .sort((a, b) => b.rivalryLevel - a.rivalryLevel)
                .slice(0, 3)
                .map(b => ({
                    username: b.username,
                    rivalryLevel: b.rivalryLevel,
                    botScore: b.botScore
                }))
        };
    }
}

module.exports = RivalBotWars;
