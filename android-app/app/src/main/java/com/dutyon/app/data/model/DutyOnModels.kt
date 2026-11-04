package com.dutyon.app.data.model

data class OfficerState(
    val name: String,
    val avatarInitial: String,
    val role: String,
    val grade: String,
    val currentSite: String,
    val siteDeployed: String = currentSite,
    val location: String = "Provincial Government Office Complex, Beaufort West",
    val currentPost: String = "Main Security Post",
    val currentShift: String = "Day Shift (06:00 – 18:00)",
    val empId: String = "DIR-0001",
    val psiraNumber: String = "2490181",
    val idNumber: String = "9305105694081",
    val phone: String = "071 283 3558",
    val email: String = "tshepomaloa@gmail.com",
    val isClockedIn: Boolean = false,
    val clockInTime: String = "",
    val clockInTimestamp: Long? = null,
    val shiftHours: String = "06:00–18:00",
    val hoursToday: String = "0.00",
    val payPeriodHours: Double = 0.0,
    val isOnline: Boolean = true,
    val coordsLat: Double = -32.3567,
    val coordsLng: Double = 22.5833
)

data class ShiftItem(
    val id: String,
    val siteName: String,
    val dateStr: String,
    val dayNum: String,
    val dayName: String,
    val timeWindow: String,
    val grade: String,
    val status: String // CONFIRMED, PENDING, COMPLETED
)

data class LeaveRequest(
    val leaveType: String = "Sick Leave",
    val startDate: String = "22 May 2026",
    val endDate: String = "25 May 2026",
    val reason: String = "Flu and fever. Visiting doctor.",
    val attachmentName: String = "Medical certificate.pdf",
    val attachmentSize: String = "214 KB",
    val step: Int = 0, // 0 = Draft, 1 = Supervisor Review, 2 = HR Final Approval
    val submittedAt: String? = null
)

data class PayQuery(
    val payslipPeriod: String = "August 2026",
    val issueType: String = "Overtime hours",
    val expectedHours: Int = 24,
    val paidHours: Int = 12,
    val message: String = "I worked overtime on 15–16 Aug (night shift) but only 12 hours were paid.",
    val attachmentName: String = "Supporting timesheet.pdf",
    val caseId: String? = null,
    val status: String = "Draft",
    val submittedAt: String? = null
)

data class DocumentItem(
    val id: String,
    val name: String,
    val category: String,
    val description: String,
    val type: String,
    val expiresSoon: Boolean = false,
    val expiryDate: String? = null,
    val iconType: String = "contract" // contract, psira, id, payslip, warning, policy
)

data class OBEntry(
    val id: String,
    val time: String,
    val headline: String,
    val notes: String,
    val status: String = "completed", // completed, in_progress
    val hasPhoto: Boolean = false,
    val hasVoice: Boolean = false,
    val site: String? = null,
    val officerId: String? = null,
    val officerName: String? = null,
    val createdAt: String? = null
)

data class CheckpointSOP(
    val id: String,
    val task: String,
    val passed: Boolean,
    val critical: Boolean
)

data class PatrolCheckpoint(
    val id: Int,
    val name: String,
    val code: String? = null,
    val x: Float = 0f,
    val y: Float = 0f,
    val rangeMeters: Int = 0,
    val scanned: Boolean = false,
    val scannedAt: String? = null,
    val scannedBy: String? = null,
    val tagUid: String? = null,
    val tagType: String? = "NFC Tag", // NFC Tag, Sefeko RFID, BLE Beacon, QR Matrix
    val coordinates: String? = null,
    val targetWindow: String? = null,
    val sopChecklist: List<CheckpointSOP> = emptyList(),
    val inspectionNotes: String? = null,
    val photoUrl: String? = null,
    val voiceNoteUrl: String? = null,
    val dwellTimeSec: Int = 0
)

data class PatrolRoute(
    val id: String,
    val siteId: String,
    val siteName: String,
    val title: String,
    val code: String,
    val priority: String, // Critical, High, Standard
    val estDurationMinutes: Int,
    val frequency: String,
    val description: String,
    val checkpoints: List<PatrolCheckpoint>
)

data class PatrolSafetyStatus(
    val welfarePingSecondsLeft: Int = 900,
    val immobilityWarning: Boolean = false,
    val manDownActive: Boolean = false,
    val duressTriggered: Boolean = false,
    val batteryLevel: Int = 95,
    val networkMode: String = "LTE 4G Online"
)

data class PatrolException(
    val id: String,
    val routeId: String,
    val siteName: String,
    val checkpointName: String,
    val category: String,
    val severity: String, // CRITICAL, HIGH, MEDIUM
    val description: String,
    val timestamp: String,
    val officerName: String,
    val status: String = "Dispatched", // Dispatched, Investigating, Resolved
    val actionTaken: String? = null
)

data class ChatMessage(
    val id: String,
    val sender: String,
    val initials: String,
    val color: String,
    val time: String,
    val text: String,
    val isUrgent: Boolean = false,
    val fromControlRoom: Boolean = false,
    val channel: String = "control_room",
    val siteName: String = "Provincial Office",
    val senderRole: String = "officer"
)

data class ControlRoomAlert(
    val id: String,
    val title: String,
    val location: String,
    val time: String,
    val priority: String, // HIGH, MED, LOW, INFO
    val description: String? = null
)

data class IncidentQueueItem(
    val id: String,
    val priority: String, // High, Medium, Low, Info
    val category: String,
    val site: String,
    val location: String? = null,
    val coordinates: String? = null,
    val age: String,
    val operator: String,
    val status: String = "open", // open, investigating, dispatched, resolved
    val description: String? = null,
    val reportedAt: String? = null,
    val actionTaken: String? = null
)

data class SitePost(
    val id: String,
    val name: String,
    val requiredGrade: String,
    val assignedOfficer: String,
    val status: String // filled, vacant, late
)

data class MultiSiteItem(
    val id: String,
    val name: String,
    val location: String,
    val category: String = "Commercial Precinct",
    val officersRequired: Int,
    val officersPresent: Int,
    val patrolStatus: String,
    val compliance: Int,
    val status: String, // operational, attention, critical
    val clientContactName: String? = null,
    val clientPhone: String? = null,
    val emergencyPhone: String? = null,
    val sapsStation: String? = null,
    val geofenceRadius: Int = 35,
    val posts: List<SitePost> = emptyList()
)

data class FleetVehicle(
    val id: String,
    val callSign: String,
    val vehicleModel: String,
    val regPlate: String,
    val crew: String,
    val status: String, // 10-8 Available, 10-23 En Route, 10-7 Standby
    val speedKmH: Int,
    val batteryPct: Int,
    val fuelPct: Int,
    val radioChannel: String,
    val sector: String,
    val destination: String? = null,
    val etaMin: Int = 0
)

data class OfficerRecord(
    val id: String,
    val name: String,
    val empId: String,
    val psiraNumber: String,
    val idNumber: String? = null,
    val grade: String,
    val phone: String,
    val currentSite: String,
    val currentPost: String = "Main Security Post",
    val isClockedIn: Boolean = false,
    val batteryLevel: Int = 98,
    val welfareStatus: String = "normal",
    val lastScanTime: String = "Just now",
    val firearmCompetency: Boolean = false,
    val firstAidCert: Boolean = true,
    val avatarInitial: String = "O",
    val documents: List<DocumentItem> = emptyList(),
    val email: String? = null,
    val clockInTime: String? = null,
    val clockInTimestamp: Long? = null,
    val hoursToday: String? = "0.00"
)

data class EmployeeRosterRow(
    val name: String,
    val empId: String,
    val grade: String,
    val color: String,
    val shifts: List<String>, // "D", "N", "OFF", "OPEN", "EXC"
    val site: String? = null,
    val psiraNumber: String? = null,
    val phone: String? = null
)

data class UserAuthProfile(
    val uid: String,
    val email: String?,
    val displayName: String?,
    val role: String, // officer, operator, admin
    val officerId: String? = null,
    val empId: String? = null,
    val psiraNumber: String? = null,
    val controlRoomAccess: Boolean = false,
    val adminAccess: Boolean = false
)

data class TimesheetEntry(
    val id: String,
    val officerId: String,
    val empId: String,
    val officerName: String,
    val grade: String,
    val siteName: String,
    val date: String,
    val dayOfWeek: String,
    val isSunday: Boolean,
    val isPublicHoliday: Boolean = false,
    val shiftType: String, // DAY, NIGHT
    val scheduledStart: String,
    val scheduledEnd: String,
    val clockInTime: String,
    val clockOutTime: String,
    val biometricVerified: Boolean = true,
    val biometricMethod: String = "Face Liveness AI",
    val standardHours: Double,
    val actualHours: Double,
    val billableHours: Double,
    val overtimeHours: Double,
    val nightAllowanceHours: Double,
    val isNightAllowanceEligible: Boolean,
    val hourlyRate: Double,
    val clientBillingRate: Double,
    val status: String = "VERIFIED"
)
