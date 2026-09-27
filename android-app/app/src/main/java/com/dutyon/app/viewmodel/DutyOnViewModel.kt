package com.dutyon.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dutyon.app.data.model.*
import com.dutyon.app.data.repository.TikediMasterData
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class DutyOnViewModel : ViewModel() {

    // Auth & Active Profile
    private val _currentUserProfile = MutableStateFlow<UserAuthProfile?>(
        UserAuthProfile(
            uid = "usr-admin",
            email = "tshepomaloa@gmail.com",
            displayName = "Tshepo Maloa",
            role = "admin",
            officerId = "off-admin",
            empId = "DIR-0001",
            psiraNumber = "2490181",
            controlRoomAccess = true,
            adminAccess = true
        )
    )
    val currentUserProfile: StateFlow<UserAuthProfile?> = _currentUserProfile.asStateFlow()

    // Mode Switcher (Mobile App vs Desktop Control Room)
    private val _activeMode = MutableStateFlow("mobile") // "mobile" or "desktop"
    val activeMode: StateFlow<String> = _activeMode.asStateFlow()

    private val _mobileScreen = MutableStateFlow("home") // home, patrols, ob, welfare, chat, profile
    val mobileScreen: StateFlow<String> = _mobileScreen.asStateFlow()

    private val _desktopTab = MutableStateFlow("liveops") // liveops, incidents, roster, payroll, fleet
    val desktopTab: StateFlow<String> = _desktopTab.asStateFlow()

    // Active Officer State
    private val _officer = MutableStateFlow(
        OfficerState(
            name = "Tshepo Maloa",
            avatarInitial = "T",
            role = "System Administrator / Director",
            grade = "Grade A (Director / Ops In-Charge)",
            currentSite = "Provincial Office",
            siteDeployed = "Provincial Office",
            location = "Provincial Government Office Complex, Beaufort West",
            currentPost = "Command & Operations Center",
            empId = "DIR-0001",
            psiraNumber = "2490181",
            phone = "071 283 3558",
            email = "tshepomaloa@gmail.com",
            isClockedIn = false
        )
    )
    val officer: StateFlow<OfficerState> = _officer.asStateFlow()

    // Master Lists
    private val _officersList = MutableStateFlow<List<OfficerRecord>>(TikediMasterData.TIKEDI_OFFICERS)
    val officersList: StateFlow<List<OfficerRecord>> = _officersList.asStateFlow()

    private val _sitesList = MutableStateFlow<List<MultiSiteItem>>(TikediMasterData.TIKEDI_SITES)
    val sitesList: StateFlow<List<MultiSiteItem>> = _sitesList.asStateFlow()

    private val _rosterRows = MutableStateFlow<List<EmployeeRosterRow>>(TikediMasterData.INITIAL_ROSTER_ROWS)
    val rosterRows: StateFlow<List<EmployeeRosterRow>> = _rosterRows.asStateFlow()

    private val _patrolRoutes = MutableStateFlow<List<PatrolRoute>>(TikediMasterData.SAMPLE_PATROL_ROUTES)
    val patrolRoutes: StateFlow<List<PatrolRoute>> = _patrolRoutes.asStateFlow()

    private val _obEntries = MutableStateFlow<List<OBEntry>>(
        listOf(
            OBEntry(
                id = "ob-init-1",
                time = "06:00",
                headline = "Morning Parade & Shift Start",
                notes = "All guards on site verified. Equipment sync complete.",
                status = "completed",
                site = "Provincial Office"
            )
        )
    )
    val obEntries: StateFlow<List<OBEntry>> = _obEntries.asStateFlow()

    private val _messages = MutableStateFlow<List<ChatMessage>>(
        listOf(
            ChatMessage(
                id = "msg-1",
                sender = "Control Room Dispatch",
                initials = "CR",
                color = "#E53E3E",
                time = "06:00",
                text = "Morning parade complete. Radio check in progress.",
                fromControlRoom = true,
                channel = "control_room"
            )
        )
    )
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _alerts = MutableStateFlow<List<ControlRoomAlert>>(emptyList())
    val alerts: StateFlow<List<ControlRoomAlert>> = _alerts.asStateFlow()

    private val _incidents = MutableStateFlow<List<IncidentQueueItem>>(emptyList())
    val incidents: StateFlow<List<IncidentQueueItem>> = _incidents.asStateFlow()

    private val _timesheets = MutableStateFlow<List<TimesheetEntry>>(emptyList())
    val timesheets: StateFlow<List<TimesheetEntry>> = _timesheets.asStateFlow()

    private val _patrolExceptions = MutableStateFlow<List<PatrolException>>(emptyList())
    val patrolExceptions: StateFlow<List<PatrolException>> = _patrolExceptions.asStateFlow()

    private val _safetyStatus = MutableStateFlow(PatrolSafetyStatus())
    val safetyStatus: StateFlow<PatrolSafetyStatus> = _safetyStatus.asStateFlow()

    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

    // Real-time Clock
    private val _clockTime = MutableStateFlow("")
    val clockTime: StateFlow<String> = _clockTime.asStateFlow()

    init {
        startClockTimer()
        startWelfareTimer()
    }

    private fun startClockTimer() {
        viewModelScope.launch {
            while (true) {
                val sdf = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
                _clockTime.value = sdf.format(Date())

                // If clocked in, update hours counter
                if (_officer.value.isClockedIn && _officer.value.clockInTimestamp != null) {
                    val elapsedMs = System.currentTimeMillis() - _officer.value.clockInTimestamp!!
                    val hours = (elapsedMs / 3600000.0)
                    val formatted = String.format(Locale.US, "%.2f", hours)
                    _officer.update { it.copy(hoursToday = formatted) }
                }

                delay(1000)
            }
        }
    }

    private fun startWelfareTimer() {
        viewModelScope.launch {
            while (true) {
                delay(1000)
                _safetyStatus.update { status ->
                    if (status.welfarePingSecondsLeft <= 1) {
                        status.copy(welfarePingSecondsLeft = 900, immobilityWarning = true)
                    } else {
                        status.copy(welfarePingSecondsLeft = status.welfarePingSecondsLeft - 1)
                    }
                }
            }
        }
    }

    fun showToast(msg: String) {
        viewModelScope.launch {
            _toastMessage.value = msg
            delay(2500)
            if (_toastMessage.value == msg) {
                _toastMessage.value = null
            }
        }
    }

    fun setActiveMode(mode: String) {
        _activeMode.value = mode
    }

    fun setMobileScreen(screen: String) {
        _mobileScreen.value = screen
    }

    fun setDesktopTab(tab: String) {
        _desktopTab.value = tab
    }

    // Biometric Attendance Clock-In / Clock-Out
    fun doClockIn() {
        val now = Date()
        val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(now)
        val timestamp = now.time

        _officer.update {
            it.copy(
                isClockedIn = true,
                clockInTime = timeStr,
                clockInTimestamp = timestamp,
                hoursToday = "0.01"
            )
        }

        // Add OB Entry
        val obEntry = OBEntry(
            id = "ob-${System.currentTimeMillis()}",
            time = timeStr,
            headline = "Biometric Attendance Verified: ${_officer.value.name}",
            notes = "Officer clocked on duty at ${_officer.value.currentSite}. 3D Face ID verified.",
            status = "completed",
            site = _officer.value.currentSite
        )
        _obEntries.update { listOf(obEntry) + it }

        showToast("Clock-in confirmed at $timeStr — Live hours counting")
    }

    fun doClockOut() {
        val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
        val hoursWorked = _officer.value.hoursToday

        _officer.update {
            it.copy(
                isClockedIn = false,
                clockInTimestamp = null
            )
        }

        val obEntry = OBEntry(
            id = "ob-${System.currentTimeMillis()}",
            time = timeStr,
            headline = "Shift Handover & Clock-Out: ${_officer.value.name}",
            notes = "Completed shift ($hoursWorked hrs) at ${_officer.value.currentSite}.",
            status = "completed",
            site = _officer.value.currentSite
        )
        _obEntries.update { listOf(obEntry) + it }

        showToast("Clocked out successfully ($hoursWorked hrs logged)")
    }

    // Patrol Scanning
    fun scanCurrentCheckpoint(routeId: String) {
        val timeStr = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        _patrolRoutes.update { routes ->
            routes.map { route ->
                if (route.id == routeId) {
                    val firstUnscanned = route.checkpoints.indexOfFirst { !it.scanned }
                    if (firstUnscanned != -1) {
                        val updatedCheckpoints = route.checkpoints.mapIndexed { idx, cp ->
                            if (idx == firstUnscanned) {
                                cp.copy(
                                    scanned = true,
                                    scannedAt = timeStr,
                                    scannedBy = _officer.value.name
                                )
                            } else cp
                        }
                        route.copy(checkpoints = updatedCheckpoints)
                    } else route
                } else route
            }
        }
        showToast("Checkpoint verified via NFC RFID tag ✓")
    }

    // Safety & Duress
    fun triggerDuressPanic() {
        _safetyStatus.update { it.copy(duressTriggered = true) }
        val alert = ControlRoomAlert(
            id = "alt-duress-${System.currentTimeMillis()}",
            title = "🚨 SILENT DURESS / OFFICER IN DISTRESS",
            location = "${_officer.value.name} · ${_officer.value.currentSite}",
            time = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date()),
            priority = "HIGH",
            description = "Officer triggered emergency panic button. Armed response required."
        )
        _alerts.update { listOf(alert) + it }
        showToast("DURESS SIGNAL TRANSMITTED TO CONTROL ROOM")
    }

    fun clearDuressPanic() {
        _safetyStatus.update { it.copy(duressTriggered = false) }
        showToast("Duress signal cleared by supervisor PIN")
    }

    fun resetWelfarePing() {
        _safetyStatus.update { it.copy(welfarePingSecondsLeft = 900, immobilityWarning = false) }
        showToast("Welfare check-in confirmed ✓")
    }

    // OB Logging
    fun addOBEntry(text: String) {
        val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
        val newEntry = OBEntry(
            id = "ob-${System.currentTimeMillis()}",
            time = timeStr,
            headline = text.ifBlank { "Perimeter inspection" },
            notes = "Logged by ${_officer.value.name} on site.",
            status = "completed",
            site = _officer.value.currentSite
        )
        _obEntries.update { listOf(newEntry) + it }
        showToast("OB Entry logged at $timeStr")
    }

    // Comms Chat
    fun sendMessage(text: String, channel: String = "control_room") {
        if (text.isBlank()) return
        val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
        val newMsg = ChatMessage(
            id = "msg-${System.currentTimeMillis()}",
            sender = _officer.value.name,
            initials = _officer.value.avatarInitial,
            color = "#1FA6C9",
            time = timeStr,
            text = text,
            channel = channel,
            siteName = _officer.value.currentSite
        )
        _messages.update { it + newMsg }
        showToast("Message transmitted")
    }

    // Incident creation
    fun createIncident(category: String, site: String, priority: String, description: String) {
        val newInc = IncidentQueueItem(
            id = "inc-${System.currentTimeMillis()}",
            priority = priority,
            category = category,
            site = site,
            age = "Just now",
            operator = _officer.value.name,
            description = description,
            reportedAt = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
        )
        _incidents.update { listOf(newInc) + it }
        showToast("Incident docket logged and dispatched")
    }
}
