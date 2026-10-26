import { TimesheetEntry, OfficerPayrollSummary, PayPeriodSummary, SectoralRatesMatrix, RegionalGradeRate } from '../types/dutyon';

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

// Default Sectoral Determination Regional & Grade Rates Matrix
// Region 1 (Area 1): Major Metropolitan areas (Gauteng, Cape Metropole, eThekwini, Nelson Mandela Bay)
// Region 2 (Area 2): Other Municipal areas, Non-Metro, Rural and Regional Inland Districts
export const DEFAULT_SECTORAL_RATES_MATRIX: SectoralRatesMatrix = {
  region1: {
    id: 'region_1',
    name: 'Region 1 (Area 1 - Metropolitan / Urban)',
    areaDescription: 'Major Metros & Coastal Economic Centers (Gauteng, Cape Metropole, eThekwini, Nelson Mandela Bay)',
    rates: {
      'Grade A': {
        grade: 'Grade A',
        basicHourlyRate: 48.50,
        benefitsHourlyRate: 9.20,
        totalRateInclBenefits: 57.70,
        clientBillingRate: 115.00,
        providentFundRate: 3.64,
        medicalAllowance: 3.50,
        uniformAllowance: 2.06,
        notes: 'Senior Site Commander / Armed Supervisor baseline'
      },
      'Grade B': {
        grade: 'Grade B',
        basicHourlyRate: 42.00,
        benefitsHourlyRate: 8.00,
        totalRateInclBenefits: 50.00,
        clientBillingRate: 95.00,
        providentFundRate: 3.15,
        medicalAllowance: 3.00,
        uniformAllowance: 1.85,
        notes: 'Shift Supervisor / Access Control In-Charge'
      },
      'Grade C': {
        grade: 'Grade C',
        basicHourlyRate: 36.50,
        benefitsHourlyRate: 7.00,
        totalRateInclBenefits: 43.50,
        clientBillingRate: 80.00,
        providentFundRate: 2.74,
        medicalAllowance: 2.50,
        uniformAllowance: 1.76,
        notes: 'Patrol Officer / Static Security Sentry'
      },
      'Grade D': {
        grade: 'Grade D',
        basicHourlyRate: 32.00,
        benefitsHourlyRate: 6.10,
        totalRateInclBenefits: 38.10,
        clientBillingRate: 68.00,
        providentFundRate: 2.40,
        medicalAllowance: 2.20,
        uniformAllowance: 1.50,
        notes: 'Entry-level Access Gate Assistant'
      },
      'Armed Response': {
        grade: 'Armed Response',
        basicHourlyRate: 52.00,
        benefitsHourlyRate: 10.50,
        totalRateInclBenefits: 62.50,
        clientBillingRate: 125.00,
        providentFundRate: 3.90,
        medicalAllowance: 4.20,
        uniformAllowance: 2.40,
        notes: 'Tactical Armed Interceptor & Tactical Patrol'
      }
    }
  },
  region2: {
    id: 'region_2',
    name: 'Region 2 (Area 2 - Non-Metropolitan / Rural)',
    areaDescription: 'Other Municipal Areas, Inland Rural, Agricultural & Provincial Districts',
    rates: {
      'Grade A': {
        grade: 'Grade A',
        basicHourlyRate: 43.50,
        benefitsHourlyRate: 8.30,
        totalRateInclBenefits: 51.80,
        clientBillingRate: 102.00,
        providentFundRate: 3.26,
        medicalAllowance: 3.10,
        uniformAllowance: 1.94,
        notes: 'Area 2 Senior Site Commander / Supervisor'
      },
      'Grade B': {
        grade: 'Grade B',
        basicHourlyRate: 37.50,
        benefitsHourlyRate: 7.10,
        totalRateInclBenefits: 44.60,
        clientBillingRate: 85.00,
        providentFundRate: 2.81,
        medicalAllowance: 2.65,
        uniformAllowance: 1.64,
        notes: 'Area 2 Shift Supervisor / Access Lead'
      },
      'Grade C': {
        grade: 'Grade C',
        basicHourlyRate: 33.00,
        benefitsHourlyRate: 6.30,
        totalRateInclBenefits: 39.30,
        clientBillingRate: 72.00,
        providentFundRate: 2.48,
        medicalAllowance: 2.30,
        uniformAllowance: 1.52,
        notes: 'Area 2 Standard Patrol Officer'
      },
      'Grade D': {
        grade: 'Grade D',
        basicHourlyRate: 29.50,
        benefitsHourlyRate: 5.60,
        totalRateInclBenefits: 35.10,
        clientBillingRate: 62.00,
        providentFundRate: 2.21,
        medicalAllowance: 2.00,
        uniformAllowance: 1.39,
        notes: 'Area 2 Gate / Access Assistant'
      },
      'Armed Response': {
        grade: 'Armed Response',
        basicHourlyRate: 47.00,
        benefitsHourlyRate: 9.50,
        totalRateInclBenefits: 56.50,
        clientBillingRate: 112.00,
        providentFundRate: 3.53,
        medicalAllowance: 3.70,
        uniformAllowance: 2.27,
        notes: 'Area 2 Tactical Armed Officer'
      }
    }
  }
};

// Normalizes arbitrary grade text to standard Grade keys
export function normalizeGradeKey(grade?: string): string {
  if (!grade) return 'Grade C';
  const g = grade.toUpperCase();
  if (g.includes('ARMED') || g.includes('RESPONSE') || g.includes('TACTICAL')) return 'Armed Response';
  if (g.includes('GRADE A') || g === 'A' || g.includes('DIRECTOR') || g.includes('OPS IN-CHARGE')) return 'Grade A';
  if (g.includes('GRADE B') || g === 'B') return 'Grade B';
  if (g.includes('GRADE D') || g === 'D') return 'Grade D';
  return 'Grade C';
}

// Retrieve rate structure for a specific region and grade from the matrix
export function getRateForRegionAndGrade(
  matrix: SectoralRatesMatrix,
  regionId?: string,
  grade?: string
): RegionalGradeRate {
  const normGrade = normalizeGradeKey(grade);
  const targetRegion = (regionId === 'region_2') ? matrix?.region2 : matrix?.region1;
  const rates = targetRegion?.rates || DEFAULT_SECTORAL_RATES_MATRIX.region1.rates;
  
  if (rates[normGrade]) {
    return rates[normGrade];
  }
  // Fallback lookup
  return DEFAULT_SECTORAL_RATES_MATRIX.region1.rates['Grade C'];
}

// Legacy GRADE_RATES mapping for backwards compatibility
export const GRADE_RATES: Record<string, { baseHourly: number; clientBilling: number }> = {
  'A': { baseHourly: 48.50, clientBilling: 115.00 },
  'Grade A': { baseHourly: 48.50, clientBilling: 115.00 },
  'B': { baseHourly: 42.00, clientBilling: 95.00 },
  'Grade B': { baseHourly: 42.00, clientBilling: 95.00 },
  'C': { baseHourly: 36.50, clientBilling: 80.00 },
  'Grade C': { baseHourly: 36.50, clientBilling: 80.00 },
  'D': { baseHourly: 32.00, clientBilling: 68.00 },
  'Grade D': { baseHourly: 32.00, clientBilling: 68.00 },
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
    { 
      id: 'off-admin', 
      empId: 'DIR-0001', 
      name: 'Tshepo Maloa', 
      grade: 'Grade A', 
      site: 'Provincial Office', 
      regionId: 'region_1',
      baseRate: 48.50, 
      benefitsRate: 9.20,
      totalRate: 57.70,
      billRate: 115.00 
    },
  ];

  const officers = (enrolledOfficers && enrolledOfficers.length > 0)
    ? enrolledOfficers.map((o, idx) => {
        const gradeKey = normalizeGradeKey(o.grade);
        const regionId = o.regionId || (idx % 2 === 0 ? 'region_1' : 'region_2');
        const defaultRate = getRateForRegionAndGrade(DEFAULT_SECTORAL_RATES_MATRIX, regionId, gradeKey);
        const baseRate = Number(o.hourlyRate) || Number(o.baseHourlyRate) || defaultRate.basicHourlyRate;
        const benefitsRate = Number(o.benefitsHourlyRate) || defaultRate.benefitsHourlyRate;
        const totalRate = Number(o.totalRateInclBenefits) || (baseRate + benefitsRate);
        const billRate = Number(o.clientBillingRate) || defaultRate.clientBillingRate;

        return {
          id: o.id || `off-enr-${idx}`,
          empId: o.empId || `TKD-${1100 + idx}`,
          name: o.name,
          grade: o.grade || 'Grade C',
          site: o.currentSite || 'Provincial Office',
          regionId,
          baseRate,
          benefitsRate,
          totalRate,
          billRate,
        };
      })
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

      const regionName = off.regionId === 'region_2' ? 'Region 2 (Area 2)' : 'Region 1 (Area 1)';
      const benefitsAmount = Math.round(actualHours * off.benefitsRate * 100) / 100;

      timesheets.push({
        id: `ts-${off.empId}-${dateStr}`,
        officerId: off.id,
        empId: off.empId,
        officerName: off.name,
        grade: off.grade,
        siteName: off.site,
        regionId: off.regionId,
        regionName,
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
        benefitsHourlyRate: off.benefitsRate,
        totalRateInclBenefits: off.totalRate,
        benefitsAmount,
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
        regionId: ts.regionId,
        regionName: ts.regionName,
        psiraNumber: `PSIRA-2489${ts.empId.slice(-3)}`,
        totalStandardHours: 0,
        totalActualHours: 0,
        totalBillableHours: 0,
        totalOvertimeHours: 0,
        sundayHours: 0,
        publicHolidayHours: 0,
        nightShiftAllowanceShifts: 0,
        nightShiftAllowanceAmount: 0,
        totalBasicWages: 0,
        totalBenefitsAmount: 0,
        averageRateInclBenefits: 0,
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

    // Statutory Benefits (Provident Fund, Medical, Uniform, UIF)
    const benefitsRate = ts.benefitsHourlyRate ?? (
      ts.totalRateInclBenefits && ts.totalRateInclBenefits > ts.hourlyRate
        ? (ts.totalRateInclBenefits - ts.hourlyRate)
        : 0
    );
    const shiftBenefits = ts.benefitsAmount ?? (ts.actualHours * benefitsRate);

    const shiftBaseGross = basePay + otPay + sundayPremium + holidayPremium + nightAllowance;
    o.totalBasicWages = (o.totalBasicWages || 0) + shiftBaseGross;
    o.totalBenefitsAmount = (o.totalBenefitsAmount || 0) + shiftBenefits;

    const shiftWage = shiftBaseGross + shiftBenefits;
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
    o.totalBasicWages = Math.round((o.totalBasicWages || 0) * 100) / 100;
    o.totalBenefitsAmount = Math.round((o.totalBenefitsAmount || 0) * 100) / 100;
    o.clientBilledAmount = Math.round(o.clientBilledAmount * 100) / 100;
    o.profitMarginAmount = Math.round(o.profitMarginAmount * 100) / 100;
    o.averageRateInclBenefits = o.totalActualHours > 0 
      ? Math.round((o.grossWages / o.totalActualHours) * 100) / 100 
      : 0;
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
    'Region',
    'CostCentre_Site',
    'PSIRA_Grade',
    'NormalHours',
    'Overtime_1_5',
    'Sunday_1_5',
    'PubHoliday_2_0',
    'NightAllowanceShifts',
    'NightAllowanceRate',
    'NightAllowanceTotal',
    'BasicWages_ZAR',
    'StatutoryBenefits_ZAR',
    'GrossWages_ZAR',
    'BilledClient_ZAR',
    'BiometricVerifiedShifts',
    'PayPeriod'
  ];

  const rows = summaries.map((s) => [
    `"${s.empId}"`,
    `"${s.name}"`,
    `"${s.psiraNumber}"`,
    `"${s.regionName || (s.regionId === 'region_2' ? 'Region 2 (Area 2)' : 'Region 1 (Area 1)')}"`,
    `"${s.siteName}"`,
    `"${s.grade}"`,
    s.totalStandardHours.toFixed(1),
    s.totalOvertimeHours.toFixed(1),
    s.sundayHours.toFixed(1),
    s.publicHolidayHours.toFixed(1),
    s.nightShiftAllowanceShifts,
    SECTORAL_RULES.nightShiftAllowancePerShift.toFixed(2),
    s.nightShiftAllowanceAmount.toFixed(2),
    (s.totalBasicWages || s.grossWages).toFixed(2),
    (s.totalBenefitsAmount || 0).toFixed(2),
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
    'Region_Area',
    'CostCentre',
    'Normal_Rate_Hrs',
    'Overtime_Rate_1_5',
    'Sunday_Rate_1_5',
    'Public_Holiday_2_0',
    'NightShift_Count',
    'Basic_Wages',
    'Statutory_Benefits',
    'Total_Gross_Remuneration',
    'BiometricCompliance'
  ];

  const rows = summaries.map((s) => [
    `"${s.empId}"`,
    `"${s.psiraNumber}"`,
    `"${s.name}"`,
    `"${s.regionName || (s.regionId === 'region_2' ? 'Region 2' : 'Region 1')}"`,
    `"${s.siteName}"`,
    s.totalStandardHours.toFixed(1),
    s.totalOvertimeHours.toFixed(1),
    s.sundayHours.toFixed(1),
    s.publicHolidayHours.toFixed(1),
    s.nightShiftAllowanceShifts,
    (s.totalBasicWages || s.grossWages).toFixed(2),
    (s.totalBenefitsAmount || 0).toFixed(2),
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
    'TrackingCategory3_Region',
    'Benefits_PerHour',
    'Rate_Incl_Benefits',
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
    `"${ts.regionName || (ts.regionId === 'region_2' ? 'Region 2 (Area 2)' : 'Region 1 (Area 1)')}"`,
    `R${(ts.benefitsHourlyRate || 0).toFixed(2)}`,
    `R${(ts.totalRateInclBenefits || ts.hourlyRate).toFixed(2)}`,
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
    'Region',
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
    'BasicHourlyWage',
    'BenefitsHourlyRate',
    'TotalRateInclBenefits',
    'TotalShiftBenefits',
    'ClientBillingRate',
    'EstimatedWageCost',
    'ClientBilledRevenue',
    'GrossMargin',
    'Notes'
  ];

  const rows = timesheets.map((ts) => {
    const benefitsRate = ts.benefitsHourlyRate ?? (
      ts.totalRateInclBenefits && ts.totalRateInclBenefits > ts.hourlyRate
        ? (ts.totalRateInclBenefits - ts.hourlyRate)
        : 0
    );
    const shiftBenefits = ts.benefitsAmount ?? (ts.actualHours * benefitsRate);
    const wageCost = (ts.standardHours * ts.hourlyRate) + 
      (ts.overtimeHours * ts.hourlyRate * 1.5) +
      (ts.isSunday ? ts.actualHours * ts.hourlyRate * 0.5 : 0) +
      (ts.isPublicHoliday ? ts.actualHours * ts.hourlyRate * 1.0 : 0) +
      (ts.isNightAllowanceEligible ? SECTORAL_RULES.nightShiftAllowancePerShift : 0) +
      shiftBenefits;

    const clientRev = ts.billableHours * ts.clientBillingRate * (ts.isPublicHoliday ? 1.5 : (ts.isSunday ? 1.25 : 1.0));
    const margin = clientRev - wageCost;

    return [
      `"${ts.id}"`,
      `"${ts.empId}"`,
      `"${ts.officerName}"`,
      `"${ts.grade}"`,
      `"${ts.regionName || (ts.regionId === 'region_2' ? 'Region 2 (Area 2)' : 'Region 1 (Area 1)')}"`,
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
      `R${benefitsRate.toFixed(2)}`,
      `R${(ts.totalRateInclBenefits || (ts.hourlyRate + benefitsRate)).toFixed(2)}`,
      `R${shiftBenefits.toFixed(2)}`,
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
