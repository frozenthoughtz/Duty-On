export interface OfficerState {
  name: string;
  avatarInitial: string;
  role: string;
  grade: string;
  currentSite: string;
  siteDeployed?: string;
  location?: string;
  currentPost?: string;
  currentShift?: string;
  empId?: string;
  psiraNumber?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  isClockedIn: boolean;
  clockInTime: string;
  clockInTimestamp?: number;
  shiftHours: string;
  hoursToday: string;
  payPeriodHours: number;
  isOnline: boolean;
  coords?: { lat: number; lng: number };
}

export interface ShiftItem {
  id: string;
  siteName: string;
  dateStr: string;
  dayNum: string;
  dayName: string;
  timeWindow: string;
  grade: string;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED';
}

export interface LeaveRequest {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentName: string;
  attachmentSize: string;
  step: 0 | 1 | 2; // 0 = Draft, 1 = Supervisor Review, 2 = HR Final Approval
  submittedAt?: string;
}

export interface PayQuery {
  payslipPeriod: string;
  issueType: string;
  expectedHours: number;
  paidHours: number;
  message: string;
  attachmentName: string;
  caseId: string | null;
  status: string;
  submittedAt?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  expiresSoon?: boolean;
  expiryDate?: string;
  iconType: 'contract' | 'psira' | 'id' | 'payslip' | 'warning' | 'policy';
  officerId?: string;
  officerName?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  certificateNumber?: string;
  issuingAuthority?: string;
  fileSize?: string;
  status?: 'valid' | 'expiring_soon' | 'expired';
  photoUrl?: string;
  fileData?: string;
  capturedAt?: string;
  createdAt?: string;
  source?: 'camera' | 'upload' | 'system';
  notes?: string;
}

export interface OBEntry {
  id: string;
  time: string;
  headline: string;
  notes: string;
  status: 'completed' | 'in_progress';
  hasPhoto?: boolean;
  hasVoice?: boolean;
  site?: string;
  officerId?: string;
  officerName?: string;
  createdAt?: string;
}

export interface CheckpointSOP {
  id: string;
  task: string;
  passed: boolean;
  critical: boolean;
}

export interface PatrolCheckpoint {
  id: number;
  name: string;
  code?: string;
  x: number;
  y: number;
  rangeMeters: number;
  scanned: boolean;
  scannedAt?: string;
  scannedBy?: string;
  tagUid?: string;
  tagType?: 'NFC Tag' | 'Sefeko RFID' | 'BLE Beacon' | 'QR Matrix';
  coordinates?: string;
  targetWindow?: string;
  sopChecklist?: CheckpointSOP[];
  photoRequired?: boolean;
  photoUrl?: string;
  voiceNoteUrl?: string;
  audioDurationSec?: number;
  inspectionNotes?: string;
  dwellTimeSec?: number;
}

export interface PatrolRoute {
  id: string;
  siteId: string;
  siteName: string;
  title: string;
  code: string;
  priority: 'Critical' | 'High' | 'Standard';
  estDurationMinutes: number;
  frequency: string;
  description: string;
  checkpoints: PatrolCheckpoint[];
}

export interface BiometricVitals {
  heartRateBpm: number;
  fatigueScore: number; // 0 - 100%
  stressLevel: 'Optimal' | 'Elevated' | 'High';
  lastVerificationTime: string;
  isVerified: boolean;
  biometricConfidence: number;
  deviceSensorType: 'Optical PPG Pulse' | 'Fingerprint Reader' | 'Face Liveness AI';
}

export interface PatrolSafetyStatus {
  welfarePingSecondsLeft: number;
  immobilityWarning: boolean;
  manDownActive: boolean;
  duressTriggered: boolean;
  batteryLevel: number;
  networkMode: 'LTE 4G Online' | 'GSM Sefeko Wand' | 'Encrypted Offline Cache';
  offlineScansQueued: number;
  heartRateBpm?: number;
  fatigueScore?: number;
  stressLevel?: 'Optimal' | 'Elevated' | 'High';
  biometricVerified?: boolean;
  lastBiometricScan?: string;
}

export interface PatrolException {
  id: string;
  routeId: string;
  siteName: string;
  checkpointName: string;
  category: string;
  isCustomThreat?: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  timestamp: string;
  officerName: string;
  photoUrl?: string;
  voiceNoteUrl?: string;
  audioDurationSec?: number;
  status: 'Dispatched' | 'Investigating' | 'Resolved';
  actionTaken?: string;
}

export interface SefekoDevice {
  id: string;
  serialNumber: string;
  assignedOfficer: string;
  assignedSite: string;
  batteryPercent: number;
  lastSync: string;
  signalDbm: number;
  firmwareVersion: string;
  status: 'online' | 'patrolling' | 'docked' | 'battery_low' | 'tamper_flag';
}

export interface ClientProofOfService {
  id: string;
  siteName: string;
  clientName: string;
  shiftDate: string;
  scheduledPatrols: number;
  completedPatrols: number;
  slaCompliance: number;
  totalPointsScanned: number;
  missedPoints: number;
  exceptionsLogged: number;
  supervisorSignoff: string;
  generatedAt: string;
  commentary?: string;
  photoUrl?: string;
  audioUrl?: string;
  officerName?: string;
  routeTitle?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  initials: string;
  color: string;
  time: string;
  text: string;
  isUrgent?: boolean;
  fromControlRoom?: boolean;
  channel?: string;
  siteName?: string;
  senderRole?: 'admin' | 'operator' | 'officer';
  senderEmail?: string;
  target?: string;
  photoUrl?: string;
  mediaUrl?: string;
  voiceNoteUrl?: string;
  audioUrl?: string;
  audioDurationSec?: number;
  commentary?: string;
  createdAt?: string;
}

export interface ControlRoomAlert {
  id: string;
  title: string;
  location: string;
  time: string;
  priority: 'HIGH' | 'MED' | 'LOW' | 'INFO';
  type?: 'HIGH' | 'MED' | 'LOW' | 'INFO';
  description?: string;
  photoUrl?: string;
  mediaUrl?: string;
  voiceNoteUrl?: string;
  audioUrl?: string;
  audioDurationSec?: number;
  officerName?: string;
  officerId?: string;
  officerGrade?: string;
  checkpointName?: string;
  routeTitle?: string;
  status?: string;
  commentary?: string;
  createdAt?: string;
}

export interface IncidentNote {
  id: string;
  author: string;
  time: string;
  text: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  url?: string;
  type: string;
  size?: string;
  uploadedAt: string;
  category?: 'document' | 'image' | 'voice_note' | 'docket' | 'video';
  durationSec?: number;
  audioDataUrl?: string;
  notes?: string;
}

export interface IncidentQueueItem {
  id: string;
  priority: 'High' | 'Medium' | 'Low' | 'Info' | 'HIGH' | 'MED' | 'LOW' | 'INFO';
  category: string;
  site: string;
  location?: string;
  coordinates?: { lat: number; lng: number } | string;
  age: string;
  operator: string;
  status?: 'open' | 'investigating' | 'dispatched' | 'resolved';
  description?: string;
  photoUrl?: string;
  voiceNoteUrl?: string;
  audioDurationSec?: number;
  officerId?: string;
  checkpointName?: string;
  routeTitle?: string;
  sapsCaseNumber?: string;
  sapsStation?: string;
  investigatingOfficer?: string;
  assignedUnit?: string;
  etaMinutes?: number;
  notes?: IncidentNote[];
  evidenceFiles?: EvidenceFile[];
  reportedAt?: string;
  weaponsInvolved?: string;
  injuriesCasualties?: string;
  actionTaken?: string;
  suspectDetails?: {
    count?: number;
    description?: string;
    clothing?: string;
    vehicle?: string;
    escapeRoute?: string;
  };
  witnessStatements?: { id: string; name: string; contact: string; statement: string }[];
  supervisorSignoff?: { name: string; psiraNumber: string; timestamp: string };
}

export interface SitePost {
  id: string;
  name: string;
  requiredGrade: string;
  assignedOfficer: string;
  status: 'filled' | 'vacant' | 'late';
}

export interface SiteFile {
  id: string;
  name: string;
  category: 'floorplan' | 'post_orders' | 'access_codes' | 'key_register' | 'sop';
  url?: string;
  uploadedAt: string;
  size: string;
}

export interface MultiSiteItem {
  id: string;
  name: string;
  location: string;
  category?: string;
  officersRequired: number;
  officersPresent: number;
  patrolStatus: string;
  compliance: number;
  status: 'operational' | 'attention' | 'critical';
  clientContactName?: string;
  clientPhone?: string;
  emergencyPhone?: string;
  sapsStation?: string;
  sapsSectorPhone?: string;
  armedResponseUnit?: string;
  geofenceRadius?: number;
  coords?: { x: number; y: number; lat?: number; lng?: number };
  checkpoints?: { id: number; name: string; x: number; y: number; scanned: boolean; time?: string }[];
  posts?: SitePost[];
  files?: SiteFile[];
  notes?: string;
  regionId?: 'region_1' | 'region_2' | string;
  createdAt?: string;
}

export interface FleetVehicle {
  id: string;
  callSign: string;
  vehicleModel: string;
  regPlate: string;
  crew: string;
  status: '10-8 Available' | '10-23 En Route' | '10-7 Standby';
  speedKmH: number;
  batteryPct: number;
  fuelPct: number;
  radioChannel: string;
  sector: string;
  coords: { x: number; y: number };
  destination?: string;
  etaMin?: number;
  notes?: string;
  createdAt?: string;
}

export interface OfficerRecord {
  id: string;
  name: string;
  empId: string;
  psiraNumber: string;
  idNumber?: string;
  employmentPosition?: 'Permanent' | 'Reliever' | 'Casual' | string;
  grade: string;
  phone: string;
  currentSite: string;
  currentPost: string;
  isClockedIn: boolean;
  batteryLevel: number;
  welfareStatus: 'normal' | 'due' | 'duress' | 'man_down';
  lastScanTime: string;
  firearmCompetency: boolean;
  firstAidCert: boolean;
  avatarInitial: string;
  documents: DocumentItem[];
  hourlyRate?: number; // Base wage rate in ZAR (R/hr)
  benefitsHourlyRate?: number; // Statutory benefits rate in ZAR (R/hr)
  totalRateInclBenefits?: number; // Wage rate per hour including benefits (R/hr)
  clientBillingRate?: number; // Client billing rate in ZAR (R/hr)
  regionId?: 'region_1' | 'region_2' | string;
  location?: string; // Home suburb or residential district
  coords?: { lat: number; lng: number };
  siteDeployed?: string;
  status?: string;
  photoUrl?: string;
  clockInTimestamp?: number;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  availableDays?: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  shiftPreference?: 'ALL' | 'DAY' | 'NIGHT';
  maxWeeklyHours?: number;
  clockInTime?: string;
  hoursToday?: string;
}

export interface SiteStatusItem {
  site: string;
  supervisor: string;
  posts: number;
  nextPatrol: string;
  lastOB: string;
  status: 'Good' | 'Attention' | 'Critical';
}

export interface EmployeeRosterRow {
  name: string;
  empId: string;
  grade: string;
  color: string;
  shifts: ('D' | 'N' | 'OFF' | 'OPEN' | 'EXC')[];
  site?: string;
  psiraNumber?: string;
  phone?: string;
}

export interface SiteCoverageItem {
  site: string;
  percent: number;
  postsFilled: number;
  postsTotal: number;
  exceptions: number;
}

export interface VisualShiftBlock {
  id: string;
  siteName: string;
  postName: string;
  officerName: string;
  officerGrade: string;
  empId: string;
  startHour: number; // 0 - 24
  durationHours: number;
  shiftType: 'DAY' | 'NIGHT' | 'OVERTIME' | 'STANDBY';
  status: 'active_on_duty' | 'scheduled' | 'late' | 'relieved' | 'unassigned';
  clockInTime?: string;
  psiraVerified: boolean;
  batteryPercent: number;
}

export interface OfflineQueueItem {
  id: string;
  operation: 'CHECKPOINT_SCAN' | 'OB_ENTRY' | 'INCIDENT_REPORT' | 'DOC_UPLOAD' | 'BIOMETRIC_CLOCKIN' | 'PANIC_DURESS';
  title: string;
  summary: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  sizeBytes?: number;
  payload?: any;
}

export type UserRole = 'officer' | 'operator' | 'admin';

export interface UserAuthProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: UserRole;
  officerId?: string; // Links to OfficerRecord id (e.g. 'off-1', 'off-2')
  empId?: string;
  psiraNumber?: string;
  controlRoomAccess: boolean; // Field officers require explicit grant or supervisor override
  adminAccess: boolean; // Only administrators can access Admin Data Hub
  phoneNumber?: string;
  createdAt?: string;
}

export type ShiftCode = 'D' | 'N' | 'OFF' | 'LEAVE' | 'O' | 'L' | '';

export interface GuardRosterEntry {
  id: string | number;
  name: string;
  psiraNumber?: string;
  grade: string;
  empId?: string;
  phone?: string;
  assignedSite?: string;
  shifts: Record<string, ShiftCode | string>;
}

export interface SecurityRosterPlan {
  id: string;
  siteName: string;
  siteSupervisor: string;
  contractNo: string;
  periodType: 'month' | 'week';
  year: number;
  month: number; // 1-12 (e.g. 9 for Sept)
  weekStarting: string;
  dayShiftStart: string;
  dayShiftEnd: string;
  nightShiftStart: string;
  nightShiftEnd: string;
  postsDay: number;
  postsNight: number;
  guards: GuardRosterEntry[];
  updatedAt: string;
}

export interface RegionalGradeRate {
  grade: string;
  basicHourlyRate: number; // Base wage rate in ZAR (R/hr)
  benefitsHourlyRate: number; // Benefits rate in ZAR (R/hr) e.g. Provident Fund, Medical, Uniform, UIF
  totalRateInclBenefits: number; // Total wage rate per hour including benefits (R/hr)
  clientBillingRate: number; // Client tariff rate in ZAR (R/hr)
  providentFundRate?: number;
  medicalAllowance?: number;
  uniformAllowance?: number;
  notes?: string;
}

export interface SectoralRegionConfig {
  id: 'region_1' | 'region_2' | string;
  name: string; // e.g. "Region 1 (Area 1 - Metropolitan / Urban)"
  areaDescription: string;
  rates: Record<string, RegionalGradeRate>;
}

export interface SectoralRatesMatrix {
  region1: SectoralRegionConfig;
  region2: SectoralRegionConfig;
  lastUpdated?: string;
  updatedBy?: string;
}

export interface TimesheetEntry {
  id: string;
  officerId: string;
  empId: string;
  officerName: string;
  grade: string;
  siteName: string;
  regionId?: 'region_1' | 'region_2' | string;
  regionName?: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isSunday: boolean;
  isPublicHoliday: boolean;
  publicHolidayName?: string;
  shiftType: 'DAY' | 'NIGHT';
  scheduledStart: string;
  scheduledEnd: string;
  clockInTime: string;
  clockOutTime: string;
  biometricVerified: boolean;
  biometricMethod: 'Face Liveness AI' | 'Optical Fingerprint' | 'Supervisor Override';
  standardHours: number; // e.g. 12.0
  actualHours: number;   // e.g. 12.5 from clock-in to clock-out
  billableHours: number; // verified billed to client
  overtimeHours: number; // hours beyond 12 / ordinary shift
  nightAllowanceHours: number; // hours between 18:00 and 06:00
  isNightAllowanceEligible: boolean;
  hourlyRate: number; // Base rate in ZAR (e.g. R34.50 - R52.00)
  benefitsHourlyRate?: number; // Benefits rate in ZAR (e.g. R6.50 - R10.50/hr)
  totalRateInclBenefits?: number; // All-inclusive rate per hour (e.g. R41.00 - R62.50/hr)
  benefitsAmount?: number; // Total shift benefits in ZAR
  clientBillingRate: number; // Client hourly rate in ZAR (e.g. R75.00 - R120.00)
  status: 'VERIFIED' | 'FLAGGED' | 'ADJUSTED';
  varianceReason?: string;
}

export interface OfficerPayrollSummary {
  officerId: string;
  empId: string;
  name: string;
  grade: string;
  siteName: string;
  regionId?: string;
  regionName?: string;
  psiraNumber: string;
  totalStandardHours: number;
  totalActualHours: number;
  totalBillableHours: number;
  totalOvertimeHours: number;
  sundayHours: number;
  publicHolidayHours: number;
  nightShiftAllowanceShifts: number;
  nightShiftAllowanceAmount: number; // Statutory rate in ZAR
  totalBasicWages?: number; // Base wages before benefits
  totalBenefitsAmount?: number; // Total statutory benefits (Provident, Medical, Uniform)
  averageRateInclBenefits?: number; // Effective rate per hour including benefits
  grossWages: number; // Total guard earnings (Basic + Overtime + Sunday + Holiday + Night + Benefits)
  clientBilledAmount: number; // Invoiced to client
  profitMarginAmount: number; // Billed - Wages
  profitMarginPercent: number; // Margin %
  biometricVerifiedShifts: number;
  totalShifts: number;
}

export interface PayPeriodSummary {
  payPeriodId: string;
  title: string;
  startDate: string;
  endDate: string;
  totalStandardHours: number;
  totalBillableHours: number;
  totalActualHours: number;
  billableRatio: number; // billable / standard (e.g. 104.2%)
  totalOvertimeHours: number;
  totalSundayHours: number;
  totalHolidayHours: number;
  totalNightShifts: number;
  totalGrossWages: number;
  totalBilledToClients: number;
  grossMarginPercent: number;
  biometricComplianceRate: number; // %
  totalGuards: number;
}

