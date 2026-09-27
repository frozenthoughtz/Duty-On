import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { OfflineQueueItem } from '../../types/dutyon';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_QUEUE: OfflineQueueItem[] = [
  {
    id: 'sync-001',
    operation: 'CHECKPOINT_SCAN',
    title: 'Checkpoint RFID Scan — CP-04 (East Perimeter)',
    summary: 'Sefeko Wand Tag #SF-9082 · 18m inside Geofence · Guard: Sipho Nxumalo',
    timestamp: '23:41:18',
    status: 'pending',
    retryCount: 0,
    sizeBytes: 1240
  },
  {
    id: 'sync-002',
    operation: 'BIOMETRIC_CLOCKIN',
    title: 'Facial Biometrics & Liveness Authentication',
    summary: 'Confidence: 99.4% · PSIRA #2890141 · Device: Samsung XCover 5',
    timestamp: '23:38:05',
    status: 'pending',
    retryCount: 1,
    sizeBytes: 84200
  },
  {
    id: 'sync-003',
    operation: 'OB_ENTRY',
    title: 'Occurrence Book #OB-8842 Handover',
    summary: 'Vehicles inspected: 14 · Key register signed · Perimeter fence intact',
    timestamp: '23:25:40',
    status: 'pending',
    retryCount: 0,
    sizeBytes: 3400
  },
  {
    id: 'sync-004',
    operation: 'DOC_UPLOAD',
    title: 'PSIRA Armed Guard Competency Certificate (PDF)',
    summary: 'File: S_Nxumalo_PSIRA_GradeA_2026.pdf (1.2 MB) · Hash: sha256-a9f2...81b',
    timestamp: '23:12:15',
    status: 'pending',
    retryCount: 0,
    sizeBytes: 1258291
  }
];

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({ isOpen, onClose }) => {
  const { showToast, isCloudConnected } = useDutyOn();
  const [queueItems, setQueueItems] = useState<OfflineQueueItem[]>(INITIAL_QUEUE);
  const [isSyncing, setIsSyncing] = useState(false);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'synced'>('all');

  // Keyboard Escape listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pendingCount = queueItems.filter((i) => i.status === 'pending').length;
  const syncedCount = queueItems.filter((i) => i.status === 'synced').length;

  const handleSyncAll = () => {
    if (simulatedOffline) {
      showToast('⚠️ Cannot sync while device is in Simulated Offline Mode. Re-enable network first.');
      return;
    }

    setIsSyncing(true);
    showToast('Flushing local indexed queue to Cloud Firestore…');

    // Staggered sync simulation
    let currentIdx = 0;
    const interval = setInterval(() => {
      setQueueItems((prev) =>
        prev.map((item, idx) => {
          if (idx === currentIdx) {
            return { ...item, status: 'syncing' };
          }
          if (idx < currentIdx) {
            return { ...item, status: 'synced' };
          }
          return item;
        })
      );

      currentIdx++;
      if (currentIdx > queueItems.length) {
        clearInterval(interval);
        setQueueItems((prev) => prev.map((item) => ({ ...item, status: 'synced' })));
        setIsSyncing(false);
        showToast('✓ All offline queue mutations securely persisted to Cloud Firestore!');
      }
    }, 450);
  };

  const handleClearSynced = () => {
    setQueueItems((prev) => prev.filter((i) => i.status !== 'synced'));
    showToast('Purged synced audit history from local cache.');
  };

  const handleAddSimulatedPing = () => {
    const newId = `sync-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const sampleItem: OfflineQueueItem = {
      id: newId,
      operation: 'CHECKPOINT_SCAN',
      title: `Checkpoint RFID Scan — CP-0${(queueItems.length % 8) + 1}`,
      summary: 'Buffered locally while field guard in cellular dead-zone (Basement Parking)',
      timestamp: timeStr,
      status: 'pending',
      retryCount: 0,
      sizeBytes: 1450
    };

    setQueueItems((prev) => [sampleItem, ...prev]);
    showToast(`Buffered new transaction #${newId} to offline queue.`);
  };

  const filteredItems = queueItems.filter((i) => {
    if (filter === 'pending') return i.status === 'pending' || i.status === 'syncing';
    if (filter === 'synced') return i.status === 'synced';
    return true;
  });

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0A1E33] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#071726]/60 flex-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1FA6C9]/15 border border-[#1FA6C9]/30 grid place-items-center text-[#3FC9E9]">
              <svg className="w-5 h-5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 17 4 4 4-4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-white">
                  Offline Sync Queue Tracker
                </h2>
                <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full ${
                  simulatedOffline
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : pendingCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {simulatedOffline ? 'OFFLINE SIMULATOR ON' : `${pendingCount} PENDING`}
                </span>
              </div>
              <p className="text-xs text-[#8598A8] mt-0.5">
                IndexedDB &amp; LocalStorage buffer for patrol scans, OB notes &amp; biometric logs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8598A8] hover:text-white grid place-items-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Network & Simulation Control Strip */}
        <div className="p-4 bg-[#071726]/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${simulatedOffline ? 'bg-rose-400' : isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-semibold text-white">
                Network: {simulatedOffline ? 'Disconnected (Local Buffer)' : 'Cloud Firestore Active'}
              </span>
            </div>

            <button
              onClick={() => {
                setSimulatedOffline(!simulatedOffline);
                showToast(simulatedOffline ? 'Restored network connectivity.' : 'Device now simulated in offline dead-zone.');
              }}
              className={`px-2.5 py-1 rounded-lg font-mono-code text-[11px] font-bold border transition-all cursor-pointer ${
                simulatedOffline
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-white/5 text-[#8598A8] border-white/10 hover:text-white'
              }`}
            >
              {simulatedOffline ? '⚡ Go Online' : '📶 Simulate Offline'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddSimulatedPing}
              className="bg-white/5 hover:bg-white/10 text-[#3FC9E9] border border-[#1FA6C9]/30 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              + Queue Test Scan
            </button>

            <button
              onClick={handleSyncAll}
              disabled={isSyncing || pendingCount === 0}
              className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isSyncing
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : pendingCount === 0
                  ? 'bg-white/5 text-[#5f7386] cursor-not-allowed'
                  : 'bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430]'
              }`}
            >
              {isSyncing ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-amber-300 border-t-transparent animate-spin" />
                  <span>Flushing Queue…</span>
                </>
              ) : (
                <>
                  <span>☁️ Flush &amp; Sync ({pendingCount})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-white/5">
          <div className="flex gap-2">
            {[
              { id: 'all', label: `All Events (${queueItems.length})` },
              { id: 'pending', label: `Pending Queue (${pendingCount})` },
              { id: 'synced', label: `Synced Archive (${syncedCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#1FA6C9] text-[#042430]'
                    : 'text-[#8598A8] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {syncedCount > 0 && (
            <button
              onClick={handleClearSynced}
              className="text-[11px] text-[#8598A8] hover:text-rose-300 transition-colors cursor-pointer"
            >
              Clear synced items
            </button>
          )}
        </div>

        {/* Queue Items List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1 max-h-[420px]">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#8598A8]">
              No transactions currently in this queue view.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.status === 'syncing'
                    ? 'bg-[#1FA6C9]/10 border-[#1FA6C9]/40'
                    : item.status === 'synced'
                    ? 'bg-white/[0.02] border-white/5 opacity-75'
                    : 'bg-white/[0.05] border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono-code text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.operation === 'CHECKPOINT_SCAN'
                          ? 'bg-[#1FA6C9]/20 text-[#3FC9E9]'
                          : item.operation === 'BIOMETRIC_CLOCKIN'
                          ? 'bg-purple-500/20 text-purple-300'
                          : item.operation === 'DOC_UPLOAD'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {item.operation}
                      </span>
                      <span className="font-bold text-xs text-white">{item.title}</span>
                    </div>
                    <div className="text-xs text-[#c1d3e2]">{item.summary}</div>
                    <div className="flex items-center gap-3 text-[10px] text-[#8598A8] font-mono-code">
                      <span>Buffered: {item.timestamp}</span>
                      <span>·</span>
                      <span>Payload: {(item.sizeBytes ? (item.sizeBytes / 1024).toFixed(1) : '1.2')} KB</span>
                      {item.retryCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-amber-400">Retries: {item.retryCount}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex-none text-right">
                    {item.status === 'syncing' && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#3FC9E9] font-semibold bg-[#1FA6C9]/15 px-2 py-0.5 rounded-full animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-[#3FC9E9] animate-ping" />
                        Syncing…
                      </span>
                    )}
                    {item.status === 'synced' && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        ✓ Synced
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        ⏳ Buffered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#071726] border-t border-white/10 flex items-center justify-between text-xs text-[#8598A8]">
          <div>
            Auto-sync interval: <span className="text-white font-mono-code">Every 30s when online</span>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            Close Tracker
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
