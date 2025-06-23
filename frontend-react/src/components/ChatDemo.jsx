// frontend-react/src/components/ChatDemo.jsx - גרסה מתוקנת
import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, LogOut, MessageCircle, Wifi, WifiOff, User, AlertCircle } from 'lucide-react';
import appService from '../services/appService';

const ChatDemo = () => {
  // State management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});
  
  // Login form
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Chat
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState('general');
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const messagesEndRef = useRef(null);
  const wsListenersSetup = useRef(false);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 ChatDemo: Initializing...');
        await appService.initialize();
        updateStatus();
        
        if (appService.auth.isAuthenticated()) {
          console.log('✅ Already authenticated, setting up WebSocket...');
          setupWebSocketListeners();
        }
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setError('שגיאה באתחול האפליקציה');
      }
    };
    
    initializeApp();
    
    // Cleanup
    return () => {
      if (wsListenersSetup.current) {
        cleanupWebSocketListeners();
      }
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateStatus = () => {
    const status = appService.getStatus();
    setIsAuthenticated(status.auth.isAuthenticated);
    setUser(status.auth.user);
    setIsConnected(status.websocket.isConnected);
    setConnectionStatus(status.websocket);
    
    console.log('📊 Status updated:', {
      authenticated: status.auth.isAuthenticated,
      wsConnected: status.websocket.isConnected,
      user: status.auth.user?.username
    });
  };

  const setupWebSocketListeners = () => {
    if (wsListenersSetup.current) {
      console.log('⚠️ WebSocket listeners already setup');
      return;
    }

    console.log('🔧 Setting up WebSocket listeners...');
    const ws = appService.ws;
    
    // Connection events
    ws.on('connected', (data) => {
      console.log('✅ WebSocket connected:', data);
      setIsConnected(true);
      setError('');
      updateStatus();
      
      // Join default room
      setTimeout(() => {
        console.log(`🏠 Joining room: ${currentRoom}`);
        ws.joinRoom(currentRoom);
      }, 500);
      
      addSystemMessage('התחברת לצ\'אט בהצלחה! 🎉');
    });
    
    ws.on('disconnected', (data) => {
      console.log('🔌 WebSocket disconnected:', data);
      setIsConnected(false);
      updateStatus();
      addSystemMessage('החיבור לצ\'אט נותק ⚠️');
    });
    
    // Room events
    ws.on('roomJoined', (data) => {
      console.log('🏠 Joined room:', data);
      addSystemMessage(`הצטרפת לחדר: ${data.room_id}`);
    });
    
    ws.on('user_joined_room', (data) => {
      console.log('👤 User joined room:', data);
      if (data.user_id !== user?.user_id) {
        addSystemMessage(`${data.username} הצטרף לחדר`);
      }
      // עדכן רשימת משתמשים
      if (data.users) {
        setOnlineUsers(data.users);
      }
    });
    
    // Message events
    ws.on('room_message', (data) => {
      console.log('💬 Room message received:', data);
      addMessage(data);
    });
    
    ws.on('private_message', (data) => {
      console.log('📨 Private message received:', data);
      addMessage(data, true);
    });
    
    // Error handling
    ws.on('error', (data) => {
      console.error('❌ WebSocket error:', data);
      setError(data.message || 'שגיאת חיבור');
    });

    wsListenersSetup.current = true;
    console.log('✅ WebSocket listeners setup complete');
  };

  const cleanupWebSocketListeners = () => {
    if (!wsListenersSetup.current) return;
    
    console.log('🧹 Cleaning up WebSocket listeners...');
    const ws = appService.ws;
    
    ws.off('connected');
    ws.off('disconnected');
    ws.off('roomJoined');
    ws.off('user_joined_room');
    ws.off('room_message');
    ws.off('private_message');
    ws.off('error');
    
    wsListenersSetup.current = false;
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setError('נא להזין שם משתמש וסיסמה');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔄 ChatDemo: Attempting login...');
      const result = await appService.login(loginForm.username, loginForm.password);
      
      console.log('✅ Login successful:', result);
      setSuccess('התחברות הושלמה בהצלחה! 🎉');
      
      updateStatus();
      setupWebSocketListeners();
      
      setLoginForm({ username: '', password: '' });
      setMessages([]); // Clear previous messages
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      setError(error.message || 'שגיאה בהתחברות - בדוק שהשרת פועל');
    } finally {
      setIsLoading(false);
      // Clear success message after delay
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleLogout = async () => {
    try {
      cleanupWebSocketListeners();
      await appService.logout();
      
      updateStatus();
      setMessages([]);
      setOnlineUsers([]);
      setError('');
      setSuccess('');
      
      console.log('✅ Logout completed');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      setError('שגיאה בהתנתקות');
    }
  };

  const addMessage = (messageData, isPrivate = false) => {
    const message = {
      id: Date.now() + Math.random(),
      userId: messageData.user_id || messageData.from_user_id,
      username: getUserDisplayName(
        messageData.user_id || messageData.from_user_id, 
        messageData.username
      ),
      content: messageData.content || messageData.message,
      timestamp: new Date(messageData.timestamp || Date.now()),
      isPrivate: isPrivate,
      room: messageData.room_id || currentRoom
    };
    
    setMessages(prev => [...prev, message]);
  };

  const addSystemMessage = (content) => {
    const message = {
      id: Date.now() + Math.random(),
      userId: 'system',
      username: 'מערכת',
      content: content,
      timestamp: new Date(),
      isSystem: true,
      room: currentRoom
    };
    
    setMessages(prev => [...prev, message]);
  };

  const getUserDisplayName = (userId, username) => {
    if (userId === user?.user_id) {
      return 'אתה';
    }
    return username || `משתמש ${userId?.substr(-4)}`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!currentMessage.trim()) return;
    
    if (!isConnected) {
      setError('אין חיבור לצ\'אט - נסה להתחבר מחדש');
      return;
    }
    
    try {
      const success = appService.ws.sendMessage(currentRoom, currentMessage.trim());
      
      if (success) {
        console.log('📤 Message sent successfully');
        setCurrentMessage('');
        setError('');
      } else {
        setError('שליחת ההודעה נכשלה - אין חיבור');
      }
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setError('שגיאה בשליחת ההודעה');
    }
  };

  const handleRetryConnection = async () => {
    if (!isAuthenticated) {
      setError('עליך להתחבר קודם');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔄 Retrying WebSocket connection...');
      await appService.connectWebSocket();
      updateStatus();
      
      if (!wsListenersSetup.current) {
        setupWebSocketListeners();
      }
      
    } catch (error) {
      console.error('❌ Retry connection failed:', error);
      setError('חיבור מחדש נכשל - בדוק את החיבור לשרת');
    } finally {
      setIsLoading(false);
    }
  };

  // Login Form Component
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="bg-blue-100 rounded-full p-4 inline-block mb-4">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">צ'אט ChessMentor</h1>
              <p className="text-gray-600">התחבר כדי להצטרף לצ'אט</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-5 h-5 text-green-500 flex-shrink-0">✓</div>
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם משתמש
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="הזן שם משתמש"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סיסמה
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="הזן סיסמה"
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'מתחבר...' : 'התחבר'}
              </button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
              <p>שירות הצ'אט של ChessMentor</p>
              <p className="mt-1">הכנס משתמש קיים או צור חדש</p>
              <p className="mt-1 text-xs">השרת צריך לרוץ על localhost:5001</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Chat Interface
  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">צ'אט ChessMentor</h1>
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">מחובר</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">לא מחובר</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="text-sm text-gray-600">
              <User className="w-4 h-4 inline ml-2" />
              {user?.username}
            </div>
            
            {!isConnected && (
              <button
                onClick={handleRetryConnection}
                disabled={isLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'מתחבר...' : 'חבר מחדש'}
              </button>
            )}
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>התנתק</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-l border-gray-200 p-4">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Users className="w-4 h-4 ml-2" />
              משתמשים מחוברים ({onlineUsers.length})
            </h3>
            <ul className="space-y-2">
              {onlineUsers.map((onlineUser) => (
                <li key={onlineUser.user_id} className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    {onlineUser.user_id === user?.user_id ? 'אתה' : onlineUser.username}
                  </span>
                </li>
              ))}
              {onlineUsers.length === 0 && (
                <li className="text-sm text-gray-500 italic">אין משתמשים מחוברים</li>
              )}
            </ul>
          </div>

          <div className="text-xs text-gray-500 border-t pt-4">
            <p>חדר: {currentRoom}</p>
            <p>סטטוס: {connectionStatus.isConnected ? 'מחובר' : 'מנותק'}</p>
            {connectionStatus.reconnectAttempts > 0 && (
              <p>ניסיונות חיבור: {connectionStatus.reconnectAttempts}</p>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.userId === user?.user_id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isSystem
                      ? 'bg-gray-100 text-gray-600 text-center text-sm italic'
                      : message.userId === user?.user_id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border'
                  } ${message.isPrivate ? 'border-2 border-purple-300' : ''}`}
                >
                  {!message.isSystem && (
                    <div className="text-xs opacity-75 mb-1">
                      {message.username}
                      {message.isPrivate && ' (פרטי)'}
                    </div>
                  )}
                  <div className="break-words">{message.content}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {message.timestamp.toLocaleTimeString('he-IL')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex space-x-3 rtl:space-x-reverse">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder={isConnected ? "הקלד הודעה..." : "לא מחובר לצ'אט"}
                disabled={!isConnected}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!isConnected || !currentMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatDemo;