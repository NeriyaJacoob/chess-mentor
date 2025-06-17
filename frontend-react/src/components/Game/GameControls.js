// src/components/Game/GameControls.js
// Buttons for controlling the game flow
import React from 'react';
import { motion } from 'framer-motion';

const GameControls = ({ onNewGame, onUndoMove, onFlipBoard, canUndo }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🎮 בקרי משחק
      </h3>
      
      <div className="space-y-3">
        <button
          onClick={onNewGame}
          className="w-full btn-primary"
        >
          🆕 משחק חדש
        </button>
        
        <button
          onClick={onUndoMove}
          disabled={!canUndo}
          className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↩️ בטל מהלך
        </button>
        
        <button
          onClick={onFlipBoard}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          🔄 הפוך לוח
        </button>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">מקשי קיצור:</h4>
        <div className="text-xs text-gray-500 space-y-1">
          <div>• <kbd className="bg-gray-100 px-1 rounded">Ctrl+Z</kbd> - בטל מהלך</div>
          <div>• <kbd className="bg-gray-100 px-1 rounded">Ctrl+N</kbd> - משחק חדש</div>
          <div>• <kbd className="bg-gray-100 px-1 rounded">Ctrl+F</kbd> - הפוך לוח</div>
        </div>
      </div>
    </motion.div>
  );
};

export default GameControls;