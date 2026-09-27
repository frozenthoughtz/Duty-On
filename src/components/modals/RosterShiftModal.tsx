import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { EmployeeRosterRow } from '../../types/dutyon';

interface Props {
  data?: {
    officer: EmployeeRosterRow;
    dayIdx: number;
    dayName: string;
  };
  shiftData?: {
    officer: EmployeeRosterRow;
    dayIdx: number;
    dayName: string;
  };
  isOpen?: boolean;
  onClose: () => void;
}

export const RosterShiftModal: React.FC<Props> = ({ data, shiftData, isOpen = true, onClose }) => {
  const payload = data || shiftData;
  if (!isOpen || !payload) return null;
  const { officer, dayIdx, dayName } = payload;
  const { updateRosterShift, officersList, showToast } = useDutyOn();

  const currentShift = officer.shifts[dayIdx] || 'OFF';
  const [selectedShift, setSelectedShift] = useState(currentShift);
  const [shiftNote, setShiftNote] = useState('');
  const [isReliefAssigned, setIsReliefAssigned] = useState(false);
  const [reliefOfficerName, setReliefOfficerName] = useState('Nomsa Dlamini');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const fullDay = daysOfWeek[dayIdx] || dayName;

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

  const handleSave = () => {
    updateRosterShift(officer.empId, dayIdx, selectedShift as any);
    if (isReliefAssigned) {
      showToast(`Relief assigned to ${reliefOfficerName} for ${officer.name} on ${fullDay}`);
    } else {
      showToast(`Shift updated to ${selectedShift} for ${officer.name} on ${fullDay}`);
    }
    onClose();
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0A1E33] border border-white/15 rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#071726]/80 flex-none">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl grid place-items-center font-bold text-white shadow-sm flex-none"
              style={{ backgroundColor: officer.color || '#1FA6C9' }}
            >
              {officer.name.charAt(0)}
            </div>
            <div>
              <div className="font-display font-bold text-sm text-white">{officer.name}</div>
              <div className="text-[11px] text-[#8598A8]">
                {officer.empId} · Grade {officer.grade} · {fullDay}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white grid place-items-center transition-all cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
          {/* Shift Selection */}
          <div>
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-2 font-semibold">
              Shift Assignment
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { code: 'D', label: 'Day Shift (06:00–18:00)', color: 'bg-[#2b6cb0]' },
                { code: 'N', label: 'Night Shift (18:00–06:00)', color: 'bg-[#1b4e77]' },
                { code: 'OFF', label: 'Rest Day (Off Duty)', color: 'bg-white/10' },
                { code: 'OPEN', label: 'Open Post (Unassigned)', color: 'bg-amber-600/30' },
                { code: 'EXC', label: 'Excused / Medical', color: 'bg-rose-600/30' }
              ].map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => setSelectedShift(s.code as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    selectedShift === s.code
                      ? 'border-[#1FA6C9] bg-[#1FA6C9]/20 text-white font-bold'
                      : 'border-white/10 bg-[#071726] text-[#9db0c0] hover:text-white'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md ${s.color} text-white font-mono-code text-[10px] grid place-items-center flex-none`}>
                    {s.code}
                  </span>
                  <span className="text-[11px] truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Standby Relief Swap */}
          <div className="bg-[#071726] border border-white/10 rounded-2xl p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isReliefAssigned}
                onChange={(e) => setIsReliefAssigned(e.target.checked)}
                className="rounded accent-[#1FA6C9]"
              />
              <span className="font-semibold text-white">Assign standby relief officer for this shift</span>
            </label>

            {isReliefAssigned && (
              <div className="pt-2 animate-fade-in">
                <select
                  value={reliefOfficerName}
                  onChange={(e) => setReliefOfficerName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:outline-none focus:border-[#1FA6C9]"
                >
                  {officersList
                    .filter((o) => o.name !== officer.name)
                    .map((o) => (
                      <option key={o.id} value={o.name} className="bg-[#0A1E33]">
                        {o.name} ({o.grade}) — Standby Available
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Shift Special Instructions */}
          <div>
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1 font-semibold">
              Shift Post Orders / Special Note
            </label>
            <input
              type="text"
              value={shiftNote}
              onChange={(e) => setShiftNote(e.target.value)}
              placeholder="e.g. Armed escort, bodycam inspection required"
              className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#071726] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-[#8598A8] hover:text-white px-3 py-1.5 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-[#3AA655] hover:bg-[#34944c] text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
