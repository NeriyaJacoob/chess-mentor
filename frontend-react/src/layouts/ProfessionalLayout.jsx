// frontend-react/src/layouts/ProfessionalLayout.jsx
// Layout with sidebar and top bar
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
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
  ChevronDown
} from 'lucide-react';
import ProfessionalSidebar from '../components/Layout/ProfessionalSidebar';

// TopBar מובנה
const InlineTopBar = () => {
  const navigate = useNavigate();
  const [searchFocus, setSearchFocus] = useState(false);
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
    <header className={`sticky top-0 z-40 border-b px-6 py-4 transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900/95 backdrop-blur-sm border-gray-700' 
        : 'bg-white/95 backdrop-blur-sm border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        {/* Left Section - Search */}
        <div className="flex-1 max-w-lg">
          <div className={`relative transition-all duration-300 ${searchFocus ? 'scale-105' : 'scale-100'}`}>
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className={`h-5 w-5 transition-colors ${
                searchFocus ? 'text-blue-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
              }`} />
            </div>
            <input
              type="text"
              placeholder="Search games, positions, players..."
              className={`w-full pl-12 pr-6 py-3 border rounded-2xl transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-gray-50/80 border-gray-300 text-gray-900 placeholder-gray-500'
              } ${
                searchFocus 
                  ? 'border-blue-400 shadow-lg ring-4 ring-blue-100/50 scale-105 bg-white' 
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
          <div className={`flex items-center space-x-3 px-5 py-3 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
            gameStatus.color
          } ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
            <div className={`w-3 h-3 rounded-full ${
              gameStatus.status === 'active' ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' :
              gameStatus.status === 'completed' ? 'bg-gray-400' : 'bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50'
            }`} />
            <Gamepad2 className="h-5 w-5" />
            <span className="text-sm font-bold">
              {gameStatus.label}
            </span>
          </div>

          {/* ELO Rating */}
          <div className={`flex items-center space-x-3 px-5 py-3 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-yellow-600 text-yellow-300'
              : 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300 text-yellow-800'
          }`}>
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span className="text-lg font-bold">1,247</span>
            <span className="text-sm font-medium opacity-75">ELO</span>
          </div>

          {/* AI Coach Status */}
          <div className={`flex items-center space-x-3 px-5 py-3 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
            isAuthenticated
              ? theme === 'dark'
                ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-600'
                : 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300'
              : theme === 'dark'
                ? 'bg-gray-800 border-gray-600'
                : 'bg-gray-100 border-gray-300'
          }`}>
            <Brain className={`h-5 w-5 ${
              isAuthenticated 
                ? 'text-green-600 animate-pulse' 
                : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <span className={`text-sm font-bold ${
              isAuthenticated 
                ? theme === 'dark' ? 'text-green-400' : 'text-green-700'
                : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Coach {isAuthenticated ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className={`relative p-3 rounded-2xl transition-all duration-300 hover:scale-110 transform ${
            theme === 'dark'
              ? 'text-gray-300 hover:text-white hover:bg-gray-800 hover:shadow-lg'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-lg'
          }`}>
            <Bell className="h-6 w-6" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce">
              2
            </div>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-2xl transition-all duration-300 hover:scale-110 transform ${
              theme === 'dark'
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 hover:shadow-lg shadow-yellow-500/20'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100 hover:shadow-lg shadow-blue-500/20'
            }`}
          >
            <div className="relative">
              {theme === 'light' ? (
                <Moon className="h-6 w-6 transition-transform duration-500 hover:rotate-12" />
              ) : (
                <Sun className="h-6 w-6 transition-transform duration-500 hover:rotate-12" />
              )}
            </div>
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className={`p-3 rounded-2xl transition-all duration-300 hover:scale-110 hover:rotate-12 transform ${
              theme === 'dark'
                ? 'text-gray-300 hover:text-white hover:bg-gray-800 hover:shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-lg'
            }`}
          >
            <Settings className="h-6 w-6" />
          </button>

          {/* Profile */}
          <button className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 hover:scale-105 transform ${
            theme === 'dark' ? 'hover:bg-gray-800 hover:shadow-lg' : 'hover:bg-gray-100 hover:shadow-lg'
          }`}>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <User className="h-5 w-5 text-white" />
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </button>
        </div>
      </div>
    </header>
  );
};

const ProfessionalLayout = () => {
  return (
    <div className="h-screen bg-mesh flex">
      {/* Sidebar */}
      <ProfessionalSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar מובנה */}
        <InlineTopBar />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProfessionalLayout;