import React, { useState, useEffect } from 'react';
import { 
  Puzzle, 
  Target, 
  Clock, 
  Trophy, 
  Star, 
  Zap, 
  Brain, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Lightbulb, 
  Play,
  Calendar,
  TrendingUp,
  Award,
  Timer,
  Eye,
  Crown,
  Flame,
  ChevronRight
} from 'lucide-react';

const ProfessionalPuzzlesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('daily');
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [userMove, setUserMove] = useState('');
  const [puzzleResult, setPuzzleResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [streak, setStreak] = useState(7);

  const puzzleCategories = [
    { 
      id: 'daily', 
      name: 'Daily Puzzle', 
      icon: Calendar, 
      difficulty: 'Mixed', 
      description: 'Fresh challenge every day',
      color: 'from-blue-500/20 to-cyan-500/20',
      accent: 'text-blue-400',
      count: 1,
      isNew: true
    },
    { 
      id: 'tactics', 
      name: 'Tactical Shots', 
      icon: Zap, 
      difficulty: 'Intermediate', 
      description: 'Sharpen your tactical vision',
      color: 'from-yellow-500/20 to-orange-500/20',
      accent: 'text-yellow-400',
      count: 1247
    },
    { 
      id: 'endgame', 
      name: 'Endgame Studies', 
      icon: Crown, 
      difficulty: 'Advanced', 
      description: 'Master endgame technique',
      color: 'from-purple-500/20 to-violet-500/20',
      accent: 'text-purple-400',
      count: 892
    },
    { 
      id: 'opening', 
      name: 'Opening Traps', 
      icon: Play, 
      difficulty: 'Beginner', 
      description: 'Learn opening principles',
      color: 'from-green-500/20 to-emerald-500/20',
      accent: 'text-green-400',
      count: 634
    },
    { 
      id: 'checkmate', 
      name: 'Checkmate Patterns', 
      icon: Target, 
      difficulty: 'Mixed', 
      description: 'Classic mating patterns',
      color: 'from-red-500/20 to-pink-500/20',
      accent: 'text-red-400',
      count: 456
    },
    { 
      id: 'positional', 
      name: 'Positional Play', 
      icon: Brain, 
      difficulty: 'Advanced', 
      description: 'Strategic understanding',
      color: 'from-indigo-500/20 to-blue-500/20',
      accent: 'text-indigo-400',
      count: 789
    }
  ];

  const dailyPuzzle = {
    id: 'daily_2024_06_20',
    title: 'Daily Challenge',
    description: 'White to move and win material',
    difficulty: 'Intermediate',
    rating: 1450,
    theme: 'Fork',
    moves: 3,
    timeLimit: 180,
    solution: 'Ne5+',
    hint: 'Look for a knight fork that attacks both king and queen.',
    explanation: 'The knight fork on e5 is devastating - it checks the king and simultaneously attacks the undefended queen on c6.'
  };

  const recentPuzzles = [
    { id: 1, theme: 'Pin', difficulty: 'Easy', rating: 1200, result: 'solved', time: '45s', accuracy: 95 },
    { id: 2, theme: 'Fork', difficulty: 'Medium', rating: 1350, result: 'solved', time: '1m 23s', accuracy: 88 },
    { id: 3, theme: 'Skewer', difficulty: 'Medium', rating: 1420, result: 'failed', time: '2m 45s', accuracy: 62 },
    { id: 4, theme: 'Discovery', difficulty: 'Hard', rating: 1580, result: 'solved', time: '3m 12s', accuracy: 91 },
    { id: 5, theme: 'Deflection', difficulty: 'Easy', rating: 1180, result: 'solved', time: '38s', accuracy: 97 }
  ];

  const puzzleStats = {
    totalSolved: 1247,
    rating: 1456,
    accuracy: 87,
    averageTime: '2m 15s',
    currentStreak: streak,
    longestStreak: 23
  };

  useEffect(() => {
    if (selectedCategory === 'daily') {
      setCurrentPuzzle(dailyPuzzle);
    }
  }, [selectedCategory]);

  useEffect(() => {
    let interval;
    if (currentPuzzle && !puzzleResult) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentPuzzle, puzzleResult]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitMove = () => {
    if (!userMove.trim()) return;
    
    const isCorrect = userMove.toLowerCase() === currentPuzzle.solution.toLowerCase();
    setPuzzleResult({
      correct: isCorrect,
      userMove,
      solution: currentPuzzle.solution,
      time: timeSpent
    });

    if (isCorrect) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const resetPuzzle = () => {
    setUserMove('');
    setPuzzleResult(null);
    setShowHint(false);
    setTimeSpent(0);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
      case 'beginner':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'medium':
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'hard':
      case 'advanced':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const MockPuzzleBoard = () => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-white/10 shadow-2xl">
      <div className="grid grid-cols-8 gap-0 max-w-[320px] mx-auto rounded-lg overflow-hidden bg-slate-300">
        {Array.from({ length: 64 }).map((_, i) => {
          const isLight = Math.floor(i / 8) % 2 === i % 2;
          const pieces = {
            4: '♚', 12: '♛', 20: '♞', 28: '♔', 35: '♕', 44: '♘'
          };
          const piece = pieces[i];
          const isHighlighted = i === 20 || i === 28 || i === 35; // Knight fork visualization
          
          return (
            <div 
              key={i}
              className={`aspect-square flex items-center justify-center text-lg cursor-pointer transition-all duration-200
                ${isLight ? 'bg-slate-200 hover:bg-slate-100' : 'bg-slate-400 hover:bg-slate-500'}
                ${isHighlighted ? 'ring-2 ring-yellow-400 ring-opacity-70' : ''}
              `}
            >
              {piece && (
                <span className={`${piece === '♚' || piece === '♛' || piece === '♞' ? 'text-black' : 'text-white filter drop-shadow-lg'} hover:scale-110 transition-transform duration-200`}>
                  {piece}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Move indicator */}
      <div className="mt-4 text-center">
        <div className="text-slate-400 text-sm">
          {puzzleResult ? 
            `Solution: ${currentPuzzle?.solution}` : 
            `${currentPuzzle?.theme} Pattern • ${currentPuzzle?.moves} moves to win`
          }
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      
      {/* Left Sidebar - Categories */}
      <div className="w-80 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-xl border border-orange-500/20">
              <Puzzle className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Chess Puzzles</h2>
              <p className="text-slate-400 text-sm">Train your tactical vision</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center space-x-2 mb-1">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-slate-400">Streak</span>
              </div>
              <div className="text-lg font-bold text-orange-400">{streak}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center space-x-2 mb-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-slate-400">Rating</span>
              </div>
              <div className="text-lg font-bold text-yellow-400">{puzzleStats.rating}</div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="p-6 border-b border-white/10 flex-1 overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
          <div className="space-y-3">
            {puzzleCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 group ${
                    isSelected
                      ? `bg-gradient-to-r ${category.color} border-white/30 ${category.accent}`
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-semibold">{category.name}</span>
                    </div>
                    {category.isNew && (
                      <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                        New
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs opacity-75">{category.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full border ${getDifficultyColor(category.difficulty)}`}>
                        {category.difficulty}
                      </span>
                      <span className="text-slate-500">{category.count} puzzles</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Puzzles</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {recentPuzzles.map((puzzle) => (
              <div key={puzzle.id} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      puzzle.result === 'solved' ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'
                    }`}></div>
                    <span className="font-medium text-white text-sm">{puzzle.theme}</span>
                  </div>
                  <span className="text-xs text-slate-400">{puzzle.time}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded-full border ${getDifficultyColor(puzzle.difficulty)}`}>
                    {puzzle.difficulty}
                  </span>
                  <span className="text-slate-500">{puzzle.accuracy}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Puzzle Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Puzzle Header */}
        <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{currentPuzzle?.title || 'Select a Puzzle'}</h2>
              <p className="text-slate-400">
                {currentPuzzle && `${currentPuzzle.theme} • Rating: ${currentPuzzle.rating} • ${formatTime(timeSpent)}`}
              </p>
            </div>
            
            {currentPuzzle && (
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full border text-sm font-semibold ${getDifficultyColor(currentPuzzle.difficulty)}`}>
                  {currentPuzzle.difficulty}
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <Timer className="h-4 w-4" />
                  <span>{formatTime(timeSpent)} / {formatTime(currentPuzzle.timeLimit)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Puzzle Content */}
        {currentPuzzle ? (
          <div className="flex-1 flex">
            
            {/* Puzzle Board */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="space-y-6">
                <MockPuzzleBoard />
                
                {/* Puzzle Description */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 max-w-[320px] mx-auto">
                  <h3 className="font-semibold text-white mb-2">{currentPuzzle.description}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Theme:</span>
                      <div className="text-white font-medium">{currentPuzzle.theme}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Moves:</span>
                      <div className="text-white font-medium">{currentPuzzle.moves}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution Panel */}
            <div className="w-80 bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col">
              
              {/* Move Input */}
              <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Your Move</h3>
                
                {!puzzleResult ? (
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={userMove}
                        onChange={(e) => setUserMove(e.target.value)}
                        placeholder="Enter your move (e.g. Ne5+)"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-slate-400 text-center font-mono text-lg"
                        disabled={!!puzzleResult}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSubmitMove}
                        disabled={!userMove.trim()}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>Submit</span>
                      </button>
                      
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="px-4 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10"
                        title="Show hint"
                      >
                        <Lightbulb className="h-5 w-5" />
                      </button>
                    </div>

                    {showHint && (
                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-yellow-400" />
                          <span className="text-yellow-400 font-semibold text-sm">Hint</span>
                        </div>
                        <p className="text-yellow-300 text-sm">{currentPuzzle.hint}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border ${
                      puzzleResult.correct 
                        ? 'bg-green-500/20 border-green-500/30' 
                        : 'bg-red-500/20 border-red-500/30'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {puzzleResult.correct ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                        <span className={`font-semibold ${puzzleResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                          {puzzleResult.correct ? 'Correct!' : 'Incorrect'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-400">Your move:</span>
                          <span className="text-white font-mono ml-2">{puzzleResult.userMove}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Solution:</span>
                          <span className="text-white font-mono ml-2">{puzzleResult.solution}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Time:</span>
                          <span className="text-white ml-2">{formatTime(puzzleResult.time)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="text-blue-400 font-semibold mb-2">Explanation</h4>
                      <p className="text-blue-300 text-sm">{currentPuzzle.explanation}</p>
                    </div>

                    <button
                      onClick={resetPuzzle}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10"
                    >
                      <RotateCcw className="h-5 w-5" />
                      <span>Try Again</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Summary */}
              <div className="p-6 border-b border-white/10 flex-1">
                <h3 className="text-lg font-semibold text-white mb-4">Your Progress</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-2xl font-bold text-green-400">{puzzleStats.totalSolved}</div>
                      <div className="text-xs text-slate-400">Solved</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-2xl font-bold text-blue-400">{puzzleStats.accuracy}%</div>
                      <div className="text-xs text-slate-400">Accuracy</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Current Streak</span>
                      <span className="text-lg font-bold text-orange-400">{puzzleStats.currentStreak}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Best Streak</span>
                      <span className="text-sm text-slate-300">{puzzleStats.longestStreak}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="p-6">
                <div className="flex space-x-2">
                  <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg font-semibold">
                    <Play className="h-5 w-5" />
                    <span>Next Puzzle</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/20">
                <Puzzle className="h-12 w-12 text-orange-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Select a Puzzle Category</h3>
                <p className="text-slate-400">Choose from the categories on the left to start training</p>
              </div>
            </div>
          </div>
        )}
      </div>

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

export default ProfessionalPuzzlesPage;