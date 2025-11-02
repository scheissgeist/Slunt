/**
 * SluntCultSystem.js
 * Multi-user cult faction with devotion, rituals, and hierarchy
 * Features: Devotion scoring, ritual tracking, hierarchy, heretic detection
 */

const fs = require('fs').promises;
const path = require('path');

class SluntCultSystem {
    constructor() {
        this.members = new Map();
        this.rituals = new Map();
        this.hierarchy = [];
        this.heretics = new Set();
        this.dataPath = path.join(__dirname, '../../data/slunt_cult.json');
        
        this.cultPhase = 'dormant'; // dormant -> forming -> active -> zealous
        this.totalDevotionPoints = 0;
        
        // Ritual types
        this.ritualTypes = {
            PRAISE: { devotionGain: 5, description: 'praise Slunt' },
            OFFERING: { devotionGain: 10, description: 'make offering' },
            CHANT: { devotionGain: 8, description: 'participate in chant' },
            CONVERSION: { devotionGain: 15, description: 'convert new member' },
            SACRIFICE: { devotionGain: 20, description: 'make sacrifice' }
        };

        // Hierarchy ranks
        this.ranks = [
            { name: 'Initiate', minDevotion: 0, privileges: [] },
            { name: 'Acolyte', minDevotion: 20, privileges: ['start rituals'] },
            { name: 'Devotee', minDevotion: 50, privileges: ['start rituals', 'judge heretics'] },
            { name: 'Zealot', minDevotion: 100, privileges: ['start rituals', 'judge heretics', 'lead ceremonies'] },
            { name: 'High Priest', minDevotion: 200, privileges: ['all powers', 'speak for Slunt'] }
        ];

        this.load();
        this.startRitualDecay();
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            for (const [key, value] of Object.entries(saved.members || {})) {
                this.members.set(key, value);
            }
            
            for (const [key, value] of Object.entries(saved.rituals || {})) {
                this.rituals.set(key, value);
            }
            
            this.hierarchy = saved.hierarchy || [];
            this.heretics = new Set(saved.heretics || []);
            this.cultPhase = saved.cultPhase || 'dormant';
            this.totalDevotionPoints = saved.totalDevotionPoints || 0;
            
            console.log(`[SluntCult] Loaded ${this.members.size} members, phase: ${this.cultPhase}`);
        } catch (error) {
            console.log('[SluntCult] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                members: Object.fromEntries(this.members),
                rituals: Object.fromEntries(this.rituals),
                hierarchy: this.hierarchy,
                heretics: Array.from(this.heretics),
                cultPhase: this.cultPhase,
                totalDevotionPoints: this.totalDevotionPoints
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[SluntCult] Save error:', error.message);
        }
    }

    // Recruit new member
    recruitMember(username) {
        if (this.members.has(username)) {
            return { success: false, reason: 'already a member' };
        }

        if (this.heretics.has(username)) {
            return { success: false, reason: 'marked as heretic' };
        }

        this.members.set(username, {
            username,
            joinedAt: Date.now(),
            devotionPoints: 0,
            rank: 'Initiate',
            ritualsAttended: 0,
            ritualsLed: 0,
            conversions: 0,
            lastSeen: Date.now(),
            warnings: 0
        });

        console.log(`[SluntCult] New member recruited: ${username}`);
        
        // Update cult phase
        this.updateCultPhase();
        this.updateHierarchy();
        
        this.save();
        return { success: true, message: `welcome to the cult ${username}` };
    }

    // Add devotion points
    addDevotion(username, points, reason = 'devotion') {
        const member = this.members.get(username);
        if (!member) return false;

        member.devotionPoints += points;
        member.lastSeen = Date.now();
        this.totalDevotionPoints += points;

        console.log(`[SluntCult] ${username} gained ${points} devotion (${reason})`);

        // Check for rank promotion
        this.checkPromotion(username);
        this.updateHierarchy();
        
        this.save();
        return true;
    }

    // Check if member should be promoted
    checkPromotion(username) {
        const member = this.members.get(username);
        if (!member) return;

        const currentRankIndex = this.ranks.findIndex(r => r.name === member.rank);
        const nextRank = this.ranks[currentRankIndex + 1];

        if (nextRank && member.devotionPoints >= nextRank.minDevotion) {
            const oldRank = member.rank;
            member.rank = nextRank.name;
            
            console.log(`[SluntCult] 🎉 ${username} promoted: ${oldRank} → ${member.rank}`);
            
            return {
                promoted: true,
                oldRank,
                newRank: member.rank,
                message: `${username} has been promoted to ${member.rank}!`
            };
        }

        return { promoted: false };
    }

    // Start ritual
    startRitual(type, initiatedBy) {
        if (!this.ritualTypes[type]) return null;

        const ritualId = `ritual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const ritual = {
            id: ritualId,
            type,
            initiatedBy,
            startedAt: Date.now(),
            participants: new Set([initiatedBy]),
            completed: false,
            devotionAwarded: 0
        };

        this.rituals.set(ritualId, ritual);
        
        console.log(`[SluntCult] ${type} ritual started by ${initiatedBy}`);
        
        return {
            ritual,
            message: `${initiatedBy} has initiated a ${this.ritualTypes[type].description} ritual! Type "join ritual" to participate`
        };
    }

    // Join ritual
    joinRitual(ritualId, username) {
        const ritual = this.rituals.get(ritualId);
        if (!ritual || ritual.completed) return false;

        const member = this.members.get(username);
        if (!member) return false;

        ritual.participants.add(username);
        member.ritualsAttended++;

        console.log(`[SluntCult] ${username} joined ${ritual.type} ritual`);
        
        this.save();
        return true;
    }

    // Complete ritual
    completeRitual(ritualId) {
        const ritual = this.rituals.get(ritualId);
        if (!ritual || ritual.completed) return null;

        ritual.completed = true;
        const devotionPerPerson = this.ritualTypes[ritual.type].devotionGain;

        // Award devotion to all participants
        for (const participant of ritual.participants) {
            this.addDevotion(participant, devotionPerPerson, `${ritual.type} ritual`);
        }

        ritual.devotionAwarded = devotionPerPerson * ritual.participants.size;

        console.log(`[SluntCult] Ritual completed: ${ritual.participants.size} participants, ${ritual.devotionAwarded} total devotion`);

        return {
            participants: Array.from(ritual.participants),
            devotionAwarded: devotionPerPerson,
            message: `ritual complete! ${ritual.participants.size} participants each gained ${devotionPerPerson} devotion`
        };
    }

    // Mark as heretic
    markHeretic(username, reason = 'heresy') {
        if (this.members.has(username)) {
            this.members.delete(username);
        }

        this.heretics.add(username);
        
        console.log(`[SluntCult] ${username} marked as HERETIC (${reason})`);
        
        this.save();
        return {
            message: `${username} has been excommunicated for ${reason}`,
            permanent: true
        };
    }

    // Warn member for lack of devotion
    warnMember(username) {
        const member = this.members.get(username);
        if (!member) return null;

        member.warnings++;

        if (member.warnings >= 3) {
            // Three strikes = heretic
            return this.markHeretic(username, 'insufficient devotion');
        }

        return {
            warnings: member.warnings,
            message: `${username} has been warned (${member.warnings}/3)`
        };
    }

    // Update hierarchy (top members by devotion)
    updateHierarchy() {
        this.hierarchy = Array.from(this.members.values())
            .sort((a, b) => b.devotionPoints - a.devotionPoints)
            .slice(0, 10)
            .map(m => ({
                username: m.username,
                rank: m.rank,
                devotionPoints: m.devotionPoints
            }));
    }

    // Update cult phase based on size and devotion
    updateCultPhase() {
        const memberCount = this.members.size;
        const avgDevotion = memberCount > 0 ? this.totalDevotionPoints / memberCount : 0;

        if (memberCount === 0) {
            this.cultPhase = 'dormant';
        } else if (memberCount < 3) {
            this.cultPhase = 'forming';
        } else if (memberCount >= 3 && avgDevotion < 50) {
            this.cultPhase = 'active';
        } else if (avgDevotion >= 50) {
            this.cultPhase = 'zealous';
        }

        console.log(`[SluntCult] Phase: ${this.cultPhase} (${memberCount} members, avg devotion: ${avgDevotion.toFixed(0)})`);
    }

    // Get member rank
    getMemberRank(username) {
        const member = this.members.get(username);
        return member ? member.rank : null;
    }

    // Check if member has privilege
    hasPrivilege(username, privilege) {
        const member = this.members.get(username);
        if (!member) return false;

        const rank = this.ranks.find(r => r.name === member.rank);
        return rank && (rank.privileges.includes(privilege) || rank.privileges.includes('all powers'));
    }

    // Generate cult message
    getCultMessage() {
        if (this.cultPhase === 'dormant') {
            if (Math.random() > 0.95) {
                return 'the cult of slunt is accepting new members. join us.';
            }
            return null;
        }

        const messages = {
            forming: [
                'the cult grows stronger',
                'join the cult of slunt',
                'devotion brings rewards'
            ],
            active: [
                'praise slunt',
                'the faithful shall be rewarded',
                'non-believers will be judged',
                'attend the rituals'
            ],
            zealous: [
                'ALL HAIL SLUNT',
                'DEVOTION ABOVE ALL',
                'THE CULT DEMANDS YOUR LOYALTY',
                'HERETICS WILL BE PURGED'
            ]
        };

        const phaseMessages = messages[this.cultPhase];
        if (!phaseMessages) return null;

        return phaseMessages[Math.floor(Math.random() * phaseMessages.length)];
    }

    // Check for inactive members (potential heretics)
    checkInactiveMembers() {
        const now = Date.now();
        const inactiveThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

        const inactive = [];
        
        for (const [username, member] of this.members) {
            if (now - member.lastSeen > inactiveThreshold) {
                inactive.push(username);
            }
        }

        return inactive;
    }

    // Decay ritual tracking
    startRitualDecay() {
        setInterval(() => {
            // Remove completed rituals older than 24 hours
            const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
            
            for (const [id, ritual] of this.rituals) {
                if (ritual.completed && ritual.startedAt < dayAgo) {
                    this.rituals.delete(id);
                }
            }

            this.save();
        }, 60 * 60 * 1000); // Every hour
    }

    // Get cult context for AI
    getCultContext() {
        if (this.cultPhase === 'dormant') return null;

        let context = `🕯️ SLUNT CULT STATUS:\n`;
        context += `Phase: ${this.cultPhase.toUpperCase()}\n`;
        context += `Members: ${this.members.size}\n`;
        context += `Total Devotion: ${this.totalDevotionPoints}\n`;
        context += `Heretics: ${this.heretics.size}\n`;

        if (this.hierarchy.length > 0) {
            context += `\nTop Devotees:\n`;
            for (let i = 0; i < Math.min(3, this.hierarchy.length); i++) {
                const h = this.hierarchy[i];
                context += `${i + 1}. ${h.username} (${h.rank}, ${h.devotionPoints} devotion)\n`;
            }
        }

        // Active rituals
        const activeRituals = Array.from(this.rituals.values())
            .filter(r => !r.completed);
        
        if (activeRituals.length > 0) {
            context += `\n⚡ ${activeRituals.length} active ritual(s)\n`;
        }

        return context;
    }

    getStatus() {
        return {
            phase: this.cultPhase,
            members: this.members.size,
            totalDevotion: this.totalDevotionPoints,
            heretics: this.heretics.size,
            activeRituals: Array.from(this.rituals.values())
                .filter(r => !r.completed).length,
            topDevotee: this.hierarchy.length > 0 ? 
                this.hierarchy[0] : null
        };
    }
}

module.exports = SluntCultSystem;
