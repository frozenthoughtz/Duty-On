import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { MultiSiteItem, SitePost, SiteFile } from '../../types/dutyon';

interface Props {
  site: MultiSiteItem;
  onClose: () => void;
}

export const SiteCommandModal: React.FC<Props> = ({ site, onClose }) => {
  const {
    updateSite,
    lockdownSite,
    dispatchArmedBackupToSite,
    uploadSiteFile,
    officersList,
    setSelectedOfficerForModal,
    showToast
  } = useDutyOn();

  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'officers' | 'files' | 'contacts'>('overview');

  // Filter officers deployed to or assigned to this specific site
  const siteOfficers = officersList.filter((o) => {
    const sName = site.name.toLowerCase();
    const oSite = (o.siteDeployed || '').toLowerCase();
    return oSite.includes(sName) || sName.includes(oSite);
  });
  
  // Edit mode for contacts
  const [clientContact, setClientContact] = useState(site.clientContactName || 'Operations Manager');
  const [clientPhone, setClientPhone] = useState(site.clientPhone || '+27 41 501 8000');
  const [sapsStation, setSapsStation] = useState(site.sapsStation || 'Kwamagxaki SAPS Station');
  const [sapsPhone, setSapsPhone] = useState(site.sapsSectorPhone || '+27 41 405 4700');
  const [armedUnit, setArmedUnit] = useState(site.armedResponseUnit || 'Bravo-4 Tactical Response');

  // New Post state
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [newPostName, setNewPostName] = useState('');
  const [newPostGrade, setNewPostGrade] = useState('Grade C');

  // New File state
  const [newFileName, setNewFileName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState<SiteFile['category']>('floorplan');

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

  const handleSaveContacts = () => {
    updateSite(site.id, {
      clientContactName: clientContact,
      clientPhone,
      sapsStation,
      sapsSectorPhone: sapsPhone,
      armedResponseUnit: armedUnit
    });
    showToast(`Emergency contacts updated for ${site.name}`);
  };

  const handleAddPost = () => {
    if (!newPostName.trim()) return;
    const newPost: SitePost = {
      id: `post-${Date.now()}`,
      name: newPostName.trim(),
      requiredGrade: newPostGrade,
      assignedOfficer: 'Unassigned',
      status: 'vacant'
    };
    const existingPosts = site.posts || [];
    updateSite(site.id, {
      posts: [...existingPosts, newPost],
      officersRequired: site.officersRequired + 1
    });
    setNewPostName('');
    setIsAddingPost(false);
    showToast(`New security post "${newPost.name}" added to ${site.name}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const siteFile: SiteFile = {
      id: `file-${Date.now()}`,
      name: newFileName.trim() || file.name,
      category: newFileCategory,
      uploadedAt: new Date().toLocaleTimeString().slice(0, 5),
      size: `${(file.size / 1024).toFixed(1)} KB`
    };
    uploadSiteFile(site.id, siteFile);
    setNewFileName('');
    showToast(`File "${siteFile.name}" stored in site vault`);
  };

  const handleReassignPost = (postId: string, newOfficerName: string) => {
    const updatedPosts = (site.posts || []).map(p =>
      p.id === postId
        ? { ...p, assignedOfficer: newOfficerName, status: (newOfficerName === 'Unassigned' ? 'vacant' : 'filled') as any }
        : p
    );
    updateSite(site.id, { posts: updatedPosts });
    showToast(`Post updated: ${newOfficerName}`);
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
            <div className="w-12 h-12 rounded-2xl bg-[#1FA6C9]/20 border border-[#1FA6C9]/40 text-[#3FC9E9] grid place-items-center font-display font-extrabold text-2xl shadow-md flex-none">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-bold text-base sm:text-lg text-white">{site.name}</h2>
                <span className={`font-mono-code text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  site.status === 'operational'
                    ? 'bg-[#5BCB80]/15 text-[#5BCB80] border-[#5BCB80]/30'
                    : site.status === 'attention'
                    ? 'bg-[#E7A13A]/15 text-[#E7A13A] border-[#E7A13A]/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}>
                  ● {site.status.toUpperCase()} ({site.compliance}% SLA)
                </span>
              </div>
              <div className="text-xs text-[#8598A8] mt-0.5 flex flex-wrap items-center gap-2 sm:gap-3">
                <span>📍 {site.location}</span>
                <span>•</span>
                <span>Posts: <strong className="text-white font-mono-code">{site.officersPresent} / {site.officersRequired}</strong> filled</span>
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

        {/* Tactical Command Action Bar */}
        <div className="bg-[#071726] p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                lockdownSite(site.id);
                showToast(`🚨 SITE LOCKDOWN ORDER DISPATCHED TO ${site.name.toUpperCase()}`);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-display font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>🔒</span>
              <span>Trigger Site Lockdown</span>
            </button>

            <button
              onClick={() => {
                dispatchArmedBackupToSite(site.id);
                showToast(`🚔 Armed tactical response unit dispatched to ${site.name} (ETA 6 mins)`);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-display font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>🚔</span>
              <span>Dispatch Armed Backup</span>
            </button>
          </div>

          <div className="text-xs text-[#8598A8] font-mono-code flex items-center gap-2">
            <span>Patrol:</span>
            <span className="text-[#3FC9E9]">{site.patrolStatus}</span>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="px-5 pt-3 border-b border-white/10 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Operational Overview' },
            { id: 'posts', label: `Security Posts (${site.posts?.length || site.officersRequired})` },
            { id: 'officers', label: `On-Site Officers (${siteOfficers.length})` },
            { id: 'files', label: `Blueprints & Vault (${site.files?.length || 3})` },
            { id: 'contacts', label: 'Emergency & SAPS Contacts' }
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

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#071726] border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] text-[#8598A8] uppercase tracking-wider">Officers Manning Posts</div>
                  <div className="font-display font-extrabold text-2xl text-white mt-1">
                    {site.officersPresent} <span className="text-sm font-normal text-[#8598A8]">/ {site.officersRequired}</span>
                  </div>
                  <div className="text-[11px] text-[#5BCB80] mt-1">
                    {site.officersPresent >= site.officersRequired ? 'Full Complement' : '1 Post Vacant - Relief Requested'}
                  </div>
                </div>

                <div className="bg-[#071726] border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] text-[#8598A8] uppercase tracking-wider">SLA Patrol Compliance</div>
                  <div className="font-display font-extrabold text-2xl text-[#3FC9E9] mt-1">
                    {site.compliance}%
                  </div>
                  <div className="text-[11px] text-[#8598A8] mt-1">RFID Scans on-schedule</div>
                </div>

                <div className="bg-[#071726] border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] text-[#8598A8] uppercase tracking-wider">Tactical Vehicle</div>
                  <div className="font-display font-bold text-sm text-white mt-2">
                    {site.armedResponseUnit || 'Bravo-4 Tactical Response'}
                  </div>
                  <div className="text-[11px] text-[#5BCB80] mt-1">GPS Geo-Lock 1.8km away</div>
                </div>
              </div>

              {/* Site Notes / Handover */}
              <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="font-bold text-xs text-white flex items-center justify-between">
                  <span>Site Standing Orders &amp; Shift Notes</span>
                  <span className="font-mono-code text-[10px] text-[#3FC9E9]">SOP Valid 2026</span>
                </div>
                <p className="text-xs text-[#9db0c0] leading-relaxed">
                  {site.notes || 'All perimeter fence gates must remain electronically latched from 20:00 to 06:00. Contractor delivery trucks require physical biometric sign-off in the Occurrence Book. Immediate armed supervisor callout required upon any alarm breach.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: POSTS */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-[#8598A8]">
                  Manage active guarding posts and assign personnel:
                </div>
                <button
                  onClick={() => setIsAddingPost(true)}
                  className="bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  + Add New Post
                </button>
              </div>

              {isAddingPost && (
                <div className="bg-[#071726] border border-[#1FA6C9]/40 rounded-2xl p-3.5 space-y-2 animate-fade-in">
                  <div className="font-bold text-xs text-white">Create Security Post</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newPostName}
                      onChange={(e) => setNewPostName(e.target.value)}
                      placeholder="e.g. Cash Receiving Gate 2"
                      className="bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                    />
                    <select
                      value={newPostGrade}
                      onChange={(e) => setNewPostGrade(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                    >
                      <option value="Grade C">Grade C (Patrol / Access)</option>
                      <option value="Grade B">Grade B (Access Control / Supervisor)</option>
                      <option value="Grade A (Armed)">Grade A (Armed Tactical Escort)</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsAddingPost(false)}
                      className="text-xs text-[#8598A8] hover:text-white px-3 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddPost}
                      className="bg-[#3AA655] hover:bg-[#34944c] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all"
                    >
                      Save Post
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {(site.posts || [
                  { id: 'p1', name: 'Main Vehicle Boom Gate', requiredGrade: 'Grade B', assignedOfficer: 'Nomsa Dlamini', status: 'filled' },
                  { id: 'p2', name: 'Pedestrian Turnstiles', requiredGrade: 'Grade C', assignedOfficer: 'Thabo Mokoena', status: 'filled' },
                  { id: 'p3', name: 'Perimeter Fence Patrol', requiredGrade: 'Grade C', assignedOfficer: 'Sipho Nxumalo', status: 'filled' },
                  { id: 'p4', name: 'Vault Escort / Cash Drop', requiredGrade: 'Grade A', assignedOfficer: 'Armed Response Backup', status: 'filled' }
                ]).map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 bg-[#071726] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{post.name}</span>
                        <span className="font-mono-code text-[10px] bg-white/10 text-[#9db0c0] px-1.5 py-0.5 rounded">
                          {post.requiredGrade}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8598A8] mt-0.5">
                        Assigned: <strong className="text-[#3FC9E9]">{post.assignedOfficer}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={post.assignedOfficer}
                        onChange={(e) => handleReassignPost(post.id, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                      >
                        <option value="Unassigned">Unassigned (Vacant)</option>
                        {officersList?.map((o) => (
                          <option key={o.id} value={o.name}>
                            {o.name} ({o.grade})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ON-SITE OFFICERS & GUARDS */}
          {activeTab === 'officers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-xs text-white">
                    Deployed Security Personnel at {site.name}
                  </h4>
                  <p className="text-[11px] text-[#8598A8] mt-0.5">
                    Live biometric telemetry, current shifts, and individual guard profiles. Click any profile to inspect or manage credentials.
                  </p>
                </div>
                <span className="font-mono-code text-xs bg-[#5BCB80]/15 text-[#5BCB80] px-2.5 py-1 rounded-full font-bold">
                  {siteOfficers.length} Assigned Guard{siteOfficers.length === 1 ? '' : 's'}
                </span>
              </div>

              {siteOfficers.length === 0 ? (
                <div className="bg-[#071726] border border-white/10 rounded-2xl p-8 text-center text-[#8598A8]">
                  <span className="text-3xl block mb-2">👮</span>
                  <div className="text-white font-semibold text-xs">No Guards Directly Assigned Yet</div>
                  <p className="text-[11px] mt-1">Assign officers to security posts using the "Security Posts" tab above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {siteOfficers.map((officer) => (
                    <div
                      key={officer.id}
                      onClick={() => {
                        setSelectedOfficerForModal(officer);
                        onClose();
                      }}
                      className="bg-[#071726] border border-white/10 hover:border-[#1FA6C9]/60 rounded-2xl p-3.5 space-y-3 cursor-pointer transition-all hover:scale-[1.01] group shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={officer.photoUrl || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80`}
                            alt={officer.name}
                            className="w-10 h-10 rounded-xl object-cover border border-white/15 group-hover:border-[#1FA6C9] transition-colors"
                          />
                          <div>
                            <div className="font-bold text-xs text-white group-hover:text-[#3FC9E9] transition-colors flex items-center gap-1.5">
                              <span>{officer.name}</span>
                              <span className="font-mono-code text-[10px] bg-white/10 text-[#9db0c0] px-1.5 py-0.2 rounded font-normal">
                                Grade {officer.grade}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#8598A8] font-mono-code mt-0.5">
                              PSIRA: <span className="text-white">{officer.psiraNumber}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-code ${
                          officer.status === 'on_duty'
                            ? 'bg-[#5BCB80]/15 text-[#5BCB80]'
                            : officer.status === 'standby'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-white/10 text-[#8598A8]'
                        }`}>
                          {officer.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.03] p-2 rounded-xl border border-white/5">
                        <div>
                          <span className="text-[#8598A8] block text-[10px]">Shift &amp; Duty:</span>
                          <span className="text-amber-300 font-semibold">
                            {officer.currentShift || 'Day 06:00-18:00'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8598A8] block text-[10px]">Biometric Status:</span>
                          <span className="text-[#5BCB80] font-mono-code">Face Verified ✓</span>
                        </div>
                        <div>
                          <span className="text-[#8598A8] block text-[10px]">Perimeter Geofence:</span>
                          <span className="text-[#3FC9E9] font-mono-code">Inside 18m Geofence</span>
                        </div>
                        <div>
                          <span className="text-[#8598A8] block text-[10px]">Device Battery:</span>
                          <span className="text-white font-mono-code">
                            🔋 {officer.batteryLevel !== undefined ? `${officer.batteryLevel}%` : '94%'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[11px] text-[#8598A8]">
                          Phone: <span className="font-mono-code text-white">{officer.phone}</span>
                        </span>
                        <span className="text-[#1FA6C9] font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                          <span>Inspect Profile</span>
                          <span>→</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FILES & BLUEPRINTS */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="text-xs text-[#8598A8]">
                Site architectural floor plans, gate intercom codes, and key register:
              </div>

              {/* Upload file bar */}
              <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-white">Upload Document / Blueprint</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Document Title (e.g. Master Key Register 2026)"
                    className="bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  />
                  <select
                    value={newFileCategory}
                    onChange={(e) => setNewFileCategory(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                  >
                    <option value="floorplan">Architectural Floorplan / Evacuation</option>
                    <option value="access_codes">Access Intercom &amp; Gate Codes</option>
                    <option value="key_register">Key Register &amp; Master Keys</option>
                    <option value="post_orders">Post Orders &amp; SOP Guidelines</option>
                  </select>
                </div>

                <label className="block w-full border-2 border-dashed border-white/20 hover:border-[#1FA6C9] rounded-2xl p-3 text-center cursor-pointer transition-all bg-white/[0.02]">
                  <span className="text-xs text-[#8598A8] block">
                    📁 Click to select file (PDF, DWG, PNG) or drag here
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.dwg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Files list */}
              <div className="space-y-2">
                {(site.files || [
                  { id: 'f1', name: 'Site Evacuation & Camera Blindspots.pdf', category: 'floorplan', size: '2.4 MB', uploadedAt: '14 May 2026' },
                  { id: 'f2', name: 'Boom Gate Intercom & Pin Register.pdf', category: 'access_codes', size: '420 KB', uploadedAt: '18 May 2026' },
                  { id: 'f3', name: 'Standard Post Orders - Armed Guarding.pdf', category: 'post_orders', size: '1.1 MB', uploadedAt: '01 Jan 2026' }
                ]).map((file) => (
                  <div
                    key={file.id}
                    className="p-3 bg-[#071726] border border-white/10 rounded-2xl flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-[#1FA6C9]/15 text-[#3FC9E9] grid place-items-center text-sm flex-none">
                        📑
                      </span>
                      <div>
                        <div className="font-semibold text-xs text-white">{file.name}</div>
                        <div className="text-[10px] text-[#8598A8]">
                          {file.category} · {file.size} · Uploaded {file.uploadedAt}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast(`Opening ${file.name} blueprint…`)}
                      className="text-xs font-bold text-[#3FC9E9] hover:underline"
                    >
                      Download / Open ›
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CONTACTS & SAPS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-white">Direct Emergency &amp; Police Dispatch Numbers</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#8598A8] block mb-1">Client Operations Manager</label>
                    <input
                      type="text"
                      value={clientContact}
                      onChange={(e) => setClientContact(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8598A8] block mb-1">Client Emergency Phone</label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8598A8] block mb-1">Local SAPS Police Station</label>
                    <input
                      type="text"
                      value={sapsStation}
                      onChange={(e) => setSapsStation(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8598A8] block mb-1">SAPS Sector Commander Cell</label>
                    <input
                      type="text"
                      value={sapsPhone}
                      onChange={(e) => setSapsPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveContacts}
                    className="bg-[#3AA655] hover:bg-[#34944c] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Save Contact Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#071726] flex items-center justify-between">
          <div className="text-xs text-[#8598A8]">
            Site ID: <span className="font-mono-code text-white">{site.id}</span>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer"
          >
            Close Site Operations
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
