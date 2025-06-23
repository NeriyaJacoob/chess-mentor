import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, LogOut, MessageCircle, Wifi, WifiOff, User } from 'lucide-react';
import appService from '../services/authService';

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
  
  // Chat
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState('general');
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const messagesEndRef = useRef(null);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await appService.initialize();
        
        // בדוק אם המשתמש עדיין תקף
        if (appService.auth.isAuthenticated()) {
          try {
            const currentUser = await appService.auth.getCurrentUser();
            if (!currentUser) {
              // המשתמש לא קיים יותר, נקה את הנתונים
              console.log('⚠️ User no longer exists, clearing auth data');
              appService.auth.clearAuthData();
              window.location.reload(); // רענן את העמוד כדי לחזור להתחברות
              return;
            }
          } catch (error) {
            console.warn('Failed to validate current user:', error);
            appService.auth.clearAuthData();
            window.location.reload();
            return;
          }
        }
        
        updateStatus();
        
        // אם כבר מחובר ותקף, התחבר ל-WebSocket
        if (appService.auth.isAuthenticated()) {
          await appService.connectWebSocket();
          setupWebSocketListeners();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    
    initializeApp();
    
    // Cleanup function
    return () => {
      if (appService.ws) {
        appService.ws.off('connected');
        appService.ws.off('disconnected');
        appService.ws.off('roomJoined');
        appService.ws.off('user_joined_room');
        appService.ws.off('room_message');
        appService.ws.off('private_message');
        appService.ws.off('error');
      }
    };
  }, []); // Empty dependency array - run only once

  // Setup WebSocket event listeners
  const setupWebSocketListeners = () => {
    const ws = appService.ws;
    
    // Clear previous listeners
    ws.off('connected');
    ws.off('disconnected');
    ws.off('roomJoined');
    ws.off('user_joined_room');
    ws.off('room_message');
    ws.off('private_message');
    ws.off('error');
    
    // Connection events
    ws.on('connected', (data) => {
      console.log('🔗 Connected:', data);
      setIsConnected(true);
      updateStatus();
      
      // Join default room only once
      console.log(`🏠 Joining room: ${currentRoom}`);
      ws.joinRoom(currentRoom);
      
      addSystemMessage('התחברת לצ\'אט בהצלחה!');
      
      // הוסף את המשתמש הנוכחי לרשימה
      if (user) {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.user_id === user.user_id);
          if (!exists) {
            return [...prev, {
              user_id: user.user_id,
              username: user.username,
              display_name: user.profile?.display_name || user.username
            }];
          }
          return prev;
        });
      }
    });
    
    ws.on('disconnected', (data) => {
      console.log('🔌 Disconnected:', data);
      setIsConnected(false);
      updateStatus();
      addSystemMessage('החיבור נותק');
      
      // אם הניתוק קרה בגלל בעיית אימות, נקה נתונים
      if (data && data.reason && data.reason.includes('auth')) {
        console.log('⚠️ Disconnected due to auth issue, clearing data');
        appService.auth.clearAuthData();
        setTimeout(() => window.location.reload(), 2000);
      }
    });
    
    // Room events
    ws.on('roomJoined', (data) => {
      console.log('🏠 Joined room:', data.room_id);
      addSystemMessage(`הצטרפת לחדר: ${data.room_id}`);
    });
    
    ws.on('user_joined_room', (data) => {
      console.log('👤 User joined room:', data);
      if (data.username && data.user_id !== user?.user_id) {
        addSystemMessage(`${data.username} הצטרף לחדר`);
        
        // הוסף למשתמשים מחוברים אם לא קיים
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.user_id === data.user_id);
          if (!exists && data.user_id) {
            return [...prev, {
              user_id: data.user_id,
              username: data.username,
              display_name: data.username
            }];
          }
          return prev;
        });
      }
    });
    
    // Message events
    ws.on('room_message', (data) => {
      console.log('💬 Room message:', data);
      addMessage(data);
    });
    
    ws.on('private_message', (data) => {
      console.log('🔒 Private message:', data);
      addMessage({ ...data, isPrivate: true });
    });
    
    // Error handling
    ws.on('error', (data) => {
      console.error('❌ WebSocket error:', data);
      setError(data.message || 'שגיאת חיבור');
    });
  };

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
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setError('נא להזין שם משתמש וסיסמה');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔄 Attempting login...');
      const result = await appService.login(loginForm.username, loginForm.password);
      console.log('✅ Login successful:', result);
      
      updateStatus();
      
      // Setup WebSocket listeners only after successful login
      setupWebSocketListeners();
      
      setLoginForm({ username: '', password: '' });
      setMessages([]); // Clear previous messages
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      setError(error.message || 'שגיאה בהתחברות - בדוק שהשרת פועל');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await appService.logout();
      updateStatus();
      setMessages([]);
      setOnlineUsers([]);
      setError('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addMessage = (messageData) => {
    const message = {
      id: Date.now() + Math.random(),
      userId: messageData.user_id || messageData.from_user_id,
      username: getUserDisplayName(
        messageData.user_id || messageData.from_user_id, 
        messageData.username
      ),
      content: messageData.message,
      timestamp: messageData.timestamp || new Date().toISOString(),
      isPrivate: messageData.isPrivate || false,
      roomId: messageData.room_id
    };
    
    setMessages(prev => [...prev, message]);
  };

  const addSystemMessage = (content) => {
    addMessage({
      user_id: 'system',
      message: content,
      timestamp: new Date().toISOString()
    });
  };

  const getUserDisplayName = (userId, username = null) => {
    if (userId === user?.user_id) return 'אתה';
    if (userId === 'system') return 'מערכת';
    
    // אם יש username בנתונים, השתמש בו
    if (username) return username;
    
    const foundUser = onlineUsers.find(u => u.user_id === userId);
    return foundUser?.display_name || foundUser?.username || 'משתמש';
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || !isConnected) return;
    
    try {
      appService.ws.sendToRoom(currentRoom, currentMessage.trim());
      setCurrentMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('שגיאה בשליחת ההודעה');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <MessageCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">צ'אט מתקדם</h1>
            <p className="text-gray-600">מערכת עם Authentication ו-WebSocket</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="username">
                שם משתמש
              </label>
              <input
                id="username"
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="הכנס שם משתמש"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                סיסמה
              </label>
              <input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="הכנס סיסמה"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isLoading ? 'מתחבר...' : 'התחבר'}
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>מערכת Authentication ו-WebSocket</p>
            <p className="mt-1">הכנס שם משתמש וסיסמה כלשהם</p>
            <p className="mt-1 text-xs">השרת צריך לרוץ על localhost:8000</p>
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
              <h1 className="text-xl font-bold text-gray-900">צ'אט מתקדם</h1>
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
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {user?.profile?.display_name || user?.username || 'משתמש'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title="התנתק"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 p-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              חדרים
            </h3>
            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="font-medium text-blue-900">כללי</div>
                <div className="text-sm text-blue-700">חדר ברירת המחדל</div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">משתמשים מחוברים</h3>
            <div className="space-y-2">
              {onlineUsers.length > 0 ? (
                onlineUsers.map(onlineUser => (
                  <div key={onlineUser.user_id} className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{onlineUser.display_name || onlineUser.username}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 p-2">
                  {isConnected ? 'טוען רשימת משתמשים...' : 'לא מחובר לשרת'}
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">סטטוס חיבור</h4>
            <div className="text-xs text-gray-500 space-y-1">
              <div>מזהה: {connectionStatus.connectionId?.slice(-8) || 'N/A'}</div>
              <div>חדרים: {connectionStatus.rooms?.length || 0}</div>
              <div>מאומת: {connectionStatus.isAuthenticated ? 'כן' : 'לא'}</div>
            </div>
            
            {error && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>עדיין אין הודעות</p>
                <p className="text-sm">התחל לכתוב כדי לשלוח הודעה</p>
              </div>
            ) : (
              messages.map(message => (
                <div key={message.id} className={`flex ${message.userId === user?.user_id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.userId === user?.user_id
                      ? 'bg-blue-600 text-white'
                      : message.userId === 'system'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-white border border-gray-200'
                  } ${message.isPrivate ? 'border-2 border-purple-300' : ''}`}>
                    
                    {message.userId !== user?.user_id && (
                      <div className="text-sm font-medium mb-1 opacity-75">
                        {message.isPrivate && '🔒 '}{message.username}
                      </div>
                    )}
                    
                    <div className="text-sm">{message.content}</div>
                    
                    <div className={`text-xs mt-1 opacity-75 ${
                      message.userId === user?.user_id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex space-x-4 rtl:space-x-reverse">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? 'כתוב הודעה...' : 'ממתין לחיבור...'}
                disabled={!isConnected}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendMessage}
                disabled={!isConnected || !currentMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Send className="w-4 h-4" />
                <span>שלח</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatDemo;