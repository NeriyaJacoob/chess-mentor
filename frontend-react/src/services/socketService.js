import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(playerData) {
    this.socket = io('http://localhost:5001');
    this.socket.emit('join', playerData);
    return this.socket;
  }

  findGame(mode) {
    this.socket?.emit('find-game', mode);
  }

  makeMove(move) {
    this.socket?.emit('make-move', { move });
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export default new SocketService();