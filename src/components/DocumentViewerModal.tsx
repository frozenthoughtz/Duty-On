import React from 'react';
import { X, Calendar, Hash, Building2, User, ShieldCheck, Download, Trash2, ExternalLink } from 'lucide-react';
import { DocumentItem } from '../types/dutyon';
import { useDutyOn } from '../context/DutyOnContext';

interface DocumentViewerModalProps {
  document: DocumentItem;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ document: doc, onClose }) => {
  const { deleteDocument, showToast } = useDutyOn();

  const handleDelete = () => {
    deleteDocument(doc.id);
    showToast('Document deleted');
    onClose();
  };

  const handleDownload = () => {
    if (!doc.photoUrl && !doc.fileData) {
      showToast('No photo asset attached to this document.');
      return;
    }
    const link = window.document.createElement('a');
    link.href = doc.photoUrl || doc.fileData || '';
    link.download = `${doc.name.replace(/\s+/g, '_')}.jpg`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    showToast('Download initiated');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1E30]/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-lg bg-[#0F2840] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#0B1E30]/70 flex-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 grid place-items-center text-blue-400 flex-none">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-extrabold text-sm sm:text-base text-white truncate">
                {doc.name}
              </div>
              <div className="text-[11px] text-blue-200/70 flex items-center gap-1.5">
                <span className="bg-blue-400/20 text-blue-300 font-mono text-[9px] px-1.5 py-0.5 rounded">
                  {doc.category}
                </span>
                <span>·</span>
                <span>{doc.issuingAuthority || 'Verified Body'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition-all cursor-pointer flex-none ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4 text-xs">
          {/* Document Photo Display */}
          {doc.photoUrl || doc.fileData ? (
            <div className="relative rounded-2xl bg-black border border-white/15 overflow-hidden shadow-inner group">
              <img
                src={doc.photoUrl || doc.fileData}
                alt={doc.name}
                className="w-full max-h-[340px] object-contain mx-auto bg-black/90"
              />
              <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Cloud Copy</span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto text-blue-400/60" />
              <div className="text-white font-semibold">Standard System Document</div>
              <div className="text-[11px] text-slate-400">
                This document was generated or recorded digitally without a camera photo attachment.
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                <Hash className="w-3 h-3 text-blue-400" />
                <span>Certificate / ID No.</span>
              </span>
              <span className="text-white font-mono font-bold text-xs truncate block">
                {doc.certificateNumber || 'Not specified'}
              </span>
            </div>

            <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-400" />
                <span>Issuing Authority</span>
              </span>
              <span className="text-white font-bold text-xs truncate block">
                {doc.issuingAuthority || 'Standard Authority'}
              </span>
            </div>

            <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span>Validity / Expiry</span>
              </span>
              <span className="text-white font-semibold text-xs block">
                {doc.expiryDate ? (
                  <span className={doc.expiresSoon ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {doc.expiryDate} {doc.expiresSoon ? '(Expires Soon)' : ''}
                  </span>
                ) : (
                  <span className="text-slate-300">Lifetime / No Expiry</span>
                )}
              </span>
            </div>

            <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                <User className="w-3 h-3 text-blue-400" />
                <span>Officer Holder</span>
              </span>
              <span className="text-white font-bold text-xs truncate block">
                {doc.officerName || 'Tshepo Maloa'}
              </span>
            </div>
          </div>

          {/* Description & Verification */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
            <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
              Verification Status &amp; Records
            </div>
            <div className="text-slate-300 text-xs">
              {doc.description || 'Verified security personnel document stored in Firestore.'}
            </div>
            {doc.capturedAt && (
              <div className="text-[10px] text-slate-400 pt-1">
                Captured on: {new Date(doc.capturedAt).toLocaleString('en-ZA')}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#0B1E30]/80 flex-none flex items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs border border-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            {(doc.photoUrl || doc.fileData) && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Photo</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
