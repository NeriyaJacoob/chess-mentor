// src/components/Layout/ProfessionalSidebar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Play, 
  BarChart3, 
  Puzzle, 
  GraduationCap, 
  Bot, 
  Settings,
  Crown,
  Zap,
  Trophy,
  Clock
} from 'lucide-react';

const ProfessionalSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home, path: '/', color: 'blue' },
    { id: 'play', label: 'Play', icon: Play, path: '/play', color: 'green' },
    { id: 'analysis', label: 'Analysis', icon: BarChart3, path: '/analysis', color: 'purple' },
    { id: 'puzzles', label: 'Puzzles', icon: Puzzle, path: '/puzzles', color: 'orange' },
    { id: 'learn', label: 'Learn', icon: GraduationCap, path: '/learn', color: 'indigo' },
    { id: 'coach', label: 'AI Coach', icon: Bot, path: '/coach', color: 'emerald' },
  ];

  const isActiveRoute = (path) => location.pathname === path;

  return (
    <div className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Crown className="h-6 w-6" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg">ChessMentor</h1>
              <p className="text-xs text-slate-400">Professional Training</p>
            </div>
          )}
        </div>
      </div>

      {/* User Status */}
      {!isCollapsed && (
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="font-bold text-sm">P</span>
            </div>
            <div>
              <p className="font-medium">Player</p>
              <p className="text-xs text-slate-400">Intermediate</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800 rounded p-2">
              <div className="flex items-center space-x-1">
                <Trophy className="h-3 w-3 text-yellow-500" />
                <span className="text-slate-300">ELO</span>
              </div>
              <p className="font-bold text-white">1,247</p>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3 text-green-500" />
                <span className="text-slate-300">Streak</span>
              </div>
              <p className="font-bold text-white">5</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? `bg-${item.color}-600 text-white shadow-lg` 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${
                  isActive ? 'text-white' : `text-${item.color}-400`
                }`} />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* AI Status */}
        {!isCollapsed && (
          <div className="mt-6 p-3 bg-slate-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">GPT Coach</span>
            </div>
            <p className="text-xs text-slate-400">Ready to help</p>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => navigate('/settings')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            isActiveRoute('/settings')
              ? 'bg-slate-700 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Settings className="h-5 w-5" />
          {!isCollapsed && <span className="font-medium">Settings</span>}
        </button>
        
        {!isCollapsed && (
          <div className="mt-3 text-xs text-slate-500 text-center">
            ChessMentor Pro v1.0
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-slate-800 border border-slate-600 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        <svg className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
};

export default ProfessionalSidebar;