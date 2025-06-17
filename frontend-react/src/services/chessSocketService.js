// src/services/SocketService.js - שירות WebSocket מאוחד
class SocketService {
  constructor() {
    this.socket = null;
    this.gameId = null;
    this.playerColor = null;
    this.playerId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    // Event callbacks
    this.callbacks = {
      onConnected: [],
      onDisconnected: [],
      onGameStart: [],
      onGameEnd: [],
      onMoveMade: [],
      onMoveAnalysis: [],
      onError: [],
      onOpponentDisconnected: [],
      onSearching: [],
      onSearchTimeout: [],
      onChatMessage: []
    };
  }

  // Connection Management
  async connect(playerData = {}) {
    try {
      // Try Python server first (port 5001), fallback to Node.js (port 5000)
      const servers = [
        'ws://localhost:5001/ws',  // Python FastAPI server
        'ws://localhost:5000'      // Node.js server (if available)
      ];

      for (const serverUrl of servers) {
        try {
          console.log(`🔗 Attempting to connect to ${serverUrl}...`);
          await this._connectToServer(serverUrl, playerData);
          console.log(`✅ Connected to chess server: ${serverUrl}`);
          return this;
        } catch (error) {
          console.warn(`❌ Failed to connect to ${serverUrl}:`, error.message);
          continue;
        }
      }
      
      throw new Error('Unable to connect to any chess server');
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      throw error;
    }
  }

  _connectToServer(url, playerData) {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(url);
      
      const timeout = setTimeout(() => {
        this.socket.close();
        reject(new Error('Connection timeout'));
      }, 5000);

      this.socket.onopen = () => {
        clearTimeout(timeout);
        console.log('🔗 WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Send join message
        this.send('join', {
          name: playerData.name || 'Player',
          elo: playerData.elo || 1200,
          sessionId: playerData.sessionId || null
        });
        
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._handleMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse message:', error);
        }
      };

      this.socket.onclose = (event) => {
        clearTimeout(timeout);
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this._emit('onDisconnected', { code: event.code, reason: event.reason });
        
        // Auto-reconnect if not intentional disconnect
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this._attemptReconnect(playerData);
        }
      };

      this.socket.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ WebSocket error:', error);
        this._emit('onError', { message: 'WebSocket connection error', error });
        reject(error);
      };
    });
  }

  _attemptReconnect(playerData) {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(playerData).catch(error => {
        console.error('❌ Reconnection failed:', error);
      });
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Intentional disconnect');
      this.socket = null;
    }
    this.isConnected = false;
    this.gameId = null;
    this.playerColor = null;
    this.playerId = null;
  }

  // Message Handling
  _handleMessage(message) {
    const { type, data } = message;
    console.log('📨 Received:', type, data);

    switch (type) {
      case 'connected':
        this.playerId = data.player_id || data.playerId;
        this._emit('onConnected', data);
        break;

      case 'game_start':
        this.gameId = data.game_id || data.gameId;
        this.playerColor = data.color;
        this._emit('onGameStart', data);
        break;

      case 'move_made':
        this._emit('onMoveMade', data);
        break;

      case 'game_end':
        this.gameId = null;
        this.playerColor = null;
        this._emit('onGameEnd', data);
        break;

      case 'move_analysis':
        this._emit('onMoveAnalysis', data);
        break;

      case 'error':
        this._emit('onError', data);
        break;

      case 'opponent_disconnected':
        this._emit('onOpponentDisconnected', data);
        break;

      case 'searching':
        this._emit('onSearching', data);
        break;

      case 'search_timeout':
        this._emit('onSearchTimeout', data);
        break;

      case 'chat_message':
        this._emit('onChatMessage', data);
        break;

      default:
        console.warn('❓ Unknown message type:', type);
    }
  }

  send(action, data = {}) {
    if (!this.isConnected || !this.socket) {
      console.error('❌ Cannot send message - not connected');
      return false;
    }

    try {
      const message = { action, data };
      this.socket.send(JSON.stringify(message));
      console.log('📤 Sent:', action, data);
      return true;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      return false;
    }
  }

  // Game Actions
  findGame(mode = 'ai', timeControl = null) {
    return this.send('find_game', { mode, timeControl });
  }

  makeMove(move, gameId = null) {
    return this.send('make_move', { 
      move, 
      game_id: gameId || this.gameId 
    });
  }

  analyzeMove(move, gameId = null) {
    return this.send('analyze_move', { 
      move, 
      game_id: gameId || this.gameId 
    });
  }

  getPosition(gameId = null) {
    return this.send('get_position', { 
      game_id: gameId || this.gameId 
    });
  }

  resign(gameId = null) {
    return this.send('resign', { 
      game_id: gameId || this.gameId 
    });
  }

  sendChatMessage(message, gameId = null) {
    return this.send('chat_message', { 
      message, 
      game_id: gameId || this.gameId 
    });
  }

  requestDraw(gameId = null) {
    return this.send('request_draw', { 
      game_id: gameId || this.gameId 
    });
  }

  acceptDraw(gameId = null) {
    return this.send('accept_draw', { 
      game_id: gameId || this.gameId 
    });
  }

  offerRematch(gameId = null) {
    return this.send('offer_rematch', { 
      game_id: gameId || this.gameId 
    });
  }

  // Event Management
  _emit(eventType, data) {
    if (this.callbacks[eventType]) {
      this.callbacks[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${eventType} callback:`, error);
        }
      });
    }
  }

  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    } else {
      console.warn(`❓ Unknown event type: ${event}`);
    }
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  // Utility Methods
  isInGame() {
    return this.gameId !== null && this.isConnected;
  }

  getGameId() {
    return this.gameId;
  }

  getPlayerColor() {
    return this.playerColor;
  }

  getPlayerId() {
    return this.playerId;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      gameId: this.gameId,
      playerColor: this.playerColor,
      playerId: this.playerId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Health Check
  ping() {
    return this.send('ping', { timestamp: Date.now() });
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;