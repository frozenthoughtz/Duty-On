import React from 'react';
import { SectoralRatesMatrixEditor } from '../SectoralRatesMatrixEditor';

interface SectoralRatesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SectoralRatesConfigModal: React.FC<SectoralRatesConfigModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-[#071726] border border-white/20 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#0A1E33] via-[#0C243D] to-[#071726] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 grid place-items-center text-lg font-bold">
              ⚖️
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Configure Regional &amp; Grade Rates (Including Benefits)
              </h2>
              <p className="text-xs text-[#8598A8]">
                Sectoral Determination 6 &amp; PSSBC · Direct live rate updates for Region 1 and Region 2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8598A8] hover:text-white grid place-items-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto min-h-0 flex-1">
          <SectoralRatesMatrixEditor onSaved={onClose} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0A1E33] flex items-center justify-between">
          <span className="text-[11px] text-[#8598A8]">
            Changes are saved to Firestore and immediately active across live timesheets &amp; control room.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
