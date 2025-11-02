/**
 * Cross-Platform Intelligence System
 * 
 * Unified user identity across platforms:
 * - Merge user profiles from Coolhole, Twitch, Discord
 * - Share context and memory between platforms
 * - Platform-aware response formatting
 * - Cross-platform relationship tracking
 */

class CrossPlatformIntelligence {
    constructor() {
        // Unified user identities
        this.unifiedProfiles = new Map(); // canonical username -> unified profile
        this.platformAliases = new Map(); // platform:username -> canonical username
        
        // Platform-specific data
        this.platformData = {
            coolhole: new Map(),
            twitch: new Map(),
            discord: new Map()
        };
        
        // Configuration
        this.config = {
            // Platform identifiers
            platforms: ['coolhole', 'twitch', 'discord'],
            
            // Username matching thresholds
            matchingThreshold: 0.8, // 80% similarity to merge
            
            // Response formatting
            formatting: {
                coolhole: {
                    maxLength: 500,
                    supportsMarkdown: false,
                    supportsEmojis: true,
                    lineBreaks: '\n'
                },
                twitch: {
                    maxLength: 500,
                    supportsMarkdown: false,
                    supportsEmojis: true,
                    lineBreaks: ' / '
                },
                discord: {
                    maxLength: 2000,
                    supportsMarkdown: true,
                    supportsEmojis: true,
                    lineBreaks: '\n'
                }
            }
        };
        
        // Stats
        this.stats = {
            unifiedProfiles: 0,
            merges: 0,
            crossPlatformConversations: 0
        };
    }
    
    /**
     * Initialize with existing profiles from different platforms
     */
    initialize(coolholeProfiles, twitchProfiles, discordProfiles) {
        console.log('[CrossPlatform] Initializing unified profiles...');
        
        // Store platform-specific data
        if (coolholeProfiles) {
            coolholeProfiles.forEach((profile, username) => {
                this.platformData.coolhole.set(username, profile);
            });
        }
        
        if (twitchProfiles) {
            twitchProfiles.forEach((profile, username) => {
                this.platformData.twitch.set(username, profile);
            });
        }
        
        if (discordProfiles) {
            discordProfiles.forEach((profile, username) => {
                this.platformData.discord.set(username, profile);
            });
        }
        
        // Create unified profiles
        this.createUnifiedProfiles();
        
        console.log(`[CrossPlatform] Created ${this.unifiedProfiles.size} unified profiles`);
    }
    
    /**
     * Create unified profiles by merging across platforms
     */
    createUnifiedProfiles() {
        const processed = new Set();
        
        // Start with Coolhole profiles (primary platform)
        this.platformData.coolhole.forEach((profile, username) => {
            if (processed.has(`coolhole:${username}`)) return;
            
            const canonicalName = this.getCanonicalUsername(username);
            const unified = this.createUnifiedProfile(username, 'coolhole');
            
            this.unifiedProfiles.set(canonicalName, unified);
            this.platformAliases.set(`coolhole:${username}`, canonicalName);
            processed.add(`coolhole:${username}`);
            
            // Try to find matches on other platforms
            this.findCrossPlatformMatches(canonicalName, username);
        });
        
        // Process remaining Twitch profiles
        this.platformData.twitch.forEach((profile, username) => {
            if (processed.has(`twitch:${username}`)) return;
            
            const canonicalName = this.getCanonicalUsername(username);
            const unified = this.createUnifiedProfile(username, 'twitch');
            
            this.unifiedProfiles.set(canonicalName, unified);
            this.platformAliases.set(`twitch:${username}`, canonicalName);
            processed.add(`twitch:${username}`);
        });
        
        // Process remaining Discord profiles
        this.platformData.discord.forEach((profile, username) => {
            if (processed.has(`discord:${username}`)) return;
            
            const canonicalName = this.getCanonicalUsername(username);
            const unified = this.createUnifiedProfile(username, 'discord');
            
            this.unifiedProfiles.set(canonicalName, unified);
            this.platformAliases.set(`discord:${username}`, canonicalName);
            processed.add(`discord:${username}`);
        });
        
        this.stats.unifiedProfiles = this.unifiedProfiles.size;
    }
    
    /**
     * Create unified profile from platform-specific profile
     */
    createUnifiedProfile(username, primaryPlatform) {
        const platformProfile = this.platformData[primaryPlatform].get(username);
        
        return {
            canonicalName: this.getCanonicalUsername(username),
            primaryPlatform,
            platforms: {
                coolhole: primaryPlatform === 'coolhole' ? username : null,
                twitch: primaryPlatform === 'twitch' ? username : null,
                discord: primaryPlatform === 'discord' ? username : null
            },
            
            // Merged data
            friendshipLevel: platformProfile?.friendshipLevel || 0,
            totalMessages: platformProfile?.messageCount || 0,
            firstSeen: platformProfile?.firstSeen || Date.now(),
            lastSeen: platformProfile?.lastSeen || Date.now(),
            
            // Combined from all platforms
            favoriteTopics: new Set(platformProfile?.favoriteTopics || []),
            friendsWith: new Set(platformProfile?.friendsWith || []),
            favoriteEmojis: new Set(platformProfile?.favoriteEmojis || []),
            
            // Cross-platform activity
            platformActivity: {
                coolhole: primaryPlatform === 'coolhole' ? (platformProfile?.messageCount || 0) : 0,
                twitch: primaryPlatform === 'twitch' ? (platformProfile?.messageCount || 0) : 0,
                discord: primaryPlatform === 'discord' ? (platformProfile?.messageCount || 0) : 0
            },
            
            // Metadata
            created: Date.now(),
            lastUpdated: Date.now()
        };
    }
    
    /**
     * Find matching profiles across platforms
     */
    findCrossPlatformMatches(canonicalName, username) {
        const unified = this.unifiedProfiles.get(canonicalName);
        if (!unified) return;
        
        // Check Twitch
        if (!unified.platforms.twitch) {
            const twitchMatch = this.findMatchingUser(username, 'twitch');
            if (twitchMatch) {
                this.mergePlatformProfile(canonicalName, twitchMatch, 'twitch');
            }
        }
        
        // Check Discord
        if (!unified.platforms.discord) {
            const discordMatch = this.findMatchingUser(username, 'discord');
            if (discordMatch) {
                this.mergePlatformProfile(canonicalName, discordMatch, 'discord');
            }
        }
    }
    
    /**
     * Find matching user on a platform
     */
    findMatchingUser(username, platform) {
        const normalized = this.normalizeUsername(username);
        
        // Exact match first
        if (this.platformData[platform].has(username)) {
            return username;
        }
        
        // Fuzzy match
        for (const platformUser of this.platformData[platform].keys()) {
            const similarity = this.calculateSimilarity(normalized, this.normalizeUsername(platformUser));
            
            if (similarity >= this.config.matchingThreshold) {
                return platformUser;
            }
        }
        
        return null;
    }
    
    /**
     * Merge profile from another platform
     */
    mergePlatformProfile(canonicalName, platformUsername, platform) {
        const unified = this.unifiedProfiles.get(canonicalName);
        if (!unified) return;
        
        const platformProfile = this.platformData[platform].get(platformUsername);
        if (!platformProfile) return;
        
        // Update platform mapping
        unified.platforms[platform] = platformUsername;
        this.platformAliases.set(`${platform}:${platformUsername}`, canonicalName);
        
        // Merge data
        unified.totalMessages += platformProfile.messageCount || 0;
        unified.platformActivity[platform] = platformProfile.messageCount || 0;
        
        // Merge friendship level (take highest)
        if (platformProfile.friendshipLevel > unified.friendshipLevel) {
            unified.friendshipLevel = platformProfile.friendshipLevel;
        }
        
        // Merge topics
        (platformProfile.favoriteTopics || []).forEach(topic => {
            unified.favoriteTopics.add(topic);
        });
        
        // Merge friends
        (platformProfile.friendsWith || []).forEach(friend => {
            unified.friendsWith.add(friend);
        });
        
        // Merge emojis
        (platformProfile.favoriteEmojis || []).forEach(emoji => {
            unified.favoriteEmojis.add(emoji);
        });
        
        // Update timestamps
        if (platformProfile.firstSeen < unified.firstSeen) {
            unified.firstSeen = platformProfile.firstSeen;
        }
        if (platformProfile.lastSeen > unified.lastSeen) {
            unified.lastSeen = platformProfile.lastSeen;
        }
        
        unified.lastUpdated = Date.now();
        
        this.stats.merges++;
        console.log(`[CrossPlatform] Merged ${platform}:${platformUsername} into ${canonicalName}`);
    }
    
    /**
     * Get unified profile for a user
     */
    getUnifiedProfile(username, platform) {
        const key = `${platform}:${username}`;
        const canonicalName = this.platformAliases.get(key);
        
        if (canonicalName) {
            return this.unifiedProfiles.get(canonicalName);
        }
        
        // Try canonical username directly
        return this.unifiedProfiles.get(this.getCanonicalUsername(username));
    }
    
    /**
     * Update profile with new activity
     */
    updateProfile(username, platform, activity) {
        const unified = this.getUnifiedProfile(username, platform);
        
        if (!unified) {
            // Create new unified profile
            const canonicalName = this.getCanonicalUsername(username);
            const newProfile = this.createUnifiedProfile(username, platform);
            this.unifiedProfiles.set(canonicalName, newProfile);
            this.platformAliases.set(`${platform}:${username}`, canonicalName);
            return newProfile;
        }
        
        // Update activity
        unified.totalMessages++;
        unified.platformActivity[platform]++;
        unified.lastSeen = Date.now();
        unified.lastUpdated = Date.now();
        
        // Check if this is a cross-platform conversation
        const recentPlatforms = this.getRecentPlatforms(unified);
        if (recentPlatforms.size > 1) {
            this.stats.crossPlatformConversations++;
        }
        
        return unified;
    }
    
    /**
     * Get platforms user has been active on recently
     */
    getRecentPlatforms(unified) {
        const recent = new Set();
        const oneHourAgo = Date.now() - (1000 * 60 * 60);
        
        if (unified.lastSeen > oneHourAgo) {
            Object.entries(unified.platformActivity).forEach(([platform, count]) => {
                if (count > 0) recent.add(platform);
            });
        }
        
        return recent;
    }
    
    /**
     * Format response for specific platform
     */
    formatResponse(response, platform) {
        const format = this.config.formatting[platform];
        if (!format) return response;
        
        let formatted = response;
        
        // Handle line breaks
        if (format.lineBreaks !== '\n') {
            formatted = formatted.replace(/\n/g, format.lineBreaks);
        }
        
        // Handle markdown
        if (!format.supportsMarkdown) {
            // Strip markdown
            formatted = formatted
                .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
                .replace(/\*(.+?)\*/g, '$1')     // Italic
                .replace(/`(.+?)`/g, '$1')       // Code
                .replace(/~~(.+?)~~/g, '$1');    // Strikethrough
        }
        
        // Handle emojis
        if (!format.supportsEmojis) {
            // Remove emojis
            formatted = formatted.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
            formatted = formatted.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
            formatted = formatted.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
        }
        
        // Truncate to max length
        if (formatted.length > format.maxLength) {
            formatted = formatted.substring(0, format.maxLength - 3) + '...';
        }
        
        return formatted.trim();
    }
    
    /**
     * Get context for response (includes cross-platform info)
     */
    getContext(username, platform) {
        const unified = this.getUnifiedProfile(username, platform);
        if (!unified) return null;
        
        const context = {
            canonicalName: unified.canonicalName,
            currentPlatform: platform,
            knownPlatforms: Object.entries(unified.platforms)
                .filter(([_, user]) => user !== null)
                .map(([plat]) => plat),
            totalInteractions: unified.totalMessages,
            friendshipLevel: unified.friendshipLevel,
            isMultiPlatform: Object.values(unified.platforms).filter(u => u !== null).length > 1
        };
        
        return context;
    }
    
    /**
     * Normalize username for comparison
     */
    normalizeUsername(username) {
        return username.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();
    }
    
    /**
     * Get canonical username (lowercase, no special chars)
     */
    getCanonicalUsername(username) {
        return this.normalizeUsername(username);
    }
    
    /**
     * Calculate similarity between usernames
     */
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const maxLen = Math.max(len1, len2);
        
        if (maxLen === 0) return 1.0;
        
        // Levenshtein distance
        const distance = this.levenshteinDistance(str1, str2);
        
        return 1 - (distance / maxLen);
    }
    
    /**
     * Calculate Levenshtein distance
     */
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
    
    /**
     * Get cross-platform context for generating responses
     * Returns info about previous interactions across platforms
     */
    getCrossPlatformContext(username, currentPlatform) {
        const canonical = this.platformAliases.get(`${currentPlatform}:${username}`);
        if (!canonical) return null;
        
        const profile = this.unifiedProfiles.get(canonical);
        if (!profile) return null;
        
        // Build context about user's presence across platforms
        const otherPlatforms = [];
        for (const [platform, platformUsername] of Object.entries(profile.platforms)) {
            if (platform !== currentPlatform && platformUsername) {
                otherPlatforms.push({
                    platform,
                    username: platformUsername,
                    lastSeen: profile.lastSeenOn[platform],
                    messageCount: profile.activityCounts?.[platform] || 0
                });
            }
        }
        
        return {
            canonical: profile.canonicalName,
            otherPlatforms,
            primaryPlatform: profile.primaryPlatform,
            isMultiPlatform: otherPlatforms.length > 0,
            sharedContext: profile.sharedContext || []
        };
    }
    
    /**
     * Generate cross-platform reference for responses
     * e.g., "we talked about this on Discord earlier"
     */
    generateCrossPlatformReference(username, currentPlatform, topic = null) {
        const context = this.getCrossPlatformContext(username, currentPlatform);
        
        if (!context || !context.isMultiPlatform) {
            return null;
        }
        
        // Pick a random other platform they're on
        const otherPlatform = context.otherPlatforms[
            Math.floor(Math.random() * context.otherPlatforms.length)
        ];
        
        if (!otherPlatform) return null;
        
        // Time since last seen
        const timeSince = Date.now() - (otherPlatform.lastSeen || 0);
        const timeStr = this.formatTimeSince(timeSince);
        
        // Generate reference
        const templates = [
            `wait didnt we talk about this on ${otherPlatform.platform} ${timeStr}?`,
            `someone asked me this on ${otherPlatform.platform} earlier`,
            `reminds me of that ${otherPlatform.platform} convo ${timeStr}`,
            `oh yeah you also mentioned this on ${otherPlatform.platform}`,
            `this came up on ${otherPlatform.platform} like ${timeStr}`,
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    /**
     * Format time since for natural language
     */
    formatTimeSince(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
        return 'just now';
    }
    
    /**
     * Check if should reference cross-platform
     * Returns chance based on context
     */
    shouldReferenceCrossPlatform(username, currentPlatform) {
        const context = this.getCrossPlatformContext(username, currentPlatform);
        
        if (!context || !context.isMultiPlatform) {
            return false;
        }
        
        // Base 10% chance
        let chance = 0.10;
        
        // Higher chance if recently active on other platform
        const recentActivity = context.otherPlatforms.some(p => {
            const timeSince = Date.now() - (p.lastSeen || Infinity);
            return timeSince < 30 * 60 * 1000; // Within 30 minutes
        });
        
        if (recentActivity) {
            chance += 0.15; // 25% total
        }
        
        // Higher chance if they're very active across platforms
        const totalActivity = context.otherPlatforms.reduce((sum, p) => sum + p.messageCount, 0);
        if (totalActivity > 50) {
            chance += 0.10; // Up to 35%
        }
        
        return Math.random() < chance;
    }
    
    /**
     * Get statistics
     */
    getStats() {
        const platformCounts = {
            coolhole: 0,
            twitch: 0,
            discord: 0,
            multiPlatform: 0
        };
        
        this.unifiedProfiles.forEach(profile => {
            const platforms = Object.values(profile.platforms).filter(u => u !== null);
            
            if (platforms.length > 1) {
                platformCounts.multiPlatform++;
            }
            
            if (profile.platforms.coolhole) platformCounts.coolhole++;
            if (profile.platforms.twitch) platformCounts.twitch++;
            if (profile.platforms.discord) platformCounts.discord++;
        });
        
        return {
            ...this.stats,
            unifiedProfiles: this.unifiedProfiles.size,
            platformCounts,
            aliases: this.platformAliases.size
        };
    }
}

module.exports = CrossPlatformIntelligence;
