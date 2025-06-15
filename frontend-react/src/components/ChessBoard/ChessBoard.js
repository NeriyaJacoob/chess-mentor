// src/components/ChessBoard/ChessBoard.js
import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeMove, selectSquare } from '../../store/slices/gameSlice';
import { motion } from 'framer-motion';
import ChessSquare from './ChessSquare';
import ChessPiece from './ChessPiece';

const ChessBoard = () => {
  const dispatch = useDispatch();
  const { fen, selectedSquare, legalMoves, lastMove, playerColor } = useSelector(state => state.game);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);

  // Parse FEN to get board position
  const parseFen = useCallback((fen) => {
    const fenParts = fen.split(' ');
    const boardPart = fenParts[0];
    const rows = boardPart.split('/');
    const board = [];

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
          // It's a number of empty squares
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
      board.push(boardRow);
    });

    return board;
  }, []);

  const board = parseFen(fen);

  const handleSquareClick = useCallback((square) => {
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
  }, [dispatch, selectedSquare, legalMoves, board, playerColor]);

  const handleDragStart = useCallback((e, piece, square) => {
    setDraggedPiece(piece);
    setDraggedFrom(square);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null);
    setDraggedFrom(null);
  }, []);

  const handleDrop = useCallback((e, targetSquare) => {
    e.preventDefault();
    
    if (draggedFrom && targetSquare !== draggedFrom) {
      if (legalMoves.includes(targetSquare)) {
        dispatch(makeMove({ from: draggedFrom, to: targetSquare }));
      }
    }
    
    handleDragEnd();
  }, [dispatch, draggedFrom, legalMoves, handleDragEnd]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const isSquareHighlighted = useCallback((square) => {
    return selectedSquare === square || 
           legalMoves.includes(square) || 
           (lastMove && (lastMove.from === square || lastMove.to === square));
  }, [selectedSquare, legalMoves, lastMove]);

  const getSquareHighlightType = useCallback((square) => {
    if (selectedSquare === square) return 'selected';
    if (lastMove && (lastMove.from === square || lastMove.to === square)) return 'lastMove';
    if (legalMoves.includes(square)) {
      const piece = board.flat().find(sq => sq.square === square)?.piece;
      return piece ? 'capture' : 'legalMove';
    }
    return 'none';
  }, [selectedSquare, legalMoves, lastMove, board]);

  // Flip board if playing as black
  const displayBoard = playerColor === 'black' ? [...board].reverse().map(row => [...row].reverse()) : board;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="chess-board-container"
    >
      <div className="relative">
        {/* Board coordinates */}
        <div className="absolute -left-6 top-0 h-full flex flex-col justify-around text-xs font-medium text-gray-600">
          {(playerColor === 'white' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8']).map(rank => (
            <div key={rank} className="h-12 flex items-center">
              {rank}
            </div>
          ))}
        </div>
        
        <div className="absolute -bottom-6 left-0 w-full flex justify-around text-xs font-medium text-gray-600">
          {(playerColor === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']).map(file => (
            <div key={file} className="w-12 text-center">
              {file}
            </div>
          ))}
        </div>

        {/* Chess board */}
        <div className="grid grid-cols-8 gap-0 border-4 border-amber-800 shadow-2xl bg-amber-900 p-2 rounded-lg">
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
                  onClick={() => handleSquareClick(square.square)}
                  onDrop={(e) => handleDrop(e, square.square)}
                  onDragOver={handleDragOver}
                >
                  {square.piece && (
                    <ChessPiece
                      piece={square.piece}
                      square={square.square}
                      isDragged={draggedFrom === square.square}
                      onDragStart={(e) => handleDragStart(e, square.piece, square.square)}
                      onDragEnd={handleDragEnd}
                    />
                  )}
                </ChessSquare>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChessBoard;