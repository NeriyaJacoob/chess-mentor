// src/components/Layout/Sidebar.js
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  RotateCcw, 
  RotateCw, 
  Square, 
  Clock, 
  Target,
  TrendingUp,
  Archive,
  Zap
} from 'lucide-react';
import { newGame, undoMove } from '../../store/slices/gameSlice';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { moveCount, playerColor, capturedPieces, history } = useSelector(state => state.game);

  const handleNewGame = () => dispatch(newGame());
  const handleUndoMove = () => dispatch(undoMove());

  const stats = [
    { label: 'Games Today', value: '3', icon: Target },
    { label: 'Win Rate', value: '67%', icon: TrendingUp },
    { label: 'Best Streak', value: '8', icon: Zap },
    { label: 'Total Games', value: '156', icon: Archive },
  ];

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Quick Stats */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-lg font-bold text-gray-900">{stat.value}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Controls */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Controls</h3>
        <div className="space-y-3">
          <button
            onClick={handleNewGame}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Square className="h-5 w-5" />
            <span className="font-medium">New Game</span>
          </button>
          
          <button
            onClick={handleUndoMove}
            disabled={moveCount === 0}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="font-medium">Undo Move</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <RotateCw className="h-5 w-5" />
            <span className="font-medium">Flip Board</span>
          </button>
        </div>
      </div>

      {/* Current Game Info */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Game</h3>
        
        <div className="space-y-4">
          {/* Move Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Moves</span>
            <span className="font-medium text-gray-900">{moveCount}</span>
          </div>
          
          {/* Player Color */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Playing as</span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                playerColor === 'white' ? 'bg-gray-100 border-2 border-gray-400' : 'bg-gray-800'
              }`}></div>
              <span className="font-medium text-gray-900 capitalize">{playerColor}</span>
            </div>
          </div>
          
          {/* Timer (placeholder) */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Timer</span>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">∞</span>
            </div>
          </div>
        </div>
      </div>

      {/* Captured Pieces */}
      {(capturedPieces.white.length > 0 || capturedPieces.black.length > 0) && (
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Captured</h3>
          
          {capturedPieces.white.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">White captured:</p>
              <div className="flex flex-wrap gap-1">
                {capturedPieces.white.map((piece, index) => (
                  <span key={index} className="text-lg">
                    {{'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕'}[piece]}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {capturedPieces.black.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Black captured:</p>
              <div className="flex flex-wrap gap-1">
                {capturedPieces.black.map((piece, index) => (
                  <span key={index} className="text-lg">
                    {{'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛'}[piece]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Move History */}
      {history.length > 0 && (
        <div className="flex-1 p-6 overflow-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Move History</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {history.map((move, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{Math.floor(index / 2) + 1}.</span>
                <span className="font-mono text-gray-900">{move.san}</span>
                {index % 2 === 0 && index + 1 < history.length && (
                  <span className="font-mono text-gray-900">{history[index + 1].san}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;