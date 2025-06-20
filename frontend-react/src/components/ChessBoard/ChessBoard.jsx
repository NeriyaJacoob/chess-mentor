// frontend-react/src/components/ChessBoard/ChessBoard.jsx - CLEAN VERSION
// מותאם לביצועים מהירים עם כלי שחמט שעובדים
import React, { useCallback, useMemo, memo, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { makeMove, selectSquare } from '../../store/slices/gameSlice';

// ✅ Try to import performance monitor, with fallback
let performanceMonitor = {
  trackClickResponse: () => {},
  trackRender: () => {},
  trackMoveProcessing: () => {}
};

try {
  const perfModule = require('../../utils/performanceMonitor');
  performanceMonitor = perfModule.default || performanceMonitor;
} catch (error) {
  console.log('📊 Performance monitoring not available');
}

// ✅ מיפוי כלי שחמט ישיר - פשוט ויעיל
const PIECE_SYMBOLS = {
  // White pieces (uppercase)
  'K': '♔', // White King
  'Q': '♕', // White Queen  
  'R': '♖', // White Rook
  'B': '♗', // White Bishop
  'N': '♘', // White Knight
  'P': '♙', // White Pawn
  
  // Black pieces (lowercase)
  'k': '♚', // Black King
  'q': '♛', // Black Queen
  'r': '♜', // Black Rook  
  'b': '♝', // Black Bishop
  'n': '♞', // Black Knight
  'p': '♟', // Black Pawn
};

// ✅ פונקציה פשוטה להמרת כלים
const getPieceDisplay = (piece, style = 'unicode') => {
  if (!piece) return '';
  
  // ✅ Debug מוגבל לכלים חשובים
  const isImportantPiece = ['K', 'k', 'Q', 'q'].includes(piece);
  if (isImportantPiece) {
    console.log(`🔄 getPieceDisplay: piece="${piece}", style="${style}"`);
  }
  
  if (style === 'unicode') {
    const symbol = PIECE_SYMBOLS[piece];
    if (isImportantPiece) {
      console.log(`🎯 Mapping: "${piece}" → "${symbol}" (exists: ${!!symbol})`);
    }
    return symbol || piece;
  } else {
    if (isImportantPiece) {
      console.log(`📝 Text mode: returning "${piece}"`);
    }
    return piece;
  }
};

// ✅ Test function עם console.log מפורש
const testPieceDisplay = () => {
  console.log('🧪 Testing piece display:');
  console.log('K (white king):', getPieceDisplay('K'));
  console.log('k (black king):', getPieceDisplay('k'));
  console.log('Q (white queen):', getPieceDisplay('Q'));
  console.log('q (black queen):', getPieceDisplay('q'));
  console.log('Available symbols:', PIECE_SYMBOLS);
  
  const allPieces = ['K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p'];
  allPieces.forEach(piece => {
    const symbol = getPieceDisplay(piece);
    console.log(`${piece} → ${symbol} (Code: ${symbol.charCodeAt(0)})`);
  });
};

// ✅ Make it global for debugging
if (typeof window !== 'undefined') {
  window.testChessPieces = testPieceDisplay;
  window.PIECE_SYMBOLS = PIECE_SYMBOLS;
  window.getPieceDisplay = getPieceDisplay;
}

// ✅ Square component פשוט ויעיל
const FastChessSquare = memo(({ 
  square, 
  piece, 
  isLight, 
  isSelected, 
  isLegalMove, 
  isLastMove, 
  isCapture,
  size,
  onClick,
  pieceStyle = 'unicode'
}) => {
  const handleClick = useCallback(() => {
    onClick(square);
  }, [square, onClick]);

  // ✅ חישוב מהיר של סגנון
  const squareStyle = useMemo(() => {
    const baseColor = isLight ? '#F0D9B5' : '#B58863';
    let backgroundColor = baseColor;
    let boxShadow = 'none';
    
    if (isSelected) {
      backgroundColor = '#FFD700';
      boxShadow = 'inset 0 0 0 3px #FF6B35';
    } else if (isLastMove) {
      backgroundColor = isLight ? '#FFE135' : '#DAA520';
    } else if (isLegalMove && isCapture) {
      boxShadow = 'inset 0 0 0 4px #FF4444';
    }
    
    return {
      backgroundColor,
      boxShadow,
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      userSelect: 'none',
      position: 'relative'
    };
  }, [isLight, isSelected, isLastMove, isLegalMove, isCapture, size]);

  // ✅ סגנון כלי פשוט ויעיל
  const pieceStyles = useMemo(() => {
    if (!piece) return {};
    
    return {
      fontSize: size * 0.7,
      fontWeight: 'normal',
      fontFamily: 'Arial, "Segoe UI Symbol", "Noto Color Emoji", sans-serif',
      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
      lineHeight: 1,
      pointerEvents: 'none',
      color: '#333'
    };
  }, [piece, size]);

  // ✅ Debug מוגבל לריבועים חשובים בלבד
  if (['e1', 'e8', 'd1', 'd8'].includes(square)) {
    console.log(`🧩 Square ${square}: piece="${piece}", symbol="${getPieceDisplay(piece, pieceStyle)}", style="${pieceStyle}"`);
  }

  return (
    <div 
      style={squareStyle}
      onClick={handleClick}
      data-square={square}
    >
      {/* ✅ כלי שחמט פשוטים */}
      {piece && (
        <span style={pieceStyles}>
          {(() => {
            const symbol = getPieceDisplay(piece, pieceStyle);
            // ✅ Debug log רק לריבועים מעניינים
            if (['e1', 'e8', 'd1', 'd8'].includes(square)) {
              console.log(`🎨 Rendering ${square}: "${piece}" → "${symbol}"`);
            }
            return symbol;
          })()}
        </span>
      )}
      
      {/* ✅ Legal move indicator */}
      {isLegalMove && !piece && (
        <div
          style={{
            position: 'absolute',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 255, 0, 0.6)',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
});

// ✅ Optimized board parsing
const parseFENToBoard = (fen) => {
  const squares = [];
  const fenBoard = fen.split(' ')[0];
  const rows = fenBoard.split('/');

  for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
    const row = rows[rowIndex];
    let colIndex = 0;
    
    for (const char of row) {
      if (isNaN(char)) {
        // It's a piece
        const square = String.fromCharCode(97 + colIndex) + (8 - rowIndex);
        squares.push({ square, piece: char });
        colIndex++;
      } else {
        // Empty squares
        const emptyCount = parseInt(char);
        for (let i = 0; i < emptyCount; i++) {
          const square = String.fromCharCode(97 + colIndex) + (8 - rowIndex);
          squares.push({ square, piece: null });
          colIndex++;
        }
      }
    }
  }

  return squares;
};

// ✅ Create piece lookup map for O(1) access
const createPieceMap = (squares) => {
  const map = {};
  squares.forEach(({ square, piece }) => {
    map[square] = piece;
  });
  return map;
};

const FastChessBoard = ({ 
  size = 480, 
  showCoordinates = true, 
  interactive = true,
  onMove = null,
  disabled = false,
  playerColor = 'white',
  pieceStyle = 'unicode'
}) => {
  const dispatch = useDispatch();
  
  // ✅ Test the piece display when component loads
  useEffect(() => {
    console.log('🚀 FastChessBoard loading with style:', pieceStyle);
    testPieceDisplay();
    console.log('Direct test: K should be ♔, got:', PIECE_SYMBOLS['K']);
  }, [pieceStyle]);
  
  // ✅ Optimized selector - only get what we need
  const gameState = useSelector(state => ({
    fen: state.game.fen,
    selectedSquare: state.game.selectedSquare,
    legalMoves: state.game.legalMoves,
    lastMove: state.game.lastMove
  }), shallowEqual);

  const { fen, selectedSquare, legalMoves, lastMove } = gameState;

  // ✅ Cached board parsing - only when FEN changes
  const boardSquares = useMemo(() => {
    console.time('⚡ Board parsing');
    console.log('🔍 Parsing FEN:', fen);
    
    const squares = parseFENToBoard(fen);
    console.log('🧩 Total squares parsed:', squares.length);
    console.log('🧩 Squares with pieces:', squares.filter(s => s.piece).length);
    console.log('🧩 First few squares:', squares.slice(0, 8));
    console.log('🧩 Sample piece conversion:', squares.find(s => s.piece === 'K')?.piece, '→', getPieceDisplay('K'));
    
    const result = playerColor === 'black' ? squares.reverse() : squares;
    console.timeEnd('⚡ Board parsing');
    return result;
  }, [fen, playerColor]);

  // ✅ Piece lookup map for O(1) access
  const pieceMap = useMemo(() => {
    return createPieceMap(boardSquares);
  }, [boardSquares]);

  // ✅ Pre-compute square info for faster rendering
  const squareInfo = useMemo(() => {
    const info = {};
    
    boardSquares.forEach(({ square }, index) => {
      const row = Math.floor(index / 8);
      const col = index % 8;
      const isLight = (row + col) % 2 === 0;
      
      info[square] = {
        isLight,
        isSelected: selectedSquare === square,
        isLegalMove: legalMoves.includes(square),
        isLastMove: lastMove && (lastMove.from === square || lastMove.to === square),
        isCapture: legalMoves.includes(square) && pieceMap[square] !== null
      };
    });
    
    return info;
  }, [boardSquares, selectedSquare, legalMoves, lastMove, pieceMap]);

  const squareSize = size / 8;

  // ✅ Optimized click handler
  const handleSquareClick = useCallback((square) => {
    const clickStartTime = performance.now();
    
    console.log('🎯 FAST Square clicked:', square);
    
    if (!interactive || disabled) {
      console.log('🚫 Interaction blocked');
      performanceMonitor.trackClickResponse(clickStartTime);
      return;
    }

    const piece = pieceMap[square];
    
    if (selectedSquare && legalMoves.includes(square)) {
      const move = { from: selectedSquare, to: square };
      console.log('⚡ FAST move:', move);
      
      if (onMove) {
        const moveStartTime = performance.now();
        onMove(move);
        performanceMonitor.trackClickResponse(clickStartTime);
        console.log(`⚡ Move executed in ${(performance.now() - moveStartTime).toFixed(1)}ms`);
        return;
      } else {
        dispatch(makeMove(move));
      }
    } else if (piece) {
      const isWhitePiece = piece === piece.toUpperCase();
      const isPlayerTurn = (playerColor === 'white' && isWhitePiece) || 
                          (playerColor === 'black' && !isWhitePiece);
      
      if (isPlayerTurn) {
        dispatch(selectSquare(square));
      }
    } else {
      dispatch(selectSquare(null));
    }
    
    performanceMonitor.trackClickResponse(clickStartTime);
  }, [interactive, disabled, pieceMap, selectedSquare, legalMoves, onMove, dispatch, playerColor]);

  // ✅ Render squares efficiently
  const renderSquares = useCallback(() => {
    const piecesCount = boardSquares.filter(s => s.piece).length;
    console.log(`🎨 Rendering ${boardSquares.length} squares (${piecesCount} with pieces) with style: ${pieceStyle}`);
    
    return boardSquares.map(({ square }) => {
      const info = squareInfo[square];
      const piece = pieceMap[square];
      
      return (
        <FastChessSquare
          key={square}
          square={square}
          piece={piece}
          isLight={info.isLight}
          isSelected={info.isSelected}
          isLegalMove={info.isLegalMove}
          isLastMove={info.isLastMove}
          isCapture={info.isCapture}
          size={squareSize}
          onClick={handleSquareClick}
          pieceStyle={pieceStyle}
        />
      );
    });
  }, [boardSquares, squareInfo, pieceMap, squareSize, handleSquareClick, pieceStyle]);

  console.log('🏁 FastChessBoard render - squares:', boardSquares.length, 'with pieces:', boardSquares.filter(s => s.piece).length, 'style:', pieceStyle);

  return (
    <div className="chess-board-container">
      {/* ✅ Simple grid without animations */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
          width: size,
          height: size,
          border: '2px solid #8B4513',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          fontFamily: 'Arial, "Segoe UI Symbol", "Noto Color Emoji", sans-serif'
        }}
      >
        {renderSquares()}
      </div>
      
      {/* ✅ Simple coordinates */}
      {showCoordinates && (
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', color: '#888' }}>
          {(playerColor === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']).map(file => (
            <span key={file} style={{ width: squareSize, textAlign: 'center', fontSize: '12px' }}>
              {file}
            </span>
          ))}
        </div>
      )}
      
      {/* ✅ Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '10px', 
          color: '#666',
          fontFamily: 'monospace'
        }}>
          Squares: {boardSquares.length} | Pieces: {boardSquares.filter(s => s.piece).length} | Style: {pieceStyle}
          <br />
          {/* ✅ בדיקת המרת כלים */}
          Test mapping: K→{getPieceDisplay('K', pieceStyle)} | k→{getPieceDisplay('k', pieceStyle)}
          <br />
          Sample pieces: {boardSquares.filter(s => s.piece).slice(0, 4).map(s => `${s.square}:${s.piece}`).join(', ')}
        </div>
      )}
    </div>
  );
};

// ✅ Memoize the entire component
export default memo(FastChessBoard);