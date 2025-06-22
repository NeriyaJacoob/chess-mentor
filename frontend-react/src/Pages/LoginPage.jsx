import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import appService from '../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  
  // State
  const [isLogin, setIsLogin] = useState(true); // true = login, false = register
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await appService.initialize();
        if (appService.auth.isAuthenticated()) {
          navigate('/chat', { replace: true });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('נא להזין שם משתמש');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('נא להזין סיסמה');
      return false;
    }
    
    if (formData.password.length < 3) {
      setError('הסיסמה חייבת להכיל לפחות 3 תווים');
      return false;
    }
    
    if (!isLogin && formData.email && !formData.email.includes('@')) {
      setError('כתובת אימייל לא תקינה');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (isLogin) {
        // Login
        console.log('🔄 Attempting login...');
        const result = await appService.loginAndConnect(formData.username, formData.password);
        console.log('✅ Login successful:', result);
        
        setSuccess('התחברות בוצעה בהצלחה! מעביר אותך...');
        
        // Redirect to chat after short delay
        setTimeout(() => {
          navigate('/chat', { replace: true });
        }, 1500);
        
      } else {
        // Register
        console.log('🔄 Attempting registration...');
        const result = await appService.auth.register(
          formData.username, 
          formData.password, 
          formData.email || null
        );
        console.log('✅ Registration successful:', result);
        
        setSuccess('הרישום בוצע בהצלחה! מעביר אותך...');
        
        // Connect WebSocket after registration
        await appService.connectWebSocket();
        
        // Redirect to chat after short delay
        setTimeout(() => {
          navigate('/chat', { replace: true });
        }, 1500);
      }
      
    } catch (error) {
      console.error(isLogin ? '❌ Login failed:' : '❌ Registration failed:', error);
      
      let errorMessage = 'שגיאה לא צפויה';
      
      if (error.message) {
        if (error.message.includes('Invalid username or password')) {
          errorMessage = 'שם משתמש או סיסמה שגויים';
        } else if (error.message.includes('Username already exists')) {
          errorMessage = 'שם המשתמש כבר קיים';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'שגיאת חיבור - בדוק שהשרת פועל על localhost:8000';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      username: '',
      password: '',
      email: ''
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'ברוכים השבים' : 'הצטרפו אלינו'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'התחברו לחשבון שלכם' : 'צרו חשבון חדש'}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              שם משתמש
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="הכניסו שם משתמש"
              disabled={isLoading}
              autoComplete="username"
              dir="ltr"
            />
          </div>

          {/* Email (only for registration) */}
          {!isLogin && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                אימייל (אופציונלי)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="example@email.com"
                disabled={isLoading}
                autoComplete="email"
                dir="ltr"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              סיסמה
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="הכניסו סיסמה"
                disabled={isLoading}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2 rtl:space-x-reverse">
              <div className="text-sm">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start space-x-2 rtl:space-x-reverse">
              <div className="text-sm">{success}</div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 flex items-center justify-center space-x-2 rtl:space-x-reverse"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isLogin ? 'מתחבר...' : 'נרשם...'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isLogin ? 'התחבר' : 'הירשם'}</span>
              </div>
            )}
          </button>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              onClick={toggleMode}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
            >
              {isLogin ? 'אין לכם חשבון? הירשמו כאן' : 'יש לכם חשבון? התחברו כאן'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>מערכת צ'אט מתקדמת</p>
          <p className="mt-1">Authentication + WebSocket</p>
          <div className="mt-2 text-xs">
            <p>🔗 שרת: localhost:8000</p>
            <p>💬 צ'אט: בזמן אמת</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;