/**
 * Hierarchical Memory System
 *
 * Three-tier memory architecture:
 * 1. Working Memory (last 10 minutes / ~100 messages) - Raw chat data
 * 2. Short-term Memory (last 10 hours) - AI-summarized highlights
 * 3. Long-term Memory (persistent daily summaries) - Compressed wisdom
 *
 * Like human memory: detailed recent → summarized medium → compressed long-term
 */

const fs = require('fs').promises;
const path = require('path');

class HierarchicalMemory {
  constructor(grokClient, dataDir = './data/memory') {
    this.grok = grokClient; // OpenAI client for Grok
    this.dataDir = dataDir;

    // Working Memory: Last 10 minutes of chat (detailed)
    this.workingMemory = {
      messages: [], // { timestamp, username, text, platform, channel }
      maxAge: 10 * 60 * 1000, // 10 minutes
      maxMessages: 100
    };

    // Short-term Memory: Last 10 hours (summarized chunks)
    this.shortTermMemory = {
      summaries: [], // { timestamp, period, summary, topics, users }
      maxAge: 10 * 60 * 60 * 1000, // 10 hours
      chunkInterval: 10 * 60 * 1000 // Summarize every 10 minutes
    };

    // Long-term Memory: Daily summaries (compressed wisdom)
    this.longTermMemory = {
      dailySummaries: [], // { date, summary, keyEvents, relationships, topics }
      maxDays: 30 // Keep last 30 days
    };

    // Timers for automatic processing
    this.shortTermTimer = null;
    this.longTermTimer = null;

    // Ensure data directory exists
    this.ensureDataDir();
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (err) {
      console.error('[HierarchicalMemory] Failed to create data dir:', err.message);
    }
  }

  /**
   * Add a message to working memory
   */
  addMessage(username, text, platform = 'coolhole', channel = 'default') {
    const message = {
      timestamp: Date.now(),
      username,
      text: text.substring(0, 500), // Limit length
      platform,
      channel
    };

    this.workingMemory.messages.push(message);

    // Trim old messages
    this.trimWorkingMemory();
  }

  /**
   * Trim working memory to keep only recent messages
   */
  trimWorkingMemory() {
    const now = Date.now();
    const cutoff = now - this.workingMemory.maxAge;

    // Remove messages older than 10 minutes
    this.workingMemory.messages = this.workingMemory.messages.filter(
      msg => msg.timestamp > cutoff
    );

    // Keep only last N messages if still too many
    if (this.workingMemory.messages.length > this.workingMemory.maxMessages) {
      this.workingMemory.messages = this.workingMemory.messages.slice(-this.workingMemory.maxMessages);
    }
  }

  /**
   * Get working memory context for AI responses
   * Returns recent messages formatted for context
   */
  getWorkingMemoryContext(maxMessages = 20) {
    const recent = this.workingMemory.messages.slice(-maxMessages);
    return recent.map(m => `${m.username}: ${m.text}`).join('\n');
  }

  /**
   * Get full context for AI (working + short-term + long-term)
   * Returns a comprehensive context string
   */
  async getFullContext(options = {}) {
    const includeWorking = options.includeWorking !== false;
    const includeShortTerm = options.includeShortTerm !== false;
    const includeLongTerm = options.includeLongTerm !== false;

    let context = '';

    // Long-term memory (oldest, most compressed)
    if (includeLongTerm && this.longTermMemory.dailySummaries.length > 0) {
      const recentDays = this.longTermMemory.dailySummaries.slice(-7); // Last 7 days
      const longTermSummary = recentDays.map(d =>
        `${d.date}: ${d.summary}`
      ).join('\n');

      if (longTermSummary) {
        context += `[Long-term Memory - Past Week]\n${longTermSummary}\n\n`;
      }
    }

    // Short-term memory (medium detail)
    if (includeShortTerm && this.shortTermMemory.summaries.length > 0) {
      const recentSummaries = this.shortTermMemory.summaries.slice(-6); // Last hour (6x 10min chunks)
      const shortTermSummary = recentSummaries.map(s =>
        `[${new Date(s.timestamp).toLocaleTimeString()}] ${s.summary}`
      ).join('\n');

      if (shortTermSummary) {
        context += `[Short-term Memory - Past Hour]\n${shortTermSummary}\n\n`;
      }
    }

    // Working memory (most detailed, most recent)
    if (includeWorking) {
      const workingContext = this.getWorkingMemoryContext(20);
      if (workingContext) {
        context += `[Working Memory - Last 10 Minutes]\n${workingContext}\n\n`;
      }
    }

    return context;
  }

  /**
   * Start automatic memory consolidation
   */
  startAutoConsolidation() {
    // Consolidate working → short-term every 10 minutes
    this.shortTermTimer = setInterval(() => {
      this.consolidateToShortTerm();
    }, this.shortTermMemory.chunkInterval);

    // Consolidate short-term → long-term daily at midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Next midnight
    const msUntilMidnight = midnight - now;

    setTimeout(() => {
      this.consolidateToLongTerm();
      // Then repeat daily
      this.longTermTimer = setInterval(() => {
        this.consolidateToLongTerm();
      }, 24 * 60 * 60 * 1000); // Every 24 hours
    }, msUntilMidnight);

    console.log('[HierarchicalMemory] Auto-consolidation started');
    console.log(`  - Short-term: every 10 minutes`);
    console.log(`  - Long-term: daily at midnight (${msUntilMidnight/1000/60} min until first run)`);
  }

  /**
   * Consolidate working memory → short-term memory
   * Summarizes the last 10 minutes of chat using AI
   */
  async consolidateToShortTerm() {
    try {
      // Get messages from the last consolidation period
      const messages = this.workingMemory.messages;

      if (messages.length === 0) {
        console.log('[HierarchicalMemory] No messages to consolidate');
        return;
      }

      // Format messages for summarization
      const chatLog = messages.map(m =>
        `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.username}: ${m.text}`
      ).join('\n');

      // Ask Grok to summarize
      const prompt = `Summarize this 10-minute chat segment in 2-3 sentences. Focus on:
- Main topics discussed
- Key events or funny moments
- User interactions/relationships
- Overall vibe

Chat log:
${chatLog}

Summary (2-3 sentences):`;

      const response = await this.grok.chat.completions.create({
        model: 'grok-4-fast-reasoning',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      });

      const summary = response.choices[0]?.message?.content?.trim();

      if (summary) {
        // Extract topics and users
        const users = [...new Set(messages.map(m => m.username))];
        const topics = this.extractTopics(messages);

        const chunk = {
          timestamp: Date.now(),
          period: `${new Date(messages[0].timestamp).toLocaleTimeString()} - ${new Date(messages[messages.length-1].timestamp).toLocaleTimeString()}`,
          summary,
          topics,
          users: users.slice(0, 10) // Top 10 active users
        };

        this.shortTermMemory.summaries.push(chunk);

        // Trim old summaries (keep last 10 hours)
        const cutoff = Date.now() - this.shortTermMemory.maxAge;
        this.shortTermMemory.summaries = this.shortTermMemory.summaries.filter(
          s => s.timestamp > cutoff
        );

        console.log(`[HierarchicalMemory] Consolidated to short-term: "${summary.substring(0, 60)}..."`);

        // Save to disk
        await this.saveShortTerm();
      }

    } catch (error) {
      console.error('[HierarchicalMemory] Short-term consolidation failed:', error.message);
    }
  }

  /**
   * Consolidate short-term memory → long-term memory
   * Creates a daily summary from the past day's short-term summaries
   */
  async consolidateToLongTerm() {
    try {
      const summaries = this.shortTermMemory.summaries;

      if (summaries.length === 0) {
        console.log('[HierarchicalMemory] No short-term summaries to consolidate');
        return;
      }

      // Combine all short-term summaries from today
      const summaryText = summaries.map(s => s.summary).join(' ');

      // Ask Grok to create daily summary
      const prompt = `Create a daily summary from these hourly chat summaries. In 3-5 sentences, capture:
- Main themes and topics of the day
- Notable events or conversations
- Key relationships and interactions
- Overall community vibe

Hourly summaries:
${summaryText}

Daily summary (3-5 sentences):`;

      const response = await this.grok.chat.completions.create({
        model: 'grok-4-fast-reasoning',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7
      });

      const dailySummary = response.choices[0]?.message?.content?.trim();

      if (dailySummary) {
        // Extract all topics and users from the day
        const allTopics = new Set();
        const allUsers = new Set();

        summaries.forEach(s => {
          s.topics?.forEach(t => allTopics.add(t));
          s.users?.forEach(u => allUsers.add(u));
        });

        const daily = {
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          summary: dailySummary,
          topics: Array.from(allTopics).slice(0, 20),
          users: Array.from(allUsers).slice(0, 30),
          messageCount: summaries.reduce((sum, s) => sum + (s.messageCount || 0), 0)
        };

        this.longTermMemory.dailySummaries.push(daily);

        // Trim to keep only last N days
        if (this.longTermMemory.dailySummaries.length > this.longTermMemory.maxDays) {
          this.longTermMemory.dailySummaries = this.longTermMemory.dailySummaries.slice(-this.longTermMemory.maxDays);
        }

        console.log(`[HierarchicalMemory] Consolidated to long-term: "${dailySummary.substring(0, 60)}..."`);

        // Save to disk
        await this.saveLongTerm();

        // Clear processed short-term summaries
        this.shortTermMemory.summaries = [];
        await this.saveShortTerm();
      }

    } catch (error) {
      console.error('[HierarchicalMemory] Long-term consolidation failed:', error.message);
    }
  }

  /**
   * Extract topics from messages using simple keyword analysis
   */
  extractTopics(messages) {
    const text = messages.map(m => m.text.toLowerCase()).join(' ');
    const words = text.split(/\s+/);

    // Count word frequency (ignore common words)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those']);

    const wordCounts = {};
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });

    // Get top topics
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Save short-term memory to disk
   */
  async saveShortTerm() {
    try {
      const filepath = path.join(this.dataDir, 'short-term-memory.json');
      await fs.writeFile(filepath, JSON.stringify(this.shortTermMemory, null, 2));
    } catch (error) {
      console.error('[HierarchicalMemory] Failed to save short-term:', error.message);
    }
  }

  /**
   * Save long-term memory to disk
   */
  async saveLongTerm() {
    try {
      const filepath = path.join(this.dataDir, 'long-term-memory.json');
      await fs.writeFile(filepath, JSON.stringify(this.longTermMemory, null, 2));
    } catch (error) {
      console.error('[HierarchicalMemory] Failed to save long-term:', error.message);
    }
  }

  /**
   * Load memory from disk
   */
  async load() {
    try {
      // Load short-term
      try {
        const shortTermPath = path.join(this.dataDir, 'short-term-memory.json');
        const shortTermData = await fs.readFile(shortTermPath, 'utf8');
        const loaded = JSON.parse(shortTermData);
        this.shortTermMemory.summaries = loaded.summaries || [];
        console.log(`[HierarchicalMemory] Loaded ${this.shortTermMemory.summaries.length} short-term summaries`);
      } catch (err) {
        console.log('[HierarchicalMemory] No short-term memory file found (starting fresh)');
      }

      // Load long-term
      try {
        const longTermPath = path.join(this.dataDir, 'long-term-memory.json');
        const longTermData = await fs.readFile(longTermPath, 'utf8');
        const loaded = JSON.parse(longTermData);
        this.longTermMemory.dailySummaries = loaded.dailySummaries || [];
        console.log(`[HierarchicalMemory] Loaded ${this.longTermMemory.dailySummaries.length} daily summaries`);
      } catch (err) {
        console.log('[HierarchicalMemory] No long-term memory file found (starting fresh)');
      }

    } catch (error) {
      console.error('[HierarchicalMemory] Failed to load memory:', error.message);
    }
  }

  /**
   * Stop timers (for clean shutdown)
   */
  stop() {
    if (this.shortTermTimer) clearInterval(this.shortTermTimer);
    if (this.longTermTimer) clearInterval(this.longTermTimer);
    console.log('[HierarchicalMemory] Auto-consolidation stopped');
  }
}

module.exports = HierarchicalMemory;
