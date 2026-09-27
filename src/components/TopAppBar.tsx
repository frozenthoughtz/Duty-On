import React, { useState } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { OfflineQueueModal } from './modals/OfflineQueueModal';
import { EmergencyDuressModal } from './modals/EmergencyDuressModal';
import { BiometricLivenessModal } from './modals/BiometricLivenessModal';
import { AuthModal } from './modals/AuthModal';
import { AccessRestrictedModal } from './modals/AccessRestrictedModal';

export const TopAppBar: React.FC = () => {
  const { 
    activeMode, 
    setActiveMode, 
    isCloudConnected, 
    safetyStatus, 
    triggerDuressPanic,
    currentUserProfile,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isAccessRestrictedOpen,
    setIsAccessRestrictedOpen,
    restrictedTargetArea,
    attemptSwitchToControlRoom,
    logoutDutyOn,
    officer
  } = useDutyOn();

  const [isOfflineQueueOpen, setIsOfflineQueueOpen] = useState(false);
  const [isDuressOpen, setIsDuressOpen] = useState(false);
  const [isFaceIdOpen, setIsFaceIdOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 h-[66px] bg-[#081a2c]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1320px] mx-auto h-full px-2 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-2">
          
          {/* Brand */}
          <div className="flex items-center gap-2 flex-none">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 flex-none" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path 
                d="M20 3 L34 8 V19 C34 28 28 34 20 37 C12 34 6 28 6 19 V8 Z" 
                fill="#0E2A45" 
                stroke="#1FA6C9" 
                strokeWidth="1.6" 
              />
              <path 
                d="M13.5 20 l4.2 4.4 L27 14.5" 
                stroke="#5BCB80" 
                strokeWidth="3" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
            <div className="hidden sm:block">
              <div className="font-display font-extrabold text-lg tracking-wide text-white leading-none">
                DUTY <span className="text-[#3FC9E9]">ON</span>
              </div>
              <div className="text-[9px] tracking-[0.14em] uppercase text-[#8598A8] mt-0.5 font-medium">
                Enterprise Patrol Platform
              </div>
            </div>
          </div>

          {/* Mode Switcher with RBAC Protection */}
          {(!currentUserProfile || currentUserProfile.role === 'admin' || currentUserProfile.role === 'operator' || currentUserProfile.controlRoomAccess) ? (
            <div className="flex bg-white/[0.06] border border-white/10 rounded-xl p-0.5 sm:p-1 gap-0.5 sm:gap-1" role="tablist">
              <button
                onClick={() => setActiveMode('mobile')}
                role="tab"
                aria-selected={activeMode === 'mobile'}
                className={`px-2 sm:px-3 py-1.5 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                  activeMode === 'mobile'
                    ? 'bg-[#1FA6C9] text-[#04222c] shadow-sm'
                    : 'text-[#9db0c0] hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <rect x="7" y="2" width="10" height="20" rx="2.5" />
                  <path d="M11 18h2" />
                </svg>
                <span>Officer<span className="hidden sm:inline"> App</span></span>
              </button>

              <button
                onClick={attemptSwitchToControlRoom}
                role="tab"
                aria-selected={activeMode === 'desktop'}
                className={`px-2 sm:px-3 py-1.5 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                  activeMode === 'desktop'
                    ? 'bg-[#1FA6C9] text-[#04222c] shadow-sm'
                    : 'text-[#9db0c0] hover:text-white'
                }`}
                title="Switch to central Control Room operations"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <rect x="2" y="4" width="20" height="13" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                <span>Control<span className="hidden sm:inline"> Room</span></span>
              </button>
            </div>
          ) : (
            /* Officers without Control Room access only see their Field App badge and an elevation key */
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#1FA6C9]/15 text-[#3FC9E9] border border-[#1FA6C9]/30 rounded-xl px-3 py-1.5 font-display font-bold text-xs">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="7" y="2" width="10" height="20" rx="2.5" />
                  <path d="M11 18h2" />
                </svg>
                <span>Officer Field App</span>
              </div>

              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
                title="Control Room Operator / Admin Login"
              >
                <span>🔑</span>
                <span>Control Room Login</span>
              </button>
            </div>
          )}

          {/* Security Profile & Tools */}
          <div className="flex items-center gap-1 sm:gap-2 flex-none">
            {/* Active User / RBAC Badge & Login Trigger */}
            <button
              id="btn-topbar-profile"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1 sm:gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#1FA6C9]/40 rounded-xl px-2 sm:px-2.5 py-1.5 transition-all cursor-pointer text-left"
              title="Manage security credentials, switch officer persona, or sign in"
            >
              <div className={`w-6 h-6 rounded-lg grid place-items-center font-bold text-[11px] flex-none ${
                currentUserProfile?.role === 'admin'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : currentUserProfile?.role === 'operator'
                  ? 'bg-[#1FA6C9]/20 text-[#3FC9E9] border border-[#1FA6C9]/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {currentUserProfile?.displayName?.[0] || 'U'}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="font-semibold text-xs text-white max-w-[110px] truncate">
                  {currentUserProfile?.displayName || 'Sign In'}
                </div>
                <div className="text-[9px] font-mono-code uppercase font-semibold text-[#8598A8]">
                  {currentUserProfile?.role || 'Guest'}
                </div>
              </div>
              <span className="text-[10px] text-[#8598A8]">▾</span>
            </button>

            {/* Direct Log Out Button */}
            <button
              onClick={logoutDutyOn}
              className="flex items-center gap-1 bg-white/5 hover:bg-rose-500/20 text-[#8598A8] hover:text-rose-300 border border-white/10 hover:border-rose-500/40 rounded-xl px-2 py-1.5 transition-all cursor-pointer text-xs"
              title="Sign Out of DutyOn Security Terminal"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline text-[11px] font-semibold">Exit</span>
            </button>

            <button
              onClick={() => setIsFaceIdOpen(true)}
              className="hidden lg:flex items-center gap-1 font-mono-code text-[11px] font-semibold text-[#8598A8] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2 py-1 transition-all cursor-pointer"
              title="Launch Biometric Liveness Face ID test"
            >
              <span>👤</span>
              <span>Face ID</span>
            </button>

            <button
              id="btn-topbar-sos"
              onClick={() => {
                triggerDuressPanic();
                setIsDuressOpen(true);
              }}
              className={`flex items-center gap-1 font-mono-code text-[11px] font-bold rounded-lg px-2 sm:px-2.5 py-1 transition-all cursor-pointer border ${
                safetyStatus.duressTriggered || safetyStatus.manDownActive
                  ? 'bg-rose-600 text-white border-white animate-pulse'
                  : 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30'
              }`}
              title="Emergency Lone-Worker Duress / Panic Center"
            >
              <span>🚨</span>
              <span className="hidden sm:inline">SOS</span>
            </button>

            {/* Offline Sync Queue Tracker (Always visible for mobile & desktop) */}
            <button
              id="btn-topbar-queue"
              onClick={() => setIsOfflineQueueOpen(true)}
              className="flex items-center gap-1 font-mono-code text-[11px] font-semibold tracking-wider text-[#3FC9E9] hover:text-white bg-[#1FA6C9]/10 hover:bg-[#1FA6C9]/20 border border-[#1FA6C9]/30 rounded-lg px-2 sm:px-2.5 py-1 transition-all cursor-pointer"
              title="Track pending offline checkpoint scans, OB notes & biometric records"
            >
              <span>📶</span>
              <span className="hidden xs:inline sm:inline">Queue</span>
            </button>

            <div className="inline-flex items-center gap-1 font-mono-code text-[10px] sm:text-[11px] tracking-[0.05em] uppercase text-[#5BCB80] border border-[#5BCB80]/40 rounded-md px-1.5 sm:px-2 py-1 bg-[#5BCB80]/10">
              <span className={`w-2 h-2 rounded-full flex-none ${isCloudConnected ? 'bg-[#5BCB80] animate-pulse' : 'bg-[#E7A13A]'}`} />
              <span className="hidden sm:inline">{isCloudConnected ? 'Cloud Sync' : 'Local'}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Auth & RBAC Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Access Clearance Required Modal */}
      <AccessRestrictedModal
        isOpen={isAccessRestrictedOpen}
        onClose={() => setIsAccessRestrictedOpen(false)}
        targetArea={restrictedTargetArea}
        onAccessGranted={() => {
          if (restrictedTargetArea === 'control_room') {
            setActiveMode('desktop');
          }
        }}
      />

      {/* Offline Queue Modal */}
      <OfflineQueueModal
        isOpen={isOfflineQueueOpen}
        onClose={() => setIsOfflineQueueOpen(false)}
      />

      {/* Emergency Duress Modal */}
      <EmergencyDuressModal
        isOpen={isDuressOpen}
        onClose={() => setIsDuressOpen(false)}
        type={safetyStatus.duressTriggered ? 'duress' : 'man_down'}
      />

      {/* Biometric Liveness Scanner Modal */}
      <BiometricLivenessModal
        isOpen={isFaceIdOpen}
        onClose={() => setIsFaceIdOpen(false)}
        officerName={officer.name}
        psiraNumber={officer.grade}
      />
    </>
  );
};

