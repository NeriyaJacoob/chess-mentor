// src/components/ChessBoard/ChessSquare.jsx - גרסה מאוחדת
// Single square on the chess board
import React from 'react';
import { motion } from 'framer-motion';

const ChessSquare = ({ 
  square, 
  isLight, 
  isHighlighted, 
  highlightType, 
  size = 60,
  colors = { light: '#F0D9B5', dark: '#B58863' },
  onClick, 
  onDrop, 
  onDragOver, 
  onMouseEnter,
  onMouseLeave,
  animationDuration = 0.3,
  interactive = true,
  children 
}) => {
  
  const getSquareStyles = () => {
    const baseColor = isLight ? colors.light : colors.dark;
    
    return {
      backgroundColor: baseColor,
      width: size,
      height: size,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'all 0.2s ease-out',
      userSelect: 'none'
    };
  };

  const getHighlightStyles = () => {
    const baseStyle = 'absolute inset-0 pointer-events-none z-10';
    
    switch (highlightType) {
      case 'selected':
        return `${baseStyle} bg-blue-400/40 ring-4 ring-blue-400/60 rounded-sm`;
      case 'lastMove':
        return `${baseStyle} bg-yellow-300/50 ring-2 ring-yellow-400/70 rounded-sm`;
      case 'legalMove':
        return `${baseStyle} chess-legal-move-dot`;
      case 'capture':
        return `${baseStyle} chess-capture-ring`;
      case 'hover':
        return `${baseStyle} bg-white/20 rounded-sm`;
      case 'check':
        return `${baseStyle} bg-red-400/60 ring-4 ring-red-400/80 rounded-sm animate-pulse`;
      default:
        return '';
    }
  };

  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  const handleDrop = (e) => {
    if (interactive && onDrop) {
      onDrop(e);
    }
  };

  const handleDragOver = (e) => {
    if (interactive && onDragOver) {
      onDragOver(e);
    }
  };

  const handleMouseEnter = () => {
    if (interactive && onMouseEnter) {
      onMouseEnter();
    }
  };

  const handleMouseLeave = () => {
    if (interactive && onMouseLeave) {
      onMouseLeave();
    }
  };

  return (
    <motion.div
      className="chess-square"
      style={getSquareStyles()}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={interactive ? { 
        scale: 1.02,
        transition: { duration: 0.1 }
      } : {}}
      whileTap={interactive ? { 
        scale: 0.98,
        transition: { duration: 0.1 }
      } : {}}
      layout
      transition={{ duration: animationDuration }}
    >
      {/* Highlight Overlay */}
      {isHighlighted && (
        <motion.div
          className={getHighlightStyles()}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Legal Move Dot */}
      {highlightType === 'legalMove' && (
        <motion.div
          className="absolute w-6 h-6 bg-green-500/60 rounded-full pointer-events-none z-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1], 
            opacity: [0, 0.8, 0.6] 
          }}
          transition={{ 
            duration: 0.4,
            times: [0, 0.6, 1],
            ease: "easeOut"
          }}
        />
      )}

      {/* Capture Ring */}
      {highlightType === 'capture' && (
        <motion.div
          className="absolute inset-2 border-4 border-red-500/70 rounded-full pointer-events-none z-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.1, 1], 
            opacity: [0, 0.9, 0.7] 
          }}
          transition={{ 
            duration: 0.4,
            times: [0, 0.6, 1],
            ease: "easeOut"
          }}
        />
      )}

      {/* Check Warning */}
      {highlightType === 'check' && (
        <motion.div
          className="absolute inset-0 bg-red-500/30 border-2 border-red-500 rounded-sm pointer-events-none z-20"
          animate={{ 
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Square Content (Chess Piece) */}
      <div className="relative z-30 w-full h-full flex items-center justify-center">
        {children}
      </div>

      {/* Square Coordinates (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 left-0 text-xs text-black/30 font-mono z-40 pointer-events-none">
          {square}
        </div>
      )}

      {/* Hover Effect */}
      {interactive && (
        <motion.div
          className="absolute inset-0 bg-white/10 rounded-sm opacity-0 pointer-events-none z-10"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
};

export default ChessSquare;