import React, { useState } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { EmployeeRosterRow } from '../types/dutyon';
import { SecurityRosterMaker } from './SecurityRosterMaker';

const DAYS = [
  { id: 0, day: 'Thu', date: '22 May', fullDate: '2026-05-22' },
  { id: 1, day: 'Fri', date: '23 May', fullDate: '2026-05-23' },
  { id: 2, day: 'Sat', date: '24 May', fullDate: '2026-05-24' },
  { id: 3, day: 'Sun', date: '25 May', fullDate: '2026-05-25' },
  { id: 4, day: 'Mon', date: '26 May', fullDate: '2026-05-26' },
  { id: 5, day: 'Tue', date: '27 May', fullDate: '2026-05-27' },
  { id: 6, day: 'Wed', date: '28 May', fullDate: '2026-05-28' }
];

export const RosterManagementView: React.FC = () => {
  const {
    rosterRows,
    updateRosterShift,
    setSelectedRosterShift,
    autoFillOpenShifts,
    publishRoster,
    swapRosterShifts,
    sites,
    officersList,
    showToast,
    setIsNewOfficerModalOpen,
    setControlRoomTab,
  } = useDutyOn();

  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeWeek, setActiveWeek] = useState<string>('22 May – 28 May 2026');
  const [rosterViewMode, setRosterViewMode] = useState<'monthly_maker' | 'fleet_matrix'>('monthly_maker');
  
  // Shift assignment modal / drawer state
  const [editingCell, setEditingCell] = useState<{
    officer: EmployeeRosterRow;
    dayIdx: number;
    dayName: string;
    currentShift: 'D' | 'N' | 'OFF' | 'OPEN' | 'EXC';
  } | null>(null);

  // Quick swap modal state
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapOfficer1, setSwapOfficer1] = useState(rosterRows[0]?.empId || '');
  const [swapOfficer2, setSwapOfficer2] = useState(rosterRows[1]?.empId || '');
  const [swapDayIdx, setSwapDayIdx] = useState(0);

  // Filter rows
  const filteredRows = rosterRows.filter((row) => {
    if (selectedSiteFilter !== 'ALL' && row.site !== selectedSiteFilter) return false;
    if (selectedGradeFilter !== 'ALL') {
      if (selectedGradeFilter === 'A' && !row.grade.includes('A')) return false;
      if (selectedGradeFilter === 'B' && !row.grade.includes('B')) return false;
      if (selectedGradeFilter === 'C' && !row.grade.includes('C')) return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = row.name.toLowerCase().includes(q);
      const matchEmp = row.empId.toLowerCase().includes(q);
      const matchSite = (row.site || '').toLowerCase().includes(q);
      const matchPsira = (row.psiraNumber || '').toLowerCase().includes(q);
      if (!matchName && !matchEmp && !matchSite && !matchPsira) return false;
    }
    return true;
  });

  // Calculate stats
  let totalScheduledShifts = 0;
  let totalOpenShifts = 0;
  let totalExceptions = 0;

  rosterRows.forEach((r) => {
    r.shifts.forEach((s) => {
      if (s === 'D' || s === 'N') totalScheduledShifts++;
      if (s === 'OPEN') totalOpenShifts++;
      if (s === 'EXC') totalExceptions++;
    });
  });

  const totalPossible = rosterRows.length * 7;
  const manningPercentage = Math.round((totalScheduledShifts / (totalPossible - (rosterRows.length * 2))) * 100);

  const getShiftBadge = (shift: 'D' | 'N' | 'OFF' | 'OPEN' | 'EXC') => {
    switch (shift) {
      case 'D':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono-code font-bold text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:scale-105 transition-transform">
            D
          </span>
        );
      case 'N':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono-code font-bold text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:scale-105 transition-transform">
            N
          </span>
        );
      case 'OFF':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono-code text-[11px] text-slate-400 bg-white/[0.04] border border-white/5 hover:border-white/20 transition-all">
            OFF
          </span>
        );
      case 'OPEN':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono-code font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse hover:scale-105 transition-transform">
            OPEN
          </span>
        );
      case 'EXC':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono-code font-bold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:scale-105 transition-transform">
            EXC
          </span>
        );
      default:
        return null;
    }
  };

  const getHoursCount = (shifts: ('D' | 'N' | 'OFF' | 'OPEN' | 'EXC')[]) => {
    const shiftCount = shifts.filter((s) => s === 'D' || s === 'N').length;
    return shiftCount * 12;
  };

  const handleApplyShiftChange = (shift: 'D' | 'N' | 'OFF' | 'OPEN' | 'EXC') => {
    if (!editingCell) return;
    updateRosterShift(editingCell.officer.empId, editingCell.dayIdx, shift);
    showToast(`Shift updated for ${editingCell.officer.name} (${DAYS[editingCell.dayIdx].day} → ${shift})`);
    setEditingCell(null);
  };

  const handleExecuteSwap = () => {
    if (!swapOfficer1 || !swapOfficer2 || swapOfficer1 === swapOfficer2) {
      showToast('Please select two distinct officers to swap');
      return;
    }
    swapRosterShifts(swapOfficer1, swapOfficer2, swapDayIdx);
    setIsSwapModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Subview Navigation Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0A1E33]/90 border border-white/10 p-2 rounded-2xl shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRosterViewMode('monthly_maker')}
            className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              rosterViewMode === 'monthly_maker'
                ? 'bg-[#1FA6C9] text-[#04222c] shadow-md'
                : 'text-[#8598A8] hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Security Roster Maker</span>
            <span className={`font-mono-code text-[10px] px-2 py-0.5 rounded-full ${
              rosterViewMode === 'monthly_maker' ? 'bg-[#04222c]/20 text-[#04222c] font-black' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              Month &amp; Week (4×4)
            </span>
          </button>

          <button
            onClick={() => setRosterViewMode('fleet_matrix')}
            className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              rosterViewMode === 'fleet_matrix'
                ? 'bg-[#1FA6C9] text-[#04222c] shadow-md'
                : 'text-[#8598A8] hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span>Tactical Dispatch &amp; Multi-Site Fleet Matrix</span>
          </button>

          <button
            onClick={() => setControlRoomTab('payroll')}
            className="px-3 py-2 rounded-xl font-display font-semibold text-xs text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            title="View Biometric Clock-in Timesheets & Sectoral Determination Payroll Export"
          >
            <span>⏱️</span>
            <span>Timesheets &amp; Payroll</span>
            <span className="font-mono-code text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
              104% Billable
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-[#8598A8] pr-3 font-mono-code">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>SA Security Standards · Automatic 4-Platoon 4×4 &amp; Continental 2-2-4</span>
        </div>
      </div>

      {/* Conditionally Render View */}
      {rosterViewMode === 'monthly_maker' ? (
        <SecurityRosterMaker />
      ) : (
        <div className="space-y-6">
          {/* Top Banner / Hero Summary */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-gradient-to-r from-[#0C2438] via-[#0E2C44] to-[#0A1D2D] border border-white/10 rounded-2xl p-5 shadow-lg">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1FA6C9]/15 border border-[#1FA6C9]/30 grid place-items-center text-[#3FC9E9]">
                  <svg className="w-5 h-5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-xl text-white tracking-wide">
                    Multi-Site Roster Management &amp; Tactical Dispatch
                  </h2>
                  <p className="text-xs text-[#8598A8] mt-0.5">
                    Active Week: <span className="text-white font-medium">{activeWeek}</span> · PSIRA SIRA Shift Hours Compliance Enforced
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
              {/* Quick Swap */}
              <button
                id="btn-quick-swap-shifts"
                onClick={() => setIsSwapModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.07] hover:bg-white/[0.12] text-[#d6e3ee] border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#3FC9E9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Swap Shifts</span>
              </button>

              {/* AI Auto-Fill Relief */}
              <button
                id="btn-auto-fill-relief"
                onClick={autoFillOpenShifts}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] border border-[#1FA6C9]/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4 text-[#3FC9E9] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Auto-Fill Relief Gaps</span>
              </button>

              {/* Add Officer */}
              <button
                id="btn-add-guard-roster"
                onClick={() => setIsNewOfficerModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Officer</span>
              </button>

              {/* Publish Roster */}
              <button
                id="btn-publish-roster"
                onClick={() => publishRoster(activeWeek)}
                className="px-4 py-2 rounded-xl text-xs font-display font-bold bg-[#1FA6C9] hover:bg-[#1b93b3] text-[#04222c] transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Publish Roster to Fleet</span>
              </button>
            </div>
          </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Scheduled Shifts</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-white">{totalScheduledShifts}</span>
            <span className="text-[11px] text-emerald-400 font-semibold font-mono-code">12-hr blocks</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Manned across 7 sites</span>
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Manning Fill Rate</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-white">{manningPercentage}%</span>
            <span className="text-[11px] text-emerald-400 font-semibold">SLA Target &gt;95%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1FA6C9] to-emerald-400 h-full rounded-full" style={{ width: `${Math.min(manningPercentage, 100)}%` }} />
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Open Relief Gaps</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-amber-400">{totalOpenShifts}</span>
            <span className="text-[11px] text-amber-300 font-semibold">Requires Guard</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Click Auto-Fill to resolve</span>
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Fatigue &amp; BCEA Check</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-emerald-400">100%</span>
            <span className="text-[11px] text-emerald-300 font-semibold">Compliant</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Max 48 hrs/wk · 12 hr rest verified</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0b2135]/60 border border-white/10 rounded-xl p-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8598A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search officer, EMP ID, PSIRA, or site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-white placeholder-[#8598A8] focus:outline-none focus:border-[#1FA6C9]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Site Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#8598A8]">
            <span>Site:</span>
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
            >
              <option value="ALL">All Sites ({sites.length})</option>
              {sites.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#8598A8]">
            <span>PSIRA Grade:</span>
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
            >
              <option value="ALL">All Grades</option>
              <option value="A">Grade A (Armed Tactical)</option>
              <option value="B">Grade B (Access / Supervisor)</option>
              <option value="C">Grade C (Patrol / Static)</option>
            </select>
          </div>

          {/* Shift Key Legend */}
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-white/10 text-[11px] text-[#8598A8]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block text-center leading-3 font-mono-code text-[9px] text-emerald-400 font-bold">D</span>
              <span>Day (06-18)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-500/40 inline-block text-center leading-3 font-mono-code text-[9px] text-indigo-300 font-bold">N</span>
              <span>Night (18-06)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40 inline-block text-center leading-3 font-mono-code text-[9px] text-amber-300 font-bold">O</span>
              <span>Open</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-white/10 border border-white/10 inline-block text-center leading-3 font-mono-code text-[9px] text-slate-400">OFF</span>
              <span>Rest</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Roster Matrix Table */}
      <div className="bg-[#0b2135]/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#091a2a] text-[11px] font-semibold text-[#8598A8] uppercase tracking-wider">
                <th className="py-3.5 px-4 min-w-[220px]">Officer &amp; PSIRA</th>
                <th className="py-3.5 px-3 min-w-[170px]">Assigned Site</th>
                {DAYS.map((d) => (
                  <th key={d.id} className="py-3.5 px-2 text-center min-w-[65px]">
                    <div className="text-white font-bold text-xs">{d.day}</div>
                    <div className="text-[10px] text-[#8598A8] font-mono-code lowercase">{d.date}</div>
                  </th>
                ))}
                <th className="py-3.5 px-3 text-center min-w-[80px]">Hours</th>
                <th className="py-3.5 px-3 text-right min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-[#d6e3ee]">
              {filteredRows.map((row) => {
                const totalHours = getHoursCount(row.shifts);
                const hasFatigueAlert = totalHours > 48;

                return (
                  <tr key={row.empId} className="hover:bg-white/[0.03] transition-colors group">
                    {/* Officer Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg grid place-items-center font-display font-bold text-xs text-white flex-none shadow-sm"
                          style={{ backgroundColor: row.color || '#1FA6C9' }}
                        >
                          {row.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate flex items-center gap-1.5">
                            <span>{row.name}</span>
                            <span className="text-[10px] font-mono-code font-bold px-1.5 py-0.2 rounded bg-white/10 text-[#3FC9E9]">
                              {row.grade}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8598A8] font-mono-code truncate">
                            {row.empId} · PSIRA #{row.psiraNumber || '2819034'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Site */}
                    <td className="py-3 px-3">
                      <div className="truncate font-medium text-[#c4d6e4] max-w-[170px]">
                        {row.site || 'Provincial Office'}
                      </div>
                      <div className="text-[10px] text-[#8598A8]">Static Armed Post</div>
                    </td>

                    {/* 7 Days Shift Cells */}
                    {row.shifts.map((shift, dayIdx) => (
                      <td
                        key={dayIdx}
                        onClick={() =>
                          setEditingCell({
                            officer: row,
                            dayIdx,
                            dayName: `${DAYS[dayIdx].day} (${DAYS[dayIdx].date})`,
                            currentShift: shift
                          })
                        }
                        className="py-2.5 px-1.5 text-center cursor-pointer hover:bg-white/[0.08] transition-colors rounded-md"
                        title={`Click to edit shift for ${row.name} on ${DAYS[dayIdx].day}`}
                      >
                        {getShiftBadge(shift)}
                      </td>
                    ))}

                    {/* Total Hours */}
                    <td className="py-3 px-3 text-center">
                      <span className={`font-mono-code font-bold text-xs ${hasFatigueAlert ? 'text-rose-400' : 'text-[#3FC9E9]'}`}>
                        {totalHours}h
                      </span>
                      {hasFatigueAlert && (
                        <div className="text-[9px] text-rose-400 font-semibold uppercase tracking-wider">
                          Overtime!
                        </div>
                      )}
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() =>
                          setSelectedRosterShift({
                            officer: row,
                            dayIdx: 0,
                            dayName: 'Thu 22 May'
                          })
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-[#3FC9E9] border border-white/10 transition-all cursor-pointer"
                      >
                        Schedule
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm text-[#8598A8]">
                    No officers match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-[#091a2a] px-4 py-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8598A8]">
          <div>
            Showing <span className="text-white font-semibold">{filteredRows.length}</span> of{' '}
            <span className="text-white font-semibold">{rosterRows.length}</span> officers on master roster
          </div>
          <div className="flex items-center gap-2">
            <span>Shift Cycles: 12-Hour Fixed · Bi-Weekly Rotation Pattern</span>
          </div>
        </div>
      </div>

      {/* IN-PLACE SHIFT EDIT MODAL / DRAWER */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b2135] border border-white/15 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono-code uppercase tracking-wider text-[#1FA6C9] font-semibold">
                  Shift Assignment Editor
                </span>
                <h3 className="font-display font-extrabold text-lg text-white mt-0.5">
                  {editingCell.officer.name}
                </h3>
                <p className="text-xs text-[#8598A8]">
                  {editingCell.dayName} · {editingCell.officer.site || 'Main Site'}
                </p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-400 hover:text-white grid place-items-center"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[#8598A8]">
              Select shift duty status for this 12-hour operational window:
            </div>

            {/* Shift Options */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleApplyShiftChange('D')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  editingCell.currentShift === 'D'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono-code font-bold grid place-items-center flex-none">
                  D
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Day Shift</div>
                  <div className="text-[10px] text-emerald-400 font-mono-code">06:00 – 18:00 (12h)</div>
                </div>
              </button>

              <button
                onClick={() => handleApplyShiftChange('N')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  editingCell.currentShift === 'N'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono-code font-bold grid place-items-center flex-none">
                  N
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Night Shift</div>
                  <div className="text-[10px] text-indigo-300 font-mono-code">18:00 – 06:00 (12h)</div>
                </div>
              </button>

              <button
                onClick={() => handleApplyShiftChange('OFF')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  editingCell.currentShift === 'OFF'
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 text-slate-400 font-mono-code font-bold grid place-items-center flex-none">
                  OFF
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Rest Day</div>
                  <div className="text-[10px] text-slate-400">Scheduled Time-Off</div>
                </div>
              </button>

              <button
                onClick={() => handleApplyShiftChange('OPEN')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  editingCell.currentShift === 'OPEN'
                    ? 'bg-amber-500/20 border-amber-500/50 text-white'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 font-mono-code font-bold grid place-items-center flex-none">
                  OPEN
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Vacant / Relief</div>
                  <div className="text-[10px] text-amber-400">Requires Guard</div>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
              <button
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SWAP MODAL */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b2135] border border-white/15 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono-code uppercase tracking-wider text-[#1FA6C9] font-semibold">
                  Shift Reassignment
                </span>
                <h3 className="font-display font-extrabold text-lg text-white mt-0.5">
                  Swap Shifts Between Officers
                </h3>
                <p className="text-xs text-[#8598A8]">
                  Select two officers to exchange their rostered shift block for a selected date.
                </p>
              </div>
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-400 hover:text-white grid place-items-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8598A8] block mb-1">Target Day:</label>
                <select
                  value={swapDayIdx}
                  onChange={(e) => setSwapDayIdx(Number(e.target.value))}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.day} — {d.date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8598A8] block mb-1">First Officer:</label>
                  <select
                    value={swapOfficer1}
                    onChange={(e) => setSwapOfficer1(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  >
                    {rosterRows.map((r) => (
                      <option key={r.empId} value={r.empId}>
                        {r.name} ({r.grade}) · {r.shifts[swapDayIdx]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#8598A8] block mb-1">Second Officer:</label>
                  <select
                    value={swapOfficer2}
                    onChange={(e) => setSwapOfficer2(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  >
                    {rosterRows.map((r) => (
                      <option key={r.empId} value={r.empId}>
                        {r.name} ({r.grade}) · {r.shifts[swapDayIdx]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSwap}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1FA6C9] hover:bg-[#1b93b3] text-[#04222c] shadow-sm cursor-pointer"
              >
                Confirm Shift Swap
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
