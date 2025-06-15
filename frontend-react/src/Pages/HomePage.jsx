// src/pages/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Play, 
  Puzzle, 
  TrendingUp, 
  Clock, 
  Target,
  Trophy,
  Zap,
  Archive,
  Bot,
  Star
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { moveCount } = useSelector(state => state.game);

  const quickActions = [
    { 
      title: 'Quick Play', 
      description: 'Start a new game against AI',
      icon: Play, 
      color: 'from-green-500 to-emerald-600',
      path: '/play',
      action: () => navigate('/play')
    },
    { 
      title: 'Daily Puzzle', 
      description: 'Solve today\'s tactical challenge',
      icon: Puzzle, 
      color: 'from-orange-500 to-red-600',
      path: '/puzzles',
      action: () => navigate('/puzzles')
    },
    { 
      title: 'AI Coach', 
      description: 'Get personalized training',
      icon: Bot, 
      color: 'from-purple-500 to-indigo-600',
      path: '/coach',
      action: () => navigate('/coach'),
      disabled: !isAuthenticated
    }
  ];

  const stats = [
    { title: 'Current ELO', value: '1,247', change: '+23', icon: Trophy, color: 'yellow' },
    { title: 'Games Today', value: '3', change: '+2', icon: Target, color: 'blue' },
    { title: 'Win Rate', value: '67%', change: '+5%', icon: TrendingUp, color: 'green' },
    { title: 'Best Streak', value: '8', change: '+1', icon: Zap, color: 'purple' },
  ];

  const recentGames = [
    { opponent: 'AI Level 5', result: 'Win', time: '12 min', rating: '+15', color: 'white' },
    { opponent: 'AI Level 4', result: 'Loss', time: '8 min', rating: '-12', color: 'black' },
    { opponent: 'AI Level 6', result: 'Win', time: '15 min', rating: '+18', color: 'white' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, Player! 👋</h1>
              <p className="text-blue-100 text-lg">Ready to improve your chess game today?</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{moveCount > 0 ? moveCount : '0'}</div>
                  <div className="text-sm text-blue-200">Moves Played</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 opacity-10">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <pattern id="chess-pattern" patternUnits="userSpaceOnUse" width="25" height="25">
              <rect width="12.5" height="12.5" fill="white"/>
              <rect x="12.5" y="12.5" width="12.5" height="12.5" fill="white"/>
            </pattern>
            <rect width="200" height="200" fill="url(#chess-pattern)"/>
          </svg>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              disabled={action.disabled}
              className={`bg-gradient-to-br ${action.color} p-6 rounded-xl text-white text-left transform transition-all duration-200 hover:scale-105 hover:shadow-xl ${
                action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className="h-8 w-8" />
                {action.disabled && (
                  <div className="bg-white/20 px-2 py-1 rounded text-xs">
                    Login Required
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">{action.title}</h3>
              <p className="text-white/80">{action.description}</p>
            </button>
          );
        })}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.title}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Games */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Games</h3>
              <button 
                onClick={() => navigate('/analysis')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentGames.map((game, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      game.color === 'white' ? 'bg-gray-200 border-2 border-gray-400' : 'bg-gray-800'
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-900">{game.opponent}</div>
                      <div className="text-sm text-gray-500">{game.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      game.result === 'Win' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {game.result}
                    </div>
                    <div className={`text-sm ${
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

        {/* AI Coach Status & Daily Puzzle */}
        <div className="space-y-6">
          {/* AI Coach Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bot className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Coach</h3>
            </div>
            {isAuthenticated ? (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">Connected & Ready</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Your AI coach has analyzed your recent games and is ready with personalized advice.
                </p>
                <button 
                  onClick={() => navigate('/coach')}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Start Session
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-500">Offline</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Connect your OpenAI API key to activate your personal chess coach.
                </p>
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Setup Coach
                </button>
              </div>
            )}
          </div>

          {/* Daily Puzzle Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Puzzle className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Daily Puzzle</h3>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-lg p-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800 mb-2">Mate in 2</div>
                <div className="text-sm text-gray-600 mb-3">White to move and win</div>
                <div className="w-24 h-24 bg-white rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl">♔</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/puzzles')}
              className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Solve Puzzle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;