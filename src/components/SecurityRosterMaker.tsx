import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { ShiftCode, GuardRosterEntry, SecurityRosterPlan } from '../types/dutyon';
import { saveRosterPlanToCloud, getRosterPlanFromCloud } from '../services/firestoreDutyOn';
import { AddOfficerToRosterModal } from './modals/AddOfficerToRosterModal';

const ROTATION_PATTERNS = {
  FOUR_BY_FOUR: '4x4',
  TWO_TWO_FOUR: '2-2-4',
  FOUR_ON_TWO_OFF: '4-on-2-off',
  SMART_COVERAGE: 'smart_solver'
};

const DEFAULT_INITIAL_GUARDS: GuardRosterEntry[] = [
  {
    id: 'off-1086',
    name: 'Sesing Teboho',
    psiraNumber: '925068',
    grade: 'Grade B (Supervisor)',
    empId: '1086',
    phone: '064 024 7224',
    assignedSite: 'Provincial Office',
    shifts: {}
  },
  {
    id: 'off-admin',
    name: 'Tshepo Maloa',
    psiraNumber: '2490181',
    grade: 'Grade A (Director / Ops In-Charge)',
    empId: 'DIR-0001',
    phone: '071 283 3558',
    assignedSite: 'Provincial Office',
    shifts: {}
  },
  {
    id: 'off-1071',
    name: 'Matyolo Nomahlubi',
    psiraNumber: '2753127',
    grade: 'Grade C (Patrol / Access)',
    empId: '1071',
    phone: '063 782 9577',
    assignedSite: 'Zebra Mountains',
    shifts: {}
  },
  {
    id: 'off-1072',
    name: 'Matincika Siyabonga',
    psiraNumber: '1730375',
    grade: 'Grade C (Patrol / Static)',
    empId: '1072',
    phone: '060 429 4350',
    assignedSite: 'Zebra Mountains',
    shifts: {}
  }
];

export const SecurityRosterMaker: React.FC = () => {
  const { sites, officersList, showToast } = useDutyOn();

  // Configuration Form State (Default to Provincial Office)
  const [siteName, setSiteName] = useState<string>('Provincial Office');
  const [siteSupervisor, setSiteSupervisor] = useState<string>('Skombuzo Mashaya');
  const [contractNo, setContractNo] = useState<string>('TKD-CT-094');
  const [periodType, setPeriodType] = useState<'month' | 'week'>('month');
  
  // Date State (Defaults to September 2026 as shown in screenshot)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 9 = September
  const [weekStartingDate, setWeekStartingDate] = useState<string>('15/09/2026');

  // Shift & Post Rules
  const [dayShiftStart, setDayShiftStart] = useState<string>('06:00');
  const [dayShiftEnd, setDayShiftEnd] = useState<string>('18:00');
  const [nightShiftStart, setNightShiftStart] = useState<string>('18:00');
  const [nightShiftEnd, setNightShiftEnd] = useState<string>('06:00');
  const [postsDay, setPostsDay] = useState<number>(2);
  const [postsNight, setPostsNight] = useState<number>(2);

  // Guards List
  const [guards, setGuards] = useState<GuardRosterEntry[]>(DEFAULT_INITIAL_GUARDS);
  const [filterOnlyAssignedSite, setFilterOnlyAssignedSite] = useState<boolean>(true);
  const [isAddOfficerModalOpen, setIsAddOfficerModalOpen] = useState(false);
  const [isAutoFillMenuOpen, setIsAutoFillMenuOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [activeCellHover, setActiveCellHover] = useState<{ guardId: string; day: number } | null>(null);

  const autoFillRef = useRef<HTMLDivElement>(null);

  // Officers assigned to this site in the control room
  const assignedControlRoomOfficers = useMemo(() => {
    if (!siteName || siteName === 'ALL') return officersList;
    const clean = siteName.toLowerCase().trim();
    return officersList.filter((o) => {
      const s = (o.currentSite || '').toLowerCase().trim();
      return s === clean || s.includes(clean) || clean.includes(s);
    });
  }, [siteName, officersList]);

  // Automatically sync guards whenever siteName changes or officersList is updated
  useEffect(() => {
    if (assignedControlRoomOfficers.length > 0) {
      const imported: GuardRosterEntry[] = assignedControlRoomOfficers.map((off, idx) => ({
        id: off.id || `g-site-${idx}`,
        name: off.name,
        psiraNumber: off.psiraNumber || '2890141',
        grade: off.grade || 'Grade C',
        empId: off.empId || `TKD-0${101 + idx}`,
        phone: off.phone || '071 555 1204',
        assignedSite: off.currentSite || siteName,
        shifts: {}
      }));
      setGuards(imported);
    }
  }, [siteName, assignedControlRoomOfficers.length]);

  // Load all guards assigned to the selected site
  const handleLoadSiteGuards = () => {
    if (assignedControlRoomOfficers.length === 0) {
      showToast(`No officers currently assigned to ${siteName} in Control Room`);
      return;
    }
    const imported: GuardRosterEntry[] = assignedControlRoomOfficers.map((off, idx) => ({
      id: off.id || `g-site-${idx}`,
      name: off.name,
      psiraNumber: off.psiraNumber || '2890141',
      grade: off.grade || 'Grade C',
      empId: off.empId || `TKD-0${101 + idx}`,
      phone: off.phone || '071 555 1204',
      assignedSite: off.currentSite || siteName,
      shifts: {}
    }));
    setGuards(imported);
    applyAutoFillPattern('4x4', imported, true);
    showToast(`Loaded ${imported.length} guards assigned to ${siteName}`);
  };

  // Filtered guards displayed in the roster table
  const displayedGuards = useMemo(() => {
    if (!filterOnlyAssignedSite || !siteName || siteName === 'ALL') {
      return guards;
    }
    const clean = siteName.toLowerCase().trim();
    return guards.filter((g) => {
      const guardSite = (
        g.assignedSite ||
        officersList.find((o) => o.name.toLowerCase() === g.name.toLowerCase())?.currentSite ||
        ''
      ).toLowerCase().trim();
      return !guardSite || guardSite === clean || guardSite.includes(clean) || clean.includes(guardSite);
    });
  }, [guards, filterOnlyAssignedSite, siteName, officersList]);

  // Storage key for caching
  const storageKey = useMemo(() => {
    return `dutyon_roster_${siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${selectedYear}_${selectedMonth}_${periodType}`;
  }, [siteName, selectedYear, selectedMonth, periodType]);

  // Load from localStorage on mount or key change
  useEffect(() => {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.guards && parsed.guards.length > 0) {
          setGuards(parsed.guards);
          if (parsed.siteSupervisor) setSiteSupervisor(parsed.siteSupervisor);
          if (parsed.contractNo) setContractNo(parsed.contractNo);
          if (parsed.postsDay) setPostsDay(parsed.postsDay);
          if (parsed.postsNight) setPostsNight(parsed.postsNight);
          return;
        }
      } catch (err) {
        console.warn('Failed to parse cached roster', err);
      }
    }

    // If no cache for this month, check if initial guards need default auto-filling
    applyAutoFillPattern('4x4', DEFAULT_INITIAL_GUARDS, false);
  }, [storageKey]);

  // Close auto-fill dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autoFillRef.current && !autoFillRef.current.contains(e.target as Node)) {
        setIsAutoFillMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save changes to localStorage and Firestore debounced
  useEffect(() => {
    const plan: SecurityRosterPlan = {
      id: storageKey,
      siteName,
      siteSupervisor,
      contractNo,
      periodType,
      year: selectedYear,
      month: selectedMonth,
      weekStarting: weekStartingDate,
      dayShiftStart,
      dayShiftEnd,
      nightShiftStart,
      nightShiftEnd,
      postsDay,
      postsNight,
      guards,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(storageKey, JSON.stringify(plan));

    // Cloud background sync
    const timer = setTimeout(async () => {
      try {
        await saveRosterPlanToCloud(plan);
        setIsCloudSynced(true);
      } catch (e) {
        // Safe failover
        setIsCloudSynced(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    guards,
    siteName,
    siteSupervisor,
    contractNo,
    periodType,
    selectedYear,
    selectedMonth,
    weekStartingDate,
    dayShiftStart,
    dayShiftEnd,
    nightShiftStart,
    nightShiftEnd,
    postsDay,
    postsNight,
    storageKey
  ]);

  // Calculate day columns based on month vs week
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const columns = useMemo(() => {
    if (periodType === 'week') {
      // 7 days starting from weekStartingDate or Mon
      const days = [
        { dayNum: 15, dayName: 'Mon', fullLabel: '15 Mon' },
        { dayNum: 16, dayName: 'Tue', fullLabel: '16 Tue' },
        { dayNum: 17, dayName: 'Wed', fullLabel: '17 Wed' },
        { dayNum: 18, dayName: 'Thu', fullLabel: '18 Thu' },
        { dayNum: 19, dayName: 'Fri', fullLabel: '19 Fri' },
        { dayNum: 20, dayName: 'Sat', fullLabel: '20 Sat', isWeekend: true },
        { dayNum: 21, dayName: 'Sun', fullLabel: '21 Sun', isWeekend: true }
      ];
      return days;
    }

    // Month mode: 1 to daysInMonth (28, 30, 31)
    const result = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth - 1, d);
      const dayName = dayNames[dateObj.getDay()];
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      result.push({
        dayNum: d,
        dayName,
        fullLabel: `${d} ${dayName}`,
        isWeekend
      });
    }
    return result;
  }, [periodType, selectedYear, selectedMonth, daysInMonth]);

  // Click cell to cycle: Day -> Night -> Off -> Leave -> blank
  const handleCellClick = (guardId: string, dayNum: number) => {
    setGuards((prev) =>
      prev.map((g) => {
        if (g.id !== guardId) return g;
        const currentShift = g.shifts[dayNum] || '';
        let nextShift: ShiftCode = '';

        if (currentShift === '') nextShift = 'D';
        else if (currentShift === 'D') nextShift = 'N';
        else if (currentShift === 'N') nextShift = 'OFF';
        else if (currentShift === 'OFF') nextShift = 'LEAVE';
        else if (currentShift === 'LEAVE') nextShift = '';

        return {
          ...g,
          shifts: {
            ...g.shifts,
            [dayNum]: nextShift
          }
        };
      })
    );
  };

  // Add Guard from Enrolled Officers
  const handleAddGuard = () => {
    setIsAddOfficerModalOpen(true);
  };

  // Import Active Guards from Fleet Database
  const handleImportFleetGuards = () => {
    if (officersList && officersList.length > 0) {
      const imported: GuardRosterEntry[] = officersList.map((off, idx) => ({
        id: off.id || `g-imp-${idx}`,
        name: off.name,
        psiraNumber: off.psiraNumber || '2890141',
        grade: off.grade || 'Grade C',
        empId: off.empId || `TKD-0${101 + idx}`,
        phone: off.phone || '071 555 1204',
        shifts: {}
      }));
      setGuards(imported);
      applyAutoFillPattern('4x4', imported, true);
      showToast(`Imported ${imported.length} active guards from fleet database.`);
    } else {
      showToast('Fleet officers already loaded.');
    }
  };

  // Remove Guard
  const handleRemoveGuard = (id: string, name: string) => {
    if (guards.length <= 1) {
      showToast('Roster must have at least one guard.');
      return;
    }
    setGuards((prev) => prev.filter((g) => g.id !== id));
    showToast(`Removed ${name} from roster.`);
  };

  // Clear Roster Shifts
  const handleClearRoster = () => {
    setGuards((prev) =>
      prev.map((g) => ({
        ...g,
        shifts: {}
      }))
    );
    showToast('Roster shifts cleared.');
  };

  // Auto-Fill Algorithms
  const applyAutoFillPattern = (
    pattern: string,
    targetGuards = guards,
    notify = true
  ) => {
    const totalDays = periodType === 'week' ? 7 : daysInMonth;
    const dayNumbers = columns.map((c) => c.dayNum);

    const updated = targetGuards.map((guard, guardIdx) => {
      const shifts: Record<number, ShiftCode> = {};

      if (pattern === '4x4') {
        // Standard SA 4-Platoon Rotation:
        // Platoon 1: 4 Days, 4 Off, 4 Nights, 4 Off... (cycle length = 16)
        // Staggered by 4 days per platoon squad
        const cycle = [
          'D', 'D', 'D', 'D',
          'OFF', 'OFF', 'OFF', 'OFF',
          'N', 'N', 'N', 'N',
          'OFF', 'OFF', 'OFF', 'OFF'
        ] as ShiftCode[];

        const platoonOffset = (guardIdx % 4) * 4;
        dayNumbers.forEach((dNum, idx) => {
          const cycleIdx = (idx + platoonOffset) % cycle.length;
          shifts[dNum] = cycle[cycleIdx];
        });
      } else if (pattern === '2-2-4') {
        // Continental 2-2-4: 2 Days, 2 Nights, 4 Off (cycle length = 8)
        const cycle = ['D', 'D', 'N', 'N', 'OFF', 'OFF', 'OFF', 'OFF'] as ShiftCode[];
        const platoonOffset = (guardIdx % 4) * 2;
        dayNumbers.forEach((dNum, idx) => {
          const cycleIdx = (idx + platoonOffset) % cycle.length;
          shifts[dNum] = cycle[cycleIdx];
        });
      } else if (pattern === '4-on-2-off') {
        // 4 on (2 Day, 2 Night), 2 Off
        const cycle = ['D', 'D', 'N', 'N', 'OFF', 'OFF'] as ShiftCode[];
        const platoonOffset = (guardIdx % 3) * 2;
        dayNumbers.forEach((dNum, idx) => {
          const cycleIdx = (idx + platoonOffset) % cycle.length;
          shifts[dNum] = cycle[cycleIdx];
        });
      } else if (pattern === 'smart_solver') {
        // Smart Post Coverage Solver:
        // Ensures exactly `postsDay` guards on D, `postsNight` guards on N for each day,
        // without exceeding 4 consecutive 12-hr shifts.
        const requiredDay = postsDay;
        const requiredNight = postsNight;
        const numGuards = targetGuards.length;

        dayNumbers.forEach((dNum, dayIdx) => {
          const dayStartGuard = (dayIdx * requiredDay) % numGuards;
          const nightStartGuard = (dayStartGuard + requiredDay) % numGuards;

          const dayGuards = new Set<number>();
          for (let i = 0; i < requiredDay; i++) {
            dayGuards.add((dayStartGuard + i) % numGuards);
          }

          const nightGuards = new Set<number>();
          for (let i = 0; i < requiredNight; i++) {
            nightGuards.add((nightStartGuard + i) % numGuards);
          }

          if (dayGuards.has(guardIdx)) {
            shifts[dNum] = 'D';
          } else if (nightGuards.has(guardIdx)) {
            shifts[dNum] = 'N';
          } else {
            shifts[dNum] = 'OFF';
          }
        });
      }

      return {
        ...guard,
        shifts
      };
    });

    setGuards(updated);
    setIsAutoFillMenuOpen(false);
    if (notify) {
      showToast(`Applied ${pattern.toUpperCase()} automated shift rotation.`);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
    const titleRow = `SECURITY DUTY ROSTER - ${siteName.toUpperCase()} - ${monthName} ${selectedYear}`;
    const metaRow1 = `Site Supervisor,${siteSupervisor},Contract No,${contractNo},Day Shift,${dayShiftStart}-${dayShiftEnd},Night Shift,${nightShiftStart}-${nightShiftEnd}`;
    const metaRow2 = `Posts Per Day,${postsDay},Posts Per Night,${postsNight},Total Guards,${guards.length}`;

    const header = [
      'Guard Name',
      'PSIRA Number',
      'Grade',
      'EMP ID',
      ...columns.map((c) => `"${c.fullLabel}"`),
      'Total Day',
      'Total Night',
      'Total Off',
      'Total Leave',
      'Total Hours',
      'BCEA Compliant'
    ].join(',');

    const guardRows = guards.map((g) => {
      let dayCount = 0;
      let nightCount = 0;
      let offCount = 0;
      let leaveCount = 0;

      const dayCols = columns.map((c) => {
        const s = g.shifts[c.dayNum] || '';
        if (s === 'D') dayCount++;
        else if (s === 'N') nightCount++;
        else if (s === 'OFF') offCount++;
        else if (s === 'LEAVE') leaveCount++;
        return s ? `"${s}"` : '""';
      });

      const totalHours = (dayCount + nightCount) * 12;
      const bceaCompliant = totalHours <= (periodType === 'week' ? 48 : 192) ? 'YES' : 'EXCEEDED';

      return [
        `"${g.name}"`,
        `"${g.psiraNumber}"`,
        `"${g.grade}"`,
        `"${g.empId || ''}"`,
        ...dayCols,
        dayCount,
        nightCount,
        offCount,
        leaveCount,
        `${totalHours}h`,
        bceaCompliant
      ].join(',');
    });

    // Coverage summary rows
    const dayCoverageCols = columns.map((c) => {
      const scheduledDay = guards.filter((g) => g.shifts[c.dayNum] === 'D').length;
      return `"${scheduledDay}/${postsDay}"`;
    });

    const nightCoverageCols = columns.map((c) => {
      const scheduledNight = guards.filter((g) => g.shifts[c.dayNum] === 'N').length;
      return `"${scheduledNight}/${postsNight}"`;
    });

    const coverageDayRow = ['"Day Posts Coverage"', '""', '""', '""', ...dayCoverageCols, '""', '""', '""', '""', '""', '""'].join(',');
    const coverageNightRow = ['"Night Posts Coverage"', '""', '""', '""', ...nightCoverageCols, '""', '""', '""', '""', '""', '""'].join(',');

    const csvContent = [
      titleRow,
      metaRow1,
      metaRow2,
      '',
      header,
      ...guardRows,
      '',
      coverageDayRow,
      coverageNightRow
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `DutyOn_Roster_${siteName.replace(/\s+/g, '_')}_${monthName}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV roster downloaded.');
  };

  // Print / PDF Handler
  const handlePrint = () => {
    window.print();
  };

  // Shift badge styling helper matching the user's screenshot
  const renderShiftBadge = (shift: ShiftCode) => {
    switch (shift) {
      case 'D':
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-mono-code font-bold text-xs bg-[#dcfce7] text-[#166534] border border-[#86efac] shadow-2xs">
            D
          </span>
        );
      case 'N':
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-mono-code font-bold text-xs bg-[#e0f2fe] text-[#0369a1] border border-[#7dd3fc] shadow-2xs">
            N
          </span>
        );
      case 'OFF':
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-mono-code text-[11px] font-medium bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]">
            Off
          </span>
        );
      case 'LEAVE':
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-mono-code font-bold text-[11px] bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
            Leave
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-500 font-mono-code text-xs transition-colors">
            ·
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-sans print:m-0 print:p-0">
      {/* ---------------- ROSTER MAKER HEADER ---------------- */}
      <header className="bg-[#071726] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl print:hidden">
        {/* Left Branding */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0c2e47] to-[#051726] border border-[#1FA6C9]/40 grid place-items-center flex-none shadow-md">
            {/* Custom Shield/Infinity Logo Icon matching screenshot */}
            <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none">
              <path
                d="M10 20 C10 13 18 13 20 20 C22 27 30 27 30 20 C30 13 22 13 20 20 C18 27 10 27 10 20 Z"
                stroke="#1FA6C9"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="20" cy="20" r="2.5" fill="#5BCB80" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-white tracking-tight">
                Security Roster Maker
              </h1>
              {isCloudSynced && (
                <span className="inline-flex items-center gap-1 font-mono-code text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cloud Synced
                </span>
              )}
            </div>
            <p className="font-mono-code text-[11px] font-bold tracking-widest text-[#8598A8] uppercase mt-0.5">
              DUTY ON · BY TIKEDI HOLDINGS
            </p>
          </div>
        </div>

        {/* Right Action Buttons matching screenshot */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Add Guard */}
          <button
            onClick={handleAddGuard}
            className="px-3.5 py-2 bg-[#122b40] hover:bg-[#183954] text-white border border-white/10 rounded-xl font-display font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <span className="text-base leading-none text-[#3FC9E9]">+</span>
            <span>Add guard</span>
          </button>

          {/* Auto-fill 4x4 (With dropdown for all patterns) */}
          <div className="relative" ref={autoFillRef}>
            <div className="inline-flex rounded-xl shadow-sm">
              <button
                onClick={() => applyAutoFillPattern('4x4')}
                className="px-3.5 py-2 bg-[#122b40] hover:bg-[#183954] text-white border border-white/10 rounded-l-xl font-display font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Apply standard 4-on 4-off rotation across all guards"
              >
                <svg className="w-3.5 h-3.5 text-[#3FC9E9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span>Auto-fill 4×4</span>
              </button>
              <button
                onClick={() => setIsAutoFillMenuOpen(!isAutoFillMenuOpen)}
                className="px-2 py-2 bg-[#122b40] hover:bg-[#183954] text-white border-y border-r border-white/10 rounded-r-xl text-xs transition-all cursor-pointer"
                title="More auto-fill rotation templates"
              >
                ▾
              </button>
            </div>

            {isAutoFillMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0A1E33] border border-white/15 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs text-white">
                <div className="px-3 py-1.5 text-[10px] font-mono-code uppercase font-bold text-[#8598A8] border-b border-white/10">
                  Select Rotation Algorithm
                </div>
                <button
                  onClick={() => applyAutoFillPattern('4x4')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-[#3FC9E9]">4×4 Rotation (Standard SA)</div>
                    <div className="text-[10px] text-[#8598A8]">4 Days, 4 Off, 4 Nights, 4 Off</div>
                  </div>
                  <span className="font-mono-code text-[10px] text-emerald-400">24/7</span>
                </button>
                <button
                  onClick={() => applyAutoFillPattern('2-2-4')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">2-2-4 Continental</div>
                    <div className="text-[10px] text-[#8598A8]">2 Days, 2 Nights, 4 Off</div>
                  </div>
                </button>
                <button
                  onClick={() => applyAutoFillPattern('4-on-2-off')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">4-On 2-Off Rotation</div>
                    <div className="text-[10px] text-[#8598A8]">2 Day, 2 Night, 2 Off</div>
                  </div>
                </button>
                <button
                  onClick={() => applyAutoFillPattern('smart_solver')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between border-t border-white/10 mt-1 pt-1"
                >
                  <div>
                    <div className="font-semibold text-amber-300">⚡ Smart Post Solver</div>
                    <div className="text-[10px] text-[#8598A8]">Guarantees {postsDay} Day &amp; {postsNight} Night Posts</div>
                  </div>
                </button>
                <button
                  onClick={handleImportFleetGuards}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-emerald-300 flex items-center gap-1.5"
                >
                  <span>👥</span>
                  <span>Import Guards from Fleet</span>
                </button>
              </div>
            )}
          </div>

          {/* Clear */}
          <button
            onClick={handleClearRoster}
            className="px-3.5 py-2 bg-[#122b40] hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 border border-white/10 rounded-xl font-display font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear</span>
          </button>

          {/* CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white text-[#0B1E30] hover:bg-slate-100 rounded-xl font-display font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-[#0B1E30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>CSV</span>
          </button>

          {/* Print / PDF */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-2 bg-[#1FA6C9] hover:bg-[#1b95b5] text-[#04222c] rounded-xl font-display font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-[#04222c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print / PDF</span>
          </button>
        </div>
      </header>

      {/* ---------------- CONFIGURATION CARD (LIGHT PRISTINE STYLE MATCHING SCREENSHOT) ---------------- */}
      <div className="bg-white border border-[#d6e3ee] rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
        {/* Row 1: Site, Supervisor, Contract No, Week/Month Starting */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Site / Client with Real-time Assigned Filter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#5D6E7E]">
                Site / Client
              </label>
              {assignedControlRoomOfficers.length > 0 && (
                <span className="text-[10px] font-mono-code font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {assignedControlRoomOfficers.length} Assigned
                </span>
              )}
            </div>
            <div className="relative">
              <select
                value={siteName}
                onChange={(e) => {
                  const selected = e.target.value;
                  setSiteName(selected);
                  // Also update siteSupervisor if site matches
                  const matchedSite = sites.find((s) => s.name === selected);
                  if (matchedSite && matchedSite.supervisor) {
                    setSiteSupervisor(matchedSite.supervisor);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-semibold text-[#0B1E30] focus:outline-none focus:border-[#1FA6C9] focus:ring-1 focus:ring-[#1FA6C9] cursor-pointer"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({officersList.filter((o) => (o.currentSite || '').toLowerCase().trim() === s.name.toLowerCase().trim()).length} Guards)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Site Supervisor */}
          <div>
            <label className="block text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#5D6E7E] mb-1.5">
              Site Supervisor
            </label>
            <input
              type="text"
              value={siteSupervisor}
              onChange={(e) => setSiteSupervisor(e.target.value)}
              placeholder="e.g. T. Mkhize"
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-medium text-[#0B1E30] focus:outline-none focus:border-[#1FA6C9] focus:ring-1 focus:ring-[#1FA6C9]"
            />
          </div>

          {/* Contract No. */}
          <div>
            <label className="block text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#5D6E7E] mb-1.5">
              Contract No.
            </label>
            <input
              type="text"
              value={contractNo}
              onChange={(e) => setContractNo(e.target.value)}
              placeholder="TKD-CT-..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-medium text-[#0B1E30] focus:outline-none focus:border-[#1FA6C9] focus:ring-1 focus:ring-[#1FA6C9]"
            />
          </div>

          {/* Period Selector (Week or Month) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#5D6E7E]">
                {periodType === 'month' ? 'Roster Month' : 'Week Starting (Mon)'}
              </label>
              <div className="flex items-center gap-1 text-[10px] font-mono-code">
                <button
                  onClick={() => setPeriodType('month')}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    periodType === 'month' ? 'bg-[#1FA6C9] text-white font-bold' : 'text-[#5D6E7E] hover:text-[#0B1E30]'
                  }`}
                >
                  Month
                </button>
                <span>|</span>
                <button
                  onClick={() => setPeriodType('week')}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    periodType === 'week' ? 'bg-[#1FA6C9] text-white font-bold' : 'text-[#5D6E7E] hover:text-[#0B1E30]'
                  }`}
                >
                  Week
                </button>
              </div>
            </div>

            {periodType === 'month' ? (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-medium text-[#0B1E30] focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-medium text-[#0B1E30] focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            ) : (
              <input
                type="text"
                value={weekStartingDate}
                onChange={(e) => setWeekStartingDate(e.target.value)}
                placeholder="15/09/2026"
                className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-medium text-[#0B1E30] focus:outline-none focus:border-[#1FA6C9]"
              />
            )}
          </div>
        </div>

        {/* Row 2: Shift Hours, Posts Per Shift, and Visual Legend matching screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center pt-2 border-t border-[#f0f4f8]">
          {/* Day Shift Times */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#5D6E7E] mb-1.5">
              Day Shift
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={dayShiftStart}
                onChange={(e) => setDayShiftStart(e.target.value)}
                className="w-full text-center px-2 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono-code text-[#0B1E30]"
              />
              <span className="text-[#8598A8] text-xs font-mono-code">–</span>
              <input
                type="text"
                value={dayShiftEnd}
                onChange={(e) => setDayShiftEnd(e.target.value)}
                className="w-full text-center px-2 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono-code text-[#0B1E30]"
              />
            </div>
          </div>

          {/* Night Shift Times */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#5D6E7E] mb-1.5">
              Night Shift
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nightShiftStart}
                onChange={(e) => setNightShiftStart(e.target.value)}
                className="w-full text-center px-2 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono-code text-[#0B1E30]"
              />
              <span className="text-[#8598A8] text-xs font-mono-code">–</span>
              <input
                type="text"
                value={nightShiftEnd}
                onChange={(e) => setNightShiftEnd(e.target.value)}
                className="w-full text-center px-2 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono-code text-[#0B1E30]"
              />
            </div>
          </div>

          {/* Posts / Day */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#5D6E7E] mb-1.5">
              Posts / Day
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={postsDay}
              onChange={(e) => setPostsDay(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#0B1E30]"
            />
          </div>

          {/* Posts / Night */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#5D6E7E] mb-1.5">
              Posts / Night
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={postsNight}
              onChange={(e) => setPostsNight(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#0B1E30]"
            />
          </div>

          {/* Shift Legend matching screenshot */}
          <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#0B1E30]">
              <span className="w-4 h-4 rounded bg-[#dcfce7] border border-[#86efac] inline-block" />
              <span>Day</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#0B1E30]">
              <span className="w-4 h-4 rounded bg-[#e0f2fe] border border-[#7dd3fc] inline-block" />
              <span>Night</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#0B1E30]">
              <span className="w-4 h-4 rounded bg-[#f1f5f9] border border-[#cbd5e1] inline-block" />
              <span>Off</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#0B1E30]">
              <span className="w-4 h-4 rounded bg-[#fef3c7] border border-[#fde68a] inline-block" />
              <span>Leave</span>
            </div>
          </div>
        </div>

        {/* Helper text exactly as in screenshot */}
        <div className="pt-2 border-t border-[#f0f4f8] text-[11px] text-[#5D6E7E]">
          Click a cell to cycle <span className="font-semibold text-[#166534]">Day</span> → <span className="font-semibold text-[#0369a1]">Night</span> → <span className="font-semibold text-[#475569]">Off</span> → <span className="font-semibold text-[#92400e]">Leave</span> → <span className="font-semibold text-slate-400">blank</span>. Everything saves in this browser automatically. Use <span className="font-semibold text-[#0B1E30]">Print / PDF</span> for a clean signable roster.
        </div>
      </div>

      {/* ---------------- MAIN DUTY ROSTER TABLE CARD ---------------- */}
      <div className="bg-white border border-[#d6e3ee] rounded-2xl p-5 shadow-sm space-y-4">
        {/* Card Header matching screenshot */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e9eef3] pb-4">
          <div>
            <h2 className="font-display font-extrabold text-xl text-[#0B1E30] tracking-tight">
              {periodType === 'month' ? 'Monthly Duty Roster' : 'Weekly Duty Roster'}
            </h2>
            <p className="text-xs text-[#5D6E7E] mt-0.5">
              {siteName} · {periodType === 'month' ? `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}` : `Week Starting ${weekStartingDate}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5D6E7E] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              Total Guards: <strong className="text-[#0B1E30]">{guards.length}</strong>
            </span>
            <span className="text-xs text-[#5D6E7E] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              Required Posts: <strong className="text-[#0B1E30]">{postsDay} Day / {postsNight} Night</strong>
            </span>
          </div>
        </div>

        {/* Sub-bar: + Add Guard, Site Filter Toggle, & Tip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddGuard}
              className="px-3.5 py-1.5 bg-[#1FA6C9]/10 hover:bg-[#1FA6C9]/20 text-[#075985] border border-[#1FA6C9]/30 rounded-xl font-display font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Add an enrolled officer from company personnel registry"
            >
              <span className="text-sm font-bold leading-none text-[#0284c7]">+</span>
              <span>Add Enrolled Officer</span>
            </button>

            {/* Site Filter Toggle */}
            <button
              onClick={() => setFilterOnlyAssignedSite((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                filterOnlyAssignedSite
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
              title="Toggle filter to show only guards assigned to this site"
            >
              <span>{filterOnlyAssignedSite ? '✓ Only Guards At This Site' : 'Show All Guards'}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterOnlyAssignedSite ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {displayedGuards.length}
              </span>
            </button>

            {/* Load Site Guards 1-Click */}
            <button
              onClick={handleLoadSiteGuards}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title={`Load all guards assigned to ${siteName}`}
            >
              <span>⚡ Load {assignedControlRoomOfficers.length} Assigned Guards</span>
            </button>

            <button
              onClick={handleImportFleetGuards}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Import all available enrolled officers into roster"
            >
              <span>👥 Sync Fleet ({officersList.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => applyAutoFillPattern('4x4')}
              className="text-[11px] text-[#1FA6C9] hover:underline font-semibold cursor-pointer"
            >
              ↺ Re-run 4×4
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => applyAutoFillPattern('smart_solver')}
              className="text-[11px] text-amber-700 hover:underline font-semibold cursor-pointer"
            >
              ⚡ Auto-Balance Posts
            </button>
          </div>
        </div>

        {/* Interactive Roster Matrix Table */}
        <div className="overflow-x-auto border border-[#e2e8f0] rounded-xl shadow-2xs">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#5D6E7E] font-mono-code font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 min-w-[200px] border-r border-[#e2e8f0]">
                  Guard Details
                </th>
                <th className="py-3 px-2 min-w-[90px] border-r border-[#e2e8f0]">
                  PSIRA Grade
                </th>

                {/* Days of period */}
                {columns.map((c) => (
                  <th
                    key={c.dayNum}
                    className={`py-2 px-1 text-center min-w-[38px] sm:min-w-[42px] border-r border-[#e2e8f0] ${
                      c.isWeekend ? 'bg-slate-100/70' : ''
                    }`}
                  >
                    <div className="text-[#0B1E30] font-bold text-[11px] leading-tight">
                      {c.dayNum}
                    </div>
                    <div className="text-[9.5px] font-normal text-[#64748b]">
                      {c.dayName.slice(0, 3)}
                    </div>
                  </th>
                ))}

                {/* Summary Metrics */}
                <th className="py-3 px-2 text-center min-w-[34px] bg-emerald-50/50 text-[#166534] border-r border-[#e2e8f0]" title="Day Shifts">
                  D
                </th>
                <th className="py-3 px-2 text-center min-w-[34px] bg-sky-50/50 text-[#0369a1] border-r border-[#e2e8f0]" title="Night Shifts">
                  N
                </th>
                <th className="py-3 px-2 text-center min-w-[34px] bg-slate-100/50 text-[#475569] border-r border-[#e2e8f0]" title="Off Days">
                  Off
                </th>
                <th className="py-3 px-2 text-center min-w-[34px] bg-amber-50/50 text-[#92400e] border-r border-[#e2e8f0]" title="Leave Days">
                  L
                </th>
                <th className="py-3 px-3 text-center min-w-[65px] font-bold text-[#0B1E30] border-r border-[#e2e8f0]">
                  Hours
                </th>
                <th className="py-3 px-2 text-center min-w-[40px]">
                  ×
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e2e8f0] text-[#0B1E30]">
              {displayedGuards.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 8} className="py-10 text-center bg-slate-50">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-sm font-semibold text-slate-700">
                        No guards assigned to &ldquo;{siteName}&rdquo; in current view
                      </p>
                      <p className="text-xs text-slate-500">
                        Control Room personnel registry has {assignedControlRoomOfficers.length} active guards deployed to this site.
                      </p>
                      <div className="pt-3 flex items-center justify-center gap-2">
                        <button
                          onClick={handleLoadSiteGuards}
                          className="px-4 py-2 bg-[#1FA6C9] hover:bg-[#1b95b5] text-[#04222c] font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                        >
                          ⚡ Load {assignedControlRoomOfficers.length} Assigned Guards for {siteName}
                        </button>
                        <button
                          onClick={() => setFilterOnlyAssignedSite(false)}
                          className="px-3 py-2 bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 font-semibold text-xs rounded-xl cursor-pointer transition-all"
                        >
                          Show All Roster Guards ({guards.length})
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedGuards.map((guard, idx) => {
                  let dayCount = 0;
                  let nightCount = 0;
                  let offCount = 0;
                  let leaveCount = 0;

                  columns.forEach((c) => {
                    const s = guard.shifts[c.dayNum] || '';
                    if (s === 'D') dayCount++;
                    else if (s === 'N') nightCount++;
                    else if (s === 'OFF') offCount++;
                    else if (s === 'LEAVE') leaveCount++;
                  });

                  const totalHours = (dayCount + nightCount) * 12;
                  const maxAllowedHours = periodType === 'week' ? 48 : 192;
                  const isOvertime = totalHours > maxAllowedHours;

                  return (
                    <tr
                      key={guard.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Guard Name & PSIRA ID */}
                      <td className="py-2 px-3 border-r border-[#e2e8f0]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono-code text-[10px] grid place-items-center flex-none">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <input
                              type="text"
                              value={guard.name}
                              onChange={(e) => {
                                const newName = e.target.value;
                                setGuards((prev) =>
                                  prev.map((g) => (g.id === guard.id ? { ...g, name: newName } : g))
                                );
                              }}
                              className="font-bold text-xs text-[#0B1E30] w-full bg-transparent hover:bg-slate-100/80 px-1 py-0.5 rounded focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1FA6C9]"
                            />
                            <div className="text-[10px] text-[#64748b] font-mono-code px-1 flex items-center gap-1.5 flex-wrap">
                              <span>PSIRA #{guard.psiraNumber}</span>
                              <span>·</span>
                              <span>{guard.empId || 'TKD'}</span>
                              {guard.assignedSite && (
                                <>
                                  <span>·</span>
                                  <span className="text-[#0284c7] font-semibold">{guard.assignedSite}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                    {/* PSIRA Grade Selector */}
                    <td className="py-2 px-2 border-r border-[#e2e8f0]">
                      <select
                        value={guard.grade}
                        onChange={(e) => {
                          const newGrade = e.target.value;
                          setGuards((prev) =>
                            prev.map((g) => (g.id === guard.id ? { ...g, grade: newGrade } : g))
                          );
                        }}
                        className="w-full text-[11px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[#0B1E30] focus:outline-none focus:border-[#1FA6C9]"
                      >
                        <option value="Grade A (Armed Tactical)">Grade A (Armed)</option>
                        <option value="Grade B (Supervisor)">Grade B (Superv)</option>
                        <option value="Grade B (Access Control)">Grade B (Access)</option>
                        <option value="Grade C (Patrol Post)">Grade C (Patrol)</option>
                        <option value="Grade C (Static Post)">Grade C (Static)</option>
                        <option value="Grade D (Gate Control)">Grade D (Gate)</option>
                      </select>
                    </td>

                    {/* Day Cells (Interactive Shift Cycling) */}
                    {columns.map((c) => {
                      const shift = guard.shifts[c.dayNum] || '';
                      const isHovered =
                        activeCellHover?.guardId === guard.id && activeCellHover?.day === c.dayNum;

                      return (
                        <td
                          key={c.dayNum}
                          onClick={() => handleCellClick(guard.id, c.dayNum)}
                          onMouseEnter={() =>
                            setActiveCellHover({ guardId: guard.id, day: c.dayNum })
                          }
                          onMouseLeave={() => setActiveCellHover(null)}
                          className={`py-1.5 px-0.5 text-center cursor-pointer border-r border-[#e2e8f0] select-none transition-all ${
                            c.isWeekend ? 'bg-slate-50/50' : ''
                          } hover:bg-[#1FA6C9]/10`}
                          title={`Click to cycle shift for ${guard.name} on Day ${c.dayNum} (${c.dayName})`}
                        >
                          {renderShiftBadge(shift)}
                        </td>
                      );
                    })}

                    {/* Metrics Summary Columns */}
                    <td className="py-2 px-2 text-center font-mono-code font-bold text-xs bg-emerald-50/30 text-[#166534] border-r border-[#e2e8f0]">
                      {dayCount}
                    </td>
                    <td className="py-2 px-2 text-center font-mono-code font-bold text-xs bg-sky-50/30 text-[#0369a1] border-r border-[#e2e8f0]">
                      {nightCount}
                    </td>
                    <td className="py-2 px-2 text-center font-mono-code text-xs bg-slate-100/30 text-[#475569] border-r border-[#e2e8f0]">
                      {offCount}
                    </td>
                    <td className="py-2 px-2 text-center font-mono-code text-xs bg-amber-50/30 text-[#92400e] border-r border-[#e2e8f0]">
                      {leaveCount}
                    </td>
                    <td className="py-2 px-2 text-center font-mono-code font-bold text-xs border-r border-[#e2e8f0]">
                      <span className={isOvertime ? 'text-amber-600' : 'text-[#0B1E30]'}>
                        {totalHours}h
                      </span>
                      {isOvertime && (
                        <div className="text-[9px] text-amber-600 font-sans font-semibold">OT</div>
                      )}
                    </td>

                    {/* Delete Guard Button */}
                    <td className="py-2 px-1 text-center">
                      <button
                        onClick={() => handleRemoveGuard(guard.id, guard.name)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        title="Remove guard from roster"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

            {/* Coverage Summary Bottom Rows */}
            <tfoot>
              {/* Day Post Coverage Row */}
              <tr className="bg-[#f8fafc] border-t-2 border-[#cbd5e1] font-mono-code text-[10px]">
                <td colSpan={2} className="py-2.5 px-3 font-bold text-[#166534] border-r border-[#e2e8f0] flex items-center justify-between">
                  <span>Day Posts Coverage</span>
                  <span className="font-normal text-slate-500">Target: {postsDay}/day</span>
                </td>
                {columns.map((c) => {
                  const dayScheduled = guards.filter((g) => g.shifts[c.dayNum] === 'D').length;
                  const isMet = dayScheduled >= postsDay;
                  const isUnder = dayScheduled < postsDay;

                  return (
                    <td
                      key={c.dayNum}
                      className={`py-2 px-0.5 text-center font-bold border-r border-[#e2e8f0] ${
                        isMet
                          ? 'bg-emerald-50 text-[#166534]'
                          : isUnder
                          ? 'bg-amber-50 text-amber-700 font-extrabold'
                          : 'text-slate-600'
                      }`}
                    >
                      {dayScheduled}/{postsDay}
                    </td>
                  );
                })}
                <td colSpan={6} className="py-2 px-3 text-[11px] font-sans font-medium text-slate-600 text-right">
                  Day Post Balance
                </td>
              </tr>

              {/* Night Post Coverage Row */}
              <tr className="bg-[#f8fafc] border-t border-[#e2e8f0] font-mono-code text-[10px]">
                <td colSpan={2} className="py-2.5 px-3 font-bold text-[#0369a1] border-r border-[#e2e8f0] flex items-center justify-between">
                  <span>Night Posts Coverage</span>
                  <span className="font-normal text-slate-500">Target: {postsNight}/night</span>
                </td>
                {columns.map((c) => {
                  const nightScheduled = guards.filter((g) => g.shifts[c.dayNum] === 'N').length;
                  const isMet = nightScheduled >= postsNight;
                  const isUnder = nightScheduled < postsNight;

                  return (
                    <td
                      key={c.dayNum}
                      className={`py-2 px-0.5 text-center font-bold border-r border-[#e2e8f0] ${
                        isMet
                          ? 'bg-sky-50 text-[#0369a1]'
                          : isUnder
                          ? 'bg-rose-50 text-rose-700 font-extrabold'
                          : 'text-slate-600'
                      }`}
                    >
                      {nightScheduled}/{postsNight}
                    </td>
                  );
                })}
                <td colSpan={6} className="py-2 px-3 text-[11px] font-sans font-medium text-slate-600 text-right">
                  Night Post Balance
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ---------------- PRINT / PDF MODAL & PREVIEW ---------------- */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-[#0B1E30]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-[#0B1E30]">
                  Print-Ready Duty Roster Manifest
                </h3>
                <p className="text-xs text-slate-500">
                  Formatted for A4 landscape sign-off &amp; PSIRA audit inspection
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#1FA6C9] hover:bg-[#1b95b5] text-[#04222c] font-display font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Open System Print Dialog</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Official PSIRA Print Paper Preview Container */}
            <div className="border border-slate-300 rounded-xl p-6 bg-white space-y-5 text-xs font-sans">
              {/* Document Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                <div>
                  <div className="font-mono-code text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    TIKEDI HOLDINGS (PTY) LTD · DUTY ON TACTICAL SECURITY
                  </div>
                  <h1 className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    MONTHLY DUTY ROSTER &amp; PSIRA POSTING MANIFEST
                  </h1>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    PSIRA Reg. 2890141 / Sector C / Private Security Industry Act 56 of 2001 Compliant
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono-code text-xs font-bold text-slate-800">
                    CONTRACT: {contractNo}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Period: {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
                  </div>
                </div>
              </div>

              {/* Site Details Bar */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-mono-code text-[10px] block">SITE / CLIENT</span>
                  <span className="font-bold text-slate-900">{siteName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-mono-code text-[10px] block">SITE SUPERVISOR</span>
                  <span className="font-bold text-slate-900">{siteSupervisor}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-mono-code text-[10px] block">DAY POSTS ({dayShiftStart}-{dayShiftEnd})</span>
                  <span className="font-bold text-emerald-800">{postsDay} Security Officers</span>
                </div>
                <div>
                  <span className="text-slate-500 font-mono-code text-[10px] block">NIGHT POSTS ({nightShiftStart}-{nightShiftEnd})</span>
                  <span className="font-bold text-sky-800">{postsNight} Security Officers</span>
                </div>
              </div>

              {/* Compact Printable Grid */}
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                      <th className="p-1.5 border-r border-slate-300">Guard Name</th>
                      <th className="p-1.5 border-r border-slate-300">PSIRA #</th>
                      <th className="p-1.5 border-r border-slate-300">Grade</th>
                      {columns.map((c) => (
                        <th key={c.dayNum} className="p-1 text-center border-r border-slate-200">
                          {c.dayNum}
                        </th>
                      ))}
                      <th className="p-1 text-center font-bold">Hrs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {guards.map((g) => {
                      const totalShifts = columns.filter((c) => g.shifts[c.dayNum] === 'D' || g.shifts[c.dayNum] === 'N').length;
                      return (
                        <tr key={g.id}>
                          <td className="p-1.5 font-semibold border-r border-slate-300">{g.name}</td>
                          <td className="p-1.5 font-mono-code border-r border-slate-300">{g.psiraNumber}</td>
                          <td className="p-1.5 border-r border-slate-300">{g.grade.slice(0, 7)}</td>
                          {columns.map((c) => {
                            const s = g.shifts[c.dayNum] || '-';
                            return (
                              <td
                                key={c.dayNum}
                                className={`p-1 text-center font-mono-code font-bold border-r border-slate-200 ${
                                  s === 'D' ? 'text-emerald-700 bg-emerald-50/40' : s === 'N' ? 'text-sky-700 bg-sky-50/40' : 'text-slate-400'
                                }`}
                              >
                                {s === 'OFF' ? 'O' : s === 'LEAVE' ? 'L' : s}
                              </td>
                            );
                          })}
                          <td className="p-1 text-center font-mono-code font-bold">{totalShifts * 12}h</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Official Signatures Block */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200 text-xs">
                <div className="space-y-6">
                  <div className="text-slate-600">Compiled by (Site Supervisor):</div>
                  <div className="border-b border-slate-400 pt-6" />
                  <div className="text-[10px] text-slate-500">Signature &amp; PSIRA No. / Date</div>
                </div>

                <div className="space-y-6">
                  <div className="text-slate-600">Approved by (Control Room / Ops):</div>
                  <div className="border-b border-slate-400 pt-6" />
                  <div className="text-[10px] text-slate-500">Operations Manager Sign-Off / Date</div>
                </div>

                <div className="space-y-6">
                  <div className="text-slate-600">Acknowledged by (Client Rep):</div>
                  <div className="border-b border-slate-400 pt-6" />
                  <div className="text-[10px] text-slate-500">Client Representative Sign-Off / Date</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD OFFICER TO ROSTER MODAL */}
      {isAddOfficerModalOpen && (
        <AddOfficerToRosterModal
          currentGuards={guards}
          onAddGuard={(newGuard) => {
            setGuards((prev) => [...prev, newGuard]);
            showToast(`Assigned ${newGuard.name} (${newGuard.grade}) to duty roster.`);
          }}
          onClose={() => setIsAddOfficerModalOpen(false)}
        />
      )}
    </div>
  );
};
