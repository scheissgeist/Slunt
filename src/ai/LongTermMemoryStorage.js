/**
 * Long-Term Memory Storage System
 * 
 * Implements a tiered memory architecture similar to how a real brain works:
 * - Short-term (hot): Active working memory, frequently accessed
 * - Mid-term (warm): Recently used but not critical, aging out
 * - Long-term (cold): Archived memories, compressed and clustered
 * 
 * Memories automatically migrate between tiers based on:
 * - Access frequency and recency
 * - Emotional importance
 * - Relationship strength with users involved
 * - Time since last access
 */

const fs = require('fs').promises;
const path = require('path');

class LongTermMemoryStorage {
    constructor() {
        // Memory tiers
        this.shortTerm = []; // Hot - last 100 memories, frequently accessed
        this.midTerm = []; // Warm - last 500 memories, occasionally accessed
        this.longTerm = []; // Cold - everything older, compressed
        
        // Access tracking
        this.accessCounts = new Map(); // memoryId -> access count
        this.lastAccessed = new Map(); // memoryId -> timestamp
        
        // Configuration
        this.config = {
            shortTermLimit: 100,
            midTermLimit: 500,
            longTermCompressionThreshold: 1000,
            
            // Migration thresholds
            hotToWarmAge: 1000 * 60 * 30, // 30 minutes without access
            warmToColdAge: 1000 * 60 * 60 * 24, // 24 hours without access
            
            // Access patterns for promotion
            promotionAccessThreshold: 3, // Accesses needed to promote from cold
            
            // Emotional importance weights
            emotionalWeight: {
                high: 2.0,  // Major events, strong emotions
                medium: 1.5, // Normal interactions
                low: 1.0     // Routine stuff
            }
        };
        
        // File paths
        this.dataDir = path.join(__dirname, '../../data');
        this.shortTermPath = path.join(this.dataDir, 'memory_short_term.json');
        this.midTermPath = path.join(this.dataDir, 'memory_mid_term.json');
        this.longTermPath = path.join(this.dataDir, 'memory_long_term.json');
        this.metadataPath = path.join(this.dataDir, 'memory_metadata.json');
        
        // Stats
        this.stats = {
            totalMemories: 0,
            migrationsToday: 0,
            retrievalsToday: 0,
            compressionsSaved: 0
        };
    }
    
    /**
     * Initialize the memory system
     */
    async initialize() {
        try {
            await this.load();
            console.log('[LongTermMemory] Initialized:', {
                shortTerm: this.shortTerm.length,
                midTerm: this.midTerm.length,
                longTerm: this.longTerm.length,
                total: this.stats.totalMemories
            });
        } catch (error) {
            console.error('[LongTermMemory] Failed to initialize:', error);
        }
    }
    
    /**
     * Add a new memory (ENHANCED - with platform tagging)
     */
    addMemory(memory) {
        const enrichedMemory = {
            ...memory,
            id: this.generateMemoryId(),
            tier: 'short',
            created: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 0,
            emotionalImportance: this.calculateEmotionalImportance(memory),
            // === NEW: Platform tagging for cross-platform isolation ===
            platform: memory.platform || 'unknown',
            platformSpecific: this.isPlatformSpecific(memory)
        };
        
        this.shortTerm.unshift(enrichedMemory);
        this.accessCounts.set(enrichedMemory.id, 0);
        this.lastAccessed.set(enrichedMemory.id, Date.now());
        this.stats.totalMemories++;
        
        // Trigger maintenance if short-term is full
        if (this.shortTerm.length > this.config.shortTermLimit) {
            this.migrateMemories();
        }
        
        return enrichedMemory.id;
    }

    /**
     * NEW: Determine if memory is platform-specific
     */
    isPlatformSpecific(memory) {
        const content = (memory.content || '').toLowerCase();
        
        // Video-related content is Coolhole-specific
        const videoKeywords = ['video', 'playing', 'queue', 'watch', 'stream', 'movie', 'clip'];
        if (videoKeywords.some(kw => content.includes(kw))) {
            return true;
        }

        // Emote-heavy content is platform-specific
        if (content.match(/:\w+:/g) && content.match(/:\w+:/g).length > 2) {
            return true;
        }

        // Channel/server mentions are platform-specific
        if (content.includes('#') || content.includes('channel') || content.includes('server')) {
            return true;
        }

        return false;
    }

    /**
     * Remove a memory by reference or ID
     * Used by MemoryPruning system
     */
    removeMemory(memoryOrId) {
        const memoryId = typeof memoryOrId === 'string' ? memoryOrId : memoryOrId.id;
        
        // Remove from short-term
        const shortIndex = this.shortTerm.findIndex(m => m.id === memoryId);
        if (shortIndex !== -1) {
            this.shortTerm.splice(shortIndex, 1);
            this.accessCounts.delete(memoryId);
            this.lastAccessed.delete(memoryId);
            this.stats.totalMemories--;
            return true;
        }

        // Remove from mid-term
        const midIndex = this.midTerm.findIndex(m => m.id === memoryId);
        if (midIndex !== -1) {
            this.midTerm.splice(midIndex, 1);
            this.accessCounts.delete(memoryId);
            this.lastAccessed.delete(memoryId);
            this.stats.totalMemories--;
            return true;
        }

        // Remove from long-term
        const longIndex = this.longTerm.findIndex(m => m.id === memoryId);
        if (longIndex !== -1) {
            this.longTerm.splice(longIndex, 1);
            this.accessCounts.delete(memoryId);
            this.lastAccessed.delete(memoryId);
            this.stats.totalMemories--;
            return true;
        }

        return false; // Memory not found
    }
    
    /**
     * Retrieve memories relevant to a context (ENHANCED - platform filtering)
     */
    async retrieveRelevant(context, limit = 20) {
        this.stats.retrievalsToday++;
        
        const currentPlatform = context.platform || 'unknown';
        
        let allMemories = [
            ...this.shortTerm,
            ...this.midTerm,
            ...this.longTerm
        ];

        // === NEW: Aggressive platform filtering ===
        // Only include memories from current platform OR non-platform-specific memories
        allMemories = allMemories.filter(memory => {
            // Always include non-platform-specific memories
            if (!memory.platformSpecific) {
                return true;
            }

            // Include if from same platform
            if (memory.platform === currentPlatform) {
                return true;
            }

            // Exclude platform-specific memories from other platforms
            return false;
        });
        
        // Score each memory for relevance
        const scored = allMemories.map(memory => ({
            memory,
            score: this.calculateRelevanceScore(memory, context)
        }));
        
        // Sort by relevance
        scored.sort((a, b) => b.score - a.score);
        
        // Take top N
        const relevant = scored.slice(0, limit);
        
        // Update access tracking
        relevant.forEach(({ memory }) => {
            this.recordAccess(memory.id);
            // Promote frequently accessed memories
            if (memory.tier === 'long' && this.accessCounts.get(memory.id) >= this.config.promotionAccessThreshold) {
                this.promoteMemory(memory.id);
            }
        });
        
        return relevant.map(r => r.memory);
    }
    
    /**
     * Calculate emotional importance of a memory
     */
    calculateEmotionalImportance(memory) {
        let importance = this.config.emotionalWeight.medium;
        
        const content = (memory.content || '').toLowerCase();
        const context = (memory.context || '').toLowerCase();
        const fullText = content + ' ' + context;
        
        // High importance indicators
        const highMarkers = [
            'love', 'hate', 'amazing', 'terrible', 'best', 'worst',
            'incredible', 'awful', 'perfect', 'disaster', 'brilliant',
            'roasted', 'praised', 'argument', 'fight', 'breakthrough'
        ];
        
        // Low importance indicators
        const lowMarkers = [
            'ok', 'fine', 'whatever', 'meh', 'sure', 'yeah'
        ];
        
        if (highMarkers.some(marker => fullText.includes(marker))) {
            importance = this.config.emotionalWeight.high;
        } else if (lowMarkers.some(marker => fullText.includes(marker))) {
            importance = this.config.emotionalWeight.low;
        }
        
        return importance;
    }
    
    /**
     * Calculate relevance score for a memory given current context
     */
    calculateRelevanceScore(memory, context) {
        let score = 0;
        
        // Recency bonus (exponential decay)
        const ageInHours = (Date.now() - memory.created) / (1000 * 60 * 60);
        const recencyScore = Math.exp(-ageInHours / 24) * 100; // Decay over 24 hours
        score += recencyScore;
        
        // Access frequency bonus
        const accessScore = Math.min(this.accessCounts.get(memory.id) || 0, 10) * 5;
        score += accessScore;
        
        // Emotional importance
        score += (memory.emotionalImportance || 1.0) * 20;
        
        // Tier bonus (hot memories are more accessible)
        const tierBonus = {
            short: 30,
            mid: 15,
            long: 0
        };
        score += tierBonus[memory.tier] || 0;
        
        // Context matching
        if (context.username) {
            const involvedUsers = memory.involvedUsers || [];
            if (involvedUsers.includes(context.username)) {
                score += 40; // Big bonus for same user
            }
        }
        
        if (context.topic) {
            const memoryText = ((memory.content || '') + ' ' + (memory.context || '')).toLowerCase();
            const topicWords = context.topic.toLowerCase().split(/\s+/);
            const matches = topicWords.filter(word => memoryText.includes(word)).length;
            score += matches * 15;
        }
        
        if (context.platform) {
            if (memory.platform === context.platform) {
                score += 10; // Small bonus for same platform
            }
        }
        
        return score;
    }
    
    /**
     * Record that a memory was accessed
     */
    recordAccess(memoryId) {
        const currentCount = this.accessCounts.get(memoryId) || 0;
        this.accessCounts.set(memoryId, currentCount + 1);
        this.lastAccessed.set(memoryId, Date.now());
    }
    
    /**
     * Migrate memories between tiers based on access patterns
     */
    migrateMemories() {
        const now = Date.now();
        this.stats.migrationsToday++;
        
        // Hot -> Warm: Move old, rarely accessed memories
        const toWarm = this.shortTerm.filter(m => {
            const age = now - (this.lastAccessed.get(m.id) || m.created);
            const accessCount = this.accessCounts.get(m.id) || 0;
            return age > this.config.hotToWarmAge || 
                   (this.shortTerm.length > this.config.shortTermLimit && accessCount < 2);
        });
        
        toWarm.forEach(memory => {
            memory.tier = 'mid';
            this.midTerm.push(memory);
        });
        this.shortTerm = this.shortTerm.filter(m => !toWarm.includes(m));
        
        // Warm -> Cold: Move very old memories
        const toCold = this.midTerm.filter(m => {
            const age = now - (this.lastAccessed.get(m.id) || m.created);
            return age > this.config.warmToColdAge || 
                   (this.midTerm.length > this.config.midTermLimit);
        });
        
        toCold.forEach(memory => {
            memory.tier = 'long';
            this.longTerm.push(memory);
        });
        this.midTerm = this.midTerm.filter(m => !toCold.includes(m));
        
        // Compress long-term if it's getting too large
        if (this.longTerm.length > this.config.longTermCompressionThreshold) {
            this.compressLongTerm();
        }
        
        if (toWarm.length > 0 || toCold.length > 0) {
            console.log(`[LongTermMemory] Migrated: ${toWarm.length} to warm, ${toCold.length} to cold`);
        }
    }
    
    /**
     * Promote a memory to a higher tier
     */
    promoteMemory(memoryId) {
        // Find memory in long-term
        const memoryIndex = this.longTerm.findIndex(m => m.id === memoryId);
        if (memoryIndex === -1) return;
        
        const memory = this.longTerm[memoryIndex];
        memory.tier = 'mid';
        memory.lastAccessed = Date.now();
        
        this.midTerm.unshift(memory);
        this.longTerm.splice(memoryIndex, 1);
        
        console.log(`[LongTermMemory] Promoted memory ${memoryId} from long-term to mid-term`);
    }
    
    /**
     * Compress long-term memories
     * Groups similar memories and creates summary nodes
     */
    compressLongTerm() {
        console.log(`[LongTermMemory] Compressing long-term storage (${this.longTerm.length} memories)`);
        
        // Sort by date
        this.longTerm.sort((a, b) => a.created - b.created);
        
        // Keep most recent half as-is
        const keepAsIs = Math.floor(this.longTerm.length / 2);
        const toCompress = this.longTerm.slice(0, this.longTerm.length - keepAsIs);
        const kept = this.longTerm.slice(this.longTerm.length - keepAsIs);
        
        // Group memories by month and user
        const groups = new Map();
        toCompress.forEach(memory => {
            const date = new Date(memory.created);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const users = memory.involvedUsers || ['unknown'];
            
            users.forEach(user => {
                const key = `${monthKey}_${user}`;
                if (!groups.has(key)) {
                    groups.set(key, []);
                }
                groups.get(key).push(memory);
            });
        });
        
        // Create summary nodes for each group
        const summaries = [];
        groups.forEach((memories, key) => {
            if (memories.length < 3) {
                // Too few to summarize, keep as-is
                summaries.push(...memories);
                return;
            }
            
            const summary = {
                id: this.generateMemoryId(),
                tier: 'long',
                type: 'summary',
                created: memories[0].created,
                lastAccessed: Date.now(),
                accessCount: 0,
                emotionalImportance: Math.max(...memories.map(m => m.emotionalImportance || 1.0)),
                involvedUsers: [...new Set(memories.flatMap(m => m.involvedUsers || []))],
                platform: memories[0].platform,
                content: `Summary of ${memories.length} interactions`,
                context: this.createSummaryContext(memories),
                compressedMemories: memories.length,
                originalIds: memories.map(m => m.id)
            };
            
            summaries.push(summary);
            this.stats.compressionsSaved += memories.length - 1;
        });
        
        this.longTerm = [...summaries, ...kept];
        console.log(`[LongTermMemory] Compressed ${toCompress.length} to ${summaries.length} summaries`);
    }
    
    /**
     * Create a context string from multiple memories
     */
    createSummaryContext(memories) {
        const topics = new Map();
        const emotions = [];
        
        memories.forEach(memory => {
            const content = (memory.content || '').toLowerCase();
            const context = (memory.context || '').toLowerCase();
            const text = content + ' ' + context;
            
            // Extract key words (simple approach)
            const words = text.split(/\s+/).filter(w => w.length > 4);
            words.forEach(word => {
                topics.set(word, (topics.get(word) || 0) + 1);
            });
            
            // Extract emotional tone
            if (memory.emotionalImportance > 1.5) {
                emotions.push('positive');
            } else if (memory.emotionalImportance < 1.2) {
                emotions.push('neutral');
            }
        });
        
        // Get top topics
        const topTopics = Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
        
        const emotionSummary = emotions.length > 0 
            ? `mostly ${emotions[0]}` 
            : 'mixed emotions';
        
        return `Discussed: ${topTopics.join(', ')}. Tone: ${emotionSummary}`;
    }
    
    /**
     * Generate unique memory ID
     */
    generateMemoryId() {
        return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get statistics about memory usage
     */
    getStats() {
        return {
            ...this.stats,
            tiers: {
                short: this.shortTerm.length,
                mid: this.midTerm.length,
                long: this.longTerm.length
            },
            topAccessed: Array.from(this.accessCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([id, count]) => ({ id, count }))
        };
    }
    
    /**
     * Save memory tiers to disk
     */
    async save() {
        try {
            await fs.writeFile(
                this.shortTermPath,
                JSON.stringify(this.shortTerm, null, 2)
            );
            await fs.writeFile(
                this.midTermPath,
                JSON.stringify(this.midTerm, null, 2)
            );
            await fs.writeFile(
                this.longTermPath,
                JSON.stringify(this.longTerm, null, 2)
            );
            await fs.writeFile(
                this.metadataPath,
                JSON.stringify({
                    accessCounts: Array.from(this.accessCounts.entries()),
                    lastAccessed: Array.from(this.lastAccessed.entries()),
                    stats: this.stats
                }, null, 2)
            );
        } catch (error) {
            console.error('[LongTermMemory] Failed to save:', error);
        }
    }
    
    /**
     * Load memory tiers from disk
     */
    async load() {
        try {
            const loadJson = async (path) => {
                try {
                    const data = await fs.readFile(path, 'utf8');
                    return JSON.parse(data);
                } catch (error) {
                    return null;
                }
            };
            
            this.shortTerm = (await loadJson(this.shortTermPath)) || [];
            this.midTerm = (await loadJson(this.midTermPath)) || [];
            this.longTerm = (await loadJson(this.longTermPath)) || [];
            
            const metadata = await loadJson(this.metadataPath);
            if (metadata) {
                this.accessCounts = new Map(metadata.accessCounts || []);
                this.lastAccessed = new Map(metadata.lastAccessed || []);
                this.stats = metadata.stats || this.stats;
            }
            
            this.stats.totalMemories = 
                this.shortTerm.length + 
                this.midTerm.length + 
                this.longTerm.length;
            
        } catch (error) {
            console.error('[LongTermMemory] Failed to load:', error);
        }
    }
}

module.exports = LongTermMemoryStorage;
