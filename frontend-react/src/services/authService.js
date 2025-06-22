// frontend/services/authService.js
/**
 * שירות Authentication לצד הלקוח
 */

class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:5001';
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.refreshPromise = null;
  }

  // ============= API Methods =============

  async apiCall(endpoint, method = 'GET', body = null, skipAuth = false) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    // הוספת JWT token אם קיים ולא מתעלמים מהאימות
    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config = {
      method,
      headers
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      let response = await fetch(url, config);

      // אם יש שגיאת 401 וזה לא endpoint של רענון, נסה לרענן את הטוקן
      if (response.status === 401 && !skipAuth && endpoint !== '/auth/refresh') {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // נסה שוב עם הטוקן החדש
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          response = await fetch(url, { ...config, headers });
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ============= Authentication Methods =============

  async register(username, password, email = null) {
    try {
      const response = await this.apiCall('/auth/register', 'POST', {
        username,
        password,
        email
      }, true);

      if (response.success) {
        this.setAuthData(response);
        return response;
      }
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(username, password, deviceInfo = null) {
    try {
      const response = await this.apiCall('/auth/login', 'POST', {
        username,
        password,
        device_info: deviceInfo || this.getDeviceInfo()
      }, true);

      if (response.success) {
        this.setAuthData(response);
        return response;
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.accessToken) {
        await this.apiCall('/auth/logout', 'POST');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      this.clearAuthData();
      return false;
    }

    // מניעת קריאות מרובות לרענון במקביל
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = this._performRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  async _performRefresh() {
    try {
      const response = await this.apiCall('/auth/refresh', 'POST', {
        refresh_token: this.refreshToken
      }, true);

      if (response.success) {
        this.accessToken = response.access_token;
        localStorage.setItem('access_token', this.accessToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearAuthData();
    return false;
  }

  async getCurrentUser() {
    try {
      const response = await this.apiCall('/auth/me');
      if (response.success) {
        this.user = response.user;
        localStorage.setItem('user', JSON.stringify(this.user));
        return this.user;
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      this.clearAuthData();
    }
    return null;
  }

  async updateProfile(profileData) {
    try {
      const response = await this.apiCall('/auth/profile', 'PUT', profileData);
      if (response.success) {
        this.user = response.user;
        localStorage.setItem('user', JSON.stringify(this.user));
        return response;
      }
      throw new Error(response.message || 'Profile update failed');
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // ============= Helper Methods =============

  setAuthData(response) {
    this.accessToken = response.access_token;
    this.refreshToken = response.refresh_token;
    this.user = response.user;

    localStorage.setItem('access_token', this.accessToken);
    localStorage.setItem('refresh_token', this.refreshToken);
    localStorage.setItem('user', JSON.stringify(this.user));
  }

  clearAuthData() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.accessToken && !!this.user;
  }

  getUser() {
    return this.user;
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
    this.rooms = new Set();
    this.messageQueue = [];
  }

  // ============= Connection Management =============

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        if (this.isConnected) {
          resolve(this);
          return;
        }

        this.connectionId = this.generateConnectionId();
        const token = this.authService.accessToken;
        const wsUrl = `ws://localhost:5001/ws/${this.connectionId}${token ? `?token=${token}` : ''}`;

        console.log(`🔗 Connecting to WebSocket: ${this.connectionId}`);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.processMessageQueue();
          this.emit('connected', { connectionId: this.connectionId });
          resolve(this);
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('🔌 WebSocket disconnected');
          this.isConnected = false;
          this.socket = null;
          this.emit('disconnected', { code: event.code, reason: event.reason });

          // ניסיון התחברות מחדש אוטומטי
          if (this.reconnectAttempts < this.maxReconnectAttempts && !event.wasClean) {
            this.attemptReconnect();
          }
        };

        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', { error });
          reject(error);
        };

        // timeout למקרה שהחיבור לא מצליח
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
    }
    this.isConnected = false;
    this.socket = null;
    this.connectionId = null;
    this.rooms.clear();
    this.messageQueue = [];
    console.log('🔌 Manually disconnected from WebSocket');
  }

  async attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`🔄 Reconnecting in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    setTimeout(async () => {
      try {
        await this.connect();
        // חזור לחדרים שהיו
        for (const roomId of this.rooms) {
          this.joinRoom(roomId);
        }
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }, delay);
  }

  // ============= Message Handling =============

  send(type, data = {}, roomId = null) {
    const message = { type, data };
    if (roomId) message.room_id = roomId;

    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify(message));
        console.log('📤 Sent:', type, data);
        return true;
      } catch (error) {
        console.error('❌ Failed to send message:', error);
        return false;
      }
    } else {
      // הוסף להמתנה אם לא מחובר
      this.messageQueue.push(message);
      console.log('📝 Message queued:', type);
      return false;
    }
  }

  processMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`📬 Processing ${this.messageQueue.length} queued messages`);
      for (const message of this.messageQueue) {
        this.socket.send(JSON.stringify(message));
      }
      this.messageQueue = [];
    }
  }

  handleMessage(message) {
    const { type, data } = message;
    console.log('📨 Received:', type, data);

    // הודעות מיוחדות
    switch (type) {
      case 'connected':
        this.emit('connected', data);
        break;
      case 'room_joined':
        this.rooms.add(data.room_id);
        this.emit('roomJoined', data);
        break;
      case 'room_left':
        this.rooms.delete(data.room_id);
        this.emit('roomLeft', data);
        break;
      case 'pong':
        this.emit('pong', data);
        break;
      default:
        this.emit(type, data);
    }
  }

  // ============= Room Management =============

  joinRoom(roomId) {
    // בדיקה אם כבר בחדר
    if (this.rooms.has(roomId)) {
      console.log(`Already in room: ${roomId}`);
      return this;
    }
    
    this.send('join_room', { room_id: roomId });
    return this;
  }

  leaveRoom(roomId) {
    this.send('leave_room', { room_id: roomId });
    return this;
  }

  sendToRoom(roomId, message) {
    this.send('send_to_room', {
      room_id: roomId,
      message,
      timestamp: new Date().toISOString()
    });
    return this;
  }

  // ============= Direct Messaging =============

  sendToUser(userId, message) {
    this.send('send_to_user', {
      target_user_id: userId,
      message,
      timestamp: new Date().toISOString()
    });
    return this;
  }

  broadcast(message) {
    this.send('broadcast', {
      message,
      timestamp: new Date().toISOString()
    });
    return this;
  }

  // ============= Utility Methods =============

  ping() {
    this.send('ping', { timestamp: new Date().toISOString() });
    return this;
  }

  getStats() {
    this.send('get_stats');
    return this;
  }

  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============= Event System =============

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
    return this;
  }

  off(event, callback = null) {
    if (!this.callbacks[event]) return this;

    if (callback) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    } else {
      delete this.callbacks[event];
    }
    return this;
  }

  emit(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${event} callback:`, error);
        }
      });
    }
  }

  // ============= Status Methods =============

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionId: this.connectionId,
      reconnectAttempts: this.reconnectAttempts,
      rooms: Array.from(this.rooms),
      queuedMessages: this.messageQueue.length,
      isAuthenticated: this.authService.isAuthenticated()
    };
  }

  getRooms() {
    return Array.from(this.rooms);
  }
}

// ============= Application Service =============

class AppService {
  constructor() {
    this.auth = new AuthService();
    this.ws = new WebSocketService(this.auth);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log('🚀 Initializing AppService...');

    // בדוק אם יש משתמש שמור
    if (this.auth.isAuthenticated()) {
      try {
        await this.auth.getCurrentUser();
        console.log('✅ User restored from storage');
      } catch (error) {
        console.error('❌ Failed to restore user:', error);
        this.auth.clearAuthData();
      }
    }

    this.initialized = true;
    console.log('✅ AppService initialized');
  }

  async connectWebSocket() {
    if (!this.ws.isConnected) {
      await this.ws.connect();
    }
    return this.ws;
  }

  async loginAndConnect(username, password) {
    try {
      // התחבר
      const result = await this.auth.login(username, password);

      // התחבר ל-WebSocket
      await this.connectWebSocket();

      return result;
    } catch (error) {
      console.error('❌ Login and connect failed:', error);
      throw error;
    }
  }

  async logout() {
    this.ws.disconnect();
    await this.auth.logout();
  }

  getStatus() {
    return {
      auth: {
        isAuthenticated: this.auth.isAuthenticated(),
        user: this.auth.getUser()
      },
      websocket: this.ws.getConnectionStatus()
    };
  }
}

// יצירת אינסטנס גלובלי
const appService = new AppService();

// ייצוא
export default appService;
export { AuthService, WebSocketService, AppService };