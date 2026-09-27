import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';

interface Props {
  isOpen?: boolean;
  onClose: () => void;
}

export const NewFleetVehicleModal: React.FC<Props> = ({ isOpen = true, onClose }) => {
  const { addFleetVehicle, showToast } = useDutyOn();

  const [callSign, setCallSign] = useState('');
  const [vehicleModel, setVehicleModel] = useState('Toyota Hilux 2.8 GD-6 4x4');
  const [regPlate, setRegPlate] = useState('EC ');
  const [crew, setCrew] = useState('');
  const [sector, setSector] = useState('Gqeberha Central & CBD');
  const [radioChannel, setRadioChannel] = useState('VHF Tactical Ch 04');
  const [status, setStatus] = useState<'10-8 Available' | '10-23 En Route' | '10-7 Standby'>('10-8 Available');
  const [fuelPct, setFuelPct] = useState(90);
  const [batteryPct, setBatteryPct] = useState(96);
  const [speedKmH, setSpeedKmH] = useState(0);

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
    if (!callSign.trim()) {
      showToast('Please enter the vehicle call sign');
      return;
    }
    if (!regPlate.trim() || regPlate.trim() === 'EC') {
      showToast('Please enter a valid vehicle registration plate');
      return;
    }

    addFleetVehicle({
      callSign: callSign.trim(),
      vehicleModel: vehicleModel.trim(),
      regPlate: regPlate.trim().toUpperCase(),
      crew: crew.trim() || 'Unassigned Reaction Officer',
      sector,
      radioChannel,
      status,
      speedKmH: Number(speedKmH) || 0,
      batteryPct: Number(batteryPct) || 95,
      fuelPct: Number(fuelPct) || 85,
      coords: {
        x: 120 + Math.floor(Math.random() * 180),
        y: 80 + Math.floor(Math.random() * 100)
      },
      destination: status === '10-23 En Route' ? 'Emergency Dispatch' : 'Routine Patrol Sector',
      etaMin: status === '10-23 En Route' ? 4 : 0
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
              🚔
            </span>
            <div>
              <h2 className="font-display font-bold text-sm text-white">Enroll Armed Response / Fleet Vehicle</h2>
              <p className="text-[11px] text-[#8598A8]">Register vehicle telemetry, crew pairing, and tactical radio sector</p>
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
          {/* Call Sign & Reg Plate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Tactical Call Sign *
              </label>
              <input
                type="text"
                required
                value={callSign}
                onChange={(e) => setCallSign(e.target.value)}
                placeholder="e.g. AR-05 Delta or Bravo-2"
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Registration Plate *
              </label>
              <input
                type="text"
                required
                value={regPlate}
                onChange={(e) => setRegPlate(e.target.value)}
                placeholder="e.g. EC 541-902"
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white font-mono-code uppercase focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
          </div>

          {/* Vehicle Model */}
          <div>
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Vehicle Make &amp; Model
            </label>
            <select
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
            >
              <option value="Toyota Hilux 2.8 GD-6 4x4">Toyota Hilux 2.8 GD-6 4x4 (Armed Tactical Response)</option>
              <option value="Ford Ranger 2.0 Bi-Turbo 4x4">Ford Ranger 2.0 Bi-Turbo 4x4 (Heavy Patrol Unit)</option>
              <option value="Isuzu D-Max 3.0 Ddi Tactical">Isuzu D-Max 3.0 Ddi Tactical (Industrial Response)</option>
              <option value="VW Amarok V6 K9 Tactical">VW Amarok V6 K9 Tactical (Canine Pursuit Unit)</option>
              <option value="Toyota Quantum 2.5 D-4D Van">Toyota Quantum 2.5 D-4D (Shift Change Transport)</option>
              <option value="BMW 330d Highway Interceptor">BMW 330d Highway Interceptor (Rapid Pursuit)</option>
            </select>
          </div>

          {/* Assigned Crew */}
          <div>
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Assigned Crew / Armed Driver
            </label>
            <input
              type="text"
              value={crew}
              onChange={(e) => setCrew(e.target.value)}
              placeholder="e.g. Sgt. S. Mokoena & Officer D. Khumalo (Armed Response)"
              className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
            />
          </div>

          {/* Sector & Radio Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Assigned Operational Sector
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="Gqeberha Central & CBD">Gqeberha Central &amp; CBD</option>
                <option value="Kwamagxaki / New Brighton">Kwamagxaki / New Brighton</option>
                <option value="Deal Party Industrial Hub">Deal Party Industrial Hub</option>
                <option value="Greenacres / Newton Park">Greenacres / Newton Park</option>
                <option value="Walmer Downs & Suburbs">Walmer Downs &amp; Suburbs</option>
                <option value="Summerstrand / Port Precinct">Summerstrand / Port Precinct</option>
                <option value="Coega IDZ / Port of Ngqura">Coega IDZ / Port of Ngqura</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                VHF Tactical Radio Channel
              </label>
              <select
                value={radioChannel}
                onChange={(e) => setRadioChannel(e.target.value)}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="VHF Tactical Ch 04">VHF Tactical Ch 04 (General Armed)</option>
                <option value="VHF Emergency Ch 01">VHF Emergency Ch 01 (Direct SOC Dispatch)</option>
                <option value="VHF K9 Ch 06">VHF K9 Ch 06 (Canine Unit)</option>
                <option value="VHF Logistics Ch 02">VHF Logistics Ch 02 (Relief Transport)</option>
              </select>
            </div>
          </div>

          {/* Initial Status, Fuel & Battery */}
          <div className="grid grid-cols-3 gap-3 bg-[#071726]/60 p-3.5 rounded-2xl border border-white/5">
            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2 text-white font-semibold focus:outline-none focus:border-[#1FA6C9]"
              >
                <option value="10-8 Available">10-8 Available</option>
                <option value="10-23 En Route">10-23 En Route</option>
                <option value="10-7 Standby">10-7 Standby</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Fuel Level (%)
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={fuelPct}
                onChange={(e) => setFuelPct(Number(e.target.value))}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2 text-white font-mono-code text-center font-bold focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
                Tracker Battery (%)
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={batteryPct}
                onChange={(e) => setBatteryPct(Number(e.target.value))}
                className="w-full bg-[#071726] border border-white/10 rounded-xl p-2 text-white font-mono-code text-center font-bold focus:outline-none focus:border-[#1FA6C9]"
              />
            </div>
          </div>

          <div className="p-3 bg-[#1FA6C9]/10 border border-[#1FA6C9]/25 rounded-2xl flex items-center gap-2.5 text-[11px] text-[#3FC9E9]">
            <span className="text-base flex-none">📡</span>
            <span>
              Real-time vehicle GPS ping will be activated on Firestore and broadcasted to SOC dispatchers with priority radio assignment.
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
              Enroll Vehicle to Live Fleet
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
