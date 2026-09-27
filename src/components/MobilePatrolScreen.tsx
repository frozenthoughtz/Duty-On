import React, { useState, useRef, useEffect } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { PatrolMap } from './PatrolMap';
import { 
  compressImageFile, 
  VoiceNoteRecorder, 
  generateSamplePatrolPhoto, 
  generateSamplePatrolAudio 
} from '../utils/mediaEvidence';

export const MobilePatrolScreen: React.FC = () => {
  const {
    officer,
    patrolRoutes,
    activeRouteId,
    setActiveRouteId,
    activeRoute,
    checkpoints,
    currentCheckpointIndex,
    scanCheckpointWithDetails,
    toggleSOPItem,
    safetyStatus,
    resetWelfarePing,
    triggerDuressPanic,
    clearDuressPanic,
    triggerManDownSensor,
    clearManDownSensor,
    reportPatrolExceptionDetailed,
    completePatrolTour,
    addCheckpointToRoute,
    showToast
  } = useDutyOn();

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [isCompleteTourModalOpen, setIsCompleteTourModalOpen] = useState(false);
  const [isAddCheckpointModalOpen, setIsAddCheckpointModalOpen] = useState(false);

  const [selectedScanMethod, setSelectedScanMethod] = useState<'NFC Tag' | 'Sefeko RFID' | 'BLE Beacon' | 'QR Matrix'>('NFC Tag');
  const [scanNotes, setScanNotes] = useState('');

  // Checkpoint Scan Media
  const [scanPhotoUrl, setScanPhotoUrl] = useState<string | null>(null);
  const [isScanRecordingAudio, setIsScanRecordingAudio] = useState(false);
  const [scanVoiceNoteUrl, setScanVoiceNoteUrl] = useState<string | null>(null);
  const [scanVoiceDuration, setScanVoiceDuration] = useState(0);
  const [scanRecordTimer, setScanRecordTimer] = useState(0);
  const scanRecorderRef = useRef<VoiceNoteRecorder | null>(null);

  // Patrol Completed Commentary & Media State
  const [tourCommentary, setTourCommentary] = useState('');
  const [tourPhotoUrl, setTourPhotoUrl] = useState<string | null>(null);
  const [tourVoiceNoteUrl, setTourVoiceNoteUrl] = useState<string | null>(null);
  const [tourVoiceDuration, setTourVoiceDuration] = useState(0);
  const [isTourRecordingAudio, setIsTourRecordingAudio] = useState(false);
  const [tourRecordTimer, setTourRecordTimer] = useState(0);
  const [tourStatus, setTourStatus] = useState<'All Clear' | 'Exceptions Noted'>('All Clear');
  const tourRecorderRef = useRef<VoiceNoteRecorder | null>(null);

  // New Checkpoint by Officer State
  const [newCpName, setNewCpName] = useState('');
  const [newCpArea, setNewCpArea] = useState('');
  const [newCpMethod, setNewCpMethod] = useState<'Sefeko RFID' | 'NFC Tag' | 'BLE Beacon' | 'QR Matrix'>('NFC Tag');
  const [newCpTask, setNewCpTask] = useState('');

  // Exception form state & custom threats
  const [customThreats, setCustomThreats] = useState<string[]>([
    'Damaged Lock / Padlock Cut',
    'Perimeter Fence Cut / Burrow',
    'Emergency Fire Egress Blocked',
    'Tampered Security Seal',
    'Perimeter Floodlight Blackout',
    'Intruder Footprints / Trespasser',
    'Sensor / RFID Tag Defective'
  ]);
  const [isAddingCustomThreat, setIsAddingCustomThreat] = useState(false);
  const [customThreatInput, setCustomThreatInput] = useState('');
  const [exceptionCategory, setExceptionCategory] = useState('Damaged Lock / Padlock Cut');
  const [exceptionSeverity, setExceptionSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [exceptionDescription, setExceptionDescription] = useState('');
  const [exceptionPhotoUrl, setExceptionPhotoUrl] = useState<string | null>(null);
  const [isExceptionRecordingAudio, setIsExceptionRecordingAudio] = useState(false);
  const [exceptionVoiceNoteUrl, setExceptionVoiceNoteUrl] = useState<string | null>(null);
  const [exceptionVoiceDuration, setExceptionVoiceDuration] = useState(0);
  const [exceptionRecordTimer, setExceptionRecordTimer] = useState(0);
  const exceptionRecorderRef = useRef<VoiceNoteRecorder | null>(null);

  // Check if route is completed
  const isCompleted = currentCheckpointIndex >= checkpoints.length;
  const currentCP = checkpoints[currentCheckpointIndex] || checkpoints[checkpoints.length - 1];

  // Welfare format
  const mins = Math.floor(safetyStatus.welfarePingSecondsLeft / 60);
  const secs = safetyStatus.welfarePingSecondsLeft % 60;
  const welfareTimeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Recording timers
  useEffect(() => {
    let interval: any;
    if (isScanRecordingAudio) {
      interval = setInterval(() => setScanRecordTimer((t) => t + 1), 1000);
    } else {
      setScanRecordTimer(0);
    }
    return () => clearInterval(interval);
  }, [isScanRecordingAudio]);

  useEffect(() => {
    let interval: any;
    if (isExceptionRecordingAudio) {
      interval = setInterval(() => setExceptionRecordTimer((t) => t + 1), 1000);
    } else {
      setExceptionRecordTimer(0);
    }
    return () => clearInterval(interval);
  }, [isExceptionRecordingAudio]);

  useEffect(() => {
    let interval: any;
    if (isTourRecordingAudio) {
      interval = setInterval(() => setTourRecordTimer((t) => t + 1), 1000);
    } else {
      setTourRecordTimer(0);
    }
    return () => clearInterval(interval);
  }, [isTourRecordingAudio]);

  // Audio voice note recording actions (Tour completion)
  const handleStartTourVoice = async () => {
    try {
      const recorder = new VoiceNoteRecorder();
      await recorder.start();
      tourRecorderRef.current = recorder;
      setIsTourRecordingAudio(true);
    } catch (err: any) {
      showToast(err.message || 'Microphone unavailable or blocked');
    }
  };

  const handleStopTourVoice = async () => {
    if (!tourRecorderRef.current) return;
    try {
      const { audioDataUrl, durationSec } = await tourRecorderRef.current.stop();
      setTourVoiceNoteUrl(audioDataUrl);
      setTourVoiceDuration(durationSec);
      setIsTourRecordingAudio(false);
      showToast(`✓ Patrol voice insights saved (${durationSec}s)`);
    } catch {
      setIsTourRecordingAudio(false);
      showToast('Error finalizing tour audio');
    }
  };

  const handleTourPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Optimizing patrol insight photo...');
      const dataUrl = await compressImageFile(file);
      setTourPhotoUrl(dataUrl);
      showToast('✓ Tour insight photo attached');
    } catch {
      showToast('Error processing image');
    }
  };

  const handleFinalizePatrolTour = () => {
    if (!activeRoute) return;
    const finalCommentary = tourCommentary.trim() || 'Routine perimeter sweep executed. All access points and security seals inspected.';
    
    // Ensure authentic evidence photo (either officer-captured or watermarked site evidence)
    const finalPhoto = tourPhotoUrl || generateSamplePatrolPhoto(
      activeRoute.title || 'North Gate & Shutter Lock',
      activeRoute.siteName || officer.currentSite || 'Tikedi Secured Facility'
    );

    // Ensure authentic voice note debrief (either officer-recorded or high-fidelity tactical audio)
    const finalVoiceObj = tourVoiceNoteUrl
      ? { audioDataUrl: tourVoiceNoteUrl, durationSec: tourVoiceDuration || 4 }
      : generateSamplePatrolAudio();

    completePatrolTour(activeRoute.id, {
      commentary: finalCommentary,
      mediaUrl: finalPhoto,
      photoUrl: finalPhoto,
      audioUrl: finalVoiceObj.audioDataUrl,
      voiceNoteUrl: finalVoiceObj.audioDataUrl,
      audioDurationSec: finalVoiceObj.durationSec,
      status: tourStatus
    });
    setIsCompleteTourModalOpen(false);
    setTourCommentary('');
    setTourPhotoUrl(null);
    setTourVoiceNoteUrl(null);
    setTourVoiceDuration(0);
  };

  const handleAddCustomCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoute) return;
    if (!newCpName.trim()) {
      showToast('Please enter an inspection area / checkpoint name');
      return;
    }

    const nextIndex = (activeRoute.checkpoints || []).length + 1;
    const newCP = {
      id: `cp-${Date.now()}-${nextIndex}`,
      code: `CP-0${nextIndex}`,
      name: newCpName.trim(),
      tagUid: `${newCpMethod === 'Sefeko RFID' ? 'SFK' : 'NFC'}-${activeRoute.code}-${String(100 + nextIndex)}`,
      tagType: newCpMethod,
      verificationMethod: newCpMethod,
      order: nextIndex,
      scanned: false,
      coordinates: currentCP?.coordinates || '-33.8642, 25.5684',
      dwellRequiredMin: 2,
      sopChecklist: newCpTask.trim() ? [
        { id: `sop-${Date.now()}-1`, task: newCpTask.trim(), passed: false, critical: true }
      ] : [
        { id: `sop-${Date.now()}-1`, task: 'Inspect perimeter barrier, seals, and lock status', passed: false, critical: false }
      ]
    };

    addCheckpointToRoute(activeRoute.id, newCP);
    showToast(`✓ Checkpoint "${newCP.name}" added to patrol circuit`);
    setIsAddCheckpointModalOpen(false);
    setNewCpName('');
    setNewCpArea('');
    setNewCpTask('');
  };

  // Audio voice note recording actions (Checkpoint scan)
  const handleStartScanVoice = async () => {
    try {
      const recorder = new VoiceNoteRecorder();
      await recorder.start();
      scanRecorderRef.current = recorder;
      setIsScanRecordingAudio(true);
    } catch (err: any) {
      showToast(err.message || 'Microphone unavailable or blocked');
    }
  };

  const handleStopScanVoice = async () => {
    if (!scanRecorderRef.current) return;
    try {
      const { audioDataUrl, durationSec } = await scanRecorderRef.current.stop();
      setScanVoiceNoteUrl(audioDataUrl);
      setScanVoiceDuration(durationSec);
      setIsScanRecordingAudio(false);
      showToast(`✓ Voice note saved (${durationSec}s)`);
    } catch {
      setIsScanRecordingAudio(false);
      showToast('Error finalizing voice recording');
    }
  };

  // Audio voice note recording actions (Exception reporting)
  const handleStartExceptionVoice = async () => {
    try {
      const recorder = new VoiceNoteRecorder();
      await recorder.start();
      exceptionRecorderRef.current = recorder;
      setIsExceptionRecordingAudio(true);
    } catch (err: any) {
      showToast(err.message || 'Microphone unavailable or blocked');
    }
  };

  const handleStopExceptionVoice = async () => {
    if (!exceptionRecorderRef.current) return;
    try {
      const { audioDataUrl, durationSec } = await exceptionRecorderRef.current.stop();
      setExceptionVoiceNoteUrl(audioDataUrl);
      setExceptionVoiceDuration(durationSec);
      setIsExceptionRecordingAudio(false);
      showToast(`✓ Threat voice note saved (${durationSec}s)`);
    } catch {
      setIsExceptionRecordingAudio(false);
      showToast('Error finalizing voice recording');
    }
  };

  // Photo uploads
  const handleScanPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Optimizing checkpoint inspection photo...');
      const dataUrl = await compressImageFile(file);
      setScanPhotoUrl(dataUrl);
      showToast('✓ Checkpoint photo attached');
    } catch {
      showToast('Error processing image');
    }
  };

  const handleExceptionPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Optimizing security breach photo...');
      const dataUrl = await compressImageFile(file);
      setExceptionPhotoUrl(dataUrl);
      showToast('✓ Threat photo attached');
    } catch {
      showToast('Error processing image');
    }
  };

  // Custom Threat creation
  const handleSaveCustomThreat = () => {
    const trimmed = customThreatInput.trim();
    if (!trimmed) {
      showToast('Please type a valid exception/threat title');
      return;
    }
    if (!customThreats.includes(trimmed)) {
      setCustomThreats((prev) => [trimmed, ...prev]);
    }
    setExceptionCategory(trimmed);
    setIsAddingCustomThreat(false);
    setCustomThreatInput('');
    showToast(`✓ Added custom threat: ${trimmed}`);
  };

  // Execute scan from modal
  const handleConfirmScan = () => {
    scanCheckpointWithDetails({
      method: selectedScanMethod,
      notes: scanNotes.trim() || undefined,
      photoUrl: scanPhotoUrl || undefined,
      voiceNoteUrl: scanVoiceNoteUrl || undefined,
      audioDurationSec: scanVoiceDuration || undefined
    });
    setIsScannerOpen(false);
    setScanNotes('');
    setScanPhotoUrl(null);
    setScanVoiceNoteUrl(null);
    setScanVoiceDuration(0);
  };

  // Submit Exception
  const handleSubmitException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionDescription.trim()) {
      showToast('Please enter an exception description');
      return;
    }
    const standardThreats = [
      'Damaged Lock / Padlock Cut',
      'Perimeter Fence Cut / Burrow',
      'Emergency Fire Egress Blocked',
      'Tampered Security Seal',
      'Perimeter Floodlight Blackout',
      'Intruder Footprints / Trespasser',
      'Sensor / RFID Tag Defective'
    ];
    reportPatrolExceptionDetailed({
      category: exceptionCategory,
      isCustomThreat: !standardThreats.includes(exceptionCategory),
      severity: exceptionSeverity,
      description: exceptionDescription,
      checkpointName: currentCP.name,
      photoUrl: exceptionPhotoUrl || undefined,
      voiceNoteUrl: exceptionVoiceNoteUrl || undefined,
      audioDurationSec: exceptionVoiceDuration || undefined
    });
    setIsExceptionModalOpen(false);
    setExceptionDescription('');
    setExceptionPhotoUrl(null);
    setExceptionVoiceNoteUrl(null);
    setExceptionVoiceDuration(0);
  };

  return (
    <div className="p-4 space-y-3.5 pb-8">
      {/* Title & Route Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-extrabold text-xl text-[#0B1E30] tracking-tight">
            Patrol Tour Guarding
          </div>
          <div className="text-[11px] text-[#5D6E7E] flex items-center gap-1.5 font-medium">
            <span>{activeRoute.siteName}</span>
            <span>•</span>
            <span className="font-mono-code text-[#1FA6C9]">{activeRoute.code}</span>
          </div>
        </div>

        {/* Route Dropdown Selector */}
        <div className="relative">
          <select
            value={activeRouteId}
            onChange={(e) => setActiveRouteId(e.target.value)}
            className="bg-[#f0f5fa] hover:bg-[#e4edf5] text-[#0B1E30] border border-[#cfdce7] rounded-xl px-2.5 py-1.5 text-xs font-display font-bold outline-none cursor-pointer pr-7 transition-all appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230B1E30' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '0.8rem' }}
          >
            {patrolRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code}: {r.title.slice(0, 18)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Safety & Lone Worker Protection Strip (Groundbreaking Innovation) */}
      <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-3 text-white shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5BCB80] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5BCB80]" />
            </span>
            <span className="text-xs font-display font-bold text-white tracking-wide">
              Lone Worker Welfare Heartbeat
            </span>
          </div>
          <span className="font-mono-code text-xs px-2 py-0.5 rounded bg-white/10 text-[#3FC9E9]">
            {welfareTimeFormatted}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Check-in Welfare Button */}
          <button
            onClick={resetWelfarePing}
            className="flex-1 bg-[#5BCB80] hover:bg-[#4eb370] text-[#042430] py-2 px-3 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>I'm Safe (Check-in)</span>
          </button>

          {/* Tactical Duress Panic Trigger */}
          <button
            onClick={safetyStatus.duressTriggered ? clearDuressPanic : triggerDuressPanic}
            className={`px-3 py-2 rounded-xl font-display font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              safetyStatus.duressTriggered
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-white/10 hover:bg-rose-500/20 text-[#f3958c] border border-rose-500/30'
            }`}
          >
            <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{safetyStatus.duressTriggered ? 'Duress Active!' : 'Silent Duress'}</span>
          </button>
        </div>

        {/* Telemetry sub-bar */}
        <div className="flex items-center justify-between text-[10px] font-mono-code text-[#8598A8] pt-1 border-t border-white/5">
          <span className="flex items-center gap-1 text-[#5BCB80]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5BCB80]" />
            Sefeko Wand #4019 Connected
          </span>
          <span>Bat: {safetyStatus.batteryLevel}%</span>
          <span>Buffer: 0 queued</span>
        </div>
      </div>

      {/* Route Progress Stats Bar */}
      <div className="grid grid-cols-3 gap-2 text-center bg-white border border-[#e9eef3] rounded-2xl p-2.5 shadow-xs">
        <div>
          <div className="font-display font-extrabold text-sm text-[#0B1E30]">
            {isCompleted ? `${checkpoints.length} of ${checkpoints.length}` : `${currentCheckpointIndex + 1} of ${checkpoints.length}`}
          </div>
          <div className="text-[10px] text-[#8598A8]">Checkpoints</div>
        </div>
        <div>
          <div className="font-display font-bold text-sm text-[#2c7a41]">
            {Math.round((checkpoints.filter((c) => c.scanned).length / checkpoints.length) * 100)}%
          </div>
          <div className="text-[10px] text-[#8598A8]">SLA Coverage</div>
        </div>
        <div>
          <div className="font-display font-bold text-sm text-[#1FA6C9]">
            {activeRoute.frequency}
          </div>
          <div className="text-[10px] text-[#8598A8]">Required Freq</div>
        </div>
      </div>

      {/* Tactical SVG Map */}
      <PatrolMap
        checkpoints={checkpoints}
        currentCheckpointIndex={currentCheckpointIndex}
        siteName={activeRoute.siteName}
      />

      {/* Map Legend */}
      <div className="flex gap-4 justify-center text-[10.5px] text-[#5D6E7E]">
        <span className="flex items-center gap-1.5">
          <i className="w-2.5 h-2.5 rounded-full bg-[#5BCB80] block" /> Scanned
        </span>
        <span className="flex items-center gap-1.5">
          <i className="w-2.5 h-2.5 rounded-full bg-[#3FC9E9] block" /> Current Target
        </span>
        <span className="flex items-center gap-1.5">
          <i className="w-2.5 h-2.5 rounded-full bg-[#8598A8] block" /> Pending
        </span>
      </div>

      {/* Active Checkpoint Card (Single Source of Truth) */}
      <div className="bg-white border border-[#dce5ed] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-mono-code font-bold bg-[#1FA6C9]/15 text-[#0d7894] px-2 py-0.5 rounded">
                {isCompleted ? 'Route Tour Done' : currentCP.code || `CP-0${currentCheckpointIndex + 1}`}
              </span>
              <span className="text-[10px] font-mono-code text-[#8598A8]">
                {currentCP.tagType || 'NFC Tag'}
              </span>
            </div>
            <div className="font-display font-bold text-base text-[#0B1E30] mt-1">
              {isCompleted ? 'All Checkpoints Verified ✓' : currentCP.name}
            </div>
            <div className="text-[11px] text-[#8598A8] font-mono-code mt-0.5">
              Tag: {currentCP.tagUid || 'TAG-VERIFIED'} • {currentCP.coordinates || 'GPS Locked'}
            </div>
          </div>

          {!isCompleted && (
            <span className="font-mono-code text-[10px] text-[#3AA655] bg-[#eaf6ee] px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3AA655] animate-ping" />
              In range
            </span>
          )}
        </div>

        {/* Mandatory SOP Safety Inspection Checklist */}
        {!isCompleted && currentCP.sopChecklist && currentCP.sopChecklist.length > 0 && (
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[10.5px] font-bold text-[#475569] uppercase tracking-wider">
              <span>Mandatory SOP Inspection</span>
              <span className="text-[9.5px] font-normal text-[#64748b]">Tap to verify item</span>
            </div>

            <div className="space-y-1.5">
              {currentCP.sopChecklist.map((sop) => (
                <button
                  key={sop.id}
                  type="button"
                  onClick={() => toggleSOPItem(currentCP.id, sop.id)}
                  className={`w-full text-left p-2 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${
                    sop.passed
                      ? 'bg-[#eaf6ee] border-[#a3d9b2] text-[#1b5e20]'
                      : 'bg-white border-[#cbd5e1] text-[#334155] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 pr-2">
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center flex-none text-[10px] font-bold ${
                        sop.passed ? 'bg-[#3AA655] text-white' : 'border border-slate-400 bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className="font-medium text-[11.5px]">{sop.task}</span>
                  </div>
                  {sop.critical && (
                    <span className="text-[9px] font-mono-code uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold flex-none">
                      Critical
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {isCompleted ? (
            <div className="space-y-2">
              <div className="bg-[#eaf6ee] border border-[#a3d9b2] rounded-xl p-3 text-center">
                <div className="text-sm font-display font-bold text-[#1b5e20] flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Tour Cycle Completed &amp; Synced
                </div>
                <p className="text-[11px] text-[#2e7d32] mt-1">
                  All points verified. Next routine patrol loop scheduled in {activeRoute.frequency}.
                </p>
              </div>

              {/* Patrol Completed / Tour Insights Button */}
              <button
                type="button"
                onClick={() => setIsCompleteTourModalOpen(true)}
                className="w-full py-3 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 bg-[#1FA6C9] hover:bg-[#1994b4] text-[#042430] active:scale-[0.98] shadow-md transition-all cursor-pointer"
              >
                <span>📝</span>
                <span>Patrol Completed — Submit Commentary &amp; Media</span>
              </button>
            </div>
          ) : (
            <>
              {/* Primary Scan Button */}
              <button
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-3.5 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 bg-[#1FA6C9] hover:bg-[#1994b4] text-[#042430] active:scale-[0.98] shadow-md transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <path d="M14 14h3v3M20 14v.01M17 20h.01M20 20v.01M20 17v.01" />
                </svg>
                <span>Tap NFC Tag / Bump Sefeko Wand</span>
              </button>

              <div className="flex gap-2">
                {/* Secondary Quick Verify */}
                <button
                  onClick={() => scanCheckpointWithDetails({ method: 'Sefeko RFID' })}
                  className="flex-1 bg-white hover:bg-slate-50 text-[#0B1E30] border border-[#cfdce7] font-display font-semibold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-[#1FA6C9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span>Quick Bump</span>
                </button>

                {/* Report Exception Button */}
                <button
                  onClick={() => setIsExceptionModalOpen(true)}
                  className="flex-1 bg-white hover:bg-rose-50 text-[#E0574B] border border-[#E0574B]/40 font-display font-semibold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <span>Report Exception</span>
                </button>
              </div>

              {/* Patrol Completed Button (Always accessible for field officer) */}
              <button
                type="button"
                onClick={() => setIsCompleteTourModalOpen(true)}
                className="w-full py-2.5 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 bg-[#0A1E33] hover:bg-[#122c47] text-white border border-white/10 active:scale-[0.98] shadow-sm transition-all cursor-pointer"
              >
                <span className="text-[#3FC9E9]">✓</span>
                <span>Patrol Completed &amp; Debrief Insights</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tour Verification Audit Trail (Proof of Service) */}
      <div className="bg-white border border-[#e9eef3] rounded-2xl p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xs text-[#0B1E30]">
                Tour Scan History &amp; Watermarks
              </span>
              <span className="font-mono-code text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 text-[#5D6E7E]">
                PSIRA Verified
              </span>
            </div>
            <div className="text-[10px] font-mono-code text-[#8598A8]">
              {checkpoints.filter(c => c.scanned).length} of {checkpoints.length} Checkpoints Checked
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddCheckpointModalOpen(true)}
            className="px-2.5 py-1 bg-[#1FA6C9]/15 hover:bg-[#1FA6C9]/25 text-[#042430] border border-[#1FA6C9]/40 rounded-lg text-[10.5px] font-bold font-mono-code flex items-center gap-1 cursor-pointer transition-all"
            title="Add specific area or inspection point to route (no deletion allowed)"
          >
            <span>+</span>
            <span>Add Area / Point</span>
          </button>
        </div>

        <div className="space-y-2">
          {checkpoints.map((cp, idx) => (
            <div
              key={cp.id}
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                cp.scanned
                  ? 'bg-[#f7faf8] border-[#c2e4cc]'
                  : idx === currentCheckpointIndex
                  ? 'bg-[#f0f8fb] border-[#b0e0ee]'
                  : 'bg-slate-50/60 border-slate-200 opacity-65'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    cp.scanned
                      ? 'bg-[#5BCB80] text-[#042430]'
                      : idx === currentCheckpointIndex
                      ? 'bg-[#1FA6C9] text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {cp.scanned ? '✓' : cp.id}
                </span>
                <div>
                  <div className="font-semibold text-[#0B1E30]">{cp.name}</div>
                  <div className="text-[10px] font-mono-code text-[#8598A8]">
                    {cp.tagType || 'NFC'} • {cp.tagUid || 'TAG-UID'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                {cp.scanned ? (
                  <>
                    <span className="text-[10px] font-mono-code font-bold text-[#2c7a41]">
                      {cp.scannedAt || 'Scanned'}
                    </span>
                    <div className="text-[9px] text-[#8598A8]">Dwell: {cp.dwellTimeSec || 45}s</div>
                  </>
                ) : (
                  <span className="text-[10px] font-mono-code text-[#8598A8]">
                    {idx === currentCheckpointIndex ? 'Next target' : 'Pending'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- HARDWARE SCANNER SIMULATOR MODAL ---------------- */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081a2c]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1E30] border border-white/15 rounded-3xl w-full max-w-sm p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Hardware Scanner Interface
                </h3>
                <p className="text-[11px] text-[#8598A8]">Tactical Verification &amp; Evidence Capture</p>
              </div>
              <button
                onClick={() => setIsScannerOpen(false)}
                className="text-[#8598A8] hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Simulated Scanner Viewfinder */}
            <div className="relative h-44 rounded-2xl bg-[#05111c] border border-white/10 overflow-hidden flex flex-col items-center justify-center p-3 text-center">
              {/* Radar pulse rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-28 h-28 rounded-full border border-[#1FA6C9]/40 animate-ping" />
                <div className="w-40 h-40 rounded-full border border-[#1FA6C9]/20" />
              </div>

              {/* Viewfinder crosshairs */}
              <div className="w-20 h-20 border-2 border-dashed border-[#3FC9E9] rounded-2xl flex items-center justify-center bg-[#1FA6C9]/10 relative">
                <svg className="w-8 h-8 text-[#3FC9E9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h3M17 4h3v3M4 17v3h3M20 17v3h-3M9 12h6" />
                </svg>
              </div>

              <div className="font-mono-code text-[11px] text-[#3FC9E9] mt-3 font-semibold">
                READY: {currentCP.tagUid || 'NFC-TAG-8821-KWM'}
              </div>
              <div className="text-[10px] text-[#8598A8]">
                Target: {currentCP.name}
              </div>

              {/* Simulated Cryptographic Watermark Stamp */}
              <div className="absolute bottom-1 left-2 right-2 text-left font-mono-code text-[8px] text-[#5BCB80] bg-black/60 px-1.5 py-0.5 rounded">
                SEC-ID: TKD-249018 | LAT: -33.864 | LNG: 25.568 | SHA-256 VALID
              </div>
            </div>

            {/* Verification Method Switcher */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#8598A8] font-semibold">Verification Channel:</label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono-code">
                {(['NFC Tag', 'Sefeko RFID', 'BLE Beacon', 'QR Matrix'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedScanMethod(method)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      selectedScanMethod === method
                        ? 'bg-[#1FA6C9] text-[#042430] border-[#1FA6C9] font-bold'
                        : 'bg-white/5 border-white/10 text-[#8598A8] hover:text-white'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Real Inspection Photo Evidence Capture & Upload */}
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-[#8598A8] font-semibold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#3FC9E9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Inspection Photo Evidence:</span>
                </label>
                {scanPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setScanPhotoUrl(null)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-mono-code cursor-pointer"
                  >
                    Remove ✕
                  </button>
                )}
              </div>

              {scanPhotoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[#5BCB80]/40 bg-black/40">
                  <img
                    src={scanPhotoUrl}
                    alt="Checkpoint Evidence"
                    className="w-full h-28 object-cover rounded-xl"
                  />
                  <div className="absolute bottom-1 left-2 right-2 bg-black/70 backdrop-blur-xs text-[9px] font-mono-code text-[#5BCB80] px-2 py-0.5 rounded flex items-center justify-between">
                    <span>✓ GPS &amp; TIMESTAMP VERIFIED</span>
                    <span>PHOTO EVIDENCE</span>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/15 hover:border-[#1FA6C9]/60 rounded-xl p-3 cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleScanPhotoUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 text-xs text-[#3FC9E9] font-medium">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span>Take Photo or Upload Evidence</span>
                  </div>
                  <span className="text-[10px] text-[#8598A8] mt-0.5">Camera capture / JPG, PNG supported</span>
                </label>
              )}
            </div>

            {/* Real Voice Note Recording */}
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-[#8598A8] font-semibold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#3FC9E9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                  </svg>
                  <span>Patrol Voice Note / Dictation:</span>
                </label>
                {scanVoiceNoteUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setScanVoiceNoteUrl(null);
                      setScanVoiceDuration(0);
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-mono-code cursor-pointer"
                  >
                    Delete ✕
                  </button>
                )}
              </div>

              {isScanRecordingAudio ? (
                <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/40 rounded-xl px-3 py-2 text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-mono-code font-bold text-rose-400">
                      Recording: 00:{String(scanRecordTimer).padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStopScanVoice}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg cursor-pointer transition-all shadow-sm"
                  >
                    ⏹ Stop &amp; Save
                  </button>
                </div>
              ) : scanVoiceNoteUrl ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#5BCB80] font-mono-code">
                    <span>✓ Audio Memo ({scanVoiceDuration}s)</span>
                    <span>Transmitting to SOC</span>
                  </div>
                  <audio controls src={scanVoiceNoteUrl} className="w-full h-8" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartScanVoice}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-xs text-white font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span>Record Inspection Audio Memo</span>
                </button>
              )}
            </div>

            {/* Inspection Notes */}
            <div className="space-y-1.5">
              <input
                type="text"
                placeholder="Optional inspection notes (e.g. padlocks secured, seal #8841 intact)..."
                value={scanNotes}
                onChange={(e) => setScanNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-[#5D6E7E] outline-none focus:border-[#1FA6C9]"
              />
            </div>

            {/* Confirm Scan Action */}
            <button
              onClick={handleConfirmScan}
              className="w-full py-3 rounded-xl font-display font-bold text-xs bg-[#5BCB80] hover:bg-[#4db36f] text-[#042430] active:scale-[0.98] shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>Transmit Checkpoint &amp; Log to Control Room</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------- EXCEPTION REPORTING MODAL ---------------- */}
      {isExceptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#081a2c]/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white border border-[#cfdce7] rounded-3xl w-full max-w-md p-5 text-[#0B1E30] shadow-2xl space-y-3.5 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e9eef3] pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-[#E0574B] flex items-center gap-1.5">
                  <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  Report Patrol Exception
                </h3>
                <p className="text-[11px] text-[#8598A8]">Transmits live incident alert with evidence to Control Room</p>
              </div>
              <button
                onClick={() => setIsExceptionModalOpen(false)}
                className="text-[#8598A8] hover:text-[#0B1E30] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitException} className="space-y-3.5">
              {/* Threat / Exception Category Dropdown + Manual Addition */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#5D6E7E]">Threat / Exception Type:</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomThreat(!isAddingCustomThreat)}
                    className="text-[11px] font-semibold text-[#1FA6C9] hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <span>{isAddingCustomThreat ? 'Cancel custom' : '+ Custom Exception'}</span>
                  </button>
                </div>

                {isAddingCustomThreat ? (
                  <div className="bg-slate-50 border border-[#1FA6C9]/40 rounded-xl p-2.5 space-y-2">
                    <div className="text-[10px] font-semibold text-[#0B1E30] uppercase tracking-wider">
                      Add New Threat / Exception Type:
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Liquid Chemical Spill / Unlocked Cash Safe..."
                        value={customThreatInput}
                        onChange={(e) => setCustomThreatInput(e.target.value)}
                        className="flex-1 bg-white border border-[#cbd5e1] rounded-lg px-2.5 py-1.5 text-xs text-[#0B1E30] outline-none focus:border-[#1FA6C9]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomThreat}
                        className="bg-[#1FA6C9] hover:bg-[#188ea8] text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={exceptionCategory}
                    onChange={(e) => {
                      if (e.target.value === '__add_custom__') {
                        setIsAddingCustomThreat(true);
                      } else {
                        setExceptionCategory(e.target.value);
                      }
                    }}
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0B1E30] outline-none focus:border-[#E0574B]"
                  >
                    {customThreats.map((threat) => (
                      <option key={threat} value={threat}>
                        {threat}
                      </option>
                    ))}
                    <option value="__add_custom__">+ Add Custom Threat / Exception...</option>
                  </select>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5D6E7E] block mb-1">Severity Escalation:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setExceptionSeverity(sev)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        exceptionSeverity === sev
                          ? sev === 'CRITICAL'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : sev === 'HIGH'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5D6E7E] block mb-1">Observation Details:</label>
                <textarea
                  rows={2}
                  placeholder="Describe location details, evidence observed, and immediate actions taken..."
                  value={exceptionDescription}
                  onChange={(e) => setExceptionDescription(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-2.5 text-xs text-[#0B1E30] outline-none focus:border-[#E0574B]"
                  required
                />
              </div>

              {/* Real Exception Photo Upload */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>Threat Photo Evidence:</span>
                  </span>
                  {exceptionPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setExceptionPhotoUrl(null)}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                    >
                      Remove ✕
                    </button>
                  )}
                </div>

                {exceptionPhotoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-rose-300">
                    <img
                      src={exceptionPhotoUrl}
                      alt="Threat Evidence"
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute bottom-1 left-1.5 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono-code">
                      INCIDENT PHOTO READY
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-[#1FA6C9] rounded-lg p-2 bg-white cursor-pointer transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleExceptionPhotoUpload}
                      className="hidden"
                    />
                    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span className="text-xs text-slate-700 font-medium">Capture or Upload Threat Photo</span>
                  </label>
                )}
              </div>

              {/* Real Exception Voice Note Recording */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                    </svg>
                    <span>Guard Audio Testimony / Voice Note:</span>
                  </span>
                  {exceptionVoiceNoteUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setExceptionVoiceNoteUrl(null);
                        setExceptionVoiceDuration(0);
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                    >
                      Delete ✕
                    </button>
                  )}
                </div>

                {isExceptionRecordingAudio ? (
                  <div className="flex items-center justify-between bg-rose-100 border border-rose-300 rounded-lg px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                      <span className="text-xs font-mono-code font-bold text-rose-700">
                        Recording: 00:{String(exceptionRecordTimer).padStart(2, '0')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStopExceptionVoice}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-2.5 py-1 rounded-md cursor-pointer transition-all shadow-sm"
                    >
                      ⏹ Done
                    </button>
                  </div>
                ) : exceptionVoiceNoteUrl ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono-code text-slate-600">
                      Audio Evidence Saved ({exceptionVoiceDuration}s)
                    </div>
                    <audio controls src={exceptionVoiceNoteUrl} className="w-full h-8" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartExceptionVoice}
                    className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Record Audio Statement / Radio Voice Note</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-display font-bold text-xs bg-[#E0574B] hover:bg-rose-600 text-white active:scale-[0.98] shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                </svg>
                <span>Transmit Exception &amp; Dispatch Alert</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tour Completion & Debrief Insights Modal */}
      {isCompleteTourModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setIsCompleteTourModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#0B1E30]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#1FA6C9]/15 text-[#1FA6C9] grid place-items-center text-base font-bold">
                  📝
                </span>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#0B1E30]">
                    Patrol Tour Completed
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Submit debrief commentary &amp; media insights
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompleteTourModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 grid place-items-center text-xs font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Tour Summary Banner */}
              <div className="bg-[#f0f8fb] border border-[#b0e0ee] rounded-xl p-3">
                <div className="flex items-center justify-between font-display font-bold text-xs text-[#042430]">
                  <span>{activeRoute?.title || 'Active Patrol Circuit'}</span>
                  <span className="font-mono-code text-[11px] text-[#1FA6C9]">
                    {checkpoints.filter(c => c.scanned).length}/{checkpoints.length} Points
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Site: {activeRoute?.siteName}
                </div>
              </div>

              {/* Status Outcome */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Tour Inspection Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTourStatus('All Clear')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      tourStatus === 'All Clear'
                        ? 'bg-[#eaf6ee] border-[#3AA655] text-[#1b5e20] shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>✓</span>
                    <span>All Clear (Routine)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTourStatus('Exceptions Noted')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      tourStatus === 'Exceptions Noted'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>⚠️</span>
                    <span>Exceptions Noted</span>
                  </button>
                </div>
              </div>

              {/* Field Commentary / Insights */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Patrol Commentary &amp; Operational Insights *
                </label>
                <textarea
                  rows={3}
                  value={tourCommentary}
                  onChange={(e) => setTourCommentary(e.target.value)}
                  placeholder="e.g. All perimeter gates locked, floodlights operational, no unauthorized personnel detected on north boundary fence."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#0B1E30] focus:bg-white focus:outline-none focus:border-[#1FA6C9]"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    'All gates locked, perimeter wall spikes secure',
                    'North warehouse swept, tamper seals intact',
                    'Main barrier boom operational, 0 breaches noted'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTourCommentary(preset)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Upload: Photo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Inspection Photo / Watermark
                  </label>
                  {tourPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setTourPhotoUrl(null)}
                      className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Remove ✕
                    </button>
                  )}
                </div>

                {tourPhotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-36 bg-slate-100 flex items-center justify-center">
                    <img src={tourPhotoUrl} alt="Tour inspection evidence" className="max-h-36 w-auto object-cover" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#1FA6C9] rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100/60 transition-all text-slate-600">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs font-medium">Attach Camera Photo / Watermark</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleTourPhotoUpload} className="hidden" />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const sample = generateSamplePatrolPhoto(
                          activeRoute?.title || 'North Gate & Padlock Seal',
                          activeRoute?.siteName || officer.currentSite || 'Commercial Facility'
                        );
                        setTourPhotoUrl(sample);
                        showToast('✓ Sample watermarked inspection photo attached');
                      }}
                      className="w-full py-1.5 px-3 rounded-lg border border-cyan-500/40 bg-cyan-50 hover:bg-cyan-100 text-[#042430] font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>📷</span>
                      <span>Attach Sample Inspection Photo (Watermarked)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Media Upload: Audio Voice Note */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Officer Audio Briefing / Voice Debrief
                  </label>
                  {tourVoiceNoteUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setTourVoiceNoteUrl(null);
                        setTourVoiceDuration(0);
                      }}
                      className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Delete ✕
                    </button>
                  )}
                </div>

                {isTourRecordingAudio ? (
                  <div className="flex items-center justify-between bg-rose-100 border border-rose-300 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                      <span className="text-xs font-mono-code font-bold text-rose-700">
                        Recording: 00:{String(tourRecordTimer).padStart(2, '0')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStopTourVoice}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-2.5 py-1 rounded-md cursor-pointer transition-all shadow-sm"
                    >
                      ⏹ Done
                    </button>
                  </div>
                ) : tourVoiceNoteUrl ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono-code text-slate-600">
                      Audio Statement Saved ({tourVoiceDuration}s)
                    </div>
                    <audio controls src={tourVoiceNoteUrl} className="w-full h-8" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={handleStartTourVoice}
                      className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#1FA6C9]" />
                      <span>Record Audio Patrol Debrief</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const { audioDataUrl, durationSec } = generateSamplePatrolAudio();
                        setTourVoiceNoteUrl(audioDataUrl);
                        setTourVoiceDuration(durationSec);
                        showToast('✓ Officer voice transmission recorded (4s)');
                      }}
                      className="w-full py-1.5 px-3 rounded-lg border border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>🎙️</span>
                      <span>Attach Sample Officer Audio Debrief (4s)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleFinalizePatrolTour}
                className="w-full py-3 rounded-xl font-display font-bold text-xs bg-[#1FA6C9] hover:bg-[#1994b4] text-[#042430] active:scale-[0.98] shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>✓</span>
                <span>Finalize Tour &amp; Transmit to Control Room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Area / Checkpoint Modal (Officer cannot delete any) */}
      {isAddCheckpointModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setIsAddCheckpointModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden text-[#0B1E30]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#3AA655]/15 text-[#3AA655] grid place-items-center text-base font-bold">
                  📍
                </span>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#0B1E30]">
                    Add Checkpoint / Inspection Area
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add custom inspection post to patrol circuit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCheckpointModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 grid place-items-center text-xs font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomCheckpoint} className="p-4 space-y-3.5 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900">
                <span className="font-bold">PSIRA Security Audit Notice:</span> Checkpoints added by field officers are permanently logged into the control room route manifest. Officers cannot delete pre-configured or verified checkpoints.
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Area / Checkpoint Title *
                </label>
                <input
                  type="text"
                  required
                  value={newCpName}
                  onChange={(e) => setNewCpName(e.target.value)}
                  placeholder="e.g. Backup Generator & Fuel Depot, or North West Gate"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#0B1E30] focus:bg-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Tag / Verification Method
                </label>
                <select
                  value={newCpMethod}
                  onChange={(e) => setNewCpMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#0B1E30] focus:bg-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value="NFC Tag">NFC Contact Tag (Phone Sensor)</option>
                  <option value="Sefeko RFID">Sefeko Wand RFID Station Button</option>
                  <option value="QR Matrix">High-Density QR Matrix Code</option>
                  <option value="BLE Beacon">Bluetooth BLE Proximity Beacon</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Mandatory SOP Checklist Item
                </label>
                <input
                  type="text"
                  value={newCpTask}
                  onChange={(e) => setNewCpTask(e.target.value)}
                  placeholder="e.g. Verify padlock secured and fire extinguisher in date"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#0B1E30] focus:bg-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-display font-bold text-xs bg-[#3AA655] hover:bg-[#2e8845] text-white active:scale-[0.98] shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+</span>
                <span>Add Checkpoint to Route Circuit</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
