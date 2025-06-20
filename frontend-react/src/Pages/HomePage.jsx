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
  Gamepad2,
  Clock,
  Star
} from 'lucide-react';

const ProfessionalHomePage = () => {
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
      subtitle: 'Personal chess mentor',
      icon: Bot, 
      gradient: 'from-slate-700 via-slate-800 to-slate-900',
      glowColor: 'shadow-purple-500/20',
      iconColor: 'text-purple-400'
    },
    { 
      id: 'daily-puzzle',
      title: 'Daily Puzzle', 
      subtitle: 'Sharpen your tactics',
      icon: Puzzle, 
      gradient: 'from-slate-700 via-slate-800 to-slate-900',
      glowColor: 'shadow-orange-500/20',
      iconColor: 'text-orange-400',
      badge: 'New'
    },
    { 
      id: 'quick-play',
      title: 'Play vs AI', 
      subtitle: 'Challenge Stockfish engine',
      icon: Play, 
      gradient: 'from-slate-700 via-slate-800 to-slate-900',
      glowColor: 'shadow-green-500/20',
      iconColor: 'text-green-400',
      isActive: true
    }
  ];

  const stats = [
    { 
      title: 'Current Rating', 
      value: '1,247', 
      change: '+23',
      icon: Crown, 
      gradient: 'from-slate-800/50 to-slate-700/50',
      accentColor: 'text-yellow-400'
    },
    { 
      title: 'Win Rate', 
      value: '67%', 
      change: '+5%',
      icon: Target, 
      gradient: 'from-slate-800/50 to-slate-700/50',
      accentColor: 'text-emerald-400'
    },
    { 
      title: 'Best Streak', 
      value: '8', 
      change: '+2',
      icon: Zap, 
      gradient: 'from-slate-800/50 to-slate-700/50',
      accentColor: 'text-amber-400'
    },
    { 
      title: 'Games Today', 
      value: '3', 
      change: '+1',
      icon: Gamepad2, 
      gradient: 'from-slate-800/50 to-slate-700/50',
      accentColor: 'text-blue-400'
    },
  ];

  const WelcomeHero = () => (
    <div className="relative overflow-hidden">
      {/* Background Glass Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10"></div>
      
      {/* Floating Chess Pattern */}
      <div className="absolute top-0 right-0 opacity-5 transform rotate-12 scale-150">
        <div className="grid grid-cols-8 gap-1 p-8">
          {Array.from({length: 64}).map((_, i) => (
            <div key={i} className={`w-4 h-4 ${i % 2 === 0 ? 'bg-white' : 'bg-transparent'} rounded-sm`}></div>
          ))}
        </div>
      </div>
      
      <div className="relative z-10 p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-slate-300 text-sm font-medium tracking-wide">SYSTEM READY</span>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Player</span>
              </h1>
              <p className="text-slate-300 text-lg mt-2 font-light">Your chess mastery journey continues</p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Last active: 2 hours ago</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>5-game win streak</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group">
              <div className="text-5xl font-black text-white mb-2 group-hover:scale-105 transition-transform duration-300">1</div>
              <div className="text-sm text-slate-400 uppercase tracking-wider">Active Session</div>
            </div>
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: `${15 + i * 12}%`,
                top: `${20 + (i % 3) * 30}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${4 + i * 0.3}s`
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 space-y-8 max-w-7xl mx-auto">

      {/* Welcome Hero */}
      <WelcomeHero />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const isHovered = hoveredCard === action.id;
          
          return (
            <div
              key={action.id}
              className="group relative cursor-pointer transform transition-all duration-500 hover:scale-105"
              onMouseEnter={() => setHoveredCard(action.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Glass Card */}
              <div className={`
                relative bg-gradient-to-br ${action.gradient} backdrop-blur-xl p-6 rounded-2xl 
                border border-white/10 shadow-2xl ${action.glowColor} hover:border-white/20
                transition-all duration-500 group-hover:shadow-3xl
              `}>
                
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-all duration-300`}>
                    <Icon className={`h-6 w-6 ${action.iconColor}`} />
                  </div>
                  
                  {action.badge && (
                    <div className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-semibold backdrop-blur-sm border border-orange-500/30">
                      {action.badge}
                    </div>
                  )}
                  
                  {action.isActive && (
                    <div className="flex items-center space-x-1 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                      <span className="text-xs font-medium">Live</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">{action.title}</h3>
                  <p className="text-slate-300 text-sm">{action.subtitle}</p>
                  
                  <div className="flex items-center text-slate-400 font-medium group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                    <span className="text-sm">Launch</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>

                {/* Hover Glow Effect */}
                {isHovered && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-2xl"></div>
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
              className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-500 hover:bg-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} border border-white/10`}>
                  <Icon className={`h-5 w-5 ${stat.accentColor}`} />
                </div>
                <div className={`text-sm font-bold px-2 py-1 rounded-full ${
                  stat.change.startsWith('+') 
                    ? 'text-green-400 bg-green-400/10 border border-green-400/20' 
                    : 'text-red-400 bg-red-400/10 border border-red-400/20'
                }`}>
                  {stat.change}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-3xl font-black text-white group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm font-medium">{stat.title}</div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${60 + (animatedValue % 40)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Coach Status */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">AI Chess Coach</h3>
              <p className="text-slate-400">Advanced Stockfish-powered analysis</p>
            </div>
            <div className="flex-1"></div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-400/10 text-green-400 rounded-full border border-green-400/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Ready</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-4 border border-purple-500/20">
            <h4 className="font-semibold text-purple-300 mb-2">System Status</h4>
            <p className="text-slate-300 text-sm">
              Engine initialized and ready for deep position analysis. Stockfish depth: 15+
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Recent Games</h3>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center transition-colors">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-3">
            {[
              { opponent: 'Stockfish Lv.5', result: 'Win', time: '12 min', rating: '+15', color: 'green' },
              { opponent: 'Stockfish Lv.4', result: 'Loss', time: '8 min', rating: '-12', color: 'red' },
              { opponent: 'Stockfish Lv.6', result: 'Win', time: '15 min', rating: '+18', color: 'green' }
            ].map((game, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/5">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    game.result === 'Win' ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'
                  }`}></div>
                  <div>
                    <div className="font-medium text-white">{game.opponent}</div>
                    <div className="text-xs text-slate-400">{game.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    game.result === 'Win' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {game.result}
                  </div>
                  <div className={`text-xs ${
                    game.rating.startsWith('+') ? 'text-green-400' : 'text-red-400'
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
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ProfessionalHomePage;