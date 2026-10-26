import React, { useState, useEffect } from 'react';
import { TimesheetEntry, SectoralRatesMatrix } from '../../types/dutyon';
import { getRateForRegionAndGrade, SECTORAL_RULES } from '../../utils/payrollSectoral';
import { DecimalRateInput } from '../common/DecimalRateInput';

interface EditTimesheetRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: TimesheetEntry | null;
  regionalRates: SectoralRatesMatrix;
  onSave: (id: string, updates: Partial<TimesheetEntry>) => Promise<void>;
}

export const EditTimesheetRateModal: React.FC<EditTimesheetRateModalProps> = ({
  isOpen,
  onClose,
  entry,
  regionalRates,
  onSave
}) => {
  if (!isOpen || !entry) return null;

  const [regionId, setRegionId] = useState<'region_1' | 'region_2' | string>(entry.regionId || 'region_1');
  const [basicRate, setBasicRate] = useState<number>(entry.hourlyRate || 36.50);
  const [benefitsRate, setBenefitsRate] = useState<number>(entry.benefitsHourlyRate || 0);
  const [totalRateInclBenefits, setTotalRateInclBenefits] = useState<number>(
    entry.totalRateInclBenefits || (entry.hourlyRate + (entry.benefitsHourlyRate || 0))
  );
  const [clientBillingRate, setClientBillingRate] = useState<number>(entry.clientBillingRate || 80.00);
  const [actualHours, setActualHours] = useState<number>(entry.actualHours || 12.0);
  const [standardHours, setStandardHours] = useState<number>(entry.standardHours || 12.0);
  const [overtimeHours, setOvertimeHours] = useState<number>(entry.overtimeHours || 0.0);
  const [isSunday, setIsSunday] = useState<boolean>(Boolean(entry.isSunday));
  const [isPublicHoliday, setIsPublicHoliday] = useState<boolean>(Boolean(entry.isPublicHoliday));
  const [isNight, setIsNight] = useState<boolean>(entry.shiftType === 'NIGHT');
  const [varianceReason, setVarianceReason] = useState<string>(entry.varianceReason || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setRegionId(entry.regionId || 'region_1');
      setBasicRate(entry.hourlyRate || 36.50);
      setBenefitsRate(entry.benefitsHourlyRate || 0);
      setTotalRateInclBenefits(entry.totalRateInclBenefits || (entry.hourlyRate + (entry.benefitsHourlyRate || 0)));
      setClientBillingRate(entry.clientBillingRate || 80.00);
      setActualHours(entry.actualHours || 12.0);
      setStandardHours(entry.standardHours || 12.0);
      setOvertimeHours(entry.overtimeHours || 0.0);
      setIsSunday(Boolean(entry.isSunday));
      setIsPublicHoliday(Boolean(entry.isPublicHoliday));
      setIsNight(entry.shiftType === 'NIGHT');
      setVarianceReason(entry.varianceReason || '');
    }
  }, [entry]);

  // Handle when region is switched
  const handleRegionChange = (newRegion: 'region_1' | 'region_2') => {
    setRegionId(newRegion);
    const defaults = getRateForRegionAndGrade(regionalRates, newRegion, entry.grade);
    setBasicRate(defaults.basicHourlyRate);
    setBenefitsRate(defaults.benefitsHourlyRate);
    setTotalRateInclBenefits(defaults.totalRateInclBenefits);
    setClientBillingRate(defaults.clientBillingRate);
  };

  // Handle Total Rate change (auto recalculates benefits)
  const handleTotalRateChange = (newTotal: number) => {
    const rounded = Math.round(newTotal * 100) / 100;
    setTotalRateInclBenefits(rounded);
    if (rounded >= basicRate) {
      setBenefitsRate(Math.round((rounded - basicRate) * 100) / 100);
    } else {
      // If total is lower than basic, adjust basic down
      setBasicRate(rounded);
      setBenefitsRate(0);
    }
  };

  // Handle Basic Rate change
  const handleBasicRateChange = (newBasic: number) => {
    const rounded = Math.round(newBasic * 100) / 100;
    setBasicRate(rounded);
    setTotalRateInclBenefits(Math.round((rounded + benefitsRate) * 100) / 100);
  };

  // Handle Benefits Rate change
  const handleBenefitsRateChange = (newBenefits: number) => {
    const rounded = Math.round(newBenefits * 100) / 100;
    setBenefitsRate(rounded);
    setTotalRateInclBenefits(Math.round((basicRate + rounded) * 100) / 100);
  };

  // Live estimated wage calculation for this shift
  const calculatedBenefitsAmount = Math.round(actualHours * benefitsRate * 100) / 100;
  const basePay = standardHours * basicRate;
  const otPay = overtimeHours * basicRate * SECTORAL_RULES.overtimeRateMultiplier;
  const sundayPremium = isSunday ? actualHours * basicRate * 0.5 : 0;
  const holidayPremium = isPublicHoliday ? actualHours * basicRate * 1.0 : 0;
  const nightAllowance = isNight ? SECTORAL_RULES.nightShiftAllowancePerShift : 0;
  const totalShiftWage = Math.round((basePay + otPay + sundayPremium + holidayPremium + nightAllowance + calculatedBenefitsAmount) * 100) / 100;

  let clientMultiplier = 1.0;
  if (isPublicHoliday) clientMultiplier = 1.5;
  else if (isSunday) clientMultiplier = 1.25;
  const clientRevenue = Math.round(actualHours * clientBillingRate * clientMultiplier * 100) / 100;
  const marginAmount = Math.round((clientRevenue - totalShiftWage) * 100) / 100;
  const marginPct = clientRevenue > 0 ? Math.round((marginAmount / clientRevenue) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const regionName = regionId === 'region_2' ? regionalRates.region2.name : regionalRates.region1.name;
      await onSave(entry.id, {
        regionId,
        regionName,
        hourlyRate: basicRate,
        benefitsHourlyRate: benefitsRate,
        totalRateInclBenefits,
        benefitsAmount: calculatedBenefitsAmount,
        clientBillingRate,
        actualHours,
        standardHours,
        overtimeHours,
        isSunday,
        isPublicHoliday,
        shiftType: isNight ? 'NIGHT' : 'DAY',
        nightAllowanceHours: isNight ? standardHours : 0,
        isNightAllowanceEligible: isNight,
        varianceReason: varianceReason.trim() ? varianceReason.trim() : undefined,
        status: 'ADJUSTED'
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-[#0A1E33] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-[#0C243D] to-[#0A1E33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 grid place-items-center text-lg font-bold">
              💰
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Manual Wage &amp; Benefit Rate Override
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono-code font-semibold border border-emerald-500/30">
                  {entry.grade}
                </span>
              </h2>
              <p className="text-xs text-[#8598A8]">
                {entry.officerName} ({entry.empId}) · {entry.siteName} · {entry.date} ({entry.dayOfWeek})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8598A8] hover:text-white grid place-items-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
          {/* Region Selection */}
          <div className="bg-[#071726] p-3.5 rounded-xl border border-white/10">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#3FC9E9] block mb-2">
              Sectoral Determination Region / Area
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRegionChange('region_1')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  regionId === 'region_1'
                    ? 'bg-[#1FA6C9]/20 border-[#1FA6C9] text-white shadow-sm'
                    : 'bg-black/30 border-white/10 text-[#8598A8] hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${regionId === 'region_1' ? 'bg-[#3FC9E9]' : 'bg-gray-500'}`} />
                  Region 1 (Area 1)
                </div>
                <div className="text-[10px] text-[#8598A8] mt-0.5">
                  Metropolitan / Urban (Gauteng, Cape, eThekwini, PE)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRegionChange('region_2')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  regionId === 'region_2'
                    ? 'bg-[#1FA6C9]/20 border-[#1FA6C9] text-white shadow-sm'
                    : 'bg-black/30 border-white/10 text-[#8598A8] hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${regionId === 'region_2' ? 'bg-[#3FC9E9]' : 'bg-gray-500'}`} />
                  Region 2 (Area 2)
                </div>
                <div className="text-[10px] text-[#8598A8] mt-0.5">
                  Non-Metropolitan / Rural &amp; Regional Districts
                </div>
              </button>
            </div>
          </div>

          {/* Rate Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Basic Hourly Wage Rate */}
            <div className="bg-[#071726] p-3 rounded-xl border border-white/10">
              <label className="text-[10.5px] uppercase tracking-wider text-[#8598A8] block mb-1 font-semibold">
                Basic Rate (R/hr)
              </label>
              <DecimalRateInput
                value={basicRate}
                onChange={handleBasicRateChange}
                className="border-b border-white/20 pb-1 font-bold"
                inputClassName="text-base font-bold text-white focus:text-[#3FC9E9]"
              />
              <p className="text-[10px] text-[#8598A8] mt-1">Normal ordinary hours baseline</p>
            </div>

            {/* 2. Benefits Rate Per Hour */}
            <div className="bg-[#071726] p-3 rounded-xl border border-white/10">
              <label className="text-[10.5px] uppercase tracking-wider text-[#8598A8] block mb-1 font-semibold">
                Benefits Rate (R/hr)
              </label>
              <DecimalRateInput
                value={benefitsRate}
                onChange={handleBenefitsRateChange}
                className="border-b border-white/20 pb-1 font-bold"
                inputClassName="text-base font-bold text-emerald-400 focus:text-emerald-300"
              />
              <p className="text-[10px] text-[#8598A8] mt-1">Provident Fund, Medical &amp; UIF</p>
            </div>

            {/* 3. TOTAL Rate Per Hour Including Benefits */}
            <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
              <label className="text-[10.5px] uppercase tracking-wider text-emerald-300 block mb-1 font-bold">
                Rate Incl. Benefits (R/hr) ★
              </label>
              <DecimalRateInput
                value={totalRateInclBenefits}
                onChange={handleTotalRateChange}
                prefix="R"
                className="border-b border-emerald-400/40 pb-1 font-bold"
                inputClassName="text-base font-extrabold text-emerald-300 focus:text-white"
              />
              <p className="text-[10px] text-emerald-400/80 mt-1">Directly input all-inclusive rate</p>
            </div>
          </div>

          {/* Client Contract Billing Tariff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#071726] p-3 rounded-xl border border-white/10">
              <label className="text-[10.5px] uppercase tracking-wider text-[#8598A8] block mb-1 font-semibold">
                Client Billing Tariff (R/hr)
              </label>
              <DecimalRateInput
                value={clientBillingRate}
                onChange={(val) => setClientBillingRate(Math.round(val * 100) / 100)}
                className="border-b border-white/20 pb-1 font-bold"
                inputClassName="text-base font-bold text-[#3FC9E9] focus:text-white"
              />
              <p className="text-[10px] text-[#8598A8] mt-1">Contract tariff billed to client</p>
            </div>

            <div className="bg-[#071726] p-3 rounded-xl border border-white/10">
              <label className="text-[10.5px] uppercase tracking-wider text-[#8598A8] block mb-1 font-semibold">
                Actual Shift Hours
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={actualHours}
                  onChange={(e) => {
                    const h = parseFloat(e.target.value) || 0;
                    setActualHours(h);
                    if (h > 12) {
                      setStandardHours(12);
                      setOvertimeHours(Math.round((h - 12) * 100) / 100);
                    } else {
                      setStandardHours(h);
                      setOvertimeHours(0);
                    }
                  }}
                  className="w-24 bg-transparent border-b border-white/20 pb-1 text-base font-bold text-white focus:outline-none focus:border-[#3FC9E9]"
                />
                <span className="text-xs text-[#8598A8]">
                  Std: {standardHours}h · OT: {overtimeHours}h
                </span>
              </div>
              <p className="text-[10px] text-[#8598A8] mt-1">Clock-in to clock-out duration</p>
            </div>
          </div>

          {/* Shift Modifiers */}
          <div className="flex flex-wrap items-center gap-3 bg-[#071726]/60 p-3 rounded-xl border border-white/10 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-white">
              <input
                type="checkbox"
                checked={isNight}
                onChange={(e) => setIsNight(e.target.checked)}
                className="w-4 h-4 rounded accent-[#1FA6C9]"
              />
              <span>Night Shift (R38.50 allowance)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-white">
              <input
                type="checkbox"
                checked={isSunday}
                onChange={(e) => setIsSunday(e.target.checked)}
                className="w-4 h-4 rounded accent-[#1FA6C9]"
              />
              <span>Sunday (1.5× rate)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-white">
              <input
                type="checkbox"
                checked={isPublicHoliday}
                onChange={(e) => setIsPublicHoliday(e.target.checked)}
                className="w-4 h-4 rounded accent-[#1FA6C9]"
              />
              <span>Public Holiday (2.0× rate)</span>
            </label>
          </div>

          {/* Live Calculation Preview Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-[#071726] to-[#0C243D] p-3.5 rounded-xl border border-emerald-500/30">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center justify-between">
              <span>Shift Reconciliation Preview</span>
              <span className="text-white font-mono-code">Gross Margin: {marginPct}%</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#8598A8] block">Basic Wages</span>
                <span className="font-bold text-white font-mono-code">R{Math.round((basePay + otPay + sundayPremium + holidayPremium + nightAllowance) * 100) / 100}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 block">Statutory Benefits</span>
                <span className="font-bold text-emerald-400 font-mono-code">+R{calculatedBenefitsAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-white font-semibold block">Total Guard Pay</span>
                <span className="font-extrabold text-emerald-300 font-mono-code text-sm">R{totalShiftWage.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#3FC9E9] block">Client Billed</span>
                <span className="font-bold text-[#3FC9E9] font-mono-code">R{clientRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Audit Reason / Note */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#8598A8] block mb-1 font-semibold">
              Adjustment Audit Notes / Reason
            </label>
            <input
              type="text"
              value={varianceReason}
              onChange={(e) => setVarianceReason(e.target.value)}
              placeholder="e.g. Approved Area 1 rate adjustment with client benefit recovery"
              className="w-full bg-[#071726] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#1FA6C9]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? 'Saving...' : '✓ Save Shift Rate Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
