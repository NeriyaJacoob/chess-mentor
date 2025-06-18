// src/components/ChessBoard/ChessPiece.jsx - גרסה מאוחדת
// Display a chess piece with drag animations
import React, { useState } from 'react';
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
  layoutId,
  interactive = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isWhite = piece === piece.toUpperCase();
  const color = isWhite ? 'white' : 'black';
  const pieceName = piece.toLowerCase();

  // Unicode chess pieces (fallback)
  const unicodeSymbols = {
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟', // Black
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙'  // White
  };

  // SVG Components for built-in pieces
  const SVGPieces = {
    'K': ({ size, fill = "#FFFFFF", stroke = "#000000" }) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 5L10 25H30L20 5Z" fill={fill} stroke={stroke} strokeWidth="2"/>
        <path d="M10 25H30L25 35H15L10 25Z" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="18" y="2" width="4" height="10" rx="2" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="15" y="5" width="10" height="4" rx="2" fill={fill} stroke={stroke} strokeWidth="2"/>
      </svg>
    ),
    'Q': ({ size, fill = "#FFFFFF", stroke = "#000000" }) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 5L10 25H30L20 5Z" fill={fill} stroke={stroke} strokeWidth="2"/>
        <path d="M10 25H30L25 35H15L10 25Z" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill={fill} stroke={stroke} strokeWidth="2"/>
        <circle cx="10" cy="25" r="3" fill={fill} stroke={stroke} strokeWidth="1.5"/>
        <circle cx="20" cy="5" r="3" fill={fill} stroke={stroke} strokeWidth="1.5"/>
        <circle cx="30" cy="25" r="3" fill={fill} stroke={stroke} strokeWidth="1.5"/>
        <circle cx="15" cy="15" r="3" fill={fill} stroke={stroke} strokeWidth="1.5"/>
        <circle cx="25" cy="15" r="3" fill={fill} stroke={stroke} strokeWidth="1.5"/>
      </svg>
    ),
    'R': ({ size, fill = "#FFFFFF", stroke = "#000000" }) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M10 10H14V5H26V10H30L30 35H10L10 10Z" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="10" y="5" width="4" height="5" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="18" y="5" width="4" height="5" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="26" y="5" width="4" height="5" fill={fill} stroke={stroke} strokeWidth="2"/>
      </svg>
    ),
    'B': ({ size, fill = "#FFFFFF", stroke = "#000000" }) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 5L15 25H25L20 5Z" fill={fill} stroke={stroke} strokeWidth="2"/>
        <path d="M10 25H30L25 35H15L10 25Z" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill={fill} stroke={stroke} strokeWidth="2"/>
        <circle cx="20" cy="7" r="2" fill={stroke}/>
      </svg>
    ),
    'N': ({ size, fill = "#FFFFFF", stroke = "#000000" }) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M15 35H25L20 25L25 15H30V10H20C17.2386 10 15 12.2386 15 15V25L10 35Z" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill={fill} stroke={stroke} strokeWidth="2"/>
        <ellipse cx="25" cy="12" rx="7" ry="5" fill={fill} stroke={stroke} strokeWidth="2"/>
        <circle cx="27" cy="10" r="1.5" fill={stroke}/>
      </svg>
    ),
    'P': ({ size, fill = "#FFFFFF", stroke = "#000000" }) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="12" r="6" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="16" y="18" width="8" height="12" fill={fill} stroke={stroke} strokeWidth="2"/>
        <path d="M10 30H30L25 35H15L10 30Z" fill={fill} stroke={stroke} strokeWidth="2"/>
        <rect x="12" y="35" width="16" height="3" rx="1.5" fill={fill} stroke={stroke} strokeWidth="2"/>
      </svg>
    )
  };

  // Generate SVG for both colors
  const getSVGPiece = () => {
    const PieceComponent = SVGPieces[piece.toUpperCase()];
    if (!PieceComponent) return null;

    const fill = isWhite ? "#FFFFFF" : "#2D3748";
    const stroke = isWhite ? "#2D3748" : "#FFFFFF";
    
    return <PieceComponent size={size} fill={fill} stroke={stroke} />;
  };

  // Generate image path for PNG pieces
  const getImagePath = () => {
    const pieceMapping = {
      'K': 'wK', 'Q': 'wQ', 'R': 'wR', 'B': 'wB', 'N': 'wN', 'P': 'wP',
      'k': 'bK', 'q': 'bQ', 'r': 'bR', 'b': 'bB', 'n': 'bN', 'p': 'bP'
    };
    
    return `/assets/images/pieces/${style}/${color}/${pieceMapping[piece]}.png`;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

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
      cursor: interactive ? (isDragged ? 'grabbing' : 'grab') : 'default',
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
    hover: interactive ? {
      scale: 1.1,
      rotate: [0, -5, 5, 0],
      transition: {
        scale: { duration: 0.2 },
        rotate: { 
          duration: 0.6,
          ease: "easeInOut"
        }
      }
    } : {},
    tap: interactive ? {
      scale: 0.95,
      transition: { duration: 0.1 }
    } : {},
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
    switch (style) {
      case 'png':
      case 'classic':
        return !imageError ? (
          <motion.img
            src={getImagePath()}
            alt={`${color} ${pieceName}`}
            width={size}
            height={size}
            onError={handleImageError}
            onLoad={handleImageLoad}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            draggable={false}
            style={{
              filter: isDragged ? 'brightness(1.3) drop-shadow(4px 4px 12px rgba(0,0,0,0.8))' : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.4))'
            }}
          />
        ) : (
          // Fallback to Unicode if image fails
          <span style={getPieceStyles()}>
            {unicodeSymbols[piece]}
          </span>
        );
        
      case 'svg':
        return getSVGPiece();
        
      case 'unicode':
      default:
        return (
          <span style={getPieceStyles()}>
            {unicodeSymbols[piece]}
          </span>
        );
    }
  };

  return (
    <motion.div
      className={`chess-piece relative z-20 ${interactive ? 'cursor-grab' : 'cursor-default'}`}
      draggable={interactive}
      onDragStart={interactive ? onDragStart : undefined}
      onDragEnd={interactive ? onDragEnd : undefined}
      variants={pieceVariants}
      initial="initial"
      animate={isDragged ? "drag" : "animate"}
      exit="exit"
      whileHover={interactive ? "hover" : undefined}
      whileTap={interactive ? "tap" : undefined}
      layoutId={layoutId}
      transition={{ duration: animationDuration }}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {renderPiece()}

      {/* Loading indicator */}
      {(style === 'png' || style === 'classic') && !isLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Piece value indicator (for learning mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {pieceName === 'p' ? '1' :
           pieceName === 'n' || pieceName === 'b' ? '3' :
           pieceName === 'r' ? '5' :
           pieceName === 'q' ? '9' : '∞'}
        </div>
      )}

      {/* Special piece glow effects */}
      {(pieceName === 'q' || pieceName === 'k') && interactive && (
        <motion.div
          className={`absolute inset-0 rounded-full ${
            pieceName === 'k' 
              ? 'bg-yellow-400/20' 
              : 'bg-purple-400/20'
          } blur-sm pointer-events-none`}
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