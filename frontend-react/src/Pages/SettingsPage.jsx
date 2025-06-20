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
  Save
} from 'lucide-react';

const ProfessionalSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [settings, setSettings] = useState({
    // Appearance
    theme: 'dark',
    boardStyle: 'wood',
    pieceStyle: 'classic',
    animations: true,
    boardCoordinates: true,
    highlightMoves: true,
    
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

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    // Simulate save
    setTimeout(() => {
      setUnsavedChanges(false);
    }, 1000);
  };    // eslint-disable-next-line no-restricted-globals

   const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      // Reset logic here
      setUnsavedChanges(false);
    }
  };

  const handleExportData = () => {
    // Export logic here
    console.log('Exporting data...');
  };

  const handleImportData = () => {
    // Import logic here
    console.log('Importing data...');
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Theme & Colors</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Theme</label>
              <p className="text-sm text-slate-400">Choose your preferred color scheme</p>
            </div>
            <div className="flex space-x-2">
              {[
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'light', label: 'Light', icon: Sun }
              ].map(theme => {
                const Icon = theme.icon;
                return (
                  <button
                    key={theme.value}
                    onClick={() => handleSettingChange('appearance', 'theme', theme.value)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
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

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Board Style</label>
              <p className="text-sm text-slate-400">Select board appearance</p>
            </div>
            <SelectInput
              value={settings.boardStyle}
              onChange={(value) => handleSettingChange('appearance', 'boardStyle', value)}
              options={[
                { value: 'wood', label: 'Wood' },
                { value: 'marble', label: 'Marble' },
                { value: 'metal', label: 'Metal' },
                { value: 'classic', label: 'Classic' }
              ]}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Piece Style</label>
              <p className="text-sm text-slate-400">Choose piece design</p>
            </div>
            <SelectInput
              value={settings.pieceStyle}
              onChange={(value) => handleSettingChange('appearance', 'pieceStyle', value)}
              options={[
                { value: 'classic', label: 'Classic' },
                { value: 'modern', label: 'Modern' },
                { value: 'minimal', label: 'Minimal' },
                { value: 'vintage', label: 'Vintage' }
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Visual Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Animations</label>
              <p className="text-sm text-slate-400">Enable piece movement animations</p>
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
              <label className="text-white font-medium">Highlight Moves</label>
              <p className="text-sm text-slate-400">Highlight possible moves</p>
            </div>
            <ToggleSwitch
              enabled={settings.highlightMoves}
              onChange={(value) => handleSettingChange('appearance', 'highlightMoves', value)}
            />
          </div>
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
              <label className="text-white font-medium">Show Evaluation</label>
              <p className="text-sm text-slate-400">Display engine evaluation</p>
            </div>
            <ToggleSwitch
              enabled={settings.showEvaluation}
              onChange={(value) => handleSettingChange('game', 'showEvaluation', value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">AI Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Default AI Level</label>
              <p className="text-sm text-slate-400">Preferred difficulty for new games</p>
            </div>
            <SelectInput
              value={settings.aiLevel}
              onChange={(value) => handleSettingChange('game', 'aiLevel', parseInt(value))}
              options={[
                { value: 1, label: 'Level 1 (Beginner)' },
                { value: 2, label: 'Level 2 (Novice)' },
                { value: 3, label: 'Level 3 (Amateur)' },
                { value: 4, label: 'Level 4 (Club)' },
                { value: 5, label: 'Level 5 (Strong Club)' },
                { value: 6, label: 'Level 6 (Expert)' },
                { value: 7, label: 'Level 7 (Master)' },
                { value: 8, label: 'Level 8 (Strong Master)' },
                { value: 9, label: 'Level 9 (Grandmaster)' },
                { value: 10, label: 'Level 10 (Maximum)' }
              ]}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Time Format</label>
              <p className="text-sm text-slate-400">How to display game time</p>
            </div>
            <SelectInput
              value={settings.timeFormat}
              onChange={(value) => handleSettingChange('game', 'timeFormat', value)}
              options={[
                { value: 'seconds', label: 'Seconds' },
                { value: 'minutes', label: 'Minutes:Seconds' },
                { value: 'hours', label: 'Hours:Minutes:Seconds' }
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSoundSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Audio</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Enable Sound</label>
              <p className="text-sm text-slate-400">Master audio toggle</p>
            </div>
            <ToggleSwitch
              enabled={settings.soundEnabled}
              onChange={(value) => handleSettingChange('sound', 'soundEnabled', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Master Volume</label>
              <p className="text-sm text-slate-400">Overall audio level</p>
            </div>
            <div className="w-40">
              <SliderInput
                value={settings.volume}
                onChange={(value) => handleSettingChange('sound', 'volume', value)}
                disabled={!settings.soundEnabled}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Sound Effects</h3>
        <div className="space-y-4">
          {[
            { key: 'moveSound', label: 'Move Sound', description: 'Play sound when pieces move' },
            { key: 'captureSound', label: 'Capture Sound', description: 'Play sound when capturing pieces' },
            { key: 'checkSound', label: 'Check Sound', description: 'Play sound when in check' },
            { key: 'gameEndSound', label: 'Game End Sound', description: 'Play sound when game ends' }
          ].map(sound => (
            <div key={sound.key} className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">{sound.label}</label>
                <p className="text-sm text-slate-400">{sound.description}</p>
              </div>
              <ToggleSwitch
                enabled={settings[sound.key]}
                onChange={(value) => handleSettingChange('sound', sound.key, value)}
                disabled={!settings.soundEnabled}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">In-App Notifications</h3>
        <div className="space-y-4">
          {[
            { key: 'puzzleReminders', label: 'Puzzle Reminders', description: 'Daily puzzle notifications' },
            { key: 'gameInvites', label: 'Game Invites', description: 'New game invitation alerts' },
            { key: 'achievements', label: 'Achievements', description: 'Achievement unlock notifications' }
          ].map(notification => (
            <div key={notification.key} className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">{notification.label}</label>
                <p className="text-sm text-slate-400">{notification.description}</p>
              </div>
              <ToggleSwitch
                enabled={settings[notification.key]}
                onChange={(value) => handleSettingChange('notifications', notification.key, value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Email Notifications</label>
              <p className="text-sm text-slate-400">Receive notifications via email</p>
            </div>
            <ToggleSwitch
              enabled={settings.emailNotifications}
              onChange={(value) => handleSettingChange('notifications', 'emailNotifications', value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Data Collection</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Analytics</label>
              <p className="text-sm text-slate-400">Help improve the app with usage data</p>
            </div>
            <ToggleSwitch
              enabled={settings.analytics}
              onChange={(value) => handleSettingChange('privacy', 'analytics', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Crash Reports</label>
              <p className="text-sm text-slate-400">Send crash reports to developers</p>
            </div>
            <ToggleSwitch
              enabled={settings.crashReports}
              onChange={(value) => handleSettingChange('privacy', 'crashReports', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Game History</label>
              <p className="text-sm text-slate-400">Store your game history locally</p>
            </div>
            <ToggleSwitch
              enabled={settings.gameHistory}
              onChange={(value) => handleSettingChange('privacy', 'gameHistory', value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Profile</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Public Profile</label>
              <p className="text-sm text-slate-400">Make your profile visible to others</p>
            </div>
            <ToggleSwitch
              enabled={settings.publicProfile}
              onChange={(value) => handleSettingChange('privacy', 'publicProfile', value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Import & Export</h3>
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-white">Export Data</h4>
                <p className="text-sm text-slate-400">Download your games, settings, and progress</p>
              </div>
              <button
                onClick={handleExportData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-white">Import Data</h4>
                <p className="text-sm text-slate-400">Restore from a previous export file</p>
              </div>
              <button
                onClick={handleImportData}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
              >
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Reset Options</h3>
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <h4 className="font-medium text-red-400">Danger Zone</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Reset Settings</label>
                  <p className="text-sm text-slate-400">Restore all settings to default values</p>
                </div>
                <button
                  onClick={handleResetSettings}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Clear All Data</label>
                  <p className="text-sm text-slate-400">Delete all games, stats, and settings</p>
                </div>
                <button
                  onClick={() => window.confirm('This action cannot be undone. Delete all data?')}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance': return renderAppearanceSettings();
      case 'game': return renderGameSettings();
      case 'sound': return renderSoundSettings();
      case 'notifications': return renderNotificationSettings();
      case 'privacy': return renderPrivacySettings();
      case 'data': return renderDataSettings();
      default: return renderAppearanceSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      
      {/* Settings Navigation */}
      <div className="w-80 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-gray-600/20 to-slate-600/20 rounded-xl border border-gray-500/20">
              <Settings className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <p className="text-slate-400 text-sm">Customize your experience</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6">
          <div className="space-y-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? tab.color : ''}`} />
                  <span className="font-medium">{tab.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Save Changes */}
        {unsavedChanges && (
          <div className="p-6 border-t border-white/10">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-blue-400" />
                <span className="text-blue-400 font-semibold text-sm">Unsaved Changes</span>
              </div>
              <p className="text-blue-300 text-xs">You have unsaved settings changes</p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleSaveSettings}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg font-semibold"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => setUnsavedChanges(false)}
                className="px-4 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Content */}
      <div className="flex-1 flex flex-col">
        
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {settingsTabs.find(tab => tab.id === activeTab)?.label}
              </h2>
              <p className="text-slate-400">
                Customize your {activeTab} preferences
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {unsavedChanges && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Modified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default ProfessionalSettingsPage;