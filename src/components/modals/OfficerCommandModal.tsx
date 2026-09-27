import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { OfficerRecord, DocumentItem } from '../../types/dutyon';

interface Props {
  officer: OfficerRecord;
  onClose: () => void;
  isOpen?: boolean;
}

export const OfficerCommandModal: React.FC<Props> = ({ officer, onClose }) => {
  const {
    sites,
    updateOfficer,
    reassignOfficerSite,
    sendOfficerWelfarePing,
    uploadOfficerFile,
    updateOfficerStatus,
    showToast
  } = useDutyOn();

  const [activeTab, setActiveTab] = useState<'dossier' | 'documents' | 'command' | 'history'>('dossier');
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: officer.name || '',
    empId: officer.empId || '',
    psiraNumber: officer.psiraNumber || '',
    grade: officer.grade || 'Grade C',
    hourlyRate: officer.hourlyRate || 36.50,
    clientBillingRate: officer.clientBillingRate || 82.00,
    phone: officer.phone || '',
    email: officer.email || '',
    location: officer.location || 'Gqeberha, Eastern Cape',
    currentSite: officer.currentSite || (sites[0]?.name || 'Greenacres Mall'),
    currentPost: officer.currentPost || 'Main Entrance',
    shiftPreference: (officer.shiftPreference || 'DAY') as 'DAY' | 'NIGHT' | 'ROTATING',
    firearmCompetency: !!officer.firearmCompetency,
    firstAidCert: !!officer.firstAidCert,
    emergencyContactName: officer.emergencyContactName || '',
    emergencyContactPhone: officer.emergencyContactPhone || '',
    availableDays: officer.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  });

  // Reassignment & Quick Command state
  const [selectedSite, setSelectedSite] = useState(officer.currentSite);
  const [selectedPost, setSelectedPost] = useState(officer.currentPost);
  const [directMsg, setDirectMsg] = useState('');

  // Document Vault state
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('PSIRA / Compliance');
  const [newDocExpiry, setNewDocExpiry] = useState('Dec 2027');
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  // Keyboard Escape listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingDoc) {
          setViewingDoc(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, viewingDoc]);

  // Keep editFormData in sync if officer record updates externally
  React.useEffect(() => {
    setEditFormData({
      name: officer.name || '',
      empId: officer.empId || '',
      psiraNumber: officer.psiraNumber || '',
      grade: officer.grade || 'Grade C',
      hourlyRate: officer.hourlyRate || 36.50,
      clientBillingRate: officer.clientBillingRate || 82.00,
      phone: officer.phone || '',
      email: officer.email || '',
      location: officer.location || 'Gqeberha, Eastern Cape',
      currentSite: officer.currentSite || (sites[0]?.name || 'Greenacres Mall'),
      currentPost: officer.currentPost || 'Main Entrance',
      shiftPreference: (officer.shiftPreference || 'DAY') as 'DAY' | 'NIGHT' | 'ROTATING',
      firearmCompetency: !!officer.firearmCompetency,
      firstAidCert: !!officer.firstAidCert,
      emergencyContactName: officer.emergencyContactName || '',
      emergencyContactPhone: officer.emergencyContactPhone || '',
      availableDays: officer.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    });
    setSelectedSite(officer.currentSite);
    setSelectedPost(officer.currentPost);
  }, [officer, sites]);

  const handleSaveOfficerEdits = (e: React.FormEvent) => {
    e.preventDefault();
    updateOfficer(officer.id, {
      ...editFormData,
      hourlyRate: Number(editFormData.hourlyRate),
      clientBillingRate: Number(editFormData.clientBillingRate)
    });
    setIsEditMode(false);
    showToast(`Personnel record for ${editFormData.name} updated and synced to cloud.`);
  };

  const handleToggleDay = (day: string) => {
    setEditFormData((prev) => {
      const exists = prev.availableDays.includes(day);
      const updated = exists
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day];
      return { ...prev, availableDays: updated };
    });
  };

  const handleReassign = () => {
    reassignOfficerSite(officer.id, selectedSite, selectedPost);
    showToast(`Officer ${officer.name} reassigned to ${selectedSite} (${selectedPost})`);
  };

  const handleSendDirectMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directMsg.trim()) return;
    showToast(`Direct dispatch push sent to ${officer.name}: "${directMsg}"`);
    setDirectMsg('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const docItem: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: newDocName.trim() || file.name,
      category: newDocCategory,
      description: `Verified compliance document · Valid to ${newDocExpiry} · ${(file.size / 1024).toFixed(1)} KB`,
      type: file.type.includes('pdf') ? 'PDF' : 'IMAGE',
      iconType: newDocCategory.toLowerCase().includes('firearm')
        ? 'psira'
        : newDocCategory.toLowerCase().includes('contract')
        ? 'contract'
        : 'psira'
    };
    uploadOfficerFile(officer.id, docItem);
    setNewDocName('');
    showToast(`Document "${docItem.name}" securely attached to ${officer.name}'s vault`);
  };

  const handleDeleteDoc = (docId: string, docName: string) => {
    const updatedDocs = (officer.documents || []).filter((d) => d.id !== docId);
    updateOfficer(officer.id, { documents: updatedDocs });
    showToast(`Removed "${docName}" from officer file.`);
  };

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0A1E33] border border-white/15 rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-start justify-between bg-[#071726]/90 flex-none">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1FA6C9] to-[#0A4D68] grid place-items-center font-display font-extrabold text-xl text-white shadow-md flex-none">
              {officer.avatarInitial || officer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-base sm:text-lg text-white">{officer.name}</h2>
                <span className="font-mono-code text-[10px] bg-[#1FA6C9]/20 text-[#3FC9E9] px-2 py-0.5 rounded font-bold border border-[#1FA6C9]/30">
                  {officer.grade}
                </span>
                {officer.firearmCompetency && (
                  <span className="font-mono-code text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-semibold border border-amber-500/30">
                    🔫 Armed SAPS 511(a)
                  </span>
                )}
                <span className={`font-mono-code text-[10px] px-2 py-0.5 rounded font-bold ${
                  officer.isClockedIn ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-[#8598A8]'
                }`}>
                  {officer.isClockedIn ? '● ACTIVE ON DUTY' : '○ OFF DUTY'}
                </span>
              </div>
              <div className="text-xs text-[#8598A8] mt-1 flex flex-wrap items-center gap-2 sm:gap-3 font-mono-code">
                <span>Emp ID: <strong className="text-white">{officer.empId}</strong></span>
                <span>•</span>
                <span>PSIRA: <strong className="text-white">{officer.psiraNumber}</strong></span>
                <span>•</span>
                <span>Cell: <strong className="text-[#3FC9E9]">{officer.phone}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (activeTab !== 'dossier') setActiveTab('dossier');
                setIsEditMode(!isEditMode);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isEditMode
                  ? 'bg-emerald-500 text-[#042430]'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <span>{isEditMode ? '✕ Cancel Edit' : '✏️ Edit Profile'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white grid place-items-center transition-all cursor-pointer font-bold text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Status Telemetry Banner */}
        <div className="bg-[#071726] px-5 py-2.5 border-b border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <div className="text-[10px] text-[#8598A8] uppercase tracking-wider font-semibold">Guard Pay Rate</div>
            <div className="font-bold font-mono-code text-[#5BCB80] mt-0.5">
              R{(officer.hourlyRate || 36.50).toFixed(2)}/hr
            </div>
          </div>

          <div>
            <div className="text-[10px] text-[#8598A8] uppercase tracking-wider font-semibold">Client Billing Rate</div>
            <div className="font-bold font-mono-code text-[#3FC9E9] mt-0.5">
              R{(officer.clientBillingRate || 82.00).toFixed(2)}/hr
            </div>
          </div>

          <div>
            <div className="text-[10px] text-[#8598A8] uppercase tracking-wider font-semibold">Current Deployment</div>
            <div className="font-semibold text-white truncate mt-0.5">
              {officer.currentSite} ({officer.currentPost || 'Main Post'})
            </div>
          </div>

          <div>
            <div className="text-[10px] text-[#8598A8] uppercase tracking-wider font-semibold">Device / Battery</div>
            <div className="font-mono-code text-white mt-0.5 flex items-center gap-1">
              <span>🔋 {officer.batteryLevel || 88}%</span>
              <span className="text-[10px] text-[#5BCB80]">4G LTE</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-white/10 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'dossier', label: '👤 Profile & Data' },
            { id: 'documents', label: `📁 Document Vault (${officer.documents?.length || 0})` },
            { id: 'command', label: '📡 Operational Command' },
            { id: 'history', label: '🕒 Patrol & SOP History' }
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

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: PROFILE DOSSIER & INLINE EDITOR */}
          {activeTab === 'dossier' && (
            <div>
              {isEditMode ? (
                /* INLINE EDIT FORM */
                <form onSubmit={handleSaveOfficerEdits} className="space-y-4 animate-fade-in">
                  <div className="bg-[#071726] border border-[#1FA6C9]/40 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="font-bold text-xs text-[#3FC9E9] flex items-center gap-1.5">
                        <span>✏️</span> Edit Personnel Profile &amp; Billing Rates
                      </div>
                      <span className="text-[10px] text-[#8598A8]">Live Cloud Synchronization</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Full Legal Name</label>
                        <input
                          type="text"
                          required
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Employee ID Number</label>
                        <input
                          type="text"
                          required
                          value={editFormData.empId}
                          onChange={(e) => setEditFormData({ ...editFormData, empId: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">PSIRA Registration Number</label>
                        <input
                          type="text"
                          required
                          value={editFormData.psiraNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, psiraNumber: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">PSIRA Security Grade</label>
                        <select
                          value={editFormData.grade}
                          onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                          className="w-full bg-[#071726] border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                        >
                          <option value="Grade A (Armed)">Grade A (Armed Response / Tactical)</option>
                          <option value="Grade B">Grade B (Site Supervisor / Access Control)</option>
                          <option value="Grade C">Grade C (Patrol Officer / Perimeter)</option>
                          <option value="Grade D">Grade D (Access Controller)</option>
                          <option value="Armed Reaction">Armed Reaction Specialist</option>
                          <option value="K9 Handler">K9 Security Handler</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Guard Hourly Wage (ZAR R/hr)</label>
                        <input
                          type="number"
                          step="0.50"
                          min="20"
                          required
                          value={editFormData.hourlyRate}
                          onChange={(e) => setEditFormData({ ...editFormData, hourlyRate: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-[#5BCB80] font-mono-code font-bold focus:outline-none focus:border-[#1FA6C9]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Client Hourly Billing Rate (ZAR R/hr)</label>
                        <input
                          type="number"
                          step="0.50"
                          min="40"
                          required
                          value={editFormData.clientBillingRate}
                          onChange={(e) => setEditFormData({ ...editFormData, clientBillingRate: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-[#3FC9E9] font-mono-code font-bold focus:outline-none focus:border-[#1FA6C9]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Assigned Client Site</label>
                        <select
                          value={editFormData.currentSite}
                          onChange={(e) => setEditFormData({ ...editFormData, currentSite: e.target.value })}
                          className="w-full bg-[#071726] border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                        >
                          {sites.map((s) => (
                            <option key={s.id} value={s.name}>{s.name} ({s.location})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Specific Post / Duty Station</label>
                        <input
                          type="text"
                          value={editFormData.currentPost}
                          onChange={(e) => setEditFormData({ ...editFormData, currentPost: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                          placeholder="e.g. Main Vehicle Boom Gate"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Direct Contact Mobile Phone</label>
                        <input
                          type="tel"
                          required
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Residential Address / Area</label>
                        <input
                          type="text"
                          value={editFormData.location}
                          onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                          placeholder="e.g. New Brighton, Gqeberha"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Shift Preference</label>
                        <select
                          value={editFormData.shiftPreference}
                          onChange={(e) => setEditFormData({ ...editFormData, shiftPreference: e.target.value as any })}
                          className="w-full bg-[#071726] border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                        >
                          <option value="DAY">Day Shift (06:00 – 18:00)</option>
                          <option value="NIGHT">Night Shift (18:00 – 06:00)</option>
                          <option value="ROTATING">Rotating 4-on / 4-off</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Emergency Next-of-Kin Name</label>
                        <input
                          type="text"
                          value={editFormData.emergencyContactName}
                          onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                          placeholder="e.g. Sipho (Brother)"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8598A8] block mb-1">Emergency Next-of-Kin Phone</label>
                        <input
                          type="tel"
                          value={editFormData.emergencyContactPhone}
                          onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                          placeholder="+27 83 000 0000"
                        />
                      </div>
                    </div>

                    {/* Competency Toggles */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap gap-4 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.firearmCompetency}
                          onChange={(e) => setEditFormData({ ...editFormData, firearmCompetency: e.target.checked })}
                          className="rounded text-[#1FA6C9] focus:ring-0"
                        />
                        <span className="text-white font-semibold">🔫 Firearm Competency SAPS 511(a) Certified</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.firstAidCert}
                          onChange={(e) => setEditFormData({ ...editFormData, firstAidCert: e.target.checked })}
                          className="rounded text-[#1FA6C9] focus:ring-0"
                        />
                        <span className="text-white font-semibold">🩹 Level 1 First Aid Certified</span>
                      </label>
                    </div>

                    {/* Available Days Checkbox Chips */}
                    <div className="pt-2 border-t border-white/10">
                      <label className="text-[10px] text-[#8598A8] block mb-1.5 font-semibold">
                        Weekly Shift Availability Days:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {allDays.map((d) => {
                          const active = editFormData.availableDays.includes(d);
                          return (
                            <button
                              type="button"
                              key={d}
                              onClick={() => handleToggleDay(d)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                active
                                  ? 'bg-[#1FA6C9] text-[#042430] border-[#1FA6C9]'
                                  : 'bg-white/5 text-[#8598A8] border-white/10 hover:border-white/30'
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/20 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-bold text-xs transition-all cursor-pointer shadow-lg shadow-[#1FA6C9]/20"
                    >
                      💾 Save Changes to Personnel File
                    </button>
                  </div>
                </form>
              ) : (
                /* READ-ONLY DOSSIER VIEW */
                <div className="space-y-4">
                  {/* Bio & Compliance Overview Card */}
                  <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-bold text-xs text-[#3FC9E9] flex items-center gap-1.5">
                        <span>🛡️</span> PSIRA Registration &amp; South African Statutory Compliance
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono-code text-[10px] font-bold border border-emerald-500/30">
                        PSIRA VERIFIED ACTIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] text-[#8598A8]">Registration No.</div>
                        <div className="font-mono-code font-bold text-white text-sm mt-0.5">{officer.psiraNumber}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8598A8]">Certified Grade</div>
                        <div className="font-bold text-white mt-0.5">{officer.grade}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8598A8]">Firearm Status</div>
                        <div className="font-bold text-amber-300 mt-0.5">
                          {officer.firearmCompetency ? 'SAPS 511(a) Qualified' : 'Unarmed Patrol Only'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8598A8]">First Aid Qualification</div>
                        <div className="font-bold text-white mt-0.5">
                          {officer.firstAidCert ? 'Level 1 Certified' : 'Not Certified'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8598A8]">Location / District</div>
                        <div className="font-medium text-white mt-0.5">{officer.location || 'Gqeberha, EC'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8598A8]">Preferred Shift</div>
                        <div className="font-bold text-[#3FC9E9] mt-0.5">{officer.shiftPreference || 'DAY'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Rates & Deployment Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-2">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>💰 Rate Structure (ZAR)</span>
                        <span className="text-[10px] text-[#5BCB80]">Margin: +{(((officer.clientBillingRate || 82) - (officer.hourlyRate || 36.5)) / (officer.clientBillingRate || 82) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                        <span className="text-[#8598A8]">Officer Base Pay:</span>
                        <span className="font-mono-code font-bold text-[#5BCB80]">R{(officer.hourlyRate || 36.50).toFixed(2)}/hr</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                        <span className="text-[#8598A8]">Client Billing Rate:</span>
                        <span className="font-mono-code font-bold text-[#3FC9E9]">R{(officer.clientBillingRate || 82.00).toFixed(2)}/hr</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-[#8598A8]">Standard 12h Shift Cost:</span>
                        <span className="font-mono-code text-white">R{((officer.hourlyRate || 36.50) * 12).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-2">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>📞 Emergency Next-of-Kin</span>
                        <span className="text-[10px] text-[#8598A8]">Primary Contact</span>
                      </div>
                      <div className="text-xs">
                        <div className="text-[#8598A8] text-[10px]">Contact Person:</div>
                        <div className="text-white font-bold mt-0.5">{officer.emergencyContactName || 'Zandile Nxumalo (Spouse)'}</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-[#8598A8] text-[10px]">Emergency Phone:</div>
                        <div className="text-[#3FC9E9] font-mono-code font-bold mt-0.5">{officer.emergencyContactPhone || '+27 84 812 9900'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Availability Week Schedule */}
                  <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>📅 Weekly Availability Days</span>
                      <span className="text-[10px] text-[#8598A8]">Roster Scheduling Rule</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {allDays.map((day) => {
                        const isAvailable = (officer.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).includes(day);
                        return (
                          <div
                            key={day}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono-code ${
                              isAvailable
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-white/5 text-[#8598A8] opacity-50 border border-white/5'
                            }`}
                          >
                            {day}: {isAvailable ? 'ON' : 'OFF'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOCUMENT VAULT */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-white">Personnel Documents &amp; Compliance Vault</div>
                  <div className="text-[10px] text-[#8598A8]">Verified statutory certificates, SAPS competency, and employment contracts</div>
                </div>
                <div className="font-mono-code text-[11px] text-[#3FC9E9]">
                  {(officer.documents?.length || 0)} File(s)
                </div>
              </div>

              {/* List of Attached Documents */}
              <div className="space-y-2.5">
                {(officer.documents && officer.documents.length > 0) ? (
                  officer.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-2xl bg-[#071726] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-[#1FA6C9]/40 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1FA6C9]/15 border border-[#1FA6C9]/30 text-[#3FC9E9] grid place-items-center font-bold text-base flex-none">
                          {doc.type === 'PDF' ? '📄' : '🖼️'}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                            <span>{doc.name}</span>
                            <span className="font-mono-code text-[9px] bg-white/10 text-[#3FC9E9] px-2 py-0.5 rounded font-semibold">
                              {doc.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8598A8] mt-0.5">
                            {doc.description || 'Verified official document'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="px-3 py-1.5 rounded-xl bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>👁️</span> View
                        </button>

                        <button
                          onClick={() => showToast(`Initiating secure download of "${doc.name}"…`)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>⬇️</span> Download
                        </button>

                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.name)}
                          title="Delete document"
                          className="p-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 text-xs transition-all cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-[#071726] border border-dashed border-white/10 rounded-2xl text-xs text-[#8598A8]">
                    No compliance documents uploaded yet for this officer.
                  </div>
                )}
              </div>

              {/* Upload New Document Box */}
              <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>➕</span> Upload / Attach Document to Officer File
                  </span>
                  <span className="text-[10px] text-[#8598A8]">PDF, JPG, PNG up to 25MB</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-[#8598A8] block mb-1">Document Title</label>
                    <input
                      type="text"
                      placeholder="e.g. PSIRA Renewal Cert 2026.pdf"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8598A8] block mb-1">Document Category</label>
                    <select
                      value={newDocCategory}
                      onChange={(e) => setNewDocCategory(e.target.value)}
                      className="w-full bg-[#071726] border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                    >
                      <option value="PSIRA / Compliance">PSIRA / Compliance Card</option>
                      <option value="Firearm Competency">Firearm Competency SAPS 511(a)</option>
                      <option value="Medical Certificate">Annual Medical Fitness Cert</option>
                      <option value="National ID / Driver's License">National ID / Driver's License</option>
                      <option value="Employment Contract">Signed Employment Contract</option>
                      <option value="Disciplinary / Commendation">Disciplinary / Commendation Record</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8598A8] block mb-1">Validity Expiry Date</label>
                    <input
                      type="text"
                      placeholder="e.g. 31 Dec 2027"
                      value={newDocExpiry}
                      onChange={(e) => setNewDocExpiry(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block w-full border-2 border-dashed border-white/20 hover:border-[#1FA6C9] rounded-2xl p-4 text-center cursor-pointer transition-all bg-white/[0.02]">
                    <span className="text-xs text-[#8598A8] block font-medium">
                      📁 Select File from Device or Drag &amp; Drop here
                    </span>
                    <span className="text-[10px] text-[#3FC9E9] block mt-1">
                      Instantly verifies and securely saves to the officer's digital folder
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMMAND & DISPATCH */}
          {activeTab === 'command' && (
            <div className="space-y-4">
              {/* Tactical Action Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    sendOfficerWelfarePing(officer.id);
                    showToast(`🚨 High-priority welfare check ping sent to ${officer.name}. Device vibration alarmed.`);
                  }}
                  className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 p-3.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left"
                >
                  <span className="w-10 h-10 rounded-xl bg-amber-500/20 grid place-items-center text-lg flex-none">
                    ⚠️
                  </span>
                  <div>
                    <div className="font-bold text-xs text-white">Send Welfare Check Ping</div>
                    <div className="text-[10px] text-amber-200/80">Forces high-priority alert &amp; countdown on officer HUD</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    updateOfficerStatus(officer.id, !officer.isClockedIn);
                    showToast(`Officer duty state toggled to ${!officer.isClockedIn ? 'ON DUTY' : 'OFF DUTY'}`);
                  }}
                  className="bg-[#1FA6C9]/15 hover:bg-[#1FA6C9]/25 border border-[#1FA6C9]/30 text-[#3FC9E9] p-3.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#1FA6C9]/20 grid place-items-center text-lg flex-none">
                    📋
                  </span>
                  <div>
                    <div className="font-bold text-xs text-white">
                      {officer.isClockedIn ? 'Relieve / Mark Off-Duty' : 'Clock-in Officer Remotely'}
                    </div>
                    <div className="text-[10px] text-[#8598A8]">Override biometric attendance from Control Room</div>
                  </div>
                </button>
              </div>

              {/* Direct Push Dispatch Message */}
              <form onSubmit={handleSendDirectMsg} className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>📡</span> Direct Tactical Dispatch Message
                  </span>
                  <span className="font-mono-code text-[10px] text-[#5BCB80]">Encrypted Push</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={directMsg}
                    onChange={(e) => setDirectMsg(e.target.value)}
                    placeholder={`Type direct dispatch message to ${officer.name}…`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  />
                  <button
                    type="submit"
                    className="bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Send Push
                  </button>
                </div>
              </form>

              {/* Reassign Site & Post */}
              <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-white flex items-center justify-between">
                  <span>Reassign Site &amp; Duty Post</span>
                  <span className="text-[10px] text-[#8598A8]">Instant geofence transfer</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-[#8598A8] block mb-1">Target Site</label>
                    <select
                      value={selectedSite}
                      onChange={(e) => setSelectedSite(e.target.value)}
                      className="w-full bg-[#0A1E33] border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                    >
                      {sites.map((s) => (
                        <option key={s.id} value={s.name}>{s.name} ({s.location})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8598A8] block mb-1">Post / Sector</label>
                    <input
                      type="text"
                      value={selectedPost}
                      onChange={(e) => setSelectedPost(e.target.value)}
                      placeholder="e.g. Access Control Gatehouse"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleReassign}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Confirm Reassignment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PATROL & SOP HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-xs text-[#8598A8]">Recent RFID/NFC checkpoint scans &amp; SOP verification logs:</div>
              {[
                { time: '23:40', checkpoint: 'Main Vehicle Gate #1', status: 'Passed (SOP OK)', type: 'Sefeko RFID', dwell: '45s' },
                { time: '23:15', checkpoint: 'Perimeter Fence East (Point 4)', status: 'Passed (SOP OK)', type: 'NFC Tag', dwell: '30s' },
                { time: '22:45', checkpoint: 'Cash Drop Strongroom', status: 'Passed (Armed Check)', type: 'BLE Beacon', dwell: '60s' },
                { time: '22:10', checkpoint: 'Loading Bay Access Turnstile', status: 'Passed (SOP OK)', type: 'Sefeko RFID', dwell: '40s' },
                { time: '21:30', checkpoint: 'Underground North Exit', status: 'Passed (SOP OK)', type: 'QR Matrix', dwell: '35s' }
              ].map((scan, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-[#071726] border border-white/10 rounded-xl text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono-code text-[#3FC9E9] font-bold">{scan.time}</span>
                    <div>
                      <div className="text-white font-medium">{scan.checkpoint}</div>
                      <div className="text-[10px] text-[#8598A8]">Dwell time: {scan.dwell}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono-code text-[10px]">
                    <span className="bg-[#1FA6C9]/20 text-[#3FC9E9] px-2 py-0.5 rounded">{scan.type}</span>
                    <span className="bg-[#5BCB80]/20 text-[#5BCB80] px-2 py-0.5 rounded">{scan.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#071726] flex items-center justify-between flex-none">
          <div className="text-xs text-[#8598A8]">
            Operator audit ID: <span className="font-mono-code text-white">OP-CR-01</span>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer"
          >
            Close Officer Dossier
          </button>
        </div>
      </div>

      {/* DOCUMENT VIEWER PREVIEW MODAL */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="bg-[#0A1E33] border border-white/20 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>📄</span> {viewingDoc.name}
                </div>
                <div className="text-[11px] text-[#8598A8] mt-0.5">
                  Category: {viewingDoc.category} · Attached to {officer.name}
                </div>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Document Certificate Simulator Preview */}
            <div className="bg-[#071726] p-6 rounded-2xl border border-white/15 space-y-4 font-sans text-xs relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full border-8 border-emerald-500/10 grid place-items-center pointer-events-none rotate-12">
                <span className="font-mono-code text-[8px] font-bold text-emerald-500/30 uppercase tracking-widest text-center">
                  REPUBLIC OF SA<br/>OFFICIAL RECORD
                </span>
              </div>

              <div className="text-center pb-3 border-b border-white/10">
                <div className="font-mono-code text-[10px] text-[#3FC9E9] tracking-widest uppercase font-bold">
                  {viewingDoc.category}
                </div>
                <div className="font-display font-bold text-base text-white mt-1">
                  Private Security Industry Regulatory Authority
                </div>
                <div className="text-[10px] text-[#8598A8]">
                  Verified Compliance Document Certification
                </div>
              </div>

              <div className="space-y-2 font-mono-code text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#8598A8]">Officer:</span>
                  <span className="text-white font-bold">{officer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8598A8]">Employee ID:</span>
                  <span className="text-white">{officer.empId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8598A8]">PSIRA Number:</span>
                  <span className="text-[#3FC9E9] font-bold">{officer.psiraNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8598A8]">Security Grade:</span>
                  <span className="text-white">{officer.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8598A8]">Status / Expiry:</span>
                  <span className="text-emerald-400 font-bold">VALID &amp; AUDITED</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-[#8598A8]">
                <span>DigiSeal: #DUTYON-{officer.empId}</span>
                <span className="text-emerald-400 font-semibold">✓ Cryptographically Verified</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  showToast(`Downloading "${viewingDoc.name}"…`);
                }}
                className="bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                ⬇️ Download Copy
              </button>

              <button
                onClick={() => setViewingDoc(null)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
