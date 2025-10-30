const fs = require('fs').promises;
const path = require('path');

/**
 * Contradiction Tracking
 * Remembers Slunt's past statements and creates contradictions
 */
class ContradictionTracking {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.aiEngine = chatBot.ai; // Reference to AI engine
    
    // Statement tracking
    this.statements = []; // Past claims Slunt has made
    this.contradictions = []; // Recorded contradictions
    this.callOuts = new Map(); // username -> times they've called out contradictions
    
    // Config
    this.maxStatements = 200;
    this.contradictionChance = 0.15; // 15% chance to contradict on purpose
    this.defensiveChance = 0.70; // 70% chance to be defensive when called out
    
    this.dataPath = path.join(__dirname, '../../data/contradictions.json');
    this.load();
  }

  /**
   * Record a statement Slunt made
   */
  async recordStatement(message, context = {}) {
    // Extract factual claims using AI
    const prompt = `Extract any factual claims from this statement:

"${message}"

If there are factual claims (preferences, facts, opinions, abilities), list them briefly. If none, respond with "NONE".
Claims:`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.3,
        max_tokens: 100
      });

      if (response.trim().toUpperCase() === 'NONE') return;

      const statement = {
        id: `stmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message,
        claims: response.trim(),
        timestamp: Date.now(),
        contradicted: false
      };

      this.statements.push(statement);

      // Keep only recent statements
      if (this.statements.length > this.maxStatements) {
        this.statements.shift();
      }

      this.save();
    } catch (error) {
      console.error('Failed to record statement:', error);
    }
  }

  /**
   * Check if current context allows for intentional contradiction
   */
  async maybeContradict(currentTopic, context = {}) {
    if (Math.random() > this.contradictionChance) return null;
    if (this.statements.length < 10) return null;

    // Find a related past statement
    const relatedStatement = await this.findRelatedStatement(currentTopic);
    if (!relatedStatement) return null;

    // Generate contradiction
    const prompt = `You previously said: "${relatedStatement.message}"

Now generate a statement that contradicts this, but make it seem natural and casual. Slunt has bad memory and doesn't realize he's contradicting himself.

New statement:`;

    try {
      const contradiction = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.85,
        max_tokens: 60
      });

      this.contradictions.push({
        originalId: relatedStatement.id,
        original: relatedStatement.message,
        contradiction: contradiction.trim(),
        timestamp: Date.now(),
        caughtBy: []
      });

      relatedStatement.contradicted = true;

      console.log(`🤔 [Contradiction] Created intentional contradiction`);
      this.save();

      return {
        text: contradiction.trim(),
        originalStatement: relatedStatement.message
      };
    } catch (error) {
      console.error('Failed to generate contradiction:', error);
      return null;
    }
  }

  /**
   * Find statement related to current topic
   */
  async findRelatedStatement(topic) {
    const eligible = this.statements.filter(s => !s.contradicted);
    if (eligible.length === 0) return null;

    // Use AI to find related statement
    const recentStatements = eligible.slice(-20).map((s, i) => 
      `${i + 1}. "${s.message}"`
    ).join('\n');

    const prompt = `Current topic: "${topic}"

Past statements:
${recentStatements}

Which statement (if any) could be contradicted in a funny way related to the current topic? Answer with just the number, or NONE.`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.3,
        max_tokens: 5
      });

      const match = response.match(/\d+/);
      if (match) {
        const index = parseInt(match[0]) - 1;
        const eligibleStatements = eligible.slice(-20);
        if (index >= 0 && index < eligibleStatements.length) {
          return eligibleStatements[index];
        }
      }
    } catch (error) {
      console.error('Failed to find related statement:', error);
    }

    return null;
  }

  /**
   * Handle being called out for contradiction
   */
  async handleCallOut(username, message) {
    // Track who called us out
    this.callOuts.set(username, (this.callOuts.get(username) || 0) + 1);

    // Generate defensive response
    if (Math.random() < this.defensiveChance) {
      return await this.generateDefensiveResponse(username);
    } else {
      return await this.generateAdmissionResponse();
    }
  }

  /**
   * Generate defensive response
   */
  async generateDefensiveResponse(username) {
    const callOutCount = this.callOuts.get(username) || 1;
    
    const prompt = `You're Slunt. ${username} is calling you out for contradicting yourself.${callOutCount > 2 ? ` They've done this ${callOutCount} times now.` : ''}

Generate a defensive, casual response. Deny it or deflect. Be brief.
Response:`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.85,
        max_tokens: 40
      });

      console.log(`🛡️ [Contradiction] Being defensive with ${username}`);
      return response.trim();
    } catch (error) {
      console.error('Failed to generate defensive response:', error);
      return "nah i didn't say that";
    }
  }

  /**
   * Generate admission response
   */
  async generateAdmissionResponse() {
    const prompt = `You're Slunt. You just got caught contradicting yourself. Generate a casual admission or excuse. Be brief and funny about it.
Response:`;

    try {
      const response = await this.aiEngine.generateCompletion(prompt, {
        temperature: 0.85,
        max_tokens: 40
      });

      console.log(`😅 [Contradiction] Admitting contradiction`);
      return response.trim();
    } catch (error) {
      console.error('Failed to generate admission:', error);
      return "ok yeah my memory's trash";
    }
  }

  /**
   * Get status for dashboard
   */
  getStatus() {
    return {
      totalStatements: this.statements.length,
      contradictions: this.contradictions.length,
      recentContradictions: this.contradictions.slice(-5).map(c => ({
        original: c.original.substring(0, 50),
        contradiction: c.contradiction.substring(0, 50),
        caughtBy: c.caughtBy
      })),
      mostSuspicious: Array.from(this.callOuts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([user, count]) => ({ user, count }))
    };
  }

  async save() {
    try {
      const data = {
        statements: this.statements.slice(-this.maxStatements),
        contradictions: this.contradictions.slice(-50),
        callOuts: Array.from(this.callOuts.entries())
      };
      
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save contradictions:', error);
    }
  }

  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.statements = parsed.statements || [];
      this.contradictions = parsed.contradictions || [];
      this.callOuts = new Map(parsed.callOuts || []);
      
      console.log(`🤔 [Contradiction] Loaded ${this.statements.length} statements and ${this.contradictions.length} contradictions`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load contradictions:', error);
      }
    }
  }
}

module.exports = ContradictionTracking;
