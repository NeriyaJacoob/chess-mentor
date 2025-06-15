// src/components/ChessBoard/ChessPiece.jsx
import React from 'react';
import { motion } from 'framer-motion';

const ChessPiece = ({ 
  piece, 
  square, 
  isDragged, 
  size = 48,
  onDragStart, 
  onDragEnd,
  animationDuration = 0.3,
  layoutId 
}) => {
  // Unicode chess pieces with better symbols
  const pieceSymbols = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙', // White pieces
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'  // Black pieces
  };

  const isWhite = piece === piece.toUpperCase();

  const getPieceStyles = () => {
    const baseSize = Math.min(size * 0.9, 48);
    
    return {
      fontSize: `${baseSize}px`,
      lineHeight: '1',
      textShadow: isWhite 
        ? '1px 1px 3px rgba(0,0,0,0.8), -1px -1px 3px rgba(0,0,0,0.8), 1px -1px 3px rgba(0,0,0,0.8), -1px 1px 3px rgba(0,0,0,0.8)'
        : '1px 1px 3px rgba(255,255,255,0.4), 0 0 10px rgba(255,255,255,0.2)',
      filter: isDragged 
        ? 'brightness(1.3) drop-shadow(4px 4px 12px rgba(0,0,0,0.8))' 
        : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.4))',
      cursor: 'grab',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none'
    };
  };

  const pieceVariants = {
    initial: { 
      scale: 0.5, 
      opacity: 0,
      rotate: -180 
    },
    animate: { 
      scale: 1, 
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: animationDuration
      }
    },
    exit: { 
      scale: 0.5, 
      opacity: 0,
      rotate: 180,
      transition: {
        duration: animationDuration * 0.5
      }
    },
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, 0],
      transition: {
        scale: { duration: 0.2 },
        rotate: { 
          duration: 0.6,
          ease: "easeInOut"
        }
      }
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 }
    },
    drag: {
      scale: 1.2,
      zIndex: 1000,
      opacity: 0.9,
      rotate: [0, 5, -5, 0],
      transition: {
        scale: { duration: 0.2 },
        rotate: {
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    }
  };

  return (
    <motion.div
      className={`
        chess-piece relative z-20
        ${isWhite ? 'text-white' : 'text-gray-900'}
        ${isDragged ? 'cursor-grabbing' : 'cursor-grab'}
      `}
      style={getPieceStyles()}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      variants={pieceVariants}
      initial="initial"
      animate={isDragged ? "drag" : "animate"}
      exit="exit"
      whileHover="hover"
      whileTap="tap"
      layoutId={layoutId}
      transition={{ duration: animationDuration }}
    >
      {/* Piece Symbol */}
      <motion.span
        className="block"
        style={{ 
          fontFamily: 'serif',
          fontWeight: 'bold'
        }}
      >
        {pieceSymbols[piece]}
      </motion.span>

      {/* Glow Effect for Special Pieces */}
      {(piece.toLowerCase() === 'q' || piece.toLowerCase() === 'k') && (
        <motion.div
          className={`absolute inset-0 rounded-full ${
            piece.toLowerCase() === 'k' 
              ? 'bg-yellow-400/20' 
              : 'bg-purple-400/20'
          } blur-sm`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Piece Value Indicator (for learning mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
          {piece.toLowerCase() === 'p' ? '1' :
           piece.toLowerCase() === 'n' || piece.toLowerCase() === 'b' ? '3' :
           piece.toLowerCase() === 'r' ? '5' :
           piece.toLowerCase() === 'q' ? '9' : '∞'}
        </div>
      )}
    </motion.div>
  );
};

export default ChessPiece;