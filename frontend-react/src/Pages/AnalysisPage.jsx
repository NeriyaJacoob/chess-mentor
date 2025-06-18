// AnalysisPage - board evaluation tools
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Clock, 
  Target,
  Upload,
  Download,
  RotateCcw,
  Play,
  Pause,
  SkipForward,
  SkipBack
} from 'lucide-react';
import ChessBoard from '../components/ChessBoard/ChessBoard';
import { sendToCoach } from '../store/slices/coachSlice';

const AnalysisPage = () => {
  const dispatch = useDispatch();
  const { fen, history } = useSelector(state => state.game);
  const { isAuthenticated } = useSelector(state => state.auth);
  const { isLoading: coachLoading } = useSelector(state => state.coach);
  
  const [analysisType, setAnalysisType] = useState('position');
  const [engineEval, setEngineEval] = useState('+0.3');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [moveIndex, setMoveIndex] = useState(history.length - 1);

  const analysisTypes = [
    { id: 'position', label: 'Position', icon: Target, description: 'Analyze current position' },
    { id: 'game', label: 'Full Game', icon: Clock, description: 'Analyze entire game' },
    { id: 'opening', label: 'Opening', icon: Play, description: 'Opening analysis' },
    { id: 'endgame', label: 'Endgame', icon: TrendingUp, description: 'Endgame technique' }
  ];

  const bestMoves = [
    { move: 'Nf3', eval: '+0.4', description: 'Best move - develops knight' },
    { move: 'e4', eval: '+0.3', description: 'Good - controls center' },
    { move: 'd4', eval: '+0.2', description: 'Solid - Queen\'s pawn opening' },
    { move: 'c4', eval: '+0.1', description: 'Interesting - English opening' }
  ];

  const handleAnalyzePosition = () => {
    if (!isAuthenticated) return;
    
    const analysisPrompt = `Analyze this chess position: ${fen}. 
    Focus on: tactical opportunities, strategic themes, piece activity, and best moves.`;
    
    dispatch(sendToCoach({
      message: analysisPrompt,
      gameState: fen,
      analysisType: 'position'
    }));
  };

  const handleGameAnalysis = () => {
    if (!isAuthenticated) return;
    
    const gameAnalysisPrompt = `Analyze this complete chess game. 
    PGN: ${history.map(move => move.san).join(' ')}
    
    Please provide:
    1. Overall game assessment
    2. Critical moments and turning points
    3. Strategic themes
    4. Tactical opportunities missed
    5. Recommendations for improvement`;
    
    dispatch(sendToCoach({
      message: gameAnalysisPrompt,
      gameState: fen,
      analysisType: 'game'
    }));
  };

  return (
    <div className="h-full flex bg-mesh">
      {/* Analysis Controls */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Analysis Type Selection */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Type</h3>
          <div className="space-y-2">
            {analysisTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setAnalysisType(type.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    analysisType === type.id
                      ? 'bg-purple-50 border-purple-200 text-purple-900'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm opacity-75">{type.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Engine Evaluation */}
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Engine Evaluation</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Position Score</span>
              <span className={`font-bold text-lg ${
                engineEval.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {engineEval}
              </span>
            </div>
            
            {/* Evaluation Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: '60%' }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Black</span>
              <span>Equal</span>
              <span>White</span>
            </div>
          </div>
        </div>

        {/* Best Moves */}
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Best Moves</h4>
          <div className="space-y-2">
            {bestMoves.slice(0, 4).map((move, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <span className="font-mono font-medium">{move.move}</span>
                </div>
                <span className={`text-sm font-medium ${
                  move.eval.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {move.eval}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Actions */}
        <div className="p-6 flex-1">
          <h4 className="text-md font-semibold text-gray-900 mb-4">AI Analysis</h4>
          <div className="space-y-3">
            <button
              onClick={handleAnalyzePosition}
              disabled={!isAuthenticated || coachLoading}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Brain className="h-5 w-5" />
              <span className="font-medium">
                {coachLoading ? 'Analyzing...' : 'Analyze Position'}
              </span>
            </button>
            
            <button
              onClick={handleGameAnalysis}
              disabled={!isAuthenticated || coachLoading || history.length === 0}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-5 w-5" />
              <span className="font-medium">Analyze Game</span>
            </button>

            {!isAuthenticated && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Connect to GPT Coach to enable AI analysis
                </p>
              </div>
            )}
          </div>

          {/* Import/Export */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Import/Export</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Load PGN</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="h-4 w-4" />
                <span className="text-sm">Export PGN</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Area */}
      <div className="flex-1 flex flex-col">
        {/* Analysis Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Position Analysis</h2>
              <p className="text-gray-600">
                Move {Math.ceil(history.length / 2)} - {history.length % 2 === 0 ? 'Black' : 'White'} to move
              </p>
            </div>
            
            {/* Game Navigation */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setMoveIndex(0)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={moveIndex <= 0}
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setMoveIndex(Math.max(0, moveIndex - 1))}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={moveIndex <= 0}
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`p-2 rounded-lg transition-colors ${
                  isAutoPlay 
                    ? 'text-blue-600 bg-blue-100' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isAutoPlay ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button 
                onClick={() => setMoveIndex(Math.min(history.length - 1, moveIndex + 1))}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={moveIndex >= history.length - 1}
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chess Board */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <ChessBoard />
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <div className="text-sm text-gray-600">Position Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-sm text-gray-600">Good Moves</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">3</div>
              <div className="text-sm text-gray-600">Mistakes</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Coach Panel */}
      <div className="w-96 bg-white border-l border-gray-200">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Analysis</h3>
          </div>
          
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">Position Assessment</h4>
                <p className="text-purple-800 text-sm">
                  White has a slight advantage due to better piece coordination. 
                  The knight on f3 is well-placed and supports the center.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Tactical Opportunities</h4>
                <p className="text-blue-800 text-sm">
                  Look for potential forks with the knight. The black king 
                  position suggests potential back-rank tactics.
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Strategic Plan</h4>
                <p className="text-green-800 text-sm">
                  Focus on controlling the center squares and improving 
                  piece coordination before launching an attack.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">AI Coach Offline</h4>
              <p className="text-gray-600 text-sm mb-4">
                Connect your OpenAI API key to get detailed position analysis
              </p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Setup Coach
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;