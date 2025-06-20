// frontend-react/src/components/Layout/ProfessionalSidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // ← הוספה חשובה!
import { 
  Home, 
  Play, 
  BarChart3, 
  Puzzle, 
  Settings, 
  Brain,
  Crown,
  Target,
  Clock,
  Trophy,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  BookOpen,
  User,
  HelpCircle
} from 'lucide-react';

const ProfessionalSidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate(); // ← Hook לניווט
  const location = useLocation(); // ← Hook לזיהוי הנתיב הנוכחי
  const [hoveredItem, setHoveredItem] = useState(null);
  const [engineStatus, setEngineStatus] = useState('ready');

  // Navigation items
  const navigationItems = [
    { 
      id: 'home', 
      label: 'Dashboard', 
      icon: Home, 
      path: '/', 
      description: 'Overview and quick actions',
      badge: null
    },
    { 
      id: 'play', 
      label: 'Play', 
      icon: Play, 
      path: '/play', 
      description: 'Play against AI engine',
      badge: 'Live'
    },
    { 
      id: 'analysis', 
      label: 'Analysis', 
      icon: BarChart3, 
      path: '/analysis', 
      description: 'Deep position analysis',
      badge: null
    },
    { 
      id: 'puzzles', 
      label: 'Puzzles', 
      icon: Puzzle, 
      path: '/puzzles', 
      description: 'Tactical training',
      badge: '3'
    },
    { 
      id: 'coach', 
      label: 'AI Coach', 
      icon: Brain, 
      path: '/coach', 
      description: 'Personal chess mentor',
      badge: null
    }
  ];

  const secondaryItems = [
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User, 
      path: '/profile', 
      description: 'Your chess profile'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      path: '/settings', 
      description: 'App preferences'
    },
    { 
      id: 'help', 
      label: 'Help', 
      icon: HelpCircle, 
      path: '/help', 
      description: 'Get support'
    }
  ];

  // Mock user stats
  const userStats = {
    rating: 1456,
    gamesPlayed: 342,
    winRate: 67,
    puzzlesSolved: 1247,
    currentStreak: 7
  };

  useEffect(() => {
    // Simulate engine status changes
    const statuses = ['ready', 'thinking', 'analyzing'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % statuses.length;
      setEngineStatus(statuses[currentIndex]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ← תיקון הפונקציה החשובה!
  const isActiveRoute = (path) => {
    return location.pathname === path; // השתמשות ב-location במקום activeRoute prop
  };

  // ← התיקון העיקרי - שימוש ב-navigate
  const handleNavigation = (path) => {
    console.log('Navigating to:', path);
    navigate(path); // ← כאן קורה הניווט האמיתי!
  };

  const getEngineStatusConfig = () => {
    switch (engineStatus) {
      case 'thinking':
        return { color: 'text-yellow-400', bg: 'bg-yellow-400/20', label: 'Thinking', pulse: true };
      case 'analyzing':
        return { color: 'text-purple-400', bg: 'bg-purple-400/20', label: 'Analyzing', pulse: true };
      default:
        return { color: 'text-green-400', bg: 'bg-green-400/20', label: 'Ready', pulse: false };
    }
  };

  const engineConfig = getEngineStatusConfig();

  return (
    <div 
      className={`relative h-full bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">ChessMentor</h1>
                <p className="text-xs text-slate-400">Professional Training</p>
              </div>
            </div>
          )}
          
          <button
            onClick={onToggleCollapse}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Engine Status */}
      <div className="p-4 border-b border-white/10">
        {!isCollapsed ? (
          <div className={`${engineConfig.bg} rounded-lg p-3 border border-white/10`}>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${engineConfig.color.replace('text-', 'bg-')} ${engineConfig.pulse ? 'animate-pulse' : ''}`}></div>
                <Zap className={`h-4 w-4 ${engineConfig.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-white font-medium text-sm">Stockfish Engine</p>
                  <div className={`w-2 h-2 rounded-full ${engineConfig.color.replace('text-', 'bg-')} ${engineConfig.pulse ? 'animate-pulse' : ''}`}></div>
                </div>
                <p className={`text-xs ${engineConfig.color}`}>{engineConfig.label}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className={`w-3 h-3 rounded-full ${engineConfig.color.replace('text-', 'bg-')} ${engineConfig.pulse ? 'animate-pulse' : ''}`}></div>
          </div>
        )}
      </div>

      {/* User Stats Summary */}
      {!isCollapsed && (
        <div className="p-4 border-b border-white/10">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-yellow-400">{userStats.rating}</div>
              <div className="text-xs text-slate-400">Rating</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-400">{userStats.winRate}%</div>
              <div className="text-xs text-slate-400">Win Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);
            const isHovered = hoveredItem === item.id;
            
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleNavigation(item.path)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`relative w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 border border-blue-500/30 shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-400' : ''} group-hover:scale-110 transition-transform duration-200`} />
                  
                  {!isCollapsed && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      <div className="flex-1"></div>
                      
                      {item.badge && (
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          item.badge === 'Live' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {item.badge}
                        </div>
                      )}
                    </>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-r-full"></div>
                  )}
                </button>

                {/* Tooltip for collapsed state */}
                {isCollapsed && isHovered && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 z-50 shadow-xl">
                    <div className="whitespace-nowrap">
                      <div className="font-medium text-white">{item.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{item.description}</div>
                    </div>
                    {/* Arrow */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 border-l border-t border-white/20 rotate-45"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Separator */}
        <div className="my-4 border-t border-white/10"></div>

        {/* Secondary Navigation */}
        <div className="space-y-1">
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);
            const isHovered = hoveredItem === item.id;
            
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleNavigation(item.path)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`relative w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                  
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>

                {/* Tooltip for collapsed state */}
                {isCollapsed && isHovered && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 z-50 shadow-xl">
                    <div className="whitespace-nowrap">
                      <div className="font-medium text-white">{item.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{item.description}</div>
                    </div>
                    {/* Arrow */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 border-l border-t border-white/20 rotate-45"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="space-y-2">
            <button 
              onClick={() => handleNavigation('/play')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg font-semibold"
            >
              <Play className="h-4 w-4" />
              <span>Quick Play</span>
            </button>
            
            <button 
              onClick={() => handleNavigation('/puzzles')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/10"
            >
              <Target className="h-4 w-4" />
              <span>Daily Puzzle</span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsed Quick Actions */}
      {isCollapsed && (
        <div className="p-2 border-t border-white/10 space-y-2">
          <button 
            onClick={() => handleNavigation('/play')}
            className="w-full p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
            title="Quick Play"
          >
            <Play className="h-4 w-4 mx-auto" />
          </button>
          <button 
            onClick={() => handleNavigation('/puzzles')}
            className="w-full p-2 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/10"
            title="Daily Puzzle"
          >
            <Target className="h-4 w-4 mx-auto" />
          </button>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default ProfessionalSidebar;