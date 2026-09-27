import React, { useState } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { PersonalProfileModal } from './modals/PersonalProfileModal';

export const MobileHomeScreen: React.FC = () => {
  const { 
    officer, 
    setMobileScreen, 
    alerts, 
    currentUserProfile, 
    setIsAuthModalOpen,
    attemptSwitchToControlRoom,
    requestLiveGPSLocation,
    setIsNewIncidentModalOpen,
    triggerDuressPanic,
    clearDuressPanic,
    safetyStatus
  } = useDutyOn();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const barHeights = [30, 22, 44, 26, 40, 34, 46];

  // Check for recent high or critical control room alerts/broadcasts
  const activeBroadcast = alerts.find(
    (a) => a.priority === 'CRITICAL' || a.priority === 'HIGH' || a.type === 'CRITICAL' || a.type === 'HIGH'
  );

  return (
    <div className="p-4 space-y-3.5">
      {/* Live Operational Broadcast from Control Room */}
      {activeBroadcast && (
        <div className="bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/10 border border-rose-500/30 rounded-2xl p-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-rose-500 text-white grid place-items-center text-xs flex-none shadow-xs animate-pulse">
              📢
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                  Control Room Tactical Alert
                </span>
                <span className="text-[10px] font-mono-code text-rose-600">{activeBroadcast.time}</span>
              </div>
              <div className="font-display font-bold text-xs text-[#0B1E30] mt-1 leading-snug">
                {activeBroadcast.title}
              </div>
              <p className="text-[11px] text-[#5D6E7E] mt-0.5 leading-relaxed line-clamp-2">
                {activeBroadcast.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Greeting & Active Guard Identity Card */}
      <div className="bg-white border border-[#e9eef3] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-[#5D6E7E] font-medium flex items-center gap-1.5">
              <span>Security Officer Profile</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3AA655] animate-pulse" />
              <span className="text-[10px] font-mono-code text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Synced from Control Room
              </span>
            </div>
            <h3 className="font-display font-extrabold text-2xl text-[#0B1E30] tracking-tight mt-1">
              {officer.name}
            </h3>
            <div className="text-xs font-semibold text-[#1FA6C9] mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>{officer.role}</span>
              <span>·</span>
              <span className="text-slate-600">{officer.grade}</span>
              <span>·</span>
              <span className="font-mono-code text-slate-500">PSIRA #{officer.psiraNumber || '2890141'}</span>
            </div>
          </div>

          {/* Action Buttons: Profile Manager & Persona Switch */}
          <div className="flex items-center gap-1.5 flex-none">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-[#1FA6C9]/15 hover:bg-[#1FA6C9]/25 border border-[#1FA6C9]/30 text-[#0f5466] font-mono-code text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Open Personal Profile & PSIRA Manager"
            >
              <span>🪪</span>
              <span>Profile</span>
            </button>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-[#0B1E30] font-mono-code text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Switch officer profile or log in with Google"
            >
              <span>👤</span>
              <span>Switch</span>
            </button>
          </div>
        </div>

        {/* Operational Guard Details Grid (Pulled from Control Room) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f0f4f8] text-xs">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div className="text-[10px] font-mono-code uppercase font-semibold text-[#64748b]">
              Site Deployed
            </div>
            <div className="font-bold text-[#0B1E30] truncate mt-0.5" title={officer.currentSite}>
              📍 {officer.currentSite}
            </div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">
              Post: {officer.currentPost || 'Main Security Post'}
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div className="text-[10px] font-mono-code uppercase font-semibold text-[#64748b]">
              Current Shift
            </div>
            <div className="font-bold text-[#0B1E30] truncate mt-0.5">
              ⏰ {officer.currentShift || 'Day Shift (06:00 – 18:00)'}
            </div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono-code">
              Hours Today: {officer.hoursToday || '0.00'} hrs
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code uppercase font-semibold text-[#64748b]">
                Real Location
              </span>
              <button 
                onClick={() => requestLiveGPSLocation && requestLiveGPSLocation()}
                className="text-[10px] text-[#1FA6C9] font-mono-code font-bold hover:underline cursor-pointer"
                title="Refresh GPS Lock"
              >
                GPS ⟳
              </button>
            </div>
            <div className="font-bold text-[#0B1E30] truncate mt-0.5" title={officer.location || officer.currentSite}>
              📍 {officer.location || officer.currentSite || 'Provincial Office, Beaufort West'}
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono-code uppercase font-semibold text-[#64748b]">
                Duty Status
              </div>
              <div className="font-bold text-[#0B1E30] mt-0.5">
                {officer.isClockedIn ? 'On Duty' : 'Off Duty'}
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 font-semibold text-xs px-2.5 py-1 rounded-full ${
              officer.isClockedIn
                ? 'bg-[#3AA655]/15 text-[#2c7a41]'
                : 'bg-amber-500/15 text-amber-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${officer.isClockedIn ? 'bg-[#3AA655] animate-pulse' : 'bg-amber-500'}`} />
              <span>{officer.isClockedIn ? 'Active' : 'Standby'}</span>
            </span>
          </div>
        </div>

        {/* Quick Profile Manager Banner */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-[#0A1E33] to-[#122e47] text-white rounded-xl border border-white/10 flex items-center justify-between text-xs font-semibold hover:border-[#3FC9E9]/40 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">📁</span>
            <span>Personal Profile &amp; Compliance Vault</span>
          </div>
          <span className="text-[#3FC9E9] text-[11px] font-mono-code flex items-center gap-0.5">
            Manage &amp; Edit ›
          </span>
        </button>
      </div>

      {/* Clock In / Out Quick Button */}
      <button
        onClick={() => setMobileScreen('clockin')}
        className={`w-full font-display font-bold text-base py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer ${
          officer.isClockedIn
            ? 'bg-[#3AA655] hover:bg-[#34954d] text-white shadow-[#3AA655]/25 active:scale-[0.98]'
            : 'bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] shadow-[#1FA6C9]/25 active:scale-[0.98]'
        }`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M8 9h.01M16 9h.01M8.5 14.5s1.3 1.5 3.5 1.5 3.5-1.5 3.5-1.5" />
        </svg>
        <span>{officer.isClockedIn ? 'Status: Active on Duty (Click to manage)' : 'Clock in with Face ID'}</span>
      </button>

      {/* Attendance Stats Card */}
      <div className="bg-white border border-[#e9eef3] rounded-2xl p-4 shadow-sm">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-[#5D6E7E] font-medium">Your attendance</div>
            <div className="font-display font-extrabold text-3xl sm:text-[34px] text-[#0B1E30] leading-none my-1">
              {officer.payPeriodHours.toFixed(1)}
            </div>
            <div className="text-xs text-[#5D6E7E]">Hours worked · this pay period</div>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="flex items-end gap-1.5 h-[52px]">
            {barHeights.map((h, i) => (
              <i
                key={i}
                className="w-2 bg-[#1FA6C9] rounded-sm opacity-85 block transition-all"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Header */}
      <div className="font-display font-bold text-sm text-[#20364A] pt-1">
        Quick actions
      </div>

      {/* Quick Actions Grid (3x2) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Roster */}
        <button
          onClick={() => setMobileScreen('roster')}
          className="bg-white hover:bg-[#f8fafc] active:scale-[0.96] border border-[#e9eef3] rounded-2xl p-3 flex flex-col items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span className="w-10 h-10 rounded-xl bg-[#eef6f9] grid place-items-center">
            <svg className="w-5 h-5 stroke-[#1FA6C9] fill-none stroke-[1.9]" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M8 2v4M16 2v4M3 10h18" />
            </svg>
          </span>
          <span className="text-xs font-semibold text-[#20364A]">Roster</span>
        </button>

        {/* Leave */}
        <button
          onClick={() => setMobileScreen('leave')}
          className="bg-white hover:bg-[#f8fafc] active:scale-[0.96] border border-[#e9eef3] rounded-2xl p-3 flex flex-col items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span className="w-10 h-10 rounded-xl bg-[#eaf6ee] grid place-items-center">
            <svg className="w-5 h-5 stroke-[#3AA655] fill-none stroke-[1.9]" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M8 2v4M16 2v4M8 14l3 3 5-5" />
            </svg>
          </span>
          <span className="text-xs font-semibold text-[#20364A]">Leave</span>
        </button>

        {/* Pay Query */}
        <button
          onClick={() => setMobileScreen('payquery')}
          className="bg-white hover:bg-[#f8fafc] active:scale-[0.96] border border-[#e9eef3] rounded-2xl p-3 flex flex-col items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span className="w-10 h-10 rounded-xl bg-[#eef6f9] grid place-items-center">
            <svg className="w-5 h-5 stroke-[#1FA6C9] fill-none stroke-[1.9]" viewBox="0 0 24 24">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M2 10h20M6 14h4" />
            </svg>
          </span>
          <span className="text-xs font-semibold text-[#20364A]">Pay Query</span>
        </button>

        {/* Documents */}
        <button
          onClick={() => setMobileScreen('documents')}
          className="bg-white hover:bg-[#f8fafc] active:scale-[0.96] border border-[#e9eef3] rounded-2xl p-3 flex flex-col items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span className="w-10 h-10 rounded-xl bg-[#eef6f9] grid place-items-center">
            <svg className="w-5 h-5 stroke-[#1FA6C9] fill-none stroke-[1.9]" viewBox="0 0 24 24">
              <path d="M6 3h9l3 3v15H6z" />
              <path d="M9 12h6M9 16h4" />
            </svg>
          </span>
          <span className="text-xs font-semibold text-[#20364A]">Documents</span>
        </button>

        {/* Patrols */}
        <button
          onClick={() => setMobileScreen('patrols')}
          className="bg-white hover:bg-[#f8fafc] active:scale-[0.96] border border-[#e9eef3] rounded-2xl p-3 flex flex-col items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span className="w-10 h-10 rounded-xl bg-[#eaf6ee] grid place-items-center">
            <svg className="w-5 h-5 stroke-[#3AA655] fill-none stroke-[1.9]" viewBox="0 0 24 24">
              <path d="M12 3l8 3v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
            </svg>
          </span>
          <span className="text-xs font-semibold text-[#20364A]">Patrols</span>
        </button>

        {/* Com-Chat */}
        <button
          onClick={() => setMobileScreen('comchat')}
          className="bg-white hover:bg-[#f8fafc] active:scale-[0.96] border border-[#e9eef3] rounded-2xl p-3 flex flex-col items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span className="w-10 h-10 rounded-xl bg-[#eef6f9] grid place-items-center">
            <svg className="w-5 h-5 stroke-[#1FA6C9] fill-none stroke-[1.9]" viewBox="0 0 24 24">
              <path d="M4 5h16v11H9l-4 4z" />
            </svg>
          </span>
          <span className="text-xs font-semibold text-[#20364A]">Com-Chat</span>
        </button>
      </div>

      {/* Occurrence Book & Emergency Incident Actions */}
      <div className="space-y-2">
        <div 
          onClick={() => setMobileScreen('ob')}
          className="bg-white/90 border border-[#e9eef3] hover:border-[#1FA6C9]/50 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1FA6C9]/10 text-[#1FA6C9] grid place-items-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M4 4h16v16H4z" />
                <path d="M8 9h8M8 13h8M8 17h5" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B1E30]">Online Occurrence Book</div>
              <div className="text-[11px] text-[#5D6E7E]">{officer.currentSite} · Active shift log</div>
            </div>
          </div>
          <span className="text-xs font-bold text-[#1FA6C9]">Open ›</span>
        </div>

        {/* Dedicated Officer Incident Queue & SAPS Docket Trigger */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setIsNewIncidentModalOpen(true);
            }}
            className="w-full bg-gradient-to-r from-rose-500/10 to-red-500/15 hover:from-rose-500/20 hover:to-red-500/25 text-[#E0574B] border border-rose-500/30 rounded-xl p-3 text-left transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5 font-display font-bold text-xs text-rose-700">
              <span>🚨</span>
              <span>Log Incident</span>
            </div>
            <div className="text-[10px] text-rose-600/80 mt-0.5 font-medium leading-tight">
              To Incident Queue &amp; Dispatch
            </div>
          </button>

          <button
            onClick={safetyStatus?.duressTriggered ? clearDuressPanic : triggerDuressPanic}
            className={`w-full rounded-xl p-3 text-left transition-all cursor-pointer shadow-xs active:scale-[0.98] border ${
              safetyStatus?.duressTriggered
                ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                : 'bg-white hover:bg-slate-50 text-[#0B1E30] border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-display font-bold text-xs">
              <span>⚠️</span>
              <span>{safetyStatus?.duressTriggered ? 'Duress Active' : 'Duress SOS'}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium leading-tight">
              {safetyStatus?.duressTriggered ? 'Tap to clear alert' : 'Silent officer distress'}
            </div>
          </button>
        </div>
      </div>

      {/* Personal Profile Manager Modal */}
      <PersonalProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};
