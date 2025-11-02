/**
 * StreamSnipingDetector.js
 * Detects suspicious patterns in user arrival timing
 * Features: Pattern analysis, arrival tracking, suspicion levels
 */

const fs = require('fs').promises;
const path = require('path');

class StreamSnipingDetector {
    constructor() {
        this.userPatterns = new Map();
        this.arrivalHistory = [];
        this.dataPath = path.join(__dirname, '../../data/stream_sniping.json');
        
        this.suspicionThreshold = 0.6; // 0-1
        this.maxHistorySize = 100;
        
        this.load();
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            for (const [key, value] of Object.entries(saved.userPatterns || {})) {
                this.userPatterns.set(key, value);
            }
            
            this.arrivalHistory = saved.arrivalHistory || [];
            
            console.log(`[StreamSniping] Loaded ${this.userPatterns.size} user patterns`);
        } catch (error) {
            console.log('[StreamSniping] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                userPatterns: Object.fromEntries(this.userPatterns),
                arrivalHistory: this.arrivalHistory.slice(-this.maxHistorySize)
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[StreamSniping] Save error:', error.message);
        }
    }

    // Track user arrival
    trackArrival(username, context = {}) {
        if (!this.userPatterns.has(username)) {
            this.userPatterns.set(username, {
                username,
                firstSeen: Date.now(),
                arrivalTimes: [],
                averageArrivalDelay: null,
                suspicionLevel: 0,
                flags: {
                    alwaysArrivesTogether: false,
                    perfectTiming: false,
                    neverMissesEvents: false,
                    suspiciousGaps: false
                },
                accompaniedBy: new Map() // Other users they arrive with
            });
        }

        const pattern = this.userPatterns.get(username);
        const now = Date.now();
        
        // Record arrival
        pattern.arrivalTimes.push({
            timestamp: now,
            context: context.event || 'general',
            otherUsersPresent: context.otherUsers || []
        });

        // Keep last 50 arrivals
        if (pattern.arrivalTimes.length > 50) {
            pattern.arrivalTimes.shift();
        }

        // Add to history
        this.arrivalHistory.push({
            username,
            timestamp: now,
            event: context.event
        });

        if (this.arrivalHistory.length > this.maxHistorySize) {
            this.arrivalHistory.shift();
        }

        // Analyze patterns
        this.analyzePattern(username);
        
        this.save();
    }

    // Analyze user's arrival patterns
    analyzePattern(username) {
        const pattern = this.userPatterns.get(username);
        if (!pattern || pattern.arrivalTimes.length < 5) return;

        const arrivals = pattern.arrivalTimes;
        let suspicionPoints = 0;

        // Check for perfect timing (arrives within 2 minutes of events)
        const eventArrivals = arrivals.filter(a => a.context !== 'general');
        if (eventArrivals.length >= 3) {
            const perfectlyTimed = eventArrivals.filter(a => {
                // Check if arrived within 2 minutes of event
                const eventTime = a.timestamp; // Simplified
                return true; // Would need actual event timing
            });

            if (perfectlyTimed.length / eventArrivals.length > 0.8) {
                pattern.flags.perfectTiming = true;
                suspicionPoints += 30;
            }
        }

        // Check if always arrives with specific users
        const accompaniedUsers = new Map();
        for (const arrival of arrivals) {
            for (const otherUser of arrival.otherUsersPresent) {
                accompaniedUsers.set(otherUser, (accompaniedUsers.get(otherUser) || 0) + 1);
            }
        }

        for (const [otherUser, count] of accompaniedUsers) {
            if (count / arrivals.length > 0.7) {
                pattern.flags.alwaysArrivesTogether = true;
                pattern.accompaniedBy.set(otherUser, count);
                suspicionPoints += 20;
            }
        }

        // Check for suspicious timing gaps (arrives exactly 5, 10, 15 mins after events)
        const gaps = [];
        for (let i = 1; i < arrivals.length; i++) {
            const gap = (arrivals[i].timestamp - arrivals[i-1].timestamp) / (1000 * 60);
            gaps.push(gap);
        }

        const roundGaps = gaps.filter(g => g % 5 === 0 || g % 10 === 0);
        if (roundGaps.length / gaps.length > 0.6) {
            pattern.flags.suspiciousGaps = true;
            suspicionPoints += 15;
        }

        // Update suspicion level
        pattern.suspicionLevel = Math.min(100, suspicionPoints);

        if (pattern.suspicionLevel > 60) {
            console.log(`[StreamSniping] ⚠️ ${username} showing suspicious patterns (${pattern.suspicionLevel}/100)`);
        }
    }

    // Check if user is suspected stream sniper
    isSuspicious(username) {
        const pattern = this.userPatterns.get(username);
        if (!pattern) return false;

        return pattern.suspicionLevel > this.suspicionThreshold * 100;
    }

    // Get arrival announcement
    getArrivalAnnouncement(username) {
        const pattern = this.userPatterns.get(username);
        if (!pattern) return null;

        if (pattern.suspicionLevel > 80) {
            return `${username} arrived (suspiciously on time as always)`;
        } else if (pattern.suspicionLevel > 60) {
            return `${username} is here (interesting timing)`;
        } else if (pattern.flags.alwaysArrivesTogether) {
            const companion = Array.from(pattern.accompaniedBy.keys())[0];
            return `${username} and ${companion} arrive together again`;
        }

        // Regular arrival
        const arrivals = pattern.arrivalTimes.length;
        if (arrivals === 1) {
            return `hey ${username}, first time?`;
        } else if (arrivals % 10 === 0) {
            return `${username} has arrived ${arrivals} times`;
        }

        return null;
    }

    // Detect coordinated arrivals
    detectCoordinatedArrivals(timeWindow = 2 * 60 * 1000) { // 2 minutes
        const recent = this.arrivalHistory.filter(a => 
            Date.now() - a.timestamp < timeWindow
        );

        if (recent.length >= 3) {
            // Multiple users arrived within time window
            const users = recent.map(a => a.username);
            console.log(`[StreamSniping] Coordinated arrival detected: ${users.join(', ')}`);
            
            return {
                users,
                suspicious: true,
                message: `${users.join(', ')} all showed up at once. coordinated?`
            };
        }

        return null;
    }

    // Track if user never misses big events
    trackEventAttendance(username, eventType) {
        const pattern = this.userPatterns.get(username);
        if (!pattern) return;

        if (!pattern.eventAttendance) {
            pattern.eventAttendance = new Map();
        }

        const count = pattern.eventAttendance.get(eventType) || 0;
        pattern.eventAttendance.set(eventType, count + 1);

        // If they've attended 100% of events
        if (count >= 5) {
            pattern.flags.neverMissesEvents = true;
            pattern.suspicionLevel = Math.min(100, pattern.suspicionLevel + 10);
            console.log(`[StreamSniping] ${username} never misses ${eventType} events`);
        }

        this.save();
    }

    // Get most suspicious users
    getSuspiciousUsers(limit = 5) {
        return Array.from(this.userPatterns.values())
            .filter(p => p.suspicionLevel > 40)
            .sort((a, b) => b.suspicionLevel - a.suspicionLevel)
            .slice(0, limit);
    }

    // Generate accusation
    getAccusation(username) {
        const pattern = this.userPatterns.get(username);
        if (!pattern || pattern.suspicionLevel < 70) return null;

        const accusations = [];

        if (pattern.flags.perfectTiming) {
            accusations.push('always arrives at perfect times');
        }
        if (pattern.flags.alwaysArrivesTogether) {
            const companion = Array.from(pattern.accompaniedBy.keys())[0];
            accusations.push(`always with ${companion}`);
        }
        if (pattern.flags.neverMissesEvents) {
            accusations.push('never misses anything');
        }
        if (pattern.flags.suspiciousGaps) {
            accusations.push('timing is too perfect');
        }

        if (accusations.length === 0) return null;

        return `${username} is ${accusations.join(', ')}. stream sniping? 🤔`;
    }

    // React to suspicious arrival
    reactToSuspiciousArrival(username) {
        const pattern = this.userPatterns.get(username);
        if (!pattern || pattern.suspicionLevel < 60) return null;

        const reactions = [
            `${username} how did you know to show up right now`,
            `suspiciously convenient timing ${username}`,
            `${username} are you watching us`,
            `do you have notifications on ${username}`,
            `${username} your timing is too good`,
            `caught you stream sniping ${username}`
        ];

        return reactions[Math.floor(Math.random() * reactions.length)];
    }

    // Get context for AI
    getSuspicionContext() {
        const suspicious = this.getSuspiciousUsers(3);
        if (suspicious.length === 0) return null;

        let context = '🎯 STREAM SNIPING SUSPICIONS:\n';
        
        for (const pattern of suspicious) {
            context += `- ${pattern.username}: ${pattern.suspicionLevel}/100 suspicion`;
            const flags = Object.entries(pattern.flags)
                .filter(([_, v]) => v)
                .map(([k]) => k);
            if (flags.length > 0) {
                context += ` (${flags.join(', ')})`;
            }
            context += '\n';
        }

        return context;
    }

    getStatus() {
        const suspicious = this.getSuspiciousUsers(10);
        
        return {
            totalTracked: this.userPatterns.size,
            suspiciousUsers: suspicious.length,
            arrivalHistory: this.arrivalHistory.length,
            topSuspects: suspicious.slice(0, 3).map(p => ({
                username: p.username,
                suspicionLevel: p.suspicionLevel,
                flags: Object.entries(p.flags).filter(([_, v]) => v).map(([k]) => k)
            }))
        };
    }
}

module.exports = StreamSnipingDetector;
