// src/store/slices/gameSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  history: [],
  selectedSquare: null,
  legalMoves: [],
  isGameOver: false,
  gameResult: null,
  playerColor: 'white',
  moveCount: 0,
  capturedPieces: {
    white: [],
    black: []
  },
  lastMove: null,
  isThinking: false
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    makeMove: (state, action) => {
      const { from, to, promotion } = action.payload;
      
      try {
        // Import Chess.js here to avoid serialization issues
        const { Chess } = require('chess.js');
        const game = new Chess(state.fen);
        
        // Attempt the move
        const move = game.move({ from, to, promotion });
        
        if (move) {
          // Update state
          state.fen = game.fen();
          state.history.push(move);
          state.moveCount++;
          state.lastMove = { from, to };
          state.selectedSquare = null;
          state.legalMoves = [];
          
          // Check for captured piece
          if (move.captured) {
            const capturedColor = move.color === 'w' ? 'black' : 'white';
            state.capturedPieces[capturedColor].push(move.captured);
          }
          
          // Check game over conditions
          if (game.isGameOver()) {
            state.isGameOver = true;
            if (game.isCheckmate()) {
              state.gameResult = `${game.turn() === 'w' ? 'Black' : 'White'} wins by checkmate`;
            } else if (game.isDraw()) {
              state.gameResult = 'Draw';
            }
          }
        }
      } catch (error) {
        console.error('Invalid move:', error);
      }
    },
    
    selectSquare: (state, action) => {
      const square = action.payload;
      const { Chess } = require('chess.js');
      const game = new Chess(state.fen);
      
      if (state.selectedSquare === square) {
        // Deselect if clicking the same square
        state.selectedSquare = null;
        state.legalMoves = [];
      } else {
        state.selectedSquare = square;
        
        // Get legal moves for this square
        const moves = game.moves({ square, verbose: true });
        state.legalMoves = moves.map(move => move.to);
      }
    },
    
    newGame: (state) => {
      const { Chess } = require('chess.js');
      const newGame = new Chess();
      return {
        ...initialState,
        fen: newGame.fen()
      };
    },
    
    loadGame: (state, action) => {
      const { fen, history } = action.payload;
      try {
        const { Chess } = require('chess.js');
        const game = new Chess(fen);
        state.fen = fen;
        state.history = history || [];
        state.selectedSquare = null;
        state.legalMoves = [];
        state.isGameOver = game.isGameOver();
        
        if (state.isGameOver) {
          if (game.isCheckmate()) {
            state.gameResult = `${game.turn() === 'w' ? 'Black' : 'White'} wins by checkmate`;
          } else if (game.isDraw()) {
            state.gameResult = 'Draw';
          }
        }
      } catch (error) {
        console.error('Failed to load game:', error);
      }
    },
    
    undoMove: (state) => {
      if (state.history.length > 0) {
        const { Chess } = require('chess.js');
        const game = new Chess();
        
        // Replay all moves except the last one
        const newHistory = state.history.slice(0, -1);
        newHistory.forEach(move => {
          game.move(move);
        });
        
        state.fen = game.fen();
        state.history = newHistory;
        state.moveCount = Math.max(0, state.moveCount - 1);
        state.selectedSquare = null;
        state.legalMoves = [];
        state.isGameOver = false;
        state.gameResult = null;
        state.lastMove = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
        
        // Recalculate captured pieces
        state.capturedPieces = { white: [], black: [] };
        newHistory.forEach(move => {
          if (move.captured) {
            const capturedColor = move.color === 'w' ? 'black' : 'white';
            state.capturedPieces[capturedColor].push(move.captured);
          }
        });
      }
    },
    
    setPlayerColor: (state, action) => {
      state.playerColor = action.payload;
    },
    
    setThinking: (state, action) => {
      state.isThinking = action.payload;
    }
  },
});

export const {
  makeMove,
  selectSquare,
  newGame,
  loadGame,
  undoMove,
  setPlayerColor,
  setThinking
} = gameSlice.actions;

export default gameSlice.reducer;