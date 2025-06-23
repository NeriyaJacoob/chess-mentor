// frontend-react/src/components/Layout/ProfessionalSidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  HelpCircle,
  MessageCircle  // הוספת אייקון לצ'אט
} from 'lucide-react';

const ProfessionalSidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [engineStatus, setEngineStatus] = useState('ready');

  // Navigation items - הוספת צ'אט
  const navigationItems = [
    { 
      id: 'home', 
      label: 'Dashboard', 
      icon: Home, 
      path: '/dashboard', 
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
      id: 'chat', 
      label: 'Chat Rooms', 
      icon: MessageCircle, 
      path: '/chat', 
      description: 'Chat with other players',
      badge: 'New'
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

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path) => {
    console.log('Navigating to:', path);
    navigate(path);
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
            <div className={`p-2 rounded-lg ${engineConfig.bg}`}>
              <Zap className={`h-4 w-4 ${engineConfig.color}`} />
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);
          const isHovered = hoveredItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                w-full relative flex items-center space-x-3 px-3 py-2.5 rounded-lg
                transition-all duration-200 group
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' 
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
                }
              `}
            >
              {/* Hover background effect */}
              {isHovered && !isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg" />
              )}

              {/* Icon */}
              <div className="relative z-10">
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
              </div>

              {/* Label and description */}
              {!isCollapsed && (
                <div className="flex-1 text-left relative z-10">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
                      {item.label}
                    </p>
                    {item.badge && (
                      <span className={`
                        px-2 py-0.5 text-xs rounded-full
                        ${isActive 
                          ? 'bg-white/20 text-white' 
                          : item.badge === 'New' 
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white'
                        }
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                </div>
              )}

              {/* Active indicator */}
              {isActive && (
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && isHovered && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl z-50 whitespace-nowrap">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                  {item.badge && (
                    <div className="mt-1">
                      <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Stats */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <p className="text-xs text-slate-400">Rating</p>
              </div>
              <p className="text-lg font-bold text-white mt-1">{userStats.rating}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-400" />
                <p className="text-xs text-slate-400">Win Rate</p>
              </div>
              <p className="text-lg font-bold text-white mt-1">{userStats.winRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Navigation */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} 
                p-2 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {!isCollapsed && (
                <span className="text-sm">{item.label}</span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && hoveredItem === item.id && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfessionalSidebar;