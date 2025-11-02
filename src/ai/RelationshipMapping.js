/**
 * Relationship Mapping System
 * Advanced social graph and relationship dynamics
 */

const fs = require('fs').promises;
const path = require('path');

class RelationshipMapping {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.relationships = new Map(); // user1-user2 -> relationship data
    this.friendGroups = [];
    this.socialGraph = new Map(); // username -> connections
    this.savePath = './data/relationships.json';
    this.saveTimeout = null; // Debounce timer
    this.loadRelationships(); // Auto-load on startup
  }

  /**
   * Load relationships from disk
   */
  async loadRelationships() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Convert arrays back to Maps with deduplication
      if (parsed.relationships) {
        this.relationships = new Map();
        const seenKeys = new Set();
        
        for (const [key, value] of parsed.relationships) {
          // Normalize the key to ensure no duplicates
          const users = key.split('-').sort();
          const normalizedKey = users.join('-');
          
          // Only add if we haven't seen this relationship yet
          if (!seenKeys.has(normalizedKey)) {
            seenKeys.add(normalizedKey);
            this.relationships.set(normalizedKey, value);
          } else {
            // Merge with existing entry if duplicate found
            const existing = this.relationships.get(normalizedKey);
            existing.interactions += value.interactions || 0;
            existing.strength = Math.max(existing.strength, value.strength || 0);
            existing.mentions += value.mentions || 0;
            existing.conversations += value.conversations || 0;
            console.log(`🔗 [Relationships] Merged duplicate: ${normalizedKey}`);
          }
        }
      }
      
      // Restore socialGraph with nested Maps
      this.socialGraph = new Map();
      if (parsed.socialGraph && Array.isArray(parsed.socialGraph)) {
        for (const [username, connections] of parsed.socialGraph) {
          // Only add if connections is iterable (array)
          if (Array.isArray(connections)) {
            this.socialGraph.set(username, new Map(connections));
          } else {
            console.warn(`🔗 [Relationships] Skipping ${username} - invalid connections format`);
          }
        }
      }
      
      this.friendGroups = parsed.friendGroups || [];
      
      console.log(`🔗 [Relationships] Loaded ${this.relationships.size} unique relationships from disk`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('🔗 [Relationships] Error loading:', error.message);
      }
    }
  }

  /**
   * Save relationships to disk (debounced)
   */
  async saveRelationships() {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Debounce: wait 2 seconds before saving
    this.saveTimeout = setTimeout(async () => {
      try {
        const dir = path.dirname(this.savePath);
        await fs.mkdir(dir, { recursive: true });

        // Convert nested Maps to arrays for JSON
        const socialGraphArray = Array.from(this.socialGraph.entries()).map(([username, connections]) => [
          username,
          Array.from(connections.entries())
        ]);

        // Convert platform Sets to arrays for JSON serialization
        const relationshipsArray = Array.from(this.relationships.entries()).map(([key, rel]) => {
          const serializedRel = { ...rel };
          if (rel.platforms) {
            serializedRel.platforms = {};
            for (const [username, platforms] of Object.entries(rel.platforms)) {
              serializedRel.platforms[username] = platforms instanceof Set ? Array.from(platforms) : platforms;
            }
          }
          return [key, serializedRel];
        });

        const data = {
          relationships: relationshipsArray,
          socialGraph: socialGraphArray,
          friendGroups: this.friendGroups,
          savedAt: Date.now()
        };

        await fs.writeFile(this.savePath, JSON.stringify(data, null, 2));
        console.log(`🔗 [Relationships] Saved ${this.relationships.size} relationships to disk`);
      } catch (error) {
        console.error('🔗 [Relationships] Error saving:', error.message);
      }
    }, 2000);
  }

  /**
   * Update relationship between two users
   */
  updateRelationship(user1, user2, interactionType, platform = 'unknown') {
    // Filter out system messages and invalid usernames
    if (!user1 || !user2 || 
        user1.includes('joined (aliases') || user2.includes('joined (aliases') ||
        user1.includes('left') || user2.includes('left') ||
        user1.includes('(aliases') || user2.includes('(aliases')) {
      return; // Skip system messages
    }

    // Normalize order (alphabetically)
    const [userA, userB] = [user1, user2].sort();
    const key = `${userA}-${userB}`;

    if (!this.relationships.has(key)) {
      this.relationships.set(key, {
        users: [userA, userB],
        strength: 0,
        interactions: 0,
        mentions: 0,
        conversations: 0,
        sentiment: 'neutral',
        firstInteraction: Date.now(),
        lastInteraction: Date.now(),
        platforms: {}, // Track which platforms each user has been seen on
        crossPlatform: false // Whether this is a cross-platform relationship
      });
    }

    const rel = this.relationships.get(key);
    rel.interactions++;
    rel.lastInteraction = Date.now();

    // Track platforms for each user
    if (!rel.platforms) rel.platforms = {};
    if (!rel.platforms[userA]) rel.platforms[userA] = new Set();
    if (!rel.platforms[userB]) rel.platforms[userB] = new Set();
    
    // Convert to Set if it's an array (from loaded data)
    if (Array.isArray(rel.platforms[userA])) rel.platforms[userA] = new Set(rel.platforms[userA]);
    if (Array.isArray(rel.platforms[userB])) rel.platforms[userB] = new Set(rel.platforms[userB]);
    
    rel.platforms[userA].add(platform);
    rel.platforms[userB].add(platform);
    
    // Check if this is a cross-platform relationship
    rel.crossPlatform = rel.platforms[userA].size > 1 || rel.platforms[userB].size > 1;

    // Update based on interaction type
    switch (interactionType) {
      case 'mention':
        rel.mentions++;
        rel.strength += 2;
        break;
      case 'reply':
        rel.conversations++;
        rel.strength += 3;
        break;
      case 'agreement':
        rel.strength += 5;
        rel.sentiment = 'positive';
        break;
      case 'disagreement':
        rel.strength -= 2;
        if (rel.strength < 0) rel.sentiment = 'negative';
        break;
      default:
        rel.strength += 1;
    }

    // Update social graph
    this.updateSocialGraph(userA, userB, rel.strength);

    console.log(`🔗 [Relationships] Updated ${userA} ↔ ${userB}: ${rel.strength} strength, ${rel.interactions} interactions (${platform})`);
    
    // Auto-save after updating (debounced would be better but this works)
    this.saveRelationships();
  }

  /**
   * Update social graph
   */
  updateSocialGraph(user1, user2, strength) {
    // Add connections
    if (!this.socialGraph.has(user1)) {
      this.socialGraph.set(user1, new Map());
    }
    if (!this.socialGraph.has(user2)) {
      this.socialGraph.set(user2, new Map());
    }

    this.socialGraph.get(user1).set(user2, strength);
    this.socialGraph.get(user2).set(user1, strength);
  }

  /**
   * Detect friend groups
   */
  detectFriendGroups() {
    const groups = [];
    const processed = new Set();

    for (const [username, connections] of this.socialGraph.entries()) {
      if (processed.has(username)) continue;

      // Find users with strong connections
      const strongConnections = Array.from(connections.entries())
        .filter(([, strength]) => strength > 20)
        .map(([user]) => user);

      if (strongConnections.length >= 2) {
        // Found a potential group
        const group = new Set([username, ...strongConnections]);
        
        // Check if these users are also connected to each other
        let internalConnections = 0;
        let possibleConnections = 0;
        
        for (const user1 of group) {
          for (const user2 of group) {
            if (user1 !== user2) {
              possibleConnections++;
              const key = [user1, user2].sort().join('-');
              const rel = this.relationships.get(key);
              if (rel && rel.strength > 10) {
                internalConnections++;
              }
            }
          }
        }

        // If more than 50% are connected, it's a friend group
        if (internalConnections / possibleConnections > 0.5) {
          groups.push({
            members: Array.from(group),
            cohesion: internalConnections / possibleConnections,
            size: group.size
          });

          group.forEach(u => processed.add(u));
        }
      }
    }

    this.friendGroups = groups;
    console.log(`🔗 [Relationships] Detected ${groups.length} friend groups`);
    return groups;
  }

  /**
   * Find mutual friends
   */
  findMutualFriends(user1, user2) {
    const connections1 = this.socialGraph.get(user1);
    const connections2 = this.socialGraph.get(user2);

    if (!connections1 || !connections2) return [];

    const mutual = [];
    for (const [friend, strength1] of connections1.entries()) {
      if (connections2.has(friend)) {
        const strength2 = connections2.get(friend);
        mutual.push({
          friend,
          strength: (strength1 + strength2) / 2
        });
      }
    }

    return mutual.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Suggest users who might become friends
   */
  suggestConnections(username) {
    const user = this.socialGraph.get(username);
    if (!user) return [];

    // Find friends of friends
    const suggestions = new Map();
    
    for (const [friend] of user.entries()) {
      const friendConnections = this.socialGraph.get(friend);
      if (!friendConnections) continue;

      for (const [potential, strength] of friendConnections.entries()) {
        if (potential !== username && !user.has(potential)) {
          suggestions.set(potential, (suggestions.get(potential) || 0) + strength);
        }
      }
    }

    return Array.from(suggestions.entries())
      .map(([user, score]) => ({ user, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  /**
   * Detect if two users are having beef
   */
  detectBeef(user1, user2) {
    const key = [user1, user2].sort().join('-');
    const rel = this.relationships.get(key);

    if (!rel) return { hasBeef: false };

    // Check for negative sentiment and recent conflict
    const recentActivity = Date.now() - rel.lastInteraction < 10 * 60 * 1000; // Last 10 minutes
    const negativeStrength = rel.strength < -5;
    const negativeSentiment = rel.sentiment === 'negative';

    const hasBeef = (negativeStrength || negativeSentiment) && recentActivity;

    return {
      hasBeef,
      strength: rel.strength,
      sentiment: rel.sentiment,
      lastInteraction: rel.lastInteraction
    };
  }

  /**
   * Get relationship summary
   */
  getRelationshipSummary(user1, user2) {
    const key = [user1, user2].sort().join('-');
    const rel = this.relationships.get(key);

    if (!rel) {
      return { status: 'strangers', description: 'No interaction history' };
    }

    let status = 'acquaintances';
    let description = '';

    if (rel.strength > 50) {
      status = 'close_friends';
      description = `Very close (${rel.interactions} interactions, ${rel.conversations} conversations)`;
    } else if (rel.strength > 20) {
      status = 'friends';
      description = `Good friends (${rel.interactions} interactions)`;
    } else if (rel.strength > 5) {
      status = 'friendly';
      description = `Friendly (${rel.interactions} interactions)`;
    } else if (rel.strength < -5) {
      status = 'conflict';
      description = `Ongoing conflict`;
    } else {
      description = `Occasional interaction (${rel.interactions} times)`;
    }

    return {
      status,
      description,
      strength: rel.strength,
      sentiment: rel.sentiment,
      interactions: rel.interactions,
      daysSince: Math.floor((Date.now() - rel.lastInteraction) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Find most connected user (hub)
   */
  findHubs() {
    const hubScores = new Map();

    for (const [username, connections] of this.socialGraph.entries()) {
      let score = 0;
      for (const strength of connections.values()) {
        score += strength;
      }
      hubScores.set(username, {
        username,
        connections: connections.size,
        totalStrength: score,
        avgStrength: score / connections.size
      });
    }

    return Array.from(hubScores.values())
      .sort((a, b) => b.totalStrength - a.totalStrength)
      .slice(0, 5);
  }

  /**
   * Detect potential drama
   */
  detectPotentialDrama() {
    const dramas = [];

    for (const [key, rel] of this.relationships.entries()) {
      // Recent negative interaction
      const recentNegative = rel.sentiment === 'negative' && 
                            Date.now() - rel.lastInteraction < 30 * 60 * 1000;
      
      // Sudden drop in relationship strength
      const historicalStrength = rel.strength + 20; // Estimate previous strength
      const suddenDrop = rel.strength < 0 && historicalStrength > 10;

      if (recentNegative || suddenDrop) {
        dramas.push({
          users: rel.users,
          severity: Math.abs(rel.strength),
          type: suddenDrop ? 'sudden_conflict' : 'ongoing_beef',
          lastInteraction: rel.lastInteraction
        });
      }
    }

    return dramas.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Get community structure insights
   */
  getCommunityInsights() {
    const groups = this.detectFriendGroups();
    const hubs = this.findHubs();
    const dramas = this.detectPotentialDrama();

    return {
      totalUsers: this.socialGraph.size,
      totalRelationships: this.relationships.size,
      friendGroups: groups.length,
      largestGroup: Math.max(...groups.map(g => g.size), 0),
      communityHubs: hubs.slice(0, 3).map(h => h.username),
      activeDramas: dramas.length,
      avgConnectionsPerUser: this.calculateAvgConnections()
    };
  }

  /**
   * Calculate average connections
   */
  calculateAvgConnections() {
    if (this.socialGraph.size === 0) return 0;

    let totalConnections = 0;
    for (const connections of this.socialGraph.values()) {
      totalConnections += connections.size;
    }

    return Math.round(totalConnections / this.socialGraph.size);
  }

  /**
   * Get visualization data for social graph
   */
  getGraphVisualization() {
    const nodes = [];
    const edges = [];

    // Create nodes
    for (const username of this.socialGraph.keys()) {
      const profile = this.chatBot.userProfiles.get(username);
      nodes.push({
        id: username,
        label: username,
        friendshipLevel: profile?.friendshipLevel || 0,
        messages: profile?.messageCount || 0
      });
    }

    // Create edges
    for (const [key, rel] of this.relationships.entries()) {
      if (rel.strength > 5) { // Only show significant relationships
        edges.push({
          from: rel.users[0],
          to: rel.users[1],
          weight: rel.strength,
          sentiment: rel.sentiment
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Get relationship stats
   */
  getStats() {
    // Filter out system messages from stats
    const validRelationships = Array.from(this.relationships.values())
      .filter(r => r && r.users && 
        !r.users.some(u => u.includes('joined (aliases') || u.includes('left') || u.includes('(aliases')));
    
    return {
      totalRelationships: validRelationships.length,
      activeUsers: this.socialGraph.size,
      friendGroups: this.friendGroups.length,
      strongRelationships: validRelationships.filter(r => r.strength > 20).length,
      conflicts: validRelationships.filter(r => r.sentiment === 'negative').length
    };
  }

  /**
   * Get all relationships with user profiles enriched
   */
  getEnrichedRelationships(userProfiles = null) {
    const enriched = [];
    
    for (const [key, rel] of this.relationships.entries()) {
      // Skip invalid relationships
      if (!rel || !rel.users || rel.users.length < 2) continue;
      if (rel.users.some(u => u.includes('joined (aliases') || u.includes('left') || u.includes('(aliases'))) {
        continue;
      }

      const enrichedRel = { ...rel };
      
      // Add user profile data if available
      if (userProfiles) {
        enrichedRel.userProfiles = {};
        rel.users.forEach(username => {
          const profile = userProfiles.get(username);
          if (profile) {
            enrichedRel.userProfiles[username] = {
              friendshipLevel: profile.friendshipLevel || 0,
              messageCount: profile.messageCount || 0,
              lastSeen: profile.lastSeen || null
            };
          }
        });
      }
      
      enriched.push([key, enrichedRel]);
    }
    
    return enriched;
  }

  /**
   * Find cross-platform user matches based on username similarity
   * Uses Levenshtein distance and normalization to identify same users
   */
  findCrossPlatformMatches() {
    const matches = [];
    const usersByPlatform = new Map();
    
    // Group users by platform
    for (const [key, rel] of this.relationships.entries()) {
      if (!rel.platforms) continue;
      
      for (const [username, platforms] of Object.entries(rel.platforms)) {
        if (!Array.isArray(platforms)) continue;
        
        platforms.forEach(platform => {
          if (!usersByPlatform.has(platform)) {
            usersByPlatform.set(platform, new Set());
          }
          usersByPlatform.get(platform).add(username);
        });
      }
    }
    
    // Compare users across platforms
    const allPlatforms = Array.from(usersByPlatform.keys());
    
    for (let i = 0; i < allPlatforms.length; i++) {
      for (let j = i + 1; j < allPlatforms.length; j++) {
        const platform1 = allPlatforms[i];
        const platform2 = allPlatforms[j];
        const users1 = Array.from(usersByPlatform.get(platform1) || []);
        const users2 = Array.from(usersByPlatform.get(platform2) || []);
        
        // Compare each user from platform1 with platform2
        for (const user1 of users1) {
          for (const user2 of users2) {
            const similarity = this.calculateUsernameSimilarity(user1, user2);
            
            if (similarity > 0.8) { // 80% similarity threshold
              matches.push({
                username1: user1,
                platform1: platform1,
                username2: user2,
                platform2: platform2,
                similarity: similarity,
                likelySamePerson: similarity > 0.9
              });
            }
          }
        }
      }
    }
    
    return matches;
  }

  /**
   * Calculate similarity between two usernames (0-1)
   * Uses normalized Levenshtein distance
   */
  calculateUsernameSimilarity(username1, username2) {
    // Normalize usernames
    const normalized1 = this.normalizeUsername(username1);
    const normalized2 = this.normalizeUsername(username2);
    
    if (normalized1 === normalized2) return 1.0;
    
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    return 1 - (distance / maxLength);
  }

  /**
   * Normalize username for comparison
   */
  normalizeUsername(username) {
    return username
      .toLowerCase()
      .replace(/[_\-\s]/g, '') // Remove underscores, hyphens, spaces
      .replace(/[0-9]+$/, ''); // Remove trailing numbers
  }

  /**
   * Calculate Levenshtein distance between two strings
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
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Merge relationship data for users identified as same person across platforms
   */
  mergeCrossPlatformUser(username1, platform1, username2, platform2) {
    console.log(`🔗 Merging cross-platform user: ${username1}@${platform1} = ${username2}@${platform2}`);
    
    // Find all relationships involving either username
    const relationshipsToUpdate = [];
    
    for (const [key, rel] of this.relationships.entries()) {
      if (rel.users.includes(username1) || rel.users.includes(username2)) {
        relationshipsToUpdate.push([key, rel]);
      }
    }
    
    // Update platform tracking for merged user
    relationshipsToUpdate.forEach(([key, rel]) => {
      if (!rel.platforms) rel.platforms = {};
      
      // If relationship involves username1, add username2's platform
      if (rel.users.includes(username1)) {
        if (!rel.platforms[username1]) rel.platforms[username1] = [];
        if (!rel.platforms[username1].includes(platform2)) {
          rel.platforms[username1].push(platform2);
        }
      }
      
      // If relationship involves username2, add username1's platform
      if (rel.users.includes(username2)) {
        if (!rel.platforms[username2]) rel.platforms[username2] = [];
        if (!rel.platforms[username2].includes(platform1)) {
          rel.platforms[username2].push(platform1);
        }
      }
      
      // Mark as cross-platform
      rel.crossPlatform = true;
    });
    
    this.saveRelationships();
  }
}

module.exports = RelationshipMapping;
