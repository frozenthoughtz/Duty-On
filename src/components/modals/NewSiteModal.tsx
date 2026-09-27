import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';

interface Props {
  isOpen?: boolean;
  onClose: () => void;
}

export const NewSiteModal: React.FC<Props> = ({ isOpen = true, onClose }) => {
  const { addSite, showToast } = useDutyOn();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Commercial Precinct');
  const [officersRequired, setOfficersRequired] = useState(4);
  const [geofenceRadius, setGeofenceRadius] = useState(18);
  const [latitude, setLatitude] = useState('-33.9608');
  const [longitude, setLongitude] = useState('25.6022');
  const [clientContactName, setClientContactName] = useState('');
  const [clientPhone, setClientPhone] = useState('+27 41 ');
  const [emergencyPhone, setEmergencyPhone] = useState('+27 82 ');
  const [sapsStation, setSapsStation] = useState('Humewood SAPS Station');
  const [sapsSectorPhone, setSapsSectorPhone] = useState('+27 41 504 5000');
  const [armedResponseUnit, setArmedResponseUnit] = useState('AR-01 Alpha Tactical');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter the protected site name');
      return;
    }
    if (!location.trim()) {
      showToast('Please specify the physical location or sector');
      return;
    }

    addSite({
      name: name.trim(),
      location: location.trim(),
      category,
      officersRequired: Number(officersRequired) || 1,
      officersPresent: 0,
      patrolStatus: 'Perimeter Activated',
      compliance: 100,
      status: 'operational',
      clientContactName: clientContactName.trim() || 'Site Management',
      clientPhone: clientPhone.trim(),
      emergencyPhone: emergencyPhone.trim(),
      sapsStation,
      sapsSectorPhone,
      armedResponseUnit,
      geofenceRadius: Number(geofenceRadius) || 18,
      coords: {
        x: 100 + Math.floor(Math.random() * 220),
        y: 80 + Math.floor(Math.random() * 120)
      },
      lat: parseFloat(latitude) || -33.9608,
      lng: parseFloat(longitude) || 25.6022,
      posts: [
        { id: `p-${Date.now()}-1`, name: 'Main Vehicle Boom Gate', requiredGrade: 'Grade B', assignedOfficer: 'Unassigned', status: 'vacant' },
        { id: `p-${Date.now()}-2`, name: 'Perimeter Patrol Route', requiredGrade: 'Grade C', assignedOfficer: 'Unassigned', status: 'vacant' }
      ],
      notes: notes.trim() || 'Mandatory Sefeko RFID checkpoint sweeps and visitor register.'
    });

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
            <span className="w-9 h-9 rounded-xl bg-[#1FA6C9]/20 text-[#3FC9E9] grid place-items-center text-lg">
              🏢
            </span>
            <div>
              <h2 className="font-display font-bold text-sm text-white">Enroll New Protected Site &amp; Geofence</h2>
              <p className="text-[11px] text-[#8598A8]">Register client premises, GPS perimeter, and security quota</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
          {/* Site Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Site / Complex Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Coega Port Terminal 3 or Walmer Retail Hub"
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Premises Type
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="Commercial Precinct">Commercial</option>
                <option value="Industrial Estate">Industrial</option>
                <option value="Retail Mall">Retail Mall</option>
                <option value="Residential Estate">Residential Estate</option>
                <option value="Logistics Hub">Logistics Hub</option>
                <option value="Healthcare Facility">Healthcare</option>
              </select>
            </div>
          </div>

          {/* Physical Address / Sector */}
          <div>
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Physical Location / Sector Address *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 144 Commercial Road, Deal Party, Gqeberha"
              className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
            />
          </div>

          {/* Exact GPS Coordinates & Geofencing Perimeter */}
          <div className="bg-[#071726]/80 p-3.5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#3FC9E9] uppercase tracking-wider font-bold flex items-center gap-1.5">
                <span>📍</span>
                <span>Exact Site GPS Coordinates &amp; Perimeter Boundary</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLatitude(pos.coords.latitude.toFixed(5));
                        setLongitude(pos.coords.longitude.toFixed(5));
                        showToast(`Locked onto GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                      },
                      () => {
                        // fallback to Gqeberha/PE CBD coords
                        setLatitude('-33.9608');
                        setLongitude('25.6022');
                        showToast('Defaulted to Gqeberha Sector coordinates');
                      }
                    );
                  }
                }}
                className="text-[11px] bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] border border-[#1FA6C9]/30 px-2 py-0.5 rounded-lg font-semibold cursor-pointer transition-colors"
              >
                📡 Auto-Detect GPS
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Latitude (DD)
                </label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-33.9608"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2 text-white font-mono-code text-xs focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Longitude (DD)
                </label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="25.6022"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2 text-white font-mono-code text-xs focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>

            {/* Geofence selection */}
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Site Geofence Radius (Strict Perimeter Boundary)
              </label>
              <select
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white font-mono-code text-xs focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value={18}>18 meters (Exact 18m High-Precision Geofence - Recommended)</option>
                <option value={25}>25 meters (Tight Commercial Building)</option>
                <option value={35}>35 meters (Medium Facility Gate)</option>
                <option value={50}>50 meters (Industrial Yard Perimeter)</option>
                <option value={100}>100 meters (Large Precinct / Campus)</option>
              </select>
              <div className="text-[10px] text-[#5BCB80] font-mono-code mt-1.5 flex items-center gap-1">
                <span>🛡️</span>
                <span>Active 18m Geofence: Clock-ins &amp; patrols verified within 18m of GPS center.</span>
              </div>
            </div>
          </div>

          {/* Guards Quota */}
          <div className="bg-[#071726]/60 p-3.5 rounded-2xl border border-white/5">
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Guards Required (Shift Quota)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={officersRequired}
                  onChange={(e) => setOfficersRequired(Number(e.target.value))}
                  className="w-24 bg-[#071726] border border-white/10 rounded-xl p-2 text-white font-mono-code text-center font-bold focus:outline-none focus:border-[#1FA6C9]"
                />
                <span className="text-xs text-[#8598A8]">Officers deployed per active shift</span>
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Client Contact Person
              </label>
              <input
                type="text"
                value={clientContactName}
                onChange={(e) => setClientContactName(e.target.value)}
                placeholder="e.g. Sarah Jenkins (Ops)"
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Office Phone
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                24/7 Emergency Phone
              </label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
          </div>

          {/* SAPS & Armed Tactical Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Jurisdiction SAPS Station
              </label>
              <select
                value={sapsStation}
                onChange={(e) => setSapsStation(e.target.value)}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="Humewood SAPS Station">Humewood SAPS Station</option>
                <option value="Mount Road SAPS Station">Mount Road SAPS Station</option>
                <option value="Kwamagxaki SAPS Station">Kwamagxaki SAPS Station</option>
                <option value="Walmer SAPS Station">Walmer SAPS Station</option>
                <option value="Newton Park SAPS Station">Newton Park SAPS Station</option>
                <option value="Kabega Park SAPS Station">Kabega Park SAPS Station</option>
                <option value="Deal Party Sector Command">Deal Party Sector Command</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Assigned Armed Tactical Unit
              </label>
              <select
                value={armedResponseUnit}
                onChange={(e) => setArmedResponseUnit(e.target.value)}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="AR-01 Alpha Tactical">AR-01 Alpha Tactical (Hilux 4x4)</option>
                <option value="AR-02 Bravo">AR-02 Bravo (Isuzu Tactical)</option>
                <option value="Echo-3 Central">Echo-3 Central (Ford Ranger)</option>
                <option value="K9-01 Hunter">K9-01 Hunter (Canine Unit)</option>
              </select>
            </div>
          </div>

          {/* Standing Instructions & SOP Notes */}
          <div>
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Standing Post Orders &amp; SOP Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Strict access logging for delivery contractors. Check high-voltage substation every 60 mins."
              className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white resize-none focus:outline-none focus:border-[#1FA6C9]"
            />
          </div>

          <div className="p-3 bg-[#1FA6C9]/10 border border-[#1FA6C9]/25 rounded-2xl flex items-center gap-2.5 text-[11px] text-[#3FC9E9]">
            <span className="text-base flex-none">🛡️</span>
            <span>
              This will automatically sync with Google Cloud Firestore, create geofenced perimeter boundaries, and populate the Live Radar Map.
            </span>
          </div>

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
              className="bg-[#1FA6C9] hover:bg-[#1894b4] text-[#042430] font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-[#1FA6C9]/25"
            >
              Enroll Site &amp; Activate Geofence
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
