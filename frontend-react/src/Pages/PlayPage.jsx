// frontend-react/src/Pages/PlayPage.jsx - גרסה נקיה עם כלי שחמט שעובדים
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { 
  Clock, 
  Target, 
  PlayCircle, 
  Settings, 
  RotateCw, 
  Flag, 
  Activity,
  Zap,
  Crown,
  Brain,
  Timer
} from 'lucide-react';

// ✅ Import the optimized FastChessBoard component
import FastChessBoard from '../components/ChessBoard/ChessBoard';
import appService from '../services/appService'; 
import { makeMove, newGame, loadGame } from '../store/slices/gameSlice';

// ✅ Try to import performance monitor, with fallback
let performanceMonitor = {
  trackApiCall: () => {},
  trackRender: () => {},
  trackMoveProcessing: () => {},
  runBenchmark: async () => ({ message: 'Performance monitoring not available' }),
  getReport: () => ({ summary: {} })
};

try {
  const perfModule = require('../utils/performanceMonitor');
  performanceMonitor = perfModule.default || performanceMonitor;
} catch (error) {
  console.log('📊 Performance monitoring not available');
}

const PlayPage = () => {
  const dispatch = useDispatch();
  
  // ✅ Optimized selector with shallow comparison for minimal re-renders
  const { fen, history, isGameOver, gameResult } = useSelector(state => ({
    fen: state.game.fen,
    history: state.game.history,
    isGameOver: state.game.isGameOver,
    gameResult: state.game.gameResult
  }), shallowEqual);
  
  // Game state
  const [isGameActive, setIsGameActive] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [aiLevel, setAiLevel] = useState(3);
  const [playerColor, setPlayerColor] = useState('white');
  const [gameTime, setGameTime] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);
  const [lastMoveResult, setLastMoveResult] = useState(null);
  const [gameError, setGameError] = useState(null);
  const [aiThinkTime, setAiThinkTime] = useState(0);
  const [pieceStyle, setPieceStyle] = useState('unicode');

  // ✅ הגדרות מהירות למנוע
  const speedSettings = [
    { name: 'Instant', time: 0.1, desc: 'Immediate response' },
    { name: 'Fast', time: 0.3, desc: 'Quick moves' },
    { name: 'Normal', time: 0.5, desc: 'Balanced play' },
    { name: 'Slow', time: 1.0, desc: 'Thoughtful moves' }
  ];
  const [speedSetting, setSpeedSetting] = useState(1); // Fast by default

  // Timer effect
  useEffect(() => {
    let interval;
    if (isGameActive && !isGameOver) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, isGameOver]);

  // ✅ AI thinking timer
  useEffect(() => {
    let interval;
    if (aiThinking) {
      setAiThinkTime(0);
      interval = setInterval(() => {
        setAiThinkTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [aiThinking]);

  // ✅ Performance monitoring effect
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const updatePerformanceDisplay = () => {
        const report = performanceMonitor.getReport();
        
        const clickElement = document.getElementById('click-response');
        if (clickElement && report.summary.clickToResponse) {
          const avg = report.summary.clickToResponse.average;
          clickElement.textContent = `Click: ${avg.toFixed(0)}ms`;
          clickElement.className = avg > 100 ? 'text-red-400 font-mono' : 'text-green-400 font-mono';
        }
        
        const moveElement = document.getElementById('move-time');
        if (moveElement && report.summary.moveProcessing) {
          const avg = report.summary.moveProcessing.average;
          moveElement.textContent = `Move: ${avg.toFixed(0)}ms`;
          moveElement.className = avg > 1000 ? 'text-red-400 font-mono' : 'text-blue-400 font-mono';
        }
      };
      
      const interval = setInterval(updatePerformanceDisplay, 2000);
      return () => clearInterval(interval);
    }
  }, []);

  // ✅ AppService initialization
  useEffect(() => {
    const initializeGame = async () => {
      try {
        await appService.initialize();
        console.log('✅ PlayPage: AppService initialized');
      } catch (error) {
        console.error('❌ PlayPage: Failed to initialize:', error);
        setGameError('Failed to initialize game service');
      }
    };
    
    initializeGame();
    
    // Cleanup על ניתוק
    return () => {
      if (appService.chess) {
        appService.chess.off('gameStart');
        appService.chess.off('moveMade');
        appService.chess.off('gameEnd');
        appService.chess.off('error');
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatThinkTime = (seconds) => {
    return `${seconds.toFixed(1)}s`;
  };

  // ✅ Setup chess listeners
  const setupChessListeners = useCallback(() => {
    if (!appService.chess) return;
    
    console.log('🔧 Setting up chess listeners...');
    
    // נקה listeners קודמים
    appService.chess.off('connected');
    appService.chess.off('gameStart');
    appService.chess.off('moveMade');
    appService.chess.off('gameEnd');
    appService.chess.off('error');
    appService.chess.off('message');
    
    // Setup חדש - צריך להאזין לכל סוגי ההודעות
    appService.chess.on('connected', (data) => {
      console.log('✅ Chess connected:', data);
    });
    
    appService.chess.on('gameStart', (data) => {
      console.log('🎮 Chess game started:', data);
      setIsGameActive(true);
      setAiThinking(false);
      setLastMoveResult({ ...data, type: 'game_start' });
    });
    
    appService.chess.on('moveMade', (data) => {
      console.log('♟️ Move made:', data);
      setMoveCount(prev => prev + 1);
      setLastMoveResult(data);
      setAiThinking(false);
      
      // עדכן את Redux state
      if (data.move) {
        dispatch(makeMove({ 
          from: data.move.slice(0, 2), 
          to: data.move.slice(2, 4),
          fen: data.fen 
        }));
      }
    });
    
    appService.chess.on('gameEnd', (data) => {
      console.log('🏁 Chess game ended:', data);
      setIsGameActive(false);
      setAiThinking(false);
      setLastMoveResult({ ...data, type: 'game_end' });
    });
    
    appService.chess.on('error', (error) => {
      console.error('❌ Chess error:', error);
      setGameError(error.message || 'Game error occurred');
      setIsGameActive(false);
      setAiThinking(false);
    });
    
    // האזנה כללית להודעות - לדיבוג
    appService.chess.on('message', (data) => {
      console.log('📨 Chess message received:', data);
      
      // טיפול ידני במקרה שאירועים ספציפיים לא עובדים
      if (data.type === 'move_made') {
        console.log('🔄 Handling move_made manually');
        setMoveCount(prev => prev + 1);
        setLastMoveResult(data.data);
        setAiThinking(false);
        
        if (data.data.move) {
          dispatch(makeMove({ 
            from: data.data.move.slice(0, 2), 
            to: data.data.move.slice(2, 4),
            fen: data.data.fen 
          }));
        }
      }
    });
    
  }, [dispatch]);

  // ✅ התחלת משחק מהיר
  const handleNewGame = async () => {
    console.log('🔴 handleNewGame called!'); // DEBUG: בדיקה שהפונקציה נקראת
    
    try {
      setIsStartingGame(true);
      setGameError(null);
      setAiThinkTime(0);
      
      console.log('🎮 Starting FAST game...', { aiLevel, playerColor, speed: speedSettings[speedSetting] });
      console.log('🔍 AppService status:', appService?.getStatus()); // DEBUG
      
      // ✅ החלפה ל-AppService
      console.log('📞 Calling appService.startNewGame...'); // DEBUG
      await appService.startNewGame({
        aiLevel: aiLevel,
        playerColor: playerColor,
        timeControl: '10+0'
      });
      
      // Setup chess listeners
      console.log('🔧 Setting up chess listeners...'); // DEBUG
      setupChessListeners();
      
      console.log('✅ Game started quickly');
      
      setIsGameActive(true);
      setGameTime(0);
      setMoveCount(0);
      setLastMoveResult({ message: 'Game started!' });
      
      dispatch(newGame());
      
    } catch (error) {
      console.error('❌ Failed to start game:', error);
      setGameError(error.message || 'Failed to start game');
    } finally {
      setIsStartingGame(false);
    }
  };

  // ✅ מהלכים מהירים עם מעקב ביצועים
  const handleMove = useCallback(async (move) => {
    if (!isGameActive || aiThinking) {
      console.log('🚫 Move blocked:', { isGameActive, aiThinking });
      return false;
    }

    const moveStartTime = performance.now();
    
    try {
      console.log('🎯 Making FAST move:', move);
      setAiThinking(true);
      setGameError(null);
      setAiThinkTime(0);

      const uciMove = typeof move === 'string' ? move : `${move.from}${move.to}${move.promotion || ''}`;
      console.log('📤 Sending UCI move:', uciMove);
      
      const apiStartTime = performance.now();
      
      // ✅ החלפה ל-AppService
      const success = appService.chess.makeMove(uciMove);
      
      if (success) {
        performanceMonitor.trackApiCall('makeMove', apiStartTime);
        console.log('✅ Move sent successfully, waiting for response...');
        
        // עדכן מיד את ה-UI עם המהלך שלנו
        const uiUpdateStart = performance.now();
        dispatch(makeMove(move));
        setMoveCount(prev => prev + 1);
        
        performanceMonitor.trackRender('moveUpdate', uiUpdateStart);
        performanceMonitor.trackMoveProcessing({ move: uciMove, success: true }, moveStartTime);
        
        // אל תסיר את setAiThinking כי אנחנו מחכים לתגובת AI
        // זה יוסר ב-listener כשנקבל תגובה
        
        return true;
      } else {
        console.error('❌ Failed to send move');
        setGameError('Failed to send move');
        setAiThinking(false);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Move failed:', error);
      setGameError(error.message || 'Move failed');
      setAiThinking(false);
      performanceMonitor.trackMoveProcessing({ move: move, error: error.message }, moveStartTime, performance.now());
      return false;
    }
  }, [isGameActive, aiThinking, dispatch]);

  const handleResign = async () => {
    if (!isGameActive) return;
    
    try {
      // ✅ החלפה ל-AppService
      appService.chess.resignGame();
      setIsGameActive(false);
      console.log('🏳️ Game resigned');
    } catch (error) {
      console.error('❌ Resign failed:', error);
    }
  };

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
               isStartingGame ? 'Starting Game...' : 'Ready to Play'}
            </span>
            {aiThinking && (
              <div className="flex items-center space-x-2 text-purple-400">
                <Activity className="h-4 w-4 animate-spin" />
                <span className="text-sm">{formatThinkTime(aiThinkTime)}</span>
              </div>
            )}
          </div>
          
          {/* Error Display */}
          {gameError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{gameError}</p>
            </div>
          )}
          
          {/* Quick Status */}
          {lastMoveResult && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                {lastMoveResult.message || `Status: ${lastMoveResult.type || 'active'}`}
              </p>
              {lastMoveResult.ai_move && (
                <p className="text-blue-300 text-sm">
                  Last: {lastMoveResult.ai_move.san}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ✅ Speed Settings */}
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-400" />
            Game Speed
          </h3>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            {speedSettings.map((setting, index) => (
              <button
                key={index}
                onClick={() => setSpeedSetting(index)}
                disabled={isGameActive}
                className={`p-3 rounded-lg border transition-all duration-300 text-sm ${
                  speedSetting === index
                    ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <div className="font-medium">{setting.name}</div>
                <div className="text-xs opacity-75">{setting.time}s</div>
              </button>
            ))}
          </div>
        </div>

        {/* Engine Settings */}
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-400" />
            Engine Level
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Difficulty: Level {aiLevel}
              </label>
              <input
                type="range"
                min="1"
                max="8"
                value={aiLevel}
                onChange={(e) => setAiLevel(parseInt(e.target.value))}
                disabled={isGameActive}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Beginner</span>
                <span>Strong</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Play as
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPlayerColor('white')}
                  disabled={isGameActive}
                  className={`p-3 rounded-lg border transition-all duration-300 ${
                    playerColor === 'white'
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  ♔ White
                </button>
                <button
                  onClick={() => setPlayerColor('black')}
                  disabled={isGameActive}
                  className={`p-3 rounded-lg border transition-all duration-300 ${
                    playerColor === 'black'
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  ♚ Black
                </button>
              </div>
            </div>

            {/* ✅ Piece Style Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Piece Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPieceStyle('unicode')}
                  disabled={isGameActive}
                  className={`p-2 rounded-lg border transition-all duration-300 text-sm ${
                    pieceStyle === 'unicode'
                      ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  ♔♛ Unicode
                </button>
                <button
                  onClick={() => setPieceStyle('text')}
                  disabled={isGameActive}
                  className={`p-2 rounded-lg border transition-all duration-300 text-sm ${
                    pieceStyle === 'text'
                      ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  KQ Text
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="p-6 space-y-4">
          <button
            onClick={() => {
              console.log('🔴 Quick Game button clicked!'); // DEBUG
              handleNewGame();
            }}
            disabled={isStartingGame}
            className="w-full flex items-center justify-center space-x-3 px-4 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg disabled:opacity-50"
          >
            {isStartingGame ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Starting Fast Game...</span>
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5" />
                <span>Quick Game</span>
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

          {/* ✅ Development Tools */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <button
                onClick={() => {
                  console.log('🏃 Running performance test...');
                  performanceMonitor.runBenchmark().then(results => {
                    console.log('📊 Benchmark completed:', results);
                  });
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all duration-300 border border-purple-500/30 text-sm"
              >
                <Zap className="h-4 w-4" />
                <span>Performance Test</span>
              </button>
              
              <button
                onClick={() => {
                  console.log('🧪 Testing pieces: ♔♕♖♗♘♙ ♚♛♜♝♞♟');
                  console.log('Current FEN:', fen);
                  
                  // ✅ Manual test of piece display
                  if (window.testChessPieces) {
                    window.testChessPieces();
                  } else {
                    console.log('Test function not available');
                  }
                  
                  // ✅ Test direct mapping
                  const testPieces = ['K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p'];
                  testPieces.forEach(piece => {
                    console.log(`Direct test: ${piece} → should be symbol, got:`, piece);
                  });
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-500/20 text-green-300 rounded-xl hover:bg-green-500/30 transition-all duration-300 border border-green-500/30 text-sm"
              >
                <Crown className="h-4 w-4" />
                <span>Debug Pieces</span>
              </button>
            </>
          )}

          {isGameActive && (
            <button
              onClick={handleResign}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg"
            >
              <Flag className="h-5 w-5" />
              <span className="font-semibold">Resign</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Top Bar with AI Status */}
        <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                <span>Chess Engine Level {aiLevel}</span>
                {speedSettings[speedSetting] && (
                  <span className="text-yellow-400 text-lg">⚡ {speedSettings[speedSetting].name}</span>
                )}
              </h2>
              <p className="text-slate-400">
                {isGameActive ? `Move ${Math.ceil(moveCount / 2)} • ${
                  aiThinking ? 'AI thinking...' : 'Your turn'
                } • ${formatTime(gameTime)}` : 'Fast chess with quick responses'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
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
                    <Timer className="h-4 w-4 animate-pulse" />
                    <span>{formatThinkTime(aiThinkTime)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Chess Board with debugging */}
        <div className="flex-1 flex items-center justify-center p-8">
          <FastChessBoard 
            size={480}
            interactive={isGameActive && !aiThinking}
            disabled={!isGameActive || aiThinking}
            onMove={handleMove}
            playerColor={playerColor}
            showCoordinates={true}
            pieceStyle={pieceStyle}
            key={pieceStyle} // ✅ Force re-render when piece style changes
          />
        </div>

        {/* Bottom Status with Performance Info */}
        <div className="bg-white/5 backdrop-blur-xl border-t border-white/10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">Level {aiLevel}</div>
              <div className="text-sm text-slate-400">Engine Strength</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{speedSettings[speedSetting].name}</div>
              <div className="text-sm text-slate-400">Game Speed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{formatTime(gameTime)}</div>
              <div className="text-sm text-slate-400">Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{moveCount}</div>
              <div className="text-sm text-slate-400">Moves</div>
            </div>
          </div>
          
          {/* ✅ Performance Monitor Display */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="text-green-400 font-mono" id="click-response">
                    Click: --ms
                  </div>
                  <div className="text-slate-500">Response Time</div>
                </div>
                <div>
                  <div className="text-blue-400 font-mono" id="move-time">
                    Move: --ms
                  </div>
                  <div className="text-slate-500">Processing</div>
                </div>
                <div>
                  <div className="text-yellow-400 font-mono" id="ai-time">
                    AI: {formatThinkTime(aiThinkTime)}
                  </div>
                  <div className="text-slate-500">Think Time</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default PlayPage;