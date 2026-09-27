import React, { useState } from 'react';
import { useDutyOn } from '../context/DutyOnContext';
import { MobilePatrolScreen } from './MobilePatrolScreen';
import { BiometricLivenessModal } from './modals/BiometricLivenessModal';
import { DocumentUploader } from './DocumentUploader';
import { DocumentViewerModal } from './DocumentViewerModal';
import { DocumentItem } from '../types/dutyon';
import { 
  Camera, 
  UploadCloud, 
  FileText, 
  Eye, 
  Award, 
  Search, 
  Lock 
} from 'lucide-react';

export const MobileScreens: React.FC = () => {
  const { 
    mobileScreen, 
    setMobileScreen, 
    officer, 
    doClockIn, 
    doClockOut,
    currentUserProfile,
    setIsAuthModalOpen,
    upcomingShifts,
    leaveBalances,
    leaveRequest,
    updateLeaveRequest,
    submitLeave,
    payQuery,
    updatePayQuery,
    submitPayQuery,
    documents,
    addDocument,
    deleteDocument,
    obSite,
    obEntries,
    currentOBNote,
    setCurrentOBNote,
    addOBEntry,
    checkpoints,
    currentCheckpointIndex,
    scanCurrentCheckpoint,
    reportPatrolException,
    messages,
    sendMessage,
    isPTTLive,
    setIsPTTLive,
    setIsNewIncidentModalOpen,
    showToast
  } = useDutyOn();

  const [messageInput, setMessageInput] = React.useState('');
  const [mobileChatFilter, setMobileChatFilter] = React.useState<'all' | 'site' | 'control_room'>('all');
  const [mobileChatTarget, setMobileChatTarget] = React.useState<'control_room' | 'site'>('control_room');
  const [isUrgentMsg, setIsUrgentMsg] = React.useState(false);
  const [isLivenessModalOpen, setIsLivenessModalOpen] = useState(false);
  const [isDocumentUploaderOpen, setIsDocumentUploaderOpen] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState<DocumentItem | null>(null);
  const [docFilterCategory, setDocFilterCategory] = useState<string>('all');
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');

  // ----------------------------------------------------
  // CLOCK IN SCREEN
  // ----------------------------------------------------
  if (mobileScreen === 'clockin') {
    return (
      <div className="p-4 space-y-4">
        <div className="font-display font-extrabold text-xl text-[#0B1E30]">
          Verified Attendance
        </div>

        {/* Face ID Graphic */}
        <div className="text-center py-2">
          <div className="w-[150px] h-[150px] rounded-full mx-auto relative grid place-items-center bg-gradient-to-br from-[#1b4e77] to-[#0e2a45] border-4 border-[#3AA655] shadow-[0_0_0_6px_rgba(58,166,85,0.12)]">
            <svg className="w-[90px] h-[90px] stroke-[#8fb6cf] fill-none stroke-[1.5]" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7" />
            </svg>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#3AA655] grid place-items-center shadow-md">
              <svg className="w-4 h-4 stroke-white fill-none stroke-3" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 text-[#2c7a41] font-display font-bold text-base mt-4">
            <svg className="w-4 h-4 stroke-[#3AA655] fill-none stroke-[2.6]" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Identity verified (Face ID Match 99.4%)</span>
          </div>
        </div>

        {/* Geofence Detection Card */}
        <div className="flex items-center gap-3 bg-[#eaf6ee] border border-[#cfeAD8] rounded-xl p-3.5">
          <div className="w-8 h-8 rounded-lg bg-white grid place-items-center flex-none shadow-xs">
            <svg className="w-4 h-4 stroke-[#3AA655] fill-none stroke-[1.9]" viewBox="0 0 24 24">
              <path d="M12 21c4-3 7-6 7-10a7 7 0 10-14 0c0 4 3 7 7 10z" />
              <circle cx="12" cy="11" r="2.5" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-[#0B1E30]">Within site perimeter — 18 m</div>
            <div className="text-[11px] text-[#5D6E7E] truncate">{officer.currentSite || 'Assigned Site'} · Geofence Active</div>
          </div>
          <svg className="w-5 h-5 stroke-[#3AA655] fill-none stroke-[2.4] flex-none" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* 3-Column Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-[#e9eef3] rounded-xl p-2.5 text-center shadow-xs">
            <div className="text-[10px] text-[#8598A8] uppercase tracking-wider font-semibold">Clock-in</div>
            <div className="font-display font-extrabold text-sm sm:text-base text-[#0B1E30] mt-0.5">
              {officer.clockInTime}
            </div>
          </div>
          <div className="bg-white border border-[#e9eef3] rounded-xl p-2.5 text-center shadow-xs">
            <div className="text-[10px] text-[#8598A8] uppercase tracking-wider font-semibold">Shift</div>
            <div className="font-display font-extrabold text-xs sm:text-sm text-[#0B1E30] mt-0.5">
              {officer.shiftHours}
            </div>
          </div>
          <div className="bg-white border border-[#e9eef3] rounded-xl p-2.5 text-center shadow-xs">
            <div className="text-[10px] text-[#8598A8] uppercase tracking-wider font-semibold">Hours today</div>
            <div className="font-display font-extrabold text-sm sm:text-base text-[#0B1E30] mt-0.5">
              {officer.hoursToday}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          {officer.isClockedIn ? (
            <div className="space-y-2">
              <div className="bg-[#eaf6ee] border border-[#3AA655]/30 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3AA655] animate-pulse" />
                  <span className="text-xs font-bold text-[#2c7a41]">Actively on Duty at Post</span>
                </div>
                <span className="text-[11px] font-mono-code font-bold text-[#2c7a41]">
                  Since {officer.clockInTime}
                </span>
              </div>

              <button
                onClick={doClockOut}
                className="w-full py-3.5 px-4 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>🚪</span>
                <span>Clock Out &amp; Complete Shift Handover</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setIsLivenessModalOpen(true)}
                className="w-full py-3.5 px-4 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] shadow-[#1FA6C9]/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg className="w-5 h-5 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Scan Face ID &amp; Clock In</span>
              </button>

              <button
                onClick={doClockIn}
                className="w-full text-center text-[11px] text-[#5D6E7E] hover:text-[#0B1E30] py-1 cursor-pointer"
              >
                (Quick 1-click fallback clock-in)
              </button>
            </div>
          )}
        </div>

        {/* Biometric Liveness Scanner Modal */}
        <BiometricLivenessModal
          isOpen={isLivenessModalOpen}
          onClose={() => setIsLivenessModalOpen(false)}
          officerName={officer.name}
          psiraNumber={officer.grade}
          onVerified={() => {
            doClockIn();
            showToast('✓ Identity verified via live camera & PSIRA registry — Clocked In');
          }}
        />

        {/* Attendance History */}
        <div>
          <div className="font-display font-bold text-xs text-[#20364A] mb-2">
            Attendance history
          </div>
          <div className="bg-white border border-[#e9eef3] rounded-2xl divide-y divide-[#eef2f6] shadow-xs">
            <div className="flex items-center gap-3 p-3">
              <span className="w-6 h-6 rounded-full bg-[#eaf6ee] grid place-items-center flex-none">
                <svg className="w-3.5 h-3.5 stroke-[#3AA655] fill-none stroke-[2.4]" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="flex-1">
                <div className="font-semibold text-xs text-[#0B1E30]">Wed, 21 May 2026</div>
                <div className="text-[11px] text-[#8598A8]">05:58 – 17:59</div>
              </div>
              <div className="font-mono-code font-semibold text-xs text-[#20364A]">12.01 hrs</div>
            </div>

            <div className="flex items-center gap-3 p-3">
              <span className="w-6 h-6 rounded-full bg-[#eaf6ee] grid place-items-center flex-none">
                <svg className="w-3.5 h-3.5 stroke-[#3AA655] fill-none stroke-[2.4]" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="flex-1">
                <div className="font-semibold text-xs text-[#0B1E30]">Tue, 20 May 2026</div>
                <div className="text-[11px] text-[#8598A8]">05:57 – 17:52</div>
              </div>
              <div className="font-mono-code font-semibold text-xs text-[#20364A]">11.92 hrs</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROSTER SCREEN
  // ----------------------------------------------------
  if (mobileScreen === 'roster') {
    return (
      <div className="p-4 space-y-3.5">
        <div className="font-display font-extrabold text-xl text-[#0B1E30]">
          My Roster
        </div>

        <div className="text-xs font-bold text-[#20364A]">Current shift</div>

        {/* Current Shift Hero Card */}
        <div className="bg-[#0A1E33] border border-white/10 rounded-2xl p-4 text-white shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center flex-none">
              <svg className="w-5 h-5 stroke-[#3FC9E9] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="font-display font-bold text-base leading-snug">
                  {officer.currentSite || 'Assigned Site'}
                </div>
                <span className="font-mono-code text-[10px] font-semibold tracking-wider bg-[#5BCB80]/15 text-[#5BCB80] px-2 py-0.5 rounded">
                  CONFIRMED
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap mt-3 text-xs text-[#b7c8d6]">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M8 2v4M16 2v4M3 10h18" />
              </svg>
              Today's Roster
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {officer.shiftHours || '06:00 – 18:00'}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <path d="M12 3l8 3v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
              </svg>
              {officer.grade || 'Grade A/B/C'}
            </span>
          </div>

          <div
            onClick={() => showToast(`Opening ${officer.currentSite || 'site'} profile & SOPs…`)}
            className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#cfe0ec] cursor-pointer hover:text-white"
          >
            <span>📍 View site profile &amp; SOPs</span>
            <span>›</span>
          </div>
        </div>

        {/* Upcoming Shifts */}
        <div className="text-xs font-bold text-[#20364A] pt-1">
          Upcoming shifts
        </div>

        <div className="space-y-2">
          {upcomingShifts.map((shift) => (
            <div
              key={shift.id}
              className="flex items-center gap-3 bg-white border border-[#e9eef3] rounded-2xl p-3 shadow-xs"
            >
              <div className="w-11 h-11 rounded-xl bg-[#eef6f9] flex flex-col items-center justify-center flex-none">
                <span className="font-display font-extrabold text-base text-[#0E2A45] leading-none">
                  {shift.dayNum}
                </span>
                <span className="text-[9px] font-semibold text-[#8598A8] uppercase">
                  {shift.dayName}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[#0B1E30] truncate">{shift.siteName}</div>
                <div className="text-[11px] text-[#5D6E7E] truncate">{shift.timeWindow} · {shift.grade}</div>
              </div>
              <span className="font-mono-code text-[10px] font-semibold tracking-wider bg-[#5BCB80]/15 text-[#2c7a41] px-2 py-0.5 rounded">
                CONFIRMED
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LEAVE SCREEN
  // ----------------------------------------------------
  if (mobileScreen === 'leave') {
    return (
      <div className="p-4 space-y-3.5">
        <div className="font-display font-extrabold text-xl text-[#0B1E30]">
          Leave Request
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white border border-[#e9eef3] rounded-2xl p-3 shadow-xs">
            <div className="text-xs text-[#5D6E7E] flex items-center gap-1.5 font-medium">
              <svg className="w-3.5 h-3.5 stroke-[#1FA6C9] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M8 2v4M16 2v4" />
              </svg>
              Annual leave
            </div>
            <div className="font-display font-extrabold text-2xl text-[#0B1E30] mt-1">
              {leaveBalances.annual} <small className="text-xs text-[#5D6E7E] font-normal">days</small>
            </div>
          </div>

          <div className="bg-white border border-[#e9eef3] rounded-2xl p-3 shadow-xs">
            <div className="text-xs text-[#5D6E7E] flex items-center gap-1.5 font-medium">
              <svg className="w-3.5 h-3.5 stroke-[#3AA655] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <path d="M12 21C7 17 4 14 4 10a4 4 0 018-1 4 4 0 018 1c0 4-3 7-8 11z" />
              </svg>
              Sick leave
            </div>
            <div className="font-display font-extrabold text-2xl text-[#0B1E30] mt-1">
              {leaveBalances.sick} <small className="text-xs text-[#5D6E7E] font-normal">days</small>
            </div>
          </div>
        </div>

        {/* Leave Form */}
        <div className="bg-white border border-[#e9eef3] rounded-2xl p-3.5 space-y-3 shadow-xs">
          <div>
            <label className="block text-xs font-semibold text-[#20364A] mb-1">
              Leave type <span className="text-[#E0574B]">*</span>
            </label>
            <select
              value={leaveRequest.leaveType}
              onChange={(e) => updateLeaveRequest({ leaveType: e.target.value })}
              className="w-full bg-[#f8fafc] border border-[#dbe4ec] rounded-xl px-3 py-2 text-xs text-[#0B1E30] focus:outline-none focus:border-[#1FA6C9]"
            >
              <option>Sick Leave</option>
              <option>Annual Leave</option>
              <option>Family Responsibility</option>
              <option>Study Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#20364A] mb-1">
                Start date <span className="text-[#E0574B]">*</span>
              </label>
              <input
                type="text"
                value={leaveRequest.startDate}
                onChange={(e) => updateLeaveRequest({ startDate: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#dbe4ec] rounded-xl px-3 py-2 text-xs text-[#0B1E30]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#20364A] mb-1">
                End date <span className="text-[#E0574B]">*</span>
              </label>
              <input
                type="text"
                value={leaveRequest.endDate}
                onChange={(e) => updateLeaveRequest({ endDate: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#dbe4ec] rounded-xl px-3 py-2 text-xs text-[#0B1E30]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#20364A] mb-1">
              Reason <span className="text-[#E0574B]">*</span>
            </label>
            <textarea
              rows={2}
              value={leaveRequest.reason}
              onChange={(e) => updateLeaveRequest({ reason: e.target.value })}
              className="w-full bg-[#f8fafc] border border-[#dbe4ec] rounded-xl p-2.5 text-xs text-[#0B1E30] resize-none"
            />
          </div>

          {/* Attachment */}
          <div className="flex items-center gap-2 bg-[#f3f7fa] border border-dashed border-[#ccd8e2] rounded-xl p-2.5 text-xs text-[#20364A]">
            <svg className="w-4 h-4 stroke-[#5D6E7E] fill-none stroke-[1.8]" viewBox="0 0 24 24">
              <path d="M8 12l6-6a3 3 0 014 4l-7 7a5 5 0 01-7-7l7-7" />
            </svg>
            <span className="truncate">{leaveRequest.attachmentName}</span>
            <span className="ml-auto text-[11px] text-[#8598A8]">{leaveRequest.attachmentSize}</span>
          </div>

          <button
            onClick={submitLeave}
            className="w-full bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-display font-bold text-sm py-3 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Submit request
          </button>
        </div>

        {/* Stepper Status Card */}
        <div className="bg-white border border-[#e9eef3] rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-[#20364A] mb-3">Request status</div>
          <div className="relative flex justify-between items-start">
            <div className="absolute top-3.5 left-[14%] right-[14%] h-[2px] bg-[#e2e9ef] z-0" />

            {/* Step 1: Draft */}
            <div className="flex flex-col items-center gap-1.5 z-10 w-1/3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                leaveRequest.step >= 1 ? 'bg-[#1FA6C9] border-[#1FA6C9] text-white' : 'border-[#1FA6C9] text-[#1FA6C9] bg-white'
              }`}>
                {leaveRequest.step >= 1 ? (
                  <svg className="w-3.5 h-3.5 stroke-white fill-none stroke-[2.4]" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                    <path d="M4 20l4-1L18 9l-3-3L5 16z" />
                  </svg>
                )}
              </div>
              <div className="text-[11px] font-bold text-[#20364A]">Draft</div>
              <div className="text-[9.5px] text-[#8598A8] text-center">Your request</div>
            </div>

            {/* Step 2: Supervisor */}
            <div className="flex flex-col items-center gap-1.5 z-10 w-1/3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                leaveRequest.step === 1 ? 'border-[#1FA6C9] text-[#1FA6C9] bg-white' : 
                leaveRequest.step > 1 ? 'bg-[#1FA6C9] border-[#1FA6C9] text-white' : 
                'border-[#e2e9ef] text-[#8598A8] bg-white'
              }`}>
                <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="3.2" />
                  <path d="M5 20c0-3.5 3-5 7-5s7 1.5 7 5" />
                </svg>
              </div>
              <div className="text-[11px] font-bold text-[#20364A]">Supervisor</div>
              <div className="text-[9.5px] text-[#8598A8] text-center">
                {leaveRequest.step === 1 ? 'Pending review' : 'Awaiting submission'}
              </div>
            </div>

            {/* Step 3: HR Approval */}
            <div className="flex flex-col items-center gap-1.5 z-10 w-1/3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                leaveRequest.step >= 2 ? 'bg-[#1FA6C9] border-[#1FA6C9] text-white' : 'border-[#e2e9ef] text-[#8598A8] bg-white'
              }`}>
                <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 00-8 0v2M13 7a3 3 0 11-6 0 3 3 0 016 0" />
                </svg>
              </div>
              <div className="text-[11px] font-bold text-[#20364A]">HR</div>
              <div className="text-[9.5px] text-[#8598A8] text-center">Final approval</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // PAY QUERY SCREEN
  // ----------------------------------------------------
  if (mobileScreen === 'payquery') {
    return (
      <div className="p-4 space-y-3.5">
        <div className="font-display font-extrabold text-xl text-[#0B1E30]">
          Pay Query
        </div>

        <div className="bg-white border border-[#e9eef3] rounded-2xl p-4 space-y-3 shadow-xs">
          <div>
            <label className="block text-xs font-semibold text-[#20364A] mb-1">
              Payslip period <span className="text-[#E0574B]">*</span>
            </label>
            <select
              value={payQuery.payslipPeriod}
              onChange={(e) => updatePayQuery({ payslipPeriod: e.target.value })}
              className="w-full bg-[#f8fafc] border border-[#dbe4ec] rounded-xl px-3 py-2 text-xs text-[#0B1E30]"
            >
              <option>August 2026</option>
              <option>July 2026</option>
              <option>June 2026</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#20364A] mb-1">
              Issue type <span className="text-[#E0574B]">*</span>
            </label>
            <select
              value={payQuery.issueType}
              onChange={(e) => updatePayQuery({ issueType: e.target.value })}
              className="w-full bg-[#f8fafc] border border-[#dbe4ec] rounded-xl px-3 py-2 text-xs text-[#0B1E30]"
            >
              <option>Overtime hours</option>
              <option>Missing shift</option>
              <option>Deduction query</option>
              <option>Sunday / Public Holiday rate</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#20364A] mb-1">
                Expected hours <span className="text-[#E0574B]">*</span>
              </label>
              <input
                type="number"
                value={payQuery.expectedHours}
                onChange={(e) => updatePayQuery({ expectedHours: Number(e.target.value) })}
                className="w-full bg-[#f8fafc] border border-[#dbe4ec] rounded-xl px-3 py-2 text-xs text-[#0B1E30]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#20364A] mb-1">
                Paid hours <span className="text-[#E0574B]">*</span>
              </label>
              <input
                type="number"
                value={payQuery.paidHours}
                onChange={(e) => updatePayQuery({ paidHours: Number(e.target.value) })}
                className="w-full bg-[#f8fafc] border border-[#dbe4ec] rounded-xl px-3 py-2 text-xs text-[#0B1E30]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#20364A] mb-1">
              Message <span className="text-[#E0574B]">*</span>
            </label>
            <textarea
              rows={2}
              value={payQuery.message}
              onChange={(e) => updatePayQuery({ message: e.target.value })}
              className="w-full bg-[#f8fafc] border border-[#dbe4ec] rounded-xl p-2.5 text-xs text-[#0B1E30] resize-none"
            />
          </div>

          {/* Timesheet Attachment */}
          <div className="flex items-center gap-2 bg-[#f3f7fa] border border-dashed border-[#ccd8e2] rounded-xl p-2.5 text-xs text-[#20364A]">
            <svg className="w-4 h-4 stroke-[#5D6E7E] fill-none stroke-[1.8]" viewBox="0 0 24 24">
              <path d="M8 12l6-6a3 3 0 014 4l-7 7a5 5 0 01-7-7l7-7" />
            </svg>
            <span className="truncate">{payQuery.attachmentName}</span>
            <span className="ml-auto text-[11px] text-[#8598A8]">168 KB</span>
          </div>

          <button
            onClick={submitPayQuery}
            className="w-full bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-display font-bold text-sm py-3 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Submit query
          </button>
        </div>

        {/* Active Case Card */}
        {payQuery.caseId && (
          <div className="flex items-center gap-3 bg-[#eaf6ee] border border-[#d3ecdb] rounded-2xl p-3.5 animate-fade-in shadow-xs">
            <div className="w-10 h-10 rounded-full bg-[#1FA6C9] grid place-items-center flex-none">
              <svg className="w-5 h-5 stroke-white fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <path d="M4 12a8 8 0 0116 0v5a2 2 0 01-2 2h-1v-6h3M4 12v5a2 2 0 002 2h1v-6H4" />
              </svg>
            </div>
            <div>
              <div className="font-display font-bold text-xs text-[#0B1E30]">
                Case {payQuery.caseId} · <span className="text-[#2c7a41]">{payQuery.status}</span>
              </div>
              <div className="text-[11px] text-[#5D6E7E] mt-0.5">
                Submitted {payQuery.submittedAt} · We'll notify you when there's an update.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // DOCUMENTS SCREEN
  // ----------------------------------------------------
  if (mobileScreen === 'documents') {
    const filteredDocs = documents.filter((doc) => {
      const matchesCategory = 
        docFilterCategory === 'all' ||
        (docFilterCategory === 'expiring' && doc.expiresSoon) ||
        doc.category.toLowerCase().includes(docFilterCategory.toLowerCase());
      
      const matchesSearch = 
        !searchDocQuery.trim() ||
        doc.name.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
        (doc.issuingAuthority && doc.issuingAuthority.toLowerCase().includes(searchDocQuery.toLowerCase())) ||
        (doc.certificateNumber && doc.certificateNumber.toLowerCase().includes(searchDocQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });

    const certCount = documents.filter(d => d.category.toLowerCase().includes('training') || d.category.toLowerCase().includes('firearm')).length;
    const idCount = documents.filter(d => d.category.toLowerCase().includes('id') || d.category.toLowerCase().includes('identification')).length;
    const psiraCount = documents.filter(d => d.category.toLowerCase().includes('psira')).length;
    const expiringCount = documents.filter(d => d.expiresSoon).length;

    return (
      <div className="p-4 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display font-extrabold text-xl text-[#0B1E30]">
              My Documents
            </div>
            <div className="text-[11px] text-[#55697A]">
              Officer credentials &amp; compliance certificates
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full text-[10px] font-bold">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Firestore Vault</span>
          </div>
        </div>

        {/* Capture / Upload Callout Card */}
        <div className="bg-gradient-to-br from-[#0B1E30] to-[#123A5E] text-white p-4 rounded-2xl shadow-sm border border-[#1b4369] space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/25 border border-blue-400/30 grid place-items-center text-blue-300">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Document Uploader</span>
                  <span className="bg-blue-400/25 text-blue-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                    Camera Live
                  </span>
                </div>
                <div className="text-[11px] text-blue-100/80">
                  Capture training certificates &amp; IDs using your camera
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={() => setIsDocumentUploaderOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Photo</span>
            </button>

            <button
              onClick={() => setIsDocumentUploaderOpen(true)}
              className="w-full bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 border border-white/15 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8598A8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchDocQuery}
            onChange={(e) => setSearchDocQuery(e.target.value)}
            placeholder="Search documents by name, serial, or authority..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#d7e2ec] text-[#0B1E30] text-xs placeholder:text-[#8598A8] focus:outline-hidden focus:border-[#2b6cb0]"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <button
            onClick={() => setDocFilterCategory('all')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
              docFilterCategory === 'all'
                ? 'bg-[#0B1E30] text-white shadow-xs'
                : 'bg-white text-[#55697A] border border-[#d7e2ec] hover:bg-[#f1f5f9]'
            }`}
          >
            All ({documents.length})
          </button>
          <button
            onClick={() => setDocFilterCategory('training')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
              docFilterCategory === 'training'
                ? 'bg-[#0B1E30] text-white shadow-xs'
                : 'bg-white text-[#55697A] border border-[#d7e2ec] hover:bg-[#f1f5f9]'
            }`}
          >
            Training ({certCount})
          </button>
          <button
            onClick={() => setDocFilterCategory('identification')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
              docFilterCategory === 'identification'
                ? 'bg-[#0B1E30] text-white shadow-xs'
                : 'bg-white text-[#55697A] border border-[#d7e2ec] hover:bg-[#f1f5f9]'
            }`}
          >
            IDs ({idCount})
          </button>
          <button
            onClick={() => setDocFilterCategory('psira')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
              docFilterCategory === 'psira'
                ? 'bg-[#0B1E30] text-white shadow-xs'
                : 'bg-white text-[#55697A] border border-[#d7e2ec] hover:bg-[#f1f5f9]'
            }`}
          >
            PSIRA ({psiraCount})
          </button>
          {expiringCount > 0 && (
            <button
              onClick={() => setDocFilterCategory('expiring')}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
                docFilterCategory === 'expiring'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Expiring ({expiringCount})
            </button>
          )}
        </div>

        {/* Document Items List */}
        <div className="space-y-2.5">
          {filteredDocs.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#e9eef3] rounded-2xl space-y-2">
              <Award className="w-8 h-8 text-[#8598A8] mx-auto opacity-40" />
              <div className="text-xs font-semibold text-[#0B1E30]">No documents found</div>
              <div className="text-[11px] text-[#8598A8]">
                {searchDocQuery ? 'Try clearing your search query.' : 'Use the Document Uploader above to capture training certificates or IDs.'}
              </div>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const hasPhoto = Boolean(doc.photoUrl || doc.fileData);
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocForView(doc)}
                  className="flex items-center gap-3 bg-white border border-[#e9eef3] hover:border-[#b4c9dc] rounded-2xl p-3 shadow-xs transition-all cursor-pointer group"
                >
                  {/* Thumbnail / Icon */}
                  {hasPhoto ? (
                    <div className="relative w-12 h-12 rounded-xl bg-black overflow-hidden flex-none border border-[#d7e2ec]">
                      <img
                        src={doc.photoUrl || doc.fileData}
                        alt={doc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-0.5 rounded-tl-xs">
                        <Camera className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#eaf1f8] grid place-items-center flex-none">
                      <FileText className="w-5 h-5 text-[#2b6cb0]" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-[#0B1E30] flex items-center gap-1.5">
                      <span className="truncate">{doc.name}</span>
                      {doc.expiresSoon && (
                        <span className="font-mono-code text-[9px] font-bold bg-[#E7A13A]/15 text-[#a8701a] px-1.5 py-0.5 rounded flex-none">
                          EXPIRES SOON
                        </span>
                      )}
                      {doc.status === 'valid' && !doc.expiresSoon && (
                        <span className="font-mono-code text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded flex-none">
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#55697A] truncate mt-0.5">
                      {doc.description || `${doc.category} · Stored in Cloud`}
                    </div>
                    {doc.certificateNumber && (
                      <div className="text-[10px] text-[#8598A8] font-mono mt-0.5">
                        Ref: {doc.certificateNumber}
                      </div>
                    )}
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-1 flex-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDocForView(doc);
                      }}
                      className="p-1.5 rounded-lg text-[#8598A8] hover:text-[#0B1E30] hover:bg-[#f1f5f9] transition-all cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="text-center text-[11px] text-[#8598A8] pt-1">
          Stored securely in Cloud Firestore with PSIRA and SASSETA verification hashes
        </div>

        {/* Document Uploader Modal */}
        {isDocumentUploaderOpen && (
          <DocumentUploader
            onClose={() => setIsDocumentUploaderOpen(false)}
          />
        )}

        {/* Document Viewer Modal */}
        {selectedDocForView && (
          <DocumentViewerModal
            document={selectedDocForView}
            onClose={() => setSelectedDocForView(null)}
          />
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // OCCURRENCE BOOK (OB) SCREEN
  // ----------------------------------------------------
  if (mobileScreen === 'ob') {
    return (
      <div className="p-4 space-y-3.5">
        <div className="font-display font-extrabold text-xl text-[#0B1E30]">
          Online Occurrence Book
        </div>

        {/* Site Header */}
        <div className="flex items-center justify-between bg-white border border-[#e9eef3] rounded-2xl p-3 shadow-xs">
          <div>
            <div className="text-[10px] text-[#8598A8] uppercase tracking-wider font-semibold">Site</div>
            <div className="font-display font-bold text-sm text-[#0B1E30]">{obSite}</div>
          </div>
          <span className="font-mono-code text-[10px] font-semibold bg-[#3AA655]/15 text-[#2c7a41] px-2 py-0.5 rounded">
            ● Online
          </span>
        </div>

        <div className="text-xs font-bold text-[#20364A]">Hourly OB entries</div>

        {/* Hourly Entries */}
        <div className="space-y-2">
          {obEntries.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 border rounded-2xl p-3 shadow-xs ${
                entry.status === 'in_progress'
                  ? 'bg-[#f0fafd] border-[#1FA6C9]/40'
                  : 'bg-white border-[#e9eef3]'
              }`}
            >
              <div className="font-mono-code font-bold text-xs text-[#0B1E30] w-11 flex-none">
                {entry.time}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs text-[#20364A] truncate">{entry.headline}</div>
                <div className="text-[11px] text-[#8598A8] truncate">{entry.notes}</div>
              </div>
              {entry.status === 'completed' ? (
                <span className="w-6 h-6 rounded-full bg-[#eaf6ee] grid place-items-center flex-none">
                  <svg className="w-3.5 h-3.5 stroke-[#3AA655] fill-none stroke-[2.6]" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              ) : (
                <span className="font-mono-code text-[10px] text-[#1FA6C9] flex-none">
                  ● In Progress
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Compose Box */}
        <div className="bg-white border border-[#e9eef3] rounded-2xl p-3 shadow-xs space-y-2">
          <textarea
            rows={2}
            value={currentOBNote}
            onChange={(e) => setCurrentOBNote(e.target.value)}
            placeholder="Add occurrence details…"
            className="w-full bg-[#f8fafc] border border-[#dbe4ec] rounded-xl p-2.5 text-xs text-[#0B1E30] resize-none focus:outline-none focus:border-[#1FA6C9]"
          />
          <div className="flex items-center justify-between text-[11px] text-[#8598A8] px-1">
            <span>{currentOBNote.length} / 500 characters</span>
            <button
              onClick={() => addOBEntry(currentOBNote)}
              className="text-xs font-bold text-[#1FA6C9] hover:underline cursor-pointer"
            >
              + Log entry
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => showToast('Camera opened — take incident photo')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#f3f7fa] hover:bg-[#eaf1f6] border border-[#e2e9ef] rounded-xl py-2 text-xs font-semibold text-[#20364A] cursor-pointer"
            >
              <svg className="w-4 h-4 stroke-[#5D6E7E] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <circle cx="12" cy="13" r="3.5" />
                <path d="M8 7l1.5-2h5L16 7" />
              </svg>
              <span>Add photo</span>
            </button>

            <button
              onClick={() => showToast('Voice note recorded (14s) — attached to OB entry')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#f3f7fa] hover:bg-[#eaf1f6] border border-[#e2e9ef] rounded-xl py-2 text-xs font-semibold text-[#20364A] cursor-pointer"
            >
              <svg className="w-4 h-4 stroke-[#5D6E7E] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M6 11a6 6 0 0012 0M12 17v4" />
              </svg>
              <span>Voice note</span>
            </button>
          </div>
        </div>

        {/* Incident Escalation */}
        <button
          onClick={() => {
            setIsNewIncidentModalOpen(true);
            showToast('Opening incident report docket form…');
          }}
          className="w-full bg-white hover:bg-rose-50 text-[#E0574B] border border-[#E0574B]/40 font-display font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <svg className="w-4 h-4 stroke-current fill-none stroke-[1.9]" viewBox="0 0 24 24">
            <path d="M12 3l9 16H3z" />
            <path d="M12 10v4M12 17h.01" />
          </svg>
          <span>🚨 Create Incident Report (Incident Queue &amp; Dispatch)</span>
        </button>
      </div>
    );
  }

  // ----------------------------------------------------
  // PATROLS SCREEN (Enterprise Multi-Location Guarding)
  // ----------------------------------------------------
  if (mobileScreen === 'patrols') {
    return <MobilePatrolScreen />;
  }

  // ----------------------------------------------------
  // COM-CHAT & PTT SCREEN
  // ----------------------------------------------------
  if (mobileScreen === 'comchat') {
    const normalizeSiteStr = (s: string) =>
      (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/khwamagxaki/g, 'kwamagxaki')
        .replace(/lindsy/g, 'lindsay');

    const filteredMobileMessages = messages.filter((m) => {
      if (mobileChatFilter === 'all') return true;
      if (mobileChatFilter === 'control_room') {
        return (
          m.channel === 'control_room' ||
          m.fromControlRoom === true ||
          m.target === 'control_room'
        );
      }
      if (mobileChatFilter === 'site') {
        const curSite = normalizeSiteStr(officer.currentSite);
        const mSite = normalizeSiteStr(m.siteName || '');
        const mChan = normalizeSiteStr(m.channel || '');
        return (
          mSite === curSite ||
          mChan === curSite ||
          mSite.includes(curSite) ||
          curSite.includes(mSite)
        );
      }
      return true;
    });

    const handleSendMobileMessage = () => {
      if (!messageInput.trim()) return;
      sendMessage(messageInput, {
        channel: mobileChatTarget === 'control_room' ? 'control_room' : officer.currentSite,
        siteName: officer.currentSite,
        isUrgent: isUrgentMsg,
        fromControlRoom: false,
        target: mobileChatTarget
      });
      setMessageInput('');
      setIsUrgentMsg(false);
    };

    return (
      <div className="p-4 space-y-3 pb-8">
        {/* Channel Selection Header */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setMobileChatFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              mobileChatFilter === 'all'
                ? 'bg-[#0B1E30] text-white shadow-xs'
                : 'bg-white border border-[#dbe4ec] text-[#55697d] hover:bg-slate-50'
            }`}
          >
            All Channels ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileChatFilter('control_room')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              mobileChatFilter === 'control_room'
                ? 'bg-[#E53E3E] text-white shadow-xs'
                : 'bg-white border border-[#dbe4ec] text-[#55697d] hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Control Room (SOC)
          </button>
          <button
            type="button"
            onClick={() => setMobileChatFilter('site')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              mobileChatFilter === 'site'
                ? 'bg-[#1FA6C9] text-[#042430] shadow-xs'
                : 'bg-white border border-[#dbe4ec] text-[#55697d] hover:bg-slate-50'
            }`}
          >
            <span>📍 {officer.currentSite || 'Site Net'}</span>
          </button>
        </div>

        {/* Supervisor Online Banner */}
        <div className="flex items-center justify-between text-xs text-[#2c7a41] bg-[#eaf6ee] px-3.5 py-2 rounded-xl font-medium border border-emerald-200">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 stroke-[#3AA655] fill-none stroke-[1.8]" viewBox="0 0 24 24">
              <path d="M12 3l8 3v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
            </svg>
            <span>Central Dispatch: Online · {officer.currentSite} Net</span>
          </div>
          <span className="font-mono-code text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            ENCRYPTED
          </span>
        </div>

        {/* Message Thread */}
        <div className="space-y-2.5 min-h-[260px] max-h-[440px] overflow-y-auto custom-scrollbar bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
          {filteredMobileMessages.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#8598A8] space-y-1">
              <div className="text-lg">📡</div>
              <div>No radio messages logged in this channel yet.</div>
            </div>
          ) : (
            filteredMobileMessages.map((msg) => (
              <div key={msg.id} className="flex gap-2.5">
                <div
                  className="w-7 h-7 rounded-full text-white font-bold text-[10px] grid place-items-center flex-none shadow-xs"
                  style={{ backgroundColor: msg.color || '#1FA6C9' }}
                >
                  {msg.initials}
                </div>
                <div
                  className={`border rounded-tl-sm rounded-tr-xl rounded-b-xl p-2.5 max-w-[85%] shadow-xs ${
                    msg.fromControlRoom
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : msg.isUrgent
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-white border-[#e9eef3] text-[#0B1E30]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-bold text-[#20364A] flex items-center gap-1.5 flex-wrap">
                      <span>{msg.sender}</span>
                      {msg.fromControlRoom ? (
                        <span className="text-[9px] bg-[#E53E3E] text-white px-1.5 py-0.2 rounded-full font-bold">
                          DISPATCH
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full font-medium">
                          {msg.siteName || 'Field'}
                        </span>
                      )}
                    </div>
                    <small className="text-[#8598A8] font-normal text-[10px]">{msg.time}</small>
                  </div>
                  <div className="text-xs mt-1 leading-relaxed">{msg.text}</div>

                  {/* Commentary */}
                  {msg.commentary && (
                    <div className="mt-2 p-2 rounded-xl bg-slate-100/90 border border-slate-200 text-xs text-slate-800">
                      <div className="text-[10px] font-bold text-[#1FA6C9] uppercase tracking-wider mb-0.5">
                        📝 Tour Debrief
                      </div>
                      <p className="italic">{msg.commentary}</p>
                    </div>
                  )}

                  {/* Photo Attachment */}
                  {(msg.photoUrl || msg.mediaUrl) && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-44 bg-black">
                      <img
                        src={msg.photoUrl || msg.mediaUrl}
                        alt="Transmitted photo"
                        className="w-full max-h-44 object-cover"
                      />
                    </div>
                  )}

                  {/* Voice Note Attachment */}
                  {msg.voiceNoteUrl && (
                    <div className="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-emerald-800 font-semibold">
                        <span>🎙️ Officer Voice Note</span>
                        {msg.audioDurationSec ? <span>({msg.audioDurationSec}s)</span> : null}
                      </div>
                      <audio controls src={msg.voiceNoteUrl} className="w-full h-8" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Push To Talk (PTT) Hardware Component */}
        <div className="bg-[#0A1E33] rounded-2xl p-4 text-center text-white shadow-md">
          {/* Audio Wave Visualizer */}
          <div className="flex items-center justify-center gap-1 h-8 mb-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="w-[2.5px] bg-[#3FC9E9] rounded-full transition-all duration-75 block opacity-85"
                style={{
                  height: isPTTLive ? `${6 + Math.random() * 26}px` : '8px'
                }}
              />
            ))}
          </div>

          {/* PTT Main Button */}
          <button
            onMouseDown={() => setIsPTTLive(true)}
            onMouseUp={() => setIsPTTLive(false)}
            onTouchStart={() => setIsPTTLive(true)}
            onTouchEnd={() => setIsPTTLive(false)}
            className={`w-20 h-20 rounded-full mx-auto grid place-items-center transition-all cursor-pointer select-none ${
              isPTTLive
                ? 'bg-[#3AA655] shadow-[0_0_0_12px_rgba(58,166,85,0.25)] scale-105'
                : 'bg-[#1FA6C9] shadow-[0_0_0_8px_rgba(31,166,201,0.16)]'
            }`}
          >
            <svg className="w-8 h-8 stroke-white fill-none stroke-[1.8]" viewBox="0 0 24 24">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M6 11a6 6 0 0012 0M12 17v4" />
            </svg>
          </button>

          <div className="font-display font-bold text-sm text-white mt-2.5">
            {isPTTLive ? 'Transmitting to Control Room…' : 'Hold to Talk (PTT)'}
          </div>
          <div className="text-[11px] text-[#9db0c0]">Direct RF uplink to Central Dispatch</div>
        </div>

        {/* Quick Text Input & Destination Routing */}
        <div className="bg-white border border-[#dbe4ec] rounded-2xl p-3 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-[#55697d]">
            <div className="flex items-center gap-1.5">
              <span>Send To:</span>
              <button
                type="button"
                onClick={() => setMobileChatTarget('control_room')}
                className={`px-2 py-0.5 rounded-lg font-bold text-[10px] cursor-pointer ${
                  mobileChatTarget === 'control_room'
                    ? 'bg-[#E53E3E] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Control Room
              </button>
              <button
                type="button"
                onClick={() => setMobileChatTarget('site')}
                className={`px-2 py-0.5 rounded-lg font-bold text-[10px] cursor-pointer ${
                  mobileChatTarget === 'site'
                    ? 'bg-[#1FA6C9] text-[#042430]'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Site Guards
              </button>
            </div>

            <label className="flex items-center gap-1 text-[11px] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isUrgentMsg}
                onChange={(e) => setIsUrgentMsg(e.target.checked)}
                className="rounded text-rose-600 cursor-pointer"
              />
              <span className={isUrgentMsg ? 'text-rose-600 font-bold' : ''}>⚠️ Urgent</span>
            </label>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMobileMessage();
                }
              }}
              placeholder={`Message ${mobileChatTarget === 'control_room' ? 'Control Room Dispatch' : officer.currentSite}…`}
              className="flex-1 bg-slate-50 border border-[#dbe4ec] rounded-xl px-3 py-2 text-xs text-[#0B1E30] focus:outline-none focus:border-[#1FA6C9]"
            />
            <button
              onClick={handleSendMobileMessage}
              className="bg-[#1FA6C9] hover:bg-[#1994b4] text-[#042430] font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
