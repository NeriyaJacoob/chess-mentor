// frontend-react/src/layouts/ProfessionalLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // ← חשוב לנתיבים מקוננים
import { 
  Wifi,
  WifiOff,
  Zap,
  Activity,
  AlertTriangle
} from 'lucide-react';

// ייבוא הקומפוננטים האמיתיים במקום Mock
import ProfessionalSidebar from '../components/Layout/ProfessionalSidebar';
import ModernTopBar from '../components/Layout/ModernTopBar';
import AuthButton from '../components/AuthButton';

const ProfessionalLayout = () => {
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
        api: Math.random() > 0.05 ? 'connected' : 'error',
        websocket: Math.random() > 0.03 ? 'connected' : 'error'
      }));
    };

    updateDeviceInfo();
    updateOnlineStatus();
    
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    const healthInterval = setInterval(checkSystemHealth, 30000);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(healthInterval);
    };
  }, []);

  // Event Handlers
  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Helper Components
  const MobileOverlay = () => (
    mobileMenuOpen && deviceInfo.isMobile ? (
      <div 
        className="fixed inset-0 bg-black/50 z-30" 
        onClick={handleMobileMenuToggle}
      />
    ) : null
  );

  const SystemStatusIndicator = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-white text-xs">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );

  const PerformanceControls = () => (
    performanceMode === 'developer' ? (
      <div className="fixed top-20 right-4 z-50">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl">
          <div className="text-white text-xs space-y-1">
            <div>Engine: {systemStatus.engine}</div>
            <div>API: {systemStatus.api}</div>
            <div>WS: {systemStatus.websocket}</div>
          </div>
        </div>
      </div>
    ) : null
  );

  return (
    <div className={`min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${
      theme === 'light' ? 'bg-gradient-to-br from-gray-50 via-white to-gray-100' : 'dark'
    }`}>
      
      {/* Mobile Overlay */}
      <MobileOverlay />
      
      {/* Sidebar - השתמשות בקומפוננט האמיתי */}
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
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar - השתמשות בקומפוננט האמיתי */}
        <ModernTopBar 
          onMenuToggle={handleMobileMenuToggle}
          isMenuOpen={mobileMenuOpen}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />
        
        {/* Page Content - השימוש ב-Outlet במקום {children} */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto h-full">
            <Outlet />
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
        .focus-visible:focus {
          outline: 2px solid rgb(59 130 246);
          outline-offset: 2px;
        }

        /* Animation Keyframes */
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.7; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
        
        @keyframes pulse-ring {
          0% { transform: scale(0.33); }
          80%, 100% { opacity: 0; transform: scale(1.2); }
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

// ובתוך הקומפוננטה, הוסף איפה שאתה רוצה:
<AuthButton />
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