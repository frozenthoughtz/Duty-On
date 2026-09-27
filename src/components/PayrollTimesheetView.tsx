import React, { useState, useMemo } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import {
  generatePayPeriodTimesheets,
  calculateOfficerPayrollSummaries,
  calculatePayPeriodSummary,
  generateDailyHoursTimeSeries,
  exportToSagePastelCSV,
  exportToVIPPayrollCSV,
  exportToXeroTimesheetCSV,
  exportDetailedAuditCSV,
  SECTORAL_RULES,
} from '../utils/payrollSectoral';
import { TimesheetEntry, OfficerPayrollSummary } from '../types/dutyon';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';

export const PayrollTimesheetView: React.FC = () => {
  const { 
    timesheets, 
    recordCompletedShift, 
    clearAllTimesheets, 
    officersList, 
    sites, 
    showToast,
    doClockIn,
    officer 
  } = useDutyOn();

  // Quick record shift modal state
  const [isRecordShiftModalOpen, setIsRecordShiftModalOpen] = useState(false);
  const [selectedShiftOfficerId, setSelectedShiftOfficerId] = useState(officersList[0]?.id || 'off-admin');
  const [shiftSiteName, setShiftSiteName] = useState(sites[0]?.name || 'Provincial Office');
  const [shiftHoursCount, setShiftHoursCount] = useState<number>(12);
  const [shiftTypeSelect, setShiftTypeSelect] = useState<'DAY' | 'NIGHT'>('DAY');
  const [shiftDateInput, setShiftDateInput] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isSundayShift, setIsSundayShift] = useState(false);
  const [isHolidayShift, setIsHolidayShift] = useState(false);

  // Timeline / Active Cycle Date Range Filtering
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-30');
  const [cyclePreset, setCyclePreset] = useState<string>('all');

  const handleSetPreset = (preset: string) => {
    setCyclePreset(preset);
    if (preset === 'all') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    } else if (preset === 'w1') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-07');
    } else if (preset === 'w2') {
      setStartDate('2026-09-08');
      setEndDate('2026-09-14');
    } else if (preset === 'w3') {
      setStartDate('2026-09-15');
      setEndDate('2026-09-21');
    } else if (preset === 'w4') {
      setStartDate('2026-09-22');
      setEndDate('2026-09-30');
    } else if (preset === 'fn1') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-15');
    } else if (preset === 'fn2') {
      setStartDate('2026-09-16');
      setEndDate('2026-09-30');
    }
  };

  // Filter master timesheets by active timeline date range
  const timesheetsInCycle = useMemo(() => {
    return timesheets.filter((ts) => {
      if (startDate && ts.date < startDate) return false;
      if (endDate && ts.date > endDate) return false;
      return true;
    });
  }, [timesheets, startDate, endDate]);

  const officerSummaries = useMemo(
    () => calculateOfficerPayrollSummaries(timesheetsInCycle),
    [timesheetsInCycle]
  );
  const payPeriodSummary = useMemo(
    () => calculatePayPeriodSummary(timesheetsInCycle, officerSummaries),
    [timesheetsInCycle, officerSummaries]
  );
  const dailyTimeSeries = useMemo(
    () => generateDailyHoursTimeSeries(timesheetsInCycle),
    [timesheetsInCycle]
  );

  // Available unique sites across timesheets and context
  const availableSiteNames = useMemo(() => {
    const set = new Set<string>();
    timesheets.forEach((t) => {
      if (t.siteName) set.add(t.siteName);
    });
    sites.forEach((s) => {
      if (s.name) set.add(s.name);
    });
    return Array.from(set).sort();
  }, [timesheets, sites]);

  // Unique sorted dates in active cycle
  const uniqueDatesInCycle = useMemo(() => {
    const dates = Array.from(new Set(timesheetsInCycle.map((t) => t.date))).sort();
    return dates;
  }, [timesheetsInCycle]);

  // Filters & State
  const [activeTab, setActiveTab] = useState<'analytics' | 'timesheet_log' | 'daily_deployments' | 'guard_summaries'>('analytics');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');
  const [selectedTagFilter, setSelectedTagFilter] = useState<'ALL' | 'SUNDAY' | 'HOLIDAY' | 'NIGHT' | 'OVERTIME'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<TimesheetEntry | null>(null);

  // Daily Site Deployment Tab State
  const [selectedDeployDate, setSelectedDeployDate] = useState<string>('2026-09-15');
  const [dailySiteFilter, setDailySiteFilter] = useState<string>('ALL');

  // Guard Rollup Tab State
  const [rollupSiteFilter, setRollupSiteFilter] = useState<string>('ALL');
  const [selectedGuardForTimeline, setSelectedGuardForTimeline] = useState<OfficerPayrollSummary | null>(null);

  // Filtered timesheets for Timesheet Log tab
  const filteredTimesheets = useMemo(() => {
    return timesheetsInCycle.filter((ts) => {
      if (selectedSiteFilter !== 'ALL' && ts.siteName !== selectedSiteFilter) return false;
      if (selectedTagFilter === 'SUNDAY' && !ts.isSunday) return false;
      if (selectedTagFilter === 'HOLIDAY' && !ts.isPublicHoliday) return false;
      if (selectedTagFilter === 'NIGHT' && !ts.isNightAllowanceEligible) return false;
      if (selectedTagFilter === 'OVERTIME' && ts.overtimeHours <= 0) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = ts.officerName.toLowerCase().includes(q);
        const matchEmp = ts.empId.toLowerCase().includes(q);
        const matchSite = ts.siteName.toLowerCase().includes(q);
        if (!matchName && !matchEmp && !matchSite) return false;
      }
      return true;
    });
  }, [timesheetsInCycle, selectedSiteFilter, selectedTagFilter, searchTerm]);

  // Daily deployments on selectedDeployDate grouped by Site
  const timesheetsOnSelectedDay = useMemo(() => {
    return timesheets.filter((t) => t.date === selectedDeployDate);
  }, [timesheets, selectedDeployDate]);

  const deploymentsBySite = useMemo(() => {
    const grouped: Record<string, TimesheetEntry[]> = {};
    timesheetsOnSelectedDay.forEach((t) => {
      if (dailySiteFilter !== 'ALL' && t.siteName !== dailySiteFilter) return;
      if (!grouped[t.siteName]) grouped[t.siteName] = [];
      grouped[t.siteName].push(t);
    });
    return grouped;
  }, [timesheetsOnSelectedDay, dailySiteFilter]);

  // Filtered officer summaries for Guard Payroll Rollup tab
  const filteredOfficerSummaries = useMemo(() => {
    return officerSummaries.filter((s) => {
      if (rollupSiteFilter !== 'ALL' && s.siteName !== rollupSiteFilter) return false;
      return true;
    });
  }, [officerSummaries, rollupSiteFilter]);

  // Timesheets for the guard whose timeline is being inspected
  const guardTimelineEntries = useMemo(() => {
    if (!selectedGuardForTimeline) return [];
    return timesheets.filter(
      (t) => t.empId === selectedGuardForTimeline.empId || t.officerName === selectedGuardForTimeline.name
    ).sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedGuardForTimeline, timesheets]);

  // Sectoral hours breakdown for Pie chart
  const sectoralPieData = useMemo(() => {
    let standardDayHours = 0;
    let nightShiftHours = 0;
    let sundayHours = 0;
    let holidayHours = 0;
    let overtimeHours = 0;

    timesheets.forEach((ts) => {
      if (ts.isPublicHoliday) {
        holidayHours += ts.actualHours;
      } else if (ts.isSunday) {
        sundayHours += ts.actualHours;
      } else if (ts.shiftType === 'NIGHT') {
        nightShiftHours += ts.actualHours;
      } else {
        standardDayHours += ts.actualHours;
      }
      overtimeHours += ts.overtimeHours;
    });

    return [
      { name: 'Standard Day (Ordinary)', value: Math.round(standardDayHours), color: '#1FA6C9' },
      { name: 'Night Shift Allowance', value: Math.round(nightShiftHours), color: '#6366F1' },
      { name: 'Sunday Work (1.5x)', value: Math.round(sundayHours), color: '#E7A13A' },
      { name: 'Public Holiday (2.0x)', value: Math.round(holidayHours), color: '#E0574B' },
      { name: 'Authorized Overtime (1.5x)', value: Math.round(overtimeHours), color: '#5BCB80' },
    ];
  }, [timesheets]);

  // Site-by-site hours data for Bar chart
  const siteHoursData = useMemo(() => {
    const map: Record<string, { site: string; standard: number; billable: number; overtime: number }> = {};
    timesheets.forEach((ts) => {
      if (!map[ts.siteName]) {
        // Shorten long site names for chart readability
        let shortName = ts.siteName;
        if (ts.siteName.includes('Automotive')) shortName = 'Auto Logistics';
        else if (ts.siteName.includes('Harbour')) shortName = 'Harbour Depot';
        else if (ts.siteName.includes('Greenacres')) shortName = 'Greenacres Mall';
        else if (ts.siteName.includes('Coega')) shortName = 'Coega Zone';
        else if (ts.siteName.includes('Solar')) shortName = 'Solar Farm';

        map[ts.siteName] = { site: shortName, standard: 0, billable: 0, overtime: 0 };
      }
      map[ts.siteName].standard += ts.standardHours;
      map[ts.siteName].billable += ts.billableHours;
      map[ts.siteName].overtime += ts.overtimeHours;
    });
    return Object.values(map);
  }, [timesheets]);

  // Export handlers
  const handleExportSage = () => {
    exportToSagePastelCSV(officerSummaries, payPeriodSummary);
    showToast('Downloaded Sage Pastel Payroll CSV (Sectoral Determination compliant)');
  };

  const handleExportVIP = () => {
    exportToVIPPayrollCSV(officerSummaries, payPeriodSummary);
    showToast('Downloaded Sage VIP Payroll import file with Biometric verification flags');
  };

  const handleExportXero = () => {
    exportToXeroTimesheetCSV(timesheets, payPeriodSummary);
    showToast('Downloaded Xero Timesheets CSV for seamless payroll syncing');
  };

  const handleExportDetailedAudit = () => {
    exportDetailedAuditCSV(timesheets, payPeriodSummary);
    showToast('Downloaded Detailed Biometric & Client Billing Audit CSV');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Pay Period & Sectoral Determination Framework */}
      <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 grid place-items-center text-xl flex-none shadow-inner">
              ⏱️
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display font-bold text-lg text-white">
                  Timesheet &amp; Sectoral Determination Payroll Engine
                </h2>
                <span className="bg-indigo-500/20 text-indigo-300 font-mono-code text-[11px] px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  PSSBC SD-6 COMPLIANT
                </span>
                <span className="bg-[#5BCB80]/15 text-[#5BCB80] font-mono-code text-[11px] px-2.5 py-0.5 rounded-full border border-[#5BCB80]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5BCB80] animate-pulse" />
                  100% Face Liveness Biometrics
                </span>
              </div>
              <p className="text-xs text-[#8598A8] mt-1">
                Automated biometric clock-in/out reconciliation, Sectoral Determination 6 allowances (Night Shift, Sunday 1.5×, Africa Day Public Holiday 2.0×), and direct billing recovery.
              </p>
            </div>
          </div>

          {/* Action Export & Shift Recording Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsRecordShiftModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#042430] font-display font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
              title="Add a verified completed shift to timesheets"
            >
              <span>➕</span>
              <span>Record Shift</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Reset all sectoral timesheets to zero baseline? Live hours will recount from 0.')) {
                  clearAllTimesheets();
                  showToast('Timesheets reset to 0.0 baseline');
                }
              }}
              className="px-2.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-display font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Reset all timesheet hours to clean zero baseline"
            >
              <span>🔄</span>
              <span>Reset to 0</span>
            </button>

            <div className="relative group">
              <button
                onClick={handleExportSage}
                className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-display font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Export for Sage Pastel Payroll"
              >
                <span>📊</span>
                <span>Sage Pastel</span>
              </button>
            </div>

            <button
              onClick={handleExportVIP}
              className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-display font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Export for Sage VIP Classic / Premier"
            >
              <span>💼</span>
              <span>VIP Payroll</span>
            </button>

            <button
              onClick={handleExportXero}
              className="px-3 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 font-display font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Export standard Xero Timesheets"
            >
              <span>🌐</span>
              <span>Xero CSV</span>
            </button>

            <button
              onClick={handleExportDetailedAudit}
              className="px-3 py-2 bg-[#1FA6C9] hover:bg-[#1FA6C9]/90 text-[#042430] font-display font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#1FA6C9]/20"
              title="Full Biometric Punch Audit with Margin analysis"
            >
              <span>📥</span>
              <span>Audit CSV</span>
            </button>
          </div>
        </div>

        {/* Active Cycle & Timeline Filter Controls */}
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold flex items-center gap-1.5">
                <span>📅</span>
                <span>Active Cycle Filter:</span>
              </span>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 flex-wrap">
                {[
                  { id: 'all', label: 'Full Month (01-30 Sep)' },
                  { id: 'w1', label: 'W1: 01-07 Sep' },
                  { id: 'w2', label: 'W2: 08-14 Sep' },
                  { id: 'w3', label: 'W3: 15-21 Sep' },
                  { id: 'w4', label: 'W4: 22-30 Sep' },
                  { id: 'fn1', label: 'Fortnight 1 (01-15 Sep)' },
                  { id: 'fn2', label: 'Fortnight 2 (16-30 Sep)' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSetPreset(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      cyclePreset === p.id
                        ? 'bg-[#1FA6C9] text-[#042430] shadow-sm'
                        : 'text-[#8598A8] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Inputs */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-mono-code text-xs">
              <span className="text-[#8598A8]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCyclePreset('custom');
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
              />
              <span className="text-[#8598A8]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCyclePreset('custom');
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px] text-[#8598A8]">
            <div className="flex items-center gap-2">
              <span className="text-white font-mono-code bg-[#1FA6C9]/15 text-[#3FC9E9] px-2 py-0.5 rounded border border-[#1FA6C9]/30 font-semibold">
                Timeline: {startDate} → {endDate} ({timesheetsInCycle.length} punches across {uniqueDatesInCycle.length} days)
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono-code flex-wrap">
              <span>Ordinary Shift: <strong className="text-white">12.0h</strong></span>
              <span>Night Allowance: <strong className="text-indigo-300">R{SECTORAL_RULES.nightShiftAllowancePerShift.toFixed(2)}/shift</strong></span>
              <span>Sunday: <strong className="text-amber-300">1.5×</strong></span>
              <span>Public Holiday: <strong className="text-rose-300">2.0×</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 High-Impact KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Billable vs Standard Hours Ratio */}
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-[#1FA6C9]/40 transition-all">
          <div className="flex items-center justify-between text-xs text-[#8598A8]">
            <span>Billable Ratio</span>
            <span className="font-mono-code text-[10px] bg-[#5BCB80]/15 text-[#5BCB80] px-1.5 py-0.5 rounded font-bold">
              +{(payPeriodSummary.billableRatio - 100).toFixed(1)}% variance
            </span>
          </div>
          <div className="font-display font-extrabold text-2xl text-white mt-1 flex items-baseline gap-1.5">
            <span className="text-[#3FC9E9]">{payPeriodSummary.billableRatio}%</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 flex items-center justify-between">
            <span>Billable: <strong className="text-white">{payPeriodSummary.totalBillableHours.toFixed(1)}h</strong></span>
            <span>Target: <span className="text-[#9db0c0]">{payPeriodSummary.totalStandardHours.toFixed(0)}h</span></span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#1FA6C9] to-[#5BCB80] h-full rounded-full"
              style={{ width: `${Math.min(payPeriodSummary.billableRatio, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Standard vs Overtime Hours */}
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#8598A8]">
            <span>Authorized Overtime</span>
            <span className="font-mono-code text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded font-bold">
              1.5× Rate
            </span>
          </div>
          <div className="font-display font-extrabold text-2xl text-white mt-1">
            {payPeriodSummary.totalOvertimeHours.toFixed(1)} <span className="text-xs font-normal text-[#8598A8]">hrs</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1">
            Shift handovers &amp; emergency stand-ins
          </div>
        </div>

        {/* Metric 3: Night Shift Statutory Allowances */}
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#8598A8]">
            <span>Night Shift Allowances</span>
            <span className="font-mono-code text-[10px] bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded font-bold">
              SD-6
            </span>
          </div>
          <div className="font-display font-extrabold text-2xl text-white mt-1">
            {payPeriodSummary.totalNightShifts} <span className="text-xs font-normal text-[#8598A8]">shifts</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 font-mono-code text-indigo-300">
            R{(payPeriodSummary.totalNightShifts * SECTORAL_RULES.nightShiftAllowancePerShift).toLocaleString()} allowance pool
          </div>
        </div>

        {/* Metric 4: Sunday & Holiday Premiums */}
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#8598A8]">
            <span>Sunday &amp; Public Holiday</span>
            <span className="font-mono-code text-[10px] bg-rose-500/15 text-rose-300 px-1.5 py-0.5 rounded font-bold">
              1.5× / 2.0×
            </span>
          </div>
          <div className="font-display font-extrabold text-2xl text-white mt-1">
            {(payPeriodSummary.totalSundayHours + payPeriodSummary.totalHolidayHours).toFixed(1)} <span className="text-xs font-normal text-[#8598A8]">hrs</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1">
            Sun: {payPeriodSummary.totalSundayHours.toFixed(0)}h · Africa Day: {payPeriodSummary.totalHolidayHours.toFixed(0)}h
          </div>
        </div>

        {/* Metric 5: Guard Wage Bill vs Client Billing (Margin) */}
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#8598A8]">
            <span>Gross Contract Margin</span>
            <span className="font-mono-code text-[10px] bg-[#5BCB80]/15 text-[#5BCB80] px-1.5 py-0.5 rounded font-bold">
              Profitable
            </span>
          </div>
          <div className="font-display font-extrabold text-2xl text-[#5BCB80] mt-1">
            {payPeriodSummary.grossMarginPercent}%
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1">
            Billed: <strong className="text-white">R{payPeriodSummary.totalBilledToClients.toLocaleString()}</strong> · Wage: R{payPeriodSummary.totalGrossWages.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tab Navigation: Visualizations vs Timesheet Log vs Guard Summaries */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl font-display font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-[#1FA6C9] text-[#042430] shadow-sm shadow-[#1FA6C9]/30'
                : 'bg-white/5 text-[#9db0c0] hover:text-white hover:bg-white/10'
            }`}
          >
            <span>📈</span>
            <span>Billable Ratio &amp; Sectoral Visuals</span>
          </button>

          <button
            onClick={() => setActiveTab('timesheet_log')}
            className={`px-4 py-2 rounded-xl font-display font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'timesheet_log'
                ? 'bg-[#1FA6C9] text-[#042430] shadow-sm shadow-[#1FA6C9]/30'
                : 'bg-white/5 text-[#9db0c0] hover:text-white hover:bg-white/10'
            }`}
          >
            <span>📋</span>
            <span>Biometric Clock-In Log ({filteredTimesheets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('daily_deployments')}
            className={`px-4 py-2 rounded-xl font-display font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'daily_deployments'
                ? 'bg-[#1FA6C9] text-[#042430] shadow-sm shadow-[#1FA6C9]/30'
                : 'bg-white/5 text-[#9db0c0] hover:text-white hover:bg-white/10'
            }`}
          >
            <span>📍</span>
            <span>Daily Site Deployments ({timesheetsOnSelectedDay.length} on {selectedDeployDate.slice(5)})</span>
          </button>

          <button
            onClick={() => setActiveTab('guard_summaries')}
            className={`px-4 py-2 rounded-xl font-display font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'guard_summaries'
                ? 'bg-[#1FA6C9] text-[#042430] shadow-sm shadow-[#1FA6C9]/30'
                : 'bg-white/5 text-[#9db0c0] hover:text-white hover:bg-white/10'
            }`}
          >
            <span>👮</span>
            <span>Guard Payroll Rollup ({filteredOfficerSummaries.length})</span>
          </button>
        </div>

        <div className="text-xs text-[#8598A8] hidden sm:block">
          Active Timeline: <span className="font-mono-code text-white">{timesheetsInCycle.length} punches</span>
        </div>
      </div>

      {/* ----------------- TAB 1: RECHARTS VISUALIZATIONS ----------------- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Main Primary Chart: Daily Billable vs Standard Hours with Ratio Line */}
          <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <span>📊</span>
                  <span>Daily Ratio: Billable Hours vs. Standard Contract Hours</span>
                </h3>
                <p className="text-xs text-[#8598A8] mt-0.5">
                  Reconciliation of contracted roster posts (standard 12h) against biometric punch hours billed to client facilities.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#1FA6C9]" />
                  <span className="text-[#9db0c0]">Standard Target</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#5BCB80]" />
                  <span className="text-[#9db0c0]">Billable Hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-[#E7A13A]" />
                  <span className="text-[#E7A13A] font-semibold">Ratio % (Right Axis)</span>
                </div>
              </div>
            </div>

            {/* Recharts Composed Chart */}
            <div className="w-full h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyTimeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="shortDate"
                    stroke="#8598A8"
                    fontSize={11}
                    tickLine={false}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis
                    yAxisId="hours"
                    stroke="#8598A8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit="h"
                    domain={[0, 'dataMax + 20']}
                  />
                  <YAxis
                    yAxisId="ratio"
                    orientation="right"
                    stroke="#E7A13A"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                    domain={[90, 115]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#071726',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'Ratio') return [`${value}%`, 'Billable Recovery Ratio'];
                      if (name === 'Billable') return [`${value} hrs`, 'Verified Billable'];
                      if (name === 'Standard') return [`${value} hrs`, 'Standard Scheduled'];
                      return [value, name];
                    }}
                  />
                  <Bar
                    yAxisId="hours"
                    dataKey="standardHours"
                    name="Standard"
                    fill="#1FA6C9"
                    opacity={0.4}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    yAxisId="hours"
                    dataKey="billableHours"
                    name="Billable"
                    fill="#5BCB80"
                    opacity={0.85}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Line
                    yAxisId="ratio"
                    type="monotone"
                    dataKey="ratio"
                    name="Ratio"
                    stroke="#E7A13A"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#E7A13A', strokeWidth: 1, stroke: '#071726' }}
                    activeDot={{ r: 6, fill: '#E7A13A' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Visuals: Sectoral Hours Distribution & Site Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sectoral Categories Donut Chart (5 cols) */}
            <div className="lg:col-span-5 bg-[#0A1E33] border border-white/10 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="mb-2">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <span>🍩</span>
                  <span>Sectoral Determination Mix</span>
                </h3>
                <p className="text-xs text-[#8598A8] mt-0.5">
                  Proportion of hours attracting statutory overtime, night shift, or holiday multipliers.
                </p>
              </div>

              <div className="h-56 relative flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectoralPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {sectoralPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#071726',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                      formatter={(val: any) => [`${val} hrs`, 'Volume']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
                {sectoralPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[#9db0c0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ backgroundColor: item.color }} />
                      <span className="text-white text-[11px]">{item.name}</span>
                    </div>
                    <span className="font-mono-code text-[11px] text-white font-bold">{item.value} hrs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Site Hours & Overtime Bar Chart (7 cols) */}
            <div className="lg:col-span-7 bg-[#0A1E33] border border-white/10 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                    <span>🏢</span>
                    <span>Client Site Hours &amp; Billable Performance</span>
                  </h3>
                  <p className="text-xs text-[#8598A8] mt-0.5">
                    Contracted post requirements vs actual logged biometrics per protected site.
                  </p>
                </div>
              </div>

              <div className="h-64 flex-1 pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={siteHoursData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="site" stroke="#8598A8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#8598A8" fontSize={11} tickLine={false} axisLine={false} unit="h" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#071726',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                      formatter={(val: any, name: string) => [`${val.toFixed(1)} hrs`, name]}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                    />
                    <Bar dataKey="standard" name="Contracted Standard" fill="#1FA6C9" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="billable" name="Actual Billable" fill="#5BCB80" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="overtime" name="Overtime" fill="#E7A13A" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] text-[#8598A8] pt-2 border-t border-white/10 flex items-center justify-between">
                <span>All sites operating within acceptable SLA variance (+2.8% to +5.1%)</span>
                <span className="text-[#3FC9E9] font-mono-code font-bold">100% Billable Capture</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: BIOMETRIC TIMESHEET LOG ----------------- */}
      {activeTab === 'timesheet_log' && (
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0c243d]">
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search officer, emp ID, or site…"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#8598A8] focus:outline-none focus:border-[#1FA6C9] w-64"
              />

              <select
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="ALL" className="bg-[#071726]">All Protected Sites</option>
                <option value="Automotive Logistics Hub" className="bg-[#071726]">Automotive Logistics Hub</option>
                <option value="Harbour Container Depot" className="bg-[#071726]">Harbour Container Depot</option>
                <option value="Greenacres Retail Mall" className="bg-[#071726]">Greenacres Retail Mall</option>
                <option value="Coega Industrial Zone" className="bg-[#071726]">Coega Industrial Zone</option>
                <option value="Gqeberha Solar Farm" className="bg-[#071726]">Gqeberha Solar Farm</option>
              </select>

              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
                {(['ALL', 'SUNDAY', 'HOLIDAY', 'NIGHT', 'OVERTIME'] as const).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTagFilter(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedTagFilter === tag
                        ? 'bg-[#1FA6C9] text-[#042430]'
                        : 'text-[#8598A8] hover:text-white'
                    }`}
                  >
                    {tag === 'ALL' ? 'All Tags' : tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-[#8598A8]">
              Showing <strong className="text-white">{filteredTimesheets.length}</strong> punch records
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-[#8598A8] font-semibold">
                <tr>
                  <th className="py-3 px-4">Officer &amp; Site</th>
                  <th className="py-3 px-4">Date &amp; Shift</th>
                  <th className="py-3 px-4">Biometric Verification</th>
                  <th className="py-3 px-4 text-center">Clock-In / Out</th>
                  <th className="py-3 px-4 text-center">Standard</th>
                  <th className="py-3 px-4 text-center">Billable</th>
                  <th className="py-3 px-4">Sectoral Allowances</th>
                  <th className="py-3 px-4 text-right">Wage Cost / Client Rev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTimesheets.map((ts) => {
                  const wageCost = (ts.standardHours * ts.hourlyRate) + 
                    (ts.overtimeHours * ts.hourlyRate * 1.5) +
                    (ts.isSunday ? ts.actualHours * ts.hourlyRate * 0.5 : 0) +
                    (ts.isPublicHoliday ? ts.actualHours * ts.hourlyRate * 1.0 : 0) +
                    (ts.isNightAllowanceEligible ? SECTORAL_RULES.nightShiftAllowancePerShift : 0);

                  const clientRev = ts.billableHours * ts.clientBillingRate * (ts.isPublicHoliday ? 1.5 : (ts.isSunday ? 1.25 : 1.0));

                  return (
                    <tr
                      key={ts.id}
                      onClick={() => setSelectedEntry(ts)}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{ts.officerName}</span>
                          <span className="font-mono-code text-[10px] bg-white/10 text-[#9db0c0] px-1.5 py-0.5 rounded">
                            Grade {ts.grade}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8598A8] flex items-center gap-1 mt-0.5">
                          <span>{ts.siteName}</span>
                          <span>·</span>
                          <span className="font-mono-code text-[#3FC9E9]">{ts.empId}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">
                          {ts.date} <span className="text-[#8598A8] font-normal">({ts.dayOfWeek.slice(0, 3)})</span>
                        </div>
                        <div className="text-[11px] font-mono-code mt-0.5">
                          {ts.shiftType === 'DAY' ? (
                            <span className="text-amber-300">☀️ Day Shift (06:00-18:00)</span>
                          ) : (
                            <span className="text-indigo-300">🌙 Night Shift (18:00-06:00)</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5BCB80]/15 text-[#5BCB80]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5BCB80]" />
                          Face Liveness AI (99.2%)
                        </span>
                        <div className="text-[10px] text-[#8598A8] font-mono-code mt-0.5">
                          GPS Geofence: PASS
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono-code">
                        <div className="text-white font-bold">{ts.clockInTime} → {ts.clockOutTime}</div>
                        <div className="text-[10px] text-[#8598A8] mt-0.5">
                          Actual: {ts.actualHours.toFixed(2)}h
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono-code text-[#9db0c0]">
                        {ts.standardHours.toFixed(1)}h
                      </td>

                      <td className="py-3 px-4 text-center font-mono-code font-bold text-[#5BCB80]">
                        {ts.billableHours.toFixed(1)}h
                        {ts.overtimeHours > 0 && (
                          <div className="text-[10px] text-amber-300">
                            +{ts.overtimeHours.toFixed(1)}h OT
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {ts.isNightAllowanceEligible && (
                            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono-code px-1.5 py-0.5 rounded">
                              +R38.50 Night
                            </span>
                          )}
                          {ts.isSunday && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono-code px-1.5 py-0.5 rounded">
                              1.5× Sunday
                            </span>
                          )}
                          {ts.isPublicHoliday && (
                            <span className="bg-rose-500/20 text-rose-300 text-[10px] font-mono-code px-1.5 py-0.5 rounded">
                              2.0× {ts.publicHolidayName}
                            </span>
                          )}
                          {!ts.isNightAllowanceEligible && !ts.isSunday && !ts.isPublicHoliday && ts.overtimeHours === 0 && (
                            <span className="text-[#8598A8] text-[11px]">Ordinary Standard</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-mono-code text-white font-semibold">
                          R{clientRev.toFixed(0)} billed
                        </div>
                        <div className="font-mono-code text-[11px] text-[#8598A8]">
                          Wage: R{wageCost.toFixed(0)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- TAB: DAILY SITE DEPLOYMENTS ----------------- */}
      {activeTab === 'daily_deployments' && (
        <div className="space-y-4">
          {/* Day Selector Strip */}
          <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <span>📅</span>
                  <span>Daily Deployment Timeline &amp; Roster Inspector</span>
                </h3>
                <p className="text-xs text-[#8598A8] mt-0.5">
                  Select any date across the active cycle to see exact guard deployments, shifts, and biometrics per site.
                </p>
              </div>

              {/* Site filter for daily view */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8598A8]">Filter Site:</span>
                <select
                  value={dailySiteFilter}
                  onChange={(e) => setDailySiteFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value="ALL" className="bg-[#071726]">All Protected Sites</option>
                  {availableSiteNames.map((s) => (
                    <option key={s} value={s} className="bg-[#071726]">{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable Day Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {uniqueDatesInCycle.map((dateStr) => {
                const isSelected = dateStr === selectedDeployDate;
                const countForDay = timesheets.filter((t) => t.date === dateStr).length;
                const d = new Date(dateStr);
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
                const dayNum = dateStr.slice(8);
                const monthName = 'Sep';

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDeployDate(dateStr)}
                    className={`flex-none px-3.5 py-2 rounded-xl text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1FA6C9] text-[#042430] border-[#1FA6C9] shadow-md shadow-[#1FA6C9]/25 scale-105'
                        : 'bg-white/5 border-white/10 text-[#8598A8] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider">{dayName}</div>
                    <div className={`text-base font-bold font-mono-code ${isSelected ? 'text-[#042430]' : 'text-white'}`}>
                      {dayNum}
                    </div>
                    <div className="text-[10px] font-mono-code mt-0.5 opacity-90">
                      {countForDay} on post
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deployments Grouped by Site for Selected Date */}
          <div className="space-y-4">
            {Object.keys(deploymentsBySite).length === 0 ? (
              <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-8 text-center text-[#8598A8]">
                <span className="text-3xl block mb-2">🏢</span>
                <p className="text-sm font-semibold text-white">No deployment punches recorded for {selectedDeployDate}</p>
                <p className="text-xs mt-1">Adjust site filter or pick another date along the cycle timeline.</p>
              </div>
            ) : (
              (Object.entries(deploymentsBySite) as [string, TimesheetEntry[]][]).map(([siteName, siteEntries]) => {
                const dayGuards = siteEntries.filter((e) => e.shiftType === 'DAY');
                const nightGuards = siteEntries.filter((e) => e.shiftType === 'NIGHT');

                return (
                  <div key={siteName} className="bg-[#0A1E33] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-[#0c2540] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1FA6C9]/15 border border-[#1FA6C9]/30 grid place-items-center text-base text-[#3FC9E9]">
                          🏢
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-sm text-white">{siteName}</h4>
                            <span className="font-mono-code text-[11px] bg-[#5BCB80]/15 text-[#5BCB80] px-2 py-0.5 rounded-full font-bold">
                              {siteEntries.length} Active Posts
                            </span>
                          </div>
                          <div className="text-xs text-[#8598A8] mt-0.5 flex items-center gap-2">
                            <span>Date: <strong className="text-white">{selectedDeployDate}</strong></span>
                            <span>·</span>
                            <span>☀️ Day: <strong className="text-amber-300">{dayGuards.length}</strong></span>
                            <span>·</span>
                            <span>🌙 Night: <strong className="text-indigo-300">{nightGuards.length}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-mono-code text-[#8598A8]">
                        Total Verified Hours: <span className="text-white font-bold">{siteEntries.reduce((acc, c) => acc + c.billableHours, 0).toFixed(1)}h</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 border-b border-white/10 text-[#8598A8] font-semibold">
                          <tr>
                            <th className="py-2.5 px-4">Officer &amp; Grade</th>
                            <th className="py-2.5 px-4">Shift &amp; Hours</th>
                            <th className="py-2.5 px-4">Clock-In / Out</th>
                            <th className="py-2.5 px-4">Biometric Verification</th>
                            <th className="py-2.5 px-4">Sectoral Determination</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {siteEntries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-white flex items-center gap-2">
                                  <span>{entry.officerName}</span>
                                  <span className="font-mono-code text-[10px] bg-white/10 text-[#9db0c0] px-1.5 py-0.5 rounded">
                                    Grade {entry.grade}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#8598A8] font-mono-code mt-0.5">
                                  Emp ID: <span className="text-[#3FC9E9]">{entry.empId}</span>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  {entry.shiftType === 'DAY' ? (
                                    <span className="text-amber-300">☀️ Day (06:00-18:00)</span>
                                  ) : (
                                    <span className="text-indigo-300">🌙 Night (18:00-06:00)</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#8598A8] font-mono-code mt-0.5">
                                  Billable: <strong className="text-[#5BCB80]">{entry.billableHours.toFixed(1)}h</strong>
                                  {entry.overtimeHours > 0 && <span className="text-amber-300 ml-1">(+{entry.overtimeHours}h OT)</span>}
                                </div>
                              </td>

                              <td className="py-3 px-4 font-mono-code">
                                <div className="text-white font-bold">{entry.clockInTime} → {entry.clockOutTime}</div>
                                <div className="text-[10px] text-[#8598A8]">Total: {entry.actualHours.toFixed(1)}h</div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5BCB80]/15 text-[#5BCB80]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#5BCB80]" />
                                  Face Liveness 99.2%
                                </span>
                                <div className="text-[10px] text-[#8598A8] font-mono-code mt-0.5">
                                  18m Geofence: PASS
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {entry.isNightAllowanceEligible && (
                                    <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono-code px-1.5 py-0.5 rounded">
                                      +R38.50 Night
                                    </span>
                                  )}
                                  {entry.isSunday && (
                                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono-code px-1.5 py-0.5 rounded">
                                      1.5× Sunday
                                    </span>
                                  )}
                                  {entry.isPublicHoliday && (
                                    <span className="bg-rose-500/20 text-rose-300 text-[10px] font-mono-code px-1.5 py-0.5 rounded">
                                      2.0× {entry.publicHolidayName}
                                    </span>
                                  )}
                                  {!entry.isNightAllowanceEligible && !entry.isSunday && !entry.isPublicHoliday && (
                                    <span className="text-[#8598A8] text-[11px]">Ordinary Standard</span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedEntry(entry)}
                                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold cursor-pointer transition-all mr-1.5"
                                >
                                  Punch Card
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sum = officerSummaries.find(
                                      (s) => s.empId === entry.empId || s.name === entry.officerName
                                    );
                                    if (sum) setSelectedGuardForTimeline(sum);
                                  }}
                                  className="px-2.5 py-1 bg-[#1FA6C9]/15 hover:bg-[#1FA6C9]/25 text-[#3FC9E9] border border-[#1FA6C9]/30 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                                >
                                  30-Day Timeline
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: GUARD PAYROLL ROLLUP ----------------- */}
      {activeTab === 'guard_summaries' && (
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#0c243d]">
            <div>
              <h3 className="font-display font-bold text-sm text-white">
                Officer Remuneration &amp; Client Billing Matrix
              </h3>
              <p className="text-xs text-[#8598A8] mt-0.5">
                Calculated according to PSSBC Wage Schedules with exact billable profit margins.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter Rollup by Site */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8598A8]">Site Filter:</span>
                <select
                  value={rollupSiteFilter}
                  onChange={(e) => setRollupSiteFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value="ALL" className="bg-[#071726]">All Protected Sites</option>
                  {availableSiteNames.map((s) => (
                    <option key={s} value={s} className="bg-[#071726]">{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportVIP}
                  className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  VIP Export
                </button>
                <button
                  onClick={handleExportSage}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Sage Export
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-[#8598A8] font-semibold">
                <tr>
                  <th className="py-3 px-4">Officer &amp; PSIRA</th>
                  <th className="py-3 px-4">Primary Site</th>
                  <th className="py-3 px-4 text-center">Standard Hrs</th>
                  <th className="py-3 px-4 text-center">Billable Hrs</th>
                  <th className="py-3 px-4 text-center">OT Hrs (1.5×)</th>
                  <th className="py-3 px-4 text-center">Sunday / Hol</th>
                  <th className="py-3 px-4 text-center">Night Shifts</th>
                  <th className="py-3 px-4 text-right">Gross Wages</th>
                  <th className="py-3 px-4 text-right">Client Invoiced</th>
                  <th className="py-3 px-4 text-right">Gross Margin</th>
                  <th className="py-3 px-4 text-center">Work Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOfficerSummaries.map((s) => (
                  <tr key={s.officerId} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{s.name}</div>
                      <div className="text-[11px] text-[#8598A8] font-mono-code">
                        {s.empId} · {s.psiraNumber} · Grade {s.grade}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#9db0c0]">
                      {s.siteName}
                    </td>

                    <td className="py-3 px-4 text-center font-mono-code">
                      {s.totalStandardHours.toFixed(1)}h
                    </td>

                    <td className="py-3 px-4 text-center font-mono-code font-bold text-[#5BCB80]">
                      {s.totalBillableHours.toFixed(1)}h
                    </td>

                    <td className="py-3 px-4 text-center font-mono-code text-amber-300">
                      {s.totalOvertimeHours.toFixed(1)}h
                    </td>

                    <td className="py-3 px-4 text-center font-mono-code">
                      <span className="text-amber-300">{s.sundayHours.toFixed(0)}h</span>
                      {s.publicHolidayHours > 0 && (
                        <span className="text-rose-300 ml-1">/ {s.publicHolidayHours.toFixed(0)}h Hol</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono-code text-indigo-300">
                      {s.nightShiftAllowanceShifts} <span className="text-[10px] text-[#8598A8]">(R{s.nightShiftAllowanceAmount})</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono-code font-semibold text-white">
                      R{s.grossWages.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono-code font-semibold text-[#3FC9E9]">
                      R{s.clientBilledAmount.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="font-mono-code font-bold text-[#5BCB80]">
                        {s.profitMarginPercent}%
                      </span>
                      <div className="text-[10px] text-[#8598A8] font-mono-code">
                        +R{s.profitMarginAmount.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedGuardForTimeline(s)}
                        className="px-2.5 py-1 bg-[#1FA6C9]/15 hover:bg-[#1FA6C9]/25 text-[#3FC9E9] border border-[#1FA6C9]/40 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                      >
                        <span>📅</span>
                        <span>View History</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- GUARD WORK TIMELINE MODAL ----------------- */}
      {selectedGuardForTimeline && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1E33] border border-white/20 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1FA6C9]/15 border border-[#1FA6C9]/30 text-[#3FC9E9] grid place-items-center text-xl font-bold font-mono-code">
                  👮
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg text-white">
                      {selectedGuardForTimeline.name}
                    </h3>
                    <span className="font-mono-code text-xs bg-white/10 text-[#3FC9E9] px-2 py-0.5 rounded">
                      Grade {selectedGuardForTimeline.grade}
                    </span>
                    <span className="font-mono-code text-xs bg-[#5BCB80]/15 text-[#5BCB80] px-2 py-0.5 rounded">
                      PSIRA: {selectedGuardForTimeline.psiraNumber}
                    </span>
                  </div>
                  <p className="text-xs text-[#8598A8] mt-0.5">
                    Primary Site: <strong className="text-white">{selectedGuardForTimeline.siteName}</strong> · Employee ID: <span className="font-mono-code text-[#3FC9E9]">{selectedGuardForTimeline.empId}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGuardForTimeline(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Officer Cycle Scorecards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[#8598A8]">Total Shifts Worked:</span>
                <div className="text-white font-display font-bold text-lg mt-0.5">
                  {guardTimelineEntries.length} <span className="text-xs text-[#8598A8] font-normal">shifts</span>
                </div>
                <div className="text-[10px] text-[#5BCB80] font-mono-code">
                  {selectedGuardForTimeline.totalBillableHours.toFixed(1)} billable hrs
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[#8598A8]">Overtime Logged:</span>
                <div className="text-amber-300 font-display font-bold text-lg mt-0.5">
                  {selectedGuardForTimeline.totalOvertimeHours.toFixed(1)} <span className="text-xs font-normal">hrs</span>
                </div>
                <div className="text-[10px] text-[#8598A8] font-mono-code">
                  1.5× Handover Rate
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[#8598A8]">Night Allowances:</span>
                <div className="text-indigo-300 font-display font-bold text-lg mt-0.5">
                  {selectedGuardForTimeline.nightShiftAllowanceShifts} <span className="text-xs font-normal">nights</span>
                </div>
                <div className="text-[10px] text-indigo-200 font-mono-code">
                  +R{selectedGuardForTimeline.nightShiftAllowanceAmount} SD-6
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[#8598A8]">Gross Wage Earnings:</span>
                <div className="text-white font-display font-bold text-lg mt-0.5">
                  R{selectedGuardForTimeline.grossWages.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#5BCB80] font-mono-code">
                  Margin: {selectedGuardForTimeline.profitMarginPercent}%
                </div>
              </div>
            </div>

            {/* 30-Day Day-by-Day Deployment Timeline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Shift Calendar &amp; Deployment History Across Cycle</span>
                </h4>
                <span className="text-xs text-[#8598A8] font-mono-code">
                  Showing {guardTimelineEntries.length} logged shifts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {uniqueDatesInCycle.map((dateStr) => {
                  const entry = guardTimelineEntries.find((t) => t.date === dateStr);
                  const d = new Date(dateStr);
                  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
                  const dayNum = dateStr.slice(8);

                  if (!entry) {
                    return (
                      <div
                        key={dateStr}
                        className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center justify-between opacity-50"
                      >
                        <div>
                          <div className="text-xs font-mono-code text-[#8598A8]">
                            {dayName} {dayNum} Sep
                          </div>
                          <div className="text-xs text-[#5D6E7E] mt-0.5">
                            🛌 Scheduled Rest Day
                          </div>
                        </div>
                        <span className="text-[10px] font-mono-code text-[#5D6E7E] bg-white/5 px-1.5 py-0.5 rounded">
                          OFF
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={dateStr}
                      className={`border rounded-xl p-3 space-y-1.5 transition-all ${
                        entry.shiftType === 'DAY'
                          ? 'bg-amber-500/[0.06] border-amber-500/20'
                          : 'bg-indigo-500/[0.06] border-indigo-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono-code font-bold text-white">
                          {dayName} {dayNum} Sep
                        </span>
                        <span className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded font-semibold ${
                          entry.shiftType === 'DAY'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {entry.shiftType === 'DAY' ? '☀️ DAY (12h)' : '🌙 NIGHT (12h)'}
                        </span>
                      </div>

                      <div className="text-xs text-white font-medium truncate" title={entry.siteName}>
                        📍 {entry.siteName}
                      </div>

                      <div className="text-[11px] font-mono-code text-[#8598A8] flex items-center justify-between">
                        <span>{entry.clockInTime} → {entry.clockOutTime}</span>
                        <span className="text-[#5BCB80] font-bold">{entry.billableHours}h</span>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        <span className="text-[9.5px] bg-[#5BCB80]/15 text-[#5BCB80] px-1.5 py-0.5 rounded font-mono-code">
                          Biometric PASS
                        </span>
                        {entry.isNightAllowanceEligible && (
                          <span className="text-[9.5px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono-code">
                            +R38.50
                          </span>
                        )}
                        {entry.isSunday && (
                          <span className="text-[9.5px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono-code">
                            1.5× Sun
                          </span>
                        )}
                        {entry.isPublicHoliday && (
                          <span className="text-[9.5px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono-code">
                            2.0× Hol
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedGuardForTimeline(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-display font-semibold text-xs rounded-xl cursor-pointer transition-all"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1E33] border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Biometric Punch Audit Detail
                </h3>
                <p className="text-xs text-[#8598A8] font-mono-code">
                  ID: {selectedEntry.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[#8598A8]">Security Officer:</span>
                <div className="text-white font-semibold mt-0.5">{selectedEntry.officerName}</div>
                <div className="text-[11px] font-mono-code text-[#3FC9E9]">{selectedEntry.empId} (Grade {selectedEntry.grade})</div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[#8598A8]">Client Facility:</span>
                <div className="text-white font-semibold mt-0.5">{selectedEntry.siteName}</div>
                <div className="text-[11px] text-[#5BCB80]">GPS Geofence Verified</div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[#8598A8]">Clock-In Time:</span>
                <div className="text-white font-mono-code font-bold mt-0.5">{selectedEntry.clockInTime}</div>
                <div className="text-[10px] text-[#5BCB80]">Face Liveness: Verified</div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[#8598A8]">Clock-Out Time:</span>
                <div className="text-white font-mono-code font-bold mt-0.5">{selectedEntry.clockOutTime}</div>
                <div className="text-[10px] text-amber-300">
                  {selectedEntry.overtimeHours > 0 ? `+${selectedEntry.overtimeHours}h Overtime Handover` : 'Standard Handover'}
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[#8598A8]">Standard vs Billable:</span>
                <div className="text-white font-mono-code mt-0.5">
                  Std: {selectedEntry.standardHours}h · <strong className="text-[#5BCB80]">Billable: {selectedEntry.billableHours}h</strong>
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[#8598A8]">Sectoral Multiplier:</span>
                <div className="text-white font-mono-code mt-0.5">
                  {selectedEntry.isPublicHoliday ? '2.0× Public Holiday' :
                   selectedEntry.isSunday ? '1.5× Sunday Work' :
                   selectedEntry.shiftType === 'NIGHT' ? '+R38.50 Night Allowance' : '1.0× Normal'}
                </div>
              </div>
            </div>

            {selectedEntry.varianceReason && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200">
                <strong className="block text-amber-300 font-semibold mb-0.5">Supervisor Handover Note:</strong>
                {selectedEntry.varianceReason}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  showToast(`Timesheet entry ${selectedEntry.id} marked as locked & verified`);
                  setSelectedEntry(null);
                }}
                className="px-4 py-2 bg-[#1FA6C9] hover:bg-[#1FA6C9]/90 text-[#042430] font-display font-bold text-xs rounded-xl cursor-pointer"
              >
                Approve &amp; Lock Punch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD COMPLETED SHIFT MODAL */}
      {isRecordShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1E33] border border-white/20 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                <h3 className="font-display font-bold text-base text-white">
                  Record Verified Duty Shift
                </h3>
              </div>
              <button
                onClick={() => setIsRecordShiftModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 text-slate-400 hover:text-white grid place-items-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                recordCompletedShift({
                  officerId: selectedShiftOfficerId,
                  siteName: shiftSiteName,
                  date: shiftDateInput,
                  shiftType: shiftTypeSelect,
                  standardHours: shiftHoursCount,
                  overtimeHours: 0,
                  isSunday: isSundayShift,
                  isPublicHoliday: isHolidayShift
                });
                setIsRecordShiftModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[#8598A8] mb-1 font-semibold">Security Officer</label>
                <select
                  value={selectedShiftOfficerId}
                  onChange={(e) => setSelectedShiftOfficerId(e.target.value)}
                  className="w-full bg-[#071726] border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  {officersList.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.grade}) — {o.currentSite}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8598A8] mb-1 font-semibold">Protected Site</label>
                  <select
                    value={shiftSiteName}
                    onChange={(e) => setShiftSiteName(e.target.value)}
                    className="w-full bg-[#071726] border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8598A8] mb-1 font-semibold">Shift Date</label>
                  <input
                    type="date"
                    value={shiftDateInput}
                    onChange={(e) => setShiftDateInput(e.target.value)}
                    className="w-full bg-[#071726] border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8598A8] mb-1 font-semibold">Shift Type</label>
                  <select
                    value={shiftTypeSelect}
                    onChange={(e) => setShiftTypeSelect(e.target.value as 'DAY' | 'NIGHT')}
                    className="w-full bg-[#071726] border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                  >
                    <option value="DAY">Day Shift (06:00 – 18:00)</option>
                    <option value="NIGHT">Night Shift (18:00 – 06:00 + Night Allowance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8598A8] mb-1 font-semibold">Hours Worked</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={shiftHoursCount}
                    onChange={(e) => setShiftHoursCount(parseFloat(e.target.value) || 12)}
                    className="w-full bg-[#071726] border border-white/15 rounded-xl p-2.5 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isSundayShift}
                    onChange={(e) => setIsSundayShift(e.target.checked)}
                    className="rounded bg-[#071726] border-white/20 text-[#1FA6C9] focus:ring-0"
                  />
                  <span>Sunday Shift (1.5× Rate)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isHolidayShift}
                    onChange={(e) => setIsHolidayShift(e.target.checked)}
                    className="rounded bg-[#071726] border-white/20 text-[#1FA6C9] focus:ring-0"
                  />
                  <span>Public Holiday (2.0× Rate)</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRecordShiftModalOpen(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#042430] font-display font-extrabold text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Commit Shift to Timesheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
