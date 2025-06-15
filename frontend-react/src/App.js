// src/App.js
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import ChessBoard from './components/ChessBoard/ChessBoard';
import OpenAIAuth from './components/Auth/OpenAIAuth';
import GameControls from './components/Game/GameControls';
import CoachChat from './components/Coach/CoachChat';
import GameInfo from './components/Game/GameInfo';
import { newGame, undoMove, setPlayerColor } from './store/slices/gameSlice';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { isGameOver, gameResult, moveCount } = useSelector(state => state.game);
  const [showCoach, setShowCoach] = useState(false);

  const handleNewGame = () => {
    dispatch(newGame());
  };

  const handleUndoMove = () => {
    dispatch(undoMove());
  };

  const handleFlipBoard = () => {
    const { playerColor } = store.getState().game;
    dispatch(setPlayerColor(playerColor === 'white' ? 'black' : 'white'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <motion.h1 
                className="text-2xl font-bold text-gray-900"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                ♟️ ChessMentor
              </motion.h1>
              <span className="ml-2 text-sm text-gray-500 bg-blue-100 px-2 py-1 rounded-full">
                v1.0 Beta
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCoach(!showCoach)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${isAuthenticated 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
                disabled={!isAuthenticated}
              >
                {showCoach ? '🎯 הסתר מאמן' : '🤖 הראה מאמן'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Auth & Game Info */}
          <div className="lg:col-span-3 space-y-6">
            <OpenAIAuth />
            <GameInfo />
            <GameControls
              onNewGame={handleNewGame}
              onUndoMove={handleUndoMove}
              onFlipBoard={handleFlipBoard}
              canUndo={moveCount > 0}
            />
          </div>

          {/* Center - Chess Board */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative">
              <ChessBoard />
              
              {/* Game Over Overlay */}
              {isGameOver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"
                >
                  <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      🏁 המשחק הסתיים
                    </h3>
                    <p className="text-gray-600 mb-4">{gameResult}</p>
                    <button
                      onClick={handleNewGame}
                      className="btn-primary w-full"
                    >
                      🎮 משחק חדש
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Coach Chat */}
          <div className="lg:col-span-3">
            {showCoach && isAuthenticated ? (
              <CoachChat />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    מאמן GPT
                  </h3>
                  <p className="text-sm">
                    {!isAuthenticated 
                      ? 'התחבר כדי להפעיל את המאמן החכם'
                      : 'לחץ על "הראה מאמן" כדי לפתוח את הצ\'אט'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              ChessMentor © 2024 | מופעל על ידי{' '}
              <span className="font-medium text-blue-600">OpenAI GPT</span> ו{' '}
              <span className="font-medium text-green-600">Chess.js</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;