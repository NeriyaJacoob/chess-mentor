// frontend-react/src/components/ChessBoard/ChessPieceImage.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ChessPieceImage = ({ 
  piece, 
  square, 
  isDragged, 
  size = 48,
  onDragStart, 
  onDragEnd,
  animationDuration = 0.3,
  layoutId,
  imageStyle = 'modern' // 'modern', 'classic', 'medieval'
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isWhite = piece === piece.toUpperCase();
  const color = isWhite ? 'white' : 'black';
  const pieceName = piece.toLowerCase();

  // Fallback Unicode symbols
  const pieceSymbols = {
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟', // Black
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙'  // White
  };

  // Generate image path
  const getImagePath = () => {
    const styles = {
      modern: `/assets/images/pieces/${imageStyle}/${color}/${pieceName}.svg`,
      classic: `/assets/images/pieces/${imageStyle}/${color}/${pieceName}.png`,
      medieval: `/assets/images/pieces/${imageStyle}/${color}/${pieceName}.svg`
    };
    return styles[imageStyle] || styles.modern;
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
      width: `${baseSize}px`,
      height: `${baseSize}px`,
      cursor: 'grab',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      filter: isDragged 
        ? 'brightness(1.2) drop-shadow(4px 4px 12px rgba(0,0,0,0.8))' 
        : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
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
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 }
    },
    drag: {
      scale: 1.2,
      zIndex: 1000,
      opacity: 0.9,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      className="chess-piece-container relative z-20"
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
      {/* Image with fallback */}
      {!imageError ? (
        <motion.img
          src={getImagePath()}
          alt={`${color} ${pieceName}`}
          style={getPieceStyles()}
          onError={handleImageError}
          onLoad={handleImageLoad}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          draggable={false}
        />
      ) : (
        // Fallback to Unicode symbol
        <motion.span
          className={`block text-center leading-none ${
            isWhite ? 'text-white' : 'text-gray-900'
          }`}
          style={{
            fontSize: `${size * 0.8}px`,
            fontFamily: 'serif',
            fontWeight: 'bold',
            textShadow: isWhite 
              ? '1px 1px 3px rgba(0,0,0,0.8), -1px -1px 3px rgba(0,0,0,0.8)'
              : '1px 1px 3px rgba(255,255,255,0.4)'
          }}
        >
          {pieceSymbols[piece]}
        </motion.span>
      )}

      {/* Loading indicator */}
      {!isLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Piece value indicator (for learning mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
          {pieceName === 'p' ? '1' :
           pieceName === 'n' || pieceName === 'b' ? '3' :
           pieceName === 'r' ? '5' :
           pieceName === 'q' ? '9' : '∞'}
        </div>
      )}

      {/* Special piece glow effects */}
      {(pieceName === 'q' || pieceName === 'k') && (
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

export default ChessPieceImage;