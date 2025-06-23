// frontend-react/src/Pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';
import appService from '../services/appService';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
          console.log('✅ Already authenticated, redirecting...');
          navigate('/chat', { replace: true });
        }
      } catch (error) {
        console.error('Auth check error:', error);
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
    // Clear errors when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Basic validation
    if (!formData.username || !formData.password) {
      setError('נא למלא את כל השדות הנדרשים');
      return;
    }
    
    if (!isLogin && !formData.email) {
      setError('נא להזין כתובת אימייל');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let result;
      
      if (isLogin) {
        // Login flow
        console.log('🔄 Attempting login...');
        result = await appService.login(formData.username, formData.password);
        console.log('✅ Login successful:', result);
        
        setSuccess('התחברת בהצלחה! מעביר אותך...');
        
        // Redirect to chat after short delay
        setTimeout(() => {
          navigate('/chat', { replace: true });
        }, 1500);
        
      } else {
        // Register flow
        console.log('🔄 Attempting registration...');
        result = await appService.register(
          formData.username, 
          formData.password, 
          formData.email || null
        );
        console.log('✅ Registration successful:', result);
        
        setSuccess('הרישום בוצע בהצלחה! מעביר אותך...');
        
        // Redirect to chat after short delay
        setTimeout(() => {
          navigate('/chat', { replace: true });
        }, 1500);
      }
      
    } catch (error) {
      console.error(isLogin ? '❌ Login failed:' : '❌ Registration failed:', error);
      
      let errorMessage = 'שגיאה לא צפויה';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        if (error.message.includes('401')) {
          errorMessage = 'שם משתמש או סיסמה שגויים';
        } else if (error.message.includes('Username already exists')) {
          errorMessage = 'שם המשתמש כבר קיים';
        } else if (error.message.includes('Email already exists')) {
          errorMessage = 'כתובת האימייל כבר רשומה במערכת';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'שגיאת חיבור - בדוק שהשרת פועל על localhost:5001';
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
            {isLogin ? 'היכנסו לחשבון שלכם' : 'צרו חשבון חדש'}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 rtl:space-x-reverse">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2 rtl:space-x-reverse">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם משתמש
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pr-10 rtl:pr-4 rtl:pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="הזן שם משתמש"
                disabled={isLoading}
                autoComplete="username"
                autoFocus
              />
              <User className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Email (for registration only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אימייל (אופציונלי)
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 pr-10 rtl:pr-4 rtl:pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="example@email.com"
                  disabled={isLoading}
                  autoComplete="email"
                />
                <Mail className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pr-10 rtl:pr-4 rtl:pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <Lock className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Forgot Password Link (for login only) */}
          {isLogin && (
            <div className="text-right rtl:text-left">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                onClick={() => console.log('Forgot password clicked')}
              >
                שכחת סיסמה?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            } text-white shadow-lg`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>מעבד...</span>
              </div>
            ) : (
              <span>{isLogin ? 'היכנס' : 'הירשם'}</span>
            )}
          </button>

          {/* Toggle Mode Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            {isLogin ? 'עדיין אין לך חשבון?' : 'כבר יש לך חשבון?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {isLogin ? 'הירשם כאן' : 'התחבר כאן'}
            </button>
          </p>

        </form>

      </div>
    </div>
  );
};

export default LoginPage;