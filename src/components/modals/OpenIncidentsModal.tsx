import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { IncidentQueueItem } from '../../types/dutyon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullDocket?: (incidentId: string) => void;
  onSwitchToIncidentsTab?: () => void;
}

export const OpenIncidentsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenFullDocket,
  onSwitchToIncidentsTab
}) => {
  const {
    incidents,
    sites,
    resolveIncident,
    deleteIncident,
    setIsNewIncidentModalOpen,
    showToast
  } = useDutyOn();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'open' | 'investigating' | 'dispatched' | 'resolved'>('open');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MED' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        const s = inc.status || 'open';
        if (s !== statusFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        const p = inc.priority.toUpperCase();
        if (priorityFilter === 'HIGH' && p !== 'HIGH' && p !== 'CRITICAL') return false;
        if (priorityFilter === 'MED' && p !== 'MED' && p !== 'MEDIUM') return false;
        if (priorityFilter === 'LOW' && p !== 'LOW' && p !== 'INFO') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCat = inc.category.toLowerCase().includes(q);
        const matchSite = inc.site.toLowerCase().includes(q);
        const matchDocket = (inc.sapsCaseNumber || '').toLowerCase().includes(q);
        const matchDesc = (inc.description || '').toLowerCase().includes(q);
        if (!matchCat && !matchSite && !matchDocket && !matchDesc) return false;
      }

      return true;
    });
  }, [incidents, statusFilter, priorityFilter, searchQuery]);

  const openCount = incidents.filter((i) => (i.status || 'open') === 'open').length;
  const criticalCount = incidents.filter((i) => i.priority.toUpperCase() === 'HIGH' || i.priority.toUpperCase() === 'CRITICAL').length;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0A1E33] border border-white/15 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-[#071726]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E0574B]/20 border border-[#E0574B]/30 text-[#E0574B] grid place-items-center text-xl flex-none shadow-sm animate-pulse">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-lg sm:text-xl text-white">
                  Live Operations Incidents Docket
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono-code font-bold bg-[#E0574B]/15 text-rose-300 border border-[#E0574B]/30">
                  {openCount} Open / Active
                </span>
                {criticalCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono-code font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {criticalCount} Critical Priority
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8598A8] mt-0.5">
                Centralized tactical dispatch, armed backup escalation, and SAPS docket tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                onClose();
                setIsNewIncidentModalOpen(true);
              }}
              className="px-3 py-1.5 bg-[#E0574B] hover:bg-rose-600 text-white font-display font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20"
            >
              <span>🚨</span>
              <span>+ Log New Incident</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-[#8598A8] hover:text-white grid place-items-center text-sm transition-all cursor-pointer flex-none"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:px-6 border-b border-white/10 bg-[#081B2E] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#8598A8] font-semibold mr-1">Status:</span>
            {[
              { key: 'open', label: `Open (${openCount})` },
              { key: 'ALL', label: `All (${incidents.length})` },
              { key: 'investigating', label: 'Investigating' },
              { key: 'dispatched', label: 'Dispatched' },
              { key: 'resolved', label: 'Resolved' }
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setStatusFilter(st.key as any)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st.key
                    ? 'bg-[#1FA6C9] text-[#042430] font-bold shadow-xs'
                    : 'bg-white/5 hover:bg-white/10 text-[#8598A8] hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search Query */}
          <div className="relative md:w-64">
            <input
              type="text"
              placeholder="Search category, docket, site…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#051320] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#5F7386] focus:outline-none focus:border-[#1FA6C9]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8598A8] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Incident List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="py-16 text-center text-[#8598A8] space-y-3 bg-[#071726]/40 rounded-2xl border border-white/5">
              <div className="text-3xl">🛡️</div>
              <div className="font-display font-bold text-sm text-white">
                No incidents match the active filter
              </div>
              <p className="text-xs max-w-sm mx-auto">
                {statusFilter === 'open'
                  ? 'All sites are operating in calm state. Zero open incidents pending dispatch.'
                  : 'No logged dockets match your search term or criteria.'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  setIsNewIncidentModalOpen(true);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>🚨</span>
                <span>Log First Incident Docket</span>
              </button>
            </div>
          ) : (
            filteredIncidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-[#071726] border border-white/10 hover:border-[#1FA6C9]/40 rounded-2xl p-4 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl grid place-items-center text-sm flex-none font-bold border shadow-xs ${
                    inc.priority.toUpperCase() === 'HIGH' || inc.priority.toUpperCase() === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : inc.priority.toUpperCase() === 'MED'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {inc.priority.toUpperCase() === 'HIGH' || inc.priority.toUpperCase() === 'CRITICAL' ? '🚨' : '⚠️'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-sm text-white group-hover:text-[#3FC9E9] transition-colors">
                        {inc.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase ${
                        inc.priority.toUpperCase() === 'HIGH' || inc.priority.toUpperCase() === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : inc.priority.toUpperCase() === 'MED'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {inc.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        (inc.status || 'open') === 'resolved'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : (inc.status || 'open') === 'dispatched'
                          ? 'bg-cyan-500/15 text-cyan-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}>
                        ● {(inc.status || 'open').toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-[#9db0c0] mt-1 line-clamp-2">
                      {inc.description}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#8598A8] font-mono-code flex-wrap">
                      <span className="flex items-center gap-1">
                        <span>📍</span>
                        <span className="text-white font-semibold">{inc.site}</span>
                      </span>
                      <span>•</span>
                      <span>⏱️ {inc.time}</span>
                      <span>•</span>
                      <span>👤 {inc.operator}</span>
                      {inc.sapsCaseNumber && (
                        <>
                          <span>•</span>
                          <span className="text-[#3FC9E9]">SAPS: {inc.sapsCaseNumber}</span>
                        </>
                      )}
                      {inc.evidence && inc.evidence.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400">📎 {inc.evidence.length} evidence file(s)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-none sm:self-center">
                  {(inc.status || 'open') !== 'resolved' && (
                    <button
                      onClick={() => {
                        resolveIncident(inc.id);
                        showToast(`Incident "${inc.category}" marked as resolved`);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer"
                    >
                      ✓ Resolve
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onOpenFullDocket) {
                        onOpenFullDocket(inc.id);
                      } else if (onSwitchToIncidentsTab) {
                        onSwitchToIncidentsTab();
                      }
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] border border-[#1FA6C9]/30 text-xs font-bold cursor-pointer flex items-center gap-1"
                  >
                    <span>Inspect Docket</span>
                    <span>↗</span>
                  </button>

                  <button
                    onClick={() => {
                      deleteIncident(inc.id);
                    }}
                    title="Delete Incident Docket"
                    className="p-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 text-xs cursor-pointer transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-white/10 bg-[#071726] flex items-center justify-between text-xs text-[#8598A8]">
          <div>
            Showing {filteredIncidents.length} of {incidents.length} total logged incidents
          </div>

          <div className="flex items-center gap-3">
            {onSwitchToIncidentsTab && (
              <button
                onClick={() => {
                  onClose();
                  onSwitchToIncidentsTab();
                }}
                className="text-[#3FC9E9] hover:underline font-semibold cursor-pointer flex items-center gap-1"
              >
                <span>Go to Full Incident Dispatch Board</span>
                <span>→</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
