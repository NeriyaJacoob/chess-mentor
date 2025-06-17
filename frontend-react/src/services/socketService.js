import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.gameId = null;
  }

  connect(playerData) {
    this.socket = io('http://localhost:5001');
    
    this.socket.on('connect', () => {
      console.log('🔗 Connected to chess server');
      this.socket.emit('join', playerData);
    });

    this.socket.on('connected', (data) => {
      console.log('✅ Joined chess server:', data.message);
    });

    return this.socket;
  }

  findGame(mode = 'ai') {
    if (this.socket) {
      console.log('🔍 Looking for game...');
      this.socket.emit('find-game', mode);
    }
  }

  makeMove(move) {
    if (this.socket && this.gameId) {
      this.socket.emit('make-move', { move });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();