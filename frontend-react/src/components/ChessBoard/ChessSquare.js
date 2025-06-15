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
    
    // Base color using Tailwind classes
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
        return 'ring-4 ring-blue-400 ring-opacity-70 bg-blue-200 bg-opacity-50';
      case 'lastMove':
        return 'ring-2 ring-yellow-400 ring-opacity-70 bg-yellow-200 bg-opacity-30';
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
      {children}
    </motion.div>
  );
};

export default ChessSquare;