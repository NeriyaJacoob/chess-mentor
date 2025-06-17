// src/components/ChessBoard/ChessPiece.jsx
import React from 'react';
import { motion } from 'framer-motion';

const ChessPiece = ({ 
  piece, 
  square, 
  isDragged, 
  size = 48,
  style = 'classic',
  onDragStart, 
  onDragEnd,
  animationDuration = 0.3,
  layoutId 
}) => {
  // Mapping for PNG files
  const pieceMapping = {
    'K': 'wK', 'Q': 'wQ', 'R': 'wR', 'B': 'wB', 'N': 'wN', 'P': 'wP',
    'k': 'bK', 'q': 'bQ', 'r': 'bR', 'b': 'bB', 'n': 'bN', 'p': 'bP'
  };

  // Unicode chess pieces
  const unicodeSymbols = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };

  // SVG Components
  const SVGPieces = {
    'K': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 5L10 25H30L20 5Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <path d="M10 25H30L25 35H15L10 25Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="18" y="2" width="4" height="10" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="15" y="5" width="10" height="4" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
      </svg>
    ),
    'Q': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 5L10 25H30L20 5Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <path d="M10 25H30L25 35H15L10 25Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <circle cx="10" cy="25" r="3" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5"/>
        <circle cx="20" cy="5" r="3" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5"/>
        <circle cx="30" cy="25" r="3" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5"/>
        <circle cx="15" cy="15" r="3" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5"/>
        <circle cx="25" cy="15" r="3" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5"/>
      </svg>
    ),
    'R': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M10 10H14V5H26V10H30L30 35H10L10 10Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="10" y="5" width="4" height="5" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="18" y="5" width="4" height="5" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="26" y="5" width="4" height="5" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
      </svg>
    ),
    'B': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 5L15 25H25L20 5Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <path d="M10 25H30L25 35H15L10 25Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <path d="M20 5L18 8L22 8L20 5Z" fill="#000000"/>
      </svg>
    ),
    'N': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M15 35H25L20 25L25 15H30V10H20C17.2386 10 15 12.2386 15 15V25L10 35Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <circle cx="20" cy="10" r="5" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
      </svg>
    ),
    'P': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 5C17.2386 5 15 7.23858 15 10V14H25V10C25 7.23858 22.7614 5 20 5Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="16" y="14" width="8" height="12" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <path d="M10 26H30L25 35H15L10 26Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
      </svg>
    ),
    'k': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 5L10 25H30L20 5Z" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <path d="M10 25H30L25 35H15L10 25Z" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="18" y="2" width="4" height="10" rx="2" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="15" y="5" width="10" height="4" rx="2" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
      </svg>
    ),
    'q': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 5L10 25H30L20 5Z" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <path d="M10 25H30L25 35H15L10 25Z" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <circle cx="10" cy="25" r="3" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5"/>
        <circle cx="20" cy="5" r="3" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5"/>
        <circle cx="30" cy="25" r="3" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5"/>
        <circle cx="15" cy="15" r="3" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5"/>
        <circle cx="25" cy="15" r="3" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5"/>
      </svg>
    ),
    'r': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M10 10H14V5H26V10H30L30 35H10L10 10Z" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="10" y="5" width="4" height="5" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="18" y="5" width="4" height="5" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="26" y="5" width="4" height="5" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
      </svg>
    ),
    'b': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 5L15 25H25L20 5Z" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <path d="M10 25H30L25 35H15L10 25Z" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <path d="M20 5L18 8L22 8L20 5Z" fill="#FFFFFF"/>
      </svg>
    ),
    'n': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M15 35H25L20 25L25 15H30V10H20C17.2386 10 15 12.2386 15 15V25L10 35Z" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <circle cx="20" cy="10" r="5" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
      </svg>
    ),
    'p': () => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 5C17.2386 5 15 7.23858 15 10V14H25V10C25 7.23858 22.7614 5 20 5Z" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="16" y="14" width="8" height="12" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <path d="M10 26H30L25 35H15L10 26Z" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill="#000000" stroke="#FFFFFF" strokeWidth="2"/>
      </svg>
    )
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

  const renderPiece = () => {
    if (style === 'classic') {
      const color = isWhite ? 'white' : 'black';
      return (
        <img 
          src={`/assets/images/pieces/classic/${color}/${pieceMapping[piece]}.png`}
          width={size} 
          height={size}
          alt={piece}
          style={{ 
            filter: isDragged ? 'brightness(1.3) drop-shadow(4px 4px 12px rgba(0,0,0,0.8))' : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.4))'
          }}
        />
      );
    } else if (style === 'svg') {
      const SVGComponent = SVGPieces[piece];
      return SVGComponent ? <SVGComponent /> : null;
    } else {
      // Unicode fallback
      return (
        <span style={getPieceStyles()}>
          {unicodeSymbols[piece]}
        </span>
      );
    }
  };

  return (
    <motion.div
      className={`
        chess-piece relative z-20
        ${isDragged ? 'cursor-grabbing' : 'cursor-grab'}
      `}
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
      {renderPiece()}

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
    </motion.div>
  );
};

export default ChessPiece;