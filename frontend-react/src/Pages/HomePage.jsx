// HomePage - landing screen with feature cards
import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Bot, 
  Puzzle, 
  Trophy,
  Zap,
  Target,
  Crown,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Brain,
  Gamepad2
} from 'lucide-react';

const ModernHomePage = () => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedValue(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { 
      id: 'ai-coach',
      title: 'AI Coach', 
      subtitle: 'Get personalized training',
      icon: Bot, 
      gradient: 'from-purple-500 via-violet-600 to-purple-700',
      shadowColor: 'shadow-purple-500/25',
      pulse: true
    },
    { 
      id: 'daily-puzzle',
      title: 'Daily Puzzle', 
      subtitle: 'Solve today\'s tactical challenge',
      icon: Puzzle, 
      gradient: 'from-orange-500 via-red-500 to-pink-600',
      shadowColor: 'shadow-orange-500/25',
      badge: 'New'
    },
    { 
      id: 'quick-play',
      title: 'Quick Play', 
      subtitle: 'Start a new game against AI',
      icon: Play, 
      gradient: 'from-green-500 via-emerald-600 to-teal-700',
      shadowColor: 'shadow-green-500/25',
      isActive: true
    }
  ];

  const stats = [
    { 
      title: 'Best Streak', 
      value: '8', 
      change: '+2',
      icon: Zap, 
      color: 'amber',
      gradient: 'from-amber-400 to-orange-500'
    },
    { 
      title: 'Win Rate', 
      value: '67%', 
      change: '+5%',
      icon: Target, 
      color: 'emerald',
      gradient: 'from-emerald-400 to-green-500'
    },
    { 
      title: 'Games Today', 
      value: '3', 
      change: '+1',
      icon: Gamepad2, 
      color: 'blue',
      gradient: 'from-blue-400 to-indigo-500'
    },
    { 
      title: 'Current ELO', 
      value: '1,247', 
      change: '+23',
      icon: Crown, 
      color: 'violet',
      gradient: 'from-violet-400 to-purple-500'
    },
  ];

  const MovesCounter = () => (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-indigo-700/10 rounded-2xl blur-xl transform scale-110"></div>
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl border border-white/10">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 opacity-10 transform rotate-12">
          <div className="grid grid-cols-8 gap-1 p-4">
            {Array.from({length: 32}).map((_, i) => (
              <div key={i} className={`w-3 h-3 ${i % 2 === 0 ? 'bg-white' : 'bg-transparent'} rounded-sm`}></div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-blue-100 text-sm font-medium">Move 1 Active</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold leading-tight">
              👋 Welcome back, Player!
            </h1>
            <p className="text-blue-100 text-lg">Ready to improve your chess game today?</p>
          </div>
          
          <div className="text-right">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-black mb-2">1</div>
              <div className="text-sm text-blue-200">Moves Played</div>
            </div>
          </div>
        </div>

        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mesh p-6 space-y-6 max-w-7xl mx-auto">

      {/* Hero Section */}
      <MovesCounter />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const isHovered = hoveredCard === action.id;
          
          return (
            <div
              key={action.id}
              className={`
                group relative cursor-pointer transform transition-all duration-300 
                ${isHovered ? 'scale-105 -translate-y-2' : 'hover:scale-102'}
              `}
              onMouseEnter={() => setHoveredCard(action.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Glow effect */}
              <div className={`
                absolute inset-0 bg-gradient-to-r ${action.gradient} rounded-2xl blur-lg opacity-30 
                group-hover:opacity-50 transition-opacity duration-300 scale-110
              `}></div>
              
              {/* Card */}
              <div className={`
                relative bg-gradient-to-br ${action.gradient} p-6 rounded-2xl text-white 
                shadow-xl ${action.shadowColor} border border-white/20 backdrop-blur-sm
                ${action.pulse ? 'animate-pulse' : ''}
              `}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  {action.badge && (
                    <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/30">
                      {action.badge}
                    </div>
                  )}
                  
                  {action.isActive && (
                    <div className="flex items-center space-x-1 text-green-200">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">Active</span>
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                <p className="text-white/80 text-sm mb-4">{action.subtitle}</p>
                
                <div className="flex items-center text-white/90 font-medium group-hover:translate-x-1 transition-transform duration-200">
                  <span className="text-sm">Get Started</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>

                {/* Sparkle effect on hover */}
                {isHovered && (
                  <div className="absolute top-4 right-4">
                    <Sparkles className="h-5 w-5 text-white/60 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <div
              key={index}
              className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-sm"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} text-white shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className={`text-sm font-bold px-2 py-1 rounded-full ${
                    stat.change.startsWith('+') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                  }`}>
                    {stat.change}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-3xl font-black text-gray-900 group-hover:scale-105 transition-transform duration-200">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm font-medium">{stat.title}</div>
                </div>

                {/* Progress bar animation */}
                <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${60 + (animatedValue % 40)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Coach Status */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white shadow-lg">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">AI Coach</h3>
              <p className="text-gray-600">Your personal chess mentor</p>
            </div>
            <div className="flex-1"></div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Online</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
            <h4 className="font-semibold text-purple-900 mb-2">Ready to analyze your game</h4>
            <p className="text-purple-700 text-sm">
              Your AI coach has reviewed your recent performance and is ready with personalized insights.
            </p>
          </div>
        </div>

        {/* Recent Games Preview */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Games</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-3">
            {[
              { opponent: 'AI Level 5', result: 'Win', time: '12 min', rating: '+15' },
              { opponent: 'AI Level 4', result: 'Loss', time: '8 min', rating: '-12' },
              { opponent: 'AI Level 6', result: 'Win', time: '15 min', rating: '+18' }
            ].map((game, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    game.result === 'Win' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{game.opponent}</div>
                    <div className="text-xs text-gray-500">{game.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    game.result === 'Win' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {game.result}
                  </div>
                  <div className={`text-xs ${
                    game.rating.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {game.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ModernHomePage;