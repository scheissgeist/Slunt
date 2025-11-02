/**
 * Rate Limiting System
 * 
 * Intelligent response rate management:
 * - Per-user cooldowns to prevent spam responses
 * - Dynamic rate adjustment based on chat velocity
 * - Lurk mode when chat is too fast
 * - Priority queue for important users/messages
 */

class RateLimitingSystem {
    constructor() {
        // Per-user cooldowns
        this.userCooldowns = new Map(); // username -> last response time
        this.userPriority = new Map(); // username -> priority level
        
        // Global rate limiting
        this.lastResponseTime = 0;
        this.responsesThisMinute = 0;
        this.minuteStart = Date.now();
        
        // Chat velocity tracking
        this.messagesThisMinute = 0;
        this.messageMinuteStart = Date.now();
        this.chatVelocity = 0; // messages per minute
        
        // Configuration
        this.config = {
            // Per-user cooldowns (milliseconds)
            cooldowns: {
                vip: 5000,       // 5 seconds (mods, subs, friends)
                normal: 15000,   // 15 seconds (reduced from 30s)
                new: 30000,      // 30 seconds (reduced from 60s)
                spam: 60000      // 1 minute (reduced from 2min)
            },
            
            // Global limits
            maxResponsesPerMinute: 15,  // Increased from 10
            minTimeBetweenResponses: 2000, // 2 seconds (reduced from 3s)
            
            // Chat velocity thresholds
            velocityThresholds: {
                slow: 5,         // < 5 messages/min
                normal: 15,      // 5-15 messages/min
                fast: 35,        // 15-35 messages/min (was 30)
                overwhelming: 60 // > 60 messages/min (was 50)
            },
            
            // Lurk mode
            lurkModeThreshold: 60,  // Increased from 50 (lurk less often)
            lurkModeResponseRate: 0.3, // Respond to 30% when lurking (was 20%)
            
            // Priority levels
            priorities: {
                critical: 100,   // Bot owner, emergencies
                high: 75,        // Mods, close friends
                medium: 50,      // Regular friends, subs
                normal: 25,      // Normal users
                low: 10          // New/unknown users
            }
        };
        
        // Stats
        this.stats = {
            totalRequests: 0,
            allowed: 0,
            blocked: 0,
            lurkModeActivations: 0,
            priorityOverrides: 0
        };
        
        this.isLurkMode = false;
    }
    
    /**
     * Check if bot should respond to a message
     */
    shouldRespond(message, userProfile, relationship) {
        this.stats.totalRequests++;
        
        // Update chat velocity
        this.updateChatVelocity();
        
        // Check if in lurk mode
        if (this.isLurkMode) {
            // Only respond to priority users or randomly
            const priority = this.getUserPriority(message.username, userProfile, relationship);
            
            if (priority >= this.config.priorities.high) {
                this.stats.priorityOverrides++;
                return this.createResponse(true, 'lurk_mode_override');
            }
            
            if (Math.random() > this.config.lurkModeResponseRate) {
                this.stats.blocked++;
                return this.createResponse(false, 'lurk_mode');
            }
        }
        
        // Check global rate limit
        const now = Date.now();
        
        // Reset minute counter
        if (now - this.minuteStart > 60000) {
            this.responsesThisMinute = 0;
            this.minuteStart = now;
        }
        
        if (this.responsesThisMinute >= this.config.maxResponsesPerMinute) {
            this.stats.blocked++;
            return this.createResponse(false, 'global_limit');
        }
        
        // Check minimum time between responses
        const timeSinceLastResponse = now - this.lastResponseTime;
        if (timeSinceLastResponse < this.config.minTimeBetweenResponses) {
            this.stats.blocked++;
            return this.createResponse(false, 'too_soon');
        }
        
        // Check per-user cooldown
        const userCooldown = this.getUserCooldown(message.username, userProfile, relationship);
        const lastUserResponse = this.userCooldowns.get(message.username) || 0;
        const timeSinceUserResponse = now - lastUserResponse;
        
        if (timeSinceUserResponse < userCooldown) {
            this.stats.blocked++;
            return this.createResponse(false, 'user_cooldown', {
                remaining: userCooldown - timeSinceUserResponse
            });
        }
        
        // Check priority queue
        const priority = this.getUserPriority(message.username, userProfile, relationship);
        
        // Critical priority always goes through
        if (priority >= this.config.priorities.critical) {
            this.stats.priorityOverrides++;
            return this.createResponse(true, 'critical_priority');
        }
        
        // Velocity-based decision
        if (this.chatVelocity > this.config.velocityThresholds.fast) {
            // Fast chat - be more selective
            if (priority < this.config.priorities.medium) {
                this.stats.blocked++;
                return this.createResponse(false, 'chat_too_fast');
            }
        }
        
        // All checks passed
        this.stats.allowed++;
        return this.createResponse(true, 'allowed');
    }
    
    /**
     * Record that a response was sent
     */
    recordResponse(username) {
        const now = Date.now();
        this.lastResponseTime = now;
        this.responsesThisMinute++;
        this.userCooldowns.set(username, now);
    }
    
    /**
     * Track incoming messages for velocity calculation
     */
    trackMessage(message) {
        const now = Date.now();
        
        // Reset minute counter
        if (now - this.messageMinuteStart > 60000) {
            this.chatVelocity = this.messagesThisMinute;
            this.messagesThisMinute = 0;
            this.messageMinuteStart = now;
        }
        
        this.messagesThisMinute++;
    }
    
    /**
     * Update chat velocity and lurk mode status
     */
    updateChatVelocity() {
        const now = Date.now();
        
        if (now - this.messageMinuteStart > 60000) {
            this.chatVelocity = this.messagesThisMinute;
            this.messagesThisMinute = 0;
            this.messageMinuteStart = now;
        }
        
        // Check if should enter/exit lurk mode
        const wasLurkMode = this.isLurkMode;
        this.isLurkMode = this.chatVelocity > this.config.lurkModeThreshold;
        
        if (this.isLurkMode && !wasLurkMode) {
            this.stats.lurkModeActivations++;
            console.log(`[RateLimit] Entering lurk mode (velocity: ${this.chatVelocity} msg/min)`);
        } else if (!this.isLurkMode && wasLurkMode) {
            console.log(`[RateLimit] Exiting lurk mode (velocity: ${this.chatVelocity} msg/min)`);
        }
    }
    
    /**
     * Get appropriate cooldown for a user
     */
    getUserCooldown(username, userProfile, relationship) {
        const priority = this.getUserPriority(username, userProfile, relationship);
        
        if (priority >= this.config.priorities.high) {
            return this.config.cooldowns.vip;
        }
        
        if (priority >= this.config.priorities.medium) {
            return this.config.cooldowns.normal;
        }
        
        // Check if flagged as spam
        if (userProfile && userProfile.spamScore && userProfile.spamScore > 50) {
            return this.config.cooldowns.spam;
        }
        
        // New user
        if (!userProfile || (userProfile.messageCount || 0) < 10) {
            return this.config.cooldowns.new;
        }
        
        return this.config.cooldowns.normal;
    }
    
    /**
     * Calculate user priority
     */
    getUserPriority(username, userProfile, relationship) {
        let priority = this.config.priorities.normal;
        
        // Check cached priority
        if (this.userPriority.has(username)) {
            return this.userPriority.get(username);
        }
        
        // Bot owner/admin
        if (this.isOwner(username)) {
            priority = this.config.priorities.critical;
        }
        // Moderators
        else if (this.isMod(username, userProfile)) {
            priority = this.config.priorities.high;
        }
        // Strong relationship (use friendshipLevel from userProfile)
        else if (userProfile && userProfile.friendshipLevel > 50) {
            priority = this.config.priorities.high;
        }
        // Friends
        else if (userProfile && userProfile.friendshipLevel > 25) {
            priority = this.config.priorities.medium;
        }
        // New users
        else if (!userProfile || (userProfile.messageCount || 0) < 10) {
            priority = this.config.priorities.low;
        }
        
        // Cache priority
        this.userPriority.set(username, priority);
        
        return priority;
    }
    
    /**
     * Check if user is owner
     */
    isOwner(username) {
        const owners = ['scheissgeist', 'slunt_dev', 'admin'];
        return owners.includes(username.toLowerCase());
    }
    
    /**
     * Check if user is moderator
     */
    isMod(username, userProfile) {
        if (!userProfile) return false;
        
        return userProfile.isMod || 
               userProfile.roles?.includes('mod') ||
               userProfile.roles?.includes('moderator');
    }
    
    /**
     * Create response object
     */
    createResponse(allowed, reason, extra = {}) {
        return {
            allowed,
            reason,
            chatVelocity: this.chatVelocity,
            isLurkMode: this.isLurkMode,
            responsesThisMinute: this.responsesThisMinute,
            ...extra
        };
    }
    
    /**
     * Override cooldown for a user (emergency/important)
     */
    overrideCooldown(username) {
        this.userCooldowns.delete(username);
        this.userPriority.set(username, this.config.priorities.critical);
    }
    
    /**
     * Reset user cooldown (e.g., after they've been inactive)
     */
    resetUserCooldown(username) {
        this.userCooldowns.delete(username);
    }
    
    /**
     * Set user priority manually
     */
    setUserPriority(username, priority) {
        this.userPriority.set(username, priority);
    }
    
    /**
     * Get current chat velocity description
     */
    getVelocityDescription() {
        if (this.chatVelocity < this.config.velocityThresholds.slow) {
            return 'dead';
        } else if (this.chatVelocity < this.config.velocityThresholds.normal) {
            return 'chill';
        } else if (this.chatVelocity < this.config.velocityThresholds.fast) {
            return 'active';
        } else if (this.chatVelocity < this.config.velocityThresholds.overwhelming) {
            return 'poppin';
        } else {
            return 'chaotic';
        }
    }
    
    /**
     * Get time until user can be responded to again
     */
    getTimeUntilUserReady(username, userProfile, relationship) {
        const lastResponse = this.userCooldowns.get(username);
        if (!lastResponse) return 0;
        
        const cooldown = this.getUserCooldown(username, userProfile, relationship);
        const elapsed = Date.now() - lastResponse;
        const remaining = cooldown - elapsed;
        
        return Math.max(0, remaining);
    }
    
    /**
     * Get priority queue (users ready to respond to, sorted by priority)
     */
    getPriorityQueue(recentMessages, userProfiles, relationships) {
        const queue = [];
        
        recentMessages.forEach(msg => {
            const userProfile = userProfiles.get(msg.username);
            const relationship = relationships.get(msg.username);
            const priority = this.getUserPriority(msg.username, userProfile, relationship);
            const timeUntilReady = this.getTimeUntilUserReady(msg.username, userProfile, relationship);
            
            if (timeUntilReady === 0) {
                queue.push({
                    username: msg.username,
                    priority,
                    message: msg
                });
            }
        });
        
        // Sort by priority (highest first)
        queue.sort((a, b) => b.priority - a.priority);
        
        return queue;
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            chatVelocity: this.chatVelocity,
            velocityDescription: this.getVelocityDescription(),
            isLurkMode: this.isLurkMode,
            responsesThisMinute: this.responsesThisMinute,
            allowedPercentage: this.stats.totalRequests > 0
                ? Math.round((this.stats.allowed / this.stats.totalRequests) * 100)
                : 0,
            activeCooldowns: this.userCooldowns.size
        };
    }
    
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            allowed: 0,
            blocked: 0,
            lurkModeActivations: 0,
            priorityOverrides: 0
        };
    }
}

module.exports = RateLimitingSystem;
