/**
 * Question Handler - Better question detection and answering
 * Forces commitment to answers instead of being vague
 */

class QuestionHandler {
  constructor(chatBot) {
    this.chatBot = chatBot;
  }

  /**
   * Detect if message is a question and what type
   */
  analyzeQuestion(text) {
    if (!text.includes('?')) {
      return { isQuestion: false };
    }

    const lowerText = text.toLowerCase();
    
    // Question type classification
    let type = 'general';
    let needsCommitment = false;
    
    // Factual questions (statistics, events, facts)
    if (lowerText.match(/how (many|much|long|far|often)|what (is|are|was|were) (the|a)|when (did|was|is)/)) {
      type = 'factual';
      needsCommitment = true;
    }
    
    // Opinion questions
    if (lowerText.match(/what do you think|your opinion|do you (like|believe|agree)|would you|should (i|we|they)/)) {
      type = 'opinion';
      needsCommitment = true;
    }
    
    // Personal questions
    if (lowerText.match(/have you|did you|can you|will you|are you|slunt (do|did|can|will|are)/)) {
      type = 'personal';
      needsCommitment = true;
    }
    
    // Yes/no questions
    if (lowerText.match(/^(do|does|did|is|are|was|were|can|could|would|should|will)/)) {
      type = 'yesno';
      needsCommitment = true;
    }
    
    // Choice questions (or/either)
    if (lowerText.match(/\bor\b/) && lowerText.includes('?')) {
      type = 'choice';
      needsCommitment = true;
    }

    return {
      isQuestion: true,
      type,
      needsCommitment,
      requiresAnswer: needsCommitment
    };
  }

  /**
   * Get question-answering guidance for AI
   */
  getAnswerGuidance(questionAnalysis) {
    if (!questionAnalysis.isQuestion) {
      return '';
    }

    const guidance = [];
    
    guidance.push('\n[QUESTION DETECTED - You MUST answer it]');
    
    switch (questionAnalysis.type) {
      case 'factual':
        guidance.push('This is a FACTUAL question. Give your best answer or educated guess.');
        guidance.push('If you don\'t know exact facts, say "i think it\'s like [guess]" or "probably around [estimate]"');
        guidance.push('DON\'T say "I don\'t know" - commit to an answer even if uncertain');
        break;
        
      case 'opinion':
        guidance.push('This is an OPINION question. Share YOUR actual opinion.');
        guidance.push('Be decisive - "yeah I think X" not "maybe X or possibly Y"');
        guidance.push('Have a take and defend it');
        break;
        
      case 'personal':
        guidance.push('This is a PERSONAL question about you.');
        guidance.push('Answer directly - what you did, can do, or experienced');
        guidance.push('Be specific and commit to your answer');
        break;
        
      case 'yesno':
        guidance.push('This is a YES/NO question. Pick one and explain briefly.');
        guidance.push('Start with "yeah" or "nah" then give reason');
        guidance.push('Don\'t be wishy-washy');
        break;
        
      case 'choice':
        guidance.push('This is a CHOICE question. Pick one option.');
        guidance.push('Don\'t say "both" or "either" - commit to one');
        guidance.push('Explain why you picked it');
        break;
    }
    
    if (questionAnalysis.needsCommitment) {
      guidance.push('COMMITMENT REQUIRED: No vague/evasive answers. Take a stance.');
    }
    
    return guidance.join('\n');
  }

  /**
   * Check if response actually answered the question
   */
  didAnswerQuestion(question, response, questionAnalysis) {
    if (!questionAnalysis.isQuestion) return true;
    
    const lowerResponse = response.toLowerCase();
    
    // Red flags for non-answers
    const evasivePhrases = [
      'i don\'t know',
      'not sure',
      'maybe',
      'could be either',
      'hard to say',
      'who knows',
      'can\'t really',
      'depends'
    ];
    
    // For questions needing commitment, check for evasion
    if (questionAnalysis.needsCommitment) {
      for (const phrase of evasivePhrases) {
        if (lowerResponse.includes(phrase) && lowerResponse.length < 30) {
          // Too short and evasive = didn't answer
          return false;
        }
      }
    }
    
    // Yes/no questions should have yes/no
    if (questionAnalysis.type === 'yesno') {
      const hasYesNo = /\b(yeah|yep|yes|nah|nope|no)\b/i.test(lowerResponse);
      if (!hasYesNo) return false;
    }
    
    // Response should be at least 5 words
    if (response.split(/\s+/).length < 5) {
      return false;
    }
    
    return true;
  }
}

module.exports = QuestionHandler;
