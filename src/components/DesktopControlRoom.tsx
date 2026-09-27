import React, { useState } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { DesktopLiveMap } from './DesktopLiveMap';
import { AudioWave } from './AudioWave';
import { DesktopPatrolsManager } from './DesktopPatrolsManager';
import { VisualShiftDashboard } from './VisualShiftDashboard';
import { RosterManagementView } from './RosterManagementView';
import { IncidentReportsView } from './IncidentReportsView';
import { OfficerDocumentPortal } from './OfficerDocumentPortal';
import { OfficerCommandModal } from './modals/OfficerCommandModal';
import { SiteCommandModal } from './modals/SiteCommandModal';
import { IncidentCommandModal } from './modals/IncidentCommandModal';
import { RosterShiftModal } from './modals/RosterShiftModal';
import { NewIncidentModal } from './modals/NewIncidentModal';
import { NewOfficerModal } from './modals/NewOfficerModal';
import { BroadcastAlertModal } from './modals/BroadcastAlertModal';
import { EmergencyDuressModal } from './modals/EmergencyDuressModal';
import { NewSiteModal } from './modals/NewSiteModal';
import { NewFleetVehicleModal } from './modals/NewFleetVehicleModal';
import { AdminDataHubView } from './AdminDataHubView';
import { PayrollTimesheetView } from './PayrollTimesheetView';
import { BillableHoursRatioWidget } from './BillableHoursRatioWidget';
import { OfficersOnDutyModal } from './modals/OfficersOnDutyModal';
import { OpenIncidentsModal } from './modals/OpenIncidentsModal';
import { AlertDetailModal } from './modals/AlertDetailModal';
import { RealTimePatrolLogsModal } from './modals/RealTimePatrolLogsModal';
import { ManualClockInModal } from './modals/ManualClockInModal';
import { OfficerRecord, ControlRoomAlert, IncidentQueueItem } from '../types/dutyon';

export const DesktopControlRoom: React.FC = () => {
  const {
    controlRoomTab,
    setControlRoomTab,
    alerts,
    dismissAlert,
    incidents,
    resolveIncident,
    createIncident,
    sites,
    isPTTLive,
    setIsPTTLive,
    clockTime,
    showToast,
    rosterRows,
    officersList,
    officer,
    safetyStatus,
    triggerDuressPanic,
    selectedOfficerForModal,
    setSelectedOfficerForModal,
    selectedSiteForModal,
    setSelectedSiteForModal,
    selectedIncidentForModal,
    setSelectedIncidentForModal,
    selectedRosterShift,
    setSelectedRosterShift,
    isNewIncidentModalOpen,
    setIsNewIncidentModalOpen,
    isNewOfficerModalOpen,
    setIsNewOfficerModalOpen,
    isNewSiteModalOpen,
    setIsNewSiteModalOpen,
    isNewFleetModalOpen,
    setIsNewFleetModalOpen,
    isBroadcastModalOpen,
    setIsBroadcastModalOpen,
    currentUserProfile,
    messages,
    sendMessage,
    checkCanAccessControlRoom,
    checkCanAccessAdminData,
    setRestrictedTargetArea,
    setIsAccessRestrictedOpen,
    setActiveMode,
    setIsAuthModalOpen,
    setIsPatrolLogsModalOpen
  } = useDutyOn();

  const [isDuressModalOpen, setIsDuressModalOpen] = useState(false);
  const [isOfficersOnDutyModalOpen, setIsOfficersOnDutyModalOpen] = useState(false);
  const [isOpenIncidentsModalOpen, setIsOpenIncidentsModalOpen] = useState(false);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tactical Comms & Right Panel State
  const [rightPanelTab, setRightPanelTab] = useState<'alerts' | 'comms'>('alerts');
  const [commsSiteFilter, setCommsSiteFilter] = useState<string>('all');
  const [commsInput, setCommsInput] = useState<string>('');
  const [commsTargetSite, setCommsTargetSite] = useState<string>('all');
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<ControlRoomAlert | null>(null);
  const [selectedEvidencePhoto, setSelectedEvidencePhoto] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  const normalizeSiteStr = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/khwamagxaki/g, 'kwamagxaki')
      .replace(/lindsy/g, 'lindsay');

  const filteredMessages = React.useMemo(() => {
    return messages.filter((m) => {
      if (commsSiteFilter === 'all') return true;
      if (commsSiteFilter === 'control_room') {
        return (
          m.channel === 'control_room' ||
          m.fromControlRoom === true ||
          m.target === 'control_room' ||
          !m.fromControlRoom
        );
      }
      if (commsSiteFilter === 'urgent') {
        return Boolean(m.isUrgent);
      }
      const targetNorm = normalizeSiteStr(commsSiteFilter);
      const mSiteNorm = normalizeSiteStr(m.siteName || '');
      const mChanNorm = normalizeSiteStr(m.channel || '');
      return (
        mSiteNorm.includes(targetNorm) ||
        targetNorm.includes(mSiteNorm) ||
        mChanNorm.includes(targetNorm) ||
        (m.channel === 'control_room' && (mSiteNorm.includes(targetNorm) || targetNorm.includes(mSiteNorm)))
      );
    });
  }, [messages, commsSiteFilter]);

  const handleEscalateAlertToIncident = (alert: ControlRoomAlert) => {
    const newInc: IncidentQueueItem = {
      id: `inc-docket-${Date.now()}`,
      priority: alert.priority === 'HIGH' ? 'HIGH' : alert.priority === 'MED' ? 'MED' : 'LOW',
      category: alert.title,
      site: alert.location,
      age: 'Just now',
      operator: alert.officerName || currentUserProfile?.displayName || 'Control Room Dispatch',
      status: 'open',
      notes: [
        {
          id: `note-${Date.now()}`,
          author: 'SOC Dispatch',
          time: new Date().toLocaleTimeString().slice(0, 5),
          text: `Escalated from Control Room Alert: ${alert.description || alert.title}. Officer in-charge: ${alert.officerName || 'Field Unit'}.`
        }
      ]
    };
    createIncident(newInc);
    showToast(`✓ Case Docket opened for ${alert.title}`);
  };

  const days = ['Thu 22', 'Fri 23', 'Sat 24', 'Sun 25', 'Mon 26', 'Tue 27', 'Wed 28'];

  // Navigation Items specification for both Desktop Sidebar and Mobile Navigation
  const navigationItems = [
    {
      id: 'live',
      label: 'Live Operations',
      shortLabel: 'Live Ops',
      icon: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 2v20M2 12h20" />
        </svg>
      ),
      badge: <span className="w-2 h-2 rounded-full bg-[#5BCB80] animate-pulse" />
    },
    {
      id: 'visuals',
      label: 'Shift Visuals & Radar',
      shortLabel: 'Shift Radar',
      icon: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      badge: (
        <span className="text-[10px] font-mono-code bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
          KPI
        </span>
      )
    },
    {
      id: 'roster',
      label: 'Roster & Sites',
      shortLabel: 'Roster',
      icon: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M3 10h18" />
        </svg>
      ),
      badge: (
        <span className="text-[10px] font-mono-code bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
          Monthly
        </span>
      )
    },
    {
      id: 'payroll',
      label: 'Timesheets & Payroll',
      shortLabel: 'Payroll & SD-6',
      icon: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      badge: (
        <span className="text-[10px] font-mono-code bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
          104% SD-6
        </span>
      )
    },
    {
      id: 'patrols',
      label: 'Patrols & Sefeko',
      shortLabel: 'Patrols',
      icon: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
          <path d="M12 3l8 3v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
        </svg>
      ),
      badge: (
        <span className="text-[10px] font-mono-code bg-[#1FA6C9]/20 text-[#3FC9E9] px-1.5 py-0.5 rounded">
          12 act
        </span>
      )
    },
    {
      id: 'incidents',
      label: 'Incident Queue & SAPS',
      shortLabel: 'Incidents',
      icon: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
          <path d="M12 3l9 16H3z" />
          <path d="M12 10v4M12 17h.01" />
        </svg>
      ),
      badge: incidents.filter(i => i.status === 'open').length > 0 ? (
        <span className="text-[10px] font-mono-code bg-[#E0574B] text-white px-1.5 py-0.5 rounded">
          {incidents.filter(i => i.status === 'open').length}
        </span>
      ) : undefined
    },
    {
      id: 'documents',
      label: 'Guard Documents & PDF',
      shortLabel: 'Documents',
      icon: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      badge: (
        <span className="text-[10px] font-mono-code bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
          PSIRA
        </span>
      )
    },
    {
      id: 'admin',
      label: 'Admin Data Hub',
      shortLabel: 'Admin Hub',
      icon: <span className="text-sm">⚙️</span>,
      badge: !checkCanAccessAdminData() ? (
        <span className="text-[10px] font-mono-code bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded flex items-center gap-1">
          <span>🔒</span> Admin
        </span>
      ) : (
        <span className="text-[10px] font-mono-code bg-[#1FA6C9]/20 text-[#3FC9E9] px-1.5 py-0.5 rounded">
          Real Data
        </span>
      )
    }
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'admin') {
      if (checkCanAccessAdminData()) {
        setControlRoomTab('admin');
      } else {
        setRestrictedTargetArea('admin_data');
        setIsAccessRestrictedOpen(true);
      }
    } else {
      setControlRoomTab(tabId as any);
    }
    setIsMobileMenuOpen(false);
  };

  // If user lacks Control Room clearance, render the security clearance guard
  if (!checkCanAccessControlRoom()) {
    return (
      <div className="min-h-[calc(100vh-66px)] bg-[#071726] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-[#0A1E33] border border-amber-500/30 rounded-2xl p-8 text-center shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 grid place-items-center text-3xl mx-auto border border-amber-500/20">
            🔒
          </div>
          <div>
            <div className="inline-block font-mono-code text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full mb-2">
              PSIRA Regulation · Restricted Area
            </div>
            <h2 className="font-display font-extrabold text-xl text-white">
              Control Room Access Restricted
            </h2>
            <p className="text-xs text-[#8598A8] mt-2 leading-relaxed">
              You are signed in as <span className="text-white font-semibold">{currentUserProfile?.displayName || 'Officer'}</span> ({currentUserProfile?.role?.toUpperCase() || 'OFFICER'}).
              Central dispatch operations, full multi-site tracking, and docket systems require SOC Operator or Admin authorization.
            </p>
          </div>

          <div className="bg-[#051320] border border-white/10 rounded-xl p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between text-[#8598A8]">
              <span>Assigned Site:</span>
              <span className="text-white font-medium">{officer.currentSite || 'Assigned Site'}</span>
            </div>
            <div className="flex justify-between text-[#8598A8]">
              <span>PSIRA Status:</span>
              <span className="text-emerald-400 font-mono-code font-bold">Active &amp; Verified</span>
            </div>
            <div className="flex justify-between text-[#8598A8]">
              <span>Required Clearance:</span>
              <span className="text-amber-300 font-mono-code">SOC Level 2 or Supervisor</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                setRestrictedTargetArea('control_room');
                setIsAccessRestrictedOpen(true);
              }}
              className="w-full py-2.5 bg-[#1FA6C9] hover:bg-[#1FA6C9]/90 text-[#042430] font-display font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-[#1FA6C9]/20 flex items-center justify-center gap-2"
            >
              <span>🔑</span>
              <span>Enter SOC Clearance Code / Elevate</span>
            </button>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white font-display font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>👤</span>
              <span>Switch User / Admin Sign In</span>
            </button>

            <button
              onClick={() => setActiveMode('mobile')}
              className="w-full py-2 text-[#8598A8] hover:text-white font-display text-xs transition-all cursor-pointer"
            >
              ← Return to Field Officer App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-66px)] bg-[#071726] text-white overflow-x-hidden relative">
      {/* Mobile Slide-Over Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#0A1E33] border-r border-white/15 flex flex-col p-4 z-10 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1FA6C9]/15 grid place-items-center text-[#3FC9E9]">
                  <svg className="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="13" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                </div>
                <div>
                  <div className="font-display font-bold text-sm text-white leading-tight">Control Room</div>
                  <div className="text-[9.5px] text-[#8598A8] font-mono-code tracking-wider">COMMAND CENTER</div>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8598A8] hover:text-white flex items-center justify-center text-sm cursor-pointer active:scale-95"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Mobile Navigation List */}
            <nav className="space-y-1 flex-1 py-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-semibold text-xs transition-all cursor-pointer ${
                    controlRoomTab === item.id
                      ? 'bg-[#1FA6C9] text-[#042430]'
                      : 'text-[#9db0c0] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex-none">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                  {item.badge && <span className="ml-auto flex-none">{item.badge}</span>}
                </button>
              ))}
            </nav>

            {/* Quick Actions inside Drawer */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="text-[10px] font-mono-code text-[#8598A8] uppercase tracking-wider font-semibold">
                Quick Dispatch &amp; Logs
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsNewIncidentModalOpen(true);
                  }}
                  className="p-2 bg-[#E0574B]/20 hover:bg-[#E0574B]/30 text-rose-300 border border-[#E0574B]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🚨</span>
                  <span>+ Incident</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsNewOfficerModalOpen(true);
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>👮</span>
                  <span>+ Guard</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsNewSiteModalOpen(true);
                  }}
                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🏢</span>
                  <span>+ Site</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsNewFleetModalOpen(true);
                  }}
                  className="p-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🚔</span>
                  <span>+ Vehicle</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer info */}
            <div className="pt-4 mt-2 border-t border-white/10 text-[11px] text-[#8598A8] space-y-0.5">
              <div className="font-semibold text-white">Tikedi Holdings (Pty) Ltd</div>
              <div className="text-[10px]">Multi-Site Security Command</div>
              <div className="font-mono-code text-[10px] text-[#3FC9E9] pt-0.5">Gqeberha · Eastern Cape</div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Control Room Permanent Sidebar (hidden on screens < 1024px) */}
      <aside className="hidden lg:flex lg:w-64 bg-[#0A1E33] border-r border-white/10 flex-col flex-none">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1FA6C9]/15 grid place-items-center text-[#3FC9E9]">
            <svg className="w-5 h-5 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="13" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-sm text-white">Control Room</div>
            <div className="text-[10px] text-[#8598A8] font-mono-code tracking-wider">COMMAND CENTER</div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="p-3 space-y-1 flex-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-semibold text-xs transition-all cursor-pointer ${
                controlRoomTab === item.id
                  ? 'bg-[#1FA6C9] text-[#042430]'
                  : 'text-[#9db0c0] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex-none">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {item.badge && <span className="ml-auto flex-none">{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 text-[11px] text-[#8598A8] space-y-1">
          <div className="font-semibold text-white">Tikedi Holdings (Pty) Ltd</div>
          <div>Multi-Site Security Command</div>
          <div className="font-mono-code text-[10px] text-[#3FC9E9] pt-1">Gqeberha · Eastern Cape</div>
        </div>
      </aside>

      {/* Main Command Center Area */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-y-auto overflow-x-hidden">
        {/* Top Operational Bar */}
        <div className="min-h-14 border-b border-white/10 px-2.5 sm:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-2 bg-[#0A1E33]/80 backdrop-blur-md flex-none overflow-x-hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-[#3FC9E9] border border-white/10 flex items-center justify-center cursor-pointer active:scale-95 flex-none"
              aria-label="Open Control Room Navigation Menu"
              title="Open Navigation Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5BCB80] animate-pulse flex-none" />
              <span className="font-display font-bold text-xs sm:text-sm text-white truncate">
                {controlRoomTab === 'live' ? 'Live Operations' :
                 controlRoomTab === 'visuals' ? 'Shift Visuals' :
                 controlRoomTab === 'roster' ? 'Roster Maker' :
                 controlRoomTab === 'payroll' ? 'Timesheets & Payroll' :
                 controlRoomTab === 'patrols' ? 'Sefeko Patrols' :
                 controlRoomTab === 'documents' ? 'Guard Vault' :
                 controlRoomTab === 'admin' ? 'Admin Hub' :
                 'Incident Queue'}
              </span>
              <span className="hidden md:inline-block font-mono-code text-[11px] bg-white/10 px-2 py-0.5 rounded text-[#9db0c0] flex-none">
                Night Shift · 22 May 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-none">
            {/* Quick Command & Control Action Buttons */}
            <button
              onClick={() => {
                triggerDuressPanic();
                setIsDuressModalOpen(true);
              }}
              className={`font-display font-semibold text-xs px-2 sm:px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer border flex-none ${
                safetyStatus.duressTriggered || safetyStatus.manDownTriggered
                  ? 'bg-rose-600 text-white border-white animate-bounce shadow-lg shadow-rose-600/50'
                  : 'bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border-rose-500/30'
              }`}
              title="Trigger or view Lone Worker Duress SOS Emergency protocol"
            >
              <span>🚨</span>
              <span className="hidden sm:inline">Duress </span><span>SOS</span>
              {(safetyStatus.duressTriggered || safetyStatus.manDownTriggered) && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              )}
            </button>

            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="hidden sm:flex bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-display font-semibold text-xs px-2 sm:px-2.5 py-1.5 rounded-xl transition-all items-center gap-1.5 cursor-pointer flex-none"
              title="Broadcast audible emergency tone and instructions"
            >
              <span>📢</span>
              <span className="hidden md:inline">Broadcast</span>
            </button>

            <button
              onClick={() => setIsNewIncidentModalOpen(true)}
              className="bg-[#E0574B] hover:bg-rose-600 text-white font-display font-semibold text-xs px-2 sm:px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-rose-600/30 flex-none"
              title="Log new incident docket & dispatch armed response"
            >
              <span className="hidden sm:inline">🚨</span>
              <span>+ Incident</span>
            </button>

            <button
              onClick={() => setIsNewOfficerModalOpen(true)}
              className="hidden md:flex bg-white/10 hover:bg-white/20 text-white font-display font-semibold text-xs px-2.5 py-1.5 rounded-xl transition-all items-center gap-1.5 cursor-pointer"
              title="Enroll security guard to PSIRA roster pool"
            >
              <span>👮</span>
              <span className="hidden lg:inline">+ Guard</span>
            </button>

            <button
              onClick={() => setIsNewSiteModalOpen(true)}
              className="hidden xl:flex bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-display font-semibold text-xs px-2.5 py-1.5 rounded-xl transition-all items-center gap-1.5 cursor-pointer"
              title="Add protected client site & geofence location"
            >
              <span>🏢</span>
              <span>+ Site</span>
            </button>

            <button
              onClick={() => setIsNewFleetModalOpen(true)}
              className="hidden xl:flex bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-display font-semibold text-xs px-2.5 py-1.5 rounded-xl transition-all items-center gap-1.5 cursor-pointer"
              title="Add patrol vehicle or armed response unit"
            >
              <span>🚔</span>
              <span>+ Vehicle</span>
            </button>

            <div className="h-4 sm:h-5 w-px bg-white/15 mx-0.5 sm:mx-1" />

            <div className="font-mono-code text-[11px] sm:text-xs text-[#3FC9E9]">
              {clockTime?.slice(0, 5)}
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1FA6C9]/20 text-[#3FC9E9] grid place-items-center font-bold text-xs border border-[#1FA6C9]/30 flex-none">
              CR
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Scrolling Navigation Bar (visible only on < lg screens) */}
        <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[#091B2E] border-b border-white/10 overflow-x-auto no-scrollbar flex-none">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-none cursor-pointer ${
                controlRoomTab === item.id
                  ? 'bg-[#1FA6C9] text-[#042430] font-bold shadow-sm'
                  : 'text-[#9db0c0] hover:text-white bg-white/5 hover:bg-white/10 border border-white/5'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.shortLabel}</span>
              {item.badge && (
                <span className="flex-none">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Views */}
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 flex-1 w-full max-w-full overflow-x-hidden">
          {/* ---------------- LIVE OPERATIONS TAB ---------------- */}
          {controlRoomTab === 'live' && (
            <>
              {/* 4 Top KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
                  <div className="text-[11px] sm:text-xs text-[#8598A8] font-medium flex items-center justify-between gap-1">
                    <span className="truncate">Posts covered</span>
                    <span className="text-[#5BCB80] font-mono-code text-[10px] sm:text-[11px] flex-none">
                      {Math.min(100, Math.round((officersList.filter(o => o.isClockedIn).length / Math.max(1, sites.reduce((sum, s) => sum + (s.officersRequired || 0), 0))) * 100))}%
                    </span>
                  </div>
                  <div className="font-display font-extrabold text-xl sm:text-2xl text-white mt-1">
                    {officersList.filter(o => o.isClockedIn).length} <span className="text-xs sm:text-sm font-normal text-[#8598A8]">/ {sites.reduce((sum, s) => sum + (s.officersRequired || 0), 0) || 1}</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#8598A8] mt-1 truncate">
                    {Math.max(0, (sites.reduce((sum, s) => sum + (s.officersRequired || 0), 0) || 1) - officersList.filter(o => o.isClockedIn).length)} unassigned/relief
                  </div>
                </div>

                <div 
                  onClick={() => setIsOfficersOnDutyModalOpen(true)}
                  className="bg-[#0A1E33] border border-white/10 hover:border-[#3FC9E9]/60 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all group"
                  title="Click to view all officers on duty by location, site, or collectively"
                >
                  <div className="text-[11px] sm:text-xs text-[#8598A8] font-medium flex items-center justify-between gap-1">
                    <span className="truncate group-hover:text-white transition-colors">Officers on duty</span>
                    <span className="text-[#3FC9E9] font-mono-code text-[10px] sm:text-[11px] flex-none">View All ›</span>
                  </div>
                  <div className="font-display font-extrabold text-xl sm:text-2xl text-white mt-1 flex items-baseline gap-1.5">
                    <span>{officersList.filter(o => o.isClockedIn).length}</span>
                    <span className="text-xs sm:text-sm font-normal text-[#8598A8]">/ {officersList.length} enrolled</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#3FC9E9] mt-1 truncate font-medium">
                    Click to view by location or site →
                  </div>
                </div>

                <div 
                  onClick={() => setIsPatrolLogsModalOpen(true)}
                  className="bg-[#0A1E33] border border-white/10 hover:border-[#5BCB80]/70 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all group"
                  title="Click to open and inspect real-time patrol scans & logs"
                >
                  <div className="text-[11px] sm:text-xs text-[#8598A8] font-medium flex items-center justify-between gap-1">
                    <span className="truncate group-hover:text-white transition-colors">Patrols active</span>
                    <span className="text-[#5BCB80] font-mono-code text-[10px] sm:text-[11px] flex-none">Logs ›</span>
                  </div>
                  <div className="font-display font-extrabold text-xl sm:text-2xl text-white mt-1">
                    {sites.filter(s => s.patrolStatus !== 'Stationary').length}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#5BCB80] mt-1 truncate font-medium">
                    Click to view real-time patrol logs →
                  </div>
                </div>

                <div 
                  onClick={() => setIsOpenIncidentsModalOpen(true)}
                  className="bg-[#0A1E33] border border-white/10 hover:border-[#E0574B]/70 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all group"
                  title="Click to open and see all incidences"
                >
                  <div className="text-[11px] sm:text-xs text-[#8598A8] font-medium flex items-center justify-between gap-1">
                    <span className="truncate group-hover:text-white transition-colors">Open incidents</span>
                    <span className="text-[#E0574B] font-mono-code text-[10px] sm:text-[11px] flex-none">Open Dockets ›</span>
                  </div>
                  <div className="font-display font-extrabold text-xl sm:text-2xl text-[#E0574B] mt-1">
                    {incidents.filter(i => (i.status || 'open') === 'open').length}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#8598A8] mt-1 truncate">
                    Click to inspect all {incidents.length} incidences →
                  </div>
                </div>
              </div>

              {/* Grid: Map + Alerts Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Radar Map */}
                <div className="lg:col-span-2 bg-[#0A1E33] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-white">
                        Live Multi-Location Radar Map
                      </span>
                      <span className="font-mono-code text-[10px] bg-[#1FA6C9]/15 text-[#3FC9E9] px-2 py-0.5 rounded">
                        Tikedi Holdings · Operational Sectors Radar
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 text-[#5BCB80]">
                        <span className="w-2 h-2 rounded-full bg-[#5BCB80]" /> {sites.length} Active Site{sites.length === 1 ? '' : 's'}
                      </span>
                      {incidents.filter(i => (i.status || 'open') === 'open').length > 0 ? (
                        <span className="flex items-center gap-1 text-[#E0574B] ml-2">
                          <span className="w-2 h-2 rounded-full bg-[#E0574B] animate-ping" /> {incidents.filter(i => (i.status || 'open') === 'open').length} Alert
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400 ml-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> All Normal
                        </span>
                      )}
                    </div>
                  </div>

                  <DesktopLiveMap />
                </div>

                {/* Live Alerts Feed & PTT Broadcast */}
                <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4 flex flex-col space-y-3.5 shadow-sm min-h-[580px]">
                  {/* Tab Selector Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setRightPanelTab('alerts')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          rightPanelTab === 'alerts'
                            ? 'bg-[#E0574B] text-white shadow-sm'
                            : 'text-[#8598A8] hover:text-white'
                        }`}
                      >
                        <span>Alerts</span>
                        <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full font-mono-code font-extrabold">
                          {alerts.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRightPanelTab('comms')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          rightPanelTab === 'comms'
                            ? 'bg-[#1FA6C9] text-[#042430] shadow-sm'
                            : 'text-[#8598A8] hover:text-white'
                        }`}
                      >
                        <span>Comms Net</span>
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono-code font-bold">
                          {filteredMessages.length}
                        </span>
                      </button>
                    </div>

                    {rightPanelTab === 'alerts' ? (
                      <button
                        onClick={() => showToast('All notifications acknowledged')}
                        className="text-[11px] text-[#3FC9E9] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>✓</span>
                        <span>Clear all</span>
                      </button>
                    ) : (
                      <select
                        value={commsSiteFilter}
                        onChange={(e) => setCommsSiteFilter(e.target.value)}
                        className="bg-black/50 border border-white/20 rounded-lg px-2.5 py-1 text-[11px] text-[#3FC9E9] focus:outline-none focus:border-[#1FA6C9] cursor-pointer font-medium max-w-[190px]"
                      >
                        <option value="all">All Channels &amp; Sites ({messages.length})</option>
                        <option value="control_room">🏢 Central Control Room (SOC)</option>
                        <option value="urgent">🚨 Urgent &amp; Duress Flags</option>
                        <optgroup label="Direct Site Radio Nets">
                          {sites.map((s) => (
                            <option key={s.id} value={s.name}>
                              📍 {s.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    )}
                  </div>

                  {/* ALERTS VIEW */}
                  {rightPanelTab === 'alerts' && (
                    <div className="space-y-2.5 overflow-y-auto flex-1 min-h-[380px] max-h-[660px] lg:max-h-[740px] pr-1.5 custom-scrollbar">
                      {alerts.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
                          <div className="text-2xl">🛡️</div>
                          <div className="text-xs font-semibold text-white">Sector Normal</div>
                          <p className="text-[11px] text-[#8598A8]">
                            No active threat alerts in queue. Field patrols operating normally.
                          </p>
                        </div>
                      ) : (
                        alerts.map((alert) => {
                          const hasPhoto = Boolean(alert.photoUrl || alert.mediaUrl);
                          const photoSrc = alert.photoUrl || alert.mediaUrl;
                          const hasAudio = Boolean(alert.voiceNoteUrl || alert.audioUrl);
                          const audioSrc = alert.voiceNoteUrl || alert.audioUrl;
                          const isPatrolTourAlert = alert.title?.includes('Patrol Tour') || alert.title?.includes('Patrol Checkpoint');
                          return (
                            <div
                              key={alert.id}
                              onClick={() => setSelectedAlertForModal(alert)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:border-cyan-400/60 hover:bg-white/5 space-y-2.5 ${
                                alert.type === 'HIGH' || alert.priority === 'HIGH'
                                  ? 'bg-[#E0574B]/10 border-[#E0574B]/40'
                                  : isPatrolTourAlert
                                  ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(31,166,201,0.08)]'
                                  : alert.type === 'MED' || alert.priority === 'MED'
                                  ? 'bg-[#E7A13A]/10 border-[#E7A13A]/40'
                                  : 'bg-white/5 border-white/10'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`font-mono-code text-[9.5px] font-bold px-1.5 py-0.5 rounded flex-none ${
                                      alert.type === 'HIGH' || alert.priority === 'HIGH'
                                        ? 'bg-[#E0574B] text-white animate-pulse'
                                        : isPatrolTourAlert
                                        ? 'bg-[#1FA6C9] text-[#042430] font-black'
                                        : alert.type === 'MED' || alert.priority === 'MED'
                                        ? 'bg-[#E7A13A] text-[#0A1E33]'
                                        : 'bg-[#1FA6C9] text-white'
                                    }`}
                                  >
                                    {isPatrolTourAlert ? 'TOUR DEBRIEF' : (alert.type || alert.priority || 'INFO')}
                                  </span>
                                  <span className="text-xs font-semibold text-white truncate">
                                    {alert.title}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissAlert(alert.id);
                                  }}
                                  className="text-[#8598A8] hover:text-white text-xs px-1 cursor-pointer flex-none"
                                  title="Dismiss Alert"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="text-[11px] text-[#9db0c0] leading-relaxed">
                                {alert.description}
                              </div>

                              {/* Officer Submitted Commentary / Field Debrief */}
                              {alert.commentary && (
                                <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/30 text-xs text-cyan-100 space-y-1">
                                  <div className="text-[9.5px] font-bold text-[#3FC9E9] uppercase tracking-wider flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                      <span>💬</span>
                                      <span>Officer Debrief / Commentary</span>
                                    </span>
                                    {alert.officerName && (
                                      <span className="text-[9px] font-mono-code text-cyan-300">
                                        {alert.officerName}
                                      </span>
                                    )}
                                  </div>
                                  <p className="italic leading-relaxed text-slate-100 font-sans">
                                    &ldquo;{alert.commentary}&rdquo;
                                  </p>
                                </div>
                              )}

                              {/* Inline Inspection Photo Preview */}
                              {hasPhoto && photoSrc && (
                                <div className="relative rounded-lg overflow-hidden border border-white/15 bg-black/50 max-h-44 flex items-center justify-center group/photo">
                                  <img
                                    src={photoSrc}
                                    alt="Patrol Evidence"
                                    className="max-h-44 w-full object-cover group-hover/photo:scale-102 transition-transform"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvidencePhoto({
                                        url: photoSrc,
                                        title: alert.title,
                                        subtitle: `Location: ${alert.location} · Officer: ${alert.officerName || 'Guard'} (${alert.time})`
                                      });
                                    }}
                                    className="absolute bottom-1.5 right-1.5 bg-black/80 hover:bg-black text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded text-[10px] font-mono-code flex items-center gap-1 shadow-md cursor-pointer"
                                  >
                                    🔍 Expand Full Image
                                  </button>
                                </div>
                              )}

                              {/* Inline Audio Player */}
                              {hasAudio && audioSrc && (
                                <div
                                  className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-1.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-between text-[10px] text-emerald-300 font-semibold">
                                    <span className="flex items-center gap-1">
                                      <span>🎙️</span>
                                      <span>Officer Voice Debrief</span>
                                    </span>
                                    {alert.audioDurationSec ? (
                                      <span className="font-mono-code text-emerald-400 font-bold">({alert.audioDurationSec}s)</span>
                                    ) : null}
                                  </div>
                                  <audio
                                    controls
                                    src={audioSrc}
                                    className="w-full h-8 accent-emerald-500"
                                    preload="auto"
                                  />
                                </div>
                              )}

                              <div className="text-[10px] text-[#8598A8] pt-1 flex items-center justify-between gap-1 flex-wrap border-t border-white/5">
                                <span>📍 {alert.location}</span>
                                <span className="font-mono-code text-cyan-300">🕒 {alert.time}</span>
                              </div>

                              {/* Attachments / Media Badges & CTA */}
                              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {hasPhoto && (
                                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] font-semibold flex items-center gap-1">
                                      📷 Photo
                                    </span>
                                  )}
                                  {hasAudio && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                                      🎙️ Audio {alert.audioDurationSec ? `(${alert.audioDurationSec}s)` : ''}
                                    </span>
                                  )}
                                  {alert.commentary && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] font-semibold flex items-center gap-1">
                                      💬 Debrief Note
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRightPanelTab('comms');
                                    }}
                                    className="text-[10.5px] text-[#8598A8] hover:text-cyan-300 transition-colors"
                                    title="View in Tactical Comms"
                                  >
                                    📡 Comms Net
                                  </button>
                                  <span className="text-[11px] text-[#3FC9E9] font-medium hover:underline flex items-center gap-1">
                                    Inspect Full Alert →
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* TACTICAL COMMS VIEW */}
                  {rightPanelTab === 'comms' && (
                    <div className="flex flex-col flex-1 min-h-[380px] max-h-[660px] lg:max-h-[740px] space-y-3">
                      <div className="space-y-2.5 overflow-y-auto flex-1 pr-1.5 custom-scrollbar">
                        {filteredMessages.length === 0 ? (
                          <div className="text-center py-10 px-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                            <div className="text-xl">📡</div>
                            <div className="text-xs text-white font-medium">No transmissions found</div>
                            <p className="text-[11px] text-[#8598A8]">
                              No messages logged for this filter. Dispatch a radio broadcast below.
                            </p>
                          </div>
                        ) : (
                          filteredMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-xl border text-xs transition-colors space-y-2.5 ${
                                msg.fromControlRoom
                                  ? 'bg-[#E53E3E]/10 border-[#E53E3E]/30 text-white'
                                  : msg.isUrgent
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-100'
                                  : msg.text?.includes('[PATROL TRANSMITTED]')
                                  ? 'bg-cyan-950/35 border-cyan-500/40 text-slate-100 shadow-[0_0_12px_rgba(31,166,201,0.06)]'
                                  : msg.channel === 'control_room'
                                  ? 'bg-cyan-950/20 border-cyan-500/30 text-slate-100'
                                  : 'bg-white/5 border-white/10 text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-[#8598A8] mb-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-white">{msg.sender}</span>
                                  {msg.fromControlRoom ? (
                                    <span className="px-1.5 py-0.2 rounded bg-[#E53E3E] text-white text-[9px] font-bold tracking-wider">
                                      SOC DISPATCH
                                    </span>
                                  ) : msg.text?.includes('[PATROL TRANSMITTED]') ? (
                                    <span className="px-1.5 py-0.2 rounded bg-[#1FA6C9] text-[#042430] text-[9px] font-black uppercase tracking-wider">
                                      PATROL DEBRIEF
                                    </span>
                                  ) : msg.channel === 'control_room' ? (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                                      FIELD TO SOC
                                    </span>
                                  ) : null}
                                  {msg.siteName && (
                                    <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] text-[#3FC9E9]">
                                      📍 {msg.siteName}
                                    </span>
                                  )}
                                  {msg.isUrgent && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black text-[9px] font-extrabold animate-pulse">
                                      URGENT
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono-code text-slate-400">{msg.time}</span>
                              </div>

                              <div className="text-[11.5px] leading-relaxed text-slate-100 font-medium">
                                {msg.text}
                              </div>

                              {/* Officer Submitted Commentary / Debrief */}
                              {msg.commentary && (
                                <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/30 text-[11px] text-cyan-100 space-y-1">
                                  <div className="text-[9.5px] font-bold text-[#3FC9E9] uppercase tracking-wider flex items-center gap-1">
                                    <span>📝</span>
                                    <span>Patrol Debrief Commentary</span>
                                  </div>
                                  <p className="italic leading-relaxed text-slate-100 font-sans">"{msg.commentary}"</p>
                                </div>
                              )}

                              {/* Attached Inspection Photo */}
                              {(msg.photoUrl || msg.mediaUrl) && (
                                <div className="relative rounded-lg overflow-hidden border border-white/15 bg-black/50 max-h-44 flex items-center justify-center group/commsphoto">
                                  <img
                                    src={msg.photoUrl || msg.mediaUrl}
                                    alt="Transmitted field evidence"
                                    className="max-h-44 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setSelectedEvidencePhoto({
                                      url: (msg.photoUrl || msg.mediaUrl)!,
                                      title: `Field Photo: ${msg.siteName || 'Patrol Inspection'}`,
                                      subtitle: `Transmitted by ${msg.sender} at ${msg.time}`
                                    })}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setSelectedEvidencePhoto({
                                      url: (msg.photoUrl || msg.mediaUrl)!,
                                      title: `Field Photo: ${msg.siteName || 'Patrol Inspection'}`,
                                      subtitle: `Transmitted by ${msg.sender} at ${msg.time}`
                                    })}
                                    className="absolute bottom-1 right-1 bg-black/80 hover:bg-black text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded text-[10px] font-mono-code flex items-center gap-1 cursor-pointer shadow-md"
                                  >
                                    🔍 Expand Full Image
                                  </button>
                                </div>
                              )}

                              {/* Attached Audio Voice Note */}
                              {(msg.voiceNoteUrl || msg.audioUrl) && (
                                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px] text-emerald-300 font-semibold">
                                    <span className="flex items-center gap-1">
                                      <span>🎙️</span>
                                      <span>Officer Audio Transmission</span>
                                    </span>
                                    {msg.audioDurationSec ? (
                                      <span className="font-mono-code text-emerald-400 font-bold">({msg.audioDurationSec}s)</span>
                                    ) : null}
                                  </div>
                                  <audio
                                    controls
                                    src={msg.voiceNoteUrl || msg.audioUrl}
                                    className="w-full h-8 accent-emerald-500"
                                    preload="auto"
                                  />
                                </div>
                              )}

                              {!msg.fromControlRoom && msg.siteName && (
                                <div className="mt-1 pt-1 border-t border-white/5 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setCommsTargetSite(msg.siteName || 'all')}
                                    className="text-[10px] text-[#3FC9E9] hover:underline cursor-pointer"
                                  >
                                    Reply to {msg.siteName} →
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Dispatch Broadcast Composer */}
                      <div className="space-y-1.5 bg-[#071726]/90 p-2.5 rounded-xl border border-white/10 flex-none">
                        <div className="flex items-center justify-between text-[10px] text-[#8598A8]">
                          <span>Send Dispatch Broadcast:</span>
                          <select
                            value={commsTargetSite}
                            onChange={(e) => setCommsTargetSite(e.target.value)}
                            className="bg-black/60 border border-white/15 rounded px-1.5 py-0.5 text-[10px] text-[#3FC9E9] cursor-pointer"
                          >
                            <option value="all">Broadcast to All Sites</option>
                            <option value="control_room">Central Control Room Net</option>
                            {sites.map((s) => (
                              <option key={s.id} value={s.name}>
                                To: {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commsInput}
                            onChange={(e) => setCommsInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && commsInput.trim()) {
                                sendMessage(commsInput, {
                                  channel: commsTargetSite === 'all' ? 'control_room' : commsTargetSite,
                                  siteName: commsTargetSite === 'all' ? 'Provincial Office' : commsTargetSite,
                                  fromControlRoom: true
                                });
                                setCommsInput('');
                              }
                            }}
                            placeholder="Type dispatch order to officers…"
                            className="flex-1 bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#8598A8] focus:outline-none focus:border-[#1FA6C9]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (commsInput.trim()) {
                                sendMessage(commsInput, {
                                  channel: commsTargetSite === 'all' ? 'control_room' : commsTargetSite,
                                  siteName: commsTargetSite === 'all' ? 'Provincial Office' : commsTargetSite,
                                  fromControlRoom: true
                                });
                                setCommsInput('');
                              }
                            }}
                            className="bg-[#1FA6C9] hover:bg-[#1994b4] text-[#042430] font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Push-to-Talk Broadcast Station */}
                  <div className="mt-auto pt-3 border-t border-white/10 bg-[#071726]/60 p-3 rounded-xl flex-none">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="text-[#3FC9E9]">🎙️</span>
                        <span>Control Room PTT Radio</span>
                      </div>
                      <span className="font-mono-code text-[10px] text-[#5BCB80]">
                        All Sites (CH 1)
                      </span>
                    </div>

                    <AudioWave isLive={isPTTLive} barCount={30} height={26} />

                    <button
                      onMouseDown={() => setIsPTTLive(true)}
                      onMouseUp={() => setIsPTTLive(false)}
                      onTouchStart={() => setIsPTTLive(true)}
                      onTouchEnd={() => setIsPTTLive(false)}
                      className={`w-full mt-2 py-2 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isPTTLive
                          ? 'bg-[#3AA655] text-white shadow-[0_0_12px_rgba(58,166,85,0.4)]'
                          : 'bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430]'
                      }`}
                    >
                      <svg className="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                        <rect x="9" y="3" width="6" height="11" rx="3" />
                        <path d="M6 11a6 6 0 0012 0M12 17v4" />
                      </svg>
                      <span>{isPTTLive ? 'Transmitting to All Channels…' : 'Hold to Broadcast'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Billable vs Standard Hours Ratio Summary View with Recharts */}
              <BillableHoursRatioWidget onOpenFullPayroll={() => setControlRoomTab('payroll')} />

              {/* Multi-Location Sites Status Table */}
              <div className="bg-[#0A1E33] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-sm text-white">
                      Multi-Location Operational Sites
                    </h3>
                    <p className="text-[11px] text-[#8598A8]">Real-time officer deployment &amp; compliance</p>
                  </div>

                  <div className="flex gap-2">
                    {['all', 'operational', 'alert'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSelectedSiteFilter(mode)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                          selectedSiteFilter === mode
                            ? 'bg-[#1FA6C9] text-[#042430]'
                            : 'bg-white/5 text-[#8598A8] hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[640px]">
                    <thead className="bg-[#071726]/60 text-[#8598A8] font-mono-code text-[10.5px]">
                      <tr>
                        <th className="py-3 px-4">Site Name</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Required Officers</th>
                        <th className="py-3 px-4">Present</th>
                        <th className="py-3 px-4">Patrol Status</th>
                        <th className="py-3 px-4">Compliance</th>
                        <th className="py-3 px-4 text-right">Site Commands</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sites
                        .filter(s => selectedSiteFilter === 'all' || (selectedSiteFilter === 'operational' ? s.status === 'operational' : s.status !== 'operational'))
                        .map((site) => (
                          <tr 
                            key={site.id} 
                            onClick={() => setSelectedSiteForModal(site)}
                            className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4 font-semibold text-white group-hover:text-[#3FC9E9] transition-colors">
                              <div className="flex items-center gap-2">
                                <span>🏢</span>
                                <span>{site.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#9db0c0]">
                              {site.location}
                            </td>
                            <td className="py-3 px-4 font-mono-code">
                              {site.officersRequired}
                            </td>
                            <td className="py-3 px-4 font-mono-code font-bold text-[#5BCB80]">
                              {site.officersPresent}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono-code text-[11px] text-[#3FC9E9]">
                                {site.patrolStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                site.status === 'operational'
                                  ? 'bg-[#5BCB80]/15 text-[#5BCB80]'
                                  : site.status === 'attention'
                                  ? 'bg-[#E7A13A]/15 text-[#E7A13A]'
                                  : 'bg-[#E0574B]/15 text-[#E0574B]'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  site.status === 'operational' ? 'bg-[#5BCB80]' :
                                  site.status === 'attention' ? 'bg-[#E7A13A]' : 'bg-[#E0574B]'
                                }`} />
                                {site.compliance}% · {site.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedSiteForModal(site)}
                                  className="bg-white/10 hover:bg-[#1FA6C9] hover:text-[#042430] text-white px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                                >
                                  Manage ⚙️
                                </button>
                                <button
                                  onClick={() => {
                                    showToast(`Dispatching patrol car to ${site.name}…`);
                                  }}
                                  className="text-[#1FA6C9] hover:text-[#3FC9E9] font-semibold text-xs px-1"
                                >
                                  Dispatch ›
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ---------------- VISUAL SHIFT DASHBOARD TAB ---------------- */}
          {controlRoomTab === 'visuals' && (
            <VisualShiftDashboard />
          )}

          {/* ---------------- ROSTER & SITES TAB ---------------- */}
          {controlRoomTab === 'roster' && (
            <RosterManagementView />
          )}

          {/* ---------------- TIMESHEETS & SECTORAL PAYROLL TAB ---------------- */}
          {controlRoomTab === 'payroll' && (
            <PayrollTimesheetView />
          )}

          {/* ---------------- PATROLS & SEFEKO TAB ---------------- */}
          {controlRoomTab === 'patrols' && (
            <DesktopPatrolsManager />
          )}

          {/* ---------------- INCIDENTS & SAPS DOCKET TAB ---------------- */}
          {controlRoomTab === 'incidents' && (
            <IncidentReportsView />
          )}

          {/* ---------------- GUARD DOCUMENTS & PDF VAULT TAB ---------------- */}
          {controlRoomTab === 'documents' && (
            <OfficerDocumentPortal />
          )}

          {/* ---------------- ADMIN DATA HUB TAB ---------------- */}
          {controlRoomTab === 'admin' && (
            checkCanAccessAdminData() ? (
              <AdminDataHubView />
            ) : (
              <div className="bg-[#0A1E33] border border-rose-500/30 rounded-2xl p-8 text-center max-w-xl mx-auto my-12 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 grid place-items-center text-3xl mx-auto mb-4 border border-rose-500/20">
                  🛡️
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">
                  Admin Security Clearance Required
                </h3>
                <p className="text-xs text-[#8598A8] mb-6 leading-relaxed">
                  This database contains live PSIRA compliance vaults, client rate cards, payroll figures, and company master telemetry. Only verified system administrators (such as <span className="text-rose-300 font-mono-code">tshepomaloa@gmail.com</span>) have clearance.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setRestrictedTargetArea('admin_data');
                      setIsAccessRestrictedOpen(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/20"
                  >
                    Enter Admin Security Key
                  </button>
                  <button
                    onClick={() => setControlRoomTab('live')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-display font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Return to Live Ops
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {/* Emergency Duress & Man-Down Life Safety Modal */}
      <EmergencyDuressModal
        isOpen={isDuressModalOpen || safetyStatus.duressTriggered || safetyStatus.manDownTriggered}
        onClose={() => setIsDuressModalOpen(false)}
        type={safetyStatus.duressTriggered ? 'duress' : safetyStatus.manDownTriggered ? 'man_down' : 'welfare_missed'}
      />

      {/* Officer Command & PSIRA Inspection Modal */}
      {selectedOfficerForModal && (
        <OfficerCommandModal
          isOpen={!!selectedOfficerForModal}
          onClose={() => setSelectedOfficerForModal(null)}
          officer={
            officersList.find((o) => o.id === selectedOfficerForModal.id) || selectedOfficerForModal
          }
        />
      )}

      {/* Site Command & Geofence Inspection Modal */}
      {selectedSiteForModal && (
        <SiteCommandModal
          isOpen={!!selectedSiteForModal}
          onClose={() => setSelectedSiteForModal(null)}
          site={selectedSiteForModal}
        />
      )}

      {/* Incident Command & Dispatch Modal */}
      {selectedIncidentForModal && (
        <IncidentCommandModal
          isOpen={!!selectedIncidentForModal}
          onClose={() => setSelectedIncidentForModal(null)}
          incident={selectedIncidentForModal}
        />
      )}

      {/* Roster Shift Editor Modal */}
      {selectedRosterShift && (
        <RosterShiftModal
          isOpen={!!selectedRosterShift}
          onClose={() => setSelectedRosterShift(null)}
          shiftData={selectedRosterShift}
        />
      )}

      {/* New Incident Docket Modal */}
      {isNewIncidentModalOpen && (
        <NewIncidentModal
          isOpen={isNewIncidentModalOpen}
          onClose={() => setIsNewIncidentModalOpen(false)}
        />
      )}

      {/* New Officer Enrollment Modal */}
      {isNewOfficerModalOpen && (
        <NewOfficerModal
          isOpen={isNewOfficerModalOpen}
          onClose={() => setIsNewOfficerModalOpen(false)}
        />
      )}

      {/* New Site & Geofence Modal */}
      {isNewSiteModalOpen && (
        <NewSiteModal
          isOpen={isNewSiteModalOpen}
          onClose={() => setIsNewSiteModalOpen(false)}
        />
      )}

      {/* New Fleet Vehicle Modal */}
      {isNewFleetModalOpen && (
        <NewFleetVehicleModal
          isOpen={isNewFleetModalOpen}
          onClose={() => setIsNewFleetModalOpen(false)}
        />
      )}

      {/* Fleet Emergency Radio Broadcast Modal */}
      {isBroadcastModalOpen && (
        <BroadcastAlertModal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
        />
      )}

      {/* Officers on Duty Live Deployment Board Modal */}
      <OfficersOnDutyModal
        isOpen={isOfficersOnDutyModalOpen}
        onClose={() => setIsOfficersOnDutyModalOpen(false)}
        onSelectOfficer={(off) => setSelectedOfficerForModal(off)}
      />

      {/* Open Incidents Inspection & Dispatch Modal */}
      <OpenIncidentsModal
        isOpen={isOpenIncidentsModalOpen}
        onClose={() => setIsOpenIncidentsModalOpen(false)}
        onOpenFullDocket={(_incId) => {
          setControlRoomTab('incidents');
        }}
        onSwitchToIncidentsTab={() => {
          setControlRoomTab('incidents');
        }}
      />

      {/* Real-Time Patrol & Checkpoint Logs Modal */}
      <RealTimePatrolLogsModal />

      {/* Manual Roll Call & Shift Command Clock-In Modal */}
      <ManualClockInModal />

      {/* Control Room Alert Deep Dive & Evidence Inspector Modal */}
      {selectedAlertForModal && (
        <AlertDetailModal
          alert={selectedAlertForModal}
          onClose={() => setSelectedAlertForModal(null)}
          onDismiss={(id) => {
            dismissAlert(id);
            setSelectedAlertForModal(null);
          }}
          onEscalateToIncident={handleEscalateAlertToIncident}
          onDispatchUnit={(loc) => {
            showToast(`🚔 Tactical unit dispatched to ${loc}`);
          }}
        />
      )}

      {/* Field Evidence Photo Fullscreen Lightbox Modal */}
      {selectedEvidencePhoto && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedEvidencePhoto(null)}
        >
          <div
            className="max-w-4xl w-full max-h-[90vh] bg-[#071726] border border-white/20 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#040e18]">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>📷</span>
                  <span>{selectedEvidencePhoto.title}</span>
                </h4>
                {selectedEvidencePhoto.subtitle && (
                  <p className="text-[11px] text-[#8598A8] mt-0.5">{selectedEvidencePhoto.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvidencePhoto(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center overflow-auto max-h-[72vh]">
              <img
                src={selectedEvidencePhoto.url}
                alt={selectedEvidencePhoto.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded"
              />
            </div>
            <div className="p-3 border-t border-white/10 bg-[#071726] flex items-center justify-between">
              <span className="text-xs text-[#8598A8]">DutyOn Cryptographic Proof · Watermarked</span>
              <a
                href={selectedEvidencePhoto.url}
                download="FieldEvidence.jpg"
                className="bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <span>⬇</span>
                <span>Download High-Res</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
