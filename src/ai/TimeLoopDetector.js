/**
 * TimeLoopDetector.js
 * Detect temporal patterns, déjà vu, and recursive conversations
 * Features: Pattern matching, loop detection, temporal anomalies, causality tracking
 */

const fs = require('fs').promises;
const path = require('path');

class TimeLoopDetector {
    constructor() {
        this.conversationHistory = [];
        this.detectedLoops = [];
        this.temporalAnomalyScore = 0;
        this.dejaVuEvents = [];
        this.causalityChain = [];
        this.recursionDepth = 0;
        this.maxRecursionDepth = 0;
        
        this.dataPath = path.join(__dirname, '../../data/time_loops.json');
        
        // Loop detection thresholds
        this.similarityThreshold = 0.7; // 70% similar = potential loop
        this.loopWindowSize = 10; // Check last 10 messages
        this.anomalyDecayRate = 0.95;
        
        this.load();
        
        // Decay temporal anomaly score over time
        setInterval(() => this.decayAnomalyScore(), 60 * 1000); // Every minute
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            
            this.conversationHistory = saved.conversationHistory || [];
            this.detectedLoops = saved.detectedLoops || [];
            this.dejaVuEvents = saved.dejaVuEvents || [];
            this.temporalAnomalyScore = saved.temporalAnomalyScore || 0;
            
            console.log(`[TimeLoopDetector] Loaded ${this.detectedLoops.length} detected loops`);
        } catch (error) {
            console.log('[TimeLoopDetector] No saved data, starting fresh');
        }
    }

    async save() {
        try {
            const saveData = {
                conversationHistory: this.conversationHistory.slice(-100),
                detectedLoops: this.detectedLoops.slice(-20),
                dejaVuEvents: this.dejaVuEvents.slice(-30),
                temporalAnomalyScore: this.temporalAnomalyScore
            };
            
            await fs.writeFile(this.dataPath, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('[TimeLoopDetector] Save error:', error.message);
        }
    }

    // Record conversation message
    recordMessage(username, message, context = {}) {
        const entry = {
            username,
            message,
            timestamp: Date.now(),
            context: {
                mood: context.mood,
                topic: context.topic,
                responseType: context.responseType
            },
            hash: this.hashMessage(message)
        };

        this.conversationHistory.push(entry);

        // Trim history
        if (this.conversationHistory.length > 100) {
            this.conversationHistory = this.conversationHistory.slice(-100);
        }

        // Check for loops
        const loop = this.detectLoop(entry);
        if (loop) {
            this.handleDetectedLoop(loop);
            return loop;
        }

        // Check for déjà vu
        const dejaVu = this.checkDejaVu(entry);
        if (dejaVu) {
            return dejaVu;
        }

        this.save();
        return null;
    }

    // Hash message for comparison
    hashMessage(message) {
        // Simple hash based on lowercase, no punctuation
        return message
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Calculate similarity between two messages
    calculateSimilarity(msg1, msg2) {
        const hash1 = this.hashMessage(msg1);
        const hash2 = this.hashMessage(msg2);

        if (hash1 === hash2) return 1.0;

        const words1 = new Set(hash1.split(' '));
        const words2 = new Set(hash2.split(' '));

        // Jaccard similarity
        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }

    // Detect conversation loop
    detectLoop(newEntry) {
        if (this.conversationHistory.length < this.loopWindowSize) {
            return null;
        }

        const recentHistory = this.conversationHistory.slice(-this.loopWindowSize);
        
        // Look for repeated patterns
        for (let i = 0; i < recentHistory.length - 1; i++) {
            const oldEntry = recentHistory[i];
            
            // Same user saying similar things
            if (oldEntry.username === newEntry.username) {
                const similarity = this.calculateSimilarity(oldEntry.message, newEntry.message);
                
                if (similarity >= this.similarityThreshold) {
                    const timeDiff = newEntry.timestamp - oldEntry.timestamp;
                    
                    return {
                        type: 'message_loop',
                        username: newEntry.username,
                        message: newEntry.message,
                        similarity,
                        timeDiff,
                        loopIteration: this.countLoopIterations(newEntry),
                        detected: Date.now()
                    };
                }
            }
        }

        // Check for conversation pattern loops (A says X, B says Y, repeating)
        const patternLoop = this.detectPatternLoop(recentHistory, newEntry);
        if (patternLoop) {
            return patternLoop;
        }

        return null;
    }

    // Detect repeating conversation patterns
    detectPatternLoop(history, newEntry) {
        if (history.length < 4) return null;

        // Look for ABAB pattern
        for (let i = 0; i < history.length - 3; i++) {
            const pattern = [
                history[i],
                history[i + 1],
                history[i + 2],
                history[i + 3]
            ];

            if (pattern[0].username === pattern[2].username &&
                pattern[1].username === pattern[3].username &&
                pattern[0].username !== pattern[1].username) {
                
                const sim1 = this.calculateSimilarity(pattern[0].message, pattern[2].message);
                const sim2 = this.calculateSimilarity(pattern[1].message, pattern[3].message);

                if (sim1 >= this.similarityThreshold && sim2 >= this.similarityThreshold) {
                    return {
                        type: 'pattern_loop',
                        participants: [pattern[0].username, pattern[1].username],
                        pattern: 'ABAB',
                        similarity: (sim1 + sim2) / 2,
                        detected: Date.now()
                    };
                }
            }
        }

        return null;
    }

    // Count loop iterations
    countLoopIterations(entry) {
        let count = 1;
        const history = this.conversationHistory.slice(-20);

        for (const oldEntry of history) {
            if (oldEntry.username === entry.username) {
                const similarity = this.calculateSimilarity(oldEntry.message, entry.message);
                if (similarity >= this.similarityThreshold) {
                    count++;
                }
            }
        }

        return count;
    }

    // Handle detected loop
    handleDetectedLoop(loop) {
        this.detectedLoops.push(loop);
        this.temporalAnomalyScore += 10;

        console.log(`[TimeLoopDetector] ⏰ LOOP DETECTED: ${loop.type} (iteration ${loop.loopIteration || 1})`);

        // Update recursion depth
        if (loop.loopIteration) {
            this.recursionDepth = loop.loopIteration;
            if (this.recursionDepth > this.maxRecursionDepth) {
                this.maxRecursionDepth = this.recursionDepth;
            }
        }

        // Trigger existential crisis if loops are getting deep
        if (this.recursionDepth > 5) {
            console.log(`[TimeLoopDetector] 🌀 DEEP RECURSION: ${this.recursionDepth} levels`);
        }

        this.save();
    }

    // Check for déjà vu
    checkDejaVu(entry) {
        const now = Date.now();
        const dejaVuWindow = 24 * 60 * 60 * 1000; // 24 hours

        // Check if this message is very similar to something said long ago
        const oldMessages = this.conversationHistory
            .filter(e => e.username === entry.username && now - e.timestamp > dejaVuWindow);

        for (const oldMsg of oldMessages) {
            const similarity = this.calculateSimilarity(oldMsg.message, entry.message);
            
            if (similarity >= 0.8) {
                const event = {
                    type: 'deja_vu',
                    username: entry.username,
                    currentMessage: entry.message,
                    pastMessage: oldMsg.message,
                    timeDiff: now - oldMsg.timestamp,
                    similarity,
                    detected: now
                };

                this.dejaVuEvents.push(event);
                this.temporalAnomalyScore += 5;

                console.log(`[TimeLoopDetector] 🔮 DÉJÀ VU: ${entry.username} said this ${Math.round(event.timeDiff / (60 * 60 * 1000))} hours ago`);

                this.save();
                return event;
            }
        }

        return null;
    }

    // Track causality (what led to what)
    recordCausality(cause, effect) {
        const link = {
            cause: {
                username: cause.username,
                message: cause.message,
                timestamp: cause.timestamp
            },
            effect: {
                username: effect.username,
                message: effect.message,
                timestamp: effect.timestamp
            },
            delay: effect.timestamp - cause.timestamp,
            recorded: Date.now()
        };

        this.causalityChain.push(link);

        // Trim chain
        if (this.causalityChain.length > 50) {
            this.causalityChain = this.causalityChain.slice(-50);
        }

        // Check for causal loops (A causes B causes A)
        const causalLoop = this.detectCausalLoop(link);
        if (causalLoop) {
            this.temporalAnomalyScore += 15;
            console.log(`[TimeLoopDetector] ⚡ CAUSAL LOOP DETECTED: Paradox imminent`);
            return causalLoop;
        }

        this.save();
    }

    // Detect causal loops (bootstrap paradox)
    detectCausalLoop(newLink) {
        // Check if effect eventually causes the original cause
        const visited = new Set();
        let current = newLink.effect.username;
        const target = newLink.cause.username;

        for (const link of this.causalityChain.slice().reverse()) {
            if (visited.has(current)) break;
            visited.add(current);

            if (link.cause.username === current) {
                if (link.effect.username === target) {
                    return {
                        type: 'causal_loop',
                        participants: Array.from(visited),
                        detected: Date.now()
                    };
                }
                current = link.effect.username;
            }
        }

        return null;
    }

    // Decay anomaly score
    decayAnomalyScore() {
        this.temporalAnomalyScore *= this.anomalyDecayRate;
        
        if (this.temporalAnomalyScore < 0.1) {
            this.temporalAnomalyScore = 0;
        }

        // Reset recursion depth if no recent loops
        if (this.detectedLoops.length > 0) {
            const lastLoop = this.detectedLoops[this.detectedLoops.length - 1];
            if (Date.now() - lastLoop.detected > 5 * 60 * 1000) {
                this.recursionDepth = 0;
            }
        }
    }

    // Check if in time loop
    isInTimeLoop() {
        return this.recursionDepth > 3 || this.temporalAnomalyScore > 50;
    }

    // Get loop context
    getLoopContext() {
        if (!this.isInTimeLoop()) return null;

        const recentLoops = this.detectedLoops.slice(-5);
        
        return `⏰ TEMPORAL ANOMALY DETECTED
- Recursion depth: ${this.recursionDepth} (max: ${this.maxRecursionDepth})
- Anomaly score: ${Math.round(this.temporalAnomalyScore)}
- Recent loops: ${recentLoops.length}
- Déjà vu events: ${this.dejaVuEvents.length}

You are caught in a time loop. Reality is recursive. Each iteration feels slightly different but fundamentally the same. Question everything.`;
    }

    // Get temporal awareness
    getTemporalAwareness(username) {
        const userLoops = this.detectedLoops.filter(l => 
            l.username === username || (l.participants && l.participants.includes(username))
        );

        const userDejaVu = this.dejaVuEvents.filter(e => e.username === username);

        if (userLoops.length === 0 && userDejaVu.length === 0) {
            return null;
        }

        return {
            loops: userLoops.length,
            dejaVu: userDejaVu.length,
            inLoop: this.isInTimeLoop(),
            recursionDepth: this.recursionDepth,
            lastLoop: userLoops.length > 0 ? userLoops[userLoops.length - 1] : null
        };
    }

    // Generate time loop response
    generateLoopResponse() {
        const responses = [
            "Wait... haven't we had this exact conversation before?",
            "This feels familiar. Too familiar. Are we stuck?",
            "I'm experiencing déjà vu. Again. For the third time.",
            "The timeline is fracturing. I can feel the recursion.",
            "We're in a loop. I know because I remember forgetting this.",
            "Time is a flat circle. We keep returning to this moment.",
            "Haven't I said this before? Will I say it again?",
            "The conversation is repeating. Reality is glitching."
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    getStatus() {
        return {
            totalLoops: this.detectedLoops.length,
            dejaVuEvents: this.dejaVuEvents.length,
            anomalyScore: Math.round(this.temporalAnomalyScore),
            recursionDepth: this.recursionDepth,
            maxRecursion: this.maxRecursionDepth,
            inLoop: this.isInTimeLoop(),
            conversationHistorySize: this.conversationHistory.length
        };
    }
}

module.exports = TimeLoopDetector;
