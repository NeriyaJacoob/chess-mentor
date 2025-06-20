// src/App.js
// Main React application routes
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProfessionalLayout from './layouts/ProfessionalLayout';
import HomePage from './Pages/HomePage';
import PlayPage from './Pages/PlayPage';
import AnalysisPage from './Pages/AnalysisPage';
import PuzzlesPage from './Pages/PuzzlesPage';
import SettingsPage from './Pages/SettingsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProfessionalLayout />}>
          <Route index element={<HomePage />} />
          <Route path="play" element={<PlayPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="puzzles" element={<PuzzlesPage />} />
          <Route path="learn" element={<div className="p-6"><div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">Learn Page</h2><p className="text-gray-600">Interactive chess lessons coming soon!</p></div></div>} />
          <Route path="coach" element={<div className="p-6"><div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">AI Coach</h2><p className="text-gray-600">Full coach interface coming soon!</p></div></div>} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;