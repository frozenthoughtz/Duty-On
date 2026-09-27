import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { FleetVehicle } from '../../types/dutyon';

interface Props {
  vehicle: FleetVehicle;
  onClose: () => void;
}

export const EditFleetModal: React.FC<Props> = ({ vehicle, onClose }) => {
  const { updateFleetVehicle, deleteFleetVehicle, showToast } = useDutyOn();

  const [callSign, setCallSign] = useState(vehicle.callSign);
  const [vehicleModel, setVehicleModel] = useState(vehicle.vehicleModel);
  const [regPlate, setRegPlate] = useState(vehicle.regPlate);
  const [crew, setCrew] = useState(vehicle.crew);
  const [sector, setSector] = useState(vehicle.sector);
  const [radioChannel, setRadioChannel] = useState(vehicle.radioChannel || 'CH-01 (Tactical Armed)');
  const [status, setStatus] = useState(vehicle.status);
  const [fuelLevel, setFuelLevel] = useState(vehicle.fuelLevel || 85);
  const [batteryLevel, setBatteryLevel] = useState(vehicle.batteryLevel || 95);
  const [notes, setNotes] = useState(vehicle.notes || '');

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
    if (!callSign.trim() || !regPlate.trim()) {
      showToast('Call sign and registration plate are required');
      return;
    }

    updateFleetVehicle(vehicle.id, {
      callSign: callSign.trim(),
      vehicleModel: vehicleModel.trim(),
      regPlate: regPlate.trim().toUpperCase(),
      crew: crew.trim(),
      sector: sector.trim(),
      radioChannel: radioChannel.trim(),
      status: status as any,
      fuelLevel: Number(fuelLevel) || 80,
      batteryLevel: Number(batteryLevel) || 90,
      notes: notes.trim() || undefined
    });

    showToast(`Vehicle ${callSign} updated successfully`);
    onClose();
  };

  const handleDelete = () => {
    deleteFleetVehicle(vehicle.id);
    showToast(`Vehicle ${vehicle.callSign} decommissioned from fleet`);
    onClose();
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0A1E33] border border-white/15 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#071726]/90 flex-none">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 grid place-items-center text-xl border border-sky-500/30">
              🚔
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-white">Edit Armed Response Vehicle</h2>
                <span className="font-mono-code text-[10px] bg-white/10 px-2 py-0.5 rounded text-[#8598A8]">{vehicle.regPlate}</span>
              </div>
              <p className="text-[11px] text-[#8598A8]">Update crew deployment, call sign, radio frequency, and status</p>
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
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Unit Telemetry &amp; Identifiers</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Tactical Call Sign *
                </label>
                <input
                  type="text"
                  required
                  value={callSign}
                  onChange={(e) => setCallSign(e.target.value)}
                  placeholder="e.g. Unit Bravo-4"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Vehicle Reg Plate *
                </label>
                <input
                  type="text"
                  required
                  value={regPlate}
                  onChange={(e) => setRegPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. EC 491-820"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Vehicle Make &amp; Model
                </label>
                <input
                  type="text"
                  required
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="e.g. Toyota Hilux 2.4 GD-6 4x4"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Patrol Sector / Beat
                </label>
                <input
                  type="text"
                  required
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="e.g. Kwamagxaki / Zwide / Ibhayi"
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Assigned Officers / Crew
              </label>
              <input
                type="text"
                required
                value={crew}
                onChange={(e) => setCrew(e.target.value)}
                placeholder="e.g. Off. T. Sithole (Armed) & Off. B. Khumalo"
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5BCB80]">Radio &amp; Operational Status</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Operational Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value="10-8 Available">🟢 10-8 Available (On Patrol)</option>
                  <option value="10-23 En Route">🚨 10-23 En Route to Incident</option>
                  <option value="10-7 Standby">⚪ 10-7 Standby (Base / Station)</option>
                </select>
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Radio Channel Frequency
                </label>
                <select
                  value={radioChannel}
                  onChange={(e) => setRadioChannel(e.target.value)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  <option value="CH-01 (Tactical Armed)">CH-01 (Tactical Armed)</option>
                  <option value="CH-02 (Perimeter Patrol)">CH-02 (Perimeter Patrol)</option>
                  <option value="CH-03 (Emergency Priority)">CH-03 (Emergency Priority)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  Fuel Level (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={fuelLevel}
                  onChange={(e) => setFuelLevel(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
                  GPS Tracker Battery (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={batteryLevel}
                  onChange={(e) => setBatteryLevel(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white font-mono-code focus:outline-none focus:border-[#1FA6C9]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-white/10">
            <label className="text-[10.5px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Vehicle Equipment / Maintenance Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Equipped with Dashcam, Medical Kit, Spotlight, Spikes."
              className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9] resize-none"
            />
          </div>

          {/* Delete Danger Zone */}
          <div className="pt-3 border-t border-rose-500/20">
            {showDeleteConfirm ? (
              <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 text-rose-200 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <strong>Decommission vehicle?</strong> This will remove {vehicle.callSign} from live response dispatch.
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
                    Yes, Decommission
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
                <span>Decommission vehicle from fleet</span>
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
              className="bg-sky-500 hover:bg-sky-600 text-[#042430] font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-900/30 flex items-center gap-2"
            >
              <span>💾</span>
              <span>Save Vehicle Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
