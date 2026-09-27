package com.dutyon.app.data.repository

import com.dutyon.app.data.model.*

object TikediMasterData {

    val TIKEDI_SITES = listOf(
        MultiSiteItem(
            id = "site-khwamagxaki",
            name = "Khwamagxaki",
            location = "Gqeberha, Eastern Cape",
            category = "Commercial Complex",
            officersRequired = 14,
            officersPresent = 14,
            patrolStatus = "Active Patrol",
            compliance = 100,
            status = "operational",
            clientContactName = "Luvo",
            clientPhone = "081 216 0464",
            emergencyPhone = "081 216 0464",
            sapsStation = "New Brighton SAPS",
            geofenceRadius = 35
        ),
        MultiSiteItem(
            id = "site-zebra",
            name = "Zebra Mountains",
            location = "Cradock / Karoo Region",
            category = "Protected Reserve",
            officersRequired = 4,
            officersPresent = 4,
            patrolStatus = "Perimeter Active",
            compliance = 100,
            status = "operational",
            clientContactName = "Wonga",
            clientPhone = "065 896 8113",
            emergencyPhone = "065 896 8113",
            sapsStation = "Cradock SAPS",
            geofenceRadius = 50
        ),
        MultiSiteItem(
            id = "site-ganzekraal",
            name = "Ganzekraal Resort",
            location = "West Coast, Western Cape",
            category = "Municipal Resort",
            officersRequired = 8,
            officersPresent = 8,
            patrolStatus = "Coastal Perimeter",
            compliance = 100,
            status = "operational",
            clientContactName = "Cloete",
            clientPhone = "081 483 0072",
            emergencyPhone = "081 483 0072",
            sapsStation = "Atlantis SAPS",
            geofenceRadius = 40
        ),
        MultiSiteItem(
            id = "site-provincial",
            name = "Provincial Office",
            location = "Beaufort West, Western Cape",
            category = "Government Complex",
            officersRequired = 8,
            officersPresent = 8,
            patrolStatus = "Command Center Secure",
            compliance = 100,
            status = "operational",
            clientContactName = "Skombuzo Mashaya",
            clientPhone = "060 944 6828",
            emergencyPhone = "060 944 6828",
            sapsStation = "Beaufort West SAPS",
            geofenceRadius = 30
        )
    )

    val TIKEDI_OFFICERS = listOf(
        OfficerRecord(
            id = "off-admin",
            name = "Tshepo Maloa",
            empId = "DIR-0001",
            psiraNumber = "2490181",
            idNumber = "9305105694081",
            grade = "Grade A (Director / Ops In-Charge)",
            phone = "071 283 3558",
            currentSite = "Provincial Office",
            currentPost = "Command & Operations Center",
            isClockedIn = true,
            batteryLevel = 99,
            welfareStatus = "normal",
            firearmCompetency = true,
            firstAidCert = true,
            avatarInitial = "T",
            email = "tshepomaloa@gmail.com",
            clockInTime = "06:00",
            hoursToday = "8.50"
        ),
        OfficerRecord(
            id = "off-1",
            name = "Matyolo Nomahlubi",
            empId = "TKD-1001",
            psiraNumber = "2753127",
            grade = "Grade C",
            phone = "073 112 4099",
            currentSite = "Khwamagxaki",
            currentPost = "Main Access Gate",
            isClockedIn = true,
            batteryLevel = 94,
            avatarInitial = "M"
        ),
        OfficerRecord(
            id = "off-2",
            name = "Cebisa Ndlungwana",
            empId = "TKD-1002",
            psiraNumber = "2894102",
            grade = "Grade B",
            phone = "082 491 0021",
            currentSite = "Khwamagxaki",
            currentPost = "Logistics Shutter",
            isClockedIn = true,
            batteryLevel = 88,
            avatarInitial = "C"
        ),
        OfficerRecord(
            id = "off-3",
            name = "Sipho Zungu",
            empId = "TKD-1003",
            psiraNumber = "2910482",
            grade = "Grade A (Armed Tactical)",
            phone = "078 301 9284",
            currentSite = "Provincial Office",
            currentPost = "Armory & Patrol Unit",
            isClockedIn = true,
            batteryLevel = 96,
            firearmCompetency = true,
            avatarInitial = "S"
        )
    )

    val INITIAL_ROSTER_ROWS = listOf(
        EmployeeRosterRow(
            name = "Tshepo Maloa",
            empId = "DIR-0001",
            grade = "A",
            color = "#1FA6C9",
            shifts = listOf("D", "D", "D", "D", "D", "OFF", "OFF"),
            site = "Provincial Office",
            psiraNumber = "2490181",
            phone = "071 283 3558"
        ),
        EmployeeRosterRow(
            name = "Matyolo Nomahlubi",
            empId = "TKD-1001",
            grade = "C",
            color = "#3FC9E9",
            shifts = listOf("D", "D", "D", "D", "OFF", "N", "N"),
            site = "Khwamagxaki",
            psiraNumber = "2753127"
        ),
        EmployeeRosterRow(
            name = "Cebisa Ndlungwana",
            empId = "TKD-1002",
            grade = "B",
            color = "#10B981",
            shifts = listOf("N", "N", "OFF", "OFF", "D", "D", "D"),
            site = "Khwamagxaki",
            psiraNumber = "2894102"
        )
    )

    val SAMPLE_PATROL_ROUTES = listOf(
        PatrolRoute(
            id = "RT-KWM-01",
            siteId = "site-khwamagxaki",
            siteName = "Khwamagxaki",
            title = "Perimeter & Critical Boundary Loop",
            code = "RT-KWM-01",
            priority = "Critical",
            estDurationMinutes = 25,
            frequency = "Every 60 min",
            description = "Exterior perimeter fence line, main vehicle boom, pedestrian turnstiles and logistics loading bays.",
            checkpoints = listOf(
                PatrolCheckpoint(
                    id = 1,
                    code = "CP-01",
                    name = "Main Gate Access & Visitor Control",
                    x = 70f, y = 40f,
                    rangeMeters = 0,
                    scanned = true,
                    scannedAt = "06:15",
                    scannedBy = "Matyolo Nomahlubi",
                    tagUid = "SFK-RFID-8819",
                    tagType = "Sefeko RFID",
                    coordinates = "33.8642° S, 25.5684° E",
                    sopChecklist = listOf(
                        CheckpointSOP("sop-1-1", "Inspect vehicle boom lock & barrier arm", passed = true, critical = true),
                        CheckpointSOP("sop-1-2", "Verify physical visitor register counter", passed = true, critical = false)
                    )
                ),
                PatrolCheckpoint(
                    id = 2,
                    code = "CP-02",
                    name = "South Perimeter Fence & Wall Spikes",
                    x = 200f, y = 55f,
                    rangeMeters = 0,
                    scanned = false,
                    tagUid = "NFC-PER-2044",
                    tagType = "NFC Tag",
                    coordinates = "33.8655° S, 25.5699° E",
                    sopChecklist = listOf(
                        CheckpointSOP("sop-2-1", "Inspect razor wire tension & wall spikes", passed = false, critical = true),
                        CheckpointSOP("sop-2-2", "Check ground for burrowing or fence lift traces", passed = false, critical = true)
                    )
                )
            )
        )
    )
}
