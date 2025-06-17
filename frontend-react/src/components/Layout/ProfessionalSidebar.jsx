// src/components/Layout/ProfessionalSidebar.jsx
// Sidebar navigation links and actions
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Home, 
  Play, 
  BarChart3, 
  Puzzle, 
  GraduationCap, 
  Bot, 
  Settings,
  Crown,
  Trophy,
  Clock,
  ChevronLeft,
  Zap,
  Target,
  Star,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfessionalSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAuthenticated } = useSelector(state => state.auth);
  const { moveCount } = useSelector(state => state.game);

  const menuItems = [
    { 
      id: 'home', 
      label: 'Dashboard', 
      icon: Home, 
      path: '/', 
      color: 'blue',
      badge: null
    },
    { 
      id: 'play', 
      label: 'Play', 
      icon: Play, 
      path: '/play', 
      color: 'green',
      badge: moveCount > 0 ? 'Active' : null
    },
    { 
      id: 'analysis', 
      label: 'Analysis', 
      icon: BarChart3, 
      path: '/analysis', 
      color: 'purple',
      badge: null
    },
    { 
      id: 'puzzles', 
      label: 'Puzzles', 
      icon: Puzzle, 
      path: '/puzzles', 
      color: 'orange',
      badge: '3 New'
    },
    { 
      id: 'learn', 
      label: 'Learn', 
      icon: GraduationCap, 
      path: '/learn', 
      color: 'indigo',
      badge: null
    },
    { 
      id: 'coach', 
      label: 'AI Coach', 
      icon: Bot, 
      path: '/coach', 
      color: 'emerald',
      badge: isAuthenticated ? 'Online' : 'Offline'
    },
  ];

  const isActiveRoute = (path) => location.pathname === path;

  const handleNavigation = (path) => {
    navigate(path);
  };

  const sidebarVariants = {
    expanded: { width: '16rem' },
    collapsed: { width: '4rem' }
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  return (
    <motion.div
      className="bg-slate-900 text-white flex flex-col relative border-r border-slate-700"
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          
          {/* Brand Text */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.2 }}
              >
                <h1 className="font-bold text-lg bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  ChessMentor
                </h1>
                <p className="text-xs text-slate-400">Professional Training</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* User Profile */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="p-4 border-b border-slate-700"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Player</p>
                <p className="text-xs text-slate-400">Intermediate Level</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 border border-slate-700/50">
                <div className="flex items-center space-x-1 mb-1">
                  <Trophy className="h-3 w-3 text-yellow-400" />
                  <span className="text-slate-300">ELO</span>
                </div>
                <p className="font-bold text-white">1,247</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 border border-slate-700/50">
                <div className="flex items-center space-x-1 mb-1">
                  <Zap className="h-3 w-3 text-green-400" />
                  <span className="text-slate-300">Streak</span>
                </div>
                <p className="font-bold text-white">5</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);
            
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? `bg-gradient-to-r from-${item.color}-600 to-${item.color}-700 text-white shadow-lg shadow-${item.color}-500/25` 
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Icon */}
                <div className={`relative ${isCollapsed ? 'mx-auto' : ''}`}>
                  <Icon className={`h-5 w-5 ${
                    isActive ? 'text-white' : `text-${item.color}-400 group-hover:text-${item.color}-300`
                  }`} />
                  
                  {/* Active indicator for collapsed state */}
                  {isActive && isCollapsed && (
                    <motion.div
                      className="absolute -right-8 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full"
                      layoutId="activeIndicator"
                    />
                  )}
                </div>

                {/* Label and Badge */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      className="flex items-center justify-between flex-1 min-w-0"
                      variants={contentVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      transition={{ duration: 0.2 }}
                    >
                      <span className="font-medium truncate">{item.label}</span>
                      
                      {/* Badge */}
                      {item.badge && (
                        <motion.span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            item.badge === 'Online' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : item.badge === 'Offline'
                              ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              : item.badge === 'Active'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {item.badge}
                        </motion.span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 bg-slate-700 rounded text-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* AI Coach Status (when collapsed) */}
        {isCollapsed && (
          <motion.div
            className="mt-6 px-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className={`w-3 h-3 rounded-full mx-auto ${
              isAuthenticated ? 'bg-green-400' : 'bg-gray-400'
            } animate-pulse`} />
          </motion.div>
        )}

        {/* AI Coach Status (when expanded) */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="mt-6 mx-3 p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600/30"
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  isAuthenticated ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`} />
                <span className="text-sm font-medium">GPT Coach</span>
              </div>
              <p className="text-xs text-slate-400">
                {isAuthenticated ? 'Ready to help you improve' : 'Connect to enable coaching'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-700">
        <motion.button
          onClick={() => navigate('/settings')}
          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
            isActiveRoute('/settings')
              ? 'bg-slate-700 text-white'
              : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Settings className="h-5 w-5" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                className="font-medium"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.2 }}
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="mt-3 text-center"
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              transition={{ duration: 0.2 }}
            >
              <div className="text-xs text-slate-500">
                ChessMentor Pro v1.0
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse Toggle */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-slate-800 border border-slate-600 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-lg z-10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${
          isCollapsed ? 'rotate-180' : ''
        }`} />
      </motion.button>
    </motion.div>
  );
};

export default ProfessionalSidebar;