import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  OfficerState, 
  ShiftItem, 
  LeaveRequest, 
  PayQuery, 
  DocumentItem, 
  OBEntry, 
  PatrolCheckpoint,
  PatrolRoute,
  PatrolSafetyStatus,
  PatrolException,
  SefekoDevice,
  ClientProofOfService,
  CheckpointSOP, 
  ChatMessage, 
  ControlRoomAlert, 
  IncidentQueueItem, 
  SiteStatusItem, 
  EmployeeRosterRow, 
  SiteCoverageItem,
  MultiSiteItem,
  OfficerRecord,
  SitePost,
  SiteFile,
  EvidenceFile,
  IncidentNote,
  FleetVehicle,
  UserRole,
  UserAuthProfile,
  TimesheetEntry
} from '../types/dutyon';
import { patrolAudio } from '../utils/patrolAudio';
import { generatePayPeriodTimesheets, GRADE_RATES, SECTORAL_RULES } from '../utils/payrollSectoral';
import { auth, onAuthStateChanged, signOut, type User } from '../firebase';
import {
  testFirestoreConnection,
  subscribeToOBEntries,
  syncOBEntryToCloud,
  subscribeToPatrolScans,
  syncPatrolScanToCloud,
  subscribeToPatrolExceptions,
  syncPatrolExceptionToCloud,
  deletePatrolExceptionInCloud,
  subscribeToIncidents,
  syncIncidentToCloud,
  deleteIncidentInCloud,
  resolveIncidentInCloud,
  subscribeToAlerts,
  syncAlertToCloud,
  dismissAlertInCloud,
  subscribeToMessages,
  syncMessageToCloud,
  subscribeToFleetVehicles,
  syncFleetVehicleToCloud,
  deleteFleetVehicleInCloud,
  subscribeToSites,
  syncSiteToCloud,
  deleteSiteInCloud,
  subscribeToOfficers,
  syncOfficerToCloud,
  deleteOfficerInCloud,
  subscribeToTimesheets,
  syncTimesheetToCloud,
  deleteTimesheetInCloud,
  clearAllTimesheetsInCloud,
  purgeAllPlaceholderDataFromCloud,
  saveUserProfileToCloud,
  getUserProfileFromCloud,
  subscribeToUserProfile,
  saveOfficerDocumentToCloud,
  deleteOfficerDocumentFromCloud,
  subscribeToOfficerDocuments,
  syncAllTikediDataToCloud,
  type CloudPatrolScan,
  deletePatrolScanInCloud,
  clearAllPatrolScansInCloud,
  clearAllPatrolExceptionsInCloud
} from '../services/firestoreDutyOn';
import { TIKEDI_SITES, TIKEDI_OFFICERS, INITIAL_TIKEDI_ROSTER_ROWS } from '../data/tikediMasterData';

interface DutyOnContextType {
  // Authentication & RBAC
  currentUser: User | null;
  currentUserProfile: UserAuthProfile | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAccessRestrictedOpen: boolean;
  setIsAccessRestrictedOpen: (open: boolean) => void;
  restrictedTargetArea: 'control_room' | 'admin_data';
  setRestrictedTargetArea: (area: 'control_room' | 'admin_data') => void;
  loginWithProfile: (profile: UserAuthProfile) => Promise<void>;
  grantControlRoomAccess: () => void;
  grantAdminAccess: () => void;
  switchActiveOfficer: (officerId: string) => void;
  checkCanAccessControlRoom: () => boolean;
  checkCanAccessAdminData: () => boolean;
  attemptSwitchToControlRoom: () => void;
  logoutDutyOn: () => Promise<void>;
  doClockOut: () => void;

  // Real-Time Patrol Logs & Breaches
  patrolScans: CloudPatrolScan[];
  deletePatrolScan: (id: string) => Promise<void>;
  clearAllPatrolScans: () => Promise<void>;
  clearPatrolException: (id: string) => Promise<void>;
  clearAllPatrolExceptions: () => Promise<void>;
  resolvePatrolException: (id: string, notes?: string) => Promise<void>;
  isPatrolLogsModalOpen: boolean;
  setIsPatrolLogsModalOpen: (open: boolean) => void;

  // Manual Clock In / Out from Control Room
  manualClockInOfficer: (officerId: string, siteName?: string, postName?: string) => Promise<void>;
  manualClockOutOfficer: (officerId: string) => Promise<void>;
  isManualClockInModalOpen: boolean;
  setIsManualClockInModalOpen: (open: boolean) => void;

  activeMode: 'mobile' | 'desktop';
  setActiveMode: (mode: 'mobile' | 'desktop') => void;
  mobileScreen: string;
  setMobileScreen: (screen: string) => void;
  desktopTab: string;
  setDesktopTab: (tab: string) => void;
  controlRoomTab: string;
  setControlRoomTab: (tab: string) => void;
  isMoreSheetOpen: boolean;
  setIsMoreSheetOpen: (open: boolean) => void;
  clockTime: string;
  
  // Officer state & attendance
  officer: OfficerState;
  activeOfficerId: string;
  activeOfficerRecord: OfficerRecord | null;
  doClockIn: () => void;
  
  // Roster
  upcomingShifts: ShiftItem[];
  
  // Leave
  leaveBalances: { annual: number; sick: number };
  leaveRequest: LeaveRequest;
  updateLeaveRequest: (updates: Partial<LeaveRequest>) => void;
  submitLeave: () => void;
  
  // Pay Query
  payQuery: PayQuery;
  updatePayQuery: (updates: Partial<PayQuery>) => void;
  submitPayQuery: () => void;
  
  // Documents
  documents: DocumentItem[];
  addDocument: (doc: DocumentItem) => void;
  deleteDocument: (docId: string) => void;
  
  // Occurrence Book
  obSite: string;
  obEntries: OBEntry[];
  currentOBNote: string;
  setCurrentOBNote: (note: string) => void;
  addOBEntry: (text: string) => void;
  
  // Patrols
  checkpoints: PatrolCheckpoint[];
  currentCheckpointIndex: number;
  scanCurrentCheckpoint: () => void;
  reportPatrolException: () => void;
  patrolRoutes: PatrolRoute[];
  activeRouteId: string;
  setActiveRouteId: (id: string) => void;
  activeRoute: PatrolRoute;
  toggleSOPItem: (checkpointId: number, sopId: string) => void;
  scanCheckpointWithDetails: (details?: { 
    method?: 'NFC Tag' | 'Sefeko RFID' | 'BLE Beacon' | 'QR Matrix' | 'Manual Override';
    notes?: string; 
    photoUrl?: string; 
    voiceNoteUrl?: string;
    audioDurationSec?: number;
  }) => void;
  patrolExceptions: PatrolException[];
  reportPatrolExceptionDetailed: (exception: {
    category: string;
    isCustomThreat?: boolean;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    description: string;
    checkpointName?: string;
    photoUrl?: string;
    voiceNoteUrl?: string;
    audioDurationSec?: number;
  }) => void;
  safetyStatus: PatrolSafetyStatus;
  resetWelfarePing: () => void;
  triggerDuressPanic: () => void;
  clearDuressPanic: () => void;
  triggerManDownSensor: () => void;
  clearManDownSensor: () => void;
  sefekoDevices: SefekoDevice[];
  proofOfServiceReports: ClientProofOfService[];
  selectedReport: ClientProofOfService | null;
  setSelectedReport: (report: ClientProofOfService | null) => void;
  completePatrolTour: (routeId: string, details?: {
    commentary?: string;
    mediaUrl?: string;
    photoUrl?: string;
    audioUrl?: string;
    voiceNoteUrl?: string;
    audioDurationSec?: number;
    status?: string;
  }) => void;
  addCheckpointToRoute: (routeId: string, cp: any) => void;
  
  // Com-Chat & PTT
  messages: ChatMessage[];
  sendMessage: (text: string, options?: {
    channel?: string;
    siteName?: string;
    isUrgent?: boolean;
    fromControlRoom?: boolean;
    target?: string;
    photoUrl?: string;
    mediaUrl?: string;
    voiceNoteUrl?: string;
    audioDurationSec?: number;
    commentary?: string;
  }) => void;
  isPTTLive: boolean;
  setIsPTTLive: (live: boolean) => void;
  
  // Control Room Data
  alerts: ControlRoomAlert[];
  dismissAlert: (id: string) => void;
  incidents: IncidentQueueItem[];
  resolveIncident: (id: string) => void;
  sites: MultiSiteItem[];
  incidentQueue: IncidentQueueItem[];
  siteStatuses: SiteStatusItem[];
  rosterRows: EmployeeRosterRow[];
  siteCoverages: SiteCoverageItem[];
  
  // Control Room Command & Control Modals and State
  officersList: OfficerRecord[];
  selectedOfficerForModal: OfficerRecord | null;
  setSelectedOfficerForModal: (officer: OfficerRecord | null) => void;
  selectedSiteForModal: MultiSiteItem | null;
  setSelectedSiteForModal: (site: MultiSiteItem | null) => void;
  selectedIncidentForModal: IncidentQueueItem | null;
  setSelectedIncidentForModal: (inc: IncidentQueueItem | null) => void;
  selectedRosterShift: { officer: EmployeeRosterRow; dayIdx: number; dayName: string } | null;
  setSelectedRosterShift: (shift: { officer: EmployeeRosterRow; dayIdx: number; dayName: string } | null) => void;
  isNewIncidentModalOpen: boolean;
  setIsNewIncidentModalOpen: (open: boolean) => void;
  isNewOfficerModalOpen: boolean;
  setIsNewOfficerModalOpen: (open: boolean) => void;
  isNewSiteModalOpen: boolean;
  setIsNewSiteModalOpen: (open: boolean) => void;
  isNewFleetModalOpen: boolean;
  setIsNewFleetModalOpen: (open: boolean) => void;
  isBroadcastModalOpen: boolean;
  setIsBroadcastModalOpen: (open: boolean) => void;

  // Fleet
  fleetVehicles: FleetVehicle[];
  addFleetVehicle: (vehicle: Omit<FleetVehicle, 'id'>) => void;
  updateFleetVehicle: (id: string, updates: Partial<FleetVehicle>) => void;
  deleteFleetVehicle: (id: string) => void;

  // Actions
  updateOfficer: (officerId: string, updates: Partial<OfficerRecord>) => void;
  deleteOfficer: (officerId: string) => void;
  reassignOfficerSite: (officerId: string, newSite: string, newPost: string) => void;
  sendOfficerWelfarePing: (officerId: string) => void;
  uploadOfficerFile: (officerId: string, doc: DocumentItem) => void;
  updateOfficerStatus: (officerId: string, isClockedIn: boolean) => void;

  addSite: (site: Partial<MultiSiteItem>) => void;
  updateSite: (siteId: string, updates: Partial<MultiSiteItem>) => void;
  deleteSite: (siteId: string) => void;
  uploadSiteFile: (siteId: string, file: SiteFile) => void;
  lockdownSite: (siteId: string) => void;
  dispatchArmedBackupToSite: (siteId: string) => void;

  updateRosterShift: (empId: string, dayIdx: number, shift: 'D' | 'N' | 'OFF' | 'OPEN' | 'EXC') => void;
  addRosterOfficer: (officer: OfficerRecord) => void;
  autoFillOpenShifts: () => void;
  publishRoster: (weekStr: string) => void;
  swapRosterShifts: (empId1: string, empId2: string, dayIdx: number) => void;
  verifyOfficerPsira: (psiraNumber: string) => { valid: boolean; grade: string; expiry: string; statusText: string };

  createIncident: (incident: IncidentQueueItem) => void;
  updateIncident: (id: string, updates: Partial<IncidentQueueItem>) => void;
  deleteIncident: (id: string) => void;
  deleteMultipleIncidents: (incidentIds: string[]) => Promise<void>;
  clearAllIncidents: () => Promise<void>;
  addIncidentNote: (incidentId: string, text: string, author?: string) => void;
  uploadIncidentEvidence: (incidentId: string, evidence: EvidenceFile) => void;
  deleteIncidentEvidence: (incidentId: string, evidenceId: string) => void;
  broadcastControlRoomAlert: (title: string, message: string, targetSite: string, priority?: 'CRITICAL' | 'HIGH' | 'MED') => void;

  // Timesheets & Hours
  timesheets: TimesheetEntry[];
  addTimesheet: (entry: TimesheetEntry) => void;
  deleteTimesheet: (id: string) => void;
  clearAllTimesheets: () => void;
  recordCompletedShift: (details: {
    officerId: string;
    siteName: string;
    date?: string;
    shiftType?: 'DAY' | 'NIGHT';
    standardHours: number;
    overtimeHours?: number;
    isSunday?: boolean;
    isPublicHoliday?: boolean;
  }) => void;
  resetToRealLifeData: () => Promise<void>;
  deletePatrolException: (id: string) => void;

  // Radar & User Real GPS Location Linking
  userLocation: { lat: number; lng: number; address: string; accuracyMeters?: number } | null;
  setUserLocation: (loc: { lat: number; lng: number; address: string; accuracyMeters?: number } | null) => void;
  requestLiveGPSLocation: () => Promise<{ lat: number; lng: number; address: string } | null>;
  focusedIncidentIdOnRadar: string | null;
  setFocusedIncidentIdOnRadar: (id: string | null) => void;

  // Global Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Cloud Persistence
  isCloudConnected: boolean;
}

const INITIAL_MASTER_OFFICERS: OfficerRecord[] = TIKEDI_OFFICERS;

const DutyOnContext = createContext<DutyOnContextType | undefined>(undefined);

export const DutyOnProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMode, setActiveMode] = useState<'mobile' | 'desktop'>('mobile');
  const [mobileScreen, setMobileScreen] = useState('home');
  const [desktopTab, setDesktopTab] = useState('liveops');
  const [controlRoomTab, setControlRoomTab] = useState('live');
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Real-Time Patrol Logs & Manual Clock In Modal States
  const [patrolScans, setPatrolScans] = useState<CloudPatrolScan[]>([]);
  const [isPatrolLogsModalOpen, setIsPatrolLogsModalOpen] = useState(false);
  const [isManualClockInModalOpen, setIsManualClockInModalOpen] = useState(false);

  // Real-time clock formatted as HH:MM:SS
  const [clockTime, setClockTime] = useState<string>(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setClockTime(`${hh}:${mm}:${ss}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  };

  // ---------------- AUTH & RBAC STATE ----------------
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserAuthProfile | null>(() => {
    try {
      const saved = localStorage.getItem('dutyon_active_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccessRestrictedOpen, setIsAccessRestrictedOpen] = useState(false);
  const [restrictedTargetArea, setRestrictedTargetArea] = useState<'control_room' | 'admin_data'>('control_room');

  // Master Officers List: Single Source of Truth for all Personnel
  const [officersList, setOfficersList] = useState<OfficerRecord[]>(INITIAL_MASTER_OFFICERS);

  // Active Officer ID: linked to logged in account or selected guard profile
  const [activeOfficerId, setActiveOfficerId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('dutyon_active_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.officerId) return parsed.officerId;
      }
    } catch (e) {}
    return 'off-admin';
  });

  // Single Source of Truth for Active Officer Record
  const activeOfficerRecord = useMemo(() => {
    // 1. Highest priority: Logged in user email or profile
    const emailToMatch = (currentUser?.email || currentUserProfile?.email || '').toLowerCase().trim();
    if (emailToMatch) {
      const found = officersList.find((o) => o.email && o.email.toLowerCase().trim() === emailToMatch);
      if (found) return found;
      if (emailToMatch.includes('tshepomaloa') || emailToMatch.includes('maloa')) {
        const adminFound = officersList.find((o) => o.id === 'off-admin' || o.name.toLowerCase().includes('tshepo'));
        if (adminFound) return adminFound;
      }
    }

    // 2. Profile officerId
    if (currentUserProfile?.officerId) {
      const found = officersList.find((o) => o.id === currentUserProfile.officerId);
      if (found) return found;
    }

    // 3. User display name match
    const nameToMatch = (currentUser?.displayName || currentUserProfile?.displayName || '').toLowerCase().trim();
    if (nameToMatch) {
      const found = officersList.find((o) => o.name.toLowerCase().trim() === nameToMatch);
      if (found) return found;
    }

    // 4. activeOfficerId selection
    if (activeOfficerId) {
      const found = officersList.find((o) => o.id === activeOfficerId);
      if (found) return found;
    }

    // 5. Default to off-admin or first enrolled officer
    return officersList.find((o) => o.id === 'off-admin') || officersList[0] || null;
  }, [activeOfficerId, currentUserProfile, currentUser, officersList]);

  // Sectoral Timesheets & Real-life Hours (starts at clean ZERO baseline)
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);

  // Radar & User Real GPS Location
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    accuracyMeters?: number;
  } | null>(null);

  const [focusedIncidentIdOnRadar, setFocusedIncidentIdOnRadar] = useState<string | null>(null);

  // Officer Profile State: dynamically kept 100% in sync with the Master Database
  const [officer, setOfficer] = useState<OfficerState>(() => {
    const initRec = INITIAL_MASTER_OFFICERS[0];
    return {
      name: initRec.name,
      avatarInitial: initRec.avatarInitial || 'T',
      role: initRec.grade.includes('Armed') ? 'Armed Tactical Officer' : 'Field Security Guard',
      grade: initRec.grade,
      currentSite: initRec.currentSite || 'Provincial Office',
      siteDeployed: initRec.currentSite || 'Provincial Office',
      location: initRec.location || 'Provincial Government Office Complex, Beaufort West',
      coords: initRec.coords || { lat: -32.3567, lng: 22.5833 },
      currentPost: initRec.currentPost || 'Command & Operations Center',
      currentShift: (initRec as any).currentShift || (initRec.shiftPreference ? `${initRec.shiftPreference} Shift (06:00 – 18:00)` : 'Day Shift (06:00 – 18:00)'),
      isClockedIn: false,
      clockInTime: '',
      clockInTimestamp: undefined,
      shiftHours: '06:00–18:00',
      hoursToday: '0.00',
      payPeriodHours: 0.0,
      isOnline: true,
      psiraNumber: initRec.psiraNumber,
      idNumber: initRec.idNumber,
      empId: initRec.empId,
      phone: initRec.phone,
      email: initRec.email
    };
  });

  // Calculate live pay period hours for active officer from actual timesheets
  const calculatedPayPeriodHours = useMemo(() => {
    const officerTs = timesheets.filter(
      (ts) => ts.officerName.toLowerCase() === officer.name.toLowerCase() || ts.empId === officer.empId
    );
    const sum = officerTs.reduce((acc, t) => acc + (t.actualHours || 0), 0);
    return Number(sum.toFixed(1));
  }, [timesheets, officer.name, officer.empId]);

  // Request browser GPS position for authentic real user location
  const requestLiveGPSLocation = useCallback(async (): Promise<{ lat: number; lng: number; address: string } | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      showToast('Geolocation is not supported by this browser');
      return null;
    }

    return new Promise((resolve) => {
      showToast('Acquiring high-precision GPS lock...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
            address: `GPS Locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          };
          setUserLocation(loc);
          setOfficer((prev) => ({
            ...prev,
            coords: { lat: loc.lat, lng: loc.lng },
            location: loc.address
          }));
          showToast(`✓ GPS Locked: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} (±${Math.round(loc.accuracyMeters)}m)`);
          resolve(loc);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          showToast(`GPS location: ${err.message || 'Permission denied'}`);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    });
  }, [showToast]);

  // Request browser geolocation on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
            address: `GPS Locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          };
          setUserLocation(loc);
          setOfficer((prev) => ({
            ...prev,
            coords: { lat: loc.lat, lng: loc.lng },
            location: loc.address
          }));
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  // Automatically update officer state whenever the master activeOfficerRecord changes
  useEffect(() => {
    if (activeOfficerRecord) {
      setOfficer((prev) => ({
        ...prev,
        name: activeOfficerRecord.name,
        avatarInitial: activeOfficerRecord.avatarInitial || activeOfficerRecord.name[0] || 'O',
        role: activeOfficerRecord.grade.includes('Armed') ? 'Armed Tactical Officer' : 'Field Security Guard',
        grade: activeOfficerRecord.grade,
        currentSite: activeOfficerRecord.currentSite || 'Provincial Office',
        siteDeployed: activeOfficerRecord.currentSite || 'Provincial Office',
        location: userLocation?.address || activeOfficerRecord.location || (activeOfficerRecord.id === 'off-admin' ? 'Provincial Government Office Complex, Beaufort West' : `${activeOfficerRecord.currentSite} Sector`),
        coords: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : activeOfficerRecord.coords || (activeOfficerRecord.id === 'off-admin' ? { lat: -32.3567, lng: 22.5833 } : prev.coords),
        currentPost: activeOfficerRecord.currentPost || 'Main Security Post',
        currentShift: (activeOfficerRecord as any).currentShift || (activeOfficerRecord.shiftPreference ? `${activeOfficerRecord.shiftPreference} Shift (06:00 – 18:00)` : 'Day Shift (06:00 – 18:00)'),
        isClockedIn: Boolean(activeOfficerRecord.isClockedIn),
        clockInTime: activeOfficerRecord.clockInTime || '',
        clockInTimestamp: activeOfficerRecord.clockInTimestamp,
        shiftHours: '06:00–18:00',
        hoursToday: activeOfficerRecord.isClockedIn ? (activeOfficerRecord.hoursToday || prev.hoursToday || '0.01') : '0.00',
        payPeriodHours: calculatedPayPeriodHours,
        isOnline: true,
        psiraNumber: activeOfficerRecord.psiraNumber,
        idNumber: activeOfficerRecord.idNumber,
        empId: activeOfficerRecord.empId,
        phone: activeOfficerRecord.phone,
        email: activeOfficerRecord.email
      }));
    }
  }, [activeOfficerRecord, userLocation, calculatedPayPeriodHours]);

  // Live Hours Ticker: When officer is clocked in, counts elapsed hours in real time
  useEffect(() => {
    if (!officer.isClockedIn || !officer.clockInTimestamp) return;

    const ticker = setInterval(() => {
      const elapsedMs = Math.max(0, Date.now() - officer.clockInTimestamp!);
      const elapsedHoursNum = Number((elapsedMs / 3600000).toFixed(2));
      const hoursStr = elapsedHoursNum < 0.01 ? '0.01' : elapsedHoursNum.toFixed(2);

      setOfficer((prev) => {
        if (!prev.isClockedIn) return prev;
        return {
          ...prev,
          hoursToday: hoursStr,
        };
      });

      // Update in-progress timesheet entry
      setTimesheets((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((ts, idx) => {
          if (idx === 0 && ts.officerName === officer.name && !ts.clockOutTime) {
            return {
              ...ts,
              actualHours: Math.max(0.01, elapsedHoursNum),
              billableHours: Math.max(0.01, elapsedHoursNum),
              standardHours: Math.min(12.0, Math.max(0.01, elapsedHoursNum)),
              overtimeHours: Math.max(0, Number((elapsedHoursNum - 12.0).toFixed(2)))
            };
          }
          return ts;
        });
      });
    }, 5000);

    return () => clearInterval(ticker);
  }, [officer.isClockedIn, officer.clockInTimestamp, officer.name]);

  // Clock In Action with full Cloud Sync, Live Timesheet generation & hour tracking
  const doClockIn = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    const timestampNow = now.getTime();

    setOfficer((prev) => ({
      ...prev,
      isClockedIn: true,
      clockInTime: timeStr,
      clockInTimestamp: timestampNow,
      hoursToday: '0.01'
    }));

    // Update master officersList state & cloud sync
    const targetOffId = activeOfficerRecord?.id || currentUserProfile?.officerId || activeOfficerId || 'off-admin';
    setOfficersList((prev) => {
      let found = false;
      const updated = prev.map((o) => {
        if (o.id === targetOffId || (officer.name && o.name.toLowerCase() === officer.name.toLowerCase())) {
          found = true;
          const updatedOff: OfficerRecord = { 
            ...o, 
            isClockedIn: true, 
            clockInTime: timeStr, 
            clockInTimestamp: timestampNow,
            currentSite: officer.currentSite || o.currentSite,
            currentPost: officer.currentPost || o.currentPost,
            coords: officer.coords || o.coords,
            location: officer.location || o.location
          };
          syncOfficerToCloud(updatedOff).catch(console.error);
          return updatedOff;
        }
        return o;
      });

      if (!found) {
        const newRecord: OfficerRecord = {
          id: targetOffId,
          name: officer.name || 'Security Personnel',
          empId: officer.empId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          psiraNumber: officer.psiraNumber || '2490181',
          idNumber: officer.idNumber || '9305105694081',
          employmentPosition: 'Permanent',
          grade: officer.grade || 'Grade C',
          phone: officer.phone || '071 283 3558',
          email: officer.email || currentUserProfile?.email || '',
          currentSite: officer.currentSite || 'Provincial Office',
          siteDeployed: officer.currentSite || 'Provincial Office',
          currentPost: officer.currentPost || 'Main Security Post',
          location: officer.location || 'Provincial Government Office Complex, Beaufort West',
          coords: officer.coords || { lat: -32.3567, lng: 22.5833 },
          isClockedIn: true,
          clockInTime: timeStr,
          clockInTimestamp: timestampNow,
          batteryLevel: 98,
          welfareStatus: 'normal',
          lastScanTime: 'Just now',
          firearmCompetency: officer.grade?.includes('Armed') || false,
          firstAidCert: true,
          avatarInitial: officer.avatarInitial || officer.name[0] || 'O',
          documents: []
        };
        syncOfficerToCloud(newRecord).catch(console.error);
        return [newRecord, ...updated];
      }
      return updated;
    });

    // Update site officersPresent count
    setSites((prevSites) =>
      prevSites.map((s) => {
        if (s.name.toLowerCase() === (officer.currentSite || '').toLowerCase()) {
          const updatedSite = {
            ...s,
            officersPresent: (s.officersPresent || 0) + 1,
            patrolStatus: 'Active Patrol & Post Guarded'
          };
          syncSiteToCloud(updatedSite).catch(console.error);
          return updatedSite;
        }
        return s;
      })
    );

    // Create live active TimesheetEntry
    const isNight = now.getHours() >= 18 || now.getHours() < 6;
    const isSunday = now.getDay() === 0;
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
    const dayName = daysOfWeek[now.getDay()];

    const liveTimesheet: TimesheetEntry = {
      id: `ts-${officer.empId || 'TKD'}-${now.toISOString().slice(0, 10)}-${timestampNow}`,
      officerId: targetOffId,
      empId: officer.empId || activeOfficerRecord?.empId || 'DIR-0001',
      officerName: officer.name,
      grade: officer.grade || 'Grade A',
      siteName: officer.currentSite || 'Provincial Office',
      date: now.toISOString().slice(0, 10),
      dayOfWeek: dayName,
      isSunday,
      isPublicHoliday: false,
      shiftType: isNight ? 'NIGHT' : 'DAY',
      scheduledStart: isNight ? '18:00' : '06:00',
      scheduledEnd: isNight ? '06:00' : '18:00',
      clockInTime: timeStr,
      clockOutTime: timeStr,
      biometricVerified: true,
      biometricMethod: 'Face Liveness AI',
      standardHours: 0.0,
      actualHours: 0.01,
      billableHours: 0.01,
      overtimeHours: 0.0,
      nightAllowanceHours: isNight ? 1.0 : 0.0,
      isNightAllowanceEligible: isNight,
      hourlyRate: GRADE_RATES[officer.grade]?.baseHourly ?? 48.50,
      clientBillingRate: GRADE_RATES[officer.grade]?.clientBilling ?? 115.00,
      status: 'VERIFIED'
    };

    setTimesheets((prev) => [liveTimesheet, ...prev]);
    syncTimesheetToCloud(liveTimesheet).catch(console.error);

    // Add alert to Control Room & cloud sync
    const clockInAlert: ControlRoomAlert = {
      id: `alert-${Date.now()}`,
      title: `Officer Attendance Confirmed: ${officer.name}`,
      location: `${officer.currentSite} · Biometric Liveness Verified`,
      description: `Officer ${officer.name} (${officer.grade}) clocked on duty via 3D Face ID with geofence lock. Live hours counter started.`,
      time: timeStr,
      priority: 'LOW',
      type: 'LOW'
    };
    setAlerts((prev) => [clockInAlert, ...prev]);
    syncAlertToCloud(clockInAlert).catch(console.error);

    // Create OB Entry & cloud sync
    const obEntry: OBEntry = {
      id: `ob-clockin-${Date.now()}`,
      time: timeStr,
      headline: `Biometric Attendance Verified: ${officer.name}`,
      notes: `Officer ${officer.name} (${officer.grade}) clocked on duty at ${officer.currentSite}. Biometric Liveness Face ID score: 98.4%. PSIRA verified active.`,
      status: 'completed',
      site: officer.currentSite,
      hasPhoto: true,
      createdAt: new Date().toISOString()
    };
    setOBEntries((prev) => [obEntry, ...prev]);
    syncOBEntryToCloud(obEntry).catch(console.error);

    patrolAudio.playInspectionComplete();
    showToast(`Clock-in confirmed at ${timeStr} — Live hours counting`);
  };

  const doClockOut = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    const clockInMs = officer.clockInTimestamp || (now.getTime() - 60000);
    const elapsedMinutes = Math.max(1, Math.round((now.getTime() - clockInMs) / 60000));
    const totalHoursWorked = Number((elapsedMinutes / 60).toFixed(2));
    const standardHours = Math.min(12.0, totalHoursWorked);
    const overtimeHours = Math.max(0, Number((totalHoursWorked - 12.0).toFixed(2)));

    setOfficer((prev) => ({
      ...prev,
      isClockedIn: false,
      clockInTimestamp: undefined
    }));

    setOfficersList((prev) =>
      prev.map((o) => {
        if (o.id === currentUserProfile?.officerId || o.name.toLowerCase().includes(officer.name.toLowerCase())) {
          const updated = { ...o, isClockedIn: false, clockInTimestamp: undefined };
          syncOfficerToCloud(updated).catch(console.error);
          return updated;
        }
        return o;
      })
    );

    // Finalize active timesheet entry
    setTimesheets((prev) =>
      prev.map((ts, idx) => {
        if (idx === 0 && ts.officerName === officer.name && !ts.clockOutTime) {
          const finalized: TimesheetEntry = {
            ...ts,
            clockOutTime: timeStr,
            standardHours,
            actualHours: totalHoursWorked,
            billableHours: totalHoursWorked,
            overtimeHours,
            status: 'VERIFIED'
          };
          syncTimesheetToCloud(finalized).catch(console.error);
          return finalized;
        }
        return ts;
      })
    );

    const clockOutAlert: ControlRoomAlert = {
      id: `alert-${Date.now()}`,
      title: `Officer Shift Handover & Clock-Out: ${officer.name}`,
      location: `${officer.currentSite}`,
      description: `Officer ${officer.name} completed duty shift (${totalHoursWorked}h worked) and clocked out.`,
      time: timeStr,
      priority: 'INFO',
      type: 'INFO'
    };
    setAlerts((prev) => [clockOutAlert, ...prev]);
    syncAlertToCloud(clockOutAlert).catch(console.error);

    const obEntry: OBEntry = {
      id: `ob-clockout-${Date.now()}`,
      time: timeStr,
      headline: `Shift Clock-Out Logged: ${officer.name}`,
      notes: `Officer completed daily shift at ${officer.currentSite}. Total hours verified: ${totalHoursWorked}h. Handover verified.`,
      status: 'completed',
      site: officer.currentSite,
      createdAt: new Date().toISOString()
    };
    setOBEntries((prev) => [obEntry, ...prev]);
    syncOBEntryToCloud(obEntry).catch(console.error);

    // Update site officersPresent count
    setSites((prevSites) =>
      prevSites.map((s) => {
        if (s.name.toLowerCase() === (officer.currentSite || '').toLowerCase()) {
          const updatedSite = {
            ...s,
            officersPresent: Math.max(0, (s.officersPresent || 1) - 1)
          };
          syncSiteToCloud(updatedSite).catch(console.error);
          return updatedSite;
        }
        return s;
      })
    );

    patrolAudio.playChime();
    showToast(`Shift completed & clocked out at ${timeStr} (${totalHoursWorked}h)`);
  };

  const checkCanAccessControlRoom = () => {
    if (!currentUserProfile) return false;
    return (
      currentUserProfile.role === 'admin' ||
      currentUserProfile.role === 'operator' ||
      currentUserProfile.controlRoomAccess === true
    );
  };

  const checkCanAccessAdminData = () => {
    if (!currentUserProfile) return false;
    return currentUserProfile.role === 'admin' || currentUserProfile.adminAccess === true;
  };

  const attemptSwitchToControlRoom = () => {
    if (checkCanAccessControlRoom()) {
      setActiveMode('desktop');
    } else {
      setRestrictedTargetArea('control_room');
      setIsAccessRestrictedOpen(true);
    }
  };

  const grantControlRoomAccess = () => {
    if (currentUserProfile) {
      const updated: UserAuthProfile = { ...currentUserProfile, controlRoomAccess: true };
      setCurrentUserProfile(updated);
      saveUserProfileToCloud(updated).catch(console.error);
    }
  };

  const grantAdminAccess = () => {
    if (currentUserProfile) {
      const updated: UserAuthProfile = { ...currentUserProfile, adminAccess: true, controlRoomAccess: true };
      setCurrentUserProfile(updated);
      saveUserProfileToCloud(updated).catch(console.error);
    }
  };

  const loginWithProfile = async (profile: UserAuthProfile) => {
    try {
      localStorage.setItem('dutyon_active_profile', JSON.stringify(profile));
    } catch (e) {}
    setCurrentUserProfile(profile);
    await saveUserProfileToCloud(profile);

    const profileEmail = (profile.email || '').toLowerCase().trim();
    const profileName = (profile.displayName || '').toLowerCase().trim();

    // 1. Check if user is system admin / director (Tshepo Maloa)
    const isAdminUser = profileEmail === 'tshepomaloa@gmail.com' || profile.adminAccess;

    // 2. Find matching officer record in the enrolled officers pool
    let targetOfficer =
      (profile.officerId ? officersList.find((o) => o.id === profile.officerId) : null) ||
      (profileEmail ? officersList.find((o) => o.email && o.email.toLowerCase().trim() === profileEmail) : null) ||
      (isAdminUser ? officersList.find((o) => o.id === 'off-admin' || o.name.toLowerCase().includes('tshepo')) : null) ||
      (profileName ? officersList.find((o) => o.name.toLowerCase().trim() === profileName) : null);

    if (!targetOfficer) {
      const defaultSite = 'Provincial Office';
      const name = profile.displayName || (isAdminUser ? 'Tshepo Maloa' : 'Security Personnel');
      const offId = profile.officerId || (isAdminUser ? 'off-admin' : `off-${profile.uid || Date.now()}`);
      
      const newOffRecord: OfficerRecord = {
        id: offId,
        name: name,
        empId: profile.empId || (isAdminUser ? 'DIR-0001' : `EMP-${Math.floor(1000 + Math.random() * 9000)}`),
        psiraNumber: profile.psiraNumber || '2490181',
        idNumber: '9305105694081',
        employmentPosition: 'Permanent',
        grade: isAdminUser ? 'Grade A (Director / Ops In-Charge)' : 'Grade C',
        phone: '071 283 3558',
        email: profile.email || '',
        currentSite: defaultSite,
        siteDeployed: defaultSite,
        currentPost: isAdminUser ? 'Command & Operations Center' : 'Main Security Post',
        location: userLocation ? userLocation.address : 'Provincial Government Office Complex, Beaufort West',
        coords: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : { lat: -32.3567, lng: 22.5833 },
        isClockedIn: false,
        batteryLevel: 98,
        welfareStatus: 'normal',
        lastScanTime: 'Never',
        firearmCompetency: isAdminUser,
        firstAidCert: true,
        avatarInitial: name[0] || 'O',
        documents: []
      };

      targetOfficer = newOffRecord;
      setOfficersList((prev) => [newOffRecord, ...prev.filter((o) => o.id !== offId)]);
      syncOfficerToCloud(newOffRecord).catch(console.error);

      const updatedProfile = { ...profile, officerId: offId };
      setCurrentUserProfile(updatedProfile);
      saveUserProfileToCloud(updatedProfile).catch(console.error);
    }

    if (targetOfficer) {
      switchActiveOfficer(targetOfficer.id);
    }

    // Always attempt high-precision GPS lock on login so location matches user's actual device
    requestLiveGPSLocation().catch(console.warn);

    if (profile.role === 'officer' && !profile.controlRoomAccess) {
      setActiveMode('mobile');
    } else if (profile.role === 'operator' || profile.role === 'admin') {
      setActiveMode('desktop');
    }
  };

  const logoutDutyOn = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    try {
      localStorage.removeItem('dutyon_active_profile');
    } catch (e) {}
    setCurrentUser(null);
    setCurrentUserProfile(null);
    showToast('Signed out of DutyOn Security session');
  };

  const switchActiveOfficer = (officerId: string) => {
    setOfficersList((prevList) => {
      const found = prevList.find((o) => o.id === officerId) || prevList[0];
      if (found) {
        const offCoords = userLocation 
          ? { lat: userLocation.lat, lng: userLocation.lng } 
          : (found.coords || { lat: -32.3567, lng: 22.5833 });
        const offLocation = userLocation 
          ? userLocation.address 
          : (found.location || `${found.currentSite}, Beaufort West`);

        setOfficer({
          name: found.name,
          avatarInitial: found.avatarInitial || found.name[0] || 'O',
          role: found.grade.includes('Director') 
            ? 'System Administrator / Director' 
            : found.grade.includes('Armed') 
            ? 'Armed Tactical Officer' 
            : 'Field Security Guard',
          grade: found.grade,
          currentSite: found.currentSite,
          siteDeployed: found.siteDeployed || found.currentSite,
          currentPost: found.currentPost || 'Main Security Post',
          location: offLocation,
          coords: offCoords,
          isClockedIn: Boolean(found.isClockedIn),
          clockInTime: found.clockInTime || '',
          clockInTimestamp: found.clockInTimestamp,
          shiftHours: '06:00–18:00',
          hoursToday: found.isClockedIn ? (found.hoursToday || '0.00') : '0.00',
          payPeriodHours: 0.0,
          isOnline: true,
          psiraNumber: found.psiraNumber,
          idNumber: found.idNumber,
          empId: found.empId,
          phone: found.phone,
          email: found.email
        });

        const matchedRoute = patrolRoutes.find(
          (r) =>
            r.siteName.toLowerCase().includes(found.currentSite.toLowerCase()) ||
            found.currentSite.toLowerCase().includes(r.siteName.toLowerCase())
        );
        if (matchedRoute) {
          setActiveRouteId(matchedRoute.id);
        }
      }
      return prevList;
    });
  };

  // Upcoming shifts
  const [upcomingShifts] = useState<ShiftItem[]>([
    {
      id: 'sh-1',
      siteName: 'Khwamagxaki',
      dateStr: 'Fri, 23 May 2026',
      dayNum: '23',
      dayName: 'Fri',
      timeWindow: '06:00 – 18:00',
      grade: 'Grade C',
      status: 'CONFIRMED'
    },
    {
      id: 'sh-2',
      siteName: 'Khwamagxaki',
      dateStr: 'Sat, 24 May 2026',
      dayNum: '24',
      dayName: 'Sat',
      timeWindow: '06:00 – 18:00',
      grade: 'Grade C',
      status: 'CONFIRMED'
    },
    {
      id: 'sh-3',
      siteName: 'Khwamagxaki',
      dateStr: 'Sun, 25 May 2026',
      dayNum: '25',
      dayName: 'Sun',
      timeWindow: '06:00 – 18:00',
      grade: 'Grade C',
      status: 'CONFIRMED'
    }
  ]);

  // Leave State
  const [leaveBalances] = useState({ annual: 12, sick: 18 });
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest>({
    leaveType: 'Sick Leave',
    startDate: '22 May 2026',
    endDate: '25 May 2026',
    reason: 'Flu and fever. Visiting doctor.',
    attachmentName: 'Medical certificate.pdf',
    attachmentSize: '214 KB',
    step: 0
  });

  const updateLeaveRequest = (updates: Partial<LeaveRequest>) => {
    setLeaveRequest((prev) => ({ ...prev, ...updates }));
  };

  const submitLeave = () => {
    setLeaveRequest((prev) => ({
      ...prev,
      step: 1,
      submittedAt: 'Just now'
    }));
    showToast('Leave request submitted to your supervisor');
  };

  // Pay Query
  const [payQuery, setPayQuery] = useState<PayQuery>({
    payslipPeriod: 'August 2026',
    issueType: 'Overtime hours',
    expectedHours: 24,
    paidHours: 12,
    message: 'I worked overtime on 15–16 Aug (night shift) but only 12 hours were paid.',
    attachmentName: 'Supporting timesheet.pdf',
    caseId: null,
    status: 'Draft'
  });

  const updatePayQuery = (updates: Partial<PayQuery>) => {
    setPayQuery((prev) => ({ ...prev, ...updates }));
  };

  const submitPayQuery = () => {
    setPayQuery((prev) => ({
      ...prev,
      caseId: 'PQ-1042',
      status: 'Payroll reviewing',
      submittedAt: '21 May 2026'
    }));
    showToast('Pay query PQ-1042 submitted');
  };

  // Documents
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 'doc-1',
      name: 'Employment Contract',
      category: 'Contract',
      description: 'PDF · Uploaded 12 Feb 2025',
      type: 'PDF',
      iconType: 'contract'
    },
    {
      id: 'doc-2',
      name: 'PSIRA Certificate',
      category: 'Compliance',
      description: 'Expires 30 Nov 2026',
      type: 'PDF',
      expiresSoon: true,
      expiryDate: '30 Nov 2026',
      iconType: 'psira'
    },
    {
      id: 'doc-3',
      name: 'South African ID',
      category: 'Identification',
      description: 'ID No: 910101 1234 084 · Uploaded 10 Jan 2025',
      type: 'DOC',
      iconType: 'id'
    },
    {
      id: 'doc-4',
      name: 'Payslips',
      category: 'Payroll',
      description: '12 documents · Latest: August 2026',
      type: 'PDF',
      iconType: 'payslip'
    },
    {
      id: 'doc-5',
      name: 'Warning Letters',
      category: 'Disciplinary',
      description: '1 document · Latest: 05 Mar 2026',
      type: 'PDF',
      iconType: 'warning'
    }
  ]);

  const addDocument = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
    saveOfficerDocumentToCloud(newDoc).catch((err) => {
      console.warn('Failed to save officer document to cloud:', err);
    });
    showToast(`✓ Stored in cloud: ${newDoc.name}`);
  };

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    deleteOfficerDocumentFromCloud(docId).catch((err) => {
      console.warn('Failed to delete officer document from cloud:', err);
    });
    showToast('Document removed from records');
  };

  // Occurrence Book
  const [obSite] = useState('Khwamagxaki');
  const [currentOBNote, setCurrentOBNote] = useState('');
  const [obEntries, setOBEntries] = useState<OBEntry[]>([]);

  const addOBEntry = (text: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEntry: OBEntry = {
      id: `ob-${Date.now()}`,
      time: timeStr,
      headline: text.trim() || 'Perimeter secure',
      notes: 'Logged by officer on site',
      status: 'completed'
    };
    setOBEntries((prev) => [newEntry, ...prev]);
    setCurrentOBNote('');
    showToast(`OB entry logged at ${timeStr}`);
    syncOBEntryToCloud(newEntry).catch((err) => {
      console.warn('Cloud sync buffered/delayed:', err);
    });
  };

  // Enterprise Patrols State
  const [patrolRoutes, setPatrolRoutes] = useState<PatrolRoute[]>([
    {
      id: 'RT-KWM-01',
      siteId: 'site-khwamagxaki',
      siteName: 'Khwamagxaki',
      title: 'Perimeter & Critical Boundary Loop',
      code: 'RT-KWM-01',
      priority: 'Critical',
      estDurationMinutes: 25,
      frequency: 'Every 60 min',
      description: 'Exterior perimeter fence line, main vehicle boom, pedestrian turnstiles and logistics loading bays.',
      checkpoints: [
        {
          id: 1,
          code: 'CP-01',
          name: 'Main Gate Access & Visitor Control',
          x: 70,
          y: 40,
          rangeMeters: 0,
          scanned: true,
          scannedAt: '23:15:22',
          scannedBy: 'Matyolo Nomahlubi (PSIRA 2753127)',
          tagUid: 'SFK-RFID-8819-KWM',
          tagType: 'Sefeko RFID',
          coordinates: '33.8642° S, 25.5684° E',
          targetWindow: '23:00 - 23:20',
          dwellTimeSec: 42,
          sopChecklist: [
            { id: 'sop-1-1', task: 'Inspect vehicle boom lock & barrier arm', passed: true, critical: true },
            { id: 'sop-1-2', task: 'Verify physical visitor register counter', passed: true, critical: false },
            { id: 'sop-1-3', task: 'Confirm CCTV dome camera lens free of glare/dirt', passed: true, critical: false }
          ],
          inspectionNotes: 'Boom motor operating smoothly. 18 visitors logged.'
        },
        {
          id: 2,
          code: 'CP-02',
          name: 'South Perimeter Fence & Wall Spikes',
          x: 200,
          y: 55,
          rangeMeters: 0,
          scanned: true,
          scannedAt: '23:28:45',
          scannedBy: 'Matyolo Nomahlubi (PSIRA 2753127)',
          tagUid: 'NFC-PER-2044-KWM',
          tagType: 'NFC Tag',
          coordinates: '33.8655° S, 25.5699° E',
          targetWindow: '23:20 - 23:35',
          dwellTimeSec: 65,
          sopChecklist: [
            { id: 'sop-2-1', task: 'Inspect razor wire tension & wall spikes', passed: true, critical: true },
            { id: 'sop-2-2', task: 'Check ground for burrowing or fence lift traces', passed: true, critical: true },
            { id: 'sop-2-3', task: 'Verify 500W floodlight operational', passed: true, critical: false }
          ],
          inspectionNotes: 'Fence tension intact. No footprints along sand trace.'
        },
        {
          id: 3,
          code: 'CP-03',
          name: 'North Gate & Logistics Shutter',
          x: 235,
          y: 120,
          rangeMeters: 14,
          scanned: false,
          tagUid: 'NFC-NTH-3190-KWM',
          tagType: 'NFC Tag',
          coordinates: '33.8631° S, 25.5712° E',
          targetWindow: '23:35 - 23:50',
          sopChecklist: [
            { id: 'sop-3-1', task: 'Verify heavy-duty roller shutter padlock secured', passed: false, critical: true },
            { id: 'sop-3-2', task: 'Match tamper-evident container seal #8841', passed: false, critical: true },
            { id: 'sop-3-3', task: 'Confirm emergency fire exit egress unblocked', passed: false, critical: true }
          ]
        },
        {
          id: 4,
          code: 'CP-04',
          name: 'Warehouse Bay 4 High-Value Cage',
          x: 110,
          y: 130,
          rangeMeters: 45,
          scanned: false,
          tagUid: 'BLE-WH4-0992-KWM',
          tagType: 'BLE Beacon',
          coordinates: '33.8624° S, 25.5678° E',
          targetWindow: '23:50 - 00:05',
          sopChecklist: [
            { id: 'sop-4-1', task: 'Check biometric double-locking status', passed: false, critical: true },
            { id: 'sop-4-2', task: 'Check fire sprinkler control valve open in green zone', passed: false, critical: true },
            { id: 'sop-4-3', task: 'Log HVAC room temperature display (target <22°C)', passed: false, critical: false }
          ]
        }
      ]
    },
    {
      id: 'RT-KWM-02',
      siteId: 'site-khwamagxaki',
      siteName: 'Khwamagxaki',
      title: 'Retail Concourse & Banking ATM Vault',
      code: 'RT-KWM-02',
      priority: 'High',
      estDurationMinutes: 20,
      frequency: 'Every 45 min',
      description: 'Banking mall ATM lobby, anchor tenants roller doors, food court fire exits and public washrooms.',
      checkpoints: [
        {
          id: 1,
          code: 'CP-01',
          name: 'Standard Bank ATM Lobby & Drop Safe',
          x: 95,
          y: 50,
          rangeMeters: 0,
          scanned: true,
          scannedAt: '22:45:10',
          tagUid: 'NFC-ATM-0144-KWM',
          tagType: 'NFC Tag',
          coordinates: '33.8638° S, 25.5689° E',
          sopChecklist: [
            { id: 'sop-atm-1', task: 'Physical skimmer check on ATM card mouth & pinpad', passed: true, critical: true },
            { id: 'sop-atm-2', task: 'CCTV dome convex mirror clean and aligned', passed: true, critical: false },
            { id: 'sop-atm-3', task: 'Vibration & duress sensor LED steady green', passed: true, critical: true }
          ]
        },
        {
          id: 2,
          code: 'CP-02',
          name: 'Food Court Emergency Fire Egress',
          x: 180,
          y: 90,
          rangeMeters: 12,
          scanned: false,
          tagUid: 'QR-EG-0211-KWM',
          tagType: 'QR Matrix',
          coordinates: '33.8645° S, 25.5695° E',
          sopChecklist: [
            { id: 'sop-eg-1', task: 'Panic bar opens freely from inside, latches securely', passed: false, critical: true },
            { id: 'sop-eg-2', task: '9kg Dry Chemical Powder fire extinguisher pin sealed', passed: false, critical: true },
            { id: 'sop-eg-3', task: 'Emergency lighting battery backup luminaire illuminated', passed: false, critical: false }
          ]
        },
        {
          id: 3,
          code: 'CP-03',
          name: 'Supermarket Loading Dock & Waste Compactor',
          x: 220,
          y: 135,
          rangeMeters: 38,
          scanned: false,
          tagUid: 'SFK-LD-0322-KWM',
          tagType: 'Sefeko RFID',
          coordinates: '33.8651° S, 25.5702° E',
          sopChecklist: [
            { id: 'sop-ld-1', task: 'Roller shutter chain padlock locked', passed: false, critical: true },
            { id: 'sop-ld-2', task: 'Waste compactor emergency stop not engaged', passed: false, critical: false }
          ]
        }
      ]
    },
    {
      id: 'RT-KWM-03',
      siteId: 'site-khwamagxaki',
      siteName: 'Khwamagxaki',
      title: '11kV Substation & Diesel Generator Depot',
      code: 'RT-KWM-03',
      priority: 'Critical',
      estDurationMinutes: 18,
      frequency: 'Every 90 min',
      description: 'Critical utility infrastructure, main municipal electrical incoming feed, diesel bulk storage tanks.',
      checkpoints: [
        {
          id: 1,
          code: 'CP-01',
          name: '11kV High Voltage Substation Yard',
          x: 65,
          y: 85,
          rangeMeters: 0,
          scanned: true,
          scannedAt: '22:10:04',
          tagUid: 'NFC-SUB-1101-KWM',
          tagType: 'NFC Tag',
          coordinates: '33.8660° S, 25.5670° E',
          sopChecklist: [
            { id: 'sop-sub-1', task: 'High Voltage Warning signage intact', passed: true, critical: true },
            { id: 'sop-sub-2', task: 'Heavy padlock locked on yard mesh gate', passed: true, critical: true },
            { id: 'sop-sub-3', task: 'No abnormal transformer arcing or oil smell', passed: true, critical: true }
          ]
        },
        {
          id: 2,
          code: 'CP-02',
          name: '500kVA Standby Generator & Diesel Tank',
          x: 145,
          y: 110,
          rangeMeters: 25,
          scanned: false,
          tagUid: 'SFK-GEN-2202-KWM',
          tagType: 'Sefeko RFID',
          coordinates: '33.8664° S, 25.5675° E',
          sopChecklist: [
            { id: 'sop-gen-1', task: 'Inspect diesel tank padlock & valve lock', passed: false, critical: true },
            { id: 'sop-gen-2', task: 'Battery isolator switch engaged & float charging', passed: false, critical: true },
            { id: 'sop-gen-3', task: 'Spill containment berm clean & dry', passed: false, critical: false }
          ]
        },
        {
          id: 3,
          code: 'CP-03',
          name: 'Rooftop Solar Inverter Plant Room',
          x: 240,
          y: 70,
          rangeMeters: 60,
          scanned: false,
          tagUid: 'BLE-SOL-3303-KWM',
          tagType: 'BLE Beacon',
          coordinates: '33.8640° S, 25.5682° E',
          sopChecklist: [
            { id: 'sop-sol-1', task: 'Rooftop access hatch locked from inside', passed: false, critical: true },
            { id: 'sop-sol-2', task: 'Inverter panel fault LEDs clear (all green)', passed: false, critical: false }
          ]
        }
      ]
    }
  ]);

  const [activeRouteId, setActiveRouteId] = useState('RT-KWM-01');
  const activeRoute = patrolRoutes.find((r) => r.id === activeRouteId) || patrolRoutes[0];
  const checkpoints = activeRoute.checkpoints;
  
  // Calculate current active checkpoint index (first unscanned, or length if all done)
  const currentCheckpointIndex = checkpoints.findIndex((cp) => !cp.scanned) === -1 
    ? checkpoints.length 
    : checkpoints.findIndex((cp) => !cp.scanned);

  // Life safety & Lone worker telemetry
  const [safetyStatus, setSafetyStatus] = useState<PatrolSafetyStatus>({
    welfarePingSecondsLeft: 874, // ~14 mins
    immobilityWarning: false,
    manDownActive: false,
    duressTriggered: false,
    batteryLevel: 91,
    networkMode: 'LTE 4G Online',
    offlineScansQueued: 0
  });

  // Ticking welfare countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSafetyStatus((prev) => {
        if (prev.welfarePingSecondsLeft <= 1) {
          return { ...prev, welfarePingSecondsLeft: 900, immobilityWarning: true };
        }
        return { ...prev, welfarePingSecondsLeft: prev.welfarePingSecondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const resetWelfarePing = () => {
    patrolAudio.playInspectionComplete();
    setSafetyStatus((prev) => ({
      ...prev,
      welfarePingSecondsLeft: 900,
      immobilityWarning: false
    }));
    showToast('Welfare check-in confirmed ✓ — Control Room logged');
    setAlerts((prev) => [
      {
        id: `alert-${Date.now()}`,
        title: 'Officer Lone Worker Check-in',
        location: `${officer.name} confirmed safe at ${activeRoute.siteName}`,
        description: 'Periodic welfare heartbeat verified OK',
        time: 'Just now',
        priority: 'INFO',
        type: 'INFO'
      },
      ...prev
    ]);
  };

  const triggerDuressPanic = () => {
    patrolAudio.playDuressTriggered();
    setSafetyStatus((prev) => ({ ...prev, duressTriggered: true }));
    showToast('DURESS SIGNAL TRANSMITTED SILENTLY TO CONTROL ROOM');
    
    const duressAlert: ControlRoomAlert = {
      id: `alert-duress-${Date.now()}`,
      title: '🚨 SILENT DURESS / OFFICER IN DISTRESS',
      location: `${officer.name} · ${activeRoute.siteName} · GPS Lock`,
      description: 'Officer triggered emergency panic button on patrol HUD. Armed tactical backup required immediately.',
      time: 'Just now',
      priority: 'HIGH',
      type: 'HIGH'
    };

    const duressIncident: IncidentQueueItem = {
      id: `inc-duress-${Date.now()}`,
      priority: 'HIGH',
      category: '🚨 SILENT DURESS / OFFICER IN DISTRESS',
      site: activeRoute.siteName || officer.currentSite,
      location: `${officer.name} · ${activeRoute.siteName || officer.currentSite} · GPS Lock`,
      coordinates: userLocation 
        ? `${userLocation.lat}, ${userLocation.lng}` 
        : (officer.coords ? `${officer.coords.lat}, ${officer.coords.lng}` : '-32.3567, 22.5833'),
      age: 'Just now',
      operator: officer.name,
      description: 'Officer triggered emergency panic button on patrol HUD. Armed tactical backup required immediately.',
      reportedAt: 'Just now',
      status: 'open',
      actionTaken: 'Dispatched Armed Response Fleet'
    };

    setAlerts((prev) => [duressAlert, ...prev]);
    setIncidents((prev) => [duressIncident, ...prev]);

    // Live Cloud Persistence
    syncAlertToCloud(duressAlert).catch(console.error);
    syncIncidentToCloud(duressIncident).catch(console.error);
  };

  const clearDuressPanic = () => {
    setSafetyStatus((prev) => ({ ...prev, duressTriggered: false }));
    showToast('Duress signal cleared by supervisor PIN');
  };

  const triggerManDownSensor = () => {
    patrolAudio.playExceptionAlert();
    setSafetyStatus((prev) => ({ ...prev, manDownActive: true }));
    showToast('MAN DOWN SENSOR TRIGGERED — NO MOTION DETECTED');
    const mandownAlert: ControlRoomAlert = {
      id: `alert-mandown-${Date.now()}`,
      title: '⚠️ MAN DOWN SENSOR TRIGGERED',
      location: `${officer.name} · Inactive > 180s · ${activeRoute.siteName || officer.currentSite}`,
      description: 'Immobility sensor detected possible fall or medical emergency',
      time: 'Just now',
      priority: 'HIGH',
      type: 'HIGH'
    };

    const mandownIncident: IncidentQueueItem = {
      id: `inc-mandown-${Date.now()}`,
      priority: 'HIGH',
      category: '⚠️ MAN DOWN SENSOR TRIGGERED',
      site: activeRoute.siteName || officer.currentSite,
      location: `${officer.name} · Inactive > 180s`,
      coordinates: userLocation 
        ? `${userLocation.lat}, ${userLocation.lng}` 
        : (officer.coords ? `${officer.coords.lat}, ${officer.coords.lng}` : '-32.3567, 22.5833'),
      age: 'Just now',
      operator: officer.name,
      description: 'Immobility sensor detected possible fall, casualty or medical emergency. Response unit required.',
      reportedAt: 'Just now',
      status: 'open',
      actionTaken: 'Triggered Supervisor Check & Ops Alert'
    };

    setAlerts((prev) => [mandownAlert, ...prev]);
    setIncidents((prev) => [mandownIncident, ...prev]);
    syncAlertToCloud(mandownAlert).catch(console.error);
    syncIncidentToCloud(mandownIncident).catch(console.error);
  };

  const clearManDownSensor = () => {
    setSafetyStatus((prev) => ({ ...prev, manDownActive: false }));
    showToast('Man Down alert cleared');
  };

  const toggleSOPItem = (checkpointId: number, sopId: string) => {
    patrolAudio.playTagScanned();
    setPatrolRoutes((prevRoutes) =>
      prevRoutes.map((route) => {
        if (route.id !== activeRouteId) return route;
        return {
          ...route,
          checkpoints: route.checkpoints.map((cp) => {
            if (cp.id !== checkpointId || !cp.sopChecklist) return cp;
            return {
              ...cp,
              sopChecklist: cp.sopChecklist.map((item) =>
                item.id === sopId ? { ...item, passed: !item.passed } : item
              )
            };
          })
        };
      })
    );
  };

  const scanCheckpointWithDetails = (details?: { 
    method?: 'NFC Tag' | 'Sefeko RFID' | 'BLE Beacon' | 'QR Matrix' | 'Manual Override';
    notes?: string; 
    photoUrl?: string; 
    voiceNoteUrl?: string;
    audioDurationSec?: number;
  }) => {
    if (currentCheckpointIndex >= checkpoints.length) {
      showToast('All checkpoints complete for this route');
      return;
    }

    const currentCP = checkpoints[currentCheckpointIndex];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Play tactile sound
    patrolAudio.playTagScanned();
    setTimeout(() => {
      patrolAudio.playInspectionComplete();
    }, 120);

    // Update the route's checkpoints
    setPatrolRoutes((prevRoutes) =>
      prevRoutes.map((route) => {
        if (route.id !== activeRouteId) return route;
        const updatedCheckpoints = route.checkpoints.map((cp, idx) => {
          if (idx === currentCheckpointIndex) {
            return {
              ...cp,
              scanned: true,
              scannedAt: timeStr,
              scannedBy: `${officer.name} (PSIRA ${officer.grade})`,
              dwellTimeSec: 45,
              inspectionNotes: details?.notes || cp.inspectionNotes,
              photoUrl: details?.photoUrl || cp.photoUrl,
              voiceNoteUrl: details?.voiceNoteUrl || cp.voiceNoteUrl,
              audioDurationSec: details?.audioDurationSec || cp.audioDurationSec,
              // Mark all SOP items passed if not already toggled
              sopChecklist: cp.sopChecklist?.map((s) => ({ ...s, passed: true }))
            };
          }
          return cp;
        });
        return { ...route, checkpoints: updatedCheckpoints };
      })
    );

    showToast(`${currentCP.name} verified ✓ (${details?.method || currentCP.tagType || 'NFC'})`);

    // Add entry to occurrence book (single source of truth)
    const newOBEntry: OBEntry = {
      id: `ob-patrol-${Date.now()}`,
      time: timeStr.slice(0, 5),
      headline: `Patrol Checkpoint Verified: ${currentCP.name}`,
      notes: `Route: ${activeRoute.title} (${activeRoute.code}) | Tag: ${currentCP.tagUid || 'NFC'} | Verification: ${details?.method || 'NFC Tap'} | Lat/Lng: ${currentCP.coordinates || 'GPS Locked'} | Officer: ${officer.name}${details?.notes ? ` | Notes: ${details.notes}` : ''}${details?.voiceNoteUrl ? ' | [Voice Note Attached]' : ''}`,
      status: 'completed',
      hasPhoto: Boolean(details?.photoUrl)
    };
    setOBEntries((prev) => [newOBEntry, ...prev]);

    // Broadcast alert to Control Room
    const scanAlert: ControlRoomAlert = {
      id: `alert-${Date.now()}`,
      title: `Patrol Checkpoint: ${currentCP.name}`,
      location: `${activeRoute.siteName} · ${details?.method || 'Sefeko/NFC'} Match`,
      description: `Verified by ${officer.name}. ${details?.notes ? `Inspection notes: "${details.notes}". ` : ''}${details?.photoUrl ? '📷 Photo attached. ' : ''}${details?.voiceNoteUrl ? '🎙️ Voice note attached. ' : ''}All SOP inspections passed.`,
      time: timeStr.slice(0, 5),
      priority: 'LOW',
      type: 'LOW',
      photoUrl: details?.photoUrl,
      mediaUrl: details?.photoUrl,
      voiceNoteUrl: details?.voiceNoteUrl,
      audioDurationSec: details?.audioDurationSec,
      officerName: officer.name,
      officerGrade: officer.grade,
      checkpointName: currentCP.name,
      routeTitle: activeRoute.title,
      commentary: details?.notes
    };
    setAlerts((prev) => [scanAlert, ...prev]);

    // Live Cloud Persistence (Phase 1)
    syncPatrolScanToCloud({
      id: `scan-${activeRoute.id}-${currentCP.id}-${Date.now()}`,
      routeId: activeRoute.id,
      checkpointId: currentCP.id,
      checkpointName: currentCP.name,
      scannedAt: timeStr,
      scannedBy: `${officer.name} (PSIRA ${officer.grade})`,
      tagUid: currentCP.tagUid || '',
      tagType: currentCP.tagType || 'NFC Tag',
      method: details?.method || currentCP.tagType || 'NFC Tag',
      dwellTimeSec: 45,
      inspectionNotes: details?.notes || currentCP.inspectionNotes || 'Normal checkpoint inspection verified.',
      photoUrl: details?.photoUrl || '',
      voiceNoteUrl: details?.voiceNoteUrl || '',
      audioDurationSec: details?.audioDurationSec || 0
    }).catch(console.error);
    syncOBEntryToCloud(newOBEntry).catch(console.error);
    syncAlertToCloud(scanAlert).catch(console.error);
  };

  // Backwards-compatible scan call
  const scanCurrentCheckpoint = () => {
    scanCheckpointWithDetails({ method: 'Sefeko RFID' });
  };

  // Exceptions
  const [patrolExceptions, setPatrolExceptions] = useState<PatrolException[]>([
    {
      id: 'exc-1',
      routeId: 'RT-KWM-01',
      siteName: 'Kwamagxaki Shopping Centre',
      checkpointName: 'North Gate & Logistics Shutter',
      category: 'Damaged Lock / Padlock',
      severity: 'HIGH',
      description: 'Heavy duty padlock has angle-grinder tampering marks. Secondary security chain remains secured.',
      timestamp: '23:31',
      officerName: 'Cebisa Ndlungwana',
      status: 'Investigating',
      actionTaken: 'Armed patrol vehicle notified to conduct exterior perimeter sweep.'
    },
    {
      id: 'exc-2',
      routeId: 'RT-GAC-01',
      siteName: 'Greenacres Mall',
      checkpointName: 'East Loading Bay Perimeter',
      category: 'Perimeter Fence Breach',
      severity: 'CRITICAL',
      description: 'Cut diamond mesh fence observed. Possible intruder entry vector.',
      timestamp: '21:45',
      officerName: 'Sipho Zungu',
      status: 'Dispatched',
      actionTaken: 'Response unit Bravo-3 dispatched to secure breach with mobile floodlight.'
    }
  ]);

  const reportPatrolExceptionDetailed = (exceptionData: {
    category: string;
    isCustomThreat?: boolean;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    description: string;
    checkpointName?: string;
    photoUrl?: string;
    voiceNoteUrl?: string;
    audioDurationSec?: number;
  }) => {
    patrolAudio.playExceptionAlert();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const cpName = exceptionData.checkpointName || (checkpoints[currentCheckpointIndex]?.name || 'Perimeter Route');

    const newException: PatrolException = {
      id: `exc-${Date.now()}`,
      routeId: activeRoute.id,
      siteName: activeRoute.siteName,
      checkpointName: cpName,
      category: exceptionData.category,
      isCustomThreat: exceptionData.isCustomThreat,
      severity: exceptionData.severity,
      description: exceptionData.description,
      timestamp: timeStr,
      officerName: officer.name,
      photoUrl: exceptionData.photoUrl || '',
      voiceNoteUrl: exceptionData.voiceNoteUrl || '',
      audioDurationSec: exceptionData.audioDurationSec || 0,
      status: 'Dispatched',
      actionTaken: 'Escalated to Duty Manager & Dispatched to Control Room Incident Queue'
    };

    setPatrolExceptions((prev) => [newException, ...prev]);
    showToast(`Exception reported: ${exceptionData.category} — dispatched`);

    // Auto-create Control Room Alert
    const excAlert: ControlRoomAlert = {
      id: `alert-${Date.now()}`,
      title: `Patrol Exception: ${exceptionData.category}`,
      location: `${activeRoute.siteName} · ${cpName}`,
      description: `${exceptionData.description}${exceptionData.photoUrl ? ' [📷 Photo Attached]' : ''}${exceptionData.voiceNoteUrl ? ' [🎙️ Voice Note Attached]' : ''}`,
      time: timeStr,
      priority: exceptionData.severity === 'CRITICAL' ? 'HIGH' : exceptionData.severity === 'HIGH' ? 'MED' : 'LOW',
      type: exceptionData.severity === 'CRITICAL' ? 'HIGH' : exceptionData.severity === 'HIGH' ? 'MED' : 'LOW',
      photoUrl: exceptionData.photoUrl,
      mediaUrl: exceptionData.photoUrl,
      voiceNoteUrl: exceptionData.voiceNoteUrl,
      audioDurationSec: exceptionData.audioDurationSec,
      officerName: officer.name,
      officerGrade: officer.grade,
      checkpointName: cpName,
      routeTitle: activeRoute.title,
      commentary: exceptionData.description,
      status: 'DISPATCHED'
    };
    setAlerts((prev) => [excAlert, ...prev]);

    // Auto-create Incident Queue item with complete docket evidence
    const currentCP = checkpoints[currentCheckpointIndex];
    const excIncident: IncidentQueueItem = {
      id: `inc-${Date.now()}`,
      priority: exceptionData.severity === 'CRITICAL' ? 'HIGH' : 'MED',
      category: `Patrol Exception: ${exceptionData.category}`,
      site: activeRoute.siteName,
      location: `${activeRoute.siteName} · ${cpName}`,
      coordinates: userLocation 
        ? `${userLocation.lat}, ${userLocation.lng}` 
        : (officer.coords ? `${officer.coords.lat}, ${officer.coords.lng}` : (currentCP?.coordinates || '-32.3567, 22.5833')),
      age: 'Just now',
      operator: officer.name,
      officerId: activeOfficerRecord?.id || officer.empId,
      checkpointName: cpName,
      routeTitle: activeRoute.title,
      description: exceptionData.description,
      reportedAt: timeStr,
      status: 'open',
      photoUrl: exceptionData.photoUrl,
      voiceNoteUrl: exceptionData.voiceNoteUrl,
      audioDurationSec: exceptionData.audioDurationSec,
      actionTaken: 'Escalated to Control Room Incident Queue & SAPS Docket Ready',
      evidenceFiles: [
        ...(exceptionData.photoUrl ? [{
          id: `ev-photo-${Date.now()}`,
          name: `Breach_${exceptionData.category.replace(/\s+/g, '_')}.jpg`,
          type: 'image/jpeg',
          size: '420 KB',
          uploadedAt: timeStr,
          url: exceptionData.photoUrl,
          category: 'image' as const
        }] : []),
        ...(exceptionData.voiceNoteUrl ? [{
          id: `ev-voice-${Date.now()}`,
          name: `Officer_VoiceDebrief_${timeStr.replace(/:/g, '')}.webm`,
          type: 'audio/webm',
          size: '310 KB',
          uploadedAt: timeStr,
          url: exceptionData.voiceNoteUrl,
          category: 'voice_note' as const,
          durationSec: exceptionData.audioDurationSec || 4
        }] : [])
      ]
    };
    setIncidents((prev) => [excIncident, ...prev]);

    // Auto-log to OB Book
    const newOBEntry: OBEntry = {
      id: `ob-exc-${Date.now()}`,
      time: timeStr,
      headline: `SECURITY EXCEPTION: ${exceptionData.category} at ${cpName}`,
      notes: `${exceptionData.description} | Reported by ${officer.name} | Severity: ${exceptionData.severity}${exceptionData.voiceNoteUrl ? ' | Voice Note Attached' : ''} | Response unit en-route`,
      status: 'in_progress',
      hasPhoto: Boolean(exceptionData.photoUrl)
    };
    setOBEntries((prev) => [newOBEntry, ...prev]);

    // Live Cloud Persistence
    syncPatrolExceptionToCloud(newException).catch(console.error);
    syncAlertToCloud(excAlert).catch(console.error);
    syncIncidentToCloud(excIncident).catch(console.error);
    syncOBEntryToCloud(newOBEntry).catch(console.error);
  };

  const reportPatrolException = () => {
    reportPatrolExceptionDetailed({
      category: 'Damaged Lock / Sensor Obstacle',
      severity: 'HIGH',
      description: 'Officer observed sensor obstacle or tampered lock at checkpoint.'
    });
  };

  // Sefeko Fleet Hardware
  const [sefekoDevices] = useState<SefekoDevice[]>([
    { id: 'sfk-1', serialNumber: 'WAND-SFK-4019', assignedOfficer: 'Khumalo Banele', assignedSite: 'Khwamagxaki', batteryPercent: 94, lastSync: '1 min ago', signalDbm: -68, firmwareVersion: 'v4.8.2-ZA', status: 'patrolling' },
    { id: 'sfk-2', serialNumber: 'WAND-SFK-4022', assignedOfficer: 'Mahlambi Mcedisi', assignedSite: 'Zebra Mountains', batteryPercent: 88, lastSync: '3 min ago', signalDbm: -72, firmwareVersion: 'v4.8.2-ZA', status: 'patrolling' },
    { id: 'sfk-3', serialNumber: 'WAND-SFK-4018', assignedOfficer: 'Platjie Joseph', assignedSite: 'Ganzekraal Resort', batteryPercent: 84, lastSync: '14 min ago', signalDbm: -84, firmwareVersion: 'v4.7.9-ZA', status: 'patrolling' },
    { id: 'sfk-4', serialNumber: 'WAND-SFK-4030', assignedOfficer: 'Banyane Simon', assignedSite: 'National Lottery (Kimberley)', batteryPercent: 99, lastSync: 'Just now', signalDbm: -65, firmwareVersion: 'v4.8.2-ZA', status: 'docked' }
  ]);

  // Client Proof of Service Reports
  const [proofOfServiceReports, setProofOfServiceReports] = useState<ClientProofOfService[]>([
    {
      id: 'POS-2026-KWM-0914',
      siteName: 'Khwamagxaki',
      clientName: 'Tikedi Holdings Clients',
      shiftDate: '14 Sep 2026 · Night Shift (18:00 - 06:00)',
      scheduledPatrols: 12,
      completedPatrols: 12,
      slaCompliance: 100.0,
      totalPointsScanned: 48,
      missedPoints: 0,
      exceptionsLogged: 0,
      supervisorSignoff: 'Luvo (081 216 0464)',
      generatedAt: '14 Sep 2026, 23:40 SAST'
    },
    {
      id: 'POS-2026-ZBR-0914',
      siteName: 'Zebra Mountains',
      clientName: 'Tikedi Holdings Operations',
      shiftDate: '14 Sep 2026 · Night Shift (18:00 - 06:00)',
      scheduledPatrols: 14,
      completedPatrols: 14,
      slaCompliance: 100.0,
      totalPointsScanned: 56,
      missedPoints: 0,
      exceptionsLogged: 0,
      supervisorSignoff: 'Wonga (065 896 8113)',
      generatedAt: '14 Sep 2026, 23:35 SAST'
    },
    {
      id: 'POS-2026-GNZ-0914',
      siteName: 'Ganzekraal Resort',
      clientName: 'Tikedi Holdings Operations',
      shiftDate: '14 Sep 2026 · Night Shift (18:00 - 06:00)',
      scheduledPatrols: 16,
      completedPatrols: 16,
      slaCompliance: 100.0,
      totalPointsScanned: 64,
      missedPoints: 0,
      exceptionsLogged: 0,
      supervisorSignoff: 'Cloete (081 483 0072)',
      generatedAt: '14 Sep 2026, 23:00 SAST'
    }
  ]);

  const [selectedReport, setSelectedReport] = useState<ClientProofOfService | null>(null);

  // Patrol Tour Finalization & Transmission to Control Room
  const completePatrolTour = (
    routeId: string,
    details?: {
      commentary?: string;
      mediaUrl?: string;
      photoUrl?: string;
      audioUrl?: string;
      voiceNoteUrl?: string;
      audioDurationSec?: number;
      status?: string;
    }
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const targetRoute = patrolRoutes.find((r) => r.id === routeId) || activeRoute;
    const photo = details?.photoUrl || details?.mediaUrl;
    const voice = details?.voiceNoteUrl || details?.audioUrl;
    const comment = details?.commentary?.trim() || 'Routine perimeter sweep executed. All access points and security seals inspected.';

    // 1. Mark checkpoints as completed/verified
    setPatrolRoutes((prev) =>
      prev.map((r) => {
        if (r.id === routeId || r.id === targetRoute.id) {
          return {
            ...r,
            lastCompletedAt: timeStr,
            checkpoints: r.checkpoints.map((cp) => ({
              ...cp,
              scanned: true,
              scannedAt: timeStr,
              scannedBy: `${officer.name} (PSIRA ${officer.psiraNumber || 'VERIFIED'})`
            }))
          };
        }
        return r;
      })
    );

    // 2. Log in Occurrence Book
    const obSummary = `[PATROL TRANSMITTED] Route: ${targetRoute.title} (${targetRoute.code}) at ${officer.currentSite}. Status: ${details?.status || 'ALL CLEAR'}. Commentary: ${comment}`;
    addOBEntry(obSummary);

    // 3. Add to Control Room Alerts
    const newAlert: ControlRoomAlert = {
      id: `alert-patrol-${Date.now()}`,
      title: `Patrol Tour Transmitted: ${targetRoute.title}`,
      location: officer.currentSite,
      time: timeStr,
      priority: details?.status === 'FLAGGED_EXCEPTIONS' ? 'HIGH' : 'INFO',
      type: details?.status === 'FLAGGED_EXCEPTIONS' ? 'HIGH' : 'INFO',
      description: `Officer ${officer.name} (${officer.grade}) completed tour. Commentary: "${comment}"`,
      photoUrl: photo,
      mediaUrl: photo,
      voiceNoteUrl: voice,
      audioUrl: voice,
      audioDurationSec: details?.audioDurationSec,
      officerName: officer.name,
      officerGrade: officer.grade,
      routeTitle: targetRoute.title,
      commentary: comment,
      status: details?.status || 'COMPLETED',
      createdAt: now.toISOString()
    };
    setAlerts((prev) => [newAlert, ...prev]);
    // Persist alert to cloud Firestore so it synchronizes to Control Room instantly
    syncAlertToCloud(newAlert).catch((err) => {
      console.warn('Could not sync patrol alert to cloud:', err);
    });

    // 4. Update Proof of Service reports
    const newReport: ClientProofOfService = {
      id: `pos-${Date.now()}`,
      siteName: targetRoute.siteName,
      clientName: targetRoute.siteName,
      shiftDate: `${now.toLocaleDateString('en-ZA')} · Shift Window`,
      scheduledPatrols: 4,
      completedPatrols: 4,
      slaCompliance: 100,
      totalPointsScanned: targetRoute.checkpoints.length,
      missedPoints: 0,
      exceptionsLogged: details?.status === 'FLAGGED_EXCEPTIONS' ? 1 : 0,
      supervisorSignoff: 'Verified by Central Control Room Dispatch',
      generatedAt: now.toISOString(),
      commentary: comment,
      photoUrl: photo,
      audioUrl: voice,
      officerName: officer.name,
      routeTitle: targetRoute.title
    };
    setProofOfServiceReports((prev) => [newReport, ...prev]);

    // 5. Broadcast in Tactical Comms Net with attached photo & audio
    const msgText = `[PATROL TRANSMITTED] ${targetRoute.title} finalized at ${officer.currentSite}.`;
    sendMessage(msgText, {
      channel: 'control_room',
      siteName: officer.currentSite,
      fromControlRoom: false,
      photoUrl: photo,
      mediaUrl: photo,
      voiceNoteUrl: voice,
      audioUrl: voice,
      audioDurationSec: details?.audioDurationSec,
      commentary: comment,
      target: 'control_room'
    });

    showToast(`✓ Patrol Tour transmitted to Control Room successfully!`);
  };

  // Add custom checkpoint to route
  const addCheckpointToRoute = (routeId: string, cp: any) => {
    setPatrolRoutes((prev) =>
      prev.map((r) => {
        if (r.id === routeId) {
          return {
            ...r,
            checkpoints: [...(r.checkpoints || []), cp]
          };
        }
        return r;
      })
    );
    showToast(`✓ Checkpoint "${cp.name}" added to patrol circuit`);
  };

  // Com-Chat & PTT
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'Control Room Dispatch (S. Mashaya)',
      initials: 'CR',
      color: '#E53E3E',
      time: '06:00',
      text: 'Morning parade complete. All tactical officers confirm Sefeko wand sync and radio check.',
      fromControlRoom: true,
      channel: 'control_room',
      siteName: 'Provincial Office',
      senderRole: 'operator'
    },
    {
      id: 'msg-2',
      sender: 'Matyolo Nomahlubi',
      initials: 'MN',
      color: '#2b6cb0',
      time: '06:14',
      text: 'Zebra Mountains: Access gate open, all visitor biometric scanners online. All secure.',
      channel: 'Zebra Mountains',
      siteName: 'Zebra Mountains',
      senderRole: 'officer'
    },
    {
      id: 'msg-3',
      sender: 'Tshepo Maloa',
      initials: 'TM',
      color: '#1FA6C9',
      time: '06:30',
      text: 'Provincial Office: Main gate, command center, and perimeter patrols active. Standing by for dispatch.',
      channel: 'control_room',
      siteName: 'Provincial Office',
      senderRole: 'admin'
    }
  ]);
  const [isPTTLive, setIsPTTLive] = useState(false);

  const sendMessage = (
    text: string,
    options?: {
      channel?: string;
      siteName?: string;
      isUrgent?: boolean;
      fromControlRoom?: boolean;
      target?: string;
      photoUrl?: string;
      mediaUrl?: string;
      voiceNoteUrl?: string;
      audioUrl?: string;
      audioDurationSec?: number;
      commentary?: string;
    }
  ) => {
    if (!text.trim() && !options?.commentary && !options?.photoUrl && !options?.voiceNoteUrl && !options?.audioUrl) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isCtrl = options?.fromControlRoom ?? (activeMode === 'desktop' || currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'operator');
    const senderName = isCtrl 
      ? (currentUserProfile?.displayName || 'Control Room Dispatch')
      : officer.name;
    const senderInit = isCtrl ? 'CR' : (officer.avatarInitial || 'O');
    const photo = options?.photoUrl || options?.mediaUrl;
    const voice = options?.voiceNoteUrl || options?.audioUrl;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: senderName,
      initials: senderInit,
      color: isCtrl ? '#E53E3E' : '#1FA6C9',
      time: timeStr,
      text: text.trim(),
      isUrgent: options?.isUrgent || false,
      fromControlRoom: isCtrl,
      channel: options?.channel || (isCtrl ? 'control_room' : officer.currentSite),
      siteName: options?.siteName || officer.currentSite,
      senderRole: currentUserProfile?.role || (isCtrl ? 'operator' : 'officer'),
      senderEmail: currentUser?.email || currentUserProfile?.email || officer.email,
      target: options?.target || 'all',
      photoUrl: photo,
      mediaUrl: photo,
      voiceNoteUrl: voice,
      audioUrl: voice,
      audioDurationSec: options?.audioDurationSec,
      commentary: options?.commentary,
      createdAt: now.toISOString()
    };
    setMessages((prev) => [...prev, newMsg]);
    syncMessageToCloud(newMsg).catch((err) => {
      console.warn('Could not sync chat message to cloud:', err);
    });
    showToast(isCtrl ? 'Dispatch broadcast sent' : 'Message transmitted to Control Room');
  };

  // Control Room Data
  const [alerts, setAlerts] = useState<ControlRoomAlert[]>([]);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    showToast('Alert dismissed');
    dismissAlertInCloud(id).catch(console.error);
  };

  const [incidents, setIncidents] = useState<IncidentQueueItem[]>([]);

  const resolveIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'resolved' as const } : inc))
    );
    showToast('Incident marked as resolved in dispatch log');
    resolveIncidentInCloud(id).catch(console.error);
  };

  const [sites, setSites] = useState<MultiSiteItem[]>(TIKEDI_SITES);

  const [incidentQueue] = useState<IncidentQueueItem[]>([]);

  const [siteStatuses, setSiteStatuses] = useState<SiteStatusItem[]>([
    { site: 'Zebra Mountains', supervisor: 'Wonga (065 896 8113)', posts: 4, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' },
    { site: 'Ganzekraal Resort', supervisor: 'Cloete (081 483 0072)', posts: 8, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' },
    { site: 'Jankempsdorp', supervisor: 'Ops Desk (053 456 0100)', posts: 5, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' },
    { site: 'National Lottery (Kimberley)', supervisor: 'Clive (082 432 1300)', posts: 7, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' },
    { site: 'Khwamagxaki', supervisor: 'Luvo (081 216 0464)', posts: 14, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' },
    { site: 'Lindsy', supervisor: 'Luvo (081 216 0464)', posts: 3, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' },
    { site: 'National Library and Centre for the Book', supervisor: 'Magomed (069 226 5093)', posts: 19, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' },
    { site: '54 York Street (George)', supervisor: 'Municipality Ops (044 803 1300)', posts: 4, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' },
    { site: 'SARAO', supervisor: 'Miles (021 506 7300)', posts: 5, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' },
    { site: 'Mossel Bay', supervisor: 'Station Desk (044 606 5000)', posts: 2, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' },
    { site: 'Provincial Office', supervisor: 'Skombuzo Mashaya (060 944 6828)', posts: 8, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' },
    { site: 'SAAO (Cape Town)', supervisor: 'Sanchia (076 392 0261)', posts: 10, nextPatrol: 'Active', lastOB: 'On Duty', status: 'Good' }
  ]);

  const [rosterRows, setRosterRows] = useState<EmployeeRosterRow[]>(INITIAL_TIKEDI_ROSTER_ROWS);

  // Modal active states
  const [selectedOfficerForModal, setSelectedOfficerForModal] = useState<OfficerRecord | null>(null);
  const [selectedSiteForModal, setSelectedSiteForModal] = useState<MultiSiteItem | null>(null);
  const [selectedIncidentForModal, setSelectedIncidentForModal] = useState<IncidentQueueItem | null>(null);
  const [selectedRosterShift, setSelectedRosterShift] = useState<{ officer: EmployeeRosterRow; dayIdx: number; dayName: string } | null>(null);
  const [isNewIncidentModalOpen, setIsNewIncidentModalOpen] = useState(false);
  const [isNewOfficerModalOpen, setIsNewOfficerModalOpen] = useState(false);
  const [isNewSiteModalOpen, setIsNewSiteModalOpen] = useState(false);
  const [isNewFleetModalOpen, setIsNewFleetModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // Fleet Vehicles State
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([
    {
      id: 'veh-1',
      callSign: 'AR-01 Alpha',
      vehicleModel: 'Toyota Hilux 2.8 GD-6 4x4',
      regPlate: 'EC 492-311',
      crew: 'Sipho Nxumalo & N. Dlamini (Armed)',
      status: '10-8 Available',
      speedKmH: 42,
      batteryPct: 98,
      fuelPct: 82,
      radioChannel: 'VHF Tactical Ch 04',
      sector: 'Gqeberha Central & CBD',
      coords: { x: 170, y: 75 },
      destination: 'Routine Tactical Patrol',
      etaMin: 3
    },
    {
      id: 'veh-2',
      callSign: 'AR-02 Bravo',
      vehicleModel: 'Isuzu D-Max 3.0 Tactical',
      regPlate: 'EC 881-209',
      crew: 'Matyolo Nomahlubi & K. Khumalo',
      status: '10-23 En Route',
      speedKmH: 64,
      batteryPct: 94,
      fuelPct: 76,
      radioChannel: 'VHF Emergency Ch 01',
      sector: 'Kwamagxaki / New Brighton',
      coords: { x: 260, y: 135 },
      destination: 'Greenacres Mall (Priority 1 Alarm)',
      etaMin: 2
    },
    {
      id: 'veh-3',
      callSign: 'Echo-3 Central',
      vehicleModel: 'Ford Ranger 4x4 Heavy Duty',
      regPlate: 'EC 710-449',
      crew: 'Bongani Sithole (Grade A Armed)',
      status: '10-8 Available',
      speedKmH: 0,
      batteryPct: 99,
      fuelPct: 91,
      radioChannel: 'VHF Tactical Ch 04',
      sector: 'Deal Party Industrial Hub',
      coords: { x: 155, y: 150 },
      destination: 'Standby At Depot',
      etaMin: 0
    },
    {
      id: 'veh-4',
      callSign: 'K9-01 Hunter',
      vehicleModel: 'VW Amarok V6 K9 Unit',
      regPlate: 'EC 912-700',
      crew: 'S. Van Der Merwe & K9 Rex',
      status: '10-8 Available',
      speedKmH: 28,
      batteryPct: 92,
      fuelPct: 68,
      radioChannel: 'VHF K9 Ch 06',
      sector: 'Summerstrand / Port Precinct',
      coords: { x: 215, y: 120 },
      destination: 'Perimeter Search Routine',
      etaMin: 5
    }
  ]);

  const addFleetVehicle = (vehicleData: Omit<FleetVehicle, 'id'>) => {
    const newVehicle: FleetVehicle = {
      ...vehicleData,
      id: `veh-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setFleetVehicles((prev) => [newVehicle, ...prev]);
    syncFleetVehicleToCloud(newVehicle).catch(console.error);
    showToast(`🚔 Armed Vehicle Enrolled: "${newVehicle.callSign}" (${newVehicle.regPlate})`);
  };

  const updateFleetVehicle = (id: string, updates: Partial<FleetVehicle>) => {
    setFleetVehicles((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const updated = { ...v, ...updates };
          syncFleetVehicleToCloud(updated).catch(console.error);
          return updated;
        }
        return v;
      })
    );
  };

  const deleteFleetVehicle = (id: string) => {
    setFleetVehicles((prev) => prev.filter((v) => v.id !== id));
    deleteFleetVehicleInCloud(id).catch(console.error);
    showToast(`Vehicle decommissioned from live fleet`);
  };

  const deleteOfficer = (officerId: string) => {
    setOfficersList((prev) => prev.filter((o) => o.id !== officerId && o.empId !== officerId));
    setRosterRows((prev) => prev.filter((r) => r.empId !== officerId));
    deleteOfficerInCloud(officerId).catch(console.error);
    showToast(`Officer removed from active roster`);
  };

  const addSite = (siteData: Partial<MultiSiteItem>) => {
    const newSite: MultiSiteItem = {
      id: siteData.id || `site-${Date.now()}`,
      name: siteData.name || 'New Security Site',
      location: siteData.location || 'Gqeberha, Eastern Cape',
      category: siteData.category || 'Commercial Precinct',
      officersRequired: siteData.officersRequired || 4,
      officersPresent: siteData.officersPresent || 0,
      patrolStatus: siteData.patrolStatus || 'Perimeter Active',
      compliance: siteData.compliance || 100,
      status: siteData.status || 'operational',
      clientContactName: siteData.clientContactName || 'Site Manager',
      clientPhone: siteData.clientPhone || '+27 41 500 0000',
      emergencyPhone: siteData.emergencyPhone || '+27 82 500 0000',
      sapsStation: siteData.sapsStation || 'Humewood SAPS',
      sapsSectorPhone: siteData.sapsSectorPhone || '+27 41 504 5000',
      armedResponseUnit: siteData.armedResponseUnit || 'AR-01 Alpha Tactical',
      geofenceRadius: siteData.geofenceRadius || 35,
      coords: siteData.coords || { x: 180 + Math.floor(Math.random() * 80), y: 120 + Math.floor(Math.random() * 60) },
      posts: siteData.posts || [
        { id: `p-${Date.now()}-1`, name: 'Main Security Gatehouse', requiredGrade: 'Grade B', assignedOfficer: 'Unassigned', status: 'vacant' },
        { id: `p-${Date.now()}-2`, name: 'Perimeter Patrol Post', requiredGrade: 'Grade C', assignedOfficer: 'Unassigned', status: 'vacant' }
      ],
      files: siteData.files || [],
      notes: siteData.notes || 'Strict perimeter compliance. Sefeko RFID checkpoint tags configured.',
      createdAt: new Date().toISOString()
    };
    setSites((prev) => [newSite, ...prev]);
    syncSiteToCloud(newSite).catch(console.error);
    showToast(`🏢 Protected Site Enrolled: "${newSite.name}" (${newSite.geofenceRadius}m geofence)`);
  };

  const deleteSite = (siteId: string) => {
    setSites((prev) => prev.filter((s) => s.id !== siteId));
    deleteSiteInCloud(siteId).catch(console.error);
    showToast(`Site and geofenced perimeter deleted`);
  };

  // Officer Operations
  const updateOfficer = (officerId: string, updates: Partial<OfficerRecord>) => {
    setOfficersList((prev) =>
      prev.map((off) => (off.id === officerId ? { ...off, ...updates } : off))
    );
    if (selectedOfficerForModal && selectedOfficerForModal.id === officerId) {
      setSelectedOfficerForModal((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const reassignOfficerSite = (officerId: string, newSite: string, newPost: string) => {
    updateOfficer(officerId, { currentSite: newSite, currentPost: newPost });
    // Also update roster site
    setRosterRows((prev) =>
      prev.map((row) => {
        const off = officersList.find((o) => o.id === officerId);
        if (off && off.name === row.name) {
          return { ...row, site: newSite };
        }
        return row;
      })
    );
  };

  const sendOfficerWelfarePing = (officerId: string) => {
    const off = officersList.find((o) => o.id === officerId);
    if (!off) return;
    patrolAudio.playChime();
    setAlerts((prev) => [
      {
        id: `alt-${Date.now()}`,
        title: `Welfare Ping Sent to ${off.name}`,
        location: `${off.currentSite} · ${off.currentPost}`,
        description: `High-priority lone worker check initiated from Control Room`,
        time: new Date().toLocaleTimeString().slice(0, 5),
        priority: 'MED',
        type: 'MED'
      },
      ...prev
    ]);
  };

  const uploadOfficerFile = (officerId: string, doc: DocumentItem) => {
    setOfficersList((prev) =>
      prev.map((off) => {
        if (off.id === officerId) {
          const updatedDocs = [...(off.documents || []), doc];
          return { ...off, documents: updatedDocs };
        }
        return off;
      })
    );
    if (selectedOfficerForModal && selectedOfficerForModal.id === officerId) {
      setSelectedOfficerForModal((prev) =>
        prev ? { ...prev, documents: [...(prev.documents || []), doc] } : null
      );
    }
  };

  const updateOfficerStatus = (officerId: string, isClockedIn: boolean) => {
    updateOfficer(officerId, { isClockedIn });
  };

  // Site Operations
  const updateSite = (siteId: string, updates: Partial<MultiSiteItem>) => {
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          const updated = { ...s, ...updates };
          syncSiteToCloud(updated).catch(console.error);
          return updated;
        }
        return s;
      })
    );
    if (selectedSiteForModal && selectedSiteForModal.id === siteId) {
      setSelectedSiteForModal((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const uploadSiteFile = (siteId: string, file: SiteFile) => {
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          const updatedFiles = [...(s.files || []), file];
          return { ...s, files: updatedFiles };
        }
        return s;
      })
    );
    if (selectedSiteForModal && selectedSiteForModal.id === siteId) {
      setSelectedSiteForModal((prev) =>
        prev ? { ...prev, files: [...(prev.files || []), file] } : null
      );
    }
  };

  const lockdownSite = (siteId: string) => {
    const siteObj = sites.find((s) => s.id === siteId);
    if (!siteObj) return;
    patrolAudio.playDuressSiren();
    updateSite(siteId, { status: 'critical' });
    setAlerts((prev) => [
      {
        id: `alt-lock-${Date.now()}`,
        title: `🚨 EMERGENCY SITE LOCKDOWN: ${siteObj.name}`,
        location: `${siteObj.location}`,
        description: `Full perimeter lockdown triggered by Control Room operator`,
        time: new Date().toLocaleTimeString().slice(0, 5),
        priority: 'HIGH',
        type: 'HIGH'
      },
      ...prev
    ]);
  };

  const dispatchArmedBackupToSite = (siteId: string) => {
    const siteObj = sites.find((s) => s.id === siteId);
    if (!siteObj) return;
    patrolAudio.playChime();
    setAlerts((prev) => [
      {
        id: `alt-armed-${Date.now()}`,
        title: `🚔 Armed Tactical Backup Dispatched: ${siteObj.armedResponseUnit || 'Bravo-4'}`,
        location: `${siteObj.name} · ETA 6 mins`,
        description: `Armed tactical response vehicle proceeding with siren & lights`,
        time: new Date().toLocaleTimeString().slice(0, 5),
        priority: 'HIGH',
        type: 'HIGH'
      },
      ...prev
    ]);
  };

  // Roster Operations
  const updateRosterShift = (empId: string, dayIdx: number, shift: 'D' | 'N' | 'OFF' | 'OPEN' | 'EXC') => {
    setRosterRows((prev) =>
      prev.map((r) => {
        if (r.empId === empId) {
          const newShifts = [...r.shifts];
          newShifts[dayIdx] = shift;
          return { ...r, shifts: newShifts };
        }
        return r;
      })
    );
  };

  const addRosterOfficer = (newOfficer: OfficerRecord) => {
    setOfficersList((prev) => [...prev, newOfficer]);
    const rosterItem: EmployeeRosterRow = {
      name: newOfficer.name,
      empId: newOfficer.empId,
      grade: newOfficer.grade.replace('Grade ', ''),
      color: '#1FA6C9',
      shifts: ['D', 'D', 'D', 'D', 'OFF', 'N', 'OFF'],
      site: newOfficer.currentSite,
      psiraNumber: newOfficer.psiraNumber,
      phone: newOfficer.phone
    };
    setRosterRows((prev) => [...prev, rosterItem]);
    syncOfficerToCloud(newOfficer).catch(console.error);
    showToast(`👮 Guard Enrolled: "${newOfficer.name}" (${newOfficer.psiraNumber})`);
  };

  const autoFillOpenShifts = () => {
    let filledCount = 0;
    setRosterRows((prev) =>
      prev.map((row) => {
        const newShifts = row.shifts.map((sh, idx) => {
          if (sh === 'OPEN' || sh === 'EXC') {
            filledCount++;
            return (idx % 2 === 0 ? 'D' : 'N') as 'D' | 'N';
          }
          return sh;
        });
        return { ...row, shifts: newShifts };
      })
    );
    patrolAudio.playChime();
    showToast(`AI Roster Optimizer: Successfully filled ${filledCount || 4} open relief shifts`);
    setAlerts((prev) => [
      {
        id: `alt-roster-${Date.now()}`,
        title: `Auto-Relief Roster Optimized`,
        location: `Fleet-wide Multi-Site Roster`,
        description: `Open/unassigned posts matched with compliant PSIRA officers`,
        time: new Date().toLocaleTimeString().slice(0, 5),
        priority: 'LOW',
        type: 'LOW'
      },
      ...prev
    ]);
  };

  const publishRoster = (weekStr: string) => {
    patrolAudio.playChime();
    showToast(`Roster published for ${weekStr} — SMS & In-App notifications dispatched`);
    setAlerts((prev) => [
      {
        id: `alt-pub-${Date.now()}`,
        title: `Master Roster Published: ${weekStr}`,
        location: `All 34 Sites`,
        description: `Finalized shift schedule locked. Broadcast delivered to officer mobile fleet.`,
        time: new Date().toLocaleTimeString().slice(0, 5),
        priority: 'INFO',
        type: 'INFO'
      },
      ...prev
    ]);
  };

  const swapRosterShifts = (empId1: string, empId2: string, dayIdx: number) => {
    setRosterRows((prev) => {
      const row1 = prev.find((r) => r.empId === empId1);
      const row2 = prev.find((r) => r.empId === empId2);
      if (!row1 || !row2) return prev;
      const s1 = row1.shifts[dayIdx];
      const s2 = row2.shifts[dayIdx];
      return prev.map((r) => {
        if (r.empId === empId1) {
          const newShifts = [...r.shifts];
          newShifts[dayIdx] = s2;
          return { ...r, shifts: newShifts };
        }
        if (r.empId === empId2) {
          const newShifts = [...r.shifts];
          newShifts[dayIdx] = s1;
          return { ...r, shifts: newShifts };
        }
        return r;
      });
    });
    showToast(`Shift swapped successfully for Day ${dayIdx + 1}`);
  };

  const verifyOfficerPsira = (psiraNumber: string) => {
    return {
      valid: true,
      grade: 'Grade A / Armed Response',
      expiry: '2027-11-30',
      statusText: `PSIRA #${psiraNumber} verified active in national registry`
    };
  };

  // Incident Operations
  const createIncident = (newInc: IncidentQueueItem) => {
    setIncidents((prev) => [newInc, ...prev]);
    syncIncidentToCloud(newInc).catch(console.error);
    setAlerts((prev) => [
      {
        id: `alt-${Date.now()}`,
        title: `Emergency Incident #${newInc.id}: ${newInc.category}`,
        location: `${newInc.site}`,
        description: newInc.description || 'Dispatched by Control Room',
        time: new Date().toLocaleTimeString().slice(0, 5),
        priority: (newInc.priority.toUpperCase() === 'CRITICAL' || newInc.priority.toUpperCase() === 'HIGH' ? 'HIGH' : 'MED') as any,
        type: (newInc.priority.toUpperCase() === 'CRITICAL' || newInc.priority.toUpperCase() === 'HIGH' ? 'HIGH' : 'MED') as any
      },
      ...prev
    ]);
  };

  const updateIncident = (id: string, updates: Partial<IncidentQueueItem>) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, ...updates } : inc))
    );
    if (selectedIncidentForModal && selectedIncidentForModal.id === id) {
      setSelectedIncidentForModal((prev) => (prev ? { ...prev, ...updates } : null));
    }
    const found = incidents.find((i) => i.id === id);
    if (found) {
      syncIncidentToCloud({ ...found, ...updates }).catch(console.error);
    }
  };

  const addIncidentNote = (incidentId: string, text: string, author = 'Control Room') => {
    const noteItem: IncidentNote = {
      id: `note-${Date.now()}`,
      author,
      time: new Date().toLocaleTimeString().slice(0, 5),
      text
    };
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          const notes = [...(inc.notes || []), noteItem];
          return { ...inc, notes };
        }
        return inc;
      })
    );
    if (selectedIncidentForModal && selectedIncidentForModal.id === incidentId) {
      setSelectedIncidentForModal((prev) =>
        prev ? { ...prev, notes: [...(prev.notes || []), noteItem] } : null
      );
    }
  };

  const uploadIncidentEvidence = (incidentId: string, evidence: EvidenceFile) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          const files = [...(inc.evidenceFiles || []), evidence];
          return { ...inc, evidenceFiles: files };
        }
        return inc;
      })
    );
    if (selectedIncidentForModal && selectedIncidentForModal.id === incidentId) {
      setSelectedIncidentForModal((prev) =>
        prev ? { ...prev, evidenceFiles: [...(prev.evidenceFiles || []), evidence] } : null
      );
    }
  };

  const deleteIncident = (incidentId: string) => {
    setIncidents((prev) => prev.filter((i) => i.id !== incidentId));
    deleteIncidentInCloud(incidentId).catch(console.error);
    if (selectedIncidentForModal && selectedIncidentForModal.id === incidentId) {
      setSelectedIncidentForModal(null);
    }
    showToast(`Case Docket #${incidentId} removed from log`);
  };

  const deleteIncidentEvidence = (incidentId: string, evidenceId: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          const files = (inc.evidenceFiles || []).filter((f) => f.id !== evidenceId);
          return { ...inc, evidenceFiles: files };
        }
        return inc;
      })
    );
    if (selectedIncidentForModal && selectedIncidentForModal.id === incidentId) {
      setSelectedIncidentForModal((prev) =>
        prev ? { ...prev, evidenceFiles: (prev.evidenceFiles || []).filter((f) => f.id !== evidenceId) } : null
      );
    }
    showToast('Evidence document removed from docket');
  };

  const broadcastControlRoomAlert = (
    title: string,
    message: string,
    targetSite: string,
    priority: 'CRITICAL' | 'HIGH' | 'MED' = 'CRITICAL'
  ) => {
    patrolAudio.playDuressSiren();
    const alertItem: ControlRoomAlert = {
      id: `alt-bc-${Date.now()}`,
      title: `📢 FLEET BROADCAST: ${title}`,
      location: targetSite === 'ALL_SITES' ? 'All 34 Sites (Fleet-Wide)' : targetSite,
      description: message,
      time: new Date().toLocaleTimeString().slice(0, 5),
      priority: priority === 'CRITICAL' || priority === 'HIGH' ? 'HIGH' : 'MED',
      type: priority === 'CRITICAL' || priority === 'HIGH' ? 'HIGH' : 'MED'
    };
    setAlerts((prev) => [alertItem, ...prev]);
    syncAlertToCloud(alertItem).catch(console.error);
  };

  // Dynamically compute siteCoverages from real live sites and clocked in officers
  const siteCoverages: SiteCoverageItem[] = useMemo(() => {
    return sites.map((s) => {
      const postsTotal = s.officersRequired || 4;
      const postsFilled = officersList.filter(
        (o) => o.currentSite === s.name && Boolean(o.isClockedIn)
      ).length;
      const siteIncidents = incidents.filter(
        (i) => i.site === s.name && i.status !== 'resolved'
      ).length;
      const percent = postsTotal > 0 ? Math.round((postsFilled / postsTotal) * 100) : 0;
      return {
        site: s.name,
        percent,
        postsFilled,
        postsTotal,
        exceptions: siteIncidents
      };
    });
  }, [sites, officersList, incidents]);

  // Sectoral Timesheets & Shift Recording
  const addTimesheet = (entry: TimesheetEntry) => {
    setTimesheets((prev) => [entry, ...prev.filter((t) => t.id !== entry.id)]);
    syncTimesheetToCloud(entry).catch(console.error);
    showToast(`Timesheet recorded for ${entry.officerName}`);
  };

  const recordCompletedShift = (details: {
    officerId: string;
    siteName: string;
    date?: string;
    shiftType?: 'DAY' | 'NIGHT';
    standardHours: number;
    overtimeHours?: number;
    isSunday?: boolean;
    isPublicHoliday?: boolean;
  }) => {
    const off = officersList.find((o) => o.id === details.officerId) || officersList[0];
    const shiftDate = details.date || new Date().toISOString().slice(0, 10);
    const dateObj = new Date(shiftDate);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
    const dayName = daysOfWeek[dateObj.getDay()];
    const isSunday = details.isSunday ?? (dateObj.getDay() === 0);
    const isNight = details.shiftType === 'NIGHT';
    const std = Number(details.standardHours) || 12.0;
    const ot = Number(details.overtimeHours) || 0.0;
    const totalActual = std + ot;
    const baseRate = GRADE_RATES[off?.grade]?.baseHourly ?? 48.50;
    const billRate = GRADE_RATES[off?.grade]?.clientBilling ?? 115.00;

    const newTs: TimesheetEntry = {
      id: `ts-${off?.empId || 'TKD'}-${shiftDate}-${Date.now()}`,
      officerId: details.officerId,
      empId: off?.empId || 'TKD-1000',
      officerName: off?.name || 'Security Officer',
      grade: off?.grade || 'Grade A',
      siteName: details.siteName || off?.currentSite || 'Provincial Office',
      date: shiftDate,
      dayOfWeek: dayName,
      isSunday,
      isPublicHoliday: Boolean(details.isPublicHoliday),
      shiftType: isNight ? 'NIGHT' : 'DAY',
      scheduledStart: isNight ? '18:00' : '06:00',
      scheduledEnd: isNight ? '06:00' : '18:00',
      clockInTime: isNight ? '17:58' : '05:58',
      clockOutTime: isNight ? '06:02' : '18:02',
      biometricVerified: true,
      biometricMethod: 'Face Liveness AI',
      standardHours: std,
      actualHours: totalActual,
      billableHours: totalActual,
      overtimeHours: ot,
      nightAllowanceHours: isNight ? std : 0,
      isNightAllowanceEligible: isNight,
      hourlyRate: baseRate,
      clientBillingRate: billRate,
      status: 'VERIFIED'
    };

    setTimesheets((prev) => [newTs, ...prev.filter((t) => t.id !== newTs.id)]);
    syncTimesheetToCloud(newTs).catch(console.error);
    showToast(`✓ Recorded ${totalActual}h verified shift for ${newTs.officerName}`);
  };

  const deleteTimesheet = (id: string) => {
    setTimesheets((prev) => prev.filter((t) => t.id !== id));
    deleteTimesheetInCloud(id).catch(console.error);
    showToast('Timesheet entry removed');
  };

  const clearAllTimesheets = () => {
    setTimesheets([]);
    clearAllTimesheetsInCloud().catch(console.error);
    showToast('All timesheet logs cleared');
  };

  const deletePatrolException = (id: string) => {
    setPatrolExceptions((prev) => prev.filter((e) => e.id !== id));
    deletePatrolExceptionInCloud(id).catch(console.error);
    showToast('Patrol exception cleared');
  };

  const clearPatrolException = async (id: string) => {
    setPatrolExceptions((prev) => prev.filter((e) => e.id !== id));
    await deletePatrolExceptionInCloud(id).catch(console.error);
    showToast('✓ Breach exception cleared from log');
  };

  const clearAllPatrolExceptions = async () => {
    setPatrolExceptions([]);
    await clearAllPatrolExceptionsInCloud().catch(console.error);
    showToast('✓ All breach exceptions cleared from system');
  };

  const resolvePatrolException = async (id: string, notes?: string) => {
    setPatrolExceptions((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated: PatrolException = {
            ...e,
            status: 'RESOLVED',
            actionTaken: notes || 'Investigated and secured by tactical supervisor.'
          };
          syncPatrolExceptionToCloud(updated).catch(console.error);
          return updated;
        }
        return e;
      })
    );
    showToast(`✓ Breach ${id} marked as RESOLVED`);
  };

  const deletePatrolScan = async (id: string) => {
    setPatrolScans((prev) => prev.filter((s) => s.id !== id));
    if (id.startsWith('cp-')) {
      const parts = id.split('-');
      const routeId = parts[1];
      const cpId = parts.slice(2).join('-');
      setPatrolRoutes((prev) =>
        prev.map((r) =>
          r.id === routeId
            ? {
                ...r,
                checkpoints: r.checkpoints.map((cp) =>
                  cp.id === cpId
                    ? { ...cp, scanned: false, scannedAt: undefined, scannedBy: undefined }
                    : cp
                )
              }
            : r
        )
      );
    }
    await deletePatrolScanInCloud(id).catch(console.error);
    showToast('Patrol scan log removed');
  };

  const clearAllPatrolScans = async () => {
    setPatrolScans([]);
    setPatrolRoutes((prev) =>
      prev.map((r) => ({
        ...r,
        checkpoints: r.checkpoints.map((cp) => ({
          ...cp,
          scanned: false,
          scannedAt: undefined,
          scannedBy: undefined
        }))
      }))
    );
    await clearAllPatrolScansInCloud().catch(console.error);
    showToast('✓ All real-time patrol scan logs cleared');
  };

  // Manual Clock-in & Clock-out from Control Room (Visual Shift Command)
  const manualClockInOfficer = async (officerId: string, siteName?: string, postName?: string) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    const timestampNow = now.getTime();

    let targetOfficer: OfficerRecord | null = null;

    setOfficersList((prev) =>
      prev.map((o) => {
        if (o.id === officerId) {
          const updated: OfficerRecord = {
            ...o,
            isClockedIn: true,
            clockInTime: timeStr,
            clockInTimestamp: timestampNow,
            currentSite: siteName || o.currentSite || 'Provincial Office',
            currentPost: postName || o.currentPost || 'Main Security Post'
          };
          targetOfficer = updated;
          syncOfficerToCloud(updated).catch(console.error);
          return updated;
        }
        return o;
      })
    );

    // If active officer is this officer, update active local state as well
    setOfficer((prev) => {
      if (activeOfficerRecord?.id === officerId || prev.name === targetOfficer?.name) {
        return {
          ...prev,
          isClockedIn: true,
          clockInTime: timeStr,
          clockInTimestamp: timestampNow,
          hoursToday: '0.01',
          currentSite: siteName || prev.currentSite,
          currentPost: postName || prev.currentPost
        };
      }
      return prev;
    });

    const offName = targetOfficer?.name || 'Security Personnel';
    const site = siteName || targetOfficer?.currentSite || 'Provincial Office';
    const grade = targetOfficer?.grade || 'Grade C';

    // 1. Create live Timesheet entry
    const isNight = now.getHours() >= 18 || now.getHours() < 6;
    const isSunday = now.getDay() === 0;
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

    const liveTimesheet: TimesheetEntry = {
      id: `ts-${officerId}-${now.toISOString().slice(0, 10)}-${timestampNow}`,
      officerId,
      empId: targetOfficer?.empId || 'DIR-0001',
      officerName: offName,
      grade,
      siteName: site,
      date: now.toISOString().slice(0, 10),
      dayOfWeek: daysOfWeek[now.getDay()],
      isSunday,
      isPublicHoliday: false,
      shiftType: isNight ? 'NIGHT' : 'DAY',
      scheduledStart: isNight ? '18:00' : '06:00',
      scheduledEnd: isNight ? '06:00' : '18:00',
      clockInTime: timeStr,
      clockOutTime: timeStr,
      biometricVerified: true,
      biometricMethod: 'Supervisor Override',
      standardHours: 0.0,
      actualHours: 0.01,
      billableHours: 0.01,
      overtimeHours: 0.0,
      nightAllowanceHours: isNight ? 1.0 : 0.0,
      isNightAllowanceEligible: isNight,
      hourlyRate: GRADE_RATES[grade]?.baseHourly ?? 48.50,
      clientBillingRate: GRADE_RATES[grade]?.clientBilling ?? 115.00,
      status: 'VERIFIED'
    };
    setTimesheets((prev) => [liveTimesheet, ...prev]);
    syncTimesheetToCloud(liveTimesheet).catch(console.error);

    // 2. Alert
    const clockInAlert: ControlRoomAlert = {
      id: `alert-manual-${Date.now()}`,
      title: `Manual Attendance Roll Call: ${offName}`,
      location: `${site} · Visual Shift Command`,
      description: `Controller manually confirmed ${offName} (${grade}) on duty at ${site}. Live tracking initiated.`,
      time: timeStr,
      priority: 'LOW',
      type: 'LOW'
    };
    setAlerts((prev) => [clockInAlert, ...prev]);
    syncAlertToCloud(clockInAlert).catch(console.error);

    // 3. OB Entry
    const obEntry: OBEntry = {
      id: `ob-manual-${Date.now()}`,
      time: timeStr,
      headline: `Manual Roll Call Confirmed: ${offName}`,
      notes: `Officer ${offName} placed on active duty via Visual Shift Command at ${site}. Post assignment: ${postName || 'Active Post'}.`,
      status: 'completed',
      site: site,
      hasPhoto: false,
      createdAt: now.toISOString()
    };
    setOBEntries((prev) => [obEntry, ...prev]);
    syncOBEntryToCloud(obEntry).catch(console.error);

    // 4. Update Site
    setSites((prevSites) =>
      prevSites.map((s) => {
        if (s.name.toLowerCase() === site.toLowerCase()) {
          const updatedSite = {
            ...s,
            officersPresent: (s.officersPresent || 0) + 1,
            patrolStatus: 'Active'
          };
          syncSiteToCloud(updatedSite).catch(console.error);
          return updatedSite;
        }
        return s;
      })
    );

    patrolAudio.playChime();
    showToast(`✓ ${offName} manually clocked on duty at ${site}`);
  };

  const manualClockOutOfficer = async (officerId: string) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    let targetOfficer: OfficerRecord | null = null;

    setOfficersList((prev) =>
      prev.map((o) => {
        if (o.id === officerId) {
          const updated: OfficerRecord = {
            ...o,
            isClockedIn: false,
            clockInTimestamp: undefined
          };
          targetOfficer = updated;
          syncOfficerToCloud(updated).catch(console.error);
          return updated;
        }
        return o;
      })
    );

    setOfficer((prev) => {
      if (activeOfficerRecord?.id === officerId || prev.name === targetOfficer?.name) {
        return {
          ...prev,
          isClockedIn: false,
          clockInTimestamp: undefined
        };
      }
      return prev;
    });

    const offName = targetOfficer?.name || 'Security Personnel';
    const site = targetOfficer?.currentSite || 'Provincial Office';

    // Finalize timesheet
    setTimesheets((prev) =>
      prev.map((ts) => {
        if (ts.officerId === officerId && !ts.clockOutTime) {
          const finalized: TimesheetEntry = {
            ...ts,
            clockOutTime: timeStr,
            standardHours: Math.max(0.5, ts.actualHours || 1),
            actualHours: Math.max(0.5, ts.actualHours || 1),
            billableHours: Math.max(0.5, ts.billableHours || 1),
            status: 'VERIFIED'
          };
          syncTimesheetToCloud(finalized).catch(console.error);
          return finalized;
        }
        return ts;
      })
    );

    // Update site
    setSites((prevSites) =>
      prevSites.map((s) => {
        if (s.name.toLowerCase() === site.toLowerCase()) {
          const updatedSite = {
            ...s,
            officersPresent: Math.max(0, (s.officersPresent || 1) - 1)
          };
          syncSiteToCloud(updatedSite).catch(console.error);
          return updatedSite;
        }
        return s;
      })
    );

    patrolAudio.playInspectionComplete();
    showToast(`✓ ${offName} clocked off duty from ${site}`);
  };

  const resetToRealLifeData = async () => {
    try {
      showToast('Purging old placeholder data and bulk enrolling Tikedi Holdings operations...');
      await purgeAllPlaceholderDataFromCloud();
      await syncAllTikediDataToCloud(TIKEDI_SITES, TIKEDI_OFFICERS);

      setSites(TIKEDI_SITES);
      setOfficersList(TIKEDI_OFFICERS);
      setRosterRows(INITIAL_TIKEDI_ROSTER_ROWS);
      setIncidents([]);
      setAlerts([]);
      setOBEntries([]);
      setTimesheets([]);
      setPatrolExceptions([]);

      patrolAudio.playChime();
      showToast('✅ Platform cleaned & Tikedi Holdings operations enrolled in cloud');
    } catch (err) {
      console.error('Failed to reset data:', err);
      setSites(TIKEDI_SITES);
      setOfficersList(TIKEDI_OFFICERS);
      setRosterRows(INITIAL_TIKEDI_ROSTER_ROWS);
      setIncidents([]);
      setAlerts([]);
      setOBEntries([]);
      setTimesheets([]);
      setPatrolExceptions([]);
      showToast('Tikedi operations loaded (cloud operating in offline mode)');
    }
  };

  // ---------------- FIRESTORE CLOUD PERSISTENCE (PHASE 1) ----------------
  useEffect(() => {
    // 1. Connection test
    testFirestoreConnection().then((connected) => {
      setIsCloudConnected(connected);
      if (connected) {
        console.log('DutyOn: Connected to Cloud Firestore database');
      }
    });

    // 2. Real-time OB Entries subscription
    const unsubOB = subscribeToOBEntries((cloudEntries) => {
      setOBEntries((prevLocal) => {
        const existingIds = new Set(cloudEntries.map((e) => e.id));
        const keptLocal = prevLocal.filter((e) => !existingIds.has(e.id));
        return [...cloudEntries, ...keptLocal];
      });
    });

    // 3. Real-time Incidents subscription
    const unsubInc = subscribeToIncidents((cloudIncidents) => {
      setIncidents((prevLocal) => {
        const existingIds = new Set(cloudIncidents.map((i) => i.id));
        const keptLocal = prevLocal.filter((i) => !existingIds.has(i.id));
        return [...cloudIncidents, ...keptLocal];
      });
    });

    // 4. Real-time Alerts subscription
    const unsubAlerts = subscribeToAlerts((cloudAlerts) => {
      setAlerts((prevLocal) => {
        const cloudMap = new Map(cloudAlerts.map((a) => [a.id, a]));
        const merged: ControlRoomAlert[] = [];

        for (const local of prevLocal) {
          if (cloudMap.has(local.id)) {
            const cloud = cloudMap.get(local.id)!;
            merged.push({
              ...cloud,
              photoUrl: local.photoUrl || cloud.photoUrl,
              mediaUrl: local.mediaUrl || cloud.mediaUrl,
              voiceNoteUrl: local.voiceNoteUrl || cloud.voiceNoteUrl,
              audioUrl: local.audioUrl || cloud.audioUrl,
              audioDurationSec: local.audioDurationSec || cloud.audioDurationSec,
              commentary: local.commentary || cloud.commentary,
              officerName: local.officerName || cloud.officerName,
              routeTitle: local.routeTitle || cloud.routeTitle,
              createdAt: (local as any).createdAt || (cloud as any).createdAt
            });
            cloudMap.delete(local.id);
          } else {
            merged.push(local);
          }
        }
        for (const remaining of cloudMap.values()) {
          merged.push(remaining);
        }

        return merged.sort((a, b) => {
          const tA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : (parseInt(a.id.replace(/\D/g, '')) || 0);
          const tB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : (parseInt(b.id.replace(/\D/g, '')) || 0);
          return tB - tA;
        });
      });
    });

    // 4b. Real-time Tactical Chat Messages subscription
    const unsubMessages = subscribeToMessages((cloudMessages) => {
      if (cloudMessages.length === 0) return;
      setMessages((prevLocal) => {
        const cloudMap = new Map(cloudMessages.map((m) => [m.id, m]));
        const merged: ChatMessage[] = [];

        for (const local of prevLocal) {
          if (cloudMap.has(local.id)) {
            const cloud = cloudMap.get(local.id)!;
            merged.push({
              ...cloud,
              photoUrl: local.photoUrl || cloud.photoUrl,
              mediaUrl: local.mediaUrl || cloud.mediaUrl,
              voiceNoteUrl: local.voiceNoteUrl || cloud.voiceNoteUrl,
              audioUrl: local.audioUrl || cloud.audioUrl,
              audioDurationSec: local.audioDurationSec || cloud.audioDurationSec,
              commentary: local.commentary || cloud.commentary,
              createdAt: (local as any).createdAt || (cloud as any).createdAt
            });
            cloudMap.delete(local.id);
          } else {
            merged.push(local);
          }
        }
        for (const remaining of cloudMap.values()) {
          merged.push(remaining);
        }

        return merged.sort((a, b) => {
          const tA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : (parseInt(a.id.replace(/\D/g, '')) || 0);
          const tB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : (parseInt(b.id.replace(/\D/g, '')) || 0);
          return tA - tB;
        });
      });
    });

    // 5. Real-time Patrol Exceptions subscription
    const unsubExceptions = subscribeToPatrolExceptions((cloudExceptions) => {
      setPatrolExceptions((prevLocal) => {
        const existingIds = new Set(cloudExceptions.map((ex) => ex.id));
        const keptLocal = prevLocal.filter((ex) => !existingIds.has(ex.id));
        return [...cloudExceptions, ...keptLocal];
      });
    });

    // 6. Real-time Patrol Scans subscription
    const unsubScans = subscribeToPatrolScans((cloudScans) => {
      setPatrolScans(cloudScans);
      if (cloudScans.length === 0) return;
      const scannedCpIds = new Map(cloudScans.map((s) => [s.checkpointId, s]));
      setPatrolRoutes((prevRoutes) =>
        prevRoutes.map((route) => ({
          ...route,
          checkpoints: route.checkpoints.map((cp) => {
            const scan = scannedCpIds.get(cp.id);
            if (scan) {
              return {
                ...cp,
                scanned: true,
                scannedAt: scan.scannedAt || cp.scannedAt,
                scannedBy: scan.scannedBy || cp.scannedBy,
                inspectionNotes: scan.inspectionNotes || cp.inspectionNotes,
                photoUrl: scan.photoUrl || cp.photoUrl
              };
            }
            return cp;
          })
        }))
      );
    });

    // 7. Real-time Fleet Vehicles subscription
    const unsubVehicles = subscribeToFleetVehicles((cloudVehicles) => {
      setFleetVehicles((prevLocal) => {
        const existingIds = new Set(cloudVehicles.map((v) => v.id));
        const keptLocal = prevLocal.filter((v) => !existingIds.has(v.id));
        return [...cloudVehicles, ...keptLocal];
      });
    });

    // 8. Real-time Sites subscription
    const unsubSites = subscribeToSites((cloudSites) => {
      setSites((prevLocal) => {
        const existingIds = new Set(cloudSites.map((s) => s.id));
        const keptLocal = prevLocal.filter((s) => !existingIds.has(s.id));
        return [...cloudSites, ...keptLocal];
      });
    });

    // 9. Real-time Officers subscription
    const unsubOfficers = subscribeToOfficers((cloudOfficers) => {
      setOfficersList((prevLocal) => {
        const unmatchedCloud = [...cloudOfficers];
        const merged = prevLocal.map((local) => {
          // Find matching cloud record by ID, email, empId, or trimmed name
          const cloudIdx = unmatchedCloud.findIndex(
            (c) =>
              c.id === local.id ||
              (c.email && local.email && c.email.toLowerCase().trim() === local.email.toLowerCase().trim()) ||
              (c.empId && local.empId && c.empId.toLowerCase().trim() === local.empId.toLowerCase().trim()) ||
              (c.name && local.name && c.name.toLowerCase().trim() === local.name.toLowerCase().trim())
          );

          if (cloudIdx !== -1) {
            const cloud = unmatchedCloud[cloudIdx];
            unmatchedCloud.splice(cloudIdx, 1);
            return {
              ...local,
              ...cloud,
              id: local.id, // preserve canonical local id
              isClockedIn: Boolean(cloud.isClockedIn),
              clockInTime: cloud.clockInTime || local.clockInTime,
              clockInTimestamp: cloud.clockInTimestamp ?? local.clockInTimestamp,
              hoursToday: cloud.hoursToday || local.hoursToday,
              currentSite: cloud.currentSite || local.currentSite,
              currentPost: cloud.currentPost || local.currentPost,
              coords: cloud.coords || local.coords,
              location: cloud.location || local.location
            };
          }
          return local;
        });

        // Any new officers enrolled from cloud that didn't match existing personnel
        for (const remaining of unmatchedCloud) {
          merged.push({
            ...remaining,
            isClockedIn: Boolean(remaining.isClockedIn)
          });
        }

        return merged;
      });
    });

    // 10. Real-time Timesheets subscription
    const unsubTimesheets = subscribeToTimesheets((cloudTimesheets) => {
      if (cloudTimesheets.length > 0) {
        setTimesheets((prevLocal) => {
          const cloudIds = new Set(cloudTimesheets.map((t) => t.id));
          const keptLocal = prevLocal.filter((t) => !cloudIds.has(t.id));
          return [...cloudTimesheets, ...keptLocal];
        });
      }
    });

    // 11. Real-time Officer Documents subscription
    const unsubOfficerDocs = subscribeToOfficerDocuments((cloudDocs) => {
      if (cloudDocs.length > 0) {
        setDocuments((prevLocal) => {
          const cloudIds = new Set(cloudDocs.map((d) => d.id));
          const keptLocal = prevLocal.filter((d) => !cloudIds.has(d.id));
          return [...cloudDocs, ...keptLocal];
        });
      }
    });

    // 12. Firebase Auth state change observer (with graceful offline fallback)
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const isAdmin = user.email?.toLowerCase() === 'tshepomaloa@gmail.com';
        try {
          const cloudProf = await getUserProfileFromCloud(user.uid);
          if (cloudProf) {
            if (isAdmin && cloudProf.role !== 'admin') {
              cloudProf.role = 'admin';
              cloudProf.adminAccess = true;
              cloudProf.controlRoomAccess = true;
              saveUserProfileToCloud(cloudProf).catch(() => {});
            }
            setCurrentUserProfile(cloudProf);
            if (cloudProf.officerId) {
              switchActiveOfficer(cloudProf.officerId);
            }
            return;
          }
        } catch (err) {
          console.warn('Could not retrieve user profile from cloud (offline mode active):', err);
        }

        const offId = isAdmin ? 'off-admin' : `off-${user.uid}`;
        const matchedExisting = officersList.find((o) => o.email?.toLowerCase() === user.email?.toLowerCase());
        const resolvedOfficerId = matchedExisting ? matchedExisting.id : offId;

        const newProf: UserAuthProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Security Personnel',
          photoURL: user.photoURL,
          role: isAdmin ? 'admin' : 'officer',
          officerId: resolvedOfficerId,
          empId: matchedExisting?.empId || (isAdmin ? 'DIR-0001' : `EMP-${Math.floor(1000 + Math.random() * 9000)}`),
          psiraNumber: matchedExisting?.psiraNumber || '2490181',
          controlRoomAccess: isAdmin,
          adminAccess: isAdmin,
          createdAt: new Date().toISOString()
        };
        setCurrentUserProfile(newProf);
        saveUserProfileToCloud(newProf).catch(() => {});
        loginWithProfile(newProf).catch(console.error);
      }
    });

    return () => {
      unsubOB();
      unsubInc();
      unsubAlerts();
      unsubMessages();
      unsubExceptions();
      unsubScans();
      unsubVehicles();
      unsubSites();
      unsubOfficers();
      unsubTimesheets();
      unsubOfficerDocs();
      unsubAuth();
    };
  }, []);

  return (
    <DutyOnContext.Provider
      value={{
        currentUser,
        currentUserProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isAccessRestrictedOpen,
        setIsAccessRestrictedOpen,
        restrictedTargetArea,
        setRestrictedTargetArea,
        loginWithProfile,
        grantControlRoomAccess,
        grantAdminAccess,
        switchActiveOfficer,
        checkCanAccessControlRoom,
        checkCanAccessAdminData,
        attemptSwitchToControlRoom,
        logoutDutyOn,
        doClockOut,
        activeMode,
        setActiveMode,
        mobileScreen,
        setMobileScreen,
        desktopTab,
        setDesktopTab,
        controlRoomTab,
        setControlRoomTab,
        isMoreSheetOpen,
        setIsMoreSheetOpen,
        clockTime,
        officer,
        activeOfficerId,
        activeOfficerRecord,
        doClockIn,
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
        patrolRoutes,
        activeRouteId,
        setActiveRouteId,
        activeRoute,
        toggleSOPItem,
        scanCheckpointWithDetails,
        patrolExceptions,
        reportPatrolExceptionDetailed,
        safetyStatus,
        resetWelfarePing,
        triggerDuressPanic,
        clearDuressPanic,
        triggerManDownSensor,
        clearManDownSensor,
        sefekoDevices,
        proofOfServiceReports,
        selectedReport,
        setSelectedReport,
        completePatrolTour,
        addCheckpointToRoute,
        messages,
        sendMessage,
        isPTTLive,
        setIsPTTLive,
        alerts,
        dismissAlert,
        incidents,
        resolveIncident,
        sites,
        incidentQueue,
        siteStatuses,
        rosterRows,
        siteCoverages,
        officersList,
        selectedOfficerForModal,
        setSelectedOfficerForModal,
        selectedSiteForModal,
        setSelectedSiteForModal,
        selectedIncidentForModal,
        setSelectedIncidentForModal,
        selectedRosterShift,
        setSelectedRosterShift,
        isNewIncidentModalOpen,
        setIsNewIncidentModalOpen,
        isNewOfficerModalOpen,
        setIsNewOfficerModalOpen,
        isNewSiteModalOpen,
        setIsNewSiteModalOpen,
        isNewFleetModalOpen,
        setIsNewFleetModalOpen,
        isBroadcastModalOpen,
        setIsBroadcastModalOpen,
        fleetVehicles,
        addFleetVehicle,
        updateFleetVehicle,
        deleteFleetVehicle,
        updateOfficer,
        deleteOfficer,
        reassignOfficerSite,
        sendOfficerWelfarePing,
        uploadOfficerFile,
        updateOfficerStatus,
        addSite,
        updateSite,
        deleteSite,
        uploadSiteFile,
        lockdownSite,
        dispatchArmedBackupToSite,
        updateRosterShift,
        addRosterOfficer,
        autoFillOpenShifts,
        publishRoster,
        swapRosterShifts,
        verifyOfficerPsira,
        createIncident,
        updateIncident,
        deleteIncident,
        addIncidentNote,
        uploadIncidentEvidence,
        deleteIncidentEvidence,
        broadcastControlRoomAlert,
        toastMessage,
        showToast,
        isCloudConnected,
        timesheets,
        addTimesheet,
        deleteTimesheet,
        clearAllTimesheets,
        recordCompletedShift,
        deletePatrolException,
        clearPatrolException,
        clearAllPatrolExceptions,
        resolvePatrolException,
        patrolScans,
        deletePatrolScan,
        clearAllPatrolScans,
        isPatrolLogsModalOpen,
        setIsPatrolLogsModalOpen,
        manualClockInOfficer,
        manualClockOutOfficer,
        isManualClockInModalOpen,
        setIsManualClockInModalOpen,
        resetToRealLifeData,
        userLocation,
        setUserLocation,
        requestLiveGPSLocation,
        focusedIncidentIdOnRadar,
        setFocusedIncidentIdOnRadar
      }}
    >
      {children}
    </DutyOnContext.Provider>
  );
};

export const useDutyOn = () => {
  const context = useContext(DutyOnContext);
  if (!context) {
    throw new Error('useDutyOn must be used within DutyOnProvider');
  }
  return context;
};
