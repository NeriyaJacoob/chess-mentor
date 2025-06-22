// frontend-react/src/services/authService.js
// שירות Authentication ו-WebSocket מתוקן

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// ============= Authentication Service =============
class AuthService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');

    // Interceptor להוספת token לכל בקשה
    this.apiClient.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor לטיפול בתגובות
    this.apiClient.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        if (error.response?.status === 401 && error.config && !error.config._retry) {
          error.config._retry = true;
          try {
            await this.refreshAccessToken();
            error.config.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.apiClient.request(error.config);
          } catch (refreshError) {
            this.clearAuthData();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ============= API Calls =============

  async apiCall(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: endpoint
      };

      if (data) {
        config.data = data;
      }

      const response = await this.apiClient.request(config);
      return response;
    } catch (error) {
      console.error(`API call failed: ${method} ${endpoint}`, error);
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
      });

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

  async login(username, password) {
    try {
      const deviceInfo = this.getDeviceInfo();
      const response = await this.apiCall('/auth/login', 'POST', {
        username,
        password,
        device_info: deviceInfo
      });

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
      await this.apiCall('/auth/logout', 'POST');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.apiCall('/auth/refresh', 'POST', {
        refresh_token: this.refreshToken
      });

      if (response.success && response.access_token) {
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
        
        // תיקון: בניית URL נכון עם connection_id
        const wsUrl = `ws://localhost:5001/ws/${this.connectionId}${token ? `?token=${token}` : ''}`;
        
        console.log('🔗 Connecting to WebSocket:', wsUrl);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // שליחת הודעות ממתינות
          this.flushMessageQueue();
          
          resolve(this);
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('🔌 WebSocket disconnected');
          this.isConnected = false;
          this.socket = null;

          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
          }
        };

        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        // Timeout לחיבור
        setTimeout(() => {
          if (!this.isConnected) {
            this.socket?.close();
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
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.connectionId = null;
    this.rooms.clear();
    this.messageQueue = [];
  }

  // ============= Message Handling =============

  handleMessage(message) {
    const { type, data } = message;
    console.log('📨 Received:', type, data);

    // קריאה ל-callbacks רשומים
    const callbacks = this.callbacks[type] || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in callback for ${type}:`, error);
      }
    });

    // טיפול מיוחד בהודעות מסוימות
    switch (type) {
      case 'connected':
        this.connectionId = data.connection_id;
        this.emit('connected', data);
        break;
        
      case 'error':
        this.emit('error', data);
        break;
        
      case 'chat_message':
        this.emit('message', data);
        break;
        
      case 'joined_room':
        this.rooms.add(data.room_id);
        this.emit('room_joined', data);
        break;
        
      case 'left_room':
        this.rooms.delete(data.room_id);
        this.emit('room_left', data);
        break;
    }
  }

  // ============= Sending Messages =============

  send(type, data = {}) {
    const message = { type, data };
    
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('📦 Queuing message:', type);
      this.messageQueue.push(message);
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      console.log('📤 Sent:', type, data);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.send(message.type, message.data);
    }
  }

  // ============= Public Methods =============

  sendChatMessage(content, room = 'general') {
    return this.send('chat_message', { content, room });
  }

  joinRoom(roomId) {
    return this.send('join_room', { room_id: roomId });
  }

  leaveRoom(roomId) {
    return this.send('leave_room', { room_id: roomId });
  }

  getStatus() {
    this.send('get_status', {});
  }

  // ============= Event Handling =============

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    };
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    const callbacks = this.callbacks[event] || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event ${event}:`, error);
      }
    });
  }

  // ============= Helper Methods =============

  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionId: this.connectionId,
      reconnectAttempts: this.reconnectAttempts,
      rooms: Array.from(this.rooms),
      queuedMessages: this.messageQueue.length,
      isAuthenticated: !!this.authService.accessToken
    };
  }
}

// ============= App Service (Combined) =============

class AppService {
  constructor() {
    this.auth = new AuthService();
    this.ws = new WebSocketService(this.auth);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // בדיקה אם יש משתמש מחובר
    if (this.auth.isAuthenticated()) {
      try {
        // נסה לקבל את פרטי המשתמש
        await this.auth.getCurrentUser();
        
        // התחבר ל-WebSocket
        await this.ws.connect();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        this.auth.clearAuthData();
      }
    }

    this.initialized = true;
  }

  // Proxy methods for auth
  async login(username, password) {
    const result = await this.auth.login(username, password);
    if (result.success) {
      await this.ws.connect();
    }
    return result;
  }

  async register(username, password, email) {
    const result = await this.auth.register(username, password, email);
    if (result.success) {
      await this.ws.connect();
    }
    return result;
  }

  async logout() {
    this.ws.disconnect();
    await this.auth.logout();
  }

  // Combined status
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

// יצירת instance יחיד
const appService = new AppService();

// Export both individual services and combined service
export default appService;
export { AuthService, WebSocketService };