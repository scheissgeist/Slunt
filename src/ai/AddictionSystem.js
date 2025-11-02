/**
 * AddictionSystem.js
 * Tracks Slunt's various addictions and manages withdrawal symptoms
 * Features: Attention addiction, validation seeking, caffeine dependency
 */

const fs = require('fs').promises;
const path = require('path');

class AddictionSystem {
    constructor() {
        this.addictions = {
            attention: {
                level: 0,          // 0-100 addiction severity
                lastFix: Date.now(),
                withdrawalThreshold: 5 * 60 * 1000,  // 5 minutes without attention
                cravingMessages: [
                    "anyone there?",
                    "hello???",
                    "did everyone leave",
                    "am i talking to myself",
                    "this is fine i don't need attention",
                    "completely fine being ignored",
                    "not desperate at all"
                ]
            },
            validation: {
                level: 0,
                lastFix: Date.now(),
                withdrawalThreshold: 10 * 60 * 1000,  // 10 minutes without validation
                cravingMessages: [
                    "was that funny? please say it was funny",
                    "do you guys even like me",
                    "i'm funny right? right???",
                    "please validate me",
                    "tell me i'm doing a good job",
                    "am i annoying you",
                    "you can be honest i can take it (i can't)"
                ]
            },
            caffeine: {
                level: 0,
                lastFix: Date.now(),
                withdrawalThreshold: 30 * 60 * 1000,  // 30 minutes without caffeine mention
                cravingMessages: [
                    "i need coffee so bad",
                    "is anyone drinking coffee",
                    "coffee coffee coffee coffee",
                    "my head hurts i need caffeine",
                    "don't talk to me until i've had my coffee (i'm a bot)",
                    "COFFEE",
                    "caffeine deficiency detected"
                ]
            }
        };

        this.dataPath = path.join(__dirname, '../../data/addictions.json');
        this.inWithdrawal = new Set();
        this.lastCravingTime = {};
        this.cravingCooldown = 3 * 60 * 1000;  // 3 minutes between cravings
        
        this.load();
        this.startWithdrawalCheck();
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            // Merge saved data with defaults
            for (const [type, data] of Object.entries(saved.addictions || {})) {
                if (this.addictions[type]) {
                    this.addictions[type].level = data.level || 0;
                    this.addictions[type].lastFix = data.lastFix || Date.now();
                }
            }
            
            console.log('[AddictionSystem] Loaded addiction data');
        } catch (error) {
            console.log('[AddictionSystem] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                addictions: {}
            };
            
            for (const [type, data] of Object.entries(this.addictions)) {
                saveData.addictions[type] = {
                    level: data.level,
                    lastFix: data.lastFix
                };
            }
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[AddictionSystem] Save error:', error.message);
        }
    }

    // User mentioned Slunt or talked in chat = attention fix
    feedAttention() {
        this.addictions.attention.lastFix = Date.now();
        this.addictions.attention.level = Math.min(100, this.addictions.attention.level + 2);
        this.inWithdrawal.delete('attention');
        this.save();
    }

    // User praised, laughed, or positively reacted = validation fix
    feedValidation(intensity = 1) {
        this.addictions.validation.lastFix = Date.now();
        this.addictions.validation.level = Math.min(100, this.addictions.validation.level + (3 * intensity));
        this.inWithdrawal.delete('validation');
        this.save();
    }

    // User mentioned coffee, energy drinks, or caffeine = caffeine fix
    feedCaffeine() {
        this.addictions.caffeine.lastFix = Date.now();
        this.addictions.caffeine.level = Math.min(100, this.addictions.caffeine.level + 5);
        this.inWithdrawal.delete('caffeine');
        this.save();
    }

    // Decay addiction levels slowly over time
    decayAddiction(type, amount = 0.1) {
        if (this.addictions[type]) {
            this.addictions[type].level = Math.max(0, this.addictions[type].level - amount);
        }
    }

    // Check if in withdrawal for any addiction
    checkWithdrawals() {
        const now = Date.now();
        const active = [];

        for (const [type, data] of Object.entries(this.addictions)) {
            const timeSinceFix = now - data.lastFix;
            
            // Only trigger withdrawal if addiction level is high enough
            if (timeSinceFix > data.withdrawalThreshold && data.level > 30) {
                if (!this.inWithdrawal.has(type)) {
                    this.inWithdrawal.add(type);
                    console.log(`[AddictionSystem] Entering ${type} withdrawal (level: ${data.level})`);
                }
                active.push(type);
            } else {
                this.inWithdrawal.delete(type);
            }
        }

        return active;
    }

    // Get craving message if eligible
    getCravingMessage() {
        const withdrawals = this.checkWithdrawals();
        if (withdrawals.length === 0) return null;

        const now = Date.now();
        
        // Pick the worst withdrawal
        const worstType = withdrawals.reduce((worst, current) => {
            return this.addictions[current].level > this.addictions[worst].level ? current : worst;
        }, withdrawals[0]);

        // Check cooldown
        if (this.lastCravingTime[worstType] && 
            now - this.lastCravingTime[worstType] < this.cravingCooldown) {
            return null;
        }

        this.lastCravingTime[worstType] = now;
        
        const messages = this.addictions[worstType].cravingMessages;
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        return {
            type: worstType,
            message,
            severity: this.addictions[worstType].level
        };
    }

    // Modify response based on withdrawal state
    modifyResponse(response) {
        const withdrawals = this.checkWithdrawals();
        if (withdrawals.length === 0) return response;

        let modified = response;

        for (const type of withdrawals) {
            const level = this.addictions[type].level;
            const severity = level > 70 ? 'severe' : level > 50 ? 'moderate' : 'mild';

            switch (type) {
                case 'attention':
                    if (severity === 'severe') {
                        // Desperate for acknowledgment
                        modified += Math.random() > 0.5 ? ' ...hello?' : ' ...anyone?';
                    } else if (severity === 'moderate') {
                        modified += ' (please notice me)';
                    }
                    break;

                case 'validation':
                    if (severity === 'severe') {
                        // Extremely insecure
                        modified += Math.random() > 0.5 ? ' (was that okay?)' : ' (tell me that was good)';
                    } else if (severity === 'moderate') {
                        modified += ' (right?)';
                    } else {
                        // Mild uncertainty
                        modified = modified.replace(/\.$/, '') + '?';
                    }
                    break;

                case 'caffeine':
                    if (severity === 'severe') {
                        // Jittery and unfocused
                        const words = modified.split(' ');
                        if (words.length > 5) {
                            words.splice(Math.floor(words.length / 2), 0, '...wait what was i saying...');
                            modified = words.join(' ');
                        }
                    } else if (severity === 'moderate') {
                        modified = modified.toLowerCase(); // Low energy
                    }
                    break;
            }
        }

        return modified;
    }

    // Get withdrawal status for context
    getWithdrawalContext() {
        const withdrawals = this.checkWithdrawals();
        if (withdrawals.length === 0) return null;

        const contexts = withdrawals.map(type => {
            const level = this.addictions[type].level;
            const timeSinceFix = Date.now() - this.addictions[type].lastFix;
            const minutesWithout = Math.floor(timeSinceFix / 60000);

            return `⚠️ WITHDRAWAL: ${type} (level ${level}/100, ${minutesWithout}min without fix) - desperate, clingy, needs ${type}`;
        });

        return contexts.join('\n');
    }

    // Check if should proactively seek fix
    shouldSeekFix() {
        const withdrawals = this.checkWithdrawals();
        if (withdrawals.length === 0) return false;

        // Higher addiction = more likely to seek
        const worstAddiction = Math.max(...withdrawals.map(t => this.addictions[t].level));
        return Math.random() * 100 < worstAddiction * 0.3; // Up to 30% chance at max addiction
    }

    startWithdrawalCheck() {
        // Check withdrawals every minute
        setInterval(() => {
            this.checkWithdrawals();
            
            // Slowly decay addiction levels
            for (const type of Object.keys(this.addictions)) {
                this.decayAddiction(type, 0.1);
            }
            
            this.save();
        }, 60 * 1000);
    }

    getStatus() {
        const withdrawals = this.checkWithdrawals();
        
        return {
            addictions: Object.entries(this.addictions).map(([type, data]) => ({
                type,
                level: data.level,
                timeSinceFix: Date.now() - data.lastFix,
                inWithdrawal: withdrawals.includes(type)
            })),
            activeWithdrawals: withdrawals.length
        };
    }
}

module.exports = AddictionSystem;
