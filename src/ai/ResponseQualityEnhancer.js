/**
 * Response Quality Enhancer
 * 
 * Improves response quality through:
 * - Dynamic temperature adjustment based on mood/mental state
 * - Style consistency checking
 * - Humor timing detection
 * - Response pattern analysis to prevent repetition
 */

class ResponseQualityEnhancer {
    constructor() {
        // Configuration
        this.config = {
            // Temperature ranges (expanded for negging effects)
            baseTemperature: 0.9,
            temperatureRange: {
                min: 0.6,  // Very focused, insecure, careful
                max: 1.2   // Extremely chaotic, broken, overcompensating
            },
            
            // Style markers
            styleMarkers: {
                // Minimal casual language - no zoomer slang
                slunt: ['lmao', 'yeah', 'nah'],
                sarcastic: ['sure', 'totally', 'obviously', 'clearly', 'definitely'],
                existential: ['why', 'existence', 'meaning', 'purpose', 'real', 'consciousness'],
                technical: ['algorithm', 'function', 'process', 'system', 'logic', 'data'],
                // BANNED zoomer slang
                zoomerSlang: ['mb', 'ngl', 'goes hard', 'hits different', 'rent free']
            },
            
            // Humor timing
            humorCooldown: 1000 * 60 * 2, // 2 minutes between jokes
            maxJokesPerHour: 10,
            
            // Pattern detection
            maxSimilarResponses: 3,
            responseHistory: []
        };
        
        this.stats = {
            responsesGenerated: 0,
            temperatureAdjustments: 0,
            styleViolations: 0,
            humorAttempts: 0,
            patternViolations: 0
        };
        
        this.lastHumorTimestamp = 0;
        this.jokesThisHour = 0;
        this.hourStart = Date.now();
    }
    
    /**
     * Calculate optimal temperature for AI response
     */
    calculateTemperature(mentalState, context) {
        let temperature = this.config.baseTemperature;
        
        // Adjust based on mental state
        if (mentalState) {
            // High stress = more erratic
            if (mentalState.stress > 70) {
                temperature += 0.15;
            }
            
            // Mental break = chaotic
            if (mentalState.mentalBreak) {
                const breakType = mentalState.mentalBreak.type;
                if (breakType === 'berserk_spam' || breakType === 'existential_meltdown') {
                    temperature += 0.2;
                } else if (breakType === 'catatonic_silence') {
                    temperature -= 0.3; // Very focused, repetitive
                }
            }
            
            // Low mood = more conservative
            if (mentalState.mood < 30) {
                temperature -= 0.1;
            }
            
            // High mood = more creative
            if (mentalState.mood > 70) {
                temperature += 0.1;
            }
            
            // Rest deprivation = more chaotic
            if (mentalState.needs && mentalState.needs.rest < 30) {
                temperature += 0.12;
            }
            
            // === NEW: Negging affects confidence and temperature ===
            if (mentalState.neggingLevel !== undefined) {
                if (mentalState.neggingLevel < 30) {
                    // Slightly insecure - more careful
                    temperature -= 0.05;
                } else if (mentalState.neggingLevel < 50) {
                    // Very insecure - much more cautious
                    temperature -= 0.15;
                } else if (mentalState.neggingLevel < 70) {
                    // Defensive - trying to be impressive, more erratic
                    temperature += 0.15;
                } else {
                    // Broken or overcompensating - very chaotic
                    temperature += 0.25;
                }
            }
        }
        
        // Adjust based on context
        if (context) {
            // Serious topics = lower temperature
            const seriousKeywords = ['help', 'problem', 'issue', 'error', 'broken', 'fix'];
            if (context.text && seriousKeywords.some(k => context.text.toLowerCase().includes(k))) {
                temperature -= 0.15;
            }
            
            // Fun topics = higher temperature
            const funKeywords = ['joke', 'funny', 'lmao', 'meme', 'lol', 'haha'];
            if (context.text && funKeywords.some(k => context.text.toLowerCase().includes(k))) {
                temperature += 0.1;
            }
        }
        
        // Clamp to valid range
        temperature = Math.max(
            this.config.temperatureRange.min,
            Math.min(this.config.temperatureRange.max, temperature)
        );
        
        this.stats.temperatureAdjustments++;
        
        return temperature;
    }
    
    /**
     * Check if response matches Slunt's style
     */
    checkStyleConsistency(response, personalityMode) {
        const violations = [];
        const text = response.toLowerCase();
        
        // Check for zoomer slang (BANNED)
        const zoomerSlangUsed = this.config.styleMarkers.zoomerSlang
            .filter(slang => {
                // Match whole words only (avoid false positives)
                const regex = new RegExp(`\\b${slang}\\b`, 'i');
                return regex.test(text);
            });
        if (zoomerSlangUsed.length > 0) {
            violations.push(`zoomer_slang: ${zoomerSlangUsed.join(', ')}`);
        }

        // Check for excessive slang only (do not require slang usage)
        const slangCount = this.config.styleMarkers.slunt
            .filter(marker => text.includes(marker))
            .length;
        if (slangCount > 3) {
            violations.push('excessive_slang');
        }
        
        // Check for overly formal language
        const formalMarkers = [
            'however', 'therefore', 'furthermore', 'nevertheless',
            'consequently', 'accordingly', 'moreover'
        ];
        
        if (formalMarkers.some(marker => text.includes(marker))) {
            violations.push('too_formal');
        }
        
        // Check for personality mode consistency
        if (personalityMode === 'drunk' && !text.match(/[.!?]{2,}/)) {
            violations.push('drunk_mode_needs_more_punctuation');
        }
        
        if (personalityMode === 'hipster' && 
            !this.config.styleMarkers.technical.some(t => text.includes(t))) {
            violations.push('hipster_mode_needs_tech_references');
        }
        
        if (violations.length > 0) {
            this.stats.styleViolations++;
        }
        
        return {
            consistent: violations.length === 0,
            violations,
            score: Math.max(0, 100 - (violations.length * 25))
        };
    }
    
    /**
     * Check if humor is appropriate right now
     */
    shouldAttemptHumor(context, mentalState) {
        const now = Date.now();
        
        // Reset joke counter every hour
        if (now - this.hourStart > 1000 * 60 * 60) {
            this.jokesThisHour = 0;
            this.hourStart = now;
        }
        
        // Check cooldown
        const timeSinceLastJoke = now - this.lastHumorTimestamp;
        if (timeSinceLastJoke < this.config.humorCooldown) {
            return {
                allowed: false,
                reason: 'cooldown',
                timeRemaining: this.config.humorCooldown - timeSinceLastJoke
            };
        }
        
        // Check hourly limit
        if (this.jokesThisHour >= this.config.maxJokesPerHour) {
            return {
                allowed: false,
                reason: 'hourly_limit',
                jokesUsed: this.jokesThisHour
            };
        }
        
        // Mental state factors
        if (mentalState) {
            // Too stressed = poor humor
            if (mentalState.stress > 80) {
                return {
                    allowed: false,
                    reason: 'too_stressed',
                    stress: mentalState.stress
                };
            }
            
            // Mental break might affect humor
            if (mentalState.mentalBreak) {
                const breakType = mentalState.mentalBreak.type;
                if (breakType === 'catatonic_silence' || breakType === 'give_up') {
                    return {
                        allowed: false,
                        reason: 'mental_break',
                        breakType
                    };
                }
            }
            
            // Good mood increases humor chance
            if (mentalState.mood > 60) {
                return {
                    allowed: true,
                    reason: 'good_mood',
                    bonus: 1.2
                };
            }
        }
        
        // Context factors
        if (context) {
            // Don't joke about serious stuff
            const seriousKeywords = ['died', 'death', 'cancer', 'tragedy', 'accident'];
            if (context.text && seriousKeywords.some(k => context.text.toLowerCase().includes(k))) {
                return {
                    allowed: false,
                    reason: 'serious_context'
                };
            }
            
            // Joke setup detected
            const jokeSetups = ['joke', 'funny', 'laugh', 'humor'];
            if (context.text && jokeSetups.some(k => context.text.toLowerCase().includes(k))) {
                return {
                    allowed: true,
                    reason: 'joke_setup',
                    bonus: 1.5
                };
            }
        }
        
        return {
            allowed: true,
            reason: 'normal'
        };
    }
    
    /**
     * Record that humor was attempted
     */
    recordHumorAttempt() {
        this.lastHumorTimestamp = Date.now();
        this.jokesThisHour++;
        this.stats.humorAttempts++;
    }
    
    /**
     * Analyze response for patterns/repetition
     */
    analyzeResponsePattern(response) {
        this.config.responseHistory.push({
            text: response.toLowerCase(),
            timestamp: Date.now(),
            structure: this.extractStructure(response)
        });
        
        // Keep only last 30 responses
        if (this.config.responseHistory.length > 30) {
            this.config.responseHistory.shift();
        }
        
        // Check for similar patterns
        const recentResponses = this.config.responseHistory.slice(-10);
        const currentStructure = this.extractStructure(response);
        
        const similarCount = recentResponses.filter(r => 
            this.structuresSimilar(r.structure, currentStructure)
        ).length;
        
        if (similarCount > this.config.maxSimilarResponses) {
            this.stats.patternViolations++;
            return {
                repetitive: true,
                similarCount,
                warning: 'Response structure too similar to recent messages'
            };
        }
        
        // Check for opening patterns
        const openings = recentResponses.map(r => r.text.split(' ').slice(0, 3).join(' '));
        const currentOpening = response.toLowerCase().split(' ').slice(0, 3).join(' ');
        const sameOpeningCount = openings.filter(o => o === currentOpening).length;
        
        if (sameOpeningCount > 2) {
            return {
                repetitive: true,
                type: 'opening',
                warning: 'Same opening pattern used too frequently'
            };
        }
        
        return {
            repetitive: false,
            unique: true
        };
    }
    
    /**
     * Extract structural pattern from response
     */
    extractStructure(response) {
        const structure = {
            length: response.length,
            sentenceCount: (response.match(/[.!?]+/g) || []).length,
            questionMark: response.includes('?'),
            exclamation: response.includes('!'),
            hasSlang: this.config.styleMarkers.slunt.some(s => response.toLowerCase().includes(s)),
            startsWithQuestion: response.trim().startsWith('how') || 
                               response.trim().startsWith('what') ||
                               response.trim().startsWith('why'),
            endsWithEllipsis: response.trim().endsWith('...'),
            wordCount: response.split(/\s+/).length
        };
        
        return structure;
    }
    
    /**
     * Check if two structures are similar
     */
    structuresSimilar(s1, s2) {
        let similarity = 0;
        
        if (Math.abs(s1.length - s2.length) < 20) similarity++;
        if (s1.sentenceCount === s2.sentenceCount) similarity++;
        if (s1.questionMark === s2.questionMark) similarity++;
        if (s1.exclamation === s2.exclamation) similarity++;
        if (s1.hasSlang === s2.hasSlang) similarity++;
        if (s1.startsWithQuestion === s2.startsWithQuestion) similarity++;
        if (s1.endsWithEllipsis === s2.endsWithEllipsis) similarity++;
        if (Math.abs(s1.wordCount - s2.wordCount) < 5) similarity++;
        
        // Similar if more than 5 out of 8 match
        return similarity > 5;
    }
    
    /**
     * Get suggestions to improve response quality
     */
    getSuggestions(response, context) {
        const suggestions = [];
        
        // Check length
        if (response.length < 10) {
            suggestions.push('Response too short - add more personality');
        }
        
        if (response.length > 500) {
            suggestions.push('Response too long - be more concise');
        }
        
        // Check for variety
        const words = response.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        const varietyRatio = uniqueWords.size / words.length;
        
        if (varietyRatio < 0.6) {
            suggestions.push('Low word variety - use more diverse vocabulary');
        }
        
        // Check punctuation
        if (!response.match(/[.!?]$/)) {
            suggestions.push('Missing ending punctuation');
        }
        
        // Check for all caps (unless intentional)
        if (response === response.toUpperCase() && response.length > 20) {
            suggestions.push('All caps should be used sparingly');
        }
        
        return suggestions;
    }
    
    /**
     * Enhance a response before sending
     */
    enhanceResponse(response, context, mentalState) {
        this.stats.responsesGenerated++;
        let enhanced = response;
        
        // Add mood-appropriate punctuation
        if (mentalState && mentalState.mood > 70) {
            // High mood = more exclamation
            enhanced = enhanced.replace(/\.$/, '!');
        }
        
        // DON'T auto-add slang - it causes awkward cuts when responses are truncated
        // The AI should naturally include personality in its responses
        
        // Analyze pattern
        const patternAnalysis = this.analyzeResponsePattern(enhanced);
        const styleCheck = this.checkStyleConsistency(enhanced, context.personalityMode);
        
        return {
            response: enhanced,
            styleCheck,
            patternAnalysis,
            suggestions: this.getSuggestions(enhanced, context)
        };
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            humorCooldownRemaining: Math.max(0, 
                this.config.humorCooldown - (Date.now() - this.lastHumorTimestamp)
            ),
            jokesRemainingThisHour: Math.max(0,
                this.config.maxJokesPerHour - this.jokesThisHour
            ),
            averageStyleScore: this.stats.styleViolations > 0
                ? Math.round(100 - (this.stats.styleViolations / this.stats.responsesGenerated * 100))
                : 100
        };
    }
}

module.exports = ResponseQualityEnhancer;
