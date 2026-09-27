import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { IncidentQueueItem, EvidenceFile } from '../../types/dutyon';
import { compressImageFile, VoiceNoteRecorder } from '../../utils/mediaEvidence';

interface Props {
  isOpen?: boolean;
  onClose: () => void;
}

export const NewIncidentModal: React.FC<Props> = ({ isOpen = true, onClose }) => {
  const { sites, createIncident, showToast, officer, userLocation } = useDutyOn();

  if (!isOpen) return null;

  const [category, setCategory] = useState('Perimeter Fence Breach');
  const [site, setSite] = useState(officer?.currentSite || sites[0]?.name || 'Provincial Office');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MED' | 'LOW'>('HIGH');
  const [description, setDescription] = useState('');
  const [assignedUnit, setAssignedUnit] = useState('Tactical Unit Bravo-4');
  const [sapsCaseNumber, setSapsCaseNumber] = useState('');
  const [dispatchNow, setDispatchNow] = useState(true);

  // Photo Evidence
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  // Voice Recording
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const recorderRef = useRef<VoiceNoteRecorder | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Processing incident evidence photo...');
      const dataUrl = await compressImageFile(file);
      setPhotoUrl(dataUrl);
      showToast('✓ Threat photo attached');
    } catch {
      showToast('Error uploading photo');
    }
  };

  const handleStartVoice = async () => {
    try {
      const rec = new VoiceNoteRecorder();
      await rec.start();
      recorderRef.current = rec;
      setIsRecordingVoice(true);
      showToast('🎙️ Recording voice debrief...');
    } catch {
      showToast('Microphone access blocked or unavailable');
    }
  };

  const handleStopVoice = async () => {
    if (!recorderRef.current) return;
    try {
      const res = await recorderRef.current.stop();
      setVoiceNoteUrl(res.audioDataUrl);
      setVoiceDuration(res.durationSec);
      setIsRecordingVoice(false);
      showToast(`✓ Voice debrief recorded (${res.durationSec}s)`);
    } catch {
      setIsRecordingVoice(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please provide an incident description or evidence notes');
      return;
    }

    const timeStr = new Date().toLocaleTimeString().slice(0, 5);
    const incidentId = `INC-${Date.now().toString().slice(-5)}`;

    const evidenceFiles: EvidenceFile[] = [];
    if (photoUrl) {
      evidenceFiles.push({
        id: `ev-photo-${Date.now()}`,
        name: `Incident_Photo_${category.replace(/\s+/g, '_')}.jpg`,
        type: 'image/jpeg',
        size: '340 KB',
        uploadedAt: timeStr,
        url: photoUrl,
        category: 'image'
      });
    }
    if (voiceNoteUrl) {
      evidenceFiles.push({
        id: `ev-voice-${Date.now()}`,
        name: `Officer_Debrief_${timeStr.replace(/:/g, '')}.webm`,
        type: 'audio/webm',
        size: '280 KB',
        uploadedAt: timeStr,
        url: voiceNoteUrl,
        category: 'voice_note',
        durationSec: voiceDuration
      });
    }

    const matchingSite = sites.find((s) => s.name === site);
    const coords = officer?.coords || (userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : (matchingSite?.coords ? { lat: matchingSite.coords.lat || -32.3567, lng: matchingSite.coords.lng || 22.5833 } : undefined));

    const newInc: IncidentQueueItem = {
      id: incidentId,
      category,
      site,
      location: `${site} · ${officer?.currentPost || 'Field Area'}`,
      coordinates: coords ? `${coords.lat}, ${coords.lng}` : undefined,
      priority: priority as any,
      age: 'Just now',
      operator: officer?.name || 'Control Room Dispatch',
      officerId: officer?.empId || 'DIR-0001',
      reportedAt: timeStr,
      status: dispatchNow ? 'dispatched' : 'open',
      description: description.trim(),
      photoUrl: photoUrl || undefined,
      voiceNoteUrl: voiceNoteUrl || undefined,
      audioDurationSec: voiceDuration || undefined,
      sapsCaseNumber: sapsCaseNumber.trim() || undefined,
      assignedUnit: dispatchNow ? assignedUnit : undefined,
      notes: [
        {
          id: `n-${Date.now()}`,
          author: officer?.name || 'Control Room Operator',
          time: timeStr,
          text: `Incident logged from ${officer ? 'Officer Field App' : 'Control Room'}. ${dispatchNow ? `Dispatched to ${assignedUnit}.` : 'Pending response.'}`
        }
      ],
      evidenceFiles
    };

    createIncident(newInc);
    showToast(`🚨 Incident #${newInc.id} logged to Incident Queue & Control Room`);
    onClose();
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0A1E33] border border-white/15 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#071726]/80 flex-none">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 grid place-items-center text-lg">
              🚨
            </span>
            <div>
              <h2 className="font-display font-bold text-sm text-white">Log Emergency Incident</h2>
              <p className="text-[11px] text-[#8598A8]">Create docket &amp; dispatch tactical response</p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Incident Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="Armed Robbery">Armed Robbery / Hijack</option>
                <option value="Perimeter Fence Breach">Perimeter Fence Breach</option>
                <option value="Suspicious Activity / Loitering">Suspicious Activity</option>
                <option value="Vehicle Theft / Break-in">Vehicle Theft / Break-in</option>
                <option value="Gate Access Dispute">Gate Access Dispute</option>
                <option value="Fire / Smoke Alarm">Fire / Smoke Alarm</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Public Assist">Public Assist / Escort</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="CRITICAL">Critical (Code Red)</option>
                <option value="HIGH">High Priority</option>
                <option value="MED">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Affected Site / Location
            </label>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
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
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Caller / Initial Incident Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe caller details, suspect description, armed status, direction of flight…"
              className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white resize-none focus:outline-none focus:border-[#1FA6C9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                SAPS CAS (Optional)
              </label>
              <input
                type="text"
                value={sapsCaseNumber}
                onChange={(e) => setSapsCaseNumber(e.target.value)}
                placeholder="e.g. CAS 221/05/2026"
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Tactical Unit
              </label>
              <input
                type="text"
                value={assignedUnit}
                onChange={(e) => setAssignedUnit(e.target.value)}
                placeholder="Tactical Unit Bravo-4"
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
          </div>

          {/* Threat Photo Evidence */}
          <div className="bg-[#071726] p-3 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <span>📷</span>
                <span>Incident Photo Evidence:</span>
              </span>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                >
                  Remove ✕
                </button>
              )}
            </div>

            {photoUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-rose-400/50 max-h-36">
                <img src={photoUrl} alt="Evidence" className="w-full h-32 object-cover" />
                <div className="absolute bottom-1 left-2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono-code text-rose-300">
                  PHOTO EVIDENCE ATTACHED
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-[#1FA6C9] rounded-xl p-2.5 bg-black/20 cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <span className="text-xs text-[#8598A8] hover:text-white">
                  📸 Capture Threat Photo or Upload Evidence
                </span>
              </label>
            )}
          </div>

          {/* Voice Testimony / Audio Note */}
          <div className="bg-[#071726] p-3 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <span>🎙️</span>
                <span>Officer Audio Debrief / Testimony:</span>
              </span>
              {voiceNoteUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setVoiceNoteUrl(null);
                    setVoiceDuration(0);
                  }}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                >
                  Delete ✕
                </button>
              )}
            </div>

            {isRecordingVoice ? (
              <div className="flex items-center justify-between bg-rose-500/20 border border-rose-500/50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-mono-code font-bold text-rose-300">Recording live audio...</span>
                </div>
                <button
                  type="button"
                  onClick={handleStopVoice}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1 rounded-lg cursor-pointer"
                >
                  ⏹ Stop &amp; Save
                </button>
              </div>
            ) : voiceNoteUrl ? (
              <div className="flex items-center justify-between bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-mono-code">
                  <span>✓ Audio Voice Note Saved ({voiceDuration}s)</span>
                </div>
                <audio src={voiceNoteUrl} controls className="h-7 max-w-[180px]" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartVoice}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-[#8598A8] hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>🎙️ Record Voice Note</span>
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 bg-[#071726] p-3 rounded-xl border border-white/10 cursor-pointer">
            <input
              type="checkbox"
              checked={dispatchNow}
              onChange={(e) => setDispatchNow(e.target.checked)}
              className="rounded accent-[#1FA6C9]"
            />
            <span className="text-white font-semibold">
              Dispatch Armed Tactical Unit immediately with siren notification
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#8598A8] hover:text-white px-3 py-2 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/30"
            >
              Confirm &amp; Log Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
