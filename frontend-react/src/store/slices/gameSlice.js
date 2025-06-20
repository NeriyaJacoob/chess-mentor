// frontend-react/src/store/slices/gameSlice.js - PERFORMANCE OPTIMIZED
// Redux slice מותאם לביצועים עם מינימום re-renders
import { createSlice } from '@reduxjs/toolkit';

// ✅ Minimal initial state for performance
const initialState = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  history: [],
  isGameOver: false,
  gameResult: null,
  moveCount: 0,
  
  // ✅ UI settings separated for performance
  pieceStyle: 'classic',
  boardTheme: 'classic',
  
  // ✅ Cached data for performance
  _boardHash: null, // Hash of current position for quick comparison
  _legalMovesCache: [], // Cached legal moves
};

// ✅ Fast Chess.js import - only when needed
let Chess = null;
const getChessClass = () => {
  if (!Chess) {
    Chess = require('chess.js').Chess;
  }
  return Chess;
};

// ✅ Fast FEN validation
const isValidFEN = (fen) => {
  if (!fen || typeof fen !== 'string') return false;
  const parts = fen.split(' ');
  return parts.length >= 4; // Basic check
};

// ✅ Fast hash function for board positions
const hashPosition = (fen) => {
  if (!fen) return null;
  // Simple hash of the board part only (ignore clock)
  const boardPart = fen.split(' ')[0];
  let hash = 0;
  for (let i = 0; i < boardPart.length; i++) {
    const char = boardPart.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

// ✅ Fast legal moves calculation with caching
const calculateLegalMoves = (fen, square, currentHash, cachedMoves, cachedHash) => {
  // Use cache if position hasn't changed
  if (currentHash === cachedHash && square === null) {
    return cachedMoves;
  }
  
  try {
    const ChessClass = getChessClass();
    const game = new ChessClass(fen);
    
    if (!square) {
      return []; // No square selected
    }
    
    const moves = game.moves({ square, verbose: true });
    return moves.map(move => move.to);
  } catch (error) {
    console.error('❌ Legal moves calculation failed:', error);
    return [];
  }
};

// ✅ Performance optimized game slice
const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // ✅ Fast move execution
    makeMove: (state, action) => {
      const move = action.payload;
      
      try {
        const ChessClass = getChessClass();
        const game = new ChessClass(state.fen);
        
        // ✅ Fast move validation and execution
        const moveResult = game.move(move);
        
        if (moveResult) {
          // ✅ Update minimal state
          state.fen = game.fen();
          state.history.push(moveResult.san);
          state.moveCount += 1;
          state.lastMove = { from: moveResult.from, to: moveResult.to };
          state.selectedSquare = null;
          state.legalMoves = [];
          
          // ✅ Update cached data
          state._boardHash = hashPosition(state.fen);
          
          // ✅ Fast game over check
          if (game.isGameOver()) {
            state.isGameOver = true;
            if (game.isCheckmate()) {
              state.gameResult = `${game.turn() === 'w' ? 'Black' : 'White'} wins by checkmate`;
            } else if (game.isDraw()) {
              state.gameResult = 'Draw';
            }
          }
          
          console.log('⚡ Fast move executed:', moveResult.san);
        } else {
          console.warn('❌ Invalid move:', move);
        }
      } catch (error) {
        console.error('❌ Move execution failed:', error);
      }
    },
    
    // ✅ Fast square selection with cached legal moves
    selectSquare: (state, action) => {
      const square = action.payload;
      
      if (state.selectedSquare === square) {
        // ✅ Fast deselection
        state.selectedSquare = null;
        state.legalMoves = [];
        return;
      }
      
      state.selectedSquare = square;
      
      if (square) {
        // ✅ Calculate legal moves with caching
        const currentHash = hashPosition(state.fen);
        state.legalMoves = calculateLegalMoves(
          state.fen, 
          square, 
          currentHash, 
          state._legalMovesCache, 
          state._boardHash
        );
        
        // ✅ Update cache
        state._boardHash = currentHash;
        state._legalMovesCache = state.legalMoves;
      } else {
        state.legalMoves = [];
      }
    },
    
    // ✅ Fast new game
    newGame: (state) => {
      console.log('🚀 Starting new fast game');
      
      // ✅ Reset to initial position quickly
      Object.assign(state, {
        ...initialState,
        pieceStyle: state.pieceStyle, // Keep UI preferences
        boardTheme: state.boardTheme,
        _boardHash: hashPosition(initialState.fen)
      });
    },
    
    // ✅ Fast game loading
    loadGame: (state, action) => {
      const { fen, history } = action.payload;
      
      if (!isValidFEN(fen)) {
        console.error('❌ Invalid FEN provided');
        return;
      }
      
      try {
        const ChessClass = getChessClass();
        const game = new ChessClass(fen);
        
        // ✅ Fast state update
        state.fen = fen;
        state.history = history || [];
        state.selectedSquare = null;
        state.legalMoves = [];
        state.isGameOver = game.isGameOver();
        state._boardHash = hashPosition(fen);
        
        if (state.isGameOver) {
          if (game.isCheckmate()) {
            state.gameResult = `${game.turn() === 'w' ? 'Black' : 'White'} wins by checkmate`;
          } else if (game.isDraw()) {
            state.gameResult = 'Draw';
          }
        }
        
        console.log('⚡ Game loaded fast');
      } catch (error) {
        console.error('❌ Failed to load game:', error);
      }
    },
    
    // ✅ Fast undo
    undoMove: (state) => {
      if (state.history.length === 0) return;
      
      try {
        const ChessClass = getChessClass();
        const game = new ChessClass();
        
        // ✅ Fast replay without last move
        const newHistory = state.history.slice(0, -1);
        newHistory.forEach(move => {
          game.move(move);
        });
        
        // ✅ Quick state update
        state.fen = game.fen();
        state.history = newHistory;
        state.moveCount = Math.max(0, state.moveCount - 1);
        state.selectedSquare = null;
        state.legalMoves = [];
        state.isGameOver = false;
        state.gameResult = null;
        state._boardHash = hashPosition(state.fen);
        
        console.log('⚡ Fast undo completed');
      } catch (error) {
        console.error('❌ Undo failed:', error);
      }
    },
    
    // ✅ UI-only updates for performance
    updatePieceStyle: (state, action) => {
      state.pieceStyle = action.payload;
    },
    
    updateBoardTheme: (state, action) => {
      state.boardTheme = action.payload;
    },
    
    // ✅ Clear selection fast
    clearSelection: (state) => {
      state.selectedSquare = null;
      state.legalMoves = [];
    },
    
    // ✅ Performance debug action
    debugPerformance: (state) => {
      console.log('🔍 Game State Performance Debug:', {
        fen: state.fen.substring(0, 20) + '...',
        historyLength: state.history.length,
        selectedSquare: state.selectedSquare,
        legalMovesCount: state.legalMoves.length,
        boardHash: state._boardHash,
        cacheSize: state._legalMovesCache.length
      });
    }
  },
});

// ✅ Export actions
export const { 
  makeMove, 
  selectSquare, 
  newGame, 
  loadGame, 
  undoMove,
  updatePieceStyle,
  updateBoardTheme,
  clearSelection,
  debugPerformance
} = gameSlice.actions;

// ✅ Optimized selectors for performance
export const selectGameState = (state) => state.game;
export const selectBoardData = (state) => ({
  fen: state.game.fen,
  selectedSquare: state.game.selectedSquare,
  legalMoves: state.game.legalMoves,
  lastMove: state.game.lastMove
});
export const selectUIPreferences = (state) => ({
  pieceStyle: state.game.pieceStyle,
  boardTheme: state.game.boardTheme
});

export default gameSlice.reducer;