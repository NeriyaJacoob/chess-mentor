import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  RotateCw, 
  Square, 
  Flag,
  Settings,
  Trophy,
  Brain,
  Zap,
  Clock,
  Target,
  Cpu,
  Activity,
  PlayCircle,
  Pause
} from 'lucide-react';

const ProfessionalPlayPage = () => {
  // Game state
  const [aiLevel, setAiLevel] = useState(5);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [error, setError] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [playerColor, setPlayerColor] = useState('white');
  const [moveCount, setMoveCount] = useState(0);
  const [gameTime, setGameTime] = useState(0);

  // Mock chess board (8x8 grid)
  const createInitialBoard = () => {
    const pieces = {
      'a8': '♜', 'b8': '♞', 'c8': '♝', 'd8': '♛', 'e8': '♚', 'f8': '♝', 'g8': '♞', 'h8': '♜',
      'a7': '♟', 'b7': '♟', 'c7': '♟', 'd7': '♟', 'e7': '♟', 'f7': '♟', 'g7': '♟', 'h7': '♟',
      'a2': '♙', 'b2': '♙', 'c2': '♙', 'd2': '♙', 'e2': '♙', 'f2': '♙', 'g2': '♙', 'h2': '♙',
      'a1': '♖', 'b1': '♘', 'c1': '♗', 'd1': '♕', 'e1': '♔', 'f1': '♗', 'g1': '♘', 'h1': '♖'
    };

    const board = [];
    for (let rank = 8; rank >= 1; rank--) {
      const row = [];
      for (let file = 0; file < 8; file++) {
        const square = String.fromCharCode(97 + file) + rank;
        const isLight = (rank + file) % 2 === 0;
        row.push({
          square,
          piece: pieces[square] || null,
          isLight,
          isHighlighted: false
        });
      }
      board.push(row);
    }
    return board;
  };

  const [board, setBoard] = useState(createInitialBoard());

  // Mock game timer
  useEffect(() => {
    let interval;
    if (isGameActive && !aiThinking && !gameResult) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, aiThinking, gameResult]);

  const aiLevels = [
    { level: 1, name: 'Beginner', elo: '800', description: 'Perfect for learning', color: 'from-green-500/20 to-emerald-500/20', stars: 1 },
    { level: 2, name: 'Novice', elo: '1000', description: 'Easy opponent', color: 'from-green-500/20 to-emerald-500/20', stars: 1 },
    { level: 3, name: 'Amateur', elo: '1200', description: 'Casual play', color: 'from-blue-500/20 to-cyan-500/20', stars: 2 },
    { level: 4, name: 'Club Player', elo: '1400', description: 'Intermediate challenge', color: 'from-blue-500/20 to-cyan-500/20', stars: 2 },
    { level: 5, name: 'Strong Club', elo: '1600', description: 'Solid opponent', color: 'from-purple-500/20 to-violet-500/20', stars: 3 },
    { level: 6, name: 'Expert', elo: '1800', description: 'Advanced play', color: 'from-purple-500/20 to-violet-500/20', stars: 3 },
    { level: 7, name: 'Master', elo: '2000', description: 'Strong master', color: 'from-orange-500/20 to-red-500/20', stars: 4 },
    { level: 8, name: 'Strong Master', elo: '2200', description: 'Expert level', color: 'from-orange-500/20 to-red-500/20', stars: 4 },
    { level: 9, name: 'Grandmaster', elo: '2400', description: 'Professional level', color: 'from-red-500/20 to-pink-500/20', stars: 5 },
    { level: 10, name: 'Super GM', elo: '2600+', description: 'Maximum strength', color: 'from-red-500/20 to-pink-500/20', stars: 5 }
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNewGame = () => {
    setIsStartingGame(true);
    setError(null);
    setTimeout(() => {
      setIsGameActive(true);
      setIsStartingGame(false);
      setOpponent({
        name: `Stockfish Level ${aiLevel}`,
        elo: aiLevels[aiLevel - 1].elo,
        level: aiLevel
      });
      setMoveCount(0);
      setGameTime(0);
      setGameResult(null);
    }, 1500);
  };

  const handleResign = () => {
    setGameResult('You resigned');
    setIsGameActive(false);
  };

  const ChessSquare = ({ square, piece, isLight, isHighlighted }) => (
    <div 
      className={`
        aspect-square flex items-center justify-center text-4xl font-bold cursor-pointer
        transition-all duration-200 hover:scale-105 border border-slate-600/20
        ${isLight ? 'bg-slate-200' : 'bg-slate-400'}
        ${isHighlighted ? 'ring-2 ring-blue-400 ring-opacity-70' : ''}
        hover:brightness-110
      `}
    >
      {piece && (
        <span className="drop-shadow-lg hover:scale-110 transition-transform duration-200">
          {piece}
        </span>
      )}
    </div>
  );

  const ChessBoard = () => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-white/10 shadow-2xl">
      <div className="grid grid-cols-8 gap-0 max-w-[480px] mx-auto rounded-lg overflow-hidden shadow-inner bg-slate-300">
        {board.flat().map((square, index) => (
          <ChessSquare
            key={square.square}
            square={square.square}
            piece={square.piece}
            isLight={square.isLight}
            isHighlighted={square.isHighlighted}
          />
        ))}
      </div>
      
      {/* Board coordinates */}
      <div className="flex justify-between mt-2 px-2">
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
          <span key={file} className="text-slate-400 text-sm font-mono w-[60px] text-center">
            {file}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left Sidebar - Game Controls */}
      <div className="w-80 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col">
        
        {/* Game Status Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              isGameActive ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 
              isStartingGame ? 'bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50' :
              'bg-slate-500'
            }`}></div>
            <span className="text-white font-semibold">
              {isGameActive ? 'Game Active' : 
               isStartingGame ? 'Initializing...' : 
               'Ready to Play'}
            </span>
            <div className="flex items-center text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20">
              <Cpu className="h-3 w-3 mr-1" />
              Stockfish
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-sm mb-4">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">×</button>
              </div>
            </div>
          )}

          {opponent && isGameActive && (
            <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 px-3 py-2 rounded-lg text-sm mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">🤖 {opponent.name}</div>
                  <div className="text-xs opacity-80">ELO: {opponent.elo}</div>
                </div>
                <Trophy className="h-4 w-4" />
              </div>
            </div>
          )}

          {aiThinking && isGameActive && (
            <div className="bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-2 rounded-lg text-sm mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mr-2"></div>
                <span>AI analyzing position...</span>
              </div>
            </div>
          )}

          {gameResult && (
            <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-3 py-2 rounded-lg text-sm mb-4">
              <div className="font-semibold">🏁 Game Complete</div>
              <div className="text-xs">{gameResult}</div>
            </div>
          )}
        </div>

        {/* AI Level Selection */}
        <div className="p-6 border-b border-white/10 flex-1 overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-400" />
            Engine Difficulty
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {aiLevels.map((level) => (
              <button
                key={level.level}
                onClick={() => !isGameActive && setAiLevel(level.level)}
                disabled={isGameActive || isStartingGame}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  aiLevel === level.level
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/50 text-blue-300 shadow-lg'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold">{level.name}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xs ${i < level.stars ? 'text-yellow-400' : 'text-slate-600'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm opacity-75 mb-2">{level.description}</div>
                    <div className="text-xs font-mono bg-slate-700/50 px-2 py-1 rounded">
                      ELO: {level.elo}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Game Controls */}
        <div className="p-6">
          <div className="space-y-3">
            <button
              onClick={handleNewGame}
              disabled={isStartingGame}
              className="w-full flex items-center justify-center space-x-3 px-4 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-semibold"
            >
              {isStartingGame ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Initializing Engine...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5" />
                  <span>New Game</span>
                </>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center space-x-2 px-3 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10">
                <RotateCw className="h-4 w-4" />
                <span className="text-sm">Flip</span>
              </button>
              <button className="flex items-center justify-center space-x-2 px-3 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Setup</span>
              </button>
            </div>

            {isGameActive && (
              <button
                onClick={handleResign}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg"
              >
                <Flag className="h-5 w-5" />
                <span className="font-semibold">Resign Game</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Top Bar */}
        <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {opponent ? `vs ${opponent.name}` : 'Chess Engine'}
              </h2>
              <p className="text-slate-400">
                {isGameActive ? `Move ${Math.ceil(moveCount / 2)} • ${
                  moveCount % 2 === 0 ? 'Your turn' : "Engine's turn"
                } • ${formatTime(gameTime)}` : 'Select difficulty and start playing'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Game Stats */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(gameTime)}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Target className="h-4 w-4" />
                  <span>{moveCount} moves</span>
                </div>
                {aiThinking && (
                  <div className="flex items-center space-x-2 text-purple-400">
                    <Activity className="h-4 w-4 animate-pulse" />
                    <span>Thinking</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chess Board */}
        <div className="flex-1 flex items-center justify-center p-8">
          <ChessBoard />
        </div>

        {/* Bottom Status */}
        <div className="bg-white/5 backdrop-blur-xl border-t border-white/10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">Level {aiLevel}</div>
              <div className="text-sm text-slate-400">Engine Difficulty</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{formatTime(gameTime)}</div>
              <div className="text-sm text-slate-400">Game Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{moveCount}</div>
              <div className="text-sm text-slate-400">Moves Played</div>
            </div>
          </div>
        </div>
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

export default ProfessionalPlayPage;