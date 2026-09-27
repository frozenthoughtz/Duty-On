import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';

interface Props {
  isOpen?: boolean;
  onClose: () => void;
}

export const BroadcastAlertModal: React.FC<Props> = ({ isOpen = true, onClose }) => {
  const { sites, broadcastControlRoomAlert, showToast } = useDutyOn();

  const [targetSite, setTargetSite] = useState('ALL_SITES');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MED'>('CRITICAL');
  const [title, setTitle] = useState('CODE RED: Armed Vehicle In Sector');
  const [message, setMessage] = useState(
    'All guards to secure vehicle entrance gates and verify access codes. Report any suspicious vehicle sightings immediately to Control Room.'
  );

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

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    broadcastControlRoomAlert(title.trim(), message.trim(), targetSite, priority);
    showToast(`🚨 FLEET BROADCAST DISPATCHED: "${title}"`);
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
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 grid place-items-center text-lg">
              📢
            </span>
            <div>
              <h2 className="font-display font-bold text-sm text-white">Fleet-Wide Push Broadcast</h2>
              <p className="text-[11px] text-[#8598A8]">Transmit critical safety alert to field guards</p>
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

        {/* Form */}
        <form onSubmit={handleBroadcast} className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5 text-xs">
          <div>
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Broadcast Target
            </label>
            <select
              value={targetSite}
              onChange={(e) => setTargetSite(e.target.value)}
              className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
            >
              <option value="ALL_SITES">🌐 All 34 Sites &amp; Deployed Officers (Fleet-Wide)</option>
              {sites.map((s) => (
                <option key={s.id} value={s.name}>
                  🏢 {s.name} ({s.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Alert Urgency Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CRITICAL', label: 'Critical / Red', color: 'border-rose-500/50 text-rose-400' },
                { id: 'HIGH', label: 'High Alert', color: 'border-amber-500/50 text-amber-300' },
                { id: 'MED', label: 'Operational', color: 'border-[#1FA6C9]/50 text-[#3FC9E9]' }
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setPriority(lvl.id as any)}
                  className={`p-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    priority === lvl.id
                      ? `bg-white/15 ${lvl.color}`
                      : 'bg-[#071726] border-white/10 text-[#8598A8]'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Alert Headline
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CODE RED: Suspect vehicle fleeing on N2"
              className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#1FA6C9]"
            />
          </div>

          <div>
            <label className="text-[10px] text-[#8598A8] uppercase tracking-wider block mb-1">
              Instruction / Dispatch Message
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#071726] border border-white/10 rounded-xl p-2.5 text-white resize-none focus:outline-none focus:border-[#1FA6C9]"
            />
          </div>

          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-[11px] text-rose-300">
            <span className="text-base flex-none">⚠️</span>
            <span>
              This broadcast will sound an audible override tone on all connected officer devices.
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
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/30"
            >
              Transmit Fleet Broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
