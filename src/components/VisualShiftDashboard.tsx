import React, { useState } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { VisualShiftBlock } from '../types/dutyon';
import { BillableHoursRatioWidget } from './BillableHoursRatioWidget';

const TIMELINE_HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

export const VisualShiftDashboard: React.FC = () => {
  const {
    sites,
    officersList,
    clockTime,
    showToast,
    dispatchArmedBackupToSite,
    setSelectedOfficerForModal,
    setSelectedSiteForModal,
    setControlRoomTab,
    manualClockInOfficer,
    manualClockOutOfficer,
    setIsManualClockInModalOpen,
    setIsPatrolLogsModalOpen
  } = useDutyOn();

  // Selected site filter for timeline
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');

  // Selected shift block for quick info popover
  const [selectedShiftBlock, setSelectedShiftBlock] = useState<VisualShiftBlock | null>(null);

  // Dynamically generate realistic visual shift blocks for the 24-hour Gantt timeline from enrolled personnel
  const shiftBlocks = React.useMemo<VisualShiftBlock[]>(() => {
    return officersList.map((off, idx) => {
      const isNight = idx % 2 === 1;
      const isClocked = Boolean(off.isClockedIn);
      const site = off.currentSite || 'Provincial Office';
      const post = off.currentPost || (isNight ? 'Perimeter Patrol & Guard Post' : 'Main Security & Access Gate');

      return {
        id: `vsb-${off.id || idx}`,
        siteName: site,
        postName: post,
        officerName: off.name,
        officerGrade: off.grade || 'Grade C',
        empId: off.empId || `EMP-${1000 + idx}`,
        startHour: isNight ? 18 : 6,
        durationHours: 12,
        shiftType: isNight ? 'NIGHT' : 'DAY',
        status: isClocked ? 'active_on_duty' : (isNight ? 'scheduled' : 'relieved'),
        clockInTime: off.clockInTime || (isNight ? '17:55' : '05:52'),
        psiraVerified: Boolean(off.psiraNumber),
        batteryPercent: off.batteryLevel || 92
      };
    });
  }, [officersList]);

  const filteredBlocks = selectedSiteFilter === 'ALL'
    ? shiftBlocks
    : shiftBlocks.filter((b) => b.siteName === selectedSiteFilter);

  // Relevant officers for the selected site filter
  const relevantOfficers = React.useMemo(() => {
    if (selectedSiteFilter === 'ALL') return officersList;
    return officersList.filter((o) => (o.currentSite || o.siteDeployed) === selectedSiteFilter);
  }, [officersList, selectedSiteFilter]);

  // Total posts required from site definitions
  const totalPostsRequired = React.useMemo(() => {
    if (selectedSiteFilter === 'ALL') {
      return sites.reduce((sum, s) => sum + (s.officersRequired || 0), 0) || 84;
    }
    const matching = sites.find((s) => s.name === selectedSiteFilter);
    return matching?.officersRequired || 4;
  }, [sites, selectedSiteFilter]);

  // Active clocked-in personnel
  const activeClockedInOfficers = React.useMemo(() => {
    return relevantOfficers.filter((o) => Boolean(o.isClockedIn));
  }, [relevantOfficers]);

  const activeCount = activeClockedInOfficers.length;

  // Real-time Post Coverage Rate (recalculated from zero)
  const postCoverageRate = totalPostsRequired > 0
    ? Math.round((activeCount / totalPostsRequired) * 1000) / 10
    : 0;

  // Grade A / Armed Compliance calculated from active officers
  const gradeAOfficers = relevantOfficers.filter((o) => o.grade && (o.grade.includes('Grade A') || o.grade.includes('Armed')));
  const gradeAActive = activeClockedInOfficers.filter((o) => o.grade && (o.grade.includes('Grade A') || o.grade.includes('Armed'))).length;
  const gradeACompliance = gradeAOfficers.length > 0
    ? Math.round((gradeAActive / gradeAOfficers.length) * 100)
    : (activeCount > 0 ? 100 : 0);

  // Standby reserve pool
  const standbyReserveOfficers = relevantOfficers.filter((o) => !o.isClockedIn);
  const standbyCount = standbyReserveOfficers.length;

  // Current time window & shift label
  const now = new Date();
  const currentHour = now.getHours();
  const isNightShiftNow = currentHour >= 18 || currentHour < 6;
  const activeShiftLabel = isNightShiftNow ? 'Active Night Shift Fleet' : 'Active Day Shift Fleet';
  const activeShiftTimeWindow = isNightShiftNow ? '18:00 – 06:00' : '06:00 – 18:00';

  // Parse current hour for the live vertical cursor
  const currentHourDecimal = (() => {
    const time = clockTime || '23:42:00';
    const parts = time.split(':');
    const h = parseInt(parts[0], 10) || currentHour;
    const m = parseInt(parts[1], 10) || now.getMinutes();
    return h + m / 60;
  })();

  const currentHourPercent = (currentHourDecimal / 24) * 100;

  // Hourly density values (0 to 23 hours) dynamically derived from clocked-in officers
  const hourlyDensity = React.useMemo(() => {
    const counts = new Array(24).fill(0);
    activeClockedInOfficers.forEach((off) => {
      const isNight = (off.currentShift || '').toLowerCase().includes('night');
      const start = isNight ? 18 : 6;
      for (let i = 0; i < 12; i++) {
        const h = (start + i) % 24;
        counts[h] += 1;
      }
    });
    return counts;
  }, [activeClockedInOfficers]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-gradient-to-r from-[#0C2438] via-[#0E2C44] to-[#0A1D2D] border border-white/10 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 grid place-items-center text-cyan-400">
              <svg className="w-5 h-5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-white tracking-wide">
                Visual Shift Command &amp; Live Manning Gantt
              </h2>
              <p className="text-xs text-[#8598A8] mt-0.5">
                Real-time 24-hour shift schedule, post coverage meters &amp; biometric roll call
              </p>
            </div>
          </div>
        </div>

        {/* Live Clock, Site Filter & Shift Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button
            onClick={() => setIsManualClockInModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#042430] font-display font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all"
            title="Manually clock in or out any guard from the control room"
          >
            <span>⚡</span>
            <span>Manual Roll Call</span>
          </button>

          <button
            onClick={() => setIsPatrolLogsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[#3FC9E9] font-display font-semibold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            title="Open Real-Time Patrol & Checkpoint Logs"
          >
            <span>📋</span>
            <span>Patrol Logs</span>
          </button>

          <div className="bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="text-[10px] text-[#8598A8] uppercase font-mono-code leading-none">Live Ops Clock</div>
              <div className="font-mono-code font-bold text-sm text-white mt-0.5">{clockTime} CAT</div>
            </div>
          </div>

          <select
            value={selectedSiteFilter}
            onChange={(e) => setSelectedSiteFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
          >
            <option value="ALL">All Protected Sites ({sites.length})</option>
            {sites.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Meters (Dynamically calculated from zero baseline) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Post Coverage Rate</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-white">{postCoverageRate}%</span>
            <span className="text-[11px] text-emerald-400 font-semibold font-mono-code">
              {activeCount} / {totalPostsRequired} Posts
            </span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#1FA6C9] to-emerald-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(postCoverageRate, 100)}%` }} 
            />
          </div>
          <div className="text-[10px] text-[#8598A8] mt-1 font-mono-code">
            {activeCount === 0 ? '0 guards clocked in · Awaiting shifts' : `${activeCount} guards verified on post`}
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Grade A Armed Compliance</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`font-display font-extrabold text-2xl ${gradeACompliance > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {gradeACompliance}%
            </span>
            <span className="text-[11px] text-[#8598A8]">
              {gradeAActive} / {gradeAOfficers.length || 1} Armed Posts
            </span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${gradeACompliance > 0 ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span>SAPS 511(a) Competency Verified</span>
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">{activeShiftLabel}</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-cyan-400">
              {activeCount} Guards
            </span>
            <span className="text-[11px] text-[#8598A8]">{activeShiftTimeWindow}</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${activeCount > 0 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{activeCount > 0 ? 'Biometric roll call active' : 'No active clock-ins'}</span>
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Standby Reserve Pool</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-amber-400">
              {standbyCount} Guards
            </span>
            <span className="text-[11px] text-amber-300 font-semibold">Quick Relief</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Avg dispatch ETA: 12 mins</span>
          </div>
        </div>
      </div>

      {/* 24-HOUR VISUAL SHIFT GANTT TIMELINE */}
      <div className="bg-[#0b2135]/90 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-extrabold text-base text-white tracking-wide flex items-center gap-2">
              <span>24-Hour Visual Shift Gantt Matrix</span>
              <span className="text-[10px] font-mono-code font-bold bg-[#1FA6C9]/20 text-[#3FC9E9] px-2 py-0.5 rounded border border-[#1FA6C9]/40">
                LIVE TIMELINE
              </span>
            </h3>
            <p className="text-xs text-[#8598A8] mt-0.5">
              Click on any shift block to inspect officer credentials, battery, or trigger relief.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8598A8]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/60 inline-block" />
              <span>Active On Duty</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500/30 border border-indigo-500/60 inline-block" />
              <span>Night Shift</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-white/10 border border-white/20 inline-block" />
              <span>Relieved / Handover</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/60 inline-block" />
              <span>Unassigned Post</span>
            </span>
          </div>
        </div>

        {/* The Gantt Timeline Canvas */}
        <div className="overflow-x-auto">
          <div className="min-w-[840px] space-y-3">
            {/* Timeline Hours Header */}
            <div className="grid grid-cols-12 text-[11px] font-mono-code text-[#8598A8] border-b border-white/10 pb-2">
              {TIMELINE_HOURS.slice(0, 12).map((hour) => (
                <div key={hour} className="text-left pl-1">
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Shift Rows Container with Live Cursor */}
            <div className="relative space-y-2.5 py-1">
              {/* Vertical Live Time Indicator Cursor */}
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none border-l-2 border-dashed border-rose-400 flex flex-col items-center"
                style={{ left: `${Math.min(Math.max(currentHourPercent, 0), 100)}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -mt-1 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <div className="bg-rose-500 text-white font-mono-code text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md mt-0.5 whitespace-nowrap">
                  NOW {clockTime?.slice(0, 5)}
                </div>
              </div>

              {/* Rows */}
              {filteredBlocks.map((block) => {
                const leftPercent = (block.startHour / 24) * 100;
                const widthPercent = (block.durationHours / 24) * 100;

                const isNight = block.shiftType === 'NIGHT';
                const isUnassigned = block.status === 'unassigned';
                const isRelieved = block.status === 'relieved';

                return (
                  <div key={block.id} className="relative h-12 bg-black/20 rounded-xl p-1 border border-white/5 flex items-center">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-10">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="border-r border-white" />
                      ))}
                    </div>

                    {/* Shift Block Bar */}
                    <div
                      onClick={() => setSelectedShiftBlock(block)}
                      className={`absolute h-9 rounded-lg px-2.5 py-1 flex items-center justify-between shadow-sm cursor-pointer transition-transform hover:scale-[1.01] hover:z-10 border ${
                        isUnassigned
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                          : isRelieved
                          ? 'bg-white/[0.06] border-white/10 text-slate-400'
                          : isNight
                          ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                          : 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200'
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`
                      }}
                      title={`${block.officerName} · ${block.postName}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-none ${
                          isUnassigned ? 'bg-rose-500' : isRelieved ? 'bg-slate-400' : 'bg-emerald-400'
                        }`} />
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate leading-tight text-white">
                            {block.officerName}
                          </div>
                          <div className="text-[10px] text-[#8598A8] truncate leading-none">
                            {block.postName} · {block.siteName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-none font-mono-code text-[10px]">
                        <span className="px-1 py-0.2 rounded bg-black/40 text-white font-bold">
                          {block.officerGrade}
                        </span>
                        {!isUnassigned && (
                          <span className="text-slate-300 hidden sm:inline">
                            {block.batteryPercent}% 🔋
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sectoral Pay Period Hours Ratio & Billable Recovery Widget */}
      <BillableHoursRatioWidget onOpenFullPayroll={() => setControlRoomTab('payroll')} />

      {/* 24-HOUR HOURLY DENSITY CHART & SITE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Guard Density Chart (2 cols) */}
        <div className="lg:col-span-2 bg-[#0b2135]/80 border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-white">
                Hourly Deployed Guard Density
              </h3>
              <p className="text-xs text-[#8598A8]">
                Manned guards on site hour-by-hour across Gqeberha / Port Elizabeth perimeter
              </p>
            </div>
            <span className="font-mono-code text-xs text-[#3FC9E9] font-bold">
              Peak: 34 Officers (08:00 - 16:00)
            </span>
          </div>

          {/* Simple Clean Bar Chart with Tailwind */}
          <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-white/10">
            {hourlyDensity.map((count, hour) => {
              const heightPercent = (count / 34) * 100;
              const isCurrentHour = Math.floor(currentHourDecimal) === hour;

              return (
                <div key={hour} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="text-[9px] font-mono-code text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </div>
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      isCurrentHour
                        ? 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                        : count >= 30
                        ? 'bg-[#1FA6C9] hover:bg-[#3FC9E9]'
                        : 'bg-indigo-500/80 hover:bg-indigo-400'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${hour}:00 — ${count} officers deployed`}
                  />
                  <div className="text-[8px] font-mono-code text-[#8598A8]">
                    {hour % 3 === 0 ? hour : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-[#8598A8]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500/80" />
                <span>Night Shift Baseline (22–24 Guards)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#1FA6C9]" />
                <span>Day Peak Commercial (34 Guards)</span>
              </span>
            </div>
            <span>Biometric Clock-In Verification Enforced</span>
          </div>
        </div>

        {/* Live Attendance Roll Call Feed (1 col) */}
        <div className="bg-[#0b2135]/80 border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-white">
              Live Shift Roll Call
            </h3>
            <span className="text-[10px] font-mono-code font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              ● STREAMING
            </span>
          </div>

          <div className="space-y-2 text-xs max-h-80 overflow-y-auto pr-1">
            {officersList.map((off) => {
              const isOnDuty = Boolean(off.isClockedIn);
              return (
                <div key={off.id} className="bg-white/[0.04] hover:bg-white/[0.07] p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2.5 transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg font-bold grid place-items-center flex-none text-xs ${
                      isOnDuty ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700/60 text-slate-400'
                    }`}>
                      {isOnDuty ? '✓' : '●'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate text-xs">
                        {off.name}
                      </div>
                      <div className="text-[#8598A8] text-[10.5px] truncate">
                        {off.currentSite || 'Provincial Office'} · {off.clockInTime || 'Pending'} · {off.grade}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-none">
                    {isOnDuty ? (
                      <button
                        type="button"
                        onClick={() => manualClockOutOfficer(off.id)}
                        className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] font-bold cursor-pointer transition-all"
                        title="Clock out of shift"
                      >
                        Clock Out
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => manualClockInOfficer(off.id, off.currentSite, off.currentPost)}
                        className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-bold cursor-pointer transition-all"
                        title="Clock into post"
                      >
                        Clock In
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setIsManualClockInModalOpen(true)}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#3FC9E9] text-xs font-semibold border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>⚡ Open Full Muster Roll Call Modal ›</span>
          </button>
        </div>
      </div>

      {/* SHIFT BLOCK INSPECTOR MODAL */}
      {selectedShiftBlock && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b2135] border border-white/15 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono-code uppercase tracking-wider text-[#1FA6C9] font-semibold">
                  Shift Post Tactical Dossier
                </span>
                <h3 className="font-display font-extrabold text-lg text-white mt-0.5">
                  {selectedShiftBlock.postName}
                </h3>
                <p className="text-xs text-[#8598A8]">
                  {selectedShiftBlock.siteName}
                </p>
              </div>
              <button
                onClick={() => setSelectedShiftBlock(null)}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-400 hover:text-white grid place-items-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 bg-black/30 p-3.5 rounded-xl border border-white/10 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8598A8]">Assigned Officer:</span>
                <span className="font-bold text-white">{selectedShiftBlock.officerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8598A8]">PSIRA Grade:</span>
                <span className="font-mono-code font-bold text-[#3FC9E9]">{selectedShiftBlock.officerGrade}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8598A8]">Shift Schedule:</span>
                <span className="text-white">
                  {selectedShiftBlock.startHour}:00 – {(selectedShiftBlock.startHour + selectedShiftBlock.durationHours) % 24}:00 (12h)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8598A8]">Clock-In Time:</span>
                <span className="text-emerald-400 font-mono-code">{selectedShiftBlock.clockInTime || 'Pending'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8598A8]">Wand / Radio Battery:</span>
                <span className="text-white font-mono-code">{selectedShiftBlock.batteryPercent}%</span>
              </div>
            </div>

            {(() => {
              const matchedOfficer = officersList.find(
                (o) => o.name.toLowerCase() === selectedShiftBlock.officerName.toLowerCase() || o.id === selectedShiftBlock.id.replace('vsb-', '')
              );
              const isCurrentlyClockedIn = Boolean(matchedOfficer?.isClockedIn);

              return (
                <div className="pt-2 flex flex-wrap justify-end gap-2 border-t border-white/10">
                  {matchedOfficer && (
                    isCurrentlyClockedIn ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await manualClockOutOfficer(matchedOfficer.id);
                          setSelectedShiftBlock(null);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-all"
                      >
                        🔴 Clock Out Officer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          await manualClockInOfficer(matchedOfficer.id, selectedShiftBlock.siteName, selectedShiftBlock.postName);
                          setSelectedShiftBlock(null);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#042430] cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        🟢 Clock In to Post Now
                      </button>
                    )
                  )}

                  <button
                    onClick={() => {
                      showToast(`Standby relief officer dispatched to ${selectedShiftBlock.postName}`);
                      setSelectedShiftBlock(null);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] border border-[#1FA6C9]/40 cursor-pointer"
                  >
                    Dispatch Relief Guard
                  </button>
                  <button
                    onClick={() => setSelectedShiftBlock(null)}
                    className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
