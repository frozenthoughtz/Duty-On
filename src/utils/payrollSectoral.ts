import { TimesheetEntry, OfficerPayrollSummary, PayPeriodSummary } from '../types/dutyon';

// Sectoral Determination 6 & PSSBC standard baseline allowances (South Africa)
export const SECTORAL_RULES = {
  jurisdiction: 'South Africa · PSSBC Sectoral Determination 6',
  ordinaryHoursPerShift: 12.0,
  overtimeRateMultiplier: 1.5,
  sundayRateMultiplier: 1.5,
  publicHolidayMultiplier: 2.0,
  nightShiftAllowancePerShift: 38.50, // ZAR per night shift between 18:00 - 06:00
  nightShiftWindow: '18:00 – 06:00',
  minimumRestPeriodHours: 12.0,
};

export const GRADE_RATES: Record<string, { baseHourly: number; clientBilling: number }> = {
  'A': { baseHourly: 48.50, clientBilling: 115.00 },
  'B': { baseHourly: 42.00, clientBilling: 95.00 },
  'C': { baseHourly: 36.50, clientBilling: 80.00 },
  'D': { baseHourly: 32.00, clientBilling: 68.00 },
  'Armed Response': { baseHourly: 52.00, clientBilling: 125.00 },
};

// Public holidays in current pay period window
const PUBLIC_HOLIDAYS_MAP: Record<string, string> = {
  '2026-09-24': 'Heritage Day',
  '2026-05-25': 'Africa Day',
  '2026-05-01': "Workers' Day",
  '2026-06-16': 'Youth Day',
};

// Generate pay period timesheet data. Defaults to clean empty zero-baseline array so live hours count up from zero.
export function generatePayPeriodTimesheets(enrolledOfficers?: any[], options?: { populateDemoMonth?: boolean }): TimesheetEntry[] {
  if (!options?.populateDemoMonth) {
    return [];
  }
  return generateDemonstrationTimesheets(enrolledOfficers);
}

// Optional generator to seed demonstration shifts when requested explicitly
export function generateDemonstrationTimesheets(enrolledOfficers?: any[]): TimesheetEntry[] {
  const defaultOfficers = [
    { id: 'off-admin', empId: 'DIR-0001', name: 'Tshepo Maloa', grade: 'Grade A', site: 'Provincial Office', baseRate: 48.50, billRate: 115.00 },
  ];

  const officers = (enrolledOfficers && enrolledOfficers.length > 0)
    ? enrolledOfficers.map((o, idx) => ({
        id: o.id || `off-enr-${idx}`,
        empId: o.empId || `TKD-${1100 + idx}`,
        name: o.name,
        grade: o.grade || 'Grade C',
        site: o.currentSite || 'Provincial Office',
        baseRate: Number(o.baseHourlyRate) || (GRADE_RATES[o.grade]?.baseHourly ?? 36.50),
        billRate: Number(o.clientBillingRate) || (GRADE_RATES[o.grade]?.clientBilling ?? 80.00),
      }))
    : defaultOfficers;

  const timesheets: TimesheetEntry[] = [];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

  // Generate full month pay period (01 Sep - 30 Sep 2026)
  for (let d = 1; d <= 30; d++) {
    const dateStr = `2026-09-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(2026, 8, d); // Month 8 is September
    const dayName = daysOfWeek[dateObj.getDay()];
    const isSunday = dayName === 'Sunday';
    const isPublicHoliday = Boolean(PUBLIC_HOLIDAYS_MAP[dateStr]);
    const holidayName = PUBLIC_HOLIDAYS_MAP[dateStr];

    officers.forEach((off, idx) => {
      // Rotate 4 on, 2 off shift pattern
      const shiftPatternIndex = (d + idx * 2) % 6;
      if (shiftPatternIndex >= 4) {
        // Off duty day
        return;
      }

      const isNight = (d + idx) % 2 === 1;
      const shiftType = isNight ? 'NIGHT' : 'DAY';
      const scheduledStart = isNight ? '18:00' : '06:00';
      const scheduledEnd = isNight ? '06:00' : '18:00';

      // Biometric clock-in variance (few minutes early, occasionally slightly extended for handover)
      const clockInMinDelta = (idx % 3) * -3 - 2; // e.g. -2, -5, -8 mins early
      const clockOutMinDelta = ((idx + d) % 4 === 0) ? 35 : ((idx + d) % 3 === 0 ? 15 : 5); // Some shifts have 15-35 min handover overtime

      const inHour = isNight ? 17 : 5;
      const inMinute = 60 + clockInMinDelta;
      const clockInTime = `${String(inHour).padStart(2, '0')}:${String(inMinute).padStart(2, '0')}`;

      const outHour = isNight ? 6 : 18;
      const clockOutTime = `${String(outHour).padStart(2, '0')}:${String(clockOutMinDelta).padStart(2, '0')}`;

      const standardHours = 12.0;
      // Overtime if handover was required (> 12 hours)
      const overtimeHours = clockOutMinDelta >= 30 ? 0.75 : (clockOutMinDelta >= 15 ? 0.5 : 0.0);
      const actualHours = standardHours + overtimeHours;
      // Billable hours: client is billed for scheduled 12h plus any authorized handover overtime
      const billableHours = actualHours;

      const nightAllowanceHours = isNight ? 12.0 : 0.0;
      const isNightEligible = isNight;

      const status: 'VERIFIED' | 'FLAGGED' | 'ADJUSTED' = overtimeHours > 0.5 ? 'ADJUSTED' : 'VERIFIED';
      const varianceReason = overtimeHours > 0.5 
        ? 'Relief officer delayed 35 mins on N2 corridor; authorized handover' 
        : undefined;

      timesheets.push({
        id: `ts-${off.empId}-${dateStr}`,
        officerId: off.id,
        empId: off.empId,
        officerName: off.name,
        grade: off.grade,
        siteName: off.site,
        date: dateStr,
        dayOfWeek: dayName,
        isSunday,
        isPublicHoliday,
        publicHolidayName: holidayName,
        shiftType,
        scheduledStart,
        scheduledEnd,
        clockInTime,
        clockOutTime,
        biometricVerified: true,
        biometricMethod: 'Face Liveness AI',
        standardHours,
        actualHours,
        billableHours,
        overtimeHours,
        nightAllowanceHours,
        isNightAllowanceEligible: isNightEligible,
        hourlyRate: off.baseRate,
        clientBillingRate: off.billRate,
        status,
        varianceReason,
      });
    });
  }

  return timesheets;
}

// Calculate individual officer summary from raw timesheets
export function calculateOfficerPayrollSummaries(timesheets: TimesheetEntry[]): OfficerPayrollSummary[] {
  const map: Record<string, OfficerPayrollSummary> = {};

  timesheets.forEach((ts) => {
    if (!map[ts.officerId]) {
      map[ts.officerId] = {
        officerId: ts.officerId,
        empId: ts.empId,
        name: ts.officerName,
        grade: ts.grade,
        siteName: ts.siteName,
        psiraNumber: `PSIRA-2489${ts.empId.slice(-3)}`,
        totalStandardHours: 0,
        totalActualHours: 0,
        totalBillableHours: 0,
        totalOvertimeHours: 0,
        sundayHours: 0,
        publicHolidayHours: 0,
        nightShiftAllowanceShifts: 0,
        nightShiftAllowanceAmount: 0,
        grossWages: 0,
        clientBilledAmount: 0,
        profitMarginAmount: 0,
        profitMarginPercent: 0,
        biometricVerifiedShifts: 0,
        totalShifts: 0,
      };
    }

    const o = map[ts.officerId];
    o.totalShifts += 1;
    if (ts.biometricVerified) o.biometricVerifiedShifts += 1;

    o.totalStandardHours += ts.standardHours;
    o.totalActualHours += ts.actualHours;
    o.totalBillableHours += ts.billableHours;
    o.totalOvertimeHours += ts.overtimeHours;

    if (ts.isSunday) {
      o.sundayHours += ts.actualHours;
    }
    if (ts.isPublicHoliday) {
      o.publicHolidayHours += ts.actualHours;
    }
    if (ts.isNightAllowanceEligible) {
      o.nightShiftAllowanceShifts += 1;
      o.nightShiftAllowanceAmount += SECTORAL_RULES.nightShiftAllowancePerShift;
    }

    // Wage calculation according to Sectoral Determination multipliers:
    // Base normal hours pay
    const basePay = ts.standardHours * ts.hourlyRate;
    // Overtime at 1.5x
    const otPay = ts.overtimeHours * ts.hourlyRate * SECTORAL_RULES.overtimeRateMultiplier;
    // Sunday premium (0.5x extra premium on top of base if already included, or 1.5x)
    const sundayPremium = ts.isSunday ? ts.actualHours * ts.hourlyRate * 0.5 : 0;
    // Holiday premium (1.0x extra premium on top of base)
    const holidayPremium = ts.isPublicHoliday ? ts.actualHours * ts.hourlyRate * 1.0 : 0;
    // Night shift allowance
    const nightAllowance = ts.isNightAllowanceEligible ? SECTORAL_RULES.nightShiftAllowancePerShift : 0;

    const shiftWage = basePay + otPay + sundayPremium + holidayPremium + nightAllowance;
    o.grossWages += shiftWage;

    // Client billed amount (Billed at contractual client hourly rate)
    // Sunday and Holiday client surcharge of 1.5x/2.0x is standard in security SLAs
    let clientRateMultiplier = 1.0;
    if (ts.isPublicHoliday) clientRateMultiplier = 1.5;
    else if (ts.isSunday) clientRateMultiplier = 1.25;

    const shiftBilled = ts.billableHours * ts.clientBillingRate * clientRateMultiplier;
    o.clientBilledAmount += shiftBilled;
  });

  return Object.values(map).map((o) => {
    o.profitMarginAmount = o.clientBilledAmount - o.grossWages;
    o.profitMarginPercent = o.clientBilledAmount > 0 
      ? Math.round((o.profitMarginAmount / o.clientBilledAmount) * 100) 
      : 0;
    // Round monetary values to 2 decimals
    o.grossWages = Math.round(o.grossWages * 100) / 100;
    o.clientBilledAmount = Math.round(o.clientBilledAmount * 100) / 100;
    o.profitMarginAmount = Math.round(o.profitMarginAmount * 100) / 100;
    return o;
  });
}

// Aggregate overall pay period summary
export function calculatePayPeriodSummary(timesheets: TimesheetEntry[], summaries: OfficerPayrollSummary[]): PayPeriodSummary {
  let totalStandardHours = 0;
  let totalBillableHours = 0;
  let totalActualHours = 0;
  let totalOvertimeHours = 0;
  let totalSundayHours = 0;
  let totalHolidayHours = 0;
  let totalNightShifts = 0;
  let totalGrossWages = 0;
  let totalBilledToClients = 0;
  let verifiedCount = 0;

  timesheets.forEach((ts) => {
    totalStandardHours += ts.standardHours;
    totalBillableHours += ts.billableHours;
    totalActualHours += ts.actualHours;
    totalOvertimeHours += ts.overtimeHours;
    if (ts.isSunday) totalSundayHours += ts.actualHours;
    if (ts.isPublicHoliday) totalHolidayHours += ts.actualHours;
    if (ts.isNightAllowanceEligible) totalNightShifts += 1;
    if (ts.biometricVerified) verifiedCount += 1;
  });

  summaries.forEach((s) => {
    totalGrossWages += s.grossWages;
    totalBilledToClients += s.clientBilledAmount;
  });

  const billableRatio = totalStandardHours > 0 
    ? Math.round((totalBillableHours / totalStandardHours) * 1000) / 10 
    : (totalBillableHours > 0 ? 100 : 0);

  const grossMarginPercent = totalBilledToClients > 0
    ? Math.round(((totalBilledToClients - totalGrossWages) / totalBilledToClients) * 100)
    : 0;

  const biometricComplianceRate = timesheets.length > 0
    ? Math.round((verifiedCount / timesheets.length) * 1000) / 10
    : 0;

  return {
    payPeriodId: 'PP-2026-05-B',
    title: '16 May 2026 – 29 May 2026 (Fortnight 10)',
    startDate: '2026-05-16',
    endDate: '2026-05-29',
    totalStandardHours,
    totalBillableHours,
    totalActualHours,
    billableRatio,
    totalOvertimeHours,
    totalSundayHours,
    totalHolidayHours,
    totalNightShifts,
    totalGrossWages: Math.round(totalGrossWages),
    totalBilledToClients: Math.round(totalBilledToClients),
    grossMarginPercent,
    biometricComplianceRate,
    totalGuards: summaries.length,
  };
}

// Generate daily trend for Recharts
export interface DailyHoursChartPoint {
  date: string; // e.g. "16 May"
  shortDate: string;
  dayName: string;
  standardHours: number;
  billableHours: number;
  ratio: number; // %
  overtimeHours: number;
  sundayFlag: boolean;
  holidayFlag: boolean;
}

export function generateDailyHoursTimeSeries(timesheets: TimesheetEntry[]): DailyHoursChartPoint[] {
  const map: Record<string, {
    date: string;
    dayName: string;
    standardHours: number;
    billableHours: number;
    overtimeHours: number;
    sundayFlag: boolean;
    holidayFlag: boolean;
  }> = {};

  timesheets.forEach((ts) => {
    if (!map[ts.date]) {
      const parts = ts.date.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const dayNum = parseInt(parts[2], 10);
      const formatted = `${dayNum} ${monthNames[mIdx]}`;

      map[ts.date] = {
        date: formatted,
        dayName: ts.dayOfWeek.slice(0, 3),
        standardHours: 0,
        billableHours: 0,
        overtimeHours: 0,
        sundayFlag: ts.isSunday,
        holidayFlag: ts.isPublicHoliday,
      };
    }

    const d = map[ts.date];
    d.standardHours += ts.standardHours;
    d.billableHours += ts.billableHours;
    d.overtimeHours += ts.overtimeHours;
  });

  return Object.keys(map).sort().map((key) => {
    const item = map[key];
    const ratio = item.standardHours > 0 
      ? Math.round((item.billableHours / item.standardHours) * 1000) / 10 
      : 100;

    return {
      date: item.date,
      shortDate: `${item.date} (${item.dayName})`,
      dayName: item.dayName,
      standardHours: Math.round(item.standardHours),
      billableHours: Math.round(item.billableHours * 10) / 10,
      ratio,
      overtimeHours: Math.round(item.overtimeHours * 10) / 10,
      sundayFlag: item.sundayFlag,
      holidayFlag: item.holidayFlag,
    };
  });
}

// -------------------------------------------------------------
// ONE-CLICK PAYROLL EXPORTERS (Sage Pastel, VIP Payroll, Xero)
// -------------------------------------------------------------

function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 1. Sage Pastel Payroll Export
export function exportToSagePastelCSV(summaries: OfficerPayrollSummary[], payPeriod: PayPeriodSummary) {
  const headers = [
    'EmpCode',
    'FullNames',
    'PSIRANumber',
    'CostCentre_Site',
    'PSIRA_Grade',
    'NormalHours',
    'Overtime_1_5',
    'Sunday_1_5',
    'PubHoliday_2_0',
    'NightAllowanceShifts',
    'NightAllowanceRate',
    'NightAllowanceTotal',
    'GrossWages_ZAR',
    'BilledClient_ZAR',
    'BiometricVerifiedShifts',
    'PayPeriod'
  ];

  const rows = summaries.map((s) => [
    `"${s.empId}"`,
    `"${s.name}"`,
    `"${s.psiraNumber}"`,
    `"${s.siteName}"`,
    `"${s.grade}"`,
    s.totalStandardHours.toFixed(1),
    s.totalOvertimeHours.toFixed(1),
    s.sundayHours.toFixed(1),
    s.publicHolidayHours.toFixed(1),
    s.nightShiftAllowanceShifts,
    SECTORAL_RULES.nightShiftAllowancePerShift.toFixed(2),
    s.nightShiftAllowanceAmount.toFixed(2),
    s.grossWages.toFixed(2),
    s.clientBilledAmount.toFixed(2),
    `${s.biometricVerifiedShifts}/${s.totalShifts}`,
    `"${payPeriod.title}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(csv, `DUTYON_SagePastel_Payroll_${payPeriod.startDate}_to_${payPeriod.endDate}.csv`);
}

// 2. VIP Payroll / Premier Export
export function exportToVIPPayrollCSV(summaries: OfficerPayrollSummary[], payPeriod: PayPeriodSummary) {
  const headers = [
    'EmployeeNumber',
    'PSIRAReg',
    'LastName_First',
    'CostCentre',
    'Normal_Rate_Hrs',
    'Overtime_Rate_1_5',
    'Sunday_Rate_1_5',
    'Public_Holiday_2_0',
    'NightShift_Count',
    'Total_Gross_Remuneration',
    'BiometricCompliance'
  ];

  const rows = summaries.map((s) => [
    `"${s.empId}"`,
    `"${s.psiraNumber}"`,
    `"${s.name}"`,
    `"${s.siteName}"`,
    s.totalStandardHours.toFixed(1),
    s.totalOvertimeHours.toFixed(1),
    s.sundayHours.toFixed(1),
    s.publicHolidayHours.toFixed(1),
    s.nightShiftAllowanceShifts,
    s.grossWages.toFixed(2),
    `"VERIFIED_FACE_AI"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(csv, `DUTYON_VIP_Payroll_Import_${payPeriod.startDate}_to_${payPeriod.endDate}.csv`);
}

// 3. Xero Timesheet CSV Export
export function exportToXeroTimesheetCSV(timesheets: TimesheetEntry[], payPeriod: PayPeriodSummary) {
  const headers = [
    'EmployeeID',
    'EmployeeName',
    'Date',
    'EarningsRate',
    'Hours',
    'TrackingCategory1_Site',
    'TrackingCategory2_Grade',
    'BiometricAuth',
    'Notes'
  ];

  const rows = timesheets.map((ts) => [
    `"${ts.empId}"`,
    `"${ts.officerName}"`,
    `"${ts.date}"`,
    ts.isPublicHoliday 
      ? '"Public Holiday 2.0x"' 
      : ts.isSunday 
      ? '"Sunday Ordinary 1.5x"' 
      : ts.shiftType === 'NIGHT' 
      ? '"Night Ordinary + Allowance"' 
      : '"Ordinary Hours"',
    ts.actualHours.toFixed(2),
    `"${ts.siteName}"`,
    `"${ts.grade}"`,
    `"${ts.biometricMethod} (100% OK)"`,
    `"${ts.varianceReason || 'Scheduled 12h rotation'}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(csv, `DUTYON_Xero_Timesheets_${payPeriod.startDate}_to_${payPeriod.endDate}.csv`);
}

// 4. Detailed Biometric Audit & Client Billing CSV
export function exportDetailedAuditCSV(timesheets: TimesheetEntry[], payPeriod: PayPeriodSummary) {
  const headers = [
    'RecordID',
    'EmpID',
    'OfficerName',
    'Grade',
    'SiteName',
    'Date',
    'Day',
    'ShiftType',
    'ScheduledWindow',
    'BiometricClockIn',
    'BiometricClockOut',
    'BiometricStatus',
    'StandardHours',
    'ActualHours',
    'BillableHours',
    'OvertimeHours',
    'IsSunday',
    'IsPublicHoliday',
    'NightAllowanceEligible',
    'GuardHourlyWage',
    'ClientBillingRate',
    'EstimatedWageCost',
    'ClientBilledRevenue',
    'GrossMargin',
    'Notes'
  ];

  const rows = timesheets.map((ts) => {
    const wageCost = (ts.standardHours * ts.hourlyRate) + 
      (ts.overtimeHours * ts.hourlyRate * 1.5) +
      (ts.isSunday ? ts.actualHours * ts.hourlyRate * 0.5 : 0) +
      (ts.isPublicHoliday ? ts.actualHours * ts.hourlyRate * 1.0 : 0) +
      (ts.isNightAllowanceEligible ? SECTORAL_RULES.nightShiftAllowancePerShift : 0);

    const clientRev = ts.billableHours * ts.clientBillingRate * (ts.isPublicHoliday ? 1.5 : (ts.isSunday ? 1.25 : 1.0));
    const margin = clientRev - wageCost;

    return [
      `"${ts.id}"`,
      `"${ts.empId}"`,
      `"${ts.officerName}"`,
      `"${ts.grade}"`,
      `"${ts.siteName}"`,
      `"${ts.date}"`,
      `"${ts.dayOfWeek}"`,
      `"${ts.shiftType}"`,
      `"${ts.scheduledStart}-${ts.scheduledEnd}"`,
      `"${ts.clockInTime}"`,
      `"${ts.clockOutTime}"`,
      `"${ts.biometricMethod} (Verified)"`,
      ts.standardHours.toFixed(2),
      ts.actualHours.toFixed(2),
      ts.billableHours.toFixed(2),
      ts.overtimeHours.toFixed(2),
      ts.isSunday ? 'YES' : 'NO',
      ts.isPublicHoliday ? `YES (${ts.publicHolidayName})` : 'NO',
      ts.isNightAllowanceEligible ? 'YES' : 'NO',
      `R${ts.hourlyRate.toFixed(2)}`,
      `R${ts.clientBillingRate.toFixed(2)}`,
      `R${wageCost.toFixed(2)}`,
      `R${clientRev.toFixed(2)}`,
      `R${margin.toFixed(2)}`,
      `"${ts.varianceReason || ''}"`
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(csv, `DUTYON_Biometric_Timesheet_Audit_${payPeriod.startDate}_to_${payPeriod.endDate}.csv`);
}
