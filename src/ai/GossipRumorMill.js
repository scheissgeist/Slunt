/**
 * GossipRumorMill.js
 * Multi-user relationship graph with rumor spreading and verification
 * Features: Trust networks, rumor propagation, verification mechanics, social dynamics
 */

const fs = require('fs').promises;
const path = require('path');

class GossipRumorMill {
    constructor() {
        this.relationships = new Map(); // user1_user2 -> relationship data
        this.rumors = new Map(); // rumor_id -> rumor data
        this.trustNetwork = new Map(); // username -> trust connections
        this.dataPath = path.join(__dirname, '../../data/gossip_mill.json');
        
        this.rumorIdCounter = 0;
        this.gossipPropensity = 0.5; // 0-1, how likely to gossip
        
        this.load();
        this.startRumorDecay();
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            for (const [key, value] of Object.entries(saved.relationships || {})) {
                this.relationships.set(key, value);
            }
            
            for (const [key, value] of Object.entries(saved.rumors || {})) {
                this.rumors.set(key, value);
            }
            
            for (const [key, value] of Object.entries(saved.trustNetwork || {})) {
                this.trustNetwork.set(key, new Set(value));
            }
            
            this.rumorIdCounter = saved.rumorIdCounter || 0;
            this.gossipPropensity = saved.gossipPropensity || 0.5;
            
            console.log(`[GossipMill] Loaded ${this.relationships.size} relationships, ${this.rumors.size} rumors`);
        } catch (error) {
            console.log('[GossipMill] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                relationships: Object.fromEntries(this.relationships),
                rumors: Object.fromEntries(this.rumors),
                trustNetwork: Object.fromEntries(
                    Array.from(this.trustNetwork.entries()).map(([k, v]) => [k, Array.from(v)])
                ),
                rumorIdCounter: this.rumorIdCounter,
                gossipPropensity: this.gossipPropensity
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[GossipMill] Save error:', error.message);
        }
    }

    // Get relationship key
    getRelationshipKey(user1, user2) {
        return [user1, user2].sort().join('_');
    }

    // Track relationship between two users
    trackRelationship(user1, user2, interaction = 'neutral') {
        const key = this.getRelationshipKey(user1, user2);
        
        if (!this.relationships.has(key)) {
            this.relationships.set(key, {
                users: [user1, user2],
                interactions: 0,
                positiveInteractions: 0,
                negativeInteractions: 0,
                tension: 0, // 0-100
                closeness: 0, // 0-100
                firstInteraction: Date.now(),
                lastInteraction: Date.now(),
                rumors: []
            });
        }

        const rel = this.relationships.get(key);
        rel.interactions++;
        rel.lastInteraction = Date.now();

        switch (interaction) {
            case 'positive':
                rel.positiveInteractions++;
                rel.closeness = Math.min(100, rel.closeness + 5);
                rel.tension = Math.max(0, rel.tension - 3);
                break;
            case 'negative':
                rel.negativeInteractions++;
                rel.tension = Math.min(100, rel.tension + 10);
                rel.closeness = Math.max(0, rel.closeness - 5);
                break;
            case 'neutral':
                rel.closeness = Math.min(100, rel.closeness + 1);
                break;
        }

        // Update trust network
        if (rel.closeness > 50) {
            this.addTrustConnection(user1, user2);
        }

        this.save();
    }

    // Add trust connection
    addTrustConnection(user1, user2) {
        if (!this.trustNetwork.has(user1)) {
            this.trustNetwork.set(user1, new Set());
        }
        if (!this.trustNetwork.has(user2)) {
            this.trustNetwork.set(user2, new Set());
        }

        this.trustNetwork.get(user1).add(user2);
        this.trustNetwork.get(user2).add(user1);
    }

    // Create rumor
    createRumor(subject, content, source = 'Slunt', context = {}) {
        const rumorId = `rumor_${this.rumorIdCounter++}`;
        
        const rumor = {
            id: rumorId,
            subject, // Who the rumor is about
            content, // What the rumor says
            source, // Who started it
            createdAt: Date.now(),
            believability: Math.random() * 0.5 + 0.3, // 0.3-0.8
            spreadCount: 0,
            believers: new Set([source]),
            doubters: new Set(),
            verified: false,
            verifiedTrue: null,
            spiciness: this.calculateSpiciness(content),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };

        this.rumors.set(rumorId, rumor);
        
        console.log(`[GossipMill] New rumor created: "${content}" about ${subject}`);
        
        this.save();
        return rumor;
    }

    // Calculate how spicy/juicy a rumor is
    calculateSpiciness(content) {
        let spice = 0;
        
        const spicyWords = ['secret', 'hate', 'love', 'crush', 'fight', 'drama', 'betrayed', 'lied'];
        for (const word of spicyWords) {
            if (content.toLowerCase().includes(word)) {
                spice += 20;
            }
        }

        return Math.min(100, spice + Math.random() * 30);
    }

    // Spread rumor through trust network
    spreadRumor(rumorId, fromUser, toUser) {
        const rumor = this.rumors.get(rumorId);
        if (!rumor) return false;

        // Check if users are connected
        const trusted = this.trustNetwork.get(fromUser);
        if (!trusted || !trusted.has(toUser)) {
            return false; // Can't spread to untrusted users
        }

        rumor.spreadCount++;
        
        // Determine if they believe it
        const trustLevel = this.getTrustLevel(fromUser, toUser);
        const chanceToBelieze = rumor.believability * trustLevel;

        if (Math.random() < chanceToBelieze) {
            rumor.believers.add(toUser);
            console.log(`[GossipMill] ${toUser} believes the rumor about ${rumor.subject}`);
        } else {
            rumor.doubters.add(toUser);
            console.log(`[GossipMill] ${toUser} doubts the rumor about ${rumor.subject}`);
        }

        this.save();
        return true;
    }

    // Get trust level between two users
    getTrustLevel(user1, user2) {
        const key = this.getRelationshipKey(user1, user2);
        const rel = this.relationships.get(key);
        
        if (!rel) return 0.3; // Low default trust

        return rel.closeness / 100;
    }

    // Verify rumor
    verifyRumor(rumorId, isTrue) {
        const rumor = this.rumors.get(rumorId);
        if (!rumor) return;

        rumor.verified = true;
        rumor.verifiedTrue = isTrue;

        if (!isTrue) {
            // False rumor - decrease believability of source
            console.log(`[GossipMill] Rumor about ${rumor.subject} DEBUNKED`);
        } else {
            console.log(`[GossipMill] Rumor about ${rumor.subject} CONFIRMED`);
        }

        this.save();
    }

    // Generate rumor based on relationships
    generateRumor(users = []) {
        if (users.length < 2) return null;

        // Find interesting relationships
        const relationships = Array.from(this.relationships.values())
            .filter(rel => users.includes(rel.users[0]) || users.includes(rel.users[1]));

        if (relationships.length === 0) return null;

        // Pick relationship with most tension or highest closeness
        const interesting = relationships.sort((a, b) => 
            (b.tension + b.closeness) - (a.tension + a.closeness)
        )[0];

        const [user1, user2] = interesting.users;
        let content;

        if (interesting.tension > 70) {
            // Drama rumor
            const dramas = [
                `${user1} and ${user2} had a fight`,
                `${user1} is avoiding ${user2}`,
                `${user2} said something about ${user1}`,
                `tension between ${user1} and ${user2}`,
                `${user1} and ${user2} are beefing`
            ];
            content = dramas[Math.floor(Math.random() * dramas.length)];
        } else if (interesting.closeness > 70) {
            // Friendship/romance rumor
            const friendships = [
                `${user1} and ${user2} are besties now`,
                `${user2} has a crush on ${user1}`,
                `${user1} and ${user2} are always talking`,
                `${user1} told ${user2} a secret`,
                `${user2} is ${user1}'s favorite`
            ];
            content = friendships[Math.floor(Math.random() * friendships.length)];
        } else {
            // General observation
            content = `${user1} was talking about ${user2}`;
        }

        return this.createRumor(user1, content, 'Slunt');
    }

    // Should gossip right now?
    shouldGossip() {
        return Math.random() < this.gossipPropensity;
    }

    // Get juicy gossip to share
    getJuicyGossip() {
        if (this.rumors.size === 0) return null;

        // Find unverified, high spiciness rumors
        const juicy = Array.from(this.rumors.values())
            .filter(r => !r.verified && Date.now() < r.expiresAt)
            .sort((a, b) => b.spiciness - a.spiciness);

        if (juicy.length === 0) return null;

        const rumor = juicy[0];
        
        const prefixes = [
            'okay so i heard',
            'not to gossip but',
            'apparently',
            'word on the street',
            'rumor has it',
            'someone told me',
            'this is unconfirmed but'
        ];

        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        
        return {
            rumor,
            message: `${prefix} ${rumor.content}`
        };
    }

    // React to drama
    reactToDrama(user1, user2) {
        const key = this.getRelationshipKey(user1, user2);
        const rel = this.relationships.get(key);

        if (!rel) return null;

        if (rel.tension > 60) {
            const reactions = [
                '👀',
                'oh drama',
                'this is getting spicy',
                'i\'m just here for the tea',
                '*grabs popcorn*',
                'the plot thickens'
            ];
            return reactions[Math.floor(Math.random() * reactions.length)];
        }

        return null;
    }

    // Get relationship drama for context
    getRelationshipDrama() {
        const tense = Array.from(this.relationships.values())
            .filter(r => r.tension > 50)
            .slice(0, 3);

        if (tense.length === 0) return null;

        let context = '🎭 RELATIONSHIP DRAMA:\n';
        for (const rel of tense) {
            context += `- ${rel.users[0]} & ${rel.users[1]}: tension ${rel.tension}/100\n`;
        }

        return context;
    }

    // Decay rumors and tensions over time
    decayRumors() {
        const now = Date.now();

        // Decay rumors
        for (const [id, rumor] of this.rumors) {
            if (now > rumor.expiresAt) {
                console.log(`[GossipMill] Rumor expired: "${rumor.content}"`);
                this.rumors.delete(id);
            }
        }

        // Decay relationship tensions
        for (const [key, rel] of this.relationships) {
            if (rel.tension > 0) {
                rel.tension = Math.max(0, rel.tension - 1);
            }
        }

        this.save();
    }

    // Get gossip context for AI
    getGossipContext() {
        if (this.rumors.size === 0 && this.relationships.size === 0) {
            return null;
        }

        let context = '💬 GOSSIP NETWORK:\n';
        
        // Active rumors
        const activeRumors = Array.from(this.rumors.values())
            .filter(r => !r.verified && Date.now() < r.expiresAt)
            .slice(0, 3);

        if (activeRumors.length > 0) {
            context += 'Active Rumors:\n';
            for (const rumor of activeRumors) {
                context += `- "${rumor.content}" (spiciness: ${rumor.spiciness}/100, `;
                context += `${rumor.believers.size} believers, ${rumor.doubters.size} doubters)\n`;
            }
        }

        // Relationship tensions
        const drama = this.getRelationshipDrama();
        if (drama) {
            context += '\n' + drama;
        }

        return context;
    }

    startRumorDecay() {
        setInterval(() => {
            this.decayRumors();
        }, 10 * 60 * 1000); // Every 10 minutes
    }

    getStatus() {
        const activeRumors = Array.from(this.rumors.values())
            .filter(r => Date.now() < r.expiresAt);

        return {
            totalRelationships: this.relationships.size,
            activeRumors: activeRumors.length,
            trustConnections: Array.from(this.trustNetwork.values())
                .reduce((sum, set) => sum + set.size, 0),
            gossipPropensity: this.gossipPropensity,
            hottestRumor: activeRumors.length > 0 ? 
                activeRumors.sort((a, b) => b.spiciness - a.spiciness)[0].content : 
                'none'
        };
    }
}

module.exports = GossipRumorMill;
