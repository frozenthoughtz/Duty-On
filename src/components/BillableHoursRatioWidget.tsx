import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ComposedChart,
  CartesianGrid,
} from 'recharts';
import {
  generatePayPeriodTimesheets,
  calculateOfficerPayrollSummaries,
  calculatePayPeriodSummary,
  generateDailyHoursTimeSeries,
  exportToSagePastelCSV,
  exportToVIPPayrollCSV,
  exportToXeroTimesheetCSV,
} from '../utils/payrollSectoral';
import { useDutyOn } from '../context/DutyOnContext';

interface Props {
  onOpenFullPayroll?: () => void;
}

export const BillableHoursRatioWidget: React.FC<Props> = ({ onOpenFullPayroll }) => {
  const { timesheets, officersList, showToast } = useDutyOn();

  const officerSummaries = useMemo(() => calculateOfficerPayrollSummaries(timesheets), [timesheets]);
  const payPeriod = useMemo(() => calculatePayPeriodSummary(timesheets, officerSummaries), [timesheets, officerSummaries]);
  const dailyData = useMemo(() => generateDailyHoursTimeSeries(timesheets), [timesheets]);

  return (
    <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-3 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base">⏱️</span>
            <h3 className="font-display font-bold text-sm text-white">
              Pay Period Hours &amp; Billable Ratio Summary
            </h3>
            <span className="font-mono-code text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              {payPeriod.billableRatio}% Ratio
            </span>
          </div>
          <p className="text-xs text-[#8598A8] mt-0.5">
            Biometric clock-in/out verification vs standard contracted roster hours ({payPeriod.title}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              exportToSagePastelCSV(officerSummaries, payPeriod);
              showToast('Exported Sage Pastel CSV');
            }}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
            title="Export Sage Pastel Payroll format"
          >
            Sage CSV
          </button>

          <button
            onClick={() => {
              exportToVIPPayrollCSV(officerSummaries, payPeriod);
              showToast('Exported VIP Payroll CSV');
            }}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
            title="Export VIP Payroll format"
          >
            VIP CSV
          </button>

          {onOpenFullPayroll && (
            <button
              onClick={onOpenFullPayroll}
              className="px-3 py-1 bg-[#1FA6C9] hover:bg-[#1FA6C9]/90 text-[#042430] font-display font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm shadow-[#1FA6C9]/20 flex items-center gap-1"
            >
              <span>Full Timesheets</span>
              <span>›</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Mini Pillars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <div className="text-[11px] text-[#8598A8]">Contracted Standard</div>
          <div className="font-display font-extrabold text-lg text-white mt-0.5">
            {payPeriod.totalStandardHours.toFixed(0)} <span className="text-xs font-normal text-[#8598A8]">hrs</span>
          </div>
          <div className="text-[10px] text-[#8598A8] mt-0.5">Roster baseline target</div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <div className="text-[11px] text-[#8598A8]">Verified Billable</div>
          <div className="font-display font-extrabold text-lg text-[#5BCB80] mt-0.5">
            {payPeriod.totalBillableHours.toFixed(1)} <span className="text-xs font-normal text-[#8598A8]">hrs</span>
          </div>
          <div className="text-[10px] text-[#5BCB80] mt-0.5 font-bold">
            {payPeriod.totalStandardHours > 0 
              ? `${(payPeriod.totalBillableHours - payPeriod.totalStandardHours >= 0 ? '+' : '')}${(payPeriod.totalBillableHours - payPeriod.totalStandardHours).toFixed(1)}h (${payPeriod.billableRatio.toFixed(1)}%)`
              : `${payPeriod.totalBillableHours.toFixed(1)}h logged · Counting live`}
          </div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <div className="text-[11px] text-[#8598A8]">Sectoral Allowances</div>
          <div className="font-display font-extrabold text-lg text-indigo-300 mt-0.5">
            {payPeriod.totalNightShifts} <span className="text-xs font-normal text-[#8598A8]">nights</span>
          </div>
          <div className="text-[10px] text-[#8598A8] mt-0.5">
            Sun: {payPeriod.totalSundayHours.toFixed(0)}h · Hol: {payPeriod.totalHolidayHours.toFixed(0)}h
          </div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <div className="text-[11px] text-[#8598A8]">Client Billing Margin</div>
          <div className="font-display font-extrabold text-lg text-[#3FC9E9] mt-0.5">
            {payPeriod.grossMarginPercent}%
          </div>
          <div className="text-[10px] text-[#8598A8] mt-0.5">
            Rev: R{payPeriod.totalBilledToClients.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recharts Visualization */}
      <div className="pt-2">
        <div className="flex flex-wrap items-center justify-between text-xs text-[#8598A8] mb-2 gap-2">
          <span className="font-semibold text-white">Daily Pay Period Hours Trajectory:</span>
          <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-[#1FA6C9]" /> Standard Target
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-[#5BCB80]" /> Billable
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[#E7A13A]" /> Ratio %
            </span>
          </div>
        </div>

        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#ffffff0a" vertical={false} />
              <XAxis dataKey="date" stroke="#8598A8" fontSize={10} tickLine={false} />
              <YAxis yAxisId="hrs" stroke="#8598A8" fontSize={10} tickLine={false} axisLine={false} unit="h" />
              <YAxis yAxisId="rat" orientation="right" stroke="#E7A13A" fontSize={10} tickLine={false} axisLine={false} unit="%" domain={[90, 115]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#071726',
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Bar yAxisId="hrs" dataKey="standardHours" name="Standard (h)" fill="#1FA6C9" opacity={0.35} radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar yAxisId="hrs" dataKey="billableHours" name="Billable (h)" fill="#5BCB80" opacity={0.9} radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Line yAxisId="rat" type="monotone" dataKey="ratio" name="Ratio (%)" stroke="#E7A13A" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
