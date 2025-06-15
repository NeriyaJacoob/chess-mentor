// src/components/Coach/CoachChat.js
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { sendToCoach, clearMessages, clearError } from '../../store/slices/coachSlice';

const CoachChat = () => {
  const dispatch = useDispatch();
  const { messages, isLoading, error } = useSelector(state => state.coach);
  const { fen } = useSelector(state => state.game);
  const [inputMessage, setInputMessage] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');

    dispatch(sendToCoach({
      message,
      gameState: fen,
      analysisType
    }));
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  const quickQuestions = [
    'מה המהלך הטוב ביותר במצב הנוכחי?',
    'אילו עקרונות אסטרטגיים חשובים כאן?',
    'האם יש טקטיקות שאני מפספס?',
    'כיצד אוכל לשפר את המיקום שלי?',
    'מה הרעיון הראשי בפתיחה הזו?',
  ];

  const analysisTypes = [
    { value: 'general', label: '💬 כללי', description: 'שאלות כלליות' },
    { value: 'position', label: '📋 מיקום', description: 'ניתוח מיקום' },
    { value: 'move', label: '♟️ מהלך', description: 'הערכת מהלך' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="text-2xl mr-2">🤖</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">מאמן GPT</h3>
            <p className="text-xs text-gray-500">מומחה שחמט אישי</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => dispatch(clearMessages())}
            className="text-gray-400 hover:text-gray-600 text-sm"
            title="נקה שיחה"
          >
            🗑️
          </button>
          {error && (
            <button
              onClick={() => dispatch(clearError())}
              className="text-red-400 hover:text-red-600 text-sm"
              title="נקה שגיאה"
            >
              ❌
            </button>
          )}
        </div>
      </div>

      {/* Analysis Type Selector */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex space-x-1">
          {analysisTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setAnalysisType(type.value)}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-colors
                ${analysisType === type.value
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
              title={type.description}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-sm mb-4">שלום! אני המאמן שלך.</p>
            <p className="text-xs text-gray-400 mb-4">
              שאל אותי כל שאלה על המיקום הנוכחי או על שחמט בכלל
            </p>
            
            {/* Quick Questions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">שאלות מהירות:</p>
              {quickQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="block w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] p-3 rounded-lg text-sm
                    ${message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                    }
                  `}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 opacity-70`}>
                    {new Date(message.timestamp).toLocaleTimeString('he-IL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {message.analysisType && message.type === 'coach' && (
                      <span className="ml-2">
                        {analysisTypes.find(t => t.value === message.analysisType)?.label}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">המאמן חושב...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex items-center">
              <svg className="h-4 w-4 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="שאל את המאמן..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default CoachChat;