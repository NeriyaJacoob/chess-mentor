// frontend-react/src/Pages/SettingsPage.jsx - עם אפשרויות עיצוב לוח חדשות
import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Palette, 
  Volume2, 
  Monitor, 
  Shield, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Moon, 
  Sun, 
  Check, 
  X,
  ChevronRight,
  Bell,
  Globe,
  Gamepad2,
  Eye,
  Zap,
  Crown,
  AlertTriangle,
  RefreshCw,
  Save,
  Square
} from 'lucide-react';

const ProfessionalSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [settings, setSettings] = useState({
    // Appearance
    theme: 'dark',
    boardTheme: 'professional', // ברירת מחדל שחור
    pieceStyle: 'unicode',
    animations: true,
    boardCoordinates: false, // מוסתר ברירת מחדל
    highlightMoves: true,
    showNumbers: false, // בלי המספרים הכחולים
    
    // Game
    autoQueen: false,
    confirmMoves: true,
    showEvaluation: true,
    aiLevel: 5,
    timeFormat: 'minutes',
    
    // Sound
    soundEnabled: true,
    moveSound: true,
    captureSound: true,
    checkSound: true,
    gameEndSound: true,
    volume: 70,
    
    // Privacy
    analytics: true,
    crashReports: true,
    gameHistory: true,
    publicProfile: false,
    
    // Notifications
    puzzleReminders: true,
    gameInvites: true,
    achievements: true,
    emailNotifications: false
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const settingsTabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette, color: 'text-purple-400' },
    { id: 'game', label: 'Gameplay', icon: Gamepad2, color: 'text-blue-400' },
    { id: 'sound', label: 'Sound', icon: Volume2, color: 'text-green-400' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-yellow-400' },
    { id: 'privacy', label: 'Privacy', icon: Shield, color: 'text-red-400' },
    { id: 'data', label: 'Data', icon: Database, color: 'text-indigo-400' }
  ];

  // אפשרויות עיצוב הלוח
  const boardThemes = [
    { 
      id: 'professional', 
      name: 'Professional', 
      description: 'Clean black design',
      preview: { light: '#404040', dark: '#2a2a2a' },
      recommended: true
    },
    { 
      id: 'classic', 
      name: 'Classic Wood', 
      description: 'Traditional wooden board',
      preview: { light: '#F0D9B5', dark: '#B58863' }
    },
    { 
      id: 'blue', 
      name: 'Blue Steel', 
      description: 'Modern blue theme',
      preview: { light: '#DEE3E6', dark: '#8CA2AD' }
    },
    { 
      id: 'green', 
      name: 'Forest Green', 
      description: 'Natural green colors',
      preview: { light: '#FFFFDD', dark: '#86A666' }
    },
    { 
      id: 'purple', 
      name: 'Royal Purple', 
      description: 'Elegant purple theme',
      preview: { light: '#F3E5F5', dark: '#7B1FA2' }
    }
  ];

  const pieceStyles = [
    { id: 'unicode', name: 'Unicode', description: 'Clean symbols' },
    { id: 'classic', name: 'Classic', description: 'Traditional pieces' },
    { id: 'modern', name: 'Modern', description: 'Sleek design' },
    { id: 'minimal', name: 'Minimal', description: 'Simple shapes' }
  ];

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    // שמירה ב-localStorage כדי שיישמר בין sessions
    localStorage.setItem('chessmentor_settings', JSON.stringify(settings));
    setTimeout(() => {
      setUnsavedChanges(false);
    }, 1000);
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        theme: 'dark',
        boardTheme: 'professional',
        pieceStyle: 'unicode',
        animations: true,
        boardCoordinates: false,
        highlightMoves: true,
        showNumbers: false,
        autoQueen: false,
        confirmMoves: true,
        showEvaluation: true,
        aiLevel: 5,
        timeFormat: 'minutes',
        soundEnabled: true,
        moveSound: true,
        captureSound: true,
        checkSound: true,
        gameEndSound: true,
        volume: 70,
        analytics: true,
        crashReports: true,
        gameHistory: true,
        publicProfile: false,
        puzzleReminders: true,
        gameInvites: true,
        achievements: true,
        emailNotifications: false
      });
      setUnsavedChanges(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${
        enabled ? 'bg-blue-600' : 'bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const SliderInput = ({ value, onChange, min = 0, max = 100, disabled = false }) => (
    <div className="flex items-center space-x-3">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <span className="text-white font-mono text-sm w-12 text-right">{value}%</span>
    </div>
  );

  const SelectInput = ({ value, onChange, options, disabled = false }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {options.map(option => (
        <option key={option.value} value={option.value} className="bg-slate-800">
          {option.label}
        </option>
      ))}
    </select>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-8">
      
      {/* Board Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Square className="h-5 w-5 mr-2 text-purple-400" />
          Board Style
        </h3>
        <p className="text-sm text-slate-400 mb-6">Choose your preferred board appearance</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boardThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleSettingChange('appearance', 'boardTheme', theme.id)}
              className={`relative p-4 rounded-xl border transition-all duration-300 text-left group ${
                settings.boardTheme === theme.id
                  ? 'bg-purple-500/20 border-purple-500/40 text-white shadow-lg ring-2 ring-purple-500/30'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {/* Theme Preview */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex space-x-1">
                  <div 
                    className="w-6 h-6 rounded-sm border border-white/20"
                    style={{ backgroundColor: theme.preview.light }}
                  ></div>
                  <div 
                    className="w-6 h-6 rounded-sm border border-white/20"
                    style={{ backgroundColor: theme.preview.dark }}
                  ></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{theme.name}</span>
                    {theme.recommended && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{theme.description}</p>
                </div>
              </div>
              
              {/* Selection Indicator */}
              {settings.boardTheme === theme.id && (
                <div className="absolute top-3 right-3">
                  <Check className="h-5 w-5 text-purple-400" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Piece Style */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Piece Style</h3>
        <div className="grid grid-cols-2 gap-3">
          {pieceStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => handleSettingChange('appearance', 'pieceStyle', style.id)}
              className={`p-3 rounded-xl border transition-all duration-300 text-left ${
                settings.pieceStyle === style.id
                  ? 'bg-blue-500/20 border-blue-500/40 text-white shadow-lg'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="font-semibold">{style.name}</div>
              <div className="text-sm text-slate-400">{style.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Options */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Visual Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Piece Animations</label>
              <p className="text-sm text-slate-400">Enable smooth piece movements</p>
            </div>
            <ToggleSwitch
              enabled={settings.animations}
              onChange={(value) => handleSettingChange('appearance', 'animations', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Board Coordinates</label>
              <p className="text-sm text-slate-400">Show file and rank labels</p>
            </div>
            <ToggleSwitch
              enabled={settings.boardCoordinates}
              onChange={(value) => handleSettingChange('appearance', 'boardCoordinates', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Highlight Legal Moves</label>
              <p className="text-sm text-slate-400">Show possible moves</p>
            </div>
            <ToggleSwitch
              enabled={settings.highlightMoves}
              onChange={(value) => handleSettingChange('appearance', 'highlightMoves', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Show Numbers on Board</label>
              <p className="text-sm text-slate-400">Display analysis numbers (can be distracting)</p>
            </div>
            <ToggleSwitch
              enabled={settings.showNumbers}
              onChange={(value) => handleSettingChange('appearance', 'showNumbers', value)}
            />
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">App Theme</h3>
        <div className="flex space-x-3">
          {[
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'light', label: 'Light', icon: Sun }
          ].map(theme => {
            const Icon = theme.icon;
            return (
              <button
                key={theme.value}
                onClick={() => handleSettingChange('appearance', 'theme', theme.value)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all duration-200 ${
                  settings.theme === theme.value
                    ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{theme.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderGameSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Game Behavior</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Auto-Queen Promotion</label>
              <p className="text-sm text-slate-400">Automatically promote pawns to queen</p>
            </div>
            <ToggleSwitch
              enabled={settings.autoQueen}
              onChange={(value) => handleSettingChange('game', 'autoQueen', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Confirm Moves</label>
              <p className="text-sm text-slate-400">Require confirmation before moving</p>
            </div>
            <ToggleSwitch
              enabled={settings.confirmMoves}
              onChange={(value) => handleSettingChange('game', 'confirmMoves', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Show Engine Evaluation</label>
              <p className="text-sm text-slate-400">Display position assessment</p>
            </div>
            <ToggleSwitch
              enabled={settings.showEvaluation}
              onChange={(value) => handleSettingChange('game', 'showEvaluation', value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Default AI Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Default AI Level</label>
              <p className="text-sm text-slate-400">Starting difficulty for new games</p>
            </div>
            <SelectInput
              value={settings.aiLevel}
              onChange={(value) => handleSettingChange('game', 'aiLevel', parseInt(value))}
              options={[
                { value: 1, label: 'Beginner (800)' },
                { value: 2, label: 'Novice (1000)' },
                { value: 3, label: 'Amateur (1200)' },
                { value: 4, label: 'Club Player (1400)' },
                { value: 5, label: 'Strong Club (1600)' },
                { value: 6, label: 'Expert (1800)' },
                { value: 7, label: 'Master (2000)' },
                { value: 8, label: 'International (2200)' },
                { value: 9, label: 'Grandmaster (2400)' },
                { value: 10, label: 'Stockfish (3200+)' }
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // הוספה של שאר הsections...
  const renderContent = () => {
    switch (activeTab) {
      case 'appearance':
        return renderAppearanceSettings();
      case 'game':
        return renderGameSettings();
      case 'sound':
        return <div className="text-white">Sound settings coming soon...</div>;
      case 'notifications':
        return <div className="text-white">Notification settings coming soon...</div>;
      case 'privacy':
        return <div className="text-white">Privacy settings coming soon...</div>;
      case 'data':
        return <div className="text-white">Data management coming soon...</div>;
      default:
        return renderAppearanceSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      
      {/* Sidebar */}
      <div className="w-80 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Settings className="h-6 w-6 mr-3 text-purple-400" />
            Settings
          </h1>
          <p className="text-slate-400 text-sm mt-2">Customize your chess experience</p>
        </div>
        
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${activeTab === tab.id ? tab.color : ''}`} />
                  <span className="font-medium">{tab.label}</span>
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </button>
              );
            })}
          </div>
        </nav>

        {/* Save/Reset Actions */}
        <div className="p-6 border-t border-white/10 space-y-3">
          {unsavedChanges && (
            <div className="flex items-center space-x-2 text-yellow-400 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>You have unsaved changes</span>
            </div>
          )}
          
          <button
            onClick={handleSaveSettings}
            disabled={!unsavedChanges}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              unsavedChanges
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
          
          <button
            onClick={handleResetSettings}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-600/30 transition-all duration-300"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalSettingsPage;