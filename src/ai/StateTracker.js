/**
 * State Tracker (Unified Mood + Mental State)
 * Simple energy and mood tracking - Grok infers detailed emotional state
 */
class StateTracker {
  constructor(chatBot) {
    this.chatBot = chatBot;
    this.energy = 0.6; // 0-1 scale
    this.mood = 'neutral'; // Simple mood string
    this.lastUpdate = Date.now();
    
    // Simple mood list
    this.moodOptions = ['happy', 'grumpy', 'chill', 'excited', 'bored', 'mischievous', 'neutral'];
  }

  /**
   * Get current mood (for compatibility)
   */
  getMood() {
    return this.mood;
  }

  /**
   * Get state object (for compatibility)
   */
  getState() {
    return {
      energy: this.energy,
      mood: this.mood,
      anxiety: this.energy < 0.3 ? 0.6 : 0.2, // Low energy = higher anxiety
      depression: this.energy < 0.4 ? 0.5 : 0.2,
      confidence: this.energy > 0.6 ? 0.7 : 0.4
    };
  }

  /**
   * Update mood based on sentiment
   */
  updateMood(sentiment) {
    // Simple sentiment-based mood
    if (sentiment > 0.7) {
      this.mood = Math.random() > 0.5 ? 'happy' : 'excited';
      this.energy = Math.min(1, this.energy + 0.05);
    } else if (sentiment < 0.3) {
      this.mood = Math.random() > 0.5 ? 'grumpy' : 'bored';
      this.energy = Math.max(0, this.energy - 0.05);
    } else {
      this.mood = 'chill';
    }
    this.lastUpdate = Date.now();
  }

  /**
   * Update state (for compatibility)
   */
  update(message, sentiment) {
    this.updateMood(sentiment);
    
    // Gradually return to neutral
    const timeSinceUpdate = Date.now() - this.lastUpdate;
    if (timeSinceUpdate > 5 * 60 * 1000) { // 5 minutes
      this.energy = 0.6;
      this.mood = 'neutral';
    }
  }
}

module.exports = StateTracker;
