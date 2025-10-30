/**
 * Log Analyzer - Proactively analyzes bot logs for issues and improvement opportunities
 */
class LogAnalyzer {
  constructor() {
    this.metrics = {
      responsesSent: 0,
      responsesSkipped: 0,
      responsesBlocked: 0,
      errorsDetected: 0,
      truncatedResponses: 0,
      splitMessages: 0,
      duplicatesBlocked: 0,
      contentFiltered: 0,
      rateLimited: 0,
      chaosModifications: 0,
      avgResponseLength: 0,
      totalResponseLength: 0
    };
    
    this.issues = [];
    this.suggestions = [];
    this.recentErrors = [];
    this.recentResponses = [];
    this.maxRecentResponses = 20;
    
    // Patterns to detect issues
    this.errorPatterns = [
      { pattern: /Error generating response/i, severity: 'high', category: 'AI Generation' },
      { pattern: /TypeError|ReferenceError|undefined/i, severity: 'critical', category: 'Code Error' },
      { pattern: /Connection error|disconnect/i, severity: 'medium', category: 'Connection' },
      { pattern: /Rate limit/i, severity: 'low', category: 'Rate Limiting' },
      { pattern: /Content filter/i, severity: 'medium', category: 'Content Moderation' },
      { pattern: /Already generating response/i, severity: 'info', category: 'Response Lock' }
    ];
    
    this.improvementPatterns = [
      { pattern: /Split into \d+ messages/, suggestion: 'Consider adjusting message split thresholds' },
      { pattern: /Blocked duplicate phrase/, suggestion: 'Response variety working - monitor for over-blocking' },
      { pattern: /Staying quiet on \w+ - not in conversation/, suggestion: 'Natural conversation mode active' },
      { pattern: /Message sent to \w+: .{150,}/, suggestion: 'Long response detected - check truncation' }
    ];
  }

  /**
   * Analyze a log line and extract metrics
   */
  analyzeLine(line) {
    if (!line || typeof line !== 'string') return;
    
    // Track responses sent
    if (line.includes('✅ Message sent to')) {
      this.metrics.responsesSent++;
      
      // Extract the actual message
      const match = line.match(/Message sent to \w+: (.+)/);
      if (match) {
        const message = match[1];
        this.metrics.totalResponseLength += message.length;
        this.metrics.avgResponseLength = this.metrics.totalResponseLength / this.metrics.responsesSent;
        
        this.recentResponses.push({
          message,
          length: message.length,
          timestamp: new Date().toISOString(),
          truncated: message.endsWith('...') || /\w!$/.test(message) // Ends with letter + !
        });
        
        if (this.recentResponses.length > this.maxRecentResponses) {
          this.recentResponses.shift();
        }
        
        // Check for truncation issues
        if (message.length > 0 && message[message.length - 1].match(/[a-z]!/i)) {
          this.metrics.truncatedResponses++;
        }
      }
    }
    
    // Track skipped responses
    if (line.includes('Already generating response, skipping')) {
      this.metrics.responsesSkipped++;
    }
    
    // Track blocked responses
    if (line.includes('Blocked duplicate') || line.includes('too similar')) {
      this.metrics.responsesBlocked++;
      this.metrics.duplicatesBlocked++;
    }
    
    // Track split messages
    if (line.includes('Split into') && line.includes('messages')) {
      this.metrics.splitMessages++;
    }
    
    // Track chaos modifications
    if (line.includes('Applied: hierarchy') || line.includes('Applied: personality')) {
      this.metrics.chaosModifications++;
    }
    
    // Track content filtering
    if (line.includes('ContentFilter') || line.includes('Message filtered')) {
      this.metrics.contentFiltered++;
    }
    
    // Track rate limiting
    if (line.includes('RateLimit')) {
      this.metrics.rateLimited++;
    }
    
    // Detect errors
    for (const errorPattern of this.errorPatterns) {
      if (errorPattern.pattern.test(line)) {
        this.metrics.errorsDetected++;
        
        this.recentErrors.push({
          line,
          severity: errorPattern.severity,
          category: errorPattern.category,
          timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 errors
        if (this.recentErrors.length > 50) {
          this.recentErrors.shift();
        }
      }
    }
    
    // Generate improvement suggestions
    for (const improvementPattern of this.improvementPatterns) {
      if (improvementPattern.pattern.test(line)) {
        // Don't duplicate suggestions
        if (!this.suggestions.some(s => s.message === improvementPattern.suggestion)) {
          this.suggestions.push({
            message: improvementPattern.suggestion,
            detectedAt: new Date().toISOString(),
            occurrences: 1
          });
        } else {
          const existing = this.suggestions.find(s => s.message === improvementPattern.suggestion);
          existing.occurrences++;
        }
      }
    }
  }

  /**
   * Analyze multiple log lines
   */
  analyzeLines(lines) {
    if (!Array.isArray(lines)) return;
    
    for (const line of lines) {
      this.analyzeLine(line);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.responsesSent / (this.metrics.responsesSent + this.metrics.responsesBlocked + this.metrics.responsesSkipped) || 0,
      truncationRate: this.metrics.truncatedResponses / this.metrics.responsesSent || 0,
      errorRate: this.metrics.errorsDetected / this.metrics.responsesSent || 0
    };
  }

  /**
   * Get issues detected
   */
  getIssues() {
    const issues = [];
    
    // High truncation rate
    const truncationRate = this.metrics.truncatedResponses / this.metrics.responsesSent || 0;
    if (truncationRate > 0.3) {
      issues.push({
        severity: 'medium',
        category: 'Response Quality',
        message: `High truncation rate: ${(truncationRate * 100).toFixed(1)}% of responses are cut off`,
        recommendation: 'Adjust truncation logic to avoid cutting mid-word'
      });
    }
    
    // High split message rate
    const splitRate = this.metrics.splitMessages / this.metrics.responsesSent || 0;
    if (splitRate > 0.2) {
      issues.push({
        severity: 'low',
        category: 'Message Flow',
        message: `${(splitRate * 100).toFixed(1)}% of responses are split into multiple messages`,
        recommendation: 'Consider adjusting split thresholds or improving response generation'
      });
    }
    
    // High chaos modification rate
    const chaosRate = this.metrics.chaosModifications / this.metrics.responsesSent || 0;
    if (chaosRate > 0.5) {
      issues.push({
        severity: 'medium',
        category: 'Response Quality',
        message: `${(chaosRate * 100).toFixed(1)}% of responses have chaos modifications`,
        recommendation: 'Tune chaos system to reduce random text additions'
      });
    }
    
    // Recent critical errors
    const recentCritical = this.recentErrors.filter(e => 
      e.severity === 'critical' && 
      Date.now() - new Date(e.timestamp).getTime() < 300000 // Last 5 minutes
    );
    
    if (recentCritical.length > 0) {
      issues.push({
        severity: 'critical',
        category: 'Code Error',
        message: `${recentCritical.length} critical errors in the last 5 minutes`,
        recommendation: 'Check error logs and fix code issues immediately'
      });
    }
    
    return issues;
  }

  /**
   * Get improvement suggestions
   */
  getSuggestions() {
    return this.suggestions.sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10) {
    return this.recentErrors.slice(-limit).reverse();
  }

  /**
   * Get recent responses for quality analysis
   */
  getRecentResponses(limit = 10) {
    return this.recentResponses.slice(-limit).reverse();
  }

  /**
   * Generate a summary report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const issues = this.getIssues();
    const suggestions = this.getSuggestions();
    
    return {
      timestamp: new Date().toISOString(),
      metrics,
      issues,
      suggestions: suggestions.slice(0, 5), // Top 5 suggestions
      recentErrors: this.getRecentErrors(5),
      healthScore: this.calculateHealthScore(metrics, issues)
    };
  }

  /**
   * Calculate overall health score (0-100)
   */
  calculateHealthScore(metrics, issues) {
    let score = 100;
    
    // Deduct for errors
    score -= issues.filter(i => i.severity === 'critical').length * 20;
    score -= issues.filter(i => i.severity === 'high').length * 10;
    score -= issues.filter(i => i.severity === 'medium').length * 5;
    
    // Deduct for poor success rate
    if (metrics.successRate < 0.7) {
      score -= (0.7 - metrics.successRate) * 50;
    }
    
    // Deduct for high error rate
    if (metrics.errorRate > 0.1) {
      score -= (metrics.errorRate - 0.1) * 100;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      responsesSent: 0,
      responsesSkipped: 0,
      responsesBlocked: 0,
      errorsDetected: 0,
      truncatedResponses: 0,
      splitMessages: 0,
      duplicatesBlocked: 0,
      contentFiltered: 0,
      rateLimited: 0,
      chaosModifications: 0,
      avgResponseLength: 0,
      totalResponseLength: 0
    };
    
    this.issues = [];
    this.suggestions = [];
    this.recentErrors = [];
  }
}

module.exports = LogAnalyzer;
