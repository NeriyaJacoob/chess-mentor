// src/components/Layout/TopBar.jsx
import React, { useState } from 'react';
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
  Clock,
  Zap,
  Target,
  ChevronDown,
  Gamepad2,
  Brain,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TopBar = () => {
  const navigate = useNavigate();
  const [searchFocus, setSearchFocus] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState('light');
  
  const { isAuthenticated } = useSelector(state => state.auth);
  const { moveCount, isGameOver } = useSelector(state => state.game);

  const notifications = [
    { id: 1, type: 'puzzle', message: 'New daily puzzle available!', time: '2m ago', unread: true },
    { id: 2, type: 'achievement', message: 'Achievement unlocked: 10 game streak!', time: '1h ago', unread: true },
    { id: 3, type: 'coach', message: 'AI Coach has analyzed your last game', time: '3h ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const getGameStatus = () => {
    if (isGameOver) return { status: 'completed', color: 'text-gray-500', label: 'Game Over' };
    if (moveCount > 0) return { status: 'active', color: 'text-green-500', label: `Move ${moveCount}` };
    return { status: 'ready', color: 'text-blue-500', label: 'Ready to Play' };
  };

  const gameStatus = getGameStatus();

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Left Section - Search */}
        <div className="flex-1 max-w-md">
          <motion.div
            className={`relative transition-all duration-300 ${
              searchFocus ? 'scale-105' : 'scale-100'
            }`}
            whileFocus={{ scale: 1.02 }}
          >
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className={`h-4 w-4 transition-colors ${
                searchFocus ? 'text-blue-500' : 'text-gray-400'
              }`} />
            </div>
            <input
              type="text"
              placeholder="Search games, positions, players..."
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl transition-all duration-200 ${
                searchFocus 
                  ? 'border-blue-300 bg-blue-50/50 shadow-md ring-2 ring-blue-100' 
                  : 'border-gray-300 bg-gray-50/50 hover:bg-white hover:border-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
            />
          </motion.div>
        </div>

        {/* Center Section - Game Status & Quick Stats */}
        <div className="hidden lg:flex items-center space-x-6 mx-8">
          {/* Game Status */}
          <motion.div
            className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg border"
            whileHover={{ scale: 1.05 }}
          >
            <div className={`w-2 h-2 rounded-full ${
              gameStatus.status === 'active' ? 'bg-green-400 animate-pulse' :
              gameStatus.status === 'completed' ? 'bg-gray-400' : 'bg-blue-400'
            }`} />
            <Gamepad2 className="h-4 w-4 text-gray-600" />
            <span className={`text-sm font-medium ${gameStatus.color}`}>
              {gameStatus.label}
            </span>
          </motion.div>

          {/* ELO Rating */}
          <motion.div
            className="flex items-center space-x-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-lg border border-yellow-200"
            whileHover={{ scale: 1.05 }}
          >
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">1,247 ELO</span>
          </motion.div>

          {/* AI Coach Status */}
          <motion.div
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              isAuthenticated
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            <Brain className={`h-4 w-4 ${isAuthenticated ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${
              isAuthenticated ? 'text-green-700' : 'text-gray-500'
            }`}>
              {isAuthenticated ? 'Coach Online' : 'Coach Offline'}
            </span>
          </motion.div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-3">
          {/* Performance Indicator (Mobile visible) */}
          <div className="lg:hidden">
            <motion.button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Activity className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {unreadCount}
                </motion.div>
              )}
            </motion.button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <span className="text-sm text-gray-500">{unreadCount} new</span>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                          notification.unread ? 'bg-blue-50/50' : ''
                        }`}
                        whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 mt-2 rounded-full ${
                            notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </motion.button>

          {/* Settings */}
          <motion.button
            onClick={() => navigate('/settings')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="h-5 w-5" />
          </motion.button>

          {/* Profile */}
          <div className="relative">
            <motion.button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <User className="h-4 w-4 text-white" />
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </motion.button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfile && (
                <motion.div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Player</p>
                        <p className="text-sm text-gray-500">Intermediate Level</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      View Profile
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      Game History
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      Statistics
                    </button>
                    <hr className="my-2 border-gray-100" />
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      Settings
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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

export default TopBar;