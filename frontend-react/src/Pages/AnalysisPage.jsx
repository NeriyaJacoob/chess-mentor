import React, { useState } from 'react';
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
  SkipBack,
  Activity,
  Eye,
  Cpu,
  BarChart3,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Lightbulb
} from 'lucide-react';

const ProfessionalAnalysisPage = () => {
  const [analysisType, setAnalysisType] = useState('position');
  const [engineEval, setEngineEval] = useState('+0.3');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [moveIndex, setMoveIndex] = useState(15);
  const [engineDepth, setEngineDepth] = useState(18);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysisTypes = [
    { 
      id: 'position', 
      label: 'Position Analysis', 
      icon: Target, 
      description: 'Deep position evaluation',
      color: 'from-blue-500/20 to-cyan-500/20',
      accent: 'text-blue-400'
    },
    { 
      id: 'game', 
      label: 'Full Game', 
      icon: Clock, 
      description: 'Complete game review',
      color: 'from-purple-500/20 to-violet-500/20',
      accent: 'text-purple-400'
    },
    { 
      id: 'opening', 
      label: 'Opening Book', 
      icon: Play, 
      description: 'Opening analysis',
      color: 'from-green-500/20 to-emerald-500/20',
      accent: 'text-green-400'
    },
    { 
      id: 'endgame', 
      label: 'Endgame', 
      icon: TrendingUp, 
      description: 'Endgame technique',
      color: 'from-orange-500/20 to-red-500/20',
      accent: 'text-orange-400'
    }
  ];

  const bestMoves = [
    { move: 'Nf3', eval: '+0.4', description: 'Best - develops knight to optimal square', depth: 22, nodes: '2.1M' },
    { move: 'e4', eval: '+0.3', description: 'Excellent - controls center', depth: 21, nodes: '1.8M' },
    { move: 'd4', eval: '+0.2', description: 'Good - solid Queen\'s pawn', depth: 20, nodes: '1.5M' },
    { move: 'c4', eval: '+0.1', description: 'Interesting - English opening', depth: 19, nodes: '1.2M' }
  ];

  const gameHistory = [
    { move: 1, white: 'e4', black: 'e5', eval: '+0.2', accuracy: 95 },
    { move: 2, white: 'Nf3', black: 'Nc6', eval: '+0.3', accuracy: 92 },
    { move: 3, white: 'Bb5', black: 'a6', eval: '+0.4', accuracy: 89 },
    { move: 4, white: 'Ba4', black: 'Nf6', eval: '+0.2', accuracy: 94 },
    { move: 5, white: 'O-O', black: 'Be7', eval: '+0.3', accuracy: 91 },
    { move: 6, white: 'Re1', black: 'b5', eval: '+0.1', accuracy: 88 },
    { move: 7, white: 'Bb3', black: 'd6', eval: '+0.2', accuracy: 85 },
    { move: 8, white: 'c3', black: 'O-O', eval: '+0.3', accuracy: 90 }
  ];

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  const getEvalColor = (...args) => {
  const evaluation = args[0]; // לא משתמשים בשם השמור
  const num = parseFloat(evaluation);
  if (num > 0.5) return 'text-green-400';
  if (num < -0.5) return 'text-red-400';
  return 'text-gray-300';
};




const getEvalWidth = (evaluation) => {
  const num = parseFloat(evaluation); // ← שימוש נכון בפרמטר
  const normalized = Math.max(0, Math.min(100, 50 + (num * 20)));
  return `${normalized}%`;
};

  const MockBoard = () => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-white/10 shadow-2xl">
      <div className="grid grid-cols-8 gap-0 max-w-[400px] mx-auto rounded-lg overflow-hidden bg-slate-300">
        {Array.from({ length: 64 }).map((_, i) => {
          const isLight = Math.floor(i / 8) % 2 === i % 2;
          const pieces = ['♜','♞','♝','♛','♚','♝','♞','♜'];
          const showPiece = i < 16 || i >= 48;
          const piece = showPiece ? (i < 16 ? pieces[i % 8] : pieces[7 - (i % 8)]) : null;
          
          return (
            <div 
              key={i}
              className={`aspect-square flex items-center justify-center text-2xl
                ${isLight ? 'bg-slate-200' : 'bg-slate-400'}
                ${(i === 28 || i === 35) ? 'ring-2 ring-blue-400 ring-opacity-70' : ''}
              `}
            >
              {piece && (
                <span className={`${i >= 48 ? 'text-white filter drop-shadow-lg' : 'text-black'}`}>
                  {piece}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Last move indicator */}
      <div className="mt-4 text-center">
        <div className="text-slate-400 text-sm">Last move: <span className="text-white font-mono">Nf3</span></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      
      {/* Left Analysis Panel */}
      <div className="w-80 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col">
        
        {/* Analysis Type Selection */}
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-400" />
            Analysis Engine
          </h3>
          <div className="space-y-2">
            {analysisTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setAnalysisType(type.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                    analysisType === type.id
                      ? `bg-gradient-to-r ${type.color} border-white/30 ${type.accent}`
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="font-semibold">{type.label}</div>
                      <div className="text-xs opacity-75 mt-1">{type.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Engine Evaluation */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-white flex items-center">
              <Cpu className="h-4 w-4 mr-2 text-green-400" />
              Stockfish Evaluation
            </h4>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Activity className="h-3 w-3" />
              <span>Depth {engineDepth}</span>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Position Score</span>
              <span className={`font-bold text-lg ${getEvalColor(engineEval)}`}>
                {engineEval}
              </span>
            </div>
            
            {/* Evaluation Bar */}
            <div className="relative w-full bg-slate-700 rounded-full h-3 mb-3 overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000"
                style={{ width: getEvalWidth(engineEval) }}
              ></div>
              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/50 transform -translate-x-0.5"></div>
            </div>
            
            <div className="flex justify-between text-xs text-slate-500">
              <span>Black Advantage</span>
              <span>Equal</span>
              <span>White Advantage</span>
            </div>
          </div>
        </div>

        {/* Best Moves */}
        <div className="p-6 border-b border-white/10 flex-1 overflow-y-auto">
          <h4 className="font-semibold text-white mb-4 flex items-center">
            <Target className="h-4 w-4 mr-2 text-yellow-400" />
            Engine Recommendations
          </h4>
          <div className="space-y-3">
            {bestMoves.map((move, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded text-xs font-bold flex items-center justify-center border border-blue-500/30">
                      {index + 1}
                    </div>
                    <span className="font-mono font-bold text-white">{move.move}</span>
                  </div>
                  <span className={`text-sm font-semibold ${getEvalColor(move.eval)}`}>
                    {move.eval}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mb-2">{move.description}</div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Depth: {move.depth}</span>
                  <span>Nodes: {move.nodes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Actions */}
        <div className="p-6">
          <div className="space-y-3">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center space-x-3 px-4 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  <span>Deep Analysis</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center space-x-2 px-3 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Import</span>
              </button>
              <button className="flex items-center justify-center space-x-2 px-3 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10">
                <Download className="h-4 w-4" />
                <span className="text-sm">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Analysis Header */}
        <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Deep Position Analysis</h2>
              <p className="text-slate-400">
                Move 16 • White to move • Stockfish depth {engineDepth}
              </p>
            </div>
            
            {/* Game Navigation */}
            <div className="flex items-center space-x-2">
              <button className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 border border-white/10">
                <SkipBack className="h-5 w-5" />
              </button>
              <button className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 border border-white/10">
                <RotateCcw className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`p-3 rounded-xl transition-all duration-300 border ${
                  isAutoPlay 
                    ? 'text-blue-400 bg-blue-500/20 border-blue-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/10 border-white/10'
                }`}
              >
                {isAutoPlay ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 border border-white/10">
                <SkipForward className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          
          {/* Chess Board */}
          <div className="flex-1 flex items-center justify-center p-8">
            <MockBoard />
          </div>

          {/* Move History & Analysis */}
          <div className="w-96 bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col">
            
            {/* Move History */}
            <div className="p-6 border-b border-white/10 flex-1 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-purple-400" />
                Game History
              </h3>
              
              <div className="space-y-2">
                {gameHistory.map((move, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-400 text-sm font-mono w-6">{move.move}.</span>
                        <span className="font-mono text-white">{move.white}</span>
                        <span className="font-mono text-slate-300">{move.black}</span>
                      </div>
                      <span className={`text-xs font-semibold ${getEvalColor(move.eval)}`}>
                        {move.eval}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          move.accuracy >= 90 ? 'bg-green-400' : 
                          move.accuracy >= 80 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                        <span className="text-xs text-slate-400">Accuracy: {move.accuracy}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Insights */}
            <div className="p-6">
              <h4 className="font-semibold text-white mb-4 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-400" />
                Key Insights
              </h4>
              
              <div className="space-y-3">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-semibold text-sm">Excellent Position</span>
                  </div>
                  <p className="text-green-300 text-xs">White maintains strong central control with optimal piece coordination.</p>
                </div>
                
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Target className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-400 font-semibold text-sm">Tactical Opportunity</span>
                  </div>
                  <p className="text-blue-300 text-xs">Consider Nf3-e5 fork, attacking knight and bishop simultaneously.</p>
                </div>
                
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-purple-400" />
                    <span className="text-purple-400 font-semibold text-sm">Strategic Plan</span>
                  </div>
                  <p className="text-purple-300 text-xs">Focus on kingside attack after completing development.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Analysis Summary */}
        <div className="bg-white/5 backdrop-blur-xl border-t border-white/10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">92%</div>
              <div className="text-sm text-slate-400">Move Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">7</div>
              <div className="text-sm text-slate-400">Tactical Shots</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">3</div>
              <div className="text-sm text-slate-400">Missed Chances</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">+0.3</div>
              <div className="text-sm text-slate-400">Final Evaluation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAnalysisPage;