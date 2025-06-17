// SettingsPage - configure app options
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setPieceStyle, setBoardTheme } from '../store/slices/gameSlice';

import { 
  Bot, 
  Palette, 
  Volume2, 
  Bell, 
  Shield, 
  Download,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Settings as SettingsIcon
} from 'lucide-react';
import OpenAIAuth from '../components/Auth/OpenAIAuth';
import { logout } from '../store/slices/authSlice';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const [activeSection, setActiveSection] = useState('ai');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [selectedBoardTheme, setSelectedBoardTheme] = useState('classic');
  const [settings, setSettings] = useState({
    soundEnabled: true,
    moveSounds: true,
    captureHighlight: true,
    legalMovesHighlight: true,
    autoSave: true,
    notifications: true,
    emailUpdates: false,
    darkMode: false
  });
    const [selectedPieceStyle, setSelectedPieceStyle] = useState('classic');


  const sections = [
    { id: 'ai', label: 'AI Coach', icon: Bot, description: 'Configure your AI mentor' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Themes and visual settings' },
    { id: 'game', label: 'Game Settings', icon: SettingsIcon, description: 'Gameplay preferences' },
    { id: 'sound', label: 'Sound & Audio', icon: Volume2, description: 'Audio preferences' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts and updates' },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield, description: 'Data management' }
  ];

  const themes = [
    { id: 'light', name: 'Light', preview: 'bg-white border-gray-200' },
    { id: 'dark', name: 'Dark', preview: 'bg-gray-900 border-gray-700' },
    { id: 'blue', name: 'Ocean Blue', preview: 'bg-blue-50 border-blue-200' },
    { id: 'green', name: 'Forest Green', preview: 'bg-green-50 border-green-200' }
  ];

  const boardThemes = [
    { id: 'classic', name: 'Classic Brown', light: '#F0D9B5', dark: '#B58863' },
    { id: 'blue', name: 'Ocean Blue', light: '#DEE3E6', dark: '#8CA2AD' },
    { id: 'green', name: 'Forest Green', light: '#FFFFDD', dark: '#86A666' },
    { id: 'purple', name: 'Royal Purple', light: '#F3E5F5', dark: '#7B1FA2' }
  ];
  // הוסף למעלה בפונקציה עם השאר useState:

// הוסף פונקציה חדשה:
const handlePieceStyleChange = (styleId) => {
  setSelectedPieceStyle(styleId);
  dispatch(setPieceStyle(styleId));
};

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDisconnectAI = () => {
    dispatch(logout());
  };

  const handleExportData = () => {
    // Export user data logic
    console.log('Exporting user data...');
  };

  const handleDeleteData = () => {
    // Delete user data logic
    if (window.confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      console.log('Deleting user data...');
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Coach Configuration</h3>
              <OpenAIAuth />
            </div>
            
            {isAuthenticated && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">AI Coach Connected</h4>
                    <p className="text-sm text-green-700">Your personal chess mentor is ready to help</p>
                  </div>
                  <button
                    onClick={handleDisconnectAI}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Coach Preferences</h4>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Detailed explanations</span>
                  <input
                    type="checkbox"
                    checked={settings.detailedExplanations}
                    onChange={(e) => handleSettingChange('detailedExplanations', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Beginner-friendly language</span>
                  <input
                    type="checkbox"
                    checked={settings.beginnerMode}
                    onChange={(e) => handleSettingChange('beginnerMode', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Auto-analyze games</span>
                  <input
                    type="checkbox"
                    checked={settings.autoAnalyze}
                    onChange={(e) => handleSettingChange('autoAnalyze', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
              </div>
            </div>
          </div>
        );

        // SettingsPage.jsx - החלף את חלק ה-appearance ב:
        case 'appearance':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">App Theme</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedTheme === theme.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`h-16 rounded ${theme.preview} border mb-3`}></div>
                      <div className="text-sm font-medium text-gray-900">{theme.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Board Theme</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {boardThemes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedBoardTheme(theme.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedBoardTheme === theme.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="grid grid-cols-2 h-16 rounded overflow-hidden mb-3">
                        <div style={{ backgroundColor: theme.light }}></div>
                        <div style={{ backgroundColor: theme.dark }}></div>
                        <div style={{ backgroundColor: theme.dark }}></div>
                        <div style={{ backgroundColor: theme.light }}></div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">{theme.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Piece Style</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'classic', name: 'Classic PNG', description: 'Traditional realistic pieces' },
                    { id: 'svg', name: 'Vector SVG', description: 'Modern crisp graphics' },
                    { id: 'unicode', name: 'Unicode', description: 'Simple text symbols' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handlePieceStyleChange(style.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedPieceStyle === style.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="h-16 flex items-center justify-center mb-3">
                        {style.id === 'classic' && (
                          <img 
                            src="/assets/images/pieces/classic/white/wK.png" 
                            alt="Classic King" 
                            className="h-12 w-12"
                          />
                        )}
                        {style.id === 'svg' && (
                          <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
                            <path d="M20 5L10 25H30L20 5Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
                            <path d="M10 25H30L25 35H15L10 25Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
                            <rect x="18" y="2" width="4" height="10" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
                            <rect x="15" y="5" width="10" height="4" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
                          </svg>
                        )}
                        {style.id === 'unicode' && (
                          <span className="text-4xl">♔</span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{style.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{style.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );


// הוסף import למעלה:
        return (
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">App Theme</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTheme === theme.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-16 rounded ${theme.preview} border mb-3`}></div>
                    <div className="text-sm font-medium text-gray-900">{theme.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Board Theme</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {boardThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedBoardTheme(theme.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedBoardTheme === theme.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="grid grid-cols-2 h-16 rounded overflow-hidden mb-3">
                      <div style={{ backgroundColor: theme.light }}></div>
                      <div style={{ backgroundColor: theme.dark }}></div>
                      <div style={{ backgroundColor: theme.dark }}></div>
                      <div style={{ backgroundColor: theme.light }}></div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{theme.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'game':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gameplay Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Highlight legal moves</span>
                    <p className="text-xs text-gray-500">Show available moves when piece is selected</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.legalMovesHighlight}
                    onChange={(e) => handleSettingChange('legalMovesHighlight', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Capture highlight</span>
                    <p className="text-xs text-gray-500">Highlight captured pieces</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.captureHighlight}
                    onChange={(e) => handleSettingChange('captureHighlight', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Auto-save games</span>
                    <p className="text-xs text-gray-500">Automatically save completed games</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'sound':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Enable sounds</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Move sounds</span>
                  <input
                    type="checkbox"
                    checked={settings.moveSounds}
                    onChange={(e) => handleSettingChange('moveSounds', e.target.checked)}
                    disabled={!settings.soundEnabled}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Browser notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Email updates</span>
                  <input
                    type="checkbox"
                    checked={settings.emailUpdates}
                    onChange={(e) => handleSettingChange('emailUpdates', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Export Your Data</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Download all your games, statistics, and settings
                  </p>
                  <button
                    onClick={handleExportData}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Data</span>
                  </button>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Delete All Data</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Permanently delete all your data. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteData}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete All Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };


  return (
    <div className="h-full flex bg-gray-50">
      {/* Settings Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <p className="text-gray-600 text-sm">Customize your ChessMentor experience</p>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{section.label}</div>
                      <div className="text-xs opacity-75">{section.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-4xl">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;