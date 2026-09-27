import React, { useState, useMemo } from 'react';
import { useDutyOn } from '../../context/DutyOnContext';

export const ManualClockInModal: React.FC = () => {
  const {
    isManualClockInModalOpen,
    setIsManualClockInModalOpen,
    officersList,
    sites,
    manualClockInOfficer,
    manualClockOutOfficer,
    showToast
  } = useDutyOn();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [targetSite, setTargetSite] = useState<string>('Provincial Office');
  const [targetPost, setTargetPost] = useState<string>('Main Security Post');
  const [shiftType, setShiftType] = useState<'DAY' | 'NIGHT'>('DAY');

  // Filtered officers list
  const filteredOfficers = useMemo(() => {
    return officersList.filter((off) => {
      const matchSite = selectedSiteFilter === 'ALL' || (off.currentSite || off.siteDeployed) === selectedSiteFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        off.name.toLowerCase().includes(q) ||
        off.grade.toLowerCase().includes(q) ||
        (off.empId && off.empId.toLowerCase().includes(q)) ||
        (off.currentSite && off.currentSite.toLowerCase().includes(q));

      return matchSite && matchQ;
    });
  }, [officersList, selectedSiteFilter, searchQuery]);

  const activeOfficer = officersList.find((o) => o.id === selectedOfficerId);

  // Sync target site & post when selecting officer
  const handleSelectOfficer = (id: string) => {
    setSelectedOfficerId(id);
    const off = officersList.find((o) => o.id === id);
    if (off) {
      if (off.currentSite) setTargetSite(off.currentSite);
      if (off.currentPost) setTargetPost(off.currentPost);
    }
  };

  if (!isManualClockInModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-[#0A1E33] border border-white/20 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#081829]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 grid place-items-center text-amber-400">
              <svg className="w-5 h-5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg text-white">
                Visual Shift Command · Manual Muster Roll Call
              </h3>
              <p className="text-xs text-[#8598A8]">
                Manually clock in or out guards &amp; relief workers from the Control Room with full cloud sync
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsManualClockInModalOpen(false)}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/15 text-slate-400 hover:text-white grid place-items-center cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-white/10 bg-[#071726] flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guard by name, grade, employee ID..."
              className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#1FA6C9]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedSiteFilter}
            onChange={(e) => setSelectedSiteFilter(e.target.value)}
            className="bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
          >
            <option value="ALL">All Sites ({sites.length})</option>
            {sites.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Officers Roll Call Selection List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-72">
          {filteredOfficers.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#8598A8]">
              No guards match your search query.
            </div>
          ) : (
            filteredOfficers.map((off) => {
              const isSelected = off.id === selectedOfficerId;
              const isClocked = Boolean(off.isClockedIn);

              return (
                <div
                  key={off.id}
                  onClick={() => handleSelectOfficer(off.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#1FA6C9]/15 border-[#1FA6C9] ring-1 ring-[#1FA6C9]/40'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl font-bold grid place-items-center text-xs flex-none ${
                        isClocked
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-white/10'
                      }`}
                    >
                      {off.avatarInitial || off.name[0] || 'O'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs truncate">{off.name}</span>
                        <span className="font-mono-code text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-[#3FC9E9]">
                          {off.grade}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8598A8] truncate mt-0.5">
                        {off.currentSite || 'Provincial Office'} · {off.currentPost || 'General Post'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-none">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold flex items-center gap-1 ${
                        isClocked
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-white/10'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isClocked ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                      {isClocked ? `ON DUTY (${off.clockInTime || 'Active'})` : 'OFF DUTY'}
                    </span>

                    {/* Quick 1-click action right on list */}
                    {isClocked ? (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await manualClockOutOfficer(off.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-bold cursor-pointer transition-all"
                      >
                        Clock Out
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await manualClockInOfficer(off.id, off.currentSite, off.currentPost);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold cursor-pointer transition-all"
                      >
                        Clock In
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Officer Details & Custom Site/Post Assignment */}
        {activeOfficer && (
          <div className="p-4 border-t border-white/10 bg-[#071726] space-y-3">
            <div className="text-xs font-semibold text-white flex items-center justify-between">
              <span>Selected for Shift Deployment: <strong className="text-[#3FC9E9]">{activeOfficer.name}</strong></span>
              <span className="font-mono-code text-[#8598A8] text-[11px]">
                ID: {activeOfficer.empId || activeOfficer.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[#8598A8] mb-1 font-semibold text-[11px]">Deploy to Site</label>
                <select
                  value={targetSite}
                  onChange={(e) => setTargetSite(e.target.value)}
                  className="w-full bg-[#0A1E33] border border-white/15 rounded-xl p-2 text-white text-xs focus:outline-none focus:border-[#1FA6C9]"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8598A8] mb-1 font-semibold text-[11px]">Duty Post Assignment</label>
                <input
                  type="text"
                  value={targetPost}
                  onChange={(e) => setTargetPost(e.target.value)}
                  placeholder="e.g. Main Gate, Loading Bay"
                  className="w-full bg-[#0A1E33] border border-white/15 rounded-xl p-2 text-white text-xs focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="block text-[#8598A8] mb-1 font-semibold text-[11px]">Shift Window</label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as 'DAY' | 'NIGHT')}
                  className="w-full bg-[#0A1E33] border border-white/15 rounded-xl p-2 text-white text-xs focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value="DAY">Day Shift (06:00 – 18:00)</option>
                  <option value="NIGHT">Night Shift (18:00 – 06:00)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              {activeOfficer.isClockedIn ? (
                <button
                  type="button"
                  onClick={async () => {
                    await manualClockOutOfficer(activeOfficer.id);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-rose-600/20 active:scale-95"
                >
                  🔴 Clock Out of Shift
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    await manualClockInOfficer(activeOfficer.id, targetSite, targetPost);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#042430] font-display font-extrabold text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  🟢 Confirm &amp; Clock In to Post
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#081829] flex items-center justify-between text-xs text-[#8598A8]">
          <div className="flex items-center gap-3">
            <span>
              On Duty: <strong className="text-emerald-400 font-mono-code">{officersList.filter((o) => o.isClockedIn).length}</strong>
            </span>
            <span>·</span>
            <span>
              Standby: <strong className="text-white font-mono-code">{officersList.filter((o) => !o.isClockedIn).length}</strong>
            </span>
          </div>

          <button
            onClick={() => setIsManualClockInModalOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
