/**
 * PredictionEngine.js
 * Makes predictions about users and chat, tracks accuracy
 */

const fs = require('fs').promises;
const path = require('path');

class PredictionEngine {
  constructor() {
    this.predictions = [];
    this.savePath = './data/predictions.json';
    this.loadPredictions();
  }
  
  /**
   * Load predictions from disk
   */
  async loadPredictions() {
    try {
      const data = await fs.readFile(this.savePath, 'utf8');
      this.predictions = JSON.parse(data);
      console.log(`🔮 [Predictions] Loaded ${this.predictions.length} predictions`);
    } catch (error) {
      console.log('🔮 [Predictions] No existing predictions found');
    }
  }
  
  /**
   * Save predictions to disk
   */
  async savePredictions() {
    try {
      await fs.writeFile(this.savePath, JSON.stringify(this.predictions, null, 2));
    } catch (error) {
      console.error('[Predictions] Save error:', error);
    }
  }
  
  /**
   * Make a prediction
   */
  makePrediction(type, details) {
    const prediction = {
      id: Date.now(),
      type, // 'user_behavior', 'chat_pattern', 'video_reaction', 'drama'
      prediction: details.prediction,
      target: details.target, // username or null
      confidence: details.confidence || 50, // 0-100
      timeframe: details.timeframe || 300000, // 5 minutes default
      createdAt: Date.now(),
      resolvedAt: null,
      outcome: null, // 'correct', 'incorrect', 'unknown'
      evidence: []
    };
    
    this.predictions.push(prediction);
    this.savePredictions();
    
    console.log(`🔮 [Predictions] Made ${type} prediction: "${details.prediction}"`);
    
    return prediction;
  }
  
  /**
   * Generate a random prediction
   */
  generatePrediction(context) {
    const { username, chatState, recentMessages } = context;
    
    const types = [
      { type: 'user_behavior', weight: 0.3 },
      { type: 'chat_pattern', weight: 0.3 },
      { type: 'video_reaction', weight: 0.2 },
      { type: 'drama', weight: 0.2 }
    ];
    
    // Weighted random selection
    const random = Math.random();
    let cumulative = 0;
    let selectedType;
    
    for (const t of types) {
      cumulative += t.weight;
      if (random < cumulative) {
        selectedType = t.type;
        break;
      }
    }
    
    let predictionText, target, confidence;
    
    switch (selectedType) {
      case 'user_behavior':
        if (username) {
          const behaviors = [
            `${username} gonna say something dumb in the next 5 minutes`,
            `${username} about to leave`,
            `${username} gonna start an argument`,
            `${username} gonna post a bad take`,
            `${username} gonna agree with me soon`
          ];
          predictionText = behaviors[Math.floor(Math.random() * behaviors.length)];
          target = username;
          confidence = 60;
        }
        break;
        
      case 'chat_pattern':
        const patterns = [
          'chat gonna get heated',
          'someone gonna change the subject',
          'chat about to die',
          'spam incoming',
          'everyone gonna agree on this'
        ];
        predictionText = patterns[Math.floor(Math.random() * patterns.length)];
        target = null;
        confidence = 55;
        break;
        
      case 'video_reaction':
        const reactions = [
          'next video gonna flop',
          'everyone gonna skip this',
          'this video gonna be fire',
          'someone gonna complain about the video',
          'video queue about to get weird'
        ];
        predictionText = reactions[Math.floor(Math.random() * reactions.length)];
        target = null;
        confidence = 50;
        break;
        
      case 'drama':
        const dramas = [
          'drama brewing',
          'someones gonna get mad',
          'beef incoming',
          'awkward moment coming up',
          'someone about to get roasted'
        ];
        predictionText = dramas[Math.floor(Math.random() * dramas.length)];
        target = null;
        confidence = 65;
        break;
    }
    
    if (!predictionText) return null;
    
    return this.makePrediction(selectedType, {
      prediction: predictionText,
      target,
      confidence,
      timeframe: 300000 // 5 minutes
    });
  }
  
  /**
   * Check for prediction opportunities
   */
  shouldMakePrediction() {
    // Don't make predictions too frequently
    const recentPredictions = this.predictions.filter(p => 
      Date.now() - p.createdAt < 600000 && !p.resolvedAt
    );
    
    if (recentPredictions.length >= 2) return false;
    
    // 5% chance to make a prediction
    return Math.random() < 0.05;
  }
  
  /**
   * Update prediction with evidence
   */
  addEvidence(predictionId, evidence) {
    const prediction = this.predictions.find(p => p.id === predictionId);
    if (!prediction) return;
    
    prediction.evidence.push({
      text: evidence,
      timestamp: Date.now()
    });
    
    this.savePredictions();
  }
  
  /**
   * Resolve a prediction
   */
  resolvePrediction(predictionId, outcome) {
    const prediction = this.predictions.find(p => p.id === predictionId);
    if (!prediction) return;
    
    prediction.resolvedAt = Date.now();
    prediction.outcome = outcome;
    
    this.savePredictions();
    
    console.log(`🔮 [Predictions] Resolved: ${prediction.prediction} → ${outcome}`);
    
    return prediction;
  }
  
  /**
   * Check for expired predictions
   */
  checkExpiredPredictions() {
    const now = Date.now();
    const expired = [];
    
    for (const prediction of this.predictions) {
      if (prediction.resolvedAt) continue;
      
      const age = now - prediction.createdAt;
      if (age > prediction.timeframe) {
        // Auto-resolve as unknown
        this.resolvePrediction(prediction.id, 'unknown');
        expired.push(prediction);
      }
    }
    
    return expired;
  }
  
  /**
   * Auto-check predictions against events
   */
  checkPredictionMatch(event) {
    const unresolvedPredictions = this.predictions.filter(p => !p.resolvedAt);
    
    for (const prediction of unresolvedPredictions) {
      const match = this.evaluateMatch(prediction, event);
      
      if (match.isMatch) {
        this.resolvePrediction(prediction.id, match.outcome);
        return {
          prediction: prediction.prediction,
          outcome: match.outcome,
          confidence: prediction.confidence
        };
      }
    }
    
    return null;
  }
  
  /**
   * Evaluate if event matches prediction
   */
  evaluateMatch(prediction, event) {
    const predText = prediction.prediction.toLowerCase();
    const eventText = event.text.toLowerCase();
    
    // Simple keyword matching
    const keywords = predText.split(' ').filter(w => w.length > 4);
    let matches = 0;
    
    for (const keyword of keywords) {
      if (eventText.includes(keyword)) {
        matches++;
      }
    }
    
    const matchRatio = keywords.length > 0 ? matches / keywords.length : 0;
    
    if (matchRatio > 0.5) {
      return { isMatch: true, outcome: 'correct' };
    }
    
    return { isMatch: false };
  }
  
  /**
   * Calculate accuracy
   */
  getAccuracy() {
    const resolved = this.predictions.filter(p => p.resolvedAt && p.outcome !== 'unknown');
    
    if (resolved.length === 0) return 0;
    
    const correct = resolved.filter(p => p.outcome === 'correct').length;
    return Math.round((correct / resolved.length) * 100);
  }
  
  /**
   * Get status for dashboard
   */
  getStatus() {
    const active = this.predictions.filter(p => !p.resolvedAt);
    const resolved = this.predictions.filter(p => p.resolvedAt);
    
    return {
      activePredictions: active.length,
      totalPredictions: this.predictions.length,
      accuracy: this.getAccuracy(),
      recentPredictions: this.predictions.slice(-5).map(p => ({
        prediction: p.prediction,
        type: p.type,
        confidence: p.confidence,
        outcome: p.outcome,
        age: Math.round((Date.now() - p.createdAt) / 1000)
      })),
      byType: this.predictions.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {}),
      outcomeCounts: resolved.reduce((acc, p) => {
        acc[p.outcome] = (acc[p.outcome] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = PredictionEngine;
