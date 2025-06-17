// src/components/ChessBoard/ChessBoard.jsx - גרסה מאוחדת
import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeMove, selectSquare } from '../../store/slices/gameSlice';
import { motion, AnimatePresence } from 'framer-motion';
import ChessSquare from './ChessSquare';
import ChessPiece from './ChessPiece';

const ChessBoard = ({ 
  size = 480, 
  showCoordinates = true, 
  animationSpeed = 'normal',
  interactive = true 
}) => {
  const dispatch = useDispatch();
  const { fen, selectedSquare, legalMoves, lastMove, playerColor, pieceStyle, boardTheme } = useSelector(state => state.game);
  
  // Local state for drag & drop
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);
  const [hoveredSquare, setHoveredSquare] = useState(null);

  // Parse FEN to board representation
  const board = useMemo(() => {
    const fenParts = fen.split(' ');
    const boardPart = fenParts[0];
    const rows = boardPart.split('/');
    const parsedBoard = [];

    rows.forEach((row, rowIndex) => {
      const boardRow = [];
      let colIndex = 0;
      
      for (let char of row) {
        if (isNaN(char)) {
          // It's a piece
          boardRow.push({
            piece: char,
            square: String.fromCharCode(97 + colIndex) + (8 - rowIndex)
          });
          colIndex++;
        } else {
          // Empty squares
          const emptySquares = parseInt(char);
          for (let i = 0; i < emptySquares; i++) {
            boardRow.push({
              piece: null,
              square: String.fromCharCode(97 + colIndex) + (8 - rowIndex)
            });
            colIndex++;
          }
        }
      }
      parsedBoard.push(boardRow);
    });

    return parsedBoard;
  }, [fen]);

  // Display board (flip if playing as black)
  const displayBoard = useMemo(() => {
    return playerColor === 'black' 
      ? [...board].reverse().map(row => [...row].reverse()) 
      : board;
  }, [board, playerColor]);

  const squareSize = size / 8;

  // Event handlers
  const handleSquareClick = useCallback((square) => {
    if (!interactive) return;
    
    const piece = board.flat().find(sq => sq.square === square)?.piece;
    
    if (selectedSquare && legalMoves.includes(square)) {
      // Make move
      dispatch(makeMove({ from: selectedSquare, to: square }));
    } else if (piece) {
      // Select piece if it belongs to current player
      const isWhitePiece = piece === piece.toUpperCase();
      const isPlayerTurn = (playerColor === 'white' && isWhitePiece) || 
                          (playerColor === 'black' && !isWhitePiece);
      
      if (isPlayerTurn) {
        dispatch(selectSquare(square));
      }
    } else {
      // Deselect
      dispatch(selectSquare(null));
    }
  }, [dispatch, selectedSquare, legalMoves, board, playerColor, interactive]);

  const handleDragStart = useCallback((e, piece, square) => {
    if (!interactive) return;
    
    setDraggedPiece(piece);
    setDraggedFrom(square);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  }, [interactive]);

  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null);
    setDraggedFrom(null);
  }, []);

  const handleDrop = useCallback((e, targetSquare) => {
    e.preventDefault();
    
    if (draggedFrom && targetSquare !== draggedFrom && legalMoves.includes(targetSquare)) {
      dispatch(makeMove({ from: draggedFrom, to: targetSquare }));
    }
    
    handleDragEnd();
  }, [dispatch, draggedFrom, legalMoves, handleDragEnd]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Helper functions
  const isSquareHighlighted = useCallback((square) => {
    return selectedSquare === square || 
           legalMoves.includes(square) || 
           (lastMove && (lastMove.from === square || lastMove.to === square)) ||
           hoveredSquare === square;
  }, [selectedSquare, legalMoves, lastMove, hoveredSquare]);

  const getSquareHighlightType = useCallback((square) => {
    if (selectedSquare === square) return 'selected';
    if (lastMove && (lastMove.from === square || lastMove.to === square)) return 'lastMove';
    if (legalMoves.includes(square)) {
      const piece = board.flat().find(sq => sq.square === square)?.piece;
      return piece ? 'capture' : 'legalMove';
    }
    if (hoveredSquare === square) return 'hover';
    return 'none';
  }, [selectedSquare, legalMoves, lastMove, board, hoveredSquare]);

  const getAnimationDuration = () => {
    switch (animationSpeed) {
      case 'fast': return 0.15;
      case 'slow': return 0.5;
      default: return 0.3;
    }
  };

  // Board theme colors
  const getBoardColors = () => {
    const themes = {
      classic: { light: '#F0D9B5', dark: '#B58863' },
      blue: { light: '#DEE3E6', dark: '#8CA2AD' },
      green: { light: '#FFFFDD', dark: '#86A666' },
      purple: { light: '#F3E5F5', dark: '#7B1FA2' }
    };
    return themes[boardTheme] || themes.classic;
  };

  const boardColors = getBoardColors();
  const coordinateFiles = playerColor === 'white' 
    ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] 
    : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  
  const coordinateRanks = playerColor === 'white' 
    ? ['8', '7', '6', '5', '4', '3', '2', '1'] 
    : ['1', '2', '3', '4', '5', '6', '7', '8'];

  return (
    <motion.div
      className="chess-board-container relative select-none"
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: getAnimationDuration() }}
    >
      {/* Board Border and Shadow */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg shadow-2xl"
        style={{ padding: '20px' }}
      >
        {/* Coordinate Labels */}
        {showCoordinates && (
          <>
            {/* Rank numbers (left side) */}
            <div className="absolute left-2 top-5 bottom-5 flex flex-col justify-around">
              {coordinateRanks.map(rank => (
                <div key={rank} className="text-amber-200 font-bold text-sm flex items-center h-12">
                  {rank}
                </div>
              ))}
            </div>
            
            {/* File letters (bottom) */}
            <div className="absolute bottom-2 left-5 right-5 flex justify-around">
              {coordinateFiles.map(file => (
                <div key={file} className="text-amber-200 font-bold text-sm flex items-center justify-center w-12">
                  {file}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Chess Board Grid */}
        <div 
          className="relative bg-amber-100 rounded-md overflow-hidden shadow-inner"
          style={{ 
            width: size - 40, 
            height: size - 40,
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)'
          }}
        >
          {displayBoard.map((row, rowIndex) =>
            row.map((square, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const highlightType = getSquareHighlightType(square.square);
              
              return (
                <ChessSquare
                  key={square.square}
                  square={square.square}
                  isLight={isLight}
                  isHighlighted={isSquareHighlighted(square.square)}
                  highlightType={highlightType}
                  size={squareSize - 1}
                  colors={boardColors}
                  onClick={() => handleSquareClick(square.square)}
                  onDrop={(e) => handleDrop(e, square.square)}
                  onDragOver={handleDragOver}
                  onMouseEnter={() => setHoveredSquare(square.square)}
                  onMouseLeave={() => setHoveredSquare(null)}
                  animationDuration={getAnimationDuration()}
                  interactive={interactive}
                >
                  <AnimatePresence mode="wait">
                    {square.piece && (
                      <ChessPiece
                        key={`${square.square}-${square.piece}`}
                        piece={square.piece}
                        square={square.square}
                        isDragged={draggedFrom === square.square}
                        size={squareSize * 0.8}
                        style={pieceStyle}
                        onDragStart={(e) => handleDragStart(e, square.piece, square.square)}
                        onDragEnd={handleDragEnd}
                        animationDuration={getAnimationDuration()}
                        layoutId={`piece-${square.piece}-${square.square}`}
                        interactive={interactive}
                      />
                    )}
                  </AnimatePresence>
                </ChessSquare>
              );
            })
          )}
        </div>

        {/* Glow effect for selected piece */}
        {selectedSquare && (
          <motion.div
            className="absolute bg-blue-400 rounded-full opacity-20 blur-xl pointer-events-none"
            style={{
              width: squareSize * 1.5,
              height: squareSize * 1.5,
              left: '50%',
              top: '50%',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded backdrop-blur-sm">
          <div>FEN: {fen.split(' ')[0].substring(0, 20)}...</div>
          <div>Selected: {selectedSquare || 'None'}</div>
          <div>Legal Moves: {legalMoves.length}</div>
          <div>Style: {pieceStyle}</div>
          <div>Theme: {boardTheme}</div>
        </div>
      )}
    </motion.div>
  );
};

export default ChessBoard;