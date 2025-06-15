// src/layouts/MainLayout.js
import React from 'react';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import CoachPanel from '../components/Layout/CoachPanel';

const MainLayout = ({ children, showCoach = true }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Center Content */}
        <main className={`flex-1 p-6 overflow-auto ${showCoach ? 'mr-80' : ''}`}>
          {children}
        </main>
        
        {/* Right Coach Panel */}
        {showCoach && <CoachPanel />}
      </div>
    </div>
  );
};

export default MainLayout;