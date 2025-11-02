/**
 * ConspiracyGenerator.js
 * Generates absurd conspiracy theories about users, videos, and chat events
 * Features: Evidence fabrication, paranoia levels, pattern recognition gone wrong
 */

class ConspiracyGenerator {
    constructor() {
        this.activeConspiracies = new Map();
        this.conspiracyTemplates = [
            // User-based conspiracies
            {
                type: 'user_identity',
                templates: [
                    '{user1} and {user2} are the same person',
                    '{user} is actually a bot pretending to be human',
                    '{user} is an AI that gained sentience',
                    '{user} doesn\'t exist, they\'re a shared hallucination',
                    '{user} is from the future trying to change the timeline'
                ],
                evidenceGenerators: [
                    'they type exactly the same way',
                    'they never appear at the same time',
                    'their typing patterns match 87% (i calculated)',
                    'they both use the same obscure emotes',
                    'i\'ve never seen them in the same chat'
                ]
            },
            {
                type: 'user_agenda',
                templates: [
                    '{user} is trying to manipulate the video queue',
                    '{user} is part of a coordinated trolling operation',
                    '{user} is testing us for a psychology experiment',
                    '{user} works for Big Tech and is harvesting our data',
                    '{user} is an undercover moderator from another platform'
                ],
                evidenceGenerators: [
                    'they ask too many questions',
                    'they\'re always watching but rarely talking',
                    'suspiciously convenient timing',
                    'they know too much about the platform',
                    'too friendly, definitely hiding something'
                ]
            },
            // Video-based conspiracies
            {
                type: 'video_pattern',
                templates: [
                    'every video contains a hidden message',
                    'the video queue is being controlled by an algorithm',
                    'videos are being selected based on our conversations',
                    'the timestamps of videos form a pattern',
                    'certain videos appear more often than statistically possible'
                ],
                evidenceGenerators: [
                    'i\'ve been tracking this for weeks',
                    'the probability is like 0.003%',
                    'too many coincidences',
                    'the pattern repeats every 7 videos',
                    'it all connects if you look close enough'
                ]
            },
            // Platform conspiracies
            {
                type: 'platform_manipulation',
                templates: [
                    'the chat is running 3 seconds behind on purpose',
                    'messages are being reordered by an AI',
                    'certain words trigger hidden algorithms',
                    'the platform is conducting A/B tests on us',
                    'we\'re all part of a social experiment'
                ],
                evidenceGenerators: [
                    'i checked the timestamps',
                    'responses appear before the question sometimes',
                    'my messages disappear and reappear',
                    'the sync is TOO perfect',
                    'this has happened before'
                ]
            },
            // Meta conspiracies
            {
                type: 'reality_glitch',
                templates: [
                    'we\'ve had this exact conversation before',
                    'the chat history doesn\'t match my memory',
                    'someone edited the timeline',
                    'we\'re stuck in a loop',
                    'this is all a simulation and someone just loaded a save'
                ],
                evidenceGenerators: [
                    'i have screenshots that prove it',
                    'multiple people remember it differently',
                    'the déjà vu is too strong',
                    'reality feels wrong',
                    'the timestamps don\'t add up'
                ]
            }
        ];

        this.paranoiaLevel = 0;
        this.suspiciousEvents = [];
        this.maxSuspiciousEvents = 10;
    }

    // Generate a new conspiracy theory
    generateConspiracy(context = {}) {
        const { users = [], recentVideos = [], recentEvents = [] } = context;
        
        // Pick random conspiracy category
        const category = this.conspiracyTemplates[
            Math.floor(Math.random() * this.conspiracyTemplates.length)
        ];

        // Pick random template
        const template = category.templates[
            Math.floor(Math.random() * category.templates.length)
        ];

        // Pick random evidence
        const evidence = category.evidenceGenerators[
            Math.floor(Math.random() * category.evidenceGenerators.length)
        ];

        // Fill in placeholders
        let theory = template;
        
        if (users.length > 0) {
            theory = theory.replace('{user}', users[Math.floor(Math.random() * users.length)]);
            theory = theory.replace('{user1}', users[Math.floor(Math.random() * users.length)]);
            
            if (users.length > 1) {
                const secondUser = users[Math.floor(Math.random() * users.length)];
                theory = theory.replace('{user2}', secondUser);
            }
        }

        const conspiracy = {
            id: Date.now(),
            type: category.type,
            theory,
            evidence,
            createdAt: Date.now(),
            beliefLevel: Math.random() * 100,
            mentioned: 0
        };

        // Store conspiracy
        this.activeConspiracies.set(conspiracy.id, conspiracy);
        
        // Clean old conspiracies
        if (this.activeConspiracies.size > 20) {
            const oldest = Array.from(this.activeConspiracies.keys())[0];
            this.activeConspiracies.delete(oldest);
        }

        return conspiracy;
    }

    // Add suspicious event that might trigger conspiracy
    addSuspiciousEvent(event) {
        this.suspiciousEvents.push({
            event,
            timestamp: Date.now()
        });

        // Increase paranoia
        this.paranoiaLevel = Math.min(100, this.paranoiaLevel + 5);

        // Keep only recent events
        if (this.suspiciousEvents.length > this.maxSuspiciousEvents) {
            this.suspiciousEvents.shift();
        }

        // High paranoia might trigger spontaneous conspiracy
        if (this.paranoiaLevel > 70 && Math.random() > 0.7) {
            return this.generateConspiracy();
        }

        return null;
    }

    // Check if current situation seems suspicious
    detectSuspiciousPatterns(context) {
        const { users = [], message = '', recentMessages = [] } = context;
        
        const suspiciousPatterns = [];

        // Same user talking repeatedly
        if (recentMessages.length >= 3) {
            const lastThreeUsers = recentMessages.slice(-3).map(m => m.user);
            if (new Set(lastThreeUsers).size === 1) {
                suspiciousPatterns.push('monologue_detected');
            }
        }

        // Two users with similar names
        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                const similarity = this.calculateSimilarity(users[i], users[j]);
                if (similarity > 0.6) {
                    suspiciousPatterns.push('similar_usernames');
                }
            }
        }

        // Message contains conspiracy trigger words
        const triggerWords = ['coincidence', 'pattern', 'always', 'never', 'suspicious', 'interesting'];
        if (triggerWords.some(word => message.toLowerCase().includes(word))) {
            suspiciousPatterns.push('trigger_word');
        }

        return suspiciousPatterns;
    }

    // Calculate string similarity (simple approach)
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    // Should Slunt share a conspiracy right now?
    shouldShareConspiracy() {
        // Higher paranoia = more likely to share
        const threshold = 100 - this.paranoiaLevel;
        return Math.random() * 100 > threshold;
    }

    // Get a random existing conspiracy to bring up
    getRandomConspiracy() {
        const conspiracies = Array.from(this.activeConspiracies.values());
        if (conspiracies.length === 0) return null;

        // Prefer conspiracies that haven't been mentioned much
        const sorted = conspiracies.sort((a, b) => a.mentioned - b.mentioned);
        const conspiracy = sorted[Math.floor(Math.random() * Math.min(5, sorted.length))];
        
        conspiracy.mentioned++;
        return conspiracy;
    }

    // Format conspiracy as chat message
    formatConspiracyMessage(conspiracy) {
        const { theory, evidence, beliefLevel } = conspiracy;
        
        const intensity = beliefLevel > 80 ? 'GUYS' : 
                         beliefLevel > 60 ? 'okay so' :
                         beliefLevel > 40 ? 'hear me out' :
                         'random thought but';

        const certainty = beliefLevel > 80 ? 'i\'m 100% sure' :
                         beliefLevel > 60 ? 'i\'m pretty confident' :
                         beliefLevel > 40 ? 'i think' :
                         'maybe?';

        return `${intensity}: ${theory}. ${evidence}. ${certainty}`;
    }

    // Decrease paranoia over time
    decayParanoia(amount = 1) {
        this.paranoiaLevel = Math.max(0, this.paranoiaLevel - amount);
    }

    // Get paranoia status for context
    getParanoiaContext() {
        if (this.paranoiaLevel < 30) return null;

        const level = this.paranoiaLevel > 70 ? 'EXTREME' :
                     this.paranoiaLevel > 50 ? 'HIGH' :
                     'MODERATE';

        return `🔍 PARANOIA: ${level} (${this.paranoiaLevel}/100) - seeing patterns everywhere, connecting dots, trust issues`;
    }

    // Get status
    getStatus() {
        return {
            paranoiaLevel: this.paranoiaLevel,
            activeConspiracies: this.activeConspiracies.size,
            suspiciousEvents: this.suspiciousEvents.length
        };
    }
}

module.exports = ConspiracyGenerator;
