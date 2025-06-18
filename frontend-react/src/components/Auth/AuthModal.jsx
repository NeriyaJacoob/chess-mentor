// frontend-react/src/components/Auth/AuthModal.jsx
// רכיב התחברות ורישום מלא
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, LogIn, X } from 'lucide-react';
import { login, register, guestLogin } from '../../store/slices/authSlice';

const AuthModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  
  const [mode, setMode] = useState('login'); // 'login', 'register', 'guest'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        return; // Handle password mismatch
      }
      
      const result = await dispatch(register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      }));
      
      if (result.meta.requestStatus === 'fulfilled') {
        onClose();
      }
    } else if (mode === 'login') {
      const result = await dispatch(login({
        username: formData.username,
        password: formData.password
      }));
      
      if (result.meta.requestStatus === 'fulfilled') {
        onClose();
      }
    } else if (mode === 'guest') {
      const result = await dispatch(guestLogin({
        name: formData.username || 'Guest'
      }));
      
      if (result.meta.requestStatus === 'fulfilled') {
        onClose();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {mode === 'login' && '🏰 התחברות'}
                  {mode === 'register' && '✨ הרשמה'}
                  {mode === 'guest' && '👤 כניסה כאורח'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {mode === 'login' && 'התחבר לחשבון שלך'}
                  {mode === 'register' && 'צור חשבון חדש'}
                  {mode === 'guest' && 'שחק בלי רישום'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              className="bg-red-50 border-l-4 border-red-500 p-4"
            >
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mode === 'guest' ? 'שם תצוגה' : 'שם משתמש'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={mode === 'guest' ? 'איך תרצה שיקראו לך?' : 'הזן שם משתמש'}
                    required={mode !== 'guest'}
                  />
                </div>
              </div>

              {/* Email (רק ברישום) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    כתובת מייל (אופציונלי)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              )}

              {/* Password (לא לאורחים) */}
              {mode !== 'guest' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    סיסמה
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="הזן סיסמה"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password (רק ברישום) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    אישור סיסמה
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="הזן סיסמה שוב"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">הסיסמאות לא תואמות</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (mode === 'register' && formData.password !== formData.confirmPassword)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {mode === 'login' && 'מתחבר...'}
                    {mode === 'register' && 'נרשם...'}
                    {mode === 'guest' && 'נכנס...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {mode === 'login' && <><LogIn className="h-5 w-5 mr-2" />התחבר</>}
                    {mode === 'register' && <><UserPlus className="h-5 w-5 mr-2" />הירשם</>}
                    {mode === 'guest' && <><User className="h-5 w-5 mr-2" />כניסה כאורח</>}
                  </div>
                )}
              </button>
            </form>

            {/* Mode Switchers */}
            <div className="mt-6 space-y-3">
              {mode === 'login' && (
                <>
                  <div className="text-center">
                    <button
                      onClick={() => switchMode('register')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      אין לך חשבון? הירשם כאן
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">או</span>
                    </div>
                  </div>
                  <button
                    onClick={() => switchMode('guest')}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    <User className="h-5 w-5 inline mr-2" />
                    המשך כאורח
                  </button>
                </>
              )}

              {mode === 'register' && (
                <div className="text-center">
                  <button
                    onClick={() => switchMode('login')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    יש לך כבר חשבון? התחבר כאן
                  </button>
                </div>
              )}

              {mode === 'guest' && (
                <div className="text-center">
                  <button
                    onClick={() => switchMode('login')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    יש לך חשבון? התחבר לשמירת התקדמות
                  </button>
                </div>
              )}
            </div>

            {/* Guest Benefits */}
            {mode === 'guest' && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2">כאורח תוכל:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• לשחק נגד המחשב</li>
                  <li>• להשתמש במאמן AI</li>
                  <li>• לנתח משחקים</li>
                </ul>
                <p className="text-xs text-amber-600 mt-2">
                  לשמירת התקדמות והיסטוריה, הירשם לחשבון קבוע
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;