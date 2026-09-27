import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileJson, FileSpreadsheet, Shield } from 'lucide-react';
import { ManagedProfile } from '../types/profile';
import { exportProfilesToJSON, exportProfilesToCSV } from '../utils/profileHelpers';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: ManagedProfile[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  profiles
}) => {
  if (!isOpen) return null;

  const modalMarkup = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="font-black text-white text-base">Export Profile Records</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Download an offline backup copy of your {profiles.length} managed personal and professional profiles directly from Firestore.
        </p>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => {
              exportProfilesToJSON(profiles);
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all hover:border-cyan-500/50 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">Full JSON Format (.json)</div>
                <div className="text-[11px] text-slate-400">Complete raw schema with metadata &amp; tags</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </button>

          <button
            onClick={() => {
              exportProfilesToCSV(profiles);
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all hover:border-emerald-500/50 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">Spreadsheet CSV (.csv)</div>
                <div className="text-[11px] text-slate-400">Compatible with Excel, Numbers &amp; Google Sheets</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
