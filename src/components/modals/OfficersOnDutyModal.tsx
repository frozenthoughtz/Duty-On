import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { OfficerRecord } from '../../types/dutyon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectOfficer?: (officer: OfficerRecord) => void;
}

export const OfficersOnDutyModal: React.FC<Props> = ({ isOpen, onClose, onSelectOfficer }) => {
  const {
    officersList,
    sites,
    manualClockInOfficer,
    manualClockOutOfficer,
    sendOfficerWelfarePing,
    setSelectedOfficerForModal,
    showToast
  } = useDutyOn();

  // Filter state
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');
  const [dutyStatusFilter, setDutyStatusFilter] = useState<'clocked_in' | 'all'>('clocked_in');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered officers list
  const filteredOfficers = useMemo(() => {
    return officersList.filter((off) => {
      // Duty status filter
      if (dutyStatusFilter === 'clocked_in' && !off.isClockedIn) {
        return false;
      }

      // Site filter
      if (selectedSiteFilter !== 'ALL' && off.currentSite !== selectedSiteFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = off.name.toLowerCase().includes(q);
        const matchEmp = off.empId.toLowerCase().includes(q);
        const matchPsira = off.psiraNumber.toLowerCase().includes(q);
        const matchPost = (off.currentPost || '').toLowerCase().includes(q);
        const matchSite = (off.currentSite || '').toLowerCase().includes(q);
        if (!matchName && !matchEmp && !matchPsira && !matchPost && !matchSite) {
          return false;
        }
      }

      return true;
    });
  }, [officersList, selectedSiteFilter, dutyStatusFilter, searchQuery]);

  // Aggregate statistics
  const totalEnrolled = officersList.length;
  const clockedInCount = officersList.filter((o) => o.isClockedIn).length;
  const totalHoursLogged = useMemo(() => {
    return officersList
      .filter((o) => o.isClockedIn)
      .reduce((sum, o) => sum + (parseFloat(o.hoursToday || '0') || 0), 0)
      .toFixed(1);
  }, [officersList]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0A1E33] border border-white/15 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-[#071726]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1FA6C9]/20 border border-[#1FA6C9]/30 text-[#3FC9E9] grid place-items-center text-xl flex-none shadow-sm">
              👮
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-lg sm:text-xl text-white">
                  Officers on Duty (Live Deployment Board)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono-code font-bold bg-[#5BCB80]/15 text-[#5BCB80] border border-[#5BCB80]/30">
                  {clockedInCount} Active On Post
                </span>
              </div>
              <p className="text-xs text-[#8598A8] mt-0.5">
                Real-time biometric attendance, PSIRA compliance, and multi-site roster deployment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="self-end sm:self-center w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-[#8598A8] hover:text-white grid place-items-center text-sm transition-all cursor-pointer flex-none"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:px-6 bg-[#071726]/40 border-b border-white/5 text-xs">
          <div className="bg-[#0A1E33] border border-white/10 rounded-xl p-3">
            <span className="text-[10px] text-[#8598A8] uppercase font-semibold block">Total Clocked In</span>
            <span className="font-display font-bold text-lg text-[#3FC9E9]">
              {clockedInCount} <span className="text-xs font-normal text-[#8598A8]">/ {totalEnrolled} guards</span>
            </span>
          </div>

          <div className="bg-[#0A1E33] border border-white/10 rounded-xl p-3">
            <span className="text-[10px] text-[#8598A8] uppercase font-semibold block">Hours Logged Today</span>
            <span className="font-display font-bold text-lg text-[#5BCB80]">
              {totalHoursLogged} <span className="text-xs font-normal text-[#8598A8]">verified hrs</span>
            </span>
          </div>

          <div className="bg-[#0A1E33] border border-white/10 rounded-xl p-3">
            <span className="text-[10px] text-[#8598A8] uppercase font-semibold block">Active Site</span>
            <span className="font-display font-bold text-sm text-white truncate block">
              {selectedSiteFilter === 'ALL' ? 'All Sites (Collective)' : selectedSiteFilter}
            </span>
          </div>

          <div className="bg-[#0A1E33] border border-white/10 rounded-xl p-3">
            <span className="text-[10px] text-[#8598A8] uppercase font-semibold block">Biometric Liveness</span>
            <span className="font-mono-code font-bold text-sm text-emerald-400">
              100% Face ID Lock
            </span>
          </div>
        </div>

        {/* Controls Bar: Site Selector + Duty Toggle + Search */}
        <div className="p-4 sm:px-6 border-b border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#081B2E]">
          {/* Site Filter / Collective */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#8598A8] font-semibold">Location / Site:</span>
            <button
              onClick={() => setSelectedSiteFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedSiteFilter === 'ALL'
                  ? 'bg-[#1FA6C9] text-[#042430] font-bold shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-[#8598A8] hover:text-white border border-white/10'
              }`}
            >
              Collectively (All Sites)
            </button>

            {sites.map((site) => (
              <button
                key={site.id}
                onClick={() => setSelectedSiteFilter(site.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer truncate max-w-[200px] ${
                  selectedSiteFilter === site.name
                    ? 'bg-[#1FA6C9] text-[#042430] font-bold shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-[#8598A8] hover:text-white border border-white/10'
                }`}
                title={site.name}
              >
                🏢 {site.name}
              </button>
            ))}
          </div>

          {/* Right Controls: Clocked-in Toggle + Search */}
          <div className="flex items-center gap-2.5">
            {/* Status Segmented Control */}
            <div className="flex bg-black/40 border border-white/10 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setDutyStatusFilter('clocked_in')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  dutyStatusFilter === 'clocked_in'
                    ? 'bg-[#3AA655] text-white shadow-xs'
                    : 'text-[#8598A8] hover:text-white'
                }`}
              >
                On Duty ({clockedInCount})
              </button>
              <button
                onClick={() => setDutyStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  dutyStatusFilter === 'all'
                    ? 'bg-[#1FA6C9] text-[#042430] shadow-xs'
                    : 'text-[#8598A8] hover:text-white'
                }`}
              >
                All Pool ({totalEnrolled})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <input
                type="text"
                placeholder="Search guards, PSIRA, post…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#051320] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#5F7386] focus:outline-none focus:border-[#1FA6C9]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8598A8] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Officers Duty Table / Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredOfficers.length === 0 ? (
            <div className="py-16 text-center text-[#8598A8] space-y-3 bg-[#071726]/50 rounded-2xl border border-white/5">
              <div className="text-3xl">👮</div>
              <div className="font-display font-bold text-sm text-white">
                No officers match current deployment filter
              </div>
              <p className="text-xs max-w-sm mx-auto">
                {dutyStatusFilter === 'clocked_in'
                  ? 'No guards currently clocked in for this selection. Toggle to "All Pool" or clock in guards from the Admin Hub.'
                  : 'No guards enrolled yet. You can add your personnel in the Admin Hub or via the Roster.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredOfficers.map((off) => (
                <div
                  key={off.id}
                  className="bg-[#071726] border border-white/10 hover:border-[#1FA6C9]/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all group"
                >
                  <div>
                    {/* Top Row: Officer Identity & Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-[#1FA6C9]/20 text-[#3FC9E9] border border-[#1FA6C9]/30 grid place-items-center font-bold text-sm flex-none shadow-xs group-hover:bg-[#1FA6C9] group-hover:text-[#042430] transition-colors">
                          {off.avatarInitial || off.name.charAt(0)}
                        </span>
                        <div>
                          <div className="font-display font-bold text-sm text-white group-hover:text-[#3FC9E9] transition-colors flex items-center gap-1.5">
                            <span>{off.name}</span>
                            {off.firearmCompetency && (
                              <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono-code" title="SAPS Armed Competency Certified">
                                🔫 Armed
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#8598A8] font-mono-code flex items-center gap-2 mt-0.5">
                            <span>ID: {off.empId}</span>
                            <span>•</span>
                            <span className="text-[#3FC9E9]">PSIRA: {off.psiraNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Clock Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold flex-none ${
                        off.isClockedIn
                          ? 'bg-[#3AA655]/15 text-[#5BCB80] border border-[#3AA655]/30'
                          : 'bg-white/10 text-[#8598A8] border border-white/15'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${off.isClockedIn ? 'bg-[#3AA655] animate-pulse' : 'bg-gray-400'}`} />
                        <span>{off.isClockedIn ? 'Clocked In' : 'Off Duty'}</span>
                      </span>
                    </div>

                    {/* Duty Deployment Details */}
                    <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-white/5 bg-[#051320] p-2.5 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] text-[#8598A8] uppercase font-semibold block">Site &amp; Post:</span>
                        <span className="font-semibold text-white truncate block">{off.currentSite}</span>
                        <span className="text-[11px] text-[#3FC9E9] truncate block">{off.currentPost || 'General Patrol'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#8598A8] uppercase font-semibold block">Shift &amp; Elapsed:</span>
                        <span className="font-mono-code text-white">
                          In: {off.clockInTime || '06:00'} · {off.hoursToday || '0.0'} hrs
                        </span>
                        <span className="text-[11px] text-[#5BCB80] block font-mono-code">
                          Rate: R{(off.hourlyRate || 36.5).toFixed(2)}/hr
                        </span>
                      </div>
                    </div>

                    {/* Telemetry & Compliance Strip */}
                    <div className="flex items-center justify-between gap-2 mt-2 px-1 text-[10px] text-[#8598A8] font-mono-code">
                      <span className="flex items-center gap-1">
                        <span className="text-emerald-400">✓</span> Geofence: Locked
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-[#3FC9E9]">🔋</span> Battery: {off.batteryLevel || 92}%
                      </span>
                      <span>Grade: {off.grade}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => sendOfficerWelfarePing(off.id)}
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                        title="Send high-priority welfare ping check to officer phone"
                      >
                        <span>📡</span>
                        <span>Welfare Ping</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onSelectOfficer) {
                            onSelectOfficer(off);
                          } else {
                            setSelectedOfficerForModal(off);
                          }
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] border border-[#1FA6C9]/30 rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                        title="Open complete personnel dossier, certificates, and compliance docs"
                      >
                        <span>📁</span>
                        <span>Profile &amp; Docs</span>
                      </button>
                    </div>

                    {/* Clock In / Out Toggle */}
                    <button
                      onClick={async () => {
                        if (off.isClockedIn) {
                          await manualClockOutOfficer(off.id);
                        } else {
                          await manualClockInOfficer(off.id, off.currentSite, off.currentPost);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        off.isClockedIn
                          ? 'bg-amber-500/20 hover:bg-rose-600 text-amber-300 hover:text-white border border-amber-500/30'
                          : 'bg-[#3AA655]/20 hover:bg-[#3AA655] text-[#5BCB80] hover:text-white border border-[#3AA655]/30'
                      }`}
                    >
                      {off.isClockedIn ? 'Clock Out' : 'Clock In'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-white/10 bg-[#071726] flex items-center justify-between text-xs text-[#8598A8]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5BCB80] animate-pulse" />
            <span>Connected to Live Control Room Roster &amp; Biometric Station</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-all cursor-pointer"
          >
            Close Board
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
