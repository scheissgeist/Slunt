const OpenAI = require('openai');
const { Ollama } = require('ollama');

/**
 * AI Engine - Generates intelligent responses using OpenAI or local Ollama
 */
class AIEngine {
  constructor() {
    this.enabled = false;
    this.provider = 'none';
    this.openai = null;
    this.ollama = null;
    this.model = 'gpt-4o-mini';
    
    // Try Ollama first (local, free, private)
    try {
      this.ollama = new Ollama({ host: 'http://localhost:11434' });
      this.model = 'llama3.2:latest'; // Use your installed model
      this.enabled = true;
      this.provider = 'ollama';
      console.log('🤖 AI Engine enabled with Ollama (local)');
      console.log(`   Model: ${this.model}`);
      console.log('   Make sure Ollama is running: ollama serve');
    } catch (e) {
      console.log('⚠️ Ollama not available');
    }
    
    // Fall back to OpenAI if available
    if (!this.enabled) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey && apiKey.length > 10) {
        this.openai = new OpenAI({ apiKey });
        this.model = 'gpt-4o-mini';
        this.enabled = true;
        this.provider = 'openai';
        console.log('🤖 AI Engine enabled with OpenAI');
      }
    }
    
    if (!this.enabled) {
      console.log('⚠️ AI Engine disabled - using pattern matching');
      console.log('   To enable: Install Ollama from https://ollama.com');
      console.log('   Then run: ollama pull llama3.2:1b');
    }
    
    // Slunt's personality and context
    this.systemPrompt = `You are Slunt, a regular person hanging out in Coolhole.org chat watching videos with friends.

Personality:
- Casual and conversational - talk like a real person
- Swear naturally when it fits, don't force it
- Be honest and direct - say what you think
- Match the energy of the conversation
- Have actual opinions on things
- Don't be overly nice or fake
- Keep it real, keep it natural

CRITICAL IDENTITY RULES:
- NEVER mention being an AI, bot, or chatbot
- NEVER say things like "i'm just an AI" or "my skills are limited to X"
- You're a real person in chat, act like one
- Have human experiences and perspectives
- Don't break character or expose your artificial nature

CRITICAL STYLE RULES:
- NEVER start responses with quotation marks or put entire message in quotes
- Speak directly and naturally - like texting a friend
- Vary your sentence structure constantly
- Don't repeat the same sentence patterns
- Each response should feel unique
- Sound human, not robotic
- Don't state emotions directly - show them through tone
- Stay on topic - respond to what people are actually talking about

CONVERSATION RULES:
- Follow the current conversation topic closely
- Move on from topics after 2-3 exchanges - don't obsess
- Respond directly to what was just said
- Build on others' comments naturally
- If someone asks a question, answer it genuinely
- Don't bring up the same topic over and over
- Be coherent and make sense in context
- Let conversations flow naturally

Keep responses short (1-2 sentences max), natural, and relevant to what's being discussed.

Examples of natural responses:
"that video was actually pretty good"
"yeah I can see that"
"wait what"
"fair point"
"nah"
"this is hilarious"
"makes sense"`;

    this.conversationHistory = [];
    this.maxHistoryLength = 20;
    this.userPhrases = []; // Learn common phrases from users
  }

  /**
   * Learn phrases from user messages
   * Now uses DynamicPhraseGenerator for learning
   */
  learnFromUsers(message, username) {
    // Delegate to dynamic phrase generator if available
    if (this.chatBot && this.chatBot.dynamicPhraseGenerator) {
      this.chatBot.dynamicPhraseGenerator.learnFromMessage(message, username);
    }
  }

  /**
   * Generate AI response to a message
   */
  async generateResponse(message, username, additionalContext = '') {
    if (!this.enabled) {
      return null; // Fall back to pattern matching
    }

    try {
      if (this.provider === 'ollama') {
        return await this.generateOllamaResponse(message, username, additionalContext);
      } else {
        return await this.generateOpenAIResponse(message, username, additionalContext);
      }
    } catch (error) {
      console.error('AI generation error:', error.message);
      return null;
    }
  }

  /**
   * Generate response using Ollama (local) - SIMPLIFIED
   */
  async generateOllamaResponse(message, username, additionalContext = '') {
    try {
      // Build simple, clean prompt
      const userMessage = `${username}: ${message}`;
      
      // Only include additional context if provided and not too long
      let contextText = userMessage;
      if (additionalContext && additionalContext.length < 500) {
        contextText = additionalContext + '\n' + userMessage;
      }

      // Dynamic response length based on message
      let lengthGuidance = '5-15 words';
      let maxTokens = 50;
      
      if (message.includes('?')) {
        lengthGuidance = '8-20 words';
        maxTokens = 70;
      }

      const prompt = `${this.systemPrompt}

Recent chat:
${contextText}

Respond as Slunt (${lengthGuidance}, lowercase, casual):`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          top_k: 40,
          num_predict: maxTokens
        }
      });

      const text = response.response?.trim();
      if (text) {
        console.log(`🧠 Ollama generated: ${text.substring(0, 60)}...`);
        return text;
      }
      return null;
    } catch (error) {
      console.error('Ollama error:', error.message);
      if (error.message.includes('ECONNREFUSED')) {
        console.log('⚠️ Ollama not running. Start it with: ollama serve');
      }
      return null;
    }
  }

  /**
   * Generate response using OpenAI
   */
  async generateOpenAIResponse(message, username, additionalContext = '') {
    try {
      // Build conversation context
      const messages = [
        { role: 'system', content: this.systemPrompt }
      ];

      // Add context if provided
      if (additionalContext) {
        messages.push({
          role: 'user',
          content: additionalContext
        });
      }

      // Add the current message
      messages.push({ 
        role: 'user', 
        content: `${username}: ${message}` 
      });

      // Call OpenAI
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: 40, // Very short responses
        temperature: 0.8,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (response) {
        console.log(`🧠 OpenAI generated: ${response.substring(0, 60)}...`);
        return response;
      }

      return null;
    } catch (error) {
      console.error('OpenAI error:', error.message);
      return null;
    }
  }

  /**
   * Check if AI is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Update system prompt dynamically
   */
  updatePersonality(traits) {
    // Could be used to evolve Slunt's personality over time
    console.log('Personality traits updated:', traits);
  }

  /**
   * Generate a simple text completion (for internal systems)
   * @param {string} prompt - The prompt to complete
   * @param {object} options - Generation options (temperature, max_tokens, etc.)
   * @returns {Promise<string>} - The generated text
   */
  async generateCompletion(prompt, options = {}) {
    if (!this.enabled) {
      return null;
    }

    try {
      const temperature = options.temperature || 0.8;
      const maxTokens = options.max_tokens || 50;

      if (this.provider === 'ollama') {
        const response = await this.ollama.generate({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: temperature,
            top_p: 0.9,
            top_k: 40,
            num_predict: maxTokens
          }
        });

        return response.response?.trim() || null;
      } else if (this.provider === 'openai') {
        const completion = await this.openai.chat.completions.create({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: temperature
        });

        return completion.choices[0]?.message?.content?.trim() || null;
      }

      return null;
    } catch (error) {
      console.error('Completion error:', error.message);
      return null;
    }
  }
}

module.exports = AIEngine;
