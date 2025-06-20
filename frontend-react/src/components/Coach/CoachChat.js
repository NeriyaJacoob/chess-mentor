import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  Send, 
  Trash2, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Zap, 
  Clock, 
  MessageCircle,
  Sparkles,
  BookOpen,
  ChevronDown,
  Cpu,
  Activity,
  Bot
} from 'lucide-react';

const ProfessionalCoachPanel = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'coach',
      content: 'Hello! I\'m your AI Chess Coach powered by advanced analysis engines. I can help you with position evaluation, tactical analysis, strategic planning, and opening theory. What would you like to explore?',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      analysisType: 'general'
    }
  ]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const analysisTypes = [
    { value: 'general', label: '💬 General', description: 'General questions', color: 'from-blue-500/20 to-cyan-500/20' },
    { value: 'position', label: '📋 Position', description: 'Position analysis', color: 'from-purple-500/20 to-violet-500/20' },
    { value: 'tactics', label: '⚡ Tactics', description: 'Tactical evaluation', color: 'from-orange-500/20 to-red-500/20' },
    { value: 'strategy', label: '🎯 Strategy', description: 'Strategic planning', color: 'from-green-500/20 to-emerald-500/20' },
  ];

  const quickQuestions = [
    'What\'s the best move in this position?',
    'How can I improve my position?',
    'Are there any tactical opportunities?',
    'What\'s the main strategic idea here?',
    'How should I continue this opening?',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      analysisType
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const coachResponse = {
        id: Date.now() + 1,
        type: 'coach',
        content: generateMockResponse(userMessage.content, analysisType),
        timestamp: new Date().toISOString(),
        analysisType
      };
      setMessages(prev => [...prev, coachResponse]);
      setIsLoading(false);
    }, 2000);
  };

  const generateMockResponse = (message, type) => {
    const responses = {
      general: [
        "That's an excellent question! In this type of position, you want to focus on piece coordination and central control. The key principles to remember are: 1) Develop with purpose, 2) Control the center, 3) Keep your king safe.",
        "Great observation! This position offers several interesting possibilities. Let me break down the key factors you should consider..."
      ],
      position: [
        "Looking at this position through the engine's eyes: White has a slight advantage (+0.3) due to better piece activity. The knight on f3 is well-placed, and the central pawn structure favors White's development plan.",
        "This is a fascinating position! The material is equal, but White's pieces are more harmoniously placed. I'd recommend focusing on the queenside expansion while maintaining central tension."
      ],
      tactics: [
        "Sharp tactical eye! There's indeed a tactical motif here. Look for the knight fork pattern - if you can maneuver your knight to e5, you'll create multiple threats simultaneously.",
        "Excellent tactical awareness! The position is rich with combinative possibilities. The key tactical themes here are pins, forks, and discovered attacks."
      ],
      strategy: [
        "Strategically speaking, this position revolves around central control and piece activity. Your long-term plan should focus on improving your worst-placed piece while restricting your opponent's counterplay.",
        "From a strategic standpoint, you're at a critical juncture. The pawn structure suggests a kingside attack is feasible, but you must first consolidate your central position."
      ]
    };
    
    const typeResponses = responses[type] || responses.general;
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnalysisTypeInfo = (type) => {
    return analysisTypes.find(t => t.value === type) || analysisTypes[0];
  };

  return (
    <div className="w-96 bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col h-full">
      
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">AI Chess Coach</h3>
              <p className="text-xs text-slate-400">Advanced analysis & guidance</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Online</span>
            </div>
            <button
              onClick={clearMessages}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Analysis Type Selector */}
        <div className="grid grid-cols-2 gap-2">
          {analysisTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setAnalysisType(type.value)}
              className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                analysisType === type.value
                  ? `bg-gradient-to-r ${type.color} text-white border border-white/20`
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
              }`}
              title={type.description}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Engine Status */}
      <div className="px-6 py-3 border-b border-white/10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-slate-400">
            <Cpu className="h-4 w-4" />
            <span>Stockfish 15</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Activity className="h-4 w-4" />
            <span>Depth: 22</span>
          </div>
          <div className="flex items-center space-x-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Ready</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <Bot className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-white font-semibold mb-2">Welcome to AI Coach</p>
            <p className="text-slate-400 text-sm mb-6">
              Ask me anything about your chess position, tactics, or strategy
            </p>
            
            {/* Quick Questions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quick Questions:</p>
              {quickQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="block w-full text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-all duration-200 border border-blue-500/20 hover:border-blue-500/40"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`p-4 rounded-2xl shadow-lg border ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500/30'
                        : 'bg-white/10 text-slate-100 border-white/20 backdrop-blur-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    <div className={`flex items-center justify-between mt-3 pt-2 border-t ${
                      message.type === 'user' ? 'border-white/20' : 'border-white/10'
                    }`}>
                      <div className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </div>
                      {message.analysisType && message.type === 'coach' && (
                        <div className="text-xs px-2 py-1 bg-white/10 rounded-full border border-white/20">
                          {getAnalysisTypeInfo(message.analysisType).label}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Avatar */}
                  <div className={`flex items-center mt-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-blue-500' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                    }`}>
                      {message.type === 'user' ? (
                        <span className="text-white text-xs font-bold">Y</span>
                      ) : (
                        <Brain className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-slate-400">Coach is analyzing...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/10">
        <div className="space-y-3">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask your chess coach..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-slate-400 text-sm resize-none backdrop-blur-sm transition-all duration-200"
              rows="3"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute bottom-2 right-2">
              <button
                onClick={handleSubmit}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <div className="flex items-center space-x-1">
              <Sparkles className="h-3 w-3" />
              <span>AI-powered</span>
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

export default ProfessionalCoachPanel;