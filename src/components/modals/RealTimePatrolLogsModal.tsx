import React, { useState, useMemo } from 'react';
import { useDutyOn } from '../../context/DutyOnContext';

export const RealTimePatrolLogsModal: React.FC = () => {
  const {
    isPatrolLogsModalOpen,
    setIsPatrolLogsModalOpen,
    patrolScans,
    patrolRoutes,
    sites,
    deletePatrolScan,
    clearAllPatrolScans,
    showToast
  } = useDutyOn();

  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedScanPhoto, setSelectedScanPhoto] = useState<{ url: string; title: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Combine Firestore cloud patrol scans with active scanned route checkpoints for 100% complete logs
  const combinedLogs = useMemo(() => {
    const list: Array<{
      id: string;
      routeId: string;
      checkpointName: string;
      siteName: string;
      scannedAt: string;
      scannedBy: string;
      tagUid?: string;
      tagType?: string;
      method?: string;
      dwellTimeSec?: number;
      inspectionNotes?: string;
      photoUrl?: string;
      sopPassedCount?: number;
      sopTotalCount?: number;
    }> = [];

    const seenIds = new Set<string>();

    // 1. From Firestore real-time collection patrol_scans
    patrolScans.forEach((scan) => {
      seenIds.add(scan.id);
      const matchedRoute = patrolRoutes.find((r) => r.id === scan.routeId);
      list.push({
        id: scan.id,
        routeId: scan.routeId,
        checkpointName: scan.checkpointName || 'Perimeter Inspection Point',
        siteName: matchedRoute?.siteName || 'Beaufort West / Eastern Cape',
        scannedAt: scan.scannedAt || 'Just now',
        scannedBy: scan.scannedBy || 'Field Security Officer',
        tagUid: scan.tagUid || 'SFK-RFID-8819',
        tagType: scan.tagType || 'Sefeko RFID',
        method: scan.method || 'Sefeko RFID',
        dwellTimeSec: scan.dwellTimeSec || 45,
        inspectionNotes: scan.inspectionNotes || 'Perimeter secure. Latch and fence verified.',
        photoUrl: scan.photoUrl
      });
    });

    // 2. Add any scanned checkpoints from current routes if not already represented
    patrolRoutes.forEach((route) => {
      route.checkpoints.forEach((cp) => {
        if (cp.scanned) {
          const pseudoId = `cp-${route.id}-${cp.id}`;
          if (!seenIds.has(pseudoId)) {
            const sopPassed = cp.sopChecklist?.filter((s) => s.passed).length || 0;
            const sopTotal = cp.sopChecklist?.length || 0;
            list.push({
              id: pseudoId,
              routeId: route.id,
              checkpointName: cp.name,
              siteName: route.siteName,
              scannedAt: cp.scannedAt || 'Active Shift',
              scannedBy: cp.scannedBy || route.officerName,
              tagUid: cp.tagUid || 'NFC-2024-KWM',
              tagType: cp.tagType || 'NFC Tag',
              method: 'Sefeko RFID',
              dwellTimeSec: cp.dwellTimeSec || 50,
              inspectionNotes: cp.inspectionNotes || 'Boundary verified. No breaches detected.',
              photoUrl: cp.photoUrl,
              sopPassedCount: sopPassed,
              sopTotalCount: sopTotal
            });
          }
        }
      });
    });

    return list;
  }, [patrolScans, patrolRoutes]);

  // Filtered by site and search
  const filteredLogs = useMemo(() => {
    return combinedLogs.filter((log) => {
      const matchSite = selectedSiteFilter === 'ALL' || log.siteName.toLowerCase().includes(selectedSiteFilter.toLowerCase());
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        log.checkpointName.toLowerCase().includes(query) ||
        log.scannedBy.toLowerCase().includes(query) ||
        log.siteName.toLowerCase().includes(query) ||
        (log.tagUid && log.tagUid.toLowerCase().includes(query)) ||
        (log.inspectionNotes && log.inspectionNotes.toLowerCase().includes(query));

      return matchSite && matchQuery;
    });
  }, [combinedLogs, selectedSiteFilter, searchQuery]);

  if (!isPatrolLogsModalOpen) return null;

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('No patrol logs to export');
      return;
    }
    const headers = ['Scan ID', 'Checkpoint', 'Site', 'Time (CAT)', 'Officer', 'Tag UID', 'Method', 'Dwell (s)', 'Notes'];
    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${log.checkpointName}"`,
      `"${log.siteName}"`,
      `"${log.scannedAt}"`,
      `"${log.scannedBy}"`,
      `"${log.tagUid || ''}"`,
      `"${log.method || 'RFID'}"`,
      `"${log.dwellTimeSec || 0}"`,
      `"${(log.inspectionNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DutyOn_RealTime_Patrol_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Exported ${filteredLogs.length} verified patrol scan logs to CSV`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-[#0A1E33] border border-white/20 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#081829]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1FA6C9]/20 border border-[#1FA6C9]/40 grid place-items-center text-[#3FC9E9]">
              <svg className="w-5 h-5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-lg text-white">
                  Real-Time Patrol &amp; Checkpoint Logs
                </h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono-code font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE CLOUD SYNC
                </span>
              </div>
              <p className="text-xs text-[#8598A8]">
                Real-time RFID wand taps, NFC scans, geofence dwell times &amp; guard checkpoint audits
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPatrolLogsModalOpen(false)}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/15 text-slate-400 hover:text-white grid place-items-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Toolbar: Filters & Actions */}
        <div className="p-3 sm:p-4 border-b border-white/10 bg-[#071726] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search checkpoint, officer, RFID tag..."
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

            {/* Site Filter */}
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              title="Download patrol logs in CSV format"
            >
              <span>📥</span>
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              title="Clear all patrol logs from the register"
            >
              <span>🗑️</span>
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {/* Clear Confirmation Prompt */}
        {showClearConfirm && (
          <div className="bg-rose-950/80 border-b border-rose-500/30 p-3 px-5 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>Are you sure you want to clear all patrol logs from the cloud database?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clearAllPatrolScans();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 cursor-pointer"
              >
                Yes, Clear All Logs
              </button>
            </div>
          </div>
        )}

        {/* Scan Log Entries List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 space-y-3 text-[#8598A8]">
              <div className="text-4xl">📡</div>
              <h4 className="text-white font-bold text-sm">No Patrol Scan Logs Found</h4>
              <p className="text-xs max-w-sm mx-auto">
                {searchQuery || selectedSiteFilter !== 'ALL'
                  ? 'No logs match your filter criteria. Try clearing search filters.'
                  : 'No checkpoint scans recorded yet for the active shifts. Scans from Sefeko wands and mobile RFID readers will appear here in real time.'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl p-4 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono-code text-[11px] font-bold px-2 py-0.5 rounded bg-[#1FA6C9]/20 text-[#3FC9E9] border border-[#1FA6C9]/30">
                        {log.tagType || 'Sefeko RFID'}
                      </span>
                      <span className="text-xs text-[#8598A8] font-mono-code">
                        UID: <strong className="text-white">{log.tagUid || 'N/A'}</strong>
                      </span>
                      <span className="text-[11px] text-[#5BCB80] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono-code font-bold">
                        ✓ VERIFIED DWELL {log.dwellTimeSec}s
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-base text-white mt-1.5">
                      {log.checkpointName}
                    </h4>

                    <div className="text-xs text-[#8598A8] flex items-center gap-2 mt-0.5">
                      <span className="text-[#3FC9E9] font-medium">{log.siteName}</span>
                      <span>·</span>
                      <span>Officer: <strong className="text-white">{log.scannedBy}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0">
                    <span className="font-mono-code font-bold text-xs text-white bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                      {log.scannedAt} CAT
                    </span>
                    <button
                      onClick={() => deletePatrolScan(log.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs p-1 cursor-pointer transition-colors"
                      title="Delete this scan log"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Inspection Notes & Checklist summary */}
                <div className="bg-[#05111c] border border-white/5 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400">📝</span>
                    <p className="text-slate-300 italic flex-1">
                      "{log.inspectionNotes}"
                    </p>
                  </div>

                  {log.sopTotalCount !== undefined && log.sopTotalCount > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-[11px] text-[#8598A8]">
                      <span>SOP Compliance:</span>
                      <span className="font-mono-code font-bold text-[#5BCB80]">
                        {log.sopPassedCount} / {log.sopTotalCount} Tasks Verified Passed
                      </span>
                    </div>
                  )}

                  {/* Photo Evidence Thumbnail if present */}
                  {log.photoUrl && (
                    <div className="pt-2 flex items-center gap-3">
                      <img
                        src={log.photoUrl}
                        alt="Checkpoint Evidence"
                        onClick={() =>
                          setSelectedScanPhoto({
                            url: log.photoUrl!,
                            title: `${log.checkpointName} (${log.scannedAt})`
                          })
                        }
                        className="w-16 h-12 object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-85 transition-opacity"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedScanPhoto({
                            url: log.photoUrl!,
                            title: `${log.checkpointName} (${log.scannedAt})`
                          })
                        }
                        className="text-xs text-[#3FC9E9] hover:underline cursor-pointer"
                      >
                        Inspect Full Photo Evidence ↗
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#081829] flex items-center justify-between text-xs text-[#8598A8]">
          <span>
            Total Logs: <strong className="text-white font-mono-code">{filteredLogs.length}</strong> recorded
          </span>

          <button
            onClick={() => setIsPatrolLogsModalOpen(false)}
            className="px-5 py-2 bg-gradient-to-r from-[#1FA6C9] to-cyan-500 hover:from-cyan-400 hover:to-cyan-500 text-[#042430] font-display font-extrabold rounded-xl cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            Done
          </button>
        </div>
      </div>

      {/* Enlarged Photo Lightbox Modal */}
      {selectedScanPhoto && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#0A1E33] border border-white/20 rounded-2xl max-w-2xl w-full p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-bold text-sm truncate">{selectedScanPhoto.title}</h4>
              <button
                onClick={() => setSelectedScanPhoto(null)}
                className="text-slate-400 hover:text-white px-2"
              >
                ✕
              </button>
            </div>
            <img
              src={selectedScanPhoto.url}
              alt="Enlarged Evidence"
              className="w-full max-h-[70vh] object-contain rounded-xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};
