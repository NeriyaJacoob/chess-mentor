// frontend-react/src/components/Layout/ModernTopBar.jsx
// Responsive navigation bar for the layout
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Settings, 
  User, 
  Trophy,
  Gamepad2,
  Brain,
  ChevronDown,
  Activity,
  Zap
} from 'lucide-react';

const ModernTopBar = () => {
  const navigate = useNavigate();
  const [searchFocus, setSearchFocus] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('chessmentor-theme') || 'light';
  });
  
  const { isAuthenticated } = useSelector(state => state.auth);
  const { moveCount, isGameOver } = useSelector(state => state.game);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('chessmentor-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const getGameStatus = () => {
    if (isGameOver) return { status: 'completed', color: 'text-gray-500 bg-gray-100', label: 'Game Over' };
    if (moveCount > 0) return { status: 'active', color: 'text-green-600 bg-green-100', label: `Move ${moveCount}` };
    return { status: 'ready', color: 'text-blue-600 bg-blue-100', label: 'Ready to Play' };
  };

  const gameStatus = getGameStatus();

  return (
    <header className={`sticky top-0 z-40 border-b px-6 py-3 transition-all duration-200 ${
      theme === 'dark' 
        ? 'bg-gray-900/95 backdrop-blur-sm border-gray-700' 
        : 'bg-white/95 backdrop-blur-sm border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        {/* Left Section - Search */}
        <div className="flex-1 max-w-md">
          <div className={`relative transition-all duration-300 ${searchFocus ? 'scale-105' : 'scale-100'}`}>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className={`h-4 w-4 transition-colors ${
                searchFocus ? 'text-blue-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
              }`} />
            </div>
            <input
              type="text"
              placeholder="Search games, positions, players..."
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-gray-50/50 border-gray-300 text-gray-900 placeholder-gray-500'
              } ${
                searchFocus 
                  ? 'border-blue-300 shadow-lg ring-4 ring-blue-100/50 scale-105' 
                  : 'hover:border-gray-400 hover:shadow-md'
              } focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500`}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
            />
          </div>
        </div>

        {/* Center Section - Game Status & Quick Stats */}
        <div className="hidden lg:flex items-center space-x-4 mx-8">
          {/* Game Status */}
          <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 ${
            gameStatus.color
          } ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${
              gameStatus.status === 'active' ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' :
              gameStatus.status === 'completed' ? 'bg-gray-400' : 'bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50'
            }`} />
            <Gamepad2 className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {gameStatus.label}
            </span>
          </div>

          {/* ELO Rating */}
          <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-700 text-yellow-300'
              : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-700'
          }`}>
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-semibold">1,247</span>
            <span className="text-xs opacity-75">ELO</span>
          </div>

          {/* AI Coach Status */}
          <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 ${
            isAuthenticated
              ? theme === 'dark'
                ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
              : theme === 'dark'
                ? 'bg-gray-800 border-gray-600'
                : 'bg-gray-100 border-gray-200'
          }`}>
            <Brain className={`h-4 w-4 ${
              isAuthenticated 
                ? 'text-green-600 animate-pulse' 
                : theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
            }`} />
            <span className={`text-sm font-semibold ${
              isAuthenticated 
                ? theme === 'dark' ? 'text-green-400' : 'text-green-700'
                : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {isAuthenticated ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Performance Indicator (Mobile) */}
          <div className="lg:hidden">
            <button className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}>
              <Activity className="h-5 w-5" />
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bell className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                2
              </div>
            </button>

            {/* Notifications Dropdown - נוסיף אחר כך */}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${
              theme === 'dark'
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-800'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
            }`}
          >
            <div className="relative">
              {theme === 'light' ? (
                <Moon className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
              ) : (
                <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
              )}
            </div>
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 hover:rotate-12 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className={`flex items-center space-x-2 p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200">
                <User className="h-4 w-4 text-white" />
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                showProfile ? 'rotate-180' : ''
              } ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
            </button>

            {/* Profile Dropdown - נוסיף אחר כך */}
          </div>
        </div>
      </div>

      {/* Click outside handler */}
      {(showNotifications || showProfile) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}
    </header>
  );
};

export default ModernTopBar;