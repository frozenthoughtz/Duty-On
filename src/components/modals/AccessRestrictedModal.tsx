import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDutyOn } from '../../context/DutyOnContext';

interface AccessRestrictedModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetArea: 'control_room' | 'admin_data';
  onAccessGranted: () => void;
}

export const AccessRestrictedModal: React.FC<AccessRestrictedModalProps> = ({
  isOpen,
  onClose,
  targetArea,
  onAccessGranted
}) => {
  const { 
    currentUserProfile, 
    grantControlRoomAccess, 
    grantAdminAccess, 
    showToast, 
    broadcastControlRoomAlert 
  } = useDutyOn();

  const [supervisorPin, setSupervisorPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (supervisorPin === '1011' || supervisorPin === '9900') {
      if (targetArea === 'control_room') {
        grantControlRoomAccess();
        showToast('✓ Supervisor PIN accepted. Control Room clearance granted.');
      } else {
        grantAdminAccess();
        showToast('✓ Master Admin PIN accepted. Admin Data Hub unlocked.');
      }
      onAccessGranted();
      onClose();
    } else {
      setPinError(true);
      showToast('⚠️ Incorrect Supervisor PIN. Access denied.');
    }
  };

  const handleRequestClearance = () => {
    broadcastControlRoomAlert(
      `🔒 Access Clearance Requested`,
      `Officer ${currentUserProfile?.displayName || 'Field Officer'} requested authorization to access ${targetArea === 'control_room' ? 'Control Room Console' : 'Admin Data Hub'}`,
      'HQ Command',
      'MED'
    );
    setRequestSent(true);
    showToast('✓ Access authorization request transmitted to SOC Controller.');
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0A1E33] border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 grid place-items-center text-amber-400 font-bold text-lg">
              🛡️
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">
                {targetArea === 'control_room' ? 'Control Room Clearance Required' : 'Administrator Clearance Required'}
              </h2>
              <div className="text-[11px] text-amber-300 font-medium">
                Security Restriction · Role-Based Access Policy
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 grid place-items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="text-[#8598A8]">Current Authenticated User:</div>
            <div className="flex items-center justify-between font-medium">
              <span className="text-white font-bold">{currentUserProfile?.displayName || 'Field Officer'}</span>
              <span className="font-mono-code text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded uppercase font-semibold">
                {currentUserProfile?.role || 'officer'}
              </span>
            </div>
            <p className="text-[#9db0c0] leading-relaxed pt-1">
              {targetArea === 'control_room'
                ? 'Field Security Officers do not have permission to view or control the central SOC Control Room operations center unless specifically authorized by a Shift Commander or Administrator.'
                : 'The Admin Data Hub (Sites, Fleet, Geofences & Officer Registers) contains high-security system parameters restricted strictly to company executives and administrators.'}
            </p>
          </div>

          {/* Option 1: Supervisor PIN Override */}
          <form onSubmit={handleVerifyPin} className="space-y-2 bg-[#071726] border border-white/10 rounded-xl p-3.5">
            <label className="block text-xs font-semibold text-white">
              Authorize via Supervisor / Admin PIN
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                maxLength={6}
                value={supervisorPin}
                onChange={(e) => {
                  setSupervisorPin(e.target.value);
                  setPinError(false);
                }}
                placeholder="Enter 4-digit PIN (e.g. 1011)"
                className="flex-1 bg-[#0A1E33] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9] font-mono-code text-center tracking-widest"
              />
              <button
                type="submit"
                className="bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] px-3.5 py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors"
              >
                Unlock
              </button>
            </div>
            {pinError && (
              <p className="text-[11px] text-rose-400">Invalid PIN code. Please check with your duty controller.</p>
            )}
            <p className="text-[10px] text-[#8598A8]">
              Tip: Supervisor authorization override code is <code className="text-[#3FC9E9]">1011</code>.
            </p>
          </form>

          {/* Option 2: Request Clearance from SOC */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleRequestClearance}
              disabled={requestSent}
              className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl font-display font-semibold text-xs text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              <span>📡</span>
              <span>{requestSent ? 'Request Transmitted to SOC Control Room' : 'Request Clearance from SOC Dispatcher'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[#071726]/60 border-t border-white/10 flex items-center justify-between flex-none">
          <button
            onClick={onClose}
            className="text-xs text-[#8598A8] hover:text-white cursor-pointer"
          >
            ← Return to Officer App
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
