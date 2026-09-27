import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';

interface EmergencyDuressModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'duress' | 'man_down' | 'welfare_missed';
}

export const EmergencyDuressModal: React.FC<EmergencyDuressModalProps> = ({
  isOpen,
  onClose,
  type = 'duress'
}) => {
  const {
    clearDuressPanic,
    clearManDownSensor,
    resetWelfarePing,
    showToast
  } = useDutyOn();

  const [isSirenActive, setIsSirenActive] = useState(false);
  const [dispatchCountdown, setDispatchCountdown] = useState(30);
  const [isAutoDispatched, setIsAutoDispatched] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [overrideReason, setOverrideReason] = useState('FALSE_ALARM_USER_ERROR');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sirenIntervalRef = useRef<any>(null);

  // Siren Audio Synthesizer (Safe Web Audio API)
  useEffect(() => {
    if (isSirenActive) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();

          osc.type = 'sawtooth';
          gain.gain.value = 0.08; // Safe, gentle audible volume

          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();

          oscRef.current = osc;
          gainRef.current = gain;

          let high = false;
          sirenIntervalRef.current = setInterval(() => {
            if (oscRef.current && audioCtxRef.current) {
              oscRef.current.frequency.setValueAtTime(
                high ? 880 : 660,
                audioCtxRef.current.currentTime
              );
              high = !high;
            }
          }, 350);
        }
      } catch (err) {
        console.warn('Web Audio not allowed without user gesture');
      }
    } else {
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (e) {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    }

    return () => {
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
      if (oscRef.current) {
        try {
          oscRef.current.stop();
        } catch (e) {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [isSirenActive]);

  // Dispatch countdown timer
  useEffect(() => {
    let timer: any;
    if (isOpen && dispatchCountdown > 0 && !isAutoDispatched) {
      timer = setInterval(() => {
        setDispatchCountdown((c) => {
          if (c <= 1) {
            setIsAutoDispatched(true);
            showToast('🚨 Auto-dispatch triggered: Armed Response Unit AR-02 en route to Greenacres Mall!');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, dispatchCountdown, isAutoDispatched, showToast]);

  // Handle modal close & safety state clearance
  const handleClose = () => {
    setIsSirenActive(false);
    clearDuressPanic();
    clearManDownSensor();
    resetWelfarePing();
    onClose();
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeEscalate = () => {
    if (supervisorPin !== '1011') {
      showToast('⚠️ Invalid Supervisor PIN code. De-escalation denied.');
      return;
    }

    setIsSirenActive(false);
    clearDuressPanic();
    clearManDownSensor();
    resetWelfarePing();
    showToast(`✓ Duress condition cleared. Logged reason: ${overrideReason}.`);
    onClose();
  };

  const handleForceDispatchNow = () => {
    setIsAutoDispatched(true);
    setDispatchCountdown(0);
    showToast('🚨 Emergency armed vehicle AR-01 & Flying Squad (10111) patched and en route!');
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-[#0A1E33] border-2 border-rose-600 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(224,87,75,0.4)] text-white overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Urgent Emergency Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-[#0A1E33] border-b border-rose-600/50 flex items-center justify-between flex-none gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-600 text-white grid place-items-center shadow-lg shadow-rose-600/50 animate-bounce flex-none">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 stroke-current fill-none stroke-[2.4]" viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-sm sm:text-base text-white">
                  {type === 'duress' ? '🚨 LIVE OFFICER DURESS PANIC ALARM' :
                   type === 'man_down' ? '⚠️ MAN-DOWN ACCELEROMETER ALERT' :
                   '⏱️ WELFARE CHECK-IN MISSED'}
                </h2>
                <span className="font-mono-code text-[10px] sm:text-[11px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                  CODE RED
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-rose-200 mt-0.5">
                Lone worker life safety priority protocol activated · Control Room action mandatory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-none">
            <button
              type="button"
              onClick={() => setIsSirenActive(!isSirenActive)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-mono-code text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isSirenActive
                  ? 'bg-rose-600 text-white border-white animate-pulse'
                  : 'bg-white/10 text-rose-300 border-rose-500/30 hover:bg-white/15'
              }`}
              title="Toggle synthesized audible alert siren"
            >
              <span>{isSirenActive ? '🔊 Siren ON' : '🔈 Mute'}</span>
            </button>

            {/* Prominent Header Close Button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close emergency SOS modal"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-rose-600 active:scale-95 text-white grid place-items-center transition-all cursor-pointer text-sm font-bold border border-white/20 shadow-sm"
              title="Close SOS pop up screen"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Officer & Location Card */}
          <div className="bg-rose-950/30 border border-rose-600/30 rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] uppercase font-mono-code text-rose-300 font-bold">Distressed Guard</div>
                <div className="font-display font-bold text-base text-white mt-0.5">Sipho Nxumalo</div>
                <div className="text-xs text-[#b8c9d9]">PSIRA #2890141 · Armed Grade A</div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-mono-code text-rose-300 font-bold">Target Location</div>
                <div className="font-display font-bold text-sm text-white mt-0.5">Greenacres Mall</div>
                <div className="text-xs text-[#b8c9d9]">East Perimeter · Tag #SF-4410</div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-mono-code text-rose-300 font-bold">GPS Coordinates</div>
                <div className="font-mono-code text-xs text-[#3FC9E9] mt-0.5">-33.9608, 25.6022</div>
                <div className="text-[11px] text-[#5BCB80]">Geofence Lock: Confirmed</div>
              </div>
            </div>
          </div>

          {/* Emergency Dispatch Countdown Strip */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isAutoDispatched
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : 'bg-amber-950/40 border-amber-500/40'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{isAutoDispatched ? '✓ ARMED RESPONSE FLEET DISPATCHED' : '⏱️ AUTO-DISPATCH ESCALATION COUNTDOWN'}</span>
                  {!isAutoDispatched && (
                    <span className="font-mono-code text-sm text-amber-300 font-extrabold">
                      {dispatchCountdown}s
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#b8c9d9] mt-0.5">
                  {isAutoDispatched
                    ? 'Unit AR-02 (Alpha 2) en route · ETA: 2 mins · Priority 1 Armed Intervention'
                    : 'Armed patrol unit will auto-deploy if alarm is not de-escalated within the countdown.'}
                </p>
              </div>

              {!isAutoDispatched && (
                <button
                  onClick={handleForceDispatchNow}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/40"
                >
                  ⚡ Dispatch Immediately
                </button>
              )}
            </div>
          </div>

          {/* Quick Tactical Hotkeys */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => showToast('Connecting to SAPS 10111 Port Elizabeth Flying Squad…')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-base mb-1">🚔</div>
              <div className="font-bold text-white">SAPS Flying Squad</div>
              <div className="text-[10px] text-[#8598A8]">Speed-dial 10111 dispatch</div>
            </button>

            <button
              onClick={() => showToast('Paging Netcare 911 Paramedic dispatch desk…')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-base mb-1">🚑</div>
              <div className="font-bold text-white">Netcare 911 / EMS</div>
              <div className="text-[10px] text-[#8598A8]">Medical trauma response</div>
            </button>

            <button
              onClick={() => showToast('Direct two-way PTT audio broadcast opened with Sipho Nxumalo.')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-base mb-1">🎙️</div>
              <div className="font-bold text-white">Priority Radio Patch</div>
              <div className="text-[10px] text-[#8598A8]">VHF Channel 1 Open mic</div>
            </button>
          </div>

          {/* Supervisor De-escalation & Override Section */}
          <div className="bg-[#071726] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-xs text-white">
                Supervisor Override &amp; De-Escalation
              </span>
              <span className="text-[11px] font-mono-code text-[#8598A8]">
                Demo PIN: <strong className="text-[#3FC9E9]">1011</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#8598A8] mb-1">Audit Justification</label>
                <select
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#1FA6C9] outline-none"
                >
                  <option value="FALSE_ALARM_USER_ERROR">Accidental Pocket Press / False Alarm</option>
                  <option value="OFFICER_CONFIRMED_SAFE">Officer Spoken To — Confirmed Safe</option>
                  <option value="ROUTINE_DRILL">Scheduled SOP Test / Duress Drill</option>
                  <option value="SITUATION_RESOLVED_ON_SCENE">Perimeter Inspected — All Clear</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#8598A8] mb-1">Supervisor PIN Verification</label>
                <input
                  type="password"
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  placeholder="Enter 4-digit PIN (1011)"
                  className="w-full bg-[#0A1E33] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono-code focus:border-[#1FA6C9] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleDeEscalate}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
              >
                ✓ De-escalate &amp; Clear Duress Alarm
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-[#071726] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8598A8] flex-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping flex-none" />
            <span className="text-[11px]">Audited &amp; cryptographically signed event</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-display font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer border border-white/15"
          >
            Close / Dismiss SOS Screen
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
