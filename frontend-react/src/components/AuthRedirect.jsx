import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import appService from '../services/appService';

const AuthRedirect = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await appService.initialize();
        const status = appService.getStatus();
        setIsAuthenticated(status.auth.isAuthenticated);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-full p-6 shadow-lg mb-4 inline-block">
            <MessageCircle className="w-12 h-12 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">טוען...</h2>
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    // אם מחובר, לך לדשבורד (HomePage) במקום לצ'אט
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default AuthRedirect;