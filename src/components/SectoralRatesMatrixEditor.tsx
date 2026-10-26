import React, { useState } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { SectoralRatesMatrix, RegionalGradeRate } from '../types/dutyon';
import { DEFAULT_SECTORAL_RATES_MATRIX } from '../utils/payrollSectoral';
import { DecimalRateInput } from './common/DecimalRateInput';

interface SectoralRatesMatrixEditorProps {
  onSaved?: () => void;
  inlineMode?: boolean; // When true, rendered inside a page tab instead of standalone modal
}

export const SectoralRatesMatrixEditor: React.FC<SectoralRatesMatrixEditorProps> = ({
  onSaved,
  inlineMode = false
}) => {
  const { regionalRates, updateRegionalRates, sites, updateSite, officersList, showToast, isCloudConnected } = useDutyOn();

  const [activeRegionTab, setActiveRegionTab] = useState<'region1' | 'region2'>('region1');
  const [matrixData, setMatrixData] = useState<SectoralRatesMatrix>(() => JSON.parse(JSON.stringify(regionalRates)));
  const [isSaving, setIsSaving] = useState(false);
  const [expandedGradeDetails, setExpandedGradeDetails] = useState<Record<string, boolean>>({});

  // Sync with prop/context if updated externally
  React.useEffect(() => {
    setMatrixData(JSON.parse(JSON.stringify(regionalRates)));
  }, [regionalRates]);

  const currentRegion = activeRegionTab === 'region1' ? matrixData.region1 : matrixData.region2;

  const handleRateFieldChange = (
    grade: string,
    field: keyof RegionalGradeRate,
    val: number | string
  ) => {
    setMatrixData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as SectoralRatesMatrix;
      const targetRegion = activeRegionTab === 'region1' ? copy.region1 : copy.region2;
      const rateObj = targetRegion.rates[grade];
      if (!rateObj) return prev;

      if (field === 'totalRateInclBenefits') {
        const numVal = typeof val === 'number' ? Math.round(val * 100) / 100 : Math.round((parseFloat(val) || 0) * 100) / 100;
        rateObj.totalRateInclBenefits = numVal;
        // Adjust benefits rate keeping basic rate if possible, or recalculate
        if (numVal >= rateObj.basicHourlyRate) {
          rateObj.benefitsHourlyRate = Math.round((numVal - rateObj.basicHourlyRate) * 100) / 100;
        } else {
          rateObj.basicHourlyRate = numVal;
          rateObj.benefitsHourlyRate = 0;
        }
      } else if (field === 'basicHourlyRate') {
        const numVal = typeof val === 'number' ? Math.round(val * 100) / 100 : Math.round((parseFloat(val) || 0) * 100) / 100;
        rateObj.basicHourlyRate = numVal;
        rateObj.totalRateInclBenefits = Math.round((numVal + rateObj.benefitsHourlyRate) * 100) / 100;
      } else if (field === 'benefitsHourlyRate') {
        const numVal = typeof val === 'number' ? Math.round(val * 100) / 100 : Math.round((parseFloat(val) || 0) * 100) / 100;
        rateObj.benefitsHourlyRate = numVal;
        rateObj.totalRateInclBenefits = Math.round((rateObj.basicHourlyRate + numVal) * 100) / 100;
      } else if (field === 'clientBillingRate') {
        rateObj.clientBillingRate = typeof val === 'number' ? Math.round(val * 100) / 100 : Math.round((parseFloat(val) || 0) * 100) / 100;
      } else {
        (rateObj as any)[field] = typeof val === 'number' ? Math.round(val * 100) / 100 : val;
      }

      return copy;
    });
  };

  const handleRegionMetaChange = (field: 'name' | 'areaDescription', text: string) => {
    setMatrixData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as SectoralRatesMatrix;
      const targetRegion = activeRegionTab === 'region1' ? copy.region1 : copy.region2;
      targetRegion[field] = text;
      return copy;
    });
  };

  const toggleGradeExpand = (grade: string) => {
    setExpandedGradeDetails((prev) => ({
      ...prev,
      [grade]: !prev[grade]
    }));
  };

  // Reset to default Sectoral Determination rates
  const handleResetToSectoral = () => {
    setMatrixData(JSON.parse(JSON.stringify(DEFAULT_SECTORAL_RATES_MATRIX)));
    showToast('Reset to statutory Sectoral Determination 6 & PSSBC rates');
  };

  // Save changes
  const handleSaveMatrix = async () => {
    setIsSaving(true);
    try {
      await updateRegionalRates(matrixData);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      showToast('Failed to save regional rates');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Site Region Assignment Toggle
  const handleToggleSiteRegion = (siteId: string, currentRegionId?: string) => {
    const nextRegionId = currentRegionId === 'region_2' ? 'region_1' : 'region_2';
    updateSite(siteId, { regionId: nextRegionId });
    showToast(`Site reassigned to ${nextRegionId === 'region_2' ? 'Region 2 (Area 2)' : 'Region 1 (Area 1)'}`);
  };

  const gradesList = ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Armed Response'];

  return (
    <div className={`flex flex-col ${inlineMode ? 'space-y-5' : 'space-y-4'}`}>
      {/* Top Banner & Region Tabs */}
      <div className="bg-[#0A1E33] p-4 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 grid place-items-center text-xl shadow-inner">
              ⚖️
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Sectoral Determination Wage Rates &amp; Statutory Benefits Hub
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono-code font-bold">
                  {isCloudConnected ? 'Cloud Synced' : 'Local Cached'}
                </span>
              </h3>
              <p className="text-xs text-[#8598A8]">
                South Africa PSSBC Sectoral Determination 6: Separate wage tariffs, benefits allowances, and client rates for Region 1 vs Region 2 by Grade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToSectoral}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#8598A8] hover:text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
              title="Reset all rates to standard baseline Sectoral Determination 6"
            >
              Reset to SD6 Baseline
            </button>
            <button
              onClick={handleSaveMatrix}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#042430] text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{isSaving ? 'Saving...' : '💾'}</span>
              <span>Save &amp; Apply Rates</span>
            </button>
          </div>
        </div>

        {/* Region Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveRegionTab('region1')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeRegionTab === 'region1'
                ? 'bg-[#1FA6C9]/20 border-[#1FA6C9] text-white shadow-md shadow-[#1FA6C9]/10'
                : 'bg-[#071726]/60 border-white/10 text-[#8598A8] hover:text-white'
            }`}
          >
            <div>
              <div className="font-bold text-xs flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${activeRegionTab === 'region1' ? 'bg-[#3FC9E9] ring-2 ring-[#3FC9E9]/30' : 'bg-gray-500'}`} />
                {matrixData.region1.name}
              </div>
              <div className="text-[10.5px] text-[#8598A8] mt-1 line-clamp-1">
                {matrixData.region1.areaDescription}
              </div>
            </div>
            <span className="text-[11px] font-mono-code font-bold text-[#3FC9E9] px-2 py-1 rounded-lg bg-black/30">
              Grade C: R{matrixData.region1.rates['Grade C']?.totalRateInclBenefits.toFixed(2)}/hr
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRegionTab('region2')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeRegionTab === 'region2'
                ? 'bg-[#1FA6C9]/20 border-[#1FA6C9] text-white shadow-md shadow-[#1FA6C9]/10'
                : 'bg-[#071726]/60 border-white/10 text-[#8598A8] hover:text-white'
            }`}
          >
            <div>
              <div className="font-bold text-xs flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${activeRegionTab === 'region2' ? 'bg-[#3FC9E9] ring-2 ring-[#3FC9E9]/30' : 'bg-gray-500'}`} />
                {matrixData.region2.name}
              </div>
              <div className="text-[10.5px] text-[#8598A8] mt-1 line-clamp-1">
                {matrixData.region2.areaDescription}
              </div>
            </div>
            <span className="text-[11px] font-mono-code font-bold text-emerald-400 px-2 py-1 rounded-lg bg-black/30">
              Grade C: R{matrixData.region2.rates['Grade C']?.totalRateInclBenefits.toFixed(2)}/hr
            </span>
          </button>
        </div>
      </div>

      {/* Region Customizer Card */}
      <div className="bg-[#071726] p-4 rounded-2xl border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#3FC9E9] block mb-1">
              Active Region Title
            </label>
            <input
              type="text"
              value={currentRegion.name}
              onChange={(e) => handleRegionMetaChange('name', e.target.value)}
              className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#3FC9E9]"
            />
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#8598A8] block mb-1">
              Jurisdiction &amp; Municipal Scope Description
            </label>
            <input
              type="text"
              value={currentRegion.areaDescription}
              onChange={(e) => handleRegionMetaChange('areaDescription', e.target.value)}
              className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3FC9E9]"
            />
          </div>
        </div>

        {/* Grade Rates Cards & Tables */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8598A8] font-bold uppercase tracking-wider px-2">
            <span>Security Officer Grade</span>
            <span className="hidden sm:inline">Statutory Breakdown (Basic + Benefits = Rate Incl Benefits) vs Client Tariff</span>
          </div>

          {gradesList.map((grade) => {
            const rateObj = currentRegion.rates[grade] || {
              grade,
              basicHourlyRate: 36.50,
              benefitsHourlyRate: 7.00,
              totalRateInclBenefits: 43.50,
              clientBillingRate: 80.00,
              providentFundRate: 2.74,
              medicalAllowance: 2.50,
              uniformAllowance: 1.76
            };

            const isExpanded = Boolean(expandedGradeDetails[grade]);
            const marginAmount = Math.round((rateObj.clientBillingRate - rateObj.totalRateInclBenefits) * 100) / 100;
            const marginPct = rateObj.clientBillingRate > 0
              ? Math.round((marginAmount / rateObj.clientBillingRate) * 100)
              : 0;

            return (
              <div
                key={grade}
                className="bg-[#0A1E33] rounded-2xl border border-white/10 p-4 transition-all hover:border-white/20 shadow-sm"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  {/* Grade Badge */}
                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono-code ${
                        grade === 'Grade A' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        grade === 'Grade B' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        grade === 'Armed Response' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {grade}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleGradeExpand(grade)}
                        className="text-[10px] text-[#3FC9E9] hover:underline cursor-pointer"
                      >
                        {isExpanded ? 'Hide Benefits' : 'Benefits Breakdown ▾'}
                      </button>
                    </div>
                    <div className="text-[10px] text-[#8598A8] mt-1 truncate">
                      {rateObj.notes || 'Sectoral statutory baseline'}
                    </div>
                  </div>

                  {/* 1. Basic Rate Input */}
                  <div className="lg:col-span-2 bg-[#071726] p-2.5 rounded-xl border border-white/10">
                    <label className="text-[10px] uppercase font-bold text-[#8598A8] block mb-0.5">
                      Basic Rate (R/hr)
                    </label>
                    <DecimalRateInput
                      value={rateObj.basicHourlyRate}
                      onChange={(newVal) => handleRateFieldChange(grade, 'basicHourlyRate', newVal)}
                      className="font-bold"
                      inputClassName="text-sm font-bold text-white focus:text-[#3FC9E9]"
                    />
                  </div>

                  {/* 2. Benefits Rate Input */}
                  <div className="lg:col-span-2 bg-[#071726] p-2.5 rounded-xl border border-white/10">
                    <label className="text-[10px] uppercase font-bold text-[#8598A8] block mb-0.5">
                      Benefits Rate (R/hr)
                    </label>
                    <DecimalRateInput
                      value={rateObj.benefitsHourlyRate}
                      onChange={(newVal) => handleRateFieldChange(grade, 'benefitsHourlyRate', newVal)}
                      className="font-bold"
                      inputClassName="text-sm font-bold text-emerald-400 focus:text-emerald-300"
                    />
                  </div>

                  {/* 3. TOTAL Rate Incl Benefits (Prominent Green Box) */}
                  <div className="lg:col-span-3 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/40">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-extrabold text-emerald-300 block mb-0.5">
                        Rate Incl. Benefits (R/hr) ★
                      </label>
                      <span className="text-[9px] text-emerald-400 font-mono-code">Basic + Benefits</span>
                    </div>
                    <DecimalRateInput
                      value={rateObj.totalRateInclBenefits}
                      onChange={(newVal) => handleRateFieldChange(grade, 'totalRateInclBenefits', newVal)}
                      className="font-bold"
                      inputClassName="text-sm font-extrabold text-emerald-300 focus:text-white"
                    />
                  </div>

                  {/* 4. Client Contract Tariff & Margin */}
                  <div className="lg:col-span-2 bg-[#071726] p-2.5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-[#8598A8] block mb-0.5">
                        Client Tariff
                      </label>
                      <span className="text-[9.5px] font-mono-code font-bold text-[#3FC9E9]">
                        {marginPct}% Margin
                      </span>
                    </div>
                    <DecimalRateInput
                      value={rateObj.clientBillingRate}
                      onChange={(newVal) => handleRateFieldChange(grade, 'clientBillingRate', newVal)}
                      className="font-bold"
                      inputClassName="text-sm font-bold text-[#3FC9E9] focus:text-white"
                    />
                  </div>
                </div>

                {/* Optional Granular Statutory Benefits Breakdown Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10 bg-[#071726]/60 -mx-4 -mb-4 p-4 rounded-b-2xl animate-in slide-in-from-top-2 duration-150">
                    <div className="text-[11px] font-bold uppercase text-[#8598A8] mb-2 flex items-center justify-between">
                      <span>Granular Benefits Composition for {grade}</span>
                      <span className="text-[10px] text-emerald-400">Total Benefits: R{rateObj.benefitsHourlyRate.toFixed(2)}/hr</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-[#0A1E33] p-2.5 rounded-xl border border-white/10">
                        <label className="text-[10px] text-[#8598A8] block">Provident Fund (PSSBC 7.5%)</label>
                        <div className="mt-1">
                          <DecimalRateInput
                            value={rateObj.providentFundRate ?? Math.round(rateObj.basicHourlyRate * 0.075 * 100) / 100}
                            onChange={(newVal) => handleRateFieldChange(grade, 'providentFundRate', newVal)}
                            inputClassName="text-xs font-bold text-white"
                          />
                        </div>
                      </div>

                      <div className="bg-[#0A1E33] p-2.5 rounded-xl border border-white/10">
                        <label className="text-[10px] text-[#8598A8] block">Medical / Health Plan Allowance</label>
                        <div className="mt-1">
                          <DecimalRateInput
                            value={rateObj.medicalAllowance ?? 2.50}
                            onChange={(newVal) => handleRateFieldChange(grade, 'medicalAllowance', newVal)}
                            inputClassName="text-xs font-bold text-white"
                          />
                        </div>
                      </div>

                      <div className="bg-[#0A1E33] p-2.5 rounded-xl border border-white/10">
                        <label className="text-[10px] text-[#8598A8] block">Uniform &amp; Cleaning Allowance</label>
                        <div className="mt-1">
                          <DecimalRateInput
                            value={rateObj.uniformAllowance ?? 1.50}
                            onChange={(newVal) => handleRateFieldChange(grade, 'uniformAllowance', newVal)}
                            inputClassName="text-xs font-bold text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Site Region Allocation Matrix */}
      <div className="bg-[#0A1E33] p-4 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>🏢</span>
              <span>Site Regional Deployment Mapping ({sites.length} Protected Sites)</span>
            </h4>
            <p className="text-[11px] text-[#8598A8]">
              Click on any site to switch its Sectoral Determination Area (Region 1 vs Region 2). Guards deployed to these sites automatically inherit the regional tariff.
            </p>
          </div>
          <div className="text-xs font-mono-code font-bold text-white flex items-center gap-3">
            <span className="text-[#3FC9E9]">
              Region 1: {sites.filter((s) => (s.regionId || 'region_1') === 'region_1').length}
            </span>
            <span className="text-emerald-400">
              Region 2: {sites.filter((s) => s.regionId === 'region_2').length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {sites.map((site) => {
            const isReg2 = site.regionId === 'region_2';
            const guardsCount = officersList.filter((o) => o.currentSite === site.name).length;

            return (
              <div
                key={site.id}
                onClick={() => handleToggleSiteRegion(site.id, site.regionId)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isReg2
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                    : 'bg-[#071726] border-white/10 hover:border-[#1FA6C9]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-bold text-white line-clamp-1">{site.name}</span>
                  <span className={`text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded-full ${
                    isReg2
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-[#1FA6C9]/20 text-[#3FC9E9] border border-[#1FA6C9]/30'
                  }`}>
                    {isReg2 ? 'Region 2' : 'Region 1'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#8598A8] mt-2 pt-1 border-t border-white/5">
                  <span>{guardsCount} Guards Deployed</span>
                  <span className="text-[#3FC9E9] text-[9.5px]">Click to Switch ⇄</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
