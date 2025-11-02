/**
 * ChatTheaterMode.js
 * Generate theatrical scripts and coordinate multi-user performances
 * Features: Script generation, role assignment, scene direction, improv scoring
 */

const fs = require('fs').promises;
const path = require('path');

class ChatTheaterMode {
    constructor() {
        this.activePlay = null;
        this.playHistory = [];
        this.actorPerformances = new Map();
        this.dataPath = path.join(__dirname, '../../data/chat_theater.json');
        
        // Theater genres
        this.genres = ['comedy', 'drama', 'absurdist', 'horror', 'romance', 'action'];
        
        // Scene templates
        this.sceneTemplates = {
            comedy: [
                { setup: 'Two strangers stuck in elevator', conflict: 'elevator breaks', resolution: 'bonding over shared trauma' },
                { setup: 'Job interview gone wrong', conflict: 'interviewer is insane', resolution: 'applicant becomes boss' },
                { setup: 'Roommate confrontation', conflict: 'who ate the last pizza', resolution: 'pizza was never real' }
            ],
            drama: [
                { setup: 'Old friends reunite', conflict: 'dark secret revealed', resolution: 'forgiveness or betrayal' },
                { setup: 'Family dinner', conflict: 'inheritance dispute', resolution: 'emotional breakdown' },
                { setup: 'Confrontation', conflict: 'years of resentment', resolution: 'cathartic confession' }
            ],
            absurdist: [
                { setup: 'People waiting for bus', conflict: 'bus might not exist', resolution: 'they were the bus all along' },
                { setup: 'Court trial', conflict: 'defendant is a concept', resolution: 'everyone becomes guilty' },
                { setup: 'Tea party', conflict: 'gravity stops working', resolution: 'tea becomes sentient' }
            ],
            horror: [
                { setup: 'Camping trip', conflict: 'strange noises', resolution: 'something in the dark' },
                { setup: 'New house', conflict: 'doors won\'t stay closed', resolution: 'they never left the house' },
                { setup: 'Group chat', conflict: 'unknown person joins', resolution: 'they\'ve been here all along' }
            ],
            romance: [
                { setup: 'Coffee shop meet-cute', conflict: 'misunderstanding', resolution: 'confession' },
                { setup: 'Ex encounters', conflict: 'unresolved feelings', resolution: 'closure or rekindling' },
                { setup: 'Online friends meet IRL', conflict: 'not what expected', resolution: 'deeper connection' }
            ],
            action: [
                { setup: 'Heist planning', conflict: 'betrayal', resolution: 'escape or capture' },
                { setup: 'Chase scene', conflict: 'running out of time', resolution: 'dramatic confrontation' },
                { setup: 'Standoff', conflict: 'moral dilemma', resolution: 'sacrifice or victory' }
            ]
        };

        this.load();
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            this.playHistory = saved.playHistory || [];
            
            for (const [key, value] of Object.entries(saved.actorPerformances || {})) {
                this.actorPerformances.set(key, value);
            }
            
            console.log(`[ChatTheater] Loaded ${this.playHistory.length} past performances`);
        } catch (error) {
            console.log('[ChatTheater] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                playHistory: this.playHistory.slice(-20),
                actorPerformances: Object.fromEntries(this.actorPerformances)
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[ChatTheater] Save error:', error.message);
        }
    }

    // Generate new play
    generatePlay(genre = null, participants = []) {
        if (!genre) {
            genre = this.genres[Math.floor(Math.random() * this.genres.length)];
        }

        const templates = this.sceneTemplates[genre];
        const template = templates[Math.floor(Math.random() * templates.length)];

        const play = {
            id: `play_${Date.now()}`,
            genre,
            title: this.generateTitle(genre),
            template,
            acts: this.generateActs(template, participants.length),
            roles: this.generateRoles(participants.length),
            cast: new Map(),
            currentAct: 0,
            currentScene: 0,
            status: 'casting',
            startedAt: Date.now(),
            director: 'Slunt',
            audience: new Set(),
            improvScores: new Map()
        };

        this.activePlay = play;
        
        console.log(`[ChatTheater] 🎭 New play: "${play.title}" (${genre})`);
        
        return play;
    }

    // Generate title
    generateTitle(genre) {
        const templates = {
            comedy: ['The Ridiculous Case of', 'Much Ado About', 'The Importance of Being', 'How I Met Your'],
            drama: ['Death of a', 'The Tragedy of', 'A Streetcar Named', 'Who\'s Afraid of'],
            absurdist: ['Waiting for', 'The Bald', 'Rhinoceros and', 'The Chairs of'],
            horror: ['The Haunting of', 'Night of the Living', 'The Silence of the', 'A Nightmare on'],
            romance: ['Love in the Time of', 'The Notebook of', 'Eternal Sunshine of the', 'When Harry Met'],
            action: ['Die Hard in', 'The Fast and the', 'Mission: Impossible', 'The Bourne']
        };

        const prefix = templates[genre][Math.floor(Math.random() * templates[genre].length)];
        const nouns = ['Chat', 'Discord', 'WiFi', 'DMs', 'Memes', 'Vibes', 'Chaos', 'Slunt'];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];

        return `${prefix} ${noun}`;
    }

    // Generate acts and scenes
    generateActs(template, numParticipants) {
        return [
            {
                actNumber: 1,
                title: 'Setup',
                scenes: [
                    { description: template.setup, duration: '2-3 lines per person' }
                ]
            },
            {
                actNumber: 2,
                title: 'Conflict',
                scenes: [
                    { description: template.conflict, duration: '3-4 lines per person' }
                ]
            },
            {
                actNumber: 3,
                title: 'Resolution',
                scenes: [
                    { description: template.resolution, duration: '2-3 lines per person' }
                ]
            }
        ];
    }

    // Generate roles
    generateRoles(numRoles) {
        const roleTypes = [
            { name: 'Protagonist', traits: ['brave', 'conflicted', 'determined'] },
            { name: 'Antagonist', traits: ['cunning', 'ruthless', 'misunderstood'] },
            { name: 'Comic Relief', traits: ['funny', 'oblivious', 'charming'] },
            { name: 'Wise Mentor', traits: ['cryptic', 'knowing', 'mysterious'] },
            { name: 'Love Interest', traits: ['alluring', 'complicated', 'supportive'] },
            { name: 'Wildcard', traits: ['unpredictable', 'chaotic', 'intense'] }
        ];

        return roleTypes.slice(0, Math.max(2, numRoles)).map((role, i) => ({
            ...role,
            id: i + 1,
            assigned: false
        }));
    }

    // Assign role to actor
    assignRole(username, roleId) {
        if (!this.activePlay) return null;

        const role = this.activePlay.roles.find(r => r.id === roleId);
        if (!role || role.assigned) return null;

        role.assigned = true;
        this.activePlay.cast.set(username, {
            username,
            role: role.name,
            roleId: role.id,
            linesDelivered: 0,
            improvScore: 0
        });

        // Initialize actor performance tracking
        if (!this.actorPerformances.has(username)) {
            this.actorPerformances.set(username, {
                username,
                totalPlays: 0,
                totalScore: 0,
                bestRole: null,
                favoriteGenre: null
            });
        }

        console.log(`[ChatTheater] ${username} cast as ${role.name}`);

        // Check if all roles assigned
        if (this.activePlay.roles.every(r => r.assigned)) {
            this.startPlay();
        }

        return { role: role.name, traits: role.traits };
    }

    // Start the play
    startPlay() {
        if (!this.activePlay) return;

        this.activePlay.status = 'active';
        this.activePlay.startedAt = Date.now();

        console.log(`[ChatTheater] 🎭 PLAY STARTING: "${this.activePlay.title}"`);

        return {
            message: `🎭 "${this.activePlay.title}" begins!\n\nAct ${this.activePlay.currentAct + 1}: ${this.activePlay.acts[this.activePlay.currentAct].title}`,
            scene: this.getCurrentScene()
        };
    }

    // Get current scene
    getCurrentScene() {
        if (!this.activePlay) return null;

        const act = this.activePlay.acts[this.activePlay.currentAct];
        return act.scenes[this.activePlay.currentScene];
    }

    // Deliver line (actor improvisation)
    deliverLine(username, line) {
        if (!this.activePlay || this.activePlay.status !== 'active') return null;

        const actor = this.activePlay.cast.get(username);
        if (!actor) return { error: 'not in cast' };

        actor.linesDelivered++;

        // Score improvisation
        const improvScore = this.scoreImprov(line, actor.role, this.activePlay.genre);
        actor.improvScore += improvScore;
        this.activePlay.improvScores.set(username, actor.improvScore);

        console.log(`[ChatTheater] ${username} (${actor.role}): improv score ${improvScore}/10`);

        return {
            improvScore,
            feedback: this.getDirectorFeedback(improvScore),
            continue: true
        };
    }

    // Score improvisation quality
    scoreImprov(line, role, genre) {
        let score = 5; // Base score

        // Length (too short or too long is bad)
        const words = line.split(' ').length;
        if (words >= 5 && words <= 30) {
            score += 2;
        }

        // Genre appropriate keywords
        const genreKeywords = {
            comedy: ['lmao', 'funny', 'joke', 'ridiculous', 'hilarious'],
            drama: ['why', 'never', 'always', 'can\'t', 'must'],
            absurdist: ['perhaps', 'meaning', 'exist', 'reality', 'impossible'],
            horror: ['dark', 'fear', 'shadow', 'scream', 'death'],
            romance: ['love', 'feel', 'heart', 'together', 'forever'],
            action: ['go', 'now', 'move', 'quick', 'fight']
        };

        const keywords = genreKeywords[genre] || [];
        for (const keyword of keywords) {
            if (line.toLowerCase().includes(keyword)) {
                score += 1;
            }
        }

        // Character consistency
        if (role === 'Comic Relief' && (line.includes('lol') || line.includes('lmao'))) {
            score += 1;
        }

        return Math.min(10, score);
    }

    // Get director feedback
    getDirectorFeedback(score) {
        if (score >= 8) {
            return ['brilliant!', 'perfect delivery', 'Oscar-worthy', 'chef\'s kiss'];
        } else if (score >= 6) {
            return ['good', 'solid work', 'that works', 'nice'];
        } else if (score >= 4) {
            return ['okay...', 'could be better', 'try again', 'meh'];
        } else {
            return ['cut!', 'what was that', 'you\'re fired', 'terrible'];
        }
    }

    // Advance to next scene/act
    advanceScene() {
        if (!this.activePlay) return null;

        const act = this.activePlay.acts[this.activePlay.currentAct];
        
        if (this.activePlay.currentScene < act.scenes.length - 1) {
            // Next scene in same act
            this.activePlay.currentScene++;
            return { type: 'scene', scene: this.getCurrentScene() };
        } else if (this.activePlay.currentAct < this.activePlay.acts.length - 1) {
            // Next act
            this.activePlay.currentAct++;
            this.activePlay.currentScene = 0;
            return { 
                type: 'act', 
                act: this.activePlay.acts[this.activePlay.currentAct],
                scene: this.getCurrentScene()
            };
        } else {
            // Play complete
            return this.endPlay();
        }
    }

    // End play
    endPlay() {
        if (!this.activePlay) return null;

        this.activePlay.status = 'completed';
        this.activePlay.completedAt = Date.now();

        // Calculate final scores
        const results = Array.from(this.activePlay.cast.values())
            .map(actor => ({
                username: actor.username,
                role: actor.role,
                improvScore: actor.improvScore,
                linesDelivered: actor.linesDelivered
            }))
            .sort((a, b) => b.improvScore - a.improvScore);

        // Update actor stats
        for (const result of results) {
            const perf = this.actorPerformances.get(result.username);
            if (perf) {
                perf.totalPlays++;
                perf.totalScore += result.improvScore;
                if (!perf.bestRole || result.improvScore > perf.totalScore / perf.totalPlays) {
                    perf.bestRole = result.role;
                }
            }
        }

        // Archive play
        this.playHistory.push({
            title: this.activePlay.title,
            genre: this.activePlay.genre,
            completedAt: this.activePlay.completedAt,
            cast: Array.from(this.activePlay.cast.keys()),
            winner: results[0]
        });

        const winner = results[0];
        
        console.log(`[ChatTheater] 🎭 Play complete! Winner: ${winner.username}`);

        this.save();

        this.activePlay = null;

        return {
            type: 'finale',
            results,
            winner,
            message: `🎭 THE END\n\nBest Performance: ${winner.username} as ${winner.role} (${winner.improvScore} points)`
        };
    }

    // Get theater context
    getTheaterContext() {
        if (!this.activePlay) return null;

        if (this.activePlay.status === 'casting') {
            return `🎭 CASTING: "${this.activePlay.title}" (${this.activePlay.genre})\nRoles available: ${this.activePlay.roles.filter(r => !r.assigned).map(r => r.name).join(', ')}`;
        }

        if (this.activePlay.status === 'active') {
            const scene = this.getCurrentScene();
            return `🎭 PERFORMANCE IN PROGRESS: "${this.activePlay.title}"\nAct ${this.activePlay.currentAct + 1}, Scene: ${scene.description}\nYou are the director. Give feedback and advance scenes.`;
        }

        return null;
    }

    getStatus() {
        return {
            activePlay: this.activePlay ? {
                title: this.activePlay.title,
                genre: this.activePlay.genre,
                status: this.activePlay.status,
                cast: Array.from(this.activePlay.cast.keys())
            } : null,
            totalPlays: this.playHistory.length,
            totalActors: this.actorPerformances.size
        };
    }
}

module.exports = ChatTheaterMode;
