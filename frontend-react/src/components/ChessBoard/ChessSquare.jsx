// frontend-react/src/components/ChessBoard/ChessSquare.jsx
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

  // ✅ מטפל חזק ב-onClick
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 ChessSquare clicked:', square, { interactive, onClick: !!onClick });
    
    if (interactive && onClick) {
      onClick();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (interactive && onDrop) {
      onDrop(e);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    
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
      className="chess-square relative"
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
        transition: { duration: 0.05 }
      } : {}}
      data-square={square}
      data-interactive={interactive}
    >
      {/* Highlight overlay */}
      {isHighlighted && (
        <div className={getHighlightStyles()}></div>
      )}
      
      {/* Content (piece) */}
      <div className="relative z-20 pointer-events-none">
        {children}
      </div>
      
      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 left-0 text-xs text-white/50 pointer-events-none z-30">
          {square}
        </div>
      )}
    </motion.div>
  );
};

export default ChessSquare;