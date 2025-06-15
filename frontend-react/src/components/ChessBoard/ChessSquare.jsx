// src/components/ChessBoard/ChessSquare.jsx
import React from 'react';
import { motion } from 'framer-motion';

const ChessSquare = ({ 
  square, 
  isLight, 
  isHighlighted, 
  highlightType, 
  size = 60,
  onClick, 
  onDrop, 
  onDragOver, 
  onMouseEnter,
  onMouseLeave,
  animationDuration = 0.3,
  children 
}) => {
  const getSquareColors = () => {
    if (isLight) {
      return {
        base: 'bg-amber-100',
        hover: 'hover:bg-amber-200',
        active: 'active:bg-amber-300'
      };
    } else {
      return {
        base: 'bg-amber-700',
        hover: 'hover:bg-amber-600',
        active: 'active:bg-amber-800'
      };
    }
  };

  const getHighlightStyles = () => {
    const baseStyle = 'absolute inset-0 pointer-events-none';
    
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
      default:
        return '';
    }
  };

  const colors = getSquareColors();

  return (
    <motion.div
      className={`
        relative cursor-pointer transition-all select-none
        ${colors.base} ${colors.hover} ${colors.active}
        flex items-center justify-center
      `}
      style={{ 
        width: size, 
        height: size,
      }}
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.1 }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
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
          className="absolute w-6 h-6 bg-green-500/60 rounded-full pointer-events-none"
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
          className="absolute inset-2 border-4 border-red-500/70 rounded-full pointer-events-none"
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

      {/* Square Content (Chess Piece) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {children}
      </div>

      {/* Square Coordinates (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 left-0 text-xs text-black/30 font-mono">
          {square}
        </div>
      )}
    </motion.div>
  );
};

export default ChessSquare;

