import React, { useState } from 'react';
import { useDutyOn } from '../../context/DutyOnContext';
import { GuardRosterEntry } from '../../types/dutyon';

interface AddOfficerToRosterModalProps {
  currentGuards: GuardRosterEntry[];
  onAddGuard: (newGuard: GuardRosterEntry) => void;
  onClose: () => void;
}

export const AddOfficerToRosterModal: React.FC<AddOfficerToRosterModalProps> = ({
  currentGuards,
  onAddGuard,
  onClose
}) => {
  const { officersList, setIsNewOfficerModalOpen, showToast } = useDutyOn();

  const [search, setSearch] = useState('');
  const [preferenceFilter, setPreferenceFilter] = useState<'ALL' | 'Day Shift Only' | 'Night Shift Only' | 'Rotational (Day & Night)'>('ALL');
  const [dayFilter, setDayFilter] = useState<string>('ALL');

  const existingIds = new Set(currentGuards.map((g) => g.id));
  const existingEmpIds = new Set(currentGuards.map((g) => g.empId));

  const filteredOfficers = officersList.filter((off) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = off.name.toLowerCase().includes(q);
      const matchEmp = off.empId.toLowerCase().includes(q);
      const matchPsira = off.psiraNumber.toLowerCase().includes(q);
      const matchSite = (off.currentSite || '').toLowerCase().includes(q);
      const matchLoc = (off.location || '').toLowerCase().includes(q);
      if (!matchName && !matchEmp && !matchPsira && !matchSite && !matchLoc) return false;
    }

    // Preference
    if (preferenceFilter !== 'ALL' && off.shiftPreference !== preferenceFilter) {
      return false;
    }

    // Day availability
    if (dayFilter !== 'ALL') {
      const days = off.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      if (!days.includes(dayFilter)) return false;
    }

    return true;
  });

  const handleSelectOfficer = (off: any) => {
    const rosterEntry: GuardRosterEntry = {
      id: off.id,
      name: off.name,
      psiraNumber: off.psiraNumber || '2890141',
      grade: off.grade || 'Grade C',
      empId: off.empId,
      phone: off.phone || '071 555 1204',
      shifts: {}
    };

    onAddGuard(rosterEntry);
    showToast(`Added ${off.name} (${off.empId}) to active duty roster.`);
  };

  const handleAddAllAvailable = () => {
    const unadded = filteredOfficers.filter((o) => !existingIds.has(o.id) && !existingEmpIds.has(o.empId));
    if (unadded.length === 0) {
      showToast('All matching officers are already in the roster.');
      return;
    }

    unadded.forEach((off) => {
      const rosterEntry: GuardRosterEntry = {
        id: off.id,
        name: off.name,
        psiraNumber: off.psiraNumber || '2890141',
        grade: off.grade || 'Grade C',
        empId: off.empId,
        phone: off.phone || '071 555 1204',
        shifts: {}
      };
      onAddGuard(rosterEntry);
    });

    showToast(`Added ${unadded.length} enrolled officers to duty roster.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0B1E30] border border-white/20 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#081726] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#1FA6C9]/20 border border-[#1FA6C9]/30 text-[#3FC9E9] grid place-items-center text-lg shadow-md">
              👮
            </span>
            <div>
              <h2 className="font-display font-extrabold text-base text-white">
                Add Available Guards from Enrolled Officers
              </h2>
              <p className="text-xs text-[#8598A8]">
                Interconnected roster selection with hourly pay rates, work availability, and shift preferences.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white grid place-items-center text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-[#0A1A2A] border-b border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search enrolled officers by name, PSIRA, ID, site, location..."
                className="w-full bg-[#071726] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1FA6C9]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleAddAllAvailable}
                className="px-3.5 py-2 rounded-xl bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] border border-[#1FA6C9]/40 text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                + Add All Matching ({filteredOfficers.filter((o) => !existingIds.has(o.id) && !existingEmpIds.has(o.empId)).length})
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  setIsNewOfficerModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                + Enroll New
              </button>
            </div>
          </div>

          {/* Sub Filters: Shift Preference & Days */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#8598A8] text-[11px] font-semibold">Preference:</span>
              <select
                value={preferenceFilter}
                onChange={(e) => setPreferenceFilter(e.target.value as any)}
                className="bg-[#071726] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="ALL">All Shift Preferences</option>
                <option value="Day Shift Only">Day Shift Only</option>
                <option value="Night Shift Only">Night Shift Only</option>
                <option value="Rotational (Day & Night)">Rotational (Day & Night)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#8598A8] text-[11px] font-semibold">Available Day:</span>
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="bg-[#071726] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="ALL">Any Day</option>
                <option value="Mon">Monday</option>
                <option value="Tue">Tuesday</option>
                <option value="Wed">Wednesday</option>
                <option value="Thu">Thursday</option>
                <option value="Fri">Friday</option>
                <option value="Sat">Saturday</option>
                <option value="Sun">Sunday</option>
              </select>
            </div>

            <div className="text-[11px] text-[#8598A8]">
              Showing {filteredOfficers.length} enrolled guards
            </div>
          </div>
        </div>

        {/* Officer List Grid */}
        <div className="p-4 overflow-y-auto max-h-[55vh] space-y-2.5">
          {filteredOfficers.map((off) => {
            const isAlreadyAdded = existingIds.has(off.id) || existingEmpIds.has(off.empId);

            return (
              <div
                key={off.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isAlreadyAdded
                    ? 'bg-black/20 border-white/5 opacity-70'
                    : 'bg-[#0A1E33] border-white/10 hover:border-[#1FA6C9]/40'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-[#1FA6C9]/20 text-[#3FC9E9] grid place-items-center font-bold text-xs flex-none shadow-sm">
                    {off.avatarInitial || off.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-xs">{off.name}</span>
                      <span className="font-mono-code text-[10px] px-2 py-0.5 rounded bg-white/10 text-[#3FC9E9]">
                        {off.empId}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#1FA6C9]/15 text-[#3FC9E9] border border-[#1FA6C9]/30">
                        {off.grade}
                      </span>
                      {off.firearmCompetency && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          🔫 Armed
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#8598A8] mt-2">
                      <div>
                        <span className="text-[9px] uppercase block">Hourly Wage:</span>
                        <span className="font-mono-code font-bold text-[#5BCB80]">
                          R{(off.hourlyRate || 36.50).toFixed(2)}/hr
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase block">Client Bill:</span>
                        <span className="font-mono-code font-bold text-white">
                          R{(off.clientBillingRate || 82.00).toFixed(2)}/hr
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase block">Location:</span>
                        <span className="text-white truncate block">{off.location || 'Gqeberha'}</span>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase block">Shift Pref:</span>
                        <span className="text-[#3FC9E9] truncate block">{off.shiftPreference || 'Rotational'}</span>
                      </div>
                    </div>

                    {/* Available Days Chips */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[9px] uppercase text-[#8598A8]">Days:</span>
                      <div className="flex flex-wrap gap-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
                          const isAvail = (off.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).includes(d);
                          return (
                            <span
                              key={d}
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono-code ${
                                isAvail
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                                  : 'bg-white/5 text-slate-600'
                              }`}
                            >
                              {d}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Action Button */}
                <div className="flex-none flex items-center justify-end sm:self-center">
                  {isAlreadyAdded ? (
                    <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                      <span>✓</span>
                      <span>On Roster</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectOfficer(off)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1FA6C9] hover:bg-[#1894b4] text-[#042430] font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>+</span>
                      <span>Add to Roster</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredOfficers.length === 0 && (
            <div className="text-center py-8 text-[#8598A8] text-xs">
              No enrolled officers match this filter. Click "+ Enroll New" to enroll a guard with wage rates &amp; availability.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#081726] flex items-center justify-between">
          <div className="text-xs text-[#8598A8]">
            <span className="font-semibold text-white">{currentGuards.length}</span> guards currently scheduled on this roster.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
