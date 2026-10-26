import React, { useState, useEffect, useMemo } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { saveRosterPlanToCloud } from '../services/firestoreDutyOn';

interface Guard {
  id: number;
  name: string;
  grade: string;
  shifts: Record<string, string>;
}

interface RosterState {
  mode: 'week' | 'month';
  weekStart: string;
  month: string;
  site: string;
  supervisor: string;
  contract: string;
  dayStart: string;
  dayEnd: string;
  nightStart: string;
  nightEnd: string;
  reqDay: number;
  reqNight: number;
  maxConsec: number;
  guards: Guard[];
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const CYCLE = ['', 'D', 'N', 'O', 'L'] as const;
const KEY = 'dutyon.roster.v2';

function pad(n: number): string {
  return (n < 10 ? '0' : '') + n;
}

function dstr(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function parseD(s: string): Date {
  const p = s.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

function mondayThisWeek(): string {
  const d = new Date();
  const k = d.getDay();
  const diff = k === 0 ? -6 : 1 - k;
  d.setDate(d.getDate() + diff);
  return dstr(d);
}

function thisMonth(): string {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1);
}

function daysInMonth(ym: string): number {
  const p = ym.split('-');
  return new Date(+p[0], +p[1], 0).getDate();
}

function hoursBetween(a: string, b: string): number {
  const s = +a.slice(0, 2) + +a.slice(3) / 60;
  const e = +b.slice(0, 2) + +b.slice(3) / 60;
  let h = e - s;
  if (h <= 0) h += 24;
  return h;
}

const INITIAL_GUARDS: Guard[] = [
  { id: 1, name: 'Thando Mahlangu', grade: 'C', shifts: {} },
  { id: 2, name: 'Nomsa Dlamini', grade: 'B', shifts: {} },
  { id: 3, name: 'Sipho Nxumalo', grade: 'C', shifts: {} },
  { id: 4, name: 'Lerato Maseko', grade: 'B', shifts: {} }
];

export const SecurityRosterMaker: React.FC = () => {
  const { sites, officersList, showToast } = useDutyOn();

  // Initialize state from localStorage or defaults
  const [state, setState] = useState<RosterState>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.guards) && parsed.guards.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading roster from localStorage', e);
    }
    return {
      mode: 'week',
      weekStart: mondayThisWeek(),
      month: thisMonth(),
      site: '',
      supervisor: '',
      contract: '',
      dayStart: '06:00',
      dayEnd: '18:00',
      nightStart: '18:00',
      nightEnd: '06:00',
      reqDay: 2,
      reqNight: 2,
      maxConsec: 6,
      guards: INITIAL_GUARDS
    };
  });

  // Save to localStorage & debounced cloud
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}

    const timer = setTimeout(() => {
      saveRosterPlanToCloud({
        id: `dutyon_roster_plan_${state.mode}`,
        siteName: state.site || 'Provincial Office',
        siteSupervisor: state.supervisor || 'Operations In-Charge',
        contractNo: state.contract || 'TKD-CT-094',
        periodType: state.mode,
        year: parseInt(state.weekStart.slice(0, 4)) || 2026,
        month: parseInt(state.month.slice(5, 7)) || 10,
        weekStarting: state.weekStart,
        dayShiftStart: state.dayStart,
        dayShiftEnd: state.dayEnd,
        nightShiftStart: state.nightStart,
        nightShiftEnd: state.nightEnd,
        postsDay: state.reqDay,
        postsNight: state.reqNight,
        guards: state.guards.map((g) => ({
          id: String(g.id),
          name: g.name,
          grade: g.grade,
          shifts: g.shifts
        })),
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [state]);

  // Period dates
  const periodDates = useMemo<Date[]>(() => {
    const out: Date[] = [];
    if (state.mode === 'month') {
      const n = daysInMonth(state.month);
      const p = state.month.split('-');
      for (let i = 1; i <= n; i++) {
        out.push(new Date(+p[0], +p[1] - 1, i));
      }
    } else {
      const base = parseD(state.weekStart);
      for (let i = 0; i < 7; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        out.push(d);
      }
    }
    return out;
  }, [state.mode, state.weekStart, state.month]);

  const dH = hoursBetween(state.dayStart, state.dayEnd);
  const nH = hoursBetween(state.nightStart, state.nightEnd);

  // Field change helper
  const updateField = <K extends keyof RosterState>(key: K, value: RosterState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  // Add guard
  const addGuard = () => {
    const nextId = state.guards.length > 0 ? Math.max(...state.guards.map((g) => g.id)) + 1 : 1;
    setState((prev) => ({
      ...prev,
      guards: [...prev.guards, { id: nextId, name: '', grade: 'C', shifts: {} }]
    }));
  };

  // Remove guard
  const removeGuard = (index: number) => {
    setState((prev) => {
      const next = [...prev.guards];
      next.splice(index, 1);
      return { ...prev, guards: next };
    });
  };

  // Clear shifts
  const clearAll = () => {
    const ds = periodDates.map(dstr);
    setState((prev) => ({
      ...prev,
      guards: prev.guards.map((g) => {
        const nextShifts = { ...g.shifts };
        ds.forEach((k) => {
          delete nextShifts[k];
        });
        return { ...g, shifts: nextShifts };
      })
    }));
    showToast(`✓ All shift assignments cleared for this ${state.mode}`);
  };

  // Cycle shift cell
  const cycleCell = (guardIndex: number, dateStr: string) => {
    setState((prev) => {
      const nextGuards = [...prev.guards];
      const target = { ...nextGuards[guardIndex], shifts: { ...nextGuards[guardIndex].shifts } };
      const cur = target.shifts[dateStr] || '';
      const idx = CYCLE.indexOf(cur as any);
      const nx = CYCLE[(idx + 1) % CYCLE.length];
      if (nx) {
        target.shifts[dateStr] = nx;
      } else {
        delete target.shifts[dateStr];
      }
      nextGuards[guardIndex] = target;
      return { ...prev, guards: nextGuards };
    });
  };

  // Auto-roster generator
  const autoRoster = () => {
    const G = state.guards;
    if (G.length === 0) {
      showToast('Add some officers first.');
      return;
    }
    const dates = periodDates.map(dstr);
    const reqD = +state.reqDay || 0;
    const reqN = +state.reqNight || 0;
    const maxC = Math.max(1, +state.maxConsec || 6);
    const stat = G.map(() => ({ hrs: 0, prev: '', consec: 0 }));

    const updatedGuards = G.map((g) => ({
      ...g,
      shifts: { ...g.shifts }
    }));

    dates.forEach((ds) => {
      updatedGuards.forEach((g) => {
        delete g.shifts[ds];
      });

      const idx = updatedGuards.map((_, i) => i);
      const elig = (i: number) => stat[i].consec < maxC;

      // NIGHT first: prefer night continuity, never straight after a Day, fewest hours
      const nc = idx.filter((i) => elig(i) && stat[i].prev !== 'D');
      nc.sort((a, b) => {
        const pa = stat[a].prev === 'N' ? 0 : 1;
        const pb = stat[b].prev === 'N' ? 0 : 1;
        return pa !== pb ? pa - pb : stat[a].hrs - stat[b].hrs;
      });
      const night = nc.slice(0, reqN);

      // DAY: eligible, not straight after a Night, not already on night, fewest hours
      const dc = idx.filter((i) => elig(i) && stat[i].prev !== 'N' && night.indexOf(i) === -1);
      dc.sort((a, b) => {
        const pa = stat[a].prev === 'D' ? 0 : 1;
        const pb = stat[b].prev === 'D' ? 0 : 1;
        return pa !== pb ? pa - pb : stat[a].hrs - stat[b].hrs;
      });
      const day = dc.slice(0, reqD);

      updatedGuards.forEach((g, i) => {
        const code = night.indexOf(i) > -1 ? 'N' : day.indexOf(i) > -1 ? 'D' : 'O';
        if (code === 'O') {
          stat[i].consec = 0;
          stat[i].prev = 'O';
        } else {
          g.shifts[ds] = code;
          stat[i].consec++;
          stat[i].prev = code;
          stat[i].hrs += code === 'N' ? nH : dH;
        }
      });
    });

    setState((prev) => ({ ...prev, guards: updatedGuards }));

    // Check shortfall
    let bad = 0;
    dates.forEach((ds) => {
      let d = 0;
      let n = 0;
      updatedGuards.forEach((g) => {
        if (g.shifts[ds] === 'D') d++;
        if (g.shifts[ds] === 'N') n++;
      });
      if (d < reqD || n < reqN) bad++;
    });

    if (bad > 0) {
      showToast(`Auto-roster generated: ${bad} day(s) short of posts — add more guards or lower required posts.`);
    } else {
      showToast('✓ Auto-roster generated with fair rotation & rest days!');
    }
  };

  // CSV Export
  const exportCSV = () => {
    const dates = periodDates;
    const head = ['Security Officer', 'Grade']
      .concat(dates.map((d) => `${WD[d.getDay()]} ${d.getDate()}`))
      .concat(['Total hrs', 'Shifts']);
    const rows = [head];
    state.guards.forEach((g) => {
      let sh = 0;
      let hr = 0;
      const cells = dates.map((d) => {
        const v = g.shifts[dstr(d)] || '';
        if (v === 'D') {
          sh++;
          hr += dH;
        }
        if (v === 'N') {
          sh++;
          hr += nH;
        }
        return v;
      });
      rows.push([g.name, g.grade].concat(cells).concat([hr.toFixed(0), String(sh)]));
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const filename = `Duty_On_Roster_${state.mode === 'month' ? state.month : state.weekStart}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    showToast(`✓ Exported ${filename}`);
  };

  // Range metadata text
  const rangeTxt = useMemo(() => {
    if (state.mode === 'month') {
      return parseD(state.month + '-01').toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
    }
    const d0 = periodDates[0];
    const d6 = periodDates[6];
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return (
      (d0 ? d0.toLocaleDateString('en-ZA', opts) : '') + ' – ' + (d6 ? d6.toLocaleDateString('en-ZA', opts) : '')
    );
  }, [state.mode, state.month, periodDates]);

  // Recommended officers calculation
  const postsTotal = (+state.reqDay || 0) + (+state.reqNight || 0);
  const recOfficers = Math.ceil((postsTotal * 7) / 4);

  // Total man-hours calculated
  const totalManHours = useMemo(() => {
    let tot = 0;
    state.guards.forEach((g) => {
      periodDates.forEach((d) => {
        const v = g.shifts[dstr(d)];
        if (v === 'D') tot += dH;
        if (v === 'N') tot += nH;
      });
    });
    return tot;
  }, [state.guards, periodDates, dH, nH]);

  return (
    <div className="space-y-4">
      {/* Exact CSS styles matching the standalone HTML and screenshot */}
      <style>{`
        .roster-appbar {
          background: linear-gradient(120deg, #0A1E33, #0E2A45);
          color: #eaf3f8;
          padding: 14px 20px;
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(11,30,48,.25);
        }
        .roster-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .roster-logo {
          height: 28px;
          width: 56px;
          background: #0A1E33;
          border: 1.5px solid rgba(255,255,255,0.15);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .roster-title {
          font-family: 'Archivo', system-ui, sans-serif;
          font-weight: 800;
          font-size: 18px;
          letter-spacing: .01em;
          color: #fff;
          line-height: 1.1;
        }
        .roster-subtitle {
          font-size: 11px;
          color: #8598A8;
          letter-spacing: .12em;
          text-transform: uppercase;
          margin-top: 2px;
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
        }
        .roster-btn {
          border: 1px solid transparent;
          border-radius: 8px;
          font-family: 'Archivo', system-ui, sans-serif;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: all .15s ease;
          cursor: pointer;
        }
        .roster-btn-green {
          background: #3AA655;
          color: #fff;
        }
        .roster-btn-green:hover {
          background: #32944b;
        }
        .roster-btn-teal {
          background: #1FA6C9;
          color: #04222c;
        }
        .roster-btn-teal:hover {
          background: #3FC9E9;
        }
        .roster-btn-ghost {
          background: rgba(255,255,255,.08);
          color: #dfeaf2;
          border-color: rgba(255,255,255,.16);
        }
        .roster-btn-ghost:hover {
          border-color: #1FA6C9;
          background: rgba(255,255,255,.14);
        }
        .roster-btn-line {
          background: #fff;
          color: #123A5E;
          border: 1px solid #dce4ec;
        }
        .roster-btn-line:hover {
          border-color: #1FA6C9;
          color: #1FA6C9;
        }
        .roster-card {
          background: #FFFFFF;
          border: 1px solid #dce4ec;
          border-radius: 14px;
          padding: 18px 20px;
          box-shadow: 0 1px 3px rgba(11,30,48,.05);
          color: #0B1E30;
        }
        .roster-fld {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .roster-fld label {
          font-size: 11px;
          font-weight: 600;
          color: #5D6E7E;
          text-transform: uppercase;
          letter-spacing: .05em;
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
        }
        .roster-fld input, .roster-fld select {
          border: 1.5px solid #dce4ec;
          border-radius: 9px;
          padding: 8px 11px;
          font-size: 13.5px;
          color: #0B1E30;
          background: #fff;
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
        }
        .roster-fld input:focus, .roster-fld select:focus {
          outline: none;
          border-color: #1FA6C9;
        }
        .roster-seg {
          display: inline-flex;
          background: #eef3f8;
          border: 1px solid #dce4ec;
          border-radius: 9px;
          padding: 3px;
          gap: 3px;
        }
        .roster-seg button {
          border: none;
          background: none;
          border-radius: 7px;
          font-family: 'Archivo', system-ui, sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: #5D6E7E;
          padding: 6px 16px;
          cursor: pointer;
          transition: all .15s ease;
        }
        .roster-seg button.on {
          background: #1FA6C9;
          color: #04222c;
        }
        .roster-legend {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
        }
        .roster-lg-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          color: #33475b;
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
        }
        .roster-sw {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid rgba(0,0,0,.08);
          display: inline-block;
        }
        .roster-sw.d { background: #e7f5ec; border-color: #bfe3cb; }
        .roster-sw.n { background: #e4eef7; border-color: #c2d8ec; }
        .roster-sw.o { background: #eef2f6; border-color: #dce4ec; }
        .roster-sw.l { background: #fdf3e3; border-color: #f0d9ac; }
        .roster-need {
          font-size: 12.5px;
          color: #33475b;
          background: #eef6f9;
          border: 1px solid #d4e7ef;
          border-radius: 9px;
          padding: 8px 13px;
          font-weight: 600;
        }
        .roster-tbl-wrap {
          overflow-x: auto;
          border: 1px solid #dce4ec;
          border-radius: 12px;
          background: #fff;
        }
        .roster-table {
          border-collapse: collapse;
          width: 100%;
          background: #fff;
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
        }
        .roster-table th, .roster-table td {
          border-bottom: 1px solid #e7edf3;
          border-right: 1px solid #e7edf3;
          padding: 0;
          text-align: center;
        }
        .roster-table th {
          background: #f6f9fc;
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 10.5px;
          letter-spacing: .03em;
          text-transform: uppercase;
          color: #5D6E7E;
          padding: 8px 5px;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .roster-table th.wknd {
          background: #eef4fa;
          color: #123A5E;
        }
        .roster-cell {
          cursor: pointer;
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-weight: 600;
          user-select: none;
          transition: background .1s;
        }
        .roster-table.week .roster-cell {
          width: 86px;
          height: 44px;
          font-size: 12px;
        }
        .roster-table.month .roster-cell {
          width: 32px;
          height: 40px;
          font-size: 11px;
        }
        .roster-cell:hover {
          box-shadow: inset 0 0 0 2px #1FA6C9;
        }
        .roster-cell .lbl {
          display: block;
          line-height: 1.1;
        }
        .roster-cell .tm {
          display: block;
          font-size: 8.5px;
          font-weight: 500;
          opacity: .72;
        }
        .roster-table.month .roster-cell .tm {
          display: none;
        }
        .roster-cell.D { background: #e7f5ec; color: #1e7a3d; }
        .roster-cell.N { background: #e4eef7; color: #1a5a94; }
        .roster-cell.O { background: #f2f5f8; color: #8598A8; }
        .roster-cell.L { background: #fdf3e3; color: #9a6412; }
        .roster-cell.empty { background: #fff; color: #c8d3dd; }
        .roster-cov {
          font-family: 'Archivo', system-ui, sans-serif;
          font-weight: 700;
        }
        .roster-cov.ok { color: #3AA655; }
        .roster-cov.short { color: #E0574B; }
        .roster-cov.over { color: #E7A13A; }
        .roster-sign {
          display: none;
        }
        @media print {
          @page { size: landscape; margin: 10mm; }
          .no-print { display: none !important; }
          body, main { background: #fff !important; font-size: 10px; padding: 0 !important; }
          .roster-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
          .roster-tbl-wrap { border: 1px solid #333 !important; border-radius: 0 !important; overflow: visible !important; }
          .roster-table { min-width: 0 !important; }
          .roster-table th, .roster-table td { border-color: #999 !important; }
          .roster-cell:hover { box-shadow: none !important; }
          .roster-sign {
            display: flex !important;
            justify-content: space-between;
            margin-top: 22px;
            gap: 40px;
          }
          .roster-sign div {
            flex: 1;
            border-top: 1px solid #333;
            padding-top: 6px;
            font-size: 10px;
            color: #333;
          }
        }
      `}</style>

      {/* ---------------- 1. APPBAR (MATCHING SCREENSHOT) ---------------- */}
      <div className="roster-appbar no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="roster-brand">
            <span className="roster-logo">
              {/* Tikedi Holdings double-oval emblem */}
              <svg width="44" height="22" viewBox="0 0 52 26" fill="none">
                <circle cx="17" cy="13" r="8.5" stroke="#1FA6C9" strokeWidth="2.5" />
                <circle cx="35" cy="13" r="8.5" stroke="#1FA6C9" strokeWidth="2.5" />
                <line x1="26" y1="5" x2="26" y2="21" stroke="#5BCB80" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <div className="roster-title">Security Roster Maker</div>
              <div className="roster-subtitle">Duty On · by Tikedi Holdings</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button className="roster-btn roster-btn-green" onClick={autoRoster}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
                <circle cx="12" cy="12" r="3.2" />
              </svg>
              <span>Auto-roster</span>
            </button>

            <button className="roster-btn roster-btn-ghost" onClick={addGuard}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Add guard</span>
            </button>

            <button className="roster-btn roster-btn-ghost" onClick={clearAll}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
              </svg>
              <span>Clear</span>
            </button>

            <button className="roster-btn roster-btn-line" onClick={exportCSV}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12M8 11l4 4 4-4M4 21h16" />
              </svg>
              <span>CSV</span>
            </button>

            <button className="roster-btn roster-btn-teal" onClick={() => window.print()}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V3h12v6M6 18H4v-6h16v6h-2M8 14h8v7H8z" />
              </svg>
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- 2. SETUP CARD (MATCHING SCREENSHOT) ---------------- */}
      <div className="roster-card no-print space-y-4">
        {/* Row 1: Period, Week/Month pickers, Site, Supervisor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          <div className="roster-fld lg:col-span-2">
            <label>Period</label>
            <div className="roster-seg">
              <button
                type="button"
                className={state.mode === 'week' ? 'on' : ''}
                onClick={() => updateField('mode', 'week')}
              >
                Week
              </button>
              <button
                type="button"
                className={state.mode === 'month' ? 'on' : ''}
                onClick={() => updateField('mode', 'month')}
              >
                Month
              </button>
            </div>
          </div>

          <div className="roster-fld lg:col-span-3">
            <label>Week starting (Mon)</label>
            <input
              type="date"
              value={state.weekStart}
              onChange={(e) => updateField('weekStart', e.target.value)}
            />
          </div>

          <div className="roster-fld lg:col-span-3">
            <label>Month</label>
            <input
              type="month"
              value={state.month}
              onChange={(e) => updateField('month', e.target.value)}
            />
          </div>

          <div className="roster-fld lg:col-span-4">
            <label>Site / client</label>
            <input
              type="text"
              list="dutyon-sites-list"
              value={state.site}
              onChange={(e) => updateField('site', e.target.value)}
              placeholder="e.g. Kwamagxaki Shopping Centre"
            />
            <datalist id="dutyon-sites-list">
              {sites.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Row 2: Site Supervisor, Day Shift, Night Shift, Contract No */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          <div className="roster-fld lg:col-span-3">
            <label>Site supervisor</label>
            <input
              type="text"
              value={state.supervisor}
              onChange={(e) => updateField('supervisor', e.target.value)}
              placeholder="e.g. T. Mkhize"
            />
          </div>

          <div className="roster-fld lg:col-span-3">
            <label>Day shift</label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                className="w-full text-center"
                value={state.dayStart}
                onChange={(e) => updateField('dayStart', e.target.value)}
              />
              <input
                type="time"
                className="w-full text-center"
                value={state.dayEnd}
                onChange={(e) => updateField('dayEnd', e.target.value)}
              />
            </div>
          </div>

          <div className="roster-fld lg:col-span-3">
            <label>Night shift</label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                className="w-full text-center"
                value={state.nightStart}
                onChange={(e) => updateField('nightStart', e.target.value)}
              />
              <input
                type="time"
                className="w-full text-center"
                value={state.nightEnd}
                onChange={(e) => updateField('nightEnd', e.target.value)}
              />
            </div>
          </div>

          <div className="roster-fld lg:col-span-3">
            <label>Contract no.</label>
            <input
              type="text"
              value={state.contract}
              onChange={(e) => updateField('contract', e.target.value)}
              placeholder="TKD-CT-…"
            />
          </div>
        </div>

        {/* Legend row */}
        <div className="flex items-center gap-4 pt-1">
          <div className="roster-legend">
            <span className="roster-lg-item">
              <span className="roster-sw d" /> Day
            </span>
            <span className="roster-lg-item">
              <span className="roster-sw n" /> Night
            </span>
            <span className="roster-lg-item">
              <span className="roster-sw o" /> Off
            </span>
            <span className="roster-lg-item">
              <span className="roster-sw l" /> Leave
            </span>
          </div>
        </div>

        {/* Row 3 / Autobar: Posts per Day, Posts per Night, Max consec, Generate button, Need hint */}
        <div className="flex flex-wrap items-end gap-3.5 pt-3.5 border-t border-dashed border-[#dce4ec]">
          <div className="roster-fld min-w-[140px]">
            <label>Officers per Day shift</label>
            <input
              type="number"
              min="0"
              value={state.reqDay}
              onChange={(e) => updateField('reqDay', Math.max(0, +e.target.value || 0))}
            />
          </div>

          <div className="roster-fld min-w-[140px]">
            <label>Officers per Night shift</label>
            <input
              type="number"
              min="0"
              value={state.reqNight}
              onChange={(e) => updateField('reqNight', Math.max(0, +e.target.value || 0))}
            />
          </div>

          <div className="roster-fld min-w-[140px]">
            <label>Max consecutive shifts</label>
            <input
              type="number"
              min="1"
              value={state.maxConsec}
              onChange={(e) => updateField('maxConsec', Math.max(1, +e.target.value || 1))}
            />
          </div>

          <button className="roster-btn roster-btn-green mb-[1px]" onClick={autoRoster}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
              <circle cx="12" cy="12" r="3.2" />
            </svg>
            <span>Generate auto-roster</span>
          </button>

          <div className="roster-need">
            <b>{postsTotal}</b> posts/day → about <b>{recOfficers}</b> officers recommended
          </div>
        </div>

        {/* Instruction Hint */}
        <div className="text-xs text-[#8598A8] mt-2 font-sans">
          Click any cell to cycle <b className="text-[#33475b]">Day → Night → Off → Leave → blank</b>.{' '}
          <b className="text-[#33475b]">Auto-roster</b> fills the whole period to meet your officers-per-shift, rotating fairly with rest after nights and a cap on consecutive shifts. Everything saves in this browser. Use <b className="text-[#33475b]">Print / PDF</b> for a signable roster.
        </div>
      </div>

      {/* ---------------- 3. DUTY ROSTER CARD (MATCHING SCREENSHOT) ---------------- */}
      <div className="roster-card space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-display font-extrabold text-xl text-[#0B1E30]">
            {state.site || 'Duty Roster'}
          </h2>
          <div className="font-mono text-xs text-[#5D6E7E]">
            {(state.mode === 'month' ? 'Month: ' : 'Week: ') + rangeTxt}
            {state.supervisor ? `  ·  Supervisor: ${state.supervisor}` : ''}
            {state.contract ? `  ·  ${state.contract}` : ''}
          </div>
        </div>

        {/* Roster Table */}
        <div className="roster-tbl-wrap">
          <table className={`roster-table ${state.mode}`}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingLeft: '12px' }}>Security Officer</th>
                <th style={{ width: '56px' }}>GR</th>
                {periodDates.map((d) => {
                  const isWknd = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <th key={dstr(d)} className={isWknd ? 'wknd' : ''}>
                      <span className="block text-[9px] text-[#8598A8] font-normal leading-tight">
                        {WD[d.getDay()]}
                      </span>
                      <span className="block font-display font-bold text-[13px] text-[#0B1E30] leading-tight">
                        {d.getDate()}
                      </span>
                    </th>
                  );
                })}
                <th style={{ width: '92px' }}>Total</th>
                <th style={{ width: '32px' }} className="no-print" />
              </tr>
            </thead>

            <tbody>
              {state.guards.map((g, gi) => {
                let shifts = 0;
                let hrs = 0;

                return (
                  <tr key={g.id}>
                    <td style={{ textAlign: 'left' }}>
                      <input
                        type="text"
                        list="dutyon-officers-list"
                        value={g.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setState((prev) => {
                            const next = [...prev.guards];
                            next[gi] = { ...next[gi], name: val };
                            return { ...prev, guards: next };
                          });
                        }}
                        placeholder="Officer name"
                        style={{
                          width: '154px',
                          border: 'none',
                          background: 'transparent',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#0B1E30',
                          padding: '9px 10px',
                          outline: 'none'
                        }}
                      />
                    </td>

                    <td>
                      <select
                        value={g.grade}
                        onChange={(e) => {
                          const val = e.target.value;
                          setState((prev) => {
                            const next = [...prev.guards];
                            next[gi] = { ...next[gi], grade: val };
                            return { ...prev, guards: next };
                          });
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          color: '#33475b',
                          padding: '8px 2px',
                          textAlign: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {['A', 'B', 'C', 'D', 'E'].map((gr) => (
                          <option key={gr} value={gr}>
                            {gr}
                          </option>
                        ))}
                      </select>
                    </td>

                    {periodDates.map((d) => {
                      const ds = dstr(d);
                      const v = g.shifts[ds] || '';
                      const cls = v || 'empty';
                      const tm =
                        v === 'D'
                          ? `${state.dayStart}-${state.dayEnd}`
                          : v === 'N'
                          ? `${state.nightStart}-${state.nightEnd}`
                          : '';

                      if (v === 'D') {
                        shifts++;
                        hrs += dH;
                      }
                      if (v === 'N') {
                        shifts++;
                        hrs += nH;
                      }

                      return (
                        <td
                          key={ds}
                          className={`roster-cell ${cls}`}
                          onClick={() => cycleCell(gi, ds)}
                        >
                          <span className="lbl">{v || '·'}</span>
                          {tm ? <span className="tm">{tm}</span> : null}
                        </td>
                      );
                    })}

                    <td
                      style={{
                        fontFamily: 'Archivo, system-ui, sans-serif',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: '#0B1E30',
                        background: '#fafcfe',
                        padding: '0 8px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {hrs.toFixed(0)}
                      <span style={{ fontSize: '9.5px', fontWeight: 500, color: '#8598A8', fontFamily: 'sans-serif' }}>
                        {' '}hrs · {shifts}
                      </span>
                    </td>

                    <td className="no-print" style={{ width: '32px' }}>
                      <button
                        title="Remove guard"
                        onClick={() => removeGuard(gi)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#8598A8',
                          fontSize: '16px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '7px',
                          cursor: 'pointer'
                        }}
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                );
              })}

              {state.guards.length === 0 && (
                <tr>
                  <td colSpan={periodDates.length + 4} style={{ padding: '26px', color: '#8598A8' }}>
                    No officers yet — click “Add guard”.
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot>
              {/* Day Cover */}
              <tr>
                <td
                  colSpan={2}
                  style={{
                    textAlign: 'right',
                    color: '#5D6E7E',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '.03em',
                    whiteSpace: 'nowrap',
                    paddingRight: '10px'
                  }}
                >
                  Day cover (need {state.reqDay})
                </td>
                {periodDates.map((d) => {
                  const ds = dstr(d);
                  let c = 0;
                  state.guards.forEach((g) => {
                    if (g.shifts[ds] === 'D') c++;
                  });
                  const st = c < state.reqDay ? 'short' : c > state.reqDay ? 'over' : 'ok';
                  return (
                    <td key={ds}>
                      <span className={`roster-cov ${st}`}>{c}</span>
                    </td>
                  );
                })}
                <td />
                <td className="no-print" />
              </tr>

              {/* Night Cover */}
              <tr>
                <td
                  colSpan={2}
                  style={{
                    textAlign: 'right',
                    color: '#5D6E7E',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '.03em',
                    whiteSpace: 'nowrap',
                    paddingRight: '10px'
                  }}
                >
                  Night cover (need {state.reqNight})
                </td>
                {periodDates.map((d) => {
                  const ds = dstr(d);
                  let c = 0;
                  state.guards.forEach((g) => {
                    if (g.shifts[ds] === 'N') c++;
                  });
                  const st = c < state.reqNight ? 'short' : c > state.reqNight ? 'over' : 'ok';
                  return (
                    <td key={ds}>
                      <span className={`roster-cov ${st}`}>{c}</span>
                    </td>
                  );
                })}
                <td />
                <td className="no-print" />
              </tr>

              {/* Total man-hours */}
              <tr>
                <td
                  colSpan={2}
                  style={{
                    textAlign: 'right',
                    color: '#5D6E7E',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '.03em',
                    whiteSpace: 'nowrap',
                    paddingRight: '10px'
                  }}
                >
                  Total man-hours
                </td>
                <td
                  colSpan={periodDates.length}
                  style={{
                    textAlign: 'left',
                    paddingLeft: '10px',
                    fontFamily: 'Archivo, system-ui, sans-serif',
                    fontWeight: 700
                  }}
                >
                  {totalManHours.toFixed(0)} hrs
                </td>
                <td />
                <td className="no-print" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Add guard row below table */}
        <div className="flex items-center gap-2.5 no-print pt-2 flex-wrap">
          <button className="roster-btn roster-btn-line" onClick={addGuard}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add guard</span>
          </button>
          <span className="text-[11.5px] text-[#8598A8]">
            Set each officer's PSIRA grade; totals and Day/Night coverage update live. Red coverage = short of required posts.
          </span>
        </div>

        {/* Printable Signatures Block */}
        <div className="roster-sign">
          <div>Compiled by (Ops Manager): _______________________</div>
          <div>Site Supervisor: _______________________</div>
          <div>Date: ______________</div>
        </div>
      </div>

      {/* Datalist for officer name quick suggestions */}
      <datalist id="dutyon-officers-list">
        {officersList.map((off) => (
          <option key={off.id} value={off.name}>
            {off.grade} · {off.currentSite}
          </option>
        ))}
      </datalist>
    </div>
  );
};
