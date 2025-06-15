// frontend-react/src/layouts/ProfessionalLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import ProfessionalSidebar from '../components/Layout/ProfessionalSidebar';
import TopBar from '../components/Layout/TopBar';

const ProfessionalLayout = () => {
  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ProfessionalSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProfessionalLayout;