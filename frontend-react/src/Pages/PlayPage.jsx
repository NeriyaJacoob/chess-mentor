// PlayPage - main game interface
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  RotateCcw, 
  RotateCw, 
  Square, 
  Flag,
  Clock,
  Settings,
  Pause,
  Play
} from 'lucide-react';
import ChessBoard from '../components/ChessBoard/ChessBoard';
import { newGame, undoMove, setPlayerColor, loadGame } from '../store/slices/gameSlice';
import chessSocketService from '../services/chessSocketService';

const PlayPage = () => {
  const dispatch = useDispatch();
  const { moveCount, playerColor, history, isGameOver, gameResult } = useSelector(state => state.game);
  const [gameMode, setGameMode] = useState('ai');
  const [aiLevel, setAiLevel] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnectedToServer, setIsConnectedToServer] = useState(false);
  const [isSearchingForGame, setIsSearchingForGame] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [serverError, setServerError] = useState(null);

  // Connect to chess server on component mount
  useEffect(() => {
    const connectToServer = async () => {
      try {
        await chessSocketService.connect({ 
          name: 'Player', 
          elo: 1200 
        });
        setIsConnectedToServer(true);
        setServerError(null);
        console.log('✅ Connected to chess server');
      } catch (error) {
        setServerError('Failed to connect to chess server');
        console.error('❌ Connection failed:', error);
      }
    };

    connectToServer();

    // Set up event handlers
    chessSocketService.onGameStart((data) => {
      console.log('🎮 Game started:', data);
      setIsSearchingForGame(false);
      setOpponent(data.opponent);
      
      // Load the game position
      if (data.position && data.position.fen) {
        dispatch(loadGame({ fen: data.position.fen }));
      }
      
      // Set player color
      dispatch(setPlayerColor(data.color));
    });

    chessSocketService.onMoveMade((data) => {
      console.log('♟️ Move made:', data);
      
      // Update the game position
      if (data.position && data.position.fen) {
        dispatch(loadGame({ fen: data.position.fen }));
      }
    });

    chessSocketService.onGameEnd((data) => {
      console.log('🏁 Game ended:', data.result);
      setOpponent(null);
      setIsSearchingForGame(false);
      // The game result will be handled by the chess board component
    });

    chessSocketService.onError((data) => {
      console.error('❌ Game error:', data.message);
      setServerError(data.message);
      setIsSearchingForGame(false);
    });

    chessSocketService.onSearching((data) => {
      console.log('🔍 Searching for opponent...');
      setIsSearchingForGame(true);
    });

    chessSocketService.onOpponentDisconnected((data) => {
      console.log('🔌 Opponent disconnected');
      setOpponent(null);
      setServerError('Opponent disconnected');
    });

    // Cleanup on unmount
    return () => {
      chessSocketService.disconnect();
      setIsConnectedToServer(false);
    };
  }, [dispatch]);

  const handleNewGame = () => {
    if (isConnectedToServer && chessSocketService.isConnected) {
      // Start online game
      chessSocketService.findGame(gameMode);
      setServerError(null);
    } else {
      // Start offline game
      dispatch(newGame());
    }
  };

  const handleUndoMove = () => {
    dispatch(undoMove());
  };

  const handleFlipBoard = () => {
    dispatch(setPlayerColor(playerColor === 'white' ? 'black' : 'white'));
  };

  const handleResign = () => {
    if (chessSocketService.isInGame()) {
      chessSocketService.resign();
    }
  };

  const gameModes = [
    { id: 'ai', label: 'vs AI', description: 'Play against computer' },
    { id: 'multiplayer', label: 'vs Player', description: 'Online multiplayer' },
    { id: 'analysis', label: 'Analysis', description: 'Free analysis mode' }
  ];

  const aiLevels = [
    { level: 1, name: 'Beginner', elo: '800-1000' },
    { level: 2, name: 'Casual', elo: '1000-1200' },
    { level: 3, name: 'Intermediate', elo: '1200-1400' },
    { level: 4, name: 'Advanced', elo: '1400-1600' },
    { level: 5, name: 'Expert', elo: '1600-1800' },
    { level: 6, name: 'Master', elo: '1800+' }
  ];

  return (
    <div className="h-full flex bg-mesh">
      {/* Game Setup Panel */}
      <div className="w-80 modern-card border-r border-gray-200 flex flex-col">
        {/* Connection Status */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              isConnectedToServer ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}></div>
            <span className="text-sm font-medium">
              {isConnectedToServer ? 'Connected to Server' : 'Offline Mode'}
            </span>
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
              {serverError}
            </div>
          )}

          {opponent && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm mb-4">
              Playing vs {opponent.name} (ELO: {opponent.elo})
            </div>
          )}
        </div>

        {/* Game Mode Selection */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Mode</h3>
          
          <div className="space-y-2">
            {gameModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setGameMode(mode.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  gameMode === mode.id
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{mode.label}</div>
                <div className="text-sm opacity-75">{mode.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Level Selection (only for AI mode) */}
        {gameMode === 'ai' && (
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-md font-semibold text-gray-900 mb-4">AI Difficulty</h4>
            <div className="space-y-2">
              {aiLevels.map((level) => (
                <button
                  key={level.level}
                  onClick={() => setAiLevel(level.level)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    aiLevel === level.level
                      ? 'bg-green-50 border-green-200 text-green-900'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{level.name}</div>
                      <div className="text-sm opacity-75">ELO: {level.elo}</div>
                    </div>
                    <div className="text-lg">
                      {'★'.repeat(Math.min(level.level, 5))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Game Controls */}
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Game Controls</h4>
          <div className="space-y-3">
            <button
              onClick={handleNewGame}
              disabled={isSearchingForGame}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="h-5 w-5" />
              <span className="font-medium">
                {isSearchingForGame ? 'Searching...' : 'New Game'}
              </span>
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleUndoMove}
                disabled={moveCount === 0 || chessSocketService.isInGame()}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-sm">Undo</span>
              </button>
              
              <button
                onClick={handleFlipBoard}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCw className="h-4 w-4" />
                <span className="text-sm">Flip</span>
              </button>
            </div>

            {chessSocketService.isInGame() && (
              <button
                onClick={handleResign}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Flag className="h-5 w-5" />
                <span className="font-medium">Resign</span>
              </button>
            )}

            <button
              onClick={() => setIsPaused(!isPaused)}
              disabled={chessSocketService.isInGame()}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              <span className="font-medium">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          </div>
        </div>

        {/* Game Status */}
        <div className="p-6 flex-1">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Game Status</h4>
          
          <div className="space-y-4">
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
              <span className="text-sm text-gray-600">Game Mode</span>
              <span className="font-medium text-gray-900 capitalize">{gameMode}</span>
            </div>

            {gameMode === 'ai' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Level</span>
                <span className="font-medium text-gray-900">{aiLevels[aiLevel - 1]?.name}</span>
              </div>
            )}

            {chessSocketService.isInGame() && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Game ID</span>
                <span className="font-mono text-xs text-gray-500">
                  {chessSocketService.getGameId()?.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>

          {/* Game Timer */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Game Time</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-gray-900">∞</div>
              <div className="text-sm text-gray-500">Unlimited</div>
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
                {gameMode === 'ai' ? `Playing vs AI Level ${aiLevel}` : 
                 opponent ? `Playing vs ${opponent.name}` : 'Chess Game'}
              </h2>
              <p className="text-gray-600">
                {isGameOver ? gameResult : `Move ${Math.ceil(moveCount / 2)} - ${playerColor === 'white' ? 
                  (moveCount % 2 === 0 ? 'Your turn' : 'Opponent\'s turn') : 
                  (moveCount % 2 === 1 ? 'Your turn' : 'Opponent\'s turn')}`}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chess Board Container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <ChessBoard />
          </div>
        </div>

        {/* Move History Panel */}
        <div className="modern-card border-t border-gray-200 p-4 h-48 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Move History</h3>
          
          {history.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {history.map((move, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm text-gray-500 w-8">{Math.floor(index / 2) + 1}.</span>
                  <span className="font-mono text-gray-900 flex-1">{move.san}</span>
                  {move.captured && (
                    <span className="text-sm text-red-600">×{move.captured}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Square className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No moves yet</p>
              <p className="text-sm">Start playing to see move history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayPage;