/**
 * ChessMentor WebSocket Chess server
 * Manages realtime multiplayer and AI games
 */
// backend-nodejs/chess-server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Chess } = require('chess.js');
const { spawn } = require('child_process');


class ChessServer {
  constructor(port = 5001) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    this.port = port;
    
    // Game storage
    this.games = new Map(); // gameId -> gameData
    this.players = new Map(); // socketId -> playerData
    this.waitingQueue = []; // players waiting for match
    
    this.setupMiddleware();
    this.setupSocketHandlers();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        activeGames: this.games.size,
        connectedPlayers: this.players.size 
      });
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Player connected: ${socket.id}`);
      
      // Player joins
      socket.on('join', (playerData) => {
        this.players.set(socket.id, {
          id: socket.id,
          name: playerData.name || 'Anonymous',
          elo: playerData.elo || 1200,
          sessionId: playerData.sessionId,
          isInGame: false
        });
        
        socket.emit('connected', { 
          playerId: socket.id,
          message: 'Connected to ChessMentor server' 
        });
      });

      // Find game (matchmaking)
      socket.on('find-game', (gameMode) => {
        const player = this.players.get(socket.id);
        if (!player || player.isInGame) return;

        if (gameMode === 'ai') {
          this.startAIGame(socket, player);
        } else {
          this.findMultiplayerGame(socket, player);
        }
      });

      // Make move
      socket.on('make-move', (data) => {
        this.handleMove(socket, data);
      });

      // Chat message
      socket.on('chat-message', (data) => {
        this.handleChatMessage(socket, data);
      });

      // Resignation
      socket.on('resign', () => {
        this.handleResignation(socket);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // Initialize a game against the Stockfish AI
  // Steps:
  // 1. Create a new Chess.js board instance
  // 2. Store a Game object with player on white and the AI on black
  // 3. Join the player to a Socket.IO room and emit the start event
  startAIGame(socket, player) {
    const gameId = this.generateGameId();
    const game = new Chess();
    
    const gameData = {
      id: gameId,
      type: 'ai',
      board: game,
      players: {
        white: player,
        black: { id: 'ai', name: 'ChessMentor AI', elo: 1500 }
      },
      currentTurn: 'white',
      startTime: Date.now(),
      history: [],
      status: 'active'
    };

    this.games.set(gameId, gameData);
    player.isInGame = true;
    player.gameId = gameId;
    
    socket.join(gameId);
    socket.emit('game-start', {
      gameId,
      color: 'white',
      opponent: gameData.players.black,
      fen: game.fen()
    });
  }

  // Match players of similar rating for multiplayer
  findMultiplayerGame(socket, player) {
    // Simple matchmaking by ELO range
    const eloDiff = 200;
    const opponent = this.waitingQueue.find(p => 
      Math.abs(p.elo - player.elo) <= eloDiff
    );

    if (opponent) {
      // Remove from queue
      this.waitingQueue = this.waitingQueue.filter(p => p.id !== opponent.id);
      
      // Start game
      this.startMultiplayerGame(socket, player, opponent);
    } else {
      // Add to queue
      this.waitingQueue.push(player);
      socket.emit('searching', { message: 'Looking for opponent...' });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.waitingQueue.includes(player)) {
          this.waitingQueue = this.waitingQueue.filter(p => p.id !== player.id);
          socket.emit('search-timeout', { message: 'No opponent found. Try AI mode?' });
        }
      }, 30000);
    }
  }

  // Initialize a game between two human players
  startMultiplayerGame(socket, player1, player2) {
    const gameId = this.generateGameId();
    const game = new Chess();
    
    // Random colors
    const isPlayer1White = Math.random() > 0.5;
    
    const gameData = {
      id: gameId,
      type: 'multiplayer',
      board: game,
      players: {
        white: isPlayer1White ? player1 : player2,
        black: isPlayer1White ? player2 : player1
      },
      currentTurn: 'white',
      startTime: Date.now(),
      history: [],
      status: 'active',
      chat: []
    };

    this.games.set(gameId, gameData);
    
    // Update player status
    [player1, player2].forEach(p => {
      p.isInGame = true;
      p.gameId = gameId;
    });

    // Join room and notify
    const player1Socket = this.io.sockets.sockets.get(player1.id);
    const player2Socket = this.io.sockets.sockets.get(player2.id);
    
    [player1Socket, player2Socket].forEach(s => s?.join(gameId));
    
    player1Socket?.emit('game-start', {
      gameId,
      color: isPlayer1White ? 'white' : 'black',
      opponent: player2,
      fen: game.fen()
    });
    
    player2Socket?.emit('game-start', {
      gameId,
      color: isPlayer1White ? 'black' : 'white',
      opponent: player1,
      fen: game.fen()
    });
  }

  // Validate and broadcast player move
  // Steps:
  // 1. Ensure player is in an active game and it's their turn
  // 2. Use chess.js to attempt the move
  // 3. Broadcast successful moves to all clients in the game
  // 4. If playing vs AI, let Stockfish respond
  handleMove(socket, data) {
    const player = this.players.get(socket.id);
    if (!player?.isInGame) return;

    const game = this.games.get(player.gameId);
    if (!game || game.status !== 'active') return;

    const playerColor = game.players.white.id === socket.id ? 'white' : 'black';
    if (game.currentTurn !== playerColor) return;

    // Validate and make move
    try {
      const move = game.board.move(data.move);
      if (!move) return;

      game.history.push(move);
      game.currentTurn = game.currentTurn === 'white' ? 'black' : 'white';

      // Broadcast move to room
      this.io.to(player.gameId).emit('move-made', {
        move: move,
        fen: game.board.fen(),
        currentTurn: game.currentTurn
      });

      // Check game over
      if (game.board.isGameOver()) {
        this.endGame(player.gameId, this.getGameResult(game.board));
      }
      
      // AI response if needed
      if (game.type === 'ai' && game.currentTurn === 'black') {
        setTimeout(() => this.makeAIMove(player.gameId), 500);
      }

    } catch (error) {
      socket.emit('invalid-move', { error: 'Invalid move' });
    }
  }

  // Let Stockfish engine play a move
  // (simplified placeholder implementation)
  makeAIMove(gameId) {
    const stockfish = spawn('path/to/stockfish.exe');
    stockfish.stdin.write(`position fen ${game.board.fen()}\n`);
    stockfish.stdin.write('go depth 10\n');
    // TODO: parse engine output and push move to board
  }

  // Relay chat messages between players
  handleChatMessage(socket, data) {
    const player = this.players.get(socket.id);
    if (!player?.isInGame) return;

    const game = this.games.get(player.gameId);
    if (!game || game.type !== 'multiplayer') return;

    const message = {
      player: player.name,
      message: data.message,
      timestamp: Date.now()
    };

    game.chat.push(message);
    this.io.to(player.gameId).emit('chat-message', message);
  }

  // Resign the current game and declare winner
  handleResignation(socket) {
    const player = this.players.get(socket.id);
    if (!player?.isInGame) return;

    const playerColor = this.getPlayerColor(player.gameId, socket.id);
    const winner = playerColor === 'white' ? 'black' : 'white';
    
    this.endGame(player.gameId, `${winner} wins by resignation`);
  }

  // Cleanup after player disconnects
  handleDisconnect(socket) {
    const player = this.players.get(socket.id);
    if (!player) return;

    console.log(`🔌 Player disconnected: ${socket.id}`);

    // Remove from waiting queue
    this.waitingQueue = this.waitingQueue.filter(p => p.id !== socket.id);

    // Handle game disconnection
    if (player.isInGame) {
      const game = this.games.get(player.gameId);
      if (game && game.type === 'multiplayer') {
        // Notify opponent and pause game
        this.io.to(player.gameId).emit('opponent-disconnected', {
          message: 'Opponent disconnected. Game paused.'
        });
        
        // End game after timeout
        setTimeout(() => {
          if (this.games.has(player.gameId)) {
            const playerColor = this.getPlayerColor(player.gameId, socket.id);
            const winner = playerColor === 'white' ? 'black' : 'white';
            this.endGame(player.gameId, `${winner} wins by abandonment`);
          }
        }, 30000);
      }
    }

    this.players.delete(socket.id);
  }

  // Finalize game and notify players
  endGame(gameId, result) {
    const game = this.games.get(gameId);
    if (!game) return;

    game.status = 'finished';
    game.result = result;
    game.endTime = Date.now();

    // Update player status
    Object.values(game.players).forEach(player => {
      if (player.id !== 'ai') {
        const p = this.players.get(player.id);
        if (p) {
          p.isInGame = false;
          delete p.gameId;
        }
      }
    });

    // Notify players
    this.io.to(gameId).emit('game-end', {
      result: result,
      pgn: game.board.pgn()
    });

    // Clean up after delay
    setTimeout(() => {
      this.games.delete(gameId);
    }, 60000);
  }

  // Translate board state to human-readable result
  getGameResult(board) {
    if (board.isCheckmate()) {
      return board.turn() === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
    }
    if (board.isDraw()) {
      if (board.isStalemate()) return 'Draw by stalemate';
      if (board.isInsufficientMaterial()) return 'Draw by insufficient material';
      if (board.isThreefoldRepetition()) return 'Draw by repetition';
      return 'Draw';
    }
    return 'Game over';
  }

  // Determine a player's color by id
  getPlayerColor(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game) return null;
    return game.players.white.id === playerId ? 'white' : 'black';
  }

  // Generate a short random game identifier
  generateGameId() {
    return 'game_' + Math.random().toString(36).substring(2, 15);
  }

  // Begin listening for socket connections
  start() {
    this.server.listen(this.port, () => {
      console.log(`🚀 Chess Server running on port ${this.port}`);
      console.log(`🎮 WebSocket endpoint: ws://localhost:${this.port}`);
    });
  }
}

// Start server
const chessServer = new ChessServer(5001);
chessServer.start();

module.exports = ChessServer;
