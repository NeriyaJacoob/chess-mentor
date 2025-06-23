// frontend-react/src/services/appService.js - גרסה מתוקנת מלאה
// מחליף את authService.js הקיים עם פתרון מאוחד ומתוקן

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// ============= Auth Service =============
class AuthService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.accessToken = null;
    this.user = null;
    this.refreshToken = null;
    
    // טען נתונים מ-localStorage
    this.loadAuthData();
  }

  loadAuthData() {
    try {
      this.accessToken = localStorage.getItem('chessmentor_token');
      const userData = localStorage.getItem('chessmentor_user');
      this.user = userData ? JSON.parse(userData) : null;
      this.refreshToken = localStorage.getItem('chessmentor_refresh_token');
    } catch (error) {
      console.error('Failed to load auth data:', error);
      this.clearAuthData();
    }
  }

  saveAuthData() {
    try {
      if (this.accessToken) {
        localStorage.setItem('chessmentor_token', this.accessToken);
      }
      if (this.user) {
        localStorage.setItem('chessmentor_user', JSON.stringify(this.user));
      }
      if (this.refreshToken) {
        localStorage.setItem('chessmentor_refresh_token', this.refreshToken);
      }
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  }

  clearAuthData() {
    this.accessToken = null;
    this.user = null;
    this.refreshToken = null;
    
    localStorage.removeItem('chessmentor_token');
    localStorage.removeItem('chessmentor_user');
    localStorage.removeItem('chessmentor_refresh_token');
  }

  async login(username, password) {
    try {
      console.log('🔄 AuthService: Starting login...');
      
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          device_info: this.getDeviceInfo()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Login failed');
      }

      if (data.success) {
        // שמור את פרטי האימות
        this.accessToken = data.access_token;
        this.user = data.user;
        this.refreshToken = data.refresh_token;
        
        this.saveAuthData();
        
        console.log('✅ AuthService: Login successful', {
          username: this.user.username,
          userId: this.user.user_id
        });
        
        return {
          success: true,
          user: this.user,
          token: this.accessToken
        };
      } else {
        throw new Error('Login response was not successful');
      }
      
    } catch (error) {
      console.error('❌ AuthService: Login failed:', error);
      this.clearAuthData();
      throw error;
    }
  }

  async register(username, password, email) {
    try {
      console.log('🔄 AuthService: Starting registration...');
      
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email: email || `${username}@example.com` // Default email if not provided
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Registration failed');
      }

      if (data.success) {
        // אחרי רישום מוצלח, התחבר אוטומטית
        return await this.login(username, password);
      } else {
        throw new Error('Registration response was not successful');
      }
      
    } catch (error) {
      console.error('❌ AuthService: Registration failed:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // טוקן לא תקף
          this.clearAuthData();
          throw new Error('Token expired');
        }
        throw new Error('Failed to get current user');
      }

      const data = await response.json();
      this.user = data.user;
      this.saveAuthData();
      
      return this.user;
      
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.accessToken) {
        // נסה להודיע לשרת על logout
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearAuthData();
      console.log('✅ Logged out successfully');
    }
  }

  isAuthenticated() {
    return !!(this.accessToken && this.user);
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.accessToken;
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      timestamp: new Date().toISOString()
    };
  }
}

// ============= WebSocket Service =============
class WebSocketService {
  constructor(authService) {
    this.authService = authService;
    this.socket = null;
    this.connectionId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.callbacks = {};
    this.messageQueue = [];
    
    // אוטו-reconnect flag
    this.shouldReconnect = true;
  }

  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
          console.log('🔗 WebSocket already connected');
          resolve(this);
          return;
        }

        this.connectionId = this.generateConnectionId();
        const token = this.authService.getToken();
        
        // בניית URL עם טוקן
        let wsUrl = `ws://localhost:5001/ws/${this.connectionId}`;
        if (token) {
          wsUrl += `?token=${token}`;
        }
        
        console.log('🔗 Connecting to WebSocket:', wsUrl.replace(/token=[^&]+/, 'token=***'));
        
        this.socket = new WebSocket(wsUrl);

        // Connection opened
        this.socket.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.shouldReconnect = true;
          
          // שלח הודעות ממתינות
          this.flushMessageQueue();
          
          // קרא ל-callback של connected
          this.trigger('connected', {
            connectionId: this.connectionId,
            authenticated: !!token
          });
          
          resolve(this);
        };

        // Message received
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        // Connection closed
        this.socket.onclose = (event) => {
          console.log('🔌 WebSocket disconnected', { 
            code: event.code, 
            reason: event.reason,
            wasClean: event.wasClean 
          });
          
          this.isConnected = false;
          this.socket = null;
          
          this.trigger('disconnected', { 
            code: event.code, 
            reason: event.reason 
          });

          // אוטו-reconnect אם לא נותק בכוונה
          if (this.shouldReconnect && !event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * this.reconnectAttempts;
            console.log(`🔄 Reconnecting in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
              if (this.shouldReconnect) {
                this.connect().catch(error => {
                  console.error('Reconnection failed:', error);
                });
              }
            }, delay);
          }
        };

        // Connection error
        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.trigger('error', { error: error.message || 'Connection error' });
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected && this.socket?.readyState !== WebSocket.OPEN) {
            this.socket?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
    
    this.isConnected = false;
    this.connectionId = null;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    
    console.log('🔌 WebSocket disconnected manually');
  }

  send(message) {
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
        console.log('📤 WebSocket message sent:', message);
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    } else {
      // הוסף להמתנה
      this.messageQueue.push(message);
      console.log('📦 Message queued (not connected):', message);
      return false;
    }
  }

  flushMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`📨 Sending ${this.messageQueue.length} queued messages`);
      const queue = [...this.messageQueue];
      this.messageQueue = [];
      
      queue.forEach(message => {
        this.send(message);
      });
    }
  }

  // Event handling
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  off(event, callback = null) {
    if (!this.callbacks[event]) return;
    
    if (callback) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    } else {
      this.callbacks[event] = [];
    }
  }

  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  // Message handlers
  handleMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'connected':
        this.trigger('connected', data);
        break;
        
      case 'room_joined':
        this.trigger('roomJoined', data);
        break;
        
      case 'user_joined_room':
        this.trigger('user_joined_room', data);
        break;
        
      case 'room_message':
        this.trigger('room_message', data);
        break;
        
      case 'private_message':
        this.trigger('private_message', data);
        break;
        
      case 'error':
        this.trigger('error', data);
        break;
        
      default:
        console.log('Unknown message type:', type, data);
        this.trigger('message', { type, data });
    }
  }

  // Chat methods
  joinRoom(roomId) {
    return this.send({
      type: 'join_room',
      data: { room_id: roomId }
    });
  }

  leaveRoom(roomId) {
    return this.send({
      type: 'leave_room',
      data: { room_id: roomId }
    });
  }

  sendMessage(roomId, content) {
    return this.send({
      type: 'send_message',
      data: {
        room_id: roomId,
        content: content
      }
    });
  }

  // Status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionId: this.connectionId,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.socket?.readyState || WebSocket.CLOSED
    };
  }
}

// ============= Chess Socket Service =============
class ChessSocketService {
  constructor(authService) {
    this.authService = authService;
    this.socket = null;
    this.gameId = null;
    this.playerColor = null;
    this.playerId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.callbacks = {};
    
    // אוטו-reconnect flag
    this.shouldReconnect = true;
  }

  generatePlayerId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async connect(playerData = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
          console.log('🔗 Chess socket already connected');
          resolve(this);
          return;
        }

        this.playerId = this.generatePlayerId();
        const token = this.authService.getToken();
        
        let wsUrl = `ws://localhost:5001/ws/game/${this.playerId}`;
        if (token) {
          wsUrl += `?token=${token}`;
        }
        
        console.log('♟️ Connecting to chess server:', wsUrl.replace(/token=[^&]+/, 'token=***'));
        
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✅ Chess socket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.shouldReconnect = true;
          
          // שלח הודעת join
          this.send('join', {
            name: playerData.name || this.authService.getUser()?.username || 'Player',
            elo: playerData.elo || this.authService.getUser()?.elo || 1200
          });
          
          resolve(this);
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('♟️ Chess message received:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse chess message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('🔌 Chess socket disconnected');
          this.isConnected = false;
          this.socket = null;
          
          this.trigger('disconnected', event);

          // אוטו-reconnect
          if (this.shouldReconnect && !event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              if (this.shouldReconnect) {
                this.connect(playerData).catch(console.error);
              }
            }, 2000 * this.reconnectAttempts);
          }
        };

        this.socket.onerror = (error) => {
          console.error('❌ Chess socket error:', error);
          this.trigger('error', error);
          reject(error);
        };

        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Chess socket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
    
    this.isConnected = false;
    this.gameId = null;
    this.playerColor = null;
    this.playerId = null;
    
    console.log('♟️ Chess socket disconnected manually');
  }

  send(action, data = {}) {
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      const message = { action, data };
      this.socket.send(JSON.stringify(message));
      console.log('♟️ Chess message sent:', message);
      return true;
    }
    return false;
  }

  // Game actions
  findGame(aiLevel = 5) {
    return this.send('find_game', { ai_level: aiLevel });
  }

  makeMove(move) {
    return this.send('make_move', { move });
  }

  resignGame() {
    return this.send('resign');
  }

  // Event handling (same as WebSocketService)
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  off(event, callback = null) {
    if (!this.callbacks[event]) return;
    
    if (callback) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    } else {
      this.callbacks[event] = [];
    }
  }

  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in chess ${event} callback:`, error);
        }
      });
    }
  }

  handleMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'connected':
        this.trigger('connected', data);
        break;
        
      case 'game_start':
        this.gameId = data.game_id;
        this.playerColor = data.color;
        this.trigger('gameStart', data);
        break;
        
      case 'move_made':
        this.trigger('moveMade', data);
        break;
        
      case 'game_end':
        this.gameId = null;
        this.playerColor = null;
        this.trigger('gameEnd', data);
        break;
        
      default:
        this.trigger('message', { type, data });
    }
  }

  // Status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isInGame: !!this.gameId,
      gameId: this.gameId,
      playerColor: this.playerColor,
      playerId: this.playerId
    };
  }
}

// ============= Combined App Service =============
class AppService {
  constructor() {
    this.auth = new AuthService();
    this.ws = new WebSocketService(this.auth);
    this.chess = new ChessSocketService(this.auth);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      console.log('ℹ️ AppService already initialized');
      return;
    }

    console.log('🚀 Initializing AppService...');

    try {
      // בדוק אם יש אימות קיים
      if (this.auth.isAuthenticated()) {
        console.log('🔍 Found existing auth, validating...');
        
        try {
          // ודא שהמשתמש עדיין תקף
          const currentUser = await this.auth.getCurrentUser();
          
          if (currentUser) {
            console.log('✅ User validation successful:', currentUser.username);
            
            // התחבר ל-WebSocket עם הטוקן הקיים
            try {
              await this.ws.connect();
              console.log('✅ WebSocket connected with existing token');
            } catch (wsError) {
              console.warn('⚠️ WebSocket connection failed, will retry on next action:', wsError.message);
            }
          } else {
            console.log('⚠️ User validation failed, clearing auth data');
            this.auth.clearAuthData();
          }
        } catch (error) {
          console.warn('⚠️ Auth validation failed:', error.message);
          this.auth.clearAuthData();
        }
      }

      this.initialized = true;
      console.log('✅ AppService initialized successfully');
      
    } catch (error) {
      console.error('❌ AppService initialization failed:', error);
      this.auth.clearAuthData();
    }
  }

  // Auth methods
  async login(username, password) {
    try {
      console.log('🔄 AppService: Login starting...');
      
      // 1. התחבר דרך auth service
      const authResult = await this.auth.login(username, password);
      
      if (authResult.success) {
        console.log('✅ Auth successful, connecting WebSocket...');
        
        // 2. התחבר ל-WebSocket עם הטוקן החדש
        try {
          await this.ws.connect();
          console.log('✅ WebSocket connected after login');
        } catch (wsError) {
          console.warn('⚠️ WebSocket connection failed after login:', wsError.message);
          // לא כישלון קריטי - הצ'אט עדיין לא יעבוד אבל המשתמש מחובר
        }
        
        return authResult;
      }
      
    } catch (error) {
      console.error('❌ AppService login failed:', error);
      throw error;
    }
  }

  async register(username, password, email) {
    try {
      console.log('🔄 AppService: Registration starting...');
      
      const authResult = await this.auth.register(username, password, email);
      
      if (authResult.success) {
        console.log('✅ Registration successful, connecting WebSocket...');
        
        try {
          await this.ws.connect();
          console.log('✅ WebSocket connected after registration');
        } catch (wsError) {
          console.warn('⚠️ WebSocket connection failed after registration:', wsError.message);
        }
        
        return authResult;
      }
      
    } catch (error) {
      console.error('❌ AppService registration failed:', error);
      throw error;
    }
  }

  async logout() {
    try {
      console.log('🔄 AppService: Logout starting...');
      
      // נתק את כל החיבורים
      this.ws.disconnect();
      this.chess.disconnect();
      
      // התנתק מהשרת
      await this.auth.logout();
      
      console.log('✅ AppService logout successful');
      
    } catch (error) {
      console.error('❌ AppService logout failed:', error);
      // גם אם הלוגאוט נכשל, נקה את הנתונים המקומיים
      this.auth.clearAuthData();
    }
  }

  // Chess methods
  async startNewGame(options = {}) {
    try {
      if (!this.auth.isAuthenticated()) {
        throw new Error('Must be logged in to start a game');
      }

      console.log('♟️ Starting new chess game...');
      
      // התחבר לשרת המשחקים
      await this.chess.connect({
        name: this.auth.getUser()?.username || 'Player',
        elo: this.auth.getUser()?.elo || 1200
      });

      // התחל משחק חדש
      this.chess.findGame(options.aiLevel || 5);
      
      console.log('✅ Chess game connection initiated');
      
    } catch (error) {
      console.error('❌ Failed to start chess game:', error);
      throw error;
    }
  }

  // WebSocket methods
  async connectWebSocket() {
    if (!this.auth.isAuthenticated()) {
      throw new Error('Must be authenticated to connect WebSocket');
    }
    
    return await this.ws.connect();
  }

  // Status and getters
  getStatus() {
    return {
      auth: {
        isAuthenticated: this.auth.isAuthenticated(),
        user: this.auth.getUser(),
        token: !!this.auth.getToken()
      },
      websocket: this.ws.getConnectionStatus(),
      chess: this.chess.getConnectionStatus(),
      initialized: this.initialized
    };
  }

  // Direct access to services (for compatibility)
  get authService() {
    return this.auth;
  }

  get webSocketService() {
    return this.ws;
  }

  get chessService() {
    return this.chess;
  }
}

// יצירת instance יחיד
const appService = new AppService();

// Export עבור שימוש ברכיבים
export default appService;
export { AuthService, WebSocketService, ChessSocketService };