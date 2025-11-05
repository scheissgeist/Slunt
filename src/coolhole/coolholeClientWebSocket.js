const EventEmitter = require('events');
const io = require('socket.io-client');

/**
 * Coolhole WebSocket Client - Pure Socket.IO connection (NO BROWSER NEEDED)
 * 
 * This client connects directly to Coolhole's CyTube Socket.IO server
 * Much lighter weight and more reliable than browser automation
 */
class CoolholeWebSocketClient extends EventEmitter {
  constructor(healthMonitor = null) {
    super();
    this.socket = null;
    this.connected = false;
    this.chatReady = false;
    this.healthMonitor = healthMonitor;
    
    // Coolhole settings
    this.baseUrl = process.env.CYTUBE_SERVER || 'https://coolhole.org';
    this.channel = process.env.CYTUBE_CHANNEL || 'coolhole';
    this.username = process.env.BOT_USERNAME || 'Slunt';
    this.password = process.env.BOT_PASSWORD || '';
    
    // Use guest mode if no password provided
    this.useAuth = this.password && this.password.length > 0;
    
    // Chat state
    this.lastMessageTime = 0;
    this.messageQueue = [];
    this.minMessageDelay = 400;
    this.sessionId = null;
    
    console.log('🌐 [WebSocket] Coolhole client initialized');
    console.log(`   Mode: ${this.useAuth ? 'Authenticated' : 'Guest'}`);
    console.log(`   Server: ${this.baseUrl}`);
    console.log(`   Channel: ${this.channel}`);
  }

  /**
   * Connect to Coolhole via Socket.IO (NO BROWSER!)
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 [WebSocket] Connecting to Coolhole Socket.IO server...');
        
        // CyTube uses a channel-specific namespace: /r/channelname
        const socketPath = `/r/${this.channel}`;
        console.log(`🔗 [WebSocket] Connecting to namespace: ${socketPath}`);
        
        // Connect to Socket.IO server with channel namespace
        this.socket = io(`${this.baseUrl}${socketPath}`, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 5000,
          reconnectionDelayMax: 30000,
          timeout: 20000,
          forceNew: true,
          path: '/socket.io' // CyTube default path
        });

        // Connection established
        this.socket.on('connect', () => {
          console.log('✅ [WebSocket] Connected to Coolhole Socket.IO');
          this.sessionId = this.socket.id;
          console.log(`🔗 [WebSocket] Session ID: ${this.sessionId}`);
        });

        // Channel joined successfully / initial connection data
        this.socket.on('login', (data) => {
          console.log('📋 [WebSocket] Received login event:', JSON.stringify(data).substring(0, 100));
          
          // If not logged in yet, attempt login
          if (!this.connected) {
            if (this.useAuth && this.password) {
              console.log(`🔐 [WebSocket] Logging in as ${this.username}...`);
              this.socket.emit('login', {
                name: this.username,
                pw: this.password
              });
            } else {
              // Guest mode - just set name
              console.log(`👤 [WebSocket] Joining as guest: ${this.username}`);
              this.socket.emit('login', {
                name: this.username
              });
            }
          }
        });

        // Login response / rank assignment
        this.socket.on('rank', (rank) => {
          console.log(`✅ [WebSocket] Logged in with rank: ${rank}`);
          this.connected = true;
          this.chatReady = true;
          this.emit('connected');
          
          // Start health monitoring
          this.startHealthMonitoring();
          
          resolve();
        });

        // Set user (confirms login)
        this.socket.on('setUserRank', (data) => {
          console.log(`👤 [WebSocket] User rank set:`, data);
          if (!this.connected) {
            this.connected = true;
            this.chatReady = true;
            this.emit('connected');
            this.startHealthMonitoring();
            resolve();
          }
        });

        // Chat message received
        this.socket.on('chatMsg', (data) => {
          // CyTube message format:
          // { username: 'user', msg: 'message text', time: timestamp }
          if (data.username !== this.username) {
            this.emit('message', {
              username: data.username,
              message: data.msg,
              timestamp: data.time || Date.now()
            });
          }
        });

        // User list updates
        this.socket.on('userlist', (users) => {
          console.log(`👥 [WebSocket] ${users.length} users in channel`);
        });

        // Connection errors
        this.socket.on('connect_error', (error) => {
          console.error('💔 [WebSocket] Connection error:', error.message);
          reject(error);
        });

        // Disconnection
        this.socket.on('disconnect', (reason) => {
          console.log('💔 [WebSocket] Disconnected:', reason);
          this.connected = false;
          this.chatReady = false;
          this.emit('disconnected', { reason });
          
          // Auto-reconnect
          if (reason === 'io server disconnect') {
            // Server kicked us, reconnect manually
            this.socket.connect();
          }
        });

        // Error handling
        this.socket.on('error', (error) => {
          console.error('💔 [WebSocket] Socket error:', error);
        });

        // Kick handling
        this.socket.on('kick', (data) => {
          console.error('👢 [WebSocket] Kicked from channel:', data.reason);
          this.emit('disconnected', { reason: 'kicked' });
        });

        // Set timeout for connection
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout after 20 seconds'));
          }
        }, 20000);

      } catch (error) {
        console.error('💔 [WebSocket] Connection failed:', error.message);
        reject(error);
      }
    });
  }

  /**
   * Send a chat message
   */
  async sendMessage(text) {
    if (!this.connected || !this.socket) {
      console.error('❌ [WebSocket] Cannot send message - not connected');
      return false;
    }

    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastMessage = now - this.lastMessageTime;
      
      if (timeSinceLastMessage < this.minMessageDelay) {
        const delay = this.minMessageDelay - timeSinceLastMessage;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Send message via Socket.IO
      this.socket.emit('chatMsg', {
        msg: text,
        meta: {}
      });

      this.lastMessageTime = Date.now();
      console.log(`📤 [WebSocket] Sent: ${text}`);
      
      return true;
    } catch (error) {
      console.error('❌ [WebSocket] Failed to send message:', error.message);
      return false;
    }
  }

  /**
   * Start health monitoring (heartbeat)
   */
  startHealthMonitoring() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    console.log('💗 [WebSocket] Starting health monitoring');
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.connected) {
        // Send ping to keep connection alive
        this.socket.emit('ping');
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Disconnect from Coolhole
   */
  async disconnect() {
    console.log('🔌 [WebSocket] Disconnecting...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connected = false;
    this.chatReady = false;
    
    console.log('✅ [WebSocket] Disconnected');
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  /**
   * Check if chat is ready
   */
  isChatReady() {
    return this.chatReady && this.connected;
  }
}

module.exports = CoolholeWebSocketClient;
