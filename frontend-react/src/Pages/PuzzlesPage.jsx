// PuzzlesPage - tactical training area
import React, { useState } from 'react';
import { 
  Target, 
  Star, 
  Clock, 
  Trophy, 
  Zap,
  CheckCircle,
  XCircle,
  RotateCcw,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import ChessBoard from '../components/ChessBoard/ChessBoard';

const PuzzlesPage = () => {
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState('active'); // active, solved, failed
  const [showHint, setShowHint] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const puzzleCategories = [
    { id: 'all', label: 'All Puzzles', count: 4850, icon: Target, color: 'blue' },
    { id: 'tactics', label: 'Tactics', count: 2450, icon: Zap, color: 'red' },
    { id: 'endgame', label: 'Endgame', count: 890, icon: Trophy, color: 'yellow' },
    { id: 'opening', label: 'Opening', count: 1200, icon: Star, color: 'green' },
    { id: 'strategy', label: 'Strategy', count: 650, icon: TrendingUp, color: 'purple' }
  ];

  const dailyPuzzle = {
    id: 'daily-001',
    title: 'Mate in 2',
    difficulty: 'Intermediate',
    rating: 1450,
    description: 'White to move and deliver checkmate in 2 moves',
    category: 'tactics',
    attempts: 1247,
    success_rate: 68,
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
  };

  const recentPuzzles = [
    { id: 1, title: 'Fork Tactics', difficulty: 'Easy', rating: 1200, solved: true, time: '45s' },
    { id: 2, title: 'Pin Defense', difficulty: 'Medium', rating: 1350, solved: true, time: '1m 23s' },
    { id: 3, title: 'Back Rank Mate', difficulty: 'Hard', rating: 1580, solved: false, time: '2m 15s' },
    { id: 4, title: 'Discovery Attack', difficulty: 'Medium', rating: 1420, solved: true, time: '1m 02s' }
  ];

  const stats = [
    { title: 'Puzzles Solved', value: '247', change: '+12', icon: CheckCircle, color: 'green' },
    { title: 'Success Rate', value: '73%', change: '+5%', icon: Target, color: 'blue' },
    { title: 'Current Streak', value: '8', change: '+2', icon: Zap, color: 'orange' },
    { title: 'Best Rating', value: '1680', change: '+45', icon: Trophy, color: 'yellow' }
  ];

  const handleSolvePuzzle = () => {
    setPuzzleStatus('solved');
  };

  const handleNextPuzzle = () => {
    setCurrentPuzzle(prev => prev + 1);
    setPuzzleStatus('active');
    setShowHint(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-mesh p-6 space-y-6 max-w-7xl mx-auto">
      {/* Puzzle Stats */}
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

      {/* Daily Puzzle Hero */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Star className="h-6 w-6" />
              <h2 className="text-2xl font-bold">🧩 Daily Puzzle</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{dailyPuzzle.title}</h3>
                <p className="text-emerald-100">{dailyPuzzle.description}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(dailyPuzzle.difficulty)} text-gray-800`}>
                  {dailyPuzzle.difficulty}
                </span>
                <span className="text-emerald-100">Rating: {dailyPuzzle.rating}</span>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-emerald-200">
                <div>👥 {dailyPuzzle.attempts} attempts</div>
                <div>✅ {dailyPuzzle.success_rate}% success rate</div>
              </div>
              
              <div className="pt-4">
                {puzzleStatus === 'active' && (
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleSolvePuzzle}
                      className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
                    >
                      Submit Solution
                    </button>
                    <button 
                      onClick={() => setShowHint(!showHint)}
                      className="bg-emerald-400 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-300 transition-colors"
                    >
                      <Lightbulb className="h-4 w-4 inline mr-2" />
                      Hint
                    </button>
                  </div>
                )}
                
                {puzzleStatus === 'solved' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-white">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Puzzle Solved! +15 Rating</span>
                    </div>
                    <button 
                      onClick={handleNextPuzzle}
                      className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
                    >
                      Next Puzzle
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <ChessBoard size={300} />
            </div>
          </div>
        </div>
        
        {showHint && (
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-5 w-5" />
              <span className="font-medium">Hint</span>
            </div>
            <p className="text-emerald-100">Look for a forcing move that attacks the king. Consider checks first!</p>
          </div>
        )}
      </div>

      {/* Puzzle Categories */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Puzzle Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {puzzleCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedCategory === category.id
                    ? `border-${category.color}-300 bg-${category.color}-50`
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="text-center">
                  <Icon className={`h-8 w-8 mx-auto mb-3 ${
                    selectedCategory === category.id 
                      ? `text-${category.color}-600` 
                      : 'text-gray-500'
                  }`} />
                  <div className="font-medium text-gray-900">{category.label}</div>
                  <div className="text-sm text-gray-500">{category.count.toLocaleString()} puzzles</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Puzzles & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Puzzles */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Puzzles</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentPuzzles.map((puzzle) => (
                <div key={puzzle.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      puzzle.solved ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {puzzle.solved ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{puzzle.title}</div>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(puzzle.difficulty)}`}>
                          {puzzle.difficulty}
                        </span>
                        <span>Rating: {puzzle.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{puzzle.time}</div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
          <div className="space-y-4">
            <div className="h-40 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">Performance chart</p>
                <p className="text-gray-500 text-xs">Coming soon</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Week</span>
                <span className="font-medium text-gray-900">23 puzzles</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. Time</span>
                <span className="font-medium text-gray-900">1m 32s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Improvement</span>
                <span className="font-medium text-green-600">+45 rating</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2">
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Practice Session
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                View All Stats
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzlesPage;