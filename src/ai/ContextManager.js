/**
 * Context Manager
 * 
 * Intelligent context window management for AI responses.
 * Prevents context overflow by:
 * - Prioritizing relevant information
 * - Managing token budget (~2000 tokens)
 * - Compressing less important context
 * - Retrieving only what's needed from memory
 */

class ContextManager {
    constructor(longTermMemory, userProfiles) {
        this.longTermMemory = longTermMemory;
        this.userProfiles = userProfiles; // Changed from relationshipMapping to userProfiles Map
        
        // Configuration
        this.config = {
            maxTokens: 1200, // Reduced from 2000 for better llama3.2 performance
            estimatedCharsPerToken: 4, // Rough estimate
            maxContextLength: 4800, // ~1200 tokens
            
            // Priority weights
            priorityWeights: {
                currentMessage: 1.0,
                recentInteraction: 0.9,
                relationship: 0.8,
                relevantMemory: 0.7,
                mentalState: 0.6,
                generalContext: 0.5
            },
            
            // Context sections with max lengths (reduced by ~40%)
            sections: {
                currentMessage: 300,
                recentHistory: 900,
                relationships: 500,
                memories: 1200,
                mentalState: 400,
                personality: 250,
                rimworld: 500,
                misc: 250
            }
        };
        
        this.stats = {
            totalRequests: 0,
            averageTokensUsed: 0,
            contextsBuilt: 0,
            memoriesRetrieved: 0
        };
    }
    
    /**
     * Build optimized context for a response
     */
    async buildContext(message, additionalContext = {}) {
        this.stats.totalRequests++;
        this.stats.contextsBuilt++;
        
        const context = {
            sections: {},
            totalLength: 0,
            priority: []
        };
        
        // 1. Current message (always included, highest priority)
        context.sections.currentMessage = this.formatCurrentMessage(message);
        
        // 2. Recent conversation history (compressed)
        context.sections.recentHistory = await this.buildRecentHistory(
            message,
            additionalContext.conversationHistory || []
        );
        
        // 3. Relationship context (filtered to relevant users)
        context.sections.relationships = this.buildRelationshipContext(
            message.username,
            additionalContext.relationships
        );
        
        // 4. Relevant memories (retrieved from long-term storage)
        context.sections.memories = await this.buildMemoryContext(
            message,
            additionalContext
        );
        
        // 5. Mental state (compressed)
        context.sections.mentalState = this.buildMentalStateContext(
            additionalContext.mentalState
        );
        
        // 6. Personality & RimWorld systems (compressed)
        context.sections.personality = this.buildPersonalityContext(
            additionalContext.personality
        );
        
        context.sections.rimworld = this.buildRimWorldContext(
            additionalContext.rimworld
        );

        // === NEW: Vision data (HIGH PRIORITY - recent visual context) ===
        context.sections.vision = this.buildVisionContext(additionalContext.vision);
        
        // 7. Misc context
        context.sections.misc = this.buildMiscContext(additionalContext);
        
        // Calculate total length
        context.totalLength = Object.values(context.sections)
            .reduce((sum, section) => sum + section.length, 0);
        
        // If over budget, compress
        if (context.totalLength > this.config.maxContextLength) {
            context.sections = this.compressContext(context.sections);
            context.totalLength = Object.values(context.sections)
                .reduce((sum, section) => sum + section.length, 0);
        }
        
        // Update stats
        const estimatedTokens = context.totalLength / this.config.estimatedCharsPerToken;
        this.stats.averageTokensUsed = 
            (this.stats.averageTokensUsed * (this.stats.contextsBuilt - 1) + estimatedTokens) / 
            this.stats.contextsBuilt;
        
        return context;
    }
    
    /**
     * Format current message
     */
    formatCurrentMessage(message) {
        return `Current message from ${message.username} on ${message.platform}: "${message.text}"`;
    }
    
    /**
     * Build recent conversation history (compressed)
     */
    async buildRecentHistory(message, conversationHistory) {
        const maxLength = this.config.sections.recentHistory;
        
        if (!conversationHistory || conversationHistory.length === 0) {
            return '';
        }
        
        // Take last 10 messages
        const recent = conversationHistory.slice(-10);
        
        // Format with compression
        let history = 'Recent conversation:\n';
        recent.forEach(msg => {
            const compressed = this.compressMessage(msg);
            history += `${msg.username}: ${compressed}\n`;
        });
        
        // Truncate if too long
        if (history.length > maxLength) {
            history = history.substring(0, maxLength) + '...[truncated]';
        }
        
        return history;
    }
    
    /**
     * Compress a message for context
     */
    compressMessage(message) {
        let text = message.text || '';
        
        // Remove excessive whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        // Truncate if very long
        if (text.length > 150) {
            text = text.substring(0, 150) + '...';
        }
        
        return text;
    }
    
    /**
     * Build relationship context
     */
    buildRelationshipContext(username, relationshipsData) {
        const maxLength = this.config.sections.relationships;
        
        if (!relationshipsData || !this.userProfiles) {
            return '';
        }
        
        // Get relationships for current user using userProfiles Map
        const userProfile = this.userProfiles.get(username);
        if (!userProfile) {
            return `${username} is a new user.`;
        }
        
        const friendshipLevel = userProfile.friendshipLevel || 0;
        const interactionCount = userProfile.interactionCount || 0;
        const lastSeen = userProfile.lastSeen 
            ? new Date(userProfile.lastSeen).toLocaleString()
            : 'unknown';
        
        let context = `Relationship with ${username}: `;
        
        if (friendshipLevel > 50) {
            context += 'Friend';
        } else if (friendshipLevel > 25) {
            context += 'Respected';
        } else if (friendshipLevel > 10) {
            context += 'Acquaintance';
        } else if (friendshipLevel < 0) {
            context += 'Rival';
        } else {
            context += 'Neutral';
        }
        
        context += ` (${interactionCount} interactions, last seen ${lastSeen})`;
        
        // Add a few other notable relationships (compressed)
        const allUserProfiles = Array.from(this.userProfiles.values());
        const notable = allUserProfiles
            .filter(profile => profile.username !== username)
            .sort((a, b) => Math.abs(b.friendshipLevel || 0) - Math.abs(a.friendshipLevel || 0))
            .slice(0, 3);
        
        if (notable.length > 0) {
            context += '\nOther relationships: ';
            context += notable.map(profile => {
                const opinion = profile.friendshipLevel > 25 ? 'likes' : profile.friendshipLevel < -10 ? 'dislikes' : 'knows';
                return `${opinion} ${profile.username}`;
            }).join(', ');
        }
        
        return context.substring(0, maxLength);
    }
    
    /**
     * Build memory context
     */
    async buildMemoryContext(message, additionalContext) {
        const maxLength = this.config.sections.memories;
        
        if (!this.longTermMemory) {
            return '';
        }
        
        try {
            // Build context for memory retrieval
            const retrievalContext = {
                username: message.username,
                platform: message.platform,
                topic: this.extractTopic(message.text)
            };
            
            // Retrieve relevant memories
            let memories = await this.longTermMemory.retrieveRelevant(retrievalContext, 5);
            this.stats.memoriesRetrieved += memories.length;

            // === ENHANCED: Prioritize correction memories ===
            // Always include recent corrections at the top
            const corrections = memories.filter(m => m.category === 'correction' || m.type === 'correction');
            const others = memories.filter(m => m.category !== 'correction' && m.type !== 'correction');
            
            // Reorder: corrections first, then others
            memories = [...corrections, ...others].slice(0, 5);
            
            if (memories.length === 0) {
                return '';
            }
            
            // Format memories (corrections marked as CRITICAL)
            let context = 'Relevant memories:\n';
            memories.forEach((memory, index) => {
                const age = this.formatAge(Date.now() - memory.created);
                const content = this.compressMessage({ text: memory.content || memory.context });
                const isCorrection = memory.category === 'correction' || memory.type === 'correction';
                const prefix = isCorrection ? '⚡ CORRECTION: ' : '';
                context += `${index + 1}. ${prefix}[${age} ago] ${content}\n`;
            });
            
            // Truncate if too long
            if (context.length > maxLength) {
                context = context.substring(0, maxLength) + '...[more memories available]';
            }
            
            return context;
        } catch (error) {
            console.error('[ContextManager] Error building memory context:', error);
            return '';
        }
    }
    
    /**
     * Extract topic from message text
     */
    extractTopic(text) {
        // Simple keyword extraction
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3);
        
        // Remove common words
        const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'what', 'when', 'where']);
        const keywords = words.filter(w => !stopWords.has(w));
        
        return keywords.slice(0, 5).join(' ');
    }
    
    /**
     * Format age of memory
     */
    formatAge(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }
    
    /**
     * Build mental state context
     */
    buildMentalStateContext(mentalStateData) {
        const maxLength = this.config.sections.mentalState;
        
        if (!mentalStateData) {
            return '';
        }
        
        let context = 'Mental state: ';
        
        // Needs (compressed)
        if (mentalStateData.needs) {
            const lowNeeds = Object.entries(mentalStateData.needs)
                .filter(([_, value]) => value < 50)
                .map(([need, value]) => `${need}(${Math.round(value)}%)`)
                .slice(0, 3);
            
            if (lowNeeds.length > 0) {
                context += `Low: ${lowNeeds.join(', ')}. `;
            }
        }
        
        // Mental break
        if (mentalStateData.mentalBreak) {
            context += `[${mentalStateData.mentalBreak.type}] `;
        }
        
        // Mood
        if (mentalStateData.mood !== undefined) {
            context += `Mood: ${Math.round(mentalStateData.mood)}. `;
        }
        
        // Thoughts - handle both string and array format
        if (mentalStateData.thoughts) {
            if (typeof mentalStateData.thoughts === 'string') {
                // String format from getThoughtSummary()
                const thoughtLines = mentalStateData.thoughts.split('\n').slice(0, 3);
                if (thoughtLines.length > 0 && thoughtLines[0] !== "No active thoughts affecting mood") {
                    context += `Thoughts: ${thoughtLines.join(', ')}`;
                }
            } else if (Array.isArray(mentalStateData.thoughts) && mentalStateData.thoughts.length > 0) {
                // Array format
                const topThoughts = mentalStateData.thoughts
                    .sort((a, b) => Math.abs(b.moodEffect) - Math.abs(a.moodEffect))
                    .slice(0, 3)
                    .map(t => `${t.type}(${t.moodEffect > 0 ? '+' : ''}${t.moodEffect})`)
                    .join(', ');
                context += `Thoughts: ${topThoughts}`;
            }
        }
        
        return context.substring(0, maxLength);
    }
    
    /**
     * Build personality context
     */
    buildPersonalityContext(personalityData) {
        const maxLength = this.config.sections.personality;
        
        if (!personalityData) {
            return '';
        }
        
        let context = 'Personality: ';
        
        if (personalityData.currentMode) {
            context += `${personalityData.currentMode} mode. `;
        }
        
        if (personalityData.traits) {
            const traits = Array.isArray(personalityData.traits) 
                ? personalityData.traits.slice(0, 3).join(', ')
                : personalityData.traits;
            context += `Traits: ${traits}. `;
        }
        
        return context.substring(0, maxLength);
    }
    
    /**
     * Build RimWorld systems context
     */
    buildRimWorldContext(rimworldData) {
        const maxLength = this.config.sections.rimworld;
        
        if (!rimworldData) {
            return '';
        }
        
        let context = '';
        
        // Schedule
        if (rimworldData.schedule) {
            context += `Schedule: ${rimworldData.schedule.block}, `;
        }
        
        // Tolerance (only mention high tolerance)
        if (rimworldData.tolerance) {
            const highTolerance = Object.entries(rimworldData.tolerance)
                .filter(([_, value]) => value > 0.5)
                .map(([behavior]) => behavior)
                .slice(0, 2);
            
            if (highTolerance.length > 0) {
                context += `Tolerant of: ${highTolerance.join(', ')}. `;
            }
        }
        
        return context.substring(0, maxLength);
    }

    /**
     * NEW: Build vision context (HIGH PRIORITY)
     */
    buildVisionContext(visionData) {
        if (!visionData) {
            return '';
        }

        const age = Math.round((Date.now() - visionData.timestamp) / 1000);
        let context = '👁️ VISUAL CONTEXT (what Slunt is seeing RIGHT NOW on screen):\n';
        
        // Video-specific info (if available)
        if (visionData.videoTitle) {
            context += `🎬 Video playing: "${visionData.videoTitle}"\n`;
            
            if (visionData.videoPlaying) {
                context += `Status: PLAYING`;
                if (visionData.videoTime && visionData.videoDuration) {
                    const progress = Math.floor((visionData.videoTime / visionData.videoDuration) * 100);
                    context += ` (${progress}% through, ${Math.floor(visionData.videoTime)}s / ${Math.floor(visionData.videoDuration)}s)`;
                }
                context += '\n';
            } else {
                context += `Status: Paused\n`;
            }
        } else {
            // Generic detected content
            context += `Currently displaying: ${visionData.detected}`;
            if (visionData.confidence) {
                context += ` (${Math.round(visionData.confidence * 100)}% confidence)`;
            }
            context += '\n';
        }

        // Scene changes (indicates new video)
        if (visionData.scene === 'changed') {
            context += `🆕 NEW VIDEO JUST STARTED! Fresh content detected.\n`;
        }

        // Any text on screen (titles, captions, UI elements)
        if (visionData.text && visionData.text.length > 0) {
            const textPreview = Array.isArray(visionData.text) 
                ? visionData.text.slice(0, 3).join(', ')
                : visionData.text.substring(0, 100);
            context += `Text on screen: "${textPreview}"\n`;
        }

        // Brightness/mood
        if (visionData.brightness !== undefined) {
            if (visionData.brightness < 50) {
                context += `Scene mood: Dark/serious (${visionData.brightness}/255 brightness)\n`;
            } else if (visionData.brightness > 200) {
                context += `Scene mood: Bright/energetic (${visionData.brightness}/255 brightness)\n`;
            }
        }

        context += `(analyzed ${age}s ago)\n`;
        context += '💡 You can comment on what you\'re seeing! React to videos, make observations, share thoughts.\n';
        
        return context;
    }
    
    /**
     * Build misc context
     */
    buildMiscContext(additionalContext) {
        const maxLength = this.config.sections.misc;
        let context = '';
        
        if (additionalContext.streamInfo) {
            context += `Stream: ${additionalContext.streamInfo.title || 'Unknown'}. `;
        }
        
        if (additionalContext.currentVideo) {
            context += `Video: ${additionalContext.currentVideo.title || 'Unknown'}. `;
        }
        
        return context.substring(0, maxLength);
    }
    
    /**
     * Compress context sections when over budget
     */
    compressContext(sections) {
        const totalLength = Object.values(sections).reduce((sum, s) => sum + s.length, 0);
        const compressionRatio = this.config.maxContextLength / totalLength;
        
        console.log(`[ContextManager] Compressing context: ${totalLength} -> ${this.config.maxContextLength} chars`);
        
        // Compress each section proportionally, but preserve priority
        const compressed = {};
        
        Object.entries(sections).forEach(([key, content]) => {
            // Current message is never compressed
            if (key === 'currentMessage') {
                compressed[key] = content;
                return;
            }
            
            // Calculate target length for this section
            const targetLength = Math.floor(
                this.config.sections[key] * compressionRatio
            );
            
            if (content.length <= targetLength) {
                compressed[key] = content;
            } else {
                // Truncate with indicator
                compressed[key] = content.substring(0, targetLength) + '...[compressed]';
            }
        });
        
        return compressed;
    }
    
    /**
     * Convert context to string for AI prompt
     */
    contextToString(context) {
        const sections = [];
        
        if (context.sections.currentMessage) {
            sections.push(context.sections.currentMessage);
        }
        
        if (context.sections.recentHistory) {
            sections.push('\n' + context.sections.recentHistory);
        }
        
        if (context.sections.relationships) {
            sections.push('\n' + context.sections.relationships);
        }
        
        if (context.sections.memories) {
            sections.push('\n' + context.sections.memories);
        }
        
        if (context.sections.mentalState) {
            sections.push('\n' + context.sections.mentalState);
        }
        
        // === VISION CONTEXT (HIGH PRIORITY) ===
        if (context.sections.vision) {
            sections.push('\n' + context.sections.vision);
        }
        
        if (context.sections.personality) {
            sections.push('\n' + context.sections.personality);
        }
        
        if (context.sections.rimworld) {
            sections.push('\n' + context.sections.rimworld);
        }
        
        if (context.sections.misc) {
            sections.push('\n' + context.sections.misc);
        }
        
        return sections.join('');
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            averageTokensUsed: Math.round(this.stats.averageTokensUsed),
            tokenBudget: Math.round(this.config.maxTokens),
            efficiency: this.stats.averageTokensUsed / this.config.maxTokens
        };
    }
}

module.exports = ContextManager;
