import React, { useState } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { ClientProofOfService } from '../types/dutyon';
import { RealTimePatrolLogsModal } from './modals/RealTimePatrolLogsModal';

export const DesktopPatrolsManager: React.FC = () => {
  const {
    patrolRoutes,
    activeRouteId,
    setActiveRouteId,
    safetyStatus,
    resetWelfarePing,
    triggerDuressPanic,
    clearDuressPanic,
    triggerManDownSensor,
    clearManDownSensor,
    patrolExceptions,
    sefekoDevices,
    proofOfServiceReports,
    selectedReport,
    setSelectedReport,
    sites,
    officersList,
    addCheckpointToRoute,
    showToast,
    patrolScans,
    deletePatrolScan,
    clearAllPatrolScans,
    clearPatrolException,
    clearAllPatrolExceptions,
    resolvePatrolException,
    isPatrolLogsModalOpen,
    setIsPatrolLogsModalOpen
  } = useDutyOn();

  // Internal tabs
  type PatrolSubTab = 'routes' | 'safety' | 'hardware' | 'sla_reports' | 'logs' | 'exceptions';
  const [subTab, setSubTab] = useState<PatrolSubTab>('routes');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('all');
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState<ClientProofOfService | null>(null);
  const [selectedEvidencePhoto, setSelectedEvidencePhoto] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [inspectedRouteId, setInspectedRouteId] = useState<string | null>(null);
  const [showConfirmClearBreaches, setShowConfirmClearBreaches] = useState(false);
  const [showConfirmClearLogs, setShowConfirmClearLogs] = useState(false);

  // Control Room Add Checkpoint modal state
  const [isAddCheckpointModalOpen, setIsAddCheckpointModalOpen] = useState(false);
  const [targetRouteIdForCheckpoint, setTargetRouteIdForCheckpoint] = useState<string | null>(null);
  const [newCpTitle, setNewCpTitle] = useState('');
  const [newCpTagMethod, setNewCpTagMethod] = useState<'Sefeko RFID' | 'NFC Tag' | 'BLE Beacon' | 'QR Matrix'>('Sefeko RFID');
  const [newCpDwell, setNewCpDwell] = useState(3);
  const [newCpTask, setNewCpTask] = useState('');

  const handleOpenAddCheckpoint = (routeId: string) => {
    setTargetRouteIdForCheckpoint(routeId);
    setNewCpTitle('');
    setNewCpTask('');
    setIsAddCheckpointModalOpen(true);
  };

  const handleSaveRouteCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRouteIdForCheckpoint || !newCpTitle.trim()) {
      showToast('Please enter a checkpoint title');
      return;
    }

    const route = patrolRoutes.find(r => r.id === targetRouteIdForCheckpoint);
    const nextIndex = (route?.checkpoints || []).length + 1;

    addCheckpointToRoute(targetRouteIdForCheckpoint, {
      id: `cp-${Date.now()}-${nextIndex}`,
      code: `CP-${String(nextIndex).padStart(2, '0')}`,
      name: newCpTitle.trim(),
      tagUid: `${newCpTagMethod === 'Sefeko RFID' ? 'SFK' : 'NFC'}-${route?.code || 'RT'}-${String(200 + nextIndex)}`,
      tagType: newCpTagMethod,
      verificationMethod: newCpTagMethod,
      order: nextIndex,
      scanned: false,
      coordinates: '-33.8642, 25.5684',
      dwellRequiredMin: Number(newCpDwell) || 2,
      sopChecklist: newCpTask.trim() ? [
        { id: `sop-${Date.now()}-1`, task: newCpTask.trim(), passed: false, critical: true }
      ] : [
        { id: `sop-${Date.now()}-1`, task: 'Inspect perimeter barrier, locks, and security sensors', passed: false, critical: false }
      ]
    });

    showToast(`✓ Checkpoint "${newCpTitle.trim()}" added to route ${route?.code || ''}`);
    setIsAddCheckpointModalOpen(false);
    setNewCpTitle('');
    setNewCpTask('');
  };

  // Welfare format
  const mins = Math.floor(safetyStatus.welfarePingSecondsLeft / 60);
  const secs = safetyStatus.welfarePingSecondsLeft % 60;
  const welfareFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const filteredRoutes = selectedRouteFilter === 'all'
    ? patrolRoutes
    : patrolRoutes.filter(r => 
        r.siteName.toLowerCase().includes(selectedRouteFilter.toLowerCase()) || 
        selectedRouteFilter.toLowerCase().includes(r.siteName.toLowerCase())
      );

  const handleOpenCertificate = (report: ClientProofOfService) => {
    setActiveCertificate(report);
    setIsCertificateModalOpen(true);
  };

  return (
    <div className="space-y-5 text-white animate-fade-in">
      {/* ---------------- 1. TOP METRIC STRIP ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Routes */}
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8598A8]">
            <span>Active Patrol Tours</span>
            <span className="font-mono-code text-[11px] text-[#5BCB80]">Live GPS</span>
          </div>
          <div className="font-display font-extrabold text-2xl text-white mt-1">
            {patrolRoutes.filter(r => r.status === 'In Progress').length}{' '}
            <span className="text-sm font-normal text-[#8598A8]">/ {patrolRoutes.length} sites</span>
          </div>
          <div className="text-[11px] text-[#5BCB80] mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5BCB80] animate-pulse" />
            98.6% Target SLA Compliance
          </div>
        </div>

        {/* Lone Worker Welfare Status */}
        <div className={`border rounded-2xl p-4 shadow-sm transition-all ${
          safetyStatus.duressTriggered || safetyStatus.manDownTriggered
            ? 'bg-rose-950/80 border-rose-500 animate-pulse'
            : 'bg-[#0A1E33] border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs text-[#8598A8]">
            <span>Lone Worker Life Safety</span>
            <span className="font-mono-code text-[11px] text-[#3FC9E9]">
              {safetyStatus.duressTriggered ? 'DURESS' : safetyStatus.manDownTriggered ? 'MAN-DOWN' : 'HEARTBEAT'}
            </span>
          </div>
          <div className="font-display font-extrabold text-2xl mt-1 flex items-center gap-2">
            {safetyStatus.duressTriggered ? (
              <span className="text-rose-400">EMERGENCY DURESS</span>
            ) : safetyStatus.manDownTriggered ? (
              <span className="text-amber-400">MAN-DOWN DETECTED</span>
            ) : (
              <span className="text-white">Active ({welfareFormatted})</span>
            )}
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 flex items-center justify-between">
            <span>Guards Monitored: 12</span>
            {safetyStatus.duressTriggered ? (
              <button
                onClick={clearDuressPanic}
                className="text-[10px] font-bold text-rose-300 underline cursor-pointer"
              >
                Clear Alarm
              </button>
            ) : safetyStatus.manDownTriggered ? (
              <button
                onClick={clearManDownSensor}
                className="text-[10px] font-bold text-amber-300 underline cursor-pointer"
              >
                Clear Sensor
              </button>
            ) : (
              <button
                onClick={() => {
                  resetWelfarePing();
                  showToast('Sent welfare check-in ping to all solitary officers');
                }}
                className="text-[10px] font-bold text-[#3FC9E9] hover:underline cursor-pointer"
              >
                Ping Guards
              </button>
            )}
          </div>
        </div>

        {/* Sefeko Fleet Hardware */}
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8598A8]">
            <span>Sefeko Wand Fleet</span>
            <span className="font-mono-code text-[11px] text-[#1FA6C9]">GSM/RFID</span>
          </div>
          <div className="font-display font-extrabold text-2xl text-white mt-1">
            {sefekoDevices.filter(d => d.status === 'Online').length}{' '}
            <span className="text-sm font-normal text-[#8598A8]">/ {sefekoDevices.length} Wands</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1">Avg Battery: 89% · 0 offline buffer</div>
        </div>

        {/* Patrol Exceptions / Threat Breaches */}
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8598A8]">
            <span>Security Exceptions</span>
            <span className="font-mono-code text-[11px] text-[#E0574B]">Dispatched</span>
          </div>
          <div className="font-display font-extrabold text-2xl text-[#E0574B] mt-1">
            {patrolExceptions.length}
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1">Padlock &amp; fence breaches under response</div>
        </div>
      </div>

      {/* ---------------- 2. ENTERPRISE SUB-NAVIGATION BAR ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5 bg-[#071726] p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0">
          <button
            onClick={() => setSubTab('routes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'routes'
                ? 'bg-[#1FA6C9] text-[#042430] shadow-sm font-bold'
                : 'text-[#8598A8] hover:text-white'
            }`}
          >
            Live Routes ({patrolRoutes.length})
          </button>

          <button
            onClick={() => setSubTab('safety')}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer relative whitespace-nowrap ${
              subTab === 'safety'
                ? 'bg-[#1FA6C9] text-[#042430] shadow-sm font-bold'
                : 'text-[#8598A8] hover:text-white'
            }`}
          >
            Lone Worker &amp; Life Safety
            {(safetyStatus.duressTriggered || safetyStatus.manDownTriggered) && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold">
                ALERT
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('hardware')}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'hardware'
                ? 'bg-[#1FA6C9] text-[#042430] shadow-sm font-bold'
                : 'text-[#8598A8] hover:text-white'
            }`}
          >
            Sefeko Wand Fleet ({sefekoDevices.length})
          </button>

          <button
            onClick={() => setSubTab('sla_reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'sla_reports'
                ? 'bg-[#1FA6C9] text-[#042430] shadow-sm font-bold'
                : 'text-[#8598A8] hover:text-white'
            }`}
          >
            Proof of Service SLA ({proofOfServiceReports.length})
          </button>

          <button
            onClick={() => setSubTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'logs'
                ? 'bg-[#1FA6C9] text-[#042430] shadow-sm font-bold'
                : 'text-[#8598A8] hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Patrol Logs ({patrolScans.length})</span>
          </button>

          <button
            onClick={() => setSubTab('exceptions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'exceptions'
                ? 'bg-[#1FA6C9] text-[#042430] shadow-sm font-bold'
                : 'text-[#8598A8] hover:text-white'
            }`}
          >
            Exceptions &amp; Breaches ({patrolExceptions.length})
          </button>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPatrolLogsModalOpen(true)}
            className="bg-cyan-500/15 hover:bg-cyan-500/25 text-[#3FC9E9] border border-cyan-500/30 text-xs font-display font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Open dedicated real-time patrol scans inspector modal"
          >
            <span>📋</span>
            <span>Open Patrol Logs Modal</span>
          </button>

          <button
            onClick={() => {
              showToast('Broadcasting radio patrol check to all on-duty officers…');
            }}
            className="bg-white/10 hover:bg-white/15 text-white text-xs font-display font-semibold px-3 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-[#3FC9E9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8" />
            </svg>
            <span>Broadcast Radio Check</span>
          </button>
        </div>
      </div>

      {/* ---------------- 3. SUBTAB: LIVE ROUTES & CHECKPOINTS ---------------- */}
      {subTab === 'routes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-white">
                Multi-Location Enterprise Route Matrix
              </h3>
              <p className="text-xs text-[#8598A8]">
                Real-time RFID checkpoint scans, geofence status, and compliance tracking
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8598A8]">Filter Site:</span>
              <select
                value={selectedRouteFilter}
                onChange={(e) => setSelectedRouteFilter(e.target.value)}
                className="bg-[#071726] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer max-w-xs"
              >
                <option value="all">All Available Sites ({sites.length} Operational)</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.name}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutes.map((route) => {
              const scannedCount = route.checkpoints.filter((c) => c.scanned).length;
              const totalCount = route.checkpoints.length;
              const percent = Math.round((scannedCount / totalCount) * 100);
              const isCurrentActive = route.id === activeRouteId;

              return (
                <div
                  key={route.id}
                  className={`bg-[#0A1E33] border rounded-2xl p-4 space-y-3 transition-all ${
                    isCurrentActive ? 'border-[#1FA6C9] ring-1 ring-[#1FA6C9]/40' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono-code text-[10px] font-bold bg-[#1FA6C9]/20 text-[#3FC9E9] px-2 py-0.5 rounded">
                          {route.code}
                        </span>
                        <span className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded font-bold ${
                          route.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                          route.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {route.priority}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-sm text-white mt-1">
                        {route.title}
                      </h4>
                      <p className="text-[11px] text-[#8598A8]">{route.siteName}</p>
                    </div>

                    <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      route.status === 'In Progress' ? 'bg-[#5BCB80]/20 text-[#5BCB80]' :
                      route.status === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-white/10 text-[#8598A8]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${route.status === 'In Progress' ? 'bg-[#5BCB80] animate-ping' : 'bg-current'}`} />
                      {route.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8598A8]">Tour Progress</span>
                      <span className="font-mono-code font-bold text-white">
                        {scannedCount} of {totalCount} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent === 100 ? 'bg-[#5BCB80]' : 'bg-[#1FA6C9]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Officer & Wand Details */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[#8598A8] block">Assigned Guard:</span>
                      <span className="font-semibold text-white">{route.officerName}</span>
                    </div>
                    <div>
                      <span className="text-[#8598A8] block">Hardware Wand:</span>
                      <span className="font-mono-code text-[#3FC9E9]">{route.wandId}</span>
                    </div>
                    <div>
                      <span className="text-[#8598A8] block">Frequency / SLA:</span>
                      <span className="text-white">{route.frequency}</span>
                    </div>
                    <div>
                      <span className="text-[#8598A8] block">Dwell Required:</span>
                      <span className="text-white">{route.dwellTimeMin} mins</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveRouteId(route.id);
                          showToast(`Switched active patrol route to ${route.code}`);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
                          isCurrentActive
                            ? 'bg-[#1FA6C9] text-[#042430]'
                            : 'bg-white/10 hover:bg-white/15 text-white'
                        }`}
                      >
                        {isCurrentActive ? 'Active Route Selected' : 'Set as Focus Route'}
                      </button>

                      <button
                        onClick={() => {
                          showToast(`Pinging ${route.officerName} at ${route.siteName}…`);
                        }}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-[#8598A8] hover:text-white transition-all cursor-pointer"
                        title="Ping Officer"
                      >
                        Ping Guard
                      </button>
                    </div>

                    {/* Toggle Checkpoints and Media Evidence Inspector */}
                    <button
                      onClick={() => setInspectedRouteId(inspectedRouteId === route.id ? null : route.id)}
                      className="w-full py-1.5 px-2.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-[#3FC9E9] border border-white/10 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>🔍</span>
                        <span>Checkpoints &amp; Guard Evidence ({route.checkpoints.length})</span>
                      </span>
                      <span>{inspectedRouteId === route.id ? '▲ Hide' : '▼ View'}</span>
                    </button>

                    {/* Expandable Checkpoints Evidence Drawer */}
                    {inspectedRouteId === route.id && (
                      <div className="bg-[#05111c] border border-white/10 rounded-xl p-3 space-y-2 mt-1 max-h-72 overflow-y-auto">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-mono-code text-[#8598A8] uppercase tracking-wider font-semibold">
                            Checkpoint Verification &amp; Field Media:
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenAddCheckpoint(route.id)}
                            className="px-2 py-0.5 bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/35 text-[#3FC9E9] border border-[#1FA6C9]/40 rounded text-[10px] font-mono-code font-bold cursor-pointer transition-all flex items-center gap-1"
                            title="Add specific inspection area or RFID checkpoint from Control Room"
                          >
                            <span>+</span>
                            <span>Add Point</span>
                          </button>
                        </div>
                        <div className="space-y-2">
                          {route.checkpoints.map((cp) => (
                            <div
                              key={cp.id}
                              className={`p-2.5 rounded-lg border text-xs ${
                                cp.scanned
                                  ? 'bg-[#5BCB80]/5 border-[#5BCB80]/30 text-white'
                                  : 'bg-white/[0.02] border-white/5 text-[#8598A8]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  <span>{cp.scanned ? '✓' : '○'}</span>
                                  <span>{cp.name}</span>
                                </div>
                                <span className="font-mono-code text-[10px] text-[#3FC9E9]">
                                  {cp.scanned ? `${cp.scanTime || 'Verified'}` : 'Pending'}
                                </span>
                              </div>

                              {cp.tagUid && (
                                <div className="text-[10px] font-mono-code text-[#8598A8] mt-0.5">
                                  UID: {cp.tagUid} {cp.verificationMethod ? `· ${cp.verificationMethod}` : ''}
                                </div>
                              )}

                              {cp.notes && (
                                <div className="text-[11px] text-slate-300 italic mt-1 bg-black/40 px-2 py-1 rounded">
                                  "{cp.notes}"
                                </div>
                              )}

                              {/* Photo Evidence */}
                              {cp.photoUrl && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center justify-between text-[10px] text-[#5BCB80] font-mono-code">
                                    <span>📷 INSPECTION PHOTO EVIDENCE</span>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedEvidencePhoto({
                                        url: cp.photoUrl!,
                                        title: cp.name,
                                        subtitle: `Scanned: ${cp.scanTime || 'Recent'} | Route: ${route.title}`
                                      })}
                                      className="underline hover:text-white cursor-pointer"
                                    >
                                      Zoom ↗
                                    </button>
                                  </div>
                                  <img
                                    src={cp.photoUrl}
                                    alt={cp.name}
                                    onClick={() => setSelectedEvidencePhoto({
                                      url: cp.photoUrl!,
                                      title: cp.name,
                                      subtitle: `Scanned: ${cp.scanTime || 'Recent'} | Route: ${route.title}`
                                    })}
                                    className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-90 border border-white/10"
                                  />
                                </div>
                              )}

                              {/* Voice Note Evidence */}
                              {cp.voiceNoteUrl && (
                                <div className="mt-2 space-y-1">
                                  <div className="text-[10px] text-[#3FC9E9] font-mono-code flex items-center gap-1">
                                    <span>🎙️ GUARD VOICE MEMO</span>
                                    {cp.audioDurationSec ? <span>({cp.audioDurationSec}s)</span> : null}
                                  </div>
                                  <audio controls src={cp.voiceNoteUrl} className="w-full h-8" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- 4. SUBTAB: LONE WORKER & LIFE SAFETY ---------------- */}
      {subTab === 'safety' && (
        <div className="space-y-4">
          <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5BCB80] animate-ping" />
                  Solitary Officer Telemetry &amp; Life Safety Center
                </h3>
                <p className="text-xs text-[#8598A8]">
                  Automated countdown welfare heartbeats, zero-motion man-down sensors, and silent duress triggers
                </p>
              </div>

              {/* Simulation Controls for Groundbreaking Demonstration */}
              <div className="flex items-center gap-2 bg-[#071726] p-1.5 rounded-xl border border-white/10 text-xs">
                <span className="text-[#8598A8] text-[11px] px-1 font-semibold">Test Sensors:</span>
                <button
                  onClick={safetyStatus.manDownTriggered ? clearManDownSensor : triggerManDownSensor}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${
                    safetyStatus.manDownTriggered ? 'bg-amber-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {safetyStatus.manDownTriggered ? 'Man-Down Alerting!' : 'Trigger Man-Down'}
                </button>

                <button
                  onClick={safetyStatus.duressTriggered ? clearDuressPanic : triggerDuressPanic}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${
                    safetyStatus.duressTriggered ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {safetyStatus.duressTriggered ? 'Duress Alerting!' : 'Trigger Silent Duress'}
                </button>
              </div>
            </div>

            {/* Active Alarm Banner */}
            {(safetyStatus.duressTriggered || safetyStatus.manDownTriggered) && (
              <div className="bg-rose-950/90 border border-rose-500 rounded-2xl p-4 flex items-center justify-between animate-pulse text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-600 grid place-items-center text-white flex-none">
                    <svg className="w-6 h-6 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-rose-200">
                      CRITICAL OFFICER DISTRESS CODE: {safetyStatus.duressTriggered ? 'SILENT DURESS / ATTACK' : 'PROLONGED IMMOBILITY / MAN-DOWN'}
                    </div>
                    <div className="text-xs text-rose-300 font-mono-code mt-0.5">
                      Officer: {officersList.find(o => o.status === 'on-duty')?.name || 'Matyolo Nomahlubi'} (PSIRA #{officersList.find(o => o.status === 'on-duty')?.psiraNumber || '2753127'}) · {officersList.find(o => o.status === 'on-duty')?.currentSite || 'Zebra Mountains'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      showToast('Armed Response Unit Alpha-1 dispatched with priority sirens');
                    }}
                    className="bg-white text-rose-900 font-display font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-rose-100 cursor-pointer shadow-md"
                  >
                    Dispatch Armed Backup
                  </button>
                  <button
                    onClick={safetyStatus.duressTriggered ? clearDuressPanic : clearManDownSensor}
                    className="bg-rose-800 text-white text-xs px-3 py-2 rounded-xl hover:bg-rose-700 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Lone Worker Live Telemetry Roster */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#071726]/80 text-[#8598A8] font-mono-code text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Officer / Guard</th>
                    <th className="py-3 px-4">Site Location</th>
                    <th className="py-3 px-4">Welfare Timer</th>
                    <th className="py-3 px-4">Device Telemetry</th>
                    <th className="py-3 px-4">Motion Status</th>
                    <th className="py-3 px-4 text-right">Emergency Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {officersList.slice(0, 8).map((officer, idx) => {
                    const isFirst = idx === 0;
                    const isAlert = isFirst && (safetyStatus.duressTriggered || safetyStatus.manDownTriggered);
                    return (
                      <tr key={officer.id} className={`hover:bg-white/[0.02] ${isAlert ? 'bg-rose-950/30' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{officer.name}</div>
                          <div className="text-[10px] font-mono-code text-[#3FC9E9]">PSIRA #{officer.psiraNumber} · {officer.grade}</div>
                        </td>
                        <td className="py-3 px-4 text-[#C2D1DE]">{officer.currentSite}</td>
                        <td className="py-3 px-4 font-mono-code">
                          <span className={isAlert ? 'text-rose-400 font-bold animate-pulse' : 'text-[#5BCB80]'}>
                            {isFirst ? welfareFormatted : `${String(12 - (idx % 5)).padStart(2, '0')}:${String((idx * 17) % 60).padStart(2, '0')}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#8598A8] font-mono-code text-[11px]">
                          <div>Bat: {isFirst ? `${safetyStatus.batteryLevel}%` : `${88 - idx * 4}%`}</div>
                          <div className="text-[10px] text-[#55697d]">{isFirst ? '-68 dBm (Strong)' : '-74 dBm (Stable)'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isAlert
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                              : officer.status === 'on-duty'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {isAlert
                              ? (safetyStatus.duressTriggered ? 'ATTACK PANIC' : 'IMMOBILE')
                              : officer.status === 'on-duty' ? 'Active Patrol (1.1 m/s)' : 'Standby / Relieved'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              showToast(`Welfare check ping dispatched to ${officer.name}`);
                            }}
                            className="text-[#3FC9E9] hover:text-white text-xs underline cursor-pointer"
                          >
                            Ping Guard
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 5. SUBTAB: SEFEKO HARDWARE FLEET ---------------- */}
      {subTab === 'hardware' && (
        <div className="space-y-4">
          <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Sefeko Wand &amp; RFID Hardware Inventory
                </h3>
                <p className="text-xs text-[#8598A8]">
                  Industrial IP67 patrol baton telematics, SIM cards, battery health, and offline buffer sync
                </p>
              </div>
              <button
                onClick={() => showToast('Syncing all wand diagnostic logs with Sefeko Cloud API…')}
                className="bg-[#1FA6C9] text-[#042430] font-display font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-[#1da0c2] transition-all cursor-pointer"
              >
                Poll Sefeko Cloud API
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sefekoDevices.map((device) => (
                <div key={device.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code font-bold text-xs text-white">
                      {device.serialNumber}
                    </span>
                    <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#5BCB80]/20 text-[#5BCB80] font-bold">
                      ● {device.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#9db0c0]">
                    <div>Assigned: <span className="text-white font-semibold">{device.assignedOfficer}</span></div>
                    <div className="text-[11px] text-[#8598A8]">{device.siteName}</div>
                  </div>

                  <div className="space-y-1 pt-1 text-[11px] font-mono-code">
                    <div className="flex justify-between text-[#8598A8]">
                      <span>Battery:</span>
                      <span className="text-white font-bold">{device.batteryPct}%</span>
                    </div>
                    <div className="flex justify-between text-[#8598A8]">
                      <span>Signal:</span>
                      <span className="text-[#3FC9E9]">{device.gsmSignalDbm} dBm</span>
                    </div>
                    <div className="flex justify-between text-[#8598A8]">
                      <span>Firmware:</span>
                      <span className="text-white">{device.firmware}</span>
                    </div>
                    <div className="flex justify-between text-[#8598A8]">
                      <span>Offline Buffer:</span>
                      <span className="text-[#5BCB80]">{device.queuedScans} queued</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 text-[10px] text-[#8598A8] flex justify-between">
                    <span>Sync: {device.lastSyncTime}</span>
                    <button
                      onClick={() => showToast(`Sent diagnostic ping to Sefeko Wand ${device.serialNumber}`)}
                      className="text-[#1FA6C9] hover:underline cursor-pointer"
                    >
                      Diagnostic Test ›
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 6. SUBTAB: PROOF OF SERVICE SLA & REPORTS ---------------- */}
      {subTab === 'sla_reports' && (
        <div className="space-y-4">
          <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Client Proof of Service &amp; SLA Certification
                </h3>
                <p className="text-xs text-[#8598A8]">
                  Single source of truth for commercial clients: GPS verified patrols, dwell time audits, and PSIRA certificates
                </p>
              </div>

              <button
                onClick={() => showToast('Generated monthly consolidated client SLA package')}
                className="bg-[#1FA6C9] text-[#042430] font-display font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-[#1da0c2] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export SLA Package</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#071726]/80 text-[#8598A8] font-mono-code text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Client / Site</th>
                    <th className="py-3 px-4">Reporting Period</th>
                    <th className="py-3 px-4">Completed Loops</th>
                    <th className="py-3 px-4">SLA Compliance</th>
                    <th className="py-3 px-4">Exceptions Logged</th>
                    <th className="py-3 px-4">Audit Signature</th>
                    <th className="py-3 px-4 text-right">View Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {proofOfServiceReports.map((report) => (
                    <tr key={report.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{report.clientName}</div>
                        <div className="text-[11px] text-[#3FC9E9]">{report.siteName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono-code text-[#9db0c0]">
                        {report.reportingPeriod}
                      </td>
                      <td className="py-3 px-4 font-mono-code text-white">
                        {report.completedPatrols} of {report.scheduledPatrols} ({Math.round((report.completedPatrols/report.scheduledPatrols)*100)}%)
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono-code text-xs font-bold ${
                          report.slaScore >= 98 ? 'bg-[#5BCB80]/20 text-[#5BCB80]' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {report.slaScore}% SLA
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono-code text-[#E0574B]">
                        {report.exceptionsLogged} breach(es)
                      </td>
                      <td className="py-3 px-4 text-[10.5px] font-mono-code text-[#8598A8]">
                        {report.officerSignature}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenCertificate(report)}
                          className="bg-white/10 hover:bg-[#1FA6C9] hover:text-[#042430] text-white font-display font-bold text-xs px-3 py-1 rounded-lg transition-all cursor-pointer"
                        >
                          View Certificate ›
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 7. SUBTAB: REAL-TIME PATROL LOGS ---------------- */}
      {subTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  Real-time Patrol Scans &amp; Wand Checkpoint Log
                </h3>
                <p className="text-xs text-[#8598A8]">
                  Live streaming NFC/RFID taps, GPS geofence verifications, and guard inspection audit records
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPatrolLogsModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] border border-[#1FA6C9]/40 text-xs font-bold cursor-pointer transition-all"
                >
                  Full Modal View ↗
                </button>
                {showConfirmClearLogs ? (
                  <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/40 px-2.5 py-1 rounded-xl">
                    <span className="text-[11px] text-rose-200">Confirm clear all logs?</span>
                    <button
                      onClick={async () => {
                        await clearAllPatrolScans();
                        setShowConfirmClearLogs(false);
                      }}
                      className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                    >
                      Yes, Clear
                    </button>
                    <button
                      onClick={() => setShowConfirmClearLogs(false)}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmClearLogs(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-all"
                  >
                    Clear Logs
                  </button>
                )}
              </div>
            </div>

            {/* List of Patrol Scans */}
            {patrolScans.length === 0 ? (
              <div className="text-center py-12 space-y-3 text-[#8598A8]">
                <div className="text-4xl">📡</div>
                <h4 className="text-white font-bold text-sm">No Live Patrol Scans Logged Yet</h4>
                <p className="text-xs max-w-sm mx-auto">
                  Live checkpoint scans from Sefeko wands and mobile guard patrols will populate here automatically in real time.
                </p>
                <button
                  onClick={() => setIsPatrolLogsModalOpen(true)}
                  className="px-4 py-2 bg-[#1FA6C9] hover:bg-[#1FA6C9]/90 text-[#042430] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Open Patrol Logs Matrix
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {patrolScans.map((scan) => (
                  <div key={scan.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code text-[10px] font-bold px-2 py-0.5 rounded bg-[#1FA6C9]/20 text-[#3FC9E9]">
                          {scan.tagType || 'Sefeko RFID'}
                        </span>
                        <strong className="text-white text-sm">{scan.checkpointName}</strong>
                        <span className="text-[#8598A8] font-mono-code text-[11px]">{scan.scannedAt} CAT</span>
                      </div>
                      <div className="text-[#8598A8] text-[11px] flex items-center gap-3">
                        <span>Officer: <strong className="text-white">{scan.scannedBy}</strong></span>
                        <span>·</span>
                        <span>UID: <strong className="text-slate-300 font-mono-code">{scan.tagUid || 'RFID-TAG'}</strong></span>
                        <span>·</span>
                        <span className="text-emerald-400">Dwell: {scan.dwellTimeSec || 45}s</span>
                      </div>
                      {scan.inspectionNotes && (
                        <p className="text-slate-300 italic text-[11px]">
                          "{scan.inspectionNotes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {scan.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedEvidencePhoto({ url: scan.photoUrl!, title: scan.checkpointName })}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[#3FC9E9] text-[11px] font-semibold cursor-pointer"
                        >
                          📷 Photo
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deletePatrolScan(scan.id)}
                        className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-[11px] font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- 8. SUBTAB: EXCEPTIONS & BREACHES ---------------- */}
      {subTab === 'exceptions' && (
        <div className="space-y-4">
          <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E0574B] animate-ping" />
                  Real-time Patrol Threat &amp; Exception Register
                </h3>
                <p className="text-xs text-[#8598A8]">
                  Immediate dispatch log for damaged locks, severed fences, and intruder activity
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono-code text-[#E0574B] bg-[#E0574B]/10 px-3 py-1 rounded-full font-bold">
                  {patrolExceptions.length} Active Records
                </span>

                {patrolExceptions.length > 0 && (
                  showConfirmClearBreaches ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/40 px-2.5 py-1 rounded-xl">
                      <span className="text-[11px] text-rose-200">Confirm clear all breaches?</span>
                      <button
                        onClick={async () => {
                          await clearAllPatrolExceptions();
                          setShowConfirmClearBreaches(false);
                        }}
                        className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                      >
                        Yes, Clear
                      </button>
                      <button
                        onClick={() => setShowConfirmClearBreaches(false)}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirmClearBreaches(true)}
                      className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                    >
                      Clear All Breaches
                    </button>
                  )
                )}
              </div>
            </div>

            {patrolExceptions.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-[#8598A8]">
                <div className="text-3xl">🛡️</div>
                <h4 className="text-white font-bold text-sm">All Perimeter Exceptions Cleared</h4>
                <p className="text-xs">No active breaches or damage exceptions logged across protected sites.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patrolExceptions.map((exc) => {
                  const isResolved = exc.status === 'RESOLVED';

                  return (
                    <div key={exc.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded ${
                              exc.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                            }`}>
                              {exc.severity} SEVERITY
                            </span>
                            {isResolved ? (
                              <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                ✓ RESOLVED
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                ACTIVE BREACH
                              </span>
                            )}
                          </div>
                          <h4 className="font-display font-bold text-sm text-white mt-1">
                            {exc.category}
                          </h4>
                          <p className="text-xs text-[#3FC9E9]">{exc.siteName} · {exc.checkpointName}</p>
                        </div>

                        <span className="text-[11px] font-mono-code text-[#8598A8] shrink-0">
                          {exc.timestamp} CAT
                        </span>
                      </div>

                      <p className="text-xs text-[#cbd5e1] bg-black/30 p-2.5 rounded-lg border border-white/5">
                        "{exc.description}"
                      </p>

                      {/* Photo Evidence Preview */}
                      {exc.photoUrl && (
                        <div className="space-y-1.5 bg-[#05111c] border border-white/10 rounded-lg p-2.5">
                          <div className="flex items-center justify-between text-[10px] text-[#5BCB80] font-mono-code">
                            <span className="flex items-center gap-1">
                              <span>📷</span>
                              <span>GUARD PHOTO EVIDENCE</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedEvidencePhoto({
                                url: exc.photoUrl!,
                                title: `Exception: ${exc.category}`,
                                subtitle: `${exc.siteName} · ${exc.checkpointName} (${exc.timestamp})`
                              })}
                              className="text-[#3FC9E9] hover:underline cursor-pointer"
                            >
                              Enlarge Photo ↗
                            </button>
                          </div>
                          <img
                            src={exc.photoUrl}
                            alt="Exception Evidence"
                            onClick={() => setSelectedEvidencePhoto({
                              url: exc.photoUrl!,
                              title: `Exception: ${exc.category}`,
                              subtitle: `${exc.siteName} · ${exc.checkpointName} (${exc.timestamp})`
                            })}
                            className="w-full h-36 object-cover rounded border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </div>
                      )}

                      {/* Voice Note Audio Player */}
                      {exc.voiceNoteUrl && (
                        <div className="space-y-1.5 bg-[#05111c] border border-white/10 rounded-lg p-2.5">
                          <div className="flex items-center justify-between text-[10px] text-[#3FC9E9] font-mono-code">
                            <span className="flex items-center gap-1">
                              <span>🎙️</span>
                              <span>RECORDED VOICE MEMO</span>
                            </span>
                            {exc.audioDurationSec ? (
                              <span className="text-[#8598A8]">{exc.audioDurationSec}s Duration</span>
                            ) : null}
                          </div>
                          <audio controls src={exc.voiceNoteUrl} className="w-full h-8" />
                        </div>
                      )}

                      <div className="text-[11px] space-y-1 pt-1">
                        <div className="text-[#8598A8]">
                          Reporting Officer: <span className="text-white font-semibold">{exc.officerName}</span>
                        </div>
                        <div className="text-[#8598A8]">
                          Dispatch Status:{' '}
                          <span className={`font-semibold ${isResolved ? 'text-[#5BCB80]' : 'text-amber-400'}`}>
                            {exc.status}
                          </span>
                        </div>
                        {exc.actionTaken && (
                          <div className="text-[10.5px] text-[#3FC9E9]">
                            Action: {exc.actionTaken}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => showToast(`Armed response dispatched to ${exc.checkpointName}`)}
                          className="flex-1 py-1.5 rounded-lg bg-[#E0574B] hover:bg-rose-600 text-white font-display font-bold text-xs transition-all cursor-pointer"
                        >
                          Dispatch Armed Unit
                        </button>

                        {!isResolved && (
                          <button
                            onClick={() => resolvePatrolException(exc.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-semibold text-xs transition-all cursor-pointer"
                          >
                            Resolve ✓
                          </button>
                        )}

                        <button
                          onClick={() => clearPatrolException(exc.id)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-rose-600 text-white font-semibold text-xs transition-all cursor-pointer"
                          title="Clear this exception from the register"
                        >
                          Clear 🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- 8. PROOF OF SERVICE CERTIFICATE MODAL ---------------- */}
      {isCertificateModalOpen && activeCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050f18]/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0A1E33] border border-white/20 rounded-3xl w-full max-w-2xl p-6 text-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1FA6C9]/20 grid place-items-center text-[#3FC9E9]">
                  <svg className="w-5 h-5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg text-white">
                    Client Proof of Service Certificate
                  </h3>
                  <p className="text-xs text-[#8598A8]">Tamper-Proof Sefeko &amp; PSIRA Verified Audit</p>
                </div>
              </div>

              <button
                onClick={() => setIsCertificateModalOpen(false)}
                className="text-[#8598A8] hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Certificate Body (Clean Paper Design with Digital Seal) */}
            <div className="bg-white text-[#0B1E30] rounded-2xl p-6 shadow-inner space-y-4 border border-[#cfdce7]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
                <div>
                  <div className="font-display font-black text-xl tracking-tight text-[#0B1E30]">
                    TIKEDI HOLDINGS (PTY) LTD
                  </div>
                  <div className="text-xs font-mono-code text-[#475569]">
                    PSIRA REG: 2849102 / SIRA GRADE A CORPORATE GUARDING
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono-code text-[11px] font-bold bg-[#eaf6ee] text-[#1b5e20] px-3 py-1 rounded-full border border-[#a3d9b2]">
                    VERIFIED COMPLIANT
                  </span>
                  <div className="text-[10px] text-[#64748b] mt-1 font-mono-code">
                    DOC REF: POS-2026-EC-{activeCertificate.id.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Client & Audit Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#64748b] block text-[11px]">Client Organization:</span>
                  <span className="font-bold text-sm text-[#0B1E30]">{activeCertificate.clientName}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px]">Commercial Site / Facility:</span>
                  <span className="font-bold text-sm text-[#0B1E30]">{activeCertificate.siteName}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px]">Audit Billing Cycle:</span>
                  <span className="font-mono-code text-[#0B1E30] font-semibold">{activeCertificate.reportingPeriod}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px]">Verified SLA Score:</span>
                  <span className="font-display font-extrabold text-base text-[#1b5e20]">
                    {activeCertificate.slaScore}% Achieved
                  </span>
                </div>
              </div>

              {/* Statistical Breakdown */}
              <div className="bg-[#f8fafc] rounded-xl p-3 border border-[#e2e8f0] grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="font-bold text-sm text-[#0B1E30]">{activeCertificate.completedPatrols}</div>
                  <div className="text-[10px] text-[#64748b]">Loops Conducted</div>
                </div>
                <div>
                  <div className="font-bold text-sm text-[#0B1E30]">{activeCertificate.scheduledPatrols}</div>
                  <div className="text-[10px] text-[#64748b]">Scheduled SLA</div>
                </div>
                <div>
                  <div className="font-bold text-sm text-[#b91c1c]">{activeCertificate.exceptionsLogged}</div>
                  <div className="text-[10px] text-[#64748b]">Exceptions Handled</div>
                </div>
              </div>

              {/* Digital Attestation Signature */}
              <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f0] text-xs">
                <div>
                  <div className="text-[10px] text-[#64748b]">Cryptographic Hash Attestation:</div>
                  <div className="font-mono-code text-[10px] text-[#334155] break-all">
                    SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-serif italic font-bold text-sm text-[#0B1E30]">
                    {activeCertificate.officerSignature}
                  </div>
                  <div className="text-[10px] text-[#64748b]">Control Room Operations Commander</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  showToast(`Proof of Service PDF downloaded for ${activeCertificate.clientName}`);
                  setIsCertificateModalOpen(false);
                }}
                className="bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-display font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Certified PDF</span>
              </button>
              <button
                onClick={() => setIsCertificateModalOpen(false)}
                className="bg-white/10 hover:bg-white/15 text-white font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 9. HIGH-RESOLUTION EVIDENCE PHOTO PREVIEW MODAL ---------------- */}
      {selectedEvidencePhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A1E33] border border-white/20 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <span>📷</span>
                  <span>{selectedEvidencePhoto.title}</span>
                </h3>
                {selectedEvidencePhoto.subtitle && (
                  <p className="text-xs text-[#8598A8] font-mono-code mt-0.5">
                    {selectedEvidencePhoto.subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedEvidencePhoto(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-black rounded-xl overflow-hidden max-h-[65vh] flex items-center justify-center border border-white/10">
              <img
                src={selectedEvidencePhoto.url}
                alt="Patrol Evidence"
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono-code text-[#5BCB80]">
                ✓ Tamper-Evident Guard Upload Verified
              </span>
              <button
                onClick={() => setSelectedEvidencePhoto(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 10. CONTROL ROOM ADD CHECKPOINT MODAL ---------------- */}
      {isAddCheckpointModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsAddCheckpointModalOpen(false)}
        >
          <div
            className="bg-[#0A1E33] border border-white/20 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#1FA6C9]/20 text-[#3FC9E9] grid place-items-center font-bold text-sm">
                  📍
                </span>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">
                    Add Route Checkpoint
                  </h3>
                  <p className="text-[11px] text-[#8598A8]">
                    Route: {patrolRoutes.find(r => r.id === targetRouteIdForCheckpoint)?.title || 'Selected Route'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCheckpointModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRouteCheckpoint} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Checkpoint / Area Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCpTitle}
                  onChange={(e) => setNewCpTitle(e.target.value)}
                  placeholder="e.g. Server Room Vault, or West Fuel Depot"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                    Tag / Scan Tech
                  </label>
                  <select
                    value={newCpTagMethod}
                    onChange={(e) => setNewCpTagMethod(e.target.value as any)}
                    className="w-full bg-[#071726] border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                  >
                    <option value="Sefeko RFID">Sefeko Wand RFID</option>
                    <option value="NFC Tag">NFC Contact Tag</option>
                    <option value="QR Matrix">QR Code Matrix</option>
                    <option value="BLE Beacon">BLE Proximity</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                    Required Dwell (Mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newCpDwell}
                    onChange={(e) => setNewCpDwell(Number(e.target.value))}
                    className="w-full bg-[#071726] border border-white/10 rounded-xl p-2 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Mandatory SOP Checklist Inspection
                </label>
                <input
                  type="text"
                  value={newCpTask}
                  onChange={(e) => setNewCpTask(e.target.value)}
                  placeholder="e.g. Verify tamper seal and inspect security padlock"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1FA6C9] hover:bg-[#1994b4] text-[#042430] font-display font-bold rounded-xl cursor-pointer transition-all shadow-md"
                >
                  Save Checkpoint to Route
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCheckpointModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-Time Patrol & Checkpoint Logs Modal */}
      <RealTimePatrolLogsModal />
    </div>
  );
};
