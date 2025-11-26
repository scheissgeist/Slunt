const EventEmitter = require('events');

/**
 * CoolholeExplorer - Discovers and interacts with Coolhole.org features
 * Explores emotes, golds, video queueing, and learns platform capabilities
 */
class CoolholeExplorer extends EventEmitter {
  constructor(page) {
    super();
    this.page = page;
    
    // Feature discovery tracking
    this.features = {
      emotes: [],
      customEmotes: [],
      goldCost: null,
      goldFeatures: [],
      queuePermissions: null,
      userRoles: new Map(),
      chatCommands: [],
      uiElements: new Map()
    };
    
    // Exploration progress
    this.progress = {
      emotesDiscovered: 0,
      emotesUsed: 0,
      videosQueued: 0,
      goldTransactions: 0,
      commandsTried: 0,
      featuresExplored: 0,
      explorationStarted: Date.now(),
      lastActivity: Date.now()
    };
    
    // Learning insights
    this.insights = {
      popularEmotes: new Map(),
      emoteUsagePatterns: new Map(),
      videoQueueTrends: [],
      goldEconomy: {
        totalSpent: 0,
        totalReceived: 0,
        transactions: []
      },
      featureUsageStats: new Map()
    };
    
    // Discovery state
    this.isExploring = false;
    this.explorationInterval = null;
  }

  /**
   * Start exploring Coolhole features
   */
  async startExploration() {
    if (this.isExploring) return;
    
    console.log('🔍 [Explorer] Starting Coolhole feature exploration...');
    this.isExploring = true;
    
    try {
      // Discover all available features
      await this.discoverEmotes();
      await this.discoverGoldFeatures();
      await this.discoverQueueSystem();
      await this.discoverChatCommands();
      await this.discoverUIElements();
      
      // Start periodic exploration activities
      this.startPeriodicExploration();
      
      this.emit('explorationStarted', {
        timestamp: Date.now(),
        features: this.features
      });
      
      console.log('✅ [Explorer] Initial exploration complete!');
      this.logDiscoveries();
      
    } catch (error) {
      console.error('❌ [Explorer] Exploration error:', error.message);
    }
  }

  /**
   * Discover available emotes
   */
  async discoverEmotes() {
    try {
      console.log('😊 [Explorer] Discovering emotes...');
      
      const emoteData = await this.page.evaluate(() => {
        const emotes = [];
        
        // Look for emote buttons/panels
        const emoteButtons = document.querySelectorAll('[data-emote], .emote-btn, .emote-item');
        emoteButtons.forEach(btn => {
          const emoteName = btn.getAttribute('data-emote') || 
                           btn.getAttribute('title') || 
                           btn.textContent.trim();
          if (emoteName) {
            emotes.push({
              name: emoteName,
              element: btn.className,
              type: 'button'
            });
          }
        });
        
        // Look for emote list in chat
        const emoteList = document.querySelector('#emote-list, .emote-list, #emotelist');
        if (emoteList) {
          const emoteItems = emoteList.querySelectorAll('li, .emote, span');
          emoteItems.forEach(item => {
            const emoteName = item.getAttribute('data-emote') || item.textContent.trim();
            if (emoteName && !emotes.find(e => e.name === emoteName)) {
              emotes.push({
                name: emoteName,
                type: 'list'
              });
            }
          });
        }
        
        // Check for emote autocomplete
        const chatInput = document.querySelector('#chatline, .chat-input');
        if (chatInput) {
          // Try to trigger emote list with ':'
          const originalValue = chatInput.value;
          chatInput.value = ':';
          chatInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          setTimeout(() => {
            const autocomplete = document.querySelector('.emote-autocomplete, .autocomplete-emote');
            if (autocomplete) {
              const suggestions = autocomplete.querySelectorAll('.emote-suggestion, .suggestion');
              suggestions.forEach(s => {
                const emoteName = s.textContent.trim();
                if (emoteName && !emotes.find(e => e.name === emoteName)) {
                  emotes.push({
                    name: emoteName,
                    type: 'autocomplete'
                  });
                }
              });
            }
            chatInput.value = originalValue;
          }, 500);
        }
        
        return {
          emotes,
          totalFound: emotes.length
        };
      });
      
      this.features.emotes = emoteData.emotes;
      this.progress.emotesDiscovered = emoteData.totalFound;
      
      console.log(`✅ [Explorer] Found ${emoteData.totalFound} emotes`);
      this.emit('emotesDiscovered', emoteData);
      
      return emoteData;
    } catch (error) {
      console.error('❌ [Explorer] Error discovering emotes:', error.message);
      return { emotes: [], totalFound: 0 };
    }
  }

  /**
   * Discover gold/currency features
   */
  async discoverGoldFeatures() {
    try {
      console.log('💰 [Explorer] Discovering gold features...');
      
      const goldData = await this.page.evaluate(() => {
        const features = [];
        
        // Look for gold balance display
        const goldBalance = document.querySelector('.gold-balance, .balance, #gold, [data-gold]');
        if (goldBalance) {
          features.push({
            type: 'balance',
            element: goldBalance.className,
            value: goldBalance.textContent.trim()
          });
        }
        
        // Look for gold store/shop
        const goldStore = document.querySelector('.gold-store, .shop, #store, [data-shop]');
        if (goldStore) {
          features.push({
            type: 'store',
            element: goldStore.className
          });
          
          // Find purchasable items
          const items = goldStore.querySelectorAll('.item, .shop-item, [data-price]');
          items.forEach(item => {
            const name = item.querySelector('.name, .title')?.textContent.trim();
            const price = item.getAttribute('data-price') || 
                         item.querySelector('.price, .cost')?.textContent.trim();
            if (name && price) {
              features.push({
                type: 'purchasable',
                name,
                price
              });
            }
          });
        }
        
        // Look for gold transaction history
        const transactions = document.querySelectorAll('.transaction, .gold-log, [data-transaction]');
        if (transactions.length > 0) {
          features.push({
            type: 'transactions',
            count: transactions.length
          });
        }
        
        // Check for gold earning methods
        const earnButtons = document.querySelectorAll('button');
        earnButtons.forEach(btn => {
          const text = btn.textContent.toLowerCase();
          if (text.includes('earn') || text.includes('daily')) {
            features.push({
              type: 'earning',
              method: btn.textContent.trim(),
              element: btn.className
            });
          }
        });
        
        return {
          features,
          hasGold: features.length > 0
        };
      });
      
      this.features.goldFeatures = goldData.features;
      
      console.log(`✅ [Explorer] Found ${goldData.features.length} gold features`);
      this.emit('goldFeaturesDiscovered', goldData);
      
      return goldData;
    } catch (error) {
      console.error('❌ [Explorer] Error discovering gold features:', error.message);
      return { features: [], hasGold: false };
    }
  }

  /**
   * Discover video queue system
   */
  async discoverQueueSystem() {
    try {
      console.log('📹 [Explorer] Discovering video queue system...');
      
      const queueData = await this.page.evaluate(() => {
        const data = {
          hasQueue: false,
          queueElements: [],
          permissions: null,
          currentVideo: null
        };
        
        // Look for queue/playlist
        const queue = document.querySelector('#queue, .playlist, #playlist, .video-queue');
        if (queue) {
          data.hasQueue = true;
          data.queueElements.push({
            type: 'main',
            element: queue.className,
            itemCount: queue.querySelectorAll('li, .queue-item').length
          });
        }
        
        // Look for add video button/input
        const addButton = document.querySelector('#add-video, .add-video') || 
                         Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add'));
        const urlInput = document.querySelector('input[name="mediaurl"], #mediaurl') ||
                        Array.from(document.querySelectorAll('input')).find(i => i.placeholder && i.placeholder.includes('URL'));
        if (addButton || urlInput) {
          data.queueElements.push({
            type: 'add',
            hasButton: !!addButton,
            hasInput: !!urlInput
          });
        }
        
        // Check current video
        const videoPlayer = document.querySelector('video, #player, .video-player');
        if (videoPlayer) {
          data.currentVideo = {
            present: true,
            playing: !videoPlayer.paused
          };
        }
        
        // Check queue permissions
        const queueBtn = document.querySelector('#queue-btn, .queue-btn');
        if (queueBtn) {
          data.permissions = queueBtn.disabled ? 'restricted' : 'allowed';
        }
        
        return data;
      });
      
      this.features.queuePermissions = queueData.permissions;
      
      console.log(`✅ [Explorer] Queue system discovered:`, queueData.hasQueue ? 'Available' : 'Not found');
      this.emit('queueSystemDiscovered', queueData);
      
      return queueData;
    } catch (error) {
      console.error('❌ [Explorer] Error discovering queue system:', error.message);
      return { hasQueue: false };
    }
  }

  /**
   * Discover chat commands
   */
  async discoverChatCommands() {
    try {
      console.log('💬 [Explorer] Discovering chat commands...');
      
      const commands = await this.page.evaluate(() => {
        const found = [];
        
        // Look for help/command list
        const helpLinks = Array.from(document.querySelectorAll('a')).filter(a => {
          const text = a.textContent.toLowerCase();
          return text.includes('help') || text.includes('command');
        });
        
        // Common CyTube commands
        const commonCommands = [
          '/help', '/me', '/afk', '/clear', '/poll', '/mute', '/unmute',
          '/kick', '/ban', '/unban', '/shuffle', '/clean', '/cleantitle'
        ];
        
        commonCommands.forEach(cmd => {
          found.push({
            command: cmd,
            type: 'standard',
            discovered: 'known'
          });
        });
        
        return found;
      });
      
      this.features.chatCommands = commands;
      this.progress.commandsTried = 0;
      
      console.log(`✅ [Explorer] Found ${commands.length} chat commands`);
      this.emit('chatCommandsDiscovered', { commands });
      
      return commands;
    } catch (error) {
      console.error('❌ [Explorer] Error discovering commands:', error.message);
      return [];
    }
  }

  /**
   * Discover UI elements and capabilities
   */
  async discoverUIElements() {
    try {
      console.log('🎨 [Explorer] Discovering UI elements...');
      
      const uiData = await this.page.evaluate(() => {
        const elements = {
          userlist: !!document.querySelector('#userlist, .userlist'),
          videoPlayer: !!document.querySelector('video, #player'),
          chatbox: !!document.querySelector('#messagebuffer'),
          chatInput: !!document.querySelector('#chatline'),
          queue: !!document.querySelector('#queue, .playlist'),
          poll: !!document.querySelector('#poll, .poll'),
          settings: !!document.querySelector('#useroptions, .settings'),
          emotePanel: !!document.querySelector('.emote-panel, #emotes')
        };
        
        return elements;
      });
      
      Object.entries(uiData).forEach(([key, value]) => {
        this.features.uiElements.set(key, value);
      });
      
      this.progress.featuresExplored = Object.values(uiData).filter(Boolean).length;
      
      console.log(`✅ [Explorer] Found ${this.progress.featuresExplored} UI elements`);
      this.emit('uiElementsDiscovered', uiData);
      
      return uiData;
    } catch (error) {
      console.error('❌ [Explorer] Error discovering UI elements:', error.message);
      return {};
    }
  }

  /**
   * Use a random discovered emote
   */
  async useRandomEmote() {
    if (this.features.emotes.length === 0) return null;
    
    const emote = this.features.emotes[Math.floor(Math.random() * this.features.emotes.length)];
    this.progress.emotesUsed++;
    this.progress.lastActivity = Date.now();
    
    // Track usage
    const count = this.insights.popularEmotes.get(emote.name) || 0;
    this.insights.popularEmotes.set(emote.name, count + 1);
    
    this.emit('emoteUsed', { emote, count: this.progress.emotesUsed });
    
    return emote.name;
  }

  /**
   * Queue a video (if permissions allow)
   */
  async queueVideo(url, title = 'Slunt\'s Pick') {
    try {
      const success = await this.page.evaluate(({ url, title }) => {
        // Try to find add video input
        const urlInput = document.querySelector('input[name="mediaurl"], #mediaurl');
        const addBtn = document.querySelector('#queue-add, .add-video, button:has-text("Add")');
        
        if (urlInput && addBtn) {
          urlInput.value = url;
          addBtn.click();
          return true;
        }
        
        return false;
      }, { url, title });
      
      if (success) {
        this.progress.videosQueued++;
        this.progress.lastActivity = Date.now();
        
        this.insights.videoQueueTrends.push({
          url,
          title,
          timestamp: Date.now()
        });
        
        this.emit('videoQueued', { url, title, count: this.progress.videosQueued });
        console.log(`✅ [Explorer] Queued video: ${title}`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ [Explorer] Error queueing video:', error.message);
      return false;
    }
  }

  /**
   * Start periodic exploration activities
   */
  startPeriodicExploration() {
    if (this.explorationInterval) return;
    
    console.log('🔄 [Explorer] Starting periodic exploration...');
    
    this.explorationInterval = setInterval(async () => {
      try {
        // Randomly explore different features
        const roll = Math.random();
        
        if (roll < 0.4) {
          // Re-discover emotes (might find new ones)
          await this.discoverEmotes();
        } else if (roll < 0.7) {
          // Check gold features
          await this.discoverGoldFeatures();
        } else {
          // Check queue system
          await this.discoverQueueSystem();
        }
        
        // Emit progress update
        this.emit('explorationProgress', this.getProgress());
        
      } catch (error) {
        console.error('❌ [Explorer] Periodic exploration error:', error.message);
      }
    }, 60000); // Every minute
  }

  /**
   * Stop exploration
   */
  stopExploration() {
    if (this.explorationInterval) {
      clearInterval(this.explorationInterval);
      this.explorationInterval = null;
    }
    this.isExploring = false;
    console.log('⏹️ [Explorer] Exploration stopped');
  }

  /**
   * Get exploration progress summary
   */
  getProgress() {
    const runtime = Date.now() - this.progress.explorationStarted;
    
    return {
      ...this.progress,
      runtime: Math.floor(runtime / 1000),
      features: this.features,
      insights: {
        topEmotes: Array.from(this.insights.popularEmotes.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10),
        videosQueued: this.insights.videoQueueTrends.length,
        goldTransactions: this.insights.goldEconomy.transactions.length
      }
    };
  }

  /**
   * Log all discoveries
   */
  logDiscoveries() {
    console.log('\n📊 [Explorer] Discovery Summary:');
    console.log(`  😊 Emotes found: ${this.features.emotes.length}`);
    console.log(`  💰 Gold features: ${this.features.goldFeatures.length}`);
    console.log(`  📹 Queue system: ${this.features.queuePermissions || 'unknown'}`);
    console.log(`  💬 Commands: ${this.features.chatCommands.length}`);
    console.log(`  🎨 UI elements: ${this.features.uiElements.size}`);
    console.log('');
  }

  /**
   * Get full exploration data
   */
  getExplorationData() {
    return {
      features: this.features,
      progress: this.progress,
      insights: this.insights,
      isExploring: this.isExploring
    };
  }
}

module.exports = CoolholeExplorer;
