// src/components/Layout/CoachPanel.js
// Container for chat sidebar
import React from 'react';
import CoachChat from '../Coach/CoachChat';

const CoachPanel = () => {
  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="h-full">
        <CoachChat />
      </div>
    </aside>
  );
};

export default CoachPanel;