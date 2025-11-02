/**
 * Conflict Resolution System
 * 
 * Detects and resolves conflicting memories/facts:
 * - Identifies contradictions in stored information
 * - Weighs source reliability
 * - Resolves conflicts based on evidence
 * - Maintains consistency across memory systems
 */

class ConflictResolution {
    constructor() {
        // Conflict tracking
        this.detectedConflicts = new Map(); // conflictId -> conflict data
        this.resolvedConflicts = new Map(); // conflictId -> resolution
        
        // Source reliability scores
        this.sourceReliability = new Map(); // username -> reliability score
        
        // Configuration
        this.config = {
            // Reliability scoring
            baseReliability: 50,
            maxReliability: 100,
            minReliability: 10,
            
            // Reliability adjustments
            reliabilityFactors: {
                friendshipBonus: 10,         // Friends are more reliable
                messageCountBonus: 0.1,      // +0.1 per 10 messages
                consistencyBonus: 15,        // Consistent information
                contradictionPenalty: -20,   // Contradicting info
                verifiedBonus: 25            // Info verified by multiple users
            },
            
            // Conflict detection
            conflictThreshold: 0.7, // 70% similarity to detect conflict
            minConfidenceForResolution: 60,
            
            // Fact categories
            factCategories: [
                'personal_info',    // User's personal details
                'relationships',    // Who knows whom
                'preferences',      // Likes/dislikes
                'history',          // Past events
                'opinions',         // Stated opinions
                'facts'             // General facts
            ]
        };
        
        // Stats
        this.stats = {
            conflictsDetected: 0,
            conflictsResolved: 0,
            pendingConflicts: 0,
            averageReliability: 0
        };
    }
    
    /**
     * Check for conflicts when adding new information
     */
    checkForConflicts(newInfo, existingMemories) {
        const conflicts = [];
        
        existingMemories.forEach(memory => {
            const conflict = this.detectConflict(newInfo, memory);
            if (conflict) {
                conflicts.push(conflict);
                this.detectedConflicts.set(conflict.id, conflict);
                this.stats.conflictsDetected++;
                this.stats.pendingConflicts++;
            }
        });
        
        return conflicts;
    }
    
    /**
     * Detect if two pieces of information conflict
     */
    detectConflict(info1, info2) {
        // Check if they're about the same thing
        if (!this.isSameSubject(info1, info2)) {
            return null;
        }
        
        // Check if they contradict
        const similarity = this.calculateContentSimilarity(info1.content, info2.content);
        
        if (similarity < this.config.conflictThreshold) {
            // Different enough to be a potential conflict
            const conflictType = this.determineConflictType(info1, info2);
            
            return {
                id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                type: conflictType,
                subject: info1.subject || info1.username,
                statement1: {
                    content: info1.content,
                    source: info1.source,
                    timestamp: info1.timestamp,
                    reliability: this.getSourceReliability(info1.source)
                },
                statement2: {
                    content: info2.content,
                    source: info2.source,
                    timestamp: info2.timestamp,
                    reliability: this.getSourceReliability(info2.source)
                },
                detected: Date.now(),
                resolved: false
            };
        }
        
        return null;
    }
    
    /**
     * Check if two pieces of info are about the same subject
     */
    isSameSubject(info1, info2) {
        // Same username/user?
        if (info1.username && info2.username) {
            if (info1.username.toLowerCase() === info2.username.toLowerCase()) {
                return true;
            }
        }
        
        // Same subject field?
        if (info1.subject && info2.subject) {
            if (info1.subject.toLowerCase() === info2.subject.toLowerCase()) {
                return true;
            }
        }
        
        // Same category?
        if (info1.category && info2.category) {
            if (info1.category === info2.category) {
                // Check for keyword overlap
                const keywords1 = this.extractKeywords(info1.content);
                const keywords2 = this.extractKeywords(info2.content);
                const overlap = keywords1.filter(k => keywords2.includes(k));
                
                if (overlap.length >= 2) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Calculate content similarity
     */
    calculateContentSimilarity(content1, content2) {
        const words1 = new Set(content1.toLowerCase().split(/\s+/));
        const words2 = new Set(content2.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }
    
    /**
     * Determine type of conflict
     */
    determineConflictType(info1, info2) {
        if (info1.category === 'personal_info') return 'identity';
        if (info1.category === 'relationships') return 'social';
        if (info1.category === 'preferences') return 'preference';
        if (info1.category === 'history') return 'timeline';
        if (info1.category === 'opinions') return 'opinion';
        return 'factual';
    }
    
    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        if (!text) return [];
        
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3);
        
        const stopWords = new Set([
            'that', 'this', 'with', 'from', 'have', 'what',
            'when', 'where', 'about', 'they', 'said', 'them'
        ]);
        
        return words.filter(w => !stopWords.has(w));
    }
    
    /**
     * Resolve a conflict
     */
    resolveConflict(conflictId) {
        const conflict = this.detectedConflicts.get(conflictId);
        if (!conflict || conflict.resolved) return null;
        
        const resolution = this.determineResolution(conflict);
        
        if (resolution) {
            conflict.resolved = true;
            conflict.resolution = resolution;
            conflict.resolvedAt = Date.now();
            
            this.resolvedConflicts.set(conflictId, conflict);
            this.stats.conflictsResolved++;
            this.stats.pendingConflicts--;
            
            // Update source reliability
            this.updateSourceReliability(conflict, resolution);
            
            console.log(`[ConflictResolution] Resolved conflict ${conflictId}: ${resolution.decision}`);
            
            return resolution;
        }
        
        return null;
    }
    
    /**
     * Determine how to resolve a conflict
     */
    determineResolution(conflict) {
        const s1 = conflict.statement1;
        const s2 = conflict.statement2;
        
        let confidence = 0;
        let chosenStatement = null;
        let reasoning = [];
        
        // Compare reliability
        if (s1.reliability > s2.reliability + 15) {
            confidence += 30;
            chosenStatement = s1;
            reasoning.push(`Source ${s1.source} is more reliable`);
        } else if (s2.reliability > s1.reliability + 15) {
            confidence += 30;
            chosenStatement = s2;
            reasoning.push(`Source ${s2.source} is more reliable`);
        }
        
        // Compare recency
        if (s1.timestamp > s2.timestamp) {
            confidence += 20;
            if (!chosenStatement) chosenStatement = s1;
            reasoning.push('More recent information');
        } else {
            confidence += 20;
            if (!chosenStatement) chosenStatement = s2;
            reasoning.push('More recent information');
        }
        
        // Conflict type specific logic
        switch (conflict.type) {
            case 'opinion':
                // Opinions can change, prefer newer
                confidence += 15;
                reasoning.push('Opinions can evolve over time');
                break;
                
            case 'preference':
                // Preferences can change
                confidence += 10;
                reasoning.push('Preferences may have changed');
                break;
                
            case 'timeline':
            case 'factual':
                // Facts shouldn't change, prefer more reliable source
                if (chosenStatement === s1 && s1.reliability > s2.reliability) {
                    confidence += 20;
                } else if (chosenStatement === s2 && s2.reliability > s1.reliability) {
                    confidence += 20;
                }
                reasoning.push('Factual information should be consistent');
                break;
        }
        
        // If still no clear winner, can't resolve
        if (!chosenStatement || confidence < this.config.minConfidenceForResolution) {
            return {
                decision: 'unresolved',
                confidence: 0,
                reasoning: ['Insufficient evidence to resolve conflict'],
                action: 'keep_both'
            };
        }
        
        return {
            decision: chosenStatement === s1 ? 'accept_statement1' : 'accept_statement2',
            chosenStatement: chosenStatement.content,
            confidence,
            reasoning,
            action: 'replace'
        };
    }
    
    /**
     * Update source reliability based on resolution
     */
    updateSourceReliability(conflict, resolution) {
        const s1 = conflict.statement1;
        const s2 = conflict.statement2;
        
        if (resolution.decision === 'accept_statement1') {
            // s1 source was correct
            this.adjustReliability(
                s1.source,
                this.config.reliabilityFactors.consistencyBonus
            );
            
            // s2 source was wrong
            this.adjustReliability(
                s2.source,
                this.config.reliabilityFactors.contradictionPenalty
            );
        } else if (resolution.decision === 'accept_statement2') {
            // s2 source was correct
            this.adjustReliability(
                s2.source,
                this.config.reliabilityFactors.consistencyBonus
            );
            
            // s1 source was wrong
            this.adjustReliability(
                s1.source,
                this.config.reliabilityFactors.contradictionPenalty
            );
        }
        // If unresolved, no reliability change
    }
    
    /**
     * Get source reliability score
     */
    getSourceReliability(source) {
        if (!this.sourceReliability.has(source)) {
            this.sourceReliability.set(source, this.config.baseReliability);
        }
        
        return this.sourceReliability.get(source);
    }
    
    /**
     * Adjust source reliability
     */
    adjustReliability(source, adjustment) {
        const current = this.getSourceReliability(source);
        const newScore = Math.max(
            this.config.minReliability,
            Math.min(this.config.maxReliability, current + adjustment)
        );
        
        this.sourceReliability.set(source, newScore);
        
        console.log(`[ConflictResolution] ${source} reliability: ${current} -> ${newScore}`);
    }
    
    /**
     * Initialize reliability for a user
     */
    initializeReliability(username, userProfile, relationship) {
        if (this.sourceReliability.has(username)) return;
        
        let reliability = this.config.baseReliability;
        
        // Friendship bonus (use friendshipLevel from userProfile)
        if (userProfile && userProfile.friendshipLevel > 25) {
            reliability += this.config.reliabilityFactors.friendshipBonus;
        }
        
        // Message count bonus
        if (userProfile && userProfile.messageCount) {
            const bonus = Math.floor(userProfile.messageCount / 10) * 
                         this.config.reliabilityFactors.messageCountBonus;
            reliability += Math.min(bonus, 20); // Max 20 bonus
        }
        
        this.sourceReliability.set(username, reliability);
    }
    
    /**
     * Verify information with multiple sources
     */
    verifyWithSources(information, sources) {
        const agreements = sources.filter(source => 
            this.calculateContentSimilarity(information, source.content) > 0.8
        );
        
        if (agreements.length >= 2) {
            // Multiple sources agree - increase reliability
            agreements.forEach(source => {
                this.adjustReliability(
                    source.source,
                    this.config.reliabilityFactors.verifiedBonus
                );
            });
            
            return {
                verified: true,
                confidence: Math.min(100, 60 + (agreements.length * 10)),
                sources: agreements.length
            };
        }
        
        return {
            verified: false,
            confidence: 30,
            sources: agreements.length
        };
    }
    
    /**
     * Get all pending conflicts
     */
    getPendingConflicts() {
        const pending = [];
        
        this.detectedConflicts.forEach(conflict => {
            if (!conflict.resolved) {
                pending.push(conflict);
            }
        });
        
        return pending;
    }
    
    /**
     * Get reliability rankings
     */
    getReliabilityRankings() {
        const rankings = Array.from(this.sourceReliability.entries())
            .map(([source, score]) => ({ source, score }))
            .sort((a, b) => b.score - a.score);
        
        return rankings;
    }
    
    /**
     * Get statistics
     */
    getStats() {
        const reliabilityScores = Array.from(this.sourceReliability.values());
        const avgReliability = reliabilityScores.length > 0
            ? reliabilityScores.reduce((sum, score) => sum + score, 0) / reliabilityScores.length
            : 0;
        
        return {
            ...this.stats,
            averageReliability: Math.round(avgReliability),
            trackedSources: this.sourceReliability.size,
            resolutionRate: this.stats.conflictsDetected > 0
                ? Math.round((this.stats.conflictsResolved / this.stats.conflictsDetected) * 100)
                : 0
        };
    }
    
    /**
     * Auto-resolve all pending conflicts
     */
    autoResolveAll() {
        console.log('[ConflictResolution] Auto-resolving all pending conflicts...');
        
        const pending = this.getPendingConflicts();
        let resolved = 0;
        
        pending.forEach(conflict => {
            const resolution = this.resolveConflict(conflict.id);
            if (resolution && resolution.decision !== 'unresolved') {
                resolved++;
            }
        });
        
        console.log(`[ConflictResolution] Auto-resolved ${resolved}/${pending.length} conflicts`);
        
        return {
            attempted: pending.length,
            resolved,
            failed: pending.length - resolved
        };
    }
}

module.exports = ConflictResolution;
