import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { DocumentItem } from '../../types/dutyon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    officer,
    activeOfficerRecord,
    updateOfficer,
    uploadOfficerFile,
    sites,
    showToast
  } = useDutyOn();

  const [activeTab, setActiveTab] = useState<'profile' | 'psira' | 'documents' | 'security'>('profile');

  // Form State initialized from active officer record or mobile state
  const [formData, setFormData] = useState({
    name: activeOfficerRecord?.name || officer.name || '',
    empId: activeOfficerRecord?.empId || officer.empId || '',
    phone: activeOfficerRecord?.phone || officer.phone || '+27 82 491 8021',
    email: activeOfficerRecord?.email || officer.email || '',
    location: activeOfficerRecord?.location || officer.location || 'Provincial Government Office Complex, Beaufort West',
    currentSite: activeOfficerRecord?.currentSite || officer.currentSite || 'Provincial Office',
    currentPost: activeOfficerRecord?.currentPost || officer.currentPost || 'Main Security Post',
    emergencyContactName: activeOfficerRecord?.emergencyContactName || '',
    emergencyContactPhone: activeOfficerRecord?.emergencyContactPhone || '',
    psiraNumber: activeOfficerRecord?.psiraNumber || officer.psiraNumber || '',
    grade: activeOfficerRecord?.grade || officer.grade || 'Grade C',
    firearmCompetency: Boolean(activeOfficerRecord?.firearmCompetency),
    firstAidCert: Boolean(activeOfficerRecord?.firstAidCert),
    pinCode: '1234'
  });

  // New Document Upload State
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('PSIRA / Compliance');
  const [newDocDesc, setNewDocDesc] = useState('Verified · Exp: Dec 2027');

  useEffect(() => {
    if (activeOfficerRecord) {
      setFormData((prev) => ({
        ...prev,
        name: activeOfficerRecord.name,
        empId: activeOfficerRecord.empId,
        phone: activeOfficerRecord.phone,
        email: activeOfficerRecord.email,
        location: activeOfficerRecord.location,
        currentSite: activeOfficerRecord.currentSite,
        currentPost: activeOfficerRecord.currentPost,
        emergencyContactName: activeOfficerRecord.emergencyContactName || '',
        emergencyContactPhone: activeOfficerRecord.emergencyContactPhone || '',
        psiraNumber: activeOfficerRecord.psiraNumber,
        grade: activeOfficerRecord.grade,
        firearmCompetency: Boolean(activeOfficerRecord.firearmCompetency),
        firstAidCert: Boolean(activeOfficerRecord.firstAidCert)
      }));
    }
  }, [activeOfficerRecord]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeOfficerRecord) {
      updateOfficer(activeOfficerRecord.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        location: formData.location,
        currentSite: formData.currentSite,
        currentPost: formData.currentPost,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        psiraNumber: formData.psiraNumber,
        grade: formData.grade,
        firearmCompetency: formData.firearmCompetency,
        firstAidCert: formData.firstAidCert
      });
    }
    showToast('✓ Personal profile & credentials updated successfully');
    onClose();
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: newDocName.endsWith('.pdf') ? newDocName : `${newDocName}.pdf`,
      category: newDocCategory,
      description: newDocDesc,
      type: 'PDF',
      iconType: newDocCategory.includes('PSIRA') ? 'psira' : newDocCategory.includes('ID') ? 'id' : 'contract',
      verifiedAt: 'Today',
      verifiedBy: 'Self / Officer Portal'
    };

    if (activeOfficerRecord) {
      uploadOfficerFile(activeOfficerRecord.id, newDoc);
      showToast(`Document "${newDoc.name}" uploaded to officer vault`);
      setNewDocName('');
    }
  };

  const documents = activeOfficerRecord?.documents || [];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0A1E33] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#071726]/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1FA6C9]/20 border border-[#1FA6C9]/30 text-[#3FC9E9] grid place-items-center text-xl flex-none shadow-sm">
              👤
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-white leading-tight">
                Personal Profile &amp; Credential Manager
              </h2>
              <div className="text-xs text-[#8598A8] flex items-center gap-2 mt-0.5">
                <span>{formData.name}</span>
                <span>•</span>
                <span className="font-mono-code text-[#3FC9E9]">ID: {formData.empId}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-[#8598A8] hover:text-white grid place-items-center text-xs transition-all cursor-pointer flex-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-[#081B2E] px-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'profile', label: 'Personal Info', icon: '👤' },
            { id: 'psira', label: 'PSIRA & Certs', icon: '🛡️' },
            { id: 'documents', label: `Documents (${documents.length})`, icon: '📑' },
            { id: 'security', label: 'Security & PIN', icon: '🔒' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#1FA6C9] text-[#3FC9E9] font-bold'
                  : 'border-transparent text-[#8598A8] hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] text-[#8598A8] block mb-1 font-semibold">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#051320] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8598A8] block mb-1 font-semibold">Employee / Guard ID</label>
                  <input
                    type="text"
                    value={formData.empId}
                    disabled
                    className="w-full bg-[#051320]/60 border border-white/10 rounded-xl px-3 py-2 text-[#8598A8] font-mono-code cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8598A8] block mb-1 font-semibold">Mobile Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#051320] border border-white/15 rounded-xl px-3 py-2 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8598A8] block mb-1 font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#051320] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8598A8] block mb-1 font-semibold">Residential Area / Suburb</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-[#051320] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8598A8] block mb-1 font-semibold">Assigned Post</label>
                  <input
                    type="text"
                    value={formData.currentPost}
                    onChange={(e) => setFormData({ ...formData, currentPost: e.target.value })}
                    className="w-full bg-[#051320] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                  />
                </div>
              </div>

              {/* Emergency Contact Block */}
              <div className="bg-[#051320] border border-white/10 rounded-2xl p-3.5 space-y-3 mt-4">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span className="text-rose-400">🚨</span>
                  <span>Next of Kin / Emergency Contact</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#8598A8] block mb-1">Contact Name &amp; Relationship</label>
                    <input
                      type="text"
                      placeholder="e.g. Sipho (Brother)"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#8598A8] block mb-1">Emergency Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+27 82 000 0000"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-2 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-display font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-[#1FA6C9]/20"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PSIRA & CERTIFICATES */}
          {activeTab === 'psira' && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#051320] border border-[#1FA6C9]/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <div className="font-display font-bold text-sm text-white">
                        Private Security Industry Regulatory Authority
                      </div>
                      <div className="text-[10px] text-[#8598A8] font-mono-code">PSIRA REPUBLIC OF SOUTH AFRICA</div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#5BCB80]/15 text-[#5BCB80] border border-[#5BCB80]/30">
                    ✓ Verified Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] text-[#8598A8] block mb-1 font-semibold">PSIRA Registration Number</label>
                    <input
                      type="text"
                      value={formData.psiraNumber}
                      onChange={(e) => setFormData({ ...formData, psiraNumber: e.target.value })}
                      className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-2 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#8598A8] block mb-1 font-semibold">PSIRA Security Grade</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#1FA6C9] cursor-pointer"
                    >
                      <option value="Grade A">Grade A (Site Commander / Management)</option>
                      <option value="Grade A (Armed)">Grade A (Armed Response / Tactical)</option>
                      <option value="Grade B">Grade B (Access Supervisor)</option>
                      <option value="Grade C">Grade C (Access Control Guard)</option>
                      <option value="Grade D">Grade D (Static Guard)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.firearmCompetency}
                      onChange={(e) => setFormData({ ...formData, firearmCompetency: e.target.checked })}
                      className="rounded text-[#1FA6C9] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="font-semibold text-white">SAPS Firearm Competency</div>
                      <div className="text-[10px] text-[#8598A8]">Certified for handgun / shotgun business carry</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.firstAidCert}
                      onChange={(e) => setFormData({ ...formData, firstAidCert: e.target.checked })}
                      className="rounded text-[#1FA6C9] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="font-semibold text-white">First Aid &amp; Fire Safety Level 1</div>
                      <div className="text-[10px] text-[#8598A8]">Accredited emergency response certificate</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-display font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Update PSIRA Information
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS & VAULT */}
          {activeTab === 'documents' && (
            <div className="space-y-4 text-xs">
              {/* Document List */}
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-[#051320] border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 grid place-items-center text-sm flex-none">
                        📄
                      </div>
                      <div>
                        <div className="font-semibold text-white">{doc.name}</div>
                        <div className="text-[11px] text-[#8598A8] flex items-center gap-2 mt-0.5">
                          <span>{doc.category}</span>
                          <span>•</span>
                          <span>{doc.description || 'Verified on file'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-none">
                      Verified
                    </span>
                  </div>
                ))}

                {documents.length === 0 && (
                  <div className="py-8 text-center text-[#8598A8] bg-[#051320] rounded-2xl border border-white/10">
                    No compliance documents attached yet.
                  </div>
                )}
              </div>

              {/* Upload New Document Form */}
              <form onSubmit={handleAddDocument} className="bg-[#051320] border border-white/10 rounded-2xl p-3.5 space-y-3">
                <div className="font-semibold text-white flex items-center gap-2">
                  <span>📎</span>
                  <span>Upload Certificate or ID Copy</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Document title (e.g. PSIRA Card 2026)"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  />

                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value)}
                    className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9] cursor-pointer"
                  >
                    <option value="PSIRA / Compliance">PSIRA / Compliance Card</option>
                    <option value="Identity">Certified ID Document</option>
                    <option value="Firearm Competency">SAPS Firearm Competency</option>
                    <option value="Medical">Annual Medical Clearance</option>
                    <option value="Training">Training &amp; SOP Certificate</option>
                  </select>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] border border-[#1FA6C9]/30 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>+ Add Document to Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SECURITY & PIN */}
          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#051320] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <span>🔒</span>
                  <span>Officer Badge Login PIN</span>
                </div>
                <p className="text-[#8598A8] text-xs">
                  Set your 4-digit mobile station PIN for fast biometric badge clock-ins on shift.
                </p>

                <div className="max-w-xs">
                  <label className="text-[11px] text-[#8598A8] block mb-1 font-semibold">4-Digit Access PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-2 text-white font-mono-code text-center text-lg tracking-widest focus:outline-none focus:border-[#1FA6C9]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => showToast('✓ Mobile Security PIN saved')}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Update PIN Code
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#071726] flex items-center justify-between text-xs text-[#8598A8]">
          <span>Synced with Master PSIRA Registry &amp; Central Database</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
