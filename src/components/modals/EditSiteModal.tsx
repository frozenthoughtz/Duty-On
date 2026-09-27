import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { MultiSiteItem } from '../../types/dutyon';

interface Props {
  site: MultiSiteItem;
  onClose: () => void;
}

export const EditSiteModal: React.FC<Props> = ({ site, onClose }) => {
  const { updateSite, deleteSite, showToast } = useDutyOn();

  const [name, setName] = useState(site.name);
  const [location, setLocation] = useState(site.location);
  const [category, setCategory] = useState(site.category || 'Retail / Commercial');
  const [officersRequired, setOfficersRequired] = useState(site.officersRequired || 4);
  const [status, setStatus] = useState(site.status || 'operational');
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState(site.geofenceRadiusMeters || 250);
  const [clientContactName, setClientContactName] = useState(site.clientContactName || '');
  const [clientPhone, setClientPhone] = useState(site.clientPhone || '');
  const [emergencyPhone, setEmergencyPhone] = useState(site.emergencyPhone || '');
  const [sapsStation, setSapsStation] = useState(site.sapsStation || 'Mount Road SAPS');
  const [sapsSectorPhone, setSapsSectorPhone] = useState(site.sapsSectorPhone || '041 394 6243');
  const [armedResponseUnit, setArmedResponseUnit] = useState(site.armedResponseUnit || 'Tactical Unit Bravo-4');
  const [notes, setNotes] = useState(site.notes || '');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Site name cannot be empty');
      return;
    }

    updateSite(site.id, {
      name: name.trim(),
      location: location.trim(),
      category,
      officersRequired: Number(officersRequired) || 1,
      status: status as any,
      geofenceRadiusMeters: Number(geofenceRadiusMeters) || 200,
      clientContactName: clientContactName.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      emergencyPhone: emergencyPhone.trim() || undefined,
      sapsStation: sapsStation.trim() || undefined,
      sapsSectorPhone: sapsSectorPhone.trim() || undefined,
      armedResponseUnit: armedResponseUnit.trim() || undefined,
      notes: notes.trim() || undefined
    });

    showToast(`Site "${name}" updated successfully`);
    onClose();
  };

  const handleDelete = () => {
    deleteSite(site.id);
    showToast(`Site "${site.name}" removed from security network`);
    onClose();
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0A1E33] border border-white/15 rounded-2xl sm:rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#071726]/90 flex-none">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#1FA6C9]/20 text-[#3FC9E9] grid place-items-center text-xl border border-[#1FA6C9]/30">
              🏢
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-white">Edit Protected Client Site</h2>
                <span className="font-mono-code text-[10px] bg-white/10 px-2 py-0.5 rounded text-[#8598A8]">{site.id}</span>
              </div>
              <p className="text-[11px] text-[#8598A8]">Update geofence, post staffing, client contacts, and SAPS dispatch</p>
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

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
          {/* Main info */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#3FC9E9]">General Site Details</div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Site Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Physical Address / Suburb
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Site Sector Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value="Retail / Commercial">Retail / Commercial</option>
                  <option value="Industrial / Warehouse">Industrial / Warehouse</option>
                  <option value="Residential Estate">Residential Estate</option>
                  <option value="Healthcare / Clinic">Healthcare / Clinic</option>
                  <option value="Critical Infrastructure">Critical Infrastructure</option>
                </select>
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Operational Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value="operational">🟢 Fully Operational</option>
                  <option value="attention">🟡 Needs Attention</option>
                  <option value="critical">🔴 Critical Alert / Understaffed</option>
                </select>
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Required Officers / Shift
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={officersRequired}
                  onChange={(e) => setOfficersRequired(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>
          </div>

          {/* Perimeter & Geofence */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5BCB80]">Perimeter &amp; Response</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  GPS Geofence Radius (Meters)
                </label>
                <input
                  type="number"
                  step="50"
                  min="50"
                  max="2000"
                  value={geofenceRadiusMeters}
                  onChange={(e) => setGeofenceRadiusMeters(parseInt(e.target.value) || 200)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Assigned Armed Response Unit
                </label>
                <input
                  type="text"
                  value={armedResponseUnit}
                  onChange={(e) => setArmedResponseUnit(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>
          </div>

          {/* Client & SAPS Contacts */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#E7A13A]">Client &amp; Emergency Contacts</div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Client Contact Person
                </label>
                <input
                  type="text"
                  value={clientContactName}
                  onChange={(e) => setClientContactName(e.target.value)}
                  placeholder="e.g. Johan Nel"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Client Phone
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Site Emergency Hotline
                </label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Jurisdictional SAPS Police Station
                </label>
                <input
                  type="text"
                  value={sapsStation}
                  onChange={(e) => setSapsStation(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  SAPS Sector Commander Phone
                </label>
                <input
                  type="text"
                  value={sapsSectorPhone}
                  onChange={(e) => setSapsSectorPhone(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 pt-3 border-t border-white/10">
            <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Site Security Notes &amp; Standing Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Main keys held in lockbox #4; contractor deliveries through Gate 2 only."
              className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9] resize-none"
            />
          </div>

          {/* Delete Danger Zone */}
          <div className="pt-3 border-t border-rose-500/20">
            {showDeleteConfirm ? (
              <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 text-rose-200 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <strong>Are you sure?</strong> This will remove "{site.name}" from live operations, patrols, and roster.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
                  >
                    Yes, Delete Site
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>🗑️</span>
                <span>Delete this site from database</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#8598A8] hover:text-white px-4 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#1FA6C9] hover:bg-[#1988a5] text-[#042430] font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-900/30 flex items-center gap-2"
            >
              <span>💾</span>
              <span>Save Site Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
