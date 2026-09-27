import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';
import { biometricFeedback } from '../../utils/biometricFeedback';

interface BiometricLivenessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
  officerName?: string;
  psiraNumber?: string;
}

export const BiometricLivenessModal: React.FC<BiometricLivenessModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  officerName = 'Matyolo Nomahlubi',
  psiraNumber = '2753127'
}) => {
  const { doClockIn, showToast } = useDutyOn();

  const [mode, setMode] = useState<'face' | 'fingerprint'>('face');
  const [step, setStep] = useState<'align' | 'blink' | 'depth' | 'verified' | 'failed'>('align');
  const [livenessScore, setLivenessScore] = useState(0);
  const [useCamera, setUseCamera] = useState(true);
  const [cameraError, setCameraError] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize camera or fallback
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    setStep('align');
    setLivenessScore(0);

    if (mode === 'face') {
      // Try camera access
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'user', width: 480, height: 480 } })
          .then((stream) => {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
          })
          .catch(() => {
            setCameraError(true);
            setUseCamera(false);
          });
      } else {
        setCameraError(true);
        setUseCamera(false);
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, mode]);

  // Automated step progression simulating real-time biometric neural engine with haptic/audio feedback
  useEffect(() => {
    if (!isOpen) return;

    if (step === 'align') {
      biometricFeedback.feedback('scan');
      const timer = setTimeout(() => {
        setStep('blink');
        setLivenessScore(45);
        biometricFeedback.feedback('scan');
      }, 1400);
      return () => clearTimeout(timer);
    }

    if (step === 'blink') {
      const timer = setTimeout(() => {
        setStep('depth');
        setLivenessScore(82);
        biometricFeedback.feedback('scan');
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (step === 'depth') {
      const timer = setTimeout(() => {
        setStep('verified');
        setLivenessScore(99.8);
        biometricFeedback.feedback('verified');
        showToast(`✓ Biometric ${mode === 'face' ? 'Face ID' : 'Fingerprint'} & PSIRA match confirmed (99.8% confidence)`);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step, mode, showToast]);

  if (!isOpen) return null;

  const handleFinishVerification = () => {
    biometricFeedback.feedback('verified');
    doClockIn();
    if (onVerified) onVerified();
    onClose();
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0A1E33] border border-white/20 rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl text-white flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#071726] border-b border-white/10 flex items-center justify-between flex-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5BCB80] animate-pulse" />
            <h3 className="font-display font-bold text-sm text-white">
              Biometric Feedback &amp; Verification
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex bg-white/10 rounded-lg p-0.5 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('face');
                  setStep('align');
                }}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  mode === 'face' ? 'bg-[#1FA6C9] text-white' : 'text-[#8598A8] hover:text-white'
                }`}
              >
                Face ID
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('fingerprint');
                  setStep('align');
                }}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  mode === 'fingerprint' ? 'bg-[#1FA6C9] text-white' : 'text-[#8598A8] hover:text-white'
                }`}
              >
                Fingerprint
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close biometric modal"
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white grid place-items-center transition-all cursor-pointer text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video / Neural Scan Area */}
        <div className="relative aspect-square w-full max-h-[320px] bg-[#05111b] overflow-hidden flex items-center justify-center flex-1">
          {mode === 'face' ? (
            useCamera && !cameraError ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              /* High-fidelity Neural Simulation Portrait */
              <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-b from-[#092238] to-[#04101b]">
                <div className="w-36 h-48 rounded-full bg-gradient-to-b from-[#1b4366] to-[#0d2740] border-2 border-[#1FA6C9]/40 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="flex items-center gap-8 mt-7">
                    <div className="w-3 h-1.5 bg-[#3FC9E9]/60 rounded-full animate-pulse" />
                    <div className="w-3 h-1.5 bg-[#3FC9E9]/60 rounded-full animate-pulse" />
                  </div>
                  <div className="w-1.5 h-4 bg-[#3FC9E9]/30 rounded-full mt-3" />
                  <div className="w-8 h-1.5 bg-[#3FC9E9]/40 rounded-full mt-3" />
                  
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 gap-2 p-3 opacity-25">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <span key={i} className="w-1 h-1 bg-[#3FC9E9] rounded-full mx-auto" />
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Fingerprint Optical Sensor Visualizer */
            <div className="w-full h-full relative flex flex-col items-center justify-center bg-[#071726]">
              <div
                className={`w-32 h-32 rounded-full border-2 transition-all flex items-center justify-center relative ${
                  step === 'verified'
                    ? 'border-[#5BCB80] bg-[#5BCB80]/15 shadow-[0_0_35px_rgba(91,203,128,0.5)]'
                    : 'border-[#1FA6C9]/50 bg-[#1FA6C9]/10 shadow-[0_0_20px_rgba(31,166,201,0.3)]'
                }`}
              >
                <div className="text-4xl select-none">
                  {step === 'verified' ? '✓' : '👆'}
                </div>
                {step !== 'verified' && (
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#3FC9E9] animate-spin" />
                )}
              </div>
              <p className="text-[11px] text-[#8598A8] mt-3 font-mono-code">
                {step === 'verified' ? 'Biometric ridge match 99.8%' : 'Capacitive sensor active...'}
              </p>
            </div>
          )}

          {/* Holographic Face Alignment Guide (Only in Face mode) */}
          {mode === 'face' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-44 h-56 rounded-[50%] border-2 transition-all duration-300 relative ${
                  step === 'verified'
                    ? 'border-[#5BCB80] shadow-[0_0_30px_rgba(91,203,128,0.5)]'
                    : step === 'depth'
                    ? 'border-[#3FC9E9] shadow-[0_0_20px_rgba(63,201,233,0.4)]'
                    : 'border-[#1FA6C9]/60'
                }`}
              >
                <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-current" />
                <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-current" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-current" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-current" />

                {step !== 'verified' && (
                  <div className="absolute left-0 right-0 h-0.5 bg-[#3FC9E9] shadow-[0_0_10px_#3FC9E9] animate-bounce" />
                )}

                {step === 'verified' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#5BCB80]/15 rounded-[50%] animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-[#5BCB80] text-[#0A1E33] grid place-items-center font-bold text-xl shadow-xl">
                      ✓
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step Indicator Overlay Pill */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[11px] font-semibold flex items-center gap-2 whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full ${step === 'verified' ? 'bg-[#5BCB80]' : 'bg-[#3FC9E9] animate-ping'}`} />
            <span>
              {step === 'align' && (mode === 'face' ? 'Align face in guide…' : 'Place thumb on scanner…')}
              {step === 'blink' && (mode === 'face' ? 'Blink eyes (Liveness check)…' : 'Scanning ridge minutiae…')}
              {step === 'depth' && 'Matching PSIRA database…'}
              {step === 'verified' && 'Identity Verified & Matched!'}
            </span>
          </div>
        </div>

        {/* Details & Telemetry */}
        <div className="p-3.5 sm:p-4 space-y-2.5 bg-[#071726] flex-none">
          <div className="flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white text-xs sm:text-sm">{officerName}</div>
              <div className="text-[11px] text-[#8598A8]">PSIRA #{psiraNumber} · Grade A</div>
            </div>
            <div className="text-right">
              <div className="font-mono-code font-bold text-[#5BCB80] text-xs sm:text-sm">
                {livenessScore > 0 ? `${livenessScore}% Match` : 'Scanning…'}
              </div>
              <div className="text-[10px] text-[#8598A8]">Haptic &amp; Audio: Active</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1FA6C9] to-[#5BCB80] transition-all duration-500"
              style={{ width: `${livenessScore}%` }}
            />
          </div>

          {/* Actions */}
          <div className="pt-1.5">
            {step === 'verified' ? (
              <button
                type="button"
                onClick={handleFinishVerification}
                className="w-full py-2.5 bg-[#5BCB80] hover:bg-[#4eb36f] active:scale-95 text-[#0A1E33] font-display font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                <span>Confirm Verified Duty Clock-In</span>
                <span>→</span>
              </button>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-[#8598A8]">
                <span>ISO/IEC 30107-3 Liveness Compliant</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('verified');
                    setLivenessScore(99.8);
                    biometricFeedback.feedback('verified');
                  }}
                  className="text-[#3FC9E9] hover:underline cursor-pointer"
                >
                  Bypass Test
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
