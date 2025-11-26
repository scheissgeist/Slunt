const EventEmitter = require('events');

/**
 * Helper to get timestamp for logs
 */
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * CursorController - Allows Slunt to interact with the Coolhole UI
 * Can click buttons, explore emotes, and navigate the page
 */
class CursorController extends EventEmitter {
  constructor(page) {
    super();
    this.page = page;
    this.isActive = false;
    this.explorationInterval = null;
    this.lastInteractionTime = 0;
    this.discoveredButtons = [];
    this.usedEmotes = new Set();
    this.interactionHistory = [];
    
    // Personality-driven interaction settings
    this.curiosity = 0.7; // How often to explore
    this.playfulness = 0.8; // Likelihood to use emotes
    this.cautious = 0.3; // Chance to avoid risky buttons
  }

  /**
   * Start cursor exploration and interaction
   */
  async startExploration(options = {}) {
    if (this.isActive) {
      console.log(`[${getTimestamp()}] 🖱️ [Cursor] Already exploring`);
      return;
    }

    const {
      explorationFrequency = 45000, // Every 45 seconds
      emoteFrequency = 30000, // Try emotes every 30 seconds
      enabled = true
    } = options;

    this.isActive = enabled;
    
    if (!enabled) {
      console.log(`[${getTimestamp()}] 🖱️ [Cursor] Interaction disabled`);
      return;
    }

    console.log(`[${getTimestamp()}] 🖱️ [Cursor] Starting interactive exploration...`);

    // Initial discovery
    await this.discoverInteractiveElements();

    // DISABLED: Periodic exploration interferes with chat input focus
    // Keeping emote usage only as it's less disruptive
    /*
    this.explorationInterval = setInterval(async () => {
      try {
        if (Math.random() < this.curiosity) {
          await this.exploreRandomElement();
        }
      } catch (error) {
        console.error(`[${getTimestamp()}] ❌ [Cursor] Exploration error:`, error.message);
      }
    }, explorationFrequency);
    */

    // Emote usage loop (separate from general exploration)
    this.emoteInterval = setInterval(async () => {
      try {
        if (Math.random() < this.playfulness) {
          await this.useRandomEmote();
        }
      } catch (error) {
        console.error(`[${getTimestamp()}] ❌ [Cursor] Emote error:`, error.message);
      }
    }, emoteFrequency);

    console.log(`[${getTimestamp()}] ✅ [Cursor] Interactive exploration started!`);
  }

  /**
   * Discover all interactive elements on the page
   */
  async discoverInteractiveElements() {
    try {
      console.log(`[${getTimestamp()}] 🔍 [Cursor] Discovering interactive elements...`);

      const elements = await this.page.evaluate(() => {
        const discovered = [];

        // Find emote buttons
        const emoteButtons = document.querySelectorAll('[class*="emote"], [data-emote], button[title]');
        emoteButtons.forEach((btn, idx) => {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            discovered.push({
              type: 'emote',
              id: `emote-${idx}`,
              name: btn.title || btn.getAttribute('data-emote') || btn.textContent?.trim() || 'unknown',
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
              selector: btn.className || 'button'
            });
          }
        });

        // Find other interactive buttons
        const buttons = document.querySelectorAll('button:not([class*="emote"]), [role="button"]');
        buttons.forEach((btn, idx) => {
          const rect = btn.getBoundingClientRect();
          const text = btn.textContent?.trim() || btn.getAttribute('aria-label') || '';
          
          // Skip obvious dangerous buttons
          if (text.toLowerCase().includes('delete') || 
              text.toLowerCase().includes('ban') ||
              text.toLowerCase().includes('kick')) {
            return;
          }

          if (rect.width > 0 && rect.height > 0) {
            discovered.push({
              type: 'button',
              id: `button-${idx}`,
              name: text,
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
              selector: btn.className || 'button'
            });
          }
        });

        // Find clickable icons
        const icons = document.querySelectorAll('[class*="icon"], svg[role="img"], .clickable');
        icons.forEach((icon, idx) => {
          const rect = icon.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            discovered.push({
              type: 'icon',
              id: `icon-${idx}`,
              name: icon.getAttribute('aria-label') || icon.className || 'icon',
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
              selector: icon.className || 'icon'
            });
          }
        });

        return discovered;
      });

      this.discoveredButtons = elements;
      console.log(`[${getTimestamp()}] ✅ [Cursor] Found ${elements.length} interactive elements`);
      console.log(`[${getTimestamp()}]    - Emotes: ${elements.filter(e => e.type === 'emote').length}`);
      console.log(`[${getTimestamp()}]    - Buttons: ${elements.filter(e => e.type === 'button').length}`);
      console.log(`[${getTimestamp()}]    - Icons: ${elements.filter(e => e.type === 'icon').length}`);

      this.emit('discovery', {
        total: elements.length,
        emotes: elements.filter(e => e.type === 'emote').length,
        buttons: elements.filter(e => e.type === 'button').length,
        icons: elements.filter(e => e.type === 'icon').length
      });

      return elements;
    } catch (error) {
      console.error(`[${getTimestamp()}] ❌ [Cursor] Discovery error:`, error.message);
      return [];
    }
  }

  /**
   * Use a random emote by clicking its button
   */
  async useRandomEmote() {
    try {
      const emotes = this.discoveredButtons.filter(e => e.type === 'emote');
      
      if (emotes.length === 0) {
        console.log(`[${getTimestamp()}] 🖱️ [Cursor] No emotes discovered yet, rediscovering...`);
        await this.discoverInteractiveElements();
        return;
      }

      // Pick a random emote
      const emote = emotes[Math.floor(Math.random() * emotes.length)];
      
      console.log(`[${getTimestamp()}] 😊 [Cursor] Clicking emote: ${emote.name}`);

      // Click the emote button
      await this.clickElement(emote);

      this.usedEmotes.add(emote.name);
      this.emit('emote:used', { emote: emote.name, timestamp: Date.now() });

      console.log(`[${getTimestamp()}] ✅ [Cursor] Emote clicked! (${this.usedEmotes.size} unique emotes used)`);
    } catch (error) {
      console.error(`[${getTimestamp()}] ❌ [Cursor] Emote click error:`, error.message);
    }
  }

  /**
   * Explore a random interactive element
   */
  async exploreRandomElement() {
    try {
      if (this.discoveredButtons.length === 0) {
        await this.discoverInteractiveElements();
        return;
      }

      // Prefer emotes and safe buttons
      const safeElements = this.discoveredButtons.filter(e => {
        if (e.type === 'emote') return true;
        if (e.type === 'icon') return Math.random() < 0.5; // Sometimes click icons
        
        // Cautious about unknown buttons
        if (e.type === 'button') {
          return Math.random() > this.cautious;
        }
        
        return false;
      });

      if (safeElements.length === 0) {
        console.log(`[${getTimestamp()}] 🖱️ [Cursor] No safe elements to explore`);
        return;
      }

      const element = safeElements[Math.floor(Math.random() * safeElements.length)];
      
      console.log(`[${getTimestamp()}] 🖱️ [Cursor] Exploring ${element.type}: ${element.name}`);
      
      await this.clickElement(element);

      this.interactionHistory.push({
        element: element.name,
        type: element.type,
        timestamp: Date.now()
      });

      // Keep history limited
      if (this.interactionHistory.length > 50) {
        this.interactionHistory.shift();
      }

      this.emit('interaction', {
        type: element.type,
        name: element.name,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error(`[${getTimestamp()}] ❌ [Cursor] Exploration error:`, error.message);
    }
  }

  /**
   * Click an element at specific coordinates
   */
  async clickElement(element) {
    try {
      const { x, y, name } = element;
      
      // Move mouse to element (optional - makes it more realistic)
      await this.page.mouse.move(x, y, { steps: 10 });
      
      // Small random offset for natural clicking
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetY = (Math.random() - 0.5) * 10;
      
      // Click
      await this.page.mouse.click(x + offsetX, y + offsetY);
      
      // Wait a bit to see the result
      await this.page.waitForTimeout(500);
      
      this.lastInteractionTime = Date.now();
      
      console.log(`[${getTimestamp()}] 🖱️ [Cursor] Clicked: ${name} at (${Math.round(x)}, ${Math.round(y)})`);
      
      return true;
    } catch (error) {
      console.error(`[${getTimestamp()}] ❌ [Cursor] Click error:`, error.message);
      return false;
    }
  }

  /**
   * Click a specific button by name/selector
   */
  async clickByName(name) {
    try {
      const element = this.discoveredButtons.find(e => 
        e.name.toLowerCase().includes(name.toLowerCase())
      );

      if (!element) {
        console.log(`[${getTimestamp()}] 🖱️ [Cursor] Element not found: ${name}`);
        return false;
      }

      return await this.clickElement(element);
    } catch (error) {
      console.error(`[${getTimestamp()}] ❌ [Cursor] Click by name error:`, error.message);
      return false;
    }
  }

  /**
   * Get interaction statistics
   */
  getStats() {
    return {
      totalInteractions: this.interactionHistory.length,
      uniqueEmotesUsed: this.usedEmotes.size,
      discoveredElements: this.discoveredButtons.length,
      lastInteraction: this.lastInteractionTime,
      recentInteractions: this.interactionHistory.slice(-10)
    };
  }

  /**
   * Stop exploration
   */
  stop() {
    console.log(`[${getTimestamp()}] 🛑 [Cursor] Stopping exploration`);
    
    if (this.explorationInterval) {
      clearInterval(this.explorationInterval);
      this.explorationInterval = null;
    }
    
    if (this.emoteInterval) {
      clearInterval(this.emoteInterval);
      this.emoteInterval = null;
    }
    
    this.isActive = false;
  }

  /**
   * Update personality traits
   */
  updatePersonality(traits) {
    if (traits.curiosity !== undefined) this.curiosity = traits.curiosity;
    if (traits.playfulness !== undefined) this.playfulness = traits.playfulness;
    if (traits.cautious !== undefined) this.cautious = traits.cautious;
    
    console.log(`[${getTimestamp()}] 🧠 [Cursor] Personality updated:`, {
      curiosity: this.curiosity,
      playfulness: this.playfulness,
      cautious: this.cautious
    });
  }
}

module.exports = CursorController;
