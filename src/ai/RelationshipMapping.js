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
    this.loadRelationships(); // Auto-load on startup
  }

  /**
   * Load relationships from disk
   */
  async loadRelationships() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Convert arrays back to Maps
      if (parsed.relationships) {
        this.relationships = new Map(parsed.relationships);
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
      
      console.log(`🔗 [Relationships] Loaded ${this.relationships.size} relationships from disk`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('🔗 [Relationships] Error loading:', error.message);
      }
    }
  }

  /**
   * Save relationships to disk
   */
  async saveRelationships() {
    try {
      const dir = path.dirname(this.savePath);
      await fs.mkdir(dir, { recursive: true });

      // Convert nested Maps to arrays for JSON
      const socialGraphArray = Array.from(this.socialGraph.entries()).map(([username, connections]) => [
        username,
        Array.from(connections.entries())
      ]);

      const data = {
        relationships: Array.from(this.relationships.entries()),
        socialGraph: socialGraphArray,
        friendGroups: this.friendGroups,
        savedAt: Date.now()
      };

      await fs.writeFile(this.savePath, JSON.stringify(data, null, 2));
      console.log(`🔗 [Relationships] Saved ${this.relationships.size} relationships to disk`);
    } catch (error) {
      console.error('🔗 [Relationships] Error saving:', error.message);
    }
  }

  /**
   * Update relationship between two users
   */
  updateRelationship(user1, user2, interactionType) {
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
        lastInteraction: Date.now()
      });
    }

    const rel = this.relationships.get(key);
    rel.interactions++;
    rel.lastInteraction = Date.now();

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

    console.log(`🔗 [Relationships] Updated ${userA} ↔ ${userB}: ${rel.strength} strength, ${rel.interactions} interactions`);
    
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
    return {
      totalRelationships: this.relationships.size,
      activeUsers: this.socialGraph.size,
      friendGroups: this.friendGroups.length,
      strongRelationships: Array.from(this.relationships.values())
        .filter(r => r.strength > 20).length,
      conflicts: Array.from(this.relationships.values())
        .filter(r => r.sentiment === 'negative').length
    };
  }
}

module.exports = RelationshipMapping;
