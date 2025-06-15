// src/components/ChessBoard/ChessPiece.js
import React from 'react';
import { motion } from 'framer-motion';

const ChessPiece = ({ piece, square, isDragged, onDragStart, onDragEnd }) => {
  // Unicode chess pieces
  const pieceSymbols = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };

  const isWhite = piece === piece.toUpperCase();

  return (
    <motion.div
      className={`
        chess-piece select-none text-4xl leading-none
        ${isDragged ? 'dragging' : ''}
        ${isWhite ? 'text-white drop-shadow-lg' : 'text-gray-800'}
        hover:scale-110 transition-transform duration-150
      `}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileDrag={{ scale: 1.2, zIndex: 1000 }}
      style={{
        textShadow: isWhite 
          ? '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 1px -1px 2px rgba(0,0,0,0.8), -1px 1px 2px rgba(0,0,0,0.8)'
          : '1px 1px 2px rgba(255,255,255,0.3)',
        filter: isDragged ? 'brightness(1.2)' : 'none'
      }}
    >
      {pieceSymbols[piece]}
    </motion.div>
  );
};

export default ChessPiece;