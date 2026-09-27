import React, { useState } from 'react';
import { useDutyOn } from '../../context/DutyOnContext';
import { IncidentQueueItem } from '../../types/dutyon';

interface EditIncidentModalProps {
  incident: IncidentQueueItem;
  onClose: () => void;
}

export const EditIncidentModal: React.FC<EditIncidentModalProps> = ({ incident, onClose }) => {
  const { updateIncident, deleteIncident, sites, fleetVehicles, showToast } = useDutyOn();

  const [category, setCategory] = useState(incident.category);
  const [site, setSite] = useState(incident.site);
  const [priority, setPriority] = useState<'HIGH' | 'MED' | 'LOW' | 'INFO'>((incident.priority as any) || 'HIGH');
  const [status, setStatus] = useState<'open' | 'investigating' | 'dispatched' | 'resolved'>(incident.status || 'open');
  const [sapsCaseNumber, setSapsCaseNumber] = useState(incident.sapsCaseNumber || '');
  const [sapsStation, setSapsStation] = useState(incident.sapsStation || '');
  const [investigatingOfficer, setInvestigatingOfficer] = useState(incident.investigatingOfficer || '');
  const [assignedUnit, setAssignedUnit] = useState(incident.assignedUnit || '');
  const [etaMinutes, setEtaMinutes] = useState(incident.etaMinutes ?? 3);
  const [description, setDescription] = useState(incident.description || '');
  const [weaponsInvolved, setWeaponsInvolved] = useState(incident.weaponsInvolved || '');
  const [injuriesCasualties, setInjuriesCasualties] = useState(incident.injuriesCasualties || '');
  
  // Suspect Details
  const [suspectCount, setSuspectCount] = useState(incident.suspectDetails?.count ?? 2);
  const [suspectDescription, setSuspectDescription] = useState(incident.suspectDetails?.description || '');
  const [clothing, setClothing] = useState(incident.suspectDetails?.clothing || '');
  const [vehicle, setVehicle] = useState(incident.suspectDetails?.vehicle || '');
  const [escapeRoute, setEscapeRoute] = useState(incident.suspectDetails?.escapeRoute || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateIncident(incident.id, {
      category,
      site,
      priority,
      status,
      sapsCaseNumber: sapsCaseNumber.trim() || undefined,
      sapsStation: sapsStation.trim() || undefined,
      investigatingOfficer: investigatingOfficer.trim() || undefined,
      assignedUnit: assignedUnit.trim() || undefined,
      etaMinutes: Number(etaMinutes),
      description: description.trim(),
      weaponsInvolved: weaponsInvolved.trim() || undefined,
      injuriesCasualties: injuriesCasualties.trim() || undefined,
      suspectDetails: {
        count: Number(suspectCount),
        description: suspectDescription.trim(),
        clothing: clothing.trim(),
        vehicle: vehicle.trim(),
        escapeRoute: escapeRoute.trim()
      }
    });

    showToast(`Updated Incident Case Docket #${incident.id}`);
    onClose();
  };

  const handleDelete = () => {
    deleteIncident(incident.id);
    showToast(`Incident #${incident.id} expunged from register.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0B1E30] border border-white/20 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#081726] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 grid place-items-center text-lg">
              ✏️
            </span>
            <div>
              <h2 className="font-display font-extrabold text-base text-white">
                Edit Emergency Incident &amp; SAPS Docket
              </h2>
              <p className="text-[11px] text-[#8598A8] font-mono-code">
                DOCKET REF: #{incident.id} · Created: {incident.reportedAt || incident.age}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white grid place-items-center text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh] text-xs">
          {/* Row 1: Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono-code font-bold uppercase text-[#8598A8] mb-1.5">
                Incident Category *
              </label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Armed Robbery, Fence Tampering..."
                className="w-full bg-[#071726] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono-code font-bold uppercase text-[#8598A8] mb-1.5">
                Priority Severity *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#071726] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="HIGH">CRITICAL / HIGH PRIORITY</option>
                <option value="MED">MEDIUM PRIORITY</option>
                <option value="LOW">LOW PRIORITY</option>
                <option value="INFO">INFORMATIONAL</option>
              </select>
            </div>
          </div>

          {/* Row 2: Site & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono-code font-bold uppercase text-[#8598A8] mb-1.5">
                Protected Site *
              </label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full bg-[#071726] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.name}>{s.name} ({s.location})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono-code font-bold uppercase text-[#8598A8] mb-1.5">
                Docket Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#071726] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="open">Open / Unresolved</option>
                <option value="investigating">Under Active Investigation</option>
                <option value="dispatched">Armed Unit Dispatched</option>
                <option value="resolved">Resolved &amp; Closed</option>
              </select>
            </div>
          </div>

          {/* Row 3: SAPS CAS Details */}
          <div className="p-4 bg-black/25 rounded-xl border border-white/10 space-y-3">
            <div className="text-[11px] font-mono-code font-bold text-[#3FC9E9] uppercase flex items-center gap-1.5">
              <span>👮</span>
              <span>South African Police Service (SAPS) Registration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#8598A8] uppercase font-semibold mb-1">
                  SAPS CAS Number
                </label>
                <input
                  type="text"
                  value={sapsCaseNumber}
                  onChange={(e) => setSapsCaseNumber(e.target.value)}
                  placeholder="e.g. CAS 389/05/2026"
                  className="w-full bg-[#071726] border border-white/15 rounded-lg px-3 py-2 text-xs text-white font-mono-code placeholder-slate-500 focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#8598A8] uppercase font-semibold mb-1">
                  SAPS Station
                </label>
                <input
                  type="text"
                  value={sapsStation}
                  onChange={(e) => setSapsStation(e.target.value)}
                  placeholder="e.g. Humewood SAPS"
                  className="w-full bg-[#071726] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#8598A8] uppercase font-semibold mb-1">
                  Investigating Detective
                </label>
                <input
                  type="text"
                  value={investigatingOfficer}
                  onChange={(e) => setInvestigatingOfficer(e.target.value)}
                  placeholder="e.g. Det. Const. Ndlovu"
                  className="w-full bg-[#071726] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Armed Unit Dispatch & ETA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono-code font-bold uppercase text-[#8598A8] mb-1.5">
                Assigned Armed Response Unit
              </label>
              <select
                value={assignedUnit}
                onChange={(e) => setAssignedUnit(e.target.value)}
                className="w-full bg-[#071726] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="">None Assigned</option>
                {fleetVehicles.map((v) => (
                  <option key={v.id} value={v.callSign}>
                    {v.callSign} ({v.vehicleModel} · {v.regPlate} · {v.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono-code font-bold uppercase text-[#8598A8] mb-1.5">
                Response ETA (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={etaMinutes}
                onChange={(e) => setEtaMinutes(Number(e.target.value))}
                className="w-full bg-[#071726] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
          </div>

          {/* Row 5: Forensic Description / Narrative */}
          <div>
            <label className="block text-[11px] font-mono-code font-bold uppercase text-[#8598A8] mb-1.5">
              Incident Chronology &amp; Narrative Statement
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chronological narrative of the breach, operator actions, and tactical unit response..."
              className="w-full bg-[#071726] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1FA6C9]"
            />
          </div>

          {/* Row 6: Weapons & Casualties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono-code font-bold uppercase text-[#8598A8] mb-1.5">
                Weapons / Tools Catalogued
              </label>
              <input
                type="text"
                value={weaponsInvolved}
                onChange={(e) => setWeaponsInvolved(e.target.value)}
                placeholder="e.g. 9mm Handgun, Bolt Cutters, Crowbar..."
                className="w-full bg-[#071726] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono-code font-bold uppercase text-[#8598A8] mb-1.5">
                Injuries / Casualties
              </label>
              <input
                type="text"
                value={injuriesCasualties}
                onChange={(e) => setInjuriesCasualties(e.target.value)}
                placeholder="e.g. None reported / Guard laceration treated"
                className="w-full bg-[#071726] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
          </div>

          {/* Row 7: Suspect & Getaway Details */}
          <div className="p-4 bg-black/25 rounded-xl border border-white/10 space-y-3">
            <div className="text-[11px] font-mono-code font-bold text-amber-400 uppercase">
              Suspect &amp; Escape Vector Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#8598A8] uppercase font-semibold mb-1">
                  Suspect Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={suspectCount}
                  onChange={(e) => setSuspectCount(Number(e.target.value))}
                  className="w-full bg-[#071726] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#8598A8] uppercase font-semibold mb-1">
                  Getaway Vehicle
                </label>
                <input
                  type="text"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder="e.g. White Toyota Hilux (EC 928-112)"
                  className="w-full bg-[#071726] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#8598A8] uppercase font-semibold mb-1">
                  Escape Route / Vector
                </label>
                <input
                  type="text"
                  value={escapeRoute}
                  onChange={(e) => setEscapeRoute(e.target.value)}
                  placeholder="e.g. North on R75 towards Uitenhage"
                  className="w-full bg-[#071726] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#8598A8] uppercase font-semibold mb-1">
                Clothing &amp; Physical Features
              </label>
              <input
                type="text"
                value={clothing}
                onChange={(e) => setClothing(e.target.value)}
                placeholder="e.g. Dark balaclavas, reflective safety jackets, work boots"
                className="w-full bg-[#071726] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🗑️</span>
              <span>Expunge Incident Docket</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1FA6C9] hover:bg-[#1894b4] text-[#042430] font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
