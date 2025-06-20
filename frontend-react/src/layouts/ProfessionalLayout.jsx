import React, { useState, useEffect } from 'react';
import { 
  Crown,
  Menu,
  X,
  Wifi,
  WifiOff,
  Zap,
  Activity,
  AlertTriangle
} from 'lucide-react';

// Mock components - replace with your actual components
const ProfessionalSidebar = ({ isCollapsed, onToggleCollapse, activeRoute }) => (
  <div className={`${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-slate-900/95 backdrop-blur-xl border-r border-white/10`}>
    <div className="p-4 text-white text-center">
      {isCollapsed ? <Crown className="h-6 w-6 mx-auto" /> : 'ChessMentor Sidebar'}
    </div>
  </div>
);

const ModernTopBar = ({ onMenuToggle, isMenuOpen, theme, onThemeToggle }) => (
  <div className="h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
    <div className="flex items-center space-x-4">
      <button onClick={onMenuToggle} className="lg:hidden text-white">
        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      <span className="text-white font-semibold">ChessMentor TopBar</span>
    </div>
    <button onClick={onThemeToggle} className="text-white">
      Theme: {theme}
    </button>
  </div>
);

const ProfessionalLayout = ({ children }) => {
  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isOnline, setIsOnline] = useState(true);
  const [performanceMode, setPerformanceMode] = useState('normal');
  
  // System State
  const [systemStatus, setSystemStatus] = useState({
    engine: 'ready',
    api: 'connected',
    websocket: 'connected',
    lastUpdate: new Date()
  });
  
  const [notifications, setNotifications] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });

  // Initialize system
  useEffect(() => {
    // Detect device type
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      });
    };

    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // System health check
    const checkSystemHealth = () => {
      setSystemStatus(prev => ({
        ...prev,
        lastUpdate: new Date(),
        engine: Math.random() > 0.1 ? 'ready' : 'error',
        api: Math.random() > 0.05 ? 'connected' : 'disconnected'
      }));
    };

    // Event listeners
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initialize
    updateDeviceInfo();
    updateOnlineStatus();
    
    // Health check interval
    const healthInterval = setInterval(checkSystemHealth, 30000);

    // Auto-collapse sidebar on mobile
    if (deviceInfo.isMobile) {
      setSidebarCollapsed(true);
    }

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(healthInterval);
    };
  }, []);

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Performance optimization
  const handlePerformanceModeChange = (mode) => {
    setPerformanceMode(mode);
    // Apply performance optimizations based on mode
    if (mode === 'high-performance') {
      document.body.classList.add('reduce-animations');
    } else {
      document.body.classList.remove('reduce-animations');
    }
  };

  // System status indicator
  const SystemStatusIndicator = () => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'ready':
        case 'connected':
          return 'text-green-400 bg-green-400/20';
        case 'thinking':
        case 'loading':
          return 'text-yellow-400 bg-yellow-400/20';
        case 'error':
        case 'disconnected':
          return 'text-red-400 bg-red-400/20';
        default:
          return 'text-slate-400 bg-slate-400/20';
      }
    };

    const hasError = Object.values(systemStatus).some(status => 
      status === 'error' || status === 'disconnected'
    );

    return (
      <div className="fixed bottom-4 right-4 z-40">
        <div className={`p-3 rounded-xl backdrop-blur-xl border transition-all duration-300 ${
          hasError 
            ? 'bg-red-500/20 border-red-500/30' 
            : 'bg-green-500/20 border-green-500/30'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <Activity className={`h-4 w-4 ${getStatusColor(systemStatus.engine).split(' ')[0]}`} />
            </div>
            
            <div className="text-xs">
              <div className={`font-medium ${hasError ? 'text-red-300' : 'text-green-300'}`}>
                {hasError ? 'System Issue' : 'All Systems Ready'}
              </div>
              <div className="text-slate-400">
                Updated {systemStatus.lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Mobile overlay for sidebar
  const MobileOverlay = () => (
    mobileMenuOpen && deviceInfo.isMobile && (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
        onClick={() => setMobileMenuOpen(false)}
      />
    )
  );

  // Error boundary fallback
  const ErrorFallback = ({ error }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-300 text-sm mb-6">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
        >
          Reload Application
        </button>
      </div>
    </div>
  );

  // Loading screen
  const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">ChessMentor</h2>
        <p className="text-slate-400">Loading your chess experience...</p>
        <div className="flex justify-center mt-4">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Performance mode controls
  const PerformanceControls = () => (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          <select
            value={performanceMode}
            onChange={(e) => handlePerformanceModeChange(e.target.value)}
            className="bg-transparent text-white text-xs border-none focus:outline-none"
          >
            <option value="normal" className="bg-slate-800">Normal</option>
            <option value="high-performance" className="bg-slate-800">High Performance</option>
            <option value="low-power" className="bg-slate-800">Battery Saver</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex ${
      theme === 'dark' ? 'dark' : ''
    }`}>
      
      {/* Mobile Overlay */}
      <MobileOverlay />
      
      {/* Sidebar */}
      <div className={`${
        deviceInfo.isMobile 
          ? `fixed left-0 top-0 h-full z-40 transform transition-transform duration-300 ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative'
      }`}>
        <ProfessionalSidebar 
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleSidebarToggle}
          activeRoute="/"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <ModernTopBar 
          onMenuToggle={handleMobileMenuToggle}
          isMenuOpen={mobileMenuOpen}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

      {/* System Status Indicator */}
      <SystemStatusIndicator />
      
      {/* Performance Controls */}
      <PerformanceControls />

      {/* Global Styles */}
      <style jsx global>{`
        /* Scrollbar Styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Performance Mode Optimizations */
        .reduce-animations * {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }

        /* Focus Management */
        .focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* High Contrast Mode */
        @media (prefers-contrast: high) {
          .bg-white\/5 {
            background-color: rgba(255, 255, 255, 0.2) !important;
          }
          
          .border-white\/10 {
            border-color: rgba(255, 255, 255, 0.3) !important;
          }
        }

        /* Print Styles */
        @media print {
          .no-print {
            display: none !important;
          }
        }

        /* Dark mode adjustments */
        [data-theme="light"] {
          /* Light theme overrides */
          background: linear-gradient(to bottom right, #f8fafc, #e2e8f0, #cbd5e1);
        }

        /* Glass effect utility */
        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Animated gradient background */
        .bg-mesh {
          background-image: 
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0);
          background-size: 20px 20px;
        }

        /* Custom animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-ring {
          0% { transform: scale(0.33); }
          40%, 50% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.2); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-pulse-ring {
          animation: pulse-ring 1.5s ease-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 20%,
            rgba(255, 255, 255, 0.5) 60%,
            rgba(255, 255, 255, 0)
          );
          background-size: 200px 100%;
        }
      `}</style>
    </div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Layout Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Application Error</h2>
            <p className="text-slate-300 text-sm mb-6">
              Something went wrong with the layout system.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main Layout Export with Error Boundary
const LayoutWithErrorBoundary = (props) => (
  <ErrorBoundary>
    <ProfessionalLayout {...props} />
  </ErrorBoundary>
);

export default LayoutWithErrorBoundary;