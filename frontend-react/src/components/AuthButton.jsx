import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User, MessageCircle } from 'lucide-react';
import appService from '../services/appService';

const AuthButton = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await appService.initialize();
        const status = appService.getStatus();
        setIsAuthenticated(status.auth.isAuthenticated);
        setUser(status.auth.user);
      } catch (error) {
        console.error('Failed to check auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Listen for auth changes (optional)
    const interval = setInterval(checkAuthStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    try {
      await appService.logout();
      setIsAuthenticated(false);
      setUser(null);
      // Optionally redirect to home
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleChatNavigation = () => {
    if (isAuthenticated) {
      navigate('/chat');
    } else {
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-500">טוען...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 rtl:space-x-reverse">
      
      {/* Chat Button */}
      <button
        onClick={handleChatNavigation}
        className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title={isAuthenticated ? 'פתח צ\'אט' : 'התחבר לצ\'אט'}
      >
        <MessageCircle className="w-4 h-4" />
        <span>צ'אט</span>
      </button>

      {isAuthenticated ? (
        // Logged in state
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          
          {/* User info */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 bg-green-50 rounded-lg">
            <User className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {user?.profile?.display_name || user?.username || 'משתמש'}
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="התנתק"
          >
            <LogOut className="w-4 h-4" />
            <span>התנתק</span>
          </button>
        </div>
      ) : (
        // Logged out state
        <button
          onClick={handleLogin}
          className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span>התחבר</span>
        </button>
      )}
    </div>
  );
};

export default AuthButton;