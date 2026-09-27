import React, { useState } from 'react';
import { ControlRoomAlert } from '../../types/dutyon';

interface AlertDetailModalProps {
  alert: ControlRoomAlert | null;
  onClose: () => void;
  onDismiss: (alertId: string) => void;
  onEscalateToIncident?: (alert: ControlRoomAlert) => void;
  onDispatchUnit?: (siteName: string) => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  onClose,
  onDismiss,
  onEscalateToIncident,
  onDispatchUnit
}) => {
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);

  if (!alert) return null;

  const photo = alert.photoUrl || alert.mediaUrl;
  const audio = alert.voiceNoteUrl || alert.audioUrl;

  const handleDownloadPhoto = () => {
    if (!photo) return;
    const link = document.createElement('a');
    link.href = photo;
    link.download = `Evidence-${alert.id}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAudio = () => {
    if (!audio) return;
    const link = document.createElement('a');
    link.href = audio;
    link.download = `VoiceDebrief-${alert.id}-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0B1E30] border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#071726] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`font-mono-code text-[11px] font-extrabold px-2.5 py-1 rounded-md flex-none uppercase ${
                alert.type === 'HIGH' || alert.priority === 'HIGH'
                  ? 'bg-rose-500 text-white animate-pulse'
                  : alert.type === 'MED' || alert.priority === 'MED'
                  ? 'bg-amber-400 text-[#071726]'
                  : 'bg-[#1FA6C9] text-[#042430]'
              }`}
            >
              {alert.type || alert.priority || 'ALERT'}
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base sm:text-lg text-white truncate">
                {alert.title}
              </h3>
              <p className="text-xs text-[#8598A8] flex items-center gap-2 mt-0.5">
                <span>📍 {alert.location}</span>
                <span>•</span>
                <span className="font-mono-code text-cyan-400">🕒 {alert.time}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8598A8] hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer flex-none"
            title="Close Alert View"
          >
            ✕
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Officer & Dispatch Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#071726]/60 border border-white/10 rounded-xl p-3 text-xs">
            <div>
              <span className="text-[#8598A8] block text-[10px] uppercase font-bold tracking-wider">
                Reporting Guard / Officer
              </span>
              <span className="font-semibold text-white mt-0.5 block">
                {alert.officerName || 'Tikedi Enrolled Guard'}
                {alert.officerGrade ? ` (${alert.officerGrade})` : ''}
              </span>
            </div>
            <div>
              <span className="text-[#8598A8] block text-[10px] uppercase font-bold tracking-wider">
                Deployment Location / Post
              </span>
              <span className="font-semibold text-cyan-300 mt-0.5 block">
                {alert.checkpointName || alert.routeTitle || alert.location}
              </span>
            </div>
          </div>

          {/* Description & Commentary */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold text-[#8598A8] uppercase tracking-wider">
              Alert Details &amp; Operational Brief
            </h4>
            <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {alert.description || 'No additional narrative recorded for this event.'}
            </div>
          </div>

          {/* Officer Submitted Commentary / Field Debrief */}
          {alert.commentary && (
            <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#3FC9E9] uppercase tracking-wider flex items-center gap-1.5">
                  <span>📝</span>
                  <span>Officer Submitted Commentary &amp; Debrief</span>
                </span>
                <span className="text-[10px] font-mono-code text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {alert.officerName || 'Field Officer'}
                </span>
              </div>
              <p className="text-sm text-cyan-50 leading-relaxed font-sans italic bg-black/30 p-3 rounded-lg border border-cyan-500/20">
                &ldquo;{alert.commentary}&rdquo;
              </p>
            </div>
          )}

          {/* Evidence Attachments Section */}
          <div className="space-y-3 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-[#8598A8] uppercase tracking-wider flex items-center gap-1.5">
                <span>Attached Field Evidence</span>
                {(photo || audio) ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono-code font-bold">
                    {(photo ? 1 : 0) + (audio ? 1 : 0)} Attached
                  </span>
                ) : (
                  <span className="text-[10px] text-[#8598A8] font-mono-code">None attached</span>
                )}
              </h4>
            </div>

            {!photo && !audio && (
              <div className="bg-[#051424]/60 border border-white/5 rounded-xl p-4 text-center text-xs text-[#8598A8]">
                <span>No media attachments (photo or audio) were submitted with this alert transmission.</span>
              </div>
            )}

            {/* Audio Voice Note Evidence */}
            {audio && (
              <div className="bg-[#051424] border border-cyan-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                    <span className="text-base">🎙️</span>
                    <span>Officer Audio Voice Note</span>
                    {alert.audioDurationSec ? (
                      <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {alert.audioDurationSec}s duration
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadAudio}
                    className="text-[11px] text-[#3FC9E9] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ⬇ Download Audio
                  </button>
                </div>

                <div className="pt-1">
                  <audio
                    controls
                    src={audio}
                    className="w-full h-10 rounded-lg outline-none bg-slate-900"
                    preload="auto"
                  />
                </div>
                <p className="text-[10px] text-[#8598A8] italic">
                  Encrypted high-fidelity voice transmission recorded directly from field officer terminal.
                </p>
              </div>
            )}

            {/* Photo Evidence */}
            {photo && (
              <div className="bg-[#051424] border border-white/10 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <span className="text-base">📷</span>
                    <span>Officer Camera Inspection Capture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPhotoZoomed(true)}
                      className="text-[11px] text-[#3FC9E9] hover:underline cursor-pointer"
                    >
                      🔍 Fullscreen
                    </button>
                    <span className="text-white/20">•</span>
                    <button
                      type="button"
                      onClick={handleDownloadPhoto}
                      className="text-[11px] text-[#3FC9E9] hover:underline cursor-pointer"
                    >
                      ⬇ Download
                    </button>
                  </div>
                </div>

                <div
                  className="relative group rounded-xl overflow-hidden border border-white/10 bg-black max-h-[320px] flex items-center justify-center cursor-pointer"
                  onClick={() => setIsPhotoZoomed(true)}
                >
                  <img
                    src={photo}
                    alt={alert.title}
                    className="max-h-[320px] w-auto max-w-full object-contain group-hover:scale-[1.02] transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1.5 transition-opacity">
                    <span>🔍 Click to expand full resolution</span>
                  </div>
                </div>
              </div>
            )}

            {!photo && !audio && (
              <div className="bg-[#071726]/40 border border-dashed border-white/10 rounded-xl p-5 text-center text-xs text-[#8598A8] space-y-1">
                <div className="text-xl">📋</div>
                <div className="font-semibold text-slate-300">Standard Telemetry Event</div>
                <div>No photo or voice debrief was attached by the reporting officer for this alert.</div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-white/10 bg-[#071726] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {onEscalateToIncident && (
              <button
                type="button"
                onClick={() => {
                  onEscalateToIncident(alert);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>⚠️</span>
                <span>Open Incident Docket</span>
              </button>
            )}

            {onDispatchUnit && (
              <button
                type="button"
                onClick={() => {
                  onDispatchUnit(alert.location);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1FA6C9]/20 hover:bg-[#1FA6C9]/30 text-[#3FC9E9] border border-[#1FA6C9]/40 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>🚔</span>
                <span>Dispatch Response</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                onDismiss(alert.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white cursor-pointer transition-colors"
            >
              Acknowledge &amp; Dismiss
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-slate-200 cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox */}
      {isPhotoZoomed && photo && (
        <div
          className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsPhotoZoomed(false)}
        >
          <div className="max-w-5xl max-h-[90vh] relative flex flex-col items-center">
            <img
              src={photo}
              alt="Fullscreen Evidence"
              className="max-h-[82vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/20"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPhoto}
                className="px-4 py-1.5 bg-[#1FA6C9] hover:bg-[#1994b4] text-[#042430] font-bold text-xs rounded-lg cursor-pointer"
              >
                ⬇ Download Full Resolution
              </button>
              <button
                type="button"
                onClick={() => setIsPhotoZoomed(false)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg cursor-pointer"
              >
                ✕ Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
