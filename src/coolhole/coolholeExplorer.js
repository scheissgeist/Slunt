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
   * Discover video queue system with detailed UI mapping
   */
  async discoverQueueSystem() {
    try {
      console.log('📹 [Explorer] Discovering video queue system...');
      
      const queueData = await this.page.evaluate(() => {
        const data = {
          hasQueue: false,
          queueElements: [],
          permissions: null,
          currentVideo: null,
          ui: {
            videoSearchButton: null, // Magnifying glass icon
            searchInput: null,
            addVideoButton: null,
            mediaUrlInput: null,
            queueNextButton: null,
            queueEndButton: null,
            skipVoteButton: null,
            queueContainer: null
          }
        };
        
        // Look for video search button (magnifying glass icon)
        const searchButtons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(b => {
          const title = b.getAttribute('title')?.toLowerCase() || '';
          const ariaLabel = b.getAttribute('aria-label')?.toLowerCase() || '';
          const className = b.className?.toLowerCase() || '';
          
          return title.includes('search') || 
                 title.includes('find') ||
                 ariaLabel.includes('search') ||
                 className.includes('search') ||
                 b.querySelector('svg') || // Likely has a magnifying glass icon
                 b.textContent.includes('🔍');
        });
        
        if (searchButtons.length > 0) {
          data.ui.videoSearchButton = {
            found: true,
            selector: searchButtons[0].className || searchButtons[0].id,
            type: 'search-icon',
            position: 'video-controls'
          };
        }
        
        // Look for search input field (appears after clicking search button)
        const searchInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"]')).filter(i => {
          const placeholder = i.placeholder?.toLowerCase() || '';
          const name = i.name?.toLowerCase() || '';
          return placeholder.includes('search') || 
                 placeholder.includes('video') ||
                 placeholder.includes('youtube') ||
                 name.includes('search');
        });
        
        if (searchInputs.length > 0) {
          data.ui.searchInput = {
            found: true,
            selector: searchInputs[0].className || searchInputs[0].name,
            placeholder: searchInputs[0].placeholder
          };
        }
        
        // Look for the + button to add videos (fallback method)
        const addButtons = Array.from(document.querySelectorAll('button')).filter(b => 
          b.textContent.trim() === '+' || 
          b.getAttribute('title')?.toLowerCase().includes('add') ||
          b.className.includes('add-video')
        );
        if (addButtons.length > 0) {
          data.ui.addVideoButton = {
            found: true,
            selector: addButtons[0].className,
            position: 'right-of-chat-controls'
          };
        }
        
        // Look for media URL input box
        const urlInputs = Array.from(document.querySelectorAll('input[type="text"]')).filter(i =>
          i.placeholder?.toLowerCase().includes('url') ||
          i.placeholder?.toLowerCase().includes('media') ||
          i.name?.includes('mediaurl')
        );
        if (urlInputs.length > 0) {
          data.ui.mediaUrlInput = {
            found: true,
            selector: urlInputs[0].className || urlInputs[0].name,
            placeholder: urlInputs[0].placeholder
          };
        }
        
        // Look for queue container (right side, under poll)
        const queueContainers = document.querySelectorAll('#queue, .playlist, #playlist, .video-queue, [id*="queue"]');
        if (queueContainers.length > 0) {
          data.hasQueue = true;
          data.ui.queueContainer = {
            found: true,
            selector: queueContainers[0].id || queueContainers[0].className,
            itemCount: queueContainers[0].querySelectorAll('li, .queue-item, [class*="queue"]').length
          };
          
          // Look for queue control buttons (arrow and double arrow)
          const queueItems = queueContainers[0].querySelectorAll('li, .queue-item');
          if (queueItems.length > 0) {
            const firstItem = queueItems[0];
            const arrows = firstItem.querySelectorAll('button, [role="button"]');
            
            arrows.forEach(btn => {
              const text = btn.textContent.trim();
              const title = btn.getAttribute('title')?.toLowerCase() || '';
              
              // Single arrow = queue next
              if (text === '▶' || text === '→' || title.includes('next') || title.includes('play next')) {
                data.ui.queueNextButton = {
                  found: true,
                  selector: btn.className,
                  restricted: true, // Normal users can't use this
                  text: text
                };
              }
              
              // Double arrow = queue at end
              if (text === '▶▶' || text === '⏭' || text === '»' || title.includes('end') || title.includes('last')) {
                data.ui.queueEndButton = {
                  found: true,
                  selector: btn.className,
                  available: true, // This is what Slunt should use
                  text: text
                };
              }
            });
          }
        }
        
        // Look for vote skip button (far right button band, costs CP)
        const skipButtons = Array.from(document.querySelectorAll('button')).filter(b => {
          const text = b.textContent.toLowerCase();
          const title = b.getAttribute('title')?.toLowerCase() || '';
          return text.includes('skip') || text.includes('vote') || 
                 title.includes('skip') || title.includes('vote');
        });
        if (skipButtons.length > 0) {
          data.ui.skipVoteButton = {
            found: true,
            selector: skipButtons[0].className,
            costsCoolPoints: true,
            position: 'far-right-button-band'
          };
        }
        
        // Check current video
        const videoPlayer = document.querySelector('video, #player, .video-player, iframe');
        if (videoPlayer) {
          data.currentVideo = {
            present: true,
            playing: videoPlayer.tagName === 'VIDEO' ? !videoPlayer.paused : true,
            position: 'center-right'
          };
        }
        
        // Determine permissions based on available buttons
        if (data.ui.queueEndButton?.available) {
          data.permissions = 'can-queue-end';
        } else if (data.ui.addVideoButton?.found) {
          data.permissions = 'can-add-to-queue';
        } else {
          data.permissions = 'restricted';
        }
        
        return data;
      });
      
      this.features.queuePermissions = queueData.permissions;
      this.features.uiElements.set('videoQueue', queueData.ui);
      
      console.log(`✅ [Explorer] Queue system discovered:`, queueData.hasQueue ? 'Available' : 'Not found');
      if (queueData.ui.videoSearchButton?.found) {
        console.log('   ✓ Video search button (🔍) found');
      }
      if (queueData.ui.addVideoButton?.found) {
        console.log('   ✓ Add video button (+) found');
      }
      if (queueData.ui.queueEndButton?.available) {
        console.log('   ✓ Queue-to-end button available (normal user)');
      }
      if (queueData.ui.skipVoteButton?.found) {
        console.log('   ✓ Vote skip button found (costs CP)');
      }
      
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
   * Search and queue a video using Coolhole's built-in search (magnifying glass)
   */
  async searchAndQueueVideo(searchQuery, title = null) {
    try {
      console.log(`📹 [Explorer] Searching and queueing: "${searchQuery}"`);
      
      const result = await this.page.evaluate(({ query }) => {
        try {
          // Step 1: Find the search button (magnifying glass icon)
          const searchButtons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(b => {
            const title = b.getAttribute('title')?.toLowerCase() || '';
            const ariaLabel = b.getAttribute('aria-label')?.toLowerCase() || '';
            const className = b.className?.toLowerCase() || '';
            
            return title.includes('search') || 
                   title.includes('find') ||
                   ariaLabel.includes('search') ||
                   className.includes('search') ||
                   b.querySelector('svg') ||
                   b.textContent.includes('🔍');
          });
          
          if (searchButtons.length === 0) {
            return { success: false, reason: 'search-button-not-found', step: 1 };
          }
          
          console.log('[Explorer] Found search button, clicking...');
          searchButtons[0].click();
          
          // Step 2: Wait for search input to appear, then find it
          return new Promise((resolve) => {
            setTimeout(() => {
              const searchInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"]')).filter(i => {
                const placeholder = i.placeholder?.toLowerCase() || '';
                const name = i.name?.toLowerCase() || '';
                const isVisible = i.offsetParent !== null; // Check if visible
                
                return isVisible && (
                  placeholder.includes('search') || 
                  placeholder.includes('video') ||
                  placeholder.includes('youtube') ||
                  name.includes('search') ||
                  name.includes('media')
                );
              });
              
              if (searchInputs.length === 0) {
                resolve({ success: false, reason: 'search-input-not-found', step: 2 });
                return;
              }
              
              console.log('[Explorer] Found search input, entering query...');
              const searchInput = searchInputs[0];
              searchInput.value = query;
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
              searchInput.dispatchEvent(new Event('change', { bubbles: true }));
              
              // Step 3: Press Enter or click search button to search
              setTimeout(() => {
                // Try pressing Enter
                const enterEvent = new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  bubbles: true
                });
                searchInput.dispatchEvent(enterEvent);
                
                // Also try finding and clicking a search submit button
                const submitButtons = Array.from(document.querySelectorAll('button')).filter(b => {
                  const text = b.textContent.toLowerCase();
                  const title = b.getAttribute('title')?.toLowerCase() || '';
                  return text.includes('search') || text === '🔍' || title.includes('search');
                });
                
                if (submitButtons.length > 0) {
                  submitButtons[0].click();
                }
                
                console.log('[Explorer] Search submitted, waiting for results...');
                
                // Step 4: Wait for results to appear, then select first result
                setTimeout(() => {
                  // Look for search results (usually a list or dropdown)
                  const resultContainers = document.querySelectorAll('.search-results, [class*="result"], [class*="dropdown"]');
                  
                  if (resultContainers.length > 0) {
                    // Find clickable result items
                    const resultItems = Array.from(resultContainers[0].querySelectorAll('li, .item, [role="option"]'));
                    
                    if (resultItems.length > 0) {
                      console.log('[Explorer] Found search results, clicking first result...');
                      resultItems[0].click();
                      
                      // Step 5: Video should auto-queue or we need to click add
                      setTimeout(() => {
                        // Check if we need to click an "add to queue" button
                        const addButtons = Array.from(document.querySelectorAll('button')).filter(b => {
                          const text = b.textContent.toLowerCase();
                          return text.includes('add') || text.includes('queue') || text === '+';
                        });
                        
                        if (addButtons.length > 0) {
                          console.log('[Explorer] Clicking add to queue...');
                          addButtons[0].click();
                        }
                        
                        resolve({ 
                          success: true, 
                          reason: 'video-queued',
                          query: query
                        });
                      }, 500);
                    } else {
                      resolve({ success: false, reason: 'no-result-items', step: 4 });
                    }
                  } else {
                    // No results container found, maybe it auto-queued?
                    resolve({ 
                      success: true, 
                      reason: 'auto-queued-or-no-results',
                      query: query 
                    });
                  }
                }, 1000); // Wait 1s for results
              }, 300);
            }, 300); // Wait 300ms for search input to appear
          });
        } catch (error) {
          return { success: false, reason: error.message, step: 0 };
        }
      }, { query: searchQuery });
      
      if (result.success) {
        this.progress.videosQueued++;
        this.progress.lastActivity = Date.now();
        
        this.insights.videoQueueTrends.push({
          query: searchQuery,
          title: title || searchQuery,
          timestamp: Date.now(),
          method: 'search'
        });
        
        this.emit('videoQueued', { 
          query: searchQuery,
          title: title || searchQuery,
          count: this.progress.videosQueued,
          method: 'search'
        });
        
        console.log(`✅ [Explorer] Video search queued successfully: "${searchQuery}"`);
        return true;
      } else {
        console.error(`❌ [Explorer] Failed to queue video: ${result.reason} (step ${result.step})`);
        return false;
      }
    } catch (error) {
      console.error('❌ [Explorer] Error searching and queueing video:', error.message);
      return false;
    }
  }

  /**
   * Queue a video using direct URL (fallback method)
   */
  async queueVideo(url, title = 'Slunt\'s Pick') {
    try {
      console.log(`📹 [Explorer] Attempting to queue video: ${title}`);
      console.log(`   URL: ${url}`);
      
      const success = await this.page.evaluate(({ url, title }) => {
        try {
          // Step 1: Find the + button (right of chat controls)
          const addButtons = Array.from(document.querySelectorAll('button')).filter(b => 
            b.textContent.trim() === '+' || 
            b.getAttribute('title')?.toLowerCase().includes('add') ||
            b.className.includes('add-video')
          );
          
          if (addButtons.length === 0) {
            console.error('[Explorer] Cannot find + button to add video');
            return { success: false, reason: 'add-button-not-found' };
          }
          
          // Click the + button to open URL input
          addButtons[0].click();
          
          // Wait a moment for the input to appear
          return new Promise((resolve) => {
            setTimeout(() => {
              // Step 2: Find media URL input box
              const urlInputs = Array.from(document.querySelectorAll('input[type="text"]')).filter(i =>
                i.placeholder?.toLowerCase().includes('url') ||
                i.placeholder?.toLowerCase().includes('media') ||
                i.name?.includes('mediaurl') ||
                i.style.display !== 'none'
              );
              
              if (urlInputs.length === 0) {
                resolve({ success: false, reason: 'url-input-not-found' });
                return;
              }
              
              // Step 3: Enter URL
              const urlInput = urlInputs[0];
              urlInput.value = url;
              urlInput.dispatchEvent(new Event('input', { bubbles: true }));
              urlInput.dispatchEvent(new Event('change', { bubbles: true }));
              
              // Step 4: Find submit/add button (usually appears near input)
              setTimeout(() => {
                const submitButtons = Array.from(document.querySelectorAll('button')).filter(b => {
                  const text = b.textContent.toLowerCase();
                  return text.includes('add') || text.includes('submit') || text === '+';
                });
                
                if (submitButtons.length === 0) {
                  resolve({ success: false, reason: 'submit-button-not-found' });
                  return;
                }
                
                // Click submit to add to queue
                submitButtons[0].click();
                
                // Step 5: Wait for queue item to appear, then click end-of-queue button
                setTimeout(() => {
                  // Normal users can only add to end of queue (⇒ button)
                  // The video should automatically go to the end, but we'll verify
                  const queueItems = document.querySelectorAll('#queue li, .playlist li, .queue-item');
                  
                  if (queueItems.length === 0) {
                    resolve({ success: false, reason: 'video-not-in-queue' });
                    return;
                  }
                  
                  // Find the last queue item (should be ours)
                  const lastItem = queueItems[queueItems.length - 1];
                  
                  // Look for end-of-queue button (⇒) just to make sure it's at the end
                  const endButtons = lastItem.querySelectorAll('button');
                  const endButton = Array.from(endButtons).find(b => {
                    const text = b.textContent.trim();
                    const title = b.getAttribute('title')?.toLowerCase() || '';
                    return text === '▶▶' || text === '⏭' || text === '»' || 
                           text === '⇒' || title.includes('end') || title.includes('last');
                  });
                  
                  // If we find an end button, click it to ensure placement at end
                  if (endButton) {
                    endButton.click();
                  }
                  
                  resolve({ 
                    success: true, 
                    reason: 'video-queued-at-end',
                    queuePosition: queueItems.length
                  });
                }, 500);
              }, 300);
            }, 200);
          });
        } catch (error) {
          return { success: false, reason: error.message };
        }
      }, { url, title });
      
      if (success.success) {
        this.progress.videosQueued++;
        this.progress.lastActivity = Date.now();
        
        this.insights.videoQueueTrends.push({
          url,
          title,
          timestamp: Date.now(),
          queuePosition: success.queuePosition || 'end'
        });
        
        this.emit('videoQueued', { 
          url, 
          title, 
          count: this.progress.videosQueued,
          position: success.queuePosition 
        });
        
        console.log(`✅ [Explorer] Video queued successfully at position #${success.queuePosition}`);
        console.log(`   ${title}`);
        return true;
      } else {
        console.error(`❌ [Explorer] Failed to queue video: ${success.reason}`);
        return false;
      }
    } catch (error) {
      console.error('❌ [Explorer] Error queueing video:', error.message);
      return false;
    }
  }
  
  /**
   * Check if we can vote skip the current video (costs CP)
   */
  async canVoteSkip() {
    try {
      const skipInfo = await this.page.evaluate(() => {
        // Find vote skip button (far right button band)
        const skipButtons = Array.from(document.querySelectorAll('button')).filter(b => {
          const text = b.textContent.toLowerCase();
          const title = b.getAttribute('title')?.toLowerCase() || '';
          return text.includes('skip') || text.includes('vote') || 
                 title.includes('skip') || title.includes('vote');
        });
        
        if (skipButtons.length === 0) {
          return { available: false, reason: 'button-not-found' };
        }
        
        const skipButton = skipButtons[0];
        const disabled = skipButton.disabled || skipButton.classList.contains('disabled');
        
        return {
          available: !disabled,
          reason: disabled ? 'button-disabled' : 'available',
          costsCoolPoints: true // Always costs CP
        };
      });
      
      return skipInfo;
    } catch (error) {
      console.error('❌ [Explorer] Error checking vote skip:', error.message);
      return { available: false, reason: error.message };
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
