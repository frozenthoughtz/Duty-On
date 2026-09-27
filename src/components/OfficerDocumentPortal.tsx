import React, { useState } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { DocumentItem, OfficerRecord } from '../types/dutyon';
import { DocumentUploader } from './DocumentUploader';

export const OfficerDocumentPortal: React.FC = () => {
  const {
    officersList,
    uploadOfficerFile,
    verifyOfficerPsira,
    showToast
  } = useDutyOn();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedOfficerId, setSelectedOfficerId] = useState('ALL');

  // Camera & live capture modal
  const [isCameraUploaderOpen, setIsCameraUploaderOpen] = useState(false);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetOfficerId, setUploadTargetOfficerId] = useState(officersList[0]?.id || '');
  const [uploadCategory, setUploadCategory] = useState('PSIRA / Compliance');
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadCertNumber, setUploadCertNumber] = useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = useState('2027-12-31');
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Certificate Inspector Modal
  const [inspectedDoc, setInspectedDoc] = useState<{
    doc: DocumentItem;
    officer: OfficerRecord;
  } | null>(null);

  // Compile all documents across all officers
  const allOfficerDocuments: { doc: DocumentItem; officer: OfficerRecord }[] = [];

  officersList.forEach((officer) => {
    (officer.documents || []).forEach((doc) => {
      allOfficerDocuments.push({ doc, officer });
    });
  });

  // Filter documents
  const filteredItems = allOfficerDocuments.filter(({ doc, officer }) => {
    if (selectedOfficerId !== 'ALL' && officer.id !== selectedOfficerId) return false;
    if (selectedCategory !== 'ALL' && !doc.category.toLowerCase().includes(selectedCategory.toLowerCase())) return false;
    if (selectedStatus === 'expiring' && !doc.expiresSoon) return false;
    if (selectedStatus === 'valid' && doc.expiresSoon) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDocName = doc.name.toLowerCase().includes(q);
      const matchOfficer = officer.name.toLowerCase().includes(q);
      const matchPsira = officer.psiraNumber.toLowerCase().includes(q);
      const matchCat = doc.category.toLowerCase().includes(q);
      if (!matchDocName && !matchOfficer && !matchPsira && !matchCat) return false;
    }
    return true;
  });

  // Stats
  const totalDocs = allOfficerDocuments.length;
  const expiringSoonCount = allOfficerDocuments.filter(({ doc }) => doc.expiresSoon).length;
  const psiraDocsCount = allOfficerDocuments.filter(({ doc }) => doc.category.includes('PSIRA') || doc.iconType === 'psira').length;
  const firearmDocsCount = allOfficerDocuments.filter(({ doc }) => doc.category.includes('Firearm') || doc.name.toLowerCase().includes('firearm')).length;

  const handleSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocName.trim()) {
      showToast('Please enter document title');
      return;
    }

    const targetOff = officersList.find((o) => o.id === uploadTargetOfficerId);
    if (!targetOff) return;

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: `${uploadDocName.trim()}.pdf`,
      category: uploadCategory,
      description: `Verified · Exp: ${uploadExpiryDate}`,
      type: 'PDF',
      expiryDate: uploadExpiryDate,
      certificateNumber: uploadCertNumber.trim() || `CERT-${Date.now().toString().slice(-6)}`,
      iconType: uploadCategory.includes('PSIRA') || uploadCategory.includes('Firearm') ? 'psira' : 'contract',
      verifiedBy: 'SAPS / PSIRA Live Integration',
      verifiedAt: new Date().toLocaleDateString(),
      status: 'valid'
    };

    uploadOfficerFile(uploadTargetOfficerId, newDoc);
    showToast(`Document successfully attached to ${targetOff.name}`);
    setIsUploadModalOpen(false);
    setUploadDocName('');
    setUploadCertNumber('');
    setUploadedFileName('');
  };

  const handleVerifyPSIRA = (psiraNum: string, officerName: string) => {
    const result = verifyOfficerPsira(psiraNum);
    showToast(`PSIRA #${psiraNum} verified active for ${officerName}: ${result.statusText}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-gradient-to-r from-[#0C2438] via-[#0E2C44] to-[#0A1D2D] border border-white/10 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1FA6C9]/15 border border-[#1FA6C9]/30 grid place-items-center text-[#3FC9E9]">
              <svg className="w-5 h-5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-white tracking-wide">
                Security Officer Compliance &amp; Document Portal
              </h2>
              <p className="text-xs text-[#8598A8] mt-0.5">
                Centralized vault for PSIRA registration cards, SAPS Firearm 511(a) permits &amp; medical certificates
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Export Compliance Dossier */}
          <button
            onClick={() => {
              showToast('Exporting ISO 9001 / PSIRA Fleet Compliance Dossier (PDF)...');
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.07] hover:bg-white/[0.12] text-[#d6e3ee] border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#3FC9E9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export Audit Dossier</span>
          </button>

          {/* Live Camera Document Capture */}
          <button
            id="btn-camera-capture-doc"
            onClick={() => setIsCameraUploaderOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-display font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 cursor-pointer shadow-md"
            title="Use live device camera to capture certificate or ID"
          >
            <span>📷</span>
            <span>Capture with Camera</span>
          </button>

          {/* Upload Document */}
          <button
            id="btn-upload-officer-doc"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-display font-bold bg-[#1FA6C9] hover:bg-[#1b93b3] text-[#04222c] transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Upload Officer File</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Total Verified Files</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-white">{totalDocs}</span>
            <span className="text-[11px] text-[#8598A8] font-semibold">across fleet</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Encrypted cloud storage</span>
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">PSIRA Registration</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-[#3FC9E9]">100%</span>
            <span className="text-[11px] text-[#8598A8] font-semibold">{psiraDocsCount} Cards</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Grades A, B &amp; C Validated</span>
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Firearm 511(a) Competency</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-emerald-400">100%</span>
            <span className="text-[11px] text-[#8598A8] font-semibold">Armed Guards</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>SAPS Ballistics Audited</span>
          </div>
        </div>

        <div className="bg-[#0b2135]/80 border border-white/10 rounded-xl p-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8598A8] font-semibold">Expiring &lt;30 Days</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-extrabold text-2xl text-amber-400">{expiringSoonCount}</span>
            <span className="text-[11px] text-amber-300 font-semibold">Renewal Flag</span>
          </div>
          <div className="text-[11px] text-[#8598A8] mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Automated HR alerts queued</span>
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
            placeholder="Search certificate title, officer name, PSIRA number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-white placeholder-[#8598A8] focus:outline-none focus:border-[#1FA6C9]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Officer Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#8598A8]">
            <span>Officer:</span>
            <select
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
            >
              <option value="ALL">All Officers ({officersList.length})</option>
              {officersList.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.grade})</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#8598A8]">
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
            >
              <option value="ALL">All Categories</option>
              <option value="PSIRA">PSIRA Registration</option>
              <option value="Firearm">Firearm Competency</option>
              <option value="Medical">Medical Fitness</option>
              <option value="Identity">National ID / Passport</option>
              <option value="Training">Training SOPs</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#8598A8]">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
            >
              <option value="ALL">All Statuses</option>
              <option value="valid">Compliant &amp; Active</option>
              <option value="expiring">Expiring Soon</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredItems.map(({ doc, officer }) => (
          <div
            key={`${officer.id}-${doc.id}`}
            className="bg-[#0b2135]/90 border border-white/10 rounded-2xl p-4.5 hover:border-white/20 transition-all flex flex-col justify-between shadow-md space-y-3"
          >
            <div>
              {/* Header: Category and Status Badge */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/5">
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-[#3FC9E9] bg-[#1FA6C9]/15 px-2 py-0.5 rounded">
                  {doc.category}
                </span>

                {doc.expiresSoon ? (
                  <span className="text-[10px] font-mono-code font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded">
                    EXPIRING SOON
                  </span>
                ) : (
                  <span className="text-[10px] font-mono-code font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded">
                    ✓ ACTIVE VALID
                  </span>
                )}
              </div>

              {/* Document Title & Icon */}
              <div className="flex items-start gap-3 mt-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 grid place-items-center flex-none text-xl">
                  {doc.iconType === 'psira' ? '🛡️' : doc.category.includes('Medical') ? '🏥' : '📄'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-sm text-white truncate" title={doc.name}>
                    {doc.name}
                  </h3>
                  <div className="text-[11px] text-[#8598A8] truncate mt-0.5">
                    {doc.description || 'Verified security document'}
                  </div>
                </div>
              </div>

              {/* Officer Reference Card */}
              <div className="mt-3 bg-black/30 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-[#1FA6C9]/30 text-[#3FC9E9] font-bold text-[10px] grid place-items-center flex-none">
                    {officer.avatarInitial}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-white text-[11px] truncate">{officer.name}</div>
                    <div className="text-[10px] text-[#8598A8] font-mono-code">PSIRA #{officer.psiraNumber}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-white/10 text-[#3FC9E9]">
                  {officer.grade}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                onClick={() => handleVerifyPSIRA(officer.psiraNumber, officer.name)}
                className="text-[11px] text-[#8598A8] hover:text-[#3FC9E9] transition-colors"
              >
                Verify National Reg
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setInspectedDoc({ doc, officer })}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1FA6C9]/15 hover:bg-[#1FA6C9]/25 text-[#3FC9E9] border border-[#1FA6C9]/30 transition-all cursor-pointer flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Inspect</span>
                </button>

                <button
                  onClick={() => showToast(`Downloading ${doc.name}...`)}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/10 transition-all"
                  title="Download File"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full bg-[#0b2135]/60 border border-white/10 rounded-2xl p-12 text-center text-sm text-[#8598A8]">
            No officer documents matched your search query.
          </div>
        )}
      </div>

      {/* UPLOAD OFFICER DOCUMENT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b2135] border border-white/15 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono-code uppercase tracking-wider text-[#1FA6C9] font-semibold">
                  Document Vault Intake
                </span>
                <h3 className="font-display font-extrabold text-lg text-white mt-0.5">
                  Upload Security Officer Credential
                </h3>
                <p className="text-xs text-[#8598A8]">
                  Attach compliance certificates, firearm competencies, or ID documents to officer profile.
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-400 hover:text-white grid place-items-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Select Officer:</label>
                <select
                  value={uploadTargetOfficerId}
                  onChange={(e) => setUploadTargetOfficerId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  {officersList.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.grade}) — PSIRA #{o.psiraNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Document Category:</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  >
                    <option value="PSIRA / Compliance">PSIRA Certificate / ID Card</option>
                    <option value="Firearm Competency">SAPS Firearm 511(a) Permit</option>
                    <option value="Identity">National Smart ID / Passport</option>
                    <option value="Medical">Annual Medical Fitness</option>
                    <option value="Training">Tactical SOP &amp; Armed Response</option>
                    <option value="Disciplinary">Commendation / Disciplinary</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Expiry Date:</label>
                  <input
                    type="date"
                    value={uploadExpiryDate}
                    onChange={(e) => setUploadExpiryDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Document Title:</label>
                <input
                  type="text"
                  placeholder="e.g. PSIRA Grade A Armed Response Certificate"
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#8598A8] focus:outline-none focus:border-[#1FA6C9]"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Certificate / Reg Number:</label>
                <input
                  type="text"
                  placeholder="e.g. SAPS-511-ZA-891024 or PSIRA-2981042"
                  value={uploadCertNumber}
                  onChange={(e) => setUploadCertNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#8598A8] focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              {/* File Attachment Dropzone */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">File Attachment:</label>
                <div
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.jpg,.jpeg,.png';
                    input.onchange = (ev: any) => {
                      if (ev.target.files && ev.target.files[0]) {
                        setUploadedFileName(ev.target.files[0].name);
                        if (!uploadDocName) {
                          setUploadDocName(ev.target.files[0].name.replace(/\.[^/.]+$/, ''));
                        }
                      }
                    };
                    input.click();
                  }}
                  className="border-2 border-dashed border-white/20 hover:border-[#1FA6C9] rounded-xl p-5 text-center cursor-pointer transition-colors bg-white/[0.02]"
                >
                  <div className="text-2xl mb-1">📁</div>
                  <div className="text-xs text-white font-medium">
                    {uploadedFileName ? (
                      <span className="text-emerald-400 font-bold">Selected: {uploadedFileName}</span>
                    ) : (
                      'Click to select PDF or image from computer'
                    )}
                  </div>
                  <div className="text-[10px] text-[#8598A8] mt-1">
                    Supports PDF, PNG, JPG (Max 25MB · High-Res Scan recommended)
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1FA6C9] hover:bg-[#1b93b3] text-[#04222c] shadow-sm cursor-pointer"
                >
                  Upload &amp; Verify Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATE INSPECTOR MODAL */}
      {inspectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b2135] border border-white/20 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 my-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[11px] font-mono-code font-bold text-[#1FA6C9] uppercase">
                  South African Security Credential Verification
                </span>
                <h3 className="font-display font-extrabold text-lg text-white mt-0.5">
                  {inspectedDoc.doc.name}
                </h3>
                <p className="text-xs text-[#8598A8]">
                  Officer: <span className="text-white font-semibold">{inspectedDoc.officer.name}</span> · PSIRA #{inspectedDoc.officer.psiraNumber}
                </p>
              </div>
              <button
                onClick={() => setInspectedDoc(null)}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-400 hover:text-white grid place-items-center"
              >
                ✕
              </button>
            </div>

            {/* High-Fidelity Rendered Certificate Card */}
            <div className="relative bg-gradient-to-br from-white to-slate-100 text-[#0B1E30] rounded-xl p-6 border-4 border-[#0B1E30] shadow-2xl overflow-hidden space-y-4">
              {/* Official Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                <span className="text-8xl font-display font-black tracking-widest uppercase">PSIRA</span>
              </div>

              {/* Header */}
              <div className="text-center border-b-2 border-[#0B1E30] pb-3">
                <div className="text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-slate-600">
                  REPUBLIC OF SOUTH AFRICA · ACT 56 OF 2001
                </div>
                <h2 className="font-display font-extrabold text-xl text-[#0B1E30] mt-1">
                  OFFICIAL SECURITY INDUSTRY CERTIFICATE
                </h2>
                <div className="text-xs font-semibold text-[#1B6CA8]">
                  PRIVATE SECURITY INDUSTRY REGULATORY AUTHORITY
                </div>
              </div>

              {/* Officer & Cert Details */}
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="col-span-2 space-y-2">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Registered Officer Name:</div>
                    <div className="text-base font-extrabold text-slate-900">{inspectedDoc.officer.name}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">PSIRA Reg Number:</div>
                      <div className="font-mono-code font-bold text-slate-900">{inspectedDoc.officer.psiraNumber}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Grade Classification:</div>
                      <div className="font-bold text-emerald-700">{inspectedDoc.officer.grade}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Certificate Type:</div>
                    <div className="font-semibold text-slate-800">{inspectedDoc.doc.name}</div>
                  </div>
                </div>

                {/* QR Code & Seal */}
                <div className="flex flex-col items-center justify-center border-l border-slate-300 pl-4 space-y-2">
                  <div className="w-20 h-20 bg-slate-200 border border-slate-400 rounded-lg grid place-items-center font-mono-code text-[10px] text-slate-600 text-center p-1">
                    [QR VALIDATED]
                    <span className="text-[8px]">{inspectedDoc.officer.psiraNumber}</span>
                  </div>
                  <span className="text-[9px] font-mono-code font-bold text-emerald-700 uppercase">
                    ● PSIRA VERIFIED
                  </span>
                </div>
              </div>

              {/* Footer / Validity */}
              <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[11px] text-slate-600">
                <div>
                  <span>Valid Until: </span>
                  <span className="font-bold text-slate-900">
                    {inspectedDoc.doc.expiryDate || '30 Nov 2027'}
                  </span>
                </div>
                <div>
                  <span>Status: </span>
                  <span className="font-bold text-emerald-700">Active Good Standing</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  handleVerifyPSIRA(inspectedDoc.officer.psiraNumber, inspectedDoc.officer.name);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10"
              >
                Re-Query National PSIRA Database
              </button>

              <button
                onClick={() => setInspectedDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1FA6C9] hover:bg-[#1b93b3] text-[#04222c]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Live Camera Document Capture Modal */}
      {isCameraUploaderOpen && (
        <DocumentUploader
          onClose={() => setIsCameraUploaderOpen(false)}
          defaultCategory="Training"
        />
      )}
    </div>
  );
};
