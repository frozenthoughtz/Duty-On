import React, { useState } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { MobileHomeScreen } from './MobileHomeScreen';
import { MobileScreens } from './MobileScreens';
import { PersonalProfileModal } from './modals/PersonalProfileModal';
import { NewIncidentModal } from './modals/NewIncidentModal';

export const MobileOfficerApp: React.FC = () => {
  const { 
    mobileScreen, 
    setMobileScreen, 
    isMoreSheetOpen, 
    setIsMoreSheetOpen,
    clockTime,
    officer,
    isNewIncidentModalOpen,
    setIsNewIncidentModalOpen
  } = useDutyOn();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-10 py-6 px-4 max-w-[1240px] mx-auto min-h-[calc(100vh-66px)]">
      {/* Interactive Phone Frame Mockup */}
      <div className="relative w-full max-w-[390px] h-[780px] bg-black rounded-[46px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.15)] flex flex-col flex-none border-[3px] border-[#25394b]">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-end px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#111c24] border border-white/10" />
        </div>

        {/* Screen Bezel Container */}
        <div className="w-full h-full bg-[#f4f7fa] rounded-[38px] overflow-hidden flex flex-col relative">
          
          {/* iOS Status Bar */}
          <div className="h-9 px-6 flex items-center justify-between text-[11.5px] font-semibold text-[#0B1E30] flex-none z-30 pt-1">
            <span>{(clockTime || '23:42').slice(0, 5)}</span>
            <div className="flex items-center gap-1.5">
              {/* Cellular */}
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <rect x="2" y="16" width="3" height="6" rx="1" />
                <rect x="7" y="12" width="3" height="10" rx="1" />
                <rect x="12" y="8" width="3" height="14" rx="1" />
                <rect x="17" y="4" width="3" height="18" rx="1" />
              </svg>
              {/* WiFi */}
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 18a2 2 0 100 4 2 2 0 000-4zM2 9.5a14 14 0 0120 0M5 13.5a10 10 0 0114 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {/* Battery */}
              <div className="w-5 h-2.5 border border-current rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-current rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Top Bar for sub-screens */}
          {mobileScreen !== 'home' && (
            <div className="px-4 py-2 flex items-center gap-2 border-b border-[#e5ebf1] bg-white/80 backdrop-blur-xs flex-none z-20">
              <button
                onClick={() => setMobileScreen('home')}
                className="w-8 h-8 rounded-full hover:bg-slate-100 grid place-items-center text-[#20364A] cursor-pointer"
              >
                <svg className="w-4 h-4 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="font-display font-bold text-sm text-[#0B1E30] capitalize">
                {mobileScreen === 'clockin' ? 'Attendance' :
                 mobileScreen === 'ob' ? 'Occurrence Book' :
                 mobileScreen === 'comchat' ? 'Com-Chat & PTT' :
                 mobileScreen}
              </div>
            </div>
          )}

          {/* Screen Content Viewport */}
          <div className="flex-1 overflow-y-auto no-scrollbar relative">
            {mobileScreen === 'home' ? (
              <MobileHomeScreen />
            ) : (
              <MobileScreens />
            )}
          </div>

          {/* Bottom Tab Navigation */}
          <div className="h-[62px] bg-white border-t border-[#e5ebf1] grid grid-cols-5 items-center px-1 flex-none z-30">
            {/* Home */}
            <button
              onClick={() => {
                setMobileScreen('home');
                setIsMoreSheetOpen(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                mobileScreen === 'home' ? 'text-[#1FA6C9]' : 'text-[#8598A8] hover:text-[#20364A]'
              }`}
            >
              <svg className="w-5 h-5 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
                <path d="M3 10l9-7 9 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
                <path d="M9 21V12h6v9" />
              </svg>
              <span className="text-[10px] font-semibold">Home</span>
            </button>

            {/* Roster */}
            <button
              onClick={() => {
                setMobileScreen('roster');
                setIsMoreSheetOpen(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                mobileScreen === 'roster' ? 'text-[#1FA6C9]' : 'text-[#8598A8] hover:text-[#20364A]'
              }`}
            >
              <svg className="w-5 h-5 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M8 2v4M16 2v4M3 10h18" />
              </svg>
              <span className="text-[10px] font-semibold">Roster</span>
            </button>

            {/* Clock */}
            <button
              onClick={() => {
                setMobileScreen('clockin');
                setIsMoreSheetOpen(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                mobileScreen === 'clockin' ? 'text-[#1FA6C9]' : 'text-[#8598A8] hover:text-[#20364A]'
              }`}
            >
              <svg className="w-5 h-5 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="text-[10px] font-semibold">Clock</span>
            </button>

            {/* Patrols */}
            <button
              onClick={() => {
                setMobileScreen('patrols');
                setIsMoreSheetOpen(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                mobileScreen === 'patrols' ? 'text-[#1FA6C9]' : 'text-[#8598A8] hover:text-[#20364A]'
              }`}
            >
              <svg className="w-5 h-5 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
                <path d="M12 3l8 3v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
              </svg>
              <span className="text-[10px] font-semibold">Patrols</span>
            </button>

            {/* More */}
            <button
              onClick={() => setIsMoreSheetOpen(!isMoreSheetOpen)}
              className={`flex flex-col items-center gap-1 transition-all ${
                isMoreSheetOpen ? 'text-[#1FA6C9]' : 'text-[#8598A8] hover:text-[#20364A]'
              }`}
            >
              <svg className="w-5 h-5 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
              <span className="text-[10px] font-semibold">More</span>
            </button>
          </div>

          {/* Bottom Sheet Drawer for "More" */}
          {isMoreSheetOpen && (
            <div className="absolute inset-0 bg-black/40 z-40 flex flex-col justify-end animate-fade-in">
              <div 
                className="bg-white rounded-t-3xl p-4 space-y-2 border-t border-[#d8e2eb] shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 bg-[#d0dbe5] rounded-full mx-auto mb-3" />
                <div className="font-display font-bold text-sm text-[#0B1E30] mb-2 px-1">
                  Additional Officer Tools
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMobileScreen('leave');
                      setIsMoreSheetOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#e5ebf1] hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#eaf6ee] text-[#3AA655] grid place-items-center flex-none">
                      📅
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#0B1E30]">Leave</div>
                      <div className="text-[10px] text-[#8598A8]">Submit requests</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setMobileScreen('payquery');
                      setIsMoreSheetOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#e5ebf1] hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#eef6f9] text-[#1FA6C9] grid place-items-center flex-none">
                      💳
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#0B1E30]">Pay Query</div>
                      <div className="text-[10px] text-[#8598A8]">Hours &amp; slips</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setMobileScreen('documents');
                      setIsMoreSheetOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#e5ebf1] hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#eef6f9] text-[#1FA6C9] grid place-items-center flex-none">
                      📑
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#0B1E30]">Documents</div>
                      <div className="text-[10px] text-[#8598A8]">Contracts &amp; certs</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setMobileScreen('ob');
                      setIsMoreSheetOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#e5ebf1] hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#eef6f9] text-[#1FA6C9] grid place-items-center flex-none">
                      📖
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#0B1E30]">Occurrence Book</div>
                      <div className="text-[10px] text-[#8598A8]">Hourly logs</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileModalOpen(true);
                      setIsMoreSheetOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#1FA6C9]/40 bg-[#1FA6C9]/10 hover:bg-[#1FA6C9]/20 text-left cursor-pointer col-span-2"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#1FA6C9] text-white grid place-items-center flex-none text-base">
                      🪪
                    </span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-[#0B1E30]">Personal Profile &amp; PSIRA Vault</div>
                      <div className="text-[10px] text-[#5D6E7E]">View &amp; edit profile, certificates, firearm competency, emergency contacts</div>
                    </div>
                    <span className="text-xs font-bold text-[#1FA6C9]">Edit ›</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="w-full mt-2 py-2.5 text-xs font-bold text-[#5D6E7E] hover:bg-slate-100 rounded-xl"
                >
                  Close Menu
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Side Explanation & Quick Guide */}
      <div className="w-full lg:max-w-[420px] space-y-4 pt-2">
        {/* Personal Profile Quick Card */}
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🪪</span>
              <div>
                <h4 className="font-display font-bold text-sm text-white">{officer.name}</h4>
                <p className="text-[11px] text-[#3FC9E9]">{officer.role} · {officer.grade}</p>
              </div>
            </div>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3 py-1.5 bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] text-xs font-display font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-[#1FA6C9]/20"
            >
              Open Profile Manager
            </button>
          </div>
          <div className="text-[11px] text-[#8598A8] bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
            <span>Current Assignment: <strong className="text-white">{officer.currentSite}</strong></span>
            <span className="text-emerald-400 font-mono-code font-bold">ACTIVE</span>
          </div>
        </div>

        <div className="bg-[#0A1E33]/80 border border-white/10 rounded-2xl p-5 text-white backdrop-blur-md">
          <div className="font-display font-bold text-lg text-white mb-3 flex items-center gap-2">
            <span className="text-[#3FC9E9]">📱</span> Officer Mobile Experience
          </div>
          <p className="text-xs text-[#b8c9d9] leading-relaxed mb-4">
            A native-grade, offline-resilient field application designed for security officers in South Africa.
            Eliminates paper registers, prevents ghost guards, and automates real-time compliance.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#1FA6C9]/20 text-[#3FC9E9] font-mono-code font-bold text-xs grid place-items-center flex-none mt-0.5">
                1
              </span>
              <div className="text-xs text-[#dbe5ee]">
                <strong className="text-white">Face ID + Geofence:</strong> Tap <span className="text-[#3FC9E9] font-semibold">Clock in with Face ID</span> on the home screen to test biometric validation and 18m perimeter verification.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#1FA6C9]/20 text-[#3FC9E9] font-mono-code font-bold text-xs grid place-items-center flex-none mt-0.5">
                2
              </span>
              <div className="text-xs text-[#dbe5ee]">
                <strong className="text-white">Bottom Tabs &amp; More:</strong> Move between Roster, Leave, Pay Query, Documents, Occurrence Book (OB), and team Comms.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#1FA6C9]/20 text-[#3FC9E9] font-mono-code font-bold text-xs grid place-items-center flex-none mt-0.5">
                3
              </span>
              <div className="text-xs text-[#dbe5ee]">
                <strong className="text-white">Patrols &amp; PTT:</strong> Try <span className="text-[#5BCB80] font-semibold">Scan checkpoint</span> on Patrols to step through Sefeko RFID points, and <span className="text-[#3FC9E9] font-semibold">Hold to talk</span> on Com-Chat.
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#8598A8]">
            <span className="font-mono-code text-[#E7A13A]">● Live Biometric Simulation</span>
            <span>Multi-location synced</span>
          </div>
        </div>
      </div>

      {/* Connected Personal Profile Modal */}
      <PersonalProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Mobile Incident Report Modal */}
      {isNewIncidentModalOpen && (
        <NewIncidentModal
          isOpen={isNewIncidentModalOpen}
          onClose={() => setIsNewIncidentModalOpen(false)}
        />
      )}
    </div>
  );
};
