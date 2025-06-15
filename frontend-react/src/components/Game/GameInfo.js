// components/Game/GameInfo.js
import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Chess } from 'chess.js';

const GameInfo = () => {
  const { fen, history, moveCount, playerColor, capturedPieces } = useSelector(state => state.game);
  
  // Create Chess instance to get current game state
  const game = new Chess(fen);
  const currentPlayer = game.turn() === 'w' ? 'לבן' : 'שחור';
  const isInCheck = game.inCheck();
  
  // Get piece values for material count
  const pieceValues = {
    'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9,
    'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9
  };
  
  const calculateMaterial = (pieces) => {
    return pieces.reduce((total, piece) => total + (pieceValues[piece] || 0), 0);
  };
  
  const whiteMaterial = calculateMaterial(capturedPieces.black); // White captured black pieces
  const blackMaterial = calculateMaterial(capturedPieces.white); // Black captured white pieces
  const materialDifference = whiteMaterial - blackMaterial;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 מצב המשחק
      </h3>
      
      <div className="space-y-3">
        {/* Current Turn */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">תור של:</span>
          <div className="flex items-center">
            <span className={`font-medium ${game.turn() === 'w' ? 'text-gray-800' : 'text-gray-600'}`}>
              {currentPlayer}
            </span>
            {isInCheck && (
              <span className="ml-2 text-red-600 text-xs font-bold">
                ⚠️ שח!
              </span>
            )}
          </div>
        </div>
        
        {/* Move Count */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">מספר מהלכים:</span>
          <span className="font-medium">{moveCount}</span>
        </div>
        
        {/* Player Color */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">אתה משחק:</span>
          <span className="font-medium capitalize">
            {playerColor === 'white' ? '⚪ לבן' : '⚫ שחור'}
          </span>
        </div>
        
        {/* Material Balance */}
        {(capturedPieces.white.length > 0 || capturedPieces.black.length > 0) && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">יתרון חומרי:</h4>
            
            {/* White's captures */}
            {capturedPieces.black.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-1">לבן תפס:</div>
                <div className="flex flex-wrap gap-1">
                  {capturedPieces.black.map((piece, index) => (
                    <span key={index} className="text-sm">
                      {{'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'}[piece]}
                    </span>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">
                    (+{whiteMaterial})
                  </span>
                </div>
              </div>
            )}
            
            {/* Black's captures */}
            {capturedPieces.white.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-1">שחור תפס:</div>
                <div className="flex flex-wrap gap-1">
                  {capturedPieces.white.map((piece, index) => (
                    <span key={index} className="text-sm">
                      {{'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'}[piece]}
                    </span>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">
                    (+{blackMaterial})
                  </span>
                </div>
              </div>
            )}
            
            {/* Material difference */}
            {materialDifference !== 0 && (
              <div className="text-xs text-center">
                <span className={materialDifference > 0 ? 'text-green-600' : 'text-red-600'}>
                  {materialDifference > 0 ? '⚪ לבן מוביל' : '⚫ שחור מוביל'} ב-{Math.abs(materialDifference)} נקודות
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Last Move */}
        {history.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">מהלך אחרון:</h4>
            <div className="text-sm text-gray-600 font-mono">
              {history[history.length - 1].san}
            </div>
          </div>
        )}
        
        {/* Game Status */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">סטטוס:</h4>
          <div className="text-sm">
            {game.isGameOver() ? (
              <span className="text-red-600 font-medium">המשחק הסתיים</span>
            ) : isInCheck ? (
              <span className="text-orange-600 font-medium">שח ל{currentPlayer}</span>
            ) : (
              <span className="text-green-600 font-medium">המשחק פעיל</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GameInfo;