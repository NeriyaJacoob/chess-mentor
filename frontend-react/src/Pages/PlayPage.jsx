// PlayPage - Updated for Simple Chess API
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  RotateCcw, 
  RotateCw, 
  Square, 
  Flag,
  Settings,
  Trophy,
  Brain,
  Zap,
  Clock
} from 'lucide-react';
import ChessBoard from '../components/ChessBoard/ChessBoard';
import { loadGame, newGame, setPlayerColor, makeMove } from '../store/slices/gameSlice';
import chessApiService from '../services/chessApiService';

const PlayPage = () => {
  const dispatch = useDispatch();
  const { fen, moveCount, playerColor, history, isGameOver } = useSelector(state => state.game);
  
  // Local state for API-based game
  const [aiLevel, setAiLevel] = useState(5);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [error, setError] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  // Initialize service status
  useEffect(() => {
    const checkGameStatus = () => {
      const isActive = chessApiService.isGameActive();
      setIsGameActive(isActive);
      
      if (!isActive) {
        setOpponent(null);
        setGameResult(null);
      }
    };
    
    checkGameStatus();
  }, []);

  // Handle moves from ChessBoard component
  const handleMove = async (move) => {
    if (!isGameActive || aiThinking || isGameOver) {
      console.log('🚫 Move blocked:', { isGameActive, aiThinking, isGameOver });
      return Promise.resolve(false);
    }

    try {
      setError(null);
      setAiThinking(true);
      
      console.log('🎯 PlayPage: Making move:', move);
      
      // Make move via API
      const result = await chessApiService.makeMove(move);
      
      if (result.success) {
        // Update Redux state with new position
        dispatch(loadGame({ 
          fen: result.position.fen,
          history: [] // We'll track history differently for API games
        }));
        
        // Add moves to Redux for display
        if (result.player_move) {
          console.log(`♟️ Player: ${result.player_move.move} (${result.player_move.san})`);
        }
        
        if (result.ai_move) {
          console.log(`🤖 AI: ${result.ai_move.move} (${result.ai_move.san})`);
        }
        
        // Check if game ended
        if (result.game_over) {
          setGameResult(result.game_result);
          setIsGameActive(false);
          console.log(`🏁 Game Over: ${result.game_result}`);
        }
        
        setAiThinking(false);
        return Promise.resolve(true);
      } else {
        setError('Invalid move');
        setAiThinking(false);
        return Promise.resolve(false);
      }
    } catch (error) {
      console.error('❌ Move error:', error);
      setError(error.response?.data?.detail || error.message || 'Move failed');
      setAiThinking(false);
      return Promise.resolve(false);
    }
  };

  const handleNewGame = async () => {
    try {
      setIsStartingGame(true);
      setError(null);
      setGameResult(null);
      
      console.log(`🎮 Starting new game - AI Level ${aiLevel}`);
      
      // Start new game via API
      const result = await chessApiService.newGame(aiLevel, 'white');
      
      if (result.success) {
        // Update Redux with initial position
        dispatch(newGame());
        dispatch(setPlayerColor('white'));
        dispatch(loadGame({ 
          fen: result.position.fen,
          history: []
        }));
        
        // Update local state
        setIsGameActive(true);
        setOpponent({
          name: `ChessMentor AI (Level ${result.ai_level})`,
          elo: result.ai_elo,
          level: result.ai_level
        });
        
        // If AI made first move (player is black)
        if (result.ai_move) {
          console.log(`🤖 AI opened with: ${result.ai_move.move}`);
        }
        
        console.log(`✅ Game started: ${result.game_id.slice(0, 8)}`);
      }
    } catch (error) {
      console.error('❌ Failed to start game:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to start game');
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleResign = async () => {
    if (!isGameActive) return;
    
    try {
      setError(null);
      const result = await chessApiService.resign();
      
      if (result.success) {
        setGameResult(result.result);
        setIsGameActive(false);
        console.log(`🏳️ Resigned: ${result.result}`);
      }
    } catch (error) {
      console.error('❌ Resign error:', error);
      setError(error.response?.data?.detail || error.message || 'Resign failed');
    }
  };

  const handleFlipBoard = () => {
    const newColor = playerColor === 'white' ? 'black' : 'white';
    dispatch(setPlayerColor(newColor));
  };

  const handleAILevelChange = (newLevel) => {
    if (isGameActive) {
      setError('Cannot change AI level during game');
      return;
    }
    setAiLevel(newLevel);
    console.log(`🎯 AI level set to: ${newLevel}`);
  };

  const aiLevels = [
    { level: 1, name: 'Beginner', elo: '800', description: 'Very easy, good for learning' },
    { level: 2, name: 'Novice', elo: '1000', description: 'Easy, makes obvious mistakes' },
    { level: 3, name: 'Amateur', elo: '1200', description: 'Casual player level' },
    { level: 4, name: 'Club Player', elo: '1400', description: 'Intermediate level' },
    { level: 5, name: 'Strong Club', elo: '1600', description: 'Challenging for most players' },
    { level: 6, name: 'Expert', elo: '1800', description: 'Advanced level' },
    { level: 7, name: 'Master', elo: '2000', description: 'Very strong player' },
    { level: 8, name: 'Strong Master', elo: '2200', description: 'Expert level play' },
    { level: 9, name: 'Grandmaster', elo: '2400', description: 'Professional strength' },
    { level: 10, name: 'Super GM', elo: '2600+', description: 'Maximum engine strength' }
  ];

  return (
    <div className="h-full flex bg-mesh">
      {/* Game Setup Panel */}
      <div className="w-80 modern-card border-r border-gray-200 flex flex-col">
        {/* Game Status */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              isGameActive ? 'bg-green-400 animate-pulse' : 
              isStartingGame ? 'bg-yellow-400 animate-pulse' :
              'bg-gray-400'
            }`}></div>
            <span className="text-sm font-medium">
              {isGameActive ? 'Game Active' : 
               isStartingGame ? 'Starting...' : 
               'Ready to Play'}
            </span>
            <div className="flex items-center text-xs text-blue-600">
              <Brain className="h-3 w-3 mr-1" />
              Stockfish API
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {opponent && isGameActive && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm mb-4">
              <div className="flex items-center justify-between">
                <span>🤖 {opponent.name}</span>
                <span className="flex items-center">
                  <Trophy className="h-3 w-3 mr-1" />
                  {opponent.elo}
                </span>
              </div>
            </div>
          )}

          {aiThinking && isGameActive && (
            <div className="bg-purple-50 border border-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                AI is thinking...
              </div>
            </div>
          )}

          {gameResult && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm mb-4">
              <div className="font-medium">🏁 Game Over</div>
              <div className="text-sm">{gameResult}</div>
            </div>
          )}
        </div>

        {/* AI Level Selection */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Difficulty</h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {aiLevels.map((level) => (
              <button
                key={level.level}
                onClick={() => handleAILevelChange(level.level)}
                disabled={isGameActive || isStartingGame}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  aiLevel === level.level
                    ? 'bg-blue-50 border-blue-500 text-blue-900'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{level.name}</div>
                    <div className="text-sm opacity-75">{level.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono">ELO {level.elo}</div>
                    <div className="text-lg">
                      {'★'.repeat(Math.min(level.level, 5))}
                      {'☆'.repeat(Math.max(0, 5 - level.level))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Game Controls */}
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Game Controls</h4>
          <div className="space-y-3">
            <button
              onClick={handleNewGame}
              disabled={isStartingGame}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStartingGame ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Square className="h-5 w-5" />
                  <span className="font-medium">New Game</span>
                </>
              )}
            </button>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleFlipBoard}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCw className="h-4 w-4" />
                <span className="text-sm">Flip Board</span>
              </button>
            </div>

            {isGameActive && (
              <button
                onClick={handleResign}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Flag className="h-5 w-5" />
                <span className="font-medium">Resign</span>
              </button>
            )}
          </div>
        </div>

        {/* Game Information */}
        <div className="p-6 flex-1">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Game Information</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`font-medium px-2 py-1 rounded text-xs ${
                isGameActive ? 'bg-green-100 text-green-800' :
                gameResult ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {isGameActive ? 'Playing' :
                 gameResult ? 'Finished' : 'Ready'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Moves</span>
              <span className="font-medium text-gray-900">{moveCount}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Playing as</span>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  playerColor === 'white' ? 'bg-gray-100 border-2 border-gray-400' : 'bg-gray-800'
                }`}></div>
                <span className="font-medium text-gray-900 capitalize">{playerColor}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI Level</span>
              <span className="font-medium text-gray-900">{aiLevel}/10</span>
            </div>

            {chessApiService.getCurrentGameId() && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Game ID</span>
                <span className="font-mono text-xs text-gray-500">
                  {chessApiService.getCurrentGameId().slice(0, 8)}...
                </span>
              </div>
            )}
          </div>

          {/* API Service Status */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 space-y-1">
              <div>🔗 API: localhost:5001</div>
              <div>🤖 Engine: Stockfish</div>
              <div>⚡ Mode: HTTP REST</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col">
        {/* Game Header */}
        <div className="modern-card border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {opponent ? `Playing vs ${opponent.name}` : 'Chess vs AI'}
              </h2>
              <p className="text-gray-600">
                {isGameActive ? `Move ${Math.ceil(moveCount / 2)} - ${
                  moveCount % 2 === 0 ? 'Your turn' : "AI's turn"
                }` : 'Ready to start a new game'}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {aiThinking && (
                <div className="flex items-center text-purple-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                  <span className="text-sm">AI Thinking</span>
                </div>
              )}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chess Board */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <ChessBoard 
              onMove={handleMove}
              disabled={!isGameActive || aiThinking}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayPage;