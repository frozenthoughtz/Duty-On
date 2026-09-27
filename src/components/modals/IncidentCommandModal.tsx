import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { IncidentQueueItem, IncidentNote, EvidenceFile } from '../../types/dutyon';

interface Props {
  incident: IncidentQueueItem;
  onClose: () => void;
}

export const IncidentCommandModal: React.FC<Props> = ({ incident, onClose }) => {
  const {
    updateIncident,
    addIncidentNote,
    uploadIncidentEvidence,
    dispatchArmedBackupToSite,
    sites,
    showToast
  } = useDutyOn();

  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'evidence' | 'docket'>('details');

  // Form states
  const [status, setStatus] = useState<IncidentQueueItem['status']>(incident.status || 'open');
  const [priority, setPriority] = useState(incident.priority);
  const [sapsCaseNumber, setSapsCaseNumber] = useState(incident.sapsCaseNumber || '');
  const [assignedUnit, setAssignedUnit] = useState(incident.assignedUnit || 'Tactical Unit Bravo-4');
  const [operatorNote, setOperatorNote] = useState('');
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('');

  // Keyboard Escape listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleUpdateDetails = () => {
    updateIncident(incident.id, {
      status,
      priority,
      sapsCaseNumber,
      assignedUnit
    });
    showToast(`Incident #${incident.id} updated successfully`);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorNote.trim()) return;
    addIncidentNote(incident.id, operatorNote.trim(), 'A. Ngesi (Control Room)');
    setOperatorNote('');
    showToast('Supervisor investigation note logged');
  };

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const evidence: EvidenceFile = {
      id: `ev-${Date.now()}`,
      name: newEvidenceTitle.trim() || file.name,
      type: file.type.includes('pdf') ? 'PDF' : 'IMAGE',
      size: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: new Date().toLocaleTimeString().slice(0, 5),
      url: URL.createObjectURL(file)
    };

    uploadIncidentEvidence(incident.id, evidence);
    setNewEvidenceTitle('');
    showToast(`Evidence "${evidence.name}" attached to docket`);
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0A1E33] border border-white/15 rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-start justify-between bg-[#071726]/80 flex-none">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl grid place-items-center font-display font-extrabold text-2xl shadow-md flex-none ${
              priority.toString().toUpperCase() === 'HIGH' || priority.toString().toUpperCase() === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-bold text-base sm:text-lg text-white">
                  Case {incident.id}: {incident.category}
                </h2>
                <span className={`font-mono-code text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  status === 'resolved'
                    ? 'bg-[#5BCB80]/15 text-[#5BCB80] border-[#5BCB80]/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  ● {(status || 'OPEN').toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-[#8598A8] mt-0.5 flex flex-wrap items-center gap-2 sm:gap-3">
                <span>📍 Site: <strong className="text-white">{incident.site}</strong></span>
                <span>•</span>
                <span>Age: <strong className="text-[#3FC9E9] font-mono-code">{incident.age} ago</strong></span>
                <span>•</span>
                <span>Operator: <strong className="text-white">{incident.operator}</strong></span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white grid place-items-center transition-all cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Quick Action Bar */}
        <div className="bg-[#071726] p-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setStatus('resolved');
                updateIncident(incident.id, { status: 'resolved' });
                showToast(`Incident #${incident.id} marked as RESOLVED and closed`);
              }}
              className="bg-[#3AA655] hover:bg-[#34944c] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>✓</span>
              <span>Resolve &amp; Close Case</span>
            </button>

            <button
              onClick={() => {
                const siteObj = sites.find(s => s.name === incident.site);
                if (siteObj) {
                  dispatchArmedBackupToSite(siteObj.id);
                }
                setStatus('dispatched');
                updateIncident(incident.id, { status: 'dispatched' });
                showToast(`Tactical unit dispatched to ${incident.site}`);
              }}
              className="bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🚔</span>
              <span>Dispatch Tactical Backup</span>
            </button>
          </div>

          <button
            onClick={() => showToast(`Generating printable police docket for Case ${incident.id}…`)}
            className="text-xs text-[#3FC9E9] hover:text-white flex items-center gap-1.5 font-semibold cursor-pointer"
          >
            <span>🖨️</span>
            <span>Print Official Docket</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-white/10 flex gap-2 overflow-x-auto">
          {[
            { id: 'details', label: 'Incident Details' },
            { id: 'docket', label: 'SAPS Docket & Suspects' },
            { id: 'notes', label: `Investigation Log (${incident.notes?.length || 2})` },
            { id: 'evidence', label: `Evidence Vault (${incident.evidenceFiles?.length || 2})` }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-[#1FA6C9] text-[#3FC9E9]'
                  : 'border-transparent text-[#8598A8] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#071726] border border-white/10 rounded-2xl p-4">
                <div>
                  <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  >
                    <option value="open" className="bg-[#0A1E33]">Open (Unresolved)</option>
                    <option value="dispatched" className="bg-[#0A1E33]">Dispatched / Unit En-Route</option>
                    <option value="investigating" className="bg-[#0A1E33]">Under Investigation</option>
                    <option value="resolved" className="bg-[#0A1E33]">Resolved &amp; Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  >
                    <option value="CRITICAL" className="bg-[#0A1E33]">Critical (Code Red)</option>
                    <option value="HIGH" className="bg-[#0A1E33]">High Priority</option>
                    <option value="MED" className="bg-[#0A1E33]">Medium Priority</option>
                    <option value="LOW" className="bg-[#0A1E33]">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                    SAPS / Police CAS Reference Number
                  </label>
                  <input
                    type="text"
                    value={sapsCaseNumber}
                    onChange={(e) => setSapsCaseNumber(e.target.value)}
                    placeholder="e.g. CAS 148/05/2026 Kwamagxaki"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                    Assigned Tactical Armed Vehicle
                  </label>
                  <input
                    type="text"
                    value={assignedUnit}
                    onChange={(e) => setAssignedUnit(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  />
                </div>
              </div>

              <div className="bg-[#071726] border border-white/10 rounded-2xl p-4">
                <div className="font-bold text-xs text-white mb-2">Original Occurrence Report</div>
                <p className="text-xs text-[#9db0c0] leading-relaxed">
                  {incident.description || 'Alarm sensor triggered on secondary perimeter fence line. Officer on duty reported visual confirmation of 2 suspicious individuals inspecting delivery bays. CCTV cameras 04 and 06 focused on vehicle zone.'}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUpdateDetails}
                  className="bg-[#3AA655] hover:bg-[#34944c] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Save Case Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB: SAPS DOCKET & SUSPECTS */}
          {activeTab === 'docket' && (
            <div className="space-y-4">
              {/* Police CAS & Station banner */}
              <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] text-[#8598A8] uppercase tracking-wider font-semibold">
                    Registered SAPS Case Number
                  </div>
                  <div className="font-mono-code font-bold text-base text-[#3FC9E9] mt-0.5">
                    {incident.sapsCaseNumber || 'Pending Official SAPS Station CAS Registration'}
                  </div>
                  <div className="text-xs text-[#8598A8]">
                    Station: {incident.sapsStation || 'Humewood SAPS Sector 2'} · Investigating Officer: {incident.investigatingOfficer || incident.operator}
                  </div>
                </div>

                <button
                  onClick={() => {
                    window.print();
                    showToast('Printing official PSIRA / SAPS Incident Docket…');
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white font-display font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Print Case Docket</span>
                </button>
              </div>

              {/* Suspect & Vehicle Details */}
              {incident.suspectDetails && (
                <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="text-rose-400">👤</span>
                    <span>Suspect Profile &amp; Getaway Matrix</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-[#8598A8] uppercase font-semibold">Suspects Count:</div>
                      <div className="font-bold text-white mt-0.5">{incident.suspectDetails.count || 2} Perpetrator(s)</div>
                    </div>
                    <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-[#8598A8] uppercase font-semibold">Getaway Vehicle:</div>
                      <div className="font-bold text-rose-300 mt-0.5">{incident.suspectDetails.vehicle || 'On foot'}</div>
                    </div>
                    <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5 sm:col-span-2">
                      <div className="text-[10px] text-[#8598A8] uppercase font-semibold">Physical Description &amp; Clothing:</div>
                      <div className="text-slate-200 mt-0.5">{incident.suspectDetails.description || 'Male suspect wearing dark hoodie and balaclava'} · {incident.suspectDetails.clothing}</div>
                    </div>
                    {incident.suspectDetails.escapeRoute && (
                      <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5 sm:col-span-2">
                        <div className="text-[10px] text-[#8598A8] uppercase font-semibold">Escape Route:</div>
                        <div className="text-[#3FC9E9] mt-0.5">{incident.suspectDetails.escapeRoute}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weapons & Casualties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#071726] border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] text-[#8598A8] uppercase font-semibold">Weapons Involved</div>
                  <div className="text-xs font-bold text-amber-300 mt-1">{incident.weaponsInvolved || 'None reported'}</div>
                </div>
                <div className="bg-[#071726] border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] text-[#8598A8] uppercase font-semibold">Casualties &amp; Injuries</div>
                  <div className="text-xs font-bold text-white mt-1">{incident.injuriesCasualties || 'No injuries sustained'}</div>
                </div>
              </div>

              {/* Witness Statements */}
              {incident.witnessStatements && incident.witnessStatements.length > 0 && (
                <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-2.5">
                  <div className="font-bold text-xs text-white uppercase tracking-wider">
                    Deponent &amp; Witness Statements
                  </div>
                  {incident.witnessStatements.map((ws) => (
                    <div key={ws.id} className="bg-white/[0.03] p-3 rounded-xl border border-white/5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{ws.name}</span>
                        <span className="text-[#3FC9E9] font-mono-code text-[11px]">{ws.contact}</span>
                      </div>
                      <p className="text-[#c4d6e4] italic">"{ws.statement}"</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Supervisor Sign-Off Stamp */}
              <div className="bg-[#071726] border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">
                    ✓ PSIRA SECTION 38 VERIFIED DOCKET
                  </div>
                  <div className="text-xs text-white font-bold mt-0.5">
                    Sign-off: {incident.supervisorSignoff?.name || 'M. Botha (Ops Director)'}
                  </div>
                  <div className="text-[10px] text-[#8598A8] font-mono-code">
                    PSIRA #{incident.supervisorSignoff?.psiraNumber || '2890141'} · Certified Digital Hash
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 grid place-items-center text-emerald-400 text-xl font-bold">
                  ✓
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVESTIGATION NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Add Note */}
              <form onSubmit={handleAddNote} className="bg-[#071726] border border-white/10 rounded-2xl p-3.5 space-y-2">
                <div className="font-bold text-xs text-white">Add Supervisor Investigation Entry</div>
                <textarea
                  rows={2}
                  value={operatorNote}
                  onChange={(e) => setOperatorNote(e.target.value)}
                  placeholder="Record radio communication, officer feedback, or police liaison notes…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white resize-none focus:outline-none focus:border-[#1FA6C9]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    + Log Investigation Note
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-2.5">
                {(incident.notes || [
                  { id: 'n1', author: 'A. Ngesi (Operator)', time: '23:42', text: 'Contacted Kwamagxaki SAPS sector vehicle. Constable Mthize confirmed patrol vehicle 12 is en route with ETA 5 minutes.' },
                  { id: 'n2', author: 'T. April (Supervisor)', time: '23:35', text: 'Officer Thando instructed to withdraw to secure guardhouse and maintain visual line of sight with bodycam on.' }
                ]).map((note) => (
                  <div key={note.id} className="p-3.5 bg-[#071726] border border-white/10 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#3FC9E9]">{note.author}</span>
                      <span className="font-mono-code text-[11px] text-[#8598A8]">{note.time}</span>
                    </div>
                    <p className="text-xs text-white leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE & PHOTOS */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              {/* Evidence Upload */}
              <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-white">Attach Evidence (Photo / CCTV / Statement)</div>
                <input
                  type="text"
                  value={newEvidenceTitle}
                  onChange={(e) => setNewEvidenceTitle(e.target.value)}
                  placeholder="Evidence Title (e.g. CCTV Still - Vehicle Registration)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                />
                <label className="block w-full border-2 border-dashed border-white/20 hover:border-[#1FA6C9] rounded-2xl p-3 text-center cursor-pointer transition-all bg-white/[0.02]">
                  <span className="text-xs text-[#8598A8] block">
                    📁 Click to upload photo, audio note or statement PDF
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.mp3,.wav"
                    onChange={handleEvidenceUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Evidence Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(incident.evidenceFiles || [
                  { id: 'ev1', name: 'Crime Scene - Cut Fence Photo #1', type: 'IMAGE', size: '1.8 MB', uploadedAt: '23:36' },
                  { id: 'ev2', name: 'Witness Statement - Guard Thando.pdf', type: 'PDF', size: '340 KB', uploadedAt: '23:40' }
                ]).map((ev) => (
                  <div key={ev.id} className="p-3 bg-[#071726] border border-white/10 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-[#1FA6C9]/15 text-[#3FC9E9] grid place-items-center text-sm flex-none">
                        {ev.type === 'IMAGE' ? '📷' : '📄'}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-white truncate">{ev.name}</div>
                        <div className="text-[10px] text-[#8598A8]">{ev.size} · Uploaded {ev.uploadedAt}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast(`Previewing evidence: ${ev.name}`)}
                      className="text-xs font-bold text-[#3FC9E9] hover:underline flex-none ml-2"
                    >
                      View ›
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#071726] flex items-center justify-between">
          <div className="text-xs text-[#8598A8]">
            Docket verified with SAPS liaison protocol
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer"
          >
            Close Docket
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
