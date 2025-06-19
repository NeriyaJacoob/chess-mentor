// frontend-react/src/services/chessSocketService.js - FIXED FOR STOCKFISH
// WebSocket service for real Stockfish chess engine

class ChessSocketService {
  constructor() {
    this.socket = null;
    this.gameId = null;
    this.playerColor = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.callbacks = {
      onConnected: null,
      onGameStart: null,
      onMoveMade: null,
      onGameEnd: null,
      onError: null,
      onOpponentDisconnected: null,
      onSearching: null,
      onAILevelChanged: null,
      onPositionUpdate: null
    };
  }

  // Connect to Python WebSocket server
  connect(playerData = {}) {
    return new Promise((resolve, reject) => {
      try {
        // בדיקה אם כבר מחובר
        if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
          console.log('🔗 Already connected to server');
          resolve(this);
          return;
        }

        console.log('🔗 Connecting to chess server...');
        this.socket = new WebSocket('ws://localhost:5001/ws');
        
        this.socket.onopen = () => {
          console.log('✅ Connected to chess server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // שליחת הודעת join
          this.send('join', {
            name: playerData.name || 'Player',
            elo: playerData.elo || 1200
          });
          
          resolve(this);
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('🔌 Disconnected from chess server');
          this.isConnected = false;
          this.gameId = null;
          this.playerColor = null;

          // ניסיון התחברות מחדש אוטומטי
          if (this.reconnectAttempts < this.maxReconnectAttempts && !event.wasClean) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
              this.connect(playerData);
            }, 2000 * this.reconnectAttempts);
          }
        };

        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

        // Timeout for connection
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

  // Handle incoming messages from server
  handleMessage(message) {
    const { type, data } = message;
    console.log('📨 Received:', type, data);

    switch (type) {
      case 'connected':
        console.log('✅ Joined server:', data.message);
        if (this.callbacks.onConnected) {
          this.callbacks.onConnected(data);
        }
        break;

      case 'game_start':
        this.gameId = data.game_id;
        this.playerColor = data.color;
        console.log(`🎮 Game started: ${this.gameId} as ${this.playerColor}`);
        console.log(`🤖 VS: ${data.opponent.name} (ELO: ${data.opponent.elo})`);
        if (this.callbacks.onGameStart) {
          this.callbacks.onGameStart(data);
        }
        break;

      case 'move_made':
        console.log(`♟️ Move: ${data.move} (${data.san}) by ${data.player}`);
        if (this.callbacks.onMoveMade) {
          this.callbacks.onMoveMade(data);
        }
        break;

      case 'game_end':
        console.log('🏁 Game ended:', data.result);
        this.gameId = null;
        this.playerColor = null;
        if (this.callbacks.onGameEnd) {
          this.callbacks.onGameEnd(data);
        }
        break;

      case 'error':
        console.error('❌ Server error:', data.message);
        if (this.callbacks.onError) {
          this.callbacks.onError(data);
        }
        break;

      case 'ai_level_changed':
        console.log(`🎯 AI level changed: ${data.ai_level} (ELO: ${data.elo})`);
        if (this.callbacks.onAILevelChanged) {
          this.callbacks.onAILevelChanged(data);
        }
        break;

      case 'position_update':
        console.log('📋 Position updated');
        if (this.callbacks.onPositionUpdate) {
          this.callbacks.onPositionUpdate(data);
        }
        break;

      case 'searching':
        console.log('🔍 Searching for opponent...');
        if (this.callbacks.onSearching) {
          this.callbacks.onSearching(data);
        }
        break;

      case 'opponent_disconnected':
        console.log('🔌 Opponent disconnected');
        if (this.callbacks.onOpponentDisconnected) {
          this.callbacks.onOpponentDisconnected(data);
        }
        break;

      default:
        console.log('❓ Unknown message type:', type);
    }
  }

  // Send message to server
  send(action, data = {}) {
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('❌ Not connected to server');
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

  // Game actions for Stockfish
  findGame(aiLevel = 5) {
    console.log(`🤖 Starting game against AI Level ${aiLevel}`);
    return this.send('find_game', { 
      mode: 'ai',
      ai_level: aiLevel
    });
  }

  newGame(aiLevel = 5) {
    console.log(`🆕 Starting new game against AI Level ${aiLevel}`);
    return this.send('new_game', { 
      ai_level: aiLevel
    });
  }

  makeMove(move) {
    if (typeof move === 'object' && move.from && move.to) {
      // Convert chess.js format to UCI format
      const uciMove = move.from + move.to + (move.promotion || '');
      console.log(`♟️ Making move: ${uciMove}`);
      return this.send('make_move', { move: uciMove });
    } else {
      // Already in UCI format
      console.log(`♟️ Making move: ${move}`);
      return this.send('make_move', { move });
    }
  }

  setAILevel(level) {
    console.log(`🎯 Setting AI level to: ${level}`);
    return this.send('set_ai_level', { level });
  }

  getPosition() {
    return this.send('get_position');
  }

  resign() {
    console.log('🏳️ Resigning game');
    return this.send('resign');
  }

  // Event handlers
  onConnected(callback) {
    this.callbacks.onConnected = callback;
    return this;
  }

  onGameStart(callback) {
    this.callbacks.onGameStart = callback;
    return this;
  }

  onMoveMade(callback) {
    this.callbacks.onMoveMade = callback;
    return this;
  }

  onGameEnd(callback) {
    this.callbacks.onGameEnd = callback;
    return this;
  }

  onError(callback) {
    this.callbacks.onError = callback;
    return this;
  }

  onAILevelChanged(callback) {
    this.callbacks.onAILevelChanged = callback;
    return this;
  }

  onPositionUpdate(callback) {
    this.callbacks.onPositionUpdate = callback;
    return this;
  }

  onOpponentDisconnected(callback) {
    this.callbacks.onOpponentDisconnected = callback;
    return this;
  }

  onSearching(callback) {
    this.callbacks.onSearching = callback;
    return this;
  }

  // Utility methods
  isInGame() {
    return this.gameId !== null;
  }

  getGameId() {
    return this.gameId;
  }

  getPlayerColor() {
    return this.playerColor;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isInGame: this.isInGame(),
      gameId: this.gameId,
      playerColor: this.playerColor,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.gameId = null;
    this.playerColor = null;
    this.reconnectAttempts = 0;
    console.log('🔌 Manually disconnected from server');
  }

  // Test connection
  async testConnection() {
    try {
      await this.connect({ name: 'TestPlayer', elo: 1200 });
      console.log('✅ Connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const chessSocketService = new ChessSocketService();
export default chessSocketService;