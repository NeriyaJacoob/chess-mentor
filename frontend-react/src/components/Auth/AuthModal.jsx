import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  X,
  Crown,
  Shield,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';

const ProfessionalAuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'guest'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // For multi-step registration

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (mode === 'register' || mode === 'login') {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    if (mode === 'register') {
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    console.log('Auth attempt:', { mode, formData });
    onClose();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setStep(1);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const InputField = ({ 
    icon: Icon, 
    type = 'text', 
    placeholder, 
    value, 
    onChange, 
    error, 
    showPasswordToggle = false,
    showPassword: fieldShowPassword = false,
    onTogglePassword = null 
  }) => (
    <div className="space-y-2">
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type={showPasswordToggle ? (fieldShowPassword ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 ${showPasswordToggle ? 'pr-12' : 'pr-4'} py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-slate-400 transition-all duration-200 ${
            error ? 'border-red-500/50 bg-red-500/5' : 'border-white/20'
          }`}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            {fieldShowPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && (
        <div className="flex items-center space-x-2 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  const ModeHeader = () => {
    const configs = {
      login: {
        title: 'Welcome Back',
        subtitle: 'Continue your chess journey',
        icon: LogIn,
        gradient: 'from-blue-600 to-indigo-600'
      },
      register: {
        title: 'Join ChessMentor',
        subtitle: 'Start your path to mastery',
        icon: UserPlus,
        gradient: 'from-purple-600 to-pink-600'
      },
      guest: {
        title: 'Play as Guest',
        subtitle: 'Jump right into the game',
        icon: User,
        gradient: 'from-green-600 to-teal-600'
      }
    };
    
    const config = configs[mode];
    const Icon = config.icon;
    
    return (
      <div className={`bg-gradient-to-r ${config.gradient} p-6 text-white relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 gap-1 p-4">
            {Array.from({length: 32}).map((_, i) => (
              <div key={i} className={`w-2 h-2 ${i % 2 === 0 ? 'bg-white' : 'bg-transparent'} rounded-sm`}></div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{config.title}</h2>
              <p className="text-white/80">{config.subtitle}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-4 right-20 opacity-20">
          <Crown className="h-8 w-8 animate-pulse" />
        </div>
        <div className="absolute bottom-4 right-32 opacity-20">
          <Sparkles className="h-6 w-6 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>
    );
  };

  const LoginForm = () => (
    <div className="space-y-6">
      <InputField
        icon={User}
        placeholder="Username or email"
        value={formData.username}
        onChange={(value) => handleInputChange('username', value)}
        error={errors.username}
      />
      
      <InputField
        icon={Lock}
        placeholder="Password"
        value={formData.password}
        onChange={(value) => handleInputChange('password', value)}
        error={errors.password}
        showPasswordToggle
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />
      
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input type="checkbox" className="rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500/50" />
          <span className="text-slate-300">Remember me</span>
        </label>
        <button className="text-blue-400 hover:text-blue-300 transition-colors">
          Forgot password?
        </button>
      </div>
    </div>
  );

  const RegisterForm = () => (
    <div className="space-y-6">
      {step === 1 && (
        <>
          <InputField
            icon={User}
            placeholder="Choose a username"
            value={formData.username}
            onChange={(value) => handleInputChange('username', value)}
            error={errors.username}
          />
          
          <InputField
            icon={Mail}
            type="email"
            placeholder="Email address (optional)"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            error={errors.email}
          />
        </>
      )}
      
      {step === 2 && (
        <>
          <InputField
            icon={Lock}
            placeholder="Create password"
            value={formData.password}
            onChange={(value) => handleInputChange('password', value)}
            error={errors.password}
            showPasswordToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          
          <InputField
            icon={Lock}
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={(value) => handleInputChange('confirmPassword', value)}
            error={errors.confirmPassword}
            showPasswordToggle
            showPassword={showConfirmPassword}
            onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        </>
      )}
      
      {/* Password strength indicator */}
      {formData.password && (
        <div className="space-y-2">
          <div className="text-xs text-slate-400">Password strength:</div>
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  formData.password.length >= level * 2
                    ? level <= 2 ? 'bg-red-400' : level === 3 ? 'bg-yellow-400' : 'bg-green-400'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const GuestForm = () => (
    <div className="space-y-6">
      <InputField
        icon={User}
        placeholder="Display name (optional)"
        value={formData.username}
        onChange={(value) => handleInputChange('username', value)}
      />
      
      <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Shield className="h-5 w-5 text-amber-400" />
          <h4 className="font-semibold text-amber-300">Guest Mode Features</h4>
        </div>
        <ul className="space-y-2 text-sm text-amber-200">
          <li className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Play against AI at any difficulty</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Access puzzle training</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Use position analysis tools</span>
          </li>
        </ul>
        <p className="text-xs text-amber-300 mt-3">
          Note: Progress won't be saved. Create an account to track your improvement!
        </p>
      </div>
    </div>
  );

  const ActionButton = () => {
    const getButtonConfig = () => {
      switch (mode) {
        case 'login':
          return { 
            text: 'Sign In', 
            icon: LogIn, 
            gradient: 'from-blue-600 to-indigo-600' 
          };
        case 'register':
          return step === 1 
            ? { text: 'Continue', icon: ChevronRight, gradient: 'from-purple-600 to-pink-600' }
            : { text: 'Create Account', icon: UserPlus, gradient: 'from-purple-600 to-pink-600' };
        case 'guest':
          return { 
            text: 'Start Playing', 
            icon: User, 
            gradient: 'from-green-600 to-teal-600' 
          };
        default:
          return { text: 'Continue', icon: ChevronRight, gradient: 'from-blue-600 to-indigo-600' };
      }
    };

    const config = getButtonConfig();
    const Icon = config.icon;

    const handleClick = () => {
      if (mode === 'register' && step === 1) {
        if (formData.username && !errors.username && !errors.email) {
          setStep(2);
        } else {
          validateForm();
        }
      } else {
        handleSubmit();
      }
    };

    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r ${config.gradient} text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold`}
      >
        {isLoading ? (
          <Loader className="h-5 w-5 animate-spin" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
        <span>{isLoading ? 'Please wait...' : config.text}</span>
      </button>
    );
  };

  const ModeSwitcher = () => (
    <div className="space-y-4">
      {mode === 'login' && (
        <>
          <div className="text-center">
            <button
              onClick={() => switchMode('register')}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Don't have an account? <span className="underline">Sign up</span>
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-slate-900 text-slate-400">or</span>
            </div>
          </div>
          
          <button
            onClick={() => switchMode('guest')}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <User className="h-5 w-5" />
            <span>Continue as Guest</span>
          </button>
        </>
      )}
      
      {mode === 'register' && (
        <div className="text-center">
          <button
            onClick={() => switchMode('login')}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            Already have an account? <span className="underline">Sign in</span>
          </button>
        </div>
      )}
      
      {mode === 'guest' && (
        <div className="text-center">
          <button
            onClick={() => switchMode('login')}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            Have an account? <span className="underline">Sign in to save progress</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-white/20 overflow-hidden">
        
        <ModeHeader />
        
        <div className="p-6 space-y-6">
          {/* Progress indicator for registration */}
          {mode === 'register' && (
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-slate-600'} transition-colors`}></div>
              <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-slate-600'} transition-colors`}></div>
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-slate-600'} transition-colors`}></div>
              <span className="text-xs text-slate-400 ml-2">Step {step} of 2</span>
            </div>
          )}
          
          {/* Form content */}
          {mode === 'login' && <LoginForm />}
          {mode === 'register' && <RegisterForm />}
          {mode === 'guest' && <GuestForm />}
          
          {/* Back button for registration step 2 */}
          {mode === 'register' && step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              ← Back to previous step
            </button>
          )}
          
          <ActionButton />
          <ModeSwitcher />
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAuthModal;