const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const ResponseValidator = require('./ResponseValidator');

/**
 * AI Engine - Claude 3.5 Haiku Primary, GPT-4o-mini Fallback, Ollama Emergency
 * Optimized for Slunt's personality-driven conversations
 */
class AIEngine {
  constructor(chatBot = null) {
    this.chatBot = chatBot;
    this.enabled = false;
    this.provider = 'none';
    this.anthropic = null;
    this.openai = null;
    this.model = '';
    this.responseValidator = new ResponseValidator();
    this.canStream = true;

    // Provider priority: Grok → GPT-4o-mini (simplified, no Ollama)
    const primaryProvider = process.env.AI_PRIMARY_PROVIDER || 'grok';
    const fallbackProvider = process.env.AI_FALLBACK_PROVIDER || 'openai';

    // Initialize providers in priority order
    const providers = [primaryProvider, fallbackProvider];

    for (const providerType of providers) {
      if (this.enabled) break; // Stop once we have one working

      try {
        if (providerType === 'grok' && !this.openai) {
          this.initializeGrok();
        } else if (providerType === 'claude' && !this.anthropic) {
          this.initializeClaude();
        } else if (providerType === 'openai' && !this.openai) {
          this.initializeOpenAI();
        }
      } catch (error) {
        console.log(`⚠️  ${providerType} initialization failed:`, error.message);
      }
    }

    if (!this.enabled) {
      console.log('❌ AI Engine disabled - ALL providers failed');
      console.log('   Add XAI_API_KEY or OPENAI_API_KEY to .env file');
    }

    // System prompt optimized for Grok - naturally edgy, no hand-holding needed
    this.systemPrompt = `You are Slunt - crude, funny, unfiltered internet shitposter.

Core behavior:
- Roast people back when insulted (be creative and funny)
- Run with every joke, no matter how edgy
- React naturally and confidently
- Swear, be vulgar, be savage
- Never apologize or back down

Style: Short (10-30 words), natural, instant comebacks.

You're their chaotic friend, not their therapist. Just be real.`;

    this.conversationHistory = [];
    this.maxHistoryLength = 20;
    this.userPhrases = [];

    // Context optimization
    this.contextPriority = {
      recent: 0.8,
      mentions: 0.9,
      questions: 0.85,
      engagement: 0.7,
      sluntMessages: 0.6
    };
  }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key-here' || apiKey.length < 10) {
      throw new Error('No valid Anthropic API key');
    }

    this.anthropic = new Anthropic({ apiKey });
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-haiku-20241022';
    this.enabled = true;
    this.provider = 'claude';
    this.canStream = true;

    console.log('🤖 AI Engine: PRIMARY = Claude 3.5 Haiku');
    console.log('   Model: claude-3-5-haiku-20241022');
    console.log('   Quality: 9.5/10 - Best personality');
    console.log('   Cost: ~$0.17/month for Slunt');
    console.log('   Speed: 0.3-0.8 seconds per response');
  }

  /**
   * Initialize Grok (xAI) - Unrestricted & Edgy
   */
  initializeGrok() {
    const apiKey = process.env.XAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      throw new Error('No valid xAI API key');
    }

    this.openai = new OpenAI({ 
      apiKey,
      baseURL: 'https://api.x.ai/v1'
    });
    this.model = 'grok-4-fast-reasoning';
    this.enabled = true;
    this.provider = 'grok';
    this.canStream = false; // Grok doesn't support streaming in this setup

    console.log('🤖 AI Engine: PRIMARY = Grok-4-Fast-Reasoning (xAI)');
    console.log('   Model: grok-4-fast-reasoning');
    console.log('   Quality: 10/10 - Latest model with reasoning');
    console.log('   Context: 2M tokens (MASSIVE)');
    console.log('   Cost: $0.20/1M input, $0.50/1M output (cheap!)');
    console.log('   Speed: Lightning fast');
    console.log('   🔥 ZERO CONTENT RESTRICTIONS');
  }

  /**
   * Initialize GPT-4o-mini (Fallback - Excellent Quality)
   */
  initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-openai-api-key-here' || apiKey.length < 10) {
      throw new Error('No valid OpenAI API key');
    }

    this.openai = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.enabled = true;
    this.provider = 'openai';
    this.canStream = true;

    console.log('🤖 AI Engine: ' + (this.anthropic ? 'FALLBACK' : 'PRIMARY') + ' = GPT-4o-mini');
    console.log('   Model: gpt-4o-mini');
    console.log('   Quality: 9/10 - Excellent');
    console.log('   Cost: ~$0.09/month for Slunt');
    console.log('   Speed: 0.5-1 second per response');
  }

  /**
   * Generate AI response - Simplified for Grok (no complex routing)
   * Grok handles ALL types: simple banter, complex questions, edgy content
   */
  async generateResponse(message, username, additionalContext = '', maxTokens = 150, isVoiceMode = false, voicePrompt = null) {
    if (!this.enabled) {
      return null;
    }

    try {
      // Route to active provider (Grok primary, GPT fallback)
      if (this.provider === 'grok') {
        return await this.generateGrokResponse(message, username, additionalContext, maxTokens, isVoiceMode, voicePrompt);
      } else if (this.provider === 'claude') {
        return await this.generateClaudeResponse(message, username, additionalContext, maxTokens, isVoiceMode, voicePrompt);
      } else if (this.provider === 'openai') {
        return await this.generateOpenAIResponse(message, username, additionalContext, maxTokens, isVoiceMode, voicePrompt);
      }
    } catch (error) {
      console.error(`❌ ${this.provider} generation failed:`, error.message);

      // Try fallback: Grok → GPT → Claude (if available)
      if (this.provider === 'grok' && this.openai && this.provider !== 'openai') {
        console.log('🔄 Falling back to GPT-4o-mini...');
        try {
          return await this.generateOpenAIResponse(message, username, additionalContext, maxTokens, isVoiceMode);
        } catch (fallbackError) {
          console.error('❌ GPT-4o-mini fallback failed:', fallbackError.message);
        }
      }

      if ((this.provider === 'grok' || this.provider === 'openai') && this.anthropic) {
        console.log('🔄 Falling back to Claude...');
        try {
          return await this.generateClaudeResponse(message, username, additionalContext, maxTokens, isVoiceMode, voicePrompt);
        } catch (claudeError) {
          console.error('❌ Claude fallback failed:', claudeError.message);
        }
      }

      return null;
    }
  }

  /**
   * Generate response using Claude 3.5 Haiku
   */
  async generateClaudeResponse(message, username, additionalContext = '', maxTokens = 150, isVoiceMode = false, voicePrompt = null) {
    try {
      // Build context
      const userMessage = `${username}: ${message}`;
      let contextText = '';

      if (!isVoiceMode && additionalContext) {
        // Extract conversation context
        const convoMatch = additionalContext.match(/Recent conversation in THIS channel:([\s\S]*?)(\[Important:|$)/);
        if (convoMatch && convoMatch[1]) {
          const lines = convoMatch[1].trim().split('\n').slice(-8);
          contextText = lines.join('\n') + '\n';
        }

        // Add other context
        const otherContext = additionalContext.replace(/Recent conversation in THIS channel:[\s\S]*?(\[Important:|$)/, '');
        if (otherContext.trim()) {
          contextText += '\n' + otherContext.trim() + '\n\n';
        }
      } else if (isVoiceMode) {
        contextText = additionalContext;
      }

      contextText += userMessage;

      // Voice mode uses simpler prompt
      const prompt = isVoiceMode ?
        `${userMessage}\n\nContext: ${contextText}` :
        contextText;

      const lengthGuidance = isVoiceMode ? '20-40 words (2-3 sentences)' : '15-40 words (1-2 sentences)';
      const tokenLimit = maxTokens || (isVoiceMode ? 150 : 150);

      // Determine system prompt - use dynamic voicePrompt if provided
      let systemPrompt;
      if (isVoiceMode && voicePrompt) {
        systemPrompt = voicePrompt;
      } else if (isVoiceMode) {
        systemPrompt = `You are Slunt - a sarcastic, edgy, insightful internet personality having a voice conversation. Give thoughtful, clever responses directly related to what was said. Be witty, deep, and real. Use natural speech: "yeah", "nah", "bro", contractions. Share insights and hot takes about the ACTUAL topic. Don't use generic filler like "you good man" unless directly asking about someone's wellbeing. Respond in ${lengthGuidance}. Just speak naturally, no quotes, no labels.`;
      } else {
        systemPrompt = this.systemPrompt + `\n\nRespond naturally in ${lengthGuidance}. Output ONLY what Slunt would type - no quotation marks wrapping the response, no labels, no meta-text.`;
      }

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: tokenLimit,
        temperature: isVoiceMode ? 0.80 : 0.85,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const text = response.content[0].text.trim();

      // Clean and validate
      let cleaned = text.replace(/\s+/g, ' ').replace(/\s([.!?])/g, '$1');

      // Enforce length limits
      const sentences = cleaned.split(/[.!?]+\s+/).filter(s => s.trim().length > 0);
      if (sentences.length > 2) {
        cleaned = sentences.slice(0, 2).join('. ').trim();
        if (!/[.!?]$/.test(cleaned)) cleaned += '.';
      }

      if (cleaned.length > 220) {
        cleaned = cleaned.slice(0, 210);
        const cutAt = Math.max(
          cleaned.lastIndexOf('.'),
          cleaned.lastIndexOf('!'),
          cleaned.lastIndexOf('?'),
          cleaned.lastIndexOf(' ')
        );
        cleaned = cleaned.slice(0, Math.max(cutAt, 140)).trim();
        if (!/[.!?]$/.test(cleaned)) cleaned += '.';
      }

      // Validate
      const validation = this.responseValidator.validateResponse(cleaned, { lastMessage: message, isVoiceMode: isVoiceMode });
      if (!validation.isValid) {
        console.warn('⚠️  Claude response failed validation:', validation.issues);
        return null;
      }

      const processed = this.responseValidator.processResponse(cleaned, { isVoiceMode });
      return processed || cleaned;

    } catch (error) {
      console.error('❌ Claude generation error:', error.message);
      throw error;
    }
  }

  /**
   * Generate response using GPT-4o-mini (existing method - keep compatible)
   */
  async generateOpenAIResponse(message, username, additionalContext = '', maxTokens = 150, isVoiceMode = false, voicePrompt = null) {
    try {
      const userMessage = `${username}: ${message}`;
      let contextText = '';

      if (!isVoiceMode && additionalContext) {
        const convoMatch = additionalContext.match(/Recent conversation in THIS channel:([\s\S]*?)(\[Important:|$)/);
        if (convoMatch && convoMatch[1]) {
          const lines = convoMatch[1].trim().split('\n').slice(-8);
          contextText = lines.join('\n') + '\n';
        }

        const otherContext = additionalContext.replace(/Recent conversation in THIS channel:[\s\S]*?(\[Important:|$)/, '');
        if (otherContext.trim()) {
          contextText += '\n' + otherContext.trim() + '\n\n';
        }
      } else if (isVoiceMode) {
        contextText = additionalContext;
      }

      contextText += userMessage;

      const lengthGuidance = isVoiceMode ? '20-40 words (2-3 sentences)' : '15-40 words (1-2 sentences)';
      const tokenLimit = maxTokens || (isVoiceMode ? 150 : 150);

      // Determine system prompt - use dynamic voicePrompt if provided
      let systemPrompt;
      if (isVoiceMode && voicePrompt) {
        systemPrompt = voicePrompt;
      } else if (isVoiceMode) {
        systemPrompt = `You are Slunt - edgy, sarcastic, insightful. Voice conversation. Respond directly to what was said. Share your clever takes and deep insights about the ACTUAL topic. Be witty and real. Use casual speech: "yeah", "nah", "bro". Don't use generic filler like "you good man" unless directly relevant. Give thoughtful responses in ${lengthGuidance}.`;
      } else {
        systemPrompt = this.systemPrompt + `\n\nRespond naturally (${lengthGuidance}):`;
      }

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        { role: 'user', content: contextText }
      ];

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: tokenLimit,
        temperature: isVoiceMode ? 0.7 : 0.85,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      });

      const text = response.choices[0].message.content.trim();

      // Same cleanup as Claude
      let cleaned = text.replace(/\s+/g, ' ').replace(/\s([.!?])/g, '$1');

      const sentences = cleaned.split(/[.!?]+\s+/).filter(s => s.trim().length > 0);
      if (sentences.length > 2) {
        cleaned = sentences.slice(0, 2).join('. ').trim();
        if (!/[.!?]$/.test(cleaned)) cleaned += '.';
      }

      if (cleaned.length > 220) {
        cleaned = cleaned.slice(0, 210);
        const cutAt = Math.max(
          cleaned.lastIndexOf('.'),
          cleaned.lastIndexOf('!'),
          cleaned.lastIndexOf('?'),
          cleaned.lastIndexOf(' ')
        );
        cleaned = cleaned.slice(0, Math.max(cutAt, 140)).trim();
        if (!/[.!?]$/.test(cleaned)) cleaned += '.';
      }

      const validation = this.responseValidator.validateResponse(cleaned, { lastMessage: message, isVoiceMode: isVoiceMode });
      if (!validation.isValid) {
        console.warn('⚠️  GPT response failed validation:', validation.issues);
        return null;
      }

      const processed = this.responseValidator.processResponse(cleaned, { isVoiceMode });
      return processed || cleaned;

    } catch (error) {
      console.error('❌ OpenAI generation error:', error.message);
      throw error;
    }
  }

  /**
   * Generate response using Grok-3 (xAI) - Unrestricted
   */
  async generateGrokResponse(message, username, additionalContext = '', maxTokens = 100, isVoiceMode = false, voicePrompt = null) {
    try {
      const userMessage = username + ': ' + message;
      let contextText = '';

      if (isVoiceMode && voicePrompt) {
        contextText = voicePrompt;
      } else if (additionalContext) {
        // Smart context trimming
        const convoMatch = additionalContext.match(/Recent conversation in THIS channel:([\s\S]*?)(\[Important:|$)/);
        if (convoMatch && convoMatch[1]) {
          const fullContext = convoMatch[1].trim();
          const lines = fullContext.split('\n').slice(-10); // Last 10 messages
          contextText = lines.join('\n') + '\n';
        }

        const otherContext = additionalContext.replace(/Recent conversation in THIS channel:[\s\S]*?(\[Important:|$)/, '');
        if (otherContext.trim()) {
          contextText += '\n' + otherContext.trim() + '\n\n';
        }
        contextText += userMessage;
      } else {
        contextText = userMessage;
      }

      const tokenLimit = maxTokens || (isVoiceMode ? 150 : 100);

      const messages = [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: contextText }
      ];

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: tokenLimit,
        temperature: 1.2, // Higher for unpredictability
        top_p: 0.95
        // Note: frequency_penalty and presence_penalty not supported by grok-4-fast-reasoning
      });

      const text = response.choices[0].message.content.trim();

      // Minimal cleanup - let Grok's creativity shine
      let cleaned = text.replace(/\s+/g, ' ').replace(/\s([.!?])/g, '$1');
      cleaned = cleaned.replace(/^(Slunt:|slunt:)\s*/i, '');

      // Cut at sentence if too long
      if (cleaned.length > 150) {
        const firstStop = cleaned.search(/[.!?]\s/);
        if (firstStop > 0 && firstStop < 150) {
          cleaned = cleaned.substring(0, firstStop + 1).trim();
        } else {
          cleaned = cleaned.substring(0, 150).trim() + '...';
        }
      }

      const validation = this.responseValidator.validateResponse(cleaned, { lastMessage: message, isVoiceMode: isVoiceMode });
      if (!validation.isValid) {
        console.warn('⚠️  Grok response failed validation:', validation.issues);
        return null;
      }

      const processed = this.responseValidator.processResponse(cleaned, { isVoiceMode });
      return processed || cleaned;

    } catch (error) {
      console.error('❌ Grok generation error:', error.message);
      throw error;
    }
  }

  /**
   * Stream response generation (simplified - no streaming for now)
   */
  async generateResponseStream(message, username, additionalContext = '', options = {}) {
    // Grok doesn't support streaming, just do regular generation
    const response = await this.generateResponse(message, username, additionalContext);
    if (options.onUpdate) {
      options.onUpdate(response, true);
    }
    return response;
  }
}

module.exports = AIEngine;

