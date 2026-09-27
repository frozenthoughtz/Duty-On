import React, { useState, useRef, useEffect } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { IncidentQueueItem, EvidenceFile } from '../types/dutyon';
import { EditIncidentModal } from './modals/EditIncidentModal';

export const IncidentReportsView: React.FC = () => {
  const {
    incidents,
    sites,
    resolveIncident,
    updateIncident,
    deleteIncident,
    deleteIncidentEvidence,
    addIncidentNote,
    uploadIncidentEvidence,
    setSelectedIncidentForModal,
    setIsNewIncidentModalOpen,
    showToast
  } = useDutyOn();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected incident ID for the full live docket viewer (syncs automatically with context state)
  const [activeDocketId, setActiveDocketId] = useState<string | null>(null);
  const activeDocket = incidents.find((i) => i.id === activeDocketId) || null;

  // Edit incident state
  const [editingIncident, setEditingIncident] = useState<IncidentQueueItem | null>(null);

  // Official PSIRA Printable Report Modal
  const [printableIncident, setPrintableIncident] = useState<IncidentQueueItem | null>(null);

  // Image Preview Lightbox
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // New Note input state inside docket viewer
  const [newNoteText, setNewNoteText] = useState('');

  // File Upload & Voice Note Recording State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Filter incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter !== 'ALL' && (inc.status || 'open') !== statusFilter) return false;
    if (severityFilter !== 'ALL') {
      const p = inc.priority.toUpperCase();
      if (severityFilter === 'HIGH' && p !== 'HIGH' && p !== 'CRITICAL') return false;
      if (severityFilter === 'MED' && p !== 'MED' && p !== 'MEDIUM') return false;
      if (severityFilter === 'LOW' && p !== 'LOW' && p !== 'INFO') return false;
    }
    if (siteFilter !== 'ALL' && inc.site !== siteFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCat = inc.category.toLowerCase().includes(q);
      const matchSite = inc.site.toLowerCase().includes(q);
      const matchCas = (inc.sapsCaseNumber || '').toLowerCase().includes(q);
      const matchDesc = (inc.description || '').toLowerCase().includes(q);
      const matchOp = inc.operator.toLowerCase().includes(q);
      if (!matchCat && !matchSite && !matchCas && !matchDesc && !matchOp) return false;
    }
    return true;
  });

  // Calculate stats
  const totalCases = incidents.length;
  const sapsCases = incidents.filter((i) => i.sapsCaseNumber).length;
  const highPriorityCases = incidents.filter((i) => i.priority.toUpperCase() === 'HIGH' || i.priority.toUpperCase() === 'CRITICAL').length;
  const activeCases = incidents.filter((i) => (i.status || 'open') !== 'resolved').length;

  const getPriorityBadge = (priority: string) => {
    const p = priority.toUpperCase();
    if (p === 'HIGH' || p === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono-code font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
          CRITICAL
        </span>
      );
    }
    if (p === 'MED' || p === 'MEDIUM') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono-code font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          HIGH / MED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono-code font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        STANDARD
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            ● Investigating
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            ● Dispatched
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            ✓ Resolved
          </span>
        );
      case 'open':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            ● Active Open
          </span>
        );
    }
  };

  const handleAddNoteToDocket = (incidentId: string) => {
    if (!newNoteText.trim()) return;
    addIncidentNote(incidentId, newNoteText, 'Control Room Supervisor');
    setNewNoteText('');
    showToast('Investigation note added to docket');
  };

  const handleStatusChange = (incidentId: string, newStatus: 'open' | 'investigating' | 'dispatched' | 'resolved') => {
    updateIncident(incidentId, { status: newStatus });
    showToast(`Docket #${incidentId} updated to ${newStatus}`);
  };

  // Handle Drag/Drop and File Picker Upload for Dockets, Images, Docs, Audio
  const handleFilesUpload = (files: FileList | File[]) => {
    if (!activeDocket) return;
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        let category: 'image' | 'voice_note' | 'docket' | 'document' = 'document';
        if (file.type.startsWith('image/')) category = 'image';
        else if (file.type.startsWith('audio/')) category = 'voice_note';
        else if (file.name.toLowerCase().includes('cas') || file.name.toLowerCase().includes('docket')) category = 'docket';

        const sizeFormatted = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

        const newEvidence: EvidenceFile = {
          id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: sizeFormatted,
          uploadedAt: new Date().toLocaleTimeString().slice(0, 5),
          url: resultUrl,
          category
        };

        uploadIncidentEvidence(activeDocket.id, newEvidence);
      };
      reader.readAsDataURL(file);
    });

    showToast(`Attached ${fileList.length} evidence file(s) to docket #${activeDocket.id}`);
  };

  // Live Microphone Voice Note Recording
  const handleStartVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        handleSimulatedRadioVoiceNote();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!activeDocket) return;
          const base64Audio = reader.result as string;
          const newVoiceNote: EvidenceFile = {
            id: `ev-voice-${Date.now()}`,
            name: `Dispatch_VoiceNote_${new Date().toLocaleTimeString().replace(/:/g, '')}.webm`,
            type: 'audio/webm',
            size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
            uploadedAt: new Date().toLocaleTimeString().slice(0, 5),
            url: base64Audio,
            category: 'voice_note'
          };
          uploadIncidentEvidence(activeDocket.id, newVoiceNote);
          showToast('Live tactical voice note attached to docket');
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission blocked or unavailable. Using simulated tactical dispatch audio.', err);
      handleSimulatedRadioVoiceNote();
    }
  };

  const handleStopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Fallback: Generate an authentic tactical radio transmission audio tone
  const handleSimulatedRadioVoiceNote = () => {
    if (!activeDocket) return;
    try {
      // Create tactical radio tone synthesis
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // audio context silent catch
    }

    const radioNote: EvidenceFile = {
      id: `ev-radio-${Date.now()}`,
      name: `Radio_Dispatch_CH1_${activeDocket.site.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.m4a`,
      type: 'audio/m4a',
      size: '640 KB',
      uploadedAt: new Date().toLocaleTimeString().slice(0, 5),
      category: 'voice_note'
    };
    uploadIncidentEvidence(activeDocket.id, radioNote);
    showToast('Tactical radio transmission voice note recorded & attached');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && isRecordingVoice) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecordingVoice]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Summary */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-gradient-to-r from-[#0C2438] via-[#0E2C44] to-[#0A1D2D] border border-white/10 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 grid place-items-center text-rose-400">
              <svg className="w-5 h-5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-white tracking-wide">
                Tactical Incident Reports &amp; SAPS Docket Management
              </h2>
              <p className="text-xs text-[#8598A8] mt-0.5">
                Centralized crime scene dossiers, forensic ballistics register &amp; PSIRA Section 38 compliance
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Quick Print Summary */}
          <button
            onClick={() => {
              if (incidents[0]) setPrintableIncident(incidents[0]);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.07] hover:bg-white/[0.12] text-[#d6e3ee] border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#3FC9E9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Latest Docket</span>
          </button>

          {/* Log New Incident */}
          <button
            id="btn-log-new-incident"
            onClick={() => setIsNewIncidentModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-display font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Log Emergency Incident</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Active Open Dockets</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-rose-400">{activeCases}</span>
            <span className="text-[11px] text-[#8598A8] font-semibold">under response</span>
          </div>
          <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>Tactical units on standby</span>
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">SAPS CAS Dockets</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-[#3FC9E9]">{sapsCases}</span>
            <span className="text-[11px] text-[#8598A8] font-semibold">Police cases</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1FA6C9]" />
            <span>Mount Road &amp; Humewood SAPS</span>
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">High / Critical Priority</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-amber-400">{highPriorityCases}</span>
            <span className="text-[11px] text-amber-300 font-semibold">Weapons involved</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Ballistics evidence catalogued</span>
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Resolved This Week</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-emerald-400">14</span>
            <span className="text-[11px] text-emerald-300 font-semibold">100% docket signoff</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Client sign-off complete</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0b2135]/60 border border-white/10 rounded-xl p-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8598A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search category, CAS number, site, suspect details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-white placeholder-[#8598A8] focus:outline-none focus:border-[#1FA6C9]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#8598A8]">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
            >
              <option value="ALL">All Statuses</option>
              <option value="open">Active Open</option>
              <option value="investigating">Investigating</option>
              <option value="dispatched">Dispatched</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#8598A8]">
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">Critical / High</option>
              <option value="MED">Medium</option>
              <option value="LOW">Standard / Low</option>
            </select>
          </div>

          {/* Site Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#8598A8]">
            <span>Site:</span>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
            >
              <option value="ALL">All Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table / Cards Grid */}
      <div className="space-y-3">
        {filteredIncidents.map((inc) => (
          <div
            key={inc.id}
            className="bg-[#0b2135]/90 border border-white/10 rounded-2xl p-4.5 hover:border-white/20 transition-all shadow-md"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                {getPriorityBadge(inc.priority)}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-white">
                      {inc.category}
                    </h3>
                    {inc.sapsCaseNumber && (
                      <span className="font-mono-code text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        {inc.sapsCaseNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#8598A8] mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-[#3FC9E9] font-medium">{inc.site}</span>
                    <span>·</span>
                    <span>Reported: {inc.reportedAt || inc.age}</span>
                    <span>·</span>
                    <span>Lead Officer: {inc.operator}</span>
                    {inc.sapsStation && (
                      <>
                        <span>·</span>
                        <span className="text-slate-400">Jurisdiction: {inc.sapsStation}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Quick Actions */}
              <div className="flex items-center gap-2">
                {getStatusBadge(inc.status)}
                
                {/* View Docket */}
                <button
                  onClick={() => setActiveDocketId(inc.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1FA6C9]/15 hover:bg-[#1FA6C9]/25 text-[#3FC9E9] border border-[#1FA6C9]/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Full Docket</span>
                </button>

                {/* Edit Incident Docket */}
                <button
                  onClick={() => setEditingIncident(inc)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Edit Incident, Case Number & Docket Parameters"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>

                {/* Print Report */}
                <button
                  onClick={() => setPrintableIncident(inc)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Generate Official PSIRA Incident Report Docket"
                >
                  <svg className="w-3.5 h-3.5 text-[#3FC9E9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>PSIRA Docket</span>
                </button>

                {/* Mark Resolved */}
                {(inc.status || 'open') !== 'resolved' && (
                  <button
                    onClick={() => resolveIncident(inc.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}

                {/* Delete Incident */}
                <button
                  onClick={() => {
                    deleteIncident(inc.id);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                  title="Permanently Delete Incident Record"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Narrative Summary */}
            {inc.description && (
              <p className="text-xs text-[#d6e3ee] mt-3 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                {inc.description}
              </p>
            )}

            {/* Detailed metadata chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-2 text-[11px] text-[#8598A8]">
              {inc.weaponsInvolved && (
                <div className="flex items-center gap-1.5 bg-white/[0.03] p-2 rounded-lg border border-white/5">
                  <span className="text-amber-400 font-bold">⚔️ Weapon:</span>
                  <span className="text-white truncate">{inc.weaponsInvolved}</span>
                </div>
              )}

              {inc.assignedUnit && (
                <div className="flex items-center gap-1.5 bg-white/[0.03] p-2 rounded-lg border border-white/5">
                  <span className="text-[#3FC9E9] font-bold">🚔 Unit:</span>
                  <span className="text-white truncate">{inc.assignedUnit} (ETA {inc.etaMinutes || 3}m)</span>
                </div>
              )}

              {inc.evidenceFiles && inc.evidenceFiles.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white/[0.03] p-2 rounded-lg border border-white/5">
                  <span className="text-purple-400 font-bold">📁 Evidence:</span>
                  <span className="text-white truncate">{inc.evidenceFiles.length} file(s) attached</span>
                </div>
              )}

              {inc.suspectDetails?.vehicle && (
                <div className="flex items-center gap-1.5 bg-white/[0.03] p-2 rounded-lg border border-white/5">
                  <span className="text-rose-400 font-bold">🚗 Vehicle:</span>
                  <span className="text-white truncate">{inc.suspectDetails.vehicle}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredIncidents.length === 0 && (
          <div className="bg-[#0b2135]/60 border border-white/10 rounded-2xl p-12 text-center text-sm text-[#8598A8]">
            No incidents found matching the selected filter criteria.
          </div>
        )}
      </div>

      {/* FULL INCIDENT DOCKET DOSSIER MODAL */}
      {activeDocket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b2135] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-[#091a2a] flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-code text-[11px] font-bold text-[#1FA6C9] uppercase">
                    Incident Case Docket #{activeDocket.id}
                  </span>
                  {activeDocket.sapsCaseNumber && (
                    <span className="font-mono-code text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      SAPS: {activeDocket.sapsCaseNumber}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-extrabold text-xl text-white mt-1">
                  {activeDocket.category} — {activeDocket.site}
                </h3>
                <p className="text-xs text-[#8598A8]">
                  Reported: {activeDocket.reportedAt || activeDocket.age} · Lead Investigator: {activeDocket.investigatingOfficer || activeDocket.operator}
                </p>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingIncident(activeDocket)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Edit case details, SAPS officer & parameters"
                >
                  <span>✏️</span>
                  <span>Edit Docket</span>
                </button>

                <button
                  onClick={() => {
                    deleteIncident(activeDocket.id);
                    setActiveDocketId(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-all"
                  title="Expunge Incident"
                >
                  <span>🗑️</span>
                  <span className="hidden sm:inline">Delete</span>
                </button>

                <button
                  onClick={() => setActiveDocketId(null)}
                  className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-400 hover:text-white grid place-items-center cursor-pointer transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-[#d6e3ee]">
              {/* Case Status Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.04] p-3.5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-[#8598A8] font-semibold">Docket Status:</span>
                  {getStatusBadge(activeDocket.status)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(activeDocket.id, 'investigating')}
                    className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30"
                  >
                    Set Investigating
                  </button>
                  <button
                    onClick={() => handleStatusChange(activeDocket.id, 'dispatched')}
                    className="px-2.5 py-1 rounded text-[11px] font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30"
                  >
                    Set Dispatched
                  </button>
                  <button
                    onClick={() => handleStatusChange(activeDocket.id, 'resolved')}
                    className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30"
                  >
                    Resolve &amp; Close Docket
                  </button>
                </div>
              </div>

              {/* Chronological Narrative */}
              <div>
                <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>Incident Chronology &amp; Narrative</span>
                </h4>
                <div className="bg-black/30 p-3.5 rounded-xl border border-white/10 leading-relaxed text-[#c4d6e4]">
                  {activeDocket.description || 'Full forensic summary pending investigator submission.'}
                </div>
              </div>

              {/* Suspect & Vehicle Details Matrix */}
              {activeDocket.suspectDetails && (
                <div>
                  <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-2">
                    Suspect &amp; Vehicle Matrix
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/20 p-3.5 rounded-xl border border-white/10">
                    <div>
                      <div className="text-[11px] text-[#8598A8]">Number of Suspects:</div>
                      <div className="text-white font-semibold">{activeDocket.suspectDetails.count || 'Unknown'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8598A8]">Physical Description:</div>
                      <div className="text-white">{activeDocket.suspectDetails.description || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8598A8]">Clothing / Disguise:</div>
                      <div className="text-white">{activeDocket.suspectDetails.clothing || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8598A8]">Getaway Vehicle:</div>
                      <div className="text-white font-semibold text-rose-300">{activeDocket.suspectDetails.vehicle || 'On foot'}</div>
                    </div>
                    {activeDocket.suspectDetails.escapeRoute && (
                      <div className="col-span-2">
                        <div className="text-[11px] text-[#8598A8]">Escape Route:</div>
                        <div className="text-white">{activeDocket.suspectDetails.escapeRoute}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weapons & Casualties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-black/20 p-3.5 rounded-xl border border-white/10">
                  <div className="text-[11px] text-[#8598A8] uppercase font-bold">Weapons / Tools Involved</div>
                  <div className="text-white font-medium mt-1">{activeDocket.weaponsInvolved || 'None reported'}</div>
                </div>
                <div className="bg-black/20 p-3.5 rounded-xl border border-white/10">
                  <div className="text-[11px] text-[#8598A8] uppercase font-bold">Injuries / Casualties</div>
                  <div className="text-white font-medium mt-1">{activeDocket.injuriesCasualties || 'No injuries reported'}</div>
                </div>
              </div>

              {/* Witness Statements */}
              {activeDocket.witnessStatements && activeDocket.witnessStatements.length > 0 && (
                <div>
                  <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-2">
                    Witness Statements &amp; Deponents
                  </h4>
                  <div className="space-y-2.5">
                    {activeDocket.witnessStatements.map((w) => (
                      <div key={w.id} className="bg-white/[0.03] p-3 rounded-xl border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{w.name}</span>
                          <span className="font-mono-code text-[11px] text-[#3FC9E9]">{w.contact}</span>
                        </div>
                        <p className="text-xs text-[#a9bccb] italic">"{w.statement}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Locker Files (Photos, Documents, Voice Notes, Dockets) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                      Evidence Locker &amp; Attachments
                    </h4>
                    <p className="text-[11px] text-[#8598A8]">
                      CCTV stills, SAPS CAS dockets, ballistic reports &amp; dispatch voice recordings
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleFilesUpload(e.target.files);
                      }}
                    />

                    {/* Attach Files Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-[#1FA6C9]/15 hover:bg-[#1FA6C9]/25 text-[#3FC9E9] border border-[#1FA6C9]/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>📎</span>
                      <span>Upload Files</span>
                    </button>

                    {/* Voice Note Recorder Button */}
                    {isRecordingVoice ? (
                      <button
                        onClick={handleStopVoiceRecording}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer animate-pulse transition-all shadow-md shadow-rose-600/40"
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>Stop ({recordSeconds}s)</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStartVoiceRecording}
                        className="px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                        title="Record live investigator or dispatch voice note"
                      >
                        <span>🎙️</span>
                        <span>Record Audio</span>
                      </button>
                    )}

                    {/* Radio dispatch audio note simulation */}
                    <button
                      onClick={handleSimulatedRadioVoiceNote}
                      className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-medium cursor-pointer transition-all"
                      title="Log 2-way tactical radio voice transmission"
                    >
                      <span>📻 Radio Log</span>
                    </button>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files) handleFilesUpload(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${
                    isDragOver
                      ? 'border-[#1FA6C9] bg-[#1FA6C9]/10'
                      : 'border-white/10 hover:border-white/20 bg-black/20'
                  }`}
                >
                  <p className="text-xs text-[#8598A8]">
                    <span className="text-[#3FC9E9] font-semibold">Click to browse</span> or drag &amp; drop photos, CAS affidavits, or audio recordings here
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Supports JPG, PNG, PDF, WEBM, MP3, DOCX (Max 25MB per item)
                  </p>
                </div>

                {/* Evidence Files Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(activeDocket.evidenceFiles || []).map((file) => {
                    const isImage = file.type?.startsWith('image/') || file.category === 'image' || file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                    const isAudio = file.type?.startsWith('audio/') || file.category === 'voice_note' || file.name.match(/\.(webm|mp3|m4a|wav)$/i);
                    const isDocketDoc = file.category === 'docket' || file.name.toLowerCase().includes('docket') || file.name.toLowerCase().includes('cas');

                    return (
                      <div
                        key={file.id}
                        className="flex flex-col justify-between bg-black/40 p-3 rounded-xl border border-white/10 hover:border-white/20 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            {/* Icon or Thumbnail */}
                            {isImage && file.url ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                onClick={() => setPreviewImage({ url: file.url!, title: file.name })}
                                className="w-10 h-10 rounded-lg object-cover border border-white/10 cursor-pointer hover:opacity-80 transition-opacity flex-none"
                              />
                            ) : (
                              <div className={`w-9 h-9 rounded-lg grid place-items-center text-lg flex-none ${
                                isImage ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' :
                                isAudio ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' :
                                isDocketDoc ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                                'bg-slate-500/15 text-slate-300 border border-slate-500/20'
                              }`}>
                                {isImage ? '📷' : isAudio ? '🎙️' : isDocketDoc ? '⚖️' : '📄'}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-white font-medium truncate" title={file.name}>
                                {file.name}
                              </div>
                              <div className="text-[10px] text-[#8598A8] flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono-code">{file.size || '1.2 MB'}</span>
                                <span>·</span>
                                <span>Uploaded {file.uploadedAt}</span>
                                {isDocketDoc && (
                                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold text-[9px]">
                                    SAPS Docket
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delete File Button */}
                          <button
                            onClick={() => {
                              deleteIncidentEvidence(activeDocket.id, file.id);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer text-xs"
                            title="Delete evidence file"
                          >
                            🗑️
                          </button>
                        </div>

                        {/* Inline Audio Player for Voice Notes */}
                        {isAudio && (
                          <div className="mt-2 pt-2 border-t border-white/5">
                            {file.url ? (
                              <audio controls src={file.url} className="w-full h-8 text-xs" />
                            ) : (
                              <div className="text-[10px] text-purple-300 font-mono-code bg-purple-500/10 px-2 py-1 rounded flex items-center justify-between">
                                <span>Encrypted Radio Transmission</span>
                                <span>00:18 sec</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions for Images & Documents */}
                        {!isAudio && (
                          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-end gap-2">
                            {isImage && file.url && (
                              <button
                                onClick={() => setPreviewImage({ url: file.url!, title: file.name })}
                                className="px-2 py-0.5 rounded text-[10px] text-[#3FC9E9] bg-white/[0.05] hover:bg-white/10 transition-colors"
                              >
                                View Photo
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (file.url) {
                                  const a = document.createElement('a');
                                  a.href = file.url;
                                  a.download = file.name;
                                  a.click();
                                } else {
                                  showToast(`Accessing secure archive: ${file.name}`);
                                }
                              }}
                              className="px-2 py-0.5 rounded text-[10px] text-slate-300 bg-white/[0.05] hover:bg-white/10 transition-colors"
                            >
                              Download
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(!activeDocket.evidenceFiles || activeDocket.evidenceFiles.length === 0) && (
                    <div className="text-xs text-[#8598A8] italic col-span-1 sm:col-span-2 text-center py-4 bg-black/10 rounded-xl border border-white/5">
                      No evidence documents or crime scene media attached yet. Use the upload button above.
                    </div>
                  )}
                </div>
              </div>

              {/* Investigator Dispatch Notes */}
              <div>
                <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-2">
                  Investigation &amp; Dispatch Log
                </h4>
                <div className="space-y-2 mb-3">
                  {(activeDocket.notes || []).map((note) => (
                    <div key={note.id} className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between text-[11px] text-[#8598A8]">
                        <span className="font-bold text-[#3FC9E9]">{note.author}</span>
                        <span className="font-mono-code">{note.time}</span>
                      </div>
                      <div className="text-xs text-white mt-1">{note.text}</div>
                    </div>
                  ))}
                </div>

                {/* Add Note Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter investigator update or dispatch instruction..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNoteToDocket(activeDocket.id);
                    }}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#8598A8] focus:outline-none focus:border-[#1FA6C9]"
                  />
                  <button
                    onClick={() => handleAddNoteToDocket(activeDocket.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1FA6C9] hover:bg-[#1b93b3] text-[#04222c] shadow-sm cursor-pointer flex-none"
                  >
                    Add Log
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-[#091a2a] flex items-center justify-between">
              <button
                onClick={() => setPrintableIncident(activeDocket)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/10 flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#3FC9E9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Official PSIRA Docket</span>
              </button>

              <button
                onClick={() => setActiveDocketId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE PSIRA DOCKET REPORT MODAL */}
      {printableIncident && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-[#0B1E30] rounded-2xl w-full max-w-3xl shadow-2xl p-8 space-y-6 my-6 border border-slate-300 print:m-0 print:p-4 print:border-none print:shadow-none">
            {/* Header / Security Company Letterhead */}
            <div className="border-b-2 border-[#0B1E30] pb-4 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-mono-code font-bold tracking-[0.2em] text-[#8598A8] uppercase">
                  REPUBLIC OF SOUTH AFRICA · PRIVATE SECURITY INDUSTRY REGULATORY AUTHORITY
                </div>
                <h1 className="font-display font-extrabold text-2xl text-[#0B1E30] tracking-wide mt-1">
                  OFFICIAL INCIDENT INVESTIGATION DOCKET
                </h1>
                <div className="text-xs text-slate-600 font-medium mt-0.5">
                  TIKEDI SECURITY SERVICES (PTY) LTD · PSIRA REGISTRATION #2890141 / EASTERN CAPE
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono-code text-sm font-extrabold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                  {printableIncident.sapsCaseNumber || `CAS REF: ${printableIncident.id}`}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Confidential Docket</div>
              </div>
            </div>

            {/* Case Summary Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Incident Category:</div>
                <div className="font-bold text-slate-900">{printableIncident.category}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Protected Site:</div>
                <div className="font-bold text-slate-900">{printableIncident.site}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Date &amp; Time Logged:</div>
                <div className="font-bold text-slate-900">{printableIncident.reportedAt || '22 May 2026 22:15 CAT'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Jurisdiction SAPS:</div>
                <div className="font-bold text-slate-900">{printableIncident.sapsStation || 'Humewood SAPS'}</div>
              </div>
            </div>

            {/* Narrative & Sequence of Events */}
            <div>
              <h3 className="font-display font-bold text-sm text-[#0B1E30] border-b border-slate-200 pb-1 mb-2">
                1. Chronological Statement of Incident &amp; Tactical Intervention
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {printableIncident.description || 'Full forensic summary of events as registered in the Control Room dispatch register.'}
              </p>
            </div>

            {/* Suspect & Weapons Section */}
            <div>
              <h3 className="font-display font-bold text-sm text-[#0B1E30] border-b border-slate-200 pb-1 mb-2">
                2. Forensic Evidence &amp; Perpetrator Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-800">Weapons Catalogued:</span>{' '}
                  <span className="text-slate-700">{printableIncident.weaponsInvolved || 'None reported'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">Casualties / Injuries:</span>{' '}
                  <span className="text-slate-700">{printableIncident.injuriesCasualties || 'No injuries sustained'}</span>
                </div>
                {printableIncident.suspectDetails?.vehicle && (
                  <div className="col-span-2">
                    <span className="font-bold text-slate-800">Suspect Escape Vehicle:</span>{' '}
                    <span className="text-slate-700">{printableIncident.suspectDetails.vehicle} ({printableIncident.suspectDetails.escapeRoute || 'Direction unconfirmed'})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Index */}
            <div>
              <h3 className="font-display font-bold text-sm text-[#0B1E30] border-b border-slate-200 pb-1 mb-2">
                3. Attached Digital Evidence Register
              </h3>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                {(printableIncident.evidenceFiles || []).map((file) => (
                  <li key={file.id}>
                    <span className="font-semibold">{file.name}</span> ({file.size || 'Digital File'} · Logged at {file.uploadedAt})
                  </li>
                ))}
                {(!printableIncident.evidenceFiles || printableIncident.evidenceFiles.length === 0) && (
                  <li>CCTV and physical forensic items archived under control room custody.</li>
                )}
              </ul>
            </div>

            {/* Signatures & Certification */}
            <div className="border-t border-slate-300 pt-4 grid grid-cols-2 gap-8 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Investigating Officer Signoff:</div>
                <div className="font-bold text-slate-900 mt-2">{printableIncident.operator}</div>
                <div className="text-[10px] text-slate-500">PSIRA Grade A Registered / Tactical Response</div>
                <div className="h-8 border-b border-dashed border-slate-400 mt-2" />
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Control Room Commander Signoff:</div>
                <div className="font-bold text-slate-900 mt-2">M. Botha (Ops Director)</div>
                <div className="text-[10px] text-slate-500">Certified Docket Verification Stamp</div>
                <div className="h-8 border-b border-dashed border-slate-400 mt-2" />
              </div>
            </div>

            {/* Action Buttons for Print Modal */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 print:hidden">
              <button
                onClick={() => setPrintableIncident(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  window.print();
                  showToast('Preparing docket for printer / PDF export');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B1E30] hover:bg-slate-800 text-white shadow-md flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Official Docket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT INCIDENT MODAL */}
      {editingIncident && (
        <EditIncidentModal
          incident={editingIncident}
          onClose={() => setEditingIncident(null)}
        />
      )}

      {/* PHOTO PREVIEW LIGHTBOX */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="font-semibold text-sm truncate">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white px-2 py-1 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-w-full max-h-[80vh] rounded-xl object-contain border border-white/15 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
