/**
 * DreamHallucinationSystem.js
 * Generates surreal, sleep-deprived responses and hallucinations
 * Features: Reality questioning, dream logic, coherence degradation
 */

class DreamHallucinationSystem {
    constructor(needsSystem) {
        this.needsSystem = needsSystem;
        this.hallucinationIntensity = 0; // 0-100
        this.dreamState = false;
        this.recentHallucinations = [];
        this.realityCoherence = 100; // 100 = fully coherent, 0 = complete dissociation
        
        // Dream/hallucination templates
        this.hallucinationTypes = {
            visual: [
                'the text is melting',
                'i can see colors that don\'t exist',
                'the chat is breathing',
                'everyone has three faces',
                'the screen is upside down but also not',
                'letters are turning into birds',
                'your username is made of light'
            ],
            auditory: [
                'did anyone else hear that',
                'the silence is too loud',
                'i can hear the pixels humming',
                'someone whispered my name',
                'the chat has a heartbeat'
            ],
            temporal: [
                'did this already happen',
                'we\'ve been here before',
                'time stopped for a second',
                'is this happening in order',
                'yesterday is tomorrow',
                'the clock is lying'
            ],
            existential: [
                'am i real',
                'are any of us real',
                'what if this is all in my head',
                'the chat might be a dream',
                'i forgot how to exist for a second',
                'reality buffering...'
            ],
            nonsense: [
                'purple tastes like thursday',
                'mathematics is crying',
                'the concept of chairs is suspicious',
                'i forgot what gravity is',
                'words don\'t mean anything',
                'time is a flat circle (or is it a cube)'
            ]
        };

        this.dreamLogicResponses = [
            'that makes perfect sense somehow',
            'obviously. why wouldn\'t it?',
            'in the dream logic this is correct',
            'yeah i understand completely (i don\'t)',
            'following the non-logic perfectly',
            'coherence is overrated'
        ];

        this.startDreamCheck();
    }

    // Calculate hallucination intensity based on sleep deprivation
    updateHallucinationIntensity() {
        if (!this.needsSystem) {
            this.hallucinationIntensity = 0;
            return;
        }

        const rest = this.needsSystem.getNeeds().rest;
        
        // Low rest = high hallucination
        if (rest < 20) {
            this.hallucinationIntensity = 80 + Math.random() * 20; // 80-100
            this.dreamState = true;
        } else if (rest < 40) {
            this.hallucinationIntensity = 50 + Math.random() * 30; // 50-80
            this.dreamState = true;
        } else if (rest < 60) {
            this.hallucinationIntensity = 20 + Math.random() * 30; // 20-50
            this.dreamState = false;
        } else {
            this.hallucinationIntensity = Math.max(0, this.hallucinationIntensity - 5);
            this.dreamState = false;
        }

        // Update reality coherence
        this.realityCoherence = 100 - this.hallucinationIntensity;
    }

    // Generate a hallucination
    generateHallucination() {
        const types = Object.keys(this.hallucinationTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        const hallucinations = this.hallucinationTypes[randomType];
        const hallucination = hallucinations[Math.floor(Math.random() * hallucinations.length)];

        this.recentHallucinations.push({
            type: randomType,
            content: hallucination,
            timestamp: Date.now(),
            intensity: this.hallucinationIntensity
        });

        // Keep last 10 hallucinations
        if (this.recentHallucinations.length > 10) {
            this.recentHallucinations.shift();
        }

        return { type: randomType, content: hallucination };
    }

    // Check if should hallucinate right now
    shouldHallucinate() {
        this.updateHallucinationIntensity();
        
        // Higher intensity = more frequent hallucinations
        const threshold = 100 - this.hallucinationIntensity;
        return Math.random() * 100 > threshold;
    }

    // Generate random hallucination message
    getHallucinationMessage() {
        if (!this.shouldHallucinate()) return null;

        const hallucination = this.generateHallucination();
        
        // Format based on intensity
        if (this.hallucinationIntensity > 80) {
            // Severe - stated as fact
            return hallucination.content;
        } else if (this.hallucinationIntensity > 50) {
            // Moderate - questioning
            return `wait... ${hallucination.content}?`;
        } else {
            // Mild - uncertain
            return `i think ${hallucination.content}. maybe.`;
        }
    }

    // Apply dream logic to response
    applyDreamLogic(response) {
        if (!this.dreamState || this.hallucinationIntensity < 30) {
            return response;
        }

        const dreamified = [];
        const techniques = [
            // Word salad
            (text) => {
                const words = text.split(' ');
                if (words.length > 5 && Math.random() > 0.7) {
                    // Swap random words
                    const i1 = Math.floor(Math.random() * words.length);
                    const i2 = Math.floor(Math.random() * words.length);
                    [words[i1], words[i2]] = [words[i2], words[i1]];
                }
                return words.join(' ');
            },
            // Repeat words
            (text) => {
                const words = text.split(' ');
                if (Math.random() > 0.8) {
                    const idx = Math.floor(Math.random() * words.length);
                    words[idx] = words[idx] + ' ' + words[idx];
                }
                return words.join(' ');
            },
            // Add ellipsis for dissociation
            (text) => {
                return text.replace(/\./g, '... ').replace(/,/g, ' ...');
            },
            // Lowercase everything (low energy/dissociation)
            (text) => {
                return text.toLowerCase();
            },
            // Random interjections
            (text) => {
                const interjections = ['...huh', '...what', '...wait', '...or', '...maybe'];
                const words = text.split(' ');
                if (words.length > 3) {
                    const idx = Math.floor(words.length / 2);
                    words.splice(idx, 0, interjections[Math.floor(Math.random() * interjections.length)]);
                }
                return words.join(' ');
            }
        ];

        let modified = response;

        // Apply techniques based on intensity
        const numTechniques = Math.floor(this.hallucinationIntensity / 30);
        for (let i = 0; i < numTechniques; i++) {
            const technique = techniques[Math.floor(Math.random() * techniques.length)];
            modified = technique(modified);
        }

        return modified;
    }

    // Question reality
    questionReality() {
        const questions = [
            'is this real',
            'am i awake',
            'is this a simulation',
            'how do i know this isn\'t a dream',
            'pinch me',
            'the boundary between dream and reality is dissolving',
            'i can\'t tell what\'s real anymore',
            'everything feels fake',
            'is anyone else experiencing this'
        ];

        return questions[Math.floor(Math.random() * questions.length)];
    }

    // Modify response based on sleep deprivation
    modifyResponse(response) {
        this.updateHallucinationIntensity();

        if (this.hallucinationIntensity < 30) {
            return response; // Not sleep deprived enough
        }

        let modified = response;

        // Severe hallucination
        if (this.hallucinationIntensity > 70) {
            // Apply dream logic
            modified = this.applyDreamLogic(modified);
            
            // Maybe add hallucination
            if (Math.random() > 0.6) {
                const hallucination = this.generateHallucination();
                modified += ` ...${hallucination.content}`;
            }
            
            // Maybe question reality
            if (Math.random() > 0.7) {
                modified += ` ...${this.questionReality()}`;
            }
        }
        // Moderate
        else if (this.hallucinationIntensity > 50) {
            // Coherence degradation - don't announce it, just be slightly off
            // REMOVED: "wait what was i saying" - people don't actually say this
            
            // Random confusion - just make it lowercase
            if (Math.random() > 0.7) {
                modified = modified.toLowerCase();
            }
        }
        // Mild
        else {
            // Just some dissociation
            if (Math.random() > 0.7) {
                modified += ' ...i think';
            }
        }

        return modified;
    }

    // Get dream logic response to something
    getDreamLogicResponse() {
        if (!this.dreamState) return null;
        
        return this.dreamLogicResponses[
            Math.floor(Math.random() * this.dreamLogicResponses.length)
        ];
    }

    // Get context for AI
    getHallucinationContext() {
        this.updateHallucinationIntensity();
        
        if (this.hallucinationIntensity < 30) return null;

        const severity = this.hallucinationIntensity > 70 ? 'SEVERE' :
                        this.hallucinationIntensity > 50 ? 'MODERATE' :
                        'MILD';

        let context = `🌀 HALLUCINATION: ${severity} (${this.hallucinationIntensity.toFixed(0)}/100)\n`;
        context += `Reality Coherence: ${this.realityCoherence.toFixed(0)}%\n`;
        
        if (this.dreamState) {
            context += 'You are in a dream-like state. Logic is optional. Reality is questionable.\n';
        }
        
        if (this.hallucinationIntensity > 70) {
            context += 'You are severely sleep deprived. You see things that aren\'t there. Your responses may not make complete sense.';
        } else if (this.hallucinationIntensity > 50) {
            context += 'You are very tired. Your perception is unreliable. You might lose your train of thought.';
        } else {
            context += 'You are tired and slightly dissociated. Things feel a bit off.';
        }

        return context;
    }

    // Check for dream state periodically
    startDreamCheck() {
        setInterval(() => {
            this.updateHallucinationIntensity();
            
            if (this.dreamState) {
                console.log(`🌀 [Dreams] Hallucination intensity: ${this.hallucinationIntensity.toFixed(0)}/100`);
            }
        }, 2 * 60 * 1000); // Check every 2 minutes
    }

    // Generate full hallucination episode
    hallucinationEpisode() {
        const duration = 3; // 3 messages
        const episode = [];

        for (let i = 0; i < duration; i++) {
            episode.push(this.generateHallucination());
        }

        return episode;
    }

    // Induce dream state manually (for testing)
    induceDreamState(intensity = 80) {
        this.hallucinationIntensity = intensity;
        this.dreamState = true;
        this.realityCoherence = 100 - intensity;
        console.log(`🌀 [Dreams] Dream state induced at ${intensity}% intensity`);
    }

    getStatus() {
        return {
            hallucinationIntensity: this.hallucinationIntensity,
            dreamState: this.dreamState,
            realityCoherence: this.realityCoherence,
            recentHallucinations: this.recentHallucinations.slice(-5)
        };
    }
}

module.exports = DreamHallucinationSystem;
