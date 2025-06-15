// src/components/Layout/Header.js
import React from 'react';
import { useSelector } from 'react-redux';
import { Crown, Settings, User, Trophy } from 'lucide-react';

const Header = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const { moveCount } = useSelector(state => state.game);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm h-16">
      <div className="max-w-full mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ChessMentor</h1>
                <span className="text-xs text-gray-500">Professional Chess Training</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Play
            </button>
            <button className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Learn
            </button>
            <button className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Puzzles
            </button>
            <button className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Analysis
            </button>
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {/* ELO Rating */}
            <div className="hidden sm:flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
              <Trophy className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">1200</span>
            </div>

            {/* Game Status */}
            {moveCount > 0 && (
              <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Move {moveCount}</span>
              </div>
            )}

            {/* GPT Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isAuthenticated 
                ? 'bg-green-50 text-green-700' 
                : 'bg-gray-50 text-gray-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isAuthenticated ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">
                {isAuthenticated ? 'GPT Connected' : 'GPT Offline'}
              </span>
            </div>

            {/* Settings */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
            </button>

            {/* Profile */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;