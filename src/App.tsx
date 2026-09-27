import React from 'react';
import { DutyOnProvider, useDutyOn } from './context/DutyOnContext';
import { TopAppBar } from './components/TopAppBar';
import { MobileOfficerApp } from './components/MobileOfficerApp';
import { DesktopControlRoom } from './components/DesktopControlRoom';
import { DutyOnAuthPortal } from './components/DutyOnAuthPortal';

const MainLayout: React.FC = () => {
  const { currentUserProfile, activeMode, toastMessage } = useDutyOn();

  // If no user is logged in, show the secure DutyOn Access Portal
  if (!currentUserProfile) {
    return (
      <>
        <DutyOnAuthPortal />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0E2A45] border border-[#1FA6C9]/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-[#3FC9E9] animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#071726] text-[#e8f1f8] font-sans antialiased selection:bg-[#1FA6C9] selection:text-white flex flex-col">
      {/* Persistent App Header */}
      <TopAppBar />

      {/* Main Content Area (Officer Mobile vs Control Room Desktop) */}
      <div className="flex-1 w-full">
        {activeMode === 'mobile' ? (
          <MobileOfficerApp />
        ) : (
          <DesktopControlRoom />
        )}
      </div>

      {/* Global Interactive Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E2A45] border border-[#1FA6C9]/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-[#3FC9E9] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <DutyOnProvider>
      <MainLayout />
    </DutyOnProvider>
  );
}

export default App;
