// frontend-react/src/services/chessSocketService.js

class ChessSocketService {
  constructor() {
    this.socket = null;
    this.gameId = null;
    this.playerColor = null;
    this.isConnected = false;
    this.callbacks = {
      onConnected: null,
      onGameStart: null,
      onMoveMade: null,
      onGameEnd: null,
      onError: null,
      onMoveAnalysis: null,
      onOpponentDisconnected: null,
      onSearching: null
    };
  }

  connect(playerData = {}) {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket('ws://localhost:5001/ws');
        
        this.socket.onopen = () => {
          console.log('🔗 Connected to chess server');
          this.isConnected = true;
          
          // Join the server
          this.send('join', {
            name: playerData.name || 'Player',
            elo: playerData.elo || 1200
          });
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse message:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('🔌 Disconnected from chess server');
          this.isConnected = false;
          this.gameId = null;
          this.playerColor = null;
        };

        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

        // Resolve when connected
        setTimeout(() => {
          if (this.isConnected) {
            resolve(this);
          } else {
            reject(new Error('Connection timeout'));
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

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
        if (this.callbacks.onGameStart) {
          this.callbacks.onGameStart(data);
        }
        break;

      case 'move_made':
        console.log('♟️ Move made:', data.move);
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

      case 'move_analysis':
        console.log('🧠 Move analysis:', data);
        if (this.callbacks.onMoveAnalysis) {
          this.callbacks.onMoveAnalysis(data);
        }
        break;

      case 'opponent_disconnected':
        console.log('🔌 Opponent disconnected');
        if (this.callbacks.onOpponentDisconnected) {
          this.callbacks.onOpponentDisconnected(data);
        }
        break;

      case 'searching':
        console.log('🔍 Searching for opponent...');
        if (this.callbacks.onSearching) {
          this.callbacks.onSearching(data);
        }
        break;

      case 'search_timeout':
        console.log('⏰ Search timeout');
        if (this.callbacks.onError) {
          this.callbacks.onError({ message: 'No opponent found' });
        }
        break;

      default:
        console.log('❓ Unknown message type:', type);
    }
  }

  send(action, data = {}) {
    if (!this.isConnected || !this.socket) {
      console.error('❌ Not connected to server');
      return false;
    }

    try {
      const message = {
        action,
        data
      };
      this.socket.send(JSON.stringify(message));
      console.log('📤 Sent:', action, data);
      return true;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      return false;
    }
  }

  // Game actions
  findGame(mode = 'ai') {
    return this.send('find_game', { mode });
  }

  makeMove(move) {
    return this.send('make_move', { move });
  }

  analyzeMove(move) {
    return this.send('analyze_move', { move });
  }

  getPosition() {
    return this.send('get_position');
  }

  resign() {
    return this.send('resign');
  }

  // Event handlers
  onConnected(callback) {
    this.callbacks.onConnected = callback;
  }

  onGameStart(callback) {
    this.callbacks.onGameStart = callback;
  }

  onMoveMade(callback) {
    this.callbacks.onMoveMade = callback;
  }

  onGameEnd(callback) {
    this.callbacks.onGameEnd = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  onMoveAnalysis(callback) {
    this.callbacks.onMoveAnalysis = callback;
  }

  onOpponentDisconnected(callback) {
    this.callbacks.onOpponentDisconnected = callback;
  }

  onSearching(callback) {
    this.callbacks.onSearching = callback;
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

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.gameId = null;
    this.playerColor = null;
  }
}

// Export singleton instance
const chessSocketService = new ChessSocketService();
export default chessSocketService;