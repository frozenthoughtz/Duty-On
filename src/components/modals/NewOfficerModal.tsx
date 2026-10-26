import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { OfficerRecord } from '../../types/dutyon';
import { getRateForRegionAndGrade } from '../../utils/payrollSectoral';
import { DecimalRateInput } from '../common/DecimalRateInput';

interface Props {
  isOpen?: boolean;
  onClose: () => void;
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const NewOfficerModal: React.FC<Props> = ({ isOpen = true, onClose }) => {
  const { sites, addRosterOfficer, showToast, regionalRates } = useDutyOn();

  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [empId, setEmpId] = useState(`EMP-${Math.floor(10000 + Math.random() * 90000)}`);
  const [psiraNumber, setPsiraNumber] = useState(`PSIRA-${Math.floor(2000000 + Math.random() * 9000000)}`);
  const [grade, setGrade] = useState('Grade C');
  const [phone, setPhone] = useState('+27 82 555 ');
  const [email, setEmail] = useState('');
  const [currentSite, setCurrentSite] = useState(sites[0]?.name || 'Kwamagxaki Shopping Centre');
  const [currentPost, setCurrentPost] = useState('Main Vehicle Gate');
  const [location, setLocation] = useState('Kwamagxaki, Gqeberha');
  
  // Sectoral Region & Rates (ZAR) - Supports exact decimals with cents
  const [regionId, setRegionId] = useState<'region_1' | 'region_2'>('region_1');
  const [hourlyRate, setHourlyRate] = useState<number>(36.50);
  const [benefitsHourlyRate, setBenefitsHourlyRate] = useState<number>(7.00);
  const [totalRateInclBenefits, setTotalRateInclBenefits] = useState<number>(43.50);
  const [clientBillingRate, setClientBillingRate] = useState<number>(82.00);

  // Availability
  const [availableDays, setAvailableDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [shiftPreference, setShiftPreference] = useState<'ALL' | 'DAY' | 'NIGHT'>('ALL');
  
  // Emergency Contact
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+27 ');

  // Competency
  const [firearmCompetency, setFirearmCompetency] = useState(false);
  const [firstAidCert, setFirstAidCert] = useState(true);

  // Auto-suggest standard Sectoral Determination rates based on Grade & Region
  const handleGradeChange = (newGrade: string, targetRegion = regionId) => {
    setGrade(newGrade);
    const defaults = getRateForRegionAndGrade(regionalRates, targetRegion, newGrade);
    setHourlyRate(defaults.basicHourlyRate);
    setBenefitsHourlyRate(defaults.benefitsHourlyRate);
    setTotalRateInclBenefits(defaults.totalRateInclBenefits);
    setClientBillingRate(defaults.clientBillingRate);
  };

  const handleRegionChange = (newRegion: 'region_1' | 'region_2') => {
    setRegionId(newRegion);
    handleGradeChange(grade, newRegion);
  };

  const handleTotalRateChange = (newTotal: number) => {
    setTotalRateInclBenefits(newTotal);
    if (newTotal >= hourlyRate) {
      setBenefitsHourlyRate(Math.round((newTotal - hourlyRate) * 100) / 100);
    } else {
      setHourlyRate(newTotal);
      setBenefitsHourlyRate(0);
    }
  };

  const handleBasicRateChange = (newBasic: number) => {
    setHourlyRate(newBasic);
    setTotalRateInclBenefits(Math.round((newBasic + benefitsHourlyRate) * 100) / 100);
  };

  const handleBenefitsRateChange = (newBenefits: number) => {
    setBenefitsHourlyRate(newBenefits);
    setTotalRateInclBenefits(Math.round((hourlyRate + newBenefits) * 100) / 100);
  };

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter the officer name');
      return;
    }

    const newOfficer: OfficerRecord = {
      id: `off-${Date.now()}`,
      name: name.trim(),
      empId,
      psiraNumber,
      grade,
      phone: phone.trim(),
      email: email.trim() || undefined,
      currentSite,
      currentPost,
      location: location.trim(),
      hourlyRate: Number(hourlyRate) || 0,
      benefitsHourlyRate: Number(benefitsHourlyRate) || 0,
      totalRateInclBenefits: Number(totalRateInclBenefits) || (Number(hourlyRate) + Number(benefitsHourlyRate)),
      clientBillingRate: Number(clientBillingRate) || 0,
      regionId,
      availableDays,
      shiftPreference,
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      isClockedIn: false,
      batteryLevel: 100,
      welfareStatus: 'normal',
      lastScanTime: 'Enrolled in master database',
      firearmCompetency,
      firstAidCert,
      avatarInitial: name.trim().charAt(0).toUpperCase(),
      documents: [
        {
          id: `doc-psira-${Date.now()}`,
          name: `${name.trim()} PSIRA Verification.pdf`,
          category: 'Compliance',
          description: 'Official PSIRA database verified registration',
          type: 'PDF',
          iconType: 'psira'
        }
      ]
    };

    addRosterOfficer(newOfficer);
    showToast(`✓ Officer ${newOfficer.name} enrolled (R${newOfficer.totalRateInclBenefits?.toFixed(2)}/hr incl. benefits)`);
    onClose();
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0A1E33] border border-white/15 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#071726]/90 flex-none">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#1FA6C9]/20 text-[#3FC9E9] grid place-items-center text-xl border border-[#1FA6C9]/30">
              👮
            </span>
            <div>
              <h2 className="font-display font-bold text-base text-white">Enroll Security Officer</h2>
              <p className="text-[11px] text-[#8598A8]">Register rates, site assignment, location &amp; availability</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white grid place-items-center transition-all cursor-pointer text-sm font-bold active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
          {/* Personal Info */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#3FC9E9] flex items-center gap-1.5">
              <span>👤</span> Officer Identification
            </div>
            
            <div>
              <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bongani Zungu"
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  PSIRA Grade
                </label>
                <select
                  value={grade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value="Grade C">Grade C (Patrol Guard)</option>
                  <option value="Grade B">Grade B (Access Controller)</option>
                  <option value="Grade A">Grade A (Site Supervisor)</option>
                  <option value="Grade A (Armed)">Grade A (Armed Tactical)</option>
                </select>
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Employee Number
                </label>
                <input
                  type="text"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  PSIRA Reg Number
                </label>
                <input
                  type="text"
                  value={psiraNumber}
                  onChange={(e) => setPsiraNumber(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Mobile Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Residential Area / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kwamagxaki, Gqeberha"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@dutyon.co.za"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>
          </div>

          {/* Hourly Rates & Sectoral Determination */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5BCB80] flex items-center justify-between">
              <span className="flex items-center gap-1.5">💰 Wage &amp; Billing Rates (ZAR)</span>
              <span className="text-[10px] text-[#8598A8] font-normal">Sectoral Determination 6 · Decimals &amp; Cents Allowed</span>
            </div>

            {/* Region Selector Pills */}
            <div className="bg-[#071726] p-2.5 rounded-xl border border-white/10 flex items-center justify-between gap-2">
              <span className="text-[10.5px] uppercase font-bold text-[#8598A8]">Sectoral Region:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRegionChange('region_1')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    regionId === 'region_1'
                      ? 'bg-[#1FA6C9] text-[#042430] shadow-sm'
                      : 'bg-white/5 text-[#8598A8] hover:text-white'
                  }`}
                >
                  Region 1 (Area 1 - Metro)
                </button>
                <button
                  type="button"
                  onClick={() => handleRegionChange('region_2')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    regionId === 'region_2'
                      ? 'bg-emerald-500 text-[#042430] shadow-sm'
                      : 'bg-white/5 text-[#8598A8] hover:text-white'
                  }`}
                >
                  Region 2 (Area 2 - Non-Metro)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* 1. Base Wage Rate */}
              <div className="bg-[#071726] p-3 rounded-xl border border-white/10">
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1 font-semibold">
                  Base Wage (R/hr)
                </label>
                <DecimalRateInput
                  value={hourlyRate}
                  onChange={handleBasicRateChange}
                  className="border-b border-white/20 pb-1 font-bold"
                  inputClassName="text-base font-bold text-[#5BCB80] focus:text-[#5BCB80]"
                  placeholder="33.66"
                />
                <div className="text-[9.5px] text-[#8598A8] mt-1">Basic hourly wage</div>
              </div>

              {/* 2. Benefits Rate */}
              <div className="bg-[#071726] p-3 rounded-xl border border-white/10">
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1 font-semibold">
                  Benefits (R/hr)
                </label>
                <DecimalRateInput
                  value={benefitsHourlyRate}
                  onChange={handleBenefitsRateChange}
                  className="border-b border-white/20 pb-1 font-bold"
                  inputClassName="text-base font-bold text-emerald-400 focus:text-emerald-400"
                  placeholder="7.00"
                />
                <div className="text-[9.5px] text-[#8598A8] mt-1">Provident, Medical, UIF</div>
              </div>

              {/* 3. Rate Incl Benefits */}
              <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/40">
                <label className="text-[10.5px] text-emerald-300 uppercase tracking-wider block mb-1 font-bold">
                  Rate Incl. Benefits ★
                </label>
                <DecimalRateInput
                  value={totalRateInclBenefits}
                  onChange={handleTotalRateChange}
                  className="border-b border-emerald-400/40 pb-1 font-bold"
                  inputClassName="text-base font-extrabold text-emerald-300 focus:text-emerald-300"
                  placeholder="40.66"
                />
                <div className="text-[9.5px] text-emerald-400/80 mt-1">Manual all-inclusive rate</div>
              </div>

              {/* 4. Client Billing Tariff */}
              <div className="bg-[#071726] p-3 rounded-xl border border-white/10">
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1 font-semibold">
                  Client Tariff (R/hr)
                </label>
                <DecimalRateInput
                  value={clientBillingRate}
                  onChange={(val) => setClientBillingRate(Math.round(val * 100) / 100)}
                  className="border-b border-white/20 pb-1 font-bold"
                  inputClassName="text-base font-bold text-[#3FC9E9] focus:text-[#3FC9E9]"
                  placeholder="82.00"
                />
                <div className="text-[9.5px] text-[#8598A8] mt-1">Contract client invoice</div>
              </div>
            </div>
          </div>

          {/* Site Deployment & Post */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#1FA6C9] flex items-center gap-1.5">
              <span>🏢</span> Site Assignment &amp; Post
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Assigned Client Site
                </label>
                <select
                  value={currentSite}
                  onChange={(e) => setCurrentSite(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Assigned Post / Station
                </label>
                <input
                  type="text"
                  value={currentPost}
                  onChange={(e) => setCurrentPost(e.target.value)}
                  placeholder="e.g. Main Vehicle Boom Gate"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>
          </div>

          {/* Availability & Shift Schedule */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#E7A13A] flex items-center gap-1.5">
              <span>📅</span> Work Availability &amp; Shift Preference
            </div>

            <div>
              <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1.5">
                Available Days to be Worked
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_DAYS.map((d) => {
                  const isSelected = availableDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1FA6C9] text-[#042430] shadow-sm'
                          : 'bg-white/5 text-[#8598A8] hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Shift Preference
                </label>
                <select
                  value={shiftPreference}
                  onChange={(e) => setShiftPreference(e.target.value as any)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value="ALL">Flexible (Day &amp; Night Shifts)</option>
                  <option value="DAY">Day Shifts Only (06:00 - 18:00)</option>
                  <option value="NIGHT">Night Shifts Only (18:00 - 06:00)</option>
                </select>
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Max Weekly Hours
                </label>
                <input
                  type="number"
                  defaultValue={48}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#a9bccb] flex items-center gap-1.5">
              <span>🚨</span> Emergency Next of Kin
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Next of Kin Name
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Nokuthula Zungu (Spouse)"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Emergency Phone
                </label>
                <input
                  type="text"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>
          </div>

          {/* Competency Flags */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="flex items-center gap-2.5 bg-[#071726] p-3 rounded-xl border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
              <input
                type="checkbox"
                checked={firearmCompetency}
                onChange={(e) => setFirearmCompetency(e.target.checked)}
                className="rounded accent-[#1FA6C9] w-4 h-4"
              />
              <div>
                <div className="text-white font-semibold text-xs">
                  SAPS Firearm Competency Certificate (SAPS 511a)
                </div>
                <div className="text-[10.5px] text-[#8598A8]">
                  Officer is licensed and qualified to carry firearm on armed response / cash escort
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 bg-[#071726] p-3 rounded-xl border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
              <input
                type="checkbox"
                checked={firstAidCert}
                onChange={(e) => setFirstAidCert(e.target.checked)}
                className="rounded accent-[#1FA6C9] w-4 h-4"
              />
              <div>
                <div className="text-white font-semibold text-xs">
                  First Aid Level 1 Certified
                </div>
                <div className="text-[10.5px] text-[#8598A8]">
                  Qualified for medical triage and emergency CPR on site
                </div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#8598A8] hover:text-white px-4 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#3AA655] hover:bg-[#34944c] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-900/30 flex items-center gap-2"
            >
              <span>✓</span>
              <span>Enroll Officer to System</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};

