// src/components/ChessBoard/ChessSquare.js
import React from 'react';
import { motion } from 'framer-motion';

const ChessSquare = ({ 
  square, 
  isLight, 
  isHighlighted, 
  highlightType, 
  onClick, 
  onDrop, 
  onDragOver, 
  children 
}) => {
  const getSquareClasses = () => {
    let classes = 'relative w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 ';
    
    // Base color
    if (isLight) {
      classes += 'bg-amber-100 ';
    } else {
      classes += 'bg-amber-700 ';
    }
    
    // Hover effect
    classes += 'hover:brightness-110 ';
    
    return classes;
  };

  const getHighlightClasses = () => {
    switch (highlightType) {
      case 'selected':
        return 'ring-4 ring-blue-400 ring-opacity-70';
      case 'lastMove':
        return 'ring-2 ring-yellow-400 ring-opacity-50';
      case 'legalMove':
        return 'legal-move';
      case 'capture':
        return 'legal-move capture';
      default:
        return '';
    }
  };

  return (
    <motion.div
      className={`${getSquareClasses()} ${getHighlightClasses()}`}
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Square highlight overlay */}
      {isHighlighted && highlightType === 'selected' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-blue-400 bg-opacity-30 pointer-events-none"
        />
      )}
      
      {isHighlighted && highlightType === 'lastMove' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-yellow-400 bg-opacity-30 pointer-events-none"
        />
      )}

      {children}
    </motion.div>
  );
};

export default ChessSquare;